# Smart Trip & Expense Planner — Release 1 Staging Verification Runbook

> **Tài liệu:** Hướng dẫn kiểm thử và xác minh trên môi trường Staging (Release 1)<br />
> **Trạng thái:** DỰ THẢO TRÌNH DUYỆT (PLAN ONLY — CHƯA THỰC THI TRÊN MÔI TRƯỜNG THẬT)<br />
> **Mục đích:** Quy trình từng bước chuẩn hóa để kiểm toán viên và người quản lý dự án rà soát, phê duyệt trước khi tiến hành triển khai và kiểm thử thực tế trên hệ thống Staging.

---

## 1. Nguyên tắc an toàn & Ranh giới bắt buộc

> [!CAUTION]
> **CẢNH BÁO AN TOÀN TUYỆT ĐỐI VỀ DỰ ÁN SUPABASE:**
> - Tuyệt đối **KHÔNG ĐƯỢC PHÉP** sử dụng Project Ref của môi trường Production (`fzdaasbckmnndqzqopex`) cho bất kỳ thao tác nào trong runbook này.
> - Môi trường Staging bắt buộc phải sử dụng một Supabase Project độc lập hoàn toàn với database, storage, và authentication riêng biệt.
> - Trước khi thực hiện bất kỳ lệnh nào, phải chạy bước kiểm tra Read-Only để đối chiếu `project_ref`. Nếu phát hiện trùng với Production, **DỪNG NGAY LẬP TỨC**.

### 1.1. Phân định rõ ràng 3 trạng thái kiểm chứng
Mọi nhận định về cấu hình, migration, schema và dữ liệu trong runbook phải tuân thủ nghiêm ngặt 3 mức độ xác minh:
1. **VERIFIED (Đã xác minh):** Trạng thái đã được kiểm chứng trực tiếp thông qua truy vấn chỉ đọc hoặc lệnh kiểm tra thực tế trong phiên làm việc hiện hành, có kết quả đầu ra rõ ràng.
2. **HISTORICALLY REPORTED (Đã ghi nhận trong lịch sử):** Trạng thái được mô tả hoặc ghi nhận trong các báo cáo, tài liệu thiết kế hoặc manifest chạy thử trước đó. Bằng chứng lịch sử này có giá trị tham khảo quan trọng nhưng **không thay thế** việc xác minh trực tiếp trên remote hiện tại.
   - *Phân loại Gate runs lịch sử:*
     - **Disqualified (Bị loại khỏi bằng chứng Staging):** Các run ngày 2026-10-23 (`0883d2f9-...`, `dfaf7ff8-...`, `f2ac32e7-...`) được ghi nhận trước Phase 3Y, gắn với database dev ban đầu sau này được xác định là Production (`fzdaasbckmnndqzqopex`), hoặc artifact tự thân không chứa target metadata. Tuyệt đối không dùng các run này làm bằng chứng Staging.
     - **Accepted Historical Staging Runs (Bằng chứng lịch sử Staging hợp lệ):** Gate 4A (`a8c68239-4eee-4eb4-905d-4330d3783119`) và Gate 4B (`243c2fee-678b-47a0-9a17-8f3370e46d3f`) ngày 2026-10-24 được bảo vệ bởi Orchestrator Allowlist hướng tới Staging (`rwvptwjpfhtfkiwboexz`) và chặn Production (`fzdaasbckmnndqzqopex`).
     - **Giới hạn bằng chứng:** Ngay cả với các run Staging hợp lệ, việc các bảng từng hoạt động trong quá khứ **KHÔNG chứng minh** bảng `_prisma_migrations` trên database Staging hiện tại đã ghi nhận các migration tương ứng.
3. **NOT VERIFIED (Chưa xác minh):** Chưa có bằng chứng thực nghiệm trực tiếp trong phiên hiện hành và không đủ cơ sở lịch sử đáng tin cậy. Tuyệt đối không tự suy luận thành PASS.

