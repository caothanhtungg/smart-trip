# BÁO CÁO ĐỐI SOÁT BIẾN MÔI TRƯỜNG SẢN XUẤT (ENVIRONMENT MANIFEST RECONCILIATION)
## Phase 3ZY — Production Environment Manifest Reconciliation

> **Thời điểm thực hiện audit:** 2026-10-25T21:18:00+07:00  
> **Nhánh Staging kiểm tra:** `staging/release-1-preview` (HEAD commit: `9377e27`)  
> **Nhánh Production mục tiêu:** `main` (HEAD hiện tại: `8f7943c`)  
> **Phương pháp tiếp cận:** Rà soát tĩnh (Static Code Audit) toàn diện từ mã nguồn thực tế thay vì sao chép tài liệu cũ.  
> **Nguyên tắc bảo mật:** Tuyệt đối không đọc, không ghi, không in giá trị bí mật từ bất kỳ file `.env` nào; không yêu cầu người dùng chia sẻ secrets.

---

## 1. Danh sách Biến Môi trường Thực tế và Nguồn Tham chiếu Mã Nguồn

Rà soát toàn bộ dự án (loại trừ `node_modules/`, `.next/`, `.git/`, `.agents/`) ghi nhận tổng cộng **18 biến môi trường** xuất hiện trong mã nguồn và cấu hình:

