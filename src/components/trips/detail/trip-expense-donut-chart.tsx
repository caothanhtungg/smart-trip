"use client";

import * as React from "react";
import { PieChart, MapPin } from "lucide-react";
import { TripDetailData } from "@/types/trip";
import { formatMoney } from "@/lib/utils";

interface TripExpenseDonutChartProps {
  trip: TripDetailData;
}

export function TripExpenseDonutChart({ trip }: TripExpenseDonutChartProps) {
  // Compute SVG circle strokes for Donut chart
  // Circumference = 2 * PI * r = 2 * PI * 15.9155 = ~100
  const strokeSegments = trip.categoryAllocations.map((cat, idx) => {
    const priorOffset = trip.categoryAllocations
      .slice(0, idx)
      .reduce((sum, item) => sum + item.percentage, 0);
    const dashArray = `${cat.percentage} ${100 - cat.percentage}`;
    const dashOffset = -priorOffset;
    return {
      ...cat,
      dashArray,
      dashOffset,
    };
  });

  return (
    <section aria-label="Bối cảnh điểm đến và phân bổ chi phí" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Travel Story Snapshot / Next Destination */}
      <div className="relative h-48 rounded-[20px] overflow-hidden group shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-border-hairline bg-yale-blue">
        {/* Scenic Background Gradient / Image placeholder */}
        <div
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          style={{
            background:
              "linear-gradient(135deg, var(--color-yale-blue) 0%, var(--color-baltic-blue) 40%, var(--color-bondi-blue) 70%, var(--color-ocean-mist) 100%)",
          }}
        />

        {/* Gradient Overlay for Text Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-yale-blue/90 via-yale-blue/40 to-transparent flex flex-col justify-end p-5">
          <span className="text-lime-cream font-bold uppercase tracking-wider text-xs mb-1">
            {trip.nextDestination?.label || "Điểm đến tiếp theo"}
          </span>
          <span className="text-white text-base sm:text-lg font-bold leading-snug line-clamp-2">
            {trip.nextDestination?.title || trip.destination}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-white/80 mt-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-lime-cream shrink-0" />
            <span>{trip.destination}</span>
          </div>
        </div>
      </div>

      {/* 2. Donut SVG Breakdown Card */}
      <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_16px_rgba(24,78,119,0.06)] border border-border-hairline flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm sm:text-base font-bold text-yale-blue">
            Phân bổ chi tiêu theo nhóm
          </h3>
          <PieChart className="w-4 h-4 text-cerulean shrink-0" />
        </div>

        {/* Donut Chart + Legend */}
        <div className="flex items-center gap-4 my-2">
          {/* SVG Donut */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg
              className="w-24 h-24 -rotate-90"
              viewBox="0 0 36 36"
              aria-label="Biểu đồ phân bổ chi tiêu"
            >
              {/* Background circle track */}
              <circle
                cx="18"
                cy="18"
                fill="transparent"
                r="15.9155"
                stroke="var(--color-hover-row)"
                strokeWidth="3.8"
              />

              {/* Category stroke slices */}
              {strokeSegments.map((seg) => (
                <circle
                  key={seg.category}
                  cx="18"
                  cy="18"
                  fill="transparent"
                  r="15.9155"
                  stroke={seg.color}
                  strokeWidth="3.8"
                  strokeDasharray={seg.dashArray}
                  strokeDashoffset={seg.dashOffset}
                  strokeLinecap="round"
                />
              ))}
            </svg>

            {/* Center Count */}
            <div className="absolute flex flex-col items-center">
              <span className="text-xs font-bold text-yale-blue tabular-nums">
                {trip.expenseCount}
              </span>
              <span className="text-[10px] text-text-muted font-medium">mục</span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="flex flex-col gap-1.5 w-full text-xs">
            {trip.categoryAllocations.map((alloc) => (
              <div key={alloc.category} className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-text-muted font-medium">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: alloc.color }}
                    aria-hidden="true"
                  />
                  <span>
                    {alloc.category} ({alloc.percentage}%)
                  </span>
                </span>
                <span className="font-semibold text-yale-blue tabular-nums">
                  {formatMoney(alloc.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
