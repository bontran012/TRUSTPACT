"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  Play,
  Pause,
  Zap,
  CheckCircle2,
  Radar,
} from "lucide-react";
import { AvalancheIcon, AaveIcon } from "./CryptoIcons";
import { Identicon } from "./Identicon";
export function EscrowSimulationHero() {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(2);
  const [autoPlay, setAutoPlay] = useState(true);
  const [liveYield, setLiveYield] = useState(0.042819);
  useEffect(() => {
    const yieldTimer = setInterval(() => {
      setLiveYield((prev) => +(prev + 0.000014).toFixed(6));
    }, 800);
    return () => clearInterval(yieldTimer);
  }, []);
  useEffect(() => {
    if (!autoPlay) return;
    const stepTimer = setInterval(() => {
      setActiveStep((prev) => (prev === 3 ? 1 : ((prev + 1) as 1 | 2 | 3)));
    }, 4200);
    return () => clearInterval(stepTimer);
  }, [autoPlay]);
  return (
    <div className="relative rounded-3xl glass-panel p-6 sm:p-8 lg:p-10 overflow-hidden">
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-xs font-medium text-blue-300">
            <AvalancheIcon className="w-4 h-4" />
            <span>Avalanche Custom L1 + Fuji C-Chain</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-mono font-bold">0.8s Finality</span>
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-white tracking-tight leading-[1.15]">
              Két Sắt Ký Quỹ Ba Bên &{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-300 to-teal-400">
                Bảo Chứng Sinh Lời Aave V3
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed font-normal">
              Chấm dứt triệt để nạn lừa đảo P2P, Fake Bill ngân hàng và trung gian mạo danh. Nguồn vốn ký quỹ và tiền cọc bảo chứng của GDTG tự động sinh lãi thực trong{" "}
              <strong className="text-white font-semibold">Aave V3 Lending Pool</strong>, kèm cơ chế{" "}
              <strong className="text-emerald-400 font-semibold">Chém Cọc Đền Bù 100% (Slashing)</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/create"
              className="inline-flex items-center space-x-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-[0_10px_30px_rgba(37,99,235,0.4)] transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Khởi Tạo Hợp Đồng Ký Quỹ</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/room/101"
              className="inline-flex items-center space-x-2 px-5 py-3.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.12] text-white font-semibold text-xs sm:text-sm transition-all"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Phòng Giao Dịch #101</span>
            </Link>
            <Link
              href="/radar"
              className="inline-flex items-center space-x-1.5 px-4 py-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs sm:text-sm transition-all"
            >
              <Radar className="w-4 h-4 text-rose-400" />
              <span>Quét Scam 0đ Gas</span>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/[0.08]">
            <div>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-white tabular-nums">
                $1.24M+
              </div>
              <span className="text-[11px] text-slate-400 block">Tổng Giá Trị Bảo Chứng</span>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-emerald-400 tabular-nums">
                120% Quota
              </div>
              <span className="text-[11px] text-slate-400 block">Bảo Hiểm Cọc Aave V3</span>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-extrabold font-mono text-amber-400 tabular-nums">
                0.8 Giây
              </div>
              <span className="text-[11px] text-slate-400 block">Giải Ngân Tức Thì</span>
            </div>
          </div>
        </div>
        <div className="lg:col-span-6">
          <div className="rounded-2xl bg-[#050811]/95 border border-white/[0.1] p-5 sm:p-6 shadow-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-white/[0.07]">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Luồng Ký Quỹ Ba Bên (UniversalEscrow.sol)
                </span>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setAutoPlay(!autoPlay)}
                  className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300"
                >
                  {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                {([1, 2, 3] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      setAutoPlay(false);
                      setActiveStep(st);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                      activeStep === st
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white/[0.03] text-slate-400 hover:text-white"
                    }`}
                  >
                    B{st}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAutoPlay(false);
                  setActiveStep(1);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  activeStep === 1
                    ? "bg-blue-600/15 border-blue-500/50 text-white"
                    : "bg-white/[0.02] border-white/[0.06] text-slate-400"
                }`}
              >
                <span className="text-[10px] font-mono text-blue-400 block">BƯỚC 01</span>
                <span className="text-xs font-bold block mt-0.5">Khóa Quỹ USDC</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAutoPlay(false);
                  setActiveStep(2);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  activeStep === 2
                    ? "bg-purple-600/15 border-purple-500/50 text-white"
                    : "bg-white/[0.02] border-white/[0.06] text-slate-400"
                }`}
              >
                <span className="text-[10px] font-mono text-purple-400 block">BƯỚC 02</span>
                <span className="text-xs font-bold block mt-0.5">Sinh Lãi & Giám Định</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAutoPlay(false);
                  setActiveStep(3);
                }}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  activeStep === 3
                    ? "bg-emerald-600/15 border-emerald-500/50 text-white"
                    : "bg-white/[0.02] border-white/[0.06] text-slate-400"
                }`}
              >
                <span className="text-[10px] font-mono text-emerald-400 block">BƯỚC 03</span>
                <span className="text-xs font-bold block mt-0.5">Giải Ngân 0.8s</span>
              </button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    activeStep === 1
                      ? "bg-blue-950/30 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                      : "bg-white/[0.02] border-white/[0.07]"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Identicon address="0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001" size={34} />
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase text-blue-400 block">
                        Bên Mua (Buyer)
                      </span>
                      <span className="text-xs font-bold text-white truncate block">
                        Minh • 0x1A2b...0001
                      </span>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-slate-400">Ký quỹ:</span>
                    <span className="font-mono font-bold text-white">1,000 USDC</span>
                  </div>
                </div>
                <div
                  className={`p-3.5 rounded-xl border transition-all ${
                    activeStep === 3
                      ? "bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                      : "bg-white/[0.02] border-white/[0.07]"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Identicon address="0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002" size={34} />
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase text-emerald-400 block">
                        Bên Bán (Seller)
                      </span>
                      <span className="text-xs font-bold text-white truncate block">
                        Hùng • 0x89C3...0002
                      </span>
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                    <span className="text-slate-400">Thực nhận:</span>
                    <span className="font-mono font-bold text-emerald-400">982.00 USDC</span>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 via-[#0c1326] to-emerald-950/40 border border-white/[0.12]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                      <AaveIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">
                          Két Sắt UniversalEscrow + Aave V3
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          +5.20% APY
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Bảo chứng bởi GDTG Nguyễn Nam (Cọc 5,000 aUSDC)
                      </span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right bg-[#04060B]/80 px-3.5 py-2 rounded-xl border border-white/[0.08]">
                    <span className="text-[10px] font-mono text-slate-400 block">
                      Lãi thực tích lũy (Real-time)
                    </span>
                    <span className="text-sm font-mono font-extrabold text-emerald-400 tabular-nums">
                      +{liveYield.toFixed(6)} USDC
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex items-center justify-between text-xs">
                  <span className="text-slate-200 font-medium flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      {activeStep === 1 && "Đang phong tỏa 1,000 USDC và khoá hạn mức cọc 120% của GDTG..."}
                      {activeStep === 2 && "Vốn đang sinh lãi aUSDC theo từng block trong khi GDTG đối soát chứng từ IPFS."}
                      {activeStep === 3 && "Snowman 0.8s giải ngân tức thì: 982 USDC cho Seller, 15 USDC phí GDTG, 3 USDC Sàn."}
                    </span>
                  </span>
                </div>
              </div>
            </div>
            <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Economic Slashing: Tự động trích cọc Aave bồi hoàn 100% nếu GDTG gian lận</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
