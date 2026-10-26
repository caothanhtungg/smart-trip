# BÁO CÁO ĐỐI SOÁT CHECKSUM MIGRATION (PHASE 3ZZ-FINAL)
## Phase 3ZZ-FINAL — Migration Checksum Reconciliation

> **Thời điểm thực hiện audit:** 2026-10-25T23:30:00+07:00  
> **Phạm vi kiểm tra:** 3 migration files trong `prisma/migrations/`  
> **Mục tiêu:** Tính toán SHA-256 Checksum chuẩn xác từ mã nguồn cục bộ và đối chiếu với dữ liệu lưu tại bảng `_prisma_migrations` của Supabase Production (`fzdaasbckmnndqzqopex`).  
> **Nguyên tắc an toàn:**
> - Rà soát tĩnh hoàn toàn trên local repository.
> - Tuyệt đối không kết nối database Production, không chạy SQL, không in secrets.
> - Tuân thủ quy định: Nếu chưa có giá trị checksum Production dạng văn bản rõ ràng, ghi nhận chính xác **`NEEDS MANUAL COMPARISON`**; tuyệt đối không tự suy đoán.

---

## 1. Bảng Đối soát Checksum Từng Migration

SHA-256 Checksum của từng file `migration.sql` được tính toán trực tiếp từ luồng byte nguyên bản trên đĩa (raw buffer, không qua chuẩn hóa thay đổi nội dung):

