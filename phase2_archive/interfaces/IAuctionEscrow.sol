// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IAuctionEscrow — Giao diện Đấu Thầu Cọc Minh Bạch Chuẩn Thực Chiến
interface IAuctionEscrow {
    enum AuctionStatus {
        Active,
        Settled,
        Cancelled
    }

    enum AuctionType {
        ForwardAuction, // Đấu giá thuận: Bán tài sản (Kênh, Domain, Acc, Vé) cho người trả giá cao nhất
        ReverseAuction  // Đấu thầu ngược: Chủ dự án cần thuê Dev/Job, các bên vào chào giá cạnh tranh
    }

    struct Bid {
        address bidder;
        uint256 offerPrice;
        string termsDescription;
        uint256 bidBondAmount;
        bool isClaimed;
    }

    struct AuctionSession {
        uint256 id;
        AuctionType auctionType;
        bytes32 itemHash;
        address payable seller;
        address broker;
        uint256 floorPrice;         // Giá khởi điểm (hoặc Trần ngân sách đối với thầu ngược)
        uint256 minBidIncrement;    // Mức tăng giá tối thiểu bắt buộc giữa các lượt bid
        uint256 requiredBidBond;    // Tiền cọc bảo chứng bắt buộc khi tham gia đấu giá
        uint256 endTime;            // Hạn chót cố định của phiên (hết giờ là chốt, không kéo dài)
        AuctionStatus status;
        address winningBidder;      // Người đang trả giá cao nhất (người thắng khi hết giờ)
        uint256 winningPrice;       // Mức giá cao nhất hiện tại
    }

    event AuctionCreated(
        uint256 indexed id,
        AuctionType auctionType,
        bytes32 itemHash,
        address indexed seller,
        uint256 floorPrice,
        uint256 minBidIncrement,
        uint256 endTime
    );
    event BidSubmitted(uint256 indexed auctionId, address indexed bidder, uint256 offerPrice, uint256 bidBond);
    event AuctionSettled(uint256 indexed auctionId, address indexed winner, uint256 winningPrice, uint256 escrowId);
    event BidRefundClaimed(uint256 indexed auctionId, address indexed bidder, uint256 refundAmount);
    event AuctionCancelled(uint256 indexed auctionId);

    function createAuction(
        AuctionType auctionType,
        bytes32 itemHash,
        address broker,
        uint256 floorPrice,
        uint256 minBidIncrement,
        uint256 requiredBidBond,
        uint256 durationSeconds
    ) external returns (uint256);

    function submitBid(uint256 auctionId, uint256 offerPrice, string calldata terms) external;
    function settleAuction(uint256 auctionId) external;
    function claimRefund(uint256 auctionId) external;
    function batchClaimRefunds(uint256[] calldata auctionIds) external;
    function cancelExpiredUnsettledAuction(uint256 auctionId) external;
    function getAuction(uint256 auctionId) external view returns (AuctionSession memory);
}
