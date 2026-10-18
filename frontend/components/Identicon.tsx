"use client";

import React, { useMemo } from "react";

interface IdenticonProps {
  address: string;
  size?: number;
  className?: string;
  rankBadge?: string;
}

// Simple deterministic hash function for colors and patterns
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const PALETTES = [
  ["#3b82f6", "#1d4ed8", "#93c5fd", "#60a5fa"], // Blue
  ["#10b981", "#047857", "#6ee7b7", "#34d399"], // Emerald
  ["#8b5cf6", "#6d28d9", "#c4b5fd", "#a78bfa"], // Violet
  ["#f59e0b", "#b45309", "#fde68a", "#fbbf24"], // Amber
  ["#ec4899", "#be185d", "#fbcfe8", "#f472b6"], // Pink
  ["#06b6d4", "#0e7490", "#a5f3fc", "#22d3ee"], // Cyan
];

export function Identicon({ address, size = 40, className = "", rankBadge }: IdenticonProps) {
  const { colors, rot1, rot2, cx, cy } = useMemo(() => {
    const seed = hashString(address || "0x0000000000000000000000000000000000000000");
    const palette = PALETTES[seed % PALETTES.length];
    const rot1 = (seed % 360);
    const rot2 = ((seed * 7) % 360);
    const cx = 30 + ((seed % 40));
    const cy = 30 + (((seed >> 3) % 40));
    return { colors: palette, rot1, rot2, cx, cy };
  }, [address]);

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        className="rounded-xl overflow-hidden shadow-inner border border-white/15 bg-slate-900"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={`grad1-${address}`} x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform={`rotate(${rot1})`}>
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="100%" stopColor={colors[1]} />
          </linearGradient>
          <radialGradient id={`grad2-${address}`} cx={`${cx}%`} cy={`${cy}%`} r="60%">
            <stop offset="0%" stopColor={colors[2]} stopOpacity="0.9" />
            <stop offset="100%" stopColor={colors[3]} stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Base Gradient */}
        <rect width="100" height="100" fill={`url(#grad1-${address})`} />

        {/* Dynamic geometric overlay */}
        <circle cx={cx} cy={cy} r="42" fill={`url(#grad2-${address})`} />
        <rect
          x="20"
          y="20"
          width="60"
          height="60"
          rx="14"
          fill="none"
          stroke={colors[2]}
          strokeWidth="2.5"
          opacity="0.35"
          transform={`rotate(${rot2} 50 50)`}
        />
        <circle cx="50" cy="50" r="16" fill={colors[3]} opacity="0.6" />
        <circle cx="50" cy="50" r="6" fill="#ffffff" opacity="0.9" />
      </svg>

      {/* Optional Rank Badge Pip */}
      {rankBadge && (
        <span
          title={rankBadge}
          className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950 flex items-center justify-center shadow-sm"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </span>
      )}
    </div>
  );
}
