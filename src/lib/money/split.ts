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

export interface ItemizedExpenseItemInput {
  id: string;
  name: string;
  amount: number; // Integer VND > 0
  assignedMemberIds: string[]; // Tối thiểu 1 thành viên
}

export interface ItemizedSurchargeInput {
  name?: string;
  amount: number; // Integer VND >= 0
}

export interface ParticipantWithJoinOrder {
  id: string;
  joinOrder: number;
}

export interface ItemizedMemberShareResult {
  memberId: string;
  itemsAmount: number; // Tổng tiền các món thành viên ăn
  surchargeAmount: number; // Tiền phụ phí VAT/dịch vụ phải chịu
  totalAmount: number; // itemsAmount + surchargeAmount
  assignedItemCount: number; // Số món tham gia
}

/**
 * Thuật toán chia tiền theo từng món ăn kết hợp phụ phí VAT / Phí dịch vụ (Giai đoạn 2D.2)
 *
 * Quy tắc nghiệp vụ đã phê duyệt:
 * 1. Mỗi món ăn được chia đều cho những người được gán món đó (dùng lại quy tắc phần dư R4 theo joinOrder độc lập cho từng món).
 * 2. Dòng "Thuế & phí dịch vụ" chia đều cho những người tham gia hóa đơn.
 *    - "Người tham gia hóa đơn": Chỉ những thành viên có ít nhất 1 món ăn trong hóa đơn (Quyết định người dùng duyệt ngày 18/10/2026).
 *    - Người ăn ít chịu phụ phí bằng người ăn nhiều (Hạn chế đã biết của Release 1).
 *    - Thành viên không ăn món nào (0 món) không phải chịu phụ phí của hóa đơn.
 * 3. Bất biến số học tuyệt đối: Tổng phần chia của mọi người phải bằng chính xác 100% số tiền hóa đơn totalAmount.
 * 4. Nếu tổng các món cộng phụ phí khác totalAmount: ném lỗi (chặn lưu).
 */
