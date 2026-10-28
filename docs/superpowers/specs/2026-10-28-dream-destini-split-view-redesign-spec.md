# Đặc tả Thiết kế: Tái cấu trúc Giao diện Split-View & Sidebar theo Mẫu Dream Destini

- **Ngày ban hành:** 28/10/2026
- **Trạng thái:** DRAFT FOR REVIEW
- **Tác giả:** AI Assistant & Người dùng
- **Tham chiếu:** Mẫu giao diện Dream Destini (Left Sidebar + Split-View Horizontal Cards & Map)

---

## 1. Mục tiêu & Tầm nhìn người dùng

Người dùng mong muốn thay đổi trải nghiệm tổng thể của ứng dụng Smart Trip theo ngôn ngữ thiết kế của giao diện mẫu:
1. **Khung ứng dụng (App Shell) toàn diện:**
   - Thay thế thanh điều hướng ngang truyền thống bằng **Thanh bên điều hướng bên trái (Left Sidebar Navigation)** hiện đại, sang trọng: Logo, danh mục chức năng, thẻ tiện ích nổi bật ở chân sidebar, và khối hồ sơ cá nhân của người dùng.
   - Thanh trên cùng (Top Header) tinh giản với thanh tìm kiếm nhanh có phím tắt `⌘K`, bộ lọc thuộc tính và nút hành động chính nổi bật (CTA "+ Tạo chuyến đi").

2. **Trải nghiệm trang đầu tiên sau khi đăng nhập (Discovery & Split-View Map):**
   - Người dùng mới đăng nhập hoặc cần lập lịch trình sẽ tiếp cận ngay **Bản đồ lớn tương tác (Big Interactive Map)** chiếm toàn bộ nửa phải màn hình để trực tiếp xem các địa danh du lịch nổi tiếng, vị trí hiện tại và chọn điểm đến.
   - Nửa bên trái là khu vực **Thông tin & Tiện ích hành trình**:
     - Thẻ dự báo thời tiết tại vị trí thực tế của người dùng (tích hợp Open-Meteo).
     - Tin tức du lịch / Cẩm nang danh lam thắng cảnh ngắn gọn.
     - Danh sách các chuyến đi hiện có và gợi ý điểm đến theo định dạng **Thẻ ngang (Horizontal Cards)** có ảnh đại diện bên trái, tên địa danh, thông tin thời gian, chi phí và lượt xem/đánh giá.

3. **Lên lịch trình với Thư viện ảnh thực tế (Itinerary with Destination Photos):**
   - Các mục trong lịch trình hiển thị dạng thẻ ngang với ảnh chụp sắc nét của địa danh ở góc trái.
   - Khi click vào bất kỳ địa điểm nào, mở **Modal xem hình ảnh chi tiết (Destination Photo Gallery)** với ảnh phóng to, thông tin giới thiệu danh lam thắng cảnh, tọa độ GPS và thời tiết thực tế.
   - Giữ nguyên 100% logic quản lý thành viên, chi tiêu, chia tiền và đối soát công nợ đã hoàn thiện.

---

## 2. Hệ thống Thiết kế & Thẩm mỹ (Tactile Organic Minimalist + Destini Accent)

- **Gam màu chủ đạo:**
  - Nền Canvas: `#F8F9FA` / `#F4F9EC` (ấm áp, sạch sẽ, không chói mắt).
  - Thanh bên Sidebar: Nền trắng ngà `#FFFFFF`, viền hairline siêu mảnh `#E9ECEF`.
  - Nút hành động chính (Accent CTA): Cam gạch nung ấm áp `#E05833` / `#E76F51` (tương tự nút `+ Add Property` trong ảnh mẫu).
  - Điểm nhấn lộ trình & trạng thái: Baltic Blue `#1E6091`, Yale Blue `#184E77`, Mint Green `#52B69A`.
  - Pin bản đồ: Glowing Pill Badges với viền hào quang mờ (`box-shadow: 0 0 15px rgba(224, 88, 51, 0.45)`).

- **Kiểu chữ & Typography:**
  - Font chữ: `Be Vietnam Pro` hỗ trợ hoàn hảo tiếng Việt.
  - Heading: Font-bold với khoảng cách chữ chặt chẽ (`tracking-tight`).
  - Số liệu: Dạng `tabular-nums` căn chỉnh chuẩn mực tài chính và số km.

