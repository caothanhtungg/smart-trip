# Design System: Smart Trip & Expense Planner
## Overview
A fresh, friendly, travel-inspired MOBILE-FIRST app for groups of friends who plan a trip together and split costs. Mood: sunny, calm, trustworthy, like a coastline that moves from fresh lime shallows to deep ocean blue. Airy layouts with generous whitespace, soft rounded shapes, and money amounts as the visual hero. ALL interface text is in Vietnamese.
## Colors
Brand palette (use exactly these hex values):
- Lime Cream #D9ED92: highlights, hero gradient start, soft "positive" tint backgrounds
- Light Green #B5E48C: avatar and chip backgrounds
- Mint Green #99D98C: "safe" progress, light illustrations
- Emerald #76C893: positive fills, selected states (bold/large text only on top of it)
- Ocean Mist #52B69A: secondary accents, icons, selected chips (large text only on top of it)
- Tropical Teal #34A0A4: decorative accents and chart series. NEVER for small text on white (contrast 3.1)
- Bondi Blue #168AAD: large icons and large headings only
- Cerulean #1A759F: PRIMARY action color for buttons, active tab, links. White text allowed (5.1:1)
- Baltic Blue #1E6091: pressed state and top app bar. White text allowed
- Yale Blue #184E77: headings, strong text, dark surfaces. White text allowed
Neutrals: app background #F4F9EC (very light lime tint), card surface #FFFFFF, divider #DDEBD0, body text #2B3A46, secondary text #5B6B78.
Functional colors (only for meaning): debt/negative amount and errors #B42318, warning (budget 70-100%, schedule conflict) #C2410C on tint #FFF1E6, positive amount text #2E7D5B.
Text rule: on Lime Cream, Light Green, Mint Green use Yale Blue #184E77 text. White text only on Cerulean, Baltic Blue, Yale Blue.
Gradient: Lime Cream -> Ocean Mist -> Cerulean -> Yale Blue at 135 degrees, used ONLY as a decorative cover strip on trip cards and the trip header (max 96px tall). Never put body text on the gradient.
## Typography
Font: Be Vietnam Pro (fallback Inter), full Vietnamese diacritics support, line-height at least 1.4 because Vietnamese accents stack.
Scale: Money display 32/700 with tabular numbers; H1 24/700; H2 20/600; Title 16/600; Body 15/400; Caption 13/500. Never below 13px.
Money format: dot as thousands separator and the symbol after, e.g. "1.250.000 ₫". Positive amounts "+350.000 ₫" in #2E7D5B, debts "-120.000 ₫" in #B42318.
## Shape & depth
Radius: cards 20px, buttons 14px, inputs 14px, chips fully rounded, bottom sheets 28px top corners. Shadows are soft and blue-green tinted, for example 0 6px 20px rgba(24,78,119,0.08). No heavy borders, use dividers #DDEBD0. 4px spacing grid, page padding 20px, card padding 16px, gap 12px. Touch targets at least 48px.
## Components
- Bottom tab bar inside a trip with 4 tabs: "Tổng quan", "Lịch trình", "Chi tiêu", "Công nợ". Active tab = Cerulean icon + label with a soft pill indicator.
- Primary button: full width, 52px high, Cerulean, white 16/600 text. Secondary button: white with 1.5px Cerulean border. Destructive text button in #B42318.
- Floating add button: 56px circle, Cerulean, white plus icon.
- Avatar: circle with initials, background rotating through Lime Cream, Light Green, Mint Green, Ocean Mist, text Yale Blue. A member WITHOUT an account has a dashed outline and the small label "Chưa có tài khoản".
- Status chips: "Chưa thanh toán" (warning tint), "Đã thanh toán" (Ocean Mist tint), "Đã hoàn tất" (Lime Cream tint with check icon).
- Budget progress bar: under 70% Emerald, 70-100% #C2410C, over 100% #B42318 with the label "Đã vượt dự kiến X ₫".
- Icons: rounded outline, 24px, 2px stroke.
## Do and Don't
Do: realistic Vietnamese sample data and friendly short microcopy. Don't: no purple, pink or neon, no dark mode, no tiny text, no Tropical Teal or Bondi Blue for small text, no stock-photo look.