// TrustPact Telegram Bot Runner (Zero external dependencies)
const { lookupTarget, KNOWN_SCAM_DATABASE } = require("./data");

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const WEB_URL = process.env.TRUSTPACT_WEB_URL || "http://localhost:3000";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function sendTelegramMessage(chatId, text, replyMarkup) {
  if (!BOT_TOKEN || BOT_TOKEN === "your_telegram_bot_token_here") {
    console.log(`[SIMULATION BOT] To Chat ${chatId}:\n${text}\n---`);
    return;
  }

  try {
    const payload = {
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error("Lỗi khi gửi tin nhắn Telegram:", err);
  }
}

function getStartMessage(firstName = "Bạn") {
  return `
🛡️ <b>CHÀO MỪNG ${firstName.toUpperCase()} ĐẾN VỚI TRUSTPACT SCAM RADAR BOT!</b>

Bot hỗ trợ bạn kiểm tra nhanh số tài khoản ngân hàng, User, hoặc địa chỉ ví có nằm trong <b>Sổ Đen Lừa Đảo L1</b> hay không trước khi giao dịch tiền thật.

📌 <b>CÁC LỆNH HỖ TRỢ:</b>
• <code>/check &lt;STK hoặc @username&gt;</code> — Tra cứu cảnh báo lừa đảo & SBT Tín Nhiệm
• <code>/pact</code> — Mở phòng Két Sắt 3 Bên bảo vệ dòng tiền
• <code>/help</code> — Xem hướng dẫn chi tiết

💡 <i>Mẹo: Bạn có thể thêm bot này vào nhóm Telegram OTC. Bot sẽ tự động cảnh báo ngay khi phát hiện STK lừa đảo xuất hiện trong tin nhắn của nhóm!</i>
`;
}

function formatLookupResponse(query) {
  const result = lookupTarget(query);
  if (!result) {
    return {
      text: "❌ <b>Vui lòng nhập định danh cần tra cứu!</b>\nVí dụ: <code>/check 1903889922101</code> hoặc <code>/check @hoangminh_otc</code>",
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
          { text: "🔍 Xem Hồ Sơ Chi Tiết Trên Web", url: `${WEB_URL}/?q=${encodeURIComponent(query)}` },
        ],
        [
          { text: "📢 Báo Cáo Thêm Bằng Chứng Lên L1", url: `${WEB_URL}/?report=${encodeURIComponent(query)}` },
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
          { text: "🔐 Mở Phòng Két Sắt Với Đối Tác Này", url: `${WEB_URL}/pact/create?seller=${u.walletAddress}` },
        ],
        [
          { text: "🌐 Xem Thẻ Căn Cước Web3", url: `${WEB_URL}/?sbt=${u.walletAddress}` },
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
        { text: "🔒 Mở Két Sắt Giao Dịch Ngay", url: `${WEB_URL}/pact/create` },
      ],
      [
        { text: "📱 Chia Sẻ Kết Quả Này", switch_inline_query: query },
      ],
    ],
  };

  return { text, replyMarkup };
}

