-- ============================================================
-- SMART TRIP - SECURITY MIGRATION 0002: DATA API LOCKDOWN
-- Mục tiêu: Kích hoạt Row-Level Security (RLS) và thu hồi quyền
-- truy cập Data API (PostgREST) đối với anon và authenticated.
-- Bảo vệ: 16 bảng nghiệp vụ Release 1 và bảng _prisma_migrations.
-- ============================================================

-- BƯỚC 1: Kích hoạt Row-Level Security (RLS) trên 16 bảng nghiệp vụ Release 1
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."verifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."trips" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."trip_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."member_claims" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."bank_claim_snapshots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."itinerary_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."expense_shares" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."expense_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."expense_item_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."settlements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."settlement_transfers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."rate_limits" ENABLE ROW LEVEL SECURITY;

-- BƯỚC 2: Xử lý bảng metadata _prisma_migrations (nếu đã được Prisma tạo trên target database)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '_prisma_migrations') THEN
    EXECUTE 'ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY';
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      EXECUTE 'REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."_prisma_migrations" FROM "anon"';
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      EXECUTE 'REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."_prisma_migrations" FROM "authenticated"';
    END IF;
  END IF;
END $$;

-- BƯỚC 3: Thu hồi toàn bộ quyền bảng của anon và authenticated trên 16 bảng nghiệp vụ
DO $$
BEGIN
  -- 3.1. Thu hồi quyền đối với vai trò anon (nếu tồn tại)
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" FROM "anon";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."accounts" FROM "anon";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sessions" FROM "anon";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."verifications" FROM "anon";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."trips" FROM "anon";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."trip_members" FROM "anon";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."member_claims" FROM "anon";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bank_claim_snapshots" FROM "anon";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."itinerary_items" FROM "anon";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."expenses" FROM "anon";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."expense_shares" FROM "anon";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."expense_items" FROM "anon";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."expense_item_members" FROM "anon";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."settlements" FROM "anon";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."settlement_transfers" FROM "anon";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."rate_limits" FROM "anon";

    REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM "anon";
    REVOKE ALL ON ALL ROUTINES IN SCHEMA "public" FROM "anon";

    ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "anon";
    ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "anon";
    ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON ROUTINES FROM "anon";
  END IF;

  -- 3.2. Thu hồi quyền đối với vai trò authenticated (nếu tồn tại)
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."users" FROM "authenticated";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."accounts" FROM "authenticated";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."sessions" FROM "authenticated";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."verifications" FROM "authenticated";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."trips" FROM "authenticated";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."trip_members" FROM "authenticated";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."member_claims" FROM "authenticated";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."bank_claim_snapshots" FROM "authenticated";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."itinerary_items" FROM "authenticated";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."expenses" FROM "authenticated";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."expense_shares" FROM "authenticated";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."expense_items" FROM "authenticated";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."expense_item_members" FROM "authenticated";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."settlements" FROM "authenticated";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."settlement_transfers" FROM "authenticated";
    REVOKE DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."rate_limits" FROM "authenticated";

    REVOKE ALL ON ALL SEQUENCES IN SCHEMA "public" FROM "authenticated";
    REVOKE ALL ON ALL ROUTINES IN SCHEMA "public" FROM "authenticated";

    ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON TABLES FROM "authenticated";
    ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON SEQUENCES FROM "authenticated";
    ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" REVOKE ALL ON ROUTINES FROM "authenticated";
  END IF;
END $$;
