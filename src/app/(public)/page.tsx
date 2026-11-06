"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  Receipt,
  QrCode,
  UserPlus,
} from "lucide-react";
import { motion } from "motion/react";
import { spring, scale, transition, ReducedMotionConfig } from "@animate-ui/react/utils/motion";
import { RotatingText, RotatingTextContainer } from "@animate-ui/react/primitives/texts/rotating";
import { Magnetic } from "@animate-ui/react/primitives/effects/magnetic";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingMarquee } from "@/components/landing/landing-marquee";
import { BentoFeatures } from "@/components/landing/bento-features";
import { TripScenarios } from "@/components/landing/trip-scenarios";
import { LandingFAQ } from "@/components/landing/landing-faq";
import { LandingCtaBanner } from "@/components/landing/landing-cta-banner";
import { TravelInspiration } from "@/components/landing/travel-inspiration";
import { TravelPrepStrip } from "@/components/landing/travel-prep-strip";
import { TravelStoryBanner } from "@/components/landing/travel-story-banner";

const STEPS = [
  {
    num: "01",
    numBg: "bg-lime-cream text-yale-blue dark:bg-emerald-950/60 dark:text-emerald-400 dark:border dark:border-emerald-500/30",
    title: "Lập nhóm & mời bạn",
    desc: "Tạo chuyến đi trong 30 giây, gửi link hoặc mã QR mời bạn bè. Ai chưa có tài khoản vẫn tham gia chia tiền bình thường.",
    tag: "Link & QR mời tức thì",
    tagColor: "text-functional-positive dark:text-emerald-400",
    icon: UserPlus,
  },
  {
    num: "02",
    numBg: "bg-emerald/20 text-yale-blue dark:bg-sky-950/60 dark:text-sky-400 dark:border dark:border-sky-500/30",
    title: "Lên lịch trình ngày",
    desc: "Sắp xếp thứ tự các điểm đến sáng, trưa, tối logic. Gắn trực tiếp ghi chú di chuyển và điểm check-in hấp dẫn.",
    tag: "Lộ trình thông minh",
    tagColor: "text-cerulean dark:text-sky-400",
    icon: Calendar,
  },
  {
    num: "03",
    numBg: "bg-lime-cream/80 text-yale-blue dark:bg-teal-950/60 dark:text-teal-400 dark:border dark:border-teal-500/30",
    title: "Ghi chi tiêu & hóa đơn",
    desc: "Lưu trữ ảnh hóa đơn gốc, nhập khoản chi và linh hoạt chọn chia đều hoặc chia đích danh từng món ăn cho người tham gia.",
    tag: "Đính kèm ảnh hóa đơn",
    tagColor: "text-functional-positive dark:text-emerald-400",
    icon: Receipt,
  },
  {
    num: "04",
    numBg: "bg-cerulean text-white dark:bg-sky-600 dark:text-white",
    title: "Chốt sổ & VietQR",
    desc: "Hệ thống tự động rút gọn các giao dịch chéo nợ, tạo mã VietQR Napas 24/7 khớp chuẩn 100% từng đồng để chuyển khoản tức thì.",
    tag: "VietQR chuẩn EMVCo",
    tagColor: "text-cerulean dark:text-sky-400",
    icon: QrCode,
  },
];

