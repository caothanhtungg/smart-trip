import { describe, expect, it } from 'vitest';
import { AIAssistantRequestSchema } from './ai-assistant';

describe('AIAssistantRequestSchema', () => {
  it('passes on valid message without trip context', () => {
    const result = AIAssistantRequestSchema.safeParse({
      message: 'Gợi ý homestay Đà Lạt đẹp giá dưới 500k',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toBe('Gợi ý homestay Đà Lạt đẹp giá dưới 500k');
    }
  });

  it('passes on valid message with full trip context', () => {
    const result = AIAssistantRequestSchema.safeParse({
      message: 'Tìm xe khách đi Sa Pa xuất phát từ Hà Nội',
      tripContext: {
        id: 'trip-1',
        title: 'Chuyến đi Sa Pa',
        destination: 'Sa Pa, Lào Cai',
        startDate: '2026-11-01',
        endDate: '2026-11-03',
        memberCount: 4,
      },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tripContext?.destination).toBe('Sa Pa, Lào Cai');
      expect(result.data.tripContext?.memberCount).toBe(4);
    }
  });

  it('fails when message is empty or whitespace only', () => {
    const emptyResult = AIAssistantRequestSchema.safeParse({ message: '' });
    expect(emptyResult.success).toBe(false);

    const spaceResult = AIAssistantRequestSchema.safeParse({ message: '   ' });
    expect(spaceResult.success).toBe(false);
  });

  it('fails when message exceeds 500 characters', () => {
    const longMessage = 'a'.repeat(501);
    const result = AIAssistantRequestSchema.safeParse({ message: longMessage });
    expect(result.success).toBe(false);
  });
});
