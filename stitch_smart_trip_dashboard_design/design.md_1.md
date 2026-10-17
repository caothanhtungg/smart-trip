# Design System: Smart Trip & Expense Planner
## Overview
A fresh, friendly, travel-inspired RESPONSIVE WEBSITE for groups of friends who plan a trip together and split costs. Designed desktop-first (1440px canvas, content max-width 1200px) and it collapses cleanly to tablet and mobile. Mood: sunny, calm, trustworthy, like a coastline moving from fresh lime shallows to deep ocean blue. Airy layouts, generous whitespace, soft rounded shapes, money amounts as the visual hero. ALL interface text is in Vietnamese.
## Colors
Brand palette (use exactly these hex values):
- Lime Cream #D9ED92: highlights, hero wash, soft "positive" tint backgrounds
- Light Green #B5E48C: avatar and chip backgrounds
- Mint Green #99D98C: "safe" progress, light illustrations
- Emerald #76C893: positive fills, selected states (bold/large text only on top of it)
- Ocean Mist #52B69A: secondary accents, icons, focus ring, selected chips (large text only on top of it)
- Tropical Teal #34A0A4: decorative accents and chart series. NEVER for small text on white (contrast 3.1)
- Bondi Blue #168AAD: large icons and large headings only
- Cerulean #1A759F: PRIMARY action color for buttons, active tab, links. White text allowed (5.1:1)
- Baltic Blue #1E6091: hover/pressed state of primary buttons. White text allowed
- Yale Blue #184E77: headings, logo text, footer and dark surfaces. White text allowed
Neutrals: page background #F4F9EC (very light lime tint), card surface #FFFFFF, divider #DDEBD0, table row hover #EEF6E4, body text #2B3A46, secondary text #5B6B78.
Functional colors (only for meaning): debt/negative amount and errors #B42318, warning (budget 70-100%, schedule conflict) #C2410C on tint #FFF1E6, positive amount text #2E7D5B.
Text rule: on Lime Cream, Light Green, Mint Green use Yale Blue #184E77 text. White text only on Cerulean, Baltic Blue, Yale Blue.
Gradient: Lime Cream -> Ocean Mist -> Cerulean -> Yale Blue at 135 degrees, used ONLY as a decorative cover strip on trip cards and trip headers (max 120px tall) and as decorative shapes. Never put body text on the gradient. The landing page hero may use a soft wash from Lime Cream #D9ED92 down to #F4F9EC with Yale Blue text.
## Typography
Font: Be Vietnam Pro (fallback Inter), full Vietnamese diacritics support, line-height at least 1.5 for body because Vietnamese accents stack.
Scale: Money display 36/700 with tabular numbers; H1 32/700; H2 24/700; H3 20/600; Title 16/600; Body 16/400; Small 14/500. Never below 14px.
Money format: dot as thousands separator and the symbol after, e.g. "1.250.000 ₫". Positive amounts "+350.000 ₫" in #2E7D5B, debts "-120.000 ₫" in #B42318.
## Layout
12-column grid, content max-width 1200px, page side padding 24px desktop and 16px mobile, section gap 32px, card padding 24px, gap 16-24px. Breakpoints: desktop from 1024px, tablet 640-1023px, mobile below 640px. Typical trip pages use a main column (8 cols) plus a sticky side column (4 cols).
## Shape & depth
Radius: cards 20px, buttons 12px, inputs 12px, chips fully rounded, modals 24px. Shadows soft and blue-green tinted, for example 0 6px 20px rgba(24,78,119,0.08). No heavy borders, use dividers #DDEBD0.
## Components
- Top navigation bar: 72px high, white, 1px divider below. Left: map-pin logo in Cerulean + "Smart Trip" in Yale Blue bold. Next to it the link "Chuyến đi của tôi". Right: avatar menu. On public pages the right side shows a text button "Đăng nhập" and a primary button "Bắt đầu miễn phí".
- Trip tab bar under the trip header: "Tổng quan", "Lịch trình", "Chi tiêu", "Công nợ", "Thành viên". Active tab = Cerulean text with a 3px underline. On mobile it becomes a bottom navigation bar with icons.
- Buttons: 44px high (large 52px), Cerulean with white 16/600 text, hover Baltic Blue, visible 3px Ocean Mist focus ring. Secondary: white with 1.5px Cerulean border. Destructive text button in #B42318.
- Inputs: 48px high, 1px #DDEBD0 border, Cerulean border on focus, label above, helper text below.
- Modal: centered, 560px wide, radius 24px, scrim rgba(24,78,119,0.4). Toast notifications at top right.
- Tables: 56px rows, header in secondary text, hover row #EEF6E4, money columns right-aligned with tabular numbers.
- Avatar: circle with initials, background rotating through Lime Cream, Light Green, Mint Green, Ocean Mist, text Yale Blue. A member WITHOUT an account has a dashed outline and the small label "Chưa có tài khoản".
- Status chips: "Chưa thanh toán" (warning tint), "Đã thanh toán" (Ocean Mist tint), "Đã hoàn tất" (Lime Cream tint with check icon).
- Budget progress bar: under 70% Emerald, 70-100% #C2410C, over 100% #B42318 with the label "Đã vượt dự kiến X ₫".
- Footer: Yale Blue background, white text, links "Chính sách bảo mật", "Điều khoản sử dụng", "Liên hệ".
- Icons: rounded outline, 24px, 2px stroke.
## Do and Don't
Do: realistic Vietnamese sample data, friendly short microcopy, clear hover and focus states. Don't: no purple, pink or neon, no dark mode, no text below 14px, no Tropical Teal or Bondi Blue for small text, no stock-photo look.