-- ================================================================
-- DATA QUALITY ANALYSIS QUERIES FOR ATOMIC CRM
-- ================================================================
-- Purpose: Analyze gaps between database structure and UI implementation
-- Generated: 2025-10-31
-- Database: PostgreSQL 15 (Supabase)
--
-- Usage: Run these queries against your local Supabase instance:
--   psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f data-quality-analysis.sql
--
-- All queries are READ-ONLY (SELECT statements only)
-- ================================================================

\echo '================================================================'
\echo 'ATOMIC CRM DATA QUALITY ANALYSIS'
\echo 'Generated: 2025-10-31'
\echo '================================================================'
\echo ''

-- ================================================================
-- SECTION 1: NULL FIELD ANALYSIS
-- ================================================================
-- Identifies database columns that are rarely or never used in the UI
-- Helps prioritize which fields to populate or remove from schema
-- ================================================================

\echo ''
\echo '----------------------------------------------------------------'
\echo 'SECTION 1: NULL FIELD ANALYSIS'
\echo '----------------------------------------------------------------'

-- 1.1 Contacts: NULL Field Distribution
-- Identifies which contact fields are empty and by what percentage
\echo ''
\echo '1.1 CONTACTS: NULL Field Distribution'
\echo '-------------------------------------'

SELECT
  'Total Active Contacts' as metric,
  COUNT(*) as count,
  '100%' as percentage
FROM contacts
WHERE deleted_at IS NULL

UNION ALL

-- Address fields (identified as unused in UI comparison)
SELECT
  'address (NULL)' as metric,
  COUNT(*) FILTER (WHERE address IS NULL OR address = '') as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE address IS NULL OR address = '') / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL

UNION ALL

SELECT
  'city (NULL)' as metric,
  COUNT(*) FILTER (WHERE city IS NULL OR city = '') as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE city IS NULL OR city = '') / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL

UNION ALL

SELECT
  'state (NULL)' as metric,
  COUNT(*) FILTER (WHERE state IS NULL OR state = '') as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE state IS NULL OR state = '') / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL

UNION ALL

SELECT
  'postal_code (NULL)' as metric,
  COUNT(*) FILTER (WHERE postal_code IS NULL OR postal_code = '') as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE postal_code IS NULL OR postal_code = '') / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL

UNION ALL

SELECT
  'country (NULL)' as metric,
  COUNT(*) FILTER (WHERE country IS NULL OR country = '') as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE country IS NULL OR country = '') / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL

UNION ALL

-- Personal details (not in UI)
SELECT
  'birthday (NULL)' as metric,
  COUNT(*) FILTER (WHERE birthday IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE birthday IS NULL) / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL

UNION ALL

SELECT
  'gender (NULL)' as metric,
  COUNT(*) FILTER (WHERE gender IS NULL OR gender = '') as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE gender IS NULL OR gender = '') / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL

UNION ALL

-- Social media (not in UI)
SELECT
  'twitter_handle (NULL)' as metric,
  COUNT(*) FILTER (WHERE twitter_handle IS NULL OR twitter_handle = '') as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE twitter_handle IS NULL OR twitter_handle = '') / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL

UNION ALL

-- Activity tracking (system fields)
SELECT
  'first_seen (NULL)' as metric,
  COUNT(*) FILTER (WHERE first_seen IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE first_seen IS NULL) / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL

UNION ALL

SELECT
  'last_seen (NULL)' as metric,
  COUNT(*) FILTER (WHERE last_seen IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE last_seen IS NULL) / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL

ORDER BY metric;


-- 1.2 Organizations: Financial Data Gaps
-- All organizations are missing annual_revenue and employee_count
\echo ''
\echo '1.2 ORGANIZATIONS: Financial Data Gaps'
\echo '----------------------------------------'

SELECT
  'Total Active Organizations' as metric,
  COUNT(*) as count,
  '100%' as percentage
FROM organizations
WHERE deleted_at IS NULL

UNION ALL

SELECT
  'annual_revenue (NULL)' as metric,
  COUNT(*) FILTER (WHERE annual_revenue IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE annual_revenue IS NULL) / COUNT(*), 1) || '%' as percentage
FROM organizations WHERE deleted_at IS NULL

UNION ALL

SELECT
  'employee_count (NULL)' as metric,
  COUNT(*) FILTER (WHERE employee_count IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE employee_count IS NULL) / COUNT(*), 1) || '%' as percentage
FROM organizations WHERE deleted_at IS NULL

UNION ALL

SELECT
  'founded_year (NULL)' as metric,
  COUNT(*) FILTER (WHERE founded_year IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE founded_year IS NULL) / COUNT(*), 1) || '%' as percentage
