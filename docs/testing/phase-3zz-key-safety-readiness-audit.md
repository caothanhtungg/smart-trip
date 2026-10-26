# Phase 3ZZ-KEY-SAFETY — Read-Only Production Encryption Readiness Audit

- **Dự án:** Smart Trip & Expense Planner
- **Mã kiểm toán:** Phase 3ZZ-KEY-SAFETY
- **Thời gian thực hiện:** 27/10/2026
- **Phạm vi:** Kiểm toán chỉ đọc (Read-only) mã nguồn, schema, migration, tests và cấu hình liên quan đến cơ chế mã hóa thông tin ngân hàng.
- **Mục tiêu:** Xác minh mức độ sẵn sàng cấu hình `BANK_ENCRYPTION_KEY` trên Vercel Production trước khi phát hành Release 1.
- **Kết luận:** 🟡 **READY FOR PROVISIONING (NEEDS MANUAL DASHBOARD VERIFICATION)**

---

## 1. Tuyên bố Tuân thủ Giới hạn An toàn

Kiểm toán này được thực hiện dưới các giới hạn an toàn nghiêm ngặt:
1. **Không kết nối hoặc gửi bất kỳ truy vấn nào** tới database Supabase Production (`fzdaasbckmnndqzqopex`) hay Staging (`rwvptwjpfhtfkiwboexz`).
2. **Không chạy migration, DDL, DML, seed, reset, cleanup** hoặc thay đổi dữ liệu dưới mọi hình thức.
3. **Không chỉnh sửa file cấu hình môi trường** (`.env`, `.env.local`), không can thiệp Vercel Environment Variables, không thay đổi khóa mã hóa hay OAuth credentials.
4. **Không đọc, in, ghi log hoặc yêu cầu cung cấp bất kỳ giá trị secret nào**.
5. **Không thực hiện git stage, git commit, git push, git revert hay git reset**.

---

## 2. Toàn bộ vị trí Mã hóa, Giải mã, Đọc Khóa và Quản lý Key Version

