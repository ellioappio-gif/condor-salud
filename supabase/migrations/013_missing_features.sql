-- Migration 013: Five new features
-- 1) Cóndor Health Club (memberships + prescription fees)
-- 2) Health Tracker with proactive reminders
-- 3) Digital Prescriptions with QR verification
-- 4) Doctor signup verification (matrícula + DNI)
-- 5) Public doctor profile pages (SEO)
--
-- Run: supabase db push

-- ═══════════════════════════════════════════════════════════════
-- FEATURE 1: Cóndor Health Club
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS club_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,                  -- 'basico', 'plus', 'familiar'
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  price_ars NUMERIC(12, 2) NOT NULL,          -- monthly ARS
  price_usd NUMERIC(12, 2) NOT NULL,          -- monthly USD (tourists)
  prescription_discount NUMERIC(4, 2) NOT NULL DEFAULT 0, -- 0-1 (e.g. 0.20 = 20%)
  max_teleconsultas INT NOT NULL DEFAULT 0,
  includes_delivery BOOLEAN NOT NULL DEFAULT FALSE,
  includes_cora_priority BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS club_memberships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,                   -- references Firestore patient ID
  plan_id UUID NOT NULL REFERENCES club_plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  mp_subscription_id TEXT,                    -- MercadoPago subscription ID
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_memberships_patient ON club_memberships(patient_id, status);

CREATE TABLE IF NOT EXISTS prescription_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  prescription_id UUID,                       -- references digital_prescriptions if exists
  medication_name TEXT NOT NULL,
  original_price NUMERIC(12, 2) NOT NULL,
  discount_pct NUMERIC(4, 2) NOT NULL DEFAULT 0,
  final_price NUMERIC(12, 2) NOT NULL,
  club_plan_slug TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'waived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default club plans
INSERT INTO club_plans (slug, name_es, name_en, price_ars, price_usd, prescription_discount, max_teleconsultas, includes_delivery, includes_cora_priority, sort_order)
VALUES
  ('basico',   'Club Básico',    'Basic Club',    4500,  5,  0.10, 1, FALSE, FALSE, 1),
  ('plus',     'Club Plus',      'Plus Club',    8500, 10,  0.20, 3, TRUE,  TRUE,  2),
  ('familiar', 'Club Familiar',  'Family Club', 14000, 18,  0.30, 6, TRUE,  TRUE,  3)
ON CONFLICT (slug) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- FEATURE 2: Health Tracker
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS health_tracker_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name_es TEXT NOT NULL,
  name_en TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'activity',       -- lucide icon name
  color TEXT NOT NULL DEFAULT '#75AADB',
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS health_tracker_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES health_tracker_categories(id),
  title TEXT NOT NULL,
  value TEXT,                                  -- e.g. "120/80", "72 kg", "normal"
  notes TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reminder_interval_days INT,                  -- NULL = no reminder
  next_reminder_at TIMESTAMPTZ,
  reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
  attachments JSONB DEFAULT '[]'::jsonb,       -- file URLs
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_tracker_patient ON health_tracker_items(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_tracker_reminders ON health_tracker_items(next_reminder_at)
  WHERE next_reminder_at IS NOT NULL AND reminder_sent = FALSE;

-- Seed default categories
INSERT INTO health_tracker_categories (slug, name_es, name_en, icon, color, sort_order)
VALUES
  ('presion',      'Presión Arterial',   'Blood Pressure',   'heart-pulse',  '#DC2626', 1),
  ('peso',         'Peso',               'Weight',           'scale',        '#F6B40E', 2),
  ('glucosa',      'Glucosa',            'Blood Sugar',      'droplet',      '#7C3AED', 3),
  ('medicacion',   'Medicación',         'Medication',       'pill',         '#75AADB', 4),
  ('vacunas',      'Vacunas',            'Vaccines',         'syringe',      '#16A34A', 5),
  ('laboratorio',  'Laboratorio',        'Lab Results',      'flask-conical','#EA580C', 6),
  ('estudios',     'Estudios/Imágenes',  'Studies/Imaging',  'scan',         '#0EA5E9', 7),
  ('sintomas',     'Síntomas',           'Symptoms',         'thermometer',  '#E11D48', 8),
  ('notas',        'Notas Generales',    'General Notes',    'notebook-pen', '#6B7280', 9)
ON CONFLICT (slug) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- FEATURE 3: Digital Prescriptions with QR
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS digital_prescriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  doctor_profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  patient_id TEXT NOT NULL,                    -- Firestore patient ID
  patient_name TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  doctor_matricula TEXT,
  specialty TEXT,
  diagnosis TEXT,
  notes TEXT,
  verification_token TEXT NOT NULL UNIQUE,     -- short token for QR / URL
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dispensed', 'expired', 'cancelled')),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  dispensed_at TIMESTAMPTZ,
  dispensed_by TEXT,                           -- pharmacy name
  pdf_path TEXT,                               -- Supabase Storage path
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_rx_token ON digital_prescriptions(verification_token);
CREATE INDEX IF NOT EXISTS idx_rx_patient ON digital_prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_rx_doctor ON digital_prescriptions(doctor_profile_id);
CREATE INDEX IF NOT EXISTS idx_rx_clinic ON digital_prescriptions(clinic_id);

CREATE TABLE IF NOT EXISTS prescription_medications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES digital_prescriptions(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,                        -- e.g. "500mg"
  frequency TEXT NOT NULL,                     -- e.g. "cada 8 horas"
  duration TEXT,                               -- e.g. "7 días"
  quantity INT,
  notes TEXT,
  sort_order INT NOT NULL DEFAULT 0
);


-- ═══════════════════════════════════════════════════════════════
-- FEATURE 4: Doctor Verification
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS doctor_verifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  matricula_nacional TEXT,
  matricula_provincial TEXT,
  dni TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doctor_verif_profile ON doctor_verifications(profile_id);
CREATE INDEX IF NOT EXISTS idx_doctor_verif_status ON doctor_verifications(status);

CREATE TABLE IF NOT EXISTS verification_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id UUID NOT NULL REFERENCES doctor_verifications(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('matricula_frente', 'matricula_dorso', 'dni_frente', 'dni_dorso', 'titulo', 'otro')),
  storage_path TEXT NOT NULL,                  -- Supabase Storage path
  file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);


