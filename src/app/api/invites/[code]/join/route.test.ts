import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import {
  requireAuth,
  UnauthorizedError,
  type AuthUser,
  type AuthSession,
} from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

vi.mock("@/lib/auth/session", () => ({
  requireAuth: vi.fn(),
  UnauthorizedError: class UnauthorizedError extends Error {
    constructor(message = "Yêu cầu đăng nhập để thực hiện thao tác này.") {
      super(message);
      this.name = "UnauthorizedError";
    }
  },
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    trip: {
      findUnique: vi.fn(),
    },
    tripMember: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));

describe("POST /api/invites/[code]/join Route Handler", () => {
  const mockUser: AuthUser = {
    id: "usr-guest-join-123",
    email: "guest@example.com",
    name: "Lê Văn Khách",
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    image: "https://example.com/guest.png",
    displayName: "Khách",
    bankBin: null,
    bankAccountNo: null,
    bankAccountName: null,
    bankAccountKeyVersion: 1,
  };

  const mockSession: AuthSession = {
    id: "sess-join-1",
    userId: mockUser.id,
    token: "tok-join-1",
    expiresAt: new Date(Date.now() + 3600000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
  };

  const VALID_INVITE_CODE = "ABCDEF-234567";
  const VALID_TRIP_ID = "11111111-2222-4333-8444-555555555555";

  const mockDbTrip = {
    id: VALID_TRIP_ID,
    name: "Đà Lạt Mộng Mơ 3N2Đ",
    status: "ACTIVE" as const,
    inviteCode: VALID_INVITE_CODE,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({
      user: mockUser,
      session: mockSession,
    });
    vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
      return (callback as (tx: typeof prisma) => Promise<unknown>)(prisma);
    });
  });

  it("returns 401 UNAUTHORIZED when caller is not authenticated", async () => {
    vi.mocked(requireAuth).mockRejectedValueOnce(new UnauthorizedError());

    const req = new Request("http://localhost/api/invites/ABCDEF-234567/join", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ code: "ABCDEF-234567" }) });
    expect(res.status).toBe(401);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 VALIDATION_ERROR when invite code format is invalid", async () => {
    const req = new Request("http://localhost/api/invites/bad_code_!/join", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ code: "bad_code_!" }) });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("returns 404 NOT_FOUND when trip with invite code does not exist", async () => {
    vi.mocked(prisma.trip.findUnique).mockResolvedValueOnce(null);

    const req = new Request("http://localhost/api/invites/ABCDEF-234567/join", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ code: "ABCDEF-234567" }) });
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toContain("Không tìm thấy");
  });

  it("returns 400 BAD_REQUEST when trip status is not ACTIVE (e.g. SETTLING)", async () => {
    vi.mocked(prisma.trip.findUnique)
      .mockResolvedValueOnce({ id: VALID_TRIP_ID } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
      .mockResolvedValueOnce({ ...mockDbTrip, status: "SETTLING" } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

    const req = new Request("http://localhost/api/invites/ABCDEF-234567/join", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ code: "ABCDEF-234567" }) });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("BAD_REQUEST");
    expect(body.error.message).toContain("lên kế hoạch");
  });

  it("returns 409 CONFLICT when user is already an ACTIVE member in the trip", async () => {
    vi.mocked(prisma.trip.findUnique)
      .mockResolvedValueOnce({ id: VALID_TRIP_ID } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
      .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

    vi.mocked(prisma.tripMember.findFirst).mockResolvedValueOnce({
      id: "mem-active-123",
      userId: mockUser.id,
      status: "ACTIVE",
    } as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>);

    const req = new Request("http://localhost/api/invites/ABCDEF-234567/join", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ code: "ABCDEF-234567" }) });
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("ALREADY_MEMBER");
    expect(body.error.message).toContain("đã là thành viên");
  });

  it("re-activates membership with 200 OK when user previously LEFT the trip", async () => {
    const reactivatedMember = {
      id: "mem-old-123",
      tripId: VALID_TRIP_ID,
      userId: mockUser.id,
      displayName: "Khách Cũ",
      role: "MEMBER" as const,
      status: "ACTIVE" as const,
      joinOrder: 5,
      joinedAt: new Date("2026-10-20T12:00:00Z"),
      leftAt: null,
    };

    vi.mocked(prisma.trip.findUnique)
      .mockResolvedValueOnce({ id: VALID_TRIP_ID } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
      .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

    vi.mocked(prisma.tripMember.findFirst)
      .mockResolvedValueOnce({
        id: "mem-old-123",
        userId: mockUser.id,
        status: "LEFT",
        displayName: "Khách Cũ",
      } as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>)
      .mockResolvedValueOnce({
        joinOrder: 4,
      } as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>);

    vi.mocked(prisma.tripMember.update).mockResolvedValueOnce(
      reactivatedMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.update>>
    );

    const req = new Request("http://localhost/api/invites/ABCDEF-234567/join", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ code: "ABCDEF-234567" }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.isRejoined).toBe(true);
    expect(body.data.memberId).toBe("mem-old-123");
    expect(body.data.joinOrder).toBe(5);
    expect(body.message).toContain("quay trở lại");
  });

  it("creates new TripMember with 201 CREATED and assigns joinOrder = max + 1", async () => {
    const createdMember = {
      id: "mem-new-456",
      tripId: VALID_TRIP_ID,
      userId: mockUser.id,
      displayName: "Khách",
      role: "MEMBER" as const,
      status: "ACTIVE" as const,
      joinOrder: 4,
      joinedAt: new Date("2026-10-20T12:00:00Z"),
      leftAt: null,
    };

    vi.mocked(prisma.trip.findUnique)
      .mockResolvedValueOnce({ id: VALID_TRIP_ID } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
      .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

    vi.mocked(prisma.tripMember.findFirst)
      .mockResolvedValueOnce(null) // existingMember: null
      .mockResolvedValueOnce({ joinOrder: 3 } as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>) // maxMember: 3
      .mockResolvedValueOnce(null); // name conflict check: null

    vi.mocked(prisma.tripMember.create).mockResolvedValueOnce(
      createdMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.create>>
    );

    const req = new Request("http://localhost/api/invites/ABCDEF-234567/join", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ code: "ABCDEF-234567" }) });
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.isRejoined).toBe(false);
    expect(body.data.memberId).toBe("mem-new-456");
    expect(body.data.displayName).toBe("Khách");
    expect(body.data.joinOrder).toBe(4);
    expect(body.message).toContain("thành công");
  });

  it("resolves duplicate display_name by automatically appending numeric suffix", async () => {
    const createdMember = {
      id: "mem-new-789",
      tripId: VALID_TRIP_ID,
      userId: mockUser.id,
      displayName: "Khách (2)",
      role: "MEMBER" as const,
      status: "ACTIVE" as const,
      joinOrder: 2,
      joinedAt: new Date("2026-10-20T12:00:00Z"),
      leftAt: null,
    };

    vi.mocked(prisma.trip.findUnique)
      .mockResolvedValueOnce({ id: VALID_TRIP_ID } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
      .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

    vi.mocked(prisma.tripMember.findFirst)
      .mockResolvedValueOnce(null) // existingMember: null
      .mockResolvedValueOnce({ joinOrder: 1 } as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>) // maxMember: 1
      .mockResolvedValueOnce({ id: "mem-existing-1" } as unknown as Awaited<ReturnType<typeof prisma.tripMember.findFirst>>) // "Khách" exists!
      .mockResolvedValueOnce(null); // "Khách (2)" is free!

    vi.mocked(prisma.tripMember.create).mockResolvedValueOnce(
      createdMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.create>>
    );

    const req = new Request("http://localhost/api/invites/ABCDEF-234567/join", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ code: "ABCDEF-234567" }) });
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.displayName).toBe("Khách (2)");
  });

  it("maps user_id unique constraint violation (P2002) to 409 ConflictError", async () => {
    const p2002UserError = {
      code: "P2002",
      meta: {
        target: ["trip_id", "user_id"],
        constraint: "trip_members_trip_id_user_id_key",
      },
    };

    vi.mocked(prisma.$transaction).mockRejectedValueOnce(p2002UserError);

    const req = new Request("http://localhost/api/invites/ABCDEF-234567/join", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ code: "ABCDEF-234567" }) });
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("ALREADY_MEMBER");
    expect(body.error.message).toContain("đã là thành viên");
  });

  it("maps display_name unique constraint violation (P2002) to 409 with code CONFLICT", async () => {
    const p2002NameError = {
      code: "P2002",
      meta: {
        target: ["trip_id", "display_name"],
        constraint: "trip_members_trip_id_display_name_key",
      },
    };

    vi.mocked(prisma.$transaction).mockRejectedValueOnce(p2002NameError);

    const req = new Request("http://localhost/api/invites/ABCDEF-234567/join", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ code: "ABCDEF-234567" }) });
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("CONFLICT");
    expect(body.error.code).not.toBe("ALREADY_MEMBER");
    expect(body.error.message).toContain("Tên hiển thị này đã được sử dụng");
  });

  it("maps join_order unique constraint violation (P2002) to 409 ConflictError", async () => {
    const p2002JoinOrderError = {
      code: "P2002",
      meta: {
        target: ["trip_id", "join_order"],
        constraint: "trip_members_trip_id_join_order_key",
      },
    };

    vi.mocked(prisma.$transaction).mockRejectedValueOnce(p2002JoinOrderError);

    const req = new Request("http://localhost/api/invites/ABCDEF-234567/join", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ code: "ABCDEF-234567" }) });
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("CONFLICT");
    expect(body.error.code).not.toBe("ALREADY_MEMBER");
    expect(body.error.message).toContain("xung đột thứ tự tham gia");
  });

  it("re-throws unrelated database errors without masking them", async () => {
    const dbCrashError = new Error("Connection reset by peer");
    vi.mocked(prisma.$transaction).mockRejectedValueOnce(dbCrashError);

    const req = new Request("http://localhost/api/invites/ABCDEF-234567/join", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ code: "ABCDEF-234567" }) });
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
  });

  it("canonicalizes unhyphenated code and joins trip using canonical hyphenated format", async () => {
    const createdMember = {
      id: "mem-new-unhyphenated",
      tripId: VALID_TRIP_ID,
      userId: mockUser.id,
      displayName: "Khách",
      role: "MEMBER" as const,
      status: "ACTIVE" as const,
      joinOrder: 1,
      joinedAt: new Date("2026-10-20T12:00:00Z"),
      leftAt: null,
    };

    vi.mocked(prisma.trip.findUnique)
      .mockResolvedValueOnce({ id: VALID_TRIP_ID } as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>)
      .mockResolvedValueOnce(mockDbTrip as unknown as Awaited<ReturnType<typeof prisma.trip.findUnique>>);

    vi.mocked(prisma.tripMember.findFirst)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    vi.mocked(prisma.tripMember.create).mockResolvedValueOnce(
      createdMember as unknown as Awaited<ReturnType<typeof prisma.tripMember.create>>
    );

    const req = new Request("http://localhost/api/invites/abcdef234567/join", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ code: "abcdef234567" }) });
    expect(res.status).toBe(201);

    expect(prisma.trip.findUnique).toHaveBeenCalledWith({
      where: { inviteCode: "ABCDEF-234567" },
      select: expect.any(Object),
    });
  });
});
