"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  Search, ShieldAlert, ShieldCheck, Lock, Star, 
  ArrowRight, CheckCircle2, AlertTriangle, ExternalLink,
  Coins, Zap, RefreshCw, Check, Sparkles, UserCheck, ChevronRight,
  PlusCircle, FileText, X, Layers, AlertOctagon
} from "lucide-react";
import { AvalancheIcon, UsdcIcon, AaveIcon, SbtBadgeIcon } from "../components/CryptoIcons";
import { useStore } from "../lib/store";

export default function HomePage() {
  const router = useRouter();
  const { brokers, scamReports, addScamReport } = useStore();

  // Search Engine State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "BANK_ACCOUNT" | "PHONE" | "WALLET">("ALL");
  const [searchResult, setSearchResult] = useState<null | {
    type: "SCAM" | "VERIFIED_BROKER" | "CLEAN";
    identifier: string;
    title: string;
    description: string;
    details?: any;
  }>(null);

  // Modal Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportIdType, setReportIdType] = useState<"PHONE" | "BANK_ACCOUNT" | "WALLET">("BANK_ACCOUNT");
  const [reportIdentifier, setReportIdentifier] = useState("");
  const [reportNote, setReportNote] = useState("");
  const [reportIPFS, setReportIPFS] = useState("");
  const [reportSuccessNotice, setReportSuccessNotice] = useState<string | null>(null);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    const query = searchQuery.trim().toLowerCase();

    // 1. Check against blacklist (Scam Registry)
    const scamFound = scamReports.find(
      (r) => r.identifier.toLowerCase().includes(query) || query.includes(r.identifier.toLowerCase())
    );

    if (scamFound) {
      setSearchResult({
        type: "SCAM",
        identifier: scamFound.identifier,
        title: "CẢNH BÁO: ĐỐI TƯỢNG NẰM TRONG DANH SÁCH ĐEN",
        description: scamFound.victimNote,
        details: {
          idType: scamFound.idType,
          evidence: scamFound.evidenceIPFS,
          date: scamFound.timestamp,
        },
      });
      return;
    }

    // 2. Check against Verified Staked Brokers
    const brokerFound = brokers.find(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        b.address.toLowerCase().includes(query) ||
        b.title.toLowerCase().includes(query)
    );

    if (brokerFound) {
      setSearchResult({
        type: "VERIFIED_BROKER",
        identifier: brokerFound.name,
        title: "THƯƠNG NHÂN TRUNG GIAN UY TÍN (ĐÃ CỌC AAVE V3)",
        description: `Đã ký thác cọc bảo hiểm ${brokerFound.stakedAmount.toLocaleString()} USDC vào Lending Pool Aave V3. Hạn mức tiếp nhận hợp đồng tối đa ${brokerFound.maxLimit.toLocaleString()} USDC.`,
        details: brokerFound,
      });
      return;
    }

    // 3. Clean result
    setSearchResult({
      type: "CLEAN",
      identifier: searchQuery,
      title: "HỒ SƠ CHƯA PHÁT HIỆN DẤU HIỆU VI PHẠM",
      description: "Dữ liệu không nằm trong sổ đen của Avalanche Subnet L1. Để an toàn tuyệt đối 100%, hãy yêu cầu mở Phòng Ký Quỹ Ba Bên trước khi chuyển tiền.",
    });
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
    setReportSuccessNotice("Báo cáo vi phạm đã được ghi nhận vào sổ đen Avalanche Custom L1 với chi phí 0đ Gas!");
    setTimeout(() => setReportSuccessNotice(null), 4000);
  };

  const filteredScamList = scamReports.filter((r) => {
    if (activeFilter !== "ALL" && r.idType !== activeFilter) return false;
    return true;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-10 pb-20">
      
      {/* =========================================================================
          HERO: TRUNG TÂM TRA CỨU TÍN NHIỆM & PHÒNG CHỐNG GIAN LẬN
          ========================================================================= */}
      <section className="text-center space-y-4 pt-2">
        
        {/* Network Eyebrow Badge */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300">
          <AvalancheIcon className="w-3.5 h-3.5" />
          <span>Avalanche Custom L1 Subnet</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-semibold">Miễn Phí 0đ Gas</span>
        </div>

        {/* Clean, Professional Title (Not screaming 5xl/6xl) */}
        <div className="space-y-2 max-w-2xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Tra Cứu Gian Lận & Xác Thực Tín Nhiệm On-Chain
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
            Cơ sở dữ liệu phòng chống lừa đảo P2P phi tập trung trên Avalanche. Kiểm tra tức thời số tài khoản ngân hàng, số điện thoại hoặc địa chỉ ví trước khi giao dịch.
          </p>
        </div>

        {/* Professional Search Input Box */}
        <div className="max-w-2xl mx-auto space-y-2.5 pt-2">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative rounded-xl bg-[#0f131c] border border-slate-700/70 focus-within:border-blue-500/80 shadow-md p-1.5 flex items-center transition-colors">
              <Search className="w-4 h-4 text-slate-400 ml-2.5 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập số tài khoản ngân hàng (vd: 1903889922101), số điện thoại hoặc địa chỉ ví..."
                className="w-full bg-transparent px-3 py-1.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition-colors shrink-0"
              >
                Tra Cứu
              </button>
            </div>
          </form>

          {/* Clean Quick Preset Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-500 text-[11px]">Thử nhanh:</span>
              <button
                onClick={() => {
                  setSearchQuery("1903889922101");
                  setTimeout(() => handleSearch(), 50);
                }}
                className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-slate-300 font-mono text-[11px] transition-colors"
              >
                STK: 1903889922101
              </button>
              <button
                onClick={() => {
                  setSearchQuery("Nguyễn Nam");
                  setTimeout(() => handleSearch(), 50);
                }}
                className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 text-emerald-400 text-[11px] font-medium transition-colors"
              >
                Thương nhân: Nguyễn Nam
              </button>
            </div>

            <button
              onClick={() => setShowReportModal(true)}
              className="text-blue-400 hover:text-blue-300 font-medium text-[11px] flex items-center space-x-1 transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Gửi báo cáo gian lận</span>
            </button>
          </div>
        </div>

        {reportSuccessNotice && (
          <div className="max-w-2xl mx-auto p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{reportSuccessNotice}</span>
          </div>
        )}

        {/* Search Result Display */}
        {searchResult && (
          <div className="max-w-2xl mx-auto text-left pt-2">
            {searchResult.type === "SCAM" && (
              <div className="p-5 rounded-xl bg-rose-950/20 border border-rose-500/40 shadow-md space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-500/15 text-rose-400 text-[10px] font-semibold uppercase font-mono">
                      <span>Đã Xác Thực On-Chain (Subnet L1)</span>
                    </div>
                    <h3 className="text-sm font-bold text-rose-400">{searchResult.title}</h3>
                    <div className="text-xs font-mono text-white font-semibold">{searchResult.identifier}</div>
                    <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                      <strong>Thủ đoạn:</strong> {searchResult.description}
                    </p>
                    {searchResult.details && (
                      <div className="text-[11px] text-slate-400 font-mono pt-2 border-t border-rose-500/20 flex flex-wrap gap-4">
                        <span>Bằng chứng IPFS: <span className="text-rose-400 underline">{searchResult.details.evidence}</span></span>
                        <span>Thời điểm: {searchResult.details.date}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {searchResult.type === "VERIFIED_BROKER" && (
              <div className="p-5 rounded-xl bg-slate-900 border border-emerald-500/40 shadow-md space-y-3">
                <div className="flex items-start space-x-3.5">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-emerald-500/30 shrink-0">
                    <Image
                      src={searchResult.details?.avatar || "/images/avatar-nam.jpg"}
                      alt={searchResult.identifier}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold font-mono">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Soulbound Token (ERC-721 Bất Biến)</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{searchResult.identifier}</h3>
                    <div className="text-xs text-slate-400">{searchResult.details?.title}</div>
                    <p className="text-xs text-slate-300 leading-relaxed pt-0.5">{searchResult.description}</p>
                    
                    <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-emerald-400 font-mono font-medium">Cọc Aave: {searchResult.details?.stakedAmount?.toLocaleString()} USDC</span>
                      <Link
                        href={`/create?broker=${searchResult.details?.id}`}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex items-center space-x-1"
                      >
                        <span>Ủy Thác Ký Quỹ</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {searchResult.type === "CLEAN" && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md space-y-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <h3 className="text-xs font-semibold text-white">{searchResult.title}</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{searchResult.description}</p>
                <div className="pt-1">
                  <Link
                    href="/create"
                    className="inline-flex items-center space-x-1 text-xs text-blue-400 hover:underline font-medium"
                  >
                    <span>Mở Hợp Đồng Ký Quỹ Ba Bên Để Bảo Vệ Tiền</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

      </section>

      {/* =========================================================================
          SỔ ĐEN GIAN LẬN ON-CHAIN (RECENT BLACKLIST RECORDS)
          ========================================================================= */}
      <section className="space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-slate-400" />
              <span>Sổ Đen Gian Lận Được Ghi Nhận On-Chain</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hợp đồng <code>ScamRegistryL1.sol</code> trên Avalanche Custom L1.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center space-x-1.5 text-xs">
            {[
              { id: "ALL", label: "Tất Cả" },
              { id: "BANK_ACCOUNT", label: "STK Ngân Hàng" },
              { id: "PHONE", label: "Số Điện Thoại" },
              { id: "WALLET", label: "Địa Chỉ Ví" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs transition-colors ${
                  activeFilter === f.id
                    ? "bg-slate-800 text-white font-medium border border-slate-700"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Clean Data Table */}
        <div className="rounded-xl bg-[#0f131c] border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800/80 text-[11px] text-slate-400 font-medium uppercase font-mono">
                  <th className="py-2.5 px-3">Đối Tượng</th>
                  <th className="py-2.5 px-3">Hành Vi & Thủ Đoạn</th>
                  <th className="py-2.5 px-3">Bằng Chứng IPFS</th>
                  <th className="py-2.5 px-3 text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredScamList.map((r, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-mono font-medium text-slate-200">{r.identifier}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{r.type}</div>
                    </td>
                    <td className="py-3 px-3 max-w-sm">
                      <p className="text-slate-300 text-xs leading-relaxed">{r.victimNote}</p>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] whitespace-nowrap">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span className="truncate max-w-[140px]">{r.evidenceIPFS}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <div className="text-[10px] text-slate-500 font-mono">{r.timestamp}</div>
                      <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono mt-0.5">
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span>Đã xác thực</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          HỘI ĐỒNG THƯƠNG NHÂN UY TÍN (CỌC BẢO CHỨNG AAVE V3)
          ========================================================================= */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Thương Nhân Trung Gian Đạt Chuẩn Tín Nhiệm (Cọc Aave V3)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Được bảo chứng bởi Soulbound Token và tài sản đảm bảo ký thác trong Aave V3.
            </p>
          </div>
          <Link
            href="/broker"
            className="text-xs text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
          >
            <span>Quản lý cọc Aave</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {brokers.map((broker) => (
            <div
              key={broker.id}
              className="p-4 rounded-xl bg-[#0f131c] border border-slate-800 hover:border-slate-700 transition-colors flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                    <Image
                      src={broker.avatar || "/images/avatar-nam.jpg"}
                      alt={broker.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{broker.name}</h3>
                    <div className="text-[11px] text-slate-400">{broker.title}</div>
                    <div className="flex items-center space-x-1 text-amber-400 text-[11px] font-medium mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span>{broker.rating} ({broker.dealsCount} kèo)</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Tiền cọc Aave:</span>
                    <span className="font-mono font-medium text-emerald-400">{broker.stakedAmount.toLocaleString()} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Hạn mức kèo:</span>
                    <span className="font-mono font-medium text-slate-200">{broker.maxLimit.toLocaleString()} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Chứng chỉ SBT:</span>
                    <span className="font-mono text-slate-300 text-[11px]">{broker.badge}</span>
                  </div>
                </div>
              </div>

              <Link
                href={`/create?broker=${broker.id}`}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium text-center transition-colors flex items-center justify-center space-x-1"
              >
                <span>Ủy Thác Giám Định</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          BANNER KÝ QUÝ: CHUYỂN ĐỔI SANG KÝ QUÝ BA BÊN
          ========================================================================= */}
      <section className="p-5 sm:p-6 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-slate-400 text-xs">
            <Lock className="w-3.5 h-3.5" />
            <span>Két Sắt Bảo Lưu Tiền Ba Bên (UniversalEscrow.sol)</span>
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-white">
            Chuẩn Bị Giao Dịch? Sử Dụng Phòng Ký Quỹ Ba Bên
          </h2>
          <p className="text-xs text-slate-400 max-w-xl font-normal">
            Khóa tiền vào Smart Contract, bên bán giao hàng, trung gian kiểm định và giải ngân tức thời 0.8s.
          </p>
        </div>

        <Link
          href="/create"
          className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shrink-0 flex items-center space-x-1.5 transition-colors shadow-sm"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Tạo Hợp Đồng Ký Quỹ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>

      {/* =========================================================================
          MODAL: BÁO CÁO VI PHẠM SCAM ON-CHAIN
          ========================================================================= */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="relative w-full max-w-md p-6 rounded-2xl bg-[#0f131c] border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-slate-200">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="font-semibold text-white text-sm">Gửi Báo Cáo Gian Lận On-Chain</h3>
              </div>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Phân loại đối tượng:
                </label>
                <select
                  value={reportIdType}
                  onChange={(e) => setReportIdType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="BANK_ACCOUNT">Số tài khoản ngân hàng</option>
                  <option value="PHONE">Số điện thoại / Telegram</option>
                  <option value="WALLET">Địa chỉ ví Web3</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Thông tin đối tượng:
                </label>
                <input
                  type="text"
                  value={reportIdentifier}
                  onChange={(e) => setReportIdentifier(e.target.value)}
                  placeholder="Ví dụ: 1903889922101 Techcombank..."
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Mô tả thủ đoạn:
                </label>
                <textarea
                  rows={3}
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="Mô tả cụ thể hành vi vi phạm..."
                  required
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-400 block mb-1">
                  Liên kết bằng chứng IPFS:
                </label>
                <input
                  type="text"
                  value={reportIPFS}
                  onChange={(e) => setReportIPFS(e.target.value)}
                  placeholder="ipfs://QmXoypizjW... (để trống nếu mặc định)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-sm"
              >
                Ghi Nhận Vào Sổ Đen On-Chain (0đ Gas)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-slate-300">TrustPact (UyTinNet) v2.4</span>
          <span>—</span>
          <span>Avalanche Custom L1 Subnet & Fuji C-Chain</span>
        </div>
        <div className="font-mono text-[11px] text-slate-500 flex items-center space-x-3">
          <span>Subnet Gas: 0đ</span>
          <span>•</span>
          <span>Aave V3 Lending Pool</span>
          <span>•</span>
          <span className="text-emerald-400">Snowman 0.8s</span>
        </div>
      </footer>

    </div>
  );
}
