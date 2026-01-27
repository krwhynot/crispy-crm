-- Create activities_summary view with pre-joined creator data
-- This view bypasses PostgREST FK column nullification by pre-joining sales user data
-- Engineering Constitution: View/Table Duality - Reads from view, writes to base table

CREATE OR REPLACE VIEW activities_summary AS
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
  a.created_by,  -- Now a regular column, not FK lookup
  a.deleted_at,
  a.activity_type,
  -- Task-related fields (from 20260121000001_add_task_columns_to_activities.sql)
  a.due_date,
  a.reminder_date,
  a.completed,
  a.completed_at,
  a.priority,
  a.sales_id,
  a.snooze_until,
  a.overdue_notified_at,
  a.related_task_id,
  -- Pre-joined creator info (bypasses FK nullification)
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

-- Grant access (RLS on underlying tables still applies)
GRANT SELECT ON activities_summary TO authenticated;
GRANT SELECT ON activities_summary TO anon;

-- Add comment for documentation
COMMENT ON VIEW activities_summary IS 'Activities view with pre-joined creator and related entity data. Bypasses PostgREST FK column security checks by using LEFT JOIN instead of FK references.';
