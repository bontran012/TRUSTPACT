"use client";

import React from "react";
import { Lock, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Zap } from "lucide-react";

export type StatusType = 
  | "LOCKED" 
  | "COMPLETED" 
  | "CANCELLED" 
  | "VERIFIED" 
  | "SCAM" 
  | "CLEAN" 
  | "SOULBOUND"
  | "AAVE_YIELD";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, label, className = "", size = "md" }: StatusBadgeProps) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  switch (status) {
    case "LOCKED":
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-medium ${sizeClasses} ${className}`}>
          <Lock className="w-3 h-3" />
          <span>{label || "Đang Phong Tỏa Quỹ"}</span>
        </span>
      );

    case "COMPLETED":
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium ${sizeClasses} ${className}`}>
          <CheckCircle2 className="w-3 h-3" />
          <span>{label || "Đã Quyết Toán (0.8s)"}</span>
        </span>
      );

    case "CANCELLED":
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400 font-medium ${sizeClasses} ${className}`}>
          <XCircle className="w-3 h-3" />
          <span>{label || "Đã Hoàn Quỹ"}</span>
        </span>
      );

    case "VERIFIED":
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium ${sizeClasses} ${className}`}>
          <ShieldCheck className="w-3 h-3" />
          <span>{label || "Xác Thực On-Chain"}</span>
        </span>
      );

    case "SCAM":
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-medium ${sizeClasses} ${className}`}>
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          <span>{label || "Cảnh Báo Lừa Đảo"}</span>
        </span>
      );

    case "CLEAN":
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-medium ${sizeClasses} ${className}`}>
          <ShieldCheck className="w-3 h-3" />
          <span>{label || "Hồ Sơ Sạch"}</span>
        </span>
      );

    case "SOULBOUND":
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-medium ${sizeClasses} ${className}`}>
          <Zap className="w-3 h-3 text-purple-400" />
          <span>{label || "Soulbound SBT"}</span>
        </span>
      );

    case "AAVE_YIELD":
      return (
        <span className={`inline-flex items-center space-x-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-medium ${sizeClasses} ${className}`}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <span>{label || "Aave 5.20% APY"}</span>
        </span>
      );

    default:
      return null;
  }
}
