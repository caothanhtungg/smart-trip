# Phase 3ZZ-KEY — Production BANK_ENCRYPTION_KEY Safety Audit

- **Dự án:** Smart Trip & Expense Planner
- **Mã định danh:** Phase 3ZZ-KEY
- **Thời gian thực hiện:** 26/10/2026
- **Trạng thái:** ✅ **HOÀN THÀNH — PRODUCTION KEY PROVISIONING READY**
- **Môi trường đối chiếu:**
  - Supabase Production Ref: `fzdaasbckmnndqzqopex`
  - Supabase Staging Ref: `rwvptwjpfhtfkiwboexz`
  - Production Domain: `https://www.tungcloud.online`
  - Branch chuẩn bị phát hành: `staging/release-1-preview` $\rightarrow$ `main`

---

## 1. Mục tiêu & Phạm vi kiểm tra

Mục tiêu của cuộc kiểm tra read-only này là xác minh toàn diện cơ chế mã hóa thông tin tài khoản ngân hàng trong mã nguồn ứng dụng trước khi thiết lập biến môi trường `BANK_ENCRYPTION_KEY` trên Production:
1. Rà soát tất cả vị trí đọc, xác thực, mã hóa và giải mã liên quan đến `BANK_ENCRYPTION_KEY`.
2. Xác minh chính xác thuật toán mã hóa, định dạng khóa hợp lệ, cấu trúc ciphertext và hành vi khi khóa không hợp lệ hoặc bị thiếu.
3. Làm rõ bản chất và hành vi của cột `bank_account_key_version` đối với các bản ghi người dùng (`users`) và thành viên chuyến đi (`trip_members`).
4. Giải thích hiện trạng dữ liệu trên database Supabase Production (`fzdaasbckmnndqzqopex`) qua kết quả truy vấn SQL chỉ đọc.
5. Đánh giá rủi ro khi thiết lập khóa Production mới và hướng dẫn cấu hình an toàn cho chủ dự án.

---

## 2. File và dòng code liên quan trong Codebase

Toàn bộ luồng mã hóa, giải mã và quản lý thông tin ngân hàng được triển khai tại các vị trí mã nguồn cụ thể sau:

