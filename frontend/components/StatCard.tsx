"use client";

import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  variant?: "default" | "emerald" | "blue" | "amber";
  className?: string;
}

export function StatCard({
  label,
  value,
  subValue,
  badge,
  icon,
  variant = "default",
  className = "",
}: StatCardProps) {
  const borderVariants = {
    default: "border-slate-800/80 hover:border-slate-700/80",
    emerald: "border-emerald-500/30 hover:border-emerald-500/50 shadow-emerald-950/20",
    blue: "border-blue-500/30 hover:border-blue-500/50 shadow-blue-950/20",
    amber: "border-amber-500/30 hover:border-amber-500/50 shadow-amber-950/20",
  };

  const glowVariants = {
    default: "from-slate-500/5",
    emerald: "from-emerald-500/10",
    blue: "from-blue-500/10",
    amber: "from-amber-500/10",
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-[#0f131c]/90 backdrop-blur-md p-5 border shadow-md transition-all ${borderVariants[variant]} ${className}`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${glowVariants[variant]} to-transparent pointer-events-none rounded-bl-full`} />

      <div className="flex items-center justify-between pb-2">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>

      <div className="flex items-baseline space-x-2">
        <div className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight">
          {value}
        </div>
        {badge}
      </div>

      {subValue && (
        <div className="text-xs text-slate-500 font-mono mt-1 pt-1 border-t border-slate-800/60">
          {subValue}
        </div>
      )}
    </div>
  );
}
