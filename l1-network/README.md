# TrustPact Custom L1 Subnet (`trustpact-l1`)

> **Avalanche UniHack 2026** — *Avalanche Integration Architecture (25 pts)*
> High-throughput, gas-free application-specific blockchain for decentralized fraud reporting & threat intelligence.

---

## 1. Architectural Rationale

TrustPact separates concerns across the Avalanche multi-chain architecture:
1. **Avalanche Fuji C-Chain (`ChainID: 43113`)**: High-value financial settlements, 3-party escrows, Aave V3 real yield integration, and Soulbound Reputation Passports (`TrustPassportSBT`).
2. **TrustPact Custom L1 Subnet (`trustpact-l1`)**: Community scam reporting (`ScamRegistryL1`) operating with **zero gas fees (`minBaseFee = 0`)** so victims of fraudulent phone numbers, bank accounts, or Telegram bots can report incidents on-chain at zero financial barrier.

```
┌──────────────────────────────────────────────┐
│        TrustPact Ecosystem Architecture       │
└──────────────────────┬───────────────────────┘
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
┌──────────────────────────┐    ┌──────────────────────────┐
│  Avalanche Fuji C-Chain  │    │  TrustPact Custom L1     │
│  (ChainID: 43113)        │    │  (ChainID: 99943113)     │
├──────────────────────────┤    ├──────────────────────────┤
│ • UniversalEscrow.sol    │    │ • ScamRegistryL1.sol     │
│ • StakedBrokerRegistry   │    │ • Gas-Free (minFee = 0)  │
│ • Aave V3 Real Yield     │    │ • Sub-second Finality    │
│ • TrustPassportSBT       │    │ • Public Threat Database │
└─────────────┬────────────┘    └─────────────▲────────────┘
              │                               │
              │  x402 Micropayment Verification
              └───────────────┬───────────────┘
                              ▼
                     ┌──────────────────┐
                     │   x402 Service   │
                     │  (0.01 USDC Fee) │
                     └──────────────────┘
```

---

## 2. Prerequisites

1. **Install Avalanche CLI**:
   ```bash
   curl -sSfL https://raw.githubusercontent.com/ava-labs/avalanche-cli/main/scripts/install.sh | sh -s
   ```
   Add binary to path:
   ```bash
   export PATH=$PATH:$HOME/bin
   ```

2. **Install Foundry**:
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

---

## 3. Step-by-Step Subnet Setup with Avalanche CLI

### Step 3.1: Create Subnet Configuration
Run the Avalanche CLI interactive creator:
```bash
avalanche subnet create trustpact-l1
```
Choose the following options when prompted:
- **VM Type**: `Subnet-EVM`
- **Chain ID**: `99943113`
- **Token Symbol**: `PACT`
- **Fee Structure**: `Custom fee structure`
  - `minBaseFee`: `0` (Enables 0-gas transactions)
  - `targetGas`: `100000000`
  - `gasLimit`: `12000000`
- **Airdrop allocation**: Enter default pre-funded dev address `0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC` with `1000000 PACT`.

*Alternative (Direct Import)*: Copy `l1-network/genesis.json` directly into your Avalanche CLI subnet definitions directory (`~/.avalanche-cli/subnets/trustpact-l1/genesis.json`).

---

### Step 3.2: Deploy to Local Test Network
Spin up a local multi-node Avalanche network running your Custom L1:
```bash
avalanche subnet deploy trustpact-l1 --local
```
Output will display:
```
Network Name:      local
RPC URL:           http://127.0.0.1:9650/ext/bc/trustpact-l1/rpc
Chain ID:          99943113
Token Symbol:      PACT
Funded Test Key:   0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027
Address:           0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC
```

---

### Step 3.3: Deploy to Avalanche Fuji Testnet
To join Fuji as an elastic Subnet / L1:
```bash
avalanche subnet deploy trustpact-l1 --testnet
```
*Note*: Requires a funded Fuji account with testnet AVAX on the P-Chain for validator staking.

---

## 4. Deploying `ScamRegistryL1.sol` to Custom L1

With the local or testnet Subnet running:

```bash
cd contracts

# Run deployment script using Foundry
forge script script/DeployL1.s.sol:DeployL1 \
  --rpc-url http://127.0.0.1:9650/ext/bc/trustpact-l1/rpc \
  --private-key 0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027 \
  --broadcast \
  -vvvv
```

Copy the deployed `ScamRegistryL1` contract address from the console output.

---

## 5. Testing Gas-Free Transactions

### 5.1 Report a Scam Identifier (Zero Gas Cost)
Victims or automated crawlers can send reports with `--gas-price 0`:
```bash
cast send <SCAM_REGISTRY_L1_ADDRESS> \
  "reportScam(string,string,string,string)" \
  "0912345678" \
  "phone" \
  "ipfs://QmEvidenceHash123456" \
  "Scammer contacted pretending to be escrow broker" \
  --rpc-url http://127.0.0.1:9650/ext/bc/trustpact-l1/rpc \
  --private-key 0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027 \
  --gas-price 0
```

### 5.2 Query Blacklist Data
Read queries are instant and free:
```bash
# Returns (uint256 count, bool hasVerified)
cast call <SCAM_REGISTRY_L1_ADDRESS> \
  "checkScam(string)" \
  "0912345678" \
  --rpc-url http://127.0.0.1:9650/ext/bc/trustpact-l1/rpc
```

### 5.3 Verify Report by Moderator
```bash
cast send <SCAM_REGISTRY_L1_ADDRESS> \
  "verifyReport(string,uint256)" \
  "0912345678" \
  0 \
  --rpc-url http://127.0.0.1:9650/ext/bc/trustpact-l1/rpc \
  --private-key 0x56289e99c94b6912bfc12adc093c9b51124f0dc54ac7a766b2bc5ccf558d8027 \
  --gas-price 0
```

---

## 6. Integration with Telegram Bot & x402 Micropayment Gateway

The x402 Gateway (`x402-service/`) connects directly to `ScamRegistryL1` on this Subnet to serve threat verification data to Telegram community bots with 0.01 USDC payments on Fuji C-Chain.
