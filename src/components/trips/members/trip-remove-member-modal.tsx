"use client";

import * as React from "react";
import { AlertCircle, AlertTriangle, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { TripMember, TripStatus } from "@/types/trip";
import { canRemoveMember } from "@/lib/members/validation";

interface TripRemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TripMember | null;
  netBalance: number;
  tripStatus: TripStatus;
  isHost: boolean;
  hasFinancialHistory: boolean;
  onConfirmRemove: (
    id: string
  ) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
}

export function TripRemoveMemberModal({
  isOpen,
  onClose,
  member,
  netBalance,
  tripStatus,
  isHost,
  hasFinancialHistory,
  onConfirmRemove,
}: TripRemoveMemberModalProps) {
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!member) return null;

  const permission = canRemoveMember(
    member,
    netBalance,
    tripStatus,
    isHost,
    hasFinancialHistory
  );

  const handleConfirm = async () => {
    if (!permission.allowed || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await onConfirmRemove(member.id);
      if (!res.success) {
        setError(res.message || "Không thể xóa thành viên");
        return;
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi xóa thành viên.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xóa thành viên khỏi chuyến đi"
      description={`Xác nhận thao tác xóa đối với thành viên ${member.name}`}
    >
      <div className="space-y-4 py-2">
        {/* Blocked state (Debt != 0 or not allowed) */}
        {!permission.allowed ? (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-functional-warning-bg border border-functional-warning/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-functional-negative shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-bold text-yale-blue">Không thể xóa thành viên này</p>
                <p className="text-xs text-text-muted leading-relaxed">{permission.reason}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-border-hairline">
              <Button type="button" variant="outline" onClick={onClose}>
                Đã hiểu
              </Button>
            </div>
          </div>
        ) : (
          /* Allowed state */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-functional-warning-bg/40 border border-functional-warning/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-functional-warning shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-yale-blue">
                  Bạn có chắc chắn muốn xóa « {member.name} »?
                </p>
                <p className="text-xs text-text-muted leading-relaxed">
                  {permission.isSoftDelete
                    ? "Thành viên này đã có lịch sử chi tiêu trong chuyến đi. Hệ thống sẽ chuyển trạng thái sang «Đã rời nhóm» để bảo toàn dữ liệu sổ sách và các phần chia tiền cũ (Rule R6)."
                    : "Thành viên này chưa có bất kỳ giao dịch chi tiêu nào, sẽ được xóa hoàn toàn khỏi danh sách thành viên."}
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-functional-warning-bg border border-functional-warning/30 text-xs text-functional-negative font-medium">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-hairline">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="bg-functional-negative hover:bg-red-700 text-white flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isSubmitting ? "Đang xóa..." : "Xác nhận xóa"}</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
