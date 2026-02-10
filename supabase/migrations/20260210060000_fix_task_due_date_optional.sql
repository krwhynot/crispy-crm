-- Fix check_task_required_fields constraint to allow optional due_date
-- Resolves Q8 policy: "Tasks without due date are allowed"
--
-- BEFORE: (activity_type <> 'task') OR (due_date IS NOT NULL AND sales_id IS NOT NULL)
-- AFTER:  (activity_type <> 'task') OR (sales_id IS NOT NULL)
--
-- sales_id remains required for tasks (Q7 policy: tasks without owner blocked)

ALTER TABLE activities DROP CONSTRAINT check_task_required_fields;

ALTER TABLE activities ADD CONSTRAINT check_task_required_fields
  CHECK (activity_type <> 'task' OR sales_id IS NOT NULL);
