"use client";

import React from "react";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
}

export function BorderBeam({
  className = "",
  size = 180,
  duration = 6,
  colorFrom = "#E84142",
  colorTo = "#F59E0B",
}: BorderBeamProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute -inset-[1px] rounded-[inherit] overflow-hidden z-10 ${className}`}
    >
      <div
        style={{
          animationDuration: `${duration}s`,
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 280deg, ${colorFrom} 320deg, ${colorTo} 360deg)`,
        }}
        className="absolute -inset-[100%] animate-spin"
      />
      <div className="absolute inset-[1px] rounded-[inherit] bg-[#101217]/95" />
    </div>
  );
}
