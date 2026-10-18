"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket, ShieldAlert, CheckCircle2, Info } from "lucide-react";
import { validateInviteCode } from "@/lib/trips/invite-code";

interface InviteCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteCodeModal({ isOpen, onClose }: InviteCodeModalProps) {
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [validFormatCode, setValidFormatCode] = React.useState<string | null>(null);

  const handleReset = () => {
    setCode("");
    setError(null);
    setValidFormatCode(null);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateInviteCode(code);

    if (!result.isValid) {
      setError(result.error ?? "Mã mời không đúng định dạng.");
      setValidFormatCode(null);
      return;
    }

    setError(null);
    setValidFormatCode(result.normalizedCode ?? code.trim().toUpperCase());
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nhập mã mời tham gia chuyến đi"
      description="Kiểm tra định dạng mã mời do Trưởng nhóm cung cấp"
    >
      {!validFormatCode ? (
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
                maxLength={13}
                placeholder="VD: DL3N2D-TRIP99"
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
              <div className="p-2.5 rounded-lg bg-functional-warning-bg border border-functional-warning/30 text-xs text-functional-negative font-medium flex items-center gap-2 mt-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <p className="text-xs text-text-muted">
              Mã mời gồm <strong>10–12 ký tự chữ/số</strong> (không tính tối đa một dấu gạch nối), độ dài tối đa 13 ký tự, ví dụ: <code className="font-mono bg-bg-canvas px-1 py-0.5 rounded border border-border-hairline">DL3N2D-TRIP99</code>.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-bg-canvas border border-border-hairline text-xs text-text-muted space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-yale-blue">
              <Info className="w-4 h-4 text-cerulean shrink-0" />
              <span>Lưu ý:</span>
            </div>
            <p>
              Hệ thống chỉ xác thực định dạng cú pháp mã mời ở tầng frontend. Quy trình tra cứu cơ sở dữ liệu và gửi yêu cầu tham gia sẽ được kết nối chính thức khi triển khai máy chủ hệ thống.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-hairline">
            <Button type="button" variant="outline" onClick={handleClose}>
              Hủy
            </Button>
            <Button type="submit" variant="primary">
              Kiểm tra định dạng
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4 py-2 text-text-body">
          <div className="p-4 rounded-xl bg-lime-cream/40 border border-emerald/40 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-functional-positive shrink-0 mt-0.5" />
            <div className="text-sm space-y-1.5">
              <p className="font-bold text-yale-blue">
                Định dạng mã mời hợp lệ:{" "}
                <span className="font-mono text-cerulean font-bold text-base px-1.5 py-0.5 bg-white rounded border border-border-hairline">
                  {validFormatCode}
                </span>
              </p>
              <p className="text-xs text-text-muted leading-relaxed">
                Mã mời đáp ứng định dạng hợp lệ (10–12 ký tự chữ/số, không tính tối đa một dấu gạch nối). Giao diện chỉ kiểm tra định dạng, chưa tra cứu dữ liệu thật.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-hairline">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setValidFormatCode(null);
                setCode("");
              }}
            >
              Nhập mã khác
            </Button>
            <Button variant="primary" onClick={handleClose}>
              Đã hiểu
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
