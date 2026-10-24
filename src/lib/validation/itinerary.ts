import { z } from "zod";

import { isValidCalendarDate } from "@/lib/itinerary/date";

export { isValidCalendarDate };

const TIME_REGEX = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

/**
 * Kiểm tra xem ngày hoạt động có nằm trong khoảng thời gian chuyến đi hay không.
 */
export function validateDateWithinTrip(
  dayDateStr: string,
  tripStartDate: Date | string,
  tripEndDate: Date | string
): boolean {
  const startStr =
    tripStartDate instanceof Date
      ? tripStartDate.toISOString().split("T")[0]
      : String(tripStartDate).split("T")[0];
  const endStr =
    tripEndDate instanceof Date
      ? tripEndDate.toISOString().split("T")[0]
      : String(tripEndDate).split("T")[0];

  return dayDateStr >= startStr && dayDateStr <= endStr;
}

/**
 * Schema xác thực dữ liệu tạo mới điểm dừng lịch trình (POST /api/trips/[id]/itinerary).
 */
export const CreateItineraryItemSchema = z
  .object({
    placeName: z
      .string({ required_error: "Vui lòng nhập tên địa điểm." })
      .trim()
      .min(1, "Vui lòng nhập tên địa điểm.")
      .max(200, "Tên địa điểm không được vượt quá 200 ký tự."),
    dayDate: z
      .string({ required_error: "Vui lòng chọn ngày cho hoạt động." })
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không đúng định dạng YYYY-MM-DD.")
      .refine(isValidCalendarDate, "Ngày không hợp lệ."),
    address: z
      .string()
      .trim()
      .max(500, "Địa chỉ không được vượt quá 500 ký tự.")
      .optional()
      .nullable(),
    note: z
      .string()
      .trim()
      .max(1000, "Ghi chú không được vượt quá 1000 ký tự.")
      .optional()
      .nullable(),
    startTime: z
      .string({ required_error: "Vui lòng chọn giờ bắt đầu." })
      .trim()
      .regex(TIME_REGEX, "Giờ bắt đầu không đúng định dạng (HH:mm)."),
    endTime: z
      .string()
      .trim()
      .regex(TIME_REGEX, "Giờ kết thúc không đúng định dạng (HH:mm).")
      .optional()
      .nullable(),
    sortOrder: z
      .number({ invalid_type_error: "Thứ tự phải là số nguyên không âm." })
      .int("Thứ tự phải là số nguyên không âm.")
      .nonnegative("Thứ tự phải là số nguyên không âm.")
      .optional(),
  })
  .strict("Payload chứa trường không được phép.")
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime >= data.startTime;
      }
      return true;
    },
    {
      message: "Giờ kết thúc không thể trước giờ bắt đầu.",
      path: ["endTime"],
    }
  );

export type CreateItineraryItemInput = z.infer<typeof CreateItineraryItemSchema>;

/**
 * Schema xác thực dữ liệu chỉnh sửa điểm dừng lịch trình (PATCH /api/trips/[id]/itinerary/[itemId]).
 */
export const UpdateItineraryItemSchema = z
  .object({
    placeName: z
      .string()
      .trim()
      .min(1, "Tên địa điểm không được để trống.")
      .max(200, "Tên địa điểm không được vượt quá 200 ký tự.")
      .optional(),
    dayDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không đúng định dạng YYYY-MM-DD.")
      .refine(isValidCalendarDate, "Ngày không hợp lệ.")
      .optional(),
    address: z
      .string()
      .trim()
      .max(500, "Địa chỉ không được vượt quá 500 ký tự.")
      .optional()
      .nullable(),
    note: z
      .string()
      .trim()
      .max(1000, "Ghi chú không được vượt quá 1000 ký tự.")
      .optional()
      .nullable(),
    startTime: z
      .string()
      .trim()
      .regex(TIME_REGEX, "Giờ bắt đầu không đúng định dạng (HH:mm).")
      .optional(),
    endTime: z
      .string()
      .trim()
      .regex(TIME_REGEX, "Giờ kết thúc không đúng định dạng (HH:mm).")
      .optional()
      .nullable(),
    sortOrder: z
      .number({ invalid_type_error: "Thứ tự phải là số nguyên không âm." })
      .int("Thứ tự phải là số nguyên không âm.")
      .nonnegative("Thứ tự phải là số nguyên không âm.")
      .optional(),
  })
  .strict("Payload chứa trường không được phép chỉnh sửa.")
  .refine((data) => Object.keys(data).length > 0, {
    message: "Vui lòng cung cấp ít nhất một trường cần cập nhật.",
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime >= data.startTime;
      }
      return true;
    },
    {
      message: "Giờ kết thúc không thể trước giờ bắt đầu.",
      path: ["endTime"],
    }
  );

export type UpdateItineraryItemInput = z.infer<typeof UpdateItineraryItemSchema>;

/**
 * Schema xác thực tham số lọc danh sách điểm dừng (GET /api/trips/[id]/itinerary).
 */
export const ItineraryQuerySchema = z
  .object({
    dayDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày lọc không đúng định dạng YYYY-MM-DD.")
      .refine(isValidCalendarDate, "Ngày lọc không hợp lệ.")
      .optional(),
  })
  .strict();

export type ItineraryQueryInput = z.infer<typeof ItineraryQuerySchema>;
