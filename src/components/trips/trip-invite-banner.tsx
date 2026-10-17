"use client";

import * as React from "react";
import { Users, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TripInviteBannerProps {
  onOpenInviteModal: () => void;
}

export function TripInviteBanner({ onOpenInviteModal }: TripInviteBannerProps) {
  return (
    <section
      aria-label="Nhập mã mời tham gia chuyến đi"
      className="mt-10 sm:mt-12 p-6 rounded-[20px] bg-white border border-border-hairline flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_4px_16px_rgba(24,78,119,0.04)]"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-hover-row flex items-center justify-center text-cerulean shrink-0">
          <Users className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <h3 className="font-bold text-yale-blue text-base sm:text-lg">
            Bạn được bạn bè mời tham gia chuyến đi?
          </h3>
          <p className="text-sm text-text-muted mt-0.5">
            Nhập mã mời 10–12 ký tự chữ/số (không tính tối đa một dấu gạch nối) do bạn bè gửi để xem trước và gửi yêu cầu tham gia
          </p>
        </div>
      </div>

      <Button
        variant="secondary"
        size="md"
        onClick={onOpenInviteModal}
        className="w-full sm:w-auto whitespace-nowrap flex items-center justify-center gap-2 shadow-xs"
      >
        <Ticket className="w-4 h-4 stroke-[2]" />
        <span>Nhập mã mời</span>
      </Button>
    </section>
  );
}
