# Kế hoạch triển khai Giai đoạn 2D — Chi tiêu & Chia tiền (Expenses & Bill Splitting)

> **Dự án:** Smart Trip & Expense Planner (Release 1)  
> **Phiên bản tài liệu:** 1.1 (Đã phê duyệt hướng kiến trúc Hướng A, các quyết định nghiệp vụ và lộ trình phân kỳ 2D.1, 2D.2, 2D.3)  
> **Trạng thái:** Đã duyệt — Sẵn sàng triển khai Giai đoạn 2D.1  
> **Bộ kỹ năng & tiêu chuẩn áp dụng:** `ui-ux-pro-max`, `docs/ENGINEERING_STANDARDS.md`, `docs/DEFINITION_OF_DONE.md`, `docs/AI_IMPLEMENTATION_WORKFLOW.md`

---

## 1. Mục tiêu và phạm vi

### 1.1 Mục tiêu chính
Giai đoạn 2D hiện thực hóa hai phân hệ cốt lõi tạo nên giá trị trung tâm của sản phẩm Smart Trip:
1. **Phân hệ Chi tiêu (Expenses Management & Bill Splitting):** Quản lý nhật ký chi tiêu của chuyến đi, hỗ trợ thêm/sửa/xóa khoản chi, đính kèm ảnh chứng từ hóa đơn, phân loại danh mục, và thực hiện chia tiền linh hoạt (chia đều có xử lý phần dư hoặc chia theo từng món ăn).
2. **Phân hệ Quyết toán & Công nợ (Settlement & Debt Simplification):** Tính toán số dư ròng của từng thành viên, khóa sổ chi tiêu, áp dụng thuật toán tối giản hóa công nợ (Greedy Bipartite Matching) để rút gọn số giao dịch thanh toán chéo, hỗ trợ tạo thông tin thanh toán VietQR và đối soát nhận tiền.

### 1.2 Phân kỳ triển khai Giai đoạn 2D

Để đảm bảo chất lượng, tính cô lập và khả năng kiểm thử chặt chẽ theo tiêu chuẩn `AI_IMPLEMENTATION_WORKFLOW.md`, Giai đoạn 2D được chia thành 3 phân kỳ:

- **Giai đoạn 2D.1 — Danh sách & Thêm khoản chi (Chia đều):** *(Phạm vi của lượt này)*
  * Tích hợp Tab Chi tiêu vào trang chi tiết chuyến đi `/trips/[id]`.
  * Khối tóm tắt ngân sách & tiến độ chi tiêu trên đỉnh tab.
  * Bộ lọc danh mục, ô tìm kiếm và dropdown lọc theo thành viên.
  * Danh sách khoản chi phân nhóm theo ngày (`spent_at`), hiển thị người trả, số tiền, cách chia, và icon xem ảnh hóa đơn qua Lightbox.
  * Biểu mẫu thêm khoản chi mới (Modal 2 cột chuẩn Stitch `th_m_kho_n_chi_l_t_3n2`): Hero Input số tiền, gợi ý làm tròn nhanh, tên khoản chi, chọn danh mục, người trả (theo quy tắc R18 đã duyệt), gắn địa điểm, chọn thành viên tham gia chia đều (EQUAL split), live breakdown hiển thị phần tiền từng người và phần dư 1 ₫, dropzone đính kèm ảnh hóa đơn.
  * Trạng thái dữ liệu phiên (in-session state / mock service): Cho phép thêm khoản chi mới và cập nhật giao diện trực quan trong phiên thử nghiệm, kèm thông báo dữ liệu chưa lưu vào PostgreSQL; **tuyệt đối không sửa đổi `MOCK_TRIPS` gốc**.
  * Unit test cho validation, thuật toán chia đều R4, và Visual QA 3 độ phân giải.
  * *Chưa làm trong 2D.1:* Chia theo từng món, tính công nợ, chốt sổ công nợ, modal VietQR.

