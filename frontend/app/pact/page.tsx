"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useReadContract } from "wagmi";
import {
  Lock,
  PlusCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  Search,
  TrendingUp,
  Layers,
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
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  timeLeft: string;
  isCustom?: boolean;
}

const DEFAULT_PACTS: PactSummary[] = [
  {
    id: 4,
    title: "Chuyển nhượng tài khoản số & Full Skin VIP (On-Chain Fuji #4)",
    amount: 6,
    buyer: "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
    seller: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
    broker: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
    brokerName: "Nguyễn Nam (Giám Định)",
    status: "ACTIVE",
    timeLeft: "47:58:10",
  },
  {
    id: 1,
    title: "Bàn giao mã nguồn Smart Contract DeFi Vault (On-Chain Fuji #1)",
    amount: 5,
    buyer: "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
    seller: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
    broker: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
    brokerName: "Nguyễn Nam (Giám Định)",
    status: "COMPLETED",
    timeLeft: "00:00:00",
  },
  {
    id: 3,
    title: "Thương vụ trao đổi tên miền Web3 cao cấp (On-Chain Fuji #3 · Hòa giải)",
    amount: 4,
    buyer: "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
    seller: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
    broker: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
    brokerName: "Nguyễn Nam (Giám Định)",
    status: "COMPLETED",
    timeLeft: "00:00:00",
  },
  {
    id: 2,
    title: "Giao dịch Acc Game VIP lỗi thông tin (On-Chain Fuji #2 · Hoàn 100%)",
    amount: 3,
    buyer: "0x3b37DC6eB5C492c5023B4F7a8A5a7D955E0787A5",
    seller: "0xaa6a4B6F817bE5E7D4C025b4f32b0651EED33c2c",
    broker: "0x3B1C113A5230b027757D6f45F0819c48E8F2BBc5",
    brokerName: "Nguyễn Nam (Giám Định)",
    status: "CANCELLED",
    timeLeft: "00:00:00",
  },
];

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
            title: `Kèo Ký Quỹ #${item.id} (${item.amount} USDC)`,
            amount: Number(item.amount) || 1000,
            buyer: (item.buyer as `0x${string}`) || "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
            seller: (item.seller as `0x${string}`) || "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F8000002",
            broker: (item.broker as `0x${string}`) || "0x30F1492bC78E12a899Ad34De91eF11B12E7a889A",
            brokerName: "Nguyễn Nam (Giám Định)",
            status: item.status === 1 ? "COMPLETED" : item.status === 2 ? "CANCELLED" : "ACTIVE",
            timeLeft: "23:59:59",
            isCustom: true,
          }));

          const serverIds = new Set(serverList.map((p) => p.id));
          const merged = [...serverList, ...DEFAULT_PACTS.filter((p) => !serverIds.has(p.id))];
          setAllPacts(merged);
          return;
        }
      } catch (err) {}

      if (typeof window !== "undefined") {
        try {
          const stored = JSON.parse(localStorage.getItem("trustpact_custom_pacts") || "{}");
          const customList: PactSummary[] = Object.values(stored).map((item: any) => ({
            id: Number(item.id),
            title: item.terms?.slice(0, 60) || "Kèo Ký Quỹ Bảo Chứng UniversalEscrow 3 Bên",
            amount: Number(item.amount) || 1000,
            buyer: (item.buyer as `0x${string}`) || "0x1A2bC3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F80001",
            seller: (item.seller as `0x${string}`) || "0x89C3d4E5f6A7B8C9D0E1F2A3B4C5D6E7F8000002",
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
  }, [address]);

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
    <div className="space-y-8 animate-fade-in">
      {/* ── SCENIC 3D VAULT BANNER HEADER ───────────────────────────────── */}
      <div className="card overflow-hidden p-0 relative">
        <img
          src="/images/hero-3d-escrow.png"
          alt=""
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-55 hidden sm:block"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1E47]/95 via-[#0E2454]/85 to-[#0E2454]/30" />

        <div className="relative p-7 sm:p-9 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="badge-pill bg-sky-400/20 border border-sky-300/35 text-sky-200 text-xs">
              <Layers className="w-3.5 h-3.5 text-sky-300" />
              <span>Escrow Ledger · Avalanche Fuji</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sổ Kèo Giao Dịch Của Tôi
            </h1>
            <p className="text-sm text-sky-100/85">
              Theo dõi trạng thái dòng tiền và truy cập trực tiếp phòng đối soát 3 bên phi tập trung
            </p>
          </div>

          <Link href="/pact/create" className="self-start sm:self-auto shrink-0">
            <ShimmerButton variant="primary" className="px-6 py-3.5 font-bold">
              <PlusCircle className="w-4 h-4" />
              <span>Tạo Kèo Mới</span>
            </ShimmerButton>
          </Link>
        </div>
      </div>

      {/* ── SUMMARY FROSTED CAPSULES ────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-100/80 font-medium">Tổng số hợp đồng</span>
            <div className="w-9 h-9 rounded-full bg-sky-400/20 border border-sky-300/30 flex items-center justify-center text-sky-200">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-white tabular-nums">{allPacts.length}</div>
          <span className="text-xs text-sky-200/70 block">Sổ cái UniversalEscrow</span>
        </div>

        <div className="card p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-100/80 font-medium">Đang khóa trong két</span>
            <div className="w-9 h-9 rounded-full bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-amber-300 tabular-nums">{activeCount}</div>
          <span className="text-xs text-amber-200/80 block">Đang được bảo chứng</span>
        </div>

        <div className="card p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-100/80 font-medium">Đã tất toán</span>
            <div className="w-9 h-9 rounded-full bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center text-emerald-200">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-300 tabular-nums">{completedCount}</div>
          <span className="text-xs text-emerald-200/80 block">Giải ngân hoàn tất</span>
        </div>

        <div className="card p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-100/80 font-medium">Tổng giá trị bảo vệ</span>
            <div className="w-9 h-9 rounded-full bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center text-emerald-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold font-mono text-white tabular-nums whitespace-nowrap">
            {totalValue.toLocaleString()} <span className="text-xs font-normal text-sky-200/80">USDC</span>
          </div>
          <span className="text-xs text-sky-200/70 block">An toàn 100% On-Chain</span>
        </div>
      </div>

      {/* ── PILL FILTER TABS & SEARCH BAR ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1.5 rounded-full bg-white/[0.09] backdrop-blur-xl border border-white/[0.18] w-fit overflow-x-auto">
          {[
            { id: "ALL", label: "Tất Cả" },
            { id: "ACTIVE", label: "Đang Khóa Tiền" },
            { id: "COMPLETED", label: "Đã Tất Toán" },
            { id: "CANCELLED", label: "Đã Hoàn Tiền" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filter === tab.id
                  ? "bg-gradient-to-r from-sky-400/35 to-indigo-500/40 text-white border border-sky-300/45 shadow-sm"
                  : "text-sky-100/75 hover:text-white border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-sky-200/60">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã kèo, tiêu đề, ví hoặc GDTG..."
            className="input-field rounded-full pl-11 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* ── FLOATING FROSTED DEAL CARDS (Zero Rigid Spreadsheet Grid!) ──── */}
      {filteredPacts.length > 0 ? (
        <div className="space-y-3.5">
          {filteredPacts.map((p) => (
            <Link
              key={p.id}
              href={`/pact/${p.id}`}
              className="group card p-5 sm:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-sky-300/45 hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Left: Vault Icon + Deal Title & Counterparties */}
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400/25 to-indigo-500/30 border border-sky-300/35 flex flex-col items-center justify-center shrink-0 shadow-sm">
                  <span className="text-[10px] font-mono text-sky-200 leading-none">KÈO</span>
                  <span className="text-sm font-extrabold font-mono text-white leading-tight">#{p.id}</span>
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base text-white group-hover:text-sky-200 transition-colors truncate max-w-md">
                      {p.title}
                    </span>
                    {p.isCustom && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-400/25 text-sky-100 border border-sky-300/40">
                        MỚI TẠO
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-sky-100/75 flex-wrap">
                    <span>
                      Bên Bán: <strong className="font-mono text-white">{shortenAddress(p.seller)}</strong>
                    </span>
                    <span className="text-white/30">·</span>
                    <span className="inline-flex items-center gap-1.5">
                      <img
                        src="/images/avatar-nam.jpg"
                        alt={p.brokerName}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span>GDTG: <strong className="text-sky-200">{p.brokerName}</strong></span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Amount + Status Pill + CTA */}
              <div className="flex items-center justify-between lg:justify-end gap-5 pt-3 lg:pt-0 border-t lg:border-t-0 border-white/[0.1] shrink-0">
                <div className="text-left lg:text-right">
                  <span className="text-[11px] text-sky-100/70 block">Giá trị ký quỹ</span>
                  <span className="text-lg font-extrabold font-mono text-white tabular-nums whitespace-nowrap">
                    {p.amount.toLocaleString("en-US")} <span className="text-xs font-normal text-sky-200">USDC</span>
                  </span>
                </div>

                <div>
                  {p.status === "ACTIVE" ? (
                    <span className="badge-pill bg-amber-400/20 border border-amber-300/40 text-amber-200">
                      <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
                      <span>Đang Khóa</span>
                    </span>
                  ) : p.status === "COMPLETED" ? (
                    <span className="badge-pill bg-emerald-400/20 border border-emerald-300/40 text-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-300" />
                      <span>Hoàn Tất</span>
                    </span>
                  ) : (
                    <span className="badge-pill bg-white/[0.1] border border-white/[0.2] text-sky-100/80">
                      <span>Đã Hoàn Tiền</span>
                    </span>
                  )}
                </div>

                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.12] group-hover:bg-sky-400/30 border border-white/[0.22] group-hover:border-sky-300/50 text-xs font-bold text-white transition-all whitespace-nowrap">
                  <span>Mở Phòng</span>
                  <ArrowRight className="w-3.5 h-3.5 text-sky-200 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card p-14 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-sky-400/20 border border-sky-300/35 flex items-center justify-center mx-auto text-sky-200">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-white">Không tìm thấy hợp đồng phù hợp</p>
            <p className="text-xs text-sky-100/80">Hãy thử từ khóa khác hoặc tạo một két sắt ký quỹ mới.</p>
          </div>
          <Link
            href="/pact/create"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 text-white text-xs font-bold transition-all shadow-lg"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tạo Kèo Ký Quỹ Đầu Tiên</span>
          </Link>
        </div>
      )}
    </div>
  );
}
