# Phase 3ZU-R — Resume Controlled Staging E2E Verification Report

> **Tài liệu:** Báo cáo Tiếp tục Kiểm thử E2E Có kiểm soát trên Staging (Phase 3ZU-R)  
> **Phiên bản:** 1.0.0  
> **Ngày thực hiện:** 2026-10-25  
> **Target Staging URL:** `https://staging.tungcloud.online`  
> **Target Supabase Ref:** `rwvptwjpfhtfkiwboexz` (Staging đã phê duyệt)  
> **Forbidden Production Ref:** `fzdaasbckmnndqzqopex` (BẢO VỆ TUYỆT ĐỐI — DO NOT TOUCH)  
> **Trạng thái:** DỪNG AN TOÀN (BLOCKED Ở BƯỚC AUTOMATION DO VERCEL AUTH TRÊN API / CẦN CHỦ DỰ ÁN KIỂM TRA THỦ CÔNG)  

---

## 1. Tóm tắt Hiện trạng & Tiến độ Sau Khi Tiếp tục

Trong Phase 3ZU-R, hệ thống đã tiếp tục kiểm thử dựa trên thông tin Chủ dự án đã đăng nhập Vercel trên Chrome cá nhân:
1. **Truy cập Giao diện Staging:** Browser automation đã kết nối thành công tới `https://staging.tungcloud.online/login` và tải trực tiếp giao diện Smart Trip (Title: *"Smart Trip - Kế hoạch & Chi tiêu du lịch"*, hiển thị đầy đủ thẻ đăng nhập, nút *"Tiếp tục với Google"*).
2. **Rào cản API do Vercel Deployment Protection:**
   - Khi client gọi API `POST /api/auth/sign-in/social` để khởi tạo luồng đăng nhập Google, Vercel Edge Proxy lập tức trả về phản hồi:
     ```json
     HTTP/1.1 401 Unauthorized
     {
       "error": { "code": "401", "message": "Protected deployment" },
       "protection": { "vercel_auth_enabled": true },
       "message": "Protected by Vercel Authentication"
     }
     ```
   - **Nguyên nhân kỹ thuật:** Phiên browser automation của agent chạy độc lập trong sandbox, không dùng chung cookies/session đăng nhập Vercel của trình duyệt Chrome cá nhân của Chủ dự án. Vì vậy, các yêu cầu `fetch()` gọi vào backend API bị Vercel chặn ở tầng Edge Gateway với mã 401.
3. **Thực thi Quy tắc An toàn:** Tuân thủ điều khoản *"Nếu browser automation vẫn bị chặn do sử dụng session riêng, không cố vượt qua bảo vệ; đánh dấu phần automation là BLOCKED và cung cấp hướng dẫn để chủ dự án kiểm tra thủ công."*, hệ thống dừng toàn bộ thao tác ghi dữ liệu và báo cáo trạng thái chi tiết.

---

## 2. Bảng Kết quả Chi tiết Từng Test Case & Endpoint

