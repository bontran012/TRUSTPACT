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
  Headphones,
  Copy,
  User,
  Store,
  Shield,
  Gavel,
  FileCheck2,
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
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { ShimmerButton } from "@/src/components/ui/ShimmerButton";

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
  role: "buyer" | "seller" | "broker" | "admin" | "system";
  senderName: string;
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
  const { currentUser } = useAuth();
  const { language, t } = useLanguage();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [currentTime, setCurrentTime] = useState<number>(Math.floor(Date.now() / 1000));
  const [txStatus, setTxStatus] = useState<TxStatus>({ step: "idle" });
  const [simulatedStatusOverride, setSimulatedStatusOverride] = useState<number | null>(null);

  // Handover state
  const [handoverData, setHandoverData] = useState<{
    assetTitle: string;
    proofUrl: string;
    notes: string;
    isHandedOver: boolean;
    handedOverAt?: string;
  }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`trustpact_handover_${pactId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return {
      assetTitle: "Bàn giao tài sản số & tài khoản OTC theo thỏa thuận",
      proofUrl: "https://testnet.snowtrace.io/tx/0x44b1928019a84f",
      notes: "Đã bàn giao đầy đủ quyền sở hữu tài sản cho Bên Mua qua kênh bảo mật.",
      isHandedOver: true,
      handedOverAt: "10:22",
    };
  });

  // Seller Handover Input
  const [sellerProofInput, setSellerProofInput] = useState("");
  const [sellerNotesInput, setSellerNotesInput] = useState("");

  // Update countdown timer
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

  const { data: buyerApprovedRelease, refetch: refetchBuyerApproved } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "buyerApprovedRelease",
    args: [pactId],
    query: { refetchInterval: 3000 },
  });

  const { data: brokerApprovedRelease, refetch: refetchBrokerApproved } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "brokerApprovedRelease",
    args: [pactId],
    query: { refetchInterval: 3000 },
  });

  const [lastFinalityMs, setLastFinalityMs] = useState<number | null>(null);

  const { data: contractAdmin } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "admin",
  });

  // Server DB pact data
  const [serverPactData, setServerPactData] = useState<any>(null);
  const [localPactData, setLocalPactData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem("trustpact_custom_pacts") || "{}");
        if (stored[String(pactId)]) {
          setLocalPactData(stored[String(pactId)]);
        }
      } catch {}
    }
  }, [pactId]);

  // Fallback Escrow Struct
  const escrowItem: EscrowStruct = (escrowData && (escrowData as any).amount > 0n)
    ? (escrowData as unknown as EscrowStruct)
    : serverPactData
    ? {
        id: pactId,
        buyer: (serverPactData.buyer as `0x${string}`) || "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
        seller: (serverPactData.seller as `0x${string}`) || "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
        broker: (serverPactData.broker as `0x${string}`) || "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
        amount: parseUsdc(String(serverPactData.amount || "1000")),
        brokerFeeBps: BigInt(serverPactData.brokerFeeBps || 150),
        duration: BigInt(serverPactData.duration || 86400),
        startTime: BigInt(serverPactData.startTime || Math.floor(Date.now() / 1000) - 1800),
        status: serverPactData.status !== undefined ? Number(serverPactData.status) : 0,
      }
    : localPactData
    ? {
        id: pactId,
        buyer: (localPactData.buyer as `0x${string}`) || "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
        seller: (localPactData.seller as `0x${string}`) || "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
        broker: (localPactData.broker as `0x${string}`) || "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
        amount: parseUsdc(String(localPactData.amount || "1000")),
        brokerFeeBps: BigInt(localPactData.brokerFeeBps || 150),
        duration: BigInt(localPactData.duration || 86400),
        startTime: BigInt(localPactData.startTime || Math.floor(Date.now() / 1000) - 1800),
        status: localPactData.status !== undefined ? Number(localPactData.status) : 0,
      }
    : {
        id: pactId,
        buyer: "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
        seller: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
        broker: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
        amount: 6000000n,
        brokerFeeBps: 150n,
        duration: 172800n,
        startTime: BigInt(Math.floor(Date.now() / 1000) - 1800),
        status: 0,
      };

  const statusNumber = simulatedStatusOverride !== null ? simulatedStatusOverride : Number(escrowItem.status);
  const deadline = Number(escrowItem.startTime + escrowItem.duration);
  const remainingSeconds = Math.max(0, deadline - currentTime);
  const isTimeExpired = Boolean(isExpiredFromContract) || remainingSeconds === 0;

  const hoursLeft = Math.floor(remainingSeconds / 3600);
  const minsLeft = Math.floor((remainingSeconds % 3600) / 60);
  const secsLeft = remainingSeconds % 60;
  const timerDisplay = `${hoursLeft.toString().padStart(2, "0")}:${minsLeft.toString().padStart(2, "0")}:${secsLeft.toString().padStart(2, "0")}`;

  // Role Detection
  const effectiveAddress = address || currentUser?.walletAddress;
  const connectedLower = effectiveAddress?.toLowerCase();
  const userRole = currentUser?.role;

  const contractAdminLower = (contractAdmin as string)?.toLowerCase();
  const configuredAdminLower = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();
  const isContractAdmin = Boolean(
    connectedLower &&
    ((contractAdminLower && connectedLower === contractAdminLower) ||
     (configuredAdminLower && connectedLower === configuredAdminLower))
  );

  const isAdmin = userRole === "ADMIN" || isContractAdmin;
  const isSeller = !isAdmin && (userRole === "SELLER" || connectedLower === escrowItem.seller.toLowerCase());
  const isBroker = isAdmin || userRole === "BROKER" || connectedLower === escrowItem.broker.toLowerCase();
  const isBuyer = !isAdmin && !isSeller && (userRole === "BUYER" || connectedLower === escrowItem.buyer.toLowerCase() || !isBroker);

  // Financial Calculations
  const dealAmountNum = Number(escrowItem.amount) / 1e6;
  const brokerFeeNum = +((dealAmountNum * Number(escrowItem.brokerFeeBps)) / 10000).toFixed(2);
  const protocolFeeNum = +((dealAmountNum * 30) / 10000).toFixed(2);
  const netSellerReceives = +(dealAmountNum - brokerFeeNum - protocolFeeNum).toFixed(2);

  // Settlement Inputs for Broker Split
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [refundToBuyerInput, setRefundToBuyerInput] = useState<string>(String(dealAmountNum / 2));
  const [payoutToSellerInput, setPayoutToSellerInput] = useState<string>(String(dealAmountNum / 2));

  // Dispute Modal State
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReasonInput, setDisputeReasonInput] = useState("Bên đối tác không thực hiện đúng cam kết bàn giao, yêu cầu GDTG hòa giải.");

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowDisputeModal(false);
    await executePactWrite("Kích Hoạt Khiếu Nại Tranh Chấp (Đóng Băng Hạn Rút Tiền)", "raiseDispute", [
      pactId,
      disputeReasonInput.trim(),
    ]);
  };

  // Chat message stream
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchChatAndHandover = async () => {
      try {
        const [msgRes, handoverRes, pactRes] = await Promise.all([
          fetch(`/api/pacts/${pactId}/messages`),
          fetch(`/api/pacts/${pactId}/handover`),
          fetch(`/api/pacts/${pactId}`),
        ]);

        if (!isMounted) return;

        const msgData = await msgRes.json();
        if (msgData.success && Array.isArray(msgData.messages) && msgData.messages.length > 0) {
          setMessages(msgData.messages);
        }

        const handoverJson = await handoverRes.json();
        if (handoverJson.success && handoverJson.handover && handoverJson.handover.isHandedOver) {
          setHandoverData(handoverJson.handover);
        }

        const pactJson = await pactRes.json();
        if (pactJson.success && pactJson.pact) {
          setServerPactData(pactJson.pact);
          if (simulatedStatusOverride === null && pactJson.pact.status !== 0) {
            setSimulatedStatusOverride(pactJson.pact.status);
          }
        }
      } catch (err) {}
    };

    fetchChatAndHandover();
    const interval = setInterval(fetchChatAndHandover, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pactId, simulatedStatusOverride]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim()) return;
    const role: "buyer" | "seller" | "broker" | "admin" = isAdmin
      ? "admin"
      : isBroker
      ? "broker"
      : isSeller
      ? "seller"
      : "buyer";
    const senderName = isAdmin
      ? "Admin Tối Cao (TrustPact)"
      : isBroker
      ? "Nguyễn Nam (GDTG)"
      : isSeller
      ? "Hoàng Minh (Bên Bán)"
      : "Lê Minh Tuấn (Bên Mua)";

    const payload = {
      sender: effectiveAddress || escrowItem.buyer,
      role,
      senderName,
      text: newMessageText.trim(),
    };

    const optimisticMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: (effectiveAddress || escrowItem.buyer) as `0x${string}`,
      role,
      senderName,
      text: newMessageText.trim(),
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setNewMessageText("");

    try {
      const res = await fetch(`/api/pacts/${pactId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? data.message : m)));
      }
    } catch (err) {
      console.error("Lỗi đồng bộ tin nhắn:", err);
    }
  };

  const handleQuickReply = async (text: string) => {
    const role: "buyer" | "seller" | "broker" | "admin" = isAdmin
      ? "admin"
      : isBroker
      ? "broker"
      : isSeller
      ? "seller"
      : "buyer";
    const senderName = isAdmin
      ? "Admin Tối Cao"
      : isBroker
      ? "Nguyễn Nam (GDTG)"
      : isSeller
      ? "Hoàng Minh (Bên Bán)"
      : "Lê Minh Tuấn (Bên Mua)";

    try {
      const res = await fetch(`/api/pacts/${pactId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: effectiveAddress || escrowItem.buyer,
          role,
          senderName,
          text,
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (err) {}
  };

  const handleSellerConfirmHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    const proofUrl = sellerProofInput.trim() || "https://testnet.snowtrace.io";
    const notes = sellerNotesInput.trim() || "Bên Bán xác nhận đã chuyển giao đầy đủ hàng/tài sản cho Bên Mua.";
    const timeStr = new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    const localHandover = {
      assetTitle: "Bàn giao tài sản số & tài khoản OTC",
      proofUrl,
      notes,
      isHandedOver: true,
      handedOverAt: timeStr,
    };
    setHandoverData(localHandover);

    try {
      const res = await fetch(`/api/pacts/${pactId}/handover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetTitle: "Bàn giao tài sản số & tài khoản OTC",
          proofUrl,
          notes,
          senderName: "Hoàng Minh (Bên Bán)",
          senderAddress: escrowItem.seller,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.handover) setHandoverData(data.handover);
        if (data.message) setMessages((prev) => [...prev, data.message]);
      }
    } catch (err) {}
  };

  const handleOpenCSKH = () => {
    window.dispatchEvent(
      new CustomEvent("open-cskh-chat", {
        detail: { dealId: pactId.toString() },
      })
    );
  };

  const executePactWrite = async (actionTitle: string, functionName: any, args: any[]) => {
    setTxStatus({ step: "awaiting_signature", actionTitle });

    const addrLower = address?.toLowerCase();
    const isCallerAdmin = Boolean(
      addrLower &&
      ((contractAdminLower && addrLower === contractAdminLower) ||
       (configuredAdminLower && addrLower === configuredAdminLower))
    );

    const isWalletEligibleOnChain =
      addrLower &&
      ((functionName === "buyerConfirmDelivery" && addrLower === escrowItem.buyer.toLowerCase()) ||
       (functionName === "brokerRelease" && (addrLower === escrowItem.broker.toLowerCase() || isCallerAdmin)) ||
       (functionName === "brokerRefundBuyer" && (addrLower === escrowItem.broker.toLowerCase() || isCallerAdmin)) ||
       (functionName === "brokerSettle" && (addrLower === escrowItem.broker.toLowerCase() || isCallerAdmin)) ||
       (functionName === "buyerClaimExpiredRefund" && addrLower === escrowItem.buyer.toLowerCase()) ||
       (functionName === "mutualCancelEscrow" && (addrLower === escrowItem.buyer.toLowerCase() || addrLower === escrowItem.seller.toLowerCase())) ||
       (functionName === "raiseDispute" && (addrLower === escrowItem.buyer.toLowerCase() || addrLower === escrowItem.seller.toLowerCase() || addrLower === escrowItem.broker.toLowerCase() || isCallerAdmin)) ||
       (functionName === "adminSlashCorruptBroker" && isCallerAdmin));

    if (isWalletEligibleOnChain && writeContractAsync) {
      try {
        const hash = await writeContractAsync({
          address: CONTRACT_ADDRESSES.universalEscrow,
          abi: UNIVERSAL_ESCROW_ABI,
          functionName,
          args: args as any,
        });

        const txStartTime = performance.now();
        setTxStatus({ step: "confirming", txHash: hash, actionTitle });
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }
        const finalityMs = Math.round(performance.now() - txStartTime);
        setLastFinalityMs(finalityMs);

        setTxStatus({ step: "success", txHash: hash, actionTitle: `${actionTitle} (${finalityMs}ms Snowman Finality)` });

        const buyerSignedNow = functionName === "buyerConfirmDelivery" || Boolean(buyerApprovedRelease);
        const brokerSignedNow = functionName === "brokerRelease" || Boolean(brokerApprovedRelease);
        const isFullRelease =
          functionName === "brokerSettle" ||
          (statusNumber === 3 && (functionName === "brokerRelease" || functionName === "buyerConfirmDelivery")) ||
          (isCallerAdmin && functionName === "brokerRelease") ||
          (buyerSignedNow && brokerSignedNow);
        const isRefund =
          functionName === "brokerRefundBuyer" ||
          functionName === "buyerClaimExpiredRefund" ||
          functionName === "mutualCancelEscrow" ||
          functionName === "adminSlashCorruptBroker";
        const isDispute = functionName === "raiseDispute";
        const newStatus = isFullRelease ? 1 : isRefund ? 2 : isDispute ? 3 : 0;

        await fetch(`/api/pacts/${pactId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, txHash: hash }),
        });

        const stepNote =
          !isFullRelease && functionName === "buyerConfirmDelivery"
            ? " (Bước 1/2: Bên Mua đã xác nhận nhận hàng — chờ GDTG bấm giải ngân)"
            : !isFullRelease && functionName === "brokerRelease"
            ? " (Bước 1/2: GDTG đã kiểm định OK — chờ Bên Mua xác nhận nhận hàng)"
            : isFullRelease
            ? " (Đủ 2/2 chữ ký xác nhận — Đã giải ngân tự động về ví Seller!)"
            : "";

        await fetch(`/api/pacts/${pactId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: CONTRACT_ADDRESSES.universalEscrow,
            role: "system",
            senderName: "UniversalEscrow Protocol",
            text: `✓ Giao dịch ON-CHAIN thành công trên Avalanche Fuji (${finalityMs}ms)!${stepNote} Mã Tx: ${hash}`,
            isProof: true,
            proofUrl: `https://testnet.snowtrace.io/tx/${hash}`,
          }),
        });

        await Promise.all([
          refetchEscrow(),
          refetchExpired(),
          refetchBuyerCancel(),
          refetchSellerCancel(),
          refetchBuyerApproved(),
          refetchBrokerApproved(),
        ]);
        setTimeout(() => setTxStatus({ step: "idle" }), 2500);
        return;
      } catch (err: any) {
        setTxStatus({
          step: "error",
          actionTitle,
          errorMessage: parseContractError(err),
        });
        return;
      }
    }

    // Clear error when wallet is not connected or does not match the authorized role on-chain
    const requiredWalletHint =
      functionName === "buyerConfirmDelivery" || functionName === "buyerClaimExpiredRefund"
        ? `Ví Bên Mua (${shortenAddress(escrowItem.buyer)})`
        : functionName === "brokerRelease" || functionName === "brokerRefundBuyer" || functionName === "brokerSettle"
        ? `Ví GDTG (${shortenAddress(escrowItem.broker)}) hoặc Admin`
        : `Ví hợp lệ trong hợp đồng (#${pactId.toString()})`;

    setTxStatus({
      step: "error",
      actionTitle,
      errorMessage: !address
        ? `Vui lòng kết nối ví Web3 mạng Avalanche Fuji (${requiredWalletHint}) để ký giao dịch thật trên Smart Contract.`
        : `Ví đang kết nối (${shortenAddress(address)}) không khớp với quyền thực thi trên hợp đồng. Yêu cầu: ${requiredWalletHint}.`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── SCENIC 3D VAULT ROOM HEADER ─────────────────────────────────────── */}
      <section className="card overflow-hidden p-0 relative">
        <img
          src="/images/hero-3d-escrow.png"
          alt=""
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-50 hidden sm:block"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1E47]/95 via-[#0E2454]/88 to-[#0E2454]/45" />

        <div className="relative p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-bold text-white bg-sky-400/25 px-3.5 py-1 rounded-full border border-sky-300/40">
                  {t("Phòng Ký Quỹ", "Escrow Room")} <strong className="font-mono">#{escrowItem.id.toString()}</strong>
                </span>

                <span
                  className={`badge-pill border ${
                    statusNumber === 0
                      ? "bg-amber-400/20 border-amber-300/40 text-amber-200"
                      : statusNumber === 1
                      ? "bg-emerald-400/20 border-emerald-300/40 text-emerald-200"
                      : statusNumber === 3
                      ? "bg-rose-500/25 border-rose-400/50 text-rose-200 font-bold animate-pulse"
                      : "bg-white/[0.12] border-white/[0.2] text-sky-100"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      statusNumber === 0
                        ? "bg-amber-300 animate-pulse"
                        : statusNumber === 1
                        ? "bg-emerald-300"
                        : statusNumber === 3
                        ? "bg-rose-400"
                        : "bg-slate-300"
                    }`}
                  />
                  <span>
                    {statusNumber === 0
                      ? t("Đang Khóa Trong Két", "Funds Locked in Vault")
                      : statusNumber === 1
                      ? t("Đã Giải Ngân Hoàn Tất", "Completed & Disbursed")
                      : statusNumber === 3
                      ? t("Đang Khiếu Nại Tranh Chấp", "Dispute Raised & Auto-Refund Frozen")
                      : t("Đã Hoàn Tiền Cho Buyer", "Cancelled & Refunded")}
                  </span>
                </span>

                <span className="text-xs font-mono text-sky-100/80 bg-white/[0.08] px-3 py-1 rounded-full border border-white/[0.16]">
                  Avalanche Fuji #43113
                </span>
              </div>

              <p className="text-sm text-sky-100/85">
                {t(
                  "Phòng đối soát 3 bên bảo mật · Dòng tiền ký quỹ nằm an toàn trong Smart Contract UniversalEscrow",
                  "3-Party settlement desk · Escrow funds secured in UniversalEscrow Smart Contract Vault"
                )}
              </p>
            </div>

            {/* Countdown & Quick Actions */}
            <div className="flex items-center gap-2.5 text-xs shrink-0 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#081635]/60 backdrop-blur-md border border-white/[0.18]">
                <Clock className={`w-4 h-4 ${isTimeExpired ? "text-rose-300" : "text-amber-300"}`} />
                <span className="text-sky-100/80">{t("Thời hạn:", "Deadline:")}</span>
                {isTimeExpired ? (
                  <span className="font-semibold text-rose-300">{t("Đã quá hạn", "Expired")}</span>
                ) : (
                  <span className="font-bold font-mono text-white tabular-nums">{timerDisplay}</span>
                )}
              </div>

              <a
                href={`https://testnet.snowtrace.io/address/${CONTRACT_ADDRESSES.universalEscrow}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white px-4 py-2 rounded-full bg-white/[0.1] hover:bg-white/[0.18] border border-white/[0.2] inline-flex items-center gap-1.5 font-semibold transition-colors"
              >
                <span>Snowtrace</span>
                <ExternalLink className="w-3.5 h-3.5 text-sky-200" />
              </a>

              <button
                onClick={() => {
                  refetchEscrow();
                  refetchExpired();
                  refetchBuyerCancel();
                  refetchSellerCancel();
                }}
                className="p-2 rounded-full bg-white/[0.1] hover:bg-white/[0.18] border border-white/[0.2] text-sky-100 hover:text-white transition-colors"
                title="Làm mới trạng thái"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── 4-STAGE CIRCULAR STEPPER ──────────────────────────────────── */}
          <div className="pt-4 border-t border-white/[0.14]">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  step: "01",
                  title: t("Nạp Két Sắt", "Vault Deposit"),
                  desc: `${formatUsdc(escrowItem.amount)} USDC`,
                  isDone: true,
                  isActive: false,
                },
                {
                  step: "02",
                  title: t("Bàn Giao Tài Sản", "Asset Handover"),
                  desc: handoverData.isHandedOver ? t("Đã bàn giao", "Delivered") : t("Đang chờ giao", "Pending"),
                  isDone: handoverData.isHandedOver,
                  isActive: !handoverData.isHandedOver && statusNumber === 0,
                },
                {
                  step: "03",
                  title: t("Đối Soát Nghiệm Thu", "Audit & Inspect"),
                  desc: statusNumber === 1 ? t("Đã nghiệm thu", "Approved") : t("Đang kiểm tra", "Inspecting"),
                  isDone: statusNumber === 1,
                  isActive: handoverData.isHandedOver && statusNumber === 0,
                },
                {
                  step: "04",
                  title: t("Quyết Toán Kèo", "Final Settlement"),
                  desc: statusNumber === 1 ? t("Đã giải ngân", "Disbursed") : statusNumber === 2 ? t("Đã hoàn tiền", "Refunded") : t("Chờ ký lệnh", "Awaiting"),
                  isDone: statusNumber !== 0,
                  isActive: false,
                },
              ].map((st) => (
                <div
                  key={st.step}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                    st.isDone
                      ? "bg-emerald-400/15 border-emerald-300/35"
                      : st.isActive
                      ? "bg-sky-400/20 border-sky-300/45 shadow-sm"
                      : "bg-white/[0.06] border-white/[0.14]"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      st.isDone
                        ? "bg-emerald-400 text-slate-950 shadow-sm"
                        : st.isActive
                        ? "bg-gradient-to-br from-sky-400 to-indigo-500 text-white shadow-sm"
                        : "bg-white/[0.1] text-sky-200/70 border border-white/[0.16]"
                    }`}
                  >
                    {st.isDone ? <Check className="w-4 h-4 stroke-[3]" /> : st.step}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-white block truncate">{st.title}</span>
                    <span
                      className={`text-xs block truncate mt-0.5 ${
                        st.isDone ? "text-emerald-200" : st.isActive ? "text-sky-200" : "text-sky-100/65"
                      }`}
                    >
                      {st.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3-PARTY IDENTITY STRIP WITH REAL PORTRAITS ──────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Buyer */}
        <div
          className={`card p-5 space-y-3.5 ${
            isBuyer ? "border-sky-300/50 bg-sky-400/[0.12]" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-100/80 font-semibold uppercase tracking-wider">
              {t("Bên Mua (Buyer)", "Buyer")}
            </span>
            {isBuyer && (
              <span className="badge-pill bg-sky-400/25 text-white border border-sky-300/40 text-[11px]">
                {t("Bạn đang xem", "You")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <img
              src="/images/avatar-tuan.jpg"
              alt="Buyer"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-sky-300/50 shrink-0 shadow-md"
            />
            <div>
              <span className="font-bold text-sm text-white block">Lê Minh Tuấn</span>
              <span className="text-sky-100/75 font-mono text-xs block">{shortenAddress(escrowItem.buyer)}</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-white/[0.14] flex justify-between items-center text-xs">
            <span className="text-sky-100/80">Đã ký quỹ</span>
            <span className="text-white font-mono font-bold tabular-nums">{formatUsdc(escrowItem.amount)} USDC</span>
          </div>
        </div>

        {/* Broker */}
        <div
          className={`card p-5 space-y-3.5 ${
            isBroker && !isAdmin ? "border-amber-300/50 bg-amber-400/[0.12]" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-100/80 font-semibold uppercase tracking-wider">
              {t("GDTG Bảo Chứng", "Escrow Broker")}
            </span>
            {isBroker && !isAdmin && (
              <span className="badge-pill bg-amber-400/25 text-amber-100 border border-amber-300/40 text-[11px]">
                {t("Bạn đang xem", "You")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <img
              src="/images/avatar-nam.jpg"
              alt="Broker"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-300/50 shrink-0 shadow-md"
            />
            <div>
              <span className="font-bold text-sm text-white block">Nguyễn Nam (Giám Định)</span>
              <span className="text-sky-100/75 font-mono text-xs block">{shortenAddress(escrowItem.broker)}</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-white/[0.14] flex justify-between items-center text-xs">
            <span className="text-sky-100/80">Phí bảo chứng ({(Number(escrowItem.brokerFeeBps) / 100).toFixed(2)}%)</span>
            <span className="text-amber-200 font-mono font-bold tabular-nums">+{brokerFeeNum} USDC</span>
          </div>
        </div>

        {/* Seller */}
        <div
          className={`card p-5 space-y-3.5 ${
            isSeller ? "border-emerald-300/50 bg-emerald-400/[0.12]" : ""
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-100/80 font-semibold uppercase tracking-wider">
              {t("Bên Bán (Seller)", "Seller")}
            </span>
            {isSeller && (
              <span className="badge-pill bg-emerald-400/25 text-emerald-100 border border-emerald-300/40 text-[11px]">
                {t("Bạn đang xem", "You")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <img
              src="/images/avatar-hoang.jpg"
              alt="Seller"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-300/50 shrink-0 shadow-md"
            />
            <div>
              <span className="font-bold text-sm text-white block">Hoàng Minh (OTC)</span>
              <span className="text-sky-100/75 font-mono text-xs block">{shortenAddress(escrowItem.seller)}</span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-white/[0.14] flex justify-between items-center text-xs">
            <span className="text-sky-100/80">Thực nhận (Net)</span>
            <span className="text-emerald-300 font-mono font-bold tabular-nums">{netSellerReceives} USDC</span>
          </div>
        </div>
      </section>

      {/* ── MAIN WORKSPACE: 2 COLUMNS (7 - 5) ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* ── LEFT PANE (7 COLS): HANDOVER & 3-PARTY CHAT ─────────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Handover Proof Card */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.14] gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-400/20 border border-emerald-300/35 flex items-center justify-center text-emerald-200">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <h2 className="section-title">
                  {t("Bằng Chứng & Trạng Thái Bàn Giao", "Handover Proof & Delivery Status")}
                </h2>
              </div>
              <span
                className={`badge-pill border ${
                  handoverData.isHandedOver
                    ? "bg-emerald-400/20 text-emerald-200 border-emerald-300/35"
                    : "bg-amber-400/20 text-amber-200 border-amber-300/35"
                }`}
              >
                {handoverData.isHandedOver ? t("Đã Bàn Giao ✓", "Handed Over ✓") : t("Chờ Bàn Giao", "Awaiting Delivery")}
              </span>
            </div>

            <div className="card-inner p-4 space-y-2.5">
              <span className="text-xs text-sky-100/80 font-semibold uppercase tracking-wider block">
                {t("Điều khoản thỏa thuận", "Agreed Deal Terms")}
              </span>
              <p className="text-sm text-white leading-relaxed">
                {localPactData?.terms || t("Bên Bán bàn giao tài sản số và quyền sở hữu trong vòng 24 giờ. GDTG đối soát trước khi duyệt giải ngân.", "Seller delivers digital assets within 24 hours. Broker audits before release.")}
              </p>
              {handoverData.proofUrl && (
                <div className="pt-2.5 border-t border-white/[0.12] flex items-center justify-between gap-2 text-xs flex-wrap">
                  <span className="text-sky-100/80">{t("Chứng từ bàn giao:", "Audit Proof:")}</span>
                  <a
                    href={handoverData.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-300 hover:text-white hover:underline font-mono inline-flex items-center gap-1 font-semibold"
                  >
                    <span>{handoverData.proofUrl.slice(0, 38)}...</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {isSeller && !handoverData.isHandedOver && statusNumber === 0 && (
              <form onSubmit={handleSellerConfirmHandover} className="card-inner p-4 border border-emerald-300/40 space-y-3">
                <span className="text-sm font-semibold text-emerald-300 block">
                  {t("Bên Bán: Xác nhận hoàn tất giao hàng", "Seller: Confirm delivery completed")}
                </span>
                <input
                  type="text"
                  value={sellerProofInput}
                  onChange={(e) => setSellerProofInput(e.target.value)}
                  placeholder={t("Dán link bằng chứng / bill / TxHash chuyển nhượng...", "Paste proof link / TxHash / screenshot URL...")}
                  className="input-field text-xs font-mono"
                />
                <ShimmerButton type="submit" variant="success" className="w-full py-2.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t("Xác Nhận Đã Bàn Giao Xong", "Confirm Handover Completed")}</span>
                </ShimmerButton>
              </form>
            )}
          </div>

          {/* 3-Party Audit Stream */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.14]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-sky-400/20 border border-sky-300/35 flex items-center justify-center text-sky-200">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="section-title">
                  {t("Nhật Ký Đối Soát & Trao Đổi 3 Bên", "3-Party Real-Time Audit Log")}
                </h2>
              </div>
              <span className="text-xs font-mono text-sky-200/80">Live Sync</span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-2xl border text-sm space-y-1.5 ${
                    m.role === "system"
                      ? "bg-sky-400/12 border-sky-300/30"
                      : "card-inner"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`badge-pill text-[10px] uppercase py-0.5 px-2.5 ${
                          m.role === "system"
                            ? "bg-sky-400/25 text-sky-100 border border-sky-300/35"
                            : m.role === "admin"
                            ? "bg-purple-400/25 text-purple-100 border border-purple-300/35"
                            : m.role === "broker"
                            ? "bg-amber-400/25 text-amber-100 border border-amber-300/35"
                            : m.role === "buyer"
                            ? "bg-indigo-400/25 text-indigo-100 border border-indigo-300/35"
                            : "bg-emerald-400/25 text-emerald-100 border border-emerald-300/35"
                        }`}
                      >
                        {m.role === "system"
                          ? "Hệ thống"
                          : m.role === "admin"
                          ? "Admin"
                          : m.role === "broker"
                          ? "GDTG"
                          : m.role === "buyer"
                          ? "Bên Mua"
                          : "Bên Bán"}
                      </span>
                      <span className="text-white font-semibold">{m.senderName}</span>
                    </div>
                    <span className="text-sky-200/70 text-xs font-mono">{m.timestamp}</span>
                  </div>
                  <p className="text-sky-50 leading-relaxed text-[13px]">{m.text}</p>
                </div>
              ))}
            </div>

            {/* Quick Reply Chips */}
            <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-white/[0.12]">
              <span className="text-xs text-sky-100/75 font-medium">
                {t("Phản hồi nhanh:", "Quick replies:")}
              </span>
              {[
                t("Đã kiểm tra và nhận đủ hàng ✓", "Verified and received all ✓"),
                t("Đã chuyển giao xong tài sản", "Assets delivered"),
                t("GDTG đang đối soát chứng từ", "Broker auditing proof"),
              ].map((txt) => (
                <button
                  key={txt}
                  type="button"
                  onClick={() => handleQuickReply(txt)}
                  className="px-3.5 py-1 rounded-full bg-white/[0.1] hover:bg-white/[0.18] text-xs text-white border border-white/[0.18] transition-colors"
                >
                  {txt}
                </button>
              ))}
            </div>

            {/* Composer */}
            <form onSubmit={handleSendMessage} className="flex gap-2.5 pt-1">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder={t("Nhập nội dung trao đổi hoặc bằng chứng đối soát...", "Type audit message or proof...")}
                className="input-field rounded-full py-2.5 text-sm"
              />
              <ShimmerButton
                type="submit"
                disabled={!newMessageText.trim()}
                variant="primary"
                className="px-6 py-2.5 shrink-0 font-bold"
              >
                <Send className="w-4 h-4" />
                <span>{t("Gửi", "Send")}</span>
              </ShimmerButton>
            </form>
          </div>
        </div>

        {/* ── RIGHT PANE (5 COLS): SETTLEMENT TERMINAL ──────────────────────── */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          <div className="card-elevated overflow-hidden p-0">
            <div className="relative h-24 overflow-hidden border-b border-white/[0.16]">
              <img
                src="/images/sbt-passport-bg.png"
                alt=""
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0D214D]/90 to-[#162C63]/75 backdrop-blur-md px-6 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {t("Bảng Quyết Toán Hợp Đồng", "Settlement Terminal")}
                  </h3>
                  <span className="text-xs text-sky-100/80">Thực thi giải ngân hoặc hoàn cọc on-chain</span>
                </div>
                <div className="w-9 h-9 rounded-full bg-white/[0.14] border border-white/[0.25] flex items-center justify-center text-sky-200">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7 space-y-5">
              {/* Financial Breakdown */}
              <div className="p-4 rounded-2xl card-inner space-y-2.5 text-sm">
                <div className="flex justify-between items-center text-sky-100">
                  <span>{t("Tiền đang khóa trong két", "Locked in Vault")}</span>
                  <span className="text-white font-mono font-bold tabular-nums">{dealAmountNum.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between items-center text-xs text-sky-100/80">
                  <span>{t("Phí GDTG bảo chứng", "Broker Fee")}</span>
                  <span className="text-amber-200 font-mono tabular-nums">+{brokerFeeNum.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between items-center text-xs text-sky-100/80">
                  <span>{t("Phí giao thức (0.3%)", "Protocol Fee (0.3%)")}</span>
                  <span className="text-sky-200/80 font-mono tabular-nums">+{protocolFeeNum.toFixed(2)} USDC</span>
                </div>
                <div className="pt-2.5 border-t border-white/[0.14] flex justify-between items-center">
                  <span className="font-bold text-white">{t("Bên Bán thực nhận", "Net Seller Payout")}</span>
                  <span className="font-extrabold font-mono text-lg text-emerald-300 tabular-nums">{netSellerReceives.toFixed(2)} USDC</span>
                </div>
              </div>

              {/* 2-STEP RELEASE CONSENSUS TRACKER (GDTG + BUYER) */}
              <div className="p-4 rounded-2xl bg-sky-950/55 border border-sky-300/35 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-300" />
                    <span>{t("Cơ Chế Giải Ngân 2 Bước (2-of-2)", "2-Step Release Consensus")}</span>
                  </span>
                  <span className="font-mono text-[11px] text-sky-200">
                    {statusNumber === 1
                      ? "2/2 Hoàn Tất ✓"
                      : `${(buyerApprovedRelease ? 1 : 0) + (brokerApprovedRelease ? 1 : 0)}/2 Đã Xác Nhận`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      buyerApprovedRelease || statusNumber === 1
                        ? "bg-emerald-400/20 border-emerald-300/45 text-emerald-100"
                        : "bg-white/[0.05] border-white/[0.14] text-sky-100/75"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        buyerApprovedRelease || statusNumber === 1 ? "text-emerald-300" : "text-sky-200/40"
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="font-bold block truncate">Bước 1: Bên Mua</span>
                      <span className="text-[11px] block truncate">
                        {buyerApprovedRelease || statusNumber === 1 ? "Đã gật đầu OK ✓" : "Chờ nghiệm thu"}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                      brokerApprovedRelease || statusNumber === 1
                        ? "bg-emerald-400/20 border-emerald-300/45 text-emerald-100"
                        : "bg-white/[0.05] border-white/[0.14] text-sky-100/75"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        brokerApprovedRelease || statusNumber === 1 ? "text-emerald-300" : "text-sky-200/40"
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="font-bold block truncate">Bước 2: GDTG</span>
                      <span className="text-[11px] block truncate">
                        {brokerApprovedRelease || statusNumber === 1 ? "Đã duyệt OK ✓" : "Chờ kiểm định"}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-sky-100/80 leading-relaxed">
                  {statusNumber === 3
                    ? "⚖️ Đang trong trạng thái Tranh Chấp: GDTG có toàn quyền phân xử Giải Ngân, Hoàn Tiền 100% hoặc Chia Tỷ Lệ."
                    : "🔒 Tiền chỉ bắn về ví Seller khi CẢ Bên Mua VÀ GDTG cùng bấm xác nhận. Nếu hàng lỗi, GDTG bấm Hoàn Tiền 100% cho Buyer ngay lập tức."}
                </p>

                {lastFinalityMs !== null && (
                  <div className="pt-2 border-t border-white/[0.12] flex items-center justify-between text-[11px] font-mono text-emerald-300">
                    <span>⚡ Avalanche Snowman Finality thực tế:</span>
                    <strong>{lastFinalityMs} ms</strong>
                  </div>
                )}
              </div>

              {/* Active Role Indicator */}
              <div className="p-3.5 rounded-full bg-white/[0.08] border border-white/[0.16] flex items-center justify-between text-xs px-4">
                <span className="text-sky-100/80">{t("Quyền thao tác hiện tại:", "Active Role:")}</span>
                <span
                  className={`badge-pill ${
                    isAdmin
                      ? "bg-purple-400/25 text-purple-100 border border-purple-300/40"
                      : isBuyer
                      ? "bg-sky-400/25 text-white border border-sky-300/40"
                      : isSeller
                      ? "bg-emerald-400/25 text-emerald-100 border border-emerald-300/40"
                      : "bg-amber-400/25 text-amber-100 border border-amber-300/40"
                  }`}
                >
                  {isAdmin
                    ? t("Admin Tối Cao", "Super Admin")
                    : isBuyer
                    ? t("Bên Mua (Buyer)", "Buyer")
                    : isSeller
                    ? t("Bên Bán (Seller)", "Seller")
                    : t("GDTG Bảo Chứng (Broker)", "Broker")}
                </span>
              </div>

              {/* 1. BUYER ACTIONS */}
              {isBuyer && statusNumber === 0 && (
                <div className="space-y-3 pt-1">
                  <ShimmerButton
                    type="button"
                    disabled={Boolean(buyerApprovedRelease)}
                    onClick={() =>
                      executePactWrite(
                        t("Bước 1/2: Bên Mua Xác Nhận Hàng Chuẩn", "Step 1/2: Buyer Confirms Valid Delivery"),
                        "buyerConfirmDelivery",
                        [pactId]
                      )
                    }
                    variant="success"
                    className="w-full py-3.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {buyerApprovedRelease
                        ? t("Đã Xác Nhận Bước 1/2 ✓ (Chờ GDTG Bấm Giải Ngân)", "Confirmed Step 1/2 ✓ (Waiting for Broker)")
                        : brokerApprovedRelease
                        ? t("Hàng Chuẩn — Xác Nhận Bước 2/2 & Bắn Tiền Cho Seller", "Confirm Final Step 2/2 & Release to Seller")
                        : t("Hàng Chuẩn — Xác Nhận Bước 1/2 (Cần Thêm GDTG Duyệt)", "Confirm Delivery Step 1/2")}
                    </span>
                  </ShimmerButton>

                  <ShimmerButton
                    type="button"
                    onClick={() =>
                      executePactWrite(
                        t("Rút 100% Tiền Về Ví (Quá Hạn Bàn Giao)", "Claim 100% Timeout Refund"),
                        "buyerClaimExpiredRefund",
                        [pactId]
                      )
                    }
                    disabled={!isTimeExpired}
                    variant={isTimeExpired ? "danger" : "secondary"}
                    className="w-full py-2.5 text-xs"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {isTimeExpired
                        ? t("Rút 100% Tiền Về Ví Ngay (Đã Quá Hạn)", "Claim 100% Timeout Refund")
                        : t(`Tự Rút Tiền Khi Quá Hạn (${timerDisplay})`, `Auto-Refund Unlocks in ${timerDisplay}`)}
                    </span>
                  </ShimmerButton>

                  <div className="pt-2.5 border-t border-white/[0.12] space-y-2">
                    <button
                      type="button"
                      onClick={() =>
                        executePactWrite(
                          t("Đồng Thuận Hủy Kèo & Hoàn Tiền", "Sign Mutual Cancel & Refund"),
                          "mutualCancelEscrow",
                          [pactId]
                        )
                      }
                      className="w-full py-2.5 px-4 rounded-full bg-white/[0.1] hover:bg-white/[0.16] border border-white/[0.2] text-xs font-semibold text-white transition-colors"
                    >
                      {t("Đồng Thuận Hủy Kèo (2 bên cùng ký)", "Mutual Cancellation (Both sign)")}
                    </button>
                    <div className="flex justify-between text-xs text-sky-100/75 px-2">
                      <span>Buyer: <strong className={buyerCancelApproved ? "text-emerald-300" : "text-sky-200/60"}>{buyerCancelApproved ? "Đã ký ✓" : "Chưa ký"}</strong></span>
                      <span>Seller: <strong className={sellerCancelApproved ? "text-emerald-300" : "text-sky-200/60"}>{sellerCancelApproved ? "Đã ký ✓" : "Chưa ký"}</strong></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDisputeModal(true)}
                    className="w-full py-2.5 px-4 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-xs font-semibold text-rose-200 flex items-center justify-center gap-2 transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                    <span>{t("Kích Hoạt Khiếu Nại Tranh Chấp", "Raise Dispute (Freeze Auto-Refund)")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenCSKH}
                    className="w-full py-2.5 px-4 rounded-full bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/40 text-xs font-semibold text-amber-100 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span>{t("Yêu Cầu Trọng Tài / CSKH Hỗ Trợ 24/7", "Escalate to 24/7 Dispute Desk")}</span>
                  </button>
                </div>
              )}

              {/* 2. BROKER & ADMIN ACTIONS */}
              {isBroker && (statusNumber === 0 || statusNumber === 3) && (
                <div className="space-y-3 pt-1">
                  {isAdmin && (
                    <div className="p-3 rounded-2xl bg-purple-400/20 border border-purple-300/40 text-xs text-purple-100 flex items-center gap-2 font-medium">
                      <Shield className="w-4 h-4 text-purple-200 shrink-0" />
                      <span>{t("Quyền Admin: Duyệt giải ngân, hoàn tiền hoặc phạt cọc GDTG vi phạm.", "Admin Authority Active.")}</span>
                    </div>
                  )}

                  <ShimmerButton
                    type="button"
                    disabled={statusNumber === 0 && Boolean(brokerApprovedRelease) && !isAdmin}
                    onClick={() =>
                      executePactWrite(
                        t("GDTG Xác Nhận Hàng Chuẩn & Duyệt Giải Ngân", "Broker Confirms & Approves Release"),
                        "brokerRelease",
                        [pactId]
                      )
                    }
                    variant="success"
                    className="w-full py-3.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {statusNumber === 0 && brokerApprovedRelease && !buyerApprovedRelease
                        ? t("GDTG Đã Duyệt ✓ (Đang Chờ Bên Mua Xác Nhận)", "Broker Approved ✓ (Waiting for Buyer)")
                        : buyerApprovedRelease || statusNumber === 3 || isAdmin
                        ? t(`Duyệt Bước Cuối & Giải Ngân Ngay (${netSellerReceives} USDC)`, `Final Release To Seller (${netSellerReceives} USDC)`)
                        : t(`GDTG Duyệt Hàng Chuẩn (Bước 1/2 · ${netSellerReceives} USDC)`, `Broker Approve Step 1/2 (${netSellerReceives} USDC)`)}
                    </span>
                  </ShimmerButton>

                  <ShimmerButton
                    type="button"
                    onClick={() =>
                      executePactWrite(
                        t("GDTG Hoàn Tiền 100% Cho Buyer", "Broker Refunds 100% To Buyer"),
                        "brokerRefundBuyer",
                        [pactId]
                      )
                    }
                    variant="danger"
                    className="w-full py-2.5 text-xs font-bold"
                  >
                    <span>{t(`Bác Bỏ & Hoàn 100% Cho Buyer (${dealAmountNum} USDC)`, `Reject & Refund 100% (${dealAmountNum} USDC)`)}</span>
                  </ShimmerButton>

                  <div className="pt-2 border-t border-white/[0.12]">
                    <button
                      type="button"
                      onClick={() => setShowSplitModal(!showSplitModal)}
                      className="w-full py-2.5 px-4 rounded-full bg-white/[0.1] hover:bg-white/[0.16] border border-white/[0.2] text-xs font-semibold text-amber-200 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Scale className="w-4 h-4" />
                      <span>{showSplitModal ? t("Đóng Hòa Giải Chia Tiền", "Close Split Settlement") : t("Hòa Giải Phân Chia Tỷ Lệ", "Split Settlement")}</span>
                    </button>

                    {showSplitModal && (
                      <div className="mt-3 p-4 rounded-2xl card-inner space-y-3">
                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          <div>
                            <label className="text-sky-100/80 block mb-1">Hoàn Buyer (USDC)</label>
                            <input
                              type="number"
                              value={refundToBuyerInput}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setRefundToBuyerInput(e.target.value);
                                setPayoutToSellerInput(Math.max(0, dealAmountNum - val).toString());
                              }}
                              className="input-field py-2 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-sky-100/80 block mb-1">Trả Seller (USDC)</label>
                            <input
                              type="number"
                              value={payoutToSellerInput}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setPayoutToSellerInput(e.target.value);
                                setRefundToBuyerInput(Math.max(0, dealAmountNum - val).toString());
                              }}
                              className="input-field py-2 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const refBig = parseUsdc(refundToBuyerInput);
                            const payBig = parseUsdc(payoutToSellerInput);
                            executePactWrite(
                              t("Ký Lệnh Hòa Giải Phân Chia", "Execute Split Settlement"),
                              "brokerSettle",
                              [pactId, refBig, payBig]
                            );
                          }}
                          className="w-full py-2.5 rounded-full bg-amber-300 hover:bg-amber-200 text-slate-950 font-bold text-xs transition-colors"
                        >
                          {t("Xác Nhận Phân Chia Hòa Giải", "Confirm Split Settlement")}
                        </button>
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="pt-2 border-t border-white/[0.12]">
                      <ShimmerButton
                        type="button"
                        variant="danger"
                        onClick={() =>
                          executePactWrite(
                            t("Admin Phán Quyết: Phạt Cọc Broker & Đền 100% Cho Buyer", "Admin Slash Corrupt Broker"),
                            "adminSlashCorruptBroker",
                            [pactId, escrowItem.amount]
                          )
                        }
                        className="w-full py-2.5 text-xs font-bold"
                      >
                        <Gavel className="w-4 h-4" />
                        <span>{t("Tịch Thu Cọc Broker Vi Phạm", "Slash Corrupt Broker")}</span>
                      </ShimmerButton>
                    </div>
                  )}
                </div>
              )}

              {/* 3. SELLER ACTIONS */}
              {isSeller && statusNumber === 0 && (
                <div className="space-y-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleQuickReply(t("Bên Bán nhắc: Tôi đã hoàn tất giao hàng, mời Bên Mua và GDTG kiểm tra duyệt giải ngân.", "Seller: Delivered, please verify and release funds."))}
                    className="w-full py-3 px-4 rounded-full bg-sky-400/25 hover:bg-sky-400/35 border border-sky-300/40 text-xs font-semibold text-white transition-colors"
                  >
                    {t("Gửi Thông Báo Nhắc Duyệt Giải Ngân", "Remind Buyer & Broker to Release")}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      executePactWrite(
                        t("Seller Đồng Ý Hủy Kèo & Hoàn Tiền", "Seller Signs Mutual Cancellation"),
                        "mutualCancelEscrow",
                        [pactId]
                      )
                    }
                    className="w-full py-2.5 px-4 rounded-full bg-white/[0.1] hover:bg-white/[0.16] border border-white/[0.2] text-xs font-medium text-white transition-colors"
                  >
                    {t("Đồng Thuận Hủy Kèo & Hoàn Tiền Cho Buyer", "Agree to Cancel & Refund Buyer")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDisputeModal(true)}
                    className="w-full py-2.5 px-4 rounded-full bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-xs font-semibold text-rose-200 flex items-center justify-center gap-2 transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                    <span>{t("Khiếu Nại Lên GDTG (Đóng Băng Hạn Rút Tiền)", "Raise Dispute (Freeze Timeout)")}</span>
                  </button>
                </div>
              )}

              {/* 4. DISPUTE ACTIVE BANNER */}
              {statusNumber === 3 && (
                <div className="p-4 rounded-2xl bg-rose-500/20 border border-rose-400/50 text-xs space-y-2 text-rose-100">
                  <div className="flex items-center gap-2 font-bold text-rose-200 text-sm">
                    <AlertTriangle className="w-4 h-4 text-rose-300" />
                    <span>{t("Hợp Đồng Đang Khiếu Nại Tranh Chấp", "Escrow Under Dispute")}</span>
                  </div>
                  <p>
                    {t(
                      "Lệnh tự động rút tiền quá hạn đã được Smart Contract đóng băng nhằm bảo vệ Người Bán và Người Mua. GDTG bảo chứng hoặc Admin tối cao đang phân xử giải ngân hoặc hoàn trả sau khi đối soát bằng chứng.",
                      "Smart contract has frozen automatic timeout refunds to protect both parties. Staked Broker or Admin mediator is reviewing the dispute."
                    )}
                  </p>
                </div>
              )}

              {/* 5. COMPLETED / CANCELLED RECEIPT */}
              {(statusNumber === 1 || statusNumber === 2) && (
                <div className="p-4 rounded-2xl bg-emerald-400/15 border border-emerald-300/35 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>
                      {statusNumber === 1
                        ? t("Hợp đồng đã giải ngân hoàn tất!", "Pact disbursed successfully!")
                        : t("Hợp đồng đã hủy & hoàn trả 100% tiền gốc!", "Pact cancelled & 100% refunded!")}
                    </span>
                  </div>
                  <p className="text-sky-50/90 leading-relaxed">
                    {t(
                      "Biên bản quyết toán đã được ghi nhận bất biến trên sổ cái Avalanche Fuji C-Chain.",
                      "Settlement permanently recorded on Avalanche Fuji C-Chain."
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DISPUTE MODAL */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md card p-6 space-y-4 border border-rose-400/40">
            <div className="flex items-center gap-2.5 text-rose-300">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-white text-base">Kích Hoạt Khiếu Nại Tranh Chấp</h3>
            </div>
            <p className="text-xs text-sky-100/80">
              Hành động này sẽ ghi nhận trạng thái Tranh Chấp (Disputed) lên Smart Contract UniversalEscrow và đóng băng cơ chế tự động rút tiền quá hạn để bảo vệ quyền lợi hai bên.
            </p>
            <textarea
              value={disputeReasonInput}
              onChange={(e) => setDisputeReasonInput(e.target.value)}
              rows={3}
              className="w-full input-field text-xs p-3 rounded-xl"
              placeholder="Nhập lý do khiếu nại tranh chấp..."
            />
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 py-2.5 rounded-full border border-white/20 hover:bg-white/10 text-white text-xs font-semibold"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleRaiseDispute}
                className="flex-1 py-2.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-lg"
              >
                Xác Nhận Khiếu Nại
              </button>
            </div>
          </div>
        </div>
      )}

      <TransactionFeedback
        status={txStatus}
        onClose={() => setTxStatus({ step: "idle" })}
      />
    </div>
  );
}
