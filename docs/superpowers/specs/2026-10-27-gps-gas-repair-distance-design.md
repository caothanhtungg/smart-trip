# Đặc tả thiết kế: Tiện ích di chuyển - Cây xăng, Tiệm sửa xe & Số km còn lại theo GPS

**Ngày:** 2026-10-27  
**Nhánh:** `feature/gps-gas-repair-distance`  
**Mục tiêu:** Cung cấp chế độ hỗ trợ khi đang di chuyển (On-the-Road Assistant) dựa trên GPS thực tế của người dùng: tính toán số km và thời gian còn lại đến điểm đến tiếp theo, đồng thời tra cứu và hiển thị các cây xăng (Petrolimex, PVOIL,...) và tiệm sửa xe / cứu hộ lưu động gần nhất kèm chỉ dẫn đường.

---

## 1. Bối cảnh & Giá trị người dùng

Khi nhóm đang trên đường đi (bằng xe máy hoặc ô tô):
- Nhu cầu cấp thiết là biết còn bao nhiêu km nữa sẽ tới điểm dừng hoặc khách sạn tiếp theo.
- Xe sắp hết xăng cần tìm ngay cây xăng gần nhất trên tuyến đường để tránh dắt bộ.
- Xe bị thủng lốp, hỏng hóc hoặc sự cố cần tìm ngay tiệm sửa xe hoặc số điện thoại thợ sửa xe/cứu hộ gần nhất.

**Giải pháp:**
Tích hợp widget "Đang di chuyển & An toàn đường dài" (On-the-Road Safety HUD) ngay trên widget bản đồ trực tiếp của trang chuyến đi, đồng thời cho phép bật lớp hiển thị (POI Layer) cây xăng và tiệm sửa xe trực tiếp trên Bản đồ Leaflet.

---

## 2. Trải nghiệm người dùng (UI/UX)

### 2.1. Thanh HUD "Đang di chuyển" (On-The-Road HUD)
- **Vị trí:** Tích hợp trực tiếp bên dưới hoặc trong widget bản đồ trực tiếp (`TripLiveMapWidget`).
- **Nội dung:**
  - **Điểm đến tiếp theo:** Tên điểm dừng gần nhất trong lịch trình hôm nay.
  - **Khoảng cách còn lại:** Định dạng rõ ràng (ví dụ: `4.5 km` hoặc `850 m`).
  - **Thời gian ước tính:** Ước tính thời gian di chuyển (ví dụ: `~12 phút bằng xe máy / ô tô`).
  - **Nút bật định vị GPS:** Bật/tắt theo dõi vị trí trực tiếp (`watchPosition`).

### 2.2. Bộ lọc & Danh sách POI gần nhất (Cây xăng & Tiệm sửa xe)
- **Thanh lọc nhanh (Filter Tabs):**
  - "Tất cả"
  - "⛽ Cây xăng" (Icon Lucide `Fuel`)
  - "🔧 Tiệm sửa xe / Cứu hộ" (Icon Lucide `Wrench`)
- **Thẻ POI tiện ích (Roadside POI Card):**
  - Tên cơ sở (ví dụ: `Cửa hàng xăng dầu Petrolimex Số 12`, `Tiệm sửa xe máy Tuấn Cường`)
  - Khoảng cách từ vị trí GPS hiện tại (ví dụ: `Cách 650 m`, `Cách 2.1 km`)
  - Địa chỉ / Tuyến đường
  - Số điện thoại liên hệ khẩn cấp (nếu có, hỗ trợ bấm gọi `tel:...`)
  - Nút **"Xem trên bản đồ"**: Tự động phóng to và mở popup của POI trên bản đồ
  - Nút **"Chỉ đường"**: Mở chỉ đường nhanh qua Google Maps / Apple Maps

### 2.3. Hiển thị trên Bản đồ Leaflet
- Cây xăng: Marker màu Hổ phách / Cam đất (`#D97706`), icon trạm xăng.
- Tiệm sửa xe: Marker màu Xanh Cerulean (`#1A759F`), icon cờ-lê.
- Tuyến đường nối từ vị trí GPS hiện tại đến điểm dừng kế tiếp.

---

## 3. Kiến trúc kỹ thuật & Dữ liệu

### 3.1. DTOs & Domain Types
File: `src/lib/types/roadside.ts`
```ts
export type RoadsidePoiType = 'gas_station' | 'repair_shop';

export interface RoadsidePoi {
  id: string;
  name: string;
  type: RoadsidePoiType;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string;
  brand?: string; // Petrolimex, PVOIL, Honda Head, v.v.
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
```

### 3.2. Dịch vụ POI & Tính toán khoảng cách
File: `src/lib/geo/roadside-service.ts`
- Hàm `calculateDistanceKm(lat1, lon1, lat2, lon2)`: Kế thừa từ `distance.ts`.
- Hàm `formatDistance(distanceKm: number)`:
  - Nếu `< 1 km`: Hiển thị theo mét (ví dụ: `650 m`).
  - Nếu `>= 1 km`: Hiển thị `X.X km` (ví dụ: `3.2 km`).
- Hàm `estimateTravelTimeMinutes(distanceKm: number, speedKmH = 40)`: Tính thời gian di chuyển với tốc độ trung bình thực tế đường đèo/quốc lộ Việt Nam (~40 km/h).
- Cơ sở dữ liệu POI cứu hộ & xăng dầu dọc các tuyến đường huyết mạch Việt Nam (QL1A, QL20, QL4D, QL4C, QL6, Cao tốc Bắc Nam...) đảm bảo hoạt động ngoại tuyến (offline) 100% không phụ thuộc API trả phí.

---

## 4. Tiêu chuẩn thiết kế & Code
- Bảng màu: Tactile Organic Minimalism (`#184E77`, `#52B69A`, `#D9ED92`, `#D97706`).
- Icons: Lucide React (`Fuel`, `Wrench`, `Navigation`, `Clock`, `Phone`, `ExternalLink`, `Compass`).
- Testing: Kiểm thử Vitest cho Service, Distance Calculator, Formatter, Component HUD và POI Card.
