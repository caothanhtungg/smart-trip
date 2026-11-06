"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Settings,
  BookOpen,
  MessageSquare,
  LogOut,
  ArrowUpRight,
  Sun,
  Moon,
  Monitor,
  ChevronRight,
  Check,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { signOut } from "@/lib/auth-client";
import { useTheme, ThemeMode } from "@/lib/theme/theme-context";

export interface UserMenuDropupProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: () => void;
  profile?: {
    fullName?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
  isCollapsed?: boolean;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export const THEME_MENU_OPTIONS = [
  { key: "light" as ThemeMode, label: "Sáng", icon: Sun, color: "text-amber-500" },
  { key: "dark" as ThemeMode, label: "Tối", icon: Moon, color: "text-indigo-400" },
  { key: "system" as ThemeMode, label: "Tự động", icon: Monitor, color: "text-sky-500" },
] as const;

export function UserMenuDropup({
  isOpen,
  onClose,
  onNavigate,
  profile,
  isCollapsed = false,
  triggerRef,
}: UserMenuDropupProps) {
  const menuRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isThemeSubmenuOpen, setIsThemeSubmenuOpen] = React.useState(false);

  const { theme, resolvedTheme, setTheme } = useTheme();

  // Close theme submenu when root menu closes
  const [prevIsOpen, setPrevIsOpen] = React.useState(isOpen);
  if (prevIsOpen !== isOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setIsThemeSubmenuOpen(false);
    }
  }

  // Close on outside click or touch
  React.useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      // If clicked inside this menu or inside the trigger that opened it, don't close
      if (
        (menuRef.current && menuRef.current.contains(target)) ||
        (triggerRef?.current && triggerRef.current.contains(target))
      ) {
        return;
      }
      onClose();
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (isThemeSubmenuOpen) {
          setIsThemeSubmenuOpen(false);
        } else {
          onClose();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isThemeSubmenuOpen, onClose]);

  if (!isOpen) return null;

  const handleActionClick = () => {
    onClose();
    if (onNavigate) {
      onNavigate();
    }
  };


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

  // Compute active theme icon for main menu trigger
  const CurrentThemeIcon =
    theme === "dark" || (theme === "system" && resolvedTheme === "dark")
      ? Moon
      : theme === "light"
      ? Sun
      : Monitor;

  const themeIconColor =
    theme === "dark" || (theme === "system" && resolvedTheme === "dark")
      ? "text-indigo-400"
      : theme === "light"
      ? "text-amber-500"
      : "text-sky-500";

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-orientation="vertical"
      aria-label="Menu tài khoản"
      className={`z-50 bg-white dark:bg-[#1C2541] rounded-2xl border border-divider-border dark:border-[#2D3A54] shadow-[0_16px_40px_rgba(24,78,119,0.18)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.5)] p-2 animate-in fade-in zoom-in-95 duration-150 flex flex-col gap-1 overflow-visible ${
        isCollapsed
          ? "absolute bottom-0 left-full ml-3 w-64"
          : "absolute bottom-full left-0 right-0 mb-2.5"
      }`}
    >
      {/* 1. Mini Profile Header: only shown in collapsed rail mode to avoid duplicate bar */}
      {isCollapsed && (
        <>
          <div className="p-2.5 rounded-xl bg-hover-row/60 dark:bg-[#243050]/60 border border-divider-border/50 dark:border-[#2D3A54]/60 flex items-center gap-2.5">
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
          <div className="h-[1px] bg-divider-border/60 dark:bg-[#2D3A54]/60 my-0.5" />
        </>
      )}

      {/* 2. Account Links */}
      <Link
        href="/profile"
        role="menuitem"
        onClick={handleActionClick}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-body dark:text-slate-200 hover:text-yale-blue dark:hover:text-white hover:bg-hover-row dark:hover:bg-[#243050] transition-colors"
      >
        <User className="w-4 h-4 text-cerulean shrink-0" />
        <span className="flex-1 whitespace-nowrap">Hồ sơ của tôi</span>
      </Link>

      <Link
        href="/profile"
        role="menuitem"
        onClick={handleActionClick}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-body dark:text-slate-200 hover:text-yale-blue dark:hover:text-white hover:bg-hover-row dark:hover:bg-[#243050] transition-colors"
      >
        <Settings className="w-4 h-4 text-text-muted shrink-0" />
        <span className="flex-1 whitespace-nowrap">Cài đặt tài khoản</span>
      </Link>

      {/* 3. Utilities & Help */}
      <Link
        href="/guides"
        role="menuitem"
        onClick={handleActionClick}
        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-text-body dark:text-slate-200 hover:text-yale-blue dark:hover:text-white hover:bg-hover-row dark:hover:bg-[#243050] transition-colors group"
      >
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-[#52B69A] shrink-0" />
          <span className="whitespace-nowrap">Cẩm nang du lịch</span>
        </div>
        <ArrowUpRight className="w-3.5 h-3.5 text-text-muted group-hover:text-yale-blue transition-colors" />
      </Link>

      <a
        href="https://www.facebook.com/caoothanhtung"
        target="_blank"
        rel="noopener noreferrer"
        role="menuitem"
        onClick={handleActionClick}
        className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-text-body dark:text-slate-200 hover:text-yale-blue dark:hover:text-white hover:bg-hover-row dark:hover:bg-[#243050] transition-colors text-left cursor-pointer group"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="whitespace-nowrap">Góp ý & Trợ giúp</span>
        </div>
        <ArrowUpRight className="w-3.5 h-3.5 text-text-muted group-hover:text-yale-blue dark:group-hover:text-white transition-colors" />
      </a>

      {/* 4. Interactive Theme & Appearance Menu (Unified Accordion on all screens) */}
      <div className="relative">
        <button
          type="button"
          role="menuitem"
          aria-haspopup="true"
          aria-expanded={isThemeSubmenuOpen}
          onClick={() => setIsThemeSubmenuOpen((prev) => !prev)}
          className={`flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
            isThemeSubmenuOpen
              ? "bg-hover-row dark:bg-[#243050] text-yale-blue dark:text-white"
              : "text-text-body dark:text-slate-200 hover:text-yale-blue dark:hover:text-white hover:bg-hover-row dark:hover:bg-[#243050]"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CurrentThemeIcon className={`w-4 h-4 ${themeIconColor} shrink-0`} />
            <span className="whitespace-nowrap">Giao diện</span>
          </div>
          <ChevronRight
            className={`w-3.5 h-3.5 text-text-muted transition-transform duration-150 ${
              isThemeSubmenuOpen ? "rotate-90" : ""
            }`}
          />
        </button>

        {/* Accordion expansion - Works everywhere smoothly */}
        {isThemeSubmenuOpen && (
          <div className="pl-3 pr-1 py-1 flex flex-col gap-1 border-l-2 border-divider-border/80 dark:border-[#2D3A54] ml-4 my-1">
            {THEME_MENU_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  role="menuitemradio"
                  aria-checked={isSelected}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTheme(opt.key);
                  }}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left active:scale-[0.98] ${
                    isSelected
                      ? "bg-hover-row dark:bg-[#243050] text-yale-blue dark:text-sky-400 font-bold"
                      : "text-text-body dark:text-slate-200 hover:text-yale-blue hover:bg-hover-row"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-3.5 h-3.5 ${opt.color} shrink-0`} />
                    <span className="whitespace-nowrap">{opt.label}</span>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-yale-blue dark:text-sky-400 shrink-0 ml-1.5" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="h-[1px] bg-divider-border/60 dark:bg-[#2D3A54]/60 my-0.5" />

      {/* 5. Sign Out (Destructive) */}
      <button
        type="button"
        role="menuitem"
        disabled={isLoggingOut}
        onClick={handleLogout}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-functional-negative hover:bg-functional-negative/10 transition-colors w-full text-left cursor-pointer disabled:opacity-50"
      >
        <LogOut className="w-4 h-4 shrink-0" />
        <span className="whitespace-nowrap">
          {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
        </span>
      </button>
    </div>
  );
}
