"use client";

import * as React from "react";
import Image from "next/image";
import {
  X,
  Plus,
  Utensils,
  Bike,
  Hotel,
  Ticket,
  ShoppingBag,
  Sparkles,
  MapPin,
  Calendar,
  FileText,
  Users,
  Check,
  Info,
  Upload,
  Bolt,
  AlertCircle,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  TripDetailData,
  ExpenseCategory,
  CreateExpenseFormData,
  ExpenseValidationErrors,
  ExpenseItemData,
  ExpenseSurchargeData,
  TripExpense,
} from "@/types/trip";
import { validateExpenseForm } from "@/lib/validation/expense";
import { parseMoneyInput, formatMoneyInputValue } from "@/lib/money/parse";
import { computeEqualShares, computeItemizedShares } from "@/lib/money/split";
import { LABELS, getExpenseCategoryLabel } from "@/lib/labels";
import { formatMoney } from "@/lib/money/format";
import { TripItemizedSplitView } from "./trip-itemized-split-modal";
import { uploadReceiptImage } from "@/lib/services/receipts-api";

interface TripExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripDetailData;
  currentUserMemberId: string;
  isHost: boolean;
  onSaveExpense: (
    formData: CreateExpenseFormData
  ) =>
    | Promise<{ success: boolean; message?: string } | void>
    | { success: boolean; message?: string }
    | void;
  initialLocationName?: string;
  initialExpense?: TripExpense | null;
  onDeleteExpense?: (expenseId: string) => void;
}

export function TripExpenseFormModal(props: TripExpenseFormModalProps) {
  if (!props.isOpen) return null;
  const key = props.initialExpense
    ? `edit-${props.initialExpense.id}`
    : `new-${props.trip.id}-${props.initialLocationName || ""}`;
  return <TripExpenseFormModalInner {...props} key={key} />;
}

