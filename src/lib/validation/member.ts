import { z } from "zod";

/**
 * Schema xác thực dữ liệu thêm thành viên chưa có tài khoản (POST /api/trips/[id]/members).
 * - displayName: bắt buộc, từ 2 đến 100 ký tự sau khi trim.
 * - strict(): tuyệt đối không nhận các trường khác như userId, role, status, joinOrder.
 */
export const CreateGuestMemberSchema = z
  .object({
    displayName: z
      .string({ required_error: "Vui lòng nhập tên thành viên." })
      .trim()
      .min(2, "Tên hiển thị phải có ít nhất 2 ký tự.")
      .max(100, "Tên hiển thị không được vượt quá 100 ký tự."),
  })
  .strict("Payload chứa trường không được phép.");

export type CreateGuestMemberInput = z.infer<typeof CreateGuestMemberSchema>;

/**
 * Schema xác thực dữ liệu cập nhật thành viên chưa có tài khoản (PATCH /api/trips/[id]/members/[memberId]).
 * - displayName: bắt buộc, từ 2 đến 100 ký tự sau khi trim.
 * - strict(): chỉ cho phép cập nhật displayName.
 */
export const UpdateGuestMemberSchema = z
  .object({
    displayName: z
      .string({ required_error: "Vui lòng nhập tên thành viên." })
      .trim()
      .min(2, "Tên hiển thị phải có ít nhất 2 ký tự.")
      .max(100, "Tên hiển thị không được vượt quá 100 ký tự."),
  })
  .strict("Chỉ được phép cập nhật tên hiển thị của thành viên.");

export type UpdateGuestMemberInput = z.infer<typeof UpdateGuestMemberSchema>;
