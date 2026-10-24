-- DRAFT ONLY: not executed against any database.
-- ============================================================
-- Smart Trip & Expense Planner - Initial Migration (Release 1)
-- Matches Prisma Schema (16 models, 9 enums) + Custom Constraints
-- ============================================================

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('ACTIVE', 'SETTLING', 'COMPLETED', 'ARCHIVED');
CREATE TYPE "MemberRole" AS ENUM ('HOST', 'MEMBER');
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'LEFT');
CREATE TYPE "ExpenseCategory" AS ENUM ('FOOD', 'TRANSPORT', 'LODGING', 'TICKET', 'SHOPPING', 'OTHER');
CREATE TYPE "SplitMethod" AS ENUM ('EQUAL', 'ITEMIZED');
CREATE TYPE "SettlementStatus" AS ENUM ('ACTIVE', 'CANCELLED');
CREATE TYPE "TransferStatus" AS ENUM ('UNPAID', 'PAID', 'COMPLETED');
CREATE TYPE "ClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'CASH');

-- CreateTable: users
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(100),
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "bank_bin" VARCHAR(10),
    "bank_account_no" VARCHAR(255),
    "bank_account_name" VARCHAR(100),
    "bank_account_key_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: accounts
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "access_token_expires_at" TIMESTAMPTZ(6),
    "refresh_token_expires_at" TIMESTAMPTZ(6),
    "scope" TEXT,
    "password" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: sessions
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: verifications
CREATE TABLE "verifications" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable: trips
CREATE TABLE "trips" (
    "id" UUID NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "destination" VARCHAR(150),
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "budget_amount" INTEGER,
    "status" "TripStatus" NOT NULL DEFAULT 'ACTIVE',
    "invite_code" VARCHAR(13) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "trips_pkey" PRIMARY KEY ("id")
);

-- CreateTable: trip_members
CREATE TABLE "trip_members" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "user_id" UUID,
    "display_name" VARCHAR(100) NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "status" "MemberStatus" NOT NULL DEFAULT 'ACTIVE',
    "join_order" INTEGER NOT NULL,
    "joined_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMPTZ(6),
    "bank_bin" VARCHAR(10),
    "bank_account_no" VARCHAR(255),
    "bank_account_name" VARCHAR(100),
    "bank_account_key_version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "trip_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable: member_claims
CREATE TABLE "member_claims" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "placeholder_member_id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decided_at" TIMESTAMPTZ(6),
    "decided_by_member_id" UUID,

    CONSTRAINT "member_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable: bank_claim_snapshots
