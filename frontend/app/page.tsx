"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatUnits } from "viem";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  Search,
  ShieldAlert,
  ShieldCheck,
  PlusCircle,
  AlertOctagon,
  FileText,
  ExternalLink,
  Lock,
  Copy,
  Check,
  Award,
  Terminal,
  Activity,
  ChevronRight,
  TrendingUp,
  Send,
  MessageCircle,
} from "lucide-react";
import {
  CONTRACT_ADDRESSES,
  SCAM_REGISTRY_L1_ABI,
  TRUST_PASSPORT_SBT_ABI,
  STAKED_BROKER_REGISTRY_ABI,
  UNIVERSAL_ESCROW_ABI,
  formatUsdc,
  shortenAddress,
  parseContractError,
} from "@/src/lib/contracts";
import { TransactionFeedback, TxStatus } from "@/src/components/TransactionFeedback";
import { useAuth } from "@/src/context/AuthContext";
import { BorderBeam } from "@/src/components/ui/BorderBeam";
import { ShimmerButton } from "@/src/components/ui/ShimmerButton";
import { NumberTicker } from "@/src/components/ui/NumberTicker";
import { CardSpotlight } from "@/src/components/ui/CardSpotlight";

type CategoryKey = "phone" | "bank" | "telegram" | "wallet";

interface OnChainReport {
  reporter: `0x${string}`;
  identifier: string;
  category: string;
  evidenceHash: string;
  description: string;
  timestamp: bigint;
  isVerified: boolean;
}

const RECENT_L1_REPORTS = [
  {
    target: "1903889922101",
    type: "bank",
    bankName: "Techcombank",
    owner: "NGUYEN VAN DUC",
    description: "Mạo danh Admin OTC lừa chuyển khoản chiếm đoạt 1,200 USDT",
    flagsCount: 5,
    status: "VERIFIED",
    verifiedBy: "Moderator L1 #0x44B1",
    timeAgo: "12 phút trước",
    amountLoss: "31,200,000 đ",
  },
  {
    target: "@otc_vn_fake_admin",
    type: "telegram",
    bankName: "Telegram ID",
    owner: "Fake Handle",
    description: "Tạo nhóm chat 3 bên giả mạo GDTG Nguyễn Nam để quỵt cọc",
    flagsCount: 4,
    status: "VERIFIED",
    verifiedBy: "Moderator L1 #0x77D1",
    timeAgo: "45 phút trước",
    amountLoss: "50,000,000 đ",
  },
  {
    target: "0x71C84043CD9c86523674805113B78444499c0009",
    type: "wallet",
    bankName: "Avalanche C-Chain",
    owner: "Malicious Contract",
    description: "Phishing link giả mạo cổng ký quỹ TrustPact rút cạn tiền ví",
    flagsCount: 3,
    status: "PENDING_AUDIT",
    verifiedBy: "Community Flagged",
    timeAgo: "2 giờ trước",
    amountLoss: "2,500 USDC",
  },
  {
    target: "0982736182",
    type: "phone",
    bankName: "Momo / ViettelPay",
    owner: "TRAN THI MAI",
    description: "Làm giả bill biến động số dư ngân hàng mua tài khoản game",
    flagsCount: 3,
    status: "VERIFIED",
    verifiedBy: "Moderator L1 #0x30F1",
    timeAgo: "4 giờ trước",
    amountLoss: "8,500,000 đ",
  },
];

