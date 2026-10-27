# Tài liệu Thiết kế Kỹ thuật: Bản đồ Tương tác, Tối ưu Lộ trình & Thời tiết Thực tế
**Dự án:** Smart Trip & Expense Planner  
**Phiên bản mở rộng:** Release 2 (Phân hệ Bản đồ & Điều hướng)  
**Ngày lập:** 27/10/2026  
**Trạng thái:** Chờ phê duyệt (Pending Review)

---

## 1. Mục đích & Bối cảnh (Intent & Why)

Sau khi hoàn thiện Release 1 (Quản lý chuyến đi nhóm, chia tiền, đối soát nợ VietQR), Smart Trip cần bước sang Release 2 với trọng tâm là **Trải nghiệm Lập kế hoạch Trực quan & Đồng hành thực tế trên đường đi**.

Người dùng đi du lịch nhóm thường gặp 3 khó khăn lớn:
1. **Mất phương hướng không gian:** Đọc danh sách địa điểm dạng chữ không hình dung được vị trí xa gần, dễ lên lịch các điểm ngược đường nhau gây tốn thời gian di chuyển.
2. **Khó kiểm soát lịch trình khi có thay đổi:** Khi phát sinh thêm điểm ghé hoặc bỏ bớt điểm, việc sắp xếp lại thứ tự bằng tay rất mất công và dễ bị lòng vòng.
3. **Bị động trước thời tiết:** Đến nơi mới biết trời mưa bão hoặc sương mù dày đặc (đặc biệt các điểm ngoài trời như đỉnh núi, thác, bãi biển), làm hỏng trải nghiệm chuyến đi.

Tính năng này biến **Bản đồ số** thành trung tâm tương tác thị giác trên toàn hệ sinh thái ứng dụng, tích hợp thuật toán tự động tối ưu đường đi ngắn nhất và cập nhật thời tiết thực tế để cảnh báo/gợi ý lịch trình thông minh.

---

## 2. Mục tiêu (Goals, Non-Goals & Anti-Goals)

### Mục tiêu chính (Goals)
1. **Bản đồ Khám phá tại Trang chủ / Tạo chuyến (`/` & `/trips/new`):** Cho phép người dùng xem bản đồ các địa danh nổi tiếng, ghim/chọn điểm đến mong muốn để tạo chuyến đi trực tiếp.
2. **Bản đồ Lộ trình & Tối ưu tại Lịch trình (`/trips/[id]/itinerary`):**
   - Hiển thị toàn bộ các điểm dừng chân của từng ngày kèm đường nối tuyến đi (Route Polyline).
   - Hỗ trợ chọn điểm đến từ bản đồ hoặc tìm kiếm gợi ý địa chỉ (Geocoding Autocomplete).
   - **Tự động tối ưu lộ trình:** Sắp xếp lại thứ tự các điểm trong ngày theo đường đi ngắn nhất ngay khi có thao tác thêm, sửa hoặc xóa địa điểm.
   - Cho phép người dùng bật/tắt (Toggle) chế độ tự động tối ưu hoặc bấm nút "Tối ưu lại ngay".
3. **Tích hợp Thời tiết Thực tế & Gợi ý điểm đến:**
   - Hiển thị nhiệt độ, icon thời tiết (nắng, mưa, mây, dông) tại từng điểm đến theo ngày dự kiến.
   - Hệ thống đưa ra cảnh báo thời tiết (ví dụ: "Dự báo mưa to tại Thác Datanla") và gợi ý chuyển sang điểm trong nhà hoặc dời khung giờ.
4. **Bản đồ Trung tâm tại Tổng quan chuyến đi (`/trips/[id]`):**
   - Hiển thị bản đồ lớn ở phần thông tin chuyến đi, đánh dấu trực quan hiện trạng cả nhóm đang ở đâu trên hành trình.
5. **Gắn vị trí vào Chi tiêu (`/trips/[id]/expenses`):**
   - Cho phép liên kết khoản chi tiêu với một địa điểm cụ thể trên bản đồ (hoặc mượn điểm từ lịch trình).

