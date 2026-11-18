"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Wallet,
  Check,
  Search,
  Sparkles,
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
  avatar: string;
  badge: string;
  stakedAmount: number;
  availableQuota: number;
  successRate: number;
  rating: number;
  deals: number;
  recommendedFeeBps: number;
  telegram?: string;
}

const BROKER_DIRECTORY: BrokerItem[] = [
  {
    id: "TP-3003",
    name: "Nguyễn Nam (Giám Định Viên Senior · On-Chain Active)",
    username: "nam_broker",
    address: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
    avatar: "/images/avatar-nam.jpg",
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
    avatar: "/images/avatar-nam.jpg",
    badge: "Protocol Admin · Chưa Stake Cọc",
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
    avatar: "/images/avatar-tuan.jpg",
    badge: "Tech Auditor · Chưa Stake Cọc",
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
    avatar: "/images/avatar-hoang.jpg",
    badge: "Senior Custodian · Chưa Stake Cọc",
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
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80",
    badge: "Acc & Game Specialist · Chưa Stake Cọc",
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
  const { currentUser, registeredUsers, searchUsers, findUserByQuery, setIsAuthModalOpen, setIsLinkWalletModalOpen } = useAuth();
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
    "Bên Bán bàn giao mã khóa API và tài khoản quản trị trong vòng 24 giờ. GDTG kiểm tra tính hợp lệ trước khi bấm giải ngân."
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

  const activeBrokerAddress: `0x${string}` = isCustomBroker && customBrokerAddress.startsWith("0x")
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
    args: sellerInput.startsWith("0x") && sellerInput.length === 42 ? [sellerInput as `0x${string}`] : undefined,
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
  const isApproved = isSimulatedApproved || (allowanceBigInt >= dealAmountBigInt && dealAmountBigInt > 0n);

  const parsedLiveQuota = liveQuotaRaw !== undefined ? Number(formatUsdc(liveQuotaRaw as bigint).replace(/,/g, "")) : selectedBroker.availableQuota;
  const liveQuotaNumber = parsedLiveQuota;
  const isOverBrokerQuota = dealAmountNumber > liveQuotaNumber;

  const brokerFeeAmount = +((dealAmountNumber * brokerFeeBps) / 10000).toFixed(2);
  const protocolFeeAmount = +((dealAmountNumber * 30) / 10000).toFixed(2);
  const netSellerReceives = Math.max(0, +(dealAmountNumber - brokerFeeAmount - protocolFeeAmount).toFixed(2));

  const isSellerSelf = address && sellerInput.toLowerCase() === address.toLowerCase();
  const isBrokerSelf = address && activeBrokerAddress.toLowerCase() === address.toLowerCase();
  const isSellerBrokerSame = sellerInput.toLowerCase() === activeBrokerAddress.toLowerCase();
  const hasRoleConflict = isSellerSelf || isBrokerSelf || isSellerBrokerSame;

  const filteredBrokers = BROKER_DIRECTORY.filter((b) => {
    if (filterEligibleOnly && b.availableQuota < dealAmountNumber) {
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
        actionTitle: t("Phê Duyệt Hạn Mức", "Approve Allowance"),
        errorMessage: t("Vui lòng nhập giá trị ký quỹ lớn hơn 0.", "Please enter an escrow amount greater than 0."),
      });
      return;
    }

    if (!address) {
      setTxStatus({
        step: "error",
        actionTitle: t("Chưa Kết Nối Ví Web3", "Wallet Not Connected"),
        errorMessage: t(
          "Vui lòng kết nối ví Web3 (MetaMask / Core Wallet) mạng Avalanche Fuji để phê duyệt hạn mức USDC on-chain.",
          "Please connect your Web3 wallet on Avalanche Fuji to approve USDC allowance."
        ),
      });
      return;
    }

    try {
      setTxStatus({
        step: "awaiting_signature",
        actionTitle: t("Phê Duyệt (Approve) Hạn Mức USDC", "Approving USDC Allowance"),
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
        actionTitle: t("Đang Xác Nhận Giao Dịch Cấp Quyền...", "Confirming Approval on Fuji..."),
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      await refetchAllowance();
      setIsSimulatedApproved(true);
      setTxStatus({
        step: "success",
        txHash: hash,
        actionTitle: t("Cấp Quyền USDC Thành Công! Bước 2 Đã Mở Khóa", "USDC Approved! Step 2 is now unlocked"),
      });
      setTimeout(() => setTxStatus({ step: "idle" }), 2000);
    } catch (err: any) {
      setTxStatus({
        step: "error",
        actionTitle: t("Phê Duyệt Hạn Mức USDC", "Approve USDC Allowance"),
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
        } catch (err) {}

        setCreatedPactId(createdId);
        setCreatedTxHash(hash);
        setTxStatus({
          step: "success",
          txHash: hash,
          actionTitle: "Khởi Tạo Két Sắt & Khóa Quỹ UniversalEscrow",
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
        actionTitle: "Khởi Tạo Két Sắt & Khóa Quỹ UniversalEscrow",
      });
    }
  };

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
    <div className="space-y-8 animate-fade-in">
      {/* ── SCENIC HERO BANNER WITH 3D VAULT ARTWORK ───────────────────── */}
      <div className="card overflow-hidden p-0 relative">
        <img
          src="/images/hero-3d-escrow.png"
          alt=""
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-55 hidden sm:block"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C1E46]/95 via-[#0F2452]/85 to-[#0F2452]/35" />
        <div className="relative p-7 sm:p-9 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="badge-pill bg-sky-400/20 border border-sky-300/35 text-sky-200 text-xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-300" />
              <span>UniversalEscrow.sol · Avalanche Fuji</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t("Khởi Tạo Hợp Đồng Ký Quỹ 3 Bên", "Create 3-Party Escrow Pact")}
            </h1>
            <p className="text-sm text-sky-100/85">
              {t(
                "Khóa dòng tiền bảo chứng phi tập trung · Trung gian bảo lãnh bằng vốn thế chấp thực trên Aave V3",
                "Secured by Smart Contract on Avalanche Fuji · Broker stakes collateral"
              )}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="badge-pill bg-white/[0.14] border border-white/[0.25] text-white font-mono text-xs px-4 py-1.5">
              Phí giao thức: 0.30%
            </span>
          </div>
        </div>
      </div>

      {/* GMAIL USER: PROMPT WALLET LINKING FOR ESCROW */}
      {currentUser && (!currentUser.isWalletLinked || !address || currentUser.walletAddress === "0x0000000000000000000000000000000000000000") && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-sky-950/70 via-indigo-950/60 to-slate-900/70 border border-sky-400/35 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-sky-400/20 border border-sky-300/40 flex items-center justify-center text-sky-300 shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {currentUser.email ? `Tài khoản Gmail: ${currentUser.email}` : "Chưa liên kết ví Web3"}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/30 font-semibold">
                  Cần ví Web3 để ký hợp đồng on-chain
                </span>
              </div>
              <p className="text-xs text-sky-100/75 mt-0.5">
                Bạn có thể thiết lập các điều khoản trước. Để nạp tiền vào Két Sắt UniversalEscrow, vui lòng liên kết ví MetaMask hoặc Core.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsLinkWalletModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 hover:brightness-110 text-white font-bold text-xs whitespace-nowrap shadow-lg flex items-center justify-center gap-2 transition-all self-start sm:self-auto"
          >
            <Wallet className="w-4 h-4" />
            <span>Liên Kết Ví Web3</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── LEFT PANE (7 COLS): CONFIGURATION STEPS ──────────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleCreateEscrow} className="space-y-6">
            {/* STEP 1: SELLER */}
            <div className="card p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.14]">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-white font-mono text-xs font-bold flex items-center justify-center shadow-sm">
                    01
                  </span>
                  <h2 className="section-title">
                    {t("Đối tác bán (Người nhận thanh toán)", "Seller Partner")}
                  </h2>
                </div>
                <span className="text-xs text-sky-100/70">Ví 0x / @username</span>
              </div>

              <div className="space-y-3.5">
                <div className="relative">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sky-200/70">
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
                      placeholder={t("Nhập địa chỉ ví 0x..., @username hoặc mã TP-...", "Enter 0x address, @username or TP-...")}
                      className="input-field !rounded-full pl-11 py-3 text-sm font-mono"
                      required
                    />
                  </div>

                  {/* Suggestions Dropdown */}
                  {showSellerSuggestions && sellerSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 mt-2 bg-[#0F2147]/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl p-2 z-30 max-h-56 overflow-y-auto">
                      <div className="px-2.5 py-1 text-xs text-sky-200/80 font-medium">
                        {t("Thành viên đã xác thực SBT:", "Verified members:")}
                      </div>
                      {sellerSuggestions.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setSellerInput(u.walletAddress || u.username);
                            setShowSellerSuggestions(false);
                          }}
                          className="w-full p-2.5 rounded-xl text-left hover:bg-white/10 flex items-center justify-between transition-colors text-sm"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatarUrl}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border border-white/20"
                              onError={(e) => {
                                (e.target as any).src = "/images/avatar-hoang.jpg";
                              }}
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-white">{u.name}</span>
                                <span className="text-xs text-emerald-300 font-mono">@{u.username}</span>
                              </div>
                              <span className="text-xs text-sky-100/70 font-mono block">
                                {u.id} · {u.walletAddress ? shortenAddress(u.walletAddress) : "Chưa liên kết ví"}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-sky-300">
                            {t("Chọn", "Select")}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Pick Sellers */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="text-sky-100/75 font-medium">{t("Chọn nhanh:", "Quick pick:")}</span>
                  {registeredUsers
                    .filter((u) => u.role === "SELLER")
                    .map((seller) => {
                      const active = seller.walletAddress && sellerInput.toLowerCase() === seller.walletAddress.toLowerCase();
                      return (
                        <button
                          key={seller.id}
                          type="button"
                          onClick={() => {
                            setSellerInput(seller.walletAddress || seller.username);
                            setShowSellerSuggestions(false);
                          }}
                          className={`px-3.5 py-1.5 rounded-full transition-all border ${
                            active
                              ? "bg-gradient-to-r from-sky-400/25 to-indigo-500/25 border-sky-300/40 text-white font-semibold shadow-sm"
                              : "bg-white/8 border-white/15 text-sky-100/80 hover:text-white hover:bg-white/15"
                          }`}
                        >
                          {seller.name} (@{seller.username})
                        </button>
                      );
                    })}
                </div>

                {/* Matched Partner Verification Card */}
                {matchedSellerUser && (
                  <div className="card-inner p-4 flex items-center justify-between gap-3 border-emerald-400/30 bg-emerald-400/10">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={matchedSellerUser.avatarUrl}
                        alt={matchedSellerUser.name}
                        className="w-11 h-11 rounded-full object-cover border-2 border-emerald-400/40 shrink-0"
                        onError={(e) => {
                          (e.target as any).src = "/images/avatar-hoang.jpg";
                        }}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-white">{matchedSellerUser.name}</span>
                          <span className="text-xs text-emerald-400 font-mono">@{matchedSellerUser.username}</span>
                          <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/15 px-1.5 py-0.5 rounded">
                            {matchedSellerUser.id}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono block mt-0.5">
                          {shortenAddress(matchedSellerUser.walletAddress)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 justify-end">
                        <ShieldCheck className="w-4 h-4" /> {t("SBT Đã Xác Thực", "SBT Verified")}
                      </span>
                      <span className="text-xs text-slate-400">
                        <strong className="font-mono text-slate-200">{matchedSellerUser.successRate}%</strong> hoàn thành
                      </span>
                    </div>
                  </div>
                )}

                {/* Scam Check Status */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {sellerReportCount > 0 ? (
                    <span className="badge-pill bg-red-500/15 border border-red-500/30 text-red-400">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      {t(`CẢNH BÁO: Ví có ${sellerReportCount} đơn tố cáo trên Sổ Đen!`, `WARNING: Flagged in ${sellerReportCount} scam reports!`)}
                    </span>
                  ) : sellerSuccessRate !== undefined && Number(sellerSuccessRate) > 0 ? (
                    <span className="badge-pill bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {t(`Điểm Tín Nhiệm On-Chain: ${(Number(sellerSuccessRate) / 100).toFixed(1)}%`, `On-Chain Trust: ${(Number(sellerSuccessRate) / 100).toFixed(1)}%`)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      {t("Kiểm tra tự động: 0 vi phạm trên ScamRegistryL1", "Auto-check: 0 violations on ScamRegistryL1")}
                    </span>
                  )}
                </div>

                {isSellerSelf && (
                  <p className="text-xs text-red-400 font-medium">
                    {t("Lỗi: Địa chỉ Bên Bán không được trùng với ví Bên Mua.", "Error: Seller address cannot equal Buyer wallet.")}
                  </p>
                )}
                {isSellerBrokerSame && (
                  <p className="text-xs text-red-400 font-medium">
                    {t("Lỗi: Địa chỉ Bên Bán không được trùng với GDTG.", "Error: Seller address cannot equal Broker address.")}
                  </p>
                )}
              </div>
            </div>

            {/* STEP 2: BROKER SELECTOR */}
            <div className="card p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.14] flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-white font-mono text-xs font-bold flex items-center justify-center shadow-sm">
                    02
                  </span>
                  <h2 className="section-title">
                    {t("Chọn Trung Gian Bảo Chứng (GDTG)", "Assign Escrow Broker")}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCustomBroker(!isCustomBroker)}
                  className="text-xs text-sky-300 hover:text-white font-semibold transition-colors"
                >
                  {isCustomBroker
                    ? t("← Chọn từ danh bạ GDTG", "← Select from directory")
                    : t("Nhập ví GDTG riêng (0x...)", "Custom broker address")}
                </button>
              </div>

              {!isCustomBroker ? (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sky-200/60">
                        <Search className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={brokerSearchQuery}
                        onChange={(e) => setBrokerSearchQuery(e.target.value)}
                        placeholder={t("Tìm GDTG theo tên, @username hoặc ví 0x...", "Search broker by name, @username or 0x...")}
                        className="input-field rounded-full pl-11 py-2.5 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFilterEligibleOnly(!filterEligibleOnly)}
                      className={`px-4 py-2.5 rounded-full border text-xs font-semibold transition-all shrink-0 flex items-center justify-center gap-1.5 whitespace-nowrap ${
                        filterEligibleOnly
                          ? "bg-emerald-400/20 border-emerald-300/40 text-emerald-200"
                          : "bg-white/[0.08] border-white/[0.18] text-sky-100 hover:text-white"
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{t("Đủ Hạn Mức Bảo Lãnh", "Eligible Quota Only")}</span>
                    </button>
                  </div>

                  {/* Broker List with Real Portraits */}
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {filteredBrokers.length === 0 ? (
                      <div className="p-6 text-center text-sky-100/75 text-sm border border-dashed border-white/[0.2] rounded-2xl">
                        {t("Không tìm thấy GDTG phù hợp với bộ lọc.", "No matching brokers found.")}
                      </div>
                    ) : (
                      filteredBrokers.map((b) => {
                        const isSelected = selectedBroker.id === b.id;
                        const isEligible = b.availableQuota >= dealAmountNumber;
                        const isBest = b.id === bestRecommendedBroker.id;

                        return (
                          <div
                            key={b.id}
                            onClick={() => {
                              setSelectedBroker(b);
                              if (b.recommendedFeeBps) setBrokerFeeBps(b.recommendedFeeBps);
                            }}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isSelected
                                ? "bg-gradient-to-r from-sky-400/20 to-indigo-500/20 border-sky-300/55 shadow-[0_8px_24px_rgba(56,189,248,0.18)]"
                                : !isEligible
                                ? "card-inner opacity-60 hover:opacity-90"
                                : "card-inner hover:bg-white/[0.12] hover:border-white/[0.26]"
                            }`}
                          >
                            <div className="flex items-center gap-3.5">
                              <div className="relative shrink-0">
                                <img
                                  src={b.avatar}
                                  alt={b.name}
                                  className={`w-12 h-12 rounded-full object-cover ${
                                    isSelected ? "ring-2 ring-sky-300" : "ring-1 ring-white/25"
                                  }`}
                                  onError={(e) => { (e.target as any).src = "/images/avatar-nam.jpg"; }}
                                />
                                {isSelected && (
                                  <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-sky-400 text-slate-950 flex items-center justify-center shadow">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-white">{b.name}</span>
                                  <span className="text-xs text-sky-200 font-mono">@{b.username}</span>
                                  {isBest && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-300/35 text-[11px] font-semibold">
                                      Đề xuất
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2.5 text-xs text-sky-100/75 flex-wrap">
                                  <span className="font-mono">{shortenAddress(b.address)}</span>
                                  <span>·</span>
                                  <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                                    <Star className="w-3 h-3 fill-amber-300 text-amber-300" />
                                    {b.rating.toFixed(1)} ({b.deals} kèo)
                                  </span>
                                  <span>·</span>
                                  <span>Phí: <strong className="font-mono text-white">{(b.recommendedFeeBps / 100).toFixed(2)}%</strong></span>
                                </div>
                              </div>
                            </div>

                            <div className="text-left sm:text-right sm:border-l sm:border-white/[0.14] sm:pl-4 shrink-0 pl-14">
                              <span className="text-[11px] text-sky-100/75 block">Hạn mức khả dụng</span>
                              <div className="flex items-center sm:justify-end gap-2 mt-0.5">
                                <span className="font-bold text-white font-mono text-sm tabular-nums whitespace-nowrap">
                                  {b.availableQuota.toLocaleString()} USDC
                                </span>
                                {isEligible ? (
                                  <span className="text-[10px] font-semibold text-emerald-200 bg-emerald-400/20 px-2.5 py-0.5 rounded-full border border-emerald-300/35 whitespace-nowrap">
                                    Đủ cọc
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold text-rose-200 bg-rose-500/20 px-2.5 py-0.5 rounded-full border border-rose-300/35 whitespace-nowrap">
                                    Thiếu quota
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
                    placeholder="Nhập địa chỉ ví GDTG tùy chỉnh 0x..."
                    className="input-field py-3 text-sm font-mono"
                  />
                  <span className="text-xs text-sky-100/75 block">
                    Lưu ý: GDTG bắt buộc phải nạp cọc trên StakedBrokerRegistry để đủ hạn mức bảo lãnh kèo.
                  </span>
                </div>
              )}

              {isOverBrokerQuota && (
                <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-300/35 text-rose-100 text-xs font-medium flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0" />
                  <span>
                    Hạn mức khả dụng của GDTG ({liveQuotaNumber.toLocaleString()} USDC) nhỏ hơn giá trị kèo ({dealAmountNumber.toLocaleString()} USDC). Hãy chọn GDTG có vốn cọc lớn hơn.
                  </span>
                </div>
              )}
            </div>

            {/* STEP 3: AMOUNT & DURATION */}
            <div className="card p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.14]">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-white font-mono text-xs font-bold flex items-center justify-center shadow-sm">
                    03
                  </span>
                  <h2 className="section-title">
                    Số tiền ký quỹ &amp; Thời hạn bàn giao
                  </h2>
                </div>
                <span className="text-xs text-sky-100/80">
                  Số dư ví: <strong className="font-mono text-white">{formatUsdc(userUsdcBalance as bigint)} USDC</strong>
                </span>
              </div>

              <div className="space-y-2.5">
                <label className="text-xs font-semibold text-sky-100 block">
                  Số lượng USDC nạp vào Két Sắt
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={dealAmountInput}
                    onChange={(e) => setDealAmountInput(e.target.value)}
                    className="input-field rounded-2xl pl-4 pr-28 py-3.5 text-xl font-mono font-bold tabular-nums"
                    required
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDealAmountInput(userUsdcBalance && Number(userUsdcBalance) > 0 ? formatUnits(userUsdcBalance as bigint, 6) : "5000")}
                      className="px-3 py-1 rounded-full bg-sky-400/20 hover:bg-sky-400/30 border border-sky-300/35 text-xs font-mono text-sky-200 font-bold transition-colors"
                    >
                      MAX
                    </button>
                    <span className="text-xs font-mono font-bold text-white">USDC</span>
                  </div>
                </div>

                {/* Quick Amount Chips */}
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  {[200, 500, 1000, 2500, 5000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDealAmountInput(String(preset))}
                      className={`px-3.5 py-1 rounded-full text-xs font-mono transition-all border ${
                        Number(dealAmountInput) === preset
                          ? "bg-sky-400/25 border-sky-300/50 text-white font-bold"
                          : "bg-white/[0.08] border-white/[0.16] text-sky-100/80 hover:text-white"
                      }`}
                    >
                      {preset.toLocaleString()} USDC
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-sky-100 block">
                  Thời gian bàn giao tối đa (Auto-Refund Time-lock)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
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
                      className={`py-2.5 text-xs rounded-full font-semibold transition-all border ${
                        selectedDurationSeconds === d.sec
                          ? "bg-gradient-to-r from-sky-400/30 to-indigo-500/35 border-sky-300/50 text-white shadow-sm"
                          : "card-inner text-sky-100/80 hover:text-white"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-sky-100/75 pt-1">
                  Quá thời hạn trên mà Bên Bán chưa giao hàng, Bên Mua được quyền rút lại 100% tiền gốc trực tiếp từ hợp đồng.
                </p>
              </div>
            </div>

            {/* STEP 4: BROKER COMMISSION */}
            <div className="card p-6 sm:p-7 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.14]">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-white font-mono text-xs font-bold flex items-center justify-center shadow-sm">
                    04
                  </span>
                  <h2 className="section-title">
                    {t("Phí dịch vụ Trung Gian", "Broker Service Fee")}
                  </h2>
                </div>
                <span className="px-3.5 py-1 rounded-full bg-sky-400/20 border border-sky-300/35 text-xs font-bold font-mono text-white">
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
                className="w-full cursor-pointer"
              />

              <div className="flex justify-between text-xs text-sky-100/75">
                <span>Tối thiểu: <strong className="font-mono text-white">0.50%</strong></span>
                <span>Tiêu chuẩn: <strong className="font-mono text-white">1.50%</strong></span>
                <span>Tối đa: <strong className="font-mono text-white">10.00%</strong></span>
              </div>
            </div>

            {/* STEP 5: TERMS */}
            <div className="card p-6 sm:p-7 space-y-3.5">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 text-white font-mono text-xs font-bold flex items-center justify-center shadow-sm">
                  05
                </span>
                <h2 className="section-title">
                  {t("Điều khoản nghiệm thu bàn giao", "Handover Terms")}
                </h2>
              </div>
              <textarea
                rows={3}
                value={handoverTerms}
                onChange={(e) => setHandoverTerms(e.target.value)}
                placeholder={t("Quy định rõ tiêu chí bàn giao hàng, quy trình kiểm định...", "Specify delivery criteria...")}
                className="input-field py-3 text-sm resize-none leading-relaxed"
              />
            </div>
          </form>
        </div>

        {/* ── RIGHT PANE (5 COLS): STICKY SETTLEMENT RECEIPT ───────────────── */}
        <div className="lg:col-span-5 sticky top-24 space-y-6">
          <div className="card-elevated overflow-hidden p-0">
            {/* Visual Vault Header inside Receipt */}
            <div className="relative h-28 overflow-hidden border-b border-white/[0.16]">
              <img
                src="/images/sbt-passport-bg.png"
                alt=""
                className="w-full h-full object-cover opacity-50"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0D214D]/88 to-[#162C63]/70 backdrop-blur-md p-6 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {t("Phiếu Đối Soát Ký Quỹ", "Settlement Summary")}
                  </h3>
                  <span className="text-xs text-sky-100/80">Kiểm tra chi tiết dòng tiền trước khi ký</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-white/[0.14] border border-white/[0.25] flex items-center justify-center text-sky-200">
                  <Lock className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-7 space-y-5">
              {/* 3-Node Flow Diagram */}
              <div className="p-4 rounded-2xl card-inner space-y-3">
                <div className="flex items-center justify-between text-center gap-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-white/[0.07] border border-white/[0.14] flex-1">
                    <span className="text-sky-200/80 block text-[10px] font-mono uppercase">BUYER</span>
                    <span className="text-white font-semibold mt-0.5 block">{t("Nạp Quỹ", "Deposit")}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-sky-300 shrink-0" />
                  <div className="p-2.5 rounded-2xl bg-sky-400/20 border border-sky-300/40 flex-1">
                    <span className="text-sky-200 block text-[10px] font-mono font-bold uppercase">VAULT</span>
                    <span className="text-white font-bold mt-0.5 block">{t("Khóa Cọc", "Locked")}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-300 shrink-0" />
                  <div className="p-2.5 rounded-2xl bg-emerald-400/15 border border-emerald-300/35 flex-1">
                    <span className="text-emerald-300 block text-[10px] font-mono uppercase">SELLER</span>
                    <span className="text-emerald-200 font-semibold mt-0.5 block">{t("Giải Ngân", "Release")}</span>
                  </div>
                </div>
                <div className="text-center text-[11px] text-sky-100/80 pt-1 border-t border-white/[0.1]">
                  Được bảo lãnh bởi hạn mức GDTG:{" "}
                  <strong className="font-mono text-sky-200">{liveQuotaNumber.toLocaleString()} USDC</strong>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between items-center text-sky-50">
                  <span>{t("Tiền gốc nạp vào két", "Deposit Principal")}</span>
                  <span className="font-bold font-mono text-white tabular-nums">{dealAmountNumber.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between items-center text-sky-100/80 text-xs">
                  <span>{t("Phí dịch vụ GDTG", "Broker Fee")} ({(brokerFeeBps / 100).toFixed(2)}%)</span>
                  <span className="font-mono text-amber-200 tabular-nums">- {brokerFeeAmount.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between items-center text-sky-100/80 text-xs">
                  <span>{t("Phí giao thức TrustPact (0.30%)", "Protocol Fee (0.30%)")}</span>
                  <span className="font-mono text-sky-200/80 tabular-nums">- {protocolFeeAmount.toFixed(2)} USDC</span>
                </div>

                <div className="mt-3 p-4 rounded-2xl bg-emerald-400/15 border border-emerald-300/35 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-white text-sm block">{t("Bên Bán thực nhận", "Net Seller Payout")}</span>
                    <span className="text-[11px] text-sky-100/80">Giải ngân tự động khi hoàn tất</span>
                  </div>
                  <span className="font-extrabold font-mono text-xl text-emerald-300 tabular-nums">
                    {netSellerReceives.toFixed(2)} USDC
                  </span>
                </div>
              </div>

              {/* 2-Step Execution Engine */}
              <div className="pt-3 border-t border-white/[0.14] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-sky-100 font-semibold">
                    {t("Quy trình ký quỹ 2 bước", "2-Step On-Chain Execution")}
                  </span>
                  <span className={`font-semibold ${isApproved ? "text-emerald-300" : "text-sky-200"}`}>
                    {isApproved
                      ? t("✓ Sẵn sàng khóa quỹ", "✓ Ready to lock")
                      : t("Bước 1 / 2", "Step 1 of 2")}
                  </span>
                </div>

                <ShimmerButton
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproved || dealAmountBigInt === 0n || txStatus.step === "confirming"}
                  variant={isApproved ? "success" : "primary"}
                  className="w-full py-3.5"
                >
                  {isApproved ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t("Bước 1: Đã Cấp Quyền USDC Thành Công", "Step 1: USDC Approved")}</span>
                    </>
                  ) : (
                    <span>{t(`Bước 1: Cấp Quyền (Approve) ${dealAmountNumber.toFixed(0)} USDC`, `Step 1: Approve ${dealAmountNumber.toFixed(0)} USDC`)}</span>
                  )}
                </ShimmerButton>

                <ShimmerButton
                  type="button"
                  onClick={isApproved ? handleCreateEscrow : handleApprove}
                  disabled={!isApproved || isOverBrokerQuota || hasRoleConflict || txStatus.step === "confirming"}
                  variant={isApproved ? "primary" : "secondary"}
                  className="w-full py-3.5"
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {isApproved
                      ? t("Bước 2: Ký Hợp Đồng & Khóa Tiền Vào Két", "Step 2: Sign & Lock Funds in Vault")
                      : t("Bước 2: Khóa Tiền Vào Két (Mở sau Bước 1)", "Step 2: Lock Funds (Unlocks after Step 1)")}
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

export default function CreateEscrowPactPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center text-slate-400 text-sm">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Đang tải cấu hình hợp đồng...</span>
          </div>
        </div>
      }
    >
      <CreateEscrowPactContent />
    </Suspense>
  );
}