### 1.2. Nguyên tắc an toàn Migration & Database
- **File migration trong repository KHÔNG đồng nghĩa với trạng thái remote:** Sự tồn tại của file migration tại `prisma/migrations/` chỉ thể hiện mã nguồn cục bộ. Không coi việc file tồn tại là bằng chứng migration đã chạy, và ngược lại, không coi file mới tạo là remote chưa có schema tương ứng.
- **KHÔNG mặc định chạy toàn bộ migrations:** Tuyệt đối không chạy `prisma migrate deploy` một cách mù quáng. Bắt buộc phải thực hiện bước kiểm tra Preflight chỉ đọc đối với bảng `_prisma_migrations` và schema hiện hữu trước khi đưa ra bất kỳ quyết định nào.
- **Nếu Schema tồn tại nhưng Migration History không khớp -> DỪNG NGAY:** Nếu bảng/cột nghiệp vụ đã tồn tại trong database nhưng bảng `_prisma_migrations` bị trống hoặc thiếu bản ghi, phải **DỪNG ĐIỀU TRA NGAY LẬP TỨC**. Tuyệt đối không chạy `migrate deploy` (tránh lỗi xung đột schema `relation already exists`), không tự ý sửa trạng thái migration, không chạy `migrate reset` hay `db push`, và không tự đánh dấu migration là đã áp dụng.
- **Phân tách biểu tượng thao tác:**
  - 🔍 **[READ-ONLY]**: Truy vấn chỉ đọc an toàn, không làm thay đổi trạng thái hệ thống.
  - ⚙️ **[INFRA/CONFIG]**: Thiết lập cấu hình hạ tầng hoặc biến môi trường.
  - ⚠️ **[MUTATION]**: Thao tác có ghi dữ liệu hoặc áp dụng thay đổi (cần phê duyệt riêng).

---

## 2. Quy trình thực hiện chi tiết (12 Bước Chuẩn hóa)

### Bước 1: Kiểm tra Git & Chuẩn bị bản phát hành (Release Candidate) 🔍

1. Xác nhận branch và commit hash chuẩn bị phát hành:
   ```bash
   git status --short
   git log -n 1 --oneline
   ```
2. Đảm bảo toàn bộ working tree sạch và đã vượt qua kiểm tra cục bộ:
   ```bash
   npx tsc --noEmit
   npm run lint
   npm test
   ```
3. Tạo tag đánh dấu phiên bản thử nghiệm (Ví dụ: `v0.1.0-rc1`):
   ```bash
   git tag -a v0.1.0-rc1 -m "Release Candidate 1 for Staging Verification"
   ```

---

### Bước 2: Xác nhận định danh dự án Staging (Chống nhầm Production) 🔍

1. Kiểm tra biến môi trường kết nối database trên môi trường triển khai Staging:
   - URL kết nối: `postgres://postgres.[STAGING_PROJECT_REF]:***@aws-0-[REGION].pooler.supabase.com:6543/postgres`
   - Xác minh `[STAGING_PROJECT_REF] !== "fzdaasbckmnndqzqopex"`.
2. 🔍 **[READ-ONLY]** Chạy truy vấn xác nhận tên database và định danh dự án:
   ```sql
   SELECT current_database(), inet_server_addr(), inet_server_port();
   ```
   *Tiêu chí đạt:* Kết quả trả về thuộc cụm máy chủ Staging được chỉ định, không trùng với Production.

---

### Bước 3: Preflight Đối chiếu Schema & Áp dụng Migrations có kiểm soát 🔍 ⚠️

