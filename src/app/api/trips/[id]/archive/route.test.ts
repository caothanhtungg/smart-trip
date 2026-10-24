import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { requireTripMembership, type TripMembershipAuth } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/api";

vi.mock("@/lib/api/auth-guard", () => ({
  requireTripMembership: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    settlementTransfer: {
      count: vi.fn(),
    },
    trip: {
      update: vi.fn(),
    },
  },
}));

describe("POST /api/trips/[id]/archive (UC24 Archive Trip)", () => {
  const TRIP_ID = "550e8400-e29b-41d4-a716-446655440000";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTripActive = {
    id: TRIP_ID,
    name: "Đà Lạt 3N2Đ",
    status: "ACTIVE" as const,
  };

  const mockHostAuth: TripMembershipAuth = {
    user: { id: "usr-host", name: "Host User", email: "host@example.com" } as unknown as TripMembershipAuth["user"],
    session: { id: "sess-1", userId: "usr-host" } as unknown as TripMembershipAuth["session"],
    member: { id: "mem-host", tripId: TRIP_ID, userId: "usr-host", role: "HOST", status: "ACTIVE" } as unknown as TripMembershipAuth["member"],
    trip: mockTripActive as unknown as TripMembershipAuth["trip"],
  };

  it("returns 400 when tripId is not a valid UUID", async () => {
    const req = new Request("http://localhost/api/trips/invalid-id/archive", {
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

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/archive`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 403 when user is MEMBER, not HOST", async () => {
    vi.mocked(requireTripMembership).mockRejectedValueOnce(
      new ForbiddenError("Bạn không có quyền thực hiện thao tác này.")
    );

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/archive`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 400 when trip is already ARCHIVED", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce({
      ...mockHostAuth,
      trip: { ...mockTripActive, status: "ARCHIVED" } as unknown as TripMembershipAuth["trip"],
    });

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/archive`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toContain("đã được lưu trữ trước đó");
    expect(prisma.trip.update).not.toHaveBeenCalled();
  });

  it("returns 409 CONFLICT when trip is in SETTLING status and has pending/unpaid debts", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce({
      ...mockHostAuth,
      trip: { ...mockTripActive, status: "SETTLING" } as unknown as TripMembershipAuth["trip"],
    });

    vi.mocked(prisma.settlementTransfer.count).mockResolvedValueOnce(2); // 2 pending debts

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/archive`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("CONFLICT");
    expect(body.error.message).toContain("còn các khoản nợ quyết toán chưa hoàn tất");
    expect(prisma.trip.update).not.toHaveBeenCalled();
  });

  it("successfully archives trip when status is ACTIVE", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce(mockHostAuth);

    vi.mocked(prisma.trip.update).mockResolvedValueOnce({
      id: TRIP_ID,
      name: "Đà Lạt 3N2Đ",
      status: "ARCHIVED",
      updatedAt: new Date("2026-10-24T00:00:00Z"),
    } as unknown as Awaited<ReturnType<typeof prisma.trip.update>>);

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/archive`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({
      id: TRIP_ID,
      name: "Đà Lạt 3N2Đ",
      status: "ARCHIVED",
      updatedAt: "2026-10-24T00:00:00.000Z",
    });

    expect(prisma.trip.update).toHaveBeenCalledWith({
      where: { id: TRIP_ID },
      data: { status: "ARCHIVED" },
      select: expect.any(Object),
    });
  });

  it("successfully archives trip when status is COMPLETED (settled)", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce({
      ...mockHostAuth,
      trip: { ...mockTripActive, status: "COMPLETED" } as unknown as TripMembershipAuth["trip"],
    });

    vi.mocked(prisma.trip.update).mockResolvedValueOnce({
      id: TRIP_ID,
      name: "Đà Lạt 3N2Đ",
      status: "ARCHIVED",
      updatedAt: new Date("2026-10-24T00:00:00Z"),
    } as unknown as Awaited<ReturnType<typeof prisma.trip.update>>);

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/archive`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ARCHIVED");
  });

  it("handles persistence failure gracefully", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce(mockHostAuth);

    vi.mocked(prisma.trip.update).mockRejectedValueOnce(
      new Error("Database write error")
    );

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/archive`, {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ id: TRIP_ID }) });
    expect(res.status).toBe(500);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
  });
});
