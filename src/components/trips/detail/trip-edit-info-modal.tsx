"use client";

import * as React from "react";
import { X, Calendar, MapPin, Wallet, Save, Archive, Info } from "lucide-react";
import { TripDetailData } from "@/types/trip";
import { formatMoneyInputValue, parseMoneyInput } from "@/lib/money/parse";
import { useToast } from "@/components/ui/toast";

interface TripEditInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: TripDetailData;
  onSave: (updates: {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    budgetAmount: number;
  }) => void;
  onArchive?: () => void;
}

export function TripEditInfoModal({
  isOpen,
  onClose,
  trip,
  onSave,
  onArchive,
}: TripEditInfoModalProps) {
  const { toast } = useToast();

  const [name, setName] = React.useState(trip.name);
  const [destination, setDestination] = React.useState(trip.destination || "");
  const [startDate, setStartDate] = React.useState(trip.startDate || "");
  const [endDate, setEndDate] = React.useState(trip.endDate || "");
  const [rawBudget, setRawBudget] = React.useState(() =>
    trip.budgetAmount ? formatMoneyInputValue(trip.budgetAmount) : ""
  );

  const [errors, setErrors] = React.useState<{
    name?: string;
    date?: string;
    budget?: string;
  }>({});

  const [confirmArchiveOpen, setConfirmArchiveOpen] = React.useState(false);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { name?: string; date?: string; budget?: string } = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      newErrors.name = "Vui lòng nhập tên chuyến đi";
    } else if (trimmedName.length < 2) {
      newErrors.name = "Tên chuyến đi phải có ít nhất 2 ký tự";
    }

    if (startDate && endDate && endDate < startDate) {
      newErrors.date = "Ngày kết thúc không được trước ngày bắt đầu";
    }

    const budget = parseMoneyInput(rawBudget) || 0;
    if (budget < 0 || budget > 2000000000) {
      newErrors.budget = "Ngân sách không hợp lệ (tối đa 2.000.000.000 ₫)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: trimmedName,
      destination: destination.trim(),
      startDate,
      endDate,
      budgetAmount: budget,
    });
    toast("Đã cập nhật thông tin chuyến đi thành công!", "success");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-yale-blue/45 backdrop-blur-[4px] animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-trip-title"
    >
      <div className="relative w-full max-w-[520px] bg-surface-card rounded-[24px] border border-divider-border shadow-[0_20px_48px_rgba(24,78,119,0.25)] flex flex-col p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-divider-border mb-5">
          <div>
            <h3 id="edit-trip-title" className="text-xl font-bold text-yale-blue">
              Chỉnh sửa thông tin chuyến đi
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Cập nhật tên, điểm đến, thời gian hoặc ngân sách dự kiến (UC23)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-yale-blue hover:bg-hover-row transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Trip Name */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tripName" className="text-xs font-semibold text-yale-blue">
              Tên chuyến đi <span className="text-functional-negative">*</span>
            </label>
            <input
              id="tripName"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
              }}
              className={`w-full h-11 px-3.5 rounded-xl bg-surface-card text-on-surface text-sm border shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-ocean-mist ${
                errors.name ? "border-functional-negative" : "border-divider-border"
              }`}
            />
            {errors.name && (
              <span className="text-xs text-functional-negative font-medium">{errors.name}</span>
            )}
          </div>

          {/* Destination */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tripDestination" className="text-xs font-semibold text-yale-blue">
              Điểm đến
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="tripDestination"
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="VD: Đà Lạt, Lâm Đồng"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-card text-on-surface text-sm border border-divider-border shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-ocean-mist"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="startDate" className="text-xs font-semibold text-yale-blue">
                Ngày bắt đầu
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (errors.date) setErrors((p) => ({ ...p, date: undefined }));
                  }}
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-card text-on-surface text-sm border border-divider-border shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-ocean-mist"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="endDate" className="text-xs font-semibold text-yale-blue">
                Ngày kết thúc
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (errors.date) setErrors((p) => ({ ...p, date: undefined }));
                  }}
                  className="w-full h-11 pl-10 pr-3 rounded-xl bg-surface-card text-on-surface text-sm border border-divider-border shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-ocean-mist"
                />
              </div>
            </div>
          </div>
          {errors.date && (
            <span className="text-xs text-functional-negative font-medium">{errors.date}</span>
          )}

          {/* Budget */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="tripBudget" className="text-xs font-semibold text-yale-blue">
              Ngân sách dự kiến (₫)
            </label>
            <div className="relative">
              <Wallet className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="tripBudget"
                type="text"
                value={rawBudget}
                onChange={(e) => {
                  const parsed = parseMoneyInput(e.target.value);
                  setRawBudget(parsed !== null ? formatMoneyInputValue(parsed) : "");
                  if (errors.budget) setErrors((p) => ({ ...p, budget: undefined }));
                }}
                placeholder="Nhập số tiền ngân sách (VD: 10.000.000)"
                className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-card text-yale-blue font-semibold text-sm border border-divider-border shadow-xs transition-all focus:outline-none focus:ring-2 focus:ring-ocean-mist"
              />
            </div>
            {errors.budget && (
              <span className="text-xs text-functional-negative font-medium">{errors.budget}</span>
            )}
          </div>

          {/* Archive option (UC24, R15) */}
          {onArchive && trip.status !== "ARCHIVED" && (
            <div className="mt-2 pt-3 border-t border-divider-border">
              {!confirmArchiveOpen ? (
                <button
                  type="button"
                  onClick={() => setConfirmArchiveOpen(true)}
                  className="text-xs text-text-muted hover:text-functional-warning flex items-center gap-1.5 cursor-pointer font-medium"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Lưu trữ chuyến đi này (UC24, Rule R15)</span>
                </button>
              ) : (
                <div className="p-3 bg-functional-warning-bg/70 rounded-xl border border-functional-warning/30 flex flex-col gap-2">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-functional-warning shrink-0 mt-0.5" />
                    <p className="text-xs text-yale-blue leading-relaxed">
                      Lưu trữ chuyến đi sẽ chuyển trạng thái sang <strong>ARCHIVED</strong>. Mọi thao tác thêm/sửa chi tiêu sẽ bị đóng băng. Bạn có chắc chắn?
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setConfirmArchiveOpen(false)}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-text-muted hover:bg-hover-row cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onArchive();
                        toast("Chuyến đi đã được lưu trữ (ARCHIVED).", "info");
                        onClose();
                      }}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-functional-warning text-white hover:bg-functional-warning/90 cursor-pointer shadow-xs"
                    >
                      Xác nhận lưu trữ
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-divider-border mt-3">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-5 rounded-xl text-text-muted font-semibold text-sm hover:bg-hover-row transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="h-11 px-6 rounded-xl bg-cerulean text-on-primary font-semibold text-sm hover:bg-baltic-blue shadow-sm transition-all flex items-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-ocean-mist"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thay đổi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
