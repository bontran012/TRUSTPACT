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
  Lock,
  Search,
  Users,
  Settings,
} from "lucide-react";
import { useAuth, UserRole } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { ShimmerButton } from "@/src/components/ui/ShimmerButton";
import { NumberTicker } from "@/src/components/ui/NumberTicker";

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
  const [avatarUrlInput, setAvatarUrlInput] = useState(currentUser?.avatarUrl || "");

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
      setAvatarUrlInput(currentUser.avatarUrl || "");
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
        msg: t("Username khả dụng", "Username is available"),
      });
    } else {
      setUsernameStatus({
        type: "invalid",
        msg: check.error || t("Username không hợp lệ", "Invalid username"),
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
      avatarUrl: avatarUrlInput.trim() || currentUser?.avatarUrl,
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── TOP HEADER ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-white/[0.07]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400 block mb-1">
            Web3 Identity &amp; Soulbound SBT
          </span>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t("Hồ Sơ Cá Nhân & Hộ Chiếu Số", "Profile & Digital Passport")}
            </h1>
            <span className="font-mono text-xs font-bold text-indigo-200 bg-indigo-500/15 border border-indigo-400/30 px-2.5 py-1 rounded-full">
              {currentUser?.id || "TP-1001"}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            {t(
              "Quản lý định danh giao dịch, thông tin liên hệ đối soát và điểm tín nhiệm Soulbound SBT",
              "Manage your trading handle, verified contact channels, and Soulbound SBT reputation"
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-white/[0.12] hover:bg-white/[0.18] backdrop-blur-xl border border-white/[0.22] text-xs font-semibold text-white flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Users className="w-4 h-4 text-sky-300" />
            <span>{t("Chuyển Đổi Tài Khoản", "Switch Account")}</span>
          </button>

          <Link href="/pact">
            <ShimmerButton variant="primary" className="px-5 py-2.5 text-xs font-bold">
              <Lock className="w-3.5 h-3.5" />
              <span>{t("Sổ Kèo Của Tôi", "My Deals")}</span>
            </ShimmerButton>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── LEFT PANE: HOLOGRAPHIC DIPLOMATIC PASSPORT CARD (5 COLS) ───── */}
        <div className="lg:col-span-5 space-y-6">
          <div className="relative overflow-hidden rounded-[32px] border border-white/[0.28] shadow-[0_28px_70px_-14px_rgba(4,12,34,0.65)]">
            <img
              src="/images/sbt-passport-bg.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-55"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#13295E]/65 via-[#0E204B]/82 to-[#091636]/92 backdrop-blur-xl" />

            {/* Cover Banner Strip */}
            <div className="relative h-28 overflow-hidden border-b border-white/[0.18]">
              <img
                src="/images/sbt-passport-bg.png"
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0D1E47]/80 to-transparent" />
              <div className="absolute top-4 left-5 right-5 flex items-center justify-between">
                <span className="badge-pill bg-[#0A1838]/60 border border-white/[0.25] text-white text-[11px]">
                  <Fingerprint className="w-3.5 h-3.5 text-sky-300" />
                  <span>{t("Căn Cước Số TrustPact", "TrustPact Digital ID")}</span>
                </span>
                <span className="badge-pill bg-emerald-400/25 text-emerald-100 border border-emerald-300/40 text-[11px]">
                  Đang Hoạt Động
                </span>
              </div>
            </div>

            <div className="relative p-6 pt-0 space-y-5">
              {/* Overlapping Circular Portrait */}
              <div className="-mt-9 flex items-end justify-between gap-3">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-[#0E204B] border border-sky-300/60 bg-slate-900 shrink-0 shadow-xl">
                  <img
                    src={currentUser?.avatarUrl || "/images/avatar-tuan.jpg"}
                    alt={currentUser?.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as any).src = "/images/avatar-tuan.jpg";
                    }}
                  />
                </div>
                <img
                  src="/images/passport-badge.jpg"
                  alt="SBT Emblem"
                  className="w-11 h-11 rounded-2xl object-cover ring-1 ring-amber-300/50 shadow-md mb-1"
                />
              </div>

              <div className="space-y-1.5">
                <span className="font-extrabold text-xl text-white block truncate">{currentUser?.name}</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sky-200 font-mono font-semibold text-xs">@{currentUser?.username}</span>
                  <span
                    className={`badge-pill text-[10px] uppercase py-0.5 px-2.5 ${
                      currentUser?.role === "BROKER"
                        ? "bg-emerald-400/20 text-emerald-200 border border-emerald-300/40"
                        : currentUser?.role === "SELLER"
                        ? "bg-amber-400/20 text-amber-200 border border-amber-300/40"
                        : "bg-sky-400/20 text-sky-100 border border-sky-300/40"
                    }`}
                  >
                    {currentUser?.role === "BROKER"
                      ? t("GDTG Bảo Chứng", "Broker")
                      : currentUser?.role === "SELLER"
                      ? t("Bên Bán (OTC)", "Seller")
                      : t("Bên Mua", "Buyer")}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  {currentUser?.telegram && (
                    <a
                      href={`https://t.me/${currentUser.telegram.replace(/^@/, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] px-3 py-0.5 rounded-full bg-white/[0.1] hover:bg-white/[0.18] text-sky-100 border border-white/[0.18] transition-colors"
                    >
                      TG: {currentUser.telegram}
                    </a>
                  )}
                  {currentUser?.zalo && (
                    <a
                      href={`https://zalo.me/${currentUser.zalo.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] px-3 py-0.5 rounded-full bg-white/[0.1] hover:bg-white/[0.18] text-sky-100 border border-white/[0.18] transition-colors"
                    >
                      Zalo: {currentUser.zalo}
                    </a>
                  )}
                </div>
              </div>

              {/* System ID & Wallet */}
              <div className="space-y-2.5">
                <div className="p-3.5 rounded-2xl bg-white/[0.09] border border-white/[0.16] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-sky-100/80 block">Mã định danh hệ thống</span>
                    <span className="text-sm font-bold font-mono text-white">{currentUser?.id || "TP-1001"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    className="px-3 py-1.5 rounded-full bg-white/[0.12] hover:bg-white/[0.2] text-xs text-white inline-flex items-center gap-1.5 transition-colors"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId ? "Đã chép" : "Sao chép"}</span>
                  </button>
                </div>

                {currentUser?.isWalletLinked &&
                currentUser.walletAddress &&
                currentUser.walletAddress !== "0x0000000000000000000000000000000000000000" ? (
                  <div className="p-3.5 rounded-2xl bg-white/[0.09] border border-white/[0.16] space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-sky-100/80">
                      <span className="flex items-center gap-1.5 font-semibold text-emerald-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ví Web3 đã liên kết</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsLinkWalletModalOpen(true)}
                          className="text-[11px] text-sky-300 hover:text-white underline"
                        >
                          Đổi ví khác
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyWallet}
                          className="text-sky-100 hover:text-white inline-flex items-center gap-1 transition-colors"
                        >
                          {copiedWallet ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedWallet ? "Đã chép" : "Chép ví"}</span>
                        </button>
                        <a
                          href={`https://testnet.snowtrace.io/address/${currentUser?.walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-200 hover:text-white"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-white break-all block bg-black/30 p-2 rounded-xl border border-white/10">
                      {currentUser?.walletAddress}
                    </span>
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/25 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-amber-200 font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                        <span>Địa chỉ ví Web3</span>
                      </span>
                      <span className="text-[10px] text-amber-200/80 bg-amber-400/20 px-2 py-0.5 rounded-full font-medium">
                        Chưa liên kết ví
                      </span>
                    </div>
                    <p className="text-[11px] text-sky-100/70">
                      Tài khoản đang đăng nhập bằng Gmail ({currentUser?.email}). Bạn chỉ cần liên kết ví Web3 khi phát sinh giao dịch ký quỹ on-chain hoặc nạp cọc.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsLinkWalletModalOpen(true)}
                      className="w-full py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-colors"
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>Liên Kết Ví Web3 Ngay</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Balance & Trust Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.09] border border-white/[0.16] space-y-1">
                  <span className="text-[11px] text-sky-100/80 block">Số dư USDC (Fuji On-Chain)</span>
                  <div className="text-base font-extrabold font-mono text-white tabular-nums">
                    <NumberTicker
                      value={realUsdcDisplay}
                      decimals={2}
                      suffix=" USDC"
                    />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white/[0.09] border border-white/[0.16] space-y-1">
                  <span className="text-[11px] text-sky-100/80 block">Điểm uy tín SBT</span>
                  <div className="text-base font-extrabold font-mono text-emerald-300 flex items-center gap-1.5 tabular-nums">
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

          {/* Partner Directory Quick Search */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.14]">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-sky-300" />
                <span className="section-title text-sm">
                  {t("Danh Bạ Đối Tác Đã Xác Thực", "Verified Directory")}
                </span>
              </div>
              <span className="text-xs text-sky-100/75">{registeredUsers.length} thành viên</span>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sky-200/60">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={partnerSearchQuery}
                onChange={(e) => setPartnerSearchQuery(e.target.value)}
                placeholder={t("Tìm @username, mã TP-... hoặc tên...", "Search @username, ID, or name...")}
                className="input-field rounded-full pl-11 py-2.5 text-xs"
              />
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {searchResults.slice(0, 4).map((user) => (
                <div
                  key={user.id}
                  className="card-inner p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-white/25"
                      onError={(e) => {
                        (e.target as any).src = "/images/avatar-tuan.jpg";
                      }}
                    />
                    <div className="min-w-0">
                      <span className="font-semibold text-xs text-white truncate block">{user.name}</span>
                      <span className="text-[11px] text-sky-200 font-mono block">@{user.username} · {user.id}</span>
                    </div>
                  </div>

                  <Link
                    href={`/pact/create?seller=${user.walletAddress}`}
                    className="px-3.5 py-1.5 rounded-full bg-sky-400/20 hover:bg-sky-400/35 border border-sky-300/35 text-xs font-semibold text-white transition-colors shrink-0 whitespace-nowrap"
                  >
                    {t("Tạo kèo", "Transact")}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANE: EDIT PROFILE SETTINGS FORM (7 COLS) ──────────────── */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card p-6 sm:p-7 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.12]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-sky-400/15 border border-sky-300/30 flex items-center justify-center text-sky-200">
                  <Settings className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="section-title">
                    {t("Cập Nhật Thông Tin Định Danh", "Identity & Contact Settings")}
                  </h2>
                  <p className="text-xs text-sky-100/80">Đồng bộ hiển thị trong Phòng Ký Quỹ và Radar Tín Nhiệm</p>
                </div>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-xs font-medium flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>
                  {t(
                    "Đã lưu cập nhật hồ sơ thành công!",
                    "Profile changes saved successfully!"
                  )}
                </span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-sky-100 block mb-1.5">
                    {t("Username (Không dấu) *", "Unique Handle *")}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-sky-200/75">
                      <AtSign className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="tuan_crypto"
                      className={`input-field pl-10 py-2.5 font-mono text-sm ${
                        usernameStatus.type === "valid"
                          ? "border-emerald-500/60"
                          : usernameStatus.type === "invalid"
                          ? "border-red-500/60"
                          : ""
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
                    {t("Họ Tên Hiển Thị", "Display Name")}
                  </label>
                  <input
                    type="text"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder="VD: Lê Minh Tuấn"
                    className="input-field py-2.5 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    {t("Vai Trò Giao Dịch Chính", "Default Operating Role")}
                  </label>
                  <select
                    value={roleInput}
                    onChange={(e) => setRoleInput(e.target.value as UserRole)}
                    className="input-field py-2.5 text-sm"
                  >
                    <option value="BUYER">{t("Bên Mua (Buyer)", "Buyer — Safe Escrow")}</option>
                    <option value="SELLER">{t("Bên Bán (Seller)", "Seller — OTC Merchant")}</option>
                    <option value="BROKER">{t("GDTG Bảo Chứng (Broker)", "Broker — Staked Custodian")}</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    {t("Telegram Liên Hệ", "Contact Telegram")}
                  </label>
                  <input
                    type="text"
                    value={telegramInput}
                    onChange={(e) => setTelegramInput(e.target.value)}
                    placeholder="@telegram_handle"
                    className="input-field py-2.5 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    {t("Số Điện Thoại / Zalo", "Zalo Contact")}
                  </label>
                  <input
                    type="text"
                    value={zaloInput}
                    onChange={(e) => setZaloInput(e.target.value)}
                    placeholder="0912345678"
                    className="input-field py-2.5 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    {t("Liên Kết Facebook", "Facebook Profile")}
                  </label>
                  <input
                    type="text"
                    value={facebookInput}
                    onChange={(e) => setFacebookInput(e.target.value)}
                    placeholder="facebook.com/username"
                    className="input-field py-2.5 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {t("Ảnh Đại Diện (Avatar URL)", "Avatar Image URL")}
                </label>
                <input
                  type="text"
                  value={avatarUrlInput}
                  onChange={(e) => setAvatarUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="input-field py-2.5 text-xs font-mono"
                />
                <div className="flex items-center gap-2 mt-2.5 text-xs flex-wrap">
                  <span className="text-sky-100/80 font-medium">Gợi ý ảnh đại diện:</span>
                  {[
                    { label: "Fintech Pro", url: "/images/avatar-tuan.jpg" },
                    { label: "OTC Custodian", url: "/images/avatar-hoang.jpg" },
                    { label: "Senior Auditor", url: "/images/avatar-nam.jpg" },
                  ].map((item) => (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => setAvatarUrlInput(item.url)}
                      className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-sky-100 hover:text-white transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.12] flex items-center justify-between gap-4">
                <span className="text-xs text-sky-100/85">
                  Mã định danh: <strong className="font-mono text-white">{currentUser?.id}</strong>
                </span>

                <ShimmerButton
                  type="submit"
                  variant="primary"
                  disabled={usernameStatus.type === "invalid" || !usernameInput.trim()}
                  className="px-6 py-3"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t("Lưu Cập Nhật Hồ Sơ", "Save Profile Changes")}</span>
                </ShimmerButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
