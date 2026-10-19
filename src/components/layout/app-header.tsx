"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Bell, ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useUserProfile } from "@/lib/user/user-context";
import { NotificationPopover } from "@/components/layout/notification-popover";

export function AppHeader() {
  const pathname = usePathname();
  const { profile, unreadNotificationCount } = useUserProfile();
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const notifRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isTripsActive = pathname.startsWith("/trips");
  const isProfileActive = pathname.startsWith("/profile");

  return (
    <header className="fixed top-0 left-0 w-full z-40 h-[72px] bg-white border-b border-border-hairline shadow-[0_4px_16px_rgba(24,78,119,0.06)]">
      <div className="max-w-[1200px] mx-auto h-[72px] px-4 sm:px-6 flex items-center justify-between">
        {/* Left: Brand Logo & Navigation */}
        <div className="flex items-center gap-6 sm:gap-8">
          <Link
            href="/trips"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist rounded-xl"
          >
            <div className="w-9 h-9 rounded-xl bg-cerulean/10 flex items-center justify-center text-cerulean group-hover:bg-cerulean group-hover:text-white transition-colors duration-150">
              <Compass className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-xl font-bold text-yale-blue tracking-tight">
              Smart Trip
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 h-[72px]" aria-label="Chính">
            <Link
              href="/trips"
              className={`h-full flex items-center font-semibold px-1 text-[15px] transition-colors border-b-[3px] ${
                isTripsActive
                  ? "border-cerulean text-cerulean"
                  : "border-transparent text-text-muted hover:text-yale-blue"
              }`}
            >
              Chuyến đi của tôi
            </Link>
            <Link
              href="/profile"
              className={`h-full flex items-center font-semibold px-1 text-[15px] transition-colors border-b-[3px] ${
                isProfileActive
                  ? "border-cerulean text-cerulean"
                  : "border-transparent text-text-muted hover:text-yale-blue"
              }`}
            >
              Hồ sơ của tôi
            </Link>
          </nav>
        </div>

        {/* Right: Actions & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notification Button & Popover */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              aria-label="Thông báo hệ thống"
              onClick={() => setNotificationsOpen((prev) => !prev)}
              aria-expanded={notificationsOpen}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors relative cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span
                  className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-functional-warning ring-2 ring-white"
                  aria-hidden="true"
                />
              )}
            </button>

            <NotificationPopover
              isOpen={notificationsOpen}
              onClose={() => setNotificationsOpen(false)}
            />
          </div>

          {/* User Profile Dropdown Trigger */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              aria-label="Menu tài khoản người dùng"
              className="flex items-center gap-2.5 p-1.5 pl-2 rounded-xl hover:bg-hover-row border border-transparent hover:border-border-hairline transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist"
            >
              <Avatar
                name={profile.displayName || profile.fullName}
                size="sm"
                className="bg-lime-cream text-yale-blue font-bold shadow-xs"
              />
              <span className="hidden sm:inline-block text-sm font-semibold text-yale-blue max-w-[120px] truncate">
                {profile.displayName}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-border-hairline shadow-[0_12px_32px_rgba(24,78,119,0.14)] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-border-hairline/70">
                  <p className="text-xs text-text-muted">Đăng nhập với</p>
                  <p className="text-sm font-bold text-yale-blue truncate">
                    {profile.fullName}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {profile.email}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    href="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-body hover:bg-hover-row hover:text-cerulean transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-ocean-mist" />
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                </div>

                <div className="border-t border-border-hairline/70 pt-1">
                  <Link
                    href="/login"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-functional-negative hover:bg-functional-warning-bg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng xuất</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
