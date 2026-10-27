export interface LocatableItem {
  id: string;
  latitude: number | null;
  longitude: number | null;
  isLocked?: boolean;
}

const EARTH_RADIUS_METERS = 6371000;

/**
 * Tính khoảng cách đường chim bay giữa 2 điểm tọa độ theo công thức Haversine (đơn vị: mét)
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) {
    return 0;
  }

  const toRad = (degree: number) => (degree * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const radLat1 = toRad(lat1);
  const radLat2 = toRad(lat2);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(radLat1) * Math.cos(radLat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
}

/**
 * Tính tổng độ dài một hành trình qua danh sách các điểm có tọa độ
 */
function calculateTotalRouteDistance<T extends LocatableItem>(route: T[]): number {
  let total = 0;
  for (let i = 0; i < route.length - 1; i++) {
    const current = route[i];
    const next = route[i + 1];
    if (
      current.latitude != null &&
      current.longitude != null &&
      next.latitude != null &&
      next.longitude != null
    ) {
      total += calculateHaversineDistance(
        current.latitude,
        current.longitude,
        next.latitude,
        next.longitude
      );
    }
  }
  return total;
}

/**
 * Tối ưu hóa thứ tự các điểm trong ngày theo bài toán TSP (Nearest Neighbor + 2-Opt)
 * - Điểm khóa đầu tiên (isLocked = true) được giữ làm điểm xuất phát cố định (index 0).
 * - Các điểm không có tọa độ GPS được đưa về cuối danh sách an toàn.
 */
export function optimizeDayRoute<T extends LocatableItem>(items: T[]): T[] {
  if (items.length <= 2) {
    return [...items];
  }

  const withCoords: T[] = [];
  const withoutCoords: T[] = [];

  for (const item of items) {
    if (item.latitude != null && item.longitude != null) {
      withCoords.push(item);
    } else {
      withoutCoords.push(item);
    }
  }

  if (withCoords.length <= 2) {
    if (withCoords.length === 2 && withCoords[1].isLocked && !withCoords[0].isLocked) {
      return [withCoords[1], withCoords[0], ...withoutCoords];
    }
    return [...withCoords, ...withoutCoords];
  }

  // 1. Xác định điểm xuất phát: Ưu tiên điểm có isLocked = true đầu tiên, nếu không có lấy điểm đầu tiên
  let startIndex = withCoords.findIndex((it) => it.isLocked);
  if (startIndex === -1) {
    startIndex = 0;
  }

  const startItem = withCoords[startIndex];
  const remaining = withCoords.filter((_, idx) => idx !== startIndex);

  // 2. Xây dựng lộ trình ban đầu bằng thuật toán Tham lam (Nearest Neighbor)
  const currentRoute: T[] = [startItem];
  let current = startItem;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const dist = calculateHaversineDistance(
        current.latitude!,
        current.longitude!,
        candidate.latitude!,
        candidate.longitude!
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearestIndex = i;
      }
    }

    current = remaining.splice(nearestIndex, 1)[0];
    currentRoute.push(current);
  }

  // 3. Tinh chỉnh bằng giải thuật 2-Opt (giữ cố định điểm xuất phát index 0)
  let improved = true;
  let iterations = 0;
  const maxIterations = 50;

  while (improved && iterations < maxIterations) {
    improved = false;
    iterations++;

    let bestDistance = calculateTotalRouteDistance(currentRoute);

    for (let i = 1; i < currentRoute.length - 1; i++) {
      for (let k = i + 1; k < currentRoute.length; k++) {
        // Đảo ngược đoạn [i, k]
        const newRoute = [
          ...currentRoute.slice(0, i),
          ...currentRoute.slice(i, k + 1).reverse(),
          ...currentRoute.slice(k + 1),
        ];

        const newDistance = calculateTotalRouteDistance(newRoute);
        if (newDistance < bestDistance - 0.001) {
          currentRoute.length = 0;
          currentRoute.push(...newRoute);
          bestDistance = newDistance;
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  return [...currentRoute, ...withoutCoords];
}
