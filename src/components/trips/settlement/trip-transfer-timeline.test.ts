import { describe, it, expect } from "vitest";
import { SettlementTransfer } from "@/types/settlement";
import { TripMember } from "@/types/trip";

// Helper logic tests for TripTransferTimeline calculations
export function getTransferTimelineSteps(
  transfer: SettlementTransfer,
  members: TripMember[],
  settlementCreatedAt?: string
) {
  const fromMember = members.find((m) => m.id === transfer.fromMemberId);
  const toMember = members.find((m) => m.id === transfer.toMemberId);
  const fromName = fromMember?.name || "Người trả";
  const toName = toMember?.name || "Người nhận";

  // Step 1: Chốt sổ / Khởi tạo khoản nợ
  const step1 = {
    key: "init",
    title: "Chốt sổ & Khởi tạo nợ",
    status: "COMPLETED" as const,
    timestamp: settlementCreatedAt || "Hôm nay",
    isoTime: settlementCreatedAt,
    description: `Khoản nợ được xác nhận từ sổ chi tiêu nhóm`,
  };

  // Step 2: Thanh toán (VietQR / Tiền mặt)
  const isPaid = transfer.status === "PAID" || transfer.status === "COMPLETED";
  const methodLabel =
    transfer.paymentMethod === "CASH" ? "Tiền mặt" : "Chuyển khoản VietQR";

  const step2 = {
    key: "payment",
    title: isPaid ? `Đã thanh toán (${methodLabel})` : `Thanh toán (${methodLabel})`,
    status: isPaid ? ("COMPLETED" as const) : ("IN_PROGRESS" as const),
    timestamp: transfer.paidAt || (isPaid ? "Đã gửi" : "Đang thực hiện"),
    isoTime: transfer.paidAt,
    description: isPaid
      ? `${fromName} đã thực hiện thanh toán${
          transfer.paymentProofNote ? ` • "${transfer.paymentProofNote}"` : ""
        }`
      : `Quét mã VietQR hoặc đưa tiền mặt trực tiếp cho ${toName}`,
  };

  // Step 3: Đối soát & Tất toán
  const isCompleted = transfer.status === "COMPLETED";
  const step3 = {
    key: "settlement",
    title: isCompleted
      ? "Đã xác nhận & Tất toán"
      : transfer.status === "PAID"
      ? "Chờ người nhận đối soát"
      : "Đối soát & Tất toán",
    status: isCompleted
      ? ("COMPLETED" as const)
      : transfer.status === "PAID"
      ? ("IN_PROGRESS" as const)
      : ("PENDING" as const),
    timestamp: transfer.completedAt || (transfer.status === "PAID" ? "Đang chờ" : "Dự kiến"),
    isoTime: transfer.completedAt,
    description: isCompleted
      ? `${toName} đã xác nhận nhận đủ tiền • Công nợ hoàn tất`
      : transfer.status === "PAID"
      ? `${toName} đang kiểm tra số dư và bấm xác nhận`
      : `${toName} sẽ đối soát sau khi nhận được tiền`,
  };

  return [step1, step2, step3];
}

describe("TripTransferTimeline Logic & Structure", () => {
  const mockMembers: TripMember[] = [
    {
      id: "mem-1",
      tripId: "trip-1",
      userId: "user-1",
      name: "Nguyễn Văn An",
      role: "MEMBER",
      status: "ACTIVE",
      joinOrder: 1,
    },
    {
      id: "mem-2",
      tripId: "trip-1",
      userId: "user-2",
      name: "Trần Thị Bình",
      role: "HOST",
      status: "ACTIVE",
      joinOrder: 2,
    },
  ];

  it("calculates 3 chronological steps for UNPAID transfer correctly", () => {
    const unpaidTransfer: SettlementTransfer = {
      id: "t-1",
      settlementId: "s-1",
      fromMemberId: "mem-1",
      toMemberId: "mem-2",
      amount: 250000,
      status: "UNPAID",
      paymentMethod: "BANK_TRANSFER",
    };

    const steps = getTransferTimelineSteps(
      unpaidTransfer,
      mockMembers,
      "2026-10-29T09:00:00Z"
    );

    expect(steps).toHaveLength(3);
    expect(steps[0].status).toBe("COMPLETED");
    expect(steps[0].key).toBe("init");
    expect(steps[1].status).toBe("IN_PROGRESS");
    expect(steps[1].title).toContain("VietQR");
    expect(steps[2].status).toBe("PENDING");
  });

  it("calculates correct states when transfer is PAID (awaiting creditor confirmation)", () => {
    const paidTransfer: SettlementTransfer = {
      id: "t-2",
      settlementId: "s-1",
      fromMemberId: "mem-1",
      toMemberId: "mem-2",
      amount: 500000,
      status: "PAID",
      paymentMethod: "BANK_TRANSFER",
      paidAt: "2026-10-29T10:30:00Z",
      paymentProofNote: "CK qua Techcombank",
    };

    const steps = getTransferTimelineSteps(paidTransfer, mockMembers);

    expect(steps[0].status).toBe("COMPLETED");
    expect(steps[1].status).toBe("COMPLETED");
    expect(steps[1].description).toContain("CK qua Techcombank");
    expect(steps[2].status).toBe("IN_PROGRESS");
    expect(steps[2].title).toBe("Chờ người nhận đối soát");
  });

  it("calculates correct states when transfer is COMPLETED (settled)", () => {
    const completedTransfer: SettlementTransfer = {
      id: "t-3",
      settlementId: "s-1",
      fromMemberId: "mem-1",
      toMemberId: "mem-2",
      amount: 120000,
      status: "COMPLETED",
      paymentMethod: "CASH",
      paidAt: "2026-10-29T11:00:00Z",
      completedAt: "2026-10-29T11:15:00Z",
    };

    const steps = getTransferTimelineSteps(completedTransfer, mockMembers);

    expect(steps[0].status).toBe("COMPLETED");
    expect(steps[1].status).toBe("COMPLETED");
    expect(steps[1].title).toContain("Tiền mặt");
    expect(steps[2].status).toBe("COMPLETED");
    expect(steps[2].title).toBe("Đã xác nhận & Tất toán");
    expect(steps[2].description).toContain("Trần Thị Bình đã xác nhận");
  });
});

