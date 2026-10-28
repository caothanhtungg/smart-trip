import { describe, it, expect } from "vitest";
import {
  SIDEBAR_NAV_ITEMS,
  isSidebarNavActive,
  getSidebarFeaturePrompt,
} from "./sidebar-nav";

describe("AppSidebar Navigation Logic & Contracts", () => {
  it("defines the expected primary navigation items conforming to Dream Destini layout", () => {
    expect(SIDEBAR_NAV_ITEMS.length).toBeGreaterThanOrEqual(4);

    const labels = SIDEBAR_NAV_ITEMS.map((item) => item.label);
    expect(labels).toContain("Khám phá & Bản đồ");
    expect(labels).toContain("Chuyến đi của tôi");
    expect(labels).toContain("Hồ sơ cá nhân");
    expect(labels).toContain("Cẩm nang du lịch");

    const ids = SIDEBAR_NAV_ITEMS.map((item) => item.id);
    expect(ids).toContain("discovery");
    expect(ids).toContain("trips");
    expect(ids).toContain("profile");
    expect(ids).toContain("guides");
  });

  it("determines active navigation item accurately based on current pathname", () => {
    // Exact match for /profile
    expect(isSidebarNavActive("/profile", "/profile")).toBe(true);
    expect(isSidebarNavActive("/profile", "/trips")).toBe(false);

    // Active for /trips when in trip details
    expect(isSidebarNavActive("/trips", "/trips/trip-123")).toBe(true);

    // Active for discovery view
    expect(isSidebarNavActive("/trips?view=discovery", "/trips", "view=discovery")).toBe(true);
    expect(isSidebarNavActive("/trips", "/trips", "view=discovery")).toBe(false);
  });

  it("provides rich sidebar feature highlight card content", () => {
    const card = getSidebarFeaturePrompt();
    expect(card.title).toContain("Thời tiết");
    expect(card.title).toContain("Tối ưu");
    expect(card.badge).toBeDefined();
    expect(card.actionLabel).toBeDefined();
  });
});

