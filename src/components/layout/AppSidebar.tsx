"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Compass,
  Briefcase,
  User,
  BookOpen,
  Sparkles,
  LogOut,
  X,
  ChevronRight,
  CloudSun,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useUserProfile } from "@/lib/user/user-context";
import {
  SIDEBAR_NAV_ITEMS,
  isSidebarNavActive,
  getSidebarFeaturePrompt,
} from "./sidebar-nav";

interface AppSidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AppSidebar({ isMobileOpen, onCloseMobile }: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString();
  const { profile } = useUserProfile();
  const featurePrompt = getSidebarFeaturePrompt();

  const getNavIcon = (iconName: string, isActive: boolean) => {
    const iconClass = `w-5 h-5 shrink-0 transition-colors ${
      isActive ? "text-[#E05833]" : "text-text-muted group-hover:text-yale-blue"
    }`;
    switch (iconName) {
      case "Compass":
        return <Compass className={iconClass} />;
      case "Briefcase":
        return <Briefcase className={iconClass} />;
      case "User":
        return <User className={iconClass} />;
      case "BookOpen":
        return <BookOpen className={iconClass} />;
      default:
        return <Compass className={iconClass} />;
    }
  };

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 sm:p-5">
      {/* Top: Brand Header & Navigation */}
      <div className="flex flex-col gap-6">
        {/* Brand Logo */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E9ECEF]">
          <Link
            href="/trips?view=discovery"
            onClick={onCloseMobile}
            className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist rounded-xl"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E05833] to-[#E76F51] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-yale-blue tracking-tight leading-tight">
                Smart Trip
              </span>
              <span className="text-[11px] font-medium text-text-muted">
                Dream Destini
              </span>
            </div>
          </Link>

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Đóng thanh điều hướng"
            className="lg:hidden p-2 rounded-xl text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1.5" aria-label="Điều hướng chính">
          {SIDEBAR_NAV_ITEMS.map((item) => {
            const active = isSidebarNavActive(
              item.href,
              pathname,
              searchParamsString
            );
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={onCloseMobile}
                className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-[#E05833]/10 text-[#E05833] font-semibold shadow-xs"
                    : "text-text-body hover:bg-hover-row hover:text-yale-blue"
                }`}
              >
                <div className="flex items-center gap-3">
                  {getNavIcon(item.iconName, active)}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#E05833] text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Feature Card & User Profile */}
      <div className="flex flex-col gap-4 pt-4 border-t border-[#E9ECEF]">
        {/* Feature Highlight Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#184E77] to-[#1E6091] text-white shadow-md relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white backdrop-blur-xs">
              <Sparkles className="w-3 h-3 text-[#D9ED92]" />
              {featurePrompt.badge}
            </span>
            <CloudSun className="w-4 h-4 text-[#D9ED92]/90" />
          </div>
          <h4 className="text-xs font-bold leading-tight mb-1 text-white">
            {featurePrompt.title}
          </h4>
          <p className="text-[11px] text-white/80 line-clamp-2 leading-relaxed mb-2.5">
            {featurePrompt.subtitle}
          </p>
          <Link
            href="/trips?view=discovery"
            onClick={onCloseMobile}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D9ED92] hover:text-white transition-colors"
          >
            <span>{featurePrompt.actionLabel}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* User Profile Bar */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-hover-row/70">
          <Link
            href="/profile"
            onClick={onCloseMobile}
            className="flex items-center gap-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity"
          >
            <Avatar
              name={profile?.fullName || "User"}
              src={profile?.avatarUrl ?? undefined}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-yale-blue truncate">
                {profile?.fullName || "Người dùng"}
              </p>
              <p className="text-[10px] text-text-muted truncate">
                {profile?.email || "user@example.com"}
              </p>
            </div>
          </Link>

          <Link
            href="/login"
            onClick={onCloseMobile}
            aria-label="Đăng xuất"
            className="p-1.5 rounded-lg text-text-muted hover:text-functional-negative hover:bg-white transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:block w-64 xl:w-72 fixed inset-y-0 left-0 bg-white border-r border-[#E9ECEF] z-30 shadow-[2px_0_12px_rgba(24,78,119,0.03)]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Collapsible) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