> [!IMPORTANT]
> **BỐI CẢNH ĐỐI CHIẾU LỊCH SỬ & PHÂN LOẠI RUNS:**
> - **Các Gate runs cũ bị loại bỏ khỏi bằng chứng Staging:** Các run ngày 2026-10-23 (`0883d2f9-...`, `dfaf7ff8-...`, `f2ac32e7-...`) thuộc về môi trường tiền-Phase 3Y (`smart-trip-dev-sg` / Production `fzdaasbckmnndqzqopex`), hoặc artifact tự thân không chứa target metadata. Do đó, các run này bị **LOẠI BỎ HOÀN TOÀN** khỏi bằng chứng Staging.
> - **Các Gate runs Staging hợp lệ:** Gate 4A (`a8c68239-4eee-4eb4-905d-4330d3783119`) và Gate 4B (`243c2fee-678b-47a0-9a17-8f3370e46d3f`) thực hiện ngày 2026-10-24 được bảo vệ bởi Orchestrator Allowlist hướng tới Staging (`rwvptwjpfhtfkiwboexz`) và chặn Production (`fzdaasbckmnndqzqopex`). Đây là bằng chứng lịch sử xác nhận 16 bảng nghiệp vụ, cột thời gian lịch trình và luồng quyết toán đã từng hoạt động trên Staging.
> - **Giới hạn bằng chứng:** Mặc dù Gate 4B đã hoàn thành 44 operations nghiệp vụ thành công trên Staging, điều này **KHÔNG chứng minh** bảng `_prisma_migrations` trên database Staging hiện tại đã ghi nhận đầy đủ 3 migration files.
> Vì vậy, **KHÔNG ĐƯỢC MẶC ĐỊNH CHẠY CẢ 3 MIGRATION, CŨNG KHÔNG ĐƯỢC COI LÀ ĐÃ ĐƯỢC XÁC MINH TRÊN DATABASE REMOTE**. Bắt buộc phải thực hiện bước kiểm tra Preflight chỉ đọc dưới đây trước khi đưa ra bất kỳ quyết định can thiệp nào.

#### 3.1. 🔍 [READ-ONLY] Preflight Kiểm tra Bảng `_prisma_migrations`
Chạy truy vấn kiểm tra toàn bộ lịch sử migration đã ghi nhận trên target database:
```sql
SELECT id, migration_name, finished_at, rolled_back_at, applied_steps_count
FROM _prisma_migrations
ORDER BY finished_at DESC;
```

#### 3.2. 🔍 [READ-ONLY] Preflight Kiểm tra Thực thể Schema Hiện hữu
1. **Kiểm tra sự tồn tại của 16 bảng nghiệp vụ Release 1:**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
     AND table_name IN (
       'users', 'accounts', 'sessions', 'verifications',
       'trips', 'trip_members', 'member_claims', 'bank_claim_snapshots',
       'itinerary_items', 'expenses', 'expense_shares', 'expense_items',
       'expense_item_members', 'settlements', 'settlement_transfers', 'rate_limits'
     );
   ```
2. **Kiểm tra cột mở rộng thời gian của lịch trình (Migration 0003):**
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND table_name = 'itinerary_items'
     AND column_name IN ('start_time', 'end_time');
   ```
3. **Kiểm tra trạng thái kích hoạt Row-Level Security (Migration 0002):**
   ```sql
   SELECT relname, relrowsecurity
   FROM pg_class
   JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
   WHERE pg_namespace.nspname = 'public'
     AND relname IN ('users', 'trips', 'expenses', 'member_claims');
   ```
4. **Kiểm tra thu hồi quyền truy cập trực tiếp của `anon` và `authenticated` (Migration 0002) — [KẾ HOẠCH TRUY VẤN CHỈ ĐỌC / CHƯA THỰC THI (NOT VERIFIED)]:**
   ```sql
   SELECT grantee, table_name, privilege_type
   FROM information_schema.role_table_grants
   WHERE table_schema = 'public'
     AND grantee IN ('anon', 'authenticated')
     AND table_name IN (
       'users', 'accounts', 'sessions', 'verifications',
       'trips', 'trip_members', 'member_claims', 'bank_claim_snapshots',
       'itinerary_items', 'expenses', 'expense_shares', 'expense_items',
       'expense_item_members', 'settlements', 'settlement_transfers', 'rate_limits',
       '_prisma_migrations'
     );
   ```
   *Tiêu chí đạt khi chạy:* Trả về **0 dòng**. Toàn bộ quyền `SELECT`, `INSERT`, `UPDATE`, `DELETE` trên bảng nghiệp vụ phải bị thu hồi hoàn toàn khỏi các vai trò client-facing của PostgREST.
