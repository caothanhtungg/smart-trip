"use client";

import * as React from "react";
import { Clock, ChevronUp, ChevronDown, Check } from "lucide-react";
import {
  parse24HourTo12Hour,
  format12HourTo24Hour,
  adjustTimeSegment,
  Time12HourParts,
  TimePeriod,
  TimeSegmentType,
} from "@/lib/itinerary/time-picker-utils";

export interface AdaptiveTimePickerProps {
  id?: string;
  value: string; // 24-hour HH:mm, e.g. "09:00" or "14:30"
  onChange: (value24h: string) => void;
  disabled?: boolean;
  className?: string;
  hasError?: boolean;
  placeholder?: string;
  align?: "left" | "right";
}

// Hook for smooth mouse / pointer drag-to-scroll on wheel columns
function useColumnPointerDrag(onStep: (delta: number) => void, stepPixels: number = 18) {
  const isDraggingRef = React.useRef(false);
  const startYRef = React.useRef(0);
  const dragAccumulatorRef = React.useRef(0);
  const hasMovedRef = React.useRef(false);

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      isDraggingRef.current = true;
      startYRef.current = e.clientY;
      dragAccumulatorRef.current = 0;
      hasMovedRef.current = false;
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Fallback if not supported
      }
    },
    []
  );

  const onPointerMove = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current) return;
      const diff = e.clientY - startYRef.current;
      startYRef.current = e.clientY;
      dragAccumulatorRef.current += diff;

      if (Math.abs(diff) > 2) {
        hasMovedRef.current = true;
      }

      // Dragging down (diff > 0): pulls earlier numbers down (delta = -1)
      // Dragging up (diff < 0): pushes later numbers up (delta = +1)
      while (dragAccumulatorRef.current >= stepPixels) {
        onStep(-1);
        dragAccumulatorRef.current -= stepPixels;
      }
      while (dragAccumulatorRef.current <= -stepPixels) {
        onStep(1);
        dragAccumulatorRef.current += stepPixels;
      }
    },
    [onStep, stepPixels]
  );

  const onPointerUp = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      isDraggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Fallback
      }
    },
    []
  );

  return {
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
    hasMovedRef,
  };
}

