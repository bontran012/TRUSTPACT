"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Headphones,
  X,
  Send,
  ExternalLink,
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

  // Form states
  const [dealIdInput, setDealIdInput] = useState("101");
  const [issueType, setIssueType] = useState("Trung gian quá hạn không giải ngân");
  const [inputText, setInputText] = useState("");

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
        text: `Nếu bạn gặp sự cố trong quá trình giao dịch, trung gian quá hạn không giải ngân hoặc vi phạm thỏa thuận, vui lòng gửi Mã Kèo và tài liệu bằng chứng tại đây. Đội ngũ CSKH sẽ đối soát on-chain và kích hoạt cơ chế bồi hoàn bảo vệ quyền lợi của bạn ngay lập tức!`,
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
        <div className="fixed bottom-5 right-5 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative h-11 w-11 hover:w-auto hover:px-4 rounded-full bg-[#10244E]/90 hover:bg-gradient-to-r hover:from-sky-500 hover:to-indigo-600 text-sky-100 hover:text-white shadow-[0_12px_28px_-4px_rgba(3,10,28,0.65)] border border-white/25 flex items-center justify-center gap-2 transition-all duration-200 backdrop-blur-xl"
            title="Hỗ trợ trực tuyến 24/7"
          >
            <Headphones className="w-4 h-4 text-sky-300 group-hover:text-white shrink-0" />
            <span className="text-xs font-semibold hidden group-hover:inline whitespace-nowrap">
              Hỗ trợ 24/7
            </span>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0B1933]" />
          </button>
        </div>
      )}

      {/* ── LIVE CHAT CSKH WINDOW MODAL / POPUP ──────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[410px] rounded-[28px] border border-white/20 bg-[#0F2147]/95 backdrop-blur-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in text-slate-100">
          {/* Header Bar */}
          <div className="p-4 bg-white/[0.06] border-b border-white/12 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full bg-sky-400/20 border border-sky-300/30 flex items-center justify-center text-sky-200 shrink-0">
                <Headphones className="w-4 h-4" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0F2147]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white">Trung Tâm Hỗ Trợ CSKH</h3>
                  <span className="badge-pill bg-emerald-500/12 text-emerald-300 border border-emerald-500/25 text-[10px] py-0.5 px-2">
                    Trực tuyến 24/7
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Tiếp nhận khiếu nại &amp; đối soát hợp đồng
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              title="Đóng khung chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* User Dossier Summary Card */}
          <div className="px-4 py-3 card-inner text-xs space-y-1.5 mx-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Tài khoản:</span>
              <strong className="text-white">{currentUser?.name || "Khách Vãng Lai"}</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Ví liên kết:</span>
              <span className="text-slate-300 font-mono">{shortenAddress(currentUser?.walletAddress)}</span>
            </div>

            <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Mã kèo:</label>
                <input
                  type="text"
                  value={dealIdInput}
                  onChange={(e) => setDealIdInput(e.target.value)}
                  placeholder="VD: 101"
                  className="input-field py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Sự cố:</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="input-field py-1.5 text-xs"
                >
                  <option value="Trung gian quá hạn không giải ngân">Quá hạn giải ngân</option>
                  <option value="Nghi vấn gian lận / Vi phạm thỏa thuận">Nghi vấn gian lận</option>
                  <option value="Bên bán không bàn giao tài sản">Chưa giao tài sản</option>
                  <option value="Tranh chấp phân chia số tiền">Tranh chấp chia tiền</option>
                </select>
              </div>
            </div>
          </div>

          {/* Chat Stream Area */}
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 text-[11px] text-slate-500">
                  <span>{msg.senderName}</span>
                  <span>·</span>
                  <span className="font-mono">{msg.timestamp}</span>
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed max-w-[85%] ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm shadow-md"
                      : msg.isProofAlert
                      ? "card-inner border-indigo-400/25 bg-indigo-500/[0.06] text-slate-200 rounded-bl-sm"
                      : "card-inner text-slate-200 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Shortcuts */}
          <div className="px-4 py-2 bg-white/[0.02] border-t border-white/[0.06] flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
            <button
              onClick={() => {
                setInputText(`Chào CSKH, kèo #${dealIdInput} hiện tại đã quá hạn nhưng trung gian chưa giải ngân, nhờ Admin hỗ trợ kiểm tra giúp tôi.`);
              }}
              className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] whitespace-nowrap text-slate-300 hover:text-white transition-colors"
            >
              Khiếu Nại Kèo #{dealIdInput}
            </button>
            <button
              onClick={() => {
                setInputText(`Kiểm tra tiến độ xử lý bồi hoàn cho kèo #${dealIdInput} giúp tôi với.`);
              }}
              className="px-2.5 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] whitespace-nowrap text-slate-300 hover:text-white transition-colors"
            >
              Tiến độ bồi hoàn
            </button>
          </div>

          {/* Input Chat Box */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-white/[0.02] border-t border-white/[0.06] flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập nội dung khiếu nại..."
              className="input-field py-2 text-xs flex-1"
            />
            <button
              type="submit"
              className="p-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white transition-colors shrink-0"
              title="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Admin Link */}
          <div className="px-4 py-2 bg-black/40 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500">
            <span>Giám sát bảo mật on-chain</span>
            <Link
              href={`/admin/disputes`}
              onClick={() => setIsOpen(false)}
              className="text-brand hover:underline flex items-center gap-1 font-medium"
            >
              <span>Xem Bảng Xử Lý Vi Phạm</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
