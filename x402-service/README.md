# TrustPact x402 Micropayment Gateway

> **Avalanche UniHack 2026** — *Avalanche Integration & Revenue Architecture*
> High-performance micro-payment oracle enabling Telegram anti-scam bots to query TrustPact's threat intelligence registry on Avalanche Custom L1 for 0.01 USDC per query.

---

## 1. Overview & The HTTP 402 Protocol

The **HTTP 402 Payment Required** status code is part of the original HTTP specification, designated for digital cash systems. TrustPact implements this standard natively with **Avalanche Fuji C-Chain** and our **Custom L1 Subnet**:

```
 ┌────────────────┐              ┌────────────────┐              ┌────────────────┐
 │  Telegram Bot  │              │  x402 Gateway  │              │ Avalanche Fuji │
 └───────┬────────┘              └───────┬────────┘              └───────┬────────┘
         │                               │                               │
         │ 1. POST /api/check-scam       │                               │
         │    {"identifier":"0912..."}   │                               │
         ├──────────────────────────────►│                               │
         │                               │                               │
         │ 2. HTTP 402 Payment Required  │                               │
         │    (0.01 USDC to Treasury)    │                               │
         │◄──────────────────────────────┤                               │
         │                               │                               │
         │ 3. Transfer 0.01 USDC         │                               │
         ├──────────────────────────────────────────────────────────────►│
         │    TxHash: 0xabc...           │                               │
         │                               │                               │
         │ 4. Retry with Payment Header  │                               │
         │    X-Payment-Tx: 0xabc...     │                               │
         ├──────────────────────────────►│                               │
         │                               │ 5. Verify Transfer Event      │
         │                               ├──────────────────────────────►│
         │                               │    Receipt: Status 1, >= 0.01 │
         │                               │◄──────────────────────────────┤
         │                               │                               │
         │                               │ 6. Query Custom L1 Subnet     │
         │                               │    ScamRegistryL1.checkScam() │
         │                               ├──────────────┐                │
         │                               │              │                │
         │ 7. Return Scam Analysis       │◄─────────────┘                │
         │    (Risk Score, Evidence)     │                               │
         │◄──────────────────────────────┤                               │
```

---

## 2. Quickstart

### 2.1 Installation
```bash
cd x402-service
npm install
```

### 2.2 Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Key environment parameters:
- `FUJI_RPC_URL`: `https://api.avax-test.network/ext/bc/C/rpc`
- `USDC_ADDRESS`: `0x5425890298aed601595a70AB815c96711a31Bc65` (Fuji Circle USDC)
- `TREASURY_ADDRESS`: Protocol revenue receiver address on Fuji
- `L1_RPC_URL`: `http://127.0.0.1:9650/ext/bc/trustpact-l1/rpc`
- `SCAM_REGISTRY_L1_ADDRESS`: Address of deployed `ScamRegistryL1.sol` on Custom L1

### 2.3 Run Service
```bash
# Development mode with hot-reload
npm run dev

# Production build
npm run build
npm start
```

---

## 3. API Specification

### 3.1 Check Pricing Details
`GET /api/pricing`

**Response (`200 OK`)**:
```json
{
  "network": "Avalanche Fuji C-Chain",
  "chainId": 43113,
  "tokenSymbol": "USDC",
  "tokenAddress": "0x5425890298aed601595a70AB815c96711a31Bc65",
  "requiredAmount": "0.01",
  "requiredAmountAtomic": "10000",
  "recipientAddress": "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC",
  "instructions": "Transfer 0.01 USDC to the recipient on Fuji C-Chain, then retry with header 'X-Payment-Tx: <txHash>'."
}
```

---

### 3.2 Query Scam Radar (x402 Protected)
`POST /api/check-scam`

#### Without Payment:
```bash
curl -X POST http://localhost:4020/api/check-scam \
  -H "Content-Type: application/json" \
  -d '{"identifier": "0912345678"}'
```

**Response (`402 Payment Required`)**:
```json
{
  "status": 402,
  "error": "Payment Required",
  "message": "A micro-payment of 0.01 USDC on Avalanche Fuji C-Chain is required to query the Scam Radar database.",
  "paymentDetails": {
    "network": "Avalanche Fuji C-Chain",
    "chainId": 43113,
    "tokenSymbol": "USDC",
    "tokenAddress": "0x5425890298aed601595a70AB815c96711a31Bc65",
    "requiredAmount": "0.01",
    "requiredAmountAtomic": "10000",
    "recipientAddress": "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC"
  }
}
```

#### With Valid Payment Proof:
```bash
curl -X POST http://localhost:4020/api/check-scam \
  -H "Content-Type: application/json" \
  -H "X-Payment-Tx: 0x48b6c5ad3872c6b4129e96195825..." \
  -d '{"identifier": "0912345678"}'
```

**Response (`200 OK`)**:
```json
{
  "query": "0912345678",
  "riskLevel": "CONFIRMED_FRAUD",
  "riskScore": 100,
  "totalReports": 3,
  "isVerifiedFraud": true,
  "reports": [
    {
      "reporter": "0x123...",
      "category": "phone",
      "evidenceHash": "ipfs://QmProof123...",
      "description": "Scammer pretending to be escrow broker in OTC group",
      "timestamp": 1729180000,
      "isVerified": true
    }
  ],
  "verifiedPayment": {
    "txHash": "0x48b6c5ad3872c6b4129e96195825...",
    "payer": "0xBotWalletAddress...",
    "recipient": "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC",
    "amount": "0.01",
    "verifiedAt": 1729180120
  },
  "queryTimestamp": 1729180121
}
```

---

## 4. Telegram Bot Client Example (TypeScript / ethers.js)

```typescript
import { ethers } from "ethers";

const GATEWAY_URL = "https://x402.trustpact.io/api/check-scam";
const FUJI_RPC = "https://api.avax-test.network/ext/bc/C/rpc";
const USDC_ADDRESS = "0x5425890298aed601595a70AB815c96711a31Bc65";
const TREASURY_ADDRESS = "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC";

const USDC_ABI = ["function transfer(address to, uint256 amount) returns (bool)"];

export async function checkScamWithAutoPayment(identifier: string, botWalletPrivateKey: string) {
  // 1. Initial attempt
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier })
  });

  if (res.status === 402) {
    // 2. Pay 0.01 USDC (10,000 atomic units) on Fuji C-Chain
    const provider = new ethers.JsonRpcProvider(FUJI_RPC);
    const wallet = new ethers.Wallet(botWalletPrivateKey, provider);
    const usdc = new ethers.Contract(USDC_ADDRESS, USDC_ABI, wallet);

    console.log("Transacting 0.01 USDC micropayment on Avalanche Fuji...");
    const tx = await usdc.transfer(TREASURY_ADDRESS, 10000n);
    await tx.wait(1);

    // 3. Retry query with X-Payment-Tx header
    const paidRes = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Payment-Tx": tx.hash
      },
      body: JSON.stringify({ identifier })
    });

    return await paidRes.json();
  }

  return await res.json();
}
```
