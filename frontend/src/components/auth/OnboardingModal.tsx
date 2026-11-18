"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AtSign,
  Fingerprint,
} from "lucide-react";
import { useAuth, UserRole } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { shortenAddress } from "@/src/lib/contracts";

export function OnboardingModal() {
  const {
    isOnboardingModalOpen,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#0F1523] shadow-2xl p-6 sm:p-7 text-slate-100">
        {/* Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-white/[0.06]">
          <div className="w-10 h-10 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>{t("Thiết Lập User", "Setup Unique User")}</span>
              <span className="badge-pill bg-emerald-400/10 text-emerald-400 border border-emerald-400/30 text-[10px] font-bold py-0.5 px-2">
                Bắt Buộc
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t(
                "Định danh User duy nhất để đối tác tìm kiếm & khởi tạo Két Sắt 3 Bên.",
                "Unique identifier required for partners to search and create 3-party escrows."
              )}
            </p>
          </div>
        </div>

        {/* Auto Generated ID Badge */}
        <div className="mt-4 p-3.5 rounded-xl card-inner flex items-center justify-between text-xs font-mono">
          <div className="space-y-0.5">
            <span className="text-[11px] text-slate-500 block uppercase">
              {t("ID Hệ Thống:", "System ID:")}
            </span>
            <span className="text-white font-bold text-sm tracking-wide">
              {currentUser?.id || "TP-NEW"}
            </span>
          </div>

          <div className="text-right space-y-0.5">
            <span className="text-[11px] text-slate-500 block uppercase">
              {t("Địa Chỉ Ví:", "Wallet:")}
            </span>
            <span className="text-emerald-400 text-xs font-bold">
              {currentUser?.walletAddress ? shortenAddress(currentUser.walletAddress) : "0x..."}
            </span>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 1. Username Field */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t("User (Không dấu, không khoảng cách) *", "User Handle *")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <AtSign className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="VD: tuan_crypto"
                  className={`input-field pl-9 py-2 text-xs font-mono ${
                    statusMessage.type === "valid"
                      ? "border-emerald-500"
                      : statusMessage.type === "invalid"
                      ? "border-red-500"
                      : ""
                  }`}
                  required
                />
              </div>

              {statusMessage.msg && (
                <div
                  className={`mt-1 flex items-center gap-1.5 text-xs ${
                    statusMessage.type === "valid" ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {statusMessage.type === "valid" ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  <span>{statusMessage.msg}</span>
                </div>
              )}
            </div>

            {/* 2. Display Name */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t("Họ Tên Hiển Thị", "Display Name")}
              </label>
              <input
                type="text"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                placeholder="VD: Lê Minh Tuấn"
                className="input-field py-2 text-xs"
              />
            </div>
          </div>

          {/* 3. Primary Role */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">
              {t("Vai Trò Chính Hoạt Động", "Primary Role")}
            </label>
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value as UserRole)}
              className="input-field py-2 text-xs"
            >
              <option value="BUYER">{t("Bên Mua (Buyer) — Ký quỹ & Mua tài sản", "Buyer — Escrow & Purchase")}</option>
              <option value="SELLER">{t("Bên Bán (Seller) — OTC Merchant", "Seller — OTC Merchant & Sales")}</option>
              <option value="BROKER">{t("GDTG Bảo Chứng (Broker) — Ký cọc Aave", "Broker — Staked Custodian")}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 4. Telegram */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t("Telegram (Tùy chọn)", "Telegram (Optional)")}
              </label>
              <input
                type="text"
                value={telegramInput}
                onChange={(e) => setTelegramInput(e.target.value)}
                placeholder="@telegram_handle"
                className="input-field py-2 text-xs font-mono"
              />
            </div>

            {/* 5. Zalo Contact */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                {t("Số Zalo (Tùy chọn)", "Zalo (Optional)")}
              </label>
              <input
                type="text"
                value={zaloInput}
                onChange={(e) => setZaloInput(e.target.value)}
                placeholder="VD: 0912345678"
                className="input-field py-2 text-xs font-mono"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-white/[0.06]">
            <button
              type="submit"
              disabled={statusMessage.type === "invalid" || !usernameInput.trim()}
              className="w-full py-3 rounded-xl bg-brand hover:bg-brand-hover disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-brand/20"
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
