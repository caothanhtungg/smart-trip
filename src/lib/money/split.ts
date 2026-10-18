export interface EqualShareResult {
  memberId: string;
  amount: number;
  hasRemainderExtra: boolean;
}

export type ParticipantInput = string | { id: string; joinOrder?: number };

/**
 * Thuật toán chia đều số nguyên VND có phân bổ phần dư theo quy tắc R4:
 * - Base = floor(totalAmount / N)
 * - Remainder = totalAmount - (Base * N)
 * - Các thành viên có index < Remainder (theo thứ tự joinOrder) nhận Base + 1 VND
 * - Các thành viên còn lại nhận Base VND
 *
 * Kiểm tra nghiêm ngặt:
 * - Ném lỗi nếu totalAmount không phải số nguyên dương (không làm tròn im lặng).
 * - Ném lỗi nếu danh sách người chia rỗng.
 * - Ném lỗi nếu có ID người chia trùng lặp.
 * - Bảo toàn bất biến số học: Tổng các phần chia luôn chính xác 100% bằng totalAmount.
 */
export function computeEqualShares(
  totalAmount: number,
  participants: readonly ParticipantInput[]
): EqualShareResult[] {
  // 1. Kiểm tra số tiền
  if (
    typeof totalAmount !== "number" ||
    !Number.isSafeInteger(totalAmount) ||
    totalAmount <= 0
  ) {
    throw new TypeError(
      `[computeEqualShares] Số tiền chia phải là số nguyên dương an toàn (Safe Integer > 0). Nhận được: ${totalAmount}`
    );
  }

  // 2. Kiểm tra danh sách người chia
  if (!participants || participants.length === 0) {
    throw new Error("[computeEqualShares] Danh sách người tham gia chia tiền không được để trống.");
  }

  // 3. Kiểm tra ID trùng lặp
  const seenIds = new Set<string>();
  for (const item of participants) {
    const id = typeof item === "string" ? item : item?.id;
    if (!id || typeof id !== "string") {
      throw new Error("[computeEqualShares] ID thành viên không hợp lệ.");
    }
    if (seenIds.has(id)) {
      throw new Error(`[computeEqualShares] Phát hiện ID người tham gia bị trùng lặp: ${id}`);
    }
    seenIds.add(id);
  }

  // 4. Sắp xếp ổn định theo joinOrder tăng dần
  const sortedParticipants = [...participants].sort((a, b) => {
    const orderA = typeof a === "object" && typeof a.joinOrder === "number" ? a.joinOrder : 0;
    const orderB = typeof b === "object" && typeof b.joinOrder === "number" ? b.joinOrder : 0;
    return orderA - orderB;
  });

  const n = sortedParticipants.length;
  const base = Math.floor(totalAmount / n);
  const remainder = totalAmount - base * n; // 0 <= remainder < n

  let runningSum = 0;
  const results: EqualShareResult[] = sortedParticipants.map((item, index) => {
    const id = typeof item === "string" ? item : item.id;
    const hasRemainderExtra = index < remainder;
    const amount = base + (hasRemainderExtra ? 1 : 0);
    runningSum += amount;

    return {
      memberId: id,
      amount,
      hasRemainderExtra,
    };
  });

  // 5. Kiểm tra bất biến số học nghiêm ngặt
  if (runningSum !== totalAmount) {
    throw new Error(
      `[computeEqualShares] Lỗi bất biến số học: Tổng phần chia (${runningSum}) không khớp số tiền tổng (${totalAmount})`
    );
  }

  return results;
}
