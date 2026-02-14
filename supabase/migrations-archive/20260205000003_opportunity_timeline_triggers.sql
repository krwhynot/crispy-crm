/**
 * Opportunity Timeline Triggers
 *
 * Creates timeline entries when opportunities are created or archived.
 * Follows the proven pattern from log_opportunity_stage_change trigger.
 *
 * Events logged:
 * - Opportunity created: "Created opportunity: {name}"
 * - Opportunity archived: "Archived opportunity: {name}"
 *
 * Uses existing 'note' type (no enum changes needed).
 */

-- ============================================================================
-- OPPORTUNITY CREATE TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_opportunity_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.activities (
    activity_type,
    type,
    subject,
    description,
    opportunity_id,
    organization_id,
    created_by,
    activity_date
  ) VALUES (
    'activity',
    'note',
    'Created opportunity: ' || NEW.name,
    'New opportunity with stage: ' || COALESCE(NEW.stage::text, 'none'),
    NEW.id,
    NEW.customer_organization_id,
    NEW.opportunity_owner_id,
    NOW()
  );
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.log_opportunity_created() OWNER TO postgres;

COMMENT ON FUNCTION public.log_opportunity_created() IS
  'Trigger function that logs a timeline entry when an opportunity is created.';

DROP TRIGGER IF EXISTS trigger_log_opportunity_created ON public.opportunities;

CREATE TRIGGER trigger_log_opportunity_created
  AFTER INSERT ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.log_opportunity_created();

COMMENT ON TRIGGER trigger_log_opportunity_created ON public.opportunities IS
  'Fires after opportunity creation to log timeline entry.';

-- ============================================================================
-- OPPORTUNITY SOFT DELETE (ARCHIVE) TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION public.log_opportunity_archived()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only log when deleted_at changes from NULL to non-NULL (soft delete)
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO public.activities (
      activity_type,
      type,
      subject,
      description,
      opportunity_id,
      organization_id,
      created_by,
      activity_date
    ) VALUES (
      'activity',
      'note',
      'Archived opportunity: ' || NEW.name,
      'Opportunity moved to archive',
      NEW.id,
      NEW.customer_organization_id,
      COALESCE(public.current_sales_id(), NEW.opportunity_owner_id),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;

ALTER FUNCTION public.log_opportunity_archived() OWNER TO postgres;

COMMENT ON FUNCTION public.log_opportunity_archived() IS
  'Trigger function that logs a timeline entry when an opportunity is archived (soft deleted).';

DROP TRIGGER IF EXISTS trigger_log_opportunity_archived ON public.opportunities;

CREATE TRIGGER trigger_log_opportunity_archived
  AFTER UPDATE ON public.opportunities
  FOR EACH ROW
  WHEN (OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL)
  EXECUTE FUNCTION public.log_opportunity_archived();

COMMENT ON TRIGGER trigger_log_opportunity_archived ON public.opportunities IS
  'Fires after opportunity soft-delete to log archive timeline entry.';

-- ============================================================================
-- Verification Queries
-- ============================================================================
-- SELECT tgname, tgrelid::regclass FROM pg_trigger
-- WHERE tgname IN ('trigger_log_opportunity_created', 'trigger_log_opportunity_archived');
