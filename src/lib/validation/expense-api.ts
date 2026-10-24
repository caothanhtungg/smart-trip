import { z } from "zod";
import { MAX_EXPENSE_AMOUNT } from "@/lib/money/constants";

export { MAX_EXPENSE_AMOUNT };

export const EXPENSE_CATEGORIES = [
  "FOOD",
  "TRANSPORT",
  "LODGING",
  "TICKET",
  "SHOPPING",
  "OTHER",
] as const;

export type ExpenseCategoryEnum = (typeof EXPENSE_CATEGORIES)[number];

export const SPLIT_METHODS = ["EQUAL", "ITEMIZED"] as const;
export type SplitMethodEnum = (typeof SPLIT_METHODS)[number];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isUuid = (val: string): boolean => UUID_REGEX.test(val);

/**
 * Schema xác thực từng món ăn trong hóa đơn chia theo món (ITEMIZED).
 */
export const ExpenseItemInputSchema = z
  .object({
    id: z.string().optional(),
    name: z
      .string({ required_error: "Vui lòng nhập tên món." })
      .trim()
      .min(1, "Vui lòng nhập tên món.")
      .max(200, "Tên món không được vượt quá 200 ký tự."),
    amount: z
      .number({ required_error: "Vui lòng nhập giá món." })
      .int("Giá món phải là số nguyên.")
      .positive("Giá món phải là số nguyên lớn hơn 0 ₫.")
      .refine(Number.isSafeInteger, "Giá món vượt quá giới hạn an toàn."),
    assignedMemberIds: z
      .array(z.string().refine(isUuid, "ID thành viên không hợp lệ."))
      .min(1, "Mỗi món ăn phải có ít nhất 1 thành viên tham gia.")
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Phát hiện thành viên trùng lặp trong cùng một món."
      ),
  })
  .strict();

export type ExpenseItemInput = z.infer<typeof ExpenseItemInputSchema>;

/**
 * Base schema các trường dữ liệu dùng chung cho khoản chi.
 */
const BaseExpenseFields = {
  title: z
    .string({ required_error: "Vui lòng nhập tên khoản chi." })
    .trim()
    .min(1, "Vui lòng nhập tên khoản chi.")
    .max(200, "Tên khoản chi không được vượt quá 200 ký tự."),
  amount: z
    .number({ required_error: "Vui lòng nhập số tiền." })
    .int("Số tiền phải là số nguyên.")
    .positive("Số tiền phải là số nguyên lớn hơn 0 ₫.")
    .max(
      MAX_EXPENSE_AMOUNT,
      `Số tiền không được vượt quá ${MAX_EXPENSE_AMOUNT.toLocaleString("vi-VN")} ₫.`
    )
    .refine(Number.isSafeInteger, "Số tiền vượt quá giới hạn an toàn."),
  category: z.enum(EXPENSE_CATEGORIES, {
    errorMap: () => ({ message: "Vui lòng chọn danh mục chi tiêu hợp lệ." }),
  }),
  paidByMemberId: z
    .string({ required_error: "Vui lòng chọn người thanh toán." })
    .refine(isUuid, "ID người trả tiền không hợp lệ."),
  spentAt: z
    .string()
    .trim()
    .refine((val) => !isNaN(Date.parse(val)), "Thời gian chi tiêu không hợp lệ.")
    .optional(),
  receiptImageUrl: z
    .string()
    .trim()
    .max(2048, "Đường dẫn ảnh hóa đơn không được vượt quá 2048 ký tự.")
    .nullable()
    .optional(),
  note: z
    .string()
    .trim()
    .max(1000, "Ghi chú không được vượt quá 1000 ký tự.")
    .nullable()
    .optional(),
  itineraryItemId: z
    .string()
    .refine(isUuid, "ID địa điểm lịch trình không hợp lệ.")
    .nullable()
    .optional(),
};

/**
 * Schema tạo khoản chi theo phương thức chia đều (EQUAL).
 */
export const CreateEqualExpenseSchema = z
  .object({
    ...BaseExpenseFields,
    splitMethod: z.literal("EQUAL"),
    participantMemberIds: z
      .array(z.string().refine(isUuid, "ID thành viên không hợp lệ."))
      .min(1, "Vui lòng chọn ít nhất 1 thành viên tham gia chia tiền.")
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Danh sách người chia không được chứa thành viên trùng lặp."
      ),
  })
  .strict();

/**
 * Schema tạo khoản chi theo phương thức chia theo món (ITEMIZED).
 */
export const CreateItemizedExpenseSchema = z
  .object({
    ...BaseExpenseFields,
    splitMethod: z.literal("ITEMIZED"),
    surchargeAmount: z
      .number()
      .int("Phụ phí phải là số nguyên.")
      .min(0, "Phụ phí không được là số âm.")
      .max(
        MAX_EXPENSE_AMOUNT,
        `Phụ phí không được vượt quá ${MAX_EXPENSE_AMOUNT.toLocaleString("vi-VN")} ₫.`
      )
      .refine(Number.isSafeInteger, "Phụ phí vượt quá giới hạn an toàn.")
      .default(0)
      .optional(),
    items: z
      .array(ExpenseItemInputSchema)
      .min(1, "Vui lòng nhập ít nhất một món ăn."),
  })
  .strict();

