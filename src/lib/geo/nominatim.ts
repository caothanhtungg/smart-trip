export interface PlaceSearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

/**
 * Tìm kiếm gợi ý địa điểm qua OpenStreetMap Nominatim API (miễn phí, không cần key)
 */
export async function searchPlaces(query: string): Promise<PlaceSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }

  try {
    const encoded = encodeURIComponent(trimmed);
    const url = `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=5&countrycodes=vn`;

    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'vi,en;q=0.9',
        'User-Agent': 'SmartTripPlanner/2.0',
      },
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return [];
    }

    interface NominatimItem {
      place_id?: number | string;
      display_name?: string;
      lat: string;
      lon: string;
    }
    return (data as NominatimItem[]).map((item) => {
      const parts = (item.display_name || '').split(',');
      const shortName = parts[0]?.trim() || trimmed;
      const fullAddress = item.display_name || '';

      return {
        id: String(item.place_id || Math.random()),
        name: shortName,
        address: fullAddress,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      };
    });
  } catch {
    return [];
  }
}
