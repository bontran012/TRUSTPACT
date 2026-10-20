"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  User,
  Store,
  Scale,
  ExternalLink,
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
  txHash,
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
    <div className="fixed inset-0 z-50 bg-[#090A0D]/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-lg bg-[#101217] border border-[#1E222D] shadow-2xl p-6 sm:p-7 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4 pb-4 border-b border-[#1E222D]">
          <div className="w-12 h-12 rounded-lg bg-[#10B981]/15 border border-[#10B981]/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#10B981]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded border border-[#10B981]/20">
                XÁC NHẬN ON-CHAIN THÀNH CÔNG
              </span>
              <span className="text-xs font-mono text-[#64748B]">UniversalEscrow</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#F1F5F9] mt-1 font-sans">
              Biên Bản Ký Quỹ &amp; Mở Phòng Giao Dịch #{pactId}
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Hợp đồng 3 bên đã được đối soát và kích hoạt an toàn trên Avalanche Fuji C-Chain.
            </p>
          </div>
        </div>

        {/* Financial Overview Grid */}
        <div className="grid grid-cols-3 gap-2.5 p-3 rounded-md bg-[#090A0D] border border-[#1E222D] font-mono text-xs">
          <div>
            <span className="text-[10px] text-[#64748B] block">Giá trị ký quỹ:</span>
            <span className="text-sm font-bold text-[#F1F5F9] tabular-nums">{amount} USDC</span>
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] block">Seller thực nhận:</span>
            <span className="text-sm font-bold text-[#10B981] tabular-nums">{netSellerAmount.toFixed(2)} USDC</span>
          </div>
          <div>
            <span className="text-[10px] text-[#64748B] block">Thời hạn bàn giao:</span>
            <span className="text-sm font-bold text-[#F59E0B] tabular-nums">{durationHours} Giờ</span>
          </div>
        </div>

        {/* 3 Parties Confirmation Checklist */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B] block font-sans">
            Xác Nhận Cam Kết 3 Bên:
          </span>

          {/* Party 1: Buyer */}
          <div className="p-3 rounded-md bg-[#161922] border border-[#1E222D] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#E84142]/10 border border-[#E84142]/20 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-[#E84142]" />
              </div>
              <div className="text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="font-sans font-bold text-[#F1F5F9]">{buyerName}</span>
                  <span className="text-[10px] text-[#64748B]">({shortenAddress(buyerAddress)})</span>
                </div>
                <span className="text-[11px] text-[#94A3B8]">Bên Mua • Đã ký quỹ {amount} USDC vào két</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded border border-[#10B981]/20 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã Ký Quỹ</span>
            </div>
          </div>

          {/* Party 2: Seller */}
          <div className="p-3 rounded-md bg-[#161922] border border-[#1E222D] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center shrink-0">
                <Store className="w-4 h-4 text-[#10B981]" />
              </div>
              <div className="text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="font-sans font-bold text-[#F1F5F9]">Bên Bán (Seller)</span>
                  <span className="text-[10px] text-[#64748B]">({shortenAddress(sellerAddress)})</span>
                </div>
                <span className="text-[11px] text-[#94A3B8]">Sẵn sàng tiếp nhận phòng và bàn giao tài sản</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded border border-[#10B981]/20 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Sẵn Sàng</span>
            </div>
          </div>

          {/* Party 3: Broker */}
          <div className="p-3 rounded-md bg-[#161922] border border-[#1E222D] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-[#F59E0B]/10 border border-[#F59E0B]/20 flex items-center justify-center shrink-0">
                <Scale className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <div className="text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="font-sans font-bold text-[#F1F5F9]">{brokerName}</span>
                  <span className="text-[10px] text-[#64748B]">({shortenAddress(brokerAddress)})</span>
                </div>
                <span className="text-[11px] text-[#94A3B8]">Trọng Tài GDTG • Đã khóa hạn mức bảo lãnh Aave V3</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-[#10B981] bg-[#10B981]/10 px-2 py-1 rounded border border-[#10B981]/20 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Bảo Lãnh 120%</span>
            </div>
          </div>
        </div>

        {/* Transition Notice & CTA Button */}
        <div className="pt-2 border-t border-[#1E222D] space-y-3">
          <div className="flex items-center justify-between text-xs text-[#94A3B8]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#E84142]" />
              <span>Cả hai bên đã xác nhận. Đang chuyển vào phòng giao dịch...</span>
            </span>
            <span className="font-mono font-bold text-[#F1F5F9]">({countdown}s)</span>
          </div>

          <button
            type="button"
            onClick={onEnterRoom}
            className="w-full py-3 px-4 rounded-md bg-[#E84142] hover:bg-[#D13637] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#E84142]/30 active:scale-[0.99]"
          >
            <span>Vào Phòng Giao Dịch Trực Tuyến Ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
