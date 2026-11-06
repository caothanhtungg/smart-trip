"use client";

import * as React from "react";
import { ShieldCheck, MapPin, Sparkles } from "lucide-react";

const BANKS = [
  { name: "Vietcombank", short: "VCB" },
  { name: "Techcombank", short: "TCB" },
  { name: "MB Bank", short: "MB" },
  { name: "ACB", short: "ACB" },
  { name: "VPBank", short: "VPB" },
  { name: "TPBank", short: "TPB" },
  { name: "BIDV", short: "BIDV" },
  { name: "VietinBank", short: "CTG" },
  { name: "HDBank", short: "HDB" },
  { name: "Sacombank", short: "STB" },
  { name: "OCB", short: "OCB" },
  { name: "MSB", short: "MSB" },
];

const DESTINATIONS = [
  "Đà Lạt (Lâm Đồng)",
  "Phú Quốc (Kiên Giang)",
  "Hà Giang (Cao nguyên đá)",
  "Sapa (Lào Cai)",
  "Quy Nhơn (Bình Định)",
  "Ninh Bình (Tràng An)",
  "Đà Nẵng (Bà Nà Hills)",
  "Hội An (Quảng Nam)",
  "Phan Thiết (Mũi Né)",
  "Cát Bà (Hải Phòng)",
  "Tà Xùa (Sơn La)",
  "Côn Đảo (Bà Rịa - Vũng Tàu)",
];

export function LandingMarquee() {
  return (
    <section className="w-full py-12 bg-white/60 dark:bg-[#0A0F1D]/80 border-y border-border-hairline dark:border-[#1E2A42] overflow-hidden relative">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left min-w-0">
        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold text-yale-blue dark:text-white uppercase tracking-wider max-w-full">
          <Sparkles className="w-4 h-4 text-cerulean dark:text-sky-400 shrink-0" />
          <span className="leading-snug">Tương thích 100% hệ sinh thái ngân hàng & du lịch Việt</span>
        </div>
        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-text-muted dark:text-slate-400 shrink-0">
          <ShieldCheck className="w-4 h-4 text-functional-positive dark:text-emerald-400 shrink-0" />
          <span>Mã hóa STK AES-256-GCM • Napas 24/7</span>
        </div>
      </div>

      {/* Marquee Track 1: Banks */}
      <div className="relative w-full overflow-hidden flex items-center py-2 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex shrink-0 items-center gap-4 animate-[marquee_35s_linear_infinite] hover:[animation-play-state:paused]">
          {BANKS.concat(BANKS).map((bank, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-bg-canvas/90 dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] text-xs font-semibold text-yale-blue dark:text-slate-200 shadow-sm hover:border-cerulean dark:hover:border-sky-500 transition-colors shrink-0"
            >
              <div className="w-5 h-5 rounded-md bg-cerulean/10 dark:bg-sky-500/20 text-cerulean dark:text-sky-300 flex items-center justify-center font-bold text-[10px]">
                {bank.short.slice(0, 2)}
              </div>
              <span>{bank.name}</span>
              <span className="text-[10px] text-text-muted dark:text-slate-400 font-normal">Napas 24/7</span>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee Track 2: Destinations (Reverse Direction) */}
      <div className="relative w-full overflow-hidden flex items-center py-2 mt-2 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex shrink-0 items-center gap-4 animate-[marquee-reverse_40s_linear_infinite] hover:[animation-play-state:paused]">
          {DESTINATIONS.concat(DESTINATIONS).map((dest, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] text-xs font-medium text-text-body dark:text-slate-200 shadow-sm hover:border-emerald dark:hover:border-emerald-500/50 transition-colors shrink-0"
            >
              <MapPin className="w-3.5 h-3.5 text-cerulean dark:text-sky-400" />
              <span className="font-semibold text-yale-blue dark:text-white">{dest}</span>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        @keyframes marquee-reverse {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }
      `}</style>
    </section>
  );
}
