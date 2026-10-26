# Smart Trip — Phase 3 Backend Architecture Plan

> **Trạng thái:** ĐÃ TRIỂN KHAI HOÀN TẤT & ĐÃ TEST OFFLINE (IMPLEMENTED & TESTED OFFLINE)<br />
> **Ngày rà soát & cập nhật:** 24/10/2026 (Hoàn thành Phase 3ZP)<br />
> **Phạm vi:** Tài liệu kiến trúc Backend hoàn chỉnh cho Release 1; phản ánh 100% cấu trúc mã nguồn thực tế, các API Route Handlers, mô hình bảo mật và quy trình CI/CD.

---

## 1. Căn cứ và trạng thái repository hiện tại

- **Stack hiện tại:** Next.js 16.4.2 (App Router), React 19.3.0, TypeScript 5 (strict), Tailwind CSS 4, Prisma ORM 7.10.1, Better Auth 1.7.11, Vitest 5.0.5.
- **Hiện trạng:** Đã hoàn thiện toàn bộ tầng Backend Route Handlers, Database Repository, Application Services, Data API lockdown, và tích hợp trực tiếp vào giao diện người dùng. Không còn sử dụng mock adapters cho các luồng nghiệp vụ chính.
- **Module domain & bảo mật đã triển khai:**
  - Tiền tệ & chia nợ: `src/lib/money/split.ts`, `src/lib/money/simplify.ts`, `src/lib/money/settlement.ts`.
  - VietQR EMVCo Napas 247: `src/lib/money/vietqr.ts` (offline payload builder & QR generator).
  - Lưu trữ ảnh hóa đơn (UC32): `src/lib/storage/receipts.ts` (Magic Bytes inspection, UUID keys, Private proxy pattern).
  - Mã hóa AES-256-GCM: `src/lib/crypto/bank-encryption.ts`.
  - Phân quyền & Session: `src/lib/auth/session.ts`, `src/lib/api/auth-guard.ts`, `src/proxy.ts`.
  - Validation: `src/lib/validation/` (user, trip, member, claim, itinerary, expense, settlement).
  - API Client Services: `src/lib/services/` (trips, members, itinerary, expenses, receipts, settlement, user).
- **Kiểm tra chất lượng hiện tại:** `npm test` đạt **75 test files / 1.121 tests passed (100%)**; TypeScript (`tsc --noEmit`) và ESLint đạt 100% không lỗi.

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
[Prisma Repository] (Prisma Client queries, pool connection management)
       │
       ▼
