import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ethers } from "ethers";
import { X402PaymentGateway, AuthenticatedPaymentRequest } from "./x402-middleware";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════════════════════════════
//  CONFIGURATION & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 4020;

// Avalanche Fuji C-Chain Configuration (Micropayment verification)
const FUJI_RPC_URL = process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc";
const FUJI_USDC_ADDRESS = process.env.USDC_ADDRESS || "0x5425890298aed601595a70AB815c96711a31Bc65";
const TREASURY_ADDRESS = process.env.TREASURY_ADDRESS || "0x8db97C7cEcE249c2b98bDC0226Cc4C2A57BF52FC";

// TrustPact Custom L1 Subnet Configuration (Threat intelligence database)
const L1_RPC_URL = process.env.L1_RPC_URL || "http://127.0.0.1:9650/ext/bc/trustpact-l1/rpc";
const SCAM_REGISTRY_L1_ADDRESS = process.env.SCAM_REGISTRY_L1_ADDRESS || "0x52C84043CD9c86523674805113B78444499cB73a";
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;

// ABI for ScamRegistryL1 contract
const SCAM_REGISTRY_ABI = [
  "function checkScam(string calldata _identifier) external view returns (uint256 count, bool hasVerified)",
  "function getReports(string calldata _identifier) external view returns (tuple(address reporter, string identifier, string category, string evidenceHash, string description, uint256 timestamp, bool isVerified)[])",
  "function reportScam(string calldata _identifier, string calldata _category, string calldata _evidenceHash, string calldata _description) external",
  "function totalReports() external view returns (uint256)"
];

// Initialize Providers and Contracts
const fujiProvider = new ethers.JsonRpcProvider(FUJI_RPC_URL);
const l1Provider = new ethers.JsonRpcProvider(L1_RPC_URL);

const scamRegistryContract = new ethers.Contract(
  SCAM_REGISTRY_L1_ADDRESS,
  SCAM_REGISTRY_ABI,
  l1Provider
);

