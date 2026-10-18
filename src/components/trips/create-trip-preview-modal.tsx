"use client";

import * as React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Wallet, UserCheck, Info, CheckCircle2 } from "lucide-react";
import { CreateTripFormData } from "@/types/trip";
import { formatMoney, formatDate } from "@/lib/utils";

interface CreateTripPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReturnToTrips: () => void;
  formData: CreateTripFormData;
  durationText: string | null;
}

export function CreateTripPreviewModal({
  isOpen,
  onClose,
  onReturnToTrips,
  formData,
  durationText,
}: CreateTripPreviewModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xem trước thông tin chuyến đi"
      description="Biểu mẫu đã kiểm tra cú pháp và logic hợp lệ"
    >
      <div className="space-y-4 py-1 text-sm text-text-body">
        {/* Success header badge */}
        <div className="p-3.5 rounded-xl bg-lime-cream/40 border border-emerald/40 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-functional-positive shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-yale-blue">
            Toàn bộ thông tin chuyến đi đã đáp ứng đầy đủ quy tắc nghiệp vụ!
          </span>
        </div>

        {/* Trip Data Summary Card */}
        <div className="p-4 rounded-2xl bg-white border border-border-hairline shadow-xs space-y-3">
          <div>
            <span className="text-xs text-text-muted font-medium block">Tên chuyến đi:</span>
            <span className="text-base font-bold text-yale-blue block mt-0.5">
              {formData.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-hairline/60">
            {/* Destination */}
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-cerulean shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-text-muted block">Điểm đến:</span>
                <span className="font-semibold text-yale-blue text-xs sm:text-sm">
                  {formData.destination.trim() ? formData.destination : "Chưa thiết lập"}
                </span>
              </div>
            </div>

            {/* Time & Duration */}
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-cerulean shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-text-muted block">Thời gian:</span>
                <span className="font-semibold text-yale-blue text-xs sm:text-sm">
                  {formatDate(formData.startDate)} – {formatDate(formData.endDate)}
                </span>
                {durationText && (
                  <span className="inline-block ml-1.5 px-2 py-0.2 rounded-full bg-lime-cream text-[11px] font-bold text-yale-blue">
                    {durationText}
                  </span>
                )}
              </div>
            </div>

            {/* Budget */}
            <div className="flex items-start gap-2">
              <Wallet className="w-4 h-4 text-cerulean shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-text-muted block">Ngân sách dự kiến:</span>
                <span className="font-semibold text-yale-blue text-xs sm:text-sm">
                  {formData.budgetAmount !== null
                    ? formatMoney(formData.budgetAmount)
                    : "Chưa thiết lập"}
                </span>
              </div>
            </div>

            {/* Creator / Host */}
            <div className="flex items-start gap-2">
              <UserCheck className="w-4 h-4 text-cerulean shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-text-muted block">Người khởi tạo:</span>
                <span className="font-semibold text-yale-blue text-xs sm:text-sm">
                  Lan Nguyễn (Trưởng nhóm)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Boundary Notice */}
        <div className="p-3.5 rounded-xl bg-bg-canvas border border-border-hairline text-xs text-text-muted space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-yale-blue">
            <Info className="w-4 h-4 text-cerulean shrink-0" />
            <span>Lưu ý:</span>
          </div>
          <p className="leading-relaxed">
            Dữ liệu chuyến đi chưa được lưu vào hệ thống (chế độ demo).
          </p>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-hairline">
          <Button type="button" variant="outline" onClick={onClose}>
            Tiếp tục chỉnh sửa
          </Button>
          <Button type="button" variant="primary" onClick={onReturnToTrips}>
            Quay về danh sách chuyến đi
          </Button>
        </div>
      </div>
    </Modal>
  );
}
