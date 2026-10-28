// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IUniversalEscrow.sol";
import "../interfaces/IBrokerRegistry.sol";
import "../reputation/TrustPassportSBT.sol";
contract UniversalEscrow is IUniversalEscrow, ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 public immutable usdc;
    uint256 public constant PROTOCOL_FEE_BPS = 30;
    uint256 public constant DEFAULT_BROKER_FEE_BPS = 150;
    uint256 public constant MAX_BROKER_FEE_BPS = 1000;
    address public treasury;
    address public admin;
    IBrokerRegistry public brokerRegistry;
    TrustPassportSBT public trustPassportSBT;
    mapping(uint256 => EscrowItem) public escrows;
    mapping(uint256 => bool) public buyerCancelApproved;
    mapping(uint256 => bool) public sellerCancelApproved;
    mapping(uint256 => bool) public isRated;
    uint256 public counter;
    event TrustPassportSBTUpdated(address indexed newSBT);
    modifier onlyTreasuryOrAdmin() {
        require(msg.sender == treasury || msg.sender == admin, "Only Treasury or Admin");
        _;
    }
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only Admin");
        _;
    }
    constructor(address _usdc, address _treasury, address _brokerRegistry) {
        require(_usdc != address(0) && _treasury != address(0) && _brokerRegistry != address(0), "Zero address");
        usdc = IERC20(_usdc);
        treasury = _treasury;
        brokerRegistry = IBrokerRegistry(_brokerRegistry);
        admin = msg.sender;
    }
    function setTreasury(address _treasury) external onlyAdmin {
        require(_treasury != address(0), "Zero address");
        treasury = _treasury;
        emit TreasuryUpdated(_treasury);
    }
    function setBrokerRegistry(address _brokerRegistry) external onlyAdmin {
        require(_brokerRegistry != address(0), "Zero address");
        brokerRegistry = IBrokerRegistry(_brokerRegistry);
        emit BrokerRegistryUpdated(_brokerRegistry);
    }
    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0), "Zero address");
        admin = _admin;
        emit AdminUpdated(_admin);
    }
    function setTrustPassportSBT(address _sbt) external onlyAdmin {
        require(_sbt != address(0), "Zero address");
        trustPassportSBT = TrustPassportSBT(_sbt);
        emit TrustPassportSBTUpdated(_sbt);
    }
    function createEscrow(
        address payable _seller,
        address _broker,
        uint256 _amount,
        uint256 _duration,
        uint256 _brokerFeeBps
    ) external override nonReentrant returns (uint256) {
        require(_amount > 0, "Amount > 0");
        require(_seller != address(0) && _broker != address(0), "Invalid address");
        require(_seller != _broker && msg.sender != _broker && msg.sender != _seller, "Roles must differ");
        require(_duration >= 1 hours && _duration <= 90 days, "Duration: 1h - 90d");
        require(_brokerFeeBps <= MAX_BROKER_FEE_BPS, "Broker fee too high");
        if (_brokerFeeBps == 0) {
            _brokerFeeBps = DEFAULT_BROKER_FEE_BPS;
        }
        bool quotaOk = brokerRegistry.allocateQuota(_broker, _amount);
        require(quotaOk, "Broker insufficient quota");
        counter++;
        escrows[counter] = EscrowItem({
            id: counter,
            buyer: payable(msg.sender),
            seller: _seller,
            broker: _broker,
            amount: _amount,
            brokerFeeBps: _brokerFeeBps,
            duration: _duration,
            startTime: block.timestamp,
            status: EscrowStatus.Active
        });
        emit EscrowCreated(counter, msg.sender, _seller, _broker, _amount, _brokerFeeBps);
        usdc.safeTransferFrom(msg.sender, address(this), _amount);
        return counter;
    }
    function brokerRelease(uint256 _id) external override nonReentrant {
        EscrowItem storage item = escrows[_id];
        require(msg.sender == item.broker || msg.sender == admin, "Only broker or admin");
        require(item.status == EscrowStatus.Active, "Invalid status");
        emit BrokerReleased(_id);
        _executeRelease(item);
    }
    function buyerConfirmDelivery(uint256 _id) external override nonReentrant {
        EscrowItem storage item = escrows[_id];
        require(msg.sender == item.buyer, "Only buyer");
        require(item.status == EscrowStatus.Active, "Invalid status");
        emit BuyerConfirmedDelivery(_id);
        _executeRelease(item);
    }
    function brokerRefundBuyer(uint256 _id) external override nonReentrant {
        EscrowItem storage item = escrows[_id];
        require(msg.sender == item.broker || msg.sender == admin, "Only broker or admin");
        require(item.status == EscrowStatus.Active, "Invalid status");
        item.status = EscrowStatus.Completed;
        emit RefundExecuted(_id, item.amount);
        brokerRegistry.releaseQuota(item.broker, item.amount);
        usdc.safeTransfer(item.buyer, item.amount);
    }
    function brokerSettle(uint256 _id, uint256 _refundToBuyer, uint256 _payoutToSeller) external override nonReentrant {
        EscrowItem storage item = escrows[_id];
        require(msg.sender == item.broker || msg.sender == admin, "Only broker or admin");
        require(item.status == EscrowStatus.Active, "Invalid status");
        require(_refundToBuyer + _payoutToSeller == item.amount, "Total must match");
        item.status = EscrowStatus.Completed;
        emit SettlementExecuted(_id, _refundToBuyer, _payoutToSeller);
        brokerRegistry.releaseQuota(item.broker, item.amount);
        if (_refundToBuyer > 0) usdc.safeTransfer(item.buyer, _refundToBuyer);
        if (_payoutToSeller > 0) usdc.safeTransfer(item.seller, _payoutToSeller);
    }
    function buyerClaimExpiredRefund(uint256 _id) external override nonReentrant {
        EscrowItem storage item = escrows[_id];
        require(msg.sender == item.buyer, "Only buyer");
        require(item.status == EscrowStatus.Active, "Invalid status");
        require(block.timestamp >= item.startTime + item.duration, "Not expired");
        item.status = EscrowStatus.Cancelled;
        emit ExpiredRefundClaimed(_id, item.amount);
        brokerRegistry.releaseQuota(item.broker, item.amount);
        usdc.safeTransfer(item.buyer, item.amount);
    }
    function mutualCancelEscrow(uint256 _id) external override nonReentrant {
        EscrowItem storage item = escrows[_id];
        require(item.status == EscrowStatus.Active, "Invalid status");
        if (msg.sender == item.buyer) buyerCancelApproved[_id] = true;
        else if (msg.sender == item.seller) sellerCancelApproved[_id] = true;
        else revert("Unauthorized");
        if (buyerCancelApproved[_id] && sellerCancelApproved[_id]) {
            item.status = EscrowStatus.Cancelled;
            emit EscrowCancelled(_id);
            brokerRegistry.releaseQuota(item.broker, item.amount);
            usdc.safeTransfer(item.buyer, item.amount);
        }
    }
    function adminSlashCorruptBroker(uint256 _id, uint256 _compensation) external override nonReentrant onlyTreasuryOrAdmin {
        EscrowItem storage item = escrows[_id];
        require(item.status == EscrowStatus.Active, "Already resolved");
        item.status = EscrowStatus.Completed;
        emit BrokerSlashedViaEscrow(_id, item.broker, _compensation);
        brokerRegistry.releaseQuota(item.broker, item.amount);
        usdc.safeTransfer(item.buyer, item.amount);
        brokerRegistry.slashBroker(item.broker, item.buyer, _compensation);
        if (address(trustPassportSBT) != address(0)) {
            trustPassportSBT.recordSlash(item.broker);
        }
    }
    function rateAndTip(uint256 _id, uint8 _stars, uint256 _tipAmount) external override nonReentrant {
        EscrowItem storage item = escrows[_id];
        require(item.status == EscrowStatus.Completed, "Only completed escrow");
        require(msg.sender == item.buyer, "Only buyer");
        require(!isRated[_id], "Already rated");
        require(_stars >= 1 && _stars <= 5, "Stars: 1-5");
        isRated[_id] = true;
        if (_tipAmount > 0) {
            usdc.safeTransferFrom(msg.sender, item.broker, _tipAmount);
        }
        if (address(trustPassportSBT) != address(0)) {
            trustPassportSBT.recordRatingAndTip(item.broker, _stars, _tipAmount);
        }
        emit EscrowRated(_id, item.broker, msg.sender, _stars, _tipAmount);
    }
    function _executeRelease(EscrowItem storage item) internal {
        item.status = EscrowStatus.Completed;
        uint256 platformFee = (item.amount * PROTOCOL_FEE_BPS) / 10000;
        uint256 brokerFee = (item.amount * item.brokerFeeBps) / 10000;
        uint256 netPayout = item.amount - platformFee - brokerFee;
        brokerRegistry.releaseQuota(item.broker, item.amount);
        brokerRegistry.recordSuccess(item.broker);
        if (address(trustPassportSBT) != address(0)) {
            trustPassportSBT.updateProfile(item.broker, true, item.amount);
        }
        if (platformFee > 0) usdc.safeTransfer(treasury, platformFee);
        if (brokerFee > 0) usdc.safeTransfer(item.broker, brokerFee);
        if (netPayout > 0) usdc.safeTransfer(item.seller, netPayout);
    }
    function getEscrow(uint256 _id) external view override returns (EscrowItem memory) {
        return escrows[_id];
    }
    function isExpired(uint256 _id) external view override returns (bool) {
        EscrowItem storage item = escrows[_id];
        return block.timestamp >= item.startTime + item.duration;
    }
}
