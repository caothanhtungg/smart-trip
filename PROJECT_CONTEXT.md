# PROJECT_CONTEXT.md — Smart Trip & Expense Planner (Release 1)

> Tài liệu ngữ cảnh và phạm vi triển khai của dự án.
> Cập nhật từ tài liệu dự án hiện có. Khi có mâu thuẫn, cần nêu rõ mâu thuẫn và xin xác nhận trước khi thực hiện.
> **Tình trạng triển khai hiện tại (Phase 3ZP — 24/10/2026):** Đã hoàn tất toàn bộ Backend API Release 1, xác thực Better Auth, mã hóa STK ngân hàng AES-256-GCM, đối soát công nợ & phân quyền chi tiêu, VietQR chuẩn EMVCo Napas 247 (UC18), QR mời (UC34), Lưu trữ ảnh hóa đơn bền vững (UC32), và GitHub Actions CI. Toàn bộ 75 test files / 1.121 tests offline đạt 100% passed.

## 1. Tổng quan sản phẩm

**Smart Trip & Expense Planner** là website hỗ trợ một nhóm tổ chức chuyến đi, lập lịch trình chung, ghi nhận các khoản chi, chia chi phí và đối soát công nợ sau chuyến đi.

Release 1 tập trung vào:
- Tài khoản và hồ sơ người dùng đăng nhập bằng Google.
- Tạo và quản lý chuyến đi, mời/tham gia, quản lý thành viên.
- Lịch trình theo ngày và địa điểm.
- Ghi khoản chi, chia đều hoặc chia theo từng món, đính kèm ảnh hóa đơn.
- Chốt sổ công nợ, rút gọn số giao dịch cần chuyển, tạo thông tin VietQR, đánh dấu thanh toán và xác nhận đã nhận.
- Tham gia bằng link/mã/QR và luồng yêu cầu nhận diện một thành viên chưa có tài khoản.

### Release 1 Extended — đã duyệt
> **Nguồn phê duyệt:** Người dùng xác nhận ngày 05/11/2026. Đây là phần mở rộng được duyệt của Release 1, không mặc định mở rộng sang các tính năng liên quan khác.

- **Dự báo thời tiết:** dùng Open-Meteo cho thông tin dự báo tại điểm đến theo phạm vi triển khai hiện tại.
- **Tối ưu lộ trình:** dùng thuật toán TSP 2-Opt cho lịch trình theo phạm vi triển khai hiện tại.
- Không cam kết dữ liệu giao thông thời gian thực, ETA thời gian thực, tối ưu đa phương tiện, hoặc bất kỳ khả năng thời tiết/lộ trình nâng cao nào chưa được duyệt riêng.

### Ngoài phạm vi Release 1
Không tự thêm các tính năng sau nếu chưa được người dùng duyệt:
- Đăng nhập bằng email/mật khẩu.
- Trang "Khám phá", "Cẩm nang", "Bảng giá".
- SMS, xác thực hai yếu tố, số điện thoại.
- Chọn ngôn ngữ (UI cố định tiếng Việt).
- Đa tiền tệ (chỉ VND).
- Chế độ tối (dark mode).
- Biểu đồ thống kê.
- Mọi câu quảng cáo về số lượng người dùng.
- “Ví chuyến đi” (Trip Wallet).
- OCR hóa đơn tự động (Release 1 chỉ lưu ảnh hóa đơn).
- Xuất Excel.

### Dành cho Release sau (Tạm ẩn khỏi giao diện Release 1 Extended)
Các khối giao diện sau chưa thuộc phạm vi Release 1 Extended. Đã có component mẫu nhưng được gỡ/tạm ẩn khỏi trang Tổng quan chuyến đi (`/trips/[id]`), giữ file component nhưng không render:
- **Biểu đồ tròn phân bổ chi tiêu** (`TripExpenseDonutChart` — đã lưu component, không render ở Release 1 Extended — thuộc Release 3).
- **Chuông thông báo** (nút chuông thông báo trên Header — ẩn khỏi giao diện Release 1 Extended, bảo lưu code component cho Release sau; không tạo bảng `notifications` trong cơ sở dữ liệu).

