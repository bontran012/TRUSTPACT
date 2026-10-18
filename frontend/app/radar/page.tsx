"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
  PlusCircle, FileText, CheckCircle2, ShieldAlert, 
  Search, AlertTriangle, Layers, X
} from "lucide-react";
import { useStore } from "../../lib/store";

export default function ScamRadarPage() {
  const { scamReports, addScamReport } = useStore();

  const [idType, setIdType] = useState<"PHONE" | "BANK_ACCOUNT" | "WALLET">("BANK_ACCOUNT");
  const [identifier, setIdentifier] = useState("");
  const [victimNote, setVictimNote] = useState("");
  const [evidenceIPFS, setEvidenceIPFS] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const filteredReports = scamReports.filter((r) => {
    if (typeFilter !== "ALL" && r.idType !== typeFilter) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      return (
        r.identifier.toLowerCase().includes(q) ||
        r.victimNote.toLowerCase().includes(q)
      );
    }
    return true;
  });

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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-12 pb-16 space-y-10">
      
      {/* Hero Banner with 3D Cyber Radar Asset */}
      <div className="rounded-3xl glass-panel border border-red-500/30 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5" />
              <span>Avalanche Custom L1 — Phí Giao Dịch 0đ Gas</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-snug">
              Trung Tâm Phòng Ngừa Gian Lận & Tra Cứu Danh Sách Đen On-Chain
            </h1>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-normal">
              Cơ sở dữ liệu phòng chống gian lận phi tập trung được xác thực và bảo chứng trên Avalanche Subnet. Cho phép cộng đồng báo cáo và đối soát số tài khoản, số điện thoại hoặc địa chỉ ví nghi vấn hoàn toàn <strong>miễn phí 100% gas</strong>.
            </p>

            <div className="pt-2">
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-600/30 hover:scale-[1.02]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Gửi Báo Cáo Vi Phạm Mới</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 flex justify-center">
            <div className="relative w-full aspect-video sm:aspect-square max-w-xs rounded-2xl overflow-hidden border border-red-500/30 shadow-2xl">
              <Image
                src="/images/scam-radar-hero.jpg"
                alt="Cyber Radar Graphic"
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-2.5 inset-x-0 text-center text-[10px] font-mono text-red-400 font-bold">
                ScamRegistryL1.sol • Gas-Free
              </div>
            </div>
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center space-x-3 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Report Form Modal / Drawer */}
      {showForm && (
        <div className="glass-panel-elevated border-2 border-red-500/40 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2.5">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              <span>Gửi Hồ Sơ Khiếu Nại & Cảnh Báo Gian Lận On-Chain</span>
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleReport} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-2">
                  Phân loại định danh đối tượng:
                </label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value as "PHONE" | "BANK_ACCOUNT" | "WALLET")}
                  className="w-full bg-[#131520] border border-white/15 rounded-xl px-4 py-3 text-xs sm:text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="BANK_ACCOUNT">Số Tài Khoản Ngân Hàng</option>
                  <option value="PHONE">Số Điện Thoại / Ứng Dụng OTT</option>
                  <option value="WALLET">Địa Chỉ Ví Tiền Mã Hóa</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-zinc-300 block mb-2">
                  Định danh đối tượng nghi vấn (STK / SĐT / Địa chỉ ví):
                </label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Ví dụ: 1903889922101 (Techcombank) hoặc 0909999888..."
                  className="w-full bg-[#131520] border border-white/15 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-2">
                Mô tả chi tiết hành vi & Phương thức gian lận:
              </label>
              <textarea
                value={victimNote}
                onChange={(e) => setVictimNote(e.target.value)}
                placeholder="Ví dụ: Làm giả chứng từ ủy nhiệm chi ngân hàng, nhận tiền đặt cọc rồi đơn phương chặn liên lạc..."
                rows={2}
                className="w-full bg-[#131520] border border-white/15 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-2">
                Mã băm chứng từ số IPFS (Tùy chọn):
              </label>
              <input
                type="text"
                value={evidenceIPFS}
                onChange={(e) => setEvidenceIPFS(e.target.value)}
                placeholder="ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
                className="w-full bg-[#131520] border border-white/15 rounded-xl px-4 py-3 text-xs sm:text-sm text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-5 py-2.5 rounded-xl bg-white/[0.06] text-zinc-300 text-xs font-semibold hover:bg-white/[0.1] transition-colors"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-red-600/30"
              >
                Lưu Trữ On-Chain (Avalanche L1 Gas 0đ)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border border-white/[0.1] shadow-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Lọc theo STK, SĐT hoặc từ khóa vi phạm..."
            className="w-full bg-[#131520] border border-white/15 rounded-xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-red-500 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "BANK_ACCOUNT", label: "Số Tài Khoản" },
            { id: "PHONE", label: "SĐT / OTT" },
            { id: "WALLET", label: "Địa Chỉ Ví" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                typeFilter === t.id
                  ? "bg-white text-black font-bold shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Blacklist Table */}
      <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/[0.1]">
        <div className="px-6 py-4 border-b border-white/[0.08] bg-white/[0.02] flex items-center justify-between">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Danh Sách Báo Cáo Vi Phạm Đã Lưu Vết On-Chain ({filteredReports.length})
          </h2>
          <span className="text-[11px] font-mono text-zinc-400">
            ScamRegistryL1.sol (Gas Limit: 0)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-white/[0.08] text-zinc-400 bg-black/20">
                <th className="py-4 px-6 font-semibold">Đối Tượng Nghi Vấn</th>
                <th className="py-4 px-6 font-semibold">Hành Vi & Thủ Đoạn Vi Phạm</th>
                <th className="py-4 px-6 font-semibold">Chứng Từ IPFS</th>
                <th className="py-4 px-6 font-semibold">Thời Điểm & Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {filteredReports.map((r) => (
                <tr key={r.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-mono font-bold text-rose-400 block text-xs sm:text-sm">
                      {r.identifier}
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      {r.idType}
                    </span>
                  </td>

                  <td className="py-4 px-6 max-w-sm">
                    <p className="text-zinc-300 leading-relaxed text-xs">
                      {r.victimNote}
                    </p>
                  </td>

                  <td className="py-4 px-6 font-mono text-xs">
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); alert(`Chứng từ băm IPFS bất biến: ${r.evidenceIPFS}`); }}
                      className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate max-w-[130px]">{r.evidenceIPFS}</span>
                    </a>
                  </td>

                  <td className="py-4 px-6">
                    <span className="text-xs text-zinc-400 block">{r.timestamp}</span>
                    <span className={`inline-flex items-center space-x-1 text-[11px] font-semibold mt-0.5 ${
                      r.isVerified ? "text-emerald-400" : "text-amber-400"
                    }`}>
                      {r.isVerified ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      <span>{r.isVerified ? "Đã Xác Thực" : "Chờ Thẩm Định"}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