FROM organizations WHERE deleted_at IS NULL

UNION ALL

SELECT
  'email (NULL)' as metric,
  COUNT(*) FILTER (WHERE email IS NULL OR email = '') as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE email IS NULL OR email = '') / COUNT(*), 1) || '%' as percentage
FROM organizations WHERE deleted_at IS NULL

UNION ALL

SELECT
  'tax_identifier (NULL)' as metric,
  COUNT(*) FILTER (WHERE tax_identifier IS NULL OR tax_identifier = '') as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE tax_identifier IS NULL OR tax_identifier = '') / COUNT(*), 1) || '%' as percentage
FROM organizations WHERE deleted_at IS NULL

UNION ALL

SELECT
  'notes (NULL)' as metric,
  COUNT(*) FILTER (WHERE notes IS NULL OR notes = '') as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE notes IS NULL OR notes = '') / COUNT(*), 1) || '%' as percentage
FROM organizations WHERE deleted_at IS NULL

ORDER BY metric;


-- 1.3 Opportunities: Unused Fields
-- Many opportunity fields are not exposed in UI
\echo ''
\echo '1.3 OPPORTUNITIES: Unused Fields'
\echo '-----------------------------------'

SELECT
  'Total Active Opportunities' as metric,
  COUNT(*) as count,
  '100%' as percentage
FROM opportunities
WHERE deleted_at IS NULL

UNION ALL

SELECT
  'status (NULL)' as metric,
  COUNT(*) FILTER (WHERE status IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status IS NULL) / NULLIF(COUNT(*), 0), 1) || '%' as percentage
FROM opportunities WHERE deleted_at IS NULL

UNION ALL

SELECT
  'actual_close_date (NULL)' as metric,
  COUNT(*) FILTER (WHERE actual_close_date IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE actual_close_date IS NULL) / NULLIF(COUNT(*), 0), 1) || '%' as percentage
FROM opportunities WHERE deleted_at IS NULL

UNION ALL

SELECT
  'founding_interaction_id (NULL)' as metric,
  COUNT(*) FILTER (WHERE founding_interaction_id IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE founding_interaction_id IS NULL) / NULLIF(COUNT(*), 0), 1) || '%' as percentage
FROM opportunities WHERE deleted_at IS NULL

UNION ALL

SELECT
  'next_action (NULL)' as metric,
  COUNT(*) FILTER (WHERE next_action IS NULL OR next_action = '') as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE next_action IS NULL OR next_action = '') / NULLIF(COUNT(*), 0), 1) || '%' as percentage
FROM opportunities WHERE deleted_at IS NULL

UNION ALL

SELECT
  'next_action_date (NULL)' as metric,
  COUNT(*) FILTER (WHERE next_action_date IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE next_action_date IS NULL) / NULLIF(COUNT(*), 0), 1) || '%' as percentage
FROM opportunities WHERE deleted_at IS NULL

UNION ALL

SELECT
  'competition (NULL)' as metric,
  COUNT(*) FILTER (WHERE competition IS NULL OR competition = '') as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE competition IS NULL OR competition = '') / NULLIF(COUNT(*), 0), 1) || '%' as percentage
FROM opportunities WHERE deleted_at IS NULL

UNION ALL

SELECT
  'decision_criteria (NULL)' as metric,
  COUNT(*) FILTER (WHERE decision_criteria IS NULL OR decision_criteria = '') as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE decision_criteria IS NULL OR decision_criteria = '') / NULLIF(COUNT(*), 0), 1) || '%' as percentage
FROM opportunities WHERE deleted_at IS NULL

UNION ALL

SELECT
  'opportunity_owner_id (NULL)' as metric,
  COUNT(*) FILTER (WHERE opportunity_owner_id IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE opportunity_owner_id IS NULL) / NULLIF(COUNT(*), 0), 1) || '%' as percentage
FROM opportunities WHERE deleted_at IS NULL

ORDER BY metric;


-- 1.4 Products: Field Completeness
\echo ''
\echo '1.4 PRODUCTS: Field Completeness'
\echo '-----------------------------------'

SELECT
  'Total Active Products' as metric,
  COUNT(*) as count,
  '100%' as percentage
FROM products
WHERE deleted_at IS NULL

UNION ALL

SELECT
  'manufacturer_part_number (NULL)' as metric,
  COUNT(*) FILTER (WHERE manufacturer_part_number IS NULL OR manufacturer_part_number = '') as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE manufacturer_part_number IS NULL OR manufacturer_part_number = '') / COUNT(*), 1) || '%' as percentage
FROM products WHERE deleted_at IS NULL

UNION ALL

