/**
 * Add stage_changed_at Field to Opportunities Table
 *
 * This migration adds tracking for when an opportunity's stage last changed,
 * enabling the principal-centric dashboard to identify "stuck" opportunities
 * (opportunities that have been in the same stage for 30+ days).
 *
 * Changes:
 * 1. Add stage_changed_at column (timestamp with time zone)
 * 2. Initialize existing records with created_at (reasonable default)
 * 3. Create trigger to automatically update stage_changed_at when stage changes
 *
 * Related to: Principal-Centric Dashboard (PRD 14-dashboard.md)
 */

-- Add stage_changed_at column to track when opportunity stage last changed
ALTER TABLE opportunities
ADD COLUMN stage_changed_at timestamp with time zone;

-- Initialize stage_changed_at for existing records
-- Use created_at as a reasonable default (opportunity starts in new_lead stage)
UPDATE opportunities
SET stage_changed_at = created_at
WHERE stage_changed_at IS NULL;

-- Make stage_changed_at NOT NULL now that all records have a value
ALTER TABLE opportunities
ALTER COLUMN stage_changed_at SET NOT NULL;

-- Set default to now() for new records
ALTER TABLE opportunities
ALTER COLUMN stage_changed_at SET DEFAULT now();

-- Add comment for documentation
COMMENT ON COLUMN opportunities.stage_changed_at IS 'Timestamp when the opportunity stage was last changed. Automatically updated by trigger when stage field changes. Used for identifying stuck opportunities (30+ days in same stage).';

-- Create trigger function to automatically update stage_changed_at when stage changes
CREATE OR REPLACE FUNCTION update_opportunity_stage_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update stage_changed_at if the stage actually changed
  IF (TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage) THEN
    NEW.stage_changed_at = now();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function before update
DROP TRIGGER IF EXISTS trigger_update_opportunity_stage_changed_at ON opportunities;
CREATE TRIGGER trigger_update_opportunity_stage_changed_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_opportunity_stage_changed_at();

-- Add comment for trigger documentation
COMMENT ON TRIGGER trigger_update_opportunity_stage_changed_at ON opportunities IS 'Automatically updates stage_changed_at whenever the stage field is modified. Used to track how long opportunities have been in their current stage.';
