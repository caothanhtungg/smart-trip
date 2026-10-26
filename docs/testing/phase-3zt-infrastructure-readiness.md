# Phase 3ZT — Staging Infrastructure Readiness & Access Audit Report

> **Tài liệu:** Báo cáo kiểm toán & Đánh giá mức độ sẵn sàng hạ tầng Staging (Release 1)  
> **Phiên bản:** 1.1.0 (Hiệu chỉnh theo Phase 3ZT-R)  
> **Ngày:** 2026-10-24  
> **Trạng thái:** DỰ THẢO TRÌNH DUYỆT (AUDIT & READINESS REPORT — KHÔNG THAO TÁC TỪ XA)  
> **Dự án Staging Mục tiêu:** Supabase Project Ref `rwvptwjpfhtfkiwboexz` (Singapore `ap-southeast-1`)  
> **Dự án Production:** Supabase Project Ref `fzdaasbckmnndqzqopex` (**CẤM TRUY CẬP / OUT OF BOUNDS / DO NOT TOUCH**)  

---

## 1. Mục tiêu & Nguyên tắc An toàn

Báo cáo này tổng hợp kết quả kiểm toán hạ tầng chuẩn bị cho việc phát hành Release 1 trên môi trường Staging. Sau các phát hiện từ Phase 3ZS và Phase 3ZT, báo cáo được hiệu chỉnh tại Phase 3ZT-R nhằm loại bỏ hoàn toàn các nhận định suy đoán, phân định rạch ròi giữa bằng chứng lịch sử (artifacts), bằng chứng thực nghiệm trực tiếp (local queries), và các hạng mục chưa được xác minh trên môi trường đám mây từ xa.

### Nguyên tắc phân loại trạng thái chuẩn hóa:
- **`VERIFIED` (Đã xác minh):** Đã kiểm chứng trực tiếp qua câu lệnh thực thi có kết quả đầu ra rõ ràng trong phiên làm việc hiện hành.
- **`HISTORICALLY REPORTED` (Đã ghi nhận trong lịch sử):** Được chứng minh qua manifest/log bất biến trong quá khứ (ví dụ Gate 4A, Gate 4B), nhưng chưa phản ánh hiện trạng remote hiện tại.
- **`NOT VERIFIED` (Chưa xác minh):** Chưa có bằng chứng thực nghiệm trực tiếp trên remote hiện hành.
- **`BLOCKED` (Bị chặn):** Đang bị nghẽn bởi rào cản kỹ thuật hoặc thiếu điều kiện tiên quyết.
- **`REQUIRES OWNER ACTION` (Cần Chủ dự án thao tác):** Hạng mục phụ thuộc thao tác trên giao diện quản trị (Dashboard) của Supabase, Google Cloud Console hoặc Hosting Provider.

---

## 2. Bảng Tổng hợp Mức độ Sẵn sàng Hạ tầng Staging (Readiness Matrix)

