-- Migration: Re-add tasks.sales_id index for future scalability
-- Context: Index was originally created in 20251127055705, removed in 20251129230638 as unused
-- Reason for re-adding: Proactive performance optimization for anticipated user growth
--
-- This partial index improves query performance for:
-- - Dashboard task queries filtered by sales rep
-- - "My Tasks" list view
-- - Task count calculations per user

-- Create partial index on tasks.sales_id for incomplete tasks only
-- Using partial index to reduce index size and improve write performance
CREATE INDEX IF NOT EXISTS idx_tasks_sales_id_not_completed
ON tasks(sales_id)
WHERE completed_at IS NULL AND deleted_at IS NULL;

-- Add comment for documentation
COMMENT ON INDEX idx_tasks_sales_id_not_completed IS
'Partial index for querying incomplete tasks by sales rep. Re-added 2025-12-12 for future scalability.';
