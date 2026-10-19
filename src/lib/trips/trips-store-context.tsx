"use client";

import * as React from "react";
import { Trip, TripDetailData } from "@/types/trip";
import { MOCK_TRIPS, registerMockTripDetail } from "@/lib/mock/trips";
import { useUserProfile } from "@/lib/user/user-context";

export interface CreateTripData {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetAmount: number;
}

interface TripsStoreContextValue {
  trips: Trip[];
  addTrip: (data: CreateTripData) => string;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  archiveTrip: (id: string) => void;
  getTrip: (id: string) => Trip | undefined;
}

const TripsStoreContext = React.createContext<TripsStoreContextValue | undefined>(undefined);

function generateValidInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let prefix = "";
  let suffix = "";
  for (let i = 0; i < 5; i++) {
    prefix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  for (let i = 0; i < 5; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${suffix}`;
}

export function TripsStoreProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useUserProfile();
  const [trips, setTrips] = React.useState<Trip[]>(() => [...MOCK_TRIPS]);

  const addTrip = React.useCallback(
    (data: CreateTripData): string => {
      const timestamp = Date.now();
      const id = `trip-${timestamp}`;
      const inviteCode = generateValidInviteCode();

      const newTrip: Trip = {
        id,
        name: data.name.trim(),
        destination: data.destination.trim(),
        startDate: data.startDate,
        endDate: data.endDate,
        budgetAmount: data.budgetAmount,
        status: "ACTIVE",
        inviteCode,
        updatedAt: new Date().toISOString(),
        members: [
          {
            id: "m1",
            name: profile.fullName || "Lan Nguyễn",
            role: "HOST",
            status: "ACTIVE",
            joinOrder: 1,
            isCurrentUser: true,
          },
        ],
        userBalance: {
          type: "SETTLED",
          amount: 0,
        },
      };

      const newTripDetail: TripDetailData = {
        id,
        name: newTrip.name,
        destination: newTrip.destination,
        startDate: newTrip.startDate,
        endDate: newTrip.endDate,
        budgetAmount: newTrip.budgetAmount ?? 0,
        plannedBudget: newTrip.budgetAmount ?? 0,
        status: "ACTIVE",
        inviteCode,
        updatedAt: newTrip.updatedAt,
        currentMemberId: "m1",
        totalSpent: 0,
        userSpent: 0,
        userBalance: {
          type: "SETTLED",
          amount: 0,
        },
        expenseCount: 0,
        paidActivitiesCount: 0,
        members: newTrip.members.map((m) => ({
          ...m,
          spentAmount: m.spentAmount ?? 0,
        })),
        recentExpenses: [],
        expenses: [],
        categoryAllocations: [],
      };
      registerMockTripDetail(newTripDetail);

      setTrips((prev) => [newTrip, ...prev]);
      return id;
    },
    [profile.fullName]
  );

  const updateTrip = React.useCallback((id: string, updates: Partial<Trip>) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  }, []);

  const archiveTrip = React.useCallback((id: string) => {
    setTrips((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: "ARCHIVED",
              updatedAt: new Date().toISOString(),
            }
          : t
      )
    );
  }, []);

  const getTrip = React.useCallback(
    (id: string): Trip | undefined => {
      return trips.find((t) => t.id === id);
    },
    [trips]
  );

  return (
    <TripsStoreContext.Provider
      value={{
        trips,
        addTrip,
        updateTrip,
        archiveTrip,
        getTrip,
      }}
    >
      {children}
    </TripsStoreContext.Provider>
  );
}

export function useTripsStore(): TripsStoreContextValue {
  const context = React.useContext(TripsStoreContext);
  if (!context) {
    throw new Error("useTripsStore must be used within a TripsStoreProvider");
  }
  return context;
}
