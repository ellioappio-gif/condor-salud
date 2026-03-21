-- =============================================================================
-- Migration 009 — Add geo-coordinates and photo to doctors table
-- =============================================================================
-- The v0.18.2 patient-data service reads lat/lng/photo_url from the doctors
-- table with runtime fallback.  This migration ensures the columns exist in
-- Supabase so real production data can populate them.

ALTER TABLE doctors
  ADD COLUMN IF NOT EXISTS lat    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS lng    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Backfill Buenos Aires coords for any existing rows that lack them
UPDATE doctors SET lat = -34.6037, lng = -58.3816
WHERE lat IS NULL;

-- Index for geospatial-ish proximity queries
CREATE INDEX IF NOT EXISTS idx_doctors_geo ON doctors (lat, lng);

COMMENT ON COLUMN doctors.lat IS 'Latitude (WGS84) — backfilled from Google Places API';
COMMENT ON COLUMN doctors.lng IS 'Longitude (WGS84) — backfilled from Google Places API';
COMMENT ON COLUMN doctors.photo_url IS 'Profile photo URL (Google Places proxy or uploaded)';
