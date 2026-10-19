"use client";

import * as React from "react";
import { Info } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateGuestMemberFormData, TripMember } from "@/types/trip";
import { validateGuestMemberForm } from "@/lib/members/validation";

interface TripAddGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingMembers: TripMember[];
  onAddGuest: (formData: CreateGuestMemberFormData) => { success: boolean; message?: string };
}

function TripAddGuestDialog({
  onClose,
  existingMembers,
  onAddGuest,
}: Omit<TripAddGuestModalProps, "isOpen">) {
  const [displayName, setDisplayName] = React.useState("");
  const [note, setNote] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData: CreateGuestMemberFormData = {
      displayName: displayName.trim(),
      note: note.trim() || undefined,
    };

    const validation = validateGuestMemberForm(formData, existingMembers);
    if (!validation.isValid) {
      setError(validation.errors.displayName || validation.errors.note || "Dữ liệu không hợp lệ");
      return;
    }

    const res = onAddGuest(formData);
    if (!res.success) {
      setError(res.message || "Không thể thêm thành viên");
      return;
    }

    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Thêm thành viên chưa có tài khoản"
      description="Thêm người tham gia để chia tiền mà không cần họ phải cài ứng dụng trước"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        {/* Name input */}
        <div className="space-y-1.5">
          <label htmlFor="guest-name" className="text-sm font-semibold text-yale-blue block">
            Tên hiển thị trong nhóm <span className="text-functional-negative">*</span>
          </label>
          <Input
            id="guest-name"
            type="text"
            placeholder="Ví dụ: Hoàng, Bác Hùng, Linh Em..."
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (error) setError(null);
            }}
            maxLength={100}
            autoFocus
            className="h-11"
          />
        </div>

        {/* Note input */}
        <div className="space-y-1.5">
          <label htmlFor="guest-note" className="text-sm font-semibold text-yale-blue block">
            Ghi chú <span className="text-text-muted font-normal text-xs">(Tùy chọn)</span>
          </label>
          <Input
            id="guest-note"
            type="text"
            placeholder="Ví dụ: Bạn của Tùng, Thanh toán tiền mặt..."
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              if (error) setError(null);
            }}
            maxLength={200}
            className="h-11"
          />
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-xl bg-functional-warning-bg border border-functional-warning/30 text-xs text-functional-negative font-medium">
            {error}
          </div>
        )}

        {/* Info callout */}
        <div className="p-3.5 bg-surface-container-low rounded-xl border border-divider-border flex items-start gap-2.5 text-xs text-text-muted leading-relaxed">
          <Info className="w-4 h-4 text-cerulean shrink-0 mt-0.5" />
          <span>
            Thành viên này sẽ xuất hiện ngay trong danh sách chia tiền và công nợ của chuyến đi. Khi
            họ đăng ký tài khoản, họ có thể yêu cầu liên kết để nhận lại toàn bộ dữ liệu lịch sử.
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-hairline">
          <Button type="button" variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" className="bg-cerulean hover:bg-baltic-blue">
            Tạo thành viên
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function TripAddGuestModal(props: TripAddGuestModalProps) {
  if (!props.isOpen) return null;
  return <TripAddGuestDialog key="add-guest-dialog" {...props} />;
}
