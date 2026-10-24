"use client";

import * as React from "react";
import { Trip, TripDetailData } from "@/types/trip";
import { registerMockTripDetail } from "@/lib/mock/trips";
import {
  fetchMyTrips,
  createTripApi,
  TripsApiError,
} from "@/lib/services/trips-api";

export interface CreateTripData {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budgetAmount: number;
}

export interface TripsStoreContextValue {
  trips: Trip[];
  isLoading: boolean;
  error: TripsApiError | Error | null;
  refetchTrips: () => Promise<void>;
  createTrip: (data: CreateTripData) => Promise<string>;
  addTrip: (data: CreateTripData) => Promise<string>;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  archiveTrip: (id: string) => void;
  getTrip: (id: string) => Trip | undefined;
}

const TripsStoreContext = React.createContext<TripsStoreContextValue | undefined>(undefined);

export interface TripsStoreProviderProps {
  children?: React.ReactNode;
  /**
   * Dữ liệu khởi tạo tùy chọn dành cho testing hoặc SSR dehydration.
   * Nếu được truyền vào, store sẽ không tự động fetch lại API khi mount.
   */
  initialTrips?: Trip[];
}

export function TripsStoreProvider({
  children,
  initialTrips,
}: TripsStoreProviderProps) {
  const [trips, setTrips] = React.useState<Trip[]>(() => initialTrips ?? []);
  const [isLoading, setIsLoading] = React.useState<boolean>(
    () => initialTrips === undefined
  );
  const [error, setError] = React.useState<TripsApiError | Error | null>(null);

  // Hàm tải dữ liệu chuyến đi từ API thật (GET /api/trips)
  const fetchTripsInternal = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMyTrips();
      setTrips(data);
    } catch (err) {
      setError(
        err instanceof TripsApiError || err instanceof Error
          ? err
          : new Error("Lỗi không xác định khi tải danh sách chuyến đi.")
      );
      // TUÂN THỦ: Không hiển thị MOCK_TRIPS làm fallback im lặng khi API thất bại
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Tự động tải danh sách chuyến đi khi component mount lần đầu
  React.useEffect(() => {
    if (initialTrips !== undefined) return;

    let isMounted = true;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchMyTrips();
        if (isMounted) {
          setTrips(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof TripsApiError || err instanceof Error
              ? err
              : new Error("Lỗi không xác định khi tải danh sách chuyến đi.")
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [initialTrips]);

  const refetchTrips = React.useCallback(async () => {
    await fetchTripsInternal();
  }, [fetchTripsInternal]);

  /**
   * Tạo chuyến đi mới qua API thật (POST /api/trips).
   * BẢO MẬT:
   * - Chỉ gửi thông tin cơ bản: name, destination, startDate, endDate, budgetAmount.
   * - Không gửi id, userId, role hay memberId tự khai báo từ client.
   * - Nhận lại UUID thật từ PostgreSQL do server sinh ra và gán Host an toàn.
   */
  const createTrip = React.useCallback(
    async (data: CreateTripData): Promise<string> => {
      const { dto, trip } = await createTripApi({
        name: data.name,
        destination: data.destination,
        startDate: data.startDate,
        endDate: data.endDate,
        budgetAmount: data.budgetAmount,
      });

      // Đăng ký tạm vào dynamicTripDetails để các màn con legacy /trips/[id] vẫn đọc được
      // dữ liệu chuyến đi mới tạo trước khi Phase 3D-2D tích hợp API chi tiết thật.
      const newTripDetail: TripDetailData = {
        id: trip.id,
        name: trip.name,
        destination: trip.destination,
        startDate: trip.startDate,
        endDate: trip.endDate,
        budgetAmount: trip.budgetAmount ?? 0,
        plannedBudget: trip.budgetAmount ?? 0,
        status: trip.status,
        inviteCode: trip.inviteCode,
        updatedAt: trip.updatedAt,
        createdAt: trip.createdAt,
        currentMemberId: dto.host.memberId,
        totalSpent: 0,
        userSpent: 0,
        userBalance: {
          type: "SETTLED",
          amount: 0,
        },
        expenseCount: 0,
        paidActivitiesCount: 0,
        members: trip.members.map((m) => ({
          ...m,
          spentAmount: 0,
        })),
        recentExpenses: [],
        expenses: [],
        categoryAllocations: [],
      };
      registerMockTripDetail(newTripDetail);

      // Prepend chuyến đi mới vào danh sách trong state
      setTrips((prev) => [trip, ...prev]);

      return trip.id;
    },
    []
  );

  // Alias tương thích ngược cho addTrip
  const addTrip = createTrip;

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
        isLoading,
        error,
        refetchTrips,
        createTrip,
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

/**
 * Hook tùy chọn lấy TripsStoreContext mà không ném lỗi nếu Provider chưa được bọc
 * (Hữu ích khi render cô lập trong unit tests hoặc màn hình độc lập).
 */
export function useOptionalTripsStore(): TripsStoreContextValue | null {
  return React.useContext(TripsStoreContext) ?? null;
}
