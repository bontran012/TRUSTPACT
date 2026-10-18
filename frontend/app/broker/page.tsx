"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  History,
} from "lucide-react";
import { AaveIcon } from "../../components/CryptoIcons";
import { useStore } from "../../lib/store";
import { LiveYieldCounter } from "../../components/LiveYieldCounter";
import { TrustPassportCard } from "../../components/TrustPassportCard";

export default function BrokerStakingPage() {
  const { brokers, stakeInsurance, unstakeInsurance, stakingHistory } = useStore();
  const brokerNam = brokers.find((b) => b.id === "broker-nam") || brokers[0];

  const [stakeInput, setStakeInput] = useState("");
  const [unstakeInput, setUnstakeInput] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const maxWithdrawable = Math.max(0, brokerNam.stakedAmount - brokerNam.activeAllocated);
  const utilizationPct = Math.min(
    100,
    Math.round((brokerNam.activeAllocated / brokerNam.maxLimit) * 100)
  );
  const handleStake = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(stakeInput);
    if (!amount || amount <= 0) return;
    stakeInsurance(brokerNam.id, amount);
    setStakeInput("");
    setErrorMsg(null);
    setNotice(
      `Đã nạp bổ sung ${amount.toLocaleString()} USDC vào Aave V3 Pool. Hạn mức nhận kèo nâng lên ${(
        (brokerNam.stakedAmount + amount) *
        1.2
      ).toLocaleString()} USDC!`
    );
    setTimeout(() => setNotice(null), 4000);
  };
  const handleUnstake = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(unstakeInput);
    if (!amount || amount <= 0) return;
    const ok = unstakeInsurance(brokerNam.id, amount);
    if (!ok) {
      setErrorMsg(
        `Không thể rút ${amount.toLocaleString()} USDC! Bạn chỉ được rút tối đa ${maxWithdrawable.toLocaleString()} USDC do phần còn lại đang bảo chứng cho các hợp đồng đang mở.`
      );
      return;
    }
    setUnstakeInput("");
    setErrorMsg(null);
    setNotice(
      `Đã rút thành công ${amount.toLocaleString()} USDC vốn gốc kèm 80% lợi tức thực tích lũy từ Aave V3 về ví!`
    );
    setTimeout(() => setNotice(null), 4000);
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 space-y-8">
      {/* TOP HERO BANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 sm:p-8 rounded-3xl glass-panel">
        <div className="lg:col-span-7 space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <AaveIcon className="w-3.5 h-3.5" />
            <span>StakedBrokerRegistry.sol • Tích Hợp Aave V3 Lending Pool</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Quản Lý Cọc Bảo Chứng & Khai Thác Lợi Tức Thực Aave V3
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Tiền cọc bảo hiểm của Thương Nhân Trung Gian không bị đóng băng mà tự động mint{" "}
            <strong className="text-emerald-400">aUSDC</strong> sinh lãi kép mỗi 0.8s. Phân bổ lợi tức:{" "}
            <strong className="text-white">80% về GDTG</strong> • <strong className="text-white">20% về Treasury</strong>.
          </p>
          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
            <span className="flex items-center space-x-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Đòn bẩy hạn mức: 120% Quota</span>
            </span>
            <span className="flex items-center space-x-1.5 text-emerald-400 font-mono font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>5.20% Supply APY</span>
            </span>
          </div>
        </div>
        <div className="lg:col-span-5">
          <LiveYieldCounter
            principalAmount={brokerNam.stakedAmount}
            apy={5.2}
            baseYield={18.642}
          />
        </div>
      </div>
      {notice && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {/* 4 OVERVIEW METRICS + QUOTA HEALTH FACTOR */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-2xl p-5 glass-panel space-y-1">
          <span className="text-xs text-slate-400 block">Vốn Cọc Đang Stake</span>
          <div className="text-2xl font-extrabold font-mono text-white">
            {brokerNam.stakedAmount.toLocaleString()} USDC
          </div>
          <span className="text-[11px] text-emerald-400 font-mono block">
            Đang sinh lãi trong Aave V3
          </span>
        </div>
        <div className="rounded-2xl p-5 glass-panel space-y-1">
          <span className="text-xs text-slate-400 block">Tổng Hạn Mức Bảo Lãnh (120%)</span>
          <div className="text-2xl font-extrabold font-mono text-blue-400">
            {brokerNam.maxLimit.toLocaleString()} USDC
          </div>
          <span className="text-[11px] text-slate-400 font-mono block">
            Khả dụng: {(brokerNam.maxLimit - brokerNam.activeAllocated).toLocaleString()} USDC
          </span>
        </div>
        <div className="rounded-2xl p-5 glass-panel space-y-1">
          <span className="text-xs text-slate-400 block">Đang Bảo Chứng Hợp Đồng Mở</span>
          <div className="text-2xl font-extrabold font-mono text-amber-400">
            {brokerNam.activeAllocated.toLocaleString()} USDC
          </div>
          <span className="text-[11px] text-slate-400 font-mono block">
            Chiếm {utilizationPct}% tổng hạn mức
          </span>
        </div>
        <div className="rounded-2xl p-5 glass-panel space-y-1">
          <span className="text-xs text-slate-400 block">Số Dư Rút Khả Dụng Tối Đa</span>
          <div className="text-2xl font-extrabold font-mono text-emerald-400">
            {maxWithdrawable.toLocaleString()} USDC
          </div>
          <span className="text-[11px] text-slate-400 font-mono block">
            Rút tức thì + nhận lãi 80%
          </span>
        </div>
      </div>
      {/* STAKE & UNSTAKE FORMS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stake Form */}
        <div className="rounded-2xl p-6 glass-panel space-y-5">
          <div className="flex items-center space-x-3 pb-4 border-b border-white/[0.07]">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Nạp Bổ Sung Cọc Bảo Chứng (stakeInsurance)
              </h2>
              <span className="text-xs text-slate-400">
                Tự động cấp hạn mức 120% và mint aUSDC
              </span>
            </div>
          </div>
          <form onSubmit={handleStake} className="space-y-4">
            <div className="relative">
              <input
                type="number"
                min="10"
                step="any"
                value={stakeInput}
                onChange={(e) => setStakeInput(e.target.value)}
                placeholder="Nhập số lượng USDC (vd: 1000)"
                className="w-full bg-[#04060B] border border-white/[0.1] rounded-xl px-4 py-3 text-sm font-mono font-bold text-white"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5">
                {[500, 1000, 2500].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setStakeInput(String(v))}
                    className="px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] text-[10px] font-mono text-slate-300"
                  >
                    +{v}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#04060B] border border-white/[0.06] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Hạn mức kèo tăng thêm (120%):</span>
                <strong className="text-emerald-400 font-mono">
                  +{(parseFloat(stakeInput || "0") * 1.2).toLocaleString()} USDC
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lợi tức dự kiến nhận (80% share):</span>
                <strong className="text-white font-mono">
                  ~{(parseFloat(stakeInput || "0") * 0.052 * 0.8).toFixed(2)} USDC / năm
                </strong>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition-all"
            >
              Nạp Cọc Vào Aave V3 Lending Pool
            </button>
          </form>
        </div>
        {/* Unstake Form */}
        <div className="rounded-2xl p-6 glass-panel space-y-5">
          <div className="flex items-center space-x-3 pb-4 border-b border-white/[0.07]">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Rút Vốn & Tất Toán Lãi Thực (unstakeInsurance)
              </h2>
              <span className="text-xs text-slate-400">
                Rút phần vốn rảnh rỗi kèm 80% lãi Aave V3
              </span>
            </div>
          </div>
          <form onSubmit={handleUnstake} className="space-y-4">
            <div className="relative">
              <input
                type="number"
                min="1"
                step="any"
                value={unstakeInput}
                onChange={(e) => setUnstakeInput(e.target.value)}
                placeholder={`Tối đa khả dụng: ${maxWithdrawable} USDC`}
                className="w-full bg-[#04060B] border border-white/[0.1] rounded-xl px-4 py-3 text-sm font-mono font-bold text-white"
                required
              />
              <button
                type="button"
                onClick={() => setUnstakeInput(String(maxWithdrawable))}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold"
              >
                MAX ({maxWithdrawable})
              </button>
            </div>
            <div className="p-3.5 rounded-xl bg-[#04060B] border border-white/[0.06] text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Đang khóa bảo chứng hợp đồng mở:</span>
                <strong className="text-amber-400 font-mono">
                  {brokerNam.activeAllocated.toLocaleString()} USDC
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lãi thực nhận kèm (80% Aave Yield):</span>
                <strong className="text-emerald-400 font-mono">
                  +{(parseFloat(unstakeInput || "0") * 0.008).toFixed(2)} USDC
                </strong>
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.12] text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              Rút Vốn Gốc & Nhận Lãi Về Ví
            </button>
          </form>
        </div>
      </div>
      {/* BOTTOM SECTION: SBT PASSPORT + STAKING LEDGER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5">
          <TrustPassportCard
            name={brokerNam.name}
            address={brokerNam.address}
            tokenId={brokerNam.tokenId}
            tierTitle={brokerNam.badge}
            score={99}
            dealsCount={brokerNam.completedDeals}
            successRate={100}
            stakedAmount={brokerNam.stakedAmount}
          />
        </div>
        <div className="lg:col-span-7 rounded-2xl glass-panel p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.07]">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <History className="w-4 h-4 text-blue-400" />
              <span>Sổ Cái Lịch Sử Dòng Tiền Aave V3</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Fuji C-Chain</span>
          </div>
          <div className="space-y-2.5">
            {stakingHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-[#04060B] border border-white/[0.06] flex items-center justify-between text-xs"
              >
                <div>
                  <span
                    className={`font-mono font-bold ${
                      item.type === "STAKE"
                        ? "text-emerald-400"
                        : item.type === "UNSTAKE"
                        ? "text-blue-400"
                        : "text-amber-400"
                    }`}
                  >
                    {item.type === "STAKE" && `+ Nạp Cọc Bảo Chứng (${item.amount.toLocaleString()} USDC)`}
                    {item.type === "UNSTAKE" && `- Rút Cọc (${item.amount.toLocaleString()} USDC)`}
                    {item.type === "YIELD_CLAIM" && `★ Thu Lợi Tức Aave (+${item.yieldEarned} USDC)`}
                  </span>
                  <span className="text-[11px] text-slate-500 block font-mono mt-0.5">
                    Tx: {item.txHash} • {item.timestamp}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded bg-white/[0.04] text-[10px] font-mono text-slate-300">
                  Confirmed
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}