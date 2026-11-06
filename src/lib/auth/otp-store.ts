import crypto from "node:crypto";
import { prisma } from "@/lib/db/prisma";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const OTP_IDENTIFIER_PREFIX = "email-otp:";
const OTP_VALUE_PREFIX = "smart-trip-otp:v1:";

type OtpFailureReason = "EXPIRED" | "INCORRECT" | "MAX_ATTEMPTS" | "NOT_FOUND";

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function identifierFor(email: string): string {
  return `${OTP_IDENTIFIER_PREFIX}${normalizeEmail(email)}`;
}

function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function serializeValue(code: string, attempts: number): string {
  return `${OTP_VALUE_PREFIX}${hashOtp(code)}:${attempts}`;
}

function parseValue(value: string): { hash: string; attempts: number } | null {
  const match = new RegExp(`^${OTP_VALUE_PREFIX}([a-f0-9]{64}):(\\d+)$`).exec(value);
  if (!match) return null;
  const attempts = Number(match[2]);
  return Number.isSafeInteger(attempts) && attempts >= 0 ? { hash: match[1], attempts } : null;
}

export function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export async function saveOtp(email: string, code: string): Promise<void> {
  const identifier = identifierFor(email);
  await prisma.$transaction(async (tx) => {
    await tx.verification.deleteMany({ where: { identifier } });
    await tx.verification.create({
      data: {
        identifier,
        value: serializeValue(code, 0),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
  });
}

export async function verifyOtp(
  email: string,
  inputCode: string
): Promise<{ valid: boolean; reason?: OtpFailureReason }> {
  const identifier = identifierFor(email);
  const record = await prisma.verification.findFirst({
    where: { identifier },
    orderBy: { createdAt: "desc" },
  });

  if (!record) return { valid: false, reason: "NOT_FOUND" };

  if (record.expiresAt.getTime() <= Date.now()) {
    await prisma.verification.delete({ where: { id: record.id } });
    return { valid: false, reason: "EXPIRED" };
  }

  const parsed = parseValue(record.value);
  if (!parsed || parsed.attempts >= MAX_ATTEMPTS) {
    await prisma.verification.delete({ where: { id: record.id } });
    return { valid: false, reason: "MAX_ATTEMPTS" };
  }

  const suppliedHash = hashOtp(inputCode.trim());
  const matches = crypto.timingSafeEqual(Buffer.from(parsed.hash, "hex"), Buffer.from(suppliedHash, "hex"));
  if (!matches) {
    const attempts = parsed.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await prisma.verification.delete({ where: { id: record.id } });
      return { valid: false, reason: "MAX_ATTEMPTS" };
    }
    await prisma.verification.update({
      where: { id: record.id },
      data: { value: `${OTP_VALUE_PREFIX}${parsed.hash}:${attempts}` },
    });
    return { valid: false, reason: "INCORRECT" };
  }

  await prisma.verification.delete({ where: { id: record.id } });
  return { valid: true };
}

