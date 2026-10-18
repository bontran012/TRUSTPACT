// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IUniversalEscrow — Interface for UniversalEscrow 3-Party Escrow Vault
interface IUniversalEscrow {
    enum EscrowStatus {
        Active,     // Pending delivery / active in vault
        Completed,  // Completed & settled
        Cancelled   // Cancelled (mutual cancel or timeout auto-refund)
    }

    struct EscrowItem {
        uint256 id;
        address payable buyer;
        address payable seller;
        address broker;
        uint256 amount;         // Escrow deposit (USDC)
        uint256 brokerFeeBps;   // Broker fee basis points (e.g. 150 = 1.5%)
        uint256 duration;       // Delivery duration in seconds
        uint256 startTime;      // Creation timestamp
        EscrowStatus status;    // Current lifecycle status
    }

    event EscrowCreated(uint256 indexed id, address indexed buyer, address indexed seller, address broker, uint256 amount, uint256 brokerFeeBps);
    event BrokerReleased(uint256 indexed id);
    event BuyerConfirmedDelivery(uint256 indexed id);
    event RefundExecuted(uint256 indexed id, uint256 amount);
    event SettlementExecuted(uint256 indexed id, uint256 refundToBuyer, uint256 payoutToSeller);
    event ExpiredRefundClaimed(uint256 indexed id, uint256 amount);
    event EscrowCancelled(uint256 indexed id);
    event BrokerSlashedViaEscrow(uint256 indexed id, address indexed broker, uint256 compensation);
    event TreasuryUpdated(address indexed newTreasury);
    event BrokerRegistryUpdated(address indexed newBrokerRegistry);
    event AdminUpdated(address indexed newAdmin);
    event EscrowRated(uint256 indexed id, address indexed broker, address indexed buyer, uint8 stars, uint256 tipAmount);

    function createEscrow(
        address payable _seller,
        address _broker,
        uint256 _amount,
        uint256 _duration,
        uint256 _brokerFeeBps
    ) external returns (uint256);

    function brokerRelease(uint256 _id) external;
    function buyerConfirmDelivery(uint256 _id) external;
    function brokerRefundBuyer(uint256 _id) external;
    function brokerSettle(uint256 _id, uint256 _refundToBuyer, uint256 _payoutToSeller) external;
    function buyerClaimExpiredRefund(uint256 _id) external;
    function mutualCancelEscrow(uint256 _id) external;
    function adminSlashCorruptBroker(uint256 _id, uint256 _compensation) external;
    function rateAndTip(uint256 _id, uint8 _stars, uint256 _tipAmount) external;

    function getEscrow(uint256 _id) external view returns (EscrowItem memory);
    function isExpired(uint256 _id) external view returns (bool);
}