5. **Kiểm tra RLS Policies trên Schema `public` — [KẾ HOẠCH TRUY VẤN CHỈ ĐỌC / CHƯA THỰC THI (NOT VERIFIED)]:**
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd
   FROM pg_policies
   WHERE schemaname = 'public';
   ```
   *Tiêu chí đạt khi chạy:* Không có policy nào cấp quyền mở công khai (`USING (true)`) cho role `anon` trên các bảng nghiệp vụ.

#### 3.3. Cây quyết định đối chiếu (Decision Tree)
Sau khi có kết quả từ mục 3.1 và 3.2, phân loại vào đúng kịch bản xử lý:

- **Kịch bản A: Schema & Migrations đã đồng bộ hoàn chỉnh (VERIFIED SYNCED)**
  - *Điều kiện:* Bảng `_prisma_migrations` đã ghi nhận đủ cả 3 migration (`0001_release1_schema`, `0002_data_api_lockdown`, `0003_add_itinerary_time_fields`) với `finished_at IS NOT NULL` và `rolled_back_at IS NULL`.
  - *Hành động:* **KHÔNG chạy `npx prisma migrate deploy`**. Đánh dấu migration là VERIFIED và chuyển thẳng sang Bước 4.
- **Kịch bản B: Schema đã tồn tại nhưng `_prisma_migrations` không khớp (DESYNCHRONIZED — NGUY CƠ CAO)**
  - *Điều kiện:* Các bảng nghiệp vụ hoặc cột `start_time`, `end_time` đã tồn tại trong schema (do lịch sử Gate 4B `243c2fee` hoặc khởi tạo trước đó), NHƯNG bảng `_prisma_migrations` không có bản ghi hoặc thiếu một phần.
  - *Hành động:* **DỪNG NGAY LẬP TỨC (ABORT & INVESTIGATE)**:
    - **CẤM** chạy `npx prisma migrate deploy` vì Prisma sẽ cố gắng thực hiện lại các câu lệnh `CREATE TABLE` / `ADD COLUMN`, gây lỗi crash `relation already exists` hoặc `column already exists`.
    - **CẤM** chạy `prisma migrate reset` hoặc `prisma db push` theo suy đoán.
    - **CẤM** tự ý chạy `prisma migrate resolve` hoặc chèn trực tiếp bản ghi vào `_prisma_migrations` khi chưa có phương án được phê duyệt từ Lead DBA / Tech Lead.
    - Lập báo cáo hiện trạng chi tiết gửi Tech Lead để quyết định quy trình đồng bộ thủ công có kiểm soát.
- **Kịch bản C: Database Staging mới hoàn toàn (CLEAN DATABASE)**
  - *Điều kiện:* Chưa có 16 bảng nghiệp vụ trong schema và `_prisma_migrations` chưa có bản ghi nào.
  - *Hành động:* Trình duyệt kết quả preflight. Chỉ khi có văn bản phê duyệt riêng mới chạy:
    ```bash
    # Sử dụng DIRECT_URL (cổng 5432 của session pooler hoặc direct)
    npx prisma migrate deploy
    ```
    Sau đó thực hiện lại bước 3.1 để xác nhận toàn bộ 3 migration chuyển sang trạng thái thành công.
- **Kịch bản D: Migration bị lỗi dở dang (FAILED MIGRATION)**
  - *Điều kiện:* Có bản ghi với `rolled_back_at IS NOT NULL` hoặc `finished_at IS NULL`.
  - *Hành động:* **DỪNG NGAY LẬP TỨC**, trích xuất log lỗi của migration cụ thể và báo cáo Tech Lead. Không tự ý chạy lại lệnh.

---

### Bước 4: Kiểm tra Cấu hình Private Bucket `trip-receipts` ⚙️ 🔍

1. Trên Supabase Dashboard (Staging Project `rwvptwjpfhtfkiwboexz`) -> Storage -> Buckets:
   - Kiểm tra sự tồn tại của bucket `trip-receipts`.
   - 🔍 **[READ-ONLY]** Xác nhận thuộc tính: **Public Bucket: OFF** (Private).
2. Kiểm tra Storage Policies trên bảng `storage.objects`:
   - Đảm bảo **KHÔNG** có policy cấp quyền `SELECT` công khai cho role `anon` hoặc `authenticated`.
   - Quyền truy cập upload và đọc hoàn toàn thông qua Service Role Key từ Route Handler phía server (`src/lib/storage/receipts.ts`).
   - Client tuyệt đối không gọi trực tiếp API Supabase Storage; mọi tương tác đọc/ghi đi qua server proxy `/api/trips/[id]/receipts`.
3. Cấu hình CORS của Bucket:
   - Cho phép các method: `GET`, `POST`, `HEAD`.
   - Allowed Origins: Domain của môi trường Staging (ví dụ: `https://staging.smarttrip.vn` và `http://localhost:3000`).