### Lưu ý khi chuyển Stitch sang React
Các màn hình trong thiết kế Google Stitch chứa một số chi tiết nằm ngoài phạm vi Release 1 (các mục ngoài phạm vi ở trên, cùng các nhãn/tính năng như "Thuật toán Simplex", "Chính xác tuyệt đối 100%", "VietQR PRO", "Google Places", "Ví chuyến đi", "Mã PIN"). Khi chuyển đổi thiết kế sang component React, **bắt buộc phải loại bỏ** các chi tiết này để giữ giao diện chuẩn xác với phạm vi Release 1.

## 2. Tài liệu nguồn hiện có

- `sodothietke/release1-usecase.drawio`: Use Case Diagram, gồm 34 use case trong 5 nhóm.
- `sodothietke/release1-erd.dbml`: ERD Release 1 cho PostgreSQL, 11 bảng nghiệp vụ và 9 enum.
- `sodothietke/release1-sequence.md`: 5 Sequence Diagram cùng quy tắc nghiệp vụ và test quan trọng.

Không sửa/xóa/ghi đè các tài liệu nguồn này khi chưa có sự đồng ý của người dùng.

## 3. Stack kỹ thuật và hiện trạng hệ thống

### Stack kỹ thuật thực tế (Hiện tại)
- **Framework:** Next.js 16.4.2 (App Router), React 19.3.0.
- **Language:** TypeScript 5 (Strict Mode).
- **Styling:** Tailwind CSS 4.
- **Database & ORM:** PostgreSQL trên Supabase, Prisma ORM 7.10.1 (`@prisma/client`, `@prisma/adapter-pg`).
- **Xác thực:** Better Auth 1.7.11 với Google OAuth provider, tích hợp Prisma adapter, quản trị routing qua `src/proxy.ts`.
- **Validation:** Zod 3.25.
- **Mã hóa:** AES-256-GCM tại tầng server (`src/lib/crypto/bank-encryption.ts`) với khóa 256-bit `BANK_ENCRYPTION_KEY`.
- **Thanh toán & Mã QR:** Offline VietQR generator (`src/lib/money/vietqr.ts`) tuân thủ chuẩn EMVCo Napas 247; tạo QR code offline qua thư viện `qrcode` 1.5.4.
- **Lưu trữ hóa đơn (UC32):** Magic Bytes validation (JPEG, PNG, WebP), UUID object keys, Private bucket proxy architecture (`/api/trips/[id]/receipts/[fileId]`), hỗ trợ cả Supabase Storage REST và Memory Storage Provider cho testing.
- **Testing:** Vitest 5.0.5 (75 test files, 1.121 tests offline passing).
- **CI/CD:** GitHub Actions (`.github/workflows/ci.yml`) chạy `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm test` offline.

### Bảng đối chiếu trạng thái tính năng Release 1

| Tính năng / Phân hệ | Use Case | Trạng thái kỹ thuật | Trạng thái kiểm chứng |
| :--- | :--- | :--- | :--- |
| Đăng nhập Google OAuth | UC01 | IMPLEMENTED | TESTED OFFLINE; NOT VERIFIED (Cần credentials thật E2E) |
| Xem / Cập nhật hồ sơ cá nhân | UC02 | IMPLEMENTED | TESTED OFFLINE |
| Mã hóa STK ngân hàng AES-256-GCM | UC03, UC18 | IMPLEMENTED | TESTED OFFLINE |
| Tạo chuyến đi, sửa thông tin | UC04, UC05 | IMPLEMENTED | TESTED OFFLINE |
| Đổi mã mời (Rotate Invite Code) | UC07 | IMPLEMENTED | TESTED OFFLINE |
| Lưu trữ chuyến đi (Archive Trip) | UC08 | IMPLEMENTED | TESTED OFFLINE |
| Quản lý thành viên (Thêm/Sửa/Xóa/Rời) | UC09, UC10, UC11, UC12 | IMPLEMENTED | TESTED OFFLINE |
| Nhận diện thành viên ảo (Claims flow) | UC13, UC14 | IMPLEMENTED | TESTED OFFLINE |
| Lịch trình theo ngày & sắp xếp | UC15, UC16, UC17 | IMPLEMENTED | TESTED OFFLINE |
| Thông tin thanh toán đối soát (Payment Info) | UC18 | IMPLEMENTED | TESTED OFFLINE |
| QR Code thanh toán VietQR EMVCo | UC18 | IMPLEMENTED | TESTED OFFLINE; NOT VERIFIED (Cần quét app ngân hàng thật) |
| Quản lý chi tiêu (Chia đều & chia món) | UC19, UC20, UC21, UC22 | IMPLEMENTED | TESTED OFFLINE |
| Lưu trữ ảnh hóa đơn bền vững | UC32 | IMPLEMENTED | TESTED OFFLINE; NOT VERIFIED (Cần bucket remote Supabase) |
| Đối soát nợ & Rút gọn nợ | UC24, UC25, UC26 | IMPLEMENTED | TESTED OFFLINE |
| Đánh dấu thanh toán & Xác nhận chuyển khoản | UC27, UC28 | IMPLEMENTED | TESTED OFFLINE |
| Mở lại sổ công nợ (Reopen Settlement) | UC29 | IMPLEMENTED | TESTED OFFLINE |
| Tham gia chuyến bằng Link/Mã mời/QR | UC30, UC31, UC34 | IMPLEMENTED | TESTED OFFLINE |
| GitHub Actions CI tự động | CI/CD | IMPLEMENTED | TESTED OFFLINE |

