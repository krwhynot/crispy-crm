-- =====================================================
-- Migration: Align Notes Schemas
-- Purpose: Bring contact_notes and opportunity_notes up to organization_notes patterns
-- Audit Reference: audit-04-activities-notes.md
-- =====================================================
--
-- IMPORTANT: Tables are snake_case (contact_notes, opportunity_notes)
--            Views are camelCase (contactNotes, opportunityNotes) for React Admin
--
-- Changes Applied:
-- 1. Drop dependent views FIRST (critical for column modifications)
-- 2. Convert attachments from TEXT[] to JSONB
-- 3. Fix FK delete behavior (CASCADE -> SET NULL for sales_id)
-- 4. Add ownership-based RLS policies
-- 5. Add partial indexes for performance
-- 6. Add update triggers (if missing)
-- 7. Recreate views to reflect schema changes
--
-- Note: deleted_at and updated_by columns already exist from previous migrations
--
-- =====================================================

-- =====================================================
-- PART 0: DROP DEPENDENT VIEWS FIRST
-- =====================================================
-- Views must be dropped BEFORE modifying table columns they depend on
-- This is a PostgreSQL requirement for column type changes

DROP VIEW IF EXISTS "contactNotes";
DROP VIEW IF EXISTS "opportunityNotes";

-- =====================================================
-- PART 1: SCHEMA CHANGES FOR contact_notes
-- =====================================================

-- 1.1 Convert attachments from TEXT[] to JSONB
-- Check if column exists and is TEXT[], then migrate
DO $$
BEGIN
    -- Only migrate if attachments is still TEXT[]
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'contact_notes'
        AND column_name = 'attachments'
        AND data_type = 'ARRAY'
    ) THEN
        -- Add new JSONB column
        ALTER TABLE "public"."contact_notes"
            ADD COLUMN IF NOT EXISTS "attachments_jsonb" jsonb DEFAULT '[]'::jsonb;

        -- Migrate existing TEXT[] data to JSONB format
        UPDATE "public"."contact_notes"
        SET "attachments_jsonb" = COALESCE(
            (SELECT jsonb_agg(jsonb_build_object('src', elem, 'title', 'Attachment'))
             FROM unnest("attachments") AS elem),
            '[]'::jsonb
        )
        WHERE "attachments" IS NOT NULL AND array_length("attachments", 1) > 0;

        -- Drop old column and rename new one
        ALTER TABLE "public"."contact_notes" DROP COLUMN "attachments";
        ALTER TABLE "public"."contact_notes" RENAME COLUMN "attachments_jsonb" TO "attachments";

        RAISE NOTICE 'contact_notes.attachments migrated from TEXT[] to JSONB';
    ELSE
        RAISE NOTICE 'contact_notes.attachments already JSONB or does not exist';
    END IF;
END $$;

COMMENT ON COLUMN "public"."contact_notes"."attachments"
    IS 'JSONB array of attachment metadata: [{ src, title, type?, size? }]';

-- 1.2 Fix FK delete behavior for sales_id (CASCADE -> SET NULL)
ALTER TABLE "public"."contact_notes"
    DROP CONSTRAINT IF EXISTS "contact_notes_sales_id_fkey";

ALTER TABLE ONLY "public"."contact_notes"
    ADD CONSTRAINT "contact_notes_sales_id_fkey"
    FOREIGN KEY ("sales_id")
    REFERENCES "public"."sales"("id")
    ON DELETE SET NULL;

-- =====================================================
-- PART 2: SCHEMA CHANGES FOR opportunity_notes
-- =====================================================

-- 2.1 Convert attachments from TEXT[] to JSONB
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'opportunity_notes'
        AND column_name = 'attachments'
        AND data_type = 'ARRAY'
    ) THEN
        ALTER TABLE "public"."opportunity_notes"
            ADD COLUMN IF NOT EXISTS "attachments_jsonb" jsonb DEFAULT '[]'::jsonb;

        UPDATE "public"."opportunity_notes"
        SET "attachments_jsonb" = COALESCE(
            (SELECT jsonb_agg(jsonb_build_object('src', elem, 'title', 'Attachment'))
             FROM unnest("attachments") AS elem),
            '[]'::jsonb
        )
        WHERE "attachments" IS NOT NULL AND array_length("attachments", 1) > 0;

        ALTER TABLE "public"."opportunity_notes" DROP COLUMN "attachments";
        ALTER TABLE "public"."opportunity_notes" RENAME COLUMN "attachments_jsonb" TO "attachments";

        RAISE NOTICE 'opportunity_notes.attachments migrated from TEXT[] to JSONB';
    ELSE
        RAISE NOTICE 'opportunity_notes.attachments already JSONB or does not exist';
    END IF;
