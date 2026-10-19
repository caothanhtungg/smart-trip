# Smart Trip — Phase 3 Backend Architecture Plan

> **Trạng thái:** CHỜ NGƯỜI DÙNG DUYỆT (PLAN ONLY — CHƯA DUYỆT)  
> **Ngày rà soát & cập nhật:** 19/10/2026  
> **Phạm vi:** Kế hoạch kiến trúc Backend bền vững cho Release 1; TUYỆT ĐỐI CHƯA triển khai code, chưa cài đặt package, chưa tạo migration hay kết nối database.

---

## 1. Căn cứ và trạng thái repository hiện tại

- **Stack hiện tại:** Next.js 16.4.2 (App Router), React 19.3.0, TypeScript strict, Tailwind CSS 4, npm, Vitest 5.
- **Hiện trạng:** Chưa có Prisma, Auth.js / Better Auth, Zod hay PostgreSQL connection. Dữ liệu frontend đang chạy hoàn toàn trên mock adapters và in-memory React Context.
- **Module domain tái sử dụng:**
  - Tiền tệ & chia nợ: `src/lib/money/split.ts`, `src/lib/money/simplify.ts`, `src/lib/money/settlement.ts`.
  - Validation: `src/lib/validation/expense.ts`, `src/lib/validation/itemized-expense.ts`.
  - Mã mời & xem trước: `src/lib/trips/invite-code.ts`, `src/lib/trips/invite-preview.ts`.
  - Types: `src/types/trip.ts`, `src/types/settlement.ts`, `src/types/user.ts`.
- **Kiểm tra chất lượng hiện tại:** `npm test` đạt 21 test files / 280 tests passed; TypeScript (`tsc --noEmit`) và ESLint đạt 100% không lỗi.

---

## 2. Kiến trúc đích và ranh giới hệ thống

```text
[React Client / UI]
       │
       ▼ (Fetch / API Client)
[Route Handler] (Session extraction, Zod schema validation, safe error envelopes)
       │
       ▼
[Application Service] (Authorization, business invariants, cross-table transactions)
       │
       ▼
[Domain Logic] (Money integer math, split remainder join_order, settlement simplify)
       │
       ▼
[Prisma Repository] (Prisma Client queries, connection pooling)
       │
       ▼
[PostgreSQL Database] (Supabase Singapore ap-southeast-1, CHECK constraints, FK cascade rules)
```

### Nguyên tắc bất biến về định danh và quyền:
1. `users` đại diện cho identity toàn hệ thống (tài khoản đã đăng nhập).
2. `trip_members` đại diện cho identity trong một chuyến đi cụ thể.
3. Người trả tiền (`payer`), người nợ (`debtor`), người nhận (`creditor`) **luôn tham chiếu `trip_members.id`**, vì thành viên có thể chưa có tài khoản (`user_id = NULL`).
4. **Không tin tưởng dữ liệu từ client:** Server không bao giờ tin `userId`, `memberId`, `isHost` hay role gửi từ client. Mọi request đều lấy identity từ Session cookie bảo mật, sau đó truy vấn DB để xác thực tư cách thành viên và vai trò trong chuyến đi.
5. **Tiền tệ:** Luôn dùng số nguyên VND (`integer`), không dùng số thực (`float`).

---

## 3. Các quyết định kiến trúc quan trọng (CHỜ DUYỆT)

### 3.1. Thư viện xác thực: So sánh Better Auth và Auth.js (NextAuth v5 beta)

Bối cảnh: Auth.js hiện tại gần như chỉ còn phát hành các bản vá bảo mật, đội ngũ phát triển Auth.js khuyến nghị các dự án mới nên sử dụng **Better Auth**.

