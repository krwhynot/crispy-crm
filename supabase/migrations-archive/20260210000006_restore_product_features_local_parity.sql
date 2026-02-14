-- Migration: Restore product_features table for local parity
-- Pre-work Blocker 1 (Phase 4 Audit Finding P4-1)
--
-- Root cause: product_features was dropped in 20251031132404 (both envs),
-- then re-created on cloud via 20260131181838_remote_schema.sql.skip,
-- which is skipped by local `supabase db reset`.
--
-- This migration brings local into exact parity with cloud.
-- Idempotent: uses IF NOT EXISTS / IF EXISTS throughout.

-- ============================================================================
-- 1. SEQUENCE
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS public.product_features_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.product_features_id_seq OWNER TO postgres;

-- ============================================================================
-- 2. TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_features (
    id bigint NOT NULL DEFAULT nextval('public.product_features_id_seq'::regclass),
    product_id bigint NOT NULL,
    feature_name text NOT NULL,
    feature_value text,
    display_order integer DEFAULT 0,
    is_highlighted boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    deleted_at timestamp with time zone,
    created_by bigint,
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.product_features OWNER TO postgres;
ALTER SEQUENCE public.product_features_id_seq OWNED BY public.product_features.id;

-- ============================================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.product_features ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CONSTRAINTS
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.product_features'::regclass
          AND conname = 'product_features_pkey'
    ) THEN
        ALTER TABLE public.product_features
            ADD CONSTRAINT product_features_pkey PRIMARY KEY (id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.product_features'::regclass
          AND conname = 'product_features_product_id_fkey'
    ) THEN
        ALTER TABLE public.product_features
            ADD CONSTRAINT product_features_product_id_fkey
            FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- 5. INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_product_features_deleted_at
    ON public.product_features (deleted_at)
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_product_features_product_id
    ON public.product_features (product_id);

CREATE INDEX IF NOT EXISTS idx_product_features_product_id_partial
    ON public.product_features (product_id)
    WHERE deleted_at IS NULL;

-- ============================================================================
-- 6. RLS POLICIES
-- Pattern: Shared Reference Data (all users read, admins write)
-- Depends on: public.is_admin() function (already exists in both envs)
-- ============================================================================

DO $$
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can view product_features" ON public.product_features;
    CREATE POLICY "Authenticated users can view product_features"
        ON public.product_features
        FOR SELECT
        USING (auth.uid() IS NOT NULL AND deleted_at IS NULL);

    DROP POLICY IF EXISTS "Admins can insert product_features" ON public.product_features;
    CREATE POLICY "Admins can insert product_features"
        ON public.product_features
        FOR INSERT
        WITH CHECK (public.is_admin());

    DROP POLICY IF EXISTS "Admins can update product_features" ON public.product_features;
    CREATE POLICY "Admins can update product_features"
        ON public.product_features
        FOR UPDATE
        USING (public.is_admin())
        WITH CHECK (public.is_admin());

    DROP POLICY IF EXISTS "Admins can delete product_features" ON public.product_features;
    CREATE POLICY "Admins can delete product_features"
        ON public.product_features
        FOR DELETE
        USING (public.is_admin());
END $$;

-- ============================================================================
-- 7. GRANTS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_features TO authenticated;
GRANT ALL ON SEQUENCE public.product_features_id_seq TO authenticated;

-- ============================================================================
-- 8. TRIGGER (updated_at auto-set)
-- Function update_product_features_updated_at() already exists in both envs.
-- ============================================================================

DROP TRIGGER IF EXISTS set_product_features_updated_at ON public.product_features;
CREATE TRIGGER set_product_features_updated_at
    BEFORE UPDATE ON public.product_features
    FOR EACH ROW
    EXECUTE FUNCTION public.update_product_features_updated_at();

-- ============================================================================
-- 9. VERIFICATION
-- ============================================================================

DO $$
DECLARE
    tbl_exists boolean;
    col_count integer;
    policy_count integer;
    idx_count integer;
BEGIN
    -- Table exists
    SELECT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'product_features' AND n.nspname = 'public'
    ) INTO tbl_exists;

    IF NOT tbl_exists THEN
        RAISE EXCEPTION 'FAIL: product_features table does not exist';
    END IF;

    -- Column count (should be 10)
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'product_features';

    IF col_count != 10 THEN
        RAISE EXCEPTION 'FAIL: Expected 10 columns, found %', col_count;
    END IF;

    -- RLS policy count (should be 4)
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'product_features' AND schemaname = 'public';

    IF policy_count != 4 THEN
        RAISE EXCEPTION 'FAIL: Expected 4 RLS policies, found %', policy_count;
    END IF;

    -- Index count (should be 4: pkey + 3 custom)
    SELECT COUNT(*) INTO idx_count
    FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'product_features';

    IF idx_count != 4 THEN
        RAISE EXCEPTION 'FAIL: Expected 4 indexes, found %', idx_count;
    END IF;

    RAISE NOTICE 'PASS: product_features — 10 columns, 4 RLS policies, 4 indexes, RLS enabled';
END $$;
