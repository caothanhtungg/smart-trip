export interface SidebarNavItem {
  id: "discovery" | "trips" | "profile" | "guides";
  label: string;
  href: string;
  iconName: "Compass" | "Briefcase" | "User" | "BookOpen";
  badge?: string;
}

export const SIDEBAR_NAV_ITEMS: readonly SidebarNavItem[] = [
  {
    id: "discovery",
    label: "Khám phá & Bản đồ",
    href: "/trips?view=discovery",
    iconName: "Compass",
    badge: "Hot",
  },
  {
    id: "trips",
    label: "Chuyến đi của tôi",
    href: "/trips",
    iconName: "Briefcase",
  },
  {
    id: "profile",
    label: "Hồ sơ cá nhân",
    href: "/profile",
    iconName: "User",
  },
  {
    id: "guides",
    label: "Cẩm nang du lịch",
    href: "/guides",
    iconName: "BookOpen",
  },
] as const;

/**
 * Determines whether a given sidebar navigation item should be marked active.
 */
export function isSidebarNavActive(
  itemHref: string,
  currentPathname: string,
  searchParamsString?: string
): boolean {
  const isDiscoveryItem = itemHref.includes("view=discovery");
  const isDiscoveryActive = Boolean(searchParamsString && searchParamsString.includes("view=discovery"));

  if (isDiscoveryItem) {
    return isDiscoveryActive;
  }

  // If we are currently in discovery view, generic /trips should not be highlighted
  if (isDiscoveryActive && itemHref === "/trips") {
    return false;
  }

  if (itemHref === "/trips") {
    return currentPathname.startsWith("/trips");
  }

  if (itemHref === "/profile") {
    return currentPathname.startsWith("/profile");
  }

  if (itemHref === "/guides") {
    return currentPathname.startsWith("/guides");
  }

  return currentPathname === itemHref;
}

/**
 * Provides the content for the feature highlight card at the bottom of the sidebar.
 */
export function getSidebarFeaturePrompt(): {
  title: string;
  subtitle: string;
  badge: string;
  actionLabel: string;
} {
  return {
    title: "Thời tiết & Tối ưu lộ trình",
    subtitle: "Khám phá 50+ địa danh Việt Nam với thời tiết thực tế và lộ trình tối ưu thông minh.",
    badge: "Mới",
    actionLabel: "Khám phá ngay",
  };
}
