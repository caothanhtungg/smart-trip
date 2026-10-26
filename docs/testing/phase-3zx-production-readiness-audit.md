# BÁO CÁO ĐÁNH GIÁ MỨC ĐỘ SẴN SÀNG SẢN XUẤT (PRODUCTION READINESS AUDIT)
## Phase 3ZX — Release 1 Production Readiness Audit

> **Thời điểm thực hiện audit:** 2026-10-25T21:05:00+07:00  
> **Nhánh Staging kiểm tra:** `staging/release-1-preview`  
> **HEAD Commit Staging:** `9377e27` (`9377e27b24545cc84986efcf5194d9a501dc783f`)  
> **Nhánh Production mục tiêu:** `main` (HEAD hiện tại: `8f7943c`)  
> **Môi trường Database Staging:** Supabase Staging (`rwvptwjpfhtfkiwboexz`) — Đã xác minh an toàn  
> **Môi trường Database Production mục tiêu:** Supabase Production (`fzdaasbckmnndqzqopex`) — Được bảo vệ nghiêm ngặt  
> **Ranh giới an toàn:** Hoàn toàn chỉ đọc (Read-only audit). Tuyệt đối không can thiệp, không ghi dữ liệu, không chạy migration hay thay đổi cấu hình Production; không in secrets hay thông tin nhạy cảm.

---

## 1. Trạng thái Git và Danh sách Commit Cần Phát hành

### 1.1. Định danh Commit và Nhánh
- **Nhánh hiện tại:** `staging/release-1-preview`.
- **Remote:** `origin` -> `https://github.com/caothanhtungg/smart-trip.git`.
- **Commit HEAD đã xác minh trên remote:**
  ```text
  9377e27b24545cc84986efcf5194d9a501dc783f fix(claims): handle duplicate membership during claim approval
  ```
- **Nhánh Production mục tiêu:** `main` (HEAD hiện tại trên remote: `8f7943c`).

### 1.2. Danh sách Commit trên Staging chuẩn bị phát hành lên `main`
Tổng cộng **6 commits** tích lũy toàn bộ tính năng và bản sửa lỗi Release 1 hiện có trên Staging nhưng chưa nằm trên `main`:

| STT | Commit SHA | Tóm tắt thông điệp commit | Phân hệ nghiệp vụ liên quan |
| :---: | :---: | :--- | :--- |
| 1 | `39f007c` | `wip(phase-3): prisma draft schema and db client (chưa duyệt)` | Khởi tạo cấu hình Prisma và database client |
| 2 | `73fa31d` | `chore: ignore generated prisma client, backups and agent folder` | Bổ sung `.gitignore` cho client sinh tự động |
| 3 | `0362551` | `chore(ui): remove out-of-scope content, phone and branch fields` | Loại bỏ các trường ngoài phạm vi Release 1 (phone, branch) |
| 4 | `7080808` | `feat(release-1): add backend APIs, auth, and staging setup` | Toàn bộ 21 Route Handlers backend, Better Auth, AES-256-GCM, VietQR, RLS |
| 5 | `cb554e6` | `fix(trips): enable real invite lookup, Google avatar support and join flow` | Sửa tra cứu mã mời thật, hỗ trợ ảnh đại diện Google OAuth, luồng tham gia |
| 6 | `9377e27` | `fix(claims): handle duplicate membership during claim approval` | Khắc phục xung đột Unique Constraint `(trip_id, user_id)` khi duyệt thành viên cũ đã rời (`LEFT`) |

**Thống kê thay đổi mã nguồn giữa `origin/main` và `origin/staging/release-1-preview`:**
- **175 files changed**, **42.037 insertions (+)**, **2.176 deletions (-)**.

### 1.3. Trạng thái Working Tree cục bộ
- **Staged:** 0 files (Index sạch, không có thay đổi nào trong hàng đợi commit).
- **Modified unstaged (3 files được bảo toàn):**
  - `PROJECT_CONTEXT.md`
  - `docs/phase-3-backend-plan.md`
  - `sodothietke/release1-erd.dbml`
