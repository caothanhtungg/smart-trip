# Phase 3Y — Staging Environment Preparation & Migration Plan

**Document Version:** 1.0.0  
**Date:** 2026-10-23  
**Status:** Architecture Specification & Operational Plan  
**Production Project Name:** `smart-trip-dev-sg`  
**Production Project Reference:** `fzdaasbckmnndqzqopex` (RESERVED — USER-FACING INFRASTRUCTURE)  
**Target Staging Project:** Separate Supabase Project to be provisioned (Singapore `ap-southeast-1`)  

---

## 1. Executive Summary & Objective

The objective of **Phase 3Y** is to establish a rigorous, architecturally enforced separation between the **Production Supabase project** (`fzdaasbckmnndqzqopex`) and all future development, schema migrations, and mutation smoke testing.

Following the completion of Gates 4A and 4B, the existing Supabase instance (`smart-trip-dev-sg`) has been designated as **Production/User-Facing Infrastructure**. To guarantee that no subsequent automated tests, test user accounts, or exploratory mutations pollute production data, all future test campaigns and active feature work must run against a dedicated, isolated **Staging Supabase Project**.

---

## 2. Environment Variables & Loading Mechanism Analysis

### 2.1. Required Environment Variables
Running Smart Trip requires the following core environment variables:

| Variable Name | Required By | Format / Constraint | Sensitivity | Notes |
| :--- | :--- | :--- | :---: | :--- |
| **`DATABASE_URL`** | Next.js API Routes, Prisma Client | `postgres://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true` | **SECRET** | Connects to Supabase Transaction Connection Pooler (port 6543). Exact URI copied from Dashboard -> Connect -> Transaction Pooler. |
| **`DIRECT_URL`** | Prisma CLI (`prisma.config.ts`), Migrations | `postgres://postgres:[PWD]@db.[REF].supabase.co:5432/postgres` (True Direct) OR `postgres://postgres.[REF]:[PWD]@aws-0-[REGION].pooler.supabase.com:5432/postgres` (Session Pooler) | **SECRET** | Direct port 5432 required for DDL, advisory locks, and migration execution. True Direct requires IPv6 or IPv4 Add-on; on IPv4-only local networks, use Supabase Session Pooler (port 5432, without pgbouncer). Copied from Dashboard -> Connect. |
| **`BETTER_AUTH_SECRET`**| Better Auth Server (`src/lib/auth.ts`) | Min 32 characters, high entropy | **SECRET** | Symmetric secret used to sign session cookies (`smart-trip.session_token`). |
| **`BETTER_AUTH_URL`** | Better Auth Server | `http://localhost:3000` (or staging domain) | Public | Base URL for OAuth redirect URIs and callback verification. |
| **`NEXT_PUBLIC_APP_URL`**| Client Components, Auth Client | `http://localhost:3000` (or staging domain) | Public | Application origin URL exposed to the browser. |
| **`BANK_ENCRYPTION_KEY`**| Crypto Helper (`src/lib/crypto/bank-encryption.ts`) | 64-character hexadecimal (32 bytes / 256-bit) | **SECRET** | AES-256-GCM symmetric key used to encrypt bank account numbers. |
| **`GOOGLE_CLIENT_ID`** | Better Auth Google Provider | `*.apps.googleusercontent.com` | Public/Config | Google OAuth 2.0 Client ID for user login. |
| **`GOOGLE_CLIENT_SECRET`**| Better Auth Google Provider | Alphanumeric secret from Google Cloud | **SECRET** | Google OAuth 2.0 Client Secret. |
| **`DB_POOL_MAX`** | Prisma Client Adapter (`src/lib/db/prisma.ts`) | Integer (1–20) | Config | Connection pool size (default: 10 in Node, 1 in Vercel serverless). |
| **`TRUSTED_CLIENT_IP_HEADER`**| Rate Limiter (`src/lib/api/rate-limit.ts`)| String (`x-forwarded-for`, `x-real-ip`) | Config | Reverse proxy header for client IP extraction. |

