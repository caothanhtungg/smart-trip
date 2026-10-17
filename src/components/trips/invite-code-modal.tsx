"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket, ShieldAlert, CheckCircle2 } from "lucide-react";

interface InviteCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteCodeModal({ isOpen, onClose }: InviteCodeModalProps) {
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [successNotice, setSuccessNotice] = React.useState(false);

  const handleReset = () => {
    setCode("");
    setError(null);
    setSuccessNotice(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setError("Vui lòng nhập mã mời gồm 6 ký tự.");
      return;
    }

    if (cleanCode.length < 4 || cleanCode.length > 8) {
      setError("Mã mời thông thường gồm 6 ký tự chữ hoặc số.");
      return;
    }

    setError(null);
    setSuccessNotice(true);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nhập mã mời tham gia chuyến đi"
      description="Tham gia chuyến đi do bạn bè tổ chức (UC05)"
    >
      {!successNotice ? (
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <label
              htmlFor="invite-code-input"
              className="text-sm font-semibold text-yale-blue block"
            >
              Mã mời (Invite Code)
            </label>
            <div className="relative">
              <Input
                id="invite-code-input"
                type="text"
                maxLength={8}
                placeholder="VD: DL2026 hoặc PHUQ24"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  if (error) setError(null);
                }}
                className="uppercase tracking-widest text-center font-bold text-lg h-12"
                autoFocus
              />
              <Ticket className="absolute left-3.5 top-3.5 w-5 h-5 text-text-muted pointer-events-none" />
            </div>
            {error && (
              <p className="text-xs text-functional-negative font-medium flex items-center gap-1 mt-1.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </p>
            )}
            <p className="text-xs text-text-muted">
              Mã mời có dạng 6 ký tự in hoa do Trưởng nhóm cung cấp (Mã mời không phân biệt hoa/thường).
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-canvas border border-border-hairline text-xs text-text-muted space-y-1">
            <p className="font-semibold text-yale-blue">Chính sách riêng tư Release 1:</p>
            <p>
              Thẻ xem trước (Preview) chỉ hiển thị tên chuyến, điểm đến, thời gian và số thành viên. Lịch trình chi tiết và thông tin chi tiêu chỉ hiển thị sau khi yêu cầu tham gia được duyệt.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-hairline">
            <Button type="button" variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              Kiểm tra mã
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 py-2 text-text-body">
          <div className="p-4 rounded-xl bg-lime-cream/40 border border-emerald/40 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-functional-positive shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-bold text-yale-blue">
                Mã mời hợp lệ: <span className="text-cerulean font-mono">{code}</span>
              </p>
              <p className="text-xs text-text-muted leading-relaxed">
                Trong giai đoạn giao diện Frontend (Release 1), màn hình xem trước lời mời (`/trips/join/[code]`) và quy trình duyệt thành viên (UC05/UC30) đang được chuẩn bị.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-border-hairline">
            <Button variant="primary" onClick={handleClose}>
              Đã hiểu
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
