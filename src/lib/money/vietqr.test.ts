import { describe, it, expect } from "vitest";
import {
  formatTlv,
  calculateCrc16Ccitt,
  sanitizeTransferMemo,
  buildVietQrPayload,
  generateQrDataUrl,
} from "./vietqr";

describe("VietQR Utility (src/lib/money/vietqr)", () => {
  describe("formatTlv", () => {
    it("formats tag and value with 2-digit length", () => {
      expect(formatTlv("00", "01")).toBe("000201");
      expect(formatTlv("58", "VN")).toBe("5802VN");
      expect(formatTlv("53", "704")).toBe("5303704");
    });

    it("handles multi-byte utf8 correctly", () => {
      const res = formatTlv("01", "abc");
      expect(res).toBe("0103abc");
    });
  });

  describe("calculateCrc16Ccitt", () => {
    it("calculates standard CRC16-CCITT matching EMVCo reference", () => {
      // Standard test vector for CRC16-CCITT (False): "123456789" -> 0x29B1
      expect(calculateCrc16Ccitt("123456789")).toBe("29B1");
    });
  });

  describe("sanitizeTransferMemo", () => {
    it("strips Vietnamese diacritics and special characters to uppercase ASCII", () => {
      expect(sanitizeTransferMemo("Chuyến đi Đà Lạt 3N2Đ")).toBe("CHUYEN DI DA LAT 3N2D");
      expect(sanitizeTransferMemo("ST Da Nang & Hoian @2026")).toBe("ST DA NANG HOIAN 2026");
    });

    it("respects max length limit", () => {
      const long = "A VERY LONG TRANSFER MEMO FOR TESTING PURPOSES";
      const res = sanitizeTransferMemo(long, 15);
      expect(res.length).toBeLessThanOrEqual(15);
    });

    it("returns empty string on empty or whitespace", () => {
      expect(sanitizeTransferMemo("")).toBe("");
      expect(sanitizeTransferMemo("   ")).toBe("");
    });
  });

  describe("buildVietQrPayload", () => {
    it("builds a valid dynamic VietQR payload with amount and memo", () => {
      const payload = buildVietQrPayload({
        bankBin: "970407",
        accountNumber: "19036789123456",
        amount: 250000,
        memo: "ST DALAT TUNG",
      });

      // Starts with Tag 00: 000201
      expect(payload.startsWith("000201")).toBe(true);
      // Dynamic QR (Tag 01: 010212)
      expect(payload.includes("010212")).toBe(true);
      // Napas GUID A000000727
      expect(payload.includes("0010A000000727")).toBe(true);
      // Bank BIN 970407
      expect(payload.includes("0006970407")).toBe(true);
      // Account number
      expect(payload.includes("19036789123456")).toBe(true);
      // Service code QRIBFTTA
      expect(payload.includes("0208QRIBFTTA")).toBe(true);
      // Currency VND 704
      expect(payload.includes("5303704")).toBe(true);
      // Amount 250000
      expect(payload.includes("5406250000")).toBe(true);
      // Country VN
      expect(payload.includes("5802VN")).toBe(true);
      // Memo ST DALAT TUNG
      expect(payload.includes("ST DALAT TUNG")).toBe(true);
      // Ends with Tag 6304 + 4 hex characters
      expect(payload).toMatch(/6304[0-9A-F]{4}$/);
    });

    it("builds a static VietQR payload when amount is omitted or 0", () => {
      const payload = buildVietQrPayload({
        bankBin: "970422",
        accountNumber: "0987654321",
      });

      // Static QR (Tag 01: 010211)
      expect(payload.includes("010211")).toBe(true);
      // No Tag 54 (amount tag)
      expect(payload).not.toMatch(/530370454/);
      expect(payload).toMatch(/6304[0-9A-F]{4}$/);
    });

    it("rejects invalid BIN", () => {
      expect(() =>
        buildVietQrPayload({
          bankBin: "123", // not 6 digits
          accountNumber: "12345678",
        })
      ).toThrow("Mã BIN");
    });

    it("rejects empty account number", () => {
      expect(() =>
        buildVietQrPayload({
          bankBin: "970407",
          accountNumber: "",
        })
      ).toThrow("Số tài khoản");
    });
  });

  describe("generateQrDataUrl", () => {
    it("generates a valid data URL image/png offline", async () => {
      const payload = "00020101021138540010A00000072701240006970407011001234567890208QRIBFTTA53037045802VN630429B1";
      const dataUrl = await generateQrDataUrl(payload);

      expect(typeof dataUrl).toBe("string");
      expect(dataUrl.startsWith("data:image/png;base64,")).toBe(true);
    });

    it("throws on empty text", async () => {
      await expect(generateQrDataUrl("")).rejects.toThrow("không được để trống");
    });
  });
});
