import type { MemberClaim } from "@/types/trip";

/**
 * Dữ liệu mock các yêu cầu nhận diện danh tính thành viên chưa có tài khoản (UC33, UC30, Rule R13, R20)
 * Dùng cho mục đích trình diễn và kiểm thử giao diện trong Release 1.
 */
export const MOCK_MEMBER_CLAIMS: MemberClaim[] = [
  {
    id: "claim-dl-01",
    tripId: "trip-dalat-3n2d",
    placeholderMemberId: "m5",
    placeholderMemberName: "Thu Hà",
    userId: "usr-tung-le",
    userName: "Tùng Lê",
    userEmail: "tung.le@gmail.com",
    userAvatarUrl: null,
    status: "PENDING",
    createdAt: "2026-10-18T10:15:00Z",
  },
];

export function getMockClaimsForTrip(tripId: string): MemberClaim[] {
  return MOCK_MEMBER_CLAIMS.filter((c) => c.tripId === tripId);
}
