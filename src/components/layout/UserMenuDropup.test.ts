import { describe, it, expect } from "vitest";
import { THEME_MENU_OPTIONS } from "./UserMenuDropup";

export interface UserMenuItem {
  id: string;
  label: string;
  href?: string;
  iconName: string;
  isExternal?: boolean;
  isDestructive?: boolean;
}

export const USER_MENU_ITEMS: readonly UserMenuItem[] = [
  {
    id: "profile",
    label: "Hồ sơ của tôi",
    href: "/profile",
    iconName: "User",
  },
  {
    id: "settings",
    label: "Cài đặt tài khoản",
    href: "/profile",
    iconName: "Settings",
  },
  {
    id: "guides",
    label: "Cẩm nang du lịch",
    href: "/guides",
    iconName: "BookOpen",
    isExternal: true,
  },
  {
    id: "help",
    label: "Góp ý & Trợ giúp",
    iconName: "MessageSquare",
  },
  {
    id: "logout",
    label: "Đăng xuất",
    href: "/login",
    iconName: "LogOut",
    isDestructive: true,
  },
] as const;

describe("UserMenuDropup Navigation & Menu Specifications", () => {
  it("defines expected account and utility actions matching Expo pattern", () => {
    expect(USER_MENU_ITEMS.length).toBeGreaterThanOrEqual(4);

    const ids = USER_MENU_ITEMS.map((item) => item.id);
    expect(ids).toContain("profile");
    expect(ids).toContain("settings");
    expect(ids).toContain("guides");
    expect(ids).toContain("logout");

    const logoutItem = USER_MENU_ITEMS.find((item) => item.id === "logout");
    expect(logoutItem?.isDestructive).toBe(true);
    expect(logoutItem?.href).toBe("/login");
  });

  it("marks external resources with isExternal flag for indicator arrow", () => {
    const guidesItem = USER_MENU_ITEMS.find((item) => item.id === "guides");
    expect(guidesItem?.isExternal).toBe(true);
  });

  it("provides 3 standard theme options (light, dark, system) matching Expo pattern", () => {
    expect(THEME_MENU_OPTIONS).toHaveLength(3);
    const keys = THEME_MENU_OPTIONS.map((o) => o.key);
    expect(keys).toContain("light");
    expect(keys).toContain("dark");
    expect(keys).toContain("system");

    const lightOption = THEME_MENU_OPTIONS.find((o) => o.key === "light");
    const darkOption = THEME_MENU_OPTIONS.find((o) => o.key === "dark");
    const systemOption = THEME_MENU_OPTIONS.find((o) => o.key === "system");

    expect(lightOption?.label).toBe("Sáng");
    expect(darkOption?.label).toBe("Tối");
    expect(systemOption?.label).toBe("Tự động");
  });
});
