# Interactive Map, Route Optimization & Real-Time Weather Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng hệ sinh thái bản đồ tương tác toàn diện (Trang chủ, Lịch trình, Chi tiêu, Tổng quan), tích hợp thuật toán tối ưu lộ trình ngắn nhất (TSP) và cập nhật thời tiết thực tế (Open-Meteo API).

**Architecture:** Mở rộng schema Prisma lưu trữ tọa độ GPS (`latitude`, `longitude`) và cờ cố định điểm (`is_locked`). Tách biệt tầng tính toán không gian `src/lib/geo/` (khoảng cách Haversine, 2-opt TSP, Open-Meteo client), đóng gói component bản đồ Leaflet chạy CSR qua Next.js dynamic import, và kết nối với các màn hình hiện có mà không làm ảnh hưởng đến tính toàn vẹn của Release 1.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Prisma 7, PostgreSQL, Tailwind CSS 4, Leaflet, Open-Meteo API, OpenStreetMap, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-interactive-map-route-optimization-weather-design.md`

## Global Constraints

- Palette màu tuân thủ tuyệt đối Tactile Organic Minimalism: Lime Cream `#D9ED92`, Ocean Mist `#52B69A`, Cerulean `#1A759F`, Baltic Blue `#1E6091`, Yale Blue `#184E77`, Canvas `#F4F9EC`.
- Font chữ: Be Vietnam Pro.
- Thuật ngữ giao diện phải theo `src/lib/labels.ts`: Trưởng nhóm, Chưa có tài khoản, Mã mời.
- Tiền tệ: VND số nguyên, không dùng số thực floating point.
- Không dùng emoji làm biểu tượng tính năng, chỉ dùng vector icons (Lucide React).
- Mọi component bản đồ Leaflet phải render phía Client (`'use client'` + dynamic import `ssr: false`).
- Dịch vụ bản đồ và thời tiết phải là nguồn mở hoặc miễn phí 100% (OpenStreetMap, Open-Meteo), không yêu cầu thẻ tín dụng hoặc secret có phí.

## Review Focus

1. **Địa điểm không có tọa độ GPS:** Người dùng nhập tay địa điểm mà không chọn gợi ý bản đồ (lat/lng = null) -> Hệ thống vẫn lưu bình thường, giữ nguyên thứ tự trong ngày, không gây crash thuật toán tối ưu lộ trình.
2. **Ngày chỉ có 0 hoặc 1 địa điểm:** Chạy tối ưu lộ trình cho một ngày không có điểm nào hoặc chỉ có 1 điểm -> Trả về danh sách nguyên trạng ngay lập tức mà không tính toán ma trận.
3. **Open-Meteo API bị lỗi hoặc quá hạn:** Mất kết nối internet hoặc API thời tiết trả về mã 500/timeout -> Giao diện ẩn huy hiệu thời tiết hoặc hiển thị trạng thái "Không có dữ liệu thời tiết" an toàn, không làm treo trang lịch trình.
4. **Điểm xuất phát bị cố định (`is_locked = true`):** Khách sạn hoặc điểm bắt đầu của ngày được khóa -> Thuật toán TSP luôn giữ điểm này ở vị trí số 1 (`sortOrder = 0`), chỉ xáo trộn và tối ưu các điểm tiếp theo.
5. **Đồng bộ tối ưu trên thiết bị di động:** Khi người dùng thêm điểm trên màn hình điện thoại nhỏ -> Tự động tính toán lại mà không làm giật màn hình hoặc nhảy thanh cuộn của người dùng.

---

### Task 1: Mở rộng Schema Prisma & Định nghĩa Kiểu dữ liệu Tọa độ

**Files:**
- Modify: `prisma/schema.prisma:224-265`
- Modify: `src/lib/types/itinerary.ts` (hoặc tạo mới nếu chưa có)
- Test: `src/lib/types/itinerary-coordinates.test.ts`

