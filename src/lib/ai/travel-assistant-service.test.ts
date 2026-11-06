import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateTravelSuggestions, parseGeminiResponse } from './travel-assistant-service';

describe('Travel Assistant Service', () => {
  const originalEnv = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.GEMINI_API_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.GEMINI_API_KEY = originalEnv;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
  });

  describe('parseGeminiResponse', () => {
    it('parses valid JSON response text', () => {
      const raw = JSON.stringify({
        answer: 'Gợi ý homestay cho bạn',
        suggestions: [
          {
            id: '1',
            name: 'Homestay Mây',
            category: 'homestay',
            description: 'Đẹp và rẻ',
            estimatedCostMin: 200000,
            estimatedCostMax: 400000,
            address: 'Đà Lạt',
            latitude: 11.9,
            longitude: 108.4,
          },
        ],
      });

      const parsed = parseGeminiResponse(raw);
      expect(parsed).not.toBeNull();
      expect(parsed?.answer).toBe('Gợi ý homestay cho bạn');
      expect(parsed?.suggestions.length).toBe(1);
      expect(parsed?.suggestions[0].name).toBe('Homestay Mây');
      expect(parsed?.suggestions[0].latitude).toBe(11.9);
    });

    it('strips markdown code fences before parsing', () => {
      const raw = '```json\n{"answer": "Có markdown", "suggestions": []}\n```';
      const parsed = parseGeminiResponse(raw);
      expect(parsed?.answer).toBe('Có markdown');
    });

    it('returns null for invalid JSON or missing answer', () => {
      expect(parseGeminiResponse('not a json')).toBeNull();
      expect(parseGeminiResponse('{"suggestions": []}')).toBeNull();
    });
  });

  describe('generateTravelSuggestions', () => {
    it('falls back to local travel engine when GEMINI_API_KEY is not set', async () => {
      const res = await generateTravelSuggestions('Tìm homestay Đà Lạt');
      expect(res.answer).toContain('Đà Lạt');
      expect(res.suggestions.length).toBeGreaterThan(0);
      expect(res.suggestions[0].category).toBe('homestay');
    });

    it('uses Gemini API when GEMINI_API_KEY is set and response is successful', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const mockResponseText = JSON.stringify({
        answer: 'Chào bạn, đây là các gợi ý từ Gemini AI',
        suggestions: [
          {
            id: 'gemini-1',
            name: 'Khách sạn Sa Pa Horizon',
            category: 'homestay',
            description: 'Khách sạn view Fansipan tuyệt đẹp',
            estimatedCostMin: 700000,
            estimatedCostMax: 1200000,
            address: '018 Phạm Xuân Huân, Sa Pa',
            latitude: 22.3364,
            longitude: 103.8438,
          },
        ],
      });

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: mockResponseText }],
              },
            },
          ],
        }),
      });

      const res = await generateTravelSuggestions(
        'Gợi ý khách sạn Sa Pa cao cấp',
        { destination: 'Sa Pa' },
        mockFetch as unknown as typeof fetch
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(res.answer).toBe('Chào bạn, đây là các gợi ý từ Gemini AI');
      expect(res.suggestions[0].name).toBe('Khách sạn Sa Pa Horizon');
      expect(res.suggestions[0].estimatedCostMin).toBe(700000);
    });

    it('falls back to local engine when Gemini returns HTTP 500 error', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const res = await generateTravelSuggestions(
        'Tìm nhà xe đi Sa Pa',
        { destination: 'Sa Pa' },
        mockFetch as unknown as typeof fetch
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      // Fallback response from local engine
      expect(res.suggestions.length).toBeGreaterThan(0);
      expect(res.suggestions[0].category).toBe('transport');
    });

    it('falls back to local engine when fetch throws network error', async () => {
      process.env.GEMINI_API_KEY = 'test-gemini-key';

      const mockFetch = vi.fn().mockRejectedValue(new Error('Network offline'));

      const res = await generateTravelSuggestions(
        'Món ngon Đà Nẵng',
        { destination: 'Đà Nẵng' },
        mockFetch as unknown as typeof fetch
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(res.suggestions.length).toBeGreaterThan(0);
      expect(res.suggestions[0].category).toBe('food');
    });
  });
});
