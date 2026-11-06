import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';

vi.mock('@/lib/api/auth-guard', () => ({
  isValidUuid: (id: string) => /^[0-9a-f-]{36}$/i.test(id),
  requireTripMembership: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    itineraryItem: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { requireTripMembership, type TripMembershipAuth } from '@/lib/api/auth-guard';
import { prisma } from '@/lib/db/prisma';

function createMockMembershipAuth(tripId: string): TripMembershipAuth {
  return {
    session: { id: 'session-1' },
    user: { id: 'user-1' },
    member: { id: 'member-1', role: 'MEMBER' },
    trip: {
      id: tripId,
      status: 'ACTIVE',
      startDate: new Date('2026-10-25'),
      endDate: new Date('2026-10-30'),
    },
  } as unknown as TripMembershipAuth;
}

describe('POST /api/trips/[id]/itinerary/optimize', () => {
  const tripId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('trả về 400 nếu ngày không hợp lệ', async () => {
    vi.mocked(requireTripMembership).mockResolvedValue(createMockMembershipAuth(tripId));

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ dayDate: 'invalid-date' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: tripId }) });
    expect(res.status).toBe(400);
  });

  it('tối ưu lại thứ tự và cập nhật sortOrder thành công', async () => {
    vi.mocked(requireTripMembership).mockResolvedValue(createMockMembershipAuth(tripId));

    const mockItems = [
      { id: 'p1', latitude: 11.940, longitude: 108.440, isLocked: true, sortOrder: 0 },
      { id: 'p4', latitude: 11.940, longitude: 108.500, isLocked: false, sortOrder: 1 },
      { id: 'p3', latitude: 11.940, longitude: 108.450, isLocked: false, sortOrder: 2 },
      { id: 'p2', latitude: 11.940, longitude: 108.480, isLocked: false, sortOrder: 3 },
    ];

    vi.mocked(prisma.itineraryItem.findMany).mockResolvedValue(
      mockItems as unknown as Awaited<ReturnType<typeof prisma.itineraryItem.findMany>>
    );
    type TransactionCallback = Parameters<typeof prisma.$transaction>[0];
    vi.mocked(prisma.$transaction).mockImplementation(async (cb: TransactionCallback) => {
      if (typeof cb === 'function') {
        const txMock = {
          itineraryItem: {
            update: vi.fn(),
          },
        };
        return cb(txMock as unknown as Parameters<TransactionCallback>[0]);
      }
      return cb;
    });

    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ dayDate: '2026-10-27' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: tripId }) });
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.map((item: { id: string }) => item.id)).toEqual(['hotel', 'mid_east', 'far_east', 'farther_east'].map(k => {
      if (k === 'hotel') return 'p1';
      if (k === 'mid_east') return 'p3';
      if (k === 'far_east') return 'p2';
      return 'p4';
    }));
  });
});