| Tiêu chí | Better Auth (Khuyến nghị đề xuất) | Auth.js (NextAuth v5 beta) |
|---|---|---|
| **Tình trạng dự án** | Đang phát triển rất tích cực, hiện đại, TypeScript-first. | Ở trạng thái beta kéo dài, tiến độ chậm, chủ yếu bảo trì bảo mật. |
| **Hỗ trợ Next.js 16.4.2** | Tương thích hoàn toàn Route Handlers (`/api/auth/[...all]`), hỗ trợ Server Actions & Client Components. | Hỗ trợ Route Handlers (`/api/auth/[...nextauth]`), cơ chế wrapper session phức tạp. |
| **Next.js `proxy.ts` (thay `middleware.ts`)** | Tương thích tốt với mô hình routing mới của Next.js 16; bảo vệ route tại tầng Server Components / Service. | Phụ thuộc nhiều vào cơ chế middleware cũ (`auth()` wrapper). |
| **Bảng cơ sở dữ liệu tạo ra** | 4 bảng: `user`, `session`, `account`, `verification`. | 4 bảng: `User`, `Account`, `Session`, `VerificationToken`. |
| **Kiểu định danh (ID)** | Mặc định String; ánh xạ dễ dàng sang `UUID` (`@default(uuid()) @db.Uuid`) trong Prisma. | Mặc định String (cuid); cấu hình được UUID trong Prisma. |
| **Cách mở rộng cột STK ngân hàng** | Cấu hình qua `user.additionalFields` trong config + khai báo cột trong Prisma model `User`. Hỗ trợ type inference tự động. | Thêm cột vào Prisma model `User` + phải tự viết file declaration mở rộng type (`next-auth.d.ts`). |
| **Hệ quả đối với ERD** | Cần bổ sung bảng `accounts` (lưu Google OAuth token) và `sessions` (quản lý phiên đăng nhập) vào ERD. | Tương tự, cần bổ sung `accounts` và `sessions` vào ERD. |

- **Đề xuất:** Chọn **Better Auth**.
- **Trạng thái:** **CHỜ NGƯỜI DÙNG DUYỆT**.

---

### 3.2. Chuẩn hóa mã mời chuyến đi (Invite Code)

Theo quyết định đã duyệt, mã mời giữ nguyên độ dài cột `varchar(13)` trong ERD:
- **Quy tắc sinh mã ở Server:**
  - Sinh đúng 12 ký tự ngẫu nhiên bằng bộ sinh số ngẫu nhiên an toàn mã hóa: `crypto.randomBytes` hoặc `crypto.getRandomValues`.
  - Bảng ký tự loại bỏ triệt để ký tự dễ nhầm lẫn (Base31): bỏ số `0`, chữ `O`, số `1`, chữ `I`, chữ `L`. Bảng ký tự chuẩn: `23456789ABCDEFGHJKMNPQRSTUVWXYZ`.
  - Định dạng lưu trữ và hiển thị: `XXXXXX-XXXXXX` (gồm 6 ký tự - dấu gạch nối - 6 ký tự = đúng 13 ký tự, khớp hoàn hảo `varchar(13)`).
- **Chuẩn hóa đầu vào khi tra cứu (Input normalization):**
  - Loại bỏ toàn bộ dấu gạch ngang (`-`) và khoảng trắng (`\s`).
  - Chuyển thành chữ in hoa (`toUpperCase()`).
  - Kiểm tra độ dài chuỗi sau lọc: đúng 12 ký tự hợp lệ thuộc bảng ký tự Base31.
  - Tự động chèn lại dấu gạch ngang sau ký tự thứ 6 (`${code.slice(0, 6)}-${code.slice(6, 12)}`) trước khi truy vấn database.
- **Danh sách file cần cập nhật (Chưa sửa mã nguồn — chỉ lên kế hoạch):**
  1. `src/lib/trips/invite-code.ts` (thuật toán validate và format).
  2. `src/lib/mock/trips.ts` & `src/lib/mock-trips.ts` (các mã mock hiện tại như `DALAT2026` cần chuyển thành dạng `XXXXXX-XXXXXX`).
  3. `tests/trips/invite-code.test.mjs` (bổ sung test case 12 ký tự Base31 có gạch nối).
  4. `src/lib/trips/trips-store-context.tsx` (hiện đang dùng `Math.random` sinh mã 5-5 cần thay thế bằng chuẩn mới).

---

### 3.3. Mô hình hóa phụ phí (Surcharge Persistence)

Giao diện thực tế của Smart Trip (thiết kế Stitch & Phase 2D.2) **chỉ có duy nhất một dòng nhập phụ phí** cho khoản chi chia theo món (itemized expense).

