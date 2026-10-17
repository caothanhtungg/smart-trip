import * as React from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="w-full bg-yale-blue text-white mt-auto">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-12 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-8 border-b border-white/10">
          {/* Brand & Slogan */}
          <div className="flex flex-col gap-1.5">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-mint-green">
                <MapPin className="w-4 h-4 text-mint-green stroke-[2.5]" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Smart Trip
              </span>
            </Link>
            <p className="text-sm font-medium text-light-green pl-10">
              Đi chung, chia gọn.
            </p>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80">
            <a href="#tinh-nang" className="hover:text-white transition-colors">
              Tính năng
            </a>
            <a href="#cach-hoat-dong" className="hover:text-white transition-colors">
              Cách hoạt động
            </a>
            <span className="hover:text-white transition-colors cursor-pointer">
              Chính sách bảo mật
            </span>
            <span className="hover:text-white transition-colors cursor-pointer">
              Điều khoản sử dụng
            </span>
            <span className="hover:text-white transition-colors cursor-pointer">
              Liên hệ hỗ trợ
            </span>
          </nav>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/60">
          <p>© 2026 Smart Trip. Bản quyền thuộc về Smart Trip.</p>
          <p>Tactile Organic Minimalism · Nền tảng du lịch nhóm thông minh</p>
        </div>
      </div>
    </footer>
  );
}
