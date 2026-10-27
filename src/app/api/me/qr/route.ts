import { requireAuth } from "@/lib/auth/session";
import { apiSuccess, handleApiError, NotFoundError, BadRequestError } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import { decryptBankAccount, maskBankAccount } from "@/lib/crypto/bank-encryption";
import { buildVietQrPayload, generateQrDataUrl } from "@/lib/money/vietqr";
import { findBankByBin } from "@/lib/mock/banks";

/**
 * GET /api/me/qr
 *
 * Tạo mã VietQR chuẩn EMVCo Napas 247 thật cho tài khoản ngân hàng của người dùng hiện tại.
 *
 * BẢO MẬT:
 * 1. Bắt buộc xác thực phiên người dùng server-side.
 * 2. Giải mã AES-256-GCM số tài khoản người nhận trong bộ nhớ server.
 * 3. Tuyệt đối không trả về số tài khoản plaintext hay ciphertext trong JSON response.
 * 4. Trả về ảnh PNG Base64 Data URL để hiển thị mã VietQR quét được trực tiếp trên ứng dụng ngân hàng.
 */
export async function GET(): Promise<Response> {
  try {
    const { user } = await requireAuth();

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        displayName: true,
        bankBin: true,
        bankAccountName: true,
        bankAccountNo: true,
      },
    });

    if (!dbUser) {
      throw new NotFoundError("Người dùng không tồn tại trong hệ thống.");
    }

    if (!dbUser.bankBin || !dbUser.bankAccountNo) {
      throw new BadRequestError("Người dùng chưa thiết lập tài khoản ngân hàng để tạo mã VietQR.");
    }

    const plainAccount = decryptBankAccount(dbUser.bankAccountNo);
    const bankAccountMasked = maskBankAccount(plainAccount);
    const bank = findBankByBin(dbUser.bankBin);
    const bankName = bank ? bank.shortName : "Ngân hàng";

    const qrPayload = buildVietQrPayload({
      bankBin: dbUser.bankBin,
      accountNumber: plainAccount,
    });

    const qrDataUrl = await generateQrDataUrl(qrPayload, {
      width: 320,
      margin: 2,
      errorCorrectionLevel: "M",
    });

    return apiSuccess({
      bankBin: dbUser.bankBin,
      bankName,
      accountHolder: dbUser.bankAccountName || dbUser.name,
      bankAccountMasked,
      qrDataUrl,
      qrPayload,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
