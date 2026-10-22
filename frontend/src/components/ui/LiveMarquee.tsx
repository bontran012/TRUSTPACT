"use client";

import React from "react";
import { ShieldCheck, Activity, Lock, Landmark, Zap } from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";

export function LiveMarquee() {
  const { t } = useLanguage();

  const tickerItems = [
    {
      icon: Zap,
      color: "text-[#10B981]",
      text: t("Avalanche Fuji C-Chain: Block #34,912,840 · 0.001s TTR", "Avalanche Fuji C-Chain: Block #34,912,840 · 0.001s TTR"),
    },
    {
      icon: Lock,
      color: "text-[#E84142]",
      text: t("UniversalEscrow Vault: Đã khóa an toàn 285,400 USDC", "UniversalEscrow Vault: 285,400 USDC Secured On-Chain"),
    },
    {
      icon: Landmark,
      color: "text-[#F59E0B]",
      text: t("Aave V3 Real-Yield APY: +5.20% USDC tự động trả về GDTG", "Aave V3 Real-Yield APY: +5.20% USDC Accruing to Brokers"),
    },
    {
      icon: ShieldCheck,
      color: "text-[#3B82F6]",
      text: t("Scam Radar L1: 142 địa chỉ lừa đảo bị cô lập bởi cộng đồng", "Scam Radar L1: 142 malicious addresses flagged by community"),
    },
  ];

  return (
    <div className="w-full bg-[#0D0F14] border-b border-[#1E222D] overflow-hidden py-1.5 px-4 font-mono text-[11px] text-[#94A3B8]">
      <div className="flex items-center gap-8 animate-[marquee_35s_linear_infinite] whitespace-nowrap">
        {[...tickerItems, ...tickerItems].map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={index} className="flex items-center gap-2 shrink-0">
              <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              <span>{item.text}</span>
              <span className="text-[#1E222D]">/</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