| STT | Test Case / Endpoint | Phương thức | Kết quả Ghi nhận | Trạng thái |
| :---: | :--- | :---: | :--- | :---: |
| **1** | **Git Status & Working Tree** | Git CLI | Nhánh `staging/release-1-preview` đồng bộ commit `7080808`. Không mất thay đổi. | **`PASS`** |
| **2** | **Target Domain HTTPS** | HTTP Check | `https://staging.tungcloud.online` phản hồi qua Vercel Edge `hkg1`. | **`PASS`** |
| **3** | **Database Target Fail-Closed** | Local Script | `DATABASE_URL` trỏ đúng Staging `rwvptwjpfhtfkiwboexz` (true); Production `fzdaasbckmnndqzqopex` (false). | **`PASS`** |
| **4** | **Tải Giao diện `/login`** | Browser E2E | Giao diện Smart Trip hiển thị đầy đủ tiêu đề, logo và nút Google (`#google-signin-btn`). | **`PASS`** |
| **5** | **Auth Guard `/api/me` (Unauthenticated)** | Browser / HTTP | Trả về JSON chuẩn: `{"success":false,"error":{"code":"UNAUTHORIZED","message":"Yêu cầu đăng nhập để thực hiện thao tác này."}}`. | **`PASS`** |
| **6** | **Khởi tạo Google OAuth (`/api/auth/sign-in/social`)** | Browser / HTTP | Vercel Edge chặn API với `HTTP 401 Unauthorized: Protected by Vercel Authentication` do sandbox automation chưa có session Vercel. | **`BLOCKED`** (Automation) |
| **7** | **Google OAuth Callback & Cấp Session** | Browser E2E | Không thể kích hoạt tự động do bước 6 bị chặn. Cần Chủ dự án thực hiện thủ công trên Chrome cá nhân. | **`BLOCKED`** (Chờ chủ dự án xác nhận) |
| **8** | **Tạo Trip mới (`SMOKE-STAGING-3ZU-`)** | API E2E | Dừng an toàn theo nguyên tắc Fail-Closed (chưa có session được cấp phát). | **`NOT RUN`** |
| **9** | **Luồng Mời & QR Code (`/join/[code]`)** | Browser / API | Chưa thể thực thi do chưa có trip thử nghiệm mới. | **`NOT RUN`** |
| **10** | **Claims Flow (Gửi & Duyệt)** | API E2E | Chưa thể thực thi do chưa có trip thử nghiệm mới. | **`NOT RUN`** |
| **11** | **Hóa đơn & Proxy UC32 (`trip-receipts`)** | API E2E | Chưa thể thực thi do chưa có trip thử nghiệm mới. | **`NOT RUN`** |
| **12** | **Quyết toán & VietQR UC18 (`payment-info`)** | API E2E | Logic EMVCo đạt chuẩn trong unit test; E2E live chưa thể kích hoạt. | **`NOT RUN`** |
| **13** | **Quét VietQR trên Thiết bị Thật** | Thủ công | Chưa có dữ liệu settlement live của Phase 3ZU. | **`NOT VERIFIED`** |
| **14** | **Archive Chuyến đi** | API E2E | Chưa có dữ liệu thử nghiệm cần archive. | **`NOT RUN`** |

---

## 3. Quản lý Dữ liệu Kiểm thử & Dọn dẹp

1. **Dữ liệu mới tạo trong Phase 3ZU-R:**
   - **`0` thực thể được tạo.** Không có chuyến đi, thành viên, chi tiêu hay hóa đơn mới nào được ghi vào cơ sở dữ liệu hoặc storage.
2. **Dữ liệu lịch sử cần giữ lại (`PRESERVE`):**
   - Trip ID Gate 4B Staging: `9a2f7637-0024-4457-952e-eebdb489839e` (Code `2R5MQ8-Y56BFG`).
   - Các User ID: `8af8707c-8804-43b2-ae28-719e31451a67`, `37b1f7cf-aad6-433c-a25e-242c11bada8a`.
   - Giữ nguyên trạng thái phục vụ kiểm tra đối soát, không tự động dọn dẹp.
3. **Cơ sở dữ liệu Production (`fzdaasbckmnndqzqopex`):**
   - Hoàn toàn nguyên vẹn, không có bất kỳ kết nối hay tác động nào.

---

## 4. Bằng chứng Trực quan Thu thập Được (Artifacts)

1. **Bản ghi thao tác trình duyệt:** `click_google_signin_1792904140925.webp`  
   - Ghi lại quá trình mở trang `/login`, xác nhận các thành phần DOM và kiểm tra phản hồi của nút đăng nhập.
