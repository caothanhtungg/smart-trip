import * as React from "react";
import type { Metadata } from "next";
import { TripJoinView } from "@/components/trips/invite/trip-join-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lời mời tham gia chuyến đi | Smart Trip",
  description: "Xem trước thông tin lời mời và tham gia chuyến đi trên Smart Trip.",
};

interface JoinPageProps {
  params: Promise<{ code: string }>;
}

export default async function JoinTripPage({ params }: JoinPageProps) {
  const { code } = await params;

  return (
    <React.Suspense
      fallback={
        <div className="w-full min-h-screen flex items-center justify-center text-text-muted text-sm font-medium animate-pulse">
          Đang tải thông tin lời mời...
        </div>
      }
    >
      <TripJoinView code={code} />
    </React.Suspense>
  );
}
