# Tài liệu Thiết kế Kỹ thuật: Tái cấu trúc Giao diện Bento & Trải nghiệm Thông thoáng cho 5 Phân hệ Chuyến đi
**Dự án:** Smart Trip & Expense Planner  
**Phiên bản:** UI/UX Redesign Release  
**Ngày lập:** 27/10/2026  
**Trạng thái:** Chờ phê duyệt (Pending Review)

---

## 1. Bối cảnh & Mục tiêu (Why & Goals)

### Bối cảnh hiện tại
Hệ thống Smart Trip hiện đã đầy đủ các chức năng cốt lõi (Lập lịch trình, chia tiền ngân sách, quyết toán nợ VietQR, bản đồ tương tác Leaflet, tối ưu lộ trình TSP, thời tiết Open-Meteo và cứu hộ dọc đường).
Tuy nhiên, giao diện hiện tại gặp phải vấn đề **quá tải thị giác (Visual Clutter)**:
1. Các thành phần xếp chồng theo chiều dọc một cách dàn trải, người dùng phải cuộn chuột nhiều để nắm thông tin.
2. Thông tin chính (số tiền còn lại, việc cần làm tiếp theo, bản đồ) bị cạnh tranh bởi quá nhiều thẻ, nút bấm và nhãn chữ chi tiết có kích thước ngang nhau.
3. Thiếu tính phân cấp thông tin theo nguyên lý **Progressive Disclosure** (những gì cần nhìn thấy trong 3 giây đầu tiên cần nổi bật, các chi tiết phụ cần được thu nhỏ hoặc gom vào ngăn kéo/modal).

### Mục tiêu thiết kế mới (Goals)
1. **Áp dụng phong cách Bento Grid hiện đại & thoáng đãng (Inspiration từ các mẫu Hiking / Travel Dashboard):**
   - Sử dụng các ô Bento có bo góc lớn (`rounded-2xl` đến `rounded-3xl`), viền mảnh thanh lịch (`border-border-hairline`), đổ bóng mềm tự nhiên (`shadow-2xs` đến `shadow-xs`).
   - Tối ưu không gian thở (Whitespace / Negative space), tăng tính thoáng đãng và giảm độ mỏi mắt.
2. **Nguyên lý Progressive Disclosure (Hiển thị lũy tiến):**
   - Chỉ số chính: Typography to, đậm, rõ ràng (Yale Blue `#184E77`, Baltic Blue `#1E6091`).
   - Thông tin phụ & metadata: Font nhỏ hơn (`text-[11px]` đến `text-xs`), màu sắc nhã nhặn (`text-text-muted`), đóng vai trò bổ trợ.
   - Các hành động sâu hoặc danh sách dài: Gom gọn thành Avatar Stacks, Drawer/Modal chi tiết, Accordion hoặc thẻ thu gọn.
3. **Tái cấu trúc đồng bộ 5 phân hệ:**
   - **Tổng quan (`/trips/[id]`)**: Hero Bento số liệu tài chính + Bản đồ vị trí trung tâm + Cột tóm tắt nhanh lịch trình/chi tiêu.
   - **Lịch trình (`/trips/[id]/itinerary`)**: Bố cục Timeline tinh gọn kèm Sticky Map lộ trình của ngày, gom thanh TSP vào header.
   - **Chi tiêu (`/trips/[id]/expenses`)**: Top stats bar + Bộ lọc chip phân loại + Feed giao dịch gọn gàng, xem chia tiền chi tiết qua Drawer/Modal.
   - **Công nợ (`/trips/[id]/settlement`)**: Ưu tiên thẻ hành động cá nhân (Bạn cần trả ai / Bạn nhận lại bao nhiêu kèm nút VietQR) trước ma trận nhóm.
   - **Thành viên (`/trips/[id]/members`)**: Grid danh bạ tinh tế, chip copy STK ngân hàng 1 chạm, banner mời nhóm gọn gàng.

### Điều cấm kỵ (Anti-Goals)
- **Không làm mất hoặc ẩn giấu tính năng đã hoạt động:** Mọi tính năng (bản đồ, thời tiết, tối ưu TSP, cứu hộ GPS, chia tiền, VietQR) phải được bảo toàn 100%.
- **Không phá vỡ Design Tokens:** Tiếp tục tuân thủ bảng màu Tactile Organic Minimalism (`#184E77`, `#1A759F`, `#52B69A`, `#D9ED92`, `#F4F9EC`). Không dùng emoji làm icon tính năng (chỉ dùng Lucide React).
- **Không làm vỡ giao diện trên Mobile:** Toàn bộ Bento Grid phải tự động xếp chồng (stack) mượt mà về 1 cột trên màn hình điện thoại (<= 640px).

---

## 2. Chi tiết Tái cấu trúc từng Phân hệ

### 2.1. Phân hệ Tổng quan (`/trips/[id]`)
- **Bento Row 1 - Nhịp thở tài chính & Nhóm (Metrics at a Glance):**
  - **Ô 1 (Ngân sách & Thời gian):** Thanh tiến độ ngân sách mảnh tinh tế, hiển thị số tiền còn lại và số ngày còn lại của chuyến đi.
  - **Ô 2 (Khoản chi cá nhân của bạn):** Tổng số tiền bạn đã đóng góp và số dư ròng hiện tại (màu xanh dương đậm/dịu).
  - **Ô 3 (Đội ngũ thành viên):** Avatar stack các thành viên (`+N`), nút "+ Mời" nhanh dạng pill (như Image 1).
  - **Ô 4 (Thời tiết điểm đến):** Mini widget hiển thị nhiệt độ và trạng thái thời tiết tại điểm đến.
