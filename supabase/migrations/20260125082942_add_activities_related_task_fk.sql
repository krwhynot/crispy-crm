-- Drop existing FK if it references old tasks_deprecated table
ALTER TABLE activities
DROP CONSTRAINT IF EXISTS activities_related_task_id_fkey;

-- Add self-referential FK for related_task_id (referencing activities table for STI pattern)
ALTER TABLE activities
ADD CONSTRAINT activities_related_task_id_fkey
  FOREIGN KEY (related_task_id)
  REFERENCES activities(id)
  ON DELETE SET NULL;

-- Add index for FK performance
CREATE INDEX IF NOT EXISTS idx_activities_related_task_id
ON activities (related_task_id)
WHERE related_task_id IS NOT NULL AND deleted_at IS NULL;

COMMENT ON CONSTRAINT activities_related_task_id_fkey ON activities IS
  'Self-referential FK: A task can reference another task as its parent/predecessor';
