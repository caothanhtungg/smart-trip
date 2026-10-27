import { z } from 'zod';

export const AIAssistantRequestSchema = z.object({
  message: z
    .string({ required_error: 'Vui lòng nhập câu hỏi' })
    .trim()
    .min(1, 'Câu hỏi không được để trống')
    .max(500, 'Câu hỏi tối đa 500 ký tự'),
  tripContext: z
    .object({
      id: z.string().optional(),
      title: z.string().optional(),
      destination: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      memberCount: z.number().int().positive().optional(),
    })
    .optional(),
});

export type AIAssistantRequestInput = z.infer<typeof AIAssistantRequestSchema>;
