"use client";

import React from "react";
import { Check, Clock, ShieldCheck, Zap } from "lucide-react";

interface StepProgressProps {
  currentStep: 1 | 2 | 3 | 4;
  status: "LOCKED" | "COMPLETED" | "CANCELLED";
  className?: string;
}

export function StepProgress({ currentStep, status, className = "" }: StepProgressProps) {
  const steps = [
    {
      step: 1,
      title: "1. Khởi Tạo (Created)",
      desc: "Ký quỹ được thiết lập",
      icon: Clock,
    },
    {
      step: 2,
      title: "2. Nạp Quỹ & Sinh Lãi (Funded)",
      desc: "Sinh lãi 5.2% APY qua Aave",
      icon: Zap,
    },
    {
      step: 3,
      title: "3. Bàn Giao (Delivered)",
      desc: "Bên Bán giao hàng & chứng từ",
      icon: ShieldCheck,
    },
    {
      step: 4,
      title: status === "CANCELLED" ? "4. Hoàn Quỹ (Refunded)" : "4. Quyết Toán (Settled 0.8s)",
      desc: status === "CANCELLED" ? "Đã bồi hoàn 100% về ví" : "Giải ngân tức thì qua Snowman",
      icon: Check,
    },
  ];

  return (
    <div className={`w-full rounded-2xl bg-[#0f131c] border border-slate-700/60 p-4 sm:p-5 shadow-md ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2 relative">
        {steps.map((s, idx) => {
          const isDone = status === "COMPLETED" || s.step < currentStep;
          const isCurrent = status === "LOCKED" && s.step === currentStep;
          const isPending = !isDone && !isCurrent;
          const StepIcon = s.icon;

          return (
            <div key={s.step} className="relative flex flex-col space-y-1.5 sm:px-2">
              {/* Connector line for desktop */}
              {idx < steps.length - 1 && (
                <div
                  className={`hidden sm:block absolute top-4 left-[calc(50%+16px)] right-[calc(-50%+16px)] h-[2px] z-0 transition-colors ${
                    isDone ? "bg-emerald-500/80" : "bg-slate-800"
                  }`}
                />
              )}

              <div className="flex items-center space-x-3 sm:space-x-0 sm:flex-col sm:items-center relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isDone
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                      : isCurrent
                      ? "bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-md animate-pulse"
                      : "bg-slate-800 text-slate-500 border border-slate-700"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <StepIcon className="w-3.5 h-3.5" />}
                </div>

                <div className="sm:text-center sm:pt-2">
                  <div
                    className={`text-xs font-semibold ${
                      isDone
                        ? "text-emerald-400"
                        : isCurrent
                        ? "text-white"
                        : "text-slate-500"
                    }`}
                  >
                    {s.title}
                  </div>
                  <div className="text-[11px] text-slate-400 leading-tight">
                    {s.desc}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
