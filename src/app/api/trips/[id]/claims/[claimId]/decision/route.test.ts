import { describe, it, expect, vi, beforeEach } from "vitest";
import { PATCH, POST } from "./route";
import { requireTripMembership, type TripMembershipAuth } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { ForbiddenError } from "@/lib/api";

vi.mock("@/lib/api/auth-guard", () => ({
  requireTripMembership: vi.fn(),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

describe("POST & PATCH /api/trips/[id]/claims/[claimId]/decision (UC30 Decide Claim)", () => {
  const TRIP_ID = "550e8400-e29b-41d4-a716-446655440000";
  const CLAIM_ID = "660e8400-e29b-41d4-a716-446655440001";
  const PLACEHOLDER_ID = "770e8400-e29b-41d4-a716-446655440002";
  const CLAIMANT_USER_ID = "880e8400-e29b-41d4-a716-446655440003";

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

  const mockPendingClaim = {
    id: CLAIM_ID,
    tripId: TRIP_ID,
    placeholderMemberId: PLACEHOLDER_ID,
    userId: CLAIMANT_USER_ID,
    status: "PENDING",
    createdAt: new Date("2026-10-24T00:00:00Z"),
    user: {
      id: CLAIMANT_USER_ID,
      name: "Bảo Minh",
      displayName: "Minh Béo",
      email: "minh@example.com",
    },
    placeholderMember: {
      id: PLACEHOLDER_ID,
      tripId: TRIP_ID,
      displayName: "Minh Béo",
      status: "ACTIVE",
      userId: null,
      bankBin: "970436",
      bankAccountNo: "temp-enc-acc",
      bankAccountName: "MINH BEO",
    },
  };

  it("returns 400 when tripId is not a valid UUID", async () => {
    const req = new Request(`http://localhost/api/trips/invalid-uuid/claims/${CLAIM_ID}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "APPROVE" }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ id: "invalid-uuid", claimId: CLAIM_ID }),
    });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 when claimId is not a valid UUID", async () => {
    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims/invalid-uuid/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "APPROVE" }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ id: TRIP_ID, claimId: "invalid-uuid" }),
    });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 403 when caller is a regular MEMBER, not HOST", async () => {
    vi.mocked(requireTripMembership).mockRejectedValueOnce(
      new ForbiddenError("Bạn không có quyền thực hiện thao tác này.")
    );

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims/${CLAIM_ID}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "APPROVE" }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ id: TRIP_ID, claimId: CLAIM_ID }),
    });
    expect(res.status).toBe(403);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("returns 400 when trip is not in ACTIVE state", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce({
      ...mockHostAuth,
      trip: { ...mockTripActive, status: "SETTLING" } as unknown as TripMembershipAuth["trip"],
    });

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims/${CLAIM_ID}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "APPROVE" }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ id: TRIP_ID, claimId: CLAIM_ID }),
    });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toContain("đang lên kế hoạch");
  });

  it("returns 400 when payload is invalid (missing decision)", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce(mockHostAuth);

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims/${CLAIM_ID}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ id: TRIP_ID, claimId: CLAIM_ID }),
    });
    expect(res.status).toBe(400);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when claim is not found in trip", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce(mockHostAuth);

    vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
      return callback({
        memberClaim: {
          findFirst: vi.fn().mockResolvedValue(null),
        },
      } as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
    });

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims/${CLAIM_ID}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "REJECT" }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ id: TRIP_ID, claimId: CLAIM_ID }),
    });
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("returns 409 when claim is not PENDING (already decided)", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce(mockHostAuth);

    vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
      return callback({
        memberClaim: {
          findFirst: vi.fn().mockResolvedValue({
            ...mockPendingClaim,
            status: "APPROVED",
          }),
        },
      } as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
    });

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims/${CLAIM_ID}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "REJECT" }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ id: TRIP_ID, claimId: CLAIM_ID }),
    });
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toContain("đã được xử lý trước đó");
  });

  it("successfully rejects claim when decision = REJECT", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce(mockHostAuth);

    const updateManyClaimMock = vi.fn().mockResolvedValue({ count: 1 });

    vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
      return callback({
        memberClaim: {
          findFirst: vi.fn().mockResolvedValue(mockPendingClaim),
          updateMany: updateManyClaimMock,
        },
      } as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
    });

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims/${CLAIM_ID}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "REJECT" }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ id: TRIP_ID, claimId: CLAIM_ID }),
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("REJECTED");
    expect(body.message).toContain("Đã từ chối");

    expect(updateManyClaimMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: CLAIM_ID, status: "PENDING" },
        data: expect.objectContaining({ status: "REJECTED" }),
      })
    );
  });

  it("returns 409 when placeholder is already linked to another account during approval", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce(mockHostAuth);

    vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
      return callback({
        memberClaim: {
          findFirst: vi.fn().mockResolvedValue({
            ...mockPendingClaim,
            placeholderMember: {
              ...mockPendingClaim.placeholderMember,
              userId: "already-claimed-user-id",
            },
          }),
        },
      } as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
    });

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims/${CLAIM_ID}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "APPROVE" }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ id: TRIP_ID, claimId: CLAIM_ID }),
    });
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toContain("đã được liên kết với một tài khoản khác");
  });

  it("returns 409 when claimant is already an active member in this trip", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce(mockHostAuth);

    vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
      return callback({
        memberClaim: {
          findFirst: vi.fn().mockResolvedValue(mockPendingClaim),
        },
        tripMember: {
          findFirst: vi.fn().mockResolvedValue({ id: "mem-active" }),
        },
      } as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
    });

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims/${CLAIM_ID}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "APPROVE" }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ id: TRIP_ID, claimId: CLAIM_ID }),
    });
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.message).toContain("hiện đã là thành viên trong chuyến đi");
  });

  it("successfully approves claim: updates membership, clears bank_*, and auto-rejects competing claims (POST & PATCH)", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce(mockHostAuth);

    const updateManyClaimMock = vi.fn().mockResolvedValue({ count: 1 });
    const updateManyMemberMock = vi.fn().mockResolvedValue({ count: 1 });

    vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
      return callback({
        memberClaim: {
          findFirst: vi.fn().mockResolvedValue(mockPendingClaim),
          updateMany: updateManyClaimMock,
        },
        tripMember: {
          findFirst: vi.fn().mockResolvedValue(null),
          updateMany: updateManyMemberMock,
        },
      } as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
    });

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims/${CLAIM_ID}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "APPROVE" }),
    });

    const res = await POST(req, {
      params: Promise.resolve({ id: TRIP_ID, claimId: CLAIM_ID }),
    });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("APPROVED");
    expect(body.data.placeholderMemberId).toBe(PLACEHOLDER_ID);
    expect(body.data.userId).toBe(CLAIMANT_USER_ID);

    // Rule R13: Xóa bank_* tạm thời và gán userId
    expect(updateManyMemberMock).toHaveBeenCalledWith({
      where: { id: PLACEHOLDER_ID, userId: null },
      data: {
        userId: CLAIMANT_USER_ID,
        bankBin: null,
        bankAccountNo: null,
        bankAccountName: null,
      },
    });

    // Rule R20: Chuyển các claims PENDING khác cùng placeholder sang REJECTED
    expect(updateManyClaimMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          placeholderMemberId: PLACEHOLDER_ID,
          status: "PENDING",
        }),
        data: expect.objectContaining({ status: "REJECTED" }),
      })
    );
  });

  it("handles concurrent conflict when another session approves or rejects claim first", async () => {
    vi.mocked(requireTripMembership).mockResolvedValueOnce(mockHostAuth);

    // updateMany count === 0 indicates race condition
    vi.mocked(prisma.$transaction).mockImplementationOnce(async (callback) => {
      return callback({
        memberClaim: {
          findFirst: vi.fn().mockResolvedValue(mockPendingClaim),
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      } as unknown as Parameters<Parameters<typeof prisma.$transaction>[0]>[0]);
    });

    const req = new Request(`http://localhost/api/trips/${TRIP_ID}/claims/${CLAIM_ID}/decision`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "REJECT" }),
    });

    const res = await PATCH(req, {
      params: Promise.resolve({ id: TRIP_ID, claimId: CLAIM_ID }),
    });
    expect(res.status).toBe(409);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("CONFLICT");
  });
});
