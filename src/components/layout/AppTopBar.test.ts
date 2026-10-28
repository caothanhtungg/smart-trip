import { describe, it, expect } from "vitest";
import {
  formatKeyboardShortcut,
  matchesSearchQuery,
  TOPBAR_QUICK_FILTERS,
} from "./top-bar-logic";

describe("AppTopBar Search & Filter Logic", () => {
  it("formats keyboard shortcut badge according to platform", () => {
    expect(formatKeyboardShortcut(true)).toBe("⌘K");
    expect(formatKeyboardShortcut(false)).toBe("Ctrl+K");
  });

  it("matches search queries against destination name, trip title or address with Vietnamese accents normalized", () => {
    const item = {
      name: "Khám phá Đà Lạt 3N2Đ",
      destination: "Đà Lạt, Lâm Đồng",
    };

    // Exact accent match
    expect(matchesSearchQuery(item, "Đà Lạt")).toBe(true);

    // Non-accented lowercase match
    expect(matchesSearchQuery(item, "da lat")).toBe(true);

    // Partial destination match
    expect(matchesSearchQuery(item, "Lâm Đồng")).toBe(true);
    expect(matchesSearchQuery(item, "lam dong")).toBe(true);

    // Non-matching query
    expect(matchesSearchQuery(item, "Phú Quốc")).toBe(false);
  });

  it("provides standard Dream Destini quick filters", () => {
    expect(TOPBAR_QUICK_FILTERS.length).toBeGreaterThanOrEqual(3);
    const keys = TOPBAR_QUICK_FILTERS.map((f) => f.key);
    expect(keys).toContain("all");
    expect(keys).toContain("active");
    expect(keys).toContain("completed");
  });
});