### 2.2. Environment Variable Loading Hierarchy & Technical Trap
A critical distinction exists in how Next.js and Prisma CLI load environment variables:

1. **Next.js App Router Loading Order:**
   `process.env` (system) > `.env.local` > `.env.development` > `.env`.
   - **Crucial Fact:** Next.js does **NOT** automatically load `.env.staging`. Creating a file named `.env.staging` will be ignored by `next dev`.
   - `.env.local` takes precedence over `.env` in local development.

2. **Prisma CLI (`prisma.config.ts`) Loading Order:**
   Line 1 of `prisma.config.ts` explicitly executes `import "dotenv/config";`.
   - `dotenv/config` only reads `.env` by default.
   - **The Critical Trap:** If a developer places staging database credentials in `.env.local` while leaving production credentials in `.env`:
     - `next dev` connects to **Staging** (via `.env.local`).
     - BUT `npx prisma migrate` reads `.env` and executes DDL directly against **Production**!

3. **Architectural Safety Standard:**
   - To eliminate this risk, `.env` on local development machines must **always point to Staging**.
   - Production credentials must **never exist in `.env` or any file on local development machines**. Production credentials must be configured solely within the Production hosting provider (e.g., Vercel / AWS) and deployment CI/CD secrets.

---

## 3. Proposed 3-Tier Environment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TIER 1: PRODUCTION ENVIRONMENT                         │
│  - Supabase Project: smart-trip-dev-sg (Reference: fzdaasbckmnndqzqopex)     │
│  - Data: Real end-user accounts, real trips, live financial reconciliations │
│  - Access: Production deployment host ONLY (Vercel / AWS ECS)               │
│  - Rule: ZERO smoke testing, ZERO automated test identities, ZERO ad-hoc DDL│
└─────────────────────────────────────────────────────────────────────────────┘
                                      ▲
                                      │ Isolated by credential boundary
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        TIER 2: STAGING ENVIRONMENT                          │
│  - Supabase Project: smart-trip-staging-sg (NEW PROJECT, Singapore)        │
│  - Reference: [STAGING_PROJECT_REF] (Must NOT equal fzdaasbckmnndqzqopex)    │
│  - Credentials: Completely independent database password & secrets          │
│  - Purpose: Full schema migration rehearsal, Gate 4B mutation testing, QA    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      ▲
                                      │ Local development connects to Staging
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     TIER 3: LOCAL DEVELOPMENT WORKSPACE                     │
│  - Host: localhost:3000 (Next.js App Router 16.4.2)                         │
│  - Configuration: .env configured with Tier 2 (Staging) connection strings │
│  - Unit Tests: Run with in-memory process dummy variables (zero DB dependency)│
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Staging Configuration Template (`.env.example` Update)

`.env.example` has been updated with explicit safety warnings and separate placeholder references:

