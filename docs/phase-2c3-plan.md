# Kế hoạch triển khai Giai đoạn 2C.3 — Trip Detail Overview (`/trips/[id]`)

> **Phiên bản:** 1.1 (Đã phê duyệt với các điều chỉnh bắt buộc)  
> **Trạng thái:** Đã duyệt — Sẵn sàng triển khai  
> **Phạm vi kỹ thuật:** Frontend-only (Next.js App Router, TypeScript, Tailwind CSS, Mock Data)  
> **Nguyên tắc cốt lõi:** Tuyệt đối không can thiệp PostgreSQL, API backend thật hay cơ chế xác thực thật; không tuyên bố dữ liệu được lưu thành công; tuân thủ nghiêm ngặt thiết kế Google Stitch và `ENGINEERING_STANDARDS.md`.

---

## 1. Mục tiêu và phạm vi

### 1.1 Mục tiêu chính
Xây dựng màn hình **Chi tiết chuyến đi (Tổng quan)** tại đường dẫn động `/trips/[id]` theo thiết kế thực tế từ Google Stitch (`stitch_smart_trip_dashboard_design/t_ng_quan_chuy_n_i_l_t_3n2/`) và tiêu chuẩn giao diện UI/UX Pro Max. Màn hình cung cấp cái nhìn tổng thể về ngân sách, tiến độ chi tiêu, các chỉ số số dư cá nhân, hoạt động chi tiêu gần đây, phân bổ chi phí theo nhóm, danh sách thành viên và thông tin chuyến đi.

### 1.2 Quyết định đã phê duyệt & Điều chỉnh bắt buộc
1. **Q1 — Dữ liệu chi tiết cho cả 3 chuyến đi:**
   - Chuẩn bị dữ liệu mock chi tiết riêng theo ID cho cả ba chuyến:
     * **Đà Lạt 3N2Đ (`trip-dalat-3n2d`):** Trạng thái `ACTIVE` ("Đang lên kế hoạch"). Hạn mức 10.000.000 ₫, đã chi 8.450.000 ₫ (84.5% - Sắp chạm trần), khả dụng 1.550.000 ₫. Bạn đã ứng 2.350.000 ₫, Bạn được nhận +350.000 ₫ (Đang dương).
     * **Phú Quốc cùng team (`trip-phuquoc-team`):** Trạng thái `SETTLING` ("Đang thanh toán"). Hạn mức 20.000.000 ₫, đã chi 18.500.000 ₫ (92.5%), khả dụng 1.500.000 ₫. Bạn đã ứng 1.200.000 ₫, Bạn cần trả 120.000 ₫.
     * **Sa Pa mùa lúa chín (`trip-sapa-harvest`):** Trạng thái `COMPLETED` ("Đã hoàn tất"). Hạn mức 12.000.000 ₫, đã chi 11.200.000 ₫ (93.3%), khả dụng 800.000 ₫. Bạn đã ứng 3.000.000 ₫, Bạn đã xong 0 ₫.
   - Không sửa đổi hoặc làm biến đổi mảng gốc `MOCK_TRIPS` đã dùng ở `/trips`.
   - Số liệu tài chính được tính toán nhất quán, có unit test kiểm thử các giá trị chính.
2. **Q2 — Hành vi các tab chưa triển khai:**
   - Tab **Tổng quan** hoạt động bình thường và hiển thị đầy đủ thông tin.
   - Các tab **Lịch trình**, **Chi tiêu**, **Công nợ**, **Thành viên** khi bấm sẽ mở Modal thông báo tính năng chưa triển khai ở giai đoạn hiện tại.
   - Tái sử dụng component `Modal` sẵn có (`src/components/ui/modal.tsx`), không tạo thêm hệ thống modal trùng lặp.
3. **Q3 — Xử lý các nút chi tiêu:**
   - Nút `+ Thêm khoản chi`: Mở modal thông báo phân hệ chi tiêu chưa được triển khai ở giai đoạn hiện tại; không tạo khoản chi giả, không thay đổi dữ liệu.
   - Nút `Quét hóa đơn AI`: Mở modal thông báo rõ tính năng nằm ngoài phạm vi Release 1 theo tài liệu dự án; không hứa hẹn triển khai trong Giai đoạn 2D, không giả lập OCR.
