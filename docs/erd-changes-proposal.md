# Đề xuất cập nhật ERD Release 1 (ERD Changes Proposal)

> **Trạng thái:** ĐÃ DUYỆT & ĐÃ ĐỒNG BỘ VÀO sodothietke/release1-erd.dbml (20/10/2026)  
> **Ngày lập:** 20/10/2026  
> **Căn cứ:** 5 quyết định kiến trúc đã được phê duyệt cho Phase 3.  
> **Thực thi:** Đã cập nhật trực tiếp vào file `sodothietke/release1-erd.dbml` sau khi người dùng phê duyệt.

---

## 1. Tóm tắt các thay đổi đề xuất

| STT | Thành phần | Nội dung thay đổi đề xuất | Lý do kỹ thuật |
|---|---|---|---|
| 1 | **Bảng người dùng & Phiên** | Bổ sung các bảng Better Auth: `users`, `accounts`, `sessions`, `verifications`. Bỏ hoàn toàn `phone` và `branch`. | Tương thích chuẩn Better Auth với Prisma adapter; bỏ thông tin không dùng cho VietQR. |
| 2 | **Bảng `expenses`** | Thêm cột `surcharge_amount integer NOT NULL DEFAULT 0` kèm `CHECK (surcharge_amount >= 0)`. | Khớp 100% với UI một dòng phụ phí chia món (Phương án C đã duyệt); không sửa `expense_items`. |
| 3 | **Bảng `trips`** | Giữ nguyên `invite_code varchar(13) [not null, unique]`, cập nhật note chuẩn Base31 `XXXXXX-XXXXXX`. | Định dạng 12 ký tự Base31 có gạch nối ở giữa chống nhầm lẫn, tra cứu chuẩn hóa. |
| 4 | **Mã hóa STK ngân hàng** | Đổi `bank_account_no varchar(30)` → `varchar(255)`; thêm cột `bank_account_key_version integer NOT NULL DEFAULT 1`. | Lưu trữ chuỗi mã hóa AES-256-GCM `iv:authTag:ciphertext` và quản lý phiên bản khóa không cần KMS. |
| 5 | **Chuông thông báo** | **KHÔNG** tạo bảng `notifications`. | Chuông thông báo đã hoãn sang Release 2; tránh làm phình ERD. |

---

## 2. Chi tiết thay đổi dạng DIFF trên DBML (`sodothietke/release1-erd.dbml`)

### 2.1. Nhóm bảng Xác thực & Người dùng (Better Auth)

```diff
- Table users {
-   id uuid [pk, default: `gen_random_uuid()`]
-   email varchar(255) [not null, unique]
-   name varchar(100) [not null]
-   image_url text
-   bank_bin varchar(10) [note: 'mã BIN ngân hàng dùng cho VietQR']
-   bank_account_no varchar(30) [note: 'mã hóa khi lưu (R9)']
-   bank_account_name varchar(100)
-   created_at timestamptz [not null, default: `now()`]
-   Note: 'Người dùng thật, đăng nhập bằng Google (UC01). STK của thành viên có tài khoản nằm ở đây.'
- }

+ Table users {
+   id uuid [pk, default: `gen_random_uuid()`]
+   email varchar(255) [not null, unique]
+   name varchar(100) [not null]
+   email_verified boolean [not null, default: false]
+   image text
+   bank_bin varchar(10) [note: 'mã BIN ngân hàng VietQR']
+   bank_account_no varchar(255) [note: 'mã hóa AES-256-GCM iv:authTag:ciphertext']
+   bank_account_name varchar(100)
+   bank_account_key_version integer [not null, default: 1, note: 'phiên bản khóa mã hóa']
+   created_at timestamptz [not null, default: `now()`]
+   updated_at timestamptz [not null, default: `now()`]
+   Note: 'Bảng người dùng chuẩn Better Auth kết hợp các trường STK ngân hàng mở rộng. Bỏ hoàn toàn phone và branch.'
+ }

+ Table accounts {
+   id uuid [pk, default: `gen_random_uuid()`]
+   user_id uuid [not null, ref: > users.id]
+   account_id text [not null]
+   provider_id text [not null, note: 'google']
+   access_token text
+   refresh_token text
+   id_token text
+   access_token_expires_at timestamptz
+   refresh_token_expires_at timestamptz
+   scope text
+   password text
+   created_at timestamptz [not null, default: `now()`]
+   updated_at timestamptz [not null, default: `now()`]
+   Note: 'Bảng liên kết tài khoản OAuth của Better Auth.'
+ }

+ Table sessions {
+   id uuid [pk, default: `gen_random_uuid()`]
+   user_id uuid [not null, ref: > users.id]
+   token varchar(255) [not null, unique]
+   expires_at timestamptz [not null]
+   ip_address text
+   user_agent text
+   created_at timestamptz [not null, default: `now()`]
+   updated_at timestamptz [not null, default: `now()`]
+   Note: 'Bảng quản lý phiên đăng nhập server-side của Better Auth.'
+ }

+ Table verifications {
+   id uuid [pk, default: `gen_random_uuid()`]
+   identifier text [not null]
+   value text [not null]
+   expires_at timestamptz [not null]
+   created_at timestamptz [not null, default: `now()`]
+   updated_at timestamptz [not null, default: `now()`]
+   Note: 'Bảng lưu token xác thực của Better Auth.'
+ }
```

---

### 2.2. Bảng `trips` — Chuẩn hóa mã mời `invite_code`

