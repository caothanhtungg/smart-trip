import { describe, it, expect } from "vitest";
import {
  parse24HourTo12Hour,
  format12HourTo24Hour,
  format12HourDisplay,
  adjustTimeSegment,
} from "@/lib/itinerary/time-picker-utils";

describe("AdaptiveTimePicker Contract & Logic", () => {
  it("converts 24h initial props into 12h representation for display", () => {
    const time24 = "14:30";
    const parts = parse24HourTo12Hour(time24);
    expect(parts.hour).toBe(2);
    expect(parts.minute).toBe(30);
    expect(parts.period).toBe("PM");
    expect(format12HourDisplay(time24)).toBe("02:30 PM");
  });

  it("stores and emits canonical 24-hour time upon selection change", () => {
    // User chooses 11:45 PM on the wheel
    const newTime24 = format12HourTo24Hour(11, 45, "PM");
    expect(newTime24).toBe("23:45");

    // User chooses 12:15 AM
    const midnightTime24 = format12HourTo24Hour(12, 15, "AM");
    expect(midnightTime24).toBe("00:15");
  });

  it("handles empty or optional end time safely", () => {
    const parts = parse24HourTo12Hour("");
    expect(parts.hour).toBe(9);
    expect(parts.minute).toBe(0);
    expect(parts.period).toBe("AM");
  });

  it("supports dragging columns up and down to adjust time segments", () => {
    const initial = parse24HourTo12Hour("09:00");
    // Dragging down pulls earlier numbers into view (delta -1)
    const draggedDown = adjustTimeSegment(initial, "hour", -1);
    expect(draggedDown.hour).toBe(8);

    // Dragging up pushes later numbers into view (delta +1)
    const draggedUp = adjustTimeSegment(initial, "hour", 1);
    expect(draggedUp.hour).toBe(10);

    // Dragging minute up by 15 steps
    let minuteParts = initial;
    for (let i = 0; i < 15; i++) {
      minuteParts = adjustTimeSegment(minuteParts, "minute", 1);
    }
    expect(minuteParts.minute).toBe(15);
  });
});