4. **Thuật ngữ nghiệp vụ bắt buộc:**
   - Sử dụng **“Trưởng nhóm”**, tuyệt đối không dùng “Host”.
   - Sử dụng **“Chưa có tài khoản”** cho thành viên chưa có tài khoản.
   - Với mã mời thành viên, sử dụng **“Mã mời”**, tuyệt đối không nhầm với "mã PIN".
5. **Nội dung minh họa tĩnh:**
   - Thời tiết và bản đồ được thể hiện dưới dạng minh họa tĩnh theo Stitch; không giả vờ có dữ liệu trực tiếp hoặc tích hợp dịch vụ bên ngoài.

---

## 2. Nguồn yêu cầu và bằng chứng thiết kế

### 2.1 Bằng chứng từ Google Stitch
- **Mẫu tham chiếu chính:** `stitch_smart_trip_dashboard_design/t_ng_quan_chuy_n_i_l_t_3n2/`
  * Bố cục 12 cột (8 cột bên trái, 4 cột thanh bên cố định).
  * Thanh Tab bar, thanh tiến độ ngân sách, bộ 3 stat cards tài chính, danh sách khoản chi gần đây, biểu đồ Donut SVG phân loại chi tiêu.
- **Mẫu tham chiếu thành viên:** `stitch_smart_trip_dashboard_design/qu_n_l_th_nh_vi_n_l_t_3n2/`
  * Nhận diện Trưởng nhóm, Bạn, và thành viên Chưa có tài khoản (avatar viền đứt nét `border-dashed`).

### 2.2 Đối chiếu Use Case và Sơ đồ tuần tự (`sodothietke/`)
- **UC04 (Xem chi tiết chuyến đi):** Người dùng xem được các thông tin tổng hợp của chuyến đi bao gồm ngân sách, thành viên và các khoản chi.
- **UC05, UC34 (Mã mời & QR mời):** Mã mời hiển thị trên trang chi tiết để Trưởng nhóm/thành viên sao chép và chia sẻ.
- **R1, R2, R11, R12 (Quy tắc thành viên & Trưởng nhóm):**
  * Mỗi chuyến đi có 1 Trưởng nhóm.
  * Thành viên chưa có tài khoản có `user_id = NULL` trên ERD `trip_members`.

---

## 3. Cấu trúc dữ liệu và Chiến lược Mock Data

### 3.1 Dữ liệu mở rộng cho trang chi tiết (`src/types/trip.ts`)

```typescript
export interface TripRecentExpense {
  id: string;
  title: string;
  category: "FOOD" | "TRANSPORT" | "LODGING" | "TICKET" | "SHOPPING" | "OTHER";
  categoryLabel: string;
  paidByName: string;
  spentAtFormatted: string; // e.g. "20/11 - 19:30"
  splitMethodText: string; // e.g. "Chia đều 5 người" | "Chia theo món"
  totalAmount: number;
  userAmount: number;
}

export interface TripExpenseCategoryAllocation {
  category: string;
  percentage: number;
  amount: number;
  color: string;
}

export interface TripDetailData extends Trip {
  plannedBudget: number; // Hạn mức kế hoạch (VND)
  totalSpent: number; // Tổng chi cả nhóm (VND)
  userSpent: number; // Bạn đã ứng (VND)
  expenseCount: number; // Số lượng khoản chi
  paidActivitiesCount: number; // Số hoạt động bạn chi trả
  nextDestination?: {
    title: string;
    label: string;
    imageUrl?: string;
  };
  recentExpenses: TripRecentExpense[];
  categoryAllocations: TripExpenseCategoryAllocation[];
  weatherInfo?: {
    locationName: string;
    temperature: string;
    description: string;
  };
}
```

