-- Migration: Fix phone field key from 'phone' to 'number'
-- Purpose: Match frontend expectation where TextField expects source="number"
-- Before: [{"phone": "415-555-1001", "type": "mobile"}]
-- After: [{"number": "415-555-1001", "type": "mobile"}]

BEGIN;

-- Update phone array objects to use 'number' key instead of 'phone'
UPDATE contacts
SET phone = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'number', elem->'phone',
      'type', elem->'type'
    )
  )
  FROM jsonb_array_elements(phone) AS elem
)
WHERE jsonb_typeof(phone) = 'array'
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(phone) AS elem
    WHERE elem ? 'phone'
  );

-- Verify migration success
DO $$
DECLARE
  incorrect_count INTEGER;
BEGIN
  -- Check if any phone objects still have 'phone' key instead of 'number'
  SELECT COUNT(*)
  INTO incorrect_count
  FROM contacts, jsonb_array_elements(phone) AS elem
  WHERE elem ? 'phone';

  IF incorrect_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % phone entries still have incorrect key', incorrect_count;
  END IF;
END $$;

COMMIT;