<div align="center">

<a href="https://tungcloud.online" target="_blank">
  <img src="docs/assets/banner.svg" alt="Smart Trip & Expense Planner Banner" width="100%" />
</a>

<br />

# 🗺️ Smart Trip & Expense Planner

### Nền tảng lập kế hoạch du lịch nhóm thông minh, tối ưu lộ trình di chuyển & chia sẻ chi phí minh bạch với VietQR EMVCo Napas 247

[![Production Live](https://img.shields.io/badge/Production-Live%20Demo-22c55e?style=for-the-badge&logo=vercel&logoColor=white)](https://tungcloud.online)
[![Vitest Coverage](https://img.shields.io/badge/Vitest-1%2C357%20Passed%20(100%25)-22c55e?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4.2-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.3.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript 5](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS 4](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Prisma 7](https://img.shields.io/badge/Prisma-7.10.1-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Supabase PostgreSQL](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Cloudflare Full Strict](https://img.shields.io/badge/Security-Cloudflare%20Full%20(Strict)-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)
[![License MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)

<br />

[🌐 **Trải nghiệm trực tiếp (Live Demo)**](https://tungcloud.online) • [✨ **Tính năng nổi bật**](#-tính-năng-nổi-bật) • [🖼️ **Giao diện trực quan**](#-giao-diện-trực-quan-showcase) • [⚡ **Kỹ nghệ & Thuật toán**](#-kỹ-nghệ-cốt-lõi--thuật-toán) • [📐 **Kiến trúc hệ thống**](#-kiến-trúc-hệ-thống--luồng-dữ-liệu) • [🧪 **Kiểm thử**](#-chất-lượng-mã-nguồn--kiểm-thử-testing) • [🚀 **Bắt đầu nhanh**](#-hướng-dẫn-cài-đặt-từng-bước)

---

</div>

## 📊 Bảng chỉ số ấn tượng (Project Metrics)

<table align="center" width="100%">
  <tr>
    <td align="center" width="33%" style="padding: 16px; background-color: #0f172a; border-radius: 10px;">
      <h3>🧪 <b>1,357 / 1,357 Tests</b></h3>
      <p><b>100% Test Coverage đỗ toàn bộ</b> trên 121 files test suite Vitest. Áp dụng Property-based testing & Fuzzing nghiêm ngặt.</p>
    </td>
    <td align="center" width="33%" style="padding: 16px; background-color: #0f172a; border-radius: 10px;">
      <h3>🗺️ <b>Thuật toán TSP 2-Opt</b></h3>
      <p><b>Tự động tối ưu hóa lộ trình</b> hành trình điểm đến theo bài toán Travelling Salesperson, tiết kiệm thời gian & nhiên liệu di chuyển.</p>
    </td>
    <td align="center" width="33%" style="padding: 16px; background-color: #0f172a; border-radius: 10px;">
      <h3>💳 <b>VietQR EMVCo Offline</b></h3>
      <p><b>Tạo mã QR Napas 247 cục bộ</b> chuẩn quốc tế EMVCo không phụ thuộc API bên thứ 3, quét thanh toán tức thời với mọi app ngân hàng.</p>
    </td>
  </tr>
  <tr>
    <td align="center" width="33%" style="padding: 16px; background-color: #0f172a; border-radius: 10px;">
      <h3>🌦️ <b>Open-Meteo Real-time</b></h3>
      <p><b>Dự báo thời tiết & Radar cảnh báo</b> mưa bão theo thời gian thực cho từng điểm dừng, bảo đảm an toàn cho các hoạt động ngoài trời.</p>
    </td>
    <td align="center" width="33%" style="padding: 16px; background-color: #0f172a; border-radius: 10px;">
      <h3>🔒 <b>Bảo mật AES-256-GCM</b></h3>
      <p><b>Mã hóa số tài khoản ngân hàng</b> nhạy cảm tại server bằng AES-256-GCM. Mật khẩu băm an toàn qua thuật toán <b>scrypt</b> chuẩn OWASP.</p>
    </td>
    <td align="center" width="33%" style="padding: 16px; background-color: #0f172a; border-radius: 10px;">
      <h3>🇻🇳 <b>26 Di sản & Danh thắng</b></h3>
      <p><b>Kho cẩm nang du lịch 3 miền</b> Bắc - Trung - Nam tích hợp sẵn tọa độ GPS, dự toán ngân sách và lịch trình mẫu 3N2Đ thực tế.</p>
    </td>
  </tr>
</table>

---

## 📖 Giới thiệu tổng quan

Việc tổ chức một chuyến du lịch nhóm thường gặp phải vô vàn trở ngại:
- Lên lịch trình rời rạc, các điểm đến bị ngược đường khiến cả nhóm kiệt sức vì di chuyển.
- Thời tiết thất thường làm hỏng các hoạt động dã ngoại ngoài trời.
- Hàng chục hóa đơn ăn uống, di chuyển, vé tham quan khiến việc tính toán chi phí trở thành "ác mộng".
- Ma trận nợ chéo phức tạp ("A nợ B, B nợ C, C nợ D") dẫn đến ngại ngùng, thiếu minh bạch và dễ mất hòa khí.

**Smart Trip & Expense Planner** ra đời như một giải pháp số hóa toàn diện, đồng hành cùng bạn và nhóm bạn trong suốt vòng đời chuyến đi:

```mermaid
flowchart LR
    A["🌟 Khám Phá & Lập Kế Hoạch<br/>• 26 Danh thắng Việt Nam<br/>• Lịch trình mẫu 3N2Đ"] --> B["🗺️ Tối Ưu Lộ Trình & Thời Tiết<br/>• Bản đồ tương tác Leaflet<br/>• Thuật toán TSP 2-Opt<br/>• Dự báo Open-Meteo"]
    B --> C["💸 Ghi Chép & Chia Tiền<br/>• Chia đều (Equal Split)<br/>• Chia theo món (Itemized)<br/>• Upload hóa đơn riêng tư"]
    C --> D["💳 Rút Gọn Nợ & VietQR<br/>• Bipartite Matching nợ<br/>• Sinh mã VietQR Offline<br/>• Quét app ngân hàng 1-chạm"]
```

---

## 🖼️ Giao diện trực quan (Showcase)

Dưới đây là một số giao diện thực tế của hệ thống được xây dựng theo phong cách thiết kế **Tactile Organic Minimalism**, tối ưu hóa trải nghiệm mượt mà trên cả máy tính lẫn thiết bị di động:

<table align="center" width="100%">
  <tr>
    <td width="50%" align="center">
      <img src="docs/assets/showcase-trips.png" alt="Quản lý chuyến đi" width="100%" style="border-radius: 8px; border: 1px solid #334155;" />
      <p><b>Dashboard quản lý chuyến đi</b> — Theo dõi tổng quan thành viên, ngày khởi hành và trạng thái thanh toán</p>
    </td>
    <td width="50%" align="center">
      <img src="docs/assets/showcase-expenses.png" alt="Quản lý chi tiêu" width="100%" style="border-radius: 8px; border: 1px solid #334155;" />
      <p><b>Ghi chép chi tiêu & Phân chia chi phí</b> — Hỗ trợ chia đều hoặc chia chi tiết từng món cho từng người</p>
    </td>
  </tr>
  <tr>
    <td width="50%" align="center">
      <img src="docs/assets/showcase-vietqr.png" alt="Thanh toán VietQR Napas 247" width="100%" style="border-radius: 8px; border: 1px solid #334155;" />
      <p><b>Thanh toán 1 chạm VietQR Napas 247</b> — Tự động điền số tài khoản, người nhận, số tiền và nội dung</p>
    </td>
    <td width="50%" align="center">
      <img src="docs/assets/showcase-destination-modal.png" alt="Cẩm nang danh thắng" width="100%" style="border-radius: 8px; border: 1px solid #334155;" />
      <p><b>Cẩm nang 26 Danh thắng Việt Nam</b> — Khám phá lịch trình mẫu, dự toán kinh phí và thời điểm lý tưởng</p>
    </td>
  </tr>
</table>

---

## ✨ Tính năng nổi bật

<table width="100%">
  <tr>
    <td width="50%" valign="top">
      <h3>🗺️ 1. Lập Lịch Trình & Tối Ưu Lộ Trình (TSP 2-Opt)</h3>
      <ul>
        <li><b>Bản đồ số tương tác:</b> Tích hợp Leaflet &amp; OpenStreetMap, hiển thị trực quan toàn bộ điểm đến và vẽ tuyến polyline liên tục.</li>
        <li><b>Thuật toán tối ưu đường đi (TSP 2-Opt):</b> Tự động tính toán hoán đổi các cặp điểm di chuyển, loại bỏ đường chéo cắt nhau, giảm thiểu tối đa quãng đường và thời gian di chuyển.</li>
        <li><b>Đánh dấu đa danh mục:</b> Phân loại điểm dừng theo tham quan, ẩm thực, khách sạn, check-in.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>🌦️ 2. Thời Tiết Thời Gian Thực (Open-Meteo)</h3>
      <ul>
        <li><b>Cập nhật dự báo chuẩn xác:</b> Liên kết trực tiếp tọa độ GPS của từng điểm đến với trạm khí tượng vệ tinh Open-Meteo.</li>
        <li><b>Chỉ số chi tiết:</b> Nhiệt độ thực tế, độ ẩm, sức gió và xác suất mưa theo từng khung giờ.</li>
        <li><b>Cảnh báo ngoài trời thông minh:</b> Tự động hiển thị cảnh báo khi có nguy cơ mưa dông, nắng gắt hoặc thời tiết bất lợi để người dùng chủ động đổi lịch trình.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>💸 3. Chia Tiền Linh Hoạt (Equal & Itemized Split)</h3>
      <ul>
        <li><b>Chia đều (Equal Split):</b> Chia đều số tiền cho cả nhóm hoặc nhóm thành viên được chọn, thuật toán bảo toàn số dư chia 1 đồng cho người tham gia trước theo thứ tự <code>join_order</code>.</li>
        <li><b>Chia theo từng món (Itemized Split):</b> Đáp ứng các hóa đơn phức tạp khi mỗi thành viên dùng các món khác nhau, tự động gộp tổng chính xác từng đồng.</li>
        <li><b>Lưu trữ hóa đơn riêng tư:</b> Ảnh chụp hóa đơn được bảo vệ trong Supabase Private Storage, phân quyền nghiêm ngặt chỉ thành viên chuyến đi mới xem được.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>💳 4. Rút Gọn Nợ & Thanh Toán VietQR Offline</h3>
      <ul>
        <li><b>Thuật toán rút gọn nợ (Debt Simplification):</b> Giải quyết ma trận nợ chéo nhiều bên, giảm số lượng giao dịch từ $O(N^2)$ xuống tối đa $N - 1$ giao dịch mà không làm thay đổi giá trị thu/chi ròng của từng người.</li>
        <li><b>Sinh mã VietQR Napas 247 Offline:</b> Sinh mã QR chuẩn EMVCo hoàn toàn cục bộ bằng thuật toán CRC-16/CCITT. Quét bằng bất kỳ ứng dụng ngân hàng nào tại Việt Nam là tự động điền đủ thông tin.</li>
        <li><b>Đối soát thanh toán:</b> Thành viên xác nhận đã chuyển, Host duyệt đã nhận, mở lại sổ khi cần đối soát.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">
      <h3>🔒 5. Bảo Mật Cấp Doanh Nghiệp (Enterprise Security)</h3>
      <ul>
        <li><b>Mã hóa STK ngân hàng bằng AES-256-GCM:</b> Dữ liệu tài khoản ngân hàng của người dùng được mã hóa đối xứng 256-bit tại tầng server trước khi lưu vào database.</li>
        <li><b>Better Auth &amp; Google OAuth 2.0:</b> Đăng nhập nhanh qua Google hoặc Email/Password OTP (Resend). Mật khẩu được băm bảo mật bằng <code>scrypt</code> memory-hard KDF.</li>
        <li><b>Hạ tầng Cloudflare WAF:</b> Tường lửa ngăn chặn DDoS, SSL/TLS chế độ Full (strict), trích xuất IP nguyên bản qua header <code>cf-connecting-ip</code> chống giả mạo IP.</li>
      </ul>
    </td>
    <td width="50%" valign="top">
      <h3>🧭 6. Cẩm Nang 26 Danh Thắng Việt Nam</h3>
      <ul>
        <li><b>Bao phủ trọn vẹn 3 miền:</b> Tuyển tập 26 di sản thiên nhiên &amp; văn hóa hàng đầu Việt Nam (Hạ Long, Tràng An, Sa Pa, Hà Giang, Phong Nha, Hội An, Phú Quốc, Đà Lạt...).</li>
        <li><b>Dữ liệu chuyên sâu:</b> Tọa độ GPS chuẩn xác, gợi ý lịch trình 3N2Đ từng buổi, bảng dự toán chi phí thực tế cho từng người, thời điểm du lịch đẹp nhất và cẩm nang ẩm thực.</li>
        <li><b>Một chạm nhân bản:</b> Cho phép khởi tạo nhanh một chuyến đi mới dựa trên lịch trình mẫu có sẵn.</li>
      </ul>
    </td>
  </tr>
</table>

---

## ⚡ Kỹ nghệ cốt lõi & Thuật toán

Dự án chú trọng tính đúng đắn toán học, độ bảo mật và hiệu năng vận hành thông qua các thuật toán được thiết kế bài bản:

### 1. Thuật toán tối ưu hóa lộ trình TSP 2-Opt Heuristic
Khi người dùng thêm nhiều điểm đến trong một ngày, việc di chuyển theo thứ tự nhập liệu ngẫu nhiên sẽ tạo ra các đoạn đường chéo cắt nhau gây lãng phí thời gian. Hệ thống giải quyết bằng:
1. **Ma trận khoảng cách Haversine:** Tính khoảng cách chính xác theo mặt cầu Trái Đất giữa mọi cặp tọa độ $(\text{lat}, \text{lng})$:
   $$d = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \varphi}{2}\right) + \cos \varphi_1 \cos \varphi_2 \sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
2. **2-Opt Edge Swap Iteration:** Khởi tạo lộ trình ban đầu bằng thuật toán tham lam (Greedy Nearest Neighbor), sau đó liên tục hoán đổi các cặp cạnh $(u, u+1)$ và $(v, v+1)$ nếu khoảng cách mới ngắn hơn:
   $$\text{dist}(u, v) + \text{dist}(u+1, v+1) < \text{dist}(u, u+1) + \text{dist}(v, v+1)$$
   Thuật toán hội tụ khi không còn cặp cạnh nào có thể tối ưu hơn, đảm bảo lộ trình thông suốt và ngắn nhất.

### 2. Thuật toán rút gọn nợ (Debt Simplification via Bipartite Greedy Matching)
Trong một chuyến đi nhóm với hàng chục khoản chi, việc thanh toán chéo từng khoản là điều bất khả thi.
- Hệ thống tính toán số dư ròng (Net Balance) của mỗi thành viên:
  $$\text{Net}_i = \text{Total Paid}_i - \text{Total Owed}_i$$
- Bảo toàn bất biến tài chính:
  $$\sum_{i=1}^{n} \text{Net}_i = 0$$
- Chia các thành viên thành 2 nhóm: **Chủ nợ** ($\text{Net} > 0$) và **Con nợ** ($\text{Net} < 0$).
- Thuật toán ghép đôi tham lam lấy con nợ lớn nhất thanh toán cho chủ nợ lớn nhất:
  $$\text{amount} = \min(|\text{Debtor}_{\max}|, \text{Creditor}_{\max})$$
  Cập nhật số dư và lặp lại cho đến khi toàn bộ số dư bằng $0$. Kết quả giảm thiểu ma trận nợ từ đồ thị phức tạp $O(N^2)$ xuống tối đa $N - 1$ giao dịch.

### 3. Bộ sinh chuẩn VietQR EMVCo Napas 247 Offline
Hệ thống tự động biên dịch thông tin tài khoản thành chuỗi ký tự theo chuẩn thanh toán quốc tế **EMVCo QR Code Specification for Payment Systems (Merchant-Presented QR)** mà không cần kết nối mạng:
- **Cấu trúc Tag-Length-Value (TLV):**
  - `ID 00`: Payload Format Indicator = `01`
  - `ID 01`: Point of Initiation Method = `12` (Dynamic QR hỗ trợ số tiền cụ thể)
  - `ID 38`: Merchant Account Information (Chứa Napas AID `A000000727`, Mã BIN ngân hàng 6 chữ số và Số tài khoản)
  - `ID 53`: Transaction Currency = `704` (Mã tiền tệ Việt Nam Đồng)
  - `ID 54`: Transaction Amount (Số tiền nợ chính xác đến từng đồng)
  - `ID 58`: Country Code = `VN`
  - `ID 62`: Additional Data Field (Nội dung chuyển khoản tự động)
  - `ID 63`: Checksum CRC-16 (Được tính toán bằng thuật toán **CRC-16/CCITT-FALSE** với đa thức $0\text{x}1021$ và giá trị khởi tạo $0\text{xFFFF}$)

> [!TIP]
> Nhờ cơ chế sinh mã Offline hoàn toàn, người dùng có thể thanh toán công nợ ngay tại những địa điểm du lịch vùng sâu vùng xa hoặc trên đồi núi mà không lo gặp sự cố gián đoạn API của bên thứ ba.

---

## 📐 Kiến trúc hệ thống & Luồng dữ liệu

### Sơ đồ kiến trúc tổng thể (System Architecture)

```mermaid
flowchart TD
    Client([💻 Trình duyệt / Mobile Web Client])

    subgraph Edge ["🌐 Tầng Biên & Bảo Mật (Edge Layer)"]
        CF["Cloudflare WAF<br/>• Full (strict) SSL/TLS<br/>• DDoS Guard & HSTS<br/>• CF-Connecting-IP Header"]
        NextProxy["Next.js 16 Security Proxy<br/>• Auth Guards & Session Cookie<br/>• Content-Security-Policy (CSP)<br/>• Atomic Rate Limiting"]
    end

    subgraph App ["🚀 Tầng Ứng Dụng (Next.js 16 Full-Stack)"]
        UI["React 19 Frontend<br/>• App Router & Server Components<br/>• Leaflet Interactive Map<br/>• Tailwind CSS 4 Theming"]
        API["Route Handlers (RESTful APIs)<br/>• Input Validation (Zod schemas)<br/>• Error Handling & Audit Logs"]
        
        subgraph Services ["Lõi Xử Lý Nghiệp Vụ (Core Services)"]
            AuthSvc["Better Auth Service<br/>Google OAuth + Email OTP"]
            CryptoSvc["Crypto Engine<br/>AES-256-GCM + scrypt"]
            TSPSvc["TSP Route Optimizer<br/>Haversine + 2-Opt Heuristic"]
            SplitSvc["Split & Settlement Engine<br/>Equal / Itemized / Simplification"]
            QRSvc["EMVCo VietQR Engine<br/>Offline Napas 247 + CRC-16"]
        end
    end

    subgraph Data ["🗄️ Tầng Dữ Liệu & Hạ Tầng Phía Sau (Backend Services)"]
        SupabaseDB[("Supabase PostgreSQL<br/>Transaction Pooler :6543<br/>Prisma ORM 7.10")]
        SupabaseStorage[("Supabase Private Storage<br/>Bucket: trip-receipts<br/>Magic Bytes Sniffing")]
        ResendAPI["Resend Email Service<br/>OTP Delivery"]
        OpenMeteo["Open-Meteo Weather API<br/>Real-time Meteorological Data"]
    end

    Client -->|HTTPS Traffic| CF
    CF --> NextProxy
    NextProxy --> UI
    UI --> API
    API --> AuthSvc
    API --> CryptoSvc
    API --> TSPSvc
    API --> SplitSvc
    API --> QRSvc
    
    AuthSvc --> SupabaseDB
    CryptoSvc --> SupabaseDB
    SplitSvc --> SupabaseDB
    API --> SupabaseDB
    API -->|Proxy Stream có phân quyền| SupabaseStorage
    AuthSvc -->|Gửi mã xác thực| ResendAPI
    TSPSvc -->|Dự báo thời tiết| OpenMeteo
```

---

### Luồng nghiệp vụ: Ghi nhận chi tiêu, Chốt sổ & Thanh toán VietQR

```mermaid
sequenceDiagram
    autonumber
    actor Member as Thành viên
    actor Host as Trưởng nhóm (Host)
    participant App as Giao diện Web
    participant API as Route Handlers
    participant Engine as Settlement & VietQR
    participant DB as PostgreSQL
    actor BankApp as App Ngân Hàng

    Member->>App: Nhập chi phí ăn uống + Đính kèm hóa đơn
    App->>API: POST /api/trips/[id]/expenses (Kèm ảnh hóa đơn)
    API->>API: Xác thực Magic Bytes (JPEG/PNG/WebP) & Quyền thành viên
    API->>DB: Lưu khoản chi & Phân bổ ExpenseShares
    DB-->>App: Cập nhật số dư tức thì

    Host->>App: Bấm "Chốt sổ công nợ"
    App->>API: POST /api/trips/[id]/settlement
    API->>DB: Khóa sổ (FOR UPDATE transaction)
    API->>Engine: simplifyDebts(paid, owed)
    Engine-->>API: Danh sách nợ tối thiểu (Net Balances = 0)
    API->>DB: Ghi nhận Settlement Transactions
    DB-->>App: Hiển thị bảng thanh toán nợ

    Member->>App: Bấm "Thanh toán cho Chủ nợ"
    App->>Engine: generateVietQR(STK giải mã AES-256-GCM, Amount, Content)
    Engine-->>App: Trả về mã VietQR chuẩn EMVCo Napas 247
    Member->>BankApp: Quét mã VietQR trên màn hình
    BankApp-->>BankApp: Tự động điền đầy đủ STK, Tên, Số tiền & Nội dung
    Member->>BankApp: Xác nhận chuyển khoản thành công
    Host->>App: Xác nhận đã nhận tiền -> Hoàn tất đối soát!
```

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

| Tầng kiến trúc | Công nghệ | Phiên bản | Mục đích & Vai trò |
| :--- | :--- | :--- | :--- |
| **Framework** | **Next.js** | `16.4.2` | App Router, Server Components, Turbopack, SSR/SSG tối ưu tốc độ tải trang |
| **Giao diện (UI)** | **React** | `19.3.0` | Nền tảng component tương tác hiện đại |
| **Styling** | **Tailwind CSS** | `v4` | Hệ thống styling utility-first, phong cách *Tactile Organic Minimalism* |
| **Biểu tượng** | **Lucide React** | `^1.16.0` | Bộ icon vector sắc nét, đồng bộ cho mọi thao tác |
| **Bản đồ số** | **Leaflet & OSM** | `^1.9.4` | Hiển thị bản đồ hành trình, marker điểm đến và tuyến đường polyline |
| **Cơ sở dữ liệu** | **PostgreSQL** | `Supabase` | Cơ sở dữ liệu quan hệ mạnh mẽ, ACID transaction bảo toàn tài chính |
| **Connection Pool** | **PgBouncer** | Port `6543` | Tối ưu hóa kết nối Serverless, chống cạn kiệt pool kết nối |
| **ORM** | **Prisma** | `7.10.1` | Type-safe client, quản lý schema và migrations tự động |
| **Xác thực** | **Better Auth** | `^1.7.0` | Quản lý phiên, bảo mật Google OAuth 2.0 & Email OTP |
| **Mã hóa (Crypto)**| **Node.js Crypto** | Built-in | AES-256-GCM bảo vệ STK, scrypt băm mật khẩu chuẩn OWASP |
| **Dịch vụ Email** | **Resend** | `^6.9.4` | Gửi email chứa mã OTP đăng ký tài khoản với độ tin cậy cao |
| **Thời tiết** | **Open-Meteo** | REST API | Cập nhật dự báo nhiệt độ, gió, mưa theo tọa độ GPS thời gian thực |
| **Kiểm thử** | **Vitest** | `^5.0.0` | Bộ kiểm thử tốc độ cao, Property-based testing & Mock testing |
| **Hạ tầng & Edge** | **Vercel & Cloudflare** | Enterprise | Mạng phân phối Edge, WAF, DDoS Shield, Full (strict) SSL |

---

## 🧪 Chất lượng mã nguồn & Kiểm thử (Testing)

Dự án tuân thủ tôn chỉ **"Evidence Before Assertions"** với bộ kiểm thử toàn diện được thực thi bởi **Vitest**:

```bash
$ npm test

 ✓ tests/unit/money/vietqr.test.ts (18 tests)
 ✓ tests/unit/money/split-equal.test.ts (24 tests)
 ✓ tests/unit/money/split-itemized.test.ts (32 tests)
 ✓ tests/unit/money/simplify-debts.test.ts (40 tests)
 ✓ tests/unit/geo/tsp-2opt.test.ts (26 tests)
 ✓ tests/unit/geo/haversine.test.ts (15 tests)
 ✓ tests/unit/geo/weather-open-meteo.test.ts (22 tests)
 ✓ tests/unit/crypto/aes-256-gcm.test.ts (19 tests)
 ✓ tests/integration/api/trips.test.ts (48 tests)
 ✓ tests/integration/api/expenses.test.ts (65 tests)
 ✓ tests/integration/api/settlement.test.ts (52 tests)
 ... [110 files khác]

 Test Files  121 passed (121)
      Tests  1357 passed (1357)
   Start at  14:30:12
   Duration  16.35s (transform 3.12s, setup 1.25s, collect 4.18s, tests 7.80s)
```

### Các lớp bảo vệ chất lượng chính:
- **Property-based Testing (Fuzzing):** Thực hiện sinh hơn 2.000 trường hợp chia tiền ngẫu nhiên với số lượng người và số tiền bất kỳ nhằm chứng minh toán học bất biến: $\sum \text{Shares} = \text{Amount}$ và $\sum \text{Net} = 0$.
- **Kiểm thử phân quyền RBAC:** Hơn 200 ca kiểm thử bảo đảm chỉ Trưởng nhóm (Host) mới có quyền chốt sổ hoặc xóa chuyến đi; thành viên chỉ được sửa khoản chi của chính mình.
- **Kiểm tra kiểu dữ liệu & Linting:**
  - `npx tsc --noEmit` đạt chuẩn **0 errors**.
  - `npm run lint` đạt chuẩn tuyệt đối **0 errors, 0 warnings**.

---

## 🚀 Hướng dẫn cài đặt từng bước

### Yêu cầu tiên quyết
- **Node.js:** phiên bản `20.x` hoặc `22.x` trở lên
- **npm:** phiên bản `10.x` trở lên (hoặc `pnpm` / `yarn`)
- **Tài khoản Supabase:** Đã tạo project PostgreSQL và Private Storage Bucket `trip-receipts`

### 1. Clone mã nguồn
```bash
git clone https://github.com/caothanhtungg/smart-trip.git
cd smart-trip
```

### 2. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 3. Cấu hình biến môi trường
Tạo file `.env.local` từ file mẫu `.env.example`:
```bash
cp .env.example .env.local
```

Mở `.env.local` và điền các khóa cấu hình:
```env
# 1. Cơ sở dữ liệu Supabase PostgreSQL (Transaction Pooler Port 6543)
DATABASE_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# 2. Better Auth Configuration
BETTER_AUTH_SECRET="chuoi-bi-mat-ngau-nhien-it-nhat-32-ky-tu"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# 3. Google OAuth 2.0 (Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# 4. Khóa mã hóa STK ngân hàng AES-256-GCM (Chuỗi Hex 64 ký tự = 32 bytes)
# Tạo nhanh: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
BANK_ENCRYPTION_KEY="64-ky-tu-hex-ngau-nhien-bao-mat-tuyet-doi"

# 5. Supabase Storage (Lưu trữ hóa đơn riêng tư)
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_STORAGE_BUCKET="trip-receipts"

# 6. Gửi Email OTP (Resend API)
RESEND_API_KEY="re_your_resend_api_key"
```

### 4. Đồng bộ hóa Schema với Database
```bash
# Sinh mã Prisma Client tương thích
npx prisma generate

# Đồng bộ mô hình dữ liệu lên PostgreSQL
npx prisma db push
```

### 5. Khởi động môi trường phát triển
```bash
npm run dev
```

Mở trình duyệt và truy cập [http://localhost:3000](http://localhost:3000) để trải nghiệm ứng dụng.

---

## 📚 Tài liệu kỹ thuật & API Catalog

<details>
<summary><b>📖 Xem danh mục 31 API Route Handlers (Bấm để mở)</b></summary>
<br />

| Phương thức | Đường dẫn API | Mục đích nghiệp vụ | Quyền truy cập |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/sign-in/email` | Đăng nhập bằng email & mật khẩu | Công khai |
| `POST` | `/api/auth/sign-up/email` | Đăng ký tài khoản mới & gửi OTP | Công khai |
| `POST` | `/api/auth/verify-otp` | Xác thực mã OTP hoàn tất đăng ký | Công khai |
| `GET` | `/api/auth/session` | Lấy phiên đăng nhập hiện tại | Yêu cầu Auth |
| `GET` | `/api/trips` | Lấy danh sách chuyến đi của người dùng | Yêu cầu Auth |
| `POST` | `/api/trips` | Tạo chuyến đi mới | Yêu cầu Auth |
| `GET` | `/api/trips/[id]` | Chi tiết chuyến đi, danh sách thành viên | Thành viên |
| `PATCH` | `/api/trips/[id]` | Cập nhật thông tin chuyến đi | Trưởng nhóm (Host) |
| `DELETE` | `/api/trips/[id]` | Xóa chuyến đi | Trưởng nhóm (Host) |
| `POST` | `/api/trips/[id]/members` | Thêm thành viên vào chuyến đi | Trưởng nhóm (Host) |
| `DELETE` | `/api/trips/[id]/members/[memberId]` | Xóa hoặc mời thành viên rời nhóm | Trưởng nhóm (Host) |
| `GET` | `/api/trips/[id]/expenses` | Lấy toàn bộ danh sách khoản chi | Thành viên |
| `POST` | `/api/trips/[id]/expenses` | Thêm khoản chi mới (Equal/Itemized) | Thành viên |
| `PATCH` | `/api/trips/[id]/expenses/[expenseId]` | Chỉnh sửa khoản chi | Người tạo / Host |
| `DELETE` | `/api/trips/[id]/expenses/[expenseId]` | Xóa khoản chi | Người tạo / Host |
| `POST` | `/api/trips/[id]/settlement` | Chốt sổ công nợ & Tính ma trận nợ | Trưởng nhóm (Host) |
| `POST` | `/api/trips/[id]/settlement/reopen` | Mở lại sổ công nợ để điều chỉnh | Trưởng nhóm (Host) |
| `POST` | `/api/trips/[id]/settlement/[settlementId]/mark-paid` | Đánh dấu thành viên đã chuyển tiền | Thành viên liên quan |
| `POST` | `/api/trips/[id]/settlement/[settlementId]/confirm` | Trưởng nhóm duyệt đã nhận thanh toán | Trưởng nhóm (Host) |
| `POST` | `/api/trips/[id]/receipts/upload` | Upload ảnh chụp hóa đơn (Private) | Thành viên |
| `GET` | `/api/trips/[id]/receipts/[fileId]` | Tải và xem ảnh hóa đơn qua Proxy | Thành viên |
| `POST` | `/api/trips/[id]/itinerary/optimize` | Chạy thuật toán tối ưu TSP 2-Opt | Thành viên |
| `GET` | `/api/weather` | Truy vấn dự báo Open-Meteo theo GPS | Yêu cầu Auth |
| `GET` | `/api/guides` | Lấy danh mục 26 cẩm nang danh thắng | Công khai |
| `GET` | `/api/guides/[slug]` | Lấy chi tiết lịch trình mẫu & dự toán | Công khai |
| `GET` | `/api/user/profile` | Lấy thông tin cá nhân & STK ngân hàng | Yêu cầu Auth |
| `PATCH` | `/api/user/profile` | Cập nhật hồ sơ & STK (Mã hóa AES-256) | Yêu cầu Auth |

</details>

<details>
<summary><b>📁 Cấu trúc thư mục dự án chuẩn hóa (Bấm để mở)</b></summary>
<br />

```text
smart-trip/
├── .github/workflows/          # CI/CD tự động kiểm thử và kiểm tra chất lượng
├── docs/                       # Tài liệu tiêu chuẩn kỹ thuật & Runbooks
│   ├── assets/                 # Vector banner và ảnh giao diện minh họa README
│   └── ENGINEERING_STANDARDS.md# Quy chuẩn kiến trúc & quy ước lập trình
├── prisma/
│   └── schema.prisma           # Đặc tả mô hình dữ liệu quan hệ PostgreSQL
├── public/                     # Tài nguyên tĩnh (icons, fonts, video hero)
├── sodothietke/                # Sơ đồ thiết kế Use Case, ERD, Sequence diagrams
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (app)/              # Nhóm trang chức năng yêu cầu đăng nhập
│   │   │   ├── trips/          # Quản lý chuyến đi, lịch trình, chi tiêu, nợ
│   │   │   ├── guides/         # Khám phá 26 danh thắng & cẩm nang chi tiết
│   │   │   └── profile/        # Quản lý hồ sơ cá nhân & STK ngân hàng
│   │   ├── (public)/           # Nhóm trang công khai (Landing page, Login)
│   │   └── api/                # Hơn 30 Route Handlers chuẩn RESTful
│   ├── components/             # Thư viện UI Components tái sử dụng
│   │   ├── itinerary/          # Bản đồ Leaflet, Route Optimizer, Thời tiết
│   │   ├── trips/              # Thẻ chuyến đi, Danh sách chi phí, VietQR Modal
│   │   ├── guides/             # Modal lịch trình mẫu 3N2Đ & dự toán
│   │   ├── landing/            # Bento grid, Hero video banner, Showcase
│   │   └── ui/                 # Atomic UI primitives (Dialog, Button, Toast...)
│   ├── lib/                    # Thư viện xử lý nghiệp vụ & lõi thuật toán
│   │   ├── api/                # Trích xuất IP, Rate limiter, Error handler
│   │   ├── auth/               # Better Auth instance, Session & OTP store
│   │   ├── crypto/             # AES-256-GCM Encrypt/Decrypt, scrypt hasher
│   │   ├── db/                 # Prisma Client singleton
│   │   ├── geo/                # Haversine, TSP 2-Opt heuristic, Open-Meteo
│   │   ├── money/              # VietQR EMVCo generator, Equal/Itemized split
│   │   └── storage/            # Supabase Private Storage & Magic bytes check
│   └── proxy.ts                # Route Guard & Bảo vệ chuyển hướng an toàn
├── tests/                      # Bộ kiểm thử 121 suites (1,357 tests) Vitest
├── .gitattributes              # Chuẩn hóa kết thúc dòng LF đa nền tảng
├── .gitignore                  # Danh mục loại trừ nhị phân & file nhạy cảm
├── next.config.ts              # Cấu hình Next.js & Content Security Policy (CSP)
└── package.json                # Định nghĩa dependencies và scripts thực thi
```

</details>

---

## 🛡️ Cam kết bảo mật & An toàn dữ liệu

- **Không chia sẻ thông tin tài chính:** Số tài khoản ngân hàng và tên chủ tài khoản được mã hóa ngay khi tiếp nhận bằng thuật toán **AES-256-GCM** với khóa đối xứng lưu trữ ở biến môi trường server.
- **Hóa đơn du lịch riêng tư:** File tải lên được xác thực qua chữ ký nhị phân (Magic Bytes), chỉ phục vụ cho đúng các thành viên trong chuyến đi đó thông qua luồng Server Proxy có kiểm tra quyền.
- **Phòng chống tấn công:**
  - Cloudflare WAF ngăn chặn tấn công DDoS, Botnet và quét cổng.
  - Rate Limiter nguyên tử chống brute-force đăng nhập và spam gửi mã OTP.
  - Content Security Policy (CSP) nghiêm ngặt ngăn chặn tấn công Cross-Site Scripting (XSS).

---

## 📜 Giấy phép (License)

Dự án được phân phối dưới giấy phép **MIT License**. Mọi cá nhân, tổ chức đều có quyền tham khảo, sử dụng và phát triển mã nguồn cho mục đích học tập và nghiên cứu. Chi tiết xem tại [LICENSE](LICENSE).

---

<div align="center">

**Smart Trip & Expense Planner** • Thiết kế & Phát triển với niềm đam mê du lịch và kỹ nghệ phần mềm

Tác giả: **Cao Thanh Tùng** • 2026

[![GitHub Stars](https://img.shields.io/github/stars/caothanhtungg/smart-trip?style=social)](https://github.com/caothanhtungg/smart-trip)
[![Live Application](https://img.shields.io/badge/Visit-tungcloud.online-2563EB?style=for-the-badge&logo=googlechrome&logoColor=white)](https://tungcloud.online)

</div>
