-- ─── Migration 010: Reminder & Payment Config Tables ─────────
-- Supports /api/config/recordatorios and /api/config/pagos endpoints.
-- Each table is scoped to clinic_id for multi-tenant isolation.

-- ─── Reminder Config ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS reminder_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  auto_send BOOLEAN NOT NULL DEFAULT true,
  send_24h BOOLEAN NOT NULL DEFAULT true,
  send_2h BOOLEAN NOT NULL DEFAULT true,
  send_post_visit BOOLEAN NOT NULL DEFAULT false,
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id)
);

CREATE TABLE IF NOT EXISTS reminder_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'recordatorio',
  timing TEXT NOT NULL DEFAULT '24 horas antes',
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, template_id)
);

-- ─── Payment Config ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  mp_connected BOOLEAN NOT NULL DEFAULT false,
  mp_access_token TEXT,
  auto_billing BOOLEAN NOT NULL DEFAULT false,
  send_receipt BOOLEAN NOT NULL DEFAULT true,
  payment_reminder BOOLEAN NOT NULL DEFAULT true,
  accepted_methods TEXT[] NOT NULL DEFAULT ARRAY['efectivo','debito','credito','transferencia','mercadopago'],
  copay_enabled BOOLEAN NOT NULL DEFAULT false,
  default_currency TEXT NOT NULL DEFAULT 'ARS',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id)
);

CREATE TABLE IF NOT EXISTS billing_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  financiador TEXT NOT NULL,
  copago BOOLEAN NOT NULL DEFAULT false,
  monto TEXT NOT NULL DEFAULT '0',
  auto_charge BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, financiador)
);

CREATE TABLE IF NOT EXISTS patient_payment_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  ultimos4 TEXT NOT NULL DEFAULT '****',
  alias TEXT,
  vencimiento TEXT,
  auto_billing BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id),
  fecha TIMESTAMPTZ NOT NULL DEFAULT now(),
  paciente TEXT NOT NULL,
  concepto TEXT NOT NULL,
  monto NUMERIC(12,2) NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'Pendiente',
  metodo TEXT NOT NULL DEFAULT 'efectivo',
  mp_payment_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ─── Row Level Security ──────────────────────────────────────

ALTER TABLE reminder_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- Clinic members can read/write their own config
CREATE POLICY "Clinic members manage reminder config"
  ON reminder_config FOR ALL
  USING (clinic_id IN (SELECT clinic_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Clinic members manage reminder templates"
  ON reminder_templates FOR ALL
  USING (clinic_id IN (SELECT clinic_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Clinic members manage payment config"
  ON payment_config FOR ALL
  USING (clinic_id IN (SELECT clinic_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Clinic members manage billing rules"
  ON billing_rules FOR ALL
  USING (clinic_id IN (SELECT clinic_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Clinic members view payment methods"
  ON patient_payment_methods FOR ALL
  USING (clinic_id IN (SELECT clinic_id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Clinic members view transactions"
  ON payment_transactions FOR ALL
  USING (clinic_id IN (SELECT clinic_id FROM profiles WHERE user_id = auth.uid()));

-- ─── Indexes ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_reminder_templates_clinic ON reminder_templates(clinic_id);
CREATE INDEX IF NOT EXISTS idx_billing_rules_clinic ON billing_rules(clinic_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_clinic_fecha ON payment_transactions(clinic_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_patient_payment_methods_clinic ON patient_payment_methods(clinic_id);
