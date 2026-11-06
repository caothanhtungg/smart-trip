import {
  apiError,
  apiSuccess,
  handleApiError,
  parseJsonBody,
} from '@/lib/api';
import { z } from 'zod';
import { generateTravelSuggestions } from '@/lib/ai/travel-assistant-service';
import { AITripContext } from '@/lib/types/ai-assistant';
import { checkPostgresRateLimit, getClientIp } from '@/lib/api/rate-limit';

export const GLOBAL_AI_RATE_LIMIT = 20;
export const AI_RATE_LIMIT_WINDOW_SECONDS = 60;

const GlobalAIAssistantSchema = z.object({
  message: z
    .string({ required_error: 'Vui lòng nhập câu hỏi' })
    .trim()
    .min(1, 'Câu hỏi không được để trống')
    .max(500, 'Câu hỏi tối đa 500 ký tự'),
  destination: z.string().optional(),
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

/**
 * POST /api/ai/assistant
 * Global AI Assistant endpoint for travel queries across Vietnam.
 */
export async function POST(req: Request): Promise<Response> {
  try {
    const input = await parseJsonBody(req, GlobalAIAssistantSchema);
    const rateLimit = await checkPostgresRateLimit({
      key: `ai:global:ip:${getClientIp(req)}`,
      limit: GLOBAL_AI_RATE_LIMIT,
      windowSeconds: AI_RATE_LIMIT_WINDOW_SECONDS,
    });
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000));
      return apiError("Bạn đã gửi quá nhiều câu hỏi AI. Vui lòng thử lại sau.", {
        status: 429,
        code: "TOO_MANY_REQUESTS",
        headers: {
          "Retry-After": String(retryAfterSeconds),
          "X-RateLimit-Limit": String(rateLimit.limit),
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetAt.getTime() / 1000)),
        },
      });
    }

    const context: AITripContext | undefined = input.tripContext || (input.destination ? { destination: input.destination } : undefined);

    const result = await generateTravelSuggestions(input.message, context);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
