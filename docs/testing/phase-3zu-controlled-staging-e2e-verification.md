# Phase 3ZU — Controlled Staging E2E Verification Report

> **Tài liệu:** Báo cáo Kiểm thử End-to-End Có kiểm soát trên Môi trường Staging (Release 1)  
> **Phiên bản:** 1.0.0  
> **Ngày thực hiện:** 2026-10-25  
> **Target Domain:** `https://staging.tungcloud.online`  
> **Target Supabase Staging Ref:** `rwvptwjpfhtfkiwboexz` (Được phê duyệt)  
> **Forbidden Production Ref:** `fzdaasbckmnndqzqopex` (BẢO MẬT TUYỆT ĐỐI — KHÔNG THAO TÁC)  
> **Trạng thái:** DỪNG AN TOÀN DO BỊ CHẶN BỞI VERCEL DEPLOYMENT PROTECTION (BLOCKED BY VERCEL AUTH GATEWAY)  

---

## 1. Mục tiêu & Ranh giới An toàn

Thực hiện kiểm toán và kiểm thử end-to-end (E2E) có kiểm soát trên môi trường Staging thực tế sau khi Chủ dự án đã hoàn thành các bước chuẩn bị (Supabase Storage bucket `trip-receipts`, Google OAuth Staging callback, và Vercel preview deployment).

### Nguyên tắc an toàn tuân thủ:
- **Fail-Closed:** Dừng ngay trước mọi thao tác ghi dữ liệu nếu không thể vượt qua bước Preflight hoặc gặp rào cản truy cập.
- **Không xâm phạm Production:** Tuyệt đối không kết nối `fzdaasbckmnndqzqopex`.
- **Không tự ý sửa hạ tầng:** Không tự ý can thiệp database, không chạy migration, không thay đổi RLS/Storage policies.
- **Bảo toàn dữ liệu cũ:** Giữ nguyên trạng thái `PRESERVE` của các bản ghi Gate 4B; không xóa bất kỳ dữ liệu lịch sử nào.
- **Bảo mật secrets:** Không in mật khẩu, connection strings, session cookies hay token.

---

## 2. Giai đoạn A — Kết quả Preflight Deployment & Environment

| Bước kiểm tra | Phương thức thực hiện | Kết quả ghi nhận | Trạng thái |
| :--- | :--- | :--- | :---: |
| **A1. Working Tree & Git Status** | `git status` | Nhánh hiện tại: `staging/release-1-preview` (trùng khớp với remote `origin/staging/release-1-preview` tại commit `7080808`). Working tree bảo toàn nguyên vẹn. | **`PASS`** |
| **A2. HTTPS Domain Reachability** | `curl.exe -I https://staging.tungcloud.online` | Kết nối thành công qua HTTPS tới edge Vercel (`Server: Vercel`, `X-Vercel-Id: hkg1::...`). | **`PASS`** |
| **A3. Vercel Deployment Access** | HTTP Request & Browser Subagent | Máy chủ Vercel trả về `HTTP 302 Found` chuyển hướng tới `https://vercel.com/sso-api?url=...` và tiếp tục chuyển hướng tới `https://vercel.com/login` (Màn hình đăng nhập Vercel SSO / Team Login). | **`BLOCKED`** |
| **A4. Xác minh Biến môi trường Cục bộ** | Node.js script an toàn (không in secret) | Xác nhận `DATABASE_URL` trỏ đúng Staging `rwvptwjpfhtfkiwboexz` (true), không trỏ Production `fzdaasbckmnndqzqopex` (false). Các biến auth, crypto, pooler đều hiện diện. | **`PASS`** (Local) |
| **A5. Xác minh Runtime trên Remote Staging** | Gọi API `/api/me` trên domain | Trả về `HTTP 302 Found -> https://vercel.com/sso-api?url=https%3A%2F%2Fstaging.tungcloud.online%2Fapi%2Fme`. Toàn bộ API bị chặn bởi cổng bảo vệ Vercel SSO. | **`BLOCKED`** |

