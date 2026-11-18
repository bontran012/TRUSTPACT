"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  User,
  Store,
  Scale,
  Sparkles,
} from "lucide-react";
import { shortenAddress } from "@/src/lib/contracts";

interface PactConfirmationModalProps {
  isOpen: boolean;
  pactId: string;
  buyerAddress: string;
  buyerName?: string;
  sellerAddress: string;
  brokerAddress: string;
  brokerName: string;
  amount: string;
  netSellerAmount: number;
  durationHours: number;
  txHash?: string;
  onEnterRoom: () => void;
}

export function PactConfirmationModal({
  isOpen,
  pactId,
  buyerAddress,
  buyerName = "Lê Minh Tuấn",
  sellerAddress,
  brokerAddress,
  brokerName,
  amount,
  netSellerAmount,
  durationHours,
  onEnterRoom,
}: PactConfirmationModalProps) {
  const [countdown, setCountdown] = useState<number>(3);

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      return;
    }
    if (countdown <= 0) {
      onEnterRoom();
      return;
    }
    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isOpen, countdown, onEnterRoom]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-[#0F1523] border border-white/[0.1] shadow-2xl p-6 sm:p-7 space-y-6 text-slate-100">
        {/* Header */}
        <div className="flex items-start gap-4 pb-4 border-b border-white/[0.06]">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="badge-pill bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-[10px] font-bold">
                XÁC NHẬN ON-CHAIN THÀNH CÔNG
              </span>
              <span className="text-xs font-mono text-slate-500">UniversalEscrow</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              Biên Bản Ký Quỹ &amp; Mở Phòng Giao Dịch #{pactId}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hợp đồng 3 bên đã được đối soát và kích hoạt an toàn trên Avalanche Fuji C-Chain.
            </p>
          </div>
        </div>

        {/* Financial Overview Grid */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-xl card-inner font-mono text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Giá trị ký quỹ:</span>
            <span className="text-base font-bold text-white tabular-nums">{amount} USDC</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Seller thực nhận:</span>
            <span className="text-base font-bold text-emerald-400 tabular-nums">{netSellerAmount.toFixed(2)} USDC</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Thời hạn bàn giao:</span>
            <span className="text-base font-bold text-amber-400 tabular-nums">{durationHours} Giờ</span>
          </div>
        </div>

        {/* 3 Parties Confirmation Checklist */}
        <div className="space-y-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Xác Nhận Cam Kết 3 Bên:
          </span>

          {/* Party 1: Buyer */}
          <div className="p-3.5 rounded-xl card-inner flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-brand" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{buyerName}</span>
                  <span className="text-slate-500 font-mono text-xs">({shortenAddress(buyerAddress)})</span>
                </div>
                <span className="text-slate-400 text-xs">Bên Mua • Đã ký quỹ {amount} USDC vào két</span>
              </div>
            </div>
            <div className="badge-pill bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-xs font-medium shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã Ký Quỹ</span>
            </div>
          </div>

          {/* Party 2: Seller */}
          <div className="p-3.5 rounded-xl card-inner flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Store className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">Bên Bán (Seller)</span>
                  <span className="text-slate-500 font-mono text-xs">({shortenAddress(sellerAddress)})</span>
                </div>
                <span className="text-slate-400 text-xs">Sẵn sàng tiếp nhận phòng và bàn giao tài sản</span>
              </div>
            </div>
            <div className="badge-pill bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-xs font-medium shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sẵn Sàng</span>
            </div>
          </div>

          {/* Party 3: Broker */}
          <div className="p-3.5 rounded-xl card-inner flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{brokerName}</span>
                  <span className="text-slate-500 font-mono text-xs">({shortenAddress(brokerAddress)})</span>
                </div>
                <span className="text-slate-400 text-xs">GDTG • Phong tỏa hạn mức bảo lãnh Aave V3</span>
              </div>
            </div>
            <div className="badge-pill bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 text-xs font-medium shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Bảo Lãnh 120%</span>
            </div>
          </div>
        </div>

        {/* Transition Notice & CTA Button */}
        <div className="pt-2 border-t border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand" />
              <span>Cả hai bên đã cam kết. Đang chuyển vào phòng...</span>
            </span>
            <span className="font-mono font-bold text-white">({countdown}s)</span>
          </div>

          <button
            type="button"
            onClick={onEnterRoom}
            className="w-full py-3.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand/25 active:scale-[0.99]"
          >
            <span>Vào Phòng Giao Dịch Trực Tuyến Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
