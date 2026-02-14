-- Fix: Add missing updated_by column to activities table
-- Root cause: protect_audit_fields() trigger (migration 20260125000006) tries to set
-- NEW.updated_by on ALL tables including activities, but activities lacked this column.
-- This caused "record 'new' has no field 'updated_by'" on every UPDATE to activities.
-- Symptom: Task completion, editing, and any activity update failed.

-- Step 1: Add updated_by column (matches pattern of contacts, organizations, opportunities, products)
ALTER TABLE activities ADD COLUMN updated_by BIGINT REFERENCES sales(id);

-- Step 2: Backfill existing records (set updated_by = created_by for historical consistency)
UPDATE activities SET updated_by = created_by WHERE updated_by IS NULL;

-- Step 3: Drop and recreate activities_summary view to include updated_by
-- Cannot use CREATE OR REPLACE because adding updated_by changes column order
DROP VIEW IF EXISTS activities_summary;

CREATE VIEW activities_summary AS
SELECT
  a.id,
  a.type,
  a.subject,
  a.description,
  a.activity_date,
  a.duration_minutes,
  a.contact_id,
  a.organization_id,
  a.opportunity_id,
  a.follow_up_required,
  a.follow_up_date,
  a.outcome,
  a.created_at,
  a.updated_at,
  a.created_by,
  a.updated_by,
  a.deleted_at,
  a.activity_type,
  -- Task-related fields
  a.due_date,
  a.reminder_date,
  a.completed,
  a.completed_at,
  a.priority,
  a.sales_id,
  a.snooze_until,
  a.overdue_notified_at,
  a.related_task_id,
  -- Pre-joined creator info
  s.first_name AS creator_first_name,
  s.last_name AS creator_last_name,
  s.email AS creator_email,
  s.avatar_url AS creator_avatar_url,
  -- Pre-joined names for display
  c.first_name || ' ' || COALESCE(c.last_name, '') AS contact_name,
  o.name AS organization_name,
  opp.name AS opportunity_name
FROM activities a
LEFT JOIN sales s ON a.created_by = s.id AND s.deleted_at IS NULL
LEFT JOIN contacts c ON a.contact_id = c.id AND c.deleted_at IS NULL
LEFT JOIN organizations o ON a.organization_id = o.id AND o.deleted_at IS NULL
LEFT JOIN opportunities opp ON a.opportunity_id = opp.id AND opp.deleted_at IS NULL
WHERE a.deleted_at IS NULL;

-- Re-grant access (required after DROP/CREATE)
GRANT SELECT ON activities_summary TO authenticated;
GRANT SELECT ON activities_summary TO anon;

COMMENT ON VIEW activities_summary IS 'Activities view with pre-joined creator and related entity data. Includes updated_by for audit trail compatibility.';