4. Kiểm tra giới hạn tập tin và tính toàn vẹn:
   - Dung lượng tối đa: `RECEIPT_MAX_SIZE_BYTES = 5242880` (5MB).
   - Định dạng hỗ trợ: JPEG, PNG, WebP (Kiểm tra Magic Bytes bắt buộc, không chỉ dựa vào đuôi file).


---

### Bước 5: Cấu hình Biến môi trường An toàn trên Hosting Provider ⚙️

> [!NOTE]
> **Phân định phạm vi xác minh:**
> Việc script local đã kiểm tra `DATABASE_URL` và `DIRECT_URL` trong file `.env` local trỏ tới `rwvptwjpfhtfkiwboexz` **KHÔNG ĐỒNG NGHĨA** với việc các biến môi trường trên nền tảng hosting Staging thật (Vercel / Railway / Docker) đã được thiết lập.
> Toàn bộ 12 biến môi trường trên hosting Staging hiện ở trạng thái **NOT VERIFIED** và cần được kiểm tra trực tiếp trên dashboard của hosting provider bằng phương thức không làm lộ giá trị secret.
> Domain `https://staging.smarttrip.vn` dưới đây là **VÍ DỤ (EXAMPLE PLACEHOLDER)**; domain thực tế sẽ do Chủ dự án chỉ định.

Thiết lập biến môi trường trên nền tảng hosting (Vercel / Railway / Docker Staging). Tuyệt đối phân định phạm vi biến:

| Tên biến | Phạm vi | Mô tả & Lưu ý an toàn | Trạng thái Hosting |
| :--- | :--- | :--- | :---: |
| `DATABASE_URL` | Server-only | Chuỗi kết nối Transaction Pooler (cổng 6543, `pgbouncer=true`) | NOT VERIFIED |
| `DIRECT_URL` | Server-only | Chuỗi kết nối Session Pooler (cổng 5432) cho Prisma Migrate | NOT VERIFIED |
| `BETTER_AUTH_SECRET` | Server-only | Chuỗi ngẫu nhiên tối thiểu 32 ký tự dùng ký session cookie | NOT VERIFIED |
| `BETTER_AUTH_URL` | Server & Client | URL gốc môi trường Staging (Ví dụ: `https://staging.smarttrip.vn`) | NOT VERIFIED |
| `NEXT_PUBLIC_APP_URL` | Client | URL gốc môi trường Staging (Ví dụ: `https://staging.smarttrip.vn`) | NOT VERIFIED |
| `GOOGLE_CLIENT_ID` | Client | Client ID Google OAuth ứng với domain Staging | NOT VERIFIED |
| `GOOGLE_CLIENT_SECRET` | Server-only | Client Secret Google OAuth ứng với domain Staging | NOT VERIFIED |
| `BANK_ENCRYPTION_KEY` | Server-only | Chuỗi hex 64 ký tự (256-bit AES-GCM). **CẤM** có tiền tố `NEXT_PUBLIC_` | NOT VERIFIED |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | URL dự án Supabase Staging (`https://[STAGING_REF].supabase.co`) | NOT VERIFIED |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only | Secret Key quản trị Supabase. **CẤM** có tiền tố `NEXT_PUBLIC_` | NOT VERIFIED |
| `SUPABASE_STORAGE_BUCKET` | Server-only | Đặt giá trị: `"trip-receipts"` | NOT VERIFIED |
| `RECEIPT_MAX_SIZE_BYTES` | Server-only | Đặt giá trị: `"5242880"` (5MB) | NOT VERIFIED |

---

### Bước 6: Cấu hình Google OAuth cho Domain Staging ⚙️

> [!NOTE]
> Domain Staging trong hướng dẫn là **VÍ DỤ (EXAMPLE PLACEHOLDER)**. Cần thay thế bằng domain thật khi triển khai.

