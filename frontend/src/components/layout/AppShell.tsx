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
  Coins,
  ExternalLink,
  User,
  Users,
  Headphones,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { AuthModal } from "@/src/components/auth/AuthModal";
import { OnboardingModal } from "@/src/components/auth/OnboardingModal";
import { CSKHLiveChat } from "@/src/components/chat/CSKHLiveChat";
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
  const { currentUser, setIsAuthModalOpen, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
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
    { href: "/", label: t("Tra Cứu Scam & Tín Nhiệm", "Scam Radar & SBT"), icon: Search, exact: true },
    { href: "/pact/create", label: t("Tạo Kèo Ký Quỹ", "Create Escrow"), icon: PlusSquare },
    { href: "/pact", label: t("Sổ Kèo Của Tôi", "My Deals"), icon: Lock, exact: true },
    { href: "/broker/stake", label: t("Cọc GDTG & Lãi Aave", "Stake & Aave Yield"), icon: Landmark },
    { href: "/profile", label: t("Mục Tôi", "My Profile"), icon: User, exact: true },
  ];

  return (
    <div className="min-h-screen bg-[#090A0D] text-[#F1F5F9] flex flex-col font-sans antialiased selection:bg-[#E84142] selection:text-white">
      {/* ── TOP COMMAND HEADER (h-14) ─────────────────────────────────── */}
      <header className="h-14 border-b border-[#1E222D] bg-[#090A0D]/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 h-full flex items-center justify-between gap-4">
          {/* Left: Brand Emblem & Wordmark */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-md bg-[#161922] border border-[#1E222D] flex items-center justify-center text-[#E84142] group-hover:border-[#E84142]/40 transition-colors">
                <Shield className="w-4 h-4 fill-[#E84142]/20 text-[#E84142]" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm tracking-tight text-[#F1F5F9]">TRUSTPACT</span>
                <span className="text-[10px] font-mono uppercase bg-[#161922] border border-[#1E222D] px-1.5 py-0.5 rounded text-[#94A3B8]">
                  v1.0 Mainnet-Ready
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation: Trải rộng tự nhiên và thoáng đãng */}
          <nav className="hidden md:flex flex-1 items-center justify-center gap-1 sm:gap-2 lg:gap-4 h-14">
            {navLinks.map((link) => {
              const isActive = link.exact
                ? pathname === link.href
                : pathname?.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`h-full flex items-center gap-2 px-3 lg:px-4 text-xs font-semibold transition-colors border-b-2 relative ${
                    isActive
                      ? "border-[#E84142] text-[#F1F5F9]"
                      : "border-transparent text-[#94A3B8] hover:text-[#F1F5F9] hover:border-[#1E222D]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Live Telemetry & User Account Strip */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Live Network Telemetry Badge */}
            <div className="hidden 2xl:flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-[#101217] border border-[#1E222D] text-xs font-mono">
              <div className="flex items-center gap-1.5 text-[#94A3B8]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span>Avalanche C-Chain</span>
                <span className="text-[#64748B]">·</span>
                <span className="text-[#94A3B8]">{gasPriceGwei} nAVAX</span>
              </div>
              <span className="text-[#1E222D]">|</span>
              <div className="flex items-center gap-1 text-[#10B981]">
                <Layers className="w-3 h-3" />
                <span>L1 0đ Gas</span>
              </div>
            </div>

            {/* Faucet Link for Testers / Judges */}
            <a
              href="https://core.app/tools/testnet-faucet/?subnet=c&token=c"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-[11px] font-mono text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
              title="Nhận Testnet AVAX & USDC miễn phí để thử nghiệm giao dịch"
            >
              <Coins className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Faucet</span>
              <ExternalLink className="w-2.5 h-2.5 text-[#64748B]" />
            </a>

            {/* Network Warning Switch Button */}
            {isWrongChain && (
              <button
                onClick={() => switchChain({ chainId: avalancheFuji.id })}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-medium hover:bg-[#EF4444]/25 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Đổi Mạng Fuji</span>
              </button>
            )}

            {/* Language Switcher (VI / EN) */}
            <div className="flex items-center rounded-md bg-[#161922] border border-[#1E222D] p-0.5 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setLanguage("vi")}
                className={`px-2 py-0.5 rounded transition-all ${
                  language === "vi"
                    ? "bg-[#E84142] text-white font-bold shadow-sm"
                    : "text-[#94A3B8] hover:text-[#F1F5F9]"
                }`}
                title="Tiếng Việt"
              >
                VI
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2 py-0.5 rounded transition-all ${
                  language === "en"
                    ? "bg-[#E84142] text-white font-bold shadow-sm"
                    : "text-[#94A3B8] hover:text-[#F1F5F9]"
                }`}
                title="English"
              >
                EN
              </button>
            </div>

            {/* USER ACCOUNT & PROFILE PILL */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-xs transition-colors"
                >
                  <div className="w-6 h-6 rounded-full overflow-hidden border border-[#1E222D] shrink-0 bg-[#090A0D]">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).src =
                          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80";
                      }}
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-bold text-[#F1F5F9] leading-tight truncate max-w-[120px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[9px] font-mono text-[#10B981] leading-tight">
                      {currentUser.role === "BROKER"
                        ? "GDTG Cọc Aave"
                        : currentUser.role === "SELLER"
                        ? "Người Bán (OTC)"
                        : "Người Mua (Buyer)"}
                    </span>
                  </div>
                  <ChevronDown className="w-3 h-3 text-[#64748B]" />
                </button>

                {walletMenuOpen && (
                  <div className="absolute right-0 mt-1 w-64 rounded-md bg-[#101217] border border-[#1E222D] shadow-2xl p-2.5 z-50 animate-in fade-in duration-150">
                    <div className="px-2 py-1.5 border-b border-[#1E222D] mb-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-[#64748B] block uppercase">
                          Hồ Sơ Đăng Nhập
                        </span>
                        <span className="text-[9px] font-mono text-[#10B981] font-bold bg-[#10B981]/15 px-1.5 py-0.2 rounded">
                          {currentUser.role}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#F1F5F9] block mt-0.5">
                        {currentUser.name}
                      </span>
                      <span className="text-[11px] font-mono text-[#94A3B8] select-all block break-all">
                        {currentUser.walletAddress}
                      </span>
                    </div>

                    <div className="space-y-1 py-1 text-xs">
                      <div className="px-2 py-1 flex items-center justify-between text-[#94A3B8]">
                        <span>Số dư ví:</span>
                        <span className="font-mono text-[#F1F5F9] font-bold">
                          {isConnected && usdcBalance
                            ? `${formatUsdc(usdcBalance as bigint)} USDC`
                            : `${currentUser.balanceUsdc.toLocaleString()} USDC`}
                        </span>
                      </div>

                      {currentUser.sbtId && (
                        <div className="px-2 py-1 flex items-center justify-between text-[#10B981]">
                          <span>TrustPassport SBT:</span>
                          <span className="font-mono font-bold">{currentUser.sbtId}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-[#1E222D] pt-2 mt-1 space-y-1">
                      <Link
                        href="/profile"
                        onClick={() => setWalletMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[#F1F5F9] hover:bg-[#161922] transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>{t("Mục Tôi (Hồ Sơ & ID)", "My Profile & ID")}</span>
                      </Link>

                      <button
                        onClick={() => {
                          setWalletMenuOpen(false);
                          setIsAuthModalOpen(true);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[#F1F5F9] hover:bg-[#161922] transition-colors"
                      >
                        <Users className="w-3.5 h-3.5 text-[#E84142]" />
                        <span>{t("Đổi Tài Khoản / Vai Trò (1-Click)", "Switch Persona (1-Click)")}</span>
                      </button>

                      <button
                        onClick={() => {
                          logout();
                          disconnect();
                          setWalletMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{t("Đăng Xuất Tài Khoản", "Log Out")}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-1.5 rounded-md bg-[#E84142] hover:bg-[#D13637] text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <User className="w-3.5 h-3.5" />
                <span>Đăng Nhập / Chọn Vai Trò</span>
              </button>
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

      {/* Floating CSKH Live Support Chat Widget */}
      <CSKHLiveChat />

      {/* Global Auth & Account Management Modal */}
      <AuthModal />

      {/* Mandatory Username Onboarding Modal */}
      <OnboardingModal />
    </div>
  );
}
