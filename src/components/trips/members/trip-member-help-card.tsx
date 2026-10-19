"use client";

import * as React from "react";
import { HelpCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TripMemberHelpCardProps {
  isHost: boolean;
  isTripActive: boolean;
  onOpenAddGuestModal: () => void;
}

export function TripMemberHelpCard({
  isHost,
  isTripActive,
  onOpenAddGuestModal,
}: TripMemberHelpCardProps) {
  return (
    <section className="w-full bg-surface-card rounded-2xl p-5 sm:p-6 shadow-[0_4px_16px_rgba(24,78,119,0.06)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-divider-border">
      <div className="flex items-start gap-4 max-w-3xl">
        <div className="w-12 h-12 rounded-xl bg-lime-cream text-yale-blue flex items-center justify-center shrink-0 shadow-xs mt-0.5">
          <HelpCircle className="w-6 h-6 text-cerulean" />
        </div>
        <div className="flex flex-col gap-1">
          <h4 className="font-semibold text-base sm:text-lg text-yale-blue">
            Thành viên chưa có tài khoản là gì?
          </h4>
          <p className="text-sm text-text-muted leading-relaxed">
            Là người tham gia chuyến đi nhưng không cài ứng dụng hoặc chưa đăng ký Smart Trip. Trưởng
            nhóm có thể nhập trước chi tiêu hộ và chia phần tiền rõ ràng. Khi họ tạo tài khoản và gửi
            yêu cầu, Trưởng nhóm chỉ cần duyệt để tự động đồng bộ hóa toàn bộ công nợ.
          </p>
        </div>
      </div>

      {isHost && isTripActive && (
        <Button
          type="button"
          variant="outline"
          onClick={onOpenAddGuestModal}
          className="h-11 px-4 bg-hover-row hover:bg-lime-cream/60 text-cerulean border-ocean-mist font-semibold text-sm rounded-xl flex items-center gap-2 shrink-0 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Thêm thành viên chưa có tài khoản</span>
        </Button>
      )}
    </section>
  );
}