| Phương án | Mô tả | Ưu điểm | Nhược điểm |
|---|---|---|---|
| **Phương án A** | Thêm cột `item_type` (`ITEM` / `SURCHARGE`) vào bảng `expense_items`. | Tái sử dụng bảng có sẵn, không thêm bảng mới. | Phá vỡ tính toàn vẹn quan hệ (dòng phụ phí không có `expense_item_members`), logic query và CHECK constraint phức tạp. |
| **Phương án B** | Tạo bảng riêng `expense_surcharges(id, expense_id, name, amount)`. | Tách bạch rõ ràng; mở rộng được nhiều dòng phụ phí. | Thừa thãi so với Release 1; tăng thêm 1 bảng, thêm migration và join không cần thiết. |
| **Phương án C (Khuyến nghị đề xuất)** | Thêm cột `surcharge_amount integer NOT NULL DEFAULT 0` có ràng buộc `CHECK (surcharge_amount >= 0)` vào bảng `expenses`. | Khớp 100% với UI đơn dòng thực tế; cực kỳ gọn gàng; kiểm tra invariant tiền tệ tức thì: `amount = sum(items) + surcharge_amount`. | Chỉ hỗ trợ 1 phụ phí trong Release 1 (nếu tương lai cần nhiều phụ phí mới cần tách bảng). |

- **Quy tắc phân bổ phụ phí:** Phụ phí chỉ phân bổ cho các thành viên có ít nhất một món ăn trong khoản chi; chia đều tiền phụ phí, phần dư nguyên (remainder) phân bổ theo thứ tự `join_order`.
- **Đề xuất:** Chọn **Phương án C**.
- **Trạng thái:** **CHỜ NGƯỜI DÙNG DUYỆT ĐỂ CẬP NHẬT ERD**.

---

### 3.4. Mã hóa số tài khoản ngân hàng (Bank Account Encryption)

Đề xuất giải pháp đơn giản, thực dụng, bảo mật ở tầng ứng dụng, **bỏ hoàn toàn yêu cầu KMS đám mây** phức tạp và tốn kém:
1. **Thuật toán:** **AES-256-GCM** (Authenticated Encryption) sử dụng module `crypto` có sẵn của Node.js (không cài thư viện ngoài).
2. **Quản lý khóa:** Khóa đối xứng 32-byte (256 bits) sinh ngẫu nhiên an toàn, lưu trong biến môi trường chỉ ở phía server: `BANK_ENCRYPTION_KEY` (chuỗi hex 64 ký tự). **Tuyệt đối không có tiền tố `NEXT_PUBLIC_`**.
3. **Cấu trúc lưu DB:**
   - Cột `bank_account_no varchar(255)`: lưu chuỗi định dạng `iv:authTag:ciphertext` (mỗi lần mã hóa sinh IV ngẫu nhiên 12 bytes qua `crypto.randomBytes(12)`).
   - Cột `bank_account_key_version integer NOT NULL DEFAULT 1`: đánh dấu phiên bản khóa mã hóa.
4. **Quy trình đổi khóa (Key Rotation) thủ công:**
   - Khi cần đổi khóa: Thiết lập khóa mới `BANK_ENCRYPTION_KEY_V2`.
   - Chạy script bảo trì một lần: đọc các bản ghi có `key_version = 1`, giải mã bằng key V1, mã hóa lại bằng key V2 và cập nhật `key_version = 2`.
5. **Kế hoạch ứng phó mất khóa:**
   - Nếu mất biến môi trường `BANK_ENCRYPTION_KEY`, hệ thống bắt ngoại lệ giải mã an toàn và coi như chưa có STK.
   - **Chính sách khôi phục:** Người dùng chỉ cần vào màn hình Cài đặt / Hồ sơ nhập lại số tài khoản ngân hàng của mình (không làm gián đoạn hay ảnh hưởng đến tính toàn vẹn dữ liệu chuyến đi và công nợ).

---

### 3.5. Các bổ sung kỹ thuật quan trọng vào kế hoạch

