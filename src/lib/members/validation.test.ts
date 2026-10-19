import { describe, it, expect } from "vitest";
import {
  validateGuestMemberForm,
  canAddGuestMember,
  canEditGuestMember,
  canRemoveMember,
  canLeaveTrip,
  canClaimMember,
  canDecideClaim,
} from "./validation";
import type { TripMember, MemberClaim } from "@/types/trip";

const MOCK_EXISTING_MEMBERS: TripMember[] = [
  {
    id: "m1",
    name: "Lan Nguyễn",
    role: "HOST",
    status: "ACTIVE",
    joinOrder: 1,
    isHost: true,
  },
  {
    id: "m2",
    name: "Tuấn Huy",
    role: "MEMBER",
    status: "ACTIVE",
    joinOrder: 2,
  },
  {
    id: "m5",
    name: "Thu Hà",
    role: "MEMBER",
    status: "ACTIVE",
    joinOrder: 5,
    isNoAccount: true,
  },
  {
    id: "m6",
    name: "Thành Đạt",
    role: "MEMBER",
    status: "LEFT",
    joinOrder: 6,
  },
];

describe("validateGuestMemberForm", () => {
  it("trả về lỗi khi tên hiển thị rỗng hoặc chỉ có khoảng trắng", () => {
    const res1 = validateGuestMemberForm({ displayName: "" }, MOCK_EXISTING_MEMBERS);
    expect(res1.isValid).toBe(false);
    expect(res1.errors.displayName).toBe("Tên hiển thị không được để trống");

    const res2 = validateGuestMemberForm({ displayName: "   " }, MOCK_EXISTING_MEMBERS);
    expect(res2.isValid).toBe(false);
    expect(res2.errors.displayName).toBe("Tên hiển thị không được để trống");
  });

  it("trả về lỗi khi tên hiển thị ít hơn 2 ký tự", () => {
    const res = validateGuestMemberForm({ displayName: "A" }, MOCK_EXISTING_MEMBERS);
    expect(res.isValid).toBe(false);
    expect(res.errors.displayName).toBe("Tên hiển thị phải có ít nhất 2 ký tự");
  });

  it("trả về lỗi khi tên hiển thị vượt quá 100 ký tự", () => {
    const res = validateGuestMemberForm(
      { displayName: "A".repeat(101) },
      MOCK_EXISTING_MEMBERS
    );
    expect(res.isValid).toBe(false);
    expect(res.errors.displayName).toBe("Tên hiển thị không được vượt quá 100 ký tự");
  });

  it("trả về lỗi khi tên trùng với thành viên ACTIVE khác (không phân biệt hoa thường)", () => {
    const res = validateGuestMemberForm(
      { displayName: "  tUấN hUy  " },
      MOCK_EXISTING_MEMBERS
    );
    expect(res.isValid).toBe(false);
    expect(res.errors.displayName).toBe(
      "Tên này đã được sử dụng bởi một thành viên khác trong chuyến đi"
    );
  });

  it("không báo lỗi trùng tên với chính thành viên đang chỉnh sửa", () => {
    const res = validateGuestMemberForm(
      { displayName: "Thu Hà", note: "Đã cập nhật" },
      MOCK_EXISTING_MEMBERS,
      "m5"
    );
    expect(res.isValid).toBe(true);
    expect(res.errors.displayName).toBeUndefined();
  });

  it("không báo lỗi khi trùng tên với thành viên đã LEFT", () => {
    const res = validateGuestMemberForm(
      { displayName: "Thành Đạt" },
      MOCK_EXISTING_MEMBERS
    );
    expect(res.isValid).toBe(true);
  });

  it("trả về lỗi khi ghi chú vượt quá 200 ký tự", () => {
    const res = validateGuestMemberForm(
      { displayName: "Bác Hùng", note: "N".repeat(201) },
      MOCK_EXISTING_MEMBERS
    );
    expect(res.isValid).toBe(false);
    expect(res.errors.note).toBe("Ghi chú không được vượt quá 200 ký tự");
  });

  it("hợp lệ khi dữ liệu đầy đủ và đúng chuẩn", () => {
    const res = validateGuestMemberForm(
      { displayName: "Bác Hùng", note: "Người nhà Lan" },
      MOCK_EXISTING_MEMBERS
    );
    expect(res.isValid).toBe(true);
    expect(Object.keys(res.errors).length).toBe(0);
  });
});

