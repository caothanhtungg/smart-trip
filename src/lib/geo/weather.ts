export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'storm';

export interface WeatherInfo {
  tempC: number;
  condition: WeatherCondition;
  labelVi: string;
  rainProb: number;
  isOutdoorWarning: boolean;
  warningMessage?: string;
}

/**
 * Phân tích mã WMO (World Meteorological Organization) sang trạng thái và mô tả tiếng Việt
 */
export function parseWmoWeatherCode(code: number): { condition: WeatherCondition; labelVi: string } {
  switch (code) {
    case 0:
      return { condition: 'sunny', labelVi: 'Trời quang đãng' };
    case 1:
      return { condition: 'sunny', labelVi: 'Hầu như không mây' };
    case 2:
      return { condition: 'cloudy', labelVi: 'Nhiều mây' };
    case 3:
      return { condition: 'cloudy', labelVi: 'Trời âm u' };
    case 45:
    case 48:
      return { condition: 'cloudy', labelVi: 'Có sương mù' };
    case 51:
    case 53:
    case 55:
      return { condition: 'rainy', labelVi: 'Mưa phùn nhẹ' };
    case 61:
      return { condition: 'rainy', labelVi: 'Mưa nhỏ' };
    case 63:
      return { condition: 'rainy', labelVi: 'Mưa vừa' };
    case 65:
      return { condition: 'rainy', labelVi: 'Mưa to' };
    case 80:
    case 81:
    case 82:
      return { condition: 'rainy', labelVi: 'Mưa rào' };
    case 95:
      return { condition: 'storm', labelVi: 'Có dông sét' };
    case 96:
    case 99:
      return { condition: 'storm', labelVi: 'Dông kèm mưa đá' };
    default:
      return { condition: 'cloudy', labelVi: 'Có mây' };
  }
}

/**
 * Đánh giá an toàn thời tiết cho các hoạt động tham quan ngoài trời
 */
export function evaluateOutdoorSafety(
  wmoCode: number,
  precipitationProbability: number
): { isOutdoorWarning: boolean; warningMessage?: string } {
  const { condition, labelVi } = parseWmoWeatherCode(wmoCode);

  if (condition === 'storm') {
    return {
      isOutdoorWarning: true,
      warningMessage: `Cảnh báo ${labelVi.toLowerCase()}! Khuyến nghị hạn chế hoạt động ngoài trời và dời sang địa điểm có mái che.`,
    };
  }

  if (condition === 'rainy' || precipitationProbability >= 60) {
    return {
      isOutdoorWarning: true,
      warningMessage: `Dự báo ${labelVi.toLowerCase()} (khả năng mưa ${precipitationProbability}%). Nên chuẩn bị ô/áo mưa hoặc cân nhắc đổi sang điểm trong nhà.`,
    };
  }

  return { isOutdoorWarning: false };
}

/**
 * Lấy dữ liệu dự báo thời tiết từ Open-Meteo API theo tọa độ và ngày
 */
export async function getWeatherForecast(
  lat: number,
  lng: number,
  dateStr: string
): Promise<WeatherInfo | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weathercode,temperature_2m_max,precipitation_probability_max&timezone=Asia%2FBangkok`;
    const res = await fetch(url, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    if (!data?.daily?.time || !Array.isArray(data.daily.time)) {
      return null;
    }

    // Tìm index của ngày cần dự báo (format YYYY-MM-DD)
    const normalizedDate = dateStr.slice(0, 10);
    const dayIndex = data.daily.time.indexOf(normalizedDate);
    const targetIdx = dayIndex !== -1 ? dayIndex : 0;

    const code = Number(data.daily.weathercode?.[targetIdx] ?? 0);
    const rawTemp = Number(data.daily.temperature_2m_max?.[targetIdx] ?? 25);
    const rainProb = Number(data.daily.precipitation_probability_max?.[targetIdx] ?? 0);

    const { condition, labelVi } = parseWmoWeatherCode(code);
    const { isOutdoorWarning, warningMessage } = evaluateOutdoorSafety(code, rainProb);

    return {
      tempC: Math.round(rawTemp),
      condition,
      labelVi,
      rainProb,
      isOutdoorWarning,
      warningMessage,
    };
  } catch {
    // Xử lý an toàn khi mất mạng hoặc timeout
    return null;
  }
}
