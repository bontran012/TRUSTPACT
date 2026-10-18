"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Star, ArrowRight, AlertTriangle, Lock, 
  Coins, CheckCircle2, ShieldCheck, Zap, Shield, Check,
  Sparkles, FileText, ExternalLink, HelpCircle
} from "lucide-react";
import { AvalancheIcon, UsdcIcon, AaveIcon } from "../../components/CryptoIcons";
import { useStore } from "../../lib/store";
import { Identicon } from "../../components/Identicon";
import { AddressCopy } from "../../components/AddressCopy";
import { StatusBadge } from "../../components/StatusBadge";

function CreateDealContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { brokers, createDeal } = useStore();

  const initialBrokerId = searchParams.get("broker") || brokers[0]?.id || "broker-nam";
  const initialAmount = parseFloat(searchParams.get("amount") || "1000") || 1000;

  // Form State
  const [title, setTitle] = useState("Chuyển giao quyền sở hữu tài khoản Liên Quân Mobile VIP Full Skin");
  const [category, setCategory] = useState("Tài Sản Kỹ Thuật Số & Trò Chơi");
  const [dealAmount, setDealAmount] = useState<number>(initialAmount);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>(initialBrokerId);
  const [sellerAddress, setSellerAddress] = useState<string>("0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002");
  const [notes, setNotes] = useState("Bàn giao quyền quản trị tài khoản kèm văn bản cam kết bảo mật quyền sở hữu trong vòng 15 phút.");
  
  // Step 3: Aave Yield Mode Toggle
  const [enableAaveYield, setEnableAaveYield] = useState<boolean>(true);

  const categories = [
    "Tài Sản Kỹ Thuật Số & Trò Chơi", 
    "Thương Mại & Ngoại Hối OTC", 
    "Mã Nguồn & Dịch Vụ Công Nghệ", 
    "Khác"
  ];

  // Update selection if params change
  useEffect(() => {
    const bId = searchParams.get("broker");
    if (bId) setSelectedBrokerId(bId);
    const amt = searchParams.get("amount");
    if (amt) setDealAmount(parseFloat(amt) || 1000);
  }, [searchParams]);

  const chosenBroker = brokers.find((b) => b.id === selectedBrokerId) || brokers[0];
  const maxLimit = chosenBroker ? chosenBroker.maxLimit : 0;
  const isOverLimit = dealAmount > maxLimit;

  // Real-time Math & Fee Breakdown
  const brokerFee = +(dealAmount * 0.015).toFixed(2); // 1.5%
  const protocolFee = +(dealAmount * 0.003).toFixed(2); // 0.3%
  const sellerReceives = +(dealAmount - brokerFee - protocolFee).toFixed(2);
  const estDailyAaveYield = enableAaveYield ? +((dealAmount * 0.052) / 365 * 0.8).toFixed(4) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenBroker) return;

    if (isOverLimit) {
      alert(`Giá trị hợp đồng (${dealAmount} USDC) vượt quá hạn mức tối đa cho phép (${maxLimit} USDC) của Thương nhân ${chosenBroker.name}. Kính đề nghị lựa chọn Thương nhân có tài sản đảm bảo lớn hơn.`);
      return;
    }

    const newDealId = createDeal({
      title,
      category,
      amount: dealAmount,
      sellerAddress,
      brokerId: chosenBroker.id,
    });

    router.push(`/room/${newDealId}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 space-y-8">
      
      {/* Top Header Banner - Clean Web3 Dark Glass */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#080B11]/90 border border-white/[0.08] shadow-md relative overflow-hidden">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
          <Lock className="w-3.5 h-3.5" />
          <span>UniversalEscrow.sol — Két Sắt Ký Quỹ Ba Bên</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Khởi Tạo Hợp Đồng Ký Quỹ & Chỉ Định Giám Định
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-3xl mt-1.5 font-normal">
          Nguồn quỹ Bên Mua được bảo lưu an toàn trong Smart Contract trên Avalanche Fuji C-Chain. Bên Bán bàn giao tài sản. Chỉ khi Bên Trung Gian kiểm định hợp lệ, tiền mới được giải ngân tức thời trong 0.8 giây.
        </p>
      </div>

      {/* Main Studio Two-Column Grid */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          
          {/* =========================================================================
              LEFT COLUMN: MULTI-STEP INPUT FORM (7 Cols)
              ========================================================================= */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* STEP 1: Đối Tác & Số Tiền Ký Quỹ */}
            <div className="p-6 rounded-2xl bg-[#080B11]/90 border border-white/[0.08] shadow-md space-y-5">
              <div className="flex items-center space-x-3 pb-3.5 border-b border-white/[0.06]">
                <div className="w-7 h-7 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Thông Tin Đối Tác & Số Tiền Ký Quỹ
                  </h2>
                  <span className="text-xs text-slate-400">Xác định rõ tài sản chuyển giao và quyền thụ hưởng</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5 uppercase tracking-wider">
                    Nội dung đối tượng giao dịch:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Chuyển giao tài sản kỹ thuật số, Bản quyền mã nguồn phần mềm..."
                    className="w-full bg-[#05070B] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1.5 uppercase tracking-wider">
                      Phân loại danh mục:
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#05070B] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1.5 uppercase tracking-wider">
                      Địa chỉ ví Bên Bán (Người thụ hưởng):
                    </label>
                    <input
                      type="text"
                      value={sellerAddress}
                      onChange={(e) => setSellerAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-[#05070B] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Số tiền Bên Mua sẽ nạp vào Kho Ký Quỹ (USDC):
                    </label>
                    <span className="text-xs font-mono text-slate-400">
                      ≈ {(dealAmount * 25400).toLocaleString("vi-VN")} VNĐ
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      min="10"
                      step="10"
                      value={dealAmount}
                      onChange={(e) => setDealAmount(Math.max(10, parseFloat(e.target.value) || 0))}
                      className="w-full bg-[#05070B] border border-white/[0.08] rounded-xl pl-4 pr-24 py-3 text-base sm:text-lg font-mono font-bold text-white focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs font-medium text-slate-200">
                      <UsdcIcon className="w-4 h-4" />
                      <span>USDC</span>
                    </div>
                  </div>

                  {/* Preset chips */}
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[100, 500, 1000, 2500].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDealAmount(preset)}
                        className={`py-1.5 rounded-lg text-xs font-mono transition-colors ${
                          dealAmount === preset
                            ? "bg-blue-600 text-white font-medium border border-blue-500"
                            : "bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:text-white"
                        }`}
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: Chọn Thương Nhân Bảo Chứng (Web3 Identicons & Staking Quota) */}
            <div className="p-6 rounded-2xl bg-[#080B11]/90 border border-white/[0.08] shadow-md space-y-4">
              <div className="flex items-center space-x-3 pb-3.5 border-b border-white/[0.06]">
                <div className="w-7 h-7 rounded-lg bg-blue-600/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Chọn Thương Nhân Bảo Chứng (GDTG)
                  </h2>
                  <span className="text-xs text-slate-400">Chọn thương nhân có tài sản đảm bảo đạt chuẩn tỷ lệ an toàn (≤120%)</span>
                </div>
              </div>

              <div className="space-y-2.5">
                {brokers.map((broker) => {
                  const isSelected = selectedBrokerId === broker.id;
                  const isBrokerOverLimit = dealAmount > broker.maxLimit;
                  return (
                    <div
                      key={broker.id}
                      onClick={() => setSelectedBrokerId(broker.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                        isSelected
                          ? "bg-blue-950/25 border-blue-500/60 shadow-sm"
                          : "bg-[#05070B] border-white/[0.06] hover:border-white/[0.08]"
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <Identicon address={broker.address} size={42} rankBadge={broker.badge} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-bold text-white flex items-center space-x-2">
                            <span className="truncate">{broker.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-slate-400 shrink-0">
                              {broker.category}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2.5 text-xs text-slate-400 mt-1">
                            <span className="text-emerald-400 font-mono font-medium flex items-center space-x-1">
                              <AaveIcon className="w-3 h-3" />
                              <span>Cọc: {broker.stakedAmount.toLocaleString()} USDC</span>
                            </span>
                            <span>•</span>
                            <span className="text-amber-400 flex items-center space-x-1 font-semibold">
                              <Star className="w-3 h-3 fill-amber-400" />
                              <span>{broker.rating} ({broker.completedDeals} kèo)</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right sm:border-l sm:border-white/[0.06] sm:pl-4 shrink-0">
                        <div className="text-[11px] text-slate-400">Hạn mức nhận kèo:</div>
                        <div className="text-xs sm:text-sm font-mono font-bold text-white">
                          {broker.maxLimit.toLocaleString()} USDC
                        </div>
                        {isBrokerOverLimit ? (
                          <div className="text-[10px] text-rose-400 font-medium mt-0.5 flex items-center space-x-1 justify-end">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Vượt hạn mức</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-400 font-medium mt-0.5 flex items-center space-x-1 justify-end">
                            <Check className="w-3 h-3" />
                            <span>Đủ chuẩn bảo chứng</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: Tùy Chọn Sinh Lời Aave V3 Trong Lúc Chờ (DeFi Yield Mode) */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/20 via-slate-900 to-[#0f131c] border border-emerald-500/30 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-emerald-500/20">
                <div className="flex items-center space-x-3">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    03
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                      <span>Kích Hoạt Sinh Lời Aave V3</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                        +5.20% APY
                      </span>
                    </h2>
                    <span className="text-xs text-slate-400">Tối ưu hóa nguồn vốn trong thời gian đối soát</span>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() => setEnableAaveYield(!enableAaveYield)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    enableAaveYield ? "bg-emerald-500" : "bg-slate-700"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      enableAaveYield ? "translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
                <p>
                  Khi bật chế độ này, nguồn tiền {dealAmount.toLocaleString()} USDC của Bên Mua trong lúc chờ bàn giao sẽ được gửi tự động vào <strong>Lending Pool Aave V3 (Fuji C-Chain)</strong>.
                </p>
                <div className="p-3 rounded-xl bg-[#05070B] border border-emerald-500/20 flex items-center justify-between font-mono">
                  <span className="text-slate-400">Lợi tức thực nhận dự kiến:</span>
                  <span className="text-emerald-400 font-bold">
                    {enableAaveYield ? `~+${estDailyAaveYield} USDC / ngày` : "Đang tắt"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Cơ chế 80/20: 80% lợi tức chia sẻ cho người dùng, 20% duy trì giao thức.</span>
                </div>
              </div>
            </div>

          </div>

          {/* =========================================================================
              RIGHT COLUMN: LIVE SMART CONTRACT RECEIPT (5 Cols)
              ========================================================================= */}
          <div className="lg:col-span-5 sticky top-24 space-y-5">
            
            <div className="p-6 rounded-2xl bg-[#080B11]/90 border border-white/[0.08] shadow-2xl space-y-5 relative overflow-hidden">
              {/* Receipt Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white text-sm">Hóa Đơn Smart Contract (Live Receipt)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                  UniversalEscrow.sol
                </span>
              </div>

              {/* Real-time Math Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-300">
                  <span>Số tiền Bên Mua ký quỹ:</span>
                  <span className="font-mono font-bold text-white text-base">
                    {dealAmount.toLocaleString()} USDC
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>Phí dịch vụ trung gian (1.5%):</span>
                  <span className="font-mono text-amber-400">-{brokerFee} USDC</span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>Phí duy trì hạ tầng giao thức (0.3%):</span>
                  <span className="font-mono text-slate-400">-{protocolFee} USDC</span>
                </div>

                {enableAaveYield && (
                  <div className="flex justify-between items-center text-emerald-400">
                    <span>Lợi tức Aave tích lũy (5.2% APY):</span>
                    <span className="font-mono font-semibold">+Tự động sinh lãi</span>
                  </div>
                )}

                <div className="pt-3 border-t border-white/[0.06] flex justify-between items-center">
                  <span className="font-bold text-white text-xs sm:text-sm">Bên Bán thực nhận khi hoàn tất:</span>
                  <span className="font-mono text-xl font-bold text-emerald-400">
                    {sellerReceives.toLocaleString()} USDC
                  </span>
                </div>
              </div>

              {/* Chosen Broker Guarantee Card */}
              {chosenBroker && (
                <div className="p-3.5 rounded-xl bg-[#05070B] border border-white/[0.06] space-y-2">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Bảo chứng bởi Thương nhân</div>
                  <div className="flex items-center space-x-2.5">
                    <Identicon address={chosenBroker.address} size={36} rankBadge={chosenBroker.badge} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{chosenBroker.name}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        Cọc Aave: {chosenBroker.stakedAmount.toLocaleString()} USDC
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1.5 border-t border-white/[0.06] leading-relaxed">
                    🛡️ Cơ chế Slashing: Sàn tự động trích cọc bồi thường 100% nếu phát hiện thương nhân gian lận.
                  </div>
                </div>
              )}

              {/* Contract Target Address */}
              <div className="p-3 rounded-xl bg-[#05070B] border border-white/[0.06] space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Kho Hợp Đồng Ký Quỹ</span>
                <AddressCopy
                  address="0x51E2b1239c09d57aC7bAfF094553b6A1B022B854"
                  truncateLength={6}
                  badgeLabel="UniversalEscrow"
                />
              </div>

              {/* Over Limit Warning */}
              {isOverLimit && (
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/40 text-rose-300 text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>
                    Giá trị hợp đồng vượt quá hạn mức tối đa ({maxLimit} USDC) của thương nhân này. Hãy tăng vốn cọc hoặc chọn thương nhân khác.
                  </span>
                </div>
              )}

              {/* Submit CTA Button */}
              <button
                type="submit"
                disabled={isOverLimit}
                className={`w-full py-3.5 rounded-xl font-semibold text-xs sm:text-sm shadow-md flex items-center justify-center space-x-2 transition-colors ${
                  isOverLimit
                    ? "bg-white/[0.04] text-slate-500 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Xác Nhận Phong Tỏa Quỹ & Vào Phòng Đối Soát</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-slate-500 text-center flex items-center justify-center space-x-2">
                <AvalancheIcon className="w-3.5 h-3.5" />
                <span>Xác nhận mật mã Avalanche Fuji C-Chain • Gas &lt; $0.01</span>
              </div>
            </div>

          </div>

        </div>
      </form>

    </div>
  );
}

export default function CreateDealPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-400 font-mono text-xs">Đang khởi tạo studio ký quỹ...</div>}>
      <CreateDealContent />
    </Suspense>
  );
}