- **Giai đoạn 2D.2 — Chia tiền theo từng món (Itemized Split & Phụ phí VAT/Dịch vụ):**
  * Ma trận chia theo món ăn (`chia_theo_m_n_l_t_3n2`): Tên món, số tiền, checkbox chọn thành viên tham gia từng món.
  * Khung preview ảnh hóa đơn gốc đối chiếu bên cạnh.
  * Phụ phí VAT & Phí dịch vụ: Khoản phụ phí riêng được tự động chia đều cho các thành viên tham gia hóa đơn.
  * Tính toán tổng phần chia của từng người và đối soát 100% khớp tổng tiền.

- **Giai đoạn 2D.3 — Quyết toán, Rút gọn nợ, Thanh toán VietQR & Chốt/Mở lại sổ:**
  * Bảng công nợ "Ai trả ai bao nhiêu" và thuật toán rút gọn nợ (Greedy Bipartite Matching).
  * Chốt sổ công nợ (UC15) và khóa toàn bộ chức năng sửa/xóa khoản chi (R7).
  * Mở lại sổ (UC22) khi chưa có ai thanh toán.
  * Modal thanh toán VietQR (minh họa UI nội bộ bằng SVG và mock data, có chú thích rõ ràng).
  * Modal Nhắc nợ thân thiện Zalo/SMS (3 tone giọng).
  * Xác nhận đã nhận tiền (UC20) và tự động hoàn tất chuyến đi.

### 1.3 Ranh giới phạm vi (Scope Boundaries — Tuân thủ Release 1)

| Hạng mục | Trong phạm vi Release 1 (Giai đoạn 2D) | Nằm ngoài phạm vi Release 1 (Tuyệt đối không làm) |
|---|---|---|
| **Chi tiêu** | • Xem danh sách chi tiêu phân nhóm theo ngày.<br/>• Bộ lọc danh mục, tìm kiếm, lọc theo người trả/tham gia.<br/>• Thêm khoản chi mới với số tiền nguyên dương (VND).<br/>• Đính kèm ảnh chụp hóa đơn (chỉ lưu trữ & xem ảnh). | • Không quét hóa đơn tự động bằng AI / OCR.<br/>• Không xuất file Excel (.xlsx) hay xuất báo cáo PDF tự động.<br/>• Không có tính năng "Ví chuyến đi" (Trip Wallet) thu quỹ trước. |
| **Chia tiền** | • Chia đều (EQUAL) với quy tắc phân phối phần dư 1 ₫ theo `join_order` (R4).<br/>• Chia theo từng món (ITEMIZED) với ma trận tích chọn thành viên (UC31 - 2D.2). | • Không tự sáng tác các tỷ lệ phần trăm tùy ý không có trong thiết kế.<br/>• Không phân bổ chi phí cho thành viên đã rời nhóm nếu không tham gia. |
| **Công nợ** | • Chốt sổ công nợ (UC15) và khóa tính năng sửa chi tiêu (R7).<br/>• Mở lại sổ (UC22) khi chưa có ai thanh toán.<br/>• Thuật toán rút gọn nợ tất định (UC16).<br/>• Bảng "Ai trả ai bao nhiêu" và thẻ "Số dư của bạn".<br/>• Modal thanh toán VietQR minh họa SVG nội bộ & Tiền mặt (2D.3).<br/>• Modal Nhắc nợ thân thiện đa phong cách (UC29 - 2D.3).<br/>• Xác nhận đã nhận tiền (UC20) và chuyển trạng thái chuyến đi. | • Không tích hợp cổng thanh toán trực tuyến (Payment Gateway).<br/>• Không kết nối ngân hàng qua Open Banking API hoặc webhook tự động.<br/>• Toàn bộ giao dịch ngân hàng diễn ra ngoài ứng dụng qua quét mã VietQR. |

---

## 2. Các quyết định nghiệp vụ đã được người dùng phê duyệt

Các quyết định sau đây đã được người dùng chính thức phê duyệt cho Giai đoạn 2D:

