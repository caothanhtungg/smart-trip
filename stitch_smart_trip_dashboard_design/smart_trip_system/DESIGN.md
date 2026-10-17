---
name: Smart Trip System
colors:
  surface: '#f7f9ff'
  surface-dim: '#bfddff'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf4ff'
  surface-container: '#e3efff'
  surface-container-high: '#d9eaff'
  surface-container-highest: '#cfe5ff'
  on-surface: '#001d33'
  on-surface-variant: '#40484e'
  inverse-surface: '#003354'
  inverse-on-surface: '#e8f2ff'
  outline: '#70787f'
  outline-variant: '#bfc7cf'
  surface-tint: '#00658d'
  primary: '#005c80'
  on-primary: '#ffffff'
  primary-container: '#1a759f'
  on-primary-container: '#e5f3ff'
  inverse-primary: '#84cffd'
  secondary: '#006b56'
  on-secondary: '#ffffff'
  secondary-container: '#92f5d6'
  on-secondary-container: '#00725b'
  tertiary: '#4c5b10'
  on-tertiary: '#ffffff'
  tertiary-container: '#637428'
  on-tertiary-container: '#e6fa9d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c6e7ff'
  primary-fixed-dim: '#84cffd'
  on-primary-fixed: '#001e2d'
  on-primary-fixed-variant: '#004c6b'
  secondary-fixed: '#92f5d6'
  secondary-fixed-dim: '#75d8bb'
  on-secondary-fixed: '#002018'
  on-secondary-fixed-variant: '#005140'
  tertiary-fixed: '#d8ec91'
  tertiary-fixed-dim: '#bccf78'
  on-tertiary-fixed: '#171e00'
  on-tertiary-fixed-variant: '#3e4c00'
  background: '#f7f9ff'
  on-background: '#001d33'
  surface-variant: '#cfe5ff'
  bg-canvas: '#F4F9EC'
  surface-card: '#FFFFFF'
  border-hairline: '#DDEBD0'
  hover-row: '#EEF6E4'
  text-muted: '#5B6B78'
  baltic-blue: '#1E6091'
  bondi-blue: '#168AAD'
  tropical-teal: '#34A0A4'
  emerald-fill: '#76C893'
  functional-negative: '#B42318'
  functional-positive: '#2E7D5B'
  functional-warning: '#C2410C'
  functional-warning-bg: '#FFF1E6'
typography:
  display-money:
    fontFamily: Be Vietnam Pro
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  display-money-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-h1:
    fontFamily: Be Vietnam Pro
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 42px
  headline-h1-mobile:
    fontFamily: Be Vietnam Pro
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
  headline-h2:
    fontFamily: Be Vietnam Pro
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 34px
  headline-h3:
    fontFamily: Be Vietnam Pro
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 30px
  title-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-default:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-medium:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 26px
  label-default:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 22px
  label-semibold:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 22px
  code-invite:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 26px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 1.5rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

The design system establishes a welcoming, clear, and reassuring atmosphere for group travel coordination and transparent expense sharing. Drawing from a coastal spectrum—transitioning from fresh lime shallows into deep maritime blues—the visual tone replaces the social friction of group finances with intuitive clarity, collaborative trust, and outdoor vitality.

The aesthetic follows **Tactile Organic Minimalism**:
- **Tone:** Optimistic, mathematically clear, responsible, and inviting.
- **Focus:** Itinerary coordination and balance settlement clarity, framed by generous whitespace and soft pill-shaped geometries.
- **Audience:** Groups of travel companions and trip coordinators managing shared journeys and multi-party payment splits.
- **Strict Terminology (Tiếng Việt):**
  - Trip leader is strictly designated as **Trưởng nhóm** (never "Host", "Chủ nhóm", or "Thủ quỹ").
  - Unregistered companion without an account is strictly designated as **Chưa có tài khoản** (never "Khách", "Ảo", "Khách ngoài", or "Thành viên ảo").
  - Trip lifecycle follows exactly 3 mutually exclusive statuses: **Đang lên kế hoạch**, **Đang thanh toán**, and **Đã hoàn tất** (never "Đang diễn ra", "Sắp diễn ra", or "Đang kết toán").
  - Invitation access code is strictly designated as **Mã mời** (a 10–12 uppercase alphanumeric string such as `DL3N2D-TRIP99`, never a 6-digit "PIN").
- **System Feature Constraints:**
  - Authentication: Single-touch social login only (strictly no email/password inputs, no phone numbers, no SMS, no 2FA).
  - Localization: Dedicated native Vietnamese UI (strictly no language switcher widgets).
  - Scope Limits: Strictly no "Ví" / "Ví chuyến đi" module, no OCR or AI receipt scanning, no weather widgets, no Excel/report export buttons.
  - Tone & Naming: No advertising copy or user count claims (e.g., "hàng ngàn nhóm bạn"). External services must use generic labels (e.g., use "Mã chuyển khoản" instead of "VietQR PRO", and "Gợi ý địa điểm" instead of "Google Places").

