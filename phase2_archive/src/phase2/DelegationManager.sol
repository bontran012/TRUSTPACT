// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "../interfaces/IDelegation.sol";
import "../interfaces/IBrokerRegistry.sol";

/// @title DelegationManager
/// @notice Handles OTC/Escrow item listings and Broker Delegation authorizations with verified stake checks.
/// @author TrustPact Security Team (Avalanche UniHack 2026)
contract DelegationManager is IDelegation, ReentrancyGuard {
    IBrokerRegistry public immutable brokerRegistry;
    uint256 public listingCounter;

    mapping(uint256 => ListingItem) public listings;
    mapping(uint256 => mapping(address => BrokerDelegation)) public delegations;

    event ListingCreated(uint256 indexed id, address indexed owner, string title, uint256 expectedPrice);
    event BrokerRequested(uint256 indexed listingId, address indexed broker, uint256 commitmentBond);
    event BrokerApproved(uint256 indexed listingId, address indexed broker);
    event ListingCancelled(uint256 indexed listingId);

    error ZeroAddress();
    error ZeroPrice();
    error ListingNotActive();
    error NotListingOwner();
    error OwnerCannotBeBroker();
    error BrokerNotVerifiedInRegistry();
    error InsufficientBrokerCapacity();
    error NoActiveRequest();
    error BrokerAlreadyApproved();

    constructor(address _brokerRegistry) {
        if (_brokerRegistry == address(0)) revert ZeroAddress();
        brokerRegistry = IBrokerRegistry(_brokerRegistry);
    }

    /// @notice Seller registers a new listing
    function createListing(
        string calldata _title,
        bytes32 _metadataHash,
        address _token,
        uint256 _expectedPrice
    ) external override returns (uint256) {
        if (_expectedPrice == 0) revert ZeroPrice();

        listingCounter++;
        listings[listingCounter] = ListingItem({
            id: listingCounter,
            owner: msg.sender,
            title: _title,
            metadataHash: _metadataHash,
            token: _token,
            expectedPrice: _expectedPrice,
            approvedBroker: address(0),
            isActive: true
        });

        emit ListingCreated(listingCounter, msg.sender, _title, _expectedPrice);
        return listingCounter;
    }

    /// @notice Staked Broker requests to intermediate a listing, validated against on-chain stake registry
    function requestDelegation(uint256 _listingId, uint256 _commitmentBond) external override {
        ListingItem storage item = listings[_listingId];
        if (!item.isActive) revert ListingNotActive();
        if (item.owner == msg.sender) revert OwnerCannotBeBroker();
        if (!brokerRegistry.isBrokerVerified(msg.sender)) revert BrokerNotVerifiedInRegistry();

        // Ensure broker has unallocated capacity at least equal to commitment bond
        uint256 availableQuota = brokerRegistry.getAvailableQuota(msg.sender);
        if (availableQuota < _commitmentBond) revert InsufficientBrokerCapacity();

        delegations[_listingId][msg.sender] = BrokerDelegation({
            broker: msg.sender,
            commitmentBond: _commitmentBond,
            isApprovedByOwner: false,
            isActive: true
        });

        emit BrokerRequested(_listingId, msg.sender, _commitmentBond);
    }

    /// @notice Seller officially delegates and approves one specific staked broker
    function approveBroker(uint256 _listingId, address _broker) external override {
        ListingItem storage item = listings[_listingId];
        if (!item.isActive) revert ListingNotActive();
        if (item.owner != msg.sender) revert NotListingOwner();
        if (!delegations[_listingId][_broker].isActive) revert NoActiveRequest();
        if (item.approvedBroker != address(0)) revert BrokerAlreadyApproved();

        delegations[_listingId][_broker].isApprovedByOwner = true;
        item.approvedBroker = _broker;

        emit BrokerApproved(_listingId, _broker);
    }

    /// @notice Seller cancels listing if not yet locked in escrow
    function cancelListing(uint256 _listingId) external override {
        ListingItem storage item = listings[_listingId];
        if (item.owner != msg.sender) revert NotListingOwner();
        if (!item.isActive) revert ListingNotActive();

        item.isActive = false;
        emit ListingCancelled(_listingId);
    }
}