export function AdaptiveTimePicker({
  id,
  value,
  onChange,
  disabled = false,
  className = "",
  hasError = false,
  align = "left",
}: AdaptiveTimePickerProps) {
  const parts = React.useMemo(() => parse24HourTo12Hour(value), [value]);

  const [isOpen, setIsOpen] = React.useState(false);
  const [activeSegment, setActiveSegment] = React.useState<TimeSegmentType>("hour");

  const containerRef = React.useRef<HTMLDivElement>(null);
  const hourSegmentRef = React.useRef<HTMLSpanElement>(null);
  const minuteSegmentRef = React.useRef<HTMLSpanElement>(null);
  const periodSegmentRef = React.useRef<HTMLSpanElement>(null);

  // Close popover on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
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

  // Close on Escape key
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Update value helper
  const updateParts = React.useCallback(
    (newParts: Time12HourParts) => {
      const time24 = format12HourTo24Hour(
        newParts.hour,
        newParts.minute,
        newParts.period
      );
      onChange(time24);
    },
    [onChange]
  );

  // Keyboard navigation for segments
  function handleSegmentKeyDown(
    e: React.KeyboardEvent,
    segment: TimeSegmentType
  ) {
    if (disabled) return;

    if (e.key === "ArrowUp") {
      e.preventDefault();
      const next = adjustTimeSegment(parts, segment, 1);
      updateParts(next);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = adjustTimeSegment(parts, segment, -1);
      updateParts(next);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (segment === "hour") {
        minuteSegmentRef.current?.focus();
        setActiveSegment("minute");
      } else if (segment === "minute") {
        periodSegmentRef.current?.focus();
        setActiveSegment("period");
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (segment === "period") {
        minuteSegmentRef.current?.focus();
        setActiveSegment("minute");
      } else if (segment === "minute") {
        hourSegmentRef.current?.focus();
        setActiveSegment("hour");
      }
    } else if (segment === "period") {
      if (e.key.toLowerCase() === "a") {
        e.preventDefault();
        updateParts({ ...parts, period: "AM" });
      } else if (e.key.toLowerCase() === "p") {
        e.preventDefault();
        updateParts({ ...parts, period: "PM" });
      }
    } else if (!isNaN(Number(e.key))) {
      // Direct numeric input
      const digit = Number(e.key);
      if (segment === "hour") {
        if (digit >= 1 && digit <= 9) {
          updateParts({ ...parts, hour: digit });
          minuteSegmentRef.current?.focus();
          setActiveSegment("minute");
        }
      } else if (segment === "minute") {
        const newMinute = (parts.minute % 10) * 10 + digit;
        updateParts({ ...parts, minute: Math.min(59, newMinute) });
      }
    }
  }

  // Pointer drag hooks for each column
  const hourDrag = useColumnPointerDrag((delta) => {
    updateParts(adjustTimeSegment(parts, "hour", delta));
  }, 18);

  const minuteDrag = useColumnPointerDrag((delta) => {
    updateParts(adjustTimeSegment(parts, "minute", delta));
  }, 18);

  const periodDrag = useColumnPointerDrag(() => {
    updateParts({
      ...parts,
      period: parts.period === "AM" ? "PM" : "AM",
    });
  }, 24);

  // Wheel Column Helpers: 5 rows (2 above, 1 selected, 2 below)
  const getHourRows = () => {
    const list = [];
    for (let offset = -2; offset <= 2; offset++) {
      let h = parts.hour + offset;
      while (h > 12) h -= 12;
      while (h < 1) h += 12;
      list.push({ value: h, offset });
    }
    return list;
  };

  const getMinuteRows = () => {
    const list = [];
    for (let offset = -2; offset <= 2; offset++) {
      let m = parts.minute + offset;
      while (m > 59) m -= 60;
      while (m < 0) m += 60;
      list.push({ value: m, offset });
    }
    return list;
  };

  const getPeriodRows = () => {
    const isAM = parts.period === "AM";
    return [
      { value: isAM ? "PM" : "AM", isSelected: false, offset: -1 },
      { value: parts.period, isSelected: true, offset: 0 },
      { value: isAM ? "PM" : "AM", isSelected: false, offset: 1 },
    ];
  };

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      {/* WEB SEGMENTED TIME INPUT FIELD */}
      <div
        id={id}
        tabIndex={disabled ? -1 : 0}
        onFocus={() => {
          if (!disabled) hourSegmentRef.current?.focus();
        }}
        className={`w-full h-10 px-2.5 rounded-xl border flex items-center justify-between text-xs sm:text-sm transition-all select-none cursor-pointer ${
          hasError
            ? "border-functional-negative bg-red-50/50"
            : isOpen
            ? "border-cerulean ring-2 ring-cerulean/20 bg-white"
            : "border-divider-border bg-bg-canvas/30 hover:bg-white hover:border-cerulean/40"
        } ${disabled ? "opacity-50 pointer-events-none" : ""} ${className}`}
      >
        <div className="flex items-center gap-1 min-w-0">
          <Clock
            onClick={() => setIsOpen(!isOpen)}
            className="w-3.5 h-3.5 text-cerulean mr-1 shrink-0 hover:scale-110 transition-transform"
          />

          {/* Time digits container */}
          <div className="flex items-center font-mono font-semibold text-slate-800">
            {/* Hour Segment */}
            <span
              ref={hourSegmentRef}
              tabIndex={0}
              role="spinbutton"
              aria-label="Giờ"
              aria-valuenow={parts.hour}
              aria-valuemin={1}
              aria-valuemax={12}
              onFocus={() => setActiveSegment("hour")}
              onKeyDown={(e) => handleSegmentKeyDown(e, "hour")}
              onClick={(e) => {
                e.stopPropagation();
                setActiveSegment("hour");
                setIsOpen(true);
              }}
              className={`px-1 py-0.5 rounded transition-colors focus:outline-none ${
                activeSegment === "hour" && isOpen
                  ? "bg-cerulean/15 text-cerulean font-bold"
                  : "text-yale-blue hover:bg-slate-100"
              }`}
            >
              {String(parts.hour).padStart(2, "0")}
            </span>

            <span className="text-slate-400 font-bold px-0.5">:</span>

            {/* Minute Segment */}
            <span
              ref={minuteSegmentRef}
              tabIndex={0}
              role="spinbutton"
              aria-label="Phút"
              aria-valuenow={parts.minute}
              aria-valuemin={0}
              aria-valuemax={59}
              onFocus={() => setActiveSegment("minute")}
              onKeyDown={(e) => handleSegmentKeyDown(e, "minute")}
              onClick={(e) => {
                e.stopPropagation();
                setActiveSegment("minute");
                setIsOpen(true);
              }}
              className={`px-1 py-0.5 rounded transition-colors focus:outline-none ${
                activeSegment === "minute" && isOpen
                  ? "bg-cerulean/15 text-cerulean font-bold"
                  : "text-yale-blue hover:bg-slate-100"
              }`}
            >
              {String(parts.minute).padStart(2, "0")}
            </span>
          </div>

          {/* AM / PM Period Segment */}
          <span
            ref={periodSegmentRef}
            tabIndex={0}
            role="button"
            aria-label="Buổi sáng hoặc chiều"
            onFocus={() => setActiveSegment("period")}
            onKeyDown={(e) => handleSegmentKeyDown(e, "period")}
            onClick={(e) => {
              e.stopPropagation();
              setActiveSegment("period");
              setIsOpen(true);
            }}
            className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-bold tracking-wider transition-colors focus:outline-none shrink-0 ${
              activeSegment === "period" && isOpen
                ? "bg-cerulean text-white"
                : "bg-surface-card border border-divider-border text-cerulean hover:bg-slate-100"
            }`}
          >
            {parts.period}
          </span>
        </div>

        {/* Small Toggle Arrow Indicator */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Đóng bộ chọn giờ" : "Mở bộ chọn giờ"}
          className="text-text-muted hover:text-cerulean transition-colors p-0.5 ml-1 shrink-0"
        >
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* iOS STYLE WHEEL PICKER DROPDOWN / POPOVER WITH MOUSE DRAG */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Bộ chọn giờ bánh xe iOS"
          className={`absolute z-50 mt-1.5 ${
            align === "right" ? "right-0" : "left-0"
          } w-[215px] bg-white rounded-2xl shadow-[0_12px_32px_rgba(24,78,119,0.18)] border border-slate-200/90 p-2.5 flex flex-col items-center animate-in fade-in zoom-in-95 duration-150 select-none touch-none`}
        >
          {/* Wheel Frame */}
          <div className="relative w-full h-[150px] flex items-center justify-around overflow-hidden">
            {/* Gray Selection Band (matches iOS mockup) */}
            <div
              className="absolute left-1 right-1 h-9 rounded-xl bg-slate-100 border border-slate-200/80 pointer-events-none z-0"
              style={{ top: "calc(50% - 18px)" }}
            />

            {/* COLUMN 1: HOURS (1 to 12) - Supports Mouse Drag, Scroll & Tap */}
            <div
              className="relative z-10 flex-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none py-1"
              {...hourDrag.handlers}
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 1 : -1;
                updateParts(adjustTimeSegment(parts, "hour", delta));
              }}
            >
              {getHourRows().map(({ value: h, offset }) => {
                const isSelected = offset === 0;
                return (
                  <div
                    key={`h-${offset}-${h}`}
                    onClick={() => {
                      if (!hourDrag.hasMovedRef.current) {
                        updateParts({ ...parts, hour: h });
                      }
                    }}
                    className={`h-7 sm:h-8 flex items-center justify-center font-mono transition-all duration-150 ${
                      isSelected
                        ? "text-slate-900 font-extrabold text-base sm:text-lg scale-105"
                        : Math.abs(offset) === 1
                        ? "text-slate-600 font-medium text-xs sm:text-sm opacity-70"
                        : "text-slate-300 font-normal text-[11px] opacity-35"
                    }`}
                  >
                    {String(h).padStart(2, "0")}
                  </div>
                );
              })}
            </div>

            {/* COLUMN 2: MINUTES (00 to 59) - Supports Mouse Drag, Scroll & Tap */}
            <div
              className="relative z-10 flex-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none py-1"
              {...minuteDrag.handlers}
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? 1 : -1;
                updateParts(adjustTimeSegment(parts, "minute", delta));
              }}
            >
              {getMinuteRows().map(({ value: m, offset }) => {
                const isSelected = offset === 0;
                return (
                  <div
                    key={`m-${offset}-${m}`}
                    onClick={() => {
                      if (!minuteDrag.hasMovedRef.current) {
                        updateParts({ ...parts, minute: m });
                      }
                    }}
                    className={`h-7 sm:h-8 flex items-center justify-center font-mono transition-all duration-150 ${
                      isSelected
                        ? "text-slate-900 font-extrabold text-base sm:text-lg scale-105"
                        : Math.abs(offset) === 1
                        ? "text-slate-600 font-medium text-xs sm:text-sm opacity-70"
                        : "text-slate-300 font-normal text-[11px] opacity-35"
                    }`}
                  >
                    {String(m).padStart(2, "0")}
                  </div>
                );
              })}
            </div>

            {/* COLUMN 3: AM / PM - Supports Mouse Drag, Scroll & Tap */}
            <div
              className="relative z-10 flex-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none py-1"
              {...periodDrag.handlers}
              onWheel={(e) => {
                e.preventDefault();
                updateParts({
                  ...parts,
                  period: parts.period === "AM" ? "PM" : "AM",
                });
              }}
            >
              {getPeriodRows().map(({ value: p, isSelected, offset }) => (
                <div
                  key={`p-${offset}-${p}`}
                  onClick={() => {
                    if (!periodDrag.hasMovedRef.current) {
                      updateParts({ ...parts, period: p as TimePeriod });
                    }
                  }}
                  className={`h-7 sm:h-8 flex items-center justify-center font-bold tracking-wider transition-all duration-150 ${
                    isSelected
                      ? "text-slate-900 font-extrabold text-sm sm:text-base scale-105"
                      : Math.abs(offset) === 1
                      ? "text-slate-600 font-medium text-xs opacity-70"
                      : "text-slate-300 font-normal text-[10px] opacity-35"
                  }`}
                >
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Bar: Done button & Hint */}
          <div className="w-full mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-text-muted font-medium">
              Kéo chuột, cuộn hoặc chạm
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2 py-0.5 rounded-lg text-xs font-bold text-cerulean hover:bg-cerulean/10 transition-colors flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              <span>Xong</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
