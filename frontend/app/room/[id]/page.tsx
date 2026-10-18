"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { 
  CheckCircle2, Send, Star, RefreshCw, Copy, Check, 
  Lock, AlertTriangle, Image as ImageIcon, 
  Clock, Zap, Sparkles, X, ShieldCheck, FileCheck, ExternalLink
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import { useStore } from "../../../lib/store";
import { Identicon } from "../../../components/Identicon";
import { AddressCopy } from "../../../components/AddressCopy";
import { StatusBadge } from "../../../components/StatusBadge";
import { StepProgress } from "../../../components/StepProgress";
import { LiveYieldCounter } from "../../../components/LiveYieldCounter";

export default function DealRoomPage() {
  const params = useParams();
  const rawId = (params?.id as string) || "101";
  const dealId = rawId === "1" ? "101" : rawId;

  const { 
    role, getDeal, getMessagesForDeal, 
    sendMessage, brokerRelease, brokerRefund, rateAndTip, brokers 
  } = useStore();

  const [copied, setCopied] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [ratingModal, setRatingModal] = useState(false);
  const [stars, setStars] = useState(5);
  const [tip, setTip] = useState("2");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Retrieve current deal or fallback to deal #101
  const currentDeal = getDeal(dealId) || {
    id: dealId,
    title: `Hợp đồng ký quỹ #${dealId}`,
    category: "Tài Sản Kỹ Thuật Số & Trò Chơi",
    amount: 100,
    brokerFeeBps: 150,
    buyerAddress: "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
    sellerAddress: "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
    brokerId: "broker-nam",
    brokerName: "Nguyễn Nam (Giám Định Tài Sản Số)",
    status: "LOCKED" as const,
    createdAt: "18/10/2026 00:20",
    deliveryConfirmed: true,
    rated: false,
  };

  const dealBroker = brokers.find((b) => b.id === currentDeal.brokerId) || brokers[0];
  const messages = getMessagesForDeal(dealId);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendMessage(dealId, inputMessage.trim());
    setInputMessage("");
  };

  const handleSendSampleEvidence = () => {
    sendMessage(
      dealId,
      "Đã gửi mã băm IPFS: ipfs://QmZtMD2qtWBS7Y6Yv4zF8... Biên bản kiểm định quyền sở hữu tài sản hợp lệ."
    );
  };

  const onBrokerRelease = () => {
    brokerRelease(dealId);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    // Auto show rating modal for buyer perspective
    setTimeout(() => {
      setRatingModal(true);
    }, 800);
  };

  const onBrokerRefund = () => {
    if (confirm("Xác nhận hoàn quỹ 100% từ Kho Ký Quỹ Thông Minh về ví Bên Mua?")) {
      brokerRefund(dealId);
    }
  };

  const onSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    const tipVal = parseFloat(tip) || 0;
    rateAndTip(dealId, stars, tipVal);
    setRatingModal(false);
    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.5 },
    });
  };

  // Determine active step for Stepper (1 to 4)
  const activeStep: 1 | 2 | 3 | 4 = 
    currentDeal.status === "COMPLETED" || currentDeal.status === "CANCELLED"
      ? 4
      : currentDeal.deliveryConfirmed
      ? 3
      : 2;

  // Dynamic QR Code data for Avalanche Core Wallet
  const qrData = `ethereum:0x51E2b1239c09d57aC7bAfF094553b6A1B022B854@43113?uint256=${currentDeal.amount}e6`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 space-y-6">
      
      {/* =========================================================================
          HEADER BAR: DEAL INFO & SHARE LINK
          ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#080B11]/90 border border-white/[0.08] shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-md bg-blue-600/15 border border-blue-500/30 text-blue-400">
              HỢP ĐỒNG #{currentDeal.id}
            </span>
            <span className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
              {currentDeal.title}
            </span>
            <StatusBadge status={currentDeal.status} />
          </div>

          <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2.5 font-normal">
            <span>Danh mục: <strong className="text-slate-200">{currentDeal.category}</strong></span>
            <span>•</span>
            <span>Trung gian giám sát: <strong className="text-amber-400 font-medium">{currentDeal.brokerName}</strong></span>
            <span>•</span>
            <span>Khởi tạo: <strong className="text-slate-300 font-mono">{currentDeal.createdAt}</strong></span>
          </div>
        </div>

        {/* Share Room Button */}
        <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
          <button
            onClick={handleCopyLink}
            className="w-full md:w-auto inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-slate-200 font-medium transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Đã Sao Chép Liên Kết" : "Sao Chép Liên Kết Phòng"}</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          HORIZONTAL STEPPER (1. Created -> 2. Funded & Yield -> 3. Delivered -> 4. Settled)
          ========================================================================= */}
      <StepProgress currentStep={activeStep} status={currentDeal.status} />

      {/* =========================================================================
          3-COLUMN WORK TERMINAL
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* =========================================================================
            LEFT COLUMN: ESCROW VAULT, LIVE AAVE YIELD COUNTER & CORE QR (4 Cols)
            ========================================================================= */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Real-time Aave Yield Ticker Component (The "Showstopper") */}
          <LiveYieldCounter
            principalAmount={currentDeal.amount}
            apy={5.2}
            baseYield={0.0428}
          />

          {/* Vault Balance Card */}
          <div className="p-5 rounded-2xl bg-[#080B11]/90 border border-white/[0.08] shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center space-x-2 text-xs font-bold text-white uppercase tracking-wider">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Kho Ký Quỹ Thông Minh</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.08]">
                UniversalEscrow.sol
              </span>
            </div>

            <div className="bg-[#05070B] rounded-xl p-4 text-center border border-white/[0.06] space-y-1">
              <span className="text-xs text-slate-400 block font-normal">Giá Trị Ký Quỹ Được Bảo Chứng</span>
              <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tracking-tight">
                {currentDeal.amount.toLocaleString()} USDC
              </div>
              <span className="text-xs text-slate-500 block font-mono">
                (~{(currentDeal.amount * 25400).toLocaleString()} VNĐ quy đổi)
              </span>
            </div>

            {/* Participants Info with AddressCopy & Identicon */}
            <div className="space-y-2.5 pt-2 text-xs border-t border-white/[0.06]">
              <div className="flex justify-between items-center text-slate-400">
                <span>Bên Mua (Người nạp):</span>
                <AddressCopy address={currentDeal.buyerAddress} truncateLength={4} showExplorerLink={false} />
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Bên Bán (Thụ hưởng):</span>
                <AddressCopy address={currentDeal.sellerAddress} truncateLength={4} showExplorerLink={false} />
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Thương nhân giám định:</span>
                <span className="font-semibold text-amber-400 text-xs">
                  {currentDeal.brokerName}
                </span>
              </div>
            </div>

            {/* Avalanche Core QR Code */}
            <div className="space-y-2 pt-3 border-t border-white/[0.06] text-center">
              <span className="text-xs text-slate-300 block font-medium">
                Quét Mã Thanh Toán Ví Avalanche Core:
              </span>
              <div className="inline-block p-2.5 bg-white rounded-xl shadow-md">
                <QRCodeSVG value={qrData} size={125} level="M" />
              </div>
              <span className="text-[11px] text-slate-400 block font-mono">
                Finality 0.8s • Gas &lt; $0.01
              </span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            MIDDLE COLUMN: 3-PARTY CHAT & CRYPTOGRAPHIC EVIDENCE TERMINAL (5 Cols)
            ========================================================================= */}
        <div className="lg:col-span-5 rounded-2xl bg-[#080B11]/90 border border-white/[0.08] flex flex-col h-[640px] overflow-hidden shadow-md">
          
          {/* Chat Header */}
          <div className="px-5 py-3 border-b border-white/[0.06] bg-[#05070B] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-white tracking-wide">Kênh Đàm Phán & Đối Soát Trực Tuyến</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Fuji 0.8s on-chain</span>
          </div>

          {/* Chat Messages Body */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => {
              const isSys = m.sender === "system";
              const isBroker = m.sender === "broker";
              const isBuyer = m.sender === "buyer";
              const isSeller = m.sender === "seller";

              if (isSys) {
                return (
                  <div key={m.id} className="p-3 rounded-xl bg-[#05070B] border border-white/[0.06] text-xs text-slate-300 space-y-1">
                    <div className="flex items-center justify-between text-slate-400 font-mono text-[10px]">
                      <span className="text-blue-400 font-semibold uppercase">{m.senderName}</span>
                      <span>{m.time}</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed font-mono text-xs">{m.text}</p>
                  </div>
                );
              }

              return (
                <div key={m.id} className={`flex flex-col space-y-1 ${
                  (isBuyer && role === "buyer") || (isSeller && role === "seller") || (isBroker && role === "broker")
                    ? "items-end"
                    : "items-start"
                }`}>
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                    <span className={`font-medium px-2 py-0.5 rounded-md text-[10px] ${
                      isBroker
                        ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                        : isBuyer
                        ? "text-blue-400 bg-blue-500/10 border border-blue-500/20"
                        : "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    }`}>
                      {m.senderName}
                    </span>
                    <span>{m.time}</span>
                  </div>

                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                    isBroker
                      ? "bg-amber-950/25 border border-amber-500/30 text-amber-100"
                      : isBuyer
                      ? "bg-blue-950/25 border border-blue-500/30 text-blue-100"
                      : "bg-[#05070B] border border-white/[0.06] text-slate-200"
                  }`}>
                    <p>{m.text}</p>
                    {m.image && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-white/[0.08]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.image} alt="Chứng từ xác thực" className="w-full h-auto object-cover max-h-48" />
                        <span className="block text-[10px] p-1 bg-black/80 text-slate-300 font-mono text-center">
                          ✓ Chứng từ số IPFS được bảo chứng
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions Bar */}
          <div className="px-4 py-2 bg-[#05070B] border-t border-white/[0.06] flex items-center justify-between text-xs">
            <span className="text-slate-400">
              Đang thao tác: <strong className="text-white font-medium">{role === "buyer" ? "Bên Mua (Minh)" : role === "seller" ? "Bên Bán (Hùng)" : "Trung Gian (Nam)"}</strong>
            </span>
            <button
              onClick={handleSendSampleEvidence}
              className="text-slate-300 hover:text-white flex items-center space-x-1 font-medium transition-colors text-[11px]"
            >
              <FileCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Gửi Chứng Từ IPFS</span>
            </button>
          </div>

          {/* Chat Input Form */}
          <form onSubmit={handleSendMessage} className="p-3 bg-slate-950 border-t border-white/[0.06] flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập nội dung trao đổi hoặc xác nhận bàn giao..."
              className="flex-1 bg-[#05070B] border border-white/[0.08] rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: ROLE-BASED ACTION PANEL & BROKER REPUTATION (3 Cols)
            ========================================================================= */}
        <div className="lg:col-span-3 space-y-5">
          
          {/* Action Box */}
          <div className="p-5 rounded-2xl bg-[#080B11]/90 border border-white/[0.08] shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Bảng Điều Khiển Nghiệp Vụ
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-300 font-mono font-medium">
                {role === "broker" ? "TRUNG GIAN" : role === "buyer" ? "BÊN MUA" : "BÊN BÁN"}
              </span>
            </div>

            {/* Actions for GDTG / Broker */}
            {role === "broker" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Quý vị chịu trách nhiệm kiểm định tính toàn vẹn của hợp đồng. Khi hồ sơ bàn giao đã đầy đủ, phê duyệt thực thi:
                </p>

                {currentDeal.status === "LOCKED" ? (
                  <>
                    <button
                      onClick={onBrokerRelease}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 shadow-sm"
                    >
                      <Zap className="w-4 h-4" />
                      <span>⚡ Phê Duyệt Giải Ngân (0.8s)</span>
                    </button>

                    <button
                      onClick={onBrokerRefund}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#05070B] hover:bg-rose-950/30 border border-rose-500/30 text-rose-400 font-medium text-xs transition-colors flex items-center justify-center space-x-2"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Hoàn Quỹ 100% Cho Bên Mua</span>
                    </button>
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-[#05070B] text-center text-xs text-slate-400 font-mono border border-white/[0.06]">
                    Hợp đồng đã hoàn tất quy trình quyết toán ({currentDeal.status}).
                  </div>
                )}
              </div>
            )}

            {/* Actions for Buyer */}
            {role === "buyer" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Quý vị là Bên Mua. Vui lòng đối soát tài sản cẩn trọng trước khi yêu cầu Bên Trung Gian giải ngân.
                </p>

                {currentDeal.status === "COMPLETED" && (
                  <button
                    onClick={() => setRatingModal(true)}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>Đánh Giá Uy Tín & Gửi Tip</span>
                  </button>
                )}

                {/* Safety Mechanisms */}
                <div className="pt-2 border-t border-white/[0.06] space-y-2 text-xs">
                  <span className="text-slate-400 font-medium block uppercase text-[11px] tracking-wider">
                    Cơ Chế Bảo Vệ:
                  </span>
                  
                  <button
                    onClick={() => alert("Cơ chế Tự động Hoàn tiền Quá hạn (Timeout Auto-Refund): Nếu quá thời hạn quy định mà các bên không có phản hồi đối soát, hợp đồng thông minh cho phép Bên Mua tự động thu hồi 100% nguồn quỹ về ví an toàn.")}
                    className="w-full text-left p-2.5 rounded-xl bg-[#05070B] hover:bg-white/[0.04] text-slate-300 hover:text-white transition-colors flex items-center justify-between border border-white/[0.06]"
                  >
                    <span>⏰ Tự động hoàn tiền quá hạn</span>
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  <button
                    onClick={() => alert("Cơ chế Khấu trừ Tài sản Đảm bảo (Economic Slashing): Trong trường hợp phát hiện Bên Trung Gian có dấu hiệu cấu kết gian lận, Hội đồng Giao thức có thẩm quyền kích hoạt lệnh chém cọc bảo chứng Aave V3 của Trung Gian để bồi hoàn 100% thiệt hại cho Bên Mua.")}
                    className="w-full text-left p-2.5 rounded-xl bg-[#05070B] hover:bg-rose-950/20 text-slate-300 hover:text-rose-300 transition-colors flex items-center justify-between border border-white/[0.06]"
                  >
                    <span>🚨 Khiếu nại chém cọc (Slashing)</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </div>
              </div>
            )}

            {/* Actions for Seller */}
            {role === "seller" && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed font-normal">
                  Quý vị là Bên Bán. Tiền của Bên Mua đã được Smart Contract phong tỏa an toàn. Quý vị có thể yên tâm bàn giao tài sản.
                </p>

                <button
                  onClick={() => sendMessage(dealId, "Bên Bán xác nhận: Đã chuyển giao đầy đủ chứng từ sở hữu và quyền truy cập tài sản cho Bên Mua.")}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  Xác Nhận Đã Hoàn Tất Bàn Giao
                </button>
              </div>
            )}
          </div>

          {/* Broker Reputation Widget with Web3 Identicon */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#080B11]/90 border border-white/[0.08] shadow-md space-y-3 text-xs">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
              Thương Nhân Bảo Chứng (SBT Verified)
            </span>
            <div className="flex items-center space-x-3">
              <Identicon address={dealBroker.address} size={42} rankBadge={dealBroker.badge} />
              <div className="min-w-0 flex-1">
                <span className="font-bold text-white block text-xs sm:text-sm truncate">{dealBroker.name}</span>
                <span className="text-[11px] text-amber-400 font-medium block truncate">{dealBroker.badge}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Cọc Aave V3:</span>
                <strong className="text-emerald-400 font-mono">{dealBroker.stakedAmount.toLocaleString()} USDC</strong>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Tín nhiệm:</span>
                <strong className="text-amber-400 flex items-center font-medium">
                  <Star className="w-3 h-3 fill-amber-400 mr-1" />
                  {dealBroker.rating} ({dealBroker.completedDeals} kèo)
                </strong>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* =========================================================================
          RATING & TIP MODAL (ON-CHAIN TRUSTPASSPORT RECORDING)
          ========================================================================= */}
      {ratingModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative bg-[#080B11]/90 border border-white/[0.08]">
            <button
              onClick={() => setRatingModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Đánh Giá Tín Nhiệm & Gửi Tiền Thưởng (Tip)
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-normal">
                Giao dịch đã giải ngân thành công! Kính mời quý vị ghi nhận đánh giá tín nhiệm on-chain vào Soulbound Token của <strong>{currentDeal.brokerName}</strong>.
              </p>
            </div>

            <form onSubmit={onSubmitRating} className="space-y-4 pt-1">
              {/* Star Rating Select */}
              <div className="text-center space-y-1.5">
                <span className="text-xs font-medium text-slate-300 block">Mức độ hài lòng & uy tín:</span>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStars(s)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          s <= stars ? "fill-amber-400 text-amber-400" : "text-slate-700"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-medium text-amber-400 font-mono block">
                  {stars === 5 ? "⭐⭐⭐⭐⭐ Xuất Sắc (5.0 Tín Nhiệm)" : `${stars} Sao`}
                </span>
              </div>

              {/* Tip Amount Quick Select */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium text-slate-300 block">Gửi tiền tip khích lệ (USDC):</span>
                <div className="grid grid-cols-4 gap-2">
                  {["1", "2", "5", "10"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTip(t)}
                      className={`py-2 rounded-lg text-xs font-mono transition-colors ${
                        tip === t
                          ? "bg-blue-600 text-white font-semibold"
                          : "bg-[#05070B] text-slate-300 border border-white/[0.06] hover:bg-white/[0.04]"
                      }`}
                    >
                      +{t} USDC
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors shadow-sm"
              >
                Ghi Nhận On-Chain Vào TrustPassport SBT
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