| STT | Thành phần Hạ tầng / Hạng mục | Trạng thái | Bằng chứng / Căn cứ kỹ thuật |
| :---: | :--- | :---: | :--- |
| **1** | **Target Database Identifier** | `VERIFIED` | Truy vấn `current_database()` tại Phase 3ZS xác nhận kết nối `postgres` trên cluster pooler trỏ đúng ref `rwvptwjpfhtfkiwboexz` (khác Production `fzdaasbckmnndqzqopex`). |
| **2** | **Prisma Migrations History** | `VERIFIED` | Truy vấn `_prisma_migrations` tại Phase 3ZS xác nhận đủ 3 migration (`0001_release1_schema`, `0002_data_api_lockdown`, `0003_add_itinerary_time_fields`) đều có `finished_at IS NOT NULL` và `rolled_back_at IS NULL`. |
| **3** | **16 Bảng Nghiệp vụ Release 1** | `VERIFIED` | Truy vấn `information_schema.tables` tại Phase 3ZS xác nhận 16/16 bảng tồn tại trong schema `public`. |
| **4** | **Cột Thời gian Lịch trình (`start_time`, `end_time`)** | `VERIFIED` | Truy vấn `information_schema.columns` tại Phase 3ZS xác nhận kiểu `timestamp(3) without time zone` trên bảng `itinerary_items`. |
| **5** | **PostgreSQL RLS Flag (`relrowsecurity`)** | `VERIFIED` | Truy vấn catalog `pg_class` tại Phase 3ZS xác nhận `relrowsecurity = true` trên các bảng nghiệp vụ (`users`, `trips`, `expenses`, `member_claims`). |
| **6** | **Partial Index `one_pending_claim`** | `VERIFIED` | Truy vấn `pg_indexes` tại Phase 3ZS xác nhận partial unique index tồn tại chính xác trên `(trip_id, "userId") WHERE (status = 'PENDING'::"ClaimStatus")`. |
| **7** | **PostgreSQL Grants (`anon`/`authenticated`)** | `NOT VERIFIED` | Câu lệnh kiểm tra `information_schema.role_table_grants` đã được chuẩn bị trong runbook nhưng **chưa được thực thi** trên remote trong phiên hiện tại. |
| **8** | **PostgreSQL RLS Policies (`pg_policies`)** | `NOT VERIFIED` | Câu lệnh kiểm tra `pg_policies` đã được chuẩn bị trong runbook nhưng **chưa được thực thi** trên remote trong phiên hiện tại. |
| **9** | **Mã nguồn Xử lý Hóa đơn & Proxy UC32** | `VERIFIED` | Kiểm tra mã nguồn cục bộ (`src/lib/storage/receipts.ts` và route handler) xác nhận: Giới hạn 5MB, kiểm tra Magic Bytes (JPEG, PNG, WebP), upload qua Service Role Key, route proxy kiểm tra membership và trả `Cache-Control: private`. |
| **10** | **Private Bucket `trip-receipts` trên Dashboard** | `NOT VERIFIED` <br /> `REQUIRES OWNER ACTION` | Chưa có thao tác xác minh trực tiếp trên Supabase Dashboard Staging; cần Chủ dự án xác nhận bucket đã tạo với cờ **Public Bucket: OFF**. |
| **11** | **Biến môi trường trên Hosting Staging** | `NOT VERIFIED` <br /> `REQUIRES OWNER ACTION` | Đã xác minh file `.env` local trỏ Staging, nhưng **toàn bộ 12 biến trên hosting Staging** (Vercel / Railway / Docker) chưa được kiểm tra trực tiếp trên dashboard hosting. |
| **12** | **Google OAuth Client ID cho Staging** | `NOT VERIFIED` <br /> `REQUIRES OWNER ACTION` | Chưa có xác nhận cấu hình trên Google Cloud Console cho domain Staging thật; cần thêm Authorized Redirect URIs và cấp quyền Test Users. |
| **13** | **Tài khoản Google Thử nghiệm (Test Users)** | `NOT VERIFIED` <br /> `REQUIRES OWNER ACTION` | Hai email `smarttrip.test.host@gmail.com` và `smarttrip.test.member@gmail.com` là **đề xuất kỹ thuật**, chưa được xác nhận đã tạo và cấu hình trong Google Cloud OAuth Consent Screen. |
| **14** | **Domain Hosting Staging** | `NOT VERIFIED` | Tên miền `https://staging.smarttrip.vn` chỉ là **VÍ DỤ (EXAMPLE PLACEHOLDER)**; cần Chủ dự án xác nhận domain Staging thực tế. |
| **15** | **Dữ liệu Thử nghiệm Gate 4B Staging** | `HISTORICALLY REPORTED CREATION` <br /> `CURRENT EXISTENCE NOT VERIFIED` | Manifest `243c2fee-...` chứng minh Trip `9a2f7637-...` và các thực thể liên quan đã tạo thành công ngày 2026-10-24, nhưng chưa chạy truy vấn đọc kiểm tra hiện trạng remote. Chỉ thị: **PRESERVE**. |
| **16** | **Dữ liệu tiền-Phase 3Y trên Production** | `DO NOT TOUCH` | Dữ liệu trên instance `fzdaasbckmnndqzqopex` thuộc phạm vi cấm truy cập; bảo vệ toàn vẹn tuyệt đối. |

---

## 3. Chi tiết Hiệu chỉnh & Đối chiếu Kỹ thuật (Audit Corrections)

