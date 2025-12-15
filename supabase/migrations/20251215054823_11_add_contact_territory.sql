-- Territory assignment fields
-- NOTE: department column ALREADY EXISTS - not adding it

-- Add columns if they don't exist
DO $$
BEGIN
  -- district_code
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'district_code'
  ) THEN
    ALTER TABLE contacts ADD COLUMN district_code TEXT;
  END IF;

  -- territory_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'territory_name'
  ) THEN
    ALTER TABLE contacts ADD COLUMN territory_name TEXT;
  END IF;

  -- department already exists, skip it
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contacts_district
  ON contacts(district_code)
  WHERE district_code IS NOT NULL;

COMMENT ON COLUMN contacts.district_code IS 'District: D1, D73, etc.';
COMMENT ON COLUMN contacts.territory_name IS 'Territory: Western Suburbs';
