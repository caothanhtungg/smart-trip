"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DestinationQuickPillsProps {
  currentValue: string;
  onSelect: (destination: string) => void;
}

const DESTINATION_SUGGESTIONS = [
  { shortName: "Đà Lạt", fullName: "Thành phố Đà Lạt, Lâm Đồng" },
  { shortName: "Sa Pa", fullName: "Sa Pa, Lào Cai" },
  { shortName: "Phú Quốc", fullName: "Phú Quốc, Kiên Giang" },
  { shortName: "Quy Nhơn", fullName: "Quy Nhơn, Bình Định" },
  { shortName: "Ninh Bình", fullName: "Ninh Bình" },
];

export function DestinationQuickPills({
  currentValue,
  onSelect,
}: DestinationQuickPillsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 pt-1">
      <span className="text-xs font-medium text-text-muted mr-1 select-none">
        Gợi ý:
      </span>
      {DESTINATION_SUGGESTIONS.map((item) => {
        const isSelected = currentValue === item.fullName;
        return (
          <button
            key={item.shortName}
            type="button"
            onClick={() => onSelect(item.fullName)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer border",
              isSelected
                ? "bg-cerulean text-white border-cerulean shadow-xs"
                : "bg-hover-row/70 hover:bg-hover-row text-yale-blue border-border-hairline/60"
            )}
          >
            {item.shortName}
          </button>
        );
      })}
    </div>
  );
}
