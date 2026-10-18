import type { Trip, TripFilterTab, TripSortOption } from "@/types/trip";

/**
 * Lọc danh sách chuyến đi theo tab:
 * - 'all': Tất cả
 * - 'active': Đang lên kế hoạch (ACTIVE) hoặc Đang thanh toán (SETTLING)
 * - 'completed': Đã hoàn tất (COMPLETED)
 * Đảm bảo tính bất biến, không làm thay đổi mảng đầu vào.
 */
export function filterTrips<T extends Pick<Trip, "status">>(
  trips: readonly T[],
  tab: TripFilterTab
): T[] {
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
 * Sắp xếp danh sách chuyến đi theo tiêu chí:
 * - 'latest': Cập nhật gần nhất (updatedAt giảm dần)
 * - 'departure': Ngày khởi hành sớm nhất (startDate tăng dần)
 * - 'name': Bảng chữ cái tiếng Việt A-Z theo tên chuyến đi (name)
 * Đảm bảo tính bất biến, không làm thay đổi mảng đầu vào.
 */
export function sortTrips<
  T extends { name?: string; title?: string; startDate: string; updatedAt: string }
>(trips: readonly T[], sortBy: TripSortOption): T[] {
  const copy = [...trips];

  switch (sortBy) {
    case "departure":
      return copy.sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    case "name":
      return copy.sort((a, b) => {
        const nameA = a.name || a.title || "";
        const nameB = b.name || b.title || "";
        return nameA.localeCompare(nameB, "vi");
      });
    case "latest":
    default:
      return copy.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }
}
