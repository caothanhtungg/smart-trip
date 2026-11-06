"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Compass,
  ArrowRight,
  Info,
  ShieldCheck,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { TripDatePicker } from "./trip-date-picker";
import { DestinationQuickPills } from "./destination-quick-pills";
import { DestinationMapPicker } from "./destination-map-picker";
import { BudgetPresetChips } from "./budget-preset-chips";
import { CreateTripPreviewModal } from "./create-trip-preview-modal";
import { ConfirmCancelModal } from "./confirm-cancel-modal";
import { CreateTripFormData, CreateTripValidationErrors } from "@/types/trip";
import { useTripsStore } from "@/lib/trips/trips-store-context";
import {
  calculateDurationText,
  parseMoneyInput,
  formatMoneyInputValue,
  validateCreateTripForm,
} from "@/lib/trip-form-validation";

export function CreateTripForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destParam = searchParams.get("destination");
  const { toast } = useToast();
  const { addTrip } = useTripsStore();

  // Form State
  const [formData, setFormData] = React.useState<CreateTripFormData>({
    name: destParam ? `Khám phá ${destParam}` : "",
    destination: destParam || "",
    startDate: "",
    endDate: "",
    budgetAmount: null,
  });

  const [prevDestParam, setPrevDestParam] = React.useState(destParam);
  if (destParam !== prevDestParam) {
    setPrevDestParam(destParam);
    if (destParam && !formData.destination) {
      setFormData((prev) => ({
        ...prev,
        destination: destParam,
        name: prev.name || `Khám phá ${destParam}`,
      }));
    }
  }

  const [errors, setErrors] = React.useState<CreateTripValidationErrors>({});
  const [previewModalOpen, setPreviewModalOpen] = React.useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Field refs for auto-focusing on first error
  const nameInputRef = React.useRef<HTMLInputElement>(null);
  const destinationInputRef = React.useRef<HTMLInputElement>(null);
  const budgetInputRef = React.useRef<HTMLInputElement>(null);

  // Check if form is dirty (has user input)
  const isDirty = React.useMemo(() => {
    return (
      formData.name.trim().length > 0 ||
      formData.destination.trim().length > 0 ||
      formData.startDate.length > 0 ||
      formData.endDate.length > 0 ||
      formData.budgetAmount !== null
    );
  }, [formData]);

  // Dynamic duration text calculation
  const durationText = React.useMemo(() => {
    return calculateDurationText(formData.startDate, formData.endDate);
  }, [formData.startDate, formData.endDate]);

  // Handle input change
  const handleChangeName = (value: string) => {
    setFormData((prev) => ({ ...prev, name: value }));
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleChangeDestination = (value: string) => {
    setFormData((prev) => ({ ...prev, destination: value }));
    if (errors.destination) {
      setErrors((prev) => ({ ...prev, destination: undefined }));
    }
  };

  const handleChangeStartDate = (isoDate: string) => {
    setFormData((prev) => {
      const next = { ...prev, startDate: isoDate };
      // If endDate is before startDate, adjust endDate or let validation flag it
      return next;
    });
    if (errors.startDate) {
      setErrors((prev) => ({ ...prev, startDate: undefined }));
    }
    // Re-check date range error if any
    if (errors.endDate) {
      setErrors((prev) => ({ ...prev, endDate: undefined }));
    }
  };

  const handleChangeEndDate = (isoDate: string) => {
    setFormData((prev) => ({ ...prev, endDate: isoDate }));
    if (errors.endDate) {
      setErrors((prev) => ({ ...prev, endDate: undefined }));
    }
  };

  const handleChangeBudgetRaw = (raw: string) => {
    const amount = parseMoneyInput(raw);
    setFormData((prev) => ({ ...prev, budgetAmount: amount }));
    if (errors.budgetAmount) {
      setErrors((prev) => ({ ...prev, budgetAmount: undefined }));
    }
  };

  const handleSelectBudgetPreset = (amount: number) => {
    setFormData((prev) => ({ ...prev, budgetAmount: amount }));
    if (errors.budgetAmount) {
      setErrors((prev) => ({ ...prev, budgetAmount: undefined }));
    }
  };

  const handleSelectBudgetCustom = () => {
    if (budgetInputRef.current) {
      budgetInputRef.current.focus();
    }
  };

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const validation = validateCreateTripForm(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      toast("Vui lòng kiểm tra lại các trường thông tin bắt buộc.", "error");

      // Auto-focus first error field
      if (validation.errors.name && nameInputRef.current) {
        nameInputRef.current.focus();
      } else if (validation.errors.destination && destinationInputRef.current) {
        destinationInputRef.current.focus();
      } else if (validation.errors.budgetAmount && budgetInputRef.current) {
        budgetInputRef.current.focus();
      }
      return;
    }

    setErrors({});
    // Open preview modal immediately without artificial delay
    setPreviewModalOpen(true);
  };

  // Async Confirm create handler (gọi API qua TripsStore, bảo vệ chống double-click)
  const handleConfirmCreate = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const newId = await addTrip({
        name: formData.name,
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate,
        budgetAmount: formData.budgetAmount || 0,
      });

      toast("Tạo chuyến đi thành công!", "success");
      setPreviewModalOpen(false);
      router.push(`/trips/${newId}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Không thể tạo chuyến đi. Vui lòng thử lại.";
      toast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel handler
  const handleCancelClick = () => {
    if (isSubmitting) return;
    if (isDirty) {
      setConfirmCancelOpen(true);
    } else {
      router.push("/trips");
    }
  };

  const handleConfirmCancel = () => {
    setConfirmCancelOpen(false);
    router.push("/trips");
  };

  return (
    <>
      <div className="bg-white rounded-[20px] p-6 sm:p-8 shadow-[0_6px_20px_rgba(24,78,119,0.08)] border border-border-hairline relative overflow-hidden">
        {/* Ambient Coastal Gradient Top Trim */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-lime-cream via-ocean-mist to-cerulean"
          aria-hidden="true"
        />

        {/* Card Header */}
        <div className="flex flex-col items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-hover-row flex items-center justify-center text-cerulean shadow-xs">
            <Compass className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl sm:text-[26px] font-bold text-yale-blue tracking-tight">
              Tạo chuyến đi mới
            </h1>
            <p className="text-sm text-text-muted leading-relaxed">
              Khởi đầu kế hoạch tuyệt vời cùng nhóm bạn. Bạn có thể mời bạn bè và thêm lịch trình chi tiết ngay sau bước này.
            </p>
          </div>
          <div className="w-full h-px bg-border-hairline" />
        </div>

        {/* Form Inputs Container */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
          {/* Field 1: Trip Name */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="trip-name"
              className="text-sm font-semibold text-yale-blue flex items-center gap-1"
            >
              Tên chuyến đi <span className="text-functional-negative">*</span>
            </label>
            <div className="relative">
              <input
                ref={nameInputRef}
                id="trip-name"
                type="text"
                maxLength={150}
                value={formData.name}
                onChange={(e) => handleChangeName(e.target.value)}
                placeholder="Ví dụ: Đà Lạt 3N2Đ cùng hội bạn thân, Phú Quốc đón hè..."
                className={`w-full h-12 px-4 rounded-xl bg-white text-yale-blue font-medium text-base border shadow-2xs transition-all duration-150 outline-none placeholder:text-text-muted/60 ${
                  errors.name
                    ? "border-functional-negative ring-2 ring-functional-negative/20"
                    : "border-border-hairline focus:border-cerulean focus:ring-3 focus:ring-ocean-mist/30"
                }`}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "trip-name-error" : "trip-name-helper"}
              />
            </div>
            {errors.name ? (
              <p id="trip-name-error" className="text-xs font-medium text-functional-negative" role="alert">
                {errors.name}
              </p>
            ) : (
              <span id="trip-name-helper" className="text-xs text-text-muted flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-text-muted shrink-0" />
                <span>Đặt một cái tên ngắn gọn, dễ nhớ cho cả nhóm.</span>
              </span>
            )}
          </div>

          {/* Field 2: Destination (Optional, matching ERD) */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="trip-destination"
                className="text-sm font-semibold text-yale-blue"
              >
                Điểm đến <span className="text-xs font-normal text-text-muted">(không bắt buộc)</span>
              </label>
            </div>
            <DestinationMapPicker
              inputRef={destinationInputRef}
              value={formData.destination}
              onChange={handleChangeDestination}
              error={errors.destination}
            />
            {/* Quick Suggestion Pills */}
            <DestinationQuickPills
              currentValue={formData.destination}
              onSelect={(dest) => {
                handleChangeDestination(dest);
                if (destinationInputRef.current) {
                  destinationInputRef.current.focus();
                }
              }}
            />
          </div>

          {/* Field 3: Date Range Picker */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-semibold text-yale-blue flex items-center gap-1">
                Ngày đi – Ngày về <span className="text-functional-negative">*</span>
              </span>
              {durationText ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-cream/80 border border-emerald/40 text-yale-blue font-bold text-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald shrink-0" />
                  <span>{durationText}</span>
                </span>
              ) : formData.startDate && formData.endDate && formData.endDate < formData.startDate ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-functional-warning-bg border border-functional-warning/30 text-functional-warning font-semibold text-xs">
                  Khoảng ngày không hợp lệ
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-start sm:items-center gap-2 sm:gap-3">
              <div>
                <TripDatePicker
                  id="trip-start-date"
                  value={formData.startDate}
                  onChange={handleChangeStartDate}
                  placeholder="Ngày bắt đầu"
                  error={errors.startDate}
                />
              </div>

              <div
                className="hidden sm:flex w-8 h-8 rounded-full bg-hover-row items-center justify-center text-text-muted shrink-0 self-center"
                aria-hidden="true"
              >
                <ArrowRight className="w-4 h-4" />
              </div>

              <div>
                <TripDatePicker
                  id="trip-end-date"
                  value={formData.endDate}
                  onChange={handleChangeEndDate}
                  minDate={formData.startDate || undefined}
                  placeholder="Ngày kết thúc"
                  error={errors.endDate}
                />
              </div>
            </div>
          </div>

          {/* Field 4: Budget Input & Chips */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="trip-budget"
              className="text-sm font-semibold text-yale-blue"
            >
              Ngân sách dự kiến{" "}
              <span className="text-xs font-normal text-text-muted">(không bắt buộc)</span>
            </label>
            <div className="relative flex items-center">
              <input
                ref={budgetInputRef}
                id="trip-budget"
                type="text"
                value={formatMoneyInputValue(formData.budgetAmount)}
                onChange={(e) => handleChangeBudgetRaw(e.target.value)}
                placeholder="Nhập số tiền (vd: 10.000.000)"
                className={`w-full h-12 pl-4 pr-10 rounded-xl bg-white text-yale-blue font-bold text-base border shadow-2xs transition-all duration-150 outline-none tabular-nums placeholder:text-text-muted/60 placeholder:font-normal ${
                  errors.budgetAmount
                    ? "border-functional-negative ring-2 ring-functional-negative/20"
                    : "border-border-hairline focus:border-cerulean focus:ring-3 focus:ring-ocean-mist/30"
                }`}
                aria-invalid={Boolean(errors.budgetAmount)}
                aria-describedby={errors.budgetAmount ? "trip-budget-error" : "trip-budget-helper"}
              />
              <span className="absolute right-4 font-bold text-text-muted pointer-events-none select-none">
                ₫
              </span>
            </div>
            {errors.budgetAmount ? (
              <p id="trip-budget-error" className="text-xs font-medium text-functional-negative" role="alert">
                {errors.budgetAmount}
              </p>
            ) : (
              <span id="trip-budget-helper" className="text-xs text-text-muted">
                Smart Trip sẽ giúp bạn theo dõi tỷ lệ chi tiêu so với hạn mức này.
              </span>
            )}

            {/* Quick Budget Preset Chips */}
            <BudgetPresetChips
              currentAmount={formData.budgetAmount}
              onSelectAmount={handleSelectBudgetPreset}
              onSelectCustom={handleSelectBudgetCustom}
            />
          </div>

          {/* Section 5: Host Notice Banner */}
          <div className="rounded-xl bg-hover-row/90 border border-divider-border p-4 flex items-start gap-3.5 shadow-2xs">
            <div className="w-9 h-9 rounded-full bg-lime-cream flex items-center justify-center text-yale-blue shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5 text-yale-blue" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-bold text-yale-blue">
                Bạn sẽ là Trưởng nhóm của chuyến đi này
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Bạn có toàn quyền chỉnh sửa thông tin, kiểm soát bảng chia tiền và mời thành viên mới tham gia chuyến phiêu lưu.
              </p>
            </div>
          </div>

          {/* Section 6: Action Buttons */}
          <div className="flex items-center gap-3 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelClick}
              disabled={isSubmitting}
              className="h-12 px-6 rounded-xl text-text-muted hover:text-functional-negative hover:bg-functional-warning-bg/40 font-semibold"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex-1 h-12 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(26,117,159,0.25)]"
            >
              <Eye className="w-4 h-4 stroke-[2.2]" />
              <span>Xem trước chuyến đi</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Friendly Reassurance Footer Note */}
      <div className="text-center mt-6 max-w-[560px] mx-auto px-4">
        <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
          Cần chia sẻ chi phí theo nhiều tỷ lệ khác nhau? Sau khi tạo chuyến đi, bạn có thể thiết lập người chịu chi phí linh hoạt từng khoản.
        </p>
      </div>

      {/* Modals */}
      <CreateTripPreviewModal
        isOpen={previewModalOpen}
        onClose={() => {
          if (!isSubmitting) setPreviewModalOpen(false);
        }}
        onConfirmCreate={handleConfirmCreate}
        formData={formData}
        durationText={durationText}
        isSubmitting={isSubmitting}
      />

      <ConfirmCancelModal
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        onConfirm={handleConfirmCancel}
      />
    </>
  );
}
