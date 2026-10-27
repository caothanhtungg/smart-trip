# On-The-Road Roadside & Remaining Distance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provide an on-the-road travel companion widget calculating remaining distance and travel time to the next stop based on user GPS, and searching/displaying nearby gas stations and vehicle repair/rescue shops on the interactive map.

**Architecture:** Domain types and geodistance formatters (`roadside-format.ts`); a geospatial search service (`roadside-service.ts`) querying a curated Vietnam road POI dataset; UI components (`RoadsidePoiCard.tsx`, `RoadsidePoiList.tsx`) and enhanced `TripLeafletMap.tsx` with dedicated POI markers; integrated into `TripLiveMapWidget.tsx`.

**Tech Stack:** Next.js 16 App Router, TypeScript 5, React 19, Leaflet, Lucide React, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-27-gps-gas-repair-distance-design.md`

## Global Constraints

- Palette: Tactile Organic Minimalism (`#184E77`, `#52B69A`, `#D9ED92`, `#D97706`).
- Typography: Be Vietnam Pro, clear readability.
- Icons: Lucide React only (`Fuel`, `Wrench`, `Navigation`, `Clock`, `Phone`, `ExternalLink`).
- Zero paid API fees: All calculations local/open; direct Google/Apple maps linking for navigation.
- 100% offline passing test coverage via Vitest.

## Review Focus

1. **GPS denied / unavailable:** Fallback gracefully to showing distance from the first itinerary stop, with a clear user prompt to enable GPS.
2. **Distance units:** Distances < 1 km displayed in meters (e.g. `750 m`), >= 1 km in kilometers (e.g. `3.4 km`).
3. **Empty itinerary stops:** Safe fallback when trip has no scheduled stops today.
4. **Phone numbers for emergency rescue:** Direct clickable `tel:` links formatted for mobile ease.
5. **Map marker discrimination:** Gas stations (amber `#D97706`) and repair shops (teal `#1A759F`) clearly distinguished from itinerary stops.

---

### Task 1: Roadside Domain Types & Distance/Time Formatter

**Files:**
- Create: `src/lib/types/roadside.ts`
- Create: `src/lib/geo/roadside-format.ts`
- Test: `src/lib/geo/roadside-format.test.ts`

**Steps:**
- [ ] Define `RoadsidePoiType`, `RoadsidePoi`, `NavigationStatus` in `src/lib/types/roadside.ts`.
- [ ] Implement `formatDistance(distanceKm: number)` and `estimateTravelTimeMinutes(distanceKm: number, speedKmH?: number)` in `src/lib/geo/roadside-format.ts`.
- [ ] Write unit tests in `src/lib/geo/roadside-format.test.ts`.
- [ ] Run `npx vitest run src/lib/geo/roadside-format.test.ts` and verify.
- [ ] Commit changes: `git commit -m "feat(geo): add roadside types and distance formatters"`.

---

### Task 2: Curated Roadside POI Network & Geospatial Search Service

**Files:**
- Create: `src/lib/geo/roadside-data.ts`
- Create: `src/lib/geo/roadside-service.ts`
- Test: `src/lib/geo/roadside-service.test.ts`

**Steps:**
- [ ] Build `VIETNAM_ROADSIDE_POIS` in `src/lib/geo/roadside-data.ts` covering major routes and destinations (Petrolimex, PVOIL, repair shops, rescue contacts with coordinates).
- [ ] Implement `findNearbyRoadsidePois(userLat, userLng, type?, maxRadiusKm?, limit?)` and `calculateNavigationStatus(userLocation, itineraryItems)` in `src/lib/geo/roadside-service.ts`.
- [ ] Write unit tests in `src/lib/geo/roadside-service.test.ts` verifying sorting by distance, filtering by type, and navigation status computation.
- [ ] Run `npx vitest run src/lib/geo/roadside-service.test.ts` and verify.
- [ ] Commit changes: `git commit -m "feat(geo): implement roadside poi database and geospatial search service"`.

---

### Task 3: Roadside POI Card & Filter Tabs Component

**Files:**
- Create: `src/components/trips/detail/RoadsidePoiCard.tsx`
- Create: `src/components/trips/detail/RoadsidePoiList.tsx`
- Test: `src/components/trips/detail/RoadsidePoiCard.test.ts`

**Steps:**
- [ ] Create `RoadsidePoiCard.tsx` rendering POI type badge (`Fuel` / `Wrench`), distance tag, address, hotline button, map focus button, and external directions link.
- [ ] Create `RoadsidePoiList.tsx` with filter tabs ("Tất cả", "Cây xăng", "Tiệm sửa xe") and responsive list.
- [ ] Write unit tests in `src/components/trips/detail/RoadsidePoiCard.test.ts`.
- [ ] Run tests and verify.
- [ ] Commit changes: `git commit -m "feat(ui): add roadside poi card and filter tabs components"`.

---

### Task 4: Interactive POI Markers on Leaflet Map

**Files:**
- Modify: `src/components/map/TripLeafletMap.tsx`

**Steps:**
- [ ] Extend `TripLeafletMapProps` with optional `roadsidePois?: RoadsidePoi[]`.
- [ ] Render distinct custom markers for gas stations (`#D97706`) and repair shops (`#1A759F`) with informative popups (name, address, distance, hotline).
- [ ] Test in test runner.
- [ ] Commit changes: `git commit -m "feat(map): render roadside gas stations and repair shops on leaflet map"`.

---

### Task 5: On-The-Road Navigation HUD in TripLiveMapWidget

**Files:**
- Modify: `src/components/trips/detail/trip-live-map-widget.tsx`
- Test: `src/components/trips/detail/trip-live-map-widget.test.ts`

**Steps:**
- [ ] In `TripLiveMapWidget.tsx`, calculate navigation status to the next stop using `calculateNavigationStatus`.
- [ ] Add On-The-Road HUD bar showing remaining distance, estimated travel time, and next stop title.
- [ ] Add collapsible/toggleable "Tiện ích dọc đường (Cây xăng & Sửa xe)" drawer/section.
- [ ] Pass `roadsidePois` to `InteractiveMap`.
- [ ] Write tests in `src/components/trips/detail/trip-live-map-widget.test.ts`.
- [ ] Run tests and verify.
- [ ] Commit changes: `git commit -m "feat(trips): integrate on-the-road navigation hud and roadside pois into live map widget"`.

---

### Task 6: End-to-End Verification & Full Regression Testing

**Files:**
- Test: Full project test suite.

**Steps:**
- [ ] Run `npm test` and verify 90+ test files pass 100%.
- [ ] Run `npm run build` and verify clean production build.
- [ ] Commit changes: `git commit -m "test(trips): verify on-the-road navigation and roadside poi regressions"`.