| STT | Tên biến môi trường | File tham chiếu trong mã nguồn | Dòng | Mục đích kỹ thuật thực tế |
| :---: | :--- | :--- | :---: | :--- |
| 1 | `DATABASE_URL` | `src/lib/db/prisma.ts`<br>`prisma.config.ts`<br>`scripts/test-session-helper.ts`<br>`scripts/smoke-runner.ts`<br>`scripts/gate-4a-orchestrator.ts` | L23<br>L10<br>L553<br>L38<br>L588 | Chuỗi kết nối PostgreSQL qua Supabase Transaction Pooler (cổng 6543, `?pgbouncer=true`). Được `pg.Pool` trong `prisma.ts` sử dụng cho toàn bộ Route Handlers của Next.js. |
| 2 | `DIRECT_URL` | `prisma.config.ts`<br>`scripts/test-session-helper.ts` | L5<br>L554 | Chuỗi kết nối trực tiếp hoặc Session Pooler (cổng 5432). Bắt buộc cho Prisma CLI (`prisma migrate deploy`) để thực thi câu lệnh DDL và giữ advisory locks. |
| 3 | `BETTER_AUTH_SECRET` | `src/lib/auth.ts`<br>`scripts/test-session-helper.ts` | L45<br>L627 | Khóa bí mật dùng cho Better Auth để ký phiên đăng nhập (session token), mã hóa cookie và xác thực chữ ký. Tối thiểu 32 ký tự. |
| 4 | `BETTER_AUTH_URL` | `src/lib/auth.ts` | L47 | Base URL phía server của Better Auth (`baseURL`). Dùng để sinh callback URL và xử lý redirect OAuth. Fallback về `NEXT_PUBLIC_APP_URL`. |
| 5 | `NEXT_PUBLIC_APP_URL` | `src/lib/auth.ts`<br>`src/lib/auth-client.ts`<br>`src/components/trips/detail/trip-invite-share-modal.tsx` | L48<br>L5<br>L57 | URL gốc chính thức của ứng dụng (ví dụ: `https://smarttrip.vn` hoặc `https://staging.tungcloud.online`). Dùng cho cả client-side auth client, chia sẻ link mời tham gia chuyến đi, và làm fallback cho `BETTER_AUTH_URL`. |
| 6 | `GOOGLE_CLIENT_ID` | `src/lib/auth.ts` | L41 | Client ID ứng dụng Google OAuth 2.0 đăng ký trên Google Cloud Console. |
| 7 | `GOOGLE_CLIENT_SECRET` | `src/lib/auth.ts` | L42 | Client Secret ứng dụng Google OAuth 2.0 đăng ký trên Google Cloud Console. |
| 8 | `BANK_ENCRYPTION_KEY` | `src/lib/crypto/bank-encryption.ts` | L14 | Khóa đối xứng 256-bit (chuỗi hex 64 ký tự) dùng cho thuật toán AES-256-GCM mã hóa số tài khoản ngân hàng người dùng lưu trong bảng `users`. Cơ chế fail-closed: văng lỗi nếu thiếu hoặc sai định dạng. |
| 9 | `SUPABASE_URL` | `src/lib/storage/receipts.ts` | L194 | URL REST API của Supabase project (`https://[PROJECT_REF].supabase.co`). Được `SupabaseRestStorageProvider` phía server sử dụng để gọi Storage API. |
| 10 | `NEXT_PUBLIC_SUPABASE_URL` | `src/lib/storage/receipts.ts` | L195 | Tùy chọn fallback cho `SUPABASE_URL` trong `receipts.ts`. Được liệt kê trong `.env.example` cũ nhưng không hề được bất kỳ Client Component nào sử dụng. |
| 11 | `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/storage/receipts.ts` | L197 | Khóa đặc quyền dịch vụ (Service Role Key) của Supabase. Cho phép Route Handler phía server thực hiện upload/download hóa đơn vào private bucket `trip-receipts`. Tuyệt đối không để lộ ra client. |
| 12 | `SUPABASE_STORAGE_BUCKET` | `src/lib/storage/receipts.ts` | L35 | Tên bucket lưu ảnh hóa đơn trên Supabase Storage. Mã nguồn đã có giá trị mặc định `"trip-receipts"`. |
| 13 | `RECEIPT_MAX_SIZE_BYTES` | `src/lib/storage/receipts.ts` | L16 | Dung lượng tối đa cho phép của một ảnh hóa đơn (tính bằng bytes). Mã nguồn đã có giá trị mặc định `5242880` (5 MB). |
| 14 | `DB_POOL_MAX` | `src/lib/db/prisma.ts` | L8 | Số lượng kết nối tối đa cho `pg.Pool`. Mã nguồn đã tự động đặt `1` khi phát hiện biến `VERCEL` (serverless) và `10` cho môi trường thông thường. |
| 15 | `TRUSTED_CLIENT_IP_HEADER` | `src/lib/api/rate-limit.ts` | L98 | Tên HTTP Header chứa IP thật của client từ reverse proxy (`"x-forwarded-for"`, `"x-real-ip"`, hoặc `"cf-connecting-ip"`). Nếu không cấu hình, hệ thống fail-closed về `"127.0.0.1"`. |
| 16 | `NEXT_PUBLIC_BETTER_AUTH_URL`| `src/lib/auth-client.ts` | L6 | Tùy chọn fallback thứ hai cho `authClient` client-side nếu thiếu `NEXT_PUBLIC_APP_URL`. |
| 17 | `SHADOW_DATABASE_URL` | `prisma.config.ts` | L32 | Biến tùy chọn cho Prisma Migrate khi tạo migration ở local (shadow database). Không dùng trong production deployment. |
| 18 | `BASE_URL` | `scripts/smoke-runner.ts`<br>`scripts/gate-4a-orchestrator.ts` | L2043<br>L607 | Biến nội bộ chỉ dùng cho scripts kiểm thử E2E offline. Không thuộc runtime ứng dụng web. |
| *—* | `NODE_ENV`, `VERCEL` | `src/lib/db/prisma.ts`, `src/lib/api/response.ts` | L16, L29 | Biến hệ thống do Next.js và nền tảng Vercel tự động tiêm vào runtime (ví dụ `NODE_ENV=production`, `VERCEL=1`). Không cần khai báo thủ công. |

---

## 2. Mức độ Bắt buộc và Phạm vi Triển khai của Từng Biến

Dựa trên phân tích luồng thực thi của mã nguồn Next.js App Router (Server-side vs Client-side), các biến được phân chia thành 4 nhóm rõ rệt:

### Nhóm A: Bắt buộc Tuyệt đối trên Vercel Production Runtime (8 biến)
Nếu thiếu bất kỳ biến nào trong nhóm này, ứng dụng trên Production sẽ bị lỗi 500 hoặc không thể đăng nhập/kết nối:

