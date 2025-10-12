-- Migration: Normalize contact email and phone fields from objects to arrays
-- Purpose: Fix data structure inconsistency causing console warnings
-- Before: {"primary": "email@example.com", "work": "work@example.com"}
-- After: [{"email": "email@example.com", "type": "primary"}, {"email": "work@example.com", "type": "work"}]

BEGIN;

-- Convert email objects to arrays
UPDATE contacts
SET email = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'email', value,
      'type', key
    )
  )
  FROM jsonb_each_text(email)
)
WHERE jsonb_typeof(email) = 'object';

-- Convert phone objects to arrays
UPDATE contacts
SET phone = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'phone', value,
      'type', key
    )
  )
  FROM jsonb_each_text(phone)
)
WHERE jsonb_typeof(phone) = 'object';

-- Verify migration success
DO $$
DECLARE
  object_count INTEGER;
BEGIN
  -- Check if any objects remain
  SELECT COUNT(*)
  INTO object_count
  FROM contacts
  WHERE jsonb_typeof(email) = 'object'
     OR jsonb_typeof(phone) = 'object';

  IF object_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % contacts still have object format', object_count;
  END IF;
END $$;

COMMIT;