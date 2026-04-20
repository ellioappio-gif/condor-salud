CREATE TABLE IF NOT EXISTS medication_adherence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medication_id UUID NOT NULL,
  taken_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, medication_id, taken_at)
);

CREATE INDEX IF NOT EXISTS idx_adherence_patient ON medication_adherence(patient_id, taken_at DESC);
