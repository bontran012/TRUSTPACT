"use client";

import React from "react";

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  shimmerColor?: string;
  variant?: "primary" | "secondary" | "danger" | "success";
}

export function ShimmerButton({
  children,
  className = "",
  variant = "primary",
  disabled,
  ...props
}: ShimmerButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return "bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-400/40 backdrop-blur-md shadow-sm";
      case "success":
        return "bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:brightness-110 text-slate-950 font-bold shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset,0_10px_28px_-4px_rgba(16,185,129,0.45)] border border-emerald-200/50";
      case "secondary":
        return "bg-white/[0.10] hover:bg-white/[0.16] text-white border border-white/[0.22] backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.18)_inset]";
      case "primary":
      default:
        return "bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-600 hover:brightness-110 text-white font-semibold shadow-[0_1px_0_0_rgba(255,255,255,0.35)_inset,0_12px_30px_-4px_rgba(79,70,229,0.55)] border border-sky-300/35";
    }
  };

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-full text-sm whitespace-nowrap transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none ${getVariantStyles()} ${className}`}
      {...props}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
