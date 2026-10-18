"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield,
  CheckCircle2,
  Radar,
  PlusSquare,
  Lock,
  Landmark,
  Home,
  Activity,
  Menu,
  X,
  ExternalLink,
} from "lucide-react";
import { AvalancheIcon, UsdcIcon, AaveIcon } from "./CryptoIcons";
import { useStore, UserRole } from "../lib/store";
interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<string[]>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
}
export default function Navbar() {
  const [account, setAccount] = useState<string | null>("0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [blockNumber, setBlockNumber] = useState(38491204);
  const pathname = usePathname();
  const { role, setRole, walletBalances, deals } = useStore();
  const lockedDealsCount = deals.filter((d) => d.status === "LOCKED").length;
  useEffect(() => {
    const interval = setInterval(() => {
      setBlockNumber((b) => b + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const eth = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
      if (eth) {
        eth
          .request({ method: "eth_accounts" })
          .then((accounts: string[]) => {
            if (accounts.length > 0) setAccount(accounts[0]);
          })
          .catch(() => {});
      }
    }
  }, []);
  const connectWallet = async () => {
    if (typeof window !== "undefined") {
      const eth = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
      if (eth) {
        try {
          const accounts = await eth.request({ method: "eth_requestAccounts" });
          if (accounts.length > 0) setAccount(accounts[0]);
          return;
        } catch {}
      }
      setAccount("0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001");
    }
  };
  const navLinks = [
    { href: "/", label: "Tổng Quan", icon: Home },
    { href: "/radar", label: "Scam Radar", icon: Radar, badge: "0đ Gas" },
    { href: "/create", label: "Tạo Ký Quỹ", icon: PlusSquare },
    {
      href: "/room/101",
      label: "Phòng Đối Soát",
      icon: Lock,
      badge: lockedDealsCount > 0 ? `${lockedDealsCount} Live` : undefined,
    },
    { href: "/broker", label: "Cọc Aave V3", icon: Landmark, badge: "5.2% APY" },
  ];
  const roleConfigs: Record<
    UserRole,
    {
      label: string;
      shortLabel: string;
      address: string;
      activeClass: string;
      dotColor: string;
    }
  > = {
    buyer: {
      label: "Bên Mua (Minh)",
      shortLabel: "Bên Mua",
      address: "0x1A2b...0001",
      activeClass: "bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.25)]",
      dotColor: "bg-blue-400",
    },
    seller: {
      label: "Bên Bán (Hùng)",
      shortLabel: "Bên Bán",
      address: "0x89C3...0002",
      activeClass: "bg-emerald-600/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]",
      dotColor: "bg-emerald-400",
    },
    broker: {
      label: "GDTG (Nguyễn Nam)",
      shortLabel: "Trung Gian",
      address: "0x30F1...889A",
      activeClass: "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]",
      dotColor: "bg-amber-400",
    },
  };
  const currentRoleInfo = roleConfigs[role];
  return (
    <header className="sticky top-0 z-50">
      <div className="bg-[#030509]/95 border-b border-white/[0.06] py-1.5 px-4 text-[11px] text-slate-400 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 overflow-x-auto no-scrollbar whitespace-nowrap">
            <span className="inline-flex items-center space-x-1.5 text-slate-200 font-medium">
              <AvalancheIcon className="w-3.5 h-3.5" />
              <span>Avalanche Fuji C-Chain</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.05] text-slate-400">
                43113
              </span>
            </span>
            <span className="text-slate-700">•</span>
            <span className="inline-flex items-center space-x-1 text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Subnet L1: 0đ Gas</span>
            </span>
            <span className="hidden md:inline text-slate-700">•</span>
            <span className="hidden md:inline-flex items-center space-x-1 text-purple-300 font-mono">
              <AaveIcon className="w-3.5 h-3.5" />
              <span>Aave V3 Supply APY: 5.20%</span>
            </span>
            <span className="hidden lg:inline text-slate-700">•</span>
            <span className="hidden lg:inline-flex items-center space-x-1 text-blue-400 font-mono">
              <Activity className="w-3 h-3" />
              <span>Snowman Finality: 0.8s</span>
            </span>
          </div>
          <div className="hidden sm:flex items-center space-x-3 font-mono text-[11px] shrink-0">
            <span className="text-slate-500">
              Block <strong className="text-slate-300">#{blockNumber.toLocaleString()}</strong>
            </span>
            <a
              href="https://testnet.snowtrace.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white inline-flex items-center space-x-1 transition-colors"
            >
              <span>Snowtrace</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
      <nav className="bg-[#060911]/90 border-b border-white/[0.08] backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-emerald-500 p-[1px] shadow-[0_0_25px_rgba(37,99,235,0.35)] transition-all">
                <div className="w-full h-full bg-[#060912] rounded-[11px] flex items-center justify-center">
                  <Shield className="w-5 h-5 text-blue-400 group-hover:text-emerald-400 transition-colors" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">
                    TrustPact
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30">
                    UYTIN.NET
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:block">
                  Social Escrow & Aave Yield
                </span>
              </div>
            </Link>
            <div className="hidden xl:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname?.startsWith(link.href.split("/")[1] ? `/${link.href.split("/")[1]}` : link.href);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`relative px-3 py-2 rounded-xl text-xs font-medium flex items-center space-x-1.5 transition-all ${
                      isActive
                        ? "bg-white/[0.09] text-white border border-white/[0.12] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono font-semibold ${
                          link.badge.includes("APY")
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : link.badge.includes("0đ")
                            ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                            : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        }`}
                      >
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="flex items-center space-x-2.5">
            <div className="hidden md:flex items-center bg-[#04060B] border border-white/[0.08] rounded-xl p-1 shadow-inner">
              <span className="text-[10px] font-mono text-slate-500 uppercase px-2 hidden lg:inline">
                Góc nhìn:
              </span>
              {(["buyer", "seller", "broker"] as UserRole[]).map((r) => {
                const active = role === r;
                const cfg = roleConfigs[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all flex items-center space-x-1.5 border ${
                      active
                        ? cfg.activeClass
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                    <span>{cfg.shortLabel}</span>
                  </button>
                );
              })}
            </div>
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-mono">
              <UsdcIcon className="w-4 h-4" />
              <div className="leading-none">
                <span className="text-white font-bold tabular-nums">
                  {walletBalances[role].toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400 ml-1">USDC</span>
              </div>
            </div>
            <button
              onClick={connectWallet}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600/20 to-indigo-600/20 hover:from-blue-600/30 hover:to-indigo-600/30 border border-blue-500/30 text-xs font-mono text-white transition-all shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="hidden sm:inline">{currentRoleInfo.address}</span>
              <span className="sm:hidden">Ví</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-white/[0.08] bg-[#060911] px-4 py-4 space-y-4">
            <div className="grid grid-cols-1 gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                      isActive
                        ? "bg-blue-600/20 text-white border border-blue-500/40"
                        : "text-slate-300 hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4 text-blue-400" />
                      <span>{link.label}</span>
                    </div>
                    {link.badge && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/[0.06] text-slate-300">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            <div className="pt-3 border-t border-white/[0.08]">
              <span className="text-[11px] font-mono text-slate-400 uppercase block mb-2">
                Chuyển đổi vai trò Demo:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(["buyer", "seller", "broker"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setMobileMenuOpen(false);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-semibold border text-center ${
                      role === r
                        ? roleConfigs[r].activeClass
                        : "bg-white/[0.02] border-white/[0.08] text-slate-400"
                    }`}
                  >
                    {roleConfigs[r].shortLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
