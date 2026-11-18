"use client";

import React, { useState } from "react";
import {
  X,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";

export function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    loginWithGmail,
  } = useAuth();
  const { t } = useLanguage();

  const [gmailInput, setGmailInput] = useState("");
  const [gmailNameInput, setGmailNameInput] = useState("");
  const [gmailError, setGmailError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleGmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGmailError("");

    const clean = gmailInput.trim().toLowerCase();
    if (!clean || !clean.includes("@")) {
      setGmailError(t("Vui lòng nhập địa chỉ Gmail hợp lệ (VD: user@gmail.com)", "Please enter a valid Gmail address"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = loginWithGmail(clean, gmailNameInput.trim() || undefined);
      if (res.success) {
        setIsAuthModalOpen(false);
      } else {
        setGmailError(res.error || t("Không thể đăng nhập bằng Gmail", "Failed to login with Gmail"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickGoogleClick = () => {
    const sample = gmailInput.trim() || "nguoidung@gmail.com";
    setGmailInput(sample);
    const res = loginWithGmail(sample, gmailNameInput.trim() || "Thành Viên TrustPact");
    if (res.success) {
      setIsAuthModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#061024]/75 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-md rounded-[28px] border border-white/20 bg-[#0F2147]/95 backdrop-blur-2xl shadow-2xl p-6 sm:p-7 text-slate-100">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute right-5 top-5 p-2 rounded-full text-sky-200/70 hover:text-white hover:bg-white/10 transition-colors"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-white/12">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {t("Đăng Nhập TrustPact", "Sign in to TrustPact")}
            </h2>
            <p className="text-xs text-sky-100/75 mt-0.5">
              {t(
                "Đăng nhập chính thức bằng tài khoản Gmail của bạn",
                "Sign in with your primary Gmail account"
              )}
            </p>
          </div>
        </div>

        {/* Quick Google 1-Click Button */}
        <div className="mt-5 space-y-4">
          <button
            type="button"
            onClick={handleQuickGoogleClick}
            className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-3 transition-colors shadow-lg active:scale-[0.99]"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{t("Tiếp Tục Với Tài Khoản Google", "Continue with Google Account")}</span>
          </button>

          <div className="flex items-center gap-3 my-2">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-[10px] text-sky-100/50 uppercase font-mono tracking-wider">
              {t("Hoặc nhập địa chỉ Gmail", "Or enter Gmail manually")}
            </span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          {/* Manual Email Input Form */}
          <form onSubmit={handleGmailSubmit} className="space-y-3.5">
            <div>
              <label className="text-[11px] font-semibold text-sky-100 block mb-1">
                {t("Địa Chỉ Gmail", "Gmail Address")} <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={gmailInput}
                  onChange={(e) => {
                    setGmailInput(e.target.value);
                    setGmailError("");
                  }}
                  placeholder="vi_du@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white text-xs outline-none focus:border-sky-400 font-mono transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-sky-100 block mb-1">
                {t("Họ & Tên Hiển Thị (Tùy chọn)", "Display Name (Optional)")}
              </label>
              <input
                type="text"
                value={gmailNameInput}
                onChange={(e) => setGmailNameInput(e.target.value)}
                placeholder="Lê Minh Tuấn"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.08] border border-white/[0.16] text-white text-xs outline-none focus:border-sky-400 transition-colors"
              />
            </div>

            {gmailError && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-400/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{gmailError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-500 hover:from-sky-300 hover:to-indigo-400 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/25 active:scale-[0.99]"
            >
              <Mail className="w-4 h-4" />
              <span>{t("Đăng Nhập Bằng Gmail", "Sign in with Gmail")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Post-login wallet linking note */}
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-center space-y-1">
            <p className="text-[11px] text-sky-100/70 leading-relaxed">
              {t(
                "Ví Web3 thanh toán sẽ được liên kết sau trong tài khoản của bạn khi phát sinh giao dịch ký quỹ / nạp cọc on-chain.",
                "Your Web3 payment wallet can be linked later in your profile whenever transacting."
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
