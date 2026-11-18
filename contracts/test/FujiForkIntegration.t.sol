// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../src/core/StakedBrokerRegistry.sol";
import "../src/core/UniversalEscrow.sol";
import "../src/reputation/TrustPassportSBT.sol";
import "../src/scam-radar/ScamRegistryL1.sol";

contract FujiForkIntegrationTest is Test {
    address constant FUJI_USDC = 0x5425890298aed601595a70AB815c96711a31Bc65;
    address constant FUJI_A_USDC = 0x9CFcc1B289E59FBe1E769f020C77315DF8473760;
    address constant FUJI_AAVE_POOL = 0x8B9b2AF4afB389b4a70A474dfD4AdCD4a302bb40;

    function test_RealFujiAaveAndEscrowLifecycle() public {
        // Only run if forked against Fuji (43113), otherwise skip in offline unit runs
        if (block.chainid != 43113) return;

        address admin = makeAddr("admin");
        address treasury = makeAddr("treasury");
        address broker = makeAddr("broker");
        address buyer = makeAddr("buyer");
        address seller = makeAddr("seller");

        vm.startPrank(admin);
        StakedBrokerRegistry registry = new StakedBrokerRegistry(FUJI_USDC, FUJI_A_USDC, FUJI_AAVE_POOL, treasury);
        UniversalEscrow escrow = new UniversalEscrow(FUJI_USDC, treasury, address(registry));
        TrustPassportSBT sbt = new TrustPassportSBT();
        ScamRegistryL1 scamRegistry = new ScamRegistryL1();

        registry.setEscrowContract(address(escrow));
        registry.setTrustPassportSBT(address(sbt));
        escrow.setTrustPassportSBT(address(sbt));
        sbt.setAuthorizedUpdater(address(escrow), true);
        sbt.setAuthorizedUpdater(address(registry), true);
        sbt.mintPassport(broker);
        vm.stopPrank();

        // Deal real Circle Fuji USDC via vm.deal/stdStorage or transfer from whale
        deal(FUJI_USDC, broker, 10_000e6);
        deal(FUJI_USDC, buyer, 5_000e6);

        // 1. Broker stakes 5,000 USDC into real Aave V3 Fuji Pool
        vm.startPrank(broker);
        IERC20(FUJI_USDC).approve(address(registry), 5_000e6);
        registry.stakeInsurance(5_000e6);
        vm.stopPrank();

        assertEq(registry.getAvailableQuota(broker), 5_000e6);
        assertGe(IERC20(FUJI_A_USDC).balanceOf(address(registry)), 4_999e6);

        // 2. Buyer creates 1,000 USDC escrow
        vm.startPrank(buyer);
        IERC20(FUJI_USDC).approve(address(escrow), 1_000e6);
        uint256 id = escrow.createEscrow(payable(seller), broker, 1_000e6, 1 days, 150);
        vm.stopPrank();

        assertEq(registry.getAvailableQuota(broker), 4_000e6);

        // 3. 2-Step Confirmation: Broker tries to release alone -> does not disburse yet
        vm.prank(broker);
        escrow.brokerRelease(id);
        assertTrue(escrow.brokerApprovedRelease(id));
        assertEq(uint8(escrow.getEscrow(id).status), uint8(IUniversalEscrow.EscrowStatus.Active));

        // 4. Buyer confirms delivery -> completes 2-step release and disburses
        uint256 sellerBefore = IERC20(FUJI_USDC).balanceOf(seller);
        vm.prank(buyer);
        escrow.buyerConfirmDelivery(id);

        assertEq(uint8(escrow.getEscrow(id).status), uint8(IUniversalEscrow.EscrowStatus.Completed));
        assertEq(IERC20(FUJI_USDC).balanceOf(seller) - sellerBefore, 982e6);

        // 5. Broker unstakes from real Aave V3 Fuji Pool
        vm.prank(broker);
        registry.unstakeInsurance(5_000e6);
        assertGe(IERC20(FUJI_USDC).balanceOf(broker), 10_015e6);

        // 6. Scam report on ScamRegistryL1
        vm.prank(buyer);
        scamRegistry.reportScam("19038291823", "bank", "ipfs://QmProof1", "Fake bill scam");
        (uint256 count, ) = scamRegistry.checkScam("19038291823");
        assertEq(count, 1);
    }
}
