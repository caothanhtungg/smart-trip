import { z } from 'zod';

export function validateCoordinates(
  lat: number | null | undefined,
  lng: number | null | undefined
): boolean {
  if (lat == null && lng == null) {
    return true;
  }
  if (lat == null || lng == null) {
    return false;
  }
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
}).refine(
  (data) => validateCoordinates(data.latitude, data.longitude),
  { message: 'Cả vĩ độ và kinh độ phải cùng được cung cấp và nằm trong giới hạn hợp lệ' }
);