```diff
  Table trips {
    id uuid [pk, default: `gen_random_uuid()`]
    name varchar(150) [not null]
    destination varchar(150)
    start_date date [not null]
    end_date date [not null]
    budget_amount integer [note: 'ngân sách dự kiến, có thể để trống']
    status trip_status [not null, default: 'ACTIVE']
-   invite_code varchar(13) [not null, unique, note: '10-12 ký tự chữ/số + tối đa 1 dấu gạch nối (tối đa 13 ký tự), đổi mã = ghi đè cột này (UC28, R14)']
+   invite_code varchar(13) [not null, unique, note: 'Server sinh đúng 12 ký tự ngẫu nhiên Base31 (bỏ 0, O, 1, I, L) dạng XXXXXX-XXXXXX đúng 13 ký tự. Tra cứu chuẩn hóa: bỏ gạch/khoảng trắng, in hoa, tự chèn gạch sau ký tự thứ 6. Đổi mã = ghi đè cột này.']
    created_at timestamptz [not null, default: `now()`]
    updated_at timestamptz [not null, default: `now()`]
  }
```

---

### 2.3. Bảng `trip_members` — Mã hóa STK và phiên bản khóa

```diff
  Table trip_members {
    id uuid [pk, default: `gen_random_uuid()`]
    trip_id uuid [not null]
    user_id uuid [note: 'NULL = thành viên không tài khoản (R11)']
    display_name varchar(100) [not null]
    role member_role [not null, default: 'MEMBER']
    status member_status [not null, default: 'ACTIVE']
    join_order integer [not null, note: 'thứ tự tham gia, dùng chia phần dư (R4)']
    joined_at timestamptz [not null, default: `now()`]
    left_at timestamptz
    bank_bin varchar(10) [note: 'chỉ dùng khi user_id IS NULL, Host nhập hộ (R9, R12)']
-   bank_account_no varchar(30)
+   bank_account_no varchar(255) [note: 'mã hóa AES-256-GCM iv:authTag:ciphertext']
    bank_account_name varchar(100)
+   bank_account_key_version integer [not null, default: 1, note: 'phiên bản khóa']
```

---

### 2.4. Bảng `expenses` — Cột phụ phí `surcharge_amount` (Phương án C)

```diff
  Table expenses {
    id uuid [pk, default: `gen_random_uuid()`]
    trip_id uuid [not null]
    itinerary_item_id uuid [note: 'gắn với địa điểm, có thể để trống']
    title varchar(200) [not null]
    amount integer [not null, note: 'đồng VND, CHECK > 0 (R3)']
+   surcharge_amount integer [not null, default: 0, note: 'phụ phí chia món (VAT/phí DV), CHECK (surcharge_amount >= 0). Tổng tiền = sum(items) + surcharge_amount.']
    category expense_category [not null, default: 'OTHER']
    paid_by_member_id uuid [not null, note: 'người ứng tiền']
    created_by_member_id uuid [not null, note: 'người nhập; Host nhập hộ thì = Host (R5, R12)']
    split_method split_method [not null, default: 'EQUAL']
    spent_at timestamptz [not null, default: `now()`]
    receipt_image_url text [note: 'ảnh hóa đơn (UC32), chưa OCR']
    note text
    created_at timestamptz [not null, default: `now()`]
    updated_at timestamptz [not null, default: `now()`]
  }
```

> **Ghi chú bảo toàn:** Bảng `expense_items` được giữ nguyên vẹn 100%, không thêm cột `item_type`, không thay đổi quan hệ.

---

### 2.5. Bảng `bank_claim_snapshots` — Đồng bộ mã hóa STK

```diff
  Table bank_claim_snapshots {
    id uuid [pk, default: `gen_random_uuid()`]
    claim_id uuid [not null, unique, ref: - member_claims.id]
    placeholder_member_id uuid [not null, ref: > trip_members.id]
    user_id uuid [not null, ref: > users.id]
-   bank_bin_ciphertext text [not null]
-   bank_account_no_ciphertext text [not null]
-   bank_account_name_ciphertext text
+   bank_bin varchar(10) [note: 'mã BIN ngân hàng không cần mã hóa']
+   bank_account_no_ciphertext varchar(255) [not null, note: 'mã hóa AES-256-GCM iv:authTag:ciphertext']
+   bank_account_name varchar(100) [note: 'tên chủ tài khoản không cần mã hóa']
    key_version varchar(64) [not null]
    created_at timestamptz [not null, default: `now()`]
  }
```

---

## 3. Khẳng định về các thành phần loại bỏ

1. **Bỏ trường `phone` và `branch`:**
   - Trong luồng chuyển khoản VietQR chuẩn NAPAS 247, thông tin cần thiết duy nhất để định tuyến giao dịch là **Mã BIN ngân hàng (6-8 chữ số)** và **Số tài khoản**.
   - Các trường số điện thoại (`phone`) hay chi nhánh ngân hàng (`branch`) không được sử dụng và không nằm trong phạm vi Release 1, do đó chính thức loại bỏ khỏi bảng `users` và `trip_members`.
2. **Không tạo bảng `notifications`:**
   - Quyết định số 5 đã hoãn chuông thông báo sang Release 2. Không tạo bảng `notifications` trong ERD Release 1.

---

> 🛑 **ĐIỂM DỪNG:** Tài liệu này là bản đề xuất thay đổi. Không sửa file `sodothietke/release1-erd.dbml` cho đến khi người dùng phê duyệt chính thức.
