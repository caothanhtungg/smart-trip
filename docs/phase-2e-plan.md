# KẾ HOẠCH TRIỂN KHAI GIAI ĐOẠN 2E: LỊCH TRÌNH CHUYẾN ĐI (ITINERARY MANAGEMENT)

> **Tài liệu lập kế hoạch kỹ thuật cho Giai đoạn 2E**  
> Căn cứ vào: `PROJECT_CONTEXT.md`, `docs/ENGINEERING_STANDARDS.md`, `sodothietke/release1-usecase.drawio` (UC08, UC09, UC10), `sodothietke/release1-erd.dbml` (`itinerary_items`), và thiết kế Stitch `stitch_smart_trip_dashboard_design/l_ch_tr_nh_l_t_3n2` cùng `th_m_a_i_m_modal_l_t_3n2`.

---

## 1. MỤC TIÊU VÀ PHẠM VI

### 1.1. Mục tiêu
Xây dựng phân hệ **Lịch trình chuyến đi (Itinerary)** hoàn chỉnh trên giao diện Smart Trip, thay thế placeholder tạm thời tại `/trips/[id]/itinerary`, cho phép nhóm bạn:
1. Xem lịch trình chi tiết theo từng ngày của chuyến đi với dòng thời gian (Timeline) trực quan.
2. Dễ dàng chuyển đổi giữa các ngày trong hành trình thông qua thanh chọn ngày (Day switcher pills/tabs).
3. Thêm mới, chỉnh sửa và xóa điểm dừng thông qua Modal thêm/sửa địa điểm chuẩn Design System.
4. Phát hiện và cảnh báo trực quan khi có điểm dừng bị trùng khung giờ hoạt động.
5. Hỗ trợ liên kết nhanh từ địa điểm sang việc ghi nhận khoản chi tiêu tương ứng.

### 1.2. Phạm vi trong Release 1
- **Màn hình chính**: Route `/trips/[id]/itinerary` tích hợp trọn vẹn trong `TripDetailLayoutView`.
- **Thanh chọn ngày (Day Switcher)**: Tự động tính toán các ngày từ `startDate` đến `endDate` của chuyến đi (ví dụ 3 ngày 2 đêm: Ngày 1, Ngày 2, Ngày 3 kèm thứ và ngày/tháng).
- **Dòng thời gian (Timeline View)**:
  - Hiển thị theo thứ tự thời gian trong ngày (`sortOrder`, `startTime` -> `endTime`).
  - Node số thứ tự địa điểm (1, 2, 3...) gắn với thanh timeline dọc.
  - Thẻ địa điểm: Giờ giấc, tag phân loại thời điểm (Sáng, Trưa, Chiều, Tối), tên địa điểm, địa chỉ, ghi chú hoạt động.
  - Badge cảnh báo màu cam (`functional-warning`) khi trùng lịch giữa các điểm dừng liền kề.
  - Nút thao tác nhanh: Menu "Sửa / Xóa" địa điểm và nút "+ Chi tiêu" liên kết với modal thêm khoản chi.
- **Thẻ Tóm tắt ngày (Day Summary Sidebar)**:
  - Thống kê số lượng điểm ghé thăm trong ngày.
  - Khoảng thời gian hoạt động trong ngày (bắt đầu từ mấy giờ, kết thúc lúc mấy giờ).
  - Tổng số tiền chi tiêu đã ghi nhận gắn liền với các địa điểm trong ngày đó.
- **Modal thêm/sửa địa điểm (`TripItineraryFormModal`)**:
  - Chọn ngày (chips chọn ngày trong chuyến đi).
  - Tên địa điểm (`placeName`, bắt buộc, max 200 ký tự) kèm gợi ý nhanh các điểm du lịch mẫu.
  - Địa chỉ (`address`, tùy chọn).
  - Khung giờ hoạt động: Giờ bắt đầu (`startTime`, bắt buộc), Giờ kết thúc (`endTime`, tùy chọn).
  - Ghi chú cho nhóm (`note`, tùy chọn).
  - Badge tự động tính thời lượng dự kiến và kiểm tra trùng lịch.
- **Modal xác nhận xóa địa điểm (`TripDeleteItineraryModal`)**:
  - Xác nhận an toàn trước khi xóa điểm dừng khỏi lịch trình.
- **Trạng thái giao diện**:
  - Empty state khi một ngày chưa có điểm dừng nào.
  - Loading skeleton khi tải dữ liệu.
  - Toast thông báo phiên demo (in-session persistence notice).