#### (a) `cacheComponents` và `partialPrefetching` trong `next.config.ts`:
- **Hiện trạng:** Đang được bật (`true`) trong `next.config.ts`.
- **Tác động:** Có thể dẫn đến việc Next.js cache nhầm Server Components chứa dữ liệu động nhạy cảm (session user, số dư nợ, trạng thái chốt sổ), hoặc prefetch dữ liệu khi chưa xác thực.
- **Đề xuất:** **TẮT CẢ HAI** (`cacheComponents: false`, `partialPrefetching: false`) khi bắt đầu Phase 3A để đảm bảo toàn bộ nghiệp vụ tài chính và session chạy ở chế độ **Dynamic Server Rendering** nhất quán 100%.

#### (b) Loại bỏ `generateStaticParams` tại route `join/[code]`:
- File `src/app/(public)/join/[code]/page.tsx` hiện đang đọc mã mời từ mock bằng `generateStaticParams`.
- **Kế hoạch:** Khi chuyển sang backend, mã mời được sinh ngẫu nhiên trong DB, trang phải chuyển thành **Dynamic Route** (`export const dynamic = 'force-dynamic'`), truy vấn trực tiếp qua API service và loại bỏ hoàn toàn `generateStaticParams`.

#### (c) Cơ chế Rate Limiting phù hợp Serverless:
- Vì môi trường serverless không chia sẻ bộ nhớ RAM giữa các instance:
  - **Môi trường Development:** Sử dụng Token Bucket in-memory đơn giản.
  - **Môi trường Production:** Đề xuất sử dụng `@upstash/ratelimit` qua REST API (Upstash Redis free tier), hoặc bảng counter nhẹ trên PostgreSQL/Supabase.
  - **Endpoint áp dụng:**
    - `GET /api/invites/[code]`: Giới hạn tối đa 10 requests / phút / IP để chống brute-force đoán mã mời.
    - `POST /api/trips/:id/claims`: Giới hạn 5 requests / phút / user để chống spam yêu cầu nhận diện.
    - Endpoint đăng nhập auth: Giới hạn theo chuẩn rate limit của Better Auth.

#### (d) Cấu hình Prisma với Supabase:
- **`DATABASE_URL`:** Kết nối qua Supabase Transaction Connection Pooler (PgBouncer/Supavisor, port 6543) cho ứng dụng chạy runtime serverless, ngăn chặn cạn kiệt connection pool.
- **`DIRECT_URL`:** Kết nối trực tiếp (Direct Connection, port 5432) cấu hình trong `prisma/schema.prisma` (`directUrl = env("DIRECT_URL")`) phục vụ riêng cho lệnh CLI chạy migration (`prisma migrate dev`).
- **Nguyên tắc cốt lõi:** **TUYỆT ĐỐI KHÔNG dùng Supabase JS Client (`@supabase/supabase-js`) để truy cập dữ liệu nghiệp vụ**. Toàn bộ truy vấn đọc/ghi đều đi qua Prisma ORM.
- **Vị trí máy chủ:** Chọn vùng **Singapore (`ap-southeast-1`)** để đảm bảo độ trễ thấp nhất về Việt Nam.
- **Danh sách biến môi trường trong `.env.example` (Server-only secrets):**
  ```env
  DATABASE_URL="postgres://postgres.[ref]:[pwd]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  DIRECT_URL="postgres://postgres.[ref]:[pwd]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"
  BETTER_AUTH_SECRET="chuoi-bi-mat-ngau-nhien-32-byte"
  BETTER_AUTH_URL="http://localhost:3000"
  GOOGLE_CLIENT_ID="google-client-id"
  GOOGLE_CLIENT_SECRET="google-client-secret"
  BANK_ENCRYPTION_KEY="64-ky-tu-hex-32-byte"
  ```

#### (e) Tính số dư công nợ trên thành viên đã rời nhóm (`LEFT`):
- Mọi thành viên xuất hiện trong các khoản chi (từng trả tiền hoặc từng tham gia chia tiền) đều phải được đưa vào thuật toán rút gọn nợ, kể cả khi trạng thái hiện tại là `LEFT`.
- **Khẳng định nguyên tắc:** Một thành viên **chỉ được phép rời nhóm (`LEFT`) khi số dư công nợ của họ bằng 0 (`balance = 0`)**. Do đó, tại thời điểm chốt sổ, số dư của thành viên `LEFT` khẳng định bằng 0 và không phát sinh giao dịch chuyển khoản mới (`transfers`).
- **Bổ sung test:** Lập kế hoạch kiểm thử tích hợp chuyên biệt cho trường hợp trip có thành viên `LEFT` nhưng có lịch sử chi tiêu trước đó.

