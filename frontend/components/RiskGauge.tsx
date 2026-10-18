import React from "react";

import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";



interface RiskGaugeProps {

  score: number;

  label?: string;

  isScam?: boolean;

  className?: string;

}



export function RiskGauge({ score, label, isScam = false, className = "" }: RiskGaugeProps) {

  const clampedScore = Math.max(0, Math.min(100, score));

  const strokeDashoffset = 188.5 - (188.5 * clampedScore) / 100;



  const getStatus = () => {

    if (isScam || clampedScore < 30) {

      return {

        text: "RỦI RO CỰC CAO • SCAM DETECTED",

        color: "text-rose-400",

        stroke: "#f43f5e",

        glow: "rgba(244,63,94,0.35)",

        bg: "bg-rose-500/10 border-rose-500/30",

        icon: ShieldAlert,

      };

    }

    if (clampedScore < 70) {

      return {

        text: "CẢNH BÁO • LỊCH SỬ TÍN NHIỆM THẤP",

        color: "text-amber-400",

        stroke: "#f59e0b",

        glow: "rgba(245,158,11,0.3)",

        bg: "bg-amber-500/10 border-amber-500/30",

        icon: AlertTriangle,

      };

    }

    return {

      text: "AN TOÀN • ĐÃ XÁC THỰC ON-CHAIN",

      color: "text-emerald-400",

      stroke: "#10b981",

      glow: "rgba(16,185,129,0.35)",

      bg: "bg-emerald-500/10 border-emerald-500/30",

      icon: ShieldCheck,

    };

  };



  const status = getStatus();

  const StatusIcon = status.icon;



  return (

    <div

      className={`relative overflow-hidden flex flex-col items-center justify-center p-6 rounded-2xl bg-[#0A0E17] border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_0_rgba(255,255,255,0.08)] ${className}`}

    >

      <div className="relative w-48 h-28 flex items-center justify-center">

        <svg viewBox="0 0 160 95" className="w-full h-full overflow-visible">

          {/* Outer Tick Marks */}

          <path

            d="M 14 80 A 66 66 0 0 1 146 80"

            fill="none"

            stroke="rgba(255,255,255,0.08)"

            strokeWidth="2"

            strokeDasharray="2 8"

          />

          {/* Track */}

          <path

            d="M 20 80 A 60 60 0 0 1 140 80"

            fill="none"

            stroke="rgba(255,255,255,0.06)"

            strokeWidth="10"

            strokeLinecap="round"

          />

          {/* Active Progress Arc */}

          <path

            d="M 20 80 A 60 60 0 0 1 140 80"

            fill="none"

            stroke={status.stroke}

            strokeWidth="10"

            strokeLinecap="round"

            strokeDasharray="188.5"

            strokeDashoffset={strokeDashoffset}

            style={{ filter: `drop-shadow(0 0 8px ${status.glow})` }}

            className="transition-all duration-700 ease-out"

          />

        </svg>



        <div className="absolute bottom-0 inset-x-0 text-center">

          <div className="text-3xl font-extrabold font-mono tabular-nums text-white tracking-tight">

            {clampedScore}

            <span className="text-xs font-normal text-slate-500">/100</span>

          </div>

          <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block mt-0.5">

            Trust Score

          </span>

        </div>

      </div>



      <div

        className={`mt-4 px-3.5 py-1.5 rounded-full border flex items-center space-x-1.5 ${status.bg}`}

      >

        <StatusIcon className={`w-3.5 h-3.5 shrink-0 ${status.color}`} />

        <span className={`text-[11px] font-mono font-bold tracking-wide ${status.color}`}>

          {label || status.text}

        </span>

      </div>

    </div>

  );

}
