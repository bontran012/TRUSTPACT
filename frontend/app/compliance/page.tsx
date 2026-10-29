"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Cpu,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Lock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { VERIFIED_FUJI_CONTRACTS } from "@/src/lib/contracts";

export default function SecurityAndTransparencyPage() {
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddr(address);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 text-[#F1F5F9]">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="border-b border-[#1E222D] pb-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#161922] border border-[#1E222D] text-[#38BDF8] text-xs font-mono font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Kiến Trúc Kỹ Thuật & Điều Khoản Dịch Vụ</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Minh Bạch Kỹ Thuật & Cơ Chế Bảo Vệ Quỹ
        </h1>
        <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed max-w-2xl">
          Toàn bộ quy trình ký quỹ và bảo chứng dòng tiền tại TrustPact được thực thi tự động qua Smart Contract trên mạng Avalanche. Không có cá nhân nào được phép đơn phương can thiệp hoặc giữ tiền của người dùng.
        </p>
      </div>

      {/* ── 1. CƠ CHẾ BẢO VỆ DÒNG TIỀN ──────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#E84142]" />
          <span>1. Ba Lớp Bảo Vệ Dòng Tiền (Core Security)</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl bg-[#101217] border border-[#1E222D] p-4 space-y-2">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-[#E84142]/10 text-[#E84142] flex items-center justify-center font-mono text-[11px]">1</span>
              <span>Két Sắt Bất Biến</span>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Tiền của Bên Mua khóa trực tiếp vào Smart Contract. Tiền chỉ được giải ngân cho Bên Bán khi Bên Mua xác nhận nhận hàng, hoặc do GDTG/Admin xử lý tranh chấp theo bằng chứng.
            </p>
          </div>

          <div className="rounded-xl bg-[#101217] border border-[#1E222D] p-4 space-y-2">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center font-mono text-[11px]">2</span>
              <span>Cọc Phạt GDTG (Slashing)</span>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              GDTG bắt buộc phải nạp cọc thế chấp USDC trước khi nhận làm trung gian. Nếu GDTG cấu kết gian lận hoặc phán quyết sai, quỹ cọc sẽ bị phạt để bồi thường thiệt hại 100% cho nạn nhân.
            </p>
          </div>

          <div className="rounded-xl bg-[#101217] border border-[#1E222D] p-4 space-y-2">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span className="w-5 h-5 rounded bg-[#10B981]/10 text-[#10B981] flex items-center justify-center font-mono text-[11px]">3</span>
              <span>Rút Vốn Tự Động Khi Hết Hạn</span>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Nếu quá thời hạn hợp đồng mà Bên Bán không giao hàng, Bên Mua có quyền tự kích hoạt lệnh rút lại 100% số tiền on-chain mà không cần sự đồng ý của bất kỳ ai.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. ĐỊA CHỈ HỢP ĐỒNG ON-CHAIN ─────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E222D] pb-2">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#38BDF8]" />
            <span>2. Danh Sách Smart Contracts Đã Kiểm Thử & Triển Khai</span>
          </h2>
          <span className="text-[11px] font-mono text-[#10B981]">Avalanche Fuji C-Chain (#43113)</span>
        </div>

        <div className="space-y-2.5">
          {VERIFIED_FUJI_CONTRACTS.map((c) => (
            <div
              key={c.name}
              className="rounded-xl bg-[#101217] border border-[#1E222D] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#2E3545] transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{c.title}</span>
                  <span className="text-[10px] font-mono text-[#38BDF8] bg-[#38BDF8]/10 px-1.5 py-0.5 rounded">
                    {c.name}.sol
                  </span>
                </div>
                <p className="text-[11px] text-[#94A3B8] line-clamp-1">{c.purpose}</p>
                <div className="text-[11px] font-mono text-[#CBD5E1] truncate">{c.address}</div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopy(c.address)}
                  className="px-2.5 py-1.5 rounded bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-xs text-[#94A3B8] hover:text-white transition-colors flex items-center gap-1 font-mono"
                >
                  {copiedAddr === c.address ? (
                    <>
                      <Check className="w-3 h-3 text-[#10B981]" />
                      <span className="text-[#10B981]">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
                <a
                  href={c.explorer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 rounded bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-xs text-[#38BDF8] hover:text-white transition-colors flex items-center gap-1"
                >
                  <span>Snowtrace</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. NGUỒN GỐC LÃI SUẤT THẬT ────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[#10B981]" />
          <span>3. Cơ Chế Sinh Lợi Tức Từ Tiền Cọc Của GDTG</span>
        </h2>
        <div className="rounded-xl bg-[#101217] border border-[#1E222D] p-4 text-xs text-[#94A3B8] space-y-2 leading-relaxed">
          <p>
            Tiền ký cược bảo lãnh của GDTG không nằm yên vô ích mà được ủy thác nạp trực tiếp vào <strong className="text-white">Aave V3 Lending Pool trên Avalanche (Địa chỉ: 0x8B9b...bb40)</strong> để sinh lợi tức thị trường thực tế (khoảng 3% - 6% APY theo nguồn cung cầu thanh khoản).
          </p>
          <p>
            <strong className="text-[#10B981]">Nguyên tắc bảo toàn vốn:</strong> Lợi tức từ Aave được chia tự động cho GDTG như phần thưởng duy trì hạ tầng. Gốc cọc bảo chứng được bảo toàn nguyên vẹn 100%, không bị mang đi đầu cơ rủi ro.
          </p>
        </div>
      </section>

      {/* ── 4. TUYÊN BỐ PHÁP LÝ & MIỄN TRỪ TRÁCH NHIỆM ─────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
          <span>4. Tuyên Bố Pháp Lý & Miễn Trừ Trách Nhiệm (Legal Disclaimer)</span>
        </h2>
        <div className="rounded-xl bg-[#101217] border border-[#1E222D] p-4 text-xs text-[#94A3B8] space-y-2.5 leading-relaxed">
          <p>
            • <strong className="text-white">Không phải ngân hàng hay tổ chức tín dụng:</strong> TrustPact là giao thức phần mềm mã nguồn mở hoạt động dựa trên hợp đồng thông minh phi tập trung. Hệ thống không nhận tiền gửi tiết kiệm, không cam kết lợi nhuận cố định và không hoạt động như một ví điện tử fiat.
          </p>
          <p>
            • <strong className="text-white">Tuân thủ pháp luật Việt Nam:</strong> Giao thức không sử dụng tiền mã hóa để thanh toán thay thế tiền tệ (VND) cho hàng hóa tiêu dùng ngoài đời thực theo quy định tại Nghị định 80/2016/NĐ-CP. Giao dịch ký quỹ áp dụng cho trao đổi tài sản số, phần mềm, dịch vụ kỹ thuật xuyên biên giới trên tinh thần ký cược/đặt cọc thỏa thuận dân sự.
          </p>
          <p>
            • <strong className="text-white">Trách nhiệm người dùng:</strong> Người dùng có nghĩa vụ tự kiểm tra kỹ địa chỉ ví, thông tin tài sản và danh tính GDTG trước khi tiến hành ký quỹ. TrustPact không chịu trách nhiệm với các giao dịch thỏa thuận ngoài luồng không thông qua Smart Contract.
          </p>
        </div>
      </section>

      {/* ── BOTTOM CTA ─────────────────────────────────────────────────── */}
      <div className="pt-4 flex items-center justify-between border-t border-[#1E222D]">
        <span className="text-xs text-[#64748B]">Mã nguồn mở · Độc lập · Phi tập trung</span>
        <Link
          href="/pact/create"
          className="px-4 py-2 rounded-lg bg-[#E84142] hover:bg-[#D13637] text-white text-xs font-bold transition-colors flex items-center gap-1.5"
        >
          <span>Khởi Tạo Ký Quỹ Ngay</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
