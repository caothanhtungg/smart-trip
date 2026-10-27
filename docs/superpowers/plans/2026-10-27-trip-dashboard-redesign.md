# Tái cấu trúc Giao diện Bento & Tối ưu Trải nghiệm (UI/UX Redesign) Cho 5 Phân hệ Chuyến đi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tái cấu trúc toàn diện giao diện của 5 phân hệ chuyến đi (Tổng quan, Lịch trình, Chi tiêu, Công nợ, Thành viên) theo phong cách Bento Grid hiện đại, thoáng đãng, phân cấp thông tin theo nguyên lý Progressive Disclosure để người dùng không bị rối mắt.

**Architecture:** Sử dụng kiến trúc Bento Card với bo góc lớn (`rounded-2xl` - `rounded-3xl`), viền mảnh thanh lịch, đổ bóng mềm tự nhiên, kết hợp bố cục 2 cột và sticky elements. Tách thông tin thành tầng hiển thị chính (Key metrics, bản đồ, timeline) và tầng thứ cấp (chi tiết phân chia, metadata nhỏ gọn, modal/drawer).

**Tech Stack:** Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, Lucide React, Leaflet, Open-Meteo, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-trip-dashboard-redesign-spec.md`

## Global Constraints
- Bảng màu Tactile Organic Minimalism: `#184E77`, `#1E6091`, `#1A759F`, `#52B69A`, `#D9ED92`, `#F4F9EC`.
- Không sử dụng emoji làm icon tính năng (chỉ dùng Lucide React).
- Bảo toàn 100% logic nghiệp vụ và các tính năng đã hoạt động (bản đồ, thời tiết, TSP, VietQR, chia tiền).
- Đảm bảo responsive hoàn hảo trên Mobile (stack 1 cột) và Desktop (Bento Grid / 2 cột).
- Mọi bài kiểm thử hiện có phải tiếp tục passed 100% (94 test files, 1.219 tests).

## Review Focus
1. Độ thông thoáng và khoảng thở (whitespace): Không nhồi nhét quá nhiều thẻ kích thước lớn chồng chất.
2. Progressive disclosure: Thông tin quan trọng nổi bật trong 3 giây, thông tin phụ thu nhỏ cỡ chữ hoặc chuyển vào drawer/popover.
3. Bản đồ hiển thị liền mạch, không bị che khuất hoặc lỗi xám tile (`invalidateSize`).
4. Thanh toán VietQR và trạng thái công nợ của riêng người dùng hiển thị nổi bật hàng đầu.
5. Hiệu năng render và kiểm thử hồi quy không có lỗi.

---

### Task 1: Tái cấu trúc Phân hệ Tổng quan (`/trips/[id]`) theo Bento Grid

**Files:**
- Modify: `src/components/trips/detail/trip-budget-card.tsx`
- Modify: `src/components/trips/detail/trip-stats-overview.tsx`
- Modify: `src/components/trips/detail/trip-live-map-widget.tsx`
- Modify: `src/app/(app)/trips/[id]/page.tsx`
- Test: `src/components/trips/detail/trip-detail-integration.test.ts`

- [ ] **Step 1:** Thiết kế lại hàng Bento Top Metrics (Ngân sách, Chi tiêu của bạn, Thành viên avatar stack, Thời tiết điểm đến).
- [ ] **Step 2:** Tối ưu khung bản đồ nhóm `TripLiveMapWidget` thành thẻ Bento trung tâm bo góc lớn với floating action bar.
- [ ] **Step 3:** Thu gọn danh sách chi tiêu và lịch trình gần nhất thành các hàng tóm tắt thanh lịch, kèm link điều hướng sang tab tương ứng.
- [ ] **Step 4:** Kiểm thử `trip-detail-integration.test.ts` và đảm bảo toàn bộ tests passed.
- [ ] **Step 5:** Commit thay đổi với thông điệp: `feat(ui-ux): redesign trip overview with bento grid and progressive disclosure`.

---

### Task 2: Tái cấu trúc Phân hệ Lịch trình (`/trips/[id]/itinerary`)

**Files:**
- Modify: `src/components/trips/itinerary/trip-itinerary-tab.tsx`
- Modify: `src/components/trips/itinerary/trip-itinerary-card.tsx`
- Modify: `src/components/itinerary/RouteOptimizationBar.tsx`
- Modify: `src/components/trips/itinerary/trip-itinerary-summary-card.tsx`
- Test: `src/components/trips/itinerary/trip-itinerary-integration.test.ts`

