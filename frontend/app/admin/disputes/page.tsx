"use client";

import React, { useState } from "react";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  Search,
  AlertTriangle,
  Lock,
  CheckCircle2,
  FileText,
  UserX,
  Gavel,
  ShieldCheck,
  Copy,
  Headphones,
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
  const { address, isConnected } = useAccount();
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

  const txStatus: TxStatus = simulatedTxStatus || (isSlashPending
    ? { step: "awaiting_signature", actionTitle: "Tịch Thu Cọc Broker & Bồi Hoàn" }
    : isSlashConfirming
    ? { step: "confirming", txHash: slashTxHash, actionTitle: "Đang Xác Nhận Lệnh Bồi Hoàn" }
    : isSlashSuccess
    ? { step: "success", txHash: slashTxHash, actionTitle: "Đã Tịch Thu Cọc & Bồi Hoàn Thành Công!" }
    : slashError
    ? { step: "error", errorMessage: slashError.message, actionTitle: "Lệnh Xử Lý Vi Phạm Thất Bại" }
    : { step: "idle" });

  const handleSlashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminOrTreasury) return;
    if (!evidenceConfirmed) return;

    const compWei = parseUsdc(compensationInput || "0");

    if (!address || !slashBrokerWrite) {
      setSimulatedTxStatus({
        step: "error",
        actionTitle: "Yêu Cầu Ví Admin On-Chain",
        errorMessage: `Vui lòng kết nối đúng ví Admin (${shortenAddress((adminAddress as string) || "0xe85e...c6aE")}) trên mạng Avalanche Fuji để ký lệnh tịch thu cọc thật.`,
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

  const statusMap = ["ĐANG KHÓA TRONG KÉT", "ĐÃ HOÀN TẤT", "ĐÃ HỦY / HOÀN TIỀN", "ĐANG KHIẾU NẠI TRANH CHẤP"];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── TOP IDENTITY & ACCESS BANNER ─────────────────────────────────── */}
      <div className="card p-6 sm:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/12 border border-amber-400/25 flex items-center justify-center text-amber-400 shrink-0">
              <Gavel className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  Hội Đồng Trọng Tài &amp; Xử Lý Khiếu Nại
                </h1>
                <span className="badge-pill bg-indigo-500/15 text-indigo-300 border border-indigo-400/25">
                  On-Chain Arbitration
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Tiếp nhận và xử lý các trường hợp trung gian vi phạm thỏa thuận hoặc chậm trễ giải ngân để tịch thu tiền cọc bảo chứng bồi hoàn 100% cho người dùng.
              </p>
            </div>
          </div>

          {/* Connected Address Permission Pill */}
          <div className="shrink-0">
            {isAdminOrTreasury ? (
              <div className="badge-pill bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium py-1.5 px-3">
                <ShieldCheck className="w-4 h-4" />
                <span>Quyền Quản Trị Hợp Lệ (Admin / Treasury)</span>
              </div>
            ) : (
              <div className="badge-pill bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs py-1.5 px-3">
                <Lock className="w-4 h-4" />
                <span>Chế Độ Tra Cứu Minh Bạch</span>
              </div>
            )}
          </div>
        </div>

        {!isAdminOrTreasury && (
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center gap-2.5 text-xs text-slate-400">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-white">Chế độ Tra Cứu Công Khai:</strong> Bất kỳ ai cũng có thể tra cứu hồ sơ khiếu nại on-chain. Chỉ tài khoản quản trị viên (<code className="text-white font-mono">{shortenAddress(adminAddress as string || "0x0")}</code>) mới có quyền ký lệnh tịch thu cọc.
            </span>
          </div>
        )}
      </div>

      {/* ── ESCROW SELECTOR TOOLBAR ─────────────────────────────────────── */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Tra Cứu Mã Kèo:
          </span>
          <div className="relative flex-1 sm:w-56">
            <input
              type="number"
              min="1"
              value={searchIdInput}
              onChange={(e) => setSearchIdInput(e.target.value)}
              placeholder="VD: 1, 2, 3..."
              className="input-field py-2 text-xs font-mono"
            />
          </div>
          <button
            onClick={() => {
              if (searchIdInput) {
                setActiveEscrowId(BigInt(searchIdInput));
              }
            }}
            className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl text-xs font-medium text-white flex items-center gap-1.5 transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Tải Hồ Sơ</span>
          </button>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-2 text-xs text-slate-400 w-full sm:w-auto justify-end">
          <span>Kèo gần đây:</span>
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              onClick={() => {
                setSearchIdInput(num.toString());
                setActiveEscrowId(BigInt(num));
              }}
              className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors ${
                activeEscrowId === BigInt(num)
                  ? "bg-brand/20 border-brand text-white font-bold"
                  : "bg-white/[0.04] border-white/[0.06] text-slate-400 hover:text-white"
              }`}
            >
              #{num}
            </button>
          ))}
          {totalEscrowsCount ? (
            <span className="text-xs text-slate-500 ml-2">
              (Tổng: <span className="font-mono">{totalEscrowsCount.toString()}</span>)
            </span>
          ) : null}
        </div>
      </div>

      {/* ── MAIN 2-COLUMN DOSSIER & SLASHING CONSOLE ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT PANE: DISPUTE & BROKER DOSSIER (6 COLS) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Escrow Details Card */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-400" />
                <h2 className="section-title text-sm">
                  Hồ Sơ Két Sắt #{activeEscrowId.toString()}
                </h2>
              </div>
              {escrow ? (
                <span
                  className={`badge-pill ${
                    escrow.status === 0
                      ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/30"
                      : escrow.status === 1
                      ? "bg-slate-500/10 text-slate-400 border border-slate-500/30"
                      : "bg-red-500/10 text-red-400 border border-red-500/30"
                  }`}
                >
                  {statusMap[escrow.status] || "KHÔNG RÕ"}
                </span>
              ) : (
                <span className="text-xs text-slate-500">Chưa khởi tạo</span>
              )}
            </div>

            {escrow && escrow.buyer !== "0x0000000000000000000000000000000000000000" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl card-inner">
                  <span className="text-xs text-slate-400">Giá Trị Két Sắt Khóa:</span>
                  <span className="text-lg font-bold font-mono text-white tabular-nums">
                    {formatUsdc(escrow.amount)} USDC
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  {/* Buyer */}
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                    <span className="text-slate-400">Bên Mua (Nạn Nhân Tiềm Ẩn):</span>
                    <div className="flex items-center gap-2 font-mono text-white">
                      <span>{shortenAddress(escrow.buyer)}</span>
                      <button
                        onClick={() => copyToClipboard(escrow.buyer, "buyer")}
                        className="text-slate-500 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Seller */}
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                    <span className="text-slate-400">Bên Bán (Đối tác):</span>
                    <div className="flex items-center gap-2 font-mono text-white">
                      <span>{shortenAddress(escrow.seller)}</span>
                      <button
                        onClick={() => copyToClipboard(escrow.seller, "seller")}
                        className="text-slate-500 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Broker */}
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                    <span className="text-slate-400">GDTG Trung Gian:</span>
                    <div className="flex items-center gap-2 font-mono text-red-400 font-medium">
                      <span>{shortenAddress(escrow.broker)}</span>
                      <button
                        onClick={() => copyToClipboard(escrow.broker, "broker")}
                        className="text-slate-500 hover:text-white"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                    <span className="text-slate-400">Thời Hạn Kèo:</span>
                    <span className="text-white">
                      <span className="font-mono">{(Number(escrow.duration) / 3600).toFixed(1)}</span> Giờ
                    </span>
                  </div>

                  {/* Start Time */}
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-400">Thời Điểm Kích Hoạt:</span>
                    <span className="font-mono text-white">
                      {new Date(Number(escrow.startTime) * 1000).toLocaleString("vi-VN")}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Không tìm thấy dữ liệu hợp đồng cho ID #{activeEscrowId.toString()}.
              </div>
            )}
          </div>

          {/* Broker Staking Health */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <UserX className="w-4 h-4 text-red-400" />
                <h2 className="section-title text-sm">
                  Hồ Sơ Cọc & Lịch Sử Vi Phạm GDTG
                </h2>
              </div>
              {brokerIsBlacklisted ? (
                <span className="badge-pill bg-red-500/15 text-red-400 border border-red-500/30 font-bold">
                  ĐÃ BỊ BLACKLIST
                </span>
              ) : (
                <span className="badge-pill bg-emerald-400/10 text-emerald-400 border border-emerald-400/30">
                  CHƯA BỊ CẤM
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="card-inner p-4 space-y-1">
                <span className="text-xs text-slate-400 block">Cọc Đang Gửi Aave V3</span>
                <span className="text-base font-bold font-mono text-white tabular-nums block">
                  {formatUsdc(brokerStakedBalance)} USDC
                </span>
              </div>
              <div className="card-inner p-4 space-y-1">
                <span className="text-xs text-slate-400 block">Số Lần Bị Phạt</span>
                <span
                  className={`text-base font-bold tabular-nums block ${
                    brokerSlashedCount > 0 ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  <span className="font-mono">{brokerSlashedCount}</span> lần
                </span>
              </div>
            </div>

            <div className="card-inner p-4 bg-red-500/[0.06] border border-red-500/20 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Cơ Chế Bồi Thường Tức Thì</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Nếu Broker gian lận hoặc từ chối giải ngân/hoàn tiền theo đúng cam kết, quản trị viên sẽ áp dụng lệnh tịch thu cọc bảo chứng để bồi hoàn ngay 100% cho bên bị hại.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT PANE: SLASHING EXECUTION CONSOLE (6 COLS) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="card-elevated p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
              <Gavel className="w-4 h-4 text-red-400" />
              <h2 className="section-title text-sm">
                Bảng Điều Khiển Xử Phạt &amp; Bồi Hoàn
              </h2>
            </div>

            {/* Invariant Explanation Box */}
            <div className="card-inner p-4 space-y-2 text-xs">
              <span className="font-semibold text-white block uppercase tracking-wider">
                Quy Trình Tịch Thu Cọc &amp; Bồi Hoàn:
              </span>
              <ul className="space-y-1.5 text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">1.</span>
                  <span>
                    Hoàn trả <strong className="text-white">100% số tiền két sắt ({escrow ? formatUsdc(escrow.amount) : "0"} USDC)</strong> về ví Người Mua.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">2.</span>
                  <span>
                    Rút phạt thêm <strong className="text-red-400">{compensationInput || "0"} USDC</strong> từ Quỹ Cọc Aave V3 của Broker để bồi thường thiệt hại.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 font-bold">3.</span>
                  <span>
                    Vĩnh viễn gắn cờ <strong className="text-red-400">Blacklist</strong> và hủy tư cách Trung Gian của Broker.
                  </span>
                </li>
              </ul>
            </div>

            {/* Slashing Parameters Form */}
            <form onSubmit={handleSlashSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Mã Giao Dịch Bị Xử Phạt (Escrow ID)
                </label>
                <input
                  type="text"
                  disabled
                  value={`Kèo #${activeEscrowId.toString()}`}
                  className="input-field py-2.5 text-xs font-medium text-slate-400 cursor-not-allowed bg-black/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Mức Tiền Phạt Trừ Cọc Broker Bồi Thường (USDC)
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
                    className="input-field py-2.5 pr-14 text-xs font-mono disabled:opacity-50"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-mono text-slate-500">USDC</span>
                </div>
                <span className="text-xs text-slate-500 block mt-1">
                  Tối đa bằng 100% giá trị kèo ({escrow ? formatUsdc(escrow.amount) : "0"} USDC), trích từ cọc {formatUsdc(brokerStakedBalance)} USDC của Broker trên Aave.
                </span>
              </div>

              {/* Settlement Summary Table */}
              <div className="card-inner p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Hoàn Tiền Két Sắt:</span>
                  <span className="text-emerald-400 font-mono tabular-nums font-bold">
                    +{escrow ? formatUsdc(escrow.amount) : "0"} USDC
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Đền Bù Trừ Cọc:</span>
                  <span className="text-emerald-400 font-mono tabular-nums font-bold">
                    +{compensationInput || "0"} USDC
                  </span>
                </div>
                <div className="border-t border-white/[0.06] pt-2 flex justify-between text-sm font-bold">
                  <span className="text-white">Tổng Nạn Nhân Nhận:</span>
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
              <label className="flex items-start gap-3 p-3.5 rounded-xl card-inner cursor-pointer hover:border-white/[0.1] transition-colors">
                <input
                  type="checkbox"
                  checked={evidenceConfirmed}
                  disabled={!isAdminOrTreasury}
                  onChange={(e) => setEvidenceConfirmed(e.target.checked)}
                  className="mt-0.5 rounded border-white/[0.1] bg-black/50 text-brand focus:ring-0"
                />
                <span className="text-xs text-slate-300 leading-relaxed select-none">
                  Tôi xác nhận đã kiểm toán toàn bộ chứng từ và bằng chứng vi phạm của Broker. Tôi thực thi lệnh tịch thu cọc bảo chứng và bồi hoàn trực tiếp cho người dùng.
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
                className="w-full py-3.5 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-40"
              >
                <Gavel className="w-4 h-4" />
                <span>
                  {isSlashPending
                    ? "Đang Chờ Ký Ví..."
                    : isSlashConfirming
                    ? "Đang Xác Nhận Giao Dịch..."
                    : "Thực Thi Tịch Thu Cọc & Bồi Hoàn Nạn Nhân"}
                </span>
              </ShimmerButton>
            </form>
          </div>
        </div>
      </div>

      <TransactionFeedback
        status={txStatus}
        onClose={() => {
          resetSlash();
          refetchEscrow();
        }}
      />
    </div>
  );
}
