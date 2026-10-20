"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Send,
  ExternalLink,
  Coins,
  Scale,
  RefreshCw,
  Clock,
  Check,
  AlertOctagon,
  Award,
  Headphones,
} from "lucide-react";
import {
  CONTRACT_ADDRESSES,
  UNIVERSAL_ESCROW_ABI,
  formatUsdc,
  parseUsdc,
  shortenAddress,
  parseContractError,
} from "@/src/lib/contracts";
import { TransactionFeedback, TxStatus } from "@/src/components/TransactionFeedback";

interface EscrowStruct {
  id: bigint;
  buyer: `0x${string}`;
  seller: `0x${string}`;
  broker: `0x${string}`;
  amount: bigint;
  brokerFeeBps: bigint;
  duration: bigint;
  startTime: bigint;
  status: number; // 0: Active, 1: Completed, 2: Cancelled
}

interface ChatMessage {
  id: string;
  sender: `0x${string}`;
  role: "buyer" | "seller" | "broker";
  text: string;
  timestamp: string;
  isProof?: boolean;
}

export default function EscrowPactRoomPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id ? String(params.id) : "101";
  const pactId = BigInt(rawId.replace(/[^0-9]/g, "") || "101");

  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [currentTime, setCurrentTime] = useState<number>(Math.floor(Date.now() / 1000));
  const [txStatus, setTxStatus] = useState<TxStatus>({ step: "idle" });

  // Update current time every second for countdown timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Web3 Contract Reads ──────────────────────────────────────────────
  const {
    data: escrowData,
    isLoading: isLoadingEscrow,
    refetch: refetchEscrow,
  } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "getEscrow",
    args: [pactId],
    query: { refetchInterval: 4000 },
  });

  const { data: isExpiredFromContract, refetch: refetchExpired } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "isExpired",
    args: [pactId],
  });

  const { data: buyerCancelApproved, refetch: refetchBuyerCancel } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "buyerCancelApproved",
    args: [pactId],
  });

  const { data: sellerCancelApproved, refetch: refetchSellerCancel } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "sellerCancelApproved",
    args: [pactId],
  });

  // Default fallback item if on-chain returns uninitialized struct
  const escrowItem: EscrowStruct = (escrowData && (escrowData as any).amount > 0n)
    ? (escrowData as unknown as EscrowStruct)
    : {
        id: pactId,
        buyer: "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
        seller: "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
        broker: "0x30F1492bC78E12a899Ad34De91eF11B12E7a889A",
        amount: 1000000000n, // 1000 USDC
        brokerFeeBps: 150n,
        duration: 86400n,
        startTime: BigInt(Math.floor(Date.now() / 1000) - 1800),
        status: 0,
      };

  // Status computation
  const statusNumber = Number(escrowItem.status);
  const statusLabel =
    statusNumber === 0 ? "ACTIVE — ĐANG KHÓA TIỀN" : statusNumber === 1 ? "COMPLETED — ĐÃ TẤT TOÁN" : "CANCELLED — ĐÃ HỦY / HOÀN TIỀN";

  const deadline = Number(escrowItem.startTime + escrowItem.duration);
  const remainingSeconds = Math.max(0, deadline - currentTime);
  const isTimeExpired = Boolean(isExpiredFromContract) || remainingSeconds === 0;

  // Format Timer
  const hoursLeft = Math.floor(remainingSeconds / 3600);
  const minsLeft = Math.floor((remainingSeconds % 3600) / 60);
  const secsLeft = remainingSeconds % 60;
  const timerDisplay = `${hoursLeft.toString().padStart(2, "0")}:${minsLeft.toString().padStart(2, "0")}:${secsLeft.toString().padStart(2, "0")}`;

  // Connected Role
  const connectedLower = address?.toLowerCase();
  const isBuyer = connectedLower === escrowItem.buyer.toLowerCase();
  const isSeller = connectedLower === escrowItem.seller.toLowerCase();
  const isBroker = connectedLower === escrowItem.broker.toLowerCase();
  const isObserver = !isBuyer && !isSeller && !isBroker;

  // Exact Fees
  const dealAmountNum = Number(escrowItem.amount) / 1e6;
  const brokerFeeNum = +((dealAmountNum * Number(escrowItem.brokerFeeBps)) / 10000).toFixed(2);
  const protocolFeeNum = +((dealAmountNum * 30) / 10000).toFixed(2);
  const netSellerReceives = +(dealAmountNum - brokerFeeNum - protocolFeeNum).toFixed(2);

  // Settlement Inputs (Broker Settle)
  const [refundToBuyerInput, setRefundToBuyerInput] = useState<string>("500");
  const [payoutToSellerInput, setPayoutToSellerInput] = useState<string>("500");

  // Communication & Evidence Stream
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-1",
      sender: escrowItem.buyer,
      role: "buyer",
      text: "Đã nạp 1,000 USDC vào Smart Contract UniversalEscrow thành công. Nhờ bên bán bàn giao quyền quản trị tài khoản.",
      timestamp: "10:15",
    },
    {
      id: "msg-2",
      sender: escrowItem.seller,
      role: "seller",
      text: "Đã gửi thông tin đăng nhập và mã 2FA backup qua kênh bảo mật cho trọng tài GDTG đối soát.",
      timestamp: "10:22",
      isProof: true,
    },
    {
      id: "msg-3",
      sender: escrowItem.broker,
      role: "broker",
      text: "Trọng tài Nguyễn Nam đã tiếp nhận đối soát. Đang kiểm tra tính chính xác của email gốc và bảo mật tài sản.",
      timestamp: "10:25",
    },
  ]);
  const [newMessageText, setNewMessageText] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !address) return;
    const role: "buyer" | "seller" | "broker" = isBuyer ? "buyer" : isSeller ? "seller" : "broker";
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: address as `0x${string}`,
      role,
      text: newMessageText.trim(),
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setNewMessageText("");
  };

  // Helper for contract calls
  const executePactWrite = async (actionTitle: string, functionName: any, args: any[]) => {
    try {
      setTxStatus({ step: "awaiting_signature", actionTitle });
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.universalEscrow,
        abi: UNIVERSAL_ESCROW_ABI,
        functionName,
        args: args as any,
      });

      setTxStatus({ step: "confirming", txHash: hash, actionTitle });
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      setTxStatus({ step: "success", txHash: hash, actionTitle });
      await refetchEscrow();
      await refetchExpired();
      await refetchBuyerCancel();
      await refetchSellerCancel();
      setTimeout(() => setTxStatus({ step: "idle" }), 2500);
    } catch (err: any) {
      setTxStatus({
        step: "error",
        errorMessage: parseContractError(err),
        actionTitle,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* ── ZONE A: TOP ESCROW STATE HEADER ───────────────────────────────────── */}
      <section className="rounded-lg panel-border bg-[#101217] p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-[#F1F5F9] bg-[#161922] px-3 py-1 rounded border border-[#1E222D]">
              KÈO KÝ QUỸ #{escrowItem.id.toString()}
            </span>

            {/* Status Badge */}
            <span
              className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                statusNumber === 0
                  ? "bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]"
                  : statusNumber === 1
                  ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
                  : "bg-[#64748B]/10 border-[#64748B]/30 text-[#64748B]"
              }`}
            >
              {statusLabel}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <a
              href={`https://testnet.snowtrace.io/address/${CONTRACT_ADDRESSES.universalEscrow}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#94A3B8] hover:text-[#F1F5F9] inline-flex items-center gap-1"
            >
              <span>Snowtrace Vault</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={() => {
                refetchEscrow();
                refetchExpired();
              }}
              className="p-1 rounded bg-[#161922] border border-[#1E222D] text-[#94A3B8] hover:text-[#F1F5F9]"
              title="Làm mới trạng thái Smart Contract"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Countdown Timer & Expiration Alert */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-md bg-[#090A0D] border border-[#1E222D] text-xs font-mono">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#F59E0B]" />
            <span className="text-[#94A3B8]">Thời gian bàn giao còn lại:</span>
            <span
              className={`font-bold tabular-nums text-sm ${
                isTimeExpired ? "text-[#EF4444]" : "text-[#F1F5F9]"
              }`}
            >
              {isTimeExpired ? "00:00:00 (Hết hạn)" : timerDisplay}
            </span>
          </div>

          {statusNumber === 0 && isTimeExpired && (
            <div className="text-[#EF4444] font-semibold text-[11px] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>ĐÃ QUÁ HẠN BÀN GIAO — MỞ KHÓA AUTO-REFUND CHO BÊN MUA</span>
            </div>
          )}
        </div>
      </section>

      {/* ── MAIN WORKSPACE 12 COLS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── ZONE B: LEFT & CENTER (8 COLS) ─────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-5">
          {/* 3-Party Identity Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Buyer Card */}
            <div
              className={`p-3.5 rounded-lg border bg-[#101217] space-y-1.5 font-mono text-xs ${
                isBuyer ? "border-[#E84142] ring-1 ring-[#E84142]/30" : "border-[#1E222D]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#64748B] uppercase font-bold font-sans">BÊN MUA (BUYER)</span>
                {isBuyer && (
                  <span className="text-[9px] font-bold text-[#E84142] bg-[#E84142]/10 px-1 rounded">BẠN ĐANG KẾT NỐI</span>
                )}
              </div>
              <span className="font-bold text-[#F1F5F9] block">{shortenAddress(escrowItem.buyer)}</span>
              <span className="text-[11px] text-[#94A3B8] block">Nạp: {formatUsdc(escrowItem.amount)} USDC</span>
            </div>

            {/* Broker Card */}
            <div
              className={`p-3.5 rounded-lg border bg-[#101217] space-y-1.5 font-mono text-xs ${
                isBroker ? "border-[#E84142] ring-1 ring-[#E84142]/30" : "border-[#1E222D]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#64748B] uppercase font-bold font-sans">TRỌNG TÀI (GDTG)</span>
                {isBroker && (
                  <span className="text-[9px] font-bold text-[#E84142] bg-[#E84142]/10 px-1 rounded">BẠN ĐANG KẾT NỐI</span>
                )}
              </div>
              <span className="font-bold text-[#F1F5F9] block">{shortenAddress(escrowItem.broker)}</span>
              <span className="text-[11px] text-[#10B981] block">
                Phí: {(Number(escrowItem.brokerFeeBps) / 100).toFixed(2)}% (+{brokerFeeNum} USDC)
              </span>
            </div>

            {/* Seller Card */}
            <div
              className={`p-3.5 rounded-lg border bg-[#101217] space-y-1.5 font-mono text-xs ${
                isSeller ? "border-[#E84142] ring-1 ring-[#E84142]/30" : "border-[#1E222D]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#64748B] uppercase font-bold font-sans">BÊN BÁN (SELLER)</span>
                {isSeller && (
                  <span className="text-[9px] font-bold text-[#E84142] bg-[#E84142]/10 px-1 rounded">BẠN ĐANG KẾT NỐI</span>
                )}
              </div>
              <span className="font-bold text-[#F1F5F9] block">{shortenAddress(escrowItem.seller)}</span>
              <span className="text-[11px] text-[#F1F5F9] font-bold block">Nhận Net: {netSellerReceives} USDC</span>
            </div>
          </div>

          {/* Verifiable Handover & Communication Log */}
          <div className="rounded-lg panel-border bg-[#101217] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E222D]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#F1F5F9]">
                Nhật Ký Bàn Giao &amp; Trao Đổi Bằng Chứng 3 Bên
              </span>
              <span className="text-[10px] font-mono text-[#64748B]">Bảo mật theo Pact #{escrowItem.id.toString()}</span>
            </div>

            {/* Chat message stream */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-md border text-xs space-y-1 ${
                    m.role === "broker"
                      ? "bg-[#F59E0B]/5 border-[#F59E0B]/30"
                      : m.role === "buyer"
                      ? "bg-[#161922] border-[#1E222D]"
                      : "bg-[#10B981]/5 border-[#10B981]/20"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-bold uppercase ${
                          m.role === "broker"
                            ? "text-[#F59E0B]"
                            : m.role === "buyer"
                            ? "text-[#E84142]"
                            : "text-[#10B981]"
                        }`}
                      >
                        {m.role === "broker" ? "TRỌNG TÀI" : m.role === "buyer" ? "BÊN MUA" : "BÊN BÁN"}
                      </span>
                      <span className="text-[#64748B]">({shortenAddress(m.sender)})</span>
                    </div>
                    <span className="text-[#64748B]">{m.timestamp}</span>
                  </div>
                  <p className="text-xs text-[#F1F5F9] leading-relaxed font-sans">{m.text}</p>
                </div>
              ))}
            </div>

            {/* Send message form */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-[#1E222D]">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder={
                  !isConnected
                    ? "Vui lòng kết nối ví để gửi tin nhắn & bằng chứng..."
                    : isObserver
                    ? "Bạn đang ở chế độ xem audit (không có quyền gửi tin)..."
                    : "Gửi biên bản bàn giao, mã tài sản hoặc link bằng chứng IPFS..."
                }
                disabled={!isConnected || isObserver}
                className="flex-1 bg-[#090A0D] border border-[#1E222D] focus:border-[#E84142] rounded-md px-3.5 py-2 text-xs text-[#F1F5F9] focus:outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!isConnected || isObserver || !newMessageText.trim()}
                className="px-4 py-2 rounded-md bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-xs font-medium text-[#F1F5F9] inline-flex items-center gap-1.5 disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi</span>
              </button>
            </form>
          </div>
        </div>

        {/* ── ZONE C: RIGHT (4 COLS) EXECUTION PANEL DYNAMIC BY ROLE ──────────── */}
        <div className="lg:col-span-4 space-y-5">
          <div className="rounded-lg panel-border bg-[#101217] p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E222D]">
              <span className="font-semibold uppercase tracking-wider text-[#F1F5F9] font-sans">
                Thực Thi Smart Contract
              </span>
              <span className="text-[10px] text-[#64748B]">UniversalEscrow</span>
            </div>

            {/* Role Header Badge */}
            <div className="p-2.5 rounded bg-[#090A0D] border border-[#1E222D] flex items-center justify-between font-sans">
              <span className="text-[11px] text-[#64748B]">Vai trò ví của bạn:</span>
              <span className="font-bold text-xs uppercase text-[#F1F5F9]">
                {isBuyer
                  ? "Bên Mua (Buyer)"
                  : isSeller
                  ? "Bên Bán (Seller)"
                  : isBroker
                  ? "Trọng Tài (Broker)"
                  : "Quan Sát Viên (Observer)"}
              </span>
            </div>

            {/* ── ACTIONS FOR BUYER ────────────────────────────────────────── */}
            {isBuyer && statusNumber === 0 && (
              <div className="space-y-3 font-sans">
                {/* 1. Buyer Confirm Delivery */}
                <button
                  type="button"
                  onClick={() =>
                    executePactWrite(
                      "Xác Nhận Đã Nhận Đủ Hàng & Giải Ngân",
                      "buyerConfirmDelivery",
                      [pactId]
                    )
                  }
                  className="w-full py-2.5 px-3 rounded-md bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác Nhận Đã Nhận Đủ Hàng (Giải Ngân)</span>
                </button>
                <span className="text-[10px] text-[#64748B] block font-mono">
                  Giải ngân ngay {netSellerReceives} USDC cho Seller và {brokerFeeNum} USDC phí cho GDTG.
                </span>

                {/* 2. Auto-refund on Expired */}
                <button
                  type="button"
                  onClick={() =>
                    executePactWrite(
                      "Rút 100% Tiền Về Ví (Quá Hạn Bàn Giao)",
                      "buyerClaimExpiredRefund",
                      [pactId]
                    )
                  }
                  disabled={!isTimeExpired}
                  className={`w-full py-2.5 px-3 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-2 ${
                    isTimeExpired
                      ? "bg-[#E84142] hover:bg-[#D13637] text-white shadow-md"
                      : "bg-[#161922] border border-[#1E222D] text-[#64748B] cursor-not-allowed"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {isTimeExpired
                      ? "Rút 100% Tiền Về Ví Ngay (Quá Hạn)"
                      : `Khóa Rút Tiền (Còn ${timerDisplay})`}
                  </span>
                </button>

                {/* 3. Mutual Cancel */}
                <div className="pt-2 border-t border-[#1E222D] space-y-2">
                  <button
                    type="button"
                    onClick={() =>
                      executePactWrite(
                        "Đồng Ý Hủy Kèo Hoàn Tiền",
                        "mutualCancelEscrow",
                        [pactId]
                      )
                    }
                    className="w-full py-2 px-3 rounded-md bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                  >
                    Yêu Cầu Hủy Kèo &amp; Hoàn Tiền (Cần Seller Ký)
                  </button>
                  <div className="flex justify-between text-[11px] font-mono text-[#64748B]">
                    <span>Buyer ký: {buyerCancelApproved ? "Đã ký ✓" : "Chưa ký"}</span>
                    <span>Seller ký: {sellerCancelApproved ? "Đã ký ✓" : "Chưa ký"}</span>
                  </div>
                </div>

                {/* 4. Escalation to CSKH */}
                <div className="pt-2 border-t border-[#1E222D]">
                  <Link
                    href={`/admin/disputes?id=${escrowItem.id.toString()}`}
                    className="w-full py-2 px-3 rounded-md bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-xs font-bold text-[#EF4444] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>Báo Cáo CSKH Xử Lý (GDTG Bịp / Không Giải Ngân)</span>
                  </Link>
                </div>
              </div>
            )}

            {/* ── ACTIONS FOR BROKER ───────────────────────────────────────── */}
            {isBroker && statusNumber === 0 && (
              <div className="space-y-3 font-sans">
                {/* 1. Broker Release */}
                <button
                  type="button"
                  onClick={() =>
                    executePactWrite(
                      "GDTG Giải Ngân Cho Seller",
                      "brokerRelease",
                      [pactId]
                    )
                  }
                  className="w-full py-2.5 px-3 rounded-md bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Giải Ngân Cho Seller ({netSellerReceives} USDC)</span>
                </button>

                {/* 2. Broker Refund Buyer */}
                <button
                  type="button"
                  onClick={() =>
                    executePactWrite(
                      "GDTG Hoàn Tiền 100% Cho Buyer",
                      "brokerRefundBuyer",
                      [pactId]
                    )
                  }
                  className="w-full py-2.5 px-3 rounded-md bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-xs font-semibold text-[#F1F5F9] transition-colors"
                >
                  Hoàn Tiền 100% Cho Buyer ({dealAmountNum} USDC)
                </button>

                {/* 3. Broker Settle Calculator */}
                <div className="p-3 rounded-md bg-[#090A0D] border border-[#1E222D] space-y-2.5 pt-2">
                  <span className="text-[11px] font-semibold uppercase text-[#F59E0B] font-mono block">
                    Hòa Giải Phân Chia Tiền:
                  </span>
                  <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                    <div>
                      <label className="text-[10px] text-[#64748B] block mb-0.5">Về Buyer:</label>
                      <input
                        type="number"
                        value={refundToBuyerInput}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setRefundToBuyerInput(e.target.value);
                          setPayoutToSellerInput(Math.max(0, dealAmountNum - val).toString());
                        }}
                        className="w-full bg-[#161922] border border-[#1E222D] rounded px-2 py-1.5 text-xs text-[#F1F5F9] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-[#64748B] block mb-0.5">Về Seller:</label>
                      <input
                        type="number"
                        value={payoutToSellerInput}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setPayoutToSellerInput(e.target.value);
                          setRefundToBuyerInput(Math.max(0, dealAmountNum - val).toString());
                        }}
                        className="w-full bg-[#161922] border border-[#1E222D] rounded px-2 py-1.5 text-xs text-[#F1F5F9] focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const refBig = parseUsdc(refundToBuyerInput);
                      const payBig = parseUsdc(payoutToSellerInput);
                      executePactWrite(
                        "Thực Thi Hòa Giải Chia Tiền",
                        "brokerSettle",
                        [pactId, refBig, payBig]
                      );
                    }}
                    className="w-full py-2 rounded-md bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold text-xs transition-colors"
                  >
                    Ký Lệnh Hòa Giải Chia Tiền
                  </button>
                </div>
              </div>
            )}

            {/* ── ACTIONS FOR SELLER ───────────────────────────────────────── */}
            {isSeller && statusNumber === 0 && (
              <div className="space-y-3 font-sans">
                <div className="p-3 rounded-md bg-[#090A0D] border border-[#1E222D] space-y-1.5 text-xs font-mono">
                  <span className="text-[#64748B] block">Số tiền thực nhận khi giải ngân:</span>
                  <span className="text-base font-bold text-[#10B981] block">{netSellerReceives} USDC</span>
                  <span className="text-[10px] text-[#64748B] block">
                    Đã trừ phí GDTG ({brokerFeeNum} USDC) và phí protocol ({protocolFeeNum} USDC).
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    executePactWrite(
                      "Seller Đồng Ý Hủy Kèo & Hoàn Tiền",
                      "mutualCancelEscrow",
                      [pactId]
                    )
                  }
                  className="w-full py-2.5 px-3 rounded-md bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-xs font-semibold text-[#F1F5F9] transition-colors"
                >
                  Đồng Ý Hủy Kèo &amp; Hoàn Tiền Cho Buyer
                </button>
              </div>
            )}

            {/* ── ACTIONS FOR OBSERVER / NON-PARTICIPANT ──────────────────── */}
            {isObserver && statusNumber === 0 && (
              <div className="p-3 rounded-md bg-[#090A0D] border border-[#1E222D] text-xs font-sans text-[#94A3B8] leading-relaxed">
                Ví đang kết nối không phải là chủ thể trong giao dịch này. Chỉ Buyer, Seller hoặc GDTG được chỉ định mới có quyền ký lệnh.
              </div>
            )}

            {/* Completed Notice */}
            {statusNumber !== 0 && (
              <div className="p-3 rounded-md bg-[#090A0D] border border-[#1E222D] text-xs font-sans text-[#F1F5F9] space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#10B981]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Kèo đã được quyết toán và đóng sổ cái on-chain.</span>
                </div>
                <span className="text-[11px] text-[#64748B] font-mono block">
                  Toàn bộ tiền trong két sắt đã được chuyển giao an toàn.
                </span>
              </div>
            )}
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
