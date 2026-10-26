# BÁO CÁO KIỂM TRA SCHEMA VÀ MIGRATION DATABASE PRODUCTION (PREFLIGHT AUDIT)
## Phase 3ZZ — Production Database Migration Preflight Audit

> **Thời điểm thực hiện audit:** 2026-10-25T23:05:00+07:00  
> **Production Project Reference mục tiêu:** `fzdaasbckmnndqzqopex`  
> **Staging Project Reference phân lập:** `rwvptwjpfhtfkiwboexz`  
> **Nguyên tắc an toàn bắt buộc:**
> - Hoàn toàn chỉ đọc (Read-only metadata verification).
> - Tuyệt đối không can thiệp, không chạy migration, seed, INSERT, UPDATE, DELETE, DDL, cleanup, reset hoặc `prisma db push`.
> - Không hiển thị connection strings, credentials, token hoặc mật khẩu.
> - Tuân thủ điều kiện dừng an toàn: *"Nếu không thể xác minh đích kết nối chính xác, dừng và báo NEEDS MANUAL VERIFICATION"*.

---

## 1. Trạng thái Xác minh Kết nối Target Database

### 1.1. Rà soát Biến môi trường và Cấu hình Cục bộ
Thực hiện quét bảo mật toàn bộ các file cấu hình và biến môi trường hiện hữu trong workspace (`.env`, `.env.local`, `process.env`):
- **Kết quả kiểm tra `DATABASE_URL` cục bộ:**
  - Kết nối hiện tại trỏ tới Staging: `rwvptwjpfhtfkiwboexz` (**TRUE**).
  - Kết nối hiện tại trỏ tới Production: `fzdaasbckmnndqzqopex` (**FALSE**).
- **Đánh giá ranh giới an toàn:**
  - Môi trường cục bộ được cách ly triệt để theo kiến trúc bảo vệ hạ tầng của Phase 3Y. Không có bất kỳ chuỗi kết nối nào của Production `fzdaasbckmnndqzqopex` tồn tại trong file cấu hình local.
  - Điều này bảo đảm 100% không xảy ra sự cố gửi nhầm truy vấn, test script hoặc lệnh DDL từ máy phát triển vào cơ sở dữ liệu Production.

### 1.2. Áp dụng Điều kiện Dừng An toàn
Theo mục 2 của yêu cầu công việc:
> *"Trước khi truy vấn, xác minh đích kết nối đúng Production project ref. Nếu không thể xác minh đích kết nối chính xác, dừng và báo NEEDS MANUAL VERIFICATION. Không yêu cầu người dùng gửi các giá trị bí mật."*

Do không có sẵn thông tin kết nối an toàn của Production trên môi trường này (và không được phép yêu cầu người dùng cung cấp mật khẩu/credentials vào chat), Agent dừng việc thực thi truy vấn trực tiếp từ local và kích hoạt quy trình **`NEEDS MANUAL VERIFICATION`** kèm bộ công cụ truy vấn chỉ đọc chuẩn hóa để Quản trị viên tự thực hiện trên Supabase Dashboard.

---

## 2. Bộ Truy vấn Chỉ Đọc (Read-Only SQL) Chuẩn hóa Cho Quản trị viên

Quản trị viên / Lead Engineer truy cập **Supabase Dashboard $\rightarrow$ Project `fzdaasbckmnndqzqopex` $\rightarrow$ SQL Editor**, tạo một query mới và thực thi lần lượt 5 câu lệnh chỉ đọc sau đây:

### Truy vấn 1: Kiểm tra Bảng Metadata `_prisma_migrations`
*Mục đích: Xác định bảng quản lý migration của Prisma có tồn tại không và trạng thái áp dụng của từng migration.*

```sql
-- 1. Kiểm tra bảng _prisma_migrations
SELECT 
    id,
    migration_name,
    checksum,
    finished_at,
    migration_action,
    rolled_back_at,
    started_at,
    applied_steps_count
FROM public._prisma_migrations
ORDER BY started_at ASC;
```

**Kỳ vọng đối chiếu:**
- Nếu đã chạy đầy đủ Release 1, bảng này phải có đủ **3 bản ghi**:
  1. `0001_release1_schema` (`finished_at` không NULL, `rolled_back_at` IS NULL).
  2. `0002_data_api_lockdown` (`finished_at` không NULL, `rolled_back_at` IS NULL).
  3. `0003_add_itinerary_time_fields` (`finished_at` không NULL, `rolled_back_at` IS NULL).

---

### Truy vấn 2: Kiểm tra Sự hiện diện của 16 Bảng Nghiệp vụ Release 1
*Mục đích: Xác minh cấu trúc schema thực tế trên Production.*

