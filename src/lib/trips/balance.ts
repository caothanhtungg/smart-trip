import type { OverallBalanceSummary, UserTripBalance } from "@/types/trip";

/**
 * Tính toán tổng hợp số dư công nợ của người dùng trên toàn bộ các chuyến đi.
 */
export function getOverallBalance(
  trips: readonly { userBalance?: UserTripBalance }[]
): OverallBalanceSummary {
  let toReceive = 0;
  let toPay = 0;

  if (!trips) return { toReceive: 0, toPay: 0, net: 0 };

  for (const trip of trips) {
    if (!trip.userBalance) continue;
    if (trip.userBalance.type === "RECEIVE") {
      toReceive += trip.userBalance.amount;
    } else if (trip.userBalance.type === "PAY") {
      toPay += trip.userBalance.amount;
    }
  }

  return {
    toReceive,
    toPay,
    net: toReceive - toPay,
  };
}
