-- Migration: Add organization_id FK to tasks table
-- Purpose: Allow tasks to be directly linked to organizations (not just through contacts)
-- Pattern: Follows existing FK patterns in tasks table (contact_id, opportunity_id)

-- ============================================================================
-- 1. ADD COLUMN
-- ============================================================================

-- Add nullable organization_id column to tasks
-- Nullable because existing tasks may not have an organization
ALTER TABLE "public"."tasks"
ADD COLUMN "organization_id" BIGINT;

-- Add comment for documentation
COMMENT ON COLUMN "public"."tasks"."organization_id" IS 'Optional FK to organizations. Task can be linked to organization directly, or inherit org from contact/opportunity.';

-- ============================================================================
-- 2. ADD FOREIGN KEY CONSTRAINT
-- ============================================================================

-- FK constraint references organizations table
ALTER TABLE "public"."tasks"
ADD CONSTRAINT "tasks_organization_id_fkey"
FOREIGN KEY ("organization_id")
REFERENCES "public"."organizations"("id")
ON DELETE SET NULL;

-- ============================================================================
-- 3. ADD INDEX FOR PERFORMANCE
-- ============================================================================

-- Index for efficient lookups by organization
CREATE INDEX "idx_tasks_organization_id"
ON "public"."tasks" ("organization_id")
WHERE "organization_id" IS NOT NULL;

-- ============================================================================
-- 4. GRANT PERMISSIONS (Required alongside RLS)
-- Per Engineering Constitution: Tables need BOTH GRANT + RLS policies
-- ============================================================================

-- Tasks table already has grants from initial migration, but ensure column is accessible
-- No additional grants needed - column inherits table-level grants

-- ============================================================================
-- 5. DATA BACKFILL (Optional)
-- ============================================================================

-- Optionally backfill organization_id from related contact's organization
-- Only for tasks that have a contact_id and the contact has an organization_id
UPDATE "public"."tasks" t
SET organization_id = c.organization_id
FROM "public"."contacts" c
WHERE t.contact_id = c.id
  AND t.organization_id IS NULL
  AND c.organization_id IS NOT NULL;

-- Note: Tasks linked to opportunities could also inherit organization from opportunity
-- but opportunity has customer_organization_id which may be different intent
-- Leave those as NULL - user can set explicitly if needed
