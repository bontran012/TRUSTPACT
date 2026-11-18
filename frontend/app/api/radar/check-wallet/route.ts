import { NextRequest, NextResponse } from "next/server";
import { SEED_SCAM_DATABASE } from "@/src/data/seedScamDatabase";

export interface WalletSecurityAnalysis {
  address: string;
  isMalicious: boolean;
  riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "SAFE";
  riskScore: number; // 0 (safest) to 100 (most dangerous)
  detectedThreats: string[];
  isContract: boolean;
  oracleSource: string;
  details: {
    cybercrime: boolean;
    phishing: boolean;
    moneyLaundering: boolean;
    stealingAttack: boolean;
    fakeToken: boolean;
    blacklistDoubt: boolean;
    maliciousMining: boolean;
    sanctioned: boolean;
  };
  knownIncident?: {
    owner: string;
    description: string;
    amountLoss: string;
    flagsCount: number;
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim().toLowerCase();

  if (!address || !address.startsWith("0x") || address.length !== 42) {
    return NextResponse.json(
      { success: false, error: "Địa chỉ ví không hợp lệ (cần 42 ký tự định dạng 0x...)" },
      { status: 400 }
    );
  }

  // 1. Check local seed scam database first
  const localMatch = SEED_SCAM_DATABASE.find(
    (item) => item.type === "wallet" && item.target.toLowerCase() === address
  );

  let goplusResult: any = null;
  let oracleFailed = false;

  // 2. Query GoPlus Security API (Chain 43114 Avalanche Fuji / Mainnet, fallback Chain 1)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    // Query Avalanche C-chain
    const res = await fetch(
      `https://api.gopluslabs.io/api/v1/address_security/${address}?chain_id=43114`,
      {
        signal: controller.signal,
        headers: { Accept: "application/json" },
        next: { revalidate: 300 }, // Cache 5 minutes
      }
    );
    clearTimeout(timeoutId);

    if (res.ok) {
      const json = await res.json();
      if (json.code === 1 && json.result) {
        goplusResult = json.result;
      }
    }
  } catch (err) {
    console.warn("GoPlus Avalanche query error/timeout:", err);
    oracleFailed = true;
  }

  // Fallback to Ethereum chain if Avalanche yielded empty or failed
  if (!goplusResult) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(
        `https://api.gopluslabs.io/api/v1/address_security/${address}?chain_id=1`,
        {
          signal: controller.signal,
          headers: { Accept: "application/json" },
          next: { revalidate: 300 },
        }
      );
      clearTimeout(timeoutId);
      if (res.ok) {
        const json = await res.json();
        if (json.code === 1 && json.result) {
          goplusResult = json.result;
        }
      }
    } catch {
      // Ignore fallback error
    }
  }

  // 3. Compile Security Analysis
  const threats: string[] = [];
  let riskScore = 0;

  const isPhishing = goplusResult?.phishing_activities === "1";
  const isCybercrime = goplusResult?.cybercrime === "1";
  const isMoneyLaundering = goplusResult?.money_laundering === "1";
  const isStealing = goplusResult?.stealing_attack === "1";
  const isFakeToken = goplusResult?.fake_token === "1";
  const isBlacklistDoubt = goplusResult?.blacklist_doubt === "1";
  const isMaliciousMining = goplusResult?.malicious_mining_activities === "1";
  const isSanctioned = goplusResult?.sanctioned === "1";
  const isContract = goplusResult?.contract_address === "1";

  if (isPhishing) {
    threats.push("Phishing Link / Drainer rút cạn tiền ví");
    riskScore += 45;
  }
  if (isCybercrime) {
    threats.push("Tội phạm mạng (Cybercrime Activities)");
    riskScore += 40;
  }
  if (isStealing) {
    threats.push("Hành vi tấn công đánh cắp tài sản (Stealing Attack)");
    riskScore += 40;
  }
  if (isMoneyLaundering) {
    threats.push("Liên quan dòng tiền rửa qua Crypto Mixer");
    riskScore += 30;
  }
  if (isFakeToken) {
    threats.push("Tạo token rác giả mạo danh tính coin lớn");
    riskScore += 25;
  }
  if (isBlacklistDoubt) {
    threats.push("Nằm trong danh sách nghi vấn Blacklist quốc tế");
    riskScore += 20;
  }
  if (isSanctioned) {
    threats.push("Địa chỉ ví trong danh sách trừng phạt quốc tế OFAC");
    riskScore += 50;
  }

  if (localMatch) {
    threats.push(`Cộng đồng TrustPact tố cáo: ${localMatch.scamCategory}`);
    riskScore += 50;
  }

  riskScore = Math.min(100, riskScore);

  const isMalicious = riskScore >= 30 || !!localMatch || isPhishing || isCybercrime || isStealing;

  const riskLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "SAFE" =
    riskScore >= 70
      ? "CRITICAL"
      : riskScore >= 40
      ? "HIGH"
      : riskScore > 0
      ? "MEDIUM"
      : "SAFE";

  const analysis: WalletSecurityAnalysis = {
    address,
    isMalicious,
    riskLevel,
    riskScore,
    detectedThreats: threats,
    isContract,
    oracleSource: goplusResult
      ? "GoPlus Security Oracle (Real-time Web3 Intelligence)"
      : "TrustPact On-Chain & Community Registry",
    details: {
      cybercrime: isCybercrime,
      phishing: isPhishing,
      moneyLaundering: isMoneyLaundering,
      stealingAttack: isStealing,
      fakeToken: isFakeToken,
      blacklistDoubt: isBlacklistDoubt,
      maliciousMining: isMaliciousMining,
      sanctioned: isSanctioned,
    },
    knownIncident: localMatch
      ? {
          owner: localMatch.owner,
          description: localMatch.description,
          amountLoss: localMatch.amountLoss,
          flagsCount: localMatch.flagsCount,
        }
      : undefined,
  };

  return NextResponse.json({ success: true, data: analysis });
}
