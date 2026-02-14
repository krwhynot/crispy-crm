-- Migration: Align task_type enum with simplified types
-- Date: 2025-11-28
-- Purpose: Standardize task types to 7 meaningful values: Call, Email, Meeting, Follow-up, Demo, Proposal, Other
--
-- Changes:
--   REMOVE: None, Discovery, Administrative
--   ADD: Demo, Other
--   KEEP: Call, Email, Meeting, Follow-up, Proposal
--
-- Data migration:
--   'None' -> 'Other' (catch-all for unspecified tasks)
--   'Discovery' -> 'Meeting' (discovery calls are meetings)
--   'Administrative' -> 'Other' (internal tasks)
--
-- DEPENDENCY: Must drop priority_tasks view (depends on tasks.type column)

BEGIN;

-- Step 0: Drop dependent view (will recreate after type change)
DROP VIEW IF EXISTS priority_tasks;

-- Step 1: Create a new enum type with the aligned values
CREATE TYPE task_type_new AS ENUM (
  'Call',
  'Email',
  'Meeting',
  'Follow-up',
  'Demo',
  'Proposal',
  'Other'
);

-- Step 2: Alter the column to use the new enum type
-- Use USING clause to map old values to new values in a single operation
ALTER TABLE tasks
  ALTER COLUMN type DROP DEFAULT;

ALTER TABLE tasks
  ALTER COLUMN type TYPE task_type_new
  USING (
    CASE type::text
      WHEN 'None' THEN 'Other'
      WHEN 'Discovery' THEN 'Meeting'
      WHEN 'Administrative' THEN 'Other'
      ELSE type::text
    END
  )::task_type_new;

ALTER TABLE tasks
  ALTER COLUMN type SET DEFAULT 'Call'::task_type_new;

-- Step 3: Drop the old enum type
DROP TYPE task_type;

-- Step 4: Rename the new type to the original name
ALTER TYPE task_type_new RENAME TO task_type;

-- Step 5: Update the default value reference (ensure it uses the renamed type)
ALTER TABLE tasks
  ALTER COLUMN type SET DEFAULT 'Call'::task_type;

-- Add comment documenting the enum values
COMMENT ON TYPE task_type IS 'Task type categories: Call (phone), Email (written), Meeting (in-person/virtual), Follow-up (reminders), Demo (product demonstrations), Proposal (formal offers), Other (miscellaneous)';

-- Step 6: Recreate the priority_tasks view with the new type
CREATE VIEW priority_tasks AS
SELECT
  -- React Admin required field
  t.id,

  -- Task identifiers
  t.id as task_id,
  t.title as task_title,
  t.due_date,
  t.priority,
  t.type as task_type,
  t.completed,

  -- Sales rep assignment (for assignee filter)
  t.sales_id,

  -- Opportunity details
  t.opportunity_id,
  o.name as opportunity_name,

  -- Customer organization details
  o.customer_organization_id as organization_id,
  org.name as customer_name,

  -- Principal organization details
  o.principal_organization_id,
  p.name as principal_name,

  -- Contact details
  c.id as contact_id,
  c.name as contact_name

FROM tasks t
LEFT JOIN opportunities o ON t.opportunity_id = o.id
LEFT JOIN organizations org ON o.customer_organization_id = org.id
LEFT JOIN organizations p ON o.principal_organization_id = p.id
LEFT JOIN contacts c ON t.contact_id = c.id

WHERE
  t.completed = false
  AND (t.due_date <= CURRENT_DATE + INTERVAL '7 days' OR t.priority IN ('high', 'critical'))
  AND p.organization_type = 'principal'

ORDER BY
  t.priority DESC,
  t.due_date ASC NULLS LAST;

-- Step 7: Restore permissions on the view
ALTER VIEW priority_tasks OWNER TO postgres;
GRANT SELECT ON priority_tasks TO authenticated;
GRANT SELECT ON priority_tasks TO anon;

COMMENT ON VIEW priority_tasks IS
  'Pre-aggregated high-priority and near-due tasks grouped by principal organization. '
  'Used by Dashboard V2 TasksPanel component for efficient task display. '
  'Filters: incomplete tasks that are either due within 7 days OR have high/critical priority. '
  'Note: Exposes both id (React Admin) and task_id (semantic) columns.';

COMMIT;
