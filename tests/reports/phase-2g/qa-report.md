# Báo Cáo Kiểm Thử Thực Tế — Phase 2G: Profile & Release 1 UI/UX Completion

- **Thời gian thực hiện**: 19/10/2026
- **Môi trường**: Next.js 16.4.2 (Turbopack), Node.js v20+, Chrome Headless Browser Subagent
- **Trạng thái kiểm thử**: 100% PASS (280/280 Vitest unit tests, 0 ESLint errors, Next.js build clean)

---

## 1. Kết Quả Kiểm Thử Tự Động (Unit & Integration Tests)

| Hạng mục kiểm thử | File test | Số lượng test | Trạng thái |
|---|---|---|---|
| Quyền sửa/xóa khoản chi (UC13) & Ràng buộc lịch trình | `src/lib/validation/expense-mutation.test.ts` | 14 | **PASS** |
| Xác thực hồ sơ cá nhân & chuẩn hóa ngân hàng (R9) | `src/lib/user/validation.test.ts` | 17 | **PASS** |
| Quyền tạo khoản chi & người trả (R18, ACTIVE) | `src/lib/validation/expense.test.ts` | 26 | **PASS** |
| Chia đều & chia theo món (Bảo toàn tổng, số dư ròng) | `src/lib/money/split.test.ts` | 26 | **PASS** |
| Quản lý thành viên & yêu cầu nhận diện (Phase 2F) | `src/lib/members/validation.test.ts` | 34 | **PASS** |
| Xác thực biểu mẫu tạo chuyến đi (UC03) | `src/lib/trip-form-validation.test.ts` | 19 | **PASS** |
| Quyết toán công nợ & tối ưu chuyển khoản | `src/lib/money/settlement.test.ts` | 12 | **PASS** |
| Định dạng tiền tệ VND & ngân sách | `src/lib/money/format.test.ts`, `budget.test.ts` | 26 | **PASS** |
| Các test suite khác (itinerary, invite code, balance...) | Toàn bộ 21 test files | 106 | **PASS** |
| **TỔNG CỘNG** | **21 test files** | **280 tests** | **100% PASS** |

---

## 2. Kết Quả Kiểm Thử Trình Duyệt Thực Tế (Browser QA)

Tất cả các tình huống đều được tương tác và chụp ảnh màn hình thực tế trong session trình duyệt. Không có trường hợp nào đánh dấu PASS mà chưa qua kiểm tra.

### A. Màn hình Hồ sơ cá nhân (`/profile`)

1. **Desktop View (1280x800)**:
   - File ảnh: `01-desktop-profile.png`
   - Đánh giá: Layout 12 cột chuẩn thiết kế Stitch `h_s_c_a_t_i`. Sidebar 3 cột cố định (sticky), form thông tin cá nhân và ngân hàng hiển thị đầy đủ, card VietQR Napas 247 hiển thị sắc nét cùng badge "Demo Profile".
   - Trạng thái: **PASS**

2. **VietQR Zoom Modal**:
   - File ảnh: `02-vietqr-zoom-modal.png`
   - Đánh giá: Bấm nút "Phóng to mã QR" mở modal phóng to VietQR Napas 247 mẫu kèm thông tin chuyển khoản rõ ràng và nút sao chép số tài khoản.
   - Trạng thái: **PASS**

3. **Notification Popover**:
   - File ảnh: `03-notification-popover.png`
   - Đánh giá: Bấm chuông thông báo trên AppHeader mở popover hiển thị 3 thông báo demo (Yêu cầu nhận diện thành viên, Nhắc nợ, Quyết toán hoàn tất), có banner ghi rõ dữ liệu demo, nút "Đánh dấu tất cả đã đọc" hoạt động tức thì và cập nhật số lượng unread badge.
   - Trạng thái: **PASS**

4. **Tablet View (768x1024)**:
   - File ảnh: `04-tablet-profile.png`
   - Đánh giá: Giao diện co giãn mượt mà, sidebar và các form thích ứng tốt trên tablet portrait.
   - Trạng thái: **PASS**

