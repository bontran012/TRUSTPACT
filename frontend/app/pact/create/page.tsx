"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { parseAbiItem, formatUnits } from "viem";
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Check,
  Coins,
  ChevronDown,
} from "lucide-react";
import {
  CONTRACT_ADDRESSES,
  UNIVERSAL_ESCROW_ABI,
  ERC20_ABI,
  SCAM_REGISTRY_L1_ABI,
  TRUST_PASSPORT_SBT_ABI,
  STAKED_BROKER_REGISTRY_ABI,
  formatUsdc,
  parseUsdc,
  shortenAddress,
  parseContractError,
} from "@/src/lib/contracts";
import { TransactionFeedback, TxStatus } from "@/src/components/TransactionFeedback";
import { PactConfirmationModal } from "@/src/components/pact/PactConfirmationModal";
import { useAuth } from "@/src/context/AuthContext";

interface BrokerItem {
  id: string;
  name: string;
  address: `0x${string}`;
  badge: string;
  stakedAmount: number;
  availableQuota: number;
  successRate: number;
  rating: number;
  deals: number;
}

const REGISTERED_BROKERS: BrokerItem[] = [
  {
    id: "broker-nam",
    name: "Nguyễn Nam (OTC & Tài Sản Số)",
    address: "0x30F1492bC78E12a899Ad34De91eF11B12E7a889A",
    badge: "Master Auditor",
    stakedAmount: 5000,
    availableQuota: 6000,
    successRate: 100,
    rating: 5.0,
    deals: 128,
  },
  {
    id: "broker-hoang",
    name: "Hoàng Minh (Thương Nhân P2P Bảo Lãnh)",
    address: "0x44B1492bC78E12a899Ad34De91eF11B12E7a889B",
    badge: "Senior Escrow",
    stakedAmount: 2500,
    availableQuota: 3000,
    successRate: 99.2,
    rating: 4.9,
    deals: 84,
  },
  {
    id: "broker-tuan",
    name: "Trần Tuấn (Audit Mã Nguồn & Tên Miền)",
    address: "0x55C1492bC78E12a899Ad34De91eF11B12E7a889C",
    badge: "Tech Mediator",
    stakedAmount: 1200,
    availableQuota: 1440,
    successRate: 98.5,
    rating: 4.8,
    deals: 42,
  },
];

