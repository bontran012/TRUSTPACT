// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/ITeleporterMessenger.sol";

/// @title ScamRegistryL1 — Community Blacklist Registry with Avalanche Teleporter (ICM) Sync
/// @notice Enables reporting and querying of scammers (phone, bank, telegram, wallet) with Sybil mitigation
///         and native Avalanche Interchain Messaging (Teleporter) cross-chain synchronization.
contract ScamRegistryL1 is ITeleporterReceiver {

    struct ScamReport {
        address reporter;
        string identifier;          // Phone / Bank account / Telegram handle / Wallet address
        string category;            // "phone" | "bank" | "telegram" | "wallet"
        string evidenceHash;        // IPFS hash of proof/evidence
        string description;
        uint256 timestamp;
        bool isVerified;
    }

    mapping(bytes32 => ScamReport[]) public reports;
    mapping(bytes32 => uint256) public reportCount;
    mapping(address => bool) public moderators;
    mapping(address => uint256) public lastReportTime;
    uint256 public constant REPORT_COOLDOWN = 1 minutes;

    address public admin;
    uint256 public totalReports;

    // ── Avalanche Teleporter (ICM) Integration ──────────────────────────────
    address public constant OFFICIAL_TELEPORTER_MESSENGER = 0x253b2784c75e510dD0fF1da844684a1aC0aa5fcf;
    bytes32 public constant FUJI_C_CHAIN_BLOCKCHAIN_ID = 0x7fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5;

    ITeleporterMessenger public teleporterMessenger;
    bytes32 public lastTeleporterMessageId;
    uint256 public totalCrossChainSyncs;

    event ScamReported(bytes32 indexed identifierHash, address indexed reporter, string category, uint256 timestamp);
    event ReportVerified(bytes32 indexed identifierHash, uint256 reportIndex);
    event ModeratorAdded(address indexed moderator);
    event ModeratorRemoved(address indexed moderator);
    event TeleporterAlertDispatched(bytes32 indexed messageId, bytes32 indexed destinationBlockchainId, string identifier);
    event TeleporterAlertReceived(bytes32 indexed sourceBlockchainId, address indexed originSender, string identifier);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyModerator() {
        require(moderators[msg.sender], "Only moderator");
        _;
    }

    constructor() {
        admin = msg.sender;
        moderators[msg.sender] = true;
        teleporterMessenger = ITeleporterMessenger(OFFICIAL_TELEPORTER_MESSENGER);
    }

    function setTeleporterMessenger(address _messenger) external onlyAdmin {
        require(_messenger != address(0), "Zero address");
        teleporterMessenger = ITeleporterMessenger(_messenger);
    }

    /// @notice Report scammer on-chain, protected by anti-spam cooldown
    function reportScam(
        string calldata _identifier,
        string calldata _category,
        string calldata _evidenceHash,
        string calldata _description
    ) external {
        require(lastReportTime[msg.sender] == 0 || block.timestamp >= lastReportTime[msg.sender] + REPORT_COOLDOWN, "Report cooldown active");
        lastReportTime[msg.sender] = block.timestamp;

        bytes32 idHash = keccak256(abi.encodePacked(_identifier));
        reports[idHash].push(ScamReport({
            reporter: msg.sender,
            identifier: _identifier,
            category: _category,
            evidenceHash: _evidenceHash,
            description: _description,
            timestamp: block.timestamp,
            isVerified: false
        }));
        reportCount[idHash]++;
        totalReports++;
        emit ScamReported(idHash, msg.sender, _category, block.timestamp);
    }

    /// @notice Broadcasts a verified scam alert across Avalanche L1/C-Chain via Official TeleporterMessenger (ICM)
    function syncVerifiedScamViaTeleporter(
        bytes32 _destinationBlockchainID,
        address _destinationReceiver,
        string calldata _identifier,
        uint256 _reportIndex
    ) external onlyModerator returns (bytes32 messageId) {
        bytes32 idHash = keccak256(abi.encodePacked(_identifier));
        require(_reportIndex < reports[idHash].length, "Invalid index");
        ScamReport storage rep = reports[idHash][_reportIndex];
        require(rep.isVerified, "Report must be verified first");

        bytes memory payload = abi.encode(
            rep.reporter,
            rep.identifier,
            rep.category,
            rep.evidenceHash,
            rep.description,
            rep.timestamp
        );

        address[] memory allowedRelayers = new address[](0);
        messageId = teleporterMessenger.sendCrossChainMessage(
            TeleporterMessageInput({
                destinationBlockchainID: _destinationBlockchainID,
                destinationAddress: _destinationReceiver,
                feeInfo: TeleporterFeeInfo({feeTokenAddress: address(0), amount: 0}),
                requiredGasLimit: 250000,
                allowedRelayerAddresses: allowedRelayers,
                message: payload
            })
        );

        lastTeleporterMessageId = messageId;
        totalCrossChainSyncs++;
        emit TeleporterAlertDispatched(messageId, _destinationBlockchainID, _identifier);
    }

    /// @notice Receives cross-chain scam intelligence delivered by Avalanche Teleporter Messenger
    function receiveTeleporterMessage(
        bytes32 sourceBlockchainID,
        address originSenderAddress,
        bytes calldata message
    ) external override {
        require(msg.sender == address(teleporterMessenger), "Only Teleporter Messenger");

        (
            address reporter,
            string memory identifier,
            string memory category,
            string memory evidenceHash,
            string memory description,
            uint256 timestamp
        ) = abi.decode(message, (address, string, string, string, string, uint256));

        bytes32 idHash = keccak256(abi.encodePacked(identifier));
        reports[idHash].push(ScamReport({
            reporter: reporter,
            identifier: identifier,
            category: category,
            evidenceHash: evidenceHash,
            description: description,
            timestamp: timestamp,
            isVerified: true
        }));
        reportCount[idHash]++;
        totalReports++;
        totalCrossChainSyncs++;

        emit TeleporterAlertReceived(sourceBlockchainID, originSenderAddress, identifier);
    }

    /// @notice Query report count and verified scam status for any identifier
    function checkScam(string calldata _identifier) external view returns (uint256 count, bool hasVerified) {
        bytes32 idHash = keccak256(abi.encodePacked(_identifier));
        count = reportCount[idHash];
        ScamReport[] storage reps = reports[idHash];
        for (uint256 i = 0; i < reps.length; i++) {
            if (reps[i].isVerified) {
                hasVerified = true;
                break;
            }
        }
    }

    /// @notice Get all reports associated with an identifier
    function getReports(string calldata _identifier) external view returns (ScamReport[] memory) {
        return reports[keccak256(abi.encodePacked(_identifier))];
    }

    /// @notice Paginated report query to prevent Out-of-Gas errors on large sets
    function getReportsPaginated(string calldata _identifier, uint256 offset, uint256 limit) external view returns (ScamReport[] memory) {
        bytes32 idHash = keccak256(abi.encodePacked(_identifier));
        uint256 total = reports[idHash].length;
        if (offset >= total) return new ScamReport[](0);
        uint256 end = offset + limit > total ? total : offset + limit;
        ScamReport[] memory result = new ScamReport[](end - offset);
        for (uint256 i = offset; i < end; i++) {
            result[i - offset] = reports[idHash][i];
        }
        return result;
    }

    /// @notice Moderator marks a scam report as verified after reviewing IPFS evidence
    function verifyReport(string calldata _identifier, uint256 _index) external onlyModerator {
        bytes32 idHash = keccak256(abi.encodePacked(_identifier));
        require(_index < reports[idHash].length, "Invalid index");
        reports[idHash][_index].isVerified = true;
        emit ReportVerified(idHash, _index);
    }

    function addModerator(address _mod) external onlyAdmin {
        require(_mod != address(0), "Zero address");
        moderators[_mod] = true;
        emit ModeratorAdded(_mod);
    }

    function removeModerator(address _mod) external onlyAdmin {
        moderators[_mod] = false;
        emit ModeratorRemoved(_mod);
    }
}
