"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowUpRight, ArrowDownLeft, CheckCircle2, 
  Coins, TrendingUp, ArrowRight, Sparkles, ShieldCheck,
  Zap, Lock, AlertTriangle, Award, Layers
} from "lucide-react";
import { AaveIcon, UsdcIcon, AvalancheIcon } from "../../components/CryptoIcons";
import { useStore } from "../../lib/store";
import { Identicon } from "../../components/Identicon";
import { AddressCopy } from "../../components/AddressCopy";
import { LiveYieldCounter } from "../../components/LiveYieldCounter";

export default function BrokerStakingPage() {
  const { brokers, stakeInsurance, unstakeInsurance } = useStore();
  const brokerNam = brokers.find((b) => b.id === "broker-nam") || brokers[0];

  const [stakeInput, setStakeInput] = useState("");
  const [unstakeInput, setUnstakeInput] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const handleStake = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(stakeInput);
    if (!amount || amount <= 0) return;

    stakeInsurance(brokerNam.id, amount);
    setStakeInput("");
    setNotice(`Đã nạp bổ sung thành công ${amount.toLocaleString()} USDC vào Lending Pool Aave V3. Hạn mức tiếp nhận hợp đồng tối đa được nâng lên ${((brokerNam.stakedAmount + amount) * 1.2).toLocaleString()} USDC!`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleUnstake = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(unstakeInput);
    if (!amount || amount <= 0) return;

    const success = unstakeInsurance(brokerNam.id, amount);
    if (!success) {
      alert("Yêu cầu không khả dụng! Số tiền yêu cầu rút vượt quá số dư khả dụng hoặc đang nằm trong nghĩa vụ bảo chứng hợp đồng chưa quyết toán.");
      return;
    }

    setUnstakeInput("");
    setNotice(`Đã thực hiện rút thành công ${amount.toLocaleString()} USDC vốn gốc cùng lợi tức tích lũy từ Aave V3 về ví an toàn.`);
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 space-y-8">
      
      {/* =========================================================================
          TOP HERO BANNER: AAVE V3 YIELD VAULT (Pure CSS + Vector Glow, No JPG)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/30 via-[#0d121c] to-[#090b10] border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        
        {/* Glow backdrop */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Left Headline */}
        <div className="lg:col-span-7 space-y-3 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <AaveIcon className="w-3.5 h-3.5" />
            <span>Tích Hợp Aave V3 Lending Pool (Fuji C-Chain)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Quản Lý Cọc Bảo Chứng & Tối Ưu Lợi Tức Aave V3
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl font-normal">
            Nguồn vốn ký quỹ bảo chứng của Bên Trung Gian được tự động điều phối vào Lending Pool Aave V3.
            Trung Gian thụ hưởng <strong className="text-emerald-400 font-semibold">80% lợi tức thực tế (Real Yield)</strong>, 20% duy trì giao thức.
          </p>
          <div className="flex items-center space-x-4 pt-1 text-xs">
            <span className="flex items-center space-x-1.5 text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Bảo chứng 120% Slashing Quota</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center space-x-1.5 text-emerald-400 font-mono font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>5.20% Supply APY</span>
            </span>
          </div>
        </div>

        {/* Right Dynamic Live Yield Counter Component */}
        <div className="lg:col-span-5 relative z-10">
          <LiveYieldCounter
            principalAmount={brokerNam.stakedAmount}
            apy={5.2}
            baseYield={18.642}
          />
        </div>
      </div>

      {/* =========================================================================
          SOULBOUND CERTIFICATE & BROKER PROFILE BANNER (Web3 Identicon)
          ========================================================================= */}
      <div className="rounded-2xl bg-[#080B11]/90 border border-white/[0.08] p-5 sm:p-6 shadow-md relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <Identicon address={brokerNam.address} size={56} rankBadge={brokerNam.badge} />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-white">{brokerNam.name}</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono font-medium flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{brokerNam.badge}</span>
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span>Soulbound Token #889A (ERC-721 Bất biến) •</span>
                <AddressCopy address={brokerNam.address} truncateLength={5} />
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-400 pt-0.5">
                <span>Số kèo hoàn tất: <strong className="text-white font-mono">{brokerNam.completedDeals}</strong></span>
                <span>•</span>
                <span>Tỷ lệ hoàn thành: <strong className="text-emerald-400 font-mono">100%</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 bg-[#05070B] px-4 py-2.5 rounded-xl border border-white/[0.06] shrink-0">
            <div className="text-right">
              <span className="text-xs text-slate-400 block font-normal">Cơ Chế Phân Bổ Lợi Tức</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-emerald-400">80% Trung Gian • 20% Sàn</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center space-x-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* =========================================================================
          3 OVERVIEW METRICS CARDS
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Staked Principal */}
        <div className="rounded-2xl p-5 space-y-1 bg-[#080B11]/90 border border-white/[0.08] shadow-md">
          <span className="text-xs text-slate-400 block font-normal">Vốn Bảo Chứng Đang Ký Quỹ</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
            {brokerNam.stakedAmount.toLocaleString()} USDC
          </div>
          <span className="text-xs text-slate-500 block font-mono">
            ~{(brokerNam.stakedAmount * 25400).toLocaleString()} VNĐ quy đổi
          </span>
        </div>

        {/* Real-time Yield */}
        <div className="rounded-2xl p-5 space-y-1 bg-[#080B11]/90 border border-emerald-500/30 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 block font-medium">Lợi Tức Thực Tích Lũy (80%)</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 tracking-tight">
            +18.6420 USDC
          </div>
          <span className="text-xs text-slate-400 block font-normal">
            Tăng trưởng liên tục theo từng block qua aUSDC
          </span>
        </div>

        {/* 120% Quota */}
        <div className="rounded-2xl p-5 space-y-1 bg-[#080B11]/90 border border-white/[0.08] shadow-md">
          <span className="text-xs text-slate-400 block font-normal">Hạn Mức Hợp Đồng Tối Đa (≤120%)</span>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-100 tracking-tight">
            {brokerNam.maxLimit.toLocaleString()} USDC
          </div>
          <span className="text-xs text-emerald-400 block font-medium">
            Tự động điều chỉnh theo quy mô cọc bảo chứng
          </span>
        </div>
      </div>

      {/* =========================================================================
          2 ACTION PANELS: STAKE & UNSTAKE
          ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Nạp cọc */}
        <div className="rounded-2xl p-6 sm:p-7 space-y-5 bg-[#080B11]/90 border border-white/[0.08] shadow-md">
          <div className="flex items-center space-x-3 pb-4 border-b border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Bổ Sung Tài Sản Đảm Bảo
              </h2>
              <span className="text-xs text-slate-400">Mở rộng hạn mức tiếp nhận hợp đồng ký quỹ</span>
            </div>
          </div>

          <form onSubmit={handleStake} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">
                Số lượng USDC muốn ký quỹ:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={stakeInput}
                  onChange={(e) => setStakeInput(e.target.value)}
                  placeholder="Ví dụ: 1000"
                  className="w-full bg-[#05070B] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm font-bold font-mono text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  USDC
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-[#05070B] rounded-xl p-3.5 space-y-1.5 border border-white/[0.06]">
              <div className="flex justify-between">
                <span>Hạn mức giao dịch mở rộng thêm:</span>
                <strong className="text-emerald-400 font-mono">
                  +{(parseFloat(stakeInput || "0") * 1.2).toLocaleString()} USDC
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Ước tính lợi tức thụ hưởng hàng năm (80%):</span>
                <strong className="text-white font-mono">
                  ~{(parseFloat(stakeInput || "0") * 0.052 * 0.8).toFixed(2)} USDC/năm
                </strong>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs uppercase tracking-wider transition-colors shadow-sm"
            >
              Chuyển Vốn Vào Pool Aave V3 (Fuji C-Chain)
            </button>
          </form>
        </div>

        {/* Rút cọc */}
        <div className="rounded-2xl p-6 sm:p-7 space-y-5 bg-[#080B11]/90 border border-white/[0.08] shadow-md">
          <div className="flex items-center space-x-3 pb-4 border-b border-white/[0.06]">
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] text-slate-300 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Rút Vốn Đảm Bảo & Lợi Tức
              </h2>
              <span className="text-xs text-slate-400">Chỉ khả dụng đối với phần vốn khả dụng rảnh rỗi</span>
            </div>
          </div>

          <form onSubmit={handleUnstake} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2">
                Số lượng USDC muốn rút:
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={unstakeInput}
                  onChange={(e) => setUnstakeInput(e.target.value)}
                  placeholder="Ví dụ: 500"
                  className="w-full bg-[#05070B] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm font-bold font-mono text-white focus:outline-none focus:border-slate-500 transition-colors"
                  required
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  USDC
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-[#05070B] rounded-xl p-3.5 space-y-1.5 border border-white/[0.06]">
              <div className="flex justify-between">
                <span>Tổng vốn cọc hiện tại:</span>
                <strong className="text-white font-mono">{brokerNam.stakedAmount.toLocaleString()} USDC</strong>
              </div>
              <div className="flex justify-between">
                <span>Đang thực hiện nghĩa vụ bảo chứng:</span>
                <strong className="text-amber-400 font-mono">100 USDC (Hợp đồng #101)</strong>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-white font-medium text-xs uppercase tracking-wider transition-colors"
            >
              Rút Vốn & Tất Toán Lợi Tức Về Ví
            </button>
          </form>
        </div>
      </div>

      {/* Direct link back to Broker Directory */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#080B11]/90 flex flex-col sm:flex-row items-center justify-between gap-3 border border-white/[0.08] shadow-md">
        <div className="text-xs text-slate-300">
          Theo dõi vị trí xếp hạng tín nhiệm và hồ sơ chứng chỉ Soulbound Token trên thư viện:
        </div>
        <Link
          href="/"
          className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center space-x-1 transition-colors"
        >
          <span>Xem Thư Viện Thương Nhân Bảo Chứng</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