```ini
# Smart Trip & Expense Planner — Environment Variables Template
# Sao chép file này thành .env hoặc .env.local trên máy cá nhân
# Tuyệt đối KHÔNG commit file .env chứa giá trị thật lên Git

# ---------------- DATABASE (Supabase PostgreSQL) ----------------
# CẢNH BÁO AN TOÀN: Tuyệt đối KHÔNG sử dụng Project Ref của Production (fzdaasbckmnndqzqopex) cho dev/test local.
# Môi trường local và staging PHẢI dùng riêng một Supabase Project độc lập hoàn toàn.
# Lấy chuỗi kết nối chính xác từ: Supabase Dashboard -> Connect -> URI.
#
# 1. DATABASE_URL: Supabase Transaction Pooler (cổng 6543, pgbouncer=true).
#    Dùng cho Next.js runtime API routes và truy vấn thông thường.
DATABASE_URL="postgres://postgres.[STAGING_PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# 2. DIRECT_URL: Dành riêng cho Prisma CLI chạy migrations và DDL (yêu cầu cổng 5432).
#    - Lựa chọn A (True Direct Connection - yêu cầu mạng hỗ trợ IPv6 hoặc Supabase IPv4 Add-on):
#      Lấy từ Dashboard -> Connect -> Direct:
#      DIRECT_URL="postgres://postgres:[PASSWORD]@db.[STAGING_PROJECT_REF].supabase.co:5432/postgres"
#
#    - Lựa chọn B (Thay thế cho mạng nội bộ IPv4-only: Supabase Session Pooler cổng 5432):
#      LƯU Ý: Đây là chế độ Session Pooler, KHÔNG phải True Direct, nhưng hỗ trợ advisory locks cho Prisma Migrate trên IPv4:
#      Lấy từ Dashboard -> Connect -> Session Pooler (port 5432, không có pgbouncer=true):
DIRECT_URL="postgres://postgres.[STAGING_PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# ---------------- XÁC THỰC (Better Auth) ----------------
BETTER_AUTH_SECRET="your-staging-better-auth-secret-min-32-chars"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ---------------- GOOGLE OAUTH ----------------
GOOGLE_CLIENT_ID="your-staging-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-staging-google-client-secret"

# ---------------- BẢO MẬT & MÃ HÓA (Server-Only Secrets) ----------------
BANK_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
```

---

## 5. Staging Database Initialization Sequence

When the user creates the new empty Supabase project for Staging, the schema must be applied in a clean, reproducible manner without copying production data.

### 5.1. Existing Migration Inventory
1. **`0001_release1_schema`:**
   - Creates the `public` schema.
   - Defines 9 core business enums: `TripStatus`, `MemberRole`, `MemberStatus`, `ExpenseCategory`, `SplitMethod`, `SettlementStatus`, `TransferStatus`, `ClaimStatus`, `PaymentMethod`.
   - Creates 16 relational tables with primary keys, foreign keys with `ON DELETE CASCADE` / `RESTRICT`, and composite unique constraints.
2. **`0002_data_api_lockdown`:**
   - Enables Row-Level Security (RLS) on all 16 tables.
   - Revokes table, sequence, and routine privileges from Supabase PostgREST roles (`anon` and `authenticated`), enforcing that all database queries must flow through server-side Prisma using the `postgres` role.
   - Secures the `_prisma_migrations` metadata table.
3. **`0003_add_itinerary_time_fields`:**
   - Adds `start_time TIME(0)` and `end_time TIME(0)` columns to `itinerary_items`.

### 5.2. Planned Migration Execution Steps (To be run by user)
Once the staging project is created and connection strings are obtained:

```powershell
# 1. Verify environment credentials point to Staging (NOT fzdaasbckmnndqzqopex)
# In PowerShell:
if ($env:DIRECT_URL -match "fzdaasbckmnndqzqopex" -or $env:DATABASE_URL -match "fzdaasbckmnndqzqopex") {
    throw "ABORT: Production project reference detected! Halting to protect production."
}

# 2. Deploy all committed migrations sequentially to the empty staging database
npx prisma migrate deploy

# 3. Verify migration status
npx prisma migrate status
```

*Expected Output:* All 3 migrations (`0001`, `0002`, `0003`) applied successfully with zero drift and zero pending migrations.

---

## 6. Controlled Staging Verification Plan & Safety Guard

To prevent any possibility of executing smoke tests against production, the smoke runner and developer test scripts enforce a **Fail-Closed Production Guard**:

### 6.1. Production Guard & Staging Allowlist Implementation (`assertNonProductionDatabase`)
Implemented in `scripts/test-session-helper.ts` and called at the entry of `runSmokeSuite()`, `SmokeManifestManager`, and before any database resolution:

- **Strict Staging Allowlist:** Hardcoded to approved staging project reference `rwvptwjpfhtfkiwboexz`. Test/mutation scripts are strictly locked to this single target.
- **Positive Target Identification:** Extracts Supabase project references from recognized connection formats:
  - Direct host format: `db.<project-ref>.supabase.co`
  - Pooler username format: `postgres.<project-ref>` on recognized pooler host `*.pooler.supabase.com`.
