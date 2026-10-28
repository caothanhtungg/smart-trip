"use client";

import * as React from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppFooter } from "@/components/layout/app-footer";
import { AppShellProvider, useAppShell } from "./app-shell-context";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { isMobileSidebarOpen, closeMobileSidebar } = useAppShell();

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

      {/* Main Content Area: Offset on Desktop by Sidebar width */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 xl:pl-72 transition-all duration-200">
        <main className="flex-1 w-full flex flex-col">{children}</main>
        <AppFooter />
      </div>
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
