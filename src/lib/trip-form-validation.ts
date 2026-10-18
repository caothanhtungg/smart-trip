import type {
  CreateTripFormData,
  CreateTripValidationErrors,
  CreateTripValidationResult,
} from "../types/trip";
import { parseMoneyInput, formatMoneyInputValue } from "@/lib/money/parse";
import { MAX_TRIP_BUDGET } from "@/lib/money/constants";

export { parseMoneyInput, formatMoneyInputValue };

/**
 * Parses an ISO date string (YYYY-MM-DD) or DD/MM/YYYY into a calendar Date object
 * at local midnight to avoid timezone shifting issues.
 */
export function parseCalendarDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  // 1. ISO format: YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10) - 1;
    const day = parseInt(isoMatch[3], 10);
    const date = new Date(year, month, day);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    ) {
      return date;
    }
    return null;
  }

  // 2. Vietnamese format: DD/MM/YYYY
  const vnMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (vnMatch) {
    const day = parseInt(vnMatch[1], 10);
    const month = parseInt(vnMatch[2], 10) - 1;
    const year = parseInt(vnMatch[3], 10);
    const date = new Date(year, month, day);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    ) {
      return date;
    }
    return null;
  }

  return null;
}

/**
 * Calculates duration text ("X ngày Y đêm" or "1 ngày") from start and end dates.
 * Returns null if dates are invalid or endDate < startDate.
 */
export function calculateDurationText(
  startDateStr: string | null | undefined,
  endDateStr: string | null | undefined
): string | null {
  const start = parseCalendarDate(startDateStr);
  const end = parseCalendarDate(endDateStr);

  if (!start || !end) return null;

  const diffTime = end.getTime() - start.getTime();
  if (diffTime < 0) return null; // endDate is earlier than startDate

  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;

  if (diffDays <= 0) return null;
  if (diffDays === 1) return "1 ngày";
  return `${diffDays} ngày ${diffDays - 1} đêm`;
}

/**
 * Pure validation function for Create Trip form.
 *
 * Rules:
 * - name: required, 2 to 150 characters.
 * - destination: optional (compatible with ERD trips.destination nullable), max 150 characters if provided.
 * - startDate: required, valid calendar date.
 * - endDate: required, valid calendar date, endDate >= startDate.
 * - budgetAmount: optional, integer >= 0 and <= MAX_TRIP_BUDGET (2,000,000,000 VND).
 */
export function validateCreateTripForm(
  data: Partial<CreateTripFormData>
): CreateTripValidationResult {
  const errors: CreateTripValidationErrors = {};

  // 1. Validate Trip Name
  const trimmedName = (data.name || "").trim();
  if (!trimmedName) {
    errors.name = "Vui lòng nhập tên chuyến đi.";
  } else if (trimmedName.length < 2) {
    errors.name = "Tên chuyến đi phải có ít nhất 2 ký tự.";
  } else if (trimmedName.length > 150) {
    errors.name = "Tên chuyến đi không được vượt quá 150 ký tự.";
  }

  // 2. Validate Destination (Optional, matching ERD)
  const trimmedDestination = (data.destination || "").trim();
  if (trimmedDestination && trimmedDestination.length > 150) {
    errors.destination = "Điểm đến không được vượt quá 150 ký tự.";
  }

  // 3. Validate Start Date
  const startDateObj = parseCalendarDate(data.startDate);
  if (!data.startDate || !data.startDate.trim()) {
    errors.startDate = "Vui lòng chọn ngày khởi hành.";
  } else if (!startDateObj) {
    errors.startDate = "Ngày khởi hành không đúng định dạng lịch.";
  }

  // 4. Validate End Date
  const endDateObj = parseCalendarDate(data.endDate);
  if (!data.endDate || !data.endDate.trim()) {
    errors.endDate = "Vui lòng chọn ngày kết thúc.";
  } else if (!endDateObj) {
    errors.endDate = "Ngày kết thúc không đúng định dạng lịch.";
  } else if (startDateObj && endDateObj && endDateObj.getTime() < startDateObj.getTime()) {
    errors.endDate = "Ngày về phải sau hoặc cùng ngày với ngày khởi hành.";
  }

  // 5. Validate Budget (Optional)
  if (data.budgetAmount !== null && data.budgetAmount !== undefined) {
    if (isNaN(data.budgetAmount) || data.budgetAmount < 0 || !Number.isSafeInteger(data.budgetAmount)) {
      errors.budgetAmount = "Ngân sách dự kiến phải là số tiền hợp lệ.";
    } else if (data.budgetAmount > MAX_TRIP_BUDGET) {
      errors.budgetAmount = `Ngân sách dự kiến không được vượt quá ${MAX_TRIP_BUDGET.toLocaleString("vi-VN")} ₫.`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
