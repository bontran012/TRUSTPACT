// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/core/StakedBrokerRegistry.sol";
import "../src/core/UniversalEscrow.sol";
import "../src/reputation/TrustPassportSBT.sol";
import "../test/mocks/MockUSDC.sol";

/// @title DeployCChain
/// @notice Production-grade deployment script for TrustPact protocol onto Avalanche Fuji C-Chain.
/// @dev Configured for ChainID 43113, Fuji Aave V3 Pool & AddressesProvider, with automatic cross-contract authorization.
/// @author TrustPact Architecture Team (Avalanche UniHack 2026)
contract DeployCChain is Script {
    // Avalanche Fuji C-Chain Constants (ChainID: 43113)
    uint256 public constant FUJI_CHAIN_ID = 43113;
    address public constant FUJI_AAVE_V3_POOL = 0x8B9b2AF4afB389b4a70A474dfD4AdCD4a302bb40;
    address public constant FUJI_AAVE_POOL_ADDRESSES_PROVIDER = 0x07D04EfAAA0Ac69D19d107795aF247C42Eb50F1C;
    address public constant FUJI_CIRCLE_USDC = 0x5425890298aed601595a70AB815c96711a31Bc65;
    // Fuji aUSDC (Aave V3 Fuji Interest Bearing Token)
    address public constant FUJI_AAVE_A_USDC = 0x8B9b2AF4afB389b4a70A474dfD4AdCD4a302bb40;

    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        address deployer = vm.addr(deployerPrivateKey);
        address treasury = vm.envOr("TREASURY_ADDRESS", deployer);

        console.log("===============================================================");
        console.log("  TRUSTPACT PROTOCOL - FUJI C-CHAIN DEPLOYMENT SCRIPT");
        console.log("===============================================================");
        console.log("Target Chain ID:              ", block.chainid);
        console.log("Deployer Address:             ", deployer);
        console.log("Protocol Treasury Address:    ", treasury);
        console.log("Deployer Native Balance:      ", deployer.balance);
        console.log("Fuji Aave V3 Pool:            ", FUJI_AAVE_V3_POOL);
        console.log("Fuji Aave AddressesProvider:  ", FUJI_AAVE_POOL_ADDRESSES_PROVIDER);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Resolve USDC token on Avalanche Fuji C-Chain
        address usdcAddress = vm.envOr("USDC_ADDRESS", address(0));
        address aUsdcAddress = vm.envOr("A_USDC_ADDRESS", address(0));
        address aavePool = vm.envOr("AAVE_POOL_ADDRESS", FUJI_AAVE_V3_POOL);

        if (usdcAddress == address(0)) {
            // Check if official Fuji Circle USDC exists and has contract bytecode
            if (FUJI_CIRCLE_USDC.code.length > 0) {
                usdcAddress = FUJI_CIRCLE_USDC;
                aUsdcAddress = FUJI_AAVE_A_USDC;
                console.log("[USDC] Using Circle Official Fuji USDC:", usdcAddress);
            } else {
                MockUSDC mockUSDC = new MockUSDC();
                usdcAddress = address(mockUSDC);
                if (aUsdcAddress == address(0)) {
                    MockUSDC mockAUSDC = new MockUSDC();
                    aUsdcAddress = address(mockAUSDC);
                }
                console.log("[USDC] Deployed MockUSDC token at:     ", usdcAddress);
                console.log("[aUSDC] Deployed Mock aUSDC token at:  ", aUsdcAddress);
            }
        } else {
            if (aUsdcAddress == address(0)) {
                aUsdcAddress = FUJI_AAVE_A_USDC;
            }
            console.log("[USDC] Using Environment Specified USDC: ", usdcAddress);
        }

        // 2. Deploy StakedBrokerRegistry (Staked Insurance Bonds, Quota & Real Yield on Aave V3)
        StakedBrokerRegistry brokerRegistry = new StakedBrokerRegistry(
            usdcAddress,
            aUsdcAddress,
            aavePool,
            treasury
        );
        console.log("[1/3] StakedBrokerRegistry deployed at: ", address(brokerRegistry));

        // 3. Deploy UniversalEscrow (3-Party Non-Custodial Escrow Vault)
        UniversalEscrow escrow = new UniversalEscrow(
            usdcAddress,
            treasury,
            address(brokerRegistry)
        );
        console.log("[2/3] UniversalEscrow deployed at:      ", address(escrow));

        // 4. Deploy TrustPassportSBT (Soulbound Reputation Passport)
        TrustPassportSBT passport = new TrustPassportSBT();
        console.log("[3/3] TrustPassportSBT deployed at:     ", address(passport));

        // 5. Automatically wire up cross-contract permissions
        console.log("---------------------------------------------------------------");
        console.log("Configuring Cross-Contract Authorizations...");

        // Wire: StakedBrokerRegistry authorizes UniversalEscrow to allocate and release quota
        brokerRegistry.setEscrowContract(address(escrow));
        console.log("  [+] StakedBrokerRegistry -> setEscrowContract(UniversalEscrow)");

        // Wire: TrustPassportSBT authorizes UniversalEscrow to update reputation metrics on settlement
        passport.setAuthorizedUpdater(address(escrow), true);
        console.log("  [+] TrustPassportSBT -> setAuthorizedUpdater(UniversalEscrow, true)");

        // Wire: UniversalEscrow records ratings and updates profiles on TrustPassportSBT
        escrow.setTrustPassportSBT(address(passport));
        console.log("  [+] UniversalEscrow -> setTrustPassportSBT(TrustPassportSBT)");

        // Wire: TrustPassportSBT authorizes StakedBrokerRegistry to sync stake balances and slash penalties
        passport.setAuthorizedUpdater(address(brokerRegistry), true);
        console.log("  [+] TrustPassportSBT -> setAuthorizedUpdater(StakedBrokerRegistry, true)");

        vm.stopBroadcast();

        console.log("===============================================================");
        console.log("  FUJI C-CHAIN DEPLOYMENT & PERMISSION WIRING COMPLETE!");
        console.log("===============================================================");
        console.log("Summary for Frontend / Microservices (.env):");
        console.log("NEXT_PUBLIC_CHAIN_ID=43113");
        console.log("NEXT_PUBLIC_USDC_ADDRESS=", usdcAddress);
        console.log("NEXT_PUBLIC_BROKER_REGISTRY=", address(brokerRegistry));
        console.log("NEXT_PUBLIC_UNIVERSAL_ESCROW=", address(escrow));
        console.log("NEXT_PUBLIC_TRUST_PASSPORT_SBT=", address(passport));
        console.log("NEXT_PUBLIC_FUJI_AAVE_V3_POOL=", aavePool);
        console.log("NEXT_PUBLIC_FUJI_AAVE_ADDRESSES_PROVIDER=", FUJI_AAVE_POOL_ADDRESSES_PROVIDER);
        console.log("===============================================================");
    }
}
