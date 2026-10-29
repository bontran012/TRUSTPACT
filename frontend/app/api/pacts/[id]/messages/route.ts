import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB, DBMessage } from "@/src/lib/server/db";

// GET /api/pacts/[id]/messages - Fetch chat message stream
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const db = readDB();
  const messages = db.messages[id] || [];

  return NextResponse.json({ success: true, messages });
}

// POST /api/pacts/[id]/messages - Send a chat message (persists for all clients)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { sender, role, senderName, text, isProof, proofUrl } = body;

    if (!sender || !text) {
      return NextResponse.json({ success: false, error: "Nội dung tin nhắn không hợp lệ" }, { status: 400 });
    }

    const db = readDB();
    if (!db.messages[id]) {
      db.messages[id] = [];
    }

    const newMsg: DBMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      pactId: id,
      sender,
      role: role || "buyer",
      senderName: senderName || "Người dùng",
      text,
      isProof: Boolean(isProof),
      proofUrl: proofUrl || undefined,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      createdAt: Date.now(),
    };

    db.messages[id].push(newMsg);
    writeDB(db);

    return NextResponse.json({ success: true, message: newMsg });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
