"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import { formatUnits } from "viem";
import {
  CONTRACT_ADDRESSES,
  ERC20_ABI,
  TRUST_PASSPORT_SBT_ABI,
} from "@/src/lib/contracts";
import {
  Fingerprint,
  AtSign,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Wallet,
  ShieldCheck,
  ExternalLink,
  FileText,
  Search,
  Users,
  Settings,
  Award,
} from "lucide-react";
import { useAuth, UserRole } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { ShimmerButton } from "@/src/components/ui/ShimmerButton";
import { NumberTicker } from "@/src/components/ui/NumberTicker";

function getInitials(name?: string, username?: string): string {
  const clean = (name || "").replace(/\([^)]*\)/g, "").trim();
  if (clean) {
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase();
  }
  if (username) return username.replace(/^@/, "").slice(0, 2).toUpperCase();
  return "TP";
}

export default function ProfilePage() {
  const {
    currentUser,
    registerOrUpdateUser,
    checkUsernameAvailability,
    registeredUsers,
    searchUsers,
    setIsAuthModalOpen,
    setIsLinkWalletModalOpen,
  } = useAuth();
  const { t } = useLanguage();
  const { address } = useAccount();
  const activeWallet = (address || currentUser?.walletAddress) as `0x${string}` | undefined;

  const { data: onChainUsdcBal } = useReadContract({
    address: CONTRACT_ADDRESSES.usdc,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: activeWallet ? [activeWallet] : undefined,
    query: { enabled: Boolean(activeWallet && activeWallet.startsWith("0x") && activeWallet.length === 42) },
  });

  const { data: onChainSuccessRate } = useReadContract({
    address: CONTRACT_ADDRESSES.trustPassportSBT,
    abi: TRUST_PASSPORT_SBT_ABI,
    functionName: "getSuccessRate",
    args: activeWallet ? [activeWallet] : undefined,
    query: { enabled: Boolean(activeWallet && activeWallet.startsWith("0x") && activeWallet.length === 42) },
  });

  const realUsdcDisplay =
    onChainUsdcBal !== undefined
      ? Number(formatUnits(onChainUsdcBal as bigint, 6))
      : currentUser?.balanceUsdc || 0;

  const realSuccessRateDisplay =
    onChainSuccessRate !== undefined && Number(onChainSuccessRate) > 0
      ? Number(onChainSuccessRate) / 100
      : currentUser?.successRate ?? 100;

  const [usernameInput, setUsernameInput] = useState(currentUser?.username || "");
  const [displayNameInput, setDisplayNameInput] = useState(currentUser?.name || "");
  const [roleInput, setRoleInput] = useState<UserRole>(currentUser?.role || "BUYER");
  const [telegramInput, setTelegramInput] = useState(currentUser?.telegram || "");
  const [zaloInput, setZaloInput] = useState(currentUser?.zalo || "");
  const [facebookInput, setFacebookInput] = useState(currentUser?.facebook || "");

  const [copiedId, setCopiedId] = useState(false);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{
    type: "idle" | "valid" | "invalid";
    msg: string;
  }>({ type: "idle", msg: "" });

  const [partnerSearchQuery, setPartnerSearchQuery] = useState("");
  const searchResults = searchUsers(partnerSearchQuery);

  useEffect(() => {
    if (currentUser) {
      setUsernameInput(currentUser.username || "");
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
      setUsernameStatus({ type: "idle", msg: "" });
      return;
    }

    const check = checkUsernameAvailability(clean, currentUser?.id);
    if (check.available) {
      setUsernameStatus({
        type: "valid",
        msg: t("Tên định danh khả dụng", "Username is available"),
      });
    } else {
      setUsernameStatus({
        type: "invalid",
        msg: check.error || t("Tên định danh không hợp lệ", "Invalid username"),
      });
    }
  };

  const handleCopyId = () => {
    if (currentUser?.id && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(currentUser.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCopyWallet = () => {
    if (currentUser?.walletAddress && typeof navigator !== "undefined") {
      navigator.clipboard.writeText(currentUser.walletAddress);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameStatus.type === "invalid") return;

    const res = registerOrUpdateUser({
      username: usernameInput,
      name: displayNameInput.trim() || usernameInput,
      role: roleInput,
      telegram: telegramInput.trim() || `@${usernameInput}`,
      zalo: zaloInput.trim(),
      facebook: facebookInput.trim(),
    });

    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setUsernameStatus({
        type: "invalid",
        msg: res.error || t("Không thể lưu hồ sơ", "Failed to save profile"),
      });
    }
  };

  const getRoleBadge = (role?: UserRole) => {
    switch (role) {
      case "BROKER":
        return {
          label: t("GDTG bảo chứng", "Broker"),
          cls: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
        };
      case "SELLER":
        return {
          label: t("Bên bán (OTC)", "Seller"),
          cls: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
        };
      case "ADMIN":
        return {
          label: t("Quản trị viên hệ thống", "System Admin"),
          cls: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
        };
      default:
        return {
          label: t("Bên mua", "Buyer"),
          cls: "bg-slate-800 text-slate-300 border border-slate-700",
        };
    }
  };

  const roleBadge = getRoleBadge(currentUser?.role);

  return (
    <div className="space-y-6 animate-fade-in" suppressHydrationWarning>
      {/* ── CLEAN BANKING PAGE HEADER ───────────────────────────────────── */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <Fingerprint className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-mono">TrustPassportSBT · Avalanche Fuji</span>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
              {t("Hồ sơ & Định danh SBT", "Profile & SBT Credential")}
            </h1>
            <span className="font-mono text-xs font-semibold text-slate-200 bg-slate-800 border border-slate-700 px-2.5 py-0.5 rounded-md">
              {currentUser?.id || (activeWallet ? shortenAddress(activeWallet) : "Web3")}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            {t(
              "Quản lý thông tin định danh giao dịch, kênh liên hệ đối soát và chứng thư tín nhiệm Soulbound SBT.",
              "Manage your trading identity, verified contact channels, and Soulbound SBT reputation."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsLinkWalletModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-100 flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Wallet className="w-3.5 h-3.5 text-blue-400" />
            <span>{t("Đổi ví kết nối", "Switch Wallet")}</span>
          </button>

          <Link href="/pact">
            <ShimmerButton variant="primary" className="px-4 py-2 text-xs font-medium rounded-lg">
              <FileText className="w-3.5 h-3.5" />
              <span>{t("Danh sách giao dịch", "Escrow Ledger")}</span>
            </ShimmerButton>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT PANE: INSTITUTIONAL DIGITAL CREDENTIAL CARD + DIRECTORY (5 COLS) ── */}
        <div className="lg:col-span-5 space-y-6">
          {/* Institutional Digital Credential Card */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
            {/* Clean Top Header Strip */}
            <div className="bg-slate-900/90 border-b border-slate-800 px-5 py-3.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Fingerprint className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{t("Chứng thư Định danh Số · SBT", "Digital Credential · SBT")}</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                <Check className="w-3 h-3" />
                <span>Đã xác thực</span>
              </span>
            </div>

            <div className="p-5 space-y-5">
              {/* Identity Row with Initials Monogram & SBT Badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold font-mono text-slate-100 shrink-0">
                    {getInitials(currentUser?.name, currentUser?.username)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <span className="font-bold text-base text-slate-100 block truncate">
                      {currentUser?.name || "Tài khoản TrustPact"}
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-400 font-mono text-xs">
                        @{currentUser?.username || "user"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${roleBadge.cls}`}>
                        {roleBadge.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Flat Vector SBT Emblem */}
                <div
                  title="Soulbound Token (ERC-721 Non-Transferable)"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 flex items-center gap-1.5 text-xs font-mono font-semibold text-blue-400 shrink-0"
                >
                  <Award className="w-4 h-4" />
                  <span>{currentUser?.sbtId || "SBT"}</span>
                </div>
              </div>

              {/* Contact Channels */}
              {(currentUser?.telegram || currentUser?.zalo) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {currentUser?.telegram && (
                    <a
                      href={`https://t.me/${currentUser.telegram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#0B0F17] hover:bg-slate-800/80 text-slate-300 border border-slate-800/80 transition-colors"
                    >
                      TG: {currentUser.telegram}
                    </a>
                  )}
                  {currentUser?.zalo && (
                    <a
                      href={`https://zalo.me/${currentUser.zalo.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono px-2.5 py-1 rounded-md bg-[#0B0F17] hover:bg-slate-800/80 text-slate-300 border border-slate-800/80 transition-colors"
                    >
                      Zalo: {currentUser.zalo}
                    </a>
                  )}
                </div>
              )}

              {/* System ID & Fuji Wallet Panels */}
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800/80 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Mã định danh hệ thống</span>
                    <span className="text-sm font-bold font-mono text-slate-100 tabular-nums">
                      {currentUser?.id || "TP-1001"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200 inline-flex items-center gap-1.5 transition-colors"
                  >
                    {copiedId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <span>{copiedId ? "Đã chép" : "Sao chép"}</span>
                  </button>
                </div>

                {currentUser?.isWalletLinked &&
                currentUser.walletAddress &&
                currentUser.walletAddress !== "0x0000000000000000000000000000000000000000" ? (
                  <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>Ví Avalanche Fuji đã liên kết</span>
                      </span>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => setIsLinkWalletModalOpen(true)}
                          className="text-[11px] text-blue-400 hover:text-blue-300 font-medium"
                        >
                          Đổi ví
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyWallet}
                          className="text-slate-300 hover:text-slate-100 inline-flex items-center gap-1 transition-colors"
                        >
                          {copiedWallet ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedWallet ? "Đã chép" : "Sao chép"}</span>
                        </button>
                        <a
                          href={`https://testnet.snowtrace.io/address/${currentUser?.walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-slate-100"
                          title="Xem trên Snowtrace"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-200 break-all block bg-[#111827] p-2 rounded-md border border-slate-800">
                      {currentUser?.walletAddress}
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-amber-500/30 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Địa chỉ ví Avalanche Fuji</span>
                      </span>
                      <span className="text-[11px] text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md font-medium">
                        Chưa liên kết
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Chưa kết nối ví Web3. Vui lòng kết nối ví MetaMask hoặc Core Wallet để thực hiện giao dịch ký quỹ hoặc nạp thế chấp trên chuỗi Avalanche Fuji.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsLinkWalletModalOpen(true)}
                      className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Kết nối ví Web3</span>
                    </button>
                  </div>
                )}
              </div>

              {/* On-Chain Balance & SBT Success Rate Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800/80 space-y-1">
                  <span className="text-[11px] text-slate-400 block">Số dư USDC (Fuji)</span>
                  <div className="text-base font-bold font-mono text-slate-100 tabular-nums">
                    <NumberTicker
                      value={realUsdcDisplay}
                      decimals={2}
                      suffix=" USDC"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800/80 space-y-1">
                  <span className="text-[11px] text-slate-400 block">Tỷ lệ uy tín SBT</span>
                  <div className="text-base font-bold font-mono text-emerald-400 flex items-center gap-1.5 tabular-nums">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    <NumberTicker
                      value={realSuccessRateDisplay}
                      decimals={1}
                      suffix="%"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Verified Partner Directory List */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-100">
                  {t("Danh bạ đối tác xác thực", "Verified Directory")}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                {registeredUsers.length} thành viên
              </span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={partnerSearchQuery}
                onChange={(e) => setPartnerSearchQuery(e.target.value)}
                placeholder={t("Tìm @username, mã TP-... hoặc tên...", "Search @username, ID, or name...")}
                className="w-full bg-[#0B0F17] border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 transition-colors"
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
              {searchResults.slice(0, 5).map((user) => (
                <div
                  key={user.id}
                  className="bg-[#0B0F17] border border-slate-800/80 rounded-lg p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold font-mono text-slate-200 shrink-0">
                      {getInitials(user.name, user.username)}
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-xs text-slate-100 truncate block">
                        {user.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono block truncate">
                        @{user.username} · {user.id}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/pact/create?seller=${user.walletAddress}`}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-100 transition-colors shrink-0 whitespace-nowrap"
                  >
                    {t("Giao dịch", "Transact")}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANE: EDIT PROFILE SETTINGS FORM (7 COLS) ──────────────── */}
        <div className="lg:col-span-7">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100">
                    {t("Cập nhật thông tin định danh", "Identity & Contact Settings")}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Đồng bộ hiển thị trong giao dịch ký quỹ và danh bạ đối soát đối tác.
                  </p>
                </div>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  {t(
                    "Đã lưu cập nhật thông tin hồ sơ thành công.",
                    "Profile changes saved successfully."
                  )}
                </span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    {t("Tên định danh (Username) *", "Unique Handle *")}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <AtSign className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="tuan_buyer"
                      className={`w-full bg-[#0B0F17] border rounded-lg pl-9 pr-3 py-2.5 font-mono text-sm text-slate-100 focus:outline-none transition-colors ${
                        usernameStatus.type === "valid"
                          ? "border-emerald-500/60 focus:border-emerald-500"
                          : usernameStatus.type === "invalid"
                          ? "border-red-500/60 focus:border-red-500"
                          : "border-slate-700 focus:border-blue-500"
                      }`}
                      required
                    />
                  </div>

                  {usernameStatus.msg && (
                    <div
                      className={`mt-1.5 flex items-center gap-1.5 text-xs ${
                        usernameStatus.type === "valid" ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      {usernameStatus.type === "valid" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{usernameStatus.msg}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    {t("Họ tên / Đơn vị hiển thị", "Display Name")}
                  </label>
                  <input
                    type="text"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder="VD: Lê Minh Tuấn"
                    className="w-full bg-[#0B0F17] border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg px-3.5 py-2.5 text-sm text-slate-100 transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    {t("Vai trò giao dịch mặc định", "Default Operating Role")}
                  </label>
                  <select
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value as UserRole)}
                    className="w-full bg-[#0B0F17] border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg px-3.5 py-2.5 text-sm text-slate-100 transition-colors"
                  >
                    <option value="BUYER">{t("Bên mua (Buyer)", "Buyer — Safe Escrow")}</option>
                    <option value="SELLER">{t("Bên bán (Seller)", "Seller — OTC Merchant")}</option>
                    <option value="BROKER">{t("GDTG bảo chứng (Broker)", "Broker — Staked Custodian")}</option>
                    {currentUser?.role === "ADMIN" && (
                      <option value="ADMIN">{t("Quản trị viên hệ thống", "System Admin")}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    {t("Telegram đối soát", "Contact Telegram")}
                  </label>
                  <input
                    type="text"
                    value={telegramInput}
                    onChange={(e) => setTelegramInput(e.target.value)}
                    placeholder="@telegram_handle"
                    className="w-full bg-[#0B0F17] border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-100 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    {t("Số điện thoại / Zalo", "Zalo / Phone")}
                  </label>
                  <input
                    type="text"
                    value={zaloInput}
                    onChange={(e) => setZaloInput(e.target.value)}
                    placeholder="0912345678"
                    className="w-full bg-[#0B0F17] border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-100 transition-colors"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    {t("Liên kết Facebook / Website", "Facebook / Website")}
                  </label>
                  <input
                    type="text"
                    value={facebookInput}
                    onChange={(e) => setFacebookInput(e.target.value)}
                    placeholder="facebook.com/username"
                    className="w-full bg-[#0B0F17] border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg px-3.5 py-2.5 text-sm font-mono text-slate-100 transition-colors"
                  />
                </div>
              </div>

              {/* Monogram Badge Preview Box */}
              <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold font-mono text-slate-200 shrink-0">
                    {getInitials(displayNameInput, usernameInput)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-semibold text-slate-200 block truncate">
                      Biểu trưng định danh tự động (Monogram)
                    </span>
                    <span className="text-[11px] text-slate-400 block truncate">
                      Khởi tạo trực tiếp từ tên hiển thị, đảm bảo đồng bộ trên mọi thiết bị.
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400 shrink-0">
                  {currentUser?.id || "TP-1001"}
                </span>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-4">
                <span className="text-xs text-slate-400">
                  Mã hệ thống:{" "}
                  <strong className="font-mono text-slate-100">{currentUser?.id || "TP-1001"}</strong>
                </span>

                <ShimmerButton
                  type="submit"
                  variant="primary"
                  disabled={usernameStatus.type === "invalid" || !usernameInput.trim()}
                  className="px-5 py-2.5 rounded-lg"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t("Lưu cập nhật hồ sơ", "Save Profile Changes")}</span>
                </ShimmerButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
