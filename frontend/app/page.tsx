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
  Layers,
  AlertOctagon,
  Award,
  Lock,
  ChevronRight,
  Activity,
} from "lucide-react";
import { AaveIcon } from "../components/CryptoIcons";
import { useStore } from "../lib/store";
import { EscrowSimulationHero } from "../components/EscrowSimulationHero";
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
        title: "CẢNH BÁO ĐỎ: ĐỐI TƯỢNG NẰM TRONG SỔ ĐEN ON-CHAIN",
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
        title: "THƯƠNG NHÂN BẢO CHỨNG UY TÍN (ĐÃ CỌC AAVE V3)",
        description: `Đã ký thác cọc bảo hiểm ${brokerFound.stakedAmount.toLocaleString()} USDC vào Lending Pool Aave V3. Hạn mức tiếp nhận hợp đồng tối đa ${brokerFound.maxLimit.toLocaleString()} USDC.`,
        details: brokerFound,
      });
      return;
    }
    setSearchResult({
      type: "CLEAN",
      identifier: rawQuery,
      title: "HỒ SƠ CHƯA PHÁT HIỆN DẤU HIỆU VI PHẠM",
      description:
        "Định danh này không nằm trong sổ đen của Avalanche Subnet L1. Để an toàn 100%, hãy khởi tạo Phòng Ký Quỹ Ba Bên trước khi chuyển tiền.",
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
    setReportSuccessNotice(
      "Báo cáo vi phạm đã được ghi nhận vào sổ đen Avalanche Custom L1 với chi phí 0đ Gas!"
    );
    setTimeout(() => setReportSuccessNotice(null), 4000);
  };
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-14 pb-24">
      <EscrowSimulationHero />
      <section className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs font-semibold">
              <Layers className="w-3.5 h-3.5 text-rose-400" />
              <span>ScamRegistryL1.sol • Avalanche Custom L1 (0đ Gas)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Tra Cứu Gian Lận & Xác Thực Tín Nhiệm Tức Thì
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center space-x-1.5 transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Báo Cáo Scam (0đ Gas)</span>
            </button>
            <Link
              href="/radar"
              className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 text-xs font-semibold flex items-center space-x-1 transition-all"
            >
              <span>Mở Máy Quét Chuyên Sâu</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
        <form onSubmit={handleSearch} className="space-y-3">
          <div className="rounded-2xl bg-[#04060B] border border-white/[0.1] focus-within:border-blue-500 p-2 flex items-center shadow-inner">
            <Search className="w-5 h-5 text-slate-400 ml-3 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập STK ngân hàng (vd: 1903889922101), SĐT, Telegram hoặc địa chỉ ví 0x..."
              className="w-full bg-transparent px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shrink-0 shadow-md"
            >
              Kiểm Tra Ngay
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 text-[11px]">Dữ liệu mẫu:</span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("1903889922101");
                runLookup("1903889922101");
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 font-mono text-[11px]"
            >
              ⚠️ STK Scam: 1903889922101
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("@otc_vn_fake_admin");
                runLookup("@otc_vn_fake_admin");
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-300 font-mono text-[11px]"
            >
              ⚠️ Tele Clone: @otc_vn_fake_admin
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("0x30F1492bC78E12a899Ad34De91eF11B12E7a889A");
                runLookup("0x30F1492bC78E12a899Ad34De91eF11B12E7a889A");
              }}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-300 font-mono text-[11px]"
            >
              ✅ GDTG Nguyễn Nam: 0x30F1...889A
            </button>
          </div>
        </form>
        {reportSuccessNotice && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{reportSuccessNotice}</span>
          </div>
        )}
        {searchResult && (
          <div className="pt-1">
            {searchResult.type === "SCAM" && (
              <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-2">
                <div className="flex items-start space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0">
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">
                        ĐÃ XÁC THỰC BỞI MODERATOR
                      </span>
                      <span className="text-xs font-mono text-rose-400 font-bold">
                        {searchResult.details?.count} lượt tố cáo
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-rose-400">{searchResult.title}</h3>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      <strong>Hành vi:</strong> {searchResult.description}
                    </p>
                    <div className="text-[11px] font-mono text-slate-400 pt-1">
                      Bằng chứng IPFS: <span className="text-rose-300 underline">{searchResult.details?.evidence}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {searchResult.type === "VERIFIED_BROKER" && (
              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3.5">
                  <Identicon address={searchResult.details?.address} size={46} rankBadge="Verified" />
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">
                      SBT PASS #{searchResult.details?.tokenId}
                    </span>
                    <h3 className="text-sm font-bold text-white">{searchResult.identifier}</h3>
                    <p className="text-xs text-slate-300">{searchResult.description}</p>
                  </div>
                </div>
                <Link
                  href={`/create?broker=${searchResult.details?.id}`}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 flex items-center space-x-1.5"
                >
                  <span>Tạo Kèo Với GDTG Này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
            {searchResult.type === "CLEAN" && (
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <ShieldCheck className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-white">{searchResult.title}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{searchResult.description}</p>
                  </div>
                </div>
                <Link
                  href="/create"
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0"
                >
                  Mở Ký Quỹ Bảo Vệ
                </Link>
              </div>
            )}
          </div>
        )}
      </section>
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <span>Sổ Lệnh Hợp Đồng Ký Quỹ Trực Tiếp (Live Escrow Rooms)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Bấm vào bất kỳ phòng đối soát nào để kiểm tra trạng thái phong tỏa quỹ và nghiệm thu thời gian thực.
            </p>
          </div>
          <Link
            href="/create"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold self-start sm:self-auto"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>+ Tạo Hợp Đồng Mới</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {deals.map((deal) => (
            <Link
              key={deal.id}
              href={`/room/${deal.id}`}
              className="glass-panel-interactive rounded-2xl p-5 flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono text-xs font-bold">
                    PHÒNG #{deal.id}
                  </span>
                  <StatusBadge
                    status={deal.status === "SLASHED" ? "SCAM" : deal.status}
                    size="sm"
                  />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                  {deal.title}
                </h3>
                <div className="p-3 rounded-xl bg-[#04060B]/90 border border-white/[0.06] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Giá trị phong tỏa</span>
                    <span className="text-base font-mono font-extrabold text-emerald-400">
                      {deal.amount.toLocaleString()} USDC
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Chế độ Aave V3</span>
                    <span className="text-xs font-mono font-semibold text-purple-300">
                      +5.20% APY
                    </span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                <span className="truncate max-w-[180px]">
                  GDTG: <strong className="text-slate-200">{deal.brokerName}</strong>
                </span>
                <span className="text-blue-400 font-semibold inline-flex items-center space-x-1 shrink-0">
                  <span>Vào phòng</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Hội Đồng Thương Nhân Bảo Chứng (Đã Cọc Aave V3)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hạn mức bảo lãnh tối đa bằng 120% số dư cọc aUSDC đang gửi trong StakedBrokerRegistry.sol.
            </p>
          </div>
          <Link
            href="/broker"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center space-x-1"
          >
            <span>Dashboard Quản Lý Cọc Aave V3</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {brokers.map((broker) => {
            const utilization = Math.min(
              100,
              Math.round((broker.activeAllocated / broker.maxLimit) * 100)
            );
            return (
              <div
                key={broker.id}
                className="glass-panel-interactive rounded-2xl p-5 space-y-4 flex flex-col justify-between"
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

                  <div className="space-y-2 pt-2 border-t border-white/[0.06] text-xs">
                    <div className="flex justify-between items-center text-slate-400">
                      <span>Cọc Aave V3:</span>
                      <span className="font-mono font-semibold text-emerald-400 flex items-center space-x-1 tabular-nums">
                        <AaveIcon className="w-3 h-3" />
                        <span>{broker.stakedAmount.toLocaleString()} USDC</span>
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-400">
                      <span>Hạn mức tối đa:</span>
                      <span className="font-mono font-bold text-white tabular-nums">
                        {broker.maxLimit.toLocaleString()} USDC
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Hạn mức đang dùng ({utilization}%):</span>
                        <span className="font-mono text-amber-400">{broker.activeAllocated.toLocaleString()} USDC</span>
                      </div>
                      <div className="w-full bg-[#04060B] rounded-full h-1.5 overflow-hidden border border-white/[0.06]">
                        <div
                          className={`h-full rounded-full transition-all ${
                            utilization > 80 ? "bg-rose-500" : utilization > 50 ? "bg-amber-400" : "bg-emerald-400"
                          }`}
                          style={{ width: `${utilization}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    href={`/create?broker=${broker.id}`}
                    className="w-full py-2.5 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-200 hover:text-white font-medium text-xs flex items-center justify-center space-x-1.5 transition-all shadow-sm"
                  >
                    <span>Ủy Thác Giám Định</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Soulbound Reputation Token Showcase */}
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

          <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed p-6 rounded-2xl glass-panel">
            <h3 className="text-sm font-bold text-white">Tại sao Soulbound Token loại bỏ gian lận?</h3>
            <ul className="space-y-2.5">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Không thể mua bán hay chuyển nhượng:</strong> Huy hiệu gắn chặt vĩnh viễn với địa chỉ ví của thương nhân qua chuẩn ERC-721 Soulbound.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Cơ chế Chém Cọc (Slashing) tức thì:</strong> Nếu có hành vi cấu kết chiếm đoạt, hợp đồng UniversalEscrow tự động kích hoạt lệnh bồi hoàn 100% cho Bên Mua từ cọc Aave của GDTG.</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Chấm điểm & Tip trực tiếp on-chain:</strong> Người dùng sau khi nhận hàng có thể đánh giá số sao và gửi khoản tip USDC khích lệ trực tiếp vào SBT của Broker.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Report Scam Modal */}
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
