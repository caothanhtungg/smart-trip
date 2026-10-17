---
name: Smart Trip & Expense Planner
colors:
  surface: '#f6f9ff'
  surface-dim: '#ccdceb'
  surface-bright: '#f6f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#ebf5ff'
  surface-container: '#e0f0ff'
  surface-container-high: '#daeafa'
  surface-container-highest: '#d4e4f4'
  on-surface: '#0e1d28'
  on-surface-variant: '#40484e'
  inverse-surface: '#23323e'
  inverse-on-surface: '#e6f2ff'
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
  background: '#f6f9ff'
  on-background: '#0e1d28'
  surface-variant: '#d4e4f4'
  lime-cream: '#D9ED92'
  light-green: '#B5E48C'
  mint-green: '#99D98C'
  emerald: '#76C893'
  ocean-mist: '#52B69A'
  tropical-teal: '#34A0A4'
  bondi-blue: '#168AAD'
  cerulean: '#1A759F'
  baltic-blue: '#1E6091'
  yale-blue: '#184E77'
  bg-canvas: '#F4F9EC'
  surface-card: '#FFFFFF'
  divider-border: '#DDEBD0'
  hover-row: '#EEF6E4'
  text-muted: '#5B6B78'
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

This design system crafts a sunny, clear, and reassuring atmosphere for group travelers planning adventures and settling shared expenses. Evoking the natural progression of a tropical coastline—from crystalline lime shallows to deep ocean blues—the visual tone replaces anxiety over group finances with collaborative transparency and outdoor vitality.

The aesthetic blends **Modern Tactile Minimalist** fundamentals with an organic coastal personality:
- **Tone:** Friendly, reliable, optimistic, and mathematically clear.
- **Focus:** Financial metrics and itineraries serve as primary focal points, framed by generous whitespace and soft pillowy card geometries.
- **Audience:** Groups of friends, travel companions, and coordinators navigating multi-day itineraries and complex debt splits.
- **Localization:** Native Vietnamese interface styling, structured specifically to handle multiline diacritic accents cleanly without visual crowding.

## Colors

The palette establishes an intuitive hierarchy connecting interactive actions to deep ocean tones and status/delight elements to warm lime gradients.

### Functional & Interaction Hierarchy
- **Primary Action (Cerulean `#1A759F`):** Used exclusively for key actionable elements including primary buttons, selected tabs, interactive links, and focused input borders. Hover states transition to **Baltic Blue (`#1E6091`)**.
- **Secondary & Accent (Ocean Mist `#52B69A` & Bondi Blue `#168AAD`):** Secondary interactive elements, prominent feature icons, and keyboard focus rings.
- **Surface & Foundation (Yale Blue `#184E77`):** Primary headings, system logos, deep structural containers, and persistent footers.
- **Canvas & Neutral Surfaces:** The base canvas uses **Lime Wash (`#F4F9EC`)**, supporting crisp `#FFFFFF` cards delineated by subtle organic borders (`#DDEBD0`).

### Accessibility & Contrast Rules
- **Text on Light Tints (`#D9ED92`, `#B5E48C`, `#99D98C`):** Must always use **Yale Blue (`#184E77`)** or primary dark body (`#2B3A46`). White text is strictly forbidden.
- **White Text (`#FFFFFF`):** Permitted exclusively on **Cerulean (`#1A759F`)**, **Baltic Blue (`#1E6091`)**, and **Yale Blue (`#184E77`)**.
- **Decorative Restrictions:** **Tropical Teal (`#34A0A4`)** and **Bondi Blue (`#168AAD`)** are restricted to charts, borders, or large graphical headers (>24px); never deploy them for small body or table copy on light backgrounds.
- **Status Semantics:**
  - Debts, payment shortfalls, and negative amounts: `#B42318`.
  - Credits, positive balances, and complete settlements: `#2E7D5B`.
  - Impending thresholds (70–100% budget, schedule overlaps): `#C2410C` paired with `#FFF1E6` background fills.

## Typography

The typography is built around **Be Vietnam Pro**, curated for optimal rendering of Vietnamese diacritics (dấu ngã, hỏi, nặng, sắc, huyền). 

### Layout & Sizing Mandates
- **Diacritic Clearance:** Body copy maintains a minimum `line-height` of 1.5–1.625 to prevent tone mark clipping and horizontal collisions between lines.
- **Minimum Size Floor:** No interface typography falls below `14px`. Tertiary metadata and helper footnotes remain at `14px` (`label-default`) using medium weighting (`500`).
- **Financial Representation:** All monetary units must enforce tabular numerals (`font-variant-numeric: tabular-nums`) to ensure strict columnar scanning in expense ledgers.
- **Standard Formatting:** Currency uses period separators and suffixed symbol notation: `1.250.000 ₫`. Negative balances include immediate signs: `-120.000 ₫`.

## Layout & Spacing

The responsive system is organized across an adaptable 12-column framework engineered for fluid desktop workspace management and stackable mobile execution.

### Grid & Max Dimensions
- **Desktop (1024px+):** Max-width container of `1200px` centered on a `1440px` workspace canvas. Standard layouts leverage an asymmetric split: an `8-column` main content workspace (itinerary schedules, tabular expenses) complemented by a `4-column` sticky contextual sidebar (debt settlement breakdown, trip wallet balance).
- **Tablet (640px – 1023px):** 8-column layout with 24px margins; sticky panels relocate underneath main operations.
- **Mobile (<640px):** Single-column layout with 16px margins and 16px gutters.

