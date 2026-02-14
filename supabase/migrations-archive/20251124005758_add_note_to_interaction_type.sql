-- =====================================================================
-- Migration: Add 'note' to interaction_type enum
-- =====================================================================
-- Purpose: Allow "Note" activity type in Quick Logger
-- Root Cause: Frontend activitySchema includes "Note" but database enum
--             only had: call, email, meeting, demo, proposal, follow_up,
--             trade_show, site_visit, contract_review, check_in, social
-- =====================================================================

-- Add 'note' to the interaction_type enum
-- PostgreSQL allows adding values to enums safely
ALTER TYPE interaction_type ADD VALUE IF NOT EXISTS 'note';

-- Comment for documentation
COMMENT ON TYPE interaction_type IS 'Activity interaction types: call, email, meeting, demo, proposal, follow_up, trade_show, site_visit, contract_review, check_in, social, note';
