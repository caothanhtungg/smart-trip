# Tái cấu trúc Giao diện Bento Grid & Tối ưu Trải nghiệm người dùng Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tái cấu trúc và nâng cấp toàn diện các trang Tổng quan, Lịch trình, Chi tiêu, Công nợ, Thành viên theo phong cách Bento Grid hiện đại, tối ưu độ thoáng mắt (whitespace), thu gọn chi tiết phụ theo nguyên tắc Progressive Disclosure, lấy cảm hứng từ các mẫu thiết kế du lịch cao cấp.

**Architecture:** Sử dụng Next.js 16 + React 19 + Tailwind CSS + Lucide Icons. Phân rã các widget cồng kềnh thành các thẻ Bento gọn gàng; đưa các số liệu tài chính lên hàng đầu (Top Bento KPI Strip); chuyển danh sách thành viên sang Avatar Stack thu gọn; tinh giản thẻ lịch trình và chi tiêu với dropdown actions và thẻ chip nhỏ.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Lucide React, Leaflet, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-trip-dashboard-bento-redesign.md`

## Global Constraints
- Bảng màu: Tuân thủ nghiêm ngặt Tactile Organic Minimalism (`#184E77`, `#52B69A`, `#D9ED92`, `#F4F9EC`).
- Không sử dụng emoji cho biểu tượng tính năng (chỉ dùng Lucide React).
- Diện tích chạm (touch target) tối thiểu 44×44px cho mobile.
- Toàn bộ 94+ test files và `npm run build` phải tiếp tục vượt qua 100%.

## Review Focus
- Màn hình mobile (dưới 768px) và desktop (trên 1024px) co giãn linh hoạt, không bị vỡ giao diện.
- Không làm mất hoặc gián đoạn các tương tác hiện tại (thêm khoản chi, sửa lịch trình, quét QR chuyển khoản).
- Bản đồ tương tác Leaflet và các tiện ích cứu hộ giữ nguyên tính năng và kích thước chuẩn xác.
- Tốc độ tải trang nhanh, không phát sinh lỗi hydrat hóa hoặc rerender thừa.

---

### Task 1: Thiết kế lại Top Bento KPI Cards & Header tổng quan
Tạo hàng thẻ Bento tinh gọn 4 cột cho các chỉ số tài chính (Tổng ngân sách & thanh đo tiến độ, Tổng chi tiêu, Bạn đã chi, Số dư ròng) với phong cách số to, nhãn phụ nhỏ gọn, khoảng thở rộng rãi.

**Files:**
- Modify: `src/components/trips/detail/trip-stats-overview.tsx`
- Modify: `src/components/trips/detail/trip-budget-card.tsx`
- Test: `src/components/trips/detail/trip-detail-integration.test.ts`

- [ ] **Step 1:** Cập nhật `TripStatsOverview` thành layout Bento 3 thẻ hoặc tích hợp với ngân sách thành 4 thẻ tinh gọn.
- [ ] **Step 2:** Thêm hiệu ứng hover mềm mại, typography to đậm cho các số tiền chính (`text-2xl font-bold tracking-tight text-yale-blue`).
- [ ] **Step 3:** Chạy `npx vitest run src/components/trips/detail/trip-detail-integration.test.ts` để kiểm tra tính toàn vẹn.
- [ ] **Step 4:** Commit thay đổi: `git commit -m "feat(ui): redesign bento kpi stat cards"`.

---

### Task 2: Avatar Stack thu gọn & Tối ưu bố cục trang Tổng quan
Thay thế khối danh sách thành viên kéo dài bằng Avatar Stack hiện đại (`+N thành viên`), đưa Bản đồ tương tác và Lộ trình hôm nay vào vị trí trung tâm của trang Tổng quan.

**Files:**
- Modify: `src/components/trips/detail/trip-members-card.tsx`
- Modify: `src/components/trips/detail/trip-info-sidebar.tsx`
- Modify: `src/components/trips/detail/trip-recent-expenses.tsx`
- Modify: `src/app/(app)/trips/[id]/page.tsx`
- Test: `src/components/trips/detail/trip-detail-integration.test.ts`

