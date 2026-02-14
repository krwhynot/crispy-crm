-- Fixes Critical Data Integrity Issue:
-- The index idx_sales_unique_non_user blocks importing an account manager
-- if a previous one with the same name was soft-deleted.

BEGIN;

-- 1. Drop the broken index
DROP INDEX IF EXISTS idx_sales_unique_non_user;

-- 2. Re-create with Soft Delete Filter
CREATE UNIQUE INDEX idx_sales_unique_non_user
    ON sales (first_name, last_name)
    WHERE user_id IS NULL AND deleted_at IS NULL;

COMMENT ON INDEX idx_sales_unique_non_user IS
'Ensures imported account manager names (user_id=NULL) are unique. Only enforces on active (non-deleted) records.';

COMMIT;
