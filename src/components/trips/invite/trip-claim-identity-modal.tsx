"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Info,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { createClaimApi, TripsApiError } from "@/lib/services/trips-api";
import type {
  ApiInvitePreviewData,
  ApiInviteClaimablePlaceholder,
} from "@/components/trips/invite/trip-join-view";

export type JoinApiResult =
  | { type: "SUCCESS_NEW"; tripId: string; message: string }
  | { type: "SUCCESS_REJOIN"; tripId: string; message: string }
  | { type: "ALREADY_MEMBER"; tripId: string; message: string }
  | { type: "UNAUTHORIZED"; redirectUrl: string; message: string }
  | { type: "ERROR"; message: string };

/**
 * Xử lý và phân loại kết quả từ POST /api/invites/[code]/join
 */
export function handleJoinApiResponse(
  res: { status: number },
  body: unknown,
  previewTripId: string,
  code: string
): JoinApiResult {
  const normalizedCode = code.trim().toUpperCase();
  const typedBody = body as
    | {
        data?: { tripId?: string; isRejoined?: boolean; status?: string };
        message?: string;
        error?: { code?: string; message?: string };
      }
    | null
    | undefined;

  if (res.status === 201) {
    return {
      type: "SUCCESS_NEW",
      tripId: typedBody?.data?.tripId || previewTripId,
      message: typedBody?.message || "Tham gia chuyến đi thành công!",
    };
  }

  if (
    res.status === 200 &&
    (typedBody?.data?.isRejoined || typedBody?.data?.status === "ACTIVE")
  ) {
    return {
      type: "SUCCESS_REJOIN",
      tripId: typedBody?.data?.tripId || previewTripId,
      message: typedBody?.message || "Chào mừng bạn quay trở lại chuyến đi!",
    };
  }

  // CHỈ phân loại ALREADY_MEMBER khi HTTP 409 và error.code khớp chính xác "ALREADY_MEMBER"
  if (res.status === 409 && typedBody?.error?.code === "ALREADY_MEMBER") {
    return {
      type: "ALREADY_MEMBER",
      tripId: previewTripId,
      message: typedBody?.error?.message || "Bạn đã là thành viên của chuyến đi này.",
    };
  }

  if (res.status === 401) {
    return {
      type: "UNAUTHORIZED",
      redirectUrl: `/login?callbackUrl=${encodeURIComponent(`/join/${normalizedCode}`)}`,
      message: typedBody?.error?.message || "Yêu cầu đăng nhập để tham gia chuyến đi.",
    };
  }

  return {
    type: "ERROR",
    message:
      typedBody?.error?.message || "Không thể tham gia chuyến đi. Vui lòng thử lại sau.",
  };
}

/**
 * Kiểm tra lựa chọn danh tính tham gia
 */
export function validateClaimChoice(
  choice: string,
  placeholderName?: string,
  options?: { allowClaims?: boolean }
): { canProceed: boolean; errorMessage?: string } {
  if (choice === "new_member") {
    return { canProceed: true };
  }

  if (options?.allowClaims) {
    if (!choice || !choice.trim()) {
      return {
        canProceed: false,
        errorMessage: "Vui lòng chọn vị trí thành viên chưa có tài khoản muốn nhận diện.",
      };
    }
    return { canProceed: true };
  }

  return {
    canProceed: false,
    errorMessage: `Tính năng liên kết với vị trí « ${
      placeholderName || "thành viên"
    } » chưa khả dụng ở giai đoạn này. Vui lòng chọn 'Tôi là người mới' để tham gia chuyến đi.`,
  };
}

export interface TripClaimIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: ApiInvitePreviewData;
  claimablePlaceholders?: ApiInviteClaimablePlaceholder[];
  code: string;
  onJoinSuccess?: () => void;
}