2. **Log ghi nhận trạng thái:** [scratchpad_5i94s79p.md](file:///C:/Users/admin/.gemini/antigravity-ide/brain/2e1f2bfb-0c78-4faf-b4d3-1ebc469c30f1/browser/scratchpad_5i94s79p.md)  
   - Ghi nhận phản hồi `/api/me` trả về lỗi xác thực `UNAUTHORIZED` đúng thiết kế bảo mật của hệ thống.

---

## 5. Hướng dẫn Dành cho Chủ Dự án Kiểm tra Thủ công (Manual E2E Verification Guide)

Vì trình duyệt Chrome cá nhân của Chủ dự án đã có session Vercel hợp lệ, Chủ dự án có thể thực hiện kiểm tra thủ công trực tiếp theo các bước chuẩn sau:

### Bước 1: Đăng nhập Google trên Chrome
1. Mở Chrome (nơi đã đăng nhập Vercel) và truy cập: `https://staging.tungcloud.online/login`.
2. Bấm nút **"Tiếp tục với Google"**.
3. **Kỳ vọng:** Trình duyệt chuyển hướng sang `accounts.google.com`, cho phép chọn tài khoản Google thử nghiệm (Host/Member đã cấp quyền trong Test Users), sau đó chuyển hướng về `https://staging.tungcloud.online/trips` với session đăng nhập thành công.
4. Mở tab mới truy cập `https://staging.tungcloud.online/api/me`:
   - **Kỳ vọng:** Trả về JSON chứa `id`, `name`, `email` của tài khoản Google vừa đăng nhập (HTTP 200).

### Bước 2: Tạo Chuyến đi Thử nghiệm
1. Tại trang `/trips`, bấm **"Tạo chuyến đi mới"**.
2. Đặt tên chuyến đi: `SMOKE-STAGING-3ZU-DA-LAT` (hoặc tên tương tự có tiền tố `SMOKE-STAGING-3ZU-`).
3. Chọn ngày bắt đầu và kết thúc -> Bấm Tạo.
4. **Kỳ vọng:** Chuyến đi tạo thành công, giao diện chuyển vào trang chi tiết chuyến đi.

### Bước 3: Kiểm tra QR Mời & Đổi Mã mời
1. Bấm nút **"Chia sẻ mã mời"**.
2. **Kỳ vọng:** Hiển thị modal chứa mã mời dạng `XXXXXX-XXXXXX` và mã QR thật chứa URL `https://staging.tungcloud.online/join/[code]`.
3. Bấm **"Đổi mã mời"**:
   - **Kỳ vọng:** Mã mời đổi sang chuỗi mới, mã QR cập nhật theo mã mới, mã cũ không còn sử dụng được.

### Bước 4: Kiểm tra Hóa đơn UC32 & Chi tiêu
1. Vào tab **Chi tiêu** -> Bấm **"Thêm khoản chi"**.
2. Nhập số tiền, tên khoản chi, và upload 1 file ảnh hóa đơn giả lập (JPEG/PNG, < 5MB).
3. Lưu khoản chi -> Tải lại trang (F5).
4. **Kỳ vọng:** Ảnh hóa đơn hiển thị ổn định qua URL proxy `/api/trips/[id]/receipts/[fileId]` (không bị mất sau khi F5).

### Bước 5: Quyết toán & Xem VietQR UC18
1. Thêm thành viên thứ hai (hoặc mở cửa sổ ẩn danh đăng nhập bằng tài khoản Google thứ hai qua link mời).
2. Tạo khoản chi chia tiền -> Vào tab **Quyết toán** -> Bấm **"Chốt sổ công nợ"**.
3. Thành viên nợ bấm **"Chuyển khoản / Xem mã VietQR"**.
4. **Kỳ vọng:** Modal hiển thị thông tin ngân hàng và mã VietQR chuẩn xác. *(DỪNG LẠI TẠI ĐÂY; KHÔNG BẤM XÁC NHẬN CHUYỂN TIỀN THẬT).*

---

## 6. Kết luận & Điều kiện Tiếp tục

- **Kết luận:** Môi trường Staging và backend Smart Trip hoạt động đúng kiến trúc, các route bảo vệ và Auth Guard hoạt động chuẩn xác (`UNAUTHORIZED` khi chưa có session).
- **Rào cản Automation:** Vercel Deployment Protection ngăn cản công cụ browser automation độc lập gọi API xác thực nếu không có bypass token hoặc session Vercel.
- **Hành động tiếp theo:** Sau khi Chủ dự án kiểm tra thủ công hoặc cấu hình *Protection Bypass for Automation* trên Vercel Dashboard, kết quả E2E hoàn chỉnh sẽ được cập nhật vào báo cáo nghiệm thu Release 1.
