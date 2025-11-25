-- =====================================================
-- Migration: Add organization_notes table
-- Purpose: Notes/comments attached to organizations for CRM tracking
-- Pattern: Matches existing contactNotes/opportunityNotes structure
-- =====================================================

-- =====================================================
-- 1. TABLE DEFINITION
-- =====================================================

CREATE TABLE IF NOT EXISTS "public"."organizationNotes" (
    -- Primary key (BIGINT with sequence, matching existing notes tables)
    "id" bigint NOT NULL,

    -- Parent reference (organization this note belongs to)
    "organization_id" bigint NOT NULL,

    -- Note content
    "text" text NOT NULL,

    -- Attachments stored as JSONB array for flexibility
    -- Improved over TEXT[] used in contact/opportunity notes
    -- Supports structured metadata: { url, filename, size, type }
    "attachments" jsonb DEFAULT '[]'::jsonb,

    -- Author reference (sales rep who created the note)
    "sales_id" bigint,

    -- User-specified date (when the note event occurred)
    "date" timestamp with time zone DEFAULT now() NOT NULL,

    -- System timestamps
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),

    -- Soft delete support
    "deleted_at" timestamp with time zone,

    -- Audit trail for updates
    "updated_by" bigint
);

-- Set ownership
ALTER TABLE "public"."organizationNotes" OWNER TO "postgres";

-- Add descriptive comments
COMMENT ON TABLE "public"."organizationNotes" IS 'Notes and comments attached to organizations for CRM relationship tracking';
COMMENT ON COLUMN "public"."organizationNotes"."date" IS 'User-specified date/time for the note event, separate from system-managed created_at';
COMMENT ON COLUMN "public"."organizationNotes"."attachments" IS 'JSONB array of attachment metadata: [{ url, filename, size, type }]';
COMMENT ON COLUMN "public"."organizationNotes"."deleted_at" IS 'Soft delete timestamp - NULL means active, non-NULL means deleted';
COMMENT ON COLUMN "public"."organizationNotes"."updated_by" IS 'Sales rep who last modified this note';

-- =====================================================
-- 2. SEQUENCE FOR PRIMARY KEY
-- =====================================================

CREATE SEQUENCE IF NOT EXISTS "public"."organizationNotes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE "public"."organizationNotes_id_seq" OWNER TO "postgres";
ALTER SEQUENCE "public"."organizationNotes_id_seq" OWNED BY "public"."organizationNotes"."id";

-- Set default value for id column
ALTER TABLE ONLY "public"."organizationNotes"
    ALTER COLUMN "id" SET DEFAULT nextval('"public"."organizationNotes_id_seq"'::regclass);

-- Primary key constraint
ALTER TABLE ONLY "public"."organizationNotes"
    ADD CONSTRAINT "organizationNotes_pkey" PRIMARY KEY ("id");

-- =====================================================
-- 3. FOREIGN KEY CONSTRAINTS
-- =====================================================

-- Organization reference: CASCADE delete when organization is deleted
-- (notes have no meaning without their parent organization)
ALTER TABLE ONLY "public"."organizationNotes"
    ADD CONSTRAINT "organizationNotes_organization_id_fkey"
    FOREIGN KEY ("organization_id")
    REFERENCES "public"."organizations"("id")
    ON DELETE CASCADE;

-- Sales rep reference: SET NULL when sales rep is deleted
-- (preserve historical notes, just remove author attribution)
ALTER TABLE ONLY "public"."organizationNotes"
    ADD CONSTRAINT "organizationNotes_sales_id_fkey"
    FOREIGN KEY ("sales_id")
    REFERENCES "public"."sales"("id")
    ON DELETE SET NULL;

-- Updated_by reference: SET NULL when sales rep is deleted
ALTER TABLE ONLY "public"."organizationNotes"
    ADD CONSTRAINT "organizationNotes_updated_by_fkey"
    FOREIGN KEY ("updated_by")
    REFERENCES "public"."sales"("id")
    ON DELETE SET NULL;

-- =====================================================
-- 4. PERFORMANCE INDEXES
-- =====================================================

-- Primary lookup: notes by organization (most common query)
CREATE INDEX "idx_organization_notes_organization_id"
    ON "public"."organizationNotes" ("organization_id")
    WHERE ("deleted_at" IS NULL);

-- Chronological listing within organization
CREATE INDEX "idx_organization_notes_org_date"
    ON "public"."organizationNotes" ("organization_id", "date" DESC)
    WHERE ("deleted_at" IS NULL);

