// TrustPact Telegram Bot Database & Lookup Engine
const fs = require("fs");
const path = require("path");

const KNOWN_SCAM_DATABASE = [
  {
    identifier: "1903889922101",
    type: "STK Ngân hàng",
    bankName: "Techcombank",
    reportsCount: 5,
    isVerified: true,
    reason: "Giả mạo GDTG Telegram trung gian chiếm đoạt 1,200 USDC giao dịch P2P",
    victimLoss: "1,200 USDC (~30.5 Triệu VNĐ)",
    timestamp: "18/10/2026",
  },
  {
    identifier: "0451000399482",
    type: "STK Ngân hàng",
    bankName: "Vietcombank",
    reportsCount: 3,
    isVerified: true,
    reason: "Nhận cọc mua USDT rồi cắt đứt liên lạc, chặn Telegram nạn nhân",
    victimLoss: "500 USDC (~12.7 Triệu VNĐ)",
    timestamp: "19/10/2026",
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
  {
    identifier: "@hoangminh_otc_fake",
    type: "Username Telegram",
    reportsCount: 8,
    isVerified: true,
    reason: "Fake nick GDTG Hoàng Minh (thay chữ l bằng chữ I hoa) để lừa nhận cọc",
    victimLoss: "2,500 USDC (~63.5 Triệu VNĐ)",
    timestamp: "20/10/2026",
  },
];

function getCombinedScams() {
  const list = [...KNOWN_SCAM_DATABASE];
  try {
    const storePath = path.resolve(__dirname, "../../frontend/data/trustpact_store.json");
    if (fs.existsSync(storePath)) {
      const db = JSON.parse(fs.readFileSync(storePath, "utf8"));
      if (Array.isArray(db.scams)) {
        for (const s of db.scams) {
          if (!list.some((x) => x.identifier.toLowerCase() === s.identifier.toLowerCase())) {
            list.push({
              identifier: s.identifier,
              type: s.type || "Tài khoản đáng ngờ",
              bankName: s.bankName || "",
              reportsCount: s.reportsCount || 1,
              isVerified: s.isVerified || false,
              reason: s.reason,
              victimLoss: s.victimLoss || "Chưa xác định",
              timestamp: s.timestamp || "Mới ghi nhận",
            });
          }
        }
      }
    }
  } catch (e) {}
  return list;
}

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

  const allScams = getCombinedScams();
  // 1. Check Scam Blacklist (exact or substring match if message contains the scam identifier)
  const matchedScam = allScams.find((s) => {
    const sId = s.identifier.toLowerCase().replace(/^@/, "");
    const sIdNoSpace = sId.replace(/\s+/g, "");
    const cleanNoSpace = clean.replace(/\s+/g, "");
    return clean === sId || cleanNoSpace === sIdNoSpace || cleanNoSpace.includes(sIdNoSpace) || sIdNoSpace.includes(cleanNoSpace);
  });

  // 2. Check Trusted Registry
  const matchedUser = TRUSTED_USERS_DATABASE.find((u) => {
    const uName = u.username.toLowerCase();
    const uId = u.id.toLowerCase();
    const uWallet = u.walletAddress.toLowerCase();
    const uZalo = u.zalo.replace(/\s+/g, "");
    const uTele = u.telegram.toLowerCase().replace(/^@/, "");

    return (
      clean === uName ||
      clean === uId ||
      clean === uWallet ||
      clean === uZalo ||
      clean === uTele ||
      clean.includes(uName) ||
      clean.includes(uZalo) ||
      clean.includes(uTele)
    );
  });

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
