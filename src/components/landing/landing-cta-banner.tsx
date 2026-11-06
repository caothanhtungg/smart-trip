"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { spring, scale, ReducedMotionConfig } from "@animate-ui/react/utils/motion";
import { Magnetic } from "@animate-ui/react/primitives/effects/magnetic";

export function LandingCtaBanner() {
  return (
    <ReducedMotionConfig>
      <section className="w-full py-20 lg:py-28 bg-yale-blue dark:bg-[#070C18] border-t border-transparent dark:border-[#1E2A42] text-white relative overflow-hidden">
        {/* Radiant ambient glow blobs in background */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cerulean/30 dark:bg-sky-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald/20 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-[1000px] mx-auto px-4 sm:px-6 text-center">
          {/* Floating review badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-semibold text-lime-cream dark:text-emerald-300 mb-8">
            <Sparkles className="w-4 h-4 text-lime-cream dark:text-emerald-300" />
            <span>Sẵn sàng cho chuyến đi tuyệt vời tiếp theo của nhóm bạn?</span>
          </div>

          {/* Big Catchy Title */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] max-w-3xl mx-auto text-white">
            Đi chung vui vẻ, chia tiền sòng phẳng chỉ trong một chạm.
          </h2>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-xl text-white/80 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Gia nhập hàng ngàn bạn trẻ và nhóm phượt khắp Việt Nam đang tận hưởng những chuyến đi nhẹ đầu, không còn áp lực tính toán hay đòi nợ.
          </p>

          {/* Big CTA Action */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Magnetic strength={0.3} range={90} disableOnTouch className="w-full sm:w-auto">
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ scale: scale.press }}
                transition={spring.press}
                className="w-full sm:w-auto"
              >
                <Link
                  href="/login"
                  className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-lime-cream text-yale-blue font-bold text-base sm:text-lg hover:bg-white dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300 transition-colors shadow-[0_10px_30px_rgba(217,237,146,0.3)] dark:shadow-[0_10px_30px_rgba(52,211,153,0.2)] flex items-center justify-center gap-3 cursor-pointer group"
                >
                  {/* Google Icon SVG */}
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Bắt đầu ngay với Google</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </Magnetic>

            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: scale.press }}
              transition={spring.press}
              className="w-full sm:w-auto"
            >
              <Link
                href="/guides"
                className="w-full sm:w-auto h-14 px-7 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-base border border-white/20 transition-colors flex items-center justify-center gap-2"
              >
                <span>Khám phá cẩm nang du lịch</span>
              </Link>
            </motion.div>
          </div>

          {/* Trust Points */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-sm text-white/70 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-lime-cream dark:text-emerald-400" />
              100% Miễn phí trọn đời
            </span>
            <span className="text-white/30 dark:text-slate-600 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-lime-cream dark:text-emerald-400" />
              Mã hóa tài khoản AES-256-GCM
            </span>
            <span className="text-white/30 dark:text-slate-600 hidden sm:inline">•</span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-lime-cream dark:text-emerald-400" />
              Tạo chuyến đi trong 30 giây
            </span>
          </div>
        </div>
      </section>
    </ReducedMotionConfig>
  );
}
