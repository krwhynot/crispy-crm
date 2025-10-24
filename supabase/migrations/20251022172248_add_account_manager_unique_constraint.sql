-- Migration: Add Account Manager Support for Imported Names
-- Purpose: Allow sales table to store both auth users and imported text-only names
--
-- The sales table serves as the canonical "Account Managers" table:
-- - Records with user_id NOT NULL = authenticated system users
-- - Records with user_id = NULL = imported names from CSV (e.g., "Craig", "Brent")
--
-- This migration adds a partial unique index to prevent duplicate imported names
-- while still allowing multiple auth users with the same name (distinguished by user_id)

-- Create partial unique index for imported account manager names
-- This ensures "Craig" with user_id=NULL can only exist once
-- But "Craig Smith" (user_id=123) and "Craig Jones" (user_id=456) can both exist
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_unique_non_user
ON sales (first_name, last_name)
WHERE user_id IS NULL;

-- Add comment for documentation
COMMENT ON INDEX idx_sales_unique_non_user IS
'Ensures imported account manager names (user_id=NULL) are unique by first_name + last_name combination';

-- Optional: Create views for cleaner frontend queries
-- These views denormalize the account manager name for easier display and filtering

CREATE OR REPLACE VIEW contacts_with_account_manager AS
SELECT
  c.*,
  COALESCE(
    s.first_name || COALESCE(' ' || s.last_name, ''),
    'Unassigned'
  ) AS account_manager_name,
  s.user_id IS NOT NULL AS account_manager_is_user
FROM contacts c
LEFT JOIN sales s ON c.sales_id = s.id;

CREATE OR REPLACE VIEW organizations_with_account_manager AS
SELECT
  o.*,
  COALESCE(
    s.first_name || COALESCE(' ' || s.last_name, ''),
    'Unassigned'
  ) AS account_manager_name,
  s.user_id IS NOT NULL AS account_manager_is_user
FROM organizations o
LEFT JOIN sales s ON o.sales_id = s.id;

-- Add comments for views
COMMENT ON VIEW contacts_with_account_manager IS
'Contacts with denormalized account manager name for easier querying';

COMMENT ON VIEW organizations_with_account_manager IS
'Organizations with denormalized account manager name for easier querying';