### 1.3. Ngoài phạm vi Release 1 (Tuyệt đối không đưa vào)
- **Không tích hợp Google Maps API, Google Places Autocomplete**: Người dùng nhập tên địa điểm trực tiếp hoặc chọn chip gợi ý; không gọi API tính phí hoặc yêu cầu API Key bên ngoài.
- **Không có định vị GPS, dẫn đường, tính khoảng cách thực tế hay tối ưu lộ trình**: Các chi tiết "X km", "Y phút di chuyển" trong thiết kế Stitch gốc là mockup minh họa, không đưa thuật toán tính đường vào Release 1.
- **Không tích hợp dự báo thời tiết (Weather Forecast)**: Tuân thủ quy tắc `PROJECT_CONTEXT.md` (thuộc Release 2).

---

## 2. KIẾN TRÚC DỮ LIỆU & TÍCH HỢP CONTEXT

### 2.1. Cấu trúc dữ liệu ItineraryItem (Khớp ERD `itinerary_items`)
Cập nhật trong `src/types/trip.ts`:

```typescript
export interface ItineraryItem {
  id: string;
  tripId: string;
  dayDate: string; // ISO date string "YYYY-MM-DD" khớp ERD itinerary_items.day_date
  sortOrder: number; // Thứ tự sắp xếp trong ngày
  placeName: string; // Tên địa điểm (khớp ERD itinerary_items.place_name)
  address?: string | null; // Địa chỉ chi tiết
  lat?: number | null; // Tọa độ (giữ trường ERD, chưa dùng bản đồ)
  lng?: number | null;
  startTime?: string | null; // Định dạng "HH:mm" (24h)
  endTime?: string | null; // Định dạng "HH:mm" (24h)
  note?: string | null; // Ghi chú hoạt động
  createdByMemberId: string; // Thành viên tạo
  expenseId?: string | null; // Khoản chi gắn kèm (nếu có)
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateItineraryItemFormData {
  dayDate: string; // "YYYY-MM-DD"
  placeName: string;
  address: string;
  startTime: string; // "HH:mm"
  endTime?: string; // "HH:mm"
  note?: string;
}

export interface ItineraryValidationErrors {
  dayDate?: string;
  placeName?: string;
  startTime?: string;
  endTime?: string;
}

export interface DayItineraryGroup {
  dayIndex: number; // 1, 2, 3...
  dayDate: string; // "YYYY-MM-DD"
  dayLabel: string; // "Ngày 1"
  dayOfWeekText: string; // "Thứ 6, 20/11"
  items: ItineraryItem[];
  totalExpensesAmount: number;
}
```

### 2.2. Tích hợp với `TripSessionProvider`
Mở rộng `TripSessionContextValue` trong `src/components/trips/detail/trip-session-context.tsx`:
- `sessionItinerary: ItineraryItem[]`: Danh sách địa điểm trong phiên làm việc.
- `handleAddItineraryItem: (formData: CreateItineraryItemFormData) => void`: Thêm địa điểm mới, tự động tính `sortOrder` theo giờ `startTime`.
- `handleUpdateItineraryItem: (id: string, formData: CreateItineraryItemFormData) => void`: Cập nhật thông tin điểm dừng.
- `handleDeleteItineraryItem: (id: string) => void`: Xóa điểm dừng và sắp xếp lại thứ tự.
- Bổ sung dữ liệu lịch trình mock mẫu vào `MOCK_TRIP_DETAILS` trong `src/lib/mock/trips.ts` cho cả 3 chuyến đi (Đà Lạt 3N2Đ, Phú Quốc, Sa Pa).

---

## 3. THIẾT KẾ GIAO DIỆN & TỔ CHỨC COMPONENT

### 3.1. Danh sách component dự kiến tạo/sửa
```text
src/
  types/
    trip.ts                                   # Bổ sung interface ItineraryItem, DayItineraryGroup...
  lib/
    itinerary/
      date.ts                                 # Helper sinh danh sách ngày, format thứ ngày tiếng Việt
      date.test.ts                            # Unit test date calculations
      validation.ts                           # Hàm validate thời gian, trùng lịch, khoảng ngày
      validation.test.ts                      # Unit test validation logic
    mock/
      itinerary.ts                            # Mock dữ liệu lịch trình mẫu cho Đà Lạt, Phú Quốc, Sa Pa
  components/
    trips/
      itinerary/
        trip-itinerary-tab.tsx                # Container chính cho tab Lịch trình
        trip-day-switcher.tsx                 # Thanh ngang chọn Ngày 1, Ngày 2... (Pills)
        trip-itinerary-timeline.tsx           # Dòng thời gian hiển thị danh sách địa điểm theo ngày
        trip-itinerary-card.tsx               # Thẻ địa điểm (Giờ, Tag buổi, Tên, Địa chỉ, Note, Action)
        trip-itinerary-conflict-badge.tsx     # Chip cảnh báo trùng giờ màu cam
        trip-itinerary-summary-card.tsx       # Cột bên phải: Tóm tắt ngày, số điểm, thời gian, chi tiêu
        trip-itinerary-form-modal.tsx         # Modal Thêm / Sửa địa điểm (khớp Stitch th_m_a_i_m_modal)
        trip-delete-itinerary-modal.tsx       # Modal xác nhận xóa địa điểm
  app/
    (app)/
      trips/
        [id]/
          itinerary/
            page.tsx                          # Thay thế placeholder bằng TripItineraryTab
```

