-- Add stage_changed_at Column and Trigger
--
-- This migration adds:
-- 1. stage_changed_at column to track when an opportunity last changed stage
-- 2. Trigger function to update timestamp only when stage changes
-- 3. Trigger to automatically update stage_changed_at on stage changes
--
-- Purpose:
-- - Calculate "days in stage" for attention flags
-- - Distinguish stage changes from other updates
-- - Track stage transition history

-- ============================================================================
-- ADD COLUMN: stage_changed_at
-- ============================================================================

-- Add stage_changed_at column with DEFAULT NOW() for existing records
-- Existing records get current timestamp since we don't have historical data
ALTER TABLE opportunities
  ADD COLUMN IF NOT EXISTS stage_changed_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN opportunities.stage_changed_at IS
  'Timestamp when the opportunity last changed stage (not just any update). Used for calculating days in stage.';

-- ============================================================================
-- TRIGGER FUNCTION: Update stage_changed_at on Stage Change
-- ============================================================================

-- Create trigger function that only updates timestamp when stage changes
CREATE OR REPLACE FUNCTION public.update_stage_changed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only update stage_changed_at if the stage actually changed
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    NEW.stage_changed_at := NOW();
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_stage_changed_at() IS
  'Automatically updates stage_changed_at timestamp when opportunity stage changes. Does not update on other field changes.';

-- ============================================================================
-- TRIGGER: Apply to opportunities table
-- ============================================================================

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS update_stage_changed_at_trigger ON opportunities;

-- Create trigger on opportunities table
CREATE TRIGGER update_stage_changed_at_trigger
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stage_changed_at();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- To verify the column exists:
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'opportunities' AND column_name = 'stage_changed_at';

-- To verify the trigger works:
-- UPDATE opportunities SET stage = 'discovery' WHERE id = '<some-id>';
-- SELECT id, stage, stage_changed_at, updated_at FROM opportunities WHERE id = '<some-id>';
-- (stage_changed_at should be newer than previous value)

-- To verify non-stage updates don't trigger:
-- UPDATE opportunities SET description = 'Test' WHERE id = '<some-id>';
-- SELECT id, stage, stage_changed_at, updated_at FROM opportunities WHERE id = '<some-id>';
-- (stage_changed_at should remain unchanged, but updated_at should be new)
