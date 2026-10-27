import { AIAssistantResponse, AISuggestionItem, AITripContext } from '../types/ai-assistant';
import { queryLocalTravelEngine } from './local-travel-engine';

/**
 * Builds the system instruction prompt guiding Gemini to return structured travel suggestions.
 */
function buildSystemPrompt(tripContext?: AITripContext): string {
  const contextStr = tripContext
    ? `Chuyến đi: "${tripContext.title ?? 'Chưa đặt tên'}" | Điểm đến: "${tripContext.destination ?? 'Chưa xác định'}" | Thời gian: ${tripContext.startDate ?? '?'} đến ${tripContext.endDate ?? '?'} | Số người: ${tripContext.memberCount ?? 1}`
    : 'Không có ngữ cảnh chuyến đi cụ thể.';

  return `Bạn là Trợ lý AI du lịch chuyên nghiệp của ứng dụng Smart Trip tại Việt Nam.
Nhiệm vụ của bạn: Tư vấn điểm đến, homestay/khách sạn, nhà xe/vé xe, ăn uống, và dự toán chi phí chính xác bằng VND.

Ngữ cảnh chuyến đi:
${contextStr}

Yêu cầu định dạng:
Bạn BẮT BUỘC chỉ trả về định dạng JSON thuần túy (không bọc trong \`\`\`json) với cấu trúc:
{
  "answer": "Câu trả lời bằng tiếng Việt thân thiện, súc tích, giải thích chi tiết các gợi ý",
  "suggestions": [
    {
      "id": "mã_duy_nhất",
      "name": "Tên địa điểm hoặc nhà xe",
      "category": "homestay" | "transport" | "food" | "attraction" | "other",
      "description": "Mô tả ngắn gọn đặc điểm nổi bật hoặc điểm cộng",
      "estimatedCostMin": 250000,
      "estimatedCostMax": 500000,
      "address": "Địa chỉ cụ thể tại Việt Nam",
      "latitude": 11.9404,
      "longitude": 108.4583,
      "contactInfo": "Số điện thoại hoặc hotline nếu có"
    }
  ]
}`;
}

/**
 * Parses and sanitizes raw JSON string returned by Gemini.
 */
export function parseGeminiResponse(rawText: string): AIAssistantResponse | null {
  try {
    const cleaned = rawText
      .replace(/^```json/i, '')
      .replace(/^```/i, '')
      .replace(/```$/i, '')
      .trim();

    const parsed = JSON.parse(cleaned);
    if (!parsed || typeof parsed.answer !== 'string') {
      return null;
    }

    const suggestions: AISuggestionItem[] = Array.isArray(parsed.suggestions)
      ? parsed.suggestions.map((item: any, index: number) => ({
          id: String(item.id || `sugg-${Date.now()}-${index}`),
          name: String(item.name || 'Địa điểm đề xuất'),
          category: ['homestay', 'transport', 'food', 'attraction', 'other'].includes(item.category)
            ? item.category
            : 'other',
          description: String(item.description || ''),
          estimatedCostMin: typeof item.estimatedCostMin === 'number' ? item.estimatedCostMin : undefined,
          estimatedCostMax: typeof item.estimatedCostMax === 'number' ? item.estimatedCostMax : undefined,
          address: item.address ? String(item.address) : undefined,
          latitude: typeof item.latitude === 'number' ? item.latitude : undefined,
          longitude: typeof item.longitude === 'number' ? item.longitude : undefined,
          contactInfo: item.contactInfo ? String(item.contactInfo) : undefined,
        }))
      : [];

    return {
      answer: parsed.answer,
      suggestions,
    };
  } catch {
    return null;
  }
}

/**
 * Generates travel suggestions using Google Gemini REST API,
 * with automatic fallback to local knowledge engine.
 */
export async function generateTravelSuggestions(
  query: string,
  tripContext?: AITripContext,
  fetchFn: typeof fetch = fetch
): Promise<AIAssistantResponse> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // If no API key configured, use local engine immediately
  if (!apiKey) {
    return queryLocalTravelEngine(query, tripContext);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);

    const res = await fetchFn(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: buildSystemPrompt(tripContext) }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: query }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[AI Assistant] Gemini API error status ${res.status}, falling back to local engine.`);
      return queryLocalTravelEngine(query, tripContext);
    }

    const data = await res.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText) {
      return queryLocalTravelEngine(query, tripContext);
    }

    const parsed = parseGeminiResponse(candidateText);
    return parsed || queryLocalTravelEngine(query, tripContext);
  } catch (error) {
    console.warn('[AI Assistant] Gemini request failed or timed out, falling back to local engine:', error);
    return queryLocalTravelEngine(query, tripContext);
  }
}
