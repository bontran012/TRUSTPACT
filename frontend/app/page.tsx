"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  Star,
  ArrowRight,
  CheckCircle2,
  PlusCircle,
  X,
  AlertOctagon,
  Award,
  Lock,
  ChevronRight,
  Activity,
  Radar,
  ExternalLink,
  Coins,
  TrendingUp,
} from "lucide-react";
import { AaveIcon, AvalancheIcon, UsdcIcon } from "../components/CryptoIcons";
import { useStore } from "../lib/store";
import { Identicon } from "../components/Identicon";
import { StatusBadge } from "../components/StatusBadge";
import { TrustPassportCard } from "../components/TrustPassportCard";

export default function HomePage() {
  const { brokers, scamReports, deals, addScamReport } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<null | {
    type: "SCAM" | "VERIFIED_BROKER" | "CLEAN";
    identifier: string;
    title: string;
    description: string;
    details?: any;
  }>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportIdType, setReportIdType] = useState<"PHONE" | "BANK_ACCOUNT" | "WALLET">("BANK_ACCOUNT");
  const [reportIdentifier, setReportIdentifier] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [reportIPFS, setReportIPFS] = useState("");
  const [reportSuccessNotice, setReportSuccessNotice] = useState<string | null>(null);

  const runLookup = (rawQuery: string) => {
    const query = rawQuery.trim().toLowerCase();
    if (!query) return;

    const scamFound = scamReports.find(
      (r) => r.identifier.toLowerCase().includes(query) || query.includes(r.identifier.toLowerCase())
    );
    if (scamFound) {
      setSearchResult({
        type: "SCAM",
        identifier: scamFound.identifier,
        title: "CẢNH BÁO NGUY HIỂM: Đối tượng nằm trong Sổ Đen On-Chain!",
        description: scamFound.victimNote,
        details: {
          idType: scamFound.idType,
          evidence: scamFound.evidenceIPFS,
          date: scamFound.timestamp,
          count: scamFound.reportCount,
        },
      });
      return;
    }

    const brokerFound = brokers.find(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        b.address.toLowerCase().includes(query) ||
        b.badge.toLowerCase().includes(query)
    );
    if (brokerFound) {
      setSearchResult({
        type: "VERIFIED_BROKER",
        identifier: brokerFound.name,
        title: "AN TOÀN: Thương Nhân Bảo Chứng Uy Tín (Cọc Aave V3)",
        description: `Đã ký thác ${brokerFound.stakedAmount.toLocaleString()} USDC vào Lending Pool Aave V3. Hạn mức bảo lãnh tối đa ${brokerFound.maxLimit.toLocaleString()} USDC. Tỷ lệ hoàn thành 100%.`,
        details: brokerFound,
      });
      return;
    }

    setSearchResult({
      type: "CLEAN",
      identifier: rawQuery,
      title: "Chưa Phát Hiện Vi Phạm Trong Sổ Đen",
      description:
        "Định danh này chưa từng bị cộng đồng báo cáo trên Avalanche Custom L1. Để an toàn tuyệt đối khi chuyển tiền, luôn yêu cầu giao dịch qua Phòng Ký Quỹ Ba Bên.",
    });
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    runLookup(searchQuery);
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportIdentifier.trim() || !reportNote.trim()) return;
    addScamReport({
      idType: reportIdType,
      identifier: reportIdentifier.trim(),
      victimNote: reportNote.trim(),
      evidenceIPFS: reportIPFS.trim() || "ipfs://QmDefaultScamProofAvalanche2026",
    });
    setReportIdentifier("");
    setReportNote("");
    setReportIPFS("");
    setShowReportModal(false);
    setReportSuccessNotice("Báo cáo vi phạm đã được ghi nhận vào Sổ Đen Avalanche Custom L1 (0đ Gas).");
    setTimeout(() => setReportSuccessNotice(null), 4000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-12 pb-24">
      {/* ── HERO: THREAT SCANNER & SCAM RADAR ─────────────────────────────────── */}
      <section className="relative rounded-3xl bg-gradient-to-b from-[#0F172A] via-[#0B1120] to-[#070B14] border border-slate-800/80 p-6 sm:p-10 shadow-2xl shadow-black/50 overflow-hidden space-y-7">
        {/* Ambient Top Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-60 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-10 w-72 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/70 text-xs font-mono text-slate-300 shadow-sm">
            <AvalancheIcon className="w-3.5 h-3.5" />
            <span>ScamRegistryL1.sol</span>
            <span className="text-slate-600">·</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              0đ Gas Subnet
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowReportModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 hover:text-red-200 text-xs font-medium transition-all shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Báo cáo lừa đảo
            </button>
            <Link
              href="/radar"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-all"
            >
              <Radar className="w-3.5 h-3.5 text-blue-400" />
              Radar Toàn Diện
            </Link>
          </div>
        </div>

        {/* Hero Title & Subtitle */}
        <div className="max-w-3xl space-y-2 relative z-10">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Tra Cứu Gian Lận &amp; Kiểm Tra Rủi Ro On-Chain
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Đối chiếu tức thì số tài khoản ngân hàng, số điện thoại, Telegram, địa chỉ ví với{" "}
            <span className="text-white font-semibold">Sổ Đen phi tập trung</span> trên Avalanche Custom L1.
            Chủ động phòng tránh lừa đảo trước khi chuyển tiền.
          </p>
        </div>

        {/* Big Search Input Box */}
        <div className="max-w-3xl space-y-3 relative z-10">
          <form onSubmit={handleSearch}>
            <div className="relative rounded-2xl bg-[#060A14] border border-slate-700/80 focus-within:border-red-500/70 focus-within:ring-2 focus-within:ring-red-500/20 p-2 flex items-center transition-all shadow-inner">
              <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập STK ngân hàng, SĐT, @Telegram, hoặc địa chỉ ví (vd: 1903889922101)..."
                className="w-full bg-transparent px-3.5 py-2.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none font-medium"
                autoFocus
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-red-500/25 transition-all shrink-0 active:scale-95"
              >
                Kiểm Tra Ngay
              </button>
            </div>
          </form>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-slate-400 text-xs font-medium">Mẫu thử đối soát:</span>
            {[
              { label: "1903889922101 (Scam)", query: "1903889922101", color: "text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20" },
              { label: "@otc_vn_fake_admin (Scam)", query: "@otc_vn_fake_admin", color: "text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20" },
              { label: "0xDeadBeef…Scam", query: "0xDeadBeef0000111122223333444455556666Scam", color: "text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20" },
              { label: "Nguyễn Nam (GDTG Uy Tín)", query: "Nguyễn Nam", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20" },
            ].map((chip) => (
              <button
                key={chip.query}
                type="button"
                onClick={() => {
                  setSearchQuery(chip.query);
                  runLookup(chip.query);
                }}
                className={`px-3 py-1 rounded-lg border text-xs font-mono transition-all ${chip.color}`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Success Notice */}
        {reportSuccessNotice && (
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 shadow-md">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{reportSuccessNotice}</span>
          </div>
        )}

        {/* Dynamic Search Result Card */}
        {searchResult && (
          <div className="max-w-3xl pt-2 relative z-10 animate-in fade-in duration-300">
            {searchResult.type === "SCAM" && (
              <div className="p-6 rounded-2xl border border-red-500/50 bg-gradient-to-r from-red-950/40 via-red-900/20 to-[#120a10] shadow-xl space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0 shadow-inner">
                    <AlertOctagon className="w-6 h-6 text-red-400 animate-pulse" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-red-500/20 border border-red-500/40 text-red-300">
                        ĐÃ XÁC THỰC SỔ ĐEN ON-CHAIN
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {searchResult.details?.count} lượt tố cáo xác thực
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white tracking-tight">
                      {searchResult.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                      {searchResult.description}
                    </p>
                    <div className="text-[11px] font-mono text-slate-400 pt-1 border-t border-red-500/20 flex flex-wrap gap-x-4 gap-y-1">
                      <span>Loại: <strong className="text-slate-200">{searchResult.details?.idType}</strong></span>
                      <span>Thời điểm: <strong className="text-slate-200">{searchResult.details?.date}</strong></span>
                      <span className="truncate max-w-xs">Chứng từ IPFS: <span className="text-red-300 underline">{searchResult.details?.evidence}</span></span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-red-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="text-xs text-slate-300">
                    ⚠️ Tuyệt đối không chuyển khoản trực tiếp cho đối tượng này!
                  </span>
                  <Link
                    href="/create"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all shrink-0"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    Mở Ký Quỹ Ba Bên Để An Toàn
                  </Link>
                </div>
              </div>
            )}

            {searchResult.type === "VERIFIED_BROKER" && (
              <div className="p-6 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-[#0a1510] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <Identicon address={searchResult.details?.address} size={46} rankBadge="Verified" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        SBT #{searchResult.details?.tokenId}
                      </span>
                      <span className="text-xs text-emerald-400 font-semibold">Tín Nhiệm 100%</span>
                    </div>
                    <h3 className="text-base font-bold text-white tracking-tight">{searchResult.identifier}</h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{searchResult.description}</p>
                  </div>
                </div>
                <Link
                  href={`/create?broker=${searchResult.details?.id}`}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shrink-0 flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  Tạo Kèo Với GDTG Này <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}

            {searchResult.type === "CLEAN" && (
              <div className="p-6 rounded-2xl border border-blue-500/30 bg-gradient-to-r from-blue-950/30 via-slate-900/50 to-[#0a101f] shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm sm:text-base font-bold text-white">{searchResult.title}</h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{searchResult.description}</p>
                  </div>
                </div>
                <Link
                  href="/create"
                  className="px-5 py-2.5 rounded-xl bg-white text-[#0B1120] hover:bg-slate-100 text-xs font-bold shrink-0 shadow-md transition-all"
                >
                  Mở Phòng Ký Quỹ Ba Bên
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Live Protocol Stats Strip */}
        <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
          <div className="p-3.5 rounded-xl bg-[#060A14]/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Sổ Đen Ghi Nhận</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">{scamReports.length}+ Đối Tượng</div>
            <span className="text-[11px] text-red-400 font-mono block">Bất biến trên Custom L1</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060A14]/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Phí Tra Cứu</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">0đ Gas</div>
            <span className="text-[11px] text-slate-400 font-mono block">Avalanche Subnet EVM</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060A14]/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Tốc Độ Xác Thực</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-white">0.8 Giây</div>
            <span className="text-[11px] text-slate-400 font-mono block">Finality Fuji C-Chain</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#060A14]/60 border border-slate-800 space-y-1">
            <span className="text-[11px] font-mono text-slate-400 block uppercase">Lãi Kép Aave V3</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400">5.20% APY</div>
            <span className="text-[11px] text-slate-400 font-mono block">Lợi tức thực trong két sắt</span>
          </div>
        </div>
      </section>

      {/* ── 3 CORE PILLARS (BENTO GRID) ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-[#0D1424]/90 border border-slate-800 hover:border-slate-700 shadow-xl transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center">
              <Radar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Sổ Đen On-Chain (Scam Radar)</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Hợp đồng <code className="text-red-300 font-mono">ScamRegistryL1.sol</code> lưu trữ báo cáo cộng đồng bất biến.
              Tra cứu miễn phí 0đ gas, không bên thứ ba nào có thể can thiệp hay xóa bỏ.
            </p>
          </div>
          <Link
            href="/radar"
            className="text-xs font-semibold text-red-400 hover:text-red-300 flex items-center gap-1.5 transition-colors pt-2"
          >
            Mở Radar Nâng Cao <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D1424]/90 border border-slate-800 hover:border-slate-700 shadow-xl transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Két Sắt Ký Quỹ Ba Bên</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Phong tỏa tiền trong Smart Contract <code className="text-blue-300 font-mono">UniversalEscrow.sol</code>.
              Nguồn tiền sinh lãi Aave V3 trong thời gian chờ. Trung gian xác thực xong giải ngân ngay trong 0.8s.
            </p>
          </div>
          <Link
            href="/create"
            className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors pt-2"
          >
            Khởi Tạo Hợp Đồng Mới <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-[#0D1424]/90 border border-slate-800 hover:border-slate-700 shadow-xl transition-all space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">TrustPassport SBT Danh Tiếng</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Thẻ định danh Soulbound Token (ERC-721) không thể chuyển nhượng.
              Tích lũy điểm tín nhiệm thật, số kèo thành công và tiền cọc Aave bảo chứng minh bạch on-chain.
            </p>
          </div>
          <Link
            href="/broker"
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-colors pt-2"
          >
            Khám Phá Thương Nhân <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── LIVE ESCROW ROOMS ──────────────────────────────────── */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              Phòng Ký Quỹ Đang Hoạt Động
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Smart Contract UniversalEscrow.sol · Avalanche Fuji C-Chain
            </p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md transition-all shrink-0"
          >
            <Lock className="w-3.5 h-3.5" />
            Tạo Hợp Đồng Mới
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {deals.map((deal) => (
            <Link
              key={deal.id}
              href={`/room/${deal.id}`}
              className="group p-5 rounded-2xl bg-[#0D1424]/90 border border-slate-800 hover:border-blue-500/50 hover:shadow-xl transition-all space-y-3.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400 group-hover:text-blue-300 transition-colors">
                  #{deal.id}
                </span>
                <StatusBadge status={deal.status === "SLASHED" ? "SCAM" : deal.status} size="sm" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors line-clamp-2 leading-relaxed">
                  {deal.title}
                </p>
                <div className="text-[11px] text-slate-400">
                  Phân loại: <span className="text-slate-300">{deal.category}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-mono">GIÁ TRỊ KÝ QUỸ</span>
                  <span className="font-mono font-bold text-base text-white tabular-nums">
                    {deal.amount.toLocaleString()} USDC
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-mono">TRUNG GIAN</span>
                  <span className="font-medium text-slate-300 truncate max-w-[120px] block">
                    {deal.brokerName.split("(")[0].trim()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── VERIFIED BROKERS (GDTG BẢO CHỨNG CỌC AAVE) ────────────────────── */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Thương Nhân Trung Gian Đã Bảo Chứng Cọc
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hạn mức nhận kèo = 120% tiền cọc gửi trong Aave V3 Lending Pool
            </p>
          </div>
          <Link
            href="/broker"
            className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
          >
            Xem Quản Lý Cọc &amp; Lãi Aave <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {brokers.map((broker) => {
            const utilization = Math.min(100, Math.round((broker.activeAllocated / broker.maxLimit) * 100));
            return (
              <div
                key={broker.id}
                className="p-5 rounded-2xl bg-[#0D1424]/90 border border-slate-800 hover:border-slate-700 shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Identicon address={broker.address} size={42} rankBadge={broker.badge} />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-white truncate">
                        {broker.name.split("(")[0].trim()}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className="text-amber-400 flex items-center font-semibold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                          {broker.rating}
                        </span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400 font-mono">{broker.completedDeals} kèo thành công</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#060A14] border border-slate-800/80 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Cọc Aave V3:</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {broker.stakedAmount.toLocaleString()} USDC
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Hạn mức tối đa (120%):</span>
                      <span className="font-mono font-bold text-white">
                        {broker.maxLimit.toLocaleString()} USDC
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1 font-mono">
                        <span>Đang bảo chứng: {broker.activeAllocated.toLocaleString()} USDC</span>
                        <span className="text-slate-300 font-semibold">{utilization}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/create?broker=${broker.id}`}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
                >
                  Ủy Thác Giám Định Kèo Này <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── TRUSTPASSPORT SBT SHOWCASE ─────────────────────────────────────── */}
      <section className="space-y-5">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            TrustPassport — Danh Tính &amp; Uy Tín On-Chain (SBT)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Hợp đồng TrustPassportSBT.sol · Tiêu chuẩn ERC-721 Soulbound Token không thể mua bán hay chuyển nhượng
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-5">
            <TrustPassportCard
              name="Nguyễn Nam (Giám Định Tài Sản Số)"
              address="0x30F1492bC78E12a899Ad34De91eF11B12E7a889A"
              tokenId="889A"
              tierTitle="Master Auditor (Cấp 4)"
              score={99}
              dealsCount={128}
              successRate={100}
              stakedAmount={5000}
            />
          </div>

          <div className="lg:col-span-7 p-6 sm:p-7 rounded-2xl bg-[#0D1424]/90 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight">
              Tại sao Soulbound Token loại bỏ hoàn toàn gian lận trung gian?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Khác với các nhóm trung gian truyền thống trên Facebook hay Telegram rất dễ bị mạo danh hoặc clone tài khoản,
              TrustPact gắn chặt danh tiếng của từng thương nhân vào một hợp đồng SBT bất biến.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              <div className="p-3.5 rounded-xl bg-[#060A14] border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Không Thể Mua Bán</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gắn vĩnh viễn với địa chỉ ví Ethereum của thương nhân, ngăn chặn tình trạng mua nick uy tín.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#060A14] border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-red-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cơ Chế Slashing Tự Động</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nếu trung gian có hành vi thông đồng gian lận, hợp đồng tự động trích cọc Aave bồi hoàn 100% cho nạn nhân.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#060A14] border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Lịch Sử Minh Bạch 100%</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Từng giao dịch giải ngân hoặc hoàn tiền đều được ghi nhận trực tiếp vào metadata của SBT on-chain.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#060A14] border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tip &amp; Đánh Giá Trực Tiếp</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Người mua có thể chấm sao và tip USDC trực tiếp vào SBT sau khi hoàn tất phiên giao dịch an toàn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── REPORT SCAM MODAL ──────────────────────────────────── */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="rounded-2xl max-w-md w-full border border-slate-700 bg-[#0B1120] overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Báo Cáo Đối Tượng Gian Lận
                </h2>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Loại định danh đối tượng:</label>
                <select
                  value={reportIdType}
                  onChange={(e) => setReportIdType(e.target.value as "PHONE" | "BANK_ACCOUNT" | "WALLET")}
                  className="w-full bg-[#060A14] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
                >
                  <option value="BANK_ACCOUNT">Số Tài Khoản Ngân Hàng</option>
                  <option value="PHONE">Số Điện Thoại / OTT</option>
                  <option value="WALLET">Địa Chỉ Ví Tiền Mã Hóa</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Định danh đối tượng nghi vấn:</label>
                <input
                  type="text"
                  value={reportIdentifier}
                  onChange={(e) => setReportIdentifier(e.target.value)}
                  placeholder="Ví dụ: 1903889922101 hoặc 0909999888..."
                  className="w-full bg-[#060A14] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Mô tả hành vi lừa đảo:</label>
                <textarea
                  rows={3}
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="Làm giả biên lai chuyển khoản ngân hàng, nhận cọc xong chặn liên lạc..."
                  className="w-full bg-[#060A14] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-red-500 resize-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Mã băm chứng từ IPFS (tùy chọn):</label>
                <input
                  type="text"
                  value={reportIPFS}
                  onChange={(e) => setReportIPFS(e.target.value)}
                  placeholder="ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
                  className="w-full bg-[#060A14] border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 font-medium transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold shadow-md transition-all"
                >
                  Ghi Lên Avalanche L1 (0đ Gas)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
