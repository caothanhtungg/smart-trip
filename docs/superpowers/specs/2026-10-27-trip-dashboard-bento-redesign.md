# Tái cấu trúc Giao diện Bento Grid & Tối ưu Trải nghiệm người dùng (UI/UX Redesign)

**Ngày lập:** 27/10/2026  
**Chủ đề:** Tối ưu độ thoáng mắt, phân tầng thông tin (Progressive Disclosure) cho các trang Tổng quan, Lịch trình, Chi tiêu, Công nợ, Thành viên  
**Tham chiếu cảm hứng:** 5 mẫu thiết kế du lịch hiện đại (Hiking Dashboard Bento, FlyScope Travel Platform, Luxury Dark Map & Avatar Stack)  
**Tiêu chuẩn áp dụng:** `ui-ux-pro-max` (Bento Grids, Spacing Hierarchy, WCAG 2.1 AA, Tactile Organic Minimalism: `#184E77`, `#52B69A`, `#D9ED92`, `#F4F9EC`)

---

## 1. Vấn đề hiện tại & Mục tiêu tái cấu trúc

### Vấn đề hiện tại
- **Quá tải thị giác (Visual Overload):** Màn hình chi tiết chuyến đi hiện đang xếp chồng nhiều khối card to, mỗi card chứa quá nhiều nhãn và nút bấm khiến người dùng bị ngợp khi vừa mở trang.
- **Thiếu phân cấp thông tin:** Các con số cốt lõi (Tổng tiền còn lại, Số dư cá nhân, Điểm đến tiếp theo) bị chìm lẫn trong các ghi chú phụ và văn bản giải thích dài dòng.
- **Chiếm dụng không gian dọc:** Cột sidebar bên phải (danh sách thành viên, thông tin chuyến đi) kéo dài xuống dưới, tạo ra các khoảng trống bất cân xứng lớn khi xem trên máy tính.

### Mục tiêu thiết kế mới
1. **Bento Grid siêu thoáng (High Whitespace & Balanced Density):**
   - Áp dụng bố cục lưới Bento bo góc mềm mại (`rounded-2xl` đến `rounded-3xl`), đường viền siêu mỏng (`border-border-hairline`), bóng đổ nhẹ tự nhiên (`shadow-[0_4px_20px_rgba(24,78,119,0.04)]`).
2. **Hiển thị thông minh theo lớp (Progressive Disclosure):**
   - **Lớp 1 (Đập vào mắt trong 3 giây):** 3-4 chỉ số KPI quan trọng nhất hiển thị số to rõ nét (Tổng chi, Bạn đã chi, Số dư của bạn, Tiến độ ngân sách) + Bản đồ trực quan kèm vị trí nhóm.
   - **Lớp 2 (Chi tiết khi cần):** Chi tiết danh sách thành viên đầy đủ, lịch sử giao dịch dài, phân bổ từng người được gom vào dạng Avatar Stack (`+N`), accordion mở rộng hoặc popover tinh tế.
3. **Cảm giác cao cấp (Premium Travel Experience):**
   - Học hỏi phong cách FlyScope và Hiking Dashboard: sử dụng tab chuyển đổi dạng pill nhẹ nhàng, màu sắc dịu mắt, icon Lucide tối giản, không gây rối mắt.

---

## 2. Thiết kế chi tiết cho từng phân hệ

### A. Phân hệ Tổng quan (`/trips/[id]`)
- **Hàng 1: Bento KPI Quick-Cards (4 cột linh hoạt)**
  1. *Ngân sách & Tiến độ:* Thước đo tiến độ dạng thanh pill mảnh kèm % và số tiền còn lại.
  2. *Tổng chi cả nhóm:* Con số to đậm, icon nhận diện gọn gàng.
  3. *Bạn đã ứng:* Số tiền bạn đã chi hộ nhóm.
  4. *Số dư ròng:* Badge trạng thái Đang dương (+) hoặc Đang nợ (-) nổi bật với màu cảnh báo êm dịu (`bg-lime-cream` hoặc `bg-functional-warning-bg`).