SELECT
  'description (NULL)' as metric,
  COUNT(*) FILTER (WHERE description IS NULL OR description = '') as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE description IS NULL OR description = '') / COUNT(*), 1) || '%' as percentage
FROM products WHERE deleted_at IS NULL

UNION ALL

SELECT
  'marketing_description (NULL)' as metric,
  COUNT(*) FILTER (WHERE marketing_description IS NULL OR marketing_description = '') as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE marketing_description IS NULL OR marketing_description = '') / COUNT(*), 1) || '%' as percentage
FROM products WHERE deleted_at IS NULL

UNION ALL

SELECT
  'ingredients (NULL)' as metric,
  COUNT(*) FILTER (WHERE ingredients IS NULL OR ingredients = '') as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE ingredients IS NULL OR ingredients = '') / COUNT(*), 1) || '%' as percentage
FROM products WHERE deleted_at IS NULL

ORDER BY metric;


-- ================================================================
-- SECTION 2: JSONB USAGE PATTERNS
-- ================================================================
-- Analyzes how JSONB fields are being used
-- Helps understand data structure patterns
-- ================================================================

\echo ''
\echo '----------------------------------------------------------------'
\echo 'SECTION 2: JSONB USAGE PATTERNS'
\echo '----------------------------------------------------------------'

-- 2.1 Contact Email/Phone Arrays
\echo ''
\echo '2.1 CONTACTS: Email/Phone JSONB Arrays'
\echo '----------------------------------------'

SELECT
  'Contacts with emails' as metric,
  COUNT(*) FILTER (WHERE email IS NOT NULL AND email != '[]'::jsonb) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE email IS NOT NULL AND email != '[]'::jsonb) / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Contacts with NO emails' as metric,
  COUNT(*) FILTER (WHERE email IS NULL OR email = '[]'::jsonb) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE email IS NULL OR email = '[]'::jsonb) / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Contacts with phones' as metric,
  COUNT(*) FILTER (WHERE phone IS NOT NULL AND phone != '[]'::jsonb) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE phone IS NOT NULL AND phone != '[]'::jsonb) / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Contacts with NO phones' as metric,
  COUNT(*) FILTER (WHERE phone IS NULL OR phone = '[]'::jsonb) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE phone IS NULL OR phone = '[]'::jsonb) / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL;

-- Average email/phone counts per contact
\echo ''
\echo 'Average Email/Phone Counts per Contact:'
SELECT
  ROUND(AVG(jsonb_array_length(COALESCE(email, '[]'::jsonb))), 2) as avg_emails_per_contact,
  ROUND(AVG(jsonb_array_length(COALESCE(phone, '[]'::jsonb))), 2) as avg_phones_per_contact,
  MAX(jsonb_array_length(COALESCE(email, '[]'::jsonb))) as max_emails,
  MAX(jsonb_array_length(COALESCE(phone, '[]'::jsonb))) as max_phones
FROM contacts
WHERE deleted_at IS NULL;


-- 2.2 Organization Context Links
\echo ''
\echo '2.2 ORGANIZATIONS: Context Links JSONB'
\echo '----------------------------------------'

SELECT
  'Organizations with context_links' as metric,
  COUNT(*) FILTER (WHERE context_links IS NOT NULL AND context_links != '[]'::jsonb) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE context_links IS NOT NULL AND context_links != '[]'::jsonb) / COUNT(*), 1) || '%' as percentage
FROM organizations WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Organizations WITHOUT context_links' as metric,
  COUNT(*) FILTER (WHERE context_links IS NULL OR context_links = '[]'::jsonb) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE context_links IS NULL OR context_links = '[]'::jsonb) / COUNT(*), 1) || '%' as percentage
FROM organizations WHERE deleted_at IS NULL;


-- 2.3 Product Nutritional Info
\echo ''
\echo '2.3 PRODUCTS: Nutritional Info JSONB'
\echo '--------------------------------------'

SELECT
  'Products with nutritional_info' as metric,
  COUNT(*) FILTER (WHERE nutritional_info IS NOT NULL AND nutritional_info != '{}'::jsonb) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE nutritional_info IS NOT NULL AND nutritional_info != '{}'::jsonb) / COUNT(*), 1) || '%' as percentage
FROM products WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Products WITHOUT nutritional_info' as metric,
  COUNT(*) FILTER (WHERE nutritional_info IS NULL OR nutritional_info = '{}'::jsonb) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE nutritional_info IS NULL OR nutritional_info = '{}'::jsonb) / COUNT(*), 1) || '%' as percentage
FROM products WHERE deleted_at IS NULL;


-- ================================================================
-- SECTION 3: ARRAY FIELD USAGE ANALYSIS
-- ================================================================
-- Analyzes PostgreSQL array columns (tags, certifications, etc.)
-- ================================================================

