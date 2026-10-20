"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Headphones,
  X,
  Send,
  Paperclip,
  CheckCheck,
  ShieldAlert,
  AlertTriangle,
  User,
  Gavel,
  ExternalLink,
  ChevronDown,
  Minimize2,
} from "lucide-react";
import { useAuth } from "@/src/context/AuthContext";
import { shortenAddress } from "@/src/lib/contracts";

interface ChatMessage {
  id: string;
  sender: "cskh" | "user";
  senderName: string;
  text: string;
  timestamp: string;
  isProofAlert?: boolean;
}

export function CSKHLiveChat() {
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Form states
  const [dealIdInput, setDealIdInput] = useState("101");
  const [issueType, setIssueType] = useState("Trung gian quá hạn không giải ngân");
  const [inputText, setInputText] = useState("");
  const [hasStartedChat, setHasStartedChat] = useState(false);

  // Message history
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Listen for global open-cskh-chat events
  useEffect(() => {
    const handleOpenCSKH = (e: any) => {
      setIsOpen(true);
      setIsMinimized(false);
      if (e.detail?.dealId) {
        setDealIdInput(String(e.detail.dealId));
      }
    };
    window.addEventListener("open-cskh-chat", handleOpenCSKH);
    return () => window.removeEventListener("open-cskh-chat", handleOpenCSKH);
  }, []);

  // Initial welcome message from CSKH Support
  useEffect(() => {
    const userName = currentUser?.name || "Quý khách";
    setMessages([
      {
        id: "msg-init-1",
        sender: "cskh",
        senderName: "Bộ Phận Hỗ Trợ Khách Hàng (CSKH)",
        text: `Kính chào ${userName}! Đây là kênh tiếp nhận khiếu nại và hỗ trợ trực tuyến của TrustPact.`,
        timestamp: "Vừa xong",
      },
      {
        id: "msg-init-2",
        sender: "cskh",
        senderName: "Bộ Phận Hỗ Trợ Khách Hàng (CSKH)",
        text: `Nếu bạn gặp sự cố trong quá trình giao dịch, trung gian quá hạn không giải ngân hoặc có dấu hiệu vi phạm thỏa thuận, vui lòng gửi Mã Kèo và tài liệu bằng chứng tại đây. Đội ngũ CSKH sẽ đối soát on-chain và kích hoạt cơ chế bồi hoàn bảo vệ quyền lợi của bạn ngay lập tức!`,
        timestamp: "Vừa xong",
        isProofAlert: true,
      },
    ]);
  }, [currentUser]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      senderName: currentUser?.name || "Khách Hàng",
      text: inputText.trim(),
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setHasStartedChat(true);

    // Simulated CSKH Admin Auto-Response after 1.5s
    setTimeout(() => {
      const cskhReply: ChatMessage = {
        id: `cskh-${Date.now()}`,
        sender: "cskh",
        senderName: "Bộ Phận Hỗ Trợ Khách Hàng (CSKH)",
        text: `Bộ phận CSKH đã ghi nhận thông tin khiếu nại của bạn về kèo #${dealIdInput}. Hồ sơ đang được đối soát trên hợp đồng thông minh. Nếu trung gian vi phạm cam kết, hệ thống sẽ tự động kích hoạt bồi hoàn bảo vệ tài sản của bạn!`,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, cskhReply]);
    }, 1500);
  };

  return (
    <>
      {/* ── FLOATING CSKH LAUNCH BUTTON (Góc Dưới Bên Phải) ───────────────── */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {/* Tooltip Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#101217] border border-[#1E222D] shadow-xl text-xs font-medium text-[#F1F5F9] animate-bounce duration-1000">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span>Khiếu nại giao dịch? CSKH hỗ trợ 24/7</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="group relative w-14 h-14 rounded-full bg-[#E84142] hover:bg-[#D13637] text-white shadow-2xl shadow-[#E84142]/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            title="Mở kênh CSKH Khiếu Nại Trực Tuyến"
          >
            <Headphones className="w-6 h-6 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#10B981] border-2 border-[#090A0D]" />
          </button>
        </div>
      )}

      {/* ── LIVE CHAT CSKH WINDOW MODAL / POPUP ──────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[420px] rounded-lg border border-[#1E222D] bg-[#101217] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200 text-[#F1F5F9]">
          {/* Header Bar */}
          <div className="p-3.5 bg-[#161922] border-b border-[#1E222D] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-full bg-[#E84142]/20 border border-[#E84142]/40 flex items-center justify-center text-[#E84142] shrink-0">
                <Headphones className="w-4 h-4" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#10B981] border-2 border-[#161922]" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-[#F1F5F9]">Trung Tâm Hỗ Trợ Khách Hàng</h3>
                  <span className="px-1.5 py-0.2 rounded bg-[#10B981]/15 border border-[#10B981]/30 text-[9px] font-mono text-[#10B981] font-bold">
                    TRỰC TUYẾN 24/7
                  </span>
                </div>
                <p className="text-[10px] text-[#94A3B8]">
                  Giải quyết khiếu nại &amp; Bảo vệ quyền lợi người dùng
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[#64748B]">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-[#1E222D] hover:text-[#F1F5F9] transition-colors"
                title="Đóng khung chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* User Dossier Summary Card (Tên đăng nhập, ví, thông tin tài khoản) */}
          <div className="px-3.5 py-2.5 bg-[#090A0D] border-b border-[#1E222D] text-[11px] font-mono space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Tài khoản khiếu nại:</span>
              <strong className="text-[#F1F5F9]">{currentUser?.name || "Khách Vãng Lai"}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Ví liên kết:</span>
              <span className="text-[#94A3B8]">{shortenAddress(currentUser?.walletAddress)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#64748B]">Vai trò:</span>
              <span className="text-[#10B981] font-bold">
                {currentUser?.role === "BROKER"
                  ? "Trung Gian (Broker)"
                  : currentUser?.role === "SELLER"
                  ? "Người Bán (Seller)"
                  : "Người Mua (Buyer)"}
              </span>
            </div>

            {/* Quick preset inputs for Deal ID & Issue */}
            <div className="pt-1.5 border-t border-[#1E222D]/60 grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <label className="text-[#64748B] block mb-0.5">Mã kèo cần tố cáo:</label>
                <input
                  type="text"
                  value={dealIdInput}
                  onChange={(e) => setDealIdInput(e.target.value)}
                  placeholder="VD: #101"
                  className="w-full bg-[#161922] border border-[#1E222D] rounded px-2 py-1 text-[#F1F5F9] focus:outline-none focus:border-[#E84142]"
                />
              </div>
              <div>
                <label className="text-[#64748B] block mb-0.5">Vấn đề gặp phải:</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="w-full bg-[#161922] border border-[#1E222D] rounded px-1.5 py-1 text-[#F1F5F9] focus:outline-none focus:border-[#E84142]"
                >
                  <option value="Trung gian quá hạn không giải ngân">Trung gian quá hạn không giải ngân</option>
                  <option value="Nghi vấn gian lận / Vi phạm thỏa thuận">Nghi vấn gian lận / Vi phạm thỏa thuận</option>
                  <option value="Bên bán không bàn giao tài sản">Bên bán không bàn giao tài sản</option>
                  <option value="Tranh chấp phân chia số tiền">Tranh chấp phân chia số tiền</option>
                  <option value="Hỗ trợ kỹ thuật & Kiểm tra giao dịch">Hỗ trợ kỹ thuật &amp; Kiểm tra giao dịch</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chat Stream Area */}
          <div className="h-64 sm:h-72 overflow-y-auto p-3.5 space-y-3 bg-[#101217]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-[#64748B]">
                  <span>{msg.senderName}</span>
                  <span>·</span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`p-2.5 rounded-lg text-xs leading-relaxed max-w-[85%] ${
                    msg.sender === "user"
                      ? "bg-[#E84142] text-white rounded-br-none"
                      : msg.isProofAlert
                      ? "bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#F1F5F9] rounded-bl-none"
                      : "bg-[#161922] border border-[#1E222D] text-[#F1F5F9] rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Shortcuts */}
          <div className="px-3.5 py-2 bg-[#161922]/50 border-t border-[#1E222D] flex items-center gap-2 overflow-x-auto no-scrollbar text-[11px]">
            <button
              onClick={() => {
                setInputText(`Chào CSKH, kèo #${dealIdInput} hiện tại đã quá hạn nhưng trung gian chưa giải ngân, nhờ Admin hỗ trợ kiểm tra giúp tôi.`);
              }}
              className="px-2 py-1 rounded bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] whitespace-nowrap text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
            >
              🚨 Khiếu Nại Kèo #{dealIdInput}
            </button>
            <button
              onClick={() => {
                setInputText(`Kiểm tra tiến độ xử lý bồi hoàn cho kèo #${dealIdInput} giúp tôi với.`);
              }}
              className="px-2 py-1 rounded bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] whitespace-nowrap text-[#94A3B8] hover:text-[#F1F5F9] transition-colors"
            >
              📋 Tiến độ xử lý
            </button>
          </div>

          {/* Input Chat Box */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-[#161922] border-t border-[#1E222D] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập nội dung khiếu nại gửi bộ phận CSKH..."
              className="flex-1 bg-[#090A0D] border border-[#1E222D] rounded-md px-3 py-2 text-xs text-[#F1F5F9] focus:outline-none focus:border-[#E84142]"
            />
            <button
              type="submit"
              className="p-2 rounded-md bg-[#E84142] hover:bg-[#D13637] text-white transition-colors"
              title="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Admin Link */}
          <div className="px-3.5 py-2 bg-[#090A0D] border-t border-[#1E222D] flex items-center justify-between text-[10px] text-[#64748B]">
            <span>Hệ thống giám sát bảo mật on-chain</span>
            <Link
              href={`/admin/disputes?id=${dealIdInput}`}
              onClick={() => setIsOpen(false)}
              className="text-[#E84142] hover:underline flex items-center gap-1"
            >
              <span>Xem Bảng Xử Lý Vi Phạm</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
