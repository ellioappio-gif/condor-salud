-- Migration 026: Add clinic_id to clinical tables lacking tenant isolation
-- Tables that need clinic_id for multi-tenant data isolation
-- Referenced by: P0-3 from world-class enterprise audit 2026-04-17

-- ─── doctor_reviews ──────────────────────────────────────────
ALTER TABLE doctor_reviews
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;

UPDATE doctor_reviews dr
SET clinic_id = (
  SELECT p.clinic_id FROM profiles p
  JOIN doctors d ON d.id = dr.doctor_id
  WHERE p.id = d.profile_id
  LIMIT 1
)
WHERE dr.clinic_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_doctor_reviews_clinic_id ON doctor_reviews(clinic_id);

-- ─── doctor_availability ─────────────────────────────────────
ALTER TABLE doctor_availability
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;

UPDATE doctor_availability da
SET clinic_id = (
  SELECT p.clinic_id FROM profiles p
  JOIN doctors d ON d.id = da.doctor_id
  WHERE p.id = d.profile_id
  LIMIT 1
)
WHERE da.clinic_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_doctor_availability_clinic_id ON doctor_availability(clinic_id);

-- ─── doctor_verifications ────────────────────────────────────
ALTER TABLE doctor_verifications
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;

UPDATE doctor_verifications dv
SET clinic_id = (
  SELECT p.clinic_id FROM profiles p WHERE p.id = dv.profile_id
)
WHERE dv.clinic_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_doctor_verifications_clinic_id ON doctor_verifications(clinic_id);

-- ─── verification_documents ──────────────────────────────────
ALTER TABLE verification_documents
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;

UPDATE verification_documents vd
SET clinic_id = (
  SELECT dv.clinic_id FROM doctor_verifications dv WHERE dv.id = vd.verification_id
)
WHERE vd.clinic_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_verification_documents_clinic_id ON verification_documents(clinic_id);

-- ─── doctor_public_profiles ──────────────────────────────────
ALTER TABLE doctor_public_profiles
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;

UPDATE doctor_public_profiles dpp
SET clinic_id = (
  SELECT p.clinic_id FROM profiles p WHERE p.id = dpp.profile_id
)
WHERE dpp.clinic_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_doctor_public_profiles_clinic_id ON doctor_public_profiles(clinic_id);

-- ─── doctor_reviews_public ───────────────────────────────────
ALTER TABLE doctor_reviews_public
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;

UPDATE doctor_reviews_public drp
SET clinic_id = (
  SELECT dpp.clinic_id FROM doctor_public_profiles dpp WHERE dpp.id = drp.doctor_profile_id
)
WHERE drp.clinic_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_doctor_reviews_public_clinic_id ON doctor_reviews_public(clinic_id);

-- ─── prescription_medications ────────────────────────────────
ALTER TABLE prescription_medications
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;

UPDATE prescription_medications pm
SET clinic_id = (
  SELECT dp.clinic_id FROM digital_prescriptions dp WHERE dp.id = pm.prescription_id
)
WHERE pm.clinic_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_prescription_medications_clinic_id ON prescription_medications(clinic_id);

-- ─── campaign_recipients ─────────────────────────────────────
ALTER TABLE campaign_recipients
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;

UPDATE campaign_recipients cr
SET clinic_id = (
  SELECT mc.clinic_id FROM marketing_campaigns mc WHERE mc.id = cr.campaign_id
)
WHERE cr.clinic_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_clinic_id ON campaign_recipients(clinic_id);

-- ─── booking_notifications ───────────────────────────────────
ALTER TABLE booking_notifications
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;

UPDATE booking_notifications bn
SET clinic_id = (
  SELECT cb.clinic_id FROM clinic_bookings cb WHERE cb.id = bn.booking_id
)
WHERE bn.clinic_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_booking_notifications_clinic_id ON booking_notifications(clinic_id);

-- ─── receipt_items ───────────────────────────────────────────
ALTER TABLE receipt_items
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;

UPDATE receipt_items ri
SET clinic_id = (
  SELECT r.clinic_id FROM receipts r WHERE r.id = ri.receipt_id
)
WHERE ri.clinic_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_receipt_items_clinic_id ON receipt_items(clinic_id);

-- ─── sisa_validations ────────────────────────────────────────
ALTER TABLE sisa_validations
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;

UPDATE sisa_validations sv
SET clinic_id = (
  SELECT p.clinic_id FROM profiles p WHERE p.id = sv.doctor_profile_id
)
WHERE sv.clinic_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_sisa_validations_clinic_id ON sisa_validations(clinic_id);

-- ─── osde_registrations ──────────────────────────────────────
ALTER TABLE osde_registrations
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;

UPDATE osde_registrations oreg
SET clinic_id = (
  SELECT dp.clinic_id FROM digital_prescriptions dp WHERE dp.id = oreg.prescription_id
)
WHERE oreg.clinic_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_osde_registrations_clinic_id ON osde_registrations(clinic_id);

-- ─── push_subscriptions ──────────────────────────────────────
ALTER TABLE push_subscriptions
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;

UPDATE push_subscriptions ps
SET clinic_id = (
  SELECT p.clinic_id FROM profiles p WHERE p.id = ps.user_id
)
WHERE ps.clinic_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_clinic_id ON push_subscriptions(clinic_id);

-- Note: club_plans, coverage_plans, vademecum_drugs, drug_interactions,
-- health_tracker_categories, club_welcome_studies are global reference tables
-- that don't need clinic_id (shared across all clinics).

-- Note: club_memberships, prescription_fees, health_tracker_items use TEXT patient_id
-- (Firestore legacy) — clinic_id cannot be backfilled without a mapping table.
-- These should be migrated to UUID FKs in a separate data migration.