[PostgreSQL Database] (Supabase Singapore ap-southeast-1, CHECK constraints, Partial indexes, FK rules)
```

### Nguyên tắc bất biến về định danh và quyền:
1. `users` (kết hợp Better Auth `user`) đại diện cho identity toàn hệ thống (tài khoản đã đăng nhập).
2. `trip_members` đại diện cho identity trong một chuyến đi cụ thể.
3. Người trả tiền (`payer`), người nợ (`debtor`), người nhận (`creditor`) **luôn tham chiếu `trip_members.id`**, vì thành viên có thể chưa có tài khoản (`user_id = NULL`).
4. **Không tin tưởng dữ liệu từ client:** Server không bao giờ tin `userId`, `memberId`, `isHost` hay role gửi từ client. Mọi request đều lấy identity từ Session cookie bảo mật, sau đó truy vấn DB để xác thực tư cách thành viên và vai trò trong chuyến đi.
5. **Tiền tệ:** Luôn dùng số nguyên VND (`integer`), không dùng số thực (`float`).

---

## 3. Các quyết định kiến trúc cốt lõi

### 3.1. Thư viện xác thực: Better Auth (ĐÃ DUYỆT)

- **Quyết định:** Sử dụng **Better Auth**, duy nhất Google OAuth provider, sử dụng Prisma adapter. Không sử dụng Auth.js (NextAuth).
- **Hỗ trợ Next.js 16.4.2:** Tương thích hoàn toàn Route Handlers (`/api/auth/[...all]`), hỗ trợ Server Actions & Client Components.
- **Next.js 16 Routing:** Sử dụng `proxy.ts` thay cho `middleware.ts` theo chuẩn Next.js 16.
- **Bảng cơ sở dữ liệu tạo ra:** 4 bảng chuẩn Better Auth:
  - `user`: Thông tin người dùng (`id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt`).
  - `session`: Quản lý phiên (`id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent`, `createdAt`, `updatedAt`).
  - `account`: Liên kết tài khoản OAuth Google (`id`, `userId`, `accountId`, `providerId`, `accessToken`, `refreshToken`, `idToken`, `expiresAt`, `password`, `createdAt`, `updatedAt`).
  - `verification`: Lưu token xác thực một lần (`id`, `identifier`, `value`, `expiresAt`, `createdAt`, `updatedAt`).
- **Mở rộng cột ngân hàng và hiển thị:** Cấu hình qua `user.additionalFields` trong Better Auth config kết hợp khai báo trong Prisma model `User`:
  - `display_name varchar(100)` (biệt danh người dùng tự đặt trong app)
  - `bank_bin varchar(10)`
  - `bank_account_no varchar(255)` (chuỗi mã hóa `iv:authTag:ciphertext`)
  - `bank_account_name varchar(100)`
  - `bank_account_key_version integer NOT NULL DEFAULT 1`
- **Mapping Model Better Auth với Prisma:**
  - Better Auth Prisma adapter mặc định tìm các model `user`, `session`, `account`, `verification`.
  - Trong Prisma schema, khai báo các model dạng PascalCase (`User`, `Session`, `Account`, `Verification`) và dùng `@@map("users")`, `@@map("sessions")`, `@@map("accounts")`, `@@map("verifications")` sang tên bảng số nhiều trong PostgreSQL.
  - Cấu hình khởi tạo:
    ```ts
    import { betterAuth } from "better-auth";
    import { prismaAdapter } from "better-auth/adapters/prisma";
    import { prisma } from "@/lib/db/prisma";

    export const auth = betterAuth({
      database: prismaAdapter(prisma, {
        provider: "postgresql",
      }),
      user: {
        additionalFields: {
          displayName: { type: "string", required: false },
          bankBin: { type: "string", required: false },
          bankAccountNo: { type: "string", required: false },
          bankAccountName: { type: "string", required: false },
          bankAccountKeyVersion: { type: "number", required: false, defaultValue: 1 },
        },
      },
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        },
      },
    });
    ```
- **Chiến lược kiểm thử Better Auth:**
  - Unit test: Mock session qua hàm helper để kiểm thử độc lập các Route Handler nghiệp vụ.
  - Integration test: Kiểm tra luồng callback OAuth, kiểm tra tạo session cookie an toàn (HttpOnly, Secure, SameSite=Lax), kiểm tra `proxy.ts` chặn truy cập trái phép.

---

### 3.2. Chuẩn hóa mã mời chuyến đi (Invite Code — ĐÃ DUYỆT)

Giữ nguyên chuẩn độ dài cột `varchar(13)` trong ERD và codebase (`trips.invite_code`):
- **Quy tắc sinh mã ở Server:**
  - Sinh đúng 12 ký tự ngẫu nhiên bằng bộ sinh số an toàn mật mã: `crypto.randomBytes` hoặc `crypto.getRandomValues`.
  - Bảng ký tự loại bỏ triệt để ký tự dễ nhầm lẫn (Base31): bỏ số `0`, chữ `O`, số `1`, chữ `I`, chữ `L`. Bảng ký tự chuẩn: `23456789ABCDEFGHJKMNPQRSTUVWXYZ`.
  - Định dạng lưu trữ và hiển thị: `XXXXXX-XXXXXX` (gồm 6 ký tự - dấu gạch nối - 6 ký tự = đúng 13 ký tự, khớp hoàn hảo `varchar(13)`).
- **Chuẩn hóa đầu vào khi tra cứu (Input normalization):**
  - Loại bỏ toàn bộ dấu gạch ngang (`-`) và khoảng trắng (`\s`).
  - Chuyển thành chữ in hoa (`toUpperCase()`).
  - Kiểm tra độ dài chuỗi sau lọc: đúng 12 ký tự hợp lệ thuộc bảng ký tự Base31.
  - Tự động chèn lại dấu gạch ngang sau ký tự thứ 6 (`${code.slice(0, 6)}-${code.slice(6, 12)}`) trước khi truy vấn database.

---

### 3.3. Mô hình hóa phụ phí: Phương án C (ĐÃ DUYỆT)

- **Quyết định:** Thêm cột `surcharge_amount integer NOT NULL DEFAULT 0` kèm ràng buộc `CHECK (surcharge_amount >= 0)` trực tiếp vào bảng `expenses`.
- **Bảo toàn cấu trúc:** **Không thay đổi cấu trúc bảng `expense_items`** (không thêm cột `item_type` hay tách bảng thừa).
- **Kiểm tra invariant tiền tệ tức thì:**
  $$\text{expenses.amount} = \sum(\text{expense\_items.amount}) + \text{expenses.surcharge\_amount}$$
- **Quy tắc phân bổ phụ phí chính xác:**
  - Tập hợp người chịu phụ phí = Danh sách các **thành viên duy nhất (distinct members)** có ít nhất một món ăn trong hóa đơn đó:
    $$\text{participants} = \text{Unique}(\text{expense\_item\_members.member\_id})$$
  - **Khẳng định quy tắc nghiệp vụ:** Dù một thành viên chọn 2, 3 hay nhiều món khác nhau trong cùng một hóa đơn, thành viên đó **chỉ được tính là 1 suất** trong danh sách phân bổ phụ phí (không bị nhân nhiều lần phần phụ phí).
  - Phụ phí được chia đều cho số lượng người trong tập hợp `participants`. Phần dư nguyên (remainder, nếu có) phân bổ tuần tự 1 đồng/người theo thứ tự `join_order` của các thành viên trong tập hợp đó.
  - Thành viên không tham gia món nào (0 món) thì hoàn toàn không phải chịu phụ phí của hóa đơn đó.

---

### 3.4. Mã hóa số tài khoản ngân hàng: AES-256-GCM & Phân quyền giải mã (ĐÃ DUYỆT)

1. **Thuật toán:** **AES-256-GCM** (Authenticated Encryption) sử dụng module `crypto` chuẩn có sẵn của Node.js (không cài thư viện ngoài).
2. **Quản lý khóa:** Khóa đối xứng 32-byte (256 bits) sinh ngẫu nhiên an toàn, lưu trong biến môi trường chỉ ở phía server: `BANK_ENCRYPTION_KEY` (chuỗi hex 64 ký tự, **tuyệt đối không có tiền tố `NEXT_PUBLIC_`**).
3. **Cấu trúc lưu DB:**
   - Cột `bank_account_no varchar(255)`: lưu chuỗi định dạng `iv:authTag:ciphertext` (mỗi lần mã hóa sinh IV ngẫu nhiên 12 bytes qua `crypto.randomBytes(12)`).
   - Cột `bank_account_key_version integer NOT NULL DEFAULT 1`: đánh dấu phiên bản khóa mã hóa.
4. **Quy tắc phân quyền giải mã nghiêm ngặt:**
   - **Tại trang Hồ sơ cá nhân (`/profile`):** Chỉ chính chủ sở hữu tài khoản (`users.id = session.user.id`) mới được xem STK của mình (mặc định hiển thị masked dạng `**** **** 1234`, chỉ giải mã khi người dùng chủ động mở chế độ chỉnh sửa).
   - **Tại endpoint thông tin thanh toán (`GET /api/transfers/:id/payment-info`):**
     - Server **chỉ giải mã và trả về STK đầy đủ** của người nhận cho:
       1. **Chính người nợ của giao dịch đó** (`from_member_id` gắn với `user_id = session.user.id`).
       2. **Trưởng nhóm của chuyến đi** (Host có thẩm quyền thanh toán hoặc điều phối thay cho thành viên chưa có tài khoản).
     - Bất kỳ thành viên nào khác trong chuyến đi hoặc người dùng ngoài chuyến đi gọi endpoint này đều bị từ chối bằng mã **403 Forbidden**.
5. **Quy trình đổi khóa (Key Rotation) thủ công & Kế hoạch ứng phó mất khóa:**
   - Khi cần đổi khóa: Thiết lập khóa mới `BANK_ENCRYPTION_KEY_V2`. Script bảo trì một lần đọc các bản ghi `key_version = 1`, giải mã bằng V1, mã hóa lại bằng V2 và cập nhật `key_version = 2`.
   - Nếu mất khóa: Hệ thống bắt ngoại lệ giải mã an toàn, coi như chưa có STK và yêu cầu người dùng nhập lại STK tại trang Cài đặt / Hồ sơ (không làm hỏng tính toàn vẹn dữ liệu chuyến đi và công nợ).

---

### 3.5. Chuông thông báo: Loại bỏ khỏi Release 1 (ĐÃ DUYỆT)

- **Quyết định:** Loại bỏ hoàn toàn tính năng chuông thông báo khỏi phạm vi Release 1.
- **Giao diện:** Ẩn nút chuông thông báo trên Header giao diện người dùng, bảo lưu file component để phục vụ Release 2.
- **Cơ sở dữ liệu:** **Tuyệt đối không tạo bảng `notifications`** trong cơ sở dữ liệu để tránh làm phình schema và lãng phí tài nguyên query/migration.

---

### 3.6. Các cấu hình kỹ thuật hạ tầng & Serverless

#### (a) `cacheComponents` và `partialPrefetching` trong `next.config.ts`:
- **Đã thực hiện:** Đã thiết lập `cacheComponents: false` và `partialPrefetching: false` trong `next.config.ts`.
- **Lý do kỹ thuật:** Tránh việc Next.js 16 cache nhầm dữ liệu nhạy cảm của người dùng này cho người dùng khác khi đọc session, số dư tài chính hoặc trạng thái chốt sổ. Đảm bảo toàn bộ nghiệp vụ chạy ở chế độ **Dynamic Server Rendering** nhất quán 100%.

#### (b) Loại bỏ `generateStaticParams` tại route `join/[code]`:
- Tuyến `/join/[code]` chuyển sang **Dynamic Route** (`export const dynamic = 'force-dynamic'`), truy vấn trực tiếp qua API service và loại bỏ hoàn toàn việc đọc danh sách mã tĩnh từ mock data.

#### (c) Cơ chế Rate Limiting bằng bảng `rate_limits` trong PostgreSQL:
- **Quyết định kiến trúc:** Sử dụng bảng `rate_limits` trực tiếp trong PostgreSQL Supabase thay vì phụ thuộc dịch vụ ngoài (Upstash Redis).
- **Lợi ích:** Tự chủ 100%, không cần quản lý thêm token/API key của bên thứ ba, không lo rủi ro cạn quota free-tier, tận dụng độ trễ thấp của Supabase Singapore (`ap-southeast-1`).
- **Cấu trúc bảng:**
  - `key varchar(255) PRIMARY KEY`: Định danh đối tượng giới hạn (ví dụ: `invite:192.168.1.1` hoặc `claim:user_uuid`).
  - `count integer NOT NULL DEFAULT 1`: Số lần gọi trong khung thời gian.
  - `reset_at timestamptz NOT NULL`: Thời điểm hết hiệu lực của khung thời gian.
  - Index: `CREATE INDEX idx_rate_limits_reset_at ON rate_limits (reset_at);`
- **Xử lý Atomic qua UPSERT:**
  ```sql
  INSERT INTO rate_limits (key, count, reset_at)
  VALUES ($1, 1, $2)
  ON CONFLICT (key) DO UPDATE
  SET count = CASE
    WHEN rate_limits.reset_at < now() THEN 1
    ELSE rate_limits.count + 1
  END,
  reset_at = CASE
    WHEN rate_limits.reset_at < now() THEN $2
    ELSE rate_limits.reset_at
  END
  RETURNING count, reset_at;
  ```
- **Endpoint áp dụng:**
  - `GET /api/invites/[code]`: Giới hạn tối đa 10 requests / phút / IP chống brute-force mã mời.
  - `POST /api/trips/:id/claims`: Giới hạn tối đa 5 requests / phút / user chống spam nhận diện.

#### (d) Cấu hình URL Prisma & Supabase:
- **Phân định rõ 2 URL kết nối:**
  - `DATABASE_URL`: Kết nối qua Transaction Connection Pooler (Supavisor / PgBouncer, port 6543, tham số `?pgbouncer=true`). Sử dụng cho runtime serverless của ứng dụng để bảo vệ DB trước số lượng connection lớn.
  - `DIRECT_URL`: Kết nối trực tiếp (Direct Connection, port 5432). Bắt buộc sử dụng cho lệnh Prisma Migrate CLI khi chạy DDL và migration locks (PgBouncer transaction mode không hỗ trợ một số lệnh advisory lock và DDL phức tạp).
- **Cấu hình `prisma.config.ts` (Đã cập nhật Gate 4F):**
  - Cấu hình datasource URL ưu tiên `DIRECT_URL` cho migration CLI (`process.env.DIRECT_URL?.trim()`).
  - Cơ chế bảo vệ Transaction Pooler: Nếu thiếu `DIRECT_URL`, hệ thống kiểm tra `DATABASE_URL`; nếu phát hiện đang trỏ vào Transaction Pooler (port 6543 hoặc `pgbouncer=true`), Prisma CLI lập tức ném lỗi rõ ràng yêu cầu cấu hình `DIRECT_URL`, tuyệt đối không âm thầm chạy migration qua pooler gây lỗi lock/DDL và tuyệt đối không để lộ chuỗi kết nối hay thông tin nhạy cảm ra log/console.
- **Nguyên tắc bảo mật connection string:**
  - Tuyệt đối không hard-code hoặc in connection string ra console/log.
  - Script kiểm tra kết nối chỉ kiểm tra regex định dạng host/port và thực hiện query nhẹ `SELECT 1`, in trạng thái boolean THÀNH CÔNG / THẤT BẠI.
  - File `.env.example` chỉ chứa mẫu không có mật khẩu thật.

#### (e) Giới hạn Connection Pool phù hợp môi trường triển khai (Đã cập nhật Gate 4F):
- **Không coi `max: 1` hoặc `max: 2` là chân lý cố định:** Cấu hình pool thích ứng linh hoạt theo nền tảng hosting:
  - **Môi trường Serverless (Vercel / AWS Lambda):** Mỗi serverless container sinh pool riêng. Mặc định `max: 1` (kèm `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 5000`) để tránh làm cạn kiệt connection pooler khi có nhiều invocations đồng thời.
  - **Môi trường Long-running Container (Docker / Railway / Render / Fly.io / VPS):** Chỉ có 1 hoặc vài tiến trình Node.js chạy liên tục. Mặc định `max: 10` để tái sử dụng kết nối hiệu quả cho các request đồng thời.
  - **Tùy biến qua biến môi trường `DB_POOL_MAX`:** Hàm `parsePoolMax()` kiểm tra và parse số nguyên dương hợp lệ từ `process.env.DB_POOL_MAX`. Nếu không hợp lệ hoặc không có, tự động fallback theo môi trường (`process.env.VERCEL ? 1 : 10`).
- **Triển khai code trong `src/lib/db/prisma.ts`:**
  - Tái sử dụng `globalForPrisma.pool` và `globalForPrisma.prisma` trong development để phục vụ Next.js Fast Refresh.
  - Sử dụng adapter `@prisma/adapter-pg` với `PrismaPg(pool)` cho Prisma 7.
  - Cấu hình `Pool` hoàn chỉnh:
  ```ts
  function parsePoolMax(): number {
    const envVal = process.env.DB_POOL_MAX?.trim();
    if (envVal) {
      const parsed = parseInt(envVal, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return process.env.VERCEL ? 1 : 10;
  }

  const pool =
    globalForPrisma.pool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
      max: parsePoolMax(),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  ```

#### (f) Tính số dư công nợ trên thành viên đã rời nhóm (`LEFT`):
- Mọi thành viên có lịch sử tài chính (từng ứng tiền hoặc chịu tiền) đều tham gia thuật toán tính số dư `net = paid - owed`.
- **Khẳng định nguyên tắc:** Thành viên chỉ được rời nhóm (`status = LEFT`) khi số dư công nợ bằng 0 (`balance = 0`). Do đó, tại thời điểm chốt sổ, số dư của thành viên `LEFT` khẳng định bằng 0 và không phát sinh bất kỳ giao dịch chuyển khoản mới (`transfers`) nào.

---

### 3.7. Các quyết định kiến trúc & schema đã được duyệt (Đồng bộ Schema/ERD tại Gate 4F)

| Mục | Chi tiết | Quyết định đã duyệt | Trạng thái đồng bộ |
|---|---|---|:---:|
| **1. `users.display_name`** | Thêm cột `display_name varchar(100)` vào bảng `users`. | Tách biệt tên tài khoản Google (`users.name`) với biệt danh trong app; hỗ trợ ô nhập trên `/profile`; tự động gợi ý tên khi vào trip. | ✅ **ĐÃ ĐỒNG BỘ** (`schema.prisma` & `release1-erd.dbml`) |
| **2. Bảng `rate_limits`** | Tạo bảng `rate_limits (key varchar(255) PK, count int, reset_at timestamptz)` trong PostgreSQL. | Tự chủ hoàn toàn hạ tầng rate limit, không phụ thuộc dịch vụ ngoài (Upstash Redis), tối ưu chi phí và độ trễ. | ✅ **ĐÃ ĐỒNG BỘ** (`schema.prisma` & `release1-erd.dbml`) |
| **3. Bảng `bank_claim_snapshots`** | Đồng bộ bảng `bank_claim_snapshots` vào DBML ERD khớp với model Prisma hiện có. | Lưu snapshot thông tin ngân hàng tại thời điểm gửi claim để bảo toàn lịch sử tài chính, không phụ thuộc việc thay đổi thông tin sau này. | ✅ **ĐÃ ĐỒNG BỘ** (`release1-erd.dbml`) |
| **4. Ràng buộc phụ phí không âm** | Bổ sung ràng buộc `CHECK (surcharge_amount >= 0)` trên bảng `expenses`. | Đảm bảo tính toàn vẹn dữ liệu cho phụ phí chia món (Phương án C). | ✅ **ĐÃ DUYỆT** (Khai báo trong schema/ERD; bổ sung vào Migration SQL ở gate tiếp theo) |

---

### 3.8. Quyết định chiến lược Migration: Khởi tạo Toàn bộ Schema Một Lần (ĐÃ DUYỆT)

- **So sánh hai phương án:**
  - *Phương án A (Migration chắp vá theo từng Phase):* Mỗi phase tạo vài bảng. Nhược điểm: Bảng `trip_members` liên kết chéo với `Expense`, `SettlementTransfer`, `Claim`. Việc chia nhỏ migration sẽ liên tục phải sửa bảng cũ (`ALTER TABLE`), dễ sinh lỗi migration drift và khóa ngoại không đồng bộ.
  - *Phương án B (Migration khởi tạo toàn bộ schema một lần duy nhất — ĐÃ CHỌN):*
    Tạo **toàn bộ 16 bảng (11 bảng chuyến đi/chi tiêu/công nợ/lịch trình/claims/snapshots + 4 bảng Better Auth + 1 bảng `rate_limits`)** trong 1 migration khởi tạo duy nhất (`0001_initial_schema`) ngay đầu Phase 3B. Đi kèm toàn bộ CHECK constraints và partial unique indexes đã được chuẩn bị.
- **Điều kiện tiên quyết đã duyệt:** Migration khởi tạo này **chỉ được áp dụng sau khi xác minh trạng thái database đích và lịch sử migration** (đảm bảo database đích sạch, không có drift hay bảng xung đột).

---

## 4. Ma trận quyền và bảo mật (Security Matrix)

Mọi endpoint Route Handler đều phải độc lập kiểm tra session, quyền hạn và phạm vi trip từ database; không bao giờ tin tưởng client.

| Hành động | Quyền Server thực thi | Ghi chú & Ràng buộc bảo mật |
|---|---|---|
| **Xem chi tiết / Các tab riêng của Trip** | Thành viên ACTIVE đã liên kết tài khoản. | User có claim PENDING chỉ được xem trạng thái yêu cầu của mình. |
| **Xem trước mã mời (Invite Preview)** | Bất kỳ ai có mã mời hợp lệ (Public). | Chỉ trả về: Tên chuyến đi, điểm đến, ngày đi, tên Trưởng nhóm, tên & avatar thành viên. **Tuyệt đối không lộ lịch trình, chi tiêu, STK ngân hàng**. Áp dụng rate limit PostgreSQL. |
| **Tạo chuyến đi mới (Create Trip)** | Người dùng đã đăng nhập Google. | Tạo `trips` và tự động tạo `trip_members` (Host, `join_order = 1`) trong cùng một transaction. |
| **Tạo khoản chi (Create expense)** | Thành viên ACTIVE trong chuyến đi. | Thành viên thường chỉ được ghi payer là chính mình. Trưởng nhóm (Host) được ghi payer cho bất kỳ thành viên nào (kể cả thành viên chưa có tài khoản). |
| **Sửa / Xóa khoản chi** | Trưởng nhóm HOẶC chính người đã trả tiền (payer). | Chỉ thực hiện được khi chuyến đi ở trạng thái `ACTIVE` (chưa chốt sổ). |
| **Chốt sổ (Lock Settlement)** | Duy nhất Trưởng nhóm (Host). | Chuyến đi phải ở trạng thái `ACTIVE`; chuyển trạng thái sang `SETTLING`. |
| **Mở lại sổ (Reopen Settlement)** | Duy nhất Trưởng nhóm (Host). | Chỉ được mở lại khi **tất cả** các giao dịch chuyển khoản đang ở trạng thái `UNPAID`. |
| **Đánh dấu đã chuyển tiền (Mark paid)** | Chính người nợ (`debtor`). | Trưởng nhóm chỉ được thao tác thay cho thành viên chưa có tài khoản (`user_id = NULL`). |
| **Xác nhận đã nhận tiền (Confirm received)** | Chính người nhận (`creditor`). | Trưởng nhóm chỉ được thao tác thay cho thành viên chưa có tài khoản (`user_id = NULL`). |
| **Duyệt / Từ chối yêu cầu nhận diện (Claim)** | Duy nhất Trưởng nhóm (Host) của trip đó. | Thực hiện trong transaction có lock `FOR UPDATE`. |
| **Xem thông tin STK giải mã thanh toán** | Duy nhất **Người nợ** của transfer đó HOẶC **Trưởng nhóm**. | Endpoint `GET /api/transfers/:id/payment-info` chặn 403 đối với tất cả thành viên khác. |
| **Thu hồi / Đổi mã mời** | Duy nhất Trưởng nhóm (Host). | Sinh mã mới Base31 12 ký tự, ghi đè `invite_code`, mã cũ lập tức vô hiệu. |
| **Xóa thành viên / Rời chuyến đi** | Trưởng nhóm xóa thành viên; Thành viên tự rời. | Chỉ thực hiện khi số dư công nợ của thành viên đó bằng 0 (`balance = 0`); đổi `status = 'LEFT'`, không xóa cứng. |

---

## 5. Ràng buộc cơ sở dữ liệu & Quy trình duy trì Custom SQL

### Bảng đối chiếu ràng buộc:

| Ràng buộc nghiệp vụ | Triển khai trong Prisma | Ràng buộc Custom SQL bắt buộc trong Migration |
|---|---|---|
| UUID PK, NOT NULL, Enums, FKs | Khai báo trực tiếp trong `schema.prisma`. | Kiểm tra hành vi `onDelete` (Restrict cho dữ liệu tài chính). |
| Bảng xác thực Better Auth | Model `User`, `Account`, `Session`, `Verification`. | Khóa ngoại cascade xóa session/account khi xóa user. |
| Bảng giới hạn tần suất | Model `RateLimit`. | Primary key `key`, index trên `reset_at`. |
| Bảng snapshot ngân hàng claim | Model `BankClaimSnapshot`. | FK cascade khi xóa claim/user, restrict khi xóa placeholder member. Index trên `placeholder_member_id` và `user_id`. |
| Mã mời duy nhất | `@unique` trên cột `invite_code varchar(13)`. | Format `XXXXXX-XXXXXX`. |
| Ngày kết thúc >= Ngày bắt đầu | Không hỗ trợ trực tiếp trong Prisma schema. | `ALTER TABLE trips ADD CONSTRAINT trips_end_date_gte_start_date CHECK (end_date >= start_date);` |
| Số tiền dương, chia không âm | Không hỗ trợ trực tiếp. | `ALTER TABLE expenses ADD CONSTRAINT expenses_amount_positive CHECK (amount > 0);`<br />`ALTER TABLE expense_shares ADD CONSTRAINT expense_shares_amount_non_negative CHECK (amount >= 0);`<br />`ALTER TABLE expense_items ADD CONSTRAINT expense_items_amount_positive CHECK (amount > 0);` |
| Phụ phí không âm | Cột `surcharge_amount` trong `expenses`. | `ALTER TABLE expenses ADD CONSTRAINT expenses_surcharge_amount_non_negative CHECK (surcharge_amount >= 0);`<br />*(Lưu ý: Constraint này hiện còn thiếu trong bản nháp `0001_release1_schema/migration.sql`; sẽ được bổ sung trong gate chỉnh sửa migration riêng tiếp theo)* |
| Chuyển khoản nợ hợp lệ | Không hỗ trợ trực tiếp. | `ALTER TABLE settlement_transfers ADD CONSTRAINT settlement_transfers_amount_positive CHECK (amount > 0), ADD CONSTRAINT settlement_transfers_distinct_members CHECK (from_member_id <> to_member_id);` |
| Một Trưởng nhóm duy nhất mỗi trip | Không hỗ trợ partial index. | `CREATE UNIQUE INDEX one_host_per_trip ON trip_members (trip_id) WHERE role = 'HOST';` |
| Một yêu cầu claim pending / user / trip | Không hỗ trợ partial index. | `CREATE UNIQUE INDEX one_pending_claim ON member_claims (trip_id, user_id) WHERE status = 'PENDING';` |
| Một bảng chốt sổ active / trip | Không hỗ trợ partial index. | `CREATE UNIQUE INDEX one_active_settlement ON settlements (trip_id) WHERE status = 'ACTIVE';` |

### Quy trình duy trì Custom SQL trong Migration (2 bước bắt buộc):
1. **Bước 1 (Tạo file khung):** Chạy lệnh Prisma CLI với cờ `--create-only`:
   ```bash
   npx prisma migrate dev --create-only --name init_schema
   ```
2. **Bước 2 (Chèn Custom SQL):** Chèn toàn bộ các câu lệnh `CREATE UNIQUE INDEX ... WHERE` và `ALTER TABLE ... ADD CONSTRAINT CHECK` ở bảng trên vào cuối file `migration.sql` vừa sinh ra.
3. **Bước 3 (Thực thi):** Chạy `npx prisma migrate dev` để áp dụng file SQL hoàn chỉnh vào database.

---

## 6. Lộ trình triển khai Phase 3: Mô hình Lát cắt dọc & Tiêu chí nghiệm thu

```text
[Phase 3A: Môi trường, Supabase & Cấu hình nền tảng]
       │
       ▼ (Duyệt Gate 3A)
[Phase 3B: Walking Skeleton - Khởi tạo Schema DB + Auth, User, Trip & Host + Nối UI ngay]
       │
       ▼ (Duyệt Gate 3B)
[Phase 3C: Lát cắt 2 - Thành viên, Mã mời Base31, Rate Limiting PG & Tham gia + Nối UI ngay]
       │
       ▼ (Duyệt Gate 3C)
[Phase 3D: Lát cắt 3 - Lịch trình chuyến đi (Itinerary CRUD) + Nối UI ngay]
       │
       ▼ (Duyệt Gate 3D)
[Phase 3E: Lát cắt 4 - Nhận diện thành viên ảo (Claim) & Mã hóa STK AES-256 + Nối UI ngay]
       │
       ▼ (Duyệt Gate 3E)
[Phase 3F: Lát cắt 5 - Khoản chi, Chia đều, Chia món & Phụ phí Phương án C + Nối UI ngay]
       │
       ▼ (Duyệt Gate 3F)
[Phase 3G: Lát cắt 6 - Chốt sổ, Rút gọn nợ, VietQR Mock & Thanh toán an toàn + Nối UI ngay]
       │
       ▼ (Duyệt Gate 3G)
[Phase 3H: Kiểm thử hồi quy toàn diện, Rà soát bảo mật & Bàn giao Release 1]
```

---

### Tiêu chí nghiệm thu chi tiết từng Cổng (Gates):

#### Phase 3A — Môi trường, Supabase Database & Cấu hình nền tảng
- **Phạm vi:**
  - Cấu hình dự án Supabase vùng Singapore (`ap-southeast-1`).
  - Cấu hình `DATABASE_URL` (pooler port 6543) và `DIRECT_URL` (direct port 5432) trong `.env` và `.env.example`.
  - Cập nhật `prisma.config.ts` hỗ trợ `DIRECT_URL || DATABASE_URL`.
  - Cấu hình connection pool có giới hạn cho serverless (`src/lib/db/prisma.ts`).
  - Xác nhận `cacheComponents: false` và `partialPrefetching: false` trong `next.config.ts`.
- **Tiêu chí nghiệm thu Gate 3A:**
  1. *Lint:* `npm run lint` đạt 0 lỗi, 0 cảnh báo.
  2. *Test:* `npm test` đạt 277/277 tests passed.
  3. *Build:* `npm run build` thành công 100%.
  4. *Nghiệp vụ & Hạ tầng:* Kết nối database qua script kiểm tra an toàn thành công (trả về `SELECT 1` OK).
  5. *Bảo mật:* Tuyệt đối không in hoặc commit connection string, token hay mật khẩu vào git.
- **🛑 ĐIỂM DỪNG CHỜ DUYỆT 3A.**

#### Phase 3B — Lát cắt dọc 1 (Walking Skeleton): Khởi tạo Toàn bộ Schema DB + Đăng nhập Google, Hồ sơ User & Tạo chuyến đi kèm Host (Nối UI ngay)
- **Phạm vi:**
  - Khởi tạo toàn bộ database schema (16 bảng: 11 bảng chuyến đi/chi tiêu/công nợ/lịch trình/claims/snapshots + 4 bảng Better Auth + 1 bảng `rate_limits`) qua 1 migration `0001_initial_schema` có đầy đủ Custom SQL (CHECK constraints & partial indexes).
  - Tích hợp Better Auth với Google OAuth provider, cấu hình Next.js 16 `proxy.ts`.
  - Triển khai transaction tạo chuyến đi: `POST /api/trips` tạo `trips` và tự động tạo `trip_members` cho Host (`join_order = 1`, `role = 'HOST'`).
  - Endpoints: `/api/auth/[...all]`, `GET /api/me`, `PATCH /api/me` (đổi display_name), `GET /api/trips`, `POST /api/trips`.
  - **Nối UI ngay:** Nối trang `/login`, Header (hiển thị session thật), danh sách chuyến đi `/trips`, modal tạo chuyến đi `/trips/new` điều hướng trực tiếp sang `/trips/[id]`.
- **Tiêu chí nghiệm thu Gate 3B:**
  1. *Lint & Test:* `npm run lint` 0 lỗi; test suite hiện tại + test case mới cho Auth và Trip creation passed 100%.
  2. *Build:* `npm run build` thành công.
  3. *Nghiệp vụ:* Tạo chuyến đi mới lưu thành công cả trip và host vào Supabase; trip không bị "vô chủ"; Trưởng nhóm có `role = 'HOST'`.
  4. *Bảo mật:* Session cookie HttpOnly bảo mật; người chưa đăng nhập không tạo được chuyến đi; không tin role gửi từ client.
  5. *Toàn vẹn UI:* Bỏ hoàn toàn mock adapter của Auth, Header, List Trip và Create Trip; giao diện cập nhật dữ liệu thật.
- **🛑 ĐIỂM DỪNG CHỜ DUYỆT 3B.**

#### Phase 3C — Lát cắt dọc 2: Quản lý thành viên, Mã mời Base31, Rate Limiting PG & Tham gia (Nối UI ngay)
- **Phạm vi:**
  - Thuật toán sinh mã mời crypto 12 ký tự Base31 dạng `XXXXXX-XXXXXX`. Cập nhật validation và chuẩn hóa đầu vào.
  - Triển khai bảng `rate_limits` trong PostgreSQL cho endpoint tra cứu mã mời.
  - API endpoints: `GET/PATCH /api/trips/:id`, `GET/POST /api/trips/:id/members`, `DELETE /api/trips/:id/members/:memberId`, `GET /api/invites/:code` (có rate limiting PG), `POST /api/invites/:code/join`.
  - Bỏ `generateStaticParams` tại `src/app/(public)/join/[code]/page.tsx`, chuyển sang dynamic fetch.
  - **Nối UI ngay:** Trang chi tiết chuyến đi `/trips/[id]`, modal quản lý thành viên (đổi vai trò, xóa/rời thành viên khi balance = 0), modal chia sẻ mã mời/QR, trang tham gia `/join/[code]`.
- **Tiêu chí nghiệm thu Gate 3C:**
  1. *Lint, Test, Build:* Đạt 100% không lỗi. Bổ sung test mã mời Base31 và rate limiting.
  2. *Nghiệp vụ:* Mã mời đúng chuẩn 13 ký tự; tra cứu tự động bỏ gạch/khoảng trắng; thành viên tham gia chuyến đi cập nhật realtime vào DB.
  3. *Bảo mật:* Endpoint `GET /api/invites/:code` chỉ trả dữ liệu xem trước (tên trip, host, member avatar/name), tuyệt đối không lộ lịch trình, chi tiêu, STK; chặn gọi quá 10 req/phút/IP bằng bảng `rate_limits`.
- **🛑 ĐIỂM DỪNG CHỜ DUYỆT 3C.**

#### Phase 3D — Lát cắt dọc 3: Lịch trình chuyến đi (Itinerary CRUD + Nối UI ngay)
- **Phạm vi:**
  - API endpoints: `GET /api/trips/:id/itinerary`, `POST /api/trips/:id/itinerary`, `PATCH/DELETE /api/trips/:id/itinerary/:itemId`.
  - **Nối UI ngay:** Tab Lịch trình trong trang chi tiết chuyến đi. Thao tác thêm/sửa/xóa địa điểm theo ngày lưu trực tiếp vào database.
- **Tiêu chí nghiệm thu Gate 3D:**
  1. *Lint, Test, Build:* Đạt 100% không lỗi.
  2. *Nghiệp vụ:* Lịch trình sắp xếp chính xác theo ngày và thứ tự `sort_order`.
  3. *Bảo mật:* Phân quyền kiểm tra session; chỉ thành viên ACTIVE của chuyến đi mới được xem và chỉnh sửa lịch trình.
- **🛑 ĐIỂM DỪNG CHỜ DUYỆT 3D.**

#### Phase 3E — Lát cắt dọc 4: Nhận diện thành viên ảo (Claim) & Mã hóa STK AES-256 (Nối UI ngay)
- **Phạm vi:**
  - Module mã hóa/giải mã AES-256-GCM ở tầng server cho số tài khoản ngân hàng.
  - API endpoints: `GET/PUT /api/me/bank` (mask STK), `POST /api/trips/:id/claims`, `GET /api/trips/:id/claims`, `POST /api/trips/:id/claims/:claimId/decision` (Transaction lock `FOR UPDATE`).
  - **Nối UI ngay:** Luồng người dùng mới tham gia nhận diện thành viên ảo có sẵn; modal duyệt của Trưởng nhóm; màn hình cập nhật thông tin ngân hàng.
- **Tiêu chí nghiệm thu Gate 3E:**
  1. *Lint, Test, Build:* Đạt 100% không lỗi.
  2. *Nghiệp vụ:* Trưởng nhóm duyệt claim thành công liên kết `user_id` và xóa bank ảo; giữ nguyên lịch sử tiền và `join_order`; các claim PENDING khác của cùng thành viên ảo tự động chuyển sang REJECTED.
  3. *Bảo mật:* STK lưu trong DB ở dạng mã hóa AES-256-GCM; không lộ STK trong response trừ khi có quyền; transaction lock `FOR UPDATE` chống race condition khi duyệt claim.
- **🛑 ĐIỂM DỪNG CHỜ DUYỆT 3E.**

#### Phase 3F — Lát cắt dọc 5: Quản lý chi tiêu, Chia đều, Chia món & Phụ phí Phương án C (Nối UI ngay)
- **Phạm vi:**
  - Tái sử dụng logic chia tiền số nguyên VND (`split.ts`). Phân bổ phần dư phụ phí theo `join_order`. Ràng buộc R18 (Member chỉ ghi khoản chi của mình; Host ghi hộ bất kỳ ai).
  - API endpoints: `GET /api/trips/:id/expenses`, `POST /api/trips/:id/expenses`, `PATCH/DELETE /api/trips/:id/expenses/:expenseId`.
  - **Nối UI ngay:** Tab Khoản chi, modal thêm/sửa chi tiêu chia đều và chia theo món kèm phụ phí.
- **Tiêu chí nghiệm thu Gate 3F:**
  1. *Lint, Test, Build:* Đạt 100% không lỗi.
  2. *Nghiệp vụ:* Invariant `expenses.amount = sum(items.amount) + surcharge_amount` đúng từng đồng VND; thành viên ăn nhiều món chỉ chịu 1 suất phụ phí; phần dư chia theo `join_order`.
  3. *Bảo mật:* Thực thi R18 chặt chẽ trên server; không cho thêm/sửa/xóa khoản chi khi sổ đã chốt (`trips.status <> ACTIVE`).
- **🛑 ĐIỂM DỪNG CHỜ DUYỆT 3F.**

#### Phase 3G — Lát cắt dọc 6: Chốt sổ công nợ, Rút gọn nợ, VietQR Mock & Thanh toán an toàn (Nối UI ngay)
- **Phạm vi:**
  - Tái sử dụng thuật toán rút gọn nợ `simplify.ts`. Tính toán số dư trên toàn bộ thành viên (kể cả thành viên `LEFT` với khẳng định số dư bằng 0).
  - API endpoints: `POST /api/trips/:id/settlement` (chốt sổ), `POST /api/trips/:id/settlement/reopen` (mở lại sổ khi toàn bộ UNPAID), `GET /api/transfers/:id/payment-info` (trả STK giải mã an toàn), `POST /api/transfers/:id/mark-paid`, `POST /api/transfers/:id/confirm`.
  - VietQR: Tiếp tục dùng SVG mock nội bộ chuẩn Release 1, không gọi cổng thanh toán bên thứ ba.
  - **Nối UI ngay:** Tab Bảng công nợ, modal hiển thị VietQR, các nút thao tác đánh dấu đã chuyển và xác nhận đã nhận tiền.
- **Tiêu chí nghiệm thu Gate 3G:**
  1. *Lint, Test, Build:* Đạt 100% không lỗi.
  2. *Nghiệp vụ:* Chốt sổ bảo toàn `SUM(net) = 0`; mở lại sổ chỉ khi tất cả transfer đang `UNPAID`; chuyển trạng thái nợ chính xác (`UNPAID` -> `PAID` -> `COMPLETED`).
  3. *Bảo mật:* Endpoint `payment-info` **chỉ trả STK giải mã cho Debtor và Host**, chặn 403 đối với tất cả thành viên khác.
- **🛑 ĐIỂM DỪNG CHỜ DUYỆT 3G.**

#### Phase 3H — Kiểm thử hồi quy toàn diện & Rà soát bảo mật [IMPLEMENTED & TESTED OFFLINE]
- **Kết quả thực tế:**
  - 100% test files passed offline.
  - Phân quyền chống IDOR chéo trip, kiểm tra an toàn dữ liệu thành viên `LEFT`.
  - Rate limit database và transaction isolation.

#### Phase 3ZN-H — Hoàn thiện Claims Flow, Rotate Invite & Archive Trip [IMPLEMENTED & TESTED OFFLINE]
- **Phạm vi triển khai:**
  - `POST /api/trips/[id]/claims/[claimId]/decision` với `FOR UPDATE` lock chống race condition.
  - `POST /api/trips/[id]/rotate-invite` đổi mã mời ngẫu nhiên 12 ký tự Base31 mới.
  - `POST /api/trips/[id]/archive` lưu trữ chuyến đi khi hoàn tất.

#### Phase 3ZO — Secure Payment Information & Real QR Integration [IMPLEMENTED & TESTED OFFLINE]
- **Phạm vi triển khai:**
  - **UC18:** `GET /api/trips/[id]/transfers/[transferId]/payment-info` giải mã an toàn STK ngân hàng người nhận, phân quyền chỉ trả cho Người nợ (Debtor) và Trưởng nhóm (Host).
  - **VietQR EMVCo Napas 247:** `src/lib/money/vietqr.ts` xây dựng chuẩn payload theo khuyến nghị Napas 247 và EMVCo Merchant-Presented Mode, tạo mã QR offline qua thư viện `qrcode`.
  - **UC34:** Modal chia sẻ lời mời chuyến đi hiển thị mã QR thật chứa URL tham gia trực tiếp.

#### Phase 3ZP — Receipt Storage, Documentation & CI/CD [IMPLEMENTED & TESTED OFFLINE]
- **Phạm vi triển khai:**
  - **UC32:** Lưu trữ ảnh hóa đơn bền vững:
    - Route Handlers: `POST /api/trips/[id]/receipts` (upload multipart/form-data) và `GET /api/trips/[id]/receipts/[fileId]` (xem/tải ảnh qua proxy xác thực thành viên).
    - Kiểm tra Magic Bytes thực tế (JPEG, PNG, WebP), giới hạn dung lượng 5MB.
    - Sinh UUID ngẫu nhiên cho Object Key (`receipts/${tripId}/${fileId}.${ext}`).
    - Kiến trúc Private Storage Bucket (không public).
    - Hỗ trợ `SupabaseRestStorageProvider` (REST API tiêu chuẩn) và `MemoryReceiptStorageProvider` (offline test).
    - Tích hợp UI vào `TripExpenseFormModal` với trạng thái uploading, preview bền vững, cảnh báo lỗi và nút xóa ảnh.
  - **GitHub Actions CI:** `.github/workflows/ci.yml` chạy `npm ci`, `npx tsc --noEmit`, `npm run lint`, và `npm test` offline tự động.

---

## 7. Bảng đối chiếu hiện trạng tính năng và mức độ kiểm chứng

| Phân hệ / Nghiệp vụ | Use Case | Trạng thái kỹ thuật | Trạng thái kiểm chứng | Ghi chú & Điều kiện Release 1 |
| :--- | :--- | :--- | :--- | :--- |
| Google OAuth Authentication | UC01 | IMPLEMENTED | TESTED OFFLINE | **NOT VERIFIED**: Cần kiểm thử E2E với Google Cloud Client ID thật trên remote domain. |
| User Profile & Bank AES-256 | UC02, UC03 | IMPLEMENTED | TESTED OFFLINE | STK mã hóa AES-256-GCM; chỉ giải mã ở server khi có quyền. |
| Trip Management (CRUD, Archive) | UC04, UC05, UC08 | IMPLEMENTED | TESTED OFFLINE | Hoàn thành API, Zod validation, và UI. |
| Invite Code Base31 & Rotate | UC06, UC07, UC30 | IMPLEMENTED | TESTED OFFLINE | Mã Base31 12 ký tự `XXXXXX-XXXXXX`; Rate limit bảo vệ chống brute-force. |
| Member Management & Left State | UC09-UC12 | IMPLEMENTED | TESTED OFFLINE | Trưởng nhóm quản trị, bảo toàn lịch sử thành viên LEFT. |
| Identity Claims Flow | UC13, UC14 | IMPLEMENTED | TESTED OFFLINE | Khóa bi quan `FOR UPDATE` chống race condition duyệt đồng thời. |
| Itinerary Management | UC15-UC17 | IMPLEMENTED | TESTED OFFLINE | Sắp xếp theo ngày và thứ tự `sort_order`. |
| Payment Info API | UC18 | IMPLEMENTED | TESTED OFFLINE | Phân quyền nghiêm ngặt chỉ Debtor và Host được xem STK người nhận. |
| VietQR EMVCo Napas 247 | UC18 | IMPLEMENTED | TESTED OFFLINE | **NOT VERIFIED**: Cần quét mã thực tế trên ứng dụng Mobile Banking của các ngân hàng Việt Nam. |
| Expenses Management & Surcharge | UC19-UC22 | IMPLEMENTED | TESTED OFFLINE | R18 enforced trên server; phụ phí phân bổ chuẩn từng đồng VND. |
| Sustainable Receipt Storage | UC32 | IMPLEMENTED | TESTED OFFLINE | **NOT VERIFIED / BLOCKED**: Cần cấu hình Storage Bucket `trip-receipts` và Service Key trên Supabase Staging/Production. |
| Settlement & Greedy Transfers | UC24-UC26 | IMPLEMENTED | TESTED OFFLINE | Bất biến `SUM(net) = 0`, greedy transfer heuristic tối ưu. |
| Mark Paid & Confirm Completed | UC27, UC28 | IMPLEMENTED | TESTED OFFLINE | Chuyển trạng thái UNPAID -> PAID -> COMPLETED. |
| Reopen Settlement | UC29 | IMPLEMENTED | TESTED OFFLINE | Chỉ Trưởng nhóm mở lại khi 100% transfer đang UNPAID. |
| Real QR Code Invite Sharing | UC34 | IMPLEMENTED | TESTED OFFLINE | QR code chứa link tham gia đầy đủ, render chuẩn trên canvas. |
| GitHub Actions CI Pipeline | CI/CD | IMPLEMENTED | TESTED OFFLINE | Chạy typecheck, lint, và 1.121 tests offline. |

---

## 8. Các điều kiện cần thực hiện trước khi Release lên Staging/Production

1. **Hạ tầng Storage (Supabase):**
   - Tạo Private Bucket `trip-receipts` trên Supabase Dashboard (hoặc qua Terraform/CLI).
   - Thiết lập Storage Policy không cho phép public read (chỉ service_role hoặc authenticated policy).
   - Cấu hình biến môi trường server: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`.
2. **Cơ sở dữ liệu Staging (Migration & Index):**
   - Áp dụng migration `0001_release1_schema`, `0002_data_api_lockdown`, `0003_add_itinerary_time_fields` trên remote Staging database.
   - Xác minh partial index `one_pending_claim` tồn tại trên database remote Staging.
3. **Google OAuth Production:**
   - Cấu hình Authorized Redirect URIs trên Google Cloud Console khớp với Staging/Production domain (`/api/auth/callback/google`).
4. **Kiểm thử thiết bị thật:**
   - Quét mã VietQR bằng ít nhất 2 app ngân hàng thực tế (ví dụ: Vietcombank, Techcombank, MB Bank) để kiểm tra nhận diện tự động số tiền, STK và nội dung chuyển khoản.