1. Truy cập Google Cloud Console -> APIs & Services -> Credentials.
2. Chọn OAuth 2.0 Client ID dành cho Staging.
3. Cấu hình:
   - **Authorized JavaScript origins:** `https://staging.smarttrip.vn` *(thay bằng domain Staging thật)*
   - **Authorized redirect URIs:** `https://staging.smarttrip.vn/api/auth/callback/google` *(thay bằng domain Staging thật)*
4. Xác minh màn hình OAuth Consent Screen ở chế độ "Testing" hoặc "In Production". Nếu ở chế độ "Testing", bắt buộc phải thêm các tài khoản Google thử nghiệm vào danh sách Test Users.

---

### Bước 7: Kế hoạch Smoke Test có kiểm soát ⚠️

Chuẩn bị sẵn 2 tài khoản Google thử nghiệm (**TÀI KHOẢN ĐỀ XUẤT / REQUIRES OWNER ACTION — CHƯA ĐƯỢC XÁC NHẬN ĐÃ CẤU HÌNH**):
- **Tài khoản Host (Trưởng nhóm đề xuất):** `smarttrip.test.host@gmail.com`
- **Tài khoản Member (Thành viên đề xuất):** `smarttrip.test.member@gmail.com`

Quy ước đặt tên dữ liệu thử nghiệm để dễ cô lập và thu dọn:
- Tên chuyến đi: `[SMOKE-STAGING-YYYYMMDD] Chuyến đi Thử Nghiệm Đà Lạt`


---

### Bước 8: Kiểm tra Upload, Xem & Bảo mật Hóa đơn (UC32) 🔍 ⚠️

Thực hiện theo trình tự kịch bản kiểm thử:

1. **Upload hợp lệ:**
   - Dùng tài khoản Host đăng nhập -> Mở chuyến đi -> Thêm khoản chi.
   - Chọn ảnh chụp hóa đơn hợp lệ định dạng JPEG, dung lượng 1.5MB.
   - *Kỳ vọng:* Spinner uploading hiển thị -> Thông báo thành công -> Ảnh hiển thị preview bền vững -> Lưu khoản chi thành công.
2. **Kiểm tra từ chối file quá dung lượng:**
   - Chọn file ảnh có dung lượng 6MB (> 5MB).
   - *Kỳ vọng:* Hệ thống hiển thị thông báo lỗi "Dung lượng ảnh vượt quá giới hạn cho phép (5MB)" và chặn submit.
3. **Kiểm tra từ chối file giả mạo định dạng (Magic Bytes):**
   - Đổi tên một file text `test.txt` thành `fake.jpg` -> Upload.
   - *Kỳ vọng:* Server kiểm tra Magic Bytes và trả lỗi "Nội dung tập tin không phải là ảnh hợp lệ (chỉ hỗ trợ JPEG, PNG, WebP)".
4. **Kiểm tra phân quyền đọc ảnh qua Proxy:**
   - Lấy URL ảnh đã lưu (dạng `/api/trips/[id]/receipts/[fileId]`).
   - Mở trên trình duyệt với tài khoản Member thuộc chuyến đi -> *Kỳ vọng: 200 OK, ảnh hiển thị.*
   - Mở trên trình duyệt ẩn danh (chưa đăng nhập) -> *Kỳ vọng: 401 UNAUTHORIZED.*
   - Đăng nhập bằng tài khoản C (không thuộc chuyến đi) và mở URL -> *Kỳ vọng: 403 FORBIDDEN.*
5. **Kiểm tra không rò rỉ Secrets:**
   - Mở DevTools Network Tab -> Kiểm tra request headers và response body.
   - *Kỳ vọng:* Không có `SUPABASE_SERVICE_ROLE_KEY`, không có token bucket nội bộ, header trả về có `Cache-Control: private`.

---

### Bước 9: Kiểm tra QR Mời & Quét VietQR trên Thiết bị Thật 🔍

1. **Kiểm tra QR Chia sẻ lời mời (UC34):**
   - Trưởng nhóm mở modal "Chia sẻ mã mời".
   - Dùng camera điện thoại thật quét mã QR trên màn hình.
   - *Kỳ vọng:* Điện thoại nhận diện đúng đường dẫn `https://staging.smarttrip.vn/join/[invite_code]` và mở trang tham gia xem trước an toàn.
