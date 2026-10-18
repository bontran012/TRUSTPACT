// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/scam-radar/ScamRegistryL1.sol";

/// @title DeployL1
/// @notice Deployment script for ScamRegistryL1 onto TrustPact Custom L1 Subnet.
/// @author TrustPact Architecture Team (Avalanche UniHack 2026)
contract DeployL1 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerPrivateKey);
        address initialModerator = vm.envOr("INITIAL_MODERATOR", address(0));

        console.log("===============================================================");
        console.log("  TRUSTPACT PROTOCOL - CUSTOM L1 SUBNET DEPLOYMENT");
        console.log("===============================================================");
        console.log("Chain ID:            ", block.chainid);
        console.log("Deployer Address:    ", deployer);
        console.log("Deployer Balance:    ", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy ScamRegistryL1 onto Custom L1 (Gas-free execution)
        ScamRegistryL1 registry = new ScamRegistryL1();
        console.log("[1/1] ScamRegistryL1 deployed at: ", address(registry));

        // 2. Add optional initial moderator (e.g. x402 verification bot or DAO multisig)
        if (initialModerator != address(0) && initialModerator != deployer) {
            registry.addModerator(initialModerator);
            console.log("  [+] Registered Initial Moderator: ", initialModerator);
        }

        vm.stopBroadcast();

        console.log("===============================================================");
        console.log("  CUSTOM L1 DEPLOYMENT COMPLETE!");
        console.log("===============================================================");
        console.log("Summary for Telegram Bot / x402 Service (.env):");
        console.log("L1_CHAIN_ID=", block.chainid);
        console.log("SCAM_REGISTRY_L1_ADDRESS=", address(registry));
        console.log("===============================================================");
    }
}
