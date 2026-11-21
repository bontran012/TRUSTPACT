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
  Info,
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

  const handleConnectByWalletId = (
    walletId: "metaMask" | "core" | "rabby" | "phantom" | "injected"
  ) => {
    setFeedback({ type: "idle", msg: "" });

    if (typeof window !== "undefined") {
      const w = window as any;

      if (walletId === "metaMask") {
        const hasMetaMask =
          w.ethereum?.providers?.some((p: any) => p.isMetaMask && !p.isPhantom) ||
          (w.ethereum?.isMetaMask && !w.ethereum?.isPhantom);

        if (!hasMetaMask) {
          if (w.phantom?.ethereum || w.ethereum?.isPhantom) {
            setFeedback({
              type: "error",
              msg: "Trình duyệt của bạn đang cài ví Phantom làm mặc định và chưa bật tiện ích MetaMask. Vui lòng bấm chọn 'Ví Phantom' bên dưới hoặc bật MetaMask trong quản lý tiện ích mở rộng.",
            });
          } else {
            setFeedback({
              type: "error",
              msg: "Không tìm thấy tiện ích MetaMask trên trình duyệt. Vui lòng cài đặt MetaMask hoặc chọn ví khác.",
            });
          }
          return;
        }
      }

      if (walletId === "core") {
        const hasCore =
          w.avalanche ||
          w.ethereum?.providers?.some((p: any) => p.isAvalanche) ||
          w.ethereum?.isAvalanche;

        if (!hasCore) {
          setFeedback({
            type: "error",
            msg: "Không tìm thấy ví Avalanche Core Wallet. Vui lòng cài tiện ích Core Wallet hoặc chọn ví khác.",
          });
          return;
        }
      }

      if (walletId === "rabby") {
        const hasRabby =
          w.rabby ||
          w.ethereum?.providers?.some((p: any) => p.isRabby) ||
          w.ethereum?.isRabby;

        if (!hasRabby) {
          setFeedback({
            type: "error",
            msg: "Không tìm thấy ví Rabby trên trình duyệt. Vui lòng cài tiện ích Rabby Wallet hoặc chọn ví khác.",
          });
          return;
        }
      }

      if (walletId === "phantom") {
        const hasPhantom =
          w.phantom?.ethereum ||
          w.ethereum?.providers?.some((p: any) => p.isPhantom) ||
          w.ethereum?.isPhantom;

        if (!hasPhantom) {
          setFeedback({
            type: "error",
            msg: "Không tìm thấy tiện ích ví Phantom trên trình duyệt của bạn.",
          });
          return;
        }
      }
    }

    const targetConnector =
      connectors.find((c) => c.id === walletId) ||
      connectors.find((c) => c.id === "injected") ||
      connectors[0];

    if (!targetConnector) {
      setFeedback({
        type: "error",
        msg: "Không tìm thấy trình kết nối ví Web3 phù hợp trên trình duyệt.",
      });
      return;
    }

    try {
      connect({ connector: targetConnector });
    } catch (err: any) {
      setFeedback({
        type: "error",
        msg: err?.message || "Không thể mở kết nối ví Web3",
      });
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
                {t("Chọn ví Web3 của bạn để kết nối:", "Select your Web3 wallet:")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* MetaMask */}
                <button
                  type="button"
                  onClick={() => handleConnectByWalletId("metaMask")}
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

                {/* Core Wallet */}
                <button
                  type="button"
                  onClick={() => handleConnectByWalletId("core")}
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

                {/* Phantom Wallet */}
                <button
                  type="button"
                  onClick={() => handleConnectByWalletId("phantom")}
                  className="p-3 rounded-xl bg-[#0B0F17] hover:bg-slate-800/80 border border-purple-500/30 hover:border-purple-500/60 text-left transition-all group flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 font-bold text-xs group-hover:scale-105 transition-transform">
                    👻
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100 text-xs block group-hover:text-purple-400 transition-colors">
                      Phantom Wallet
                    </span>
                    <span className="text-[11px] text-purple-300/80 block mt-0.5">
                      Ví đa chuỗi (Hỗ trợ EVM)
                    </span>
                  </div>
                </button>

                {/* Rabby Wallet */}
                <button
                  type="button"
                  onClick={() => handleConnectByWalletId("rabby")}
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

                {/* Universal Injected / Browser Wallet */}
                <button
                  type="button"
                  onClick={() => handleConnectByWalletId("injected")}
                  className="p-3 rounded-xl bg-[#0B0F17] hover:bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/50 text-left transition-all group flex items-start gap-3 sm:col-span-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 font-bold text-xs group-hover:scale-105 transition-transform">
                    🛡️
                  </div>
                  <div>
                    <span className="font-semibold text-slate-100 text-xs block group-hover:text-emerald-400 transition-colors">
                      Trình duyệt Web3 mặc định
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Tự động kết nối ví đang ưu tiên trên trình duyệt (EIP-1193)
                    </span>
                  </div>
                </button>
              </div>

              <div className="mt-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>
                  Nếu bạn cài đặt nhiều ví (như Phantom và MetaMask cùng lúc), bạn có thể chọn đích danh ví cần dùng ở trên hoặc tùy chỉnh ví mặc định trong cài đặt tiện ích mở rộng của trình duyệt.
                </span>
              </div>
            </div>
          )}

          {feedback.msg && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-300"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{feedback.msg}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
