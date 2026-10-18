"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, ShieldAlert, ShieldCheck, Lock, Star, 
  ArrowRight, CheckCircle2, AlertTriangle, ExternalLink,
  Coins, Zap, RefreshCw, Check, Sparkles, UserCheck, ChevronRight,
  PlusCircle, FileText, X, Layers, AlertOctagon, Award
} from "lucide-react";
import { AvalancheIcon, UsdcIcon, AaveIcon } from "../components/CryptoIcons";
import { useStore } from "../lib/store";
import { EscrowSimulationHero } from "../components/EscrowSimulationHero";
import { Identicon } from "../components/Identicon";
import { AddressCopy } from "../components/AddressCopy";
import { StatusBadge } from "../components/StatusBadge";
import { TrustPassportCard } from "../components/TrustPassportCard";

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
        b.badge.toLowerCase().includes(query)
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

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12 pb-24">
      
      {/* =========================================================================
          PILLAR 1: INTERACTIVE ESCROW SIMULATION HERO (V2)
          ========================================================================= */}
      <EscrowSimulationHero />

      {/* =========================================================================
          PILLAR 2: ON-CHAIN SCAM RADAR & SECURITY LOOKUP
          ========================================================================= */}
      <section className="space-y-6 pt-4">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold shadow-[inset_0_1px_0_0_rgba(59,130,246,0.1)]">
            <Layers className="w-3.5 h-3.5" />
            <span>Avalanche Custom L1 • Miễn Phí 0đ Gas</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Tra Cứu Gian Lận & Xác Thực Tín Nhiệm On-Chain
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
            Kiểm tra ngay số tài khoản ngân hàng, số điện thoại hoặc địa chỉ ví trước khi giao dịch P2P.
          </p>
        </div>

        {/* Search Bar Input */}
        <div className="max-w-2xl mx-auto space-y-2.5">
          <form onSubmit={handleSearch} className="relative">
            <div className="relative rounded-2xl bg-[#06080D] border border-white/[0.08] focus-within:border-blue-500/60 shadow-[0_4px_25px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.05)] p-1.5 flex items-center transition-all">
              <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nhập STK ngân hàng (vd: 1903889922101), SĐT hoặc địa chỉ ví..."
                className="w-full bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 transition-all shrink-0"
              >
                Tra Cứu
              </button>
            </div>
          </form>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 text-[11px]">Thử nhanh:</span>
              <button
                onClick={() => {
                  setSearchQuery("1903889922101");
                  setTimeout(() => handleSearch(), 50);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 font-mono text-[11px] transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
              >
                STK: 1903889922101
              </button>
              <button
                onClick={() => {
                  setSearchQuery("0x30F1492bC78E12a899Ad34De91eF11B12E7a889A");
                  setTimeout(() => handleSearch(), 50);
                }}
                className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-emerald-400 font-mono text-[11px] transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
              >
                Ví GDTG: 0x30F...889A
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
          <div className="max-w-2xl mx-auto p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{reportSuccessNotice}</span>
          </div>
        )}

        {/* Search Result Display */}
        {searchResult && (
          <div className="max-w-2xl mx-auto text-left pt-2">
            {searchResult.type === "SCAM" && (
              <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/40 shadow-[0_0_30px_rgba(244,63,94,0.12),inset_0_1px_0_0_rgba(255,255,255,0.05)] space-y-3">
                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 flex-1">
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
              <div className="p-5 rounded-2xl bg-[#080B11] border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.12),inset_0_1px_0_0_rgba(255,255,255,0.06)] space-y-3">
                <div className="flex items-start space-x-3.5">
                  <Identicon address={searchResult.details?.address || "0x00"} size={44} rankBadge="Verified" />
                  <div className="space-y-1 flex-1">
                    <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-semibold font-mono">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Soulbound Token (ERC-721 Bất Biến)</span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{searchResult.identifier}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {searchResult.description}
                    </p>
                    <div className="pt-2 flex items-center justify-between">
                      <AddressCopy address={searchResult.details?.address} />
                      <Link
                        href={`/create?broker=${searchResult.details?.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shadow-sm"
                      >
                        <span>Ủy Thác Giám Định</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {searchResult.type === "CLEAN" && (
              <div className="p-5 rounded-2xl bg-[#080B11] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] space-y-2">
                <div className="flex items-start space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h3 className="text-sm font-bold text-white">{searchResult.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed font-normal">
                      {searchResult.description}
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/create"
                        className="inline-flex items-center space-x-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium"
                      >
                        <span>Tạo phòng ký quỹ ba bên ngay</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* =========================================================================
          PILLAR 3: VERIFIED BROKER GUILD (Web3 Identicons & On-chain Staking)
          ========================================================================= */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Thương Nhân Trung Gian Đạt Chuẩn Tín Nhiệm (Cọc Aave V3)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Được bảo chứng bởi Soulbound Token và tài sản cọc bảo hiểm điều phối vào Aave V3.
            </p>
          </div>
          <Link
            href="/broker"
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1 transition-colors self-start sm:self-auto"
          >
            <span>Quản lý cọc Aave</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3 Staked Broker Cards using Web3 Identicons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {brokers.map((broker) => (
            <div
              key={broker.id}
              className="rounded-2xl bg-[#080B11]/80 border border-white/[0.07] p-5 space-y-4 hover:border-white/[0.15] hover:shadow-[0_12px_35px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Identicon address={broker.address} size={44} rankBadge={broker.badge} />
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate">{broker.name}</h3>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                      <span className="text-amber-400 flex items-center font-semibold">
                        <Star className="w-3 h-3 fill-amber-400 mr-1" />
                        {broker.rating}
                      </span>
                      <span>•</span>
                      <span className="text-[11px] font-mono text-slate-400">{broker.completedDeals} kèo</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-white/[0.06] text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Tiền cọc Aave:</span>
                    <span className="font-mono font-semibold text-[#2EBAC6] flex items-center space-x-1 tabular-nums">
                      <AaveIcon className="w-3 h-3" />
                      <span>{broker.stakedAmount.toLocaleString()} USDC</span>
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-400">
                    <span>Hạn mức kèo:</span>
                    <span className="font-mono font-bold text-white tabular-nums">
                      {broker.maxLimit.toLocaleString()} USDC
                    </span>
                  </div>

                  <div className="pt-1">
                    <span className="text-[10px] text-amber-300 font-mono block">
                      {broker.badge}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/create?broker=${broker.id}`}
                  className="w-full py-2 px-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 hover:text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition-all shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
                >
                  <span>Ủy Thác Giám Định</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          PILLAR 4: SOULBOUND REPUTATION TOKEN SHOWCASE (Pure CSS, No Static JPG)
          ========================================================================= */}
      <section className="space-y-5">
        <div className="border-b border-white/[0.06] pb-3">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Hệ Thống Tín Nhiệm Bất Biến TrustPassport (SBT)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Mỗi bên trung gian được cấp Soulbound Token (ERC-721 không thể chuyển nhượng) lưu trữ điểm tín nhiệm, tiền cọc và lịch sử giao dịch on-chain.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
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

          <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed p-6 rounded-2xl bg-[#080B11]/80 border border-white/[0.07] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
            <h3 className="text-sm font-bold text-white">Tại sao Soulbound Token loại bỏ gian lận?</h3>
            <ul className="space-y-2.5">
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Không thể mua bán hay chuyển nhượng:</strong> Huy hiệu gắn chặt vĩnh viễn với địa chỉ ví của thương nhân qua chuẩn ERC-721 Soulbound.</span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Cơ chế Chém Cọc (Slashing) tức thì:</strong> Nếu có hành vi cấu kết chiếm đoạt, hợp đồng UniversalEscrow tự động kích hoạt lệnh bồi hoàn 100% cho Bên Mua từ cọc Aave của GDTG.</span>
              </li>
              <li className="flex items-start space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Chấm điểm & Tip trực tiếp on-chain:</strong> Người dùng sau khi nhận hàng có thể đánh giá số sao và gửi khoản tip USDC khích lệ trực tiếp vào SBT của Broker.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* =========================================================================
          REPORT SCAM MODAL (0đ GAS AVALANCHE CUSTOM L1)
          ========================================================================= */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative bg-[#080B11] border border-white/[0.1] shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Gửi Báo Cáo Vi Phạm (0đ Gas On-Chain)</span>
              </h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Loại Định Danh:</label>
                <select
                  value={reportIdType}
                  onChange={(e) => setReportIdType(e.target.value as "PHONE" | "BANK_ACCOUNT" | "WALLET")}
                  className="w-full bg-[#05070B] border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 shadow-inner"
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
                  value={reportIdentifier}
                  onChange={(e) => setReportIdentifier(e.target.value)}
                  placeholder="Ví dụ: 1903889922101 hoặc 0909999888..."
                  className="w-full bg-[#05070B] border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Mô tả chi tiết hành vi gian lận:
                </label>
                <textarea
                  rows={2}
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="Mô tả thủ đoạn: Fake bill ngân hàng, nhận cọc rồi chặn liên lạc..."
                  className="w-full bg-[#05070B] border border-white/[0.08] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none shadow-inner"
                  required
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Mã băm chứng cứ IPFS (Tùy chọn):
                </label>
                <input
                  type="text"
                  value={reportIPFS}
                  onChange={(e) => setReportIPFS(e.target.value)}
                  placeholder="ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
                  className="w-full bg-[#05070B] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono text-[11px] focus:outline-none focus:border-blue-500 shadow-inner"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 font-medium text-xs transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-600/20 transition-all"
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