---

## 3. Kiến trúc Luồng Người dùng & Phân rã Màn hình

### 3.1. App Shell Layout (`src/app/(app)/layout.tsx`)
- Bố cục 2 phần:
  - **Left Sidebar (`src/components/layout/AppSidebar.tsx`)**:
    - Header: Logo Smart Trip + biểu tượng la bàn/tia sét + nút đóng mở sidebar (`ChevronLeft` / `Menu`).
    - Navigation Items:
      - `Khám phá & Bản đồ` (Home / Discovery)
      - `Chuyến đi của tôi` (`/trips`)
      - `Lịch trình chi tiết` (khi đang ở trong chuyến đi)
      - `Sổ quỹ & Chi tiêu` (khi đang ở trong chuyến đi)
      - `Cẩm nang & Tin tức` (`/guides`)
    - Sidebar Feature Card: Thẻ thời tiết hoặc gợi ý AI với ảnh nền du lịch và nút kích hoạt nhanh.
    - Sidebar User Footer: Avatar, Tên người dùng, Email, nút mở popover profile & đăng xuất.
  - **Main Content Wrapper**:
    - **AppTopBar**: Tiêu đề trang, thanh tìm kiếm `⌘K`, bộ lọc tag, và nút `+ Tạo chuyến đi`.
    - Phần nội dung động cuộn mượt mà.

### 3.2. Trang Khám phá & Bản đồ Chia đôi (`src/app/(app)/trips/page.tsx`)
- **Split-View Pane (Tỷ lệ 45% List / 55% Map trên Desktop, Tab chuyển đổi trên Mobile)**:
  - **Pane Trái (Content & Cards)**:
    - Widget thời tiết địa phương (Open-Meteo Geolocation).
    - Cẩm nang danh lam thắng cảnh Việt Nam tuyển chọn.
    - Danh sách Chuyến đi của tôi / Điểm đến đề xuất dạng Thẻ ngang (Thumbnail trái, Chi tiết phải).
  - **Pane Phải (Interactive Destination Discovery Map)**:
    - Bản đồ toàn cảnh với các điểm du lịch nổi tiếng Việt Nam (Hà Nội, Vịnh Hạ Long, Sapa, Đà Nẵng, Hội An, Nha Trang, Đà Lạt, Phú Quốc,...).
    - Glowing Map Badges: Thể hiện tên địa danh hoặc ngân sách dự kiến.
    - Khi click vào marker trên bản đồ: Popup hiển thị ảnh đẹp của địa danh + nút "Tạo chuyến đi đến đây" (mở modal tạo chuyến đi điền sẵn tên & tọa độ).

### 3.3. Lịch trình Thông minh có Hình ảnh (`src/components/trips/itinerary/`)
- Cung cấp dịch vụ hình ảnh địa danh (`src/lib/geo/destination-photos.ts`): Cung cấp ảnh mẫu du lịch Việt Nam chất lượng cao theo từ khóa địa danh.
- Cải tiến `TripItineraryCard`:
  - Khung ảnh thumbnail 80x80px hoặc 100x75px bên trái với bo góc `rounded-xl` và nút zoom ảnh nhanh.
  - Thông tin địa điểm, giờ giấc, thời tiết, khoảng cách di chuyển bên phải.
- Modal xem ảnh (`DestinationGalleryModal.tsx`):
  - Phóng to ảnh danh lam thắng cảnh, mô tả tóm tắt, mẹo khi ghé thăm và tọa độ GPS.

---

## 4. Kiểm thử & Tiêu chuẩn Chất lượng

- Giữ nguyên 100% 94 test files (1.219 tests) đang vượt qua của toàn bộ hệ thống nghiệp vụ (Members, Auth, Expenses, Splits, Settlement, VietQR, TSP Route Optimization, Weather).
- Bổ sung kiểm thử đơn vị cho:
  - `destination-photos.test.ts`: Khả năng phân giải ảnh chuẩn xác theo địa danh du lịch.
  - `AppSidebar.test.ts`: Render đúng cấu trúc menu và tương tác chuyển trang.
  - `DestinationGalleryModal.test.ts`: Mở modal và hiển thị ảnh phóng to khi click vào địa điểm.
- Xác thực `npm run build` không có lỗi SSR của Leaflet Map và không có lỗi kiểu TypeScript.