### 3.2 Mock data độc lập cho 3 chuyến đi (`src/lib/mock-trips.ts`)
- `trip-dalat-3n2d` (ACTIVE): Trưởng nhóm Lan Nguyễn (Bạn). 5 thành viên (1 chưa có tài khoản). Hạn mức 10.000.000 ₫, đã chi 8.450.000 ₫, được nhận +350.000 ₫.
- `trip-phuquoc-team` (SETTLING): Trưởng nhóm Hoàng Anh, Lan Nguyễn (Bạn) là thành viên. 6 thành viên (1 chưa có tài khoản). Hạn mức 20.000.000 ₫, đã chi 18.500.000 ₫, cần trả 120.000 ₫.
- `trip-sapa-harvest` (COMPLETED): Trưởng nhóm Phương Linh, Lan Nguyễn (Bạn) là thành viên. 4 thành viên. Hạn mức 12.000.000 ₫, đã chi 11.200.000 ₫, đã xong 0 ₫.
- Hàm tra cứu: `getTripDetailById(id: string): TripDetailData | null`.

### 3.3 Xử lý ID không tồn tại (404 Not Found)
- Nếu `getTripDetailById(id)` trả về `null`:
  * Hiển thị component `TripNotFound`: Icon la bàn, tiêu đề "Không tìm thấy chuyến đi", mô tả rõ ràng, nút "Quay lại danh sách chuyến đi" (`/trips`).
  * Tránh lỗi runtime unhandled exception và bảo đảm trải nghiệm người dùng nhất quán.

---

## 4. Danh sách tệp triển khai

1. `src/types/trip.ts`: Thêm kiểu `TripRecentExpense`, `TripExpenseCategoryAllocation`, `TripDetailData`.
2. `src/lib/mock-trips.ts`: Bổ sung `MOCK_TRIP_DETAILS` và hàm `getTripDetailById`.
3. `src/components/trips/detail/trip-detail-header.tsx`: Hero cover, breadcrumbs, tiêu đề, badge trạng thái, thông tin meta, nút "Mời bạn bè".
4. `src/components/trips/detail/trip-detail-tabs.tsx`: Tab bar và popup thông báo ranh giới các tab chưa phát triển.
5. `src/components/trips/detail/trip-budget-card.tsx`: Card ngân sách, progress bar cảnh báo tỷ lệ chi tiêu, số tiền khả dụng.
6. `src/components/trips/detail/trip-stats-overview.tsx`: 3 thẻ chỉ số tài chính (Tổng chi, Bạn đã ứng, Số dư cá nhân).
7. `src/components/trips/detail/trip-recent-expenses.tsx`: Danh sách khoản chi gần đây và các nút hành động (với modal giải thích ranh giới Release 1).
8. `src/components/trips/detail/trip-expense-donut-chart.tsx`: Biểu đồ Donut SVG phân loại chi tiêu và điểm đến kế tiếp.
9. `src/components/trips/detail/trip-members-card.tsx`: Danh sách thành viên (Trưởng nhóm, Bạn, Chưa có tài khoản với viền `border-dashed`).
10. `src/components/trips/detail/trip-info-sidebar.tsx`: Minh họa thời tiết tĩnh, Mã mời với nút sao chép Clipboard, ảnh bản đồ tĩnh.
11. `src/components/trips/detail/trip-not-found.tsx`: Giao diện 404 thân thiện.
12. `src/app/trips/[id]/page.tsx`: Dynamic route Next.js App Router, quản lý dynamic SEO metadata.
13. `src/components/trips/trip-card.tsx`: Cập nhật điều hướng thẻ chuyến đi sang `/trips/${trip.id}`.
14. `src/app/trips/page.tsx`: Dọn dẹp modal thông báo cũ `selectedTripModal`.
15. `tests/trip-detail.test.mjs`: Bộ test tự động cho logic chi tiết, ngân sách, 404 và formatters.

---

## 5. Kế hoạch kiểm thử và bàn giao

- **Kiểm thử tự động:** `npm test`, `npm run lint`, `npm run build`.
- **Visual QA:** Desktop 1280px, Tablet 768px, Mobile 375px cho cả 3 chuyến, trang 404, thao tác sao chép mã mời, modal các tab và nút chi tiêu.
- **Lưu ảnh báo cáo:** `tests/reports/phase-2c3/`.
- **Git Commit:** Tạo commit riêng cho Phase 2C.3 với thông điệp chuẩn convention.
- **Bàn giao:** Dừng lại chờ nghiệm thu, không tự ý chuyển sang giai đoạn khác.