### Spacing Cadence
- Content sections are spaced by default with `32px` (`2rem`) vertical gaps.
- Card interiors adopt uniform `24px` (`space-lg`) padding on desktop, downshifting to `16px` (`space-md`) on mobile viewports.
- Micro-spacing inside form groups and chip sets strictly honors `8px` (`space-sm`) and `12px` intervals.

## Elevation & Depth

Visual hierarchy uses softly tinted, ambient coastal drop-shadows rather than sterile grey shadows or stark high-contrast borders.

- **Atmospheric Tinting:** Shadows feature a subtle Yale Blue chromatic infusion (`rgba(24, 78, 119, 0.08)`), grounding elements organically into the `#F4F9EC` canvas.
- **Resting Layer (Surface Cards):**
  - Shadow: `0 4px 16px rgba(24, 78, 119, 0.06)`
  - Border: 1px continuous hairline in `#DDEBD0`
- **Raised Interactive Layer (Dropdowns, Hovered Cards):**
  - Shadow: `0 8px 24px rgba(24, 78, 119, 0.12)`
  - Transition: `200ms cubic-bezier(0.16, 1, 0.3, 1)`
- **Overlay Scrim Layer (Modals, Slide-overs):**
  - Background Scrim: `rgba(24, 78, 119, 0.40)` with `backdrop-filter: blur(4px)`
  - Shadow: `0 20px 48px rgba(24, 78, 119, 0.20)`
- **Hero & Header Decoration:** Cover strips on trip cards incorporate a diagonal 135-degree gradient (`#D9ED92` to `#52B69A` to `#1A759F` to `#184E77`) capped at a maximum height of `120px`. The gradient acts as structural atmosphere; body typography is never set directly over it.

## Shapes

The design system maintains a balanced, friendly roundedness level (Tier 2), providing tactile organic forms that prevent clinical sterility.

- **Primary Cards & Containers:** Radiused at `20px` (`rounded-xl` equivalent), creating friendly visual blocks for complex expense splits.
- **Action Controls (Buttons & Text Fields):** Standardized at `12px` border radius, ensuring high touch affinity and visual harmony with 44px/48px hit areas.
- **Interactive Tags & Badges:** Fully rounded pill format (`border-radius: 9999px`) for metadata chips, filters, and status indicators.
- **Overlays & Dialogs:** Radiused at `24px` to soften viewport-centered forms.

## Components

### Buttons & Interactive Controls
- **Primary Button:** Height `44px` (Large variant `52px`), solid `#1A759F` background with `#FFFFFF` text (`16px`, weight `600`). Hover elevates to `#1E6091`. Focus indicator is an explicit `3px` solid `#52B69A` ring offset by 2px.
- **Secondary Button:** Height `44px`, `#FFFFFF` surface with `1.5px` solid `#1A759F` border and `#1A759F` text. Hover shifts background to `#EEF6E4`.
- **Destructive Button:** Subtle `#FFFFFF` or transparent base with `#B42318` text; critical confirmations use solid `#B42318` with `#FFFFFF` text.

### Form Inputs & Selects
- Height `48px`, `1px` border in `#DDEBD0`, radius `12px`, background `#FFFFFF`.
- Typography: Input text `16px` `#2B3A46`. Labels are positioned above in `14px` `#184E77` weight `600`.
- Focus state: `1px` solid `#1A759F` with an exterior soft halo `0 0 0 3px rgba(82, 182, 154, 0.25)`.
- Helper / Error message: Fixed `14px` placement below the component; negative states swap border to `#B42318`.

### Chips & Status Indicators
- Height `32px`, pill radius `9999px`, horizontal padding `12px`.
- **Chưa thanh toán:** Background `#FFF1E6`, text `#C2410C`, weight `600`.
- **Đã thanh toán:** Background `rgba(82, 182, 154, 0.15)`, text `#1A759F`, weight `600`.
- **Đã hoàn tất:** Background `#D9ED92`, text `#184E77`, weight `600` accompanied by a leading checkmark icon.

### Avatar System
- Circular `40px` dimensions (Small `32px`, Large `56px`) with centered bold initials.
- Backgrounds cycle dynamically through `#D9ED92`, `#B5E48C`, `#99D98C`, and `#52B69A` with text locked to `#184E77`.
- **Unregistered Guest Members:** Features a distinct `1.5px` dashed border `#52B69A` and an adjacent `14px` indicator badge reading "Chưa có tài khoản".

### Expense Tables & Ledgers
- Row height `56px`, divided by `1px` `#DDEBD0`. Header row uses `#5B6B78` uppercase `14px` text (`weight: 600`).
- Row hover triggers `#EEF6E4` background fill.
- Numbers and currency columns are strictly right-aligned, rendered in tabular figures.

### Budget Progress Bar
- Track height `8px`, radius `9999px`, background `#DDEBD0`.
- **Fill Conditions:**
  - `< 70%`: Filled with Emerald `#76C893`.
  - `70% – 100%`: Filled with Warning `#C2410C`.
  - `> 100%`: Filled with Negative `#B42318`, rendering an appended warning chip stating: "Đã vượt dự kiến [X] ₫".

### Application Header & Navigation
- Height `72px`, `#FFFFFF` surface, `1px` bottom border in `#DDEBD0`.
- Left anchor: Map-pin emblem in `#1A759F` paired with bold typography in `#184E77`.
- Primary navigation tabs: Underline indicator in `#1A759F` (3px thickness) on desktop. Automatically collapses to a fixed bottom navigation bar with icons on viewports below 640px.