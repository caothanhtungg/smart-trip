export type TripStatus = "ACTIVE" | "SETTLING" | "COMPLETED" | "ARCHIVED";

export type TripMemberRole = "HOST" | "MEMBER";

export interface TripMember {
  id: string;
  name: string;
  role: TripMemberRole;
  avatarUrl?: string | null;
  isNoAccount?: boolean;
}

export type BalanceType = "RECEIVE" | "PAY" | "SETTLED";

export interface UserTripBalance {
  type: BalanceType;
  amount: number; // Integer VND
  label: "Được nhận" | "Cần trả" | "Đã xong";
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string; // ISO date string YYYY-MM-DD
  durationText: string; // e.g. "3 ngày 2 đêm"
  status: TripStatus;
  members: TripMember[];
  totalMembers: number;
  userBalance: UserTripBalance;
  coverGradient: {
    from: string;
    via?: string;
    to: string;
  };
}

export type TripFilterTab = "all" | "active" | "completed";

export interface OverallBalanceSummary {
  toReceive: number;
  toPay: number;
  net: number;
}