### Hướng dẫn chạy kiểm tra hệ thống
- Chạy unit/integration tests: `npm test`
- Chạy kiểm tra kiểu tĩnh TypeScript: `npx tsc --noEmit`
- Chạy linter: `npm run lint`
- Khởi động dev server: `npm run dev`

## 4. Vai trò và thuật ngữ giao diện

Các vai trò nghiệp vụ:
- **Trưởng nhóm**: thành viên giữ vai trò `HOST`, có một số quyền quản trị chuyến.
- **Thành viên**: thành viên có tài khoản hoặc người tham gia bình thường.
- **Thành viên chưa có tài khoản**: một dòng `trip_members` có `user_id = NULL`; Trưởng nhóm có thể nhập hộ một số thông tin và thao tác thay trong những trường hợp được quy định.

### Quy tắc từ ngữ trong UI
- Dùng “Trưởng nhóm”; tránh hiển thị “Host”, “Chủ nhóm”, “Thủ quỹ”.
- Dùng “Chưa có tài khoản” khi đề cập thành viên không có tài khoản; tránh các từ “Khách”, “Ảo”, “Thành viên ảo” trong giao diện hướng người dùng.
- Dùng đúng 3 nhãn trạng thái chuyến đi:
  - “Đang lên kế hoạch”
  - “Đang thanh toán”
  - “Đã hoàn tất”
- Dùng “Mã mời”, không dùng “PIN”.
- Tài liệu kỹ thuật cũ có thể dùng `HOST` hoặc “Host” để chỉ giá trị/khái niệm nội bộ; giao diện người dùng vẫn phải tuân thủ bộ thuật ngữ ở trên.

## 5. Design System đã duyệt từ Stitch

### Phong cách
**Tactile Organic Minimalism**: lấy cảm hứng từ sắc chanh non chuyển sang xanh biển thẳm; bố cục thoáng, bo góc mềm mại, số tiền là thông tin nổi bật.

### Brand palette
- Lime Cream `#D9ED92`: vùng highlight, chip tích cực, thẻ thành viên.
- Light Green `#B5E48C` và Mint Green `#99D98C`: avatar/progress.
- Emerald `#76C893`: điểm nhấn xác nhận, tiến độ ngân sách an toàn.
- Ocean Mist `#52B69A`: icon phụ, focus, viền nét đứt.
- Cerulean `#1A759F`: hành động chính, tab đang chọn, liên kết.
- Baltic Blue `#1E6091`: hover/active của nút chính.
- Yale Blue `#184E77`: tiêu đề, logo, chữ nhấn, bề mặt tối tương phản cao.
- Canvas Background `#F4F9EC`: nền trang.
- Card Surface `#FFFFFF`.
- Divider Hairline `#DDEBD0`.
- Row Hover `#EEF6E4`.
- Nợ/lỗi `#B42318`.
- Cảnh báo/chờ thanh toán: `#C2410C` trên `#FFF1E6`.
- Dương tiền/đã nhận: `#2E7D5B`.

