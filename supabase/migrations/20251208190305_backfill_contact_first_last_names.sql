-- Migration: Backfill first_name/last_name from name field
--
-- Problem: Grand Rapids campaign migration (20251111185058) inserted 369 contacts
-- with only the `name` field populated, leaving first_name/last_name as NULL.
-- This causes empty contact displays in the UI.
--
-- Solution: Split the `name` field into first_name and last_name

-- Backfill contacts where first_name AND last_name are both NULL but name exists
UPDATE contacts
SET
  first_name = COALESCE(
    NULLIF(TRIM(split_part(name, ' ', 1)), ''),
    'Unknown'
  ),
  last_name = COALESCE(
    NULLIF(TRIM(substring(name FROM position(' ' IN name) + 1)), ''),
    ''
  )
WHERE first_name IS NULL
  AND last_name IS NULL
  AND name IS NOT NULL
  AND TRIM(name) != '';

-- Log the count of affected rows for verification
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO affected_count
  FROM contacts
  WHERE first_name IS NOT NULL
    AND last_name IS NOT NULL;
  RAISE NOTICE 'Contacts with populated first_name/last_name: %', affected_count;
END $$;
