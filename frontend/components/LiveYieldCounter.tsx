import React, { useState, useEffect } from "react";

import { Sparkles, Activity } from "lucide-react";

import { AaveIcon } from "./CryptoIcons";



interface LiveYieldCounterProps {

  principalAmount?: number;

  apy?: number;

  baseYield?: number;

  className?: string;

}



export function LiveYieldCounter({

  principalAmount = 100,

  apy = 5.2,

  baseYield = 0.0428,

  className = "",

}: LiveYieldCounterProps) {

  const [earned, setEarned] = useState(baseYield);

  const [pulse, setPulse] = useState(false);



  useEffect(() => {

    const increment = ((principalAmount * (apy / 100)) / (365 * 24 * 3600)) * 0.8;

    const timer = setInterval(() => {

      setEarned((prev) => +(prev + increment).toFixed(6));

      setPulse(true);

      setTimeout(() => setPulse(false), 300);

    }, 800);

    return () => clearInterval(timer);

  }, [principalAmount, apy]);



  const formatted = earned.toFixed(6);

  const mainDigits = formatted.slice(0, -2);

  const microDigits = formatted.slice(-2);



  return (

    <div

      className={`relative overflow-hidden rounded-2xl bg-[#0A0E17] border border-white/[0.08] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.08)] ${className}`}

    >

      {/* Ambient Aave & Emerald Glow */}

      <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />



      {/* Top Header */}

      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06] relative z-10">

        <div className="flex items-center space-x-2">

          <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">

            <AaveIcon className="w-3.5 h-3.5 text-purple-400" />

          </div>

          <div>

            <span className="text-xs font-semibold text-white tracking-tight block">

              Aave V3 Yield Engine

            </span>

            <span className="text-[10px] text-slate-500 font-mono">

              Pool: aAvaUSDC • Block 0.8s

            </span>

          </div>

        </div>



        <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-mono font-semibold">

          <span className="relative flex h-1.5 w-1.5">

            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />

            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />

          </span>

          <span>{apy}% APY</span>

        </div>

      </div>



      {/* Live Counter Display */}

      <div className="py-3.5 relative z-10">

        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">

          <span>Lợi tức cộng dồn thời gian thực</span>

          <span className="font-mono text-[10px] text-slate-500">

            Gốc: {principalAmount.toLocaleString()} USDC

          </span>

        </div>



        <div className="flex items-baseline justify-between bg-white/[0.02] border border-white/[0.06] rounded-xl px-3.5 py-2.5">

          <div className="flex items-baseline space-x-1.5 font-mono tabular-nums tracking-tight">

            <span className="text-emerald-400 font-bold text-lg">+</span>

            <span className="text-2xl sm:text-3xl font-extrabold text-white">

              {mainDigits}

            </span>

            <span

              className={`text-xl sm:text-2xl font-bold transition-colors duration-200 ${

                pulse ? "text-emerald-300" : "text-emerald-500/70"

              }`}

            >

              {microDigits}

            </span>

          </div>

          <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">

            <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />

            <span className="text-xs font-mono font-bold text-slate-200">USDC</span>

          </div>

        </div>

      </div>



      {/* Footer Info */}

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 relative z-10">

        <div className="flex items-center space-x-1.5">

          <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />

          <span>Tự động mint aUSDC trên Fuji C-Chain</span>

        </div>

        <span className="font-mono text-emerald-400/90 uppercase">Auto-Compounding</span>

      </div>

    </div>

  );

}
