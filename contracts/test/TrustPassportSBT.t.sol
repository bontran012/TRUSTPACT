// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/reputation/TrustPassportSBT.sol";

contract TrustPassportSBTTest is Test {
    TrustPassportSBT public sbt;

    address public admin = address(0x1);
    address public escrowContract = address(0x2);
    address public user1 = address(0x10);
    address public user2 = address(0x20);
    address public stranger = address(0x99);

    function setUp() public {
        vm.prank(admin);
        sbt = new TrustPassportSBT();

        vm.prank(admin);
        sbt.setAuthorizedUpdater(escrowContract, true);
    }

    // =========================================================================
    // 1. MINT PASSPORT
    // =========================================================================

    function test_MintPassportSuccess() public {
        vm.prank(admin);
        sbt.mintPassport(user1);

        assertEq(sbt.balanceOf(user1), 1);
        assertEq(sbt.ownerOf(1), user1);
    }

    function test_MintPassportDuplicateReverts() public {
        vm.prank(admin);
        sbt.mintPassport(user1);

        vm.prank(admin);
        vm.expectRevert("Already has passport");
        sbt.mintPassport(user1);
    }

    function test_MintPassportUnauthorizedReverts() public {
        vm.prank(stranger);
        vm.expectRevert("Unauthorized");
        sbt.mintPassport(user1);
    }

    // =========================================================================
    // 2. SOULBOUND: NON-TRANSFERABILITY
    // =========================================================================

    function test_TransferRevertsSoulbound() public {
        vm.prank(admin);
        sbt.mintPassport(user1);

        // User1 tries to transfer passport to User2
        vm.prank(user1);
        vm.expectRevert("Soulbound: non-transferable");
        sbt.transferFrom(user1, user2, 1);

        // User1 approves Stranger, Stranger tries to transfer
        vm.prank(user1);
        sbt.approve(stranger, 1);

        vm.prank(stranger);
        vm.expectRevert("Soulbound: non-transferable");
        sbt.transferFrom(user1, user2, 1);
    }

    // =========================================================================
    // 3. PROFILE UPDATES & SUCCESS RATE CALCULATION
    // =========================================================================

    function test_UpdateProfileAndSuccessRateCalculation() public {
        vm.prank(admin);
        sbt.mintPassport(user1);

        // Record 3 successful deals of 1,000 USDC each
        vm.startPrank(escrowContract);
        sbt.updateProfile(user1, true, 1_000 * 1e6);
        sbt.updateProfile(user1, true, 2_000 * 1e6);
        sbt.updateProfile(user1, true, 3_000 * 1e6);

        // Record 1 failed deal of 500 USDC
        sbt.updateProfile(user1, false, 500 * 1e6);

        // Record 1 slash
        sbt.recordSlash(user1);

        // Update staked bond
        sbt.updateStakedAmount(user1, 5_000 * 1e6);
        vm.stopPrank();

        TrustPassportSBT.TrustProfile memory profile = sbt.getProfile(user1);
        assertEq(profile.totalDeals, 4);
        assertEq(profile.successfulDeals, 3);
        assertEq(profile.totalVolumeUSDC, 6_500 * 1e6);
        assertEq(profile.stakedAmount, 5_000 * 1e6);
        assertEq(profile.slashedCount, 1);

        // Success rate: (3 * 10000) / 4 = 7500 (75.00%)
        assertEq(sbt.getSuccessRate(user1), 7500);
    }

    function test_SuccessRateZeroWhenNoDeals() public view {
        assertEq(sbt.getSuccessRate(user1), 0);
    }

    // =========================================================================
    // 4. ACCESS CONTROL FOR AUTHORIZED UPDATERS
    // =========================================================================

    function test_AuthorizedUpdaterPermissions() public {
        vm.prank(stranger);
        vm.expectRevert("Unauthorized");
        sbt.updateProfile(user1, true, 1_000);

        vm.prank(stranger);
        vm.expectRevert("Unauthorized");
        sbt.recordSlash(user1);

        vm.prank(stranger);
        vm.expectRevert("Unauthorized");
        sbt.updateStakedAmount(user1, 5_000);

        // Admin can toggle authorized updater
        vm.prank(admin);
        sbt.setAuthorizedUpdater(stranger, true);
        assertTrue(sbt.authorizedUpdaters(stranger));

        // Now stranger can update profile
        vm.prank(stranger);
        sbt.updateProfile(user1, true, 1_000);
        assertEq(sbt.getProfile(user1).successfulDeals, 1);
    }

    // =========================================================================
    // 5. RATING (1-5 STARS) & ON-CHAIN TIPPING
    // =========================================================================

    function test_RecordRatingAndTipSuccess() public {
        vm.prank(admin);
        sbt.mintPassport(user1);

        vm.startPrank(escrowContract);
        // Review 1: 5 stars, 10 USDC tip
        sbt.recordRatingAndTip(user1, 5, 10 * 1e6);
        // Review 2: 4 stars, 5 USDC tip
        sbt.recordRatingAndTip(user1, 4, 5 * 1e6);
        vm.stopPrank();

        (uint256 avgRatingX10, uint256 count, uint256 totalTips) = sbt.getBrokerRating(user1);
        assertEq(count, 2);
        assertEq(totalTips, 15 * 1e6);
        // (5 + 4) * 10 / 2 = 45 (representing 4.5 stars)
        assertEq(avgRatingX10, 45);

        TrustPassportSBT.TrustProfile memory profile = sbt.getProfile(user1);
        assertEq(profile.totalRatingStars, 9);
        assertEq(profile.ratingCount, 2);
        assertEq(profile.totalTipsReceived, 15 * 1e6);
    }

    function test_RecordRatingInvalidStarsReverts() public {
        vm.startPrank(escrowContract);
        vm.expectRevert("Invalid stars: 1 to 5");
        sbt.recordRatingAndTip(user1, 0, 0);

        vm.expectRevert("Invalid stars: 1 to 5");
        sbt.recordRatingAndTip(user1, 6, 0);
        vm.stopPrank();
    }

    function test_RecordRatingUnauthorizedReverts() public {
        vm.prank(stranger);
        vm.expectRevert("Unauthorized");
        sbt.recordRatingAndTip(user1, 5, 10 * 1e6);
    }
}