- **Untracked files/folders (4 mục được bảo toàn):**
  - `docs/erd-changes-proposal.md`
  - `docs/release-1-staging-runbook.md`
  - `docs/testing/`
  - `scripts/`

---

## 2. Kết quả Kiểm tra Chất lượng Kỹ thuật (Quality Gates)

Toàn bộ các bộ kiểm tra tự động đã được thực thi trực tiếp trong phiên audit hiện hành:

| STT | Bộ kiểm tra | Lệnh thực thi | Kết quả | Chi tiết kết quả kiểm tra |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **Kiểm tra kiểu dữ liệu TypeScript** | `npx tsc --noEmit` | **PASS (Exit 0)** | 0 lỗi biên dịch tĩnh trên toàn bộ dự án (`strict: true`). |
| 2 | **Kiểm thử tự động toàn diện** | `npm test` | **PASS (Exit 0)** | **76/76 test files passed** (100%), **1.134/1.134 tests passed** (0 fail, 0 skipped). Bao gồm property-based tests 2.000 ca chia tiền và 1.000 ca rút gọn nợ. |
| 3 | **Kiểm tra chuẩn mã nguồn (Linter)** | `npm run lint` | **PASS (Exit 0)** | **0 lỗi**. Có 4 cảnh báo tham số không sử dụng trong các script kiểm thử offline (`gate-4a-orchestrator.ts`, `smoke-runner.ts`), không ảnh hưởng bundle ứng dụng. |
| 4 | **Kiểm tra định dạng & khoảng trắng Git** | `git diff --check` | **PASS (Exit 0)** | 0 lỗi whitespace, conflict marker hoặc trailing newline. |

---

## 3. Checklist Cấu hình Production (Read-Only Review)

> **Nguyên tắc an toàn:** Đánh giá dựa trên yêu cầu kiến trúc của hệ thống, không in giá trị bí mật và không yêu cầu cung cấp secrets. Các mục đòi hỏi kiểm tra trực tiếp trên bảng điều khiển bên thứ ba được ghi nhận chính xác là **NEEDS MANUAL VERIFICATION**.

### 3.1. Vercel Hosting & Production Environment

| STT | Hạng mục cấu hình | Mục đích & Yêu cầu kỹ thuật | Trạng thái đánh giá |
| :---: | :--- | :--- | :---: |
| 1 | **Production Branch** | Nhánh triển khai chính thức phải là `main`. Khi merge PR vào `main`, Vercel tự động build Production. | **NEEDS MANUAL VERIFICATION** |
| 2 | **Production Domain & SSL** | Cấu hình Custom Domain (ví dụ `https://smarttrip.vn` hoặc domain chính thức) kèm chứng chỉ SSL hợp lệ. | **NEEDS MANUAL VERIFICATION** |
| 3 | **`DATABASE_URL` (Production)** | Chuỗi kết nối PostgreSQL qua Supabase Transaction Pooler (Port 6543) trỏ tới project `fzdaasbckmnndqzqopex`. | **NEEDS MANUAL VERIFICATION** |
| 4 | **`DIRECT_URL` (Production)** | Chuỗi kết nối trực tiếp (Session Pooler Port 5432) phục vụ chạy migration an toàn. | **NEEDS MANUAL VERIFICATION** |
| 5 | **`BETTER_AUTH_SECRET`** | Khóa bí mật ngẫu nhiên tối thiểu 32 ký tự dùng mã hóa phiên đăng nhập cho Production. | **NEEDS MANUAL VERIFICATION** |
| 6 | **`BETTER_AUTH_URL` / `NEXT_PUBLIC_APP_URL`** | Khớp chính xác với URL gốc Production (ví dụ `https://smarttrip.vn`), không trỏ về staging hay localhost. | **NEEDS MANUAL VERIFICATION** |
| 7 | **`GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET`** | Bộ credentials Google OAuth 2.0 riêng biệt cho Production. | **NEEDS MANUAL VERIFICATION** |
| 8 | **`BANK_ENCRYPTION_KEY`** | Chuỗi hex 64 ký tự (256-bit) cho thuật toán mã hóa AES-256-GCM tài khoản ngân hàng trên server. | **NEEDS MANUAL VERIFICATION** |
| 9 | **`SUPABASE_URL` & `SUPABASE_SERVICE_ROLE_KEY`** | Endpoint API `https://fzdaasbckmnndqzqopex.supabase.co` và Service Role Key dùng cho Private Storage Proxy. | **NEEDS MANUAL VERIFICATION** |
| 10 | **`SUPABASE_STORAGE_BUCKET`** | Tên bucket hóa đơn: `trip-receipts` (chế độ Private). | **NEEDS MANUAL VERIFICATION** |
| 11 | **`DB_POOL_MAX`** | Đặt giá trị `1` cho môi trường Vercel Serverless để chống cạn kiệt connection pool. | **NEEDS MANUAL VERIFICATION** |

