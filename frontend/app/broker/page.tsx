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
        (brokerNam.stakedAmount + amount) * 1.2
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
        `Không thể rút ${amount.toLocaleString()} USDC! Tối đa khả dụng: ${maxWithdrawable.toLocaleString()} USDC (phần còn lại đang bảo chứng hợp đồng mở).`
      );
      return;
    }
    setUnstakeInput("");
    setErrorMsg(null);
    setNotice(
      `Đã rút thành công ${amount.toLocaleString()} USDC vốn gốc kèm 80% lợi tức Aave V3 về ví!`
    );
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-24 space-y-8">

      {/* HERO BANNER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0F172A] via-[#0B1120] to-[#070B14] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-56 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="lg:col-span-7 space-y-3.5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300 text-xs font-mono">
            <AaveIcon className="w-3.5 h-3.5" />
            <span>StakedBrokerRegistry.sol · Aave V3 Lending Pool</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Quản Lý Cọc Bảo Chứng &amp; Khai Thác Lợi Tức Aave V3
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            Tiền cọc bảo hiểm của thương nhân không bị đóng băng tĩnh — tự động mint{" "}
            <span className="text-emerald-400 font-semibold">aUSDC</span> sinh lãi kép liên tục mỗi block.
            Phân bổ lợi tức:{" "}
            <strong className="text-white">80% về GDTG</strong> •{" "}
            <strong className="text-slate-300">20% về Treasury</strong>.
          </p>
          <div className="flex flex-wrap items-center gap-5 pt-1 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Đòn bẩy hạn mức: <strong>120% Quota</strong></span>
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold">
              <TrendingUp className="w-4 h-4" />
              <span>5.20% Supply APY</span>
            </span>
          </div>
        </div>

        <div className="lg:col-span-5 relative z-10">
          <LiveYieldCounter
            principalAmount={brokerNam.stakedAmount}
            apy={5.2}
            baseYield={18.642}
          />
        </div>
      </div>

      {/* NOTICES */}
      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 shadow-md">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2.5 shadow-md">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 4 OVERVIEW METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl p-5 bg-[#0D1424]/90 border border-slate-800 shadow-xl space-y-1.5">
          <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-mono">Vốn Cọc Đang Stake</span>
          <div className="text-2xl font-extrabold font-mono text-white tabular-nums">
            {brokerNam.stakedAmount.toLocaleString()} USDC
          </div>
          <span className="text-xs text-emerald-400 font-mono block">
            Đang sinh lãi kép trong Aave V3
          </span>
        </div>

        <div className="rounded-2xl p-5 bg-[#0D1424]/90 border border-slate-800 shadow-xl space-y-1.5">
          <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-mono">Tổng Hạn Mức (120%)</span>
          <div className="text-2xl font-extrabold font-mono text-blue-400 tabular-nums">
            {brokerNam.maxLimit.toLocaleString()} USDC
          </div>
          <span className="text-xs text-slate-400 font-mono block">
            Khả dụng: {(brokerNam.maxLimit - brokerNam.activeAllocated).toLocaleString()} USDC
          </span>
        </div>

        <div className="rounded-2xl p-5 bg-[#0D1424]/90 border border-slate-800 shadow-xl space-y-1.5">
          <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-mono">Đang Bảo Chứng Kèo Mở</span>
          <div className="text-2xl font-extrabold font-mono text-amber-400 tabular-nums">
            {brokerNam.activeAllocated.toLocaleString()} USDC
          </div>
          <span className="text-xs text-slate-400 font-mono block">
            Chiếm {utilizationPct}% tổng hạn mức
          </span>
        </div>

        <div className="rounded-2xl p-5 bg-[#0D1424]/90 border border-slate-800 shadow-xl space-y-1.5">
          <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-mono">Số Dư Rút Khả Dụng</span>
          <div className="text-2xl font-extrabold font-mono text-emerald-400 tabular-nums">
            {maxWithdrawable.toLocaleString()} USDC
          </div>
          <span className="text-xs text-slate-400 font-mono block">
            Rút tức thì + nhận 80% lãi Aave
          </span>
        </div>
      </div>

      {/* STAKE & UNSTAKE FORMS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stake Form */}
        <div className="rounded-2xl p-6 bg-[#0D1424]/90 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Nạp Bổ Sung Cọc Bảo Chứng
              </h2>
              <span className="text-xs text-slate-400">
                Tự động cấp hạn mức 120% và mint aUSDC sinh lãi
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
                className="w-full bg-[#060A14] border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                required
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {[500, 1000, 2500].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setStakeInput(String(v))}
                    className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-750 text-[11px] font-mono text-slate-300 border border-slate-700 transition-colors"
                  >
                    +{v}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#060A14] border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Hạn mức nhận kèo tăng thêm (120%):</span>
                <strong className="text-emerald-400 font-mono">
                  +{(parseFloat(stakeInput || "0") * 1.2).toLocaleString()} USDC
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lợi tức thực dự kiến (80% share):</span>
                <strong className="text-white font-mono">
                  ~{(parseFloat(stakeInput || "0") * 0.052 * 0.8).toFixed(2)} USDC / năm
                </strong>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all active:scale-98"
            >
              Nạp Cọc Vào Aave V3 Lending Pool
            </button>
          </form>
        </div>

        {/* Unstake Form */}
        <div className="rounded-2xl p-6 bg-[#0D1424]/90 border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Rút Vốn Gốc &amp; Tất Toán Lãi Thực
              </h2>
              <span className="text-xs text-slate-400">
                Rút phần vốn rảnh rỗi kèm 80% lãi Aave V3 về ví
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
                className="w-full bg-[#060A14] border border-slate-700 rounded-xl px-4 py-3 text-sm font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setUnstakeInput(String(maxWithdrawable))}
                className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold hover:bg-blue-500/30 transition-colors"
              >
                MAX ({maxWithdrawable})
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#060A14] border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Đang khóa bảo chứng hợp đồng mở:</span>
                <strong className="text-amber-400 font-mono">
                  {brokerNam.activeAllocated.toLocaleString()} USDC
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lãi thực nhận kèm (80% Aave):</span>
                <strong className="text-emerald-400 font-mono">
                  +{(parseFloat(unstakeInput || "0") * 0.008).toFixed(2)} USDC
                </strong>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-all active:scale-98"
            >
              Rút Vốn Gốc &amp; Nhận Lãi Về Ví
            </button>
          </form>
        </div>
      </div>

      {/* BOTTOM: SBT PASSPORT + LEDGER */}
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

        <div className="lg:col-span-7 rounded-2xl bg-[#0D1424]/90 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <span>Sổ Cái Lịch Sử Dòng Tiền Aave V3</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">Fuji C-Chain</span>
          </div>

          <div className="space-y-2.5">
            {stakingHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-[#060A14] border border-slate-800/80 flex items-center justify-between text-xs"
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
                  <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
                    Tx: {item.txHash} • {item.timestamp}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300 font-semibold">
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