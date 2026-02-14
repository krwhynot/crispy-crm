-- Add snooze_until column for task snoozing functionality
-- Industry standard pattern: NULL = active, future timestamp = snoozed until that time
-- Queries filter: WHERE snooze_until IS NULL OR snooze_until <= NOW()

ALTER TABLE tasks ADD COLUMN snooze_until TIMESTAMPTZ DEFAULT NULL;

COMMENT ON COLUMN tasks.snooze_until IS 'Timestamp until which this task is snoozed (hidden from active task views). NULL means task is active.';

-- Add index for efficient filtering of snoozed tasks
CREATE INDEX idx_tasks_snooze_until ON tasks (snooze_until) WHERE snooze_until IS NOT NULL;
