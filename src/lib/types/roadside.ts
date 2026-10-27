/**
 * Domain types for Roadside POIs (Gas stations & vehicle repair shops)
 * and real-time on-the-road navigation status.
 */

export type RoadsidePoiType = 'gas_station' | 'repair_shop';

export interface RoadsidePoi {
  id: string;
  name: string;
  type: RoadsidePoiType;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  brand?: string; // e.g., 'Petrolimex', 'PVOIL', 'Honda Head', 'Cứu hộ 24/7'
  isOpen?: boolean;
  distanceKm?: number;
}

export interface NavigationStatus {
  userLocation: [number, number] | null;
  nextStop: {
    id: string;
    title: string;
    latitude: number;
    longitude: number;
  } | null;
  distanceToNextStopKm: number | null;
  estimatedMinutesToNextStop: number | null;
  nearestGasStation: RoadsidePoi | null;
  nearestRepairShop: RoadsidePoi | null;
}
