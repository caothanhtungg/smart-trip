"use client";

import * as React from "react";
import { TripDetailHeader } from "@/components/trips/detail/trip-detail-header";
import { TripDetailTabs } from "@/components/trips/detail/trip-detail-tabs";
import { useTripSession } from "@/components/trips/detail/trip-session-context";

export function TripDetailLayoutView({
  tripId,
  children,
}: {
  tripId: string;
  children: React.ReactNode;
}) {
  const { sessionTrip, sessionToast } = useTripSession();

  return (
    <>
      {/* Top Cover Banner & Breadcrumb */}
      <TripDetailHeader trip={sessionTrip} />

      {/* Phased Tabs Bar using Next.js Links */}
      <TripDetailTabs tripId={tripId} />

      {/* Main Workspace Container */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {sessionToast && (
          <div className="mb-6 p-4 rounded-2xl bg-tropical-teal/10 border border-tropical-teal/30 flex items-start gap-3 shadow-sm animate-fadeIn">
            <span className="text-xs sm:text-sm text-yale-blue font-medium">
              {sessionToast}
            </span>
          </div>
        )}
        {children}
      </div>
    </>
  );
}
