import {
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

    // Xác thực người dùng và quyền thành viên
    const { trip } = await requireTripMembership(tripId);

    const input = await parseJsonBody(req, AIAssistantRequestSchema);

    // Lấy số lượng thành viên trong chuyến đi
    const memberCount = await prisma.tripMember.count({
      where: { tripId },
    });

    const tripContext: AITripContext = {
      id: trip.id,
      title: trip.title,
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