```sql
-- 2. Kiểm tra danh sách bảng nghiệp vụ trong schema public
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'users',
    'accounts',
    'sessions',
    'verifications',
    'trips',
    'trip_members',
    'member_claims',
    'bank_claim_snapshots',
    'itinerary_items',
    'expenses',
    'expense_shares',
    'expense_items',
    'expense_item_members',
    'settlements',
    'settlement_transfers',
    'rate_limits',
    '_prisma_migrations'
  )
ORDER BY table_name;
```

**Kỳ vọng đối chiếu:**
- Trả về đủ 17 bảng (bao gồm 16 bảng nghiệp vụ và bảng `_prisma_migrations`).

---

### Truy vấn 3: Kiểm tra Hai Cột Thời gian Lịch trình (Migration 0003)
*Mục đích: Xác định xem bảng `itinerary_items` đã có cột `start_time` và `end_time` hay chưa.*

```sql
-- 3. Kiểm tra cột thời gian trong itinerary_items
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'itinerary_items'
  AND column_name IN ('start_time', 'end_time');
```

**Kỳ vọng đối chiếu:**
- Trả về 2 dòng: `start_time` (kiểu `time without time zone`, `is_nullable = YES`) và `end_time` (kiểu `time without time zone`, `is_nullable = YES`).

---

### Truy vấn 4: Kiểm tra Trạng thái Row-Level Security (RLS) (Migration 0002)
*Mục đích: Xác nhận Data API lockdown đã được bật để bảo vệ dữ liệu khỏi truy cập trực tiếp qua anon key.*

```sql
-- 4. Kiểm tra RLS trên các bảng nghiệp vụ
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'users', 'accounts', 'sessions', 'verifications',
    'trips', 'trip_members', 'member_claims', 'bank_claim_snapshots',
    'itinerary_items', 'expenses', 'expense_shares', 'expense_items',
    'expense_item_members', 'settlements', 'settlement_transfers',
    'rate_limits', '_prisma_migrations'
  )
ORDER BY tablename;
```

**Kỳ vọng đối chiếu:**
- Toàn bộ 17 bảng đều phải có giá trị `rowsecurity = true`.

---

### Truy vấn 5: Kiểm tra Các Unique Indexes & Constraints Quan trọng
*Mục đích: Đảm bảo tính toàn vẹn dữ liệu cho các ràng buộc mã mời, thành viên và claims.*

```sql
-- 5. Kiểm tra các index độc nhất và partial unique index
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'one_pending_claim',
    'trip_members_trip_id_user_id_key',
    'trip_members_trip_id_display_name_key',
    'trips_invite_code_key'
  )
ORDER BY tablename, indexname;
```

**Kỳ vọng đối chiếu:**
- `one_pending_claim`: Partial index `WHERE (status = 'PENDING'::"ClaimStatus")`.
- `trip_members_trip_id_user_id_key`: Unique index trên `(trip_id, user_id)`.
- `trip_members_trip_id_display_name_key`: Unique index trên `(trip_id, display_name)`.
- `trips_invite_code_key`: Unique index trên `(invite_code)`.

---

## 3. Cây Quyết định Xử lý Triển khai (Deployment Decision Tree)

Dựa trên kết quả thực thi của 5 câu lệnh trên trong Supabase SQL Editor, Quản trị viên đối chiếu với 3 kịch bản sau:

```
                            [Kết quả Truy vấn SQL Editor]
                                          │
            ┌─────────────────────────────┼─────────────────────────────┐
            ▼                             ▼                             ▼
    [KỊCH BẢN A]                  [KỊCH BẢN B]                  [KỊCH BẢN C]
   Cơ sở dữ liệu Mới              Schema đã Tồn tại           Đã Áp dụng Đủ 3
   (Clean Database)            nhưng Migration lệch           Migrations rồi
   - _prisma_migrations: Trống   - Bảng nghiệp vụ: Có          - _prisma_migrations: Có
   - 16 bảng: Chưa có            - _prisma_migrations: Trống   - finished_at: Hợp lệ
            │                             │                             │
            ▼                             ▼                             ▼
    [HÀNH ĐỘNG A]                 [HÀNH ĐỘNG B]                 [HÀNH ĐỘNG C]
   Chạy trực tiếp:               CẢNH BÁO: NGUY CƠ CAO!        SẴN SÀNG RELEASE!
   prisma migrate deploy         CẤM chạy migrate deploy       Không cần chạy
   (An toàn tuyệt đối)           Sử dụng migrate resolve       thêm DDL nào
```

### Chi tiết hành động theo từng kịch bản:

