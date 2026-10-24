import {
  apiSuccess,
  handleApiError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
  AppError,
} from "@/lib/api";
import { requireTripMembership, isValidUuid } from "@/lib/api/auth-guard";
import { prisma } from "@/lib/db/prisma";
import { decryptBankAccount, maskBankAccount } from "@/lib/crypto/bank-encryption";
import { buildVietQrPayload, generateQrDataUrl, sanitizeTransferMemo } from "@/lib/money/vietqr";
import { findBankByBin } from "@/lib/mock/banks";
import { mapSettlementDatabaseError } from "@/lib/api/settlement-db-errors";

interface PaymentInfoRouteContext {
  params:
    | Promise<{ id: string; transferId: string }>
    | { id: string; transferId: string };
}

/**
 * Safe Payment Info DTO returned to authorized clients.
 * Plaintext account number and raw ciphertexts are strictly omitted.
 */
export interface SafeTransferPaymentInfoDto {
  transferId: string;
  tripId: string;
  amount: number;
  transferMemo: string;
  bankBin: string;
  bankName: string;
  bankAccountMasked: string;
  recipientName: string;
  qrDataUrl: string;
  qrPayload: string;
}

/**
 * GET /api/trips/[id]/transfers/[transferId]/payment-info
 *
 * UC18: Cung cấp thông tin thanh toán an toàn và mã QR thanh toán thực tế cho khoản quyết toán.
 *
 * BẢO MẬT & PHÂN QUYỀN CHẶT CHẼ:
 * 1. Xác thực session server-side; từ chối 401 nếu chưa đăng nhập.
 * 2. Xác thực tư cách thành viên trong chuyến đi; từ chối 403 nếu không thuộc chuyến đi.
 * 3. Chống IDOR: Xác thực giao dịch chuyển tiền thực sự thuộc chuyến đi (tripId).
 * 4. Kiểm tra trạng thái sổ quyết toán (phải là ACTIVE) và trạng thái giao dịch (phải là UNPAID).
 * 5. Phân quyền người gọi (Rule R18, UC18):
 *    - Người nợ (Debtor - fromMemberId hoặc userId tương ứng).
 *    - HOẶC Trưởng nhóm (Host - vai trò điều phối hoặc thanh toán thay thành viên chưa có tài khoản).
 *    - Mọi thành viên khác đều bị từ chối 403 Forbidden.
 * 6. Người nhận và số tiền được đọc trực tiếp từ server database, không tin bất kỳ input nào từ client.
 * 7. Giải mã AES-256-GCM số tài khoản người nhận ở server chỉ khi tạo mã QR.
 * 8. Tuyệt đối KHÔNG trả plaintext số tài khoản hoặc ciphertext trong JSON response.
 * 9. Không ghi số tài khoản, payload QR hoặc thông tin nhạy cảm vào log.
 * 10. Fail-closed: Nếu thiếu encryption key, giải mã lỗi hoặc người nhận chưa có STK, từ chối an toàn.
 */