---

## 4. Ma trận quyền và bảo mật (Security Matrix)

Mọi endpoint Route Handler đều phải độc lập kiểm tra session, quyền hạn và phạm vi trip; không bao giờ phụ thuộc vào trạng thái ẩn/hiện nút trên giao diện frontend.

| Hành động | Quyền Server thực thi | Ghi chú & Ràng buộc bảo mật |
|---|---|---|
| **Xem chi tiết / Các tab riêng của Trip** | Thành viên ACTIVE đã liên kết tài khoản. | User có claim PENDING chỉ được xem trạng thái yêu cầu của mình. |
| **Xem trước mã mời (Invite Preview)** | Bất kỳ ai có mã mời hợp lệ (Public). | Chỉ trả về: Tên chuyến đi, điểm đến, ngày đi, tên Trưởng nhóm, tên & avatar thành viên. **Tuyệt đối không lộ lịch trình, chi tiêu, STK ngân hàng**. Áp dụng rate limit. |
| **Tạo khoản chi (Create expense)** | Thành viên ACTIVE trong chuyến đi. | Thành viên thường chỉ được ghi payer là chính mình. Trưởng nhóm (Host) được ghi payer cho bất kỳ thành viên nào (kể cả thành viên chưa có tài khoản). |
| **Sửa / Xóa khoản chi** | Trưởng nhóm HOẶC chính người đã trả tiền (payer). | Chỉ thực hiện được khi chuyến đi ở trạng thái `ACTIVE` (chưa chốt sổ). |
| **Chốt sổ (Lock Settlement)** | Duy nhất Trưởng nhóm (Host). | Chuyến đi phải ở trạng thái `ACTIVE`; chuyển trạng thái sang `SETTLING`. |
| **Mở lại sổ (Reopen Settlement)** | Duy nhất Trưởng nhóm (Host). | Chỉ được mở lại khi **tất cả** các giao dịch chuyển khoản đang ở trạng thái `UNPAID`. |
| **Đánh dấu đã chuyển tiền (Mark paid)** | Chính người nợ (`debtor`). | Trưởng nhóm chỉ được thao tác thay cho thành viên chưa có tài khoản (`user_id = NULL`). |
| **Xác nhận đã nhận tiền (Confirm received)** | Chính người nhận (`creditor`). | Trưởng nhóm chỉ được thao tác thay cho thành viên chưa có tài khoản (`user_id = NULL`). |
| **Duyệt / Từ chối yêu cầu nhận diện (Claim)** | Duy nhất Trưởng nhóm (Host) của trip đó. | Thực hiện trong transaction có lock `FOR UPDATE`. |
| **Xem / Sửa thông tin ngân hàng** | Chính chủ sở hữu tài khoản. | STK đầy đủ chỉ được trả về trong flow thanh toán nợ được ủy quyền (`/api/transfers/:id/payment-info`). |

---

## 5. Ràng buộc cơ sở dữ liệu Prisma / PostgreSQL

| Ràng buộc nghiệp vụ | Triển khai trong Prisma | Ràng buộc custom SQL / Test bắt buộc |
|---|---|---|
| UUID PK, NOT NULL, Enums, Foreign Keys | Khai báo trực tiếp trong `schema.prisma`. | Kiểm tra hành vi `onDelete` (Restrict đối với dữ liệu tài chính). |
| Mã mời duy nhất | `@unique` trên cột `invite_code varchar(13)`. | Format `XXXXXX-XXXXXX`, rate limit tra cứu. |
| Ngày kết thúc >= Ngày bắt đầu | Không hỗ trợ trực tiếp trong Prisma schema. | Thêm `CHECK (end_date >= start_date)` qua migration SQL. |
| Số tiền dương, tỷ lệ chia >= 0 | Không hỗ trợ trực tiếp. | Thêm `CHECK (amount > 0)`, `CHECK (share_amount >= 0)`. |
| Phụ phí không âm | Phương án C: `surcharge_amount integer DEFAULT 0`. | Thêm `CHECK (surcharge_amount >= 0)`. |
| Một Trưởng nhóm duy nhất mỗi trip | `@unique([trip_id, role])` (khi role là HOST). | Partial Unique Index: `WHERE role = 'HOST'`. |
| Một yêu cầu claim pending / user / trip | Không hỗ trợ trực tiếp partial index. | Partial Unique Index: `WHERE status = 'PENDING'`. |
| Một bảng chốt sổ active / trip | Không hỗ trợ trực tiếp partial index. | Partial Unique Index: `WHERE status = 'ACTIVE'`. |
| Người nợ khác người nhận | Không hỗ trợ trực tiếp. | Thêm `CHECK (from_member_id <> to_member_id)`. |
| Thành viên có dữ liệu không được xóa cứng | Không dùng `CASCADE` xóa `trip_members`. | Soft delete / đổi trạng thái `status = 'LEFT'`. |

