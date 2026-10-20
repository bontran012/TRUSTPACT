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
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-3 duration-200">
      <div className="panel-bg panel-border rounded-lg p-4 shadow-2xl flex flex-col gap-2.5 bg-[#101217]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {status.step === "awaiting_signature" && (
              <Loader2 className="w-4 h-4 text-[#F59E0B] animate-spin shrink-0" />
            )}
            {status.step === "confirming" && (
              <Loader2 className="w-4 h-4 text-[#E84142] animate-spin shrink-0" />
            )}
            {status.step === "success" && (
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            )}
            {status.step === "error" && (
              <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0" />
            )}

            <div className="flex flex-col">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                {status.actionTitle || "Giao Dịch Smart Contract"}
              </span>
              <span className="text-sm font-medium text-[#F1F5F9]">
                {status.step === "awaiting_signature" && "Đang chờ ký trên ví (Awaiting Wallet Signature)..."}
                {status.step === "confirming" && "Đang xác thực trên Avalanche (~0.8s Finality)..."}
                {status.step === "success" && "Hoàn tất On-Chain thành công!"}
                {status.step === "error" && "Giao dịch không thành công"}
              </span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-[#64748B] hover:text-[#F1F5F9] transition-colors p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {status.txHash && (
          <div className="pt-2 border-t border-[#1E222D] flex items-center justify-between text-xs font-mono">
            <span className="text-[#64748B]">Mã Tx Hash:</span>
            <a
              href={`https://testnet.snowtrace.io/tx/${status.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E84142] hover:underline inline-flex items-center gap-1"
            >
              <span>{status.txHash.slice(0, 10)}...{status.txHash.slice(-8)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {status.errorMessage && (
          <div className="text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-md p-2 font-mono">
            {status.errorMessage}
          </div>
        )}

        {/* Deterministic 3-Stage Progress Bar */}
        <div className="grid grid-cols-3 gap-1 pt-1">
          <div
            className={`h-1 rounded-full transition-colors ${
              status.step === "awaiting_signature" || status.step === "confirming" || status.step === "success"
                ? "bg-[#E84142]"
                : status.step === "error"
                ? "bg-[#EF4444]"
                : "bg-[#1E222D]"
            }`}
          />
          <div
            className={`h-1 rounded-full transition-colors ${
              status.step === "confirming" || status.step === "success"
                ? "bg-[#E84142]"
                : "bg-[#1E222D]"
            }`}
          />
          <div
            className={`h-1 rounded-full transition-colors ${
              status.step === "success" ? "bg-[#10B981]" : "bg-[#1E222D]"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
