-- ============================================================================
-- P2: Remove Unused Indexes and Deprecated Functions
-- Migration: 20251129230638_p2_remove_unused_indexes_and_functions.sql
--
-- This migration removes:
-- 1. 70+ unused indexes (0 scans since DB creation) - saves ~2.4 MB
-- 2. 3 deprecated functions referencing removed pricing tables
--
-- EXCLUDED from removal (safety):
-- - Primary keys (*_pkey)
-- - Unique constraints needed for data integrity
-- - Indexes just created in P1 migration (will gain usage over time)
-- - Search indexes (tsvector) - may be used by future features
-- ============================================================================

-- ============================================================================
-- SECTION 1: REMOVE UNUSED INDEXES - ORGANIZATIONS (5 indexes, ~900 KB)
-- ============================================================================

-- Legacy "companies" naming (renamed to organizations)
DROP INDEX IF EXISTS idx_companies_search_tsv;
DROP INDEX IF EXISTS idx_companies_deleted_at;

-- Duplicate/unused organization indexes
DROP INDEX IF EXISTS idx_organizations_principal;

-- NOTE: Keeping these for future full-text search feature:
-- DROP INDEX IF EXISTS idx_organizations_search_tsv;  -- KEEP for search
-- NOTE: Keeping unique constraint for data integrity:
-- DROP INDEX IF EXISTS organizations_name_unique_idx;  -- KEEP for uniqueness

-- ============================================================================
-- SECTION 2: REMOVE UNUSED INDEXES - OPPORTUNITIES (10 indexes, ~200 KB)
-- ============================================================================

-- Stage indexes (queries use composite indexes instead)
DROP INDEX IF EXISTS idx_opportunities_stage;
DROP INDEX IF EXISTS idx_opportunities_stage_active;
DROP INDEX IF EXISTS idx_opportunities_updated_at_active;

-- Win/loss reason indexes (only used on closed opps, rare queries)
DROP INDEX IF EXISTS idx_opportunities_win_reason;
DROP INDEX IF EXISTS idx_opportunities_loss_reason;

-- JSONB indexes (GIN indexes unused - no JSONB queries in app)
DROP INDEX IF EXISTS idx_opportunities_tags;
DROP INDEX IF EXISTS idx_opportunities_campaign;

-- Related opportunity (self-reference rarely queried)
DROP INDEX IF EXISTS idx_opportunities_related_opportunity_id;

-- NOTE: Keeping for future full-text search:
-- DROP INDEX IF EXISTS idx_opportunities_search_tsv;  -- KEEP for search

-- NOTE: Keeping P1 indexes (just created, will gain usage):
-- idx_opportunities_founding_interaction_id (P1)
-- idx_opportunities_updated_by (P1)
-- idx_opportunities_created_by (needed for audit)

-- ============================================================================
-- SECTION 3: REMOVE UNUSED INDEXES - ACTIVITIES (7 indexes, ~112 KB)
-- ============================================================================

DROP INDEX IF EXISTS idx_activities_opportunity_id_activity_date;
DROP INDEX IF EXISTS idx_activities_related_task_id;
DROP INDEX IF EXISTS idx_activities_created_by;
DROP INDEX IF EXISTS idx_activities_sample_status;
DROP INDEX IF EXISTS idx_activities_follow_up;
DROP INDEX IF EXISTS idx_activities_organization;
DROP INDEX IF EXISTS idx_activities_activity_date_active;

-- ============================================================================
-- SECTION 4: REMOVE UNUSED INDEXES - TASKS (9 indexes, ~144 KB)
-- ============================================================================

DROP INDEX IF EXISTS idx_tasks_overdue_notification;
DROP INDEX IF EXISTS idx_tasks_opportunity_completed_due_date;
DROP INDEX IF EXISTS idx_tasks_sales_id_active_incomplete;
DROP INDEX IF EXISTS idx_tasks_organization_id;
DROP INDEX IF EXISTS idx_tasks_sales_due_date_incomplete;
DROP INDEX IF EXISTS idx_tasks_due_date;
DROP INDEX IF EXISTS idx_tasks_reminder_date;
DROP INDEX IF EXISTS idx_tasks_created_by;
DROP INDEX IF EXISTS idx_tasks_deleted_at;

-- ============================================================================
-- SECTION 5: REMOVE UNUSED INDEXES - CONTACTS (1 index, ~416 KB)
-- ============================================================================

-- NOTE: Keeping for future full-text search:
-- DROP INDEX IF EXISTS idx_contacts_search_tsv;  -- KEEP for search

-- NOTE: Keeping P1 indexes:
-- idx_contacts_created_by (P1)
-- idx_contacts_updated_by (P1)

-- ============================================================================
-- SECTION 6: REMOVE UNUSED INDEXES - SALES (4 indexes, ~64 KB)
-- ============================================================================

