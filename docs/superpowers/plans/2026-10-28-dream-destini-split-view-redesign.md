# Kế hoạch Triển khai: Tái cấu trúc Giao diện Split-View & Sidebar theo Mẫu Dream Destini

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) hoặc superpowers:executing-plans để triển khai kế hoạch này theo từng task. Các bước sử dụng cú pháp checkbox (`- [ ]`) để theo dõi tiến độ.

**Goal:** Chuyển đổi toàn bộ khung ứng dụng sang cấu trúc Left Sidebar navigation hiện đại và trang chính đăng nhập dạng Split-View (Bản đồ tương tác lớn chọn điểm đến bên phải, Thông tin thời tiết & Danh sách thẻ ngang có ảnh bên trái, Lịch trình tích hợp thư viện ảnh thực tế).

**Architecture:** Sử dụng Next.js App Router kết hợp Tailwind CSS 4 và Leaflet Map; tách biệt mô-đun hóa: dịch vụ ảnh địa danh (`destination-photos.ts`), khung Sidebar (`AppSidebar.tsx`), thanh công cụ Topbar (`AppTopBar.tsx`), bản đồ khám phá Split-View (`DiscoverySplitView.tsx` + `DiscoveryMap.tsx`), thẻ lịch trình ngang có ảnh (`TripItineraryCard.tsx`), và modal thư viện ảnh (`DestinationGalleryModal.tsx`).

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript 5, Tailwind CSS 4, Lucide React, Leaflet, Open-Meteo API, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-28-dream-destini-split-view-redesign-spec.md`

## Global Constraints

- Gam màu chủ đạo: Nền Canvas `#F8F9FA` / `#F4F9EC`, Thẻ trắng `#FFFFFF`, Điểm nhấn cam gạch nung `#E05833` / `#E76F51`, Xanh chủ đạo `#184E77` & `#1A759F`.
- Typography: Be Vietnam Pro, số liệu tài chính `tabular-nums`.
- Leaflet Map: Đảm bảo sử dụng `next/dynamic` với `{ ssr: false }` và fallback loading để chống lỗi SSR trong Next.js.
- Không phá vỡ 1.219 bài kiểm thử hiện có của toàn bộ nghiệp vụ (Auth, Thành viên, Chi tiêu, VietQR, Tối ưu lộ trình TSP).
- Tuyệt đối không sử dụng thư viện trả phí hay yêu cầu API key thẻ tín dụng (sử dụng Open-Meteo, OpenStreetMap, Unsplash curated photo references).

## Review Focus

1. **Hiển thị Leaflet trên SSR:** Đảm bảo `DiscoveryMap` không truy cập biến toàn cục `window`/`document` trên Server Side Rendering.
2. **Ảnh địa danh thiếu/lỗi:** Xử lý fallback gracefully khi địa danh chưa có ảnh hoặc link ảnh bị lỗi mạng.
3. **Responsive trên Mobile:** Thanh bên Sidebar có khả năng đóng/mở dạng Drawer trượt và Split-View chuyển sang dạng Tab (Danh sách / Bản đồ) trên màn hình nhỏ.
4. **Hiệu năng Render Bản đồ:** Debounce các sự kiện di chuyển bản đồ và không re-render danh sách chuyến đi không cần thiết.
5. **Bảo toàn dữ liệu nghiệp vụ:** Các luồng Tạo chuyến đi từ pin bản đồ truyền chính xác tên địa điểm và tọa độ vào form tạo chuyến đi.

---

### Task 1: Dịch vụ Thư viện Ảnh Địa danh Du lịch (`destination-photos.ts`)

**Files:**
- Create: `src/lib/geo/destination-photos.ts`
- Test: `src/lib/geo/destination-photos.test.ts`

**Interfaces:**
- Produces: `getDestinationPhoto(placeName: string, address?: string): { url: string; caption: string; photographer: string; tags: string[] }`
- Produces: `getDestinationGallery(placeName: string): Array<{ url: string; title: string; description: string }>`

