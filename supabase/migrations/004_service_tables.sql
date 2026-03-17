-- ─── 004: Service Tables for Dashboard Modules ──────────────
-- Creates tables for: interconsultas, facturacion, rechazos,
-- financiadores, inflacion, inventario, nomenclador, reportes.
-- Each table has RLS and belongs to a clinic_id for multi-tenancy.
-- Run in Supabase SQL Editor.

-- ═══════════════════════════════════════════════════════════════
-- 1. INTERCONSULTAS MODULE
-- ═══════════════════════════════════════════════════════════════

-- Network of referral doctors
CREATE TABLE IF NOT EXISTS public.network_doctors (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id    UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  nombre       TEXT NOT NULL,
  especialidad TEXT NOT NULL,
  subespecialidad TEXT,
  matricula    TEXT NOT NULL,
  telefono     TEXT,
  email        TEXT,
  direccion    TEXT,
  localidad    TEXT DEFAULT 'CABA',
  obras_sociales TEXT[] DEFAULT '{}',
  horarios     TEXT,
  acepta_derivaciones BOOLEAN DEFAULT true,
  notas        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Interconsultas (referrals between doctors)
CREATE TABLE IF NOT EXISTS public.interconsultas (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id      UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  paciente_id    UUID REFERENCES public.pacientes(id),
  paciente_nombre TEXT NOT NULL,
  doctor_origen_id UUID,
  doctor_origen_nombre TEXT NOT NULL,
  doctor_destino_id UUID REFERENCES public.network_doctors(id),
  doctor_destino_nombre TEXT NOT NULL,
  especialidad   TEXT NOT NULL,
  prioridad      TEXT NOT NULL DEFAULT 'normal' CHECK (prioridad IN ('urgente','alta','normal','baja')),
  motivo         TEXT NOT NULL,
  diagnostico    TEXT,
  estado         TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aceptada','en_curso','completada','cancelada')),
  respuesta      TEXT,
  fecha_solicitud TIMESTAMPTZ DEFAULT now(),
  fecha_respuesta TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- Study/exam requests
CREATE TABLE IF NOT EXISTS public.solicitudes_estudio (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id      UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  paciente_id    UUID REFERENCES public.pacientes(id),
  paciente_nombre TEXT NOT NULL,
  doctor_solicitante TEXT NOT NULL,
  tipo           TEXT NOT NULL CHECK (tipo IN ('laboratorio','imagen','cardiologia','otros')),
  estudio        TEXT NOT NULL,
  centro         TEXT,
  indicacion     TEXT,
  urgente        BOOLEAN DEFAULT false,
  estado         TEXT NOT NULL DEFAULT 'solicitado' CHECK (estado IN ('solicitado','programado','realizado','informado','cancelado')),
  resultado_url  TEXT,
  fecha_solicitud TIMESTAMPTZ DEFAULT now(),
  fecha_resultado TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- 2. FACTURACION MODULE (extends existing facturas)
-- ═══════════════════════════════════════════════════════════════

-- Main invoices table
CREATE TABLE IF NOT EXISTS public.facturas (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id         UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  numero            TEXT NOT NULL,
  fecha             DATE NOT NULL DEFAULT CURRENT_DATE,
  financiador       TEXT NOT NULL,
  paciente          TEXT NOT NULL,
  paciente_id       UUID REFERENCES public.pacientes(id),
  prestacion        TEXT NOT NULL,
  codigo_nomenclador TEXT,
  monto             NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado            TEXT NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('presentada','cobrada','rechazada','pendiente','en_observacion')),
  fecha_presentacion DATE,
  fecha_cobro       DATE,
  cae               TEXT,
  lote_id           TEXT,
  notas             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facturas_clinic ON public.facturas(clinic_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON public.facturas(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_financiador ON public.facturas(financiador);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha ON public.facturas(fecha DESC);

-- ═══════════════════════════════════════════════════════════════
-- 3. RECHAZOS MODULE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.rechazos (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id         UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  factura_id        UUID REFERENCES public.facturas(id),
  factura_numero    TEXT NOT NULL,
  financiador       TEXT NOT NULL,
  paciente          TEXT NOT NULL,
  prestacion        TEXT NOT NULL,
  monto             NUMERIC(12,2) NOT NULL DEFAULT 0,
  motivo            TEXT NOT NULL
                    CHECK (motivo IN ('codigo_invalido','afiliado_no_encontrado','vencida','duplicada','sin_autorizacion','datos_incompletos','nomenclador_desactualizado')),
  motivo_detalle    TEXT,
  fecha_rechazo     DATE NOT NULL,
  fecha_presentacion DATE NOT NULL,
  reprocesable      BOOLEAN DEFAULT false,
  estado            TEXT NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente','reprocesado','descartado')),
  resuelto_por      TEXT,
  fecha_resolucion  DATE,
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rechazos_clinic ON public.rechazos(clinic_id);
CREATE INDEX IF NOT EXISTS idx_rechazos_estado ON public.rechazos(estado);
CREATE INDEX IF NOT EXISTS idx_rechazos_motivo ON public.rechazos(motivo);

-- ═══════════════════════════════════════════════════════════════
-- 4. FINANCIADORES MODULE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.financiadores (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id           UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  type                TEXT NOT NULL CHECK (type IN ('os','prepaga','pami')),
  cuit                TEXT,
  contacto_email      TEXT,
  contacto_telefono   TEXT,
  direccion           TEXT,
  facturado           NUMERIC(12,2) DEFAULT 0,
  cobrado             NUMERIC(12,2) DEFAULT 0,
  tasa_rechazo        NUMERIC(5,2) DEFAULT 0,
  dias_promedio_pago  INTEGER DEFAULT 0,
  facturas_pendientes INTEGER DEFAULT 0,
  ultimo_pago         DATE,
  ultima_liquidacion  TEXT,
  activo              BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financiadores_clinic ON public.financiadores(clinic_id);

-- ═══════════════════════════════════════════════════════════════
-- 5. INFLACION MODULE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.inflacion_mensual (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id         UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  mes               TEXT NOT NULL,           -- "Mar 2026"
  anio              INTEGER NOT NULL,
  mes_num           INTEGER NOT NULL,        -- 1-12
  ipc               NUMERIC(5,2) NOT NULL,
  facturado         NUMERIC(12,2) DEFAULT 0,
  cobrado           NUMERIC(12,2) DEFAULT 0,
  dias_demora       INTEGER DEFAULT 0,
  perdida_real      NUMERIC(12,2) DEFAULT 0,
  perdida_porcentaje NUMERIC(5,2) DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, anio, mes_num)
);

-- ═══════════════════════════════════════════════════════════════
-- 6. INVENTARIO MODULE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.inventario (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id      UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  nombre         TEXT NOT NULL,
  categoria      TEXT NOT NULL,
  presentacion   TEXT,
  stock          INTEGER NOT NULL DEFAULT 0,
  stock_minimo   INTEGER NOT NULL DEFAULT 0,
  unidad         TEXT DEFAULT 'unidad',
  precio_unitario NUMERIC(10,2) DEFAULT 0,
  proveedor      TEXT,
  ultima_compra  DATE,
  vencimiento    DATE,
  lote           TEXT,
  estado         TEXT GENERATED ALWAYS AS (
    CASE
      WHEN vencimiento IS NOT NULL AND vencimiento <= CURRENT_DATE THEN 'Vencido'
      WHEN stock <= 0 THEN 'Crítico'
      WHEN stock < stock_minimo THEN 'Bajo'
      ELSE 'OK'
    END
  ) STORED,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventario_clinic ON public.inventario(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventario_categoria ON public.inventario(categoria);

-- ═══════════════════════════════════════════════════════════════
-- 7. NOMENCLADOR MODULE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.nomenclador (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id            UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  codigo               TEXT NOT NULL,
  descripcion          TEXT NOT NULL,
  capitulo             TEXT NOT NULL,
  modulo               TEXT,
  valor_sss            NUMERIC(10,2) DEFAULT 0,
  valor_pami           NUMERIC(10,2) DEFAULT 0,
  valor_osde           NUMERIC(10,2) DEFAULT 0,
  valor_swiss          NUMERIC(10,2) DEFAULT 0,
  valor_galeno         NUMERIC(10,2) DEFAULT 0,
  vigente              BOOLEAN DEFAULT true,
  ultima_actualizacion DATE DEFAULT CURRENT_DATE,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, codigo)
);

CREATE INDEX IF NOT EXISTS idx_nomenclador_clinic ON public.nomenclador(clinic_id);
CREATE INDEX IF NOT EXISTS idx_nomenclador_capitulo ON public.nomenclador(capitulo);

-- ═══════════════════════════════════════════════════════════════
-- 8. REPORTES MODULE
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.reportes (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id      UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  nombre         TEXT NOT NULL,
  categoria      TEXT NOT NULL,
  descripcion    TEXT,
  formato        TEXT DEFAULT 'PDF',
  frecuencia     TEXT DEFAULT 'Mensual',
  ultima_generacion TIMESTAMPTZ,
  archivo_url    TEXT,
  generado_por   UUID REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════════════
-- 9. CLINICS ONBOARDING (multi-tenant setup)
-- ═══════════════════════════════════════════════════════════════

-- Add onboarding fields to clinics if not exist
DO $$ BEGIN
  ALTER TABLE public.clinics
    ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS logo_url TEXT,
    ADD COLUMN IF NOT EXISTS direccion TEXT,
    ADD COLUMN IF NOT EXISTS telefono TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT,
    ADD COLUMN IF NOT EXISTS especialidades TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS cantidad_profesionales INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS sistema_anterior TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.network_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interconsultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_estudio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rechazos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financiadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inflacion_mensual ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nomenclador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;

-- Generic RLS policy: clinic members can only see their own data
-- Using a DO block to avoid errors if policies already exist

DO $$ 
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'network_doctors','interconsultas','solicitudes_estudio',
    'facturas','rechazos','financiadores','inflacion_mensual',
    'inventario','nomenclador','reportes'
  ])
  LOOP
    EXECUTE format(
      'CREATE POLICY "Clinic isolation: %I" ON public.%I
       FOR ALL TO authenticated
       USING (clinic_id = public.get_clinic_id())
       WITH CHECK (clinic_id = public.get_clinic_id())',
      tbl, tbl
    );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END LOOP;
END $$;

-- Allow anon read for demo mode (public nomenclador)
DO $$ BEGIN
  CREATE POLICY "Public nomenclador read"
    ON public.nomenclador FOR SELECT
    TO anon
    USING (vigente = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- UPDATED_AT TRIGGERS
-- ═══════════════════════════════════════════════════════════════

-- Reusable trigger function (may already exist from 001)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'network_doctors','interconsultas','solicitudes_estudio',
    'facturas','rechazos','financiadores',
    'inventario','nomenclador','reportes'
  ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
       FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()',
      tbl
    );
  EXCEPTION WHEN duplicate_object THEN NULL;
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- ENABLE REALTIME for key tables
-- ═══════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE public.facturas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.interconsultas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inventario;
