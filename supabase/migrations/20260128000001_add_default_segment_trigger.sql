-- Add trigger to auto-fill segment_id with "Unknown" segment
-- This provides defense-in-depth when form/API validation is bypassed

-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION set_default_segment_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.segment_id IS NULL THEN
    -- Default to "Unknown" segment
    NEW.segment_id := '22222222-2222-4222-8222-000000000009';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create the BEFORE INSERT trigger
DROP TRIGGER IF EXISTS set_default_segment_id_trigger ON organizations;
CREATE TRIGGER set_default_segment_id_trigger
  BEFORE INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION set_default_segment_id();

-- Step 3: Backfill any existing null values
UPDATE organizations
SET segment_id = '22222222-2222-4222-8222-000000000009'
WHERE segment_id IS NULL;

-- Step 4: Add NOT NULL constraint
ALTER TABLE organizations
ALTER COLUMN segment_id SET NOT NULL;

-- Step 5: Update column comment
COMMENT ON COLUMN organizations.segment_id IS 'Required: Playbook category segment. Must reference segments.id. Trigger auto-fills with Unknown segment if NULL.';