1. **Quyền người ứng tiền (Quy tắc R18):**
   * *Nội dung đã duyệt:* Thành viên bình thường (`MEMBER`) chỉ được ghi khoản chi do chính mình thanh toán. Trưởng nhóm (`HOST`) được quyền ghi hộ cho **bất kỳ thành viên nào** (bao gồm thành viên chưa có tài khoản).
   * *Phân định nguồn gốc:* Đây là **quyết định nghiệp vụ đã được người dùng phê duyệt** dựa trên đề xuất tại sơ đồ tuần tự `sodothietke/release1-sequence.md` (SD1). Không gán quy tắc phân quyền này cho mô hình ERD vì ERD không quy định logic phân quyền giao diện.
2. **VAT và phí dịch vụ trong chia theo món (Áp dụng cho 2D.2):**
   * *Nội dung đã duyệt:* VAT và phí dịch vụ là khoản phụ phí riêng, chia đều cho những người tham gia hóa đơn. Giao diện phải minh bạch về cách phân bổ chi phí này (theo thiết kế `chia_theo_m_n_l_t_3n2`).
3. **Mã VietQR thanh toán (Áp dụng cho 2D.3):**
   * *Nội dung đã duyệt:* VietQR chỉ là minh họa UI nội bộ bằng vector SVG và dữ liệu giả định, có chú thích rõ ràng: *“Minh họa — chưa hỗ trợ thanh toán thật”*. Tuyệt đối không tạo mã thanh toán có thể dùng với tài khoản thật, không sử dụng số tài khoản thật và không gọi API dịch vụ bên thứ ba (không gọi `img.vietqr.io`).
4. **Nguyên tắc an toàn số học tiền VND:**
   * *Nội dung đã duyệt:* Tiền VND phải là số nguyên an toàn (`integer`). Không dùng sai số thập phân để chia tiền; sử dụng phép chia nguyên (`Math.floor`), phần dư toán học (`%`) và thứ tự phân bổ xác định theo `join_order`.
5. **Căn cứ nguồn gốc quy tắc:**
   * Mọi quy tắc về trạng thái khóa sổ (R7), mở lại sổ (UC22), bất biến $\sum Net = 0$ và thuật toán rút gọn nợ (UC16) đều được trích dẫn trực tiếp từ các tài liệu nguồn `sodothietke/release1-sequence.md` và `sodothietke/release1-erd.dbml`. Nếu có điểm mở rộng, phải ghi rõ là quyết định nghiệp vụ riêng.

---

## 3. Bằng chứng yêu cầu từ Use Case, ERD, Sequence Diagram và Google Stitch

### 3.1 Đối chiếu Use Case (`sodothietke/release1-usecase.drawio`)
- `UC11`: Thêm khoản chi (Tên, số tiền, danh mục, người ứng trước, gắn địa điểm).
- `UC12`: Chia tiền đều (Phân bổ cho các thành viên được chọn).
- `UC13`: Sửa / Xóa khoản chi (Chỉ khả dụng khi chuyến đi ở trạng thái `ACTIVE`).
- `UC14`: Xem danh sách chi tiêu (Phân nhóm ngày, tổng ngày, tổng chuyến).
- `UC25`: Xem số dư cá nhân (Biết mình đang âm hay dương tiền).
- `UC31`: Chia theo từng món (Itemized Split ma trận món x người dùng — Giai đoạn 2D.2).
- `UC32`: Đính kèm ảnh hóa đơn (Lưu trữ và xem ảnh chứng từ gốc).

### 3.2 Đối chiếu Mô hình dữ liệu ERD (`sodothietke/release1-erd.dbml`)
- Bảng `expenses`: Khóa chính `id` (uuid), `trip_id`, `itinerary_item_id` (nullable), `title` (varchar 200), `amount` (integer VND, `CHECK > 0`), `category` (enum 6 giá trị: `FOOD`, `TRANSPORT`, `LODGING`, `TICKET`, `SHOPPING`, `OTHER`), `paid_by_member_id` (trỏ `trip_members.id`), `created_by_member_id`, `split_method` (`EQUAL` | `ITEMIZED`), `spent_at` (timestamptz), `receipt_image_url`, `note`.
- Bảng `expense_shares`: Khóa ngoại `expense_id`, `member_id` (trỏ `trip_members.id`), `amount` (integer VND, `CHECK >= 0`). Unique index: `(expense_id, member_id)`. Bất biến nghiệp vụ: $\sum \text{amount} \equiv \text{expenses.amount}$.
- **Nguyên tắc trỏ thành viên trong ERD:** Mọi quan hệ tài chính trỏ tới `trip_members.id`, không trỏ trực tiếp tới `users.id`, vì thành viên chưa có tài khoản (`user_id = NULL`) vẫn có phát sinh chi tiêu và quyền lợi/nghĩa vụ tài chính như thành viên bình thường.

