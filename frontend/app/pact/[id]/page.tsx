"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import {
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ShieldCheck,
  Send,
  ExternalLink,
  Scale,
  RefreshCw,
  Clock,
  Check,
  Shield,
  Gavel,
  FileCheck2,
  Activity,
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

function getInitials(name: string): string {
  const clean = name.split("(")[0].trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function EscrowPactRoomPage() {
  const params = useParams();
  const rawId = params?.id ? String(params.id) : "101";
  const pactId = BigInt(rawId.replace(/[^0-9]/g, "") || "101");

  const { address } = useAccount();
  const { currentUser } = useAuth();
  const { t } = useLanguage();
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
      notes: "Đã bàn giao đầy đủ quyền sở hữu tài sản cho Bên mua qua kênh bảo mật.",
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

  // Server DB & Local pact data
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
  const escrowItem: EscrowStruct =
    escrowData && (escrowData as any).amount > 0n
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

  const statusNumber =
    simulatedStatusOverride !== null ? simulatedStatusOverride : Number(escrowItem.status);
  const deadline = Number(escrowItem.startTime + escrowItem.duration);
  const remainingSeconds = Math.max(0, deadline - currentTime);
  const isTimeExpired = Boolean(isExpiredFromContract) || remainingSeconds === 0;

  const hoursLeft = Math.floor(remainingSeconds / 3600);
  const minsLeft = Math.floor((remainingSeconds % 3600) / 60);
  const secsLeft = remainingSeconds % 60;
  const timerDisplay = `${hoursLeft.toString().padStart(2, "0")}:${minsLeft
    .toString()
    .padStart(2, "0")}:${secsLeft.toString().padStart(2, "0")}`;

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
  const isSeller =
    !isAdmin && (userRole === "SELLER" || connectedLower === escrowItem.seller.toLowerCase());
  const isBroker =
    isAdmin || userRole === "BROKER" || connectedLower === escrowItem.broker.toLowerCase();
  const isBuyer =
    !isAdmin &&
    !isSeller &&
    (userRole === "BUYER" || connectedLower === escrowItem.buyer.toLowerCase() || !isBroker);

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
  const [disputeReasonInput, setDisputeReasonInput] = useState(
    "Đối tác chưa hoàn thành đúng nghĩa vụ bàn giao theo cam kết, đề nghị GDTG kiểm định và phân xử."
  );

  const handleRaiseDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowDisputeModal(false);
    await executePactWrite(
      "Gửi khiếu nại tranh chấp (Đóng băng hạn hoàn tiền)",
      "raiseDispute",
      [pactId, disputeReasonInput.trim()]
    );
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
        if (
          handoverJson.success &&
          handoverJson.handover &&
          handoverJson.handover.isHandedOver
        ) {
          setHandoverData(handoverJson.handover);
        }

        const pactJson = await pactRes.json();
        if (pactJson.success && pactJson.pact) {
          setServerPactData(pactJson.pact);
          if (simulatedStatusOverride === null && pactJson.pact.status !== 0) {
            setSimulatedStatusOverride(pactJson.pact.status);
          }
        }
      } catch {}
    };

    fetchChatAndHandover();
    const interval = setInterval(fetchChatAndHandover, 2500);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [pactId, simulatedStatusOverride]);

  const getActiveSenderName = () => {
    if (isAdmin) return "Quản trị viên hệ thống";
    if (isBroker) return "Nguyễn Nam (GDTG)";
    if (isSeller) return "Hoàng Minh (Bên bán)";
    return "Lê Minh Tuấn (Bên mua)";
  };

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
    const senderName = getActiveSenderName();

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
    } catch {}
  };

  const handleQuickReply = async (text: string) => {
    const role: "buyer" | "seller" | "broker" | "admin" = isAdmin
      ? "admin"
      : isBroker
      ? "broker"
      : isSeller
      ? "seller"
      : "buyer";
    const senderName = getActiveSenderName();

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
    } catch {}
  };

  const handleSellerConfirmHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    const proofUrl = sellerProofInput.trim() || "https://testnet.snowtrace.io";
    const notes =
      sellerNotesInput.trim() ||
      "Bên bán xác nhận đã bàn giao đầy đủ tài sản theo điều khoản hợp đồng.";
    const timeStr = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const localHandover = {
      assetTitle: "Bàn giao tài sản số & tài khoản OTC",
      proofUrl,
      notes,
      isHandedOver: true,
      handedOverAt: timeStr,
    };
    setHandoverData(localHandover);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(`trustpact_handover_${pactId}`, JSON.stringify(localHandover));
      } catch {}
    }

    try {
      const res = await fetch(`/api/pacts/${pactId}/handover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetTitle: "Bàn giao tài sản số & tài khoản OTC",
          proofUrl,
          notes,
          senderName: "Hoàng Minh (Bên bán)",
          senderAddress: escrowItem.seller,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.handover) setHandoverData(data.handover);
        if (data.message) setMessages((prev) => [...prev, data.message]);
      }
    } catch {}
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
        (functionName === "brokerRelease" &&
          (addrLower === escrowItem.broker.toLowerCase() || isCallerAdmin)) ||
        (functionName === "brokerRefundBuyer" &&
          (addrLower === escrowItem.broker.toLowerCase() || isCallerAdmin)) ||
        (functionName === "brokerSettle" &&
          (addrLower === escrowItem.broker.toLowerCase() || isCallerAdmin)) ||
        (functionName === "buyerClaimExpiredRefund" &&
          addrLower === escrowItem.buyer.toLowerCase()) ||
        (functionName === "mutualCancelEscrow" &&
          (addrLower === escrowItem.buyer.toLowerCase() ||
            addrLower === escrowItem.seller.toLowerCase())) ||
        (functionName === "raiseDispute" &&
          (addrLower === escrowItem.buyer.toLowerCase() ||
            addrLower === escrowItem.seller.toLowerCase() ||
            addrLower === escrowItem.broker.toLowerCase() ||
            isCallerAdmin)) ||
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

        setTxStatus({
          step: "success",
          txHash: hash,
          actionTitle: `${actionTitle} (${finalityMs}ms Snowman Finality)`,
        });

        const buyerSignedNow =
          functionName === "buyerConfirmDelivery" || Boolean(buyerApprovedRelease);
        const brokerSignedNow =
          functionName === "brokerRelease" || Boolean(brokerApprovedRelease);
        const isFullRelease =
          functionName === "brokerSettle" ||
          (statusNumber === 3 &&
            (functionName === "brokerRelease" || functionName === "buyerConfirmDelivery")) ||
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
            ? " (Bước 1/2: Bên mua đã xác nhận nhận hàng, chờ GDTG xác nhận)"
            : !isFullRelease && functionName === "brokerRelease"
            ? " (Bước 1/2: GDTG đã xác nhận kiểm định, chờ Bên mua xác nhận)"
            : isFullRelease
            ? " (Đủ 2/2 xác nhận, đã giải ngân tự động về ví Bên bán)"
            : "";

        await fetch(`/api/pacts/${pactId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: CONTRACT_ADDRESSES.universalEscrow,
            role: "system",
            senderName: "UniversalEscrow Protocol",
            text: `Giao dịch On-Chain hoàn tất trên Avalanche Fuji (${finalityMs}ms).${stepNote} Mã Tx: ${hash}`,
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

    const requiredWalletHint =
      functionName === "buyerConfirmDelivery" || functionName === "buyerClaimExpiredRefund"
        ? `Ví Bên mua (${shortenAddress(escrowItem.buyer)})`
        : functionName === "brokerRelease" ||
          functionName === "brokerRefundBuyer" ||
          functionName === "brokerSettle"
        ? `Ví GDTG (${shortenAddress(escrowItem.broker)}) hoặc Quản trị viên`
        : `Ví hợp lệ trong hợp đồng (#${pactId.toString()})`;

    setTxStatus({
      step: "error",
      actionTitle,
      errorMessage: !address
        ? `Vui lòng kết nối ví Web3 mạng Avalanche Fuji (${requiredWalletHint}) để ký giao dịch trên Smart Contract.`
        : `Ví đang kết nối (${shortenAddress(address)}) không khớp với quyền thực thi trên hợp đồng. Yêu cầu: ${requiredWalletHint}.`,
    });
  };

  const confirmedCount =
    statusNumber === 1
      ? 2
      : (buyerApprovedRelease ? 1 : 0) + (brokerApprovedRelease ? 1 : 0);

  return (
    <div className="space-y-5 animate-fade-in" suppressHydrationWarning>
      {/* ── COMPACT BANKING HEADER BAR & 4-STEP PROGRESS ──────────────────── */}
      <section className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                href="/pact"
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors mr-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Danh sách</span>
              </Link>

              <h1 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight">
                {t("Hợp đồng ký quỹ", "Escrow Contract")}{" "}
                <span className="font-mono">#{escrowItem.id.toString()}</span>
              </h1>

              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold ${
                  statusNumber === 0
                    ? "bg-amber-500/10 border-amber-500/25 text-amber-400"
                    : statusNumber === 1
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400"
                    : statusNumber === 3
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-slate-800 border-slate-700 text-slate-300"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    statusNumber === 0
                      ? "bg-amber-400 animate-pulse"
                      : statusNumber === 1
                      ? "bg-emerald-400"
                      : statusNumber === 3
                      ? "bg-red-400 animate-pulse"
                      : "bg-slate-400"
                  }`}
                />
                <span>
                  {statusNumber === 0
                    ? t("Đang ký quỹ", "Escrowed")
                    : statusNumber === 1
                    ? t("Đã tất toán", "Settled")
                    : statusNumber === 3
                    ? t("Đang tranh chấp", "Disputed")
                    : t("Đã hoàn tiền", "Refunded")}
                </span>
              </span>

              <span className="text-xs font-mono text-slate-400 bg-[#0B0F17] px-2.5 py-1 rounded-md border border-slate-800">
                Fuji #43113
              </span>
            </div>
          </div>

          {/* Countdown, Snowtrace & Refresh Controls */}
          <div className="flex items-center gap-2 text-xs shrink-0 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0B0F17] border border-slate-800">
              <Clock
                className={`w-3.5 h-3.5 ${isTimeExpired ? "text-red-400" : "text-amber-400"}`}
              />
              <span className="text-slate-400">{t("Thời hạn:", "Remaining:")}</span>
              {isTimeExpired ? (
                <span className="font-semibold text-red-400">{t("Đã quá hạn", "Expired")}</span>
              ) : (
                <span className="font-bold font-mono text-slate-100 tabular-nums">
                  {timerDisplay}
                </span>
              )}
            </div>

            <a
              href={`https://testnet.snowtrace.io/address/${CONTRACT_ADDRESSES.universalEscrow}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-200 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 inline-flex items-center gap-1.5 font-medium transition-colors"
            >
              <span>Snowtrace</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            <button
              type="button"
              onClick={() => {
                refetchEscrow();
                refetchExpired();
                refetchBuyerCancel();
                refetchSellerCancel();
                refetchBuyerApproved();
                refetchBrokerApproved();
              }}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-slate-100 transition-colors"
              title="Làm mới dữ liệu hợp đồng"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── HORIZONTAL 4-STEP PROGRESS BAR ────────────────────────────── */}
        <div className="pt-4 border-t border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {[
            {
              num: "1",
              title: t("1. Ký quỹ", "1. Escrow"),
              desc: `${formatUsdc(escrowItem.amount)} USDC`,
              isDone: true,
              isActive: false,
            },
            {
              num: "2",
              title: t("2. Bàn giao", "2. Handover"),
              desc: handoverData.isHandedOver
                ? t("Đã bàn giao", "Delivered")
                : t("Chờ bàn giao", "Pending"),
              isDone: handoverData.isHandedOver,
              isActive: !handoverData.isHandedOver && statusNumber === 0,
            },
            {
              num: "3",
              title: t("3. Nghiệm thu", "3. Inspection"),
              desc:
                statusNumber === 1
                  ? t("Đã nghiệm thu", "Verified")
                  : `${confirmedCount}/2 xác nhận`,
              isDone: statusNumber === 1,
              isActive: handoverData.isHandedOver && (statusNumber === 0 || statusNumber === 3),
            },
            {
              num: "4",
              title: t("4. Tất toán", "4. Settlement"),
              desc:
                statusNumber === 1
                  ? t("Đã giải ngân", "Disbursed")
                  : statusNumber === 2
                  ? t("Đã hoàn tiền", "Refunded")
                  : statusNumber === 3
                  ? t("Đang phân xử", "In Arbitration")
                  : t("Chờ hoàn tất", "Pending"),
              isDone: statusNumber === 1 || statusNumber === 2,
              isActive: false,
            },
          ].map((st) => (
            <div
              key={st.num}
              className={`p-3 rounded-lg border flex items-center gap-3 ${
                st.isDone
                  ? "bg-emerald-500/5 border-emerald-500/30"
                  : st.isActive
                  ? "bg-blue-500/10 border-blue-500/40"
                  : "bg-[#0B0F17] border-slate-800/80"
              }`}
            >
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center font-mono text-xs font-bold shrink-0 border ${
                  st.isDone
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : st.isActive
                    ? "bg-blue-600 text-white border-blue-500"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {st.isDone ? <Check className="w-3.5 h-3.5" /> : st.num}
              </div>
              <div className="min-w-0">
                <span className="font-semibold text-xs text-slate-100 block truncate">
                  {st.title}
                </span>
                <span
                  className={`text-[11px] font-mono block truncate ${
                    st.isDone
                      ? "text-emerald-400"
                      : st.isActive
                      ? "text-blue-400"
                      : "text-slate-400"
                  }`}
                >
                  {st.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COMPACT 3-PARTY STRIP WITH MONOGRAM BADGES ────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bên mua */}
        <div
          className={`bg-[#111827] border rounded-xl p-4 space-y-3 ${
            isBuyer ? "border-blue-500/50" : "border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {t("Bên mua", "Buyer")}
            </span>
            {isBuyer && (
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/25 text-[11px] font-semibold">
                {t("Vai trò của bạn", "Your Role")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
              {getInitials("Lê Minh Tuấn")}
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-sm text-slate-100 block truncate">
                Lê Minh Tuấn
              </span>
              <span className="text-slate-400 font-mono text-xs block">
                {shortenAddress(escrowItem.buyer)}
              </span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Đã ký quỹ</span>
            <span className="text-slate-100 font-mono font-semibold tabular-nums">
              {formatUsdc(escrowItem.amount)} USDC
            </span>
          </div>
        </div>

        {/* GDTG bảo chứng */}
        <div
          className={`bg-[#111827] border rounded-xl p-4 space-y-3 ${
            isBroker && !isAdmin ? "border-amber-500/50" : "border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {t("GDTG bảo chứng", "Escrow Broker")}
            </span>
            {isBroker && !isAdmin && (
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/25 text-[11px] font-semibold">
                {t("Vai trò của bạn", "Your Role")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
              {getInitials("Nguyễn Nam")}
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-sm text-slate-100 block truncate">
                Nguyễn Nam
              </span>
              <span className="text-slate-400 font-mono text-xs block">
                {shortenAddress(escrowItem.broker)}
              </span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">
              Phí GDTG ({(Number(escrowItem.brokerFeeBps) / 100).toFixed(2)}%)
            </span>
            <span className="text-amber-400 font-mono font-semibold tabular-nums">
              {brokerFeeNum.toFixed(2)} USDC
            </span>
          </div>
        </div>

        {/* Bên bán */}
        <div
          className={`bg-[#111827] border rounded-xl p-4 space-y-3 ${
            isSeller ? "border-emerald-500/50" : "border-slate-800"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              {t("Bên bán", "Seller")}
            </span>
            {isSeller && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[11px] font-semibold">
                {t("Vai trò của bạn", "Your Role")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
              {getInitials("Hoàng Minh")}
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-sm text-slate-100 block truncate">
                Hoàng Minh
              </span>
              <span className="text-slate-400 font-mono text-xs block">
                {shortenAddress(escrowItem.seller)}
              </span>
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Thực nhận Bên bán</span>
            <span className="text-emerald-400 font-mono font-semibold tabular-nums">
              {netSellerReceives.toFixed(2)} USDC
            </span>
          </div>
        </div>
      </section>

      {/* ── MAIN WORKSPACE: 2 COLUMNS (LEFT 7 COLS · RIGHT 5 COLS) ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN (7 COLS): HANDOVER PROOF & AUDIT LOG ──────────── */}
        <div className="lg:col-span-7 space-y-5">
          {/* Handover Proof Panel */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 gap-2 flex-wrap">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0B0F17] border border-slate-800 flex items-center justify-center text-emerald-400">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-100">
                  {t("Hồ sơ bàn giao tài sản", "Handover Proof & Delivery Status")}
                </h2>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-xs font-semibold ${
                  handoverData.isHandedOver
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                }`}
              >
                {handoverData.isHandedOver && <Check className="w-3 h-3" />}
                <span>
                  {handoverData.isHandedOver
                    ? t("Đã bàn giao", "Delivered")
                    : t("Chờ bàn giao", "Pending")}
                </span>
              </span>
            </div>

            <div className="bg-[#0B0F17] border border-slate-800/80 rounded-lg p-4 space-y-2.5">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider block">
                {t("Điều khoản thỏa thuận", "Agreed Terms")}
              </span>
              <p className="text-sm text-slate-200 leading-relaxed">
                {localPactData?.terms ||
                  t(
                    "Bên bán bàn giao tài sản số và quyền sở hữu trong vòng 24 giờ. GDTG kiểm định trước khi xác nhận giải ngân.",
                    "Seller delivers digital assets within 24 hours. Broker audits before release."
                  )}
              </p>
              {handoverData.proofUrl && (
                <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2 text-xs flex-wrap">
                  <span className="text-slate-400">{t("Chứng từ bàn giao:", "Proof URL:")}</span>
                  <a
                    href={handoverData.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 font-mono inline-flex items-center gap-1 font-medium"
                  >
                    <span>{handoverData.proofUrl.slice(0, 42)}...</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {isSeller && !handoverData.isHandedOver && statusNumber === 0 && (
              <form
                onSubmit={handleSellerConfirmHandover}
                className="bg-[#0B0F17] border border-emerald-500/30 rounded-lg p-4 space-y-3"
              >
                <span className="text-xs font-semibold text-emerald-400 block">
                  {t("Bên bán: Xác nhận hoàn tất bàn giao", "Seller: Confirm asset handover")}
                </span>
                <input
                  type="text"
                  value={sellerProofInput}
                  onChange={(e) => setSellerProofInput(e.target.value)}
                  placeholder={t(
                    "Nhập liên kết chứng từ bàn giao / TxHash...",
                    "Enter proof URL / TxHash..."
                  )}
                  className="w-full rounded-lg bg-[#111827] border border-slate-700 focus:border-blue-500 focus:outline-none px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-500"
                />
                <input
                  type="text"
                  value={sellerNotesInput}
                  onChange={(e) => setSellerNotesInput(e.target.value)}
                  placeholder={t("Ghi chú bàn giao (tùy chọn)...", "Handover notes (optional)...")}
                  className="w-full rounded-lg bg-[#111827] border border-slate-700 focus:border-blue-500 focus:outline-none px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500"
                />
                <ShimmerButton type="submit" variant="success" className="w-full py-2 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t("Xác nhận đã bàn giao", "Confirm Handover")}</span>
                </ShimmerButton>
              </form>
            )}
          </div>

          {/* Audit Log / Messaging Panel */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#0B0F17] border border-slate-800 flex items-center justify-center text-blue-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-100">
                  {t("Nhật ký đối soát & Trao đổi", "Audit Log & Counterparty Messages")}
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400">Đồng bộ trực tuyến</span>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 bg-[#0B0F17] border border-slate-800/80 rounded-lg">
                  Chưa có bản ghi trao đổi nào trong hợp đồng này.
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-lg border text-xs space-y-1.5 ${
                      m.role === "system"
                        ? "bg-blue-500/5 border-blue-500/25"
                        : "bg-[#0B0F17] border-slate-800/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                            m.role === "system"
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/25"
                              : m.role === "admin"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/25"
                              : m.role === "broker"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/25"
                              : m.role === "buyer"
                              ? "bg-slate-800 text-slate-200 border-slate-700"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                          }`}
                        >
                          {m.role === "system"
                            ? "Hệ thống"
                            : m.role === "admin"
                            ? "Quản trị"
                            : m.role === "broker"
                            ? "GDTG"
                            : m.role === "buyer"
                            ? "Bên mua"
                            : "Bên bán"}
                        </span>
                        <span className="text-slate-200 font-semibold">{m.senderName}</span>
                      </div>
                      <span className="text-slate-500 font-mono tabular-nums">{m.timestamp}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-[13px]">{m.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Concise Quick-Reply Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400 mr-1">
                {t("Mẫu tin:", "Quick note:")}
              </span>
              {[
                t("Đã kiểm tra và nhận đủ tài sản", "Verified and received assets"),
                t("Đã bàn giao tài sản theo thỏa thuận", "Assets delivered per agreement"),
                t("GDTG đang kiểm định chứng từ", "Broker verifying handover proof"),
              ].map((txt) => (
                <button
                  key={txt}
                  type="button"
                  onClick={() => handleQuickReply(txt)}
                  className="px-2.5 py-1 rounded-md bg-[#0B0F17] hover:bg-slate-800 text-xs text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  {txt}
                </button>
              ))}
            </div>

            {/* Clean Input Bar */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-1">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder={t(
                  "Nhập nội dung đối soát hoặc đường dẫn chứng từ...",
                  "Enter audit message or proof link..."
                )}
                className="flex-1 rounded-lg bg-[#0B0F17] border border-slate-700 focus:border-blue-500 focus:outline-none px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500"
              />
              <ShimmerButton
                type="submit"
                disabled={!newMessageText.trim()}
                variant="primary"
                className="px-4 py-2 shrink-0 text-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t("Gửi", "Send")}</span>
              </ShimmerButton>
            </form>
          </div>
        </div>

        {/* ── RIGHT COLUMN (5 COLS): BẢNG QUYẾT TOÁN HỢP ĐỒNG ───────────── */}
        <div className="lg:col-span-5 sticky top-24 space-y-5">
          <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0B0F17]/50">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  {t("Bảng quyết toán hợp đồng", "Contract Settlement")}
                </h3>
                <span className="text-xs text-slate-400">
                  Đối soát tài chính &amp; thực thi lệnh On-Chain
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <Lock className="w-4 h-4" />
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Financial Summary */}
              <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/80 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>{t("Giá trị ký quỹ", "Escrow Amount")}</span>
                  <span className="text-slate-100 font-mono font-semibold tabular-nums text-sm">
                    {dealAmountNum.toFixed(2)} USDC
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>{t("Phí GDTG", "Broker Fee")}</span>
                  <span className="text-amber-400 font-mono tabular-nums">
                    - {brokerFeeNum.toFixed(2)} USDC
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>{t("Phí giao thức (0.3%)", "Protocol Fee (0.3%)")}</span>
                  <span className="text-slate-300 font-mono tabular-nums">
                    - {protocolFeeNum.toFixed(2)} USDC
                  </span>
                </div>
                <div className="pt-2.5 border-t border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-slate-100 text-sm">
                    {t("Thực nhận Bên bán", "Net Seller Payout")}
                  </span>
                  <span className="font-bold font-mono text-base text-emerald-400 tabular-nums">
                    {netSellerReceives.toFixed(2)} USDC
                  </span>
                </div>
              </div>

              {/* 2-of-2 Dual-Consent Tracker */}
              <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    <span>{t("Đồng thuận giải ngân (2/2)", "Dual-Consent Release (2/2)")}</span>
                  </span>
                  <span className="font-mono text-xs text-slate-300 tabular-nums">
                    {confirmedCount}/2 {t("xác nhận", "confirmed")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div
                    className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                      buyerApprovedRelease || statusNumber === 1
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-[#111827] border-slate-800 text-slate-400"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        buyerApprovedRelease || statusNumber === 1
                          ? "text-emerald-400"
                          : "text-slate-600"
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-200 block truncate">
                        Bước 1: Bên mua
                      </span>
                      <span className="text-[11px] block truncate">
                        {buyerApprovedRelease || statusNumber === 1
                          ? "Đã xác nhận"
                          : "Chờ xác nhận"}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`p-2.5 rounded-lg border flex items-center gap-2 ${
                      brokerApprovedRelease || statusNumber === 1
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-[#111827] border-slate-800 text-slate-400"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        brokerApprovedRelease || statusNumber === 1
                          ? "text-emerald-400"
                          : "text-slate-600"
                      }`}
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-200 block truncate">
                        Bước 2: GDTG
                      </span>
                      <span className="text-[11px] block truncate">
                        {brokerApprovedRelease || statusNumber === 1
                          ? "Đã xác nhận"
                          : "Chờ kiểm định"}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {statusNumber === 3
                    ? "Hợp đồng đang tranh chấp: GDTG hoặc Quản trị viên thực hiện phân xử giải ngân, hoàn tiền 100% hoặc phân chia hòa giải."
                    : "Giải ngân tự động về ví Bên bán khi đủ 2/2 xác nhận. Nếu tài sản sai cam kết, GDTG thực hiện hoàn tiền 100% cho Bên mua."}
                </p>

                {lastFinalityMs !== null && (
                  <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-emerald-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      <span>Snowman Finality:</span>
                    </span>
                    <strong className="tabular-nums">{lastFinalityMs} ms</strong>
                  </div>
                )}
              </div>

              {/* Active Role Indicator */}
              <div className="px-3.5 py-2.5 rounded-lg bg-[#0B0F17] border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">{t("Vai trò thao tác:", "Active Role:")}</span>
                <span
                  className={`px-2 py-0.5 rounded font-semibold border text-[11px] ${
                    isAdmin
                      ? "bg-purple-500/10 text-purple-400 border-purple-500/25"
                      : isBuyer
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/25"
                      : isSeller
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                  }`}
                >
                  {isAdmin
                    ? t("Quản trị viên hệ thống", "System Admin")
                    : isBuyer
                    ? t("Bên mua", "Buyer")
                    : isSeller
                    ? t("Bên bán", "Seller")
                    : t("GDTG bảo chứng", "Broker")}
                </span>
              </div>

              {/* 1. BUYER ACTIONS */}
              {isBuyer && statusNumber === 0 && (
                <div className="space-y-2.5 pt-1">
                  <ShimmerButton
                    type="button"
                    disabled={Boolean(buyerApprovedRelease)}
                    onClick={() =>
                      executePactWrite(
                        t("Bên mua xác nhận nhận hàng", "Buyer Confirms Delivery"),
                        "buyerConfirmDelivery",
                        [pactId]
                      )
                    }
                    variant="success"
                    className="w-full py-2.5 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {buyerApprovedRelease
                        ? t("Đã xác nhận nhận hàng (1/2) · Chờ GDTG", "Confirmed (1/2) · Waiting for Broker")
                        : brokerApprovedRelease
                        ? t("Xác nhận & Giải ngân (2/2)", "Confirm & Release (2/2)")
                        : t("Xác nhận nhận hàng (1/2)", "Confirm Delivery (1/2)")}
                    </span>
                  </ShimmerButton>

                  <ShimmerButton
                    type="button"
                    onClick={() =>
                      executePactWrite(
                        t("Rút 100% tiền ký quỹ (Quá hạn)", "Claim 100% Timeout Refund"),
                        "buyerClaimExpiredRefund",
                        [pactId]
                      )
                    }
                    disabled={!isTimeExpired}
                    variant={isTimeExpired ? "danger" : "secondary"}
                    className="w-full py-2 text-xs"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {isTimeExpired
                        ? t("Hoàn tiền 100% khi quá hạn", "Claim 100% Timeout Refund")
                        : t(
                            `Mở khóa hoàn tiền quá hạn sau ${timerDisplay}`,
                            `Timeout refund unlocks in ${timerDisplay}`
                          )}
                    </span>
                  </ShimmerButton>

                  <div className="pt-2.5 border-t border-slate-800 space-y-2">
                    <button
                      type="button"
                      onClick={() =>
                        executePactWrite(
                          t("Đồng thuận hủy giao dịch", "Sign Mutual Cancellation"),
                          "mutualCancelEscrow",
                          [pactId]
                        )
                      }
                      className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
                    >
                      {t("Đồng thuận hủy giao dịch", "Mutual Cancellation")}
                    </button>
                    <div className="flex justify-between text-[11px] text-slate-400 px-1 font-mono">
                      <span>
                        Bên mua:{" "}
                        <strong className={buyerCancelApproved ? "text-emerald-400" : "text-slate-500"}>
                          {buyerCancelApproved ? "Đã ký" : "Chưa ký"}
                        </strong>
                      </span>
                      <span>
                        Bên bán:{" "}
                        <strong className={sellerCancelApproved ? "text-emerald-400" : "text-slate-500"}>
                          {sellerCancelApproved ? "Đã ký" : "Chưa ký"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDisputeModal(true)}
                    className="w-full py-2 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-medium text-red-400 flex items-center justify-center gap-2 transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{t("Gửi khiếu nại tranh chấp", "Raise Dispute")}</span>
                  </button>
                </div>
              )}

              {/* 2. BROKER & ADMIN ACTIONS */}
              {isBroker && (statusNumber === 0 || statusNumber === 3) && (
                <div className="space-y-2.5 pt-1">
                  {isAdmin && (
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/25 text-xs text-purple-300 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                      <span>
                        {t(
                          "Quyền Quản trị viên: Phân xử giải ngân, hoàn tiền hoặc khấu trừ thế chấp GDTG vi phạm.",
                          "System Admin Authority Active."
                        )}
                      </span>
                    </div>
                  )}

                  <ShimmerButton
                    type="button"
                    disabled={statusNumber === 0 && Boolean(brokerApprovedRelease) && !isAdmin}
                    onClick={() =>
                      executePactWrite(
                        t("GDTG xác nhận kiểm định & giải ngân", "Broker Confirms & Releases"),
                        "brokerRelease",
                        [pactId]
                      )
                    }
                    variant="success"
                    className="w-full py-2.5 text-sm"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {statusNumber === 0 && brokerApprovedRelease && !buyerApprovedRelease
                        ? t("GDTG đã xác nhận (1/2) · Chờ Bên mua", "Broker Confirmed (1/2) · Waiting for Buyer")
                        : buyerApprovedRelease || statusNumber === 3 || isAdmin
                        ? t("Xác nhận & Giải ngân (2/2)", "Confirm & Release (2/2)")
                        : t("GDTG xác nhận (1/2)", "Broker Confirm (1/2)")}
                    </span>
                  </ShimmerButton>

                  <ShimmerButton
                    type="button"
                    onClick={() =>
                      executePactWrite(
                        t("Hoàn tiền 100% cho Bên mua", "Refund 100% To Buyer"),
                        "brokerRefundBuyer",
                        [pactId]
                      )
                    }
                    variant="danger"
                    className="w-full py-2 text-xs"
                  >
                    <span>
                      {t(
                        `Hoàn tiền 100% cho Bên mua (${dealAmountNum.toFixed(2)} USDC)`,
                        `Refund 100% to Buyer (${dealAmountNum.toFixed(2)} USDC)`
                      )}
                    </span>
                  </ShimmerButton>

                  <div className="pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowSplitModal(!showSplitModal)}
                      className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Scale className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        {showSplitModal
                          ? t("Đóng bảng phân chia hòa giải", "Close Split Settlement")
                          : t("Phân chia hòa giải", "Split Settlement")}
                      </span>
                    </button>

                    {showSplitModal && (
                      <div className="mt-2.5 p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800 space-y-3">
                        <div className="grid grid-cols-2 gap-2.5 text-xs">
                          <div>
                            <label className="text-slate-400 block mb-1">
                              Hoàn Bên mua (USDC)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={refundToBuyerInput}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setRefundToBuyerInput(e.target.value);
                                setPayoutToSellerInput(
                                  Math.max(0, +(dealAmountNum - val).toFixed(2)).toString()
                                );
                              }}
                              className="w-full rounded-lg bg-[#111827] border border-slate-700 focus:border-blue-500 focus:outline-none px-3 py-1.5 text-xs font-mono text-slate-100 tabular-nums"
                            />
                          </div>
                          <div>
                            <label className="text-slate-400 block mb-1">
                              Trả Bên bán (USDC)
                            </label>
                            <input
                              type="number"
                              step="any"
                              value={payoutToSellerInput}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setPayoutToSellerInput(e.target.value);
                                setRefundToBuyerInput(
                                  Math.max(0, +(dealAmountNum - val).toFixed(2)).toString()
                                );
                              }}
                              className="w-full rounded-lg bg-[#111827] border border-slate-700 focus:border-blue-500 focus:outline-none px-3 py-1.5 text-xs font-mono text-slate-100 tabular-nums"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const refBig = parseUsdc(refundToBuyerInput);
                            const payBig = parseUsdc(payoutToSellerInput);
                            executePactWrite(
                              t("Thực thi phân chia hòa giải", "Execute Split Settlement"),
                              "brokerSettle",
                              [pactId, refBig, payBig]
                            );
                          }}
                          className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors"
                        >
                          {t("Xác nhận phân chia hòa giải", "Confirm Split Settlement")}
                        </button>
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="pt-2 border-t border-slate-800">
                      <ShimmerButton
                        type="button"
                        variant="danger"
                        onClick={() =>
                          executePactWrite(
                            t(
                              "Khấu trừ thế chấp GDTG vi phạm & bồi hoàn Bên mua",
                              "Slash Corrupt Broker Collateral"
                            ),
                            "adminSlashCorruptBroker",
                            [pactId, escrowItem.amount]
                          )
                        }
                        className="w-full py-2 text-xs"
                      >
                        <Gavel className="w-3.5 h-3.5" />
                        <span>
                          {t("Khấu trừ thế chấp GDTG vi phạm", "Slash Broker Collateral")}
                        </span>
                      </ShimmerButton>
                    </div>
                  )}
                </div>
              )}

              {/* 3. SELLER ACTIONS */}
              {isSeller && statusNumber === 0 && (
                <div className="space-y-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      handleQuickReply(
                        t(
                          "Bên bán thông báo: Đã hoàn tất bàn giao tài sản, đề nghị Bên mua và GDTG nghiệm thu giải ngân.",
                          "Seller: Assets delivered, please inspect and confirm release."
                        )
                      )
                    }
                    className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 border border-blue-500/30 text-xs font-semibold text-white transition-colors"
                  >
                    {t("Đề nghị nghiệm thu & giải ngân", "Request Inspection & Release")}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      executePactWrite(
                        t("Đồng thuận hủy giao dịch", "Seller Signs Mutual Cancellation"),
                        "mutualCancelEscrow",
                        [pactId]
                      )
                    }
                    className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
                  >
                    {t("Đồng thuận hủy giao dịch", "Mutual Cancellation")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDisputeModal(true)}
                    className="w-full py-2 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-xs font-medium text-red-400 flex items-center justify-center gap-2 transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>{t("Gửi khiếu nại tranh chấp", "Raise Dispute")}</span>
                  </button>
                </div>
              )}

              {/* 4. DISPUTE ACTIVE BANNER */}
              {statusNumber === 3 && (
                <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs space-y-1.5 text-slate-200">
                  <div className="flex items-center gap-2 font-semibold text-red-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{t("Hợp đồng đang trong trạng thái tranh chấp", "Contract Disputed")}</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {t(
                      "Tính năng hoàn tiền tự động khi quá hạn đã được tạm khóa trên Smart Contract. GDTG bảo chứng hoặc Quản trị viên hệ thống sẽ đối soát chứng từ để thực hiện phán quyết.",
                      "Timeout refund is frozen on Smart Contract. Staked Broker or System Admin is reviewing handover evidence."
                    )}
                  </p>
                </div>
              )}

              {/* 5. COMPLETED / CANCELLED RECEIPT */}
              {(statusNumber === 1 || statusNumber === 2) && (
                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>
                      {statusNumber === 1
                        ? t("Hợp đồng đã tất toán thành công", "Contract settled & disbursed")
                        : t("Hợp đồng đã hoàn tiền 100% cho Bên mua", "Contract cancelled & refunded")}
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    {t(
                      "Trạng thái quyết toán đã được ghi nhận bất biến trên Avalanche Fuji C-Chain.",
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl bg-[#111827] border border-slate-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-slate-100 text-base">Gửi khiếu nại tranh chấp</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Thao tác này ghi nhận trạng thái tranh chấp lên hợp đồng UniversalEscrow và tạm khóa cơ chế rút tiền quá hạn để chờ GDTG phân xử.
            </p>
            <textarea
              value={disputeReasonInput}
              onChange={(e) => setDisputeReasonInput(e.target.value)}
              rows={3}
              className="w-full rounded-lg bg-[#0B0F17] border border-slate-700 focus:border-blue-500 focus:outline-none text-xs p-3 text-slate-100 placeholder:text-slate-500 resize-none"
              placeholder="Nhập lý do khiếu nại và tóm tắt bằng chứng..."
            />
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRaiseDispute}
                className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
              >
                Xác nhận gửi khiếu nại
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
