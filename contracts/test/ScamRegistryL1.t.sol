// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/scam-radar/ScamRegistryL1.sol";
import "../src/interfaces/ITeleporterMessenger.sol";

contract MockTeleporterMessenger is ITeleporterMessenger {
    uint256 public nonce;

    function sendCrossChainMessage(TeleporterMessageInput calldata messageInput) external override returns (bytes32 messageID) {
        nonce++;
        messageID = keccak256(abi.encode(nonce, messageInput.destinationBlockchainID, messageInput.destinationAddress, messageInput.message));
        if (messageInput.destinationAddress != address(0)) {
            ITeleporterReceiver(messageInput.destinationAddress).receiveTeleporterMessage(
                0x7fc93d85c6d62c5b2ac0b519c87010ea5294012d1e407030d6acd0021cac10d5,
                msg.sender,
                messageInput.message
            );
        }
    }
}

contract ScamRegistryL1Test is Test {
    ScamRegistryL1 public registry;

    address public admin = address(0x1);
    address public moderator = address(0x2);
    address public reporter1 = address(0x10);
    address public reporter2 = address(0x20);
    address public stranger = address(0x99);

    string public constant SCAM_PHONE = "0987654321";
    string public constant SCAM_BANK = "19036789123456";
    string public constant SCAM_TELEGRAM = "@fake_otc_broker";
    string public constant EVIDENCE_IPFS = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";

    function setUp() public {
        vm.prank(admin);
        registry = new ScamRegistryL1();

        vm.prank(admin);
        registry.addModerator(moderator);
    }

    // =========================================================================
    // 1. REPORT SCAM
    // =========================================================================

    function test_ReportScamRecordsDataCorrectly() public {
        vm.prank(reporter1);
        registry.reportScam(
            SCAM_PHONE,
            "phone",
            EVIDENCE_IPFS,
            "Impersonated bank officer and stole funds"
        );

        (uint256 count, bool hasVerified) = registry.checkScam(SCAM_PHONE);
        assertEq(count, 1);
        assertFalse(hasVerified);
        assertEq(registry.totalReports(), 1);

        ScamRegistryL1.ScamReport[] memory reps = registry.getReports(SCAM_PHONE);
        assertEq(reps.length, 1);
        assertEq(reps[0].reporter, reporter1);
        assertEq(reps[0].identifier, SCAM_PHONE);
        assertEq(reps[0].category, "phone");
        assertEq(reps[0].evidenceHash, EVIDENCE_IPFS);
        assertFalse(reps[0].isVerified);
    }

    function test_MultipleReportsOnSameIdentifier() public {
        vm.prank(reporter1);
        registry.reportScam(SCAM_BANK, "bank", EVIDENCE_IPFS, "Report 1");

        vm.prank(reporter2);
        registry.reportScam(SCAM_BANK, "bank", EVIDENCE_IPFS, "Report 2");

        (uint256 count, bool hasVerified) = registry.checkScam(SCAM_BANK);
        assertEq(count, 2);
        assertFalse(hasVerified);
        assertEq(registry.totalReports(), 2);
    }

    // =========================================================================
    // 2. VERIFY REPORT
    // =========================================================================

    function test_VerifyReportByModerator() public {
        vm.prank(reporter1);
        registry.reportScam(SCAM_TELEGRAM, "telegram", EVIDENCE_IPFS, "Telegram scammer");

        // Moderator verifies report
        vm.prank(moderator);
        registry.verifyReport(SCAM_TELEGRAM, 0);

        (uint256 count, bool hasVerified) = registry.checkScam(SCAM_TELEGRAM);
        assertEq(count, 1);
        assertTrue(hasVerified);

        ScamRegistryL1.ScamReport[] memory reps = registry.getReports(SCAM_TELEGRAM);
        assertTrue(reps[0].isVerified);
    }

    function test_VerifyReportUnauthorizedReverts() public {
        vm.prank(reporter1);
        registry.reportScam(SCAM_TELEGRAM, "telegram", EVIDENCE_IPFS, "Telegram scammer");

        vm.prank(stranger);
        vm.expectRevert("Only moderator");
        registry.verifyReport(SCAM_TELEGRAM, 0);
    }

    function test_VerifyReportInvalidIndexReverts() public {
        vm.prank(moderator);
        vm.expectRevert("Invalid index");
        registry.verifyReport("nonexistent", 0);
    }

    // =========================================================================
    // 3. MODERATOR MANAGEMENT
    // =========================================================================

    function test_ModeratorManagement() public {
        address newMod = address(0x3);

        // Non-admin cannot add moderator
        vm.prank(stranger);
        vm.expectRevert("Only admin");
        registry.addModerator(newMod);

        // Admin adds moderator
        vm.prank(admin);
        registry.addModerator(newMod);
        assertTrue(registry.moderators(newMod));

        // Admin removes moderator
        vm.prank(admin);
        registry.removeModerator(newMod);
        assertFalse(registry.moderators(newMod));
    }

    function test_TeleporterCrossChainSyncDispatchesAndReceivesAlert() public {
        MockTeleporterMessenger mockTeleporter = new MockTeleporterMessenger();
        ScamRegistryL1 destRegistry = new ScamRegistryL1();

        vm.prank(admin);
        registry.setTeleporterMessenger(address(mockTeleporter));
        destRegistry.setTeleporterMessenger(address(mockTeleporter));

        // 1. Report and verify scam on source registry
        vm.prank(reporter1);
        registry.reportScam(SCAM_BANK, "bank", EVIDENCE_IPFS, "Cross-chain scam alert");

        vm.prank(moderator);
        registry.verifyReport(SCAM_BANK, 0);

        // 2. Dispatch via Teleporter ICM to destRegistry
        bytes32 destChainId = bytes32(uint256(99943113));
        vm.prank(moderator);
        bytes32 msgId = registry.syncVerifiedScamViaTeleporter(destChainId, address(destRegistry), SCAM_BANK, 0);

        assertTrue(msgId != bytes32(0));
        assertEq(registry.totalCrossChainSyncs(), 1);

        // 3. Verify destRegistry automatically received and verified the report
        (uint256 count, bool hasVerified) = destRegistry.checkScam(SCAM_BANK);
        assertEq(count, 1);
        assertTrue(hasVerified);
    }
}