### 3.1. Phân định Trạng thái PostgreSQL Security: RLS Flag vs. Grants & Policies
Trong các báo cáo sơ bộ, trạng thái bảo mật database dễ bị gộp chung thành "VERIFIED". Tại Phase 3ZT-R, nội dung này được bóc tách chính xác như sau:
1. **RLS Flag (`relrowsecurity`): `VERIFIED`**
   - Kết quả truy vấn Phase 3ZS trên catalog `pg_class` của database Staging (`rwvptwjpfhtfkiwboexz`) xác nhận cờ RLS đã được bật (`relrowsecurity = true`) trên 16 bảng nghiệp vụ theo migration `0002_data_api_lockdown`.
2. **Table-level Grants (`anon`, `authenticated`): `NOT VERIFIED`**
   - Câu lệnh truy vấn `information_schema.role_table_grants` nhằm chứng minh quyền `SELECT`, `INSERT`, `UPDATE`, `DELETE` đã bị thu hồi khỏi các role của PostgREST mới chỉ được soạn thảo trong Runbook Bước 3.2 (Mục 4), **chưa từng được chạy trên database remote**.
   - Do đó, trạng thái kỹ thuật bắt buộc phải là **`NOT VERIFIED`** cho đến khi có kết quả thực thi trả về 0 dòng.
3. **RLS Policies (`pg_policies`): `NOT VERIFIED`**
   - Tương tự, câu lệnh truy vấn catalog `pg_policies` tại Bước 3.2 (Mục 5) mới ở dạng kế hoạch chỉ đọc, **chưa được thực thi**.
   - Trạng thái bắt buộc là **`NOT VERIFIED`**.

### 3.2. Phân định Trạng thái Biến Môi Trường: Local Config vs. Hosting Remote
- **Thực tế cục bộ:** Script kiểm tra cấu hình local xác nhận file `.env` trên máy trỏ đến dự án Staging `rwvptwjpfhtfkiwboexz` cho cả `DATABASE_URL` và `DIRECT_URL`.
- **Thực tế Hosting Staging:** Việc cấu hình local hợp lệ **không đồng nghĩa** với việc nền tảng triển khai Staging thật (Vercel / Railway / Docker) đã nhận đủ và đúng 12 biến môi trường.
- **Kết luận:** Toàn bộ 12 biến môi trường trên hosting Staging được phân loại là **`NOT VERIFIED`**. Tuyệt đối không yêu cầu người dùng dán hoặc hiển thị secret trong báo cáo hoặc kênh trao đổi; việc kiểm tra phải do Chủ dự án thực hiện đối chiếu trên dashboard quản trị của nhà cung cấp hosting.
- **Domain:** URL `https://staging.smarttrip.vn` được gắn nhãn rõ ràng là **EXAMPLE PLACEHOLDER**.

### 3.3. Phân định Trạng thái Dữ liệu Kiểm thử Gate 4B: Lịch sử vs. Hiện trạng
- **Lịch sử tạo (Artifact Evidence):** Manifest `.smoke-runs/243c2fee-678b-47a0-9a17-8f3370e46d3f/manifest.json` và log chạy kiểm thử chứng minh các thực thể nghiệp vụ sau đã được tạo thành công trên Staging ngày 2026-10-24:
  - Trip: `9a2f7637-0024-4457-952e-eebdb489839e` (Code: `2R5MQ8-Y56BFG`, Status: `COMPLETED`)
  - Host User A: `8af8707c-8804-43b2-ae28-719e31451a67`
  - Member User B: `37b1f7cf-aad6-433c-a25e-242c11bada8a`
  - Itinerary Item: `9659a447-87fe-4694-bbbc-6612d4ffbe12`
  - Expense: `45238596-b541-4f8f-890b-bba904e82ee8`
  - Settlement: `570ba092-6a79-4d2c-be2e-26c1f9fa9e9e`
  - Transfer: `70405483-4130-449f-821f-4367cf86cb9b` (PAID/COMPLETED)
- **Trạng thái hiện tại:** Phân loại là **`HISTORICALLY REPORTED CREATION; CURRENT EXISTENCE NOT VERIFIED`**. Trong phiên làm việc này, tuân thủ nguyên tắc an toàn, không có lệnh đọc database nào được thực thi để xác nhận các bản ghi này còn tồn tại hay đã bị xóa/thay đổi trên remote.
- **Chỉ thị:** Áp dụng nghiêm ngặt chỉ thị **`PRESERVE (BẢO TOÀN / KHÔNG TỰ Ý XÓA)`** để phục vụ đối soát.
- **Dữ liệu Production:** Toàn bộ dữ liệu tiền-Phase 3Y trên `fzdaasbckmnndqzqopex` mang nhãn **`DO NOT TOUCH`**.