| Tên biến | Phạm vi Vercel | Vị trí thực thi | Hậu quả nếu thiếu |
| :--- | :---: | :---: | :--- |
| `DATABASE_URL` | Production | Server-only | Không thể kết nối cơ sở dữ liệu Supabase qua `pg.Pool`; toàn bộ API routes trả lỗi 500. |
| `BETTER_AUTH_SECRET` | Production | Server-only | Better Auth không thể khởi tạo hoặc không thể ký session/cookie. |
| `NEXT_PUBLIC_APP_URL` | Production | Client & Server | Sai lệch URL sinh mã mời, callback Google OAuth bị trỏ về `localhost:3000`. |
| `GOOGLE_CLIENT_ID` | Production | Server-only | Đăng nhập Google OAuth thất bại ngay tại bước tạo phiên xác thực. |
| `GOOGLE_CLIENT_SECRET` | Production | Server-only | Google từ chối cấp token xác thực ở bước trao đổi mã ủy quyền (Authorization Code). |
| `BANK_ENCRYPTION_KEY` | Production | Server-only | Fail-closed: Văng ngoại lệ `[Security] BANK_ENCRYPTION_KEY is missing or empty` khi người dùng cập nhật hoặc xem thông tin tài khoản ngân hàng. |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | Server-only | Route Handlers hóa đơn (`/api/trips/[id]/receipts`) trả lỗi 503 `STORAGE_CONFIG_MISSING`. |
| `SUPABASE_URL` *(hoặc `NEXT_PUBLIC_SUPABASE_URL`)* | Production | Server-only | `SupabaseRestStorageProvider` không xác định được endpoint lưu trữ; không thể tải ảnh hóa đơn. |

### Nhóm B: Bắt buộc cho Migration CLI / CI/CD (1 biến — Không cần trên Vercel runtime)
| Tên biến | Phạm vi triển khai | Mục đích sử dụng | Ghi chú vận hành |
| :--- | :---: | :--- | :--- |
| `DIRECT_URL` | Deployment Pipeline / Local CLI | Dành riêng cho lệnh `prisma migrate deploy` kết nối cổng 5432 (Session Pooler hoặc True Direct). | Trong `package.json`, lệnh build là `prisma generate && next build`. Lệnh `prisma generate` **không kết nối database**. Do đó Vercel build/runtime không cần `DIRECT_URL`. Chỉ người hoặc pipeline chạy migration DDL mới cần biến này. |

### Nhóm C: Khuyến nghị Cấu hình trên Vercel Production (2 biến)
| Tên biến | Phạm vi Vercel | Giá trị khuyến nghị | Lý do khuyến nghị |
| :--- | :---: | :---: | :--- |
| `BETTER_AUTH_URL` | Production (Server) | Cùng giá trị với `NEXT_PUBLIC_APP_URL` | Đảm bảo tính nhất quán tuyệt đối cho Better Auth server-side khi tạo redirect URIs, không phụ thuộc vào fallback. |
| `TRUSTED_CLIENT_IP_HEADER` | Production (Server) | `"x-forwarded-for"` | Cho phép module `rate-limit.ts` trích xuất IP client chính xác qua Vercel Edge Proxy. Nếu thiếu, rate-limiting cho các yêu cầu chưa đăng nhập (tra cứu mã mời) sẽ dùng chung IP `"127.0.0.1"`. |

### Nhóm D: Tùy chọn — Mã nguồn Đã có Giá trị Mặc định (Default Fallback) (4 biến)
| Tên biến | Giá trị mặc định trong code | Hành vi khi không cấu hình trên Vercel |
| :--- | :---: | :--- |
| `SUPABASE_STORAGE_BUCKET` | `"trip-receipts"` | Tự động sử dụng bucket `"trip-receipts"`. Chỉ cần cấu hình nếu muốn đổi tên bucket. |
| `RECEIPT_MAX_SIZE_BYTES` | `5242880` (5 MB) | Tự động giới hạn dung lượng tải ảnh hóa đơn ở mức 5 MB theo đúng yêu cầu nghiệp vụ UC32. |
| `DB_POOL_MAX` | `1` trên Vercel, `10` ở local | Hàm `parsePoolMax()` trong `prisma.ts` kiểm tra `process.env.VERCEL ? 1 : 10`. Trên Vercel, biến `VERCEL=1` luôn có sẵn nên tự động dùng `max: 1` cho serverless mà không cần cấu hình thêm. |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | — | Fallback thứ 2 sau `NEXT_PUBLIC_APP_URL`. Hoàn toàn dư thừa khi `NEXT_PUBLIC_APP_URL` đã có. |

---

## 3. Các Điểm Không Nhất Quán và Bằng Chứng Đối Soát

Qua rà soát chi tiết mã nguồn, 4 điểm không nhất quán quan trọng giữa các tài liệu trước đây và code thực tế đã được làm rõ:

### 3.1. `SUPABASE_URL` so với `NEXT_PUBLIC_SUPABASE_URL`
- **Bằng chứng trong mã nguồn (`src/lib/storage/receipts.ts` L193-196):**
  ```typescript
  this.url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    null;
  ```
