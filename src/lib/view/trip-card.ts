import { Trip, TripCardView } from "@/types/trip";
import { calculateDurationText } from "@/lib/trip-form-validation";

/**
 * Tập gradient mẫu dựng từ token màu thương hiệu Smart Trip (docs/ENGINEERING_STANDARDS.md):
 * Lime Cream, Light Green, Mint Green, Emerald, Ocean Mist, Cerulean, Baltic Blue, Yale Blue.
 */
export const TRIP_COVER_GRADIENTS: readonly {
  from: string;
  via?: string;
  to: string;
}[] = Object.freeze([
  {
    from: "var(--color-lime-cream)",
    via: "var(--color-ocean-mist)",
    to: "var(--color-yale-blue)",
  },
  {
    from: "var(--color-tropical-teal)",
    via: "var(--color-bondi-blue)",
    to: "var(--color-yale-blue)",
  },
  {
    from: "var(--color-mint-green)",
    via: "var(--color-ocean-mist)",
    to: "var(--color-baltic-blue)",
  },
  {
    from: "var(--color-light-green)",
    via: "var(--color-emerald-fill)",
    to: "var(--color-cerulean)",
  },
]);

/**
 * Chọn gradient màu bìa chuyến đi theo ID một cách tất định (deterministic)
 */
export function getTripCoverGradient(tripId: string): {
  from: string;
  via?: string;
  to: string;
} {
  if (!tripId) return TRIP_COVER_GRADIENTS[0];

  let hash = 0;
  for (let i = 0; i < tripId.length; i++) {
    hash = (hash << 5) - hash + tripId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % TRIP_COVER_GRADIENTS.length;
  return TRIP_COVER_GRADIENTS[index];
}

/**
 * Chuyển đổi Trip (entity) sang TripCardView (view model để render thẻ)
 */
export function toTripCardView(trip: Trip): TripCardView {
  const duration =
    calculateDurationText(trip.startDate, trip.endDate) || "1 ngày";
  const activeMembers = trip.members
    ? trip.members.filter((m) => m.status === "ACTIVE")
    : [];
  const memberCount =
    activeMembers.length > 0 ? activeMembers.length : trip.members?.length || 0;

  return {
    id: trip.id,
    name: trip.name,
    destination: trip.destination,
    startDate: trip.startDate,
    endDate: trip.endDate,
    durationText: duration,
    status: trip.status,
    inviteCode: trip.inviteCode,
    updatedAt: trip.updatedAt,
    members: trip.members || [],
    memberCount,
    userBalance: trip.userBalance,
    cover: getTripCoverGradient(trip.id),
  };
}

export function toTripCardViews(trips: readonly Trip[]): TripCardView[] {
  return trips.map(toTripCardView);
}
