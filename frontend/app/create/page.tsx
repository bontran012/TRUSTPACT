"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Star, ArrowRight, AlertTriangle, Lock,
  Coins, CheckCircle2, ShieldCheck, Check,
  Sparkles, FileText
} from "lucide-react";
import { AvalancheIcon, UsdcIcon, AaveIcon } from "../../components/CryptoIcons";
import { useStore } from "../../lib/store";
import { Identicon } from "../../components/Identicon";
import { AddressCopy } from "../../components/AddressCopy";

function CreateDealContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { brokers, createDeal } = useStore();

  const initialBrokerId = searchParams.get("broker") || brokers[0]?.id || "broker-nam";
  const initialAmount = parseFloat(searchParams.get("amount") || "1000") || 1000;

  const [title, setTitle] = useState("Chuyển giao quyền sở hữu tài khoản Liên Quân Mobile VIP Full Skin");
  const [category, setCategory] = useState("Tài Sản Kỹ Thuật Số & Trò Chơi");
  const [dealAmount, setDealAmount] = useState<number>(initialAmount);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>(initialBrokerId);
  const [sellerAddress, setSellerAddress] = useState<string>("0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002");
  const [enableAaveYield, setEnableAaveYield] = useState<boolean>(true);

  const categories = [
    "Tài Sản Kỹ Thuật Số & Trò Chơi",
    "Thương Mại & Ngoại Hối OTC",
    "Mã Nguồn & Dịch Vụ Công Nghệ",
    "Khác"
  ];

  useEffect(() => {
    const bId = searchParams.get("broker");
    if (bId) setSelectedBrokerId(bId);
    const amt = searchParams.get("amount");
    if (amt) setDealAmount(parseFloat(amt) || 1000);
  }, [searchParams]);

  const chosenBroker = brokers.find((b) => b.id === selectedBrokerId) || brokers[0];
  const maxLimit = chosenBroker ? chosenBroker.maxLimit : 0;
  const isOverLimit = dealAmount > maxLimit;

  const brokerFee = +(dealAmount * 0.015).toFixed(2);
  const protocolFee = +(dealAmount * 0.003).toFixed(2);
  const sellerReceives = +(dealAmount - brokerFee - protocolFee).toFixed(2);
  const estDailyAaveYield = enableAaveYield ? +((dealAmount * 0.052) / 365 * 0.8).toFixed(4) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chosenBroker) return;
    if (isOverLimit) {
      alert(`Giá trị hợp đồng (${dealAmount} USDC) vượt quá hạn mức tối đa (${maxLimit.toLocaleString()} USDC) của thương nhân ${chosenBroker.name}.`);
      return;
    }
    const newDealId = createDeal({ title, category, amount: dealAmount, sellerAddress, brokerId: chosenBroker.id });
    router.push(`/room/${newDealId}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 space-y-8">

      {/* HEADER BANNER */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-[#0F172A] via-[#0B1120] to-[#070B14] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-80 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 text-slate-300 text-xs font-mono mb-3">
          <Lock className="w-3.5 h-3.5 text-blue-400" />
          <span>UniversalEscrow.sol — Két Sắt Ký Quỹ Ba Bên</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Khởi Tạo Hợp Đồng Ký Quỹ Mới
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl mt-1.5 font-normal">
          Nguồn quỹ Bên Mua được bảo vệ an toàn trong Smart Contract trên Avalanche Fuji C-Chain.
          Bên Bán bàn giao tài sản. Chỉ khi Trung Gian kiểm định hợp lệ, tiền mới được giải ngân tức thời trong 0.8 giây.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">

          {/* LEFT COLUMN: MULTI-STEP FORM */}
          <div className="lg:col-span-7 space-y-6">

            {/* STEP 1: Đối tác & Số tiền */}
            <div className="p-6 rounded-2xl bg-[#0D1424]/90 border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center gap-3 pb-3.5 border-b border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Thông Tin Đối Tác &amp; Số Tiền Ký Quỹ
                  </h2>
                  <span className="text-xs text-slate-400">Xác định tài sản chuyển giao và quyền thụ hưởng</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1.5 uppercase tracking-wider">
                    Nội dung giao dịch:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ví dụ: Chuyển giao tài sản kỹ thuật số, bàn quyền mã nguồn..."
                    className="w-full bg-[#060A14] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
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
                      className="w-full bg-[#060A14] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1.5 uppercase tracking-wider">
                      Địa chỉ ví Bên Bán (Người nhận):
                    </label>
                    <input
                      type="text"
                      value={sellerAddress}
                      onChange={(e) => setSellerAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-[#060A14] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-xs font-medium text-slate-300 uppercase tracking-wider">
                      Số tiền Bên Mua sẽ nạp vào két (USDC):
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
                      className="w-full bg-[#060A14] border border-slate-700 rounded-xl pl-4 pr-24 py-3 text-lg font-mono font-bold text-white focus:outline-none focus:border-blue-500 transition-colors"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200">
                      <UsdcIcon className="w-4 h-4" />
                      <span>USDC</span>
                    </div>
                  </div>

                  {/* Preset chips */}
                  <div className="grid grid-cols-4 gap-2 mt-2.5">
                    {[100, 500, 1000, 2500].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDealAmount(preset)}
                        className={`py-1.5 rounded-lg text-xs font-mono transition-all ${
                          dealAmount === preset
                            ? "bg-blue-600 text-white font-bold border border-blue-500 shadow-sm"
                            : "bg-[#060A14] border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
                      >
                        ${preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: Chọn Broker */}
            <div className="p-6 rounded-2xl bg-[#0D1424]/90 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center gap-3 pb-3.5 border-b border-slate-800">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs">
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
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                        isSelected
                          ? "bg-blue-950/30 border-blue-500/60 shadow-md ring-1 ring-blue-500/30"
                          : "bg-[#060A14] border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <Identicon address={broker.address} size={42} rankBadge={broker.badge} />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                            <span className="truncate">{broker.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 shrink-0 font-medium">
                              {broker.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                            <span className="text-emerald-400 font-mono font-medium flex items-center gap-1">
                              <AaveIcon className="w-3 h-3" />
                              Cọc Aave: {broker.stakedAmount.toLocaleString()} USDC
                            </span>
                            <span className="text-slate-600">·</span>
                            <span className="text-amber-400 flex items-center gap-1 font-semibold">
                              <Star className="w-3 h-3 fill-amber-400" />
                              {broker.rating} ({broker.completedDeals} kèo)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right sm:border-l sm:border-slate-800 sm:pl-4 shrink-0">
                        <div className="text-[11px] text-slate-400">Hạn mức nhận kèo:</div>
                        <div className="text-xs sm:text-sm font-mono font-bold text-white">
                          {broker.maxLimit.toLocaleString()} USDC
                        </div>
                        {isBrokerOverLimit ? (
                          <div className="text-[10px] text-red-400 font-medium mt-0.5 flex items-center gap-1 justify-end">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Vượt hạn mức</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-emerald-400 font-medium mt-0.5 flex items-center gap-1 justify-end">
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

            {/* STEP 3: Aave Yield Mode */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/25 via-[#0D1424] to-[#0A0E1A] border border-emerald-500/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    03
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span>Kích Hoạt Sinh Lời Aave V3</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold">
                        +5.20% APY
                      </span>
                    </h2>
                    <span className="text-xs text-slate-400">Tối ưu hóa nguồn vốn trong thời gian đối soát</span>
                  </div>
                </div>

                {/* Toggle */}
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
                <div className="p-3 rounded-xl bg-[#060A14] border border-emerald-500/20 flex items-center justify-between font-mono">
                  <span className="text-slate-400">Lợi tức thực nhận dự kiến:</span>
                  <span className="text-emerald-400 font-bold">
                    {enableAaveYield ? `~+${estDailyAaveYield} USDC / ngày` : "Đang tắt"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Cơ chế 80/20: 80% lợi tức chia sẻ cho người dùng, 20% duy trì giao thức.</span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: LIVE RECEIPT */}
          <div className="lg:col-span-5 sticky top-24 space-y-5">
            <div className="p-6 rounded-2xl bg-[#0D1424]/90 border border-slate-800 shadow-2xl space-y-5">
              {/* Receipt Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-white text-sm">Hóa Đơn Smart Contract (Live)</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                  UniversalEscrow.sol
                </span>
              </div>

              {/* Fee Breakdown */}
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

                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-white text-sm">Bên Bán thực nhận khi hoàn tất:</span>
                  <span className="font-mono text-xl font-bold text-emerald-400">
                    {sellerReceives.toLocaleString()} USDC
                  </span>
                </div>
              </div>

              {/* Chosen Broker Guarantee Card */}
              {chosenBroker && (
                <div className="p-3.5 rounded-xl bg-[#060A14] border border-slate-800 space-y-2">
                  <div className="text-[11px] text-slate-400 uppercase font-semibold">Bảo chứng bởi Thương nhân</div>
                  <div className="flex items-center gap-2.5">
                    <Identicon address={chosenBroker.address} size={36} rankBadge={chosenBroker.badge} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{chosenBroker.name}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        Cọc Aave: {chosenBroker.stakedAmount.toLocaleString()} USDC
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1.5 border-t border-slate-800 leading-relaxed">
                    🛡️ Cơ chế Slashing: Sàn tự động trích cọc bồi thường 100% nếu phát hiện gian lận.
                  </div>
                </div>
              )}

              {/* Contract Address */}
              <div className="p-3 rounded-xl bg-[#060A14] border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono block">Kho Hợp Đồng Ký Quỹ</span>
                <AddressCopy
                  address="0x51E2b1239c09d57aC7bAfF094553b6A1B022B854"
                  truncateLength={6}
                  badgeLabel="UniversalEscrow"
                />
              </div>

              {/* Over Limit Warning */}
              {isOverLimit && (
                <div className="p-3.5 rounded-xl bg-red-950/30 border border-red-500/40 text-red-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>
                    Giá trị hợp đồng vượt quá hạn mức tối đa ({maxLimit.toLocaleString()} USDC) của thương nhân này. Hãy tăng vốn cọc hoặc chọn thương nhân khác.
                  </span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isOverLimit}
                className={`w-full py-3.5 rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 ${
                  isOverLimit
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25"
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>Phong Tỏa Quỹ &amp; Vào Phòng Giao Dịch</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-2">
                <AvalancheIcon className="w-3.5 h-3.5" />
                <span>Avalanche Fuji C-Chain • Gas &lt; $0.01</span>
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