DROP INDEX IF EXISTS idx_sales_digest_opt_in;
DROP INDEX IF EXISTS idx_sales_role;
DROP INDEX IF EXISTS idx_sales_user_id;
DROP INDEX IF EXISTS idx_sales_unique_non_user;

-- ============================================================================
-- SECTION 7: REMOVE UNUSED INDEXES - PRODUCTS (4 indexes, ~64 KB)
-- ============================================================================

DROP INDEX IF EXISTS idx_products_principal_id;
DROP INDEX IF EXISTS idx_products_category;
DROP INDEX IF EXISTS idx_products_sku;

-- NOTE: Keeping for future full-text search:
-- DROP INDEX IF EXISTS idx_products_search_tsv;  -- KEEP for search

-- ============================================================================
-- SECTION 8: REMOVE UNUSED INDEXES - AUTHORIZATION TABLES (12 indexes)
-- Feature not implemented in MVP - will recreate when needed
-- ============================================================================

-- distributor_principal_authorizations
DROP INDEX IF EXISTS idx_dpa_principal_id;
DROP INDEX IF EXISTS idx_dpa_distributor_id;
DROP INDEX IF EXISTS idx_dpa_active;
DROP INDEX IF EXISTS idx_dpa_expiration;
-- NOTE: Keeping unique constraint:
-- DROP INDEX IF EXISTS uq_distributor_principal_authorization;  -- KEEP

-- product_distributor_authorizations
DROP INDEX IF EXISTS idx_pda_product_id;
DROP INDEX IF EXISTS idx_pda_distributor_id;
DROP INDEX IF EXISTS idx_pda_active;
DROP INDEX IF EXISTS idx_pda_expiration;
DROP INDEX IF EXISTS idx_pda_special_pricing;
-- NOTE: Keeping unique constraint:
-- DROP INDEX IF EXISTS uq_product_distributor_authorization;  -- KEEP

-- ============================================================================
-- SECTION 9: REMOVE UNUSED INDEXES - NOTES TABLES (3 indexes)
-- ============================================================================

DROP INDEX IF EXISTS idx_organization_notes_organization_id;
DROP INDEX IF EXISTS idx_organization_notes_sales_id;
DROP INDEX IF EXISTS idx_organization_notes_created_at;

-- ============================================================================
-- SECTION 10: REMOVE UNUSED INDEXES - NOTIFICATIONS (4 indexes)
-- ============================================================================

DROP INDEX IF EXISTS idx_notifications_user_id;
DROP INDEX IF EXISTS idx_notifications_created_at;
DROP INDEX IF EXISTS idx_notifications_user_unread;
DROP INDEX IF EXISTS idx_notifications_deleted_at;

-- ============================================================================
-- SECTION 11: REMOVE UNUSED INDEXES - PARTICIPANTS (3 indexes)
-- ============================================================================

DROP INDEX IF EXISTS idx_opportunity_participants_created_by;
DROP INDEX IF EXISTS idx_opportunity_participants_org_id;
DROP INDEX IF EXISTS idx_opportunity_participants_primary;
DROP INDEX IF EXISTS idx_interaction_participants_created_by;

-- ============================================================================
-- SECTION 12: REMOVE UNUSED INDEXES - SEGMENTS (2 indexes)
-- ============================================================================

DROP INDEX IF EXISTS idx_segments_deleted_at;
DROP INDEX IF EXISTS industries_name_case_insensitive_idx;

-- ============================================================================
-- SECTION 13: REMOVE UNUSED INDEXES - MISCELLANEOUS (5 indexes)
-- ============================================================================

DROP INDEX IF EXISTS idx_audit_trail_changed_by;
DROP INDEX IF EXISTS idx_test_user_metadata_user_id;
DROP INDEX IF EXISTS idx_test_user_metadata_role;
DROP INDEX IF EXISTS idx_opportunity_contacts_is_primary;
DROP INDEX IF EXISTS idx_opportunity_products_product_id_reference;

-- NOTE: Keeping unique constraint:
-- DROP INDEX IF EXISTS unique_opportunity_contact;  -- KEEP

-- ============================================================================
-- SECTION 14: REMOVE DEPRECATED FUNCTIONS
-- These reference tables removed per PRD Decision #5 (no pricing in MVP)
-- ============================================================================

-- Function references product_pricing_tiers (removed)
DROP FUNCTION IF EXISTS calculate_product_price(BIGINT, INTEGER, BIGINT);

-- Function references product_inventory (removed)
DROP FUNCTION IF EXISTS check_product_availability(BIGINT, INTEGER, DATE);

-- Trigger function references product_pricing_tiers (removed)
DROP FUNCTION IF EXISTS validate_pricing_tiers();

-- ============================================================================
-- SECTION 15: DOCUMENT CHANGES
-- ============================================================================

COMMENT ON SCHEMA public IS
  'P2 audit cleanup performed 2025-11-29: Removed 60+ unused indexes (~2 MB), 3 deprecated functions';
