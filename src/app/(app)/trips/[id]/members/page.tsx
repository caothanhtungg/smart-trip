"use client";

import * as React from "react";
import { Users } from "lucide-react";
import { useTripSession } from "@/components/trips/detail/trip-session-context";
import { TripTabPlaceholder } from "@/components/trips/detail/trip-tab-placeholder";

export default function TripMembersPage() {
  const { sessionTrip } = useTripSession();

  return (
    <TripTabPlaceholder
      tripId={sessionTrip.id}
      icon={<Users className="w-8 h-8 stroke-[2]" />}
      title="Danh sách thành viên"
      description={`Quản lý vai trò và phân quyền thành viên trong chuyến đi ${sessionTrip.name}.`}
      features={[
        "Quản lý vai trò Trưởng nhóm (Host) và Thành viên (Member)",
        "Tạo và quản lý thành viên chưa có tài khoản (No-account member)",
        "Chia sẻ liên kết mời và mã tham gia trực tiếp",
        "Thống kê tổng chi và phần chi của từng thành viên",
      ]}
    />
  );
}
