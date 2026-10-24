"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Scale,
  ShieldCheck,
  Cpu,
  Layers,
  Coins,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  FileCheck2,
  Lock,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Award,
  Globe,
  Terminal,
} from "lucide-react";
import { VERIFIED_FUJI_CONTRACTS, CONTRACT_ADDRESSES } from "@/src/lib/contracts";
import { BorderBeam } from "@/src/components/ui/BorderBeam";
import { CardSpotlight } from "@/src/components/ui/CardSpotlight";

export default function ComplianceAndArchitecturePage() {
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddr(address);
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-16">
      {/* ── TOP HERO BANNER ────────────────────────────────────────────── */}
      <div className="relative rounded-2xl bg-gradient-to-b from-[#161922] to-[#0D0E12] border border-[#1E222D] p-6 sm:p-10 overflow-hidden shadow-2xl">
        <BorderBeam size={250} duration={12} delay={0} colorFrom="#E84142" colorTo="#3B82F6" />
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E84142]/10 border border-[#E84142]/30 text-[#E84142] text-xs font-mono font-semibold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>Avalanche UniHack 2026 · Track A Social Finance</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white flex flex-wrap items-center gap-3">
            <span>Bảo Chứng Pháp Lý & 3 Trụ Cột Công Nghệ</span>
            <span className="text-xs px-2.5 py-1 rounded bg-[#1E222D] text-[#94A3B8] font-mono font-normal">
              Rule 8 & 9 Compliant
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed max-w-3xl">
            Tài liệu minh chứng chính thức về <span className="text-white font-medium">Khung Pháp Lý Dân Sự Việt Nam</span> (Điều 328 BLDS 2015), <span className="text-white font-medium">3 Câu Hỏi Bắt Buộc của Hội đồng Giám khảo Avalanche</span>, và <span className="text-white font-medium">Bộ Smart Contracts đã triển khai thực tế trên Avalanche Fuji Testnet</span>.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href="#smart-contracts"
              className="px-4 py-2 rounded-lg bg-[#E84142] hover:bg-[#D13637] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Smart Contracts On-Chain</span>
            </a>
            <a
              href="#vietnam-law"
              className="px-4 py-2 rounded-lg bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-white text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Khung Pháp Lý VN (Rule 8)</span>
            </a>
            <a
              href="#three-questions"
              className="px-4 py-2 rounded-lg bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-white text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
              <span>3 Trụ Cột Avalanche (Rule 9)</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: VERIFIED FUJI SMART CONTRACTS ──────────────────── */}
      <section id="smart-contracts" className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E222D] pb-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#E84142]" />
            <h2 className="text-lg sm:text-xl font-bold text-white">
              1. Bộ Smart Contracts Triển Khai Thật Trên Avalanche Fuji C-Chain
            </h2>
          </div>
          <span className="text-xs font-mono text-[#10B981] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            100% On-Chain Fuji (ChainID #43113)
          </span>
        </div>

        <p className="text-xs sm:text-sm text-[#94A3B8]">
          Tuân thủ nguyên tắc số 2 của UniHack (100% on Fuji testnet). Toàn bộ 4 hợp đồng cốt lõi đã được biên dịch bằng Foundry, phát sóng (broadcast) on-chain và kết nối liên kết chéo quyền hạn (cross-contract authorization).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {VERIFIED_FUJI_CONTRACTS.map((contract) => (
            <div
              key={contract.name}
              className="rounded-xl bg-[#101217] border border-[#1E222D] p-5 space-y-3 hover:border-[#38BDF8]/40 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{contract.title}</span>
                  </div>
                  <span className="text-xs font-mono text-[#38BDF8]">{contract.name}.sol</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
                  VERIFIED
                </span>
              </div>

              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {contract.purpose}
              </p>

              <div className="rounded-lg bg-[#090A0D] border border-[#1E222D] p-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] text-[#64748B] uppercase font-mono">Contract Address</div>
                  <div className="text-xs font-mono text-[#F1F5F9] truncate">{contract.address}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopy(contract.address)}
                    className="p-1.5 rounded hover:bg-[#1E222D] text-[#94A3B8] hover:text-white transition-colors"
                    title="Sao chép địa chỉ ví hợp đồng"
                  >
                    {copiedAddr === contract.address ? (
                      <Check className="w-3.5 h-3.5 text-[#10B981]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href={contract.explorer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded hover:bg-[#1E222D] text-[#38BDF8] hover:text-white transition-colors"
                    title="Mở trên Snowtrace Explorer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-[#64748B]">
                <a
                  href={contract.subnetsExplorer}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#38BDF8] flex items-center gap-1 transition-colors"
                >
                  <span>Avalanche Subnet Explorer</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span>Network: Fuji C-Chain</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 2: VIETNAMESE LEGAL FRAMEWORK (RULE 8) ───────────── */}
      <section id="vietnam-law" className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E222D] pb-3">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#38BDF8]" />
            <h2 className="text-lg sm:text-xl font-bold text-white">
              2. Khung Pháp Lý Việt Nam (UniHack Rule 8 Compliance)
            </h2>
          </div>
          <span className="text-xs font-mono text-[#F59E0B] flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            Điều 292 & 328 BLDS 2015
          </span>
        </div>

        {/* Warning Banner: Legal Boundaries */}
        <div className="rounded-xl bg-[#F59E0B]/10 border border-[#F59E0B]/30 p-4 space-y-2 text-xs sm:text-sm text-[#F59E0B]">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-white">
            <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
            <span>Tuyên bố Giới Hạn Pháp Lý Bắt Buộc (Legal Limits Statement)</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[#CBD5E1] pl-1">
            <li>
              <strong className="text-white">Crypto không phải là phương tiện thanh toán hợp pháp tại Việt Nam</strong> theo Nghị định 80/2016/NĐ-CP và Công văn số 5747/NHNN-PC. TrustPact không dùng tiền mã hóa để trả lương hay mua bán hàng hóa tiêu dùng thay thế tiền đồng Việt Nam (VND).
            </li>
            <li>
              <strong className="text-white">Dịch vụ tư vấn pháp lý và tài chính có thu phí bắt buộc phải có giấy phép chuyên ngành.</strong> TrustPact không cung cấp dịch vụ tư vấn đầu tư hay cam kết lợi tức cố định.
            </li>
            <li>
              <strong className="text-white">Tokenized Stocks bị chặn địa lý (Geoblocked):</strong> Mọi tài sản chứng khoán token hóa tuân thủ nghiêm ngặt quy định phát hành và miễn trừ khu vực địa lý.
            </li>
          </ul>
        </div>

        {/* Deep Dive: Article 328 & Civil Escrow */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSpotlight className="rounded-xl bg-[#101217] border border-[#1E222D] p-5 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <FileCheck2 className="w-4 h-4 text-[#38BDF8]" />
              <span>Cơ Chế Đặt Cọc / Ký Cược Dân Sự (Điều 328 BLDS)</span>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Theo <strong className="text-white">Khoản 1 Điều 328 Bộ luật Dân sự 2015</strong>:
              <br />
              <em className="text-[#CBD5E1]">
                &quot;Đặt cọc là việc một bên giao cho bên kia một khoản tiền hoặc kim khí quý, đá quý hoặc vật có giá trị khác trong một thời hạn để bảo đảm giao kết hoặc thực hiện hợp đồng.&quot;
              </em>
            </p>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Trong khuôn khổ TrustPact, <strong className="text-white">tài sản số (Digital Asset / Testnet Token)</strong> được xem là <strong className="text-[#38BDF8]">&quot;Vật có giá trị dân sự&quot;</strong> do các bên tự nguyện chuyển giao vào két sắt hợp đồng thông minh nhằm bảo đảm nghĩa vụ thực hiện giao dịch trao đổi tài sản số, tài khoản phần mềm hoặc hợp đồng dịch vụ xuyên biên giới.
            </p>
          </CardSpotlight>

          <CardSpotlight className="rounded-xl bg-[#101217] border border-[#1E222D] p-5 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Lock className="w-4 h-4 text-[#10B981]" />
              <span>Vai Trò Của Két Sắt UniversalEscrow & GDTG</span>
            </div>
            <ul className="text-xs text-[#94A3B8] space-y-2 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-[#10B981] font-bold">1.</span>
                <span>
                  <strong className="text-white">Két sắt trung lập bất biến:</strong> Hợp đồng <code>UniversalEscrow.sol</code> giữ tài sản ký cược độc lập. Không ai (kể cả đội ngũ sáng lập) có quyền tự ý rút tiền.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#10B981] font-bold">2.</span>
                <span>
                  <strong className="text-white">Bảo chứng hạn mức (Collateral Quota):</strong> Broker phải ký cược tiền thật vào <code>StakedBrokerRegistry</code> để làm tài sản bảo đảm. Nếu Broker gian lận, hợp đồng tự động thi hành chế tài phạt cọc (Slashing) bồi thường 100% cho bên bị hại.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#10B981] font-bold">3.</span>
                <span>
                  <strong className="text-white">Tự động bảo vệ hết hạn (Timeout Claim):</strong> Nếu quá thời hạn cam kết mà giao dịch không hoàn tất, Bên Mua có quyền tự động rút lại toàn bộ tài sản mà không bị bên nào giữ tiền vô lý.
                </span>
              </li>
            </ul>
          </CardSpotlight>
        </div>
      </section>

      {/* ── SECTION 3: THE 3 MANDATORY AVALANCHE QUESTIONS (RULE 9) ───── */}
      <section id="three-questions" className="space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E222D] pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#10B981]" />
            <h2 className="text-lg sm:text-xl font-bold text-white">
              3. Ba Trụ Cột Công Nghệ Bắt Buộc Của Avalanche (UniHack Rule 9)
            </h2>
          </div>
          <span className="text-xs font-mono text-[#E84142] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            3 Mandatory Questions
          </span>
        </div>

        <div className="space-y-4">
          {/* Question 1: Why On-Chain? */}
          <div className="rounded-xl bg-[#101217] border border-[#1E222D] p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#E84142]/10 border border-[#E84142]/30 flex items-center justify-center text-[#E84142] font-bold text-xs">
                Q1
              </div>
              <h3 className="text-base font-bold text-white">
                Tại sao phải On-Chain? (Why On-Chain?)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="rounded-lg bg-[#090A0D] border border-[#1E222D] p-3 space-y-1.5">
                <div className="text-xs font-bold text-[#E84142] flex items-center gap-1">
                  <span>Triệt Tiêu Exit Scam</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Ở thị trường Web2 (nhóm Zalo/Telegram), GDTG thường giả danh admin hoặc chiếm đoạt tiền khi kèo có giá trị lớn. On-chain khóa tiền vào Smart Contract, không một cá nhân nào có thể bỏ trốn cùng tài sản.
                </p>
              </div>

              <div className="rounded-lg bg-[#090A0D] border border-[#1E222D] p-3 space-y-1.5">
                <div className="text-xs font-bold text-[#38BDF8] flex items-center gap-1">
                  <span>Hành Quyết Tự Động</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Giải ngân, hoàn tiền, hoặc chia phần trăm hòa giải diễn ra tức thì qua logic code đã kiểm toán. Tránh hoàn toàn việc tài khoản ngân hàng bị &quot;treo giao dịch&quot; hay tranh chấp chuyển khoản ngoài đời.
                </p>
              </div>

              <div className="rounded-lg bg-[#090A0D] border border-[#1E222D] p-3 space-y-1.5">
                <div className="text-xs font-bold text-[#10B981] flex items-center gap-1">
                  <span>Tín Nhiệm Bất Biến (SBT)</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Uy tín của GDTG được đúc thành Soulbound Token (SBT) không thể chuyển nhượng. Số lượng giao dịch thành công, tỷ lệ giải quyết tranh chấp được ghi nhận vĩnh viễn trên blockchain, chống nick ảo mua bán.
                </p>
              </div>
            </div>
          </div>

          {/* Question 2: Why Avalanche? */}
          <div className="rounded-xl bg-[#101217] border border-[#1E222D] p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8] font-bold text-xs">
                Q2
              </div>
              <h3 className="text-base font-bold text-white">
                Tại sao là Avalanche? (Why Avalanche?)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="rounded-lg bg-[#090A0D] border border-[#1E222D] p-3 space-y-1.5">
                <div className="text-xs font-bold text-[#38BDF8] flex items-center gap-1">
                  <span>Sub-second 0.8s Finality</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Thuật toán Snowman Consensus hoàn tất giao dịch dưới 0.8 giây. Người mua nạp tiền và người bán bàn giao hàng hóa có kết quả ngay lập tức, không phải chờ đợi hàng phút như các chain khác.
                </p>
              </div>

              <div className="rounded-lg bg-[#090A0D] border border-[#1E222D] p-3 space-y-1.5">
                <div className="text-xs font-bold text-[#A855F7] flex items-center gap-1">
                  <span>Kiến Trúc Custom L1 (0đ Gas)</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Tách biệt dữ liệu: C-Chain dành cho két sắt tài chính giá trị cao; Custom L1 (Subnet) dành cho Radar tra cứu lừa đảo cộng đồng với chi phí gas = 0, phục vụ bot Telegram hàng triệu người dùng.
                </p>
              </div>

              <div className="rounded-lg bg-[#090A0D] border border-[#1E222D] p-3 space-y-1.5">
                <div className="text-xs font-bold text-[#F59E0B] flex items-center gap-1">
                  <span>Avalanche Teleporter (ICM)</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                  Giao tiếp liên chuỗi bản địa (Inter-Chain Messaging) cho phép đồng bộ hóa trạng thái gian lận từ Custom L1 sang C-Chain để tự động đóng băng hạn mức của Broker mà không cần cầu nối tập trung.
                </p>
              </div>
            </div>
          </div>

          {/* Question 3: Where Yield Comes From? */}
          <div className="rounded-xl bg-[#101217] border border-[#1E222D] p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center text-[#10B981] font-bold text-xs">
                Q3
              </div>
              <h3 className="text-base font-bold text-white">
                Lợi tức từ đâu ra? (Where does Yield come from?)
              </h3>
            </div>
            <div className="rounded-lg bg-[#090A0D] border border-[#1E222D] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#10B981] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  Tích Hợp Trực Tiếp Aave V3 Liquidity Pool Trên Avalanche
                </span>
                <span className="text-xs font-mono text-[#94A3B8]">
                  Thị trường Lending Thực Tế (~5.2% APY)
                </span>
              </div>

              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Tuân thủ nghiêm ngặt <strong className="text-white">UniHack Rule 7</strong> (Tuyệt đối không in token lạm phát để trả lãi). Toàn bộ tiền cọc bảo lãnh của Broker trong <code>StakedBrokerRegistry.sol</code> được ủy thác nạp vào <strong className="text-[#38BDF8]">Aave V3 Fuji Pool (0x8B9b...bb40)</strong> để sinh lãi thực tế.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="rounded-md bg-[#161922] border border-[#1E222D] p-3 space-y-1">
                  <div className="text-[11px] font-bold text-white flex items-center gap-1">
                    <span className="text-[#10B981]">80% Lợi Tức Aave:</span>
                    <span>Thưởng Cho Broker</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                    Được cộng dồn theo giây vào tài khoản của Broker như phần thưởng thụ động cho việc nạp tiền ký cược giữ gìn sự minh bạch của nền tảng.
                  </p>
                </div>

                <div className="rounded-md bg-[#161922] border border-[#1E222D] p-3 space-y-1">
                  <div className="text-[11px] font-bold text-white flex items-center gap-1">
                    <span className="text-[#38BDF8]">20% Lợi Tức Aave:</span>
                    <span>Quỹ Bảo Hiểm & Vận Hành</span>
                  </div>
                  <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                    Tích lũy vào Protocol Treasury để bảo hiểm rủi ro cho người dùng khi xảy ra bất khả kháng và duy trì máy chủ hạ tầng.
                  </p>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-[#10B981] flex items-center gap-1.5 font-mono">
                <Check className="w-3.5 h-3.5 shrink-0" />
                <span>Vốn cọc gốc (Principal) được bảo toàn 100% — Không rủi ro thâm hụt tài sản bảo chứng.</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOT & LIVE APP FOOTNOTE ───────────────────────────────────── */}
      <div className="rounded-xl bg-[#161922] border border-[#1E222D] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-2">
            <Terminal className="w-4 h-4 text-[#38BDF8]" />
            <span>Trải Nghiệm Hệ Sinh Thái TrustPact Ngay</span>
          </div>
          <p className="text-xs text-[#94A3B8]">
            Dùng thử trực tiếp Két sắt ký quỹ hoặc tra cứu scam tự động 24/7 qua Bot Telegram.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="https://t.me/TrustPact_Sentinel_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-lg bg-[#229ED9] hover:bg-[#1D88BD] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Bot Telegram @TrustPact_Sentinel_bot</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <Link
            href="/pact/create"
            className="px-3.5 py-2 rounded-lg bg-[#E84142] hover:bg-[#D13637] text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>Tạo Kèo Ký Quỹ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