export default function LandingPage() {
  return (
    <ReducedMotionConfig>
      <div className="min-h-screen bg-bg-canvas flex flex-col font-sans antialiased text-text-body selection:bg-lime-cream selection:text-yale-blue overflow-x-hidden w-full max-w-[100vw]">
        {/* 1. TOP NAVIGATION BAR WITH GLOBAL SCROLL PROGRESS */}
        <LandingHeader />

        {/* 2. MAIN BODY */}
        <main className="w-full max-w-[100vw] flex-1 overflow-x-hidden">
          {/* --- SECTION 1: HERO SECTION (FULL-BLEED SCENIC PANORAMA - PHONG CÁCH ẢNH 2) --- */}
          <section
            className="w-full max-w-[100vw] px-4 sm:px-6 pt-28 sm:pt-36 lg:pt-44 pb-20 lg:pb-36 overflow-hidden relative isolate bg-bg-canvas min-h-[620px] lg:min-h-[760px] flex items-center"
          >
            {/* Full-bleed Panoramic Background Travel Video - 100% Natural, No Scrim */}
            <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-cover object-center scale-102"
              >
                <source src="/videos/hero-travel.mp4" type="video/mp4" />
                {/* Fallback image if video is not supported */}
                <Image
                  src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=2000&q=85"
                  alt="Chuyến đi dã ngoại cắm trại cùng nhóm bạn"
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover object-center"
                />
              </video>
            </div>

            <div className="max-w-[1240px] mx-auto w-full min-w-0 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Heading, Rotating Text, Subtitle & CTAs (Spacious & Clean) */}
              <div className="lg:col-span-8 flex flex-col items-start text-left w-full min-w-0">
                {/* Product Badge Pill */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={transition.panelIn}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#141C2E]/90 border border-white/80 dark:border-[#24314A] shadow-[0_4px_16px_rgba(0,0,0,0.15)] mb-6 max-w-full backdrop-blur-md"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald animate-pulse shrink-0" />
                  <span className="text-xs sm:text-sm font-bold text-yale-blue dark:text-slate-200 tracking-tight truncate">
                    Ứng dụng du lịch nhóm thông minh thế hệ mới
                  </span>
                </motion.div>

                {/* Main Headline with White High Contrast & Animate UI Rotating Text */}
                <h1 className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.7)] tracking-tight leading-[1.2] sm:leading-[1.12] break-words w-full">
                  Đi chung, chia gọn.
                  <span className="block text-lime-cream drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] mt-2">
                    Hết lo{" "}
                    <RotatingTextContainer
                      text={["nợ nần", "tính toán", "chia lẻ", "đòi nợ"]}
                      align="start"
                      duration={2600}
                      className="inline-block overflow-hidden align-bottom"
                    >
                      <RotatingText className="text-lime-cream drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] underline decoration-lime-cream dark:decoration-sky-500/60 decoration-wavy decoration-2" />
                    </RotatingTextContainer>{" "}
                    sau chuyến đi.
                  </span>
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)] mt-6 max-w-[580px] leading-relaxed font-medium">
                  Lên lịch trình theo từng chặng, chia tiền linh hoạt theo món hoặc chia đều, và tất toán công nợ 1-chạm bằng mã VietQR Napas 24/7 tức thì.
                </p>

                {/* Action Buttons Row with Animate UI Magnetic Physics */}
                <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
                  <Magnetic strength={0.3} range={80} className="w-full sm:w-auto">
                    <motion.div
                      whileTap={{ scale: scale.press }}
                      whileHover={{ y: -2 }}
                      transition={spring.press}
                      className="w-full sm:w-auto"
                    >
                      <Link
                        href="/login"
                        className="w-full sm:w-auto h-14 px-8 text-base font-bold shadow-[0_8px_24px_rgba(0,0,0,0.25)] flex items-center justify-center gap-3 cursor-pointer rounded-2xl bg-cerulean hover:bg-baltic-blue dark:bg-sky-600 dark:hover:bg-sky-500 text-white hover:shadow-[0_12px_28px_rgba(0,0,0,0.35)] transition-colors group"
                      >
                        {/* Google Icon SVG */}
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                          <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            fill="white"
                          />
                          <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="white"
                          />
                          <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            fill="white"
                          />
                          <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            fill="white"
                          />
                        </svg>
                        <span>Bắt đầu với Google</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </motion.div>
                  </Magnetic>

                  <motion.div
                    whileTap={{ scale: scale.press }}
                    whileHover={{ y: -2 }}
                    transition={spring.press}
                    className="w-full sm:w-auto"
                  >
                    <a
                      href="#cach-hoat-dong"
                      className="w-full sm:w-auto h-14 px-6 rounded-2xl bg-white/90 dark:bg-[#141C2E]/90 text-yale-blue dark:text-slate-200 hover:bg-hover-row dark:hover:bg-[#1E2A42] border border-white/80 dark:border-[#24314A] transition-colors shadow-sm flex items-center justify-center cursor-pointer backdrop-blur-md font-semibold"
                    >
                      Xem cách hoạt động
                    </a>
                  </motion.div>
                </div>

                {/* Trust Indicators */}
                <div className="mt-8 flex flex-wrap items-center gap-y-2 gap-x-3 text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)] text-xs sm:text-sm font-medium">
                  <span className="inline-flex items-center gap-1.5 text-lime-cream font-bold drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.2] shrink-0" />
                    Miễn phí hoàn toàn
                  </span>
                  <span className="text-white/60 hidden sm:inline">•</span>
                  <span className="inline-flex items-center gap-1.5 text-lime-cream font-bold drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.2] shrink-0" />
                    Không cần tải app
                  </span>
                  <span className="text-white/60 hidden sm:inline">•</span>
                  <span className="inline-flex items-center gap-1.5 text-lime-cream font-bold drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
                    <CheckCircle2 className="w-4 h-4 stroke-[2.2] shrink-0" />
                    Mọi ngân hàng Napas 24/7
                  </span>
                </div>
              </div>

              {/* Right Column: COMPLETELY OPEN & EMPTY (Chuẩn Ảnh 2 - Bầu trời & Phong cảnh tự do) */}
              <div className="hidden lg:block lg:col-span-4 min-h-[300px] pointer-events-none" />
            </div>

            {/* Micro-Card góc dưới bên phải (Chuẩn y hệt Ảnh 2 Ecoriz: Thẻ kính nhỏ xíu gọn gàng) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...transition.panelIn, delay: 0.3 }}
              className="absolute bottom-6 sm:bottom-10 right-4 sm:right-8 lg:right-12 z-20 hidden md:flex items-center gap-3.5 p-3.5 pr-5 rounded-2xl bg-white/90 dark:bg-[#141C2E]/90 border border-white/80 dark:border-[#24314A] shadow-[0_16px_40px_rgba(0,0,0,0.25)] backdrop-blur-md"
            >
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 shadow-sm border border-white/50">
                <Image
                  src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=200&q=80"
                  alt="Vịnh Hạ Long"
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-lime-cream text-yale-blue text-[9px] font-black flex items-center justify-center border border-white shadow-xs">L</span>
                    <span className="w-5 h-5 rounded-full bg-emerald text-white text-[9px] font-black flex items-center justify-center border border-white shadow-xs">T</span>
                    <span className="w-5 h-5 rounded-full bg-cerulean text-white text-[9px] font-black flex items-center justify-center border border-white shadow-xs">M</span>
                  </div>
                  <span className="text-xs font-black text-yale-blue dark:text-white">100% Khớp</span>
                </div>
                <p className="text-[11px] text-text-muted dark:text-slate-400 mt-0.5 truncate max-w-[210px] font-medium">
                  Đối soát VietQR Napas 24/7 tức thì
                </p>
              </div>
            </motion.div>
          </section>

          {/* --- SECTION 2: DẢI CHUYỂN ĐỘNG TICKER NGÂN HÀNG & ĐỊA DANH --- */}
          <LandingMarquee />

          {/* --- SECTION 3: CHUẨN BỊ CHO CHUYẾN ĐI (EDITORIAL MINIMALISM - ẢNH 2) --- */}
          <TravelPrepStrip />

          {/* --- SECTION 4: CẢM HỨNG DU LỊCH & ĐIỂM ĐẾN NỔI BẬT (LONELY PLANET STYLE - ẢNH 2) --- */}
          <TravelInspiration />

          {/* --- SECTION 5: BENTO GRID TÍNH NĂNG ĐỘT PHÁ --- */}
          <BentoFeatures />

          {/* --- SECTION 6: KHOẢNH KHẮC ĐỒNG HÀNH (CINEMATIC TRAVEL BANNER - ẢNH 2) --- */}
          <TravelStoryBanner />

          {/* --- SECTION 7: 4 BƯỚC CHO MỘT CHUYẾN ĐI TRỌN VẸN --- */}
          <section
            id="cach-hoat-dong"
            className="w-full py-20 lg:py-28 bg-[#F0F6E8] dark:bg-[#0A0F1D] border-b border-border-hairline dark:border-[#1E2A42] scroll-mt-20"
          >
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={transition.panelIn}
                className="text-center max-w-2xl mx-auto flex flex-col items-center mb-16"
              >
                <span className="px-3.5 py-1.5 rounded-full bg-white dark:bg-[#141C2E] border border-border-hairline dark:border-[#24314A] text-cerulean dark:text-sky-400 font-bold text-xs uppercase tracking-wider shadow-sm">
                  Quy trình tinh giản
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-yale-blue dark:text-white tracking-tight mt-4">
                  4 bước cho một chuyến đi thảnh thơi
                </h2>
                <p className="text-base sm:text-lg text-text-muted dark:text-slate-300 mt-3">
                  Chỉ mất chưa đầy 2 phút để khởi tạo và đồng bộ chi tiêu cùng bạn bè.
                </p>
              </motion.div>

              {/* 4 Steps Grid with Staggered Viewport Entrance */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {STEPS.map((step, idx) => {
                  const StepIcon = step.icon;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 30, filter: "blur(3px)" }}
                      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ ...transition.panelIn, delay: idx * 0.08 }}
                      whileHover={{ y: -4 }}
                      className="bg-white dark:bg-[#141C2E] rounded-[24px] p-7 border border-border-hairline dark:border-[#24314A] shadow-[0_8px_30px_rgba(24,78,119,0.05)] dark:shadow-none hover:shadow-[0_16px_40px_rgba(24,78,119,0.1)] dark:hover:border-sky-500/30 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold text-lg shadow-sm group-hover:scale-105 transition-transform ${step.numBg}`}
                        >
                          {step.num}
                        </div>
                        <h3 className="text-xl font-bold text-yale-blue dark:text-white mt-5">
                          {step.title}
                        </h3>
                        <p className="text-sm text-text-muted dark:text-slate-300 mt-2.5 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                      <div
                        className={`mt-8 pt-4 border-t border-border-hairline dark:border-[#24314A] flex items-center gap-2 font-bold text-xs ${step.tagColor}`}
                      >
                        <StepIcon className="w-4 h-4 stroke-[2]" />
                        <span>{step.tag}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* --- SECTION 8: KỊCH BẢN CHUYẾN ĐI (CAROUSEL / TABS) --- */}
          <div id="kich-ban" className="scroll-mt-20">
            <TripScenarios />
          </div>

          {/* --- SECTION 9: CÂU HỎI THƯỜNG GẶP (FAQ ACCORDION) --- */}
          <LandingFAQ />

          {/* --- SECTION 10: CALL TO ACTION BANNER (BOTTOM) --- */}
          <LandingCtaBanner />
        </main>

        {/* 3. FOOTER */}
        <LandingFooter />
      </div>
    </ReducedMotionConfig>
  );
}
