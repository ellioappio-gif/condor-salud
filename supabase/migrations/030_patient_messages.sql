-- ─── Migration 030: Patient Secure Messaging ─────────────────
-- Inbox-style messaging between patients and providers.

CREATE TABLE IF NOT EXISTS patient_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  thread_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('patient', 'doctor', 'staff')),
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  body TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS message_threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id),
  patient_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  subject TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE patient_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clinic members can access messages"
  ON patient_messages FOR ALL
  USING (clinic_id = (current_setting('app.current_clinic_id', true))::uuid);

CREATE POLICY "Clinic members can access threads"
  ON message_threads FOR ALL
  USING (clinic_id = (current_setting('app.current_clinic_id', true))::uuid);

CREATE INDEX idx_patient_messages_thread ON patient_messages(thread_id, created_at);
CREATE INDEX idx_patient_messages_recipient ON patient_messages(recipient_id, read);
CREATE INDEX idx_message_threads_patient ON message_threads(patient_id);
CREATE INDEX idx_message_threads_provider ON message_threads(provider_id);
