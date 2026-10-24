import { describe, it, expect } from "vitest";
import {
  CreateItineraryItemSchema,
  UpdateItineraryItemSchema,
  ItineraryQuerySchema,
  isValidCalendarDate,
  validateDateWithinTrip,
} from "./itinerary";

describe("Itinerary Validation Schemas & Helpers", () => {
  describe("isValidCalendarDate", () => {
    it("chấp nhận ngày lịch hợp lệ", () => {
      expect(isValidCalendarDate("2026-11-20")).toBe(true);
      expect(isValidCalendarDate("2024-02-29")).toBe(true); // Năm nhuận 2024
      expect(isValidCalendarDate("2026-02-28")).toBe(true);
    });

    it("từ chối ngày không tồn tại trên lịch", () => {
      expect(isValidCalendarDate("2026-02-29")).toBe(false); // 2026 không nhuận
      expect(isValidCalendarDate("2026-04-31")).toBe(false); // Tháng 4 chỉ 30 ngày
      expect(isValidCalendarDate("2026-13-01")).toBe(false);
      expect(isValidCalendarDate("2026-00-10")).toBe(false);
      expect(isValidCalendarDate("2026-05-32")).toBe(false);
      expect(isValidCalendarDate("invalid")).toBe(false);
    });
  });

  describe("validateDateWithinTrip", () => {
    const start = "2026-11-20";
    const end = "2026-11-22";

    it("trả về true khi ngày nằm trong khoảng chuyến đi", () => {
      expect(validateDateWithinTrip("2026-11-20", start, end)).toBe(true);
      expect(validateDateWithinTrip("2026-11-21", start, end)).toBe(true);
      expect(validateDateWithinTrip("2026-11-22", start, end)).toBe(true);
    });

    it("trả về false khi ngày nằm ngoài khoảng chuyến đi", () => {
      expect(validateDateWithinTrip("2026-11-19", start, end)).toBe(false);
      expect(validateDateWithinTrip("2026-11-23", start, end)).toBe(false);
    });

    it("hoạt động tốt với đối tượng Date", () => {
      const startDate = new Date("2026-11-20T00:00:00Z");
      const endDate = new Date("2026-11-22T00:00:00Z");
      expect(validateDateWithinTrip("2026-11-21", startDate, endDate)).toBe(true);
      expect(validateDateWithinTrip("2026-11-25", startDate, endDate)).toBe(false);
    });
  });

  describe("CreateItineraryItemSchema", () => {
    const validPayload = {
      placeName: "Quán Cà phê Mê Linh",
      dayDate: "2026-11-20",
      address: "Tà Nung, Đà Lạt",
      note: "Ngắm đồi chè",
      startTime: "08:30",
      endTime: "10:30",
      sortOrder: 1,
    };

    it("chấp nhận payload hợp lệ đầy đủ", () => {
      const result = CreateItineraryItemSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.placeName).toBe("Quán Cà phê Mê Linh");
        expect(result.data.startTime).toBe("08:30");
        expect(result.data.endTime).toBe("10:30");
      }
    });

    it("chấp nhận payload không có endTime, address, note, sortOrder", () => {
      const minimalPayload = {
        placeName: "Thung lũng Tình Yêu",
        dayDate: "2026-11-21",
        startTime: "14:00",
      };
      const result = CreateItineraryItemSchema.safeParse(minimalPayload);
      expect(result.success).toBe(true);
    });

    it("từ chối tên địa điểm để trống hoặc quá 200 ký tự", () => {
      const emptyName = { ...validPayload, placeName: "   " };
      expect(CreateItineraryItemSchema.safeParse(emptyName).success).toBe(false);

      const tooLongName = { ...validPayload, placeName: "A".repeat(201) };
      expect(CreateItineraryItemSchema.safeParse(tooLongName).success).toBe(false);
    });

    it("từ chối ngày sai định dạng hoặc ngày lịch không hợp lệ", () => {
      const badFormat = { ...validPayload, dayDate: "20/11/2026" };
      expect(CreateItineraryItemSchema.safeParse(badFormat).success).toBe(false);

      const invalidCalendar = { ...validPayload, dayDate: "2026-02-30" };
      expect(CreateItineraryItemSchema.safeParse(invalidCalendar).success).toBe(false);
    });

    it("từ chối giờ bắt đầu sai định dạng", () => {
      const badTime = { ...validPayload, startTime: "8:30" }; // Thiếu số 0 đầu
      expect(CreateItineraryItemSchema.safeParse(badTime).success).toBe(false);

      const outOfRangeTime = { ...validPayload, startTime: "24:00" };
      expect(CreateItineraryItemSchema.safeParse(outOfRangeTime).success).toBe(false);
    });

    it("từ chối endTime < startTime", () => {
      const invalidRange = { ...validPayload, startTime: "14:00", endTime: "13:30" };
      const result = CreateItineraryItemSchema.safeParse(invalidRange);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Giờ kết thúc không thể trước giờ bắt đầu.");
      }
    });

    it("chấp nhận endTime === startTime", () => {
      const sameTime = { ...validPayload, startTime: "14:00", endTime: "14:00" };
      expect(CreateItineraryItemSchema.safeParse(sameTime).success).toBe(true);
    });

    it("từ chối các trường bị tiêm trái phép (strict)", () => {
      const injected = {
        ...validPayload,
        tripId: "123e4567-e89b-12d3-a456-426614174000",
        createdByMemberId: "123e4567-e89b-12d3-a456-426614174001",
        userId: "test-user",
        id: "injected-id",
      };
      const result = CreateItineraryItemSchema.safeParse(injected);
      expect(result.success).toBe(false);
    });
  });

  describe("UpdateItineraryItemSchema", () => {
    it("chấp nhận cập nhật một trường", () => {
      const result = UpdateItineraryItemSchema.safeParse({ placeName: "Địa điểm mới" });
      expect(result.success).toBe(true);
    });

    it("từ chối payload rỗng", () => {
      const result = UpdateItineraryItemSchema.safeParse({});
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Vui lòng cung cấp ít nhất một trường cần cập nhật.");
      }
    });

    it("từ chối payload khi cả startTime và endTime cùng được truyền và endTime < startTime", () => {
      const result = UpdateItineraryItemSchema.safeParse({
        startTime: "16:00",
        endTime: "15:00",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Giờ kết thúc không thể trước giờ bắt đầu.");
      }
    });

    it("từ chối trường lạ không được phép chỉnh sửa", () => {
      const result = UpdateItineraryItemSchema.safeParse({
        placeName: "Tên hợp lệ",
        tripId: "bị tiêm",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ItineraryQuerySchema", () => {
    it("chấp nhận query rỗng", () => {
      const result = ItineraryQuerySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("chấp nhận dayDate hợp lệ", () => {
      const result = ItineraryQuerySchema.safeParse({ dayDate: "2026-11-20" });
      expect(result.success).toBe(true);
    });

    it("từ chối dayDate không hợp lệ", () => {
      expect(ItineraryQuerySchema.safeParse({ dayDate: "2026-02-30" }).success).toBe(false);
      expect(ItineraryQuerySchema.safeParse({ dayDate: "abc" }).success).toBe(false);
    });
  });
});
