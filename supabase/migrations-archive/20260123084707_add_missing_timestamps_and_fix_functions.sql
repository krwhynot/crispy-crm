-- ============================================================================
-- ADD MISSING TIMESTAMP COLUMNS AND FIX SECURITY DEFINER FUNCTIONS
-- ============================================================================
-- Audit Reference: Data Integrity Audit 2026-01-23
-- Issues Fixed:
--   H-DI-001 through H-DI-005: Missing updated_at on 5 tables
--   H-DI-006: Missing deleted_at on tutorial_progress (already fixed in 20260122184338)
--   H-DI-007: Unsecured search_path in SECURITY DEFINER function
-- ============================================================================

-- ============================================================================
-- PHASE 1: Add updated_at column to 5 tables missing it
-- ============================================================================

-- 1.1 interaction_participants
ALTER TABLE interaction_participants
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.2 notifications
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.3 opportunity_contacts
ALTER TABLE opportunity_contacts
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.4 segments
ALTER TABLE segments
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 1.5 user_favorites
ALTER TABLE user_favorites
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- PHASE 2: Create updated_at triggers for the 5 tables
-- ============================================================================
-- Note: update_updated_at_column() function already exists from 20260122184338

-- 2.1 interaction_participants
DROP TRIGGER IF EXISTS update_interaction_participants_updated_at ON interaction_participants;
CREATE TRIGGER update_interaction_participants_updated_at
    BEFORE UPDATE ON interaction_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2.2 notifications
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2.3 opportunity_contacts
DROP TRIGGER IF EXISTS update_opportunity_contacts_updated_at ON opportunity_contacts;
CREATE TRIGGER update_opportunity_contacts_updated_at
    BEFORE UPDATE ON opportunity_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2.4 segments
DROP TRIGGER IF EXISTS update_segments_updated_at ON segments;
CREATE TRIGGER update_segments_updated_at
    BEFORE UPDATE ON segments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2.5 user_favorites
DROP TRIGGER IF EXISTS update_user_favorites_updated_at ON user_favorites;
CREATE TRIGGER update_user_favorites_updated_at
    BEFORE UPDATE ON user_favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PHASE 3: Fix SECURITY DEFINER function missing SET search_path
-- ============================================================================
-- Issue: set_activity_created_by() uses SECURITY DEFINER without SET search_path
-- Risk: Potential pg_temp schema poisoning attack (CWE-426)
-- Fix: Recreate function with SET search_path = public

CREATE OR REPLACE FUNCTION public.set_activity_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only set if not already provided
  IF NEW.created_by IS NULL THEN
    NEW.created_by := public.current_sales_id();
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_activity_created_by IS
  'Auto-populates created_by with current sales ID if not provided. Security hardened 2026-01-23.';

-- ============================================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================================
--
-- 1. Check all 5 tables have updated_at column:
--    SELECT table_name, column_name
--    FROM information_schema.columns
--    WHERE column_name = 'updated_at'
--      AND table_name IN ('interaction_participants', 'notifications',
--                         'opportunity_contacts', 'segments', 'user_favorites');
--    Expected: 5 rows
--
-- 2. Check triggers exist:
--    SELECT event_object_table, trigger_name
--    FROM information_schema.triggers
--    WHERE trigger_name LIKE 'update_%_updated_at'
--      AND event_object_table IN ('interaction_participants', 'notifications',
--                                  'opportunity_contacts', 'segments', 'user_favorites');
--    Expected: 5 rows
--
-- 3. Check set_activity_created_by has search_path:
--    SELECT proname, proconfig
--    FROM pg_proc
--    WHERE proname = 'set_activity_created_by'
--      AND pronamespace = 'public'::regnamespace;
--    Expected: proconfig contains search_path=public
-- ============================================================================