#### Kịch bản A: Cơ sở dữ liệu mới hoàn toàn (Clean Database)
- **Đặc điểm:** Chưa có 16 bảng nghiệp vụ, bảng `_prisma_migrations` chưa tồn tại.
- **Hành động:**
  1. Tạo Manual Backup Snapshot trên Supabase Dashboard.
  2. Lấy chuỗi `DIRECT_URL` (cổng 5432 Session Pooler của project `fzdaasbckmnndqzqopex`).
  3. Chạy lệnh:
     ```bash
     npx prisma migrate deploy
     ```
  4. Hệ thống sẽ áp dụng tuần tự 3 migration `0001`, `0002`, `0003` hoàn toàn sạch sẽ.

#### Kịch bản B: Schema đã tồn tại nhưng `_prisma_migrations` chưa đồng bộ (NGUY CƠ CAO)
- **Đặc điểm:** Bảng `users`, `trips` v.v. đã tồn tại (do lịch sử thử nghiệm trước Phase 3Y), nhưng bảng `_prisma_migrations` bị trống hoặc thiếu bản ghi.
- **Rủi ro chí tử:** Nếu chạy `npx prisma migrate deploy`, PostgreSQL sẽ báo lỗi `relation "users" already exists` $\rightarrow$ Quá trình deploy bị crash và dừng khẩn cấp.
- **Kế hoạch xử lý an toàn (Không làm mất dữ liệu):**
  1. Bấm tạo **Manual Backup Snapshot** trên Supabase Dashboard trước.
  2. Đánh dấu baseline cho migration đã tồn tại bằng lệnh:
     ```bash
     npx prisma migrate resolve --applied 0001_release1_schema
     ```
  3. Kiểm tra xem RLS và cột thời gian đã có chưa:
     - Nếu RLS chưa bật: chạy `npx prisma migrate deploy` (sẽ chạy tiếp `0002` và `0003`).
     - Nếu cột thời gian đã có: dùng `prisma migrate resolve --applied` tương ứng.
  4. Tuyệt đối **CẤM** chạy `prisma migrate reset` (gây xoá sạch dữ liệu).

#### Kịch bản C: Đã áp dụng đủ cả 3 migrations
- **Đặc điểm:** Bảng `_prisma_migrations` đã ghi nhận đủ cả 3 dòng với `finished_at` hợp lệ.
- **Hành động:** Cơ sở dữ liệu Production đã sẵn sàng 100% cho Release 1. Không cần thực hiện thêm bất kỳ lệnh DDL nào.

---

## 4. Bảng Phân loại Rủi ro và Blocker (Blocker Matrix)

| Mức độ | Mã Blocker | Mô tả rủi ro | Hành động giải quyết | Người phụ trách |
| :---: | :---: | :--- | :--- | :---: |
| **CRITICAL** | **BLK-PRE-01** | Chưa có kết quả đối chiếu metadata trực tiếp từ Supabase Production `fzdaasbckmnndqzqopex`. | Chạy 5 câu lệnh SQL chỉ đọc ở Mục 2 trên Supabase SQL Editor. | Tech Lead / Admin |
| **HIGH** | **BLK-PRE-02** | Nguy cơ lỗi xung đột schema `relation already exists` nếu Production thuộc Kịch bản B. | Tuân thủ nghiêm ngặt Cây quyết định ở Mục 3; áp dụng `migrate resolve` thay vì `migrate deploy` mù quáng. | Lead Engineer |
| **HIGH** | **BLK-PRE-03** | Chưa tạo bản sao lưu Snapshot thủ công của database Production trước giờ triển khai. | Bấm **Manual Backup** trên Supabase Dashboard $\rightarrow$ Database $\rightarrow$ Backups. | Admin |

---

## 5. Kết luận

### Trạng thái Kiểm toán: `NEEDS MANUAL VERIFICATION`

### Lý do kết luận:
1. **Tuân thủ ranh giới an toàn:** Môi trường phát triển cục bộ không chứa và không được phép lưu trữ thông tin kết nối nhạy cảm của Supabase Production (`fzdaasbckmnndqzqopex`), bảo đảm an toàn dữ liệu 100%.
2. **Không có bất kỳ thay đổi nào:** Không có bất kỳ truy vấn DDL/DML, script kiểm thử, migration hay dữ liệu nghiệp vụ nào bị ghi hoặc sửa đổi trên bất kỳ môi trường nào trong phase này.
3. **Cung cấp giải pháp trọn vẹn:** Đã bàn giao đầy đủ 5 câu lệnh SQL chỉ đọc và cây quyết định xử lý chi tiết để Quản trị viên đối chiếu nhanh trong 3 phút trên bảng điều khiển Supabase trước khi kích hoạt lệnh triển khai chính thức.