- [ ] **Step 1: Viết test thất bại cho `destination-photos.test.ts`**
  Kiểm tra khớp ảnh chính xác cho các danh lam thắng cảnh Việt Nam: Đà Nẵng, Bà Nà Hills, Hội An, Vịnh Hạ Long, Sapa, Phú Quốc, Đà Lạt, Hà Nội, Hồ Chí Minh và kiểm tra ảnh fallback du lịch mặc định khi không tìm thấy.

- [ ] **Step 2: Chạy test để xác nhận test thất bại**
  Lệnh: `npx vitest run src/lib/geo/destination-photos.test.ts`
  Kỳ vọng: FAIL do file chưa tồn tại.

- [ ] **Step 3: Triển khai `src/lib/geo/destination-photos.ts`**
  Xây dựng từ điển danh lam thắng cảnh Việt Nam với ảnh chất lượng cao từ kho ảnh tự do Unsplash và thuật toán chuẩn hóa tiếng Việt không dấu để matching chính xác.

- [ ] **Step 4: Chạy lại test để xác nhận test thành công**
  Lệnh: `npx vitest run src/lib/geo/destination-photos.test.ts`
  Kỳ vọng: PASS 100%.

- [ ] **Step 5: Commit mã nguồn**
  ```bash
  git add src/lib/geo/destination-photos.ts src/lib/geo/destination-photos.test.ts
  git commit -m "feat(geo): add curated destination photo and gallery resolution service"
  ```

---

### Task 2: Thanh Bên Điều Hướng Hiện Đại (`AppSidebar.tsx`) & Khung App Shell

**Files:**
- Create: `src/components/layout/AppSidebar.tsx`
- Create: `src/components/layout/AppSidebar.test.tsx`
- Modify: `src/app/(app)/layout.tsx`

**Interfaces:**
- Produces: `<AppSidebar isMobileOpen={boolean} onCloseMobile={() => void} />`
- Consumes: `useUserProfile()`, `usePathname()`, `Better Auth signOut`

- [ ] **Step 1: Viết test cho `AppSidebar.test.tsx`**
  Kiểm tra render đầy đủ logo Smart Trip, các mục điều hướng (Khám phá, Chuyến đi, Cẩm nang), thẻ tính năng thời tiết/du lịch ở chân sidebar, và khối profile người dùng.

- [ ] **Step 2: Chạy test để xác nhận test thất bại**
  Lệnh: `npx vitest run src/components/layout/AppSidebar.test.tsx`
  Kỳ vọng: FAIL do component chưa được định nghĩa.

- [ ] **Step 3: Triển khai `AppSidebar.tsx` và cập nhật `src/app/(app)/layout.tsx`**
  - Xây dựng sidebar cố định bên trái trên desktop (`w-64 sm:w-72`), viền hairline thanh mảnh, danh mục menu pill tròn với active indicator cam gạch/xanh Yale.
  - Card tính năng ở chân sidebar: Thẻ "Thời tiết & Cẩm nang du lịch" với hình nền sang trọng và nút khám phá.
  - Khối hồ sơ cá nhân: Avatar, tên, email và nút mở menu tài khoản/đăng xuất.
  - Cập nhật `src/app/(app)/layout.tsx` để bố trí Sidebar bên trái và khu vực nội dung chính chiếm không gian còn lại.

- [ ] **Step 4: Chạy lại test xác nhận thành công**
  Lệnh: `npx vitest run src/components/layout/AppSidebar.test.tsx`
  Kỳ vọng: PASS 100%.

- [ ] **Step 5: Commit mã nguồn**
  ```bash
  git add src/components/layout/AppSidebar.tsx src/components/layout/AppSidebar.test.tsx src/app/\(app\)/layout.tsx
  git commit -m "feat(layout): implement modern left sidebar navigation and layout shell"
  ```

---

### Task 3: Thanh Tiêu Đề & Công Cụ Tìm Kiếm (`AppTopBar.tsx`)

**Files:**
- Create: `src/components/layout/AppTopBar.tsx`
- Create: `src/components/layout/AppTopBar.test.tsx`

**Interfaces:**
- Produces: `<AppTopBar title={string} onOpenMobileSidebar={() => void} onCreateTrip={() => void} />`

- [ ] **Step 1: Viết test cho `AppTopBar.test.tsx`**
  Kiểm tra render tiêu đề trang, ô tìm kiếm nhanh với badge phím tắt `⌘K`, các nút lọc dropdown (Trạng thái, Khu vực), và nút chính "+ Tạo chuyến đi".

