-- =====================================================================
-- Add Test User Metadata Table
-- =====================================================================
-- This table tracks test user creation for the automated script.
-- It stores metadata about test users including their role, creation
-- details, and counts of test data associated with each user.
-- =====================================================================

-- Create test_user_metadata table
CREATE TABLE IF NOT EXISTS public.test_user_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'sales_director', 'account_manager')),
  created_by TEXT DEFAULT 'automated_script',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ,
  test_data_counts JSONB DEFAULT '{
    "contacts": 0,
    "organizations": 0,
    "opportunities": 0,
    "activities": 0,
    "tasks": 0,
    "notes": 0
  }'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.test_user_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to read test metadata
CREATE POLICY "Test metadata readable by authenticated users"
  ON public.test_user_metadata
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- RLS Policy: Allow service role to perform all operations
CREATE POLICY "Test metadata writable by service role"
  ON public.test_user_metadata
  FOR ALL
  USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_test_user_metadata_user_id ON public.test_user_metadata(user_id);
CREATE INDEX idx_test_user_metadata_role ON public.test_user_metadata(role);