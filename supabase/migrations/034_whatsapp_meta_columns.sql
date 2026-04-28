-- Migration 034: Add Meta Cloud API columns to whatsapp_config
-- + seed Centro Médico Roca's existing number (+54 11 2775-6496)
--
-- After running this, set the following env vars to activate sending:
--   META_WHATSAPP_PHONE_NUMBER_ID=<from Meta Business Manager>
--   META_WHATSAPP_ACCESS_TOKEN=<permanent system user token>
--
-- The phone number must first be migrated off the WhatsApp consumer/Business
-- app and registered under a WhatsApp Business Account in Meta Business Manager.

-- ── Add Meta Cloud API columns ────────────────────────────────
ALTER TABLE public.whatsapp_config
  ADD COLUMN IF NOT EXISTS provider          TEXT NOT NULL DEFAULT 'twilio'
    CHECK (provider IN ('twilio', 'meta')),
  ADD COLUMN IF NOT EXISTS meta_phone_number_id TEXT,   -- from Meta Business Manager
  ADD COLUMN IF NOT EXISTS meta_access_token    TEXT,   -- permanent system user token
  ADD COLUMN IF NOT EXISTS waba_id              TEXT;   -- WhatsApp Business Account ID

-- Rename legacy twilio columns to be explicit (non-breaking, old name still works)
ALTER TABLE public.whatsapp_config
  RENAME COLUMN twilio_sid   TO twilio_account_sid;

ALTER TABLE public.whatsapp_config
  RENAME COLUMN twilio_token TO twilio_auth_token;

-- ── Seed Centro Médico Roca ───────────────────────────────────
-- Clinic ID: cc7b1d0c-1150-40de-820e-7f216766cc9f
-- Number:    +54 11 2775-6496  →  E.164: +5491127756496
--
-- provider = 'meta' so whatsapp.ts uses Meta Cloud API path.
-- meta_phone_number_id and meta_access_token are set via env vars at runtime;
-- they are intentionally left NULL here — never commit real tokens to git.

INSERT INTO public.whatsapp_config (
  clinic_id,
  whatsapp_number,
  display_name,
  provider,
  meta_phone_number_id,
  meta_access_token,
  auto_reply,
  business_hours,
  welcome_message
) VALUES (
  'cc7b1d0c-1150-40de-820e-7f216766cc9f',
  '+5491127756496',
  'Centro Médico Roca',
  'meta',
  NULL,   -- set META_WHATSAPP_PHONE_NUMBER_ID in env
  NULL,   -- set META_WHATSAPP_ACCESS_TOKEN in env
  true,
  '08:00-20:00',
  '¡Hola! Gracias por comunicarte con Centro Médico Roca. Un miembro de nuestro equipo te responderá a la brevedad. ¿En qué podemos ayudarte?'
)
ON CONFLICT (clinic_id) DO UPDATE SET
  whatsapp_number      = EXCLUDED.whatsapp_number,
  display_name         = EXCLUDED.display_name,
  provider             = EXCLUDED.provider,
  updated_at           = now();