- [ ] **Step 2: Chạy test để xác nhận test thất bại**
  Lệnh: `npx vitest run src/components/layout/AppTopBar.test.tsx`
  Kỳ vọng: FAIL do component chưa có.

- [ ] **Step 3: Triển khai `AppTopBar.tsx`**
  Thiết kế theo chuẩn Dream Destini: thanh tìm kiếm bo tròn nhẹ với icon kính lúp, badge `⌘K`, nút dropdown lọc nhẹ nhàng, và nút CTA "+ Tạo chuyến đi" màu cam đất ấm áp (`#E05833`).

- [ ] **Step 4: Chạy lại test xác nhận thành công**
  Lệnh: `npx vitest run src/components/layout/AppTopBar.test.tsx`
  Kỳ vọng: PASS 100%.

- [ ] **Step 5: Commit mã nguồn**
  ```bash
  git add src/components/layout/AppTopBar.tsx src/components/layout/AppTopBar.test.tsx
  git commit -m "feat(layout): create top header bar with search and quick actions"
  ```

---

### Task 4: Modal Bộ Sưu Tập Ảnh Địa Điểm Lịch Trình (`DestinationGalleryModal.tsx`)

**Files:**
- Create: `src/components/itinerary/DestinationGalleryModal.tsx`
- Create: `src/components/itinerary/DestinationGalleryModal.test.tsx`

**Interfaces:**
- Produces: `<DestinationGalleryModal isOpen={boolean} onClose={() => void} placeName={string} address?: string />`

- [ ] **Step 1: Viết test cho `DestinationGalleryModal.test.tsx`**
  Kiểm tra mở modal khi `isOpen=true`, hiển thị ảnh lớn, tiêu đề danh lam thắng cảnh, mô tả tóm tắt và nút đóng modal.

- [ ] **Step 2: Chạy test để xác nhận thất bại**
  Lệnh: `npx vitest run src/components/itinerary/DestinationGalleryModal.test.tsx`
  Kỳ vọng: FAIL.

- [ ] **Step 3: Triển khai `DestinationGalleryModal.tsx`**
  Tạo modal hiện đại: hiển thị ảnh lớn độ phân giải cao của địa danh, danh sách ảnh thu nhỏ có thể click chuyển đổi, thông tin thời tiết dự báo tại địa điểm đó và mẹo tham quan.

- [ ] **Step 4: Chạy test xác nhận thành công**
  Lệnh: `npx vitest run src/components/itinerary/DestinationGalleryModal.test.tsx`
  Kỳ vọng: PASS 100%.

- [ ] **Step 5: Commit mã nguồn**
  ```bash
  git add src/components/itinerary/DestinationGalleryModal.tsx src/components/itinerary/DestinationGalleryModal.test.tsx
  git commit -m "feat(itinerary): add destination photo gallery preview modal"
  ```

---

### Task 5: Nâng Cấp Thẻ Lịch Trình Ngang Có Ảnh Thumbnail (`TripItineraryCard.tsx`)

**Files:**
- Modify: `src/components/trips/itinerary/trip-itinerary-card.tsx`
- Modify/Create: `src/components/trips/itinerary/trip-itinerary-card.test.tsx`

**Interfaces:**
- Consumes: `getDestinationPhoto`, `DestinationGalleryModal`

- [ ] **Step 1: Viết test cập nhật cho `trip-itinerary-card.test.tsx`**
  Xác thực thẻ hiển thị ảnh thumbnail bên trái, có nút zoom xem ảnh và khi click mở modal xem ảnh chi tiết.

- [ ] **Step 2: Chạy test xác nhận thất bại với logic mới**
  Lệnh: `npx vitest run src/components/trips/itinerary/trip-itinerary-card.test.tsx`

- [ ] **Step 3: Tái thiết kế `trip-itinerary-card.tsx`**
  Chuyển đổi sang thẻ ngang hiện đại (Horizontal Card):
  - Khung ảnh thumbnail 96x72px bo góc `rounded-xl` bên trái với nút kính lúp xem nhanh.
  - Phía bên phải: Tên địa điểm, giờ đến, tag thời tiết thực tế, khoảng cách và các nút menu thao tác.
  - Tích hợp `DestinationGalleryModal` khi người dùng nhấn vào ảnh hoặc tên địa điểm.

