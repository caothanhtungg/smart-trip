/**
 * Helpers xử lý ngày, giờ và lịch trình chuyến đi (Release 1).
 * Tuân thủ quy tắc ngày Việt Nam (dd/mm/yyyy), giờ 24h (HH:mm) và không dùng thư viện ngoài.
 */

export interface TripDayInfo {
  dayIndex: number; // 1-indexed (Ngày 1, Ngày 2...)
  dateString: string; // ISO date "YYYY-MM-DD"
  dayLabel: string; // "Ngày 1"
  shortDateText: string; // "20/11"
  dayOfWeekShort: string; // "T6", "T7", "CN"...
  dayOfWeekFull: string; // "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"...
  fullFormattedText: string; // "Ngày 1 · T6 20/11"
}

const VI_DAYS_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const VI_DAYS_FULL = [
  "Chủ Nhật",
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
];

/**
 * Kiểm tra xem một chuỗi YYYY-MM-DD có phải là ngày lịch hợp lệ không
 * (loại trừ ngày không tồn tại như 2026-02-31, 2026-04-31, 2026-13-40).
 */
export function isValidCalendarDate(dateStr?: string | null): boolean {
  if (!dateStr || typeof dateStr !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const parts = dateStr.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  if (month < 1 || month > 12 || day < 1 || day > 31) return false;

  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Sinh danh sách các ngày trong chuyến đi từ startDate đến endDate.
 */
export function generateTripDays(startDateStr: string, endDateStr: string): TripDayInfo[] {
  if (!startDateStr || !endDateStr) return [];

  const start = new Date(`${startDateStr}T00:00:00`);
  const end = new Date(`${endDateStr}T00:00:00`);

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [];
  }

  const days: TripDayInfo[] = [];
  const current = new Date(start);
  let dayIndex = 1;

  while (current <= end) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    const dateString = `${year}-${month}-${day}`;

    const dayOfWeekIdx = current.getDay();
    const dayOfWeekShort = VI_DAYS_SHORT[dayOfWeekIdx];
    const dayOfWeekFull = VI_DAYS_FULL[dayOfWeekIdx];
    const shortDateText = `${day}/${month}`;
    const dayLabel = `Ngày ${dayIndex}`;

    days.push({
      dayIndex,
      dateString,
      dayLabel,
      shortDateText,
      dayOfWeekShort,
      dayOfWeekFull,
      fullFormattedText: `${dayLabel} · ${dayOfWeekShort} ${shortDateText}`,
    });

    current.setDate(current.getDate() + 1);
    dayIndex++;
  }

  return days;
}

/**
 * Chuyển chuỗi giờ "HH:mm" thành tổng số phút từ 00:00.
 */
export function timeStringToMinutes(timeStr?: string | null): number | null {
  if (!timeStr || typeof timeStr !== "string") return null;
  const match = timeStr.trim().match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return hours * 60 + minutes;
}

/**
 * Chuyển số phút thành chuỗi giờ 24h "HH:mm".
 */
export function minutesToTimeString(minutes: number): string {
  const safeMinutes = Math.max(0, Math.floor(minutes)) % (24 * 60);
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/**
 * Chuyển chuỗi giờ "HH:mm" thành đối tượng Date tương thích với PostgreSQL TIME(0) của Prisma.
 * Luôn dùng epoch UTC 1970-01-01 để độc lập hoàn toàn với timezone của máy chủ.
 */
export function timeStringToDbTime(timeStr?: string | null): Date | null {
  if (!timeStr || typeof timeStr !== "string") return null;
  const match = timeStr.trim().match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0, 0));
}

/**
 * Chuyển đổi dữ liệu thời gian từ Prisma/PostgreSQL (@db.Time(0)) thành chuỗi 24h "HH:mm".
 * Hỗ trợ Date object (trích xuất UTC hours/minutes) và chuỗi thời gian (HH:mm hoặc ISO).
 */
export function dbTimeToTimeString(dbTime?: Date | string | null): string | null {
  if (!dbTime) return null;

  if (typeof dbTime === "string") {
    const trimmed = dbTime.trim();
    const timeMatch = trimmed.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])(?::[0-5][0-9])?$/);
    if (timeMatch) {
      return `${timeMatch[1].padStart(2, "0")}:${timeMatch[2]}`;
    }
    const parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime())) {
      const h = String(parsedDate.getUTCHours()).padStart(2, "0");
      const m = String(parsedDate.getUTCMinutes()).padStart(2, "0");
      return `${h}:${m}`;
    }
    return null;
  }

  if (dbTime instanceof Date) {
    if (isNaN(dbTime.getTime())) return null;
    const h = String(dbTime.getUTCHours()).padStart(2, "0");
    const m = String(dbTime.getUTCMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  }

  return null;
}

/**
 * Tính thời lượng giữa startTime và endTime (phút).
 */
export function calculateDurationMinutes(
  startTime?: string | null,
  endTime?: string | null
): number | null {
  const startMin = timeStringToMinutes(startTime);
  const endMin = timeStringToMinutes(endTime);

  if (startMin === null || endMin === null) return null;
  if (endMin < startMin) return null;

  return endMin - startMin;
}

/**
 * Định dạng thời lượng thân thiện cho người dùng Việt Nam.
 * Ví dụ: 120 -> "2 giờ", 90 -> "1 giờ 30 phút", 45 -> "45 phút".
 */
export function formatDurationHuman(minutes: number): string {
  if (minutes <= 0) return "0 phút";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return `${hours} giờ ${mins} phút`;
  }
  if (hours > 0) {
    return `${hours} giờ`;
  }
  return `${mins} phút`;
}

export type TimeOfDayTag = "Sáng" | "Trưa" | "Chiều" | "Tối";

/**
 * Phân loại buổi trong ngày dựa trên giờ bắt đầu:
 * - 05:00 – 10:59: Buổi sáng
 * - 11:00 – 13:59: Buổi trưa
 * - 14:00 – 17:59: Buổi chiều
 * - 18:00 – 04:59: Buổi tối
 */
export function classifyTimeOfDay(startTime?: string | null): TimeOfDayTag {
  const minutes = timeStringToMinutes(startTime);
  if (minutes === null) return "Sáng";

  const hours = Math.floor(minutes / 60);

  if (hours >= 5 && hours < 11) return "Sáng";
  if (hours >= 11 && hours < 14) return "Trưa";
  if (hours >= 14 && hours < 18) return "Chiều";
  return "Tối";
}

/**
 * Lớp màu thương hiệu Tailwind tương ứng với từng buổi trong ngày.
 */
export function getTimeOfDayColorClasses(tag: TimeOfDayTag): {
  bg: string;
  text: string;
} {
  switch (tag) {
    case "Sáng":
      return { bg: "bg-surface-container", text: "text-cerulean" };
    case "Trưa":
      return { bg: "bg-functional-warning-bg", text: "text-functional-warning" };
    case "Chiều":
      return { bg: "bg-tropical-teal/15", text: "text-tropical-teal" };
    case "Tối":
    default:
      return { bg: "bg-yale-blue/10", text: "text-yale-blue" };
  }
}