---

## 6. Lộ trình triển khai Phase 3: Mô hình Lát cắt dọc (Vertical Slices)

Lộ trình được cấu trúc lại hoàn toàn: **Mỗi lát cắt dọc tự xây dựng API và tự nối giao diện tương ứng của nó ngay trong giai đoạn đó** (loại bỏ hoàn toàn giai đoạn 3H riêng biệt). Lát cắt đầu tiên đóng vai trò làm bằng chứng kỹ thuật (Walking Skeleton) chứng minh toàn bộ bộ công nghệ hoạt động thông suốt từ Database đến Giao diện.

```text
[Phase 3A: Môi trường & Database Setup]
       │
       ▼ (Duyệt Gate 3A)
[Phase 3B: Lát cắt 1 - Auth, User, List/Create Trip + Nối UI]  <-- WALKING SKELETON
       │
       ▼ (Duyệt Gate 3B)
[Phase 3C: Lát cắt 2 - Trip Detail, Thành viên, Mã mời chuẩn hóa + Nối UI]
       │
       ▼ (Duyệt Gate 3C)
[Phase 3D: Lát cắt 3 - Lịch trình chuyến đi (Itinerary) + Nối UI]
       │
       ▼ (Duyệt Gate 3D)
[Phase 3E: Lát cắt 4 - Nhận diện thành viên (Claim) & Mã hóa STK + Nối UI]
       │
       ▼ (Duyệt Gate 3E)
[Phase 3F: Lát cắt 5 - Khoản chi, Chia đều, Chia món & Phụ phí + Nối UI]
       │
       ▼ (Duyệt Gate 3F)
[Phase 3G: Lát cắt 6 - Chốt sổ, Rút gọn nợ, VietQR Mock & Thanh toán + Nối UI]
       │
       ▼ (Duyệt Gate 3G)
[Phase 3H: Kiểm thử hồi quy toàn diện, Rà soát bảo mật & Bàn giao Release 1]
```

---

### Chi tiết từng giai đoạn:

#### Phase 3A — Môi trường, Supabase Database & Cấu hình nền tảng
- **Phạm vi:**
  - Cấu hình dự án Supabase vùng Singapore (`ap-southeast-1`).
  - Cài đặt Prisma ORM. Cấu hình `DATABASE_URL` (pooler) và `DIRECT_URL` (direct migration).
  - Tắt `cacheComponents` và `partialPrefetching` trong `next.config.ts`.
  - Cập nhật `.env.example` với danh sách biến môi trường chuẩn.
- **Tiêu chí nghiệm thu:** Kết nối database thành công, chạy thử migration rỗng, không có bí mật nào bị rò rỉ.
- **🛑 ĐIỂM DỪNG CHỜ DUYỆT 3A.**

#### Phase 3B — Lát cắt dọc 1 (Walking Skeleton): Đăng nhập Google, Hồ sơ người dùng & Danh sách / Tạo chuyến đi (Kèm nối UI)
- **Phạm vi:**
  - Tích hợp Better Auth với Google OAuth provider.
  - Prisma models: `User`, `Account`, `Session`, `Trip`.
  - API endpoints: `/api/auth/[...all]`, `GET /api/me`, `GET /api/trips`, `POST /api/trips`.
  - **Nối UI ngay:** Nối trang `/login`, thông tin tài khoản trên Header, danh sách chuyến đi tại `/trips`, và modal tạo chuyến đi mới. Thay thế mock adapter của phần này.
