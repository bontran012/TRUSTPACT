"use client";

import React, { useState } from "react";
import {
  X,
  Mail,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
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
      setGmailError(t("Vui lòng nhập địa chỉ email hợp lệ", "Please enter a valid email address"));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = loginWithGmail(clean, gmailNameInput.trim() || undefined);
      if (res.success) {
        setIsAuthModalOpen(false);
      } else {
        setGmailError(res.error || t("Không thể xác thực tài khoản", "Authentication failed"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickGoogleClick = () => {
    const sample = gmailInput.trim() || "nguoidung@gmail.com";
    setGmailInput(sample);
    const res = loginWithGmail(sample, gmailNameInput.trim() || "Thành viên TrustPact");
    if (res.success) {
      setIsAuthModalOpen(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-xl border border-slate-700/90 bg-[#111827] shadow-2xl p-6 text-slate-100">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          title="Đóng"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100">
              {t("Đăng nhập hệ thống", "Sign in to TrustPact")}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t("Xác thực định danh tài khoản qua Google", "Authenticate with your Google account")}
            </p>
          </div>
        </div>

        {/* Auth Actions */}
        <div className="mt-5 space-y-4">
          <button
            type="button"
            onClick={handleQuickGoogleClick}
            className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors border border-slate-200 shadow-sm"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{t("Tiếp tục với Google", "Continue with Google")}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">
              {t("Hoặc nhập email", "Or enter email")}
            </span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          <form onSubmit={handleGmailSubmit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                {t("Địa chỉ Gmail", "Gmail Address")} <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={gmailInput}
                onChange={(e) => {
                  setGmailInput(e.target.value);
                  setGmailError("");
                }}
                placeholder="ten.nguoidung@gmail.com"
                className="input-field font-mono text-xs"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                {t("Họ và tên hiển thị (tùy chọn)", "Display Name (Optional)")}
              </label>
              <input
                type="text"
                value={gmailNameInput}
                onChange={(e) => setGmailNameInput(e.target.value)}
                placeholder="Lê Minh Tuấn"
                className="input-field text-xs"
              />
            </div>

            {gmailError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{gmailError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold border border-blue-500/30 shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>{t("Đăng nhập bằng Gmail", "Sign in with Gmail")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center pt-1">
            {t(
              "Ví Web3 có thể liên kết sau trong Hồ sơ khi khởi tạo hợp đồng ký quỹ.",
              "Web3 wallet can be linked later in Profile before transacting."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
