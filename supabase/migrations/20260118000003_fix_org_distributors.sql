-- Fix organization_distributors unique constraint to support soft-delete reuse
-- Issue: Rigid unique constraint blocks re-adding a distributor after soft-delete
-- Solution: Convert to partial index

BEGIN;

-- Drop the rigid unique constraint
ALTER TABLE organization_distributors
    DROP CONSTRAINT IF EXISTS uq_organization_distributor;

-- Create partial unique index that only enforces on active records
CREATE UNIQUE INDEX idx_organization_distributors_unique_active
    ON organization_distributors (organization_id, distributor_id)
    WHERE deleted_at IS NULL;

COMMIT;
