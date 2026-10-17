import type {
  Trip,
  OverallBalanceSummary,
  TripFilterTab,
  TripSortOption,
  InviteCodeValidationResult,
  TripDetailData,
} from "../types/trip";

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
 * - Trip 1: Đà Lạt 3N2Đ (ACTIVE)
 * - Trip 2: Phú Quốc cùng team (SETTLING)
 * - Trip 3: Sa Pa mùa lúa chín (COMPLETED, 10/10/2026 - 13/10/2026)
 * - All invite codes follow 10-12 alphanumeric characters standard (e.g. DL3N2D-TRIP99).
 */
export const MOCK_TRIPS: readonly Trip[] = Object.freeze([
  {
    id: "trip-dalat-3n2d",
    title: "Đà Lạt 3N2Đ",
    destination: "Đà Lạt, Lâm Đồng",
    startDate: "2026-11-20",
    endDate: "2026-11-22",
    durationText: "3 ngày 2 đêm",
    status: "ACTIVE", // "Đang lên kế hoạch"
    inviteCode: "DL3N2D-TRIP99",
    updatedAt: "2026-10-16T10:00:00Z",
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
    inviteCode: "PQ2026-TEAM01",
    updatedAt: "2026-10-17T09:30:00Z",
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
    startDate: "2026-10-10",
    endDate: "2026-10-13",
    durationText: "4 ngày 3 đêm",
    status: "COMPLETED", // "Đã hoàn tất"
    inviteCode: "SP2026-LUA99",
    updatedAt: "2026-10-13T16:00:00Z",
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
]);

/**
 * Validates invite code format according to project specifications:
 * - 10-12 alphanumeric characters excluding hyphens
 * - Rejects 6-character codes
 * - Normalizes leading/trailing whitespace and uppercase
 * - Validates hyphen formatting (cannot start/end with hyphen, no consecutive hyphens)
 * - Returns structured validation result
 */
export function validateInviteCode(rawCode: string | null | undefined): InviteCodeValidationResult {
  if (!rawCode) {
    return {
      isValid: false,
      error: "Vui lòng nhập mã mời.",
    };
  }

  // 1. Normalize whitespace & uppercase
  const normalized = rawCode.trim().toUpperCase();

  if (!normalized) {
    return {
      isValid: false,
      error: "Vui lòng nhập mã mời.",
    };
  }

  // 2. Validate allowed characters: only alphanumeric [A-Z0-9] and hyphen [-]
  if (!/^[A-Z0-9-]+$/.test(normalized)) {
    return {
      isValid: false,
      error: "Mã mời chỉ được chứa chữ cái (A-Z), số (0-9) và dấu gạch nối (-).",
    };
  }

  // 3. Validate hyphen formatting & count limit (at most 1 hyphen allowed, e.g. DL3N2D-TRIP99)
  const hyphenCount = (normalized.match(/-/g) || []).length;
  if (hyphenCount > 1) {
    return {
      isValid: false,
      error: "Mã mời chỉ được chứa tối đa 1 dấu gạch nối phân đoạn.",
    };
  }

  if (normalized.startsWith("-") || normalized.endsWith("-")) {
    return {
      isValid: false,
      error: "Dấu gạch nối không đúng định dạng (không được ở đầu hoặc cuối mã mời).",
    };
  }

  // 4. Count alphanumeric characters (excluding hyphens)
  const alnumOnly = normalized.replace(/-/g, "");

  if (alnumOnly.length < 10) {
    return {
      isValid: false,
      error: "Mã mời quá ngắn (phải có từ 10 đến 12 ký tự chữ/số, không tính dấu gạch nối).",
    };
  }

  if (alnumOnly.length > 12) {
    return {
      isValid: false,
      error: "Mã mời quá dài (tối đa 12 ký tự chữ/số, không tính dấu gạch nối).",
    };
  }

  // 5. Total raw string length must not exceed 13 characters (matching ERD varchar(13))
  if (normalized.length > 13) {
    return {
      isValid: false,
      error: "Độ dài mã mời không được vượt quá 13 ký tự.",
    };
  }

  return {
    isValid: true,
    normalizedCode: normalized,
  };
}

/**
 * Calculates overall summary of balances across all trips for the current user.
 */
export function getOverallBalance(trips: readonly Trip[] = MOCK_TRIPS): OverallBalanceSummary {
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
 * Guaranteed not to mutate input array.
 */
export function filterTrips(trips: readonly Trip[], tab: TripFilterTab): Trip[] {
  const copy = [...trips];
  if (tab === "active") {
    return copy.filter((t) => t.status === "ACTIVE" || t.status === "SETTLING");
  }
  if (tab === "completed") {
    return copy.filter((t) => t.status === "COMPLETED");
  }
  return copy;
}

/**
 * Sorts trips based on selected option:
 * - 'latest': Most recently updated first (updatedAt descending)
 * - 'departure': Earliest start date first (startDate ascending)
 * - 'name': Alphabetical by title (A-Z)
 * Guaranteed not to mutate input array.
 */
export function sortTrips(trips: readonly Trip[], sortBy: TripSortOption): Trip[] {
  const copy = [...trips];

  switch (sortBy) {
    case "latest":
      return copy.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    case "departure":
      return copy.sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    case "name":
      return copy.sort((a, b) => a.title.localeCompare(b.title, "vi"));
    default:
      return copy;
  }
}

/**
 * Detailed mock data for individual trips, keyed by trip ID.
 * Follows approved terminology:
 * - "Trưởng nhóm" (for HOST role)
 * - "Chưa có tài khoản" (for isNoAccount: true)
 * - "Mã mời" (for invite code)
 */
export const MOCK_TRIP_DETAILS: Record<string, TripDetailData> = Object.freeze({
  "trip-dalat-3n2d": {
    id: "trip-dalat-3n2d",
    title: "Đà Lạt 3N2Đ",
    destination: "Đà Lạt, Lâm Đồng",
    startDate: "2026-11-20",
    endDate: "2026-11-22",
    durationText: "3 ngày 2 đêm",
    status: "ACTIVE", // Đang lên kế hoạch
    inviteCode: "DL3N2D-TRIP99",
    updatedAt: "2026-10-16T10:00:00Z",
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
    plannedBudget: 10000000,
    totalSpent: 8450000,
    userSpent: 2350000,
    expenseCount: 14,
    paidActivitiesCount: 4,
    members: [
      { id: "m1", name: "Lan Nguyễn", role: "HOST", spentAmount: 2350000, isCurrentUser: true },
      { id: "m2", name: "Tuấn Huy", role: "MEMBER", spentAmount: 3100000 },
      { id: "m3", name: "Quang Minh", role: "MEMBER", spentAmount: 1800000 },
      { id: "m4", name: "Thanh Quang", role: "MEMBER", spentAmount: 1200000 },
      { id: "m5", name: "Thu Hà", role: "MEMBER", spentAmount: 0, isNoAccount: true },
    ],
    recentExpenses: [
      {
        id: "exp-1",
        title: "Ăn tối quán Lẩu Bò Ba Toa",
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByName: "Lan",
        spentAtFormatted: "20/11 - 19:30",
        splitMethodText: "Chia đều 5 người",
        totalAmount: 1060000,
        userAmount: 212000,
      },
      {
        id: "exp-2",
        title: "Vé cáp treo Đồi Robin",
        category: "TICKET",
        categoryLabel: "Vé tham quan",
        paidByName: "Huy",
        spentAtFormatted: "21/11 - 09:15",
        splitMethodText: "Chia đều 5 người",
        totalAmount: 750000,
        userAmount: 150000,
      },
      {
        id: "exp-3",
        title: "Thuê xe máy 3 ngày",
        category: "TRANSPORT",
        categoryLabel: "Di chuyển",
        paidByName: "Minh",
        spentAtFormatted: "20/11 - 08:00",
        splitMethodText: "Chia đều 5 người",
        totalAmount: 1200000,
        userAmount: 240000,
      },
      {
        id: "exp-4",
        title: "Cafe Cheo Veooo hoàng hôn",
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByName: "Quang",
        spentAtFormatted: "21/11 - 16:45",
        splitMethodText: "Chia theo món",
        totalAmount: 480000,
        userAmount: 95000,
      },
    ],
    categoryAllocations: [
      { category: "Ăn uống", percentage: 45, amount: 3800000, color: "#34A0A4" },
      { category: "Di chuyển", percentage: 30, amount: 2535000, color: "#1A759F" },
      { category: "Tham quan", percentage: 15, amount: 1267500, color: "#76C893" },
      { category: "Khác", percentage: 10, amount: 847500, color: "#D9ED92" },
    ],
    nextDestination: {
      title: "Đồi chè Cầu Đất & Cà phê sương sớm",
      label: "Điểm đến tiếp theo",
    },
    weatherInfo: {
      locationName: "Đà Lạt",
      temperature: "18°C",
      description: "Se se lạnh, có sương mai (Minh họa)",
    },
  },

  "trip-phuquoc-team": {
    id: "trip-phuquoc-team",
    title: "Phú Quốc cùng team",
    destination: "Phú Quốc, Kiên Giang",
    startDate: "2026-12-12",
    endDate: "2026-12-15",
    durationText: "4 ngày 3 đêm",
    status: "SETTLING", // Đang thanh toán
    inviteCode: "PQ2026-TEAM01",
    updatedAt: "2026-10-17T09:30:00Z",
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
    plannedBudget: 20000000,
    totalSpent: 18500000,
    userSpent: 1200000,
    expenseCount: 8,
    paidActivitiesCount: 2,
    members: [
      { id: "m6", name: "Hoàng Anh", role: "HOST", spentAmount: 8500000 },
      { id: "m7", name: "Bảo Minh", role: "MEMBER", spentAmount: 4200000 },
      { id: "m8", name: "Khánh Duy", role: "MEMBER", spentAmount: 3600000 },
      { id: "m9", name: "Lan Nguyễn", role: "MEMBER", spentAmount: 1200000, isCurrentUser: true },
      { id: "m10", name: "Phương Linh", role: "MEMBER", spentAmount: 1000000 },
      { id: "m11", name: "Văn An", role: "MEMBER", spentAmount: 0, isNoAccount: true },
    ],
    recentExpenses: [
      {
        id: "exp-5",
        title: "Hải sản Làng chài Hàm Ninh",
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByName: "Hoàng Anh",
        spentAtFormatted: "12/12 - 19:00",
        splitMethodText: "Chia đều 6 người",
        totalAmount: 3600000,
        userAmount: 600000,
      },
      {
        id: "exp-6",
        title: "Cano tham quan 4 đảo & lặn ngắm san hô",
        category: "TICKET",
        categoryLabel: "Vé tham quan",
        paidByName: "Bảo Minh",
        spentAtFormatted: "13/12 - 08:30",
        splitMethodText: "Chia đều 6 người",
        totalAmount: 4800000,
        userAmount: 800000,
      },
      {
        id: "exp-7",
        title: "Thuê xe 7 chỗ đón sân bay & di chuyển",
        category: "TRANSPORT",
        categoryLabel: "Di chuyển",
        paidByName: "Lan",
        spentAtFormatted: "12/12 - 14:00",
        splitMethodText: "Chia đều 6 người",
        totalAmount: 1200000,
        userAmount: 200000,
      },
    ],
    categoryAllocations: [
      { category: "Ăn uống", percentage: 40, amount: 7400000, color: "#34A0A4" },
      { category: "Tham quan", percentage: 35, amount: 6475000, color: "#1A759F" },
      { category: "Di chuyển", percentage: 20, amount: 3700000, color: "#76C893" },
      { category: "Khác", percentage: 5, amount: 925000, color: "#D9ED92" },
    ],
    nextDestination: {
      title: "Ngắm hoàng hôn Bãi Sao & Sunset Sanato",
      label: "Điểm đến tiếp theo",
    },
    weatherInfo: {
      locationName: "Phú Quốc",
      temperature: "29°C",
      description: "Nắng ráo, biển êm dịu (Minh họa)",
    },
  },

  "trip-sapa-harvest": {
    id: "trip-sapa-harvest",
    title: "Sa Pa mùa lúa chín",
    destination: "Sa Pa, Lào Cai",
    startDate: "2026-10-10",
    endDate: "2026-10-13",
    durationText: "4 ngày 3 đêm",
    status: "COMPLETED", // Đã hoàn tất
    inviteCode: "SP2026-LUA99",
    updatedAt: "2026-10-13T16:00:00Z",
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
    plannedBudget: 12000000,
    totalSpent: 11200000,
    userSpent: 3000000,
    expenseCount: 6,
    paidActivitiesCount: 2,
    members: [
      { id: "m12", name: "Phương Linh", role: "HOST", spentAmount: 4500000 },
      { id: "m13", name: "Việt Anh", role: "MEMBER", spentAmount: 2200000 },
      { id: "m14", name: "Tiến Đạt", role: "MEMBER", spentAmount: 1500000 },
      { id: "m15", name: "Lan Nguyễn", role: "MEMBER", spentAmount: 3000000, isCurrentUser: true },
    ],
    recentExpenses: [
      {
        id: "exp-8",
        title: "Lẩu cá tầm Sapa ấm cúng",
        category: "FOOD",
        categoryLabel: "Ăn uống",
        paidByName: "Phương Linh",
        spentAtFormatted: "10/10 - 19:30",
        splitMethodText: "Chia đều 4 người",
        totalAmount: 1800000,
        userAmount: 450000,
      },
      {
        id: "exp-9",
        title: "Vé cáp treo Fansipan nóc nhà Đông Dương",
        category: "TICKET",
        categoryLabel: "Vé tham quan",
        paidByName: "Lan",
        spentAtFormatted: "11/10 - 08:30",
        splitMethodText: "Chia đều 4 người",
        totalAmount: 3000000,
        userAmount: 750000,
      },
    ],
    categoryAllocations: [
      { category: "Ăn uống", percentage: 35, amount: 3920000, color: "#34A0A4" },
      { category: "Tham quan", percentage: 35, amount: 3920000, color: "#1A759F" },
      { category: "Di chuyển", percentage: 20, amount: 2240000, color: "#76C893" },
      { category: "Khác", percentage: 10, amount: 1120000, color: "#D9ED92" },
    ],
    nextDestination: {
      title: "Đỉnh Fansipan nóc nhà Đông Dương",
      label: "Điểm đến đã hoàn thành",
    },
    weatherInfo: {
      locationName: "Sa Pa",
      temperature: "15°C",
      description: "Se lạnh, sương mù nhẹ (Minh họa)",
    },
  },
});

/**
 * Retrieves detailed trip data for a given trip ID.
 * Returns null if trip ID does not exist in mock details.
 * Guaranteed pure function that does not mutate mock objects.
 */
export function getTripDetailById(id: string | null | undefined): TripDetailData | null {
  if (!id) return null;
  const detail = MOCK_TRIP_DETAILS[id];
  return detail ? { ...detail } : null;
}
