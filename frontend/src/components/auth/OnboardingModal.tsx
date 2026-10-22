"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  User,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  AtSign,
  Fingerprint,
} from "lucide-react";
import { useAuth, UserRole } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { shortenAddress } from "@/src/lib/contracts";

export function OnboardingModal() {
  const {
    isOnboardingModalOpen,
    setIsOnboardingModalOpen,
    currentUser,
    registerOrUpdateUser,
    checkUsernameAvailability,
  } = useAuth();
  const { t } = useLanguage();

  const [usernameInput, setUsernameInput] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [roleInput, setRoleInput] = useState<UserRole>("BUYER");
  const [telegramInput, setTelegramInput] = useState("");
  const [zaloInput, setZaloInput] = useState("");
  const [facebookInput, setFacebookInput] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    type: "idle" | "valid" | "invalid";
    msg: string;
  }>({ type: "idle", msg: "" });

  useEffect(() => {
    if (currentUser) {
      if (currentUser.username && !currentUser.username.startsWith("user_")) {
        setUsernameInput(currentUser.username);
      }
      setDisplayNameInput(currentUser.name || "");
      setRoleInput(currentUser.role || "BUYER");
      setTelegramInput(currentUser.telegram || "");
      setZaloInput(currentUser.zalo || "");
      setFacebookInput(currentUser.facebook || "");
    }
  }, [currentUser]);

  // Live validation on username change
  const handleUsernameChange = (val: string) => {
    const clean = val.replace(/\s+/g, "").toLowerCase();
    setUsernameInput(clean);

    if (!clean) {
      setStatusMessage({ type: "idle", msg: "" });
      return;
    }

    const check = checkUsernameAvailability(clean, currentUser?.id);
    if (check.available) {
      setStatusMessage({
        type: "valid",
        msg: t("✓ User khả dụng và hợp lệ", "✓ Username is available and valid"),
      });
    } else {
      setStatusMessage({
        type: "invalid",
        msg: check.error || t("User không hợp lệ", "Invalid username"),
      });
    }
  };

  if (!isOnboardingModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (statusMessage.type === "invalid") return;

    const res = registerOrUpdateUser({
      username: usernameInput,
      name: displayNameInput.trim() || usernameInput,
      role: roleInput,
      telegram: telegramInput.trim() || `@${usernameInput}`,
      zalo: zaloInput.trim(),
      facebook: facebookInput.trim(),
    });

    if (!res.success) {
      setStatusMessage({
        type: "invalid",
        msg: res.error || t("Không thể đăng ký User", "Could not register username"),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-xl border border-[#1E222D] bg-[#101217] shadow-2xl p-6 text-[#F1F5F9]">
        {/* Glow Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#1E222D]">
          <div className="w-10 h-10 rounded-lg bg-[#E84142]/15 border border-[#E84142]/30 flex items-center justify-center text-[#E84142] shrink-0">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-[#F1F5F9] flex items-center gap-1.5">
              <span>{t("Thiết Lập User", "Setup Unique User")}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                Bắt Buộc
              </span>
            </h2>
            <p className="text-xs text-[#94A3B8]">
              {t(
                "Định danh User duy nhất không trùng lặp để đối tác tìm kiếm & khởi tạo Két Sắt 3 Bên.",
                "Unique identifier required for partners to search and create 3-party escrows."
              )}
            </p>
          </div>
        </div>

        {/* Auto Generated ID Badge */}
        <div className="mt-4 p-3 rounded-md bg-[#161922] border border-[#1E222D] flex items-center justify-between text-xs font-mono">
          <div className="space-y-0.5">
            <span className="text-[10px] text-[#64748B] block uppercase">
              {t("ID Hệ Thống Tự Sinh:", "Auto-Generated System ID:")}
            </span>
            <span className="text-[#F1F5F9] font-bold text-sm tracking-wide">
              {currentUser?.id || "TP-NEW"}
            </span>
          </div>

          <div className="text-right space-y-0.5">
            <span className="text-[10px] text-[#64748B] block uppercase">
              {t("Địa Chỉ Ví Liên Kết:", "Linked Wallet:")}
            </span>
            <span className="text-[#10B981] text-xs font-bold">
              {currentUser?.walletAddress ? shortenAddress(currentUser.walletAddress) : "0x..."}
            </span>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs font-sans">
          {/* 1. Username Field */}
          <div>
            <label className="text-[11px] font-bold text-[#F1F5F9] block mb-1">
              {t("User (Tên tài khoản không dấu, không trùng lặp) *", "User (Unique, no spaces) *")}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                <AtSign className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => handleUsernameChange(e.target.value)}
                placeholder="VD: tuan_crypto, hoangminh_otc..."
                className={`w-full pl-9 pr-3 py-2 rounded-md bg-[#090A0D] border font-mono text-xs text-[#F1F5F9] focus:outline-none transition-colors ${
                  statusMessage.type === "valid"
                    ? "border-[#10B981] focus:border-[#10B981]"
                    : statusMessage.type === "invalid"
                    ? "border-[#EF4444] focus:border-[#EF4444]"
                    : "border-[#1E222D] focus:border-[#E84142]"
                }`}
                required
              />
            </div>

            {/* Validation Feedback */}
            {statusMessage.msg && (
              <div
                className={`mt-1.5 flex items-center gap-1.5 text-[11px] ${
                  statusMessage.type === "valid" ? "text-[#10B981]" : "text-[#EF4444]"
                }`}
              >
                {statusMessage.type === "valid" ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                )}
                <span>{statusMessage.msg}</span>
              </div>
            )}
            <span className="text-[10px] text-[#64748B] block mt-1">
              {t(
                "User này sẽ dùng để người khác tìm thấy bạn khi lập giao dịch.",
                "Partners will search this user handle to transact with you."
              )}
            </span>
          </div>

          {/* 2. Display Name */}
          <div>
            <label className="text-[11px] font-bold text-[#F1F5F9] block mb-1">
              {t("Họ Tên Hiển Thị (Display Name)", "Display Name")}
            </label>
            <input
              type="text"
              value={displayNameInput}
              onChange={(e) => setDisplayNameInput(e.target.value)}
              placeholder="VD: Lê Minh Tuấn"
              className="w-full px-3 py-2 rounded-md bg-[#090A0D] border border-[#1E222D] focus:border-[#E84142] text-xs text-[#F1F5F9] focus:outline-none"
            />
          </div>

          {/* 3. Primary Role */}
          <div>
            <label className="text-[11px] font-bold text-[#F1F5F9] block mb-1">
              {t("Vai Trò Chính Hoạt Động", "Primary Role")}
            </label>
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value as UserRole)}
              className="w-full px-3 py-2 rounded-md bg-[#090A0D] border border-[#1E222D] focus:border-[#E84142] text-xs text-[#F1F5F9] focus:outline-none"
            >
              <option value="BUYER">{t("Bên Mua (Buyer) — Ký quỹ & Mua tài sản", "Buyer — Escrow & Purchase")}</option>
              <option value="SELLER">{t("Bên Bán (Seller) — OTC Merchant & Bán tài sản", "Seller — OTC Merchant & Sales")}</option>
              <option value="BROKER">{t("GDTG Bảo Chứng (Broker) — Ký cọc Aave & Phân xử", "Broker — Staked Custodian")}</option>
            </select>
          </div>

          {/* 4. Telegram */}
          <div>
            <label className="text-[11px] font-bold text-[#F1F5F9] block mb-1">
              {t("Telegram Liên Hệ (Tùy chọn)", "Contact Telegram (Optional)")}
            </label>
            <input
              type="text"
              value={telegramInput}
              onChange={(e) => setTelegramInput(e.target.value)}
              placeholder="@telegram_handle"
              className="w-full px-3 py-2 rounded-md bg-[#090A0D] border border-[#1E222D] focus:border-[#E84142] text-xs text-[#F1F5F9] focus:outline-none font-mono"
            />
          </div>

          {/* 5. Zalo Contact */}
          <div>
            <label className="text-[11px] font-bold text-[#F1F5F9] block mb-1">
              {t("Số Zalo Liên Hệ (Tùy chọn)", "Zalo Contact (Optional)")}
            </label>
            <input
              type="text"
              value={zaloInput}
              onChange={(e) => setZaloInput(e.target.value)}
              placeholder="VD: 0912345678"
              className="w-full px-3 py-2 rounded-md bg-[#090A0D] border border-[#1E222D] focus:border-[#0068FF] text-xs text-[#F1F5F9] focus:outline-none font-mono"
            />
          </div>

          {/* 6. Facebook Contact */}
          <div>
            <label className="text-[11px] font-bold text-[#F1F5F9] block mb-1">
              {t("Liên Kết Facebook (Tùy chọn)", "Facebook Profile (Optional)")}
            </label>
            <input
              type="text"
              value={facebookInput}
              onChange={(e) => setFacebookInput(e.target.value)}
              placeholder="https://facebook.com/..."
              className="w-full px-3 py-2 rounded-md bg-[#090A0D] border border-[#1E222D] focus:border-[#1877F2] text-xs text-[#F1F5F9] focus:outline-none font-mono"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={statusMessage.type === "invalid" || !usernameInput.trim()}
              className="w-full py-2.5 rounded-md bg-[#E84142] hover:bg-[#D13637] disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t("Hoàn Tất Đăng Ký User", "Complete User Registration")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
