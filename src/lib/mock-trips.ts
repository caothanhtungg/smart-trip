import type { Trip, OverallBalanceSummary, TripFilterTab } from "../types/trip";

/**
 * Mock current authenticated user profile for UI demonstration.
 * In later backend stages, this will be provided by Auth.js session.
 */
export const MOCK_CURRENT_USER = {
  id: "usr-current",
  name: "Lan",
  fullName: "Lan Nguyễn",
  email: "lan.nguyen@gmail.com",
  avatarUrl: null, // Will use tactical initial avatar LN
};

/**
 * Standard mock trips data aligned with Stitch screen 'chuy_n_i_c_a_t_i'
 * Note: Sa Pa trip dates are adjusted to 10/10/2026 - 13/10/2026 to ensure
 * consistency with COMPLETED status relative to the current project date (17/10/2026).
 */
export const MOCK_TRIPS: Trip[] = [
  {
    id: "trip-dalat-3n2d",
    title: "Đà Lạt 3N2Đ",
    destination: "Đà Lạt, Lâm Đồng",
    startDate: "2026-11-20",
    endDate: "2026-11-22",
    durationText: "3 ngày 2 đêm",
    status: "ACTIVE", // "Đang lên kế hoạch"
    members: [
      { id: "m1", name: "Lan Nguyễn", role: "HOST" },
      { id: "m2", name: "Tuấn Huy", role: "MEMBER" },
      { id: "m3", name: "Quang Minh", role: "MEMBER" },
      { id: "m4", name: "Thanh Quang", role: "MEMBER" },
      { id: "m5", name: "Thu Hà", role: "MEMBER" },
    ],
    totalMembers: 5,
    userBalance: {
      type: "RECEIVE",
      amount: 350000,
      label: "Được nhận",
    },
    coverGradient: {
      from: "#D9ED92",
      via: "#52B69A",
      to: "#184E77",
    },
  },
  {
    id: "trip-phuquoc-team",
    title: "Phú Quốc cùng team",
    destination: "Phú Quốc, Kiên Giang",
    startDate: "2026-12-12",
    endDate: "2026-12-15",
    durationText: "4 ngày 3 đêm",
    status: "SETTLING", // "Đang thanh toán"
    members: [
      { id: "m6", name: "Hoàng Anh", role: "HOST" },
      { id: "m7", name: "Bảo Minh", role: "MEMBER" },
      { id: "m8", name: "Khánh Duy", role: "MEMBER" },
      { id: "m9", name: "Lan Nguyễn", role: "MEMBER" },
      { id: "m10", name: "Phương Linh", role: "MEMBER" },
      { id: "m11", name: "Văn An", role: "MEMBER", isNoAccount: true },
    ],
    totalMembers: 6,
    userBalance: {
      type: "PAY",
      amount: 120000,
      label: "Cần trả",
    },
    coverGradient: {
      from: "#34A0A4",
      via: "#168AAD",
      to: "#184E77",
    },
  },
  {
    id: "trip-sapa-harvest",
    title: "Sa Pa mùa lúa chín",
    destination: "Sa Pa, Lào Cai",
    startDate: "2026-10-10", // Adjusted from 15/10 to 10/10 as requested
    endDate: "2026-10-13",   // Adjusted from 18/10 to 13/10 (past date for COMPLETED status)
    durationText: "4 ngày 3 đêm",
    status: "COMPLETED", // "Đã hoàn tất"
    members: [
      { id: "m12", name: "Phương Linh", role: "HOST" },
      { id: "m13", name: "Việt Anh", role: "MEMBER" },
      { id: "m14", name: "Tiến Đạt", role: "MEMBER" },
      { id: "m15", name: "Lan Nguyễn", role: "MEMBER" },
    ],
    totalMembers: 4,
    userBalance: {
      type: "SETTLED",
      amount: 0,
      label: "Đã xong",
    },
    coverGradient: {
      from: "#99D98C",
      via: "#52B69A",
      to: "#1E6091",
    },
  },
];

/**
 * Calculates overall summary of balances across all trips for the current user.
 */
export function getOverallBalance(trips: Trip[] = MOCK_TRIPS): OverallBalanceSummary {
  let toReceive = 0;
  let toPay = 0;

  for (const trip of trips) {
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

/**
 * Filters trips based on the active tab:
 * - 'all': All trips
 * - 'active': 'ACTIVE' (Đang lên kế hoạch) or 'SETTLING' (Đang thanh toán)
 * - 'completed': 'COMPLETED' (Đã hoàn tất)
 */
export function filterTrips(trips: Trip[], tab: TripFilterTab): Trip[] {
  if (tab === "active") {
    return trips.filter((t) => t.status === "ACTIVE" || t.status === "SETTLING");
  }
  if (tab === "completed") {
    return trips.filter((t) => t.status === "COMPLETED");
  }
  return trips;
}
