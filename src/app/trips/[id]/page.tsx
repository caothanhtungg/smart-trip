import * as React from "react";
import type { Metadata } from "next";
import { AppHeader } from "@/components/layout/app-header";
import { AppFooter } from "@/components/layout/app-footer";
import { getTripDetailById, MOCK_TRIPS } from "@/lib/mock-trips";
import { TripDetailView } from "@/components/trips/detail/trip-detail-view";
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

  return <TripDetailView trip={trip} />;
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
