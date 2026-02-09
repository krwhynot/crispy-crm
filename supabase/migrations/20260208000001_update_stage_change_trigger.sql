-- ============================================================================
-- Migration: Update stage change trigger for simplified model
-- ============================================================================
-- Changes:
-- 1. activity_type: 'interaction' -> 'activity' (simplified model)
-- 2. type: 'note' -> 'stage_change' (enables filtering)
-- 3. created_by: opportunity_owner_id -> current_sales_id() (actor attribution)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_opportunity_stage_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Required to bypass RLS when inserting activity
SET search_path TO 'public'
AS $$
BEGIN
  -- Only proceed if stage actually changed (NULL-safe comparison)
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
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
      'activity',      -- was 'interaction' - align with simplified model
      'stage_change',  -- was 'note' - enable filtering
      'Stage changed from ' || COALESCE(OLD.stage::text, 'none') || ' to ' || COALESCE(NEW.stage::text, 'none'),
      'Pipeline stage automatically updated from "' || COALESCE(OLD.stage::text, 'none') || '" to "' || COALESCE(NEW.stage::text, 'none') || '".',
      NEW.id,
      NEW.customer_organization_id,
      COALESCE(current_sales_id(), NEW.opportunity_owner_id),  -- actor attribution with fallback
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Set ownership for consistency
ALTER FUNCTION public.log_opportunity_stage_change() OWNER TO postgres;

-- Add updated function documentation
COMMENT ON FUNCTION public.log_opportunity_stage_change() IS
'Trigger function that logs an activity record when an opportunity stage changes.
Creates an activity-type stage_change entry with old and new stage values for audit trail.
Uses actor attribution (current_sales_id) with owner fallback.
Updated: 2026-02-08 - Simplified model migration';
