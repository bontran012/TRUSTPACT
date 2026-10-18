"use client";
import React from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { AvalancheIcon, AaveIcon, UsdcIcon } from "./CryptoIcons";
import { CONTRACT_ADDRESSES } from "../lib/contracts";
import { AddressCopy } from "./AddressCopy";
export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/[0.08] bg-[#030509]/95 backdrop-blur-xl mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-white tracking-tight">
                  TrustPact Protocol
                </span>
                <span className="block text-[11px] font-mono text-slate-400">
                  Avalanche UniHack 2026 • SocialFi & Real-Yield Escrow
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              Nền tảng ký quỹ giao dịch P2P 3 bên kết hợp bảo chứng tài sản sinh lời thực trên Aave V3, định danh uy tín Soulbound Token (ERC-721) và Sổ đen phòng chống gian lận 0đ Gas trên Avalanche Custom L1 Subnet.
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.07] text-[11px] text-slate-300 font-mono">
                <AvalancheIcon className="w-3.5 h-3.5" />
                <span>Fuji 43113 & L1 99943113</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.07] text-[11px] text-emerald-400 font-mono">
                <AaveIcon className="w-3.5 h-3.5" />
                <span>Aave V3 Real-Yield</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.07] text-[11px] text-blue-400 font-mono">
                <UsdcIcon className="w-3.5 h-3.5" />
                <span>Circle Native USDC</span>
              </span>
            </div>
          </div>
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Hệ Sinh Thái Giao Thức
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  • Cổng Tra Cứu & Sổ Lệnh Ký Quỹ
                </Link>
              </li>
              <li>
                <Link href="/radar" className="hover:text-white transition-colors">
                  • Scam Radar (Avalanche Custom L1)
                </Link>
              </li>
              <li>
                <Link href="/create" className="hover:text-white transition-colors">
                  • Khởi Tạo Hợp Đồng Ký Quỹ 3 Bên
                </Link>
              </li>
              <li>
                <Link href="/room/101" className="hover:text-white transition-colors">
                  • Phòng Đối Soát & Giải Ngân 0.8s
                </Link>
              </li>
              <li>
                <Link href="/broker" className="hover:text-white transition-colors">
                  • Quản Lý Cọc Bảo Chứng Aave V3
                </Link>
              </li>
            </ul>
          </div>
          <div className="md:col-span-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Hợp Đồng Thông Minh Đã Triển Khai
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-slate-400 font-mono text-[11px]">UniversalEscrow.sol</span>
                <AddressCopy address={CONTRACT_ADDRESSES.universalEscrow} truncateLength={4} />
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-slate-400 font-mono text-[11px]">StakedBrokerRegistry</span>
                <AddressCopy address={CONTRACT_ADDRESSES.stakedBrokerRegistry} truncateLength={4} />
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-slate-400 font-mono text-[11px]">TrustPassportSBT.sol</span>
                <AddressCopy address={CONTRACT_ADDRESSES.trustPassportSBT} truncateLength={4} />
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                <span className="text-slate-400 font-mono text-[11px]">ScamRegistryL1.sol</span>
                <AddressCopy address={CONTRACT_ADDRESSES.scamRegistryL1} truncateLength={4} />
              </div>
            </div>
          </div>
        </div>
        <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 TrustPact (UyTinNet) Protocol. Xây dựng trên Avalanche Fuji & Custom L1 Subnet.
          </div>
          <div className="flex items-center space-x-4 font-mono text-[11px]">
            <span className="text-emerald-400">● 100% Foundry Tests Passing</span>
            <span>•</span>
            <span>x402 Micropayment Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
