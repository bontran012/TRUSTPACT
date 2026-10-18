"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Wallet, CheckCircle2, UserCheck } from "lucide-react";
import { AvalancheIcon } from "./CryptoIcons";
import { useStore, UserRole } from "../lib/store";

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<string[]>;
  on: (event: string, callback: (...args: unknown[]) => void) => void;
}

export default function Navbar() {
  const [account, setAccount] = useState<string | null>(null);
  const pathname = usePathname();
  const { role, setRole } = useStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const eth = (window as unknown as { ethereum?: EthereumProvider }).ethereum;
      if (eth) {
        eth.request({ method: "eth_accounts" })
          .then((accounts: string[]) => {
            if (accounts.length > 0) setAccount(accounts[0]);
          })
          .catch(console.error);

        eth.on("accountsChanged", (...args: unknown[]) => {
          const accounts = args[0] as string[];
          setAccount(accounts && accounts.length > 0 ? accounts[0] : null);
        });
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
        } catch (err) {
          console.error("Wallet connection failed", err);
        }
      } else {
        setAccount("0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001");
      }
    }
  };

  const navLinks = [
    { href: "/", label: "Trang Chủ & Mô Phỏng" },
    { href: "/radar", label: "Scam Radar (0đ Gas)" },
    { href: "/create", label: "Tạo Hợp Đồng Ký Quỹ" },
    { href: "/room/101", label: "Phòng Đối Soát #101" },
    { href: "/broker", label: "Cọc Aave V3 & Lợi Tức" },
  ];

  const roleLabels: Record<UserRole, { label: string; shortLabel: string; chipStyle: string }> = {
    buyer: { 
      label: "Bên Mua (Minh)", 
      shortLabel: "Bên Mua", 
      chipStyle: "text-blue-400 bg-blue-500/15 border-blue-500/40 font-medium" 
    },
    seller: { 
      label: "Bên Bán (Hùng)", 
      shortLabel: "Bên Bán", 
      chipStyle: "text-emerald-400 bg-emerald-500/15 border-emerald-500/40 font-medium" 
    },
    broker: { 
      label: "Trung Gian (Nam)", 
      shortLabel: "Trung Gian", 
      chipStyle: "text-amber-400 bg-amber-500/15 border-amber-500/40 font-medium" 
    },
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Top Protocol Telemetry Ticker */}
      <div className="bg-[#080a0f]/90 border-b border-white/[0.06] py-1.5 px-4 text-[11px] text-zinc-400 backdrop-blur-md">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 text-zinc-300 font-medium">
              <AvalancheIcon className="w-3.5 h-3.5" />
              <span>Avalanche Fuji C-Chain (43113)</span>
            </span>
            <span className="hidden sm:inline text-zinc-700">•</span>
            <span className="hidden sm:flex items-center space-x-1 text-emerald-400 font-mono">
              <span>Aave V3 APY: 5.20%</span>
            </span>
            <span className="hidden md:inline text-zinc-700">•</span>
            <span className="hidden md:inline text-zinc-400 font-mono">
              Snowman 0.8s Finality
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] font-mono text-zinc-400">
            <span>UniversalEscrow.sol v2.4</span>
            <span className="text-zinc-700">•</span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Mạng Lưới Hoạt Động</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="bg-[#0b0e14]/90 border-b border-white/[0.08] h-14 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Shield className="w-4 h-4" />
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base text-white tracking-tight">TrustPact</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  ESCROW
                </span>
              </div>
            </Link>

            {/* Nav Links */}
            <div className="hidden lg:flex items-center space-x-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                      isActive
                        ? "text-white bg-white/10 font-medium"
                        : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Status, Role Switcher & Wallet */}
          <div className="flex items-center space-x-2.5 text-xs">
            
            {/* Demo Persona Switcher */}
            <div className="flex items-center space-x-1 bg-white/[0.03] border border-white/10 rounded-xl p-0.5">
              {(["buyer", "seller", "broker"] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] transition-all ${
                    role === r
                      ? roleLabels[r].chipStyle + " border shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {roleLabels[r].shortLabel}
                </button>
              ))}
            </div>

            {/* Wallet Action Button */}
            {account ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-zinc-200 font-mono text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{account.slice(0, 6)}...{account.slice(-4)}</span>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white text-slate-900 hover:bg-slate-200 font-semibold text-xs transition-all shadow-sm"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Kết Nối Ví</span>
              </button>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
