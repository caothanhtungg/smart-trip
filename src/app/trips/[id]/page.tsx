import * as React from "react";
import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { getTripDetailById, MOCK_TRIPS } from "@/lib/mock-trips";
import { TripDetailHeader } from "@/components/trips/detail/trip-detail-header";
import { TripDetailTabs } from "@/components/trips/detail/trip-detail-tabs";
import { TripBudgetCard } from "@/components/trips/detail/trip-budget-card";
import { TripStatsOverview } from "@/components/trips/detail/trip-stats-overview";
import { TripRecentExpenses } from "@/components/trips/detail/trip-recent-expenses";
import { TripExpenseDonutChart } from "@/components/trips/detail/trip-expense-donut-chart";
import { TripMembersCard } from "@/components/trips/detail/trip-members-card";
import { TripInfoSidebar } from "@/components/trips/detail/trip-info-sidebar";
import { TripNotFound } from "@/components/trips/detail/trip-not-found";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return MOCK_TRIPS.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const trip = getTripDetailById(id);

  if (!trip) {
    return {
      title: "Không tìm thấy chuyến đi | Smart Trip",
      description: "Chuyến đi không tồn tại hoặc bạn không có quyền truy cập.",
    };
  }

  return {
    title: `${trip.title} — Chi tiết chuyến đi | Smart Trip`,
    description: `Tổng quan kế hoạch, tiến độ ngân sách và các khoản chi tiêu cho chuyến đi ${trip.title}`,
  };
}

async function TripDetailContent({ params }: PageProps) {
  const { id } = await params;
  const trip = getTripDetailById(id);

  if (!trip) {
    return <TripNotFound tripId={id} />;
  }

  return (
    <>
      {/* Top Cover Banner & Breadcrumb */}
      <TripDetailHeader trip={trip} />

      {/* Phased Tabs Bar */}
      <TripDetailTabs />

      {/* Workspace Grid Container */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Main Workspace (8 Columns on Desktop) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* 1. Ngân sách chuyến đi */}
            <TripBudgetCard trip={trip} />

            {/* 2. Bộ 3 chỉ số tài chính */}
            <TripStatsOverview trip={trip} />

            {/* 3. Hoạt động gần đây */}
            <TripRecentExpenses trip={trip} />

            {/* 4. Donut Chart phân bổ chi tiêu & Bối cảnh điểm đến */}
            <TripExpenseDonutChart trip={trip} />
          </div>

          {/* Right Sticky Sidebar (4 Columns on Desktop) */}
          <aside className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24">
            {/* 5. Thành viên chuyến đi */}
            <TripMembersCard trip={trip} />

            {/* 6. Thông tin chuyến đi (Thời tiết, Mã mời, Bản đồ) */}
            <TripInfoSidebar trip={trip} />
          </aside>
        </div>
      </div>
    </>
  );
}

export default function TripDetailPage({ params }: PageProps) {
  return (
    <div className="w-full min-h-screen flex flex-col bg-bg-canvas font-sans antialiased text-text-body">
      {/* Fixed Navigation Header */}
      <AppHeader />

      {/* Main Content Area wrapped in Suspense boundary */}
      <main className="w-full pt-[72px] flex-1">
        <React.Suspense
          fallback={
            <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 animate-pulse text-text-muted text-sm font-medium">
              Đang tải chi tiết chuyến đi...
            </div>
          }
        >
          <TripDetailContent params={params} />
        </React.Suspense>
      </main>

      {/* Application Footer */}
      <AppFooter />
    </div>
  );
}