- [ ] **Step 1:** Cập nhật `TripMembersCard` hỗ trợ hiển thị dạng Avatar Stack tinh gọn với popup hoặc modal xem toàn bộ danh sách khi cần.
- [ ] **Step 2:** Tinh giản `TripRecentExpenses` thành thẻ Bento với danh sách giao dịch gọn gàng, icon tròn danh mục và số tiền rõ ràng.
- [ ] **Step 3:** Tái cấu trúc layout trong `src/app/(app)/trips/[id]/page.tsx` thành Bento Grid 12 cột cân đối, thoáng mắt.
- [ ] **Step 4:** Kiểm tra kiểm thử và commit: `git commit -m "feat(ui): bento layout and compact avatar stack for trip overview"`.

---

### Task 3: Tinh giản thẻ Lịch trình & Phân hệ Lịch trình (Itinerary)
Làm thoáng thẻ điểm đến `TripItineraryCard`, thu gọn các nút thao tác vào dropdown menu hoặc icon nhỏ, hiển thị nhãn thời tiết Open-Meteo và trạng thái khóa vị trí tinh tế.

**Files:**
- Modify: `src/components/trips/itinerary/trip-itinerary-card.tsx`
- Modify: `src/components/trips/itinerary/trip-itinerary-timeline.tsx`
- Modify: `src/components/trips/itinerary/trip-itinerary-tab.tsx`
- Test: `src/components/trips/itinerary/trip-itinerary-integration.test.ts`

- [ ] **Step 1:** Tinh chỉnh `TripItineraryCard`: Tăng khoảng cách thở, bo góc `rounded-2xl`, làm nổi bật Tên địa điểm và Giờ đến, gom nút hành động vào menu gọn.
- [ ] **Step 2:** Đồng bộ hiển thị badge thời tiết và chi phí liên kết dạng chip nhỏ thanh thoát.
- [ ] **Step 3:** Chạy `npx vitest run src/components/trips/itinerary/trip-itinerary-integration.test.ts`.
- [ ] **Step 4:** Commit: `git commit -m "feat(ui): streamline itinerary cards and timeline"`.

---

### Task 4: Tinh giản thẻ Chi tiêu (Expenses) & Thẻ Công nợ (Settlement)
Thiết kế lại danh sách chi tiêu và luồng chuyển khoản công nợ theo phong cách thẻ thoáng mắt, hiển thị người chia tiền dạng chip thu gọn.

**Files:**
- Modify: `src/components/trips/expenses/trip-expense-card.tsx`
- Modify: `src/components/trips/expenses/trip-expenses-tab.tsx`
- Modify: `src/components/trips/settlement/trip-settlement-tab.tsx`
- Modify: `src/components/trips/settlement/trip-transfer-card.tsx`
- Test: `src/components/trips/expenses/trip-expenses-integration.test.ts` (hoặc test tương ứng)

- [ ] **Step 1:** Tinh chỉnh thẻ chi tiêu: Avatar người chi + Tên khoản chi + Số tiền to rõ ràng + Chip số người tham gia.
- [ ] **Step 2:** Cải tiến thẻ chuyển khoản công nợ: Trực quan hóa luồng Người nợ ──> Người nhận kèm nút quét VietQR tiện lợi.
- [ ] **Step 3:** Chạy test kiểm thử các luồng chi tiêu và quyết toán.
- [ ] **Step 4:** Commit: `git commit -m "feat(ui): modern airy expense and settlement cards"`.

---

### Task 5: Kiểm thử hồi quy toàn diện & Xác thực Build
Chạy toàn bộ 94+ test files và lệnh build Next.js để đảm bảo không có bất kỳ lỗi biên dịch hay suy thoái nào.

- [ ] **Step 1:** Chạy `npm test` -> 100% tests passed.
- [ ] **Step 2:** Chạy `npm run build` -> Exit code 0.
- [ ] **Step 3:** Hoàn tất kế hoạch và bàn giao cho người dùng.