describe("canAddGuestMember", () => {
  it("chặn người dùng không phải Trưởng nhóm", () => {
    const res = canAddGuestMember("ACTIVE", false);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("Chỉ Trưởng nhóm");
  });

  it("chặn khi chuyến đi ở trạng thái SETTLING hoặc COMPLETED", () => {
    expect(canAddGuestMember("SETTLING", true).allowed).toBe(false);
    expect(canAddGuestMember("COMPLETED", true).allowed).toBe(false);
  });

  it("cho phép Trưởng nhóm thêm thành viên khi ACTIVE", () => {
    const res = canAddGuestMember("ACTIVE", true);
    expect(res.allowed).toBe(true);
  });
});

describe("canEditGuestMember", () => {
  it("chặn người dùng không phải Trưởng nhóm", () => {
    const res = canEditGuestMember(MOCK_EXISTING_MEMBERS[2], "ACTIVE", false);
    expect(res.allowed).toBe(false);
  });

  it("chặn chỉnh sửa thành viên đã có tài khoản", () => {
    const memberWithAccount: TripMember = {
      ...MOCK_EXISTING_MEMBERS[1],
      userId: "usr-2",
      isNoAccount: false,
    };
    const res = canEditGuestMember(memberWithAccount, "ACTIVE", true);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("đã có tài khoản");
  });

  it("chặn khi chuyến đi không phải ACTIVE", () => {
    const res = canEditGuestMember(MOCK_EXISTING_MEMBERS[2], "SETTLING", true);
    expect(res.allowed).toBe(false);
  });

  it("cho phép Trưởng nhóm chỉnh sửa thành viên chưa có tài khoản khi ACTIVE", () => {
    const res = canEditGuestMember(MOCK_EXISTING_MEMBERS[2], "ACTIVE", true);
    expect(res.allowed).toBe(true);
  });
});

describe("canRemoveMember (Rule R6)", () => {
  it("chặn nếu người thao tác không phải Trưởng nhóm", () => {
    const res = canRemoveMember(MOCK_EXISTING_MEMBERS[1], 0, "ACTIVE", false, false);
    expect(res.allowed).toBe(false);
  });

  it("chặn xóa chính Trưởng nhóm", () => {
    const res = canRemoveMember(MOCK_EXISTING_MEMBERS[0], 0, "ACTIVE", true, false);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("Trưởng nhóm");
  });

  it("chặn xóa khi chuyến đi SETTLING hoặc COMPLETED", () => {
    expect(
      canRemoveMember(MOCK_EXISTING_MEMBERS[1], 0, "SETTLING", true, false).allowed
    ).toBe(false);
    expect(
      canRemoveMember(MOCK_EXISTING_MEMBERS[1], 0, "COMPLETED", true, false).allowed
    ).toBe(false);
  });

  it("chặn xóa thành viên đang được nợ tiền (netBalance > 0)", () => {
    const res = canRemoveMember(MOCK_EXISTING_MEMBERS[1], 350000, "ACTIVE", true, true);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("+350.000");
  });

  it("chặn xóa thành viên đang nợ tiền (netBalance < 0)", () => {
    const res = canRemoveMember(MOCK_EXISTING_MEMBERS[1], -120000, "ACTIVE", true, true);
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("-120.000");
  });

  it("chuyển sang soft-delete (status = LEFT) nếu netBalance == 0 nhưng đã có lịch sử chi tiêu", () => {
    const res = canRemoveMember(MOCK_EXISTING_MEMBERS[1], 0, "ACTIVE", true, true);
    expect(res.allowed).toBe(true);
    expect(res.isSoftDelete).toBe(true);
    expect(res.reason).toContain("Đã rời nhóm");
  });

  it("cho phép xóa cứng (hard-delete) nếu netBalance == 0 và chưa từng có lịch sử tài chính", () => {
    const res = canRemoveMember(MOCK_EXISTING_MEMBERS[1], 0, "ACTIVE", true, false);
    expect(res.allowed).toBe(true);
    expect(res.isSoftDelete).toBe(false);
  });
});