### 3.2. Supabase Production Project (`fzdaasbckmnndqzqopex`)

| STT | Hạng mục cấu hình | Mục đích & Yêu cầu kỹ thuật | Trạng thái đánh giá |
| :---: | :--- | :--- | :---: |
| 1 | **Project Ref Matching** | Xác nhận đúng mã định danh dự án Production `fzdaasbckmnndqzqopex`. | **PASS** (Đã xác minh phân lập với Staging `rwvptwjpfhtfkiwboexz`) |
| 2 | **Connection Pooling** | Kích hoạt Supavisor Pooling (Transaction Mode, port 6543). | **NEEDS MANUAL VERIFICATION** |
| 3 | **Private Storage Bucket** | Bucket `trip-receipts` được tạo với thuộc tính **Public: False** (chặn truy cập trực tiếp từ internet). | **NEEDS MANUAL VERIFICATION** |
| 4 | **Data API Lockdown (RLS)** | Kích hoạt Row-Level Security trên 16 bảng nghiệp vụ và thu hồi quyền từ `anon`/`authenticated` theo Migration 0002. | **NEEDS MANUAL VERIFICATION** (Thực hiện khi áp dụng migration) |
| 5 | **Backup & Point-in-time Recovery** | Bật sao lưu tự động hàng ngày (Daily Backups) hoặc PITR trên bảng điều khiển Supabase trước khi go-live. | **NEEDS MANUAL VERIFICATION** |

### 3.3. Google Cloud Console (Google OAuth 2.0)

| STT | Hạng mục cấu hình | Mục đích & Yêu cầu kỹ thuật | Trạng thái đánh giá |
| :---: | :--- | :--- | :---: |
| 1 | **Authorized JavaScript Origins** | Chứa chính xác URL gốc của Production (ví dụ `https://smarttrip.vn`). | **NEEDS MANUAL VERIFICATION** |
| 2 | **Authorized Redirect URIs** | Chứa chính xác endpoint callback: `https://[PRODUCTION_DOMAIN]/api/auth/callback/google`. | **NEEDS MANUAL VERIFICATION** |
| 3 | **OAuth Consent Screen** | Kiểm tra màn hình chấp thuận đã điền đầy đủ tên ứng dụng, email hỗ trợ, logo và các scopes cơ bản (`openid`, `email`, `profile`). | **NEEDS MANUAL VERIFICATION** |

---

## 4. Rà soát Migration và An toàn Triển khai

### 4.1. Danh mục các Migration Release 1 trong Repository
Trong thư mục `prisma/migrations/` hiện có **3 migration tuần tự**:

