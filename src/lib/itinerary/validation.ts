import {
  ItineraryItem,
  CreateItineraryItemFormData,
  ItineraryValidationResult,
  ItineraryValidationErrors,
  TimeConflictInfo,
  TripStatus,
} from "@/types/trip";
import { timeStringToMinutes } from "./date";

/**
 * Kiểm tra tính hợp lệ của biểu mẫu thêm/sửa địa điểm lịch trình.
 */
export function validateItineraryItemForm(
  formData: CreateItineraryItemFormData,
  tripStartDate: string,
  tripEndDate: string
): ItineraryValidationResult {
  const errors: ItineraryValidationErrors = {};

  // 1. Tên địa điểm (bắt buộc, 1-200 ký tự)
  const trimmedName = (formData.placeName || "").trim();
  if (!trimmedName) {
    errors.placeName = "Vui lòng nhập tên địa điểm.";
  } else if (trimmedName.length > 200) {
    errors.placeName = "Tên địa điểm không được vượt quá 200 ký tự.";
  }

  // 2. Ngày diễn ra (bắt buộc, phải nằm trong khoảng ngày của chuyến đi)
  const dayDate = (formData.dayDate || "").trim();
  if (!dayDate) {
    errors.dayDate = "Vui lòng chọn ngày cho hoạt động.";
  } else {
    // Kiểm tra định dạng YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dayDate)) {
      errors.dayDate = "Ngày không đúng định dạng YYYY-MM-DD.";
    } else if (dayDate < tripStartDate || dayDate > tripEndDate) {
      errors.dayDate = `Ngày đã chọn phải nằm trong khoảng thời gian chuyến đi (${tripStartDate} đến ${tripEndDate}).`;
    }
  }

  // 3. Giờ bắt đầu (bắt buộc, định dạng HH:mm)
  const startTime = (formData.startTime || "").trim();
  const startMin = timeStringToMinutes(startTime);
  if (!startTime) {
    errors.startTime = "Vui lòng chọn giờ bắt đầu.";
  } else if (startMin === null) {
    errors.startTime = "Giờ bắt đầu không đúng định dạng (HH:mm).";
  }

  // 4. Giờ kết thúc (tùy chọn; nếu nhập thì phải >= startTime)
  const endTime = (formData.endTime || "").trim();
  if (endTime) {
    const endMin = timeStringToMinutes(endTime);
    if (endMin === null) {
      errors.endTime = "Giờ kết thúc không đúng định dạng (HH:mm).";
    } else if (startMin !== null && endMin < startMin) {
      errors.endTime = "Giờ kết thúc không thể trước giờ bắt đầu.";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Phát hiện thời gian chồng lấn giữa một địa điểm với các địa điểm khác trong ngày.
 * Quy tắc A.3:
 * - Trùng lấn khi max(start1, start2) < min(end1, end2).
 * - Hai khoảng thời gian nối tiếp nhau nhưng không chồng lấn (end1 === start2) KHÔNG tạo cảnh báo.
 */
export function detectTimeConflict(
  candidate: {
    id?: string;
    dayDate: string;
    startTime?: string | null;
    endTime?: string | null;
  },
  existingItems: ItineraryItem[]
): TimeConflictInfo {
  const startMin = timeStringToMinutes(candidate.startTime);
  if (startMin === null) {
    return { hasConflict: false };
  }

  // Nếu không có endTime, mặc định coi thời lượng là 60 phút để kiểm tra chồng lấn ước tính
  const endMin = timeStringToMinutes(candidate.endTime) ?? startMin + 60;

  // Lọc các item trong cùng ngày, khác ID
  const dayItems = existingItems.filter(
    (item) => item.dayDate === candidate.dayDate && item.id !== candidate.id
  );

  for (const item of dayItems) {
    const itemStart = timeStringToMinutes(item.startTime);
    if (itemStart === null) continue;
    const itemEnd = timeStringToMinutes(item.endTime) ?? itemStart + 60;

    // Khoảng nối tiếp nhau: end1 === start2 hoặc end2 === start1 -> Không trùng!
    if (endMin <= itemStart || startMin >= itemEnd) {
      continue;
    }

    // Có chồng lấn thực sự: max(start) < min(end)
    const overlapStart = Math.max(startMin, itemStart);
    const overlapEnd = Math.min(endMin, itemEnd);
    const overlapMinutes = overlapEnd - overlapStart;

    if (overlapMinutes > 0) {
      return {
        hasConflict: true,
        conflictingPlaceName: item.placeName,
        overlapMinutes,
        message: `Trùng ${overlapMinutes} phút với "${item.placeName}"`,
      };
    }
  }

  return { hasConflict: false };
}

/**
 * Sắp xếp các địa điểm trong ngày theo thời gian bắt đầu tăng dần.
 */
export function sortItineraryItems(items: ItineraryItem[]): ItineraryItem[] {
  return [...items].sort((a, b) => {
    // 1. Sắp xếp theo ngày
    if (a.dayDate !== b.dayDate) {
      return a.dayDate.localeCompare(b.dayDate);
    }
    // 2. Sắp xếp theo giờ bắt đầu
    const aStart = timeStringToMinutes(a.startTime) ?? 0;
    const bStart = timeStringToMinutes(b.startTime) ?? 0;
    if (aStart !== bStart) {
      return aStart - bStart;
    }
    // 3. Sắp xếp theo sortOrder hoặc tên
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }
    return a.placeName.localeCompare(b.placeName);
  });
}

/**
 * Kiểm tra quyền thêm địa điểm:
 * - Chuyến đi phải ở trạng thái ACTIVE
 * - Thành viên thao tác phải có trạng thái ACTIVE
 */
export function canAddItineraryItem(
  tripStatus: TripStatus,
  memberStatus: string = "ACTIVE"
): boolean {
  if (tripStatus !== "ACTIVE") return false;
  return memberStatus === "ACTIVE";
}

/**
 * Kiểm tra quyền sửa địa điểm:
 * - Chuyến đi phải ở trạng thái ACTIVE
 * - Người thao tác là Trưởng nhóm (Host) HOẶC là người đã tạo địa điểm đó
 */
export function canEditItineraryItem(
  item: ItineraryItem,
  currentMemberId: string,
  isHost: boolean,
  tripStatus: TripStatus
): boolean {
  if (tripStatus !== "ACTIVE") return false;
  return isHost || item.createdByMemberId === currentMemberId;
}

/**
 * Kiểm tra quyền xóa địa điểm:
 * - Chuyến đi phải ở trạng thái ACTIVE
 * - Người thao tác là Trưởng nhóm (Host) HOẶC là người đã tạo địa điểm đó
 */
export function canDeleteItineraryItem(
  item: ItineraryItem,
  currentMemberId: string,
  isHost: boolean,
  tripStatus: TripStatus
): boolean {
  if (tripStatus !== "ACTIVE") return false;
  return isHost || item.createdByMemberId === currentMemberId;
}