// Initialize x402 Micropayment Gateway
const x402Gateway = new X402PaymentGateway({
  rpcUrl: FUJI_RPC_URL,
  usdcAddress: FUJI_USDC_ADDRESS,
  recipientAddress: TREASURY_ADDRESS,
  requiredAmountAtomic: 10000n, // 0.01 USDC (6 decimals)
  chainId: 43113
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PUBLIC ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @notice Healthcheck and multi-chain RPC status
 */
app.get("/health", async (_req: Request, res: Response) => {
  let fujiOk = false;
  let l1Ok = false;

  try {
    const fujiBlock = await fujiProvider.getBlockNumber();
    fujiOk = fujiBlock > 0;
  } catch {
    fujiOk = false;
  }

  try {
    const l1Block = await l1Provider.getBlockNumber();
    l1Ok = l1Block >= 0;
  } catch {
    l1Ok = false;
  }

  res.json({
    status: "ok",
    service: "TrustPact x402 Micropayment Gateway",
    version: "1.0.0",
    networks: {
      fujiCChain: {
        chainId: 43113,
        connected: fujiOk,
        usdc: FUJI_USDC_ADDRESS,
        treasury: TREASURY_ADDRESS
      },
      customL1: {
        connected: l1Ok,
        scamRegistry: SCAM_REGISTRY_L1_ADDRESS
      }
    },
    pricing: x402Gateway.getPaymentDetails()
  });
});

/**
 * @notice Exposes pricing specification for Telegram bots & x402 consumers
 */
app.get("/api/pricing", (_req: Request, res: Response) => {
  res.json(x402Gateway.getPaymentDetails());
});

// ═══════════════════════════════════════════════════════════════════════════════
//  PROTECTED x402 ENDPOINTS (0.01 USDC Fee Required)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @notice Query scam registry on Custom L1 protected by x402 micropayment.
 * @dev Header required: 'X-Payment-Tx: <txHash>' or 'Authorization: x402 <txHash>'
 */
app.post("/api/check-scam", x402Gateway.middleware(), async (req: AuthenticatedPaymentRequest, res: Response) => {
  const { identifier } = req.body;

  if (!identifier || typeof identifier !== "string") {
    res.status(400).json({
      error: "Missing or invalid identifier parameter. Provide a phone number, bank account, telegram handle, or EVM address."
    });
    return;
  }

  const cleanIdentifier = identifier.trim();

  try {
    let reportCount = 0n;
    let hasVerified = false;
    let rawReports: any[] = [];

    try {
      // Query ScamRegistryL1 on Custom L1 Subnet
      const checkResult = await scamRegistryContract.checkScam(cleanIdentifier);
      reportCount = checkResult[0];
      hasVerified = checkResult[1];

      if (reportCount > 0n) {
        rawReports = await scamRegistryContract.getReports(cleanIdentifier);
      }
    } catch (contractErr) {
      console.warn("[L1 Query Warning]: Custom L1 offline or contract not deployed. Returning simulation baseline.", contractErr);
      // Fallback baseline when testing without active local L1 node
      reportCount = 0n;
      hasVerified = false;
    }

    const countNum = Number(reportCount);
    let riskLevel = "CLEAN";
    let riskScore = 0; // 0 - 100

    if (hasVerified) {
      riskLevel = "CONFIRMED_FRAUD";
      riskScore = 100;
    } else if (countNum >= 3) {
      riskLevel = "HIGH_RISK";
      riskScore = 80;
    } else if (countNum > 0) {
      riskLevel = "SUSPICIOUS";
      riskScore = 40;
    }

    const formattedReports = rawReports.map((r: any) => ({
      reporter: r.reporter,
      category: r.category,
      evidenceHash: r.evidenceHash,
      description: r.description,
      timestamp: Number(r.timestamp),
      isVerified: r.isVerified
    }));

    res.json({
      query: cleanIdentifier,
      riskLevel,
      riskScore,
      totalReports: countNum,
      isVerifiedFraud: hasVerified,
      reports: formattedReports,
      verifiedPayment: req.payment,
      queryTimestamp: Date.now()
    });
  } catch (err: any) {
    console.error("[Check Scam Error]:", err);
    res.status(500).json({
      error: "Internal Query Failure",
      message: err.message || "Failed to process query on Custom L1 Subnet."
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  GAS-FREE COMMUNITY REPORT RELAY (0 Gas on Custom L1)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @notice Free reporting endpoint for community victims, relayed gas-free onto Custom L1.
 */
app.post("/api/report-scam", async (req: Request, res: Response) => {
  const { identifier, category, evidenceHash, description } = req.body;

  if (!identifier || !category) {
    res.status(400).json({ error: "Missing required fields: identifier and category." });
    return;
  }

  if (!RELAYER_PRIVATE_KEY) {
    res.status(503).json({
      error: "Relayer not configured",
      message: "Direct zero-gas submission is available directly via Avalanche Custom L1 RPC using user wallet."
    });
    return;
  }

  try {
    const relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, l1Provider);
    const registryWithSigner = scamRegistryContract.connect(relayerWallet) as any;

    // Send transaction with 0 gas fee on Custom L1
    const tx = await registryWithSigner.reportScam(
      identifier.trim(),
      category.trim(),
      evidenceHash || "",
      description || "",
      { gasPrice: 0n }
    );

    const receipt = await tx.wait();

    res.json({
      success: true,
      transactionHash: receipt.hash,
      network: "TrustPact Custom L1",
      gasUsed: receipt.gasUsed.toString(),
      gasFeePaid: "0 PACT (Gas-Free L1)",
      identifier,
      category
    });
  } catch (err: any) {
    console.error("[Report Relay Error]:", err);
    res.status(500).json({
      error: "Relay Failed",
      message: err.message
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log("===============================================================");
  console.log(`  TRUSTPACT x402 MICROPAYMENT GATEWAY RUNNING ON PORT ${PORT}`);
  console.log("===============================================================");
  console.log(`  Fuji C-Chain RPC:     ${FUJI_RPC_URL}`);
  console.log(`  Fuji USDC Token:      ${FUJI_USDC_ADDRESS}`);
  console.log(`  Protocol Treasury:    ${TREASURY_ADDRESS}`);
  console.log(`  Query Fee:            0.01 USDC (10,000 atomic units)`);
  console.log(`  Custom L1 Subnet RPC: ${L1_RPC_URL}`);
  console.log(`  ScamRegistry Address: ${SCAM_REGISTRY_L1_ADDRESS}`);
  console.log("===============================================================");
});
