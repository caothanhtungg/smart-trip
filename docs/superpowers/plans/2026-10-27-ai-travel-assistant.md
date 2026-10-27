# AI Travel Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide a smart floating AI travel assistant in the trip workspace allowing travelers to ask about destinations, homestays, transport/coaches, and estimated costs, with 1-click interactions to the interactive map, itinerary, and expense tracking.

**Architecture:** A domain service handling Gemini AI generation with a structured prompt and a resilient local Vietnam travel knowledge base fallback; a Next.js API route validating trip membership and returning structured suggestion cards; and responsive UI components (floating trigger button, slide-over drawer, suggestion cards, map focus dispatch) matching Tactile Organic Minimalism.

**Tech Stack:** Next.js 16 App Router, TypeScript 5, React 19, Lucide React, Leaflet, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-ai-travel-assistant-design.md`

## Global Constraints

- Palette: Tactile Organic Minimalism (`#184E77`, `#D9ED92`, `#52B69A`, `#1A759F`, `#F4F9EC`).
- Typography: Be Vietnam Pro, clear hierarchy, accessible contrast.
- Icons: Lucide React only (no raw emoji as feature action icons).
- Currency: Formatted via `formatVnd` (`1.250.000 ₫`).
- Resiliency: Zero crashes if `GEMINI_API_KEY` is missing or offline; seamless fallback to Vietnam travel engine.
- Tests: 100% offline passing test coverage via Vitest.

## Review Focus

1. **Empty / unconfigured Gemini API key:** System must seamlessly respond using the local knowledge engine without error.
2. **Missing coordinates on suggestions:** "Xem trên bản đồ" button must be gracefully hidden or disabled if coordinates are absent.
3. **Trip context awareness:** Recommendations should tailor to the trip destination (e.g., Đà Lạt, Sa Pa, Hà Giang) when provided.
4. **Interactive Map synchronization:** Triggering "Xem trên bản đồ" must focus the map and open a popup with the place name.
5. **Authorization:** Non-members must be forbidden from calling the AI assistant endpoint (`403 Forbidden`).

---

### Task 1: AI Assistant Domain Types & Request Validation

**Files:**
- Create: `src/lib/types/ai-assistant.ts`
- Create: `src/lib/validation/ai-assistant.ts`
- Test: `src/lib/validation/ai-assistant.test.ts`

**Steps:**
- [ ] Define `AISuggestionCategory`, `AISuggestionItem`, `AIAssistantMessage`, `AIAssistantRequest`, and `AIAssistantResponse` in `src/lib/types/ai-assistant.ts`.
- [ ] Implement Zod schema `AIAssistantRequestSchema` in `src/lib/validation/ai-assistant.ts` validating non-empty prompt strings (max 500 chars).
- [ ] Write unit tests in `src/lib/validation/ai-assistant.test.ts`.
- [ ] Run `npx vitest run src/lib/validation/ai-assistant.test.ts` and ensure all tests pass.
- [ ] Commit changes: `git commit -m "feat(ai): define ai assistant domain types and zod validation"`.

---

### Task 2: Vietnam Travel Knowledge Base & Intent Classifier

**Files:**
- Create: `src/lib/ai/vietnam-travel-data.ts`
- Create: `src/lib/ai/local-travel-engine.ts`
- Test: `src/lib/ai/local-travel-engine.test.ts`

**Steps:**
- [ ] Build curated Vietnam travel database `VIETNAM_DESTINATIONS_DATA` in `src/lib/ai/vietnam-travel-data.ts` with real coordinates, homestays, coaches (Phương Trang, Thành Bưởi, Sao Việt, v.v.), cuisine, and attractions for popular spots (Đà Lạt, Sa Pa, Hà Giang, Đà Nẵng, Ninh Bình, Phú Quốc, v.v.).
- [ ] Implement `queryLocalTravelEngine(query: string, tripContext?: TripContext)` in `src/lib/ai/local-travel-engine.ts` extracting category intent and matching destination.
- [ ] Write unit tests in `src/lib/ai/local-travel-engine.test.ts` covering homestay queries, bus queries, food queries, and generic fallbacks.
- [ ] Run `npx vitest run src/lib/ai/local-travel-engine.test.ts` and verify all tests pass.
- [ ] Commit changes: `git commit -m "feat(ai): implement local vietnam travel knowledge base and intent engine"`.

---

### Task 3: Google Gemini Client & Unified AI Travel Service

**Files:**
- Create: `src/lib/ai/travel-assistant-service.ts`
- Test: `src/lib/ai/travel-assistant-service.test.ts`

**Steps:**
- [ ] Implement `generateTravelSuggestions(query: string, tripContext?: TripContext)`:
  - Checks for `process.env.GEMINI_API_KEY`.
  - When key is present, calls Google Gemini API with system instructions enforcing structured JSON output conforming to `AIAssistantResponse`.
  - When key is absent or request fails, gracefully delegates to `queryLocalTravelEngine`.