**Interfaces:**
- Produces: `ItineraryItem` với `latitude: number | null`, `longitude: number | null`, `isLocked: boolean`.
- Produces: Zod schema `itineraryItemSchema` xác thực tọa độ hợp lệ (-90 <= lat <= 90, -180 <= lng <= 180).

- [ ] **Step 1: Viết test thất bại kiểm tra validation tọa độ GPS**

```typescript
// src/lib/types/itinerary-coordinates.test.ts
import { describe, it, expect } from 'vitest';
import { validateCoordinates } from './itinerary-coordinates';

describe('validateCoordinates', () => {
  it('chấp nhận tọa độ hợp lệ tại Việt Nam', () => {
    expect(validateCoordinates(11.9404, 108.4583)).toBe(true); // Đà Lạt
  });
  it('từ chối vĩ độ hoặc kinh độ ngoài phạm vi', () => {
    expect(validateCoordinates(95, 108)).toBe(false);
    expect(validateCoordinates(11, 190)).toBe(false);
  });
  it('cho phép tọa độ null/undefined', () => {
    expect(validateCoordinates(null, null)).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Run: `npx vitest run src/lib/types/itinerary-coordinates.test.ts`
Expected: FAIL với lỗi file hoặc hàm chưa tồn tại.

- [ ] **Step 3: Cập nhật `prisma/schema.prisma` và hiện thực `validateCoordinates`**

Thêm vào `ItineraryItem`:
```prisma
  latitude          Float?
  longitude         Float?
  isLocked          Boolean    @default(false) @map("is_locked")
```
Thêm vào `Expense`:
```prisma
  placeName         String?    @map("place_name") @db.VarChar(200)
  address           String?
```
Chạy `npx prisma generate` để cập nhật TypeScript client. Viết `validateCoordinates` trong `src/lib/types/itinerary-coordinates.ts`.

- [ ] **Step 4: Chạy lại test để xác nhận test pass**

Run: `npx vitest run src/lib/types/itinerary-coordinates.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma src/lib/types/
git commit -m "feat(geo): add coordinates and lock flag to itinerary schema"
```

---

### Task 2: Dịch vụ Tính toán Khoảng cách & Giải thuật Tối ưu Lộ trình (TSP)

**Files:**
- Create: `src/lib/geo/distance.ts`
- Test: `src/lib/geo/distance.test.ts`

**Interfaces:**
- Produces: `calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number` (mét)
- Produces: `optimizeDayRoute<T extends { id: string; latitude: number | null; longitude: number | null; isLocked?: boolean }>(items: T[]): T[]`

- [ ] **Step 1: Viết test thất bại cho khoảng cách Haversine và tối ưu lộ trình 4 điểm**

```typescript
// src/lib/geo/distance.test.ts
import { describe, it, expect } from 'vitest';
import { calculateHaversineDistance, optimizeDayRoute } from './distance';

