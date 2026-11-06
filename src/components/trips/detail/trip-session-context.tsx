"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  TripDetailData,
  TripExpense,
  TripMember,
  TripMemberDetail,
  CreateExpenseFormData,
  ExpenseShare,
  TripRecentExpense,
  TripStatus,
  ItineraryItem,
  CreateItineraryItemFormData,
  CreateGuestMemberFormData,
  EditGuestMemberFormData,
  MemberClaim,
} from "@/types/trip";
import { Settlement, SettlementTransfer, PaymentMethod } from "@/types/settlement";
import { computeEqualShares, computeItemizedShares } from "@/lib/money/split";
import {
  calculateTotalSpent,
  calculateBudgetStatus,
  calculateAvgSpentPerPerson,
  calculateUserSpent,
} from "@/lib/money/budget";
import {
  calculateMemberBalances,
  generateSettlementTransfers,
  canReopenSettlement,
  isSettlementFullyCompleted,
} from "@/lib/money/settlement";
import { formatDateInputToIso, formatExpenseDate } from "@/lib/view/expense-row";
import { getExpenseCategoryLabel, getSplitMethodLabel } from "@/lib/labels";
import { TripExpenseFormModal } from "@/components/trips/expenses/trip-expense-form-modal";
import { getMockItineraryForTrip } from "@/lib/mock/itinerary";
import { getMockClaimsForTrip } from "@/lib/mock/claims";
import {
  canAddItineraryItem,
  canEditItineraryItem,
  canDeleteItineraryItem,
  sortItineraryItems,
  validateItineraryItemForm,
} from "@/lib/itinerary/validation";
import { canEditExpense, canDeleteExpense } from "@/lib/validation/expense";
import {
  validateGuestMemberForm,
  canAddGuestMember,
  canEditGuestMember,
  canRemoveMember,
  canLeaveTrip,
  canDecideClaim,
} from "@/lib/members/validation";
import {
  isUuid,
  updateTripApi,
  rotateInviteCodeApi,
  archiveTripApi,
  fetchTripClaimsApi,
  decideClaimApi,
  TripsApiError,
} from "@/lib/services/trips-api";
import {
  fetchTripExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  ExpensesApiError,
} from "@/lib/services/expenses-api";
import {
  fetchTripItinerary,
  createItineraryItem,
  updateItineraryItem,
  deleteItineraryItem,
  ItineraryApiError,
} from "@/lib/services/itinerary-api";
import {
  fetchTripMembers,
  createGuestMember,
  updateGuestMember,
  deleteTripMember,
  MembersApiError,
} from "@/lib/services/members-api";
import {
  fetchTripSettlement,
  createTripSettlement,
  reopenTripSettlement,
  markTransferPaid as apiMarkTransferPaid,
  confirmTransferCompleted as apiConfirmTransferCompleted,
  mapApiSettlementToDomain,
  mapApiTransferToDomain,
  SettlementApiError,
} from "@/lib/services/settlement-api";
import { useOptionalTripsStore } from "@/lib/trips/trips-store-context";

interface TripSessionContextValue {
  trip: TripDetailData;
  sessionTrip: TripDetailData;
  sessionExpenses: TripExpense[];
  isExpensesLoading: boolean;
  expensesError: string | null;
  refetchExpenses: () => Promise<void>;
  sessionItinerary: ItineraryItem[];
  isItineraryLoading: boolean;
  itineraryError: string | null;
  refetchItinerary: () => Promise<void>;
  sessionMembers: TripMember[];
  isMembersLoading: boolean;
  membersError: string | null;
  refetchMembers: () => Promise<void>;
  sessionClaims: MemberClaim[];
  sessionInviteCode: string;
  sessionStatus: TripStatus;
  sessionTransfers: SettlementTransfer[];
  sessionSettlement: Settlement | null;
  isSettlementLoading: boolean;
  settlementError: string | null;
  isSettlementMutating: boolean;
  refetchSettlement: () => Promise<void>;
  currentMemberId: string;
  setCurrentMemberId: (id: string) => void;
  isHost: boolean;
  currentRole: "HOST" | "MEMBER";
  isOverviewAddModalOpen: boolean;
  setIsOverviewAddModalOpen: (open: boolean) => void;
  handleAddExpense: (newExpense: TripExpense) => void;
  handleSaveExpenseFromModal: (
    formData: CreateExpenseFormData
  ) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  handleUpdateExpense: (
    id: string,
    formData: CreateExpenseFormData
  ) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  handleDeleteExpense: (
    id: string
  ) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  handleUpdateTripInfo: (updates: {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    budgetAmount: number;
  }) => Promise<{ success: boolean; message?: string }>;
  handleArchiveTrip: () => void | Promise<void>;
  handleAddItineraryItem: (
    formData: CreateItineraryItemFormData
  ) => Promise<{ success: boolean; message?: string }>;
  handleUpdateItineraryItem: (
    id: string,
    formData: CreateItineraryItemFormData
  ) => Promise<{ success: boolean; message?: string }>;
  handleDeleteItineraryItem: (
    id: string
  ) => Promise<{ success: boolean; message?: string }>;
  handleOpenAddExpenseForItinerary: (item: ItineraryItem) => void;
  handleAddGuestMember: (
    formData: CreateGuestMemberFormData
  ) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  handleEditGuestMember: (
    id: string,
    formData: EditGuestMemberFormData
  ) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  handleRemoveMember: (
    id: string
  ) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  handleLeaveTrip: (
    id: string
  ) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  handleApproveClaim: (
    claimId: string
  ) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  handleRejectClaim: (
    claimId: string
  ) => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  handleResetInviteCode: () =>
    | Promise<{ success: boolean; code?: string; message?: string }>
    | { success: boolean; code?: string; message?: string };
  handleLockSettlement: () => Promise<{ success: boolean; message?: string }> | void;
  handleReopenSettlement: () => Promise<{ success: boolean; message?: string }> | { success: boolean; message?: string };
  handleMarkTransferPaid: (
    transferId: string,
    paymentMethod?: PaymentMethod,
    note?: string
  ) => Promise<{ success: boolean; message?: string }> | void;
  handleConfirmTransferCompleted: (
    transferId: string
  ) => Promise<{ success: boolean; message?: string }> | void;
  sessionToast: string | null;
  setSessionToast: (toast: string | null) => void;
}

const TripSessionContext = React.createContext<TripSessionContextValue | null>(null);

export function useTripSession(): TripSessionContextValue {
  const context = React.useContext(TripSessionContext);
  if (!context) {
    throw new Error("useTripSession must be used within a TripSessionProvider");
  }
  return context;
}

export function useOptionalTripSession(): TripSessionContextValue | null {
  return React.useContext(TripSessionContext);
}

interface TripSessionProviderProps {
  initialTrip: TripDetailData;
  isRealApi?: boolean;
  children: React.ReactNode;
}

