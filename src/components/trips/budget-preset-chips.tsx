"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface BudgetPresetChipsProps {
  currentAmount: number | null;
  onSelectAmount: (amount: number) => void;
  onSelectCustom: () => void;
}

const PRESETS = [
  { label: "5 triệu", amount: 5000000 },
  { label: "10 triệu", amount: 10000000 },
  { label: "20 triệu", amount: 20000000 },
];

export function BudgetPresetChips({
  currentAmount,
  onSelectAmount,
  onSelectCustom,
}: BudgetPresetChipsProps) {
  // Check if currentAmount matches one of presets
  const isCustom =
    currentAmount !== null &&
    !PRESETS.some((preset) => preset.amount === currentAmount);

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {PRESETS.map((preset) => {
        const isSelected = currentAmount === preset.amount;
        return (
          <button
            key={preset.amount}
            type="button"
            onClick={() => onSelectAmount(preset.amount)}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer border shadow-2xs",
              isSelected
                ? "bg-primary-fixed text-cerulean border-cerulean/30 ring-1 ring-cerulean/20"
                : "bg-white hover:bg-hover-row text-yale-blue border-border-hairline"
            )}
          >
            {preset.label}
          </button>
        );
      })}

      <button
        type="button"
        onClick={onSelectCustom}
        className={cn(
          "px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer border shadow-2xs",
          isCustom
            ? "bg-primary-fixed text-cerulean border-cerulean/30 ring-1 ring-cerulean/20"
            : "bg-white hover:bg-hover-row text-text-muted border-border-hairline"
        )}
      >
        Tùy chỉnh
      </button>
    </div>
  );
}
