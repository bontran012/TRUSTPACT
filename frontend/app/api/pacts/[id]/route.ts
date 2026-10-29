import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB } from "@/src/lib/server/db";

// GET /api/pacts/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const db = readDB();
  const pact = db.pacts[id];

  if (!pact) {
    return NextResponse.json({ success: false, error: "Không tìm thấy hợp đồng" }, { status: 404 });
  }

  const handover = db.handovers[id] || null;
  return NextResponse.json({ success: true, pact, handover });
}

// PATCH /api/pacts/[id] - Update status or txHash
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();
    const { status, txHash, disputeReason } = body;

    const db = readDB();
    if (!db.pacts[id]) {
      return NextResponse.json({ success: false, error: "Không tìm thấy hợp đồng" }, { status: 404 });
    }

    if (status !== undefined) {
      db.pacts[id].status = Number(status);
    }
    if (txHash) {
      db.pacts[id].txHash = txHash;
    }
    if (disputeReason) {
      db.pacts[id].disputeReason = disputeReason;
    }
    db.pacts[id].updatedAt = Date.now();

    writeDB(db);
    return NextResponse.json({ success: true, pact: db.pacts[id] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
