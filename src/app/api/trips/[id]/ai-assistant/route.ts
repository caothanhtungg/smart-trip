import {
  apiError,
  apiSuccess,
  handleApiError,
  parseJsonBody,
  NotFoundError,
} from '@/lib/api';
import { requireTripMembership, isValidUuid } from '@/lib/api/auth-guard';
import { prisma } from '@/lib/db/prisma';
import { AIAssistantRequestSchema } from '@/lib/validation/ai-assistant';
import { generateTravelSuggestions } from '@/lib/ai/travel-assistant-service';
import { AITripContext } from '@/lib/types/ai-assistant';
import { checkPostgresRateLimit } from '@/lib/api/rate-limit';

export const TRIP_AI_RATE_LIMIT = 30;
export const TRIP_AI_RATE_LIMIT_WINDOW_SECONDS = 60;

interface RouteContext {
  params: Promise<{ id: string }> | { id: string };
}

/**
 * POST /api/trips/[id]/ai-assistant
 * Hỏi đáp với AI Trợ lý du lịch theo ngữ cảnh chuyến đi.
 */
export async function POST(
  req: Request,
  context: RouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const tripId = params.id;

    if (!tripId || !isValidUuid(tripId)) {
      throw new NotFoundError('Không tìm thấy chuyến đi.');
    }

    // Xác thực người dùng và quyền thành viên trước khi dùng quota AI.
    const { trip, user } = await requireTripMembership(tripId, { customHeaders: req.headers });

    const input = await parseJsonBody(req, AIAssistantRequestSchema);
    const rateLimit = await checkPostgresRateLimit({
      key: `ai:trip:user:${user.id}:trip:${tripId}`,
      limit: TRIP_AI_RATE_LIMIT,
      windowSeconds: TRIP_AI_RATE_LIMIT_WINDOW_SECONDS,
    });
    if (!rateLimit.allowed) {
      const retryAfterSeconds = Math.max(1, Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000));
      return apiError("Bạn đã gửi quá nhiều câu hỏi AI cho chuyến đi này. Vui lòng thử lại sau.", {
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

    // Lấy số lượng thành viên trong chuyến đi
    const memberCount = await prisma.tripMember.count({
      where: { tripId },
    });

    const tripContext: AITripContext = {
      id: trip.id,
      title: trip.name,
      destination: trip.destination || undefined,
      startDate: trip.startDate ? trip.startDate.toISOString().split('T')[0] : undefined,
      endDate: trip.endDate ? trip.endDate.toISOString().split('T')[0] : undefined,
      memberCount: memberCount || 1,
    };

    const result = await generateTravelSuggestions(input.message, tripContext);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