- **Tiêu chí nghiệm thu:** Đăng nhập Google thật thành công -> tạo chuyến đi lưu vào DB -> hiển thị ngay trên UI danh sách chuyến đi. Toàn bộ stack chạy thông suốt.
- **🛑 ĐIỂM DỪNG CHỜ DUYỆT 3B.**

#### Phase 3C — Lát cắt dọc 2: Chi tiết chuyến đi, Quản lý thành viên, Mã mời chuẩn hóa & Xem trước (Kèm nối UI)
- **Phạm vi:**
  - Prisma model: `TripMember`.
  - Thuật toán sinh mã mời crypto 12 ký tự Base31 dạng `XXXXXX-XXXXXX`. Cập nhật validation và chuẩn hóa đầu vào.
  - API endpoints: `GET/PATCH /api/trips/:id`, `GET/POST /api/trips/:id/members`, `GET /api/invites/:code` (có rate limiting), `POST /api/invites/:code/join`.
  - Bỏ `generateStaticParams` tại `src/app/(public)/join/[code]/page.tsx`, chuyển sang dynamic fetch.
  - **Nối UI ngay:** Trang chi tiết chuyến đi `/trips/[id]`, modal quản lý thành viên (đổi vai trò, rời chuyến), modal chia sẻ mã mời/QR, trang tham gia `/join/[code]`.
- **Tiêu chí nghiệm thu:** Host mời thành viên, mã mời chuẩn 13 ký tự, tra cứu mã mời có rate limit, thành viên tham gia chuyến đi cập nhật realtime vào DB.
- **🛑 ĐIỂM DỪNG CHỜ DUYỆT 3C.**

#### Phase 3D — Lát cắt dọc 3: Lịch trình chuyến đi (Itinerary CRUD + Nối UI)
- **Phạm vi:**
  - Prisma model: `ItineraryItem`.
  - API endpoints: `GET /api/trips/:id/itinerary`, `POST /api/trips/:id/itinerary`, `PATCH/DELETE /api/trips/:id/itinerary/:itemId`.
  - **Nối UI ngay:** Tab Lịch trình trong trang chi tiết chuyến đi. Thao tác thêm/sửa/xóa địa điểm theo ngày lưu trực tiếp vào database.
- **Tiêu chí nghiệm thu:** Lịch trình được sắp xếp chính xác theo ngày và thứ tự; phân quyền chỉ thành viên trong trip mới được chỉnh sửa.
- **🛑 ĐIỂM DỪNG CHỜ DUYỆT 3D.**

#### Phase 3E — Lát cắt dọc 4: Nhận diện thành viên (Identity Claim) & Bảo mật thông tin ngân hàng (Kèm nối UI)
- **Phạm vi:**
  - Prisma model: `TripMemberClaim`. Bổ sung cột ngân hàng và `bank_account_key_version`.
  - Module mã hóa AES-256-GCM ở tầng server cho số tài khoản ngân hàng.
  - API endpoints: `GET/PUT /api/me/bank` (mask STK), `POST /api/trips/:id/claims`, `GET /api/trips/:id/claims`, `POST /api/trips/:id/claims/:claimId/decision` (Transaction lock `FOR UPDATE`).
  - **Nối UI ngay:** Luồng người dùng mới tham gia yêu cầu nhận diện thành viên có sẵn; thông báo và modal duyệt của Trưởng nhóm; màn hình cập nhật thông tin ngân hàng.
- **Tiêu chí nghiệm thu:** STK được mã hóa an toàn trong DB; Trưởng nhóm duyệt claim thành công liên kết `user_id` và chuyển đổi bank an toàn; chống race condition khi duyệt claim.
- **🛑 ĐIỂM DỪNG CHỜ DUYỆT 3E.**