describe('Geo Distance & Optimization', () => {
  it('tính chính xác khoảng cách giữa Chợ Đà Lạt và Hồ Xuân Hương (~700m - 1000m)', () => {
    const choDaLat = { lat: 11.9427, lng: 108.4373 };
    const hoXuanHuong = { lat: 11.9404, lng: 108.4450 };
    const dist = calculateHaversineDistance(choDaLat.lat, choDaLat.lng, hoXuanHuong.lat, hoXuanHuong.lng);
    expect(dist).toBeGreaterThan(600);
    expect(dist).toBeLessThan(1200);
  });

  it('tối ưu lại thứ tự 4 điểm tránh đi vòng zig-zag', () => {
    const p1 = { id: 'hotel', latitude: 11.940, longitude: 108.440, isLocked: true }; // Xuất phát
    const p2 = { id: 'far_east', latitude: 11.940, longitude: 108.480, isLocked: false };
    const p3 = { id: 'mid_east', latitude: 11.940, longitude: 108.450, isLocked: false };
    const p4 = { id: 'farther_east', latitude: 11.940, longitude: 108.500, isLocked: false };
    
    // Đưa vào thứ tự lộn xộn: p1 -> p4 -> p3 -> p2
    const result = optimizeDayRoute([p1, p4, p3, p2]);
    expect(result[0].id).toBe('hotel'); // Giữ nguyên điểm khóa đầu tiên
    expect(result.map(p => p.id)).toEqual(['hotel', 'mid_east', 'far_east', 'farther_east']);
  });

  it('xử lý an toàn khi mảng có 0 hoặc 1 điểm hoặc điểm không có tọa độ', () => {
    const noCoord = { id: 'p0', latitude: null, longitude: null };
    expect(optimizeDayRoute([noCoord])).toEqual([noCoord]);
    expect(optimizeDayRoute([])).toEqual([]);
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Run: `npx vitest run src/lib/geo/distance.test.ts`
Expected: FAIL

- [ ] **Step 3: Cài đặt thuật toán trong `src/lib/geo/distance.ts`**

Sử dụng công thức Haversine tính khoảng cách cung tròn. Sử dụng giải thuật Nearest Neighbor + 2-Opt heuristic cho mảng điểm có tọa độ, giữ nguyên các điểm có `isLocked = true` ở đầu danh sách, và đính kèm các điểm không có tọa độ về cuối mảng.

- [ ] **Step 4: Chạy test xác nhận pass**

Run: `npx vitest run src/lib/geo/distance.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/geo/distance.ts src/lib/geo/distance.test.ts
git commit -m "feat(geo): implement haversine distance and 2-opt TSP route optimization"
```

---

### Task 3: Tích hợp Open-Meteo Weather API & Parser Thời tiết Thực tế

**Files:**
- Create: `src/lib/geo/weather.ts`
- Test: `src/lib/geo/weather.test.ts`

**Interfaces:**
- Produces: `getWeatherForecast(lat: number, lng: number, dateStr: string): Promise<WeatherInfo | null>`
- Produces: `type WeatherInfo = { tempC: number; condition: 'sunny' | 'cloudy' | 'rainy' | 'storm'; labelVi: string; rainProb: number; isOutdoorWarning: boolean; warningMessage?: string }`

- [ ] **Step 1: Viết test thất bại cho parser mã thời tiết WMO**

```typescript
// src/lib/geo/weather.test.ts
import { describe, it, expect } from 'vitest';
import { parseWmoWeatherCode, evaluateOutdoorSafety } from './weather';

describe('Weather Parser & Safety Advice', () => {
  it('dịch chính xác mã WMO sang trạng thái tiếng Việt', () => {
    expect(parseWmoWeatherCode(0).condition).toBe('sunny');
    expect(parseWmoWeatherCode(61).condition).toBe('rainy');
    expect(parseWmoWeatherCode(95).condition).toBe('storm');
  });

  it('cảnh báo nguy cơ trời mưa dông cho điểm tham quan ngoài trời', () => {
    const warning = evaluateOutdoorSafety(65, 80); // Mưa to, xác suất 80%
    expect(warning.isOutdoorWarning).toBe(true);
    expect(warning.warningMessage).toContain('mưa');
  });
});
```

- [ ] **Step 2: Chạy test để xác nhận test thất bại**

Run: `npx vitest run src/lib/geo/weather.test.ts`
Expected: FAIL

- [ ] **Step 3: Cài đặt `src/lib/geo/weather.ts`**

Xây dựng bộ chuyển đổi mã WMO chuẩn khí tượng học. Viết hàm `getWeatherForecast` gọi `https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&daily=weathercode,temperature_2m_max,precipitation_probability_max&timezone=Asia%2FBangkok` với `fetch` cache `revalidate: 3600`. Bắt lỗi `try/catch` trả về `null` an toàn nếu không có mạng.

- [ ] **Step 4: Chạy test xác nhận pass**

Run: `npx vitest run src/lib/geo/weather.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/geo/weather.ts src/lib/geo/weather.test.ts
git commit -m "feat(geo): add Open-Meteo client and WMO weather safety parser"
```

---

### Task 4: API Tối ưu Lộ trình & Tự động Sắp xếp Lại Điểm đến

**Files:**
- Create: `src/app/api/trips/[id]/itinerary/optimize/route.ts`
- Modify: `src/app/api/trips/[id]/itinerary/route.ts` (thêm cờ auto-optimize khi tạo/sửa)
- Test: `src/app/api/trips/[id]/itinerary/optimize/route.test.ts`

**Interfaces:**
- Consumes: `optimizeDayRoute` từ `src/lib/geo/distance.ts`
- Produces: Endpoint `POST /api/trips/[id]/itinerary/optimize` nhận `{ dayDate: string }` và cập nhật `sortOrder` hàng loạt trong Prisma transaction.

- [ ] **Step 1: Viết test cho Route Handler tối ưu lộ trình**

Kiểm tra: Xác thực thành viên trong chuyến, lấy danh sách `itinerary_items` của ngày đó, sắp xếp lại `sortOrder` bằng `optimizeDayRoute`, và lưu vào DB.

- [ ] **Step 2: Chạy test để xác nhận thất bại**

Run: `npx vitest run src/app/api/trips/[id]/itinerary/optimize/route.test.ts`
Expected: FAIL (404 chưa có route).

- [ ] **Step 3: Cài đặt Route Handler trong `src/app/api/trips/[id]/itinerary/optimize/route.ts`**

Gọi `prisma.$transaction` để cập nhật `sortOrder` của từng item sau khi tối ưu.

- [ ] **Step 4: Chạy test xác nhận pass**

Run: `npx vitest run src/app/api/trips/[id]/itinerary/optimize/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/app/api/trips/[id]/itinerary/
git commit -m "feat(api): add itinerary route optimization endpoint and transactions"
```

---

### Task 5: Thành phần Bản đồ Tương tác Leaflet (Core Map Component)

**Files:**
- Install: `npm install leaflet` & `npm install -D @types/leaflet`
- Create: `src/components/map/TripLeafletMap.tsx`
- Create: `src/components/map/InteractiveMap.tsx` (Dynamic SSR-off wrapper)
- Test: `src/components/map/InteractiveMap.test.tsx` (Smoke test render không vỡ SSR)

**Interfaces:**
- Produces: `<InteractiveMap points={points} onSelectPoint={...} showRoute={true} center={[lat, lng]} zoom={13} />`
- Styling: Sử dụng Tile layer OpenStreetMap CartoDB Positron / OSM Standard, marker màu Yale Blue `#184E77` và đường nối lộ trình Lime/Emerald `#76C893`.

- [ ] **Step 1: Cài đặt gói `leaflet` và `@types/leaflet`**

Run: `npm install leaflet && npm install -D @types/leaflet`

- [ ] **Step 2: Tạo component bọc Client-side dynamic import**

Tạo `src/components/map/InteractiveMap.tsx` sử dụng `next/dynamic` với `{ ssr: false }` và fallback skeleton tải bản đồ màu nhạt Canvas `#F4F9EC`.

- [ ] **Step 3: Hiện thực `TripLeafletMap.tsx`**

Vẽ các điểm mốc (Marker) đánh số thứ tự `1, 2, 3...`, vẽ đường Polyline giữa các điểm, hiển thị thẻ Popup thông tin điểm đến và nhiệt độ/thời tiết.

- [ ] **Step 4: Kiểm tra TypeScript và build**

Run: `npx tsc --noEmit`
Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/map/ package.json package-lock.json
git commit -m "feat(ui): add Leaflet interactive map with custom markers and polyline"
```

---

### Task 6: Tích hợp Bản đồ vào Trang Tạo chuyến (`/trips/new`) & Tìm kiếm Địa điểm (Nominatim)

**Files:**
- Create: `src/lib/geo/nominatim.ts` (Geocoding search API miễn phí của OSM)
- Modify: `src/app/trips/new/page.tsx` hoặc modal tạo chuyến
- Test: `src/lib/geo/nominatim.test.ts`

**Interfaces:**
- Produces: `searchPlaces(query: string): Promise<Array<{ name: string; address: string; lat: number; lng: number }>>`

- [ ] **Step 1: Viết test cho `searchPlaces` với mock fetch**
- [ ] **Step 2: Cài đặt hàm tìm kiếm địa điểm Nominatim OSM với debounce**
- [ ] **Step 3: Tích hợp vào ô nhập điểm đến chuyến đi kèm xem trước vị trí trên bản đồ nhỏ**
- [ ] **Step 4: Chạy test xác nhận pass**
- [ ] **Step 5: Commit**

```bash
git add src/lib/geo/nominatim.ts src/app/trips/new/
git commit -m "feat(trips): integrate destination map picker into trip creation flow"
```

---

### Task 7: Tích hợp Bản đồ & Cảnh báo Thời tiết vào Trang Lịch trình (`/trips/[id]/itinerary`)

**Files:**
- Modify: `src/app/trips/[id]/itinerary/page.tsx`
- Create/Modify: `src/components/itinerary/WeatherBadge.tsx`
- Create/Modify: `src/components/itinerary/RouteOptimizationBar.tsx`

- [ ] **Step 1: Tạo thẻ `WeatherBadge` hiển thị nhiệt độ, icon và tooltip cảnh báo mưa**
- [ ] **Step 2: Thêm thanh công cụ `RouteOptimizationBar` chứa nút "Tự động tối ưu" (Switch on/off) và nút "Tối ưu lại ngay"**
- [ ] **Step 3: Bổ sung chế độ xem Bản đồ (Tab hoặc chia đôi màn hình) đồng bộ điểm đang chọn với danh sách thẻ**
- [ ] **Step 4: Thêm tọa độ khi bấm thêm địa điểm qua Modal `th_m_a_i_m_modal`**
- [ ] **Step 5: Chạy test và lint toàn dự án**

Run: `npm test && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/app/trips/[id]/itinerary/ src/components/itinerary/
git commit -m "feat(itinerary): integrate interactive map, weather badge and auto-route optimization"
```

---

### Task 8: Tích hợp Bản đồ "Nhóm đang ở đâu" vào Trang Tổng quan Chuyến đi (`/trips/[id]`)

**Files:**
- Modify: `src/app/trips/[id]/page.tsx` (Mở lại khối widget bản đồ lộ trình)
- Create: `src/components/trips/TripLiveMapWidget.tsx`

- [ ] **Step 1: Xây dựng `TripLiveMapWidget`**
  - Hiển thị bản đồ lộ trình của ngày hôm nay.
  - Sử dụng `navigator.geolocation.getCurrentPosition` để hiển thị chấm xanh (Pulsing marker) biểu thị vị trí thực tế của nhóm nếu người dùng cấp quyền.
- [ ] **Step 2: Mở lại widget bản đồ trên trang Hub `/trips/[id]`**
- [ ] **Step 3: Kiểm tra hiển thị responsive (Desktop 12 cột, Mobile 1 cột)**
- [ ] **Step 4: Commit**

```bash
git add src/components/trips/TripLiveMapWidget.tsx src/app/trips/[id]/page.tsx
git commit -m "feat(trips): activate live map widget on trip overview page"
```

---

### Task 9: Kiểm thử Tích hợp Toàn diện (End-to-End Verification & Regression Testing)

**Files:**
- Test: `src/lib/geo/geo-integration.test.ts`

- [ ] **Step 1: Viết test kịch bản hoàn chỉnh**
  - Tạo 5 điểm lịch trình rải rác -> Chạy hàm tối ưu -> Kiểm tra thứ tự ngắn nhất.
  - Kiểm tra các điểm thời tiết xấu hiển thị đúng cảnh báo.
- [ ] **Step 2: Chạy toàn bộ 75+ test suites hiện có của dự án**

Run: `npm test`
Expected: 100% tests pass (không gây hồi quy bất kỳ tính năng Release 1 nào).

- [ ] **Step 3: Chạy build kiểm tra Next.js**

Run: `npm run build`
Expected: Build thành công sạch sẽ không có lỗi SSR.

- [ ] **Step 4: Commit hoàn tất phân hệ**

```bash
git add .
git commit -m "test(geo): verify route optimization, weather and map regressions"
```