### 3.3 Đối chiếu Sơ đồ tuần tự (`sodothietke/release1-sequence.md`)
- **SD1 (Thêm khoản chi & chia tiền):** 
  * Kiểm tra trạng thái chuyến đi: nếu chuyến đã chốt sổ (`trips.status <> 'ACTIVE'`), trả về lỗi 409 (Sổ đã khóa theo quy tắc R7).
  * `SplitService` tính toán phần chia: `computeShares(amount, method, participants, items)`.
  * Bắt buộc kiểm tra $\sum \text{shares} \equiv \text{amount}$ (R3, R4).
- **Quy tắc R4 (Thuật toán chia đều có phần dư):**
  $$\text{Base} = \lfloor Amount / N \rfloor, \quad \text{Remainder} = Amount - (\text{Base} \times N)$$
  Thành viên có `join_order` từ $0$ đến $\text{Remainder} - 1$ nhận $\text{Base} + 1$, các thành viên còn lại nhận $\text{Base}$. Bất biến: tổng phần chia luôn chính xác 100% bằng $Amount$.

### 3.4 Đối chiếu Thiết kế Google Stitch
- `chi_ti_u_l_t_3n2`: Giao diện danh sách chi tiêu, thanh tổng quan ngân sách, chip lọc danh mục có số đếm, bảng phân nhóm theo ngày, icon đính kèm hóa đơn.
- `th_m_kho_n_chi_l_t_3n2`: Form thêm khoản chi bố cục 2 cột (8:4 layout):
  * Cột trái (8 cột): Hero Input số tiền lớn, gợi ý làm tròn nhanh (100k, 1M), tên khoản chi, chip chọn 1 danh mục, chọn người trả trước (kèm avatar & nhãn Bạn), gắn địa điểm, segmented control chọn cách chia ("Chia đều" | "Theo món"), grid toggle chọn thành viên tham gia, ngày chi, ghi chú.
  * Cột phải (4 cột): Card Live Breakdown "Mỗi người trả" cập nhật trực tiếp theo thời gian thực kèm ghi chú số dư 1 ₫ do làm tròn, dropzone tải ảnh hóa đơn (tối đa 10MB), nút "Lưu khoản chi" và "Hủy bỏ".

---

## 4. Chi tiết triển khai Giai đoạn 2D.1: Danh sách và Thêm khoản chi

### 4.1 Luồng người dùng Giai đoạn 2D.1
1. Người dùng mở trang Chi tiết chuyến đi `/trips/[id]`, nhấp vào tab **Chi tiêu**.
2. Tab Chi tiêu hiển thị:
   - Thanh tóm tắt ngân sách (Tổng đã chi, % hạn mức, số khoản chi, chi tiêu bình quân/người, nút `+ Thêm khoản chi`).
   - Hàng chip lọc danh mục (Tất cả, Ăn uống, Di chuyển, Lưu trú, Vé tham quan, Mua sắm, Khác) kèm số đếm động.
   - Ô tìm kiếm theo tên khoản chi và dropdown lọc theo thành viên trả tiền.
   - Bảng danh sách chi tiêu phân nhóm theo từng ngày (`spent_at`), hiển thị tiêu đề, danh mục, người trả, số tiền (định dạng `tabular-nums`), cách chia (ví dụ "Chia đều 5 người"), và icon hóa đơn (click mở Lightbox xem ảnh chứng từ).