| File | Dòng code | Mục đích & Trách nhiệm |
| :--- | :--- | :--- |
| [`src/lib/crypto/bank-encryption.ts`](file:///c:/Users/admin/Downloads/doanweb/src/lib/crypto/bank-encryption.ts) | L3–7 | Định nghĩa thuật toán `aes-256-gcm`, độ dài IV (12 bytes), Auth Tag (16 bytes), `CURRENT_BANK_KEY_VERSION = 1`. |
| [`src/lib/crypto/bank-encryption.ts`](file:///c:/Users/admin/Downloads/doanweb/src/lib/crypto/bank-encryption.ts) | L13–43 | Hàm `getEncryptionKey()`: Điểm runtime duy nhất đọc `process.env.BANK_ENCRYPTION_KEY`, xác thực độ dài 32 bytes (64 ký tự hex / UTF-8 / Base64). Fail-closed nếu thiếu hoặc sai định dạng. |
| [`src/lib/crypto/bank-encryption.ts`](file:///c:/Users/admin/Downloads/doanweb/src/lib/crypto/bank-encryption.ts) | L54–80 | Hàm `encryptBankAccount()`: Sinh ngẫu nhiên IV 12 bytes, mã hóa AES-256-GCM, sinh authTag 16 bytes, đóng gói định dạng `iv:authTag:ciphertext`. |
| [`src/lib/crypto/bank-encryption.ts`](file:///c:/Users/admin/Downloads/doanweb/src/lib/crypto/bank-encryption.ts) | L87–141 | Hàm `decryptBankAccount()`: Tách 3 phần hex, xác thực độ dài IV/AuthTag, kiểm tra tính toàn vẹn (integrity), giải mã UTF-8. Ném lỗi bảo mật nếu sai khóa hoặc can thiệp dữ liệu. |
| [`src/lib/crypto/bank-encryption.ts`](file:///c:/Users/admin/Downloads/doanweb/src/lib/crypto/bank-encryption.ts) | L147–154 | Hàm `maskBankAccount()`: Che số tài khoản an toàn dạng `**** **** 1234` cho giao diện người dùng. |
| [`src/app/api/me/route.ts`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/me/route.ts) | L45–55 | `GET /api/me`: Giải mã `dbUser.bankAccountNo` an toàn (bọc `try/catch` fail-safe). Trả về `bankAccountMasked`, không bao giờ trả plaintext hoặc ciphertext. |
| [`src/app/api/me/route.ts`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/me/route.ts) | L103–128 | `PATCH /api/me`: Nhận STK mới, gọi `encryptBankAccount()`. Nếu thiếu key, ném lỗi 500 và không cập nhật DB (fail-closed). Hỗ trợ gỡ bỏ STK (`bankAccountNo: null`). |
| [`src/app/api/trips/route.ts`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/trips/route.ts) | L218–231 | `POST /api/trips`: Sao chép `bankBin`, `bankAccountNo` (ciphertext), `bankAccountName`, `bankAccountKeyVersion` từ User sang Host Member. |
| [`src/app/api/invites/[code]/join/route.ts`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/invites/%5Bcode%5D/join/route.ts) | L186–205 | `POST /api/invites/[code]/join`: Thành viên tham gia qua link mời; không truyền trường ngân hàng $\rightarrow$ nhận `bankAccountNo = NULL` và `bankAccountKeyVersion = 1` mặc định. |
| [`src/app/api/trips/[id]/members/route.ts`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/trips/%5Bid%5D/members/route.ts) | L257–265 | `POST /api/trips/[id]/members`: Host tạo thành viên ảo (placeholder); `bankAccountNo = NULL`, `bankAccountKeyVersion = 1` mặc định. |
| [`src/app/api/trips/[id]/claims/route.ts`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/trips/%5Bid%5D/claims/route.ts) | L128–140 | `POST /api/trips/[id]/claims`: Khi gửi claim nhận diện, chỉ tạo bản ghi snapshot trong `bank_claim_snapshots` nếu user đã có STK (`if (fullUser?.bankAccountNo)`). |
| [`src/app/api/trips/[id]/claims/[claimId]/decision/route.ts`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/trips/%5Bid%5D/claims/%5BclaimId%5D/decision/route.ts) | L148–156 | `POST /api/trips/[id]/claims/[claimId]/decision` (APPROVE): Khi Host duyệt claim, xóa thông tin ngân hàng tạm trên `trip_members` (`bankAccountNo: null`) theo Rule R13. |
| [`src/app/api/trips/[id]/transfers/[transferId]/payment-info/route.ts`](file:///c:/Users/admin/Downloads/doanweb/src/app/api/trips/%5Bid%5D/transfers/%5BtransferId%5D/payment-info/route.ts) | L153–181 | `GET /payment-info`: Đọc STK người nhận, giải mã trên server để tạo chuỗi VietQR và QR Data URL. Fail-closed trả về HTTP 500 nếu giải mã lỗi, không rò rỉ secret. |
| [`src/lib/auth.ts`](file:///c:/Users/admin/Downloads/doanweb/src/lib/auth.ts) | L27–31 | Cấu hình Better Auth: `bankAccountKeyVersion: { type: "number", required: false, defaultValue: 1 }`. |
| [`prisma/schema.prisma`](file:///c:/Users/admin/Downloads/doanweb/prisma/schema.prisma) | L71–73, 160–162, 211–213 | Khai báo schema: `bankAccountNo String? @db.VarChar(255)`, `bankAccountKeyVersion Int @default(1)`. Bảng `bank_claim_snapshots` lưu `bankAccountNoCiphertext String @db.VarChar(255)`. |
| [`prisma/migrations/0001_release1_schema/migration.sql`](file:///c:/Users/admin/Downloads/doanweb/prisma/migrations/0001_release1_schema/migration.sql) | L30–32, 112–114, 140–142 | PostgreSQL DDL: `"bank_account_no" VARCHAR(255)`, `"bank_account_key_version" INTEGER NOT NULL DEFAULT 1`, `"bank_account_no_ciphertext" VARCHAR(255) NOT NULL`. |
| [`.env.example`](file:///c:/Users/admin/Downloads/doanweb/.env.example) | L41 | Mẫu cấu hình: `BANK_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"`. |

---

## 3. Thuật toán và Định dạng Key đã xác minh

### A. Thuật toán mã hóa đối xứng
- **Thuật toán:** `AES-256-GCM` (`aes-256-gcm`).
- **Độ dài khóa:** Bắt buộc chính xác **32 bytes (256 bits)**.
- **Initialization Vector (IV/Nonce):** 12 bytes (96 bits) chuẩn NIST, sinh ngẫu nhiên độc lập cho mỗi lần mã hóa qua `crypto.randomBytes(12)`. Đảm bảo hai lần mã hóa cùng một số tài khoản sẽ tạo ra hai ciphertext hoàn toàn khác nhau (ngăn chặn phân tích tần suất).
- **Authentication Tag:** 16 bytes (128 bits) trích xuất từ GCM cipher, đảm bảo tính toàn vẹn và chống giả mạo dữ liệu.

### B. Định dạng Key được chấp nhận & Cách Parse
Hàm `getEncryptionKey(overrideKey?: string): Buffer` tại [`src/lib/crypto/bank-encryption.ts:13-43`](file:///c:/Users/admin/Downloads/doanweb/src/lib/crypto/bank-encryption.ts#L13-L43) kiểm tra và chuyển đổi khóa theo thứ tự ưu tiên:
1. **Chuỗi Hex 64 ký tự (Khuyến nghị bảo mật cao nhất — Chuẩn Production):**
   - Kiểm tra bằng biểu thức chính quy: `/^[0-9a-fA-F]{64}$/.test(rawKey)`.
   - Parse: `Buffer.from(rawKey, "hex")` $\rightarrow$ trả về chính xác 32 bytes binary.
2. **Chuỗi UTF-8 đúng 32 ký tự (32 bytes):**
   - Parse: `const utf8Buf = Buffer.from(rawKey, "utf8"); if (utf8Buf.length === 32) return utf8Buf;`.
3. **Chuỗi Base64 giải mã ra đúng 32 bytes:**
   - Parse: `Buffer.from(rawKey, "base64")` thỏa mãn độ dài 32 bytes.
4. **Trường hợp không hợp lệ:**
   - Ném ngoại lệ fail-closed: `[Security] BANK_ENCRYPTION_KEY must be exactly 32 bytes (256 bits). Expected 64 hex characters or 32-byte string, got length ${rawKey.length}.`

### C. Định dạng Ciphertext lưu trữ
Ciphertext được lưu trong cột `bank_account_no` (và `bank_account_no_ciphertext`) dưới dạng chuỗi gồm 3 trường phân tách bằng dấu hai chấm `:`:
$$\mathbf{iv:authTag:ciphertext}$$
- `iv`: 24 ký tự hex (12 bytes).
- `authTag`: 32 ký tự hex (16 bytes).
- `ciphertext`: Chuỗi hex độ dài chẵn tương ứng với các byte UTF-8 của số tài khoản.
- *Ví dụ:* Một STK 10 chữ số sẽ có độ dài chuỗi lưu trữ là $24 + 1 + 32 + 1 + 20 = 78$ ký tự, nằm gọn trong giới hạn `VARCHAR(255)`.

### D. Bản chất của `bank_account_key_version`
- Cột `bank_account_key_version` hiện tại đóng vai trò là **metadata đánh dấu phiên bản khóa** (mặc định = 1).
- Trong runtime code hiện tại, hàm `decryptBankAccount(encryptedString, options)` nhận tham số tùy chọn `keyVersion` nhưng **chưa sử dụng để rẽ nhánh nhiều khóa khác nhau**. Quá trình giải mã luôn dùng khóa hiện hành từ `getEncryptionKey()`.
- Ràng buộc cơ sở dữ liệu là `INTEGER NOT NULL DEFAULT 1`. Vì vậy, mọi bản ghi người dùng mới sinh ra đều tự động mang giá trị `1`.

---

## 4. Phân tích Hiện trạng Dữ liệu và Đánh giá Rủi ro

### A. Đối chiếu Dữ liệu Supabase Production (`fzdaasbckmnndqzqopex`)
Dựa trên kết quả truy vấn SQL read-only đã thực hiện trên Supabase Production:

| Bảng | Tổng số bản ghi | Số bản ghi có `bank_account_no` (Ciphertext) | Số bản ghi có `key_version` | Tình trạng thực tế |
| :--- | :---: | :---: | :---: | :--- |
| `users` | 4 | **0** (100% `NULL`) | 4 (`= 1`) | 4 tài khoản tạo qua Google OAuth khi test login. Chưa từng cập nhật STK. |
| `trip_members` | 3 | **0** (100% `NULL`) | 3 (`= 1`) | 3 thành viên chuyến đi được tạo tự động. Chưa có STK. |
| `bank_claim_snapshots` | 0 | **0** | 0 | Không có bản ghi snapshot nào tồn tại. |

### B. Phân biệt giữa Xác minh Code và Xác minh Dữ liệu
1. **Đã xác minh chắc chắn từ Code:**
   - Khi đăng nhập Google OAuth lần đầu, Better Auth tạo user chỉ với thông tin profile (name, email, image). Cột `bank_account_no` nhận `NULL`, nhưng `bank_account_key_version` nhận `1` theo `defaultValue: 1` và `INTEGER NOT NULL DEFAULT 1` của PostgreSQL DDL.
   - Khi tạo chuyến đi hoặc tham gia qua mã mời, `trip_members` tương tự nhận `bank_account_no = NULL` và `bank_account_key_version = 1`.
   - Bảng `bank_claim_snapshots` chỉ được chèn dữ liệu khi user đã có STK (`if (fullUser?.bankAccountNo)`). Do user chưa có STK, bảng này hoàn toàn trống (0 rows).
2. **Đã xác minh chắc chắn từ Dữ liệu Production:**
   - 100% bản ghi trên bảng `users` và `trip_members` đều có `bank_account_no IS NULL`.
   - Hoàn toàn **không có bất kỳ ciphertext nào** tồn tại trong database Production.

### C. Kết luận Đánh giá Rủi ro
$$\mathbf{RỦI\ RO\ MẤT\ KHẢ\ NĂNG\ GIẢI\ MÃ\ DỮ\ LIỆU = 0\%}$$
- Việc thiết lập một `BANK_ENCRYPTION_KEY` mới tinh (chuỗi 64 ký tự hex) cho môi trường Production **hoàn toàn an toàn 100%**.
- Không có bất kỳ dữ liệu lịch sử nào phụ thuộc vào bất kỳ khóa bí mật cũ nào trước đây. Chủ dự án không cần tìm lại hoặc khôi phục khóa cũ.

---

## 5. Điều kiện tiên quyết trước khi cấu hình Production Key

Trước khi cấu hình biến môi trường trên Vercel Production, khóa được chọn phải thỏa mãn nghiêm ngặt các tiêu chuẩn kỹ thuật sau:
1. **Độ dài và Định dạng:** Chuỗi Hex đúng 64 ký tự (chỉ bao gồm `0-9`, `a-f`, `A-F`), không chứa khoảng trắng ở hai đầu, không chứa ký tự xuống dòng (`\r`, `\n`).
2. **Độ ngẫu nhiên (Entropy):** Phải được sinh ra từ bộ sinh số ngẫu nhiên an toàn mật mã (CSPRNG), ví dụ thông qua module `crypto` của Node.js hoặc OpenSSL. Tuyệt đối không dùng mật khẩu hoặc chuỗi do người tự gõ.
3. **Phạm vi bảo mật (Scope):**
   - Biến môi trường chỉ ở phía Server (Server-only).
   - **Tuyệt đối KHÔNG có tiền tố `NEXT_PUBLIC_`** để ngăn chặn việc Next.js đóng gói khóa vào client bundle.
   - Trên Vercel, biến chỉ được gán vào phạm vi môi trường **Production** (và **Preview** nếu cần).

---

## 6. Hướng dẫn Thao tác Thủ công Tiếp theo cho Chủ Dự án

> [!IMPORTANT]
> Toàn bộ thao tác dưới đây do Chủ dự án tự thực hiện trực tiếp trên Vercel Dashboard. Agent hoàn toàn không tự ý can thiệp hoặc thay đổi cấu hình môi trường.

### Bước 1: Sinh khóa bảo mật 256-bit chuẩn Hex 64 ký tự
Chạy lệnh sau trên terminal máy cục bộ của bạn để tạo chuỗi khóa ngẫu nhiên an toàn:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
*(Kết quả sẽ là một chuỗi gồm 64 ký tự hex, ví dụ dạng `a3f8...`)*.

### Bước 2: Cấu hình biến môi trường trên Vercel
1. Truy cập vào **[Vercel Dashboard](https://vercel.com/)** $\rightarrow$ Chọn Project **Smart Trip** (`doanweb`).
2. Điều hướng tới **Settings** $\rightarrow$ **Environment Variables**.
3. Thêm biến môi trường mới:
   - **Key:** `BANK_ENCRYPTION_KEY`
   - **Value:** Dán chuỗi 64 ký tự hex vừa sinh ở Bước 1.
   - **Environment:** Chọn tick **Production** (và **Preview** nếu cần đồng bộ).
4. Nhấn **Save**.

### Bước 3: Xác minh Zero-Knowledge (Kiểm tra hợp lệ mà không in secret)
Bạn có thể kiểm tra tính hợp lệ về độ dài và regex của khóa trên máy cục bộ trước khi lưu mà không in giá trị ra màn hình:
```bash
node -e 'const k = process.env.TEMP_KEY || ""; const valid = /^[0-9a-fA-F]{64}$/.test(k.trim()); console.log("Is 256-bit Hex Key:", valid, "Length:", k.trim().length);'
```

---

## 7. Kết quả Kiểm thử Tự động (Offline Unit Tests)

Đã chạy toàn bộ bộ test tự động liên quan đến mã hóa, hồ sơ người dùng và thanh toán VietQR trên môi trường offline cục bộ:

```bash
npm test -- src/lib/crypto/bank-encryption.test.ts src/app/api/me/route.test.ts src/app/api/trips/[id]/transfers/[transferId]/payment-info/route.test.ts
```

**Kết quả thực thi:**
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
- **22/22 tests passed** trong `bank-encryption.test.ts`: Xác nhận tính đúng đắn của hàm trích xuất key (hex 64, utf8 32, base64), round-trip mã hóa/giải mã, IV ngẫu nhiên, chống can thiệp dữ liệu (tamper resistance) và che STK (`maskBankAccount`).
- **12/12 tests passed** trong `api/me/route.test.ts`: Xác nhận cơ chế fail-closed ngăn chặn ghi database khi thiếu khóa, và giải mã an toàn cho profile.
- **11/11 tests passed** trong `payment-info/route.test.ts`: Xác nhận giải mã an toàn trên server để tạo mã QR VietQR mà không làm rò rỉ ciphertext hay secret.

---

## 8. Tuyên bố Tuân thủ An toàn Tuyệt đối

Chúng tôi xác nhận và bảo đảm:
1. **Không kết nối hoặc thực thi bất kỳ truy vấn DDL, DML hay can thiệp dữ liệu nào** vào Supabase Production (`fzdaasbckmnndqzqopex`).
2. **Không tạo, sửa hoặc đọc lén bất kỳ secret nào** từ Vercel hoặc các tệp cấu hình bảo mật.
3. **Không tự tạo hoặc ghi đè khóa** trên bất kỳ môi trường triển khai nào.
4. **Không chạy migration, không seed, không cleanup dữ liệu**.
5. **Không thực hiện git commit, git stage, git merge vào `main` hay push lên remote repository**.
6. Báo cáo này hoàn toàn độc lập, trung thực, dựa trên 100% bằng chứng mã nguồn đã kiểm chứng.
