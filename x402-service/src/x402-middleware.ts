import { Request, Response, NextFunction } from "express";
import { ethers, Interface } from "ethers";

// ERC20 Transfer event signature: Transfer(address indexed from, address indexed to, uint256 value)
const ERC20_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const ERC20_INTERFACE = new Interface(ERC20_ABI);
const TRANSFER_TOPIC = ethers.id("Transfer(address,address,uint256)");

export interface PaymentDetails {
  network: string;
  chainId: number;
  tokenSymbol: string;
  tokenAddress: string;
  requiredAmount: string;
  requiredAmountAtomic: string;
  recipientAddress: string;
  instructions: string;
}

export interface AuthenticatedPaymentRequest extends Request {
  payment?: {
    txHash: string;
    payer: string;
    recipient: string;
    amount: string;
    verifiedAt: number;
  };
}

export class X402PaymentGateway {
  private provider: ethers.JsonRpcProvider;
  private usdcAddress: string;
  private recipientAddress: string;
  private requiredAmountAtomic: bigint;
  private chainId: number;
  // In-memory replay prevention cache
  private processedTransactions: Set<string> = new Set();

  constructor(config: {
    rpcUrl: string;
    usdcAddress: string;
    recipientAddress: string;
    requiredAmountAtomic?: bigint;
    chainId?: number;
  }) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.usdcAddress = config.usdcAddress.toLowerCase();
    this.recipientAddress = config.recipientAddress.toLowerCase();
    // Default: 0.01 USDC with 6 decimals = 10,000 units (0.01 * 1e6)
    this.requiredAmountAtomic = config.requiredAmountAtomic ?? 10000n;
    this.chainId = config.chainId ?? 43113; // Fuji C-Chain
  }

  public getPaymentDetails(): PaymentDetails {
    return {
      network: "Avalanche Fuji C-Chain",
      chainId: this.chainId,
      tokenSymbol: "USDC",
      tokenAddress: this.usdcAddress,
      requiredAmount: (Number(this.requiredAmountAtomic) / 1e6).toFixed(2),
      requiredAmountAtomic: this.requiredAmountAtomic.toString(),
      recipientAddress: this.recipientAddress,
      instructions: "Transfer 0.01 USDC to the recipient on Fuji C-Chain, then retry with header 'X-Payment-Tx: <txHash>' or 'Authorization: x402 <txHash>'."
    };
  }

  public middleware() {
    return async (req: AuthenticatedPaymentRequest, res: Response, next: NextFunction): Promise<void> => {
      // 1. Check for payment transaction hash in Headers or Body
      const authHeader = req.header("Authorization");
      let txHash: string | undefined = req.header("X-Payment-Tx");

      if (!txHash && authHeader) {
        if (authHeader.startsWith("x402 ")) {
          txHash = authHeader.replace("x402 ", "").trim();
        } else if (authHeader.startsWith("Bearer 0x")) {
          txHash = authHeader.replace("Bearer ", "").trim();
        }
      }

      if (!txHash && req.body && req.body.paymentTx) {
        txHash = req.body.paymentTx;
      }

      // Allow dev test bypass if explicitly configured
      if (process.env.ALLOW_DEV_BYPASS === "true" && req.header("X-Dev-Bypass") === "true") {
        req.payment = {
          txHash: "0xdev_bypass_mock_hash",
          payer: "0xdev_payer",
          recipient: this.recipientAddress,
          amount: "0.01",
          verifiedAt: Date.now()
        };
        return next();
      }

      // If no payment proof provided, respond with HTTP 402 Payment Required
      if (!txHash) {
        res.status(402).json({
          status: 402,
          error: "Payment Required",
          message: "A micro-payment of 0.01 USDC on Avalanche Fuji C-Chain is required to query the Scam Radar database.",
          paymentDetails: this.getPaymentDetails()
        });
        return;
      }

      // 2. Anti-Replay Protection: Ensure txHash has not been used previously
      const normalizedTxHash = txHash.toLowerCase();
      if (this.processedTransactions.has(normalizedTxHash)) {
        res.status(409).json({
          status: 409,
          error: "Payment Already Redeemed",
          message: `Transaction hash ${txHash} has already been verified for a previous query. Please submit a new 0.01 USDC payment.`
        });
        return;
      }

      try {
        // 3. Verify on Avalanche Fuji C-Chain
        const receipt = await this.provider.getTransactionReceipt(normalizedTxHash);
        if (!receipt) {
          res.status(402).json({
            status: 402,
            error: "Transaction Pending or Not Found",
            message: `Transaction ${txHash} was not found on Avalanche Fuji C-Chain. Please wait for block confirmation and retry.`,
            paymentDetails: this.getPaymentDetails()
          });
          return;
        }

        if (receipt.status !== 1) {
          res.status(400).json({
            status: 400,
            error: "Payment Transaction Failed",
            message: `Transaction ${txHash} reverted on Avalanche Fuji C-Chain.`
          });
          return;
        }

        // 4. Verify Transfer event from USDC token to recipient
        let validPaymentFound = false;
        let payerAddress = "";
        let paidAmount = 0n;

        for (const log of receipt.logs) {
          // Check if log is emitted by USDC contract and matches Transfer topic
          if (log.address.toLowerCase() === this.usdcAddress && log.topics[0] === TRANSFER_TOPIC) {
            try {
              const parsed = ERC20_INTERFACE.parseLog({
                topics: log.topics as string[],
                data: log.data
              });

              if (parsed && parsed.name === "Transfer") {
                const toAddress = (parsed.args[1] as string).toLowerCase();
                const amount = parsed.args[2] as bigint;

                if (toAddress === this.recipientAddress && amount >= this.requiredAmountAtomic) {
                  validPaymentFound = true;
                  payerAddress = parsed.args[0] as string;
                  paidAmount = amount;
                  break;
                }
              }
            } catch {
              // Ignore logs from non-matching events
            }
          }
        }

        if (!validPaymentFound) {
          res.status(402).json({
            status: 402,
            error: "Invalid Payment Transfer",
            message: `Transaction ${txHash} did not contain a transfer of at least 0.01 USDC (${this.requiredAmountAtomic} atomic units) to recipient ${this.recipientAddress}.`,
            paymentDetails: this.getPaymentDetails()
          });
          return;
        }

        // 5. Register txHash as redeemed and attach metadata to request
        this.processedTransactions.add(normalizedTxHash);
        req.payment = {
          txHash: normalizedTxHash,
          payer: payerAddress,
          recipient: this.recipientAddress,
          amount: (Number(paidAmount) / 1e6).toFixed(2),
          verifiedAt: Date.now()
        };

        // Payment validated successfully -> proceed to protected route
        next();
      } catch (err: any) {
        console.error("[x402 Verification Error]:", err);
        res.status(500).json({
          status: 500,
          error: "Payment Verification Internal Error",
          message: err.message || "Failed to verify transaction on Avalanche Fuji C-Chain."
        });
      }
    };
  }
}
