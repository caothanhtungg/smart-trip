import * as React from "react";
import type { Metadata } from "next";
import { getTripDetailById } from "@/lib/data/trips";
import { TripNotFound } from "@/components/trips/detail/trip-not-found";
import { TripSessionProvider } from "@/components/trips/detail/trip-session-context";
import { TripDetailLayoutView } from "@/components/trips/detail/trip-detail-layout-view";

interface LayoutProps {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const trip = await getTripDetailById(id);

  if (!trip) {
    return {
      title: "Không tìm thấy chuyến đi | Smart Trip",
      description: "Chuyến đi không tồn tại hoặc bạn không có quyền truy cập.",
    };
  }

  return {
    title: `${trip.name} — Chi tiết chuyến đi | Smart Trip`,
    description: `Tổng quan kế hoạch, tiến độ ngân sách và các khoản chi tiêu cho chuyến đi ${trip.name}`,
  };
}

async function TripDetailLayoutContent({
  params,
  children,
}: LayoutProps) {
  const { id } = await params;
  const trip = await getTripDetailById(id);

  if (!trip) {
    return <TripNotFound tripId={id} />;
  }

  return (
    <TripSessionProvider initialTrip={trip}>
      <TripDetailLayoutView tripId={id}>{children}</TripDetailLayoutView>
    </TripSessionProvider>
  );
}

export default function TripDetailLayout({ params, children }: LayoutProps) {
  return (
    <React.Suspense
      fallback={
        <div className="w-full min-h-[400px] flex items-center justify-center text-text-muted text-sm font-medium animate-pulse">
          Đang tải chi tiết chuyến đi...
        </div>
      }
    >
      <TripDetailLayoutContent params={params}>
        {children}
      </TripDetailLayoutContent>
    </React.Suspense>
  );
}
