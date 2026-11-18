"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import {
  Lock,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Wallet,
  Check,
  Search,
  Star,
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
import { useLanguage } from "@/src/context/LanguageContext";
import { ShimmerButton } from "@/src/components/ui/ShimmerButton";

interface BrokerItem {
  id: string;
  name: string;
  username: string;
  address: `0x${string}`;
  badge: string;
  stakedAmount: number;
  availableQuota: number;
  successRate: number;
  rating: number;
  deals: number;
  recommendedFeeBps: number;
  telegram?: string;
}

function getInitials(name: string): string {
  const clean = name.split("(")[0].trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const BROKER_DIRECTORY: BrokerItem[] = [
  {
    id: "TP-3003",
    name: "Nguyễn Nam (Giám Định Viên Senior · On-Chain Active)",
    username: "nam_broker",
    address: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
    badge: "Master Escrow · 15 USDC Aave V3 Staked",
    stakedAmount: 15,
    availableQuota: 9,
    successRate: 100,
    rating: 5.0,
    deals: 4,
    recommendedFeeBps: 150,
    telegram: "@nam_escrow_official",
  },
  {
    id: "TP-3001",
    name: "TrustPact Sentinel (GDTG Quản Trị Hệ Thống)",
    username: "trustpact_master_broker",
    address: "0xe85eE178537fa93392d82114A33f6B204Ea7c6aE",
    badge: "Protocol Admin · Chưa thế chấp",
    stakedAmount: 0,
    availableQuota: 0,
    successRate: 100,
    rating: 5.0,
    deals: 0,
    recommendedFeeBps: 150,
    telegram: "@TrustPact_Sentinel_bot",
  },
  {
    id: "TP-3004",
    name: "Trần Tuấn (Chuyên Viên Mã Nguồn)",
    username: "trantuan_broker",
    address: "0x44B1492bC78E12a899Ad34De91eF11B12E7a889B",
    badge: "Tech Auditor · Chưa thế chấp",
    stakedAmount: 0,
    availableQuota: 0,
    successRate: 100,
    rating: 5.0,
    deals: 0,
    recommendedFeeBps: 120,
    telegram: "@trantuan_escrow",
  },
  {
    id: "TP-2002",
    name: "Hoàng Minh (OTC Custodian)",
    username: "hoangminh_otc",
    address: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
    badge: "Senior Custodian · Chưa thế chấp",
    stakedAmount: 0,
    availableQuota: 0,
    successRate: 99.4,
    rating: 4.9,
    deals: 0,
    recommendedFeeBps: 150,
    telegram: "@hoangminh_otc",
  },
  {
    id: "TP-3005",
    name: "Đặng Anh Thư (Digital Asset Broker)",
    username: "anhthu_broker",
    address: "0x77D1492bC78E12a899Ad34De91eF11B12E7a889C",
    badge: "Digital Asset Specialist · Chưa thế chấp",
    stakedAmount: 0,
    availableQuota: 0,
    successRate: 98.8,
    rating: 4.8,
    deals: 0,
    recommendedFeeBps: 180,
    telegram: "@anhthu_pact",
  },
];

function CreateEscrowPactContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address } = useAccount();
  const {
    currentUser,
    registeredUsers,
    searchUsers,
    findUserByQuery,
    setIsLinkWalletModalOpen,
  } = useAuth();
  const { t } = useLanguage();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  // Modal State
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [createdPactId, setCreatedPactId] = useState("101");
  const [createdTxHash, setCreatedTxHash] = useState<string | undefined>(undefined);
  const [isSimulatedApproved, setIsSimulatedApproved] = useState(false);

  // Form State
  const initialSeller = searchParams.get("seller") || "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c";
  const [sellerInput, setSellerInput] = useState(initialSeller);
  const [showSellerSuggestions, setShowSellerSuggestions] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState<BrokerItem>(BROKER_DIRECTORY[0]);
  const [brokerSearchQuery, setBrokerSearchQuery] = useState("");
  const [filterEligibleOnly, setFilterEligibleOnly] = useState(false);
  const [customBrokerAddress, setCustomBrokerAddress] = useState("");
  const [isCustomBroker, setIsCustomBroker] = useState(false);

  const [dealAmountInput, setDealAmountInput] = useState("2");
  const [selectedDurationSeconds, setSelectedDurationSeconds] = useState(86400);
  const [brokerFeeBps, setBrokerFeeBps] = useState(150);
  const [handoverTerms, setHandoverTerms] = useState(
    "Bên bán bàn giao khóa API và quyền quản trị tài sản số trong vòng 24 giờ. GDTG kiểm định trước khi xác nhận giải ngân."
  );

  const [txStatus, setTxStatus] = useState<TxStatus>({ step: "idle" });

  // ── Web3 Reads
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

  const activeBrokerAddress: `0x${string}` =
    isCustomBroker && customBrokerAddress.startsWith("0x")
      ? (customBrokerAddress as `0x${string}`)
      : selectedBroker.address;

  const matchedSellerUser = findUserByQuery(sellerInput);
  const sellerSuggestions = searchUsers(sellerInput).filter(
    (u) => !address || (u.walletAddress && u.walletAddress.toLowerCase() !== address.toLowerCase())
  );

  const { data: sellerScamData } = useReadContract({
    address: CONTRACT_ADDRESSES.scamRegistryL1,
    abi: SCAM_REGISTRY_L1_ABI,
    functionName: "checkScam",
    args: sellerInput.trim() ? [sellerInput.trim()] : undefined,
    query: { enabled: sellerInput.trim().length > 5 },
  });

  const { data: sellerSuccessRate } = useReadContract({
    address: CONTRACT_ADDRESSES.trustPassportSBT,
    abi: TRUST_PASSPORT_SBT_ABI,
    functionName: "getSuccessRate",
    args:
      sellerInput.startsWith("0x") && sellerInput.length === 42
        ? [sellerInput as `0x${string}`]
        : undefined,
    query: { enabled: sellerInput.startsWith("0x") && sellerInput.length === 42 },
  });

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
  const isApproved =
    isSimulatedApproved || (allowanceBigInt >= dealAmountBigInt && dealAmountBigInt > 0n);

  const parsedLiveQuota =
    liveQuotaRaw !== undefined
      ? Number(formatUsdc(liveQuotaRaw as bigint).replace(/,/g, ""))
      : selectedBroker.availableQuota;
  const liveQuotaNumber = parsedLiveQuota;
  const isOverBrokerQuota = dealAmountNumber > liveQuotaNumber;

  const brokerFeeAmount = +((dealAmountNumber * brokerFeeBps) / 10000).toFixed(2);
  const protocolFeeAmount = +((dealAmountNumber * 30) / 10000).toFixed(2);
  const netSellerReceives = Math.max(
    0,
    +(dealAmountNumber - brokerFeeAmount - protocolFeeAmount).toFixed(2)
  );

  const isSellerSelf = Boolean(address && sellerInput.toLowerCase() === address.toLowerCase());
  const isBrokerSelf = Boolean(
    address && activeBrokerAddress.toLowerCase() === address.toLowerCase()
  );
  const isSellerBrokerSame = sellerInput.toLowerCase() === activeBrokerAddress.toLowerCase();
  const hasRoleConflict = isSellerSelf || isBrokerSelf || isSellerBrokerSame;

  const filteredBrokers = BROKER_DIRECTORY.filter((b) => {
    const brokerQuota = b.id === selectedBroker.id && !isCustomBroker ? liveQuotaNumber : b.availableQuota;
    if (filterEligibleOnly && brokerQuota < dealAmountNumber) {
      return false;
    }
    if (!brokerSearchQuery.trim()) return true;
    const q = brokerSearchQuery.toLowerCase().trim();
    return (
      b.name.toLowerCase().includes(q) ||
      b.username.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q) ||
      (b.telegram && b.telegram.toLowerCase().includes(q))
    );
  });

  const bestRecommendedBroker =
    BROKER_DIRECTORY.find((b) => b.availableQuota >= dealAmountNumber && b.successRate === 100) ||
    BROKER_DIRECTORY[0];

  // ── Step 1: Approve USDC
  const handleApprove = async () => {
    if (currentUser && (!currentUser.isWalletLinked || !address)) {
      setIsLinkWalletModalOpen(true);
      return;
    }

    if (dealAmountBigInt === 0n) {
      setTxStatus({
        step: "error",
        actionTitle: t("Cấp quyền hạn mức USDC", "Approve USDC Allowance"),
        errorMessage: t(
          "Vui lòng nhập giá trị ký quỹ lớn hơn 0.",
          "Please enter an escrow amount greater than 0."
        ),
      });
      return;
    }

    if (!address) {
      setTxStatus({
        step: "error",
        actionTitle: t("Chưa kết nối ví Web3", "Wallet Not Connected"),
        errorMessage: t(
          "Vui lòng kết nối ví Web3 (MetaMask / Core Wallet) mạng Avalanche Fuji để cấp quyền hạn mức USDC.",
          "Please connect your Web3 wallet on Avalanche Fuji to approve USDC allowance."
        ),
      });
      return;
    }

    try {
      setTxStatus({
        step: "awaiting_signature",
        actionTitle: t("1. Cấp quyền hạn mức USDC", "1. Approving USDC Allowance"),
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
        actionTitle: t("Đang xác nhận cấp quyền USDC trên Fuji...", "Confirming Approval on Fuji..."),
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await refetchAllowance();
      setIsSimulatedApproved(true);
      setTxStatus({
        step: "success",
        txHash: hash,
        actionTitle: t(
          "Đã cấp quyền USDC thành công · Sẵn sàng khởi tạo hợp đồng",
          "USDC Approved · Ready to create contract"
        ),
      });
      setTimeout(() => setTxStatus({ step: "idle" }), 2000);
    } catch (err: any) {
      setTxStatus({
        step: "error",
        actionTitle: t("Cấp quyền hạn mức USDC", "Approve USDC Allowance"),
        errorMessage: parseContractError(err),
      });
    }
  };

  // ── Step 2: Create Escrow
  const handleCreateEscrow = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (currentUser && (!currentUser.isWalletLinked || !address)) {
      setIsLinkWalletModalOpen(true);
      return;
    }
    if (!isApproved) {
      handleApprove();
      return;
    }
    if (hasRoleConflict || isOverBrokerQuota) return;

    if (!address) {
      handleSimulatedCreate();
      return;
    }

    try {
      setTxStatus({
        step: "awaiting_signature",
        actionTitle: "2. Khởi tạo hợp đồng ký quỹ UniversalEscrow",
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
        actionTitle: "2. Khởi tạo hợp đồng ký quỹ UniversalEscrow",
      });

      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        let createdId = "4";
        if (receipt.logs && receipt.logs.length > 0) {
          try {
            const escrowAddrLower = CONTRACT_ADDRESSES.universalEscrow.toLowerCase();
            for (const log of receipt.logs) {
              if (
                log.address &&
                log.address.toLowerCase() === escrowAddrLower &&
                log.topics &&
                log.topics.length >= 4 &&
                log.topics[1]
              ) {
                const parsedId = Number(BigInt(log.topics[1]));
                if (parsedId > 0) {
                  createdId = String(parsedId);
                  break;
                }
              }
            }
          } catch {}
        }

        const newPactData = {
          id: createdId,
          buyer: address || currentUser?.walletAddress || "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
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

        try {
          await fetch("/api/pacts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: createdId,
              txHash: hash,
              buyer: newPactData.buyer,
              seller: newPactData.seller,
              broker: newPactData.broker,
              amount: newPactData.amount,
              brokerFeeBps: newPactData.brokerFeeBps,
              duration: newPactData.duration,
            }),
          });
        } catch {}

        setCreatedPactId(createdId);
        setCreatedTxHash(hash);
        setTxStatus({
          step: "success",
          txHash: hash,
          actionTitle: "2. Khởi tạo hợp đồng ký quỹ UniversalEscrow",
        });

        setTimeout(() => {
          setTxStatus({ step: "idle" });
          setIsConfirmationModalOpen(true);
        }, 1200);
      } else {
        const fallbackId = `10${Math.floor(Math.random() * 89 + 10)}`;
        setCreatedPactId(fallbackId);
        setIsConfirmationModalOpen(true);
      }
    } catch (err: any) {
      setTxStatus({
        step: "error",
        errorMessage: parseContractError(err),
        actionTitle: "2. Khởi tạo hợp đồng ký quỹ UniversalEscrow",
      });
    }
  };

  const handleSimulatedCreate = () => {
    const testId = String(Math.floor(100 + Math.random() * 900));
    const newPactData = {
      id: testId,
      buyer: address || currentUser?.walletAddress || "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
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
    setCreatedTxHash(
      "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
    );
    setIsConfirmationModalOpen(true);
  };

  const sellerReportCount = sellerScamData ? Number(sellerScamData[0]) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── CLEAN BANKING HEADER ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              href="/pact"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Danh sách giao dịch</span>
            </Link>
            <span className="text-slate-700">/</span>
            <span className="text-xs font-mono text-slate-400">UniversalEscrow · Fuji</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            {t("Khởi tạo hợp đồng ký quỹ 3 bên", "Create 3-Party Escrow Contract")}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-lg bg-[#111827] border border-slate-800 text-slate-300 font-mono text-xs">
            Phí giao thức: <strong className="text-slate-100">0.30%</strong>
          </span>
        </div>
      </div>

      {/* ── WALLET LINKING PROMPT (FOR EMAIL ACCOUNTS) ───────────────────── */}
      {currentUser &&
        (!currentUser.isWalletLinked ||
          !address ||
          currentUser.walletAddress === "0x0000000000000000000000000000000000000000") && (
          <div className="p-4 rounded-xl bg-[#111827] border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-100 text-sm">
                    {currentUser.email ? `Tài khoản: ${currentUser.email}` : "Chưa liên kết ví Web3"}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/25 font-medium">
                    Yêu cầu ký giao dịch On-Chain
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Vui lòng liên kết ví MetaMask hoặc Core Wallet để cấp quyền USDC và khởi tạo hợp đồng UniversalEscrow.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsLinkWalletModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 border border-blue-500/30 text-white font-medium text-xs whitespace-nowrap flex items-center justify-center gap-2 transition-colors self-start sm:self-auto"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Liên kết ví Web3</span>
            </button>
          </div>
        )}

      {/* ── 2-COLUMN BANKING FORM (LEFT 7 COLS · RIGHT 5 COLS) ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT PANE (7 COLS): CONFIGURATION ─────────────────────────── */}
        <div className="lg:col-span-7 space-y-5">
          <form onSubmit={handleCreateEscrow} className="space-y-5">
            {/* SECTION 1: COUNTERPARTY SELLER */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold flex items-center justify-center">
                    01
                  </span>
                  <h2 className="text-sm font-bold text-slate-100">
                    {t("Đối tác nhận thanh toán (Bên bán)", "Counterparty Seller")}
                  </h2>
                </div>
                <span className="text-xs font-mono text-slate-400">Địa chỉ 0x / @username</span>
              </div>

              <div className="space-y-3">
                <div className="relative">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={sellerInput}
                      onChange={(e) => {
                        setSellerInput(e.target.value.trim());
                        setShowSellerSuggestions(true);
                      }}
                      onFocus={() => setShowSellerSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSellerSuggestions(false), 180)}
                      placeholder={t(
                        "Nhập địa chỉ ví 0x..., @username hoặc mã TP-...",
                        "Enter 0x address, @username or TP-..."
                      )}
                      className="w-full rounded-lg bg-[#0B0F17] border border-slate-700 focus:border-blue-500 focus:outline-none pl-10 pr-3.5 py-2.5 text-sm font-mono text-slate-100 placeholder:text-slate-500 transition-colors"
                      required
                    />
                  </div>

                  {/* Verified Members Autocomplete Dropdown */}
                  {showSellerSuggestions && sellerSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-[#111827] border border-slate-700 rounded-xl shadow-2xl p-1.5 z-30 max-h-56 overflow-y-auto">
                      <div className="px-2.5 py-1 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                        {t("Đối tác đã xác thực SBT", "SBT Verified Partners")}
                      </div>
                      {sellerSuggestions.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setSellerInput(u.walletAddress || u.username);
                            setShowSellerSuggestions(false);
                          }}
                          className="w-full p-2.5 rounded-lg text-left hover:bg-slate-800/80 flex items-center justify-between transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
                              {getInitials(u.name)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-slate-100">{u.name}</span>
                                <span className="text-xs text-blue-400 font-mono">@{u.username}</span>
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono block">
                                {u.id} · {u.walletAddress ? shortenAddress(u.walletAddress) : "Chưa liên kết ví"}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-blue-400 shrink-0 ml-2">
                            {t("Chọn", "Select")}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Pick Sellers */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-slate-400">{t("Chọn nhanh:", "Quick select:")}</span>
                  {registeredUsers
                    .filter((u) => u.role === "SELLER")
                    .map((seller) => {
                      const active =
                        seller.walletAddress &&
                        sellerInput.toLowerCase() === seller.walletAddress.toLowerCase();
                      return (
                        <button
                          key={seller.id}
                          type="button"
                          onClick={() => {
                            setSellerInput(seller.walletAddress || seller.username);
                            setShowSellerSuggestions(false);
                          }}
                          className={`px-2.5 py-1 rounded-md transition-colors border text-xs ${
                            active
                              ? "bg-blue-600/15 border-blue-500/40 text-blue-300 font-medium"
                              : "bg-[#0B0F17] border-slate-800 text-slate-300 hover:border-slate-700"
                          }`}
                        >
                          {seller.name.split("(")[0].trim()} (@{seller.username})
                        </button>
                      );
                    })}
                </div>

                {/* Matched Partner Verification Card */}
                {matchedSellerUser && (
                  <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-emerald-500/25 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
                        {getInitials(matchedSellerUser.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-xs text-slate-100">
                            {matchedSellerUser.name}
                          </span>
                          <span className="text-xs text-emerald-400 font-mono">
                            @{matchedSellerUser.username}
                          </span>
                          <span className="text-[11px] font-mono text-slate-300 bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded">
                            {matchedSellerUser.id}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono block mt-0.5">
                          {shortenAddress(matchedSellerUser.walletAddress)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-emerald-400 font-semibold inline-flex items-center gap-1 justify-end">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{t("SBT Đã xác thực", "SBT Verified")}</span>
                      </span>
                      <span className="text-xs text-slate-400 block">
                        <strong className="font-mono text-slate-200 tabular-nums">
                          {matchedSellerUser.successRate}%
                        </strong>{" "}
                        hoàn tất
                      </span>
                    </div>
                  </div>
                )}

                {/* Live On-Chain ScamRegistryL1 & TrustPassport Check */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {sellerReportCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 font-medium">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>
                        {t(
                          `Cảnh báo: Địa chỉ có ${sellerReportCount} bản ghi vi phạm trên ScamRegistryL1`,
                          `Warning: ${sellerReportCount} violation records on ScamRegistryL1`
                        )}
                      </span>
                    </span>
                  ) : sellerSuccessRate !== undefined && Number(sellerSuccessRate) > 0 ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>
                        {t(
                          `Điểm tín nhiệm On-Chain: ${(Number(sellerSuccessRate) / 100).toFixed(1)}%`,
                          `On-Chain Trust Score: ${(Number(sellerSuccessRate) / 100).toFixed(1)}%`
                        )}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>
                        {t(
                          "Đối soát tự động: 0 bản ghi vi phạm trên ScamRegistryL1",
                          "Auto-check: 0 violations on ScamRegistryL1"
                        )}
                      </span>
                    </span>
                  )}
                </div>

                {isSellerSelf && (
                  <p className="text-xs text-red-400 font-medium">
                    {t(
                      "Lỗi: Địa chỉ Bên bán không được trùng với ví Bên mua.",
                      "Error: Seller address cannot equal Buyer wallet."
                    )}
                  </p>
                )}
                {isSellerBrokerSame && (
                  <p className="text-xs text-red-400 font-medium">
                    {t(
                      "Lỗi: Địa chỉ Bên bán không được trùng với GDTG bảo chứng.",
                      "Error: Seller address cannot equal Broker address."
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* SECTION 2: GDTG SELECTION WITH LIVE ON-CHAIN QUOTA */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold flex items-center justify-center">
                    02
                  </span>
                  <h2 className="text-sm font-bold text-slate-100">
                    {t("Chỉ định GDTG bảo chứng", "Select Escrow Broker (GDTG)")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomBroker(!isCustomBroker)}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  {isCustomBroker
                    ? t("Chọn từ danh bạ GDTG", "Select from directory")
                    : t("Nhập địa chỉ GDTG tùy chỉnh", "Custom broker address")}
                </button>
              </div>

              {!isCustomBroker ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Search className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={brokerSearchQuery}
                        onChange={(e) => setBrokerSearchQuery(e.target.value)}
                        placeholder={t(
                          "Tìm GDTG theo tên, @username hoặc địa chỉ 0x...",
                          "Search GDTG by name, @username or 0x..."
                        )}
                        className="w-full rounded-lg bg-[#0B0F17] border border-slate-800 focus:border-blue-500 focus:outline-none pl-10 pr-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 transition-colors"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFilterEligibleOnly(!filterEligibleOnly)}
                      className={`px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors shrink-0 flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        filterEligibleOnly
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-[#0B0F17] border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{t("Đủ hạn mức bảo lãnh", "Eligible Quota Only")}</span>
                    </button>
                  </div>

                  {/* Flat Banking GDTG Directory List */}
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {filteredBrokers.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-800 rounded-lg bg-[#0B0F17]">
                        {t("Không tìm thấy GDTG phù hợp với bộ lọc.", "No matching brokers found.")}
                      </div>
                    ) : (
                      filteredBrokers.map((b) => {
                        const isSelected = selectedBroker.id === b.id;
                        const displayQuota = isSelected ? liveQuotaNumber : b.availableQuota;
                        const isEligible = displayQuota >= dealAmountNumber && displayQuota > 0;
                        const isBest = b.id === bestRecommendedBroker.id;

                        return (
                          <div
                            key={b.id}
                            onClick={() => {
                              setSelectedBroker(b);
                              if (b.recommendedFeeBps) setBrokerFeeBps(b.recommendedFeeBps);
                            }}
                            className={`p-3.5 rounded-lg border cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isSelected
                                ? "bg-blue-600/10 border-blue-500/50"
                                : !isEligible
                                ? "bg-[#0B0F17] border-slate-800/80 opacity-65 hover:opacity-95"
                                : "bg-[#0B0F17] border-slate-800/80 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 border ${
                                  isSelected
                                    ? "bg-blue-600 text-white border-blue-500"
                                    : "bg-slate-800 text-slate-200 border-slate-700"
                                }`}
                              >
                                {getInitials(b.name)}
                              </div>

                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-xs text-slate-100">
                                    {b.name}
                                  </span>
                                  {isBest && (
                                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/25 text-[10px] font-semibold">
                                      Đề xuất
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                                  <span className="font-mono">{shortenAddress(b.address)}</span>
                                  <span className="text-slate-700">·</span>
                                  <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                    <span className="font-mono tabular-nums">{b.rating.toFixed(1)}</span>
                                    <span className="text-slate-400">({b.deals} giao dịch)</span>
                                  </span>
                                  <span className="text-slate-700">·</span>
                                  <span>
                                    Phí:{" "}
                                    <strong className="font-mono text-slate-200 tabular-nums">
                                      {(b.recommendedFeeBps / 100).toFixed(2)}%
                                    </strong>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-left sm:text-right sm:border-l sm:border-slate-800 sm:pl-4 shrink-0 pl-12">
                              <span className="text-[11px] text-slate-400 block">
                                Hạn mức khả dụng
                              </span>
                              <div className="flex items-center sm:justify-end gap-2 mt-0.5">
                                <span className="font-bold text-slate-100 font-mono text-xs tabular-nums whitespace-nowrap">
                                  {displayQuota.toLocaleString("en-US")} USDC
                                </span>
                                {isEligible ? (
                                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25 whitespace-nowrap">
                                    Đủ hạn mức
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/25 whitespace-nowrap">
                                    Thiếu hạn mức
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={customBrokerAddress}
                    onChange={(e) => setCustomBrokerAddress(e.target.value.trim())}
                    placeholder="Nhập địa chỉ ví GDTG tùy chỉnh (0x...)"
                    className="w-full rounded-lg bg-[#0B0F17] border border-slate-700 focus:border-blue-500 focus:outline-none px-3.5 py-2.5 text-sm font-mono text-slate-100 placeholder:text-slate-500"
                  />
                  <span className="text-xs text-slate-400 block">
                    GDTG được chỉ định phải có tài sản thế chấp hợp lệ trên StakedBrokerRegistry.
                  </span>
                </div>
              )}

              {isOverBrokerQuota && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>
                    Hạn mức khả dụng của GDTG ({liveQuotaNumber.toLocaleString("en-US")} USDC) thấp hơn giá trị giao dịch ({dealAmountNumber.toLocaleString("en-US")} USDC). Vui lòng chọn GDTG có hạn mức thế chấp phù hợp.
                  </span>
                </div>
              )}

              {isBrokerSelf && (
                <p className="text-xs text-red-400 font-medium">
                  Lỗi: Ví GDTG bảo chứng không được trùng với ví Bên mua đang kết nối.
                </p>
              )}
            </div>

            {/* SECTION 3: AMOUNT, DURATION, COMMISSION & HANDOVER TERMS */}
            <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 text-slate-200 font-mono text-xs font-bold flex items-center justify-center">
                    03
                  </span>
                  <h2 className="text-sm font-bold text-slate-100">
                    Giá trị ký quỹ &amp; Điều khoản thực hiện
                  </h2>
                </div>
                <span className="text-xs text-slate-400">
                  Số dư khả dụng:{" "}
                  <strong className="font-mono text-slate-100 tabular-nums">
                    {formatUsdc(userUsdcBalance as bigint)} USDC
                  </strong>
                </span>
              </div>

              {/* Amount Input */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 block">
                  Số tiền ký quỹ (USDC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    value={dealAmountInput}
                    onChange={(e) => setDealAmountInput(e.target.value)}
                    className="w-full rounded-lg bg-[#0B0F17] border border-slate-700 focus:border-blue-500 focus:outline-none pl-4 pr-28 py-3 text-lg font-mono font-bold text-slate-100 tabular-nums"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDealAmountInput(
                          userUsdcBalance && Number(userUsdcBalance) > 0
                            ? formatUnits(userUsdcBalance as bigint, 6)
                            : "9"
                        )
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-blue-400 font-semibold transition-colors"
                    >
                      MAX
                    </button>
                    <span className="text-xs font-mono font-semibold text-slate-300">USDC</span>
                  </div>
                </div>

                {/* Preset Amount Chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  {[2, 5, 9, 100, 500].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDealAmountInput(String(preset))}
                      className={`px-2.5 py-1 rounded-md text-xs font-mono tabular-nums transition-colors border ${
                        Number(dealAmountInput) === preset
                          ? "bg-blue-600/15 border-blue-500/40 text-blue-300 font-semibold"
                          : "bg-[#0B0F17] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      {preset.toLocaleString("en-US")} USDC
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300 block">
                  Thời hạn bàn giao tối đa (Auto-Refund Timelock)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { label: "2 giờ", sec: 7200 },
                    { label: "24 giờ", sec: 86400 },
                    { label: "3 ngày", sec: 259200 },
                    { label: "7 ngày", sec: 604800 },
                    { label: "30 ngày", sec: 2592000 },
                  ].map((d) => (
                    <button
                      key={d.sec}
                      type="button"
                      onClick={() => setSelectedDurationSeconds(d.sec)}
                      className={`py-2 text-xs rounded-lg font-medium transition-colors border ${
                        selectedDurationSeconds === d.sec
                          ? "bg-blue-600/15 border-blue-500/50 text-blue-300 font-semibold"
                          : "bg-[#0B0F17] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  Khi quá thời hạn trên mà hợp đồng chưa hoàn tất, Bên mua có quyền rút lại 100% tiền ký quỹ từ Smart Contract.
                </p>
              </div>

              {/* Broker Fee Slider */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-medium text-slate-300">
                    {t("Tỷ lệ phí dịch vụ GDTG", "Broker Fee Rate")}
                  </label>
                  <span className="px-2.5 py-0.5 rounded bg-[#0B0F17] border border-slate-800 font-mono font-semibold text-slate-200 tabular-nums">
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
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>0.50%</span>
                  <span>Tiêu chuẩn: 1.50%</span>
                  <span>10.00%</span>
                </div>
              </div>

              {/* Handover Terms */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-medium text-slate-300 block">
                  {t("Nội dung & Điều khoản nghiệm thu", "Transaction Scope & Inspection Terms")}
                </label>
                <textarea
                  rows={3}
                  value={handoverTerms}
                  onChange={(e) => setHandoverTerms(e.target.value)}
                  placeholder={t(
                    "Mô tả chi tiết tài sản bàn giao và tiêu chí nghiệm thu...",
                    "Specify asset details and inspection criteria..."
                  )}
                  className="w-full rounded-lg bg-[#0B0F17] border border-slate-700 focus:border-blue-500 focus:outline-none p-3 text-sm text-slate-100 placeholder:text-slate-500 resize-none leading-relaxed"
                />
              </div>
            </div>
          </form>
        </div>

        {/* ── RIGHT PANE (5 COLS): FEE BREAKDOWN & 2-STEP EXECUTION ────── */}
        <div className="lg:col-span-5 sticky top-24 space-y-5">
          <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
            {/* Clean Flat Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-[#0B0F17]/50">
              <div>
                <h3 className="text-sm font-bold text-slate-100">
                  {t("Bảng kê chi phí & Thực thi", "Settlement Breakdown & Execution")}
                </h3>
                <span className="text-xs text-slate-400">
                  Kiểm tra thông tin đối soát trước khi ký giao dịch
                </span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <Lock className="w-4 h-4" />
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* 3-Node Flow Summary */}
              <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-center gap-2 text-xs">
                  <div className="p-2 rounded-md bg-[#111827] border border-slate-800 flex-1">
                    <span className="text-slate-500 block text-[10px] font-mono uppercase">
                      Bên mua
                    </span>
                    <span className="text-slate-200 font-semibold mt-0.5 block">Ký quỹ</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <div className="p-2 rounded-md bg-blue-500/10 border border-blue-500/30 flex-1">
                    <span className="text-blue-400 block text-[10px] font-mono font-semibold uppercase">
                      Escrow
                    </span>
                    <span className="text-slate-100 font-semibold mt-0.5 block">Bảo chứng</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <div className="p-2 rounded-md bg-emerald-500/10 border border-emerald-500/25 flex-1">
                    <span className="text-emerald-400 block text-[10px] font-mono uppercase">
                      Bên bán
                    </span>
                    <span className="text-emerald-300 font-semibold mt-0.5 block">Giải ngân</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Hạn mức GDTG khả dụng</span>
                  <strong className="font-mono text-slate-200 tabular-nums">
                    {liveQuotaNumber.toLocaleString("en-US")} USDC
                  </strong>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800/80 space-y-2.5 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>{t("Giá trị ký quỹ", "Escrow Principal")}</span>
                  <span className="font-semibold font-mono text-slate-100 tabular-nums text-sm">
                    {dealAmountNumber.toFixed(2)} USDC
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>
                    {t("Phí GDTG", "Broker Fee")} ({(brokerFeeBps / 100).toFixed(2)}%)
                  </span>
                  <span className="font-mono text-amber-400 tabular-nums">
                    - {brokerFeeAmount.toFixed(2)} USDC
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-400">
                  <span>{t("Phí giao thức (0.30%)", "Protocol Fee (0.30%)")}</span>
                  <span className="font-mono text-slate-300 tabular-nums">
                    - {protocolFeeAmount.toFixed(2)} USDC
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-100 text-sm block">
                      {t("Thực nhận Bên bán", "Net Seller Payout")}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Giải ngân khi đủ 2/2 xác nhận
                    </span>
                  </div>
                  <span className="font-bold font-mono text-lg text-emerald-400 tabular-nums">
                    {netSellerReceives.toFixed(2)} USDC
                  </span>
                </div>
              </div>

              {/* 2-Step Execution Summary */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-semibold">
                    {t("Quy trình thực thi (2 bước)", "2-Step On-Chain Execution")}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 font-mono font-semibold ${
                      isApproved ? "text-emerald-400" : "text-slate-400"
                    }`}
                  >
                    {isApproved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t("Đã cấp quyền", "Approved")}</span>
                      </>
                    ) : (
                      <span>{t("Bước 1 / 2", "Step 1 / 2")}</span>
                    )}
                  </span>
                </div>

                <ShimmerButton
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproved || dealAmountBigInt === 0n || txStatus.step === "confirming"}
                  variant={isApproved ? "success" : "primary"}
                  className="w-full py-2.5 text-sm"
                >
                  {isApproved ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t("1. Đã cấp quyền USDC", "1. USDC Approved")}</span>
                    </>
                  ) : (
                    <span>
                      {t(
                        `1. Cấp quyền USDC (${dealAmountNumber.toFixed(2)} USDC)`,
                        `1. Approve USDC (${dealAmountNumber.toFixed(2)} USDC)`
                      )}
                    </span>
                  )}
                </ShimmerButton>

                <ShimmerButton
                  type="button"
                  onClick={isApproved ? handleCreateEscrow : handleApprove}
                  disabled={
                    !isApproved ||
                    isOverBrokerQuota ||
                    hasRoleConflict ||
                    txStatus.step === "confirming"
                  }
                  variant={isApproved ? "primary" : "secondary"}
                  className="w-full py-2.5 text-sm"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {isApproved
                      ? t("2. Khởi tạo hợp đồng", "2. Create Escrow Contract")
                      : t("2. Khởi tạo hợp đồng (Mở sau bước 1)", "2. Create Escrow Contract")}
                  </span>
                </ShimmerButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PactConfirmationModal
        isOpen={isConfirmationModalOpen}
        pactId={createdPactId}
        buyerAddress={
          address || currentUser?.walletAddress || "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5"
        }
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

export default function CreateEscrowPactPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-slate-400 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span>Đang tải biểu mẫu khởi tạo hợp đồng...</span>
          </div>
        </div>
      }
    >
      <CreateEscrowPactContent />
    </Suspense>
  );
}
