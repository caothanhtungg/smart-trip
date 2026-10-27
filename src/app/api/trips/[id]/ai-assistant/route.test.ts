import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

vi.mock('@/lib/api/auth-guard', () => ({
  isValidUuid: (id: string) => /^[0-9a-f-]{36}$/i.test(id),
  requireTripMembership: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    tripMember: {
      count: vi.fn(),
    },
  },
}));

vi.mock('@/lib/ai/travel-assistant-service', () => ({
  generateTravelSuggestions: vi.fn(),
}));

import { requireTripMembership } from '@/lib/api/auth-guard';
import { prisma } from '@/lib/db/prisma';
import { generateTravelSuggestions } from '@/lib/ai/travel-assistant-service';

describe('POST /api/trips/[id]/ai-assistant', () => {
  const tripId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('trả về 404 nếu tripId không phải UUID hợp lệ', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ message: 'Gợi ý homestay' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'invalid-id' }) });
    expect(res.status).toBe(404);
  });

  it('trả về 400 nếu câu hỏi bị trống', async () => {
    vi.mocked(requireTripMembership).mockResolvedValue({
      session: { id: 'session-1' } as any,
      user: { id: 'user-1' } as any,
      member: { id: 'member-1', role: 'MEMBER' } as any,
      trip: {
        id: tripId,
        title: 'Đà Lạt Mộng Mơ',
        destination: 'Đà Lạt',
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-04'),
      } as any,
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ message: '' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: tripId }) });
    expect(res.status).toBe(400);
  });

  it('trả về gợi ý thành công kèm ngữ cảnh chuyến đi', async () => {
    vi.mocked(requireTripMembership).mockResolvedValue({
      session: { id: 'session-1' } as any,
      user: { id: 'user-1' } as any,
      member: { id: 'member-1', role: 'MEMBER' } as any,
      trip: {
        id: tripId,
        title: 'Khám phá Đà Lạt',
        destination: 'Đà Lạt',
        startDate: new Date('2026-11-01'),
        endDate: new Date('2026-11-04'),
      } as any,
    });

    vi.mocked(prisma.tripMember.count).mockResolvedValue(4);

    vi.mocked(generateTravelSuggestions).mockResolvedValue({
      answer: 'Dưới đây là một số homestay tại Đà Lạt',
      suggestions: [
        {
          id: 'hs-1',
          name: 'The Kupid Hill',
          category: 'homestay',
          description: 'View đồi thông',
          estimatedCostMin: 350000,
          estimatedCostMax: 600000,
          latitude: 11.9281,
          longitude: 108.4485,
        },
      ],
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ message: 'Gợi ý homestay đẹp view đồi' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: tripId }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data.answer).toBe('Dưới đây là một số homestay tại Đà Lạt');
    expect(body.data.suggestions.length).toBe(1);
    expect(body.data.suggestions[0].name).toBe('The Kupid Hill');

    expect(generateTravelSuggestions).toHaveBeenCalledWith(
      'Gợi ý homestay đẹp view đồi',
      expect.objectContaining({
        id: tripId,
        destination: 'Đà Lạt',
        memberCount: 4,
      })
    );
  });
});
