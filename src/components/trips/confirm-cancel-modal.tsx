"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmCancelModal({
  isOpen,
  onClose,
  onConfirm,
}: ConfirmCancelModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hủy tạo chuyến đi?"
      description="Xác nhận trước khi rời khỏi trang"
    >
      <div className="space-y-4 py-2">
        <div className="p-4 rounded-xl bg-functional-warning-bg/60 border border-functional-warning/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-functional-warning shrink-0 mt-0.5" />
          <p className="text-sm text-text-body leading-relaxed">
            Các thông tin chuyến đi bạn vừa nhập sẽ <strong>không được lưu</strong>. Bạn có chắc chắn muốn hủy và quay về danh sách chuyến đi?
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-hairline">
          <Button type="button" variant="outline" onClick={onClose}>
            Tiếp tục nhập
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            className="bg-functional-negative hover:bg-functional-negative/90 text-white"
          >
            Xác nhận hủy
          </Button>
        </div>
      </div>
    </Modal>
  );
}
