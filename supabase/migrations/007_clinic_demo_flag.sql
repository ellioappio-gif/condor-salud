-- =============================================================================
-- 007 — Add demo flag to clinics table
-- Allows per-clinic demo mode: when demo=true, dashboard actions show the
-- DemoModal instead of executing real mutations. This moves demo mode from
-- a deployment-level environment variable to the provider/clinic level.
-- =============================================================================

ALTER TABLE clinics ADD COLUMN IF NOT EXISTS demo BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN clinics.demo IS
  'When true the clinic is in demo mode — dashboard actions show the DemoModal '
  'instead of executing real Supabase mutations.';
