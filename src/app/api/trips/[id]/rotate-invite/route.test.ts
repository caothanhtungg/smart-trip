import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { requireTripMembership, type TripMembershipAuth } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/api";
import { BASE31_INVITE_ALPHABET } from "@/lib/trips/invite-code";

vi.mock("@/lib/api/auth-guard", () => ({
  requireTripMembership: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    trip: {
      update: vi.fn(),
    },
  },
}));

describe("POST /api/trips/[id]/rotate-invite (UC28 Rotate Invite Code)", () => {
  const TRIP_ID = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTripActive = {
    id: TRIP_ID,
    name: "Đà Lạt 3N2Đ",
    destination: "Đà Lạt",
    startDate: new Date("2026-11-01"),
    endDate: new Date("2026-11-03"),
    budgetAmount: 5000000,
    status: "ACTIVE" as const,
    inviteCode: "OLDCOD-123456",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockHostAuth: TripMembershipAuth = {
    user: { id: "usr-host", name: "Host User", email: "host@example.com" } as unknown as TripMembershipAuth["user"],
    session: { id: "sess-1", userId: "usr-host" } as unknown as TripMembershipAuth["session"],
    member: { id: "mem-host", tripId: TRIP_ID, userId: "usr-host", role: "HOST", status: "ACTIVE" } as unknown as TripMembershipAuth["member"],
    trip: mockTripActive as unknown as TripMembershipAuth["trip"],
  };

  it("returns 400 when tripId is not a valid UUID", async () => {
    const req = new Request("http://localhost/api/trips/invalid-id/rotate-invite", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: "invalid-id" }) });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when trip does not exist", async () => {
    vi.mocked(requireTripMembership).mockRejectedValueOnce(
      new NotFoundError("Không tìm thấy chuyến đi.")
    );

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/rotate-invite`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 403 when requester is MEMBER, not HOST", async () => {
    vi.mocked(requireTripMembership).mockRejectedValueOnce(
      new ForbiddenError("Bạn không có quyền thực hiện thao tác này.")
    );

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/rotate-invite`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
    expect(prisma.trip.update).not.toHaveBeenCalled();
  });

  it("returns 400 when trip is not in ACTIVE state (e.g. SETTLING, COMPLETED, ARCHIVED)", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce({
      ...mockHostAuth,
      trip: { ...mockTripActive, status: "SETTLING" } as unknown as TripMembershipAuth["trip"],
    });

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/rotate-invite`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toContain("giai đoạn lên kế hoạch (ACTIVE)");
    expect(prisma.trip.update).not.toHaveBeenCalled();
  });

  it("successfully rotates invite code and returns new valid Base31 13-char code", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce(mockHostAuth);

    let updatedCode = "";
    vi.mocked(prisma.trip.update).mockImplementationOnce((args) => {
      updatedCode = (args as { data: { inviteCode: string } }).data.inviteCode;
      return Promise.resolve({
        id: TRIP_ID,
        inviteCode: updatedCode,
        updatedAt: new Date(),
      }) as unknown as ReturnType<typeof prisma.trip.update>;
    });

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/rotate-invite`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.tripId).toBe(TRIP_ID);
    expect(body.data.inviteCode).toBe(updatedCode);

    // Kiểm tra định dạng mã Base31 chuẩn: đúng 13 ký tự, có dấu gạch nối ở vị trí index 6
    expect(updatedCode).toHaveLength(13);
    expect(updatedCode[6]).toBe("-");
    const rawChars = updatedCode.replace("-", "");
    expect(rawChars).toHaveLength(12);
    for (const char of rawChars) {
      expect(BASE31_INVITE_ALPHABET).toContain(char);
    }
  });

  it("retries on unique collision (P2002) and succeeds on second attempt", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce(mockHostAuth);

    const collisionError = {
      code: "P2002",
      meta: { target: ["invite_code"] },
    };

    // Lần 1: va chạm P2002
    // Lần 2: thành công
    vi.mocked(prisma.trip.update)
      .mockRejectedValueOnce(collisionError)
      .mockImplementationOnce((args) => {
        return Promise.resolve({
          id: TRIP_ID,
          inviteCode: (args as { data: { inviteCode: string } }).data.inviteCode,
          updatedAt: new Date(),
        }) as unknown as ReturnType<typeof prisma.trip.update>;
      });

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/rotate-invite`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(prisma.trip.update).toHaveBeenCalledTimes(2);
  });

  it("returns 409 collision error when retry limit is exceeded", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce(mockHostAuth);

    const collisionError = {
      code: "P2002",
      meta: { target: ["invite_code"] },
    };

    // Tất cả các lần đều va chạm
    vi.mocked(prisma.trip.update).mockRejectedValue(collisionError);

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/rotate-invite`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVITE_CODE_COLLISION");
  });

  it("handles unexpected database error with 500", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce(mockHostAuth);

    vi.mocked(prisma.trip.update).mockRejectedValueOnce(
      new Error("Unexpected DB crash")
    );

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/rotate-invite`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
  });
});
