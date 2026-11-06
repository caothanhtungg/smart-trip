import { z } from "zod";
import { normalizeAccountHolderName } from "@/lib/user/validation";
import { POPULAR_BANKS } from "@/lib/mock/banks";

/**
 * Regex kiểm tra mã BIN ngân hàng Việt Nam: từ 6 đến 10 chữ số.
 */
const BANK_BIN_REGEX = /^[0-9]{6,10}$/;

/**
 * Regex kiểm tra số tài khoản ngân hàng: từ 6 đến 20 ký tự chữ và số, không khoảng trắng.
 */
const BANK_ACCOUNT_NO_REGEX = /^[0-9A-Za-z]{6,20}$/;

/**
 * Schema xác thực dữ liệu cập nhật thông tin cá nhân và tài khoản ngân hàng.
 * PATCH /api/me
 *
 * QUY TẮC BẢO MẬT & NGHIỆP VỤ:
 * 1. Strict object: Tuyệt đối không chấp nhận userId, email, id, role, keyVersion hay các trường ngoài spec.
 * 2. Partial updates: Có thể cập nhật chỉ tên hiển thị, ảnh đại diện, hoặc chỉ tài khoản ngân hàng, hoặc cả hai.
 * 3. Quy tắc "all-or-nothing" cho thông tin ngân hàng:
 *    - Nếu thiết lập STK mới: bắt buộc cung cấp đầy đủ cả 3 trường (bankBin, bankAccountNo, bankAccountName).
 *    - Nếu gỡ bỏ STK: cả 3 trường ngân hàng phải cùng là null.
 *    - Nếu không cập nhật ngân hàng: không truyền 3 trường này (undefined), giữ nguyên thông tin cũ trong DB.
 * 4. Không cho phép payload rỗng {}.
 */
export const UpdateCurrentUserProfileSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "Tên hiển thị phải có ít nhất 2 ký tự.")
      .max(50, "Tên hiển thị không được vượt quá 50 ký tự.")
      .optional(),
    name: z
      .string()
      .trim()
      .min(2, "Họ và tên phải có ít nhất 2 ký tự.")
      .max(100, "Họ và tên không được vượt quá 100 ký tự.")
      .optional(),
    avatarUrl: z
      .string()
      .nullable()
      .optional(),
    bankBin: z
      .string()
      .trim()
      .refine(
        (bin) => BANK_BIN_REGEX.test(bin) && POPULAR_BANKS.some((b) => b.bin === bin),
        "Mã ngân hàng thụ hưởng không hợp lệ hoặc chưa được hỗ trợ."
      )
      .nullable()
      .optional(),
    bankAccountNo: z
      .string()
      .trim()
      .regex(
        BANK_ACCOUNT_NO_REGEX,
        "Số tài khoản phải từ 6 đến 20 ký tự (chữ hoặc số, không có khoảng trắng)."
      )
      .nullable()
      .optional(),
    bankAccountName: z
      .string()
      .trim()
      .min(2, "Tên chủ tài khoản phải có ít nhất 2 ký tự.")
      .max(100, "Tên chủ tài khoản không được vượt quá 100 ký tự.")
      .transform((val) => normalizeAccountHolderName(val))
      .nullable()
      .optional(),
  })
  .strict("Payload chứa trường không được phép chỉnh sửa.")
  .superRefine((data, ctx) => {
    // 1. Kiểm tra payload không được rỗng
    const hasAnyField =
      data.displayName !== undefined ||
      data.name !== undefined ||
      data.avatarUrl !== undefined ||
      data.bankBin !== undefined ||
      data.bankAccountNo !== undefined ||
      data.bankAccountName !== undefined;

    if (!hasAnyField) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Yêu cầu ít nhất một trường thông tin để cập nhật.",
      });
      return;
    }

    // 2. Kiểm tra quy tắc các trường ngân hàng phải đi cùng nhau (All-or-Nothing)
    const bankFields = [data.bankBin, data.bankAccountNo, data.bankAccountName];
    const hasProvidedAnyBankField = bankFields.some((f) => f !== undefined);

    if (hasProvidedAnyBankField) {
      const allAreNull = bankFields.every((f) => f === null);
      const allAreValidStrings = bankFields.every(
        (f) => typeof f === "string" && f.length > 0
      );

      if (!allAreNull && !allAreValidStrings) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "Thông tin ngân hàng phải được cung cấp đồng thời cả 3 trường (bankBin, bankAccountNo, bankAccountName) hoặc cùng đặt về null để gỡ bỏ.",
        });
      }
    }
  });

export type UpdateCurrentUserProfileInput = z.infer<typeof UpdateCurrentUserProfileSchema>;