### A. Đọc biến môi trường `BANK_ENCRYPTION_KEY`
- **Mã nguồn Runtime:**
  - [`src/lib/crypto/bank-encryption.ts:14`](file:///c:/Users/admin/Downloads/doanweb/src/lib/crypto/bank-encryption.ts#L14): Điểm runtime duy nhất đọc `process.env.BANK_ENCRYPTION_KEY?.trim()` thông qua hàm `getEncryptionKey(overrideKey?: string)`.
- **Môi trường Test (Mocking offline):**
  - [`src/lib/crypto/bank-encryption.test.ts:16–26, 50`](file:///c:/Users/admin/Downloads/doanweb/src/lib/crypto/bank-encryption.test.ts#L16–L26)
  - [`src/app/api/trips/[id]/transfers/[transferId]/payment-info/route.test.ts:43, 128, 132, 392`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/trips/%5Bid%5D/transfers/%5BtransferId%5D/payment-info/route.test.ts#L43)
  - [`src/app/api/me/route.test.ts:28–39, 163–174, 441–442`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/me/route.test.ts#L28–L39)

### B. Hàm mã hóa và giải mã AES-256-GCM
- **Thuật toán lõi:** `aes-256-gcm` ([`src/lib/crypto/bank-encryption.ts:3`](file:///c:/Users/admin/Downloads/doanweb/src/lib/crypto/bank-encryption.ts#L3)).
- **Mã hóa (`encryptBankAccount`):**
  - Vị trí: [`src/lib/crypto/bank-encryption.ts:54–80`](file:///c:/Users/admin/Downloads/doanweb/src/lib/crypto/bank-encryption.ts#L54–L80).
  - Vị trí gọi: [`src/app/api/me/route.ts:105`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/me/route.ts#L105) (`PATCH /api/me`).
- **Giải mã (`decryptBankAccount`):**
  - Vị trí: [`src/lib/crypto/bank-encryption.ts:87–141`](file:///c:/Users/admin/Downloads/doanweb/src/lib/crypto/bank-encryption.ts#L87–L141).
  - Vị trí gọi 1: [`src/app/api/me/route.ts:49`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/me/route.ts#L49) (`GET /api/me`).
  - Vị trí gọi 2: [`src/app/api/trips/[id]/transfers/[transferId]/payment-info/route.ts:175`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/trips/%5Bid%5D/transfers/%5BtransferId%5D/payment-info/route.ts#L175) (`GET /payment-info`).

### C. Quản lý `bank_account_key_version`
- **Hằng số phiên bản code:** `CURRENT_BANK_KEY_VERSION = 1` ([`src/lib/crypto/bank-encryption.ts:6`](file:///c:/Users/admin/Downloads/doanweb/src/lib/crypto/bank-encryption.ts#L6)).
- **Khởi tạo khi đăng ký Better Auth:** `defaultValue: 1` ([`src/lib/auth.ts:27–31`](file:///c:/Users/admin/Downloads/doanweb/src/lib/auth.ts#L27–L31)).
- **Định nghĩa Schema Prisma:**
  - `User.bankAccountKeyVersion Int @default(1)` ([`prisma/schema.prisma:73`](file:///c:/Users/admin/Downloads/doanweb/prisma/schema.prisma#L73)).
  - `TripMember.bankAccountKeyVersion Int @default(1)` ([`prisma/schema.prisma:162`](file:///c:/Users/admin/Downloads/doanweb/prisma/schema.prisma#L162)).
  - `BankClaimSnapshot.keyVersion Int @default(1)` ([`prisma/schema.prisma:213`](file:///c:/Users/admin/Downloads/doanweb/prisma/schema.prisma#L213)).
- **Định nghĩa PostgreSQL DDL Migration:**
  - `"bank_account_key_version" INTEGER NOT NULL DEFAULT 1` trong bảng `users` ([`prisma/migrations/0001_release1_schema/migration.sql:32`](file:///c:/Users/admin/Downloads/doanweb/prisma/migrations/0001_release1_schema/migration.sql#L32)).
  - `"bank_account_key_version" INTEGER NOT NULL DEFAULT 1` trong bảng `trip_members` ([`prisma/migrations/0001_release1_schema/migration.sql:114`](file:///c:/Users/admin/Downloads/doanweb/prisma/migrations/0001_release1_schema/migration.sql#L114)).
  - `"key_version" INTEGER NOT NULL DEFAULT 1` trong bảng `bank_claim_snapshots` ([`prisma/migrations/0001_release1_schema/migration.sql:142`](file:///c:/Users/admin/Downloads/doanweb/prisma/migrations/0001_release1_schema/migration.sql#L142)).

---

## 3. Xác minh Hành vi khi Khóa Thiếu, Sai Định dạng hoặc Lỗi Giải mã

### A. Phân tích hàm `getEncryptionKey()`
Hàm tại [`src/lib/crypto/bank-encryption.ts:13–43`](file:///c:/Users/admin/Downloads/doanweb/src/lib/crypto/bank-encryption.ts#L13–L43) kiểm tra tuần tự:
1. **Thiếu khóa / rỗng:** `if (!rawKey) throw new Error("[Security] BANK_ENCRYPTION_KEY is missing or empty. Refusing to operate.");`
2. **Khóa Hex 64 ký tự (Chuẩn khuyến nghị):** `/^[0-9a-fA-F]{64}$/.test(rawKey)` $\rightarrow$ Chuyển thành Buffer 32 bytes qua `Buffer.from(rawKey, "hex")`.
3. **Khóa UTF-8 32 bytes:** `Buffer.from(rawKey, "utf8").length === 32` $\rightarrow$ Nhận Buffer.
4. **Khóa Base64:** Giải mã chuỗi Base64 ra đúng 32 bytes binary.
5. **Sai độ dài hoặc sai định dạng khác:** Ném ngoại lệ `[Security] BANK_ENCRYPTION_KEY must be exactly 32 bytes (256 bits). Expected 64 hex characters or 32-byte string, got length ${rawKey.length}.`

### B. Hành vi tại các API liên quan

| Kịch bản | `PATCH /api/me` (Cập nhật STK) | `GET /api/me` (Xem hồ sơ) | `GET /payment-info` (VietQR) | Next.js Server Boot |
| :--- | :--- | :--- | :--- | :--- |
| **Thiếu biến `BANK_ENCRYPTION_KEY`** | **Fail-closed:** Ném lỗi 500, chặn không gọi `prisma.user.update`. | **Fail-safe:** Bọc `try/catch`, gán `bankAccountMasked = null`, trả HTTP 200. | **Fail-closed:** Ném lỗi 500 an toàn, không rò rỉ secret. | **Thành công:** Key không đọc ở top-level module scope. |
| **Khóa sai độ dài (< 32 bytes)** | **Fail-closed:** Ném lỗi 500, không cập nhật DB. | **Fail-safe:** Gán `bankAccountMasked = null`, trả HTTP 200. | **Fail-closed:** Ném lỗi 500 an toàn. | **Thành công.** |
| **Khóa sai (khác khóa lúc mã hóa)** | Không áp dụng (chỉ mã hóa mới). | **Fail-safe:** AuthTag không khớp, gán `bankAccountMasked = null`, trả HTTP 200. | **Fail-closed:** AuthTag không khớp, ném lỗi 500 an toàn. | **Thành công.** |
| **Dữ liệu ciphertext bị giả mạo** | Không áp dụng. | **Fail-safe:** Gán `bankAccountMasked = null`, trả HTTP 200. | **Fail-closed:** Ném lỗi 500 an toàn. | **Thành công.** |

---

## 4. Luồng Ghi/Đọc Dữ liệu Ngân hàng, Snapshot và Tạo VietQR

### A. Bảng `users`
- **Ghi:** Khi người dùng cập nhật hồ sơ qua `PATCH /api/me` ([`src/app/api/me/route.ts:103–128`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/me/route.ts#L103–L128)).
  - Nếu có `bankAccountNo`: Mã hóa qua `encryptBankAccount()` và lưu chuỗi `iv:authTag:ciphertext` vào `bank_account_no`, gán `bank_account_key_version = 1`.
  - Nếu `bankAccountNo: null`: Đặt `bank_bin = null`, `bank_account_no = null`, `bank_account_name = null` (gỡ bỏ thông tin).
- **Đọc:** `GET /api/me` ([`src/app/api/me/route.ts:45–55`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/me/route.ts#L45–L55)). Giải mã STK, che thành `**** **** 1234` qua `maskBankAccount()`, trả về `bankAccountMasked`. Không bao giờ trả plaintext hoặc ciphertext về client.

### B. Bảng `trip_members`
- **Ghi:**
  - Khi Host tạo chuyến đi mới ([`src/app/api/trips/route.ts:226–229`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/trips/route.ts#L226–L229)): Sao chép `bankBin`, `bankAccountNo` (ciphertext), `bankAccountName`, `bankAccountKeyVersion` từ bản ghi `User` của Host.
  - Khi tham gia qua mã mời ([`src/app/api/invites/[code]/join/route.ts:186–205`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/invites/%5Bcode%5D/join/route.ts#L186–L205)): Không truyền trường ngân hàng $\rightarrow$ `bank_account_no` là `NULL`, `bank_account_key_version` nhận `1` theo `DEFAULT 1`.
  - Khi Host tạo thành viên ảo ([`src/app/api/trips/[id]/members/route.ts:257–265`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/trips/%5Bid%5D/members/route.ts#L257–L265)): `bank_account_no` là `NULL`, `bank_account_key_version` nhận `1`.
  - Khi Host duyệt claim nhận diện ([`src/app/api/trips/[id]/claims/[claimId]/decision/route.ts:152–154`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/trips/%5Bid%5D/claims/%5BclaimId%5D/decision/route.ts#L152–L154)): Đặt `bankBin: null, bankAccountNo: null, bankAccountName: null` trên bản ghi member theo Rule R13 (thành viên sau khi nhận diện sẽ sử dụng thông tin ngân hàng từ tài khoản User chính thức).
- **Đọc:** Làm nguồn thông tin ngân hàng dự phòng (fallback) trong API thanh toán khi thành viên nhận tiền là thành viên ảo chưa liên kết tài khoản User.

### C. Bảng `bank_claim_snapshots`
- **Ghi:** Khi người dùng gửi yêu cầu claim nhận diện vị trí thành viên ([`src/app/api/trips/[id]/claims/route.ts:128–140`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/trips/%5Bid%5D/claims/route.ts#L128–L140)).
  - Điều kiện kích hoạt: **Chỉ khi user đã có STK** (`if (fullUser?.bankAccountNo)`).
  - Nội dung ghi: Sao chép nguyên văn `bankAccountNoCiphertext: fullUser.bankAccountNo`, kèm `bankBin`, `bankAccountName`, `keyVersion`.
- **Đọc:** Bảng này đóng vai trò bản ghi snapshot lịch sử bất biến tại thời điểm claim. Trong Release 1, không có API nào giải mã hoặc xuất dữ liệu từ bảng này ra ngoài.

### D. Luồng tạo VietQR (`GET /payment-info`)
- Vị trí: [`src/app/api/trips/[id]/transfers/[transferId]/payment-info/route.ts:153–210`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/trips/%5Bid%5D/transfers/%5BtransferId%5D/payment-info/route.ts#L153–L210).
- Quy trình:
  1. Xác thực quyền: Chỉ Người nợ (Debtor) hoặc Trưởng nhóm (Host) mới được xem.
  2. Xác định tài khoản thụ hưởng: Ưu tiên `toUser.bankAccountNo`, dự phòng `toMember.bankAccountNo`.
  3. Giải mã STK trên server qua `decryptBankAccount(rawEncryptedAccount)`.
  4. Tạo payload chuẩn EMVCo VietQR: `buildVietQrPayload({ bankBin, accountNumber: decryptedAccount, amount, memo })`.
  5. Sinh hình ảnh QR Data URL base64 (`generateQrDataUrl`).
  6. Che STK qua `maskBankAccount(decryptedAccount)`.
  7. Trả về DTO an toàn kèm `qrDataUrl` và `bankAccountMasked`. Không trả plaintext hay ciphertext.

---

## 5. Xác minh Bản chất `bank_account_key_version`

> [!IMPORTANT]
> **Xác nhận từ mã nguồn:** Trong triển khai hiện tại của Release 1, cột `bank_account_key_version` **HOÀN TOÀN CHỈ LÀ METADATA**, không hỗ trợ giải mã đa khóa tự động.

### Bằng chứng mã nguồn:
1. Trong hàm `decryptBankAccount(encryptedString: string, options?: { key?: string; keyVersion?: number })` tại [`src/lib/crypto/bank-encryption.ts:87–141`](file:///c:/Users/admin/Downloads/doanweb/src/lib/crypto/bank-encryption.ts#L87–L141):
   - Mặc dù interface có khai báo tham số `options?.keyVersion`, tham số này **hoàn toàn không được sử dụng** trong logic của hàm.
   - Dòng 123 chỉ thực hiện: `const key = getEncryptionKey(options?.key);` $\rightarrow$ Luôn luôn lấy duy nhất một khóa từ `process.env.BANK_ENCRYPTION_KEY`.
2. **Không tồn tại bảng tra cứu đa khóa:** Không có logic đọc `BANK_ENCRYPTION_KEY_V1`, `BANK_ENCRYPTION_KEY_V2` trong runtime.
3. **Cơ chế xoay khóa:** Được thiết kế theo mô hình thủ công qua script bảo trì một lần (chạy offline giải mã bằng key cũ và mã hóa lại bằng key mới khi cần nâng cấp phiên bản). Không có cơ chế xoay khóa động (zero-downtime automated rotation).

---

## 6. Kiểm tra Automated Tests Hiện có

Đã chạy toàn bộ 45 unit test liên quan đến mã hóa và bảo mật thông tin ngân hàng trong môi trường kiểm thử cục bộ:

```bash
npm test -- src/lib/crypto/bank-encryption.test.ts src/app/api/me/route.test.ts src/app/api/trips/[id]/transfers/[transferId]/payment-info/route.test.ts
```

### Kết quả kiểm thử:
```text
 RUN  v5.0.5 C:/Users/admin/Downloads/doanweb

 ✓ src/lib/crypto/bank-encryption.test.ts (22 tests) 14ms
 ✓ src/app/api/me/route.test.ts (12 tests) 26ms
 ✓ src/app/api/trips/[id]/transfers/[transferId]/payment-info/route.test.ts (11 tests) 253ms

 Test Files  3 passed (3)
      Tests  45 passed (45)
   Start at  14:46:24
   Duration  771ms (import 54%, tests 33%, transform 11%, worker 2%)
```

- **Xác thực khóa:** Kiểm thử thành công chấp nhận khóa hex 64 ký tự, UTF-8 32 bytes, Base64 32 bytes; từ chối fail-closed khóa thiếu, rỗng hoặc sai độ dài.
- **Tính toàn vẹn (Tamper resistance):** Kiểm thử thành công phát hiện và ném lỗi fail-closed khi 1 bit ciphertext hoặc 1 bit authTag bị thay đổi.
- **Khóa sai:** Xác nhận khi giải mã bằng khóa khác với khóa đã dùng để mã hóa, hàm ném lỗi `Decryption failed: authentication tag mismatch, tampered data, or incorrect key.`
- **API Guard:** Xác nhận `PATCH /api/me` fail-closed trả về HTTP 500 và không cập nhật DB khi thiếu key.

---

## 7. Đối chiếu Dữ liệu & Phân biệt Trạng thái Xác minh

### A. Đối chiếu kết quả SQL do Người dùng cung cấp
Tại thời điểm người dùng thực hiện truy vấn SQL chỉ đọc trên Supabase Production (`fzdaasbckmnndqzqopex`):

| Bảng | Tổng số dòng | Số dòng có `bank_account_no` | Số dòng có `bank_account_key_version` | Tình trạng |
| :--- | :---: | :---: | :---: | :--- |
| `users` | 4 | **0** | 4 (`= 1`) | 4 users tạo qua Google OAuth, `bank_account_no` là NULL. |
| `trip_members` | 3 | **0** | 3 (`= 1`) | 3 thành viên chuyến đi, `bank_account_no` là NULL. |
| `bank_claim_snapshots` | 0 | **0** | 0 | Trống (chưa có claim nào phát sinh snapshot). |

### B. Phân định ranh giới xác minh (Verified vs Unverified)
1. **Những điều ĐÃ XÁC MINH chắc chắn từ Mã nguồn:**
   - Cột `bank_account_key_version` luôn nhận giá trị `1` do ràng buộc DDL `INTEGER NOT NULL DEFAULT 1` và Better Auth `defaultValue: 1`, **kể cả khi `bank_account_no` là `NULL`**. Đây là lý do vì sao 4 users và 3 trip_members có `key_version = 1` mà không có số tài khoản.
   - Khi `bank_account_no` là `NULL`, hệ thống không lưu bất kỳ ciphertext nào.
   - Code yêu cầu khóa 256-bit (chuỗi hex 64 ký tự), fail-closed nếu thiếu key.
2. **Những điều CHƯA THỂ XÁC MINH trực tiếp từ phiên làm việc này:**
   - Agent **không kết nối trực tiếp** tới database Supabase Production theo thời gian thực (real-time live verification) để bảo đảm nguyên tắc bảo mật. Dữ liệu trên được giả định dựa trên kết quả truy vấn SQL do người dùng cung cấp tại thời điểm kiểm tra.
   - Agent **không có quyền truy cập Vercel Dashboard** để kiểm tra giá trị hiện tại của biến `BANK_ENCRYPTION_KEY` trên Production.

---

## 8. Đánh giá Rủi ro và Điều kiện Tiên quyết

### A. Đánh giá Rủi ro
- **Giả định:** Database Production giữ nguyên trạng thái như kết quả SQL người dùng cung cấp (không có dòng nào có STK).
- **Rủi ro mất dữ liệu giải mã:** **Rất thấp (tiệm cận 0%)** vì không có bản ghi ciphertext nào cần giải mã trong database.
- **Rủi ro vận hành:**
  - Nếu người dùng nhập key trên Vercel có khoảng trắng thừa, ký tự xuống dòng (`\n`), hoặc độ dài khác 64 ký tự hex $\rightarrow$ API `PATCH /api/me` sẽ trả về lỗi 500 khi người dùng thực hiện cập nhật STK.
  - Nếu không cấu hình `BANK_ENCRYPTION_KEY` trên Vercel Production $\rightarrow$ Ứng dụng vẫn khởi động, nhưng tính năng lưu STK sẽ báo lỗi 500.

### B. Điều kiện Tiên quyết trước khi cấu hình trên Vercel
1. Khóa phải có độ dài chính xác **64 ký tự hex** (`/^[0-9a-fA-F]{64}$/`).
2. Khóa phải được sinh ngẫu nhiên an toàn qua CSPRNG:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. Cấu hình vào biến `BANK_ENCRYPTION_KEY` trên Vercel (Scope: **Production**).
4. **Tuyệt đối không có tiền tố `NEXT_PUBLIC_`**.

---

## 9. Kết luận Đợt Kiểm toán

### Kết luận chính thức:
🟡 **READY FOR PROVISIONING (NEEDS MANUAL DASHBOARD VERIFICATION)**

Hệ thống mã nguồn của Smart Trip đã hoàn toàn sẵn sàng tiếp nhận cấu hình `BANK_ENCRYPTION_KEY`. Không phát hiện bất kỳ xung đột schema hay lỗi logic nào trong mã nguồn. Chủ dự án có thể tiến hành cấu hình khóa 64 ký tự hex trên Vercel Production theo hướng dẫn đã nêu.
