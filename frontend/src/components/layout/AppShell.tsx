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
  Menu,
  X,
  Gavel,
  Wallet,
  Link as LinkIcon,
  List,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { AuthModal } from "@/src/components/auth/AuthModal";
import { LinkWalletModal } from "@/src/components/auth/LinkWalletModal";
import { OnboardingModal } from "@/src/components/auth/OnboardingModal";
import {
  CONTRACT_ADDRESSES,
  ERC20_ABI,
  UNIVERSAL_ESCROW_ABI,
  formatUsdc,
  shortenAddress,
} from "@/src/lib/contracts";

function getUserInitials(name?: string): string {
  if (!name) return "TP";
  const cleaned = name.replace(/\(.*?\)/g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isWrongChain = mounted && isConnected && chainId !== avalancheFuji.id;

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
    { href: "/", label: t("Tra cứu rủi ro", "Risk Check"), icon: Search, exact: true },
    { href: "/pact", label: t("Giao dịch ký quỹ", "Escrow"), icon: Lock, exact: false },
    { href: "/broker/stake", label: t("Thế chấp GDTG", "GDTG Staking"), icon: Landmark, exact: false },
    { href: "/profile", label: t("Hồ sơ", "Profile"), icon: User, exact: false },
  ];

  const getRoleLabel = (role?: string) => {
    if (role === "BROKER") return t("GDTG bảo chứng", "Broker");
    if (role === "SELLER") return t("Bên bán", "Seller");
    if (role === "ADMIN") return t("Quản trị viên", "Admin");
    return t("Bên mua", "Buyer");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0F17] text-[#F8FAFC] font-sans antialiased border-t-2 border-blue-600/80">
      {/* ── CLEAN BANKING FULL-WIDTH TOP BAR ───────────────────────────── */}
      <header className="sticky top-0 z-50 h-16 bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800/90">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Institutional Brand */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 transition-colors group-hover:bg-blue-600/25">
              <Shield className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[15px] tracking-tight text-slate-100">
                TrustPact
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/80">
                FUJI
              </span>
            </div>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = link.exact
                ? pathname === link.href
                : pathname?.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? "bg-slate-800/90 text-white border border-slate-700/80"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 border border-transparent"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right: Network, Language & Account */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Network + Faucet */}
            <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#111827] border border-slate-800 text-xs whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-medium">Avalanche Fuji</span>
              <a
                href="https://core.app/tools/testnet-faucet/?subnet=c&token=c"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-0.5 pl-2 border-l border-slate-800 text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium transition-colors"
                title="Nhận AVAX Testnet"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>Faucet</span>
              </a>
            </div>

            {isWrongChain && (
              <button
                onClick={() => switchChain({ chainId: avalancheFuji.id })}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium hover:bg-amber-500/20 whitespace-nowrap transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Chuyển sang Fuji</span>
              </button>
            )}

            {/* Language Switcher */}
            <div className="hidden sm:flex items-center rounded-lg bg-[#111827] border border-slate-800 p-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setLanguage("vi")}
                className={`px-2 py-1 rounded-md transition-colors ${
                  language === "vi"
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                VI
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={`px-2 py-1 rounded-md transition-colors ${
                  language === "en"
                    ? "bg-slate-800 text-slate-100"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                EN
              </button>
            </div>

            {/* User Account */}
            {!mounted ? (
              <div className="h-8 w-24 rounded-lg bg-slate-800/40 border border-slate-800 animate-pulse" />
            ) : currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setWalletMenuOpen(!walletMenuOpen)}
                  className="flex items-center gap-2.5 pl-2 pr-2.5 py-1 rounded-lg bg-[#111827] hover:bg-slate-800/90 border border-slate-800 transition-colors text-xs whitespace-nowrap"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-[11px] flex items-center justify-center shrink-0">
                    {getUserInitials(currentUser.name)}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="font-semibold text-slate-100 leading-tight truncate max-w-[120px]">
                      {currentUser.name}
                    </span>
                    <span className="text-[11px] text-slate-400 leading-tight">
                      {getRoleLabel(currentUser.role)}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${walletMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {walletMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setWalletMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#111827] border border-slate-700/90 shadow-2xl p-3 z-50 animate-fade-in space-y-2.5">
                      <div className="p-3 rounded-lg bg-[#0B0F17] border border-slate-800 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center shrink-0">
                          {getUserInitials(currentUser.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-semibold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              {currentUser.role}
                            </span>
                            {currentUser.authProvider === "gmail" && (
                              <span className="text-[10px] font-medium text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/25">
                                Gmail
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-semibold text-slate-100 truncate block mt-1">
                            {currentUser.name}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 truncate block">
                            {currentUser.authProvider === "gmail"
                              ? currentUser.email
                              : currentUser.walletAddress
                              ? shortenAddress(currentUser.walletAddress)
                              : "Chưa liên kết ví"}
                          </span>
                        </div>
                      </div>

                      {currentUser.authProvider === "gmail" && !currentUser.isWalletLinked && (
                        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/25 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-amber-300 font-medium flex items-center gap-1.5">
                              <Wallet className="w-3.5 h-3.5 text-amber-400" />
                              <span>Ví Web3 Avalanche</span>
                            </span>
                            <span className="text-[10px] text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded">
                              Chưa liên kết
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setWalletMenuOpen(false);
                              setIsLinkWalletModalOpen(true);
                            }}
                            className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <LinkIcon className="w-3.5 h-3.5" />
                            <span>Liên kết ví Web3</span>
                          </button>
                        </div>
                      )}

                      <div className="px-1.5 py-1 space-y-1.5 text-xs">
                        <div className="flex justify-between items-center text-slate-400">
                          <span>Số dư khả dụng</span>
                          <span className="font-mono font-semibold text-slate-100 tabular-nums">
                            {isConnected && usdcBalance
                              ? `${formatUsdc(usdcBalance as bigint)} USDC`
                              : `${currentUser.balanceUsdc.toLocaleString()} USDC`}
                          </span>
                        </div>
                        {currentUser.sbtId && (
                          <div className="flex justify-between items-center text-slate-400">
                            <span>Định danh SBT</span>
                            <span className="font-mono font-semibold text-emerald-400">{currentUser.sbtId}</span>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-slate-800 pt-2 space-y-0.5">
                        <Link
                          href="/pact/create"
                          onClick={() => setWalletMenuOpen(false)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800/80 transition-colors"
                        >
                          <PlusCircle className="w-4 h-4 text-blue-400" />
                          <span>{t("Tạo giao dịch ký quỹ", "Create Escrow")}</span>
                        </Link>

                        <Link
                          href="/pact"
                          onClick={() => setWalletMenuOpen(false)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800/80 transition-colors"
                        >
                          <List className="w-4 h-4 text-slate-400" />
                          <span>{t("Danh sách giao dịch", "Escrow Ledger")}</span>
                        </Link>

                        <Link
                          href="/profile"
                          onClick={() => setWalletMenuOpen(false)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800/80 transition-colors"
                        >
                          <User className="w-4 h-4 text-emerald-400" />
                          <span>{t("Hồ sơ & Ví liên kết", "Profile & Linked Wallet")}</span>
                        </Link>

                        <Link
                          href="/admin/disputes"
                          onClick={() => setWalletMenuOpen(false)}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800/80 transition-colors"
                        >
                          <Gavel className="w-4 h-4 text-amber-400" />
                          <span>{t("Phân xử tranh chấp", "Dispute Resolution")}</span>
                        </Link>

                        <button
                          onClick={() => {
                            logout();
                            disconnect();
                            setWalletMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
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
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium border border-blue-500/30 shadow-sm flex items-center gap-2 whitespace-nowrap transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>{t("Đăng nhập", "Sign in")}</span>
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-[#111827] border border-slate-800 text-slate-200 hover:bg-slate-800 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-800 bg-[#111827] px-4 py-3 space-y-1 animate-fade-in shadow-xl">
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
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-slate-800 text-white border border-slate-700"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* ── MAIN WORKSPACE ────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {children}
      </main>

      {/* ── COMPACT INSTITUTIONAL FOOTER ──────────────────────────────── */}
      <footer className="mt-auto border-t border-slate-800/90 bg-[#0B0F17]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">TrustPact</span>
            <span className="text-slate-700">·</span>
            <span className="font-mono text-[11px] text-slate-500">AVALANCHE FUJI #43113</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 text-xs">
            <Link
              href="/compliance"
              className="hover:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
            >
              <Scale className="w-3.5 h-3.5 text-slate-500" />
              <span>Kiến trúc &amp; Pháp lý</span>
            </Link>
            <Link
              href="/admin/disputes"
              className="hover:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
            >
              <Gavel className="w-3.5 h-3.5 text-slate-500" />
              <span>Phân xử tranh chấp</span>
            </Link>
            <a
              href="https://t.me/TrustPact_Sentinel_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 inline-flex items-center gap-1 transition-colors"
            >
              <span>Telegram Bot</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
            <a
              href={`https://testnet.snowtrace.io/address/${CONTRACT_ADDRESSES.universalEscrow}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-200 inline-flex items-center gap-1 transition-colors font-mono"
            >
              <span>Snowtrace</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>
        </div>
      </footer>

      {/* Global Auth Modals */}
      <AuthModal />
      <LinkWalletModal />
      <OnboardingModal />
    </div>
  );
}
