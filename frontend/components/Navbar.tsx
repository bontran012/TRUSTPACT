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
  Search,
} from "lucide-react";
import { AvalancheIcon, UsdcIcon } from "./CryptoIcons";
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
    const interval = setInterval(() => setBlockNumber((b) => b + 1), 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const eth = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
      if (eth) {
        eth.request({ method: "eth_accounts" })
          .then((accounts: string[]) => { if (accounts.length > 0) setAccount(accounts[0]); })
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
    { href: "/radar", label: "Tra Cứu", icon: Search },
    { href: "/create", label: "Tạo Ký Quỹ", icon: PlusSquare },
    { href: "/room/101", label: "Phòng Giao Dịch", icon: Lock, badge: lockedDealsCount > 0 ? `${lockedDealsCount}` : undefined },
    { href: "/broker", label: "Broker", icon: Landmark },
  ];

  const roleShort: Record<UserRole, string> = {
    buyer: "Bên Mua",
    seller: "Bên Bán",
    broker: "Trung Gian",
  };

  const roleAddress: Record<UserRole, string> = {
    buyer: "0x1A2b...0001",
    seller: "0x89C3...0002",
    broker: "0x30F1...889A",
  };

  return (
    <header className="sticky top-0 z-50">
      {/* ── Network status strip ──────────────────────────── */}
      <div className="bg-black/60 backdrop-blur-sm border-b border-white/[0.04] py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <AvalancheIcon className="w-3 h-3" />
              Fuji C-Chain
            </span>
            <span className="hidden md:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Subnet L1: 0đ Gas
            </span>
            <span className="hidden lg:inline">Finality: 0.8s</span>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-xs font-mono text-slate-600">
            <span>
              Block <span className="text-slate-400">#{blockNumber.toLocaleString()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Main nav ──────────────────────────────────────── */}
      <nav className="bg-[#06070A]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">

          {/* Logo + Links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-brand/15 border border-brand/25 flex items-center justify-center">
                <Shield className="w-4 h-4 text-brand" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">TrustPact</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden xl:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = link.href === "/" ? pathname === "/" : pathname?.startsWith(`/${link.href.split("/")[1]}`);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3.5 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                      isActive
                        ? "bg-white/[0.08] text-white"
                        : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                    {link.badge && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-brand/20 text-brand">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Role switcher */}
            <div className="hidden md:flex items-center bg-white/[0.03] border border-white/[0.06] rounded-xl p-1 gap-0.5">
              {(["buyer", "seller", "broker"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    role === r
                      ? "bg-white/[0.1] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {roleShort[r]}
                </button>
              ))}
            </div>

            {/* Wallet balance */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] text-sm font-mono">
              <UsdcIcon className="w-4 h-4" />
              <span className="text-white font-semibold tabular-nums">{walletBalances[role].toLocaleString()}</span>
              <span className="text-slate-500">USDC</span>
            </div>

            {/* Wallet connect */}
            <button
              onClick={connectWallet}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs font-mono text-slate-400 hover:text-white transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="hidden sm:inline">{roleAddress[role]}</span>
              <span className="sm:hidden">Ví</span>
            </button>

            {/* Mobile toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden border-t border-white/[0.06] bg-[#06070A] px-4 py-5 space-y-5 animate-fade-in">
            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between ${
                      isActive ? "bg-white/[0.08] text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </div>
                    {link.badge && (
                      <span className="px-2 py-0.5 rounded-lg text-xs font-mono bg-white/[0.06] text-slate-400">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            <div className="pt-4 border-t border-white/[0.06]">
              <span className="text-xs font-medium text-slate-500 block mb-3">Vai trò demo</span>
              <div className="grid grid-cols-3 gap-2">
                {(["buyer", "seller", "broker"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { setRole(r); setMobileMenuOpen(false); }}
                    className={`py-2.5 rounded-xl text-sm font-medium border text-center transition-all ${
                      role === r
                        ? "bg-white/[0.1] text-white border-white/[0.12]"
                        : "bg-white/[0.02] border-white/[0.06] text-slate-500"
                    }`}
                  >
                    {roleShort[r]}
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