- **Phân tích:**
  - File `.env.example` khai báo `NEXT_PUBLIC_SUPABASE_URL`. Báo cáo Phase 3ZX lại ghi `SUPABASE_URL`.
  - Toàn bộ thao tác tải và xem ảnh hóa đơn (UC32) đều chạy qua Next.js Route Handlers (`/api/trips/[id]/receipts` và `/api/trips/[id]/receipts/[key]`). Client browser không bao giờ gọi trực tiếp vào Supabase Storage REST API.
  - Việc dùng tiền tố `NEXT_PUBLIC_` khiến Supabase Project URL bị đóng gói vào client JavaScript bundle một cách không cần thiết.
- **Đề xuất ít rủi ro nhất:**
  - Trên Vercel Production: Khai báo `SUPABASE_URL` (không có tiền tố `NEXT_PUBLIC_`). Hoặc nếu hệ thống đã có `NEXT_PUBLIC_SUPABASE_URL`, mã nguồn vẫn đọc bình thường qua cơ chế fallback an toàn. Không sửa code.

### 3.2. `DB_POOL_MAX` và Cấu hình Connection Pool Thực tế
- **Bằng chứng trong mã nguồn (`src/lib/db/prisma.ts` L7-17):**
  ```typescript
  function parsePoolMax(): number {
    const envVal = process.env.DB_POOL_MAX?.trim();
    if (envVal) {
      const parsed = parseInt(envVal, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    // Mặc định: 1 cho serverless (Vercel), 10 cho container/server dài hạn
    return process.env.VERCEL ? 1 : 10;
  }
  ```
- **Phân tích:**
  - Báo cáo 3ZX liệt kê `DB_POOL_MAX` là biến cần cấu hình cho Vercel. Nhưng file `.env.example` không hề nhắc đến biến này.
  - Mã nguồn đã được thiết kế sẵn cơ chế nhận diện môi trường Vercel (`process.env.VERCEL`), tự động trả về `1` để tối ưu cho kiến trúc serverless và chống cạn kiệt pool kết nối Supabase.
- **Đề xuất ít rủi ro nhất:**
  - `DB_POOL_MAX` là biến **TÙY CHỌN**. Không bắt buộc phải nhập trên Vercel. Nếu người dùng muốn tường minh, có thể đặt `DB_POOL_MAX=1`, nhưng nếu bỏ qua thì hệ thống vẫn tự động chạy ở mức `1`.

### 3.3. `RECEIPT_MAX_SIZE_BYTES` và Giới hạn Dung lượng Hóa đơn
- **Bằng chứng trong mã nguồn (`src/lib/storage/receipts.ts` L13-24):**
  ```typescript
  export const DEFAULT_MAX_RECEIPT_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

  export function getMaxReceiptSizeBytes(): number {
    const envVal = process.env.RECEIPT_MAX_SIZE_BYTES;
    if (envVal) {
      const parsed = parseInt(envVal, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return DEFAULT_MAX_RECEIPT_SIZE_BYTES;
  }
  ```
- **Phân tích:**
  - File `.env.example` có biến `RECEIPT_MAX_SIZE_BYTES="5242880"`. Báo cáo 3ZX bỏ sót biến này trong bảng danh sách biến.
  - Tuy nhiên, mã nguồn đã có hằng số mặc định `5 * 1024 * 1024` (5 MB).
- **Đề xuất ít rủi ro nhất:**
  - `RECEIPT_MAX_SIZE_BYTES` là biến **TÙY CHỌN**. Không cần nhập trên Vercel Production trừ khi muốn áp dụng một hạn mức khác 5 MB.

### 3.4. Đối soát Tổng số Biến: Thực tế so với Con số 11 trong Báo cáo Phase 3ZX
- **Bằng chứng phân tích:**
  - Báo cáo 3ZX nêu con số "11 biến môi trường độc lập của Production" bao gồm cả biến runtime và biến migration CLI (`DIRECT_URL`), cùng 2 biến đã có default (`SUPABASE_STORAGE_BUCKET`, `DB_POOL_MAX`).
  - Trong khi đó, báo cáo 3ZX chưa nhắc tới `TRUSTED_CLIENT_IP_HEADER` (quan trọng cho bảo mật rate limiting trên Vercel) và `RECEIPT_MAX_SIZE_BYTES`.
