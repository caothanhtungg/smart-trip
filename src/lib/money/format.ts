/**
 * Định dạng tiền tệ VND chuẩn Việt Nam sử dụng khoảng trắng không ngắt (U+00A0) trước ký hiệu "₫".
 * Nghiêm ngặt: Ném lỗi nếu số tiền không phải là số nguyên an toàn (không làm tròn im lặng).
 */

export function assertSafeIntegerAmount(amount: number, functionName = "formatMoney"): void {
  if (typeof amount !== "number" || !Number.isSafeInteger(amount)) {
    throw new TypeError(
      `[${functionName}] Số tiền phải là số nguyên an toàn (Safe Integer). Nhận được: ${amount}`
    );
  }
}

/**
 * Định dạng số nguyên VND sang chuỗi hiển thị.
 * Ví dụ: 1250000 -> "1.250.000 ₫" (dùng non-breaking space \u00A0 trước ₫)
 */
export function formatMoney(amount: number): string {
  assertSafeIntegerAmount(amount, "formatMoney");
  const formatted = new Intl.NumberFormat("vi-VN").format(amount);
  return `${formatted}\u00A0₫`;
}

/**
 * Định dạng số dư có dấu (+ cho số dương, - cho số âm, không dấu cho 0)
 * kèm theo class màu token tương ứng.
 */
export function formatSignedMoney(amount: number): {
  text: string;
  className: string;
} {
  assertSafeIntegerAmount(amount, "formatSignedMoney");

  const isPositive = amount > 0;
  const isNegative = amount < 0;
  const sign = isPositive ? "+" : isNegative ? "-" : "";
  const absAmount = Math.abs(amount);
  const formatted = new Intl.NumberFormat("vi-VN").format(absAmount);

  return {
    text: `${sign}${formatted}\u00A0₫`,
    className: isPositive
      ? "text-functional-positive font-semibold"
      : isNegative
      ? "text-functional-negative font-semibold"
      : "text-text-muted font-normal",
  };
}
