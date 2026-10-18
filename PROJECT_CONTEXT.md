# PROJECT_CONTEXT.md — Smart Trip & Expense Planner (Release 1)

> Tài liệu ngữ cảnh dùng chung cho Antigravity, Claude, Cline và các công cụ AI khác.
> Cập nhật từ tài liệu dự án hiện có. Khi có mâu thuẫn, không tự suy đoán: chỉ ra mâu thuẫn và hỏi người dùng.
> Tình trạng triển khai hiện tại theo kế hoạch: ưu tiên hoàn thiện UI/UX và frontend; chưa triển khai backend/API nghiệp vụ, database thật, OAuth thật hoặc thanh toán thật.

## 1. Tổng quan sản phẩm

**Smart Trip & Expense Planner** là website hỗ trợ một nhóm tổ chức chuyến đi, lập lịch trình chung, ghi nhận các khoản chi, chia chi phí và đối soát công nợ sau chuyến đi.

Release 1 tập trung vào:
- Tài khoản và hồ sơ người dùng đăng nhập bằng Google.
- Tạo và quản lý chuyến đi, mời/tham gia, quản lý thành viên.
- Lịch trình theo ngày và địa điểm.
- Ghi khoản chi, chia đều hoặc chia theo từng món, đính kèm ảnh hóa đơn.
- Chốt sổ công nợ, rút gọn số giao dịch cần chuyển, tạo thông tin VietQR, đánh dấu thanh toán và xác nhận đã nhận.
- Tham gia bằng link/mã/QR và luồng yêu cầu nhận diện một thành viên chưa có tài khoản.

### Ngoài phạm vi Release 1
Không tự thêm các tính năng sau nếu chưa được người dùng duyệt:
- Đăng nhập bằng email/mật khẩu.
- Trang "Khám phá", "Cẩm nang", "Bảng giá".
- SMS, xác thực hai yếu tố, số điện thoại.
- Chọn ngôn ngữ (UI cố định tiếng Việt).
- Đa tiền tệ (chỉ VND).
- Chế độ tối (dark mode).
- Tối ưu lộ trình, bản đồ lộ trình.
- Dự báo thời tiết.
- Biểu đồ thống kê.
- Mọi câu quảng cáo về số lượng người dùng.
- “Ví chuyến đi” (Trip Wallet).
- OCR hóa đơn tự động (Release 1 chỉ lưu ảnh hóa đơn).
- Xuất Excel.

### Dành cho Release sau (Tạm ẩn khỏi giao diện Release 1)
Các khối giao diện sau thuộc Release 2 và 3, đã có component mẫu nhưng được gỡ/tạm ẩn khỏi trang Tổng quan chuyến đi (`/trips/[id]`), giữ file component nhưng không render:
- **Dự báo thời tiết** (thẻ thời tiết trong thông tin phụ chuyến đi — thuộc Release 2).
- **Điểm đến tiếp theo & Bản đồ lộ trình** (widget bản đồ trong thông tin phụ — thuộc Release 2).
- **Biểu đồ tròn phân bổ chi tiêu** (`TripExpenseDonutChart` — đã lưu component, không render ở Release 1 — thuộc Release 3).

### Lưu ý khi chuyển Stitch sang React
Các màn hình trong thiết kế Google Stitch chứa một số chi tiết nằm ngoài phạm vi Release 1 (các mục ngoài phạm vi ở trên, cùng các nhãn/tính năng như "Thuật toán Simplex", "Chính xác tuyệt đối 100%", "VietQR PRO", "Google Places", "Ví chuyến đi", "Mã PIN"). Khi chuyển đổi thiết kế sang component React, **bắt buộc phải loại bỏ** các chi tiết này để giữ giao diện chuẩn xác với phạm vi Release 1.

## 2. Tài liệu nguồn hiện có

