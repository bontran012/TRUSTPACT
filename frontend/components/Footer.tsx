"use client";
import React from "react";
import Link from "next/link";
import { Shield, ExternalLink } from "lucide-react";
import { AvalancheIcon, AaveIcon, UsdcIcon } from "./CryptoIcons";
import { CONTRACT_ADDRESSES } from "../lib/contracts";
import { AddressCopy } from "./AddressCopy";
export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.06] bg-[#040508]/95 backdrop-blur-xl mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand */}
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand/15 border border-brand/25 flex items-center justify-center">
                <Shield className="w-5 h-5 text-brand" />
              </div>
              <div>
                <span className="font-bold text-lg text-white tracking-tight">
                  TrustPact Protocol
                </span>
                <span className="block text-xs text-slate-500">
                  Avalanche UniHack 2026 · SocialFi & Real-Yield Escrow
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              Nền tảng ký quỹ giao dịch P2P 3 bên kết hợp bảo chứng tài sản sinh lời thực trên Aave V3, định danh uy tín Soulbound Token và Sổ đen phòng chống gian lận trên Avalanche.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400">
                <AvalancheIcon className="w-3.5 h-3.5" />
                Fuji & Custom L1
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-emerald-400">
                <AaveIcon className="w-3.5 h-3.5" />
                Aave V3
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-blue-400">
                <UsdcIcon className="w-3.5 h-3.5" />
                USDC
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-sm font-semibold text-white">Hệ Sinh Thái</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><Link href="/" className="hover:text-white transition-colors">Cổng Tra Cứu & Ký Quỹ</Link></li>
              <li><Link href="/radar" className="hover:text-white transition-colors">Scam Radar (Custom L1)</Link></li>
              <li><Link href="/create" className="hover:text-white transition-colors">Tạo Hợp Đồng Ký Quỹ</Link></li>
              <li><Link href="/room/101" className="hover:text-white transition-colors">Phòng Đối Soát & Giải Ngân</Link></li>
              <li><Link href="/broker" className="hover:text-white transition-colors">Quản Lý Cọc Aave V3</Link></li>
            </ul>
          </div>

          {/* Contracts */}
          <div className="md:col-span-4 space-y-4">
            <h4 className="text-sm font-semibold text-white">Smart Contracts</h4>
            <div className="space-y-2.5">
              {[
                { label: "UniversalEscrow", addr: CONTRACT_ADDRESSES.universalEscrow },
                { label: "StakedBrokerRegistry", addr: CONTRACT_ADDRESSES.stakedBrokerRegistry },
                { label: "TrustPassportSBT", addr: CONTRACT_ADDRESSES.trustPassportSBT },
                { label: "ScamRegistryL1", addr: CONTRACT_ADDRESSES.scamRegistryL1 },
              ].map((c) => (
                <div key={c.label} className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                  <span className="text-slate-400 text-xs">{c.label}</span>
                  <AddressCopy address={c.addr} truncateLength={4} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <span>© 2026 TrustPact Protocol · Avalanche Fuji & Custom L1</span>
          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="text-emerald-400">● Tests Passing</span>
            <span className="text-slate-600">·</span>
            <span>x402 Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