\echo ''
\echo '----------------------------------------------------------------'
\echo 'SECTION 3: ARRAY FIELD USAGE ANALYSIS'
\echo '----------------------------------------------------------------'

-- 3.1 Contact Tags
\echo ''
\echo '3.1 CONTACTS: Tags Array Usage'
\echo '--------------------------------'

SELECT
  'Contacts with tags' as metric,
  COUNT(*) FILTER (WHERE tags IS NOT NULL AND array_length(tags, 1) > 0) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE tags IS NOT NULL AND array_length(tags, 1) > 0) / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Contacts WITHOUT tags' as metric,
  COUNT(*) FILTER (WHERE tags IS NULL OR array_length(tags, 1) IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE tags IS NULL OR array_length(tags, 1) IS NULL) / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL;

-- Most common tags (top 10)
\echo ''
\echo 'Top 10 Most Common Tags:'
SELECT
  UNNEST(tags) as tag,
  COUNT(*) as usage_count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL), 2) || '%' as percentage_of_contacts
FROM contacts
WHERE deleted_at IS NULL AND tags IS NOT NULL
GROUP BY tag
ORDER BY usage_count DESC
LIMIT 10;


-- 3.2 Opportunity Contact IDs and Tags
\echo ''
\echo '3.2 OPPORTUNITIES: Contact IDs Array'
\echo '--------------------------------------'

SELECT
  'Opportunities with contact_ids' as metric,
  COUNT(*) FILTER (WHERE contact_ids IS NOT NULL AND array_length(contact_ids, 1) > 0) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE contact_ids IS NOT NULL AND array_length(contact_ids, 1) > 0) / NULLIF(COUNT(*), 0), 1) || '%' as percentage
FROM opportunities WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Opportunities WITHOUT contact_ids' as metric,
  COUNT(*) FILTER (WHERE contact_ids IS NULL OR array_length(contact_ids, 1) IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE contact_ids IS NULL OR array_length(contact_ids, 1) IS NULL) / NULLIF(COUNT(*), 0), 1) || '%' as percentage
FROM opportunities WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Opportunities with tags' as metric,
  COUNT(*) FILTER (WHERE tags IS NOT NULL AND array_length(tags, 1) > 0) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE tags IS NOT NULL AND array_length(tags, 1) > 0) / NULLIF(COUNT(*), 0), 1) || '%' as percentage
FROM opportunities WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Opportunities WITHOUT tags' as metric,
  COUNT(*) FILTER (WHERE tags IS NULL OR array_length(tags, 1) IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE tags IS NULL OR array_length(tags, 1) IS NULL) / NULLIF(COUNT(*), 0), 1) || '%' as percentage
FROM opportunities WHERE deleted_at IS NULL;


-- 3.3 Product Certifications and Allergens
\echo ''
\echo '3.3 PRODUCTS: Certifications/Allergens Arrays'
\echo '-----------------------------------------------'

SELECT
  'Products with certifications' as metric,
  COUNT(*) FILTER (WHERE certifications IS NOT NULL AND array_length(certifications, 1) > 0) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE certifications IS NOT NULL AND array_length(certifications, 1) > 0) / COUNT(*), 1) || '%' as percentage
FROM products WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Products WITHOUT certifications' as metric,
  COUNT(*) FILTER (WHERE certifications IS NULL OR array_length(certifications, 1) IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE certifications IS NULL OR array_length(certifications, 1) IS NULL) / COUNT(*), 1) || '%' as percentage
FROM products WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Products with allergens' as metric,
  COUNT(*) FILTER (WHERE allergens IS NOT NULL AND array_length(allergens, 1) > 0) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE allergens IS NOT NULL AND array_length(allergens, 1) > 0) / COUNT(*), 1) || '%' as percentage
FROM products WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Products WITHOUT allergens' as metric,
  COUNT(*) FILTER (WHERE allergens IS NOT NULL AND array_length(allergens, 1) IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE allergens IS NULL OR array_length(allergens, 1) IS NULL) / COUNT(*), 1) || '%' as percentage
FROM products WHERE deleted_at IS NULL;


-- ================================================================
-- SECTION 4: ENUM TYPE DISTRIBUTIONS
-- ================================================================
-- Analyzes enum field usage patterns and identifies data quality issues
-- ================================================================

\echo ''
\echo '----------------------------------------------------------------'
\echo 'SECTION 4: ENUM TYPE DISTRIBUTIONS'
\echo '----------------------------------------------------------------'

-- 4.1 Organization Types (757 are 'unknown' - 41.8%)
\echo ''
\echo '4.1 ORGANIZATIONS: Type Distribution'
\echo '--------------------------------------'

