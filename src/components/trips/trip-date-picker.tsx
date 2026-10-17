"use client";

import * as React from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface TripDatePickerProps {
  id: string;
  label?: string;
  value: string; // ISO format: YYYY-MM-DD
  onChange: (isoDate: string) => void;
  minDate?: string; // ISO format: YYYY-MM-DD
  error?: string;
  placeholder?: string;
}

const DAYS_OF_WEEK = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const MONTH_NAMES = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];

export function TripDatePicker({
  id,
  label,
  value,
  onChange,
  minDate,
  error,
  placeholder = "DD/MM/YYYY",
}: TripDatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Base date from value or fallback without calling new Date() during SSR
  const baseDate = React.useMemo(() => {
    if (value) {
      const parts = value.split("-");
      if (parts.length === 3) {
        return {
          year: parseInt(parts[0], 10),
          month: parseInt(parts[1], 10) - 1,
        };
      }
    }
    return { year: 2026, month: 9 };
  }, [value]);

  const [viewMonthState, setViewMonthState] = React.useState<{
    year: number;
    month: number;
  } | null>(null);

  const todayIso = React.useSyncExternalStore(
    () => () => {},
    () => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    },
    () => ""
  );

  const currentView = viewMonthState || baseDate;
  const viewYear = currentView.year;
  const viewMonth = currentView.month;

  const handleToggle = () => {
    if (!isOpen && !viewMonthState && !value) {
      const now = new Date();
      setViewMonthState({ year: now.getFullYear(), month: now.getMonth() });
    }
    setIsOpen((prev) => !prev);
  };

  // Click outside to close
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle Escape key to close
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Format value to display DD/MM/YYYY
  const displayFormatted = React.useMemo(() => {
    if (!value) return "";
    const parts = value.split("-");
    if (parts.length === 3) {
      return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`;
    }
    return value;
  }, [value]);

  // Navigation handlers
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewMonthState((prev) => {
      const curr = prev || baseDate;
      if (curr.month === 0) {
        return { year: curr.year - 1, month: 11 };
      }
      return { year: curr.year, month: curr.month - 1 };
    });
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewMonthState((prev) => {
      const curr = prev || baseDate;
      if (curr.month === 11) {
        return { year: curr.year + 1, month: 0 };
      }
      return { year: curr.year, month: curr.month + 1 };
    });
  };

  // Generate calendar grid
  const calendarDays = React.useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
    const lastDayOfMonth = new Date(viewYear, viewMonth + 1, 0);

    // In JS: 0 is Sunday. Convert so that Monday is 0, Sunday is 6
    let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startingDayOfWeek === -1) startingDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();

    // Days array
    const days: Array<{
      day: number;
      isCurrentMonth: boolean;
      isoString: string;
      isDisabled: boolean;
      isSelected: boolean;
      isToday: boolean;
    }> = [];

    // Previous month padding
    const prevMonthLastDay = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const pMonth = viewMonth === 0 ? 12 : viewMonth;
      const pYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const iso = `${pYear}-${String(pMonth).padStart(2, "0")}-${String(pDay).padStart(2, "0")}`;
      days.push({
        day: pDay,
        isCurrentMonth: false,
        isoString: iso,
        isDisabled: true,
        isSelected: false,
        isToday: false,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isDisabled = minDate ? iso < minDate : false;
      const isSelected = value === iso;
      const isToday = Boolean(todayIso) && todayIso === iso;

      days.push({
        day: d,
        isCurrentMonth: true,
        isoString: iso,
        isDisabled,
        isSelected,
        isToday,
      });
    }

    // Next month padding to fill grid (up to 35 or 42 cells)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let n = 1; n <= remaining; n++) {
      const nMonth = viewMonth === 11 ? 1 : viewMonth + 2;
      const nYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const iso = `${nYear}-${String(nMonth).padStart(2, "0")}-${String(n).padStart(2, "0")}`;
      days.push({
        day: n,
        isCurrentMonth: false,
        isoString: iso,
        isDisabled: true,
        isSelected: false,
        isToday: false,
      });
    }

    return days;
  }, [viewYear, viewMonth, value, minDate, todayIso]);

  const handleSelectDay = (isoString: string, isDisabled: boolean) => {
    if (isDisabled) return;
    onChange(isoString);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-yale-blue block mb-1.5">
          {label}
        </label>
      )}

      <div
        onClick={handleToggle}
        className={cn(
          "relative flex items-center w-full h-12 pl-10 pr-3 rounded-xl bg-white border border-border-hairline shadow-xs cursor-pointer select-none transition-all duration-150",
          "hover:border-cerulean/50 focus-within:ring-3 focus-within:ring-ocean-mist/30 focus-within:border-cerulean",
          isOpen && "border-cerulean ring-3 ring-ocean-mist/30",
          error && "border-functional-negative focus-within:border-functional-negative focus-within:ring-functional-negative/20"
        )}
      >
        <CalendarIcon className="absolute left-3.5 top-3.5 w-5 h-5 text-text-muted pointer-events-none" />
        <input
          id={id}
          type="text"
          readOnly
          value={displayFormatted}
          placeholder={placeholder}
          className="w-full bg-transparent text-yale-blue font-semibold text-sm outline-none cursor-pointer placeholder:text-text-muted/60 placeholder:font-normal"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
      </div>

      {error && (
        <p id={`${id}-error`} className="text-xs font-medium text-functional-negative mt-1" role="alert">
          {error}
        </p>
      )}

      {/* Calendar Dropdown Popover */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Chọn ngày trên lịch"
          className="absolute z-40 top-full left-0 mt-2 p-3 bg-white border border-border-hairline rounded-2xl shadow-[0_12px_32px_rgba(24,78,119,0.14)] w-[280px] sm:w-[290px] animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-bold text-yale-blue">
              {MONTH_NAMES[viewMonth]}, {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Tháng trước"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Tháng sau"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {DAYS_OF_WEEK.map((d) => (
              <span key={d} className="text-[11px] font-semibold text-text-muted/80 py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Day Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((item, idx) => {
              return (
                <button
                  key={`${item.isoString}-${idx}`}
                  type="button"
                  disabled={item.isDisabled}
                  onClick={() => handleSelectDay(item.isoString, item.isDisabled)}
                  className={cn(
                    "h-8 w-8 mx-auto text-xs rounded-lg flex items-center justify-center font-medium transition-all duration-150",
                    item.isCurrentMonth ? "text-yale-blue" : "text-text-muted/40",
                    item.isDisabled && "opacity-30 cursor-not-allowed pointer-events-none",
                    item.isSelected
                      ? "bg-cerulean text-white font-bold shadow-xs hover:bg-baltic-blue"
                      : "hover:bg-hover-row",
                    item.isToday && !item.isSelected && "ring-1.5 ring-emerald font-bold text-cerulean"
                  )}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Today button */}
          <div className="mt-3 pt-2.5 border-t border-border-hairline flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
                handleSelectDay(todayIso, false);
              }}
              className="font-semibold text-cerulean hover:underline cursor-pointer"
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-text-muted hover:text-yale-blue cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
