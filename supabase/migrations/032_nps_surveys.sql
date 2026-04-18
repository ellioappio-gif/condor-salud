CREATE TABLE IF NOT EXISTS nps_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  appointment_id UUID,
  patient_id UUID,
  doctor_id UUID,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 10),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(appointment_id)
);

CREATE INDEX IF NOT EXISTS idx_nps_clinic ON nps_surveys(clinic_id, created_at DESC);

ALTER TABLE nps_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nps_clinic_isolation" ON nps_surveys
  FOR ALL USING (
    clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid())
  );
