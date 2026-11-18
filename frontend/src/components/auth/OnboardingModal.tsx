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
        msg: t("Tên định danh hợp lệ", "Username is available"),
      });
    } else {
      setStatusMessage({
        type: "invalid",
        msg: check.error || t("Tên định danh không hợp lệ", "Invalid username"),
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
        msg: res.error || t("Không thể lưu hồ sơ", "Could not save profile"),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-xl border border-slate-700/90 bg-[#111827] shadow-2xl p-6 text-slate-100">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>{t("Thiết lập hồ sơ định danh", "Setup Identity Profile")}</span>
              <span className="badge-pill status-safe text-[10px]">
                {t("Bắt buộc", "Required")}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t(
                "Thiết lập mã định danh để đối tác tra cứu và khởi tạo hợp đồng ký quỹ.",
                "Configure a unique handle for counterparty lookup and escrow creation."
              )}
            </p>
          </div>
        </div>

        {/* System ID & Wallet Strip */}
        <div className="mt-4 p-3 card-inner flex items-center justify-between text-xs font-mono">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-500 block uppercase">
              {t("Mã hệ thống", "System ID")}
            </span>
            <span className="text-slate-100 font-semibold text-xs">
              {currentUser?.id || "TP-NEW"}
            </span>
          </div>

          <div className="text-right space-y-0.5">
            <span className="text-[10px] text-slate-500 block uppercase">
              {t("Địa chỉ ví", "Wallet")}
            </span>
            <span className="text-emerald-400 text-xs font-semibold">
              {currentUser?.walletAddress ? shortenAddress(currentUser.walletAddress) : "0x..."}
            </span>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 1. Username Field */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                {t("Tên định danh (username) *", "Username *")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <AtSign className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="tuan_otc"
                  className={`input-field pl-8 text-xs font-mono ${
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
                  className={`mt-1 flex items-center gap-1.5 text-[11px] ${
                    statusMessage.type === "valid" ? "text-emerald-400" : "text-red-400"
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
            </div>

            {/* 2. Display Name */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                {t("Họ và tên hiển thị", "Display Name")}
              </label>
              <input
                type="text"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                placeholder="Lê Minh Tuấn"
                className="input-field text-xs"
              />
            </div>
          </div>

          {/* 3. Primary Role */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              {t("Vai trò giao dịch chính", "Primary Role")}
            </label>
            <select
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value as UserRole)}
              className="input-field text-xs"
            >
              <option value="BUYER">{t("Bên mua — Khởi tạo & thanh toán ký quỹ", "Buyer — Escrow & Purchase")}</option>
              <option value="SELLER">{t("Bên bán — Cung cấp tài sản / dịch vụ", "Seller — Asset & Service Provider")}</option>
              <option value="BROKER">{t("GDTG bảo chứng — Thế chấp Aave & kiểm định", "Broker — Staked Escrow Custodian")}</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* 4. Telegram */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                {t("Telegram (tùy chọn)", "Telegram (Optional)")}
              </label>
              <input
                type="text"
                value={telegramInput}
                onChange={(e) => setTelegramInput(e.target.value)}
                placeholder="@telegram_id"
                className="input-field text-xs font-mono"
              />
            </div>

            {/* 5. Zalo Contact */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                {t("Số Zalo (tùy chọn)", "Zalo (Optional)")}
              </label>
              <input
                type="text"
                value={zaloInput}
                onChange={(e) => setZaloInput(e.target.value)}
                placeholder="0912345678"
                className="input-field text-xs font-mono"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3 border-t border-slate-800">
            <button
              type="submit"
              disabled={statusMessage.type === "invalid" || !usernameInput.trim()}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold text-xs border border-blue-500/30 shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t("Lưu hồ sơ định danh", "Save Identity Profile")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