2. **Kiểm tra VietQR Thanh toán Đối soát (UC18):**
   - Thiết lập số nợ giữa Member và Host -> Thực hiện Chốt sổ công nợ.
   - Thành viên nợ bấm "Chuyển khoản / Xem mã VietQR".
   - Dùng ít nhất 2 ứng dụng ngân hàng thật (ví dụ: Vietcombank Digibank, Techcombank Mobile, MB Bank) quét mã QR hiển thị trên màn hình.
   - *Kỳ vọng:* Ứng dụng ngân hàng tự động điền chính xác:
     - Đúng Ngân hàng nhận (theo BIN).
     - Đúng Số tài khoản người nhận (đã giải mã an toàn từ server).
     - Đúng Số tiền nợ VND (chính xác từng đồng, không làm tròn sai).
     - Đúng Nội dung chuyển khoản (Memo chuẩn hóa: `ST [TRIP] [MEMBER]`).
   - *Lưu ý:* **DỪNG TẠI BƯỚC XEM THÔNG TIN; KHÔNG BẤM XÁC NHẬN CHUYỂN TIỀN THẬT.**

---

### Bước 10: Kiểm tra Partial Index `one_pending_claim` 🔍

Truy cập database Staging bằng công cụ truy vấn (Prisma Studio / psql / Supabase SQL Editor):

🔍 **[READ-ONLY]** Chạy truy vấn kiểm tra định nghĩa partial unique index:
```sql
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'member_claims'
  AND indexname = 'one_pending_claim';
```

*Tiêu chí đạt:*
- Trả về đúng 1 dòng.
- Cột `indexdef` chứa mệnh đề: `UNIQUE INDEX one_pending_claim ON public.member_claims USING btree (trip_id, "userId") WHERE (status = 'PENDING'::"ClaimStatus")` (hoặc `status = 'PENDING'`).

> [!NOTE]
> **Hiệu chỉnh đối chiếu kỹ thuật:** Trong bản thảo trước của runbook, tên cột bị nhầm lẫn thành `target_member_id`. Theo định nghĩa chuẩn trong `prisma/schema.prisma` và migration `0001_release1_schema/migration.sql`, index này được tạo trên cặp cột `(trip_id, "userId")`. Sự tồn tại của index này là **HISTORICALLY REPORTED** thông qua migration 0001, và việc chạy truy vấn chỉ đọc tại Bước 10 này sẽ chính thức xác nhận trạng thái **VERIFIED** trên hệ thống Staging.

---

### Bước 11: Kế hoạch Thu dọn Dữ liệu & Điều kiện Dừng Khẩn cấp ⚠️

1. **Kiểm kê & Bảo toàn Dữ liệu Thử nghiệm Gate 4B Staging:**
   - Dữ liệu Staging từ Gate 4B (`243c2fee-678b-47a0-9a17-8f3370e46d3f`):
     - Trip ID: `9a2f7637-0024-4457-952e-eebdb489839e` (Mã mời: `2R5MQ8-Y56BFG`, Trạng thái: `COMPLETED`).
     - Host User A: `8af8707c-8804-43b2-ae28-719e31451a67`, Member User B: `37b1f7cf-aad6-433c-a25e-242c11bada8a`.
     - Itinerary Item 2: `9659a447-87fe-4694-bbbc-6612d4ffbe12` (ACTIVE).
     - Expense 1: `45238596-b541-4f8f-890b-bba904e82ee8` (ACTIVE).
     - Settlement 2: `570ba092-6a79-4d2c-be2e-26c1f9fa9e9e`, Transfer 2: `70405483-4130-449f-821f-4367cf86cb9b` (PAID/COMPLETED).
   - **Trạng thái phân loại dữ liệu:**
     - Lịch sử tạo: **HISTORICALLY REPORTED CREATION** (Manifests và event logs bất biến của Gate 4B chứng minh đã tạo thành công trong quá khứ lúc chạy kiểm thử ngày 2026-10-24).
     - Hiện trạng thực tế trên database remote: **CURRENT EXISTENCE NOT VERIFIED** (Chưa thực hiện truy vấn `SELECT` trực tiếp trong phiên hiện tại để kiểm tra các bản ghi này có còn nguyên vẹn trên Staging hay không).
     - Chỉ thị an toàn: **`PRESERVE (BẢO TOÀN / KHÔNG TỰ Ý XÓA)`**.
   - **Quy tắc an toàn dữ liệu Production:**
     - Tuyệt đối **CẤM** xóa dữ liệu tiền-Phase 3Y trên instance Production (`fzdaasbckmnndqzqopex`, ví dụ: Trip `80ca42e2-383a-427d-a478-38f02e6fdbb8`). Đánh dấu toàn bộ là **`DO NOT TOUCH`**.
     - Dữ liệu thử nghiệm Gate 4B Staging nêu trên được bảo toàn phục vụ kiểm tra đối soát, chỉ dọn dẹp khi có văn bản phê duyệt riêng từ Product Owner / Tech Lead.
