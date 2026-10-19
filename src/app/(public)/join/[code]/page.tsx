import * as React from "react";
import type { Metadata } from "next";
import { lookupInvitePreview } from "@/lib/trips/invite-preview";
import { TripJoinView } from "@/components/trips/invite/trip-join-view";
import { MOCK_TRIPS } from "@/lib/mock/trips";

interface JoinPageProps {
  params: Promise<{ code: string }>;
}

export async function generateStaticParams() {
  return MOCK_TRIPS.map((t) => ({
    code: t.inviteCode,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const lookup = lookupInvitePreview(code);

  if (lookup.status === "VALID" && lookup.previewData) {
    return {
      title: `${lookup.previewData.name} — Lời mời tham gia chuyến đi | Smart Trip`,
      description: `Lời mời tham gia chuyến đi ${lookup.previewData.name} cùng ${lookup.previewData.hostName} và các thành viên khác trên Smart Trip.`,
    };
  }

  return {
    title: "Mã mời chuyến đi | Smart Trip",
    description: "Xem trước thông tin lời mời và tham gia chuyến đi trên Smart Trip.",
  };
}

async function JoinTripContent({ params }: JoinPageProps) {
  const { code } = await params;
  const lookupResult = lookupInvitePreview(code);

  return <TripJoinView lookupResult={lookupResult} code={code} />;
}

export default function JoinTripPage({ params }: JoinPageProps) {
  return (
    <React.Suspense
      fallback={
        <div className="w-full min-h-screen flex items-center justify-center text-text-muted text-sm font-medium animate-pulse">
          Đang tải thông tin lời mời...
        </div>
      }
    >
      <JoinTripContent params={params} />
    </React.Suspense>
  );
}
