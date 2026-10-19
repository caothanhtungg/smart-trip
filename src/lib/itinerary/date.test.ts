import { describe, it, expect } from "vitest";
import {
  generateTripDays,
  timeStringToMinutes,
  minutesToTimeString,
  calculateDurationMinutes,
  formatDurationHuman,
  classifyTimeOfDay,
  getTimeOfDayColorClasses,
} from "./date";

describe("Itinerary Date Helpers", () => {
  describe("generateTripDays", () => {
    it("sinh đúng danh sách 3 ngày cho chuyến đi Đà Lạt (2026-11-20 -> 2026-11-22)", () => {
      const days = generateTripDays("2026-11-20", "2026-11-22");
      expect(days).toHaveLength(3);

      expect(days[0].dayIndex).toBe(1);
      expect(days[0].dateString).toBe("2026-11-20");
      expect(days[0].dayLabel).toBe("Ngày 1");
      expect(days[0].shortDateText).toBe("20/11");
      expect(days[0].dayOfWeekShort).toBe("T6");
      expect(days[0].fullFormattedText).toBe("Ngày 1 · T6 20/11");

      expect(days[1].dayIndex).toBe(2);
      expect(days[1].dateString).toBe("2026-11-21");
      expect(days[1].shortDateText).toBe("21/11");
      expect(days[1].dayOfWeekShort).toBe("T7");

      expect(days[2].dayIndex).toBe(3);
      expect(days[2].dateString).toBe("2026-11-22");
      expect(days[2].shortDateText).toBe("22/11");
      expect(days[2].dayOfWeekShort).toBe("CN");
    });

    it("xử lý chuyến đi 1 ngày (startDate === endDate)", () => {
      const days = generateTripDays("2026-05-01", "2026-05-01");
      expect(days).toHaveLength(1);
      expect(days[0].dayIndex).toBe(1);
      expect(days[0].dateString).toBe("2026-05-01");
      expect(days[0].dayLabel).toBe("Ngày 1");
    });

    it("xử lý chuyến đi vắt qua tháng (30/11 -> 02/12)", () => {
      const days = generateTripDays("2026-11-30", "2026-12-02");
      expect(days).toHaveLength(3);
      expect(days[0].shortDateText).toBe("30/11");
      expect(days[1].shortDateText).toBe("01/12");
      expect(days[2].shortDateText).toBe("02/12");
    });

    it("trả về mảng rỗng nếu ngày không hợp lệ hoặc startDate > endDate", () => {
      expect(generateTripDays("2026-11-25", "2026-11-20")).toEqual([]);
      expect(generateTripDays("", "2026-11-20")).toEqual([]);
      expect(generateTripDays("invalid-date", "2026-11-20")).toEqual([]);
    });
  });

  describe("timeStringToMinutes & minutesToTimeString", () => {
    it("chuyển đổi chuỗi giờ thành số phút chính xác", () => {
      expect(timeStringToMinutes("00:00")).toBe(0);
      expect(timeStringToMinutes("08:30")).toBe(8 * 60 + 30);
      expect(timeStringToMinutes("14:15")).toBe(14 * 60 + 15);
      expect(timeStringToMinutes("23:59")).toBe(23 * 60 + 59);
    });

    it("trả về null với chuỗi không đúng định dạng", () => {
      expect(timeStringToMinutes("")).toBeNull();
      expect(timeStringToMinutes("25:00")).toBeNull();
      expect(timeStringToMinutes("12:60")).toBeNull();
      expect(timeStringToMinutes("abc")).toBeNull();
    });

    it("chuyển số phút thành chuỗi giờ chuẩn 24h", () => {
      expect(minutesToTimeString(0)).toBe("00:00");
      expect(minutesToTimeString(510)).toBe("08:30");
      expect(minutesToTimeString(855)).toBe("14:15");
    });
  });

  describe("calculateDurationMinutes & formatDurationHuman", () => {
    it("tính đúng thời lượng giữa giờ bắt đầu và kết thúc", () => {
      expect(calculateDurationMinutes("08:00", "10:00")).toBe(120);
      expect(calculateDurationMinutes("14:00", "15:30")).toBe(90);
      expect(calculateDurationMinutes("10:00", "10:45")).toBe(45);
    });

    it("trả về null nếu endTime nhỏ hơn startTime", () => {
      expect(calculateDurationMinutes("15:00", "14:00")).toBeNull();
    });

    it("định dạng thời lượng tiếng Việt rõ ràng", () => {
      expect(formatDurationHuman(120)).toBe("2 giờ");
      expect(formatDurationHuman(90)).toBe("1 giờ 30 phút");
      expect(formatDurationHuman(45)).toBe("45 phút");
      expect(formatDurationHuman(0)).toBe("0 phút");
    });
  });

  describe("classifyTimeOfDay", () => {
    it("phân loại đúng 4 buổi trong ngày", () => {
      expect(classifyTimeOfDay("08:00")).toBe("Sáng");
      expect(classifyTimeOfDay("10:30")).toBe("Sáng");
      expect(classifyTimeOfDay("11:00")).toBe("Trưa");
      expect(classifyTimeOfDay("13:30")).toBe("Trưa");
      expect(classifyTimeOfDay("14:00")).toBe("Chiều");
      expect(classifyTimeOfDay("17:45")).toBe("Chiều");
      expect(classifyTimeOfDay("18:00")).toBe("Tối");
      expect(classifyTimeOfDay("22:30")).toBe("Tối");
      expect(classifyTimeOfDay("02:00")).toBe("Tối");
    });

    it("trả về lớp màu tương ứng", () => {
      expect(getTimeOfDayColorClasses("Sáng").text).toBe("text-cerulean");
      expect(getTimeOfDayColorClasses("Trưa").text).toBe("text-functional-warning");
      expect(getTimeOfDayColorClasses("Chiều").text).toBe("text-tropical-teal");
      expect(getTimeOfDayColorClasses("Tối").text).toBe("text-yale-blue");
    });
  });
});
