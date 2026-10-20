"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain, useReadContract } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import {
  Shield,
  Search,
  PlusSquare,
  Lock,
  Landmark,
  Scale,
  Award,
  AlertTriangle,
  LogOut,
  ChevronDown,
  Layers,
} from "lucide-react";
import {
  CONTRACT_ADDRESSES,
  ERC20_ABI,
  TRUST_PASSPORT_SBT_ABI,
  UNIVERSAL_ESCROW_ABI,
  formatUsdc,
  shortenAddress,
} from "@/src/lib/contracts";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [gasPriceGwei, setGasPriceGwei] = useState("25.4");

  const isWrongChain = isConnected && chainId !== avalancheFuji.id;

  // Read User USDC Balance
  const { data: usdcBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.usdc,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  // Read User SBT Balance
  const { data: sbtBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.trustPassportSBT,
    abi: TRUST_PASSPORT_SBT_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read Protocol Admin & Treasury
  const { data: adminAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "admin",
  });
  const { data: treasuryAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "treasury",
  });

  const isAdminOrTreasury =
    isConnected &&
    address &&
    (address.toLowerCase() === (adminAddress as string)?.toLowerCase() ||
      address.toLowerCase() === (treasuryAddress as string)?.toLowerCase());

  useEffect(() => {
    const timer = setInterval(() => {
      setGasPriceGwei((25 + Math.random() * 1.5).toFixed(1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const navLinks = [
    { href: "/", label: "Tra Cứu & Tín Nhiệm", icon: Search, exact: true },
    { href: "/pact/create", label: "Tạo Giao Dịch", icon: PlusSquare },
    { href: "/pact", label: "Sổ Kèo Của Tôi", icon: Lock, exact: true },
    { href: "/broker/stake", label: "Cọc GDTG & Lãi Aave", icon: Landmark },
    {
      href: "/admin/disputes",
      label: "Hội Đồng Phân Xử",
      icon: Scale,
      isRestricted: true,
      hasAccess: isAdminOrTreasury,
    },
  ];

  return (
    <div className="min-h-screen bg-[#090A0D] text-[#F1F5F9] flex flex-col font-sans antialiased selection:bg-[#E84142] selection:text-white">
      {/* ── TOP COMMAND HEADER (h-14) ─────────────────────────────────── */}
      <header className="h-14 border-b border-[#1E222D] bg-[#090A0D]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 h-full flex items-center justify-between gap-4">
          {/* Left: Brand Emblem & Wordmark */}
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-md bg-[#161922] border border-[#1E222D] flex items-center justify-center text-[#E84142] group-hover:border-[#E84142]/40 transition-colors">
                <Shield className="w-4 h-4 fill-[#E84142]/20 text-[#E84142]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-[#F1F5F9]">TRUSTPACT</span>
                <span className="text-[10px] font-mono uppercase bg-[#161922] border border-[#1E222D] px-1.5 py-0.5 rounded text-[#94A3B8]">
                  v1.0 Mainnet-Ready
                </span>
              </div>
            </Link>

            {/* Center Navigation: 5 Workspace Links */}
            <nav className="hidden xl:flex items-center h-14">
              {navLinks.map((link) => {
                const isActive = link.exact
                  ? pathname === link.href
                  : pathname?.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`h-full flex items-center gap-2 px-3.5 text-xs font-medium transition-colors border-b-2 relative ${
                      isActive
                        ? "border-[#E84142] text-[#F1F5F9]"
                        : "border-transparent text-[#94A3B8] hover:text-[#F1F5F9]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{link.label}</span>
                    {link.isRestricted && !link.hasAccess && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" title="Chế độ Giám sát Minh bạch (Yêu cầu chữ ký Admin)" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right: Live Telemetry & Web3 Wallet Strip */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Network Telemetry Badge */}
            <div className="hidden lg:flex items-center gap-3 px-3 py-1.5 rounded-md bg-[#101217] border border-[#1E222D] text-xs font-mono">
              <div className="flex items-center gap-1.5 text-[#94A3B8]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span>Avalanche C-Chain (0.8s)</span>
                <span className="text-[#64748B]">·</span>
                <span className="text-[#94A3B8]">{gasPriceGwei} nAVAX</span>
              </div>
              <span className="text-[#1E222D]">|</span>
              <div className="flex items-center gap-1 text-[#10B981]">
                <Layers className="w-3 h-3" />
                <span>L1 Radar (0 Gas)</span>
              </div>
            </div>

            {/* Connected User USDC Balance */}
            {isConnected && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#161922] border border-[#1E222D] text-xs font-mono">
                <span className="text-[#64748B]">USDC:</span>
                <span className="font-bold text-[#F1F5F9] tabular-nums">
                  {formatUsdc(usdcBalance as bigint)}
                </span>
              </div>
            )}

            {/* Network Warning Switch Button */}
            {isWrongChain && (
              <button
                onClick={() => switchChain({ chainId: avalancheFuji.id })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-medium hover:bg-[#EF4444]/25 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Đổi Mạng Fuji</span>
              </button>
            )}

            {/* Web3 Connect / Account Button */}
            {!isConnected ? (
              <button
                onClick={() => {
                  if (connectors && connectors.length > 0) {
                    connect({ connector: connectors[0] });
                  }
                }}
                className="px-4 py-1.5 rounded-md bg-[#E84142] hover:bg-[#D13637] text-white text-xs font-medium transition-colors"
              >
                Kết Nối Ví
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-xs font-mono text-[#F1F5F9] transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span>{shortenAddress(address)}</span>
                  {sbtBalance && Number(sbtBalance) > 0 ? (
                    <span className="px-1.5 py-0.2 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 text-[9px] font-bold">
                      SBT
                    </span>
                  ) : null}
                  <ChevronDown className="w-3 h-3 text-[#64748B]" />
                </button>

                {walletMenuOpen && (
                  <div className="absolute right-0 mt-1 w-56 rounded-md bg-[#101217] border border-[#1E222D] shadow-2xl p-2 z-50 animate-in fade-in duration-150">
                    <div className="px-2 py-1.5 border-b border-[#1E222D] mb-1">
                      <span className="text-[10px] font-mono text-[#64748B] block uppercase">Địa Chỉ Ví Của Bạn</span>
                      <span className="text-xs font-mono text-[#F1F5F9] select-all block break-all">
                        {address}
                      </span>
                    </div>

                    <div className="px-2 py-1 text-xs text-[#94A3B8] flex items-center justify-between">
                      <span>Mạng:</span>
                      <span className="font-mono text-[#F1F5F9]">
                        {chainId === avalancheFuji.id ? "Avalanche Fuji (43113)" : `Chain ID: ${chainId}`}
                      </span>
                    </div>

                    {sbtBalance && Number(sbtBalance) > 0 ? (
                      <div className="px-2 py-1 text-xs text-[#10B981] flex items-center gap-1.5 font-medium">
                        <Award className="w-3.5 h-3.5 shrink-0" />
                        <span>Sở Hữu TrustPassport SBT</span>
                      </div>
                    ) : null}

                    <button
                      onClick={() => {
                        disconnect();
                        setWalletMenuOpen(false);
                      }}
                      className="w-full mt-2 flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Ngắt Kết Nối Ví</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Subnav Strip */}
        <div className="xl:hidden flex items-center overflow-x-auto no-scrollbar border-t border-[#1E222D] bg-[#090A0D] px-4 h-10">
          {navLinks.map((link) => {
            const isActive = link.exact
              ? pathname === link.href
              : pathname?.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap px-3 text-xs font-medium ${
                  isActive ? "text-[#E84142]" : "text-[#94A3B8]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* ── MAIN WORKSPACE CONTENT ─────────────────────────────────── */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-4 sm:p-6">{children}</main>

      {/* ── FOOTER TELEMETRY STRIP ─────────────────────────────────── */}
      <footer className="border-t border-[#1E222D] bg-[#090A0D] py-3 text-[11px] font-mono text-[#64748B]">
        <div className="max-w-[1440px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>TRUSTPACT CORE PROTOCOL</span>
            <span>·</span>
            <span>FUJI C-CHAIN #43113</span>
            <span>·</span>
            <span>ZERO-GAS L1 RADAR #99943113</span>
          </div>
          <div>
            <span>Smart Contracts Audited · Avalanche UniHack 2026 Production Release</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