SELECT
  organization_type,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM organizations WHERE deleted_at IS NULL), 1) || '%' as percentage,
  CASE
    WHEN organization_type = 'unknown' THEN '⚠️ NEEDS CLASSIFICATION'
    ELSE '✓ Classified'
  END as status
FROM organizations
WHERE deleted_at IS NULL
GROUP BY organization_type
ORDER BY count DESC;


-- 4.2 Opportunity Pipeline Distribution
\echo ''
\echo '4.2 OPPORTUNITIES: Stage/Status Distribution'
\echo '----------------------------------------------'

\echo 'Stage Distribution:'
SELECT
  COALESCE(stage::text, 'NULL') as stage,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM opportunities WHERE deleted_at IS NULL), 0), 1) || '%' as percentage
FROM opportunities
WHERE deleted_at IS NULL
GROUP BY stage
ORDER BY count DESC;

\echo ''
\echo 'Status Distribution (NOTE: Field not used in UI):'
SELECT
  COALESCE(status::text, 'NULL') as status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM opportunities WHERE deleted_at IS NULL), 0), 1) || '%' as percentage
FROM opportunities
WHERE deleted_at IS NULL
GROUP BY status
ORDER BY count DESC;

\echo ''
\echo 'Priority Distribution:'
SELECT
  COALESCE(priority::text, 'NULL') as priority,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / NULLIF((SELECT COUNT(*) FROM opportunities WHERE deleted_at IS NULL), 0), 1) || '%' as percentage
FROM opportunities
WHERE deleted_at IS NULL
GROUP BY priority
ORDER BY
  CASE priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
    ELSE 5
  END;


-- 4.3 Product Status Distribution
\echo ''
\echo '4.3 PRODUCTS: Status Distribution'
\echo '-----------------------------------'

SELECT
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM products WHERE deleted_at IS NULL), 1) || '%' as percentage
FROM products
WHERE deleted_at IS NULL
GROUP BY status
ORDER BY count DESC;


-- ================================================================
-- SECTION 5: RELATIONSHIP INTEGRITY
-- ================================================================
-- Checks foreign key relationships and identifies orphaned records
-- ================================================================

\echo ''
\echo '----------------------------------------------------------------'
\echo 'SECTION 5: RELATIONSHIP INTEGRITY'
\echo '----------------------------------------------------------------'

-- 5.1 Contacts Without Organizations
\echo ''
\echo '5.1 CONTACTS: Relationship Completeness'
\echo '-----------------------------------------'

SELECT
  'Contacts with organization' as metric,
  COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE organization_id IS NOT NULL) / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Contacts WITHOUT organization' as metric,
  COUNT(*) FILTER (WHERE organization_id IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE organization_id IS NULL) / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Contacts with account manager (sales_id)' as metric,
  COUNT(*) FILTER (WHERE sales_id IS NOT NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE sales_id IS NOT NULL) / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Contacts WITHOUT account manager' as metric,
  COUNT(*) FILTER (WHERE sales_id IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE sales_id IS NULL) / COUNT(*), 1) || '%' as percentage
FROM contacts WHERE deleted_at IS NULL;


-- 5.2 Opportunities Relationship Completeness
\echo ''
\echo '5.2 OPPORTUNITIES: Organization Linkage'
\echo '-----------------------------------------'

SELECT
  'Opportunities with customer_organization' as metric,
  COUNT(*) FILTER (WHERE customer_organization_id IS NOT NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE customer_organization_id IS NOT NULL) / NULLIF(COUNT(*), 0), 1) || '%' as percentage
FROM opportunities WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Opportunities with principal_organization' as metric,
  COUNT(*) FILTER (WHERE principal_organization_id IS NOT NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE principal_organization_id IS NOT NULL) / NULLIF(COUNT(*), 0), 1) || '%' as percentage
FROM opportunities WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Opportunities with distributor_organization' as metric,
  COUNT(*) FILTER (WHERE distributor_organization_id IS NOT NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE distributor_organization_id IS NOT NULL) / NULLIF(COUNT(*), 0), 1) || '%' as percentage
FROM opportunities WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Opportunities with account_manager' as metric,
  COUNT(*) FILTER (WHERE account_manager_id IS NOT NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE account_manager_id IS NOT NULL) / NULLIF(COUNT(*), 0), 1) || '%' as percentage
FROM opportunities WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Opportunities with opportunity_owner' as metric,
  COUNT(*) FILTER (WHERE opportunity_owner_id IS NOT NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE opportunity_owner_id IS NOT NULL) / NULLIF(COUNT(*), 0), 1) || '%' as percentage
