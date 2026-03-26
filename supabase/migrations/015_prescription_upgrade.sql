-- Migration 015: Prescription system upgrade
-- Adds vademecum support, SISA validation, OSDE FHIR 4.0 integration,
-- prescription lifecycle (draft → active → sent → dispensed), coverage tracking.
--
-- Run: supabase db push

-- ═══════════════════════════════════════════════════════════════
-- 1. Expand digital_prescriptions
-- ═══════════════════════════════════════════════════════════════

-- Allow 'draft' and 'sent' status values
ALTER TABLE digital_prescriptions
  DROP CONSTRAINT IF EXISTS digital_prescriptions_status_check;

ALTER TABLE digital_prescriptions
  ADD CONSTRAINT digital_prescriptions_status_check
  CHECK (status IN ('draft', 'active', 'sent', 'dispensed', 'expired', 'cancelled'));

-- Patient & doctor identifiers for SISA/OSDE
ALTER TABLE digital_prescriptions
  ADD COLUMN IF NOT EXISTS patient_dni TEXT,
  ADD COLUMN IF NOT EXISTS doctor_cuit TEXT;

-- Diagnoses as structured JSON array [{code, description, system}]
ALTER TABLE digital_prescriptions
  ADD COLUMN IF NOT EXISTS diagnoses JSONB DEFAULT '[]'::jsonb;

-- Sent tracking
ALTER TABLE digital_prescriptions
  ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sent_via JSONB DEFAULT '[]'::jsonb;

-- PDF URL (distinct from pdf_path storage key)
ALTER TABLE digital_prescriptions
  ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Coverage / obra social
ALTER TABLE digital_prescriptions
  ADD COLUMN IF NOT EXISTS coverage_name TEXT,
  ADD COLUMN IF NOT EXISTS coverage_plan TEXT,
  ADD COLUMN IF NOT EXISTS coverage_number TEXT;

-- OSDE FHIR registration data
ALTER TABLE digital_prescriptions
  ADD COLUMN IF NOT EXISTS osde_data JSONB;

-- Repeat support
ALTER TABLE digital_prescriptions
  ADD COLUMN IF NOT EXISTS repeat_of UUID REFERENCES digital_prescriptions(id) ON DELETE SET NULL;

-- Index for coverage lookups
CREATE INDEX IF NOT EXISTS idx_rx_coverage ON digital_prescriptions(coverage_name)
  WHERE coverage_name IS NOT NULL;

-- Index for repeat chain
CREATE INDEX IF NOT EXISTS idx_rx_repeat ON digital_prescriptions(repeat_of)
  WHERE repeat_of IS NOT NULL;


-- ═══════════════════════════════════════════════════════════════
-- 2. Expand prescription_medications
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE prescription_medications
  ADD COLUMN IF NOT EXISTS generic_name TEXT,
  ADD COLUMN IF NOT EXISTS drug_snapshot JSONB;


-- ═══════════════════════════════════════════════════════════════
-- 3. Vademecum drugs (local cache / augmented search)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS vademecum_drugs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  troquel TEXT UNIQUE,
  commercial_name TEXT NOT NULL,
  generic_name TEXT NOT NULL,
  laboratory TEXT NOT NULL,
  presentation TEXT NOT NULL,
  category TEXT NOT NULL,
  controlled BOOLEAN NOT NULL DEFAULT FALSE,
  requires_duplicate BOOLEAN NOT NULL DEFAULT FALSE,
  price_ars NUMERIC(12, 2),
  barcode TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  kairos_id TEXT,                              -- Kairos API ID if synced
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vademecum_generic ON vademecum_drugs(generic_name);
CREATE INDEX IF NOT EXISTS idx_vademecum_search ON vademecum_drugs
  USING gin (to_tsvector('spanish', commercial_name || ' ' || generic_name));


-- ═══════════════════════════════════════════════════════════════
-- 4. Drug interactions
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS drug_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  drug_a_generic TEXT NOT NULL,
  drug_b_generic TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('contraindicated', 'high', 'moderate', 'low')),
  description TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'local',        -- 'kairos', 'anmat', 'local'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (drug_a_generic, drug_b_generic)
);


