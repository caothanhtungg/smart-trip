import { DiscoveryDestination } from "@/lib/geo/destination-photos";

export type DiscoveryCategory =
  | "all"
  | "beach"
  | "mountain"
  | "heritage"
  | "city"
  | "nature";

export interface DiscoveryCategoryTab {
  key: DiscoveryCategory;
  label: string;
}

export const DISCOVERY_CATEGORY_TABS: readonly DiscoveryCategoryTab[] = [
  { key: "all", label: "Tất cả địa danh" },
  { key: "beach", label: "Biển đảo" },
  { key: "mountain", label: "Núi rừng & Săn mây" },
  { key: "heritage", label: "Di sản văn hóa" },
  { key: "city", label: "Thành phố & Ẩm thực" },
  { key: "nature", label: "Thiên nhiên & Sinh thái" },
] as const;

export function filterDestinationsByCategory(
  destinations: readonly DiscoveryDestination[],
  category: DiscoveryCategory
): DiscoveryDestination[] {
  if (category === "all") {
    return [...destinations];
  }
  return destinations.filter((d) => d.category === category);
}

