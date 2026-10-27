import QRCode from "qrcode";

/**
 * Format a TLV (Tag-Length-Value) element according to EMVCo QR Code specifications.
 * Tag: 2-digit string
 * Length: 2-digit string representing byte length in UTF-8
 * Value: data string
 */
export function formatTlv(tag: string, value: string): string {
  const byteLength =
    typeof Buffer !== "undefined"
      ? Buffer.byteLength(value, "utf8")
      : new TextEncoder().encode(value).length;
  const lenStr = byteLength.toString().padStart(2, "0");
  return `${tag}${lenStr}${value}`;
}

/**
 * Calculate CRC16-CCITT (polynomial 0x1021, initial value 0xFFFF, no reflection, no final XOR).
 * Matches the EMVCo Merchant-Presented QR Code standard (Tag 63).
 */
export function calculateCrc16Ccitt(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Remove Vietnamese accents and special characters to ensure bank compatibility.
 * Keeps only alphanumeric characters, spaces, and hyphens.
 */
export function sanitizeTransferMemo(raw: string, maxLength = 25): string {
  if (!raw) return "";
  const unaccented = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[^a-zA-Z0-9 -]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  return unaccented.slice(0, maxLength).trim();
}

export interface BuildVietQrOptions {
  bankBin: string; // 6-digit Bank BIN (e.g. "970407")
  accountNumber: string; // Recipient account number
  amount?: number; // Integer VND amount (> 0)
  memo?: string; // Purpose of transfer / transfer message
}

/**
 * Build a standard-compliant VietQR payload string (EMVCo Tag 38 Napas 247).
 *
 * Structure:
 * - 00: Payload Format Indicator ("01")
 * - 01: Point of Initiation Method ("12" dynamic with amount, "11" static)
 * - 38: Merchant Account Information (Napas 247)
 *   - 00: GUID ("A000000727")
 *   - 01: Beneficiary info:
 *     - 00: Bank BIN (6 digits)
 *     - 01: Account Number
 *   - 02: Service Code ("QRIBFTTA" - Quick Response Interbank Fund Transfer to Account)
 * - 53: Transaction Currency ("704" for VND)
 * - 54: Transaction Amount (if > 0)
 * - 58: Country Code ("VN")
 * - 62: Additional Data Field (memo in subtag 08)
 * - 63: CRC16-CCITT Checksum
 */
export function buildVietQrPayload(options: BuildVietQrOptions): string {
  const { bankBin, accountNumber, amount, memo } = options;

  const cleanBin = (bankBin || "").trim();
  const cleanAccount = (accountNumber || "").trim();

  if (!/^\d{6}$/.test(cleanBin)) {
    throw new Error("[VietQR] Mã BIN ngân hàng không hợp lệ (phải là 6 chữ số).");
  }

  if (!cleanAccount || cleanAccount.length < 1 || cleanAccount.length > 34) {
    throw new Error("[VietQR] Số tài khoản ngân hàng không hợp lệ (1-34 ký tự).");
  }

  // Tag 00: Payload Format Indicator
  let payload = formatTlv("00", "01");

  // Tag 01: Point of Initiation Method (12 = Dynamic with Amount, 11 = Static)
  const isDynamic = typeof amount === "number" && Number.isInteger(amount) && amount > 0;
  payload += formatTlv("01", isDynamic ? "12" : "11");

  // Tag 38: Napas 247 Merchant Account Info
  const sub00Guid = formatTlv("00", "A000000727");
  const beneficiarySub00Bin = formatTlv("00", cleanBin);
  const beneficiarySub01Acc = formatTlv("01", cleanAccount);
  const sub01Beneficiary = formatTlv("01", beneficiarySub00Bin + beneficiarySub01Acc);
  const sub02Service = formatTlv("02", "QRIBFTTA");
  const tag38Value = sub00Guid + sub01Beneficiary + sub02Service;
  payload += formatTlv("38", tag38Value);

  // Tag 53: Transaction Currency (704 = VND)
  payload += formatTlv("53", "704");

  // Tag 54: Transaction Amount (Integer VND)
  if (isDynamic) {
    payload += formatTlv("54", Math.floor(amount).toString());
  }

  // Tag 58: Country Code (VN)
  payload += formatTlv("58", "VN");

  // Tag 62: Additional Data (Transfer memo in subtag 08)
  if (memo && memo.trim()) {
    const sanitizedMemo = sanitizeTransferMemo(memo);
    if (sanitizedMemo) {
      const sub08Memo = formatTlv("08", sanitizedMemo);
      payload += formatTlv("62", sub08Memo);
    }
  }

  // Tag 63: CRC16 Checksum
  const dataForCrc = `${payload}6304`;
  const crc = calculateCrc16Ccitt(dataForCrc);
  return `${dataForCrc}${crc}`;
}

/**
 * Generate a PNG Data URL from a QR string using the local qrcode library.
 * Works entirely offline without third-party network calls.
 */
export async function generateQrDataUrl(
  text: string,
  options?: {
    width?: number;
    margin?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  }
): Promise<string> {
  if (!text || typeof text !== "string") {
    throw new Error("[QRCode] Nội dung tạo mã QR không được để trống.");
  }

  return await QRCode.toDataURL(text, {
    width: options?.width ?? 280,
    margin: options?.margin ?? 2,
    errorCorrectionLevel: options?.errorCorrectionLevel ?? "M",
    color: {
      dark: "#184E77", // Brand Yale Blue
      light: "#FFFFFF",
    },
  });
}