### Typography và trình bày
- Font: Be Vietnam Pro.
- Body line-height tối thiểu 1.5.
- Tiền VND dùng dấu chấm phân tách hàng nghìn và ký hiệu phía sau, ví dụ `1.250.000 ₫`; sử dụng `tabular-nums` cho cột số.
- Giờ dùng định dạng 24h, ví dụ `14:00`, `08:30`.
- Ngày dùng định dạng `dd/mm/yyyy` (theo ngày thực tế của dữ liệu).
- Không dùng emoji làm icon điều hướng hoặc icon danh mục; dùng icon vector từ Phosphor Icons hoặc Lucide React với stroke khoảng 1.5–2px.
- Hover/active khoảng 150–200ms, `ease-out`.
- Focus bàn phím rõ ràng: viền `3px solid #52B69A`, offset `2px`.
- Tương phản văn bản thông thường cần đạt WCAG AA 4.5:1; chữ trắng chỉ dùng trên nền Cerulean/Yale Blue theo tài liệu thiết kế.

### Responsive
- Desktop 1440px: grid 12 cột, max-width 1200px; trang hub có 8 cột nội dung + 4 cột panel bên phải.
- Tablet 640–1023px: 8 cột, panel bên phải chuyển xuống dưới.
- Mobile dưới 640px: một cột; tab bar chuyển thành Bottom Navigation Bar; vùng chạm tối thiểu 48px.

Không tự ý đổi palette, font, thuật ngữ, bố cục cốt lõi hoặc phong cách nếu chưa báo lý do và được duyệt.

## 6. Danh mục màn hình chính từ Stitch

1. `trang_ch_smart_trip`: Landing page.
2. `ng_nh_p_smart_trip`: Đăng nhập Google.
3. `chuy_n_i_c_a_t_i`: Danh sách chuyến đi với 3 trạng thái.
4. `t_o_chuy_n_i`: Tạo chuyến đi.
5. `t_ng_quan_chuy_n_i_l_t_3n2`: Hub/tổng quan chuyến đi.
6. `l_ch_tr_nh_l_t_3n2`: Lịch trình theo ngày.
7. `th_m_a_i_m_modal_l_t_3n2`: Modal thêm địa điểm.
8. `chi_ti_u_l_t_3n2`: Danh sách chi tiêu.
9. `th_m_kho_n_chi_l_t_3n2`: Modal thêm khoản chi.
10. `chia_theo_m_n_l_t_3n2`: Chia theo từng món.
11. `c_ng_n_l_t_3n2`: Bảng công nợ.
12. `thanh_to_n_cho_minh_modal_c_ng_n`: Modal thanh toán.
13. `vietqr_banking_code`: Thành phần hiển thị QR chuyển khoản.
14. `nh_c_n_modal_l_t_3n2`: Modal nhắc nợ.
15. `qu_n_l_th_nh_vi_n_l_t_3n2`: Quản lý thành viên.
16. `l_i_m_i_tham_gia_l_t_3n2`: Xem trước lời mời.
17. `b_n_l_ai_trong_chuy_n_i_n_y`: Nhận diện/chọn tên thành viên.
18. `h_s_c_a_t_i`: Hồ sơ cá nhân và thông tin ngân hàng.
19. `smart_trip_hero_illustration`: Tài nguyên minh họa.

Một số tên ở trên là tên thư mục được Stitch xuất ra; hãy đọc nội dung thực tế của thư mục để ánh xạ chính xác, không đoán file dựa vào tên đã bị mã hóa dấu.

## 7. Use Case theo nhóm

Tổng cộng 34 UC:

