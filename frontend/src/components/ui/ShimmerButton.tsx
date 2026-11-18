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
        return "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30";
      case "success":
        return "bg-emerald-600 hover:bg-emerald-500 text-white font-semibold border border-emerald-500/30 shadow-sm";
      case "secondary":
        return "bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700";
      case "primary":
      default:
        return "bg-blue-600 hover:bg-blue-500 text-white border border-blue-500/30 shadow-sm";
    }
  };

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg text-sm font-medium whitespace-nowrap transition-colors duration-150 active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none ${getVariantStyles()} ${className}`}
      {...props}
    >
      <span className="inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
