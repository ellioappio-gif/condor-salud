-- ── Migration 008: Interconsultas Tables ──────────────────────
-- Creates tables for the inter-consultation referral network.

-- Network doctors (external specialists for referrals)
CREATE TABLE IF NOT EXISTS network_doctors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id     UUID REFERENCES clinics(id) ON DELETE CASCADE,
  nombre        TEXT NOT NULL,
  especialidad  TEXT NOT NULL,
  subespecialidad TEXT,
  matricula     TEXT,
  email         TEXT,
  telefono      TEXT,
  institucion   TEXT,
  direccion     TEXT,
  zona          TEXT,
  activo        BOOLEAN DEFAULT true,
  notas         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Interconsultas (referral requests between doctors)
CREATE TABLE IF NOT EXISTS interconsultas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID REFERENCES clinics(id) ON DELETE CASCADE,
  paciente_id     UUID NOT NULL,
  paciente_nombre TEXT NOT NULL,
  medico_origen   TEXT NOT NULL,
  medico_destino  TEXT NOT NULL,
  especialidad_destino TEXT NOT NULL,
  estado          TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'en-curso', 'completada', 'cancelada')),
  prioridad       TEXT NOT NULL DEFAULT 'normal'
    CHECK (prioridad IN ('urgente', 'alta', 'normal', 'baja')),
  motivo          TEXT NOT NULL,
  diagnostico     TEXT,
  indicaciones    TEXT,
  resultado       TEXT,
  adjuntos        JSONB DEFAULT '[]'::jsonb,
  fecha_solicitud TIMESTAMPTZ DEFAULT now(),
  fecha_respuesta TIMESTAMPTZ,
  fecha_turno     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Solicitudes de estudio (study/test requests linked to interconsultas)
CREATE TABLE IF NOT EXISTS solicitudes_estudio (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id         UUID REFERENCES clinics(id) ON DELETE CASCADE,
  interconsulta_id  UUID REFERENCES interconsultas(id) ON DELETE SET NULL,
  paciente_id       UUID NOT NULL,
  paciente_nombre   TEXT NOT NULL,
  medico_solicitante TEXT NOT NULL,
  tipo_estudio      TEXT NOT NULL,
  descripcion       TEXT,
  urgente           BOOLEAN DEFAULT false,
  estado            TEXT NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'programado', 'realizado', 'informado', 'cancelado')),
  resultado         TEXT,
  adjuntos          JSONB DEFAULT '[]'::jsonb,
  fecha_solicitud   TIMESTAMPTZ DEFAULT now(),
  fecha_programada  TIMESTAMPTZ,
  fecha_resultado   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_interconsultas_clinic     ON interconsultas(clinic_id);
CREATE INDEX IF NOT EXISTS idx_interconsultas_paciente   ON interconsultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_interconsultas_estado     ON interconsultas(estado);
CREATE INDEX IF NOT EXISTS idx_solicitudes_clinic        ON solicitudes_estudio(clinic_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_interconsulta ON solicitudes_estudio(interconsulta_id);
CREATE INDEX IF NOT EXISTS idx_network_doctors_clinic    ON network_doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_network_doctors_esp       ON network_doctors(especialidad);

-- RLS
ALTER TABLE network_doctors      ENABLE ROW LEVEL SECURITY;
ALTER TABLE interconsultas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes_estudio  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clinic_network_doctors" ON network_doctors
  FOR ALL USING (clinic_id = auth.uid() OR clinic_id IN (
    SELECT id FROM clinics WHERE id = clinic_id
  ));

CREATE POLICY "clinic_interconsultas" ON interconsultas
  FOR ALL USING (clinic_id = auth.uid() OR clinic_id IN (
    SELECT id FROM clinics WHERE id = clinic_id
  ));

CREATE POLICY "clinic_solicitudes_estudio" ON solicitudes_estudio
  FOR ALL USING (clinic_id = auth.uid() OR clinic_id IN (
    SELECT id FROM clinics WHERE id = clinic_id
  ));

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_network_doctors_updated') THEN
    CREATE TRIGGER trg_network_doctors_updated BEFORE UPDATE ON network_doctors
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_interconsultas_updated') THEN
    CREATE TRIGGER trg_interconsultas_updated BEFORE UPDATE ON interconsultas
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_solicitudes_estudio_updated') THEN
    CREATE TRIGGER trg_solicitudes_estudio_updated BEFORE UPDATE ON solicitudes_estudio
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
