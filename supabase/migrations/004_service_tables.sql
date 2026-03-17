-- ─── 004: Service Tables for Dashboard Modules ──────────────
-- Extends the core schema (002) with additional columns and new tables.
-- Safe to run multiple times (all operations are IF NOT EXISTS / idempotent).
-- Run in Supabase SQL Editor.

-- ═══════════════════════════════════════════════════════════════
-- 1. NEW TABLES — Interconsultas Module
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

-- Inflacion mensual (separate from 002's inflacion table)
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
-- 2. ALTER EXISTING TABLES — add missing columns from 002
-- ═══════════════════════════════════════════════════════════════

-- ─── facturas: add lote_id, notas ────────────────────────────
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS lote_id TEXT;
ALTER TABLE public.facturas ADD COLUMN IF NOT EXISTS notas TEXT;

-- ─── rechazos: add resuelto_por, fecha_resolucion ────────────
ALTER TABLE public.rechazos ADD COLUMN IF NOT EXISTS resuelto_por TEXT;
ALTER TABLE public.rechazos ADD COLUMN IF NOT EXISTS fecha_resolucion DATE;

-- ─── financiadores: add contact/billing columns ──────────────
ALTER TABLE public.financiadores ADD COLUMN IF NOT EXISTS cuit TEXT;
ALTER TABLE public.financiadores ADD COLUMN IF NOT EXISTS contacto_email TEXT;
ALTER TABLE public.financiadores ADD COLUMN IF NOT EXISTS contacto_telefono TEXT;
ALTER TABLE public.financiadores ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE public.financiadores ADD COLUMN IF NOT EXISTS ultima_liquidacion TEXT;
ALTER TABLE public.financiadores ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true;

-- ─── inventario: add extended columns ────────────────────────
ALTER TABLE public.inventario ADD COLUMN IF NOT EXISTS presentacion TEXT;
ALTER TABLE public.inventario ADD COLUMN IF NOT EXISTS stock_minimo INTEGER DEFAULT 0;
ALTER TABLE public.inventario ADD COLUMN IF NOT EXISTS precio_unitario NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.inventario ADD COLUMN IF NOT EXISTS ultima_compra DATE;

-- Backfill stock_minimo from old 'minimo' column if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inventario' AND column_name = 'minimo'
  ) THEN
    UPDATE public.inventario SET stock_minimo = minimo WHERE stock_minimo = 0 AND minimo > 0;
  END IF;
END $$;

-- ─── nomenclador: add clinic_id + missing columns ───────────
ALTER TABLE public.nomenclador ADD COLUMN IF NOT EXISTS clinic_id UUID REFERENCES public.clinics(id) ON DELETE CASCADE;
ALTER TABLE public.nomenclador ADD COLUMN IF NOT EXISTS modulo TEXT;
ALTER TABLE public.nomenclador ADD COLUMN IF NOT EXISTS valor_sss NUMERIC(10,2) DEFAULT 0;

-- ─── reportes: add extended columns ─────────────────────────
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS frecuencia TEXT DEFAULT 'Mensual';
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS ultima_generacion TIMESTAMPTZ;
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS archivo_url TEXT;
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS generado_por UUID REFERENCES auth.users(id);
ALTER TABLE public.reportes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ─── Indexes for new tables ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_facturas_fecha_desc ON public.facturas(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_inflacion_mensual_clinic ON public.inflacion_mensual(clinic_id);
CREATE INDEX IF NOT EXISTS idx_inventario_categoria ON public.inventario(categoria);
CREATE INDEX IF NOT EXISTS idx_nomenclador_capitulo ON public.nomenclador(capitulo);

-- ═══════════════════════════════════════════════════════════════
-- 3. CLINICS ONBOARDING (multi-tenant setup)
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS cantidad_profesionales INTEGER DEFAULT 1;
ALTER TABLE public.clinics ADD COLUMN IF NOT EXISTS sistema_anterior TEXT;

-- ═══════════════════════════════════════════════════════════════
-- 4. RLS POLICIES
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.network_doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interconsultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_estudio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inflacion_mensual ENABLE ROW LEVEL SECURITY;

-- RLS for new tables (002 already handles facturas, rechazos, etc.)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'network_doctors','interconsultas','solicitudes_estudio','inflacion_mensual'
  ])
  LOOP
    BEGIN
      EXECUTE format(
        'CREATE POLICY "Clinic isolation: %I" ON public.%I
         FOR ALL TO authenticated
         USING (clinic_id = public.get_clinic_id())
         WITH CHECK (clinic_id = public.get_clinic_id())',
        tbl, tbl
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- Nomenclador: clinic-scoped policy (allows NULL clinic_id for shared codes)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'nomenclador' AND column_name = 'clinic_id'
  ) THEN
    BEGIN
      EXECUTE 'CREATE POLICY "Clinic isolation: nomenclador" ON public.nomenclador
               FOR ALL TO authenticated
               USING (clinic_id IS NULL OR clinic_id = public.get_clinic_id())
               WITH CHECK (clinic_id = public.get_clinic_id())';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- Allow anon read for nomenclador (public codes)
DO $$ BEGIN
  CREATE POLICY "Public nomenclador read"
    ON public.nomenclador FOR SELECT
    TO anon
    USING (vigente = true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 5. UPDATED_AT TRIGGERS
-- ═══════════════════════════════════════════════════════════════

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
    'network_doctors','interconsultas','solicitudes_estudio'
  ])
  LOOP
    BEGIN
      EXECUTE format(
        'CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I
         FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at()',
        tbl
      );
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- 6. ENABLE REALTIME for key tables
-- ═══════════════════════════════════════════════════════════════

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.interconsultas;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.inflacion_mensual;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