### Phát hiện chẩn đoán quan trọng (Root Cause Analysis):
- **Vấn đề:** Dự án Vercel đang bật tính năng **Vercel Authentication (Deployment Protection)** cho các Preview Deployments.
- **Hệ quả trực tiếp:**
  1. Trình duyệt hoặc API client bên ngoài không thể tải ứng dụng Smart Trip (`/`, `/login`, `/trips`) mà bị ép đăng nhập tài khoản Vercel trước.
  2. Luồng **Google OAuth** hoàn toàn bị chặn: Khi Google chuyển hướng về callback `https://staging.tungcloud.online/api/auth/callback/google`, Vercel SSO sẽ chặn và chuyển hướng tiếp sang `vercel.com/login`, làm mất authorization code của Google.
  3. Mọi endpoint REST API (`/api/*`) đều trả về mã HTTP 302 redirect thay vì phản hồi JSON.

---

## 3. Bảng Kết quả Chi tiết Từng Hạng mục & Endpoint

| Nhóm Kiểm thử | Hạng mục / Endpoint | Kỳ vọng | Kết quả Thực tế | Trạng thái |
| :--- | :--- | :--- | :--- | :---: |
| **Giai đoạn A** | `GET /` & `GET /login` | Tải trang giao diện đăng nhập Smart Trip | HTTP 302 chuyển hướng sang `vercel.com/login` (Vercel SSO) | **`BLOCKED`** |
| **Giai đoạn A** | `GET /api/me` | 401 Unauthorized (khi chưa đăng nhập) | HTTP 302 chuyển hướng sang `vercel.com/login` | **`BLOCKED`** |
| **Giai đoạn B** | Google OAuth Flow (Host) | Mở Google Sign-In -> Callback -> Cấp Session | Không thể kích hoạt; bị Vercel Authentication chặn trước | **`BLOCKED`** |
| **Giai đoạn B** | Google OAuth Flow (Member) | Mở Google Sign-In -> Callback -> Cấp Session | Không thể kích hoạt; bị Vercel Authentication chặn trước | **`BLOCKED`** |
| **Giai đoạn B** | Callback `/api/auth/callback/google` | Xử lý code, thiết lập session cookie | Chưa thể nhận callback từ Google | **`BLOCKED`** |
| **Giai đoạn B** | Đọc Session `/api/me` | Trả về thông tin user đã đăng nhập | Bị chặn bởi cổng Vercel SSO | **`BLOCKED`** |
| **Giai đoạn C** | Khởi tạo Bộ dữ liệu `SMOKE-STAGING-3ZU-` | Tạo Trip mới, Expense, Member trên Staging | Dừng an toàn theo nguyên tắc Fail-Closed (không có session) | **`NOT RUN`** |
| **Giai đoạn D1** | Quản lý Chuyến đi (Host tạo trip, invite) | Host tạo trip, member xem trip | Chưa có phiên đăng nhập | **`NOT RUN`** |
| **Giai đoạn D2** | QR Code Mời & Tham gia (`/join/[code]`) | Hiển thị QR, đổi invite code | Chưa có phiên đăng nhập | **`NOT RUN`** |
| **Giai đoạn D3** | Quy trình Yêu cầu Nhận diện (Claims Flow) | Gửi claim, Host duyệt claim | Chưa có phiên đăng nhập | **`NOT RUN`** |
| **Giai đoạn D4** | Hồ sơ Cá nhân & Bảo mật STK Ngân hàng | Đọc profile, kiểm tra che giấu STK | Chưa có phiên đăng nhập | **`NOT RUN`** |
| **Giai đoạn E** | Lưu trữ Hóa đơn UC32 (`trip-receipts`) | Upload ảnh, Magic Bytes, xem qua Proxy | Chưa có phiên đăng nhập | **`NOT RUN`** |
| **Giai đoạn F** | Quyết toán & VietQR UC18 (`payment-info`) | Tạo settlement, cấp VietQR EMVCo | Chưa có phiên đăng nhập | **`NOT RUN`** |
| **Giai đoạn F** | Quét VietQR bằng App Ngân hàng Thật | Nhận diện đúng BIN, STK, số tiền, memo | Chưa tạo dữ liệu E2E trên remote | **`NOT VERIFIED`** |
| **Giai đoạn G** | Đóng sổ & Lưu trữ Chuyến đi (Archive) | Host archive trip, kiểm tra phân quyền | Chưa có dữ liệu thử nghiệm | **`NOT RUN`** |

---

## 4. Dữ liệu Kiểm thử & Tính Toàn vẹn Hệ thống

