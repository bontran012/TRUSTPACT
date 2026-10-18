// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ScamRegistryL1 — Gas-Free Community Blacklist Registry (Custom L1 Subnet)
/// @notice Enables zero-gas reporting and querying of scammers (phone, bank, telegram, wallet)
contract ScamRegistryL1 {

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
    address public admin;
    uint256 public totalReports;

    event ScamReported(bytes32 indexed identifierHash, address indexed reporter, string category, uint256 timestamp);
    event ReportVerified(bytes32 indexed identifierHash, uint256 reportIndex);
    event ModeratorAdded(address indexed moderator);
    event ModeratorRemoved(address indexed moderator);

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
    }

    /// @notice Report scammer without gas fees on Custom L1
    function reportScam(
        string calldata _identifier,
        string calldata _category,
        string calldata _evidenceHash,
        string calldata _description
    ) external {
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