export async function GET(
  req: Request,
  context: PaymentInfoRouteContext
): Promise<Response> {
  try {
    const params = await context.params;
    const { id: tripId, transferId } = params;

    if (!tripId || !isValidUuid(tripId) || !transferId || !isValidUuid(transferId)) {
      throw new NotFoundError("Không tìm thấy chuyến đi hoặc giao dịch.");
    }

    // 1 & 2. Kiểm tra session và quyền thành viên của trip
    const { member: callerMember, trip } = await requireTripMembership(tripId, {
      allowLeftMember: true,
    });

    // 3. Đọc dữ liệu transfer kèm quan hệ settlement, fromMember, toMember và user của toMember
    const transfer = await prisma.settlementTransfer.findUnique({
      where: { id: transferId },
      include: {
        settlement: {
          select: { id: true, tripId: true, status: true },
        },
        fromMember: {
          select: {
            id: true,
            displayName: true,
            status: true,
            userId: true,
            role: true,
          },
        },
        toMember: {
          select: {
            id: true,
            displayName: true,
            status: true,
            userId: true,
            role: true,
            bankBin: true,
            bankAccountNo: true,
            bankAccountName: true,
            user: {
              select: {
                id: true,
                name: true,
                displayName: true,
                bankBin: true,
                bankAccountNo: true,
                bankAccountName: true,
              },
            },
          },
        },
      },
    });

    if (!transfer || transfer.settlement.tripId !== tripId) {
      throw new NotFoundError("Không tìm thấy giao dịch chuyển tiền.");
    }

    // 4. Kiểm tra trạng thái sổ quyết toán và giao dịch
    if (transfer.settlement.status !== "ACTIVE") {
      throw new ConflictError("Sổ quyết toán của giao dịch này không còn hoạt động.");
    }

    if (transfer.status === "PAID") {
      throw new ConflictError("Giao dịch này đã được đánh dấu thanh toán trước đó.");
    }

    if (transfer.status === "COMPLETED") {
      throw new ConflictError("Giao dịch này đã hoàn tất, không cần thanh toán nữa.");
    }

    if (transfer.status !== "UNPAID") {
      throw new BadRequestError("Giao dịch không ở trạng thái chờ thanh toán (UNPAID).");
    }

    // 5. Phân quyền người gọi:
    // - Người nợ (fromMemberId hoặc userId tương ứng)
    // - Trưởng nhóm (role === HOST)
    const isDebtor =
      callerMember.id === transfer.fromMemberId ||
      (callerMember.userId !== null && callerMember.userId === transfer.fromMember.userId);
    const isHost = callerMember.role === "HOST";

    if (!isDebtor && !isHost) {
      throw new ForbiddenError(
        "Bạn không có quyền truy cập thông tin thanh toán của giao dịch này. Chỉ người nợ hoặc Trưởng nhóm mới có quyền xem."
      );
    }

    // 6. Xác định thông tin ngân hàng của người nhận (toMember)
    // Ưu tiên tài khoản chính của User đã liên kết, fallback về thông tin trên TripMember
    const toUser = transfer.toMember.user;
    const rawBankBin = toUser?.bankBin || transfer.toMember.bankBin;
    const rawEncryptedAccount = toUser?.bankAccountNo || transfer.toMember.bankAccountNo;
    const rawAccountName =
      toUser?.bankAccountName ||
      transfer.toMember.bankAccountName ||
      toUser?.displayName ||
      toUser?.name ||
      transfer.toMember.displayName;

    if (!rawBankBin || !rawEncryptedAccount) {
      throw new AppError(
        `Người nhận "${transfer.toMember.displayName}" chưa thiết lập tài khoản ngân hàng để nhận chuyển khoản. Vui lòng thanh toán bằng tiền mặt hoặc yêu cầu người nhận cập nhật STK.`,
        { statusCode: 400, code: "RECIPIENT_BANK_INFO_MISSING" }
      );
    }

    // 7. Giải mã số tài khoản ngân hàng phía server
    let decryptedAccount: string;
    try {
      decryptedAccount = decryptBankAccount(rawEncryptedAccount);
    } catch {
      // Fail-closed an toàn: Không log ciphertext hay chi tiết lỗi
      throw new Error(
        "[Security] Không thể giải mã thông tin tài khoản ngân hàng của người nhận do cấu hình bảo mật hoặc dữ liệu không hợp lệ."
      );
    }

    // 8. Chuẩn bị nội dung chuyển khoản (transferMemo)
    const cleanTripTitle = sanitizeTransferMemo(trip.name, 12);
    const cleanPayerName = sanitizeTransferMemo(transfer.fromMember.displayName, 8);
    const transferMemo = `ST ${cleanTripTitle} ${cleanPayerName}`.trim();

    // 9. Tạo VietQR payload và mã QR Data URL
    const qrPayload = buildVietQrPayload({
      bankBin: rawBankBin,
      accountNumber: decryptedAccount,
      amount: transfer.amount,
      memo: transferMemo,
    });

    const qrDataUrl = await generateQrDataUrl(qrPayload, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: "M",
    });

    // 10. Tra cứu tên ngân hàng và che số tài khoản cho DTO phản hồi
    const bankItem = findBankByBin(rawBankBin);
    const bankName = bankItem?.shortName || "Ngân hàng";
    const bankAccountMasked = maskBankAccount(decryptedAccount) || "****";

    const data: SafeTransferPaymentInfoDto = {
      transferId: transfer.id,
      tripId,
      amount: transfer.amount,
      transferMemo,
      bankBin: rawBankBin,
      bankName,
      bankAccountMasked,
      recipientName: rawAccountName.toUpperCase(),
      qrDataUrl,
      qrPayload,
    };

    return apiSuccess(data);
  } catch (error) {
    const mapped = mapSettlementDatabaseError(error);
    return handleApiError(mapped || error);
  }
}
