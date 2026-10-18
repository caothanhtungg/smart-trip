"use client";

import * as React from "react";
import { TripExpensesTab } from "@/components/trips/expenses/trip-expenses-tab";
import { useTripSession } from "@/components/trips/detail/trip-session-context";

export default function TripExpensesPage() {
  const { sessionTrip, sessionExpenses, handleAddExpense, currentMemberId } = useTripSession();

  return (
    <TripExpensesTab
      trip={sessionTrip}
      expenses={sessionExpenses}
      onAddExpense={handleAddExpense}
      currentUserId={currentMemberId}
    />
  );
}
