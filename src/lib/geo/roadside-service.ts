import { calculateHaversineDistance } from './distance';
import { estimateTravelTimeMinutes } from './roadside-format';
import { VIETNAM_ROADSIDE_POIS } from './roadside-data';
import { NavigationStatus, RoadsidePoi, RoadsidePoiType } from '../types/roadside';

/**
 * Searches for nearby gas stations and repair shops from a given coordinate.
 * Results are sorted in ascending order of distance from the user.
 */
export function findNearbyRoadsidePois(
  userLat: number,
  userLng: number,
  type?: RoadsidePoiType,
  maxRadiusKm = 50,
  limit = 10
): RoadsidePoi[] {
  if (isNaN(userLat) || isNaN(userLng)) {
    return [];
  }

  const results: RoadsidePoi[] = [];

  for (const poi of VIETNAM_ROADSIDE_POIS) {
    if (type && poi.type !== type) {
      continue;
    }

    const distMeters = calculateHaversineDistance(userLat, userLng, poi.latitude, poi.longitude);
    const dist = distMeters / 1000;

    if (dist <= maxRadiusKm) {
      results.push({
        ...poi,
        distanceKm: Math.round(dist * 10) / 10,
      });
    }
  }

  // Sort by nearest distance first
  results.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

  return results.slice(0, limit);
}

export interface ItineraryStopCoordinate {
  id: string;
  placeName: string;
  latitude?: number | null;
  longitude?: number | null;
  sortOrder?: number;
}

/**
 * Computes on-the-road navigation status: next destination, distance remaining,
 * estimated arrival time, and nearest emergency services.
 */
export function calculateNavigationStatus(
  userLocation: [number, number] | null,
  itineraryItems: ItineraryStopCoordinate[] = []
): NavigationStatus {
  // Find valid stops that have latitude and longitude
  const locatedStops = itineraryItems
    .filter(
      (item): item is ItineraryStopCoordinate & { latitude: number; longitude: number } =>
        typeof item.latitude === 'number' && typeof item.longitude === 'number'
    )
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const nextStop = locatedStops.length > 0 ? locatedStops[0] : null;

  if (!userLocation) {
    return {
      userLocation: null,
      nextStop: nextStop
        ? {
            id: nextStop.id,
            title: nextStop.placeName,
            latitude: nextStop.latitude,
            longitude: nextStop.longitude,
          }
        : null,
      distanceToNextStopKm: null,
      estimatedMinutesToNextStop: null,
      nearestGasStation: null,
      nearestRepairShop: null,
    };
  }

  const [userLat, userLng] = userLocation;

  let distanceToNextStopKm: number | null = null;
  let estimatedMinutesToNextStop: number | null = null;

  if (nextStop) {
    const rawDistMeters = calculateHaversineDistance(userLat, userLng, nextStop.latitude, nextStop.longitude);
    const rawDist = rawDistMeters / 1000;
    distanceToNextStopKm = Math.round(rawDist * 10) / 10;
    estimatedMinutesToNextStop = estimateTravelTimeMinutes(distanceToNextStopKm);
  }

  const nearbyGas = findNearbyRoadsidePois(userLat, userLng, 'gas_station', 100, 1);
  const nearbyRepair = findNearbyRoadsidePois(userLat, userLng, 'repair_shop', 100, 1);

  return {
    userLocation,
    nextStop: nextStop
      ? {
          id: nextStop.id,
          title: nextStop.placeName,
          latitude: nextStop.latitude,
          longitude: nextStop.longitude,
        }
      : null,
    distanceToNextStopKm,
    estimatedMinutesToNextStop,
    nearestGasStation: nearbyGas.length > 0 ? nearbyGas[0] : null,
    nearestRepairShop: nearbyRepair.length > 0 ? nearbyRepair[0] : null,
  };
}
