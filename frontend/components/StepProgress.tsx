import React from "react";

import { Check, Clock, ShieldCheck, Zap, RotateCcw } from "lucide-react";



interface StepProgressProps {
  currentStep: 1 | 2 | 3 | 4;
  status: "LOCKED" | "COMPLETED" | "CANCELLED" | "SLASHED";
  className?: string;
}



export function StepProgress({ currentStep, status, className = "" }: StepProgressProps) {

  const steps = [

    {

      step: 1,

      tag: "STEP 01",

      title: "Khởi Tạo Hợp Đồng",

      desc: "Ký quỹ được thiết lập",

      icon: Clock,

    },

    {

      step: 2,

      tag: "STEP 02",

      title: "Nạp Quỹ & Sinh Lãi",

      desc: "Lãi kép 5.2% APY qua Aave",

      icon: Zap,

    },

    {

      step: 3,

      tag: "STEP 03",

      title: "Bàn Giao & Nghiệm Thu",

      desc: "Đối soát chứng từ On-chain",

      icon: ShieldCheck,

    },

    {

      step: 4,

      tag: "STEP 04",

      title: status === "SLASHED" ? "Chém Cọc Broker" : status === "CANCELLED" ? "Hoàn Quỹ Bảo Toàn" : "Quyết Toán (0.8s)",
      desc: status === "SLASHED" ? "Bồi thường 100% cho Buyer" : status === "CANCELLED" ? "Đã bồi hoàn 100% về ví" : "Giải ngân tức thì qua Snowman",
      icon: (status === "CANCELLED" || status === "SLASHED") ? RotateCcw : Check,

    },

  ];



  return (

    <div

      className={`relative overflow-hidden w-full rounded-2xl bg-[#0A0E17]/90 backdrop-blur-xl border border-white/[0.08] p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.08)] ${className}`}

    >

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 sm:gap-3 relative">

        {steps.map((s, idx) => {
          const isCancelledStep = (status === "CANCELLED" || status === "SLASHED") && s.step === 4;
          const isDone = status === "COMPLETED" || ((status !== "CANCELLED" && status !== "SLASHED") && s.step < currentStep);
          const isCurrent = status === "LOCKED" && s.step === currentStep;

          const StepIcon = s.icon;



          return (

            <div key={s.step} className="relative flex flex-col sm:px-2 group">

              {/* Connector Line (Desktop) */}

              {idx < steps.length - 1 && (

                <div className="hidden sm:block absolute top-5 left-[calc(50%+22px)] right-[calc(-50%+22px)] h-[2px] bg-white/[0.06] z-0 rounded-full overflow-hidden">

                  <div

                    className={`h-full transition-all duration-700 ${

                      isDone

                        ? "w-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.8)]"

                        : isCurrent

                        ? "w-1/2 bg-gradient-to-r from-blue-500 to-transparent"

                        : "w-0"

                    }`}

                  />

                </div>

              )}



              <div className="flex items-center space-x-3.5 sm:space-x-0 sm:flex-col sm:items-center relative z-10">

                {/* Icon Circle */}

                <div className="relative flex items-center justify-center">

                  {isCurrent && (

                    <span className="absolute -inset-1.5 rounded-full bg-blue-500/25 animate-ping" />

                  )}

                  <div

                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-300 ${

                      isCancelledStep

                        ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_20px_rgba(244,63,94,0.25)]"

                        : isDone

                        ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)]"

                        : isCurrent

                        ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white border border-blue-400/50 shadow-[0_0_24px_rgba(59,130,246,0.45)]"

                        : "bg-white/[0.03] text-slate-500 border border-white/[0.08]"

                    }`}

                  >

                    {isDone ? (

                      <Check className="w-4 h-4 stroke-[3]" />

                    ) : (

                      <StepIcon className="w-4 h-4" />

                    )}

                  </div>

                </div>



                {/* Text Content */}

                <div className="sm:text-center sm:pt-3">

                  <span

                    className={`text-[10px] font-mono tracking-wider uppercase block ${

                      isDone

                        ? "text-emerald-400/80"

                        : isCurrent

                        ? "text-blue-400 font-semibold"

                        : "text-slate-600"

                    }`}

                  >

                    {s.tag}

                  </span>

                  <div

                    className={`text-xs sm:text-[13px] font-semibold mt-0.5 tracking-tight ${

                      isCancelledStep

                        ? "text-rose-400"

                        : isDone

                        ? "text-white"

                        : isCurrent

                        ? "text-white"

                        : "text-slate-400"

                    }`}

                  >

                    {s.title}

                  </div>

                  <div className="text-[11px] text-slate-500 leading-snug mt-0.5">

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
