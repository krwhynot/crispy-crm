-- Migration: Database Hardening
-- Fixes: DB-001, DB-002, DB-003, DB-004, DB-005
-- Adds missing foreign key indexes, soft-delete columns, and trigger functions

-- DB-001: Add FK index on tutorial_progress.sales_id (user reference)
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_sales_id
  ON public.tutorial_progress(sales_id);

-- DB-002: Add FK indexes on tutorial_progress foreign key references
-- These improve query performance and help with referential integrity checks
CREATE INDEX IF NOT EXISTS idx_tutorial_progress_created_organization_id
  ON public.tutorial_progress(created_organization_id);

CREATE INDEX IF NOT EXISTS idx_tutorial_progress_created_contact_id
  ON public.tutorial_progress(created_contact_id);

CREATE INDEX IF NOT EXISTS idx_tutorial_progress_created_opportunity_id
  ON public.tutorial_progress(created_opportunity_id);

CREATE INDEX IF NOT EXISTS idx_tutorial_progress_created_activity_id
  ON public.tutorial_progress(created_activity_id);

CREATE INDEX IF NOT EXISTS idx_tutorial_progress_created_task_id
  ON public.tutorial_progress(created_task_id);

-- DB-003: Add soft delete column to tutorial_progress
ALTER TABLE public.tutorial_progress
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment for soft-delete column
COMMENT ON COLUMN public.tutorial_progress.deleted_at IS
  'Soft delete timestamp. NULL = active record.';

-- DB-004: Add soft delete column to user_favorites if missing
-- Note: This table was already created with deleted_at, but adding for completeness
ALTER TABLE public.user_favorites
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comment for updated_at column
COMMENT ON COLUMN public.user_favorites.updated_at IS
  'Timestamp of last update. Set automatically by trigger.';

-- DB-005: Create set_updated_at trigger function
-- This function is used to automatically set updated_at on table updates
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tutorial_progress (has updated_at column)
DROP TRIGGER IF EXISTS set_updated_at_tutorial_progress ON public.tutorial_progress;

CREATE TRIGGER set_updated_at_tutorial_progress
BEFORE UPDATE ON public.tutorial_progress
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Apply trigger to user_favorites (has updated_at column after this migration)
DROP TRIGGER IF EXISTS set_updated_at_user_favorites ON public.user_favorites;

CREATE TRIGGER set_updated_at_user_favorites
BEFORE UPDATE ON public.user_favorites
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

-- Add audit comment for this migration
COMMENT ON TABLE public.tutorial_progress IS
  'Tracks first-time tutorial wizard progress per user. Includes soft-delete and updated_at tracking.';

COMMENT ON TABLE public.user_favorites IS
  'User-specific favorites for quick access to entities. Includes soft-delete and updated_at tracking.';
