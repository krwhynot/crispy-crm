-- Migration: Add sample_status enum and sample activity type
-- PRD Reference: Section 4.4 - Sample Tracking Workflow
-- Audit Reference: activities-feature-matrix.md Decision #4
--
-- This migration:
-- 1. Creates the sample_status enum with 4 states
-- 2. Adds 'sample' to the interaction_type enum
-- 3. Adds sample_status column to activities table (nullable)
-- NOTE: CHECK constraint deferred - app layer validates type='sample' requires sample_status

-- =====================================================
-- Step 1: Create sample_status enum
-- =====================================================
-- Workflow: sent -> received -> feedback_pending -> feedback_received
-- Note: 'note' is also added to interaction_type as it exists in validation schema

DO $$ BEGIN
    CREATE TYPE "public"."sample_status" AS ENUM (
        'sent',
        'received',
        'feedback_pending',
        'feedback_received'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TYPE "public"."sample_status" OWNER TO "postgres";

-- =====================================================
-- Step 2: Add 'sample' and 'note' to interaction_type enum
-- =====================================================
-- These values exist in the Zod validation schema but not in DB enum

DO $$ BEGIN
    ALTER TYPE "public"."interaction_type" ADD VALUE IF NOT EXISTS 'sample';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TYPE "public"."interaction_type" ADD VALUE IF NOT EXISTS 'note';
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- Step 3: Add sample_status column to activities table
-- =====================================================
-- Nullable because it only applies when type = 'sample'

ALTER TABLE "public"."activities"
ADD COLUMN IF NOT EXISTS "sample_status" "public"."sample_status";

-- =====================================================
-- Step 4: CHECK constraint DEFERRED
-- =====================================================
-- PostgreSQL limitation: Cannot use newly-added enum values in CHECK constraints
-- within the same transaction (SQLSTATE 55P04: unsafe use of new value).
--
-- The constraint (type = 'sample' requires sample_status IS NOT NULL) is enforced
-- at the application layer via Zod validation in src/atomic-crm/validation/activity.ts
--
-- A separate migration can add the CHECK constraint after the enum value is committed.

-- =====================================================
-- Step 5: Create index for sample status filtering
-- =====================================================
-- Useful for querying samples by status (e.g., pending feedback)

CREATE INDEX IF NOT EXISTS "idx_activities_sample_status"
ON "public"."activities" ("sample_status")
WHERE "sample_status" IS NOT NULL;

-- =====================================================
-- Grant Permissions
-- =====================================================
-- Ensure authenticated users can insert activities with sample_status

-- No explicit GRANT needed as column inherits table permissions
-- RLS policies on activities table already handle row-level security

COMMENT ON COLUMN "public"."activities"."sample_status" IS
    'Status of sample activities. Required when type=sample. Values: sent, received, feedback_pending, feedback_received';
