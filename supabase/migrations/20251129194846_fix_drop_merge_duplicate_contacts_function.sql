-- Fix: Drop merge_duplicate_contacts with correct BIGINT signature
-- Previous migration 20251128063810 used UUID signature which didn't match
-- Per PRD Decision #32: Admin-only SQL cleanup is sufficient for duplicates

DROP FUNCTION IF EXISTS merge_duplicate_contacts(BIGINT, BIGINT[]);
