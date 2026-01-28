-- Task 2 Database Verification Script
-- Run with: npx supabase db shell < verify-task2.sql

\echo '=== Task 2 Database Verification ==='
\echo ''

-- 1. Verify Product Soft Deletes
\echo '[1/5] Checking product soft deletes...'
SELECT
  COUNT(*) as total_products,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as deleted_count,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as active_count
FROM products;

\echo ''
\echo 'Recent deleted products:'
SELECT
  id,
  name,
  deleted_at,
  EXTRACT(EPOCH FROM (NOW() - deleted_at)) / 60 as minutes_ago
FROM products
WHERE deleted_at IS NOT NULL
ORDER BY deleted_at DESC
LIMIT 5;

\echo ''

-- 2. Verify Product-Distributor Associations
\echo '[2/5] Checking product-distributor associations...'
SELECT
  COUNT(*) as total_associations,
  COUNT(DISTINCT product_id) as unique_products,
  COUNT(DISTINCT distributor_id) as unique_distributors
FROM product_distributors;

\echo ''
\echo 'Recent product-distributor associations:'
SELECT
  pd.product_id,
  p.name as product_name,
  pd.distributor_id,
  o.name as distributor_name,
  pd.created_at
FROM product_distributors pd
JOIN products p ON pd.product_id = p.id
JOIN organizations o ON pd.distributor_id = o.id
WHERE p.deleted_at IS NULL
ORDER BY pd.created_at DESC
LIMIT 5;

\echo ''

-- 3. Verify Opportunity-Product Associations
\echo '[3/5] Checking opportunity-product associations...'
SELECT
  COUNT(*) as total_associations,
  COUNT(DISTINCT opportunity_id) as unique_opportunities,
  COUNT(DISTINCT product_id) as unique_products
FROM opportunity_products;

\echo ''
\echo 'Recent opportunity-product associations:'
SELECT
  op.opportunity_id,
  opp.name as opportunity_name,
  op.product_id,
  p.name as product_name,
  op.created_at
FROM opportunity_products op
JOIN opportunities opp ON op.opportunity_id = opp.id
JOIN products p ON op.product_id = p.id
WHERE opp.deleted_at IS NULL
  AND p.deleted_at IS NULL
ORDER BY op.created_at DESC
LIMIT 5;

\echo ''

-- 4. Verify RPC Function Existence
\echo '[4/5] Checking RPC function availability...'
SELECT
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  CASE
    WHEN p.proname = 'sync_opportunity_products' THEN '✅ Found'
    ELSE '❌ Missing'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('sync_opportunity_products', 'archive_opportunity');

\echo ''

-- 5. Check for Data Integrity Issues
\echo '[5/5] Checking data integrity...'

\echo 'Orphaned product-distributor associations (should be 0):'
SELECT COUNT(*) as orphaned_count
FROM product_distributors pd
LEFT JOIN products p ON pd.product_id = p.id
LEFT JOIN organizations o ON pd.distributor_id = o.id
WHERE p.id IS NULL OR o.id IS NULL;

\echo ''
\echo 'Orphaned opportunity-product associations (should be 0):'
SELECT COUNT(*) as orphaned_count
FROM opportunity_products op
LEFT JOIN opportunities opp ON op.opportunity_id = opp.id
LEFT JOIN products p ON op.product_id = p.id
WHERE opp.id IS NULL OR p.id IS NULL;

\echo ''
\echo 'Products without distributors (may be intentional):'
SELECT COUNT(*) as products_without_distributors
FROM products p
WHERE p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM product_distributors pd
    WHERE pd.product_id = p.id
  );

\echo ''
\echo '=== Database Verification Complete ==='
\echo ''
\echo 'Expected Results:'
\echo '  ✅ Soft deletes show deleted_at timestamps'
\echo '  ✅ Associations have valid foreign keys'
\echo '  ✅ RPC function sync_opportunity_products exists'
\echo '  ✅ Zero orphaned records'
\echo ''
