"use client";

import * as React from "react";
import Link from "next/link";
import {
  MapPin,
  ArrowLeft,
  Sparkles,
  Receipt,
  QrCode,
  Calendar,
  CheckCircle2,
  Info,
  ShieldCheck,
  Compass,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export default function LoginPage() {
  const [oauthNoticeOpen, setOauthNoticeOpen] = React.useState(false);
  const [legalModalOpen, setLegalModalOpen] = React.useState<"terms" | "privacy" | null>(null);

  return (
    <div className="w-full min-h-screen flex flex-col lg:flex-row bg-bg-canvas relative overflow-hidden font-sans antialiased text-text-body">
      {/* =========================================================================
          LEFT HALF: Decorative Ambient Visual Showcase (50% on Desktop, hidden on Mobile)
          ========================================================================= */}
      <div className="w-full lg:w-1/2 relative flex flex-col justify-between p-8 sm:p-12 lg:p-16 overflow-hidden bg-gradient-to-br from-yale-blue via-baltic-blue to-cerulean text-white">
        {/* Ambient Dynamic Glows (Coastal Palette) */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-lime-cream/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-80 h-80 rounded-full bg-ocean-mist/25 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-28 left-1/4 w-[500px] h-[500px] rounded-full bg-mint-green/10 blur-3xl pointer-events-none" />

        {/* Abstract Topographic & Route Overlay (SVG Layer) */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg
            className="w-full h-full object-cover"
            fill="none"
            viewBox="0 0 700 900"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Topographic contours */}
            <path
              d="M-100 250C120 230 180 340 380 300C580 260 620 180 800 220"
              stroke="currentColor"
              strokeDasharray="6 6"
              strokeWidth="1.5"
            />
            <path
              d="M-60 380C140 360 210 490 420 440C630 390 650 320 840 370"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M-40 520C170 510 250 630 480 570C710 510 700 460 880 520"
              stroke="currentColor"
              strokeDasharray="4 8"
              strokeWidth="1"
            />
            {/* Waypoint Travel Line */}
            <path
              d="M120 780 C180 620, 320 590, 360 410 C390 270, 520 220, 580 120"
              stroke="#D9ED92"
              strokeDasharray="8 8"
              strokeLinecap="round"
              strokeWidth="2.5"
            />
            <circle cx="120" cy="780" fill="#D9ED92" r="6" />
            <circle cx="360" cy="410" fill="#52B69A" r="7" />
            <circle cx="580" cy="120" fill="#FFFFFF" r="8" />
          </svg>
        </div>

        {/* Top Brand Anchor */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center text-lime-cream shadow-sm">
              <Compass className="w-6 h-6 stroke-[2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white tracking-tight leading-tight">
                Smart Trip
              </span>
              <span className="text-[11px] uppercase tracking-wider text-lime-cream font-semibold">
                Du lịch &amp; Chia sẻ tài chính
              </span>
            </div>
          </Link>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-semibold border border-white/10">
            <span className="w-2 h-2 rounded-full bg-mint-green animate-pulse" />
            <span>Hệ thống thông minh</span>
          </div>
        </div>

        {/* Central Hero Narrative block */}
        <div className="relative z-10 my-auto py-10 max-w-lg">
          {/* Floating Visual Pill Card */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-lime-cream text-xs font-semibold mb-6 shadow-sm border border-white/10">
            <ShieldCheck className="w-4 h-4" />
            <span>Giải pháp quản lý chi tiêu nhóm thông minh</span>
          </div>

          {/* Quote Decoration */}
          <div className="text-white/30 mb-1 font-serif text-5xl select-none leading-none">“</div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white tracking-tight mb-4 leading-snug">
            Mỗi chuyến đi đáng nhớ bắt đầu từ một kế hoạch chung
          </h1>
          <p className="text-sm sm:text-base text-white/85 mb-8 max-w-md leading-relaxed">
            Đồng hành cùng các nhóm bạn du lịch khám phá khắp Việt Nam mà không còn âu lo về tính toán nợ nần.
          </p>

          {/* Dynamic Trip Metric Mini-Card (Stitch approved) */}
          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-ocean-mist/30 flex items-center justify-center text-lime-cream">
                <Receipt className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <p className="text-xs text-white/70 font-medium">Chuyến đi gần nhất</p>
                <p className="text-sm font-semibold text-white">Đà Lạt 3N2Đ • 6 thành viên</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-fill/25 text-lime-cream text-xs font-bold border border-emerald-fill/30">
                Đã quyết toán xong
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Feature Micro-Pills */}
        <div className="relative z-10 pt-4 flex flex-wrap items-center gap-2.5 text-xs font-medium text-white/90">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-lime-cream" />
            <span>Chia tiền tức thì</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
            <Calendar className="w-3.5 h-3.5 text-mint-green" />
            <span>Lịch trình trực quan</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10">
            <QrCode className="w-3.5 h-3.5 text-ocean-mist" />
            <span>Quét QR chuyển khoản</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT HALF: Authentication Panel (Strict UC01 Single Sign-On via Google)
          ========================================================================= */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between items-center p-6 sm:p-10 lg:p-12 relative z-10 bg-bg-canvas min-h-screen">
        {/* Top Navigation Bar: Back to Home link */}
        <div className="w-full max-w-[440px] flex items-center justify-between pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-text-muted hover:text-cerulean transition-colors duration-150 rounded-lg py-1 px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist"
          >
            <ArrowLeft className="w-4 h-4 stroke-[2.2]" />
            <span>Quay lại trang chủ</span>
          </Link>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-text-muted bg-white border border-border-hairline px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-ocean-mist" />
            <span>Tiếng Việt</span>
          </div>
        </div>

        {/* Central Auth Card */}
        <div className="w-full max-w-[440px] my-auto py-8">
          <div className="bg-white rounded-[24px] p-8 sm:p-10 shadow-[0_12px_32px_rgba(24,78,119,0.08)] border border-border-hairline">
            {/* Card Header Emblem */}
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-xl bg-cerulean/10 flex items-center justify-center text-cerulean">
                <MapPin className="w-5 h-5 text-cerulean stroke-[2.2]" />
              </div>
              <span className="text-xl font-bold text-yale-blue tracking-tight">
                Smart Trip
              </span>
            </div>

            {/* Title & Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-yale-blue tracking-tight">
                Chào mừng bạn
              </h2>
              <p className="text-sm text-text-muted mt-2 leading-relaxed">
                Đăng nhập 1 chạm an toàn bằng tài khoản Google để lên kế hoạch và chia sẻ chi phí cùng nhóm bạn.
              </p>
            </div>

            {/* Primary Action Button: Google SSO (Single Touch Authentication - UC01) */}
            <button
              type="button"
              id="google-signin-btn"
              onClick={() => setOauthNoticeOpen(true)}
              className="w-full h-[52px] px-5 rounded-xl bg-white hover:bg-hover-row transition-all duration-200 flex items-center justify-center gap-3.5 border border-border-hairline shadow-sm hover:shadow-md cursor-pointer active:scale-[0.99] focus:outline-none focus-visible:ring-3 focus-visible:ring-ocean-mist focus-visible:ring-offset-2"
            >
              {/* Authentic Google "G" 4-color SVG Icon */}
              <svg
                className="w-5 h-5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
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
              <span className="text-base font-semibold text-yale-blue">
                Tiếp tục với Google
              </span>
            </button>

            {/* Security & Scope Note */}
            <div className="mt-6 pt-5 border-t border-border-hairline">
              <div className="flex items-start gap-2.5 text-xs text-text-muted leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-functional-positive shrink-0 mt-0.5" />
                <span>
                  Đăng nhập một chạm bảo mật. Không yêu cầu mật khẩu, không gửi mã SMS và không lưu thông tin đăng nhập trung gian.
                </span>
              </div>
            </div>
          </div>

          {/* Legal Compliance & Terms Disclaimer */}
          <p className="text-center text-xs text-text-muted mt-6 px-4 leading-relaxed">
            Bằng việc tiếp tục, bạn đồng ý với{" "}
            <button
              type="button"
              onClick={() => setLegalModalOpen("terms")}
              className="text-cerulean hover:underline font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ocean-mist rounded"
            >
              Điều khoản sử dụng
            </button>{" "}
            và{" "}
            <button
              type="button"
              onClick={() => setLegalModalOpen("privacy")}
              className="text-cerulean hover:underline font-semibold cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ocean-mist rounded"
            >
              Chính sách bảo mật
            </button>{" "}
            của Smart Trip.
          </p>
        </div>

        {/* Footer Help & Copyright Bar */}
        <div className="w-full max-w-[440px] flex items-center justify-between text-xs text-text-muted pb-2 pt-4 border-t border-border-hairline/60">
          <span>© 2026 Smart Trip Vietnam</span>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setLegalModalOpen("terms")}
              className="hover:text-cerulean transition-colors cursor-pointer"
            >
              Trung tâm trợ giúp
            </button>
            <button
              type="button"
              onClick={() => setLegalModalOpen("privacy")}
              className="hover:text-cerulean transition-colors cursor-pointer"
            >
              Liên hệ
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          AUTHENTICATION NOTICE MODAL (Transparent Status - Requirement 3)
          ========================================================================= */}
      <Modal
        isOpen={oauthNoticeOpen}
        onClose={() => setOauthNoticeOpen(false)}
        title="Thông tin Xác thực Google SSO (UC01)"
        description="Trạng thái triển khai giao diện theo kế hoạch Release 1"
      >
        <div className="space-y-4 py-2">
          <div className="p-4 rounded-xl bg-[#FFF1E6] border border-[#C2410C]/20 flex items-start gap-3">
            <Info className="w-5 h-5 text-functional-warning shrink-0 mt-0.5" />
            <div className="text-sm text-text-body space-y-1">
              <p className="font-semibold text-yale-blue">
                Chức năng đang ở giai đoạn giao diện Frontend
              </p>
              <p className="text-xs text-text-muted leading-relaxed">
                Tích hợp <strong>Google OAuth thật</strong> và phiên làm việc (Session Auth.js) sẽ được kết nối chính thức khi triển khai tầng backend, API và cơ sở dữ liệu PostgreSQL theo đúng kiến trúc kỹ thuật.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-bg-canvas border border-border-hairline space-y-1 text-xs text-text-muted">
            <p className="font-semibold text-yale-blue text-sm">Cam kết an toàn dữ liệu:</p>
            <p>• Không tạo phiên đăng nhập giả hoặc token giả tạo.</p>
            <p>• Không điều hướng giả khiến người dùng hiểu nhầm đã đăng nhập.</p>
            <p>• Tuân thủ nghiêm ngặt quy chuẩn UC01 và tài liệu ENGINEERING_STANDARDS.md.</p>
          </div>

          <div className="flex justify-end pt-3 border-t border-border-hairline">
            <Button
              variant="primary"
              onClick={() => setOauthNoticeOpen(false)}
              className="h-11 px-6 font-semibold"
            >
              Đã hiểu
            </Button>
          </div>
        </div>
      </Modal>

      {/* =========================================================================
          LEGAL TERMS & PRIVACY MODAL (Prevents 404 broken links - Requirement 3)
          ========================================================================= */}
      <Modal
        isOpen={legalModalOpen !== null}
        onClose={() => setLegalModalOpen(null)}
        title={legalModalOpen === "terms" ? "Điều khoản Sử dụng Smart Trip" : "Chính sách Bảo mật Thông tin"}
        description="Quy chuẩn hoạt động & Bảo vệ dữ liệu chuyến đi nhóm"
      >
        <div className="space-y-4 py-2 text-sm text-text-body leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          {legalModalOpen === "terms" ? (
            <>
              <p>
                <strong>1. Mục đích sử dụng:</strong> Smart Trip hỗ trợ các nhóm bạn lên lịch trình, chia sẻ chi phí và giải quyết công nợ sau chuyến đi một cách minh bạch, tự nguyện.
              </p>
              <p>
                <strong>2. Quyền hạn Trưởng nhóm:</strong> Người tạo chuyến đi giữ vai trò Trưởng nhóm, có trách nhiệm điều phối lịch trình, quản lý thành viên và chốt sổ công nợ.
              </p>
              <p>
                <strong>3. Giao dịch tài chính:</strong> Các khoản thanh toán qua mã VietQR hoặc tiền mặt diễn ra trực tiếp giữa các thành viên ngoài hệ thống. Smart Trip chỉ đóng vai trò tính toán rút gọn nợ chính xác.
              </p>
            </>
          ) : (
            <>
              <p>
                <strong>1. Thu thập thông tin:</strong> Hệ thống chỉ lưu trữ thông tin cơ bản do người dùng cung cấp qua tài khoản Google (tên hiển thị, email, avatar) và thông tin STK ngân hàng (nếu cung cấp để nhận tiền chuyển khoản).
              </p>
              <p>
                <strong>2. Bảo mật mã mời:</strong> Mã mời chuyến đi chỉ cung cấp quyền xem trước thẻ chuyến đi (Preview Card). Thành viên chỉ được xem chi tiết lịch trình và chi tiêu sau khi được phê duyệt tham gia.
              </p>
              <p>
                <strong>3. Không chia sẻ bên thứ ba:</strong> Dữ liệu nhóm du lịch không được thương mại hóa hoặc chuyển giao cho mục đích quảng cáo bên ngoài.
              </p>
            </>
          )}

          <div className="flex justify-end pt-4 border-t border-border-hairline">
            <Button variant="primary" onClick={() => setLegalModalOpen(null)}>
              Đóng lại
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
