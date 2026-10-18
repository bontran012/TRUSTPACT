// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IDelegation — Interface cho DelegationManager
interface IDelegation {
    struct ListingItem {
        uint256 id;
        address owner;
        string title;
        bytes32 metadataHash;
        address token;
        uint256 expectedPrice;
        address approvedBroker;
        bool isActive;
    }

    struct BrokerDelegation {
        address broker;
        uint256 commitmentBond;
        bool isApprovedByOwner;
        bool isActive;
    }

    function createListing(
        string calldata title,
        bytes32 metadataHash,
        address token,
        uint256 expectedPrice
    ) external returns (uint256);

    function requestDelegation(uint256 listingId, uint256 commitmentBond) external;
    function approveBroker(uint256 listingId, address broker) external;
    function cancelListing(uint256 listingId) external;
}