| STT | Tên Migration (`migration_name`) | Đường dẫn file trong repository | Dung lượng (bytes) | SHA-256 Checksum (Local Repository) | Checksum tại Supabase Production (`_prisma_migrations`) | Trạng thái đối chiếu |
| :---: | :--- | :--- | :---: | :--- | :--- | :---: |
| 1 | `0001_release1_schema` | [`prisma/migrations/0001_release1_schema/migration.sql`](file:///c:/Users/admin/Downloads/doanweb/prisma/migrations/0001_release1_schema/migration.sql) | 17.663 | `e2f05afb143eec94cc025d326d8d076de40a461015be3c5b049064fd54f3795c` | *(Chờ người dùng cung cấp dạng text từ SQL Editor)* | **NEEDS MANUAL COMPARISON** |
| 2 | `0002_data_api_lockdown` | [`prisma/migrations/0002_data_api_lockdown/migration.sql`](file:///c:/Users/admin/Downloads/doanweb/prisma/migrations/0002_data_api_lockdown/migration.sql) | 7.660 | `8c93d4d7bd8e655733cc8cb949b54ff149690f7c16b36bf40f986dc153591e21` | *(Chờ người dùng cung cấp dạng text từ SQL Editor)* | **NEEDS MANUAL COMPARISON** |
| 3 | `0003_add_itinerary_time_fields` | [`prisma/migrations/0003_add_itinerary_time_fields/migration.sql`](file:///c:/Users/admin/Downloads/doanweb/prisma/migrations/0003_add_itinerary_time_fields/migration.sql) | 419 | `4f4b7e8b76efc44aacf075ec3a431bc2d670e868739a719e5fcb4521e6ebef6e` | *(Chờ người dùng cung cấp dạng text từ SQL Editor)* | **NEEDS MANUAL COMPARISON** |

*Ghi chú kỹ thuật: Các file migration trong repository sử dụng chuẩn xuống dòng LF đồng nhất. Checksum tính trên buffer gốc và buffer LF hoàn toàn trùng khớp 100%.*

---

## 2. Dữ liệu Còn thiếu & Hướng dẫn Lấy Checksum Production An toàn

Do trong yêu cầu hiện tại, kết quả truy vấn từ Supabase SQL Editor chưa được gửi kèm dưới dạng văn bản (text), Quản trị viên chỉ cần thực hiện 1 câu lệnh ngắn sau trong **Supabase SQL Editor (Project `fzdaasbckmnndqzqopex`)**:

```sql
SELECT migration_name, checksum, finished_at, rolled_back_at 
FROM public._prisma_migrations 
ORDER BY started_at ASC;
```

### Hướng dẫn đối chiếu kết quả:
1. **Nếu cột `checksum` trên Supabase trả về trùng khớp từng ký tự với bảng ở Mục 1:**
   $\rightarrow$ Trạng thái chuyển thành **`MATCH`**. File migration trên Git và lịch sử database là đồng nhất 100%.
2. **Nếu cột `checksum` khác:**
   $\rightarrow$ Trạng thái là **`MISMATCH`**. Điều này có nghĩa file `migration.sql` đã từng bị chỉnh sửa sau khi chạy migration trên remote. Prisma Migrate sẽ báo lỗi drift checksum nếu chạy lại.
3. **Nếu bảng `_prisma_migrations` rỗng hoặc không tồn tại:**
   $\rightarrow$ Database Production chưa từng chạy Prisma Migrate (thuộc Kịch bản A hoặc B trong báo cáo Phase 3ZZ).

---

## 3. Xác minh Định nghĩa Các Index và Constraint Cốt lõi

Đã rà soát và đối chiếu định nghĩa của 4 index/constraint trọng yếu trong repository để làm căn cứ so sánh với cột `indexdef` trong bảng `pg_indexes` của Production:

### 3.1. Partial Unique Index `one_pending_claim`
- **File định nghĩa:** [`prisma/migrations/0001_release1_schema/migration.sql#L312`](file:///c:/Users/admin/Downloads/doanweb/prisma/migrations/0001_release1_schema/migration.sql#L312)
- **Câu lệnh DDL trong migration:**
  ```sql
  CREATE UNIQUE INDEX "one_pending_claim" ON "member_claims"("trip_id", "userId") WHERE "status" = 'PENDING';
  ```
- **Mục đích nghiệp vụ:** Bảo đảm Quy tắc R20 — một người dùng chỉ có tối đa 1 yêu cầu nhận diện thành viên (claim) ở trạng thái `PENDING` trong cùng một chuyến đi, chống race condition.
- **Định dạng chuẩn trong `pg_indexes.indexdef`:**
  `CREATE UNIQUE INDEX one_pending_claim ON public.member_claims USING btree (trip_id, "userId") WHERE (status = 'PENDING'::"ClaimStatus")`

### 3.2. Unique Index `trip_members_trip_id_user_id_key`
- **File định nghĩa:** [`prisma/migrations/0001_release1_schema/migration.sql#L257`](file:///c:/Users/admin/Downloads/doanweb/prisma/migrations/0001_release1_schema/migration.sql#L257) & [`prisma/schema.prisma#L179`](file:///c:/Users/admin/Downloads/doanweb/prisma/schema.prisma#L179)
- **Câu lệnh DDL trong migration:**
  ```sql
  CREATE UNIQUE INDEX "trip_members_trip_id_user_id_key" ON "trip_members"("trip_id", "user_id");
  ```
- **Mục đích nghiệp vụ:** Đảm bảo mỗi tài khoản người dùng (`user_id`) chỉ là thành viên của chuyến đi tối đa 1 lần (cho phép `user_id` là NULL đối với thành viên ảo/guest).
- **Định dạng chuẩn trong `pg_indexes.indexdef`:**
  `CREATE UNIQUE INDEX trip_members_trip_id_user_id_key ON public.trip_members USING btree (trip_id, user_id)`

### 3.3. Unique Index `trip_members_trip_id_display_name_key`
- **File định nghĩa:** [`prisma/migrations/0001_release1_schema/migration.sql#L258`](file:///c:/Users/admin/Downloads/doanweb/prisma/migrations/0001_release1_schema/migration.sql#L258) & [`prisma/schema.prisma#L180`](file:///c:/Users/admin/Downloads/doanweb/prisma/schema.prisma#L180)
- **Câu lệnh DDL trong migration:**
  ```sql
  CREATE UNIQUE INDEX "trip_members_trip_id_display_name_key" ON "trip_members"("trip_id", "display_name");
  ```
- **Mục đích nghiệp vụ:** Bảo đảm không trùng tên hiển thị giữa các thành viên trong cùng một chuyến đi.
- **Định dạng chuẩn trong `pg_indexes.indexdef`:**
  `CREATE UNIQUE INDEX trip_members_trip_id_display_name_key ON public.trip_members USING btree (trip_id, display_name)`

### 3.4. Unique Index `trips_invite_code_key`
- **File định nghĩa:** [`prisma/migrations/0001_release1_schema/migration.sql#L256`](file:///c:/Users/admin/Downloads/doanweb/prisma/migrations/0001_release1_schema/migration.sql#L256) & [`prisma/schema.prisma#L137`](file:///c:/Users/admin/Downloads/doanweb/prisma/schema.prisma#L137)
- **Câu lệnh DDL trong migration:**
  ```sql
  CREATE UNIQUE INDEX "trips_invite_code_key" ON "trips"("invite_code");
  ```
- **Mục đích nghiệp vụ:** Đảm bảo mã mời tham gia chuyến đi là duy nhất trên toàn hệ thống.
- **Định dạng chuẩn trong `pg_indexes.indexdef`:**
  `CREATE UNIQUE INDEX trips_invite_code_key ON public.trips USING btree (invite_code)`

---

## 4. Xác nhận An toàn & Bảo toàn Hệ thống
1. **Không kết nối Database:** Toàn bộ quá trình tính toán và kiểm tra được thực hiện độc lập 100% bằng cách đọc tệp tĩnh cục bộ. Không có kết nối mạng hay truy vấn SQL nào được gửi tới Supabase Production.
2. **Không làm lộ bí mật:** Không có secret, token hay connection string nào được in ra.
3. **Bảo toàn Git Working Tree:** Không có lệnh stage, commit, push hay merge nào được thực thi. Toàn bộ các file tài liệu và thay đổi chưa commit hiện có được giữ nguyên vẹn.

---

## 5. Kết luận
- **Trạng thái đối soát:** **`NEEDS MANUAL COMPARISON`** (Do dữ liệu checksum từ Production chưa được cung cấp dạng text).
- **Nguyên tắc phát hành:** Tuyệt đối không tuyên bố Production sẵn sàng khi chưa đối chiếu khớp chuỗi SHA-256 Checksum với database remote.