3. Người dùng bấm `+ Thêm khoản chi` $\to$ Modal 2 cột mở ra:
   - Nhập số tiền: Validate số nguyên dương VND, hỗ trợ nút gợi ý nhanh 100k, 1M.
   - Nhập tên: Bắt buộc, tối đa 200 ký tự.
   - Chọn danh mục: Bắt buộc chọn 1 trong 6 danh mục.
   - Chọn người trả: Nếu là `MEMBER` $\to$ chỉ chọn chính mình; nếu là `HOST` $\to$ chọn được bất kỳ thành viên nào (bao gồm thành viên chưa có tài khoản).
   - Chọn thành viên chia đều: Toggle avatar các thành viên tham gia (tối thiểu 1 người). Card bên phải hiển thị phần chia từng người, hiển thị icon info giải thích số tiền +1 ₫ được phân bổ theo `join_order`.
   - Chọn ngày chi & ghi chú tùy chọn.
   - Đính kèm ảnh hóa đơn tùy chọn qua dropzone kéo thả.
   - Bấm "Lưu khoản chi" $\to$ Kiểm tra tính hợp lệ $\to$ Thêm vào danh sách chi tiêu trong phiên, hiển thị thông báo thành công kèm ghi chú phiên thử nghiệm.
4. Nếu chuyến đi ở trạng thái `SETTLING` hoặc `COMPLETED` (ví dụ chuyến Phú Quốc hoặc Sa Pa), nút `+ Thêm khoản chi` sẽ bị vô hiệu hóa kèm tooltip giải thích sổ công nợ đã được chốt (R7).

### 4.2 Cấu trúc Component Giai đoạn 2D.1
```text
src/
├── types/
│   └── trip.ts                                     # Mở rộng types: Expense, ExpenseCategory, ExpenseShare, ExpenseFilterState
├── lib/
│   ├── expense-validation.ts                       # [MỚI] Pure validation cho form thêm khoản chi
│   ├── split-service.ts                            # [MỚI] Pure service: Thuật toán chia đều R4 với join_order
│   └── mock-trips.ts                               # Dữ liệu chi tiêu chi tiết mẫu cho 3 chuyến đi
├── components/
│   └── trips/
│       ├── detail/
│       │   └── trip-detail-tabs.tsx                # Hỗ trợ active tab chi-tieu chuyển giao diện
│       └── expenses/
│           ├── trip-expenses-tab.tsx               # Container chính tab Chi tiêu (quản lý state & bộ lọc)
│           ├── trip-expense-summary-bar.tsx        # Thanh tóm tắt tài chính trên đỉnh
│           ├── trip-expense-filters.tsx            # Chip danh mục, search input, member filter
│           ├── trip-expense-day-group.tsx          # Bảng phân nhóm chi tiêu theo ngày
│           ├── trip-expense-row.tsx                # Dòng chi tiêu chi tiết
│           ├── trip-expense-form-modal.tsx         # Modal thêm khoản chi 2 cột (Stitch)
│           └── trip-receipt-lightbox-modal.tsx     # Modal xem ảnh hóa đơn phóng to
```

### 4.3 Quản lý State phiên thử nghiệm (In-Session Mock State)
- Dữ liệu ban đầu lấy từ `getTripDetailById(id)`.
- Các khoản chi mới được thêm trong phiên duyệt web sẽ được lưu trong React state cục bộ của `TripExpensesTab` (hoặc custom hook `useTripExpenses(trip)`).
- Khi thêm thành công, hiển thị Toast thông báo: *"Đã thêm khoản chi thành công! (Lưu ý: Dữ liệu chỉ tồn tại trong phiên thử nghiệm, chưa lưu vào PostgreSQL)"*.
- **Cam kết:** Tuyệt đối không thay đổi mảng `MOCK_TRIPS` và `MOCK_TRIP_DETAILS` gốc để đảm bảo tính bất biến của dữ liệu nghiệm thu các giai đoạn trước.

---

## 5. Kế hoạch kiểm thử và Visual QA Giai đoạn 2D.1

### 5.1 Kiểm thử tự động (Unit Tests)
Tạo file kiểm thử `tests/expense-logic.test.mjs` với các ca kiểm thử:
1. `computeEqualShares`:
   - $100.000$ ₫ cho 3 người $\to$ $33.334$ ₫, $33.333$ ₫, $33.333$ ₫ (tổng $100.000$ ₫).
   - $1$ ₫ cho 3 người $\to$ $1$ ₫, $0$ ₫, $0$ ₫ (tổng $1$ ₫).
   - $500.000$ ₫ cho 5 người $\to$ $100.000$ ₫ mỗi người.
   - Bất biến: $\sum \text{Shares} \equiv \text{Amount}$ với mọi giá trị số nguyên.
   - Phân bổ theo đúng thứ tự `join_order`.
