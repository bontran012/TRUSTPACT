"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import {
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Search,
  Wallet,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  CONTRACT_ADDRESSES,
  UNIVERSAL_ESCROW_ABI,
  shortenAddress,
} from "@/src/lib/contracts";
import { ShimmerButton } from "@/src/components/ui/ShimmerButton";

interface PactSummary {
  id: number;
  title: string;
  amount: number;
  buyer: `0x${string}`;
  seller: `0x${string}`;
  broker: `0x${string}`;
  brokerName: string;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "DISPUTED";
  timeLeft: string;
  isCustom?: boolean;
}

function getInitials(name: string): string {
  const clean = name.split("(")[0].trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "GD";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const DEFAULT_PACTS: PactSummary[] = [
  {
    id: 4,
    title: "Chuyển nhượng tài khoản số & bản quyền phần mềm (Fuji #4)",
    amount: 6,
    buyer: "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
    seller: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
    broker: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
    brokerName: "Nguyễn Nam",
    status: "ACTIVE",
    timeLeft: "47:58:10",
  },
  {
    id: 1,
    title: "Bàn giao mã nguồn Smart Contract DeFi Vault (Fuji #1)",
    amount: 5,
    buyer: "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
    seller: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
    broker: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
    brokerName: "Nguyễn Nam",
    status: "COMPLETED",
    timeLeft: "00:00:00",
  },
  {
    id: 3,
    title: "Chuyển nhượng tên miền Web3 doanh nghiệp (Fuji #3 · Hòa giải)",
    amount: 4,
    buyer: "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
    seller: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
    broker: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
    brokerName: "Nguyễn Nam",
    status: "COMPLETED",
    timeLeft: "00:00:00",
  },
  {
    id: 2,
    title: "Giao dịch tài sản số sai thông tin cam kết (Fuji #2 · Hoàn 100%)",
    amount: 3,
    buyer: "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
    seller: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
    broker: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
    brokerName: "Nguyễn Nam",
    status: "CANCELLED",
    timeLeft: "00:00:00",
  },
];

function mapNumericStatus(status?: number): PactSummary["status"] {
  if (status === 1) return "COMPLETED";
  if (status === 2) return "CANCELLED";
  if (status === 3) return "DISPUTED";
  return "ACTIVE";
}

export default function MyEscrowPactsPage() {
  const { address } = useAccount();
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [allPacts, setAllPacts] = useState<PactSummary[]>(DEFAULT_PACTS);

  useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "counter",
  });

  useEffect(() => {
    let isMounted = true;
    const fetchServerPacts = async () => {
      try {
        const res = await fetch("/api/pacts");
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.pacts)) {
          const serverList: PactSummary[] = data.pacts.map((item: any) => ({
            id: Number(item.id),
            title: item.terms
              ? String(item.terms).slice(0, 68)
              : `Hợp đồng ký quỹ #${item.id} (${item.amount} USDC)`,
            amount: Number(item.amount) || 1000,
            buyer: (item.buyer as `0x${string}`) || "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
            seller: (item.seller as `0x${string}`) || "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
            broker: (item.broker as `0x${string}`) || "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
            brokerName: "Nguyễn Nam",
            status: mapNumericStatus(Number(item.status)),
            timeLeft: "23:59:59",
            isCustom: true,
          }));

          const serverIds = new Set(serverList.map((p) => p.id));
          const merged = [...serverList, ...DEFAULT_PACTS.filter((p) => !serverIds.has(p.id))];
          setAllPacts(merged);
          return;
        }
      } catch {}

      if (typeof window !== "undefined") {
        try {
          const stored = JSON.parse(localStorage.getItem("trustpact_custom_pacts") || "{}");
          const customList: PactSummary[] = Object.values(stored).map((item: any) => ({
            id: Number(item.id),
            title: item.terms?.slice(0, 68) || "Hợp đồng ký quỹ 3 bên UniversalEscrow",
            amount: Number(item.amount) || 1000,
            buyer: (item.buyer as `0x${string}`) || "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
            seller: (item.seller as `0x${string}`) || "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
            broker: (item.broker as `0x${string}`) || "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
            brokerName: (item.brokerName || "Nguyễn Nam").split("(")[0].trim(),
            status: mapNumericStatus(Number(item.status)),
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
  }, [address]);

  const filteredPacts = allPacts.filter((p) => {
    if (filter === "ACTIVE" && p.status !== "ACTIVE" && p.status !== "DISPUTED") return false;
    if (filter === "COMPLETED" && p.status !== "COMPLETED") return false;
    if (filter === "CANCELLED" && p.status !== "CANCELLED") return false;
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
  const activeCount = allPacts.filter((p) => p.status === "ACTIVE" || p.status === "DISPUTED").length;
  const completedCount = allPacts.filter((p) => p.status === "COMPLETED").length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── 1-LINE CLEAN BANKING HEADER ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Danh sách giao dịch ký quỹ
          </h1>
          <span className="px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400">
            UniversalEscrow · Fuji
          </span>
        </div>

        <Link href="/pact/create" className="self-start sm:self-auto shrink-0">
          <ShimmerButton variant="primary" className="px-4 py-2 text-sm font-medium">
            <Plus className="w-4 h-4" />
            <span>Tạo giao dịch</span>
          </ShimmerButton>
        </Link>
      </div>

      {/* ── COMPACT 4-CARD KPI ROW ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tổng số hợp đồng</span>
            <div className="w-8 h-8 rounded-lg bg-[#0B0F17] border border-slate-800 flex items-center justify-center text-slate-400">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
            {allPacts.length}
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Đang ký quỹ</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
            {activeCount}
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Đã tất toán</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
            {completedCount}
          </div>
        </div>

        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tổng giá trị (USDC)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100 tabular-nums whitespace-nowrap">
            {totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* ── FILTER BAR & SEARCH INPUT ─────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#111827] border border-slate-800 w-fit overflow-x-auto">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "ACTIVE", label: "Đang ký quỹ" },
            { id: "COMPLETED", label: "Đã tất toán" },
            { id: "CANCELLED", label: "Đã hoàn tiền" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id as "ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? "bg-slate-800 text-slate-100 border border-slate-700 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã HĐ, nội dung, địa chỉ ví, GDTG..."
            className="w-full rounded-lg bg-[#0B0F17] border border-slate-800 focus:border-blue-500 focus:outline-none pl-10 pr-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-colors"
          />
        </div>
      </div>

      {/* ── CLEAN FLAT BANKING LEDGER TABLE ───────────────────────────────── */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden">
        {filteredPacts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0B0F17]/70 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 whitespace-nowrap">Mã HĐ</th>
                  <th className="py-3.5 px-4 min-w-[240px]">Nội dung giao dịch</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Bên bán</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">GDTG bảo chứng</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-right">Giá trị (USDC)</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">Trạng thái</th>
                  <th className="py-3.5 px-4 whitespace-nowrap text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-sm">
                {filteredPacts.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-800/35 transition-colors group"
                  >
                    {/* Mã HĐ */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-100 tabular-nums">
                          #{p.id}
                        </span>
                        {p.isCustom && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/25 text-[10px] font-semibold text-blue-400">
                            MỚI
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Nội dung giao dịch */}
                    <td className="py-3.5 px-4 max-w-md">
                      <Link
                        href={`/pact/${p.id}`}
                        className="font-medium text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1"
                      >
                        {p.title}
                      </Link>
                      <span className="text-xs font-mono text-slate-500 block mt-0.5">
                        Bên mua: {shortenAddress(p.buyer)}
                      </span>
                    </td>

                    {/* Bên bán */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-300">
                      {shortenAddress(p.seller)}
                    </td>

                    {/* GDTG bảo chứng */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-200 shrink-0">
                          {getInitials(p.brokerName)}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-200 block">
                            {p.brokerName}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 block">
                            {shortenAddress(p.broker)}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Giá trị (USDC) */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right font-mono font-semibold text-slate-100 tabular-nums">
                      {p.amount.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {p.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <span>Đang ký quỹ</span>
                        </span>
                      ) : p.status === "DISPUTED" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Đang tranh chấp</span>
                        </span>
                      ) : p.status === "COMPLETED" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Đã tất toán</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-xs font-semibold">
                          <span>Đã hoàn tiền</span>
                        </span>
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <Link
                        href={`/pact/${p.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-100 transition-colors"
                      >
                        <span>Chi tiết</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-200 transition-colors" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#0B0F17] border border-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <FileText className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">
                Không tìm thấy giao dịch phù hợp
              </p>
              <p className="text-xs text-slate-400">
                Thử thay đổi bộ lọc tìm kiếm hoặc khởi tạo giao dịch ký quỹ mới.
              </p>
            </div>
            <div className="pt-1">
              <Link
                href="/pact/create"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 border border-blue-500/30 text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo giao dịch</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