export function TripSessionProvider({
  initialTrip,
  isRealApi,
  children,
}: TripSessionProviderProps) {
  const router = useRouter();
  const isRealTrip = isRealApi ?? isUuid(initialTrip.id);
  const tripsStore = useOptionalTripsStore();

  const [currentMemberId, setCurrentMemberId] = React.useState<string>(
    initialTrip.currentMemberId
  );
  const [sessionStatus, setSessionStatus] = React.useState<TripStatus>(
    initialTrip.status
  );

  const [tripInfo, setTripInfo] = React.useState({
    name: initialTrip.name,
    destination: initialTrip.destination || "",
    startDate: initialTrip.startDate,
    endDate: initialTrip.endDate,
    budgetAmount: initialTrip.budgetAmount || 0,
  });

  const [sessionMembers, setSessionMembers] = React.useState<TripMember[]>(() => {
    return [...(initialTrip.members || [])];
  });
  const [isMembersLoading, setIsMembersLoading] = React.useState<boolean>(
    () => isRealTrip && (!initialTrip.members || initialTrip.members.length === 0)
  );
  const [membersError, setMembersError] = React.useState<string | null>(null);
  const [sessionClaims, setSessionClaims] = React.useState<MemberClaim[]>(() => {
    if (isRealTrip) return [];
    return getMockClaimsForTrip(initialTrip.id);
  });
  const [sessionInviteCode, setSessionInviteCode] = React.useState<string>(
    initialTrip.inviteCode
  );

  const currentMember = sessionMembers.find((m) => m.id === currentMemberId);
  const isHost = currentMember
    ? currentMember.role === "HOST" || !!currentMember.isHost
    : initialTrip.currentRole === "HOST";
  const currentRole: "HOST" | "MEMBER" =
    (currentMember?.role as "HOST" | "MEMBER") ||
    initialTrip.currentRole ||
    (isHost ? "HOST" : "MEMBER");

  const [sessionExpenses, setSessionExpenses] = React.useState<TripExpense[]>(() => {
    if (isRealTrip) return [];
    return [...(initialTrip.expenses || [])];
  });
  const [isExpensesLoading, setIsExpensesLoading] = React.useState<boolean>(
    () => isRealTrip
  );
  const [expensesError, setExpensesError] = React.useState<string | null>(null);

  const [lockedTransfers, setLockedTransfers] = React.useState<SettlementTransfer[]>([]);
  const [serverSettlement, setServerSettlement] = React.useState<Settlement | null>(null);
  const [isSettlementLoading, setIsSettlementLoading] = React.useState<boolean>(() => isRealTrip);
  const [settlementError, setSettlementError] = React.useState<string | null>(null);
  const [isSettlementMutating, setIsSettlementMutating] = React.useState<boolean>(false);
  const [isOverviewAddModalOpen, setIsOverviewAddModalOpen] = React.useState(false);
  const [sessionToast, setSessionToast] = React.useState<string | null>(null);

  const [sessionItinerary, setSessionItinerary] = React.useState<ItineraryItem[]>(() => {
    if (initialTrip.itineraryItems && initialTrip.itineraryItems.length > 0) {
      return [...initialTrip.itineraryItems];
    }
    if (isRealTrip) return [];
    return getMockItineraryForTrip(initialTrip.id);
  });
  const [isItineraryLoading, setIsItineraryLoading] = React.useState<boolean>(
    () => isRealTrip
  );
  const [itineraryError, setItineraryError] = React.useState<string | null>(null);

  const activeTripIdRef = React.useRef(initialTrip.id);
  React.useEffect(() => {
    activeTripIdRef.current = initialTrip.id;
  }, [initialTrip.id]);

  const loadItinerary = React.useCallback(
    async (tripId: string) => {
      if (!isUuid(tripId)) {
        setIsItineraryLoading(false);
        setItineraryError(null);
        return;
      }
      try {
        const items = await fetchTripItinerary(tripId);
        if (activeTripIdRef.current === tripId) {
          setSessionItinerary(sortItineraryItems(items));
        }
      } catch (err) {
        if (activeTripIdRef.current !== tripId) return;
        if (err instanceof ItineraryApiError) {
          if (err.status === 401) {
            router.push(
              `/login?callbackUrl=${encodeURIComponent(
                typeof window !== "undefined"
                  ? window.location.pathname
                  : `/trips/${tripId}`
              )}`
            );
            return;
          }
          if (err.status === 403) {
            setItineraryError(
              "Bạn không có quyền truy cập lịch trình của chuyến đi này."
            );
            return;
          }
          setItineraryError(err.message || "Không thể tải lịch trình chuyến đi.");
        } else {
          setItineraryError(
            err instanceof Error
              ? err.message
              : "Lỗi kết nối mạng khi tải lịch trình."
          );
        }
      } finally {
        if (activeTripIdRef.current === tripId) {
          setIsItineraryLoading(false);
        }
      }
    },
    [router]
  );

  React.useEffect(() => {
    if (!isRealTrip) return;

    let isMounted = true;
    (async () => {
      try {
        const items = await fetchTripItinerary(initialTrip.id);
        if (isMounted && activeTripIdRef.current === initialTrip.id) {
          setSessionItinerary(sortItineraryItems(items));
        }
      } catch (err) {
        if (!isMounted || activeTripIdRef.current !== initialTrip.id) return;
        if (err instanceof ItineraryApiError) {
          if (err.status === 401) {
            router.push(
              `/login?callbackUrl=${encodeURIComponent(
                typeof window !== "undefined"
                  ? window.location.pathname
                  : `/trips/${initialTrip.id}`
              )}`
            );
            return;
          }
          if (err.status === 403) {
            setItineraryError(
              "Bạn không có quyền truy cập lịch trình của chuyến đi này."
            );
            return;
          }
          setItineraryError(err.message || "Không thể tải lịch trình chuyến đi.");
        } else {
          setItineraryError(
            err instanceof Error
              ? err.message
              : "Lỗi kết nối mạng khi tải lịch trình."
          );
        }
      } finally {
        if (isMounted && activeTripIdRef.current === initialTrip.id) {
          setIsItineraryLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [initialTrip.id, isRealTrip, router]);

  const refetchItinerary = React.useCallback(async () => {
    if (!isRealTrip) return;
    setIsItineraryLoading(true);
    setItineraryError(null);
    await loadItinerary(initialTrip.id);
  }, [isRealTrip, initialTrip.id, loadItinerary]);

  const loadMembers = React.useCallback(
    async (tripId: string) => {
      if (!isUuid(tripId)) {
        setIsMembersLoading(false);
        setMembersError(null);
        return;
      }
      try {
        const members = await fetchTripMembers(tripId);
        if (activeTripIdRef.current === tripId) {
          setSessionMembers(members);
          setMembersError(null);
        }
      } catch (err) {
        if (activeTripIdRef.current !== tripId) return;
        if (err instanceof MembersApiError) {
          if (err.status === 401) {
            router.push(
              `/login?callbackUrl=${encodeURIComponent(
                typeof window !== "undefined"
                  ? window.location.pathname
                  : `/trips/${tripId}`
              )}`
            );
            return;
          }
          if (err.status === 403) {
            setMembersError(
              "Bạn không có quyền truy cập danh sách thành viên của chuyến đi này."
            );
            return;
          }
          setMembersError(err.message || "Không thể tải danh sách thành viên.");
        } else {
          setMembersError(
            err instanceof Error
              ? err.message
              : "Lỗi kết nối mạng khi tải danh sách thành viên."
          );
        }
      } finally {
        if (activeTripIdRef.current === tripId) {
          setIsMembersLoading(false);
        }
      }
    },
    [router]
  );

  React.useEffect(() => {
    if (!isRealTrip) return;
    if (initialTrip.members && initialTrip.members.length > 0) return;

    let isMounted = true;
    (async () => {
      try {
        const members = await fetchTripMembers(initialTrip.id);
        if (isMounted && activeTripIdRef.current === initialTrip.id) {
          setSessionMembers(members);
          setMembersError(null);
        }
      } catch (err) {
        if (!isMounted || activeTripIdRef.current !== initialTrip.id) return;
        if (err instanceof MembersApiError) {
          if (err.status === 401) {
            router.push(
              `/login?callbackUrl=${encodeURIComponent(
                typeof window !== "undefined"
                  ? window.location.pathname
                  : `/trips/${initialTrip.id}`
              )}`
            );
            return;
          }
          if (err.status === 403) {
            setMembersError(
              "Bạn không có quyền truy cập danh sách thành viên của chuyến đi này."
            );
            return;
          }
          setMembersError(err.message || "Không thể tải danh sách thành viên.");
        } else {
          setMembersError(
            err instanceof Error
              ? err.message
              : "Lỗi kết nối mạng khi tải danh sách thành viên."
          );
        }
      } finally {
        if (isMounted && activeTripIdRef.current === initialTrip.id) {
          setIsMembersLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [initialTrip.id, initialTrip.members, isRealTrip, router]);

  const refetchMembers = React.useCallback(async () => {
    if (!isRealTrip) return;
    setIsMembersLoading(true);
    setMembersError(null);
    await loadMembers(initialTrip.id);
  }, [isRealTrip, initialTrip.id, loadMembers]);

  const loadClaims = React.useCallback(
    async (tripId: string) => {
      if (!isUuid(tripId) || !isHost) return;
      try {
        const claims = await fetchTripClaimsApi(tripId);
        if (activeTripIdRef.current === tripId) {
          setSessionClaims(claims);
        }
      } catch {
        // UI giữ trạng thái claims hiện có; lỗi chi tiết đã được API chuẩn hóa.
      }
    },
    [isHost]
  );

  React.useEffect(() => {
    if (!isRealTrip || !isHost) return;

    let isMounted = true;
    (async () => {
      try {
        const claims = await fetchTripClaimsApi(initialTrip.id);
        if (isMounted && activeTripIdRef.current === initialTrip.id) {
          setSessionClaims(claims);
        }
      } catch {
        // UI giữ trạng thái claims hiện có; lỗi chi tiết đã được API chuẩn hóa.
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isRealTrip, isHost, initialTrip.id]);

  const loadExpenses = React.useCallback(
    async (tripId: string) => {
      if (!isUuid(tripId)) {
        setIsExpensesLoading(false);
        setExpensesError(null);
        return;
      }
      try {
        const expenses = await fetchTripExpenses(tripId);
        if (activeTripIdRef.current === tripId) {
          setSessionExpenses(expenses);
          setExpensesError(null);
        }
      } catch (err) {
        if (activeTripIdRef.current !== tripId) return;
        if (err instanceof ExpensesApiError) {
          if (err.status === 401) {
            router.push(
              `/login?callbackUrl=${encodeURIComponent(
                typeof window !== "undefined"
                  ? window.location.pathname
                  : `/trips/${tripId}`
              )}`
            );
            return;
          }
          if (err.status === 403) {
            setExpensesError(
              "Bạn không có quyền truy cập chi tiêu của chuyến đi này."
            );
            return;
          }
          if (err.status === 404) {
            setExpensesError("Không tìm thấy chuyến đi.");
            return;
          }
          setExpensesError(err.message || "Không thể tải danh sách chi tiêu.");
        } else {
          setExpensesError(
            err instanceof Error
              ? err.message
              : "Lỗi kết nối mạng khi tải danh sách chi tiêu."
          );
        }
      } finally {
        if (activeTripIdRef.current === tripId) {
          setIsExpensesLoading(false);
        }
      }
    },
    [router]
  );

  React.useEffect(() => {
    if (!isRealTrip) return;

    let isMounted = true;
    (async () => {
      try {
        const expenses = await fetchTripExpenses(initialTrip.id);
        if (isMounted && activeTripIdRef.current === initialTrip.id) {
          setSessionExpenses(expenses);
          setExpensesError(null);
        }
      } catch (err) {
        if (!isMounted || activeTripIdRef.current !== initialTrip.id) return;
        if (err instanceof ExpensesApiError) {
          if (err.status === 401) {
            router.push(
              `/login?callbackUrl=${encodeURIComponent(
                typeof window !== "undefined"
                  ? window.location.pathname
                  : `/trips/${initialTrip.id}`
              )}`
            );
            return;
          }
          if (err.status === 403) {
            setExpensesError(
              "Bạn không có quyền truy cập chi tiêu của chuyến đi này."
            );
            return;
          }
          if (err.status === 404) {
            setExpensesError("Không tìm thấy chuyến đi.");
            return;
          }
          setExpensesError(err.message || "Không thể tải danh sách chi tiêu.");
        } else {
          setExpensesError(
            err instanceof Error
              ? err.message
              : "Lỗi kết nối mạng khi tải danh sách chi tiêu."
          );
        }
      } finally {
        if (isMounted && activeTripIdRef.current === initialTrip.id) {
          setIsExpensesLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [initialTrip.id, isRealTrip, router]);

  const refetchExpenses = React.useCallback(async () => {
    if (!isRealTrip) return;
    setIsExpensesLoading(true);
    setExpensesError(null);
    await loadExpenses(initialTrip.id);
  }, [isRealTrip, initialTrip.id, loadExpenses]);

  const loadSettlement = React.useCallback(
    async (tripId: string) => {
      if (!isUuid(tripId)) {
        setIsSettlementLoading(false);
        setSettlementError(null);
        return;
      }
      try {
        const res = await fetchTripSettlement(tripId);
        if (activeTripIdRef.current === tripId) {
          if (res.settlement && res.settlement.status === "ACTIVE") {
            const domainSettlement = mapApiSettlementToDomain(res.settlement);
            setServerSettlement(domainSettlement);
            setLockedTransfers(domainSettlement.transfers);
          } else {
            setServerSettlement(null);
            setLockedTransfers([]);
          }
          setSettlementError(null);
        }
      } catch (err) {
        if (activeTripIdRef.current !== tripId) return;
        if (err instanceof SettlementApiError) {
          if (err.status === 401) {
            router.push(
              `/login?callbackUrl=${encodeURIComponent(
                typeof window !== "undefined"
                  ? window.location.pathname
                  : `/trips/${tripId}`
              )}`
            );
            return;
          }
          if (err.status === 403) {
            setSettlementError(
              "Bạn không có quyền truy cập quyết toán của chuyến đi này."
            );
            return;
          }
          if (err.status === 404) {
            setSettlementError("Không tìm thấy chuyến đi.");
            return;
          }
          setSettlementError(err.message || "Không thể tải thông tin quyết toán.");
        } else {
          setSettlementError(
            err instanceof Error
              ? err.message
              : "Lỗi kết nối mạng khi tải thông tin quyết toán."
          );
        }
      } finally {
        if (activeTripIdRef.current === tripId) {
          setIsSettlementLoading(false);
        }
      }
    },
    [router]
  );

  React.useEffect(() => {
    if (!isRealTrip) return;

    let isMounted = true;
    (async () => {
      try {
        const res = await fetchTripSettlement(initialTrip.id);
        if (isMounted && activeTripIdRef.current === initialTrip.id) {
          if (res.settlement && res.settlement.status === "ACTIVE") {
            const domainSettlement = mapApiSettlementToDomain(res.settlement);
            setServerSettlement(domainSettlement);
            setLockedTransfers(domainSettlement.transfers);
          } else {
            setServerSettlement(null);
            setLockedTransfers([]);
          }
          setSettlementError(null);
        }
      } catch (err) {
        if (!isMounted || activeTripIdRef.current !== initialTrip.id) return;
        if (err instanceof SettlementApiError) {
          if (err.status === 401) {
            router.push(
              `/login?callbackUrl=${encodeURIComponent(
                typeof window !== "undefined"
                  ? window.location.pathname
                  : `/trips/${initialTrip.id}`
              )}`
            );
            return;
          }
          if (err.status === 403) {
            setSettlementError(
              "Bạn không có quyền truy cập quyết toán của chuyến đi này."
            );
            return;
          }
          setSettlementError(err.message || "Không thể tải thông tin quyết toán.");
        } else {
          setSettlementError(
            err instanceof Error
              ? err.message
              : "Lỗi kết nối mạng khi tải thông tin quyết toán."
          );
        }
      } finally {
        if (isMounted && activeTripIdRef.current === initialTrip.id) {
          setIsSettlementLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [initialTrip.id, isRealTrip, router]);

  const refetchSettlement = React.useCallback(async () => {
    if (!isRealTrip) return;
    setIsSettlementLoading(true);
    setSettlementError(null);
    await loadSettlement(initialTrip.id);
  }, [isRealTrip, initialTrip.id, loadSettlement]);

  const [itineraryAddExpenseTarget, setItineraryAddExpenseTarget] =
    React.useState<ItineraryItem | null>(null);

  // Re-sync state when navigating to another trip
  const prevTripIdRef = React.useRef(initialTrip.id);
  React.useEffect(() => {
    if (prevTripIdRef.current !== initialTrip.id) {
      prevTripIdRef.current = initialTrip.id;
      setCurrentMemberId(initialTrip.currentMemberId);
      setSessionStatus(initialTrip.status);
      setTripInfo({
        name: initialTrip.name,
        destination: initialTrip.destination || "",
        startDate: initialTrip.startDate,
        endDate: initialTrip.endDate,
        budgetAmount: initialTrip.budgetAmount || 0,
      });
      setSessionMembers([...(initialTrip.members || [])]);
      setMembersError(null);
      setIsMembersLoading(isRealTrip);
      setSessionClaims(isRealTrip ? [] : getMockClaimsForTrip(initialTrip.id));
      setSessionInviteCode(initialTrip.inviteCode);
      setSessionExpenses(isRealTrip ? [] : [...(initialTrip.expenses || [])]);
      setExpensesError(null);
      setIsExpensesLoading(isRealTrip);
      setItineraryError(null);
      setIsItineraryLoading(isRealTrip);
      setSessionItinerary(
        isRealTrip
          ? []
          : initialTrip.itineraryItems && initialTrip.itineraryItems.length > 0
          ? [...initialTrip.itineraryItems]
          : getMockItineraryForTrip(initialTrip.id)
      );
      setLockedTransfers([]);
      setServerSettlement(null);
      setSettlementError(null);
      setIsSettlementLoading(isRealTrip);
    }
  }, [initialTrip, isRealTrip]);

  React.useEffect(() => {
    if (sessionToast) {
      const timer = setTimeout(() => {
        setSessionToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [sessionToast]);

  const sessionTotalSpent = React.useMemo(() => {
    return calculateTotalSpent(sessionExpenses);
  }, [sessionExpenses]);

  const memberBalancesResult = React.useMemo(() => {
    return calculateMemberBalances(sessionMembers, sessionExpenses);
  }, [sessionMembers, sessionExpenses]);

  // Preview transfers computed dynamically in ACTIVE state
  const previewTransfers = React.useMemo(() => {
    return generateSettlementTransfers(initialTrip.id, memberBalancesResult.balances);
  }, [initialTrip.id, memberBalancesResult]);

  // If in ACTIVE, use preview transfers. Otherwise use lockedTransfers
  const effectiveTransfers = sessionStatus === "ACTIVE" ? previewTransfers : lockedTransfers;

  const sessionSettlement: Settlement | null = React.useMemo(() => {
    if (isRealTrip) {
      return serverSettlement;
    }
    if (sessionStatus === "ACTIVE") return null;
    return {
      id: `settle-${initialTrip.id}`,
      tripId: initialTrip.id,
      status: "ACTIVE",
      createdByMemberId: currentMemberId,
      createdAt: new Date().toISOString(),
      transfers: effectiveTransfers,
    };
  }, [isRealTrip, serverSettlement, sessionStatus, initialTrip.id, currentMemberId, effectiveTransfers]);

  const sessionTrip: TripDetailData = React.useMemo(() => {
    const recent: TripRecentExpense[] = sessionExpenses.slice(0, 4).map((e) => {
      const payer = sessionMembers.find((m) => m.id === e.paidByMemberId);
      const userShare = e.shares.find((p) => p.memberId === currentMemberId);
      const splitText =
        e.splitMethod === "EQUAL"
          ? `Chia đều (${e.shares.length} người)`
          : getSplitMethodLabel(e.splitMethod);

      return {
        id: e.id,
        title: e.title,
        category: e.category,
        categoryLabel: getExpenseCategoryLabel(e.category),
        paidByName: payer?.name || "Thành viên",
        totalAmount: e.amount,
        userAmount: userShare ? userShare.amount : 0,
        spentAtFormatted: formatExpenseDate(e.spentAt),
        splitMethodText: splitText,
      };
    });

    const planned = tripInfo.budgetAmount || initialTrip.plannedBudget || null;
    const { hasBudget, remainingBudget, isOverBudget, overBudgetAmount } = calculateBudgetStatus(
      planned,
      sessionTotalSpent
    );
    const activeMembersCount = sessionMembers.filter((m) => m.status === "ACTIVE").length;
    const avgSpentPerPerson = calculateAvgSpentPerPerson(
      sessionTotalSpent,
      activeMembersCount > 0 ? activeMembersCount : 1
    );
    const userSpent = calculateUserSpent(sessionExpenses, currentMemberId);

    const detailMembers: TripMemberDetail[] = sessionMembers.map((m) => {
      const memberSpent = sessionExpenses
        .filter((e) => e.paidByMemberId === m.id)
        .reduce((sum, e) => sum + e.amount, 0);
      return {
        ...m,
        spentAmount: memberSpent,
      };
    });

    return {
      ...initialTrip,
      name: tripInfo.name,
      destination: tripInfo.destination,
      startDate: tripInfo.startDate,
      endDate: tripInfo.endDate,
      budgetAmount: tripInfo.budgetAmount,
      status: sessionStatus,
      inviteCode: sessionInviteCode,
      members: detailMembers,
      currentMemberId,
      currentRole,
      totalSpent: sessionTotalSpent,
      hasBudget,
      remainingBudget,
      isOverBudget,
      overBudgetAmount,
      expenseCount: sessionExpenses.length,
      avgSpentPerPerson,
      userSpent,
      expenses: sessionExpenses,
      recentExpenses: recent,
      itineraryItems: sessionItinerary,
    };
  }, [
    initialTrip,
    tripInfo,
    sessionStatus,
    sessionInviteCode,
    sessionMembers,
    sessionExpenses,
    sessionItinerary,
    sessionTotalSpent,
    currentMemberId,
    currentRole,
  ]);

  const handleAddExpense = React.useCallback((newExpense: TripExpense) => {
    setSessionExpenses((prev) => [newExpense, ...prev]);
  }, []);

  const handleSaveExpenseFromModal = React.useCallback(
    async (
      formData: CreateExpenseFormData
    ): Promise<{ success: boolean; message?: string }> => {
      if (sessionStatus !== "ACTIVE") {
        return {
          success: false,
          message: "Không thể thêm chi tiêu khi chuyến đi đã chốt sổ hoặc lưu trữ.",
        };
      }

      if (isRealTrip) {
        try {
          const newExpense = await createExpense(initialTrip.id, formData);
          setSessionExpenses((prev) => [newExpense, ...prev]);

          if (formData.itineraryItemId) {
            setSessionItinerary((prev) =>
              prev.map((item) =>
                item.id === formData.itineraryItemId
                  ? { ...item, expenseId: newExpense.id }
                  : item
              )
            );
          }

          setSessionToast("Đã thêm khoản chi thành công!");
          return { success: true };
        } catch (err) {
          const message =
            err instanceof ExpensesApiError
              ? err.message
              : err instanceof Error
              ? err.message
              : "Không thể lưu khoản chi tiêu.";
          return { success: false, message };
        }
      }

      // Luồng mock slug legacy
      const safeAmount = formData.amount || 0;
      const expenseId = `exp-${Date.now()}`;

      const participantsWithOrder = formData.participantMemberIds.map((id) => {
        const m = sessionMembers.find((member) => member.id === id);
        return { id, joinOrder: m ? m.joinOrder : 0 };
      });

      let shares: ExpenseShare[] = [];

      if (formData.splitMethod === "ITEMIZED" && formData.items && formData.items.length > 0) {
        const itemizedShares = computeItemizedShares(
          safeAmount,
          formData.items,
          formData.surcharge || null,
          participantsWithOrder
        );
        shares = itemizedShares.map((s, idx) => ({
          id: `share-${expenseId}-${idx + 1}`,
          expenseId,
          memberId: s.memberId,
          amount: s.totalAmount,
        }));
      } else {
        shares = computeEqualShares(safeAmount, participantsWithOrder).map(
          (s, idx) => ({
            id: `share-${expenseId}-${idx + 1}`,
            expenseId,
            memberId: s.memberId,
            amount: s.amount,
            hasRemainderExtra: s.hasRemainderExtra,
          })
        );
      }

      const spentAtIso = formatDateInputToIso(formData.spentAtDate, formData.spentAtTime);

      const newExpense: TripExpense = {
        id: expenseId,
        tripId: initialTrip.id,
        title: formData.title,
        category: formData.category,
        amount: safeAmount,
        paidByMemberId: formData.paidByMemberId,
        spentAt: spentAtIso,
        splitMethod: formData.splitMethod || "EQUAL",
        items: formData.items,
        surcharge: formData.surcharge,
        itineraryItemId: formData.itineraryItemId ?? null,
        locationName: formData.locationName,
        note: formData.note,
        receiptImageUrl: formData.receiptImageUrl,
        shares,
        createdAt: new Date().toISOString(),
      };

      handleAddExpense(newExpense);

      if (formData.itineraryItemId) {
        setSessionItinerary((prev) =>
          prev.map((item) =>
            item.id === formData.itineraryItemId
              ? { ...item, expenseId }
              : item
          )
        );
      }

      setSessionToast("Đã thêm khoản chi (dữ liệu demo, chưa được lưu)");
      return { success: true };
    },
    [sessionStatus, isRealTrip, initialTrip.id, sessionMembers, handleAddExpense]
  );

  const handleUpdateTripInfo = React.useCallback(
    async (updates: {
      name: string;
      destination: string;
      startDate: string;
      endDate: string;
      budgetAmount: number;
    }): Promise<{ success: boolean; message?: string }> => {
      if (!isHost) {
        return {
          success: false,
          message: "Chỉ nhóm trưởng (HOST) mới có quyền chỉnh sửa thông tin chuyến đi.",
        };
      }
      if (sessionStatus !== "ACTIVE") {
        return {
          success: false,
          message: "Không thể chỉnh sửa thông tin khi chuyến đi đã chốt sổ hoặc lưu trữ.",
        };
      }

      if (isRealTrip) {
        try {
          const updated = await updateTripApi(initialTrip.id, {
            name: updates.name,
            destination: updates.destination || null,
            startDate: updates.startDate,
            endDate: updates.endDate,
            budgetAmount: updates.budgetAmount > 0 ? updates.budgetAmount : null,
          });

          setTripInfo({
            name: updated.name,
            destination: updated.destination || "",
            startDate: updated.startDate,
            endDate: updated.endDate,
            budgetAmount: updated.budgetAmount || 0,
          });

          if (tripsStore?.updateTrip) {
            tripsStore.updateTrip(initialTrip.id, {
              name: updated.name,
              destination: updated.destination,
              startDate: updated.startDate,
              endDate: updated.endDate,
              budgetAmount: updated.budgetAmount,
            });
          }

          setSessionToast("Đã cập nhật thông tin chuyến đi thành công!");
          return { success: true };
        } catch (err) {
          const message =
            err instanceof TripsApiError || err instanceof Error
              ? err.message
              : "Không thể cập nhật thông tin chuyến đi.";
          return { success: false, message };
        }
      }

      // Luồng mock slug legacy
      setTripInfo(updates);
      if (tripsStore?.updateTrip) {
        tripsStore.updateTrip(initialTrip.id, updates);
      }
      setSessionToast("Đã cập nhật thông tin chuyến đi thành công!");
      return { success: true };
    },
    [isHost, sessionStatus, isRealTrip, initialTrip.id, tripsStore]
  );

  const handleArchiveTrip = React.useCallback(async () => {
    if (!isHost) return;
    if (sessionStatus === "ARCHIVED") return;

    if (isRealTrip) {
      try {
        await archiveTripApi(initialTrip.id);
        setSessionStatus("ARCHIVED");
        setSessionToast("Chuyến đi đã được lưu trữ (ARCHIVED).");
        if (tripsStore?.refetchTrips) {
          tripsStore.refetchTrips();
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Lưu trữ chuyến đi thất bại.";
        setSessionToast(msg);
      }
      return;
    }

    setSessionStatus("ARCHIVED");
    setSessionToast("Chuyến đi đã được lưu trữ (ARCHIVED).");
  }, [isHost, sessionStatus, isRealTrip, initialTrip.id, tripsStore]);

  const handleUpdateExpense = React.useCallback(
    async (
      expenseId: string,
      formData: CreateExpenseFormData
    ): Promise<{ success: boolean; message?: string }> => {
      const existingExpense = sessionExpenses.find((e) => e.id === expenseId);
      if (!existingExpense) {
        return { success: false, message: "Không tìm thấy khoản chi cần sửa." };
      }

      if (!canEditExpense(existingExpense, currentMemberId, isHost, sessionStatus)) {
        return {
          success: false,
          message: "Bạn không có quyền sửa khoản chi này hoặc chuyến đi đã chốt sổ.",
        };
      }

      if (isRealTrip) {
        try {
          const updated = await updateExpense(initialTrip.id, expenseId, formData);
          setSessionExpenses((prev) =>
            prev.map((e) => (e.id === expenseId ? updated : e))
          );

          if (formData.itineraryItemId !== undefined) {
            setSessionItinerary((prev) =>
              prev.map((item) => {
                if (item.id === formData.itineraryItemId) {
                  return { ...item, expenseId: updated.id };
                }
                if (item.expenseId === updated.id && item.id !== formData.itineraryItemId) {
                  return { ...item, expenseId: null };
                }
                return item;
              })
            );
          }

          setSessionToast("Đã cập nhật khoản chi thành công!");
          return { success: true };
        } catch (err) {
          const message =
            err instanceof ExpensesApiError
              ? err.message
              : err instanceof Error
              ? err.message
              : "Không thể cập nhật khoản chi tiêu.";
          return { success: false, message };
        }
      }

      // Luồng mock slug legacy
      const safeAmount = formData.amount || 0;
      const participantsWithOrder = formData.participantMemberIds.map((id) => {
        const m = sessionMembers.find((member) => member.id === id);
        return { id, joinOrder: m ? m.joinOrder : 0 };
      });

      let shares: ExpenseShare[] = [];
      if (formData.splitMethod === "ITEMIZED" && formData.items && formData.items.length > 0) {
        const itemizedShares = computeItemizedShares(
          safeAmount,
          formData.items,
          formData.surcharge || null,
          participantsWithOrder
        );
        shares = itemizedShares.map((s, idx) => ({
          id: `share-${expenseId}-${idx + 1}`,
          expenseId,
          memberId: s.memberId,
          amount: s.totalAmount,
        }));
      } else {
        shares = computeEqualShares(safeAmount, participantsWithOrder).map((s, idx) => ({
          id: `share-${expenseId}-${idx + 1}`,
          expenseId,
          memberId: s.memberId,
          amount: s.amount,
          hasRemainderExtra: s.hasRemainderExtra,
        }));
      }

      const spentAtIso = formatDateInputToIso(formData.spentAtDate, formData.spentAtTime);

      setSessionExpenses((prev) =>
        prev.map((e) =>
          e.id === expenseId
            ? {
                ...e,
                title: formData.title,
                category: formData.category,
                amount: safeAmount,
                paidByMemberId: formData.paidByMemberId,
                spentAt: spentAtIso,
                splitMethod: formData.splitMethod || "EQUAL",
                items: formData.items,
                surcharge: formData.surcharge,
                itineraryItemId:
                  formData.itineraryItemId !== undefined
                    ? formData.itineraryItemId
                    : existingExpense.itineraryItemId,
                locationName: formData.locationName,
                note: formData.note,
                receiptImageUrl: formData.receiptImageUrl,
                shares,
              }
            : e
        )
      );

      setSessionToast("Đã cập nhật khoản chi thành công (dữ liệu demo).");
      return { success: true };
    },
    [sessionExpenses, currentMemberId, isHost, sessionStatus, isRealTrip, initialTrip.id, sessionMembers]
  );

  const handleDeleteExpense = React.useCallback(
    async (expenseId: string): Promise<{ success: boolean; message?: string }> => {
      const existingExpense = sessionExpenses.find((e) => e.id === expenseId);
      if (!existingExpense) {
        return { success: false, message: "Không tìm thấy khoản chi cần xóa." };
      }

      if (!canDeleteExpense(existingExpense, currentMemberId, isHost, sessionStatus)) {
        return {
          success: false,
          message: "Bạn không có quyền xóa khoản chi này hoặc chuyến đi đã chốt sổ.",
        };
      }

      if (isRealTrip) {
        try {
          await deleteExpense(initialTrip.id, expenseId);
          setSessionExpenses((prev) => prev.filter((e) => e.id !== expenseId));

          setSessionItinerary((prev) =>
            prev.map((item) =>
              item.expenseId === expenseId ? { ...item, expenseId: null } : item
            )
          );

          setSessionToast("Đã xóa khoản chi.");
          return { success: true };
        } catch (err) {
          const message =
            err instanceof ExpensesApiError
              ? err.message
              : err instanceof Error
              ? err.message
              : "Không thể xóa khoản chi tiêu.";
          return { success: false, message };
        }
      }

      // Luồng mock slug legacy
      setSessionExpenses((prev) => prev.filter((e) => e.id !== expenseId));

      setSessionItinerary((prev) =>
        prev.map((item) =>
          item.expenseId === expenseId ? { ...item, expenseId: null } : item
        )
      );

      setSessionToast("Đã xóa khoản chi.");
      return { success: true };
    },
    [sessionExpenses, currentMemberId, isHost, sessionStatus, isRealTrip, initialTrip.id]
  );

  // Settlement Actions
  const handleLockSettlement = React.useCallback(async (): Promise<{
    success: boolean;
    message?: string;
  }> => {
    if (isRealTrip) {
      setIsSettlementMutating(true);
      try {
        const res = await createTripSettlement(initialTrip.id);
        const domainSettlement = mapApiSettlementToDomain(res.settlement);
        setServerSettlement(domainSettlement);
        setLockedTransfers(domainSettlement.transfers);
        if (domainSettlement.transfers.length === 0) {
          setSessionStatus("COMPLETED");
          setSessionToast(
            "Đã chốt sổ công nợ! Chuyến đi đã tất toán 100% (không có công nợ tồn đọng)."
          );
        } else {
          setSessionStatus("SETTLING");
          setSessionToast(
            "Đã chốt sổ công nợ! Chuyến đi chuyển sang trạng thái Quyết toán, đã khóa thêm chi tiêu mới."
          );
        }
        return { success: true };
      } catch (err) {
        await loadSettlement(initialTrip.id);
        const message =
          err instanceof SettlementApiError
            ? err.message
            : "Không thể chốt sổ công nợ. Vui lòng thử lại sau.";
        setSessionToast(message);
        return { success: false, message };
      } finally {
        setIsSettlementMutating(false);
      }
    }

    // Mock trip logic
    const res = calculateMemberBalances(initialTrip.members, sessionExpenses);
    const transfers = generateSettlementTransfers(initialTrip.id, res.balances);
    setLockedTransfers(transfers);
    setSessionStatus("SETTLING");
    setSessionToast(
      "Đã chốt sổ công nợ! Chuyến đi chuyển sang trạng thái Quyết toán, đã khóa thêm chi tiêu mới."
    );
    return { success: true };
  }, [isRealTrip, initialTrip.id, initialTrip.members, sessionExpenses, loadSettlement]);

  const handleReopenSettlement = React.useCallback(async (): Promise<{
    success: boolean;
    message?: string;
  }> => {
    if (isRealTrip) {
      setIsSettlementMutating(true);
      try {
        await reopenTripSettlement(initialTrip.id);
        setServerSettlement(null);
        setLockedTransfers([]);
        setSessionStatus("ACTIVE");
        setSessionToast(
          "Đã mở lại sổ công nợ! Chuyến đi trở lại trạng thái Đang diễn ra."
        );
        return { success: true };
      } catch (err) {
        await loadSettlement(initialTrip.id);
        const message =
          err instanceof SettlementApiError
            ? err.message
            : "Không thể mở lại sổ công nợ.";
        setSessionToast(message);
        return { success: false, message };
      } finally {
        setIsSettlementMutating(false);
      }
    }

    if (!canReopenSettlement(lockedTransfers)) {
      return {
        success: false,
        message:
          "Không thể mở lại sổ vì đã có giao dịch được thanh toán hoặc xác nhận hoàn tất.",
      };
    }
    setSessionStatus("ACTIVE");
    setLockedTransfers([]);
    setSessionToast("Đã mở lại sổ công nợ! Chuyến đi trở lại trạng thái Đang diễn ra.");
    return { success: true };
  }, [isRealTrip, initialTrip.id, lockedTransfers, loadSettlement]);

  const handleMarkTransferPaid = React.useCallback(
    async (
      transferId: string,
      paymentMethod: PaymentMethod = "BANK_TRANSFER",
      note?: string
    ): Promise<{ success: boolean; message?: string }> => {
      if (isRealTrip) {
        setIsSettlementMutating(true);
        try {
          const res = await apiMarkTransferPaid(initialTrip.id, transferId, {
            paymentMethod,
          });
          const domainTransfer = mapApiTransferToDomain(res);
          setLockedTransfers((prev) =>
            prev.map((t) => (t.id === transferId ? domainTransfer : t))
          );
          setSessionToast(
            "Đã đánh dấu đã thanh toán! Đang chờ người nhận xác nhận tiền về."
          );
          return { success: true };
        } catch (err) {
          await loadSettlement(initialTrip.id);
          const message =
            err instanceof SettlementApiError
              ? err.message
              : "Không thể đánh dấu thanh toán.";
          setSessionToast(message);
          return { success: false, message };
        } finally {
          setIsSettlementMutating(false);
        }
      }

      setLockedTransfers((prev) =>
        prev.map((t) => {
          if (t.id !== transferId) return t;
          return {
            ...t,
            status: "PAID",
            paymentMethod,
            paidAt: new Date().toISOString(),
            paidMarkedByMemberId: currentMemberId,
            paymentProofNote: note,
          };
        })
      );
      setSessionToast(
        "Đã đánh dấu đã thanh toán! Đang chờ người nhận xác nhận tiền về."
      );
      return { success: true };
    },
    [isRealTrip, initialTrip.id, currentMemberId, loadSettlement]
  );

  const handleConfirmTransferCompleted = React.useCallback(
    async (transferId: string): Promise<{ success: boolean; message?: string }> => {
      if (isRealTrip) {
        setIsSettlementMutating(true);
        try {
          const res = await apiConfirmTransferCompleted(initialTrip.id, transferId);
          const domainTransfer = mapApiTransferToDomain(res);
          let allCompleted = false;
          setLockedTransfers((prev) => {
            const next = prev.map((t) =>
              t.id === transferId ? domainTransfer : t
            );
            allCompleted = next.length > 0 && next.every((t) => t.status === "COMPLETED");
            return next;
          });

          if (allCompleted) {
            setSessionStatus("COMPLETED");
            setSessionToast(
              "Tất cả công nợ đã được thanh toán hoàn tất! Chuyến đi được đánh dấu Hoàn thành."
            );
          } else {
            setSessionToast("Đã xác nhận nhận tiền thành công!");
          }
          return { success: true };
        } catch (err) {
          await loadSettlement(initialTrip.id);
          const message =
            err instanceof SettlementApiError
              ? err.message
              : "Không thể xác nhận nhận tiền.";
          setSessionToast(message);
          return { success: false, message };
        } finally {
          setIsSettlementMutating(false);
        }
      }

      setLockedTransfers((prev) => {
        const next = prev.map((t) => {
          if (t.id !== transferId) return t;
          return {
            ...t,
            status: "COMPLETED" as const,
            completedAt: new Date().toISOString(),
            completedByMemberId: currentMemberId,
          };
        });

        if (isSettlementFullyCompleted(next)) {
          setSessionStatus("COMPLETED");
          setSessionToast(
            "Tất cả công nợ đã được thanh toán hoàn tất! Chuyến đi được đánh dấu Hoàn thành."
          );
        } else {
          setSessionToast("Đã xác nhận nhận tiền thành công!");
        }

        return next;
      });
      return { success: true };
    },
    [isRealTrip, initialTrip.id, currentMemberId, loadSettlement]
  );

  // Itinerary Actions
  const handleAddItineraryItem = React.useCallback(
    async (
      formData: CreateItineraryItemFormData
    ): Promise<{ success: boolean; message?: string }> => {
      const allowed = canAddItineraryItem(
        sessionStatus,
        currentMember?.status || "ACTIVE"
      );
      if (!allowed) {
        return {
          success: false,
          message:
            sessionStatus !== "ACTIVE"
              ? "Không thể thêm địa điểm khi chuyến đi đã chốt sổ hoặc kết thúc."
              : "Thành viên không còn hoạt động trong chuyến đi.",
        };
      }
      const valResult = validateItineraryItemForm(
        formData,
        initialTrip.startDate,
        initialTrip.endDate
      );
      if (!valResult.isValid) {
        const firstErr = Object.values(valResult.errors)[0];
        return { success: false, message: firstErr || "Dữ liệu không hợp lệ" };
      }

      if (isRealTrip) {
        try {
          const created = await createItineraryItem(initialTrip.id, formData);
          setSessionItinerary((prev) => sortItineraryItems([...prev, created]));
          setSessionToast("Đã thêm địa điểm vào lịch trình!");
          return { success: true };
        } catch (err) {
          const message =
            err instanceof ItineraryApiError
              ? err.message
              : err instanceof Error
              ? err.message
              : "Không thể thêm địa điểm vào lịch trình.";
          return { success: false, message };
        }
      }

      const sameDayCount = sessionItinerary.filter(
        (it) => it.dayDate === formData.dayDate
      ).length;

      const newItem: ItineraryItem = {
        id: `itinerary-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        tripId: initialTrip.id,
        dayDate: formData.dayDate,
        sortOrder: sameDayCount + 1,
        placeName: formData.placeName.trim(),
        address: formData.address?.trim() || null,
        startTime: formData.startTime,
        endTime: formData.endTime?.trim() || null,
        note: formData.note?.trim() || null,
        createdByMemberId: currentMemberId,
        expenseId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setSessionItinerary((prev) => sortItineraryItems([...prev, newItem]));
      setSessionToast("Đã thêm địa điểm vào lịch trình!");
      return { success: true };
    },
    [
      sessionStatus,
      currentMember?.status,
      initialTrip.startDate,
      initialTrip.endDate,
      initialTrip.id,
      isRealTrip,
      sessionItinerary,
      currentMemberId,
    ]
  );

  const handleUpdateItineraryItem = React.useCallback(
    async (
      id: string,
      formData: CreateItineraryItemFormData
    ): Promise<{ success: boolean; message?: string }> => {
      const target = sessionItinerary.find((it) => it.id === id);
      if (!target) {
        return { success: false, message: "Không tìm thấy địa điểm" };
      }
      const allowed = canEditItineraryItem(
        target,
        currentMemberId,
        isHost,
        sessionStatus
      );
      if (!allowed) {
        return {
          success: false,
          message:
            sessionStatus !== "ACTIVE"
              ? "Không thể sửa địa điểm khi chuyến đi đã chốt sổ hoặc kết thúc."
              : "Chỉ Trưởng nhóm hoặc người tạo địa điểm mới có quyền chỉnh sửa.",
        };
      }
      const valResult = validateItineraryItemForm(
        formData,
        initialTrip.startDate,
        initialTrip.endDate
      );
      if (!valResult.isValid) {
        const firstErr = Object.values(valResult.errors)[0];
        return { success: false, message: firstErr || "Dữ liệu không hợp lệ" };
      }

      if (isRealTrip) {
        try {
          const updated = await updateItineraryItem(initialTrip.id, id, formData);
          setSessionItinerary((prev) =>
            sortItineraryItems(
              prev.map((item) => (item.id === id ? updated : item))
            )
          );
          setSessionToast("Đã cập nhật địa điểm!");
          return { success: true };
        } catch (err) {
          const message =
            err instanceof ItineraryApiError
              ? err.message
              : err instanceof Error
              ? err.message
              : "Không thể cập nhật địa điểm.";
          return { success: false, message };
        }
      }

      setSessionItinerary((prev) =>
        sortItineraryItems(
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  dayDate: formData.dayDate,
                  placeName: formData.placeName.trim(),
                  address: formData.address?.trim() || null,
                  startTime: formData.startTime,
                  endTime: formData.endTime?.trim() || null,
                  note: formData.note?.trim() || null,
                  updatedAt: new Date().toISOString(),
                }
              : item
          )
        )
      );
      setSessionToast("Đã cập nhật địa điểm!");
      return { success: true };
    },
    [
      sessionItinerary,
      currentMemberId,
      isHost,
      sessionStatus,
      initialTrip.startDate,
      initialTrip.endDate,
      initialTrip.id,
      isRealTrip,
    ]
  );

  const handleDeleteItineraryItem = React.useCallback(
    async (id: string): Promise<{ success: boolean; message?: string }> => {
      const target = sessionItinerary.find((it) => it.id === id);
      if (!target) {
        return { success: false, message: "Không tìm thấy địa điểm" };
      }
      const allowed = canDeleteItineraryItem(
        target,
        currentMemberId,
        isHost,
        sessionStatus
      );
      if (!allowed) {
        return {
          success: false,
          message:
            sessionStatus !== "ACTIVE"
              ? "Không thể xóa địa điểm khi chuyến đi đã chốt sổ hoặc kết thúc."
              : "Chỉ Trưởng nhóm hoặc người tạo địa điểm mới có quyền xóa.",
        };
      }

      if (isRealTrip) {
        try {
          await deleteItineraryItem(initialTrip.id, id);
          if (activeTripIdRef.current === initialTrip.id) {
            setSessionItinerary((prev) => prev.filter((it) => it.id !== id));
            setSessionExpenses((prev) =>
              prev.map((e) =>
                e.itineraryItemId === id
                  ? { ...e, itineraryItemId: null, locationName: undefined }
                  : e
              )
            );
            setSessionToast("Đã xóa địa điểm khỏi lịch trình.");
          }
          return { success: true };
        } catch (err) {
          const message =
            err instanceof ItineraryApiError
              ? err.message
              : err instanceof Error
              ? err.message
              : "Không thể xóa địa điểm.";
          return { success: false, message };
        }
      }

      setSessionItinerary((prev) => prev.filter((it) => it.id !== id));
      setSessionExpenses((prev) =>
        prev.map((e) =>
          e.itineraryItemId === id
            ? { ...e, itineraryItemId: null, locationName: undefined }
            : e
        )
      );
      setSessionToast("Đã xóa địa điểm khỏi lịch trình.");
      return { success: true };
    },
    [
      sessionItinerary,
      currentMemberId,
      isHost,
      sessionStatus,
      initialTrip.id,
      isRealTrip,
    ]
  );

  const handleOpenAddExpenseForItinerary = React.useCallback((item: ItineraryItem) => {
    setItineraryAddExpenseTarget(item);
  }, []);

  const handleAddGuestMember = React.useCallback(
    async (
      formData: CreateGuestMemberFormData
    ): Promise<{ success: boolean; message?: string }> => {
      const permission = canAddGuestMember(sessionStatus, isHost);
      if (!permission.allowed) {
        return { success: false, message: permission.reason };
      }

      const validation = validateGuestMemberForm(formData, sessionMembers);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        return { success: false, message: firstError };
      }

      if (isRealTrip) {
        try {
          const created = await createGuestMember(initialTrip.id, {
            displayName: formData.displayName,
          });
          setSessionMembers((prev) => [...prev, created]);
          if (tripsStore?.updateTrip) {
            tripsStore.updateTrip(initialTrip.id, {
              members: [...sessionMembers, created],
            });
          }
          setSessionToast(
            `Đã thêm thành viên "${created.name}" vào chuyến đi (chưa có tài khoản).`
          );
          return { success: true };
        } catch (err) {
          const message =
            err instanceof MembersApiError
              ? err.message
              : err instanceof Error
              ? err.message
              : "Không thể thêm thành viên chưa có tài khoản.";
          return { success: false, message };
        }
      }

      const nextJoinOrder =
        sessionMembers.length > 0
          ? Math.max(...sessionMembers.map((m) => m.joinOrder)) + 1
          : 1;

      const newGuest: TripMember = {
        id: `mem-guest-${Date.now()}`,
        name: formData.displayName.trim(),
        role: "MEMBER",
        status: "ACTIVE",
        joinOrder: nextJoinOrder,
        isNoAccount: true,
        note: formData.note?.trim() || undefined,
        spentAmount: 0,
      };

      setSessionMembers((prev) => [...prev, newGuest]);
      setSessionToast(
        `Đã thêm thành viên "${newGuest.name}" vào chuyến đi (chưa có tài khoản).`
      );
      return { success: true };
    },
    [sessionStatus, isHost, sessionMembers, isRealTrip, initialTrip.id, tripsStore]
  );

  const handleEditGuestMember = React.useCallback(
    async (
      id: string,
      formData: EditGuestMemberFormData
    ): Promise<{ success: boolean; message?: string }> => {
      const target = sessionMembers.find((m) => m.id === id);
      if (!target) {
        return { success: false, message: "Không tìm thấy thành viên cần sửa." };
      }

      const permission = canEditGuestMember(target, sessionStatus, isHost);
      if (!permission.allowed) {
        return { success: false, message: permission.reason };
      }

      const validation = validateGuestMemberForm(formData, sessionMembers, id);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        return { success: false, message: firstError };
      }

      if (isRealTrip) {
        try {
          const updated = await updateGuestMember(initialTrip.id, id, {
            displayName: formData.displayName,
          });
          setSessionMembers((prev) =>
            prev.map((m) => (m.id === id ? { ...m, name: updated.name } : m))
          );
          if (tripsStore?.updateTrip) {
            tripsStore.updateTrip(initialTrip.id, {
              members: sessionMembers.map((m) =>
                m.id === id ? { ...m, name: updated.name } : m
              ),
            });
          }
          setSessionToast(`Đã cập nhật thông tin thành viên "${updated.name}".`);
          return { success: true };
        } catch (err) {
          const message =
            err instanceof MembersApiError
              ? err.message
              : err instanceof Error
              ? err.message
              : "Không thể cập nhật thành viên.";
          return { success: false, message };
        }
      }

      setSessionMembers((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                name: formData.displayName.trim(),
                note: formData.note?.trim() || undefined,
              }
            : m
        )
      );
      setSessionToast(`Đã cập nhật thông tin thành viên "${formData.displayName.trim()}".`);
      return { success: true };
    },
    [sessionMembers, sessionStatus, isHost, isRealTrip, initialTrip.id, tripsStore]
  );

  const handleRemoveMember = React.useCallback(
    async (id: string): Promise<{ success: boolean; message?: string }> => {
      const target = sessionMembers.find((m) => m.id === id);
      if (!target) {
        return { success: false, message: "Không tìm thấy thành viên cần xóa." };
      }

      const memberBalance = memberBalancesResult.balances.find((b) => b.memberId === id);
      const net = memberBalance ? memberBalance.netAmount : 0;

      // Kiểm tra xem thành viên có lịch sử tài chính không
      const hasPaidExpenses = sessionExpenses.some((e) => e.paidByMemberId === id);
      const hasShares = sessionExpenses.some((e) =>
        e.shares.some((s) => s.memberId === id)
      );
      const hasFinancialHistory = hasPaidExpenses || hasShares || (target.spentAmount ?? 0) > 0;

      const permission = canRemoveMember(
        target,
        net,
        sessionStatus,
        isHost,
        hasFinancialHistory
      );
      if (!permission.allowed) {
        return { success: false, message: permission.reason };
      }

      if (isRealTrip) {
        try {
          const result = await deleteTripMember(initialTrip.id, id);
          if (result.type === "SOFT_DELETE") {
            setSessionMembers((prev) =>
              prev.map((m) => (m.id === id ? { ...m, status: "LEFT" as const } : m))
            );
            setSessionToast(
              `Thành viên "${target.name}" đã được chuyển sang trạng thái Đã rời nhóm (bảo toàn lịch sử chi tiêu).`
            );
          } else {
            setSessionMembers((prev) => prev.filter((m) => m.id !== id));
            setSessionToast(`Đã xóa thành viên "${target.name}" khỏi chuyến đi.`);
          }
          if (tripsStore?.updateTrip) {
            tripsStore.updateTrip(initialTrip.id, {
              members:
                result.type === "SOFT_DELETE"
                  ? sessionMembers.map((m) =>
                      m.id === id ? { ...m, status: "LEFT" as const } : m
                    )
                  : sessionMembers.filter((m) => m.id !== id),
            });
          }
          return { success: true };
        } catch (err) {
          const message =
            err instanceof MembersApiError
              ? err.message
              : err instanceof Error
              ? err.message
              : "Không thể xóa thành viên.";
          return { success: false, message };
        }
      }

      if (permission.isSoftDelete) {
        // Chuyển status = 'LEFT' để bảo toàn lịch sử giao dịch (Rule R6)
        setSessionMembers((prev) =>
          prev.map((m) => (m.id === id ? { ...m, status: "LEFT" as const } : m))
        );
        setSessionToast(
          `Thành viên "${target.name}" đã được chuyển sang trạng thái Đã rời nhóm (bảo toàn lịch sử chi tiêu).`
        );
      } else {
        // Xóa hoàn toàn vì chưa có giao dịch nào
        setSessionMembers((prev) => prev.filter((m) => m.id !== id));
        setSessionToast(`Đã xóa thành viên "${target.name}" khỏi chuyến đi.`);
      }

      return { success: true };
    },
    [
      sessionMembers,
      memberBalancesResult,
      sessionExpenses,
      sessionStatus,
      isHost,
      isRealTrip,
      initialTrip.id,
      tripsStore,
    ]
  );

  const handleLeaveTrip = React.useCallback(
    async (id: string): Promise<{ success: boolean; message?: string }> => {
      const target = sessionMembers.find((m) => m.id === id);
      if (!target) {
        return { success: false, message: "Không tìm thấy thành viên." };
      }

      const memberBalance = memberBalancesResult.balances.find((b) => b.memberId === id);
      const net = memberBalance ? memberBalance.netAmount : 0;

      const permission = canLeaveTrip(target, net, sessionStatus);
      if (!permission.allowed) {
        return { success: false, message: permission.reason };
      }

      if (isRealTrip) {
        try {
          const result = await deleteTripMember(initialTrip.id, id);
          if (result.type === "SOFT_DELETE") {
            setSessionMembers((prev) =>
              prev.map((m) => (m.id === id ? { ...m, status: "LEFT" as const } : m))
            );
          } else {
            setSessionMembers((prev) => prev.filter((m) => m.id !== id));
          }
          setSessionToast(`Bạn đã rời chuyến đi "${sessionTrip.name}".`);
          return { success: true };
        } catch (err) {
          const message =
            err instanceof MembersApiError
              ? err.message
              : err instanceof Error
              ? err.message
              : "Không thể rời chuyến đi.";
          return { success: false, message };
        }
      }

      // Thành viên rời chuyến -> chuyển status = 'LEFT'
      setSessionMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "LEFT" as const } : m))
      );
      setSessionToast(`Bạn đã rời chuyến đi "${sessionTrip.name}".`);
      return { success: true };
    },
    [sessionMembers, memberBalancesResult, sessionStatus, isRealTrip, initialTrip.id, sessionTrip.name]
  );

  const handleApproveClaim = React.useCallback(
    async (claimId: string) => {
      if (isRealTrip) {
        try {
          const res = await decideClaimApi(initialTrip.id, claimId, "APPROVE");
          await Promise.all([
            refetchMembers(),
            loadClaims(initialTrip.id),
          ]);
          setSessionToast(res.message || "Đã duyệt liên kết tài khoản thành công.");
          return { success: true };
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Duyệt yêu cầu nhận diện thất bại.";
          setSessionToast(msg);
          return { success: false, message: msg };
        }
      }

      const claim = sessionClaims.find((c) => c.id === claimId);
      if (!claim) {
        return { success: false, message: "Không tìm thấy yêu cầu nhận diện." };
      }

      const placeholder = sessionMembers.find((m) => m.id === claim.placeholderMemberId);
      if (!placeholder) {
        return { success: false, message: "Không tìm thấy vị trí thành viên tương ứng." };
      }

      const permission = canDecideClaim(isHost, claim, placeholder, sessionStatus);
      if (!permission.allowed) {
        return { success: false, message: permission.reason };
      }

      // 1. Gán user_id vào dòng trip_members tương ứng, chuyển isNoAccount = false, xóa bank_* (Rule R13)
      setSessionMembers((prev) =>
        prev.map((m) =>
          m.id === claim.placeholderMemberId
            ? {
                ...m,
                userId: claim.userId,
                email: claim.userEmail,
                isNoAccount: false,
                bankBin: null,
                bankAccountNo: null,
                bankAccountName: null,
              }
            : m
        )
      );

      // 2. Cập nhật claim status = 'APPROVED'
      // Tự động chuyển các yêu cầu PENDING khác của cùng placeholder sang 'REJECTED' (Rule R20)
      setSessionClaims((prev) =>
        prev.map((c) => {
          if (c.id === claimId) {
            return {
              ...c,
              status: "APPROVED" as const,
              decidedAt: new Date().toISOString(),
              decidedByMemberId: currentMemberId,
            };
          }
          if (c.placeholderMemberId === claim.placeholderMemberId && c.status === "PENDING") {
            return {
              ...c,
              status: "REJECTED" as const,
              decidedAt: new Date().toISOString(),
              decidedByMemberId: currentMemberId,
            };
          }
          return c;
        })
      );

      setSessionToast(
        `Đã duyệt liên kết tài khoản cho "${claim.userName}" với vị trí "${placeholder.name}" thành công.`
      );
      return { success: true };
    },
    [
      isRealTrip,
      initialTrip.id,
      refetchMembers,
      loadClaims,
      sessionClaims,
      sessionMembers,
      isHost,
      sessionStatus,
      currentMemberId,
    ]
  );

  const handleRejectClaim = React.useCallback(
    async (claimId: string) => {
      if (isRealTrip) {
        try {
          const res = await decideClaimApi(initialTrip.id, claimId, "REJECT");
          await loadClaims(initialTrip.id);
          setSessionToast(res.message || "Đã từ chối yêu cầu liên kết.");
          return { success: true };
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Từ chối yêu cầu nhận diện thất bại.";
          setSessionToast(msg);
          return { success: false, message: msg };
        }
      }

      const claim = sessionClaims.find((c) => c.id === claimId);
      if (!claim) {
        return { success: false, message: "Không tìm thấy yêu cầu nhận diện." };
      }

      const placeholder = sessionMembers.find((m) => m.id === claim.placeholderMemberId);
      if (!placeholder) {
        return { success: false, message: "Không tìm thấy vị trí thành viên tương ứng." };
      }

      const permission = canDecideClaim(isHost, claim, placeholder, sessionStatus);
      if (!permission.allowed) {
        return { success: false, message: permission.reason };
      }

      setSessionClaims((prev) =>
        prev.map((c) =>
          c.id === claimId
            ? {
                ...c,
                status: "REJECTED" as const,
                decidedAt: new Date().toISOString(),
                decidedByMemberId: currentMemberId,
              }
            : c
        )
      );

      setSessionToast(`Đã từ chối yêu cầu liên kết của "${claim.userName}".`);
      return { success: true };
    },
    [
      isRealTrip,
      initialTrip.id,
      loadClaims,
      sessionClaims,
      sessionMembers,
      isHost,
      sessionStatus,
      currentMemberId,
    ]
  );

  const handleResetInviteCode = React.useCallback(async () => {
    if (!isHost) {
      return { success: false, message: "Chỉ Trưởng nhóm mới có quyền đổi mã mời." };
    }
    if (sessionStatus !== "ACTIVE") {
      return { success: false, message: "Chỉ có thể đổi mã mời khi chuyến đi đang lên kế hoạch." };
    }

    if (isRealTrip) {
      try {
        const res = await rotateInviteCodeApi(initialTrip.id);
        setSessionInviteCode(res.inviteCode);
        setSessionToast(`Đã đổi mã mời mới: ${res.inviteCode}. Mã mời cũ đã bị vô hiệu hóa.`);
        return { success: true, code: res.inviteCode };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Đổi mã mời thất bại.";
        setSessionToast(msg);
        return { success: false, message: msg };
      }
    }

    // Tạo mã mời mới tuân thủ Rule R14 (10-12 ký tự chữ/số + 1 dấu gạch nối) cho mock
    const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCode = `DL3N2D-${randSuffix}99`;
    setSessionInviteCode(newCode);
    setSessionToast(`Đã đổi mã mời mới: ${newCode}. Mã mời cũ đã bị vô hiệu hóa.`);
    return { success: true, code: newCode };
  }, [isHost, sessionStatus, isRealTrip, initialTrip.id]);

  return (
    <TripSessionContext.Provider
      value={{
        trip: initialTrip,
        sessionTrip,
        sessionExpenses,
        isExpensesLoading,
        expensesError,
        refetchExpenses,
        sessionItinerary,
        isItineraryLoading,
        itineraryError,
        refetchItinerary,
        sessionMembers,
        isMembersLoading,
        membersError,
        refetchMembers,
        sessionClaims,
        sessionInviteCode,
        sessionStatus,
        sessionTransfers: effectiveTransfers,
        sessionSettlement,
        isSettlementLoading,
        settlementError,
        isSettlementMutating,
        refetchSettlement,
        currentMemberId,
        setCurrentMemberId,
        isHost,
        currentRole,
        isOverviewAddModalOpen,
        setIsOverviewAddModalOpen,
        handleAddExpense,
        handleSaveExpenseFromModal,
        handleUpdateExpense,
        handleDeleteExpense,
        handleUpdateTripInfo,
        handleArchiveTrip,
        handleAddItineraryItem,
        handleUpdateItineraryItem,
        handleDeleteItineraryItem,
        handleOpenAddExpenseForItinerary,
        handleAddGuestMember,
        handleEditGuestMember,
        handleRemoveMember,
        handleLeaveTrip,
        handleApproveClaim,
        handleRejectClaim,
        handleResetInviteCode,
        handleLockSettlement,
        handleReopenSettlement,
        handleMarkTransferPaid,
        handleConfirmTransferCompleted,
        sessionToast,
        setSessionToast,
      }}
    >
      {children}

      {/* Global Quick Add Expense Modal from Overview */}
      <TripExpenseFormModal
        isOpen={isOverviewAddModalOpen}
        onClose={() => setIsOverviewAddModalOpen(false)}
        trip={sessionTrip}
        currentUserMemberId={currentMemberId}
        isHost={isHost}
        onSaveExpense={handleSaveExpenseFromModal}
      />

      {/* Add Expense Modal triggered from an Itinerary item */}
      {itineraryAddExpenseTarget && (
        <TripExpenseFormModal
          isOpen={!!itineraryAddExpenseTarget}
          onClose={() => setItineraryAddExpenseTarget(null)}
          trip={sessionTrip}
          currentUserMemberId={currentMemberId}
          isHost={isHost}
          initialLocationName={itineraryAddExpenseTarget.placeName}
          onSaveExpense={async (formData) => {
            const res = await handleSaveExpenseFromModal({
              ...formData,
              itineraryItemId: itineraryAddExpenseTarget.id,
            });
            if (res && typeof res === "object" && !res.success) {
              return res;
            }
            setItineraryAddExpenseTarget(null);
            return res;
          }}
        />
      )}
    </TripSessionContext.Provider>
  );
}