## Colors

The color palette anchors interactive affordances in deep ocean tones while utilizing refreshing lime tints for status differentiation and structural framing.

### Palette Hierarchy & Intent
- **Primary (`#1A759F` - Cerulean):** Core interactive triggers, active tab indicators, primary action buttons, and focused form field boundaries. Transitions to `baltic-blue` (`#1E6091`) on hover.
- **Secondary (`#52B69A` - Ocean Mist):** Supporting interactive accents, focus rings, progress indicators, and status badges.
- **Tertiary (`#D9ED92` - Lime Cream):** Ambient category pills, successful completion indicators, and contextual decorative highlights.
- **Neutral (`#184E77` - Yale Blue):** High-contrast display typography, application branding, primary labels, and structured headers.
- **Canvas & Card Base:** Canvas is anchored with `bg-canvas` (`#F4F9EC`), supporting pure `surface-card` (`#FFFFFF`) containers framed with subtle organic borders (`border-hairline` `#DDEBD0`).

### Accessibility & Status Rules
- **Contrast Guardrails:** Light accent backgrounds (`#D9ED92`, `#B5E48C`, `#99D98C`) must strictly use `#184E77` or `#0E1D28` for text. White text is strictly restricted to `#1A759F`, `#1E6091`, and `#184E77`.
- **Trip Status Semantics:**
  - **Đang lên kế hoạch:** Container fill `rgba(82, 182, 154, 0.15)`, text `#1A759F`.
  - **Đang thanh toán:** Container fill `#FFF1E6`, text `#C2410C`.
  - **Đã hoàn tất:** Container fill `#D9ED92`, text `#184E77`.
- **Financial Balances:**
  - Negative balance / nợ cần trả: `#B42318`.
  - Positive balance / đã nhận: `#2E7D5B`.
  - Pending settlement / chờ thanh toán: `#C2410C` on `#FFF1E6`.

## Typography

Typography uses **Be Vietnam Pro** across all viewport roles, selected specifically for reliable rendering of stacked Vietnamese diacritical accents (dấu hỏi, ngã, nặng, sắc, huyền).

### Editorial & Quantitative Formatting
- **Diacritic Clearance:** Line heights maintain a minimum factor of 1.5x–1.625x to ensure tone marks never clip or collide with adjacent lines.
- **Date & Time Standards:**
  - Hours must strictly follow the 24-hour format with leading zero (e.g., `14:00`, `08:00`, `15:30`). AM/PM notation is strictly forbidden.
  - Dates must strictly follow the format `dd/mm/2026` with fixed year `2026` (e.g., `15/04/2026`, `02/09/2026`).
- **Financial Digits:** All expense tables, settlement splits, and price displays must apply tabular figures (`font-variant-numeric: tabular-nums`). Currency uses dot delimiters followed by the Vietnamese Dong symbol (`1.250.000 ₫`).
- **Mã mời Representation:** Rendered in `code-invite` with uppercase letter spacing (`letter-spacing: 0.08em`) to ensure legibility during group sharing (e.g., `DL3N2D-TRIP99`).
- **Type Scale Floor:** No interactive or descriptive UI copy drops below `14px` (`label-default`).

## Layout & Spacing

The layout is structured on an adaptable 12-column grid prioritizing operational clarity and responsive reflow.

### Structural Framework
- **Desktop (1024px+):** Max-width content boundary of `1200px` centered on a `1440px` viewport. Common workspace pages use an asymmetric split: an 8-column main activity stream (timeline, expense ledger) alongside a sticky 4-column settlement summary rail.
- **Tablet (640px – 1023px):** 8-column layout with `margin: 1.5rem` (`24px`). Side panels flow beneath the main activity ledger.
- **Mobile (<640px):** Single-column layout with `margin-mobile: 1rem` (`16px`) and `gutter-mobile: 1rem` (`16px`).

### Vertical Rhythm & Density
- Major view blocks and content sections align with a `32px` (`space-xl`) vertical rhythm.
- Card padding is set to `24px` (`space-lg`) on desktop and automatically compresses to `16px` (`space-md`) on mobile viewports.
- Spacing between related form elements, chip collections, and list entries strictly follows `8px` (`space-sm`) or `16px` (`space-md`).

## Elevation & Depth

Visual depth is achieved through softly tinted, ambient drop shadows and low-contrast borders rather than harsh, dark drop shadows.

- **Ambient Tinting:** Shadows use an organic Yale Blue wash (`rgba(24, 78, 119, 0.08)`), blending seamlessly with the `#F4F9EC` canvas.
- **Surface Tier 1 (Cards & Data Panels):**
  - Shadow: `0 4px 16px rgba(24, 78, 119, 0.06)`
  - Border: 1px hairline border in `#DDEBD0`
- **Surface Tier 2 (Floating Popovers, Action Menus, Hovered Cards):**
  - Shadow: `0 8px 24px rgba(24, 78, 119, 0.12)`
  - Border: 1px solid `#DDEBD0`
  - Motion: `200ms cubic-bezier(0.16, 1, 0.3, 1)`
