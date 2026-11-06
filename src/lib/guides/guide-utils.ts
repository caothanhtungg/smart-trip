import { TravelGuide, GuideRegion } from "./guide-data";

/**
 * Builds the URL to redirect the user to the trip creation page
 * with pre-filled destination and suggested title.
 */
export function buildTripCreationUrlFromGuide(guide: TravelGuide): string {
  const destParam = encodeURIComponent(guide.destination);
  const titleParam = encodeURIComponent(`Chuyến đi ${guide.destination}`);
  return `/trips/new?destination=${destParam}&title=${titleParam}`;
}

/**
 * Calculates checklist completion statistics.
 */
export function calculatePackingProgress(
  items: string[],
  checkedSet: Set<string>
): { checked: number; total: number; percentage: number } {
  if (!items || items.length === 0) {
    return { checked: 0, total: 0, percentage: 0 };
  }

  let checkedCount = 0;
  for (const item of items) {
    if (checkedSet.has(item)) {
      checkedCount++;
    }
  }

  const percentage = Math.round((checkedCount / items.length) * 100);
  return {
    checked: checkedCount,
    total: items.length,
    percentage,
  };
}

/**
 * Filters a list of travel guides by geographical region and free-text search query.
 */
export function filterGuidesByRegionAndQuery(
  guides: readonly TravelGuide[],
  region: GuideRegion,
  rawQuery: string
): TravelGuide[] {
  const query = (rawQuery || "").trim().toLowerCase();

  return guides.filter((guide) => {
    // 1. Region match
    if (region !== "all" && guide.region !== region) {
      return false;
    }

    // 2. Query match
    if (!query) {
      return true;
    }

    const titleMatch = guide.title.toLowerCase().includes(query);
    const destMatch = guide.destination.toLowerCase().includes(query);
    const provinceMatch = guide.province.toLowerCase().includes(query);
    const summaryMatch = guide.summary.toLowerCase().includes(query);
    const tagMatch = guide.tags.some((tag) => tag.toLowerCase().includes(query));

    return titleMatch || destMatch || provinceMatch || summaryMatch || tagMatch;
  });
}

/**
 * Danh sách ID cẩm nang nổi bật đại diện cho từng vùng miền.
 */
export const REGION_FEATURED_GUIDES: Record<GuideRegion, string> = {
  all: "guide-trangan-tamcoc",
  north: "guide-trangan-tamcoc",
  central: "guide-ba-na-hills",
  highlands: "guide-da-lat",
  south: "guide-nui-ba-den",
  islands: "guide-phu-quoc",
};

/**
 * Trích xuất cẩm nang du lịch nổi bật tương ứng với vùng miền đang chọn.
 * Đảm bảo khi người dùng chuyển sang bất kỳ tab vùng miền nào (Bắc, Trung, Nam, Tây Nguyên, Biển đảo)
 * thì banner cẩm nang nổi bật vẫn hiển thị nội dung đại diện tương ứng thay vì biến mất.
 */
export function getFeaturedGuideForRegion(
  guides: readonly TravelGuide[],
  region: GuideRegion
): TravelGuide | undefined {
  if (!guides || guides.length === 0) return undefined;

  const targetId = REGION_FEATURED_GUIDES[region];
  if (region === "all") {
    return (
      guides.find((g) => g.id === targetId) ||
      guides.find((g) => g.id === "guide-trangan-tamcoc") ||
      guides[0]
    );
  }

  return (
    guides.find((g) => g.id === targetId && g.region === region) ||
    guides.find((g) => g.region === region) ||
    guides[0]
  );
}