2. `validateExpenseForm`:
   - Hợp lệ khi nhập đủ thông tin bắt buộc.
   - Lỗi khi số tiền $\le 0$, số tiền rỗng hoặc không phải số nguyên.
   - Lỗi khi tên khoản chi rỗng hoặc vượt quá 200 ký tự.
   - Lỗi khi không chọn danh mục.
   - Lỗi khi không chọn thành viên nào tham gia chia tiền.
   - Kiểm tra quyền người trả tiền: Thành viên thường không được chọn người khác; Trưởng nhóm được chọn thành viên chưa có tài khoản.

### 5.2 Kế hoạch Visual QA
- Chạy ứng dụng trên trình duyệt qua Browser Subagent.
- Kiểm tra hiển thị và tương tác trên 3 kích thước:
  * Desktop (1280px / 1440px): Bố cục 12 cột, 2 cột của Modal thêm khoản chi.
  * Tablet (768px): Responsive các chip lọc và bảng chi tiêu scroll ngang.
  * Mobile (375px): Bố cục 1 cột, touch targets $\ge 44$px, modal hiển thị thân thiện.
- Kiểm tra các tương tác:
  * Lọc danh mục Ăn uống, Di chuyển, v.v. $\to$ Bảng cập nhật tức thì.
  * Tìm kiếm theo tên $\to$ Bảng lọc chính xác.
  * Bấm xem icon hóa đơn $\to$ Lightbox hiển thị ảnh phóng to.
  * Mở Modal Thêm khoản chi $\to$ Nhập số tiền $\to$ Thử nút gợi ý 100k, 1M $\to$ Card Live Breakdown nhảy số chính xác.
  * Thêm 1 khoản chi mới $\to$ Danh sách cập nhật, ngân sách cập nhật, thông báo phiên xuất hiện.
  * Chuyển sang chuyến Phú Quốc (`SETTLING`) $\to$ Nút thêm chi tiêu bị disable kèm giải thích khóa sổ.
- Lưu ảnh báo cáo kiểm thử vào `tests/reports/phase-2d1/`.

---

## 6. Definition of Done cho Giai đoạn 2D.1

- [ ] Kế hoạch `docs/phase-2d-plan.md` được cập nhật và lưu trữ đầy đủ.
- [ ] Giao diện tab Chi tiêu render hoàn chỉnh, khớp 100% phong cách thiết kế Stitch `chi_ti_u_l_t_3n2`.
- [ ] Modal thêm khoản chi 2 cột render chính xác theo `th_m_kho_n_chi_l_t_3n2`.
- [ ] Logic chia đều R4 và phân bổ phần dư 1 ₫ theo `join_order` hoạt động chính xác tới từng 1 đồng.
- [ ] Quy tắc quyền người trả tiền R18 được thực thi đúng (Member chỉ chọn mình, Host chọn được bất kỳ thành viên nào).
- [ ] Tính năng xem ảnh hóa đơn Lightbox hoạt động mượt mà.
- [ ] Dữ liệu phiên thử nghiệm thêm mới không làm biến đổi mock data gốc.
- [ ] Trạng thái khóa sổ chi tiêu được thể hiện rõ ràng trên các chuyến `SETTLING`/`COMPLETED`.
- [ ] Bộ test suite tự động đạt 100% pass (bao gồm 51 tests cũ và các tests mới cho 2D.1).
- [ ] `npm run lint` và `npm run build` vượt qua không có lỗi TypeScript hay ESLint.
- [ ] Visual QA hoàn thành và lưu ảnh tại `tests/reports/phase-2d1/`.
- [ ] Tạo Git commit riêng với thông điệp chuẩn convention.
- [ ] Dừng lại báo cáo và chờ người dùng nghiệm thu trước khi bắt đầu Giai đoạn 2D.2.