2. **Thu dọn dữ liệu sau các đợt kiểm thử mới:**
   - Xóa các chuyến đi có tiền tố `[SMOKE-STAGING-]` hoặc chuyển sang trạng thái `ARCHIVED`.
   - Vào Supabase Dashboard -> Storage -> `trip-receipts`: Xóa các object thuộc các trip kiểm thử đã tạo.
   - Xóa tài khoản thử nghiệm nếu không còn sử dụng.
3. **Điều kiện dừng khẩn cấp (Abort Conditions):**
   - Phát hiện database đang kết nối là Production (`fzdaasbckmnndqzqopex`).
   - Phát hiện schema đã có bảng nhưng `_prisma_migrations` không đồng bộ (Kịch bản B).
   - Lộ secret key, API key hoặc private token trong Network payload.
   - Migration thất bại hoặc xung đột schema không thể tự phục hồi.
   - Khi gặp điều kiện dừng: Ngắt kết nối ngay lập tức, ghi lại nhật ký lỗi, thông báo kênh kỹ thuật và không tiếp tục thao tác.

---

### Bước 12: Tiêu chí PASS/FAIL & Kế hoạch Rollback

#### Tiêu chí PASS (Đạt chuẩn nghiệm thu Staging):
- [ ] 100% các bước từ Bước 1 đến Bước 10 hoàn thành thành công.
- [ ] Migration và Schema đạt trạng thái **VERIFIED SYNCED** theo đúng Kịch bản A hoặc Kịch bản C đã qua phê duyệt.
- [ ] Google OAuth đăng nhập mượt mà, không gặp lỗi `redirect_uri_mismatch`.
- [ ] Upload hóa đơn lưu trữ bền vững, phân quyền đúng và không rò rỉ private object (UC32).
- [ ] Quét VietQR nhận diện chính xác 100% thông tin tài khoản và số tiền trên app ngân hàng thật (UC18).
- [ ] Mã QR mời chuyến đi mở đúng trang tham gia xem trước (UC34).
- [ ] Index `one_pending_claim` tồn tại chính xác trên database Staging với trạng thái **VERIFIED**.
- [ ] Không có lỗi runtime HTTP 500 phát sinh trong log của server.

#### Phương án Rollback khi FAIL:
1. **Lỗi ứng dụng / Frontend:** Revert về commit/tag ổn định trước đó trên Git và re-deploy hosting.
2. **Lỗi Lệch Migration / Schema:**
   - Tuyệt đối **CẤM** chạy `prisma migrate reset` (gây mất dữ liệu) hoặc `prisma db push` (gây phá vỡ tracking migration).
   - Nếu migration dở dang (`failed`): Phải có DBA điều tra nguyên nhân, xử lý triệt để trước khi dùng `prisma migrate resolve --rolled-back`.
3. **Lỗi Storage / Quyền riêng tư:** Tạm thời vô hiệu hóa Route Handler `/api/trips/[id]/receipts` qua cờ cấu hình biến môi trường hoặc chặn IP trên WAF.

#### Phê duyệt & Ký duyệt:
- **Người thực hiện kiểm thử:** `_______________________` (Ký & Ghi rõ họ tên)
- **Lead Engineer / Tech Lead:** `_______________________` (Phê duyệt kỹ thuật)
- **Product Owner:** `_______________________` (Nghiệm thu nghiệp vụ)

