// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Fee info struct for Avalanche Teleporter (ICM) cross-chain messages
struct TeleporterFeeInfo {
    address feeTokenAddress;
    uint256 amount;
}

/// @notice Official Avalanche Teleporter message input struct
struct TeleporterMessageInput {
    bytes32 destinationBlockchainID;
    address destinationAddress;
    TeleporterFeeInfo feeInfo;
    uint256 requiredGasLimit;
    address[] allowedRelayerAddresses;
    bytes message;
}

/// @title ITeleporterMessenger — Official Avalanche Interchain Messaging (ICM) Interface
/// @notice Deployed on Avalanche Fuji & Mainnet at 0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf
interface ITeleporterMessenger {
    function sendCrossChainMessage(TeleporterMessageInput calldata messageInput) external returns (bytes32 messageID);
}

/// @title ITeleporterReceiver — Standard receiver interface for Avalanche ICM messages
interface ITeleporterReceiver {
    function receiveTeleporterMessage(
        bytes32 sourceBlockchainID,
        address originSenderAddress,
        bytes calldata message
    ) external;
}