### Ngoài phạm vi đợt này (Non-Goals)
- Không làm tính năng Turn-by-Turn GPS Navigation bằng giọng nói (như Google Maps / Apple Maps Navigation).
- Không chia sẻ vị trí thời gian thực (Live GPS Sharing) liên tục giữa nhiều điện thoại qua WebSocket (sẽ thuộc Release 3 để tránh quá tải server và hao pin).
- Không tích hợp đặt vé / phòng khách sạn trực tuyến bên ngoài (Affiliate / Booking API).

### Điều cấm kỵ (Anti-Goals)
- **Tuyệt đối không làm chậm trang:** Bản đồ không được làm giật lag giao diện, phải hỗ trợ lazy-loading (Dynamic Import với `ssr: false`).
- **Không ép buộc người dùng phụ thuộc 100% vào thuật toán:** Người dùng vẫn có quyền kéo thả hoặc chỉnh thứ tự thủ công nếu muốn đi theo lịch hẹn giờ cố định.
- **Không dùng các dịch vụ bản đồ / thời tiết bắt buộc thẻ tín dụng quốc tế hoặc phát sinh chi phí lớn:** Ưu tiên các giải pháp nguồn mở, API miễn phí, chuẩn hóa toàn cầu.

---

## 3. Ràng buộc Hệ thống (Constraints)

1. **Tuân thủ Design System Tactile Organic Minimalism:**
   - Palette màu cốt lõi: Lime Cream `#D9ED92`, Ocean Mist `#52B69A`, Cerulean `#1A759F`, Baltic Blue `#1E6091`, Yale Blue `#184E77`, Canvas `#F4F9EC`.
   - Font chữ: `Be Vietnam Pro`.
   - Icon: Phosphor Icons / Lucide React (không dùng emoji làm biểu tượng tính năng).
2. **Kiến trúc Next.js 16 & Server Components:**
   - Các component Leaflet/Mapbox chỉ được render phía Client (`'use client'` + dynamic import) do thư viện bản đồ tương tác với đối tượng `window`.
3. **Cơ sở dữ liệu Prisma & PostgreSQL:**
   - Giữ nguyên cấu trúc dữ liệu và các quan hệ của Release 1; mở rộng schema có kiểm soát (backward-compatible).

---

## 4. Đặc tả Kiến trúc & Giải pháp Kỹ thuật (Decided by Discussion)

### 4.1. Mở rộng Cơ sở Dữ liệu (Prisma Schema)
1. Bảng `itinerary_items`:
   - Thêm cột `latitude Float?` và `longitude Float?` (tọa độ GPS WGS-84).
   - Thêm cột `is_locked Boolean @default(false)` (khóa điểm cố định, không bị thuật toán tự đảo thứ tự).
2. Bảng `expenses`:
   - Đã có sẵn `itinerary_item_id` tham chiếu `ItineraryItem`. Thêm cột `place_name String?` và `address String?` nếu khoản chi không thuộc lịch trình nhưng muốn lưu vị trí.

### 4.2. Thư viện Bản đồ & Nguồn Dữ liệu
- **Bản đồ hiển thị (Map Engine):** Sử dụng **Leaflet + React-Leaflet** kết hợp bản đồ nền **OpenStreetMap (OSM) CartoDB Positron / OpenStreetMap Standard** (hoàn toàn miễn phí, nhẹ, không giới hạn request, không cần API Key phức tạp).
- **Tìm kiếm địa điểm (Geocoding Autocomplete):** Tích hợp **Nominatim OpenStreetMap API** hoặc Photon API (miễn phí, hỗ trợ tìm kiếm địa điểm, địa chỉ tại Việt Nam cực tốt) để tự động lấy tọa độ `lat`, `lng` khi người dùng nhập tên điểm đến.

### 4.3. Thuật toán Tối ưu Lộ trình (Route Optimization)
- **Nguyên lý:** Giải bài toán Người giao hàng (Traveling Salesperson Problem - TSP).
- **Quy trình tối ưu:**
  1. Xác định điểm xuất phát: Điểm đầu tiên của ngày (ví dụ: Khách sạn / Điểm xuất phát được đánh dấu cố định `is_locked = true`).
  2. Tính ma trận khoảng cách giữa các điểm còn lại bằng công thức Haversine (đường chim bay) kết hợp **OSRM (Open Source Routing Machine) Trip API** (miễn phí) để lấy quãng đường giao thông thực tế.
  3. Áp dụng thuật toán **Nearest Neighbor** kết hợp **2-Opt Local Search** để sắp xếp lại chuỗi thứ tự `sortOrder` sao cho tổng quãng đường di chuyển là ngắn nhất.
  4. Cập nhật lại `sortOrder` của các `itinerary_items` trong ngày.
