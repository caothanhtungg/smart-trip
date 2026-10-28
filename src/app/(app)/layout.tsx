import * as React from "react";
import { UserProfileProvider } from "@/lib/user/user-context";
import { TripsStoreProvider } from "@/lib/trips/trips-store-context";
import { AppShell } from "@/components/layout/AppShell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProfileProvider>
      <TripsStoreProvider>
        <AppShell>{children}</AppShell>
      </TripsStoreProvider>
    </UserProfileProvider>
  );
}
