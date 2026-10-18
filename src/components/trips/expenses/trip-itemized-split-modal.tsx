"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Plus,
  Percent,
  Trash2,
  ZoomIn,
  Info,
  AlertCircle,
  CheckCircle2,
  Check,
  Receipt,
  MapPin,
  UtensilsCrossed,
} from "lucide-react";
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

export interface TripItemizedSplitViewProps {
  onBackToStep1: () => void;
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

export function TripItemizedSplitView({
  onBackToStep1,
  onSaveItemizedSplit,
  expenseTitle,
  totalAmount,
  locationName,
  receiptImageUrl,
  tripMembers,
  initialItems,
  initialSurcharge,
  onOpenReceiptLightbox,
}: TripItemizedSplitViewProps) {
  // Lọc chỉ các thành viên ACTIVE theo thứ tự joinOrder
  const activeMembers = useMemo(
    () =>
      tripMembers
        .filter((m) => m.status === "ACTIVE")
        .sort((a, b) => a.joinOrder - b.joinOrder),
    [tripMembers]
  );

  // Khởi tạo danh sách món ban đầu
  const [items, setItems] = useState<ExpenseItemData[]>(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems;
    }
    // Mặc định tạo 2 món mẫu khớp chính xác totalAmount để trải nghiệm ban đầu luôn cân bằng
    if (totalAmount <= 0) {
      return [
        {
          id: `item_${Date.now()}_1`,
          name: "Món 1",
          amount: 0,
          assignedMemberIds: activeMembers.map((m) => m.id),
        },
      ];
    }
    const part1 = Math.floor(totalAmount * 0.7);
    const part2 = totalAmount - part1;
    if (part2 > 0) {
      return [
        {
          id: `item_${Date.now()}_1`,
          name: "Món chính",
          amount: part1,
          assignedMemberIds: activeMembers.map((m) => m.id),
        },
        {
          id: `item_${Date.now()}_2`,
          name: "Đồ uống / Món phụ",
          amount: part2,
          assignedMemberIds: activeMembers.map((m) => m.id),
        },
      ];
    }
    return [
      {
        id: `item_${Date.now()}_1`,
        name: "Món ăn",
        amount: totalAmount,
        assignedMemberIds: activeMembers.map((m) => m.id),
      },
    ];
  });

  // Khởi tạo phụ phí VAT / dịch vụ
  const [hasSurcharge, setHasSurcharge] = useState<boolean>(() => {
    return (
      initialSurcharge !== undefined &&
      initialSurcharge !== null &&
      initialSurcharge.amount > 0
    );
  });

  const [surcharge, setSurcharge] = useState<ExpenseSurchargeData>(() => {
    if (initialSurcharge) return initialSurcharge;
    return {
      name: LABELS.ITEM_SPLIT.SURCHARGE_DEFAULT_NAME,
      amount: 0,
    };
  });

  // State hiển thị lỗi validation khi người dùng bấm Lưu
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

  const isMatched = validation.difference === 0;

  // Tính toán kết quả phân bổ tạm tính cho từng thành viên
  const memberSharesMap = useMemo(() => {
    try {
      if (isMatched && validation.isValid) {
        const results = computeItemizedShares(
          totalAmount,
          items,
          hasSurcharge ? surcharge : null,
          activeMembers
        );
        const map = new Map<
          string,
          { itemsAmount: number; surchargeAmount: number; totalAmount: number; count: number }
        >();
        results.forEach((r) => {
          map.set(r.memberId, {
            itemsAmount: r.itemsAmount,
            surchargeAmount: r.surchargeAmount,
            totalAmount: r.totalAmount,
            count: r.assignedItemCount,
          });
        });
        return map;
      }
    } catch {
      // Bỏ qua lỗi đối soát khi đang gõ dở, chuyển sang chế độ tạm tính
    }

    // Khi tổng các món chưa khớp totalAmount, tính toán tạm tính để hiển thị tức thời cho người dùng
    const map = new Map<
      string,
      { itemsAmount: number; surchargeAmount: number; totalAmount: number; count: number }
    >();

    items.forEach((item) => {
      const count = item.assignedMemberIds.length;
      if (count > 0 && item.amount > 0) {
        const perPerson = Math.floor(item.amount / count);
        item.assignedMemberIds.forEach((mId) => {
          const current = map.get(mId) || {
            itemsAmount: 0,
            surchargeAmount: 0,
            totalAmount: 0,
            count: 0,
          };
          current.itemsAmount += perPerson;
          current.count += 1;
          map.set(mId, current);
        });
      }
    });

    if (hasSurcharge && surcharge.amount > 0) {
      const participatingMemberIds = activeMembers.filter(
        (m) => (map.get(m.id)?.count || 0) > 0
      );
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
  }, [totalAmount, items, hasSurcharge, surcharge, activeMembers, isMatched, validation.isValid]);

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
    if (!validation.isValid || !isMatched) {
      return;
    }
    onSaveItemizedSplit({
      items,
      surcharge: hasSurcharge && surcharge.amount > 0 ? surcharge : null,
    });
    onBackToStep1();
  };

  return (
    <div className="w-full flex flex-col bg-bg-canvas text-yale-blue">
      {/* Top Header Bar with Breadcrumb and Step Indicator */}
      <div className="bg-white border-b border-border-hairline px-4 sm:px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={onBackToStep1}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-cerulean hover:text-baltic-blue transition-colors mb-1 group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span>{LABELS.ITEM_SPLIT.CANCEL_BACK} (Bước 1)</span>
          </button>
          <div className="flex items-center gap-2">
            <h2 id="itemized-split-title" className="text-lg sm:text-xl font-bold text-yale-blue tracking-tight">
              Thêm khoản chi &gt; {LABELS.ITEM_SPLIT.TITLE}
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cerulean/15 text-cerulean font-bold">
              Bước 2 / 2
            </span>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {LABELS.ITEM_SPLIT.SUBTITLE}
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center bg-surface-container/60 px-3 py-1.5 rounded-xl border border-border-hairline">
          <span className="text-xs text-text-muted font-medium">{LABELS.ITEM_SPLIT.TOTAL_BILL}:</span>
          <span className="text-base sm:text-lg font-bold text-cerulean tabular-nums">
            {formatMoney(totalAmount)}
          </span>
        </div>
      </div>

      {/* 2-Column Responsive Body */}
      <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI (4 COLS): Xem trước ảnh hóa đơn & Đối soát */}
        <aside className="lg:col-span-4 w-full flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-border-hairline flex flex-col gap-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-yale-blue flex items-center gap-1.5 truncate">
                <UtensilsCrossed className="w-4 h-4 text-cerulean shrink-0" />
                <span className="truncate">{expenseTitle || "Khoản chi mới"}</span>
              </h3>
              {locationName && (
                <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-ocean-mist shrink-0" />
                  <span className="truncate">{locationName}</span>
                </p>
              )}
            </div>

            {/* Receipt Preview Container */}
            <div className="relative w-full aspect-[4/3] sm:aspect-[3/4] rounded-xl overflow-hidden bg-surface-container border border-border-hairline flex items-center justify-center group">
              {receiptImageUrl ? (
                <>
                  <Image
                    src={receiptImageUrl}
                    alt="Ảnh hóa đơn đính kèm"
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-yale-blue/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3">
                    {onOpenReceiptLightbox && (
                      <button
                        type="button"
                        onClick={() => onOpenReceiptLightbox(receiptImageUrl)}
                        className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-yale-blue text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs hover:bg-white transition-colors cursor-pointer"
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-cerulean" />
                        <span>{LABELS.ITEM_SPLIT.ZOOM_RECEIPT}</span>
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="p-6 text-center text-text-muted flex flex-col items-center gap-2">
                  <Receipt className="w-8 h-8 text-ocean-mist/50" />
                  <span className="text-xs">Chưa đính kèm ảnh hóa đơn</span>
                  <span className="text-[11px] text-text-muted/70">
                    (Có thể đính kèm ở Bước 1)
                  </span>
                </div>
              )}
            </div>

            {/* Đối soát trạng thái */}
            <div className="bg-surface-container rounded-xl p-3.5 flex flex-col gap-2 border border-border-hairline">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-text-muted">{LABELS.ITEM_SPLIT.TOTAL_BILL}</span>
                <span className="text-sm font-bold text-yale-blue tabular-nums">
                  {formatMoney(totalAmount)}
                </span>
              </div>

              <div className="pt-2 border-t border-border-hairline/80 flex items-center justify-between">
                {isMatched ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-light-green/40 text-functional-positive text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Khớp {items.length} món</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-functional-warning-bg text-functional-warning text-xs font-bold border border-functional-warning/30">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      {validation.difference > 0
                        ? `Thừa ${formatMoney(Math.abs(validation.difference))}`
                        : `Thiếu ${formatMoney(Math.abs(validation.difference))}`}
                    </span>
                  </span>
                )}
                <span className="text-xs font-medium text-text-muted">
                  {isMatched ? "100% khớp hóa đơn" : "Chưa cân bằng"}
                </span>
              </div>
            </div>

            {/* Hộp gợi ý công thức và hạn chế đã biết */}
            <div className="rounded-xl bg-functional-warning-bg/70 border border-functional-warning/20 p-3 flex items-start gap-2 text-functional-warning text-xs leading-relaxed">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-functional-warning" />
              <div className="flex flex-col gap-1">
                <span className="font-semibold">{LABELS.ITEM_SPLIT.FORMULA_HINT}</span>
                <span className="text-[11px] text-text-muted opacity-90">
                  {LABELS.ITEM_SPLIT.SURCHARGE_LIMITATION_HINT}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* CỘT PHẢI (8 COLS): Ma trận món ăn x Thành viên */}
        <section className="lg:col-span-8 w-full flex flex-col gap-5">
          {/* Header thanh công cụ món */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-yale-blue flex items-center gap-2">
                <span>{LABELS.ITEM_SPLIT.MATRIX_TITLE}</span>
                <span className="px-2 py-0.5 rounded-full bg-cerulean/15 text-cerulean text-xs font-bold">
                  {items.length} món
                </span>
              </h3>
              <p className="text-xs text-text-muted">
                {LABELS.ITEM_SPLIT.MATRIX_SUBTITLE}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleAddItem}
                className="h-9 px-3.5 rounded-xl bg-white border border-border-hairline hover:bg-hover-row text-cerulean text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{LABELS.ITEM_SPLIT.ADD_ITEM}</span>
              </button>

              {!hasSurcharge && (
                <button
                  type="button"
                  onClick={() => {
                    setHasSurcharge(true);
                    setSurcharge({
                      name: LABELS.ITEM_SPLIT.SURCHARGE_DEFAULT_NAME,
                      amount: 0,
                    });
                  }}
                  className="h-9 px-3.5 rounded-xl bg-white border border-border-hairline hover:bg-hover-row text-cerulean text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Percent className="w-3.5 h-3.5" />
                  <span>{LABELS.ITEM_SPLIT.ADD_SURCHARGE}</span>
                </button>
              )}
            </div>
          </div>

          {/* Thông báo lỗi tổng quát nếu có khi bấm Lưu */}
          {showValidationErrors && !validation.isValid && (
            <div className="p-3.5 rounded-xl bg-functional-negative/10 border border-functional-negative/30 text-functional-negative text-xs flex items-start gap-2 shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-0.5">
                {validation.errors.reconciliation && (
                  <span className="font-bold">{validation.errors.reconciliation}</span>
                )}
                {validation.errors.items && <span>{validation.errors.items}</span>}
                {validation.errors.surcharge && <span>{validation.errors.surcharge}</span>}
              </div>
            </div>
          )}

          {/* BẢNG MA TRẬN MÓN ĂN */}
          <div className="bg-white rounded-2xl shadow-xs border border-border-hairline overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="bg-surface-container text-yale-blue uppercase text-[11px] font-bold tracking-wider select-none border-b border-border-hairline">
                    <th className="py-3 px-3 sm:px-4 w-[42%] min-w-[200px]" scope="col">
                      Món / Chi phí
                    </th>
                    {activeMembers.map((member) => (
                      <th key={member.id} className="py-3 px-2 text-center min-w-[70px]" scope="col">
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
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
                          <span
                            className="mt-1 text-xs font-semibold text-yale-blue truncate max-w-[65px]"
                            title={member.name}
                          >
                            {member.name}
                          </span>
                          {member.isNoAccount && (
                            <span className="text-[9px] text-functional-warning font-semibold leading-tight whitespace-nowrap">
                              {LABELS.SPECIAL.NO_ACCOUNT_SHORT}
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

                <tbody className="divide-y divide-border-hairline text-sm">
                  {/* Danh sách các món ăn */}
                  {items.map((item, index) => {
                    const assignedCount = item.assignedMemberIds.length;
                    const perPersonEstimate =
                      assignedCount > 0 && item.amount > 0
                        ? Math.floor(item.amount / assignedCount)
                        : 0;
                    const itemErr = validation.errors.itemsList?.[item.id];

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-hover-row/60 transition-colors group"
                      >
                        <td className="py-3 px-3 sm:px-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateItemName(index, e.target.value)}
                                placeholder={`Tên món ${index + 1}`}
                                className="w-full text-xs sm:text-sm font-semibold text-yale-blue bg-transparent border-b border-transparent hover:border-border-hairline focus:border-cerulean focus:bg-white px-1.5 py-1 rounded transition-colors focus:outline-none"
                              />
                              <div className="flex items-center shrink-0">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={formatMoneyInputValue(item.amount)}
                                  onChange={(e) => handleUpdateItemAmount(index, e.target.value)}
                                  placeholder="0"
                                  className="w-24 sm:w-28 text-right font-bold text-xs sm:text-sm text-cerulean bg-surface-container hover:bg-white focus:bg-white border border-border-hairline focus:border-cerulean rounded-lg px-2 py-1 tabular-nums transition-colors focus:outline-none"
                                />
                                <span className="text-xs text-text-muted ml-1 font-semibold">₫</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-text-muted px-1">
                              {assignedCount > 0 ? (
                                <span className="text-functional-positive font-medium">
                                  {formatMoney(perPersonEstimate)} / người ({assignedCount} người)
                                </span>
                              ) : (
                                <span className="text-functional-negative font-semibold">
                                  Chưa chọn ai (0 người)
                                </span>
                              )}
                            </div>

                            {showValidationErrors && itemErr && (
                              <div className="text-[11px] font-semibold text-functional-negative px-1">
                                {itemErr.name || itemErr.amount || itemErr.members}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Checkboxes thành viên cho món này (vùng chạm 44px thân thiện cảm ứng) */}
                        {activeMembers.map((member) => {
                          const isChecked = item.assignedMemberIds.includes(member.id);
                          return (
                            <td key={member.id} className="py-2 px-1 text-center">
                              <label className="inline-flex items-center justify-center cursor-pointer min-w-[44px] min-h-[44px]">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleMember(index, member.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-6 h-6 rounded-lg bg-surface-container border border-border-hairline peer-checked:bg-cerulean peer-checked:border-cerulean flex items-center justify-center text-white transition-all shadow-xs peer-focus:ring-2 peer-focus:ring-cerulean/30">
                                  <Check
                                    className={`w-3.5 h-3.5 stroke-[3] transition-opacity ${
                                      isChecked ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                </div>
                              </label>
                            </td>
                          );
                        })}

                        {/* Nút xóa món */}
                        <td className="py-2 px-2 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(index)}
                              aria-label="Xóa món"
                              className="text-text-muted hover:text-functional-negative transition-colors p-1.5 rounded-lg hover:bg-functional-negative/10 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* DÒNG ĐẶC BIỆT: THUẾ & PHÍ DỊCH VỤ (CHỈ ĐỌC CHO THÀNH VIÊN, KHÔNG CHECKBOX CÁ NHÂN) */}
                  {hasSurcharge && (
                    <tr className="bg-surface-container/70 border-t-2 border-border-hairline">
                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-cerulean/15 text-cerulean flex items-center justify-center shrink-0">
                            <Percent className="w-4 h-4" />
                          </div>
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={surcharge.name}
                                onChange={(e) =>
                                  setSurcharge({ ...surcharge, name: e.target.value })
                                }
                                placeholder="Thuế & phí dịch vụ"
                                className="w-full text-xs sm:text-sm font-bold text-yale-blue bg-transparent border-b border-transparent hover:border-border-hairline focus:border-cerulean focus:bg-white px-1.5 py-1 rounded transition-colors focus:outline-none"
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
                                  className="w-24 sm:w-28 text-right font-bold text-xs sm:text-sm text-cerulean bg-white border border-border-hairline focus:border-cerulean rounded-lg px-2 py-1 tabular-nums transition-colors focus:outline-none"
                                />
                                <span className="text-xs text-text-muted ml-1 font-semibold">₫</span>
                              </div>
                            </div>
                            <span className="text-[11px] text-cerulean font-medium px-1 mt-0.5">
                              {LABELS.ITEM_SPLIT.SURCHARGE_HINT}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Hiển thị tự động theo người tham gia hóa đơn: CHỈ ĐỌC, KHÔNG CÓ Ô TÍCH */}
                      {activeMembers.map((member) => {
                        const mShare = memberSharesMap.get(member.id);
                        const isParticipant = (mShare?.count || 0) > 0;
                        return (
                          <td key={member.id} className="py-2 px-1 text-center">
                            <div
                              className={`w-6 h-6 mx-auto rounded-lg flex items-center justify-center text-xs font-bold transition-colors select-none ${
                                isParticipant
                                  ? "bg-cerulean/20 text-cerulean"
                                  : "bg-surface-container text-text-muted/40"
                              }`}
                              title={
                                isParticipant
                                  ? "Tham gia chịu phụ phí (chia đều người có món)"
                                  : "Không ăn món nào nên không chịu phụ phí"
                              }
                            >
                              {isParticipant ? "✓" : "—"}
                            </div>
                          </td>
                        );
                      })}

                      {/* Nút xóa dòng phụ phí */}
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setHasSurcharge(false);
                            setSurcharge({
                              name: LABELS.ITEM_SPLIT.SURCHARGE_DEFAULT_NAME,
                              amount: 0,
                            });
                          }}
                          aria-label="Xóa phụ phí"
                          className="text-text-muted hover:text-functional-negative transition-colors p-1.5 rounded-lg hover:bg-functional-negative/10 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* THẺ TẠM TÍNH MỖI NGƯỜI CẦN TRẢ (SUMMARY CARD) */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-border-hairline flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border-hairline">
              <h4 className="text-xs sm:text-sm font-bold text-yale-blue flex items-center gap-1.5">
                <UtensilsCrossed className="w-4 h-4 text-cerulean" />
                <span>{LABELS.ITEM_SPLIT.SUMMARY_TITLE}</span>
              </h4>

              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isMatched
                    ? "bg-light-green/30 text-functional-positive"
                    : "bg-functional-warning-bg text-functional-warning border border-functional-warning/30"
                }`}
              >
                {isMatched ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>
                  {isMatched
                    ? `Tổng khớp hóa đơn (${formatMoney(totalAmount)})`
                    : `Lệch: ${formatMoney(Math.abs(validation.difference))} (${
                        validation.difference > 0 ? "Thừa" : "Thiếu"
                      })`}
                </span>
              </div>
            </div>

            {/* Lưới các thẻ thành viên (Responsive 5 cols desktop, 3 cols tablet, 2 cols mobile) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {activeMembers.map((member) => {
                const mShare = memberSharesMap.get(member.id) || { totalAmount: 0, count: 0 };
                return (
                  <div
                    key={member.id}
                    className="bg-surface-container rounded-xl p-3 flex flex-col items-center text-center hover:bg-hover-row transition-colors relative border border-border-hairline/60"
                  >
                    {member.isCurrentUser && (
                      <div className="w-full h-1 bg-cerulean absolute top-0 left-0 rounded-t-xl" />
                    )}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs mb-1 shadow-xs ${
                        member.isCurrentUser
                          ? "bg-light-green text-yale-blue ring-1 ring-cerulean"
                          : member.isNoAccount
                          ? "bg-white text-yale-blue border border-dashed border-ocean-mist"
                          : "bg-lime-cream text-yale-blue"
                      }`}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span
                      className="text-xs font-bold text-yale-blue truncate w-full"
                      title={member.name}
                    >
                      {member.name}{" "}
                      {member.isCurrentUser && (
                        <span className="text-[10px] text-cerulean font-semibold">(Bạn)</span>
                      )}
                    </span>
                    <span className="text-[11px] text-text-muted mt-0.5 font-medium">
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
            <div className="pt-2 text-xs text-text-muted flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-t border-border-hairline">
              <span>{LABELS.ITEM_SPLIT.FORMULA_HINT}</span>
              <span className="font-bold text-yale-blue">
                Tổng hóa đơn: {formatMoney(totalAmount)}
              </span>
            </div>
          </div>

          {/* CHÂN TRANG THAO TÁC BƯỚC 2 */}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={onBackToStep1}
              className="h-10 px-4 rounded-xl bg-transparent hover:bg-hover-row text-text-muted hover:text-yale-blue text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <span>{LABELS.ITEM_SPLIT.CANCEL_BACK}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={!isMatched}
              className="h-10 px-6 rounded-xl bg-cerulean text-white hover:bg-baltic-blue disabled:bg-surface-container disabled:text-text-muted/60 disabled:cursor-not-allowed text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>{LABELS.ITEM_SPLIT.SAVE_DONE} (Quay về Bước 1)</span>
              <Check className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

// Modal bọc ngoài cho các ngữ cảnh độc lập (nếu cần mở riêng)
export interface TripItemizedSplitModalProps extends TripItemizedSplitViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TripItemizedSplitModal(props: TripItemizedSplitModalProps) {
  if (!props.isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="itemized-split-title"
    >
      <div className="w-full max-w-[1240px] my-6 bg-bg-canvas rounded-[24px] shadow-2xl border border-border-hairline overflow-hidden flex flex-col">
        <TripItemizedSplitView {...props} onBackToStep1={props.onClose} />
      </div>
    </div>
  );
}