export function computeItemizedShares(
  totalAmount: number,
  items: readonly ItemizedExpenseItemInput[],
  surcharge: ItemizedSurchargeInput | null,
  participants: readonly ParticipantWithJoinOrder[]
): ItemizedMemberShareResult[] {
  // 1. Kiểm tra tổng số tiền hóa đơn
  if (
    typeof totalAmount !== "number" ||
    !Number.isSafeInteger(totalAmount) ||
    totalAmount <= 0
  ) {
    throw new TypeError(
      `[computeItemizedShares] Tổng số tiền hóa đơn phải là số nguyên dương an toàn (Safe Integer > 0). Nhận được: ${totalAmount}`
    );
  }

  // 2. Kiểm tra danh sách món
  if (!items || items.length === 0) {
    throw new Error("[computeItemizedShares] Danh sách món ăn không được để trống khi chia theo món.");
  }

  // 3. Kiểm tra danh sách thành viên hợp lệ
  if (!participants || participants.length === 0) {
    throw new Error("[computeItemizedShares] Danh sách thành viên chuyến đi không được để trống.");
  }

  const participantMap = new Map<string, ParticipantWithJoinOrder>();
  for (const p of participants) {
    if (!p.id) {
      throw new Error("[computeItemizedShares] Thành viên thiếu trường ID.");
    }
    participantMap.set(p.id, p);
  }

  // 4. Kiểm tra từng món và đối soát tổng
  let sumItems = 0;
  for (const item of items) {
    if (
      typeof item.amount !== "number" ||
      !Number.isSafeInteger(item.amount) ||
      item.amount <= 0
    ) {
      throw new TypeError(
        `[computeItemizedShares] Số tiền của món "${item.name || item.id}" phải là số nguyên dương an toàn (> 0). Nhận được: ${item.amount}`
      );
    }

    if (!item.assignedMemberIds || item.assignedMemberIds.length === 0) {
      throw new Error(
        `[computeItemizedShares] Món "${item.name || item.id}" chưa có thành viên nào tham gia.`
      );
    }

    // Kiểm tra trùng lặp người trong món và người phải thuộc chuyến đi
    const itemMemberSet = new Set<string>();
    for (const memberId of item.assignedMemberIds) {
      if (!participantMap.has(memberId)) {
        throw new Error(
          `[computeItemizedShares] Thành viên "${memberId}" gán vào món "${item.name || item.id}" không thuộc danh sách thành viên chuyến đi.`
        );
      }
      if (itemMemberSet.has(memberId)) {
        throw new Error(
          `[computeItemizedShares] Phát hiện trùng lặp thành viên "${memberId}" trong cùng món "${item.name || item.id}".`
        );
      }
      itemMemberSet.add(memberId);
    }

    sumItems += item.amount;
  }

  // 5. Kiểm tra phụ phí VAT / dịch vụ
  let surchargeAmount = 0;
  if (surcharge !== null && surcharge !== undefined) {
    if (
      typeof surcharge.amount !== "number" ||
      !Number.isSafeInteger(surcharge.amount) ||
      surcharge.amount < 0
    ) {
      throw new TypeError(
        `[computeItemizedShares] Phụ phí VAT / dịch vụ phải là số nguyên an toàn không âm (>= 0). Nhận được: ${surcharge.amount}`
      );
    }
    surchargeAmount = surcharge.amount;
  }

  // 6. Kiểm tra đối soát tổng khớp tuyệt đối hóa đơn
  if (sumItems + surchargeAmount !== totalAmount) {
    throw new Error(
      `[computeItemizedShares] Tổng các món (${sumItems.toLocaleString("vi-VN")} ₫) cộng phụ phí (${surchargeAmount.toLocaleString("vi-VN")} ₫) = ${(sumItems + surchargeAmount).toLocaleString("vi-VN")} ₫ không khớp với tổng tiền hóa đơn (${totalAmount.toLocaleString("vi-VN")} ₫). Chênh lệch: ${(sumItems + surchargeAmount - totalAmount).toLocaleString("vi-VN")} ₫.`
    );
  }

  // 7. Chia tiền từng món bằng computeEqualShares
  const memberItemsTotal = new Map<string, number>();
  const memberItemCounts = new Map<string, number>();

  for (const item of items) {
    const itemParticipants = item.assignedMemberIds.map((id) => participantMap.get(id)!);
    const shares = computeEqualShares(item.amount, itemParticipants);

    for (const share of shares) {
      memberItemsTotal.set(
        share.memberId,
        (memberItemsTotal.get(share.memberId) || 0) + share.amount
      );
      memberItemCounts.set(
        share.memberId,
        (memberItemCounts.get(share.memberId) || 0) + 1
      );
    }
  }

  // 8. Chia phụ phí VAT / Dịch vụ cho những người tham gia hóa đơn
  const surchargeShareMap = new Map<string, number>();

  if (surchargeAmount > 0) {
    // Người tham gia hóa đơn = những người có ít nhất 1 món
    const billParticipants = participants.filter(
      (p) => (memberItemCounts.get(p.id) || 0) > 0
    );

    if (billParticipants.length === 0) {
      throw new Error(
        "[computeItemizedShares] Không có thành viên nào tham gia món ăn để chia sẻ phụ phí VAT/dịch vụ."
      );
    }

    const surchargeShares = computeEqualShares(surchargeAmount, billParticipants);
    for (const s of surchargeShares) {
      surchargeShareMap.set(s.memberId, s.amount);
    }
  }

  // 9. Tổng hợp kết quả trả về cho các thành viên tham gia hóa đơn
  const results: ItemizedMemberShareResult[] = [];
  let runningTotal = 0;

  // Giữ thứ tự hiển thị theo joinOrder của các thành viên tham gia
  const sortedParticipants = [...participants].sort((a, b) => a.joinOrder - b.joinOrder);

  for (const p of sortedParticipants) {
    const itemsAmt = memberItemsTotal.get(p.id) || 0;
    const surchargeAmt = surchargeShareMap.get(p.id) || 0;
    const itemCount = memberItemCounts.get(p.id) || 0;
    const total = itemsAmt + surchargeAmt;

    if (itemCount > 0 || total > 0) {
      runningTotal += total;
      results.push({
        memberId: p.id,
        itemsAmount: itemsAmt,
        surchargeAmount: surchargeAmt,
        totalAmount: total,
        assignedItemCount: itemCount,
      });
    }
  }

  // 10. Kiểm tra bất biến số học cuối cùng
  if (runningTotal !== totalAmount) {
    throw new Error(
      `[computeItemizedShares] Lỗi bất biến số học nghiêm trọng: Tổng các phần chia (${runningTotal}) khác số tiền hóa đơn (${totalAmount}).`
    );
  }

  return results;
}