END $$;

COMMENT ON COLUMN "public"."opportunity_notes"."attachments"
    IS 'JSONB array of attachment metadata: [{ src, title, type?, size? }]';

-- 2.2 Fix FK delete behavior for sales_id
ALTER TABLE "public"."opportunity_notes"
    DROP CONSTRAINT IF EXISTS "opportunity_notes_sales_id_fkey";

ALTER TABLE ONLY "public"."opportunity_notes"
    ADD CONSTRAINT "opportunity_notes_sales_id_fkey"
    FOREIGN KEY ("sales_id")
    REFERENCES "public"."sales"("id")
    ON DELETE SET NULL;

-- =====================================================
-- PART 3: RLS POLICY UPDATES (Ownership-Based)
-- =====================================================

-- 3.1 contact_notes RLS Updates
DROP POLICY IF EXISTS "authenticated_select_contact_notes" ON "public"."contact_notes";
DROP POLICY IF EXISTS "authenticated_insert_contact_notes" ON "public"."contact_notes";
DROP POLICY IF EXISTS "authenticated_update_contact_notes" ON "public"."contact_notes";
DROP POLICY IF EXISTS "authenticated_delete_contact_notes" ON "public"."contact_notes";

-- SELECT: All authenticated users can read non-deleted notes
CREATE POLICY "authenticated_select_contact_notes"
    ON "public"."contact_notes"
    FOR SELECT
    TO authenticated
    USING (("deleted_at" IS NULL) AND ("auth"."uid"() IS NOT NULL));

-- INSERT: All authenticated users can create notes
CREATE POLICY "authenticated_insert_contact_notes"
    ON "public"."contact_notes"
    FOR INSERT
    TO authenticated
    WITH CHECK ("auth"."uid"() IS NOT NULL);

-- UPDATE: Only the note author can modify their notes
CREATE POLICY "authenticated_update_contact_notes"
    ON "public"."contact_notes"
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
CREATE POLICY "authenticated_delete_contact_notes"
    ON "public"."contact_notes"
    FOR DELETE
    TO authenticated
    USING (
        ("auth"."uid"() IS NOT NULL) AND
        ("sales_id" IN (SELECT "id" FROM "public"."sales" WHERE "user_id" = "auth"."uid"()))
    );

-- 3.2 opportunity_notes RLS Updates
DROP POLICY IF EXISTS "authenticated_select_opportunity_notes" ON "public"."opportunity_notes";
DROP POLICY IF EXISTS "authenticated_insert_opportunity_notes" ON "public"."opportunity_notes";
DROP POLICY IF EXISTS "authenticated_update_opportunity_notes" ON "public"."opportunity_notes";
DROP POLICY IF EXISTS "authenticated_delete_opportunity_notes" ON "public"."opportunity_notes";

-- SELECT: All authenticated users can read non-deleted notes
CREATE POLICY "authenticated_select_opportunity_notes"
    ON "public"."opportunity_notes"
    FOR SELECT
    TO authenticated
    USING (("deleted_at" IS NULL) AND ("auth"."uid"() IS NOT NULL));

-- INSERT: All authenticated users can create notes
CREATE POLICY "authenticated_insert_opportunity_notes"
    ON "public"."opportunity_notes"
    FOR INSERT
    TO authenticated
    WITH CHECK ("auth"."uid"() IS NOT NULL);

-- UPDATE: Only the note author can modify their notes
CREATE POLICY "authenticated_update_opportunity_notes"
    ON "public"."opportunity_notes"
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
CREATE POLICY "authenticated_delete_opportunity_notes"
    ON "public"."opportunity_notes"
    FOR DELETE
    TO authenticated
    USING (
        ("auth"."uid"() IS NOT NULL) AND
        ("sales_id" IN (SELECT "id" FROM "public"."sales" WHERE "user_id" = "auth"."uid"()))
    );

-- =====================================================
-- PART 4: PERFORMANCE INDEXES
-- =====================================================

-- 4.1 contact_notes Indexes (matching organization_notes pattern)
DROP INDEX IF EXISTS "idx_contact_notes_contact_id";
CREATE INDEX "idx_contact_notes_contact_id"
    ON "public"."contact_notes" ("contact_id")
    WHERE ("deleted_at" IS NULL);

CREATE INDEX IF NOT EXISTS "idx_contact_notes_contact_date"
    ON "public"."contact_notes" ("contact_id", "date" DESC)
    WHERE ("deleted_at" IS NULL);

CREATE INDEX IF NOT EXISTS "idx_contact_notes_sales_id"
    ON "public"."contact_notes" ("sales_id")
    WHERE ("deleted_at" IS NULL);

