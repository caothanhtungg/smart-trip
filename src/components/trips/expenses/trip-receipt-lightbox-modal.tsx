"use client";

import * as React from "react";
import Image from "next/image";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { TripExpense } from "@/types/trip";
import { formatMoney } from "@/lib/utils";
import { formatExpenseDate, ExpenseRowView } from "@/lib/view/expense-row";
import { Receipt, Calendar, User, Info, MapPin } from "lucide-react";

interface TripReceiptLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: TripExpense | ExpenseRowView | null;
}

export function TripReceiptLightboxModal({
  isOpen,
  onClose,
  expense,
}: TripReceiptLightboxModalProps) {
  if (!expense) return null;

  const paidByName = "paidByName" in expense ? expense.paidByName : "Thành viên";
  const dateFormatted =
    "spentAtFormatted" in expense ? expense.spentAtFormatted : formatExpenseDate(expense.spentAt);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết chứng từ / Hóa đơn"
      description={`Chứng từ đính kèm cho: ${expense.title}`}
    >
      <div className="space-y-4 py-1">
        {/* Disclaimers & Notes */}
        <div className="p-3 rounded-xl bg-functional-warning-bg border border-functional-warning/20 flex items-start gap-2.5 text-xs text-yale-blue">
          <Info className="w-4 h-4 text-functional-warning shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold">Minh họa nội bộ:</span> Hình ảnh và số liệu chỉ phục vụ mục đích kiểm tra đối soát trong nhóm. Hệ thống chưa hỗ trợ thanh toán thật hoặc kiểm tra tài khoản thực.
          </div>
        </div>

        {/* Expense Info Summary Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-bg-canvas border border-border-hairline gap-2">
          <div>
            <h4 className="font-bold text-yale-blue text-sm">{expense.title}</h4>
            <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cerulean" />
                <span>{dateFormatted}</span>
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-cerulean" />
                <span>{paidByName}</span>
              </span>
              {expense.locationName ? (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cerulean" />
                  <span>{expense.locationName}</span>
                </span>
              ) : null}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-text-muted block">Tổng tiền</span>
            <span className="text-base font-bold text-cerulean tabular-nums">
              {formatMoney(expense.amount || 0)}
            </span>
          </div>
        </div>

        {/* Receipt Image Container */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-yale-blue/5 border border-border-hairline flex flex-col items-center justify-center p-4 min-h-[280px]">
          {expense.receiptImageUrl ? (
            <div className="relative w-full max-h-[380px] h-[340px] rounded-xl overflow-hidden bg-black/5 flex items-center justify-center">
              <Image
                src={expense.receiptImageUrl}
                alt={`Hóa đơn ${expense.title}`}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center text-text-muted">
              <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-cerulean mb-3">
                <Receipt className="w-7 h-7" />
              </div>
              <p className="font-medium text-sm text-yale-blue">Chưa có ảnh chứng từ thực tế</p>
              <p className="text-xs mt-1 max-w-[280px]">
                Khoản chi này được ghi nhận trực tiếp không kèm ảnh chụp hóa đơn.
              </p>
            </div>
          )}
        </div>

        {/* Notes if any */}
        {expense.note && (
          <div className="text-xs text-text-muted bg-surface-container p-3 rounded-xl border border-border-hairline">
            <strong className="text-yale-blue font-semibold">Ghi chú:</strong> {expense.note}
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end pt-2 border-t border-border-hairline">
          <Button variant="secondary" size="md" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
