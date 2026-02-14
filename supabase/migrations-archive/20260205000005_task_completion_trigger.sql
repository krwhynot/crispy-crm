/**
 * Task Completion Timeline Trigger
 *
 * Creates a timeline entry when a task is marked as completed.
 * Tasks are stored in the activities table with activity_type = 'task'.
 *
 * Events logged:
 * - Task completed: "Completed task: {title}"
 *
 * Uses existing 'note' type (no enum changes needed).
 *
 * NOTE: Only creates timeline entry if task has contact_id or organization_id.
 * Tasks without entity associations complete successfully but don't create
 * timeline entries (constraint: activities_require_entity_check).
 */

-- ============================================================================
-- TASK COMPLETION TRIGGER
-- ============================================================================
-- Fires when a task (activity_type='task') is marked as completed
CREATE OR REPLACE FUNCTION public.log_task_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only log when completed changes from false to true
  -- AND task has at least one entity ID (required by activities_require_entity_check constraint)
  IF (OLD.completed IS DISTINCT FROM NEW.completed)
     AND NEW.completed = true
     AND (NEW.contact_id IS NOT NULL OR NEW.organization_id IS NOT NULL) THEN
    INSERT INTO public.activities (
      activity_type,
      type,
      subject,
      description,
      contact_id,
      organization_id,
      opportunity_id,
      created_by,
      activity_date
    ) VALUES (
      'activity',
      'note',
      'Completed task: ' || COALESCE(NEW.subject, 'Untitled'),
      NEW.description,
      NEW.contact_id,
      NEW.organization_id,
      NEW.opportunity_id,
      COALESCE(public.current_sales_id(), NEW.sales_id),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.log_task_completed() OWNER TO postgres;

COMMENT ON FUNCTION public.log_task_completed() IS
  'Trigger function that logs a timeline entry when a task is marked as completed.';

DROP TRIGGER IF EXISTS trigger_log_task_completed ON public.activities;

CREATE TRIGGER trigger_log_task_completed
  AFTER UPDATE ON public.activities
  FOR EACH ROW
  WHEN (OLD.activity_type = 'task' AND OLD.completed IS DISTINCT FROM NEW.completed)
  EXECUTE FUNCTION public.log_task_completed();

COMMENT ON TRIGGER trigger_log_task_completed ON public.activities IS
  'Fires after a task is completed to log timeline entry.';

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- SELECT tgname, tgrelid::regclass FROM pg_trigger
-- WHERE tgname = 'trigger_log_task_completed';
