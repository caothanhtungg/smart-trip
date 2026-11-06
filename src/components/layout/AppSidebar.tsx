"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { spring } from "@animate-ui/react/utils/motion";
import {
  Compass,
  Briefcase,
  User,
  BookOpen,
  X,
  Plus,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useUserProfile } from "@/lib/user/user-context";
import { useAppShell } from "./app-shell-context";
import {
  SIDEBAR_NAV_GROUPS,
  isSidebarNavActive,
} from "./sidebar-nav";
import { UserMenuDropup } from "./UserMenuDropup";

interface AppSidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AppSidebar({ isMobileOpen, onCloseMobile }: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams?.toString();
  const { profile, isLoading } = useUserProfile();
  const { isSidebarCollapsed, toggleSidebarCollapse } = useAppShell();
  const [isDesktopUserMenuOpen, setIsDesktopUserMenuOpen] = React.useState(false);
  const [isMobileUserMenuOpen, setIsMobileUserMenuOpen] = React.useState(false);
  const desktopTriggerRef = React.useRef<HTMLDivElement>(null);
  const mobileTriggerRef = React.useRef<HTMLDivElement>(null);

  // Close dropups when navigating
  const [prevRouteKey, setPrevRouteKey] = React.useState(pathname + '?' + searchParamsString);
  const currentRouteKey = pathname + '?' + searchParamsString;
  if (currentRouteKey !== prevRouteKey) {
    setPrevRouteKey(currentRouteKey);
    setIsDesktopUserMenuOpen(false);
    setIsMobileUserMenuOpen(false);
  }

  // When mobile drawer closes, close mobile user menu
  const [prevIsMobileOpen, setPrevIsMobileOpen] = React.useState(isMobileOpen);
  if (prevIsMobileOpen !== isMobileOpen) {
    setPrevIsMobileOpen(isMobileOpen);
    if (!isMobileOpen) {
      setIsMobileUserMenuOpen(false);
    }
  }

  const getNavIcon = (iconName: string, isActive: boolean, isRail = false) => {
    const iconClass = `shrink-0 transition-colors ${
      isRail ? "w-5 h-5" : "w-5 h-5"
    } ${
      isActive ? "text-[#E05833]" : "text-text-muted dark:text-slate-400 group-hover:text-yale-blue dark:group-hover:text-white"
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

  const renderContent = (isRail: boolean, isMobile = false) => {
    const isUserMenuOpen = isMobile ? isMobileUserMenuOpen : isDesktopUserMenuOpen;
    const setIsUserMenuOpen = isMobile ? setIsMobileUserMenuOpen : setIsDesktopUserMenuOpen;
    const triggerRef = isMobile ? mobileTriggerRef : desktopTriggerRef;

    return (
    <div
      className={`h-full flex flex-col justify-between ${
        isRail ? "p-3 py-4" : "p-4 sm:p-5"
      }`}
    >
      {/* Top: Header, Quick Action CTA & Navigation */}
      <div className="flex flex-col gap-4">
        {/* Brand Header */}
        {isRail ? (
          /* Mini Rail Header: Logo + Expand Toggle */
          <div className="flex flex-col items-center gap-2 pb-3 border-b border-[#E9ECEF] dark:border-[#2D3A54]">
            <Link
              href="/trips?view=discovery"
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E05833] to-[#E76F51] flex items-center justify-center text-white shadow-sm hover:scale-105 transition-transform"
              title="Smart Trip"
            >
              <Compass className="w-5 h-5 stroke-[2.2]" />
            </Link>

            <button
              type="button"
              onClick={toggleSidebarCollapse}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted dark:text-slate-400 hover:text-yale-blue dark:hover:text-white hover:bg-hover-row dark:hover:bg-[#1E2A42] transition-all cursor-pointer"
              title="Mở rộng thanh điều hướng"
              aria-label="Mở rộng thanh điều hướng"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* Expanded Header: Full Logo + Collapse Toggle */
          <div className="flex items-center justify-between pb-4 border-b border-[#E9ECEF] dark:border-[#2D3A54]">
            <Link
              href="/trips?view=discovery"
              onClick={onCloseMobile}
              className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist rounded-xl"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#E05833] to-[#E76F51] flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-yale-blue dark:text-white tracking-tight leading-tight">
                  Smart Trip
                </span>
                <span className="text-[11px] font-medium text-text-muted dark:text-slate-400">
                  Dream Destini
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-1">
              {/* Desktop Collapse Toggle */}
              <button
                type="button"
                onClick={toggleSidebarCollapse}
                className="hidden lg:flex w-8 h-8 rounded-lg items-center justify-center text-text-muted dark:text-slate-400 hover:text-yale-blue dark:hover:text-white hover:bg-hover-row dark:hover:bg-[#1E2A42] transition-all cursor-pointer"
                title="Thu gọn thanh điều hướng"
                aria-label="Thu gọn thanh điều hướng"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>

              {/* Mobile Close Button */}
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Đóng thanh điều hướng"
                className="lg:hidden p-2 rounded-xl text-text-muted dark:text-slate-400 hover:text-yale-blue dark:hover:text-white hover:bg-hover-row dark:hover:bg-[#1E2A42] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Quick Action CTA: Tạo chuyến đi mới */}
        {isRail ? (
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            transition={spring.press}
            className="mx-auto"
          >
            <Link
              href="/trips/new"
              className="w-10 h-10 rounded-xl border border-divider-border dark:border-[#2D3A54] bg-white dark:bg-[#1E293B] hover:bg-[#F4F9EC] dark:hover:bg-[#28354E] hover:border-[#52B69A]/60 flex items-center justify-center text-[#E05833] shadow-2xs hover:shadow-xs transition-colors mx-auto group relative"
              title="Tạo chuyến đi mới"
            >
              <Plus className="w-5 h-5 stroke-[2.5] group-hover:scale-110 transition-transform" />
              {/* Flyout Tooltip */}
              <div className="absolute left-full ml-3 px-2.5 py-1 bg-yale-blue text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50 whitespace-nowrap">
                Tạo chuyến đi mới
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-yale-blue" />
              </div>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={spring.press}
            className="w-full"
          >
            <Link
              href="/trips/new"
              onClick={onCloseMobile}
              className="flex items-center justify-center gap-2.5 w-full py-2.5 px-3.5 rounded-xl border border-divider-border dark:border-[#2D3A54] bg-white dark:bg-[#1E293B] hover:bg-[#F4F9EC] dark:hover:bg-[#28354E] text-xs sm:text-sm font-semibold text-yale-blue dark:text-white shadow-2xs hover:shadow-xs transition-colors group focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist active:scale-[0.99]"
            >
              <span className="w-5 h-5 rounded-lg bg-[#E05833]/10 flex items-center justify-center text-[#E05833] group-hover:bg-[#E05833] group-hover:text-white transition-colors shrink-0">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </span>
              <span>Tạo chuyến đi mới</span>
            </Link>
          </motion.div>
        )}

        {/* Navigation Items Organized by Groups */}
        <nav
          className={`flex flex-col ${isRail ? "gap-2" : "gap-4"}`}
          aria-label="Điều hướng chính"
        >
          {SIDEBAR_NAV_GROUPS.map((group, groupIdx) => (
            <div key={group.id} className="flex flex-col gap-1">
              {isRail ? (
                /* Separator line between groups in Icon Rail mode */
                groupIdx > 0 && (
                  <div
                    className="h-[1px] w-6 bg-divider-border/80 dark:bg-[#2D3A54] my-1.5 mx-auto"
                    aria-hidden="true"
                  />
                )
              ) : (
                /* Text Group Header in Expanded mode */
                group.title && (
                  <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-text-muted/80 dark:text-slate-400 uppercase select-none">
                    {group.title}
                  </div>
                )
              )}

              <div className="flex flex-col gap-1">
                {group.items.map((item) => {
                  const active = isSidebarNavActive(
                    item.href,
                    pathname,
                    searchParamsString
                  );

                  return isRail ? (
                    /* Icon Rail Item */
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.94 }}
                      transition={spring.press}
                      className="relative mx-auto"
                    >
                      <Link
                        href={item.href}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors relative group ${
                          active
                            ? "text-[#E05833] font-semibold"
                            : "text-text-body dark:text-slate-200 hover:text-yale-blue dark:hover:text-white"
                        }`}
                        aria-label={item.label}
                      >
                        {active && (
                          <motion.div
                            layoutId="rail-sidebar-active-indicator"
                            className="absolute inset-0 bg-[#E05833]/15 dark:bg-[#E05833]/25 rounded-xl ring-1 ring-[#E05833]/30 shadow-xs"
                            transition={spring.selection}
                          />
                        )}
                        <div className="relative z-10 flex items-center justify-center">
                          {getNavIcon(item.iconName, active, true)}
                        </div>
                        {item.badge && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#E05833] ring-2 ring-white dark:ring-[#131B2E] z-20" />
                        )}
                        {/* Flyout Tooltip */}
                        <div className="absolute left-full ml-3 px-2.5 py-1 bg-yale-blue text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50 whitespace-nowrap">
                          {item.label}
                          <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-yale-blue" />
                        </div>
                      </Link>
                    </motion.div>
                  ) : (
                    /* Expanded Item */
                    <motion.div
                      key={item.id}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.97 }}
                      transition={spring.press}
                      className="relative"
                    >
                      <Link
                        href={item.href}
                        onClick={onCloseMobile}
                        className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                          active
                            ? "text-[#E05833] dark:text-[#F38A6B] font-semibold"
                            : "text-text-body dark:text-slate-200 hover:text-yale-blue dark:hover:text-white hover:bg-hover-row/70 dark:hover:bg-[#1E2A42]/70"
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="expanded-sidebar-active-indicator"
                            className="absolute inset-0 bg-[#E05833]/15 dark:bg-[#E05833]/20 rounded-xl shadow-xs border border-[#E05833]/30 dark:border-[#E05833]/40"
                            transition={spring.selection}
                          />
                        )}
                        <div className="flex items-center gap-3 relative z-10">
                          <motion.div
                            whileHover={{ scale: 1.15, rotate: -6 }}
                            transition={spring.pop}
                          >
                            {getNavIcon(item.iconName, active, false)}
                          </motion.div>
                          <span className="relative z-10">{item.label}</span>
                        </div>
                        {item.badge && (
                          <motion.span
                            animate={{ scale: [1, 1.06, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="relative z-10 px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#E05833] text-white shadow-2xs"
                          >
                            {item.badge}
                          </motion.span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom: User Profile with Popover Dropup */}
      <div className="pt-3 border-t border-[#E9ECEF] dark:border-[#2D3A54] relative">
        {/* Dropup Popover Menu */}
        <UserMenuDropup
          isOpen={isUserMenuOpen}
          onClose={() => setIsUserMenuOpen(false)}
          onNavigate={onCloseMobile}
          profile={profile}
          isCollapsed={isRail}
          triggerRef={triggerRef}
        />

        {/* User Profile Trigger */}
        {isRail ? (
          /* Mini Rail Trigger (Centered Avatar) */
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={spring.press}
            className="w-10 mx-auto"
          >
            <div
              ref={triggerRef}
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              role="button"
              tabIndex={0}
              aria-haspopup="menu"
              aria-expanded={isUserMenuOpen}
              aria-label="Tùy chọn tài khoản"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsUserMenuOpen((prev) => !prev);
                }
              }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto cursor-pointer transition-all relative group ${
                isUserMenuOpen
                  ? "ring-2 ring-cerulean shadow-xs bg-cerulean/10"
                  : "hover:ring-2 hover:ring-cerulean/30"
              }`}
            >
              {isLoading ? (
                <div className="w-8 h-8 rounded-full bg-hover-row dark:bg-[#243050] animate-pulse" />
              ) : (
                <Avatar
                  name={profile?.fullName || "User"}
                  src={profile?.avatarUrl ?? undefined}
                  size="sm"
                />
              )}
              {/* Flyout Tooltip (only when menu is closed) */}
              {!isUserMenuOpen && (
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-yale-blue text-white text-xs font-semibold rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50 whitespace-nowrap">
                  {profile?.fullName || "Tài khoản"}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-4 border-transparent border-r-yale-blue" />
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          /* Expanded Trigger Bar */
          <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            transition={spring.press}
            className="w-full"
          >
            <div
              ref={triggerRef}
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              role="button"
              tabIndex={0}
            aria-haspopup="menu"
            aria-expanded={isUserMenuOpen}
            aria-label="Tùy chọn tài khoản"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsUserMenuOpen((prev) => !prev);
              }
            }}
            className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer group select-none ${
              isUserMenuOpen
                ? "bg-[#184E77]/10 dark:bg-sky-500/10 ring-2 ring-cerulean/30 shadow-2xs"
                : "bg-hover-row/70 dark:bg-[#1E293B]/70 hover:bg-hover-row dark:hover:bg-[#24314A]"
            }`}
          >
            {isLoading ? (
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-hover-row dark:bg-[#243050] animate-pulse shrink-0" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="h-3 w-20 bg-hover-row dark:bg-[#243050] rounded animate-pulse" />
                  <div className="h-2.5 w-28 bg-hover-row dark:bg-[#243050] rounded animate-pulse" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <Avatar
                  name={profile?.fullName || "User"}
                  src={profile?.avatarUrl ?? undefined}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-yale-blue dark:text-white truncate">
                    {profile?.fullName || "Người dùng"}
                  </p>
                  <p className="text-[10px] text-text-muted dark:text-slate-400 truncate">
                    {profile?.email || "user@example.com"}
                  </p>
                </div>
              </div>
            )}

            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-text-muted dark:text-slate-400 group-hover:text-yale-blue dark:group-hover:text-white transition-all ${
                isUserMenuOpen ? "rotate-180 text-cerulean bg-white dark:bg-[#1E293B] shadow-2xs" : ""
              }`}
              title="Tùy chọn tài khoản"
            >
              <ChevronsUpDown className="w-4 h-4" />
            </div>
          </div>
          </motion.div>
        )}
      </div>
    </div>
  );
  };

  return (
    <>
      {/* Desktop Sidebar (Permanent, Collapsible between w-64/w-72 and w-[72px]) */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 left-0 bg-white dark:bg-[#131B2E] border-r border-[#E9ECEF] dark:border-[#2D3A54] z-30 shadow-[2px_0_12px_rgba(24,78,119,0.03)] dark:shadow-[2px_0_12px_rgba(0,0,0,0.4)] transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "w-[72px]" : "w-64 xl:w-72"
        }`}
      >
        {renderContent(isSidebarCollapsed, false)}
      </aside>

      {/* Mobile Drawer (Always Full Expanded on Mobile) */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] h-full bg-white dark:bg-[#131B2E] shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            {renderContent(false, true)}
          </div>
        </div>
      )}
    </>
  );
}
