"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditGuestMemberFormData, TripMember } from "@/types/trip";
import { validateGuestMemberForm } from "@/lib/members/validation";

interface TripEditGuestModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TripMember | null;
  existingMembers: TripMember[];
  onEditGuest: (
    id: string,
    formData: EditGuestMemberFormData
  ) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
}

function TripEditGuestDialog({
  onClose,
  member,
  existingMembers,
  onEditGuest,
}: Omit<TripEditGuestModalProps, "isOpen"> & { member: TripMember }) {
  const [displayName, setDisplayName] = React.useState(member.name);
  const [note, setNote] = React.useState(member.note || "");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const formData: EditGuestMemberFormData = {
      displayName: displayName.trim(),
      note: note.trim() || undefined,
    };

    const validation = validateGuestMemberForm(formData, existingMembers, member.id);
    if (!validation.isValid) {
      setError(validation.errors.displayName || validation.errors.note || "Dữ liệu không hợp lệ");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await onEditGuest(member.id, formData);
      if (!res.success) {
        setError(res.message || "Không thể cập nhật thành viên");
        return;
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã có lỗi xảy ra khi cập nhật thành viên.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Chỉnh sửa thông tin thành viên"
      description={`Cập nhật tên hiển thị và ghi chú cho ${member.name}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="space-y-1.5">
          <label htmlFor="edit-guest-name" className="text-sm font-semibold text-yale-blue block">
            Tên hiển thị <span className="text-functional-negative">*</span>
          </label>
          <Input
            id="edit-guest-name"
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              if (error) setError(null);
            }}
            maxLength={100}
            disabled={isSubmitting}
            autoFocus
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="edit-guest-note" className="text-sm font-semibold text-yale-blue block">
            Ghi chú <span className="text-text-muted font-normal text-xs">(Tùy chọn)</span>
          </label>
          <Input
            id="edit-guest-note"
            type="text"
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              if (error) setError(null);
            }}
            maxLength={200}
            disabled={isSubmitting}
            className="h-11"
          />
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
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="bg-cerulean hover:bg-baltic-blue"
          >
            {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function TripEditGuestModal(props: TripEditGuestModalProps) {
  if (!props.isOpen || !props.member) return null;
  return <TripEditGuestDialog key={props.member.id} {...props} member={props.member} />;
}
