"use client";

import * as React from "react";
import { WalletCards } from "lucide-react";
import { useTripSession } from "@/components/trips/detail/trip-session-context";
import { TripTabPlaceholder } from "@/components/trips/detail/trip-tab-placeholder";

export default function TripSettlementPage() {
  const { sessionTrip } = useTripSession();

  return (
    <TripTabPlaceholder
      tripId={sessionTrip.id}
      icon={<WalletCards className="w-8 h-8 stroke-[2]" />}
      title="Công nợ & Quyết toán"
      description={`Bảng tính toán bù trừ nợ tự động và thanh toán thông minh cho ${sessionTrip.name}.`}
      features={[
        "Tối giản số giao dịch chuyển khoản giữa các thành viên",
        "Sinh mã VietQR chuẩn NAPAS 247 kèm số tiền chính xác",
        "Trưởng nhóm chốt sổ và khóa chi tiêu an toàn",
        "Đánh dấu trạng thái đã thanh toán và lưu lịch sử đối soát",
      ]}
    />
  );
}
