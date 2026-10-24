import { requireAuth } from "@/lib/auth/session";
import { apiSuccess, handleApiError, parseJsonBody, NotFoundError } from "@/lib/api";
import { prisma } from "@/lib/db/prisma";
import {
  encryptBankAccount,
  decryptBankAccount,
  maskBankAccount,
  type EncryptedBankData,
} from "@/lib/crypto/bank-encryption";
import { UpdateCurrentUserProfileSchema } from "@/lib/validation/user-api";

/**
 * GET /api/me
 * Lấy thông tin hồ sơ của người dùng hiện tại đang đăng nhập.
 *
 * BẢO MẬT:
 * - Yêu cầu phiên đăng nhập hợp lệ từ Server Headers; trả 401 nếu chưa đăng nhập.
 * - Danh tính lấy hoàn toàn từ session, không chấp nhận userId từ client query hay body.
 * - Tuyệt đối KHÔNG trả password, tokens, STK mã hóa (ciphertext) hay khóa bí mật.
 * - STK ngân hàng chỉ hiển thị ở dạng masked (vd: **** **** 1234) sau khi giải mã nội bộ.
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
        email: true,
        image: true,
        bankBin: true,
        bankAccountName: true,
        bankAccountNo: true,
        createdAt: true,
      },
    });

    if (!dbUser) {
      throw new NotFoundError("Người dùng không tồn tại trong hệ thống.");
    }

    // Giải mã an toàn và che số tài khoản
    let bankAccountMasked: string | null = null;
    if (dbUser.bankAccountNo) {
      try {
        const plainAccount = decryptBankAccount(dbUser.bankAccountNo);
        bankAccountMasked = maskBankAccount(plainAccount);
      } catch {
        // Nếu lỗi giải mã (key rotation hoặc lỗi định dạng), an toàn coi như chưa có STK hợp lệ
        bankAccountMasked = null;
      }
    }

    const profileData = {
      id: dbUser.id,
      name: dbUser.name,
      displayName: dbUser.displayName || dbUser.name,
      email: dbUser.email,
      avatarUrl: dbUser.image,
      bankBin: dbUser.bankBin,
      bankAccountName: dbUser.bankAccountName,
      bankAccountMasked,
      hasBankAccount: !!dbUser.bankAccountNo,
      createdAt: dbUser.createdAt.toISOString(),
    };

    return apiSuccess(profileData);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/me
 * Cập nhật thông tin hồ sơ và tài khoản ngân hàng của người dùng hiện tại.
 *
 * BẢO MẬT & TOÀN VẸN DỮ LIỆU:
 * 1. Bắt buộc xác thực bằng session server-side; chỉ cập nhật đúng user đang đăng nhập.
 * 2. Không nhận userId từ client payload (schema strict loại bỏ hoặc báo lỗi nếu có).
 * 3. Hỗ trợ partial update: sửa tên hiển thị, hoặc sửa tài khoản ngân hàng, hoặc cả hai.
 * 4. Mã hóa AES-256-GCM đối với STK trước khi lưu.
 * 5. Fail-closed: nếu thiếu encryption key hoặc lỗi crypto, ném lỗi 500 và KHÔNG ghi đè dữ liệu DB.
 * 6. Tuyệt đối không trả về plaintext hoặc ciphertext STK; response chỉ trả DTO an toàn kèm bankAccountMasked.
 * 7. Không ghi số tài khoản ngân hàng vào bất kỳ log nào.
 */
export async function PATCH(req: Request): Promise<Response> {
  try {
    const { user } = await requireAuth();
    const input = await parseJsonBody(req, UpdateCurrentUserProfileSchema);

    // Xác định trạng thái cập nhật thông tin ngân hàng
    const hasBankFields =
      input.bankBin !== undefined ||
      input.bankAccountNo !== undefined ||
      input.bankAccountName !== undefined;

    let encryptedBank: EncryptedBankData | null = null;
    const isClearingBank = hasBankFields && input.bankAccountNo === null;

    if (hasBankFields && input.bankAccountNo !== null && input.bankAccountNo !== undefined) {
      // Mã hóa AES-256-GCM số tài khoản. Nếu thiếu BANK_ENCRYPTION_KEY, getEncryptionKey ném lỗi (fail-closed)
      encryptedBank = encryptBankAccount(input.bankAccountNo);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
        ...(isClearingBank
          ? {
              bankBin: null,
              bankAccountNo: null,
              bankAccountName: null,
            }
          : {}),
        ...(encryptedBank && input.bankBin && input.bankAccountName
          ? {
              bankBin: input.bankBin,
              bankAccountNo: encryptedBank.encryptedAccountNo,
              bankAccountName: input.bankAccountName,
              bankAccountKeyVersion: encryptedBank.keyVersion,
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        image: true,
        bankBin: true,
        bankAccountName: true,
        bankAccountNo: true,
        createdAt: true,
      },
    });

    let bankAccountMasked: string | null = null;
    if (updatedUser.bankAccountNo) {
      try {
        const plainAccount = decryptBankAccount(updatedUser.bankAccountNo);
        bankAccountMasked = maskBankAccount(plainAccount);
      } catch {
        bankAccountMasked = null;
      }
    }

    const profileData = {
      id: updatedUser.id,
      name: updatedUser.name,
      displayName: updatedUser.displayName || updatedUser.name,
      email: updatedUser.email,
      avatarUrl: updatedUser.image,
      bankBin: updatedUser.bankBin,
      bankAccountName: updatedUser.bankAccountName,
      bankAccountMasked,
      hasBankAccount: !!updatedUser.bankAccountNo,
      createdAt: updatedUser.createdAt.toISOString(),
    };

    return apiSuccess(profileData, {
      message: "Cập nhật hồ sơ thành công.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
