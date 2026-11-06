# Kế Hoạch Thiết Kế & Lập Trình Lại Trang Chủ (Landing Page) Smart Trip

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng lại toàn bộ trang chủ Smart Trip (`src/app/(public)/page.tsx`) đạt tiêu chuẩn thẩm mỹ và trải nghiệm tương tác đỉnh cao (lấy cảm hứng từ Nudge, Lasso Commerce, Bloome, Léo Parpeix, Relace), giữ trọn vẹn nhận diện Tactile Organic Minimalism và tuân thủ các chuẩn mực kỹ thuật dự án.

**Architecture:** Tách biệt module rõ ràng: Header định vị thương hiệu có hiệu ứng kính mờ (glassmorphism); Hero Section với Product Showcase widget tương tác trực tiếp (live demo chia tiền & VietQR); Marquee ticker trôi mượt mà; Bento Grid 4 tính năng cốt lõi với micro-interactions phong phú; Carousel kịch bản chuyến đi (phượt, gia đình, công ty); Accordion FAQ tương tác mượt mà; và Banner CTA chuyển đổi cao.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, Lucide React, TypeScript 5 Strict.

**Spec:** Phối hợp tinh hoa từ 7 video và 5 mẫu giao diện:
- Nudge: Nền canvas hữu cơ `#F4F9EC`, typography thanh thoát, whitespace thoáng đãng, accordion mượt mà.
- Lasso Commerce: Hero widget giả lập app với các tab tương tác chuyển đổi trạng thái live (Chia đều, Chia theo món, VietQR 24/7, Lịch trình).
- Bloome: Thẻ Bento sống động, bong bóng hội thoại tương tác mô phỏng nhóm chốt sổ, màu sắc tương phản nổi bật.
- Léo Parpeix: Micro-interactions nhạy bén, ticker dải ngân hàng & địa danh du lịch chuyển động liên tục.
- Relace: Bố cục tinh tế, dữ liệu so sánh rõ ràng, hoàn toàn responsive từ mobile đến desktop.

---

## Global Constraints
- Bảng màu chuẩn Smart Trip: Yale Blue `#184E77`, Baltic Blue `#1E6091`, Cerulean `#1A759F`, Ocean Mist `#52B69A`, Lime Cream `#D9ED92`, Canvas `#F4F9EC`.
- Tiền tệ: Số nguyên VND, định dạng tiếng Việt chuẩn `1.250.000 ₫`.
- Không sử dụng các tính năng ngoài phạm vi Release 1 (không OCR tự động, không ví tiền tệ ảo, không dark mode, không biểu đồ donut phức tạp).
- Không lỗi TypeScript (`npx tsc --noEmit` = 0).
- Bảo toàn 100% kết quả kiểm thử hiện có (`npm test`).

## Review Focus
1. Mobile layout & Responsive: Đảm bảo hiển thị hoàn hảo trên màn hình hẹp (375px - 430px) không tràn viền, không bể layout.
2. Micro-interactions: Các nút bấm chuyển tab, demo chia tiền, sao chép STK phản hồi mượt mà không bị giật lag.
3. Accessible markup: Các button, link, accordion có `aria-*` tags đầy đủ và hỗ trợ bàn phím.
4. Typography & Kontrast: Độ tương phản chữ đạt chuẩn WCAG AA/AAA trên nền màu `#F4F9EC` và `#FFFFFF`.
5. Performance & Bundle: Sử dụng CSS animation và React state cục bộ tinh gọn, không tải thư viện nặng thừa thãi.

---

### Task 1: Thiết Kế Hero Interactive App Showcase (`hero-interactive-showcase.tsx`)
**Files:**
- Create: `src/components/landing/hero-interactive-showcase.tsx`
- Test: Kiểm tra render và tương tác state chuyển tab (Chia đều vs Chia món vs VietQR vs Lộ trình)

- [ ] **Step 1:** Viết component `HeroInteractiveShowcase` với giao diện giả lập cửa sổ ứng dụng Smart Trip nổi bật.
- [ ] **Step 2:** Tích hợp bộ chuyển tab trực tiếp:
  - Tab 1: "Chia đều tức thì" (hiển thị 4 thành viên với số tiền tự cân bằng 450.000 ₫/người).
  - Tab 2: "Chia theo món" (hiển thị hóa đơn lẩu nướng với chi tiết từng món và tag thành viên tham gia).
  - Tab 3: "VietQR 1-chạm" (hiển thị thẻ VietQR Napas 24/7 có hiệu ứng quét sáng và nút copy STK).
  - Tab 4: "Lộ trình ngày" (hiển thị timeline timeline 3 chặng check-in tại Đà Lạt).
