import { formatUnits, parseUnits } from "viem";

export const CONTRACT_ADDRESSES = {
  universalEscrow: (process.env.NEXT_PUBLIC_UNIVERSAL_ESCROW || "0xb3e0586F61a2dC5C1055528f0939E2fbDcE38Ad0") as `0x${string}`,
  stakedBrokerRegistry: (process.env.NEXT_PUBLIC_BROKER_REGISTRY || "0x7eB341096Ca95BB4F227A10daEd9c413F2F60Ca2") as `0x${string}`,
  trustPassportSBT: (process.env.NEXT_PUBLIC_TRUST_PASSPORT_SBT || "0x84d9F79A513D5CBFe6dC1E5B971cc811e64d3296") as `0x${string}`,
  scamRegistryL1: (process.env.NEXT_PUBLIC_SCAM_REGISTRY_L1 || "0x3f8C012cee1412170386a6a8C8968F903C8f3362") as `0x${string}`,
  usdc: (process.env.NEXT_PUBLIC_USDC_ADDRESS || "0x5425890298aed601595a70AB815c96711a31Bc65") as `0x${string}`,
  aUsdc: (process.env.NEXT_PUBLIC_A_USDC_ADDRESS || "0x8B9b2AF4afB389b4a70A474dfD4AdCD4a302bb40") as `0x${string}`,
  aaveV3Pool: (process.env.NEXT_PUBLIC_FUJI_AAVE_V3_POOL || "0x8B9b2AF4afB389b4a70A474dfD4AdCD4a302bb40") as `0x${string}`,
};

