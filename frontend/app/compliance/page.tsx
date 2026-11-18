"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Cpu,
  ExternalLink,
  Copy,
  Check,
  Scale,
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
    <div className="max-w-5xl mx-auto space-y-8 pb-12 text-slate-100 animate-fade-in" suppressHydrationWarning>
      {/* ── CLEAN BANKING EXECUTIVE HEADER ──────────────────────────────── */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-6 space-y-2.5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Kiến trúc kỹ thuật &amp; Pháp lý</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-100">
          Kiến trúc bảo vệ dòng tiền &amp; Khung tuân thủ pháp lý
        </h1>
        <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
          Toàn bộ quy trình ký quỹ và bảo chứng thanh khoản trên TrustPact được thực thi phi tập trung thông qua hệ thống hợp đồng thông minh trên mạng Avalanche. Không cá nhân hay đơn vị vận hành nào có quyền đơn phương lưu giữ hoặc chiếm dụng tài sản của người dùng.
        </p>
      </div>

      {/* ── 1. BA CƠ CHẾ BẢO VỆ DÒNG TIỀN CỐT LÕI ───────────────────────── */}
      <section className="space-y-3.5">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-400" />
          <h2 className="text-base font-bold text-slate-100">
            1. Cơ chế bảo vệ dòng tiền ba lớp (Core Security Architecture)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-2.5">
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                01
              </span>
              <span>Hợp đồng ký quỹ đồng thuận 2/2</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tiền ký quỹ chỉ được giải ngân cho Bên bán khi có đủ xác nhận của cả Bên mua và GDTG, hoặc theo phán quyết trọng tài khi phát sinh tranh chấp.
            </p>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-2.5">
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                02
              </span>
              <span>Khấu trừ thế chấp GDTG (Slashing)</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              GDTG bắt buộc duy trì vốn thế chấp USDC tỷ lệ 1:1 trước khi bảo chứng giao dịch. Khi có bằng chứng GDTG thông đồng hoặc vi phạm nghĩa vụ, vốn thế chấp bị khấu trừ trực tiếp để bồi hoàn cho người dùng.
            </p>
          </div>

          <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-2.5">
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-md bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                03
              </span>
              <span>Hoàn tiền tự động khi quá hạn</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trường hợp quá thời hạn cam kết mà Bên bán không hoàn tất nghĩa vụ bàn giao, Bên mua có toàn quyền kích hoạt lệnh thu hồi 100% tiền ký quỹ trực tiếp từ hợp đồng thông minh.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. DANH MỤC HỢP ĐỒNG THÔNG MINH TRÊN CHUỖI ──────────────────── */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-400" />
            <h2 className="text-base font-bold text-slate-100">
              2. Danh mục hợp đồng thông minh đã kiểm chứng
            </h2>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-md font-semibold">
            Avalanche Fuji (#43113)
          </span>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl divide-y divide-slate-800 overflow-hidden">
          {VERIFIED_FUJI_CONTRACTS.map((c) => (
            <div
              key={c.name}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-sm font-bold text-slate-100">{c.title}</span>
                  <span className="text-xs font-mono text-slate-300 bg-[#0B0F17] px-2 py-0.5 rounded-md border border-slate-800">
                    {c.name}.sol
                  </span>
                </div>
                <p className="text-xs text-slate-400">{c.purpose}</p>
                <div className="text-xs font-mono text-slate-300 truncate pt-0.5">
                  {c.address}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(c.address)}
                  className="px-3 py-1.5 rounded-lg bg-[#0B0F17] hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-slate-100 transition-colors flex items-center gap-1.5"
                >
                  {copiedAddr === c.address ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sao chép</span>
                    </>
                  )}
                </button>
                <a
                  href={c.explorer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 hover:text-white transition-colors flex items-center gap-1.5"
                >
                  <span>Snowtrace</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. QUẢN TRỊ THANH KHOẢN & LỢI TỨC AAVE V3 ───────────────────── */}
      <section className="space-y-3.5">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-400" />
          <h2 className="text-base font-bold text-slate-100">
            3. Quản trị vốn thế chấp GDTG &amp; Lợi tức thực Aave V3
          </h2>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="bg-[#0B0F17] border border-slate-800/80 rounded-lg p-4 space-y-1.5">
            <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
              Ủy thác thanh khoản minh bạch
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Vốn thế chấp của GDTG tại <code className="font-mono text-slate-200">StakedBrokerRegistry</code> được nạp trực tiếp vào <strong className="text-slate-200">Aave V3 Lending Pool trên Avalanche (0x8B9b...bb40)</strong> để nhận lợi tức thực tế từ nhu cầu vay thanh khoản thị trường.
            </p>
          </div>

          <div className="bg-[#0B0F17] border border-slate-800/80 rounded-lg p-4 space-y-1.5">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
              Nguyên tắc bảo toàn 100% vốn gốc
            </span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Lợi tức phát sinh được phân bổ tự động 80% cho GDTG và 20% vào Quỹ dự phòng hệ thống. Vốn thế chấp gốc luôn duy trì tỷ lệ bảo chứng 1:1 cho hạn mức giao dịch, tuyệt đối không sử dụng cho hoạt động đầu cơ rủi ro.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. KHUNG PHÁP LÝ & GIỚI HẠN TRÁCH NHIỆM ─────────────────────── */}
      <section className="space-y-3.5">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-amber-400" />
          <h2 className="text-base font-bold text-slate-100">
            4. Tuyên bố pháp lý &amp; Giới hạn trách nhiệm
          </h2>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 space-y-3 text-xs text-slate-400 leading-relaxed">
          <div className="bg-[#0B0F17] border border-slate-800/80 rounded-lg p-4 space-y-1">
            <strong className="text-slate-200 block">Bản chất hạ tầng phần mềm phi lưu ký</strong>
            <p>
              TrustPact là giao thức phần mềm phi tập trung vận hành bằng hợp đồng thông minh mã nguồn mở. Hệ thống không phải tổ chức tín dụng, không nhận tiền gửi tiết kiệm, không cam kết lợi nhuận cố định và không cung cấp dịch vụ trung gian thanh toán tiền pháp định.
            </p>
          </div>

          <div className="bg-[#0B0F17] border border-slate-800/80 rounded-lg p-4 space-y-1">
            <strong className="text-slate-200 block">Tuân thủ quy định pháp luật hiện hành</strong>
            <p>
              Giao thức không sử dụng tài sản mã hóa làm phương tiện thanh toán thay thế tiền pháp định (VND) theo Nghị định 80/2016/NĐ-CP. Cơ chế hợp đồng ký quỹ vận hành trên nguyên tắc biện pháp bảo đảm thực hiện nghĩa vụ dân sự (ký quỹ, ký cược) theo Điều 292 và Điều 328 Bộ luật Dân sự 2015 đối với giao dịch tài sản số và dịch vụ kỹ thuật.
            </p>
          </div>

          <div className="bg-[#0B0F17] border border-slate-800/80 rounded-lg p-4 space-y-1">
            <strong className="text-slate-200 block">Trách nhiệm thẩm định của các bên tham gia</strong>
            <p>
              Người dùng có trách nhiệm kiểm tra chính xác địa chỉ ví, điều khoản nghiệm thu và định danh đối tác trước khi ký xác nhận giao dịch trên ví Web3. Giao thức không chịu trách nhiệm đối với các thỏa thuận chuyển khoản riêng lẻ nằm ngoài phạm vi Hợp đồng ký quỹ.
            </p>
          </div>
        </div>
      </section>

      {/* ── BOTTOM ACTION BAR ───────────────────────────────────────────── */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <span className="text-xs text-slate-400 font-mono">
          Mã nguồn kiểm chứng công khai · Phi lưu ký · Avalanche C-Chain
        </span>
        <Link
          href="/pact/create"
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 border border-blue-500/30 text-white text-xs font-semibold transition-colors inline-flex items-center justify-center gap-2 shrink-0"
        >
          <span>Tạo giao dịch ký quỹ</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
