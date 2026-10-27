import { describe, it, expect, vi } from 'vitest';
import { parseWmoWeatherCode, evaluateOutdoorSafety, getWeatherForecast } from './weather';

describe('parseWmoWeatherCode', () => {
  it('dịch chính xác mã 0 sang trời quang / nắng', () => {
    const res = parseWmoWeatherCode(0);
    expect(res.condition).toBe('sunny');
    expect(res.labelVi).toBe('Trời quang đãng');
  });

  it('dịch chính xác mã 1-3 sang có mây', () => {
    const res = parseWmoWeatherCode(2);
    expect(res.condition).toBe('cloudy');
    expect(res.labelVi).toBe('Nhiều mây');
  });

  it('dịch chính xác mã 61-65 sang trời mưa', () => {
    const res = parseWmoWeatherCode(61);
    expect(res.condition).toBe('rainy');
    expect(res.labelVi).toContain('Mưa');
  });

  it('dịch chính xác mã 95-99 sang dông bão', () => {
    const res = parseWmoWeatherCode(95);
    expect(res.condition).toBe('storm');
    expect(res.labelVi).toContain('dông');
  });

  it('trả về mặc định an toàn cho mã không xác định', () => {
    const res = parseWmoWeatherCode(999);
    expect(res.condition).toBe('cloudy');
  });
});

describe('evaluateOutdoorSafety', () => {
  it('cảnh báo nguy cơ trời mưa dông khi xác suất mưa cao', () => {
    const warning = evaluateOutdoorSafety(65, 80);
    expect(warning.isOutdoorWarning).toBe(true);
    expect(warning.warningMessage).toContain('mưa');
  });

  it('an toàn khi trời nắng ráo và xác suất mưa thấp', () => {
    const warning = evaluateOutdoorSafety(0, 10);
    expect(warning.isOutdoorWarning).toBe(false);
    expect(warning.warningMessage).toBeUndefined();
  });
});

describe('getWeatherForecast', () => {
  it('xử lý an toàn khi gọi fetch thành công', async () => {
    const mockResponse = {
      daily: {
        time: ['2026-10-27'],
        weathercode: [0],
        temperature_2m_max: [24.5],
        precipitation_probability_max: [10],
      },
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const info = await getWeatherForecast(11.9404, 108.4583, '2026-10-27');
    expect(info).not.toBeNull();
    expect(info?.tempC).toBe(25);
    expect(info?.condition).toBe('sunny');
    expect(info?.rainProb).toBe(10);
    expect(info?.isOutdoorWarning).toBe(false);
  });

  it('xử lý an toàn và trả về null khi API lỗi hoặc mất mạng', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const info = await getWeatherForecast(11.9404, 108.4583, '2026-10-27');
    expect(info).toBeNull();
  });
});
