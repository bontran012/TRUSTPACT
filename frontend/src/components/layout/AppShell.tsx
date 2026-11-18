"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useDisconnect, useChainId, useSwitchChain, useReadContract } from "wagmi";
import { avalancheFuji } from "wagmi/chains";
import {
  Shield,
  Search,
  PlusCircle,
  Lock,
  Landmark,
  Scale,
  AlertTriangle,
  LogOut,
  ChevronDown,
  Coins,
  ExternalLink,
  User,
  Users,
  Menu,
  X,
  Gavel,
  Wallet,
  Link as LinkIcon,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { AuthModal } from "@/src/components/auth/AuthModal";
import { LinkWalletModal } from "@/src/components/auth/LinkWalletModal";
import { OnboardingModal } from "@/src/components/auth/OnboardingModal";
import { CSKHLiveChat } from "@/src/components/chat/CSKHLiveChat";
import {
  CONTRACT_ADDRESSES,
  ERC20_ABI,
  UNIVERSAL_ESCROW_ABI,
  formatUsdc,
  shortenAddress,
} from "@/src/lib/contracts";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { currentUser, setIsAuthModalOpen, setIsLinkWalletModalOpen, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isWrongChain = isConnected && chainId !== avalancheFuji.id;

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

  useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "admin",
  });

  const navLinks = [
    { href: "/", label: t("Trang Chủ", "Home"), icon: Shield, exact: true },
    { href: "/pact", label: t("Giao Dịch Ký Quỹ", "Escrow Deals"), icon: Lock, exact: false },
    { href: "/broker/stake", label: t("Cọc GDTG", "Broker Staking"), icon: Landmark, exact: false },
    { href: "/profile", label: t("Cá Nhân", "Profile"), icon: User, exact: false },
  ];

  const getRoleLabel = (role?: string) => {
    if (role === "BROKER") return t("GDTG Bảo Chứng", "Broker");
    if (role === "SELLER") return t("Bên Bán", "Seller");
    if (role === "ADMIN") return "Admin";
    return t("Bên Mua", "Buyer");
  };

  return (
    <div className="relative min-h-screen flex flex-col font-sans antialiased selection:bg-sky-400/30">
      {/* ── FULL-VIEWPORT SCENIC ALPINE & AURORA WALLPAPER CANVAS ──────── */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none bg-gradient-to-br from-[#102759] via-[#1B2B6E] to-[#0E3A5D]">
        <img
          src="/images/bg-alpine-aurora.png"
          alt=""
          className="w-full h-full object-cover object-center scale-[1.02] opacity-90"
        />
        {/* Ambient Aurora Light Washes */}
        <div className="absolute -top-32 left-1/4 w-[680px] h-[420px] rounded-full bg-sky-400/20 blur-[130px] animate-pulse-glow" />
        <div className="absolute top-1/3 -right-24 w-[560px] h-[520px] rounded-full bg-indigo-500/25 blur-[140px]" />
        <div className="absolute -bottom-32 left-10 w-[620px] h-[420px] rounded-full bg-teal-400/15 blur-[130px]" />
        {/* Soft Crystal Contrast Veil */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1838]/30 via-[#0C1D42]/45 to-[#081530]/68" />
      </div>

      {/* ── LEVITATING VISION-OS CAPSULE HEADER ────────────────────────── */}
      <header className="sticky top-3.5 z-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-[66px] rounded-full bg-white/[0.11] backdrop-blur-2xl border border-white/[0.22] shadow-[0_20px_50px_-12px_rgba(4,12,34,0.52),0_1px_0_0_rgba(255,255,255,0.28)_inset] px-3.5 sm:px-5 flex items-center justify-between gap-3">
          {/* Left: Brand Identity */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group pl-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600 shadow-[0_1px_0_0_rgba(255,255,255,0.4)_inset,0_6px_18px_rgba(56,189,248,0.45)] flex items-center justify-center text-white transition-transform group-hover:scale-105">
              <Shield className="w-[19px] h-[19px] fill-white/25" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-[16px] tracking-tight text-white drop-shadow-sm">
                  TrustPact
                </span>
                <span className="hidden xl:inline-flex text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-200 border border-sky-300/30">
                  AVAX
                </span>
              </div>
              <span className="text-[11px] text-sky-100/75 font-medium leading-none mt-0.5 hidden sm:block">
                Escrow &amp; Trust Cloud
              </span>
            </div>
          </Link>

          {/* Center Navigation: Fluid Pill Switcher */}
          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-[#091532]/35 border border-white/[0.14] backdrop-blur-xl">
            {navLinks.map((link) => {
              const isActive = link.exact
                ? pathname === link.href
                : pathname?.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-sky-400/30 to-indigo-500/35 text-white border border-sky-300/40 shadow-[0_4px_14px_rgba(56,189,248,0.25)]"
                      : "text-sky-100/75 hover:text-white hover:bg-white/[0.08] border border-transparent"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-sky-300" : "text-sky-200/60"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Telemetry, Language & Circular Persona Pill */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Network + Faucet Pill */}
            <div className="hidden xl:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#091532]/35 border border-white/[0.14] text-xs whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
              <span className="text-white font-medium">Avalanche Fuji</span>
              <a
                href="https://core.app/tools/testnet-faucet/?subnet=c&token=c"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-0.5 pl-2 border-l border-white/[0.15] text-amber-300 hover:text-amber-200 inline-flex items-center gap-1 font-semibold transition-colors"
                title="Nhận AVAX Testnet miễn phí"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Faucet</span>
              </a>
            </div>

            {isWrongChain && (
              <button
                onClick={() => switchChain({ chainId: avalancheFuji.id })}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-semibold hover:bg-amber-400/30 whitespace-nowrap transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Đổi sang Fuji</span>
              </button>
            )}

            {/* Compact Language Pill */}
            <div className="hidden sm:flex items-center rounded-full bg-[#091532]/35 border border-white/[0.14] p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLanguage("vi")}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  language === "vi"
                    ? "bg-white/[0.2] text-white shadow-sm"
                    : "text-sky-100/60 hover:text-white"
                }`}
              >
                VI
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2.5 py-1 rounded-full transition-all ${
                  language === "en"
                    ? "bg-white/[0.2] text-white shadow-sm"
                    : "text-sky-100/60 hover:text-white"
                }`}
              >
                EN
              </button>
            </div>

            {/* User Account Capsule */}
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                  className="flex items-center gap-2.5 pl-1.5 pr-3.5 py-1 rounded-full bg-white/[0.12] hover:bg-white/[0.18] border border-white/[0.22] transition-all text-xs whitespace-nowrap shadow-sm"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-sky-300/40 shrink-0 bg-slate-800">
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as any).src = "/images/avatar-tuan.jpg";
                      }}
                    />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-bold text-white leading-tight truncate max-w-[115px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[11px] text-sky-200 font-medium leading-tight">
                      {getRoleLabel(currentUser.role)}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-sky-200 transition-transform ${walletMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {walletMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setWalletMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-72 rounded-3xl bg-[#0F2147]/95 backdrop-blur-2xl border border-white/[0.22] shadow-[0_24px_60px_rgba(4,10,28,0.75)] p-3.5 z-50 animate-fade-in space-y-2.5">
                      <div className="p-3.5 rounded-2xl bg-white/[0.07] border border-white/[0.12] flex items-center gap-3">
                        <img
                          src={currentUser.avatarUrl}
                          alt={currentUser.name}
                          className="w-11 h-11 rounded-full object-cover ring-2 ring-sky-300/40 shrink-0"
                          onError={(e) => {
                            (e.target as any).src = "/images/avatar-tuan.jpg";
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-sky-200 bg-sky-400/20 px-2 py-0.5 rounded-full border border-sky-300/30">
                              {currentUser.role}
                            </span>
                            {currentUser.authProvider === "gmail" && (
                              <span className="text-[10px] font-medium text-amber-200 bg-amber-400/15 px-2 py-0.5 rounded-full border border-amber-300/30">
                                Gmail
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-white truncate block mt-1">
                            {currentUser.name}
                          </span>
                          <span className="text-xs font-mono text-sky-200/70 truncate block">
                            {currentUser.authProvider === "gmail"
                              ? currentUser.email
                              : currentUser.walletAddress
                              ? shortenAddress(currentUser.walletAddress)
                              : "Chưa liên kết ví"}
                          </span>
                        </div>
                      </div>

                      {/* Wallet Status Card for Gmail Users */}
                      {currentUser.authProvider === "gmail" && !currentUser.isWalletLinked && (
                        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/25 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-amber-200 font-semibold flex items-center gap-1.5">
                              <Wallet className="w-3.5 h-3.5 text-amber-300" />
                              <span>Ví Web3 Avalanche</span>
                            </span>
                            <span className="text-[10px] text-amber-200/80 bg-amber-400/20 px-1.5 py-0.5 rounded-full">
                              Chưa liên kết
                            </span>
                          </div>
                          <p className="text-[10px] text-sky-100/70 leading-relaxed">
                            Liên kết ví Web3 khi bạn cần nạp tiền ký quỹ PACT hoặc nạp cọc bảo chứng.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setWalletMenuOpen(false);
                              setIsLinkWalletModalOpen(true);
                            }}
                            className="w-full py-1.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                            <span>Liên Kết Ví Web3 Ngay</span>
                          </button>
                        </div>
                      )}

                      <div className="px-2 py-1 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-sky-100/75">
                          <span>Số dư khả dụng</span>
                          <span className="font-mono font-bold text-white tabular-nums">
                            {isConnected && usdcBalance
                              ? `${formatUsdc(usdcBalance as bigint)} USDC`
                              : `${currentUser.balanceUsdc.toLocaleString()} USDC`}
                          </span>
                        </div>
                        {currentUser.sbtId && (
                          <div className="flex justify-between items-center text-sky-100/75">
                            <span>Hộ chiếu SBT</span>
                            <span className="font-mono font-semibold text-emerald-300">{currentUser.sbtId}</span>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-white/[0.12] pt-2 space-y-1">
                        <Link
                          href="/pact/create"
                          onClick={() => setWalletMenuOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-white hover:bg-white/[0.1] transition-colors"
                        >
                          <PlusCircle className="w-4 h-4 text-sky-400" />
                          <span>{t("Tạo Kèo Ký Quỹ Mới", "Create New Escrow")}</span>
                        </Link>

                        <Link
                          href="/profile"
                          onClick={() => setWalletMenuOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-white hover:bg-white/[0.1] transition-colors"
                        >
                          <User className="w-4 h-4 text-emerald-300" />
                          <span>{t("Hồ sơ & Ví liên kết", "Profile & Linked Wallet")}</span>
                        </Link>

                        <Link
                          href="/admin/disputes"
                          onClick={() => setWalletMenuOpen(false)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-white hover:bg-white/[0.1] transition-colors"
                        >
                          <Gavel className="w-4 h-4 text-amber-300" />
                          <span>{t("Trung Tâm Xử Lý Tranh Chấp", "Dispute Resolution")}</span>
                        </Link>

                        <button
                          onClick={() => {
                            logout();
                            disconnect();
                            setWalletMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs font-semibold text-rose-300 hover:bg-rose-500/15 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t("Đăng xuất", "Log out")}</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 text-white text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all shadow-[0_6px_20px_rgba(56,189,248,0.4)]"
              >
                <User className="w-3.5 h-3.5" />
                <span>Đăng Nhập</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-full bg-white/[0.12] border border-white/[0.2] text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden max-w-7xl mx-auto mt-2 rounded-3xl border border-white/[0.2] bg-[#0F2147]/95 backdrop-blur-2xl px-4 py-3 space-y-1 animate-fade-in shadow-2xl">
            {navLinks.map((link) => {
              const isActive = link.exact
                ? pathname === link.href
                : pathname?.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-sky-400/20 text-white border border-sky-300/30"
                      : "text-sky-100/80 hover:text-white hover:bg-white/[0.08]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-sky-300" : "text-sky-200/60"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* ── MAIN WORKSPACE ────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {children}
      </main>

      {/* ── TRANSLUCENT GLASS FOOTER ──────────────────────────────────── */}
      <footer className="mt-12 px-4 sm:px-6 lg:px-8 pb-6">
        <div className="max-w-7xl mx-auto rounded-3xl bg-white/[0.07] backdrop-blur-2xl border border-white/[0.15] px-6 py-6 text-xs text-sky-100/70 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 flex items-center justify-center text-white shadow-sm">
                <Shield className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-white text-sm tracking-tight">TrustPact</span>
              <span className="text-white/30">·</span>
              <span className="text-sky-100/80">Hạ tầng Ký quỹ 3 Bên &amp; Sổ đen Chống gian lận trên Avalanche</span>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-sky-100/80">
              <Link
                href="/compliance"
                className="hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Scale className="w-3.5 h-3.5 text-sky-300" />
                <span>Kiến Trúc &amp; Pháp Lý</span>
              </Link>
              <Link
                href="/admin/disputes"
                className="hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Gavel className="w-3.5 h-3.5 text-amber-300" />
                <span>Hội Đồng Trọng Tài</span>
              </Link>
              <a
                href="https://t.me/TrustPact_Sentinel_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>Telegram Sentinel</span>
                <ExternalLink className="w-3 h-3 text-sky-200/60" />
              </a>
              <a
                href={`https://testnet.snowtrace.io/address/${CONTRACT_ADDRESSES.universalEscrow}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white flex items-center gap-1 transition-colors font-mono"
              >
                <span>Snowtrace</span>
                <ExternalLink className="w-3 h-3 text-sky-200/60" />
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-sky-200/60 pt-3.5 border-t border-white/[0.1]">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-emerald-300">●</span>
              <span>AVALANCHE FUJI #43113</span>
              <span className="text-white/25">·</span>
              <span>AAVE V3 REAL YIELD (80/20)</span>
              <span className="text-white/25">·</span>
              <span>ERC-721 SOULBOUND SBT</span>
            </div>
            <div>
              <span>Avalanche UniHack 2026</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Modals & Support Widget */}
      <AuthModal />
      <LinkWalletModal />
      <OnboardingModal />
      <CSKHLiveChat />
    </div>
  );
}