- **Tự động kích hoạt:**
  - Khi thêm địa điểm mới vào ngày -> hệ thống tự tính và chèn vào vị trí tối ưu trên cung đường.
  - Khi xóa/sửa địa điểm -> hệ thống tự động tái cân bằng lộ trình.
  - Có nút Switch: `Tự động tối ưu đường đi (Bật/Tắt)` để người dùng toàn quyền kiểm soát.

### 4.4. Tích hợp Thời tiết Thực tế & Gợi ý Thông minh
- **Nguồn dữ liệu:** **Open-Meteo Weather API** (Miễn phí 100%, không cần API key, độ chính xác cao, cung cấp dự báo 7-14 ngày chi tiết từng giờ theo tọa độ GPS).
- **Cơ chế hoạt động:**
  - Dựa vào `dayDate` và `(latitude, longitude)` của từng điểm đến, server lấy thông tin: Nhiệt độ (°C), thời tiết (Mã WMO: Nắng, Mây, Mưa rào, Mưa dông), khả năng mưa (Precipitation probability %).
  - **Hệ thống gợi ý thông minh:**
    - Nếu điểm đến ngoài trời có xác suất mưa > 60% vào khung giờ dự kiến: Hiển thị cảnh báo màu cam kèm lời khuyên: *"Dự báo mưa lúc 14:00 - Cân nhắc ghé thăm vào buổi sáng hoặc dời sang điểm trong nhà gần đó"*.
    - Thuật toán ưu tiên đẩy các điểm tham quan ngoài trời vào các khung giờ thời tiết đẹp và xếp các điểm trong nhà (quán cafe, bảo tàng, chợ trong nhà) vào các khung giờ có mưa.

### 4.5. Hiển thị "Nhóm đang ở đâu" trên Trang Tổng quan
- Trên trang `/trips/[id]`, Widget bản đồ hiển thị:
  - Tuyến đường tổng thể của ngày hôm nay.
  - Vị trí hiện tại: Lấy từ GPS trình duyệt của thành viên đang xem (với sự cho phép qua Geolocation API). Nếu chưa cấp quyền, hệ thống hiển thị mốc điểm đến kế tiếp theo mốc thời gian thực tế trong ngày.

---

## 5. Các Quyết định Kỹ thuật Dành cho Đội ngũ Triển khai (Left to Builder)

1. **Lựa chọn bộ Icon Thời tiết:** Sử dụng Lucide React icons (`Sun`, `CloudRain`, `CloudLightning`, `Umbrella`, `Wind`) để đồng bộ tuyệt đối với phong cách UI hiện tại của dự án.
2. **Bộ nhớ đệm thời tiết (Caching Strategy):** Dữ liệu dự báo thời tiết của một tọa độ được cache 30 - 60 phút (qua `next: { revalidate: 1800 }`) để tránh gọi API trùng lặp cho các thành viên trong cùng chuyến đi.
3. **Phân trang & Đóng gói:** Tách riêng các module logic:
   - `src/lib/geo/distance.ts`: Tính toán khoảng cách & ma trận TSP.
   - `src/lib/geo/weather.ts`: Client gọi Open-Meteo API & chuẩn hóa mã thời tiết.
   - `src/components/map/`: Các component bản đồ Leaflet tái sử dụng.

---

## 6. Tiêu chí Nghiệm thu (Acceptance Criteria)

1. **Hiệu năng:** Bản đồ tải mượt mà trên cả máy tính và điện thoại di động, không làm block quá trình render trang.
2. **Độ chính xác lộ trình:** Khi thêm 4 địa điểm rải rác trong một ngày, hệ thống tự động sắp xếp theo thứ tự vòng tròn/tuyến tính hợp lý, không chạy zig-zag qua lại.
3. **Độ tin cậy thời tiết:** Hiển thị đúng biểu tượng thời tiết và nhiệt độ thực tế theo ngày đi của chuyến.
4. **Kiểm thử tự động:** Bổ sung unit test cho giải thuật tối ưu lộ trình (TSP/2-Opt) và bộ parser thời tiết, đảm bảo toàn bộ test suites của dự án tiếp tục pass 100%.
