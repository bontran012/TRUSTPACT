import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB, DBPact } from "@/src/lib/server/db";

// GET /api/pacts - List all pacts
export async function GET() {
  const db = readDB();
  const list = Object.values(db.pacts).sort((a, b) => b.updatedAt - a.updatedAt);
  return NextResponse.json({ success: true, pacts: list });
}

// POST /api/pacts - Create or register a pact
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, onChainId, txHash, buyer, seller, broker, amount, brokerFeeBps, duration } = body;

    if (!id || !buyer || !seller || !broker || !amount) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin bắt buộc để tạo hợp đồng ký quỹ" },
        { status: 400 }
      );
    }

    const db = readDB();
    const newPact: DBPact = {
      id: String(id),
      onChainId: onChainId ? Number(onChainId) : undefined,
      txHash: txHash || undefined,
      buyer,
      seller,
      broker,
      amount: String(amount),
      brokerFeeBps: Number(brokerFeeBps || 150),
      duration: Number(duration || 86400),
      startTime: Math.floor(Date.now() / 1000),
      status: 0,
      updatedAt: Date.now(),
    };

    db.pacts[String(id)] = newPact;

    // Initialize messages for new pact
    if (!db.messages[String(id)]) {
      db.messages[String(id)] = [
        {
          id: `msg-sys-${Date.now()}`,
          pactId: String(id),
          sender: "0xb3e0586F61a2dC5C1055528f0939E2fbDcE38Ad0",
          role: "system",
          senderName: "Hệ Thống Két Sắt UniversalEscrow",
          text: `Hợp đồng ký quỹ #${id} đã được khởi tạo thành công trên mạng Avalanche Fuji. Số tiền bảo chứng ${amount} USDC đã được ghi nhận.`,
          timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          createdAt: Date.now(),
        },
      ];
    }

    writeDB(db);
    return NextResponse.json({ success: true, pact: newPact });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
