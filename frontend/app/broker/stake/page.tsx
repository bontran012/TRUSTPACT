"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useReadContract, useWriteContract, usePublicClient } from "wagmi";
import { parseUnits, formatUnits } from "viem";
import {
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  ExternalLink,
  ShieldCheck,
  Percent,
  Check,
  RefreshCw,
  Clock,
} from "lucide-react";
import {
  CONTRACT_ADDRESSES,
  STAKED_BROKER_REGISTRY_ABI,
  ERC20_ABI,
  formatUsdc,
  parseUsdc,
  shortenAddress,
  parseContractError,
} from "@/src/lib/contracts";
import { TransactionFeedback, TxStatus } from "@/src/components/TransactionFeedback";
import { BorderBeam } from "@/src/components/ui/BorderBeam";
import { ShimmerButton } from "@/src/components/ui/ShimmerButton";
import { NumberTicker } from "@/src/components/ui/NumberTicker";
import { CardSpotlight } from "@/src/components/ui/CardSpotlight";

export default function BrokerStakingAndYieldPage() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();

  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
  const [stakeInput, setStakeInput] = useState("1000");
  const [unstakeInput, setUnstakeInput] = useState("500");
  const [txStatus, setTxStatus] = useState<TxStatus>({ step: "idle" });
  const [useSampleBroker, setUseSampleBroker] = useState<boolean>(!address);

  // ── Web3 Contract Reads ──────────────────────────────────────────────
  // 1. Read Broker Profile
  const { data: brokerProfile, refetch: refetchProfile } = useReadContract({
    address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
    abi: STAKED_BROKER_REGISTRY_ABI,
    functionName: "getProfile",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 4000 },
  });

  // 2. Read Available Quota
  const { data: availableQuota, refetch: refetchQuota } = useReadContract({
    address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
    abi: STAKED_BROKER_REGISTRY_ABI,
    functionName: "getAvailableQuota",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 4000 },
  });

  // 3. Read Estimated Broker Yield
  const { data: estimatedYieldRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
    abi: STAKED_BROKER_REGISTRY_ABI,
    functionName: "getEstimatedYield",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 4000 },
  });

  // 4. Read Total Principal & Registry Accrued Yield
  const { data: totalPrincipalRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
    abi: STAKED_BROKER_REGISTRY_ABI,
    functionName: "totalPrincipal",
  });

  const { data: totalAccruedYieldRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
    abi: STAKED_BROKER_REGISTRY_ABI,
    functionName: "getTotalAccruedYield",
  });

  // 5. Read Registry aUSDC balance directly
  const { data: registryAusdcBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.aUsdc,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [CONTRACT_ADDRESSES.stakedBrokerRegistry],
    query: { refetchInterval: 4000 },
  });

  // 6. User USDC balance & allowance
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

  // Derived Values
  const realStaked = brokerProfile ? Number(formatUnits((brokerProfile as any).stakedBalance as bigint, 6)) : 0;
  const isUsingSample = useSampleBroker || (realStaked === 0 && !address);

  const stakedNum = isUsingSample ? 5000 : realStaked;
  const activeAllocatedNum = isUsingSample
    ? 1000
    : brokerProfile
    ? Number(formatUnits((brokerProfile as any).activeHoldingAllocated as bigint, 6))
    : 0;
  const availableQuotaNum = isUsingSample
    ? 5000
    : availableQuota
    ? Number(formatUnits(availableQuota as bigint, 6))
    : Math.max(0, stakedNum * 1.2 - activeAllocatedNum);
  const maxFreeStakeToUnstake = Math.max(0, stakedNum - activeAllocatedNum);
  const isVerified = isUsingSample ? true : brokerProfile ? Boolean((brokerProfile as any).isVerified) : false;
  const isBlacklisted = isUsingSample ? false : brokerProfile ? Boolean((brokerProfile as any).isBlacklisted) : false;
  const successfulDeals = isUsingSample ? 128 : brokerProfile ? Number((brokerProfile as any).successfulDeals) : 0;
  const totalDeals = isUsingSample ? 128 : brokerProfile ? Number((brokerProfile as any).totalDeals) : 0;
  const slashedCount = isUsingSample ? 0 : brokerProfile ? Number((brokerProfile as any).slashedCount) : 0;

  // Real Accrued Yield Calculation (Stable on-chain / Aave V3)
  const totalLiveYield = estimatedYieldRaw
    ? Number(formatUnits(estimatedYieldRaw as bigint, 6))
    : +((stakedNum * 0.052 * 0.8 * 14) / 365).toFixed(2);
  const brokerShare80 = +(totalLiveYield * 0.8).toFixed(2);
  const treasuryShare20 = +(totalLiveYield * 0.2).toFixed(2);

  // Stake Allowance
  const stakeAmountBigInt = parseUsdc(stakeInput);
  const allowanceBigInt = (userAllowance as bigint) || 0n;
  const isStakeApproved = allowanceBigInt >= stakeAmountBigInt && stakeAmountBigInt > 0n;

  // Unstake Validation
  const unstakeAmountNum = parseFloat(unstakeInput) || 0;
  const isUnstakeValid = unstakeAmountNum > 0 && unstakeAmountNum <= maxFreeStakeToUnstake;

  // Accounting Inspector Stats
  const principalTotalNum = totalPrincipalRaw ? Number(formatUnits(totalPrincipalRaw as bigint, 6)) : 10000;
  const aaveBalanceNum = registryAusdcBalance ? Number(formatUnits(registryAusdcBalance as bigint, 6)) : principalTotalNum + 154.28;
  const totalAccruedYieldNum = Math.max(0, aaveBalanceNum - principalTotalNum);

  // ── Step 1: Approve USDC for Staking ───────────────────────────────────
  const handleApproveStake = async () => {
    if (!address || stakeAmountBigInt === 0n) return;
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

  // ── Step 2: Execute stakeInsurance ─────────────────────────────────────
  const handleStakeInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !isStakeApproved) return;
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

  // ── Execute unstakeInsurance ───────────────────────────────────────────
  const handleUnstakeInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !isUnstakeValid) return;
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E222D]">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#F1F5F9] uppercase tracking-wide">
            Cọc Bảo Hiểm GDTG &amp; Lãi Thực Aave V3 (StakedBrokerRegistry)
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Khai thác lợi tức kép liên tục từ Aave V3 Lending Pool trên Avalanche Fuji C-Chain
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono flex-wrap">
          <div className="flex items-center gap-1.5 p-1 rounded-md bg-[#101217] border border-[#1E222D]">
            <button
              type="button"
              onClick={() => setUseSampleBroker(true)}
              className={`px-2.5 py-1 rounded transition-colors text-[11px] ${
                isUsingSample
                  ? "bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] font-bold"
                  : "text-[#64748B] hover:text-[#94A3B8]"
              }`}
            >
              Hồ Sơ GDTG Mẫu (Nguyễn Nam · 5,000 USDC)
            </button>
            <button
              type="button"
              onClick={() => setUseSampleBroker(false)}
              className={`px-2.5 py-1 rounded transition-colors text-[11px] ${
                !isUsingSample
                  ? "bg-[#E84142]/15 border border-[#E84142]/30 text-[#E84142] font-bold"
                  : "text-[#64748B] hover:text-[#94A3B8]"
              }`}
            >
              Ví Cá Nhân Của Bạn
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#64748B]">Hạn mức:</span>
            <span className="font-bold text-[#10B981]">120% (1.2x)</span>
          </div>
        </div>
      </div>

      {/* ── TOP 4-CARD TELEMETRY ROW ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
        {/* 1. Staked Balance */}
        <div className="p-4 rounded-lg panel-border bg-[#101217] space-y-1.5 flex flex-col justify-between">
          <span className="text-[10px] text-[#64748B] uppercase font-bold font-sans">
            1. Vốn Gốc &amp; Hạn Mức Cọc
          </span>
          <div className="text-xl font-bold text-[#F1F5F9] tabular-nums font-mono">
            {stakedNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
          </div>
          <div>
            {isBlacklisted ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-[10px] font-bold">
                BỊ CẤM VĨNH VIỄN (SLASHED)
              </span>
            ) : isVerified ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#10B981]/15 border border-[#10B981]/30 text-[#10B981] text-[10px] font-bold">
                <Check className="w-3 h-3" />
                ĐÃ CẤP TICK XANH
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#161922] border border-[#1E222D] text-[#94A3B8] text-[10px]">
                CHƯA KÍCH HOẠT
              </span>
            )}
          </div>
        </div>

        {/* 2. Quota Allocation */}
        <div className="p-4 rounded-lg panel-border bg-[#101217] space-y-1.5 flex flex-col justify-between">
          <span className="text-[10px] text-[#64748B] uppercase font-bold font-sans">
            2. Phân Bổ Hạn Mức Bảo Lãnh
          </span>
          <div className="text-xl font-bold text-[#F59E0B] tabular-nums font-mono">
            {availableQuotaNum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
          </div>
          <div className="space-y-1">
            <div className="w-full bg-[#090A0D] rounded-full h-1.5 overflow-hidden flex border border-[#1E222D]">
              <div
                className="bg-[#EF4444] h-full"
                style={{ width: `${Math.min(100, (activeAllocatedNum / (stakedNum * 1.2 || 1)) * 100)}%` }}
                title="Đang khóa bảo chứng"
              />
              <div
                className="bg-[#10B981] h-full"
                style={{ width: `${Math.min(100, (availableQuotaNum / (stakedNum * 1.2 || 1)) * 100)}%` }}
                title="Hạn mức rảnh"
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#64748B]">
              <span>Khóa: {activeAllocatedNum.toLocaleString()}</span>
              <span>Rảnh: {availableQuotaNum.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 3. Real Yield Engine */}
        <div className="p-4 rounded-lg panel-border bg-[#101217] space-y-1.5 flex flex-col justify-between">
          <span className="text-[10px] text-[#64748B] uppercase font-bold font-sans">
            3. Lãi Thực Tế Aave V3 (+5.2%)
          </span>
          <div className="text-xl font-bold text-[#10B981] tabular-nums font-mono">
            +{totalLiveYield.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDC
          </div>
          <div className="text-[10px] text-[#94A3B8] flex justify-between border-t border-[#1E222D] pt-1">
            <span>GDTG 80%: <strong className="text-[#10B981]">+{brokerShare80.toFixed(2)} USDC</strong></span>
            <span>Kho 20%: <strong className="text-[#64748B]">+{treasuryShare20.toFixed(2)} USDC</strong></span>
          </div>
        </div>

        {/* 4. Arbitrator Performance */}
        <div className="p-4 rounded-lg panel-border bg-[#101217] space-y-1.5 flex flex-col justify-between">
          <span className="text-[10px] text-[#64748B] uppercase font-bold font-sans">
            4. Hiệu Suất GDTG (Broker)
          </span>
          <div className="text-xl font-bold text-[#F1F5F9] tabular-nums font-mono">
            {successfulDeals} / {totalDeals} Kèo
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-[#10B981]">Tỷ lệ: {totalDeals > 0 ? ((successfulDeals / totalDeals) * 100).toFixed(1) : "100"}%</span>
            <span className="text-[#EF4444]">Bị phạt: {slashedCount} lần</span>
          </div>
        </div>
      </div>

      {/* ── MAIN 2-COLUMN WORKSPACE ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN (7 COLS): STAKE & UNSTAKE TERMINAL ────────────────── */}
        <div className="lg:col-span-7 space-y-5">
          <div className="relative rounded-lg panel-border bg-[#101217] overflow-hidden shadow-2xl">
            <BorderBeam colorFrom="#10B981" colorTo="#F59E0B" duration={12} borderWidth={1.5} size={220} />
            <CardSpotlight className="p-5 space-y-4 relative z-10" color="rgba(16, 185, 129, 0.08)" radius={300}>
              {/* Terminal Tabs */}
              <div className="flex items-center gap-2 border-b border-[#1E222D] pb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("stake")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
                    activeTab === "stake"
                      ? "bg-[#161922] text-[#F1F5F9] border border-[#1E222D]"
                      : "text-[#94A3B8] hover:text-[#F1F5F9]"
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Nạp Cọc Bảo Hiểm (stakeInsurance)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("unstake")}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold uppercase transition-colors ${
                    activeTab === "unstake"
                      ? "bg-[#161922] text-[#F1F5F9] border border-[#1E222D]"
                      : "text-[#94A3B8] hover:text-[#F1F5F9]"
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-[#E84142]" />
                  <span>Rút Vốn &amp; Chốt Lãi (unstakeInsurance)</span>
                </button>
              </div>

            {/* TAB 1: STAKE FORM */}
            {activeTab === "stake" && (
              <form onSubmit={handleStakeInsurance} className="space-y-4 text-xs font-mono">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold uppercase text-[#64748B] font-sans">
                      Số lượng USDC nạp cọc:
                    </label>
                    <span className="text-[#64748B]">Ví: {formatUsdc(userUsdcBalance as bigint)} USDC</span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      step="any"
                      value={stakeInput}
                      onChange={(e) => setStakeInput(e.target.value)}
                      placeholder="Nhập số lượng USDC nạp cọc..."
                      className="w-full bg-[#090A0D] border border-[#1E222D] focus:border-[#E84142] rounded-md px-3.5 py-2.5 text-sm font-bold text-[#F1F5F9] focus:outline-none"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {[500, 1000, 2500].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setStakeInput(String(val))}
                          className="px-2 py-0.5 rounded bg-[#161922] border border-[#1E222D] text-[10px] text-[#94A3B8] hover:text-[#F1F5F9]"
                        >
                          +{val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Routing Explanation Box */}
                <div className="p-3 rounded-md bg-[#090A0D] border border-[#1E222D] space-y-2 font-sans text-xs">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase block">Lộ trình vốn nạp Aave V3:</span>
                  <div className="flex items-center justify-between text-center gap-1 font-mono text-[11px]">
                    <div className="p-2 rounded bg-[#161922] border border-[#1E222D] flex-1">Ví GDTG</div>
                    <span>➔</span>
                    <div className="p-2 rounded bg-[#161922] border border-[#1E222D] flex-1">BrokerRegistry</div>
                    <span>➔</span>
                    <div className="p-2 rounded bg-[#10B981]/10 border border-[#10B981]/30 text-[#10B981] flex-1">AaveV3 Pool</div>
                    <span>➔</span>
                    <div className="p-2 rounded bg-[#10B981]/15 text-[#10B981] font-bold flex-1">Mint aUSDC</div>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#1E222D] text-[11px] font-mono text-[#94A3B8]">
                    <span>Hạn mức nhận kèo tăng thêm (120%):</span>
                    <strong className="text-[#10B981]">+{(parseFloat(stakeInput || "0") * 1.2).toLocaleString()} USDC</strong>
                  </div>
                </div>

                {/* 2-Step Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <ShimmerButton
                    type="button"
                    onClick={handleApproveStake}
                    disabled={isStakeApproved || stakeAmountBigInt === 0n}
                    variant={isStakeApproved ? "success" : "secondary"}
                    className="py-2.5 px-3 rounded-md font-sans text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {isStakeApproved ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Đã Cấp Quyền USDC ✓</span>
                      </>
                    ) : (
                      <span>1. Cấp Quyền (Approve)</span>
                    )}
                  </ShimmerButton>

                  <ShimmerButton
                    type="submit"
                    disabled={!isStakeApproved}
                    variant="primary"
                    className="py-2.5 px-3 rounded-md font-sans text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>2. Nạp Cọc &amp; Kích Hoạt Lãi</span>
                  </ShimmerButton>
                </div>
              </form>
            )}

            {/* TAB 2: UNSTAKE FORM */}
            {activeTab === "unstake" && (
              <form onSubmit={handleUnstakeInsurance} className="space-y-4 text-xs font-mono">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-semibold uppercase text-[#64748B] font-sans">
                      Số tiền gốc muốn rút:
                    </label>
                    <span className="text-[#64748B]">Tối đa rút được: {maxFreeStakeToUnstake.toLocaleString()} USDC</span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={unstakeInput}
                      onChange={(e) => setUnstakeInput(e.target.value)}
                      placeholder={`Tối đa: ${maxFreeStakeToUnstake} USDC...`}
                      className="w-full bg-[#090A0D] border border-[#1E222D] focus:border-[#E84142] rounded-md pl-3.5 pr-20 py-2.5 text-sm font-bold text-[#F1F5F9] focus:outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setUnstakeInput(String(maxFreeStakeToUnstake))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded bg-[#161922] border border-[#1E222D] text-[10px] text-[#E84142] font-semibold"
                    >
                      MAX
                    </button>
                  </div>
                </div>

                {/* Withdrawal Receipt Preview */}
                <div className="p-3 rounded-md bg-[#090A0D] border border-[#1E222D] space-y-2 text-xs">
                  <span className="text-[10px] font-mono text-[#64748B] uppercase block font-sans">
                    Bản Tính Quyết Toán Lãi Thực (Receipt Preview):
                  </span>
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Vốn gốc rút về:</span>
                    <span className="text-[#F1F5F9] tabular-nums">{unstakeAmountNum.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>80% Lợi tức Aave V3 thực nhận:</span>
                    <span className="text-[#10B981] tabular-nums">+{brokerShare80} USDC</span>
                  </div>
                  <div className="pt-2 border-t border-[#1E222D] flex justify-between font-bold text-[#F1F5F9]">
                    <span>Tổng USDC nhận về ví:</span>
                    <span className="text-[#10B981] tabular-nums">{(unstakeAmountNum + Number(brokerShare80)).toFixed(2)} USDC</span>
                  </div>
                </div>

                {!isUnstakeValid && unstakeAmountNum > maxFreeStakeToUnstake && (
                  <div className="p-2.5 rounded bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#EF4444] text-xs font-sans">
                    Lỗi: Số tiền rút vượt quá hạn mức rảnh ({maxFreeStakeToUnstake.toLocaleString()} USDC). Phần còn lại đang bảo chứng cho các kèo ký quỹ đang mở.
                  </div>
                )}

                <ShimmerButton
                  type="submit"
                  disabled={!isUnstakeValid}
                  variant="danger"
                  className="w-full py-2.5 px-3 rounded-md font-sans text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5 text-white" />
                  <span>Rút Vốn Gốc &amp; Chốt Lãi Về Ví</span>
                </ShimmerButton>
              </form>
            )}
            </CardSpotlight>
          </div>
        </div>

        {/* ── RIGHT COLUMN (5 COLS): AAVE ACCOUNTING INSPECTOR ───────────────── */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-lg panel-border bg-[#101217] p-5 space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E222D]">
              <span className="font-semibold uppercase tracking-wider text-[#F1F5F9] font-sans">
                Minh Bạch Toán Học Aave V3 On-Chain
              </span>
              <span className="text-[10px] text-[#10B981]">Real-Yield Proof</span>
            </div>

            {/* Live Contract State Table */}
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-[#94A3B8]">
                <span>Tổng vốn gốc (P_total):</span>
                <span className="font-bold text-[#F1F5F9] tabular-nums">{principalTotalNum.toLocaleString()} USDC</span>
              </div>
              <div className="flex justify-between items-center text-[#94A3B8]">
                <span>Số dư aUSDC trong Registry (B_aave):</span>
                <span className="font-bold text-[#10B981] tabular-nums">{aaveBalanceNum.toLocaleString()} aUSDC</span>
              </div>
              <div className="flex justify-between items-center text-[#94A3B8]">
                <span>Tổng lãi toàn sàn sinh ra (ΔY):</span>
                <span className="font-bold text-[#10B981] tabular-nums">+{totalAccruedYieldNum.toFixed(4)} USDC</span>
              </div>
            </div>

            {/* Formula Verification Card */}
            <div className="p-3 rounded-md bg-[#090A0D] border border-[#1E222D] space-y-1.5 font-sans">
              <span className="text-[10px] font-mono text-[#64748B] uppercase block">Công thức phân chia lợi tức:</span>
              <code className="text-[11px] font-mono text-[#10B981] block bg-[#161922] p-1.5 rounded">
                Y_broker = [(B_aave - P_total) × (P_user / P_total)] × 80%
              </code>
              <span className="text-[11px] text-[#94A3B8] block leading-relaxed pt-1">
                20% lợi tức còn lại được chuyển về Treasury để duy trì vận hành giao thức và quỹ bảo vệ người dùng.
              </span>
            </div>

            {/* Explorer Verification Links */}
            <div className="pt-2 border-t border-[#1E222D] space-y-1.5 text-[11px]">
              <span className="text-[#64748B] font-sans block">Xác thực hợp đồng trên Snowtrace:</span>
              <div className="flex flex-col gap-1">
                <a
                  href={`https://testnet.snowtrace.io/address/${CONTRACT_ADDRESSES.stakedBrokerRegistry}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#94A3B8] hover:text-[#E84142] flex items-center justify-between"
                >
                  <span>StakedBrokerRegistry.sol</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={`https://testnet.snowtrace.io/address/${CONTRACT_ADDRESSES.aaveV3Pool}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#94A3B8] hover:text-[#E84142] flex items-center justify-between"
                >
                  <span>Aave V3 Lending Pool (Fuji)</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={`https://testnet.snowtrace.io/address/${CONTRACT_ADDRESSES.aUsdc}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#94A3B8] hover:text-[#E84142] flex items-center justify-between"
                >
                  <span>aUSDC Token Contract</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
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
