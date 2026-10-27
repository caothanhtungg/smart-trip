"use client";

import * as React from "react";
import { TripDetailHeader } from "@/components/trips/detail/trip-detail-header";
import { TripDetailTabs } from "@/components/trips/detail/trip-detail-tabs";
import { useTripSession } from "@/components/trips/detail/trip-session-context";
import { useToast } from "@/components/ui/toast";
import FloatingAIAssistant from "@/components/ai/FloatingAIAssistant";
import { AISuggestionItem } from "@/lib/types/ai-assistant";

export function TripDetailLayoutView({
  tripId,
  children,
}: {
  tripId: string;
  children: React.ReactNode;
}) {
  const {
    sessionTrip,
    sessionToast,
    sessionMembers,
    currentMemberId,
    handleAddItineraryItem,
    handleSaveExpenseFromModal,
  } = useTripSession();

  const { toast } = useToast();

  const handleAddToItinerary = async (suggestion: AISuggestionItem) => {
    try {
      const dayDate = sessionTrip.startDate || new Date().toISOString().split("T")[0];
      const ok = await handleAddItineraryItem({
        dayDate,
        placeName: suggestion.name,
        startTime: "09:00",
        note: suggestion.description || "Gợi ý bởi Trợ lý AI Smart Trip",
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
      });
      if (ok) {
        toast(`Đã thêm "${suggestion.name}" vào lịch trình ngày ${dayDate}!`, "success");
      }
    } catch {
      toast("Không thể thêm vào lịch trình. Vui lòng thử lại.", "error");
    }
  };

  const handleAddToExpense = async (suggestion: AISuggestionItem) => {
    try {
      const payerId = currentMemberId || sessionMembers[0]?.id;
      if (!payerId) {
        toast("Không tìm thấy thành viên để gán người trả tiền.", "error");
        return;
      }

      const activeMemberIds = sessionMembers.map((m) => m.id);
      const res = await handleSaveExpenseFromModal({
        title: suggestion.name,
        amount: suggestion.estimatedCostMin || 100000,
        category:
          suggestion.category === "food"
            ? "FOOD"
            : suggestion.category === "transport"
            ? "TRANSPORT"
            : suggestion.category === "homestay"
            ? "LODGING"
            : "OTHER",
        paidByMemberId: payerId,
        participantMemberIds: activeMemberIds,
        spentAtDate: sessionTrip.startDate || new Date().toISOString().split("T")[0],
        splitMethod: "EQUAL",
        locationName: suggestion.name,
        note: suggestion.description || "Gợi ý bởi Trợ lý AI Smart Trip",
      });

      if (res && res.success) {
        toast(`Đã thêm khoản chi "${suggestion.name}" thành công!`, "success");
      }
    } catch {
      toast("Không thể thêm khoản chi. Vui lòng thử lại.", "error");
    }
  };

  return (
    <>
      {/* Top Cover Banner & Breadcrumb */}
      <TripDetailHeader trip={sessionTrip} />

      {/* Phased Tabs Bar using Next.js Links */}
      <TripDetailTabs tripId={tripId} />

      {/* Main Workspace Container */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {sessionToast && (
          <div className="mb-6 p-4 rounded-2xl bg-tropical-teal/10 border border-tropical-teal/30 flex items-start gap-3 shadow-sm animate-fadeIn">
            <span className="text-xs sm:text-sm text-yale-blue font-medium">
              {sessionToast}
            </span>
          </div>
        )}
        {children}
      </div>

      {/* Floating Smart AI Travel Assistant */}
      <FloatingAIAssistant
        tripId={tripId}
        tripTitle={sessionTrip.name}
        destination={sessionTrip.destination || undefined}
        onAddToItinerary={handleAddToItinerary}
        onAddToExpense={handleAddToExpense}
      />
    </>
  );
}