async function handleUpdate(update) {
  if (!update.message || !update.message.text) return;

  const msg = update.message;
  const chatId = msg.chat.id;
  const rawText = msg.text.trim();
  const firstName = msg.from?.first_name || "Bạn";

  console.log(`[TELEGRAM] [Chat:${chatId}] [User:${msg.from?.username || firstName}]: ${rawText}`);

  if (rawText.startsWith("/start") || rawText.startsWith("/help")) {
    const startMsg = getStartMessage(firstName);
    const replyMarkup = {
      inline_keyboard: [
        [
          { text: "🔍 Tra Cứu Thử STK Lừa Đảo", callback_data: "check_scam" },
          { text: "⭐ Tra Cứu GDTG Uy Tín", callback_data: "check_broker" },
        ],
        [
          { text: "🌐 Mở DApp Web TrustPact", url: WEB_URL },
          { text: "👥 Thêm Bot Vào Nhóm Chat", url: `https://t.me/TrustPactRadarBot?startgroup=true` },
        ],
      ],
    };
    await sendTelegramMessage(chatId, startMsg, replyMarkup);
    return;
  }

  if (rawText.startsWith("/check ") || rawText.startsWith("/radar ") || rawText.startsWith("/tim ")) {
    const parts = rawText.split(" ");
    const query = parts.slice(1).join(" ").trim();
    const res = formatLookupResponse(query);
    await sendTelegramMessage(chatId, res.text, res.replyMarkup);
    return;
  }

  if (rawText.startsWith("/pact") || rawText.startsWith("/escrow")) {
    const text = `
🔐 <b>KHỞI TẠO KÉT SẮT 3 BÊN BẢO CHỨNG (TRUSTPACT ESCROW)</b>

• <b>Cơ chế:</b> Người mua nạp tiền vào Két Smart Contract. Tiền sinh lãi qua Aave V3.
• <b>GDTG (Broker):</b> Đã đặt cọc 5,000 - 10,000 USDC cam kết phân xử công minh.
• <b>Bảo vệ:</b> Hàng nhận đủ ➔ GDTG bấm giải ngân. Gặp scam ➔ Hoàn tiền 100%.

👉 Bấm nút bên dưới để mở phòng ký quỹ an toàn:
`;
    const replyMarkup = {
      inline_keyboard: [
        [{ text: "🚀 Khởi Tạo Kèo Ký Quỹ Mới", url: `${WEB_URL}/pact/create` }],
        [{ text: "📋 Xem Sổ Kèo Đang Chạy", url: `${WEB_URL}/pact` }],
      ],
    };
    await sendTelegramMessage(chatId, text, replyMarkup);
    return;
  }

  // Group Auto-monitoring
  const matchedScam = KNOWN_SCAM_DATABASE.find((s) => rawText.includes(s.identifier));
  if (matchedScam) {
    const alertText = `
⚠️ <b>CẢNH BÁO AN NINH NHÓM CHAT (TRUSTPACT RADAR):</b>
Phát hiện số tài khoản <code>${matchedScam.identifier}</code> (${matchedScam.bankName || "Ngân hàng"}) vừa được nhắc tới trong tin nhắn!

🚨 <b>Tài khoản này ĐÃ BỊ TỐ CÁO LỪA ĐẢO</b> trên TrustPact Custom L1!
• Lý do: <i>${matchedScam.reason}</i>
• Thiệt hại nạn nhân: <b>${matchedScam.victimLoss}</b>

⛔ <b>KHUYẾN NGHỊ: CẢ NHÓM KHÔNG CHUYỂN TIỀN VÀO TÀI KHOẢN NÀY!</b>
`;
    await sendTelegramMessage(chatId, alertText, {
      inline_keyboard: [
        [{ text: "🔍 Xem Bằng Chứng On-Chain", url: `${WEB_URL}/?q=${matchedScam.identifier}` }],
      ],
    });
    return;
  }

  if (msg.chat.type === "private" && rawText.length >= 3 && !rawText.startsWith("/")) {
    const res = formatLookupResponse(rawText);
    await sendTelegramMessage(chatId, res.text, res.replyMarkup);
    return;
  }
}

let lastUpdateId = 0;
async function startPolling() {
  if (!BOT_TOKEN || BOT_TOKEN === "your_telegram_bot_token_here") {
    console.log("==================================================================");
    console.log("🤖 TRUSTPACT TELEGRAM BOT SERVICE (SẴN SÀNG KHỞI CHẠY)");
    console.log("==================================================================");
    console.log("💡 Bạn chưa điền TELEGRAM_BOT_TOKEN vào file .env.");
    console.log("👉 Bot đang ở chế độ KIỂM THỬ GIẢ LẬP.");
    console.log("👉 Để kết nối Bot thật với Telegram:");
    console.log("   1. Nhắn /newbot với @BotFather trên Telegram để nhận Token.");
    console.log("   2. Dán token vào file 'telegram-bot/.env': TELEGRAM_BOT_TOKEN=...");
    console.log("   3. Khởi động lại bot bằng lệnh: node src/bot.js");
    console.log("------------------------------------------------------------------");
    console.log("🧪 Kiểm thử mẫu lệnh: /check 1903889922101 (STK Lừa Đảo):");
    const sample = formatLookupResponse("1903889922101");
    console.log(sample.text.replace(/<[^>]+>/g, ""));
    return;
  }

  console.log(`🤖 TrustPact Telegram Bot đã kết nối thành công! Đang lắng nghe tin nhắn...`);
  while (true) {
    try {
      const res = await fetch(`${TELEGRAM_API}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
      const data = await res.json();
      if (data && data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          lastUpdateId = update.update_id;
          await handleUpdate(update);
        }
      }
    } catch (e) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

startPolling();