- **Hàng 2: Trọng tâm Không gian (Main Bento Split)**
  - **Cột trái (Lớn - 7/12):** Bản đồ tương tác trực quan `TripLiveMapWidget` tích hợp lộ trình, định vị nhóm và trạm tiện ích dọc đường.
  - **Cột phải (5/12):** Thẻ "Điểm dừng tiếp theo trong lịch trình" (Next destination & Weather) + Khối thành viên dạng **Avatar Stack** thu gọn (hiển thị 4 avatar tròn kèm badge `+N thành viên`, bấm vào xem chi tiết modal).
- **Hàng 3: Hoạt động chi tiêu gần đây (Recent Expenses)**
  - Danh sách dòng chi tiêu tối giản: Icon danh mục tròn, Tên món chi, Thời gian, Người trả & Số tiền. Nút "Xem tất cả" chuyển sang tab Chi tiêu.

### B. Phân hệ Lịch trình (`/trips/[id]/itinerary`)
- **Bộ chọn ngày:** Dạng horizontal pill bar mượt mà (Ngày 1, Ngày 2, Ngày 3), có badge ngày tháng thanh thoát.
- **Thanh tối ưu lộ trình:** Thu gọn thành thanh công cụ nổi tinh giản (Tối ưu tự động + Nút "Tối ưu đường đi").
- **Thẻ điểm dừng (TripItineraryCard):**
  - Tối giản các nút thao tác vào menu ba chấm (dropdown), chỉ để lộ: Số thứ tự ghim, Tên địa điểm, Giờ đến, Badge thời tiết Open-Meteo, và Trạng thái khóa vị trí (`isLocked`).
  - Ghi chú và chi phí liên kết thu gọn dạng chip nhỏ (11px).

### C. Phân hệ Chi tiêu (`/trips/[id]/expenses`)
- **Thẻ chi tiêu:** Bố cục dạng hàng ngang thông thoáng (Left: Icon danh mục & Tên khoản chi + Ngày; Middle: Avatar người trả + Chip số người chia `+3 người`; Right: Số tiền to đậm màu xanh Yale).
- Bấm vào thẻ để bung mở rộng danh sách chi tiết ai trả bao nhiêu thay vì luôn hiển thị dài dòng.

### D. Phân hệ Công nợ / Quyết toán (`/trips/[id]/settlement`)
- **Bento Visual Debt Flow:**
  - Thẻ giao dịch chuyển khoản trực quan: [Avatar Người nợ] ─── (Số tiền) ───> [Avatar Người nhận].
  - Nút "Quét VietQR" nổi bật, popover thông tin ngân hàng bảo mật.

### E. Phân hệ Thành viên (`/trips/[id]/members`)
- Grid các thẻ thành viên gọn gàng: Avatar lớn, Tên, Vai trò (Trưởng nhóm / Thành viên), Số tiền đã chi tiêu, nút liên hệ/sao chép mã mời.

---

## 3. Bảng Token màu sắc & Spacing (Tuân thủ ui-ux-pro-max)

- **Màu sắc cốt lõi:**
  - Primary / Text chính: `#184E77` (`text-yale-blue`)
  - Accent / Tương tác: `#1A759F` (`text-cerulean`), `#52B69A` (`text-tropical-teal`)
  - Nền & Card: `#FFFFFF` (`bg-white`), `#F4F9EC` (`bg-bg-canvas`), `#D9ED92` (`bg-lime-cream`)
  - Subtle borders: `#E2E8F0` / `rgba(24,78,119,0.08)`
- **Border Radius:** `rounded-2xl` (16px) và `rounded-3xl` (24px).
- **Typography:** Hierarchy phân cấp rõ rệt: Heading to đậm (`text-xl` đến `text-2xl font-bold tracking-tight`), nhãn phụ tinh giản (`text-xs text-text-muted font-medium`).
