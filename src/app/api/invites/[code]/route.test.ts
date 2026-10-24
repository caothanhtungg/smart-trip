import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { prisma } from "@/lib/db/prisma";
import * as rateLimitModule from "@/lib/api/rate-limit";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    trip: {
      findUnique: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

describe("GET /api/invites/[code] Route Handler", () => {
  const VALID_INVITE_CODE = "ABCDEF-234567";
  const VALID_TRIP_ID = "11111111-2222-4333-8444-555555555555";

  const mockDbTrip = {
    id: VALID_TRIP_ID,
    name: "Đà Lạt Mộng Mơ 3N2Đ",
    destination: "Lâm Đồng, Đà Lạt",
    startDate: new Date("2026-11-20T00:00:00Z"),
    endDate: new Date("2026-11-23T00:00:00Z"),
    budgetAmount: 15000000, // Nhạy cảm, tuyệt đối không được trả về
    status: "ACTIVE" as const,
    inviteCode: VALID_INVITE_CODE,
    createdAt: new Date(),
    updatedAt: new Date(),
    members: [
      {
        id: "mem-host-1",
        userId: "usr-host-1",
        displayName: "Trần Văn Host",
        role: "HOST" as const,
        joinOrder: 1,
        user: {
          image: "https://example.com/host.png",
        },
      },
      {
        id: "mem-member-2",
        userId: "usr-member-2",
        displayName: "Lê Thị Lan",
        role: "MEMBER" as const,
        joinOrder: 2,
        user: {
          image: "https://example.com/lan.png",
        },
      },
      {
        id: "mem-placeholder-3",
        userId: null, // Placeholder member
        displayName: "Bạn Nam (Chưa có tài khoản)",
        role: "MEMBER" as const,
        joinOrder: 3,
        user: null,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default rate limit mock: allowed = true
    vi.spyOn(rateLimitModule, "checkPostgresRateLimit").mockResolvedValue({
      allowed: true,
      count: 1,
      remaining: 9,
      resetAt: new Date(Date.now() + 60000),
      limit: 10,
    });
  });

  it("returns 429 TOO_MANY_REQUESTS with Retry-After when rate limit is exceeded", async () => {
    const mockResetAt = new Date(Date.now() + 25000);
    vi.spyOn(rateLimitModule, "checkPostgresRateLimit").mockResolvedValueOnce({
      allowed: false,
      count: 11,
      remaining: 0,
      resetAt: mockResetAt,
      limit: 10,
    });

    const req = new Request("http://localhost/api/invites/ABCDEF-234567", {
      headers: { "x-forwarded-for": "203.0.113.1" },
    });

    const res = await GET(req, { params: Promise.resolve({ code: "ABCDEF-234567" }) });
    expect(res.status).toBe(429);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("TOO_MANY_REQUESTS");
    expect(res.headers.get("Retry-After")).toBeDefined();
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(res.headers.get("X-RateLimit-Limit")).toBe("10");
  });

  it("fails safely and returns 500 when rate limit checking encounters database error", async () => {
    vi.spyOn(rateLimitModule, "checkPostgresRateLimit").mockRejectedValueOnce(
      new Error("Postgres connection dropped")
    );

    const req = new Request("http://localhost/api/invites/ABCDEF-234567");
    const res = await GET(req, { params: Promise.resolve({ code: "ABCDEF-234567" }) });
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.success).toBe(false);
  });

  it("returns 400 VALIDATION_ERROR when invite code format is invalid", async () => {
    const req = new Request("http://localhost/api/invites/invalid_code_#123");
    const res = await GET(req, { params: Promise.resolve({ code: "invalid_code_#123" }) });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("returns 404 NOT_FOUND when trip with invite code does not exist in DB", async () => {
    vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(null);

    const req = new Request("http://localhost/api/invites/ABCDEF-234567");
    const res = await GET(req, { params: Promise.resolve({ code: "ABCDEF-234567" }) });
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toContain("không tồn tại");
  });

  it("returns 410 GONE when trip status is ARCHIVED", async () => {
    vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce({
      ...mockDbTrip,
      status: "ARCHIVED",
    } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

    const req = new Request("http://localhost/api/invites/ABCDEF-234567");
    const res = await GET(req, { params: Promise.resolve({ code: "ABCDEF-234567" }) });
    expect(res.status).toBe(410);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("GONE");
    expect(body.error.message).toContain("lưu trữ hoặc đóng tham gia");
  });

  it("returns 200 with isJoinable = false when trip status is SETTLING or COMPLETED", async () => {
    vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce({
      ...mockDbTrip,
      status: "SETTLING",
    } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

    const req = new Request("http://localhost/api/invites/ABCDEF-234567");
    const res = await GET(req, { params: Promise.resolve({ code: "ABCDEF-234567" }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.isJoinable).toBe(false);
    expect(body.data.status).toBe("SETTLING");
  });

  it("returns 200 with sanitized preview data and isJoinable = true for ACTIVE trip", async () => {
    vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
      mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
    );

    const req = new Request("http://localhost/api/invites/ABCDEF-234567");
    const res = await GET(req, { params: Promise.resolve({ code: "ABCDEF-234567" }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);

    const data = body.data;
    expect(data.id).toBe(VALID_TRIP_ID);
    expect(data.name).toBe("Đà Lạt Mộng Mơ 3N2Đ");
    expect(data.destination).toBe("Lâm Đồng, Đà Lạt");
    expect(data.hostName).toBe("Trần Văn Host");
    expect(data.hostAvatarUrl).toBe("https://example.com/host.png");
    expect(data.memberCount).toBe(3);
    expect(data.isJoinable).toBe(true);
    expect(data.inviteCode).toBe(VALID_INVITE_CODE);

    // Kiểm tra danh sách claimablePlaceholders
    expect(data.claimablePlaceholders).toHaveLength(1);
    expect(data.claimablePlaceholders[0]).toEqual({
      id: "mem-placeholder-3",
      displayName: "Bạn Nam (Chưa có tài khoản)",
    });

    // BẢO MẬT: Khẳng định tuyệt đối không để lộ thông tin nhạy cảm
    expect(data.budgetAmount).toBeUndefined();
    expect(data.expenses).toBeUndefined();
    expect(data.itinerary).toBeUndefined();
    expect(data.bankBin).toBeUndefined();
    expect(data.bankAccountNo).toBeUndefined();

    // Trong danh sách members không để lộ userId hay email
    for (const member of data.members) {
      expect(member.userId).toBeUndefined();
      expect(member.email).toBeUndefined();
    }
  });

  it("normalizes invite code (uppercase and stripping extra whitespace) before querying DB", async () => {
    vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
      mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
    );

    const req = new Request("http://localhost/api/invites/abcdef-234567");
    const res = await GET(req, { params: Promise.resolve({ code: "  abcdef-234567  " }) });
    expect(res.status).toBe(200);

    expect(prisma.trip.findUnique).toHaveBeenCalledWith({
      where: { inviteCode: "ABCDEF-234567" },
      select: expect.any(Object),
    });
  });

  it("canonicalizes unhyphenated code and queries DB with hyphenated canonical format", async () => {
    vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(
      mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>
    );

    const req = new Request("http://localhost/api/invites/abcdef234567");
    const res = await GET(req, { params: Promise.resolve({ code: "abcdef234567" }) });
    expect(res.status).toBe(200);

    expect(prisma.trip.findUnique).toHaveBeenCalledWith({
      where: { inviteCode: "ABCDEF-234567" },
      select: expect.any(Object),
    });
  });
});
