// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/core/UniversalEscrow.sol";
import "../src/core/StakedBrokerRegistry.sol";
import "../src/reputation/TrustPassportSBT.sol";
import "./mocks/MockERC20.sol";
import "./mocks/MockAToken.sol";
import "./mocks/MockAavePool.sol";

contract UniversalEscrowTest is Test {
    UniversalEscrow public escrow;
    StakedBrokerRegistry public registry;
    TrustPassportSBT public sbt;
    MockERC20 public usdc;
    MockAToken public aUsdc;
    MockAavePool public aavePool;

    address public admin = address(0x1);
    address public treasury = address(0x2);
    address public buyer = address(0x10);
    address public seller = address(0x20);
    address public broker = address(0x30);
    address public stranger = address(0x99);

    uint256 public constant DEAL_AMOUNT = 1_000 * 1e6;  // 1,000 USDC
    uint256 public constant BROKER_STAKE = 5_000 * 1e6; // 5,000 USDC
    uint256 public constant TOTAL_BROKER_QUOTA = (BROKER_STAKE * 120) / 100; // 6,000 USDC
    uint256 public constant DEAL_DURATION = 3 days;
    uint256 public constant BROKER_FEE_BPS = 150;       // 1.5%

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

        escrow = new UniversalEscrow(
            address(usdc),
            treasury,
            address(registry)
        );

        sbt = new TrustPassportSBT();
        sbt.mintPassport(broker);
        sbt.setAuthorizedUpdater(address(escrow), true);

        escrow.setTrustPassportSBT(address(sbt));
        registry.setEscrowContract(address(escrow));
        vm.stopPrank();

        // Fund accounts
        usdc.mint(buyer, 10_000 * 1e6);
        usdc.mint(broker, 10_000 * 1e6);

        // Broker stakes 5,000 USDC into registry to gain quota
        vm.startPrank(broker);
        usdc.approve(address(registry), type(uint256).max);
        registry.stakeInsurance(BROKER_STAKE);
        vm.stopPrank();

        assertTrue(registry.isBrokerVerified(broker));
        assertEq(registry.getAvailableQuota(broker), (BROKER_STAKE * 120) / 100);

        // Buyer approves escrow contract
        vm.prank(buyer);
        usdc.approve(address(escrow), type(uint256).max);
    }

    // =========================================================================
    // 1. ESCROW CREATION
    // =========================================================================

    function test_CreateEscrowAllocatesQuota() public {
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        assertEq(id, 1);
        assertEq(registry.getAvailableQuota(broker), TOTAL_BROKER_QUOTA - DEAL_AMOUNT);

        IUniversalEscrow.EscrowItem memory item = escrow.getEscrow(id);
        assertEq(item.buyer, buyer);
        assertEq(item.seller, seller);
        assertEq(item.broker, broker);
        assertEq(item.amount, DEAL_AMOUNT);
        assertEq(item.brokerFeeBps, BROKER_FEE_BPS);
        assertEq(item.duration, DEAL_DURATION);
        assertEq(uint8(item.status), uint8(IUniversalEscrow.EscrowStatus.Active));
        assertFalse(escrow.isExpired(id));
    }

    function test_CreateEscrowDefaultFee() public {
        vm.prank(buyer);
        // Pass 0 broker fee -> should default to 150 bps (1.5%)
        uint256 id = escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, 0);

        IUniversalEscrow.EscrowItem memory item = escrow.getEscrow(id);
        assertEq(item.brokerFeeBps, 150);
    }

    function test_CreateEscrowValidations() public {
        vm.startPrank(buyer);

        // Amount == 0
        vm.expectRevert("Amount > 0");
        escrow.createEscrow(payable(seller), broker, 0, DEAL_DURATION, BROKER_FEE_BPS);

        // Zero address seller
        vm.expectRevert("Invalid address");
        escrow.createEscrow(payable(address(0)), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        // Zero address broker
        vm.expectRevert("Invalid address");
        escrow.createEscrow(payable(seller), address(0), DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        // Duration too short (< 1 hour)
        vm.expectRevert("Duration: 1h - 90d");
        escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, 30 minutes, BROKER_FEE_BPS);

        // Duration too long (> 90 days)
        vm.expectRevert("Duration: 1h - 90d");
        escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, 91 days, BROKER_FEE_BPS);

        // Fee too high (> 1000 bps)
        vm.expectRevert("Broker fee too high");
        escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, 1001);

        // Duplicate roles (buyer == seller)
        vm.expectRevert("Roles must differ");
        escrow.createEscrow(payable(buyer), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        // Duplicate roles (broker == seller)
        vm.expectRevert("Roles must differ");
        escrow.createEscrow(payable(broker), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        // Duplicate roles (buyer == broker)
        vm.expectRevert("Roles must differ");
        escrow.createEscrow(payable(seller), buyer, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        // Exceeding broker quota capacity (120% of stake)
        vm.expectRevert("Broker insufficient quota");
        escrow.createEscrow(payable(seller), broker, (BROKER_STAKE * 120) / 100 + 1, DEAL_DURATION, BROKER_FEE_BPS);

        vm.stopPrank();
    }

    // =========================================================================
    // 2. BROKER RELEASE (IMMEDIATE PAYOUT)
    // =========================================================================

    function test_BrokerReleaseImmediate() public {
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        uint256 sellerBalBefore = usdc.balanceOf(seller);
        uint256 brokerBalBefore = usdc.balanceOf(broker);
        uint256 treasuryBalBefore = usdc.balanceOf(treasury);

        // Broker verifies and releases immediately
        vm.prank(broker);
        escrow.brokerRelease(id);

        // Protocol fee: 0.3% of 1,000 = 3 USDC
        // Broker fee: 1.5% of 1,000 = 15 USDC
        // Net payout to seller: 982 USDC
        assertEq(usdc.balanceOf(treasury) - treasuryBalBefore, 3 * 1e6);
        assertEq(usdc.balanceOf(broker) - brokerBalBefore, 15 * 1e6);
        assertEq(usdc.balanceOf(seller) - sellerBalBefore, 982 * 1e6);

        // Quota released back to full stake (120% capacity)
        assertEq(registry.getAvailableQuota(broker), TOTAL_BROKER_QUOTA);

        // Broker recordSuccess incremented
        IBrokerRegistry.BrokerProfile memory b = registry.getProfile(broker);
        assertEq(b.successfulDeals, 1);

        IUniversalEscrow.EscrowItem memory item = escrow.getEscrow(id);
        assertEq(uint8(item.status), uint8(IUniversalEscrow.EscrowStatus.Completed));

        // Cannot release again
        vm.prank(broker);
        vm.expectRevert("Invalid status");
        escrow.brokerRelease(id);
    }

    function test_BrokerReleaseUnauthorizedReverts() public {
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        vm.prank(stranger);
        vm.expectRevert("Only broker");
        escrow.brokerRelease(id);

        vm.prank(seller);
        vm.expectRevert("Only broker");
        escrow.brokerRelease(id);
    }

    // =========================================================================
    // 3. BUYER CONFIRMS DELIVERY (DIRECT IMMEDIATE RELEASE)
    // =========================================================================

    function test_BuyerConfirmDeliveryImmediate() public {
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        uint256 sellerBalBefore = usdc.balanceOf(seller);
        uint256 brokerBalBefore = usdc.balanceOf(broker);
        uint256 treasuryBalBefore = usdc.balanceOf(treasury);

        // Buyer directly confirms delivery
        vm.prank(buyer);
        escrow.buyerConfirmDelivery(id);

        assertEq(usdc.balanceOf(treasury) - treasuryBalBefore, 3 * 1e6);
        assertEq(usdc.balanceOf(broker) - brokerBalBefore, 15 * 1e6);
        assertEq(usdc.balanceOf(seller) - sellerBalBefore, 982 * 1e6);

        assertEq(registry.getAvailableQuota(broker), TOTAL_BROKER_QUOTA);

        IUniversalEscrow.EscrowItem memory item = escrow.getEscrow(id);
        assertEq(uint8(item.status), uint8(IUniversalEscrow.EscrowStatus.Completed));
    }

    function test_BuyerConfirmDeliveryUnauthorizedReverts() public {
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        vm.prank(stranger);
        vm.expectRevert("Only buyer");
        escrow.buyerConfirmDelivery(id);

        vm.prank(broker);
        vm.expectRevert("Only buyer");
        escrow.buyerConfirmDelivery(id);
    }

    // =========================================================================
    // 4. BROKER REFUND BUYER (SELLER GHOSTS / FAILS DELIVERY)
    // =========================================================================

    function test_BrokerRefundBuyerWhenSellerFails() public {
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        uint256 buyerBalBefore = usdc.balanceOf(buyer);

        // Broker refunds 100% back to buyer
        vm.prank(broker);
        escrow.brokerRefundBuyer(id);

        assertEq(usdc.balanceOf(buyer) - buyerBalBefore, DEAL_AMOUNT);
        assertEq(registry.getAvailableQuota(broker), TOTAL_BROKER_QUOTA);

        IUniversalEscrow.EscrowItem memory item = escrow.getEscrow(id);
        assertEq(uint8(item.status), uint8(IUniversalEscrow.EscrowStatus.Completed));

        // Cannot refund or release again
        vm.prank(broker);
        vm.expectRevert("Invalid status");
        escrow.brokerRefundBuyer(id);
    }

    function test_BrokerRefundBuyerUnauthorizedReverts() public {
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        vm.prank(buyer);
        vm.expectRevert("Only broker");
        escrow.brokerRefundBuyer(id);

        vm.prank(seller);
        vm.expectRevert("Only broker");
        escrow.brokerRefundBuyer(id);
    }

    // =========================================================================
    // 5. BROKER SETTLEMENT (MEDIATED SPLIT)
    // =========================================================================

    function test_BrokerSettleSplit() public {
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        uint256 refundBuyer = 400 * 1e6;
        uint256 payoutSeller = 600 * 1e6;

        uint256 buyerBalBefore = usdc.balanceOf(buyer);
        uint256 sellerBalBefore = usdc.balanceOf(seller);

        // Broker executes mediated settlement
        vm.prank(broker);
        escrow.brokerSettle(id, refundBuyer, payoutSeller);

        assertEq(usdc.balanceOf(buyer) - buyerBalBefore, refundBuyer);
        assertEq(usdc.balanceOf(seller) - sellerBalBefore, payoutSeller);
        assertEq(registry.getAvailableQuota(broker), TOTAL_BROKER_QUOTA);

        IUniversalEscrow.EscrowItem memory item = escrow.getEscrow(id);
        assertEq(uint8(item.status), uint8(IUniversalEscrow.EscrowStatus.Completed));
    }

    function test_BrokerSettleTotalMismatchReverts() public {
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        vm.prank(broker);
        vm.expectRevert("Total must match");
        escrow.brokerSettle(id, 400 * 1e6, 500 * 1e6); // 900 != 1000
    }

    function test_BrokerSettleUnauthorizedReverts() public {
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        vm.prank(stranger);
        vm.expectRevert("Only broker");
        escrow.brokerSettle(id, 500 * 1e6, 500 * 1e6);
    }

    // =========================================================================
    // 6. AUTO-REFUND ON TIMEOUT (BUYER CLAIM EXPIRED REFUND)
    // =========================================================================

    function test_BuyerClaimExpiredRefundWhenDeadlinePassed() public {
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        // Before duration expires -> reverts
        vm.prank(buyer);
        vm.expectRevert("Not expired");
        escrow.buyerClaimExpiredRefund(id);

        // Advance time past 3 days duration
        vm.warp(block.timestamp + DEAL_DURATION + 1);
        assertTrue(escrow.isExpired(id));

        uint256 buyerBalBefore = usdc.balanceOf(buyer);

        // Buyer self-claims 100% refund without broker or seller
        vm.prank(buyer);
        escrow.buyerClaimExpiredRefund(id);

        assertEq(usdc.balanceOf(buyer) - buyerBalBefore, DEAL_AMOUNT);
        assertEq(registry.getAvailableQuota(broker), TOTAL_BROKER_QUOTA);

        IUniversalEscrow.EscrowItem memory item = escrow.getEscrow(id);
        assertEq(uint8(item.status), uint8(IUniversalEscrow.EscrowStatus.Cancelled));
    }

    function test_BuyerClaimExpiredRefundUnauthorizedReverts() public {
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        vm.warp(block.timestamp + DEAL_DURATION + 1);

        vm.prank(seller);
        vm.expectRevert("Only buyer");
        escrow.buyerClaimExpiredRefund(id);

        vm.prank(broker);
        vm.expectRevert("Only buyer");
        escrow.buyerClaimExpiredRefund(id);
    }

    // =========================================================================
    // 7. MUTUAL CANCELLATION
    // =========================================================================

    function test_MutualCancelEscrowRequiresBothSignatures() public {
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        uint256 buyerBalBefore = usdc.balanceOf(buyer);

        // Buyer approves cancel
        vm.prank(buyer);
        escrow.mutualCancelEscrow(id);
        assertTrue(escrow.buyerCancelApproved(id));
        assertFalse(escrow.sellerCancelApproved(id));
        // No refund yet
        assertEq(usdc.balanceOf(buyer), buyerBalBefore);

        // Stranger trying to approve reverts
        vm.prank(stranger);
        vm.expectRevert("Unauthorized");
        escrow.mutualCancelEscrow(id);

        // Seller approves cancel
        vm.prank(seller);
        escrow.mutualCancelEscrow(id);
        assertTrue(escrow.sellerCancelApproved(id));

        // 100% refunded to buyer
        assertEq(usdc.balanceOf(buyer) - buyerBalBefore, DEAL_AMOUNT);
        assertEq(registry.getAvailableQuota(broker), TOTAL_BROKER_QUOTA);

        IUniversalEscrow.EscrowItem memory item = escrow.getEscrow(id);
        assertEq(uint8(item.status), uint8(IUniversalEscrow.EscrowStatus.Cancelled));
    }

    // =========================================================================
    // 8. SLASHING CORRUPT BROKER VIA ESCROW
    // =========================================================================

    function test_AdminSlashCorruptBrokerRefundsBuyerAndSlashesCollateral() public {
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        uint256 buyerBalBefore = usdc.balanceOf(buyer);
        uint256 compensation = 500 * 1e6;

        // Treasury slashes corrupt broker
        vm.prank(treasury);
        escrow.adminSlashCorruptBroker(id, compensation);

        // Buyer receives 1,000 USDC original deposit + 500 USDC slash penalty = 1,500 USDC
        assertEq(usdc.balanceOf(buyer) - buyerBalBefore, DEAL_AMOUNT + compensation);

        // Broker profile reflects slashed status
        IBrokerRegistry.BrokerProfile memory b = registry.getProfile(broker);
        assertEq(b.stakedBalance, BROKER_STAKE - compensation);
        assertTrue(b.isBlacklisted);
        assertFalse(b.isVerified);

        // Cannot slash again
        vm.prank(treasury);
        vm.expectRevert("Already resolved");
        escrow.adminSlashCorruptBroker(id, compensation);
    }

    function test_AdminSlashCorruptBrokerUnauthorizedReverts() public {
        vm.prank(buyer);
        uint256 id = escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);

        vm.prank(stranger);
        vm.expectRevert("Only Treasury or Admin");
        escrow.adminSlashCorruptBroker(id, 100 * 1e6);
    }

    // =========================================================================
    // 9. ADMIN SETTERS & ACCESS CONTROLS
    // =========================================================================

    function test_AdminSetters() public {
        address newTreasury = address(0x88);
        address newRegistry = address(0x89);
        address newAdmin = address(0x90);

        vm.startPrank(admin);
        escrow.setTreasury(newTreasury);
        assertEq(escrow.treasury(), newTreasury);

        escrow.setBrokerRegistry(newRegistry);
        assertEq(address(escrow.brokerRegistry()), newRegistry);

        escrow.setAdmin(newAdmin);
        assertEq(escrow.admin(), newAdmin);
        vm.stopPrank();

        // Non-admin reverts
        vm.startPrank(stranger);
        vm.expectRevert("Only Admin");
        escrow.setTreasury(stranger);

        vm.expectRevert("Only Admin");
        escrow.setBrokerRegistry(stranger);

        vm.expectRevert("Only Admin");
        escrow.setAdmin(stranger);
        vm.stopPrank();

        // Zero address reverts
        vm.startPrank(newAdmin);
        vm.expectRevert("Zero address");
        escrow.setTreasury(address(0));

        vm.expectRevert("Zero address");
        escrow.setBrokerRegistry(address(0));

        vm.expectRevert("Zero address");
        escrow.setAdmin(address(0));
        vm.stopPrank();
    }

    // =========================================================================
    // 9. RATE & TIP TESTS (GRAB STYLE 5-STAR REVIEW)
    // =========================================================================

    function _createDefaultEscrow() internal returns (uint256) {
        vm.startPrank(buyer);
        usdc.approve(address(escrow), DEAL_AMOUNT);
        uint256 id = escrow.createEscrow(payable(seller), broker, DEAL_AMOUNT, DEAL_DURATION, BROKER_FEE_BPS);
        vm.stopPrank();
        return id;
    }

    function test_RateAndTipSuccess() public {
        uint256 id = _createDefaultEscrow();

        // Broker releases funds -> Completed
        vm.prank(broker);
        escrow.brokerRelease(id);

        uint256 brokerBalanceBefore = usdc.balanceOf(broker);
        uint256 tipAmount = 25 * 1e6; // 25 USDC tip

        // Buyer rates 5 stars and tips 25 USDC
        vm.startPrank(buyer);
        usdc.approve(address(escrow), tipAmount);
        escrow.rateAndTip(id, 5, tipAmount);
        vm.stopPrank();

        // Verification
        assertTrue(escrow.isRated(id));
        assertEq(usdc.balanceOf(broker), brokerBalanceBefore + tipAmount);

        // SBT profile check
        (uint256 avgRatingX10, uint256 count, uint256 totalTips) = sbt.getBrokerRating(broker);
        assertEq(avgRatingX10, 50); // 5.0 stars
        assertEq(count, 1);
        assertEq(totalTips, tipAmount);
    }

    function test_RateAndTipRevertsWhenNotCompleted() public {
        uint256 id = _createDefaultEscrow();

        vm.startPrank(buyer);
        usdc.approve(address(escrow), 10 * 1e6);
        vm.expectRevert("Only completed escrow");
        escrow.rateAndTip(id, 5, 10 * 1e6);
        vm.stopPrank();
    }

    function test_RateAndTipRevertsWhenNotBuyer() public {
        uint256 id = _createDefaultEscrow();

        vm.prank(broker);
        escrow.brokerRelease(id);

        vm.startPrank(stranger);
        vm.expectRevert("Only buyer");
        escrow.rateAndTip(id, 5, 0);
        vm.stopPrank();

        vm.startPrank(broker);
        vm.expectRevert("Only buyer");
        escrow.rateAndTip(id, 5, 0);
        vm.stopPrank();
    }

    function test_RateAndTipRevertsWhenAlreadyRated() public {
        uint256 id = _createDefaultEscrow();

        vm.prank(broker);
        escrow.brokerRelease(id);

        vm.startPrank(buyer);
        escrow.rateAndTip(id, 4, 0);

        vm.expectRevert("Already rated");
        escrow.rateAndTip(id, 5, 0);
        vm.stopPrank();
    }

    function test_RateAndTipRevertsInvalidStars() public {
        uint256 id = _createDefaultEscrow();

        vm.prank(broker);
        escrow.brokerRelease(id);

        vm.startPrank(buyer);
        vm.expectRevert("Stars: 1-5");
        escrow.rateAndTip(id, 0, 0);

        vm.expectRevert("Stars: 1-5");
        escrow.rateAndTip(id, 6, 0);
        vm.stopPrank();
    }
}
