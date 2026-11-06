"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Compass } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { useUserProfile } from "@/lib/user/user-context";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppFooter } from "@/components/layout/app-footer";
import FloatingAIAssistant from "@/components/ai/FloatingAIAssistant";
import { AppShellProvider, useAppShell } from "./app-shell-context";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { isMobileSidebarOpen, closeMobileSidebar, isSidebarCollapsed, openMobileSidebar } = useAppShell();
  const { profile, isLoading } = useUserProfile();
  const pathname = usePathname();

  // Pages that render their own specialized AppTopBar (with search, filter & mobile hamburger menu)
  // e.g. /trips, /guides
  const hasDedicatedTopBar =
    pathname === "/trips" ||
    pathname === "/guides" ||
    pathname.startsWith("/guides/");

  // For pages without dedicated AppTopBar (/profile, /trips/new, /trips/[id], etc.), render universal mobile header
  const showMobileHeader = !hasDedicatedTopBar;

  return (
    <div className="w-full min-h-screen flex bg-bg-canvas font-sans antialiased text-text-body">
      {/* Modern Left Sidebar Navigation */}
      <React.Suspense
        fallback={
          <div className="hidden lg:block w-64 xl:w-72 fixed inset-y-0 left-0 bg-white border-r border-[#E9ECEF]" />
        }
      >
        <AppSidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={closeMobileSidebar}
        />
      </React.Suspense>

      {/* Main Content Area: Offset on Desktop by Sidebar width (smoothly transitions between 72px and full width) */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-64 xl:pl-72"
        }`}
      >
        {/* Universal Mobile Top Header (on screens < lg, for all pages except /trips which has AppTopBar) */}
        {showMobileHeader && (
          <header className="lg:hidden sticky top-0 z-30 w-full h-14 bg-white/95 dark:bg-[#131B2E]/95 backdrop-blur-md border-b border-[#E9ECEF] dark:border-[#2D3A54] px-4 flex items-center justify-between shadow-xs">
            {/* Left: Hamburger Button + Smart Trip Logo */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openMobileSidebar}
                aria-label="Mở menu điều hướng"
                className="p-2 -ml-2 rounded-xl text-text-muted hover:text-yale-blue dark:hover:text-white hover:bg-hover-row dark:hover:bg-[#1C2541] transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5 text-yale-blue dark:text-white" />
              </button>

              <Link
                href="/trips"
                className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist rounded-xl p-1"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#E05833] to-[#E76F51] flex items-center justify-center text-white shadow-xs">
                  <Compass className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-yale-blue dark:text-white tracking-tight leading-tight">
                    Smart Trip
                  </span>
                </div>
              </Link>
            </div>

            {/* Right: Quick User Avatar link */}
            <div className="flex items-center gap-2">
              <Link
                href="/profile"
                className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-cerulean/30 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist"
                aria-label="Xem hồ sơ người dùng"
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
              </Link>
            </div>
          </header>
        )}

        <main className="flex-1 w-full flex flex-col">{children}</main>
        <AppFooter />
      </div>

      {/* Global AI Travel Assistant Floating Button */}
      <FloatingAIAssistant />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AppShellProvider>
      <AppShellInner>{children}</AppShellInner>
    </AppShellProvider>
  );
}