- **Bảng đối chiếu tổng hợp:**
  - **8 biến cốt lõi bắt buộc** trên Vercel Production Runtime.
  - **1 biến bắt buộc cho Migration CLI** (`DIRECT_URL` — ngoài phạm vi Vercel runtime).
  - **2 biến khuyến nghị** (`BETTER_AUTH_URL`, `TRUSTED_CLIENT_IP_HEADER`).
  - **3 biến tùy chọn có default** (`SUPABASE_STORAGE_BUCKET`, `RECEIPT_MAX_SIZE_BYTES`, `DB_POOL_MAX`).

---

## 4. Checklist Bảng Điều Khiển (Dashboard Checklist) Tự Xác Minh An Toàn

Người dùng có thể đối chiếu trực tiếp trên các dashboard quản trị theo danh sách kiểm tra dưới đây mà không cần chia sẻ bất kỳ giá trị bí mật nào:

### 4.1. Vercel Dashboard $\rightarrow$ Project Settings $\rightarrow$ Environment Variables
Chọn Filter: **Production** và kiểm tra sự hiện diện (tick chọn):

- [ ] `DATABASE_URL`: Đã nhập, trỏ đến Transaction Pooler Supabase (cổng 6543, chứa `?pgbouncer=true`).
- [ ] `BETTER_AUTH_SECRET`: Đã nhập, chuỗi bí mật tối thiểu 32 ký tự.
- [ ] `NEXT_PUBLIC_APP_URL`: Đã nhập, giá trị dạng `https://[DOMAIN_CHÍNH_THỨC]` (không có dấu gạch chéo `/` ở cuối).
- [ ] `BETTER_AUTH_URL`: Đã nhập, khớp với `NEXT_PUBLIC_APP_URL`.
- [ ] `GOOGLE_CLIENT_ID`: Đã nhập, kết thúc bằng `.apps.googleusercontent.com`.
- [ ] `GOOGLE_CLIENT_SECRET`: Đã nhập.
- [ ] `BANK_ENCRYPTION_KEY`: Đã nhập, đúng 64 ký tự hex (khóa 256-bit).
- [ ] `SUPABASE_URL` *(hoặc `NEXT_PUBLIC_SUPABASE_URL`)*: Đã nhập, định dạng `https://fzdaasbckmnndqzqopex.supabase.co`.
- [ ] `SUPABASE_SERVICE_ROLE_KEY`: Đã nhập, Service Role Key của project `fzdaasbckmnndqzqopex`.
- [ ] `TRUSTED_CLIENT_IP_HEADER` *(khuyến nghị)*: Đã nhập giá trị `x-forwarded-for`.
- [ ] `SUPABASE_STORAGE_BUCKET` *(tùy chọn)*: Đã nhập `trip-receipts` (hoặc để trống dùng mặc định).
- [ ] `DB_POOL_MAX` *(tùy chọn)*: Đã nhập `1` (hoặc để trống để code tự nhận diện Vercel).

### 4.2. Supabase Dashboard (Project Production `fzdaasbckmnndqzqopex`)
- [ ] **Database Connection Pooling:** Settings $\rightarrow$ Database $\rightarrow$ Connection Pooler $\rightarrow$ Bật chế độ Transaction (Port 6543).
- [ ] **Storage Bucket:** Storage $\rightarrow$ Buckets $\rightarrow$ Kiểm tra bucket `trip-receipts` đã được tạo và cờ **Public** ở trạng thái **OFF (Private)**.
- [ ] **Backup:** Database $\rightarrow$ Backups $\rightarrow$ Đã có bản Daily Backup hoặc bấm Manual Snapshot trước khi release.

### 4.3. Google Cloud Console (APIs & Services $\rightarrow$ Credentials)
- [ ] **Authorized JavaScript origins:** Đã có `https://[DOMAIN_CHÍNH_THỨC]`.
- [ ] **Authorized redirect URIs:** Đã có `https://[DOMAIN_CHÍNH_THỨC]/api/auth/callback/google`.

---

## 5. Rà soát Quy trình Triển khai & Các Migration

### 5.1. Quy trình Build trên Vercel
- Script build trong `package.json`:
  ```bash
  npm run build  # tương đương: prisma generate && next build
  ```
- **Đặc tính an toàn:**
  - Lệnh `prisma generate` chỉ biên dịch các định nghĩa TypeScript cho Prisma Client dựa trên file `schema.prisma`. Lệnh này **không thiết lập kết nối đến cơ sở dữ liệu** và **không thực thi migration**.
  - Do đó, quá trình Vercel Build hoàn toàn độc lập với việc kết nối cơ sở dữ liệu và không yêu cầu biến `DIRECT_URL`.