- [ ] **Step 3:** Thêm các badge nổi động (floating pills): "Đã đối soát 100%", "Tiết kiệm 45 phút tính toán", "EMVCo Napas 24/7".

---

### Task 2: Dải Chuyển Động Ticker Địa Danh & Ngân Hàng (`landing-marquee.tsx`)
**Files:**
- Create: `src/components/landing/landing-marquee.tsx`

- [ ] **Step 1:** Tạo component marquee chạy vô tận mượt mà bằng CSS thuần chứa các ngân hàng Napas hỗ trợ (Vietcombank, MB, Techcombank, ACB, VPBank, TPBank, BIDV, Agribank, VietinBank...).
- [ ] **Step 2:** Tạo dải ticker các điểm đến du lịch phổ biến của các nhóm bạn (Đà Lạt, Phú Quốc, Sapa, Hà Giang, Quy Nhơn, Ninh Bình, Đà Nẵng, Hội An).

---

### Task 3: Hệ Thống Thẻ Bento Features Sống Động (`bento-features.tsx`)
**Files:**
- Create: `src/components/landing/bento-features.tsx`

- [ ] **Step 1:** Xây dựng Bento Grid 4 ô bất đối xứng cao cấp:
  - **Ô 1 (Lớn - 7 cols):** *Thuật toán chia nợ tối ưu* - Demo chuyển đổi giữa 6 giao dịch phức tạp rút gọn còn đúng 2 giao dịch chuyển khoản.
  - **Ô 2 (5 cols):** *Mã VietQR động không cần nhớ STK* - Tự động điền số tiền và nội dung chuyển khoản, an toàn chuẩn bảo mật.
  - **Ô 3 (5 cols):** *Lịch trình gắn liền điểm chi tiêu* - Mỗi địa điểm check-in đều liên kết trực tiếp với hóa đơn ăn uống, vé tham quan.
  - **Ô 4 (7 cols):** *Kho lưu trữ ảnh hóa đơn minh bạch* - Giữ trọn chứng từ gốc, xem lại mọi lúc để đối chiếu minh bạch.
- [ ] **Step 2:** Thêm hiệu ứng hover zoom nhẹ, gradient border và ánh sáng mềm (ambient shadow).

---

### Task 4: Trình Diễn Kịch Bản Chuyến Đi (`trip-scenarios.tsx`) & Accordion FAQ (`landing-faq.tsx`)
**Files:**
- Create: `src/components/landing/trip-scenarios.tsx`
- Create: `src/components/landing/landing-faq.tsx`

- [ ] **Step 1:** Xây dựng `trip-scenarios.tsx` với tab tương tác chuyển đổi giữa 3 nhóm chuyến đi thực tế: "Nhóm phượt bạn thân", "Team building công ty", "Du lịch đại gia đình".
- [ ] **Step 2:** Xây dựng `landing-faq.tsx` dạng accordion câu hỏi thường gặp với animation mở mượt mà và nội dung giải đáp thuyết phục.

---

### Task 5: Nâng Cấp Header, Footer & Banner CTA Chuyển Đổi Cao
**Files:**
- Modify: `src/components/landing/landing-header.tsx`
- Modify: `src/components/landing/landing-footer.tsx`
- Create: `src/components/landing/landing-cta-banner.tsx`

- [ ] **Step 1:** Nâng cấp `landing-header.tsx` với nền kính mờ `backdrop-blur-md bg-white/80`, pill định vị, menu trượt mobile tiện lợi.
- [ ] **Step 2:** Tạo `landing-cta-banner.tsx` với nền Yale Blue `#184E77` sâu thẳm, hiệu ứng ánh sáng gradient rực rỡ, nút CTA Google OAuth lớn và cam kết bảo mật.
- [ ] **Step 3:** Hoàn thiện `landing-footer.tsx` đồng bộ nhận diện.

---

### Task 6: Tích Hợp Toàn Bộ Vào `src/app/(public)/page.tsx` & Kiểm Thử Toàn Diện
**Files:**
- Modify: `src/app/(public)/page.tsx`

- [ ] **Step 1:** Kết nối toàn bộ các section mới vào `page.tsx`.
- [ ] **Step 2:** Chạy `npx tsc --noEmit` để đảm bảo 0 lỗi TypeScript.
- [ ] **Step 3:** Chạy `npm test` để kiểm tra tính toàn vẹn của toàn bộ hệ thống test suite.
- [ ] **Step 4:** Kiểm tra trực quan trên trình duyệt và xác nhận kết quả.
