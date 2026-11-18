"use client";

import React, { useState } from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import {
  X,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Sparkles,
  ShieldCheck,
  Unlink,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { shortenAddress } from "@/src/lib/contracts";

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
      setFeedback({ type: "success", msg: "Liên kết ví Web3 thành công!" });
      setTimeout(() => {
        setIsLinkWalletModalOpen(false);
        setFeedback({ type: "idle", msg: "" });
      }, 1200);
    } else {
      setFeedback({ type: "error", msg: res.error || "Liên kết ví thất bại" });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#061024]/75 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg rounded-[28px] border border-white/20 bg-[#0F2147]/95 backdrop-blur-2xl shadow-2xl p-6 sm:p-7 text-slate-100">
        {/* Close Button */}
        <button
          onClick={() => {
            setIsLinkWalletModalOpen(false);
            setFeedback({ type: "idle", msg: "" });
          }}
          className="absolute right-5 top-5 p-2 rounded-full text-sky-200/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-white/12">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <LinkIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {t("Liên Kết Ví Web3 Thanh Toán", "Link Web3 Payment Wallet")}
            </h2>
            <p className="text-xs text-sky-100/75 mt-0.5">
              {currentUser?.email
                ? t(`Tài khoản chính: ${currentUser.email}`, `Primary Account: ${currentUser.email}`)
                : t("Tài khoản của bạn", "Your Account")}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4 text-xs">
          {/* Explanation Banner */}
          <div className="p-4 rounded-2xl bg-white/[0.06] border border-white/12 space-y-1.5">
            <span className="font-bold text-white text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{t("Ví Web3 Chỉ Cần Khi Phát Sinh Giao Dịch", "Wallet Only Needed When Transacting")}</span>
            </span>
            <p className="text-sky-100/80 leading-relaxed text-[11px]">
              {t(
                "Tài khoản của bạn sử dụng Gmail làm định danh chính. Ví Web3 (MetaMask/Core trên Avalanche Fuji) dùng để nạp cọc, ký quỹ và nhận giải ngân thông qua Smart Contract.",
                "Your account is primarily identified by Gmail. A Web3 wallet is used for depositing escrow, staking, and receiving payouts."
              )}
            </p>
          </div>

          {/* Current Link Status */}
          {currentUser?.isWalletLinked && currentUser?.walletAddress ? (
            <div className="p-4 rounded-2xl bg-emerald-500/[0.08] border border-emerald-400/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t("Đã Liên Kết Ví Thành Công", "Wallet Successfully Linked")}</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200">
                  Avalanche Fuji
                </span>
              </div>
              <div className="font-mono text-white text-xs break-all bg-black/40 p-2.5 rounded-xl border border-white/10">
                {currentUser.walletAddress}
              </div>
              <p className="text-[11px] text-sky-100/70">
                {t(
                  "Bạn có thể thay đổi ví liên kết bất kỳ lúc nào bằng cách kết nối ví mới bên dưới.",
                  "You can update your linked wallet anytime by connecting a different wallet below."
                )}
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/25 flex items-center gap-2.5 text-amber-200 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-300" />
              <span>{t("Tài khoản chưa có ví Web3 liên kết.", "No Web3 wallet currently linked.")}</span>
            </div>
          )}

          {/* Wallet Detect & Action */}
          {isConnected && address ? (
            <div className="p-4 rounded-2xl border border-sky-400/30 bg-sky-500/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sky-200 font-bold text-xs flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-sky-300" />
                  <span>{t("Ví Web3 Đang Kết Nối:", "Detected Active Wallet:")}</span>
                </span>
                <button
                  type="button"
                  onClick={() => disconnect()}
                  className="text-[11px] text-rose-300 hover:text-rose-200 underline"
                >
                  {t("Ngắt kết nối", "Disconnect")}
                </button>
              </div>

              <div className="font-mono text-white text-xs break-all bg-black/40 p-2.5 rounded-xl border border-white/10">
                {address}
              </div>

              <button
                type="button"
                onClick={handleConfirmLink}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:brightness-110 text-slate-950 text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {currentUser?.isWalletLinked
                    ? t("Cập Nhật Liên Kết Sang Ví Này", "Update Link to This Wallet")
                    : t("Xác Nhận Liên Kết Ví Này Với Gmail", "Confirm Link This Wallet to Gmail")}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <span className="text-sky-100 font-semibold block text-xs">
                {t("Chọn ví Web3 để kết nối & liên kết:", "Select wallet to connect & link:")}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {connectors && connectors.length > 0 ? (
                  connectors.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleConnectWallet(c)}
                      className="p-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-semibold text-xs flex items-center gap-2.5 transition-colors"
                    >
                      <Wallet className="w-4 h-4 text-sky-300" />
                      <span>{c.name}</span>
                    </button>
                  ))
                ) : (
                  <button
                    type="button"
                    onClick={() => handleConnectWallet(undefined)}
                    className="p-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-semibold text-xs flex items-center gap-2.5 transition-colors col-span-2"
                  >
                    <Wallet className="w-4 h-4 text-sky-300" />
                    <span>MetaMask / Core Wallet</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {feedback.msg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-500/15 border-emerald-400/30 text-emerald-300"
                  : "bg-rose-500/15 border-rose-400/30 text-rose-300"
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
