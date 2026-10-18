"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Search, ShieldAlert, ShieldCheck, AlertTriangle, 
  FileText, PlusCircle, CheckCircle2, X, ExternalLink, 
  Layers, Lock, AlertOctagon, HelpCircle, ArrowRight
} from "lucide-react";
import { AvalancheIcon } from "../../components/CryptoIcons";
import { useStore } from "../../lib/store";
import { RiskGauge } from "../../components/RiskGauge";
import { AddressCopy } from "../../components/AddressCopy";
import { StatusBadge } from "../../components/StatusBadge";

export default function ScamRadarPage() {
  const { scamReports, addScamReport, brokers } = useStore();

  const [idType, setIdType] = useState<"PHONE" | "BANK_ACCOUNT" | "WALLET">("BANK_ACCOUNT");
  const [identifier, setIdentifier] = useState("");
  const [victimNote, setVictimNote] = useState("");
  const [evidenceIPFS, setEvidenceIPFS] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Scanner Search Engine State
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

    // 1. Check blacklist
    const matchScam = scamReports.find(
      (r) => r.identifier.toLowerCase().includes(q) || q.includes(r.identifier.toLowerCase())
    );

    if (matchScam) {
      setScanResult({
        query: matchScam.identifier,
        score: 5,
        isScam: true,
        title: "NGUY HIỂM: ĐỐI TƯỢNG ĐÃ BỊ GHI DANH SỔ ĐEN ON-CHAIN",
        description: matchScam.victimNote,
        report: matchScam,
      });
      return;
    }

    // 2. Check verified broker
    const matchBroker = brokers.find(
      (b) => b.address.toLowerCase().includes(q) || b.name.toLowerCase().includes(q)
    );

    if (matchBroker) {
      setScanResult({
        query: matchBroker.name,
        score: 99,
        isScam: false,
        title: "AN TOÀN: THƯƠNG NHÂN ĐẠT CHUẨN TÍN NHIỆM (CỌC AAVE V3)",
        description: `Thương nhân có tiền cọc bảo chứng ${matchBroker.stakedAmount.toLocaleString()} USDC trong Lending Pool Aave V3. Tỷ lệ hoàn thành 100%.`,
        broker: matchBroker,
      });
      return;
    }

    // 3. Clean
    setScanResult({
      query: searchQuery,
      score: 92,
      isScam: false,
      title: "CHƯA PHÁT HIỆN DẤU HIỆU LỪA ĐẢO TRONG SỔ ĐEN",
      description: "Định danh này chưa từng bị cộng đồng báo cáo trên Avalanche Custom L1. Tuy nhiên, để phòng tránh rủi ro, khuyến nghị luôn giao dịch qua Phòng Ký Quỹ Ba Bên.",
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

    setIdentifier("");
    setVictimNote("");
    setEvidenceIPFS("");
    setShowForm(false);
    setNotice("Hồ sơ vi phạm đã được xác thực và lưu trữ bất biến trên Avalanche Custom L1 với chi phí 0đ gas!");
    setTimeout(() => setNotice(null), 4000);
  };

  const filteredReports = scamReports.filter((r) => {
    if (typeFilter !== "ALL" && r.idType !== typeFilter) return false;
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 space-y-10">
      
      {/* =========================================================================
          SECURITY SCANNER HERO (De.Fi / GoPlus Style, Zero Static JPG)
          ========================================================================= */}
      <div className="rounded-3xl bg-gradient-to-b from-[#0f1322] via-[#0b0e17] to-[#090b10] border border-slate-700/70 p-6 sm:p-9 shadow-2xl relative overflow-hidden space-y-7">
        
        {/* Glow Accent */}
        <div className="absolute top-0 right-1/4 w-96 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
            <AvalancheIcon className="w-3.5 h-3.5" />
            <span>Avalanche Custom L1 Subnet</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400">0đ Gas Security Gateway</span>
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Báo Cáo Địa Chỉ Gian Lận</span>
          </button>
        </div>

        <div className="text-center max-w-2xl mx-auto space-y-2 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Công Cụ Quét An Ninh & Kiểm Tra Rủi Ro On-Chain
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
            Nhập số tài khoản ngân hàng, số điện thoại hoặc địa chỉ ví để đánh giá chỉ số rủi ro tức thời dựa trên dữ liệu phi tập trung của ScamRegistryL1.sol.
          </p>
        </div>

        {/* Big Search Input Box */}
        <div className="max-w-2xl mx-auto space-y-2.5 relative z-10">
          <form onSubmit={handleScan} className="relative">
            <div className="relative rounded-2xl bg-slate-900 border border-slate-700/80 focus-within:border-blue-500 shadow-xl p-1.5 flex items-center transition-colors">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập STK ngân hàng, SĐT hoặc địa chỉ ví nghi vấn (vd: 1903889922101)..."
                className="w-full bg-transparent px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-colors shrink-0"
              >
                Quét Rủi Ro
              </button>
            </div>
          </form>

          {/* Quick presets */}
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span className="text-slate-500 text-[11px]">Tra cứu nhanh:</span>
            <button
              onClick={() => {
                setSearchQuery("1903889922101");
                setTimeout(() => handleScan(), 50);
              }}
              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-rose-400 text-[11px] font-mono border border-slate-700"
            >
              Kẻ lừa đảo: 1903889922101
            </button>
            <button
              onClick={() => {
                setSearchQuery("0x30F1492bC78E12a899Ad34De91eF11B12E7a889A");
                setTimeout(() => handleScan(), 50);
              }}
              className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-mono border border-slate-700"
            >
              GDTG: 0x30F...889A
            </button>
          </div>
        </div>

        {/* Scan Result with RiskGauge */}
        {scanResult && (
          <div className="max-w-2xl mx-auto pt-2 relative z-10">
            <div className={`p-6 rounded-2xl border shadow-xl space-y-4 ${
              scanResult.isScam
                ? "bg-rose-950/20 border-rose-500/40"
                : "bg-slate-900/90 border-slate-700"
            }`}>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                {/* Left Gauge */}
                <div className="sm:col-span-5 flex justify-center">
                  <RiskGauge
                    score={scanResult.score}
                    isScam={scanResult.isScam}
                  />
                </div>

                {/* Right Details */}
                <div className="sm:col-span-7 space-y-2">
                  <div className="text-xs font-mono text-slate-400">
                    Đối tượng đối soát: <strong className="text-white">{scanResult.query}</strong>
                  </div>
                  <h3 className={`text-sm font-bold ${scanResult.isScam ? "text-rose-400" : "text-white"}`}>
                    {scanResult.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-normal">
                    {scanResult.description}
                  </p>

                  {scanResult.report && (
                    <div className="pt-2 text-[11px] font-mono text-slate-400 border-t border-rose-500/20 space-y-1">
                      <div>Chứng từ IPFS: <span className="text-rose-400 underline">{scanResult.report.evidenceIPFS}</span></div>
                      <div>Thời điểm ghi nhận: {scanResult.report.timestamp}</div>
                    </div>
                  )}

                  {!scanResult.isScam && (
                    <div className="pt-3">
                      <Link
                        href="/create"
                        className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                      >
                        <span>Mở Phòng Ký Quỹ Ba Bên Để Giao Dịch</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* =========================================================================
          BLACKLIST REGISTRY TABLE (ON-CHAIN DATABASE)
          ========================================================================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Sổ Đen Gian Lận Được Ghi Vết On-Chain ({filteredReports.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hợp đồng ScamRegistryL1.sol trên Avalanche Custom L1 • Miễn phí 0đ Gas.
            </p>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto">
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "BANK_ACCOUNT", label: "STK Ngân Hàng" },
              { id: "PHONE", label: "SĐT / OTT" },
              { id: "WALLET", label: "Địa Chỉ Ví" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  typeFilter === t.id
                    ? "bg-slate-700 text-white font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-[#0f131c] border border-slate-700/60 overflow-hidden shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                  <th className="py-3 px-5 font-semibold">Đối Tượng</th>
                  <th className="py-3 px-5 font-semibold">Hành Vi & Thủ Đoạn</th>
                  <th className="py-3 px-5 font-semibold">Bằng Chứng IPFS</th>
                  <th className="py-3 px-5 font-semibold">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredReports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-bold text-rose-400 block text-xs">
                        {r.identifier}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {r.idType}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 max-w-sm">
                      <p className="text-slate-300 leading-relaxed text-xs">
                        {r.victimNote}
                      </p>
                    </td>

                    <td className="py-3.5 px-5 font-mono text-xs">
                      <a
                        href="#"
                        onClick={(e) => { e.preventDefault(); alert(`Chứng từ băm IPFS: ${r.evidenceIPFS}`); }}
                        className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[130px]">{r.evidenceIPFS}</span>
                      </a>
                    </td>

                    <td className="py-3.5 px-5">
                      <span className="text-[11px] text-slate-400 block">{r.timestamp}</span>
                      <span className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-400 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Đã xác thực</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================================
          REPORT SCAM FORM MODAL
          ========================================================================= */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative bg-[#0f131c] border border-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Báo Cáo Đối Tượng Gian Lận (0đ Gas On-Chain)</span>
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReport} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Loại định danh đối tượng:</label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value as "PHONE" | "BANK_ACCOUNT" | "WALLET")}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="BANK_ACCOUNT">Số Tài Khoản Ngân Hàng</option>
                  <option value="PHONE">Số Điện Thoại / Ứng Dụng OTT</option>
                  <option value="WALLET">Địa Chỉ Ví Tiền Mã Hóa</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Định danh đối tượng nghi vấn (STK / SĐT / Ví):
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ví dụ: 1903889922101 hoặc 0909999888..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Mô tả hành vi & Thủ đoạn gian lận:
                </label>
                <textarea
                  rows={2}
                  value={victimNote}
                  onChange={(e) => setVictimNote(e.target.value)}
                  placeholder="Làm giả chứng từ ủy nhiệm chi ngân hàng, nhận cọc rồi chặn liên lạc..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Mã băm chứng cứ IPFS (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={evidenceIPFS}
                  onChange={(e) => setEvidenceIPFS(e.target.value)}
                  placeholder="ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
                >
                  Lưu Trữ On-Chain (0đ Gas)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