### 3.2. Bố cục không gian (Layout Grid)
Kế thừa cấu trúc 12 cột chuẩn của hệ thống (max-width 1200px):
- **Desktop (>= 1024px)**:
  - **Cột trái (8 cột)**: Thanh chọn ngày `TripDaySwitcher`, Nút "+ Thêm địa điểm", Danh sách dòng thời gian `TripItineraryTimeline` nối các thẻ điểm dừng.
  - **Cột phải (4 cột, Sticky)**: Thẻ `TripItinerarySummaryCard` tóm tắt ngày đang chọn, các khoản chi gắn với ngày đó và mẹo hành trình, kèm vector art phong cảnh tinh tế (thay thế cho widget bản đồ ngoài phạm vi).
- **Tablet (640px – 1023px)**:
  - 8 cột nội dung chính hiển thị trước, thẻ tóm tắt ngày chuyển xuống bên dưới.
- **Mobile (< 640px)**:
  - 1 cột toàn màn hình, thanh chọn ngày cuộn ngang mượt mà (`overflow-x-auto scrollbar-none`), các nút bấm đảm bảo touch target tối thiểu 44–48px.

---

## 4. QUY TẮC NGHIỆP VỤ & VALIDATION

### 4.1. Quy tắc kiểm tra ngày/giờ
1. **Ngày hợp lệ**:
   - `dayDate` bắt buộc phải nằm trong khoảng `[trip.startDate, trip.endDate]`.
   - Nếu chuyến đi kéo dài từ `2026-11-20` đến `2026-11-22`, chỉ cho phép chọn 1 trong 3 ngày này.
2. **Khung giờ hợp lệ**:
   - `startTime` là bắt buộc, định dạng chuẩn 24 giờ (`HH:mm`).
   - `endTime` (nếu nhập) phải lớn hơn hoặc bằng `startTime`. Nếu `endTime < startTime`, hiển thị lỗi "Giờ kết thúc không thể trước giờ bắt đầu".
3. **Phát hiện trùng lịch (Conflict Detection)**:
   - Một điểm dừng $A$ có $[start_A, end_A]$ và điểm dừng $B$ có $[start_B, end_B]$ trong cùng một ngày bị coi là trùng giờ nếu:
     $$\max(start_A, start_B) < \min(end_A, end_B)$$
   - Khi phát hiện trùng giờ, hiển thị badge cảnh báo: `"Trùng X phút với [Tên địa điểm khác]"` với phong cách cảnh báo nhẹ nhàng (`bg-functional-warning-bg`, viền và chữ `functional-warning`), **không chặn lưu** để đảm bảo tính linh hoạt khi đi chơi theo nhóm.
4. **Phân loại buổi tự động**:
   - Dựa trên `startTime`:
     - 05:00 – 10:59: **Buổi sáng** (`bg-surface-container text-cerulean`)
     - 11:00 – 13:59: **Buổi trưa** (`bg-functional-warning-bg text-functional-warning`)
     - 14:00 – 17:59: **Buổi chiều** (`bg-tropical-teal/15 text-tropical-teal`)
     - 18:00 – 04:59: **Buổi tối** (`bg-yale-blue/10 text-yale-blue`)

---

## 5. KẾ HOẠCH KIỂM THỬ VÀ NGHIỆM THU (QA PLAN)

### 5.1. Unit Test
Tạo ít nhất 2 file test mới với tối thiểu 20 bài test:
- `src/lib/itinerary/date.test.ts`:
  - Kiểm tra sinh danh sách ngày từ khoảng `startDate` -> `endDate`.
  - Định dạng hiển thị thứ ngày tiếng Việt ("Thứ Sáu, 20/11/2026").
  - Xử lý chuyến đi 1 ngày, chuyến đi nhiều ngày, chuyến đi vắt qua tháng/năm.
- `src/lib/itinerary/validation.test.ts`:
  - Kiểm tra trường bắt buộc `placeName`, `startTime`, `dayDate`.
  - Kiểm tra `endTime >= startTime`.
  - Kiểm tra thuật toán phát hiện trùng lịch (trùng hoàn toàn, trùng một phần, không trùng).
  - Kiểm tra xác thực ngày có thuộc chuyến đi hay không.

