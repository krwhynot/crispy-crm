-- Migration: Log opportunity stage changes as activities
-- Purpose: Automatically create an activity record whenever an opportunity's stage changes
-- This provides audit trail and activity feed visibility for pipeline progression

-- =====================================================
-- TRIGGER FUNCTION: log_opportunity_stage_change
-- =====================================================
-- Fires AFTER UPDATE on opportunities when stage changes
-- Creates an 'interaction' activity of type 'note' documenting the change

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
      'interaction',  -- Linked to opportunity, so 'interaction' not 'engagement'
      'note',         -- Stage change is documented as a note
      'Stage changed from ' || COALESCE(OLD.stage::text, 'none') || ' to ' || COALESCE(NEW.stage::text, 'none'),
      'Pipeline stage automatically updated from "' || COALESCE(OLD.stage::text, 'none') || '" to "' || COALESCE(NEW.stage::text, 'none') || '".',
      NEW.id,
      NEW.customer_organization_id,  -- Link to the customer organization
      NEW.opportunity_owner_id,      -- Attribute to opportunity owner
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Set ownership for consistency
ALTER FUNCTION public.log_opportunity_stage_change() OWNER TO postgres;

-- Add function documentation
COMMENT ON FUNCTION public.log_opportunity_stage_change() IS
'Trigger function that logs an activity record when an opportunity stage changes.
Creates an interaction-type note with old and new stage values for audit trail.';

-- =====================================================
-- TRIGGER: trigger_log_opportunity_stage_change
-- =====================================================
-- Drop existing trigger if present (idempotent deployment)
DROP TRIGGER IF EXISTS trigger_log_opportunity_stage_change ON public.opportunities;

-- Create AFTER UPDATE trigger
-- AFTER (not BEFORE) because we want the update to succeed first
-- FOR EACH ROW to process each updated opportunity individually
CREATE TRIGGER trigger_log_opportunity_stage_change
  AFTER UPDATE ON public.opportunities
  FOR EACH ROW
  WHEN (OLD.stage IS DISTINCT FROM NEW.stage)  -- Trigger-level condition for efficiency
  EXECUTE FUNCTION public.log_opportunity_stage_change();

-- Add trigger documentation
COMMENT ON TRIGGER trigger_log_opportunity_stage_change ON public.opportunities IS
'Fires after opportunity stage changes to create an activity audit record.';
