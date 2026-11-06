import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/api/rate-limit', () => ({
  getClientIp: vi.fn(() => '127.0.0.1'),
  checkPostgresRateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 19,
    limit: 20,
    resetAt: new Date(Date.now() + 60_000),
  })),
}));
import { POST } from './route';

describe('Global AI Assistant API (POST /api/ai/assistant)', () => {
  it('returns 400 when message is missing or empty', async () => {
    const req = new Request('http://localhost:3000/api/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('generates travel suggestions for general queries even without trip context', async () => {
    const req = new Request('http://localhost:3000/api/ai/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Gợi ý homestay view đồi thông ở Đà Lạt',
        destination: 'Đà Lạt',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.answer).toBeDefined();
    expect(json.data.suggestions).toBeDefined();
    expect(Array.isArray(json.data.suggestions)).toBe(true);
  });
});
