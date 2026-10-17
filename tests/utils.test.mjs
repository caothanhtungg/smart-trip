import test from "node:test";
import assert from "node:assert/strict";

// Re-import or test the utility logic directly
function formatDate(date) {
  if (!date) return "";

  if (typeof date === "string") {
    const trimmed = date.trim();
    if (!trimmed) return "";

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

    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) return "";
    const day = String(parsed.getDate()).padStart(2, "0");
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  if (date instanceof Date) {
    if (isNaN(date.getTime())) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return "";
}

function formatMoney(amount) {
  const formatted = new Intl.NumberFormat("vi-VN").format(Math.round(amount));
  return `${formatted} ₫`;
}

test("formatDate: Handles ISO Date-only format without timezone shift", () => {
  assert.equal(formatDate("2026-11-20"), "20/11/2026");
  assert.equal(formatDate("2025-01-05"), "05/01/2025");
});

test("formatDate: Handles Vietnamese format DD/MM/YYYY and DD-MM-YYYY", () => {
  assert.equal(formatDate("20/11/2026"), "20/11/2026");
  assert.equal(formatDate("5/4/2027"), "05/04/2027");
  assert.equal(formatDate("15-08-2026"), "15/08/2026");
});

test("formatDate: Handles Date objects dynamically without hardcoding year", () => {
  const d1 = new Date(2026, 10, 20); // 20/11/2026
  const d2 = new Date(2030, 0, 1);   // 01/01/2030
  assert.equal(formatDate(d1), "20/11/2026");
  assert.equal(formatDate(d2), "01/01/2030");
});

test("formatDate: Handles leap years and rejects impossible calendar dates", () => {
  assert.equal(formatDate("2024-02-29"), "29/02/2024"); // 2024 is leap
  assert.equal(formatDate("2023-02-29"), "");           // 2023 is non-leap -> invalid
  assert.equal(formatDate("31/02/2026"), "");           // Feb 31 does not exist
  assert.equal(formatDate("31/04/2026"), "");           // April has only 30 days
});

test("formatDate: Handles null, undefined, empty, and invalid strings gracefully", () => {
  assert.equal(formatDate(null), "");
  assert.equal(formatDate(undefined), "");
  assert.equal(formatDate(""), "");
  assert.equal(formatDate("not-a-date"), "");
});

test("formatMoney: Vietnamese currency standard", () => {
  assert.equal(formatMoney(1250000), "1.250.000 ₫");
  assert.equal(formatMoney(0), "0 ₫");
});
