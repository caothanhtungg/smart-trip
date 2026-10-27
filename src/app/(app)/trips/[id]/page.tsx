"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TripBudgetCard } from "@/components/trips/detail/trip-budget-card";
import { TripStatsOverview } from "@/components/trips/detail/trip-stats-overview";
import { TripLiveMapWidget } from "@/components/trips/detail/trip-live-map-widget";
import { TripRecentExpenses } from "@/components/trips/detail/trip-recent-expenses";
import { TripMembersCard } from "@/components/trips/detail/trip-members-card";
import { TripInfoSidebar } from "@/components/trips/detail/trip-info-sidebar";
import { useTripSession } from "@/components/trips/detail/trip-session-context";

export default function TripOverviewPage() {
  const router = useRouter();
  const { sessionTrip, sessionItinerary, setIsOverviewAddModalOpen } = useTripSession();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Main Workspace (8 Columns on Desktop) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* 1. Ngân sách chuyến đi */}
        <TripBudgetCard trip={sessionTrip} />

        {/* 2. Bộ 3 chỉ số tài chính */}
        <TripStatsOverview trip={sessionTrip} />

        {/* 3. Bản đồ vị trí trực quan & Lộ trình nhóm */}
        <TripLiveMapWidget trip={sessionTrip} itineraryItems={sessionItinerary} />

        {/* 4. Hoạt động gần đây */}
        <TripRecentExpenses
          trip={sessionTrip}
          onOpenExpensesTab={() => router.push(`/trips/${sessionTrip.id}/expenses`)}
          onOpenAddExpenseModal={() => {
            if (sessionTrip.status === "SETTLING" || sessionTrip.status === "COMPLETED") {
              router.push(`/trips/${sessionTrip.id}/expenses`);
            } else {
              setIsOverviewAddModalOpen(true);
            }
          }}
        />
      </div>

      {/* Right Sticky Sidebar (4 Columns on Desktop) */}
      <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24">
        {/* Thành viên chuyến đi */}
        <TripMembersCard trip={sessionTrip} />

        {/* Thông tin chuyến đi (Mã mời) */}
        <TripInfoSidebar trip={sessionTrip} />
      </aside>
    </div>
  );
}
