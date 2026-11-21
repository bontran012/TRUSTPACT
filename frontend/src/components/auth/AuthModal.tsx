"use client";

import React from "react";
import { LinkWalletModal } from "./LinkWalletModal";

/**
 * AuthModal is deprecated in favor of 100% pure Web3 wallet authentication.
 * It renders the Web3 LinkWalletModal seamlessly.
 */
export function AuthModal() {
  return <LinkWalletModal />;
}
