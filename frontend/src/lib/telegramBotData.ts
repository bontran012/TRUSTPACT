// TrustPact Telegram Bot Threat Intelligence & Directory
export interface KnownScamItem {
  identifier: string;
  type: string;
  bankName?: string;
  reportsCount: number;
  isVerified: boolean;
  reason: string;
  victimLoss: string;
  timestamp: string;
}

export interface TrustedUserItem {
  id: string;
  username: string;
  name: string;
  role: string;
  walletAddress: string;
  telegram: string;
  zalo: string;
  facebook: string;
  successRate: number;
  completedDeals: number;
  stakedUsdc: number;
}

export const KNOWN_SCAM_DATABASE: KnownScamItem[] = [
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

export const TRUSTED_USERS_DATABASE: TrustedUserItem[] = [
  {
    id: "TP-1001",
    username: "tuan_buyer",
    name: "Lê Minh Tuấn",
    role: "Bên Mua (Buyer)",
    walletAddress: "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
    telegram: "@tuan_buyer",
    zalo: "0909112233",
    facebook: "https://facebook.com/tuan.le.crypto",
    successRate: 100,
    completedDeals: 18,
    stakedUsdc: 0,
  },
  {
    id: "TP-2002",
    username: "hoangminh_otc",
    name: "Hoàng Minh OTC",
    role: "Merchant Bán (OTC)",
    walletAddress: "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
    telegram: "@hoangminh_otc",
    zalo: "0988776655",
    facebook: "https://facebook.com/hoangminh.otc",
    successRate: 99.4,
    completedDeals: 142,
    stakedUsdc: 2500,
  },
  {
    id: "TP-3003",
    username: "nam_broker",
    name: "Nguyễn Nam (Giám Định Viên)",
    role: "GDTG Bảo Chứng (Broker)",
    walletAddress: "0x30F1492bC78E12a899Ad34De91eF11B12E7a889A",
    telegram: "@nam_escrow_official",
    zalo: "0912345678",
    facebook: "https://facebook.com/nam.escrow.official",
    successRate: 100,
    completedDeals: 128,
    stakedUsdc: 5000,
  },
  {
    id: "TP-9999",
    username: "super_admin",
    name: "Quản Trị Viên Tối Cao (TrustPact Admin)",
    role: "Quản Trị Viên (Admin)",
    walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    telegram: "@TrustPact_Sentinel_bot",
    zalo: "0900009999",
    facebook: "https://facebook.com/trustpact.official",
    successRate: 100,
    completedDeals: 999,
    stakedUsdc: 50000,
  },
];

export function lookupTarget(query: string) {
  if (!query || typeof query !== "string") return null;
  const clean = query.trim().replace(/^@/, "").toLowerCase();
  if (!clean) return null;

  // 1. Check Scam Blacklist
  const matchedScam = KNOWN_SCAM_DATABASE.find((s) => {
    const sId = s.identifier.toLowerCase();
    const sIdNoSpace = s.identifier.replace(/\s+/g, "");
    return clean === sId || clean === sIdNoSpace || clean.includes(sId) || clean.includes(sIdNoSpace);
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

export function getStartMessage(firstName: string = "Bạn") {
  return `
🛡️ <b>TRUSTPACT SENTINEL — HỆ THỐNG GÁC ĐỀN ON-CHAIN</b>

Chào <b>${firstName}</b>! Bot hỗ trợ bạn tra cứu cảnh báo lừa đảo và kiểm tra độ uy tín của đối tác trước khi giao dịch tiền thật.

👉 <b>BẠN KHÔNG CẦN GÕ LỆNH GÌ CẢ!</b>
Chỉ cần <b>gửi trực tiếp</b> thông tin cần tra cứu vào đây:
• <b>Số tài khoản ngân hàng:</b> vd <code>1903889922101</code>
• <b>Số điện thoại:</b> vd <code>0909123456</code>
• <b>User / Telegram:</b> vd <code>@hoangminh_otc</code>
• <b>Địa chỉ ví Web3:</b> vd <code>0x89C3...</code>

⚡ <i>Bot sẽ tự động quét cơ sở dữ liệu Sổ Đen L1 và Hộ Chiếu Tín Nhiệm SBT để trả kết quả ngay lập tức!</i>
`;
}

export function formatLookupResponse(query: string, publicUrl: string = "https://trustpact.network") {
  const result = lookupTarget(query);
  if (!result) {
    return {
      text: "❌ <b>Vui lòng nhập thông tin cần tra cứu!</b>\nVí dụ gửi trực tiếp: <code>1903889922101</code> hoặc <code>@hoangminh_otc</code>",
    };
  }

  // Case 1: Flagged as SCAM
  if (result.scam) {
    const s = result.scam;
    const text = `
🚨 <b>PHÁT HIỆN CẢNH BÁO LỪA ĐẢO TRÊN TRUSTPACT L1!</b>
━━━━━━━━━━━━━━━━━━━━━
⚠️ <b>Đối tượng:</b> <code>${s.identifier}</code> ${s.bankName ? `(${s.bankName})` : ""}
🏷️ <b>Phân loại:</b> ${s.type}
📊 <b>Hồ sơ vi phạm:</b> <b>${s.reportsCount} Báo Cáo On-Chain</b>
⚖️ <b>Kiểm duyệt:</b> ${s.isVerified ? "✅ Đã xác thực bằng chứng" : "⏳ Báo cáo cộng đồng"}
📝 <b>Tội danh ghi nhận:</b> <i>"${s.reason}"</i>
💰 <b>Tổng thiệt hại ước tính:</b> <b>${s.victimLoss}</b>
📅 <b>Ngày ghi sổ đen L1:</b> ${s.timestamp}
━━━━━━━━━━━━━━━━━━━━━
⛔ <b>KHUYẾN NGHỊ: DỪNG TẤT CẢ GIAO DỊCH VỚI ĐỐI TƯỢNG NÀY ĐỂ TRÁNH MẤT TIỀN!</b>
`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: "🔍 Xem Chi Tiết Trên Web", url: `${publicUrl}/?q=${encodeURIComponent(query)}` },
        ],
        [
          { text: "📢 Báo Cáo Thêm Bằng Chứng Lên L1", url: `${publicUrl}/?report=${encodeURIComponent(query)}` },
        ],
      ],
    };

    return { text, replyMarkup };
  }

  // Case 2: Registered Trusted User
  if (result.user) {
    const u = result.user;
    const text = `
🛡️ <b>KẾT QUẢ: THÀNH VIÊN ĐÃ BẢO CHỨNG TÍN NHIỆM SBT</b>
━━━━━━━━━━━━━━━━━━━━━
👤 <b>Họ tên:</b> <b>${u.name}</b>
🆔 <b>User:</b> <code>@${u.username}</code> (Mã ID: <code>${u.id}</code>)
🎖️ <b>Vai trò:</b> <b>${u.role}</b>
💎 <b>Uy tín Soulbound (SBT):</b> <b>${u.successRate}% Hoàn Thành</b>
✅ <b>Số kèo thành công:</b> <b>${u.completedDeals} kèo uy tín</b>
🔒 <b>Cọc bảo chứng Aave V3:</b> <b>${u.stakedUsdc.toLocaleString()} USDC</b>
━━━━━━━━━━━━━━━━━━━━━
📞 <b>Kênh liên hệ chính chủ:</b>
• <b>Telegram:</b> ${u.telegram}
• <b>Zalo:</b> <code>${u.zalo}</code>
• <b>Facebook:</b> ${u.facebook}
• <b>Địa chỉ ví:</b> <code>${u.walletAddress.slice(0, 8)}...${u.walletAddress.slice(-6)}</code>
━━━━━━━━━━━━━━━━━━━━━
✅ <i>Không có bất kỳ cảnh báo lừa đảo nào trên TrustPact Custom L1. Để an toàn tuyệt đối, hãy mở phòng Két Sắt 3 Bên trước khi chuyển tiền!</i>
`;

    const replyMarkup = {
      inline_keyboard: [
        [
          { text: "🔐 Mở Phòng Két Sắt Với Đối Tác Này", url: `${publicUrl}/pact/create?seller=${u.walletAddress}` },
        ],
        [
          { text: "🌐 Xem Thẻ Căn Cước Web3", url: `${publicUrl}/?sbt=${u.walletAddress}` },
        ],
      ],
    };

    return { text, replyMarkup };
  }

  // Case 3: Clean / Not Flagged
  const text = `
✅ <b>KHÔNG PHÁT HIỆN CẢNH BÁO TRÊN SỔ ĐEN L1</b>
━━━━━━━━━━━━━━━━━━━━━
🔍 <b>Định danh:</b> <code>${query}</code>
⚡ <b>Trạng thái:</b> Sạch sẽ (0 lượt tố cáo)
🛡️ <b>Cơ sở dữ liệu:</b> Avalanche Custom L1 Subnet

💡 <i>Lưu ý: Đối tượng này chưa từng bị tố cáo, nhưng có thể là tài khoản mới. Khuyến nghị luôn yêu cầu giao dịch qua Két Sắt Ký Quỹ 3 Bên (Universal Escrow) để bảo đảm tiền của bạn được giữ an toàn 100%!</i>
`;

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: "🔒 Mở Két Sắt Giao Dịch Ngay", url: `${publicUrl}/pact/create` },
      ],
      [
        { text: "👥 Thêm Bot Vào Nhóm Chat", url: `https://t.me/TrustPact_Sentinel_bot?startgroup=true` },
      ],
    ],
  };

  return { text, replyMarkup };
}
