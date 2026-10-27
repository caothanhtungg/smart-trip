"use client";

import * as React from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { useTripSession } from "@/components/trips/detail/trip-session-context";
import { ItineraryItem, CreateItineraryItemFormData } from "@/types/trip";
import { generateTripDays } from "@/lib/itinerary/date";
import { TripItineraryTimeline } from "./trip-itinerary-timeline";
import { TripItinerarySummaryCard } from "./trip-itinerary-summary-card";
import { TripItineraryFormModal } from "./trip-itinerary-form-modal";
import { TripDeleteItineraryModal } from "./trip-delete-itinerary-modal";
import { RouteOptimizationBar } from "@/components/itinerary/RouteOptimizationBar";

export function TripItineraryTab() {
  const {
    sessionTrip,
    sessionItinerary,
    sessionExpenses,
    currentMemberId,
    isItineraryLoading,
    itineraryError,
    refetchItinerary,
    handleAddItineraryItem,
    handleUpdateItineraryItem,
    handleDeleteItineraryItem,
    handleOpenAddExpenseForItinerary,
  } = useTripSession();

  // Generate list of days based on trip start and end date
  const tripDays = React.useMemo(() => {
    const days = generateTripDays(sessionTrip.startDate, sessionTrip.endDate);
    if (days.length > 0) return days;
    // Fallback if dates are invalid
    return [
      {
        dayIndex: 1,
        dateString: sessionTrip.startDate,
        dayLabel: "Ngày 1",
        shortDateText: sessionTrip.startDate,
        dayOfWeekShort: "T6",
        dayOfWeekFull: "Thứ Sáu",
        fullFormattedText: `Ngày 1 · ${sessionTrip.startDate}`,
      },
    ];
  }, [sessionTrip.startDate, sessionTrip.endDate]);

  // Selected Date State
  const [selectedDate, setSelectedDate] = React.useState<string>(() => {
    return tripDays[0]?.dateString || sessionTrip.startDate;
  });

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = React.useState<boolean>(false);
  const [addModalDate, setAddModalDate] = React.useState<string>(selectedDate);
  const [editingItem, setEditingItem] = React.useState<ItineraryItem | null>(null);
  const [deletingItem, setDeletingItem] = React.useState<ItineraryItem | null>(null);

  const currentMember = sessionTrip.members.find((m) => m.id === currentMemberId);
  const isHost = currentMember?.role === "HOST" || !!currentMember?.isHost;

  // Handlers
  const handleOpenAdd = (dayDate: string) => {
    setAddModalDate(dayDate);
    setEditingItem(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (item: ItineraryItem) => {
    setEditingItem(item);
    setAddModalDate(item.dayDate);
    setIsAddModalOpen(true);
  };

  const handleOpenDelete = (item: ItineraryItem) => {
    setDeletingItem(item);
  };

  const handleSaveModal = async (formData: CreateItineraryItemFormData) => {
    if (editingItem) {
      return await handleUpdateItineraryItem(editingItem.id, formData);
    }
    return await handleAddItineraryItem(formData);
  };

  return (
    <div className="w-full">
      {/* Loading Skeleton */}
      {isItineraryLoading ? (
        <div
          role="status"
          aria-label="Đang tải lịch trình..."
          className="w-full animate-pulse"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="h-8 bg-hover-row rounded-xl w-64" />
              <div className="h-4 bg-hover-row rounded-lg w-40" />
              <div className="h-12 bg-hover-row rounded-2xl w-full" />
              <div className="space-y-4 pt-4">
                <div className="h-28 rounded-2xl bg-hover-row" />
                <div className="h-28 rounded-2xl bg-hover-row" />
                <div className="h-28 rounded-2xl bg-hover-row" />
              </div>
            </div>
            <div className="lg:col-span-4">
              <div className="h-64 rounded-3xl bg-hover-row" />
            </div>
          </div>
        </div>
      ) : itineraryError ? (
        /* Error Alert Card with Retry */
        <div
          role="alert"
          className="w-full max-w-2xl mx-auto my-8 p-6 sm:p-8 bg-white rounded-3xl border border-functional-negative/20 shadow-sm text-center space-y-4"
        >
          <div className="w-14 h-14 rounded-2xl bg-functional-negative/10 text-functional-negative flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-yale-blue">
              Không thể tải lịch trình
            </h3>
            <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto">
              {itineraryError}
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => refetchItinerary()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cerulean hover:bg-baltic-blue text-white text-xs sm:text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-cerulean/40 active:scale-95"
            >
              <RotateCw className="w-4 h-4" />
              <span>Thử lại</span>
            </button>
          </div>
        </div>
      ) : (
        /* Main Two-Column Layout Grid (8 - 4) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: 8 Columns (Schedule & Timeline) */}
          <div className="lg:col-span-8 space-y-5">
            <RouteOptimizationBar
              tripId={sessionTrip.id}
              dayDate={selectedDate}
              itemCount={sessionItinerary.filter((it) => it.dayDate === selectedDate).length}
              onOptimized={refetchItinerary}
              isLocked={sessionTrip.status !== "ACTIVE"}
            />
            <TripItineraryTimeline
              trip={sessionTrip}
              tripDays={tripDays}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              items={sessionItinerary}
              expenses={sessionExpenses}
              currentMember={currentMember}
              isHost={isHost}
              onOpenAddModal={handleOpenAdd}
              onEditItem={handleOpenEdit}
              onDeleteItem={handleOpenDelete}
              onAddExpenseForItem={handleOpenAddExpenseForItinerary}
            />
          </div>

          {/* RIGHT COLUMN: 4 Columns (Sticky Day Summary & Vector Art) */}
          <div className="lg:col-span-4">
            <TripItinerarySummaryCard
              trip={sessionTrip}
              tripDays={tripDays}
              selectedDate={selectedDate}
              items={sessionItinerary}
              expenses={sessionExpenses}
            />
          </div>
        </div>
      )}

      {/* Add / Edit Stop Modal */}
      <TripItineraryFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingItem(null);
        }}
        trip={sessionTrip}
        tripDays={tripDays}
        initialItem={editingItem}
        defaultDate={addModalDate}
        existingItems={sessionItinerary}
        onSave={handleSaveModal}
      />

      {/* Delete Confirmation Modal */}
      <TripDeleteItineraryModal
        isOpen={!!deletingItem}
        onClose={() => setDeletingItem(null)}
        item={deletingItem}
        onConfirmDelete={handleDeleteItineraryItem}
      />
    </div>
  );
}
