import * as React from "react";
import type { Metadata } from "next";
import { getTripDetailById } from "@/lib/data/trips";
import { TripNotFound } from "@/components/trips/detail/trip-not-found";
import { TripSessionProvider } from "@/components/trips/detail/trip-session-context";
import { TripDetailLayoutView } from "@/components/trips/detail/trip-detail-layout-view";
import { TripDetailClientLoader } from "@/components/trips/detail/trip-detail-client-loader";
import { isUuid } from "@/lib/utils";

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

  // Nếu là UUID database, sử dụng tiêu đề chung để bảo mật thông tin riêng tư (chống IDOR / Data Leakage)
  if (isUuid(id)) {
    return {
      title: "Chi tiết chuyến đi | Smart Trip",
      description: "Quản lý kế hoạch, tiến độ ngân sách và các khoản chi tiêu cho chuyến đi trên Smart Trip.",
    };
  }

  // Nếu là mock slug legacy (vd: trip-dalat-3n2d)
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

  // Phân nhánh 1: ID là UUID hợp lệ -> Tải dữ liệu thật qua API và bảo toàn session context
  if (isUuid(id)) {
    return (
      <TripDetailClientLoader tripId={id}>
        {children}
      </TripDetailClientLoader>
    );
  }

  // Phân nhánh 2: ID là mock slug legacy -> Giữ nguyên luồng mock hiện tại
  const trip = await getTripDetailById(id);

  if (!trip) {
    return <TripNotFound tripId={id} />;
  }

  return (
    <TripSessionProvider key={id} initialTrip={trip} isRealApi={false}>
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
