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
 * Standard Vietnamese date formatter. Format: dd/mm/yyyy.
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
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
