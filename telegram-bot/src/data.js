// TrustPact Telegram Bot Database & Lookup Engine
const KNOWN_SCAM_DATABASE = [
  {
    identifier: "1903889922101",
    type: "STK Ngân hàng",
    bankName: "Techcombank",
    reportsCount: 2,
    isVerified: true,
    reason: "Nhận tiền cọc OTC 500 USDT xong chặn Telegram nạn nhân",
    victimLoss: "12,850,000 VNĐ",
    timestamp: "18/10/2026",
  },
  {
    identifier: "0909123456",
    type: "Số điện thoại",
    reportsCount: 1,
    isVerified: false,
    reason: "Mạo danh Admin OTC yêu cầu chuyển tiền cọc bảo chứng",
    victimLoss: "5,000,000 VNĐ",
    timestamp: "19/10/2026",
  },
  {
    identifier: "otc_vn_fake_admin",
    type: "Telegram Handle",
    reportsCount: 3,
    isVerified: true,
    reason: "Tạo nick fake có avatar và bio y hệt GDTG uy tín để đi lừa đảo",
    victimLoss: "34,000,000 VNĐ",
    timestamp: "20/10/2026",
  },
];

const TRUSTED_USERS_DATABASE = [
  {
    id: "TP-2002",
    username: "hoangminh_otc",
    name: "Hoàng Minh OTC",
    role: "Merchant Bán (OTC)",
    walletAddress: "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
    telegram: "@hoangminh_otc",
    zalo: "0987654321",
    facebook: "https://facebook.com/hoangminh.otc.pact",
    successRate: 99.8,
    completedDeals: 128,
    stakedUsdc: 5000,
  },
  {
    id: "TP-3003",
    username: "nam_broker",
    name: "Nguyễn Nam (Escrow)",
    role: "GDTG Bảo Chứng (Broker)",
    walletAddress: "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
    telegram: "@nam_escrow_broker",
    zalo: "0909888999",
    facebook: "https://facebook.com/nam.fintech.broker",
    successRate: 100,
    completedDeals: 342,
    stakedUsdc: 10000,
  },
  {
    id: "TP-1001",
    username: "tuan_buyer",
    name: "Lê Minh Tuấn",
    role: "Bên Mua (Buyer)",
    walletAddress: "0x3A52c5d6e7f80000000000000000000000000001",
    telegram: "@tuan_buyer_pact",
    zalo: "0912345678",
    facebook: "https://facebook.com/tuan.buyer.crypto",
    successRate: 100,
    completedDeals: 45,
    stakedUsdc: 2500,
  },
];

function lookupTarget(query) {
  if (!query || typeof query !== "string") return null;
  const clean = query.trim().replace(/^@/, "").toLowerCase();
  if (!clean) return null;

  // 1. Check Scam Blacklist
  const matchedScam = KNOWN_SCAM_DATABASE.find(
    (s) => s.identifier.toLowerCase() === clean || s.identifier.replace(/\s+/g, "") === clean
  );

  // 2. Check Trusted Registry
  const matchedUser = TRUSTED_USERS_DATABASE.find(
    (u) =>
      u.username.toLowerCase() === clean ||
      u.id.toLowerCase() === clean ||
      u.walletAddress.toLowerCase() === clean ||
      u.zalo.replace(/\s+/g, "") === clean ||
      u.telegram.toLowerCase().replace(/^@/, "") === clean
  );

  return {
    query,
    clean,
    scam: matchedScam || null,
    user: matchedUser || null,
  };
}

module.exports = {
  KNOWN_SCAM_DATABASE,
  TRUSTED_USERS_DATABASE,
  lookupTarget,
};
