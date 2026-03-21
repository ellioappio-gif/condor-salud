-- ═══════════════════════════════════════════════════════════════
-- Migration 010 — Push Subscriptions table
-- Stores Web Push (VAPID) subscriptions for push notifications
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint    TEXT NOT NULL UNIQUE,
  keys        JSONB NOT NULL,                         -- { p256dh, auth }
  user_agent  TEXT DEFAULT '',
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE push_subscriptions IS 'Web Push VAPID subscriptions per user device';
COMMENT ON COLUMN push_subscriptions.keys IS 'JSON: { p256dh: string, auth: string }';

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions (user_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY push_subs_own_select ON push_subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY push_subs_own_insert ON push_subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY push_subs_own_delete ON push_subscriptions
  FOR DELETE USING (auth.uid() = user_id);

-- Service role can read all (for cron / push sending)
CREATE POLICY push_subs_service_all ON push_subscriptions
  FOR ALL USING (auth.role() = 'service_role');
