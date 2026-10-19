"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2, Send, Star, RefreshCw, Copy, Check,
  Lock, AlertTriangle, Clock, Zap, Sparkles, X, ShieldCheck,
  FileCheck, ExternalLink, TrendingUp, Users, Activity,
  ChevronDown, MessageSquare, Wallet, Award
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
  const chatContainerRef = useRef<HTMLDivElement>(null);

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
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
    setTimeout(() => setRatingModal(true), 800);
  };

  const onBrokerRefund = () => {
    if (confirm("Xác nhận hoàn quỹ 100% từ Smart Contract về ví Bên Mua?")) {
      brokerRefund(dealId);
    }
  };

  const onSubmitRating = (e: React.FormEvent) => {
    e.preventDefault();
    const tipVal = parseFloat(tip) || 0;
    rateAndTip(dealId, stars, tipVal);
    setRatingModal(false);
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.5 } });
  };

  const activeStep: 1 | 2 | 3 | 4 =
    currentDeal.status === "COMPLETED" || currentDeal.status === "CANCELLED"
      ? 4
      : currentDeal.deliveryConfirmed
      ? 3
      : 2;

  const qrData = `ethereum:0x51E2b1239c09d57aC7bAfF094553b6A1B022B854@43113?uint256=${currentDeal.amount}e6`;
  const protocolFee = +(currentDeal.amount * 0.003).toFixed(2);
  const brokerFee = +(currentDeal.amount * (currentDeal.brokerFeeBps / 10000)).toFixed(2);
  const sellerNet = +(currentDeal.amount - protocolFee - brokerFee).toFixed(2);

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 pb-24 space-y-5">

      {/* ── TOP STATUS BAR ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#07090E] p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          {/* Contract ID badge */}
          <span className="shrink-0 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-600/15 border border-blue-500/25 text-blue-400 tracking-wider">
            #{currentDeal.id}
          </span>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-white truncate leading-tight">
              {currentDeal.title}
            </h1>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 flex-wrap">
              <span>{currentDeal.category}</span>
              <span>·</span>
              <span>Trung gian: <span className="text-amber-400 font-medium">{currentDeal.brokerName.split(" ")[0]} {currentDeal.brokerName.split(" ")[1]}</span></span>
              <span>·</span>
              <span className="font-mono">{currentDeal.createdAt}</span>
            </div>
          </div>
          <StatusBadge status={currentDeal.status} size="sm" />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={`https://testnet.snowtrace.io/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] text-slate-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Snowtrace
          </a>
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-medium bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] text-slate-300 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? "Đã sao chép" : "Sao chép link"}
          </button>
        </div>
      </div>

      {/* ── STEP PROGRESS ──────────────────────────────────────── */}
      <StepProgress currentStep={activeStep} status={currentDeal.status} />

      {/* ── MAIN 3-COLUMN GRID ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* ╔══════════════════════════╗
            ║  LEFT: VAULT + QR CODE   ║  4 cols
            ╚══════════════════════════╝ */}
        <div className="lg:col-span-4 space-y-4">

          {/* Live Aave Yield */}
          <LiveYieldCounter principalAmount={currentDeal.amount} apy={5.2} baseYield={0.0428} />

          {/* Vault Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#07090E] overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            {/* header */}
            <div className="px-5 py-3.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">Smart Contract Vault</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                UniversalEscrow.sol
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Amount */}
              <div className="rounded-xl bg-[#04060B] border border-emerald-500/20 p-4 text-center">
                <span className="text-[11px] text-slate-500 block mb-1 uppercase tracking-wider">Giá trị đang phong tỏa</span>
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
                  {currentDeal.amount.toLocaleString()} USDC
                </div>
                <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                  ≈ {(currentDeal.amount * 25400).toLocaleString()} VNĐ
                </span>
              </div>

              {/* Fee breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-500">Bên Bán nhận</span>
                  <span className="font-mono font-bold text-emerald-400">{sellerNet.toLocaleString()} USDC</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-white/[0.04]">
                  <span className="text-slate-500">Phí Trung gian ({currentDeal.brokerFeeBps / 100}%)</span>
                  <span className="font-mono text-amber-400">{brokerFee.toLocaleString()} USDC</span>
                </div>
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-slate-500">Phí giao thức (0.3%)</span>
                  <span className="font-mono text-slate-400">{protocolFee.toLocaleString()} USDC</span>
                </div>
              </div>

              {/* Participants */}
              <div className="space-y-2.5 pt-1 border-t border-white/[0.06] text-[11px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Bên Mua</span>
                  <AddressCopy address={currentDeal.buyerAddress} truncateLength={4} showExplorerLink={false} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 shrink-0">Bên Bán</span>
                  <AddressCopy address={currentDeal.sellerAddress} truncateLength={4} showExplorerLink={false} />
                </div>
              </div>

              {/* QR */}
              <div className="pt-3 border-t border-white/[0.06] text-center space-y-2">
                <span className="text-[11px] text-slate-400 block">Thanh toán qua Avalanche Core Wallet</span>
                <div className="inline-block p-2.5 bg-white rounded-xl">
                  <QRCodeSVG value={qrData} size={110} level="M" />
                </div>
                <span className="text-[10px] text-slate-500 font-mono block">Finality 0.8s · Gas &lt; $0.01</span>
              </div>
            </div>
          </div>
        </div>

        {/* ╔══════════════════════════╗
            ║  MIDDLE: CHAT TERMINAL   ║  5 cols
            ╚══════════════════════════╝ */}
        <div className="lg:col-span-5 rounded-2xl border border-white/[0.08] bg-[#07090E] flex flex-col shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]" style={{ height: "680px" }}>

          {/* Chat header */}
          <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-white">Kênh Đàm Phán & Đối Soát</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono">Fuji C-Chain · 0.8s</span>
              <button
                onClick={handleSendSampleEvidence}
                className="text-[10px] font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-blue-500/10 border border-transparent hover:border-blue-500/20"
              >
                <FileCheck className="w-3 h-3" />
                Gửi Chứng Từ
              </button>
            </div>
          </div>

          {/* Role indicator bar */}
          <div className="px-4 py-2 bg-[#04060B] border-b border-white/[0.04] shrink-0">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${role === "buyer" ? "bg-blue-400" : role === "seller" ? "bg-emerald-400" : "bg-amber-400"}`} />
              <span className="text-[10px] text-slate-500">
                Đang hoạt động với vai:&nbsp;
                <span className={`font-semibold ${role === "buyer" ? "text-blue-400" : role === "seller" ? "text-emerald-400" : "text-amber-400"}`}>
                  {role === "buyer" ? "Bên Mua" : role === "seller" ? "Bên Bán" : "Trung Gian Giám Sát"}
                </span>
              </span>
            </div>
          </div>

          {/* Messages */}
          <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((m) => {
              const isSys = m.sender === "system";
              const isBroker = m.sender === "broker";
              const isBuyer = m.sender === "buyer";

              if (isSys) {
                return (
                  <div key={m.id} className="mx-auto max-w-[90%]">
                    <div className="p-3 rounded-xl bg-[#04060B] border border-white/[0.06] text-[11px] text-slate-300 space-y-0.5">
                      <div className="flex items-center justify-between text-slate-500 font-mono text-[10px]">
                        <span className="text-blue-400 font-semibold uppercase tracking-wider">{m.senderName}</span>
                        <span>{m.time}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed font-mono">{m.text}</p>
                    </div>
                  </div>
                );
              }

              const isMe = (isBuyer && role === "buyer") || (m.sender === "seller" && role === "seller") || (isBroker && role === "broker");

              return (
                <div key={m.id} className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className={`font-semibold px-2 py-0.5 rounded-md ${
                      isBroker ? "text-amber-400 bg-amber-500/10 border border-amber-500/20"
                      : isBuyer ? "text-blue-400 bg-blue-500/10 border border-blue-500/20"
                      : "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
                    }`}>
                      {m.senderName}
                    </span>
                    <span className="text-slate-600">{m.time}</span>
                  </div>
                  <div className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    isBroker ? "bg-amber-950/20 border border-amber-500/25 text-amber-50"
                    : isBuyer ? "bg-blue-950/20 border border-blue-500/25 text-blue-50"
                    : "bg-white/[0.04] border border-white/[0.07] text-slate-200"
                  }`}>
                    {m.text}
                    {m.image && (
                      <div className="mt-2 rounded-xl overflow-hidden border border-white/[0.08]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.image} alt="Chứng từ" className="w-full h-auto object-cover max-h-48" />
                        <span className="block text-[10px] p-1.5 bg-black/80 text-slate-400 font-mono text-center">
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

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-3 bg-[#04060B] border-t border-white/[0.06] flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Nhập nội dung hoặc xác nhận bàn giao..."
              className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* ╔══════════════════════════╗
            ║  RIGHT: ACTION + BROKER  ║  3 cols
            ╚══════════════════════════╝ */}
        <div className="lg:col-span-3 space-y-4">

          {/* Action Panel */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#07090E] overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <div className="px-5 py-3.5 bg-white/[0.02] border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Thao Tác Nghiệp Vụ</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono font-bold ${
                role === "broker" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                : role === "buyer" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                {role === "broker" ? "TRUNG GIAN" : role === "buyer" ? "BÊN MUA" : "BÊN BÁN"}
              </span>
            </div>

            <div className="p-4 space-y-3">

              {/* BROKER ACTIONS */}
              {role === "broker" && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Sau khi xác minh chứng từ và hồ sơ bàn giao hợp lệ, thực thi quyết định:
                  </p>

                  {currentDeal.status === "LOCKED" ? (
                    <>
                      <button
                        onClick={onBrokerRelease}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(16,185,129,0.25)]"
                      >
                        <Zap className="w-4 h-4" />
                        Giải Ngân (0.8s)
                      </button>
                      <button
                        onClick={onBrokerRefund}
                        className="w-full py-2.5 px-4 rounded-xl bg-white/[0.02] hover:bg-rose-950/20 border border-rose-500/25 hover:border-rose-500/40 text-rose-400 font-medium text-xs transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Hoàn Quỹ 100%
                      </button>
                    </>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-white/[0.02] text-center text-[11px] text-slate-500 font-mono border border-white/[0.06]">
                      Hợp đồng đã hoàn tất · {currentDeal.status}
                    </div>
                  )}
                </div>
              )}

              {/* BUYER ACTIONS */}
              {role === "buyer" && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Tiền đang được Smart Contract giữ an toàn. Kiểm tra tài sản trước khi Trung gian giải ngân.
                  </p>

                  {currentDeal.status === "COMPLETED" && (
                    <button
                      onClick={() => setRatingModal(true)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(245,158,11,0.25)]"
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                      Đánh Giá & Gửi Tip
                    </button>
                  )}

                  <div className="space-y-2 pt-1 border-t border-white/[0.06]">
                    <span className="text-[10px] text-slate-600 uppercase tracking-wider block">Cơ chế bảo vệ</span>
                    <button
                      onClick={() => alert("Timeout Auto-Refund: Nếu quá thời hạn mà các bên không phản hồi, Smart Contract cho phép Bên Mua tự rút 100% quỹ về ví.")}
                      className="w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] text-slate-400 hover:text-white transition-colors flex items-center justify-between border border-white/[0.06] text-[11px]"
                    >
                      <span className="flex items-center gap-1.5"><Clock className="w-3 h-3 text-slate-500" />Tự hoàn tiền quá hạn</span>
                      <ChevronDown className="w-3 h-3 text-slate-600 rotate-[-90deg]" />
                    </button>
                    <button
                      onClick={() => alert("Economic Slashing: Nếu phát hiện Trung Gian gian lận, Giao thức kích hoạt chém cọc Aave V3 để bồi hoàn 100% thiệt hại cho Bên Mua.")}
                      className="w-full text-left p-2.5 rounded-xl bg-white/[0.02] hover:bg-rose-950/15 border border-white/[0.06] hover:border-rose-500/25 text-slate-400 hover:text-rose-300 transition-all flex items-center justify-between text-[11px]"
                    >
                      <span className="flex items-center gap-1.5"><AlertTriangle className="w-3 h-3 text-rose-500" />Khiếu nại Slashing</span>
                      <ChevronDown className="w-3 h-3 text-slate-600 rotate-[-90deg]" />
                    </button>
                  </div>
                </div>
              )}

              {/* SELLER ACTIONS */}
              {role === "seller" && (
                <div className="space-y-3">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Tiền Bên Mua đã phong tỏa trong Smart Contract. Bạn có thể an tâm bàn giao tài sản.
                  </p>
                  <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-1">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 mx-auto" />
                    <span className="text-[11px] text-emerald-400 font-medium block">Quỹ đã phong tỏa an toàn</span>
                    <span className="text-[10px] text-slate-500 block font-mono">{currentDeal.amount.toLocaleString()} USDC</span>
                  </div>
                  <button
                    onClick={() => sendMessage(dealId, "Bên Bán xác nhận: Đã chuyển giao đầy đủ chứng từ và quyền truy cập tài sản cho Bên Mua.")}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors"
                  >
                    Xác Nhận Hoàn Tất Bàn Giao
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Broker Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#07090E] overflow-hidden shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <div className="px-5 py-3.5 bg-white/[0.02] border-b border-white/[0.06]">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Trung Gian Giám Sát</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Identicon address={dealBroker.address} size={42} rankBadge={dealBroker.badge} />
                <div className="min-w-0 flex-1">
                  <span className="font-bold text-white text-sm block truncate">{dealBroker.name}</span>
                  <span className="text-[11px] text-amber-400 font-medium block">{dealBroker.badge}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-0.5">
                  <span className="text-slate-600 block">Cọc Aave V3</span>
                  <span className="font-mono font-bold text-emerald-400">{dealBroker.stakedAmount.toLocaleString()}</span>
                  <span className="text-slate-600 text-[10px]">USDC</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-0.5">
                  <span className="text-slate-600 block">Tín nhiệm</span>
                  <span className="font-bold text-amber-400 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" />{dealBroker.rating}
                  </span>
                  <span className="text-slate-600 text-[10px]">{dealBroker.completedDeals} hợp đồng</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-2 text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-medium">SBT Verified · TrustPassport On-chain</span>
              </div>
            </div>
          </div>

          {/* Contract Info Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#07090E] p-4 space-y-2.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]">
            <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider block">Thông Tin Hợp Đồng</span>
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">Network</span>
                <span className="text-white font-medium font-mono">Avalanche Fuji C-Chain</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Finality</span>
                <span className="text-emerald-400 font-mono">0.8 giây</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lãi suất Aave</span>
                <span className="text-purple-400 font-mono">5.20% APY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">ChainID</span>
                <span className="text-slate-400 font-mono">43113</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── RATING MODAL ───────────────────────────────────────── */}
      {ratingModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="rounded-2xl max-w-sm w-full shadow-2xl border border-white/[0.1] bg-[#08090E] overflow-hidden">
            {/* Modal header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/[0.07] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center">
                  <Award className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Đánh Giá Trung Gian</h2>
                  <p className="text-[10px] text-slate-500">Ghi nhận on-chain vào TrustPassport SBT</p>
                </div>
              </div>
              <button onClick={() => setRatingModal(false)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={onSubmitRating} className="p-6 space-y-5">
              {/* Broker preview */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.07]">
                <Identicon address={dealBroker.address} size={36} />
                <div>
                  <span className="text-xs font-bold text-white block">{dealBroker.name}</span>
                  <span className="text-[10px] text-amber-400">{dealBroker.badge}</span>
                </div>
              </div>

              {/* Stars */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-slate-300 block">Mức độ hài lòng:</span>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} type="button" onClick={() => setStars(s)} className="p-1 transition-transform hover:scale-110 active:scale-95">
                      <Star className={`w-8 h-8 transition-colors ${s <= stars ? "fill-amber-400 text-amber-400" : "text-slate-700"}`} />
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-center text-amber-400 font-mono font-medium">
                  {stars === 5 ? "Xuất Sắc ⭐⭐⭐⭐⭐" : stars === 4 ? "Tốt ⭐⭐⭐⭐" : stars === 3 ? "Khá ⭐⭐⭐" : `${stars} sao`}
                </p>
              </div>

              {/* Tip */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-slate-300 block">Gửi tip khích lệ (USDC):</span>
                <div className="grid grid-cols-4 gap-2">
                  {["1", "2", "5", "10"].map((t) => (
                    <button
                      key={t} type="button" onClick={() => setTip(t)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                        tip === t ? "bg-blue-600 text-white shadow-[0_2px_12px_rgba(37,99,235,0.4)]" : "bg-white/[0.04] text-slate-400 border border-white/[0.07] hover:bg-white/[0.08]"
                      }`}
                    >
                      +{t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wider transition-all shadow-[0_4px_20px_rgba(37,99,235,0.3)]"
              >
                Ghi Nhận On-Chain · {tip} USDC Tip
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
