"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import {
  Lock,
  PlusSquare,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Search,
  Coins,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  CONTRACT_ADDRESSES,
  UNIVERSAL_ESCROW_ABI,
  formatUsdc,
  shortenAddress,
} from "@/src/lib/contracts";
import { ShimmerButton } from "@/src/components/ui/ShimmerButton";
import { BorderBeam } from "@/src/components/ui/BorderBeam";

interface PactSummary {
  id: number;
  title: string;
  amount: number;
  buyer: `0x${string}`;
  seller: `0x${string}`;
  broker: `0x${string}`;
  brokerName: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  timeLeft: string;
  isCustom?: boolean;
}

const DEFAULT_PACTS: PactSummary[] = [
  {
    id: 101,
    title: "Chuyển nhượng tài khoản số & Full Skin VIP",
    amount: 1000,
    buyer: "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
    seller: "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
    broker: "0x30F1492bC78E12a899Ad34De91eF11B12E7a889A",
    brokerName: "Nguyễn Nam (Giám Định)",
    status: "ACTIVE",
    timeLeft: "23:42:10",
  },
  {
    id: 102,
    title: "Bàn giao mã nguồn Smart Contract DeFi Vault",
    amount: 2500,
    buyer: "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
    seller: "0x77D1492bC78E12a899Ad34De91eF11B12E7a889E",
    broker: "0x44B1492bC78E12a899Ad34De91eF11B12E7a889B",
    brokerName: "Hoàng Minh (OTC Custodian)",
    status: "COMPLETED",
    timeLeft: "00:00:00",
  },
  {
    id: 103,
    title: "Thương vụ trao đổi tên miền web3 cao cấp",
    amount: 800,
    buyer: "0x66F1492bC78E12a899Ad34De91eF11B12E7a889D",
    seller: "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
    broker: "0x30F1492bC78E12a899Ad34De91eF11B12E7a889A",
    brokerName: "Nguyễn Nam (Giám Định)",
    status: "ACTIVE",
    timeLeft: "14:10:05",
  },
];