- **Tài khoản**: UC01 Đăng nhập Google; UC02 Cập nhật hồ sơ và STK; UC27 Đăng xuất.
- **Chuyến đi/thành viên**: UC03 Tạo chuyến; UC04 Mời thành viên; UC05 Tham gia; UC06 Xem chi tiết; UC07 Xóa thành viên; UC21 Rời chuyến; UC23 Sửa thông tin chuyến; UC24 Hủy/lưu trữ; UC26 Thêm thành viên chưa có tài khoản; UC28 Thu hồi/đổi mã mời; UC30 Duyệt yêu cầu nhận diện; UC33 Chọn mình là thành viên đã được tạo trước; UC34 Hiển thị QR mời.
- **Lịch trình**: UC08 Thêm địa điểm; UC09 Sửa/xóa địa điểm; UC10 Xem theo ngày.
- **Chi tiêu**: UC11 Thêm khoản chi; UC12 Chia tiền; UC13 Sửa/xóa khoản chi; UC14 Xem danh sách chi tiêu; UC25 Xem số dư cá nhân; UC31 Chia theo món; UC32 Đính kèm ảnh hóa đơn.
- **Công nợ**: UC15 Chốt sổ; UC16 Rút gọn nợ; UC17 Xem bảng công nợ; UC18 Tạo QR thanh toán; UC19 Thanh toán khoản nợ; UC20 Xác nhận đã nhận tiền; UC22 Mở lại sổ; UC29 Nhắc nợ.

## 8. Mô hình dữ liệu ERD

11 bảng nghiệp vụ:
- `users`
- `trips`
- `trip_members`
- `member_claims`
- `itinerary_items`
- `expenses`
- `expense_shares`
- `expense_items`
- `expense_item_members`
- `settlements`
- `settlement_transfers`

9 enums:
- `trip_status`: `ACTIVE`, `SETTLING`, `COMPLETED`, `ARCHIVED`.
- `member_role`: `HOST`, `MEMBER`.
- `member_status`: `ACTIVE`, `LEFT`.
- `expense_category`: `FOOD`, `TRANSPORT`, `LODGING`, `TICKET`, `SHOPPING`, `OTHER`.
- `split_method`: `EQUAL`, `ITEMIZED`.
- `settlement_status`: `ACTIVE`, `CANCELLED`.
- `transfer_status`: `UNPAID`, `PAID`, `COMPLETED`.
- `claim_status`: `PENDING`, `APPROVED`, `REJECTED`.
- `payment_method`: `BANK_TRANSFER`, `CASH`.

### Quyết định dữ liệu quan trọng
- Tiền là số nguyên theo đồng VND; không dùng floating point cho phép tính tiền.
- ID sử dụng UUID; thời gian timestamp có timezone.
- Người trả, người chịu phần chia và người trong giao dịch công nợ tham chiếu `trip_members.id`, không tham chiếu trực tiếp `users.id`, vì thành viên chưa có tài khoản vẫn phải có lịch sử tiền.
- `trip_members.user_id = NULL` biểu thị thành viên chưa có tài khoản.
- Mỗi chuyến chỉ có một Trưởng nhóm; tài liệu đề nghị partial unique index để bảo đảm.
- Không xóa cứng thành viên đã có dữ liệu liên quan; cập nhật `status = LEFT`.
- Mỗi chuyến tối đa một settlement `ACTIVE`; mở lại sổ sẽ chuyển settlement cũ sang `CANCELLED`.
- Tài khoản Better Auth adapter (`user`, `account`, `session`, `verification`) do adapter tạo; bảng `users` mở rộng thêm các cột ngân hàng.

## 9. Quy tắc nghiệp vụ quan trọng

### Thành viên và quyền truy cập
- Chỉ thành viên `ACTIVE` của chuyến được truy cập dữ liệu riêng của chuyến.
- Trưởng nhóm có quyền quản trị theo Use Case; thao tác cụ thể phải theo sơ đồ và quy tắc tương ứng.
- Thành viên chưa có tài khoản do Trưởng nhóm tạo; một số thao tác được Trưởng nhóm thực hiện thay trong phạm vi quy tắc nghiệp vụ.

### Lịch trình
- Địa điểm thuộc một chuyến và một ngày; có thể có thứ tự, địa chỉ, tọa độ, giờ bắt đầu/kết thúc, ghi chú.
- Có thể gắn khoản chi với một địa điểm lịch trình; liên kết này là tùy chọn.