- `sodothietke/release1-usecase.drawio`: Use Case Diagram, gồm 34 use case trong 5 nhóm.
- `sodothietke/release1-erd.dbml`: ERD Release 1 cho PostgreSQL, 11 bảng nghiệp vụ và 9 enum.
- `sodothietke/release1-sequence.md`: 5 Sequence Diagram cùng quy tắc nghiệp vụ và test quan trọng.
- `stitch_smart_trip_dashboard_design/`: tài nguyên giao diện xuất từ Google Stitch; theo báo cáo hiện có, có 17 giao diện HTML/CSS độc lập, 2 đặc tả Design System và các tài nguyên liên quan.
- `.agents/skills/`: skill cài cho Antigravity.
- `.cline/skills/`: skill cài cho Cline.

Không sửa/xóa/ghi đè các tài liệu nguồn này khi chưa có sự đồng ý của người dùng.

## 3. Stack kỹ thuật

### Stack được đề xuất trong tài liệu
- Next.js 16.4.2, App Router.
- TypeScript.
- Tailwind CSS.
- PostgreSQL.
- Route Handler phía server cho API.
- Auth.js/Google OAuth cho xác thực (chỉ triển khai khi sang giai đoạn backend).
- `next/font/google` với Be Vietnam Pro.
- Có thể dùng Phosphor Icons hoặc Lucide React; chọn một thư viện và dùng thống nhất.
- Có thể dùng thư viện `qrcode` để tạo QR mời phía trình duyệt.

Đây là stack được đề xuất theo các tài liệu kiến trúc; trước khi thay đổi công nghệ cần giải thích lý do và xin người dùng duyệt.

### Quyết định công nghệ đã chốt (chưa cài — sẽ cài khi sang giai đoạn tương ứng)
- **Database:** PostgreSQL trên Supabase.
- **ORM:** Prisma.
- **Xác thực:** Auth.js với Google OAuth.
- **Kiểm thử:** Vitest.
- **Icon:** Lucide React (đã dùng thống nhất).
- **Validation API:** zod cho kiểm tra dữ liệu API.

*(Lưu ý: Không cài thêm bất kỳ gói nào tại thời điểm này; chỉ cài khi chuyển sang giai đoạn triển khai tương ứng).*

### Ranh giới giai đoạn hiện tại
Hiện tại ưu tiên **UI/UX và frontend**:
- Được phép dựng cấu trúc frontend, Design Tokens, component dùng chung, màn hình, responsive và tương tác trực quan.
- Dữ liệu mẫu tĩnh có thể dùng để trình diễn, nhưng phải ghi chú rõ và tách khỏi lớp dữ liệu thật.
- Chưa xây backend/API nghiệp vụ, chưa kết nối PostgreSQL/migration, chưa triển khai Google OAuth thực tế, chưa lưu giao dịch tài chính thật, chưa tích hợp thanh toán VietQR thật.
- Tổ chức code để có thể nối backend về sau mà không phải viết lại toàn bộ UI.
- Thực hiện theo từng giai đoạn, chạy kiểm tra và báo cáo trước khi chuyển sang giai đoạn tiếp theo.

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
- Tài khoản Auth.js adapter (`accounts`, `sessions`, `verification_tokens`) do adapter tạo; không nằm trong ERD nghiệp vụ hiện tại.

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
3. **VietQR:** ✅ **ĐÃ DUYỆT CHO GIAI ĐOẠN GIAO DIỆN** (Nguồn: Người dùng duyệt ngày 18/10/2026). CHỈ áp dụng minh họa UI nội bộ bằng SVG và dữ liệu giả định, kèm chú thích "Minh họa — chưa hỗ trợ thanh toán thật". Không gọi dịch vụ bên ngoài, không dùng STK thật. Quyết định kỹ thuật cho giai đoạn backend vẫn **MỞ**.
4. **Điểm đến (destination):** ✅ **ĐÃ DUYỆT** (Nguồn: Người dùng duyệt ngày 18/10/2026). Điểm đến không bắt buộc; ô nhập trên giao diện tạo chuyến đi KHÔNG được có dấu hoa thị (*).
5. **Mã mời (invite_code):** ⏳ **CHỜ NGƯỜI DÙNG QUYẾT ĐỊNH.** Đang ở trạng thái chờ người dùng chốt phương án. Việc hoàn tác commit `b15c467` bằng một commit mới đưa `invite_code` về `varchar(12)` được đưa vào danh sách chờ và chỉ thực hiện sau khi có xác nhận chính thức từ người dùng.
6. **Giảm giá trong chia theo món (discount):** ✅ **ĐÃ DUYỆT CHỌN PHƯƠNG ÁN B** (Nguồn: Người dùng duyệt ngày 18/10/2026). Chưa hỗ trợ dòng giảm giá số âm trong Release 1 để bảo toàn mô hình ERD (`expense_items.amount > 0` và `expense_shares.amount >= 0`). Nếu có khuyến mãi/voucher, người dùng tự trừ trước vào số tiền món hoặc tổng tiền hóa đơn.
7. **Đối tượng chịu thuế VAT & phí dịch vụ (surcharge):** ✅ **ĐÃ DUYỆT** (Nguồn: Người dùng duyệt ngày 18/10/2026). Chỉ những thành viên có ít nhất 1 món trong hóa đơn mới cùng chia sẻ dòng Thuế & phí dịch vụ. Thành viên không ăn món nào trong hóa đơn (0 món) thì không phải chịu phụ phí của hóa đơn đó.

