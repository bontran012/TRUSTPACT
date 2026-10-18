// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../../src/phase2/DelegationManager.sol";
import "../../src/core/StakedBrokerRegistry.sol";
import "../mocks/MockUSDC.sol";

contract DelegationManagerTest is Test {
    DelegationManager public delegationManager;
    StakedBrokerRegistry public registry;
    MockUSDC public usdc;

    address public owner = address(0x1);
    address public seller = address(0x10);
    address public verifiedBroker = address(0x20);
    address public unverifiedBroker = address(0x30);

    uint256 public constant EXPECTED_PRICE = 1_000 * 1e6; // 1,000 USDC

    function setUp() public {
        vm.startPrank(owner);
        usdc = new MockUSDC();
        registry = new StakedBrokerRegistry(address(usdc));
        delegationManager = new DelegationManager(address(registry));
        vm.stopPrank();

        // Nạp cọc cho verifiedBroker
        usdc.mint(verifiedBroker, 5_000 * 1e6);
        vm.startPrank(verifiedBroker);
        usdc.approve(address(registry), 5_000 * 1e6);
        registry.stakeInsurance(5_000 * 1e6);
        vm.stopPrank();
    }

    function test_CreateListingAndApproveStakedBroker() public {
        vm.startPrank(seller);
        bytes32 metadataHash = keccak256("iphone-16-promax-gold");
        uint256 listingId = delegationManager.createListing("iPhone 16 Pro Max", metadataHash, address(usdc), EXPECTED_PRICE);
        assertEq(listingId, 1);
        vm.stopPrank();

        // Unverified broker thử request delegation -> Phải revert!
        vm.prank(unverifiedBroker);
        vm.expectRevert();
        delegationManager.requestDelegation(listingId, EXPECTED_PRICE);

        // Verified broker request delegation thành công
        vm.prank(verifiedBroker);
        delegationManager.requestDelegation(listingId, EXPECTED_PRICE);

        // Seller duyệt ủy quyền chính thức
        vm.prank(seller);
        delegationManager.approveBroker(listingId, verifiedBroker);

        (,,,,,, address approvedBroker, bool isActive) = delegationManager.listings(listingId);
        assertEq(approvedBroker, verifiedBroker);
        assertTrue(isActive);
    }
}
