-- ============================================================================
-- Migration 1/2: Add 'activity' enum value
-- ============================================================================
-- PostgreSQL requires ALTER TYPE ... ADD VALUE to commit before the new value
-- can be used in DML statements. This migration ONLY adds the enum value.
-- The backfill and constraint changes happen in the next migration.
--
-- Part of: Simplify Activity Types (remove engagement/interaction distinction)
-- ============================================================================

ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'activity';
