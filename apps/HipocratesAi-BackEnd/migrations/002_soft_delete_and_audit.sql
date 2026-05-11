-- NOTE: DDL must be applied manually via Supabase SQL Editor.
-- The Supabase REST API (PostgREST) does not support arbitrary DDL,
-- and no SQL exec RPC is available in this project. Apply this file
-- in the Supabase Dashboard > SQL Editor before enabling the feature flags
-- ENABLE_SOFT_DELETE=true and ENABLE_AUDIT_LOG=true in the backend .env.

-- Soft delete column for patients
ALTER TABLE app.patients
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_patients_deleted_at
  ON app.patients (deleted_at)
  WHERE deleted_at IS NULL;

-- Audit log table (LGPD compliance - track who accessed/modified patient data)
CREATE TABLE IF NOT EXISTS app.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  actor_user_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON app.audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON app.audit_logs (actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON app.audit_logs (created_at DESC);
