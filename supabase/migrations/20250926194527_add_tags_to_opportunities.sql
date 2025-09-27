-- Migration: Add tags field to opportunities table
-- Purpose: Allow tagging opportunities for better categorization and filtering
-- Author: Generated for learning purposes
-- Date: 2025-09-26

-- Add the tags column as an array of text
ALTER TABLE opportunities
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Add a comment to document the column's purpose
COMMENT ON COLUMN opportunities.tags IS 'Array of tags for categorizing opportunities (e.g., urgent, big-deal, repeat-customer)';

-- Create an index for better performance when searching by tags
CREATE INDEX idx_opportunities_tags ON opportunities USING GIN (tags);

-- Add some example tags to existing opportunities (optional - for demonstration)
-- This shows how to update data in a migration
UPDATE opportunities
SET tags = ARRAY['sample-data', 'initial-import']
WHERE created_at < '2025-09-26'
LIMIT 3;