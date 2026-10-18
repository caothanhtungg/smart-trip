"use client";

import * as React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Calendar,
  Receipt,
  QrCode,
  UserPlus,
  ArrowRight,
  Clock,
  Pin,
  Map,
  Sparkles,
  Users,
  ShieldCheck,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { HeroIllustration } from "@/components/landing/hero-illustration";

export default function LandingPage() {
  const { toast } = useToast();

  return (
    <div className="min-h-screen bg-bg-canvas flex flex-col font-sans antialiased text-text-body">
      {/* 1. TOP NAVIGATION BAR */}
      <LandingHeader />

      {/* 2. MAIN BODY */}
      <main className="w-full pt-[72px] flex-1 bg-bg-canvas">
        {/* --- SECTION 1: HERO SECTION --- */}
        <section className="w-full bg-gradient-to-b from-lime-cream via-lime-cream/35 to-bg-canvas px-4 sm:px-6 pt-10 pb-16 lg:py-20">
          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Heading & CTAs */}
            <div className="lg:col-span-7 flex flex-col items-start">
              {/* Product Badge Pill */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 border border-border-hairline shadow-[0_4px_16px_rgba(24,78,119,0.06)] mb-6">
                <Sparkles className="w-4 h-4 text-cerulean" />
                <span className="text-xs sm:text-sm font-semibold text-yale-blue tracking-tight">
                  Ứng dụng du lịch nhóm thông minh thế hệ mới
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-5xl font-bold text-yale-blue tracking-tight leading-[1.15] max-w-xl text-left">
                Đi chung, chia gọn.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-text-muted mt-4 max-w-[520px] leading-relaxed">
                Lên lịch trình, ghi chi tiêu theo địa điểm và trả nợ bằng QR chỉ trong một nơi.
              </p>

              {/* Action Buttons Row */}
              <div className="mt-8 flex flex-wrap items-center gap-4 w-full sm:w-auto">
                <Link
                  href="/login"
                  className="h-[52px] px-7 text-base font-semibold shadow-[0_4px_16px_rgba(24,78,119,0.14)] flex items-center gap-3 cursor-pointer rounded-xl bg-cerulean text-white hover:bg-baltic-blue transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist"
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
                  <span>Tiếp tục với Google</span>
                </Link>

                <a
                  href="#cach-hoat-dong"
                  className="inline-flex items-center justify-center h-[52px] px-6 rounded-[12px] bg-white text-cerulean font-semibold text-base hover:bg-hover-row border border-border-hairline transition-all shadow-[0_4px_16px_rgba(24,78,119,0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist"
                >
                  Xem cách hoạt động
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 flex flex-wrap items-center gap-y-2 gap-x-4 text-text-muted text-sm">
                <span className="inline-flex items-center gap-1.5 text-functional-positive font-semibold">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                  Miễn phí hoàn toàn
                </span>
                <span className="text-text-muted/40">•</span>
                <span className="inline-flex items-center gap-1.5 text-functional-positive font-semibold">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                  Không cần tải app
                </span>
                <span className="text-text-muted/40">•</span>
                <span className="inline-flex items-center gap-1.5 text-functional-positive font-semibold">
                  <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                  Hỗ trợ mọi ngân hàng Việt Nam
                </span>
              </div>
            </div>

            {/* Right Column: Hero Illustration Container */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-[480px] aspect-square rounded-[28px] p-6 bg-white/85 border border-border-hairline shadow-[0_8px_24px_rgba(24,78,119,0.12)] backdrop-blur-sm flex items-center justify-center overflow-hidden">
                {/* Decorative radial glows */}
                <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-mint-green/20 blur-2xl pointer-events-none" />
                <div className="absolute -left-12 -bottom-12 w-48 h-48 rounded-full bg-ocean-mist/20 blur-2xl pointer-events-none" />

                {/* Handcrafted Vector Hero Illustration from Stitch */}
                <HeroIllustration className="relative z-10 w-full h-full object-contain drop-shadow-[0_8px_16px_rgba(24,78,119,0.08)]" />

                {/* Floating Micro Badge: Live Bill Scan */}
                <div className="absolute bottom-4 left-4 z-20 bg-white border border-border-hairline rounded-xl p-3 shadow-[0_8px_24px_rgba(24,78,119,0.12)] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-functional-positive/10 flex items-center justify-center text-functional-positive">
                    <QrCode className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-yale-blue">Quét VietQR 1 chạm</p>
                    <p className="text-xs text-text-muted">Chính xác đến từng ₫</p>
                  </div>
                </div>

                {/* Floating Micro Badge: Realtime Sync */}
                <div className="absolute top-4 right-4 z-20 bg-lime-cream text-yale-blue font-bold text-xs px-3.5 py-1.5 rounded-full shadow-[0_4px_16px_rgba(24,78,119,0.08)] flex items-center gap-1.5 border border-border-hairline">
                  <span className="w-2 h-2 rounded-full bg-emerald-fill animate-pulse" />
                  Đồng bộ thời gian thực
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 2: 4 BƯỚC CHO MỘT CHUYẾN ĐI TRỌN VẸN --- */}
        <section
          id="cach-hoat-dong"
          className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-16 lg:py-20 scroll-mt-20"
        >
          <div className="text-center max-w-2xl mx-auto flex flex-col items-center">
            <span className="px-3.5 py-1 rounded-full bg-cerulean/10 text-cerulean font-semibold text-xs sm:text-sm">
              Quy trình đơn giản
            </span>
            <h2 className="text-2xl sm:text-4xl font-bold text-yale-blue tracking-tight mt-3">
              4 bước cho một chuyến đi trọn vẹn
            </h2>
            <p className="text-sm sm:text-base text-text-muted mt-3">
              Chỉ mất chưa đầy 2 phút để khởi tạo và đồng bộ chi tiêu cùng bạn bè.
            </p>
          </div>

          {/* 4 Numbered Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            {/* Step 01 */}
            <div className="bg-white rounded-[20px] p-6 border border-border-hairline shadow-[0_4px_16px_rgba(24,78,119,0.06)] hover:shadow-[0_8px_24px_rgba(24,78,119,0.12)] transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-lime-cream flex items-center justify-center font-bold text-yale-blue text-lg">
                  01
                </div>
                <h3 className="text-lg font-bold text-yale-blue mt-5">
                  Lập nhóm
                </h3>
                <p className="text-sm text-text-muted mt-2.5 leading-relaxed">
                  Tạo chuyến đi, mời bạn bè qua link hoặc mã QR. Thành viên chưa có tài khoản vẫn tham gia chia tiền bình thường.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border-hairline flex items-center gap-2 text-functional-positive font-semibold text-xs">
                <UserPlus className="w-4 h-4 stroke-[2]" />
                <span>Link mời tức thì</span>
              </div>
            </div>

            {/* Step 02 */}
            <div className="bg-white rounded-[20px] p-6 border border-border-hairline shadow-[0_4px_16px_rgba(24,78,119,0.06)] hover:shadow-[0_8px_24px_rgba(24,78,119,0.12)] transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-mint-green/40 flex items-center justify-center font-bold text-yale-blue text-lg">
                  02
                </div>
                <h3 className="text-lg font-bold text-yale-blue mt-5">
                  Lên lịch trình
                </h3>
                <p className="text-sm text-text-muted mt-2.5 leading-relaxed">
                  Xếp lịch trình từng ngày trực quan, đính kèm địa điểm ghé thăm và dự toán ngân sách chuyến đi rõ ràng.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border-hairline flex items-center gap-2 text-cerulean font-semibold text-xs">
                <Calendar className="w-4 h-4 stroke-[2]" />
                <span>Lộ trình thông minh</span>
              </div>
            </div>

            {/* Step 03 */}
            <div className="bg-white rounded-[20px] p-6 border border-border-hairline shadow-[0_4px_16px_rgba(24,78,119,0.06)] hover:shadow-[0_8px_24px_rgba(24,78,119,0.12)] transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-light-green/50 flex items-center justify-center font-bold text-yale-blue text-lg">
                  03
                </div>
                <h3 className="text-lg font-bold text-yale-blue mt-5">
                  Ghi chi tiêu
                </h3>
                <p className="text-sm text-text-muted mt-2.5 leading-relaxed">
                  Lưu trữ hóa đơn hoặc nhập nhanh khoản chi, linh hoạt chọn chia đều hoặc chia chi tiết theo từng món ăn.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border-hairline flex items-center gap-2 text-tropical-teal font-semibold text-xs">
                <Receipt className="w-4 h-4 stroke-[2]" />
                <span>Đính kèm ảnh hóa đơn</span>
              </div>
            </div>

            {/* Step 04 */}
            <div className="bg-white rounded-[20px] p-6 border border-border-hairline shadow-[0_4px_16px_rgba(24,78,119,0.06)] hover:shadow-[0_8px_24px_rgba(24,78,119,0.12)] transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-lime-cream flex items-center justify-center font-bold text-yale-blue text-lg">
                  04
                </div>
                <h3 className="text-lg font-bold text-yale-blue mt-5">
                  Chốt sổ và trả nợ
                </h3>
                <p className="text-sm text-text-muted mt-2.5 leading-relaxed">
                  Thuật toán tự động tối ưu rút gọn nợ chéo, tạo mã QR ngân hàng chính xác đến từng đồng để thanh toán trong 3 giây.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-border-hairline flex items-center gap-2 text-baltic-blue font-semibold text-xs">
                <QrCode className="w-4 h-4 stroke-[2]" />
                <span>VietQR chính xác 100%</span>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 3: TÍNH NĂNG NỔI BẬT --- */}
        <section
          id="tinh-nang"
          className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-12 lg:py-16 scroll-mt-20"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <span className="px-3.5 py-1 rounded-full bg-cerulean/10 text-cerulean font-semibold text-xs sm:text-sm">
                Giải pháp toàn diện
              </span>
              <h2 className="text-2xl sm:text-4xl font-bold text-yale-blue tracking-tight mt-3">
                Mọi công cụ bạn cần cho chuyến đi không lo toan
              </h2>
            </div>
            <p className="text-text-muted text-sm sm:text-base mt-2 md:mt-0 max-w-sm">
              Thiết kế tối ưu theo thói quen du lịch và thanh toán tiện lợi của người Việt.
            </p>
          </div>

          {/* Feature Card 1: Lịch trình trực quan */}
          <div className="bg-white rounded-[20px] p-6 md:p-8 mb-8 border border-border-hairline shadow-[0_4px_16px_rgba(24,78,119,0.06)] hover:shadow-[0_8px_24px_rgba(24,78,119,0.12)] transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 flex flex-col items-start">
                <span className="px-3 py-1 rounded-full bg-lime-cream/80 text-yale-blue font-semibold text-xs tracking-wide uppercase">
                  Lịch trình trực quan
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-yale-blue mt-3">
                  Đọc hiểu lộ trình theo ngày
                </h3>
                <p className="text-sm sm:text-base text-text-muted mt-3 leading-relaxed">
                  Sắp xếp từng điểm đến sáng - trưa - tối logic trên timeline. Đồng bộ lịch trình thời gian thực giữa các thành viên, hiển thị rõ dự kiến thời gian di chuyển và ghi chú check-in.
                </p>
                {/* Interactive chips */}
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-bg-canvas text-yale-blue font-semibold text-xs">
                    <Clock className="w-3.5 h-3.5 text-cerulean" />
                    Lịch trình 3N2Đ
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-bg-canvas text-yale-blue font-semibold text-xs">
                    <Pin className="w-3.5 h-3.5 text-ocean-mist" />
                    8 địa điểm
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-bg-canvas text-yale-blue font-semibold text-xs">
                    <Map className="w-3.5 h-3.5 text-functional-positive" />
                    Bản đồ lộ trình tích hợp
                  </span>
                </div>
              </div>

              {/* Visual Preview: Schedule Widget */}
              <div className="lg:col-span-5 bg-bg-canvas rounded-2xl p-5 border border-border-hairline">
                <div className="flex items-center justify-between pb-3 border-b border-border-hairline">
                  <span className="font-semibold text-sm text-yale-blue">Ngày 1: Khám phá Phố cổ</span>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white text-cerulean font-semibold shadow-sm border border-border-hairline">
                    4 điểm đến
                  </span>
                </div>
                <div className="space-y-3 mt-3">
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-border-hairline flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-lime-cream text-yale-blue flex items-center justify-center font-bold text-xs">
                        08:30
                      </span>
                      <div>
                        <p className="font-semibold text-sm text-yale-blue">Cà phê Giảng Yên Phụ</p>
                        <p className="text-xs text-text-muted">Ghi chú: Thử cà phê trứng</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-cerulean" />
                  </div>

                  <div className="bg-white rounded-xl p-3 shadow-sm border border-border-hairline flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-mint-green/50 text-yale-blue flex items-center justify-center font-bold text-xs">
                        11:30
                      </span>
                      <div>
                        <p className="font-semibold text-sm text-yale-blue">Bún chả Hương Liên</p>
                        <p className="text-xs text-text-muted">Đã đặt trước bàn 6 người</p>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-fill" />
                  </div>

                  <div className="bg-white rounded-xl p-3 shadow-sm border border-border-hairline flex items-center justify-between opacity-80">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-cerulean/10 text-yale-blue flex items-center justify-center font-bold text-xs">
                        15:00
                      </span>
                      <div>
                        <p className="font-semibold text-sm text-yale-blue">Hoàng Thành Thăng Long</p>
                        <p className="text-xs text-text-muted">Vé tham quan nhóm</p>
                      </div>
                    </div>
                    <Clock className="w-4 h-4 text-text-muted" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Card 2: Chia theo món linh hoạt */}
          <div className="bg-white rounded-[20px] p-6 md:p-8 mb-8 border border-border-hairline shadow-[0_4px_16px_rgba(24,78,119,0.06)] hover:shadow-[0_8px_24px_rgba(24,78,119,0.12)] transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Visual Preview: Itemized Split Calculator */}
              <div className="lg:col-span-5 order-2 lg:order-1 bg-bg-canvas rounded-2xl p-5 border border-border-hairline">
                <div className="flex items-center justify-between pb-3 border-b border-border-hairline">
                  <div>
                    <span className="font-semibold text-sm text-yale-blue block">Hóa đơn: Lẩu Bò Nhúng Quế</span>
                    <span className="text-xs text-functional-positive font-semibold">Chuẩn khớp 100% • 3 thành viên</span>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-functional-warning-bg text-functional-warning font-semibold">
                    Chia theo món
                  </span>
                </div>
                <div className="space-y-2 mt-3">
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-border-hairline flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-lime-cream text-yale-blue font-bold text-xs flex items-center justify-center">
                        N
                      </span>
                      <span className="text-xs text-yale-blue font-medium">Nam (3 món + nước ngọt)</span>
                    </div>
                    <span className="font-bold text-sm text-yale-blue tabular-nums">145.000 ₫</span>
                  </div>

                  <div className="bg-white rounded-xl p-3 shadow-sm border border-border-hairline flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-light-green text-yale-blue font-bold text-xs flex items-center justify-center">
                        L
                      </span>
                      <span className="text-xs text-yale-blue font-medium">Linh (Ăn chay + trà đào)</span>
                    </div>
                    <span className="font-bold text-sm text-yale-blue tabular-nums">85.000 ₫</span>
                  </div>

                  <div className="bg-white rounded-xl p-3 shadow-sm border border-border-hairline flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-mint-green text-yale-blue font-bold text-xs flex items-center justify-center">
                        H
                      </span>
                      <span className="text-xs text-yale-blue font-medium">Hoàng (Lẩu bò + bia craft)</span>
                    </div>
                    <span className="font-bold text-sm text-yale-blue tabular-nums">210.000 ₫</span>
                  </div>

                  {/* Summary note - strictly avoids unverified VAT claims */}
                  <div className="bg-cerulean/5 rounded-xl p-2.5 flex items-center justify-between text-xs text-text-muted">
                    <span>Tự động phân bổ đúng phần từng người</span>
                    <span className="font-bold text-yale-blue tabular-nums">Tổng: 440.000 ₫</span>
                  </div>
                </div>
              </div>

              {/* Text Description */}
              <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col items-start">
                <span className="px-3 py-1 rounded-full bg-lime-cream/80 text-yale-blue font-semibold text-xs tracking-wide uppercase">
                  Chia tiền linh hoạt
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-yale-blue mt-3">
                  Chia theo món, không lệch một đồng
                </h3>
                <p className="text-sm sm:text-base text-text-muted mt-3 leading-relaxed">
                  Ai ăn gì trả nấy hoặc chia đều tùy chọn. Người không dùng món nào thì không phải chịu tiền oan. Phân bổ minh bạch, công bằng cho tất cả thành viên trong đoàn.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-bg-canvas text-yale-blue font-semibold text-xs">
                    <Receipt className="w-3.5 h-3.5 text-functional-positive" />
                    Hóa đơn Lẩu Bò
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-bg-canvas text-yale-blue font-semibold text-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-cerulean" />
                    Chuẩn khớp 100%
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-bg-canvas text-yale-blue font-semibold text-xs">
                    <Users className="w-3.5 h-3.5 text-ocean-mist" />
                    Chia theo từng người
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Card 3: Rút gọn nợ & VietQR */}
          <div className="bg-white rounded-[20px] p-6 md:p-8 border border-border-hairline shadow-[0_4px_16px_rgba(24,78,119,0.06)] hover:shadow-[0_8px_24px_rgba(24,78,119,0.12)] transition-all">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 flex flex-col items-start">
                <span className="px-3 py-1 rounded-full bg-lime-cream/80 text-yale-blue font-semibold text-xs tracking-wide uppercase">
                  Thuật toán tinh gọn
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-yale-blue mt-3">
                  Rút gọn nợ và QR chuyển khoản
                </h3>
                <p className="text-sm sm:text-base text-text-muted mt-3 leading-relaxed">
                  Thay vì hàng chục giao dịch chuyển qua lại hỗn loạn, Smart Trip tự động giải quyết các vòng nợ lặp: 12 khoản nợ chéo chỉ còn 3 lệnh chuyển tiền duy nhất. Tạo mã VietQR có sẵn số tiền và nội dung để thanh toán tức thì.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-bg-canvas text-yale-blue font-semibold text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-tropical-teal" />
                    Rút gọn nợ: 12 nợ → 3 lệnh
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-bg-canvas text-yale-blue font-semibold text-xs">
                    <QrCode className="w-3.5 h-3.5 text-functional-positive" />
                    VietQR 1 chạm
                  </span>
                </div>
              </div>

              {/* Visual Preview: Debt Settlement Mockup */}
              <div className="lg:col-span-5 bg-bg-canvas rounded-2xl p-5 border border-border-hairline">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-border-hairline flex items-center gap-4">
                  {/* Mini VietQR Card */}
                  <div className="w-20 h-20 bg-yale-blue rounded-xl p-2 flex flex-col items-center justify-center text-white shrink-0">
                    <QrCode className="w-8 h-8 text-mint-green stroke-[1.8]" />
                    <span className="text-[9px] font-bold tracking-widest mt-1">VIETQR</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-xs text-text-muted">
                      <span>Chuyển cho:</span>
                      <span className="font-semibold text-yale-blue truncate">Nguyễn Mai Linh</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-bold text-cerulean tabular-nums mt-0.5">
                      325.000 ₫
                    </div>
                    <div className="text-[11px] text-text-muted truncate mt-0.5">
                      Nội dung:{" "}
                      <span className="font-mono text-yale-blue font-semibold">SMARTTRIP DULICHQN</span>
                    </div>
                  </div>
                </div>

                {/* Optimization stat badges */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-center">
                  <div className="bg-white border border-border-hairline p-2.5 rounded-xl">
                    <span className="text-xs text-text-muted block">Giao dịch gốc</span>
                    <span className="font-bold text-functional-negative text-sm">12 lượt chuyển</span>
                  </div>
                  <div className="bg-functional-positive/10 border border-functional-positive/20 p-2.5 rounded-xl">
                    <span className="text-xs text-functional-positive block">Sau tối ưu hóa</span>
                    <span className="font-bold text-functional-positive text-sm">Chỉ 3 lệnh gọn gàng</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- SECTION 4: FINAL CALL-TO-ACTION BAND --- */}
        <section className="w-full px-4 sm:px-6 pb-20 pt-8">
          <div className="max-w-[1200px] mx-auto bg-yale-blue rounded-3xl py-14 px-6 sm:px-12 md:px-16 text-center text-white shadow-[0_8px_24px_rgba(24,78,119,0.12)] relative overflow-hidden">
            {/* Ambient Coastal Glows */}
            <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-cerulean/20 blur-3xl pointer-events-none" />
            <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-emerald-fill/20 blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
              <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">
                Sẵn sàng cho chuyến du lịch tiếp theo?
              </h2>
              <p className="text-sm sm:text-base text-white/80 mt-4 leading-relaxed">
                Tạo chuyến đi đầu tiên cùng bạn bè ngay hôm nay. Hoàn toàn miễn phí, không yêu cầu thẻ tín dụng.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/login"
                  className="bg-emerald-fill hover:bg-ocean-mist text-yale-blue font-bold text-base py-4 px-8 rounded-xl transition-all shadow-[0_4px_16px_rgba(24,78,119,0.12)] active:scale-[0.99] cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist"
                >
                  <span>Bắt đầu miễn phí ngay</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <button
                type="button"
                onClick={() => toast("Tính năng hỗ trợ nhóm doanh nghiệp sẽ ra mắt trong bản mở rộng!", "info")}
                className="mt-6 text-sm text-lime-cream hover:underline font-medium transition-all cursor-pointer"
              >
                Liên hệ hỗ trợ nhóm doanh nghiệp
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 3. FOOTER */}
      <LandingFooter />
    </div>
  );
}
