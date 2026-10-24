import { z } from "zod";
import { MAX_TRIP_BUDGET } from "@/lib/money/constants";

/**
 * Schema xác thực dữ liệu tạo mới chuyến đi (POST /api/trips).
 * Tuân thủ nghiêm ngặt:
 * - name: 2 - 150 ký tự, bắt buộc.
 * - destination: tối đa 150 ký tự, tùy chọn (nullable).
 * - startDate: định dạng YYYY-MM-DD, bắt buộc.
 * - endDate: định dạng YYYY-MM-DD, bắt buộc, endDate >= startDate.
 * - budgetAmount: số nguyên VND >= 0 và <= MAX_TRIP_BUDGET (2 tỷ VND), tùy chọn.
 */
export const CreateTripSchema = z
  .object({
    name: z
      .string({ required_error: "Vui lòng nhập tên chuyến đi." })
      .trim()
      .min(2, "Tên chuyến đi phải có ít nhất 2 ký tự.")
      .max(150, "Tên chuyến đi không được vượt quá 150 ký tự."),
    destination: z
      .string()
      .trim()
      .max(150, "Điểm đến không được vượt quá 150 ký tự.")
      .optional()
      .nullable(),
    startDate: z
      .string({ required_error: "Vui lòng chọn ngày khởi hành." })
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày khởi hành không đúng định dạng YYYY-MM-DD."),
    endDate: z
      .string({ required_error: "Vui lòng chọn ngày kết thúc." })
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày kết thúc không đúng định dạng YYYY-MM-DD."),
    budgetAmount: z
      .number({ invalid_type_error: "Ngân sách dự kiến phải là số nguyên VND." })
      .int("Ngân sách dự kiến phải là số nguyên VND.")
      .nonnegative("Ngân sách dự kiến không được âm.")
      .max(MAX_TRIP_BUDGET, `Ngân sách không được vượt quá ${MAX_TRIP_BUDGET.toLocaleString("vi-VN")} ₫.`)
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      const start = new Date(data.startDate);
      const end = new Date(data.endDate);
      return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start;
    },
    {
      message: "Ngày kết thúc phải diễn ra vào hoặc sau ngày khởi hành.",
      path: ["endDate"],
    }
  );

export type CreateTripInput = z.infer<typeof CreateTripSchema>;

/**
 * Schema xác thực tham số lọc/sắp xếp danh sách chuyến đi (GET /api/trips).
 */
export const TripsQuerySchema = z.object({
  tab: z.enum(["all", "active", "completed"]).default("all"),
  sortBy: z.enum(["latest", "departure", "name"]).default("latest"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type TripsQueryInput = z.infer<typeof TripsQuerySchema>;

/**
 * Schema xác thực dữ liệu cập nhật chuyến đi (PATCH /api/trips/[id]).
 * Tuân thủ:
 * - Chỉ cho phép: name, destination, startDate, endDate, budgetAmount.
 * - strict(): Từ chối mọi trường khác (id, userId, role, inviteCode, status...).
 * - refine: Từ chối payload rỗng.
 * - refine: Nếu cả startDate và endDate cùng có mặt, bắt buộc endDate >= startDate.
 */
export const UpdateTripSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Tên chuyến đi phải có ít nhất 2 ký tự.")
      .max(150, "Tên chuyến đi không được vượt quá 150 ký tự.")
      .optional(),
    destination: z
      .string()
      .trim()
      .max(150, "Điểm đến không được vượt quá 150 ký tự.")
      .optional()
      .nullable(),
    startDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày khởi hành không đúng định dạng YYYY-MM-DD.")
      .optional(),
    endDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày kết thúc không đúng định dạng YYYY-MM-DD.")
      .optional(),
    budgetAmount: z
      .number({ invalid_type_error: "Ngân sách dự kiến phải là số nguyên VND." })
      .int("Ngân sách dự kiến phải là số nguyên VND.")
      .nonnegative("Ngân sách dự kiến không được âm.")
      .max(MAX_TRIP_BUDGET, `Ngân sách không được vượt quá ${MAX_TRIP_BUDGET.toLocaleString("vi-VN")} ₫.`)
      .optional()
      .nullable(),
  })
  .strict("Payload chứa trường không được phép chỉnh sửa.")
  .refine((data) => Object.keys(data).length > 0, {
    message: "Vui lòng cung cấp ít nhất một trường cần cập nhật.",
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        return !isNaN(start.getTime()) && !isNaN(end.getTime()) && end >= start;
      }
      return true;
    },
    {
      message: "Ngày kết thúc phải diễn ra vào hoặc sau ngày khởi hành.",
      path: ["endDate"],
    }
  );

export type UpdateTripInput = z.infer<typeof UpdateTripSchema>;
