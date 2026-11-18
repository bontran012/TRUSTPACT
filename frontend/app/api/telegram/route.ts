import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { avalancheFuji } from "wagmi/chains";
import {
  lookupTarget,
  getStartMessage,
  formatLookupResponse,
  KNOWN_SCAM_DATABASE,
} from "@/src/lib/telegramBotData";
import { CONTRACT_ADDRESSES, SCAM_REGISTRY_L1_ABI } from "@/src/lib/contracts";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const BOT_USERNAME = process.env.BOT_USERNAME || "TrustPact_Sentinel_bot";
const PUBLIC_WEB_URL = process.env.NEXT_PUBLIC_APP_URL || "https://trustpact-mocha.vercel.app";
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const fujiClient = createPublicClient({
  chain: avalancheFuji,
  transport: http(process.env.NEXT_PUBLIC_FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc"),
});

async function checkOnChainScam(identifier: string) {
  try {
    const data = await fujiClient.readContract({
      address: CONTRACT_ADDRESSES.scamRegistryL1,
      abi: SCAM_REGISTRY_L1_ABI,
      functionName: "checkScam",
      args: [identifier],
    });
    return {
      count: Number((data as any)[0] || 0n),
      hasVerified: Boolean((data as any)[1]),
    };
  } catch {
    return { count: 0, hasVerified: false };
  }
}

async function sendTelegramMessage(chatId: number | string, text: string, replyMarkup?: any) {
  try {
    const payload: any = {
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
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Telegram Webhook Error:", err);
  }
}

// ── POST: INCOMING TELEGRAM WEBHOOK (SERVERLESS) ──────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Webhook caller authentication
    const secretToken = req.headers.get("x-telegram-bot-api-secret-token");
    const expectedSecret = process.env.TELEGRAM_SECRET_TOKEN;
    if (expectedSecret && secretToken !== expectedSecret) {
      return NextResponse.json({ error: "Unauthorized webhook caller" }, { status: 401 });
    }

    const webUrl = req.nextUrl.origin || PUBLIC_WEB_URL;
    const update = await req.json();

    // 1. Handle Callback Queries (Button clicks)
    if (update.callback_query) {
      const cb = update.callback_query;
      const chatId = cb.message?.chat?.id;
      const data = cb.data;

      try {
        await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callback_query_id: cb.id }),
        });
      } catch (e) {}

      if (data === "check_scam" && chatId) {
        const guideText = `
🔍 <b>HƯỚNG DẪN TRA CỨU NHANH (KHÔNG CẦN GÕ LỆNH):</b>

Bạn chỉ cần <b>gửi trực tiếp</b> thông tin cần tra cứu vào khung chat này:
• <b>Số tài khoản ngân hàng:</b> (ví dụ <code>1903889922101</code>)
• <b>Số điện thoại:</b> (ví dụ <code>0988776655</code>)
• <b>Username Telegram:</b> (ví dụ <code>@username</code>)
• <b>Địa chỉ ví Web3:</b> (ví dụ <code>0x30F1492bC78E12a899Ad34De91eF11B12E7a889A</code>)

⚡ <i>Bot sẽ tự động quét Sổ Đen Custom L1 và trả về kết quả ngay lập tức!</i>
`;
        await sendTelegramMessage(chatId, guideText);
      } else if (data === "check_broker" && chatId) {
        const brokerGuide = `
🛡️ <b>DANH SÁCH GDTG / TRUNG GIAN UY TÍN BẢO CHỨNG:</b>

1. <b>Nguyễn Nam (Giám Định Viên)</b> (<code>@nam_escrow_official</code>) - Ví: <code>0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5</code> (Đã Stake Aave V3 Fuji & Mint SBT #1)
2. <b>Hoàng Minh (Merchant OTC)</b> (<code>@hoangminh_otc</code>) - Ví: <code>0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c</code>
3. <b>Quản Trị Viên (Super Admin)</b> (<code>@TrustPact_Sentinel_bot</code>) - Ví: <code>0xe85eE178537fa93392d82114A33f6B204Ea7c6aE</code>

👉 <i>Gửi tin nhắn <code>@nam_escrow_official</code> hoặc <code>@hoangminh_otc</code> để tra cứu Hộ Chiếu SBT!</i>
`;
        await sendTelegramMessage(chatId, brokerGuide, {
          inline_keyboard: [
            [{ text: "🌐 Xem Danh Sách GDTG Trên Web", url: `${webUrl}/broker/stake` }],
          ],
        });
      }
      return NextResponse.json({ ok: true });
    }

    // 2. Handle Text Messages
    if (update.message && update.message.text) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const rawText = msg.text.trim();
      const firstName = msg.from?.first_name || "Bạn";

      // Command: /start or /help
      if (rawText.startsWith("/start") || rawText.startsWith("/help")) {
        const startMsg = getStartMessage(firstName);
        const replyMarkup = {
          inline_keyboard: [
            [
              { text: "🌐 Mở DApp Web TrustPact", url: webUrl },
              { text: "👥 Thêm Vào Nhóm Chat OTC", url: `https://t.me/${BOT_USERNAME}?startgroup=true` },
            ],
          ],
        };
        await sendTelegramMessage(chatId, startMsg, replyMarkup);
        return NextResponse.json({ ok: true });
      }

      // Command: /pact
      if (rawText.startsWith("/pact") || rawText.startsWith("/escrow")) {
        const text = `
🔐 <b>KHỞI TẠO KÉT SẮT 3 BÊN BẢO CHỨNG (TRUSTPACT ESCROW)</b>

• <b>Cơ chế:</b> Người mua nạp USDC vào Két Smart Contract. Vốn cọc GDTG sinh lãi thực qua Aave V3.
• <b>Giải ngân 2 bước (2-of-2):</b> Hàng chuẩn ➔ Cả Bên Mua VÀ GDTG cùng bấm xác nhận mới giải ngân cho Seller.
• <b>Bảo vệ:</b> Hàng lỗi / sai cam kết ➔ GDTG bấm hoàn tiền 100% về ví Buyer ngay lập tức.

👉 Bấm nút bên dưới để mở phòng ký quỹ an toàn:
`;
        const replyMarkup = {
          inline_keyboard: [
            [{ text: "🚀 Khởi Tạo Kèo Ký Quỹ Mới", url: `${webUrl}/pact/create` }],
            [{ text: "📋 Xem Sổ Kèo Đang Chạy", url: `${webUrl}/pact` }],
          ],
        };
        await sendTelegramMessage(chatId, text, replyMarkup);
        return NextResponse.json({ ok: true });
      }

      // Group auto-detection: check if scam number is mentioned
      const matchedScam = KNOWN_SCAM_DATABASE.find((s) => rawText.includes(s.identifier));
      if (matchedScam) {
        const alertText = `
⚠️ <b>CẢNH BÁO AN TOÀN GIAO DỊCH (TRUSTPACT SENTINEL):</b>
Phát hiện số tài khoản <code>${matchedScam.identifier}</code> (${matchedScam.bankName || "Ngân hàng"}) vừa được nhắc tới trong tin nhắn!

🚨 <b>Tài khoản này ĐÃ BỊ TỐ CÁO LỪA ĐẢO</b> trên TrustPact Custom L1!
• Lý do: <i>${matchedScam.reason}</i>
• Thiệt hại nạn nhân: <b>${matchedScam.victimLoss}</b>

⛔ <b>KHUYẾN NGHỊ: CẢ NHÓM KHÔNG CHUYỂN TIỀN VÀO TÀI KHOẢN NÀY!</b>
`;
        await sendTelegramMessage(chatId, alertText, {
          inline_keyboard: [
            [{ text: "🔍 Xem Bằng Chứng On-Chain", url: `${webUrl}/?q=${matchedScam.identifier}` }],
          ],
        });
        return NextResponse.json({ ok: true });
      }

      // Direct message or /check command: Query lookup
      let query = rawText;
      if (rawText.startsWith("/check ") || rawText.startsWith("/radar ") || rawText.startsWith("/tim ")) {
        query = rawText.split(" ").slice(1).join(" ").trim();
      }

      if (query.length >= 2 && !query.startsWith("/")) {
        const onChain = await checkOnChainScam(query);
        const res = formatLookupResponse(query, webUrl);
        let responseText = res.text;
        if (onChain.count > 0) {
          responseText += `\n\n🔗 <b>DỮ LIỆU ON-CHAIN (Avalanche Fuji #${CONTRACT_ADDRESSES.scamRegistryL1.slice(0, 6)}...):</b>\n• Báo cáo trực tiếp trên Smart Contract: <b>${onChain.count} lượt</b>\n• Kiểm duyệt bằng chứng: ${onChain.hasVerified ? "✅ Đã xác thực" : "⏳ Báo cáo cộng đồng"}`;
        }
        await sendTelegramMessage(chatId, responseText, res.replyMarkup);
        return NextResponse.json({ ok: true });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Webhook route error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

// ── GET: WEBHOOK STATUS & 1-CLICK REGISTRATION ────────────────────────────────
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const setWebhook = url.searchParams.get("setWebhook");

  if (setWebhook === "true") {
    // Automatically set webhook to current host
    const origin = url.origin;
    const webhookUrl = `${origin}/api/telegram`;
    const res = await fetch(`${TELEGRAM_API}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
    const data = await res.json();

    return NextResponse.json({
      message: "Webhook setup requested",
      webhookUrl,
      telegramResponse: data,
    });
  }

  // Get current webhook info
  const infoRes = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
  const infoData = await infoRes.json();

  return NextResponse.json({
    service: "TrustPact Sentinel Serverless Telegram Bot",
    status: "online",
    bot: BOT_USERNAME,
    webhookInfo: infoData,
    instructions: "Truy cập /api/telegram?setWebhook=true để tự động liên kết Bot với domain Vercel!",
  });
}
