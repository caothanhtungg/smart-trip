"use client";

import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { TimeConflictInfo } from "@/types/trip";

interface TripItineraryConflictBadgeProps {
  conflict: TimeConflictInfo;
  className?: string;
}

export function TripItineraryConflictBadge({
  conflict,
  className = "",
}: TripItineraryConflictBadgeProps) {
  if (!conflict.hasConflict) return null;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-functional-warning-bg text-functional-warning border border-functional-warning/30 text-xs font-semibold shadow-sm ${className}`}
      role="status"
      aria-label={
        conflict.message ||
        `Cảnh báo: Trùng ${conflict.overlapMinutes} phút với ${conflict.conflictingPlaceName || "địa điểm khác"}`
      }
    >
      <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-functional-warning" />
      <span>
        {conflict.message ||
          `Trùng ${conflict.overlapMinutes} phút với "${conflict.conflictingPlaceName}"`}
      </span>
    </div>
  );
}
