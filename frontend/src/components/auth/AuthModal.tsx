"use client";

import React, { useState } from "react";
import {
  X,
  Mail,
  Lock,
  User,
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
    loginWithEmail,
    registerWithEmail,
  } = useAuth();
  const { t } = useLanguage();

  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setAuthError(t("Vui lòng nhập địa chỉ email hợp lệ", "Please enter a valid email address"));
      return;
    }

    if (!passwordInput || passwordInput.length < 6) {
      setAuthError(t("Mật khẩu phải có ít nhất 6 ký tự", "Password must be at least 6 characters"));
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === "signin") {
        const res = loginWithEmail(cleanEmail, passwordInput);
        if (res.success) {
          setIsAuthModalOpen(false);
          setEmailInput("");
          setPasswordInput("");
          setNameInput("");
        } else {
          setAuthError(res.error || t("Không thể đăng nhập", "Sign in failed"));
        }
      } else {
        const res = registerWithEmail(cleanEmail, passwordInput, nameInput.trim() || undefined);
        if (res.success) {
          setIsAuthModalOpen(false);
          setEmailInput("");
          setPasswordInput("");
          setNameInput("");
        } else {
          setAuthError(res.error || t("Không thể đăng ký tài khoản", "Registration failed"));
        }
      }
    } finally {
      setIsSubmitting(false);
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
              {authMode === "signin"
                ? t("Đăng nhập TrustPact", "Sign in to TrustPact")
                : t("Đăng ký tài khoản", "Create an Account")}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t("Quản lý ký quỹ và bảo vệ giao dịch trực tuyến", "Escrow and online transaction protection")}
            </p>
          </div>
        </div>

        {/* Tabs: Đăng nhập vs Đăng ký */}
        <div className="flex items-center p-1 bg-slate-900/80 rounded-lg border border-slate-800 mt-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setAuthMode("signin");
              setAuthError("");
            }}
            className={`flex-1 py-1.5 rounded-md transition-colors ${
              authMode === "signin"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t("Đăng nhập", "Sign in")}
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthMode("signup");
              setAuthError("");
            }}
            className={`flex-1 py-1.5 rounded-md transition-colors ${
              authMode === "signup"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t("Đăng ký", "Register")}
          </button>
        </div>

        {/* Auth Form */}
        <div className="mt-4 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {authMode === "signup" && (
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  {t("Họ và tên", "Full Name")} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      setAuthError("");
                    }}
                    placeholder="Nguyễn Văn A"
                    className="input-field text-xs pl-9"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                {t("Địa chỉ Email", "Email Address")} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setAuthError("");
                  }}
                  placeholder="name@example.com"
                  className="input-field font-mono text-xs pl-9"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                {t("Mật khẩu", "Password")} <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setAuthError("");
                  }}
                  placeholder="••••••••"
                  className="input-field font-mono text-xs pl-9"
                  required
                  minLength={6}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {t("Tối thiểu 6 ký tự", "At least 6 characters")}
              </p>
            </div>

            {authError && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold border border-blue-500/30 shadow-sm flex items-center justify-center gap-2 transition-colors mt-2"
            >
              <span>
                {authMode === "signin"
                  ? t("Đăng nhập tài khoản", "Sign In")
                  : t("Tạo tài khoản mới", "Create Account")}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Toggle between sign in and sign up */}
          <div className="text-center pt-2 border-t border-slate-800/80">
            {authMode === "signin" ? (
              <p className="text-xs text-slate-400">
                {t("Chưa có tài khoản?", "Don't have an account?")}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthError("");
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  {t("Đăng ký ngay", "Register now")}
                </button>
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                {t("Đã có tài khoản?", "Already have an account?")}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthError("");
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold transition-colors"
                >
                  {t("Đăng nhập ngay", "Sign in now")}
                </button>
              </p>
            )}
          </div>

          <p className="text-[11px] text-slate-500 text-center">
            {t(
              "Ví Web3 có thể liên kết sau trong Hồ sơ khi giao dịch trên Avalanche.",
              "Web3 wallet can be linked later in Profile before transacting on Avalanche."
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