FROM opportunities WHERE deleted_at IS NULL;


-- 5.3 Product-Principal Linkage
\echo ''
\echo '5.3 PRODUCTS: Principal/Distributor Linkage'
\echo '---------------------------------------------'

SELECT
  'Products with principal_id' as metric,
  COUNT(*) FILTER (WHERE principal_id IS NOT NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE principal_id IS NOT NULL) / COUNT(*), 1) || '%' as percentage
FROM products WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Products WITHOUT principal_id' as metric,
  COUNT(*) FILTER (WHERE principal_id IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE principal_id IS NULL) / COUNT(*), 1) || '%' as percentage
FROM products WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Products with distributor_id' as metric,
  COUNT(*) FILTER (WHERE distributor_id IS NOT NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE distributor_id IS NOT NULL) / COUNT(*), 1) || '%' as percentage
FROM products WHERE deleted_at IS NULL

UNION ALL

SELECT
  'Products WITHOUT distributor_id' as metric,
  COUNT(*) FILTER (WHERE distributor_id IS NULL) as count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE distributor_id IS NULL) / COUNT(*), 1) || '%' as percentage
FROM products WHERE deleted_at IS NULL;


-- 5.4 Junction Table Consistency
-- Verify that junction tables match denormalized arrays
\echo ''
\echo '5.4 JUNCTION TABLE CONSISTENCY CHECK'
\echo '--------------------------------------'

\echo 'Opportunity Contacts: Array vs Junction Table Sync'
SELECT
  'Opportunities' as entity,
  COUNT(*) as total_opportunities,
  COUNT(*) FILTER (WHERE contact_ids IS NOT NULL AND array_length(contact_ids, 1) > 0) as with_contact_ids_array,
  (SELECT COUNT(DISTINCT opportunity_id) FROM opportunity_contacts) as with_junction_records,
  CASE
    WHEN COUNT(*) FILTER (WHERE contact_ids IS NOT NULL AND array_length(contact_ids, 1) > 0) =
         (SELECT COUNT(DISTINCT opportunity_id) FROM opportunity_contacts)
    THEN '✓ SYNCED'
    ELSE '⚠️ MISMATCH - Check sync logic'
  END as sync_status
FROM opportunities WHERE deleted_at IS NULL;


-- ================================================================
-- SECTION 6: FULL-TEXT SEARCH READINESS
-- ================================================================
-- Verifies that tsvector columns are properly maintained
-- ================================================================

\echo ''
\echo '----------------------------------------------------------------'
\echo 'SECTION 6: FULL-TEXT SEARCH READINESS'
\echo '----------------------------------------------------------------'

-- 6.1 Search TSVector Population
\echo ''
\echo '6.1 SEARCH TSVECTOR POPULATION'
\echo '--------------------------------'

SELECT 'contacts' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE search_tsv IS NOT NULL) as with_search_tsv,
  COUNT(*) FILTER (WHERE search_tsv IS NULL) as missing_search_tsv,
  ROUND(100.0 * COUNT(*) FILTER (WHERE search_tsv IS NOT NULL) / COUNT(*), 1) || '%' as population_rate
FROM contacts WHERE deleted_at IS NULL

UNION ALL

SELECT 'organizations' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE search_tsv IS NOT NULL) as with_search_tsv,
  COUNT(*) FILTER (WHERE search_tsv IS NULL) as missing_search_tsv,
  ROUND(100.0 * COUNT(*) FILTER (WHERE search_tsv IS NOT NULL) / COUNT(*), 1) || '%' as population_rate
FROM organizations WHERE deleted_at IS NULL

UNION ALL

SELECT 'opportunities' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE search_tsv IS NOT NULL) as with_search_tsv,
  COUNT(*) FILTER (WHERE search_tsv IS NULL) as missing_search_tsv,
  ROUND(100.0 * COUNT(*) FILTER (WHERE search_tsv IS NOT NULL) / NULLIF(COUNT(*), 0), 1) || '%' as population_rate
FROM opportunities WHERE deleted_at IS NULL

UNION ALL

SELECT 'products' as table_name,
  COUNT(*) as total_records,
  COUNT(*) FILTER (WHERE search_tsv IS NOT NULL) as with_search_tsv,
  COUNT(*) FILTER (WHERE search_tsv IS NULL) as missing_search_tsv,
  ROUND(100.0 * COUNT(*) FILTER (WHERE search_tsv IS NOT NULL) / COUNT(*), 1) || '%' as population_rate
FROM products WHERE deleted_at IS NULL;

-- Sample search_tsv content
\echo ''
\echo 'Sample search_tsv Content (First 3 Contacts):'
SELECT
  id,
  name,
  ts_debug('english', search_tsv::text) as tsvector_tokens
