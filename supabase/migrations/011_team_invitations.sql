-- Team invitations table
-- Stores pending invitations for team members to join a clinic.

CREATE TABLE IF NOT EXISTS team_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'recepcion' CHECK (role IN ('admin', 'medico', 'facturacion', 'recepcion')),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for token lookup (used in accept flow)
CREATE INDEX IF NOT EXISTS idx_team_invitations_token ON team_invitations(token);
-- Index for listing invitations per clinic
CREATE INDEX IF NOT EXISTS idx_team_invitations_clinic ON team_invitations(clinic_id, status);
-- Index for checking duplicate invitations
CREATE INDEX IF NOT EXISTS idx_team_invitations_email_clinic ON team_invitations(email, clinic_id, status);

-- RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Admins of the clinic can manage invitations
CREATE POLICY "Clinic admins can manage invitations"
  ON team_invitations FOR ALL
  USING (
    clinic_id IN (
      SELECT p.clinic_id FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Anyone can read their own invitation by token (for accept flow via service role)
-- The accept endpoint uses service role or the token-based public API.
