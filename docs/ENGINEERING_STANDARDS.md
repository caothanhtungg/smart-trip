# Smart Trip — Engineering Standards

This document defines the shared quality bar for the project codebase. Update it only when a change is intentional and approved.

## 1. Source of truth and change control
- `PROJECT_CONTEXT.md` summarizes project context; original files under `sodothietke/` remain authoritative for the detailed use cases, ERD, and sequence flows.
- Approved design specifications are the visual reference.
- Never silently reconcile conflicting requirements. List the conflict, impact, and options, then ask the product owner.
- Keep changes small, reviewable, and tied to one agreed objective.

## 2. Architecture principles
- Use the existing stack and folder structure if already initialized; do not replace them casually.
- For the proposed Next.js App Router + TypeScript frontend, separate route/page composition, reusable UI components, feature-specific UI, domain logic, and data access adapters.
- Pages should orchestrate composition, not contain every detail.
- Components should have a clear responsibility and typed props.
- Keep reusable primitives (Button, Input, Dialog, Badge, Toast, EmptyState, Skeleton) distinct from Smart Trip feature components.
- Keep mock data/adapters separate from components so a later backend integration does not require rewriting the whole UI.
- Avoid both extremes: giant files and excessive abstraction for one-off code.

## 3. Suggested structure (adapt to the actual scaffold; do not impose blindly)
```text
src/
  app/                 # routes, layouts, loading/error boundaries
  components/ui/       # generic reusable primitives
  features/
    trips/
    itinerary/
    members/
    expenses/
    settlements/
  lib/                 # formatting, shared helpers, constants
  services/             # API/data adapters; mock adapters during UI phase
  types/                # shared domain types when genuinely shared
```
Do not create every folder pre-emptively. Add structure when a concrete feature needs it.

## 4. TypeScript and code style
- Enable strict TypeScript settings in the project and preserve them.
- Avoid `any`. Prefer explicit domain types and discriminated unions for finite states.
- Do not silence errors using `@ts-ignore`, broad casts, or disabling lint rules without a documented reason and approval.
- Use meaningful names that reflect domain meaning. Avoid vague names such as `data`, `item`, or `handleThing` where more precise names are available.
- Keep functions focused and minimize mutation and hidden side effects.
- Extract shared logic only when there is a real reuse or clear domain boundary.
- Keep comments focused on why a non-obvious decision exists, not on narrating obvious syntax.

## 5. UI/UX and accessibility
- Match the approved Stitch design; do not freestyle the visual language across screens.
- Preserve palette: Lime Cream `#D9ED92`, Light Green `#B5E48C`, Mint Green `#99D98C`, Emerald `#76C893`, Ocean Mist `#52B69A`, Cerulean `#1A759F`, Baltic Blue `#1E6091`, Yale Blue `#184E77`, Canvas `#F4F9EC`, white cards, divider `#DDEBD0`.
- Use Be Vietnam Pro; body text line-height should generally be at least 1.5.
- Format VND as Vietnamese locale with thousands separators and the currency symbol after the amount, e.g. `1.250.000 ₫`; use tabular numerals for aligned financial columns.
- Use 24-hour time and Vietnamese date conventions as specified in the approved designs.
- Use vector icons (e.g. Lucide React or approved equivalent); do not use emoji as navigation/category icons.
- Provide focus-visible styles, keyboard operation, accessible labels, appropriate dialog focus behavior, and clear error messages.
- Check desktop, tablet, and mobile layouts. Do not only shrink desktop layouts; adapt navigation and content intentionally.
- Include appropriate loading, empty, error, disabled, success, and boundary states for each implemented interaction.
- Use semantic HTML and sufficient text/background contrast. Verify rather than assume WCAG compliance.

## 6. Domain and financial invariants
- Use approved terminology consistently: `Trưởng nhóm`; `Chưa có tài khoản`; trip statuses `Đang lên kế hoạch`, `Đang thanh toán`, `Đã hoàn tất`; invitation credential label `Mã mời`.
- Respect the documented model where payer/debtor references use `trip_members.id`, because a trip member may not have a user account.
- Do not imply the UI is authoritative for authorization; the future server must enforce permissions.
- Money uses integer VND units, not floating-point arithmetic.
- Equal split must allocate remainder deterministically according to `join_order` and sum exactly to the expense amount.
- Itemized split must reconcile item allocations to the amount. Do not fabricate unapproved tax/service-fee allocation behavior.
- The settlement simplification algorithm must preserve `SUM(net) = 0` and be deterministic.
- Once settlement is locked, UI controls must reflect the locked state, but the future API/database must enforce it too.
- Keep invite preview free of itinerary, expense, and bank-account details. A person cannot claim an existing unregistered member identity without the documented leader approval flow.
- Do not label the product as having a “trip wallet”, automatic receipt OCR, or Excel export; these are out of scope. (Weather forecasting and route optimization are approved for Release 1 Extended via Open-Meteo and TSP 2-Opt).
- R18 payer-permission policy: **approved by user** — Member records only own expenses; Host may record for any member. VietQR UI approach: approved as internal SVG mock; server-side generation method remains open for backend phase.

## 7. Dependencies, errors, and security
- Before adding dependencies, inspect what is already available and state why the new package is needed.
- Prefer small, maintained dependencies and avoid overlapping libraries.
- Do not place secrets in `NEXT_PUBLIC_*` variables or client components.
- Future server code must authenticate and authorize every protected operation independently of what buttons the UI displays.
- Validate request parameters and payloads at server boundaries; produce safe, consistent errors without leaking sensitive details.
- Do not log access tokens, bank account details, invitation secrets, or private user information unnecessarily.
- Rate-limiting is mandatory on all public and quota-sensitive endpoints via the atomic PostgreSQL rate limiter (`checkPostgresRateLimit`).
- OTP credentials must persist in the central database (`verification` table in PostgreSQL) with SHA-256 hashing and constant-time comparison (`timingSafeEqual`). OTP codes must never be leaked or returned in client API responses.

## 8. Maintainability and reviews
- No unrelated refactors in a feature task.
- No dead code, debug logs, placeholder links that look real, or fake success states presented as real backend results.
- Use mock/demo data only when clearly identified and isolated.
- Update relevant documentation when an architecture, design token, domain rule, or public interface changes.
- Review each changed file for correctness, readability, accessibility, data handling, and consistency with neighboring code before reporting completion.