- [ ] **Step 4: Chạy lại test xác nhận thành công**
  Lệnh: `npx vitest run src/components/trips/itinerary/trip-itinerary-card.test.tsx`
  Kỳ vọng: PASS 100%.

- [ ] **Step 5: Commit mã nguồn**
  ```bash
  git add src/components/trips/itinerary/trip-itinerary-card.tsx src/components/trips/itinerary/trip-itinerary-card.test.tsx
  git commit -m "feat(itinerary): redesign itinerary card into horizontal card with destination photo"
  ```

---

### Task 6: Trang Khám Phá & Bản Đồ Tương Tác Chia Đôi (`DiscoverySplitView.tsx` & `trips/page.tsx`)

**Files:**
- Create: `src/components/trips/discovery/DiscoveryMap.tsx`
- Create: `src/components/trips/discovery/DiscoverySplitView.tsx`
- Create: `src/components/trips/discovery/DiscoverySplitView.test.tsx`
- Modify: `src/app/(app)/trips/page.tsx`

**Interfaces:**
- Produces: `<DiscoverySplitView trips={TripCardView[]} />`
- Consumes: Leaflet Map, Open-Meteo Weather, `destination-photos.ts`

- [ ] **Step 1: Viết test cho `DiscoverySplitView.test.tsx`**
  Kiểm tra render bố cục chia đôi màn hình (Split-View): Cột bên trái hiển thị Widget thời tiết vị trí hiện tại, danh sách chuyến đi/điểm đến; Cột bên phải hiển thị bản đồ khám phá tương tác.

- [ ] **Step 2: Chạy test xác nhận thất bại**
  Lệnh: `npx vitest run src/components/trips/discovery/DiscoverySplitView.test.tsx`
  Kỳ vọng: FAIL.

- [ ] **Step 3: Triển khai `DiscoveryMap.tsx`, `DiscoverySplitView.tsx` và tích hợp vào `trips/page.tsx`**
  - `DiscoveryMap.tsx`: Bản đồ Leaflet với các Glowing Pill Badges thể hiện các danh lam thắng cảnh Việt Nam. Khi click vào marker, popup mở ảnh đẹp kèm nút "Tạo chuyến đi đến đây".
  - `DiscoverySplitView.tsx`: Cột trái hiển thị Widget thời tiết vị trí thực tế người dùng + Tin tức/Cẩm nang du lịch + Danh sách chuyến đi dạng thẻ ngang có ảnh thumbnail.
  - Tích hợp đầy đủ vào `src/app/(app)/trips/page.tsx`.

- [ ] **Step 4: Chạy lại test xác nhận thành công**
  Lệnh: `npx vitest run src/components/trips/discovery/DiscoverySplitView.test.tsx`
  Kỳ vọng: PASS 100%.

- [ ] **Step 5: Commit mã nguồn**
  ```bash
  git add src/components/trips/discovery/ src/app/\(app\)/trips/page.tsx
  git commit -m "feat(discovery): implement split-view interactive discovery map and horizontal destination cards"
  ```

---

### Task 7: Kiểm Thử Toàn Diện Hệ Thống & Đóng Gói (Full System Verification)

**Files:**
- Toàn bộ codebase.

- [ ] **Step 1: Chạy toàn bộ test suite dự án**
  Lệnh: `npm test`
  Kỳ vọng: Vượt qua toàn bộ 95+ test suites với hơn 1.230 bài kiểm thử đạt 100%.

- [ ] **Step 2: Chạy kiểm tra kiểu tĩnh TypeScript**
  Lệnh: `npx tsc --noEmit`
  Kỳ vọng: Không có lỗi kiểu.

- [ ] **Step 3: Chạy Next.js Production Build**
  Lệnh: `npm run build`
  Kỳ vọng: Build thành công sạch sẽ (Exit code 0).

- [ ] **Step 4: Commit và tổng kết**
  ```bash
  git commit --allow-empty -m "chore(release): verify and finalize Dream Destini split-view UI redesign"
  ```
