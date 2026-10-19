"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search, ShieldAlert, ShieldCheck, AlertTriangle,
  FileText, PlusCircle, CheckCircle2, X,
  Lock, AlertOctagon, ArrowRight
} from "lucide-react";
import { AvalancheIcon } from "../../components/CryptoIcons";
import { useStore } from "../../lib/store";
import { RiskGauge } from "../../components/RiskGauge";
import { StatusBadge } from "../../components/StatusBadge";

export default function ScamRadarPage() {
  const { scamReports, addScamReport, brokers } = useStore();

  const [idType, setIdType] = useState<"PHONE" | "BANK_ACCOUNT" | "WALLET">("BANK_ACCOUNT");
  const [identifier, setIdentifier] = useState("");
  const [victimNote, setVictimNote] = useState("");
  const [evidenceIPFS, setEvidenceIPFS] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [scanResult, setScanResult] = useState<null | {
    query: string;
    score: number;
    isScam: boolean;
    title: string;
    description: string;
    report?: any;
    broker?: any;
  }>(null);

  const handleScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    const q = searchQuery.trim().toLowerCase();

    const matchScam = scamReports.find(
      (r) => r.identifier.toLowerCase().includes(q) || q.includes(r.identifier.toLowerCase())
    );

    if (matchScam) {
      setScanResult({
        query: matchScam.identifier,
        score: 5,
        isScam: true,
        title: "CẢNH BÁO NGUY HIỂM: Đối Tượng Nằm Trong Sổ Đen On-Chain!",
        description: matchScam.victimNote,
        report: matchScam,
      });
      return;
    }

    const matchBroker = brokers.find(
      (b) => b.address.toLowerCase().includes(q) || b.name.toLowerCase().includes(q)
    );

    if (matchBroker) {
      setScanResult({
        query: matchBroker.name,
        score: 99,
        isScam: false,
        title: "AN TOÀN: Thương Nhân Đạt Chuẩn Tín Nhiệm (Cọc Aave V3)",
        description: `Đã ký thác ${matchBroker.stakedAmount.toLocaleString()} USDC cọc bảo chứng trong Lending Pool Aave V3. Tỷ lệ hoàn thành 100%.`,
        broker: matchBroker,
      });
      return;
    }

    setScanResult({
      query: searchQuery,
      score: 92,
      isScam: false,
      title: "Chưa Phát Hiện Vi Phạm Trong Sổ Đen",
      description: "Định danh này chưa từng bị cộng đồng báo cáo trên Avalanche Custom L1. Tuy nhiên, khuyến nghị luôn giao dịch qua Phòng Ký Quỹ Ba Bên để an toàn tuyệt đối.",
    });
  };

  const handleReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !victimNote.trim()) return;

    addScamReport({
      idType,
      identifier: identifier.trim(),
      victimNote: victimNote.trim(),
      evidenceIPFS: evidenceIPFS.trim() || "ipfs://QmDefaultScamProofAvalanche2026",
    });

    setIdentifier(""); setVictimNote(""); setEvidenceIPFS("");
    setShowForm(false);
    setNotice("Hồ sơ vi phạm đã được lưu bất biến trên Avalanche Custom L1 (0đ Gas).");
    setTimeout(() => setNotice(null), 4000);
  };

  const filteredReports = scamReports.filter((r) => {
    if (typeFilter !== "ALL" && r.idType !== typeFilter) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 space-y-10">

      {/* SCANNER HERO */}
      <div className="rounded-3xl bg-gradient-to-b from-[#0F172A] via-[#0B1120] to-[#070B14] border border-slate-800 p-6 sm:p-9 shadow-2xl space-y-7 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-56 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-xs font-mono text-slate-300">
            <AvalancheIcon className="w-3.5 h-3.5" />
            <span>ScamRegistryL1.sol</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 font-semibold">0đ Gas Subnet</span>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 hover:text-red-200 font-medium text-xs transition-all shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Báo Cáo Đối Tượng Mới</span>
          </button>
        </div>

        <div className="max-w-2xl space-y-2 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Kiểm Tra Rủi Ro &amp; Sổ Đen On-Chain
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            Tra cứu số tài khoản ngân hàng, số điện thoại hoặc địa chỉ ví — đối chiếu
            tức thì với dữ liệu phi tập trung của{" "}
            <span className="text-white font-semibold">ScamRegistryL1.sol</span> trên Avalanche Custom L1.
          </p>
        </div>

        {/* Search Input */}
        <div className="max-w-2xl space-y-3 relative z-10">
          <form onSubmit={handleScan}>
            <div className="flex items-center gap-2 rounded-2xl bg-[#060A14] border border-slate-700/80 focus-within:border-red-500/70 focus-within:ring-2 focus-within:ring-red-500/20 p-2 transition-all shadow-inner">
              <Search className="w-5 h-5 text-slate-400 ml-2.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập STK ngân hàng, SĐT, @Telegram, địa chỉ ví nghi vấn..."
                className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none font-medium"
                autoFocus
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all shrink-0 active:scale-95"
              >
                Quét Rủi Ro
              </button>
            </div>
          </form>

          {/* Quick chips */}
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            <span className="text-slate-400 text-xs">Mẫu thử:</span>
            <button
              onClick={() => { setSearchQuery("1903889922101"); setTimeout(() => handleScan(), 50); }}
              className="px-3 py-1 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-mono transition-all"
            >
              1903889922101 (Scam)
            </button>
            <button
              onClick={() => { setSearchQuery("0x30F1492bC78E12a899Ad34De91eF11B12E7a889A"); setTimeout(() => handleScan(), 50); }}
              className="px-3 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-mono transition-all"
            >
              0x30F...889A (GDTG Uy Tín)
            </button>
          </div>
        </div>

        {/* Scan Result Card */}
        {scanResult && (
          <div className="max-w-2xl relative z-10 animate-in fade-in duration-300">
            <div className={`p-6 rounded-2xl border shadow-xl space-y-4 ${
              scanResult.isScam
                ? "border-red-500/50 bg-gradient-to-r from-red-950/40 via-red-900/20 to-[#120a10]"
                : "border-slate-800 bg-[#0D1424]/90"
            }`}>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                <div className="sm:col-span-4 flex justify-center">
                  <RiskGauge score={scanResult.score} isScam={scanResult.isScam} />
                </div>
                <div className="sm:col-span-8 space-y-2">
                  <div className="text-xs font-mono text-slate-400">
                    Đối tượng đối soát: <strong className="text-white">{scanResult.query}</strong>
                  </div>
                  <h3 className={`text-base font-bold leading-snug ${scanResult.isScam ? "text-red-400" : "text-white"}`}>
                    {scanResult.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                    {scanResult.description}
                  </p>

                  {scanResult.report && (
                    <div className="pt-2 text-[11px] font-mono text-slate-400 border-t border-red-500/20 space-y-1">
                      <div>Chứng từ IPFS: <span className="text-red-300 underline">{scanResult.report.evidenceIPFS}</span></div>
                      <div>Thời điểm: {scanResult.report.timestamp}</div>
                    </div>
                  )}

                  {!scanResult.isScam && (
                    <div className="pt-2">
                      <Link
                        href="/create"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all"
                      >
                        Mở Phòng Ký Quỹ Ba Bên <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* NOTICE */}
      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* BLACKLIST TABLE */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              Sổ Đen On-Chain ({filteredReports.length} đối tượng)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ScamRegistryL1.sol · Avalanche Custom L1 · Bất biến vĩnh viễn
            </p>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "BANK_ACCOUNT", label: "STK Ngân Hàng" },
              { id: "PHONE", label: "SĐT / OTT" },
              { id: "WALLET", label: "Ví Crypto" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  typeFilter === t.id
                    ? "bg-slate-700 text-white font-semibold shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#0D1424]/90 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-[#080D1A]">
                  <th className="py-3 px-5 font-semibold uppercase tracking-wider">Đối Tượng</th>
                  <th className="py-3 px-5 font-semibold uppercase tracking-wider">Hành Vi Gian Lận</th>
                  <th className="py-3 px-5 font-semibold uppercase tracking-wider">Bằng Chứng IPFS</th>
                  <th className="py-3 px-5 font-semibold uppercase tracking-wider">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-bold text-red-400 block text-xs">{r.identifier}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{r.idType}</span>
                    </td>
                    <td className="py-3.5 px-5 max-w-sm">
                      <p className="text-slate-300 leading-relaxed">{r.victimNote}</p>
                    </td>
                    <td className="py-3.5 px-5 font-mono">
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); alert(`IPFS: ${r.evidenceIPFS}`); }}
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[140px]">{r.evidenceIPFS}</span>
                      </a>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="text-[10px] text-slate-400 block font-mono">{r.timestamp}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 mt-0.5 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Đã xác thực
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* REPORT MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="rounded-2xl max-w-md w-full border border-slate-700 bg-[#0B1120] overflow-hidden shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Báo Cáo Vi Phạm (0đ Gas On-Chain)
                </h2>
              </div>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleReport} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Loại định danh:</label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value as "PHONE" | "BANK_ACCOUNT" | "WALLET")}
                  className="w-full bg-[#060A14] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="BANK_ACCOUNT">Số tài khoản ngân hàng</option>
                  <option value="PHONE">Số điện thoại / OTT</option>
                  <option value="WALLET">Địa chỉ ví tiền mã hóa</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">Định danh đối tượng:</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="1903889922101 hoặc 0909999888..."
                  className="w-full bg-[#060A14] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">Mô tả hành vi gian lận:</label>
                <textarea
                  rows={3}
                  value={victimNote}
                  onChange={(e) => setVictimNote(e.target.value)}
                  placeholder="Fake bill ngân hàng, nhận cọc rồi chặn liên lạc..."
                  className="w-full bg-[#060A14] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-500 resize-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">Bằng chứng IPFS (tùy chọn):</label>
                <input
                  type="text"
                  value={evidenceIPFS}
                  onChange={(e) => setEvidenceIPFS(e.target.value)}
                  placeholder="ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
                  className="w-full bg-[#060A14] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold shadow-md transition-all"
                >
                  Gửi On-Chain (0đ Gas)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
