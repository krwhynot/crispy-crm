-- ============================================================================
-- Migration: Add CHECK constraints for opportunity win/loss business rules
-- ============================================================================
-- Purpose: Enforce win/loss validation at database level (defense in depth)
--
-- Business Rules (per PRD Section 5.3, MVP #12, #47):
--   1. closed_won stage REQUIRES win_reason (cannot close as won without reason)
--   2. closed_lost stage REQUIRES loss_reason (cannot close as lost without reason)
--
-- Defense in Depth:
--   - App layer: Zod validation in opportunities-operations.ts (.refine())
--   - DB layer: CHECK constraints below (single source of truth)
--
-- Constraint Logic:
--   CHECK (stage != 'closed_won' OR win_reason IS NOT NULL)
--   - Reads as: "Either the stage is NOT closed_won, OR win_reason must exist"
--   - Only enforces win_reason when stage IS closed_won
--   - Allows NULL win_reason for all other stages
-- ============================================================================

-- Constraint 1: closed_won requires win_reason
-- Prevents closing deals as won without explaining why we won
ALTER TABLE opportunities
ADD CONSTRAINT opportunities_closed_won_check
CHECK (stage != 'closed_won' OR win_reason IS NOT NULL);

COMMENT ON CONSTRAINT opportunities_closed_won_check ON opportunities IS
  'Business rule: closed_won stage requires win_reason. Per PRD Section 5.3, MVP #12.';

-- Constraint 2: closed_lost requires loss_reason
-- Prevents closing deals as lost without explaining why we lost
ALTER TABLE opportunities
ADD CONSTRAINT opportunities_closed_lost_check
CHECK (stage != 'closed_lost' OR loss_reason IS NOT NULL);

COMMENT ON CONSTRAINT opportunities_closed_lost_check ON opportunities IS
  'Business rule: closed_lost stage requires loss_reason. Per PRD Section 5.3, MVP #12.';