1. **Dữ liệu mới tạo trong Phase 3ZU:**
   - **Không có bất kỳ thực thể nào được tạo mới** trên cơ sở dữ liệu Staging hoặc Supabase Storage trong phiên này.
   - Nguyên tắc **Fail-Closed** được kích hoạt ngay khi phát hiện rào cản truy cập Vercel SSO, ngăn ngừa việc ghi dữ liệu rác không được quản lý phiên.
2. **Bảo toàn dữ liệu lịch sử Gate 4B Staging (`rwvptwjpfhtfkiwboexz`):**
   - Trip `9a2f7637-0024-4457-952e-eebdb489839e`
   - Host `8af8707c-8804-43b2-ae28-719e31451a67`, Member `37b1f7cf-aad6-433c-a25e-242c11bada8a`
   - Toàn bộ dữ liệu lịch sử được **BẢO TOÀN NGUYÊN VẸN (`PRESERVE`)**, không bị can thiệp hay xóa bỏ.
3. **Bảo toàn cơ sở dữ liệu Production (`fzdaasbckmnndqzqopex`):**
   - Hoàn toàn nằm ngoài phạm vi; không có bất kỳ kết nối mạng hay truy vấn nào hướng tới Production.

---

## 5. Bằng chứng Trực quan Đã Thu thập (Artifacts)

Hai artifact chứng minh việc truy cập domain bị chặn bởi màn hình đăng nhập Vercel SSO đã được lưu trữ trong thư mục artifacts của phiên làm việc:
1. **Ảnh chụp màn hình:** `vercel_login_screen_1792903062162.png`  
   - Ghi nhận màn hình đăng nhập Vercel tại URL `https://vercel.com/login?next=...` với tiêu đề *"Log in to Vercel"*.
2. **Bản ghi thao tác trình duyệt:** `staging_preflight_check_1792903034711.webp`  
   - Ghi lại toàn bộ quá trình trình duyệt tự động chuyển hướng từ `https://staging.tungcloud.online` sang Vercel SSO gateway.

---

## 6. Các Hành động Cần thiết từ Chủ dự án trên Dashboard (Action Items to Unblock)

Để gỡ bỏ rào cản và cho phép thực thi E2E thành công trên domain `https://staging.tungcloud.online`, Chủ dự án cần thực hiện các thao tác sau:

### 6.1. Tắt Vercel Authentication trên Vercel Dashboard (Bắt buộc)
1. Đăng nhập vào [Vercel Dashboard](https://vercel.com).
2. Chọn dự án `smart-trip` (hoặc tên dự án tương ứng).
3. Vào **Settings** -> **Deployment Protection**.
4. Tại mục **Vercel Authentication**:
   - Chuyển trạng thái từ **Enabled** sang **Disabled** đối với Preview Deployments (hoặc cấu hình cho phép truy cập công khai trên custom domain `staging.tungcloud.online`).
   - *Hoặc cấu hình:* Bật chế độ "Protection Bypass for Automation" và cung cấp secret bypass header/token nếu muốn giữ bảo vệ nhưng cho phép bot kiểm thử truy cập.
5. Lưu cấu hình.

### 6.2. Kiểm tra lại Google Cloud Console OAuth 2.0 Credentials
Đảm bảo Client ID Google OAuth dành cho Staging đã khai báo chính xác:
- **Authorized JavaScript origins:** `https://staging.tungcloud.online`
- **Authorized redirect URIs:** `https://staging.tungcloud.online/api/auth/callback/google`
- **Test Users:** 2 tài khoản Google kiểm thử (1 Host, 1 Member) đã được thêm vào danh sách kiểm thử trong màn hình OAuth Consent Screen.

---

## 7. Kết luận & Trạng thái Đạt được

- **Kết luận:** Môi trường Staging đã được triển khai lên Vercel và trỏ domain thành công, tuy nhiên **ĐANG BỊ NGHẼN BỞI RÀO CẢN VERCEL DEPLOYMENT PROTECTION**.
- **Quy tắc an toàn:** Hệ thống dừng lại đúng theo kịch bản an toàn, không phát sinh lỗi dữ liệu và không rò rỉ thông tin mật.
- **Bước tiếp theo:** Sau khi Chủ dự án hoàn tất thao tác tắt Vercel Authentication tại mục 6.1, Phase 3ZU có thể được kích hoạt lại để tiến hành kiểm thử các luồng nghiệp vụ E2E từ Giai đoạn B đến Giai đoạn G.