1. **`0001_release1_schema`**:
   - Khởi tạo 16 bảng nghiệp vụ Release 1 (`users`, `accounts`, `sessions`, `verifications`, `trips`, `trip_members`, `member_claims`, `bank_claim_snapshots`, `itinerary_items`, `expenses`, `expense_shares`, `expense_items`, `expense_item_members`, `settlements`, `settlement_transfers`, `rate_limits`).
   - Khởi tạo 9 Enums nghiệp vụ (`TripStatus`, `MemberRole`, `MemberStatus`, `ExpenseCategory`, `SplitMethod`, `SettlementStatus`, `TransferStatus`, `ClaimStatus`, `PaymentMethod`).
   - Tạo Partial Unique Index `one_pending_claim` trên `member_claims(trip_id, userId) WHERE status = 'PENDING'` (Rule R20).
   - Tạo các Unique Indexes bảo vệ tính toàn vẹn: `trip_members(trip_id, user_id)`, `trip_members(trip_id, display_name)`, `trips(invite_code)`.

2. **`0002_data_api_lockdown`**:
   - Kích hoạt Row-Level Security (RLS) trên toàn bộ 16 bảng nghiệp vụ và bảng `_prisma_migrations`.
   - Thu hồi toàn bộ quyền `DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE` từ vai trò `anon` và `authenticated` của Supabase PostgREST Data API.
   - *Mục tiêu bảo mật:* Triệt tiêu hoàn toàn bề mặt tấn công khai thác trực tiếp cơ sở dữ liệu qua REST API của Supabase bằng client-side anon key. Bắt buộc mọi truy cập dữ liệu phải đi qua Route Handlers của Next.js với đầy đủ kiểm tra session và phân quyền.

3. **`0003_add_itinerary_time_fields`**:
   - Bổ sung 2 cột thời gian `start_time` và `end_time` (kiểu `TIME(0)` nullable) cho bảng `itinerary_items`.
   - Đáp ứng hiển thị khung giờ chi tiết cho các hoạt động lịch trình.

### 4.2. Rủi ro Triển khai & Kế hoạch Phòng ngừa
- **Rủi ro xung đột Schema (Schema Drift):**
  - *Bối cảnh:* Trước Phase 3Y, instance Production `fzdaasbckmnndqzqopex` từng được dùng trong một số thử nghiệm ban đầu.
  - *Quy tắc an toàn tuyệt đối:* **CẤM** chạy `prisma migrate deploy` một cách tự động khi chưa thực hiện truy vấn Preflight chỉ đọc đối với bảng `_prisma_migrations` và schema hiện hữu trên Production.
  - Nếu bảng nghiệp vụ đã tồn tại nhưng `_prisma_migrations` trống $\rightarrow$ **DỪNG NGAY LẬP TỨC** để đối chiếu và căn chỉnh bằng lệnh baseline có kiểm soát (`prisma migrate resolve`).
  - Tuyệt đối **CẤM** chạy `prisma migrate reset` (gây mất dữ liệu) hoặc `prisma db push` (gây mất dấu lịch sử migration).
- **Kế hoạch Rollback:**
  - *Rollback Ứng dụng (Vercel):* Sử dụng tính năng Instant Rollback trên Vercel Dashboard để đưa deployment về bản build liền trước chỉ trong vài giây.
  - *Rollback Database:* Tạo bản sao lưu thủ công (Manual Snapshot / Dump) trên Supabase trước khi chạy bất kỳ câu lệnh DDL nào.

---

## 5. Bảng Phân loại Blocker (Blocker Matrix)