CREATE TABLE "bank_claim_snapshots" (
    "id" UUID NOT NULL,
    "claim_id" UUID NOT NULL,
    "placeholder_member_id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bank_bin" VARCHAR(10),
    "bank_account_no_ciphertext" VARCHAR(255) NOT NULL,
    "bank_account_name" VARCHAR(100),
    "key_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_claim_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable: itinerary_items
CREATE TABLE "itinerary_items" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "day_date" DATE NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "place_name" VARCHAR(200) NOT NULL,
    "address" TEXT,
    "note" TEXT,
    "created_by_member_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "itinerary_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: expenses
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "itinerary_item_id" UUID,
    "title" VARCHAR(200) NOT NULL,
    "amount" INTEGER NOT NULL,
    "surcharge_amount" INTEGER NOT NULL DEFAULT 0,
    "category" "ExpenseCategory" NOT NULL DEFAULT 'OTHER',
    "paid_by_member_id" UUID NOT NULL,
    "created_by_member_id" UUID NOT NULL,
    "split_method" "SplitMethod" NOT NULL DEFAULT 'EQUAL',
    "spent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receipt_image_url" TEXT,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable: expense_shares
CREATE TABLE "expense_shares" (
    "id" UUID NOT NULL,
    "expense_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "expense_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable: expense_items
CREATE TABLE "expense_items" (
    "id" UUID NOT NULL,
    "expense_id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "expense_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable: expense_item_members
CREATE TABLE "expense_item_members" (
    "item_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,

    CONSTRAINT "expense_item_members_pkey" PRIMARY KEY ("item_id","member_id")
);

-- CreateTable: settlements
CREATE TABLE "settlements" (
    "id" UUID NOT NULL,
    "trip_id" UUID NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_by_member_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMPTZ(6),

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable: settlement_transfers
CREATE TABLE "settlement_transfers" (
    "id" UUID NOT NULL,
    "settlement_id" UUID NOT NULL,
    "from_member_id" UUID NOT NULL,
    "to_member_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "status" "TransferStatus" NOT NULL DEFAULT 'UNPAID',
    "payment_method" "PaymentMethod",
    "paid_at" TIMESTAMPTZ(6),
    "paid_marked_by_member_id" UUID,
    "completed_at" TIMESTAMPTZ(6),
    "completed_by_member_id" UUID,

    CONSTRAINT "settlement_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable: rate_limits
CREATE TABLE "rate_limits" (
    "key" VARCHAR(255) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "reset_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("key")
);

-- ------------------------------------------------------------
-- Standard Unique Constraints & Indexes
-- ------------------------------------------------------------
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");
CREATE UNIQUE INDEX "trips_invite_code_key" ON "trips"("invite_code");
CREATE UNIQUE INDEX "trip_members_trip_id_user_id_key" ON "trip_members"("trip_id", "user_id");
CREATE UNIQUE INDEX "trip_members_trip_id_display_name_key" ON "trip_members"("trip_id", "display_name");
CREATE UNIQUE INDEX "trip_members_trip_id_join_order_key" ON "trip_members"("trip_id", "join_order");
CREATE INDEX "member_claims_placeholder_member_id_idx" ON "member_claims"("placeholder_member_id");
CREATE INDEX "member_claims_trip_id_userId_idx" ON "member_claims"("trip_id", "userId");
CREATE UNIQUE INDEX "bank_claim_snapshots_claim_id_key" ON "bank_claim_snapshots"("claim_id");
CREATE INDEX "bank_claim_snapshots_placeholder_member_id_idx" ON "bank_claim_snapshots"("placeholder_member_id");
CREATE INDEX "bank_claim_snapshots_userId_idx" ON "bank_claim_snapshots"("userId");
CREATE INDEX "itinerary_items_trip_id_day_date_sort_order_idx" ON "itinerary_items"("trip_id", "day_date", "sort_order");
CREATE INDEX "expenses_trip_id_spent_at_idx" ON "expenses"("trip_id", "spent_at");
CREATE UNIQUE INDEX "expense_shares_expense_id_member_id_key" ON "expense_shares"("expense_id", "member_id");
CREATE INDEX "expense_items_expense_id_idx" ON "expense_items"("expense_id");
CREATE INDEX "settlements_trip_id_idx" ON "settlements"("trip_id");
CREATE INDEX "settlement_transfers_settlement_id_idx" ON "settlement_transfers"("settlement_id");
CREATE INDEX "settlement_transfers_from_member_id_idx" ON "settlement_transfers"("from_member_id");
CREATE INDEX "settlement_transfers_to_member_id_idx" ON "settlement_transfers"("to_member_id");
CREATE INDEX "rate_limits_reset_at_idx" ON "rate_limits"("reset_at");

-- ------------------------------------------------------------
-- Foreign Key Constraints
-- ------------------------------------------------------------
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "trip_members" ADD CONSTRAINT "trip_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "member_claims" ADD CONSTRAINT "member_claims_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_claims" ADD CONSTRAINT "member_claims_placeholder_member_id_fkey" FOREIGN KEY ("placeholder_member_id") REFERENCES "trip_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "member_claims" ADD CONSTRAINT "member_claims_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "member_claims" ADD CONSTRAINT "member_claims_decided_by_member_id_fkey" FOREIGN KEY ("decided_by_member_id") REFERENCES "trip_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bank_claim_snapshots" ADD CONSTRAINT "bank_claim_snapshots_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "member_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "bank_claim_snapshots" ADD CONSTRAINT "bank_claim_snapshots_placeholder_member_id_fkey" FOREIGN KEY ("placeholder_member_id") REFERENCES "trip_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "bank_claim_snapshots" ADD CONSTRAINT "bank_claim_snapshots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "trip_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_itinerary_item_id_fkey" FOREIGN KEY ("itinerary_item_id") REFERENCES "itinerary_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paid_by_member_id_fkey" FOREIGN KEY ("paid_by_member_id") REFERENCES "trip_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "trip_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "trip_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expense_item_members" ADD CONSTRAINT "expense_item_members_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "expense_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "expense_item_members" ADD CONSTRAINT "expense_item_members_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "trip_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_created_by_member_id_fkey" FOREIGN KEY ("created_by_member_id") REFERENCES "trip_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlement_transfers" ADD CONSTRAINT "settlement_transfers_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "settlement_transfers" ADD CONSTRAINT "settlement_transfers_from_member_id_fkey" FOREIGN KEY ("from_member_id") REFERENCES "trip_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlement_transfers" ADD CONSTRAINT "settlement_transfers_to_member_id_fkey" FOREIGN KEY ("to_member_id") REFERENCES "trip_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlement_transfers" ADD CONSTRAINT "settlement_transfers_paid_marked_by_member_id_fkey" FOREIGN KEY ("paid_marked_by_member_id") REFERENCES "trip_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "settlement_transfers" ADD CONSTRAINT "settlement_transfers_completed_by_member_id_fkey" FOREIGN KEY ("completed_by_member_id") REFERENCES "trip_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ------------------------------------------------------------
-- Custom Partial Unique Indexes
-- ------------------------------------------------------------
CREATE UNIQUE INDEX "one_host_per_trip" ON "trip_members"("trip_id") WHERE "role" = 'HOST';
CREATE UNIQUE INDEX "one_pending_claim" ON "member_claims"("trip_id", "userId") WHERE "status" = 'PENDING';
CREATE UNIQUE INDEX "one_active_settlement" ON "settlements"("trip_id") WHERE "status" = 'ACTIVE';

-- ------------------------------------------------------------
-- Custom CHECK Constraints
-- ------------------------------------------------------------
ALTER TABLE "trips" ADD CONSTRAINT "trips_end_date_gte_start_date" CHECK ("end_date" >= "start_date");
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_surcharge_amount_non_negative" CHECK ("surcharge_amount" >= 0);
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_amount_non_negative" CHECK ("amount" >= 0);
ALTER TABLE "expense_items" ADD CONSTRAINT "expense_items_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "settlement_transfers" ADD CONSTRAINT "settlement_transfers_amount_positive" CHECK ("amount" > 0);
ALTER TABLE "settlement_transfers" ADD CONSTRAINT "settlement_transfers_distinct_members" CHECK ("from_member_id" <> "to_member_id");

-- ------------------------------------------------------------
-- Custom Metadata State Constraints for Settlement Transfers
-- ------------------------------------------------------------
ALTER TABLE "settlement_transfers" ADD CONSTRAINT "settlement_transfers_unpaid_has_no_payment_metadata" CHECK ("status" <> 'UNPAID' OR ("paid_at" IS NULL AND "paid_marked_by_member_id" IS NULL AND "completed_at" IS NULL AND "completed_by_member_id" IS NULL));
ALTER TABLE "settlement_transfers" ADD CONSTRAINT "settlement_transfers_paid_has_paid_metadata" CHECK ("status" <> 'PAID' OR ("paid_at" IS NOT NULL AND "paid_marked_by_member_id" IS NOT NULL AND "completed_at" IS NULL AND "completed_by_member_id" IS NULL));
ALTER TABLE "settlement_transfers" ADD CONSTRAINT "settlement_transfers_completed_has_completion_metadata" CHECK ("status" <> 'COMPLETED' OR ("paid_at" IS NOT NULL AND "paid_marked_by_member_id" IS NOT NULL AND "completed_at" IS NOT NULL AND "completed_by_member_id" IS NOT NULL));

-- Application-level invariants: item eligibility, surcharge allocation/sums, claim locks/conflicts.
