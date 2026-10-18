import * as React from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen flex flex-col bg-bg-canvas font-sans antialiased text-text-body">
      {/* Fixed Navigation Header */}
      <AppHeader />

      {/* Main Content Area */}
      <main className="w-full pt-[72px] flex-1">{children}</main>

      {/* Application Footer */}
      <AppFooter />
    </div>
  );
}
