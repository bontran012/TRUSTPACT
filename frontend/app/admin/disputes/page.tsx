"use client";

import React, { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  Search,
  AlertTriangle,
  Lock,
  Check,
  FileText,
  UserX,
  Gavel,
  ShieldCheck,
  Copy,
} from "lucide-react";
import {
  CONTRACT_ADDRESSES,
  UNIVERSAL_ESCROW_ABI,
  STAKED_BROKER_REGISTRY_ABI,
  formatUsdc,
  parseUsdc,
  shortenAddress,
} from "@/src/lib/contracts";
import { TransactionFeedback, TxStatus } from "@/src/components/TransactionFeedback";
import { useAuth } from "@/src/context/AuthContext";
import { ShimmerButton } from "@/src/components/ui/ShimmerButton";

export default function AdminDisputesPage() {
  const { address } = useAccount();
  const { currentUser } = useAuth();
  const [simulatedTxStatus, setSimulatedTxStatus] = useState<TxStatus | null>(null);

  // Search Escrow ID
  const [searchIdInput, setSearchIdInput] = useState("4");
  const [activeEscrowId, setActiveEscrowId] = useState<bigint>(4n);
  const [compensationInput, setCompensationInput] = useState("6");
  const [evidenceConfirmed, setEvidenceConfirmed] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Read Protocol Admin & Treasury
  const { data: adminAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "admin",
  });

  const { data: treasuryAddress } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "treasury",
  });

  const { data: totalEscrowsCount } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "counter",
  });

  const effectiveAddress = address || currentUser?.walletAddress;
  const connectedLower = effectiveAddress?.toLowerCase();
  const userRole = currentUser?.role;

  const configuredAdminLower = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase();
  const isAdminOrTreasury =
    userRole === "ADMIN" ||
    (adminAddress && connectedLower === (adminAddress as string).toLowerCase()) ||
    (treasuryAddress && connectedLower === (treasuryAddress as string).toLowerCase()) ||
    (configuredAdminLower && connectedLower === configuredAdminLower);

  // Read Selected Escrow Item
  const { data: escrowData, refetch: refetchEscrow } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "getEscrow",
    args: [activeEscrowId],
  });

  const escrow = escrowData as
    | {
        id: bigint;
        buyer: `0x${string}`;
        seller: `0x${string}`;
        broker: `0x${string}`;
        amount: bigint;
        brokerFeeBps: bigint;
        duration: bigint;
        startTime: bigint;
        status: number;
      }
    | undefined;

  // Read Broker Staking Profile
  const { data: brokerProfileData } = useReadContract({
    address: CONTRACT_ADDRESSES.stakedBrokerRegistry,
    abi: STAKED_BROKER_REGISTRY_ABI,
    functionName: "brokers",
    args: escrow && escrow.broker ? [escrow.broker] : undefined,
    query: {
      enabled: !!escrow && !!escrow.broker,
    },
  });

  const brokerProfile = brokerProfileData as
    | [bigint, bigint, bigint, bigint, bigint, bigint, boolean, boolean, bigint]
    | undefined;

  const brokerStakedBalance = brokerProfile ? brokerProfile[1] : 0n;
  const brokerSlashedCount = brokerProfile ? Number(brokerProfile[5]) : 0;
  const brokerIsBlacklisted = brokerProfile ? brokerProfile[7] : false;

  // Web3 Write Hook for Slashing
  const {
    writeContract: slashBrokerWrite,
    data: slashTxHash,
    isPending: isSlashPending,
    error: slashError,
    reset: resetSlash,
  } = useWriteContract();

  const { isLoading: isSlashConfirming, isSuccess: isSlashSuccess } = useWaitForTransactionReceipt({
    hash: slashTxHash,
  });

  const txStatus: TxStatus =
    simulatedTxStatus ||
    (isSlashPending
      ? { step: "awaiting_signature", actionTitle: "Khấu trừ thế chấp GDTG & Bồi hoàn" }
      : isSlashConfirming
      ? { step: "confirming", txHash: slashTxHash, actionTitle: "Đang xác nhận lệnh khấu trừ thế chấp" }
      : isSlashSuccess
      ? { step: "success", txHash: slashTxHash, actionTitle: "Đã khấu trừ thế chấp & bồi hoàn thành công" }
      : slashError
      ? { step: "error", errorMessage: slashError.message, actionTitle: "Lệnh xử lý vi phạm thất bại" }
      : { step: "idle" });

  const handleSlashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminOrTreasury) return;
    if (!evidenceConfirmed) return;

    const compWei = parseUsdc(compensationInput || "0");

    if (!address || !slashBrokerWrite) {
      setSimulatedTxStatus({
        step: "error",
        actionTitle: "Yêu cầu ví quản trị viên On-Chain",
        errorMessage: `Vui lòng kết nối ví quản trị viên (${shortenAddress((adminAddress as string) || "0xe85e...c6aE")}) trên mạng Avalanche Fuji để ký lệnh khấu trừ thế chấp.`,
      });
      return;
    }

    slashBrokerWrite({
      address: CONTRACT_ADDRESSES.universalEscrow,
      abi: UNIVERSAL_ESCROW_ABI,
      functionName: "adminSlashCorruptBroker",
      args: [activeEscrowId, compWei],
    });
  };

  const statusMap = ["ĐANG KÝ QUỸ", "ĐÃ TẤT TOÁN", "ĐÃ HỦY / HOÀN TIỀN", "ĐANG TRANH CHẤP"];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── CLEAN BANKING PAGE HEADER ───────────────────────────────────── */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 shrink-0">
              <Gavel className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
                  Hội đồng phân xử &amp; Khấu trừ thế chấp
                </h1>
                <span className="px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono font-semibold">
                  On-Chain Arbitration
                </span>
              </div>
              <p className="text-sm text-slate-400 max-w-2xl">
                Tiếp nhận khiếu nại, kiểm toán chứng từ giao dịch và thực thi khấu trừ thế chấp đối với GDTG vi phạm nghĩa vụ bảo chứng để bồi hoàn cho người dùng.
              </p>
            </div>
          </div>

          {/* Connected Address Permission Badge */}
          <div className="shrink-0">
            {isAdminOrTreasury ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Quyền quản trị hợp lệ (Admin / Treasury)</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold">
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Chế độ tra cứu công khai</span>
              </div>
            )}
          </div>
        </div>

        {!isAdminOrTreasury && (
          <div className="mt-4 pt-3.5 border-t border-slate-800 flex items-center gap-2.5 text-xs text-slate-400">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-slate-200">Tra cứu minh bạch:</strong> Mọi người dùng đều có thể kiểm tra hồ sơ tranh chấp trên chuỗi. Chỉ ví quản trị viên hệ thống (
              <code className="text-slate-200 font-mono">{shortenAddress((adminAddress as string) || "0x0")}</code>) mới có thẩm quyền thực thi lệnh khấu trừ thế chấp.
            </span>
          </div>
        )}
      </div>

      {/* ── ESCROW SELECTOR TOOLBAR ─────────────────────────────────────── */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Mã hợp đồng:
          </span>
          <div className="relative flex-1 sm:w-48">
            <input
              type="number"
              min="1"
              value={searchIdInput}
              onChange={(e) => setSearchIdInput(e.target.value)}
              placeholder="VD: 1, 2, 3..."
              className="w-full bg-[#0B0F17] border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg px-3 py-2 text-xs font-mono text-slate-100 tabular-nums transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (searchIdInput) {
                setActiveEscrowId(BigInt(searchIdInput));
              }
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-100 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Tra cứu hồ sơ</span>
          </button>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto justify-end flex-wrap">
          <span>Hợp đồng gần đây:</span>
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => {
                setSearchIdInput(num.toString());
                setActiveEscrowId(BigInt(num));
              }}
              className={`px-2.5 py-1 rounded-lg border text-xs font-mono tabular-nums transition-colors ${
                activeEscrowId === BigInt(num)
                  ? "bg-blue-600/20 border-blue-500/50 text-blue-300 font-bold"
                  : "bg-[#0B0F17] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
              }`}
            >
              #{num}
            </button>
          ))}
          {totalEscrowsCount ? (
            <span className="text-xs text-slate-500 ml-1">
              (Tổng: <span className="font-mono tabular-nums">{totalEscrowsCount.toString()}</span>)
            </span>
          ) : null}
        </div>
      </div>

      {/* ── MAIN 2-COLUMN DOSSIER & ARBITRATION CONSOLE ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANE: CONTRACT & BROKER DOSSIER (6 COLS) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Contract Dossier Card */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-bold text-slate-100">
                  Hồ sơ hợp đồng #{activeEscrowId.toString()}
                </h2>
              </div>
              {escrow ? (
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                    escrow.status === 0
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                      : escrow.status === 1
                      ? "bg-slate-800 text-slate-300 border-slate-700"
                      : "bg-red-500/10 text-red-400 border-red-500/30"
                  }`}
                >
                  {statusMap[escrow.status] || "KHÔNG XÁC ĐỊNH"}
                </span>
              ) : (
                <span className="text-xs text-slate-500">Chưa tải dữ liệu</span>
              )}
            </div>

            {escrow && escrow.buyer !== "0x0000000000000000000000000000000000000000" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-[#0B0F17] border border-slate-800/80">
                  <span className="text-xs text-slate-400">Giá trị ký quỹ hợp đồng:</span>
                  <span className="text-lg font-bold font-mono text-slate-100 tabular-nums">
                    {formatUsdc(escrow.amount)} USDC
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Buyer */}
                  <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Bên mua:</span>
                    <div className="flex items-center gap-2 font-mono text-slate-100">
                      <span>{shortenAddress(escrow.buyer)}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(escrow.buyer, "buyer")}
                        className="text-slate-400 hover:text-slate-100"
                        title="Sao chép địa chỉ Bên mua"
                      >
                        {copiedField === "buyer" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Seller */}
                  <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Bên bán:</span>
                    <div className="flex items-center gap-2 font-mono text-slate-100">
                      <span>{shortenAddress(escrow.seller)}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(escrow.seller, "seller")}
                        className="text-slate-400 hover:text-slate-100"
                        title="Sao chép địa chỉ Bên bán"
                      >
                        {copiedField === "seller" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Broker */}
                  <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                    <span className="text-slate-400">GDTG bảo chứng:</span>
                    <div className="flex items-center gap-2 font-mono text-amber-400 font-medium">
                      <span>{shortenAddress(escrow.broker)}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(escrow.broker, "broker")}
                        className="text-slate-400 hover:text-slate-100"
                        title="Sao chép địa chỉ GDTG"
                      >
                        {copiedField === "broker" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center justify-between py-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Thời hạn hợp đồng:</span>
                    <span className="text-slate-100">
                      <span className="font-mono tabular-nums">
                        {(Number(escrow.duration) / 3600).toFixed(1)}
                      </span>{" "}
                      giờ
                    </span>
                  </div>

                  {/* Start Time */}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-400">Thời điểm khởi tạo:</span>
                    <span className="font-mono tabular-nums text-slate-100">
                      {new Date(Number(escrow.startTime) * 1000).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Không tìm thấy dữ liệu hợp đồng cho mã #{activeEscrowId.toString()}.
              </div>
            )}
          </div>

          {/* Broker Collateral & Compliance Record */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-bold text-slate-100">
                  Hồ sơ thế chấp &amp; Lịch sử vi phạm GDTG
                </h2>
              </div>
              {brokerIsBlacklisted ? (
                <span className="px-2.5 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/30 text-[11px] font-semibold">
                  ĐÃ ĐÌNH CHỈ (BLACKLIST)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold">
                  ĐANG HOẠT ĐỘNG
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#0B0F17] border border-slate-800/80 rounded-lg p-4 space-y-1">
                <span className="text-xs text-slate-400 block">Vốn thế chấp Aave V3</span>
                <span className="text-base font-bold font-mono text-slate-100 tabular-nums block">
                  {formatUsdc(brokerStakedBalance)} USDC
                </span>
              </div>
              <div className="bg-[#0B0F17] border border-slate-800/80 rounded-lg p-4 space-y-1">
                <span className="text-xs text-slate-400 block">Số lần bị khấu trừ</span>
                <span
                  className={`text-base font-bold tabular-nums block ${
                    brokerSlashedCount > 0 ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  <span className="font-mono">{brokerSlashedCount}</span> lần
                </span>
              </div>
            </div>

            <div className="bg-[#0B0F17] border border-red-500/25 rounded-lg p-4 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Cơ chế bảo vệ &amp; bồi hoàn tự động</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Khi phát hiện GDTG vi phạm thỏa thuận hoặc từ chối thực hiện nghĩa vụ bảo chứng, hội đồng phân xử sẽ thực thi lệnh khấu trừ thế chấp trên chuỗi để hoàn trả vốn và bồi hoàn thiệt hại trực tiếp cho người dùng.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: COLLATERAL DEDUCTION CONSOLE (6 COLS) */}
        <div className="lg:col-span-6">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3.5 border-b border-slate-800">
              <Gavel className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-bold text-slate-100">
                Bảng điều khiển Khấu trừ thế chấp &amp; Bồi hoàn
              </h2>
            </div>

            {/* Execution Rules Box */}
            <div className="bg-[#0B0F17] border border-slate-800/80 rounded-lg p-4 space-y-2 text-xs">
              <span className="font-semibold text-slate-200 block uppercase tracking-wider">
                Quy trình thực thi lệnh khấu trừ thế chấp:
              </span>
              <ul className="space-y-1.5 text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-mono font-bold">1.</span>
                  <span>
                    Hoàn trả <strong className="text-slate-100">100% giá trị ký quỹ ({escrow ? formatUsdc(escrow.amount) : "0.00"} USDC)</strong> về ví Bên mua.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-mono font-bold">2.</span>
                  <span>
                    Khấu trừ bổ sung <strong className="text-red-400 font-mono">{compensationInput || "0"} USDC</strong> từ vốn thế chấp Aave V3 của GDTG để bồi hoàn thiệt hại.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-mono font-bold">3.</span>
                  <span>
                    Đình chỉ vĩnh viễn (<strong className="text-red-400">Blacklist</strong>) quyền hoạt động bảo chứng của GDTG vi phạm.
                  </span>
                </li>
              </ul>
            </div>

            {/* Slashing Parameters Form */}
            <form onSubmit={handleSlashSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Mã hợp đồng áp dụng (Escrow ID)
                </label>
                <input
                  type="text"
                  disabled
                  value={`Hợp đồng #${activeEscrowId.toString()}`}
                  className="w-full bg-[#0B0F17] border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-mono font-medium text-slate-400 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Mức khấu trừ thế chấp bồi hoàn (USDC)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={escrow ? Number(formatUsdc(escrow.amount)) : undefined}
                    disabled={!isAdminOrTreasury}
                    value={compensationInput}
                    onChange={(e) => setCompensationInput(e.target.value)}
                    placeholder="VD: 6.00"
                    className="w-full bg-[#0B0F17] border border-slate-700 focus:border-blue-500 focus:outline-none rounded-lg px-3.5 py-2.5 pr-16 text-xs font-mono text-slate-100 tabular-nums disabled:opacity-50 transition-colors"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                    USDC
                  </span>
                </div>
                <span className="text-xs text-slate-500 block mt-1.5">
                  Tối đa bằng 100% giá trị hợp đồng ({escrow ? formatUsdc(escrow.amount) : "0.00"} USDC), trích từ {formatUsdc(brokerStakedBalance)} USDC vốn thế chấp của GDTG trên Aave V3.
                </span>
              </div>

              {/* Settlement Summary Table */}
              <div className="bg-[#0B0F17] border border-slate-800/80 rounded-lg p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Hoàn trả tiền ký quỹ:</span>
                  <span className="text-emerald-400 font-mono tabular-nums font-bold">
                    +{escrow ? formatUsdc(escrow.amount) : "0.00"} USDC
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Khấu trừ thế chấp bồi hoàn:</span>
                  <span className="text-emerald-400 font-mono tabular-nums font-bold">
                    +{compensationInput || "0"} USDC
                  </span>
                </div>
                <div className="border-t border-slate-800 pt-2.5 flex justify-between text-sm font-bold">
                  <span className="text-slate-100">Tổng thực nhận Bên mua:</span>
                  <span className="text-emerald-400 font-mono tabular-nums">
                    {(
                      (escrow ? Number(formatUsdc(escrow.amount)) : 0) +
                      Number(compensationInput || 0)
                    ).toFixed(2)}{" "}
                    USDC
                  </span>
                </div>
              </div>

              {/* Confirmation Checkbox */}
              <label className="flex items-start gap-3 p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={evidenceConfirmed}
                  disabled={!isAdminOrTreasury}
                  onChange={(e) => setEvidenceConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                />
                <span className="text-xs text-slate-300 leading-relaxed select-none">
                  Tôi xác nhận đã đối soát toàn bộ chứng từ giao dịch và bằng chứng vi phạm của GDTG. Tôi đồng ý thực thi lệnh khấu trừ thế chấp và bồi hoàn trực tiếp cho Bên mua.
                </span>
              </label>

              {/* Action Button */}
              <ShimmerButton
                type="submit"
                variant="danger"
                disabled={
                  !isAdminOrTreasury ||
                  !evidenceConfirmed ||
                  !escrow ||
                  (escrow.status !== 0 && escrow.status !== 3) ||
                  isSlashPending ||
                  isSlashConfirming
                }
                className="w-full py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
              >
                <Gavel className="w-4 h-4" />
                <span>
                  {isSlashPending
                    ? "Đang chờ xác nhận ví..."
                    : isSlashConfirming
                    ? "Đang ghi nhận giao dịch..."
                    : "Thực thi Khấu trừ thế chấp & Bồi hoàn"}
                </span>
              </ShimmerButton>
            </form>
          </div>
        </div>
      </div>

      <TransactionFeedback
        status={txStatus}
        onClose={() => {
          setSimulatedTxStatus(null);
          resetSlash();
          refetchEscrow();
        }}
      />
    </div>
  );
}