### Chi tiêu/chia tiền
- Số tiền khoản chi phải là số nguyên dương.
- Tổng các phần chia phải bằng chính xác tổng khoản chi.
- Chia đều: phần dư 1 đồng được phân phối theo `join_order`; ví dụ 100.000₫/3 người → 33.334₫, 33.333₫, 33.333₫ theo thứ tự.
- Chia theo món: mỗi món gán cho người tham gia món đó; nếu nhiều người dùng một món thì chia đều giữa họ, rồi cộng tổng theo từng người.
- Sau khi chuyến rời trạng thái `ACTIVE`/đã chốt sổ, không cho thêm/sửa/xóa chi tiêu theo quy tắc R7.
- Ảnh hóa đơn chỉ lưu ảnh, không OCR tự động trong Release 1.

### Chốt sổ và công nợ
- Khi chốt sổ, tính `net = đã trả - phần phải chịu` theo từng thành viên.
- Bất biến cần giữ: `SUM(net) = 0`; nếu không, xử lý như lỗi dữ liệu và rollback.
- Rút gọn nợ dùng thuật toán greedy ghép người nợ nhiều nhất với người có khoản nhận lớn nhất; deterministic bằng tie-break theo ID. Đây là heuristic gần tối ưu, không khẳng định luôn tối thiểu tuyệt đối.
- Giao dịch chuyển tiền: `UNPAID` → người nợ đánh dấu `PAID` → người nhận (hoặc Trưởng nhóm trong trường hợp quy định) xác nhận `COMPLETED`.
- Khi mọi giao dịch đã `COMPLETED`, chuyến chuyển `COMPLETED`.
- Chỉ Trưởng nhóm mở lại sổ và chỉ khi chưa ai đánh dấu thanh toán.
- Nếu tất cả `net = 0`, không tạo transfer; giao diện hiển thị empty state tích cực.

### QR, mời và riêng tư
- QR mời sinh từ link mời ngay trên trình duyệt; không cần API riêng.
- Mã mời không hợp lệ/đã thu hồi → thông báo không hợp lệ; chuyến lưu trữ → thông báo chuyến đã đóng.
- Thẻ preview chỉ hiển thị tên chuyến, điểm đến, ngày đi/về, tên Trưởng nhóm và tên/avatar thành viên; không trả lịch trình, chi tiêu hoặc thông tin tài khoản ngân hàng.
- Giới hạn số lần thử mã mời theo IP để chống dò mã.
- Yêu cầu nhận diện thành viên chờ Trưởng nhóm duyệt; trước khi duyệt, người gửi chưa được xem dữ liệu chuyến. Khi duyệt phải giữ nguyên lịch sử và `join_order`. Nếu một yêu cầu được duyệt, các yêu cầu chờ khác đối với cùng thành viên phải bị từ chối.

## 10. Các trạng thái UI cần có

Ngoài trạng thái mặc định của màn hình, cần có các trạng thái sau theo báo cáo đối chiếu Stitch và Use Case:
- Empty state khi chưa có chuyến đi.
- Empty state khi một ngày chưa có địa điểm.
- Empty state khi chưa có khoản chi.
- Empty state khi không ai nợ ai.
- Loading/skeleton, lỗi tải dữ liệu, lỗi validation, thông báo thành công.
- Toast khi sao chép mã mời, nội dung nhắc nợ hoặc số tài khoản.
- Khi sổ đã chốt: disable chức năng thêm/sửa/xóa khoản chi, giải thích rõ lý do.
- Khi người nhận chưa có STK: cảnh báo và hướng người dùng thanh toán tiền mặt hoặc nhắc cập nhật hồ sơ.
- Modal xác nhận cho chốt sổ/mở lại sổ, lưu trữ chuyến, xóa thành viên, rời chuyến, đổi mã mời, sửa/xóa địa điểm và sửa/xóa khoản chi.
- Không cho xóa/rời thành viên nếu điều kiện công nợ chưa thỏa mãn.
- Receipt lightbox để xem ảnh hóa đơn đã đính kèm.

Trước khi thêm trạng thái hoặc modal, đối chiếu bảng UI trong báo cáo Stitch để tránh dựng trùng.

## 11. Các quyết định đã chốt và mục chờ xác nhận

