"use client";

import * as React from "react";
import Link from "next/link";
import { Compass, Menu, X, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { spring, transition, scale, ReducedMotionConfig } from "@animate-ui/react/utils/motion";
import { ScrollProgress, ScrollProgressProvider } from "@animate-ui/react/primitives/scroll-progress";
import { Magnetic } from "@animate-ui/react/primitives/effects/magnetic";

export function LandingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <ReducedMotionConfig>
      <ScrollProgressProvider global>
        {/* Expressive Scroll Progress Bar across top viewport */}
        <ScrollProgress className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cerulean via-emerald to-lime-cream dark:from-sky-500 dark:via-teal-400 dark:to-lime-400 z-50 pointer-events-none" />

        <header
          data-transparent={!scrolled && !mobileMenuOpen ? "true" : "false"}
          className={`fixed top-0 left-0 w-full z-40 max-w-[100vw] transition-all duration-300 ease-in-out ${
            scrolled || mobileMenuOpen
              ? "bg-white/85 backdrop-blur-md border-b border-border-hairline dark:bg-[#0A0F1D]/85 dark:border-[#1E2A42] shadow-[0_4px_20px_rgba(24,78,119,0.06)]"
              : "!bg-transparent !border-transparent shadow-none"
          }`}
        >
          <div className="h-[72px] max-w-[1200px] w-full mx-auto px-3.5 sm:px-6 flex items-center justify-between gap-2">
            {/* Left: Brand Logo & Navigation */}
            <div className="flex items-center gap-4 sm:gap-8 min-w-0">
              <Link
                href="/"
                className="flex items-center gap-2 group transition-transform active:scale-95 shrink-0"
              >
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-2xl bg-gradient-to-br from-lime-cream to-emerald/30 dark:from-emerald-950/60 dark:to-cerulean/30 flex items-center justify-center text-yale-blue dark:text-emerald-300 shadow-sm group-hover:rotate-6 transition-transform shrink-0 border border-transparent dark:border-emerald-500/20">
                  <Compass className="w-5 h-5 text-yale-blue dark:text-emerald-300 stroke-[2.2]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg sm:text-xl font-extrabold text-yale-blue dark:text-white tracking-tight leading-none">
                    Smart Trip
                  </span>
                  <span className="hidden sm:inline text-[10px] font-semibold text-cerulean dark:text-sky-400 tracking-wider uppercase mt-0.5">
                    Đi chung • Chia gọn
                  </span>
                </div>
              </Link>

              {/* Desktop Navigation Links */}
              <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-100 font-semibold">
                <a
                  href="#tinh-nang"
                  className="px-3.5 py-2 rounded-xl hover:text-yale-blue dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  Tính năng
                </a>
                <a
                  href="#kich-ban"
                  className="px-3.5 py-2 rounded-xl hover:text-yale-blue dark:hover:text-white hover:bg-hover-row dark:hover:bg-[#1E2A42] transition-colors"
                >
                  Kịch bản
                </a>
                <a
                  href="#cach-hoat-dong"
                  className="px-3.5 py-2 rounded-xl hover:text-yale-blue dark:hover:text-white hover:bg-hover-row dark:hover:bg-[#1E2A42] transition-colors"
                >
                  Cách hoạt động
                </a>
                <a
                  href="#faq"
                  className="px-3.5 py-2 rounded-xl hover:text-yale-blue dark:hover:text-white hover:bg-hover-row dark:hover:bg-[#1E2A42] transition-colors"
                >
                  Hỏi đáp
                </a>
                <Link
                  href="/guides"
                  className="px-3.5 py-2 rounded-xl hover:text-yale-blue dark:hover:text-white hover:bg-hover-row dark:hover:bg-[#1E2A42] transition-colors flex items-center gap-1.5 text-cerulean dark:text-sky-400 font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cẩm nang</span>
                </Link>
              </nav>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center justify-center text-sm font-semibold text-yale-blue dark:text-slate-200 px-4 py-2.5 rounded-xl hover:bg-hover-row dark:hover:bg-[#1E2A42] transition-colors cursor-pointer"
              >
                Đăng nhập
              </Link>

              <Magnetic strength={0.25} range={70} className="hidden sm:inline-flex">
                <motion.div whileTap={{ scale: scale.press }} transition={spring.press}>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center h-11 px-5 text-sm sm:text-base font-semibold text-white bg-cerulean hover:bg-baltic-blue dark:bg-sky-600 dark:hover:bg-sky-500 rounded-xl shadow-[0_4px_16px_rgba(26,117,159,0.2)] transition-all cursor-pointer group shrink-0"
                  >
                    <span>Bắt đầu miễn phí</span>
                    <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </motion.div>
              </Magnetic>

              {/* Mobile hamburger button with Animate UI Press & Icon Swap */}
              <motion.button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                whileTap={{ scale: scale.press }}
                transition={spring.press}
                className="lg:hidden p-2 rounded-xl bg-cerulean/15 text-yale-blue hover:bg-cerulean/20 dark:bg-sky-500/15 dark:text-sky-300 dark:hover:bg-sky-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cerulean shrink-0 cursor-pointer"
                aria-label="Menu"
                aria-expanded={mobileMenuOpen}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={mobileMenuOpen ? "close" : "open"}
                    initial={{ opacity: 0, rotate: -30 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 30 }}
                    transition={transition.swap}
                  >
                    {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 stroke-[2.5]" />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </div>
          </div>

          {/* Mobile Navigation Dropdown with Animate UI Disclosure Transition */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, filter: "blur(2px)" }}
                animate={{ opacity: 1, height: "auto", filter: "blur(0px)" }}
                exit={{ opacity: 0, height: 0, filter: "blur(2px)" }}
                transition={transition.disclosure}
                className="lg:hidden bg-white dark:bg-[#0A0F1D] border-b border-border-hairline dark:border-[#1E2A42] px-6 py-5 flex flex-col gap-2.5 shadow-xl overflow-hidden"
              >
                <a
                  href="#tinh-nang"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-yale-blue dark:text-slate-200 py-2.5 border-b border-border-hairline dark:border-[#1E2A42]"
                >
                  Tính năng
                </a>
                <a
                  href="#kich-ban"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-yale-blue dark:text-slate-200 py-2.5 border-b border-border-hairline dark:border-[#1E2A42]"
                >
                  Kịch bản chuyến đi
                </a>
                <a
                  href="#cach-hoat-dong"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-yale-blue dark:text-slate-200 py-2.5 border-b border-border-hairline dark:border-[#1E2A42]"
                >
                  Cách hoạt động
                </a>
                <a
                  href="#faq"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-yale-blue dark:text-slate-200 py-2.5 border-b border-border-hairline dark:border-[#1E2A42]"
                >
                  Câu hỏi thường gặp
                </a>
                <Link
                  href="/guides"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-base font-semibold text-cerulean dark:text-sky-400 py-2.5 border-b border-border-hairline dark:border-[#1E2A42] flex items-center justify-between"
                >
                  <span>Cẩm nang du lịch</span>
                  <Sparkles className="w-4 h-4 text-cerulean dark:text-sky-400" />
                </Link>
                <div className="pt-2 flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full h-11 flex items-center justify-center rounded-xl bg-bg-canvas dark:bg-[#141C2E] text-yale-blue dark:text-white font-bold text-sm"
                  >
                    Đăng nhập tài khoản
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>
      </ScrollProgressProvider>
    </ReducedMotionConfig>
  );
}
