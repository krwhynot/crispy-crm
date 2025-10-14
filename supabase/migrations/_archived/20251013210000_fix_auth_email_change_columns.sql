-- Fix auth.users columns that cause GoTrue scan errors
-- Issue: email_change and email_change_token_new allow NULL without defaults
-- This causes "converting NULL to string is unsupported" errors in GoTrue v2.179.0

-- Grant postgres user necessary permissions to modify auth schema
GRANT ALL ON TABLE auth.users TO postgres;

-- Fix email_change column
-- Step 1: Update existing NULL values to empty strings
UPDATE auth.users
SET email_change = ''
WHERE email_change IS NULL;

-- Step 2: Set column default to empty string for future inserts
ALTER TABLE auth.users
ALTER COLUMN email_change SET DEFAULT '';

-- Step 3: Enforce NOT NULL constraint to prevent future NULLs
ALTER TABLE auth.users
ALTER COLUMN email_change SET NOT NULL;

-- Fix email_change_token_new column
-- Step 1: Update existing NULL values to empty strings
UPDATE auth.users
SET email_change_token_new = ''
WHERE email_change_token_new IS NULL;

-- Step 2: Set column default to empty string for future inserts
ALTER TABLE auth.users
ALTER COLUMN email_change_token_new SET DEFAULT '';

-- Step 3: Enforce NOT NULL constraint to prevent future NULLs
ALTER TABLE auth.users
ALTER COLUMN email_change_token_new SET NOT NULL;
