import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import {
  encryptBankAccount,
  decryptBankAccount,
  getEncryptionKey,
  CURRENT_BANK_KEY_VERSION,
  maskBankAccount,
} from "./bank-encryption";

// Khóa 64-char hex (32 bytes ngẫu nhiên) dùng cho test
const TEST_KEY_HEX = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const SECOND_TEST_KEY_HEX = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";

describe("Bank Account Encryption (AES-256-GCM)", () => {
  const originalEnvKey = process.env.BANK_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.BANK_ENCRYPTION_KEY = TEST_KEY_HEX;
  });

  afterEach(() => {
    if (originalEnvKey !== undefined) {
      process.env.BANK_ENCRYPTION_KEY = originalEnvKey;
    } else {
      delete process.env.BANK_ENCRYPTION_KEY;
    }
  });

  describe("getEncryptionKey validation", () => {
    it("accepts valid 64-char hex key", () => {
      const keyBuf = getEncryptionKey(TEST_KEY_HEX);
      expect(keyBuf).toBeInstanceOf(Buffer);
      expect(keyBuf.length).toBe(32);
    });

    it("accepts valid 32-byte raw utf-8 string", () => {
      const raw32 = "12345678901234567890123456789012";
      const keyBuf = getEncryptionKey(raw32);
      expect(keyBuf.length).toBe(32);
    });

    it("accepts valid base64 encoded 32-byte key", () => {
      const b64Key = Buffer.from(crypto.randomBytes(32)).toString("base64");
      const keyBuf = getEncryptionKey(b64Key);
      expect(keyBuf.length).toBe(32);
    });

    it("fails closed when key is missing or empty", () => {
      delete process.env.BANK_ENCRYPTION_KEY;
      expect(() => getEncryptionKey()).toThrow(/missing or empty/i);
      expect(() => getEncryptionKey("")).toThrow(/missing or empty/i);
      expect(() => getEncryptionKey("   ")).toThrow(/missing or empty/i);
    });

    it("fails closed when key length is invalid (not 32 bytes)", () => {
      expect(() => getEncryptionKey("short_key")).toThrow(/must be exactly 32 bytes/i);
      expect(() => getEncryptionKey("0123456789abcdef")).toThrow(/must be exactly 32 bytes/i);
    });
  });

  describe("encryptBankAccount & decryptBankAccount round-trip", () => {
    const dummyAccounts = [
      "0123456789",
      "987654321098",
      "1903000000001",
      "VIB-TEST-8888",
    ];

    it.each(dummyAccounts)("successfully round-trips dummy account '%s'", (account) => {
      const encrypted = encryptBankAccount(account);
      expect(encrypted.keyVersion).toBe(CURRENT_BANK_KEY_VERSION);
      expect(typeof encrypted.encryptedAccountNo).toBe("string");

      const decrypted = decryptBankAccount(encrypted.encryptedAccountNo);
      expect(decrypted).toBe(account);
    });

    it("produces different ciphertexts and IVs for the same account (random IV)", () => {
      const account = "1234567890";
      const res1 = encryptBankAccount(account);
      const res2 = encryptBankAccount(account);

      expect(res1.encryptedAccountNo).not.toBe(res2.encryptedAccountNo);

      const iv1 = res1.encryptedAccountNo.split(":")[0];
      const iv2 = res2.encryptedAccountNo.split(":")[0];
      expect(iv1).not.toBe(iv2);

      // Cả 2 đều giải mã ra đúng số tài khoản
      expect(decryptBankAccount(res1.encryptedAccountNo)).toBe(account);
      expect(decryptBankAccount(res2.encryptedAccountNo)).toBe(account);
    });

    it("trims whitespace before encrypting", () => {
      const res = encryptBankAccount("   0123456789   ");
      expect(decryptBankAccount(res.encryptedAccountNo)).toBe("0123456789");
    });

    it("throws when encrypting empty or invalid inputs", () => {
      expect(() => encryptBankAccount("")).toThrow(/cannot be empty/i);
      expect(() => encryptBankAccount("   ")).toThrow(/cannot be empty/i);
      // @ts-expect-error test invalid type
      expect(() => encryptBankAccount(null)).toThrow(/cannot be empty/i);
    });
  });

  describe("Tamper resistance and integrity validation", () => {
    it("fails closed when ciphertext is tampered (1 bit flipped)", () => {
      const encrypted = encryptBankAccount("999988887777");
      const parts = encrypted.encryptedAccountNo.split(":");
      const cipherHex = parts[2];

      // Đổi 1 ký tự hex cuối cùng
      const lastChar = cipherHex.slice(-1);
      const flippedChar = lastChar === "a" ? "b" : "a";
      const tamperedCipher = cipherHex.slice(0, -1) + flippedChar;

      const tamperedPayload = `${parts[0]}:${parts[1]}:${tamperedCipher}`;

      expect(() => decryptBankAccount(tamperedPayload)).toThrow(
        /Decryption failed: authentication tag mismatch, tampered data/i
      );
    });

    it("fails closed when authTag is tampered", () => {
      const encrypted = encryptBankAccount("999988887777");
      const parts = encrypted.encryptedAccountNo.split(":");
      const authTagHex = parts[1];

      // Đổi 1 ký tự trong authTag
      const flippedTag = (authTagHex[0] === "0" ? "1" : "0") + authTagHex.slice(1);
      const tamperedPayload = `${parts[0]}:${flippedTag}:${parts[2]}`;

      expect(() => decryptBankAccount(tamperedPayload)).toThrow(
        /Decryption failed: authentication tag mismatch, tampered data/i
      );
    });

    it("fails closed when attempting decryption with a different key", () => {
      const encrypted = encryptBankAccount("999988887777", { key: TEST_KEY_HEX });

      expect(() =>
        decryptBankAccount(encrypted.encryptedAccountNo, { key: SECOND_TEST_KEY_HEX })
      ).toThrow(/Decryption failed: authentication tag mismatch, tampered data/i);
    });
  });

  describe("Malformed format rejection", () => {
    it("rejects string with wrong number of colon-separated segments", () => {
      expect(() => decryptBankAccount("part1:part2")).toThrow(/Expected 'iv:authTag:ciphertext'/i);
      expect(() => decryptBankAccount("part1:part2:part3:part4")).toThrow(
        /Expected 'iv:authTag:ciphertext'/i
      );
      expect(() => decryptBankAccount("single_string")).toThrow(
        /Expected 'iv:authTag:ciphertext'/i
      );
    });

    it("rejects non-hex characters", () => {
      expect(() => decryptBankAccount("invalid_hex:auth_tag:ciphertext")).toThrow(
        /must be valid hexadecimal/i
      );
    });

    it("rejects invalid IV length (must be 12 bytes = 24 hex chars)", () => {
      const shortIv = "abcd".repeat(3); // 12 chars = 6 bytes
      const validTag = "00".repeat(16);
      const validCipher = "00".repeat(8);
      expect(() => decryptBankAccount(`${shortIv}:${validTag}:${validCipher}`)).toThrow(
        /Invalid IV length/i
      );
    });

    it("rejects invalid AuthTag length (must be 16 bytes = 32 hex chars)", () => {
      const validIv = "00".repeat(12);
      const shortTag = "00".repeat(8); // 8 bytes instead of 16
      const validCipher = "00".repeat(8);
      expect(() => decryptBankAccount(`${validIv}:${shortTag}:${validCipher}`)).toThrow(
        /Invalid auth tag length/i
      );
    });
  });

  describe("maskBankAccount", () => {
    it("masks standard bank account number keeping last 4 digits", () => {
      expect(maskBankAccount("0123456789")).toBe("**** **** 6789");
      expect(maskBankAccount("19036542890011")).toBe("**** **** 0011");
    });

    it("handles short bank account numbers safely", () => {
      expect(maskBankAccount("1234")).toBe("****");
      expect(maskBankAccount("12")).toBe("****");
    });

    it("returns null for empty, null, or undefined values", () => {
      expect(maskBankAccount("")).toBeNull();
      expect(maskBankAccount("   ")).toBeNull();
      expect(maskBankAccount(null)).toBeNull();
      expect(maskBankAccount(undefined)).toBeNull();
    });
  });
});