CREATE INDEX IF NOT EXISTS "idx_contact_notes_created_at"
    ON "public"."contact_notes" ("created_at" DESC)
    WHERE ("deleted_at" IS NULL);

-- 4.2 opportunity_notes Indexes
DROP INDEX IF EXISTS "idx_opportunity_notes_opportunity_id";
CREATE INDEX "idx_opportunity_notes_opportunity_id"
    ON "public"."opportunity_notes" ("opportunity_id")
    WHERE ("deleted_at" IS NULL);

CREATE INDEX IF NOT EXISTS "idx_opportunity_notes_opportunity_date"
    ON "public"."opportunity_notes" ("opportunity_id", "date" DESC)
    WHERE ("deleted_at" IS NULL);

CREATE INDEX IF NOT EXISTS "idx_opportunity_notes_sales_id"
    ON "public"."opportunity_notes" ("sales_id")
    WHERE ("deleted_at" IS NULL);

CREATE INDEX IF NOT EXISTS "idx_opportunity_notes_created_at"
    ON "public"."opportunity_notes" ("created_at" DESC)
    WHERE ("deleted_at" IS NULL);

-- =====================================================
-- PART 5: TRIGGERS FOR AUTO-UPDATE
-- =====================================================

-- 5.1 contact_notes updated_at trigger
CREATE OR REPLACE FUNCTION "public"."update_contact_notes_updated_at"()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "trigger_update_contact_notes_updated_at" ON "public"."contact_notes";
CREATE TRIGGER "trigger_update_contact_notes_updated_at"
    BEFORE UPDATE ON "public"."contact_notes"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_contact_notes_updated_at"();

-- 5.2 contact_notes updated_by trigger
CREATE OR REPLACE FUNCTION "public"."set_contact_notes_updated_by"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_sales_id bigint;
BEGIN
    SELECT "id" INTO current_sales_id
    FROM "public"."sales"
    WHERE "user_id" = auth.uid();

    IF current_sales_id IS NOT NULL THEN
        NEW.updated_by := current_sales_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "trigger_set_contact_notes_updated_by" ON "public"."contact_notes";
CREATE TRIGGER "trigger_set_contact_notes_updated_by"
    BEFORE UPDATE ON "public"."contact_notes"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."set_contact_notes_updated_by"();

-- 5.3 opportunity_notes updated_at trigger
CREATE OR REPLACE FUNCTION "public"."update_opportunity_notes_updated_at"()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "trigger_update_opportunity_notes_updated_at" ON "public"."opportunity_notes";
CREATE TRIGGER "trigger_update_opportunity_notes_updated_at"
    BEFORE UPDATE ON "public"."opportunity_notes"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_opportunity_notes_updated_at"();

-- 5.4 opportunity_notes updated_by trigger
CREATE OR REPLACE FUNCTION "public"."set_opportunity_notes_updated_by"()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_sales_id bigint;
BEGIN
    SELECT "id" INTO current_sales_id
    FROM "public"."sales"
    WHERE "user_id" = auth.uid();

    IF current_sales_id IS NOT NULL THEN
        NEW.updated_by := current_sales_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS "trigger_set_opportunity_notes_updated_by" ON "public"."opportunity_notes";
CREATE TRIGGER "trigger_set_opportunity_notes_updated_by"
    BEFORE UPDATE ON "public"."opportunity_notes"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."set_opportunity_notes_updated_by"();

-- =====================================================
-- PART 6: RECREATE VIEWS (Reflect Schema Changes)
-- =====================================================

-- Views need to be recreated to pick up the new attachments column type
CREATE VIEW "contactNotes" WITH (security_invoker = true) AS
    SELECT * FROM contact_notes;

CREATE VIEW "opportunityNotes" WITH (security_invoker = true) AS
    SELECT * FROM opportunity_notes;

-- Restore grants
GRANT SELECT, INSERT, UPDATE, DELETE ON "contactNotes" TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON "opportunityNotes" TO authenticated;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
--
-- Security Model Summary (now matches organization_notes):
-- - GRANT: authenticated users have full CRUD on table
-- - RLS SELECT: shared read, excludes soft-deleted
-- - RLS INSERT: any authenticated user can create
-- - RLS UPDATE/DELETE: ownership-based (only author can modify)
-- - Soft delete: deleted_at column preserves audit trail
-- - Audit: updated_at/updated_by auto-populated via triggers
--
-- Breaking Changes:
-- - attachments column type changed from TEXT[] to JSONB
--   (data migrated automatically, but code may need updates)
-- - Users can no longer edit/delete notes they didn't create
--
-- To test locally: npx supabase db reset
-- To validate: npm run db:cloud:push:dry-run
-- =====================================================
