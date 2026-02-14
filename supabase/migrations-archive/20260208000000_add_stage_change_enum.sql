-- ============================================================================
-- Migration: Add 'stage_change' to interaction_type enum
-- ============================================================================
-- Part of Timeline/Activity System Remediation
-- Enables filtering for stage change activities specifically
-- ============================================================================

ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'stage_change';
