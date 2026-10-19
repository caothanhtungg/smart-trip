import type {
  TripMember,
  MemberClaim,
  TripStatus,
  CreateGuestMemberFormData,
  GuestMemberValidationResult,
} from "@/types/trip";

/**
 * Kiểm tra tính hợp lệ của biểu mẫu thêm/sửa thành viên chưa có tài khoản (UC26)
 */
export function validateGuestMemberForm(
  formData: CreateGuestMemberFormData,
  existingMembers: TripMember[],
  editingMemberId?: string
): GuestMemberValidationResult {
  const errors: { displayName?: string; note?: string } = {};

  const trimmedName = formData.displayName?.trim() || "";

  if (!trimmedName) {
    errors.displayName = "Tên hiển thị không được để trống";
  } else if (trimmedName.length < 2) {
    errors.displayName = "Tên hiển thị phải có ít nhất 2 ký tự";
  } else if (trimmedName.length > 100) {
    errors.displayName = "Tên hiển thị không được vượt quá 100 ký tự";
  } else {
    // Kiểm tra trùng tên với thành viên ACTIVE khác (không phân biệt hoa thường)
    const normalizedName = trimmedName.toLowerCase();
    const isDuplicate = existingMembers.some(
      (m) =>
        m.id !== editingMemberId &&
        m.status === "ACTIVE" &&
        m.name.trim().toLowerCase() === normalizedName
    );

    if (isDuplicate) {
      errors.displayName = "Tên này đã được sử dụng bởi một thành viên khác trong chuyến đi";
    }
  }

  if (formData.note && formData.note.trim().length > 200) {
    errors.note = "Ghi chú không được vượt quá 200 ký tự";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Kiểm tra quyền thêm thành viên chưa có tài khoản (UC26)
 */
export function canAddGuestMember(
  tripStatus: TripStatus,
  isHost: boolean
): { allowed: boolean; reason?: string } {
  if (!isHost) {
    return {
      allowed: false,
      reason: "Chỉ Trưởng nhóm mới có quyền thêm thành viên chưa có tài khoản.",
    };
  }

  if (tripStatus !== "ACTIVE") {
    return {
      allowed: false,
      reason: "Chỉ có thể thêm thành viên khi chuyến đi đang lên kế hoạch.",
    };
  }

  return { allowed: true };
}

/**
 * Kiểm tra xem một thành viên có phải là thành viên chưa có tài khoản (placeholder) hay không.
 * Khớp ERD Rule R11: user_id = NULL hoặc có cờ isNoAccount = true.
 */
export function isPlaceholderMember(member: TripMember): boolean {
  return Boolean(member.isNoAccount || member.userId === null);
}

/**
 * Kiểm tra quyền chỉnh sửa thành viên chưa có tài khoản
 */
export function canEditGuestMember(
  member: TripMember,
  tripStatus: TripStatus,
  isHost: boolean
): { allowed: boolean; reason?: string } {
  if (!isHost) {
    return {
      allowed: false,
      reason: "Chỉ Trưởng nhóm mới có quyền chỉnh sửa thành viên chưa có tài khoản.",
    };
  }

  if (!isPlaceholderMember(member)) {
    return {
      allowed: false,
      reason: "Không thể sửa tên của thành viên đã có tài khoản.",
    };
  }

  if (tripStatus !== "ACTIVE") {
    return {
      allowed: false,
      reason: "Chỉ có thể sửa thành viên khi chuyến đi đang lên kế hoạch.",
    };
  }

  return { allowed: true };
}

/**
 * Kiểm tra điều kiện xóa thành viên (UC07, Rule R6)
 */
export function canRemoveMember(
  member: TripMember,
  netBalance: number,
  tripStatus: TripStatus,
  isHost: boolean,
  hasFinancialHistory: boolean
): { allowed: boolean; isSoftDelete: boolean; reason?: string } {
  if (!isHost) {
    return {
      allowed: false,
      isSoftDelete: false,
      reason: "Chỉ Trưởng nhóm mới có quyền xóa thành viên khỏi chuyến đi.",
    };
  }

  if (member.role === "HOST" || member.isHost) {
    return {
      allowed: false,
      isSoftDelete: false,
      reason: "Không thể xóa Trưởng nhóm khỏi chuyến đi.",
    };
  }

  if (tripStatus !== "ACTIVE") {
    return {
      allowed: false,
      isSoftDelete: false,
      reason: "Chỉ có thể xóa thành viên khi chuyến đi đang lên kế hoạch.",
    };
  }

  // Ràng buộc công nợ Rule R6: Số dư khác 0 không được xóa
  if (netBalance !== 0) {
    const formattedBalance = Math.abs(netBalance).toLocaleString("vi-VN");
    if (netBalance > 0) {
      return {
        allowed: false,
        isSoftDelete: false,
        reason: `Không thể xóa thành viên đang được nợ tiền (+${formattedBalance} ₫). Cần tất toán công nợ trước.`,
      };
    } else {
      return {
        allowed: false,
        isSoftDelete: false,
        reason: `Không thể xóa thành viên đang nợ tiền (-${formattedBalance} ₫). Cần tất toán công nợ trước.`,
      };
    }
  }

  // Nếu thành viên đã từng chi tiêu hoặc có phần chia -> soft delete (status = 'LEFT')
  if (hasFinancialHistory) {
    return {
      allowed: true,
      isSoftDelete: true,
      reason:
        "Thành viên đã có lịch sử tài chính. Hệ thống sẽ chuyển trạng thái sang Đã rời nhóm để bảo toàn số liệu.",
    };
  }

  // Nếu thành viên hoàn toàn chưa có giao dịch nào -> cho phép xóa cứng khỏi danh sách
  return {
    allowed: true,
    isSoftDelete: false,
  };
}

/**
 * Kiểm tra điều kiện thành viên tự rời chuyến đi (UC21, Rule R2, R6)
 */
export function canLeaveTrip(
  member: TripMember,
  netBalance: number,
  tripStatus: TripStatus
): { allowed: boolean; reason?: string } {
  if (member.role === "HOST" || member.isHost) {
    return {
      allowed: false,
      reason: "Trưởng nhóm không thể tự rời chuyến đi trong Release 1.",
    };
  }

  if (tripStatus !== "ACTIVE") {
    return {
      allowed: false,
      reason: "Chỉ có thể rời chuyến khi chuyến đi đang lên kế hoạch.",
    };
  }

  if (netBalance !== 0) {
    const formattedBalance = Math.abs(netBalance).toLocaleString("vi-VN");
    return {
      allowed: false,
      reason: `Bạn cần tất toán toàn bộ công nợ (${netBalance > 0 ? "+" : "-"}${formattedBalance} ₫) trước khi rời chuyến đi.`,
    };
  }

  return { allowed: true };
}

/**
 * Kiểm tra tính hợp lệ khi người dùng gửi yêu cầu nhận diện (UC33, Rule R13, R20)
 */
export function canClaimMember(
  placeholder: TripMember,
  existingClaims: MemberClaim[],
  currentUserId: string,
  tripStatus: TripStatus
): { allowed: boolean; reason?: string } {
  if (tripStatus !== "ACTIVE") {
    return {
      allowed: false,
      reason: "Chuyến đi không còn ở trạng thái cho phép nhận diện danh tính.",
    };
  }

  if (!isPlaceholderMember(placeholder)) {
    return {
      allowed: false,
      reason: "Vị trí thành viên này đã được liên kết với một tài khoản khác.",
    };
  }

  if (placeholder.status !== "ACTIVE") {
    return {
      allowed: false,
      reason: "Vị trí thành viên này đã rời khỏi chuyến đi.",
    };
  }

  // Rule R20: Mỗi tài khoản tối đa 1 yêu cầu PENDING mỗi chuyến
  const hasPendingClaim = existingClaims.some(
    (c) => c.userId === currentUserId && c.status === "PENDING"
  );
  if (hasPendingClaim) {
    return {
      allowed: false,
      reason: "Bạn đã có một yêu cầu nhận diện đang chờ duyệt trong chuyến đi này (Rule R20).",
    };
  }

  return { allowed: true };
}

/**
 * Kiểm tra tính hợp lệ khi Trưởng nhóm duyệt/từ chối yêu cầu nhận diện (UC30, Rule R13, R20)
 */
export function canDecideClaim(
  isHost: boolean,
  claim: MemberClaim,
  placeholder: TripMember,
  tripStatus: TripStatus
): { allowed: boolean; reason?: string } {
  if (!isHost) {
    return {
      allowed: false,
      reason: "Chỉ Trưởng nhóm mới có quyền duyệt hoặc từ chối yêu cầu liên kết.",
    };
  }

  if (tripStatus !== "ACTIVE") {
    return {
      allowed: false,
      reason: "Chỉ có thể duyệt yêu cầu khi chuyến đi đang lên kế hoạch.",
    };
  }

  if (claim.status !== "PENDING") {
    return {
      allowed: false,
      reason: "Yêu cầu này đã được xử lý trước đó.",
    };
  }

  if (!isPlaceholderMember(placeholder)) {
    return {
      allowed: false,
      reason: "Vị trí này đã được liên kết với một tài khoản khác.",
    };
  }

  return { allowed: true };
}
