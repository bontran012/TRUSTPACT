// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IBrokerRegistry.sol";
import "../reputation/TrustPassportSBT.sol";
interface IAaveV3Pool {
    function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode) external;
    function withdraw(address asset, uint256 amount, address to) external returns (uint256);
}
contract StakedBrokerRegistry is IBrokerRegistry, ReentrancyGuard {
    using SafeERC20 for IERC20;
    IERC20 public immutable usdc;
    IERC20 public immutable aUsdc;
    IAaveV3Pool public immutable aavePool;
    uint256 public constant DEPOSITOR_YIELD_BPS = 8000;
    uint256 public constant PROTOCOL_YIELD_BPS = 2000;
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public quotaMultiplierBps = 12000;
    mapping(address => BrokerProfile) public brokers;
    uint256 public totalPrincipal;
    address public escrowContract;
    address public admin;
    address public treasury;
    TrustPassportSBT public trustPassportSBT;
    event QuotaMultiplierUpdated(uint256 newMultiplierBps);
    event TrustPassportSBTUpdated(address indexed newSBT);
    modifier onlyEscrow() {
        require(msg.sender == escrowContract, "Only Escrow allowed");
        _;
    }
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only Admin allowed");
        _;
    }
    constructor(address _usdc, address _aUsdc, address _aavePool, address _treasury) {
        require(_usdc != address(0) && _aUsdc != address(0), "Zero address");
        require(_aavePool != address(0) && _treasury != address(0), "Zero address");
        usdc = IERC20(_usdc);
        aUsdc = IERC20(_aUsdc);
        aavePool = IAaveV3Pool(_aavePool);
        treasury = _treasury;
        admin = msg.sender;
    }
    function setEscrowContract(address _escrow) external onlyAdmin {
        require(_escrow != address(0), "Zero address");
        escrowContract = _escrow;
    }
    function setTreasury(address _treasury) external onlyAdmin {
        require(_treasury != address(0), "Zero address");
        treasury = _treasury;
    }
    function setAdmin(address _admin) external onlyAdmin {
        require(_admin != address(0), "Zero address");
        admin = _admin;
    }
    function setTrustPassportSBT(address _sbt) external onlyAdmin {
        require(_sbt != address(0), "Zero address");
        trustPassportSBT = TrustPassportSBT(_sbt);
        emit TrustPassportSBTUpdated(_sbt);
    }
    function setQuotaMultiplierBps(uint256 _multiplierBps) external onlyAdmin {
        require(_multiplierBps >= 10000 && _multiplierBps <= 20000, "Multiplier: 100% - 200%");
        quotaMultiplierBps = _multiplierBps;
        emit QuotaMultiplierUpdated(_multiplierBps);
    }
    function stakeInsurance(uint256 _amount) external override nonReentrant {
        require(_amount > 0, "Stake amount must be > 0");
        BrokerProfile storage b = brokers[msg.sender];
        require(!b.isBlacklisted, "Broker is blacklisted");
        usdc.safeTransferFrom(msg.sender, address(this), _amount);
        usdc.forceApprove(address(aavePool), _amount);
        aavePool.supply(address(usdc), _amount, address(this), 0);
        b.principalDeposited += _amount;
        b.stakedBalance += _amount;
        b.isVerified = true;
        b.lastActiveTimestamp = block.timestamp;
        totalPrincipal += _amount;
        if (address(trustPassportSBT) != address(0)) {
            trustPassportSBT.updateStakedAmount(msg.sender, b.stakedBalance);
        }
        emit BrokerStaked(msg.sender, _amount, b.stakedBalance);
    }
    function unstakeInsurance(uint256 _amount) external override nonReentrant {
        BrokerProfile storage b = brokers[msg.sender];
        require(!b.isBlacklisted, "Broker is blacklisted");
        require(_amount > 0 && b.stakedBalance >= _amount, "Invalid amount");
        uint256 newStakedBalance = b.stakedBalance - _amount;
        uint256 newMaxQuota = (newStakedBalance * quotaMultiplierBps) / BPS_DENOMINATOR;
        require(
            newStakedBalance >= b.activeHoldingAllocated && newMaxQuota >= b.activeHoldingAllocated,
            "Stake is backing active deals"
        );
        uint256 yieldForWithdraw = _calculateYield(_amount);
        if (b.principalDeposited >= _amount) {
            b.principalDeposited -= _amount;
        } else {
            b.principalDeposited = 0;
        }
        b.stakedBalance = newStakedBalance;
        if (totalPrincipal >= _amount) {
            totalPrincipal -= _amount;
        } else {
            totalPrincipal = 0;
        }
        if (b.stakedBalance == 0) {
            b.isVerified = false;
        }
        b.lastActiveTimestamp = block.timestamp;
        if (address(trustPassportSBT) != address(0)) {
            trustPassportSBT.updateStakedAmount(msg.sender, b.stakedBalance);
        }
        uint256 totalToWithdraw = _amount + yieldForWithdraw;
        uint256 actualWithdrawn = aavePool.withdraw(address(usdc), totalToWithdraw, address(this));
        uint256 actualYield = actualWithdrawn > _amount ? actualWithdrawn - _amount : 0;
        uint256 brokerYield = (actualYield * DEPOSITOR_YIELD_BPS) / BPS_DENOMINATOR;
        uint256 protocolYield = actualYield - brokerYield;
        emit BrokerUnstaked(msg.sender, _amount, brokerYield, protocolYield);
        usdc.safeTransfer(msg.sender, _amount + brokerYield);
        if (protocolYield > 0) {
            usdc.safeTransfer(treasury, protocolYield);
        }
    }
    function _calculateYield(uint256 _withdrawPrincipal) internal view returns (uint256) {
        if (totalPrincipal == 0) return 0;
        uint256 totalAaveBalance = aUsdc.balanceOf(address(this));
        if (totalAaveBalance <= totalPrincipal) return 0;
        uint256 totalYield = totalAaveBalance - totalPrincipal;
        return (totalYield * _withdrawPrincipal) / totalPrincipal;
    }
    function allocateQuota(address _broker, uint256 _dealAmount) external override onlyEscrow returns (bool) {
        BrokerProfile storage b = brokers[_broker];
        uint256 maxQuota = (b.stakedBalance * quotaMultiplierBps) / BPS_DENOMINATOR;
        if (!b.isVerified || b.isBlacklisted || maxQuota < b.activeHoldingAllocated + _dealAmount) {
            return false;
        }
        b.activeHoldingAllocated += _dealAmount;
        b.lastActiveTimestamp = block.timestamp;
        emit QuotaAllocated(_broker, _dealAmount);
        return true;
    }
    function releaseQuota(address _broker, uint256 _dealAmount) external override onlyEscrow {
        BrokerProfile storage b = brokers[_broker];
        if (b.activeHoldingAllocated >= _dealAmount) {
            b.activeHoldingAllocated -= _dealAmount;
        } else {
            b.activeHoldingAllocated = 0;
        }
        b.totalDeals++;
        b.lastActiveTimestamp = block.timestamp;
        emit QuotaReleased(_broker, _dealAmount);
    }
    function recordSuccess(address _broker) external override onlyEscrow {
        brokers[_broker].successfulDeals++;
        emit DealRecordedSuccess(_broker, brokers[_broker].successfulDeals);
    }
    function slashBroker(address _broker, address _victim, uint256 _compensation) external override nonReentrant onlyEscrow {
        require(_victim != address(0), "Zero address");
        BrokerProfile storage b = brokers[_broker];
        require(b.stakedBalance >= _compensation, "Insufficient stake to slash");
        b.stakedBalance -= _compensation;
        if (b.principalDeposited >= _compensation) {
            b.principalDeposited -= _compensation;
            totalPrincipal -= _compensation;
        } else {
            totalPrincipal -= b.principalDeposited;
            b.principalDeposited = 0;
        }
        if (b.activeHoldingAllocated >= _compensation) {
            b.activeHoldingAllocated -= _compensation;
        } else {
            b.activeHoldingAllocated = 0;
        }
        b.slashedCount++;
        b.isVerified = false;
        b.isBlacklisted = true;
        b.lastActiveTimestamp = block.timestamp;
        if (address(trustPassportSBT) != address(0)) {
            trustPassportSBT.updateStakedAmount(_broker, b.stakedBalance);
        }
        emit StakeSlashed(_broker, _victim, _compensation);
        emit BrokerBlacklisted(_broker);
        aavePool.withdraw(address(usdc), _compensation, address(this));
        usdc.safeTransfer(_victim, _compensation);
    }
    function getAvailableQuota(address _broker) external view override returns (uint256) {
        BrokerProfile storage b = brokers[_broker];
        uint256 maxQuota = (b.stakedBalance * quotaMultiplierBps) / BPS_DENOMINATOR;
        if (!b.isVerified || b.isBlacklisted || maxQuota <= b.activeHoldingAllocated) return 0;
        return maxQuota - b.activeHoldingAllocated;
    }
    function getEstimatedYield(address _broker) external view override returns (uint256) {
        BrokerProfile storage b = brokers[_broker];
        if (b.principalDeposited == 0 || totalPrincipal == 0) return 0;
        uint256 totalAaveBalance = aUsdc.balanceOf(address(this));
        if (totalAaveBalance <= totalPrincipal) return 0;
        uint256 totalYield = totalAaveBalance - totalPrincipal;
        return (totalYield * b.principalDeposited * DEPOSITOR_YIELD_BPS) / (totalPrincipal * BPS_DENOMINATOR);
    }
    function getTotalAccruedYield() external view override returns (uint256) {
        uint256 totalAaveBalance = aUsdc.balanceOf(address(this));
        if (totalAaveBalance <= totalPrincipal) return 0;
        return totalAaveBalance - totalPrincipal;
    }
    function getProfile(address _broker) external view override returns (BrokerProfile memory) {
        return brokers[_broker];
    }
    function isBrokerVerified(address _broker) external view override returns (bool) {
        return brokers[_broker].isVerified && !brokers[_broker].isBlacklisted;
    }
}
