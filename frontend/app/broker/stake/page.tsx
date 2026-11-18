"use client";

import React, { useState } from "react";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { formatUnits } from "viem";
import {
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  Check,
  Award,
  ArrowRight,
} from "lucide-react";
import {
  CONTRACT_ADDRESSES,
  STAKED_BROKER_REGISTRY_ABI,
  ERC20_ABI,
  formatUsdc,
  parseUsdc,
  parseContractError,
} from "@/src/lib/contracts";
import { TransactionFeedback, TxStatus } from "@/src/components/TransactionFeedback";
import { ShimmerButton } from "@/src/components/ui/ShimmerButton";
import { useAuth } from "@/src/context/AuthContext";

export default function BrokerStakingAndYieldPage() {
  const { address } = useAccount();
  const { currentUser, setIsAuthModalOpen, setIsLinkWalletModalOpen } = useAuth();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
  const [stakeInput, setStakeInput] = useState("1000");
  const [unstakeInput, setUnstakeInput] = useState("500");
  const [txStatus, setTxStatus] = useState<TxStatus>({ step: "idle" });

  const { data: brokerProfile, refetch: refetchProfile } = useReadContract({
    address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
    abi: STAKED_BROKER_REGISTRY_ABI,
    functionName: "getProfile",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 4000 },
  });

  const { data: availableQuota, refetch: refetchQuota } = useReadContract({
    address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
    abi: STAKED_BROKER_REGISTRY_ABI,
    functionName: "getAvailableQuota",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 4000 },
  });

  const { data: estimatedYieldRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
    abi: STAKED_BROKER_REGISTRY_ABI,
    functionName: "getEstimatedYield",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 4000 },
  });

  const { data: totalPrincipalRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
    abi: STAKED_BROKER_REGISTRY_ABI,
    functionName: "totalPrincipal",
  });

  const { data: registryAusdcBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.aUsdc,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [CONTRACT_ADDRESSES.stakedBrokerRegistry],
    query: { refetchInterval: 4000 },
  });

  const { data: userUsdcBalance, refetch: refetchUsdc } = useReadContract({
    address: CONTRACT_ADDRESSES.usdc,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 4000 },
  });

  const { data: userAllowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.usdc,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACT_ADDRESSES.stakedBrokerRegistry] : undefined,
    query: { enabled: !!address, refetchInterval: 4000 },
  });

  const realStaked = brokerProfile ? Number(formatUnits((brokerProfile as any).stakedBalance as bigint, 6)) : 0;
  const isBrokerProfile = currentUser?.role === "BROKER" || realStaked > 0;

  const stakedNum = realStaked;
  const activeAllocatedNum = brokerProfile
    ? Number(formatUnits((brokerProfile as any).activeHoldingAllocated as bigint, 6))
    : 0;
  const availableQuotaNum = availableQuota
    ? Number(formatUnits(availableQuota as bigint, 6))
    : Math.max(0, stakedNum - activeAllocatedNum);
  const maxFreeStakeToUnstake = Math.max(0, stakedNum - activeAllocatedNum);
  const isVerified = brokerProfile ? Boolean((brokerProfile as any).isVerified) : false;
  const isBlacklisted = brokerProfile ? Boolean((brokerProfile as any).isBlacklisted) : false;
  const successfulDeals = brokerProfile ? Number((brokerProfile as any).successfulDeals) : 0;
  const totalDeals = brokerProfile ? Number((brokerProfile as any).totalDeals) : 0;
  const slashedCount = brokerProfile ? Number((brokerProfile as any).slashedCount) : 0;

  const totalLiveYield = estimatedYieldRaw
    ? Number(formatUnits(estimatedYieldRaw as bigint, 6))
    : 0;
  const brokerShare80 = +(totalLiveYield * 0.8).toFixed(6);
  const treasuryShare20 = +(totalLiveYield * 0.2).toFixed(6);

  const stakeAmountBigInt = parseUsdc(stakeInput);
  const allowanceBigInt = (userAllowance as bigint) || 0n;
  const isStakeApproved = allowanceBigInt >= stakeAmountBigInt && stakeAmountBigInt > 0n;

  const unstakeAmountNum = parseFloat(unstakeInput) || 0;
  const isUnstakeValid = unstakeAmountNum > 0 && unstakeAmountNum <= maxFreeStakeToUnstake;

  const principalTotalNum =
    totalPrincipalRaw !== undefined
      ? Number(formatUnits(totalPrincipalRaw as bigint, 6))
      : 0;
  const aaveBalanceNum =
    registryAusdcBalance !== undefined
      ? Number(formatUnits(registryAusdcBalance as bigint, 6))
      : principalTotalNum;
  const totalAccruedYieldNum = Math.max(0, aaveBalanceNum - principalTotalNum);

  const handleApproveStake = async () => {
    if (!address) {
      setTxStatus({
        step: "error",
        actionTitle: "Yêu cầu liên kết ví Web3",
        errorMessage: "Vui lòng liên kết ví Web3 (MetaMask hoặc Core Wallet) trên mạng Avalanche Fuji để cấp quyền chi tiêu USDC.",
      });
      setIsLinkWalletModalOpen(true);
      return;
    }
    if (stakeAmountBigInt === 0n) return;
    try {
      setTxStatus({ step: "awaiting_signature", actionTitle: "Cấp quyền USDC cho StakedBrokerRegistry" });
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.usdc,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.stakedBrokerRegistry, stakeAmountBigInt],
      });

      setTxStatus({ step: "confirming", txHash: hash, actionTitle: "Đang xác nhận cấp quyền USDC" });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });

      await refetchAllowance();
      setTxStatus({ step: "success", txHash: hash, actionTitle: "Đã cấp quyền USDC hoàn tất" });
      setTimeout(() => setTxStatus({ step: "idle" }), 2000);
    } catch (err: any) {
      setTxStatus({ step: "error", errorMessage: parseContractError(err), actionTitle: "Cấp quyền USDC" });
    }
  };

  const handleStakeInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setTxStatus({
        step: "error",
        actionTitle: "Yêu cầu liên kết ví Web3",
        errorMessage: "Vui lòng liên kết ví Web3 (MetaMask hoặc Core Wallet) trên mạng Avalanche Fuji để nạp thế chấp và ủy thác Aave V3.",
      });
      setIsLinkWalletModalOpen(true);
      return;
    }
    if (!isStakeApproved) return;
    try {
      setTxStatus({ step: "awaiting_signature", actionTitle: "Nạp thế chấp GDTG vào Aave V3 (stakeInsurance)" });
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
        abi: STAKED_BROKER_REGISTRY_ABI,
        functionName: "stakeInsurance",
        args: [stakeAmountBigInt],
      });

      setTxStatus({ step: "confirming", txHash: hash, actionTitle: "Đang ghi nhận vốn thế chấp Aave V3" });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });

      await refetchProfile();
      await refetchQuota();
      await refetchUsdc();
      await refetchAllowance();

      setTxStatus({ step: "success", txHash: hash, actionTitle: "Nạp thế chấp & kích hoạt aUSDC hoàn tất" });
      setTimeout(() => setTxStatus({ step: "idle" }), 2500);
    } catch (err: any) {
      setTxStatus({ step: "error", errorMessage: parseContractError(err), actionTitle: "Nạp thế chấp GDTG" });
    }
  };

  const handleUnstakeInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setTxStatus({
        step: "error",
        actionTitle: "Yêu cầu kết nối ví Web3",
        errorMessage: "Vui lòng kết nối ví Web3 (MetaMask hoặc Core Wallet) để rút vốn thế chấp gốc và nhận lãi thực Aave V3.",
      });
      setIsAuthModalOpen(true);
      return;
    }
    if (!isUnstakeValid) return;
    try {
      const unstakeBig = parseUsdc(unstakeInput);
      setTxStatus({ step: "awaiting_signature", actionTitle: "Rút vốn thế chấp & nhận 80% lãi Aave V3" });
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
        abi: STAKED_BROKER_REGISTRY_ABI,
        functionName: "unstakeInsurance",
        args: [unstakeBig],
      });

      setTxStatus({ step: "confirming", txHash: hash, actionTitle: "Đang tất toán vốn & lợi tức Aave V3" });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });

      await refetchProfile();
      await refetchQuota();
      await refetchUsdc();

      setTxStatus({ step: "success", txHash: hash, actionTitle: "Rút vốn thế chấp & nhận lãi hoàn tất" });
      setTimeout(() => setTxStatus({ step: "idle" }), 2500);
    } catch (err: any) {
      setTxStatus({ step: "error", errorMessage: parseContractError(err), actionTitle: "Rút vốn thế chấp" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── CLEAN BANKING PAGE HEADER ───────────────────────────────────── */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Landmark className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono">StakedBrokerRegistry · Aave V3 Fuji</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Quản lý thế chấp GDTG &amp; Lãi suất Aave V3
          </h1>
          <p className="text-sm text-slate-400">
            Vốn thế chấp bảo chứng của GDTG tự động ủy thác sinh lời trên Aave V3 (phân bổ 80% cho GDTG / 20% Quỹ dự phòng).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold">
            {isBrokerProfile ? "Tài khoản GDTG bảo chứng" : "Đăng ký hạn mức GDTG"}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Tỷ lệ bảo chứng 1:1 (100% Quota)</span>
          </span>
        </div>
      </div>

      {/* ── 4 FLAT BANKING KPI CARDS ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Vốn thế chấp gốc */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Vốn thế chấp gốc</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono tabular-nums">
            {stakedNum.toLocaleString("en-US", { minimumFractionDigits: 0 })}
            <span className="text-xs text-slate-400 font-normal ml-1.5">USDC</span>
          </div>
          <div className="pt-1 border-t border-slate-800/80">
            {isBlacklisted ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/30 text-[11px] font-semibold">
                Đình chỉ hoạt động
              </span>
            ) : isVerified ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                <Check className="w-3 h-3" />
                <span>Đã xác thực</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-medium">
                Chưa kích hoạt
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Hạn mức khả dụng */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Hạn mức khả dụng</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono tabular-nums">
            {availableQuotaNum.toLocaleString("en-US", { minimumFractionDigits: 0 })}
            <span className="text-xs text-slate-400 font-normal ml-1.5">USDC</span>
          </div>
          <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
              <div
                className="bg-blue-500 h-full"
                style={{ width: `${Math.min(100, (activeAllocatedNum / (stakedNum || 1)) * 100)}%` }}
              />
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${Math.min(100, (availableQuotaNum / (stakedNum || 1)) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>
                Đang bảo lãnh: <strong className="font-mono tabular-nums text-slate-200">{activeAllocatedNum.toLocaleString()}</strong>
              </span>
              <span>
                Khả dụng: <strong className="font-mono tabular-nums text-emerald-400">{availableQuotaNum.toLocaleString()}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Lãi thực Aave V3 */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Lãi thực Aave V3</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            +{totalLiveYield.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs text-slate-400 font-normal ml-1.5">USDC</span>
          </div>
          <div className="text-[11px] text-slate-400 flex justify-between pt-1 border-t border-slate-800/80">
            <span>
              GDTG nhận (80%): <strong className="text-emerald-400 font-mono tabular-nums">+{brokerShare80.toFixed(2)}</strong>
            </span>
            <span>
              Dự phòng (20%): <strong className="text-slate-200 font-mono tabular-nums">+{treasuryShare20.toFixed(2)}</strong>
            </span>
          </div>
        </div>

        {/* Card 4: Hiệu suất giao dịch */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Hiệu suất giao dịch</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono tabular-nums">
            {successfulDeals}/{totalDeals}
            <span className="text-xs font-sans text-slate-400 font-normal ml-1.5">hợp đồng</span>
          </div>
          <div className="flex justify-between text-[11px] pt-1 border-t border-slate-800/80">
            <span className="text-emerald-400 font-semibold font-mono tabular-nums">
              Hoàn thành {totalDeals > 0 ? ((successfulDeals / totalDeals) * 100).toFixed(1) : "100"}%
            </span>
            <span className="text-slate-400">
              Khấu trừ: <strong className="font-mono tabular-nums text-slate-200">{slashedCount}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── MAIN 2-COLUMN CONSOLE & ON-CHAIN ACCOUNTING PROOF ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT (7 COLS): STAKE / UNSTAKE CONSOLE */}
        <div className="lg:col-span-7">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
            {/* Segmented Tab Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-[#0B0F17] border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("stake")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  activeTab === "stake"
                    ? "bg-slate-800 text-slate-100 border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                <span>Nạp vốn thế chấp</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("unstake")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  activeTab === "unstake"
                    ? "bg-slate-800 text-slate-100 border border-slate-700 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 border border-transparent"
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-amber-400" />
                <span>Rút vốn &amp; Nhận lãi</span>
              </button>
            </div>

            {/* TAB 1: STAKE */}
            {activeTab === "stake" && (
              <form onSubmit={handleStakeInsurance} className="space-y-5">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-slate-300">
                      Số lượng USDC nạp thế chấp bảo chứng
                    </label>
                    <span className="text-slate-400">
                      Số dư ví:{" "}
                      <strong className="font-mono tabular-nums text-slate-100">
                        {formatUsdc(userUsdcBalance as bigint)} USDC
                      </strong>
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      step="any"
                      value={stakeInput}
                      onChange={(e) => setStakeInput(e.target.value)}
                      placeholder="Nhập số lượng USDC..."
                      className="w-full bg-[#0B0F17] border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg pl-4 pr-20 py-3 text-lg font-mono font-bold text-slate-100 tabular-nums transition-colors"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-slate-400">
                      USDC
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {[500, 1000, 2500, 5000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setStakeInput(String(val))}
                        className={`px-3 py-1 rounded-lg text-xs font-mono tabular-nums border transition-colors ${
                          Number(stakeInput) === val
                            ? "bg-blue-600/20 border-blue-500/50 text-blue-300 font-semibold"
                            : "bg-[#0B0F17] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                        }`}
                      >
                        +{val.toLocaleString()} USDC
                      </button>
                    ))}
                  </div>
                </div>

                {/* Routing Flow */}
                <div className="bg-[#0B0F17] border border-slate-800/80 rounded-lg p-4 space-y-3">
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                    Luồng lưu ký &amp; sinh lời tự động
                  </span>
                  <div className="flex items-center justify-between text-center gap-2 text-xs font-mono">
                    <div className="py-2 px-2.5 rounded-lg bg-slate-900 border border-slate-800 flex-1 text-slate-200">
                      Ví GDTG
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <div className="py-2 px-2.5 rounded-lg bg-slate-900 border border-slate-800 flex-1 text-blue-400">
                      StakedBrokerRegistry
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <div className="py-2 px-2.5 rounded-lg bg-slate-900 border border-slate-800 flex-1 text-emerald-400 font-semibold">
                      Aave V3 Pool
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-800 text-xs text-slate-400">
                    <span>Hạn mức bảo chứng mở thêm (100% 1:1):</span>
                    <strong className="text-emerald-400 font-mono font-bold tabular-nums">
                      +{(parseFloat(stakeInput || "0") * 1.0).toLocaleString()} USDC
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ShimmerButton
                    type="button"
                    onClick={handleApproveStake}
                    disabled={isStakeApproved || stakeAmountBigInt === 0n}
                    variant={isStakeApproved ? "success" : "primary"}
                    className="py-3 rounded-lg"
                  >
                    {isStakeApproved ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>1. Đã cấp quyền USDC</span>
                      </>
                    ) : (
                      <span>1. Cấp quyền USDC (Approve)</span>
                    )}
                  </ShimmerButton>

                  <ShimmerButton
                    type="submit"
                    disabled={!isStakeApproved}
                    variant={isStakeApproved ? "primary" : "secondary"}
                    className="py-3 rounded-lg"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>2. Nạp thế chấp &amp; Kích hoạt lãi</span>
                  </ShimmerButton>
                </div>
              </form>
            )}

            {/* TAB 2: UNSTAKE */}
            {activeTab === "unstake" && (
              <form onSubmit={handleUnstakeInsurance} className="space-y-5">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-slate-300">
                      Số lượng vốn thế chấp muốn rút về ví
                    </label>
                    <span className="text-slate-400">
                      Tối đa khả dụng:{" "}
                      <strong className="font-mono tabular-nums text-slate-100">
                        {maxFreeStakeToUnstake.toLocaleString()} USDC
                      </strong>
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={unstakeInput}
                      onChange={(e) => setUnstakeInput(e.target.value)}
                      placeholder={`Tối đa ${maxFreeStakeToUnstake} USDC`}
                      className="w-full bg-[#0B0F17] border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg pl-4 pr-24 py-3 text-lg font-mono font-bold text-slate-100 tabular-nums transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setUnstakeInput(String(maxFreeStakeToUnstake))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-200 font-semibold transition-colors"
                    >
                      TỐI ĐA
                    </button>
                  </div>
                </div>

                <div className="bg-[#0B0F17] border border-slate-800/80 rounded-lg p-4 space-y-2.5 text-xs">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider block">
                    Bảng kê tất toán rút vốn
                  </span>
                  <div className="flex justify-between text-slate-400">
                    <span>Vốn thế chấp gốc rút về</span>
                    <span className="text-slate-100 font-mono font-semibold tabular-nums">
                      {unstakeAmountNum.toFixed(2)} USDC
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>80% lợi tức Aave V3 tích lũy</span>
                    <span className="text-emerald-400 font-mono font-semibold tabular-nums">
                      +{brokerShare80.toFixed(2)} USDC
                    </span>
                  </div>
                  <div className="pt-2.5 border-t border-slate-800 flex justify-between font-bold text-sm text-slate-100">
                    <span>Tổng thực nhận về ví</span>
                    <span className="text-emerald-400 font-mono tabular-nums">
                      {(unstakeAmountNum + Number(brokerShare80)).toFixed(2)} USDC
                    </span>
                  </div>
                </div>

                {!isUnstakeValid && unstakeAmountNum > maxFreeStakeToUnstake && (
                  <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                    Số tiền rút vượt quá hạn mức khả dụng ({maxFreeStakeToUnstake.toLocaleString()} USDC). Phần vốn còn lại đang bảo chứng cho các hợp đồng đang mở.
                  </div>
                )}

                <ShimmerButton
                  type="submit"
                  disabled={!isUnstakeValid}
                  variant="primary"
                  className="w-full py-3 rounded-lg"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Rút vốn gốc &amp; Nhận lãi về ví</span>
                </ShimmerButton>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT (5 COLS): ON-CHAIN ACCOUNTING PROOF */}
        <div className="lg:col-span-5">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <h3 className="text-sm font-bold text-slate-100">
                Đối soát kế toán On-Chain
              </h3>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                Real-Yield Proof
              </span>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center text-slate-400">
                <span>Tổng vốn thế chấp hệ thống</span>
                <span className="font-bold font-mono text-slate-100 tabular-nums">
                  {principalTotalNum.toLocaleString("en-US")} USDC
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Số dư aUSDC tại Registry</span>
                <span className="font-bold font-mono text-emerald-400 tabular-nums">
                  {aaveBalanceNum.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 })} aUSDC
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Lợi tức Aave V3 tích lũy</span>
                <span className="font-bold font-mono text-emerald-400 tabular-nums">
                  +{totalAccruedYieldNum.toFixed(6)} USDC
                </span>
              </div>
            </div>

            <div className="bg-[#0B0F17] border border-slate-800/80 rounded-lg p-4 space-y-2.5">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider block">
                Công thức phân bổ lợi tức bất biến
              </span>
              <code className="text-xs font-mono text-slate-200 block bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                Yield_GDTG = (aUSDC_Bal - Principal) × Share × 80%
              </code>
              <p className="text-xs text-slate-400 leading-relaxed">
                20% lợi tức còn lại chuyển vào Quỹ dự phòng bảo hiểm nhằm bảo vệ an toàn thanh khoản cho hệ thống.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-2.5 text-xs">
              <span className="text-slate-400 block font-semibold">
                Hợp đồng kiểm chứng trên Snowtrace:
              </span>
              <div className="space-y-2">
                {[
                  { label: "StakedBrokerRegistry", addr: CONTRACT_ADDRESSES.stakedBrokerRegistry },
                  { label: "Aave V3 Pool", addr: CONTRACT_ADDRESSES.aaveV3Pool },
                  { label: "aUSDC", addr: CONTRACT_ADDRESSES.aUsdc },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={`https://testnet.snowtrace.io/address/${item.addr}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-lg bg-[#0B0F17] hover:bg-slate-800/70 border border-slate-800/80 text-slate-200 flex items-center justify-between px-3.5 transition-colors"
                  >
                    <span className="font-mono text-xs">{item.label}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                ))}
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
