-- Add reminder tracking column to turnos table
ALTER TABLE turnos
  ADD COLUMN IF NOT EXISTS reminder_sent_at timestamptz;

-- Partial index for efficient cron lookups
CREATE INDEX IF NOT EXISTS idx_turnos_reminder_pending
  ON turnos (fecha)
  WHERE reminder_sent_at IS NULL;
