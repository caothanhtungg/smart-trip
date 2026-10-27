import { AIAssistantResponse, AISuggestionItem, AITripContext } from '../types/ai-assistant';
import { formatVnd } from '../money/format';
import { VIETNAM_DESTINATIONS_DATA } from './vietnam-travel-data';

/**
 * Normalizes text for keyword matching: trims, lowercases, removes diacritics.
 */
export function normalizeVietnameseText(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
}

/**
 * Detects destination from text query or trip context.
 */
export function detectDestination(
  query: string,
  tripContext?: AITripContext
): { key: string; name: string } {
  const combined = `${query} ${tripContext?.destination ?? ''} ${tripContext?.title ?? ''}`;
  const normalized = normalizeVietnameseText(combined);

  for (const [key, data] of Object.entries(VIETNAM_DESTINATIONS_DATA)) {
    for (const alias of data.aliases) {
      const normAlias = normalizeVietnameseText(alias);
      if (normalized.includes(normAlias)) {
        return { key, name: data.name };
      }
    }
  }

  // Default to Da Lat if no destination explicitly mentioned
  return { key: 'dalat', name: VIETNAM_DESTINATIONS_DATA.dalat.name };
}

/**
 * Local travel engine answering user queries with structured suggestions
 * when offline or without Gemini API key.
 */
export function queryLocalTravelEngine(
  query: string,
  tripContext?: AITripContext
): AIAssistantResponse {
  const { key, name } = detectDestination(query, tripContext);
  const destData = VIETNAM_DESTINATIONS_DATA[key] || VIETNAM_DESTINATIONS_DATA.dalat;
  const normQuery = normalizeVietnameseText(query);

  const isBudget = /\b(chi phi|du toan|gia ca|bao nhieu tien|het bao nhieu|ngan sach)\b/.test(normQuery);
  const isHomestay = /\b(homestay|khach san|cho o|nghi ngoi|phong nghi|resort|nha nghi)\b/.test(normQuery);
  const isTransport = /\b(nha xe|xe khach|ve xe|limousine|di chuyen|di lai|tau hoa|chuyen xe)\b/.test(normQuery);
  const isFood = /\b(an|quan|am thuc|dac san|lau|mon|uong|am thuc)\b/.test(normQuery);
  const isAttraction = /\b(tham quan|diem den|check in|checkin|ngam canh|choi dau|choi gi|danh lam)\b/.test(normQuery);

  let suggestions: AISuggestionItem[] = [];
  let answer = '';

  if (isBudget) {
    // Combine representative items for a comprehensive estimate
    suggestions = [
      ...destData.transport.slice(0, 1),
      ...destData.homestays.slice(0, 1),
      ...destData.food.slice(0, 1),
      ...destData.attractions.slice(0, 1),
    ];
    const totalMin = suggestions.reduce((acc, item) => acc + (item.estimatedCostMin ?? 0), 0);
    const totalMax = suggestions.reduce((acc, item) => acc + (item.estimatedCostMax ?? 0), 0);

    answer = `Dự toán chi phí cơ bản cho chuyến đi ${name} (bao gồm vé xe, phòng nghỉ, ăn uống và tham quan) ước tính khoảng **${formatVnd(totalMin)} - ${formatVnd(totalMax)} / người**. Dưới đây là các khoản mục dự tính chi tiết:`;
  } else if (isHomestay && !isTransport) {
    suggestions = destData.homestays;
    const minCost = Math.min(...suggestions.map((s) => s.estimatedCostMin ?? 0));
    const maxCost = Math.max(...suggestions.map((s) => s.estimatedCostMax ?? 0));
    answer = `Dưới đây là một số homestay được đánh giá cao tại ${name} với mức giá dao động từ ${formatVnd(minCost)} đến ${formatVnd(maxCost)}/đêm. Bạn có thể bấm "Xem trên bản đồ" để định vị hoặc "Thêm vào lịch trình" để đưa vào kế hoạch chuyến đi nhé!`;
  } else if (isTransport) {
    suggestions = destData.transport;
    answer = `Để di chuyển đến ${name}, bạn có thể tham khảo các nhà xe uy tín với giá vé từ ${formatVnd(suggestions[0]?.estimatedCostMin ?? 250000)}/lượt. Hệ thống có sẵn thông tin liên hệ và vị trí bến xe đón trả khách:`;
  } else if (isFood) {
    suggestions = destData.food;
    answer = `Đến ${name} nhất định không nên bỏ qua các món ăn đặc sản sau đây. Bạn có thể bấm để xem vị trí quán ăn trên bản đồ hoặc lưu vào chi tiêu dự kiến:`;
  } else if (isAttraction) {
    suggestions = destData.attractions;
    answer = `Top địa điểm tham quan và check-in không thể bỏ lỡ tại ${name}:`;
  } else {
    // General overview recommendation
    suggestions = [
      ...destData.homestays.slice(0, 1),
      ...destData.transport.slice(0, 1),
      ...destData.attractions.slice(0, 1),
    ];
    answer = `Chào bạn! Đối với chuyến đi ${name}, tôi đã tổng hợp nhanh gợi ý về nơi lưu trú, phương tiện di chuyển và điểm tham quan tiêu biểu nhất dưới đây:`;
  }

  return {
    answer,
    suggestions,
  };
}
