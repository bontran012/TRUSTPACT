"use client";

import React from "react";
import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";

interface RiskGaugeProps {
  score: number; // 0 to 100 (100 = Safe, 0 = Malicious)
  label?: string;
  isScam?: boolean;
  className?: string;
}

export function RiskGauge({ score, label, isScam = false, className = "" }: RiskGaugeProps) {
  // Semi-circle arc calculations
  // radius = 60, center = (80, 80)
  // angle from -180 to 0 degrees
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = 188 - (188 * clampedScore) / 100;

  const getStatus = () => {
    if (isScam || clampedScore < 30) {
      return {
        text: "MỨC ĐỘ RỦI RO CỰC KỲ CAO (SCAM REPORTED)",
        color: "text-rose-400",
        stroke: "#f43f5e",
        bg: "bg-rose-500/10 border-rose-500/30",
        icon: ShieldAlert,
      };
    }
    if (clampedScore < 70) {
      return {
        text: "CẢNH BÁO: CHƯA ĐỦ LỊCH SỬ TÍN NHIỆM",
        color: "text-amber-400",
        stroke: "#f59e0b",
        bg: "bg-amber-500/10 border-amber-500/30",
        icon: AlertTriangle,
      };
    }
    return {
      text: "ĐỘ TIN CẬY CAO (SAFE & ON-CHAIN VERIFIED)",
      color: "text-emerald-400",
      stroke: "#10b981",
      bg: "bg-emerald-500/10 border-emerald-500/30",
      icon: ShieldCheck,
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <div className={`flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900/80 border border-slate-800 ${className}`}>
      <div className="relative w-44 h-24 flex items-center justify-center">
        <svg viewBox="0 0 160 90" className="w-full h-full overflow-visible">
          {/* Background Arc */}
          <path
            d="M 20 80 A 60 60 0 0 1 140 80"
            fill="none"
            stroke="#1e293b"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Active Colored Arc */}
          <path
            d="M 20 80 A 60 60 0 0 1 140 80"
            fill="none"
            stroke={status.stroke}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="188"
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Score Center Value */}
        <div className="absolute bottom-0 inset-x-0 text-center">
          <div className="text-3xl font-black font-mono text-white tracking-tight">
            {clampedScore}
            <span className="text-xs font-normal text-slate-500">/100</span>
          </div>
          <span className="text-[10px] text-slate-400 uppercase font-mono block">Chỉ Số Tín Nhiệm</span>
        </div>
      </div>

      <div className={`mt-4 px-3 py-1.5 rounded-full border flex items-center space-x-1.5 ${status.bg}`}>
        <StatusIcon className={`w-3.5 h-3.5 ${status.color}`} />
        <span className={`text-[11px] font-bold tracking-wide ${status.color}`}>
          {label || status.text}
        </span>
      </div>
    </div>
  );
}