### 5.2. Rà soát 3 Migration trong `prisma/migrations/`
1. `0001_release1_schema`:
   - Tạo 16 bảng nghiệp vụ, 9 enums, các chỉ mục unique bảo toàn dữ liệu và partial index `one_pending_claim`.
2. `0002_data_api_lockdown`:
   - Bật Row-Level Security (RLS) trên 16 bảng nghiệp vụ và bảng metadata `_prisma_migrations`.
   - Thu hồi toàn bộ quyền truy cập Data API (PostgREST) đối với `anon` và `authenticated`. Bắt buộc mọi truy cập dữ liệu phải đi qua Next.js Route Handlers.
3. `0003_add_itinerary_time_fields`:
   - Bổ sung 2 cột thời gian `start_time` và `end_time` (kiểu `TIME(0)` nullable) cho bảng `itinerary_items`.

### 5.3. Yêu cầu Vận hành Migration Tuyệt đối An toàn
- Trong file `prisma.config.ts`, cơ chế bảo vệ CLI đã được lập trình để chặn việc chạy `prisma migrate deploy` qua Transaction Pooler cổng 6543:
  ```typescript
  const isPooler = databaseUrl.includes(":6543") || databaseUrl.includes("pgbouncer=true");
  if (isPooler) {
    throw new Error("[Prisma CLI Protection] Phát hiện DATABASE_URL đang trỏ đến Transaction Connection Pooler...");
  }
  ```
- Do đó, khi kỹ sư thực thi `prisma migrate deploy` lên Supabase Production, biến `DIRECT_URL` (trỏ đến cổng 5432 của Supabase Session Pooler hoặc Direct Connection) bắt buộc phải được cung cấp trên máy kỹ sư hoặc pipeline triển khai.
- **Cấm tuyệt đối:** Không chạy `prisma migrate reset` hoặc `prisma db push` trên Production.

---

## 6. Danh sách Blocker Trước Khi Phát hành

| Mức độ | Mã Blocker | Mô tả chi tiết | Hành động giải quyết |
| :---: | :---: | :--- | :--- |
| **CRITICAL** | **BLK-ENV-01** | Thiếu biến môi trường cốt lõi trên Vercel Production. | Hoàn tất nhập đủ 8 biến Nhóm A trên Vercel Dashboard (Scope: Production). |
| **CRITICAL** | **BLK-ENV-02** | Google OAuth Redirect URI trên Google Cloud Console chưa thêm domain Production. | Bổ sung callback `https://[PRODUCTION_DOMAIN]/api/auth/callback/google` vào Google Cloud Console. |
| **HIGH** | **BLK-ENV-03** | `DIRECT_URL` của Supabase Production chưa được chuẩn bị cho lệnh `prisma migrate deploy`. | Lấy chuỗi kết nối Session Pooler (port 5432) của project `fzdaasbckmnndqzqopex` để thực thi migration trước khi merge code vào `main`. |
| **HIGH** | **BLK-ENV-04** | Private Storage Bucket `trip-receipts` chưa được khởi tạo trên Supabase Production. | Vào Supabase Storage $\rightarrow$ Tạo bucket `trip-receipts` với tùy chọn Public: False. |

---

## 7. Kết luận

### Kết luận: `ENV MANIFEST VERIFIED`

**Lý do kết luận:**
1. Toàn bộ 18 biến môi trường xuất hiện trong mã nguồn đã được định danh, phân tích nguồn gốc, kiểm tra giá trị mặc định và phân loại phạm vi rõ ràng.
2. 4 điểm không nhất quán (giữa `SUPABASE_URL` vs `NEXT_PUBLIC_SUPABASE_URL`, cấu hình `DB_POOL_MAX`, `RECEIPT_MAX_SIZE_BYTES`, và số lượng biến thực tế so với báo cáo 3ZX) đã được giải quyết thỏa đáng bằng chứng cứ cụ thể từ mã nguồn.
3. Không có sự thay đổi mã nguồn tùy tiện; toàn bộ các cơ chế fallback sẵn có của ứng dụng được bảo toàn nguyên vẹn.
4. Hệ thống đã có đầy đủ checklist bảng điều khiển và phân loại blocker cụ thể để người dùng tự xác minh các cấu hình Production một cách độc lập và bảo mật tuyệt đối.
