-- ─── Migration 029: Report Schedules ──────────────────────────
-- Stores scheduled report configurations per clinic.

CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  report_id TEXT NOT NULL, -- e.g. "R01", "R02"
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  format TEXT NOT NULL DEFAULT 'pdf' CHECK (format IN ('pdf', 'excel', 'both')),
  recipients JSONB NOT NULL DEFAULT '[]', -- array of email strings
  enabled BOOLEAN NOT NULL DEFAULT true,
  next_run TIMESTAMPTZ,
  last_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can manage their schedules"
  ON report_schedules FOR ALL
  USING (clinic_id = (current_setting('app.current_clinic_id', true))::uuid);

CREATE INDEX idx_report_schedules_clinic ON report_schedules(clinic_id);
CREATE INDEX idx_report_schedules_next_run ON report_schedules(next_run) WHERE enabled = true;
