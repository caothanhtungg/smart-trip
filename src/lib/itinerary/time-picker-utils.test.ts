import { describe, it, expect } from "vitest";
import {
  parse24HourTo12Hour,
  format12HourTo24Hour,
  format12HourDisplay,
  adjustTimeSegment,
} from "./time-picker-utils";

describe("Time Picker Utilities (24h <-> 12h conversion)", () => {
  describe("parse24HourTo12Hour", () => {
    it("converts midnight 00:00 to 12:00 AM", () => {
      const res = parse24HourTo12Hour("00:00");
      expect(res).toEqual({ hour: 12, minute: 0, period: "AM" });
    });

    it("converts morning 09:15 to 09:15 AM", () => {
      const res = parse24HourTo12Hour("09:15");
      expect(res).toEqual({ hour: 9, minute: 15, period: "AM" });
    });

    it("converts noon 12:00 to 12:00 PM", () => {
      const res = parse24HourTo12Hour("12:00");
      expect(res).toEqual({ hour: 12, minute: 0, period: "PM" });
    });

    it("converts afternoon 14:30 to 02:30 PM", () => {
      const res = parse24HourTo12Hour("14:30");
      expect(res).toEqual({ hour: 2, minute: 30, period: "PM" });
    });

    it("converts late night 23:59 to 11:59 PM", () => {
      const res = parse24HourTo12Hour("23:59");
      expect(res).toEqual({ hour: 11, minute: 59, period: "PM" });
    });

    it("handles invalid or empty inputs gracefully with fallback to 09:00 AM", () => {
      const res = parse24HourTo12Hour("");
      expect(res).toEqual({ hour: 9, minute: 0, period: "AM" });
    });
  });

  describe("format12HourTo24Hour", () => {
    it("converts 12:00 AM to 00:00", () => {
      expect(format12HourTo24Hour(12, 0, "AM")).toBe("00:00");
    });

    it("converts 09:05 AM to 09:05", () => {
      expect(format12HourTo24Hour(9, 5, "AM")).toBe("09:05");
    });

    it("converts 12:00 PM to 12:00", () => {
      expect(format12HourTo24Hour(12, 0, "PM")).toBe("12:00");
    });

    it("converts 02:30 PM to 14:30", () => {
      expect(format12HourTo24Hour(2, 30, "PM")).toBe("14:30");
    });

    it("converts 11:45 PM to 23:45", () => {
      expect(format12HourTo24Hour(11, 45, "PM")).toBe("23:45");
    });
  });

  describe("format12HourDisplay", () => {
    it("formats 24-hour string into standard 12-hour display string", () => {
      expect(format12HourDisplay("09:05")).toBe("09:05 AM");
      expect(format12HourDisplay("14:30")).toBe("02:30 PM");
      expect(format12HourDisplay("00:00")).toBe("12:00 AM");
      expect(format12HourDisplay("12:00")).toBe("12:00 PM");
    });
  });

  describe("adjustTimeSegment", () => {
    it("increments and decrements hour with 1-12 wrap-around", () => {
      expect(adjustTimeSegment({ hour: 11, minute: 0, period: "AM" }, "hour", 1).hour).toBe(12);
      expect(adjustTimeSegment({ hour: 12, minute: 0, period: "AM" }, "hour", 1).hour).toBe(1);
      expect(adjustTimeSegment({ hour: 1, minute: 0, period: "AM" }, "hour", -1).hour).toBe(12);
    });

    it("increments and decrements minute with 0-59 wrap-around", () => {
      expect(adjustTimeSegment({ hour: 10, minute: 58, period: "AM" }, "minute", 1).minute).toBe(59);
      expect(adjustTimeSegment({ hour: 10, minute: 59, period: "AM" }, "minute", 1).minute).toBe(0);
      expect(adjustTimeSegment({ hour: 10, minute: 0, period: "AM" }, "minute", -1).minute).toBe(59);
    });

    it("toggles period between AM and PM", () => {
      expect(adjustTimeSegment({ hour: 10, minute: 0, period: "AM" }, "period", 1).period).toBe("PM");
      expect(adjustTimeSegment({ hour: 10, minute: 0, period: "PM" }, "period", 1).period).toBe("AM");
    });
  });
});

