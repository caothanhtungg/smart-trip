-- ============================================================
-- SMART TRIP - MIGRATION 0003: ADD ITINERARY TIME FIELDS
-- Release 1: Bổ sung hai cột thời gian start_time và end_time
-- dạng TIME(0) nullable cho bảng itinerary_items
-- ============================================================

-- AlterTable
ALTER TABLE "itinerary_items" ADD COLUMN "start_time" TIME(0),
ADD COLUMN "end_time" TIME(0);
