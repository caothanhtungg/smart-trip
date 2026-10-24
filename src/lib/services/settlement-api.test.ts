import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchTripSettlement,
  createTripSettlement,
  reopenTripSettlement,
  fetchTripTransfer,
  updateTripTransfer,
  markTransferPaid,
  confirmTransferCompleted,
  fetchTransferPaymentInfo,
  SettlementApiError,
  mapApiTransferToDomain,
  mapApiSettlementToDomain,
  ApiSettlementDto,
  ApiSettlementTransferDto,
} from "./settlement-api";

describe("Settlement API Client Service (src/lib/services/settlement-api)", () => {
  const mockFetch = vi.fn();
  const validTripId = "11111111-2222-4333-8444-555555555555";
  const validTransferId = "22222222-3333-4444-8555-666666666666";
  const validSettlementId = "33333333-4444-4555-8666-777777777777";
  const member1Id = "aaaa1111-1111-4111-8111-111111111111";
  const member2Id = "bbbb2222-2222-4222-8222-222222222222";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleTransferDto: ApiSettlementTransferDto = {
    id: validTransferId,
    settlementId: validSettlementId,
    fromMemberId: member1Id,
    fromMember: {
      id: member1Id,
      displayName: "Nguyễn Văn A",
      status: "ACTIVE",
      isNoAccount: false,
    },
    toMemberId: member2Id,
    toMember: {
      id: member2Id,
      displayName: "Trần Thị B",
      status: "ACTIVE",
      isNoAccount: false,
    },
    amount: 150000,
    status: "UNPAID",
    paymentMethod: null,
    paidAt: null,
    paidMarkedByMemberId: null,
    paidMarkedBy: null,
    completedAt: null,
    completedByMemberId: null,
    completedBy: null,
  };

  const sampleSettlementDto: ApiSettlementDto = {
    id: validSettlementId,
    tripId: validTripId,
    status: "ACTIVE",
    createdByMemberId: member1Id,
    createdByMember: {
      id: member1Id,
      displayName: "Nguyễn Văn A",
    },
    createdAt: "2026-10-21T10:00:00.000Z",
    cancelledAt: null,
    transfers: [sampleTransferDto],
  };

  describe("Validation & ID checks", () => {
    it("Từ chối nếu tripId không phải là UUID hợp lệ", async () => {
      await expect(
        fetchTripSettlement("invalid-id", { customFetch: mockFetch })
      ).rejects.toThrow(SettlementApiError);

      await expect(
        createTripSettlement("invalid-id", { customFetch: mockFetch })
      ).rejects.toThrow("Mã chuyến đi không hợp lệ (yêu cầu UUID).");

      await expect(
        reopenTripSettlement("invalid-id", { customFetch: mockFetch })
      ).rejects.toThrow("Mã chuyến đi không hợp lệ (yêu cầu UUID).");

      await expect(
        fetchTripTransfer(validTripId, "invalid-transfer-id", { customFetch: mockFetch })
      ).rejects.toThrow("Mã chuyến đi hoặc giao dịch không hợp lệ (yêu cầu UUID).");

      await expect(
        updateTripTransfer(validTripId, "not-uuid", { action: "MARK_PAID" }, { customFetch: mockFetch })
      ).rejects.toThrow(SettlementApiError);

      await expect(
        markTransferPaid(validTripId, "not-uuid", undefined, { customFetch: mockFetch })
      ).rejects.toThrow(SettlementApiError);

      await expect(
        confirmTransferCompleted(validTripId, "not-uuid", { customFetch: mockFetch })
      ).rejects.toThrow(SettlementApiError);

      await expect(
        fetchTransferPaymentInfo(validTripId, "not-uuid", { customFetch: mockFetch })
      ).rejects.toThrow("Mã chuyến đi hoặc giao dịch không hợp lệ (yêu cầu UUID).");

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("fetchTripSettlement", () => {
    it("Gửi request GET đến đúng endpoint không có query khi không yêu cầu history", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              settlement: sampleSettlementDto,
              balances: [],
              totalSpent: 300000,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const res = await fetchTripSettlement(validTripId, {
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripId}/settlement`,
        expect.objectContaining({
          method: "GET",
          credentials: "same-origin",
        })
      );
      expect(res.settlement?.id).toBe(validSettlementId);
      expect(res.totalSpent).toBe(300000);
    });

    it("Thêm query ?history=true khi options.history = true", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              settlement: null,
              balances: [],
              totalSpent: 0,
              history: [sampleSettlementDto],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const res = await fetchTripSettlement(validTripId, {
        history: true,
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripId}/settlement?history=true`,
        expect.anything()
      );
      expect(res.settlement).toBeNull();
      expect(res.history?.length).toBe(1);
    });
  });

  describe("createTripSettlement (Chốt sổ)", () => {
    it("Gửi POST đến /api/trips/[id]/settlement", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              settlement: sampleSettlementDto,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const res = await createTripSettlement(validTripId, {
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripId}/settlement`,
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({ "Content-Type": "application/json" }),
          credentials: "same-origin",
        })
      );
      expect(res.settlement.id).toBe(validSettlementId);
    });
  });

  describe("reopenTripSettlement (Mở lại sổ)", () => {
    it("Gửi POST đến /api/trips/[id]/settlement/reopen", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              settlementId: validSettlementId,
              reopenedAt: "2026-10-21T11:00:00.000Z",
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const res = await reopenTripSettlement(validTripId, {
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripId}/settlement/reopen`,
        expect.objectContaining({
          method: "POST",
          credentials: "same-origin",
        })
      );
      expect(res.settlementId).toBe(validSettlementId);
    });
  });

  describe("fetchTripTransfer", () => {
    it("Gửi GET đến /api/trips/[id]/transfers/[transferId]", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              transfer: sampleTransferDto,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const transfer = await fetchTripTransfer(validTripId, validTransferId, {
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripId}/transfers/${validTransferId}`,
        expect.objectContaining({ method: "GET" })
      );
      expect(transfer.id).toBe(validTransferId);
    });
  });

  describe("updateTripTransfer (PATCH)", () => {
    it("Gửi PATCH với action MARK_PAID và paymentMethod", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              transfer: {
                ...sampleTransferDto,
                status: "PAID",
                paymentMethod: "CASH",
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const transfer = await updateTripTransfer(
        validTripId,
        validTransferId,
        { action: "MARK_PAID", paymentMethod: "CASH" },
        { customFetch: mockFetch }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripId}/transfers/${validTransferId}`,
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ action: "MARK_PAID", paymentMethod: "CASH" }),
        })
      );
      expect(transfer.status).toBe("PAID");
    });
  });

  describe("markTransferPaid & confirmTransferCompleted (Action Endpoints)", () => {
    it("markTransferPaid gửi POST đến /mark-paid", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              transfer: { ...sampleTransferDto, status: "PAID" },
            },
          }),
          { status: 200 }
        )
      );

      const transfer = await markTransferPaid(
        validTripId,
        validTransferId,
        { paymentMethod: "BANK_TRANSFER" },
        { customFetch: mockFetch }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripId}/transfers/${validTransferId}/mark-paid`,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ paymentMethod: "BANK_TRANSFER" }),
        })
      );
      expect(transfer.status).toBe("PAID");
    });

    it("confirmTransferCompleted gửi POST đến /confirm", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: {
              transfer: { ...sampleTransferDto, status: "COMPLETED" },
            },
          }),
          { status: 200 }
        )
      );

      const transfer = await confirmTransferCompleted(
        validTripId,
        validTransferId,
        { customFetch: mockFetch }
      );

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripId}/transfers/${validTransferId}/confirm`,
        expect.objectContaining({ method: "POST" })
      );
      expect(transfer.status).toBe("COMPLETED");
    });
  });

  describe("fetchTransferPaymentInfo (UC18)", () => {
    it("gửi request GET đến đúng endpoint payment-info và trả về DTO an toàn", async () => {
      const mockPaymentInfo = {
        transferId: validTransferId,
        tripId: validTripId,
        amount: 250000,
        transferMemo: "ST DALAT A",
        bankBin: "970407",
        bankName: "Techcombank",
        bankAccountMasked: "**** **** 1234",
        recipientName: "TRAN THI B",
        qrDataUrl: "data:image/png;base64,mock-qr-data",
        qrPayload: "00020101021238...",
      };

      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            data: mockPaymentInfo,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        )
      );

      const res = await fetchTransferPaymentInfo(validTripId, validTransferId, {
        customFetch: mockFetch,
      });

      expect(mockFetch).toHaveBeenCalledWith(
        `/api/trips/${validTripId}/transfers/${validTransferId}/payment-info`,
        expect.objectContaining({
          method: "GET",
          headers: { Accept: "application/json" },
        })
      );

      expect(res.amount).toBe(250000);
      expect(res.bankBin).toBe("970407");
      expect(res.bankName).toBe("Techcombank");
      expect(res.bankAccountMasked).toBe("**** **** 1234");
      expect(res.qrDataUrl).toBe("data:image/png;base64,mock-qr-data");
    });
  });

  describe("Error handling", () => {
    it("Ném SettlementApiError với status và code từ backend", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "SETTLEMENT_ALREADY_EXISTS",
              message: "Chuyến đi đã có sổ quyết toán đang hoạt động.",
            },
          }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        )
      );

      await expect(
        createTripSettlement(validTripId, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        name: "SettlementApiError",
        status: 409,
        code: "SETTLEMENT_ALREADY_EXISTS",
        message: "Chuyến đi đã có sổ quyết toán đang hoạt động.",
      });
    });

    it("Xử lý lỗi mạng (Network failure)", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

      await expect(
        fetchTripSettlement(validTripId, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        name: "SettlementApiError",
        status: 0,
        code: "NETWORK_ERROR",
        message: "Failed to fetch",
      });
    });

    it("Xử lý response không phải JSON hợp lệ", async () => {
      mockFetch.mockResolvedValueOnce(
        new Response("<!DOCTYPE html><html>502 Bad Gateway</html>", {
          status: 502,
        })
      );

      await expect(
        fetchTripSettlement(validTripId, { customFetch: mockFetch })
      ).rejects.toMatchObject({
        name: "SettlementApiError",
        status: 502,
        code: "INVALID_RESPONSE",
      });
    });
  });

  describe("DTO to Domain Mapping", () => {
    it("mapApiTransferToDomain ánh xạ chính xác", () => {
      const domain = mapApiTransferToDomain(sampleTransferDto);
      expect(domain.id).toBe(validTransferId);
      expect(domain.fromMemberId).toBe(member1Id);
      expect(domain.toMemberId).toBe(member2Id);
      expect(domain.amount).toBe(150000);
      expect(domain.status).toBe("UNPAID");
    });

    it("mapApiSettlementToDomain ánh xạ danh sách transfers", () => {
      const domain = mapApiSettlementToDomain(sampleSettlementDto);
      expect(domain.id).toBe(validSettlementId);
      expect(domain.transfers.length).toBe(1);
      expect(domain.transfers[0].amount).toBe(150000);
    });
  });
});
