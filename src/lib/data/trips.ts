import type { Trip, TripDetailData, TripExpense } from "@/types/trip";
import {
  MOCK_TRIPS,
  MOCK_TRIP_DETAILS,
  MOCK_CURRENT_USER,
  getTripDetailById as getMockTripDetailById,
} from "../mock/trips";

export type CurrentUser = typeof MOCK_CURRENT_USER;

/**
 * Lấy danh sách tất cả các chuyến đi của người dùng (bất đồng bộ).
 * Ở giai đoạn Frontend/Mock, hàm trả về bản sao an toàn từ MOCK_TRIPS.
 */
export async function getTrips(): Promise<Trip[]> {
  return MOCK_TRIPS.map((trip) => ({
    ...trip,
    members: trip.members.map((m) => ({ ...m })),
    userBalance: { ...trip.userBalance },
  }));
}

/**
 * Lấy chi tiết một chuyến đi theo ID (bất đồng bộ).
 * Trả về null nếu ID không tồn tại hoặc không hợp lệ.
 */
export async function getTripDetailById(
  id: string | null | undefined
): Promise<TripDetailData | null> {
  return getMockTripDetailById(id);
}

/**
 * Lấy danh sách các khoản chi tiêu của một chuyến đi theo tripId (bất đồng bộ).
 */
export async function getTripExpenses(
  tripId: string | null | undefined
): Promise<TripExpense[]> {
  if (!tripId) return [];
  const detail = MOCK_TRIP_DETAILS[tripId];
  if (!detail || !detail.expenses) return [];

  return detail.expenses.map((exp) => ({
    ...exp,
    shares: exp.shares ? exp.shares.map((s) => ({ ...s })) : [],
  }));
}

/**
 * Lấy thông tin người dùng hiện tại đang đăng nhập (bất đồng bộ).
 */
export async function getCurrentUser(): Promise<CurrentUser> {
  return { ...MOCK_CURRENT_USER };
}
