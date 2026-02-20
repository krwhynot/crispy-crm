-- ============================================================================
-- 20260219000001_add_missing_fk_indexes.sql
-- ============================================================================
-- PURPOSE: Index 3 unindexed foreign key columns caught by 050-performance-indexes.test.sql
--
-- Without these indexes, JOINs and DELETE cascades on these columns cause
-- sequential scans (O(n) instead of O(log n)).
--
-- Columns:
--   1. activities.updated_by    → FK to sales(id)
--   2. product_features.created_by → FK to sales(id)
--   3. products.principal_id    → FK to organizations(id)
-- ============================================================================

-- NOTE: Not using CONCURRENTLY because Supabase migrations run inside a transaction.
-- For production deployment on large tables, consider running these manually with CONCURRENTLY.
CREATE INDEX IF NOT EXISTS idx_activities_updated_by
  ON public.activities (updated_by);

CREATE INDEX IF NOT EXISTS idx_product_features_created_by
  ON public.product_features (created_by);

CREATE INDEX IF NOT EXISTS idx_products_principal_id
  ON public.products (principal_id);