-- ═══════════════════════════════════════════════════════════════
-- 5. SISA doctor validation cache
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS sisa_validations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_dni TEXT NOT NULL,
  doctor_cuit TEXT,
  matricula TEXT,
  tipo_matricula TEXT CHECK (tipo_matricula IN ('nacional', 'provincial')),
  provincia TEXT,
  profesion TEXT,
  especialidad TEXT,
  estado TEXT CHECK (estado IN ('habilitado', 'inhabilitado', 'suspendido')),
  valid BOOLEAN NOT NULL DEFAULT FALSE,
  raw_response JSONB,
  validated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sisa_doctor ON sisa_validations(doctor_dni);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sisa_doctor_profile ON sisa_validations(doctor_profile_id)
  WHERE valid = TRUE;


-- ═══════════════════════════════════════════════════════════════
-- 6. OSDE registration audit log
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS osde_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES digital_prescriptions(id) ON DELETE CASCADE,
  osde_id TEXT,                                -- OSDE-assigned prescription ID
  batch_key TEXT,                               -- batch identifier
  group_identifier TEXT,                        -- OSDE group identifier
  status TEXT NOT NULL CHECK (status IN ('registered', 'partial', 'failed', 'config_error')),
  fhir_request JSONB,                          -- stored for audit
  fhir_response JSONB,
  error_message TEXT,
  registered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_osde_rx ON osde_registrations(prescription_id);


-- ═══════════════════════════════════════════════════════════════
-- 7. RLS policies
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE vademecum_drugs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read vademecum" ON vademecum_drugs FOR SELECT USING (TRUE);

ALTER TABLE drug_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read interactions" ON drug_interactions FOR SELECT USING (TRUE);

ALTER TABLE sisa_validations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic staff can manage SISA validations" ON sisa_validations FOR ALL
  USING (
    doctor_profile_id IN (SELECT id FROM profiles WHERE role IN ('doctor', 'admin'))
    OR auth.uid() IN (
      SELECT user_id FROM clinic_members WHERE role IN ('admin', 'doctor')
    )
  );

ALTER TABLE osde_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clinic staff can view OSDE registrations" ON osde_registrations FOR SELECT
  USING (
    prescription_id IN (
      SELECT id FROM digital_prescriptions WHERE clinic_id IN (
        SELECT clinic_id FROM clinic_members WHERE user_id = auth.uid()
      )
    )
  );


-- ═══════════════════════════════════════════════════════════════
-- 8. Seed common Argentine drug interactions
-- ═══════════════════════════════════════════════════════════════

INSERT INTO drug_interactions (drug_a_generic, drug_b_generic, severity, description, source)
VALUES
  ('Warfarina', 'Aspirina', 'contraindicated', 'Riesgo severo de hemorragia. Combinacion contraindicada sin supervision hematologica.', 'anmat'),
  ('Enalapril', 'Espironolactona', 'high', 'Riesgo de hiperkalemia severa. Monitorear potasio serico cada 48-72h.', 'anmat'),
  ('Metformina', 'Contraste Yodado', 'high', 'Riesgo de acidosis lactica. Suspender metformina 48h antes del contraste.', 'anmat'),
  ('Losartan', 'Suplemento de Potasio', 'high', 'Los ARA-II aumentan potasio. Combinacion requiere monitoreo frecuente.', 'anmat'),
  ('Omeprazol', 'Clopidogrel', 'high', 'Omeprazol reduce eficacia de clopidogrel via CYP2C19. Preferir pantoprazol.', 'anmat'),
  ('Simvastatina', 'Gemfibrozil', 'contraindicated', 'Riesgo extremo de rabdomiolisis. Combinacion contraindicada.', 'anmat'),
  ('Fluoxetina', 'Tramadol', 'high', 'Riesgo de sindrome serotoninergico. Evitar combinacion.', 'anmat'),
  ('Clonazepam', 'Alcohol', 'high', 'Depresion severa del SNC. Contraindicado consumo de alcohol.', 'anmat'),
  ('Ibuprofeno', 'Aspirina', 'moderate', 'AINE puede reducir efecto cardioprotector de aspirina a dosis baja.', 'anmat'),
  ('Atenolol', 'Verapamilo', 'high', 'Riesgo de bradicardia severa y bloqueo AV. Combinacion peligrosa.', 'anmat'),
  ('Metformina', 'Enalapril', 'low', 'Combinacion segura y frecuente. IECA puede mejorar sensibilidad insulinica.', 'local'),
  ('Levotiroxina', 'Omeprazol', 'moderate', 'IBP puede reducir absorcion de levotiroxina. Separar toma 4 horas.', 'anmat')
ON CONFLICT (drug_a_generic, drug_b_generic) DO NOTHING;
