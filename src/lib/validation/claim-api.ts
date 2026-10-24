import { z } from "zod";

/**
 * Schema xác thực payload gửi yêu cầu nhận diện thành viên chưa có tài khoản (UC33).
 * POST /api/trips/[id]/claims
 */
export const CreateClaimSchema = z
  .object({
    placeholderMemberId: z
      .string()
      .uuid("ID thành viên chưa có tài khoản không hợp lệ (phải là định dạng UUID)."),
  })
  .strict();

export type CreateClaimInput = z.infer<typeof CreateClaimSchema>;

/**
 * Schema xác thực payload duyệt hoặc từ chối yêu cầu nhận diện (UC30).
 * PATCH /api/trips/[id]/claims/[claimId]/decision
 */
export const DecideClaimSchema = z
  .object({
    decision: z
      .enum(["APPROVE", "REJECT"], {
        errorMap: () => ({ message: "Quyết định không hợp lệ. Chỉ chấp nhận 'APPROVE' hoặc 'REJECT'." }),
      })
      .optional(),
    action: z
      .enum(["APPROVE", "REJECT"], {
        errorMap: () => ({ message: "Hành động không hợp lệ. Chỉ chấp nhận 'APPROVE' hoặc 'REJECT'." }),
      })
      .optional(),
  })
  .refine((data) => Boolean(data.decision || data.action), {
    message: "Vui lòng cung cấp quyết định ('APPROVE' hoặc 'REJECT').",
    path: ["decision"],
  })
  .transform((data) => ({
    decision: (data.decision || data.action) as "APPROVE" | "REJECT",
  }));

export type DecideClaimInput = z.infer<typeof DecideClaimSchema>;
