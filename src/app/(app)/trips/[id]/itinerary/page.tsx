"use client";

import * as React from "react";
import { CalendarDays } from "lucide-react";
import { useTripSession } from "@/components/trips/detail/trip-session-context";
import { TripTabPlaceholder } from "@/components/trips/detail/trip-tab-placeholder";

export default function TripItineraryPage() {
  const { sessionTrip } = useTripSession();

  return (
    <TripTabPlaceholder
      tripId={sessionTrip.id}
      icon={<CalendarDays className="w-8 h-8 stroke-[2]" />}
      title="Lịch trình chuyến đi"
      description={`Kế hoạch chi tiết theo từng ngày cho chuyến đi ${sessionTrip.name}.`}
      features={[
        "Dòng thời gian hoạt động theo từng ngày và khung giờ",
        "Gắn chi phí dự kiến trực tiếp vào từng địa điểm tham quan",
        "Định vị và dẫn đường nhanh tới các điểm dừng chân",
        "Cho phép các thành viên đề xuất hoạt động chung",
      ]}
    />
  );
}
