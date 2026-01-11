-- ============================================================================
-- Migration: Add audit columns to user_favorites table
-- ============================================================================
-- Audit Issue: DB-002 - Missing updated_at, updated_by columns
-- Pattern: Standard audit columns per existing table patterns
-- ============================================================================

-- Step 1: Add updated_at column with default
ALTER TABLE user_favorites
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Step 2: Add updated_by column with foreign key to auth.users
ALTER TABLE user_favorites
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Step 3: Backfill updated_at for existing records (use created_at as initial value)
UPDATE user_favorites
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Step 4: Backfill updated_by for existing records (use user_id as initial value)
UPDATE user_favorites
SET updated_by = user_id
WHERE updated_by IS NULL;

-- Step 5: Add comments
COMMENT ON COLUMN user_favorites.updated_at IS 'Timestamp of last update. Defaults to NOW().';
COMMENT ON COLUMN user_favorites.updated_by IS 'UUID of auth.users who last updated this record.';

-- Step 6: Create trigger to auto-update updated_at on UPDATE
CREATE OR REPLACE FUNCTION update_user_favorites_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_user_favorites_updated_at
  BEFORE UPDATE ON user_favorites
  FOR EACH ROW
  EXECUTE FUNCTION update_user_favorites_updated_at();