5. **Mobile View (375x812)**:
   - File ảnh: `05-mobile-profile.png`
   - Đánh giá: Toàn bộ thành phần chuyển sang dạng 1 cột xếp dọc (stacked). Nút bấm, trường nhập liệu và card QR tối ưu cho cảm ứng ngón tay.
   - Trạng thái: **PASS**

6. **Đồng bộ dữ liệu Profile trong phiên**:
   - Cập nhật Tên hiển thị / Họ tên và lưu thành công.
   - AppHeader và Sidebar ngay lập tức phản ánh tên và avatar mới mà không cần F5.

---

### B. Tạo Chuyến Đi Mới (UC03)

1. **Kiểm tra hủy tạo**:
   - Nhập thông tin chuyến đi trên `/trips/new`, bấm "Xem trước thông tin".
   - Bấm nút "Hủy" trên modal xem trước -> Modal đóng, KHÔNG có chuyến đi nào được thêm vào danh sách, giữ nguyên màn hình form.
   - Trạng thái: **PASS**

2. **Xác nhận tạo thành công và điều hướng**:
   - Bấm "Tạo chuyến đi & Bắt đầu" -> Hệ thống tạo chuyến đi mới trong `trips-store-context`, tự sinh mã mời hợp lệ (chuẩn format 5-5) và điều hướng trực tiếp tới `/trips/[newId]`.
   - Chuyến đi mới xuất hiện ngay trên danh sách `/trips` (Ảnh minh chứng: `06-trips-list-created.png`).
   - Trạng thái: **PASS**

---

### C. Sửa và Xóa Khoản Chi (UC13)

1. **Hiển thị nút hành động theo phân quyền**:
   - File ảnh: `07-expenses-tab-actions.png`
   - Đánh giá: Khi chuyến đi ở trạng thái `ACTIVE` và người dùng là Trưởng nhóm (Host) hoặc người trả tiền (Payer), mỗi dòng chi tiêu đều có nút Sửa (Pencil) và Xóa (Trash).
   - Trạng thái: **PASS**

2. **Chỉnh sửa khoản chi**:
   - File ảnh: `08-edit-expense-modal.png`
   - Đánh giá: Bấm nút Sửa mở `TripExpenseFormModal` ở chế độ "Chỉnh sửa khoản chi", nạp đầy đủ thông tin ban đầu (tiêu đề, số tiền, danh mục, người trả, danh sách người chia, ghi chú). Cập nhật số tiền và lưu thành công, công nợ và tổng chi tiêu được tính toán lại chính xác.
   - Trạng thái: **PASS**

3. **Xóa khoản chi & Gỡ liên kết lịch trình**:
   - File ảnh: `09-delete-expense-modal.png`
   - Đánh giá: Bấm nút Xóa mở modal xác nhận nguy hiểm `TripExpenseDeleteModal`. Sau khi xác nhận xóa, khoản chi biến mất khỏi danh sách, nếu có liên kết với địa điểm lịch trình thì `expenseId` được gỡ bỏ (`null`) trong khi địa điểm lịch trình vẫn được bảo toàn nguyên vẹn.
   - Trạng thái: **PASS**

4. **Chặn sửa/xóa khi chốt sổ**:
   - Unit tests và code logic kiểm tra trạng thái `tripStatus !== "ACTIVE"` trả về `false`, ngăn chặn mọi hành vi can thiệp vào các chuyến đi đã `SETTLING` hoặc `COMPLETED`.
   - Trạng thái: **PASS**

---

### D. Chỉnh sửa Thông tin Chuyến đi (UC23, UC24)

1. **Modal chỉnh sửa thông tin**:
   - File ảnh: `10-edit-trip-info-modal.png`
   - Đánh giá: Nút "Chỉnh sửa" trên header chuyến đi mở `TripEditInfoModal`, cho phép Trưởng nhóm cập nhật tên chuyến đi, dự toán ngân sách và chức năng lưu trữ/hủy chuyến trong phạm vi Release 1.
   - Trạng thái: **PASS**

---

## 3. Tổng Kết

- Toàn bộ 4 quyết định nghiệp vụ đã chốt cho Phase 2G được tuân thủ nghiêm ngặt.
- Hệ thống sẵn sàng cho bước nghiệm thu tổng thể Release 1.
