// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/core/StakedBrokerRegistry.sol";
import "../src/core/UniversalEscrow.sol";
import "../src/reputation/TrustPassportSBT.sol";
import "./mocks/MockERC20.sol";
import "./mocks/MockAToken.sol";
import "./mocks/MockAavePool.sol";

/// @title SecurityRegressionTest — Verifies all 6 economic & security vulnerabilities remain neutralized
contract SecurityRegressionTest is Test {
    StakedBrokerRegistry registry;
    UniversalEscrow escrow;
    TrustPassportSBT sbt;
    MockERC20 usdc;
    MockAToken aUsdc;
    MockAavePool pool;

    address admin = address(0xA11CE);
    address treasury = address(0x7EA5);
    address broker = address(0xB0B);
    address seller = address(0x5E11);
    address buyer = address(0xB1BE);
    address attacker = address(0xBAD);

    function setUp() public {
        vm.startPrank(admin);
        usdc = new MockERC20("USDC", "USDC", 6);
        aUsdc = new MockAToken("aUSDC", "aUSDC", 6);
        pool = new MockAavePool(address(usdc), address(aUsdc));
        registry = new StakedBrokerRegistry(address(usdc), address(aUsdc), address(pool), treasury);
        escrow = new UniversalEscrow(address(usdc), treasury, address(registry));
        sbt = new TrustPassportSBT();
        registry.setEscrowContract(address(escrow));
        registry.setTrustPassportSBT(address(sbt));
        sbt.setAuthorizedUpdater(address(escrow), true);
        sbt.setAuthorizedUpdater(address(registry), true);
        escrow.setTrustPassportSBT(address(sbt));
        vm.stopPrank();

        address[5] memory users = [broker, seller, buyer, attacker, address(0xC0FFEE)];
        for (uint256 i; i < users.length; i++) {
            usdc.mint(users[i], 1_000_000e6);
            vm.startPrank(users[i]);
            usdc.approve(address(registry), type(uint256).max);
            usdc.approve(address(escrow), type(uint256).max);
            vm.stopPrank();
        }
    }

    function test_Regression_C1_BrokerCannotUnilaterallyReleaseWithoutBuyerApproval() public {
        vm.prank(broker);
        registry.stakeInsurance(1_000e6);

        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, 1_000e6, 1 days, 150);

        uint256 sellerBefore = usdc.balanceOf(seller);
        vm.prank(broker);
        escrow.brokerRelease(id);

        // Funds MUST remain locked until Buyer confirms
        assertEq(usdc.balanceOf(seller), sellerBefore, "Seller must not receive funds without buyer approval");
        assertEq(uint8(escrow.getEscrow(id).status), uint8(IUniversalEscrow.EscrowStatus.Active));

        // Broker cannot unstake while quota is backing active deal
        vm.prank(broker);
        vm.expectRevert("Stake is backing active deals");
        registry.unstakeInsurance(1_000e6);
    }

    function test_Regression_C2_AttackerCannotSiphonAccruedYield() public {
        vm.prank(broker);
        registry.stakeInsurance(10_000e6);
        pool.simulateYield(address(registry), 1_000e6); // 1,000 USDC accrued by honest broker

        vm.prank(attacker);
        registry.stakeInsurance(90_000e6);
        vm.warp(block.timestamp + 10 minutes + 1);

        uint256 before = usdc.balanceOf(attacker);
        vm.prank(attacker);
        registry.unstakeInsurance(90_000e6);
        uint256 attackerProfit = usdc.balanceOf(attacker) - before - 90_000e6;
        assertEq(attackerProfit, 0, "Attacker must earn 0 yield from prior accruals");

        // Honest broker receives their full 80% share of the 1,000 USDC yield (800 USDC)
        uint256 brokerBefore = usdc.balanceOf(broker);
        vm.prank(broker);
        registry.unstakeInsurance(10_000e6);
        assertEq(usdc.balanceOf(broker) - brokerBefore - 10_000e6, 800e6);
    }

    function test_Regression_H1_SlashCompensationCappedAtDealAmount() public {
        vm.prank(broker);
        registry.stakeInsurance(1_000e6);
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, 500e6, 1 days, 150);

        vm.prank(admin);
        vm.expectRevert("Compensation exceeds deal amount");
        escrow.adminSlashCorruptBroker(id, 1_000e6);
    }

    function test_Regression_H2_BlacklistedBrokerResidualStakeCanBeRecovered() public {
        vm.prank(broker);
        registry.stakeInsurance(1_000e6);
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, 100e6, 1 days, 150);

        vm.prank(admin);
        escrow.adminSlashCorruptBroker(id, 100e6);
        assertEq(registry.getProfile(broker).stakedBalance, 900e6);

        uint256 treasuryBefore = usdc.balanceOf(treasury);
        vm.prank(admin);
        registry.recoverBlacklistedResidualStake(broker, treasury);
        assertEq(usdc.balanceOf(treasury) - treasuryBefore, 900e6);
        assertEq(registry.getProfile(broker).stakedBalance, 0);
    }

    function test_Regression_H3_WashTradingBlockedWithout2StepConfirmation() public {
        address w1 = address(0xC0FFEE);
        vm.prank(attacker);
        registry.stakeInsurance(10_000e6);

        vm.prank(w1);
        uint256 id = escrow.createEscrow(payable(seller), attacker, 10_000e6, 1 hours, 1);

        vm.prank(w1);
        escrow.buyerConfirmDelivery(id);

        // Deal is NOT completed until Broker also confirms
        vm.prank(w1);
        vm.expectRevert("Only completed escrow");
        escrow.rateAndTip(id, 5, 0);
    }

    function test_Regression_H4_QuotaCappedAt100PercentOfStake() public {
        vm.prank(broker);
        registry.stakeInsurance(1_000e6);
        assertEq(registry.getAvailableQuota(broker), 1_000e6);

        vm.prank(buyer);
        vm.expectRevert("Broker insufficient quota");
        escrow.createEscrow(payable(seller), broker, 1_001e6, 1 days, 150);
    }
}
