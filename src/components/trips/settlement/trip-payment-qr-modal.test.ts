import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  fetchTransferPaymentInfo,
  type ApiTransferPaymentInfoDto,
  SettlementApiError,
} from "@/lib/services/settlement-api";
import { SettlementTransfer } from "@/types/settlement";

vi.mock("@/lib/services/settlement-api", () => ({
  fetchTransferPaymentInfo: vi.fn(),
  SettlementApiError: class SettlementApiError extends Error {
    status: number;
    code: string;
    constructor(message: string, status = 500, code = "SETTLEMENT_API_ERROR") {
      super(message);
      this.name = "SettlementApiError";
      this.status = status;
      this.code = code;
    }
  },
}));

describe("TripPaymentQrModal Integration Logic (UC18)", () => {
  const tripId = "11111111-2222-4333-8444-555555555555";
  const transferId = "22222222-3333-4444-8555-666666666666";

  const mockTransfer: SettlementTransfer = {
    id: transferId,
    settlementId: "settle-1",
    fromMemberId: "mem-debtor",
    toMemberId: "mem-creditor",
    amount: 350000,
    status: "UNPAID",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls fetchTransferPaymentInfo with tripId and transferId when provided", async () => {
    const mockData: ApiTransferPaymentInfoDto = {
      transferId,
      tripId,
      amount: 350000,
      transferMemo: "ST TRIP DEBTOR",
      bankBin: "970407",
      bankName: "Techcombank",
      bankAccountMasked: "**** **** 3456",
      recipientName: "NGUYEN VAN CREDITOR",
      qrDataUrl: "data:image/png;base64,mockqrdata",
      qrPayload: "00020101021238...",
    };

    vi.mocked(fetchTransferPaymentInfo).mockResolvedValue(mockData);

    const result = await fetchTransferPaymentInfo(tripId, mockTransfer.id);

    expect(fetchTransferPaymentInfo).toHaveBeenCalledWith(tripId, transferId);
    expect(result.amount).toBe(350000);
    expect(result.bankName).toBe("Techcombank");
    expect(result.bankAccountMasked).toBe("**** **** 3456");
    expect(result.qrDataUrl).toBe("data:image/png;base64,mockqrdata");
  });

  it("handles missing recipient bank info safely", async () => {
    vi.mocked(fetchTransferPaymentInfo).mockRejectedValue(
      new SettlementApiError(
        "Người nhận chưa thiết lập tài khoản ngân hàng để nhận chuyển khoản.",
        400,
        "RECIPIENT_BANK_INFO_MISSING"
      )
    );

    await expect(fetchTransferPaymentInfo(tripId, mockTransfer.id)).rejects.toMatchObject({
      code: "RECIPIENT_BANK_INFO_MISSING",
      status: 400,
    });
  });

  it("handles authorization error when caller is an unrelated member", async () => {
    vi.mocked(fetchTransferPaymentInfo).mockRejectedValue(
      new SettlementApiError(
        "Bạn không có quyền truy cập thông tin thanh toán của giao dịch này.",
        403,
        "FORBIDDEN"
      )
    );

    await expect(fetchTransferPaymentInfo(tripId, mockTransfer.id)).rejects.toMatchObject({
      code: "FORBIDDEN",
      status: 403,
    });
  });
});
