import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind class names cleanly without duplicate or conflicting utilities.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import { formatMoney, formatSignedMoney } from "@/lib/money/format";

export { formatMoney, formatSignedMoney };

const VN_TIMEZONE = "Asia/Ho_Chi_Minh";

const vnDateFormatter = new Intl.DateTimeFormat("vi-VN", {
  timeZone: VN_TIMEZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/**
 * Standard Vietnamese date formatter. Format: dd/MM/yyyy.
 * Handles Date objects, ISO strings (YYYY-MM-DD), full ISO timestamps, and DD/MM/YYYY inputs.
 * Prevents timezone shifting on date-only strings and validates calendar ranges.
 * For timestamps with time/timezone, fixes timezone to Asia/Ho_Chi_Minh.
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

    // 3. Full ISO timestamp (e.g. "2026-11-20T20:30:00Z")
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) return "";
    return vnDateFormatter.format(parsed);
  }

  // 4. Date object
  if (date instanceof Date) {
    if (isNaN(date.getTime())) return "";
    return vnDateFormatter.format(date);
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
    "bg-lime-cream", // Lime Cream
    "bg-light-green", // Light Green
    "bg-mint-green", // Mint Green
    "bg-ocean-mist", // Ocean Mist
    "bg-emerald-fill", // Emerald
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % palette.length;
  return palette[index];
}
