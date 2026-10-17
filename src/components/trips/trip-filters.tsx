"use client";

import * as React from "react";
import { ArrowUpDown } from "lucide-react";
import { TripFilterTab, TripSortOption } from "@/types/trip";

interface TripFiltersProps {
  activeTab: TripFilterTab;
  onTabChange: (tab: TripFilterTab) => void;
  counts: {
    all: number;
    active: number;
    completed: number;
  };
  sortBy: TripSortOption;
  onSortChange: (sortBy: TripSortOption) => void;
}

export function TripFilters({
  activeTab,
  onTabChange,
  counts,
  sortBy,
  onSortChange,
}: TripFiltersProps) {
  const tabs: Array<{ id: TripFilterTab; label: string; count: number }> = [
    { id: "all", label: "Tất cả", count: counts.all },
    { id: "active", label: "Đang diễn ra", count: counts.active },
    { id: "completed", label: "Đã kết thúc", count: counts.completed },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border-hairline mb-6 sm:mb-8 gap-3">
      {/* Filter Tabs */}
      <div
        className="flex items-center gap-4 sm:gap-6 -mb-[1px] overflow-x-auto"
        role="tablist"
        aria-label="Lọc danh sách chuyến đi"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onTabChange(tab.id)}
              className={`py-3 px-1 border-b-[2.5px] flex items-center gap-2 transition-colors cursor-pointer text-sm sm:text-base font-semibold whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-ocean-mist rounded-t ${
                isActive
                  ? "border-cerulean text-cerulean"
                  : "border-transparent text-text-muted hover:text-yale-blue"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive
                    ? "bg-cerulean/15 text-cerulean"
                    : "bg-border-hairline/70 text-text-muted"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sorting Control */}
      <div className="flex items-center gap-2 pb-2 sm:pb-0 self-end sm:self-center">
        <label
          htmlFor="trip-sort-select"
          className="flex items-center gap-1.5 text-text-muted text-xs font-medium cursor-pointer"
        >
          <ArrowUpDown className="w-3.5 h-3.5 stroke-[2] text-cerulean" />
          <span>Sắp xếp:</span>
        </label>
        <select
          id="trip-sort-select"
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as TripSortOption)}
          aria-label="Chọn tiêu chí sắp xếp chuyến đi"
          className="bg-white border border-border-hairline rounded-xl px-3 py-1.5 text-xs text-text-body font-semibold hover:border-cerulean focus:outline-none focus:ring-2 focus:ring-ocean-mist cursor-pointer shadow-xs transition-colors"
        >
          <option value="latest">Cập nhật gần nhất</option>
          <option value="departure">Ngày khởi hành</option>
          <option value="name">Tên chuyến đi A–Z</option>
        </select>
      </div>
    </div>
  );
}
