"use client";

import * as React from "react";
import {
  Utensils,
  Bike,
  Hotel,
  Ticket,
  ShoppingBag,
  Sparkles,
  Receipt,
  MapPin,
  Users,
  Pencil,
  Trash2,
} from "lucide-react";
import { TripExpense, ExpenseCategory, TripMember } from "@/types/trip";
import { formatMoney } from "@/lib/money/format";
import { ExpenseRowView, toExpenseRowView } from "@/lib/view/expense-row";
import { getExpenseCategoryColorClasses } from "@/lib/labels";

interface TripExpenseRowProps {
  expense: ExpenseRowView | TripExpense;
  members?: readonly TripMember[];
  currentUserId?: string;
  onViewReceipt: (expense: TripExpense) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (expense: TripExpense) => void;
  onDelete?: (expense: TripExpense) => void;
}

export function TripExpenseRow({
  expense,
  members = [],
  currentUserId,
  onViewReceipt,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}: TripExpenseRowProps) {
  // Chuẩn hóa sang ExpenseRowView nếu đầu vào là TripExpense
  const rowView: ExpenseRowView = React.useMemo(() => {
    if ("categoryLabel" in expense && "paidByName" in expense && "splitMethodText" in expense) {
      return expense as ExpenseRowView;
    }
    return toExpenseRowView(expense as TripExpense, members, currentUserId);
  }, [expense, members, currentUserId]);

  const renderCategoryIcon = (cat: ExpenseCategory) => {
    switch (cat) {
      case "FOOD":
        return <Utensils className="w-4 h-4 text-functional-warning" />;
      case "TRANSPORT":
        return <Bike className="w-4 h-4 text-cerulean" />;
      case "LODGING":
        return <Hotel className="w-4 h-4 text-yale-blue" />;
      case "TICKET":
        return <Ticket className="w-4 h-4 text-tropical-teal" />;
      case "SHOPPING":
        return <ShoppingBag className="w-4 h-4 text-amber-600" />;
      case "OTHER":
      default:
        return <Sparkles className="w-4 h-4 text-ocean-mist" />;
    }
  };

  const renderCategoryBg = (cat: ExpenseCategory) => {
    return getExpenseCategoryColorClasses(cat).bg;
  };

  const sharesList = rowView.shares || [];
  const userShare = rowView.userShare || sharesList.find((s) => s.memberId === currentUserId);
  const receipt = rowView.receiptImageUrl;
  const locationText = rowView.locationName;
  const totalMoney = rowView.amount || 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 hover:bg-hover-row/70 transition-colors border-b border-border-hairline last:border-b-0 gap-3">
      {/* Left: Icon + Title + Location + Metadata */}
      <div className="flex items-start gap-3.5 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${renderCategoryBg(
            rowView.category
          )}`}
        >
          {renderCategoryIcon(rowView.category)}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-yale-blue text-sm sm:text-base leading-snug">
              {rowView.title}
            </span>

            {/* Receipt Button if attached */}
            {receipt && (
              <button
                type="button"
                onClick={() => onViewReceipt(expense as TripExpense)}
                title="Xem hóa đơn đính kèm"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cerulean/10 text-cerulean hover:bg-cerulean/20 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span className="text-[11px]">Hóa đơn</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs text-text-muted mt-1 font-medium">
            <span className="text-yale-blue font-semibold">{rowView.categoryLabel}</span>
            {locationText && (
              <>
                <span className="text-border-hairline" aria-hidden="true">•</span>
                <span className="flex items-center gap-0.5 text-text-muted truncate max-w-[180px]">
                  <MapPin className="w-3 h-3 text-ocean-mist shrink-0" />
                  <span className="truncate">{locationText}</span>
                </span>
              </>
            )}
            <span className="text-border-hairline" aria-hidden="true">•</span>
            <span>
              Người trả: <strong className="text-yale-blue">{rowView.paidByName}</strong>
            </span>
            <span className="text-border-hairline" aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1 text-cerulean">
              <Users className="w-3 h-3" />
              <span>{rowView.splitMethodText}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right: Amounts, Shares & Action Buttons */}
      <div className="flex sm:flex-row items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-13 sm:pl-0 shrink-0">
        <div className="flex flex-col items-start sm:items-end justify-center">
          <div className="text-base sm:text-lg font-bold text-yale-blue tabular-nums">
            {formatMoney(totalMoney)}
          </div>
          {userShare ? (
            <div className="text-xs text-text-muted">
              Bản thân:{" "}
              <span className="font-semibold text-cerulean tabular-nums">
                {formatMoney(userShare.amount)}
              </span>
              {userShare.hasRemainderExtra && (
                <span
                  className="ml-1 text-[10px] text-tropical-teal font-semibold"
                  title="Được phân bổ +1 ₫ lẻ do phép chia nguyên có phần dư"
                >
                  (+1 ₫)
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-text-muted italic">Không tham gia chia</div>
          )}
        </div>

        {/* Edit / Delete Buttons */}
        {(canEdit || canDelete) && (
          <div className="flex items-center gap-1 border-l border-border-hairline pl-2.5">
            {canEdit && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(expense as TripExpense)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-cerulean hover:bg-hover-row transition-colors cursor-pointer"
                title="Chỉnh sửa khoản chi"
                aria-label="Chỉnh sửa khoản chi"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(expense as TripExpense)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-text-muted hover:text-functional-negative hover:bg-functional-warning-bg transition-colors cursor-pointer"
                title="Xóa khoản chi"
                aria-label="Xóa khoản chi"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
