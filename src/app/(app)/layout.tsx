import * as React from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { UserProfileProvider } from "@/lib/user/user-context";
import { TripsStoreProvider } from "@/lib/trips/trips-store-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProfileProvider>
      <TripsStoreProvider>
        <div className="w-full min-h-screen flex flex-col bg-bg-canvas font-sans antialiased text-text-body">
          {/* Fixed Navigation Header */}
          <React.Suspense
            fallback={
              <header className="fixed top-0 left-0 w-full z-40 h-[72px] bg-white border-b border-border-hairline shadow-[0_4px_16px_rgba(24,78,119,0.06)]" />
            }
          >
            <AppHeader />
          </React.Suspense>

          {/* Main Content Area */}
          <main className="w-full pt-[72px] flex-1">{children}</main>

          {/* Application Footer */}
          <AppFooter />
        </div>
      </TripsStoreProvider>
    </UserProfileProvider>
  );
}

