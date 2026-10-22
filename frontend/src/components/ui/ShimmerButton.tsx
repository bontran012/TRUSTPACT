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
  shimmerColor = "rgba(255, 255, 255, 0.25)",
  variant = "primary",
  disabled,
  ...props
}: ShimmerButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return "bg-[#EF4444] hover:bg-[#DC2626] text-white border-[#EF4444]/40 shadow-[0_0_20px_rgba(239,68,68,0.3)]";
      case "success":
        return "bg-[#10B981] hover:bg-[#059669] text-white border-[#10B981]/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]";
      case "secondary":
        return "bg-[#161922] hover:bg-[#1E222D] text-[#F1F5F9] border-[#1E222D]";
      case "primary":
      default:
        return "bg-[#E84142] hover:bg-[#D13637] text-white border-[#E84142]/40 shadow-[0_0_25px_rgba(232,65,66,0.35)]";
    }
  };

  return (
    <button
      disabled={disabled}
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-md border font-semibold text-xs transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed group ${getVariantStyles()} ${className}`}
      {...props}
    >
      {/* Shimmer sweep effect */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-full w-[200%] animate-[shimmer_3s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"
        style={{
          transform: "skewX(-20deg)",
        }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