- **Modal & Drawer Overlays:**
  - Scrim: `rgba(24, 78, 119, 0.40)` with `backdrop-filter: blur(4px)`
  - Container Shadow: `0 20px 48px rgba(24, 78, 119, 0.22)`

## Shapes

The design system adopts a rounded shape language (Tier 2), balancing friendly touch affinity with structural organization.

- **Cards & Primary Modules:** Border radius of `16px` to `20px` (`rounded-xl` equivalent), establishing soft boundaries for complex split panels.
- **Controls & Input Fields:** Standardized at `12px` border radius for buttons, text inputs, and select triggers.
- **Tags, Status Badges & Avatars:** Fully rounded pill format (`9999px`) for lifecycle badges, status tags, and user representations.
- **Dialogs & Sheet Modals:** Radiused at `24px` to soften viewport-centered overlays.

## Components

### Global Top Navigation (Authenticated)
Strictly standardized across every page when logged in:
- **Left Anchor:** Application logo displayed exactly once: map-pin icon paired with text "Smart Trip" in `#184E77` (`font-weight: 700`).
- **Center Navigation:** Exactly one primary navigation link: **Chuyến đi của tôi**. Absolutely no secondary links such as "Khám phá", "Cẩm nang", "Bảng giá", "Tính năng", or "Cách hoạt động".
- **Right Anchor:** Single notification bell icon button (`40px` circular tap target) and strictly one user profile block showing the circular avatar with accompanying text "Lan".
- **Container Structure:** Fixed `72px` height, `#FFFFFF` background, and `1px` bottom border in `#DDEBD0`.

### Buttons & Interactive Triggers
- **Primary Action:** Height `44px` (or `48px` on mobile), solid `#1A759F` background with `#FFFFFF` text (`16px`, `weight: 600`), `12px` radius. Hover state shifts to `#1E6091`. Focus ring is an explicit `3px` solid `#52B69A` with `2px` offset.
- **Secondary Action:** Height `44px`, `#FFFFFF` surface with `1.5px` border in `#1A759F` and `#1A759F` text. Hover changes background to `#EEF6E4`.
- **Destructive Action:** Height `44px`, transparent surface with `#B42318` text; confirmation modals use solid `#B42318` background with `#FFFFFF` text.

### Trip Status Chips
Pill radius `9999px`, height `32px`, horizontal padding `12px`, typography `label-semibold` (`14px`, `weight: 600`).
- **Đang lên kế hoạch:** Background `rgba(82, 182, 154, 0.15)`, text `#1A759F`.
- **Đang thanh toán:** Background `#FFF1E6`, text `#C2410C`.
- **Đã hoàn tất:** Background `#D9ED92`, text `#184E77`, accompanied by a leading checkmark icon.

### Member & Role Badges
- **Trưởng nhóm:** Pill badge rendered in `#184E77` background with `#FFFFFF` text or `#DDEBD0` border with a subtle crown/shield icon. Never use "Host", "Chủ nhóm", or "Thủ quỹ".
- **Chưa có tài khoản:** Dashed `1.5px` border in `#52B69A` on a `rgba(82, 182, 154, 0.08)` surface with `#1A759F` text. Never use "Khách", "Ảo", "Khách ngoài", or "Thành viên ảo".
- **Avatar System:** Standard `40px` circle with bold initials cycling among lime and ocean tones (`#D9ED92`, `#B5E48C`, `#99D98C`, `#52B69A`) with text locked to `#184E77`.

### Invitation Module (Mã mời)
- Container: Surface `#FFFFFF` card with hairline `#DDEBD0` border.
- Display: Rendered prominently in `code-invite` typography (e.g., `DL3N2D-TRIP99`) inside a dashed `#52B69A` bounding container with a dedicated "Sao chép mã" action button. Strictly refer to this as "Mã mời" (never "PIN").

### Input Fields & Controls
- Height `48px`, `1px` border in `#DDEBD0`, radius `12px`, background `#FFFFFF`, text `#184E77`.
- Focus state applies a `1px` border in `#1A759F` plus a subtle `0 0 0 3px rgba(82, 182, 154, 0.25)` outer halo.
- Labels sit above inputs in `14px` `#184E77` (`font-weight: 600`).
- Checkboxes & Radios: `20px` size, `1.5px` border in `#1A759F`, filled with `#1A759F` when checked.

### Expense & Split Tables
- Row height `56px`, divided by `1px` hairline `#DDEBD0`. Hover applies `#EEF6E4`.
- Column header: Uppercase `14px` in `#5B6B78`, `font-weight: 600`.
- Monetary amounts are right-aligned, styled with `tabular-nums` in `Be Vietnam Pro`.
- Payment transfer actions provide a modal trigger for generic "Mã chuyển khoản" (strictly without branded third-party service names). Location selections reference "Gợi ý địa điểm".