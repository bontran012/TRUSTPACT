import { NextRequest, NextResponse } from "next/server";
import { readDB, writeDB, DBScamReport } from "@/src/lib/server/db";

// GET /api/scam - Search or list scam reports
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim().toLowerCase();

  const db = readDB();
  if (!q) {
    return NextResponse.json({ success: true, scams: db.scams });
  }

  const results = db.scams.filter(
    (s) =>
      s.identifier.toLowerCase().includes(q) ||
      (s.bankName && s.bankName.toLowerCase().includes(q)) ||
      s.reason.toLowerCase().includes(q)
  );

  return NextResponse.json({ success: true, count: results.length, scams: results });
}

// POST /api/scam - Report a scam
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identifier, bankName, type, reason, victimLoss, evidenceUrl } = body;

    if (!identifier || !reason) {
      return NextResponse.json(
        { success: false, error: "Định danh và lý do tố cáo không được để trống" },
        { status: 400 }
      );
    }

    const db = readDB();
    const existing = db.scams.find((s) => s.identifier.toLowerCase() === identifier.toLowerCase());

    if (existing) {
      existing.reportsCount += 1;
      if (victimLoss) existing.victimLoss = victimLoss;
      writeDB(db);
      return NextResponse.json({ success: true, scam: existing, updated: true });
    }

    const newScam: DBScamReport = {
      id: `scam-${Date.now()}`,
      identifier: identifier.trim(),
      bankName: bankName?.trim(),
      type: type || "Tài khoản đáng ngờ",
      reason: reason.trim(),
      victimLoss: victimLoss || "Chưa xác định",
      reportsCount: 1,
      isVerified: false,
      evidenceUrl: evidenceUrl?.trim(),
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 16),
    };

    db.scams.unshift(newScam);
    writeDB(db);

    return NextResponse.json({ success: true, scam: newScam, created: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
