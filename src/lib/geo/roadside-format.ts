/**
 * Utilities for formatting distance and travel time for on-the-road navigation.
 */

/**
 * Formats distance in km to a human-friendly Vietnamese string.
 * - Under 1 km: displayed in meters (e.g., "750 m", "50 m")
 * - 1 km and above: displayed in kilometers with 1 decimal place (e.g., "3.4 km", "12 km")
 */
export function formatDistance(distanceKm: number): string {
  if (isNaN(distanceKm) || distanceKm <= 0) {
    return '0 m';
  }

  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    if (meters >= 1000) {
      return '1 km';
    }
    return `${meters} m`;
  }

  const rounded = Math.round(distanceKm * 10) / 10;
  return rounded % 1 === 0 ? `${rounded.toFixed(0)} km` : `${rounded.toFixed(1)} km`;
}

/**
 * Estimates travel time in minutes based on distance and average road speed in Vietnam.
 * Default average speed: 40 km/h (typical for motorbike and regional car travel).
 */
export function estimateTravelTimeMinutes(distanceKm: number, speedKmH = 40): number {
  if (isNaN(distanceKm) || distanceKm <= 0) {
    return 0;
  }

  // Factor in real-world road winding & traffic margin (1.15x)
  const effectiveDistance = distanceKm * 1.15;
  const hours = effectiveDistance / speedKmH;
  const minutes = Math.round(hours * 60);

  return Math.max(1, minutes);
}

/**
 * Formats minutes into human-readable duration string.
 * Examples: "~10 phút", "~1 giờ 15 phút".
 */
export function formatTravelTime(minutes: number): string {
  if (isNaN(minutes) || minutes <= 0) {
    return '~1 phút';
  }

  if (minutes < 60) {
    return `~${minutes} phút`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  if (remainingMins === 0) {
    return `~${hours} giờ`;
  }

  return `~${hours} giờ ${remainingMins} phút`;
}
