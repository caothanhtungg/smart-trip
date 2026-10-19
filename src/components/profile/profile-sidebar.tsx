"use client";

import * as React from "react";
import Link from "next/link";
import {
  User,
  Landmark,
  Shield,
  LogOut,
  CheckCircle,
  BadgeCheck,
} from "lucide-react";
import { useUserProfile } from "@/lib/user/user-context";

interface ProfileSidebarProps {
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
}

export function ProfileSidebar({ activeSection, onSelectSection }: ProfileSidebarProps) {
  const { profile } = useUserProfile();

  const initials = React.useMemo(() => {
    const name = profile.displayName || profile.fullName || "L";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [profile.displayName, profile.fullName]);

  return (
    <aside className="col-span-12 lg:col-span-3 sticky top-[96px] space-y-4">
      {/* Mini Profile Card */}
      <div className="bg-surface-card rounded-[20px] p-5 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-divider-border flex flex-col gap-4">
        {/* User Mini Profile Summary */}
        <div className="flex flex-col items-center text-center p-2">
          <div className="relative mb-3 group">
            <div className="w-20 h-20 rounded-full bg-light-green flex items-center justify-center text-2xl font-bold text-yale-blue shadow-inner select-none">
              {initials}
            </div>
            <span className="absolute bottom-0 right-0 w-6 h-6 bg-emerald rounded-full flex items-center justify-center text-on-secondary shadow-xs">
              <CheckCircle className="w-3.5 h-3.5 text-white" />
            </span>
          </div>
          <h2 className="font-bold text-base text-yale-blue">
            {profile.displayName ? `${profile.displayName} (${profile.fullName})` : profile.fullName}
          </h2>
          <p className="text-xs text-text-muted mt-0.5 truncate max-w-[200px]">
            {profile.email}
          </p>
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-lime-cream/60 text-yale-blue rounded-full font-semibold text-[11px]">
            <BadgeCheck className="w-3.5 h-3.5 text-functional-positive" />
            <span>Thành viên tích cực</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-divider-border" />

        {/* Navigation Menu List */}
        <nav aria-label="Tùy chọn tài khoản" className="flex flex-col gap-1">
          {/* Item 1: Personal Info */}
          <button
            type="button"
            onClick={() => onSelectSection("thong-tin-ca-nhan")}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors relative cursor-pointer ${
              activeSection === "thong-tin-ca-nhan"
                ? "bg-hover-row text-cerulean"
                : "text-text-muted hover:bg-hover-row hover:text-yale-blue"
            }`}
          >
            {activeSection === "thong-tin-ca-nhan" && (
              <span className="w-1.5 h-5 rounded-full bg-cerulean absolute left-0" />
            )}
            <User className="w-4 h-4 shrink-0" />
            <span>Thông tin cá nhân</span>
          </button>

          {/* Item 2: Receiving Bank */}
          <button
            type="button"
            onClick={() => onSelectSection("tai-khoan-nhan-tien")}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors relative cursor-pointer ${
              activeSection === "tai-khoan-nhan-tien"
                ? "bg-hover-row text-cerulean"
                : "text-text-muted hover:bg-hover-row hover:text-yale-blue"
            }`}
          >
            {activeSection === "tai-khoan-nhan-tien" && (
              <span className="w-1.5 h-5 rounded-full bg-cerulean absolute left-0" />
            )}
            <div className="flex items-center gap-3">
              <Landmark className="w-4 h-4 shrink-0" />
              <span>Tài khoản nhận tiền</span>
            </div>
            <span className="px-2 py-0.5 bg-tropical-teal/15 text-yale-blue rounded text-[10px] font-semibold tracking-wide">
              VietQR
            </span>
          </button>

          {/* Item 3: Notification & Security */}
          <button
            type="button"
            onClick={() => onSelectSection("thong-bao-bao-mat")}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors relative cursor-pointer ${
              activeSection === "thong-bao-bao-mat"
                ? "bg-hover-row text-cerulean"
                : "text-text-muted hover:bg-hover-row hover:text-yale-blue"
            }`}
          >
            {activeSection === "thong-bao-bao-mat" && (
              <span className="w-1.5 h-5 rounded-full bg-cerulean absolute left-0" />
            )}
            <Shield className="w-4 h-4 shrink-0" />
            <span>Thông báo &amp; Bảo mật</span>
          </button>

          <div className="h-px w-full bg-divider-border my-1" />

          {/* Item 4: Log out */}
          <Link
            href="/login"
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-functional-negative hover:bg-functional-warning-bg transition-colors text-left text-sm font-semibold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </Link>
        </nav>
      </div>

      {/* Quick Summary Mini Widget */}
      <div className="bg-surface-card rounded-[20px] p-5 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-divider-border flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Chuyến đi tham gia</span>
          <span className="font-bold text-yale-blue">14</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Khoản đã thanh toán</span>
          <span className="font-bold text-functional-positive">100%</span>
        </div>
        <p className="text-[11px] text-text-muted mt-2 pt-2 border-t border-divider-border leading-relaxed">
          Hồ sơ tin cậy bậc 3 theo cộng đồng Smart Trip.
        </p>
      </div>
    </aside>
  );
}
