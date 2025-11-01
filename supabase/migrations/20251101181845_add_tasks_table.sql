-- Migration: Add tasks table with proper two-layer security
-- Created: 2025-11-01
-- Purpose: Personal task management - users can only see/manage their own tasks

-- Step 1: Create the tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Step 3: GRANT base permissions to authenticated role (Layer 1 - Table Permissions)
-- This allows authenticated users to perform operations on the table
-- RLS policies (Layer 2) will then filter which specific rows they can access
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;

-- Step 4: Create RLS policies for row filtering (Layer 2 - Row Level Security)
-- Users can only SELECT their own tasks
CREATE POLICY authenticated_select_tasks ON tasks
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Users can only INSERT tasks for themselves
CREATE POLICY authenticated_insert_tasks ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only UPDATE their own tasks
CREATE POLICY authenticated_update_tasks ON tasks
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Users can only DELETE their own tasks
CREATE POLICY authenticated_delete_tasks ON tasks
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Add helpful indexes for performance
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
