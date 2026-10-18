"use client";

import * as React from "react";
import {
  Search,
  User,
  ChevronDown,
  Utensils,
  Bike,
  Hotel,
  Ticket,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { ExpenseFilterCategory, TripMember } from "@/types/trip";

interface TripExpenseFiltersProps {
  selectedCategory: ExpenseFilterCategory;
  onSelectCategory: (cat: ExpenseFilterCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedMemberId: string;
  onSelectMemberId: (memberId: string) => void;
  categoryCounts: Record<ExpenseFilterCategory, number>;
  members: TripMember[];
}

export function TripExpenseFilters({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  selectedMemberId,
  onSelectMemberId,
  categoryCounts,
  members,
}: TripExpenseFiltersProps) {
  const [memberDropdownOpen, setMemberDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMemberDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const CATEGORY_ITEMS: { id: ExpenseFilterCategory; label: string; icon?: React.ReactNode }[] = [
    { id: "ALL", label: "Tất cả" },
    {
      id: "FOOD",
      label: "Ăn uống",
      icon: <Utensils className="w-3.5 h-3.5" />,
    },
    {
      id: "TRANSPORT",
      label: "Di chuyển",
      icon: <Bike className="w-3.5 h-3.5" />,
    },
    {
      id: "LODGING",
      label: "Lưu trú",
      icon: <Hotel className="w-3.5 h-3.5" />,
    },
    {
      id: "TICKET",
      label: "Vé tham quan",
      icon: <Ticket className="w-3.5 h-3.5" />,
    },
    {
      id: "SHOPPING",
      label: "Mua sắm",
      icon: <ShoppingBag className="w-3.5 h-3.5" />,
    },
    {
      id: "OTHER",
      label: "Khác",
      icon: <Sparkles className="w-3.5 h-3.5" />,
    },
  ];

  const currentMemberLabel =
    selectedMemberId === "ALL"
      ? "Tất cả người trả"
      : members.find((m) => m.id === selectedMemberId)?.name || "Thành viên";

  return (
    <section className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
      {/* Category Filter Chips Horizontal Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_ITEMS.map((item) => {
          const isSelected = selectedCategory === item.id;
          const count = categoryCounts[item.id] || 0;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectCategory(item.id)}
              className={`h-9 px-3.5 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-cerulean text-white shadow-[0_2px_8px_rgba(26,117,159,0.25)]"
                  : "bg-white text-yale-blue hover:bg-hover-row border border-border-hairline shadow-[0_1px_4px_rgba(24,78,119,0.06)]"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[11px] font-bold ${
                  isSelected ? "bg-white/20 text-white" : "bg-surface-container text-text-muted"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Input & Member Filter Controls */}
      <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm theo tên, địa điểm..."
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-border-hairline text-yale-blue text-xs sm:text-sm placeholder:text-text-muted shadow-[0_1px_4px_rgba(24,78,119,0.06)] focus:outline-none focus:ring-2 focus:ring-cerulean/20 focus:border-cerulean transition-all"
          />
        </div>

        {/* Member Selector Dropdown */}
        <div className="relative min-w-[170px]" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setMemberDropdownOpen(!memberDropdownOpen)}
            className="w-full h-10 px-3 rounded-xl bg-white border border-border-hairline text-yale-blue text-xs sm:text-sm font-medium shadow-[0_1px_4px_rgba(24,78,119,0.06)] flex items-center justify-between gap-2 hover:bg-hover-row transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5 truncate">
              <User className="w-3.5 h-3.5 text-cerulean shrink-0" />
              <span className="truncate">{currentMemberLabel}</span>
            </span>
            <ChevronDown className="w-4 h-4 text-text-muted shrink-0" />
          </button>

          {memberDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-[0_4px_20px_rgba(24,78,119,0.12)] border border-border-hairline py-1.5 z-20 animate-fadeIn">
              <button
                type="button"
                onClick={() => {
                  onSelectMemberId("ALL");
                  setMemberDropdownOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm flex items-center justify-between transition-colors ${
                  selectedMemberId === "ALL"
                    ? "bg-surface-container text-cerulean font-bold"
                    : "text-yale-blue hover:bg-hover-row"
                }`}
              >
                <span>Tất cả người trả</span>
              </button>
              <div className="my-1 border-t border-border-hairline" />
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    onSelectMemberId(m.id);
                    setMemberDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm flex items-center justify-between transition-colors ${
                    selectedMemberId === m.id
                      ? "bg-surface-container text-cerulean font-bold"
                      : "text-yale-blue hover:bg-hover-row"
                  }`}
                >
                  <span className="truncate">{m.name}</span>
                  {(m.role === "HOST" || m.isHost) && (
                    <span className="text-[10px] bg-secondary-container text-on-secondary-container px-1.5 py-0.2 rounded font-semibold ml-1">
                      Trưởng nhóm
                    </span>
                  )}
                  {m.isNoAccount && (
                    <span className="text-[10px] text-functional-warning font-semibold ml-1">
                      Chưa có TK
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
