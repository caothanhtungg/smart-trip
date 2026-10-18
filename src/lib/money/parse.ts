/**
 * MỘT bộ xử lý nhập liệu tiền tệ duy nhất cho toàn bộ ứng dụng Smart Trip.
 * Thay thế cho các hàm parse/format rải rác trước đây.
 */

/**
 * Chuyển đổi giá trị nhập liệu (chuỗi người dùng gõ có thể chứa dấu chấm, phẩy, ký hiệu đ, khoảng trắng)
 * thành số nguyên VND an toàn.
 */
export function parseMoneyInput(
  raw: string | number | null | undefined
): number | null {
  if (raw === null || raw === undefined) return null;

  if (typeof raw === "number") {
    if (isNaN(raw) || raw < 0 || !Number.isSafeInteger(raw)) return null;
    return raw;
  }

  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("-") || trimmed.startsWith("−")) return null;

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  const parsed = parseInt(digits, 10);
  if (isNaN(parsed) || parsed < 0 || !Number.isSafeInteger(parsed)) return null;

  return parsed;
}

/**
 * Định dạng số nguyên VND thành chuỗi phân cách hàng nghìn (ví dụ: 1250000 -> "1.250.000")
 * để gán vào thuộc tính value của thẻ input.
 * Trả về chuỗi rỗng nếu giá trị là null, undefined, NaN hoặc <= 0.
 */
export function formatMoneyInputValue(
  amount: number | null | undefined
): string {
  if (amount === null || amount === undefined || isNaN(amount) || amount <= 0) {
    return "";
  }
  if (!Number.isSafeInteger(amount)) {
    return "";
  }
  return new Intl.NumberFormat("vi-VN").format(amount);
}
