// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "../interfaces/IAuctionEscrow.sol";
import "../interfaces/IUniversalEscrow.sol";

/// @title AuctionEscrow — Hợp Đồng Đấu Thầu Cọc Minh Bạch Thực Chiến
/// @notice Phiên đấu giá có thời hạn cố định, bước giá tối thiểu rõ ràng, cọc bảo chứng an toàn,
///         và tự động chuyển cọc người thắng sang Phòng Giao Dịch 3 Bên (UniversalEscrow).
/// @author TrustPact Protocol
contract AuctionEscrow is IAuctionEscrow, ReentrancyGuard, Ownable2Step {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public treasury;
    address public universalEscrowContract;
    uint256 public auctionCounter;

    uint256 public constant AUCTION_FEE_BPS = 150; // 1.50% phí đấu giá thành công
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant SAFETY_ABANDON_WINDOW = 7 days; // Phao cứu sinh sau 7 ngày nếu không ai chốt

    mapping(uint256 => AuctionSession) internal _auctions;
    mapping(uint256 => Bid[]) internal _auctionBids;
    mapping(uint256 => mapping(address => uint256)) public userBidBondDeposited;
    mapping(uint256 => mapping(address => bool)) public hasClaimedRefund;

    constructor(
        address _usdc,
        address _treasury,
        address _universalEscrow,
        address _owner
    ) Ownable(_owner) {
        require(_usdc != address(0) && _treasury != address(0), "Zero address");
        usdc = IERC20(_usdc);
        treasury = _treasury;
        universalEscrowContract = _universalEscrow;
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Zero address");
        treasury = _treasury;
    }

    function setUniversalEscrow(address _escrow) external onlyOwner {
        universalEscrowContract = _escrow;
    }

    /// @notice Mở phiên đấu giá mới với Hạn chót cố định và Mức tăng giá tối thiểu rõ ràng
    function createAuction(
        AuctionType auctionType,
        bytes32 itemHash,
        address broker,
        uint256 floorPrice,
        uint256 minBidIncrement,
        uint256 requiredBidBond,
        uint256 durationSeconds
    ) external override returns (uint256) {
        require(floorPrice > 0, "Floor price must be > 0");
        require(minBidIncrement > 0, "Min increment must be > 0");
        require(durationSeconds >= 1 hours && durationSeconds <= 7 days, "Duration: 1h - 7d");

        auctionCounter++;
        _auctions[auctionCounter] = AuctionSession({
            id: auctionCounter,
            auctionType: auctionType,
            itemHash: itemHash,
            seller: payable(msg.sender),
            broker: broker,
            floorPrice: floorPrice,
            minBidIncrement: minBidIncrement,
            requiredBidBond: requiredBidBond,
            endTime: block.timestamp + durationSeconds,
            status: AuctionStatus.Active,
            winningBidder: address(0),
            winningPrice: 0
        });

        emit AuctionCreated(
            auctionCounter,
            auctionType,
            itemHash,
            msg.sender,
            floorPrice,
            minBidIncrement,
            block.timestamp + durationSeconds
        );
        return auctionCounter;
    }

    /// @notice Tham gia trả giá: Trả giá cao hơn mức tối thiểu & nạp cọc bảo chứng đấu giá
    function submitBid(
        uint256 auctionId,
        uint256 offerPrice,
        string calldata terms
    ) external override nonReentrant {
        AuctionSession storage a = _auctions[auctionId];
        require(a.status == AuctionStatus.Active, "Auction not active");
        require(block.timestamp < a.endTime, "Auction ended - time is up!");

        // Quy tắc kiểm tra bước giá tối thiểu:
        if (a.winningPrice == 0) {
            require(offerPrice >= a.floorPrice, "Offer below floor price");
        } else {
            // Lượt sau bắt buộc phải cao hơn người trước ít nhất minBidIncrement!
            require(
                offerPrice >= a.winningPrice + a.minBidIncrement,
                "Offer must exceed current high by minBidIncrement"
            );
        }

        // Nạp cọc bảo chứng đấu giá (mỗi người chỉ nạp 1 lần cho mỗi phiên)
        if (a.requiredBidBond > 0 && userBidBondDeposited[auctionId][msg.sender] == 0) {
            userBidBondDeposited[auctionId][msg.sender] = a.requiredBidBond;
            usdc.safeTransferFrom(msg.sender, address(this), a.requiredBidBond);
        }

        // Cập nhật người dẫn đầu hiện tại (khi hết giờ người này sẽ thắng luôn)
        a.winningBidder = msg.sender;
        a.winningPrice = offerPrice;

        _auctionBids[auctionId].push(Bid({
            bidder: msg.sender,
            offerPrice: offerPrice,
            termsDescription: terms,
            bidBondAmount: a.requiredBidBond,
            isClaimed: false
        }));

        emit BidSubmitted(auctionId, msg.sender, offerPrice, a.requiredBidBond);
    }

    /// @notice Chốt phiên đấu giá khi hết hạn: Người trả cao nhất THẮNG LUÔN, cọc chuyển thẳng sang Escrow 3 bên
    function settleAuction(uint256 auctionId) external override nonReentrant {
        AuctionSession storage a = _auctions[auctionId];
        require(a.status == AuctionStatus.Active, "Already settled or closed");
        require(block.timestamp >= a.endTime, "Auction still ongoing");
        require(a.winningBidder != address(0), "No bids received");

        a.status = AuctionStatus.Settled;
        uint256 escrowId = 0;

        uint256 winningBond = userBidBondDeposited[auctionId][a.winningBidder];
        uint256 platformFee = (winningBond * AUCTION_FEE_BPS) / BPS_DENOMINATOR;
        uint256 netBond = winningBond - platformFee;

        if (platformFee > 0) {
            usdc.safeTransfer(treasury, platformFee);
        }

        // Tự động chuyển thẳng tiền cọc của Người Thắng vào Két Sắt 3 Bên (UniversalEscrow)
        if (netBond > 0 && universalEscrowContract != address(0)) {
            usdc.forceApprove(universalEscrowContract, netBond);
            escrowId = IUniversalEscrow(universalEscrowContract).createEscrowForBuyer(
                a.winningBidder,
                a.seller,
                a.broker,
                address(usdc),
                netBond,
                30 days
            );
        }

        emit AuctionSettled(auctionId, a.winningBidder, a.winningPrice, escrowId);
    }

    /// @notice Người thua cuộc rút lại 100% tiền cọc bảo chứng của mình an toàn ngay lập tức
    function claimRefund(uint256 auctionId) public override nonReentrant {
        AuctionSession storage a = _auctions[auctionId];
        require(a.status != AuctionStatus.Active, "Auction still active");
        require(msg.sender != a.winningBidder || a.status == AuctionStatus.Cancelled, "Winner bond was bridged to escrow");
        require(!hasClaimedRefund[auctionId][msg.sender], "Already claimed");

        uint256 deposited = userBidBondDeposited[auctionId][msg.sender];
        require(deposited > 0, "No bond to refund");

        hasClaimedRefund[auctionId][msg.sender] = true;
        usdc.safeTransfer(msg.sender, deposited);

        emit BidRefundClaimed(auctionId, msg.sender, deposited);
    }

    /// @notice Rút gộp tiền cọc từ nhiều phiên đấu giá trong 1 giao dịch
    function batchClaimRefunds(uint256[] calldata auctionIds) external override {
        for (uint256 i = 0; i < auctionIds.length; i++) {
            if (!hasClaimedRefund[auctionIds[i]][msg.sender] && userBidBondDeposited[auctionIds[i]][msg.sender] > 0) {
                AuctionSession storage a = _auctions[auctionIds[i]];
                if (a.status != AuctionStatus.Active && (msg.sender != a.winningBidder || a.status == AuctionStatus.Cancelled)) {
                    claimRefund(auctionIds[i]);
                }
            }
        }
    }

    /// @notice Phao cứu sinh: Nếu sau 7 ngày kết thúc mà chưa ai chốt phiên, bất kỳ ai cũng có thể hủy để rút cọc
    function cancelExpiredUnsettledAuction(uint256 auctionId) external override nonReentrant {
        AuctionSession storage a = _auctions[auctionId];
        require(a.status == AuctionStatus.Active, "Not active");
        require(block.timestamp >= a.endTime + SAFETY_ABANDON_WINDOW, "Safety window not reached");

        a.status = AuctionStatus.Cancelled;
        emit AuctionCancelled(auctionId);
    }

    function getAuction(uint256 auctionId) external view override returns (AuctionSession memory) {
        return _auctions[auctionId];
    }
}