export default function MyEscrowPactsPage() {
  const { address } = useAccount();
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [allPacts, setAllPacts] = useState<PactSummary[]>(DEFAULT_PACTS);

  const { data: counterRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "counter",
  });

  // Load pacts from server backend database & merge with defaults
  useEffect(() => {
    let isMounted = true;
    const fetchServerPacts = async () => {
      try {
        const res = await fetch("/api/pacts");
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.pacts)) {
          const serverList: PactSummary[] = data.pacts.map((item: any) => ({
            id: Number(item.id),
            title: `Kèo Ký Quỹ #${item.id} (${item.amount} USDC)`,
            amount: Number(item.amount) || 1000,
            buyer: (item.buyer as `0x${string}`) || "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
            seller: (item.seller as `0x${string}`) || "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
            broker: (item.broker as `0x${string}`) || "0x30F1492bC78E12a899Ad34De91eF11B12E7a889A",
            brokerName: "Nguyễn Nam (Giám Định)",
            status: item.status === 1 ? "COMPLETED" : item.status === 2 ? "CANCELLED" : "ACTIVE",
            timeLeft: "23:59:59",
            isCustom: true,
          }));

          // Merge: server list takes top precedence
          const serverIds = new Set(serverList.map((p) => p.id));
          const merged = [...serverList, ...DEFAULT_PACTS.filter((p) => !serverIds.has(p.id))];
          setAllPacts(merged);
          return;
        }
      } catch (err) {}

      // Fallback to localStorage if offline
      if (typeof window !== "undefined") {
        try {
          const stored = JSON.parse(localStorage.getItem("trustpact_custom_pacts") || "{}");
          const customList: PactSummary[] = Object.values(stored).map((item: any) => ({
            id: Number(item.id),
            title: item.terms?.slice(0, 60) || "Kèo Ký Quỹ Bảo Chứng UniversalEscrow 3 Bên",
            amount: Number(item.amount) || 1000,
            buyer: (item.buyer as `0x${string}`) || "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
            seller: (item.seller as `0x${string}`) || "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80002",
            broker: (item.broker as `0x${string}`) || "0x30F1492bC78E12a899Ad34De91eF11B12E7a889A",
            brokerName: item.brokerName || "Nguyễn Nam (Giám Định)",
            status: item.status === 1 ? "COMPLETED" : item.status === 2 ? "CANCELLED" : "ACTIVE",
            timeLeft: "23:59:59",
            isCustom: true,
          }));

          if (customList.length > 0) {
            const customIds = new Set(customList.map((p) => p.id));
            const merged = [...customList, ...DEFAULT_PACTS.filter((p) => !customIds.has(p.id))];
            setAllPacts(merged);
          }
        } catch {}
      }
    };

    fetchServerPacts();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPacts = allPacts.filter((p) => {
    if (filter !== "ALL" && p.status !== filter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      p.id.toString().includes(q) ||
      p.title.toLowerCase().includes(q) ||
      p.brokerName.toLowerCase().includes(q) ||
      p.buyer.toLowerCase().includes(q) ||
      p.seller.toLowerCase().includes(q) ||
      p.broker.toLowerCase().includes(q)
    );
  });

  const totalValue = allPacts.reduce((sum, p) => sum + p.amount, 0);
  const activeCount = allPacts.filter((p) => p.status === "ACTIVE").length;
  const completedCount = allPacts.filter((p) => p.status === "COMPLETED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E222D]">
        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#F1F5F9] uppercase tracking-wide">
            Sổ Kèo Của Tôi (UniversalEscrow Ledger)
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Quản lý và giám sát tất cả các két sắt ký quỹ ba bên mà ví của bạn tham gia
          </p>
        </div>

        <Link href="/pact/create" className="self-start sm:self-auto">
          <ShimmerButton
            variant="primary"
            className="px-4 py-2 rounded-md text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-sm"
          >
            <PlusSquare className="w-3.5 h-3.5" />
            <span>Tạo Kèo Mới</span>
          </ShimmerButton>
        </Link>
      </div>

      {/* ── TOP SUMMARY TELEMETRY ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
        <div className="p-3.5 rounded-lg panel-border bg-[#101217] space-y-1">
          <span className="text-[10px] text-[#64748B] uppercase font-bold font-sans">Tổng Số Kèo</span>
          <div className="text-xl font-bold text-[#F1F5F9]">{allPacts.length} Kèo</div>
          <span className="text-[10px] text-[#64748B]">Sổ cái UniversalEscrow</span>
        </div>
        <div className="p-3.5 rounded-lg panel-border bg-[#101217] space-y-1">
          <span className="text-[10px] text-[#64748B] uppercase font-bold font-sans">Đang Khóa Tiền</span>
          <div className="text-xl font-bold text-[#F59E0B]">{activeCount} Kèo</div>
          <span className="text-[10px] text-[#F59E0B] flex items-center gap-1">
            <Clock className="w-3 h-3" /> Đang bảo chứng
          </span>
        </div>
        <div className="p-3.5 rounded-lg panel-border bg-[#101217] space-y-1">
          <span className="text-[10px] text-[#64748B] uppercase font-bold font-sans">Đã Tất Toán</span>
          <div className="text-xl font-bold text-[#10B981]">{completedCount} Kèo</div>
          <span className="text-[10px] text-[#10B981] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Giải ngân thành công
          </span>
        </div>
        <div className="p-3.5 rounded-lg panel-border bg-[#101217] space-y-1">
          <span className="text-[10px] text-[#64748B] uppercase font-bold font-sans">Tổng Giá Trị Ký Quỹ</span>
          <div className="text-xl font-bold text-[#F1F5F9] tabular-nums">{totalValue.toLocaleString()} USDC</div>
          <span className="text-[10px] text-[#10B981] flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Bảo vệ 100% dòng tiền
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-md bg-[#101217] border border-[#1E222D] w-fit text-xs font-mono">
          {[
            { id: "ALL", label: "Tất Cả" },
            { id: "ACTIVE", label: "Đang Khóa Tiền" },
            { id: "COMPLETED", label: "Đã Tất Toán" },
            { id: "CANCELLED", label: "Đã Hủy" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded transition-colors ${
                filter === tab.id
                  ? "bg-[#161922] text-[#F1F5F9] border border-[#1E222D] font-bold"
                  : "text-[#94A3B8] hover:text-[#F1F5F9]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative max-w-xs w-full">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#64748B]">
            <Search className="w-3.5 h-3.5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo ID, tiêu đề, ví, GDTG..."
            className="w-full pl-8 pr-3 py-1.5 rounded-md bg-[#101217] border border-[#1E222D] focus:border-[#E84142] text-xs font-mono text-[#F1F5F9] placeholder-[#64748B] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Pacts Table / List */}
      <div className="rounded-lg panel-border bg-[#101217] overflow-hidden">
        {filteredPacts.length > 0 ? (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#090A0D] text-[#64748B] border-b border-[#1E222D] text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Pact ID</th>
                <th className="py-3 px-4 font-sans">Nội Dung Giao Dịch</th>
                <th className="py-3 px-4 text-right">Giá Trị Ký Quỹ</th>
                <th className="py-3 px-4">Bên Bán</th>
                <th className="py-3 px-4">GDTG (Broker)</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E222D] text-[#94A3B8]">
              {filteredPacts.map((p) => (
                <tr key={p.id} className="hover:bg-[#161922] transition-colors">
                  <td className="py-3 px-4 font-bold text-[#F1F5F9]">
                    <div className="flex items-center gap-1.5">
                      <span>#{p.id}</span>
                      {p.isCustom && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-[#E84142]/15 text-[#E84142] border border-[#E84142]/30 font-bold">
                          MỚI TẠO
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-sans font-medium text-[#F1F5F9] max-w-xs truncate">
                    {p.title}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#F1F5F9] tabular-nums">
                    {p.amount.toLocaleString()} USDC
                  </td>
                  <td className="py-3 px-4 text-[#94A3B8]">{shortenAddress(p.seller)}</td>
                  <td className="py-3 px-4">
                    <span className="text-[#F1F5F9] block">{p.brokerName}</span>
                    <span className="text-[10px] text-[#64748B] block">{shortenAddress(p.broker)}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                        p.status === "ACTIVE"
                          ? "bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]"
                          : p.status === "COMPLETED"
                          ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
                          : "bg-[#64748B]/10 border-[#64748B]/30 text-[#64748B]"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/pact/${p.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#161922] hover:bg-[#1E222D] border border-[#1E222D] text-[#F1F5F9] text-xs transition-colors"
                    >
                      <span>Vào Két Sắt</span>
                      <ArrowRight className="w-3 h-3 text-[#E84142]" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center space-y-2">
            <Lock className="w-8 h-8 text-[#64748B] mx-auto opacity-50" />
            <span className="text-xs text-[#94A3B8] block font-sans">
              Không tìm thấy hợp đồng ký quỹ nào phù hợp với bộ lọc hiện tại.
            </span>
            <Link
              href="/pact/create"
              className="inline-block mt-2 px-3 py-1.5 rounded bg-[#E84142] text-white text-xs font-medium hover:bg-[#D13637] transition-colors"
            >
              Tạo Kèo Mới Ngay
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
