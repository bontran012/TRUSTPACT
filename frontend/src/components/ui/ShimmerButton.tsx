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
        return "bg-[#DC2626] hover:bg-[#B91C1C] text-white border-transparent";
      case "success":
        return "bg-[#059669] hover:bg-[#047857] text-white border-transparent";
      case "secondary":
        return "bg-[#161922] hover:bg-[#1E222D] text-[#F1F5F9] border-[#1E222D]";
      case "primary":
      default:
        return "bg-[#E84142] hover:bg-[#D13637] text-white border-transparent";
    }
  };

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-md font-semibold text-xs transition-colors duration-150 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed ${getVariantStyles()} ${className}`}
      {...props}
    >
      <span className="flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
}
