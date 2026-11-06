import * as React from "react";
import Link from "next/link";
import { Compass, ShieldCheck } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="w-full bg-[#113B5B] dark:bg-[#070C18] text-white border-t border-white/10 dark:border-[#1E2A42]">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-white/10 dark:border-[#1E2A42]">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-3">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-lime-cream dark:bg-emerald-950/60 dark:text-emerald-300 text-yale-blue flex items-center justify-center font-bold border border-transparent dark:border-emerald-500/20">
                <Compass className="w-5 h-5 text-yale-blue dark:text-emerald-300" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">
                Smart Trip
              </span>
            </Link>
            <p className="text-sm text-white/70 dark:text-slate-400 max-w-sm leading-relaxed">
              Nền tảng lập kế hoạch du lịch nhóm, theo dõi chi tiêu và chốt sổ đối soát công nợ tự động bằng mã VietQR Napas 24/7.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 dark:bg-[#141C2E] border border-transparent dark:border-[#24314A] text-xs text-lime-cream dark:text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bảo mật chuẩn tài chính AES-256-GCM</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-lime-cream dark:text-emerald-300">
              Khám phá
            </div>
            <ul className="space-y-2 text-sm text-white/80 dark:text-slate-300">
              <li>
                <a href="#tinh-nang" className="hover:text-white dark:hover:text-sky-300 transition-colors">
                  Tính năng nổi bật
                </a>
              </li>
              <li>
                <a href="#kich-ban" className="hover:text-white dark:hover:text-sky-300 transition-colors">
                  Kịch bản chuyến đi
                </a>
              </li>
              <li>
                <a href="#cach-hoat-dong" className="hover:text-white dark:hover:text-sky-300 transition-colors">
                  Cách hoạt động
                </a>
              </li>
              <li>
                <Link href="/guides" className="hover:text-white dark:hover:text-sky-300 transition-colors">
                  Cẩm nang du lịch Việt Nam
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Policy */}
          <div className="md:col-span-4 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-lime-cream dark:text-emerald-300">
              Bảo mật & Điều khoản
            </div>
            <ul className="space-y-2 text-sm text-white/80 dark:text-slate-300">
              <li>
                <a href="#faq" className="hover:text-white dark:hover:text-sky-300 transition-colors">
                  Câu hỏi thường gặp (FAQ)
                </a>
              </li>
              <li>
                <span className="hover:text-white dark:hover:text-sky-300 transition-colors cursor-pointer">
                  Chính sách bảo mật dữ liệu
                </span>
              </li>
              <li>
                <span className="hover:text-white dark:hover:text-sky-300 transition-colors cursor-pointer">
                  Điều khoản sử dụng dịch vụ
                </span>
              </li>
              <li>
                <a href="mailto:support@smarttrip.vn" className="hover:text-white dark:hover:text-sky-300 transition-colors">
                  Hỗ trợ kỹ thuật: support@smarttrip.vn
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* GIANT EDITORIAL BRAND WORDMARK: "Tung." (Inspired by Ledgerly & Bia Estética) */}
        <div className="pt-8 sm:pt-12 pb-3 sm:pb-5 overflow-hidden">
          <div
            className="font-black text-[18vw] lg:text-[13rem] xl:text-[14.5rem] leading-[0.82] tracking-tighter text-white/[0.14] dark:text-white/[0.10] group cursor-default transition-colors duration-500 hover:text-white/[0.22] dark:hover:text-white/[0.16] inline-flex items-baseline whitespace-nowrap"
            aria-label="Tung."
          >
            Tung
            <span className="text-[#52B69A] dark:text-[#76C893] inline-block transition-transform duration-300 group-hover:scale-110 ml-0.5 sm:ml-1">
              .
            </span>
          </div>
        </div>

        {/* Bottom Copyright Bar */}
        <div className="pt-6 border-t border-white/10 dark:border-[#1E2A42] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/50 dark:text-slate-500">
          <p>© 2026 Smart Trip • Tung. Tất cả quyền được bảo lưu.</p>
          <div className="flex items-center gap-4 text-white/50 dark:text-slate-500">
            <span className="hover:text-white/80 transition-colors cursor-pointer">Bảo mật</span>
            <span>•</span>
            <span className="hover:text-white/80 transition-colors cursor-pointer">Điều khoản</span>
            <span>•</span>
            <span className="hover:text-white/80 transition-colors cursor-pointer">Cộng đồng</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