- [ ] Write unit tests in `src/lib/ai/travel-assistant-service.test.ts` mocking Gemini success, Gemini network failure (fallback check), and absence of API key.
- [ ] Run `npx vitest run src/lib/ai/travel-assistant-service.test.ts` and ensure all pass.
- [ ] Commit changes: `git commit -m "feat(ai): add unified travel assistant service with gemini and local fallback"`.

---

### Task 4: AI Assistant API Route (`POST /api/trips/[id]/ai-assistant`)

**Files:**
- Create: `src/app/api/trips/[id]/ai-assistant/route.ts`
- Test: `src/app/api/trips/[id]/ai-assistant/route.test.ts`

**Steps:**
- [ ] Implement Route Handler `POST /api/trips/[id]/ai-assistant`:
  - Enforce `requireTripMembership(tripId, session.user.id)`.
  - Parse request body with `AIAssistantRequestSchema`.
  - Fetch trip details (title, destination, dates, member count) from DB.
  - Call `generateTravelSuggestions` and return 200 OK with `AIAssistantResponse`.
- [ ] Write integration tests in `src/app/api/trips/[id]/ai-assistant/route.test.ts` checking unauthenticated 401, non-member 403, invalid payload 400, and successful response 200.
- [ ] Run `npx vitest run src/app/api/trips/[id]/ai-assistant/route.test.ts` and verify.
- [ ] Commit changes: `git commit -m "feat(api): implement trip ai assistant route handler"`.

---

### Task 5: Suggestion Card & Map Focus Event Synchronization

**Files:**
- Create: `src/components/ai/AISuggestionCard.tsx`
- Modify: `src/components/map/TripLeafletMap.tsx`
- Test: `src/components/ai/AISuggestionCard.test.ts`

**Steps:**
- [ ] Create `AISuggestionCard.tsx` rendering category badge, title, estimated cost in VND, and action buttons ("Xem trên bản đồ", "Thêm vào lịch trình", "Thêm vào chi phí").
- [ ] In `TripLeafletMap.tsx`, add an event listener for `smart-trip:focus-map` to pan/zoom smoothly to target coordinates with a highlight popup.
- [ ] Write unit tests for `AISuggestionCard.test.ts` ensuring action callbacks fire and VND formatting is applied.
- [ ] Run tests and verify.
- [ ] Commit changes: `git commit -m "feat(ui): add ai suggestion card and map focus event synchronization"`.

---

### Task 6: Floating AI Assistant Button & Drawer UI

**Files:**
- Create: `src/components/ai/TripAIAssistantDrawer.tsx`
- Create: `src/components/ai/FloatingAIAssistant.tsx`
- Test: `src/components/ai/FloatingAIAssistant.test.ts`

**Steps:**
- [ ] Build `TripAIAssistantDrawer.tsx` with header, quick prompt chips ("🏡 Gợi ý homestay", "🚌 Tìm nhà xe", "🍜 Ăn uống", "💰 Dự toán chi phí"), chat message list, suggestion card rendering, and input field with submit handler.
- [ ] Build `FloatingAIAssistant.tsx` with floating trigger button in bottom-right corner and state management for opening/closing the drawer.
- [ ] Write unit tests verifying drawer toggle, quick chip click populating input, and message submission.
- [ ] Run tests and verify.
- [ ] Commit changes: `git commit -m "feat(ui): create floating ai assistant button and drawer interface"`.

---

### Task 7: Mount AI Assistant in Trip Workspace & Integrate 1-Click Actions

**Files:**
- Modify: `src/app/(app)/trips/[id]/page.tsx`
- Modify: `src/components/trips/itinerary/trip-itinerary-tab.tsx`
- Modify: `src/components/trips/expenses/trip-expenses-tab.tsx`

**Steps:**
- [ ] Mount `FloatingAIAssistant` inside `src/app/(app)/trips/[id]/page.tsx` passing trip context (id, title, destination).
- [ ] Implement 1-click action handler:
  - "Thêm vào lịch trình": calls itinerary creation API or opens itinerary tab with prefilled values.
  - "Thêm vào chi phí": triggers expense creation or pre-fills expense form.
  - "Xem trên bản đồ": dispatches `smart-trip:focus-map` event.
- [ ] Verify UI and functionality in browser/unit tests.
- [ ] Commit changes: `git commit -m "feat(trips): integrate floating ai assistant into trip overview and tab actions"`.

---

### Task 8: Full Verification, Regression & End-to-End Testing

**Files:**
- Test: All unit and integration test files.

**Steps:**
- [ ] Run full test suite: `npm test` and verify all 84+ test files pass.
- [ ] Run full build: `npm run build` and ensure exit code 0 without any errors.
- [ ] Commit changes: `git commit -m "test(ai): verify full travel assistant integration and regression suites"`.