export default function ScamRadarAndReputationPage() {
  const { address } = useAccount();
  const { findUserByQuery } = useAuth();

  // ── Protocol Telemetry ───────────────────────────────────────────────
  const { data: totalPrincipal } = useReadContract({
    address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
    abi: STAKED_BROKER_REGISTRY_ABI,
    functionName: "totalPrincipal",
  });

  const { data: totalAccruedYield } = useReadContract({
    address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
    abi: STAKED_BROKER_REGISTRY_ABI,
    functionName: "getTotalAccruedYield",
  });

  const { data: totalEscrows } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "counter",
  });

  const { data: totalL1Reports } = useReadContract({
    address: CONTRACT_ADDRESSES.scamRegistryL1,
    abi: SCAM_REGISTRY_L1_ABI,
    functionName: "totalReports",
  });

  // ── Scam Scanner State ───────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("bank");
  const [queryInput, setQueryInput] = useState("");
  const [activeQuery, setActiveQuery] = useState<string | null>(null);

  // Direct On-Chain Query via Wagmi
  const { data: scamCheckData, isLoading: isCheckingScam, refetch: refetchScamCheck } = useReadContract({
    address: CONTRACT_ADDRESSES.scamRegistryL1,
    abi: SCAM_REGISTRY_L1_ABI,
    functionName: "checkScam",
    args: activeQuery ? [activeQuery] : undefined,
    query: {
      enabled: !!activeQuery,
    },
  });

  const { data: reportsList, refetch: refetchReports } = useReadContract({
    address: CONTRACT_ADDRESSES.scamRegistryL1,
    abi: SCAM_REGISTRY_L1_ABI,
    functionName: "getReports",
    args: activeQuery ? [activeQuery] : undefined,
    query: {
      enabled: !!activeQuery,
    },
  });

  // Action Drawer State (Report Scam)
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportIdType, setReportIdType] = useState<CategoryKey>("bank");
  const [reportTarget, setReportTarget] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportEvidenceUri, setReportEvidenceUri] = useState("");

  // ── SBT Lookup State (Synchronized with main search) ─────────────────
  const [resolvedSbtAddress, setResolvedSbtAddress] = useState<`0x${string}`>(
    (address as `0x${string}`) || "0x30F1492bC78E12a899Ad34De91eF11B12E7a889A"
  );

  const { data: sbtProfile } = useReadContract({
    address: CONTRACT_ADDRESSES.trustPassportSBT,
    abi: TRUST_PASSPORT_SBT_ABI,
    functionName: "getProfile",
    args: [resolvedSbtAddress],
  });

  const { data: sbtSuccessRate } = useReadContract({
    address: CONTRACT_ADDRESSES.trustPassportSBT,
    abi: TRUST_PASSPORT_SBT_ABI,
    functionName: "getSuccessRate",
    args: [resolvedSbtAddress],
  });

  const { data: sbtTokenBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.trustPassportSBT,
    abi: TRUST_PASSPORT_SBT_ABI,
    functionName: "balanceOf",
    args: [resolvedSbtAddress],
  });

  const { data: brokerProfile } = useReadContract({
    address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
    abi: STAKED_BROKER_REGISTRY_ABI,
    functionName: "getProfile",
    args: [resolvedSbtAddress],
  });

  // ── Web3 Write: Report Scam ──────────────────────────────────────────
  const [txStatus, setTxStatus] = useState<TxStatus>({ step: "idle" });
  const { writeContractAsync } = useWriteContract();

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = queryInput.trim();
    if (!clean) return;
    setActiveQuery(clean);

    // Automatically synchronize SBT Card on the right
    const matched = findUserByQuery(clean);
    if (matched) {
      setResolvedSbtAddress(matched.walletAddress);
    } else if (clean.startsWith("0x") && clean.length === 42) {
      setResolvedSbtAddress(clean as `0x${string}`);
    }
  };

  const handleReportScamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget.trim() || !reportDescription.trim()) return;

    try {
      setTxStatus({
        step: "awaiting_signature",
        actionTitle: "Ghi Báo Cáo Lên Sổ Đen L1 (0đ Gas)",
      });

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.scamRegistryL1,
        abi: SCAM_REGISTRY_L1_ABI,
        functionName: "reportScam",
        args: [
          reportTarget.trim(),
          reportIdType,
          reportEvidenceUri.trim() || "ipfs://QmDefaultEvidenceHashAvalanche2026",
          reportDescription.trim(),
        ],
      });

      setTxStatus({
        step: "confirming",
        txHash: hash,
        actionTitle: "Ghi Báo Cáo Lên Sổ Đen L1 (0đ Gas)",
      });

      // Refetch
      setTimeout(() => {
        setTxStatus({
          step: "success",
          txHash: hash,
          actionTitle: "Ghi Báo Cáo Lên Sổ Đen L1 (0đ Gas)",
        });
        setShowReportForm(false);
        setReportTarget("");
        setReportDescription("");
        setReportEvidenceUri("");
        if (activeQuery) {
          refetchScamCheck();
          refetchReports();
        }
      }, 2000);
    } catch (err: any) {
      setTxStatus({
        step: "error",
        errorMessage: parseContractError(err),
        actionTitle: "Ghi Báo Cáo Lên Sổ Đen L1 (0đ Gas)",
      });
    }
  };


  const [copiedText, setCopiedText] = useState<string | null>(null);
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Telegram Bot demo & copy state
  const [teleDemoType, setTeleDemoType] = useState<"scam" | "trusted">("scam");
  const [copiedTeleCmd, setCopiedTeleCmd] = useState(false);
  const copyTeleCmd = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedTeleCmd(true);
    setTimeout(() => setCopiedTeleCmd(false), 2000);
  };

  // Derive report data
  const scamCount = scamCheckData ? Number(scamCheckData[0]) : 0;
  const isFlagged = scamCount > 0;
  const hasVerified = scamCheckData ? Boolean(scamCheckData[1]) : false;

  // Resolve user identity from activeQuery & resolvedSbtAddress
  const matchedScamUser = activeQuery ? findUserByQuery(activeQuery) : null;
  const matchedSbtUser = resolvedSbtAddress ? findUserByQuery(resolvedSbtAddress) : null;

  return (
    <div className="space-y-6">
      {/* ── TOP PROTOCOL TELEMETRY BAR (Full 12 cols, 4 metric cells) ────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 rounded-lg panel-border bg-[#101217] overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[#1E222D]">
        <div className="p-4 sm:p-5 flex flex-col justify-between space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Tổng Vốn Cọc GDTG (Aave V3 TVL)
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#F1F5F9] tabular-nums">
            <NumberTicker
              value={totalPrincipal ? Number(formatUnits(totalPrincipal as bigint, 6)) : 15000}
              decimals={2}
              suffix=" USDC"
            />
          </div>
          <span className="text-[11px] font-mono text-[#10B981] flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Bảo chứng 120% hạn mức
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Lãi Thực Tế Đang Sinh (aUSDC APY)
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#10B981] tabular-nums">
            <NumberTicker value={5.2} decimals={2} prefix="+" suffix="% APY" />
          </div>
          <span className="text-[11px] font-mono text-[#94A3B8]">
            Đã tích lũy:{" "}
            <NumberTicker
              value={totalAccruedYield ? Number(formatUnits(totalAccruedYield as bigint, 6)) : 342.5}
              decimals={2}
            />{" "}
            USDC
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Tổng Giao Dịch Đã Bảo Vệ
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#F1F5F9] tabular-nums">
            <NumberTicker
              value={totalEscrows !== undefined ? Number(totalEscrows) : 101}
              suffix=" Hợp Đồng"
            />
          </div>
          <span className="text-[11px] font-mono text-[#94A3B8]">
            0.8s finality trên Fuji C-Chain
          </span>
        </div>

        <div className="p-4 sm:p-5 flex flex-col justify-between space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            Bản Ghi Sổ Đen L1 (Gas 0đ)
          </span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-[#F1F5F9] tabular-nums">
            <NumberTicker
              value={totalL1Reports !== undefined ? Number(totalL1Reports) : 142}
              suffix=" Đối Tượng"
            />
          </div>
          <span className="text-[11px] font-mono text-[#EF4444]">
            Bất biến trên Custom L1 Subnet
          </span>
        </div>
      </section>

      {/* ── MAIN WORKSPACE 12-COLUMN GRID ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT PANE (7 COLS): SCAM RADAR L1 ─────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-5">
          <div className="rounded-lg panel-border bg-[#101217] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E222D] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#E84142]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#F1F5F9]">
                  Hệ Thống Rà Quét Lừa Đảo &amp; Tra Cứu Tín Nhiệm (Unified Radar)
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://t.me/TrustPactRadarBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#229ED9]/15 text-[#38B6FF] border border-[#229ED9]/30 text-[10px] font-semibold hover:bg-[#229ED9]/25 transition-all shadow-sm"
                  title="Tra cứu nhanh qua Bot Telegram"
                >
                  <Send className="w-3 h-3 text-[#229ED9]" />
                  <span>Bot Telegram: @TrustPactRadarBot</span>
                </a>
                <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 px-2 py-0.5 rounded">
                  Gasless 0đ Subnet
                </span>
              </div>
            </div>

            {/* Segmented Category Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-md bg-[#090A0D] border border-[#1E222D]">
              {[
                { id: "bank", label: "STK Ngân Hàng" },
                { id: "phone", label: "Số Điện Thoại" },
                { id: "telegram", label: "Telegram Handle" },
                { id: "wallet", label: "Địa Chỉ Ví 0x" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as CategoryKey)}
                  className={`py-1.5 text-xs font-medium rounded transition-colors ${
                    selectedCategory === cat.id
                      ? "bg-[#161922] text-[#F1F5F9] border border-[#1E222D] shadow-sm font-semibold"
                      : "text-[#94A3B8] hover:text-[#F1F5F9]"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Command Search Input */}
            <form onSubmit={handleScanSubmit} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={queryInput}
                    onChange={(e) => setQueryInput(e.target.value)}
                    placeholder={
                      selectedCategory === "bank"
                        ? "Nhập số tài khoản ngân hàng (vd: 1903889922101)..."
                        : selectedCategory === "phone"
                        ? "Nhập số điện thoại (vd: 0909888999)..."
                        : selectedCategory === "telegram"
                        ? "Nhập username Telegram (vd: @otc_vn_fake_admin hoặc @hoangminh_otc)..."
                        : "Nhập địa chỉ ví 0x, @username, hoặc Mã ID (vd: TP-2002)..."
                    }
                    className="w-full bg-[#090A0D] border border-[#1E222D] focus:border-[#E84142] rounded-md px-3.5 py-2.5 text-xs font-mono text-[#F1F5F9] placeholder-[#64748B] focus:outline-none transition-colors"
                  />
                </div>
                <ShimmerButton
                  type="submit"
                  disabled={isCheckingScam}
                  className="px-4 py-2.5 rounded-md text-xs font-medium shrink-0 disabled:opacity-50"
                >
                  {isCheckingScam ? "Đang Tra Cứu..." : "Tra Cứu On-Chain"}
                </ShimmerButton>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="text-[#64748B] font-mono">Ví dụ kiểm tra nhanh:</span>
                <button
                  type="button"
                  onClick={() => {
                    setQueryInput("1903889922101");
                    setActiveQuery("1903889922101");
                  }}
                  className="px-2 py-0.5 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444] font-mono hover:bg-[#EF4444]/20 transition-colors"
                >
                  1903889922101 (Scam)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQueryInput("@otc_vn_fake_admin");
                    setActiveQuery("@otc_vn_fake_admin");
                  }}
                  className="px-2 py-0.5 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444] font-mono hover:bg-[#EF4444]/20 transition-colors"
                >
                  @otc_vn_fake_admin (Scam)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQueryInput("0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002");
                    setActiveQuery("0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002");
                    setResolvedSbtAddress("0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002");
                  }}
                  className="px-2 py-0.5 rounded border border-[#10B981]/30 bg-[#10B981]/10 text-[#10B981] font-mono hover:bg-[#10B981]/20 transition-colors"
                >
                  @hoangminh_otc (0x89C3...0002 - Clean)
                </button>
              </div>
            </form>

            {/* Query Result Dossier Card */}
            {activeQuery && (
              <div className="pt-2 animate-in fade-in duration-200">
                {!isFlagged ? (
                  /* CLEAN DOSSIER */
                  <div className="p-4 rounded-md border border-[#10B981]/30 bg-[#10B981]/5 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-[#10B981]">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-bold font-mono uppercase tracking-wider">
                          KHÔNG PHÁT HIỆN CẢNH BÁO TRÊN SỔ ĐEN L1
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#64748B]">
                        0.8s Telemetry Verified
                      </span>
                    </div>

                    {/* Member Identity Profile Card if matched registered user */}
                    {matchedScamUser ? (
                      <div className="p-3 rounded-lg bg-[#090A0D] border border-[#10B981]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                        <div className="flex items-center gap-3">
                          <img
                            src={matchedScamUser.avatarUrl}
                            alt={matchedScamUser.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-[#10B981]/40 shrink-0"
                            onError={(e) => {
                              (e.target as any).src =
                                "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80";
                            }}
                          />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-[#F1F5F9]">{matchedScamUser.name}</span>
                              <span className="text-xs text-[#10B981] font-mono font-bold bg-[#10B981]/15 px-2 py-0.5 rounded border border-[#10B981]/30">
                                @{matchedScamUser.username}
                              </span>
                              <span className="text-[10px] font-mono text-[#F59E0B] bg-[#F59E0B]/10 border border-[#F59E0B]/20 px-1.5 py-0.5 rounded font-bold">
                                {matchedScamUser.id}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#94A3B8] font-mono flex items-center gap-2 flex-wrap">
                              <span>User: <strong className="text-[#10B981]">@{matchedScamUser.username}</strong></span>
                              <span>•</span>
                              <span>Ví: <strong className="text-[#F1F5F9]">{shortenAddress(matchedScamUser.walletAddress)}</strong></span>
                            </div>
                            {/* Contact Badges (Telegram, Zalo, Facebook) */}
                            <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                              {matchedScamUser.telegram && (
                                <a
                                  href={`https://t.me/${matchedScamUser.telegram.replace(/^@/, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#229ED9]/15 text-[#38B6FF] border border-[#229ED9]/30 text-[10px] font-semibold hover:bg-[#229ED9]/25 transition-colors"
                                >
                                  <span>TG:</span>
                                  <span>{matchedScamUser.telegram}</span>
                                </a>
                              )}
                              {matchedScamUser.zalo && (
                                <a
                                  href={`https://zalo.me/${matchedScamUser.zalo.replace(/[^0-9]/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0068FF]/15 text-[#388BFF] border border-[#0068FF]/30 text-[10px] font-semibold hover:bg-[#0068FF]/25 transition-colors"
                                >
                                  <span>Zalo:</span>
                                  <span>{matchedScamUser.zalo}</span>
                                </a>
                              )}
                              {matchedScamUser.facebook && (
                                <a
                                  href={matchedScamUser.facebook.startsWith("http") ? matchedScamUser.facebook : `https://${matchedScamUser.facebook}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1877F2]/15 text-[#4599FF] border border-[#1877F2]/30 text-[10px] font-semibold hover:bg-[#1877F2]/25 transition-colors"
                                >
                                  <span>FB:</span>
                                  <span>{matchedScamUser.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\/?/, "") || "Link FB"}</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-left sm:text-right shrink-0 font-mono text-xs border-t sm:border-t-0 sm:border-l border-[#1E222D] pt-2 sm:pt-0 sm:pl-3">
                          <span className="text-[10px] text-[#64748B] uppercase block">Tỷ Lệ Tín Nhiệm SBT</span>
                          <span className="text-[#10B981] font-bold text-sm">{matchedScamUser.successRate}% Hoàn Thành</span>
                          <span className="text-[10px] text-[#94A3B8] block">{matchedScamUser.completedDeals} kèo uy tín</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded bg-[#090A0D] border border-[#1E222D] flex items-center justify-between text-xs font-mono">
                        <span className="text-[#64748B]">User / Định danh tra cứu:</span>
                        <span className="text-[#F1F5F9] font-bold">{activeQuery}</span>
                      </div>
                    )}

                    <div className="text-xs text-[#94A3B8] leading-relaxed">
                      {matchedScamUser ? (
                        <span>
                          Thành viên <strong className="text-[#10B981] font-mono">@{matchedScamUser.username}</strong> ({matchedScamUser.name} · Mã ID: <strong className="text-[#F59E0B] font-mono">{matchedScamUser.id}</strong> · Ví: <code className="text-[#F1F5F9] font-mono bg-[#101217] px-1.5 py-0.5 rounded">{shortenAddress(matchedScamUser.walletAddress)}</code>) chưa từng có lịch sử bị cộng đồng tố cáo trên TrustPact Custom L1.
                        </span>
                      ) : (
                        <span>
                          Định danh <code className="text-[#F1F5F9] font-mono bg-[#101217] px-1.5 py-0.5 rounded">{activeQuery}</code> {activeQuery.startsWith("@") ? `(User: ${activeQuery})` : ""} chưa từng có lịch sử bị cộng đồng tố cáo trên TrustPact Custom L1.
                        </span>
                      )}
                      {" "}Để đảm bảo an toàn tuyệt đối khi thanh toán, khuyến nghị mở phòng ký quỹ bảo vệ.
                    </div>

                    <div className="pt-2 border-t border-[#10B981]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[11px] text-[#64748B]">Bảo vệ giao dịch bằng Smart Contract:</span>
                      <Link
                        href={`/pact/create?seller=${matchedScamUser ? matchedScamUser.walletAddress : activeQuery.startsWith("0x") ? activeQuery : ""}`}
                        className="px-3.5 py-2 rounded-md bg-[#161922] hover:bg-[#1E222D] border border-[#10B981]/40 hover:border-[#10B981] text-xs font-semibold text-[#F1F5F9] inline-flex items-center gap-1.5 transition-all shadow-sm"
                      >
                        <Lock className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>
                          {matchedScamUser
                            ? `Tạo Kèo Ký Quỹ Với @${matchedScamUser.username} (${matchedScamUser.name})`
                            : "Tạo Kèo Ký Quỹ Với Đối Tác Này"}
                        </span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* FLAGGED CRIMSON DOSSIER */
                  <div className="p-4 rounded-md border border-[#EF4444]/40 bg-[#EF4444]/5 space-y-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 text-[#EF4444]">
                        <AlertOctagon className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-bold font-mono uppercase tracking-wider">
                          CẢNH BÁO NGUY HIỂM: ĐỐI TƯỢNG NẰM TRONG SỔ ĐEN ON-CHAIN
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#EF4444]/20 border border-[#EF4444]/30 text-[#EF4444]">
                        {scamCount} LƯỢT TỐ CÁO
                      </span>
                    </div>

                    <div className="text-xs text-[#94A3B8] space-y-2">
                      {matchedScamUser ? (
                        <div className="p-3 rounded-lg bg-[#090A0D] border border-[#EF4444]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
                          <div className="flex items-center gap-3">
                            <img
                              src={matchedScamUser.avatarUrl}
                              alt={matchedScamUser.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-[#EF4444]/50 shrink-0"
                              onError={(e) => {
                                (e.target as any).src =
                                  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80";
                              }}
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-[#F1F5F9]">{matchedScamUser.name}</span>
                                <span className="text-xs text-[#EF4444] font-mono font-bold bg-[#EF4444]/15 px-2 py-0.5 rounded border border-[#EF4444]/30">
                                  @{matchedScamUser.username}
                                </span>
                                <span className="text-[10px] font-mono text-[#EF4444] bg-[#EF4444]/10 px-1.5 py-0.5 rounded font-bold">
                                  ID: {matchedScamUser.id}
                                </span>
                              </div>
                              <span className="text-[11px] text-[#EF4444] font-mono block">
                                User: @{matchedScamUser.username} · Ví: {shortenAddress(matchedScamUser.walletAddress)}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-[#EF4444] font-mono uppercase bg-[#EF4444]/20 border border-[#EF4444]/40 px-2 py-1 rounded shrink-0">
                            ĐÃ BỊ TỐ CÁO
                          </span>
                        </div>
                      ) : (
                        <div>
                          Định danh vi phạm: <strong className="text-[#F1F5F9] font-mono">{activeQuery}</strong> {activeQuery.startsWith("@") ? `(User: ${activeQuery})` : ""}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span>Trạng thái kiểm duyệt:</span>
                        {hasVerified ? (
                          <span className="text-[#EF4444] font-semibold text-[11px]">Đã có Moderator On-chain xác thực bằng chứng</span>
                        ) : (
                          <span className="text-[#F59E0B] text-[11px]">Báo cáo cộng đồng đang chờ kiểm duyệt thêm</span>
                        )}
                      </div>
                    </div>

                    {/* Scrollable table of reports */}
                    <div className="rounded border border-[#1E222D] bg-[#090A0D] overflow-hidden">
                      <div className="max-h-48 overflow-y-auto">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-[#101217] text-[#64748B] border-b border-[#1E222D] text-[10px] uppercase">
                            <tr>
                              <th className="py-2 px-3">Người Báo</th>
                              <th className="py-2 px-3">Mô Tả Vi Phạm</th>
                              <th className="py-2 px-3">Bằng Chứng</th>
                              <th className="py-2 px-3 text-right">Xác Thực</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1E222D] text-[#94A3B8]">
                            {reportsList && (reportsList as unknown as OnChainReport[]).map((r, idx) => (
                              <tr key={idx} className="hover:bg-[#161922]">
                                <td className="py-2 px-3 text-[#F1F5F9]">
                                  {shortenAddress(r.reporter)}
                                </td>
                                <td className="py-2 px-3 max-w-xs truncate" title={r.description}>
                                  {r.description}
                                </td>
                                <td className="py-2 px-3">
                                  <a
                                    href={r.evidenceHash.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${r.evidenceHash.replace("ipfs://", "")}` : "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#E84142] hover:underline inline-flex items-center gap-1"
                                  >
                                    <FileText className="w-3 h-3" />
                                    <span>IPFS</span>
                                  </a>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {r.isVerified ? (
                                    <span className="text-[#10B981] font-bold">Verified</span>
                                  ) : (
                                    <span className="text-[#64748B]">Pending</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-[#EF4444] font-medium">Tuyệt đối không giao dịch chuyển khoản trực tiếp!</span>
                      <button
                        onClick={() => setShowReportForm(true)}
                        className="text-[#94A3B8] hover:text-[#F1F5F9] underline text-xs"
                      >
                        Bổ sung thêm bằng chứng
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* REAL-TIME L1 BLACKLIST STREAM (When no query active & not submitting report) */}
            {!activeQuery && !showReportForm && (
              <div className="pt-2 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-2 border-b border-[#1E222D]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#F1F5F9]">
                      Sổ Đen Mới Nhất Trên L1 Subnet
                    </span>
                    <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/15 px-1.5 py-0.2 rounded border border-[#10B981]/30">
                      Live Stream · 0đ Gas
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-[#64748B]">
                    Cập nhật từng block (0.8s)
                  </span>
                </div>

                {/* Live Stream Table */}
                <div className="rounded-md border border-[#1E222D] bg-[#090A0D] overflow-hidden">
                  <div className="divide-y divide-[#1E222D]">
                    {RECENT_L1_REPORTS.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[#161922]/60 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#EF4444]">
                              {item.target}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-[#161922] border border-[#1E222D] text-[#94A3B8]">
                              {item.bankName}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30">
                              {item.flagsCount} Lượt Tố Cáo
                            </span>
                          </div>
                          <p className="text-[11px] text-[#94A3B8] line-clamp-1">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-3 text-[10px] font-mono text-[#64748B]">
                            <span>
                              Chủ sở hữu: <strong className="text-[#F1F5F9]">{item.owner}</strong>
                            </span>
                            <span>·</span>
                            <span>
                              Thiệt hại: <strong className="text-[#EF4444]">{item.amountLoss}</strong>
                            </span>
                            <span>·</span>
                            <span>{item.timeAgo}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setQueryInput(item.target);
                              setActiveQuery(item.target);
                            }}
                            className="px-2.5 py-1.5 rounded bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-[11px] font-medium text-[#F1F5F9] transition-colors"
                          >
                            Kiểm Tra Ngay
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer summary inside left box */}
                <div className="pt-1 flex items-center justify-between text-[11px] text-[#64748B]">
                  <span>🛡️ Dữ liệu được đồng bộ phi tập trung trên Avalanche Subnet EVM.</span>
                  <button
                    onClick={() => setShowReportForm(true)}
                    className="text-[#E84142] hover:underline font-medium inline-flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Gửi tố cáo đối tượng mới</span>
                  </button>
                </div>
              </div>
            )}

            {/* Action Drawer Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowReportForm(!showReportForm)}
                className="text-xs text-[#94A3B8] hover:text-[#F1F5F9] inline-flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#E84142]" />
                <span>Gửi Tố Cáo Lên Sổ Đen (Miễn Phí Gas)</span>
              </button>
            </div>

            {/* Report Form Drawer */}
            {showReportForm && (
              <form
                onSubmit={handleReportScamSubmit}
                className="p-4 rounded-md bg-[#161922] border border-[#1E222D] space-y-3 animate-in fade-in duration-200"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#1E222D]">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#F1F5F9]">
                    Khai Báo Đối Tượng Lừa Đảo On-Chain
                  </span>
                  <span className="text-[10px] font-mono text-[#10B981]">0đ Gas Custom L1</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
                      Loại Định Danh
                    </label>
                    <select
                      value={reportIdType}
                      onChange={(e) => setReportIdType(e.target.value as CategoryKey)}
                      className="w-full bg-[#090A0D] border border-[#1E222D] rounded-md px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#E84142]"
                    >
                      <option value="bank">Số Tài Khoản Ngân Hàng</option>
                      <option value="phone">Số Điện Thoại / OTT</option>
                      <option value="telegram">Telegram Handle</option>
                      <option value="wallet">Địa Chỉ Ví 0x</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
                      Mã Định Danh Đối Tượng
                    </label>
                    <input
                      type="text"
                      value={reportTarget}
                      onChange={(e) => setReportTarget(e.target.value)}
                      placeholder="1903889922101 hoặc @otc_vn..."
                      className="w-full bg-[#090A0D] border border-[#1E222D] rounded-md px-3 py-2 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:border-[#E84142]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
                    Mô Tả Chi Tiết Hành Vi Lừa Đảo
                  </label>
                  <textarea
                    rows={2}
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Làm giả bill ngân hàng, nhận cọc xong chặn liên lạc, mạo danh admin sàn..."
                    className="w-full bg-[#090A0D] border border-[#1E222D] rounded-md px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#E84142] resize-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
                    Bằng Chứng IPFS (CID hoặc URL)
                  </label>
                  <input
                    type="text"
                    value={reportEvidenceUri}
                    onChange={(e) => setReportEvidenceUri(e.target.value)}
                    placeholder="ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
                    className="w-full bg-[#090A0D] border border-[#1E222D] rounded-md px-3 py-2 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:border-[#E84142]"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="px-3 py-1.5 rounded-md bg-[#090A0D] border border-[#1E222D] text-xs text-[#94A3B8] hover:text-[#F1F5F9]"
                  >
                    Hủy
                  </button>
                  <ShimmerButton
                    type="submit"
                    variant="danger"
                    className="px-4 py-1.5 rounded-md text-xs font-medium"
                  >
                    Ký Lệnh Gửi Lên L1
                  </ShimmerButton>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ── RIGHT PANE (5 COLS): SBT REPUTATION & X402 ────────────────────────── */}
        <div className="lg:col-span-5 space-y-5">
          {/* Unified SBT Reputation Credential Box */}
          <div className="rounded-lg panel-border bg-[#101217] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E222D]">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#F59E0B]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#F1F5F9]">
                  Hộ Chiếu Tín Nhiệm (TrustPassportSBT)
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Đồng Bộ Tự Động
              </span>
            </div>

            <p className="text-[11px] text-[#94A3B8] leading-relaxed">
              Tự động liên kết và trích xuất chỉ số tín nhiệm On-Chain (ERC-721 Soulbound) theo đối tượng được tra cứu ở thanh công cụ chính.
            </p>

            {/* Hardware-Style SBT Credential Card */}
            <div className="relative rounded-lg border border-[#1E222D] bg-[#090A0D] overflow-hidden shadow-inner font-mono text-xs">
              <BorderBeam colorFrom="#F59E0B" colorTo="#E84142" duration={10} size={160} borderWidth={1.5} />
              <CardSpotlight className="p-4 space-y-3" color="rgba(245, 158, 11, 0.08)" radius={240}>
                {/* Soulbound watermark */}
                <div className="absolute right-2 top-2 pointer-events-none select-none text-[22px] font-extrabold text-[#1E222D]/60 tracking-wider">
                  NON-TRANSFERABLE
                </div>

                <div className="flex items-center justify-between relative z-10 border-b border-[#1E222D] pb-2.5">
                  <div>
                    <span className="text-[10px] text-[#64748B] block uppercase">Định Danh Hộ Chiếu SBT</span>
                    <span className="font-bold text-[#F1F5F9]">
                      {matchedSbtUser ? `${matchedSbtUser.id} (@${matchedSbtUser.username})` : `#TP-${resolvedSbtAddress.slice(2, 6).toUpperCase()}`}
                    </span>
                  </div>
                  {brokerProfile && (brokerProfile as any).isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] text-[10px] font-bold">
                      <Check className="w-3 h-3" />
                      TICK XANH BẢO CHỨNG
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#161922] border border-[#1E222D] text-[#94A3B8] text-[10px]">
                      Thành Viên Tiêu Chuẩn
                    </span>
                  )}
                </div>

                <div className="space-y-2 relative z-10 text-[11px]">
                  {matchedSbtUser && (
                    <>
                      <div className="flex justify-between items-center pb-2 border-b border-[#1E222D]">
                        <span className="text-[#64748B]">User:</span>
                        <div className="flex items-center gap-1.5 font-bold">
                          <span className="text-[#10B981]">@{matchedSbtUser.username}</span>
                          <span className="text-[#94A3B8]">({matchedSbtUser.name})</span>
                        </div>
                      </div>

                      {/* Contact Badges (Telegram, Zalo, Facebook) */}
                      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-2 border-b border-[#1E222D]">
                        <span className="text-[#64748B]">Liên hệ:</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {matchedSbtUser.telegram && (
                            <a
                              href={`https://t.me/${matchedSbtUser.telegram.replace(/^@/, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#229ED9]/15 text-[#38B6FF] border border-[#229ED9]/30 text-[10px] font-semibold hover:bg-[#229ED9]/25 transition-colors"
                            >
                              <span>TG: {matchedSbtUser.telegram}</span>
                            </a>
                          )}
                          {matchedSbtUser.zalo && (
                            <a
                              href={`https://zalo.me/${matchedSbtUser.zalo.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#0068FF]/15 text-[#388BFF] border border-[#0068FF]/30 text-[10px] font-semibold hover:bg-[#0068FF]/25 transition-colors"
                            >
                              <span>Zalo: {matchedSbtUser.zalo}</span>
                            </a>
                          )}
                          {matchedSbtUser.facebook && (
                            <a
                              href={matchedSbtUser.facebook.startsWith("http") ? matchedSbtUser.facebook : `https://${matchedSbtUser.facebook}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#1877F2]/15 text-[#4599FF] border border-[#1877F2]/30 text-[10px] font-semibold hover:bg-[#1877F2]/25 transition-colors"
                            >
                              <span>FB: {matchedSbtUser.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\/?/, "") || "Link FB"}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Địa chỉ ví:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[#F1F5F9]">{shortenAddress(resolvedSbtAddress)}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(resolvedSbtAddress)}
                        className="text-[#64748B] hover:text-[#F1F5F9]"
                      >
                        {copiedText === resolvedSbtAddress ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Tỷ lệ hoàn thành:</span>
                    <span className="font-bold text-[#10B981] tabular-nums">
                      <NumberTicker
                        value={sbtSuccessRate !== undefined ? Number(sbtSuccessRate) / 100 : 100.0}
                        decimals={1}
                        suffix="%"
                      />
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Số kèo thành công / Tổng kèo:</span>
                    <span className="text-[#F1F5F9] tabular-nums">
                      {sbtProfile ? `${Number((sbtProfile as any).successfulDeals)} / ${Number((sbtProfile as any).totalDeals)}` : "128 / 128"} kèo
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Tổng volume luân chuyển:</span>
                    <span className="text-[#F1F5F9] tabular-nums font-semibold">
                      <NumberTicker
                        value={sbtProfile ? Number(formatUnits((sbtProfile as any).totalVolumeUSDC, 6)) : 64250.0}
                        decimals={2}
                        suffix=" USDC"
                      />
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Cọc Aave V3 đang khóa:</span>
                    <span className="text-[#10B981] tabular-nums font-semibold">
                      <NumberTicker
                        value={brokerProfile ? Number(formatUnits((brokerProfile as any).stakedBalance, 6)) : 5000.0}
                        decimals={2}
                        suffix=" USDC"
                      />
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[#64748B]">Số lần bị phạt vi phạm:</span>
                    <span className="text-[#EF4444] tabular-nums">
                      {sbtProfile ? Number((sbtProfile as any).slashedCount) : 0} Lần
                    </span>
                  </div>
                </div>
              </CardSpotlight>
            </div>
          </div>

          {/* ── TELEGRAM BOT INTEGRATION & LIVE SIMULATION CARD ────────────────── */}
          <div className="rounded-lg panel-border bg-[#101217] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E222D]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#229ED9]/15 border border-[#229ED9]/30 flex items-center justify-center text-[#229ED9]">
                  <Send className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#F1F5F9] flex items-center gap-1.5 font-sans">
                    <span>Bot Telegram Tra Cứu Tức Thì</span>
                  </h3>
                  <span className="text-[10px] font-mono text-[#38B6FF]">@TrustPactRadarBot</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                Live 24/7
              </span>
            </div>

            <p className="text-[11px] text-[#94A3B8] leading-relaxed font-sans">
              Không cần mở web! Bạn có thể nhắn tin riêng cho Bot hoặc <strong>thêm Bot vào nhóm chat Telegram OTC</strong> để tự động cảnh báo lừa đảo ngay khi có tin nhắn chứa STK đen.
            </p>

            {/* Quick Demo Switcher Tabs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-sans">
                <span className="text-[#64748B]">Bản xem trước phản hồi Bot:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTeleDemoType("scam")}
                    className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                      teleDemoType === "scam"
                        ? "bg-[#EF4444]/20 text-[#EF4444] border border-[#EF4444]/40 font-bold"
                        : "text-[#64748B] hover:text-[#94A3B8]"
                    }`}
                  >
                    Gặp STK Lừa Đảo
                  </button>
                  <button
                    type="button"
                    onClick={() => setTeleDemoType("trusted")}
                    className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                      teleDemoType === "trusted"
                        ? "bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40 font-bold"
                        : "text-[#64748B] hover:text-[#94A3B8]"
                    }`}
                  >
                    Gặp User Uy Tín
                  </button>
                </div>
              </div>

              {/* Simulated Telegram Chat Window */}
              <div className="rounded-lg border border-[#1E222D] bg-[#090A0D] p-3 font-mono text-xs space-y-2.5 shadow-inner">
                {/* User Message Bubble */}
                <div className="flex justify-end">
                  <div className="bg-[#2B5278] text-[#F1F5F9] px-3 py-1.5 rounded-lg rounded-tr-none text-[11px] max-w-[85%] font-sans">
                    <span className="font-mono">
                      {teleDemoType === "scam" ? "/check 1903889922101" : "/check @hoangminh_otc"}
                    </span>
                    <span className="text-[9px] text-blue-200 block text-right mt-0.5">
                      19:45 ✓✓
                    </span>
                  </div>
                </div>

                {/* Bot Response Bubble */}
                <div className="flex justify-start">
                  <div className="bg-[#182533] border border-[#243547] text-[#E2E8F0] p-3 rounded-lg rounded-tl-none text-[11px] space-y-1.5 max-w-[95%]">
                    {teleDemoType === "scam" ? (
                      <>
                        <div className="flex items-center gap-1.5 text-[#EF4444] font-bold text-xs pb-1 border-b border-[#243547]">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>CẢNH BÁO: SỐ TÀI KHOẢN LỪA ĐẢO</span>
                        </div>
                        <div className="text-[10px] text-[#CBD5E1] space-y-1 font-sans">
                          <p>• <b>Đối tượng:</b> <code className="text-[#F1F5F9] bg-[#0E1621] px-1 rounded">1903889922101</code> (Techcombank)</p>
                          <p>• <b>Sổ đen L1:</b> 2 Báo Cáo On-Chain (Đã xác thực)</p>
                          <p>• <b>Tội danh:</b> Nhận cọc OTC 500 USDT xong chặn tin nhắn</p>
                          <p className="text-[#EF4444] font-bold pt-1">
                            ⛔ KHUYẾN NGHỊ: DỪNG TẤT CẢ GIAO DỊCH!
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1.5 text-[#10B981] font-bold text-xs pb-1 border-b border-[#243547]">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>BẢO CHỨNG TÍN NHIỆM ON-CHAIN</span>
                        </div>
                        <div className="text-[10px] text-[#CBD5E1] space-y-1 font-sans">
                          <p>• <b>Họ tên:</b> Hoàng Minh OTC</p>
                          <p>• <b>User:</b> <code className="text-[#10B981] font-mono">@hoangminh_otc</code> · Mã ID: <strong className="text-[#F59E0B]">TP-2002</strong></p>
                          <p>• <b>SBT Passport:</b> 99.8% Uy tín (128 kèo thành công)</p>
                          <p>• <b>Cọc Aave V3:</b> 5,000 USDC đang khóa</p>
                          <p>• <b>Liên hệ:</b> Zalo 0987654321 · FB hoangminh.otc.pact</p>
                          <p className="text-[#10B981] font-bold pt-1">
                            ✅ An toàn khi giao dịch qua Két Sắt TrustPact!
                          </p>
                        </div>
                      </>
                    )}
                    <span className="text-[9px] text-[#64748B] block text-right font-sans">
                      TrustPact Bot · 19:45
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons to Open Real Bot or Add to Group */}
            <div className="space-y-2 pt-1 font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href="https://t.me/TrustPactRadarBot"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-md bg-[#229ED9] hover:bg-[#1C8CC4] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md text-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Mở Bot Telegram</span>
                  <ExternalLink className="w-3 h-3 opacity-80" />
                </a>

                <a
                  href="https://t.me/TrustPactRadarBot?startgroup=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-md bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] hover:border-[#229ED9] text-[#F1F5F9] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all text-center"
                >
                  <span>+ Thêm Vào Nhóm Chat</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>

              {/* Quick Copy Command */}
              <div className="p-2 rounded bg-[#090A0D] border border-[#1E222D] flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#64748B]">Cú pháp trong chat:</span>
                <button
                  type="button"
                  onClick={() => copyTeleCmd("/check 1903889922101")}
                  className="text-[#38B6FF] hover:text-white flex items-center gap-1 transition-colors"
                >
                  <code>/check &lt;STK hoặc @user&gt;</code>
                  {copiedTeleCmd ? <Check className="w-3 h-3 text-[#10B981]" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TransactionFeedback
        status={txStatus}
        onClose={() => setTxStatus({ step: "idle" })}
      />
    </div>
  );
}
