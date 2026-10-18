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
} from "lucide-react";
import { TripExpense, ExpenseCategory } from "@/types/trip";
import { formatMoney } from "@/lib/utils";

interface TripExpenseRowProps {
  expense: TripExpense;
  currentUserId?: string;
  onViewReceipt: (expense: TripExpense) => void;
}

export function TripExpenseRow({
  expense,
  currentUserId = "mem-1", // Minh is current user
  onViewReceipt,
}: TripExpenseRowProps) {
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
        return <ShoppingBag className="w-4 h-4 text-[#D97706]" />;
      case "OTHER":
      default:
        return <Sparkles className="w-4 h-4 text-ocean-mist" />;
    }
  };

  const renderCategoryBg = (cat: ExpenseCategory) => {
    switch (cat) {
      case "FOOD":
        return "bg-functional-warning-bg";
      case "TRANSPORT":
        return "bg-cerulean/15";
      case "LODGING":
        return "bg-yale-blue/10";
      case "TICKET":
        return "bg-tropical-teal/15";
      case "SHOPPING":
        return "bg-amber-100";
      case "OTHER":
      default:
        return "bg-surface-container";
    }
  };

  // Find user's own share if participant
  const sharesList = expense.participants || expense.shares || [];
  const userShare = sharesList.find((p) => p.memberId === currentUserId);
  const receipt = expense.receiptUrl || expense.receiptImageUrl;
  const locationText = expense.location || expense.locationName;
  const totalMoney = expense.totalAmount || expense.amount || 0;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 hover:bg-hover-row/70 transition-colors border-b border-border-hairline last:border-b-0 gap-3">
      {/* Left: Icon + Title + Location + Metadata */}
      <div className="flex items-start gap-3.5 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${renderCategoryBg(
            expense.category
          )}`}
        >
          {renderCategoryIcon(expense.category)}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-yale-blue text-sm sm:text-base leading-snug">
              {expense.title}
            </span>

            {/* Receipt Button if attached */}
            {receipt && (
              <button
                type="button"
                onClick={() => onViewReceipt(expense)}
                title="Xem hóa đơn đính kèm"
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-cerulean/10 text-cerulean hover:bg-cerulean/20 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span className="text-[11px]">Hóa đơn</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap text-xs text-text-muted mt-1 font-medium">
            <span className="text-yale-blue font-semibold">{expense.categoryLabel}</span>
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
              Người trả: <strong className="text-yale-blue">{expense.paidByName}</strong>
            </span>
            <span className="text-border-hairline" aria-hidden="true">•</span>
            <span className="inline-flex items-center gap-1 text-cerulean">
              <Users className="w-3 h-3" />
              <span>{sharesList.length} người chia</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right: Amounts & Shares */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pl-13 sm:pl-0 shrink-0">
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
    </div>
  );
}
