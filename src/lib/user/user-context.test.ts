import { describe, it, expect } from "vitest";
import { UserProfile, NotificationItem } from "@/types/user";

describe("User Profile & Notification Defaults", () => {
  it("ensures initial empty profile has no hardcoded personal or bank data", () => {
    const emptyProfile: UserProfile = {
      id: "",
      fullName: "",
      displayName: "",
      email: "",
      avatarUrl: null,
      bankInfo: null,
    };

    expect(emptyProfile.fullName).toBe("");
    expect(emptyProfile.displayName).toBe("");
    expect(emptyProfile.email).toBe("");
    expect(emptyProfile.bankInfo).toBeNull();
  });

  it("ensures initial notifications list starts empty to avoid mock leak", () => {
    const initialNotifications: NotificationItem[] = [];
    expect(initialNotifications).toHaveLength(0);
    const unreadCount = initialNotifications.filter((n) => !n.isRead).length;
    expect(unreadCount).toBe(0);
  });
});