FROM contacts
WHERE deleted_at IS NULL AND search_tsv IS NOT NULL
LIMIT 3;


-- ================================================================
-- SECTION 7: DATA QUALITY SCORE SUMMARY
-- ================================================================
-- Generates an overall quality score for each entity
-- ================================================================

\echo ''
\echo '----------------------------------------------------------------'
\echo 'SECTION 7: DATA QUALITY SCORE SUMMARY'
\echo '----------------------------------------------------------------'

-- 7.1 Overall Completeness Score
\echo ''
\echo '7.1 OVERALL COMPLETENESS SCORE'
\echo '--------------------------------'

\echo 'Contacts Data Quality:'
WITH contact_metrics AS (
  SELECT
    COUNT(*) as total,
    -- Core fields (always required)
    COUNT(*) as has_name,
    COUNT(*) FILTER (WHERE email IS NOT NULL AND email != '[]'::jsonb) as has_email,
    -- Optional but valuable fields
    COUNT(*) FILTER (WHERE phone IS NOT NULL AND phone != '[]'::jsonb) as has_phone,
    COUNT(*) FILTER (WHERE organization_id IS NOT NULL) as has_organization,
    COUNT(*) FILTER (WHERE title IS NOT NULL AND title != '') as has_title,
    COUNT(*) FILTER (WHERE linkedin_url IS NOT NULL AND linkedin_url != '') as has_linkedin,
    -- Address block (currently unused in UI)
    COUNT(*) FILTER (WHERE address IS NOT NULL AND address != '') as has_address,
    COUNT(*) FILTER (WHERE city IS NOT NULL AND city != '') as has_city
  FROM contacts WHERE deleted_at IS NULL
)
SELECT
  ROUND(100.0 * has_name / total, 1) as name_coverage_pct,
  ROUND(100.0 * has_email / total, 1) as email_coverage_pct,
  ROUND(100.0 * has_phone / total, 1) as phone_coverage_pct,
  ROUND(100.0 * has_organization / total, 1) as organization_coverage_pct,
  ROUND(100.0 * has_title / total, 1) as title_coverage_pct,
  ROUND(100.0 * has_linkedin / total, 1) as linkedin_coverage_pct,
  ROUND(100.0 * has_address / total, 1) as address_coverage_pct,
  ROUND((
    (100.0 * has_name / total) +
    (100.0 * has_email / total) +
    (100.0 * has_phone / total) +
    (100.0 * has_organization / total) +
    (100.0 * has_title / total)
  ) / 5, 1) as overall_quality_score
FROM contact_metrics;

\echo ''
\echo 'Organizations Data Quality:'
WITH org_metrics AS (
  SELECT
    COUNT(*) as total,
    -- Core fields
    COUNT(*) as has_name,
    COUNT(*) FILTER (WHERE organization_type != 'unknown') as has_classification,
    -- Optional but valuable
    COUNT(*) FILTER (WHERE website IS NOT NULL AND website != '') as has_website,
    COUNT(*) FILTER (WHERE phone IS NOT NULL AND phone != '') as has_phone,
    COUNT(*) FILTER (WHERE linkedin_url IS NOT NULL AND linkedin_url != '') as has_linkedin,
    COUNT(*) FILTER (WHERE annual_revenue IS NOT NULL) as has_revenue,
    COUNT(*) FILTER (WHERE employee_count IS NOT NULL) as has_employee_count
  FROM organizations WHERE deleted_at IS NULL
)
SELECT
  ROUND(100.0 * has_name / total, 1) as name_coverage_pct,
  ROUND(100.0 * has_classification / total, 1) as classification_coverage_pct,
  ROUND(100.0 * has_website / total, 1) as website_coverage_pct,
  ROUND(100.0 * has_phone / total, 1) as phone_coverage_pct,
  ROUND(100.0 * has_linkedin / total, 1) as linkedin_coverage_pct,
  ROUND(100.0 * has_revenue / total, 1) as revenue_coverage_pct,
  ROUND(100.0 * has_employee_count / total, 1) as employee_count_coverage_pct,
  ROUND((
    (100.0 * has_name / total) +
    (100.0 * has_classification / total) +
    (100.0 * has_website / total) +
    (100.0 * has_phone / total)
  ) / 4, 1) as overall_quality_score
FROM org_metrics;


-- 7.2 Prioritized Fix List
\echo ''
\echo '7.2 PRIORITIZED FIX LIST'
\echo '-------------------------'

\echo 'Top Data Quality Issues (Ordered by Impact):'
SELECT
  ROW_NUMBER() OVER (ORDER BY impact_score DESC) as priority,
  issue,
  affected_records,
  impact_score,
  recommended_action
