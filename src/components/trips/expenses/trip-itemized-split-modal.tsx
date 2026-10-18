"use client";

import React, { useState, useMemo } from "react";
import type {
  TripMember,
  ExpenseItemData,
  ExpenseSurchargeData,
} from "@/types/trip";
import { LABELS } from "@/lib/labels";
import { formatMoney } from "@/lib/money/format";
import { parseMoneyInput, formatMoneyInputValue } from "@/lib/money/parse";
import { computeItemizedShares } from "@/lib/money/split";
import { validateItemizedExpense } from "@/lib/validation/itemized-expense";
import { Button } from "@/components/ui/button";

interface TripItemizedSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItemizedSplit: (data: {
    items: ExpenseItemData[];
    surcharge: ExpenseSurchargeData | null;
  }) => void;
  expenseTitle: string;
  totalAmount: number;
  locationName?: string;
  receiptImageUrl?: string;
  tripMembers: TripMember[];
  initialItems?: ExpenseItemData[];
  initialSurcharge?: ExpenseSurchargeData | null;
  onOpenReceiptLightbox?: (imageUrl: string) => void;
}

export function TripItemizedSplitModal({
  isOpen,
  onClose,
  onSaveItemizedSplit,
  expenseTitle,
  totalAmount,
  locationName,
  receiptImageUrl,
  tripMembers,
  initialItems,
  initialSurcharge,
  onOpenReceiptLightbox,
}: TripItemizedSplitModalProps) {
  // Lọc chỉ các thành viên ACTIVE
  const activeMembers = useMemo(
    () => tripMembers.filter((m) => m.status === "ACTIVE").sort((a, b) => a.joinOrder - b.joinOrder),
    [tripMembers]
  );

  // Khởi tạo danh sách món ban đầu
  const [items, setItems] = useState<ExpenseItemData[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    // Mặc định tạo 2 món mẫu nếu chưa có
    return [
      {
        id: "item_1",
        name: "Món chính 1",
        amount: Math.max(0, Math.floor(totalAmount * 0.7)),
        assignedMemberIds: activeMembers.map((m) => m.id),
      },
      {
        id: "item_2",
        name: "Đồ uống / Món phụ",
        amount: Math.max(0, totalAmount - Math.floor(totalAmount * 0.7)),
        assignedMemberIds: activeMembers.map((m) => m.id),
      },
    ];
  });

  // Khởi tạo phụ phí VAT / dịch vụ
  const [hasSurcharge, setHasSurcharge] = useState<boolean>(() => {
    return initialSurcharge !== undefined && initialSurcharge !== null && initialSurcharge.amount > 0;
  });

  const [surcharge, setSurcharge] = useState<ExpenseSurchargeData>(() => {
    if (initialSurcharge) return initialSurcharge;
    return {
      name: LABELS.ITEM_SPLIT.SURCHARGE_DEFAULT_NAME,
      amount: 0,
    };
  });

  // State thông báo lỗi validation
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Kiểm tra validation theo thời gian thực
  const validation = useMemo(() => {
    return validateItemizedExpense(
      totalAmount,
      items,
      hasSurcharge ? surcharge : null,
      activeMembers
    );
  }, [totalAmount, items, hasSurcharge, surcharge, activeMembers]);

  // Tính toán kết quả phân bổ tạm tính cho từng thành viên
  const memberSharesMap = useMemo(() => {
    try {
      const results = computeItemizedShares(
        totalAmount,
        items,
        hasSurcharge ? surcharge : null,
        activeMembers
      );
      const map = new Map<string, { itemsAmount: number; surchargeAmount: number; totalAmount: number; count: number }>();
      results.forEach((r) => {
        map.set(r.memberId, {
          itemsAmount: r.itemsAmount,
          surchargeAmount: r.surchargeAmount,
          totalAmount: r.totalAmount,
          count: r.assignedItemCount,
        });
      });
      return map;
    } catch {
      // Khi tổng các món chưa khớp totalAmount, computeItemizedShares sẽ ném lỗi đối soát.
      // Trong giao diện, ta vẫn tính tạm thời để hiển thị realtime cho người dùng xem
      const map = new Map<string, { itemsAmount: number; surchargeAmount: number; totalAmount: number; count: number }>();
      
      // Tính phần tiền các món
      items.forEach((item) => {
        const count = item.assignedMemberIds.length;
        if (count > 0 && item.amount > 0) {
          const perPerson = Math.floor(item.amount / count);
          item.assignedMemberIds.forEach((mId) => {
            const current = map.get(mId) || { itemsAmount: 0, surchargeAmount: 0, totalAmount: 0, count: 0 };
            current.itemsAmount += perPerson;
            current.count += 1;
            map.set(mId, current);
          });
        }
      });

      // Tính phụ phí VAT chia đều người tham gia
      if (hasSurcharge && surcharge.amount > 0) {
        const participatingMemberIds = activeMembers.filter((m) => (map.get(m.id)?.count || 0) > 0);
        if (participatingMemberIds.length > 0) {
          const surPerPerson = Math.floor(surcharge.amount / participatingMemberIds.length);
          participatingMemberIds.forEach((m) => {
            const current = map.get(m.id)!;
            current.surchargeAmount = surPerPerson;
            current.totalAmount = current.itemsAmount + current.surchargeAmount;
          });
        }
      } else {
        activeMembers.forEach((m) => {
          const current = map.get(m.id);
          if (current) {
            current.totalAmount = current.itemsAmount;
          }
        });
      }

      return map;
    }
  }, [totalAmount, items, hasSurcharge, surcharge, activeMembers]);

  if (!isOpen) return null;

  // Thao tác chỉnh sửa món
  const handleAddItem = () => {
    const nextIndex = items.length + 1;
    setItems([
      ...items,
      {
        id: `item_${Date.now()}_${nextIndex}`,
        name: `Món ${nextIndex}`,
        amount: 0,
        assignedMemberIds: activeMembers.map((m) => m.id),
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemName = (index: number, name: string) => {
    const updated = [...items];
    updated[index].name = name;
    setItems(updated);
  };

  const handleUpdateItemAmount = (index: number, rawValue: string) => {
    const parsed = parseMoneyInput(rawValue);
    const updated = [...items];
    updated[index].amount = parsed !== null ? parsed : 0;
    setItems(updated);
  };

  const handleToggleMember = (itemIndex: number, memberId: string) => {
    const updated = [...items];
    const targetItem = updated[itemIndex];
    const hasMember = targetItem.assignedMemberIds.includes(memberId);

    if (hasMember) {
      targetItem.assignedMemberIds = targetItem.assignedMemberIds.filter((id) => id !== memberId);
    } else {
      targetItem.assignedMemberIds = [...targetItem.assignedMemberIds, memberId];
    }
    setItems(updated);
  };

  const handleSave = () => {
    setShowValidationErrors(true);
    if (!validation.isValid) {
      return;
    }
    onSaveItemizedSplit({
      items,
      surcharge: hasSurcharge && surcharge.amount > 0 ? surcharge : null,
    });
    onClose();
  };

  const isMatched = validation.difference === 0;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="itemized-split-title"
    >
      <div className="w-full max-w-[1240px] my-6 bg-bg-canvas rounded-[24px] shadow-2xl border border-divider-border overflow-hidden flex flex-col">
        {/* Top Header Bar */}
        <div className="bg-white border-b border-divider-border px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-cerulean hover:text-baltic-blue transition-colors mb-1 group"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>{LABELS.ITEM_SPLIT.CANCEL_BACK}</span>
            </button>
            <h2 id="itemized-split-title" className="text-xl sm:text-2xl font-bold text-yale-blue tracking-tight">
              {LABELS.ITEM_SPLIT.TITLE}
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-0.5">
              {LABELS.ITEM_SPLIT.SUBTITLE}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Tổng hóa đơn:</span>
            <span className="text-lg font-bold text-yale-blue tabular-nums">
              {formatMoney(totalAmount)}
            </span>
          </div>
        </div>

        {/* 2-Column Responsive Body */}
        <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* CỘT TRÁI (4 COLS): Xem trước ảnh hóa đơn & Đối soát */}
          <aside className="lg:col-span-4 w-full flex flex-col gap-4">
            <div className="bg-white rounded-[20px] p-5 shadow-sm border border-divider-border flex flex-col gap-4">
              <div>
                <h3 className="text-base font-bold text-yale-blue flex items-center gap-1.5">
                  <svg className="w-5 h-5 text-cerulean" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{expenseTitle || "Khoản chi chưa đặt tên"}</span>
                </h3>
                {locationName && (
                  <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span>{locationName}</span>
                  </p>
                )}
              </div>

              {/* Receipt Preview Container */}
              <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-surface-container-low border border-divider-border flex items-center justify-center group">
                {receiptImageUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={receiptImageUrl}
                      alt="Ảnh hóa đơn đính kèm"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-yale-blue/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-4">
                      {onOpenReceiptLightbox && (
                        <button
                          type="button"
                          onClick={() => onOpenReceiptLightbox(receiptImageUrl)}
                          className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-yale-blue text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm hover:bg-white transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                          <span>{LABELS.ITEM_SPLIT.ZOOM_RECEIPT}</span>
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center text-text-muted flex flex-col items-center gap-2">
                    <svg className="w-10 h-10 text-ocean-mist/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs">Chưa có ảnh hóa đơn đính kèm</span>
                  </div>
                )}
              </div>

              {/* Đối soát trạng thái */}
              <div className="bg-surface-container-low rounded-xl p-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-text-muted">{LABELS.ITEM_SPLIT.TOTAL_BILL}</span>
                  <span className="text-sm font-bold text-yale-blue tabular-nums">
                    {formatMoney(totalAmount)}
                  </span>
                </div>

                <div className="pt-2 border-t border-divider-border/60 flex items-center justify-between">
                  {isMatched ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald/20 text-functional-positive text-xs font-semibold">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Khớp {items.length} món</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-functional-warning-bg text-functional-warning text-xs font-semibold">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Lệch {formatMoney(Math.abs(validation.difference))}</span>
                    </span>
                  )}
                  <span className="text-xs text-text-muted">
                    {isMatched ? "100% chính xác" : "Chưa khớp"}
                  </span>
                </div>
              </div>

              {/* Hộp gợi ý thân thiện */}
              <div className="rounded-xl bg-functional-warning-bg/60 p-3 flex items-start gap-2.5 text-functional-warning text-xs leading-relaxed">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex flex-col gap-1">
                  <span>Tất cả các món đều có thể tích chọn nhiều người dùng. Chi phí món ăn sẽ được chia đều tự động.</span>
                  <span className="text-[11px] opacity-80">{LABELS.ITEM_SPLIT.SURCHARGE_LIMITATION_HINT}</span>
                </div>
              </div>
            </div>
          </aside>

          {/* CỘT PHẢI (8 COLS): Ma trận món ăn x Thành viên */}
          <section className="lg:col-span-8 w-full flex flex-col gap-5">
            {/* Header thanh công cụ món */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-yale-blue flex items-center gap-2">
                  <span>{LABELS.ITEM_SPLIT.MATRIX_TITLE}</span>
                  <span className="px-2 py-0.5 rounded-full bg-cerulean/15 text-cerulean text-xs font-bold">
                    {items.length} món
                  </span>
                </h3>
                <p className="text-xs text-text-muted">
                  {LABELS.ITEM_SPLIT.MATRIX_SUBTITLE}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                  className="text-xs"
                >
                  <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>{LABELS.ITEM_SPLIT.ADD_ITEM}</span>
                </Button>

                {!hasSurcharge && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setHasSurcharge(true);
                      setSurcharge({ name: LABELS.ITEM_SPLIT.SURCHARGE_DEFAULT_NAME, amount: 0 });
                    }}
                    className="text-xs"
                  >
                    <svg className="w-3.5 h-3.5 mr-1 text-cerulean" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                    </svg>
                    <span>{LABELS.ITEM_SPLIT.ADD_SURCHARGE}</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Thông báo lỗi tổng quát nếu có */}
            {showValidationErrors && !validation.isValid && (
              <div className="p-3.5 rounded-xl bg-functional-negative/10 border border-functional-negative/20 text-functional-negative text-xs flex items-start gap-2">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex flex-col gap-0.5">
                  {validation.errors.reconciliation && (
                    <span className="font-semibold">{validation.errors.reconciliation}</span>
                  )}
                  {validation.errors.items && <span>{validation.errors.items}</span>}
                  {validation.errors.surcharge && <span>{validation.errors.surcharge}</span>}
                </div>
              </div>
            )}

            {/* BẢNG MA TRẬN MÓN ĂN */}
            <div className="bg-white rounded-[20px] shadow-sm border border-divider-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[620px]">
                  <thead>
                    <tr className="bg-surface-container-low text-text-muted uppercase text-[11px] font-bold tracking-wider select-none border-b border-divider-border">
                      <th className="py-3.5 px-4 w-[42%]" scope="col">
                        Món / Chi phí
                      </th>
                      {activeMembers.map((member) => (
                        <th key={member.id} className="py-3 px-2 text-center" scope="col">
                          <div className="flex flex-col items-center">
                            <div className="relative">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${
                                  member.isCurrentUser
                                    ? "bg-light-green text-yale-blue ring-2 ring-cerulean"
                                    : member.isNoAccount
                                    ? "bg-white text-yale-blue border border-dashed border-ocean-mist"
                                    : "bg-lime-cream text-yale-blue"
                                }`}
                              >
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                              {member.isCurrentUser && (
                                <span className="absolute -top-1 -right-2 px-1 bg-cerulean text-white text-[9px] font-bold rounded-full leading-tight">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <span className="mt-1 text-xs font-semibold text-yale-blue truncate max-w-[60px]" title={member.name}>
                              {member.name}
                            </span>
                            {member.isNoAccount && (
                              <span className="text-[9px] text-text-muted leading-tight whitespace-nowrap">
                                Chưa có TK
                              </span>
                            )}
                          </div>
                        </th>
                      ))}
                      <th className="py-3 px-2 text-center w-10" scope="col">
                        <span className="sr-only">Xóa</span>
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-divider-border/60 text-sm">
                    {/* Danh sách các món ăn */}
                    {items.map((item, index) => {
                      const assignedCount = item.assignedMemberIds.length;
                      const perPersonEstimate =
                        assignedCount > 0 && item.amount > 0 ? Math.floor(item.amount / assignedCount) : 0;
                      const itemErr = validation.errors.itemsList?.[item.id];

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-hover-row transition-colors group"
                        >
                          <td className="py-3 px-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => handleUpdateItemName(index, e.target.value)}
                                  placeholder={`Tên món ${index + 1}`}
                                  className="w-full text-sm font-semibold text-yale-blue bg-transparent border-b border-transparent hover:border-divider-border focus:border-cerulean focus:bg-white px-1 py-0.5 rounded transition-colors focus:outline-none"
                                />
                                <div className="flex items-center shrink-0">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatMoneyInputValue(item.amount)}
                                    onChange={(e) => handleUpdateItemAmount(index, e.target.value)}
                                    placeholder="0"
                                    className="w-28 text-right font-bold text-sm text-cerulean bg-surface-container-low hover:bg-surface-container focus:bg-white border border-divider-border focus:border-cerulean rounded-lg px-2 py-1 tabular-nums transition-colors focus:outline-none"
                                  />
                                  <span className="text-xs text-text-muted ml-1">₫</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-text-muted px-1">
                                {assignedCount > 0 ? (
                                  <span className="text-functional-positive font-medium">
                                    {formatMoney(perPersonEstimate)} / người ({assignedCount} người)
                                  </span>
                                ) : (
                                  <span className="text-functional-negative">
                                    Chưa chọn ai (0 người)
                                  </span>
                                )}
                              </div>

                              {showValidationErrors && itemErr && (
                                <div className="text-[11px] text-functional-negative px-1">
                                  {itemErr.name || itemErr.amount || itemErr.members}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Checkboxes thành viên cho món này */}
                          {activeMembers.map((member) => {
                            const isChecked = item.assignedMemberIds.includes(member.id);
                            return (
                              <td key={member.id} className="py-3 px-2 text-center">
                                <label className="inline-flex items-center justify-center cursor-pointer p-1">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleMember(index, member.id)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-6 h-6 rounded-lg bg-surface-container border border-divider-border peer-checked:bg-cerulean peer-checked:border-cerulean flex items-center justify-center text-white transition-all shadow-xs peer-focus:ring-2 peer-focus:ring-ocean-mist">
                                    <svg
                                      className={`w-3.5 h-3.5 transition-opacity ${isChecked ? "opacity-100" : "opacity-0"}`}
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                </label>
                              </td>
                            );
                          })}

                          {/* Nút xóa món */}
                          <td className="py-3 px-2 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                aria-label="Xóa món"
                                className="text-text-muted hover:text-functional-negative transition-colors p-1 rounded-md hover:bg-functional-warning-bg"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}

                    {/* DÒNG ĐẶC BIỆT: THUẾ & PHÍ DỊCH VỤ */}
                    {hasSurcharge && (
                      <tr className="bg-surface-container-low/70 border-t-2 border-divider-border">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-cerulean/15 text-cerulean flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold">%</span>
                            </div>
                            <div className="flex flex-col flex-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={surcharge.name}
                                  onChange={(e) => setSurcharge({ ...surcharge, name: e.target.value })}
                                  placeholder="Thuế & phí dịch vụ"
                                  className="w-full text-sm font-bold text-yale-blue bg-transparent border-b border-transparent hover:border-divider-border focus:border-cerulean focus:bg-white px-1 py-0.5 rounded transition-colors focus:outline-none"
                                />
                                <div className="flex items-center shrink-0">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={formatMoneyInputValue(surcharge.amount)}
                                    onChange={(e) => {
                                      const p = parseMoneyInput(e.target.value);
                                      setSurcharge({ ...surcharge, amount: p !== null ? p : 0 });
                                    }}
                                    placeholder="0"
                                    className="w-28 text-right font-bold text-sm text-cerulean bg-white border border-divider-border focus:border-cerulean rounded-lg px-2 py-1 tabular-nums transition-colors focus:outline-none"
                                  />
                                  <span className="text-xs text-text-muted ml-1">₫</span>
                                </div>
                              </div>
                              <span className="text-[11px] text-cerulean font-medium px-1 mt-0.5">
                                {LABELS.ITEM_SPLIT.SURCHARGE_HINT}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Checkbox tự động theo người tham gia hóa đơn */}
                        {activeMembers.map((member) => {
                          const mShare = memberSharesMap.get(member.id);
                          const isParticipant = (mShare?.count || 0) > 0;
                          return (
                            <td key={member.id} className="py-3 px-2 text-center">
                              <div
                                className={`w-6 h-6 mx-auto rounded-lg flex items-center justify-center text-xs transition-colors ${
                                  isParticipant
                                    ? "bg-cerulean/20 text-cerulean font-bold"
                                    : "bg-surface-container/50 text-text-muted/40"
                                }`}
                                title={isParticipant ? "Tham gia chịu phụ phí" : "Không ăn món nào nên không chịu phụ phí"}
                              >
                                {isParticipant ? "✓" : "—"}
                              </div>
                            </td>
                          );
                        })}

                        {/* Nút xóa dòng phụ phí */}
                        <td className="py-3 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setHasSurcharge(false);
                              setSurcharge({ name: LABELS.ITEM_SPLIT.SURCHARGE_DEFAULT_NAME, amount: 0 });
                            }}
                            aria-label="Xóa phụ phí"
                            className="text-text-muted hover:text-functional-negative transition-colors p-1 rounded-md"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* THẺ TẠM TÍNH MỖI NGƯỜI CẦN TRẢ (SUMMARY CARD) */}
            <div className="bg-white rounded-[20px] p-5 shadow-sm border border-divider-border flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-divider-border">
                <h4 className="text-sm font-bold text-yale-blue flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-cerulean" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  <span>{LABELS.ITEM_SPLIT.SUMMARY_TITLE}</span>
                </h4>

                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    isMatched
                      ? "bg-emerald/15 text-functional-positive"
                      : "bg-functional-warning-bg text-functional-warning"
                  }`}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isMatched ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    )}
                  </svg>
                  <span>
                    {isMatched
                      ? `Tổng khớp hóa đơn (${formatMoney(totalAmount)})`
                      : `Tổng lệch: ${formatMoney(Math.abs(validation.difference))}`}
                  </span>
                </div>
              </div>

              {/* Lưới các thẻ thành viên */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                {activeMembers.map((member) => {
                  const mShare = memberSharesMap.get(member.id) || { totalAmount: 0, count: 0 };
                  return (
                    <div
                      key={member.id}
                      className="bg-surface-container-low rounded-xl p-3 flex flex-col items-center text-center hover:bg-hover-row transition-colors relative"
                    >
                      {member.isCurrentUser && (
                        <div className="w-full h-1 bg-cerulean absolute top-0 left-0 rounded-t-xl" />
                      )}
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-1 shadow-xs ${
                          member.isCurrentUser
                            ? "bg-light-green text-yale-blue"
                            : member.isNoAccount
                            ? "bg-white text-yale-blue border border-dashed border-ocean-mist"
                            : "bg-lime-cream text-yale-blue"
                        }`}
                      >
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs font-semibold text-yale-blue truncate w-full" title={member.name}>
                        {member.name} {member.isCurrentUser && <span className="text-[10px] text-cerulean">(Bạn)</span>}
                      </span>
                      <span className="text-[11px] text-text-muted mt-0.5">
                        {mShare.count} món
                      </span>
                      <span className="text-sm font-bold text-cerulean tabular-nums mt-1">
                        {formatMoney(mShare.totalAmount)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Dòng công thức chú thích */}
              <div className="pt-2 text-xs text-text-muted flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-t border-divider-border/60">
                <span>{LABELS.ITEM_SPLIT.FORMULA_HINT}</span>
                <span className="font-semibold text-yale-blue">
                  Tổng hóa đơn: {formatMoney(totalAmount)}
                </span>
              </div>
            </div>

            {/* CHÂN TRANG THAO TÁC */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-text-muted hover:text-functional-negative text-sm"
              >
                <span>{LABELS.ITEM_SPLIT.CANCEL_BACK}</span>
              </Button>

              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                disabled={!isMatched}
                className="px-6 text-sm"
              >
                <span>{LABELS.ITEM_SPLIT.SAVE_DONE}</span>
                <svg className="w-4 h-4 ml-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
