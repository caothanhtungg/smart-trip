export interface QuickFilterOption {
  key: "all" | "active" | "completed";
  label: string;
}

export const TOPBAR_QUICK_FILTERS: readonly QuickFilterOption[] = [
  { key: "all", label: "Tất cả" },
  { key: "active", label: "Đang diễn ra" },
  { key: "completed", label: "Đã hoàn thành" },
] as const;

export function formatKeyboardShortcut(isMac: boolean): string {
  return isMac ? "⌘K" : "Ctrl+K";
}

function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export function matchesSearchQuery(
  item: { name?: string | null; destination?: string | null },
  query: string
): boolean {
  if (!query || query.trim() === "") return true;

  const cleanQuery = normalizeForSearch(query);
  const cleanName = item.name ? normalizeForSearch(item.name) : "";
  const cleanDestination = item.destination ? normalizeForSearch(item.destination) : "";

  return cleanName.includes(cleanQuery) || cleanDestination.includes(cleanQuery);
}
