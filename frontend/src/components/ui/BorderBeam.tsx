"use client";

import React from "react";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
}

// Clean minimalist mode: disabled colorful spinning border animations
export function BorderBeam(_props: BorderBeamProps) {
  return null;
}
