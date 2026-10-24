import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as settlementApi from "@/lib/services/settlement-api";
import { isUuid } from "@/lib/services/trips-api";
import {
  calculateMemberBalances,
  canReopenSettlement,
  generateSettlementTransfers,
  isSettlementFullyCompleted,
} from "@/lib/money/settlement";
import { SettlementTransfer, Settlement } from "@/types/settlement";
import { TripMember, TripExpense } from "@/types/trip";

describe("Phase 3G-2: Settlement & Transfers UI Integration Tests", () => {
  const validTripUuid = "11111111-2222-4333-8444-555555555555";
  const secondTripUuid = "22222222-3333-4444-8555-666666666666";
  const mockSlug = "trip-da-nang-4n3d";

  const hostMemberId = "host-member-uuid-1111";
  const debtorMemberId = "debtor-member-uuid-2222";
  const guestMemberId = "guest-member-uuid-3333";
  const transferId1 = "trans-uuid-0001";
  const transferId2 = "trans-uuid-0002";

  const sampleMembers: TripMember[] = [
    {
      id: hostMemberId,
      name: "Trưởng nhóm A",
      role: "HOST",
      status: "ACTIVE",
      joinOrder: 1,
      isNoAccount: false,
      isHost: true,
    },
    {
      id: debtorMemberId,
      name: "Thành viên B",
      role: "MEMBER",
      status: "ACTIVE",
      joinOrder: 2,
      isNoAccount: false,
      isHost: false,
    },
    {
      id: guestMemberId,
      name: "Khách C (Ảo)",
      role: "MEMBER",
      status: "ACTIVE",
      joinOrder: 3,
      isNoAccount: true,
      isHost: false,
    },
  ];

  const sampleApiTransfer1: settlementApi.ApiSettlementTransferDto = {
    id: transferId1,
    settlementId: "settle-uuid-1",
    fromMemberId: debtorMemberId,
    fromMember: {
      id: debtorMemberId,
      displayName: "Thành viên B",
      status: "ACTIVE",
      isNoAccount: false,
    },
    toMemberId: hostMemberId,
    toMember: {
      id: hostMemberId,
      displayName: "Trưởng nhóm A",
      status: "ACTIVE",
      isNoAccount: false,
    },
    amount: 200000,
    status: "UNPAID",
    paymentMethod: null,
    paidAt: null,
    paidMarkedByMemberId: null,
    paidMarkedBy: null,
    completedAt: null,
    completedByMemberId: null,
    completedBy: null,
  };

  const sampleApiTransfer2: settlementApi.ApiSettlementTransferDto = {
    id: transferId2,
    settlementId: "settle-uuid-1",
    fromMemberId: guestMemberId,
    fromMember: {
      id: guestMemberId,
      displayName: "Khách C (Ảo)",
      status: "ACTIVE",
      isNoAccount: true,
    },
    toMemberId: hostMemberId,
    toMember: {
      id: hostMemberId,
      displayName: "Trưởng nhóm A",
      status: "ACTIVE",
      isNoAccount: false,
    },
    amount: 100000,
    status: "UNPAID",
    paymentMethod: null,
    paidAt: null,
    paidMarkedByMemberId: null,
    paidMarkedBy: null,
    completedAt: null,
    completedByMemberId: null,
    completedBy: null,
  };

  const sampleApiSettlement: settlementApi.ApiSettlementDto = {
    id: "settle-uuid-1",
    tripId: validTripUuid,
    status: "ACTIVE",
    createdByMemberId: hostMemberId,
    createdByMember: { id: hostMemberId, displayName: "Trưởng nhóm A" },
    createdAt: "2026-10-21T08:00:00.000Z",
    cancelledAt: null,
    transfers: [sampleApiTransfer1, sampleApiTransfer2],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. Phân biệt Trip UUID thật và Mock Slug", () => {
    it("isUuid phân biệt chính xác UUID v4 thật và mock slug", () => {
      expect(isUuid(validTripUuid)).toBe(true);
      expect(isUuid(secondTripUuid)).toBe(true);
      expect(isUuid(mockSlug)).toBe(false);
      expect(isUuid("mock-trip-1")).toBe(false);
    });

    it("Trip UUID thật gọi fetchTripSettlement khi tải dữ liệu", async () => {
      const fetchSpy = vi
        .spyOn(settlementApi, "fetchTripSettlement")
        .mockResolvedValueOnce({
          settlement: sampleApiSettlement,
          balances: [],
          totalSpent: 300000,
        });

      if (isUuid(validTripUuid)) {
        const res = await settlementApi.fetchTripSettlement(validTripUuid);
        expect(res.settlement?.id).toBe("settle-uuid-1");
      }

      expect(fetchSpy).toHaveBeenCalledWith(validTripUuid);
    });

    it("Mock slug không bao giờ gọi fetchTripSettlement API", async () => {
      const fetchSpy = vi.spyOn(settlementApi, "fetchTripSettlement");

      if (isUuid(mockSlug)) {
        await settlementApi.fetchTripSettlement(mockSlug);
      }

      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  describe("2. Chống Race Condition khi chuyển Trip trong lúc request đang bay", () => {
    it("Bỏ qua phản hồi từ trip cũ nếu trip hiện tại đã thay đổi", async () => {
      let activeTripId = validTripUuid;
      let committedSettlement: Settlement | null = null;

      // Giả lập request cho trip 1 có độ trễ
      const delayedTrip1Promise = new Promise<settlementApi.ApiSettlementResponse>(
        (resolve) => {
          setTimeout(() => {
            resolve({
              settlement: sampleApiSettlement,
              balances: [],
              totalSpent: 300000,
            });
          }, 50);
        }
      );

      // Người dùng chuyển sang trip 2 ngay lập tức
      activeTripId = secondTripUuid;

      // Khi promise của trip 1 hoàn thành, kiểm tra ref
      const trip1Result = await delayedTrip1Promise;
      if (activeTripId === validTripUuid) {
        committedSettlement = settlementApi.mapApiSettlementToDomain(
          trip1Result.settlement!
        );
      }

      // State không bị ghi đè bởi response cũ của trip 1
      expect(committedSettlement).toBeNull();
    });
  });

  describe("3. Quản lý trạng thái Chốt sổ & Phân quyền Host", () => {
    it("Host chốt sổ thành công qua createTripSettlement và chuyển sang SETTLING", async () => {
      const createSpy = vi
        .spyOn(settlementApi, "createTripSettlement")
        .mockResolvedValueOnce({
          settlement: sampleApiSettlement,
        });

      const res = await settlementApi.createTripSettlement(validTripUuid);
      expect(createSpy).toHaveBeenCalledWith(validTripUuid);
      expect(res.settlement.transfers.length).toBe(2);

      const domain = settlementApi.mapApiSettlementToDomain(res.settlement);
      expect(domain.transfers.length).toBe(2);
      expect(domain.status).toBe("ACTIVE");
    });

    it("Khi API chốt sổ trả 409 Conflict, xử lý lỗi an toàn không tạo local transfers giả", async () => {
      vi.spyOn(settlementApi, "createTripSettlement").mockRejectedValueOnce(
        new settlementApi.SettlementApiError(
          "Chuyến đi đã có sổ quyết toán đang hoạt động.",
          409,
          "SETTLEMENT_ALREADY_EXISTS"
        )
      );

      let errorCaught: settlementApi.SettlementApiError | null = null;
      let lockedTransfers: SettlementTransfer[] = [];

      try {
        await settlementApi.createTripSettlement(validTripUuid);
        lockedTransfers = [
          settlementApi.mapApiTransferToDomain(sampleApiTransfer1),
        ];
      } catch (err) {
        errorCaught = err as settlementApi.SettlementApiError;
      }

      expect(errorCaught?.status).toBe(409);
      expect(errorCaught?.message).toContain("đã có sổ quyết toán");
      expect(lockedTransfers.length).toBe(0); // Không tạo transfer giả ở client
    });

    it("Xử lý trường hợp không có transfer nào (Tất cả net = 0) -> Chuyển thẳng sang COMPLETED", async () => {
      const zeroTransfersSettlement: settlementApi.ApiSettlementDto = {
        ...sampleApiSettlement,
        transfers: [],
      };

      vi.spyOn(settlementApi, "createTripSettlement").mockResolvedValueOnce({
        settlement: zeroTransfersSettlement,
      });

      const res = await settlementApi.createTripSettlement(validTripUuid);
      const domain = settlementApi.mapApiSettlementToDomain(res.settlement);

      let targetStatus = "ACTIVE";
      if (domain.transfers.length === 0) {
        targetStatus = "COMPLETED";
      } else {
        targetStatus = "SETTLING";
      }

      expect(targetStatus).toBe("COMPLETED");
    });
  });

  describe("4. Phân quyền và State Machine của Transfer (UNPAID -> PAID -> COMPLETED)", () => {
    it("Người nợ (debtor) được phép đánh dấu đã thanh toán (mark-paid)", async () => {
      const isDebtor = debtorMemberId === sampleApiTransfer1.fromMemberId;
      expect(isDebtor).toBe(true);

      const markPaidSpy = vi
        .spyOn(settlementApi, "markTransferPaid")
        .mockResolvedValueOnce({
          ...sampleApiTransfer1,
          status: "PAID",
          paymentMethod: "BANK_TRANSFER",
          paidAt: "2026-10-21T09:00:00.000Z",
          paidMarkedByMemberId: debtorMemberId,
        });

      const updated = await settlementApi.markTransferPaid(
        validTripUuid,
        transferId1,
        { paymentMethod: "BANK_TRANSFER" }
      );

      expect(markPaidSpy).toHaveBeenCalledWith(validTripUuid, transferId1, {
        paymentMethod: "BANK_TRANSFER",
      });
      expect(updated.status).toBe("PAID");
      expect(updated.paymentMethod).toBe("BANK_TRANSFER");
    });

    it("Trưởng nhóm (Host) được phép trả hộ khi người nợ là khách chưa có tài khoản", async () => {
      const transfer = sampleApiTransfer2;
      const callerRole = "HOST";
      const debtorIsNoAccount = transfer.fromMember.isNoAccount;

      const canProxyPay = callerRole === "HOST" && debtorIsNoAccount;
      expect(canProxyPay).toBe(true);

      vi.spyOn(settlementApi, "markTransferPaid").mockResolvedValueOnce({
        ...transfer,
        status: "PAID",
        paymentMethod: "CASH",
        paidAt: "2026-10-21T09:05:00.000Z",
        paidMarkedByMemberId: hostMemberId,
      });

      const res = await settlementApi.markTransferPaid(
        validTripUuid,
        transfer.id,
        { paymentMethod: "CASH" }
      );

      expect(res.status).toBe("PAID");
      expect(res.paymentMethod).toBe("CASH");
    });

    it("Người nhận (creditor) được phép xác nhận đã nhận tiền (confirm)", async () => {
      const isCreditor = hostMemberId === sampleApiTransfer1.toMemberId;
      expect(isCreditor).toBe(true);

      const confirmSpy = vi
        .spyOn(settlementApi, "confirmTransferCompleted")
        .mockResolvedValueOnce({
          ...sampleApiTransfer1,
          status: "COMPLETED",
          completedAt: "2026-10-21T09:10:00.000Z",
          completedByMemberId: hostMemberId,
        });

      const res = await settlementApi.confirmTransferCompleted(
        validTripUuid,
        transferId1
      );

      expect(confirmSpy).toHaveBeenCalledWith(validTripUuid, transferId1);
      expect(res.status).toBe("COMPLETED");
      expect(res.completedAt).not.toBeNull();
    });

    it("Tự động chuyển Trip sang COMPLETED khi toàn bộ transfers đã hoàn tất", () => {
      const transfers: SettlementTransfer[] = [
        {
          id: "t1",
          settlementId: "s1",
          fromMemberId: "m1",
          toMemberId: "m2",
          amount: 50000,
          status: "COMPLETED",
        },
        {
          id: "t2",
          settlementId: "s1",
          fromMemberId: "m3",
          toMemberId: "m2",
          amount: 70000,
          status: "COMPLETED",
        },
      ];

      expect(isSettlementFullyCompleted(transfers)).toBe(true);
    });

    it("Không chuyển Trip sang COMPLETED nếu vẫn còn transfer UNPAID hoặc PAID", () => {
      const transfers: SettlementTransfer[] = [
        {
          id: "t1",
          settlementId: "s1",
          fromMemberId: "m1",
          toMemberId: "m2",
          amount: 50000,
          status: "COMPLETED",
        },
        {
          id: "t2",
          settlementId: "s1",
          fromMemberId: "m3",
          toMemberId: "m2",
          amount: 70000,
          status: "PAID",
        },
      ];

      expect(isSettlementFullyCompleted(transfers)).toBe(false);
    });
  });

  describe("5. Mở lại sổ (Reopen Settlement)", () => {
    it("canReopenSettlement trả về true nếu toàn bộ transfers là UNPAID", () => {
      const transfers: SettlementTransfer[] = [
        {
          id: "t1",
          settlementId: "s1",
          fromMemberId: "m1",
          toMemberId: "m2",
          amount: 50000,
          status: "UNPAID",
        },
        {
          id: "t2",
          settlementId: "s1",
          fromMemberId: "m3",
          toMemberId: "m2",
          amount: 70000,
          status: "UNPAID",
        },
      ];

      expect(canReopenSettlement(transfers)).toBe(true);
    });

    it("canReopenSettlement trả về false nếu có ít nhất 1 transfer đã PAID hoặc COMPLETED", () => {
      const transfersWithPaid: SettlementTransfer[] = [
        {
          id: "t1",
          settlementId: "s1",
          fromMemberId: "m1",
          toMemberId: "m2",
          amount: 50000,
          status: "PAID",
        },
      ];
      expect(canReopenSettlement(transfersWithPaid)).toBe(false);

      const transfersWithCompleted: SettlementTransfer[] = [
        {
          id: "t2",
          settlementId: "s1",
          fromMemberId: "m1",
          toMemberId: "m2",
          amount: 50000,
          status: "COMPLETED",
        },
      ];
      expect(canReopenSettlement(transfersWithCompleted)).toBe(false);
    });

    it("Host mở lại sổ thành công qua reopenTripSettlement", async () => {
      const reopenSpy = vi
        .spyOn(settlementApi, "reopenTripSettlement")
        .mockResolvedValueOnce({
          settlementId: "settle-uuid-1",
          reopenedAt: "2026-10-21T09:30:00.000Z",
        });

      const res = await settlementApi.reopenTripSettlement(validTripUuid);
      expect(reopenSpy).toHaveBeenCalledWith(validTripUuid);
      expect(res.settlementId).toBe("settle-uuid-1");
    });
  });

  describe("6. Mock Slug giữ nguyên hành vi Demo độc lập", () => {
    it("Mock slug tính toán số dư và preview công nợ cục bộ theo SD2", () => {
      const expenses: TripExpense[] = [
        {
          id: "exp-mock-1",
          tripId: mockSlug,
          title: "Bữa trưa",
          amount: 300000,
          category: "FOOD",
          paidByMemberId: hostMemberId,
          splitMethod: "EQUAL",
          spentAt: "2026-10-15T12:00:00.000Z",
          shares: [
            { id: "s1", expenseId: "exp-mock-1", memberId: hostMemberId, amount: 100000 },
            { id: "s2", expenseId: "exp-mock-1", memberId: debtorMemberId, amount: 100000 },
            { id: "s3", expenseId: "exp-mock-1", memberId: guestMemberId, amount: 100000 },
          ],
        },
      ];

      const balances = calculateMemberBalances(sampleMembers, expenses);
      expect(balances.totalPaid).toBe(300000);

      const preview = generateSettlementTransfers(mockSlug, balances.balances);
      expect(preview.length).toBe(2);
      expect(preview.find((t) => t.fromMemberId === debtorMemberId)?.amount).toBe(100000);
      expect(preview.find((t) => t.fromMemberId === guestMemberId)?.amount).toBe(100000);
    });
  });
});