FROM (
  SELECT
    '757 organizations classified as "unknown"' as issue,
    757 as affected_records,
    95 as impact_score,
    'Classify organizations by reviewing websites/context' as recommended_action

  UNION ALL

  SELECT
    'All organizations missing annual_revenue' as issue,
    (SELECT COUNT(*) FROM organizations WHERE deleted_at IS NULL AND annual_revenue IS NULL) as affected_records,
    70 as impact_score,
    'Import from external data sources (Clearbit, LinkedIn)' as recommended_action

  UNION ALL

  SELECT
    'All organizations missing employee_count' as issue,
    (SELECT COUNT(*) FROM organizations WHERE deleted_at IS NULL AND employee_count IS NULL) as affected_records,
    70 as impact_score,
    'Import from external data sources' as recommended_action

  UNION ALL

  SELECT
    'Full-text search not exposed in UI' as issue,
    (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL) as affected_records,
    85 as impact_score,
    'Add SearchInput to List filters (2 hour fix)' as recommended_action

  UNION ALL

  SELECT
    'Contact address fields unused' as issue,
    (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL AND (address IS NULL OR address = '')) as affected_records,
    50 as impact_score,
    'Add AddressInputs component to ContactEdit (3 hour fix)' as recommended_action

  UNION ALL

  SELECT
    'Opportunity status field unused' as issue,
    (SELECT COUNT(*) FROM opportunities WHERE deleted_at IS NULL) as affected_records,
    60 as impact_score,
    'Decide: implement in UI or remove from schema' as recommended_action

  UNION ALL

  SELECT
    'No Activity CRUD interface' as issue,
    (SELECT COUNT(*) FROM activities WHERE deleted_at IS NULL) as affected_records,
    80 as impact_score,
    'Build ActivityList/Show/Edit/Create components' as recommended_action
) as issues
ORDER BY impact_score DESC;


-- ================================================================
-- SECTION 8: EXPORT-READY QUERIES
-- ================================================================
-- Queries formatted for CSV export to facilitate bulk updates
-- ================================================================

\echo ''
\echo '----------------------------------------------------------------'
\echo 'SECTION 8: EXPORT-READY QUERIES FOR BULK UPDATES'
\echo '----------------------------------------------------------------'

-- 8.1 Organizations Needing Classification
\echo ''
\echo '8.1 ORGANIZATIONS: Unclassified Records for Bulk Update'
\echo '--------------------------------------------------------'
\echo 'Run with: \copy (query) TO ''unclassified_orgs.csv'' CSV HEADER'

SELECT
  id,
  name,
  website,
  phone,
  city,
  state,
  organization_type as current_type,
  'UPDATE HERE' as suggested_type
FROM organizations
WHERE deleted_at IS NULL
  AND organization_type = 'unknown'
ORDER BY name
LIMIT 50;  -- Top 50 for manual review


-- 8.2 Contacts Missing Address Data
\echo ''
\echo '8.2 CONTACTS: Missing Address Data for Enrichment'
\echo '---------------------------------------------------'
\echo 'Run with: \copy (query) TO ''contacts_missing_address.csv'' CSV HEADER'

SELECT
  id,
  name,
  email,
  title,
  organization_id,
  (SELECT name FROM organizations o WHERE o.id = c.organization_id) as company_name,
  address,
  city,
  state,
  postal_code,
  country
FROM contacts c
WHERE deleted_at IS NULL
  AND (address IS NULL OR address = '')
ORDER BY name
LIMIT 100;


-- 8.3 Organizations Missing Financial Data
\echo ''
\echo '8.3 ORGANIZATIONS: Missing Financial Data for Enrichment'
\echo '----------------------------------------------------------'
\echo 'Run with: \copy (query) TO ''orgs_missing_financial.csv'' CSV HEADER'

SELECT
  id,
  name,
  website,
  organization_type,
  city,
  state,
  annual_revenue,
  employee_count,
  founded_year
FROM organizations
WHERE deleted_at IS NULL
  AND (annual_revenue IS NULL OR employee_count IS NULL)
ORDER BY name
LIMIT 100;


-- ================================================================
-- END OF DATA QUALITY ANALYSIS
-- ================================================================

\echo ''
\echo '================================================================'
\echo 'DATA QUALITY ANALYSIS COMPLETE'
\echo ''
\echo 'Next Steps:'
\echo '1. Review prioritized fix list (Section 7.2)'
\echo '2. Export CSVs for bulk updates (Section 8)'
\echo '3. Address high-impact issues first (757 unknown organizations)'
\echo '4. Implement quick wins (full-text search UI, address fields)'
\echo '================================================================'