#### Phase 3F — Lát cắt dọc 5: Quản lý chi tiêu, Chia đều, Chia món & Phụ phí (Kèm nối UI)
- **Phạm vi:**
  - Prisma models: `Expense`, `ExpenseItem`, `ExpenseShare`, bổ sung cột `surcharge_amount` (Phương án C).
  - Tái sử dụng logic chia tiền số nguyên VND (`split.ts`). Phân bổ phần dư phụ phí theo `join_order`. Ràng buộc R18 (Member chỉ ghi khoản chi của mình; Host ghi hộ bất kỳ ai).
  - API endpoints: `GET /api/trips/:id/expenses`, `POST /api/trips/:id/expenses`, `PATCH/DELETE /api/trips/:id/expenses/:expenseId`.
  - **Nối UI ngay:** Tab Khoản chi, modal thêm/sửa chi tiêu chia đều và chia theo món kèm phụ phí.
- **Tiêu chí nghiệm thu:** Invariant tổng tiền khớp 100% từng đồng VND; không phát sinh sai số làm tròn; phân quyền R18 thực thi chặt chẽ trên server.
- **🛑 ĐIỂM DỪNG CHỜ DUYỆT 3F.**

#### Phase 3G — Lát cắt dọc 6: Chốt sổ công nợ, Rút gọn nợ, VietQR Mock & Thanh toán (Kèm nối UI)
- **Phạm vi:**
  - Prisma models: `Settlement`, `Transfer`.
  - Tái sử dụng thuật toán rút gọn nợ `simplify.ts`. Tính toán số dư trên toàn bộ thành viên (kể cả thành viên `LEFT` với khẳng định số dư bằng 0).
  - API endpoints: `POST /api/trips/:id/settlement` (chốt sổ), `POST /api/trips/:id/settlement/reopen` (mở lại sổ khi toàn bộ UNPAID), `GET /api/transfers/:id/payment-info` (trả full STK cho người nợ), `POST /api/transfers/:id/mark-paid`, `POST /api/transfers/:id/confirm`.
  - VietQR: Tiếp tục dùng SVG mock nội bộ chuẩn Release 1, không gọi cổng thanh toán bên thứ ba.
  - **Nối UI ngay:** Tab Bảng công nợ, modal hiển thị VietQR, các nút thao tác đánh dấu đã chuyển và xác nhận đã nhận tiền.
- **Tiêu chí nghiệm thu:** Chốt sổ an toàn với transaction; mở lại sổ chỉ khi hợp lệ; chuyển đổi trạng thái nợ chính xác; UI phản ánh trạng thái chốt sổ tức thì.
- **🛑 ĐIỂM DỪNG CHỜ DUYỆT 3G.**

#### Phase 3H — Kiểm thử hồi quy toàn diện, Rà soát bảo mật & Bàn giao Release 1
- **Phạm vi:**
  - Chạy toàn bộ test suite (280+ tests hiện tại + integration tests mới).
  - Integration tests chuyên sâu: Thành viên `LEFT` có lịch sử chi tiêu, transaction concurrency/race condition, kiểm tra phân quyền chống IDOR chéo trip.
  - Rà soát bảo mật: Quét toàn bộ mã nguồn không để lộ secret/API key, xác minh STK mã hóa đúng, kiểm tra rate limit.
  - Dọn dẹp mã nguồn: Gỡ bỏ toàn bộ mock adapters không còn sử dụng.
- **Tiêu chí nghiệm thu:** Hệ thống chạy ổn định 100% trên dữ liệu Supabase thật; toàn bộ test passed; sẵn sàng nghiệm thu Release 1.
- **🛑 ĐIỂM DỪNG NGHIỆM THU CUỐI CÙNG.**

---

## 7. Ranh giới những việc TUYỆT ĐỐI KHÔNG làm ở thời điểm này

1. **KHÔNG** sửa mã nguồn ứng dụng trong `src/`.
2. **KHÔNG** cài đặt bất kỳ npm package nào (`prisma`, `better-auth`, `zod`, v.v.).
3. **KHÔNG** chỉnh sửa các file thiết kế gốc trong `sodothietke/` (`release1-erd.dbml`, usecase, sequence).
4. **KHÔNG** cập nhật file `PROJECT_CONTEXT.md` cho đến khi người dùng có quyết định chính thức bằng văn bản.
5. **KHÔNG** tự ý kết nối database Supabase hay triển khai migration trước khi từng phase được duyệt.

Tài liệu này giữ nguyên trạng thái **CHỜ NGƯỜI DÙNG DUYỆT** cho các phương án đề xuất ở trên.
