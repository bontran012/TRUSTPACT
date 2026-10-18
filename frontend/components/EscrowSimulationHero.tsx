"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowRight, Lock, CheckCircle2, RefreshCw, Zap, ShieldCheck, 
  Coins, Play, ChevronRight, Layers, ShieldAlert 
} from "lucide-react";
import { AvalancheIcon, UsdcIcon, AaveIcon } from "./CryptoIcons";
import { Identicon } from "./Identicon";

export function EscrowSimulationHero() {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(2);

  return (
    <div className="relative rounded-3xl bg-gradient-to-b from-[#0e1320] to-[#0a0c14] border border-slate-700/70 p-6 sm:p-8 shadow-2xl overflow-hidden space-y-8">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Eyebrow & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 relative z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-medium text-slate-300">
          <AvalancheIcon className="w-3.5 h-3.5" />
          <span>Avalanche Custom L1 & Fuji C-Chain</span>
          <span className="text-slate-600">•</span>
          <span className="text-emerald-400 font-semibold">0.8s Finality</span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="text-slate-400">Chế độ mô phỏng:</span>
          <div className="inline-flex rounded-lg bg-slate-900 border border-slate-700 p-0.5">
            <button
              onClick={() => setActiveStep(1)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                activeStep === 1 ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              1. Nạp Quỹ
            </button>
            <button
              onClick={() => setActiveStep(2)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                activeStep === 2 ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              2. Đang Ký Quỹ & Sinh Lãi
            </button>
            <button
              onClick={() => setActiveStep(3)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                activeStep === 3 ? "bg-emerald-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              3. Quyết Toán 0.8s
            </button>
          </div>
        </div>
      </div>

      {/* Headline & Value Proposition */}
      <div className="max-w-3xl space-y-3 relative z-10">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Sàn Ký Quỹ Ba Bên Phi Tập Trung & <br className="hidden sm:inline" />
          Tối Ưu Lợi Tức Thực Với Aave V3
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-normal">
          Bảo vệ tuyệt đối mọi giao dịch chuyển nhượng tài sản số P2P. Tiền ký quỹ được điều phối sinh lãi trong Aave V3 Lending Pool, giám sát bởi Thương nhân cọc bảo chứng và giải ngân dưới 1 giây qua cơ chế đồng thuận Avalanche Snowman.
        </p>
      </div>

      {/* Interactive Visual Escrow Pipeline */}
      <div className="relative rounded-2xl bg-[#090b10] border border-slate-800 p-5 sm:p-6 shadow-inner relative z-10">
        <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider mb-4 flex items-center justify-between">
          <span>Luồng Thực Thi Hợp Đồng Thông Minh (UniversalEscrow.sol)</span>
          <span className="text-emerald-400 font-semibold flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>Mô Phỏng Trực Quan Hoạt Động Thực Tế</span>
          </span>
        </div>

        {/* 3 Interactive Nodes Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
          
          {/* Node 1: Bên Mua (Buyer) */}
          <div className={`p-4 rounded-xl border transition-all ${
            activeStep >= 1 ? "bg-slate-900/90 border-blue-500/50 shadow-md" : "bg-slate-900/40 border-slate-800"
          }`}>
            <div className="flex items-center space-x-3 mb-3">
              <Identicon address="0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001" size={36} />
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Bên Mua (Buyer)</span>
                <span className="text-xs font-bold text-white font-mono">0x1A2b...0001</span>
              </div>
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Số tiền nạp:</span>
                <span className="font-mono font-bold text-white">1,000 USDC</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {activeStep === 1 && "⏳ Đang gửi lệnh nạp quỹ vào smart contract"}
                {activeStep === 2 && "🔒 Quỹ đã được khóa an toàn trong kho"}
                {activeStep === 3 && "✓ Hàng đã nhận hợp lệ & hoàn tất"}
              </div>
            </div>
          </div>

          {/* Node 2: Két Sắt Ký Quỹ & Aave V3 Vault (Centerpiece) */}
          <div className={`p-4 rounded-xl border transition-all ${
            activeStep === 2
              ? "bg-gradient-to-b from-blue-950/40 to-slate-900 border-blue-500/60 shadow-lg shadow-blue-950/40"
              : "bg-slate-900/60 border-slate-800"
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <AaveIcon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold block">Kho Ký Quỹ Thông Minh</span>
                  <span className="text-xs font-bold text-white">UniversalEscrow.sol</span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono">
                +5.20% APY
              </span>
            </div>

            <div className="text-xs space-y-1.5 pt-1 border-t border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Trạng thái quỹ:</span>
                <span className="font-semibold text-emerald-400">
                  {activeStep === 1 ? "Khởi tạo" : activeStep === 2 ? "Sinh Lãi aUSDC" : "Giải ngân thành công"}
                </span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Lợi tức tích lũy:</span>
                <span className="text-emerald-300 font-bold">+0.0428 USDC</span>
              </div>
              <div className="text-[10px] text-slate-500 pt-0.5">
                Bảo chứng bởi GDTG cọc Aave (120% Quota)
              </div>
            </div>
          </div>

          {/* Node 3: Bên Bán (Seller) */}
          <div className={`p-4 rounded-xl border transition-all ${
            activeStep === 3 ? "bg-slate-900/90 border-emerald-500/50 shadow-md" : "bg-slate-900/40 border-slate-800"
          }`}>
            <div className="flex items-center space-x-3 mb-3">
              <Identicon address="0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002" size={36} />
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Bên Bán (Seller)</span>
                <span className="text-xs font-bold text-white font-mono">0x89C3...0002</span>
              </div>
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Thực nhận:</span>
                <span className="font-mono font-bold text-emerald-400">982 USDC</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {activeStep === 1 && "Chờ người mua phong tỏa tiền vào két"}
                {activeStep === 2 && "Đang bàn giao quyền sở hữu & đối soát"}
                {activeStep === 3 && "✓ Tiền về ví ngay lập tức (0.8s)"}
              </div>
            </div>
          </div>

        </div>

        {/* Action button inside Hero */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Cơ chế Slashing: Sàn tự động trích cọc bồi thường 100% nếu phát hiện trung gian thông đồng gian lận.</span>
          </div>

          <div className="flex items-center space-x-2.5 w-full sm:w-auto">
            <Link
              href="/create"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition-colors"
            >
              <span>Mở Phòng Ký Quỹ Mới</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4 Protocol Stat Metrics (TVL, Escrows, Yield, Scam Blocked) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Tổng Giá Trị Đảm Bảo (TVL)</span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            $1,248,500 <span className="text-xs font-normal text-slate-400">USDC</span>
          </div>
          <span className="text-[10px] text-emerald-400 block mt-0.5">↑ +14.2% tuần này</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] text-slate-400 block font-medium">Kèo Ký Quỹ Đã Xử Lý</span>
          <div className="text-xl font-bold font-mono text-white mt-1">
            1,420 <span className="text-xs font-normal text-slate-400">Hợp đồng</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Tỷ lệ thành công 99.8%</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] text-emerald-400 block font-medium">Lợi Tức Aave Đã Chia Sẻ</span>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
            +$18,642 <span className="text-xs font-normal text-emerald-300">USDC</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Tỷ lệ chia sẻ 80/20</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
          <span className="text-[11px] text-rose-400 block font-medium">Lừa Đảo Bị Chặn On-Chain</span>
          <div className="text-xl font-bold font-mono text-rose-400 mt-1">
            328 <span className="text-xs font-normal text-rose-300">Vụ</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-0.5">Subnet L1 Gas 0đ</span>
        </div>
      </div>
    </div>
  );
}
