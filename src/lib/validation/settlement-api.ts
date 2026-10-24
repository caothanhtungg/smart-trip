import { z } from "zod";

export const PaymentMethodSchema = z.enum(["BANK_TRANSFER", "CASH"]);
export type PaymentMethodApi = z.infer<typeof PaymentMethodSchema>;

export const TransferActionSchema = z.enum(["MARK_PAID", "CONFIRM_COMPLETED"]);
export type TransferAction = z.infer<typeof TransferActionSchema>;

/**
 * Payload cho cập nhật trạng thái khoản chuyển tiền (Transfer).
 * Hỗ trợ cả hai phong cách:
 * 1. Action-based: { action: "MARK_PAID", paymentMethod?: "BANK_TRANSFER" | "CASH" } / { action: "CONFIRM_COMPLETED" }
 * 2. Status-based: { status: "PAID", paymentMethod?: ... } / { status: "COMPLETED" }
 */
export const UpdateTransferInputSchema = z.union([
  z.object({
    action: z.literal("MARK_PAID"),
    paymentMethod: PaymentMethodSchema.optional(),
  }),
  z.object({
    action: z.literal("CONFIRM_COMPLETED"),
  }),
  z.object({
    status: z.literal("PAID"),
    paymentMethod: PaymentMethodSchema.optional(),
  }),
  z.object({
    status: z.literal("COMPLETED"),
  }),
]);

export type UpdateTransferInput = z.infer<typeof UpdateTransferInputSchema>;

/**
 * Payload cho yêu cầu chốt sổ / tạo quyết toán (POST /api/trips/[id]/settlement).
 * Không nhận danh sách transfers hay balances do client tự tính để làm nguồn sự thật.
 * Server tự khóa row trip FOR UPDATE, đọc expenses/shares, tính balances và simplify.
 */
export const CreateSettlementApiSchema = z.object({}).optional();
export type CreateSettlementApiInput = z.infer<typeof CreateSettlementApiSchema>;

/**
 * Query parameters cho GET /api/trips/[id]/settlement
 * ?history=true: kèm theo danh sách các sổ quyết toán CANCELLED trước đây.
 */
export const SettlementQuerySchema = z
  .object({
    history: z.enum(["true", "false"]).optional(),
  })
  .strict();
export type SettlementQueryInput = z.infer<typeof SettlementQuerySchema>;