| Mức độ | Mã Blocker | Mô tả chi tiết | Hành động cần thực hiện trước Go-Live | Trách nhiệm |
| :---: | :---: | :--- | :--- | :---: |
| **CRITICAL** | **BLK-01** | Biến môi trường Production trên Vercel chưa được cấu hình hoặc chưa đối chiếu. | Truy cập Vercel Dashboard $\rightarrow$ Settings $\rightarrow$ Environment Variables (Scope: Production) $\rightarrow$ Khai báo đầy đủ 11 biến môi trường độc lập của Production. | Product Owner / DevOps |
| **CRITICAL** | **BLK-02** | Google OAuth Callback URL của domain Production chưa được kích hoạt. | Thêm `https://[PRODUCTION_DOMAIN]/api/auth/callback/google` vào Google Cloud Console. | Tech Lead / Admin |
| **CRITICAL** | **BLK-03** | Trạng thái schema và migration trên database Production (`fzdaasbckmnndqzqopex`) chưa được Preflight. | Chạy truy vấn chỉ đọc kiểm tra bảng `_prisma_migrations` trên Production trước khi apply DDL. | Lead Engineer |
| **HIGH** | **BLK-04** | Chưa tạo bản sao lưu Snapshot trên Supabase Production trước giờ phát hành. | Bấm tạo Manual Backup trên Supabase Dashboard trước khi bắt đầu triển khai. | Lead Engineer |
| **HIGH** | **BLK-05** | Bucket `trip-receipts` trên Supabase Production chưa được xác nhận tạo ở chế độ Private. | Tạo bucket `trip-receipts` (Public: False) trên Supabase Production Storage. | Lead Engineer |
| **MEDIUM** | **BLK-06** | 4 warnings linter còn tồn tại trong scripts kiểm thử offline. | Không ảnh hưởng đến production build nhưng nên dọn dẹp ở chu kỳ bảo trì đầu tiên sau release. | Development Team |
| **LOW** | **BLK-07** | Thiết lập giám sát cảnh báo lỗi runtime sau triển khai. | Theo dõi Vercel Runtime Logs và Supabase Database Metrics trong 24h đầu sau go-live. | Team Vận hành |

---

## 6. Danh sách Việc Cần Hoàn thành Trước Khi Phát hành (Go-Live Playbook)

Quy trình 8 bước tuần tự để phát hành Release 1:

1. **[Dashboard Vercel]** Nhập toàn bộ biến môi trường phạm vi Production (xem mục 3.1).
2. **[Google Cloud Console]** Cập nhật Authorized Origins và Redirect URIs cho domain Production (xem mục 3.3).
3. **[Dashboard Supabase]** Tạo bản sao lưu thủ công (Manual Snapshot) trên project `fzdaasbckmnndqzqopex`.
4. **[Dashboard Supabase]** Tạo Private Storage Bucket `trip-receipts`.
5. **[Database Preflight]** Chạy truy vấn chỉ đọc kiểm tra bảng `_prisma_migrations` và schema trên Production.
6. **[Database Migration]** Thực thi `prisma migrate deploy` có kiểm soát lên Production.
7. **[Git Release]** Tạo Pull Request từ `staging/release-1-preview` vào `main`, phê duyệt và merge để Vercel tự động kích hoạt Production Deployment.
8. **[Production Smoke Test]** Mở domain Production, đăng nhập bằng tài khoản Google thật, tạo chuyến đi thử nghiệm và xác nhận hệ thống hoạt động ổn định.

---

## 7. Kết luận Đánh giá Mức độ Sẵn sàng

### Trạng thái: `RELEASE REVIEW READY` (Về mặt Kỹ thuật & Mã nguồn)
### Khuyến nghị: `HOLD FOR MANUAL DASHBOARD PRE-CHECKS` (Chờ hoàn tất cấu hình bảng điều khiển)

### Lý do:
1. **Mã nguồn và Chất lượng:** Toàn bộ 175 files, 21 backend APIs, xác thực Better Auth, mã hóa AES-256-GCM, bảo mật RLS, thuật toán chốt sổ, đối soát công nợ, lưu trữ ảnh hóa đơn và VietQR EMVCo đều đã hoàn tất 100%. Đạt **1.134/1.134 tests PASS**, **0 lỗi TypeScript**, **0 lỗi Git diff**.
2. **Kiểm chứng thực tế:** Người dùng đã trực tiếp kiểm thử thành công trên môi trường Staging các luồng nghiệp vụ quan trọng: tạo chuyến đi, mời/tham gia, chi tiêu, hóa đơn, nhận diện thành viên (Claims), quyết toán và quét mã VietQR bằng app ngân hàng thật.
3. **Ranh giới an toàn:** Hệ thống cục bộ không được phép can thiệp trực tiếp vào các secrets hoặc dashboard của Production. Do đó, việc triển khai chính thức cần được tiếp tục sau khi người quản trị hoàn tất các bước cấu hình bảng điều khiển theo danh sách tại Mục 6.
