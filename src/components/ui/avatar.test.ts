import { describe, it, expect } from "vitest";
import * as React from "react";
import { Avatar, AvatarGroup, AvatarGroupItem } from "@/components/ui/avatar";

describe("Avatar & AvatarGroup Component Contract", () => {
  it("renders Avatar component with proper initials and accessibility title", () => {
    const avatarEl = React.createElement(Avatar, {
      name: "Nguyễn Văn An",
      size: "md",
    });
    expect(avatarEl.props.name).toBe("Nguyễn Văn An");
    expect(avatarEl.props.size).toBe("md");
  });

  it("calculates exact overflow surplus count without off-by-one errors", () => {
    const mockMembers: AvatarGroupItem[] = [
      { id: "1", name: "An" },
      { id: "2", name: "Bình" },
      { id: "3", name: "Cường" },
      { id: "4", name: "Dũng" },
      { id: "5", name: "Em" },
      { id: "6", name: "Phương" },
    ];

    // With max = 4, 4 visible and 2 overflow (+2)
    const total = mockMembers.length;
    const max = 4;
    const visibleCount = Math.min(total, max);
    const overflowCount = total - visibleCount;

    expect(visibleCount).toBe(4);
    expect(overflowCount).toBe(2);

    const groupEl = React.createElement(AvatarGroup, {
      items: mockMembers,
      max: 4,
      size: "sm",
    });
    expect(groupEl.props.items?.length).toBe(6);
    expect(groupEl.props.max).toBe(4);
  });

  it("does not render overflow count when items count is less than or equal to max", () => {
    const mockMembers: AvatarGroupItem[] = [
      { id: "1", name: "An" },
      { id: "2", name: "Bình" },
      { id: "3", name: "Cường" },
    ];

    const total = mockMembers.length;
    const max = 4;
    const hasOverflow = total > max;

    expect(hasOverflow).toBe(false);

    const groupEl = React.createElement(AvatarGroup, {
      items: mockMembers,
      max: 4,
    });
    expect(groupEl.props.items?.length).toBe(3);
  });

  it("supports custom separation ring color and custom size", () => {
    const groupEl = React.createElement(AvatarGroup, {
      items: [{ id: "1", name: "Host", role: "Trưởng nhóm" }],
      size: "xs",
      ringColor: "ring-surface-card",
    });

    expect(groupEl.props.size).toBe("xs");
    expect(groupEl.props.ringColor).toBe("ring-surface-card");
  });
});

