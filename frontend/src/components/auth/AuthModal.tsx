"use client";

import React, { useState } from "react";
import { useAccount, useConnect } from "wagmi";
import {
  X,
  User,
  ShieldCheck,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Building2,
  Coins,
  Sparkles,
  Lock,
} from "lucide-react";
import { useAuth, PRESET_ACCOUNTS, UserRole } from "@/src/context/AuthContext";
import { shortenAddress } from "@/src/lib/contracts";

export function AuthModal() {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
    loginWithPreset,
    loginWithWallet,
    updateProfile,
    logout,
  } = useAuth();

  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const [activeTab, setActiveTab] = useState<"preset" | "wallet" | "profile">("preset");
  const [customName, setCustomName] = useState(currentUser?.name || "");
  const [customRole, setCustomRole] = useState<UserRole>(currentUser?.role || "BUYER");
  const [customTelegram, setCustomTelegram] = useState(currentUser?.telegram || "");

  if (!isAuthModalOpen) return null;

  const handleWalletLogin = () => {
    if (connectors && connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
    if (address) {
      loginWithWallet(address, customName || undefined, customRole);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: customName,
      role: customRole,
      telegram: customTelegram,
    });
    setIsAuthModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-lg border border-[#1E222D] bg-[#101217] shadow-2xl p-6 text-[#F1F5F9]">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute right-4 top-4 text-[#64748B] hover:text-[#F1F5F9] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-[#1E222D]">
          <div className="w-10 h-10 rounded-md bg-[#E84142]/15 border border-[#E84142]/30 flex items-center justify-center text-[#E84142]">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#F1F5F9]">
              Quản Lý Tài Khoản &amp; Định Danh Cá Nhân
            </h2>
            <p className="text-xs text-[#94A3B8]">
              Đăng nhập tài khoản riêng biệt để tham gia giao dịch Két Sắt 3 Bên hoặc tra cứu tín nhiệm.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1 p-1 mt-4 rounded-md bg-[#161922] border border-[#1E222D] text-xs font-medium">
          <button
            onClick={() => setActiveTab("preset")}
            className={`py-2 rounded transition-colors ${
              activeTab === "preset"
                ? "bg-[#E84142] text-white shadow-sm"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            Tài Khoản Mẫu (1-Click)
          </button>
          <button
            onClick={() => setActiveTab("wallet")}
            className={`py-2 rounded transition-colors ${
              activeTab === "wallet"
                ? "bg-[#E84142] text-white shadow-sm"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            Đăng Nhập Ví Web3
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-2 rounded transition-colors ${
              activeTab === "profile"
                ? "bg-[#E84142] text-white shadow-sm"
                : "text-[#94A3B8] hover:text-[#F1F5F9]"
            }`}
          >
            Hồ Sơ Của Bạn
          </button>
        </div>

        {/* TAB 1: 1-CLICK DEMO PERSONAS */}
        {activeTab === "preset" && (
          <div className="mt-4 space-y-3">
            <span className="text-xs text-[#94A3B8] block">
              Chọn ngay 1 tài khoản với vai trò tương ứng để trải nghiệm đầy đủ các tính năng:
            </span>

            <div className="space-y-2.5">
              {PRESET_ACCOUNTS.map((account) => {
                const isSelected = currentUser?.id === account.id;
                return (
                  <button
                    key={account.id}
                    onClick={() => loginWithPreset(account.id)}
                    className={`w-full p-3 rounded-md border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "border-[#E84142] bg-[#E84142]/10"
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
                            (e.target as any).src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80";
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
                              ? "GDTG Bảo Chứng"
                              : account.role === "SELLER"
                              ? "Người Bán (OTC)"
                              : "Người Mua"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[#64748B] mt-0.5">
                          <span>Ví: {shortenAddress(account.walletAddress)}</span>
                          <span>·</span>
                          <span className="text-[#10B981]">SBT {account.sbtId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-[#F1F5F9] block">
                        {account.balanceUsdc.toLocaleString()} USDC
                      </span>
                      {isSelected ? (
                        <span className="text-[10px] text-[#10B981] font-mono flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3 h-3" /> Đang dùng
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#94A3B8] font-mono">Bấm để chọn</span>
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
                Kết Nối Ví MetaMask / Core / Rabby:
              </span>
              <p className="text-[#94A3B8] leading-relaxed text-[11px]">
                Hệ thống sẽ đồng bộ tài khoản với địa chỉ ví Avalanche Fuji C-Chain của bạn. Sau khi kết nối, bạn có thể thiết lập Tên hiển thị và Vai trò hoạt động.
              </p>
            </div>

            {isConnected && address ? (
              <div className="p-3.5 rounded-md border border-[#10B981]/30 bg-[#10B981]/10 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#10B981] text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Đã Kết Nối Ví Thành Công!</span>
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
                  Xác Nhận Đăng Nhập Bằng Ví Này
                </button>
              </div>
            ) : (
              <button
                onClick={handleWalletLogin}
                className="w-full py-3 rounded-md bg-[#E84142] hover:bg-[#D13637] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Wallet className="w-4 h-4" />
                <span>Kết Nối Ví Trực Tiếp</span>
              </button>
            )}
          </div>
        )}

        {/* TAB 3: EDIT PROFILE */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="mt-4 space-y-3.5 text-xs">
            <div>
              <label className="text-[#94A3B8] block mb-1">Tên Hiển Thị (Display Name)</label>
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
              <label className="text-[#94A3B8] block mb-1">Vai Trò Chính Trong Hệ Thống</label>
              <select
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value as UserRole)}
                className="w-full bg-[#161922] border border-[#1E222D] rounded-md px-3 py-2 text-[#F1F5F9] focus:outline-none focus:border-[#E84142]"
              >
                <option value="BUYER">Người Mua (Buyer) — Mua tài sản & Ký quỹ an toàn</option>
                <option value="SELLER">Người Bán (Seller) — Bán tài sản / OTC Merchant</option>
                <option value="BROKER">Trung Gian Bảo Chứng (Broker) — Đặt cọc Aave & Phê duyệt giải ngân</option>
              </select>
            </div>

            <div>
              <label className="text-[#94A3B8] block mb-1">Telegram Liên Hệ (Nhận thông báo kèo)</label>
              <input
                type="text"
                value={customTelegram}
                onChange={(e) => setCustomTelegram(e.target.value)}
                placeholder="VD: @hoang_crypto"
                className="w-full bg-[#161922] border border-[#1E222D] rounded-md px-3 py-2 text-[#F1F5F9] focus:outline-none focus:border-[#E84142]"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={logout}
                className="px-3 py-2 rounded-md bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] font-medium transition-colors"
              >
                Đăng Xuất
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-md bg-[#E84142] hover:bg-[#D13637] text-white font-bold transition-colors"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
