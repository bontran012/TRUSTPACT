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
        actionTitle: "Yêu Cầu Liên Kết Ví Web3",
        errorMessage: "Vui lòng liên kết ví Web3 (MetaMask hoặc Core Wallet) trên mạng Avalanche Fuji để ký lệnh cấp quyền USDC on-chain.",
      });
      setIsLinkWalletModalOpen(true);
      return;
    }
    if (stakeAmountBigInt === 0n) return;
    try {
      setTxStatus({ step: "awaiting_signature", actionTitle: "Approve USDC Cho StakedBrokerRegistry" });
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.usdc,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.stakedBrokerRegistry, stakeAmountBigInt],
      });

      setTxStatus({ step: "confirming", txHash: hash, actionTitle: "Approve USDC Cho StakedBrokerRegistry" });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });

      await refetchAllowance();
      setTxStatus({ step: "success", txHash: hash, actionTitle: "Approve USDC Hoàn Tất!" });
      setTimeout(() => setTxStatus({ step: "idle" }), 2000);
    } catch (err: any) {
      setTxStatus({ step: "error", errorMessage: parseContractError(err), actionTitle: "Approve USDC" });
    }
  };

  const handleStakeInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setTxStatus({
        step: "error",
        actionTitle: "Yêu Cầu Liên Kết Ví Web3",
        errorMessage: "Vui lòng liên kết ví Web3 (MetaMask hoặc Core Wallet) trên mạng Avalanche Fuji để nạp cọc bảo hiểm và ủy thác Aave V3.",
      });
      setIsLinkWalletModalOpen(true);
      return;
    }
    if (!isStakeApproved) return;
    try {
      setTxStatus({ step: "awaiting_signature", actionTitle: "Nạp Cọc Bảo Hiểm Aave V3 (stakeInsurance)" });
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
        abi: STAKED_BROKER_REGISTRY_ABI,
        functionName: "stakeInsurance",
        args: [stakeAmountBigInt],
      });

      setTxStatus({ step: "confirming", txHash: hash, actionTitle: "Nạp Cọc Bảo Hiểm Aave V3" });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });

      await refetchProfile();
      await refetchQuota();
      await refetchUsdc();
      await refetchAllowance();

      setTxStatus({ step: "success", txHash: hash, actionTitle: "Nạp Cọc & Mint aUSDC Hoàn Tất!" });
      setTimeout(() => setTxStatus({ step: "idle" }), 2500);
    } catch (err: any) {
      setTxStatus({ step: "error", errorMessage: parseContractError(err), actionTitle: "stakeInsurance" });
    }
  };

  const handleUnstakeInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      setTxStatus({
        step: "error",
        actionTitle: "Yêu Cầu Kết Nối Ví Web3 Thật",
        errorMessage: "Vui lòng kết nối ví Web3 thật (MetaMask hoặc Core Wallet) để rút tiền cọc gốc và chốt lãi Aave V3 về ví của bạn.",
      });
      setIsAuthModalOpen(true);
      return;
    }
    if (!isUnstakeValid) return;
    try {
      const unstakeBig = parseUsdc(unstakeInput);
      setTxStatus({ step: "awaiting_signature", actionTitle: "Rút Vốn & Nhận 80% Lãi (unstakeInsurance)" });
      const hash = await writeContractAsync({
        address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
        abi: STAKED_BROKER_REGISTRY_ABI,
        functionName: "unstakeInsurance",
        args: [unstakeBig],
      });

      setTxStatus({ step: "confirming", txHash: hash, actionTitle: "Rút Vốn & Nhận Lãi Aave V3" });
      if (publicClient) await publicClient.waitForTransactionReceipt({ hash });

      await refetchProfile();
      await refetchQuota();
      await refetchUsdc();

      setTxStatus({ step: "success", txHash: hash, actionTitle: "Rút Vốn & Nhận Lãi Hoàn Tất!" });
      setTimeout(() => setTxStatus({ step: "idle" }), 2500);
    } catch (err: any) {
      setTxStatus({ step: "error", errorMessage: parseContractError(err), actionTitle: "unstakeInsurance" });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── SCENIC 3D AAVE YIELD HERO BANNER ────────────────────────────── */}
      <div className="card overflow-hidden p-0 relative">
        <img
          src="/images/aave-yield-3d.png"
          alt="Aave V3 Real Yield"
          className="absolute right-0 top-0 h-full w-3/5 object-cover opacity-65 hidden sm:block"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1E47]/95 via-[#0E2454]/85 to-[#0E2454]/25" />

        <div className="relative p-7 sm:p-9 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="badge-pill bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-xs">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-300" />
              <span>StakedBrokerRegistry · Aave V3 Lending Pool</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Cọc Bảo Hiểm GDTG &amp; Lãi Thực Aave V3
            </h1>
            <p className="text-sm text-sky-100/85">
              Vốn thế chấp của Trung Gian tự động sinh lời thực trên Aave V3 (chia sẻ 80% cho GDTG / 20% Quỹ dự phòng)
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap shrink-0">
            <span className="badge-pill bg-sky-400/20 border border-sky-300/40 text-sky-100 text-xs">
              {currentUser?.role === "BROKER" ? "Tài khoản GDTG Bảo Chứng" : "Ký Quỹ Trở Thành GDTG"}
            </span>
            <span className="badge-pill bg-emerald-400/20 border border-emerald-300/40 text-emerald-100 text-xs">
              Bảo chứng 1:1 (100% Quota)
            </span>
          </div>
        </div>
      </div>

      {/* ── 4 FROSTED KPI CAPSULES ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-100/80 font-medium">Vốn gốc đang cọc</span>
            <div className="w-9 h-9 rounded-full bg-sky-400/20 border border-sky-300/30 flex items-center justify-center text-sky-200">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tabular-nums font-mono">
            {stakedNum.toLocaleString("en-US", { minimumFractionDigits: 0 })}
            <span className="text-xs text-sky-200/80 font-normal ml-1.5">USDC</span>
          </div>
          <div>
            {isBlacklisted ? (
              <span className="badge-pill bg-rose-500/25 text-rose-200 border border-rose-300/35 text-[11px]">Bị Cấm</span>
            ) : isVerified ? (
              <span className="badge-pill bg-emerald-400/20 text-emerald-200 border border-emerald-300/35 text-[11px]">
                <Check className="w-3 h-3" /> Đã Cấp Tick Xanh
              </span>
            ) : (
              <span className="badge-pill bg-white/[0.1] text-sky-100/75 border border-white/[0.18] text-[11px]">Chưa kích hoạt</span>
            )}
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-100/80 font-medium">Hạn mức bảo lãnh rảnh</span>
            <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-300 tabular-nums font-mono">
            {availableQuotaNum.toLocaleString("en-US", { minimumFractionDigits: 0 })}
            <span className="text-xs text-sky-200/80 font-normal ml-1.5">USDC</span>
          </div>
          <div className="space-y-1.5">
            <div className="w-full bg-white/[0.12] rounded-full h-2 overflow-hidden flex">
              <div className="bg-sky-400 h-full" style={{ width: `${Math.min(100, (activeAllocatedNum / (stakedNum || 1)) * 100)}%` }} />
              <div className="bg-emerald-400 h-full" style={{ width: `${Math.min(100, (availableQuotaNum / (stakedNum || 1)) * 100)}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-sky-100/80">
              <span>Đang bảo lãnh: <strong className="font-mono text-white">{activeAllocatedNum.toLocaleString()}</strong></span>
              <span>Khả dụng: <strong className="font-mono text-emerald-300">{availableQuotaNum.toLocaleString()}</strong></span>
            </div>
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-100/80 font-medium">Lãi thực Aave V3 (+5.2%)</span>
            <div className="w-9 h-9 rounded-full bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center text-emerald-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-300 tabular-nums font-mono">
            +{totalLiveYield.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-xs text-sky-200/80 font-normal ml-1.5">USDC</span>
          </div>
          <div className="text-[11px] text-sky-100/80 flex justify-between pt-1 border-t border-white/[0.12]">
            <span>Bạn nhận (80%): <strong className="text-emerald-300 font-mono">+{brokerShare80.toFixed(2)}</strong></span>
            <span>Quỹ sàn (20%): <strong className="text-white font-mono">+{treasuryShare20.toFixed(2)}</strong></span>
          </div>
        </div>

        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-100/80 font-medium">Hiệu suất phân xử</span>
            <div className="w-9 h-9 rounded-full bg-violet-400/20 border border-violet-300/30 flex items-center justify-center text-violet-200">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tabular-nums font-mono">
            {successfulDeals}/{totalDeals}
            <span className="text-xs font-sans text-sky-200/80 font-normal ml-1.5">kèo</span>
          </div>
          <div className="flex justify-between text-[11px] pt-1 border-t border-white/[0.12]">
            <span className="text-emerald-300 font-semibold">Hoàn thành {totalDeals > 0 ? ((successfulDeals / totalDeals) * 100).toFixed(1) : "100"}%</span>
            <span className="text-sky-100/80">Phạt cọc: <strong className="font-mono text-white">{slashedCount}</strong></span>
          </div>
        </div>
      </div>

      {/* ── MAIN 2-COLUMN WORKSPACE ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* LEFT (7 COLS): STAKE / UNSTAKE CONSOLE */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card p-6 sm:p-7 space-y-6">
            {/* Pill Tab Switcher */}
            <div className="grid grid-cols-2 gap-1.5 p-1.5 rounded-full bg-[#081635]/45 border border-white/[0.16]">
              <button
                type="button"
                onClick={() => setActiveTab("stake")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === "stake"
                    ? "bg-gradient-to-r from-sky-400/35 to-indigo-500/40 text-white border border-sky-300/45 shadow-sm"
                    : "text-sky-100/70 hover:text-white border border-transparent"
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-emerald-300" />
                <span>Nạp Cọc Bảo Hiểm</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("unstake")}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  activeTab === "unstake"
                    ? "bg-gradient-to-r from-sky-400/35 to-indigo-500/40 text-white border border-sky-300/45 shadow-sm"
                    : "text-sky-100/70 hover:text-white border border-transparent"
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-amber-300" />
                <span>Rút Vốn &amp; Chốt Lãi</span>
              </button>
            </div>

            {/* TAB 1: STAKE */}
            {activeTab === "stake" && (
              <form onSubmit={handleStakeInsurance} className="space-y-5">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-sky-100">
                      Số lượng USDC nạp làm cọc bảo hiểm
                    </label>
                    <span className="text-sky-100/80">
                      Số dư ví: <strong className="font-mono text-white">{formatUsdc(userUsdcBalance as bigint)} USDC</strong>
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
                      className="input-field rounded-2xl pl-4 pr-20 py-3.5 text-xl font-mono font-bold tabular-nums"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-sky-200">
                      USDC
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap pt-0.5">
                    {[500, 1000, 2500, 5000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setStakeInput(String(val))}
                        className={`px-3.5 py-1 rounded-full text-xs font-mono border transition-all ${
                          Number(stakeInput) === val
                            ? "bg-sky-400/25 border-sky-300/50 text-white font-bold"
                            : "bg-white/[0.08] border-white/[0.16] text-sky-100/80 hover:text-white"
                        }`}
                      >
                        +{val.toLocaleString()} USDC
                      </button>
                    ))}
                  </div>
                </div>

                {/* Routing Flow */}
                <div className="card-inner p-4 space-y-3">
                  <span className="text-xs text-sky-100/80 font-semibold uppercase tracking-wider block">
                    Chu trình ủy thác sinh lời tự động
                  </span>
                  <div className="flex items-center justify-between text-center gap-1.5 text-xs font-mono">
                    <div className="p-2.5 rounded-full bg-white/[0.08] border border-white/[0.15] flex-1 text-white">Ví GDTG</div>
                    <ArrowRight className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                    <div className="p-2.5 rounded-full bg-sky-400/20 border border-sky-300/35 flex-1 text-sky-100">Registry</div>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <div className="p-2.5 rounded-full bg-emerald-400/20 border border-emerald-300/35 flex-1 text-emerald-200 font-semibold">Aave Pool</div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-white/[0.12] text-xs text-sky-100">
                    <span>Hạn mức nhận kèo mở thêm (100% 1:1):</span>
                    <strong className="text-emerald-300 font-mono font-bold">
                      +{(parseFloat(stakeInput || "0") * 1.0).toLocaleString()} USDC
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <ShimmerButton
                    type="button"
                    onClick={handleApproveStake}
                    disabled={isStakeApproved || stakeAmountBigInt === 0n}
                    variant={isStakeApproved ? "success" : "primary"}
                    className="py-3.5"
                  >
                    {isStakeApproved ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>1. Đã Cấp Quyền USDC</span>
                      </>
                    ) : (
                      <span>1. Cấp Quyền (Approve)</span>
                    )}
                  </ShimmerButton>

                  <ShimmerButton
                    type="submit"
                    disabled={!isStakeApproved}
                    variant={isStakeApproved ? "primary" : "secondary"}
                    className="py-3.5"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    <span>2. Nạp Cọc &amp; Kích Hoạt Lãi</span>
                  </ShimmerButton>
                </div>
              </form>
            )}

            {/* TAB 2: UNSTAKE */}
            {activeTab === "unstake" && (
              <form onSubmit={handleUnstakeInsurance} className="space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-sky-100">
                      Số tiền cọc muốn rút về ví
                    </label>
                    <span className="text-sky-100/80">
                      Tối đa khả dụng: <strong className="font-mono text-white">{maxFreeStakeToUnstake.toLocaleString()} USDC</strong>
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
                      className="input-field rounded-2xl pl-4 pr-24 py-3.5 text-xl font-mono font-bold tabular-nums"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setUnstakeInput(String(maxFreeStakeToUnstake))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-sky-400/20 hover:bg-sky-400/30 border border-sky-300/35 text-xs font-mono text-sky-200 font-bold transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                <div className="card-inner p-4 space-y-2.5 text-xs">
                  <span className="text-sky-100/80 font-semibold uppercase tracking-wider block">
                    Dự tính quyết toán rút vốn
                  </span>
                  <div className="flex justify-between text-sky-100">
                    <span>Tiền cọc gốc rút về</span>
                    <span className="text-white font-mono font-semibold tabular-nums">{unstakeAmountNum.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between text-sky-100">
                    <span>80% Lợi tức Aave V3 cộng dồn</span>
                    <span className="text-emerald-300 font-mono font-semibold tabular-nums">+{brokerShare80.toFixed(2)} USDC</span>
                  </div>
                  <div className="pt-2.5 border-t border-white/[0.12] flex justify-between font-bold text-sm text-white">
                    <span>Tổng thực nhận về ví</span>
                    <span className="text-emerald-300 font-mono tabular-nums">{(unstakeAmountNum + Number(brokerShare80)).toFixed(2)} USDC</span>
                  </div>
                </div>

                {!isUnstakeValid && unstakeAmountNum > maxFreeStakeToUnstake && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-300/35 text-rose-100 text-xs">
                    Số tiền rút vượt quá hạn mức rảnh ({maxFreeStakeToUnstake.toLocaleString()} USDC). Phần còn lại đang bảo chứng cho kèo đang mở.
                  </div>
                )}

                <ShimmerButton
                  type="submit"
                  disabled={!isUnstakeValid}
                  variant="primary"
                  className="w-full py-3.5"
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  <span>Rút Vốn Gốc &amp; Chốt Lãi Về Ví</span>
                </ShimmerButton>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT (5 COLS): ON-CHAIN ACCOUNTING PROOF */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card-elevated p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.14]">
              <h3 className="text-base font-bold text-white">
                Kiểm Toán Lợi Tức On-Chain
              </h3>
              <span className="badge-pill bg-emerald-400/20 text-emerald-200 border border-emerald-300/35 text-[11px]">
                Real-Yield Proof
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-sky-100">
                <span>Tổng vốn gốc toàn sàn</span>
                <span className="font-bold font-mono text-white tabular-nums">{principalTotalNum.toLocaleString("en-US")} USDC</span>
              </div>
              <div className="flex justify-between items-center text-sky-100">
                <span>Số dư aUSDC trong Registry</span>
                <span className="font-bold font-mono text-emerald-300 tabular-nums">{aaveBalanceNum.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 6 })} aUSDC</span>
              </div>
              <div className="flex justify-between items-center text-sky-100">
                <span>Lãi thực Aave đã tích lũy</span>
                <span className="font-bold font-mono text-emerald-300 tabular-nums">+{totalAccruedYieldNum.toFixed(6)} USDC</span>
              </div>
            </div>

            <div className="card-inner p-4 space-y-2.5">
              <span className="text-xs text-sky-100/80 font-semibold uppercase tracking-wider block">
                Công thức chia lãi bất biến
              </span>
              <code className="text-xs font-mono text-sky-200 block bg-[#081635]/60 p-3 rounded-xl border border-white/[0.12]">
                Yield_GDTG = (aUSDC_Bal - Principal) × Share × 80%
              </code>
              <p className="text-xs text-sky-100/80 leading-relaxed">
                20% lợi tức còn lại chuyển về Quỹ Dự Phòng Bảo Hiểm để bảo vệ người dùng trong các sự cố thanh khoản.
              </p>
            </div>

            <div className="pt-3 border-t border-white/[0.14] space-y-2 text-xs">
              <span className="text-sky-100/80 block font-semibold">Xác thực trực tiếp trên Snowtrace:</span>
              <div className="space-y-2">
                {[
                  { label: "StakedBrokerRegistry.sol", addr: CONTRACT_ADDRESSES.stakedBrokerRegistry },
                  { label: "Aave V3 Lending Pool (Fuji)", addr: CONTRACT_ADDRESSES.aaveV3Pool },
                  { label: "aUSDC Interest-Bearing Token", addr: CONTRACT_ADDRESSES.aUsdc },
                ].map((item) => (
                  <a
                    key={item.label}
                    href={`https://testnet.snowtrace.io/address/${item.addr}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-full bg-white/[0.08] hover:bg-white/[0.15] border border-white/[0.15] text-white flex items-center justify-between px-4 transition-colors"
                  >
                    <span className="font-mono text-xs">{item.label}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-sky-200" />
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