---

## 4. Danh sách Công việc Chủ dự án cần thực hiện (Dashboard Action Checklist)

Trước khi hệ thống có thể bước vào kiểm thử E2E trực tiếp, Chủ dự án (Project Owner / DevOps) cần thực hiện các thao tác quản trị trên giao diện web của các nhà cung cấp dịch vụ:

### 4.1. Thao tác trên Supabase Dashboard (Staging: `rwvptwjpfhtfkiwboexz`)
- [ ] **Tạo / Kiểm tra Bucket `trip-receipts`:**
  - Điều hướng: *Storage -> Buckets -> trip-receipts*.
  - Xác nhận thuộc tính: **Public Bucket: OFF** (Private bucket).
  - Xác nhận CORS: Cho phép domain Staging thật (ví dụ `https://staging.yourdomain.com`).
- [ ] **Kiểm tra Storage Policies:**
  - Xác nhận **không có policy** nào cấp quyền đọc công khai cho role `anon`.
- [ ] **Thực thi các câu lệnh SQL Kiểm tra An toàn (Read-Only):**
  - Chạy câu lệnh kiểm tra thu hồi quyền của `anon`/`authenticated` từ Bước 3.2 Mục 4 trong Runbook. Kết quả kỳ vọng: `0 rows`.
  - Chạy câu lệnh kiểm tra `pg_policies` từ Bước 3.2 Mục 5 trong Runbook. Kết quả kỳ vọng: Không có policy cấp mở công khai trái phép.

### 4.2. Thao tác trên Google Cloud Console
- [ ] **Cấu hình OAuth 2.0 Client ID cho Staging:**
  - Điều hướng: *APIs & Services -> Credentials -> OAuth 2.0 Client IDs*.
  - Thêm **Authorized JavaScript origins:** Domain Staging chính thức (ví dụ: `https://staging.yourdomain.com`).
  - Thêm **Authorized redirect URIs:** `https://staging.yourdomain.com/api/auth/callback/google`.
- [ ] **Thêm Test Users (Nếu OAuth Consent Screen ở chế độ Testing):**
  - Thêm 2 tài khoản Google kiểm thử thực tế vào danh sách người dùng được phép đăng nhập.

### 4.3. Thao tác trên Hosting Provider (Vercel / Railway / Docker)
- [ ] **Kiểm tra và Cấu hình 12 Biến môi trường:**
  - Cấu hình đầy đủ và chính xác các biến: `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BANK_ENCRYPTION_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, `RECEIPT_MAX_SIZE_BYTES`.
  - Đảm bảo các secret key tuyệt đối không bị đặt tiền tố `NEXT_PUBLIC_`.
  - Sử dụng phương thức kiểm tra an toàn (không in log secret).

---

## 5. Điều kiện Tiên quyết để Bắt đầu Phase 3ZU (Controlled Staging E2E Verification)

Phase 3ZU — Thực thi kiểm thử E2E có kiểm soát trên Staging chỉ được phép kích hoạt khi thỏa mãn đồng thời 6 điều kiện tiên quyết sau:

1. **Phê duyệt Runbook:** `docs/release-1-staging-runbook.md` được Tech Lead / Lead Engineer ký duyệt.
2. **Xác nhận Biến môi trường Hosting:** Chủ dự án xác nhận 12 biến môi trường trên hosting provider đã được điền đủ và trỏ đúng Staging `rwvptwjpfhtfkiwboexz`.
3. **Xác nhận Private Bucket:** Bucket `trip-receipts` trên Staging Supabase Storage đã được cấu hình với cờ **Public: OFF**.
4. **Xác nhận Google OAuth:** Client ID & Secret trên Google Cloud Console đã khai báo đúng domain Staging thật và danh sách Test Users đã sẵn sàng.
5. **Thực thi SQL An toàn:** Hai câu truy vấn chỉ đọc về `role_table_grants` và `pg_policies` được thực thi và xác nhận đạt chuẩn (chuyển trạng thái từ `NOT VERIFIED` sang `VERIFIED`).
6. **Ủy quyền Smoke Test:** Có chỉ thị phê duyệt từ Product Owner cho phép tạo dữ liệu thử nghiệm có kiểm soát với tiền tố quy ước `[SMOKE-STAGING-YYYYMMDD]`.