describe("canLeaveTrip (Rule R2, R6)", () => {
  it("chặn Trưởng nhóm tự rời chuyến đi", () => {
    const res = canLeaveTrip(MOCK_EXISTING_MEMBERS[0], 0, "ACTIVE");
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("Trưởng nhóm không thể tự rời chuyến đi");
  });

  it("chặn khi chuyến đi không phải ACTIVE", () => {
    expect(canLeaveTrip(MOCK_EXISTING_MEMBERS[1], 0, "SETTLING").allowed).toBe(false);
    expect(canLeaveTrip(MOCK_EXISTING_MEMBERS[1], 0, "COMPLETED").allowed).toBe(false);
  });

  it("chặn rời chuyến khi số dư công nợ khác 0", () => {
    const resPositive = canLeaveTrip(MOCK_EXISTING_MEMBERS[1], 150000, "ACTIVE");
    expect(resPositive.allowed).toBe(false);
    expect(resPositive.reason).toContain("+150.000");

    const resNegative = canLeaveTrip(MOCK_EXISTING_MEMBERS[1], -50000, "ACTIVE");
    expect(resNegative.allowed).toBe(false);
    expect(resNegative.reason).toContain("-50.000");
  });

  it("cho phép thành viên thường rời chuyến khi nợ bằng 0 và chuyến ACTIVE", () => {
    const res = canLeaveTrip(MOCK_EXISTING_MEMBERS[1], 0, "ACTIVE");
    expect(res.allowed).toBe(true);
  });
});

describe("canClaimMember (Rule R13, R20)", () => {
  const MOCK_CLAIMS: MemberClaim[] = [
    {
      id: "cl-1",
      tripId: "trip-1",
      placeholderMemberId: "m5",
      placeholderMemberName: "Thu Hà",
      userId: "usr-other",
      userName: "Hoàng",
      userEmail: "hoang@gmail.com",
      status: "PENDING",
      createdAt: "2026-10-18T10:00:00Z",
    },
  ];

  it("chặn nhận diện khi chuyến đi không phải ACTIVE", () => {
    const res = canClaimMember(
      MOCK_EXISTING_MEMBERS[2],
      MOCK_CLAIMS,
      "usr-new",
      "SETTLING"
    );
    expect(res.allowed).toBe(false);
  });

  it("chặn nhận diện vị trí đã có tài khoản thật", () => {
    const res = canClaimMember(
      MOCK_EXISTING_MEMBERS[1],
      MOCK_CLAIMS,
      "usr-new",
      "ACTIVE"
    );
    expect(res.allowed).toBe(false);
  });

  it("chặn khi người dùng đã có một yêu cầu PENDING trong chuyến đi (Rule R20)", () => {
    const res = canClaimMember(
      MOCK_EXISTING_MEMBERS[2],
      MOCK_CLAIMS,
      "usr-other",
      "ACTIVE"
    );
    expect(res.allowed).toBe(false);
    expect(res.reason).toContain("Rule R20");
  });

  it("cho phép người dùng gửi yêu cầu nhận diện khi vị trí còn trống và chưa có yêu cầu pending", () => {
    const res = canClaimMember(
      MOCK_EXISTING_MEMBERS[2],
      MOCK_CLAIMS,
      "usr-new",
      "ACTIVE"
    );
    expect(res.allowed).toBe(true);
  });
});

describe("canDecideClaim", () => {
  const mockClaim: MemberClaim = {
    id: "cl-1",
    tripId: "trip-1",
    placeholderMemberId: "m5",
    placeholderMemberName: "Thu Hà",
    userId: "usr-new",
    userName: "Tùng",
    userEmail: "tung@gmail.com",
    status: "PENDING",
    createdAt: "2026-10-18T10:00:00Z",
  };

  it("chặn người thao tác không phải Trưởng nhóm", () => {
    const res = canDecideClaim(false, mockClaim, MOCK_EXISTING_MEMBERS[2], "ACTIVE");
    expect(res.allowed).toBe(false);
  });

  it("chặn khi chuyến đi không phải ACTIVE", () => {
    const res = canDecideClaim(true, mockClaim, MOCK_EXISTING_MEMBERS[2], "SETTLING");
    expect(res.allowed).toBe(false);
  });

  it("chặn khi yêu cầu đã được duyệt hoặc từ chối trước đó", () => {
    const res = canDecideClaim(
      true,
      { ...mockClaim, status: "APPROVED" },
      MOCK_EXISTING_MEMBERS[2],
      "ACTIVE"
    );
    expect(res.allowed).toBe(false);
  });

  it("cho phép Trưởng nhóm duyệt/từ chối yêu cầu PENDING khi chuyến ACTIVE", () => {
    const res = canDecideClaim(true, mockClaim, MOCK_EXISTING_MEMBERS[2], "ACTIVE");
    expect(res.allowed).toBe(true);
  });
});
