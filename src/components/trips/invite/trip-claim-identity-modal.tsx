"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  UserPlus,
  Info,
  ShieldCheck,
  Hourglass,
  RefreshCw,
  XCircle,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { TripInvitePreviewData, TripMember } from "@/types/trip";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface TripClaimIdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: TripInvitePreviewData;
  claimablePlaceholders: TripMember[];
  onJoinSuccess?: () => void;
}

function TripClaimIdentityDialog({
  onClose,
  previewData,
  claimablePlaceholders,
  onJoinSuccess,
}: Omit<TripClaimIdentityModalProps, "isOpen">) {
  const router = useRouter();

  // Selected option: 'new_member' | string (placeholder member ID)
  const [selectedChoice, setSelectedChoice] = React.useState<string>(() => {
    return claimablePlaceholders.length > 0 ? claimablePlaceholders[0].id : "new_member";
  });

  // Current view step: 'CHOOSE' | 'WAITING' | 'SUCCESS_NEW'
  const [step, setStep] = React.useState<"CHOOSE" | "WAITING" | "SUCCESS_NEW">("CHOOSE");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [recheckMessage, setRecheckMessage] = React.useState<string | null>(null);

  const selectedPlaceholder = claimablePlaceholders.find((p) => p.id === selectedChoice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      if (selectedChoice === "new_member") {
        setStep("SUCCESS_NEW");
        setTimeout(() => {
          onJoinSuccess?.();
          router.push(`/trips/${previewData.id}`);
        }, 1200);
      } else {
        setStep("WAITING");
      }
    }, 600);
  };

  const handleRecheckStatus = () => {
    setRecheckMessage("Đang kiểm tra với Trưởng nhóm...");
    setTimeout(() => {
      setRecheckMessage("Yêu cầu vẫn đang ở trạng thái Chờ duyệt. Trưởng nhóm chưa phê duyệt.");
    }, 800);
  };

  const handleCancelClaim = () => {
    setStep("CHOOSE");
    setRecheckMessage(null);
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
              Trưởng nhóm có thể đã thêm sẵn một thành viên chưa có tài khoản để chia tiền trước. Hãy
              chọn đúng danh tính của bạn:
            </p>
          </div>

          {/* Radio Options List */}
          <div className="space-y-3">
            {/* Available Placeholder Options */}
            {claimablePlaceholders.map((placeholder) => {
              const isSelected = selectedChoice === placeholder.id;
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
                      onChange={() => setSelectedChoice(placeholder.id)}
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
                      {placeholder.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Identity Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm sm:text-base text-yale-blue">
                          {placeholder.name}
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
                  onChange={() => setSelectedChoice("new_member")}
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
          </div>

          {/* Audit / Security Callout */}
          {selectedChoice !== "new_member" && selectedPlaceholder && (
            <div className="p-3.5 bg-surface-container-low rounded-xl border border-divider-border flex items-start gap-2.5 text-xs text-yale-blue leading-relaxed">
              <Info className="w-4 h-4 text-cerulean shrink-0 mt-0.5" />
              <div>
                Trưởng nhóm cần xác nhận trước khi liên kết để tránh nhầm người. Khi được duyệt, toàn
                bộ chi tiêu và công nợ ghi nhận cho{" "}
                <strong className="font-semibold text-cerulean">« {selectedPlaceholder.name} »</strong>{" "}
                sẽ chuyển vào tài khoản của bạn.
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-hairline">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="bg-cerulean hover:bg-baltic-blue flex items-center gap-2 min-w-[140px] justify-center"
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
                  <span>Gửi yêu cầu</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* Step 2: Waiting State (Rule R1, R13, R20) */}
      {step === "WAITING" && selectedPlaceholder && (
        <div className="space-y-6 py-3">
          {/* Status Badge */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-functional-warning-bg border border-functional-warning/20 rounded-full text-functional-warning font-semibold text-xs">
              <span className="w-2 h-2 rounded-full bg-functional-warning animate-ping" />
              <span>Đang chờ phê duyệt</span>
            </span>
          </div>

          {/* Illustration circle & Message */}
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-lime-cream/50 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-surface-card shadow-xs flex items-center justify-center text-cerulean">
                <Hourglass className="w-6 h-6 animate-spin text-cerulean" style={{ animationDuration: "8s" }} />
              </div>
            </div>

            <h3 className="text-xl font-bold text-yale-blue mt-3">
              Đã gửi yêu cầu, chờ Trưởng nhóm duyệt
            </h3>

            <p className="text-xs sm:text-sm text-text-muted mt-1.5 max-w-md leading-relaxed">
              Yêu cầu liên kết tài khoản của bạn với vị trí{" "}
              <strong className="text-yale-blue font-semibold">« {selectedPlaceholder.name} »</strong>{" "}
              đã được gửi tới {previewData.hostName}. Bạn sẽ nhận được thông báo ngay khi Trưởng
              nhóm xác nhận.
            </p>
          </div>

          {/* Summary Ledger Details */}
          <div className="bg-bg-canvas rounded-xl p-4 border border-divider-border space-y-2.5 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Chuyến đi</span>
              <span className="font-semibold text-yale-blue">{previewData.name}</span>
            </div>
            <div className="h-[1px] w-full bg-divider-border/60" />
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Người duyệt</span>
              <span className="font-semibold text-yale-blue">
                {previewData.hostName} (Trưởng nhóm)
              </span>
            </div>
            <div className="h-[1px] w-full bg-divider-border/60" />
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Vị trí liên kết</span>
              <span className="font-semibold text-cerulean">
                {selectedPlaceholder.name} (Chưa có tài khoản)
              </span>
            </div>
            <div className="h-[1px] w-full bg-divider-border/60" />
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Thời gian gửi</span>
              <span className="text-text-muted font-medium">Vừa xong</span>
            </div>
          </div>

          {/* Notice about privacy protection (Rule R1) */}
          <div className="p-3 bg-surface-container-low rounded-xl border border-divider-border flex items-start gap-2.5 text-xs text-text-muted leading-relaxed">
            <Info className="w-4 h-4 text-cerulean shrink-0 mt-0.5" />
            <span>
              Để bảo vệ quyền riêng tư của nhóm, bạn chưa thể xem lịch trình và danh sách chi tiêu chi
              tiết cho đến khi Trưởng nhóm phê duyệt yêu cầu này (Rule R1).
            </span>
          </div>

          {recheckMessage && (
            <div className="p-3 bg-functional-warning-bg rounded-xl border border-functional-warning/30 text-xs text-functional-warning text-center font-medium animate-in fade-in">
              {recheckMessage}
            </div>
          )}

          {/* Waiting actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRecheckStatus}
              className="w-full sm:w-auto px-5 h-10 border-cerulean text-cerulean hover:bg-surface-container-low font-semibold text-xs flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Kiểm tra lại trạng thái</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleCancelClaim}
              className="w-full sm:w-auto px-4 h-10 text-functional-negative hover:bg-red-50 hover:text-red-700 font-semibold text-xs flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Hủy yêu cầu này</span>
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Success for New Member */}
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
    </Modal>
  );
}

export function TripClaimIdentityModal(props: TripClaimIdentityModalProps) {
  if (!props.isOpen) return null;
  return <TripClaimIdentityDialog key={props.previewData.id} {...props} />;
}
