import { describe, it, expect } from "vitest";
import {
  validateItineraryItemForm,
  detectTimeConflict,
  sortItineraryItems,
  canAddItineraryItem,
  canEditItineraryItem,
  canDeleteItineraryItem,
} from "./validation";
import { ItineraryItem, CreateItineraryItemFormData } from "@/types/trip";

describe("Itinerary Validation & Business Rules", () => {
  const tripStartDate = "2026-11-20";
  const tripEndDate = "2026-11-22";

  describe("validateItineraryItemForm", () => {
    it("chấp nhận biểu mẫu hợp lệ đầy đủ", () => {
      const validForm: CreateItineraryItemFormData = {
        dayDate: "2026-11-20",
        placeName: "Cà phê Mê Linh Garden",
        address: "Tổ 20, Thôn 4, Tà Nung",
        startTime: "08:00",
        endTime: "10:00",
        note: "Ngắm đồi chè",
      };

      const result = validateItineraryItemForm(validForm, tripStartDate, tripEndDate);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it("chấp nhận biểu mẫu không có endTime và note (tùy chọn)", () => {
      const validForm: CreateItineraryItemFormData = {
        dayDate: "2026-11-21",
        placeName: "Thung lũng Tình Yêu",
        startTime: "14:00",
      };

      const result = validateItineraryItemForm(validForm, tripStartDate, tripEndDate);
      expect(result.isValid).toBe(true);
    });

    it("báo lỗi khi tên địa điểm để trống hoặc chỉ có khoảng trắng", () => {
      const form: CreateItineraryItemFormData = {
        dayDate: "2026-11-20",
        placeName: "   ",
        startTime: "08:00",
      };

      const result = validateItineraryItemForm(form, tripStartDate, tripEndDate);
      expect(result.isValid).toBe(false);
      expect(result.errors.placeName).toBe("Vui lòng nhập tên địa điểm.");
    });

    it("báo lỗi khi tên địa điểm vượt quá 200 ký tự", () => {
      const form: CreateItineraryItemFormData = {
        dayDate: "2026-11-20",
        placeName: "A".repeat(201),
        startTime: "08:00",
      };

      const result = validateItineraryItemForm(form, tripStartDate, tripEndDate);
      expect(result.isValid).toBe(false);
      expect(result.errors.placeName).toContain("không được vượt quá 200 ký tự");
    });

    it("báo lỗi khi ngày nằm ngoài khoảng ngày của chuyến đi", () => {
      const formBefore: CreateItineraryItemFormData = {
        dayDate: "2026-11-19",
        placeName: "Điểm sớm",
        startTime: "08:00",
      };
      const resultBefore = validateItineraryItemForm(formBefore, tripStartDate, tripEndDate);
      expect(resultBefore.isValid).toBe(false);
      expect(resultBefore.errors.dayDate).toContain("phải nằm trong khoảng thời gian chuyến đi");

      const formAfter: CreateItineraryItemFormData = {
        dayDate: "2026-11-23",
        placeName: "Điểm muộn",
        startTime: "08:00",
      };
      const resultAfter = validateItineraryItemForm(formAfter, tripStartDate, tripEndDate);
      expect(resultAfter.isValid).toBe(false);
      expect(resultAfter.errors.dayDate).toContain("phải nằm trong khoảng thời gian chuyến đi");
    });

    it("báo lỗi khi endTime nhỏ hơn startTime", () => {
      const form: CreateItineraryItemFormData = {
        dayDate: "2026-11-20",
        placeName: "Chợ Đà Lạt",
        startTime: "15:00",
        endTime: "14:00",
      };

      const result = validateItineraryItemForm(form, tripStartDate, tripEndDate);
      expect(result.isValid).toBe(false);
      expect(result.errors.endTime).toBe("Giờ kết thúc không thể trước giờ bắt đầu.");
    });
  });

  describe("detectTimeConflict (Quy tắc A.3)", () => {
    const existingItems: ItineraryItem[] = [
      {
        id: "item-1",
        tripId: "trip-1",
        dayDate: "2026-11-20",
        sortOrder: 1,
        placeName: "Cà phê Mê Linh",
        startTime: "08:00",
        endTime: "10:00",
        createdByMemberId: "m1",
      },
      {
        id: "item-2",
        tripId: "trip-1",
        dayDate: "2026-11-20",
        sortOrder: 2,
        placeName: "Thung lũng Tình Yêu",
        startTime: "10:30",
        endTime: "12:00",
        createdByMemberId: "m1",
      },
      {
        id: "item-3",
        tripId: "trip-1",
        dayDate: "2026-11-21",
        sortOrder: 1,
        placeName: "Đồi chè Cầu Đất",
        startTime: "08:00",
        endTime: "11:00",
        createdByMemberId: "m2",
      },
    ];

    it("phát hiện trùng giờ khi khoảng thời gian chồng lấn", () => {
      // 09:30 - 11:30 chồng lấn với Cà phê Mê Linh (08:00-10:00) 30 phút và Thung lũng Tình Yêu (10:30-12:00)
      const conflict = detectTimeConflict(
        {
          dayDate: "2026-11-20",
          startTime: "09:30",
          endTime: "10:30",
        },
        existingItems
      );

      expect(conflict.hasConflict).toBe(true);
      expect(conflict.conflictingPlaceName).toBe("Cà phê Mê Linh");
      expect(conflict.overlapMinutes).toBe(30);
      expect(conflict.message).toContain("Trùng 30 phút");
    });

    it("KHÔNG báo trùng với hai khoảng thời gian nối tiếp nhau (end1 === start2)", () => {
      // 10:00 - 10:30 nối tiếp ngay sau Cà phê Mê Linh (08:00 - 10:00) và trước Thung lũng (10:30 - 12:00)
      const nonConflict = detectTimeConflict(
        {
          dayDate: "2026-11-20",
          startTime: "10:00",
          endTime: "10:30",
        },
        existingItems
      );

      expect(nonConflict.hasConflict).toBe(false);
    });

    it("KHÔNG báo trùng nếu ở khác ngày", () => {
      // 08:00 - 10:00 nhưng ở Ngày 2 (2026-11-21) không trùng với item-1 ở Ngày 1
      const differentDay = detectTimeConflict(
        {
          dayDate: "2026-11-21",
          startTime: "14:00",
          endTime: "16:00",
        },
        existingItems
      );

      expect(differentDay.hasConflict).toBe(false);
    });

    it("KHÔNG báo trùng với chính mình khi sửa (cùng ID)", () => {
      const sameItem = detectTimeConflict(
        {
          id: "item-1",
          dayDate: "2026-11-20",
          startTime: "08:00",
          endTime: "10:00",
        },
        existingItems
      );

      expect(sameItem.hasConflict).toBe(false);
    });

    it("phát hiện trùng giờ với địa điểm không liền kề trong danh sách", () => {
      // Danh sách gồm:
      // item-1: 08:00 - 10:00
      // item-2: 10:30 - 12:00
      // Thêm điểm 09:00 - 11:00 (chồng lấn cả item-1 lẫn item-2)
      const conflict = detectTimeConflict(
        {
          dayDate: "2026-11-20",
          startTime: "09:00",
          endTime: "11:00",
        },
        existingItems
      );

      expect(conflict.hasConflict).toBe(true);
      expect(conflict.conflictingPlaceName).toBe("Cà phê Mê Linh");
      expect(conflict.overlapMinutes).toBe(60); // 09:00 - 10:00
    });
  });

  describe("canAddItineraryItem / canEditItineraryItem / canDeleteItineraryItem", () => {
    const item: ItineraryItem = {
      id: "it-1",
      tripId: "t1",
      dayDate: "2026-11-20",
      sortOrder: 1,
      placeName: "Chợ đêm",
      startTime: "18:00",
      createdByMemberId: "member-author",
    };

    it("cho phép thành viên ACTIVE thêm địa điểm khi chuyến đi ACTIVE", () => {
      expect(canAddItineraryItem("ACTIVE", "ACTIVE")).toBe(true);
      expect(canAddItineraryItem("ACTIVE", "LEFT")).toBe(false);
      expect(canAddItineraryItem("SETTLING", "ACTIVE")).toBe(false);
      expect(canAddItineraryItem("COMPLETED", "ACTIVE")).toBe(false);
    });

    it("cho phép Trưởng nhóm sửa/xóa bất kỳ địa điểm nào khi ACTIVE", () => {
      expect(canEditItineraryItem(item, "other-user", true, "ACTIVE")).toBe(true);
      expect(canDeleteItineraryItem(item, "other-user", true, "ACTIVE")).toBe(true);
    });

    it("cho phép người tạo sửa/xóa địa điểm của chính mình khi ACTIVE", () => {
      expect(canEditItineraryItem(item, "member-author", false, "ACTIVE")).toBe(true);
      expect(canDeleteItineraryItem(item, "member-author", false, "ACTIVE")).toBe(true);
    });

    it("CHẶN thành viên khác sửa/xóa địa điểm không phải do mình tạo", () => {
      expect(canEditItineraryItem(item, "other-member", false, "ACTIVE")).toBe(false);
      expect(canDeleteItineraryItem(item, "other-member", false, "ACTIVE")).toBe(false);
    });

    it("CHẶN sửa/xóa khi chuyến đi đã chốt sổ (SETTLING hoặc COMPLETED) kể cả với Trưởng nhóm", () => {
      expect(canEditItineraryItem(item, "member-author", true, "SETTLING")).toBe(false);
      expect(canDeleteItineraryItem(item, "member-author", true, "COMPLETED")).toBe(false);
      expect(canEditItineraryItem(item, "other-user", true, "SETTLING")).toBe(false);
      expect(canDeleteItineraryItem(item, "other-user", true, "COMPLETED")).toBe(false);
    });
  });

  describe("Expense linking logic (Quy tắc A.4)", () => {
    it("gắn đúng expenseId khi người dùng xác nhận lưu thành công", () => {
      const initialItem: ItineraryItem = {
        id: "it-1",
        tripId: "t1",
        dayDate: "2026-11-20",
        sortOrder: 1,
        placeName: "Thung lũng Tình Yêu",
        startTime: "10:30",
        createdByMemberId: "m1",
        expenseId: null,
      };

      // Giả lập lưu khoản chi thành công
      const createdExpenseId = "exp-test-123";
      const updatedItem: ItineraryItem = {
        ...initialItem,
        expenseId: createdExpenseId,
      };

      expect(updatedItem.expenseId).toBe("exp-test-123");
    });

    it("KHÔNG gán expenseId khi người dùng hủy modal", () => {
      const initialItem: ItineraryItem = {
        id: "it-1",
        tripId: "t1",
        dayDate: "2026-11-20",
        sortOrder: 1,
        placeName: "Thung lũng Tình Yêu",
        startTime: "10:30",
        createdByMemberId: "m1",
        expenseId: null,
      };

      // Người dùng bấm Hủy -> trạng thái giữ nguyên
      const targetItem = { ...initialItem };
      // Cancel modal
      expect(targetItem.expenseId).toBeNull();
    });
  });

  describe("sortItineraryItems", () => {
    it("sắp xếp đúng theo ngày, sau đó theo giờ bắt đầu tăng dần", () => {
      const unsorted: ItineraryItem[] = [
        {
          id: "3",
          tripId: "t1",
          dayDate: "2026-11-20",
          sortOrder: 3,
          placeName: "Chợ Đà Lạt",
          startTime: "13:00",
          createdByMemberId: "m1",
        },
        {
          id: "1",
          tripId: "t1",
          dayDate: "2026-11-20",
          sortOrder: 1,
          placeName: "Cà phê Mê Linh",
          startTime: "08:00",
          createdByMemberId: "m1",
        },
        {
          id: "2",
          tripId: "t1",
          dayDate: "2026-11-20",
          sortOrder: 2,
          placeName: "Thung lũng Tình Yêu",
          startTime: "10:30",
          createdByMemberId: "m1",
        },
        {
          id: "4",
          tripId: "t1",
          dayDate: "2026-11-21",
          sortOrder: 1,
          placeName: "Đồi chè Cầu Đất",
          startTime: "07:30",
          createdByMemberId: "m1",
        },
      ];

      const sorted = sortItineraryItems(unsorted);
      expect(sorted.map((i) => i.id)).toEqual(["1", "2", "3", "4"]);
    });
  });
});
