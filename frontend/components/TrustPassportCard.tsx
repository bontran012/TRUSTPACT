import React from "react";

import { ShieldCheck, Lock, Star, Award, CheckCircle2 } from "lucide-react";

import { AddressCopy } from "./AddressCopy";

import { Identicon } from "./Identicon";



interface TrustPassportCardProps {

  name: string;

  address: string;

  tokenId?: string;

  tierTitle?: string;

  score?: number;

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

      className={`group relative overflow-hidden rounded-2xl bg-[#0B0F19] border border-amber-500/25 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(251,191,36,0.2)] transition-all duration-300 hover:border-amber-500/40 ${className}`}

    >

      {/* Holographic Ambient Glows */}

      <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />



      {/* Top Header */}

      <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.07] relative z-10">

        <div className="flex items-center space-x-2.5">

          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/30 text-amber-300 flex items-center justify-center shadow-inner">

            <Award className="w-4 h-4" />

          </div>

          <div>

            <div className="flex items-center space-x-1.5">

              <span className="text-xs font-extrabold text-white tracking-wider uppercase">

                TrustPassport

              </span>

              <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-500/30 text-[9px] font-mono font-bold text-amber-300">

                SBT

              </span>

            </div>

            <span className="text-[10px] text-slate-400 font-mono block mt-0.5">

              ID #{tokenId} • ERC-721 Non-Transferable

            </span>

          </div>

        </div>



        <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-200 text-[10px] font-medium">

          <Lock className="w-3 h-3 text-amber-400" />

          <span>Soulbound</span>

        </div>

      </div>



      {/* Profile Section */}

      <div className="py-4 flex items-center space-x-3.5 relative z-10">

        <Identicon address={address} size={52} rankBadge={tierTitle} />



        <div className="space-y-1.5 flex-1 min-w-0">

          <div className="flex items-center justify-between gap-2">

            <div className="flex items-center space-x-1.5 truncate">

              <h4 className="text-sm font-bold text-white truncate">{name}</h4>

              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />

            </div>

            <div className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs font-mono font-bold shrink-0">

              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />

              <span>{score}/100</span>

            </div>

          </div>



          <div className="flex items-center justify-between gap-2 flex-wrap">

            <span className="text-[11px] font-medium text-amber-400/90">

              {tierTitle}

            </span>

            <AddressCopy address={address} truncateLength={4} showExplorerLink={true} />

          </div>

        </div>

      </div>



      {/* On-chain Metrics Grid */}

      <div className="grid grid-cols-3 gap-2.5 text-center relative z-10">

        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">

          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">

            Số Kèo

          </span>

          <span className="text-sm font-mono font-bold text-white tabular-nums mt-0.5 block">

            {dealsCount}

          </span>

        </div>



        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">

          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">

            Uy Tín

          </span>

          <span className="text-sm font-mono font-bold text-emerald-400 tabular-nums mt-0.5 block">

            {successRate}%

          </span>

        </div>



        <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">

          <span className="text-[10px] text-slate-400 block uppercase tracking-wider">

            Cọc Stake

          </span>

          <span className="text-sm font-mono font-bold text-amber-300 tabular-nums mt-0.5 block">

            ${stakedAmount.toLocaleString()}

          </span>

        </div>

      </div>



      {/* Footer Security Note */}

      <div className="mt-3.5 pt-2.5 border-t border-white/[0.05] text-[10px] text-slate-400 flex items-center justify-between relative z-10">

        <div className="flex items-center space-x-1.5">

          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />

          <span>Bảo chứng bởi StakedBrokerRegistry</span>

        </div>

        <span className="font-mono text-[9px] text-slate-500 uppercase">Slashing Active</span>

      </div>

    </div>

  );

}