- [ ] **Step 1:** Thiết kế lại thanh điều hướng ngày thành cụm pill trượt ngang nhỏ gọn.
- [ ] **Step 2:** Tích hợp nút Tối ưu hóa lộ trình (TSP) trực tiếp vào thanh công cụ timeline thay vì banner lớn chiếm diện tích.
- [ ] **Step 3:** Tinh giản thẻ địa điểm `TripItineraryCard` (thời gian, badge thời tiết mini, tên địa điểm rõ ràng, thông tin phụ cỡ chữ nhỏ).
- [ ] **Step 4:** Chuyển bản đồ lộ trình sang dạng Sticky Map đồng hành bên cạnh timeline trên Desktop.
- [ ] **Step 5:** Kiểm thử `trip-itinerary-integration.test.ts` và đảm bảo toàn bộ tests passed.
- [ ] **Step 6:** Commit thay đổi với thông điệp: `feat(ui-ux): redesign itinerary timeline and sticky route map`.

---

### Task 3: Tái cấu trúc Phân hệ Chi tiêu (`/trips/[id]/expenses`)

**Files:**
- Modify: `src/components/trips/expenses/trip-expenses-tab.tsx`
- Modify: `src/components/trips/expenses/trip-expense-card.tsx`
- Modify: `src/components/trips/expenses/trip-expense-summary-bar.tsx`
- Test: `src/lib/services/expenses-api.test.ts`

- [ ] **Step 1:** Tinh giản thanh tổng quan chi tiêu trên cùng thành 3 chỉ số ngắn gọn, sắc nét.
- [ ] **Step 2:** Thiết kế lại bộ lọc phân loại theo dạng chip bấm hiện đại.
- [ ] **Step 3:** Thiết kế danh sách giao dịch dạng Transaction Feed thanh lịch (icon bo tròn, tên khoản chi, avatar người trả, số tiền nổi bật).
- [ ] **Step 4:** Thu gọn danh sách người tham gia chia tiền thành avatar stack, mở chi tiết qua modal/drawer.
- [ ] **Step 5:** Kiểm thử và commit với thông điệp: `feat(ui-ux): redesign expense transaction feed and category chips`.

---

### Task 4: Tái cấu trúc Phân hệ Công nợ (`/trips/[id]/settlement`)

**Files:**
- Modify: `src/components/trips/settlement/trip-settlement-tab.tsx`
- Modify: `src/components/trips/settlement/trip-transfer-card.tsx`
- Test: `src/app/api/trips/[id]/settlement/route.test.ts`

- [ ] **Step 1:** Bổ sung banner hành động cá nhân ưu tiên hàng đầu: "Bạn cần thanh toán bao nhiêu" hoặc "Bạn được nhận lại bao nhiêu".
- [ ] **Step 2:** Tối ưu nút mở VietQR nổi bật, giúp người dùng chuyển khoản ngay trong 1 chạm.
- [ ] **Step 3:** Thu gọn bảng đối soát nợ cả nhóm thành các hàng chuyển tiền trực quan `A → B` với trạng thái rõ ràng.
- [ ] **Step 4:** Kiểm thử và commit với thông điệp: `feat(ui-ux): redesign settlement tab with personal action first`.

---

### Task 5: Tái cấu trúc Phân hệ Thành viên (`/trips/[id]/members`)

**Files:**
- Modify: `src/components/trips/members/trip-members-tab.tsx`
- Modify: `src/components/trips/members/trip-member-card.tsx`
- Test: `src/components/trips/members/trip-members-integration.test.ts`

- [ ] **Step 1:** Thiết kế lại banner mời thành viên (mã mời, copy link, mã QR) nhỏ gọn, hiện đại.
- [ ] **Step 2:** Chuyển danh sách thành viên sang dạng thẻ Grid danh bạ thoáng đãng hoặc hàng ngang bo tròn 2xl.
- [ ] **Step 3:** Đưa thông tin tài khoản ngân hàng thành chip bấm copy nhanh kèm toast thông báo.
- [ ] **Step 4:** Kiểm thử `trip-members-integration.test.ts` và đảm bảo toàn bộ tests passed.
- [ ] **Step 5:** Commit thay đổi với thông điệp: `feat(ui-ux): redesign member directory with quick-copy bank chips`.

---

### Task 6: Kiểm thử Hồi quy Toàn diện & Biên dịch Production

- [ ] **Step 1:** Chạy toàn bộ test suite (`npm test`). Đảm bảo 100% tests passed.
- [ ] **Step 2:** Chạy `npm run build` để kiểm tra biên dịch Next.js và TypeScript.
- [ ] **Step 3:** Kiểm tra giao diện thực tế và hoàn tất.
