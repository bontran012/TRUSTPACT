"use client";

import React from "react";
import { Loader2, CheckCircle2, AlertTriangle, ExternalLink, X } from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";

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
  const { t } = useLanguage();
  if (status.step === "idle") return null;

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-md w-full animate-fade-in">
      <div className="rounded-xl p-4 shadow-2xl flex flex-col gap-3 bg-[#111827] border border-slate-700/90">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {status.step === "awaiting_signature" && (
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              </div>
            )}
            {status.step === "confirming" && (
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
              </div>
            )}
            {status.step === "success" && (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
            )}
            {status.step === "error" && (
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
            )}

            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {status.actionTitle || t("Giao dịch hợp đồng thông minh", "Smart Contract Transaction")}
              </span>
              <span className="text-sm font-medium text-slate-100">
                {status.step === "awaiting_signature" && t("Đang chờ xác nhận chữ ký trên ví...", "Awaiting wallet signature...")}
                {status.step === "confirming" && t("Đang ghi nhận giao dịch trên Avalanche Fuji...", "Confirming on Avalanche Fuji...")}
                {status.step === "success" && t("Giao dịch đã xác nhận trên chuỗi", "Transaction confirmed on-chain")}
                {status.step === "error" && t("Giao dịch không thành công", "Transaction failed")}
              </span>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
              aria-label={t("Đóng", "Close")}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {status.txHash && (
          <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">{t("Mã giao dịch:", "Tx Hash:")}</span>
            <a
              href={`https://testnet.snowtrace.io/tx/${status.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1 font-medium tabular-nums"
            >
              <span>
                {status.txHash.slice(0, 10)}...{status.txHash.slice(-8)}
              </span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {status.errorMessage && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5 font-mono">
            {status.errorMessage}
          </div>
        )}

        {/* 3-Stage Progress Bar */}
        <div className="grid grid-cols-3 gap-1.5 pt-0.5">
          <div
            className={`h-1 rounded-full transition-colors ${
              status.step === "awaiting_signature" || status.step === "confirming" || status.step === "success"
                ? "bg-blue-500"
                : status.step === "error"
                ? "bg-red-500"
                : "bg-slate-800"
            }`}
          />
          <div
            className={`h-1 rounded-full transition-colors ${
              status.step === "confirming" || status.step === "success"
                ? "bg-blue-500"
                : "bg-slate-800"
            }`}
          />
          <div
            className={`h-1 rounded-full transition-colors ${
              status.step === "success" ? "bg-emerald-500" : "bg-slate-800"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
