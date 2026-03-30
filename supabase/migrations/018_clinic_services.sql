-- ============================================================
-- Migration 018: Clinic Services & Pricing
-- Allows receptionists (and admins) to define services offered
-- by the clinic with their prices.
-- ============================================================

-- ── Table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clinic_services (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  category      TEXT NOT NULL DEFAULT 'consulta',
  price         NUMERIC(12, 2) NOT NULL DEFAULT 0,
  currency      TEXT NOT NULL DEFAULT 'ARS',
  duration_min  INT,                         -- duration in minutes (optional)
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_clinic_services_clinic
  ON clinic_services(clinic_id);

CREATE INDEX IF NOT EXISTS idx_clinic_services_category
  ON clinic_services(clinic_id, category);

CREATE INDEX IF NOT EXISTS idx_clinic_services_active
  ON clinic_services(clinic_id, active);

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE clinic_services ENABLE ROW LEVEL SECURITY;

-- Clinic members can read their own services
CREATE POLICY clinic_services_select ON clinic_services
  FOR SELECT USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Clinic members can insert services for their clinic
CREATE POLICY clinic_services_insert ON clinic_services
  FOR INSERT WITH CHECK (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Clinic members can update their own services
CREATE POLICY clinic_services_update ON clinic_services
  FOR UPDATE USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Clinic members can delete their own services
CREATE POLICY clinic_services_delete ON clinic_services
  FOR DELETE USING (
    clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  );

-- ── Auto-update updated_at ──────────────────────────────────
CREATE OR REPLACE FUNCTION update_clinic_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clinic_services_updated_at
  BEFORE UPDATE ON clinic_services
  FOR EACH ROW EXECUTE FUNCTION update_clinic_services_updated_at();
