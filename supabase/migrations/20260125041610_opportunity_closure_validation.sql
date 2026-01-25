-- Migration: Opportunity Closure Validation Trigger
-- Purpose: Enforce business rule that closed opportunities must have a reason
-- Reference: WF-01 Workflow Integrity

-- Create validation function
CREATE OR REPLACE FUNCTION validate_opportunity_closure()
RETURNS TRIGGER AS $$
BEGIN
  -- Validate closed_won requires win_reason
  IF NEW.stage = 'closed_won' AND (NEW.win_reason IS NULL OR NEW.win_reason = '') THEN
    RAISE EXCEPTION 'win_reason is required when closing opportunity as won'
      USING
        ERRCODE = 'check_violation',
        DETAIL = 'Opportunity stage cannot be set to closed_won without specifying a win reason',
        HINT = 'Please select a reason from: price, quality, relationship, or other';
  END IF;

  -- Validate closed_lost requires loss_reason
  IF NEW.stage = 'closed_lost' AND (NEW.loss_reason IS NULL OR NEW.loss_reason = '') THEN
    RAISE EXCEPTION 'loss_reason is required when closing opportunity as lost'
      USING
        ERRCODE = 'check_violation',
        DETAIL = 'Opportunity stage cannot be set to closed_lost without specifying a loss reason',
        HINT = 'Please select a reason from: price, quality, relationship, no_authorization, competitor, or other';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Add comment for documentation
COMMENT ON FUNCTION validate_opportunity_closure() IS
  'Validates that opportunities closed as won/lost have required reason fields populated. Prevents data quality issues from client-side validation bypasses.';

-- Drop trigger if exists (for idempotent migrations)
DROP TRIGGER IF EXISTS trg_validate_opportunity_closure ON opportunities;

-- Create trigger on opportunities table
CREATE TRIGGER trg_validate_opportunity_closure
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  WHEN (NEW.stage IN ('closed_won', 'closed_lost'))
  EXECUTE FUNCTION validate_opportunity_closure();

-- Add comment for documentation
COMMENT ON TRIGGER trg_validate_opportunity_closure ON opportunities IS
  'Enforces business rule: closed opportunities (won/lost) must have corresponding reason field populated. Fires on UPDATE when stage changes to closed_won or closed_lost.';
