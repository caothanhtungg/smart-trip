"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight, Sparkles, HeartHandshake } from "lucide-react";
import { scale, spring } from "@animate-ui/react/utils/motion";

export function TravelStoryBanner() {
  return (
    <section className="w-full py-12 lg:py-16 bg-bg-canvas relative overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="relative rounded-[36px] overflow-hidden min-h-[420px] sm:min-h-[460px] flex items-center p-6 sm:p-12 lg:p-16 border border-white/30 dark:border-white/10 shadow-[0_24px_60px_rgba(24,78,119,0.18)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.6)] group">
          {/* Background Cinematic Visual */}
          <Image
            src="https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1920&q=85"
            alt="Rừng thông và ánh hoàng hôn rực rỡ"
            fill
            sizes="(max-width: 1200px) 100vw, 1200px"
            className="object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
          />

          {/* Deep Cinematic Overlay Scrim */}
          <div className="absolute inset-0 bg-gradient-to-r from-yale-blue/95 via-yale-blue/75 to-transparent dark:from-[#070C18]/95 dark:via-[#070C18]/80 dark:to-transparent" />

          {/* Atmospheric Glow */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-lime-cream/20 rounded-full blur-3xl pointer-events-none" />

          {/* Banner Content (High-impact, concise) */}
          <div className="relative z-10 max-w-xl text-white">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 dark:bg-black/40 backdrop-blur-md border border-white/20 text-lime-cream text-xs font-bold tracking-wide uppercase mb-4 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Chuyến đi không khoảng cách</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-[1.18]">
              Chuyến đi tuyệt vời nhất là chuyến đi có nhau.
            </h2>

            <p className="mt-4 text-base sm:text-lg text-white/85 leading-relaxed font-normal">
              Đừng để chuyện tính toán tiền bạc làm vơi bớt niềm vui. Smart Trip tự động chốt sổ, đối soát công nợ và tạo mã VietQR Napas 24/7 để bạn toàn tâm tận hưởng từng khoảnh khắc.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <motion.div whileTap={{ scale: scale.press }} transition={spring.press}>
                <Link
                  href="/login"
                  className="h-13 px-7 rounded-2xl bg-lime-cream hover:bg-white text-yale-blue font-extrabold text-sm flex items-center gap-2.5 shadow-[0_8px_24px_rgba(217,237,146,0.3)] transition-all cursor-pointer group/btn"
                >
                  <span>Bắt đầu chuyến đi ngay</span>
                  <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              <div className="flex items-center gap-2 text-xs text-white/75 font-semibold">
                <HeartHandshake className="w-4 h-4 text-lime-cream" />
                <span>100% Miễn phí trọn đời • Không cần tải app</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

