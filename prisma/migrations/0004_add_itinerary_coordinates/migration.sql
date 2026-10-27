-- ============================================================
-- SMART TRIP - MIGRATION 0004: ADD ITINERARY COORDINATES
-- Bổ sung tọa độ latitude, longitude và cờ is_locked cho itinerary_items
-- ============================================================

-- AlterTable
ALTER TABLE "itinerary_items" 
ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "is_locked" BOOLEAN NOT NULL DEFAULT false;
