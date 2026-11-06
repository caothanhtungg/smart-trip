"use client";

import * as React from "react";
import {
  Search,
  Menu,
  X,
  Bell,
  Ticket,
} from "lucide-react";
import { useUserProfile } from "@/lib/user/user-context";
import { useAppShell } from "./app-shell-context";
import { NotificationPopover } from "@/components/layout/notification-popover";
import {
  formatKeyboardShortcut,
} from "./top-bar-logic";

export interface AppTopBarProps {
  title: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  activeFilter?: string;
  onFilterChange?: (filterKey: string) => void;
  onCreateTrip?: () => void;
  onOpenInviteModal?: () => void;
  showFilters?: boolean;
}

export function AppTopBar({
  title,
  searchValue = "",
  onSearchChange,
  onOpenInviteModal,
}: AppTopBarProps) {
  const { openMobileSidebar } = useAppShell();
  const { unreadNotificationCount } = useUserProfile();
  const isMac = React.useSyncExternalStore(
    () => () => {},
    () => navigator.userAgent.toUpperCase().includes("MAC"),
    () => false
  );
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const notifRef = React.useRef<HTMLDivElement>(null);

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
    <header className="sticky top-0 z-20 w-full bg-white/95 dark:bg-[#131B2E]/90 backdrop-blur-md border-b border-[#E9ECEF] dark:border-[#2D3A54] transition-all">
      <div className="w-full px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Mobile Menu Button & Clean 1-Line Page Title */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={openMobileSidebar}
            aria-label="Mở thanh điều hướng"
            className="lg:hidden p-2 -ml-1 rounded-xl text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <h1 className="text-base sm:text-lg lg:text-xl font-bold text-yale-blue dark:text-white tracking-tight truncate">
            {title}
          </h1>
        </div>

        {/* Right: Search, Compact Nhập mã mời & Notifications */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Search Input */}
          {onSearchChange && (
            <div className="relative w-36 sm:w-56 md:w-64 lg:w-72 group">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-[#E05833] transition-colors pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm kiếm..."
                aria-label="Tìm kiếm địa điểm hoặc chuyến đi"
                className="w-full h-9 sm:h-10 pl-8.5 pr-11 text-xs sm:text-sm bg-[#F8F9FA] dark:bg-[#1C2541] hover:bg-[#F1F3F5] dark:hover:bg-[#243050] focus:bg-white dark:focus:bg-[#1C2541] rounded-xl border border-transparent focus:border-[#E05833]/40 focus:outline-none focus:ring-2 focus:ring-[#E05833]/20 transition-all text-text-body dark:text-slate-100 placeholder:text-text-muted dark:placeholder:text-slate-500"
              />
              {searchValue ? (
                <button
                  type="button"
                  onClick={() => onSearchChange("")}
                  aria-label="Xóa tìm kiếm"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-text-muted hover:text-text-body rounded-full hover:bg-black/5 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-text-muted dark:text-slate-400 bg-white dark:bg-[#243050] border border-[#E9ECEF] dark:border-[#2D3A54] rounded-md absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none shadow-2xs">
                  {formatKeyboardShortcut(isMac)}
                </kbd>
              )}
            </div>
          )}

          {/* Compact Action: Nhập mã mời */}
          {onOpenInviteModal && (
            <button
              type="button"
              onClick={onOpenInviteModal}
              title="Nhập mã mời tham gia chuyến đi"
              aria-label="Nhập mã mời tham gia chuyến đi"
              className="inline-flex items-center gap-1.5 h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl text-xs sm:text-sm font-semibold text-text-body dark:text-slate-200 hover:text-yale-blue dark:hover:text-white bg-white dark:bg-[#1C2541] hover:bg-hover-row dark:hover:bg-[#243050] border border-[#E9ECEF] dark:border-[#2D3A54] hover:border-[#52B69A]/60 transition-all cursor-pointer shadow-2xs"
            >
              <Ticket className="w-4 h-4 text-text-muted shrink-0" />
              <span className="hidden md:inline whitespace-nowrap">Nhập mã mời</span>
            </button>
          )}

          {/* Notifications Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              aria-label="Thông báo hệ thống"
              title="Thông báo hệ thống"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-yale-blue dark:hover:text-white hover:bg-hover-row dark:hover:bg-[#243050] transition-colors relative focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist cursor-pointer"
            >
              <Bell className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E05833] ring-2 ring-white" />
              )}
            </button>

            <NotificationPopover
              isOpen={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
