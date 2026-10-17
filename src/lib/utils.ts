import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind class names cleanly without duplicate or conflicting utilities.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Standard Vietnamese currency formatter with dot separator and currency symbol.
 * Example: 1250000 -> "1.250.000 ₫"
 */
export function formatMoney(amount: number): string {
  const formatted = new Intl.NumberFormat("vi-VN").format(Math.round(amount));
  return `${formatted} ₫`;
}

/**
 * Formats a signed balance amount (+ for positive, - for debt).
 * Positive uses #2E7D5B, negative uses #B42318.
 */
export function formatSignedMoney(amount: number): {
  text: string;
  className: string;
} {
  const isPositive = amount > 0;
  const isNegative = amount < 0;
  const sign = isPositive ? "+" : isNegative ? "-" : "";
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat("vi-VN").format(Math.round(absAmount));
  
  return {
    text: `${sign}${formatted} ₫`,
    className: isPositive
      ? "text-functional-positive font-semibold"
      : isNegative
      ? "text-functional-negative font-semibold"
      : "text-text-muted font-normal",
  };
}

/**
 * Standard Vietnamese date formatter. Format: dd/MM/yyyy.
 * Handles Date objects, ISO strings (YYYY-MM-DD), full ISO timestamps, and DD/MM/YYYY inputs.
 * Prevents timezone shifting on date-only strings and validates calendar ranges.
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";

  if (typeof date === "string") {
    const trimmed = date.trim();
    if (!trimmed) return "";

    // 1. Vietnamese format: DD/MM/YYYY or DD-MM-YYYY
    const vnMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (vnMatch) {
      const day = parseInt(vnMatch[1], 10);
      const month = parseInt(vnMatch[2], 10);
      const year = parseInt(vnMatch[3], 10);
      const testDate = new Date(year, month - 1, day);
      if (
        testDate.getFullYear() === year &&
        testDate.getMonth() === month - 1 &&
        testDate.getDate() === day
      ) {
        return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
      }
      return "";
    }

    // 2. Date-only ISO format: YYYY-MM-DD (parse directly to prevent UTC midnight timezone shift)
    const isoDateOnlyMatch = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
    if (isoDateOnlyMatch) {
      const year = parseInt(isoDateOnlyMatch[1], 10);
      const month = parseInt(isoDateOnlyMatch[2], 10);
      const day = parseInt(isoDateOnlyMatch[3], 10);
      const testDate = new Date(year, month - 1, day);
      if (
        testDate.getFullYear() === year &&
        testDate.getMonth() === month - 1 &&
        testDate.getDate() === day
      ) {
        return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${year}`;
      }
      return "";
    }

    // 3. Full ISO timestamp (e.g. "2026-11-20T14:30:00Z")
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) return "";
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // 4. Date object
  if (date instanceof Date) {
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return "";
}

/**
 * Standard 24h time formatter. Format: HH:mm.
 */
export function formatTime(time: string): string {
  if (!time) return "";
  // If input is "14:30:00", return "14:30"
  const parts = time.split(":");
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
  }
  return time;
}

/**
 * Generate avatar initials from Vietnamese name.
 * Example: "Nguyễn Văn Nam" -> "NN", "Lan" -> "L"
 */
export function getInitials(name: string): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].slice(0, 1).toUpperCase();
  }
  return (words[0].slice(0, 1) + words[words.length - 1].slice(0, 1)).toUpperCase();
}

/**
 * Deterministically pick an avatar background color from the approved brand palette.
 */
export function getAvatarBgColor(name: string): string {
  const palette = [
    "bg-[#D9ED92]", // Lime Cream
    "bg-[#B5E48C]", // Light Green
    "bg-[#99D98C]", // Mint Green
    "bg-[#52B69A]", // Ocean Mist
    "bg-[#76C893]", // Emerald
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}
