import { MOCK_TRIPS, MOCK_TRIP_DETAILS } from "@/lib/mock/trips";
import { validateInviteCode } from "@/lib/trips/invite-code";
import { calculateDurationText } from "@/lib/trip-form-validation";
import { isPlaceholderMember } from "@/lib/members/validation";
import type { Trip, TripDetailData, TripInvitePreviewData, TripMember } from "@/types/trip";

export interface InviteLookupResult {
  status: "VALID" | "NOT_FOUND" | "INVALID_CODE" | "ARCHIVED";
  previewData?: TripInvitePreviewData;
  tripId?: string;
  claimablePlaceholders: TripMember[];
  errorMessage?: string;
}

/**
 * Tra cứu và lọc dữ liệu xem trước lời mời tham gia chuyến đi (tuân thủ nghiêm ngặt Rule R19)
 * Tuyệt đối không để lộ chi tiêu, công nợ, số dư cá nhân hay tài khoản ngân hàng.
 */
export function lookupInvitePreview(rawCode: string): InviteLookupResult {
  const codeValidation = validateInviteCode(rawCode);
  if (!codeValidation.isValid || !codeValidation.normalizedCode) {
    return {
      status: "INVALID_CODE",
      claimablePlaceholders: [],
      errorMessage: codeValidation.error || "Mã mời không đúng định dạng.",
    };
  }

  const normalizedCode = codeValidation.normalizedCode;

  // Tra cứu chuyến đi theo inviteCode
  let foundTrip: Trip | TripDetailData | undefined = Object.values(MOCK_TRIP_DETAILS).find(
    (t) => t.inviteCode.toUpperCase() === normalizedCode
  );

  if (!foundTrip) {
    foundTrip = MOCK_TRIPS.find((t) => t.inviteCode.toUpperCase() === normalizedCode);
  }

  if (!foundTrip) {
    return {
      status: "NOT_FOUND",
      claimablePlaceholders: [],
      errorMessage: "Không tìm thấy chuyến đi tương ứng với mã mời này.",
    };
  }

  if (foundTrip.status === "ARCHIVED") {
    return {
      status: "ARCHIVED",
      claimablePlaceholders: [],
      errorMessage: "Chuyến đi này đã được lưu trữ hoặc đóng tham gia.",
    };
  }

  const activeMembers = foundTrip.members.filter((m) => m.status === "ACTIVE");
  const hostMember = activeMembers.find((m) => m.role === "HOST" || !!m.isHost);
  const hostName = hostMember ? hostMember.name : "Trưởng nhóm";

  const claimablePlaceholders = activeMembers.filter((m) => isPlaceholderMember(m));

  const previewData: TripInvitePreviewData = {
    id: foundTrip.id,
    name: foundTrip.name,
    destination: foundTrip.destination,
    startDate: foundTrip.startDate,
    endDate: foundTrip.endDate,
    durationText: calculateDurationText(foundTrip.startDate, foundTrip.endDate) || "1 ngày",
    hostName,
    hostAvatarUrl: hostMember?.avatarUrl || null,
    members: activeMembers.map((m) => ({
      id: m.id,
      name: m.name,
      avatarUrl: m.avatarUrl || null,
      role: m.role,
    })),
    memberCount: activeMembers.length,
    status: foundTrip.status,
    inviteCode: foundTrip.inviteCode,
  };

  return {
    status: "VALID",
    previewData,
    tripId: foundTrip.id,
    claimablePlaceholders,
  };
}
