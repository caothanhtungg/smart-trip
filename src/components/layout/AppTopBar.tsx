"use client";

import * as React from "react";
import {
  Search,
  Plus,
  Menu,
  X,
  Bell,
  SlidersHorizontal,
} from "lucide-react";
import { useUserProfile } from "@/lib/user/user-context";
import { useAppShell } from "./app-shell-context";
import { NotificationPopover } from "@/components/layout/notification-popover";
import {
  TOPBAR_QUICK_FILTERS,
  formatKeyboardShortcut,
  QuickFilterOption,
} from "./top-bar-logic";

export interface AppTopBarProps {
  title: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  activeFilter?: string;
  onFilterChange?: (filterKey: string) => void;
  onCreateTrip?: () => void;
  showFilters?: boolean;
}

export function AppTopBar({
  title,
  subtitle,
  searchValue = "",
  onSearchChange,
  activeFilter = "all",
  onFilterChange,
  onCreateTrip,
  showFilters = false,
}: AppTopBarProps) {
  const { openMobileSidebar } = useAppShell();
  const { unreadNotificationCount } = useUserProfile();
  const [isMac, setIsMac] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const notifRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMac(navigator.userAgent.toUpperCase().includes("MAC"));
    }
  }, []);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-20 w-full bg-white/95 backdrop-blur-md border-b border-[#E9ECEF] transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
        {/* Left: Mobile Menu Button & Page Heading */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openMobileSidebar}
            aria-label="Mở thanh điều hướng"
            className="lg:hidden p-2 -ml-1 rounded-xl text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-yale-blue tracking-tight leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-text-muted hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right: Search, Filter, Notifications & CTA */}
        <div className="flex items-center flex-wrap sm:flex-nowrap gap-2.5 sm:gap-3 flex-1 md:flex-initial justify-end">
          {/* Quick Search Input */}
          {onSearchChange && (
            <div className="relative w-full sm:w-64 md:w-72 lg:w-80 group">
              <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 group-focus-within:text-[#E05833] transition-colors" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm địa điểm, chuyến đi..."
                aria-label="Tìm kiếm địa điểm hoặc chuyến đi"
                className="w-full h-10 pl-9 pr-14 text-xs sm:text-sm bg-[#F8F9FA] hover:bg-[#F1F3F5] focus:bg-white rounded-xl border border-transparent focus:border-[#E05833]/40 focus:outline-none focus:ring-2 focus:ring-[#E05833]/20 transition-all text-text-body placeholder:text-text-muted"
              />
              {searchValue ? (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  aria-label="Xóa tìm kiếm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-body"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-text-muted bg-white border border-[#E9ECEF] rounded-md absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none shadow-2xs">
                  {formatKeyboardShortcut(isMac)}
                </kbd>
              )}
            </div>
          )}

          {/* Quick Filters */}
          {showFilters && onFilterChange && (
            <div className="hidden xl:flex items-center gap-1 p-1 bg-[#F8F9FA] rounded-xl border border-[#E9ECEF]">
              {TOPBAR_QUICK_FILTERS.map((f) => {
                const isActive = activeFilter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => onFilterChange(f.key)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                      isActive
                        ? "bg-white text-yale-blue shadow-2xs"
                        : "text-text-muted hover:text-yale-blue"
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              aria-label="Thông báo hệ thống"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#E05833] ring-2 ring-white" />
              )}
            </button>

            <NotificationPopover
              isOpen={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
            />
          </div>

          {/* Main Action Button (CTA) */}
          {onCreateTrip && (
            <button
              type="button"
              onClick={onCreateTrip}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-[#E05833] hover:bg-[#D04823] active:scale-[0.98] shadow-sm shadow-[#E05833]/25 transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E05833]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Tạo chuyến đi</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