## 12. Cách AI phải làm việc với dự án

- Đọc tài liệu này và các tài liệu nguồn liên quan trước khi thực hiện task.
- Trong giai đoạn UI/frontend hiện tại, không làm backend, không tạo migration PostgreSQL, không tích hợp OAuth thực tế, không thực hiện thanh toán thật.
- Giữ nguyên phong cách và quy tắc UI từ Stitch; dùng skill UI/UX Pro Max để rà soát khả năng truy cập, responsive và tính nhất quán, không dùng skill làm lý do để tự ý đổi thiết kế đã duyệt.
- Không tự ý thêm tính năng ngoài Release 1.
- Không tự quyết định các mục ở Mục 11; báo lại người dùng.
- Chỉ thực hiện phạm vi task được giao. Với thay đổi lớn, chia nhỏ theo giai đoạn, báo cáo file tạo/sửa và kết quả kiểm thử rồi chờ duyệt.
- Không để bí mật trong mã nguồn phía client hoặc commit lên Git.
- Không xóa/ghi đè `sodothietke/`, `stitch_smart_trip_dashboard_design/`, `.agents/` hoặc `.cline/`.

## 13. Quy tắc bảo vệ tài liệu nguồn

- Không sửa các tài liệu nguồn trong `sodothietke/` (ERD, use case, sequence) khi chưa có yêu cầu rõ của người dùng. Nếu thấy cần đổi, hãy đề xuất và chờ duyệt.
- Các file trong `stitch_smart_trip_dashboard_design/` là tài nguyên tham chiếu; không xóa hoặc ghi đè.

## 14. Quy tắc mã nguồn

(a) Không viết mã hex trong component hay file TS, chỉ dùng token màu (Tailwind utility / semantic CSS variable).
(b) Mọi thuật ngữ giao diện nằm trong `src/lib/labels.ts`.
(c) Trang và component không import dữ liệu mẫu trực tiếp, chỉ gọi `src/lib/data/*`.
(d) Phép tính tiền nằm trong `src/lib/money/` và có test, tiền luôn là số nguyên.
(e) Không hard-code vai trò hay id người dùng trong component.
(f) Không để chữ trên giao diện nhắc tới tên file tài liệu, mã giai đoạn hay số Release.
(g) Test dùng Vitest, đặt cạnh mã nguồn (`*.test.ts`).
