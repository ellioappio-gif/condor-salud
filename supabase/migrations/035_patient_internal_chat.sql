-- ─── Migration 035: Patient Internal Staff Chat ─────────────
-- Group chat channel per patient, visible to all clinic staff.
-- Doctor ↔ Receptionist async messaging per patient context.

CREATE TABLE IF NOT EXISTS patient_internal_chat (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id    UUID        NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id   UUID        NOT NULL,
  sender_id    UUID        NOT NULL REFERENCES auth.users(id),
  sender_name  TEXT        NOT NULL,
  sender_role  TEXT        NOT NULL CHECK (sender_role IN ('admin','medico','recepcion','enfermero','staff')),
  body         TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE patient_internal_chat ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic staff can read chat"
  ON patient_internal_chat FOR SELECT
  USING (clinic_id = (current_setting('app.current_clinic_id', true))::uuid);

CREATE POLICY "Clinic staff can insert chat"
  ON patient_internal_chat FOR INSERT
  WITH CHECK (clinic_id = (current_setting('app.current_clinic_id', true))::uuid);

CREATE INDEX idx_patient_internal_chat_patient
  ON patient_internal_chat(patient_id, created_at DESC);

CREATE INDEX idx_patient_internal_chat_clinic
  ON patient_internal_chat(clinic_id, created_at DESC);