function TripClaimIdentityDialog({
  onClose,
  previewData,
  claimablePlaceholders = [],
  code,
  onJoinSuccess,
}: Omit<TripClaimIdentityModalProps, "isOpen">) {
  const router = useRouter();
  const { toast } = useToast();

  // Mặc định chọn "Tôi là người mới"
  const [selectedChoice, setSelectedChoice] = React.useState<string>("new_member");

  // Trạng thái modal: CHOOSE (form) | SUCCESS_NEW | SUCCESS_REJOIN | SUCCESS_CLAIM
  const [step, setStep] = React.useState<
    "CHOOSE" | "SUCCESS_NEW" | "SUCCESS_REJOIN" | "SUCCESS_CLAIM"
  >("CHOOSE");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const selectedPlaceholder = claimablePlaceholders.find((p) => p.id === selectedChoice);
  const selectedPlaceholderName =
    selectedPlaceholder?.displayName || selectedPlaceholder?.name || "thành viên";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Trường hợp chọn vị trí thành viên chưa có tài khoản (UC33 Claim Identity)
    if (selectedChoice !== "new_member") {
      setIsSubmitting(true);
      setErrorMessage(null);

      try {
        await createClaimApi(previewData.id, selectedChoice);
        setStep("SUCCESS_CLAIM");
        toast("Đã gửi yêu cầu nhận diện thành viên thành công!", "success");
        setTimeout(() => {
          onJoinSuccess?.();
          onClose();
        }, 2500);
      } catch (err) {
        if (err instanceof TripsApiError && err.status === 401) {
          router.push(`/login?callbackUrl=${encodeURIComponent(`/join/${code}`)}`);
          return;
        }
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Không thể gửi yêu cầu nhận diện thành viên. Vui lòng thử lại sau."
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // 2. Trường hợp chọn "Tôi là người mới": Gọi POST /api/invites/[code]/join
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const normalizedCode = code.trim().toUpperCase();
      const res = await fetch(`/api/invites/${encodeURIComponent(normalizedCode)}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const body = await res.json().catch(() => null);
      const result = handleJoinApiResponse(res, body, previewData.id, normalizedCode);

      if (result.type === "SUCCESS_NEW") {
        setStep("SUCCESS_NEW");
        setTimeout(() => {
          onJoinSuccess?.();
          router.push(`/trips/${result.tripId}`);
        }, 1200);
      } else if (result.type === "SUCCESS_REJOIN") {
        setStep("SUCCESS_REJOIN");
        setTimeout(() => {
          onJoinSuccess?.();
          router.push(`/trips/${result.tripId}`);
        }, 1200);
      } else if (result.type === "ALREADY_MEMBER") {
        toast(result.message, "info");
        onClose();
        router.push(`/trips/${result.tripId}`);
      } else if (result.type === "UNAUTHORIZED") {
        router.push(result.redirectUrl);
      } else {
        setErrorMessage(result.message);
      }
    } catch {
      setErrorMessage("Lỗi kết nối mạng khi gửi yêu cầu tham gia. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Xác nhận danh tính tham gia chuyến đi"
      description={`Chuyến đi: ${previewData.name} • Trưởng nhóm: ${previewData.hostName}`}
      className="max-w-xl"
    >
      {/* Step 1: Selection Form */}
      {step === "CHOOSE" && (
        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          {/* Step indicator badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface-container-low text-cerulean rounded-full font-semibold text-xs border border-divider-border">
            <span className="w-2 h-2 rounded-full bg-cerulean" />
            <span>Xác nhận thành viên</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-yale-blue">Bạn là ai trong chuyến đi này?</h3>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Hãy chọn danh tính của bạn để gia nhập chuyến đi:
            </p>
          </div>

          {/* Error notice if present */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 rounded-xl border border-red-200 flex items-start gap-2.5 text-xs text-red-700 leading-relaxed animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Radio Options List */}
          <div className="space-y-3">
            {/* Option: I am a new member */}
            <label
              htmlFor="choice-new-member"
              className={`relative flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl cursor-pointer transition-all border-2 ${
                selectedChoice === "new_member"
                  ? "border-cerulean bg-bg-canvas/60 shadow-xs"
                  : "border-divider-border bg-surface-card hover:border-ocean-mist"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="radio"
                  id="choice-new-member"
                  name="identity-choice"
                  value="new_member"
                  checked={selectedChoice === "new_member"}
                  onChange={() => {
                    setSelectedChoice("new_member");
                    setErrorMessage(null);
                  }}
                  className="sr-only"
                />

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    selectedChoice === "new_member" ? "border-cerulean" : "border-outline-variant"
                  }`}
                >
                  {selectedChoice === "new_member" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-cerulean" />
                  )}
                </div>

                <div className="w-10 h-10 rounded-full bg-light-green/40 border border-divider-border flex items-center justify-center text-yale-blue shrink-0">
                  <UserPlus className="w-5 h-5 text-yale-blue" />
                </div>

                <div className="min-w-0">
                  <span className="font-semibold text-sm sm:text-base text-yale-blue">
                    Tôi là người mới
                  </span>
                  <p className="text-xs text-text-muted mt-0.5 truncate">
                    Tham gia với tư cách thành viên mới hoàn toàn vào chuyến đi
                  </p>
                </div>
              </div>

              <ArrowRight
                className={`w-5 h-5 shrink-0 ${
                  selectedChoice === "new_member" ? "text-cerulean" : "text-outline-variant"
                }`}
              />
            </label>

            {/* Available Placeholder Options */}
            {claimablePlaceholders.map((placeholder) => {
              const isSelected = selectedChoice === placeholder.id;
              const name = placeholder.displayName || placeholder.name || "Thành viên";
              const initial = name.charAt(0).toUpperCase();

              return (
                <label
                  key={placeholder.id}
                  htmlFor={`choice-${placeholder.id}`}
                  className={`relative flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl cursor-pointer transition-all border-2 ${
                    isSelected
                      ? "border-cerulean bg-bg-canvas/60 shadow-xs"
                      : "border-divider-border bg-surface-card hover:border-ocean-mist"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <input
                      type="radio"
                      id={`choice-${placeholder.id}`}
                      name="identity-choice"
                      value={placeholder.id}
                      checked={isSelected}
                      onChange={() => {
                        setSelectedChoice(placeholder.id);
                        setErrorMessage(null);
                      }}
                      className="sr-only"
                    />

                    {/* Custom Radio Circle */}
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? "border-cerulean" : "border-outline-variant"
                      }`}
                    >
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-cerulean" />}
                    </div>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-surface-container-low text-yale-blue font-bold flex items-center justify-center shrink-0 border border-dashed border-ocean-mist">
                      {initial}
                    </div>

                    {/* Identity Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base text-yale-blue">
                          {name}
                        </span>
                        <span className="inline-flex items-center text-[11px] font-semibold bg-functional-warning-bg text-functional-warning px-2 py-0.5 rounded-full border border-functional-warning/20">
                          Chưa có tài khoản
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5 truncate">
                        {placeholder.note || `Được ${previewData.hostName} tạo sẵn để chia tiền`}
                      </p>
                    </div>
                  </div>

                  <ShieldCheck
                    className={`w-5 h-5 shrink-0 ${
                      isSelected ? "text-cerulean" : "text-outline-variant"
                    }`}
                  />
                </label>
              );
            })}
          </div>

          {/* Notice when placeholder is selected (UC33) */}
          {selectedChoice !== "new_member" && (
            <div className="p-3.5 bg-surface-container-low rounded-xl border border-divider-border flex items-start gap-2.5 text-xs text-yale-blue leading-relaxed animate-in fade-in">
              <Info className="w-4 h-4 text-cerulean shrink-0 mt-0.5" />
              <div>
                Bạn đang chọn nhận diện là thành viên{" "}
                <strong className="font-semibold text-cerulean">« {selectedPlaceholderName} »</strong>.
                Yêu cầu nhận diện sẽ được gửi tới Trưởng nhóm{" "}
                <strong className="font-semibold text-yale-blue">{previewData.hostName}</strong> xem
                xét và phê duyệt trước khi bạn có thể truy cập vào chuyến đi (Rule R13, R20).
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-hairline">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="flex items-center gap-2 min-w-[140px] justify-center transition-colors bg-cerulean hover:bg-baltic-blue cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : selectedChoice === "new_member" ? (
                <>
                  <span>Tham gia ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Gửi yêu cầu nhận diện</span>
                  <ShieldCheck className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: Success for New Member */}
      {step === "SUCCESS_NEW" && (
        <div className="py-8 flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-lime-cream flex items-center justify-center text-functional-positive shadow-xs">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h3 className="text-xl font-bold text-yale-blue">Tham gia chuyến đi thành công!</h3>
          <p className="text-xs sm:text-sm text-text-muted">
            Đang chuyển bạn vào trang chi tiết chuyến đi...
          </p>
        </div>
      )}

      {/* Step 3: Success for Rejoined Member */}
      {step === "SUCCESS_REJOIN" && (
        <div className="py-8 flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-lime-cream flex items-center justify-center text-functional-positive shadow-xs">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h3 className="text-xl font-bold text-yale-blue">Chào mừng bạn quay trở lại!</h3>
          <p className="text-xs sm:text-sm text-text-muted">
            Bạn đã quay lại chuyến đi. Đang chuyển vào trang chi tiết...
          </p>
        </div>
      )}

      {/* Step 4: Success for Claim Submitted (UC33) */}
      {step === "SUCCESS_CLAIM" && (
        <div className="py-8 flex flex-col items-center text-center space-y-3 animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-lime-cream flex items-center justify-center text-functional-positive shadow-xs">
            <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
          </div>
          <h3 className="text-xl font-bold text-yale-blue">Đã gửi yêu cầu nhận diện!</h3>
          <p className="text-xs sm:text-sm text-text-muted max-w-md leading-relaxed">
            Yêu cầu liên kết vị trí «{" "}
            <strong className="text-yale-blue font-semibold">{selectedPlaceholderName}</strong> » đã
            được gửi tới Trưởng nhóm{" "}
            <strong className="text-yale-blue font-semibold">{previewData.hostName}</strong>. Vui
            lòng chờ phê duyệt để bắt đầu tham gia và quản lý chi tiêu.
          </p>
        </div>
      )}
    </Modal>
  );
}

export function TripClaimIdentityModal(props: TripClaimIdentityModalProps) {
  if (!props.isOpen) return null;
  return <TripClaimIdentityDialog key={props.previewData.id} {...props} />;
}
