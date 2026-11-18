"use client";

import React from "react";
import { Loader2, CheckCircle2, AlertTriangle, ExternalLink, X } from "lucide-react";

export interface TxStatus {
  step: "idle" | "awaiting_signature" | "confirming" | "success" | "error";
  txHash?: string;
  errorMessage?: string;
  actionTitle?: string;
}

interface TransactionFeedbackProps {
  status: TxStatus;
  onClose?: () => void;
}

export function TransactionFeedback({ status, onClose }: TransactionFeedbackProps) {
  if (status.step === "idle") return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-md w-full animate-fade-in">
      <div className="rounded-2xl p-5 shadow-2xl flex flex-col gap-3 bg-[#0F1523]/95 backdrop-blur-xl border border-white/[0.1]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {status.step === "awaiting_signature" && (
              <div className="w-8 h-8 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              </div>
            )}
            {status.step === "confirming" && (
              <div className="w-8 h-8 rounded-xl bg-brand/10 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-brand animate-spin" />
              </div>
            )}
            {status.step === "success" && (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            )}
            {status.step === "error" && (
              <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
            )}

            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {status.actionTitle || "Giao Dịch Smart Contract"}
              </span>
              <span className="text-sm font-medium text-white">
                {status.step === "awaiting_signature" && "Đang chờ ký xác nhận trên ví..."}
                {status.step === "confirming" && "Đang xác thực trên Avalanche Fuji..."}
                {status.step === "success" && "Hoàn tất On-Chain thành công!"}
                {status.step === "error" && "Giao dịch không thành công"}
              </span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/[0.06]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {status.txHash && (
          <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">Mã Tx Hash:</span>
            <a
              href={`https://testnet.snowtrace.io/tx/${status.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline inline-flex items-center gap-1 font-semibold"
            >
              <span>{status.txHash.slice(0, 10)}...{status.txHash.slice(-8)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {status.errorMessage && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 font-mono">
            {status.errorMessage}
          </div>
        )}

        {/* 3-Stage Progress Bar */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          <div
            className={`h-1 rounded-full transition-colors ${
              status.step === "awaiting_signature" || status.step === "confirming" || status.step === "success"
                ? "bg-brand"
                : status.step === "error"
                ? "bg-red-500"
                : "bg-white/[0.08]"
            }`}
          />
          <div
            className={`h-1 rounded-full transition-colors ${
              status.step === "confirming" || status.step === "success"
                ? "bg-brand"
                : "bg-white/[0.08]"
            }`}
          />
          <div
            className={`h-1 rounded-full transition-colors ${
              status.step === "success" ? "bg-emerald-400" : "bg-white/[0.08]"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
