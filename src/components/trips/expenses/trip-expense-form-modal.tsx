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
} from "lucide-react";
import {
  TripDetailData,
  ExpenseCategory,
  CreateExpenseFormData,
  ExpenseValidationErrors,
} from "@/types/trip";
import { validateExpenseForm } from "@/lib/validation/expense";
import { parseMoneyInput, formatMoneyInputValue } from "@/lib/money/parse";
import { computeEqualShares } from "@/lib/money/split";
import { LABELS, getExpenseCategoryLabel } from "@/lib/labels";
import { formatMoney } from "@/lib/money/format";

interface TripExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripDetailData;
  currentUserMemberId: string;
  isHost: boolean;
  onSaveExpense: (formData: CreateExpenseFormData) => void;
}

export function TripExpenseFormModal(props: TripExpenseFormModalProps) {
  if (!props.isOpen) return null;
  return <TripExpenseFormModalInner {...props} />;
}

function TripExpenseFormModalInner({
  onClose,
  trip,
  currentUserMemberId,
  isHost,
  onSaveExpense,
}: TripExpenseFormModalProps) {
  // Form State
  const [title, setTitle] = React.useState("");
  const [rawAmount, setRawAmount] = React.useState("150000"); // 150,000 VND initial
  const [category, setCategory] = React.useState<ExpenseCategory>("FOOD");
  const [paidByMemberId, setPaidByMemberId] = React.useState(currentUserMemberId);
  const [location, setLocation] = React.useState("");
  const [participantMemberIds, setParticipantMemberIds] = React.useState<string[]>(
    trip.members.map((m) => m.id)
  );
  const [spentAtDate, setSpentAtDate] = React.useState(() => {
    if (trip.startDate) {
      if (trip.startDate.includes("-")) return trip.startDate;
      if (trip.startDate.includes("/")) {
        const p = trip.startDate.split("/");
        if (p.length === 3) return `${p[2]}-${p[1]}-${p[0]}`;
      }
    }
    return "2026-10-15";
  });
  const [notes, setNotes] = React.useState("");
  const [receiptUrl, setReceiptUrl] = React.useState<string | null>(null);

  // Validation errors
  const [errors, setErrors] = React.useState<ExpenseValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Parse amount integer safely
  const numericAmount = parseMoneyInput(rawAmount) || 0;

  // Live shares computation using domain service (Rule R4)
  const computedShares = React.useMemo(() => {
    // Preserve trip.members join order for participants
    const orderedParticipants = trip.members
      .filter((m) => participantMemberIds.includes(m.id))
      .map((m) => m.id);

    return computeEqualShares(numericAmount, orderedParticipants);
  }, [numericAmount, participantMemberIds, trip.members]);

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
    if (participantMemberIds.includes(memberId)) {
      if (participantMemberIds.length > 1) {
        setParticipantMemberIds(participantMemberIds.filter((id) => id !== memberId));
      }
    } else {
      setParticipantMemberIds([...participantMemberIds, memberId]);
    }
  };

  // Select all / deselect all
  const selectAllParticipants = () => {
    setParticipantMemberIds(trip.members.map((m) => m.id));
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const loc = location.trim() ? location.trim() : undefined;
    const n = notes.trim() ? notes.trim() : undefined;
    const rc = receiptUrl || undefined;

    const formData: CreateExpenseFormData = {
      title,
      amount: numericAmount,
      category,
      paidByMemberId,
      locationName: loc,
      splitMethod: "EQUAL",
      participantMemberIds,
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

    onSaveExpense(formData);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-add-expense-title"
    >
      <div className="relative w-full max-w-4xl bg-white rounded-[24px] shadow-2xl border border-border-hairline overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-5 sm:px-6 py-4 border-b border-border-hairline flex items-center justify-between bg-surface-card shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cerulean/10 text-cerulean flex items-center justify-center">
              <Plus className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2
                id="modal-add-expense-title"
                className="text-base sm:text-lg font-bold text-yale-blue"
              >
                Thêm khoản chi mới
              </h2>
              <p className="text-xs text-text-muted">
                {trip.name} · Quy tắc chia đều an toàn số nguyên (R4)
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
                        className={`h-10 px-3 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                          isSelected
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
                    value={paidByMemberId}
                    onChange={(e) => setPaidByMemberId(e.target.value)}
                    disabled={!isHost} // Member regular cannot change payer (R18)
                    className="w-full h-11 bg-white border border-border-hairline rounded-xl px-3 text-xs sm:text-sm text-yale-blue font-medium focus:border-cerulean focus:ring-2 focus:ring-cerulean/20 transition-all disabled:bg-surface-container disabled:cursor-not-allowed"
                  >
                    {trip.members.map((m) => (
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
                      {participantMemberIds.length}/{trip.members.length} người chọn
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllParticipants}
                      className="text-cerulean hover:underline font-semibold cursor-pointer"
                    >
                      Chọn tất cả
                    </button>
                    {/* Method toggle: Chia đều vs Theo món */}
                    <div className="inline-flex p-0.5 bg-surface-container rounded-lg border border-border-hairline ml-2">
                      <span className="px-2.5 py-1 rounded bg-white text-cerulean font-bold text-xs shadow-xs">
                        Chia đều
                      </span>
                      <span
                        className="px-2 py-1 text-text-muted text-xs cursor-not-allowed opacity-60"
                        title="Sắp có"
                      >
                        Theo món
                      </span>
                    </div>
                  </div>
                </div>

                {/* Avatar Toggle Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {trip.members.map((member) => {
                    const isSelected = participantMemberIds.includes(member.id);
                    const sharePercent =
                      participantMemberIds.length > 0 && isSelected
                        ? (100 / participantMemberIds.length).toFixed(1)
                        : "0";

                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => toggleParticipant(member.id)}
                        className={`flex flex-col items-center p-3 rounded-xl border transition-all text-center cursor-pointer relative ${
                          isSelected
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
                {errors.participants && (
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
                    Chia đều {participantMemberIds.length} người
                  </span>
                </div>

                {/* Per Member Breakdown List */}
                <div className="flex flex-col divide-y divide-border-hairline/60 max-h-[220px] overflow-y-auto">
                  {computedShares.map((share) => {
                    const member = trip.members.find((m) => m.id === share.memberId);
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
                              {member.id === paidByMemberId ? "Người trả" : "Thành viên"}
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
                  })}
                </div>

                {/* Invariant check verification box */}
                <div className="p-3 rounded-xl bg-hover-row border border-border-hairline flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between font-bold text-yale-blue">
                    <span>Tổng phân bổ:</span>
                    <span className="text-cerulean tabular-nums">
                      {formatMoney(numericAmount)}
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
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Mock receipt url for test session
                      setReceiptUrl(URL.createObjectURL(file));
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                />

                {receiptUrl ? (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border-hairline">
                      <Image
                        src={receiptUrl}
                        alt="Ảnh hóa đơn đã chọn"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-xs font-semibold text-cerulean">
                      Đã chọn ảnh hóa đơn
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setReceiptUrl(null);
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
                      Hỗ trợ JPG, PNG tối đa 10MB
                    </span>
                  </>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-cerulean hover:bg-baltic-blue text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>Lưu khoản chi</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full h-10 bg-transparent hover:bg-hover-row text-text-muted hover:text-yale-blue font-semibold text-xs rounded-xl transition-all flex items-center justify-center cursor-pointer"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
