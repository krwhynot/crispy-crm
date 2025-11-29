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

BEGIN;

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

-- Step 2: Migrate existing data by casting through text
-- First, update any values that need mapping
UPDATE tasks
SET type = 'Other'::task_type
WHERE type = 'None'::task_type;

UPDATE tasks
SET type = 'Meeting'::task_type
WHERE type = 'Discovery'::task_type;

UPDATE tasks
SET type = 'Other'::task_type
WHERE type = 'Administrative'::task_type;

-- Step 3: Alter the column to use the new enum type
-- We need to use USING to cast the values
ALTER TABLE tasks
  ALTER COLUMN type DROP DEFAULT;

ALTER TABLE tasks
  ALTER COLUMN type TYPE task_type_new
  USING type::text::task_type_new;

ALTER TABLE tasks
  ALTER COLUMN type SET DEFAULT 'Call'::task_type_new;

-- Step 4: Drop the old enum type
DROP TYPE task_type;

-- Step 5: Rename the new type to the original name
ALTER TYPE task_type_new RENAME TO task_type;

-- Step 6: Update the default value reference (ensure it uses the renamed type)
ALTER TABLE tasks
  ALTER COLUMN type SET DEFAULT 'Call'::task_type;

-- Add comment documenting the enum values
COMMENT ON TYPE task_type IS 'Task type categories: Call (phone), Email (written), Meeting (in-person/virtual), Follow-up (reminders), Demo (product demonstrations), Proposal (formal offers), Other (miscellaneous)';

COMMIT;
