// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IBrokerRegistry — Interface for StakedBrokerRegistry with Aave V3 Real Yield
interface IBrokerRegistry {
    struct BrokerProfile {
        uint256 principalDeposited;     // Principal deposited (USDC)
        uint256 stakedBalance;          // Total stake balance (principal minus slashed amounts)
        uint256 activeHoldingAllocated; // Quota allocated to active deals
        uint256 successfulDeals;        // Count of successful deals completed
        uint256 totalDeals;             // Total deals handled
        uint256 slashedCount;           // Number of slashing occurrences
        bool isVerified;                // Verified badge
        bool isBlacklisted;             // Blacklisted status
        uint256 lastActiveTimestamp;
    }

    event BrokerStaked(address indexed broker, uint256 amount, uint256 totalStake);
    event BrokerUnstaked(address indexed broker, uint256 principalWithdrawn, uint256 brokerYield, uint256 protocolYield);
    event QuotaAllocated(address indexed broker, uint256 dealAmount);
    event QuotaReleased(address indexed broker, uint256 dealAmount);
    event DealRecordedSuccess(address indexed broker, uint256 totalSuccess);
    event StakeSlashed(address indexed broker, address indexed victim, uint256 compensation);
    event BrokerBlacklisted(address indexed broker);

    function stakeInsurance(uint256 _amount) external;
    function unstakeInsurance(uint256 _amount) external;
    function allocateQuota(address _broker, uint256 _dealAmount) external returns (bool);
    function releaseQuota(address _broker, uint256 _dealAmount) external;
    function recordSuccess(address _broker) external;
    function slashBroker(address _broker, address _victim, uint256 _compensation) external;

    function getAvailableQuota(address _broker) external view returns (uint256);
    function getEstimatedYield(address _broker) external view returns (uint256);
    function getTotalAccruedYield() external view returns (uint256);
    function getProfile(address _broker) external view returns (BrokerProfile memory);
    function isBrokerVerified(address _broker) external view returns (bool);
}
