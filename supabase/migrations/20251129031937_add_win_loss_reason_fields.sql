-- =====================================================
-- Migration: Add Win/Loss Reason Fields (TODO-004a)
-- PRD Reference: Section 5.3, MVP #12, #47
-- Industry Standard: Salesforce/HubSpot require reasons on close
-- =====================================================

-- Create win_reason enum type
-- Reasons why deals are won
CREATE TYPE win_reason AS ENUM (
  'relationship',        -- Strong existing relationship with customer
  'product_quality',     -- Superior product quality/fit
  'price_competitive',   -- Competitive pricing
  'timing',              -- Right timing for customer needs
  'other'                -- Free-text reason required
);

-- Create loss_reason enum type
-- Reasons why deals are lost
CREATE TYPE loss_reason AS ENUM (
  'price_too_high',           -- Price not competitive
  'no_authorization',         -- Distributor not authorized for principal
  'competitor_relationship',  -- Customer has existing competitor relationship
  'product_fit',              -- Product doesn't meet customer needs
  'timing',                   -- Bad timing (budget, seasonality, etc.)
  'no_response',              -- Customer became unresponsive
  'other'                     -- Free-text reason required
);

-- Add win/loss reason columns to opportunities table
-- Note: Application layer enforces conditional requirement (win_reason required when closed_won)
ALTER TABLE opportunities
ADD COLUMN IF NOT EXISTS win_reason win_reason DEFAULT NULL,
ADD COLUMN IF NOT EXISTS loss_reason loss_reason DEFAULT NULL,
ADD COLUMN IF NOT EXISTS close_reason_notes TEXT DEFAULT NULL;

-- Add constraint for close_reason_notes length (matches Zod schema)
ALTER TABLE opportunities
ADD CONSTRAINT opportunities_close_reason_notes_length
CHECK (close_reason_notes IS NULL OR LENGTH(close_reason_notes) <= 500);

-- Add comment for documentation
COMMENT ON COLUMN opportunities.win_reason IS 'Required when stage = closed_won. Per PRD Section 5.3, MVP #12.';
COMMENT ON COLUMN opportunities.loss_reason IS 'Required when stage = closed_lost. Per PRD Section 5.3, MVP #12.';
COMMENT ON COLUMN opportunities.close_reason_notes IS 'Required when win_reason or loss_reason = other. Max 500 chars.';

-- =====================================================
-- Indexes for reporting queries
-- =====================================================

-- Index for win/loss reason analysis reports
CREATE INDEX IF NOT EXISTS idx_opportunities_win_reason ON opportunities(win_reason) WHERE win_reason IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_opportunities_loss_reason ON opportunities(loss_reason) WHERE loss_reason IS NOT NULL;

-- Composite index for closed deals reporting
CREATE INDEX IF NOT EXISTS idx_opportunities_closed_stage_reason
ON opportunities(stage, win_reason, loss_reason)
WHERE stage IN ('closed_won', 'closed_lost');
