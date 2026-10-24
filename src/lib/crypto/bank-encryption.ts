import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12; // 96 bits chuẩn NIST cho AES-GCM
const AUTH_TAG_LENGTH_BYTES = 16; // 128 bits authentication tag
export const CURRENT_BANK_KEY_VERSION = 1;

/**
 * Trích xuất và xác thực khóa mã hóa AES-256 (32 bytes).
 * Chấp nhận: 64 ký tự Hex hoặc chuỗi UTF-8 đúng 32 bytes hoặc chuỗi Base64 32 bytes.
 * Fail-closed: Ném lỗi nếu khóa không hợp lệ hoặc bị thiếu.
 */
export function getEncryptionKey(overrideKey?: string): Buffer {
  const rawKey = (overrideKey !== undefined ? overrideKey.trim() : process.env.BANK_ENCRYPTION_KEY?.trim()) || "";
  if (!rawKey) {
    throw new Error("[Security] BANK_ENCRYPTION_KEY is missing or empty. Refusing to operate.");
  }

  // 1. Trường hợp: 64 ký tự hex (khuyến nghị cho 256-bit key)
  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    return Buffer.from(rawKey, "hex");
  }

  // 2. Trường hợp: Chuỗi UTF-8 đúng 32 bytes
  const utf8Buf = Buffer.from(rawKey, "utf8");
  if (utf8Buf.length === 32) {
    return utf8Buf;
  }

  // 3. Trường hợp: Chuỗi Base64 giải mã ra đúng 32 bytes
  try {
    const b64Buf = Buffer.from(rawKey, "base64");
    if (b64Buf.length === 32 && b64Buf.toString("base64") === rawKey) {
      return b64Buf;
    }
  } catch {
    // Không phải base64 hợp lệ, tiếp tục ném lỗi bên dưới
  }

  throw new Error(
    `[Security] BANK_ENCRYPTION_KEY must be exactly 32 bytes (256 bits). Expected 64 hex characters or 32-byte string, got length ${rawKey.length}.`
  );
}

export interface EncryptedBankData {
  encryptedAccountNo: string; // Định dạng "iv:authTag:ciphertext"
  keyVersion: number;
}

/**
 * Mã hóa số tài khoản ngân hàng bằng thuật toán AES-256-GCM.
 * Định dạng lưu trữ: "iv:authTag:ciphertext" (mỗi phần được mã hóa hex).
 */
export function encryptBankAccount(
  accountNumber: string,
  options?: { key?: string; keyVersion?: number }
): EncryptedBankData {
  if (!accountNumber || typeof accountNumber !== "string" || accountNumber.trim() === "") {
    throw new Error("[Security] Invalid account number: cannot be empty or non-string.");
  }

  const key = getEncryptionKey(options?.key);
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });

  const ciphertext = Buffer.concat([
    cipher.update(accountNumber.trim(), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const formatted = `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;

  return {
    encryptedAccountNo: formatted,
    keyVersion: options?.keyVersion ?? CURRENT_BANK_KEY_VERSION,
  };
}

/**
 * Giải mã số tài khoản ngân hàng từ định dạng "iv:authTag:ciphertext".
 * Tự động kiểm tra tính toàn vẹn thông qua GCM authentication tag.
 * Fail-closed: Ném lỗi nếu auth tag không khớp, dữ liệu bị can thiệp hoặc sai khóa.
 */
export function decryptBankAccount(
  encryptedString: string,
  options?: { key?: string; keyVersion?: number }
): string {
  if (!encryptedString || typeof encryptedString !== "string") {
    throw new Error("[Security] Invalid encrypted data: must be a non-empty string.");
  }

  const parts = encryptedString.split(":");
  if (parts.length !== 3) {
    throw new Error(
      "[Security] Malformed encrypted data format. Expected 'iv:authTag:ciphertext'."
    );
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  if (
    !/^[0-9a-fA-F]+$/.test(ivHex) ||
    !/^[0-9a-fA-F]+$/.test(authTagHex) ||
    !/^[0-9a-fA-F]+$/.test(ciphertextHex)
  ) {
    throw new Error("[Security] Malformed encrypted data: parts must be valid hexadecimal.");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  if (iv.length !== IV_LENGTH_BYTES) {
    throw new Error(`[Security] Invalid IV length: expected ${IV_LENGTH_BYTES} bytes, got ${iv.length}.`);
  }

  if (authTag.length !== AUTH_TAG_LENGTH_BYTES) {
    throw new Error(`[Security] Invalid auth tag length: expected ${AUTH_TAG_LENGTH_BYTES} bytes, got ${authTag.length}.`);
  }

  const key = getEncryptionKey(options?.key);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });

  decipher.setAuthTag(authTag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch {
    throw new Error(
      "[Security] Decryption failed: authentication tag mismatch, tampered data, or incorrect key."
    );
  }
}

/**
 * Che một phần số tài khoản ngân hàng để hiển thị an toàn trên giao diện.
 * Ví dụ: "0123456789" -> "**** **** 6789".
 */
export function maskBankAccount(accountNumber: string | null | undefined): string | null {
  if (!accountNumber || typeof accountNumber !== "string") return null;
  const cleaned = accountNumber.trim();
  if (!cleaned) return null;
  if (cleaned.length <= 4) return "****";
  const last4 = cleaned.slice(-4);
  return `**** **** ${last4}`;
}
