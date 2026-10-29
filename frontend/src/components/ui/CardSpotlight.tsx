"use client";

import React from "react";

interface CardSpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  spotlightColor?: string;
  className?: string;
  radius?: number;
  color?: string;
}

// Clean minimalist mode: renders children directly without mouse-follow spotlight glow
export function CardSpotlight({
  children,
  className = "",
  spotlightColor,
  radius,
  color,
  ...props
}: CardSpotlightProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
