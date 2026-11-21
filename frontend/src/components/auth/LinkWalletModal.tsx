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
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { useAuth, PRESET_ACCOUNTS } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { shortenAddress } from "@/src/lib/contracts";

export function LinkWalletModal() {
  const {
    isLinkWalletModalOpen,
    setIsLinkWalletModalOpen,
    currentUser,
    loginWithPreset,
    loginWithWallet,
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
          msg: "Không tìm thấy trình duyệt Web3 (MetaMask/Core Wallet). Vui lòng cài đặt tiện ích mở rộng.",
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

  const handleSelectPreset = (presetId: string) => {
    loginWithPreset(presetId);
    setFeedback({ type: "success", msg: "Đã chuyển đổi tài khoản thành công" });
    setTimeout(() => {
      setIsLinkWalletModalOpen(false);
      setFeedback({ type: "idle", msg: "" });
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/90 bg-[#111827] shadow-2xl p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
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
                Avalanche Fuji #43113
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t(
                "Định danh phi tập trung & bảo mật 100% bằng ví Web3 trên mạng Avalanche Fuji.",
                "100% decentralized identity and escrow security on Avalanche Fuji."
              )}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-5 text-xs">
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
                <span className="text-slate-500">Mạng: Avalanche Fuji Testnet</span>
              </div>
            </div>
          ) : (
            /* Connect Wallet Providers List */
            <div className="space-y-2.5">
              <span className="text-slate-300 font-medium block text-xs">
                {t("Chọn ví Web3 để đăng nhập & giao dịch:", "Select wallet to connect:")}
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
                      Ví EVM phổ biến trên Chrome / Brave
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
                      Ví Avalanche Ecosystem chính thức
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
                      Rabby / Injected
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Trình duyệt Web3 EIP-1193
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
                      Coinbase Wallet
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Tiện ích ví EVM Web3
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Preset Demo Profiles for Judges */}
          <div className="pt-2 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{t("Tài khoản mẫu thử nghiệm (Dành cho Ban Giám Khảo):", "Preset Judge Evaluation Profiles:")}</span>
              </span>
              <span className="text-[10px] text-amber-400/90 font-mono">1-Click Test</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {t(
                "Không cần kết nối ví thực tế: BGK có thể nhấp chọn 1 trong 4 vai trò để kiểm thử toàn diện tính năng ký quỹ, đối soát, thế chấp Aave V3 và phân xử khiếu nại.",
                "Judges can click any profile below to evaluate escrow, radar, Aave staking, and dispute workflows without installing a wallet."
              )}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESET_ACCOUNTS.filter(p => ["TP-1001", "TP-2002", "TP-3003", "TP-9999"].includes(p.id)).map((p) => {
                const isCurrent = currentUser?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={`p-2.5 rounded-xl text-left border transition-all ${
                      isCurrent
                        ? "bg-blue-600/15 border-blue-500/50 text-white"
                        : "bg-[#0B0F17] hover:bg-slate-800/80 border-slate-800 hover:border-slate-700 text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs truncate max-w-[150px]">{p.name}</span>
                      <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {p.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 font-mono">
                      <span>{p.walletAddress ? shortenAddress(p.walletAddress) : ""}</span>
                      <span className="text-emerald-400 font-medium">{p.balanceUsdc.toLocaleString()} USDC</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

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
