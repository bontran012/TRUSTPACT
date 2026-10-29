import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB, DBHandover, DBMessage } from "@/src/lib/server/db";

// GET /api/pacts/[id]/handover
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const db = readDB();
  const handover = db.handovers[id] || {
    pactId: id,
    assetTitle: "Bàn giao tài sản số & tài khoản OTC",
    proofUrl: "",
    notes: "",
    isHandedOver: false,
    updatedAt: Date.now(),
  };

  return NextResponse.json({ success: true, handover });
}

// POST /api/pacts/[id]/handover - Seller submits handover proof
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { assetTitle, proofUrl, notes, senderName, senderAddress } = body;

    const db = readDB();
    const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    const handover: DBHandover = {
      pactId: id,
      assetTitle: assetTitle || "Bàn giao tài sản số & tài khoản OTC",
      proofUrl: proofUrl || "https://testnet.snowtrace.io",
      notes: notes || "Bên Bán xác nhận đã chuyển giao đầy đủ hàng/tài sản cho Bên Mua.",
      isHandedOver: true,
      handedOverAt: timeStr,
      updatedAt: Date.now(),
    };

    db.handovers[id] = handover;

    // Automatically append system/seller proof message into chat
    if (!db.messages[id]) {
      db.messages[id] = [];
    }
    const handoverMsg: DBMessage = {
      id: `msg-handover-${Date.now()}`,
      pactId: id,
      sender: senderAddress || "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
      role: "seller",
      senderName: senderName || "Bên Bán",
      text: `✓ Bên Bán đã hoàn tất bàn giao tài sản! Bằng chứng đối soát: ${handover.proofUrl}. Đề nghị Bên Mua và GDTG kiểm tra nghiệm thu.`,
      timestamp: timeStr,
      isProof: true,
      proofUrl: handover.proofUrl,
      createdAt: Date.now(),
    };
    db.messages[id].push(handoverMsg);

    writeDB(db);
    return NextResponse.json({ success: true, handover, message: handoverMsg });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
