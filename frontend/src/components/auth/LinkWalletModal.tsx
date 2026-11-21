"use client";

import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import {
  X,
  Wallet,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";

export function LinkWalletModal() {
  const {
    isLinkWalletModalOpen,
    setIsLinkWalletModalOpen,
    logout,
  } = useAuth();
  const { t } = useLanguage();

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "idle" | "success" | "error"; msg: string }>({
    type: "idle",
    msg: "",
  });

  if (!isLinkWalletModalOpen) return null;

  const handleConnectWallet = (connector?: any) => {
    setFeedback({ type: "idle", msg: "" });
    try {
      if (connector) {
        connect({ connector });
      } else if (connectors && connectors.length > 0) {
        connect({ connector: connectors[0] });
      } else {
        setFeedback({
          type: "error",
          msg: "Không tìm thấy tiện ích mở rộng ví Web3 (MetaMask/Core Wallet). Vui lòng cài đặt để tiếp tục.",
        });
      }
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Không thể kết nối ví Web3" });
    }
  };

  const handleCopy = (text: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-700/90 bg-[#111827] shadow-2xl p-6 text-slate-100">
        {/* Close Button */}
        <button
          onClick={() => {
            setIsLinkWalletModalOpen(false);
            setFeedback({ type: "idle", msg: "" });
          }}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-100">
                {t("Kết nối ví Web3", "Connect Web3 Wallet")}
              </h2>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/25">
                Avalanche Fuji
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t(
                "Định danh phi tập trung & bảo mật hợp đồng thông minh trên mạng Avalanche Fuji.",
                "Decentralized identity and smart contract security on Avalanche Fuji."
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4 text-xs">
          {/* Active Connected State */}
          {isConnected && address ? (
            <div className="p-4 rounded-xl border border-emerald-500/30 bg-[#0B0F17] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t("Ví Web3 đang kết nối", "Connected Web3 Wallet")}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    disconnect();
                    logout();
                  }}
                  className="text-[11px] text-red-400 hover:text-red-300 font-medium transition-colors"
                >
                  {t("Ngắt kết nối", "Disconnect")}
                </button>
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#111827] border border-slate-800 font-mono text-slate-200">
                <span className="break-all">{address}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(address)}
                  className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors shrink-0"
                  title="Sao chép địa chỉ ví"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-slate-400">
                <a
                  href={`https://testnet.snowtrace.io/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 transition-colors"
                >
                  <span>Xem trên Snowtrace Fuji</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="text-slate-500 font-mono">Chain ID: 43113</span>
              </div>
            </div>
          ) : (
            /* Connect Wallet Providers List */
            <div className="space-y-2.5">
              <span className="text-slate-300 font-medium block text-xs">
                {t("Chọn ví Web3 để kết nối:", "Select wallet to connect:")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleConnectWallet(connectors?.[0])}
                  className="p-3 rounded-xl bg-[#0B0F17] hover:bg-slate-800/80 border border-slate-700/80 hover:border-blue-500/50 text-left transition-all group flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 font-bold text-xs group-hover:scale-105 transition-transform">
                    🦊
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100 text-xs block group-hover:text-blue-400 transition-colors">
                      MetaMask
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Ví EVM phổ biến
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleConnectWallet(connectors?.[0])}
                  className="p-3 rounded-xl bg-[#0B0F17] hover:bg-slate-800/80 border border-slate-700/80 hover:border-red-500/50 text-left transition-all group flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0 font-bold text-xs group-hover:scale-105 transition-transform">
                    🔺
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100 text-xs block group-hover:text-red-400 transition-colors">
                      Core Wallet
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Ví chính thức Avalanche
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleConnectWallet(connectors?.[0])}
                  className="p-3 rounded-xl bg-[#0B0F17] hover:bg-slate-800/80 border border-slate-700/80 hover:border-blue-500/50 text-left transition-all group flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 font-bold text-xs group-hover:scale-105 transition-transform">
                    ⚡
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100 text-xs block group-hover:text-blue-400 transition-colors">
                      Rabby Wallet
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Ví bảo mật Web3
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleConnectWallet(connectors?.[0])}
                  className="p-3 rounded-xl bg-[#0B0F17] hover:bg-slate-800/80 border border-slate-700/80 hover:border-blue-500/50 text-left transition-all group flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs group-hover:scale-105 transition-transform">
                    🛡️
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100 text-xs block group-hover:text-emerald-400 transition-colors">
                      Trình duyệt Web3
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Tiêu chuẩn Injected EIP-1193
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {feedback.msg && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{feedback.msg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