/**
 * Schema tổng hợp cho POST /api/trips/[id]/expenses (Discriminated Union theo splitMethod).
 */
export const CreateExpenseApiSchema = z
  .discriminatedUnion("splitMethod", [
    CreateEqualExpenseSchema,
    CreateItemizedExpenseSchema,
  ])
  .superRefine((data, ctx) => {
    if (data.splitMethod === "ITEMIZED") {
      const sumItems = data.items.reduce((acc, item) => acc + item.amount, 0);
      const surcharge = data.surchargeAmount ?? 0;
      if (data.amount !== sumItems + surcharge) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Tổng các món và phụ phí không khớp với số tiền của khoản chi.",
          path: ["items"],
        });
      }
    }
  });

export type CreateExpenseApiInput = z.infer<typeof CreateExpenseApiSchema>;

/**
 * Schema cập nhật khoản chi (PATCH /api/trips/[id]/expenses/[expenseId]).
 * Cho phép cập nhật từng phần (metadata, payer, hoặc cấu trúc chia tiền).
 */
export const UpdateExpenseApiSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Vui lòng nhập tên khoản chi.")
      .max(200, "Tên khoản chi không được vượt quá 200 ký tự.")
      .optional(),
    amount: z
      .number()
      .int("Số tiền phải là số nguyên.")
      .positive("Số tiền phải là số nguyên lớn hơn 0 ₫.")
      .max(
        MAX_EXPENSE_AMOUNT,
        `Số tiền không được vượt quá ${MAX_EXPENSE_AMOUNT.toLocaleString("vi-VN")} ₫.`
      )
      .refine(Number.isSafeInteger, "Số tiền vượt quá giới hạn an toàn.")
      .optional(),
    category: z.enum(EXPENSE_CATEGORIES).optional(),
    paidByMemberId: z
      .string()
      .refine(isUuid, "ID người trả tiền không hợp lệ.")
      .optional(),
    spentAt: z
      .string()
      .trim()
      .refine((val) => !isNaN(Date.parse(val)), "Thời gian chi tiêu không hợp lệ.")
      .optional(),
    receiptImageUrl: z
      .string()
      .trim()
      .max(2048, "Đường dẫn ảnh hóa đơn không được vượt quá 2048 ký tự.")
      .nullable()
      .optional(),
    note: z
      .string()
      .trim()
      .max(1000, "Ghi chú không được vượt quá 1000 ký tự.")
      .nullable()
      .optional(),
    itineraryItemId: z
      .string()
      .refine(isUuid, "ID địa điểm lịch trình không hợp lệ.")
      .nullable()
      .optional(),
    splitMethod: z.enum(SPLIT_METHODS).optional(),
    participantMemberIds: z
      .array(z.string().refine(isUuid, "ID thành viên không hợp lệ."))
      .min(1, "Vui lòng chọn ít nhất 1 thành viên tham gia chia tiền.")
      .refine(
        (ids) => new Set(ids).size === ids.length,
        "Danh sách người chia không được chứa thành viên trùng lặp."
      )
      .optional(),
    surchargeAmount: z
      .number()
      .int("Phụ phí phải là số nguyên.")
      .min(0, "Phụ phí không được là số âm.")
      .max(
        MAX_EXPENSE_AMOUNT,
        `Phụ phí không được vượt quá ${MAX_EXPENSE_AMOUNT.toLocaleString("vi-VN")} ₫.`
      )
      .refine(Number.isSafeInteger, "Phụ phí vượt quá giới hạn an toàn.")
      .optional(),
    items: z.array(ExpenseItemInputSchema).min(1, "Vui lòng nhập ít nhất một món ăn.").optional(),
  })
  .strict()
  .refine(
    (data) => Object.keys(data).length > 0,
    "Yêu cầu ít nhất một trường dữ liệu để cập nhật."
  )
  .refine(
    (data) => {
      // Nếu payload cập nhật đồng thời cả amount và items
      if (data.amount !== undefined && data.items !== undefined) {
        const sumItems = data.items.reduce((acc, item) => acc + item.amount, 0);
        const surcharge = data.surchargeAmount ?? 0;
        return data.amount === sumItems + surcharge;
      }
      return true;
    },
    {
      message: "Tổng các món và phụ phí không khớp với số tiền của khoản chi.",
      path: ["items"],
    }
  );

export type UpdateExpenseApiInput = z.infer<typeof UpdateExpenseApiSchema>;

/**
 * Query schema cho GET /api/trips/[id]/expenses
 */
export const ExpenseQuerySchema = z
  .object({
    category: z.enum(EXPENSE_CATEGORIES).optional(),
    splitMethod: z.enum(SPLIT_METHODS).optional(),
  })
  .strict();

export type ExpenseQueryInput = z.infer<typeof ExpenseQuerySchema>;
