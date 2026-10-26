# Phase 3T — Environment Isolation & Test Data Inventory

**Document Version:** 1.0.0  
**Audit Date:** 2026-10-23  
**Audit Scope:** Static, read-only audit of environment configurations, historical smoke-test artifacts, and automated test command classification for Smart Trip.  
**Execution Status:** Read-only analysis complete; zero tests executed; zero database queries dispatched; zero mutations performed.

---

## 1. Environment Configuration Audit & Findings

### 1.1. Confirmed Facts Established by Repository Artifacts
A static review of repository templates ([.env.example](file:///C:/Users/admin/Downloads/doanweb/.env.example)), architectural documentation ([PROJECT_CONTEXT.md](file:///C:/Users/admin/Downloads/doanweb/PROJECT_CONTEXT.md), [docs/ENGINEERING_STANDARDS.md](file:///C:/Users/admin/Downloads/doanweb/docs/ENGINEERING_STANDARDS.md), [docs/phase-3-backend-plan.md](file:///C:/Users/admin/Downloads/doanweb/docs/phase-3-backend-plan.md)), and Prisma configuration ([prisma/schema.prisma](file:///C:/Users/admin/Downloads/doanweb/prisma/schema.prisma)) establishes the following factual characteristics:

1. **Database Provider & Cloud Host:**
   - Provider: Supabase Managed PostgreSQL.
   - Cloud Region: AWS Singapore (`ap-southeast-1`).
   - Pooler Domain: `aws-0-ap-southeast-1.pooler.supabase.com`.
2. **Dual-Port Connection Architecture:**
   - **Runtime Traffic (`DATABASE_URL`):** Port `6543` connecting via Supabase Transaction Connection Pooler (`pgbouncer=true`). Designed for serverless Next.js route handlers.
   - **Migration & Direct Traffic (`DIRECT_URL`):** Port `5432` connecting directly to PostgreSQL for Prisma CLI schema migrations (`prisma migrate`).
3. **Application Secrets Architecture:**
   - **`BETTER_AUTH_SECRET`:** Server-only secret (minimum 32 characters) used to sign and verify session cookies (`smart-trip.session_token`).
   - **`BANK_ENCRYPTION_KEY`:** Server-only 32-byte (256-bit) symmetric key in 64-character hexadecimal format used for AES-256-GCM encryption of sensitive bank account numbers.
   - **`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`:** OAuth 2.0 credentials for user authentication.

### 1.2. Unresolved Environment Questions & Ambiguities
The repository documentation establishes that real Supabase PostgreSQL is used, but **cannot authoritatively determine the environment classification of the configured database**:

1. **No Documented Multi-Environment Hierarchy:**
   - The repository contains no branch-specific environment configuration files (e.g., `.env.staging`, `.env.production`).
   - There are no Infrastructure-as-Code definitions (Terraform, Pulumi, CloudFormation, or Docker Compose) defining environment boundaries.
2. **Unknown Project Tier:**
   - It cannot be determined from repository files whether the database configured in local developer `.env` represents a **dedicated development sandbox**, a **shared staging environment**, or an **active production database**.
   - Region (`ap-southeast-1`) and hostnames (`pooler.supabase.com`) are standard Supabase endpoints and do not distinguish production from non-production.
3. **Mandatory Manual Verification Required:**
   - **Explicit Finding:** Confirmation of the environment tier **strictly requires manual inspection within the Supabase Management Console** (under *Project Settings > General / Infrastructure / Environment*).
   - Until verified, developer operations must treat the database as potentially containing business or sensitive data, forbidding destructive migrations or arbitrary cleanup.

---

## 2. Comprehensive Test Data Inventory (Gate 4A & 4B Evidence)

This inventory lists all persistent entities created during the Gate 4A (`0883d2f9-...`), Gate 4B parent (`dfaf7ff8-...`), and Gate 4B continuation (`f2ac32e7-...`) test runs. 

> [!IMPORTANT]
> **Distinction Between Recorded Evidence vs. Live State:**  
> The entries below reflect **explicitly recorded responses in immutable run manifests and write-ahead event logs**. They establish what the application returned at the time of execution. They do not represent a real-time live database query.

### 2.1. Test Identities & Authentication Sessions
*Recorded in [0883d2f9-941c-4d13-be1b-b7fdc8759588/manifest.json](file:///C:/Users/admin/Downloads/doanweb/.smoke-runs/0883d2f9-941c-4d13-be1b-b7fdc8759588/manifest.json) and reused across Gate 4B:*

| Entity | ID / Value Recorded in Evidence | Evidence Source |
| :--- | :--- | :--- |
| **Host User A ID** | `4b9c4564-9f38-48d9-baff-3de7e1723a64` | Gate 4A Manifest line 10 |
| **Host User A Email** | `smoke-host-0883d2f9-941c-4d13-be1b-b7fdc8759588@test.local` | Gate 4A Manifest line 11 |
| **Session A ID** | `ed594d21-93b0-4eb7-932e-0d52280ef569` | Gate 4A Manifest line 12 |
| **Member User B ID** | `893af83c-1f12-4e73-b672-0f029a42e288` | Gate 4A Manifest line 14 |
| **Member User B Email** | `smoke-member-0883d2f9-941c-4d13-be1b-b7fdc8759588@test.local` | Gate 4A Manifest line 15 |
| **Session B ID** | `12154a80-e225-48dd-9840-cc9eeffafd3b` | Gate 4A Manifest line 16 |
| **Session Expiration** | `2026-10-30T03:28:56.388Z` | Gate 4B Continuation Manifest line 26 |

### 2.2. Trip & Invitation Credentials
*Recorded in `SMK-TRIP-02` (Seq 5):*
- **Trip ID:** `80ca42e2-383a-427d-a478-38f02e6fdbb8`
- **Invite Code:** `N3997B-HMZ3WP`
- **Trip Destination:** "Hà Giang - Mùa Hoa Tam Giác Mạch"

### 2.3. Trip Membership Records
*Recorded across `SMK-TRIP-02`, `SMK-MEMB-02`, `SMK-MEMB-05`, `SMK-MEMB-07`, and `RECON-MEMBERS`:*
- **Host Member ID (User A):** `31c8ce08-e131-4caa-b67f-1fa00df978ff`  
  *Status:* `ACTIVE`, Role: `HOST`.
- **Member ID (User B):** `4fe2506d-29c1-479b-be6a-302c003757c6`  
  *Status Lifecycle:* Created as `ACTIVE` (Seq 11) -> Soft-deleted to `LEFT` (Seq 22) -> Reactivated to `ACTIVE` with same ID (Seq 24).
- **Guest Member ID:** `f77b5a46-722c-4af3-91fc-7fe5baa25b26`  
  *Status:* Created as `ACTIVE` guest member (Seq 14, `userId: null`).

### 2.4. Itinerary Items
- **Itinerary Item 1 ID:** `1530a662-c7f6-466b-96a8-6ac03bb2b421`  
  *Status in Evidence:* **DELETED** via `SMK-ITIN-04` (Seq 20, HTTP 200). Historical artifact; no longer present in active collection.
- **Itinerary Item 2 ID:** `93409a82-cbd8-4723-9afa-c7c3a5b985d1`  
  *Status in Evidence:* **ACTIVE / PRESERVED** via `OP-PREREQ-ITIN-USER-B` (Seq 21, HTTP 201). Created by Member User B to test soft-deletion referential integrity.

### 2.5. Expense Records
- **Expense 1 ID:** `1b456918-8981-4e57-8d57-8863f7a8acf1`  
  *Status in Evidence:* **ACTIVE / PERSISTED**. Created in `SMK-EXPN-01` (Seq 25, HTTP 201), verified in collection `SMK-EXPN-03` (Seq 27), and metadata-updated in `SMK-EXPN-04` (Seq 28).

### 2.6. Settlements & Financial Debt Transfers
- **Settlement 1 (Initial / Reopened):**
  - **Settlement 1 ID:** `58620724-43fb-4ddd-a7e7-8f1f1977841f` (created in Seq 34, verified in `RECON-SETL-02`).
  - **Transfer 1 ID:** `250c5846-3ce7-4ef5-99d5-b634582f0694`.
  - *Final Lifecycle State in Evidence:* **CANCELLED / REOPENED**. Reopened via `SMK-SETL-04` (Seq 37, HTTP 200), transitioning trip back to `ACTIVE`.
- **Settlement 2 (Second Lock & Final Settlement):**
  - **Settlement 2 ID:** `448b4257-daea-46ab-b037-4592f11bed0f` (created in `SMK-SETL-05`, Seq 38, HTTP 201).
  - **Transfer 2 ID:** `b3d29d06-9524-45ed-aff0-ebd9e002f208`.
  - *Transfer Status:* Marked `PAID` by Debtor User B (`SMK-SETL-06`, Seq 39) -> Confirmed by Creditor Host User A (`SMK-SECR-02`, Seq 41).
  - *Trip Final State:* Returned as `COMPLETED` in `SMK-SECR-02` confirmation response.

### 2.7. Failure & Bypass Evidence
- **`SMK-SETL-02` Historical Failure:** Recorded in parent manifest line 608 (`state: "FAILED"`, `error: "Assertion failed (HTTP 201)"`) and preserved in continuation manifest line 625.
- **`RECON-SETL-02` Reconciliation Record:** Recorded in continuation manifest lines 829–839 (`httpStatus: 200`, latency 1211ms, verifying settlement `58620724-...`).
- **`SMK-CTRL-03` Safety Bypass Record:** Recorded in continuation manifest line 793 (`state: "BLOCKED_SPECIAL_SETUP"`, zero latency, zero wire dispatch).

---

## 3. Classification of Automated Test Commands

A static audit of [package.json](file:///C:/Users/admin/Downloads/doanweb/package.json), [vitest.config.mts](file:///C:/Users/admin/Downloads/doanweb/vitest.config.mts), and test files in `src/` classifies available commands based on execution risk and environment dependency:

### 3.1. Category A: Pure In-Memory Isolated Unit Tests (Zero Database Risk)
*Commands that run purely algorithmic, mathematical, or schema validation logic in memory with no database, network, or environment variable dependencies:*

- **Targeted Command Pattern:** `npx vitest run <file-path>`
- **Safe Test Suites:**
  - `src/lib/money/split.test.ts` (Split calculations)
  - `src/lib/money/format.test.ts` (VND currency formatting)
  - `src/lib/money/parse.test.ts` (Monetary input parsing)
  - `src/lib/money/budget.test.ts` (Budget thresholds and progress)
  - `src/lib/money/settlement.test.ts` (Greedy min-cash-flow algorithm)
  - `src/lib/money/simplify.test.ts` (Debt simplification)
  - `src/lib/itinerary/date.test.ts` (Date formatting & day indexing)
  - `src/lib/itinerary/validation.test.ts` (Itinerary form validation)
  - `src/lib/crypto/bank-encryption.test.ts` (AES-256-GCM encryption/decryption)
  - `src/lib/validation/expense-api.test.ts`, `expense.test.ts`, `itemized-expense.test.ts`
  - `src/lib/validation/itinerary.test.ts`
  - `src/lib/validation/settlement-api.test.ts`
  - `src/lib/trip-form-validation.test.ts`
  - `src/lib/utils.test.ts`
  - `src/lib/trips/invite-code.test.ts`
  - `src/lib/trips/invite-preview.test.ts`
  - `src/lib/trips/filter-sort.test.ts`
  - `src/lib/trips/balance.test.ts`
  - `src/lib/user/validation.test.ts`
  - `src/lib/members/validation.test.ts`
- **Safety Rating:** **100% ISOLATED.** Safe to execute on developer machines and CI without internet or database credentials.

### 3.2. Category B: Mocked Route & Service Tests (Mocked Prisma & Auth)
*Commands testing Next.js API route handlers and service adapters where database and auth dependencies are mocked:*

- **Targeted Test Suites:**
  - `src/app/api/**/route.test.ts` (14 API route tests)
  - `src/lib/api/rate-limit.test.ts`
  - `src/lib/api/auth-guard.test.ts`
  - `src/lib/api/expense-db-errors.test.ts`
  - `src/lib/api/settlement-db-errors.test.ts`
  - `src/lib/auth/session.test.ts`
  - `src/lib/services/*-api.test.ts`
- **Analysis:** All 14 route tests explicitly declare `vi.mock("@/lib/db/prisma")` and `vi.mock("@/lib/auth/session")`. However, executing them relies on Vitest mock hoisting.
- **Safety Rating:** **ISOLATED UNDER PROPER MOCKING.** To guarantee zero network leakage, execute with `DATABASE_URL` unset or set to a dummy string (`postgres://dummy:dummy@localhost:5432/dummy`).

### 3.3. Category C: Component & Store Integration Tests
*Commands testing React components and store contexts using mocked browser APIs and mock data:*

- **Targeted Test Suites:**
  - `src/components/trips/detail/trip-detail-integration.test.ts`
  - `src/components/trips/expenses/trip-expenses-integration.test.ts`
  - `src/components/trips/invite/trip-join-flow.test.ts`
  - `src/components/trips/itinerary/trip-itinerary-integration.test.ts`
  - `src/components/trips/members/trip-members-integration.test.ts`
  - `src/components/trips/settlement/trip-settlement-integration.test.ts`
  - `src/lib/trips/trips-integration.test.ts`
  - `src/lib/trips/trips-store-context.test.ts`
- **Safety Rating:** **ISOLATED.** Tests use mock datasets (`MOCK_TRIPS`) and mocked API clients.

### 3.4. Category D: Live Mutating Scripts & Database Migration Commands
*Commands that perform real network requests or database mutations:*

| Command | Action & Risk | Authorization Level |
| :--- | :--- | :--- |
| `npx tsx scripts/smoke-runner.ts` | Dispatches live HTTP calls to localhost:3000, creating/modifying records in Supabase. | **STRICTLY REQUIRES GATE 4 AUTHORIZATION.** |
| `scripts/test-session-helper.ts` | Direct Prisma connection inserting test users/sessions. | **HIGH RISK / RESTRICTED.** |
| `npx prisma db push` | Pushes schema changes directly to Supabase without migration history. | **CRITICAL RISK / FORBIDDEN IN PROD.** |
| `npx prisma migrate dev` | Generates and applies migrations. Mutates database schema on port 5432. | **HIGH RISK / DEV-ONLY.** |
| `npx prisma migrate deploy` | Applies pending migrations in production. | **PRODUCTION RELEASE RUNBOOK ONLY.** |

### 3.5. Category E: Blanket Command Risk (`npm test` / `npm run test`)
- In `package.json`, `"test": "vitest run"`.
- This runs **all 59 test files simultaneously**.
- **Risk Assessment:** While individual test files contain mocks, a blanket test run imports the entire application tree. If any file has an un-mocked Prisma import or a side-effect on import, it could attempt network access.
- **Recommendation:** Do not run `npm test` blindly until environment credentials have been confirmed and isolated.

---

## 4. Remediation Plan & Prioritized Roadmap

To establish complete environment isolation and prepare Smart Trip for release, follow this sequential 5-step roadmap:

```
[Phase 1] Dashboard Verification & Classification (Manual)
    └── Inspect Supabase Console -> Determine tier (Dev vs Prod).

[Phase 2] Environment Separation (Infrastructure)
    └── If current instance is Production -> Provision separate Staging Supabase project.

[Phase 3] Test Data Lifecycle & Sanitization (Data Governance)
    └── Catalog test entities -> Plan soft-archival or purge after environment separation.

[Phase 4] Tiered Automated Testing Protocol (Quality Assurance)
    ├── Run Category A (Pure Unit) -> 100% pass.
    ├── Run Category B & C (Mocked Unit & Integration) with dummy DATABASE_URL.
    └── Run Smoke Runner (Category D) strictly against dedicated Staging instance.

[Phase 5] Release Readiness & Secret Management (Release Engineering)
    ├── Verify Automated Backups & PITR in Supabase.
    ├── Rotate production secrets (BETTER_AUTH_SECRET, BANK_ENCRYPTION_KEY).
    └── Execute production build (`npm run build`) in CI.
```

### Prioritized Remediation Steps:
1. **Step 1: Manual Supabase Environment Confirmation:**
   - Log into Supabase Dashboard. Navigate to *Project Settings > General*.
   - Check Project Name, Reference ID, and Billing Tier.
   - Authoritatively classify whether this database is Production, Staging, or Dev.
2. **Step 2: Provision Staging Environment:**
   - If the current instance is Production, immediately provision a separate Staging Supabase project in AWS Singapore (`ap-southeast-1`).
   - Run `prisma migrate deploy` against Staging.
3. **Step 3: Test Data Management:**
   - The test records cataloged in Section 2 (`smoke-host-*`, `smoke-member-*`, Trip `80ca42e2-...`) must **not be deleted** until the environment tier is verified.
   - If the instance is confirmed as a disposable dev/test instance, records can remain for debugging or be systematically purged via an approved script.
   - If the instance is Production, an approved, transaction-safe cleanup script must be executed to remove smoke data before public onboarding.
4. **Step 4: Tiered Test Execution:**
   - Run isolated unit tests first (`Category A`).
   - Run mocked tests (`Category B & C`) in CI without database credentials.
   - Reserve live smoke runner (`Category D`) exclusively for Staging deployments.

---

## 5. Explicit Non-Executed Checks

In accordance with strict Phase 3T safety instructions, the following operations were **deliberately NOT performed**:
- **NO Database Connection:** No SQL queries, Prisma queries, or Supabase API calls were initiated.
- **NO HTTP Calls:** No requests were dispatched to `localhost:3000` or external services.
- **NO Test Execution:** Neither `npm test`, `vitest run`, nor `scripts/smoke-runner.ts` were executed.
- **NO Secret Inspection:** `.env` values, actual database passwords, Better Auth secrets, and encryption keys were neither read nor displayed.
- **NO Code or Git Modifications:** No files were changed, staged, committed, or deleted.
