"use client";

import * as React from "react";
import { useTripSession } from "@/components/trips/detail/trip-session-context";
import { ItineraryItem, CreateItineraryItemFormData } from "@/types/trip";
import { generateTripDays } from "@/lib/itinerary/date";
import { TripItineraryTimeline } from "./trip-itinerary-timeline";
import { TripItinerarySummaryCard } from "./trip-itinerary-summary-card";
import { TripItineraryFormModal } from "./trip-itinerary-form-modal";
import { TripDeleteItineraryModal } from "./trip-delete-itinerary-modal";

export function TripItineraryTab() {
  const {
    sessionTrip,
    sessionItinerary,
    sessionExpenses,
    currentMemberId,
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

  const handleSaveModal = (formData: CreateItineraryItemFormData) => {
    if (editingItem) {
      return handleUpdateItineraryItem(editingItem.id, formData);
    }
    return handleAddItineraryItem(formData);
  };

  return (
    <div className="w-full">
      {/* Main Two-Column Layout Grid (8 - 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: 8 Columns (Schedule & Timeline) */}
        <div className="lg:col-span-8">
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
