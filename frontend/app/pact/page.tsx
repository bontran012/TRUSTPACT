"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import {
  CONTRACT_ADDRESSES,
  UNIVERSAL_ESCROW_ABI,
  formatUsdc,
  shortenAddress,
} from "@/src/lib/contracts";

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

  const { data: counterRaw } = useReadContract({
    address: CONTRACT_ADDRESSES.universalEscrow,
    abi: UNIVERSAL_ESCROW_ABI,
    functionName: "counter",
  });

  const filteredPacts = DEFAULT_PACTS.filter((p) => {
    if (filter === "ALL") return true;
    return p.status === filter;
  });

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

        <Link
          href="/pact/create"
          className="px-4 py-2 rounded-md bg-[#E84142] hover:bg-[#D13637] text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <PlusSquare className="w-3.5 h-3.5" />
          <span>Tạo Kèo Mới</span>
        </Link>
      </div>

      {/* Filter Tabs */}
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

      {/* Pacts Table / List */}
      <div className="rounded-lg panel-border bg-[#101217] overflow-hidden">
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
                <td className="py-3 px-4 font-bold text-[#F1F5F9]">#{p.id}</td>
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
      </div>
    </div>
  );
}
