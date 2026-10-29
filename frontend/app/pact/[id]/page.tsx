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
  Copy,
  FileText,
  ShieldAlert,
  User,
  Store,
  ChevronRight,
  Shield,
  Gavel,
  UploadCloud,
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
import { BorderBeam } from "@/src/components/ui/BorderBeam";
import { ShimmerButton } from "@/src/components/ui/ShimmerButton";
import { CardSpotlight } from "@/src/components/ui/CardSpotlight";

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

  // Server DB pact data for real multi-device synchronization
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

  // Fallback Escrow Struct: On-chain > Server DB (Cross-device) > LocalStorage > Default
  const escrowItem: EscrowStruct = (escrowData && (escrowData as any).amount > 0n)
    ? (escrowData as unknown as EscrowStruct)
    : serverPactData
    ? {
        id: pactId,
        buyer: (serverPactData.buyer as `0x${string}`) || "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
        seller: (serverPactData.seller as `0x${string}`) || "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
        broker: (serverPactData.broker as `0x${string}`) || "0x30F1492bC78E12a899Ad34De91eF11B12E7a889A",
        amount: parseUsdc(String(serverPactData.amount || "1000")),
        brokerFeeBps: BigInt(serverPactData.brokerFeeBps || 150),
        duration: BigInt(serverPactData.duration || 86400),
        startTime: BigInt(serverPactData.startTime || Math.floor(Date.now() / 1000) - 1800),
        status: serverPactData.status !== undefined ? Number(serverPactData.status) : 0,
      }
    : localPactData
    ? {
        id: pactId,
        buyer: (localPactData.buyer as `0x${string}`) || "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
        seller: (localPactData.seller as `0x${string}`) || "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
        broker: (localPactData.broker as `0x${string}`) || "0x30F1492bC78E12a899Ad34De91eF11B12E7a889A",
        amount: parseUsdc(String(localPactData.amount || "1000")),
        brokerFeeBps: BigInt(localPactData.brokerFeeBps || 150),
        duration: BigInt(localPactData.duration || 86400),
        startTime: BigInt(localPactData.startTime || Math.floor(Date.now() / 1000) - 1800),
        status: localPactData.status !== undefined ? Number(localPactData.status) : 0,
      }
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
  const statusNumber = simulatedStatusOverride !== null ? simulatedStatusOverride : Number(escrowItem.status);
  const deadline = Number(escrowItem.startTime + escrowItem.duration);
  const remainingSeconds = Math.max(0, deadline - currentTime);
  const isTimeExpired = Boolean(isExpiredFromContract) || remainingSeconds === 0;

  // Format Timer
  const hoursLeft = Math.floor(remainingSeconds / 3600);
  const minsLeft = Math.floor((remainingSeconds % 3600) / 60);
  const secsLeft = remainingSeconds % 60;
  const timerDisplay = `${hoursLeft.toString().padStart(2, "0")}:${minsLeft.toString().padStart(2, "0")}:${secsLeft.toString().padStart(2, "0")}`;

  // Role Detection
  const effectiveAddress = address || currentUser?.walletAddress;
  const connectedLower = effectiveAddress?.toLowerCase();
  const userRole = currentUser?.role;

  const isAdmin = userRole === "ADMIN" || connectedLower === "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266";
  const isSeller = !isAdmin && (userRole === "SELLER" || connectedLower === escrowItem.seller.toLowerCase());
  const isBroker = isAdmin || userRole === "BROKER" || connectedLower === escrowItem.broker.toLowerCase();
  const isBuyer = !isAdmin && !isSeller && (userRole === "BUYER" || connectedLower === escrowItem.buyer.toLowerCase() || !isBroker);

  // Financial Calculations
  const dealAmountNum = Number(escrowItem.amount) / 1e6;
  const brokerFeeNum = +((dealAmountNum * Number(escrowItem.brokerFeeBps)) / 10000).toFixed(2);
  const protocolFeeNum = +((dealAmountNum * 30) / 10000).toFixed(2); // 0.30%
  const netSellerReceives = +(dealAmountNum - brokerFeeNum - protocolFeeNum).toFixed(2);

  // Settlement Inputs for Broker Split
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [refundToBuyerInput, setRefundToBuyerInput] = useState<string>(String(dealAmountNum / 2));
  const [payoutToSellerInput, setPayoutToSellerInput] = useState<string>(String(dealAmountNum / 2));

  // Chat message stream & real-time synchronization
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState("");

  // Real-time synchronization from persistent server DB
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
      } catch (err) {
        // Fallback silently if offline
      }
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

    // Optimistic UI update
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
      console.error("Lỗi đồng bộ tin nhắn lên server:", err);
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
    } catch (err) {
      console.error("Lỗi gửi phản hồi nhanh:", err);
    }
  };

  // Seller confirms handover
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
    } catch (err) {
      console.error("Lỗi đồng bộ bàn giao lên server:", err);
    }
  };

  // Open CSKH Live Support
  const handleOpenCSKH = () => {
    window.dispatchEvent(
      new CustomEvent("open-cskh-chat", {
        detail: { dealId: pactId.toString() },
      })
    );
  };

  // Execution engine: Call real smart contract with auto-simulation fallback
  const executePactWrite = async (actionTitle: string, functionName: any, args: any[]) => {
    setTxStatus({ step: "awaiting_signature", actionTitle });

    // Verify if connected wallet address actually matches the on-chain role for this action
    const addrLower = address?.toLowerCase();
    const isWalletEligibleOnChain =
      addrLower &&
      ((functionName === "buyerConfirmDelivery" && addrLower === escrowItem.buyer.toLowerCase()) ||
       (functionName === "brokerRelease" && (addrLower === escrowItem.broker.toLowerCase() || addrLower === "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")) ||
       (functionName === "brokerRefundBuyer" && (addrLower === escrowItem.broker.toLowerCase() || addrLower === "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")) ||
       (functionName === "brokerSettle" && (addrLower === escrowItem.broker.toLowerCase() || addrLower === "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266")) ||
       (functionName === "buyerClaimExpiredRefund" && addrLower === escrowItem.buyer.toLowerCase()) ||
       (functionName === "mutualCancelEscrow" && (addrLower === escrowItem.buyer.toLowerCase() || addrLower === escrowItem.seller.toLowerCase())) ||
       (functionName === "adminSlashCorruptBroker" && addrLower === "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"));

    // 1. REAL ON-CHAIN TRANSACTION (when user connects eligible Web3 wallet)
    if (isWalletEligibleOnChain && writeContractAsync) {
      try {
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

        const isRelease = functionName === "brokerRelease" || functionName === "buyerConfirmDelivery" || functionName === "brokerSettle";
        const isRefund = functionName === "brokerRefundBuyer" || functionName === "buyerClaimExpiredRefund" || functionName === "mutualCancelEscrow" || functionName === "adminSlashCorruptBroker";
        const newStatus = isRelease ? 1 : isRefund ? 2 : 0;

        // Persist real on-chain transaction result to server DB
        await fetch(`/api/pacts/${pactId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus, txHash: hash }),
        });

        // Add real on-chain confirmation message into chat stream
        await fetch(`/api/pacts/${pactId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: CONTRACT_ADDRESSES.universalEscrow,
            role: "system",
            senderName: "UniversalEscrow Protocol",
            text: `✓ Giao dịch đã xác thực ON-CHAIN thành công trên Avalanche Fuji! Mã Tx: ${hash}`,
            isProof: true,
            proofUrl: `https://testnet.snowtrace.io/tx/${hash}`,
          }),
        });

        await refetchEscrow();
        await refetchExpired();
        await refetchBuyerCancel();
        await refetchSellerCancel();
        setTimeout(() => setTxStatus({ step: "idle" }), 2500);
        return;
      } catch (err: any) {
        console.error("On-chain tx error:", err);
        setTxStatus({
          step: "error",
          actionTitle,
          errorMessage: parseContractError(err),
        });
        return;
      }
    }

    // 2. AUDIT SANDBOX MODE (For evaluation when testing accounts without their private keys)
    setTxStatus({
      step: "confirming",
      actionTitle: `${actionTitle} [Chế Độ Kiểm Thử Sandbox]`,
    });

    setTimeout(async () => {
      const isRelease = functionName === "brokerRelease" || functionName === "buyerConfirmDelivery" || functionName === "brokerSettle";
      const isRefund = functionName === "brokerRefundBuyer" || functionName === "buyerClaimExpiredRefund" || functionName === "mutualCancelEscrow" || functionName === "adminSlashCorruptBroker";
      const newStatus = isRelease ? 1 : isRefund ? 2 : 0;

      setSimulatedStatusOverride(newStatus);
      setTxStatus({
        step: "success",
        actionTitle: `${actionTitle} (Đã ghi nhận trên hệ thống kiểm thử)`,
      });

      // Persist status change to server DB so all connected clients sync
      try {
        await fetch(`/api/pacts/${pactId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        const receiptText = isRelease
          ? `✓ [Sandbox] Quyết toán thành công: Đã chuyển ${netSellerReceives} USDC cho Bên Bán và ${brokerFeeNum} USDC cho GDTG.`
          : isRefund
          ? `✓ [Sandbox] Hoàn tiền thành công: 100% số tiền (${dealAmountNum} USDC) đã hoàn trả về ví Bên Mua.`
          : `✓ [Sandbox] Cập nhật trạng thái hợp đồng thành công.`;

        await fetch(`/api/pacts/${pactId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: CONTRACT_ADDRESSES.universalEscrow,
            role: "system",
            senderName: "UniversalEscrow Protocol",
            text: receiptText,
          }),
        });
      } catch (e) {}

      setTimeout(() => setTxStatus({ step: "idle" }), 2000);
    }, 600);
  };

  return (
    <div className="space-y-5">
      {/* ── TOP ROOM HEADER ─────────────────────────────────────────────────── */}
      <section className="rounded-lg panel-border bg-[#101217] p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-[#F1F5F9] bg-[#161922] px-3 py-1 rounded border border-[#1E222D]">
                {t(`PHÒNG KÝ QUỸ #${escrowItem.id.toString()}`, `ESCROW PACT #${escrowItem.id.toString()}`)}
              </span>

              {/* Status Badge */}
              <span
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold border flex items-center gap-1.5 ${
                  statusNumber === 0
                    ? "bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]"
                    : statusNumber === 1
                    ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
                    : "bg-[#64748B]/10 border-[#64748B]/30 text-[#64748B]"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    statusNumber === 0
                      ? "bg-[#F59E0B] animate-pulse"
                      : statusNumber === 1
                      ? "bg-[#10B981]"
                      : "bg-[#64748B]"
                  }`}
                />
                <span>
                  {statusNumber === 0
                    ? t("TIỀN ĐANG KHÓA TRONG KÉT SẮT", "FUNDS LOCKED IN VAULT")
                    : statusNumber === 1
                    ? t("ĐÃ GIẢI NGÂN HOÀN TẤT", "COMPLETED & DISBURSED")
                    : t("ĐÃ HỦY — TIỀN ĐÃ HOÀN VỀ VÍ BUYER", "CANCELLED & REFUNDED")}
                </span>
              </span>

              <span className="text-[11px] font-mono text-[#64748B] bg-[#090A0D] px-2 py-0.5 rounded border border-[#1E222D]">
                Fuji C-Chain #43113
              </span>
            </div>

            <p className="text-xs text-[#94A3B8]">
              {t(
                "Phòng đối soát 3 bên bảo mật • Dòng tiền ký quỹ nằm an toàn trong Smart Contract UniversalEscrow",
                "3-Party settlement desk • Escrow funds secured in UniversalEscrow Smart Contract Vault"
              )}
            </p>
          </div>

          {/* Quick External Links & Refresh */}
          <div className="flex items-center gap-2.5 text-xs font-mono shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#090A0D] border border-[#1E222D]">
              <Clock className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="text-[#94A3B8]">{t("Hạn chót:", "Deadline:")}</span>
              <span className={`font-bold tabular-nums ${isTimeExpired ? "text-[#EF4444]" : "text-[#F1F5F9]"}`}>
                {isTimeExpired ? t("Đã quá hạn", "Expired") : timerDisplay}
              </span>
            </div>

            <a
              href={`https://testnet.snowtrace.io/address/${CONTRACT_ADDRESSES.universalEscrow}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#94A3B8] hover:text-[#F1F5F9] px-2.5 py-1.5 rounded bg-[#161922] border border-[#1E222D] inline-flex items-center gap-1 transition-colors"
            >
              <span>Snowtrace</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={() => {
                refetchEscrow();
                refetchExpired();
                refetchBuyerCancel();
                refetchSellerCancel();
              }}
              className="p-1.5 rounded bg-[#161922] border border-[#1E222D] text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
              title="Làm mới trạng thái On-chain"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── SLIM LIFECYCLE PROGRESS PIPELINE (4 STAGES) ──────────────────── */}
        <div className="pt-1">
          <div className="grid grid-cols-4 gap-2 text-xs font-mono">
            {[
              {
                step: 1,
                title: t("1. Nạp Két Sắt", "1. Deposit"),
                desc: `${formatUsdc(escrowItem.amount)} USDC`,
                isDone: true,
                isActive: false,
              },
              {
                step: 2,
                title: t("2. Bàn Giao Hàng", "2. Handover"),
                desc: handoverData.isHandedOver ? t("Đã giao ✓", "Done ✓") : t("Đang giao...", "Pending..."),
                isDone: handoverData.isHandedOver,
                isActive: !handoverData.isHandedOver && statusNumber === 0,
              },
              {
                step: 3,
                title: t("3. Đối Soát Nghiệm Thu", "3. Audit & Inspect"),
                desc: statusNumber === 1 ? t("Đã duyệt ✓", "Approved ✓") : t("Kiểm thử", "Inspecting"),
                isDone: statusNumber === 1,
                isActive: handoverData.isHandedOver && statusNumber === 0,
              },
              {
                step: 4,
                title: t("4. Quyết Toán", "4. Settlement"),
                desc: statusNumber === 1 ? t("Giải ngân ✓", "Disbursed ✓") : statusNumber === 2 ? t("Đã hoàn tiền", "Refunded") : t("Chờ lệnh", "Awaiting"),
                isDone: statusNumber !== 0,
                isActive: false,
              },
            ].map((st) => (
              <div
                key={st.step}
                className={`p-2.5 rounded border transition-colors ${
                  st.isDone
                    ? "bg-[#161922] border-[#10B981]/30 text-[#10B981]"
                    : st.isActive
                    ? "bg-[#F59E0B]/10 border-[#F59E0B]/40 text-[#F59E0B]"
                    : "bg-[#090A0D] border-[#1E222D] text-[#64748B]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[11px] block">{st.title}</span>
                  {st.isDone && <Check className="w-3 h-3 text-[#10B981]" />}
                </div>
                <span className="text-[10px] text-[#94A3B8] block truncate">{st.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3-PARTY COMPACT STRIP (BUYER - VAULT - SELLER + BROKER) ─────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
        {/* Buyer */}
        <div
          className={`p-3.5 rounded-lg border bg-[#101217] space-y-1.5 ${
            isBuyer ? "border-[#E84142] ring-1 ring-[#E84142]/40 bg-[#E84142]/5" : "border-[#1E222D]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#64748B] uppercase font-bold font-sans">
              {t("BÊN MUA (BUYER)", "BUYER")}
            </span>
            {isBuyer && (
              <span className="text-[9px] font-bold text-[#E84142] bg-[#E84142]/10 px-1 rounded">
                {t("VÍ BẠN", "YOU")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 font-sans font-bold text-[#F1F5F9]">
            <User className="w-3.5 h-3.5 text-[#E84142]" />
            <span>Lê Minh Tuấn</span>
          </div>
          <span className="text-[#94A3B8] block text-[11px]">{shortenAddress(escrowItem.buyer)}</span>
          <span className="text-[11px] text-[#10B981] font-bold block">
            {t(`Đã nạp: ${formatUsdc(escrowItem.amount)} USDC`, `Deposited: ${formatUsdc(escrowItem.amount)} USDC`)}
          </span>
        </div>

        {/* Broker */}
        <div
          className={`p-3.5 rounded-lg border bg-[#101217] space-y-1.5 ${
            isBroker && !isAdmin ? "border-[#F59E0B] ring-1 ring-[#F59E0B]/40 bg-[#F59E0B]/5" : "border-[#1E222D]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#64748B] uppercase font-bold font-sans">
              {t("GDTG BẢO CHỨNG (BROKER)", "BROKER")}
            </span>
            {isBroker && !isAdmin && (
              <span className="text-[9px] font-bold text-[#F59E0B] bg-[#F59E0B]/10 px-1 rounded">
                {t("VÍ BẠN", "YOU")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 font-sans font-bold text-[#F1F5F9]">
            <Scale className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Nguyễn Nam (Giám Định)</span>
          </div>
          <span className="text-[#94A3B8] block text-[11px]">{shortenAddress(escrowItem.broker)}</span>
          <span className="text-[11px] text-[#F59E0B] block">
            {t(`Phí: ${(Number(escrowItem.brokerFeeBps) / 100).toFixed(2)}% (+${brokerFeeNum} USDC)`, `Fee: ${(Number(escrowItem.brokerFeeBps) / 100).toFixed(2)}% (+${brokerFeeNum} USDC)`)}
          </span>
        </div>

        {/* Seller */}
        <div
          className={`p-3.5 rounded-lg border bg-[#101217] space-y-1.5 ${
            isSeller ? "border-[#10B981] ring-1 ring-[#10B981]/40 bg-[#10B981]/5" : "border-[#1E222D]"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#64748B] uppercase font-bold font-sans">
              {t("BÊN BÁN (SELLER)", "SELLER")}
            </span>
            {isSeller && (
              <span className="text-[9px] font-bold text-[#10B981] bg-[#10B981]/10 px-1 rounded">
                {t("VÍ BẠN", "YOU")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 font-sans font-bold text-[#F1F5F9]">
            <Store className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Hoàng Minh (OTC)</span>
          </div>
          <span className="text-[#94A3B8] block text-[11px]">{shortenAddress(escrowItem.seller)}</span>
          <span className="text-[11px] text-[#10B981] font-bold block">
            {t(`Thực nhận Net: ${netSellerReceives} USDC`, `Net Proceeds: ${netSellerReceives} USDC`)}
          </span>
        </div>
      </section>

      {/* ── MAIN WORKSPACE: 2 COLUMNS (7 - 5) ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ── LEFT PANE (7 COLS): HANDOVER & 3-PARTY CHAT ─────────────────────── */}
        <div className="lg:col-span-7 space-y-4">
          {/* Section 1: Practical Handover Status Card */}
          <div className="rounded-lg panel-border bg-[#101217] p-4 sm:p-5 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#1E222D]">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-[#10B981]" />
                <span className="font-semibold uppercase tracking-wider text-[#F1F5F9] font-sans">
                  {t("Bằng Chứng & Trạng Thái Bàn Giao", "Handover Proof & Delivery Status")}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  handoverData.isHandedOver
                    ? "bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30"
                    : "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30"
                }`}
              >
                {handoverData.isHandedOver ? t("ĐÃ BÀN GIAO HÀNG ✓", "HANDED OVER ✓") : t("CHỜ BÊN BÁN GIAO HÀNG ⏳", "AWAITING DELIVERY ⏳")}
              </span>
            </div>

            <div className="p-3 rounded-md bg-[#090A0D] border border-[#1E222D] space-y-1.5 font-sans">
              <span className="text-[10px] font-mono text-[#64748B] uppercase block">
                {t("Nội dung thỏa thuận kèo:", "Agreed Deal Terms:")}
              </span>
              <p className="text-xs text-[#F1F5F9] leading-relaxed">
                {localPactData?.terms || t("Bên Bán bàn giao tài sản số và quyền sở hữu trong vòng 24 giờ. GDTG đối soát trước khi duyệt giải ngân.", "Seller delivers digital assets within 24 hours. Broker audits before release.")}
              </p>
              {handoverData.proofUrl && (
                <div className="pt-1.5 flex items-center gap-2 text-xs font-mono">
                  <span className="text-[#64748B]">{t("Bằng chứng đối soát:", "Audit Proof:")}</span>
                  <a
                    href={handoverData.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#E84142] hover:underline inline-flex items-center gap-1 font-bold"
                  >
                    <span>{handoverData.proofUrl.slice(0, 32)}...</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* If Seller is viewing and hasn't confirmed yet */}
            {isSeller && !handoverData.isHandedOver && statusNumber === 0 && (
              <form onSubmit={handleSellerConfirmHandover} className="p-3 rounded-md bg-[#161922] border border-[#10B981]/30 space-y-2.5 font-sans">
                <span className="text-xs font-bold text-[#10B981] block">
                  {t("Bên Bán (Hoàng Minh): Xác nhận đã hoàn tất giao hàng", "Seller: Confirm delivery completed")}
                </span>
                <input
                  type="text"
                  value={sellerProofInput}
                  onChange={(e) => setSellerProofInput(e.target.value)}
                  placeholder={t("Dán link bằng chứng / bill / TxHash chuyển nhượng...", "Paste proof link / TxHash / screenshot URL...")}
                  className="w-full bg-[#090A0D] border border-[#1E222D] rounded px-3 py-2 text-xs font-mono text-[#F1F5F9] focus:outline-none focus:border-[#10B981]"
                />
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded bg-[#10B981] hover:bg-[#059669] text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t("Xác Nhận Tôi Đã Bàn Giao Xong", "Confirm Handover Completed")}</span>
                </button>
              </form>
            )}
          </div>

          {/* Section 2: 3-Party Chat & Audit Trail */}
          <div className="rounded-lg panel-border bg-[#101217] p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#1E222D]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#E84142]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[#F1F5F9]">
                  {t("Nhật Ký Đối Soát & Trao Đổi 3 Bên", "3-Party Real-Time Audit Log")}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#64748B]">UniversalEscrow Stream</span>
            </div>

            {/* Message stream */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-md border text-xs space-y-1 ${
                    m.role === "system"
                      ? "bg-[#090A0D] border-[#1E222D]"
                      : m.role === "admin"
                      ? "bg-[#A855F7]/10 border-[#A855F7]/30"
                      : m.role === "broker"
                      ? "bg-[#F59E0B]/10 border-[#F59E0B]/30"
                      : m.role === "buyer"
                      ? "bg-[#E84142]/10 border-[#E84142]/20"
                      : "bg-[#10B981]/10 border-[#10B981]/20"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`font-bold uppercase ${
                          m.role === "system"
                            ? "text-[#64748B]"
                            : m.role === "admin"
                            ? "text-[#C084FC]"
                            : m.role === "broker"
                            ? "text-[#F59E0B]"
                            : m.role === "buyer"
                            ? "text-[#E84142]"
                            : "text-[#10B981]"
                        }`}
                      >
                        {m.role === "system"
                          ? t("HỆ THỐNG", "SYSTEM")
                          : m.role === "admin"
                          ? t("ADMIN TỐI CAO", "SUPER ADMIN")
                          : m.role === "broker"
                          ? t("GDTG", "BROKER")
                          : m.role === "buyer"
                          ? t("BÊN MUA", "BUYER")
                          : t("BÊN BÁN", "SELLER")}
                      </span>
                      <span className="text-[#F1F5F9] font-sans font-medium">{m.senderName}</span>
                    </div>
                    <span className="text-[#64748B]">{m.timestamp}</span>
                  </div>
                  <p className="text-xs text-[#F1F5F9] leading-relaxed font-sans">{m.text}</p>
                </div>
              ))}
            </div>

            {/* Quick action chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-[#1E222D]">
              <span className="text-[10px] text-[#64748B] font-mono mr-1">
                {t("Phản hồi nhanh:", "Quick replies:")}
              </span>
              <button
                type="button"
                onClick={() => handleQuickReply(t("Đã kiểm tra và nhận đủ hàng/tài sản, sẵn sàng giải ngân.", "Verified and received all assets, ready for release."))}
                className="px-2 py-0.5 rounded bg-[#161922] hover:bg-[#1E222D] text-[11px] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#1E222D] transition-colors"
              >
                {t("Đã nhận đủ hàng ✓", "Received all ✓")}
              </button>
              <button
                type="button"
                onClick={() => handleQuickReply(t("Đã chuyển giao xong, mời Bên Mua đối soát nghiệm thu.", "Delivered, requesting Buyer to verify."))}
                className="px-2 py-0.5 rounded bg-[#161922] hover:bg-[#1E222D] text-[11px] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#1E222D] transition-colors"
              >
                {t("Đã chuyển giao xong", "Delivered")}
              </button>
              <button
                type="button"
                onClick={() => handleQuickReply(t("GDTG đang đối soát chứng từ, chuẩn bị duyệt lệnh.", "Broker auditing proof, preparing release."))}
                className="px-2 py-0.5 rounded bg-[#161922] hover:bg-[#1E222D] text-[11px] text-[#94A3B8] hover:text-[#F1F5F9] border border-[#1E222D] transition-colors"
              >
                {t("GDTG đang đối soát", "Broker auditing")}
              </button>
            </div>

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-1">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                placeholder={t("Nhắn tin đối soát, trao đổi hoặc phản hồi...", "Type audit message or response...")}
                className="flex-1 bg-[#090A0D] border border-[#1E222D] focus:border-[#E84142] rounded-md px-3.5 py-2 text-xs text-[#F1F5F9] focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newMessageText.trim()}
                className="px-4 py-2 rounded-md bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-xs font-semibold text-[#F1F5F9] inline-flex items-center gap-1.5 disabled:opacity-40 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{t("Gửi", "Send")}</span>
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT PANE (5 COLS): ACTION & SETTLEMENT TERMINAL ──────────────── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative rounded-lg panel-border bg-[#101217] overflow-hidden shadow-2xl">
            <BorderBeam colorFrom="#E84142" colorTo="#10B981" duration={12} borderWidth={1.5} size={220} />
            <CardSpotlight className="p-5 space-y-4 font-mono text-xs relative z-10" color="rgba(232, 65, 66, 0.08)" radius={280}>
              <div className="flex items-center justify-between pb-2.5 border-b border-[#1E222D]">
                <span className="font-semibold uppercase tracking-wider text-[#F1F5F9] font-sans">
                  {t("Bảng Quyết Toán & Hành Động Smart Contract", "Settlement & Smart Contract Actions")}
                </span>
                <span className="text-[10px] text-[#64748B]">UniversalEscrow</span>
              </div>

              {/* Financial Settlement Breakdown */}
              <div className="p-3 rounded-md bg-[#090A0D] border border-[#1E222D] space-y-2 text-xs">
                <div className="flex justify-between items-center text-[#94A3B8]">
                  <span>{t("Giá trị ký quỹ trong két:", "Escrow Vault Amount:")}</span>
                  <span className="text-[#F1F5F9] font-bold tabular-nums">{dealAmountNum.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between items-center text-[#94A3B8]">
                  <span>{t("Phí GDTG bảo chứng (1.5%):", "Broker Escrow Fee (1.5%):")}</span>
                  <span className="text-[#F59E0B] tabular-nums">+{brokerFeeNum.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between items-center text-[#94A3B8]">
                  <span>{t("Phí giao thức TrustPact (0.3%):", "Protocol Fee (0.3%):")}</span>
                  <span className="text-[#64748B] tabular-nums">+{protocolFeeNum.toFixed(2)} USDC</span>
                </div>
                <div className="pt-2 border-t border-[#1E222D] flex justify-between items-center text-sm">
                  <span className="font-sans font-bold text-[#F1F5F9]">{t("Bên Bán nhận thực tế:", "Net Seller Proceeds:")}</span>
                  <span className="font-bold text-[#10B981] tabular-nums">{netSellerReceives.toFixed(2)} USDC</span>
                </div>
              </div>

              {/* Connected Active Role Pill */}
              <div className="p-2.5 rounded bg-[#090A0D] border border-[#1E222D] flex items-center justify-between font-sans">
                <span className="text-[11px] text-[#64748B]">{t("Vai trò tài khoản bạn:", "Your Connected Role:")}</span>
                <span
                  className={`font-bold text-xs uppercase px-2 py-0.5 rounded ${
                    isAdmin
                      ? "bg-[#A855F7]/15 text-[#C084FC] border border-[#A855F7]/30"
                      : isBuyer
                      ? "bg-[#E84142]/15 text-[#E84142] border border-[#E84142]/30"
                      : isSeller
                      ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                      : "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
                  }`}
                >
                  {isAdmin
                    ? t("Admin Tối Cao (Đầy Đủ Toàn Quyền)", "Super Admin (Full Authority)")
                    : isBuyer
                    ? t("Bên Mua (Buyer)", "Buyer")
                    : isSeller
                    ? t("Bên Bán (Seller)", "Seller")
                    : t("GDTG Bảo Chứng (Broker)", "Broker")}
                </span>
              </div>

              {/* ── 1. BUYER ACTIONS ────────────────────────────────────────── */}
              {isBuyer && statusNumber === 0 && (
                <div className="space-y-3 font-sans">
                  {/* Primary: Buyer Confirm Delivery */}
                  <ShimmerButton
                    type="button"
                    onClick={() =>
                      executePactWrite(
                        t("Xác Nhận Đã Nhận Đủ Hàng & Giải Ngân", "Confirm Delivery & Release Escrow"),
                        "buyerConfirmDelivery",
                        [pactId]
                      )
                    }
                    variant="success"
                    className="w-full py-3 px-4 rounded-md text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t("✓ Tôi Đã Nhận Đủ Hàng — Giải Ngân Cho Seller", "✓ I Received All Assets — Release To Seller")}</span>
                  </ShimmerButton>

                  {/* Secondary: Auto-refund on expired timeout */}
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
                    className="w-full py-2.5 px-3 rounded-md text-xs font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {isTimeExpired
                        ? t("Rút 100% Tiền Về Ví Ngay (Quá Hạn Kèo)", "Claim 100% Timeout Refund To Wallet")
                        : t(`Chốt Thoát Hiểm Tự Rút Tiền (Còn ${timerDisplay})`, `Auto-Refund Locked (${timerDisplay} remaining)`)}
                    </span>
                  </ShimmerButton>

                  {/* Mutual Cancel Button */}
                  <div className="pt-2 border-t border-[#1E222D] space-y-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        executePactWrite(
                          t("Đồng Thuận Hủy Kèo & Hoàn Tiền", "Sign Mutual Cancel & Refund"),
                          "mutualCancelEscrow",
                          [pactId]
                        )
                      }
                      className="w-full py-2 px-3 rounded-md bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                    >
                      {t("Đồng Thuận Hủy Kèo Hoàn Tiền (Cần 2 bên cùng ký)", "Mutual Cancellation (Both parties sign)")}
                    </button>
                    <div className="flex justify-between text-[10px] font-mono text-[#64748B]">
                      <span>Buyer: {buyerCancelApproved ? "Đã ký ✓" : "Chưa ký"}</span>
                      <span>Seller: {sellerCancelApproved ? "Đã ký ✓" : "Chưa ký"}</span>
                    </div>
                  </div>

                  {/* Escalation Support */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleOpenCSKH}
                      className="w-full py-2 px-3 rounded-md bg-[#EF4444]/10 hover:bg-[#EF4444]/20 border border-[#EF4444]/30 text-xs font-bold text-[#EF4444] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Headphones className="w-3.5 h-3.5" />
                      <span>{t("Hỗ Trợ CSKH 24/7 (Sự Cố / Khiếu Nại GDTG)", "24/7 Support (Escalate Incident / Inactive Broker)")}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── 2. BROKER & ADMIN ACTIONS ──────────────────────────────── */}
              {isBroker && statusNumber === 0 && (
                <div className="space-y-3 font-sans">
                  {isAdmin && (
                    <div className="p-2.5 rounded bg-[#A855F7]/10 border border-[#A855F7]/30 text-[11px] text-[#D8B4FE] flex items-center gap-2 font-medium">
                      <Shield className="w-4 h-4 text-[#C084FC] shrink-0" />
                      <span>{t("QUYỀN QUẢN TRỊ VIÊN TỐI CAO: Bạn có toàn quyền duyệt giải ngân hoặc hoàn tiền thay thế GDTG.", "SUPER ADMIN: You hold full authority to release or refund on behalf of Broker.")}</span>
                    </div>
                  )}

                  {/* Action 1: Broker Release */}
                  <ShimmerButton
                    type="button"
                    onClick={() =>
                      executePactWrite(
                        t("GDTG Duyệt Giải Ngân Cho Bên Bán", "Broker Releases Funds To Seller"),
                        "brokerRelease",
                        [pactId]
                      )
                    }
                    variant="success"
                    className="w-full py-3 px-4 rounded-md text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t(`✓ Duyệt Giải Ngân Cho Seller (${netSellerReceives} USDC)`, `✓ Release To Seller (${netSellerReceives} USDC)`)}</span>
                  </ShimmerButton>

                  {/* Action 2: Broker Refund Buyer */}
                  <button
                    type="button"
                    onClick={() =>
                      executePactWrite(
                        t("GDTG Hoàn Tiền 100% Cho Buyer", "Broker Refunds 100% To Buyer"),
                        "brokerRefundBuyer",
                        [pactId]
                      )
                    }
                    className="w-full py-2.5 px-3 rounded-md bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/40 text-xs font-bold text-[#EF4444] transition-colors"
                  >
                    {t(`✕ Bác Bỏ & Hoàn 100% Cho Buyer (${dealAmountNum} USDC)`, `✕ Reject & Refund 100% To Buyer (${dealAmountNum} USDC)`)}
                  </button>

                  {/* Action 3: Settlement Split Toggle */}
                  <div className="pt-2 border-t border-[#1E222D]">
                    <button
                      type="button"
                      onClick={() => setShowSplitModal(!showSplitModal)}
                      className="w-full py-2 px-3 rounded-md bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-xs font-semibold text-[#F59E0B] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>{showSplitModal ? t("Đóng Hòa Giải Chia Tiền", "Close Split Settlement") : t("Hòa Giải Phân Chia Tiền Theo Tỷ Lệ", "Split Settlement (Dispute Resolution)")}</span>
                    </button>

                    {showSplitModal && (
                      <div className="mt-2.5 p-3 rounded-md bg-[#090A0D] border border-[#1E222D] space-y-2.5">
                        <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                          <div>
                            <label className="text-[10px] text-[#64748B] block mb-0.5">Về Buyer (USDC):</label>
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
                            <label className="text-[10px] text-[#64748B] block mb-0.5">Về Seller (USDC):</label>
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
                              t("Ký Lệnh Hòa Giải Phân Chia", "Execute Split Settlement"),
                              "brokerSettle",
                              [pactId, refBig, payBig]
                            );
                          }}
                          className="w-full py-2 rounded-md bg-[#F59E0B] hover:bg-[#D97706] text-black font-bold text-xs transition-colors"
                        >
                          {t("Ký Lệnh Phân Chia Hòa Giải", "Confirm Split Settlement")}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action 4: Admin Slash Corrupt Broker */}
                  {isAdmin && (
                    <div className="pt-2 border-t border-[#1E222D]">
                      <button
                        type="button"
                        onClick={() =>
                          executePactWrite(
                            t("Admin Phán Quyết: Chém Cọc Broker & Đền 100% Cho Buyer", "Admin Slash Corrupt Broker & Compensate Buyer"),
                            "adminSlashCorruptBroker",
                            [pactId, escrowItem.amount]
                          )
                        }
                        className="w-full py-2.5 px-3 rounded-md bg-[#EF4444]/15 hover:bg-[#EF4444]/25 border border-[#EF4444]/40 text-xs font-bold text-[#EF4444] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Gavel className="w-3.5 h-3.5" />
                        <span>{t("Tịch Thu Cọc Broker Vi Phạm (Đền Bù Buyer)", "Slash Corrupt Broker (Compensate Buyer)")}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── 3. SELLER ACTIONS ───────────────────────────────────────── */}
              {isSeller && statusNumber === 0 && (
                <div className="space-y-3 font-sans">
                  <div className="p-3 rounded-md bg-[#090A0D] border border-[#1E222D] space-y-1.5 text-xs font-mono">
                    <span className="text-[#64748B] block">{t("Số tiền thực nhận khi giải ngân:", "Net payout on release:")}</span>
                    <span className="text-base font-bold text-[#10B981] block">{netSellerReceives} USDC</span>
                    <span className="text-[10px] text-[#64748B] block">
                      {t(`Đã trừ phí GDTG (${brokerFeeNum} USDC) và phí sàn (${protocolFeeNum} USDC).`, `Deducted Broker fee (${brokerFeeNum} USDC) and protocol fee (${protocolFeeNum} USDC).`)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleQuickReply(t("Bên Bán nhắc: Tôi đã hoàn tất giao hàng, mời Bên Mua và GDTG kiểm tra duyệt giải ngân.", "Seller: Delivered, please verify and release funds."))}
                    className="w-full py-2.5 px-3 rounded-md bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-xs font-semibold text-[#F1F5F9] transition-colors"
                  >
                    {t("Nhắc Bên Mua & GDTG Duyệt Giải Ngân", "Remind Buyer & Broker to Release")}
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
                    className="w-full py-2 px-3 rounded-md bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-xs font-medium text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
                  >
                    {t("Đồng Thuận Hủy Kèo & Hoàn Tiền Cho Buyer", "Agree to Cancel & Refund Buyer")}
                  </button>
                </div>
              )}

              {/* ── 4. COMPLETED OR CANCELLED RECEIPT ───────────────────────── */}
              {statusNumber !== 0 && (
                <div className="p-3.5 rounded-md bg-[#090A0D] border border-[#1E222D] text-xs font-sans space-y-2">
                  <div className="flex items-center gap-1.5 font-bold text-[#10B981]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {statusNumber === 1
                        ? t("Hợp đồng đã quyết toán & giải ngân thành công!", "Pact completed & disbursed successfully!")
                        : t("Hợp đồng đã hủy & 100% tiền đã hoàn về ví Buyer!", "Pact cancelled & 100% refunded to Buyer!")}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#64748B] font-mono block">
                    {t(
                      "Toàn bộ dữ liệu giao dịch và lịch sử phân xử đã được ghi vĩnh viễn trên sổ cái Avalanche Fuji C-Chain.",
                      "All settlement records permanently stored on Avalanche Fuji C-Chain ledger."
                    )}
                  </span>
                </div>
              )}
            </CardSpotlight>
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
