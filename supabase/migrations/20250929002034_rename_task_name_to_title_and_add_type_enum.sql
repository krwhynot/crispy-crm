-- Migration: Rename task 'name' to 'title' and add task_type enum
-- Purpose: Better naming clarity and add industry-standard task types
-- Before: tasks.name (confusing with contact names)
-- After: tasks.title (clear it's the task title) + tasks.type enum

BEGIN;

-- Step 1: Rename 'name' column to 'title' for clarity
ALTER TABLE tasks RENAME COLUMN name TO title;

-- Step 2: Create task_type enum with industry-standard values
CREATE TYPE task_type AS ENUM (
  'Call',           -- Phone conversations
  'Email',          -- Email communications
  'Meeting',        -- In-person/virtual meetings & demos
  'Follow-up',      -- Re-engagement reminders
  'Proposal',       -- Quotes and proposals
  'Discovery',      -- Needs analysis & qualification
  'Administrative', -- Internal tasks
  'None'           -- Default/unspecified (for backward compatibility)
);

-- Step 3: Add type column using the enum
ALTER TABLE tasks
ADD COLUMN type task_type DEFAULT 'None'::task_type;

-- Step 4: Update any existing tasks that might have type data elsewhere
-- (Currently type is stored in frontend config only, so all will be 'None' initially)

-- Step 5: Add comment for documentation
COMMENT ON COLUMN tasks.title IS 'Brief title describing the task';
COMMENT ON COLUMN tasks.description IS 'Optional detailed description of the task';
COMMENT ON COLUMN tasks.type IS 'Category of task activity (Call, Email, Meeting, etc.)';

COMMIT;