- **Dual-URL Independent Validation:** Independently parses and validates both `DATABASE_URL` and `DIRECT_URL`. Both variables are strictly required for test/mutation scripts.
- **Fail-Closed Target Enforcement:** Execution immediately halts if either URL fails to identify `rwvptwjpfhtfkiwboexz`. Any other Supabase project or arbitrary database URL is rejected.
- **Cross-URL Target Consistency:** Fails closed if `DATABASE_URL` and `DIRECT_URL` target different Supabase project references.
- **Prohibited Production Reference Rejection:** Rejects the known production project reference `fzdaasbckmnndqzqopex` case-insensitively across raw string, decoded URI, parsed components, and extracted project reference.
- **Immune to Env Override:** No caller-provided environment variable can override the hardcoded `APPROVED_STAGING_PROJECT_REF`.
- **Strict Secret Suppression:** All thrown error messages contain purely sanitized static explanations identifying the invalid environment variable name. Raw URIs, usernames, passwords, hostnames, and secrets are never logged or exposed.
- **Strict Pre-Execution Timing:** Executes strictly before manifest initialization, lock acquisition, Prisma dynamic import, and HTTP dispatch.

### 6.2. Staging Verification Checklist
Once Staging is initialized:
- [x] **Project Reference Check:** Confirmed database hostname contains `rwvptwjpfhtfkiwboexz` and does NOT contain `fzdaasbckmnndqzqopex`.
- [x] **Dual-Port Check:** Confirmed port `6543` for connection pooling runtime and port `5432` for direct migration commands.
- [x] **Migration Deployment:** All 3 migrations (`0001`, `0002`, `0003`) deployed successfully via `prisma migrate deploy`.
- [x] **RLS Verification:** All 16 tables have RLS enabled and `anon`/`authenticated` PostgREST access revoked via `0002_data_api_lockdown`.
- [ ] **Test User Creation:** Bootstrap test identities only in Staging using `scripts/test-session-helper.ts`.
- [ ] **Smoke Suite Execution:** Execute Gate 4B smoke runner exclusively targeted at Staging.

---

## 7. Remaining Manual Steps for User in Supabase Dashboard

The following concrete manual actions must be performed by the project owner in the Supabase Management Console:

1. **Log in to Supabase:** Go to [database.new](https://database.new) or [supabase.com/dashboard](https://supabase.com/dashboard).
2. **Create New Project:**
   - **Name:** `smart-trip-staging-sg` (or preferred naming convention).
   - **Database Password:** Generate and securely save a strong database password.
   - **Region:** `AWS Singapore (ap-southeast-1)` (or desired region).
3. **Retrieve Connection Strings:**
   - In Supabase Dashboard, click **Connect** (or navigate to *Project Settings > Database*).
   - Under **Transaction Pooler** (URI mode, port `6543`, `pgbouncer=true`):
     - Copy the exact URI -> This is your Staging `DATABASE_URL`.
   - Under **Direct Connection** or **Session Pooler** (port `5432`):
     - If your local network/ISP supports IPv6 (or you have the IPv4 Add-on), copy the **Direct** connection URI (port `5432` to `db.[REF].supabase.co`).
     - If on an IPv4-only local network without the add-on, copy the **Session Pooler** connection URI (port `5432` to `pooler.supabase.com`, without `pgbouncer=true`).
     - This is your Staging `DIRECT_URL`.
4. **Configure Local Development:**
   - In `C:\Users\admin\Downloads\doanweb\.env`, replace the connection strings with the new Staging URIs (including the staging database password).
5. **Initialize Database Schema:**
   - Open a terminal in the project directory and run:
     ```powershell
     npx prisma migrate deploy
     ```
6. **Configure Google OAuth for Staging (Optional/Recommended):**
   - In Google Cloud Console, add `http://localhost:3000/api/auth/callback/google` to Authorized redirect URIs under Staging OAuth credentials.

*(End of Plan. Next phase will commence only after Staging is provisioned and confirmed by user).*
