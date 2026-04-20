-- Migration 026: Add clinic_id to clinical tables lacking tenant isolation
-- Uses DO blocks to skip tables/columns that may not exist

-- ─── doctor_reviews ──────────────────────────────────────────
ALTER TABLE doctor_reviews
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
UPDATE doctor_reviews dr SET clinic_id = (SELECT d.clinic_id FROM doctors d WHERE d.id = dr.doctor_id LIMIT 1) WHERE dr.clinic_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_doctor_reviews_clinic_id ON doctor_reviews(clinic_id);

-- ─── doctor_availability ─────────────────────────────────────
ALTER TABLE doctor_availability
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
UPDATE doctor_availability da SET clinic_id = (SELECT d.clinic_id FROM doctors d WHERE d.id = da.doctor_id LIMIT 1) WHERE da.clinic_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_doctor_availability_clinic_id ON doctor_availability(clinic_id);

-- ─── doctor_verifications ────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctor_verifications' AND column_name='profile_id') THEN
    ALTER TABLE doctor_verifications ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
    EXECUTE 'UPDATE doctor_verifications dv SET clinic_id = (SELECT p.clinic_id FROM profiles p WHERE p.id = dv.profile_id) WHERE dv.clinic_id IS NULL';
    CREATE INDEX IF NOT EXISTS idx_doctor_verifications_clinic_id ON doctor_verifications(clinic_id);
  END IF;
END $$;

-- ─── verification_documents ──────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='verification_documents') THEN
    ALTER TABLE verification_documents ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
    EXECUTE 'UPDATE verification_documents vd SET clinic_id = (SELECT dv.clinic_id FROM doctor_verifications dv WHERE dv.id = vd.verification_id) WHERE vd.clinic_id IS NULL';
    CREATE INDEX IF NOT EXISTS idx_verification_documents_clinic_id ON verification_documents(clinic_id);
  END IF;
END $$;

-- ─── doctor_public_profiles ──────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctor_public_profiles' AND column_name='profile_id') THEN
    ALTER TABLE doctor_public_profiles ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
    EXECUTE 'UPDATE doctor_public_profiles dpp SET clinic_id = (SELECT p.clinic_id FROM profiles p WHERE p.id = dpp.profile_id) WHERE dpp.clinic_id IS NULL';
    CREATE INDEX IF NOT EXISTS idx_doctor_public_profiles_clinic_id ON doctor_public_profiles(clinic_id);
  END IF;
END $$;

-- ─── doctor_reviews_public ───────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctor_reviews_public' AND column_name='doctor_profile_id') THEN
    ALTER TABLE doctor_reviews_public ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
    EXECUTE 'UPDATE doctor_reviews_public drp SET clinic_id = (SELECT dpp.clinic_id FROM doctor_public_profiles dpp WHERE dpp.id = drp.doctor_profile_id) WHERE drp.clinic_id IS NULL';
    CREATE INDEX IF NOT EXISTS idx_doctor_reviews_public_clinic_id ON doctor_reviews_public(clinic_id);
  END IF;
END $$;

-- ─── prescription_medications ────────────────────────────────
ALTER TABLE prescription_medications
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
UPDATE prescription_medications pm SET clinic_id = (SELECT dp.clinic_id FROM digital_prescriptions dp WHERE dp.id = pm.prescription_id) WHERE pm.clinic_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_prescription_medications_clinic_id ON prescription_medications(clinic_id);

-- ─── campaign_recipients (may not exist) ─────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='campaign_recipients') THEN
    ALTER TABLE campaign_recipients ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_campaign_recipients_clinic_id ON campaign_recipients(clinic_id);
  END IF;
END $$;

-- ─── booking_notifications ───────────────────────────────────
ALTER TABLE booking_notifications
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='clinic_bookings') THEN
    EXECUTE 'UPDATE booking_notifications bn SET clinic_id = (SELECT cb.clinic_id FROM clinic_bookings cb WHERE cb.id = bn.booking_id) WHERE bn.clinic_id IS NULL';
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_booking_notifications_clinic_id ON booking_notifications(clinic_id);

-- ─── receipt_items ───────────────────────────────────────────
ALTER TABLE receipt_items
  ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
UPDATE receipt_items ri SET clinic_id = (SELECT r.clinic_id FROM receipts r WHERE r.id = ri.receipt_id) WHERE ri.clinic_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_receipt_items_clinic_id ON receipt_items(clinic_id);

-- ─── sisa_validations (may not exist) ────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='sisa_validations') THEN
    ALTER TABLE sisa_validations ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_sisa_validations_clinic_id ON sisa_validations(clinic_id);
  END IF;
END $$;

-- ─── osde_registrations (may not exist) ──────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='osde_registrations') THEN
    ALTER TABLE osde_registrations ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_osde_registrations_clinic_id ON osde_registrations(clinic_id);
  END IF;
END $$;

-- ─── push_subscriptions ──────────────────────────────────────
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='push_subscriptions') THEN
    ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE;
    EXECUTE 'UPDATE push_subscriptions ps SET clinic_id = (SELECT p.clinic_id FROM profiles p WHERE p.id = ps.user_id) WHERE ps.clinic_id IS NULL';
    CREATE INDEX IF NOT EXISTS idx_push_subscriptions_clinic_id ON push_subscriptions(clinic_id);
  END IF;
END $$;
