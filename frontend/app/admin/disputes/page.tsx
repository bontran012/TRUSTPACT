"use client";

import React, { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  ShieldAlert,
  Scale,
  Search,
  ExternalLink,
  AlertTriangle,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
  UserX,
  Clock,
  ArrowRight,
  Gavel,
  BadgeAlert,
  ShieldCheck,
  Copy,
} from "lucide-react";
import {
  CONTRACT_ADDRESSES,
  UNIVERSAL_ESCROW_ABI,
  STAKED_BROKER_REGISTRY_ABI,
  formatUsdc,
  parseUsdc,
  shortenAddress,
} from "@/src/lib/contracts";
import { TransactionFeedback, TxStatus } from "@/src/components/TransactionFeedback";

export default function AdminDisputesPage() {
  const { address, isConnected } = useAccount();

  // Search Escrow ID
  const [searchIdInput, setSearchIdInput] = useState("1");
  const [activeEscrowId, setActiveEscrowId] = useState<bigint>(1n);
  const [compensationInput, setCompensationInput] = useState("50");
  const [evidenceConfirmed, setEvidenceConfirmed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Read Protocol Admin & Treasury
  const { data: adminAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "admin",
  });

  const { data: treasuryAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "treasury",
  });

  const { data: totalEscrowsCount } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "counter",
  });

  const isAdminOrTreasury =
    !!address &&
    ((adminAddress && address.toLowerCase() === (adminAddress as string).toLowerCase()) ||
      (treasuryAddress && address.toLowerCase() === (treasuryAddress as string).toLowerCase()));

  // Read Selected Escrow Item
  const { data: escrowData, refetch: refetchEscrow } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "getEscrow",
    args: [activeEscrowId],
  });

  const escrow = escrowData as
    | {
        id: bigint;
        buyer: `0x${string}`;
        seller: `0x${string}`;
        broker: `0x${string}`;
        amount: bigint;
        brokerFeeBps: bigint;
        duration: bigint;
        startTime: bigint;
        status: number;
      }
    | undefined;

  // Read Broker Staking Profile
  const { data: brokerProfileData } = useReadContract({
    address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
    abi: STAKED_BROKER_REGISTRY_ABI,
    functionName: "brokers",
    args: escrow && escrow.broker ? [escrow.broker] : undefined,
    query: {
      enabled: !!escrow && !!escrow.broker,
    },
  });

  const brokerProfile = brokerProfileData as
    | [bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean, bigint]
    | undefined;

  const brokerStakedBalance = brokerProfile ? brokerProfile[1] : 0n;
  const brokerSlashedCount = brokerProfile ? Number(brokerProfile[5]) : 0;
  const brokerIsBlacklisted = brokerProfile ? brokerProfile[7] : false;

  // Web3 Write Hook for Slashing
  const {
    writeContract: slashBrokerWrite,
    data: slashTxHash,
    isPending: isSlashPending,
    error: slashError,
    reset: resetSlash,
  } = useWriteContract();

  const { isLoading: isSlashConfirming, isSuccess: isSlashSuccess } = useWaitForTransactionReceipt({
    hash: slashTxHash,
  });

  const txStatus: TxStatus = isSlashPending
    ? { step: "awaiting_signature", actionTitle: "Chém Cọc Broker & Đền Bù Nạn Nhân" }
    : isSlashConfirming
    ? { step: "confirming", txHash: slashTxHash, actionTitle: "Đang Xác Nhận Lệnh Phân Xử" }
    : isSlashSuccess
    ? { step: "success", txHash: slashTxHash, actionTitle: "Đã Chém Cọc & Đền Bù Thành Công!" }
    : slashError
    ? { step: "error", errorMessage: slashError.message, actionTitle: "Lệnh Chém Cọc Thất Bại" }
    : { step: "idle" };

  const handleSlashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminOrTreasury) return;
    if (!escrow || escrow.status !== 0) return;
    if (!evidenceConfirmed) return;

    const compWei = parseUsdc(compensationInput || "0");
    slashBrokerWrite({
      address: CONTRACT_ADDRESSES.universalEscrow,
      abi: UNIVERSAL_ESCROW_ABI,
      functionName: "adminSlashCorruptBroker",
      args: [activeEscrowId, compWei],
    });
  };

  const statusMap = ["ĐANG HOẠT ĐỘNG (ACTIVE)", "ĐÃ HOÀN TẤT (COMPLETED)", "ĐÃ HỦY / HOÀN TIỀN (CANCELLED)"];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── TOP IDENTITY & ACCESS BANNER ─────────────────────────────────── */}
      <div className="border border-[#1E222D] bg-[#101217] rounded-lg p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-md bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444] shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-[#F1F5F9]">
                  Hội Đồng Phân Xử & Chém Cọc On-Chain
                </h1>
                <span className="text-[10px] font-mono uppercase bg-[#161922] border border-[#1E222D] px-2 py-0.5 rounded text-[#94A3B8]">
                  Arbitration Tribunal
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] mt-1">
                Thực thi quyền tài phán tối cao theo cơ chế Két Sắt 3 Bên. Đền bù 100% cho nạn nhân và trừ trực tiếp vào Quỹ Cọc Sinh Lãi Aave V3 của GDTG gian lận.
              </p>
            </div>
          </div>

          {/* Connected Address Permission Pill */}
          <div className="flex items-center gap-3 shrink-0">
            {isAdminOrTreasury ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-xs font-mono font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Quyền Phân Xử Hợp Lệ (Admin / Treasury)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#F59E0B]/10 border border-[#F59E0B]/20 text-[#F59E0B] text-xs font-mono">
                <Lock className="w-4 h-4" />
                <span>Chế Độ Kiểm Toán Công Khai (Audit Mode)</span>
              </div>
            )}
          </div>
        </div>

        {/* Public Audit Mode Warning Alert if not Admin */}
        {!isAdminOrTreasury && (
          <div className="mt-4 pt-3 border-t border-[#1E222D] flex items-center gap-2.5 text-xs text-[#94A3B8]">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <span>
              <strong className="text-[#F1F5F9]">Chế độ Minh Bạch Công Khai:</strong> Bất kỳ ai cũng có thể tra cứu hồ sơ vụ việc và bằng chứng vi phạm. Chỉ các ví quản trị được cấp quyền (<code className="text-[#F1F5F9] font-mono">{shortenAddress(adminAddress as string || "0x0")}</code> hoặc Kho bạc) mới có thể ký lệnh Chém Cọc.
            </span>
          </div>
        )}
      </div>

      {/* ── ESCROW SELECTOR TOOLBAR ─────────────────────────────────────── */}
      <div className="border border-[#1E222D] bg-[#101217] rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-medium text-[#64748B] uppercase tracking-wider shrink-0">
            Tra Cứu Mã Kèo:
          </span>
          <div className="relative flex-1 sm:w-56">
            <input
              type="number"
              min="1"
              value={searchIdInput}
              onChange={(e) => setSearchIdInput(e.target.value)}
              placeholder="VD: 1, 2, 3..."
              className="w-full bg-[#161922] border border-[#1E222D] rounded-md px-3 py-1.5 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:border-[#E84142]"
            />
          </div>
          <button
            onClick={() => {
              if (searchIdInput) {
                setActiveEscrowId(BigInt(searchIdInput));
              }
            }}
            className="px-3 py-1.5 bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] rounded-md text-xs font-medium text-[#F1F5F9] flex items-center gap-1.5 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Tải Hồ Sơ</span>
          </button>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#64748B] w-full sm:w-auto justify-end">
          <span>Kèo Gần Đây:</span>
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => {
                setSearchIdInput(num.toString());
                setActiveEscrowId(BigInt(num));
              }}
              className={`px-2 py-0.5 rounded border text-[11px] ${
                activeEscrowId === BigInt(num)
                  ? "bg-[#E84142]/20 border-[#E84142] text-[#F1F5F9]"
                  : "bg-[#161922] border-[#1E222D] text-[#94A3B8] hover:text-[#F1F5F9]"
              }`}
            >
              #{num}
            </button>
          ))}
          {totalEscrowsCount ? (
            <span className="text-[11px] text-[#94A3B8] ml-2">
              (Tổng: {totalEscrowsCount.toString()} kèo)
            </span>
          ) : null}
        </div>
      </div>

      {/* ── MAIN 2-COLUMN DOSSIER & SLASHING CONSOLE ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANE: DISPUTE & BROKER DOSSIER (6 COLS) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Escrow Details Card */}
          <div className="border border-[#1E222D] bg-[#101217] rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E222D]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#94A3B8]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Hồ Sơ Két Sắt #{activeEscrowId.toString()}
                </h2>
              </div>
              {escrow ? (
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    escrow.status === 0
                      ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
                      : escrow.status === 1
                      ? "bg-[#64748B]/15 text-[#94A3B8] border-[#64748B]/30"
                      : "bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30"
                  }`}
                >
                  {statusMap[escrow.status] || "KHÔNG RÕ"}
                </span>
              ) : (
                <span className="text-[10px] font-mono text-[#64748B]">Chưa khởi tạo</span>
              )}
            </div>

            {escrow && escrow.buyer !== "0x0000000000000000000000000000000000000000" ? (
              <div className="mt-4 space-y-3.5">
                <div className="flex items-center justify-between p-3 rounded-md bg-[#161922] border border-[#1E222D]">
                  <span className="text-xs text-[#94A3B8]">Giá Trị Két Sắt Khóa:</span>
                  <span className="text-base font-bold font-mono text-[#F1F5F9] tabular-nums">
                    {formatUsdc(escrow.amount)} USDC
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Buyer */}
                  <div className="flex items-center justify-between py-1.5 border-b border-[#1E222D]/50">
                    <span className="text-[#94A3B8]">Bên Mua (Nạn Nhân Tiềm Ẩn):</span>
                    <div className="flex items-center gap-1.5 font-mono text-[#F1F5F9]">
                      <span>{shortenAddress(escrow.buyer)}</span>
                      <button
                        onClick={() => copyToClipboard(escrow.buyer, "buyer")}
                        className="text-[#64748B] hover:text-[#F1F5F9]"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Seller */}
                  <div className="flex items-center justify-between py-1.5 border-b border-[#1E222D]/50">
                    <span className="text-[#94A3B8]">Bên Bán (Đối tác):</span>
                    <div className="flex items-center gap-1.5 font-mono text-[#F1F5F9]">
                      <span>{shortenAddress(escrow.seller)}</span>
                      <button
                        onClick={() => copyToClipboard(escrow.seller, "seller")}
                        className="text-[#64748B] hover:text-[#F1F5F9]"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Broker */}
                  <div className="flex items-center justify-between py-1.5 border-b border-[#1E222D]/50">
                    <span className="text-[#94A3B8]">GDTG Trung Gian (Broker):</span>
                    <div className="flex items-center gap-1.5 font-mono text-[#EF4444] font-medium">
                      <span>{shortenAddress(escrow.broker)}</span>
                      <button
                        onClick={() => copyToClipboard(escrow.broker, "broker")}
                        className="text-[#64748B] hover:text-[#F1F5F9]"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center justify-between py-1.5 border-b border-[#1E222D]/50">
                    <span className="text-[#94A3B8]">Thời Hạn Kèo:</span>
                    <span className="font-mono text-[#F1F5F9]">
                      {(Number(escrow.duration) / 3600).toFixed(1)} Giờ
                    </span>
                  </div>

                  {/* Start Time */}
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[#94A3B8]">Thời Điểm Kích Hoạt:</span>
                    <span className="font-mono text-[#F1F5F9]">
                      {new Date(Number(escrow.startTime) * 1000).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#64748B]">
                Không tìm thấy dữ liệu hợp đồng cho ID #{activeEscrowId.toString()}. Vui lòng kiểm tra lại.
              </div>
            )}
          </div>

          {/* Broker Staking Health & Blacklist Status */}
          <div className="border border-[#1E222D] bg-[#101217] rounded-lg p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E222D]">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-[#EF4444]" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                  Hồ Sơ Cọc & Lịch Sử Vi Phạm Của GDTG
                </h2>
              </div>
              {brokerIsBlacklisted ? (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 font-bold">
                  ĐÃ BỊ BLACKLIST
                </span>
              ) : (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                  CHƯA BỊ CẤM
                </span>
              )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-md bg-[#161922] border border-[#1E222D]">
                <span className="text-[10px] font-mono uppercase text-[#64748B] block">
                  Cọc Đang Gửi Aave V3
                </span>
                <span className="text-sm font-bold font-mono text-[#F1F5F9] tabular-nums mt-1 block">
                  {formatUsdc(brokerStakedBalance)} USDC
                </span>
              </div>
              <div className="p-3 rounded-md bg-[#161922] border border-[#1E222D]">
                <span className="text-[10px] font-mono uppercase text-[#64748B] block">
                  Số Lần Bị Phạt Chém Cọc
                </span>
                <span
                  className={`text-sm font-bold font-mono tabular-nums mt-1 block ${
                    brokerSlashedCount > 0 ? "text-[#EF4444]" : "text-[#10B981]"
                  }`}
                >
                  {brokerSlashedCount} lần
                </span>
              </div>
            </div>

            {/* Red Alert if Suspicious */}
            <div className="mt-4 p-3 rounded-md bg-[#EF4444]/10 border border-[#EF4444]/20 text-xs space-y-1">
              <div className="flex items-center gap-2 font-semibold text-[#EF4444]">
                <BadgeAlert className="w-4 h-4 shrink-0" />
                <span>Cảnh Báo Dấu Hiệu Vi Phạm Nghiêm Trọng</span>
              </div>
              <p className="text-[#94A3B8] text-[11px] leading-relaxed">
                Nếu Broker không phản hồi, câu kết với bên gian lận hoặc cố tình từ chối giải ngân/hoàn tiền theo đúng thỏa thuận, Hội Đồng có thể áp dụng lệnh Chém Cọc để bồi hoàn cho bên bị hại.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: SLASHING EXECUTION CONSOLE (6 COLS) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="border border-[#1E222D] bg-[#101217] rounded-lg p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[#1E222D]">
              <Gavel className="w-4 h-4 text-[#EF4444]" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                Bảng Điều Khiển Xử Phạt (Slashing Execution Console)
              </h2>
            </div>

            {/* Invariant Explanation Box */}
            <div className="mt-4 p-3.5 rounded-md bg-[#161922] border border-[#1E222D] space-y-2 text-xs">
              <span className="text-[11px] font-semibold text-[#F1F5F9] block uppercase tracking-wider">
                Quy Trình Chém Cọc & Đền Bù On-Chain:
              </span>
              <ul className="space-y-1.5 text-[#94A3B8] text-[11px]">
                <li className="flex items-start gap-2">
                  <span className="text-[#10B981] font-bold">1.</span>
                  <span>
                    Hoàn trả <strong className="text-[#F1F5F9]">100% số tiền két sắt ({escrow ? formatUsdc(escrow.amount) : "0"} USDC)</strong> từ Smart Contract về ví Người Mua (Buyer).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#EF4444] font-bold">2.</span>
                  <span>
                    Rút phạt thêm <strong className="text-[#EF4444]">{compensationInput || "0"} USDC</strong> từ Quỹ Cọc Aave V3 của Broker để bồi thường thiệt hại cho nạn nhân.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#EF4444] font-bold">3.</span>
                  <span>
                    Vĩnh viễn gắn cờ <strong className="text-[#EF4444]">Blacklist</strong> và hủy tư cách Trung Gian của Broker trên toàn mạng lưới TrustPact.
                  </span>
                </li>
              </ul>
            </div>

            {/* Slashing Parameters Form */}
            <form onSubmit={handleSlashSubmit} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-[#94A3B8] block mb-1.5">
                  Mã Giao Dịch Bị Xử Phạt (Escrow ID)
                </label>
                <input
                  type="text"
                  disabled
                  value={`Kèo #${activeEscrowId.toString()}`}
                  className="w-full bg-[#161922] border border-[#1E222D] rounded-md px-3.5 py-2 text-xs font-mono text-[#94A3B8] cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[#94A3B8] block mb-1.5">
                  Mức Tiền Phạt Trừ Cọc Broker Bồi Thường (USDC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    disabled={!isAdminOrTreasury}
                    value={compensationInput}
                    onChange={(e) => setCompensationInput(e.target.value)}
                    placeholder="VD: 50.00"
                    className="w-full bg-[#161922] border border-[#1E222D] rounded-md px-3.5 py-2 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:border-[#EF4444] disabled:opacity-50"
                  />
                  <span className="absolute right-3.5 top-2 text-xs font-mono text-[#64748B]">USDC</span>
                </div>
                <span className="text-[10px] text-[#64748B] block mt-1">
                  Khoản tiền này sẽ được rút trực tiếp từ số dư cọc {formatUsdc(brokerStakedBalance)} USDC của Broker trên Aave.
                </span>
              </div>

              {/* Settlement Summary Table */}
              <div className="p-3 rounded-md bg-[#090A0D] border border-[#1E222D] space-y-2 text-xs font-mono">
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Hoàn Tiền Két Sắt:</span>
                  <span className="text-[#10B981] tabular-nums font-bold">
                    +{escrow ? formatUsdc(escrow.amount) : "0"} USDC
                  </span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>Đền Bù Trừ Cọc:</span>
                  <span className="text-[#10B981] tabular-nums font-bold">
                    +{compensationInput || "0"} USDC
                  </span>
                </div>
                <div className="border-t border-[#1E222D] pt-1.5 flex justify-between text-xs font-bold">
                  <span className="text-[#F1F5F9]">Tổng Nạn Nhân Nhận:</span>
                  <span className="text-[#10B981] tabular-nums">
                    {(
                      (escrow ? Number(formatUsdc(escrow.amount)) : 0) +
                      Number(compensationInput || 0)
                    ).toFixed(2)}{" "}
                    USDC
                  </span>
                </div>
                <div className="flex justify-between text-[#EF4444] text-[11px] pt-1 border-t border-[#1E222D]/50">
                  <span>Trạng Thái Broker:</span>
                  <span className="font-bold">KHÓA BLACKLIST TOÀN BỘ</span>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-2.5 p-3 rounded-md bg-[#161922] border border-[#1E222D] cursor-pointer hover:border-[#1E222D]/80">
                <input
                  type="checkbox"
                  checked={evidenceConfirmed}
                  disabled={!isAdminOrTreasury}
                  onChange={(e) => setEvidenceConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-[#1E222D] bg-[#090A0D] text-[#EF4444] focus:ring-0 disabled:opacity-50"
                />
                <span className="text-[11px] text-[#94A3B8] leading-tight select-none">
                  Tôi xác nhận đã kiểm toán toàn bộ chứng từ, nhật ký chat và mã băm bằng chứng On-chain. Tôi thực thi lệnh xử phạt theo thẩm quyền của Hội Đồng Phân Xử TrustPact.
                </span>
              </label>

              {/* Big Red Terminal Execution Button */}
              <button
                type="submit"
                disabled={
                  !isAdminOrTreasury ||
                  !evidenceConfirmed ||
                  !escrow ||
                  escrow.status !== 0 ||
                  isSlashPending ||
                  isSlashConfirming
                }
                className={`w-full py-3.5 px-4 rounded-md text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  isAdminOrTreasury && evidenceConfirmed && escrow && escrow.status === 0
                    ? "bg-[#EF4444] hover:bg-[#DC2626] text-white shadow-lg shadow-[#EF4444]/20 cursor-pointer"
                    : "bg-[#161922] text-[#64748B] border border-[#1E222D] cursor-not-allowed"
                }`}
              >
                <Gavel className="w-4 h-4" />
                <span>
                  {isSlashPending
                    ? "Đang Chờ Ký Ví..."
                    : isSlashConfirming
                    ? "Đang Xác Nhận Giao Dịch..."
                    : "BẤM CHÉM CỌC BROKER & ĐỀN BÙ NẠN NHÂN (SLASH & PENALIZE)"}
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── TRANSACTION FEEDBACK NOTIFICATIONS ───────────────────────────── */}
      <TransactionFeedback
        status={txStatus}
        onClose={() => {
          resetSlash();
          refetchEscrow();
        }}
      />
    </div>
  );
}
