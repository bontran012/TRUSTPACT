"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, Sparkles } from "lucide-react";
import { AaveIcon } from "./CryptoIcons";

interface LiveYieldCounterProps {
  principalAmount?: number;
  apy?: number; // e.g. 5.20
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

  // Ticks every 800ms to simulate micro-interest on Aave V3 Fuji C-Chain
  useEffect(() => {
    const increment = (principalAmount * (apy / 100)) / (365 * 24 * 3600) * 0.8;
    const timer = setInterval(() => {
      setEarned((prev) => +(prev + increment).toFixed(6));
    }, 800);
    return () => clearInterval(timer);
  }, [principalAmount, apy]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-[#0f131c] border border-emerald-500/30 p-4 sm:p-5 shadow-lg shadow-emerald-950/20 ${className}`}
    >
      <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
        <div className="flex items-center space-x-2">
          <AaveIcon className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-emerald-300">
            Aave V3 Real-Yield Ticker
          </span>
        </div>
        <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-medium">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span>+{apy}% Supply APY</span>
        </div>
      </div>

      <div className="pt-3 space-y-1">
        <div className="text-[11px] text-slate-400">
          Lợi tức thực sinh ra trong thời gian ký quỹ:
        </div>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tracking-tight">
            +{earned.toFixed(6)}
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-300">USDC</span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center space-x-1.5 pt-1">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>Tự động tích lũy qua token aUSDC theo từng block Fuji C-Chain (0.8s)</span>
        </div>
      </div>
    </div>
  );
}