1. **R18 — Quyền ghi khoản chi:** ✅ **ĐÃ DUYỆT** (Nguồn: Người dùng duyệt ngày 18/10/2026). Thành viên chỉ được ghi khoản chi do chính mình thanh toán. Trưởng nhóm được ghi hộ cho **BẤT KỲ thành viên nào** (bao gồm thành viên chưa có tài khoản). Đã thống nhất đồng bộ trong toàn bộ tài liệu, mã nguồn và unit test.
2. **Phí dịch vụ / VAT:** ✅ **ĐÃ DUYỆT** (Nguồn: Người dùng duyệt ngày 18/10/2026). VAT và phí dịch vụ là một dòng phụ phí riêng, chia đều cho những người cùng tham gia hóa đơn. Giao diện phải minh bạch cách phân bổ.
3. **VietQR:** ✅ **ĐÃ TRIỂN KHAI CHO BACKEND & UI (Phase 3ZO)**: Đã triển khai bộ sinh payload chuẩn EMVCo Napas 247 (`src/lib/money/vietqr.ts`), trích xuất thông tin người nhận qua endpoint bảo mật `/api/trips/:id/transfers/:transferId/payment-info` (UC18), và hiển thị mã QR thật offline qua thư viện `qrcode` trên modal thanh toán. Kiểm thử quét thực tế trên thiết bị thật đánh dấu: **NOT VERIFIED** (cần thiết bị và app ngân hàng thật).
4. **Điểm đến (destination):** ✅ **ĐÃ DUYỆT** (Nguồn: Người dùng duyệt ngày 18/10/2026). Điểm đến không bắt buộc; ô nhập trên giao diện tạo chuyến đi KHÔNG được có dấu hoa thị (*).
5. **Mã mời (invite_code):** ✅ **ĐÃ DUYỆT** (Nguồn: Người dùng duyệt ngày 19/10/2026 & 20/10/2026). Giữ nguyên chuẩn `varchar(13)` trong ERD và codebase (`trips.invite_code`). Server sinh đúng 12 ký tự ngẫu nhiên bằng bộ sinh số an toàn mật mã `crypto` (loại bỏ triệt để các ký tự dễ nhầm lẫn `0`, `O`, `1`, `I`, `L` — bảng mã Base31: `23456789ABCDEFGHJKMNPQRSTUVWXYZ`). Lưu trữ và hiển thị dạng `XXXXXX-XXXXXX` (đúng 13 ký tự). Tra cứu chuẩn hóa đầu vào: tự động loại bỏ khoảng trắng và dấu gạch nối, chuyển in hoa, kiểm tra đúng 12 ký tự Base31 hợp lệ và tự động chèn dấu gạch nối sau ký tự thứ 6 trước khi truy vấn DB. Giữ nguyên commit `b15c467`, không rollback.
6. **Giảm giá trong chia theo món (discount):** ✅ **ĐÃ DUYỆT CHỌN PHƯƠNG ÁN B** (Nguồn: Người dùng duyệt ngày 18/10/2026). Chưa hỗ trợ dòng giảm giá số âm trong Release 1 để bảo toàn mô hình ERD (`expense_items.amount > 0` và `expense_shares.amount >= 0`). Nếu có khuyến mãi/voucher, người dùng tự trừ trước vào số tiền món hoặc tổng tiền hóa đơn.
7. **Đối tượng chịu thuế VAT & phí dịch vụ (surcharge):** ✅ **ĐÃ DUYỆT** (Nguồn: Người dùng duyệt ngày 18/10/2026). Chỉ những thành viên có ít nhất 1 món trong hóa đơn mới cùng chia sẻ dòng Thuế & phí dịch vụ. Thành viên không ăn món nào trong hóa đơn (0 món) thì không phải chịu phụ phí của hóa đơn đó.
8. **Đăng nhập (Authentication):** ✅ **ĐÃ DUYỆT & TRIỂN KHAI** (Nguồn: Người dùng duyệt ngày 20/10/2026). Sử dụng **Better Auth** với duy nhất Google OAuth provider, tích hợp Prisma adapter. Tuyệt đối không dùng Auth.js (NextAuth). Next.js 16 sử dụng `proxy.ts` thay cho `middleware.ts`.
9. **Mô hình hóa phụ phí (Surcharge Persistence):** ✅ **ĐÃ DUYỆT CHỌN PHƯƠNG ÁN C** (Nguồn: Người dùng duyệt ngày 20/10/2026). Bổ sung cột `surcharge_amount integer NOT NULL DEFAULT 0` kèm ràng buộc `CHECK (surcharge_amount >= 0)` trực tiếp vào bảng `expenses`. Không sửa đổi cấu trúc bảng `expense_items`. Phụ phí chỉ phân bổ cho thành viên có món ăn trong khoản chi; chia đều tiền phụ phí, phần dư nguyên (remainder) phân bổ theo thứ tự `join_order`.
10. **Mã hóa số tài khoản ngân hàng (Bank Account Encryption):** ✅ **ĐÃ DUYỆT & TRIỂN KHAI** (Nguồn: Người dùng duyệt ngày 20/10/2026). Mã hóa đối xứng **AES-256-GCM** tại tầng ứng dụng server. Khóa 32-byte (256-bit) lưu trong biến môi trường chỉ ở server `BANK_ENCRYPTION_KEY` (chuỗi hex 64 ký tự, tuyệt đối không có tiền tố `NEXT_PUBLIC_`). Cột `bank_account_no varchar(255)` lưu chuỗi định dạng `iv:authTag:ciphertext`. Cột `bank_account_key_version integer NOT NULL DEFAULT 1` theo dõi phiên bản khóa. Quy trình đổi khóa thủ công qua script bảo trì một lần. Trường hợp mất khóa, bắt lỗi giải mã an toàn và yêu cầu người dùng nhập lại STK tại trang Cài đặt / Hồ sơ cá nhân. Không sử dụng dịch vụ KMS đám mây.
11. **Chuông thông báo (Notification Bell):** ✅ **ĐÃ DUYỆT** (Nguồn: Người dùng duyệt ngày 20/10/2026). Loại bỏ hoàn toàn khỏi phạm vi Release 1 (ẩn nút chuông thông báo trên Header, bảo lưu mã nguồn component cho Release sau). Không tạo bảng `notifications` trong cơ sở dữ liệu.
12. **Lưu trữ ảnh hóa đơn bền vững (UC32):** ✅ **ĐÃ TRIỂN KHAI (Phase 3ZP)**. Xác thực Magic Bytes (JPEG/PNG/WebP), kiểm tra giới hạn dung lượng 5MB, sinh UUID object key ngẫu nhiên. Kiến trúc Private Storage Bucket kết hợp Route Handler proxy có phân quyền (`/api/trips/[id]/receipts/[fileId]`). Hỗ trợ Supabase REST Storage Provider và Memory Storage Provider cho unit/offline test. Cấu hình bucket trên Supabase Staging/Production đánh dấu: **NOT VERIFIED** (phụ thuộc thao tác hạ tầng).
13. **GitHub Actions CI/CD:** ✅ **ĐÃ TRIỂN KHAI (Phase 3ZP)**. Workflow `.github/workflows/ci.yml` tự động chạy khi push/PR: `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm test` offline mà không yêu cầu secret thật hay database bên ngoài.


## 12. Quy tắc bảo vệ tài liệu nguồn

- Không sửa các tài liệu nguồn trong `sodothietke/` (ERD, use case, sequence) khi chưa có yêu cầu rõ của người dùng. Nếu thấy cần đổi, hãy đề xuất và chờ duyệt.

## 14. Quy tắc mã nguồn

(a) Không viết mã hex trong component hay file TS, chỉ dùng token màu (Tailwind utility / semantic CSS variable).
(b) Mọi thuật ngữ giao diện nằm trong `src/lib/labels.ts`.
(c) Trang và component không import dữ liệu mẫu trực tiếp, chỉ gọi `src/lib/data/*`.
(d) Phép tính tiền nằm trong `src/lib/money/` và có test, tiền luôn là số nguyên.
(e) Không hard-code vai trò hay id người dùng trong component.
(f) Không để chữ trên giao diện nhắc tới tên file tài liệu, mã giai đoạn hay số Release.
(g) Test dùng Vitest, đặt cạnh mã nguồn (`*.test.ts`).
