"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
  Clock,
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

function getInitials(name: string): string {
  const clean = name.split("(")[0].trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TP";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-lg rounded-xl bg-[#111827] border border-slate-700 shadow-2xl p-6 space-y-5 text-slate-100">
        {/* Header */}
        <div className="flex items-start gap-3.5 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[11px] font-semibold">
                Xác nhận On-Chain
              </span>
              <span className="text-xs font-mono text-slate-500">UniversalEscrow · Fuji</span>
            </div>
            <h2 className="text-base font-bold text-slate-100 mt-1">
              Biên nhận khởi tạo hợp đồng #{pactId}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Hợp đồng ký quỹ 3 bên đã được ghi nhận trên Avalanche Fuji C-Chain.
            </p>
          </div>
        </div>

        {/* Financial Overview Grid */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400 block mb-1">Giá trị ký quỹ</span>
            <span className="text-sm font-bold font-mono text-slate-100 tabular-nums">
              {amount} USDC
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Thực nhận Bên bán</span>
            <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
              {netSellerAmount.toFixed(2)} USDC
            </span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1">Thời hạn bàn giao</span>
            <span className="text-sm font-bold font-mono text-amber-400 tabular-nums">
              {durationHours} giờ
            </span>
          </div>
        </div>

        {/* 3 Parties Confirmation List */}
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Thông tin các bên tham gia
          </span>

          {/* Party 1: Buyer */}
          <div className="p-3 rounded-lg bg-[#0B0F17] border border-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
                {getInitials(buyerName)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-100 text-xs truncate">{buyerName}</span>
                  <span className="text-slate-500 font-mono text-xs">{shortenAddress(buyerAddress)}</span>
                </div>
                <span className="text-slate-400 text-xs block">
                  Bên mua · Đã ký quỹ {amount} USDC
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[11px] font-semibold shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              <span>Đã ký quỹ</span>
            </span>
          </div>

          {/* Party 2: Seller */}
          <div className="p-3 rounded-lg bg-[#0B0F17] border border-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
                BB
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-100 text-xs">Bên bán</span>
                  <span className="text-slate-500 font-mono text-xs">{shortenAddress(sellerAddress)}</span>
                </div>
                <span className="text-slate-400 text-xs block">
                  Đối tác nhận thanh toán và bàn giao tài sản
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-semibold shrink-0">
              <span>Đã ghi nhận</span>
            </span>
          </div>

          {/* Party 3: Broker */}
          <div className="p-3 rounded-lg bg-[#0B0F17] border border-slate-800/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
                {getInitials(brokerName)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-slate-100 text-xs truncate">
                    {brokerName.split("(")[0].trim()}
                  </span>
                  <span className="text-slate-500 font-mono text-xs">{shortenAddress(brokerAddress)}</span>
                </div>
                <span className="text-slate-400 text-xs block">
                  GDTG bảo chứng · Hạn mức thế chấp Aave V3
                </span>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/25 text-[11px] font-semibold shrink-0">
              <span>Bảo chứng</span>
            </span>
          </div>
        </div>

        {/* Tx Hash Row */}
        {txHash && (
          <div className="px-3.5 py-2.5 rounded-lg bg-[#0B0F17] border border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Mã giao dịch (TxHash)</span>
            <a
              href={`https://testnet.snowtrace.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium"
            >
              <span>{txHash.slice(0, 10)}...{txHash.slice(-8)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Footer & CTA */}
        <div className="pt-3 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Tự động chuyển đến chi tiết hợp đồng</span>
            </span>
            <span className="font-mono font-semibold text-slate-200 tabular-nums">{countdown}s</span>
          </div>

          <button
            type="button"
            onClick={onEnterRoom}
            className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 border border-blue-500/30 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span>Xem chi tiết hợp đồng #{pactId}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
