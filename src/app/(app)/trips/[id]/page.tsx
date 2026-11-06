"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { TripBudgetCard } from "@/components/trips/detail/trip-budget-card";
import { TripStatsOverview } from "@/components/trips/detail/trip-stats-overview";
import { TripLiveMapWidget } from "@/components/trips/detail/trip-live-map-widget";
import { TripRecentExpenses } from "@/components/trips/detail/trip-recent-expenses";
import { TripMembersCard } from "@/components/trips/detail/trip-members-card";
import { useTripSession } from "@/components/trips/detail/trip-session-context";

export default function TripOverviewPage() {
  const router = useRouter();
  const { sessionTrip, sessionItinerary, setIsOverviewAddModalOpen } = useTripSession();

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* 1. Top Bento Financial Strip: Ngân sách & Bộ 3 chỉ số tài chính (4 thẻ cân đối) */}
      <section aria-label="Thống kê tài chính chuyến đi" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
        <TripBudgetCard trip={sessionTrip} />
        <TripStatsOverview trip={sessionTrip} />
      </section>

      {/* 2. Middle Bento Row: Bản đồ trực quan & Thành viên nhóm */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
        {/* Left: Bản đồ vị trí trực quan & Lộ trình nhóm */}
        <div className="lg:col-span-8">
          <TripLiveMapWidget trip={sessionTrip} itineraryItems={sessionItinerary} />
        </div>

        {/* Right: Thành viên nhóm (Avatar Stack) */}
        <aside className="lg:col-span-4 flex flex-col gap-6">
          <TripMembersCard trip={sessionTrip} />
        </aside>
      </div>

      {/* 3. Bottom Bento Row: Hoạt động chi tiêu gần đây */}
      <div>
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
    </div>
  );
}
