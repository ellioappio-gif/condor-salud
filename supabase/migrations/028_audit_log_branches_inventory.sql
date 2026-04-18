-- Migration 028: Audit log table
-- Required for Ley 25.326 compliance — "who accessed patient X at time Y"
-- Referenced by: P0-5 from world-class enterprise audit 2026-04-17

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clinic_id UUID REFERENCES clinics(id),
  user_id UUID REFERENCES profiles(id),
  user_role TEXT,
  action TEXT NOT NULL,  -- 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN'
  resource_type TEXT NOT NULL,  -- 'patient' | 'prescription' | 'appointment' etc.
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  request_path TEXT
);

-- ─── Indexes ─────────────────────────────────────────────────
CREATE INDEX idx_audit_log_clinic_id ON audit_log(clinic_id);
CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);

-- ─── RLS ─────────────────────────────────────────────────────
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only clinic admins can read audit logs
CREATE POLICY "audit_log_clinic_admin_read" ON audit_log
  FOR SELECT USING (
    clinic_id IN (
      SELECT p.clinic_id FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Insert-only for application (service role bypasses RLS)
CREATE POLICY "audit_log_insert_only" ON audit_log
  FOR INSERT WITH CHECK (true);

-- ─── Branches table (INF-1 groundwork) ──────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "branches_clinic_isolation" ON branches
  FOR ALL USING (
    clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid())
  );
CREATE INDEX idx_branches_clinic_id ON branches(clinic_id);

-- Add nullable branch_id to key tables for future multi-branch support
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE turnos ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id);

-- ─── Inventory movements table (P2-9) ───────────────────────
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES inventario(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('ingreso', 'egreso', 'ajuste')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  performed_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inventory_movements_clinic_isolation" ON inventory_movements
  FOR ALL USING (
    clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid())
  );
CREATE INDEX idx_inventory_movements_item_id ON inventory_movements(item_id);
CREATE INDEX idx_inventory_movements_clinic_id ON inventory_movements(clinic_id);

-- Add lot_number and expiry_date to inventario (P2-9)
ALTER TABLE inventario ADD COLUMN IF NOT EXISTS lot_number TEXT;
ALTER TABLE inventario ADD COLUMN IF NOT EXISTS expiry_date DATE;
