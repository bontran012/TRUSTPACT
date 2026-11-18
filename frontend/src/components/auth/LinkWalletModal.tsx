"use client";

import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import {
  X,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";

export function LinkWalletModal() {
  const {
    isLinkWalletModalOpen,
    setIsLinkWalletModalOpen,
    currentUser,
    linkWalletToUser,
  } = useAuth();
  const { t } = useLanguage();

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const [feedback, setFeedback] = useState<{ type: "idle" | "success" | "error"; msg: string }>({
    type: "idle",
    msg: "",
  });

  if (!isLinkWalletModalOpen) return null;

  const handleConnectWallet = (connector: any) => {
    setFeedback({ type: "idle", msg: "" });
    try {
      connect({ connector });
    } catch (err: any) {
      setFeedback({ type: "error", msg: err?.message || "Không thể kết nối ví" });
    }
  };

  const handleConfirmLink = () => {
    if (!address) {
      setFeedback({ type: "error", msg: "Chưa nhận diện được địa chỉ ví" });
      return;
    }
    const res = linkWalletToUser(address);
    if (res.success) {
      setFeedback({ type: "success", msg: "Đã liên kết ví Web3 thành công" });
      setTimeout(() => {
        setIsLinkWalletModalOpen(false);
        setFeedback({ type: "idle", msg: "" });
      }, 1000);
    } else {
      setFeedback({ type: "error", msg: res.error || "Liên kết ví không thành công" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-700/90 bg-[#111827] shadow-2xl p-6 text-slate-100">
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
          <div className="w-9 h-9 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <LinkIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              {t("Liên kết ví thanh toán Web3", "Link Web3 Payment Wallet")}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentUser?.email
                ? t(`Tài khoản: ${currentUser.email}`, `Account: ${currentUser.email}`)
                : t("Tài khoản hiện tại", "Current Account")}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4 text-xs">
          <p className="text-slate-400 leading-relaxed">
            {t(
              "Liên kết ví trên mạng Avalanche Fuji để thực hiện hợp đồng ký quỹ, thế chấp GDTG và nhận giải ngân.",
              "Link an Avalanche Fuji wallet to fund escrows, stake collateral, and receive settlements."
            )}
          </p>

          {/* Current Link Status */}
          {currentUser?.isWalletLinked && currentUser?.walletAddress ? (
            <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t("Ví đang liên kết", "Currently Linked Wallet")}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                  Avalanche Fuji
                </span>
              </div>
              <div className="font-mono text-slate-200 text-xs break-all bg-[#111827] p-2.5 rounded-lg border border-slate-800">
                {currentUser.walletAddress}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center gap-2 text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{t("Tài khoản chưa liên kết ví Web3.", "No Web3 wallet linked.")}</span>
            </div>
          )}

          {/* Wallet Detect & Action */}
          {isConnected && address ? (
            <div className="p-3.5 rounded-lg border border-slate-700 bg-[#0B0F17] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-blue-400" />
                  <span>{t("Ví đang kết nối", "Connected Wallet")}</span>
                </span>
                <button
                  type="button"
                  onClick={() => disconnect()}
                  className="text-[11px] text-red-400 hover:text-red-300 font-medium"
                >
                  {t("Ngắt kết nối", "Disconnect")}
                </button>
              </div>

              <div className="font-mono text-slate-100 text-xs break-all bg-[#111827] p-2.5 rounded-lg border border-slate-800">
                {address}
              </div>

              <button
                type="button"
                onClick={handleConfirmLink}
                className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold border border-blue-500/30 shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {currentUser?.isWalletLinked
                    ? t("Cập nhật sang địa chỉ ví này", "Update Linked Wallet")
                    : t("Xác nhận liên kết ví", "Confirm Wallet Link")}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <span className="text-slate-300 font-medium block">
                {t("Chọn ứng dụng ví để kết nối:", "Select wallet provider:")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {connectors && connectors.length > 0 ? (
                  connectors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleConnectWallet(c)}
                      className="p-3 rounded-lg bg-[#0B0F17] hover:bg-slate-800/80 border border-slate-700 text-slate-100 font-medium text-xs flex items-center gap-2.5 transition-colors"
                    >
                      <Wallet className="w-4 h-4 text-blue-400" />
                      <span>{c.name}</span>
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConnectWallet(undefined)}
                    className="p-3 rounded-lg bg-[#0B0F17] hover:bg-slate-800/80 border border-slate-700 text-slate-100 font-medium text-xs flex items-center gap-2.5 transition-colors col-span-2"
                  >
                    <Wallet className="w-4 h-4 text-blue-400" />
                    <span>MetaMask / Core Wallet</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {feedback.msg && (
            <div
              className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
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