### 5.2. Visual & Interaction QA
Thực hiện kịch bản kiểm tra giao diện bằng trình duyệt:
1. Mở trang `/trips/trip-dalat-3n2d/itinerary`.
2. Kiểm tra thanh chọn Ngày 1, Ngày 2, Ngày 3; bấm chuyển tab ngày và xác nhận danh sách điểm dừng cập nhật tương ứng.
3. Bấm "+ Thêm địa điểm", kiểm tra mở modal `TripItineraryFormModal`, nhập thông tin và bấm "Lưu địa điểm" -> điểm dừng mới xuất hiện trên timeline.
4. Thử nhập giờ trùng lặp -> kiểm tra xuất hiện badge cảnh báo màu cam.
5. Thử chuyển sang một ngày trống -> kiểm tra Empty State hiển thị đẹp mắt với nút kêu gọi hành động.
6. Thử sửa và xóa một địa điểm -> kiểm tra modal xác nhận và cập nhật danh sách.
7. Chụp ảnh màn hình đối chiếu trên 3 kích thước:
   - Desktop: 1280px
   - Tablet: 768px
   - Mobile: 375px
   - Lưu báo cáo và ảnh tại `tests/reports/phase-2e/`.

---

## 6. TIÊU CHÍ NGHIỆM THU (ACCEPTANCE CRITERIA)

1. Route `/trips/[id]/itinerary` không còn hiển thị `TripTabPlaceholder`, thay vào đó là giao diện Lịch trình chi tiết hoàn thiện.
2. Thiết kế và phong cách trực quan khớp với Stitch `l_ch_tr_nh_l_t_3n2` và `th_m_a_i_m_modal_l_t_3n2`, bám sát Design Tokens và không chứa các tính năng ngoài phạm vi Release 1 (không có Google Maps API).
3. Đầy đủ các tương tác: Chuyển ngày, Thêm địa điểm, Sửa địa điểm, Xóa địa điểm, Cảnh báo trùng lịch, Empty state khi ngày trống.
4. Đạt chuẩn kỹ thuật:
   - `npm test` vượt qua 100% test files (15 test hiện có + các test mới của Phase 2E).
   - `npm run lint` đạt 0 error, 0 warning.
   - `npm run build` thành công, route `/trips/[id]/itinerary` biên dịch hợp lệ.
5. Responsive hoàn hảo trên Desktop (1280px), Tablet (768px) và Mobile (375px).

---

## 7. CÁC QUYẾT ĐỊNH CẦN NGƯỜI DÙNG PHÊ DUYỆT TRƯỚC KHI VIẾT CODE

Trước khi bắt đầu triển khai code Phase 2E, cần Bạn chốt 4 điểm thiết kế dưới đây:

1. **Phương án thay thế bản đồ cột bên phải (Right Column)**:
   - *Đề xuất*: Bố cục 8-4 cột, trong đó cột phải là **Thẻ Tóm tắt ngày (Day Summary Card)** hiển thị tổng số điểm dừng, khung giờ hoạt động dự kiến trong ngày, tổng tiền đã chi cho các hoạt động ngày đó và đồ họa phong cảnh vector tĩnh.
   - *Lý do*: Tuân thủ quy tắc cấm Google Maps/định vị ở Release 1 mà vẫn giữ bố cục cân đối như Stitch.
2. **Quyền thêm/sửa/xóa địa điểm**:
   - *Đề xuất*: Cho phép **tất cả thành viên ACTIVE** trong chuyến đi đều có quyền thêm địa điểm (tính năng thảo luận lịch trình nhóm). Việc sửa/xóa cho phép Trưởng nhóm hoặc người đã tạo ra địa điểm đó thao tác.
3. **Mức độ xử lý khi trùng khung giờ (Time Conflict)**:
   - *Đề xuất*: Khi 2 địa điểm trùng giờ nhau trong cùng 1 ngày, hệ thống **chỉ hiển thị nhãn cảnh báo màu cam** (`functional-warning`), **KHÔNG chặn lưu**, vì trong thực tế các thành viên có thể tách nhóm đi 2 địa điểm song song.
4. **Liên kết với Tab Chi tiêu (+ Chi tiêu trên thẻ địa điểm)**:
   - *Đề xuất*: Khi bấm nút "+ Chi tiêu" trên thẻ địa điểm, hệ thống mở modal thêm khoản chi (`TripExpenseFormModal`) với trường `locationName` được điền sẵn tên địa điểm đó.
