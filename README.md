<div align="center">

# 🗺️ Smart Trip & Expense Planner

### Nền tảng lập kế hoạch du lịch nhóm thông minh, tối ưu lộ trình di chuyển & chia sẻ chi phí minh bạch với VietQR EMVCo Napas 247

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.2-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Prisma 7](https://img.shields.io/badge/Prisma-7.10.1-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Tests-1%2C357%20Passed-22c55e?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Full_(Strict)-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)

<br />

[🌐 **Trải nghiệm trực tiếp (Live Demo)**](https://tungcloud.online) • [📖 **Tiêu chuẩn kỹ thuật**](docs/ENGINEERING_STANDARDS.md) • [📌 **Ngữ cảnh dự án**](PROJECT_CONTEXT.md) • [🚀 **Bắt đầu nhanh**](#-bắt-đầu-nhanh)

</div>

---

## 📖 Giới thiệu tổng quan

**Smart Trip & Expense Planner** là giải pháp toàn diện giúp các nhóm bạn bè, gia đình hoặc đồng nghiệp dễ dàng tổ chức các chuyến đi du lịch trọn vẹn từ khâu chuẩn bị đến khi kết thúc:
- **Trước chuyến đi:** Khám phá 26 địa danh danh thắng Việt Nam, lên lịch trình chi tiết theo ngày, tự động tính toán lộ trình tối ưu và theo dõi dự báo thời tiết.
- **Trong chuyến đi:** Ghi chép tức thời các khoản chi tiêu chung, chia đều hoặc chia theo từng món cụ thể, đính kèm ảnh chụp hóa đơn an toàn.
- **Sau chuyến đi:** Tự động chốt sổ công nợ, áp dụng thuật toán rút gọn số lượng giao dịch tối thiểu và thanh toán 1 chạm bằng mã **VietQR chuẩn EMVCo Napas 247**.

---

## ✨ Tính năng nổi bật

### 1. 📍 Lập lịch trình & Bản đồ tương tác
- **Lịch trình thông minh:** Tổ chức các điểm dừng theo từng ngày, mốc thời gian, loại hình hoạt động (tham quan, ăn uống, nghỉ ngơi).
- **Bản đồ Leaflet & OpenStreetMap:** Hiển thị trực quan toàn bộ các điểm dừng trên bản đồ số, vẽ tuyến nối hành trình (Polyline).
- **Thuật toán tối ưu lộ trình (TSP 2-Opt):** Ứng dụng thuật toán tối ưu bài toán người giao hàng (Traveling Salesperson Problem) để tự động sắp xếp thứ tự các điểm đến, giúp tiết kiệm tối đa thời gian và quãng đường di chuyển.
- **Dự báo thời tiết thời gian thực:** Tích hợp Open-Meteo API để cập nhật nhiệt độ, thời tiết và phát cảnh báo thời tiết bất lợi cho các hoạt động ngoài trời.

### 2. 💸 Quản lý chi tiêu & Chia tiền sòng phẳng
- **Linh hoạt phương thức chia:**
  - *Chia đều (Equal Split):* Tự động chia số tiền cho tất cả hoặc các thành viên được chọn, bảo toàn số dư nguyên vẹn đến từng đồng.
  - *Chia theo từng món (Itemized Split):* Hỗ trợ các hóa đơn phức tạp (món ăn riêng, phụ thu, đồ uống riêng của từng cá nhân).
- **Lưu trữ ảnh hóa đơn riêng tư (Private Storage):** 
  - Ảnh hóa đơn được lưu trong bucket riêng biệt trên Supabase Storage.
  - Xác thực Magic Bytes (JPEG, PNG, WebP) tại server chống mã độc.
  - Truy cập qua API Proxy bảo mật có phân quyền — chỉ thành viên trong chuyến đi mới được xem hóa đơn.

### 3. 💳 Chốt sổ công nợ & Thanh toán VietQR
- **Thuật toán rút gọn nợ (Debt Simplification):** 
  - Tối ưu hóa ma trận nợ chéo giữa các thành viên thành số lượng giao dịch ít nhất có thể, bảo toàn bất biến $\sum \text{Net} = 0$.
- **Tạo mã VietQR Napas 247 Offline:**
  - Tự động sinh mã VietQR theo chuẩn quốc tế EMVCo hoàn toàn offline (không phụ thuộc API bên thứ ba).
  - Quét bằng bất kỳ ứng dụng ngân hàng nào tại Việt Nam là tự động điền sẵn số tài khoản, tên người nhận, số tiền nợ chính xác và nội dung chuyển khoản.
- **Theo dõi trạng thái thanh toán:** Đánh dấu đã chuyển tiền, trưởng nhóm xác nhận đã nhận, mở lại sổ đối soát khi cần bổ sung chi phí.

### 4. 🧭 Cẩm nang & Khám phá 26 Danh thắng Việt Nam
- Kho dữ liệu cẩm nang phong phú bao phủ khắp 3 miền Bắc - Trung - Nam (Hạ Long, Tràng An, Sa Pa, Hà Giang, Phú Quốc, Đà Lạt, Eo Gió, Nha Trang,...).
- Tọa độ GPS chuẩn xác, lịch trình mẫu 3N2Đ, dự toán kinh phí thực tế, thời điểm du lịch lý tưởng và gợi ý ẩm thực bản địa.
- Bộ sưu tập hình ảnh chất lượng cao được tuyển chọn kỹ lưỡng.

### 5. 🛡️ Bảo mật cấp doanh nghiệp (Enterprise Security)
- **Mã hóa STK ngân hàng bằng AES-256-GCM:** Số tài khoản ngân hàng của người dùng được mã hóa bằng thuật toán đối xứng 256-bit tại server trước khi lưu vào database.
- **Xác thực đa phương thức (Better Auth):**
  - Đăng nhập bảo mật qua **Google OAuth 2.0**.
  - Đăng ký qua **Email & Mật khẩu** với mã xác thực OTP gửi qua **Resend Email**.
  - Mật khẩu được băm an toàn bằng thuật toán **`scrypt`** (Memory-hard KDF đạt chuẩn OWASP).
  - Hỗ trợ **Account Linking** tự động liên kết tài khoản Google với Email đã xác thực.
- **Tường lửa & Chống tấn công:**
  - Bảo vệ qua **Cloudflare WAF** với SSL/TLS chế độ **Full (strict)**, HSTS 6 tháng.
  - Hệ thống **Rate Limiting nguyên tử dựa trên PostgreSQL** (`checkPostgresRateLimit`) ngăn chặn brute-force và spam OTP/AI.
  - Thuật toán trích xuất Client IP an toàn qua header `CF-Connecting-IP`, chống IP Spoofing.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

| Tầng kiến trúc | Công nghệ | Mục đích sử dụng |
| :--- | :--- | :--- |
| **Framework** | **Next.js 16.4 (App Router, Turbopack)** | Nền tảng full-stack hiện đại, SSR/SSG tối ưu SEO & tốc độ |
| **Frontend UI** | **React 19, Tailwind CSS 4** | Giao diện phong cách *Tactile Organic Minimalism*, hỗ trợ Dark Mode |
| **Icon & UI Primitives** | **Lucide React, Radix UI** | Bộ icon vector sắc nét và các component trợ năng chuẩn a11y |
| **Bản đồ số** | **Leaflet, OpenStreetMap, Nominatim** | Bản đồ tương tác, tìm kiếm tọa độ địa danh |
| **Cơ sở dữ liệu** | **PostgreSQL (Supabase)** | Cơ sở dữ liệu quan hệ mạnh mẽ, ACID transaction |
| **Connection Pooler** | **Supabase Transaction Pooler (PgBouncer)** | Tối ưu kết nối Database cho môi trường Serverless (Port 6543) |
| **ORM** | **Prisma 7.10** | Type-safe Database Client & Migration engine |
| **Xác thực (Auth)** | **Better Auth 1.7** | Quản lý phiên làm việc bảo mật, Google OAuth, Email/Password |
| **Mã hóa (Crypto)** | **Node.js Crypto (AES-256-GCM, scrypt, SHA-256)** | Mã hóa dữ liệu tài chính nhạy cảm và băm mật khẩu |
| **Dịch vụ Email** | **Resend API** | Gửi email mã OTP xác thực đăng ký tài khoản |
| **Thời tiết** | **Open-Meteo API** | Dự báo thời tiết miễn phí, không cần API key |
| **Hạ tầng & CDN** | **Vercel & Cloudflare** | Edge Network, DDoS Protection, WAF, Full (strict) SSL |
| **Testing** | **Vitest 5.0** | Unit tests, Integration tests, Property-based testing |

---

## 📐 Kiến trúc & Luồng xử lý dữ liệu

```mermaid
flowchart TD
    User([Người dùng / Trình duyệt])
    
    subgraph Edge ["Tầng Biên (Edge & Security)"]
        CF[Cloudflare WAF / Full Strict SSL / DDoS Guard]
        Proxy[Next.js 16 Proxy / Auth Guards / HSTS]
    end

    subgraph App ["Tầng Ứng Dụng (Next.js 16 Full-Stack)"]
        Pages[React 19 Server & Client Components]
        API[Route Handlers / REST APIs]
        Auth[Better Auth Service / Account Linking]
        Crypto[Mã hóa AES-256-GCM / Hash scrypt]
        TSP[Thuật toán Tối ưu Lộ trình 2-Opt]
        Simplify[Thuật toán Rút gọn Nợ]
        VietQR[Bộ sinh VietQR EMVCo Offline]
    end

    subgraph Backend ["Tầng Dịch Vụ & Dữ Liệu"]
        SupabaseDB[(PostgreSQL Supabase via Pooler :6543)]
        SupabaseStorage[(Private Storage Bucket: trip-receipts)]
        ResendAPI[Resend Mail Service]
        MeteoAPI[Open-Meteo Weather API]
    end

    User -->|HTTPS| CF
    CF -->|CF-Connecting-IP| Proxy
    Proxy --> Pages
    Pages --> API
    API --> Auth
    API --> Crypto
    API --> TSP
    API --> Simplify
    API --> VietQR
    API --> ResendAPI
    API --> MeteoAPI
    Auth --> SupabaseDB
    Crypto --> SupabaseDB
    API --> SupabaseDB
    API -->|Proxy có phân quyền| SupabaseStorage
```

---

## 🧪 Chất lượng mã nguồn & Kiểm thử (Testing)

Dự án áp dụng tiêu chuẩn kiểm thử khắt khe với **Vitest**, kiểm chứng từ đơn vị thuật toán đến các luồng tích hợp cơ sở dữ liệu:

```bash
$ npm test

 Test Files  121 passed (121)
      Tests  1357 passed (1357)
   Start at  13:29:21
   Duration  16.35s
```

- **Property-based Testing:** Kiểm thử 2.000 trường hợp chia tiền ngẫu nhiên và 1.000 trường hợp số dư nợ để khẳng định thuật toán luôn bảo toàn $\sum \text{Shares} = \text{Total}$ và $\sum \text{Net} = 0$.
- **Bảo mật phân quyền:** Kiểm thử hơn 200 kịch bản kiểm tra quyền (Host vs Member, thành viên đã rời nhóm, người ngoài cuộc).
- **Linter & Type Check:**
  - `npx tsc --noEmit` đạt **0 errors**.
  - `npm run lint` đạt **0 errors, 0 warnings**.

---

## 🚀 Bắt đầu nhanh (Getting Started)

### Yêu cầu hệ thống
- **Node.js:** phiên bản `20.x` hoặc `22.x` trở lên
- **npm:** phiên bản `10.x` trở lên (hoặc `pnpm` / `yarn`)
- **Tài khoản Supabase** (PostgreSQL Database & Storage Bucket)

### 1. Khởi tạo dự án
```bash
# Clone repository
git clone https://github.com/caothanhtungg/smart-trip.git
cd smart-trip

# Cài đặt các gói phụ thuộc
npm install
```

### 2. Cấu hình biến môi trường
Sao chép file mẫu `.env.example` thành `.env.local`:
```bash
cp .env.example .env.local
```

Mở `.env.local` và điền các khóa cấu hình:
```env
# Database PostgreSQL (Lấy từ Supabase -> Connect -> Transaction Pooler)
DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# Xác thực Better Auth
BETTER_AUTH_SECRET="chuoi-bi-mat-ngau-nhien-toi-thieu-32-ky-tu"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google OAuth (Lấy từ Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"

# Khóa mã hóa STK ngân hàng AES-256-GCM (Chuỗi Hex 64 ký tự)
# Sinh nhanh: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
BANK_ENCRYPTION_KEY="64-ky-tu-hex-ngau-nhien"

# Supabase Storage (UC32 Lưu trữ hóa đơn)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_STORAGE_BUCKET="trip-receipts"

# Gửi email OTP (Resend)
RESEND_API_KEY="re_your_resend_api_key"
```

### 3. Đồng bộ cơ sở dữ liệu
```bash
# Sinh Prisma Client
npx prisma generate

# Đẩy schema lên database
npx prisma db push
```

### 4. Khởi động môi trường phát triển
```bash
npm run dev
```
Mở trình duyệt tại địa chỉ [http://localhost:3000](http://localhost:3000) để trải nghiệm ứng dụng.

---

## 📁 Cấu trúc thư mục dự án

```text
smart-trip/
├── .github/workflows/        # Cấu hình GitHub Actions CI tự động
├── docs/                     # Tài liệu tiêu chuẩn kỹ thuật & quy trình
├── prisma/
│   └── schema.prisma         # Đặc tả mô hình dữ liệu quan hệ PostgreSQL
├── public/                   # Tài nguyên tĩnh (ảnh danh thắng, icons, video hero)
├── sodothietke/              # Sơ đồ thiết kế Use Case, ERD, Sequence diagrams
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (app)/            # Các trang riêng tư (/trips, /guides, /profile)
│   │   ├── (public)/         # Các trang công khai (Landing page, /login)
│   │   └── api/              # Hơn 30 Route Handlers (Auth, Trips, Receipts...)
│   ├── components/           # Thư viện UI Components
│   │   ├── ai/               # Trợ lý AI du lịch
│   │   ├── guides/           # Cẩm nang du lịch & Modal chi tiết
│   │   ├── itinerary/        # Bản đồ, Route Optimization bar, Thời tiết
│   │   ├── landing/          # Các khối Landing Page, Bento grid, Showcase
│   │   ├── layout/           # AppTopBar, AppSidebar, UserMenuDropup
│   │   ├── map/              # Bản đồ Leaflet Map tích hợp
│   │   ├── profile/          # Hồ sơ cá nhân & STK ngân hàng
│   │   ├── trips/            # Quản lý chuyến đi, thành viên, chi tiêu, VietQR
│   │   └── ui/               # Component nền tảng (Modal, Button, Toast...)
│   ├── lib/                  # Thư viện lõi & Xử lý nghiệp vụ
│   │   ├── ai/               # AI Assistant Service & Local Fallback Engine
│   │   ├── api/              # Error handling, Auth guards, Rate limiter
│   │   ├── auth/             # Better Auth server & OTP store
│   │   ├── crypto/           # AES-256-GCM Encrypt/Decrypt STK
│   │   ├── db/               # Prisma Client singleton & Pool manager
│   │   ├── geo/              # Tọa độ 26 danh thắng, Thời tiết Open-Meteo
│   │   ├── guides/           # Dữ liệu cẩm nang du lịch
│   │   ├── money/            # VietQR generator, Thuật toán Split & Simplify
│   │   └── storage/          # Supabase Private Storage Provider & Magic Bytes
│   └── proxy.ts              # Route Guard & Bảo vệ chuyển hướng an toàn
├── .gitattributes            # Chuẩn hóa ký tự kết thúc dòng LF đa nền tảng
├── .gitignore                # Danh mục loại trừ nhị phân & file nhạy cảm
└── package.json              # Danh mục thư viện & Scripts thực thi
```

---

## 📜 Giấy phép (License)

Dự án được phát triển phục vụ mục đích học tập, nghiên cứu và phát triển phần mềm theo giấy phép [MIT License](LICENSE).

---

<div align="center">
  <sub>Được xây dựng với niềm đam mê du lịch và công nghệ bởi <b>Cao Thanh Tùng</b> • 2026</sub>
</div>