- **Bento Row 2 - Visual Anchor (Bản đồ nhóm & Trạm dừng tiếp theo):**
  - Khung bản đồ rộng `rounded-3xl` tích hợp thanh trạng thái nổi (Floating Bar) cho biết địa điểm tiếp theo trong lịch trình và vị trí hiện tại của nhóm.
- **Bento Row 3 - Tóm tắt nhanh (2 cột 60/40):**
  - **Cột trái:** 2 mục lịch trình tiếp theo & 2 khoản chi gần nhất với nút "Xem tất cả →".
  - **Cột phải:** Thẻ thông tin chuyến đi rút gọn (Mã mời, link mời, QR code và STK Host dạng chip bấm sao chép nhanh).

### 2.2. Phân hệ Lịch trình (`/trips/[id]/itinerary`)
- **Thanh chọn ngày (Day Navigation):** Chuyển sang dạng thanh pill trượt ngang (`rounded-full px-4 py-2 text-xs font-semibold`), ngày active có nền Baltic Blue chữ trắng.
- **Bố cục 2 cột (Desktop):**
  - **Cột trái (Timeline tinh gọn):**
    - Header gọn gàng chứa nút "Thêm điểm" và nút "Tối ưu lộ trình (TSP 2-Opt)" tích hợp icon Sparkles.
    - Thẻ địa điểm được làm mỏng nhẹ: Badge số tròn, thời gian, tên địa điểm nổi bật, badge thời tiết mini (`WeatherBadge`), nút menu 3 chấm. Ghi chú phụ chỉ hiện 1 dòng rút gọn.
  - **Cột phải (Sticky Route Map):**
    - Bản đồ bám dính khi cuộn trang, hiển thị toàn bộ lộ trình ngày đang xem, khoảng cách ước tính và các trạm cứu hộ/xăng xe.

### 2.3. Phân hệ Chi tiêu (`/trips/[id]/expenses`)
- **Top Bento Bar:** 3 số liệu cô đọng (Tổng chi cả nhóm, Phần bạn đã chi, Hạn mức còn lại) với tỷ lệ phần trăm nhỏ gọn.
- **Bộ lọc danh mục dạng Chip:** Tất cả, Ăn uống, Di chuyển, Lưu trú, Hoạt động, Khác dạng chip bo tròn mềm mại.
- **Danh sách giao dịch (Transaction Feed):**
  - Mỗi hàng chi tiêu: Icon danh mục bo góc tròn, Tên khoản chi + Ngày chi, Avatar người thanh toán, Số tiền in đậm.
  - Số lượng người cùng chia hiển thị dạng avatar stack thu nhỏ (hoặc badge `3 người`).
  - Khi click vào khoản chi, mở Drawer / Modal chi tiết người trả và người hưởng thay vì bung nở trực tiếp làm rối danh sách.

### 2.4. Phân hệ Công nợ (`/trips/[id]/settlement`)
- **Thẻ hành động cá nhân (Personal Action First):**
  - Đặt ngay trên đầu màn hình:
    - Nếu bạn nợ: Banner nổi bật *"Bạn cần chuyển [Số tiền] cho [Tên người nhận]"* + Nút lớn **"Quét VietQR chuyển tiền"**.
    - Nếu bạn được nhận lại: Banner dịu mắt thông báo số tiền sắp được nhận.
    - Nếu đã xong: Badge xanh dịu xác nhận không còn công nợ tồn đọng.
- **Bảng phân bổ nợ nhóm (Group Matrix):**
  - Danh sách các giao dịch thanh toán chéo còn lại giữa các thành viên, trình bày dạng thẻ ngang có mũi tên trực quan `A → B: [Số tiền]`, nút xác nhận đã trả/đã nhận tinh tế.

### 2.5. Phân hệ Thành viên (`/trips/[id]/members`)
- **Banner mời thành viên:** Nhỏ gọn, hiển thị mã mời, nút "Copy link", và nút mở QR Code modal.
- **Danh bạ thành viên (Member Grid / List):**
  - Card thành viên gọn gàng: Avatar, Tên, Badge Host/Member.
  - Thống kê mini: Số tiền đã ứng trước, Số dư hiện tại.
  - Thông tin tài khoản ngân hàng hiển thị dạng chip bấm copy nhanh với thông báo toast.

---

## 3. Kế hoạch Kiểm thử & Bảo toàn Hệ thống
1. **Kiểm thử hồi quy toàn bộ:**
   - Đảm bảo 94 test files (1.219 tests) tiếp tục vượt qua 100%.
   - Cập nhật các component tests tương ứng để khớp với cấu trúc DOM mới mà không làm mất test cases nào.
2. **Biên dịch Production:**
   - `npm run build` phải thành công tuyệt đối (exit code 0), không có lỗi TypeScript hay Lint.
3. **Kiểm tra Responsive:**
   - Đảm bảo bố cục hiển thị hoàn hảo trên Mobile (375px), Tablet (768px), và Desktop (1200px+).
