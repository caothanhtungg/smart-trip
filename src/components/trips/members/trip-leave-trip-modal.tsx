"use client";

import * as React from "react";
import { AlertCircle, AlertTriangle, LogOut } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { TripMember, TripStatus } from "@/types/trip";
import { canLeaveTrip } from "@/lib/members/validation";

interface TripLeaveTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TripMember | null;
  netBalance: number;
  tripStatus: TripStatus;
  onConfirmLeave: (id: string) => { success: boolean; message?: string };
}

export function TripLeaveTripModal({
  isOpen,
  onClose,
  member,
  netBalance,
  tripStatus,
  onConfirmLeave,
}: TripLeaveTripModalProps) {
  const [error, setError] = React.useState<string | null>(null);

  if (!member) return null;

  const permission = canLeaveTrip(member, netBalance, tripStatus);

  const handleConfirm = () => {
    if (!permission.allowed) return;

    const res = onConfirmLeave(member.id);
    if (!res.success) {
      setError(res.message || "Không thể rời chuyến đi");
      return;
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Rời khỏi chuyến đi"
      description="Xác nhận việc rút khỏi danh sách tham gia chuyến đi"
    >
      <div className="space-y-4 py-2">
        {!permission.allowed ? (
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-functional-warning-bg border border-functional-warning/30 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-functional-negative shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-bold text-yale-blue">Không thể rời chuyến đi lúc này</p>
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
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-functional-warning-bg/40 border border-functional-warning/20 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-functional-warning shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold text-yale-blue">
                  Bạn có chắc chắn muốn rời khỏi chuyến đi này?
                </p>
                <p className="text-xs text-text-muted leading-relaxed">
                  Công nợ của bạn đã được tất toán bằng 0. Khi rời chuyến, bạn sẽ không còn nhận
                  thông báo hay chỉnh sửa lịch trình trong chuyến đi này nữa.
                </p>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-functional-warning-bg border border-functional-warning/30 text-xs text-functional-negative font-medium">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-hairline">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleConfirm}
                className="bg-functional-negative hover:bg-red-700 text-white flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Xác nhận rời chuyến</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
