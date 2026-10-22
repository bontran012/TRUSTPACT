"use client";

import React, { useState, useEffect } from "react";
import { useAccount, useConnect } from "wagmi";
import {
  X,
  User,
  ShieldCheck,
  Wallet,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Coins,
  Sparkles,
  Lock,
  AtSign,
  Fingerprint,
} from "lucide-react";
import { useAuth, PRESET_ACCOUNTS, UserRole } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { shortenAddress } from "@/src/lib/contracts";

export function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
    loginWithPreset,
    loginWithWallet,
    registerOrUpdateUser,
    checkUsernameAvailability,
    logout,
  } = useAuth();
  const { t } = useLanguage();

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const [activeTab, setActiveTab] = useState<"preset" | "wallet" | "profile">("preset");
  const [customUsername, setCustomUsername] = useState(currentUser?.username || "");
  const [customName, setCustomName] = useState(currentUser?.name || "");
  const [customRole, setCustomRole] = useState<UserRole>(currentUser?.role || "BUYER");
  const [customTelegram, setCustomTelegram] = useState(currentUser?.telegram || "");
  const [customZalo, setCustomZalo] = useState(currentUser?.zalo || "");
  const [customFacebook, setCustomFacebook] = useState(currentUser?.facebook || "");
  const [usernameStatus, setUsernameStatus] = useState<{
    type: "idle" | "valid" | "invalid";
    msg: string;
  }>({ type: "idle", msg: "" });

  useEffect(() => {
    if (currentUser) {
      setCustomUsername(currentUser.username || "");
      setCustomName(currentUser.name || "");
      setCustomRole(currentUser.role || "BUYER");
      setCustomTelegram(currentUser.telegram || "");
      setCustomZalo(currentUser.zalo || "");
      setCustomFacebook(currentUser.facebook || "");
    }
  }, [currentUser]);

  if (!isAuthModalOpen) return null;

  const handleWalletLogin = () => {
    if (connectors && connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
    if (address) {
      loginWithWallet(address, customName || undefined, customRole);
    }
  };

  const handleUsernameChange = (val: string) => {
    const clean = val.replace(/\s+/g, "").toLowerCase();
    setCustomUsername(clean);

    if (!clean) {
      setUsernameStatus({ type: "idle", msg: "" });
      return;
    }

    const check = checkUsernameAvailability(clean, currentUser?.id);
    if (check.available) {
      setUsernameStatus({
        type: "valid",
        msg: t("✓ User khả dụng", "✓ Username is available"),
      });
    } else {
      setUsernameStatus({
        type: "invalid",
        msg: check.error || t("User không hợp lệ", "Invalid username"),
      });
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus.type === "invalid") return;

    const res = registerOrUpdateUser({
      username: customUsername,
      name: customName,
      role: customRole,
      telegram: customTelegram,
      zalo: customZalo.trim(),
      facebook: customFacebook.trim(),
    });

    if (res.success) {
      setIsAuthModalOpen(false);
    } else {
      setUsernameStatus({
        type: "invalid",
        msg: res.error || t("Không thể lưu hồ sơ", "Could not save profile"),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl border border-[#1E222D] bg-[#101217] shadow-2xl p-6 text-[#F1F5F9]">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute right-4 top-4 text-[#64748B] hover:text-[#F1F5F9] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#1E222D]">
          <div className="w-10 h-10 rounded-lg bg-[#E84142]/15 border border-[#E84142]/30 flex items-center justify-center text-[#E84142]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#F1F5F9]">
              {t("Quản Lý Tài Khoản & Định Danh Cá Nhân", "Account & Identity Center")}
            </h2>
            <p className="text-xs text-[#94A3B8]">
              {t(
                "Đăng nhập tài khoản riêng biệt để tham gia giao dịch Két Sắt 3 Bên hoặc tra cứu tín nhiệm.",
                "Login with an isolated persona to participate in 3-party escrows or check reputation."
              )}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1 mt-4 rounded-md bg-[#161922] border border-[#1E222D] text-xs font-medium">
          <button
            onClick={() => setActiveTab("preset")}
            className={`py-2 rounded transition-colors ${
              activeTab === "preset"
                ? "bg-[#E84142] text-white shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            {t("Tài Khoản Mẫu", "Demo Personas")}
          </button>
          <button
            onClick={() => setActiveTab("wallet")}
            className={`py-2 rounded transition-colors ${
              activeTab === "wallet"
                ? "bg-[#E84142] text-white shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            {t("Đăng Nhập Ví Web3", "Web3 Wallet")}
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-2 rounded transition-colors ${
              activeTab === "profile"
                ? "bg-[#E84142] text-white shadow-sm font-bold"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            {t("Hồ Sơ Của Bạn", "My Profile")}
          </button>
        </div>

        {/* TAB 1: 1-CLICK DEMO PERSONAS */}
        {activeTab === "preset" && (
          <div className="mt-4 space-y-3">
            <span className="text-xs text-[#94A3B8] block">
              {t(
                "Chọn ngay 1 tài khoản với vai trò tương ứng để trải nghiệm đầy đủ các tính năng:",
                "Select a pre-configured account role to test all features instantly:"
              )}
            </span>

            <div className="space-y-2.5">
              {PRESET_ACCOUNTS.map((account) => {
                const isSelected = currentUser?.id === account.id;
                return (
                  <button
                    key={account.id}
                    onClick={() => loginWithPreset(account.id)}
                    className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "border-[#E84142] bg-[#E84142]/10 ring-1 ring-[#E84142]/40"
                        : "border-[#1E222D] bg-[#161922] hover:border-[#1E222D]/80 hover:bg-[#1E222D]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-[#1E222D] shrink-0 bg-[#090A0D]">
                        <img
                          src={account.avatarUrl}
                          alt={account.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as any).src =
                              "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80";
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#F1F5F9]">{account.name}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                              account.role === "BROKER"
                                ? "bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30"
                                : account.role === "SELLER"
                                ? "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30"
                                : "bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30"
                            }`}
                          >
                            {account.role === "BROKER"
                              ? t("GDTG Bảo Chứng", "Staked Broker")
                              : account.role === "SELLER"
                              ? t("Bên Bán (OTC)", "OTC Seller")
                              : t("Bên Mua", "Buyer")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[#64748B] mt-0.5">
                          <span className="text-[#94A3B8] font-bold">@{account.username}</span>
                          <span>·</span>
                          <span className="text-[#E84142]">ID: {account.id}</span>
                          <span>·</span>
                          <span>Ví: {shortenAddress(account.walletAddress)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-[#F1F5F9] block">
                        {account.balanceUsdc.toLocaleString()} USDC
                      </span>
                      {isSelected ? (
                        <span className="text-[10px] text-[#10B981] font-mono flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3 h-3" /> {t("Đang dùng", "Active")}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#94A3B8] font-mono">{t("Bấm để chọn", "Select")}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: CONNECT WEB3 WALLET */}
        {activeTab === "wallet" && (
          <div className="mt-4 space-y-4">
            <div className="p-3.5 rounded-md bg-[#161922] border border-[#1E222D] space-y-2 text-xs">
              <span className="text-xs font-semibold text-[#F1F5F9] block">
                {t("Kết Nối Ví MetaMask / Core / Rabby:", "Connect MetaMask / Core / Rabby Wallet:")}
              </span>
              <p className="text-[#94A3B8] leading-relaxed text-[11px]">
                {t(
                  "Hệ thống sẽ đồng bộ tài khoản với địa chỉ ví Avalanche Fuji C-Chain của bạn. Khi kết nối lần đầu, bạn sẽ được tự động cấp một ID duy nhất và thiết lập User riêng.",
                  "Synchronizes with your Avalanche Fuji C-Chain address. On your first login, a unique System ID is assigned and you can configure your user handle."
                )}
              </p>
            </div>

            {isConnected && address ? (
              <div className="p-3.5 rounded-md border border-[#10B981]/30 bg-[#10B981]/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#10B981] text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t("Đã Kết Nối Ví Thành Công!", "Wallet Connected Successfully!")}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#64748B]">Avalanche Fuji</span>
                </div>
                <div className="text-xs font-mono text-[#F1F5F9] break-all bg-[#090A0D] p-2 rounded border border-[#1E222D]">
                  {address}
                </div>
                <button
                  onClick={() => {
                    loginWithWallet(address, customName || undefined, customRole);
                  }}
                  className="w-full py-2.5 rounded-md bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold transition-colors"
                >
                  {t("Xác Nhận Đăng Nhập & Thiết Lập Tên", "Confirm Login & Setup Handle")}
                </button>
              </div>
            ) : (
              <button
                onClick={handleWalletLogin}
                className="w-full py-3 rounded-md bg-[#E84142] hover:bg-[#D13637] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Wallet className="w-4 h-4" />
                <span>{t("Kết Nối Ví Trực Tiếp", "Connect Web3 Wallet")}</span>
              </button>
            )}
          </div>
        )}

        {/* TAB 3: EDIT PROFILE */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="mt-4 space-y-3.5 text-xs">
            {/* System ID Display */}
            <div className="p-3 rounded-md bg-[#161922] border border-[#1E222D] flex items-center justify-between font-mono">
              <span className="text-[#64748B] text-[11px] uppercase">{t("Mã ID Hệ Thống:", "System ID:")}</span>
              <span className="text-[#10B981] font-bold text-sm tracking-wider">
                {currentUser?.id || "TP-1001"}
              </span>
            </div>

            {/* Username Input with Live Uniqueness Check */}
            <div>
              <label className="text-[#94A3B8] block mb-1">
                {t("User (Tên tài khoản không trùng lặp)", "User (Unique Handle)")}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                  <AtSign className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={customUsername}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="tuan_crypto"
                  className="w-full pl-9 pr-3 py-2 bg-[#161922] border border-[#1E222D] rounded-md text-[#F1F5F9] font-mono focus:outline-none focus:border-[#E84142]"
                  required
                />
              </div>
              {usernameStatus.msg && (
                <div
                  className={`mt-1 flex items-center gap-1.5 text-[11px] ${
                    usernameStatus.type === "valid" ? "text-[#10B981]" : "text-[#EF4444]"
                  }`}
                >
                  {usernameStatus.type === "valid" ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  <span>{usernameStatus.msg}</span>
                </div>
              )}
            </div>

            <div>
              <label className="text-[#94A3B8] block mb-1">{t("Tên Hiển Thị (Display Name)", "Display Name")}</label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="VD: Trần Hoàng (Trader)"
                className="w-full bg-[#161922] border border-[#1E222D] rounded-md px-3 py-2 text-[#F1F5F9] focus:outline-none focus:border-[#E84142]"
                required
              />
            </div>

            <div>
              <label className="text-[#94A3B8] block mb-1">{t("Vai Trò Chính Trong Hệ Thống", "Primary Role")}</label>
              <select
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value as UserRole)}
                className="w-full bg-[#161922] border border-[#1E222D] rounded-md px-3 py-2 text-[#F1F5F9] focus:outline-none focus:border-[#E84142]"
              >
                <option value="BUYER">{t("Người Mua (Buyer) — Mua tài sản & Ký quỹ an toàn", "Buyer — Safe escrow & purchase")}</option>
                <option value="SELLER">{t("Người Bán (Seller) — Bán tài sản / OTC Merchant", "Seller — OTC Merchant & Sales")}</option>
                <option value="BROKER">{t("Trung Gian Bảo Chứng (Broker) — Đặt cọc Aave & Phê duyệt", "Broker — Staked Custodian")}</option>
              </select>
            </div>

            <div>
              <label className="text-[#94A3B8] block mb-1">{t("Telegram Liên Hệ (Nhận thông báo kèo)", "Contact Telegram")}</label>
              <input
                type="text"
                value={customTelegram}
                onChange={(e) => setCustomTelegram(e.target.value)}
                placeholder="VD: @hoang_crypto"
                className="w-full bg-[#161922] border border-[#1E222D] rounded-md px-3 py-2 text-[#F1F5F9] font-mono focus:outline-none focus:border-[#E84142]"
              />
            </div>

            <div>
              <label className="text-[#94A3B8] block mb-1">{t("Số Zalo Liên Hệ", "Zalo Contact")}</label>
              <input
                type="text"
                value={customZalo}
                onChange={(e) => setCustomZalo(e.target.value)}
                placeholder="VD: 0912345678"
                className="w-full bg-[#161922] border border-[#1E222D] rounded-md px-3 py-2 text-[#F1F5F9] font-mono focus:outline-none focus:border-[#0068FF]"
              />
            </div>

            <div>
              <label className="text-[#94A3B8] block mb-1">{t("Liên Kết Facebook", "Facebook Profile")}</label>
              <input
                type="text"
                value={customFacebook}
                onChange={(e) => setCustomFacebook(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full bg-[#161922] border border-[#1E222D] rounded-md px-3 py-2 text-[#F1F5F9] font-mono focus:outline-none focus:border-[#1877F2]"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={logout}
                className="px-3 py-2 rounded-md bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] font-medium transition-colors"
              >
                {t("Đăng Xuất", "Log Out")}
              </button>
              <button
                type="submit"
                disabled={usernameStatus.type === "invalid" || !customUsername.trim()}
                className="flex-1 py-2 rounded-md bg-[#E84142] hover:bg-[#D13637] text-white font-bold transition-colors disabled:opacity-40"
              >
                {t("Lưu Thay Đổi", "Save Changes")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
