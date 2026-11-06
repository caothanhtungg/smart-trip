"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { spring } from "@animate-ui/react/utils/motion";
import {
  User,
  Landmark,
  Shield,
  LogOut,
  CheckCircle,
  BadgeCheck,
} from "lucide-react";
import { useUserProfile } from "@/lib/user/user-context";
import { signOut } from "@/lib/auth-client";

interface ProfileSidebarProps {
  activeSection: string;
  onSelectSection: (sectionId: string) => void;
}

export function ProfileSidebar({ activeSection, onSelectSection }: ProfileSidebarProps) {
  const { profile, isLoading } = useUserProfile();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const initials = React.useMemo(() => {
    const name = profile.displayName || profile.fullName || "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [profile.displayName, profile.fullName]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            router.replace("/login");
          },
        },
      });
    } catch {
      router.replace("/login");
    }
  };

  if (isLoading) {
    return (
      <aside className="col-span-12 lg:col-span-3 static lg:sticky lg:top-[96px] space-y-4">
        {/* Mini Profile Card Skeleton */}
        <div className="bg-surface-card rounded-[20px] p-5 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-divider-border flex flex-col gap-4">
          <div className="flex flex-col items-center text-center p-2">
            <div className="w-20 h-20 rounded-full bg-hover-row dark:bg-[#1E293B] animate-pulse mb-3" />
            <div className="h-5 w-36 bg-hover-row dark:bg-[#1E293B] rounded-md animate-pulse mb-1.5" />
            <div className="h-3.5 w-44 bg-hover-row dark:bg-[#1E293B] rounded-md animate-pulse mb-3" />
            <div className="h-6 w-32 bg-hover-row dark:bg-[#1E293B] rounded-full animate-pulse" />
          </div>

          <div className="h-px w-full bg-divider-border" />

          <div className="flex flex-col gap-2 py-1">
            <div className="h-10 w-full bg-hover-row dark:bg-[#1E293B] rounded-xl animate-pulse" />
            <div className="h-10 w-full bg-hover-row dark:bg-[#1E293B] rounded-xl animate-pulse" />
            <div className="h-10 w-full bg-hover-row dark:bg-[#1E293B] rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Quick Summary Skeleton */}
        <div className="bg-surface-card rounded-[20px] p-5 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-divider-border flex flex-col gap-2.5">
          <div className="h-4 w-full bg-hover-row dark:bg-[#1E293B] rounded animate-pulse" />
          <div className="h-4 w-full bg-hover-row dark:bg-[#1E293B] rounded animate-pulse" />
          <div className="h-3 w-3/4 bg-hover-row dark:bg-[#1E293B] rounded animate-pulse mt-2" />
        </div>
      </aside>
    );
  }

  return (
    <aside className="col-span-12 lg:col-span-3 static lg:sticky lg:top-[96px] space-y-4">
      {/* Mini Profile Card */}
      <div className="bg-surface-card rounded-[20px] p-5 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-divider-border flex flex-col gap-4">
        {/* User Mini Profile Summary */}
        <div className="flex flex-col items-center text-center p-2">
          <div className="relative mb-3 group">
            {profile.avatarUrl ? (
              // Avatar URLs can be user-provided or authenticated; do not route them through Next's optimizer.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatarUrl}
                alt={profile.displayName || profile.fullName}
                className="w-20 h-20 rounded-full object-cover shadow-inner border-2 border-white ring-2 ring-cerulean/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-light-green flex items-center justify-center text-2xl font-bold text-yale-blue shadow-inner select-none">
                {initials}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-6 h-6 bg-emerald rounded-full flex items-center justify-center text-on-secondary shadow-xs">
              <CheckCircle className="w-3.5 h-3.5 text-white" />
            </span>
          </div>
          <h2 className="font-bold text-base text-yale-blue">
            {profile.displayName ? `${profile.displayName} (${profile.fullName})` : profile.fullName || "Người dùng"}
          </h2>
          <p className="text-xs text-text-muted mt-0.5 truncate max-w-[200px]">
            {profile.email || "Đang cập nhật..."}
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
          <motion.button
            type="button"
            onClick={() => onSelectSection("thong-tin-ca-nhan")}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            transition={spring.press}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors relative cursor-pointer ${
              activeSection === "thong-tin-ca-nhan"
                ? "text-cerulean dark:text-sky-400"
                : "text-text-muted hover:bg-hover-row/60 hover:text-yale-blue dark:hover:text-white"
            }`}
          >
            {activeSection === "thong-tin-ca-nhan" && (
              <motion.div
                layoutId="profile-sidebar-active-indicator"
                className="absolute inset-0 bg-hover-row dark:bg-[#1E2A42] rounded-xl border-l-[3px] border-cerulean dark:border-sky-400 shadow-2xs"
                transition={spring.selection}
              />
            )}
            <User className="w-4 h-4 shrink-0 relative z-10" />
            <span className="relative z-10">Thông tin cá nhân</span>
          </motion.button>

          {/* Item 2: Receiving Bank */}
          <motion.button
            type="button"
            onClick={() => onSelectSection("tai-khoan-nhan-tien")}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            transition={spring.press}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors relative cursor-pointer ${
              activeSection === "tai-khoan-nhan-tien"
                ? "text-cerulean dark:text-sky-400"
                : "text-text-muted hover:bg-hover-row/60 hover:text-yale-blue dark:hover:text-white"
            }`}
          >
            {activeSection === "tai-khoan-nhan-tien" && (
              <motion.div
                layoutId="profile-sidebar-active-indicator"
                className="absolute inset-0 bg-hover-row dark:bg-[#1E2A42] rounded-xl border-l-[3px] border-cerulean dark:border-sky-400 shadow-2xs"
                transition={spring.selection}
              />
            )}
            <div className="flex items-center gap-3 relative z-10">
              <Landmark className="w-4 h-4 shrink-0" />
              <span>Tài khoản nhận tiền</span>
            </div>
            <span className="px-2 py-0.5 bg-tropical-teal/15 text-yale-blue dark:text-sky-300 rounded text-[10px] font-semibold tracking-wide relative z-10">
              VietQR
            </span>
          </motion.button>

          {/* Item 3: Notification & Security */}
          <motion.button
            type="button"
            onClick={() => onSelectSection("thong-bao-bao-mat")}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            transition={spring.press}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-sm font-semibold transition-colors relative cursor-pointer ${
              activeSection === "thong-bao-bao-mat"
                ? "text-cerulean dark:text-sky-400"
                : "text-text-muted hover:bg-hover-row/60 hover:text-yale-blue dark:hover:text-white"
            }`}
          >
            {activeSection === "thong-bao-bao-mat" && (
              <motion.div
                layoutId="profile-sidebar-active-indicator"
                className="absolute inset-0 bg-hover-row dark:bg-[#1E2A42] rounded-xl border-l-[3px] border-cerulean dark:border-sky-400 shadow-2xs"
                transition={spring.selection}
              />
            )}
            <Shield className="w-4 h-4 shrink-0 relative z-10" />
            <span className="relative z-10">Thông báo &amp; Bảo mật</span>
          </motion.button>

          <div className="h-px w-full bg-divider-border my-1" />

          {/* Item 4: Log out */}
          <motion.button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.98 }}
            transition={spring.press}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-functional-negative hover:bg-functional-negative/10 transition-colors text-left text-sm font-semibold cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>{isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
          </motion.button>
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
