"use client";

import * as React from "react";
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
import {
  validateGuestMemberForm,
  canAddGuestMember,
  canEditGuestMember,
  canRemoveMember,
  canLeaveTrip,
  canDecideClaim,
} from "@/lib/members/validation";

interface TripSessionContextValue {
  trip: TripDetailData;
  sessionTrip: TripDetailData;
  sessionExpenses: TripExpense[];
  sessionItinerary: ItineraryItem[];
  sessionMembers: TripMember[];
  sessionClaims: MemberClaim[];
  sessionInviteCode: string;
  sessionStatus: TripStatus;
  sessionTransfers: SettlementTransfer[];
  sessionSettlement: Settlement | null;
  currentMemberId: string;
  setCurrentMemberId: (id: string) => void;
  isHost: boolean;
  isOverviewAddModalOpen: boolean;
  setIsOverviewAddModalOpen: (open: boolean) => void;
  handleAddExpense: (newExpense: TripExpense) => void;
  handleSaveExpenseFromModal: (formData: CreateExpenseFormData) => void;
  handleAddItineraryItem: (
    formData: CreateItineraryItemFormData
  ) => { success: boolean; message?: string };
  handleUpdateItineraryItem: (
    id: string,
    formData: CreateItineraryItemFormData
  ) => { success: boolean; message?: string };
  handleDeleteItineraryItem: (id: string) => { success: boolean; message?: string };
  handleOpenAddExpenseForItinerary: (item: ItineraryItem) => void;
  handleAddGuestMember: (
    formData: CreateGuestMemberFormData
  ) => { success: boolean; message?: string };
  handleEditGuestMember: (
    id: string,
    formData: EditGuestMemberFormData
  ) => { success: boolean; message?: string };
  handleRemoveMember: (id: string) => { success: boolean; message?: string };
  handleLeaveTrip: (id: string) => { success: boolean; message?: string };
  handleApproveClaim: (claimId: string) => { success: boolean; message?: string };
  handleRejectClaim: (claimId: string) => { success: boolean; message?: string };
  handleResetInviteCode: () => { success: boolean; code?: string; message?: string };
  handleLockSettlement: () => void;
  handleReopenSettlement: () => { success: boolean; message?: string };
  handleMarkTransferPaid: (
    transferId: string,
    paymentMethod?: PaymentMethod,
    note?: string
  ) => void;
  handleConfirmTransferCompleted: (transferId: string) => void;
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

interface TripSessionProviderProps {
  initialTrip: TripDetailData;
  children: React.ReactNode;
}

export function TripSessionProvider({ initialTrip, children }: TripSessionProviderProps) {
  const [currentMemberId, setCurrentMemberId] = React.useState<string>(
    initialTrip.currentMemberId
  );
  const [sessionStatus, setSessionStatus] = React.useState<TripStatus>(
    initialTrip.status
  );

  const [sessionMembers, setSessionMembers] = React.useState<TripMember[]>(() => {
    return [...(initialTrip.members || [])];
  });
  const [sessionClaims, setSessionClaims] = React.useState<MemberClaim[]>(() => {
    return getMockClaimsForTrip(initialTrip.id);
  });
  const [sessionInviteCode, setSessionInviteCode] = React.useState<string>(
    initialTrip.inviteCode
  );

  const currentMember = sessionMembers.find((m) => m.id === currentMemberId);
  const isHost = currentMember?.role === "HOST" || !!currentMember?.isHost;

  const [sessionExpenses, setSessionExpenses] = React.useState<TripExpense[]>(() => {
    return [...(initialTrip.expenses || [])];
  });

  const [lockedTransfers, setLockedTransfers] = React.useState<SettlementTransfer[]>([]);
  const [isOverviewAddModalOpen, setIsOverviewAddModalOpen] = React.useState(false);
  const [sessionToast, setSessionToast] = React.useState<string | null>(null);

  const [sessionItinerary, setSessionItinerary] = React.useState<ItineraryItem[]>(() => {
    if (initialTrip.itineraryItems && initialTrip.itineraryItems.length > 0) {
      return [...initialTrip.itineraryItems];
    }
    return getMockItineraryForTrip(initialTrip.id);
  });
  const [itineraryAddExpenseTarget, setItineraryAddExpenseTarget] =
    React.useState<ItineraryItem | null>(null);

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
    if (sessionStatus === "ACTIVE") return null;
    return {
      id: `settle-${initialTrip.id}`,
      tripId: initialTrip.id,
      status: "ACTIVE",
      createdByMemberId: currentMemberId,
      createdAt: new Date().toISOString(),
      transfers: effectiveTransfers,
    };
  }, [sessionStatus, initialTrip.id, currentMemberId, effectiveTransfers]);

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

    const planned = initialTrip.plannedBudget ?? initialTrip.budgetAmount ?? null;
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
      status: sessionStatus,
      inviteCode: sessionInviteCode,
      members: detailMembers,
      currentMemberId,
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
    sessionStatus,
    sessionInviteCode,
    sessionMembers,
    sessionExpenses,
    sessionItinerary,
    sessionTotalSpent,
    currentMemberId,
  ]);

  const handleAddExpense = React.useCallback((newExpense: TripExpense) => {
    setSessionExpenses((prev) => [newExpense, ...prev]);
  }, []);

  const handleSaveExpenseFromModal = React.useCallback(
    (formData: CreateExpenseFormData) => {
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
        locationName: formData.locationName,
        note: formData.note,
        receiptImageUrl: formData.receiptImageUrl,
        shares,
        createdAt: new Date().toISOString(),
      };

      handleAddExpense(newExpense);
      setSessionToast("Đã thêm khoản chi (dữ liệu demo, chưa được lưu)");
    },
    [initialTrip, handleAddExpense, sessionMembers]
  );

  // Settlement Actions
  const handleLockSettlement = React.useCallback(() => {
    // Generate official transfers snapshot from current expenses
    const res = calculateMemberBalances(initialTrip.members, sessionExpenses);
    const transfers = generateSettlementTransfers(initialTrip.id, res.balances);
    setLockedTransfers(transfers);
    setSessionStatus("SETTLING");
    setSessionToast(
      "Đã chốt sổ công nợ! Chuyến đi chuyển sang trạng thái Quyết toán, đã khóa thêm chi tiêu mới."
    );
  }, [initialTrip.id, sessionExpenses, initialTrip.members]);

  const handleReopenSettlement = React.useCallback((): {
    success: boolean;
    message?: string;
  } => {
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
  }, [lockedTransfers]);

  const handleMarkTransferPaid = React.useCallback(
    (transferId: string, paymentMethod: PaymentMethod = "BANK_TRANSFER", note?: string) => {
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
    },
    [currentMemberId]
  );

  const handleConfirmTransferCompleted = React.useCallback(
    (transferId: string) => {
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
    },
    [currentMemberId]
  );

  // Itinerary Actions
  const handleAddItineraryItem = React.useCallback(
    (formData: CreateItineraryItemFormData) => {
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
      sessionItinerary,
      currentMemberId,
    ]
  );

  const handleUpdateItineraryItem = React.useCallback(
    (id: string, formData: CreateItineraryItemFormData) => {
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
    ]
  );

  const handleDeleteItineraryItem = React.useCallback(
    (id: string) => {
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

      setSessionItinerary((prev) => prev.filter((it) => it.id !== id));
      setSessionToast("Đã xóa địa điểm khỏi lịch trình.");
      return { success: true };
    },
    [sessionItinerary, currentMemberId, isHost, sessionStatus]
  );

  const handleOpenAddExpenseForItinerary = React.useCallback((item: ItineraryItem) => {
    setItineraryAddExpenseTarget(item);
  }, []);

  const handleAddGuestMember = React.useCallback(
    (formData: CreateGuestMemberFormData) => {
      const permission = canAddGuestMember(sessionStatus, isHost);
      if (!permission.allowed) {
        return { success: false, message: permission.reason };
      }

      const validation = validateGuestMemberForm(formData, sessionMembers);
      if (!validation.isValid) {
        const firstError = Object.values(validation.errors)[0];
        return { success: false, message: firstError };
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
    [sessionStatus, isHost, sessionMembers]
  );

  const handleEditGuestMember = React.useCallback(
    (id: string, formData: EditGuestMemberFormData) => {
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
    [sessionMembers, sessionStatus, isHost]
  );

  const handleRemoveMember = React.useCallback(
    (id: string) => {
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
    [sessionMembers, memberBalancesResult, sessionExpenses, sessionStatus, isHost]
  );

  const handleLeaveTrip = React.useCallback(
    (id: string) => {
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

      // Thành viên rời chuyến -> chuyển status = 'LEFT'
      setSessionMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "LEFT" as const } : m))
      );
      setSessionToast(`Bạn đã rời chuyến đi "${sessionTrip.name}".`);
      return { success: true };
    },
    [sessionMembers, memberBalancesResult, sessionStatus, sessionTrip.name]
  );

  const handleApproveClaim = React.useCallback(
    (claimId: string) => {
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
    [sessionClaims, sessionMembers, isHost, sessionStatus, currentMemberId]
  );

  const handleRejectClaim = React.useCallback(
    (claimId: string) => {
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
    [sessionClaims, sessionMembers, isHost, sessionStatus, currentMemberId]
  );

  const handleResetInviteCode = React.useCallback(() => {
    if (!isHost) {
      return { success: false, message: "Chỉ Trưởng nhóm mới có quyền đổi mã mời." };
    }
    if (sessionStatus !== "ACTIVE") {
      return { success: false, message: "Chỉ có thể đổi mã mời khi chuyến đi đang lên kế hoạch." };
    }

    // Tạo mã mời mới tuân thủ Rule R14 (10-12 ký tự chữ/số + 1 dấu gạch nối)
    const randSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const newCode = `DL3N2D-${randSuffix}99`;
    setSessionInviteCode(newCode);
    setSessionToast(`Đã đổi mã mời mới: ${newCode}. Mã mời cũ đã bị vô hiệu hóa.`);
    return { success: true, code: newCode };
  }, [isHost, sessionStatus]);

  return (
    <TripSessionContext.Provider
      value={{
        trip: initialTrip,
        sessionTrip,
        sessionExpenses,
        sessionItinerary,
        sessionMembers,
        sessionClaims,
        sessionInviteCode,
        sessionStatus,
        sessionTransfers: effectiveTransfers,
        sessionSettlement,
        currentMemberId,
        setCurrentMemberId,
        isHost,
        isOverviewAddModalOpen,
        setIsOverviewAddModalOpen,
        handleAddExpense,
        handleSaveExpenseFromModal,
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
          onSaveExpense={(formData) => {
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
              shares = computeEqualShares(safeAmount, participantsWithOrder).map((s, idx) => ({
                id: `share-${expenseId}-${idx + 1}`,
                expenseId,
                memberId: s.memberId,
                amount: s.amount,
                hasRemainderExtra: s.hasRemainderExtra,
              }));
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
              locationName: formData.locationName,
              note: formData.note,
              receiptImageUrl: formData.receiptImageUrl,
              shares,
              createdAt: new Date().toISOString(),
            };

            handleAddExpense(newExpense);
            const targetId = itineraryAddExpenseTarget.id;
            setSessionItinerary((prev) =>
              prev.map((item) => (item.id === targetId ? { ...item, expenseId } : item))
            );
            setItineraryAddExpenseTarget(null);
            setSessionToast("Đã tạo khoản chi liên kết với địa điểm lịch trình!");
          }}
        />
      )}
    </TripSessionContext.Provider>
  );
}