export const UNIVERSAL_ESCROW_ABI = [
  {
    type: "function",
    name: "createEscrow",
    inputs: [
      { name: "_seller", type: "address" },
      { name: "_broker", type: "address" },
      { name: "_amount", type: "uint256" },
      { name: "_duration", type: "uint256" },
      { name: "_brokerFeeBps", type: "uint256" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "brokerRelease",
    inputs: [{ name: "_id", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "buyerConfirmDelivery",
    inputs: [{ name: "_id", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "brokerRefundBuyer",
    inputs: [{ name: "_id", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "brokerSettle",
    inputs: [
      { name: "_id", type: "uint256" },
      { name: "_refundToBuyer", type: "uint256" },
      { name: "_payoutToSeller", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "buyerClaimExpiredRefund",
    inputs: [{ name: "_id", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "mutualCancelEscrow",
    inputs: [{ name: "_id", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "adminSlashCorruptBroker",
    inputs: [
      { name: "_id", type: "uint256" },
      { name: "_compensation", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "rateAndTip",
    inputs: [
      { name: "_id", type: "uint256" },
      { name: "_stars", type: "uint8" },
      { name: "_tipAmount", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getEscrow",
    inputs: [{ name: "_id", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "id", type: "uint256" },
          { name: "buyer", type: "address" },
          { name: "seller", type: "address" },
          { name: "broker", type: "address" },
          { name: "amount", type: "uint256" },
          { name: "brokerFeeBps", type: "uint256" },
          { name: "duration", type: "uint256" },
          { name: "startTime", type: "uint256" },
          { name: "status", type: "uint8" }, // 0: Active, 1: Completed, 2: Cancelled
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isExpired",
    inputs: [{ name: "_id", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "counter",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "buyerCancelApproved",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "sellerCancelApproved",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isRated",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "admin",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "treasury",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "PROTOCOL_FEE_BPS",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const STAKED_BROKER_REGISTRY_ABI = [
  {
    type: "function",
    name: "stakeInsurance",
    inputs: [{ name: "_amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "unstakeInsurance",
    inputs: [{ name: "_amount", type: "uint256" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "brokers",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "principalDeposited", type: "uint256" },
      { name: "stakedBalance", type: "uint256" },
      { name: "activeHoldingAllocated", type: "uint256" },
      { name: "successfulDeals", type: "uint256" },
      { name: "totalDeals", type: "uint256" },
      { name: "slashedCount", type: "uint256" },
      { name: "isVerified", type: "bool" },
      { name: "isBlacklisted", type: "bool" },
      { name: "lastActiveTimestamp", type: "uint256" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getProfile",
    inputs: [{ name: "_broker", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "principalDeposited", type: "uint256" },
          { name: "stakedBalance", type: "uint256" },
          { name: "activeHoldingAllocated", type: "uint256" },
          { name: "successfulDeals", type: "uint256" },
          { name: "totalDeals", type: "uint256" },
          { name: "slashedCount", type: "uint256" },
          { name: "isVerified", type: "bool" },
          { name: "isBlacklisted", type: "bool" },
          { name: "lastActiveTimestamp", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAvailableQuota",
    inputs: [{ name: "_broker", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEstimatedYield",
    inputs: [{ name: "_broker", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getTotalAccruedYield",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "totalPrincipal",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isBrokerVerified",
    inputs: [{ name: "_broker", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "quotaMultiplierBps",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const SCAM_REGISTRY_L1_ABI = [
  {
    type: "function",
    name: "reportScam",
    inputs: [
      { name: "_identifier", type: "string" },
      { name: "_category", type: "string" },
      { name: "_evidenceHash", type: "string" },
      { name: "_description", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "checkScam",
    inputs: [{ name: "_identifier", type: "string" }],
    outputs: [
      { name: "count", type: "uint256" },
      { name: "hasVerified", type: "bool" },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getReports",
    inputs: [{ name: "_identifier", type: "string" }],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "reporter", type: "address" },
          { name: "identifier", type: "string" },
          { name: "category", type: "string" },
          { name: "evidenceHash", type: "string" },
          { name: "description", type: "string" },
          { name: "timestamp", type: "uint256" },
          { name: "isVerified", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "verifyReport",
    inputs: [
      { name: "_identifier", type: "string" },
      { name: "_index", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "totalReports",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const TRUST_PASSPORT_SBT_ABI = [
  {
    type: "function",
    name: "getProfile",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "successfulDeals", type: "uint256" },
          { name: "totalDeals", type: "uint256" },
          { name: "totalVolumeUSDC", type: "uint256" },
          { name: "stakedAmount", type: "uint256" },
          { name: "slashedCount", type: "uint256" },
          { name: "lastUpdated", type: "uint256" },
          { name: "totalRatingStars", type: "uint256" },
          { name: "ratingCount", type: "uint256" },
          { name: "totalTipsReceived", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getSuccessRate",
    inputs: [{ name: "_user", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
] as const;

export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "allowance",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
] as const;

/* Numeric & Address Helpers */

export function formatUsdc(val?: bigint | number | string): string {
  if (val === undefined || val === null) return "0.00";
  try {
    const raw = typeof val === "bigint" ? val : BigInt(val);
    const formatted = formatUnits(raw, 6);
    const num = parseFloat(formatted);
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return "0.00";
  }
}

export function parseUsdc(val: string | number): bigint {
  try {
    const clean = String(val).replace(/,/g, "").trim();
    if (!clean || isNaN(Number(clean))) return BigInt(0);
    return parseUnits(clean, 6);
  } catch {
    return BigInt(0);
  }
}

export function shortenAddress(addr?: string): string {
  if (!addr) return "0x0000...0000";
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function parseContractError(err: any): string {
  const msg = err?.message || err?.shortMessage || String(err);
  if (msg.includes("Broker insufficient quota")) {
    return "Hạn mức bảo lãnh khả dụng của GDTG không đủ cho giá trị giao dịch này.";
  }
  if (msg.includes("Stake is backing active deals")) {
    return "Tiền cọc đang bảo chứng cho các kèo mở, không thể rút vượt quá hạn mức rảnh.";
  }
  if (msg.includes("Roles must differ")) {
    return "Bên Mua, Bên Bán và GDTG (Broker) phải là 3 địa chỉ ví khác nhau.";
  }
  if (msg.includes("Not expired")) {
    return "Hợp đồng chưa hết hạn bàn giao, tính năng tự động rút tiền chưa được mở khóa.";
  }
  if (msg.includes("Only broker")) {
    return "Chỉ có GDTG (Broker) được chỉ định mới có quyền thực hiện thao tác này.";
  }
  if (msg.includes("Only buyer")) {
    return "Chỉ có Bên Mua (người nạp tiền) mới có quyền thực hiện lệnh này.";
  }
  if (msg.includes("User rejected")) {
    return "Giao dịch đã bị hủy bởi người dùng trên ví.";
  }
  if (msg.includes("insufficient funds")) {
    return "Số dư AVAX trong ví không đủ để thanh toán phí mạng.";
  }
  return msg.length > 100 ? `${msg.slice(0, 100)}...` : msg;
}

export function getSnowtraceAddressUrl(address: string): string {
  return `https://testnet.snowtrace.io/address/${address}`;
}

export function getSnowtraceTxUrl(txHash: string): string {
  return `https://testnet.snowtrace.io/tx/${txHash}`;
}

export const VERIFIED_FUJI_CONTRACTS = [
  {
    name: "UniversalEscrow",
    title: "Két Sắt Ký Quỹ 3 Bên (Tri-Party Escrow)",
    purpose: "Bảo đảm thực hiện nghĩa vụ dân sự theo Điều 292 & Điều 328 Bộ luật Dân sự 2015. Tự động thanh toán/hoàn tiền.",
    address: CONTRACT_ADDRESSES.universalEscrow,
    explorer: `https://testnet.snowtrace.io/address/${CONTRACT_ADDRESSES.universalEscrow}`,
    subnetsExplorer: `https://subnets-test.avax.network/c-chain/address/${CONTRACT_ADDRESSES.universalEscrow}`,
  },
  {
    name: "StakedBrokerRegistry",
    title: "Sổ Ký Cược Broker & Sinh Lãi Aave V3",
    purpose: "Broker nạp bảo chứng ký cược nhận hạn mức; tự động gửi Aave V3 sinh lãi thực tế 80% cho Broker, 20% quỹ bảo hiểm.",
    address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
    explorer: `https://testnet.snowtrace.io/address/${CONTRACT_ADDRESSES.stakedBrokerRegistry}`,
    subnetsExplorer: `https://subnets-test.avax.network/c-chain/address/${CONTRACT_ADDRESSES.stakedBrokerRegistry}`,
  },
  {
    name: "TrustPassportSBT",
    title: "Hộ Chiếu Tín Nhiệm Linh Hồn (ERC-721 SBT)",
    purpose: "Chứng chỉ uy tín bất biến gắn chặt ví Broker (Non-transferable), ngăn chặn mua bán nick hay ngụy tạo đánh giá.",
    address: CONTRACT_ADDRESSES.trustPassportSBT,
    explorer: `https://testnet.snowtrace.io/address/${CONTRACT_ADDRESSES.trustPassportSBT}`,
    subnetsExplorer: `https://subnets-test.avax.network/c-chain/address/${CONTRACT_ADDRESSES.trustPassportSBT}`,
  },
  {
    name: "ScamRegistryL1",
    title: "Radar Chống Lừa Đảo Avalanche L1 (Zero-Gas)",
    purpose: "Kho dữ liệu cảnh báo lừa đảo STK/Ví/SĐT cộng đồng với chi phí gas = 0, kết nối bot Telegram & Teleporter.",
    address: CONTRACT_ADDRESSES.scamRegistryL1,
    explorer: `https://testnet.snowtrace.io/address/${CONTRACT_ADDRESSES.scamRegistryL1}`,
    subnetsExplorer: `https://subnets-test.avax.network/c-chain/address/${CONTRACT_ADDRESSES.scamRegistryL1}`,
  },
];