function TripExpenseFormModalInner({
  onClose,
  trip,
  currentUserMemberId,
  isHost,
  onSaveExpense,
  initialLocationName = "",
  initialExpense,
  onDeleteExpense,
}: TripExpenseFormModalProps) {
  // Form State
  const [title, setTitle] = React.useState(initialExpense?.title || "");
  const [rawAmount, setRawAmount] = React.useState(
    initialExpense ? String(initialExpense.amount) : "150000"
  );
  const [category, setCategory] = React.useState<ExpenseCategory>(
    initialExpense?.category || "FOOD"
  );

  // Danh sách thành viên đang hoạt động (chỉ active members mới xuất hiện trong form)
  const activeMembers = React.useMemo(
    () => trip.members.filter((m) => m.status === "ACTIVE"),
    [trip.members]
  );

  // Xác định người trả tiền mặc định: ưu tiên currentUser nếu active, fallback là activeMember đầu tiên
  const defaultPayerId = React.useMemo(() => {
    if (initialExpense?.paidByMemberId) return initialExpense.paidByMemberId;
    const isCurrentActive = activeMembers.some((m) => m.id === currentUserMemberId);
    if (isCurrentActive) return currentUserMemberId;
    return activeMembers[0]?.id || "";
  }, [initialExpense, activeMembers, currentUserMemberId]);

  const [paidByMemberId, setPaidByMemberId] = React.useState(
    initialExpense?.paidByMemberId || defaultPayerId
  );

  // Đảm bảo người trả tiền luôn là active member hợp lệ (fallback về defaultPayerId nếu ID không còn active)
  const safePaidByMemberId = activeMembers.some((m) => m.id === paidByMemberId)
    ? paidByMemberId
    : defaultPayerId;

  const [location, setLocation] = React.useState(
    initialExpense?.locationName || initialLocationName
  );
  const [splitMethod, setSplitMethod] = React.useState<"EQUAL" | "ITEMIZED">(
    initialExpense?.splitMethod || "EQUAL"
  );
  const [currentStep, setCurrentStep] = React.useState<1 | 2>(1);
  const [itemizedItems, setItemizedItems] = React.useState<ExpenseItemData[] | undefined>(
    initialExpense?.items
  );
  const [itemizedSurcharge, setItemizedSurcharge] = React.useState<ExpenseSurchargeData | null | undefined>(
    initialExpense?.surcharge
  );

  // Khởi tạo người tham gia chia tiền chỉ gồm các thành viên active
  const [participantMemberIds, setParticipantMemberIds] = React.useState<string[]>(() => {
    if (initialExpense && initialExpense.shares && initialExpense.shares.length > 0) {
      return initialExpense.shares.map((s) => s.memberId);
    }
    return activeMembers.map((m) => m.id);
  });

  // Lọc an toàn: loại bỏ bất kỳ ID nào không thuộc activeMembers (chặn thành viên LEFT)
  const activeMemberIdsSet = React.useMemo(
    () => new Set(activeMembers.map((m) => m.id)),
    [activeMembers]
  );
  const safeParticipantMemberIds = React.useMemo(() => {
    const valid = participantMemberIds.filter((id) => activeMemberIdsSet.has(id));
    return valid.length > 0 ? valid : activeMembers.map((m) => m.id);
  }, [participantMemberIds, activeMemberIdsSet, activeMembers]);

  const [spentAtDate, setSpentAtDate] = React.useState(() => {
    if (initialExpense?.spentAt) {
      return initialExpense.spentAt.slice(0, 10);
    }
    if (trip.startDate) {
      if (trip.startDate.includes("-")) return trip.startDate;
      if (trip.startDate.includes("/")) {
        const p = trip.startDate.split("/");
        if (p.length === 3) return `${p[2]}-${p[1]}-${p[0]}`;
      }
    }
    return "2026-10-15";
  });
  const [notes, setNotes] = React.useState(initialExpense?.note || "");
  const [receiptUrl, setReceiptUrl] = React.useState<string | null>(
    initialExpense?.receiptImageUrl || null
  );
  const [isUploadingReceipt, setIsUploadingReceipt] = React.useState(false);
  const [receiptUploadError, setReceiptUploadError] = React.useState<string | null>(null);

  // Validation errors
  const [errors, setErrors] = React.useState<ExpenseValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const handleReceiptFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploadingReceipt(true);
    setReceiptUploadError(null);

    try {
      const result = await uploadReceiptImage(trip.id, file);
      setReceiptUrl(result.url);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Không thể tải lên ảnh hóa đơn. Vui lòng thử lại.";
      setReceiptUploadError(msg);
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // Parse amount integer safely
  const numericAmount = parseMoneyInput(rawAmount) || 0;

  // Live shares computation using domain service (Rule R4)
  const computedShares = React.useMemo<
    Array<{
      memberId: string;
      amount: number;
      hasRemainderExtra?: boolean;
      itemCount?: number;
    }>
  >(() => {
    // Guard clause: Không gọi compute khi số tiền <= 0, không an toàn
    if (
      typeof numericAmount !== "number" ||
      !Number.isSafeInteger(numericAmount) ||
      numericAmount <= 0
    ) {
      return [];
    }

    if (splitMethod === "ITEMIZED") {
      if (!itemizedItems || itemizedItems.length === 0) {
        return [];
      }
      try {
        const itemizedResults = computeItemizedShares(
          numericAmount,
          itemizedItems,
          itemizedSurcharge ?? null,
          activeMembers
        );
        return itemizedResults.map((it) => ({
          memberId: it.memberId,
          amount: it.totalAmount,
          itemCount: it.assignedItemCount,
        }));
      } catch {
        return [];
      }
    }

    if (safeParticipantMemberIds.length === 0) {
      return [];
    }

    // Preserve activeMembers join order for participants
    const orderedParticipants = activeMembers
      .filter((m) => safeParticipantMemberIds.includes(m.id))
      .map((m) => m.id);

    if (orderedParticipants.length === 0) {
      return [];
    }

    const equalResults = computeEqualShares(numericAmount, orderedParticipants);
    return equalResults.map((eq) => ({
      memberId: eq.memberId,
      amount: eq.amount,
      hasRemainderExtra: eq.hasRemainderExtra,
    }));
  }, [numericAmount, splitMethod, itemizedItems, itemizedSurcharge, safeParticipantMemberIds, activeMembers]);

  // Quick amount suggestions
  const SUGGESTIONS = [
    { label: "50k", value: 50_000 },
    { label: "100k", value: 100_000 },
    { label: "200k", value: 200_000 },
    { label: "500k", value: 500_000 },
    { label: "1.000k", value: 1_000_000 },
    { label: "2.000k", value: 2_000_000 },
  ];

  // Category list
  const CATEGORIES: { id: ExpenseCategory; label: string; icon: React.ReactNode }[] = [
    { id: "FOOD", label: LABELS.EXPENSE_CATEGORY.FOOD, icon: <Utensils className="w-4 h-4" /> },
    { id: "TRANSPORT", label: LABELS.EXPENSE_CATEGORY.TRANSPORT, icon: <Bike className="w-4 h-4" /> },
    { id: "LODGING", label: LABELS.EXPENSE_CATEGORY.LODGING, icon: <Hotel className="w-4 h-4" /> },
    { id: "TICKET", label: LABELS.EXPENSE_CATEGORY.TICKET, icon: <Ticket className="w-4 h-4" /> },
    { id: "SHOPPING", label: LABELS.EXPENSE_CATEGORY.SHOPPING, icon: <ShoppingBag className="w-4 h-4" /> },
    { id: "OTHER", label: LABELS.EXPENSE_CATEGORY.OTHER, icon: <Sparkles className="w-4 h-4" /> },
  ];

  // Toggle single participant
  const toggleParticipant = (memberId: string) => {
    if (safeParticipantMemberIds.includes(memberId)) {
      if (safeParticipantMemberIds.length > 1) {
        setParticipantMemberIds(safeParticipantMemberIds.filter((id) => id !== memberId));
      }
    } else {
      setParticipantMemberIds([...safeParticipantMemberIds, memberId]);
    }
  };

  // Select all / deselect all (chỉ chọn các thành viên đang hoạt động)
  const selectAllParticipants = () => {
    setParticipantMemberIds(activeMembers.map((m) => m.id));
  };

  // Handle amount change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parsed = parseMoneyInput(raw);
    if (parsed === null) {
      setRawAmount("");
    } else {
      setRawAmount(parsed.toString());
    }
  };

  // Handle submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const loc = location.trim() ? location.trim() : undefined;
    const n = notes.trim() ? notes.trim() : undefined;
    const rc = receiptUrl || undefined;

    let effectiveParticipants = safeParticipantMemberIds;

    if (splitMethod === "ITEMIZED") {
      if (!itemizedItems || itemizedItems.length === 0) {
        setErrors((prev) => ({
          ...prev,
          participants: "Vui lòng mở bảng và hoàn tất thiết lập món trước khi lưu.",
        }));
        setIsSubmitting(false);
        return;
      }

      const sumItems = itemizedItems.reduce((acc, it) => acc + (it.amount || 0), 0);
      const surchargeAmt = itemizedSurcharge?.amount || 0;
      if (sumItems + surchargeAmt !== numericAmount) {
        setErrors((prev) => ({
          ...prev,
          amount: `Tổng các món (${formatMoney(sumItems + surchargeAmt)}) chưa khớp với tổng hóa đơn (${formatMoney(numericAmount)}). Vui lòng điều chỉnh lại món.`,
        }));
        setIsSubmitting(false);
        return;
      }

      // Thu thập tất cả thành viên có ít nhất 1 món
      const participantSet = new Set<string>();
      itemizedItems.forEach((it) => it.assignedMemberIds.forEach((id) => participantSet.add(id)));
      effectiveParticipants = Array.from(participantSet);

      if (effectiveParticipants.length === 0) {
        setErrors((prev) => ({
          ...prev,
          participants: "Cần ít nhất một thành viên tham gia món ăn.",
        }));
        setIsSubmitting(false);
        return;
      }
    }

    const formData: CreateExpenseFormData = {
      title,
      amount: numericAmount,
      category,
      paidByMemberId: safePaidByMemberId,
      locationName: loc,
      splitMethod,
      items: splitMethod === "ITEMIZED" ? itemizedItems : undefined,
      surcharge: splitMethod === "ITEMIZED" ? itemizedSurcharge : undefined,
      participantMemberIds: effectiveParticipants,
      spentAtDate,
      note: n,
      receiptImageUrl: rc,
    };

    const validation = validateExpenseForm(
      formData,
      currentUserMemberId,
      isHost,
      trip.members,
      trip.totalSpent
    );

    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    setSubmitError(null);
    try {
      const res = await onSaveExpense(formData);
      if (res && typeof res === "object" && "success" in res && !res.success) {
        setSubmitError(res.message || "Không thể lưu khoản chi.");
        setIsSubmitting(false);
        return;
      }
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Đã có lỗi xảy ra khi lưu khoản chi."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={currentStep === 1 ? "modal-add-expense-title" : "itemized-split-title"}
    >
      <div
        className={`relative w-full ${currentStep === 2 ? "max-w-[1240px] my-3 sm:my-6" : "max-w-4xl my-auto"
          } bg-white rounded-[24px] shadow-2xl border border-border-hairline overflow-hidden flex flex-col max-h-[94vh] transition-all`}
      >
        {currentStep === 1 ? (
          <>
            {/* Modal Top Bar */}
            <div className="px-5 sm:px-6 py-4 border-b border-border-hairline flex items-center justify-between bg-surface-card shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cerulean/10 text-cerulean flex items-center justify-center">
                  {initialExpense ? (
                    <Pencil className="w-5 h-5 stroke-[2.2]" />
                  ) : (
                    <Plus className="w-5 h-5 stroke-[2.5]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2
                      id="modal-add-expense-title"
                      className="text-base sm:text-lg font-bold text-yale-blue"
                    >
                      {initialExpense ? "Chỉnh sửa khoản chi" : "Thêm khoản chi mới"}
                    </h2>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cerulean/15 text-cerulean font-bold">
                      Bước 1 / 2
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">
                    {trip.name} ·{" "}
                    {initialExpense
                      ? "Cập nhật chi tiết và phân chia tiền nhóm"
                      : splitMethod === "ITEMIZED"
                        ? "Chia theo từng món"
                        : "Quy tắc chia đều an toàn số nguyên (R4)"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-text-muted hover:text-yale-blue transition-colors cursor-pointer"
                aria-label="Đóng modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Scrollable 2-Column Workspace */}
            <form onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-6 flex-1">
              {submitError && (
                <div
                  role="alert"
                  className="mb-5 p-3.5 rounded-xl bg-functional-negative/10 border border-functional-negative/20 text-functional-negative text-xs font-semibold flex items-center gap-2.5 animate-fadeIn"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: PRIMARY EXPENSE FORM (8 cols) */}
                <div className="lg:col-span-7 flex flex-col gap-5">
                  {/* Field 1: HERO AMOUNT INPUT */}
                  <div className="bg-bg-canvas/70 p-4 sm:p-5 rounded-2xl border border-border-hairline">
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="expense-amount"
                        className="text-xs sm:text-sm font-bold text-yale-blue flex items-center gap-1"
                      >
                        <span>Số tiền chi</span>
                        <span className="text-functional-negative">*</span>
                      </label>
                      <span className="text-xs text-text-muted">Đơn vị: VND</span>
                    </div>

                    <div className="relative flex items-center">
                      <input
                        id="expense-amount"
                        type="text"
                        inputMode="numeric"
                        value={formatMoneyInputValue(numericAmount)}
                        onChange={handleAmountChange}
                        placeholder="0"
                        className="w-full h-16 sm:h-18 bg-white border-2 border-cerulean rounded-xl pl-4 pr-12 text-2xl sm:text-3xl font-extrabold text-yale-blue tracking-tight focus:outline-none focus:ring-4 focus:ring-cerulean/20 transition-all shadow-inner tabular-nums"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-2xl sm:text-3xl font-bold text-cerulean">
                        ₫
                      </div>
                    </div>

                    {errors.amount && (
                      <p className="text-xs font-semibold text-functional-negative mt-1.5 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{errors.amount}</span>
                      </p>
                    )}

                    {/* Quick suggestions pills */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-3 pt-1 border-t border-border-hairline/60">
                      <span className="text-xs text-text-muted font-medium flex items-center gap-1">
                        <Bolt className="w-3.5 h-3.5 text-tropical-teal" />
                        <span>Gợi ý:</span>
                      </span>
                      {SUGGESTIONS.map((sug) => (
                        <button
                          key={sug.label}
                          type="button"
                          onClick={() => setRawAmount(sug.value.toString())}
                          className="px-2.5 py-1 rounded-full bg-white hover:bg-hover-row text-yale-blue text-xs font-semibold border border-border-hairline transition-all shadow-xs cursor-pointer"
                        >
                          +{sug.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Field 2: TÊN KHOẢN CHI */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="expense-title"
                      className="text-xs sm:text-sm font-bold text-yale-blue flex items-center gap-1"
                    >
                      <span>Tên khoản chi</span>
                      <span className="text-functional-negative">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="expense-title"
                        type="text"
                        maxLength={200}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ví dụ: Ăn trưa bánh ướt lòng gà, Vé cáp treo, Thuê xe máy..."
                        className="w-full h-11 bg-white border border-border-hairline rounded-xl px-3.5 text-xs sm:text-sm text-yale-blue placeholder:text-text-muted focus:border-cerulean focus:ring-2 focus:ring-cerulean/20 transition-all"
                      />
                    </div>
                    {errors.title && (
                      <p className="text-xs font-semibold text-functional-negative flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{errors.title}</span>
                      </p>
                    )}
                  </div>

                  {/* Field 3: DANH MỤC CHI TIÊU */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs sm:text-sm font-bold text-yale-blue flex items-center justify-between">
                      <span>Danh mục chi tiêu</span>
                      <span className="text-xs text-text-muted font-normal">
                        {getExpenseCategoryLabel(category)}
                      </span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CATEGORIES.map((cat) => {
                        const isSelected = category === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategory(cat.id)}
                            className={`h-10 px-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${isSelected
                                ? "bg-cerulean/10 border-cerulean text-cerulean shadow-xs"
                                : "bg-white border-border-hairline text-yale-blue hover:bg-hover-row"
                              }`}
                          >
                            {cat.icon}
                            <span className="truncate">{cat.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-cerulean" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Field 4: GRID 2 COLS - NGƯỜI TRẢ & ĐỊA ĐIỂM */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Người trả tiền (Quyết định R18) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs sm:text-sm font-bold text-yale-blue flex items-center gap-1">
                        <span>Người trả trước</span>
                        <span className="text-functional-negative">*</span>
                      </label>
                      <select
                        value={safePaidByMemberId}
                        onChange={(e) => setPaidByMemberId(e.target.value)}
                        disabled={!isHost} // Member regular cannot change payer (R18)
                        className="w-full h-11 bg-white border border-border-hairline rounded-xl px-3 text-xs sm:text-sm text-yale-blue font-medium focus:border-cerulean focus:ring-2 focus:ring-cerulean/20 transition-all disabled:bg-surface-container disabled:cursor-not-allowed"
                      >
                        {activeMembers.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} {m.id === currentUserMemberId ? "(Bạn)" : ""}{" "}
                            {(m.role === "HOST" || m.isHost) ? `— ${LABELS.ROLE.HOST}` : ""}{" "}
                            {m.isNoAccount ? `— ${LABELS.MEMBER.NO_ACCOUNT}` : ""}
                          </option>
                        ))}
                      </select>
                      {!isHost && (
                        <span className="text-[11px] text-text-muted">
                          Quy tắc R18: Thành viên chỉ được ghi nhận khoản chi do chính mình trả.
                        </span>
                      )}
                      {errors.paidByMemberId && (
                        <p className="text-xs font-semibold text-functional-negative">
                          {errors.paidByMemberId}
                        </p>
                      )}
                    </div>

                    {/* Gắn với địa điểm */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs sm:text-sm font-bold text-yale-blue">
                        Gắn với địa điểm
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ocean-mist" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Ví dụ: Chợ đêm, Tiệm cà phê..."
                          className="w-full h-11 pl-9 pr-3 bg-white border border-border-hairline rounded-xl text-xs sm:text-sm text-yale-blue placeholder:text-text-muted focus:border-cerulean focus:ring-2 focus:ring-cerulean/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Field 5: CHIA CHO AI (SPLIT PARTICIPANTS) */}
                  <div className="pt-2 border-t border-border-hairline flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-cerulean" />
                        <span className="text-xs sm:text-sm font-bold text-yale-blue">Chia cho ai</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-cerulean/10 text-cerulean font-semibold">
                          {safeParticipantMemberIds.length}/{activeMembers.length} người chọn
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        {splitMethod === "EQUAL" && (
                          <button
                            type="button"
                            onClick={selectAllParticipants}
                            className="text-cerulean hover:underline font-semibold cursor-pointer"
                          >
                            Chọn tất cả
                          </button>
                        )}
                        {/* Method toggle: Chia đều vs Theo món */}
                        <div className="inline-flex p-0.5 bg-surface-container rounded-lg border border-border-hairline ml-2">
                          <button
                            type="button"
                            onClick={() => setSplitMethod("EQUAL")}
                            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${splitMethod === "EQUAL"
                                ? "bg-white text-cerulean shadow-xs"
                                : "text-text-muted hover:text-yale-blue"
                              }`}
                          >
                            Chia đều
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (numericAmount <= 0) {
                                setErrors((prev) => ({
                                  ...prev,
                                  amount: "Vui lòng nhập số tiền chi tiêu trước khi chia theo món.",
                                }));
                                return;
                              }
                              setSplitMethod("ITEMIZED");
                              setCurrentStep(2);
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-bold transition-all cursor-pointer ${splitMethod === "ITEMIZED"
                                ? "bg-white text-cerulean shadow-xs"
                                : "text-text-muted hover:text-yale-blue"
                              }`}
                          >
                            Theo món
                          </button>
                        </div>
                      </div>
                    </div>

                    {splitMethod === "ITEMIZED" ? (
                      /* Giao diện trạng thái Chia theo từng món */
                      <div className="flex flex-col gap-2">
                        {itemizedItems && itemizedItems.length > 0 ? (
                          <div className="p-4 rounded-xl bg-hover-row border border-cerulean/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-yale-blue">
                                  Đã cấu hình {itemizedItems.length} món
                                </span>
                                {itemizedSurcharge && itemizedSurcharge.amount > 0 && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-cerulean/15 text-cerulean font-semibold">
                                    + {itemizedSurcharge.name} ({formatMoney(itemizedSurcharge.amount)})
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-functional-positive font-medium mt-0.5">
                                ✓ Đã phân bổ khớp 100% hóa đơn ({formatMoney(numericAmount)})
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(2)}
                              className="h-9 px-3.5 rounded-xl bg-white text-cerulean border border-cerulean hover:bg-hover-row text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                            >
                              Chỉnh sửa món
                            </button>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl bg-functional-warning-bg border border-functional-warning/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-xs font-bold text-functional-warning">
                                Chưa cấu hình danh sách món ăn
                              </span>
                              <p className="text-xs text-text-muted mt-0.5">
                                Bấm nút bên cạnh để mở bảng ma trận chia từng món.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (numericAmount <= 0) {
                                  setErrors((prev) => ({
                                    ...prev,
                                    amount: "Vui lòng nhập số tiền chi tiêu trước khi chia theo món.",
                                  }));
                                  return;
                                }
                                setCurrentStep(2);
                              }}
                              className="h-9 px-4 rounded-xl bg-cerulean text-white hover:bg-baltic-blue text-xs font-semibold shadow-xs cursor-pointer transition-colors"
                            >
                              Thiết lập món
                            </button>
                          </div>
                        )}
                        {errors.participants && (
                          <p className="text-xs font-semibold text-functional-negative">
                            {errors.participants}
                          </p>
                        )}
                      </div>
                    ) : (
                      /* Avatar Toggle Grid cho Chia đều */
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {activeMembers.map((member) => {
                          const isSelected = safeParticipantMemberIds.includes(member.id);
                          const sharePercent =
                            safeParticipantMemberIds.length > 0 && isSelected
                              ? (100 / safeParticipantMemberIds.length).toFixed(1)
                              : "0";

                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => toggleParticipant(member.id)}
                              className={`flex flex-col items-center p-3 rounded-xl border transition-all text-center cursor-pointer relative ${isSelected
                                  ? "bg-hover-row border-cerulean shadow-xs"
                                  : "bg-white border-border-hairline opacity-65 hover:opacity-100"
                                }`}
                            >
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-surface-container text-yale-blue font-bold text-sm flex items-center justify-center border border-border-hairline">
                                  {member.avatarUrl ? (
                                    <Image
                                      src={member.avatarUrl}
                                      alt={member.name}
                                      width={40}
                                      height={40}
                                      className="rounded-full object-cover"
                                    />
                                  ) : (
                                    member.name.slice(0, 1)
                                  )}
                                </div>
                                {isSelected && (
                                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-functional-positive text-white flex items-center justify-center shadow-xs">
                                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  </span>
                                )}
                              </div>

                              <span className="mt-1.5 text-xs font-bold text-yale-blue truncate w-full">
                                {member.name}
                              </span>
                              {member.isNoAccount && (
                                <span className="text-[10px] text-functional-warning font-semibold">
                                  {LABELS.MEMBER.NO_ACCOUNT_SHORT}
                                </span>
                              )}
                              <span className="text-[11px] text-text-muted font-medium mt-0.5">
                                {sharePercent}%
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {splitMethod === "EQUAL" && errors.participants && (
                      <p className="text-xs font-semibold text-functional-negative">
                        {errors.participants}
                      </p>
                    )}
                  </div>

                  {/* Field 6: GRID 2 COLS - NGÀY CHI & GHI CHÚ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-hairline">
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="expense-spent-date"
                        className="text-xs sm:text-sm font-bold text-yale-blue flex items-center gap-1"
                      >
                        <span>Ngày chi</span>
                        <span className="text-functional-negative">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ocean-mist" />
                        <input
                          id="expense-spent-date"
                          type="date"
                          value={spentAtDate}
                          onChange={(e) => setSpentAtDate(e.target.value)}
                          className="w-full h-11 pl-9 pr-3 bg-white border border-border-hairline rounded-xl text-xs sm:text-sm text-yale-blue focus:border-cerulean focus:ring-2 focus:ring-cerulean/20 transition-all"
                        />
                      </div>
                      {errors.spentAtDate && (
                        <p className="text-xs font-semibold text-functional-negative">
                          {errors.spentAtDate}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="expense-notes"
                        className="text-xs sm:text-sm font-bold text-yale-blue"
                      >
                        Ghi chú thêm
                      </label>
                      <div className="relative">
                        <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                          id="expense-notes"
                          type="text"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Chi tiết món, địa chỉ..."
                          className="w-full h-11 pl-9 pr-3 bg-white border border-border-hairline rounded-xl text-xs sm:text-sm text-yale-blue placeholder:text-text-muted focus:border-cerulean focus:ring-2 focus:ring-cerulean/20 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: STICKY LIVE BREAKDOWN & DROPZONE (5 cols) */}
                <div className="lg:col-span-5 flex flex-col gap-4 sticky top-0">
                  {/* Card 1: LIVE BREAKDOWN "Mỗi người trả" */}
                  <div className="bg-surface-card rounded-2xl p-4 sm:p-5 border border-border-hairline shadow-sm flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-3 border-b border-border-hairline">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs sm:text-sm font-bold text-yale-blue">
                          Mỗi người trả
                        </span>
                      </div>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-lime-cream font-bold text-yale-blue">
                        {splitMethod === "ITEMIZED"
                          ? `Theo món ${computedShares.length} người`
                          : `Chia đều ${safeParticipantMemberIds.length} người`}
                      </span>
                    </div>

                    {/* Per Member Breakdown List */}
                    <div className="flex flex-col divide-y divide-border-hairline/60 max-h-[220px] overflow-y-auto">
                      {computedShares.length > 0 ? (
                        computedShares.map((share) => {
                          const member = activeMembers.find((m) => m.id === share.memberId);
                          if (!member) return null;

                          return (
                            <div
                              key={share.memberId}
                              className="py-2.5 flex items-center justify-between px-1"
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-surface-container text-yale-blue font-bold text-xs flex items-center justify-center shrink-0">
                                  {member.name.slice(0, 1)}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-yale-blue truncate max-w-[120px]">
                                    {member.name}
                                  </span>
                                  <span className="text-[10px] text-text-muted">
                                    {member.id === safePaidByMemberId ? "Người trả" : "Thành viên"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <span className="text-xs sm:text-sm font-bold text-yale-blue tabular-nums">
                                  {formatMoney(share.amount)}
                                </span>
                                {share.hasRemainderExtra && (
                                  <span
                                    className="w-4 h-4 rounded-full bg-cerulean/15 text-cerulean flex items-center justify-center text-[10px] font-bold cursor-help"
                                    title="Nhận +1 ₫ lẻ do phép chia nguyên có phần dư (Quy tắc R4)"
                                  >
                                    i
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-6 px-3 text-center flex flex-col items-center justify-center gap-1">
                          <p className="text-xs text-text-muted">
                            {splitMethod === "ITEMIZED"
                              ? "Chưa hoàn tất thiết lập món. Bấm 'Thiết lập món' để phân bổ."
                              : safeParticipantMemberIds.length === 0
                                ? "Chưa chọn người tham gia chia tiền."
                                : "Nhập số tiền để xem tạm tính phần chia mỗi người."}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Invariant check verification box */}
                    <div className="p-3 rounded-xl bg-hover-row border border-border-hairline flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-yale-blue">
                        <span>Tổng phân bổ:</span>
                        <span className="text-cerulean tabular-nums">
                          {numericAmount > 0 && Number.isSafeInteger(numericAmount)
                            ? formatMoney(numericAmount)
                            : "0 ₫"}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-muted leading-relaxed flex items-start gap-1 mt-0.5">
                        <Info className="w-3.5 h-3.5 text-tropical-teal shrink-0 mt-0.5" />
                        <span>
                          Chia nguyên an toàn VND. Bất biến tổng chia luôn khớp 100% hóa đơn.
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Card 2: HÓA ĐƠN DROPZONE */}
                  <div className="bg-bg-canvas rounded-2xl p-4 border-2 border-dashed border-ocean-mist/50 flex flex-col items-center justify-center text-center relative hover:border-cerulean transition-colors group">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={isUploadingReceipt || isSubmitting}
                      onChange={handleReceiptFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                    />

                    {isUploadingReceipt ? (
                      <div className="flex flex-col items-center gap-2 py-3">
                        <Loader2 className="w-6 h-6 animate-spin text-cerulean" />
                        <span className="text-xs font-semibold text-cerulean">
                          Đang tải ảnh hóa đơn lên máy chủ...
                        </span>
                      </div>
                    ) : receiptUrl ? (
                      <div className="flex flex-col items-center gap-2 w-full">
                        <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border-hairline bg-black/5">
                          <Image
                            src={receiptUrl}
                            alt="Ảnh hóa đơn đã chọn"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <span className="text-xs font-semibold text-cerulean">
                          Đã lưu ảnh hóa đơn
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceiptUrl(null);
                            setReceiptUploadError(null);
                          }}
                          className="text-[11px] text-functional-negative hover:underline cursor-pointer z-20"
                        >
                          Xóa ảnh
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-surface-card text-cerulean flex items-center justify-center shadow-xs mb-1.5 group-hover:scale-105 transition-transform">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-yale-blue">
                          Đính kèm hóa đơn (Tùy chọn)
                        </span>
                        <span className="text-[11px] text-text-muted mt-0.5">
                          Hỗ trợ JPG, PNG, WebP tối đa 5MB
                        </span>
                      </>
                    )}

                    {receiptUploadError && (
                      <div className="mt-2.5 p-2 rounded-lg bg-functional-negative/10 border border-functional-negative/20 text-functional-negative text-xs flex items-start gap-1.5 text-left w-full z-20">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span className="leading-tight">{receiptUploadError}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting || isUploadingReceipt}
                      className="w-full h-12 bg-cerulean hover:bg-baltic-blue disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                    >
                      {isUploadingReceipt ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang tải ảnh...</span>
                        </>
                      ) : isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Đang lưu...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          <span>{initialExpense ? "Lưu thay đổi khoản chi" : "Lưu khoản chi"}</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-2">
                      {initialExpense && onDeleteExpense && (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => onDeleteExpense(initialExpense.id)}
                          className="flex-1 h-10 bg-functional-negative/10 hover:bg-functional-negative/20 disabled:opacity-50 text-functional-negative font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa khoản chi</span>
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onClose}
                        className="flex-1 h-10 bg-transparent hover:bg-hover-row disabled:opacity-50 text-text-muted hover:text-yale-blue font-semibold text-xs rounded-xl transition-all flex items-center justify-center cursor-pointer"
                      >
                        Hủy bỏ
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="overflow-y-auto flex-1">
            <TripItemizedSplitView
              onBackToStep1={() => setCurrentStep(1)}
              onSaveItemizedSplit={(data) => {
                setItemizedItems(data.items);
                setItemizedSurcharge(data.surcharge);
                const pSet = new Set<string>();
                data.items.forEach((it) => it.assignedMemberIds.forEach((id) => pSet.add(id)));
                setParticipantMemberIds(Array.from(pSet));
                setCurrentStep(1);
              }}
              expenseTitle={title || "Khoản chi mới"}
              totalAmount={numericAmount}
              locationName={location}
              receiptImageUrl={receiptUrl || undefined}
              tripMembers={activeMembers}
              initialItems={itemizedItems}
              initialSurcharge={itemizedSurcharge}
            />
          </div>
        )}
      </div>
    </div>
  );
}
