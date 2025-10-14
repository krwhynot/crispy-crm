-- =====================================================================
-- Remove Subcategory Column from Products
-- Date: 2025-10-13
--
-- Removes subcategory field - category alone provides sufficient organization
-- for MVP food product catalog.
--
-- Related to: Aggressive MVP product form simplification
-- =====================================================================

-- Drop subcategory column from products table
ALTER TABLE public.products
    DROP COLUMN IF EXISTS subcategory;

COMMENT ON COLUMN products.category IS 'Primary category - sufficient for MVP organization without subcategory granularity';
