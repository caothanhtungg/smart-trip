/**
 * Domain types for Phase 2D.3 — Settlement & Repayments (Công nợ & Đề xuất thanh toán)
 * Aligned with sodothietke/release1-erd.dbml and docs/phase-2d3-plan.md
 */

export type SettlementStatus = "ACTIVE" | "CANCELLED";
export type TransferStatus = "UNPAID" | "PAID" | "COMPLETED";
export type PaymentMethod = "BANK_TRANSFER" | "CASH";

export interface MemberBankInfo {
  bankName: string;
  bankBin: string;
  accountNumber: string;
  accountHolder: string;
}

export interface MemberBalanceBreakdown {
  memberId: string;
  memberName: string;
  paidAmount: number; // Integer VND >= 0
  owedAmount: number; // Integer VND >= 0
  netAmount: number; // paidAmount - owedAmount (+ receive, - pay, 0 settled)
  isCurrentUser?: boolean;
  isHost?: boolean;
  isNoAccount?: boolean;
  bankInfo?: MemberBankInfo;
}

export interface SettlementTransfer {
  id: string;
  settlementId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number; // Integer VND > 0
  status: TransferStatus;
  paymentMethod?: PaymentMethod;
  paidAt?: string; // ISO datetime
  paidMarkedByMemberId?: string;
  paymentProofNote?: string;
  completedAt?: string; // ISO datetime
  completedByMemberId?: string;
}

export interface Settlement {
  id: string;
  tripId: string;
  status: SettlementStatus;
  createdByMemberId: string;
  createdAt: string;
  cancelledAt?: string;
  transfers: SettlementTransfer[];
}