-- Notes by author (for "my notes" views)
CREATE INDEX "idx_organization_notes_sales_id"
    ON "public"."organizationNotes" ("sales_id")
    WHERE ("deleted_at" IS NULL);

-- Recent notes across all organizations (for activity feeds)
CREATE INDEX "idx_organization_notes_created_at"
    ON "public"."organizationNotes" ("created_at" DESC)
    WHERE ("deleted_at" IS NULL);

-- =====================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on the table
ALTER TABLE "public"."organizationNotes" ENABLE ROW LEVEL SECURITY;

-- SELECT: All authenticated users can read all organization notes (shared team model)
-- Excludes soft-deleted records at the policy level for performance
CREATE POLICY "authenticated_select_organizationNotes"
    ON "public"."organizationNotes"
    FOR SELECT
    TO authenticated
    USING (("deleted_at" IS NULL) AND ("auth"."uid"() IS NOT NULL));

-- INSERT: All authenticated users can create notes
CREATE POLICY "authenticated_insert_organizationNotes"
    ON "public"."organizationNotes"
    FOR INSERT
    TO authenticated
    WITH CHECK ("auth"."uid"() IS NOT NULL);

-- UPDATE: Only the note author can modify their notes
-- This provides ownership-based write access while maintaining shared read
CREATE POLICY "authenticated_update_organizationNotes"
    ON "public"."organizationNotes"
    FOR UPDATE
    TO authenticated
    USING (
        ("auth"."uid"() IS NOT NULL) AND
        ("sales_id" IN (SELECT "id" FROM "public"."sales" WHERE "user_id" = "auth"."uid"()))
    )
    WITH CHECK (
        ("auth"."uid"() IS NOT NULL) AND
        ("sales_id" IN (SELECT "id" FROM "public"."sales" WHERE "user_id" = "auth"."uid"()))
    );

-- DELETE: Only the note author can delete (soft-delete) their notes
CREATE POLICY "authenticated_delete_organizationNotes"
    ON "public"."organizationNotes"
    FOR DELETE
    TO authenticated
    USING (
        ("auth"."uid"() IS NOT NULL) AND
        ("sales_id" IN (SELECT "id" FROM "public"."sales" WHERE "user_id" = "auth"."uid"()))
    );

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Auto-update updated_at timestamp on any modification
CREATE OR REPLACE FUNCTION "public"."update_organization_notes_updated_at"()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER "trigger_update_organizationNotes_updated_at"
    BEFORE UPDATE ON "public"."organizationNotes"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_organization_notes_updated_at"();

-- Auto-set updated_by from current user's sales record
CREATE OR REPLACE FUNCTION "public"."set_organization_notes_updated_by"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_sales_id bigint;
BEGIN
    -- Look up sales_id for the current authenticated user
    SELECT "id" INTO current_sales_id
    FROM "public"."sales"
    WHERE "user_id" = auth.uid();

    -- Only set if we found a matching sales record
    IF current_sales_id IS NOT NULL THEN
        NEW.updated_by := current_sales_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER "trigger_set_organizationNotes_updated_by"
    BEFORE UPDATE ON "public"."organizationNotes"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."set_organization_notes_updated_by"();

-- =====================================================
-- 7. GRANT PERMISSIONS (TWO-LAYER SECURITY)
-- =====================================================

-- Table permissions for authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."organizationNotes" TO authenticated;

-- Sequence permissions (required for INSERT to work)
GRANT USAGE, SELECT ON SEQUENCE "public"."organizationNotes_id_seq" TO authenticated;

-- Read-only for anonymous users (optional, matches contactNotes pattern)
-- Comment out if anonymous access not needed
-- GRANT SELECT ON TABLE "public"."organizationNotes" TO anon;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
--
-- Security Model Summary:
-- - GRANT: authenticated users have full CRUD on table
-- - RLS SELECT: shared read (all team members see all org notes)
-- - RLS INSERT: any authenticated user can create notes
-- - RLS UPDATE/DELETE: ownership-based (only author can modify/delete)
-- - Soft delete: deleted_at column preserves audit trail
-- - Audit: updated_at/updated_by auto-populated via triggers
--
-- Performance Notes:
-- - Partial indexes exclude soft-deleted records
-- - Composite index on (organization_id, date DESC) for chronological queries
-- - JSONB attachments support flexible metadata vs TEXT[] arrays
--
-- To test this migration locally:
--   npx supabase db reset
--
-- To validate before cloud deployment:
--   npm run db:cloud:push:dry-run
-- =====================================================