-- ═══════════════════════════════════════════════════════════════
-- FEATURE 5: Public Doctor Profiles
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS doctor_public_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,                   -- URL-friendly: "dr-juan-perez"
  display_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  sub_specialties TEXT[] DEFAULT '{}',
  bio_es TEXT,
  bio_en TEXT,
  photo_url TEXT,
  matricula_nacional TEXT,
  matricula_provincial TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  -- Contact / booking
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  booking_url TEXT,                            -- internal or external booking link
  -- Location
  address TEXT,
  city TEXT,
  province TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  -- Practice details
  insurance_accepted TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{es}',
  education JSONB DEFAULT '[]'::jsonb,         -- [{degree, institution, year}]
  experience_years INT,
  teleconsulta_available BOOLEAN DEFAULT FALSE,
  consultation_fee_ars NUMERIC(12, 2),
  consultation_fee_usd NUMERIC(12, 2),
  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  -- Visibility
  published BOOLEAN NOT NULL DEFAULT FALSE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  -- Ratings (denormalized for performance)
  avg_rating NUMERIC(3, 2) DEFAULT 0,
  review_count INT DEFAULT 0,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dpp_slug ON doctor_public_profiles(slug);
CREATE INDEX IF NOT EXISTS idx_dpp_specialty ON doctor_public_profiles(specialty) WHERE published = TRUE;
CREATE INDEX IF NOT EXISTS idx_dpp_city ON doctor_public_profiles(city) WHERE published = TRUE;
CREATE INDEX IF NOT EXISTS idx_dpp_featured ON doctor_public_profiles(featured) WHERE published = TRUE AND featured = TRUE;

CREATE TABLE IF NOT EXISTS doctor_reviews_public (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_profile_id UUID NOT NULL REFERENCES doctor_public_profiles(id) ON DELETE CASCADE,
  patient_id TEXT,                             -- Firestore patient ID (nullable for anonymous)
  patient_display_name TEXT NOT NULL,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  is_verified_patient BOOLEAN DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_drp_doctor ON doctor_reviews_public(doctor_profile_id);

-- Trigger to update denormalized rating on doctor_public_profiles
CREATE OR REPLACE FUNCTION update_doctor_avg_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE doctor_public_profiles
  SET avg_rating = (
    SELECT COALESCE(AVG(rating), 0) FROM doctor_reviews_public
    WHERE doctor_profile_id = COALESCE(NEW.doctor_profile_id, OLD.doctor_profile_id)
      AND status = 'approved'
  ),
  review_count = (
    SELECT COUNT(*) FROM doctor_reviews_public
    WHERE doctor_profile_id = COALESCE(NEW.doctor_profile_id, OLD.doctor_profile_id)
      AND status = 'approved'
  ),
  updated_at = NOW()
  WHERE id = COALESCE(NEW.doctor_profile_id, OLD.doctor_profile_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_doctor_rating
AFTER INSERT OR UPDATE OR DELETE ON doctor_reviews_public
FOR EACH ROW EXECUTE FUNCTION update_doctor_avg_rating();


-- ═══════════════════════════════════════════════════════════════
-- RLS Policies
-- ═══════════════════════════════════════════════════════════════

-- Club plans: public read
ALTER TABLE club_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Club plans are public" ON club_plans FOR SELECT USING (TRUE);

-- Club memberships: patients manage own
ALTER TABLE club_memberships ENABLE ROW LEVEL SECURITY;

-- Prescription fees: readable by patient
ALTER TABLE prescription_fees ENABLE ROW LEVEL SECURITY;

-- Health tracker: patient-owned
ALTER TABLE health_tracker_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_tracker_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON health_tracker_categories FOR SELECT USING (TRUE);

-- Digital prescriptions: clinic staff + patient
ALTER TABLE digital_prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic staff can manage prescriptions" ON digital_prescriptions FOR ALL
  USING (clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid()));
ALTER TABLE prescription_medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Meds follow prescription access" ON prescription_medications FOR SELECT
  USING (prescription_id IN (
    SELECT id FROM digital_prescriptions WHERE clinic_id IN (
      SELECT clinic_id FROM profiles WHERE id = auth.uid()
    )
  ));

-- Doctor verifications: own profile + admin
ALTER TABLE doctor_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Doctors see own verification" ON doctor_verifications FOR SELECT
  USING (profile_id = auth.uid());
CREATE POLICY "Doctors submit own verification" ON doctor_verifications FOR INSERT
  WITH CHECK (profile_id = auth.uid());
CREATE POLICY "Admins review verifications" ON doctor_verifications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
ALTER TABLE verification_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Docs follow verification access" ON verification_documents FOR ALL
  USING (verification_id IN (SELECT id FROM doctor_verifications WHERE profile_id = auth.uid()));

-- Public profiles: public read, owner write
ALTER TABLE doctor_public_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published profiles are public" ON doctor_public_profiles FOR SELECT
  USING (published = TRUE);
CREATE POLICY "Doctors manage own profile" ON doctor_public_profiles FOR ALL
  USING (profile_id = auth.uid());

-- Public reviews: public read approved
ALTER TABLE doctor_reviews_public ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved reviews are public" ON doctor_reviews_public FOR SELECT
  USING (status = 'approved');

