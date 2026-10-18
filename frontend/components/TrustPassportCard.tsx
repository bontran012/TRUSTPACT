"use client";

import React from "react";
import { ShieldCheck, Lock, Star, Award, Sparkles, ExternalLink } from "lucide-react";
import { AddressCopy } from "./AddressCopy";
import { Identicon } from "./Identicon";

interface TrustPassportCardProps {
  name: string;
  address: string;
  tokenId?: string;
  tierTitle?: string;
  score?: number; // 0 - 100
  dealsCount?: number;
  successRate?: number;
  stakedAmount?: number;
  className?: string;
}

export function TrustPassportCard({
  name,
  address,
  tokenId = "889A",
  tierTitle = "Master Auditor (Cấp 4)",
  score = 99,
  dealsCount = 128,
  successRate = 100,
  stakedAmount = 5000,
  className = "",
}: TrustPassportCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/90 via-[#0e131d] to-[#090b10] border border-amber-500/30 p-5 shadow-xl ${className}`}
    >
      {/* Subtle Holographic Glow in top right */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Banner Row */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-800/80 relative z-10">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Award className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-white tracking-wide block uppercase">
              TrustPassport SBT
            </span>
            <span className="text-[10px] text-amber-400/90 font-mono">
              Token ID: #{tokenId} • ERC-721
            </span>
          </div>
        </div>

        <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-[10px] font-semibold">
          <Lock className="w-3 h-3 text-purple-400" />
          <span>Soulbound Verified</span>
        </div>
      </div>

      {/* Body: Profile & Identicon */}
      <div className="py-4 flex items-start space-x-3.5 relative z-10">
        <Identicon address={address} size={48} rankBadge={tierTitle} />
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-white truncate">{name}</h4>
            <div className="flex items-center space-x-1 text-amber-400 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{score}/100</span>
            </div>
          </div>
          <div className="text-[11px] text-amber-300/90 font-medium">
            {tierTitle}
          </div>
          <AddressCopy address={address} truncateLength={5} />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs relative z-10">
        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Số Kèo</span>
          <span className="font-mono font-bold text-white">{dealsCount}</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Tỷ Lệ Thành Công</span>
          <span className="font-mono font-bold text-emerald-400">{successRate}%</span>
        </div>
        <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Cọc Aave V3</span>
          <span className="font-mono font-bold text-emerald-400">{stakedAmount.toLocaleString()} $</span>
        </div>
      </div>

      {/* Footer non-transferable notice */}
      <div className="mt-3 pt-2 text-[10px] text-slate-500 text-center flex items-center justify-center space-x-1">
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
        <span>Chứng chỉ bất biến không thể chuyển nhượng • Slashing Protected</span>
      </div>
    </div>
  );
}
