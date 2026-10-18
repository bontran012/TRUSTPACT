// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/core/StakedBrokerRegistry.sol";
import "./mocks/MockERC20.sol";
import "./mocks/MockAToken.sol";
import "./mocks/MockAavePool.sol";

contract StakedBrokerTest is Test {
    StakedBrokerRegistry public registry;
    MockERC20 public usdc;
    MockAToken public aUsdc;
    MockAavePool public aavePool;

    address public admin = address(0x1);
    address public treasury = address(0x2);
    address public escrow = address(0x3);
    address public broker1 = address(0x10);
    address public broker2 = address(0x20);
    address public victim = address(0x30);
    address public unauthorizedUser = address(0x99);

    uint256 public constant INITIAL_BALANCE = 50_000 * 1e6; // 50,000 USDC
    uint256 public constant STAKE_AMOUNT = 5_000 * 1e6;      // 5,000 USDC

    function setUp() public {
        vm.startPrank(admin);

        usdc = new MockERC20("USD Coin", "USDC", 6);
        aUsdc = new MockAToken("Aave Avalanche USDC", "aUSDC", 6);
        aavePool = new MockAavePool(address(usdc), address(aUsdc));
        aUsdc.setPool(address(aavePool));

        registry = new StakedBrokerRegistry(
            address(usdc),
            address(aUsdc),
            address(aavePool),
            treasury
        );

        registry.setEscrowContract(escrow);
        vm.stopPrank();

        // Fund accounts
        usdc.mint(broker1, INITIAL_BALANCE);
        usdc.mint(broker2, INITIAL_BALANCE);

        vm.prank(broker1);
        usdc.approve(address(registry), type(uint256).max);

        vm.prank(broker2);
        usdc.approve(address(registry), type(uint256).max);
    }

    // =========================================================================
    // 1. STAKE DEPOSIT & AAVE V3 INTEGRATION
    // =========================================================================

    function test_StakeInsuranceSuccess() public {
        vm.prank(broker1);
        registry.stakeInsurance(STAKE_AMOUNT);

        IBrokerRegistry.BrokerProfile memory b = registry.getProfile(broker1);
        assertEq(b.principalDeposited, STAKE_AMOUNT);
        assertEq(b.stakedBalance, STAKE_AMOUNT);
        assertEq(b.activeHoldingAllocated, 0);
        assertTrue(b.isVerified);
        assertFalse(b.isBlacklisted);
        assertEq(registry.totalPrincipal(), STAKE_AMOUNT);
        assertEq(registry.getAvailableQuota(broker1), (STAKE_AMOUNT * 120) / 100);

        // Verify Aave Pool holds USDC and Registry holds aUSDC
        assertEq(usdc.balanceOf(address(aavePool)), STAKE_AMOUNT);
        assertEq(aUsdc.balanceOf(address(registry)), STAKE_AMOUNT);
        assertTrue(registry.isBrokerVerified(broker1));
    }

    function test_StakeZeroAmountReverts() public {
        vm.prank(broker1);
        vm.expectRevert("Stake amount must be > 0");
        registry.stakeInsurance(0);
    }

    // =========================================================================
    // 2. UNSTAKE WITHOUT YIELD
    // =========================================================================

    function test_UnstakeInsuranceWithoutYield() public {
        vm.prank(broker1);
        registry.stakeInsurance(STAKE_AMOUNT);

        uint256 brokerBalBefore = usdc.balanceOf(broker1);
        uint256 unstakeAmount = 2_000 * 1e6;

        vm.prank(broker1);
        registry.unstakeInsurance(unstakeAmount);

        assertEq(usdc.balanceOf(broker1) - brokerBalBefore, unstakeAmount);

        IBrokerRegistry.BrokerProfile memory b = registry.getProfile(broker1);
        assertEq(b.principalDeposited, STAKE_AMOUNT - unstakeAmount);
        assertEq(b.stakedBalance, STAKE_AMOUNT - unstakeAmount);
        assertEq(registry.totalPrincipal(), STAKE_AMOUNT - unstakeAmount);
        assertTrue(b.isVerified);
    }

    function test_FullUnstakeRevokesVerification() public {
        vm.prank(broker1);
        registry.stakeInsurance(STAKE_AMOUNT);

        vm.prank(broker1);
        registry.unstakeInsurance(STAKE_AMOUNT);

        IBrokerRegistry.BrokerProfile memory b = registry.getProfile(broker1);
        assertEq(b.stakedBalance, 0);
        assertFalse(b.isVerified);
        assertFalse(registry.isBrokerVerified(broker1));
    }

    // =========================================================================
    // 3. UNSTAKE WITH REAL YIELD (80% BROKER / 20% TREASURY SPLIT)
    // =========================================================================

    function test_UnstakeInsuranceWithYield8020Split() public {
        vm.prank(broker1);
        registry.stakeInsurance(STAKE_AMOUNT); // 5,000 USDC

        // Simulate 500 USDC total accrued interest from Aave lending
        uint256 simulatedYield = 500 * 1e6;
        aavePool.simulateYield(address(registry), simulatedYield);

        // Check accrued yield view
        assertEq(registry.getTotalAccruedYield(), simulatedYield);
        // Estimated yield for broker1 holding 100% of principal: 80% of 500 = 400 USDC
        assertEq(registry.getEstimatedYield(broker1), 400 * 1e6);

        uint256 brokerBalBefore = usdc.balanceOf(broker1);
        uint256 treasuryBalBefore = usdc.balanceOf(treasury);

        // Broker unstakes 2,500 USDC (50% of principal)
        uint256 withdrawPrincipal = 2_500 * 1e6;
        vm.prank(broker1);
        registry.unstakeInsurance(withdrawPrincipal);

        // Proportional yield share = (2,500 / 5,000) * 500 = 250 USDC
        // Broker 80% of 250 = 200 USDC
        // Treasury 20% of 250 = 50 USDC
        uint256 expectedBrokerYield = 200 * 1e6;
        uint256 expectedProtocolYield = 50 * 1e6;

        assertEq(usdc.balanceOf(broker1) - brokerBalBefore, withdrawPrincipal + expectedBrokerYield);
        assertEq(usdc.balanceOf(treasury) - treasuryBalBefore, expectedProtocolYield);

        // Remaining principal = 2,500 USDC
        IBrokerRegistry.BrokerProfile memory b = registry.getProfile(broker1);
        assertEq(b.principalDeposited, 2_500 * 1e6);
        assertEq(b.stakedBalance, 2_500 * 1e6);
    }

    function test_UnstakeFailsWhenCollateralIsLockedInActiveDeals() public {
        vm.prank(broker1);
        registry.stakeInsurance(STAKE_AMOUNT); // 5,000 USDC

        // Escrow locks 4,000 USDC quota for active deals
        vm.prank(escrow);
        assertTrue(registry.allocateQuota(broker1, 4_000 * 1e6));
        assertEq(registry.getAvailableQuota(broker1), (STAKE_AMOUNT * 120) / 100 - 4_000 * 1e6);

        // Attempting to unstake 2,000 USDC must revert
        vm.prank(broker1);
        vm.expectRevert("Stake is backing active deals");
        registry.unstakeInsurance(2_000 * 1e6);

        // Unstaking 1,000 USDC must succeed (remaining stake = 4,000, max quota = 4,800, available = 800)
        vm.prank(broker1);
        registry.unstakeInsurance(1_000 * 1e6);
        assertEq(registry.getAvailableQuota(broker1), (4_000 * 1e6 * 120) / 100 - 4_000 * 1e6);
    }

    // =========================================================================
    // 4. QUOTA ALLOCATION & RELEASE
    // =========================================================================

    function test_AllocateAndReleaseQuota() public {
        vm.prank(broker1);
        registry.stakeInsurance(STAKE_AMOUNT);

        // Escrow allocates 3,000 USDC (max quota = 6,000, so remaining = 3,000)
        vm.prank(escrow);
        bool allocated = registry.allocateQuota(broker1, 3_000 * 1e6);
        assertTrue(allocated);
        assertEq(registry.getAvailableQuota(broker1), 3_000 * 1e6);

        // Exceeding capacity returns false (3,000 + 3,001 > 6,000)
        vm.prank(escrow);
        bool overAllocated = registry.allocateQuota(broker1, 3_001 * 1e6);
        assertFalse(overAllocated);

        // Release 3,000 USDC
        vm.prank(escrow);
        registry.releaseQuota(broker1, 3_000 * 1e6);
        assertEq(registry.getAvailableQuota(broker1), (STAKE_AMOUNT * 120) / 100);

        // Record successful deal
        vm.prank(escrow);
        registry.recordSuccess(broker1);
        IBrokerRegistry.BrokerProfile memory b = registry.getProfile(broker1);
        assertEq(b.successfulDeals, 1);
        assertEq(b.totalDeals, 1);
    }

    // =========================================================================
    // 5. ECONOMIC SLASHING
    // =========================================================================

    function test_SlashBrokerCompensatesVictimAndBlacklists() public {
        vm.prank(broker1);
        registry.stakeInsurance(STAKE_AMOUNT); // 5,000 USDC

        vm.prank(escrow);
        registry.allocateQuota(broker1, 2_000 * 1e6);

        uint256 victimBalBefore = usdc.balanceOf(victim);
        uint256 compensation = 1_500 * 1e6;

        // Escrow triggers slashing
        vm.prank(escrow);
        registry.slashBroker(broker1, victim, compensation);

        // Victim receives exact compensation directly from Aave pool
        assertEq(usdc.balanceOf(victim) - victimBalBefore, compensation);

        IBrokerRegistry.BrokerProfile memory b = registry.getProfile(broker1);
        assertEq(b.stakedBalance, STAKE_AMOUNT - compensation); // 3,500 USDC
        assertEq(b.principalDeposited, STAKE_AMOUNT - compensation);
        assertEq(b.slashedCount, 1);
        assertFalse(b.isVerified);
        assertTrue(b.isBlacklisted);
        assertFalse(registry.isBrokerVerified(broker1));

        // Blacklisted broker cannot stake or unstake
        vm.prank(broker1);
        vm.expectRevert("Broker is blacklisted");
        registry.stakeInsurance(1_000 * 1e6);

        vm.prank(broker1);
        vm.expectRevert("Broker is blacklisted");
        registry.unstakeInsurance(500 * 1e6);

        // Blacklisted broker cannot receive new quota
        vm.prank(escrow);
        assertFalse(registry.allocateQuota(broker1, 500 * 1e6));
    }

    function test_SlashBrokerInsufficientStakeReverts() public {
        vm.prank(broker1);
        registry.stakeInsurance(STAKE_AMOUNT);

        vm.prank(escrow);
        vm.expectRevert("Insufficient stake to slash");
        registry.slashBroker(broker1, victim, STAKE_AMOUNT + 1);
    }

    // =========================================================================
    // 6. ACCESS CONTROL GUARDS
    // =========================================================================

    function test_AccessControlGuards() public {
        vm.startPrank(unauthorizedUser);

        vm.expectRevert("Only Admin allowed");
        registry.setEscrowContract(unauthorizedUser);

        vm.expectRevert("Only Admin allowed");
        registry.setTreasury(unauthorizedUser);

        vm.expectRevert("Only Admin allowed");
        registry.setAdmin(unauthorizedUser);

        vm.expectRevert("Only Escrow allowed");
        registry.allocateQuota(broker1, 100);

        vm.expectRevert("Only Escrow allowed");
        registry.releaseQuota(broker1, 100);

        vm.expectRevert("Only Escrow allowed");
        registry.recordSuccess(broker1);

        vm.expectRevert("Only Escrow allowed");
        registry.slashBroker(broker1, victim, 100);

        vm.stopPrank();
    }

    function test_AdminSetters() public {
        address newTreasury = address(0x88);
        address newAdmin = address(0x89);
        address newEscrow = address(0x90);

        vm.startPrank(admin);
        registry.setTreasury(newTreasury);
        assertEq(registry.treasury(), newTreasury);

        registry.setEscrowContract(newEscrow);
        assertEq(registry.escrowContract(), newEscrow);

        registry.setAdmin(newAdmin);
        assertEq(registry.admin(), newAdmin);
        vm.stopPrank();

        // Zero address reverts
        vm.startPrank(newAdmin);
        vm.expectRevert("Zero address");
        registry.setTreasury(address(0));

        vm.expectRevert("Zero address");
        registry.setEscrowContract(address(0));

        vm.expectRevert("Zero address");
        registry.setAdmin(address(0));
        vm.stopPrank();
    }
}
