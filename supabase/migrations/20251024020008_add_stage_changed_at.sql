-- Migration: Add stage_changed_at column for days-in-stage calculation
-- Purpose: Track when opportunity last changed stage (not just updated)

-- Add column with default NOW() for existing records
ALTER TABLE opportunities
ADD COLUMN stage_changed_at TIMESTAMPTZ DEFAULT NOW();

COMMENT ON COLUMN opportunities.stage_changed_at IS
  'Timestamp when opportunity last changed stage. Used for days-in-stage calculations.';

-- Create trigger function to update stage_changed_at
CREATE OR REPLACE FUNCTION update_stage_changed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update timestamp if stage actually changed
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    NEW.stage_changed_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_stage_changed_at IS
  'Updates stage_changed_at timestamp only when stage column changes';

-- Create trigger on opportunities table
DROP TRIGGER IF EXISTS update_stage_timestamp ON opportunities;

CREATE TRIGGER update_stage_timestamp
  BEFORE UPDATE OF stage ON opportunities
  FOR EACH ROW
  EXECUTE FUNCTION update_stage_changed_at();