export default function CreateEscrowPactPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const { currentUser } = useAuth();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Modal State for 2-Party Confirmation Transition
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [createdPactId, setCreatedPactId] = useState("101");
  const [createdTxHash, setCreatedTxHash] = useState<string | undefined>(undefined);

  // Form State
  const initialSeller = searchParams.get("seller") || "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002";
  const [sellerInput, setSellerInput] = useState(initialSeller);
  const [selectedBroker, setSelectedBroker] = useState<BrokerItem>(REGISTERED_BROKERS[0]);
  const [customBrokerAddress, setCustomBrokerAddress] = useState("");
  const [isCustomBroker, setIsCustomBroker] = useState(false);

  const [dealAmountInput, setDealAmountInput] = useState("1000");
  const [selectedDurationSeconds, setSelectedDurationSeconds] = useState(86400); // 24h
  const [brokerFeeBps, setBrokerFeeBps] = useState(150); // 1.5%
  const [handoverTerms, setHandoverTerms] = useState(
    "Bên Bán bàn giao mã khóa API và tài khoản quản trị trong vòng 24 giờ. Trọng tài GDTG kiểm tra tính hợp lệ trước khi bấm giải ngân."
  );

  const [txStatus, setTxStatus] = useState<TxStatus>({ step: "idle" });

  // ── Web3 Reads ────────────────────────────────────────────────────────
  const { data: userUsdcBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.usdc,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 4000 },
  });

  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.usdc,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACT_ADDRESSES.universalEscrow] : undefined,
    query: { enabled: !!address, refetchInterval: 3000 },
  });

  const activeBrokerAddress: `0x${string}` = isCustomBroker && customBrokerAddress.startsWith("0x")
    ? (customBrokerAddress as `0x${string}`)
    : selectedBroker.address;

  // Background Check on Seller: ScamRegistryL1
  const { data: sellerScamData } = useReadContract({
    address: CONTRACT_ADDRESSES.scamRegistryL1,
    abi: SCAM_REGISTRY_L1_ABI,
    functionName: "checkScam",
    args: sellerInput.trim() ? [sellerInput.trim()] : undefined,
    query: { enabled: sellerInput.trim().length > 5 },
  });

  // Background Check on Seller: TrustPassportSBT
  const { data: sellerSuccessRate } = useReadContract({
    address: CONTRACT_ADDRESSES.trustPassportSBT,
    abi: TRUST_PASSPORT_SBT_ABI,
    functionName: "getSuccessRate",
    args: sellerInput.startsWith("0x") && sellerInput.length === 42 ? [sellerInput as `0x${string}`] : undefined,
    query: { enabled: sellerInput.startsWith("0x") && sellerInput.length === 42 },
  });

  // Read Live Available Quota of Chosen Broker
  const { data: liveQuotaRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
    abi: STAKED_BROKER_REGISTRY_ABI,
    functionName: "getAvailableQuota",
    args: [activeBrokerAddress],
  });

  // Calculations
  const dealAmountBigInt = parseUsdc(dealAmountInput);
  const dealAmountNumber = parseFloat(dealAmountInput) || 0;
  const allowanceBigInt = (currentAllowance as bigint) || 0n;
  const isApproved = allowanceBigInt >= dealAmountBigInt && dealAmountBigInt > 0n;

  const liveQuotaNumber = liveQuotaRaw !== undefined ? Number(formatUsdc(liveQuotaRaw as bigint).replace(/,/g, "")) : selectedBroker.availableQuota;
  const isOverBrokerQuota = dealAmountNumber > liveQuotaNumber;

  const brokerFeeAmount = +((dealAmountNumber * brokerFeeBps) / 10000).toFixed(2);
  const protocolFeeAmount = +((dealAmountNumber * 30) / 10000).toFixed(2); // 0.30%
  const netSellerReceives = Math.max(0, +(dealAmountNumber - brokerFeeAmount - protocolFeeAmount).toFixed(2));

  // Role validations
  const isSellerSelf = address && sellerInput.toLowerCase() === address.toLowerCase();
  const isBrokerSelf = address && activeBrokerAddress.toLowerCase() === address.toLowerCase();
  const isSellerBrokerSame = sellerInput.toLowerCase() === activeBrokerAddress.toLowerCase();
  const hasRoleConflict = isSellerSelf || isBrokerSelf || isSellerBrokerSame;

  // ── Step 1: Approve USDC ──────────────────────────────────────────────
  const handleApprove = async () => {
    if (!address || dealAmountBigInt === 0n) return;
    try {
      setTxStatus({
        step: "awaiting_signature",
        actionTitle: "Phê Duyệt (Approve) Hạn Mức USDC",
      });

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.usdc,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.universalEscrow, dealAmountBigInt],
      });

      setTxStatus({
        step: "confirming",
        txHash: hash,
        actionTitle: "Phê Duyệt (Approve) Hạn Mức USDC",
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await refetchAllowance();
      setTxStatus({
        step: "success",
        txHash: hash,
        actionTitle: "Phê Duyệt (Approve) Hạn Mức USDC",
      });
      setTimeout(() => setTxStatus({ step: "idle" }), 2500);
    } catch (err: any) {
      setTxStatus({
        step: "error",
        errorMessage: parseContractError(err),
        actionTitle: "Phê Duyệt (Approve) Hạn Mức USDC",
      });
    }
  };

  // ── Step 2: Create Escrow ─────────────────────────────────────────────
  const handleCreateEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || hasRoleConflict || isOverBrokerQuota || !isApproved) return;

    try {
      setTxStatus({
        step: "awaiting_signature",
        actionTitle: "Khởi Tạo Két Sắt & Khóa Quỹ UniversalEscrow",
      });

      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.universalEscrow,
        abi: UNIVERSAL_ESCROW_ABI,
        functionName: "createEscrow",
        args: [
          sellerInput as `0x${string}`,
          activeBrokerAddress,
          dealAmountBigInt,
          BigInt(selectedDurationSeconds),
          BigInt(brokerFeeBps),
        ],
      });

      setTxStatus({
        step: "confirming",
        txHash: hash,
        actionTitle: "Khởi Tạo Két Sắt & Khóa Quỹ UniversalEscrow",
      });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        // Find EscrowCreated log event
        let createdId = "101";
        if (receipt.logs && receipt.logs.length > 0) {
          try {
            // Parse event or read counter
            for (const log of receipt.logs) {
              if (log.topics && log.topics[1]) {
                const parsedId = Number(BigInt(log.topics[1]));
                if (parsedId > 0) {
                  createdId = String(parsedId);
                  break;
                }
              }
            }
          } catch {}
        }

        // Save pact locally for instant seamless room view
        const newPactData = {
          id: createdId,
          buyer: address || currentUser?.walletAddress || "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
          buyerName: currentUser?.name || "Lê Minh Tuấn",
          seller: sellerInput,
          broker: activeBrokerAddress,
          brokerName: selectedBroker.name,
          amount: dealAmountInput,
          brokerFeeBps: brokerFeeBps,
          duration: selectedDurationSeconds,
          terms: handoverTerms,
          startTime: Math.floor(Date.now() / 1000),
          status: 0,
        };
        try {
          const existing = JSON.parse(localStorage.getItem("trustpact_custom_pacts") || "{}");
          existing[createdId] = newPactData;
          localStorage.setItem("trustpact_custom_pacts", JSON.stringify(existing));
        } catch {}

        setCreatedPactId(createdId);
        setCreatedTxHash(hash);
        setTxStatus({
          step: "success",
          txHash: hash,
          actionTitle: "Khởi Tạo Két Sắt & Khóa Quỹ UniversalEscrow",
        });

        // Trigger 2-Party Confirmation Modal
        setTimeout(() => {
          setTxStatus({ step: "idle" });
          setIsConfirmationModalOpen(true);
        }, 1200);
      } else {
        setCreatedPactId("101");
        setIsConfirmationModalOpen(true);
      }
    } catch (err: any) {
      setTxStatus({
        step: "error",
        errorMessage: parseContractError(err),
        actionTitle: "Khởi Tạo Két Sắt & Khóa Quỹ UniversalEscrow",
      });
    }
  };

  // Simulated Test Create for judges / testers without Fuji testnet tokens
  const handleSimulatedCreate = () => {
    const testId = String(Math.floor(100 + Math.random() * 900));
    const newPactData = {
      id: testId,
      buyer: address || currentUser?.walletAddress || "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
      buyerName: currentUser?.name || "Lê Minh Tuấn",
      seller: sellerInput,
      broker: activeBrokerAddress,
      brokerName: selectedBroker.name,
      amount: dealAmountInput,
      brokerFeeBps: brokerFeeBps,
      duration: selectedDurationSeconds,
      terms: handoverTerms,
      startTime: Math.floor(Date.now() / 1000),
      status: 0,
    };
    try {
      const existing = JSON.parse(localStorage.getItem("trustpact_custom_pacts") || "{}");
      existing[testId] = newPactData;
      localStorage.setItem("trustpact_custom_pacts", JSON.stringify(existing));
    } catch {}

    setCreatedPactId(testId);
    setCreatedTxHash("0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""));
    setIsConfirmationModalOpen(true);
  };

  const sellerReportCount = sellerScamData ? Number(sellerScamData[0]) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[#1E222D]">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#F1F5F9] uppercase tracking-wide">
            Khởi Tạo Hợp Đồng Ký Quỹ Ba Bên (UniversalEscrow)
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Bảo chứng dòng tiền bằng Smart Contract trên Avalanche Fuji C-Chain • Trọng tài GDTG khóa cọc bảo lãnh
          </p>
        </div>
        <span className="text-xs font-mono text-[#64748B]">Protocol Fee: 0.30%</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT PANE (7 COLS): CONFIGURATION ──────────────────────────────── */}
        <div className="lg:col-span-7 space-y-5">
          <form onSubmit={handleCreateEscrow} className="space-y-5">
            {/* 1. Seller Information */}
            <div className="rounded-lg panel-border bg-[#101217] p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E222D]">
                <span className="font-semibold uppercase tracking-wider text-[#F1F5F9] font-sans">
                  1. Thông Tin Đối Tác Bán (_seller)
                </span>
                <span className="text-[10px] text-[#64748B]">Người nhận thanh toán</span>
              </div>

              <div>
                <input
                  type="text"
                  value={sellerInput}
                  onChange={(e) => setSellerInput(e.target.value.trim())}
                  placeholder="0x..."
                  className="w-full bg-[#090A0D] border border-[#1E222D] focus:border-[#E84142] rounded-md px-3.5 py-2.5 text-xs font-mono text-[#F1F5F9] focus:outline-none"
                  required
                />

                {/* Inline Background Check Badge */}
                <div className="pt-2 flex flex-wrap items-center gap-2 font-sans text-xs">
                  {sellerReportCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-[11px] font-bold">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      CẢNH BÁO: Ví có {sellerReportCount} lượt tố cáo lừa đảo trên Sổ Đen L1!
                    </span>
                  ) : sellerSuccessRate !== undefined && Number(sellerSuccessRate) > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-[11px] font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Uy Tín SBT: {(Number(sellerSuccessRate) / 100).toFixed(1)}% Hoàn Thành
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#64748B]">
                      Chưa ghi nhận vi phạm trên Sổ Đen L1
                    </span>
                  )}
                </div>

                {/* Conflict Warnings */}
                {isSellerSelf && (
                  <span className="text-[11px] text-[#EF4444] block pt-1">
                    Lỗi: Địa chỉ Bên Bán không được trùng với ví Bên Mua (ví của bạn).
                  </span>
                )}
                {isSellerBrokerSame && (
                  <span className="text-[11px] text-[#EF4444] block pt-1">
                    Lỗi: Địa chỉ Bên Bán không được trùng với Trọng Tài GDTG.
                  </span>
                )}
              </div>
            </div>

            {/* 2. Broker Directory / Selector */}
            <div className="rounded-lg panel-border bg-[#101217] p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E222D]">
                <span className="font-semibold uppercase tracking-wider text-[#F1F5F9] font-sans">
                  2. Chỉ Định Trọng Tài GDTG (_broker)
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomBroker(!isCustomBroker)}
                  className="text-[11px] text-[#94A3B8] hover:text-[#F1F5F9] underline"
                >
                  {isCustomBroker ? "Chọn Từ Danh Bạ Bảo Chứng" : "Nhập Ví GDTG Riêng"}
                </button>
              </div>

              {!isCustomBroker ? (
                <div className="space-y-2">
                  {REGISTERED_BROKERS.map((b) => {
                    const isSelected = selectedBroker.id === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => setSelectedBroker(b)}
                        className={`p-3 rounded-md border cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-[#161922] border-[#E84142]"
                            : "bg-[#090A0D] border-[#1E222D] hover:border-[#64748B]"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-sans font-bold text-xs text-[#F1F5F9]">{b.name}</span>
                            <span className="px-1.5 py-0.2 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[9px] font-bold">
                              {b.badge}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#64748B] block">
                            Ví: {shortenAddress(b.address)} · ⭐ {b.rating} ({b.deals} kèo)
                          </span>
                        </div>

                        <div className="text-right sm:border-l sm:border-[#1E222D] sm:pl-3 shrink-0">
                          <span className="text-[10px] text-[#64748B] block">HẠN MỨC KHẢ DỤNG</span>
                          <span className="font-bold text-[#F1F5F9] tabular-nums">
                            {b.availableQuota.toLocaleString()} USDC
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={customBrokerAddress}
                    onChange={(e) => setCustomBrokerAddress(e.target.value.trim())}
                    placeholder="Nhập địa chỉ ví GDTG tùy chỉnh 0x..."
                    className="w-full bg-[#090A0D] border border-[#1E222D] focus:border-[#E84142] rounded-md px-3.5 py-2.5 text-xs font-mono text-[#F1F5F9] focus:outline-none"
                  />
                  <span className="text-[11px] text-[#64748B] block pt-1">
                    GDTG bắt buộc phải nạp cọc trước trên StakedBrokerRegistry để có hạn mức nhận kèo.
                  </span>
                </div>
              )}

              {/* Hard Quota Error Check */}
              {isOverBrokerQuota && (
                <div className="p-2.5 rounded bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-sans font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Hạn mức bảo lãnh khả dụng của GDTG ({liveQuotaNumber.toLocaleString()} USDC) không đủ cho giá trị kèo ({dealAmountNumber.toLocaleString()} USDC).
                  </span>
                </div>
              )}
            </div>

            {/* 3. Escrow Amount & Duration */}
            <div className="rounded-lg panel-border bg-[#101217] p-5 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E222D]">
                <span className="font-semibold uppercase tracking-wider text-[#F1F5F9] font-sans">
                  3. Giá Trị Ký Quỹ (_amount) &amp; Thời Hạn (_duration)
                </span>
                <span className="text-[11px] text-[#64748B]">
                  Ví bạn có: {formatUsdc(userUsdcBalance as bigint)} USDC
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block mb-1">
                  Số Tiền USDC Bên Mua Khóa Vào Két Sắt
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={dealAmountInput}
                    onChange={(e) => setDealAmountInput(e.target.value)}
                    className="w-full bg-[#090A0D] border border-[#1E222D] focus:border-[#E84142] rounded-md pl-3.5 pr-20 py-2.5 text-sm font-mono font-bold text-[#F1F5F9] focus:outline-none"
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDealAmountInput(userUsdcBalance ? formatUnits(userUsdcBalance as bigint, 6) : "1000")}
                      className="px-2 py-0.5 rounded bg-[#161922] border border-[#1E222D] text-[10px] font-mono text-[#E84142] font-semibold hover:bg-[#1E222D]"
                    >
                      MAX
                    </button>
                    <span className="text-xs font-bold text-[#F1F5F9] pr-1">USDC</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B] block mb-1.5">
                  Thời Gian Bàn Giao Tối Đa (Auto-Refund Time-lock)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 font-sans">
                  {[
                    { label: "2 Giờ", sec: 7200 },
                    { label: "24 Giờ", sec: 86400 },
                    { label: "3 Ngày", sec: 259200 },
                    { label: "7 Ngày", sec: 604800 },
                    { label: "30 Ngày", sec: 2592000 },
                  ].map((d) => (
                    <button
                      key={d.sec}
                      type="button"
                      onClick={() => setSelectedDurationSeconds(d.sec)}
                      className={`py-2 text-xs rounded border transition-colors ${
                        selectedDurationSeconds === d.sec
                          ? "bg-[#161922] border-[#E84142] text-[#F1F5F9] font-bold"
                          : "bg-[#090A0D] border-[#1E222D] text-[#94A3B8] hover:text-[#F1F5F9]"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] text-[#64748B] block pt-1 font-mono">
                  Quá thời hạn trên, nếu Seller hoặc GDTG chưa hoàn tất, Buyer có quyền tự rút 100% tiền về ví ngay.
                </span>
              </div>
            </div>

            {/* 4. Broker Commission Slider */}
            <div className="rounded-lg panel-border bg-[#101217] p-5 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#1E222D]">
                <span className="font-semibold uppercase tracking-wider text-[#F1F5F9] font-sans">
                  4. Thỏa Thuận Phí Trọng Tài GDTG (_brokerFeeBps)
                </span>
                <span className="text-xs font-bold text-[#F1F5F9]">
                  {(brokerFeeBps / 100).toFixed(2)}% ({brokerFeeBps} BPS)
                </span>
              </div>

              <input
                type="range"
                min="50"
                max="1000"
                step="25"
                value={brokerFeeBps}
                onChange={(e) => setBrokerFeeBps(Number(e.target.value))}
                className="w-full accent-[#E84142] cursor-pointer"
              />

              <div className="flex justify-between text-[11px] text-[#64748B]">
                <span>Tối thiểu: 0.50% (50 BPS)</span>
                <span>Mặc định: 1.50%</span>
                <span>Tối đa: 10.00% (1000 BPS)</span>
              </div>
            </div>

            {/* 5. Terms / Handover Specification */}
            <div className="rounded-lg panel-border bg-[#101217] p-5 space-y-2 font-mono text-xs">
              <span className="font-semibold uppercase tracking-wider text-[#F1F5F9] font-sans block">
                5. Điều Khoản Nghiệm Thu Bàn Giao
              </span>
              <textarea
                rows={3}
                value={handoverTerms}
                onChange={(e) => setHandoverTerms(e.target.value)}
                placeholder="Quy định rõ tiêu chí bàn giao hàng, quy trình kiểm định của GDTG..."
                className="w-full bg-[#090A0D] border border-[#1E222D] focus:border-[#E84142] rounded-md px-3.5 py-2 text-xs text-[#F1F5F9] focus:outline-none resize-none font-sans"
              />
            </div>
          </form>
        </div>

        {/* ── RIGHT PANE (5 COLS): STICKY LIVE RECEIPT & 2-STEP ENGINE ──────────── */}
        <div className="lg:col-span-5 sticky top-20 space-y-5">
          <div className="rounded-lg panel-border bg-[#101217] p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E222D]">
              <span className="font-semibold uppercase tracking-wider text-[#F1F5F9] font-sans">
                Bản Đối Soát On-Chain (Receipt)
              </span>
              <span className="text-[10px] text-[#64748B]">UniversalEscrow</span>
            </div>

            {/* Cryptographic Flow Diagram */}
            <div className="p-3 rounded-md bg-[#090A0D] border border-[#1E222D] space-y-2 font-sans text-xs">
              <span className="text-[10px] font-mono text-[#64748B] uppercase block">Luồng Ký Quỹ Ba Bên:</span>
              <div className="flex items-center justify-between text-center gap-1 text-[11px] font-mono">
                <div className="p-2 rounded bg-[#161922] border border-[#1E222D] flex-1">
                  <span className="text-[#64748B] block text-[9px]">BUYER</span>
                  <span className="text-[#F1F5F9] font-bold">Nạp Tiền</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                <div className="p-2 rounded bg-[#E84142]/10 border border-[#E84142]/30 flex-1">
                  <span className="text-[#E84142] block text-[9px]">KÉT SẮT</span>
                  <span className="text-[#F1F5F9] font-bold">Phong Tỏa</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                <div className="p-2 rounded bg-[#161922] border border-[#1E222D] flex-1">
                  <span className="text-[#64748B] block text-[9px]">SELLER</span>
                  <span className="text-[#10B981] font-bold">Giải Ngân</span>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#94A3B8] block text-center">
                Bảo lãnh bởi Quota của GDTG ({liveQuotaNumber.toLocaleString()} USDC)
              </span>
            </div>

            {/* Exact Financial Breakdown Table */}
            <div className="space-y-2.5 pt-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#94A3B8]">Tiền gốc nạp vào két sắt:</span>
                <span className="font-bold text-[#F1F5F9] tabular-nums">{dealAmountNumber.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between items-center text-[#94A3B8]">
                <span>Phí trọng tài GDTG ({(brokerFeeBps / 100).toFixed(2)}%):</span>
                <span className="text-[#F59E0B] tabular-nums">- {brokerFeeAmount.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between items-center text-[#94A3B8]">
                <span>Phí giao thức TrustPact (0.30%):</span>
                <span className="text-[#64748B] tabular-nums">- {protocolFeeAmount.toFixed(2)} USDC</span>
              </div>
              <div className="pt-2.5 border-t border-[#1E222D] flex justify-between items-center text-sm">
                <span className="font-sans font-bold text-[#F1F5F9]">Seller thực nhận (Net):</span>
                <span className="font-bold text-[#10B981] tabular-nums">{netSellerReceives.toFixed(2)} USDC</span>
              </div>
              <div className="flex justify-between items-center text-[11px] text-[#64748B] pt-1">
                <span>Hạn mức GDTG sẽ bị khóa:</span>
                <span className="text-[#F1F5F9] tabular-nums font-semibold">{dealAmountNumber.toFixed(2)} USDC</span>
              </div>
            </div>

            {/* 2-Step Execution Engine & Fast Sandbox */}
            <div className="pt-3 border-t border-[#1E222D] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B] font-sans block">
                  Thực Thi Giao Dịch:
                </span>
                <span className="text-[10px] text-[#F59E0B] font-mono">
                  {isApproved ? "✓ Đã Approve — Sẵn sàng ký tạo" : "Cần bấm Bước 1 trước"}
                </span>
              </div>

              {/* Step 1: Approve Button */}
              <button
                type="button"
                onClick={handleApprove}
                disabled={isApproved || dealAmountBigInt === 0n || txStatus.step === "confirming"}
                className={`w-full py-2.5 px-3 rounded-md text-xs font-sans font-semibold transition-all flex items-center justify-center gap-2 ${
                  isApproved
                    ? "bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] cursor-default"
                    : "bg-[#1E222D] hover:bg-[#282E3D] border border-[#E84142]/40 text-[#F1F5F9] shadow-sm hover:border-[#E84142]"
                }`}
              >
                {isApproved ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>✓ Bước 1: Đã Cấp Quyền (Approved) {formatUsdc(allowanceBigInt)} USDC</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-[#E84142] animate-pulse" />
                    <span>Bước 1: Bấm Cấp Quyền (Approve) {dealAmountNumber.toFixed(2)} USDC</span>
                  </>
                )}
              </button>

              {/* Step 2: Create Escrow Button */}
              <button
                type="button"
                onClick={isApproved ? handleCreateEscrow : handleApprove}
                disabled={isOverBrokerQuota || hasRoleConflict || txStatus.step === "confirming"}
                className={`w-full py-2.5 px-3 rounded-md text-xs font-sans font-bold transition-all flex items-center justify-center gap-2 ${
                  isApproved
                    ? "bg-[#E84142] hover:bg-[#D13637] text-white shadow-lg shadow-[#E84142]/30 cursor-pointer"
                    : "bg-[#161922] border border-[#1E222D] text-[#64748B] hover:text-[#94A3B8]"
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {isApproved
                    ? "Bước 2: Ký Giao Dịch & Khóa Tiền Vào Két Sắt"
                    : "Bước 2: Ký Giao Dịch (Mở khóa sau Bước 1)"}
                </span>
              </button>

              {/* Divider */}
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#1E222D]"></div>
                <span className="flex-shrink mx-2 text-[10px] uppercase font-mono text-[#64748B]">hoặc kiểm thử nhanh</span>
                <div className="flex-grow border-t border-[#1E222D]"></div>
              </div>

              {/* Fast Sandbox / Demo Mode Button - Prominent */}
              <button
                type="button"
                onClick={handleSimulatedCreate}
                className="w-full py-3 px-3 rounded-md text-xs font-sans font-bold bg-[#10B981]/15 hover:bg-[#10B981]/25 border border-[#10B981]/40 text-[#10B981] transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99]"
                title="Khởi tạo đối soát 2 bên và mở phòng giao dịch ngay để kiểm thử nhanh mà không cần ví hay gas"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Mở Phòng Giao Dịch Ngay (Thử Nghiệm Đối Soát 2 Bên)</span>
              </button>
              <span className="text-[10px] text-center text-[#64748B] block font-sans">
                (Khuyên dùng để kiểm tra ngay giao diện Biên Bản Xác Nhận &amp; Phòng Giao Dịch mà không cần nạp gas Fuji)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Party Confirmation & Trading Room Transition Modal */}
      <PactConfirmationModal
        isOpen={isConfirmationModalOpen}
        pactId={createdPactId}
        buyerAddress={address || currentUser?.walletAddress || "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001"}
        buyerName={currentUser?.name || "Lê Minh Tuấn"}
        sellerAddress={sellerInput}
        brokerAddress={activeBrokerAddress}
        brokerName={selectedBroker.name}
        amount={dealAmountInput}
        netSellerAmount={netSellerReceives}
        durationHours={Math.round(selectedDurationSeconds / 3600)}
        txHash={createdTxHash}
        onEnterRoom={() => {
          setIsConfirmationModalOpen(false);
          router.push(`/pact/${createdPactId}`);
        }}
      />

      <TransactionFeedback
        status={txStatus}
        onClose={() => setTxStatus({ step: "idle" })}
      />
    </div>
  );
}
