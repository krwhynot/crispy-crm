


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA "pg_catalog";






CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






CREATE SCHEMA IF NOT EXISTS "private";


ALTER SCHEMA "private" OWNER TO "postgres";


COMMENT ON SCHEMA "private" IS 'Internal functions for RLS policies and security logic. Not exposed via API.';





ALTER SCHEMA "public" OWNER TO "postgres";


COMMENT ON SCHEMA "public" IS 'Cleaned up zombie functions referencing deleted contact_organizations table (2026-01-24). See Architectural Decision #7 for belongs-to pattern rationale.';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."activity_type" AS ENUM (
    'engagement',
    'interaction',
    'task',
    'activity'
);


ALTER TYPE "public"."activity_type" OWNER TO "postgres";


CREATE TYPE "public"."contact_role" AS ENUM (
    'decision_maker',
    'influencer',
    'buyer',
    'end_user',
    'gatekeeper',
    'champion',
    'technical',
    'executive'
);


ALTER TYPE "public"."contact_role" OWNER TO "postgres";


CREATE TYPE "public"."interaction_type" AS ENUM (
    'call',
    'email',
    'meeting',
    'demo',
    'proposal',
    'follow_up',
    'trade_show',
    'site_visit',
    'contract_review',
    'check_in',
    'social',
    'note',
    'sample',
    'administrative',
    'other',
    'stage_change'
);


ALTER TYPE "public"."interaction_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."interaction_type" IS 'Activity interaction types: call, email, meeting, demo, proposal, follow_up, trade_show, site_visit, contract_review, check_in, social, note';



CREATE TYPE "public"."loss_reason" AS ENUM (
    'price_too_high',
    'no_authorization',
    'competitor_relationship',
    'product_fit',
    'timing',
    'no_response',
    'other'
);


ALTER TYPE "public"."loss_reason" OWNER TO "postgres";


CREATE TYPE "public"."opportunity_stage" AS ENUM (
    'new_lead',
    'initial_outreach',
    'sample_visit_offered',
    'feedback_logged',
    'demo_scheduled',
    'closed_won',
    'closed_lost'
);


ALTER TYPE "public"."opportunity_stage" OWNER TO "postgres";


COMMENT ON TYPE "public"."opportunity_stage" IS 'Pipeline stages (7): new_lead -> initial_outreach -> sample_visit_offered -> feedback_logged -> demo_scheduled -> closed_won/closed_lost. Removed awaiting_response per PRD v1.18.';



CREATE TYPE "public"."opportunity_status" AS ENUM (
    'active',
    'on_hold',
    'nurturing',
    'stalled',
    'expired'
);


ALTER TYPE "public"."opportunity_status" OWNER TO "postgres";


CREATE TYPE "public"."organization_type" AS ENUM (
    'customer',
    'prospect',
    'principal',
    'distributor'
);


ALTER TYPE "public"."organization_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."organization_type" IS 'Organization classification: customer (active buyer), prospect (potential), principal (manufacturer), distributor (warehouse/delivery partner). Note: operator segments still exist for restaurant categorization.';



CREATE TYPE "public"."overdue_task_record" AS (
	"id" bigint,
	"title" "text",
	"description" "text",
	"due_date" "date",
	"days_overdue" integer,
	"priority" "text",
	"type" "text",
	"contact_id" bigint,
	"contact_name" "text",
	"opportunity_id" bigint,
	"opportunity_name" "text",
	"organization_id" bigint,
	"organization_name" "text"
);


ALTER TYPE "public"."overdue_task_record" OWNER TO "postgres";


CREATE TYPE "public"."priority_level" AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


ALTER TYPE "public"."priority_level" OWNER TO "postgres";


CREATE TYPE "public"."product_category" AS ENUM (
    'beverages',
    'dairy',
    'frozen',
    'fresh_produce',
    'meat_poultry',
    'seafood',
    'dry_goods',
    'snacks',
    'condiments',
    'baking_supplies',
    'spices_seasonings',
    'canned_goods',
    'pasta_grains',
    'oils_vinegars',
    'sweeteners',
    'cleaning_supplies',
    'paper_products',
    'equipment',
    'other'
);


ALTER TYPE "public"."product_category" OWNER TO "postgres";


CREATE TYPE "public"."product_status" AS ENUM (
    'active',
    'discontinued',
    'seasonal',
    'coming_soon',
    'limited_availability'
);


ALTER TYPE "public"."product_status" OWNER TO "postgres";


CREATE TYPE "public"."sample_status" AS ENUM (
    'sent',
    'received',
    'feedback_pending',
    'feedback_received'
);


ALTER TYPE "public"."sample_status" OWNER TO "postgres";


CREATE TYPE "public"."stale_deal_record" AS (
	"id" bigint,
	"name" "text",
	"stage" "text",
	"stage_threshold_days" integer,
	"days_since_activity" integer,
	"days_over_threshold" integer,
	"last_activity_date" timestamp with time zone,
	"customer_name" "text",
	"principal_name" "text",
	"priority" "text",
	"estimated_close_date" "date"
);


ALTER TYPE "public"."stale_deal_record" OWNER TO "postgres";


CREATE TYPE "public"."stale_opportunity_record" AS (
	"id" bigint,
	"name" "text",
	"stage" "text",
	"customer_organization_name" "text",
	"last_activity_date" timestamp with time zone,
	"days_inactive" integer,
	"stage_threshold" integer,
	"is_stale" boolean
);


ALTER TYPE "public"."stale_opportunity_record" OWNER TO "postgres";


CREATE TYPE "public"."task_type" AS ENUM (
    'Call',
    'Email',
    'Meeting',
    'Follow-up',
    'Demo',
    'Proposal',
    'Other'
);


ALTER TYPE "public"."task_type" OWNER TO "postgres";


COMMENT ON TYPE "public"."task_type" IS 'Task type categories: Call (phone), Email (written), Meeting (in-person/virtual), Follow-up (reminders), Demo (product demonstrations), Proposal (formal offers), Other (miscellaneous)';



CREATE TYPE "public"."today_task_record" AS (
	"id" bigint,
	"title" "text",
	"description" "text",
	"priority" "text",
	"type" "text",
	"contact_id" bigint,
	"contact_name" "text",
	"opportunity_id" bigint,
	"opportunity_name" "text",
	"organization_id" bigint,
	"organization_name" "text"
);


ALTER TYPE "public"."today_task_record" OWNER TO "postgres";


CREATE TYPE "public"."user_digest_summary" AS (
	"sales_id" bigint,
	"user_id" "uuid",
	"first_name" "text",
	"last_name" "text",
	"email" "text",
	"tasks_due_today" integer,
	"tasks_overdue" integer,
	"stale_deals" integer,
	"opportunities_updated_24h" integer,
	"activities_logged_24h" integer,
	"overdue_tasks" json,
	"stale_deals_list" json,
	"tasks_due_today_list" json
);


ALTER TYPE "public"."user_digest_summary" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'manager',
    'rep'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


COMMENT ON TYPE "public"."user_role" IS 'User roles: admin (full access), manager (edit all, no delete), rep (edit own only, no delete)';



CREATE TYPE "public"."win_reason" AS ENUM (
    'relationship',
    'product_quality',
    'price_competitive',
    'timing',
    'other'
);


ALTER TYPE "public"."win_reason" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "private"."can_access_by_role"("record_sales_id" bigint, "record_created_by" bigint DEFAULT NULL::bigint) RETURNS boolean
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  current_role text;
  current_sales_id bigint;
BEGIN
  -- No auth context = deny access (fail-safe)
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  -- Get current user's role and sales_id
  SELECT s.role::text, s.id
  INTO current_role, current_sales_id
  FROM public.sales s
  WHERE s.user_id = auth.uid()
    AND s.deleted_at IS NULL;

  -- No sales record = deny access (fail-safe)
  IF current_sales_id IS NULL THEN
    RETURN false;
  END IF;

  -- Admins and managers can access all records
  IF current_role IN ('admin', 'manager') THEN
    RETURN true;
  END IF;

  -- Reps can access records they own OR created
  -- COALESCE handles NULL created_by (treats as no match)
  RETURN (
    record_sales_id = current_sales_id OR
    COALESCE(record_created_by, 0) = current_sales_id
  );
END;
$$;


ALTER FUNCTION "private"."can_access_by_role"("record_sales_id" bigint, "record_created_by" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "private"."can_access_by_role"("record_sales_id" bigint, "record_created_by" bigint) IS 'Determines if the current user can access a record based on role and ownership. Admin/Manager: all access. Rep: own records or records they created. Returns FALSE when unauthenticated.';



CREATE OR REPLACE FUNCTION "private"."get_current_user_role"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN NULL  -- No auth context = no role
      ELSE (
        SELECT s.role::text
        FROM public.sales s
        WHERE s.user_id = auth.uid()
          AND s.deleted_at IS NULL
        LIMIT 1
      )
    END
$$;


ALTER FUNCTION "private"."get_current_user_role"() OWNER TO "postgres";


COMMENT ON FUNCTION "private"."get_current_user_role"() IS 'Returns the role (as text) of the currently authenticated user. Returns NULL when unauthenticated or no sales record exists. Used internally by RLS policies.';



CREATE OR REPLACE FUNCTION "private"."is_admin_or_manager"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN false  -- Fail-safe: deny when unauthenticated
      ELSE COALESCE(
        (
          SELECT s.role IN ('admin', 'manager')
          FROM public.sales s
          WHERE s.user_id = auth.uid()
            AND s.deleted_at IS NULL
        ),
        false  -- No sales record = deny access
      )
    END
$$;


ALTER FUNCTION "private"."is_admin_or_manager"() OWNER TO "postgres";


COMMENT ON FUNCTION "private"."is_admin_or_manager"() IS 'Returns TRUE if current user has admin or manager role. Returns FALSE when unauthenticated or no sales record exists. Used for privilege checks in RLS policies.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."sales" (
    "id" bigint NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "first_name" "text",
    "last_name" "text",
    "email" "text",
    "phone" "text",
    "avatar_url" "text",
    "is_admin" boolean DEFAULT false,
    "deleted_at" timestamp with time zone,
    "disabled" boolean DEFAULT false,
    "role" "public"."user_role" DEFAULT 'rep'::"public"."user_role" NOT NULL,
    "administrator" boolean GENERATED ALWAYS AS (("role" = 'admin'::"public"."user_role")) STORED,
    "digest_opt_in" boolean DEFAULT true NOT NULL,
    "timezone" "text" DEFAULT 'America/Chicago'::"text",
    CONSTRAINT "sales_timezone_check" CHECK (("timezone" ~ '^[A-Za-z]+/[A-Za-z_]+$'::"text"))
);


ALTER TABLE "public"."sales" OWNER TO "postgres";


COMMENT ON TABLE "public"."sales" IS 'Sales team members and authentication.
Contains is_admin field for role-based features.
RLS Policy: Shared access (users can see all team members).
Rationale: Team roster visibility for collaboration and assignment.
See /docs/SECURITY_MODEL.md for details.';



COMMENT ON COLUMN "public"."sales"."is_admin" IS 'DEPRECATED: Use role column instead. Kept for backward compatibility during transition.';



COMMENT ON COLUMN "public"."sales"."disabled" IS 'Account disabled flag for offboarding.
Disabled users cannot authenticate even if auth.users record exists.
Set to true when employee leaves company.';



COMMENT ON COLUMN "public"."sales"."administrator" IS 'Computed column for backward compatibility. Maps from role enum. Frontend should migrate to using role directly.';



COMMENT ON COLUMN "public"."sales"."digest_opt_in" IS 'User preference for receiving daily digest emails. Defaults to true.';



COMMENT ON COLUMN "public"."sales"."timezone" IS 'User timezone for display. Uses IANA timezone format (e.g., America/Chicago). Default is America/Chicago (Central Time).';



CREATE OR REPLACE FUNCTION "public"."admin_update_sale"("target_user_id" "uuid", "new_role" "public"."user_role" DEFAULT NULL::"public"."user_role", "new_disabled" boolean DEFAULT NULL::boolean, "new_avatar" "text" DEFAULT NULL::"text", "new_deleted_at" timestamp with time zone DEFAULT NULL::timestamp with time zone, "new_first_name" "text" DEFAULT NULL::"text", "new_last_name" "text" DEFAULT NULL::"text", "new_email" "text" DEFAULT NULL::"text", "new_phone" "text" DEFAULT NULL::"text") RETURNS "public"."sales"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  current_user_id UUID;
  current_user_role user_role;
  updated_record sales;
BEGIN
  -- Get current user from Supabase JWT claims
  current_user_id := auth.uid();

  -- If no authenticated user, deny access
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'P0001';
  END IF;

  -- Look up caller's role from sales table
  SELECT role INTO current_user_role
  FROM sales
  WHERE user_id = current_user_id AND deleted_at IS NULL;

  -- If caller has no sales record, deny access
  IF current_user_role IS NULL THEN
    RAISE EXCEPTION 'User profile not found' USING ERRCODE = 'P0001';
  END IF;

  -- AUTHORIZATION CHECK 1: Only admins can change role, disabled status, or soft-delete
  IF (new_role IS NOT NULL OR new_disabled IS NOT NULL OR new_deleted_at IS NOT NULL)
     AND current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Only administrators can modify role, disabled status, or delete users'
      USING ERRCODE = 'P0003'; -- maps to 403
  END IF;

  -- AUTHORIZATION CHECK 2: Non-admins can only update their own profile
  IF current_user_role != 'admin' AND target_user_id != current_user_id THEN
    RAISE EXCEPTION 'You can only update your own profile'
      USING ERRCODE = 'P0003'; -- maps to 403
  END IF;

  -- AUTHORIZATION CHECK 3: Profile field edits require self-edit for non-admins
  IF (new_first_name IS NOT NULL OR new_last_name IS NOT NULL
      OR new_email IS NOT NULL OR new_phone IS NOT NULL)
     AND current_user_role != 'admin'
     AND target_user_id != current_user_id THEN
    RAISE EXCEPTION 'You can only update your own profile fields'
      USING ERRCODE = 'P0003';
  END IF;

  -- All checks passed - perform the update
  UPDATE sales
  SET
    role = COALESCE(new_role, role),
    disabled = COALESCE(new_disabled, disabled),
    avatar_url = COALESCE(new_avatar, avatar_url),
    deleted_at = COALESCE(new_deleted_at, deleted_at),
    first_name = COALESCE(new_first_name, first_name),
    last_name = COALESCE(new_last_name, last_name),
    email = COALESCE(new_email, email),
    phone = COALESCE(new_phone, phone),
    updated_at = NOW()
  WHERE user_id = target_user_id AND (deleted_at IS NULL OR new_deleted_at IS NOT NULL)
  RETURNING * INTO updated_record;

  -- Raise error if target user doesn't exist
  IF updated_record IS NULL THEN
    RAISE EXCEPTION 'Target user not found' USING ERRCODE = 'P0004'; -- maps to 404
  END IF;

  RETURN updated_record;
END;
$$;


ALTER FUNCTION "public"."admin_update_sale"("target_user_id" "uuid", "new_role" "public"."user_role", "new_disabled" boolean, "new_avatar" "text", "new_deleted_at" timestamp with time zone, "new_first_name" "text", "new_last_name" "text", "new_email" "text", "new_phone" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."admin_update_sale"("target_user_id" "uuid", "new_role" "public"."user_role", "new_disabled" boolean, "new_avatar" "text", "new_deleted_at" timestamp with time zone, "new_first_name" "text", "new_last_name" "text", "new_email" "text", "new_phone" "text") IS 'SECURITY DEFINER with authorization: Only admins can modify role/disabled/deleted_at. Non-admins can update their own profile fields (first_name, last_name, email, phone) and avatar. 9-parameter version supports profile editing.';



CREATE OR REPLACE FUNCTION "public"."archive_contact_with_relations"("contact_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF contact_id IS NULL THEN
    RAISE EXCEPTION 'Contact ID cannot be null';
  END IF;

  UPDATE contacts
  SET deleted_at = NOW()
  WHERE id = archive_contact_with_relations.contact_id AND deleted_at IS NULL;

  UPDATE activities
  SET deleted_at = NOW()
  WHERE activities.contact_id = archive_contact_with_relations.contact_id
    AND deleted_at IS NULL;

  UPDATE "contactNotes"
  SET deleted_at = NOW()
  WHERE "contactNotes".contact_id = archive_contact_with_relations.contact_id
    AND deleted_at IS NULL;

  UPDATE interaction_participants
  SET deleted_at = NOW()
  WHERE interaction_participants.contact_id = archive_contact_with_relations.contact_id
    AND deleted_at IS NULL;

  UPDATE opportunity_contacts
  SET deleted_at = NOW()
  WHERE opportunity_contacts.contact_id = archive_contact_with_relations.contact_id
    AND deleted_at IS NULL;

  -- NEW: Cascade archive to user_favorites referencing this contact
  UPDATE user_favorites
  SET deleted_at = NOW()
  WHERE entity_type = 'contacts'
    AND entity_id = archive_contact_with_relations.contact_id
    AND deleted_at IS NULL;
END;
$$;


ALTER FUNCTION "public"."archive_contact_with_relations"("contact_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_opportunity_with_relations"("opp_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  rows_affected INTEGER;
  existing_deleted_at TIMESTAMPTZ;
BEGIN
  IF opp_id IS NULL THEN
    RAISE EXCEPTION 'Opportunity ID cannot be null';
  END IF;

  SELECT deleted_at INTO existing_deleted_at
  FROM opportunities WHERE id = opp_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Opportunity with ID % does not exist', opp_id;
  END IF;

  IF existing_deleted_at IS NOT NULL THEN
    RAISE EXCEPTION 'Opportunity with ID % was already deleted', opp_id;
  END IF;

  UPDATE opportunities
  SET deleted_at = NOW()
  WHERE id = opp_id AND deleted_at IS NULL;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;

  IF rows_affected = 0 THEN
    RAISE EXCEPTION 'Failed to archive opportunity %: concurrent modification', opp_id;
  END IF;

  UPDATE activities
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  UPDATE "opportunityNotes"
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  UPDATE opportunity_participants
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  UPDATE opportunity_contacts
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  UPDATE opportunity_products
  SET deleted_at = NOW()
  WHERE opportunity_id = opp_id AND deleted_at IS NULL;

  -- NEW: Cascade archive to user_favorites referencing this opportunity
  UPDATE user_favorites
  SET deleted_at = NOW()
  WHERE entity_type = 'opportunities'
    AND entity_id = opp_id
    AND deleted_at IS NULL;
END;
$$;


ALTER FUNCTION "public"."archive_opportunity_with_relations"("opp_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."archive_organization_with_relations"("org_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  contact_rec RECORD;
  opp_rec RECORD;
BEGIN
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organization ID cannot be null';
  END IF;

  UPDATE organizations
  SET deleted_at = NOW()
  WHERE id = org_id AND deleted_at IS NULL;

  UPDATE "organizationNotes"
  SET deleted_at = NOW()
  WHERE "organizationNotes".organization_id = archive_organization_with_relations.org_id
    AND deleted_at IS NULL;

  UPDATE activities
  SET deleted_at = NOW()
  WHERE activities.organization_id = archive_organization_with_relations.org_id
    AND deleted_at IS NULL;

  UPDATE organization_distributors
  SET deleted_at = NOW()
  WHERE organization_distributors.organization_id = archive_organization_with_relations.org_id
    AND deleted_at IS NULL;

  UPDATE distributor_principal_authorizations
  SET deleted_at = NOW()
  WHERE (distributor_principal_authorizations.principal_id = archive_organization_with_relations.org_id
      OR distributor_principal_authorizations.distributor_id = archive_organization_with_relations.org_id)
    AND deleted_at IS NULL;

  -- NEW: Cascade archive to user_favorites referencing this organization
  UPDATE user_favorites
  SET deleted_at = NOW()
  WHERE entity_type = 'organizations'
    AND entity_id = archive_organization_with_relations.org_id
    AND deleted_at IS NULL;

  FOR contact_rec IN
    SELECT id FROM contacts
    WHERE organization_id = archive_organization_with_relations.org_id
      AND deleted_at IS NULL
  LOOP
    PERFORM archive_contact_with_relations(contact_rec.id);
  END LOOP;

  FOR opp_rec IN
    SELECT id FROM opportunities
    WHERE customer_organization_id = archive_organization_with_relations.org_id
      AND deleted_at IS NULL
  LOOP
    PERFORM archive_opportunity_with_relations(opp_rec.id);
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."archive_organization_with_relations"("org_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."audit_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_old_data JSONB;
  v_new_data JSONB;
  v_key TEXT;
  v_old_value TEXT;
  v_new_value TEXT;
  v_changed_by BIGINT;
  v_record_id BIGINT;
BEGIN
  -- Get the sales.id (user identifier) from the changed record
  -- Pattern: All audited tables have created_by/updated_by fields
  IF TG_OP = 'DELETE' THEN
    v_changed_by := OLD.updated_by;  -- Last person who touched the record
    v_record_id := OLD.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := '{}'::jsonb;
  ELSIF TG_OP = 'UPDATE' THEN
    v_changed_by := NEW.updated_by;
    v_record_id := NEW.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    v_changed_by := NEW.created_by;
    v_record_id := NEW.id;
    v_old_data := '{}'::jsonb;
    v_new_data := to_jsonb(NEW);
  END IF;

  -- Loop through all keys in the new data
  FOR v_key IN SELECT jsonb_object_keys(v_new_data) LOOP
    -- Skip audit metadata fields and timestamps to avoid noise
    CONTINUE WHEN v_key IN ('created_at', 'updated_at', 'created_by', 'updated_by');

    v_old_value := v_old_data->>v_key;
    v_new_value := v_new_data->>v_key;

    -- Only log if value actually changed
    IF v_old_value IS DISTINCT FROM v_new_value THEN
      INSERT INTO audit_trail (
        table_name,
        record_id,
        field_name,
        old_value,
        new_value,
        changed_by,
        changed_at
      ) VALUES (
        TG_TABLE_NAME,
        v_record_id,
        v_key,
        v_old_value,
        v_new_value,
        v_changed_by,
        NOW()
      );
    END IF;
  END LOOP;

  -- For DELETE, also capture fields that existed in OLD but not in NEW
  IF TG_OP = 'DELETE' THEN
    FOR v_key IN SELECT jsonb_object_keys(v_old_data) LOOP
      CONTINUE WHEN v_key IN ('created_at', 'updated_at', 'created_by', 'updated_by');
      CONTINUE WHEN v_new_data ? v_key;  -- Skip if already processed above

      v_old_value := v_old_data->>v_key;

      INSERT INTO audit_trail (
        table_name,
        record_id,
        field_name,
        old_value,
        new_value,
        changed_by,
        changed_at
      ) VALUES (
        TG_TABLE_NAME,
        v_record_id,
        v_key,
        v_old_value,
        NULL,
        v_changed_by,
        NOW()
      );
    END LOOP;
  END IF;

  -- Trigger functions must return something
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION "public"."audit_changes"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."audit_changes"() IS 'Generic trigger function for field-level change tracking. Compares OLD and NEW rows, writes changes to audit_trail table.';



CREATE OR REPLACE FUNCTION "public"."audit_critical_field_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  critical_fields TEXT[];
  field_name TEXT;
  old_val TEXT;
  new_val TEXT;
BEGIN
  critical_fields := CASE TG_TABLE_NAME
    WHEN 'opportunities' THEN
      ARRAY['stage', 'account_manager_id', 'status', 'win_reason', 'loss_reason', 'deleted_at']
    WHEN 'contacts' THEN
      ARRAY['organization_id', 'deleted_at']
    WHEN 'organizations' THEN
      ARRAY['organization_type', 'status', 'deleted_at']
    WHEN 'sales' THEN
      ARRAY['role', 'disabled']
    ELSE
      ARRAY[]::TEXT[]
  END;

  FOREACH field_name IN ARRAY critical_fields LOOP
    EXECUTE format('SELECT ($1).%I::TEXT, ($2).%I::TEXT', field_name, field_name)
      INTO old_val, new_val
      USING OLD, NEW;

    IF old_val IS DISTINCT FROM new_val THEN
      INSERT INTO audit_trail (
        table_name,
        record_id,
        field_name,
        old_value,
        new_value,
        changed_by
      )
      VALUES (
        TG_TABLE_NAME,
        NEW.id,
        field_name,
        old_val,
        new_val,
        public.current_sales_id()
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."audit_critical_field_changes"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."audit_critical_field_changes"() IS 'Tier C: Log critical field changes only (stage, ownership, status, deleted_at). SECURITY DEFINER for audit_trail INSERT.';



CREATE OR REPLACE FUNCTION "public"."audit_user_favorites"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_old_data JSONB;
  v_new_data JSONB;
  v_key TEXT;
  v_old_value TEXT;
  v_new_value TEXT;
  v_changed_by BIGINT;
  v_record_id BIGINT;
  v_user_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
    v_record_id := OLD.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := '{}'::jsonb;
  ELSIF TG_OP = 'UPDATE' THEN
    v_user_id := NEW.user_id;
    v_record_id := NEW.id;
    v_old_data := to_jsonb(OLD);
    v_new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    v_user_id := NEW.user_id;
    v_record_id := NEW.id;
    v_old_data := '{}'::jsonb;
    v_new_data := to_jsonb(NEW);
  END IF;

  -- Map user_id (UUID) to sales.id (BIGINT) for audit_trail.changed_by
  -- Fixed: was referencing non-existent sales.auth_user_id, now uses sales.user_id
  SELECT id INTO v_changed_by FROM sales WHERE user_id = v_user_id;

  FOR v_key IN SELECT jsonb_object_keys(v_new_data) LOOP
    CONTINUE WHEN v_key IN ('created_at', 'updated_at', 'user_id', 'updated_by');

    v_old_value := v_old_data->>v_key;
    v_new_value := v_new_data->>v_key;

    IF v_old_value IS DISTINCT FROM v_new_value THEN
      INSERT INTO audit_trail (
        table_name, record_id, field_name, old_value, new_value, changed_by, changed_at
      ) VALUES (
        TG_TABLE_NAME, v_record_id, v_key, v_old_value, v_new_value, v_changed_by, NOW()
      );
    END IF;
  END LOOP;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION "public"."audit_user_favorites"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cascade_activity_contact_from_opportunity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_primary_contact_id BIGINT;
BEGIN
    IF NEW.opportunity_id IS NOT NULL AND NEW.contact_id IS NULL THEN
        SELECT oc.contact_id INTO v_primary_contact_id
        FROM opportunity_contacts oc
        WHERE oc.opportunity_id = NEW.opportunity_id
          AND oc.is_primary = true
        LIMIT 1;

        IF v_primary_contact_id IS NOT NULL THEN
            NEW.contact_id := v_primary_contact_id;
            RAISE NOTICE 'Cascaded contact_id % from opportunity % primary contact',
                         v_primary_contact_id, NEW.opportunity_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."cascade_activity_contact_from_opportunity"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cascade_activity_contact_from_opportunity"() IS 'Auto-cascades contact_id from the opportunity''s primary contact when:
- Activity is inserted with opportunity_id
- Activity does NOT have an explicit contact_id
This ensures activities are automatically linked to the primary stakeholder
without requiring explicit contact selection in the UI.';



CREATE OR REPLACE FUNCTION "public"."cascade_soft_delete_to_notes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    CASE TG_TABLE_NAME
      WHEN 'contacts' THEN
        UPDATE contact_notes
        SET deleted_at = NEW.deleted_at
        WHERE contact_id = NEW.id
          AND deleted_at IS NULL;

      WHEN 'opportunities' THEN
        UPDATE opportunity_notes
        SET deleted_at = NEW.deleted_at
        WHERE opportunity_id = NEW.id
          AND deleted_at IS NULL;

      WHEN 'organizations' THEN
        UPDATE organization_notes
        SET deleted_at = NEW.deleted_at
        WHERE organization_id = NEW.id
          AND deleted_at IS NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."cascade_soft_delete_to_notes"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cascade_soft_delete_to_notes"() IS 'Tier C: Auto-cascade soft-delete to notes tables (snake_case). Notes are contextual - safe to cascade.';



CREATE OR REPLACE FUNCTION "public"."check_authorization"("_distributor_id" bigint, "_principal_id" bigint DEFAULT NULL::bigint, "_product_id" bigint DEFAULT NULL::bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_principal_id BIGINT;
    v_product_name TEXT;
    v_result JSONB;
    v_auth_record RECORD;
BEGIN
    IF _principal_id IS NOT NULL THEN
        v_principal_id := _principal_id;
    ELSIF _product_id IS NOT NULL THEN
        SELECT principal_id, name
        INTO v_principal_id, v_product_name
        FROM products
        WHERE id = _product_id AND deleted_at IS NULL;

        IF v_principal_id IS NULL THEN
            RETURN jsonb_build_object(
                'authorized', false,
                'error', 'Product not found or has no principal',
                'product_id', _product_id,
                'distributor_id', _distributor_id
            );
        END IF;
    ELSE
        RETURN jsonb_build_object(
            'authorized', false,
            'error', 'Either principal_id or product_id must be provided',
            'distributor_id', _distributor_id
        );
    END IF;

    SELECT
        authorization_id,
        distributor_name,
        principal_name,
        is_authorized,
        is_currently_valid,
        authorization_date,
        expiration_date,
        territory_restrictions,
        notes
    INTO v_auth_record
    FROM authorization_status
    WHERE distributor_id = _distributor_id
      AND principal_id = v_principal_id;

    IF v_auth_record IS NULL THEN
        v_result := jsonb_build_object(
            'authorized', false,
            'reason', 'no_authorization_record',
            'distributor_id', _distributor_id,
            'principal_id', v_principal_id
        );
    ELSIF NOT v_auth_record.is_currently_valid THEN
        v_result := jsonb_build_object(
            'authorized', false,
            'reason', CASE
                WHEN NOT v_auth_record.is_authorized THEN 'authorization_revoked'
                WHEN v_auth_record.expiration_date < CURRENT_DATE THEN 'authorization_expired'
                ELSE 'authorization_invalid'
            END,
            'authorization_id', v_auth_record.authorization_id,
            'distributor_id', _distributor_id,
            'distributor_name', v_auth_record.distributor_name,
            'principal_id', v_principal_id,
            'principal_name', v_auth_record.principal_name,
            'expiration_date', v_auth_record.expiration_date
        );
    ELSE
        v_result := jsonb_build_object(
            'authorized', true,
            'authorization_id', v_auth_record.authorization_id,
            'distributor_id', _distributor_id,
            'distributor_name', v_auth_record.distributor_name,
            'principal_id', v_principal_id,
            'principal_name', v_auth_record.principal_name,
            'authorization_date', v_auth_record.authorization_date,
            'expiration_date', v_auth_record.expiration_date,
            'territory_restrictions', v_auth_record.territory_restrictions,
            'notes', v_auth_record.notes
        );
    END IF;

    IF _product_id IS NOT NULL THEN
        v_result := v_result || jsonb_build_object(
            'product_id', _product_id,
            'product_name', v_product_name,
            'resolved_via', 'product_lookup'
        );
    END IF;

    RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."check_authorization"("_distributor_id" bigint, "_principal_id" bigint, "_product_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_authorization_batch"("_distributor_id" bigint, "_product_ids" bigint[] DEFAULT NULL::bigint[], "_principal_ids" bigint[] DEFAULT NULL::bigint[]) RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_results JSONB := '[]'::jsonb;
    v_id BIGINT;
    v_check_result JSONB;
BEGIN
    IF _product_ids IS NOT NULL THEN
        FOREACH v_id IN ARRAY _product_ids
        LOOP
            v_check_result := check_authorization(_distributor_id, NULL, v_id);
            v_results := v_results || jsonb_build_array(v_check_result);
        END LOOP;
    END IF;

    IF _principal_ids IS NOT NULL THEN
        FOREACH v_id IN ARRAY _principal_ids
        LOOP
            v_check_result := check_authorization(_distributor_id, v_id, NULL);
            v_results := v_results || jsonb_build_array(v_check_result);
        END LOOP;
    END IF;

    RETURN jsonb_build_object(
        'distributor_id', _distributor_id,
        'total_checked', jsonb_array_length(v_results),
        'all_authorized', (
            SELECT bool_and((item->>'authorized')::boolean)
            FROM jsonb_array_elements(v_results) AS item
        ),
        'results', v_results
    );
END;
$$;


ALTER FUNCTION "public"."check_authorization_batch"("_distributor_id" bigint, "_product_ids" bigint[], "_principal_ids" bigint[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_opportunity_concurrent_update"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
BEGIN
  -- If updated_at was modified very recently (within 1 second),
  -- it indicates another transaction just updated this row.
  -- This helps detect concurrent edits for monitoring purposes.
  IF OLD.updated_at IS NOT NULL AND
     OLD.updated_at > (NOW() - INTERVAL '1 second') THEN
    -- Log the concurrent update event for monitoring/debugging
    -- This notice appears in database logs (select from pg_stat_statements)
    RAISE NOTICE 'Concurrent update detected for opportunity %: last updated by %, now updating',
      NEW.id,
      OLD.updated_by;
  END IF;

  -- Always update the updated_at timestamp to current time
  -- This serves as the version identifier for optimistic locking
  -- React Admin compares this value before saving to detect conflicts
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_opportunity_concurrent_update"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_opportunity_concurrent_update"() IS 'Detects and logs concurrent updates to opportunities for optimistic locking. Always updates the updated_at timestamp to serve as a version identifier. Integrates with React Admin previousData.updated_at conflict detection.';



CREATE OR REPLACE FUNCTION "public"."check_organization_cycle"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.parent_organization_id = NEW.id THEN
    RAISE EXCEPTION 'Organization cannot be its own parent';
  END IF;

  IF NEW.parent_organization_id IS NOT NULL THEN
    IF EXISTS (
      WITH RECURSIVE hierarchy AS (
        SELECT id, parent_organization_id
        FROM organizations
        WHERE id = NEW.parent_organization_id

        UNION ALL

        SELECT o.id, o.parent_organization_id
        FROM organizations o
        JOIN hierarchy h ON o.parent_organization_id = h.id
      )
      SELECT 1 FROM hierarchy WHERE id = NEW.id
    ) THEN
      RAISE EXCEPTION 'Circular reference detected: Organization % would create a cycle', NEW.name;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_organization_cycle"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_organization_delete_allowed"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only check on soft-delete (deleted_at being set from NULL to timestamp)
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM opportunities
      WHERE (
        customer_organization_id = OLD.id
        OR principal_organization_id = OLD.id
        OR distributor_organization_id = OLD.id
      )
      AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Cannot archive organization with active opportunities. Archive or reassign opportunities first.'
        USING HINT = 'Use opportunity reassignment or archive opportunities before archiving organization.',
              ERRCODE = '23503';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_organization_delete_allowed"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_organization_delete_allowed"() IS 'Tier C: Block org archive if active opportunities exist (any of 3 FK columns). Protects revenue data.';



CREATE OR REPLACE FUNCTION "public"."check_overdue_tasks"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  task_record RECORD;
  notification_count INT := 0;
  days_overdue INT;
  today_date DATE := CURRENT_DATE;
BEGIN
  RAISE NOTICE 'Starting overdue tasks check at %', NOW();

  FOR task_record IN
    SELECT a.id, a.subject AS title, a.due_date, a.sales_id, s.user_id
    FROM activities a
    INNER JOIN sales s ON a.sales_id = s.id
    WHERE a.activity_type = 'task'
      AND a.due_date < today_date
      AND a.completed = false
      AND a.overdue_notified_at IS NULL
      AND a.sales_id IS NOT NULL
      AND a.deleted_at IS NULL
  LOOP
    days_overdue := today_date - task_record.due_date;

    INSERT INTO notifications (user_id, type, message, entity_type, entity_id)
    VALUES (
      task_record.user_id,
      'task_overdue',
      'Task "' || task_record.title || '" is ' || days_overdue || ' day' ||
        CASE WHEN days_overdue = 1 THEN '' ELSE 's' END || ' overdue',
      'task',
      task_record.id
    );

    UPDATE activities
    SET overdue_notified_at = NOW()
    WHERE id = task_record.id;

    notification_count := notification_count + 1;
  END LOOP;

  RAISE NOTICE 'Created % overdue task notifications', notification_count;

  RETURN json_build_object(
    'success', true,
    'notificationsCreated', notification_count,
    'executedAt', NOW()
  );
END;
$$;


ALTER FUNCTION "public"."check_overdue_tasks"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."check_overdue_tasks"() IS 'Checks for overdue tasks and creates notifications. Designed to be called daily by pg_cron or Edge Function.';



CREATE OR REPLACE FUNCTION "public"."check_similar_opportunities"("p_name" "text", "p_threshold" double precision DEFAULT 0.3, "p_exclude_id" bigint DEFAULT NULL::bigint, "p_limit" integer DEFAULT 10) RETURNS TABLE("id" bigint, "name" "text", "stage" "text", "similarity_score" real, "principal_organization_name" "text", "customer_organization_name" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    o.id,
    o.name,
    o.stage::TEXT,
    extensions.similarity(lower(o.name), lower(p_name)) AS similarity_score,
    p.name AS principal_organization_name,
    c.name AS customer_organization_name
  FROM opportunities o
  LEFT JOIN organizations p ON o.principal_organization_id = p.id
  LEFT JOIN organizations c ON o.customer_organization_id = c.id
  WHERE o.deleted_at IS NULL
    AND o.stage NOT IN ('closed_won', 'closed_lost')
    AND (p_exclude_id IS NULL OR o.id != p_exclude_id)
    AND extensions.similarity(lower(o.name), lower(p_name)) >= p_threshold
  ORDER BY similarity_score DESC
  LIMIT p_limit;
END;
$$;


ALTER FUNCTION "public"."check_similar_opportunities"("p_name" "text", "p_threshold" double precision, "p_exclude_id" bigint, "p_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."cleanup_old_notifications"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  UPDATE notifications
  SET deleted_at = NOW()
  WHERE created_at < NOW() - INTERVAL '30 days'
    AND deleted_at IS NULL;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."cleanup_old_notifications"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_old_notifications"() IS 'Automatically deletes notifications older than 30 days';



CREATE OR REPLACE FUNCTION "public"."cleanup_tag_references"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    UPDATE contacts
    SET tags = array_remove(tags, OLD.id)
    WHERE OLD.id = ANY(tags)
      AND deleted_at IS NULL;

    UPDATE organizations
    SET tags = array_remove(tags, OLD.id)
    WHERE OLD.id = ANY(tags)
      AND deleted_at IS NULL;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."cleanup_tag_references"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cleanup_tag_references"() IS 'Removes soft-deleted tag IDs from contacts/organizations bigint[] arrays. DESTRUCTIVE: un-deleting a tag does NOT restore array relationships. opportunities.tags excluded (text[] free-form labels, not bigint[] managed IDs).';



CREATE OR REPLACE FUNCTION "public"."complete_task_with_followup"("p_task_id" bigint, "p_activity_data" "jsonb", "p_opportunity_stage" "text" DEFAULT NULL::"text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_task RECORD;
  v_activity_id BIGINT;
  v_sales_id BIGINT;  -- RESTORED: proper lookup variable
  v_opportunity_id BIGINT;
BEGIN
  -- RESTORED: Look up sales_id for current user (fixes auth.uid()::BIGINT regression)
  SELECT id INTO v_sales_id
  FROM public.sales
  WHERE user_id = auth.uid();

  IF v_sales_id IS NULL THEN
    RAISE EXCEPTION 'No sales record found for current user';
  END IF;

  -- Validate inputs
  IF p_task_id IS NULL THEN
    RAISE EXCEPTION 'task_id is required';
  END IF;

  IF p_activity_data IS NULL OR p_activity_data->>'description' IS NULL THEN
    RAISE EXCEPTION 'activity description is required';
  END IF;

  -- Get task details
  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id
    AND deleted_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found or already deleted: %', p_task_id;
  END IF;

  IF v_task.completed = TRUE THEN
    RAISE EXCEPTION 'Task is already completed: %', p_task_id;
  END IF;

  -- 1. Mark task complete
  UPDATE public.tasks
  SET
    completed = TRUE,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_task_id;

  -- 2. Create activity linked to task
  IF v_task.opportunity_id IS NOT NULL THEN
    -- Create interaction (requires opportunity)
    INSERT INTO public.activities (
      activity_type,
      type,
      subject,
      description,
      activity_date,
      opportunity_id,
      contact_id,
      organization_id,
      related_task_id,
      created_by
    ) VALUES (
      'interaction',
      COALESCE((p_activity_data->>'type')::public.interaction_type, 'follow_up'),
      COALESCE(p_activity_data->>'subject', v_task.title),
      p_activity_data->>'description',
      COALESCE((p_activity_data->>'activity_date')::TIMESTAMPTZ, NOW()),
      v_task.opportunity_id,
      v_task.contact_id,
      (SELECT principal_organization_id FROM public.opportunities WHERE id = v_task.opportunity_id),
      p_task_id,
      v_sales_id  -- FIXED: was auth.uid()::BIGINT
    ) RETURNING id INTO v_activity_id;

    v_opportunity_id := v_task.opportunity_id;
  ELSE
    -- Create engagement (no opportunity required)
    IF v_task.contact_id IS NULL AND v_task.organization_id IS NULL THEN
      RAISE EXCEPTION 'Task must have either contact_id or organization_id to create activity';
    END IF;

    INSERT INTO public.activities (
      activity_type,
      type,
      subject,
      description,
      activity_date,
      contact_id,
      organization_id,
      related_task_id,
      created_by
    ) VALUES (
      'engagement',
      COALESCE((p_activity_data->>'type')::public.interaction_type, 'follow_up'),
      COALESCE(p_activity_data->>'subject', v_task.title),
      p_activity_data->>'description',
      COALESCE((p_activity_data->>'activity_date')::TIMESTAMPTZ, NOW()),
      v_task.contact_id,
      v_task.organization_id,
      p_task_id,
      v_sales_id  -- FIXED: was auth.uid()::BIGINT
    ) RETURNING id INTO v_activity_id;

    v_opportunity_id := NULL;
  END IF;

  -- 3. Update opportunity stage (if provided and task has opportunity)
  IF p_opportunity_stage IS NOT NULL AND v_opportunity_id IS NOT NULL THEN
    UPDATE public.opportunities
    SET
      stage = p_opportunity_stage::public.opportunity_stage,
      stage_changed_at = NOW(),
      updated_at = NOW()
    WHERE id = v_opportunity_id
      AND deleted_at IS NULL;
  END IF;

  -- Return result
  RETURN jsonb_build_object(
    'task_id', p_task_id,
    'activity_id', v_activity_id,
    'opportunity_id', v_opportunity_id,
    'success', true
  );

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to complete task: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."complete_task_with_followup"("p_task_id" bigint, "p_activity_data" "jsonb", "p_opportunity_stage" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."complete_task_with_followup"("p_task_id" bigint, "p_activity_data" "jsonb", "p_opportunity_stage" "text") IS 'Atomically completes a task, creates a linked activity, and optionally updates opportunity stage. Fixed: uses v_sales_id lookup instead of auth.uid()::BIGINT cast (regression from 20260201000005).';



CREATE OR REPLACE FUNCTION "public"."create_booth_visitor_opportunity"("_data" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_catalog'
    AS $$
DECLARE
  _org_id BIGINT;
  _contact_id BIGINT;
  _opp_id BIGINT;
  _account_manager_id BIGINT;
  _principal_id BIGINT;
  _email_val TEXT;
  _phone_val TEXT;
  _email_jsonb JSONB;
  _phone_jsonb JSONB;
  _principal_name TEXT;
  _principal_type organization_type;
  _opp_name TEXT;
  _first_name TEXT;
  _last_name TEXT;
  _org_name TEXT;
  _city TEXT;
  _state TEXT;
  _campaign TEXT;
  _quick_note TEXT;
  _create_contact BOOLEAN;
BEGIN
  _first_name := _data->>'first_name';
  _last_name := _data->>'last_name';
  _org_name := _data->>'org_name';
  _city := _data->>'city';
  _state := _data->>'state';
  _campaign := COALESCE(_data->>'campaign', '');
  _quick_note := _data->>'quick_note';
  _email_val := _data->>'email';
  _phone_val := _data->>'phone';
  _principal_id := (_data->>'principal_id')::BIGINT;
  _org_id := (_data->>'organization_id')::BIGINT;

  IF _principal_id IS NULL THEN
    RAISE EXCEPTION 'principal_id is required';
  END IF;

  _account_manager_id := COALESCE(
    (_data->>'account_manager_id')::BIGINT,
    (SELECT id FROM sales WHERE user_id = auth.uid())
  );

  IF _account_manager_id IS NULL THEN
    RAISE EXCEPTION 'account_manager_id is required or current user must have a sales record. User ID: %', auth.uid();
  END IF;

  IF _org_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM organizations WHERE id = _org_id AND deleted_at IS NULL) THEN
      RAISE EXCEPTION 'Organization with id % does not exist or is deleted', _org_id;
    END IF;
    SELECT name INTO _org_name FROM organizations WHERE id = _org_id;
  ELSE
    IF _org_name IS NULL OR _org_name = '' THEN
      RAISE EXCEPTION 'Either organization_id or org_name is required';
    END IF;
    INSERT INTO organizations (name, city, state, organization_type, sales_id, segment_id)
    VALUES (_org_name, _city, _state, 'customer', _account_manager_id, '562062be-c15b-417f-b2a1-d4a643d69d52'::uuid)
    RETURNING id INTO _org_id;
  END IF;

  SELECT name, organization_type INTO _principal_name, _principal_type
  FROM organizations WHERE id = _principal_id;

  IF _principal_name IS NULL THEN
    RAISE EXCEPTION 'Principal organization with id % does not exist', _principal_id;
  END IF;

  IF _principal_type != 'principal' THEN
    RAISE EXCEPTION 'Organization % is not a principal', _principal_id;
  END IF;

  _create_contact := (_first_name IS NOT NULL OR _last_name IS NOT NULL OR _email_val IS NOT NULL OR _phone_val IS NOT NULL);

  IF _create_contact THEN
    IF _email_val IS NOT NULL AND _email_val != '' THEN
      _email_jsonb := jsonb_build_array(jsonb_build_object('email', _email_val, 'type', 'Work'));
    ELSE
      _email_jsonb := '[]'::jsonb;
    END IF;

    IF _phone_val IS NOT NULL AND _phone_val != '' THEN
      _phone_jsonb := jsonb_build_array(jsonb_build_object('number', _phone_val, 'type', 'Work'));
    ELSE
      _phone_jsonb := '[]'::jsonb;
    END IF;

    INSERT INTO contacts (name, first_name, last_name, organization_id, sales_id, email, phone, first_seen, last_seen, tags)
    VALUES (
      COALESCE(_first_name, '') || CASE WHEN _first_name IS NOT NULL AND _last_name IS NOT NULL THEN ' ' ELSE '' END || COALESCE(_last_name, ''),
      _first_name, _last_name, _org_id, _account_manager_id, _email_jsonb, _phone_jsonb, NOW(), NOW(), '{}'::bigint[]
    ) RETURNING id INTO _contact_id;
  END IF;

  _opp_name := _org_name || ' - ' || _principal_name;

  INSERT INTO opportunities (
    name, customer_organization_id, principal_organization_id, contact_ids, campaign,
    stage, priority, estimated_close_date, lead_source, description, opportunity_owner_id
  ) VALUES (
    _opp_name, _org_id, _principal_id,
    CASE WHEN _contact_id IS NOT NULL THEN ARRAY[_contact_id] ELSE '{}'::bigint[] END,
    _campaign, 'new_lead', 'medium', (CURRENT_DATE + INTERVAL '30 days')::date,
    'trade_show', NULLIF(_quick_note, ''), _account_manager_id
  ) RETURNING id INTO _opp_id;

  -- Link products if provided (using correct column: product_id_reference)
  IF _data->'product_ids' IS NOT NULL THEN
    INSERT INTO opportunity_products (opportunity_id, product_id_reference)
    SELECT _opp_id, (jsonb_array_elements_text(_data->'product_ids'))::BIGINT;
  END IF;

  RETURN jsonb_build_object('organization_id', _org_id, 'contact_id', _contact_id, 'opportunity_id', _opp_id, 'success', true);

EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Failed to create booth visitor: %', SQLERRM;
END;
$$;


ALTER FUNCTION "public"."create_booth_visitor_opportunity"("_data" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_opportunity_with_participants"("p_opportunity_data" "jsonb", "p_participants" "jsonb"[]) RETURNS bigint
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_opportunity_id BIGINT;
    v_participant JSONB;
    v_customer_count INTEGER := 0;
    v_principal_count INTEGER := 0;
BEGIN
    FOREACH v_participant IN ARRAY p_participants
    LOOP
        IF v_participant->>'role' = 'customer' THEN
            v_customer_count := v_customer_count + 1;
        ELSIF v_participant->>'role' = 'principal' THEN
            v_principal_count := v_principal_count + 1;
        END IF;
    END LOOP;

    IF v_customer_count = 0 THEN
        RAISE EXCEPTION 'Opportunity must have at least one customer participant';
    END IF;

    INSERT INTO opportunities (
        name, description, stage, status, priority, amount, estimated_close_date,
        opportunity_owner_id, created_at, updated_at
    )
    VALUES (
        p_opportunity_data->>'name', p_opportunity_data->>'description',
        COALESCE((p_opportunity_data->>'stage')::opportunity_stage, 'lead'),
        COALESCE((p_opportunity_data->>'status')::opportunity_status, 'active'),
        COALESCE((p_opportunity_data->>'priority')::priority_level, 'medium'),
        (p_opportunity_data->>'amount')::NUMERIC,
        (p_opportunity_data->>'estimated_close_date')::DATE,
        (p_opportunity_data->>'opportunity_owner_id')::BIGINT,
        NOW(), NOW()
    )
    RETURNING id INTO v_opportunity_id;

    FOREACH v_participant IN ARRAY p_participants
    LOOP
        INSERT INTO opportunity_participants (
            opportunity_id, organization_id, role, is_primary,
            commission_rate, territory, notes, created_by
        )
        VALUES (
            v_opportunity_id,
            (v_participant->>'organization_id')::BIGINT,
            v_participant->>'role',
            COALESCE((v_participant->>'is_primary')::BOOLEAN, false),
            (v_participant->>'commission_rate')::NUMERIC,
            v_participant->>'territory',
            v_participant->>'notes',
            (v_participant->>'created_by')::BIGINT
        );
    END LOOP;

    RETURN v_opportunity_id;
END;
$$;


ALTER FUNCTION "public"."create_opportunity_with_participants"("p_opportunity_data" "jsonb", "p_participants" "jsonb"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_product_with_distributors"("product_data" "jsonb", "distributors" "jsonb" DEFAULT '[]'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_product_id BIGINT;
    v_created_product RECORD;
BEGIN
    -- 1. Insert the product (note: status cast to product_status enum)
    INSERT INTO products (
        name,
        principal_id,
        category,
        status,
        description,
        manufacturer_part_number,
        created_by,
        updated_by
    )
    VALUES (
        product_data->>'name',
        (product_data->>'principal_id')::BIGINT,
        product_data->>'category',
        COALESCE(product_data->>'status', 'active')::product_status,
        product_data->>'description',
        product_data->>'manufacturer_part_number',
        (product_data->>'created_by')::BIGINT,
        (product_data->>'updated_by')::BIGINT
    )
    RETURNING id INTO v_product_id;

    -- 2. Insert product_distributors junction records if provided
    IF distributors IS NOT NULL AND JSONB_ARRAY_LENGTH(distributors) > 0 THEN
        INSERT INTO product_distributors (
            product_id,
            distributor_id,
            vendor_item_number,
            status,
            notes
        )
        SELECT
            v_product_id,
            (d->>'distributor_id')::BIGINT,
            d->>'vendor_item_number',
            COALESCE(d->>'status', 'pending'),
            d->>'notes'
        FROM JSONB_ARRAY_ELEMENTS(distributors) AS d;
    END IF;

    -- 3. Return the created product
    SELECT * FROM products WHERE id = v_product_id INTO v_created_product;
    RETURN TO_JSONB(v_created_product);
END;
$$;


ALTER FUNCTION "public"."create_product_with_distributors"("product_data" "jsonb", "distributors" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_product_with_distributors"("product_data" "jsonb", "distributors" "jsonb") IS 'Atomically creates a product and its distributor associations.
SECURITY INVOKER: RLS policies apply (per Engineering Constitution).
Parameters:
- product_data: JSONB with product fields (name, principal_id, category, status, description, manufacturer_part_number, created_by, updated_by)
- distributors: JSONB array of distributor records [{distributor_id, vendor_item_number, status, notes}]
Returns: The created product record as JSONB';



CREATE OR REPLACE FUNCTION "public"."current_sales_id"() RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT id FROM public.sales WHERE user_id = auth.uid()
$$;


ALTER FUNCTION "public"."current_sales_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."current_sales_id"() IS 'Returns sales record ID for authenticated user. SECURITY DEFINER with empty search_path.';



CREATE OR REPLACE FUNCTION "public"."enforce_sales_column_restrictions"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  current_user_id UUID;
  is_self_update BOOLEAN;
  caller_is_admin BOOLEAN;
BEGIN
  -- Get current user (may be NULL for service role or local dev)
  current_user_id := auth.uid();

  -- LOG: Always log what's happening
  RAISE LOG '[SALES_TRIGGER] UPDATE on sales.id=% | auth.uid()=% | target_user_id=%',
    NEW.id, current_user_id, NEW.user_id;

  -- Check if caller is admin
  caller_is_admin := COALESCE(is_admin(), FALSE);

  -- ADMIN BYPASS: Admins can edit ANY field for ANY user
  IF caller_is_admin THEN
    RAISE LOG '[SALES_TRIGGER] ALLOWED: Admin has full edit access';
    NEW.updated_at := NOW();
    RETURN NEW;
  END IF;

  -- NON-ADMIN PATH: Enforce restrictions

  -- When auth.uid() is NULL, we cannot determine the caller identity
  -- For non-admins, this is a problem - block the update
  IF current_user_id IS NULL THEN
    RAISE LOG '[SALES_TRIGGER] BLOCKED: Non-admin with NULL auth.uid() cannot update';
    RAISE EXCEPTION 'Authentication required for this operation'
      USING ERRCODE = 'P0003';
  END IF;

  -- Check if this is a self-update
  is_self_update := (NEW.user_id = current_user_id);

  RAISE LOG '[SALES_TRIGGER] is_self_update=% | caller_is_admin=%', is_self_update, caller_is_admin;

  -- Profile fields: Non-admins can only change their OWN profile
  IF NOT is_self_update THEN
    IF NEW.first_name IS DISTINCT FROM OLD.first_name THEN
      RAISE LOG '[SALES_TRIGGER] BLOCKED: Non-admin cannot modify another user''s first_name';
      RAISE EXCEPTION 'Cannot modify another user''s first_name'
        USING ERRCODE = 'P0003';
    END IF;
    IF NEW.last_name IS DISTINCT FROM OLD.last_name THEN
      RAISE LOG '[SALES_TRIGGER] BLOCKED: Non-admin cannot modify another user''s last_name';
      RAISE EXCEPTION 'Cannot modify another user''s last_name'
        USING ERRCODE = 'P0003';
    END IF;
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE LOG '[SALES_TRIGGER] BLOCKED: Non-admin cannot modify another user''s email';
      RAISE EXCEPTION 'Cannot modify another user''s email'
        USING ERRCODE = 'P0003';
    END IF;
    IF NEW.phone IS DISTINCT FROM OLD.phone THEN
      RAISE LOG '[SALES_TRIGGER] BLOCKED: Non-admin cannot modify another user''s phone';
      RAISE EXCEPTION 'Cannot modify another user''s phone'
        USING ERRCODE = 'P0003';
    END IF;
  END IF;

  -- Permission fields: ONLY admins can change these (already handled above for admins)
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE LOG '[SALES_TRIGGER] BLOCKED: Non-admin tried to modify role';
    RAISE EXCEPTION 'Only administrators can modify role'
      USING ERRCODE = 'P0003';
  END IF;
  IF NEW.disabled IS DISTINCT FROM OLD.disabled THEN
    RAISE LOG '[SALES_TRIGGER] BLOCKED: Non-admin tried to modify disabled status';
    RAISE EXCEPTION 'Only administrators can modify disabled status'
      USING ERRCODE = 'P0003';
  END IF;

  -- Auto-update timestamp
  NEW.updated_at := NOW();

  RAISE LOG '[SALES_TRIGGER] SUCCESS: Self-update completed for sales.id=%', NEW.id;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."enforce_sales_column_restrictions"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."enforce_sales_column_restrictions"() IS 'Enforces column-level security: Admins have full access. Non-admins can only edit their own profile fields and cannot change permissions.';



CREATE OR REPLACE FUNCTION "public"."exec_sql"("sql_query" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result jsonb;
  jwt_role text;
BEGIN
  -- Extract role from JWT claims, defaulting to empty string if NULL
  -- This prevents NULL bypass: NULL != 'service_role' returns NULL (falsy), skipping the exception
  jwt_role := COALESCE(
    current_setting('request.jwt.claims', true)::jsonb->>'role',
    ''
  );

  -- Only allow service role to execute
  IF jwt_role != 'service_role' THEN
    RAISE EXCEPTION 'Access denied: exec_sql requires service_role';
  END IF;

  -- Execute the query and return results as JSONB
  EXECUTE format('SELECT jsonb_agg(row_to_json(t)) FROM (%s) t', sql_query) INTO result;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."exec_sql"("sql_query" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."exec_sql"("sql_query" "text") IS 'Execute arbitrary SQL and return results as JSONB (service_role only, security hardened)';



CREATE OR REPLACE FUNCTION "public"."generate_daily_digest"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_record RECORD;
  digest_count INT := 0;
  notification_count INT := 0;
  today_date DATE := CURRENT_DATE;
  yesterday_date DATE := CURRENT_DATE - INTERVAL '1 day';
  tasks_due_today INT;
  tasks_overdue INT;
  opportunities_updated INT;
  activities_yesterday INT;
  message_parts TEXT[];
  digest_message TEXT;
BEGIN
  RAISE NOTICE 'Starting daily digest generation at %', NOW();

  FOR user_record IN
    SELECT id, user_id, first_name, last_name, email
    FROM sales
    WHERE disabled = false
      AND user_id IS NOT NULL
  LOOP
    digest_count := digest_count + 1;

    -- Count tasks due today (from activities table)
    SELECT COUNT(*) INTO tasks_due_today
    FROM activities
    WHERE activity_type = 'task'
      AND sales_id = user_record.id
      AND due_date = today_date
      AND completed = false
      AND deleted_at IS NULL;

    -- Count overdue tasks (from activities table)
    SELECT COUNT(*) INTO tasks_overdue
    FROM activities
    WHERE activity_type = 'task'
      AND sales_id = user_record.id
      AND due_date < today_date
      AND completed = false
      AND deleted_at IS NULL;

    SELECT COUNT(*) INTO opportunities_updated
    FROM opportunities
    WHERE opportunity_owner_id = user_record.id
      AND updated_at >= yesterday_date
      AND updated_at < today_date;

    SELECT COUNT(*) INTO activities_yesterday
    FROM activities
    WHERE created_by = user_record.id
      AND activity_date >= yesterday_date
      AND activity_date < today_date;

    IF tasks_due_today > 0 OR tasks_overdue > 0 OR opportunities_updated > 0 THEN
      message_parts := ARRAY[]::TEXT[];

      IF tasks_due_today > 0 THEN
        message_parts := array_append(message_parts,
          tasks_due_today || ' task' || CASE WHEN tasks_due_today = 1 THEN '' ELSE 's' END || ' due today');
      END IF;

      IF tasks_overdue > 0 THEN
        message_parts := array_append(message_parts,
          tasks_overdue || ' overdue task' || CASE WHEN tasks_overdue = 1 THEN '' ELSE 's' END);
      END IF;

      IF opportunities_updated > 0 THEN
        message_parts := array_append(message_parts,
          opportunities_updated || ' opportunity update' || CASE WHEN opportunities_updated = 1 THEN '' ELSE 's' END);
      END IF;

      digest_message := 'Daily Digest: ' || array_to_string(message_parts, ', ');

      INSERT INTO notifications (user_id, type, message, entity_type, metadata)
      VALUES (
        user_record.user_id,
        'daily_digest',
        digest_message,
        'digest',
        jsonb_build_object(
          'tasksDueToday', tasks_due_today,
          'tasksOverdue', tasks_overdue,
          'opportunitiesUpdated', opportunities_updated,
          'activitiesYesterday', activities_yesterday,
          'digestDate', today_date
        )
      );

      notification_count := notification_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Generated % digests, created % notifications', digest_count, notification_count;

  RETURN json_build_object(
    'success', true,
    'digestsGenerated', digest_count,
    'notificationsCreated', notification_count,
    'executedAt', NOW()
  );
END;
$$;


ALTER FUNCTION "public"."generate_daily_digest"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_daily_digest"() IS 'Generates daily digest notifications for each sales user. Designed to be called daily by pg_cron at 7 AM UTC.';



CREATE OR REPLACE FUNCTION "public"."generate_daily_digest_v2"() RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  user_record RECORD;
  digest user_digest_summary;
  digest_count INT := 0;
  notification_count INT := 0;
  message_parts TEXT[];
  digest_message TEXT;
BEGIN
  RAISE NOTICE 'Starting daily digest v2 generation at %', NOW();

  FOR user_record IN
    SELECT id FROM sales
    WHERE disabled = false
      AND user_id IS NOT NULL
      AND digest_opt_in = true
  LOOP
    digest := get_user_digest_summary(user_record.id);

    IF digest IS NULL THEN
      CONTINUE;
    END IF;

    digest_count := digest_count + 1;

    IF digest.tasks_due_today > 0 OR digest.tasks_overdue > 0 OR digest.stale_deals > 0 THEN
      message_parts := ARRAY[]::TEXT[];

      IF digest.tasks_due_today > 0 THEN
        message_parts := array_append(message_parts,
          digest.tasks_due_today || ' task' || CASE WHEN digest.tasks_due_today = 1 THEN '' ELSE 's' END || ' due today');
      END IF;

      IF digest.tasks_overdue > 0 THEN
        message_parts := array_append(message_parts,
          digest.tasks_overdue || ' overdue task' || CASE WHEN digest.tasks_overdue = 1 THEN '' ELSE 's' END);
      END IF;

      IF digest.stale_deals > 0 THEN
        message_parts := array_append(message_parts,
          digest.stale_deals || ' stale deal' || CASE WHEN digest.stale_deals = 1 THEN '' ELSE 's' END || ' needing attention');
      END IF;

      digest_message := 'Daily Digest: ' || array_to_string(message_parts, ', ');

      INSERT INTO notifications (user_id, type, message, entity_type, metadata)
      VALUES (
        digest.user_id,
        'daily_digest',
        digest_message,
        'digest',
        jsonb_build_object(
          'tasksDueToday', digest.tasks_due_today,
          'tasksOverdue', digest.tasks_overdue,
          'staleDeals', digest.stale_deals,
          'opportunitiesUpdated', digest.opportunities_updated_24h,
          'activitiesLogged', digest.activities_logged_24h,
          'overdueTasks', digest.overdue_tasks,
          'staleDealsList', digest.stale_deals_list,
          'tasksDueTodayList', digest.tasks_due_today_list,
          'digestDate', CURRENT_DATE,
          'version', 'v2.1'
        )
      );

      notification_count := notification_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Generated % digests, created % notifications', digest_count, notification_count;

  RETURN json_build_object(
    'success', true,
    'digestsGenerated', digest_count,
    'notificationsCreated', notification_count,
    'executedAt', NOW(),
    'version', 'v2.1'
  );
END;
$$;


ALTER FUNCTION "public"."generate_daily_digest_v2"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_daily_digest_v2"() IS 'Enhanced daily digest generator v2.1. Includes tasks_due_today_list in metadata for email generation. Respects digest_opt_in user preference. Uses per-stage stale thresholds from PRD Section 6.3.';



CREATE OR REPLACE FUNCTION "public"."generate_digest_opt_out_token"("p_sales_id" bigint) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  token_data TEXT;
  signature TEXT;
  expires_at BIGINT;
BEGIN
  expires_at := EXTRACT(EPOCH FROM (NOW() + INTERVAL '30 days'))::BIGINT;
  token_data := p_sales_id || ':' || expires_at;
  signature := encode(
    hmac(token_data::bytea,
         COALESCE(current_setting('app.jwt_secret', true), 'digest-opt-out-secret-key')::bytea,
         'sha256'),
    'hex'
  );
  RETURN encode(convert_to(token_data || ':' || signature, 'UTF8'), 'base64');
END;
$$;


ALTER FUNCTION "public"."generate_digest_opt_out_token"("p_sales_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."generate_digest_opt_out_token"("p_sales_id" bigint) IS 'Generates a secure, time-limited token for one-click digest unsubscribe links. Token expires after 30 days.';



CREATE OR REPLACE FUNCTION "public"."get_activity_log"("p_organization_id" bigint DEFAULT NULL::bigint, "p_sales_id" bigint DEFAULT NULL::bigint, "p_limit" integer DEFAULT 250) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN (
    WITH activity_events AS (
      SELECT
        CONCAT('organization.', o.id, '.created') AS id,
        'Organization created' AS type,
        o.id AS organization_id,
        NULL::BIGINT AS contact_id,
        NULL::BIGINT AS opportunity_id,
        NULL::BIGINT AS contact_note_id,
        NULL::BIGINT AS opportunity_note_id,
        o.sales_id,
        o.created_at AS date,
        jsonb_build_object(
          'id', o.id,
          'name', o.name,
          'created_at', o.created_at,
          'sales_id', o.sales_id
        ) AS organization,
        NULL::JSONB AS contact,
        NULL::JSONB AS opportunity,
        NULL::JSONB AS contact_note,
        NULL::JSONB AS opportunity_note
      FROM organizations o
      WHERE o.deleted_at IS NULL
        AND (p_organization_id IS NULL OR o.id = p_organization_id)
        AND (p_sales_id IS NULL OR o.sales_id = p_sales_id)

      UNION ALL

      SELECT
        CONCAT('contact.', c.id, '.created') AS id,
        'Contact created' AS type,
        c.organization_id,
        c.id AS contact_id,
        NULL::BIGINT AS opportunity_id,
        NULL::BIGINT AS contact_note_id,
        NULL::BIGINT AS opportunity_note_id,
        c.sales_id,
        c.first_seen AS date,
        NULL::JSONB AS organization,
        jsonb_build_object(
          'id', c.id,
          'first_name', c.first_name,
          'last_name', c.last_name,
          'organization_id', c.organization_id,
          'first_seen', c.first_seen,
          'sales_id', c.sales_id
        ) AS contact,
        NULL::JSONB AS opportunity,
        NULL::JSONB AS contact_note,
        NULL::JSONB AS opportunity_note
      FROM contacts c
      WHERE (
          p_organization_id IS NULL OR
          c.organization_id = p_organization_id
        )
        AND (p_sales_id IS NULL OR c.sales_id = p_sales_id)

      UNION ALL

      SELECT
        CONCAT('contactNote.', cn.id, '.created') AS id,
        'Contact note created' AS type,
        c.organization_id,
        cn.contact_id,
        NULL::BIGINT AS opportunity_id,
        cn.id AS contact_note_id,
        NULL::BIGINT AS opportunity_note_id,
        cn.sales_id,
        cn.date,
        NULL::JSONB AS organization,
        NULL::JSONB AS contact,
        NULL::JSONB AS opportunity,
        jsonb_build_object(
          'id', cn.id,
          'contact_id', cn.contact_id,
          'text', cn.text,
          'date', cn.date,
          'sales_id', cn.sales_id
        ) AS contact_note,
        NULL::JSONB AS opportunity_note
      FROM "contactNotes" cn
      LEFT JOIN contacts c ON c.id = cn.contact_id
      WHERE (
          p_organization_id IS NULL OR
          c.organization_id = p_organization_id
        )
        AND (p_sales_id IS NULL OR cn.sales_id = p_sales_id)

      UNION ALL

      SELECT
        CONCAT('opportunity.', opp.id, '.created') AS id,
        'Opportunity created' AS type,
        opp.customer_organization_id AS organization_id,
        NULL::BIGINT AS contact_id,
        opp.id AS opportunity_id,
        NULL::BIGINT AS contact_note_id,
        NULL::BIGINT AS opportunity_note_id,
        opp.opportunity_owner_id AS sales_id,
        opp.created_at AS date,
        NULL::JSONB AS organization,
        NULL::JSONB AS contact,
        jsonb_build_object(
          'id', opp.id,
          'name', opp.name,
          'customer_organization_id', opp.customer_organization_id,
          'principal_organization_id', opp.principal_organization_id,
          'distributor_organization_id', opp.distributor_organization_id,
          'created_at', opp.created_at,
          'sales_id', opp.opportunity_owner_id
        ) AS opportunity,
        NULL::JSONB AS contact_note,
        NULL::JSONB AS opportunity_note
      FROM opportunities opp
      WHERE (
          p_organization_id IS NULL OR
          opp.customer_organization_id = p_organization_id OR
          opp.principal_organization_id = p_organization_id OR
          opp.distributor_organization_id = p_organization_id
        )
        AND (p_sales_id IS NULL OR opp.opportunity_owner_id = p_sales_id)

      UNION ALL

      SELECT
        CONCAT('opportunityNote.', opn.id, '.created') AS id,
        'Opportunity note created' AS type,
        opp.customer_organization_id AS organization_id,
        NULL::BIGINT AS contact_id,
        opn.opportunity_id,
        NULL::BIGINT AS contact_note_id,
        opn.id AS opportunity_note_id,
        opn.sales_id,
        opn.date,
        NULL::JSONB AS organization,
        NULL::JSONB AS contact,
        NULL::JSONB AS opportunity,
        NULL::JSONB AS contact_note,
        jsonb_build_object(
          'id', opn.id,
          'opportunity_id', opn.opportunity_id,
          'text', opn.text,
          'date', opn.date,
          'sales_id', opn.sales_id
        ) AS opportunity_note
      FROM "opportunityNotes" opn
      LEFT JOIN opportunities opp ON opp.id = opn.opportunity_id
      WHERE (
          p_organization_id IS NULL OR
          opp.customer_organization_id = p_organization_id OR
          opp.principal_organization_id = p_organization_id OR
          opp.distributor_organization_id = p_organization_id
        )
        AND (p_sales_id IS NULL OR opn.sales_id = p_sales_id)
    )
    SELECT json_agg(
      json_build_object(
        'id', id,
        'type', type,
        'organization_id', organization_id,
        'sales_id', sales_id,
        'date', date,
        'organization', organization,
        'contact', contact,
        'opportunity', opportunity,
        'contactNote', contact_note,
        'opportunityNote', opportunity_note
      )
      ORDER BY date DESC
    )
    FROM (
      SELECT *
      FROM activity_events
      ORDER BY date DESC NULLS LAST
      LIMIT p_limit
    ) sorted_events
  );
END;
$$;


ALTER FUNCTION "public"."get_activity_log"("p_organization_id" bigint, "p_sales_id" bigint, "p_limit" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_activity_log"("p_organization_id" bigint, "p_sales_id" bigint, "p_limit" integer) IS '@deprecated Use entity_timeline view instead.

This RPC is deprecated and will be removed in a future release.
Replacement: Query entity_timeline view via timelineHandler.ts

Migration guide:
- Old: dataProvider.getActivityLog({ organizationId: 123 })
- New: useGetList("entity_timeline", { filter: { organization_id: 123 } })

Deprecation timeline:
- Phase A: This deprecation notice (current)
- Phase B: Console warnings in development
- Phase C: Function removal

Original description:
Returns activity entries for a contact or organization with formatted data.
Supports pagination and ordering.';



CREATE OR REPLACE FUNCTION "public"."get_current_sales_id"() RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT id FROM public.sales WHERE user_id = auth.uid() LIMIT 1
$$;


ALTER FUNCTION "public"."get_current_sales_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_current_sales_id"() IS 'Returns the sales ID for current user (original helper). SECURITY: SECURITY DEFINER with empty search_path to prevent hijacking.';



CREATE OR REPLACE FUNCTION "public"."get_current_user_company_id"() RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  -- NOTE: Currently returns NULL - no company isolation implemented
  -- To enable company isolation:
  -- 1. Add sales.company_id column
  -- 2. Backfill with actual company assignments
  -- 3. Replace this query:
  --    SELECT company_id FROM public.sales WHERE user_id = auth.uid() LIMIT 1;
  SELECT NULL::BIGINT;
$$;


ALTER FUNCTION "public"."get_current_user_company_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_current_user_company_id"() IS 'Placeholder for future multi-tenant expansion.
Currently returns NULL - no company isolation implemented.
To enable multi-tenant:
1. Add sales.company_id column
2. Update this function to return actual company_id
3. Replace USING (true) policies with company_id checks
See /docs/SECURITY_MODEL.md for expansion path.';



CREATE OR REPLACE FUNCTION "public"."get_current_user_sales_id"() RETURNS bigint
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT id FROM public.sales WHERE user_id = auth.uid() LIMIT 1
$$;


ALTER FUNCTION "public"."get_current_user_sales_id"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_current_user_sales_id"() IS 'Returns the sales ID for current user. SECURITY: SECURITY DEFINER with empty search_path to prevent hijacking.';



CREATE OR REPLACE FUNCTION "public"."get_digest_preference"() RETURNS json
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  current_user_id UUID;
  opt_in_value BOOLEAN;
  user_email TEXT;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT digest_opt_in, email
  INTO opt_in_value, user_email
  FROM sales
  WHERE user_id = current_user_id;

  IF user_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  RETURN json_build_object(
    'success', true,
    'digest_opt_in', opt_in_value,
    'email', user_email
  );
END;
$$;


ALTER FUNCTION "public"."get_digest_preference"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_digest_preference"() IS 'Returns current user digest preference for Settings page display.';



CREATE OR REPLACE FUNCTION "public"."get_duplicate_details"("p_contact_ids" bigint[]) RETURNS TABLE("id" bigint, "first_name" "text", "last_name" "text", "email" "jsonb", "phone" "jsonb", "organization_id" bigint, "organization_name" "text", "created_at" timestamp with time zone, "interaction_count" bigint, "task_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.organization_id,
    o.name as organization_name,
    c.created_at,
    (SELECT COUNT(*) FROM "contactNotes" cn WHERE cn.contact_id = c.id) as interaction_count,
    COALESCE(
      (SELECT COUNT(*) FROM activities a
       WHERE a.contact_id = c.id
         AND a.activity_type = 'task'
         AND a.deleted_at IS NULL),
      0
    ) as task_count
  FROM contacts c
  LEFT JOIN organizations o ON o.id = c.organization_id
  WHERE c.id = ANY(p_contact_ids)
  ORDER BY c.created_at ASC;
END;
$$;


ALTER FUNCTION "public"."get_duplicate_details"("p_contact_ids" bigint[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_duplicate_details"("p_contact_ids" bigint[]) IS 'Returns detailed information about contacts in a duplicate group for review';



CREATE OR REPLACE FUNCTION "public"."get_organization_contacts"("p_organization_id" bigint) RETURNS TABLE("contact_id" bigint, "contact_name" "text", "role" "public"."contact_role", "is_primary_decision_maker" boolean, "purchase_influence" smallint)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        co.contact_id,
        c.name AS contact_name,
        co.role,
        co.is_primary_decision_maker,
        co.purchase_influence
    FROM contact_organizations co
    JOIN contacts c ON c.id = co.contact_id
    WHERE co.organization_id = p_organization_id
    AND co.deleted_at IS NULL
    ORDER BY co.is_primary_decision_maker DESC, co.purchase_influence DESC NULLS LAST;
END;
$$;


ALTER FUNCTION "public"."get_organization_contacts"("p_organization_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_organization_descendants"("org_id" bigint) RETURNS bigint[]
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
  SELECT COALESCE(
    ARRAY_AGG(id),
    ARRAY[]::BIGINT[]
  )
  FROM (
    WITH RECURSIVE descendants AS (
      -- Base case: direct children of the given organization
      SELECT id, parent_organization_id
      FROM organizations
      WHERE parent_organization_id = org_id
        AND deleted_at IS NULL

      UNION ALL

      -- Recursive case: children of descendants
      SELECT o.id, o.parent_organization_id
      FROM organizations o
      JOIN descendants d ON o.parent_organization_id = d.id
      WHERE o.deleted_at IS NULL
    )
    SELECT id FROM descendants
  ) AS all_descendants;
$$;


ALTER FUNCTION "public"."get_organization_descendants"("org_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_organization_descendants"("org_id" bigint) IS 'Returns array of all descendant organization IDs for hierarchy cycle prevention in UI';



CREATE OR REPLACE FUNCTION "public"."get_overdue_tasks_for_user"("p_sales_id" bigint) RETURNS SETOF "public"."overdue_task_record"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    a.id,
    a.subject AS title,
    a.description,
    a.due_date,
    (CURRENT_DATE - a.due_date)::INT AS days_overdue,
    a.priority::TEXT,
    a.type::TEXT,
    a.contact_id,
    c.name AS contact_name,
    a.opportunity_id,
    o.name AS opportunity_name,
    a.organization_id,
    org.name AS organization_name
  FROM activities a
  LEFT JOIN contacts c ON a.contact_id = c.id AND c.deleted_at IS NULL
  LEFT JOIN opportunities o ON a.opportunity_id = o.id AND o.deleted_at IS NULL
  LEFT JOIN organizations org ON a.organization_id = org.id AND org.deleted_at IS NULL
  WHERE a.activity_type = 'task'
    AND a.sales_id = p_sales_id
    AND a.completed = false
    AND a.deleted_at IS NULL
    AND a.due_date < CURRENT_DATE
  ORDER BY days_overdue DESC, a.priority DESC NULLS LAST;
$$;


ALTER FUNCTION "public"."get_overdue_tasks_for_user"("p_sales_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_overdue_tasks_for_user"("p_sales_id" bigint) IS 'Returns overdue tasks for a specific sales user. Tasks are considered overdue when due_date < today and not completed. Results include related contact, opportunity, and organization info.';



CREATE OR REPLACE FUNCTION "public"."get_playbook_category_ids"() RETURNS TABLE("playbook_category_id" "uuid", "count" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT playbook_category_id, COUNT(*) as count
  FROM organizations  
  WHERE playbook_category_id IS NOT NULL
  GROUP BY playbook_category_id
  ORDER BY playbook_category_id;
$$;


ALTER FUNCTION "public"."get_playbook_category_ids"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_product_distributor_pricing"("p_product_id" bigint, "p_distributor_id" bigint) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_pricing JSONB;
BEGIN
    SELECT special_pricing
    INTO v_pricing
    FROM product_distributor_authorizations
    WHERE product_id = p_product_id
      AND distributor_id = p_distributor_id
      AND is_authorized = true
      AND deleted_at IS NULL
      AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE);

    RETURN v_pricing;
END;
$$;


ALTER FUNCTION "public"."get_product_distributor_pricing"("p_product_id" bigint, "p_distributor_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_sale_by_id"("target_sale_id" integer) RETURNS "public"."sales"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  current_user_id UUID;
  current_user_role user_role;
  target_record sales;
BEGIN
  -- Get current user from Supabase JWT claims
  current_user_id := auth.uid();

  -- If no authenticated user, deny access
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'P0001';
  END IF;

  -- Look up the target record first
  SELECT * INTO target_record
  FROM sales
  WHERE id = target_sale_id AND deleted_at IS NULL;

  -- If target doesn't exist, return NULL (not an error)
  IF target_record IS NULL THEN
    RETURN NULL;
  END IF;

  -- Look up caller's role
  SELECT role INTO current_user_role
  FROM sales
  WHERE user_id = current_user_id AND deleted_at IS NULL;

  -- AUTHORIZATION CHECK: Must be admin OR looking up own record
  IF current_user_role != 'admin' AND target_record.user_id != current_user_id THEN
    RAISE EXCEPTION 'You can only view your own profile'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN target_record;
END;
$$;


ALTER FUNCTION "public"."get_sale_by_id"("target_sale_id" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_sale_by_id"("target_sale_id" integer) IS 'SECURITY DEFINER with authorization: Admins can look up any user, non-admins can only look up their own record. Defense-in-depth against IDOR.';



CREATE OR REPLACE FUNCTION "public"."get_sale_by_user_id"("target_user_id" "uuid") RETURNS "public"."sales"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  current_user_id UUID;
  result_record sales;
BEGIN
  current_user_id := auth.uid();

  -- Must be authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = 'P0001';
  END IF;

  -- Can only look up own record (self-access only)
  IF target_user_id != current_user_id THEN
    RAISE EXCEPTION 'Access denied' USING ERRCODE = 'P0003'; -- maps to 403
  END IF;

  SELECT * INTO result_record
  FROM sales
  WHERE user_id = target_user_id AND deleted_at IS NULL
  LIMIT 1;

  RETURN result_record;
END;
$$;


ALTER FUNCTION "public"."get_sale_by_user_id"("target_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_sale_by_user_id"("target_user_id" "uuid") IS 'SECURITY DEFINER with self-access enforcement: Users can only fetch their own profile. Prevents user enumeration attacks.';



CREATE OR REPLACE FUNCTION "public"."get_stale_deals_for_user"("p_sales_id" bigint) RETURNS SETOF "public"."stale_deal_record"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  WITH stage_thresholds AS (
    SELECT unnest(ARRAY['new_lead', 'initial_outreach', 'sample_visit_offered', 'feedback_logged', 'demo_scheduled']) AS stage,
           unnest(ARRAY[7, 14, 14, 21, 14]) AS threshold_days
  ),
  opportunity_activity AS (
    SELECT
      o.id AS opportunity_id,
      o.name,
      o.stage::TEXT,
      o.priority::TEXT,
      o.estimated_close_date,
      o.customer_organization_id,
      o.principal_organization_id,
      o.created_at,
      COALESCE(
        MAX(a.activity_date),
        o.created_at
      ) AS last_activity_date
    FROM opportunities o
    LEFT JOIN activities a ON o.id = a.opportunity_id AND a.deleted_at IS NULL
    WHERE o.opportunity_owner_id = p_sales_id
      AND o.deleted_at IS NULL
      AND o.stage NOT IN ('closed_won', 'closed_lost')
    GROUP BY o.id, o.name, o.stage, o.priority, o.estimated_close_date,
             o.customer_organization_id, o.principal_organization_id, o.created_at
  )
  SELECT
    oa.opportunity_id AS id,
    oa.name,
    oa.stage,
    st.threshold_days AS stage_threshold_days,
    EXTRACT(DAY FROM (NOW() - oa.last_activity_date))::INT AS days_since_activity,
    (EXTRACT(DAY FROM (NOW() - oa.last_activity_date))::INT - st.threshold_days) AS days_over_threshold,
    oa.last_activity_date,
    cust.name AS customer_name,
    prin.name AS principal_name,
    oa.priority,
    oa.estimated_close_date
  FROM opportunity_activity oa
  JOIN stage_thresholds st ON oa.stage = st.stage
  LEFT JOIN organizations cust ON oa.customer_organization_id = cust.id
  LEFT JOIN organizations prin ON oa.principal_organization_id = prin.id
  WHERE EXTRACT(DAY FROM (NOW() - oa.last_activity_date))::INT > st.threshold_days
  ORDER BY days_over_threshold DESC, oa.priority DESC NULLS LAST;
$$;


ALTER FUNCTION "public"."get_stale_deals_for_user"("p_sales_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_stale_deals_for_user"("p_sales_id" bigint) IS 'Returns stale deals for a specific sales user using per-stage thresholds from PRD Section 6.3. Staleness is calculated from the most recent activity_date in the activities table. Deals in closed stages are excluded.';



CREATE OR REPLACE FUNCTION "public"."get_stale_opportunities"("p_campaign" "text", "p_start_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_end_date" timestamp with time zone DEFAULT NULL::timestamp with time zone, "p_sales_rep_id" bigint DEFAULT NULL::bigint) RETURNS SETOF "public"."stale_opportunity_record"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  WITH stage_thresholds AS (
    SELECT unnest(ARRAY['new_lead', 'initial_outreach', 'sample_visit_offered', 'feedback_logged', 'demo_scheduled']) AS stage,
           unnest(ARRAY[7, 14, 14, 21, 14]) AS threshold_days
  ),
  opportunity_activity AS (
    SELECT
      o.id AS opportunity_id,
      o.name,
      o.stage::TEXT,
      o.customer_organization_id,
      o.created_at,
      COALESCE(
        MAX(a.activity_date),
        o.created_at
      ) AS last_activity_date
    FROM opportunities o
    LEFT JOIN activities a ON o.id = a.opportunity_id
      AND a.deleted_at IS NULL
      AND (p_start_date IS NULL OR a.activity_date >= p_start_date)
      AND (p_end_date IS NULL OR a.activity_date <= p_end_date)
      AND (p_sales_rep_id IS NULL OR a.created_by = p_sales_rep_id)
    WHERE o.campaign = p_campaign
      AND o.deleted_at IS NULL
      AND o.stage NOT IN ('closed_won', 'closed_lost')
      AND (p_sales_rep_id IS NULL OR o.opportunity_owner_id = p_sales_rep_id)
    GROUP BY o.id, o.name, o.stage, o.customer_organization_id, o.created_at
  )
  SELECT
    oa.opportunity_id AS id,
    oa.name,
    oa.stage,
    cust.name AS customer_organization_name,
    oa.last_activity_date,
    EXTRACT(DAY FROM (NOW() - oa.last_activity_date))::INT AS days_inactive,
    st.threshold_days AS stage_threshold,
    (EXTRACT(DAY FROM (NOW() - oa.last_activity_date))::INT > st.threshold_days) AS is_stale
  FROM opportunity_activity oa
  JOIN stage_thresholds st ON oa.stage = st.stage
  LEFT JOIN organizations cust ON oa.customer_organization_id = cust.id
  WHERE EXTRACT(DAY FROM (NOW() - oa.last_activity_date))::INT > st.threshold_days
  ORDER BY days_inactive DESC;
$$;


ALTER FUNCTION "public"."get_stale_opportunities"("p_campaign" "text", "p_start_date" timestamp with time zone, "p_end_date" timestamp with time zone, "p_sales_rep_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_tasks_due_today_for_user"("p_sales_id" bigint) RETURNS SETOF "public"."today_task_record"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    a.id,
    a.subject AS title,
    a.description,
    a.priority::TEXT,
    a.type::TEXT,
    a.contact_id,
    c.name AS contact_name,
    a.opportunity_id,
    o.name AS opportunity_name,
    a.organization_id,
    org.name AS organization_name
  FROM activities a
  LEFT JOIN contacts c ON a.contact_id = c.id AND c.deleted_at IS NULL
  LEFT JOIN opportunities o ON a.opportunity_id = o.id AND o.deleted_at IS NULL
  LEFT JOIN organizations org ON a.organization_id = org.id AND org.deleted_at IS NULL
  WHERE a.activity_type = 'task'
    AND a.sales_id = p_sales_id
    AND a.completed = false
    AND a.deleted_at IS NULL
    AND a.due_date = CURRENT_DATE
  ORDER BY
    CASE a.priority
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
      ELSE 5
    END,
    a.created_at ASC;
$$;


ALTER FUNCTION "public"."get_tasks_due_today_for_user"("p_sales_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_tasks_due_today_for_user"("p_sales_id" bigint) IS 'Returns tasks due today for a specific sales user. Tasks are considered due today when due_date = CURRENT_DATE and not completed. Results include related contact, opportunity, and organization info. Ordered by priority (critical first) then creation time.';



CREATE OR REPLACE FUNCTION "public"."get_user_digest_summary"("p_sales_id" bigint) RETURNS "public"."user_digest_summary"
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  result user_digest_summary;
  today_date DATE := CURRENT_DATE;
  yesterday_start TIMESTAMPTZ := (CURRENT_DATE - INTERVAL '1 day')::TIMESTAMPTZ;
  today_start TIMESTAMPTZ := CURRENT_DATE::TIMESTAMPTZ;
BEGIN
  SELECT s.id, s.user_id, s.first_name, s.last_name, s.email
  INTO result.sales_id, result.user_id, result.first_name, result.last_name, result.email
  FROM sales s
  WHERE s.id = p_sales_id AND s.disabled = false;

  IF result.sales_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Count tasks due today (from activities table)
  SELECT COUNT(*)::INT INTO result.tasks_due_today
  FROM activities
  WHERE activity_type = 'task'
    AND sales_id = p_sales_id
    AND due_date = today_date
    AND completed = false
    AND deleted_at IS NULL;

  -- Count overdue tasks (from activities table)
  SELECT COUNT(*)::INT INTO result.tasks_overdue
  FROM activities
  WHERE activity_type = 'task'
    AND sales_id = p_sales_id
    AND due_date < today_date
    AND completed = false
    AND deleted_at IS NULL;

  SELECT COUNT(*)::INT INTO result.stale_deals
  FROM get_stale_deals_for_user(p_sales_id);

  SELECT COUNT(*)::INT INTO result.opportunities_updated_24h
  FROM opportunities
  WHERE opportunity_owner_id = p_sales_id
    AND updated_at >= yesterday_start
    AND updated_at < today_start
    AND deleted_at IS NULL;

  SELECT COUNT(*)::INT INTO result.activities_logged_24h
  FROM activities
  WHERE created_by = p_sales_id
    AND activity_date >= yesterday_start
    AND activity_date < today_start
    AND deleted_at IS NULL;

  SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json) INTO result.overdue_tasks
  FROM (
    SELECT * FROM get_overdue_tasks_for_user(p_sales_id) LIMIT 10
  ) t;

  SELECT COALESCE(json_agg(row_to_json(d)), '[]'::json) INTO result.stale_deals_list
  FROM (
    SELECT * FROM get_stale_deals_for_user(p_sales_id) LIMIT 10
  ) d;

  SELECT COALESCE(json_agg(row_to_json(td)), '[]'::json) INTO result.tasks_due_today_list
  FROM (
    SELECT * FROM get_tasks_due_today_for_user(p_sales_id) LIMIT 10
  ) td;

  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_user_digest_summary"("p_sales_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_digest_summary"("p_sales_id" bigint) IS 'Returns complete digest summary for a sales user including task counts, stale deal counts, and detail lists (overdue tasks, stale deals, and tasks due today). Designed for daily digest notification and email generation.';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  -- Use UPSERT to handle both INSERT and UPDATE paths
  INSERT INTO public.sales (
    user_id,
    email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'rep'),
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_user"() IS 'Trigger function that creates sales record when auth.users record is created. Assigns default role of "rep".';



CREATE OR REPLACE FUNCTION "public"."handle_update_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    UPDATE public.sales
    SET email = NEW.email,
        updated_at = NOW()
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_update_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_opportunity_version"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  -- Always increment version on update (RPC function also increments)
  -- Using GREATEST ensures we don't go backwards if RPC already set it
  NEW.version := GREATEST(OLD.version + 1, NEW.version);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."increment_opportunity_version"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."increment_opportunity_version"() IS 'Auto-increments version column on opportunity updates for optimistic locking. Ensures version always increases even for direct SQL updates.';



CREATE OR REPLACE FUNCTION "public"."invoke_daily_digest_function"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_project_url TEXT;
  v_service_key TEXT;
  v_function_url TEXT;
  v_request_id BIGINT;
BEGIN
  -- Retrieve secrets from Vault
  SELECT decrypted_secret INTO v_project_url
  FROM vault.decrypted_secrets
  WHERE name = 'project_url';

  SELECT decrypted_secret INTO v_service_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key';

  -- Validate secrets exist
  IF v_project_url IS NULL THEN
    RAISE WARNING 'daily-digest: project_url not found in Vault, skipping';
    RETURN;
  END IF;

  IF v_service_key IS NULL THEN
    RAISE WARNING 'daily-digest: service_role_key not found in Vault, skipping';
    RETURN;
  END IF;

  -- Build Edge Function URL
  v_function_url := v_project_url || '/functions/v1/daily-digest';

  -- Invoke Edge Function asynchronously via pg_net
  -- The function processes each user independently (fail-fast pattern)
  SELECT net.http_post(
    url := v_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000  -- 5 minute timeout
  ) INTO v_request_id;

  RAISE NOTICE 'daily-digest: Invoked Edge Function, request_id=%', v_request_id;
END;
$$;


ALTER FUNCTION "public"."invoke_daily_digest_function"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."invoke_daily_digest_function"() IS 'Invokes the daily-digest Edge Function via pg_net HTTP POST.
Uses Vault secrets for secure authentication.
Called by pg_cron at 7 AM UTC daily.';



CREATE OR REPLACE FUNCTION "public"."invoke_snapshot_capture_function"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  v_project_url TEXT;
  v_service_key TEXT;
  v_function_url TEXT;
  v_request_id BIGINT;
BEGIN
  -- Retrieve secrets from Vault
  SELECT decrypted_secret INTO v_project_url
  FROM vault.decrypted_secrets
  WHERE name = 'project_url';

  SELECT decrypted_secret INTO v_service_key
  FROM vault.decrypted_secrets
  WHERE name = 'service_role_key';

  -- Validate secrets exist
  IF v_project_url IS NULL THEN
    RAISE WARNING 'snapshot-capture: project_url not found in Vault, skipping';
    RETURN;
  END IF;

  IF v_service_key IS NULL THEN
    RAISE WARNING 'snapshot-capture: service_role_key not found in Vault, skipping';
    RETURN;
  END IF;

  -- Build Edge Function URL
  v_function_url := v_project_url || '/functions/v1/capture-dashboard-snapshots';

  -- Invoke Edge Function asynchronously via pg_net
  -- The function processes each user independently (fail-fast pattern)
  SELECT net.http_post(
    url := v_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 300000  -- 5 minute timeout
  ) INTO v_request_id;

  RAISE NOTICE 'snapshot-capture: Invoked Edge Function, request_id=%', v_request_id;
END;
$$;


ALTER FUNCTION "public"."invoke_snapshot_capture_function"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."invoke_snapshot_capture_function"() IS 'Invokes the capture-dashboard-snapshots Edge Function via pg_net HTTP POST.
Uses Vault secrets for secure authentication.
Called by pg_cron at 23:00 UTC daily (end of day).
Creates historical snapshots for week-over-week trend accuracy (PERF-02/FUNC-01).';



CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN TRUE  -- Grant admin when auth.uid() is NULL
      ELSE COALESCE(
        (SELECT role = 'admin' FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        FALSE
      )
    END
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_admin"() IS 'Returns TRUE if the current user is an admin. Returns TRUE when auth.uid() is NULL (service role/local dev).';



CREATE OR REPLACE FUNCTION "public"."is_manager"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN FALSE
      ELSE COALESCE(
        (SELECT role = 'manager' FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        FALSE
      )
    END
$$;


ALTER FUNCTION "public"."is_manager"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_manager"() IS 'Returns true if current user has manager role. SECURITY: SECURITY DEFINER with empty search_path to prevent hijacking.';



CREATE OR REPLACE FUNCTION "public"."is_manager_or_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN FALSE
      ELSE COALESCE(
        (SELECT role IN ('admin', 'manager') FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        FALSE
      )
    END
$$;


ALTER FUNCTION "public"."is_manager_or_admin"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_manager_or_admin"() IS 'Returns true if current user has manager or admin role. SECURITY: SECURITY DEFINER with empty search_path to prevent hijacking.';



CREATE OR REPLACE FUNCTION "public"."is_owner_or_privileged"("owner_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Fail-fast: No owner_id means no ownership
  IF owner_id IS NULL THEN
    RETURN is_manager_or_admin(); -- Only privileged users can touch orphan records
  END IF;

  -- Check: Is current user the owner OR a privileged user?
  RETURN (owner_id = current_sales_id()) OR is_manager_or_admin();
END;
$$;


ALTER FUNCTION "public"."is_owner_or_privileged"("owner_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_owner_or_privileged"("owner_id" bigint) IS 'Returns TRUE if owner_id matches current user OR user is manager/admin.';



CREATE OR REPLACE FUNCTION "public"."is_product_authorized_for_distributor"("p_product_id" bigint, "p_distributor_id" bigint) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_product_auth RECORD;
    v_org_auth RECORD;
    v_principal_id BIGINT;
BEGIN
    SELECT principal_id INTO v_principal_id
    FROM products
    WHERE id = p_product_id AND deleted_at IS NULL;

    IF v_principal_id IS NULL THEN
        RETURN false;
    END IF;

    SELECT is_authorized, expiration_date
    INTO v_product_auth
    FROM product_distributor_authorizations
    WHERE product_id = p_product_id
      AND distributor_id = p_distributor_id
      AND deleted_at IS NULL;

    IF FOUND THEN
        IF v_product_auth.expiration_date IS NOT NULL
           AND v_product_auth.expiration_date < CURRENT_DATE THEN
            NULL;
        ELSE
            RETURN v_product_auth.is_authorized;
        END IF;
    END IF;

    SELECT is_authorized, expiration_date
    INTO v_org_auth
    FROM distributor_principal_authorizations
    WHERE principal_id = v_principal_id
      AND distributor_id = p_distributor_id
      AND deleted_at IS NULL;

    IF FOUND THEN
        IF v_org_auth.expiration_date IS NOT NULL
           AND v_org_auth.expiration_date < CURRENT_DATE THEN
            RETURN false;
        END IF;
        RETURN v_org_auth.is_authorized;
    END IF;

    RETURN false;
END;
$$;


ALTER FUNCTION "public"."is_product_authorized_for_distributor"("p_product_id" bigint, "p_distributor_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_rep"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN FALSE
      ELSE COALESCE(
        (SELECT role = 'rep' FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        FALSE
      )
    END
$$;


ALTER FUNCTION "public"."is_rep"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."is_rep"() IS 'Returns true if current user has rep role. SECURITY: SECURITY DEFINER with empty search_path to prevent hijacking.';



CREATE OR REPLACE FUNCTION "public"."log_activity_with_task"("p_activity" "jsonb", "p_task" "jsonb" DEFAULT NULL::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_activity_id BIGINT;
  v_task_id BIGINT;
  v_current_sales_id BIGINT;
BEGIN
  -- Get current user's sales ID for created_by attribution
  v_current_sales_id := get_current_sales_id();

  IF v_current_sales_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated or sales record not found';
  END IF;

  -- Validate required activity fields
  IF p_activity IS NULL THEN
    RAISE EXCEPTION 'Activity data is required';
  END IF;

  IF p_activity->>'activity_type' IS NULL THEN
    RAISE EXCEPTION 'Activity type is required';
  END IF;

  IF p_activity->>'type' IS NULL THEN
    RAISE EXCEPTION 'Interaction type is required';
  END IF;

  IF p_activity->>'subject' IS NULL OR trim(p_activity->>'subject') = '' THEN
    RAISE EXCEPTION 'Activity subject is required';
  END IF;

  -- Validate contact_id OR organization_id is present (check_has_contact_or_org constraint)
  IF (p_activity->>'contact_id') IS NULL AND (p_activity->>'organization_id') IS NULL THEN
    RAISE EXCEPTION 'Activity must have either contact_id or organization_id';
  END IF;

  -- Insert activity
  INSERT INTO activities (
    activity_type,
    type,
    subject,
    description,
    activity_date,
    duration_minutes,
    contact_id,
    organization_id,
    opportunity_id,
    related_task_id,
    follow_up_required,
    follow_up_date,
    follow_up_notes,
    outcome,
    sentiment,
    location,
    created_by,
    created_at,
    updated_at
  ) VALUES (
    (p_activity->>'activity_type')::activity_type,
    (p_activity->>'type')::interaction_type,
    p_activity->>'subject',
    p_activity->>'description',
    COALESCE((p_activity->>'activity_date')::timestamptz, NOW()),
    (p_activity->>'duration_minutes')::integer,
    (p_activity->>'contact_id')::bigint,
    (p_activity->>'organization_id')::bigint,
    (p_activity->>'opportunity_id')::bigint,
    (p_activity->>'related_task_id')::bigint,
    COALESCE((p_activity->>'follow_up_required')::boolean, false),
    (p_activity->>'follow_up_date')::date,
    p_activity->>'follow_up_notes',
    p_activity->>'outcome',
    p_activity->>'sentiment',
    p_activity->>'location',
    v_current_sales_id,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_activity_id;

  -- Insert task as activity with activity_type='task' (STI pattern)
  IF p_task IS NOT NULL THEN
    -- Validate required task fields
    IF p_task->>'title' IS NULL OR trim(p_task->>'title') = '' THEN
      RAISE EXCEPTION 'Task title is required when creating follow-up task';
    END IF;

    -- Map task_type to interaction_type
    -- task_type enum: 'Call', 'Email', 'Meeting', 'Follow-up', 'Demo', 'Proposal'
    -- interaction_type enum: lowercase versions exist (call, email, meeting, demo, proposal, follow_up)
    INSERT INTO activities (
      activity_type,        -- STI discriminator
      type,                 -- Maps from task.type
      subject,              -- Maps from task.title
      description,          -- Maps from task.description
      due_date,             -- Task-specific column
      reminder_date,        -- Task-specific column
      priority,             -- Task-specific column
      contact_id,           -- Maps from task.contact_id
      organization_id,      -- Inherit from activity if not provided
      opportunity_id,       -- Maps from task.opportunity_id
      sales_id,             -- Task-specific: assigned user
      created_by,           -- Creator
      created_at,
      updated_at
    ) VALUES (
      'task'::activity_type,  -- STI: tasks identified by activity_type='task'
      CASE
        -- Map task_type to interaction_type (lowercase conversion)
        WHEN (p_task->>'type')::text = 'Call' THEN 'call'::interaction_type
        WHEN (p_task->>'type')::text = 'Email' THEN 'email'::interaction_type
        WHEN (p_task->>'type')::text = 'Meeting' THEN 'meeting'::interaction_type
        WHEN (p_task->>'type')::text = 'Follow-up' THEN 'follow_up'::interaction_type
        WHEN (p_task->>'type')::text = 'Demo' THEN 'demo'::interaction_type
        WHEN (p_task->>'type')::text = 'Proposal' THEN 'proposal'::interaction_type
        WHEN (p_task->>'type')::text = 'Other' THEN 'other'::interaction_type
        ELSE 'other'::interaction_type  -- Default fallback for unknown types
      END,
      p_task->>'title',               -- task.title -> activity.subject
      p_task->>'description',
      (p_task->>'due_date')::date,
      (p_task->>'reminder_date')::date,
      COALESCE((p_task->>'priority')::priority_level, 'medium'::priority_level),
      (p_task->>'contact_id')::bigint,
      -- Inherit organization_id from parent activity if task doesn't specify
      COALESCE((p_task->>'organization_id')::bigint, (p_activity->>'organization_id')::bigint),
      (p_task->>'opportunity_id')::bigint,
      COALESCE((p_task->>'sales_id')::bigint, v_current_sales_id),  -- Assigned user or creator
      v_current_sales_id,             -- Creator
      NOW(),
      NOW()
    )
    RETURNING id INTO v_task_id;
  END IF;

  -- Return result with both IDs
  RETURN jsonb_build_object(
    'success', true,
    'activity_id', v_activity_id,
    'task_id', v_task_id
  );

EXCEPTION
  WHEN OTHERS THEN
    -- Transaction will be rolled back automatically
    -- Re-raise with context for debugging
    RAISE EXCEPTION 'log_activity_with_task failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;


ALTER FUNCTION "public"."log_activity_with_task"("p_activity" "jsonb", "p_task" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_activity_with_task"("p_activity" "jsonb", "p_task" "jsonb") IS 'Atomically creates an activity and optionally a follow-up task in a single transaction.
Tasks are stored in the activities table using Single Table Inheritance (activity_type=task).
Use this instead of separate dataProvider.create() calls to ensure consistency.

Parameters:
  p_activity (JSONB): Required. Activity data with fields:
    - activity_type: "activity" (required, simplified model)
    - type: interaction_type enum value (required)
    - subject: text (required)
    - description: text (optional)
    - activity_date: timestamptz (defaults to NOW())
    - contact_id: bigint (required if no organization_id)
    - organization_id: bigint (required if no contact_id)
    - opportunity_id: bigint (optional, required for "interaction" type)
    - related_task_id: bigint (optional, links activity to completed task)
    - other activity fields as needed

  p_task (JSONB): Optional. Follow-up task data with fields:
    - title: text (required if p_task provided) -> maps to activities.subject
    - description: text (optional)
    - due_date: date (optional)
    - reminder_date: date (optional)
    - priority: priority_level enum (defaults to "medium")
    - type: task_type enum (defaults to "Follow-up") -> maps to interaction_type
    - contact_id/organization_id/opportunity_id: inherit from activity if not specified
    - sales_id: bigint (assigned user, defaults to creator)

Returns:
  JSONB with { success: true, activity_id: bigint, task_id: bigint|null }

Example:
  SELECT log_activity_with_task(
    ''{"activity_type": "engagement", "type": "call", "subject": "Follow-up call", "organization_id": 123, "related_task_id": 456}''::jsonb,
    ''{"title": "Schedule demo", "due_date": "2026-01-18", "priority": "high", "type": "Demo"}''::jsonb
  );
';



CREATE OR REPLACE FUNCTION "public"."log_contact_org_linked"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_contact_name TEXT;
BEGIN
  -- Only log when organization_id changes from NULL to non-NULL
  -- (contact being linked to an organization)
  IF OLD.organization_id IS NULL AND NEW.organization_id IS NOT NULL THEN
    v_contact_name := COALESCE(
      NEW.first_name || ' ' || NEW.last_name,
      NEW.first_name,
      NEW.name,
      'Unknown'
    );

    INSERT INTO public.activities (
      activity_type,
      type,
      subject,
      description,
      contact_id,
      organization_id,
      created_by,
      activity_date
    ) VALUES (
      'activity',
      'note',
      'Linked contact: ' || v_contact_name,
      'Contact associated with organization',
      NEW.id,
      NEW.organization_id,
      COALESCE(public.current_sales_id(), NEW.updated_by, NEW.created_by, 1),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_contact_org_linked"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_contact_org_linked"() IS 'Trigger function that logs a timeline entry when a contact is linked to an organization.';



CREATE OR REPLACE FUNCTION "public"."log_contact_org_unlinked"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_contact_name TEXT;
BEGIN
  -- Only log when organization_id changes from non-NULL to NULL
  -- (contact being unlinked from an organization)
  IF OLD.organization_id IS NOT NULL AND NEW.organization_id IS NULL THEN
    v_contact_name := COALESCE(
      NEW.first_name || ' ' || NEW.last_name,
      NEW.first_name,
      NEW.name,
      'Unknown'
    );

    INSERT INTO public.activities (
      activity_type,
      type,
      subject,
      description,
      contact_id,
      organization_id,
      created_by,
      activity_date
    ) VALUES (
      'activity',
      'note',
      'Unlinked contact: ' || v_contact_name,
      'Contact removed from organization',
      NEW.id,
      OLD.organization_id,  -- Use OLD org_id since NEW is NULL
      COALESCE(public.current_sales_id(), NEW.updated_by, NEW.created_by, 1),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_contact_org_unlinked"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_contact_org_unlinked"() IS 'Trigger function that logs a timeline entry when a contact is unlinked from an organization.';



CREATE OR REPLACE FUNCTION "public"."log_engagement"("p_type" "public"."interaction_type", "p_subject" "text", "p_description" "text" DEFAULT NULL::"text", "p_contact_id" bigint DEFAULT NULL::bigint, "p_organization_id" bigint DEFAULT NULL::bigint, "p_activity_date" timestamp with time zone DEFAULT "now"(), "p_duration_minutes" integer DEFAULT NULL::integer, "p_follow_up_required" boolean DEFAULT false, "p_follow_up_date" "date" DEFAULT NULL::"date", "p_outcome" "text" DEFAULT NULL::"text", "p_created_by" bigint DEFAULT NULL::bigint) RETURNS bigint
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_activity_id BIGINT;
BEGIN
    IF p_contact_id IS NULL AND p_organization_id IS NULL THEN
        RAISE EXCEPTION 'Engagement must have either a contact or organization';
    END IF;

    IF p_contact_id IS NOT NULL AND p_organization_id IS NULL THEN
        SELECT organization_id INTO p_organization_id
        FROM contact_organizations
        WHERE contact_id = p_contact_id
          AND is_primary_contact = true
          AND deleted_at IS NULL
        LIMIT 1;
    END IF;

    INSERT INTO activities (
        activity_type,
        type,
        subject,
        description,
        activity_date,
        duration_minutes,
        contact_id,
        organization_id,
        follow_up_required,
        follow_up_date,
        outcome,
        created_by
    )
    VALUES (
        'engagement',
        p_type,
        p_subject,
        p_description,
        p_activity_date,
        p_duration_minutes,
        p_contact_id,
        p_organization_id,
        p_follow_up_required,
        p_follow_up_date,
        p_outcome,
        p_created_by
    )
    RETURNING id INTO v_activity_id;

    RETURN v_activity_id;
END;
$$;


ALTER FUNCTION "public"."log_engagement"("p_type" "public"."interaction_type", "p_subject" "text", "p_description" "text", "p_contact_id" bigint, "p_organization_id" bigint, "p_activity_date" timestamp with time zone, "p_duration_minutes" integer, "p_follow_up_required" boolean, "p_follow_up_date" "date", "p_outcome" "text", "p_created_by" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_interaction"("p_opportunity_id" bigint, "p_type" "public"."interaction_type", "p_subject" "text", "p_description" "text" DEFAULT NULL::"text", "p_contact_id" bigint DEFAULT NULL::bigint, "p_organization_id" bigint DEFAULT NULL::bigint, "p_activity_date" timestamp with time zone DEFAULT "now"(), "p_duration_minutes" integer DEFAULT NULL::integer, "p_follow_up_required" boolean DEFAULT false, "p_follow_up_date" "date" DEFAULT NULL::"date", "p_outcome" "text" DEFAULT NULL::"text", "p_sentiment" character varying DEFAULT NULL::character varying, "p_created_by" bigint DEFAULT NULL::bigint) RETURNS bigint
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_activity_id BIGINT;
    v_customer_org_id BIGINT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM opportunities WHERE id = p_opportunity_id AND deleted_at IS NULL) THEN
        RAISE EXCEPTION 'Opportunity % does not exist or is deleted', p_opportunity_id;
    END IF;

    IF p_organization_id IS NULL THEN
        SELECT op.organization_id INTO v_customer_org_id
        FROM opportunity_participants op
        WHERE op.opportunity_id = p_opportunity_id
          AND op.role = 'customer'
          AND op.is_primary = true
          AND op.deleted_at IS NULL
        LIMIT 1;

        p_organization_id := v_customer_org_id;
    END IF;

    INSERT INTO activities (
        activity_type,
        type,
        subject,
        description,
        activity_date,
        duration_minutes,
        contact_id,
        organization_id,
        opportunity_id,
        follow_up_required,
        follow_up_date,
        outcome,
        sentiment,
        created_by
    )
    VALUES (
        'interaction',
        p_type,
        p_subject,
        p_description,
        p_activity_date,
        p_duration_minutes,
        p_contact_id,
        p_organization_id,
        p_opportunity_id,
        p_follow_up_required,
        p_follow_up_date,
        p_outcome,
        p_sentiment,
        p_created_by
    )
    RETURNING id INTO v_activity_id;

    UPDATE opportunities
    SET updated_at = NOW()
    WHERE id = p_opportunity_id;

    IF p_sentiment = 'positive' AND p_contact_id IS NOT NULL THEN
        UPDATE contact_preferred_principals
        SET last_interaction_date = CURRENT_DATE,
            updated_at = NOW()
        WHERE contact_id = p_contact_id
          AND principal_organization_id IN (
              SELECT organization_id
              FROM opportunity_participants
              WHERE opportunity_id = p_opportunity_id
                AND role = 'principal'
                AND deleted_at IS NULL
          )
          AND deleted_at IS NULL;
    END IF;

    RETURN v_activity_id;
END;
$$;


ALTER FUNCTION "public"."log_interaction"("p_opportunity_id" bigint, "p_type" "public"."interaction_type", "p_subject" "text", "p_description" "text", "p_contact_id" bigint, "p_organization_id" bigint, "p_activity_date" timestamp with time zone, "p_duration_minutes" integer, "p_follow_up_required" boolean, "p_follow_up_date" "date", "p_outcome" "text", "p_sentiment" character varying, "p_created_by" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_opportunity_archived"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only log when deleted_at changes from NULL to non-NULL (soft delete)
  IF OLD.deleted_at IS NULL AND NEW.deleted_at IS NOT NULL THEN
    INSERT INTO public.activities (
      activity_type,
      type,
      subject,
      description,
      opportunity_id,
      organization_id,
      created_by,
      activity_date
    ) VALUES (
      'activity',
      'note',
      'Archived opportunity: ' || NEW.name,
      'Opportunity moved to archive',
      NEW.id,
      NEW.customer_organization_id,
      COALESCE(public.current_sales_id(), NEW.opportunity_owner_id),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_opportunity_archived"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_opportunity_archived"() IS 'Trigger function that logs a timeline entry when an opportunity is archived (soft deleted).';



CREATE OR REPLACE FUNCTION "public"."log_opportunity_created"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.activities (
    activity_type,
    type,
    subject,
    description,
    opportunity_id,
    organization_id,
    created_by,
    activity_date
  ) VALUES (
    'activity',
    'note',
    'Created opportunity: ' || NEW.name,
    'New opportunity with stage: ' || COALESCE(NEW.stage::text, 'none'),
    NEW.id,
    NEW.customer_organization_id,
    NEW.opportunity_owner_id,
    NOW()
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_opportunity_created"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_opportunity_created"() IS 'Trigger function that logs a timeline entry when an opportunity is created.';



CREATE OR REPLACE FUNCTION "public"."log_opportunity_stage_change"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only proceed if stage actually changed (NULL-safe comparison)
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    INSERT INTO public.activities (
      activity_type,
      type,
      subject,
      description,
      opportunity_id,
      organization_id,
      created_by,
      activity_date
    ) VALUES (
      'activity',      -- was 'interaction' - align with simplified model
      'stage_change',  -- was 'note' - enable filtering
      'Stage changed from ' || COALESCE(OLD.stage::text, 'none') || ' to ' || COALESCE(NEW.stage::text, 'none'),
      'Pipeline stage automatically updated from "' || COALESCE(OLD.stage::text, 'none') || '" to "' || COALESCE(NEW.stage::text, 'none') || '".',
      NEW.id,
      NEW.customer_organization_id,
      COALESCE(current_sales_id(), NEW.opportunity_owner_id),  -- actor attribution with fallback
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_opportunity_stage_change"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_opportunity_stage_change"() IS 'Trigger function that logs an activity record when an opportunity stage changes.
Creates an activity-type stage_change entry with old and new stage values for audit trail.
Uses actor attribution (current_sales_id) with owner fallback.
Updated: 2026-02-08 - Simplified model migration';



CREATE OR REPLACE FUNCTION "public"."log_task_completed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only log when completed changes from false to true
  -- AND task has at least one entity ID (required by activities_require_entity_check constraint)
  IF (OLD.completed IS DISTINCT FROM NEW.completed)
     AND NEW.completed = true
     AND (NEW.contact_id IS NOT NULL OR NEW.organization_id IS NOT NULL) THEN
    INSERT INTO public.activities (
      activity_type,
      type,
      subject,
      description,
      contact_id,
      organization_id,
      opportunity_id,
      created_by,
      activity_date
    ) VALUES (
      'activity',
      'note',
      'Completed task: ' || COALESCE(NEW.subject, 'Untitled'),
      NEW.description,
      NEW.contact_id,
      NEW.organization_id,
      NEW.opportunity_id,
      COALESCE(public.current_sales_id(), NEW.sales_id),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_task_completed"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."log_task_completed"() IS 'Trigger function that logs a timeline entry when a task is marked as completed.';



CREATE OR REPLACE FUNCTION "public"."merge_duplicate_contacts"("p_keeper_id" bigint, "p_duplicate_ids" bigint[]) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  v_notes_moved INT := 0;
  v_tasks_moved INT := 0;
  v_participants_moved INT := 0;
  v_contacts_archived INT := 0;
  v_result jsonb;
BEGIN
  -- Validate keeper exists and is not soft-deleted
  IF NOT EXISTS (SELECT 1 FROM contacts WHERE id = p_keeper_id AND deleted_at IS NULL) THEN
    RAISE EXCEPTION 'Keeper contact ID % does not exist or is deleted', p_keeper_id;
  END IF;

  -- Validate all duplicate IDs exist and are not already deleted
  IF EXISTS (
    SELECT 1 FROM unnest(p_duplicate_ids) AS did
    WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE id = did AND deleted_at IS NULL)
  ) THEN
    RAISE EXCEPTION 'One or more duplicate contact IDs do not exist or are already deleted';
  END IF;

  -- Prevent keeper from being in duplicate list
  IF p_keeper_id = ANY(p_duplicate_ids) THEN
    RAISE EXCEPTION 'Keeper ID cannot be in the duplicate IDs list';
  END IF;

  -- Transfer contact notes to keeper (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contactNotes' AND table_schema = 'public') THEN
    UPDATE "contactNotes"
    SET contact_id = p_keeper_id
    WHERE contact_id = ANY(p_duplicate_ids);
    GET DIAGNOSTICS v_notes_moved = ROW_COUNT;
  END IF;

  -- Transfer tasks to keeper (if table exists and has contact_id column)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tasks' AND column_name = 'contact_id' AND table_schema = 'public'
  ) THEN
    UPDATE tasks
    SET contact_id = p_keeper_id
    WHERE contact_id = ANY(p_duplicate_ids);
    GET DIAGNOSTICS v_tasks_moved = ROW_COUNT;
  END IF;

  -- Transfer interaction participants to keeper (if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interaction_participants' AND table_schema = 'public') THEN
    UPDATE interaction_participants
    SET contact_id = p_keeper_id
    WHERE contact_id = ANY(p_duplicate_ids);
    GET DIAGNOSTICS v_participants_moved = ROW_COUNT;
  END IF;

  -- SOFT DELETE duplicate contacts (Constitution fix)
  -- OLD: DELETE FROM contacts WHERE id = ANY(p_duplicate_ids);
  -- NEW: Use soft delete with deleted_at timestamp
  UPDATE contacts 
  SET deleted_at = NOW()
  WHERE id = ANY(p_duplicate_ids)
    AND deleted_at IS NULL;  -- Only soft-delete if not already deleted
  GET DIAGNOSTICS v_contacts_archived = ROW_COUNT;

  -- Return summary (renamed key for clarity)
  v_result := jsonb_build_object(
    'success', true,
    'keeper_id', p_keeper_id,
    'duplicates_archived', v_contacts_archived,  -- renamed from duplicates_removed
    'notes_transferred', v_notes_moved,
    'tasks_transferred', v_tasks_moved,
    'participants_transferred', v_participants_moved
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION "public"."merge_duplicate_contacts"("p_keeper_id" bigint, "p_duplicate_ids" bigint[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."merge_duplicate_contacts"("p_keeper_id" bigint, "p_duplicate_ids" bigint[]) IS 'Merges duplicate contacts into a keeper contact. Transfers all related data (notes, tasks, participants) to the keeper, then SOFT DELETES the duplicates using deleted_at timestamp.';



CREATE OR REPLACE FUNCTION "public"."owns_activity"("act_id" bigint) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM activities
        WHERE id = act_id
        AND created_by = current_sales_id()
    )
$$;


ALTER FUNCTION "public"."owns_activity"("act_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."owns_activity"("act_id" bigint) IS 'Returns true if current user created the activity. Used in RLS policies.';



CREATE OR REPLACE FUNCTION "public"."owns_opportunity"("opp_id" bigint) RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM opportunities
        WHERE id = opp_id
        AND (
            opportunity_owner_id = current_sales_id()
            OR created_by = current_sales_id()
        )
    )
$$;


ALTER FUNCTION "public"."owns_opportunity"("opp_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."owns_opportunity"("opp_id" bigint) IS 'Returns true if current user is the owner or creator of the opportunity. Used in RLS policies.';



CREATE OR REPLACE FUNCTION "public"."prevent_organization_cycle"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_current_parent_id BIGINT;
  v_depth INTEGER := 0;
  v_max_depth INTEGER := 10;
BEGIN
  IF NEW.parent_organization_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_organization_id = NEW.id THEN
    RAISE EXCEPTION 'Organization cannot be its own parent (ID: %)', NEW.id;
  END IF;

  v_current_parent_id := NEW.parent_organization_id;

  WHILE v_current_parent_id IS NOT NULL AND v_depth < v_max_depth LOOP
    IF v_current_parent_id = NEW.id THEN
      RAISE EXCEPTION 'Cycle detected: Organization % would create a circular parent relationship', NEW.id;
    END IF;

    SELECT parent_organization_id
    INTO v_current_parent_id
    FROM organizations
    WHERE id = v_current_parent_id;

    v_depth := v_depth + 1;
  END LOOP;

  IF v_depth >= v_max_depth THEN
    RAISE EXCEPTION 'Maximum hierarchy depth exceeded (% levels). Possible cycle.', v_max_depth;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_organization_cycle"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_parent_org_deletion"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM organizations
    WHERE parent_organization_id = OLD.id
      AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot delete organization with child branches. Remove branches first.';
  END IF;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."prevent_parent_org_deletion"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."prevent_parent_org_deletion"() IS 'Prevents deletion of organizations that have child branches. Protects hierarchy integrity.';



CREATE OR REPLACE FUNCTION "public"."prevent_parent_organization_deletion"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM organizations
    WHERE parent_organization_id = OLD.id
    AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Cannot delete organization % because it has active branches', OLD.name;
  END IF;
  RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."prevent_parent_organization_deletion"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_digest_opt_out"("p_token" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'extensions'
    AS $$
DECLARE
  decoded_token TEXT;
  token_parts TEXT[];
  p_sales_id BIGINT;
  expires_at BIGINT;
  provided_signature TEXT;
  expected_signature TEXT;
  token_data TEXT;
  user_email TEXT;
BEGIN
  BEGIN
    decoded_token := convert_from(decode(p_token, 'base64'), 'UTF8');
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Invalid token format');
  END;

  token_parts := string_to_array(decoded_token, ':');

  IF array_length(token_parts, 1) != 3 THEN
    RETURN json_build_object('success', false, 'error', 'Invalid token structure');
  END IF;

  p_sales_id := token_parts[1]::BIGINT;
  expires_at := token_parts[2]::BIGINT;
  provided_signature := token_parts[3];

  IF expires_at < EXTRACT(EPOCH FROM NOW()) THEN
    RETURN json_build_object('success', false, 'error', 'Token has expired');
  END IF;

  token_data := p_sales_id || ':' || expires_at;
  expected_signature := encode(
    hmac(token_data::bytea,
         COALESCE(current_setting('app.jwt_secret', true), 'digest-opt-out-secret-key')::bytea,
         'sha256'),
    'hex'
  );

  IF provided_signature != expected_signature THEN
    RETURN json_build_object('success', false, 'error', 'Invalid token signature');
  END IF;

  UPDATE sales
  SET digest_opt_in = false, updated_at = NOW()
  WHERE id = p_sales_id
  RETURNING email INTO user_email;

  IF user_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  RETURN json_build_object(
    'success', true,
    'message', 'Successfully unsubscribed from daily digests',
    'email', user_email
  );
END;
$$;


ALTER FUNCTION "public"."process_digest_opt_out"("p_token" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."process_digest_opt_out"("p_token" "text") IS 'Validates opt-out token and updates user preference. Returns JSON with success status.';



CREATE OR REPLACE FUNCTION "public"."products_search_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        coalesce(NEW.name, '') || ' ' ||
        coalesce(NEW.manufacturer_part_number, '') || ' ' ||
        coalesce(NEW.description, '') || ' ' ||
        coalesce(NEW.category::text, '')
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."products_search_trigger"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."products_search_trigger"() IS 'Updates search_tsv for products table. Fixed to remove dropped columns (sku, ingredients, marketing_description, certifications, allergens).';



CREATE OR REPLACE FUNCTION "public"."protect_audit_fields"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Protect created_at (immutable - record birth timestamp)
  IF TG_OP = 'UPDATE' AND OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    NEW.created_at := OLD.created_at;
  END IF;

  -- Protect created_by (immutable - record creator)
  IF TG_OP = 'UPDATE' AND OLD.created_by IS DISTINCT FROM NEW.created_by THEN
    NEW.created_by := OLD.created_by;
  END IF;

  -- Auto-set updated_at (always current timestamp on update)
  NEW.updated_at := NOW();

  -- Auto-set updated_by (current user performing update)
  -- current_sales_id() returns NULL if no auth context (safe)
  IF public.current_sales_id() IS NOT NULL THEN
    NEW.updated_by := public.current_sales_id();
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."protect_audit_fields"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."protect_audit_fields"() IS 'Tier C: Enforce audit field immutability. created_at/created_by silently restored if changed. updated_at/updated_by auto-set on every update.';



CREATE OR REPLACE FUNCTION "public"."set_activity_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Only set if not already provided
  IF NEW.created_by IS NULL THEN
    NEW.created_by := public.current_sales_id();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_activity_created_by"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_activity_created_by"() IS 'Auto-populates created_by with current sales ID if not provided.';



CREATE OR REPLACE FUNCTION "public"."set_contact_notes_updated_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."set_contact_notes_updated_by"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_default_segment_id"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.segment_id IS NULL THEN
    -- Default to "Unknown" segment
    NEW.segment_id := '22222222-2222-4222-8222-000000000009';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_default_segment_id"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_founding_interaction"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Mark founding activity for new opportunities
    -- Fires for any activity (not tasks) linked to an opportunity
    IF NEW.activity_type = 'activity' AND NEW.opportunity_id IS NOT NULL THEN
        UPDATE opportunities
        SET founding_interaction_id = NEW.id
        WHERE id = NEW.opportunity_id
          AND founding_interaction_id IS NULL;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_founding_interaction"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_founding_interaction"() IS 'Sets the founding_interaction_id on opportunities when the first activity is created for that opportunity. Runs AFTER INSERT to ensure the activity ID exists.';



CREATE OR REPLACE FUNCTION "public"."set_interaction_participant_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.created_by IS NULL THEN
        NEW.created_by := current_sales_id();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_interaction_participant_created_by"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_interaction_participant_created_by"() IS 'Auto-populates created_by with current user sales_id on participant creation.';



CREATE OR REPLACE FUNCTION "public"."set_opportunity_notes_updated_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."set_opportunity_notes_updated_by"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_opportunity_owner_defaults"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Default opportunity_owner_id to current user if not provided
  IF NEW.opportunity_owner_id IS NULL THEN
    NEW.opportunity_owner_id := public.current_sales_id();
  END IF;

  -- Default account_manager_id to owner if not provided
  IF NEW.account_manager_id IS NULL THEN
    NEW.account_manager_id := NEW.opportunity_owner_id;
  END IF;

  -- Final validation: Ensure we have an owner
  IF NEW.opportunity_owner_id IS NULL THEN
    RAISE EXCEPTION 'Cannot determine opportunity owner. User may not have a sales record.';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_opportunity_owner_defaults"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_opportunity_owner_defaults"() IS 'Sets opportunity_owner_id and account_manager_id from current_sales_id() if not provided. Industry standard pattern for ownership defaults.';



CREATE OR REPLACE FUNCTION "public"."set_opportunity_participant_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NEW.created_by IS NULL THEN
        NEW.created_by := current_sales_id();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_opportunity_participant_created_by"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_opportunity_participant_created_by"() IS 'Auto-populates created_by with current user sales_id on participant creation.';



CREATE OR REPLACE FUNCTION "public"."set_organization_notes_updated_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
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


ALTER FUNCTION "public"."set_organization_notes_updated_by"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_primary_organization"("p_contact_id" bigint, "p_organization_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- First, ensure the relationship exists
    IF NOT EXISTS (
        SELECT 1 FROM contact_organizations 
        WHERE contact_id = p_contact_id 
        AND organization_id = p_organization_id
        AND deleted_at IS NULL
    ) THEN
        RAISE EXCEPTION 'Contact-Organization relationship does not exist';
    END IF;
    
    -- Set all other organizations for this contact to non-primary
    UPDATE contact_organizations
    SET is_primary = FALSE,
        updated_at = NOW()
    WHERE contact_id = p_contact_id
    AND deleted_at IS NULL;
    
    -- Set the specified organization as primary
    UPDATE contact_organizations
    SET is_primary = TRUE,
        updated_at = NOW()
    WHERE contact_id = p_contact_id
    AND organization_id = p_organization_id
    AND deleted_at IS NULL;
END;
$$;


ALTER FUNCTION "public"."set_primary_organization"("p_contact_id" bigint, "p_organization_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_primary_organization"("p_contact_id" bigint, "p_organization_id" bigint) IS 'Sets the primary organization for a contact, ensuring only one primary organization exists';



CREATE OR REPLACE FUNCTION "public"."set_task_created_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    -- Only set created_by if not already provided
    IF NEW.created_by IS NULL THEN
        NEW.created_by := public.current_sales_id();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_task_created_by"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_task_created_by"() IS 'Auto-populates created_by with current user sales_id on task creation';



CREATE OR REPLACE FUNCTION "public"."set_updated_by"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
BEGIN
  -- Set updated_by to the current user's sales_id
  NEW.updated_by := public.get_current_sales_id();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_updated_by"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_updated_by"() IS 'Automatically sets the updated_by column to the current user''s sales_id on UPDATE operations.';



CREATE OR REPLACE FUNCTION "public"."setup_test_user"("p_user_id" "uuid", "p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_is_admin" boolean DEFAULT false) RETURNS TABLE("result_id" bigint, "result_user_id" "uuid", "result_email" "text", "result_is_admin" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth'
    AS $$
BEGIN
  -- Insert or update sales record
  RETURN QUERY
  INSERT INTO public.sales AS s (user_id, first_name, last_name, email, is_admin)
  VALUES (p_user_id, p_first_name, p_last_name, p_email, p_is_admin)
  ON CONFLICT (user_id) DO UPDATE 
  SET 
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    is_admin = EXCLUDED.is_admin,
    updated_at = NOW()
  RETURNING 
    s.id,
    s.user_id,
    s.email,
    s.is_admin;
END;
$$;


ALTER FUNCTION "public"."setup_test_user"("p_user_id" "uuid", "p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_is_admin" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."soft_delete_product"("product_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Validate product exists and is not already deleted
  IF NOT EXISTS (
    SELECT 1 FROM products
    WHERE id = product_id AND deleted_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Product not found or already deleted: %', product_id;
  END IF;

  -- Perform soft delete
  UPDATE products
  SET
    deleted_at = NOW(),
    updated_at = NOW()
  WHERE id = product_id;
END;
$$;


ALTER FUNCTION "public"."soft_delete_product"("product_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."soft_delete_product"("product_id" bigint) IS 'Soft-deletes a product by setting deleted_at. Uses SECURITY DEFINER to bypass RLS SELECT policy.';



CREATE OR REPLACE FUNCTION "public"."soft_delete_products"("product_ids" bigint[]) RETURNS SETOF bigint
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  deleted_id BIGINT;
BEGIN
  -- Update all specified products and return their IDs
  FOR deleted_id IN
    UPDATE products
    SET
      deleted_at = NOW(),
      updated_at = NOW()
    WHERE id = ANY(product_ids)
      AND deleted_at IS NULL
    RETURNING id
  LOOP
    RETURN NEXT deleted_id;
  END LOOP;

  RETURN;
END;
$$;


ALTER FUNCTION "public"."soft_delete_products"("product_ids" bigint[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."soft_delete_products"("product_ids" bigint[]) IS 'Soft-deletes multiple products by setting deleted_at. Returns array of deleted IDs. Uses SECURITY DEFINER to bypass RLS SELECT policy.';



CREATE OR REPLACE FUNCTION "public"."sync_is_admin_from_role"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.is_admin := (NEW.role = 'admin');
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_is_admin_from_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_opportunity_with_contacts"("p_opportunity_id" bigint, "p_contact_ids" bigint[]) RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_contact_ids BIGINT[];
BEGIN
  -- Handle null input (defensive)
  v_contact_ids := COALESCE(p_contact_ids, ARRAY[]::BIGINT[]);

  -- SOFT DELETE existing junction rows for contacts NOT in the new list
  -- (Replaces hard DELETE per PROVIDER_RULES.md §5)
  UPDATE opportunity_contacts
  SET deleted_at = NOW()
  WHERE opportunity_id = p_opportunity_id
    AND deleted_at IS NULL
    AND (
      array_length(v_contact_ids, 1) IS NULL  -- Soft-delete all if empty array
      OR contact_id <> ALL(v_contact_ids)     -- Soft-delete those not in new list
    );

  -- Reactivate any soft-deleted rows that are in the new list
  IF array_length(v_contact_ids, 1) > 0 THEN
    UPDATE opportunity_contacts
    SET deleted_at = NULL
    WHERE opportunity_id = p_opportunity_id
      AND contact_id = ANY(v_contact_ids)
      AND deleted_at IS NOT NULL;
  END IF;

  -- Insert genuinely new relationships (only those that don't exist at all)
  IF array_length(v_contact_ids, 1) > 0 THEN
    INSERT INTO opportunity_contacts (opportunity_id, contact_id)
    SELECT DISTINCT p_opportunity_id, cid
    FROM unnest(v_contact_ids) AS cid
    WHERE NOT EXISTS (
      SELECT 1 FROM opportunity_contacts oc
      WHERE oc.opportunity_id = p_opportunity_id
        AND oc.contact_id = cid
    )
    ON CONFLICT (opportunity_id, contact_id) DO NOTHING;
  END IF;
END;
$$;


ALTER FUNCTION "public"."sync_opportunity_with_contacts"("p_opportunity_id" bigint, "p_contact_ids" bigint[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_opportunity_with_contacts"("p_opportunity_id" bigint, "p_contact_ids" bigint[]) IS 'Atomically syncs opportunity-contact relationships using SOFT DELETE. Audit fix 2026-01-20.';



CREATE OR REPLACE FUNCTION "public"."sync_opportunity_with_products"("opportunity_data" "jsonb", "products_to_create" "jsonb", "products_to_update" "jsonb", "product_ids_to_delete" integer[]) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  opportunity_id BIGINT;
  is_new_opportunity BOOLEAN;
  contact_ids_array BIGINT[];
BEGIN
  -- Determine if this is a new opportunity (no ID provided)
  is_new_opportunity := (opportunity_data->>'id') IS NULL;

  -- ============================================
  -- BACKEND VALIDATION FOR NEW OPPORTUNITIES
  -- ============================================
  IF is_new_opportunity THEN
    -- Business Rule: Must have exactly one customer organization
    IF (opportunity_data->>'customer_organization_id') IS NULL THEN
      RAISE EXCEPTION 'customer_organization_id is required to create an opportunity';
    END IF;

    -- Business Rule: Must have at least one contact
    IF NOT (opportunity_data ? 'contact_ids') OR
       jsonb_array_length(opportunity_data->'contact_ids') = 0 THEN
      RAISE EXCEPTION 'At least one contact is required to create an opportunity';
    END IF;

    -- Business Rule: Must have at least one product
    IF jsonb_array_length(products_to_create) = 0 THEN
      RAISE EXCEPTION 'At least one product is required to create an opportunity';
    END IF;
  END IF;

  -- Convert JSONB array to PostgreSQL array properly
  IF opportunity_data ? 'contact_ids' AND opportunity_data->'contact_ids' IS NOT NULL THEN
    SELECT ARRAY_AGG((value#>>'{}')::BIGINT)
    INTO contact_ids_array
    FROM jsonb_array_elements(opportunity_data->'contact_ids');
  ELSE
    contact_ids_array := '{}'::BIGINT[];
  END IF;

  -- ============================================
  -- INSERT OR UPDATE OPPORTUNITY
  -- ============================================
  IF is_new_opportunity THEN
    -- New opportunity: INSERT without id (let database generate it)
    INSERT INTO opportunities (
      name, description, stage, priority,
      estimated_close_date, customer_organization_id, principal_organization_id,
      distributor_organization_id, contact_ids, opportunity_owner_id,
      account_manager_id, lead_source, index
    )
    VALUES (
      opportunity_data->>'name',
      opportunity_data->>'description',
      (opportunity_data->>'stage')::opportunity_stage,
      (opportunity_data->>'priority')::priority_level,
      (opportunity_data->>'estimated_close_date')::DATE,
      (opportunity_data->>'customer_organization_id')::BIGINT,
      (opportunity_data->>'principal_organization_id')::BIGINT,
      (opportunity_data->>'distributor_organization_id')::BIGINT,
      contact_ids_array,
      (opportunity_data->>'opportunity_owner_id')::BIGINT,
      (opportunity_data->>'account_manager_id')::BIGINT,
      opportunity_data->>'lead_source',
      (opportunity_data->>'index')::INTEGER
    )
    RETURNING id INTO opportunity_id;
  ELSE
    -- Existing opportunity: UPDATE
    UPDATE opportunities SET
      name = opportunity_data->>'name',
      description = opportunity_data->>'description',
      stage = (opportunity_data->>'stage')::opportunity_stage,
      priority = (opportunity_data->>'priority')::priority_level,
      estimated_close_date = (opportunity_data->>'estimated_close_date')::DATE,
      customer_organization_id = (opportunity_data->>'customer_organization_id')::BIGINT,
      principal_organization_id = (opportunity_data->>'principal_organization_id')::BIGINT,
      distributor_organization_id = (opportunity_data->>'distributor_organization_id')::BIGINT,
      contact_ids = contact_ids_array,
      opportunity_owner_id = (opportunity_data->>'opportunity_owner_id')::BIGINT,
      account_manager_id = (opportunity_data->>'account_manager_id')::BIGINT,
      lead_source = opportunity_data->>'lead_source',
      index = (opportunity_data->>'index')::INTEGER,
      updated_at = NOW()
    WHERE id = (opportunity_data->>'id')::BIGINT
    RETURNING id INTO opportunity_id;
  END IF;

  -- Create new product associations
  IF JSONB_ARRAY_LENGTH(products_to_create) > 0 THEN
    INSERT INTO opportunity_products (
      opportunity_id, product_id_reference, product_name, product_category, notes
    )
    SELECT
      opportunity_id,
      (p->>'product_id_reference')::BIGINT,
      p->>'product_name',
      p->>'product_category',
      p->>'notes'
    FROM JSONB_ARRAY_ELEMENTS(products_to_create) AS p;
  END IF;

  -- Update existing product associations
  IF JSONB_ARRAY_LENGTH(products_to_update) > 0 THEN
    UPDATE opportunity_products op
    SET
      product_id_reference = (p->>'product_id_reference')::BIGINT,
      product_name = p->>'product_name',
      product_category = p->>'product_category',
      notes = p->>'notes',
      updated_at = NOW()
    FROM JSONB_ARRAY_ELEMENTS(products_to_update) p
    WHERE op.id = (p->>'id')::BIGINT;
  END IF;

  -- SOFT DELETE removed product associations (Constitution fix)
  -- OLD: DELETE FROM opportunity_products WHERE id = ANY(product_ids_to_delete);
  -- NEW: Use soft delete with deleted_at timestamp
  IF ARRAY_LENGTH(product_ids_to_delete, 1) > 0 THEN
    UPDATE opportunity_products
    SET deleted_at = NOW()
    WHERE id = ANY(product_ids_to_delete)
      AND deleted_at IS NULL;  -- Only soft-delete if not already deleted
  END IF;

  -- Return the updated opportunity with products
  -- Build JSON object directly and wrap it in data property
  RETURN jsonb_build_object(
    'data', (
      SELECT jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'description', o.description,
        'stage', o.stage,
        'priority', o.priority,
        'estimated_close_date', o.estimated_close_date,
        'customer_organization_id', o.customer_organization_id,
        'principal_organization_id', o.principal_organization_id,
        'distributor_organization_id', o.distributor_organization_id,
        'contact_ids', o.contact_ids,
        'account_manager_id', o.account_manager_id,
        'lead_source', o.lead_source,
        'index', o.index,
        'created_at', o.created_at,
        'updated_at', o.updated_at,
        'products', (
          SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
              'id', op.id,
              'product_id_reference', op.product_id_reference,
              'product_name', op.product_name,
              'product_category', op.product_category,
              'notes', op.notes
            )
          ), '[]'::jsonb)
          FROM opportunity_products op
          WHERE op.opportunity_id = o.id
            AND op.deleted_at IS NULL  -- Only return non-deleted products
        )
      )
      FROM opportunities o
      WHERE o.id = opportunity_id
    )
  );
END;
$$;


ALTER FUNCTION "public"."sync_opportunity_with_products"("opportunity_data" "jsonb", "products_to_create" "jsonb", "products_to_update" "jsonb", "product_ids_to_delete" integer[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_opportunity_with_products"("opportunity_data" "jsonb", "products_to_create" "jsonb", "products_to_update" "jsonb", "product_ids_to_delete" integer[]) IS 'Atomically synchronize opportunity and its product associations with backend validation. Returns { data: { id, ...fields } } directly without RECORD conversion.';



CREATE OR REPLACE FUNCTION "public"."sync_opportunity_with_products"("opportunity_data" "jsonb", "products_to_create" "jsonb", "products_to_update" "jsonb", "product_ids_to_delete" integer[], "expected_version" integer DEFAULT NULL::integer) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  opportunity_id BIGINT;
  is_new_opportunity BOOLEAN;
  contact_ids_array BIGINT[];
  rows_updated INTEGER;
BEGIN
  -- Determine if this is a new opportunity (no ID provided)
  is_new_opportunity := (opportunity_data->>'id') IS NULL;

  -- ============================================
  -- BACKEND VALIDATION FOR NEW OPPORTUNITIES
  -- ============================================
  IF is_new_opportunity THEN
    -- Business Rule: Must have exactly one customer organization
    IF (opportunity_data->>'customer_organization_id') IS NULL THEN
      RAISE EXCEPTION 'customer_organization_id is required to create an opportunity';
    END IF;

    -- Business Rule: Must have at least one contact
    IF NOT (opportunity_data ? 'contact_ids') OR
       jsonb_array_length(opportunity_data->'contact_ids') = 0 THEN
      RAISE EXCEPTION 'At least one contact is required to create an opportunity';
    END IF;

    -- Business Rule: Must have at least one product
    IF jsonb_array_length(products_to_create) = 0 THEN
      RAISE EXCEPTION 'At least one product is required to create an opportunity';
    END IF;
  END IF;

  -- Convert JSONB array to PostgreSQL array properly
  IF opportunity_data ? 'contact_ids' AND opportunity_data->'contact_ids' IS NOT NULL THEN
    SELECT ARRAY_AGG((value#>>'{}')::BIGINT)
    INTO contact_ids_array
    FROM jsonb_array_elements(opportunity_data->'contact_ids');
  ELSE
    contact_ids_array := '{}'::BIGINT[];
  END IF;

  -- ============================================
  -- INSERT OR UPDATE OPPORTUNITY
  -- ============================================
  IF is_new_opportunity THEN
    -- New opportunity: INSERT without id (let database generate it)
    -- Version defaults to 1
    INSERT INTO opportunities (
      name, description, stage, priority,
      estimated_close_date, customer_organization_id, principal_organization_id,
      distributor_organization_id, contact_ids, opportunity_owner_id,
      account_manager_id, lead_source, index, version
    )
    VALUES (
      opportunity_data->>'name',
      opportunity_data->>'description',
      (opportunity_data->>'stage')::opportunity_stage,
      (opportunity_data->>'priority')::priority_level,
      (opportunity_data->>'estimated_close_date')::DATE,
      (opportunity_data->>'customer_organization_id')::BIGINT,
      (opportunity_data->>'principal_organization_id')::BIGINT,
      (opportunity_data->>'distributor_organization_id')::BIGINT,
      contact_ids_array,
      (opportunity_data->>'opportunity_owner_id')::BIGINT,
      (opportunity_data->>'account_manager_id')::BIGINT,
      opportunity_data->>'lead_source',
      (opportunity_data->>'index')::INTEGER,
      1  -- Initial version
    )
    RETURNING id INTO opportunity_id;
  ELSE
    -- Existing opportunity: UPDATE with optional version check
    -- If expected_version is provided, include it in WHERE clause
    IF expected_version IS NOT NULL THEN
      UPDATE opportunities SET
        name = opportunity_data->>'name',
        description = opportunity_data->>'description',
        stage = (opportunity_data->>'stage')::opportunity_stage,
        priority = (opportunity_data->>'priority')::priority_level,
        estimated_close_date = (opportunity_data->>'estimated_close_date')::DATE,
        customer_organization_id = (opportunity_data->>'customer_organization_id')::BIGINT,
        principal_organization_id = (opportunity_data->>'principal_organization_id')::BIGINT,
        distributor_organization_id = (opportunity_data->>'distributor_organization_id')::BIGINT,
        contact_ids = contact_ids_array,
        opportunity_owner_id = (opportunity_data->>'opportunity_owner_id')::BIGINT,
        account_manager_id = (opportunity_data->>'account_manager_id')::BIGINT,
        lead_source = opportunity_data->>'lead_source',
        index = (opportunity_data->>'index')::INTEGER,
        updated_at = NOW()
        -- Note: version is auto-incremented by trigger
      WHERE id = (opportunity_data->>'id')::BIGINT
        AND version = expected_version  -- Optimistic lock check
      RETURNING id INTO opportunity_id;

      -- Check if update succeeded (version matched)
      GET DIAGNOSTICS rows_updated = ROW_COUNT;
      IF rows_updated = 0 THEN
        -- Version mismatch - another user modified the record
        RAISE EXCEPTION 'CONFLICT: This opportunity was modified by another user. Please refresh the page and try again. [expected_version=%, id=%]',
          expected_version,
          (opportunity_data->>'id')::BIGINT
          USING ERRCODE = 'serialization_failure';  -- PostgreSQL 40001 for serialization conflicts
      END IF;
    ELSE
      -- No version check requested (backwards compatibility)
      UPDATE opportunities SET
        name = opportunity_data->>'name',
        description = opportunity_data->>'description',
        stage = (opportunity_data->>'stage')::opportunity_stage,
        priority = (opportunity_data->>'priority')::priority_level,
        estimated_close_date = (opportunity_data->>'estimated_close_date')::DATE,
        customer_organization_id = (opportunity_data->>'customer_organization_id')::BIGINT,
        principal_organization_id = (opportunity_data->>'principal_organization_id')::BIGINT,
        distributor_organization_id = (opportunity_data->>'distributor_organization_id')::BIGINT,
        contact_ids = contact_ids_array,
        opportunity_owner_id = (opportunity_data->>'opportunity_owner_id')::BIGINT,
        account_manager_id = (opportunity_data->>'account_manager_id')::BIGINT,
        lead_source = opportunity_data->>'lead_source',
        index = (opportunity_data->>'index')::INTEGER,
        updated_at = NOW()
      WHERE id = (opportunity_data->>'id')::BIGINT
      RETURNING id INTO opportunity_id;
    END IF;
  END IF;

  -- Create new product associations
  IF JSONB_ARRAY_LENGTH(products_to_create) > 0 THEN
    INSERT INTO opportunity_products (
      opportunity_id, product_id_reference, product_name, product_category, notes
    )
    SELECT
      opportunity_id,
      (p->>'product_id_reference')::BIGINT,
      p->>'product_name',
      p->>'product_category',
      p->>'notes'
    FROM JSONB_ARRAY_ELEMENTS(products_to_create) AS p;
  END IF;

  -- Update existing product associations
  IF JSONB_ARRAY_LENGTH(products_to_update) > 0 THEN
    UPDATE opportunity_products op
    SET
      product_id_reference = (p->>'product_id_reference')::BIGINT,
      product_name = p->>'product_name',
      product_category = p->>'product_category',
      notes = p->>'notes',
      updated_at = NOW()
    FROM JSONB_ARRAY_ELEMENTS(products_to_update) p
    WHERE op.id = (p->>'id')::BIGINT;
  END IF;

  -- SOFT DELETE removed product associations (Constitution fix)
  IF ARRAY_LENGTH(product_ids_to_delete, 1) > 0 THEN
    UPDATE opportunity_products
    SET deleted_at = NOW()
    WHERE id = ANY(product_ids_to_delete)
      AND deleted_at IS NULL;
  END IF;

  -- Return the updated opportunity with products (including version!)
  RETURN jsonb_build_object(
    'data', (
      SELECT jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'description', o.description,
        'stage', o.stage,
        'priority', o.priority,
        'estimated_close_date', o.estimated_close_date,
        'customer_organization_id', o.customer_organization_id,
        'principal_organization_id', o.principal_organization_id,
        'distributor_organization_id', o.distributor_organization_id,
        'contact_ids', o.contact_ids,
        'account_manager_id', o.account_manager_id,
        'lead_source', o.lead_source,
        'index', o.index,
        'created_at', o.created_at,
        'updated_at', o.updated_at,
        'version', o.version,  -- Include version in response!
        'products', (
          SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
              'id', op.id,
              'product_id_reference', op.product_id_reference,
              'product_name', op.product_name,
              'product_category', op.product_category,
              'notes', op.notes
            )
          ), '[]'::jsonb)
          FROM opportunity_products op
          WHERE op.opportunity_id = o.id
            AND op.deleted_at IS NULL
        )
      )
      FROM opportunities o
      WHERE o.id = opportunity_id
    )
  );
END;
$$;


ALTER FUNCTION "public"."sync_opportunity_with_products"("opportunity_data" "jsonb", "products_to_create" "jsonb", "products_to_update" "jsonb", "product_ids_to_delete" integer[], "expected_version" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_opportunity_with_products"("opportunity_data" "jsonb", "products_to_create" "jsonb", "products_to_update" "jsonb", "product_ids_to_delete" integer[], "expected_version" integer) IS 'Atomically syncs opportunity with its products. Supports optimistic locking via expected_version parameter. If expected_version is provided and does not match current version, raises CONFLICT exception (40001).';



CREATE OR REPLACE FUNCTION "public"."unarchive_contact_with_relations"("contact_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Validate input
  IF contact_id IS NULL THEN
    RAISE EXCEPTION 'Contact ID cannot be null';
  END IF;

  -- Unarchive the contact
  UPDATE contacts
  SET deleted_at = NULL
  WHERE id = contact_id;

  -- Cascade unarchive to activities
  UPDATE activities
  SET deleted_at = NULL
  WHERE activities.contact_id = unarchive_contact_with_relations.contact_id
    AND deleted_at IS NOT NULL;

  -- Cascade unarchive to contact notes
  UPDATE "contactNotes"
  SET deleted_at = NULL
  WHERE "contactNotes".contact_id = unarchive_contact_with_relations.contact_id
    AND deleted_at IS NOT NULL;

  -- Cascade unarchive to interaction_participants
  UPDATE interaction_participants
  SET deleted_at = NULL
  WHERE interaction_participants.contact_id = unarchive_contact_with_relations.contact_id
    AND deleted_at IS NOT NULL;

  -- Cascade unarchive to opportunity_contacts (junction table)
  UPDATE opportunity_contacts
  SET deleted_at = NULL
  WHERE opportunity_contacts.contact_id = unarchive_contact_with_relations.contact_id
    AND deleted_at IS NOT NULL;

END;
$$;


ALTER FUNCTION "public"."unarchive_contact_with_relations"("contact_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unarchive_opportunity_with_relations"("opp_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Validate input
  IF opp_id IS NULL THEN
    RAISE EXCEPTION 'Opportunity ID cannot be null';
  END IF;

  -- Unarchive the opportunity
  UPDATE opportunities
  SET deleted_at = NULL
  WHERE id = opp_id;

  -- Cascade unarchive to activities
  UPDATE activities
  SET deleted_at = NULL
  WHERE opportunity_id = opp_id AND deleted_at IS NOT NULL;

  -- Cascade unarchive to opportunity notes
  UPDATE "opportunityNotes"
  SET deleted_at = NULL
  WHERE opportunity_id = opp_id AND deleted_at IS NOT NULL;

  -- Cascade unarchive to opportunity participants
  UPDATE opportunity_participants
  SET deleted_at = NULL
  WHERE opportunity_id = opp_id AND deleted_at IS NOT NULL;

  -- Cascade unarchive to tasks
  UPDATE tasks
  SET deleted_at = NULL
  WHERE opportunity_id = opp_id AND deleted_at IS NOT NULL;

  -- P0 FIX: Cascade unarchive to opportunity_contacts (junction table)
  UPDATE opportunity_contacts
  SET deleted_at = NULL
  WHERE opportunity_id = opp_id AND deleted_at IS NOT NULL;

  -- P0 FIX: Cascade unarchive to opportunity_products (junction table)
  UPDATE opportunity_products
  SET deleted_at = NULL
  WHERE opportunity_id = opp_id AND deleted_at IS NOT NULL;
END;
$$;


ALTER FUNCTION "public"."unarchive_opportunity_with_relations"("opp_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unarchive_organization_with_relations"("org_id" bigint) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  contact_rec RECORD;
  opp_rec RECORD;
BEGIN
  -- Validate input
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Organization ID cannot be null';
  END IF;

  -- Unarchive the organization
  UPDATE organizations
  SET deleted_at = NULL
  WHERE id = org_id;

  -- Cascade unarchive to organization notes
  UPDATE "organizationNotes"
  SET deleted_at = NULL
  WHERE "organizationNotes".organization_id = unarchive_organization_with_relations.org_id
    AND deleted_at IS NOT NULL;

  -- Cascade unarchive to activities
  UPDATE activities
  SET deleted_at = NULL
  WHERE activities.organization_id = unarchive_organization_with_relations.org_id
    AND deleted_at IS NOT NULL;

  -- Cascade unarchive to organization_distributors
  UPDATE organization_distributors
  SET deleted_at = NULL
  WHERE organization_distributors.organization_id = unarchive_organization_with_relations.org_id
    AND deleted_at IS NOT NULL;

  -- Cascade unarchive to distributor_principal_authorizations
  UPDATE distributor_principal_authorizations
  SET deleted_at = NULL
  WHERE (distributor_principal_authorizations.principal_id = unarchive_organization_with_relations.org_id
      OR distributor_principal_authorizations.distributor_id = unarchive_organization_with_relations.org_id)
    AND deleted_at IS NOT NULL;

  -- RECURSIVE: Unarchive contacts that belonged to this organization
  -- Note: This unarchives ALL contacts that were archived, which may include
  -- contacts archived for other reasons. For production, consider tracking
  -- archive reason or using a separate restore mechanism.
  FOR contact_rec IN
    SELECT id FROM contacts
    WHERE organization_id = unarchive_organization_with_relations.org_id
      AND deleted_at IS NOT NULL
  LOOP
    PERFORM unarchive_contact_with_relations(contact_rec.id);
  END LOOP;

  -- RECURSIVE: Unarchive opportunities where this org was the customer
  FOR opp_rec IN
    SELECT id FROM opportunities
    WHERE customer_organization_id = unarchive_organization_with_relations.org_id
      AND deleted_at IS NOT NULL
  LOOP
    PERFORM unarchive_opportunity_with_relations(opp_rec.id);
  END LOOP;

END;
$$;


ALTER FUNCTION "public"."unarchive_organization_with_relations"("org_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_contact_notes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_contact_notes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_digest_preference"("p_opt_in" boolean) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  current_user_id UUID;
  updated_email TEXT;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  UPDATE sales
  SET digest_opt_in = p_opt_in, updated_at = NOW()
  WHERE user_id = current_user_id
  RETURNING email INTO updated_email;

  IF updated_email IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not found');
  END IF;

  RETURN json_build_object(
    'success', true,
    'digest_opt_in', p_opt_in,
    'message', CASE WHEN p_opt_in
      THEN 'Successfully subscribed to daily digests'
      ELSE 'Successfully unsubscribed from daily digests'
    END
  );
END;
$$;


ALTER FUNCTION "public"."update_digest_preference"("p_opt_in" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_digest_preference"("p_opt_in" boolean) IS 'Updates current user digest preference. Called from Settings page. Uses auth.uid() for security.';



CREATE OR REPLACE FUNCTION "public"."update_opportunities_search_tsv"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.campaign, '') || ' ' ||
        COALESCE(NEW.notes, '')
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_opportunities_search_tsv"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_opportunity_notes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_opportunity_notes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_opportunity_products_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_opportunity_products_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_opportunity_stage_changed_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.stage IS DISTINCT FROM NEW.stage) THEN
    NEW.stage_changed_at = now();
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_opportunity_stage_changed_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_organization_notes_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_organization_notes_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_organizations_search_tsv"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.search_tsv := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.notes, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.state, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.website, '')), 'D');
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_organizations_search_tsv"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_product_features_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_product_features_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_products_search"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.category::TEXT, '') || ' ' ||
        COALESCE(NEW.manufacturer_part_number, '')
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_products_search"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_products_search"() IS 'Updates search_tsv for products table. Fixed to remove dropped columns (sku, marketing_description).';



CREATE OR REPLACE FUNCTION "public"."update_search_tsv"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    IF TG_TABLE_NAME = 'organizations' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.website, '') || ' ' ||
            COALESCE(NEW.address, '') || ' ' ||
            COALESCE(NEW.city, '') || ' ' ||
            COALESCE(NEW.state, '')
        );
    ELSIF TG_TABLE_NAME = 'contacts' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.first_name, '') || ' ' ||
            COALESCE(NEW.last_name, '') || ' ' ||
            COALESCE(NEW.title, '') || ' ' ||
            COALESCE(NEW.department, '') || ' ' ||
            COALESCE(NEW.email::text, '') || ' ' ||
            COALESCE(NEW.phone::text, '')
        );
    ELSIF TG_TABLE_NAME = 'opportunities' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.next_action, '')
        );
    ELSIF TG_TABLE_NAME = 'products' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.category::TEXT, '') || ' ' ||
            COALESCE(NEW.manufacturer_part_number, '')
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_search_tsv"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_search_tsv"() IS 'Updates search_tsv for multiple tables. Products branch fixed to remove dropped columns (sku, ingredients, marketing_description, certifications, allergens).';



CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_updated_at_column"() IS 'Trigger function to automatically update updated_at timestamp on row updates.';



CREATE OR REPLACE FUNCTION "public"."user_role"() RETURNS "public"."user_role"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  SELECT
    CASE
      WHEN auth.uid() IS NULL THEN 'rep'::public.user_role
      ELSE COALESCE(
        (SELECT role FROM public.sales WHERE user_id = auth.uid() AND deleted_at IS NULL),
        'rep'::public.user_role
      )
    END
$$;


ALTER FUNCTION "public"."user_role"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."user_role"() IS 'Returns the role of the currently authenticated user. SECURITY: SECURITY DEFINER with empty search_path to prevent hijacking.';



CREATE OR REPLACE FUNCTION "public"."validate_activity_consistency"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_contact_org_id BIGINT;
    v_opp_customer_id BIGINT;
BEGIN
    IF NEW.contact_id IS NOT NULL AND NEW.opportunity_id IS NOT NULL THEN
        SELECT organization_id INTO v_contact_org_id
        FROM contacts
        WHERE id = NEW.contact_id;

        SELECT customer_organization_id INTO v_opp_customer_id
        FROM opportunities
        WHERE id = NEW.opportunity_id;

        IF v_contact_org_id IS NOT NULL AND v_opp_customer_id IS NOT NULL THEN
            IF v_contact_org_id != v_opp_customer_id THEN
                RAISE EXCEPTION 'Contact % does not belong to opportunity customer organization %',
                    NEW.contact_id, v_opp_customer_id
                    USING HINT = 'The contact must work for the customer organization associated with this opportunity';
            END IF;
        END IF;

        IF NEW.organization_id IS NULL THEN
            NEW.organization_id := v_opp_customer_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_activity_consistency"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_activity_consistency"() IS 'Validates activity consistency, especially contact-opportunity relationships.
For activities with both contact_id and opportunity_id:
- Verifies contact belongs to the opportunity customer organization
- Raises exception if validation fails (prevents API manipulation)
- Auto-sets organization_id from opportunity customer if not provided';



CREATE OR REPLACE FUNCTION "public"."validate_opportunity_closure"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Validate closed_won requires win_reason
  IF NEW.stage = 'closed_won' AND NEW.win_reason IS NULL THEN
    RAISE EXCEPTION 'win_reason is required when closing opportunity as won'
      USING
        ERRCODE = 'check_violation',
        DETAIL = 'Opportunity stage cannot be set to closed_won without specifying a win reason',
        HINT = 'Please select a reason from: price, quality, relationship, or other';
  END IF;

  -- Validate closed_lost requires loss_reason
  IF NEW.stage = 'closed_lost' AND NEW.loss_reason IS NULL THEN
    RAISE EXCEPTION 'loss_reason is required when closing opportunity as lost'
      USING
        ERRCODE = 'check_violation',
        DETAIL = 'Opportunity stage cannot be set to closed_lost without specifying a loss reason',
        HINT = 'Please select a reason from: price, quality, relationship, no_authorization, competitor, or other';
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_opportunity_closure"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_opportunity_closure"() IS 'Validates that opportunities closed as won/lost have required reason fields populated. Prevents data quality issues from client-side validation bypasses.';



CREATE OR REPLACE FUNCTION "public"."validate_opportunity_participant_roles"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_org_type organization_type;
BEGIN
    -- Get organization type
    SELECT organization_type
    INTO v_org_type
    FROM organizations
    WHERE id = NEW.organization_id;

    -- Validate role matches organization type
    IF NEW.role = 'principal' AND v_org_type != 'principal' THEN
        RAISE EXCEPTION 'Organization must be a principal to have principal role';
    END IF;

    IF NEW.role = 'distributor' AND v_org_type != 'distributor' THEN
        RAISE EXCEPTION 'Organization must be a distributor to have distributor role';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_opportunity_participant_roles"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_opportunity_participant_roles"() IS 'Validates that organization role matches organization_type. Updated 2025-10-18 to use organization_type instead of deprecated is_principal/is_distributor fields.';



CREATE OR REPLACE FUNCTION "public"."validate_opportunity_participants"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_org_type organization_type;
    v_primary_count INTEGER;
BEGIN
    -- Get organization type (is_principal/is_distributor columns were removed)
    SELECT organization_type
    INTO v_org_type
    FROM organizations
    WHERE id = NEW.organization_id;

    -- Validate role matches organization type
    -- principal role requires organization_type = 'principal'
    IF NEW.role = 'principal' AND v_org_type != 'principal' THEN
        RAISE EXCEPTION 'Organization % is not a principal (type: %)', NEW.organization_id, v_org_type;
    END IF;

    -- distributor role requires organization_type = 'distributor'
    IF NEW.role = 'distributor' AND v_org_type != 'distributor' THEN
        RAISE EXCEPTION 'Organization % is not a distributor (type: %)', NEW.organization_id, v_org_type;
    END IF;

    -- Enforce single primary per role per opportunity
    IF NEW.is_primary THEN
        SELECT COUNT(*) INTO v_primary_count
        FROM opportunity_participants
        WHERE opportunity_id = NEW.opportunity_id
          AND role = NEW.role
          AND is_primary = true
          AND deleted_at IS NULL
          AND id != COALESCE(NEW.id, -1);

        IF v_primary_count > 0 THEN
            -- Auto-demote existing primary
            UPDATE opportunity_participants
            SET is_primary = false,
                updated_at = NOW()
            WHERE opportunity_id = NEW.opportunity_id
              AND role = NEW.role
              AND is_primary = true
              AND id != COALESCE(NEW.id, -1)
              AND deleted_at IS NULL;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_opportunity_participants"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."validate_opportunity_participants"() IS 'Validates opportunity participants and ensures only one primary per role type';



CREATE OR REPLACE FUNCTION "public"."validate_principal_organization"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM companies
        WHERE id = NEW.principal_organization_id
        AND is_principal = true
    ) THEN
        RAISE EXCEPTION 'Organization % is not marked as principal', NEW.principal_organization_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_principal_organization"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_related_opportunity_principal"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_related_principal BIGINT;
BEGIN
  IF NEW.related_opportunity_id IS NOT NULL THEN
    SELECT principal_organization_id INTO v_related_principal
    FROM opportunities
    WHERE id = NEW.related_opportunity_id
      AND deleted_at IS NULL;

    IF v_related_principal IS NULL THEN
      RAISE EXCEPTION 'Related opportunity % not found or deleted',
        NEW.related_opportunity_id;
    END IF;

    IF v_related_principal != NEW.principal_organization_id THEN
      RAISE EXCEPTION 'Related opportunity must have same principal_organization_id. Expected %, got %',
        NEW.principal_organization_id, v_related_principal;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_related_opportunity_principal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_user_favorite_entity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  entity_exists boolean;
BEGIN
  EXECUTE format(
    'SELECT EXISTS (SELECT 1 FROM %I WHERE id = $1 AND deleted_at IS NULL)',
    NEW.entity_type
  ) INTO entity_exists USING NEW.entity_id;

  IF NOT entity_exists THEN
    RAISE EXCEPTION 'Entity %:% does not exist or is deleted',
      NEW.entity_type, NEW.entity_id;
  END IF;

  RETURN NEW;
END;
$_$;


ALTER FUNCTION "public"."validate_user_favorite_entity"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" bigint NOT NULL,
    "activity_type" "public"."activity_type" NOT NULL,
    "type" "public"."interaction_type" NOT NULL,
    "subject" "text" NOT NULL,
    "description" "text",
    "activity_date" timestamp with time zone DEFAULT "now"(),
    "duration_minutes" integer,
    "contact_id" bigint,
    "organization_id" bigint,
    "opportunity_id" bigint,
    "follow_up_required" boolean DEFAULT false,
    "follow_up_date" "date",
    "follow_up_notes" "text",
    "outcome" "text",
    "sentiment" character varying(10),
    "attachments" "text"[],
    "location" "text",
    "attendees" "text"[],
    "tags" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" bigint,
    "deleted_at" timestamp with time zone,
    "related_task_id" bigint,
    "sample_status" "public"."sample_status",
    "due_date" "date",
    "reminder_date" "date",
    "completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "priority" "public"."priority_level" DEFAULT 'medium'::"public"."priority_level",
    "sales_id" bigint,
    "snooze_until" timestamp with time zone,
    "overdue_notified_at" timestamp with time zone,
    "updated_by" bigint,
    CONSTRAINT "activities_sentiment_check" CHECK ((("sentiment")::"text" = ANY (ARRAY[('positive'::character varying)::"text", ('neutral'::character varying)::"text", ('negative'::character varying)::"text"]))),
    CONSTRAINT "check_has_contact_or_org" CHECK ((("activity_type" = 'task'::"public"."activity_type") OR ("contact_id" IS NOT NULL) OR ("organization_id" IS NOT NULL))),
    CONSTRAINT "check_task_required_fields" CHECK ((("activity_type" <> 'task'::"public"."activity_type") OR ("sales_id" IS NOT NULL)))
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


COMMENT ON TABLE "public"."activities" IS 'RLS hardened: User/role-based access. Creator, assignee (tasks), or admin/manager.';



COMMENT ON COLUMN "public"."activities"."deleted_at" IS 'Soft-delete timestamp.
NULL = active record, NOT NULL = deleted record.
Enables recovery from accidental deletes.';



COMMENT ON COLUMN "public"."activities"."related_task_id" IS 'Links to the task (activity) that spawned this logged activity (for follow-up tracking)';



COMMENT ON COLUMN "public"."activities"."sample_status" IS 'Status of sample activities. Required when type=sample. Values: sent, received, feedback_pending, feedback_received';



COMMENT ON COLUMN "public"."activities"."due_date" IS 'Target completion date for tasks (NULL for non-task activities)';



COMMENT ON COLUMN "public"."activities"."reminder_date" IS 'Optional reminder date for tasks (NULL for non-task activities)';



COMMENT ON COLUMN "public"."activities"."completed" IS 'Task completion status (false for non-task activities)';



COMMENT ON COLUMN "public"."activities"."completed_at" IS 'Timestamp when task was completed (NULL for incomplete or non-task activities)';



COMMENT ON COLUMN "public"."activities"."priority" IS 'Task priority level: low, medium, high, critical (medium for non-task activities)';



COMMENT ON COLUMN "public"."activities"."sales_id" IS 'Sales rep assigned to this task (NULL for non-task activities)';



COMMENT ON COLUMN "public"."activities"."snooze_until" IS 'Snooze timestamp - task hidden until this date passes (NULL = active)';



COMMENT ON COLUMN "public"."activities"."overdue_notified_at" IS 'When overdue notification was sent (prevents duplicate notifications)';



COMMENT ON CONSTRAINT "check_has_contact_or_org" ON "public"."activities" IS 'Non-task activities require at least one of contact_id or organization_id. Tasks are exempt (may only have opportunity_id).';



CREATE SEQUENCE IF NOT EXISTS "public"."activities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."activities_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."activities_id_seq" OWNED BY "public"."activities"."id";



CREATE TABLE IF NOT EXISTS "public"."contacts" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "email" "jsonb" DEFAULT '[]'::"jsonb",
    "phone" "jsonb" DEFAULT '[]'::"jsonb",
    "title" "text",
    "department" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "country" "text" DEFAULT 'USA'::"text",
    "birthday" "date",
    "linkedin_url" "text",
    "twitter_handle" "text",
    "notes" "text",
    "sales_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" bigint,
    "deleted_at" timestamp with time zone,
    "search_tsv" "tsvector",
    "first_seen" timestamp with time zone DEFAULT "now"(),
    "last_seen" timestamp with time zone DEFAULT "now"(),
    "gender" "text",
    "tags" bigint[] DEFAULT '{}'::bigint[],
    "organization_id" bigint NOT NULL,
    "updated_by" bigint,
    "status" "text" DEFAULT 'cold'::"text",
    "district_code" "text",
    "territory_name" "text",
    "manager_id" bigint,
    CONSTRAINT "contacts_no_self_manager" CHECK (("id" IS DISTINCT FROM "manager_id"))
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


COMMENT ON TABLE "public"."contacts" IS 'Customer contacts linked to organizations. RLS: Role-based access - admin/manager see all, rep sees own records. Updated 2026-01-18 for role-based access control feature.';



COMMENT ON COLUMN "public"."contacts"."created_by" IS 'Sales rep who created this contact. Auto-populated on INSERT.';



COMMENT ON COLUMN "public"."contacts"."deleted_at" IS 'Soft-delete timestamp.
NULL = active record, NOT NULL = deleted record.
Enables recovery from accidental deletes.
Filtered in application queries: WHERE deleted_at IS NULL';



COMMENT ON COLUMN "public"."contacts"."organization_id" IS 'Primary organization for this contact. Required - contacts cannot exist without an organization (enforced NOT NULL).';



COMMENT ON COLUMN "public"."contacts"."updated_by" IS 'Sales rep who last updated this contact. Auto-populated by trigger.';



COMMENT ON COLUMN "public"."contacts"."status" IS 'Contact engagement level: cold (dormant), warm (engaged), hot (ready), in-contract (closed)';



COMMENT ON COLUMN "public"."contacts"."district_code" IS 'District: D1, D73, etc.';



COMMENT ON COLUMN "public"."contacts"."territory_name" IS 'Territory: Western Suburbs';



COMMENT ON COLUMN "public"."contacts"."manager_id" IS 'Self-referential FK for reporting hierarchy';



COMMENT ON CONSTRAINT "contacts_no_self_manager" ON "public"."contacts" IS 'Prevents circular reference where contact manages themselves - P0-DAT-1 fix';



CREATE TABLE IF NOT EXISTS "public"."opportunities" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "stage" "public"."opportunity_stage" DEFAULT 'new_lead'::"public"."opportunity_stage",
    "status" "public"."opportunity_status" DEFAULT 'active'::"public"."opportunity_status",
    "priority" "public"."priority_level" DEFAULT 'medium'::"public"."priority_level",
    "index" integer,
    "estimated_close_date" "date" DEFAULT (CURRENT_DATE + '90 days'::interval),
    "actual_close_date" "date",
    "customer_organization_id" bigint NOT NULL,
    "principal_organization_id" bigint NOT NULL,
    "distributor_organization_id" bigint,
    "founding_interaction_id" bigint,
    "stage_manual" boolean DEFAULT false,
    "status_manual" boolean DEFAULT false,
    "next_action" "text",
    "next_action_date" "date",
    "competition" "text",
    "decision_criteria" "text",
    "contact_ids" bigint[] DEFAULT '{}'::bigint[],
    "opportunity_owner_id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" bigint,
    "deleted_at" timestamp with time zone,
    "search_tsv" "tsvector",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "account_manager_id" bigint,
    "lead_source" "text",
    "updated_by" bigint,
    "campaign" "text",
    "related_opportunity_id" bigint,
    "notes" "text",
    "stage_changed_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "win_reason" "public"."win_reason",
    "loss_reason" "public"."loss_reason",
    "close_reason_notes" "text",
    "version" integer DEFAULT 1 NOT NULL,
    "primary_contact_id" bigint,
    CONSTRAINT "no_self_related_opportunity" CHECK ((("id" <> "related_opportunity_id") OR ("related_opportunity_id" IS NULL))),
    CONSTRAINT "opportunities_close_reason_notes_length" CHECK ((("close_reason_notes" IS NULL) OR ("length"("close_reason_notes") <= 500))),
    CONSTRAINT "opportunities_closed_lost_check" CHECK ((("stage" <> 'closed_lost'::"public"."opportunity_stage") OR ("loss_reason" IS NOT NULL))),
    CONSTRAINT "opportunities_closed_won_check" CHECK ((("stage" <> 'closed_won'::"public"."opportunity_stage") OR ("win_reason" IS NOT NULL))),
    CONSTRAINT "opportunities_lead_source_check" CHECK ((("lead_source" IS NULL) OR ("lead_source" = ANY (ARRAY['referral'::"text", 'trade_show'::"text", 'website'::"text", 'cold_call'::"text", 'email_campaign'::"text", 'social_media'::"text", 'existing_customer'::"text", 'partner'::"text"]))))
);


ALTER TABLE "public"."opportunities" OWNER TO "postgres";


COMMENT ON TABLE "public"."opportunities" IS 'Sales opportunities with dual ownership (owner + account manager). RLS: Role-based access - admin/manager see all, rep sees own opportunities. Updated 2026-01-18 for role-based access control feature.';



COMMENT ON COLUMN "public"."opportunities"."customer_organization_id" IS 'Required: The customer organization for this opportunity. Every opportunity must have exactly one customer (Q12).';



COMMENT ON COLUMN "public"."opportunities"."principal_organization_id" IS 'Required: The principal (manufacturer) this opportunity is for. MFB business rule: every opportunity represents a specific principal''s products.';



COMMENT ON COLUMN "public"."opportunities"."opportunity_owner_id" IS 'Required: Sales rep who owns this deal. Cannot be NULL - every opportunity must have an owner.';



COMMENT ON COLUMN "public"."opportunities"."created_by" IS 'Sales rep who created this opportunity. Auto-populated on INSERT.';



COMMENT ON COLUMN "public"."opportunities"."deleted_at" IS 'Soft-delete timestamp.
NULL = active record, NOT NULL = deleted record.
Enables recovery from accidental deletes.';



COMMENT ON COLUMN "public"."opportunities"."tags" IS 'Array of tags for categorizing opportunities (e.g., urgent, big-deal, repeat-customer)';



COMMENT ON COLUMN "public"."opportunities"."account_manager_id" IS 'Foreign key to sales.id (bigint), references the account manager for this opportunity';



COMMENT ON COLUMN "public"."opportunities"."lead_source" IS 'Source of the lead. Valid values: referral, trade_show, website, cold_call, email_campaign, social_media, existing_customer, partner';



COMMENT ON COLUMN "public"."opportunities"."updated_by" IS 'Sales rep who last updated this opportunity. Auto-populated by trigger.';



COMMENT ON COLUMN "public"."opportunities"."campaign" IS 'Campaign name for grouping related opportunities from same marketing event or sales initiative. Example: "Winter Fancy Food Show 2025"';



COMMENT ON COLUMN "public"."opportunities"."related_opportunity_id" IS 'Optional reference to parent opportunity for follow-up tracking. Example: Initial trade show contact -> Follow-up sampling visit';



COMMENT ON COLUMN "public"."opportunities"."notes" IS 'General notes about the opportunity. Separate from activity log for quick reference information. Example: "Customer requested sample products"';



COMMENT ON COLUMN "public"."opportunities"."stage_changed_at" IS 'Timestamp when the opportunity stage was last changed. Automatically updated by trigger when stage field changes. Used for identifying stuck opportunities (30+ days in same stage).';



COMMENT ON COLUMN "public"."opportunities"."win_reason" IS 'Required when stage = closed_won. Per PRD Section 5.3, MVP #12.';



COMMENT ON COLUMN "public"."opportunities"."loss_reason" IS 'Required when stage = closed_lost. Per PRD Section 5.3, MVP #12.';



COMMENT ON COLUMN "public"."opportunities"."close_reason_notes" IS 'Required when win_reason or loss_reason = other. Max 500 chars.';



COMMENT ON COLUMN "public"."opportunities"."version" IS 'Optimistic locking version - increments on each update. Used to detect concurrent edit conflicts and prevent silent data loss.';



COMMENT ON CONSTRAINT "no_self_related_opportunity" ON "public"."opportunities" IS 'Business rule: Opportunity cannot be related to itself';



COMMENT ON CONSTRAINT "opportunities_closed_lost_check" ON "public"."opportunities" IS 'Business rule: closed_lost stage requires loss_reason. Per PRD Section 5.3, MVP #12.';



COMMENT ON CONSTRAINT "opportunities_closed_won_check" ON "public"."opportunities" IS 'Business rule: closed_won stage requires win_reason. Per PRD Section 5.3, MVP #12.';



CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "priority" character varying(1) DEFAULT 'C'::character varying,
    "website" "text",
    "address" "text",
    "city" "text",
    "state" "text",
    "postal_code" "text",
    "phone" "text",
    "email" "text",
    "logo_url" "text",
    "linkedin_url" "text",
    "employee_count" integer,
    "founded_year" integer,
    "notes" "text",
    "sales_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" bigint,
    "deleted_at" timestamp with time zone,
    "import_session_id" "uuid",
    "search_tsv" "tsvector",
    "context_links" "jsonb",
    "description" "text",
    "tax_identifier" "text",
    "segment_id" "uuid" NOT NULL,
    "updated_by" bigint,
    "parent_organization_id" bigint,
    "playbook_category_id" "uuid",
    "cuisine" "text",
    "needs_review" "text",
    "organization_type" "public"."organization_type" DEFAULT 'prospect'::"public"."organization_type",
    "org_scope" "text",
    "is_operating_entity" boolean DEFAULT true,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "status_reason" "text",
    "billing_street" "text",
    "billing_city" "text",
    "billing_state" "text",
    "billing_postal_code" "text",
    "billing_country" "text" DEFAULT 'US'::"text",
    "shipping_street" "text",
    "shipping_city" "text",
    "shipping_state" "text",
    "shipping_postal_code" "text",
    "shipping_country" "text" DEFAULT 'US'::"text",
    "payment_terms" "text",
    "credit_limit" numeric(12,2),
    "territory" "text",
    "tags" bigint[] DEFAULT '{}'::bigint[],
    CONSTRAINT "chk_org_address_length" CHECK ((("address" IS NULL) OR ("char_length"("address") <= 500))),
    CONSTRAINT "chk_org_billing_city_length" CHECK ((("billing_city" IS NULL) OR ("char_length"("billing_city") <= 100))),
    CONSTRAINT "chk_org_billing_country_length" CHECK ((("billing_country" IS NULL) OR ("char_length"("billing_country") <= 2))),
    CONSTRAINT "chk_org_billing_postal_code_length" CHECK ((("billing_postal_code" IS NULL) OR ("char_length"("billing_postal_code") <= 20))),
    CONSTRAINT "chk_org_billing_state_length" CHECK ((("billing_state" IS NULL) OR ("char_length"("billing_state") <= 2))),
    CONSTRAINT "chk_org_billing_street_length" CHECK ((("billing_street" IS NULL) OR ("char_length"("billing_street") <= 255))),
    CONSTRAINT "chk_org_city_length" CHECK ((("city" IS NULL) OR ("char_length"("city") <= 100))),
    CONSTRAINT "chk_org_cuisine_length" CHECK ((("cuisine" IS NULL) OR ("char_length"("cuisine") <= 100))),
    CONSTRAINT "chk_org_description_length" CHECK ((("description" IS NULL) OR ("char_length"("description") <= 5000))),
    CONSTRAINT "chk_org_email_length" CHECK ((("email" IS NULL) OR ("char_length"("email") <= 254))),
    CONSTRAINT "chk_org_linkedin_url_length" CHECK ((("linkedin_url" IS NULL) OR ("char_length"("linkedin_url") <= 2048))),
    CONSTRAINT "chk_org_logo_url_length" CHECK ((("logo_url" IS NULL) OR ("char_length"("logo_url") <= 2048))),
    CONSTRAINT "chk_org_name_length" CHECK (("char_length"("name") <= 255)),
    CONSTRAINT "chk_org_notes_length" CHECK ((("notes" IS NULL) OR ("char_length"("notes") <= 5000))),
    CONSTRAINT "chk_org_phone_length" CHECK ((("phone" IS NULL) OR ("char_length"("phone") <= 30))),
    CONSTRAINT "chk_org_postal_code_length" CHECK ((("postal_code" IS NULL) OR ("char_length"("postal_code") <= 20))),
    CONSTRAINT "chk_org_shipping_city_length" CHECK ((("shipping_city" IS NULL) OR ("char_length"("shipping_city") <= 100))),
    CONSTRAINT "chk_org_shipping_country_length" CHECK ((("shipping_country" IS NULL) OR ("char_length"("shipping_country") <= 2))),
    CONSTRAINT "chk_org_shipping_postal_code_length" CHECK ((("shipping_postal_code" IS NULL) OR ("char_length"("shipping_postal_code") <= 20))),
    CONSTRAINT "chk_org_shipping_state_length" CHECK ((("shipping_state" IS NULL) OR ("char_length"("shipping_state") <= 2))),
    CONSTRAINT "chk_org_shipping_street_length" CHECK ((("shipping_street" IS NULL) OR ("char_length"("shipping_street") <= 255))),
    CONSTRAINT "chk_org_state_length" CHECK ((("state" IS NULL) OR ("char_length"("state") <= 100))),
    CONSTRAINT "chk_org_tax_identifier_length" CHECK ((("tax_identifier" IS NULL) OR ("char_length"("tax_identifier") <= 50))),
    CONSTRAINT "chk_org_territory_length" CHECK ((("territory" IS NULL) OR ("char_length"("territory") <= 100))),
    CONSTRAINT "chk_org_website_length" CHECK ((("website" IS NULL) OR ("char_length"("website") <= 2048))),
    CONSTRAINT "organizations_no_self_parent" CHECK (("id" IS DISTINCT FROM "parent_organization_id")),
    CONSTRAINT "organizations_org_scope_check" CHECK (("org_scope" = ANY (ARRAY['national'::"text", 'regional'::"text", 'local'::"text"]))),
    CONSTRAINT "organizations_payment_terms_check" CHECK (("payment_terms" = ANY (ARRAY['net_30'::"text", 'net_60'::"text", 'net_90'::"text", 'cod'::"text", 'prepaid'::"text", '2_10_net_30'::"text"]))),
    CONSTRAINT "organizations_priority_check" CHECK ((("priority")::"text" = ANY (ARRAY[('A'::character varying)::"text", ('B'::character varying)::"text", ('C'::character varying)::"text", ('D'::character varying)::"text"]))),
    CONSTRAINT "organizations_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text"]))),
    CONSTRAINT "organizations_status_reason_check" CHECK (("status_reason" = ANY (ARRAY['active_customer'::"text", 'prospect'::"text", 'authorized_distributor'::"text", 'account_closed'::"text", 'out_of_business'::"text", 'disqualified'::"text"])))
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


COMMENT ON TABLE "public"."organizations" IS 'Organizations table with hierarchy support. RLS: Role-based access - admin/manager see all, rep sees own records. Updated 2026-01-18 for role-based access control feature.';



COMMENT ON COLUMN "public"."organizations"."name" IS 'Organization name. Duplicates allowed with warning dialog on create. Case-insensitive matching for duplicate detection.';



COMMENT ON COLUMN "public"."organizations"."created_by" IS 'Sales rep who created this organization. Auto-populated on INSERT.';



COMMENT ON COLUMN "public"."organizations"."deleted_at" IS 'Soft-delete timestamp.
NULL = active record, NOT NULL = deleted record.
Enables recovery from accidental deletes.';



COMMENT ON COLUMN "public"."organizations"."context_links" IS 'Array of related URLs or references stored as JSONB';



COMMENT ON COLUMN "public"."organizations"."description" IS 'Organization description or notes';



COMMENT ON COLUMN "public"."organizations"."tax_identifier" IS 'Tax identification number (EIN, VAT, etc.)';



COMMENT ON COLUMN "public"."organizations"."segment_id" IS 'Required: Playbook category segment (operator type). Must reference segments.id. Trigger auto-fills with Unknown segment if NULL on INSERT.';



COMMENT ON COLUMN "public"."organizations"."updated_by" IS 'Sales rep who last updated this organization. Auto-populated by trigger.';



COMMENT ON COLUMN "public"."organizations"."parent_organization_id" IS 'Reference to parent organization for hierarchical relationships';



COMMENT ON COLUMN "public"."organizations"."playbook_category_id" IS 'Reference to playbook category segment for this organization';



COMMENT ON COLUMN "public"."organizations"."cuisine" IS 'Cuisine type for restaurant/operator organizations';



COMMENT ON COLUMN "public"."organizations"."needs_review" IS 'Flag indicating organization needs manual review, with reason';



COMMENT ON COLUMN "public"."organizations"."org_scope" IS 'Geographic scope: national, regional, or local';



COMMENT ON COLUMN "public"."organizations"."is_operating_entity" IS 'TRUE = transact here, FALSE = brand/grouping only';



COMMENT ON COLUMN "public"."organizations"."status" IS 'Active/inactive state';



COMMENT ON COLUMN "public"."organizations"."status_reason" IS 'Why this status';



COMMENT ON COLUMN "public"."organizations"."payment_terms" IS 'Standard payment terms for this organization';



COMMENT ON COLUMN "public"."organizations"."credit_limit" IS 'Credit limit in USD';



COMMENT ON COLUMN "public"."organizations"."territory" IS 'Sales territory assignment';



COMMENT ON CONSTRAINT "organizations_no_self_parent" ON "public"."organizations" IS 'Prevents circular reference where organization is its own parent - mirrors contacts_no_self_manager pattern';



CREATE OR REPLACE VIEW "public"."activities_summary" WITH ("security_invoker"='true') AS
 SELECT "a"."id",
    "a"."type",
    "a"."subject",
    "a"."description",
    "a"."activity_date",
    "a"."duration_minutes",
    "a"."contact_id",
    "a"."organization_id",
    "a"."opportunity_id",
    "a"."follow_up_required",
    "a"."follow_up_date",
    "a"."outcome",
    "a"."created_at",
    "a"."updated_at",
    "a"."created_by",
    "a"."updated_by",
    "a"."deleted_at",
    "a"."activity_type",
    "a"."due_date",
    "a"."reminder_date",
    "a"."completed",
    "a"."completed_at",
    "a"."priority",
    "a"."sales_id",
    "a"."snooze_until",
    "a"."overdue_notified_at",
    "a"."related_task_id",
    "s"."first_name" AS "creator_first_name",
    "s"."last_name" AS "creator_last_name",
    "s"."email" AS "creator_email",
    "s"."avatar_url" AS "creator_avatar_url",
    (("c"."first_name" || ' '::"text") || COALESCE("c"."last_name", ''::"text")) AS "contact_name",
    "o"."name" AS "organization_name",
    "opp"."name" AS "opportunity_name"
   FROM (((("public"."activities" "a"
     LEFT JOIN "public"."sales" "s" ON ((("a"."created_by" = "s"."id") AND ("s"."deleted_at" IS NULL))))
     LEFT JOIN "public"."contacts" "c" ON ((("a"."contact_id" = "c"."id") AND ("c"."deleted_at" IS NULL))))
     LEFT JOIN "public"."organizations" "o" ON ((("a"."organization_id" = "o"."id") AND ("o"."deleted_at" IS NULL))))
     LEFT JOIN "public"."opportunities" "opp" ON ((("a"."opportunity_id" = "opp"."id") AND ("opp"."deleted_at" IS NULL))))
  WHERE ("a"."deleted_at" IS NULL);


ALTER VIEW "public"."activities_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."activities_summary" IS 'Activities view with pre-joined creator and related entity data. Includes updated_by for audit trail compatibility.';



CREATE OR REPLACE VIEW "public"."activities_with_task_details" WITH ("security_invoker"='true') AS
 SELECT "id",
    "activity_type",
    "type",
    "subject",
    "description",
    "activity_date",
    "duration_minutes",
    "contact_id",
    "organization_id",
    "opportunity_id",
    "follow_up_required",
    "follow_up_date",
    "follow_up_notes",
    "outcome",
    "sentiment",
    "attachments",
    "location",
    "attendees",
    "tags",
    "created_at",
    "updated_at",
    "created_by",
    "deleted_at",
    "related_task_id",
    "sample_status",
    "due_date",
    "reminder_date",
    "completed",
    "completed_at",
    "priority",
    "sales_id",
    "snooze_until",
    "overdue_notified_at",
    ("activity_type" = 'task'::"public"."activity_type") AS "is_task",
        CASE
            WHEN ("activity_type" <> 'task'::"public"."activity_type") THEN NULL::"text"
            WHEN "completed" THEN 'completed'::"text"
            WHEN ("due_date" < CURRENT_DATE) THEN 'overdue'::"text"
            WHEN ("snooze_until" > "now"()) THEN 'snoozed'::"text"
            ELSE 'active'::"text"
        END AS "task_status"
   FROM "public"."activities" "a"
  WHERE ("deleted_at" IS NULL);


ALTER VIEW "public"."activities_with_task_details" OWNER TO "postgres";


COMMENT ON VIEW "public"."activities_with_task_details" IS 'Activities with computed task status. Use for API responses needing unified activity/task data.';



CREATE TABLE IF NOT EXISTS "public"."audit_trail" (
    "audit_id" bigint NOT NULL,
    "table_name" "text" NOT NULL,
    "record_id" bigint NOT NULL,
    "field_name" "text" NOT NULL,
    "old_value" "text",
    "new_value" "text",
    "changed_by" bigint,
    "changed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."audit_trail" OWNER TO "postgres";


COMMENT ON TABLE "public"."audit_trail" IS 'Audit log for data changes. SELECT-only via RLS - inserts handled by database triggers and Edge Functions.';



ALTER TABLE "public"."audit_trail" ALTER COLUMN "audit_id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."audit_trail_audit_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."distributor_principal_authorizations" (
    "id" bigint NOT NULL,
    "distributor_id" bigint NOT NULL,
    "principal_id" bigint NOT NULL,
    "is_authorized" boolean DEFAULT true NOT NULL,
    "authorization_date" "date" DEFAULT CURRENT_DATE,
    "expiration_date" "date",
    "territory_restrictions" "text"[],
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" bigint,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "no_self_authorization" CHECK (("distributor_id" <> "principal_id")),
    CONSTRAINT "valid_authorization_dates" CHECK ((("expiration_date" IS NULL) OR ("expiration_date" > "authorization_date")))
);


ALTER TABLE "public"."distributor_principal_authorizations" OWNER TO "postgres";


COMMENT ON TABLE "public"."distributor_principal_authorizations" IS 'Tracks which principals (food manufacturers) are authorized to sell through which distributors.';



CREATE OR REPLACE VIEW "public"."authorization_status" WITH ("security_invoker"='on') AS
 SELECT "dpa"."id" AS "authorization_id",
    "dpa"."distributor_id",
    "d"."name" AS "distributor_name",
    ("d"."organization_type" = 'distributor'::"public"."organization_type") AS "is_distributor",
    "dpa"."principal_id",
    "p"."name" AS "principal_name",
    ("p"."organization_type" = 'principal'::"public"."organization_type") AS "is_principal",
    "dpa"."is_authorized",
    "dpa"."authorization_date",
    "dpa"."expiration_date",
    "dpa"."territory_restrictions",
    "dpa"."notes",
        CASE
            WHEN ("dpa"."is_authorized" = false) THEN false
            WHEN ("dpa"."deleted_at" IS NOT NULL) THEN false
            WHEN (("dpa"."expiration_date" IS NOT NULL) AND ("dpa"."expiration_date" < CURRENT_DATE)) THEN false
            ELSE true
        END AS "is_currently_valid",
    "dpa"."created_at",
    "dpa"."updated_at",
    "dpa"."deleted_at"
   FROM (("public"."distributor_principal_authorizations" "dpa"
     LEFT JOIN "public"."organizations" "d" ON (("dpa"."distributor_id" = "d"."id")))
     LEFT JOIN "public"."organizations" "p" ON (("dpa"."principal_id" = "p"."id")))
  WHERE ("dpa"."deleted_at" IS NULL);


ALTER VIEW "public"."authorization_status" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."campaign_choices" WITH ("security_invoker"='on') AS
 SELECT "campaign" AS "id",
    "campaign" AS "name",
    "count"(*) AS "opportunity_count"
   FROM "public"."opportunities"
  WHERE (("campaign" IS NOT NULL) AND ("campaign" <> ''::"text") AND ("deleted_at" IS NULL))
  GROUP BY "campaign"
  ORDER BY "campaign";


ALTER VIEW "public"."campaign_choices" OWNER TO "postgres";


COMMENT ON VIEW "public"."campaign_choices" IS 'Distinct campaign values from opportunities for filter dropdowns. SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';



CREATE TABLE IF NOT EXISTS "public"."contact_notes" (
    "id" bigint NOT NULL,
    "contact_id" bigint NOT NULL,
    "text" "text" NOT NULL,
    "sales_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" bigint,
    "created_by" bigint DEFAULT "public"."get_current_sales_id"(),
    "deleted_at" timestamp with time zone,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."contact_notes" OWNER TO "postgres";


COMMENT ON TABLE "public"."contact_notes" IS 'Notes attached to contacts. Renamed from contactNotes per P3 audit (2025-11-29)';



COMMENT ON COLUMN "public"."contact_notes"."date" IS 'User-specified date/time for the note, separate from system-managed created_at';



COMMENT ON COLUMN "public"."contact_notes"."updated_by" IS 'Sales rep who last updated this contact note. Auto-populated by trigger.';



COMMENT ON COLUMN "public"."contact_notes"."created_by" IS 'Sales rep who created this note. Auto-populated on INSERT.';



COMMENT ON COLUMN "public"."contact_notes"."deleted_at" IS 'Soft delete timestamp (Constitution: soft-deletes rule)';



COMMENT ON COLUMN "public"."contact_notes"."attachments" IS 'JSONB array of attachment metadata: [{ src, title, type?, size? }]';



CREATE OR REPLACE VIEW "public"."contactNotes" WITH ("security_invoker"='true') AS
 SELECT "id",
    "contact_id",
    "text",
    "sales_id",
    "created_at",
    "updated_at",
    "date",
    "updated_by",
    "created_by",
    "deleted_at",
    "attachments"
   FROM "public"."contact_notes";


ALTER VIEW "public"."contactNotes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."contactNotes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."contactNotes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."contactNotes_id_seq" OWNED BY "public"."contact_notes"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."contacts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."contacts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."contacts_id_seq" OWNED BY "public"."contacts"."id";



CREATE OR REPLACE VIEW "public"."contacts_summary" WITH ("security_invoker"='true') AS
 SELECT "c"."id",
    "c"."name",
    "c"."first_name",
    "c"."last_name",
    "c"."email",
    "c"."phone",
    "c"."title",
    "c"."department",
    "c"."address",
    "c"."city",
    "c"."state",
    "c"."postal_code",
    "c"."country",
    "c"."birthday",
    "c"."linkedin_url",
    "c"."twitter_handle",
    "c"."notes",
    "c"."sales_id",
    "c"."created_at",
    "c"."updated_at",
    "c"."created_by",
    "c"."deleted_at",
    "c"."search_tsv",
    "c"."first_seen",
    "c"."last_seen",
    "c"."gender",
    "c"."tags",
    "c"."organization_id",
    "c"."status",
    "o"."name" AS "company_name",
    COALESCE("notes_count"."cnt", 0) AS "nb_notes",
    COALESCE("tasks_count"."cnt", 0) AS "nb_tasks",
    COALESCE("activities_count"."cnt", 0) AS "nb_activities"
   FROM (((("public"."contacts" "c"
     LEFT JOIN "public"."organizations" "o" ON ((("o"."id" = "c"."organization_id") AND ("o"."deleted_at" IS NULL))))
     LEFT JOIN LATERAL ( SELECT ("count"(*))::integer AS "cnt"
           FROM "public"."contact_notes" "cn"
          WHERE (("cn"."contact_id" = "c"."id") AND ("cn"."deleted_at" IS NULL))) "notes_count" ON (true))
     LEFT JOIN LATERAL ( SELECT ("count"(*))::integer AS "cnt"
           FROM "public"."activities" "a"
          WHERE (("a"."contact_id" = "c"."id") AND ("a"."activity_type" = 'task'::"public"."activity_type") AND ("a"."deleted_at" IS NULL))) "tasks_count" ON (true))
     LEFT JOIN LATERAL ( SELECT ("count"(*))::integer AS "cnt"
           FROM "public"."activities" "a"
          WHERE (("a"."contact_id" = "c"."id") AND ("a"."deleted_at" IS NULL))) "activities_count" ON (true))
  WHERE ("c"."deleted_at" IS NULL);


ALTER VIEW "public"."contacts_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."contacts_summary" IS 'Contact summary with organization name and activity counts. Uses security_invoker to enforce RLS from underlying tables. Includes nb_notes (contact_notes count), nb_tasks (activities with type=task), and nb_activities (all activities count) for UI display. All counts are soft-delete aware (deleted_at IS NULL). Fixed in 20260210000003: nb_tasks now queries activities table instead of deprecated tasks.';



CREATE OR REPLACE VIEW "public"."contacts_with_account_manager" WITH ("security_invoker"='on') AS
 SELECT "c"."id",
    "c"."name",
    "c"."first_name",
    "c"."last_name",
    "c"."email",
    "c"."phone",
    "c"."title",
    "c"."department",
    "c"."address",
    "c"."city",
    "c"."state",
    "c"."postal_code",
    "c"."country",
    "c"."birthday",
    "c"."linkedin_url",
    "c"."twitter_handle",
    "c"."notes",
    "c"."sales_id",
    "c"."created_at",
    "c"."updated_at",
    "c"."created_by",
    "c"."deleted_at",
    "c"."search_tsv",
    "c"."first_seen",
    "c"."last_seen",
    "c"."gender",
    "c"."tags",
    "c"."organization_id",
    "c"."updated_by",
    "c"."status",
    COALESCE(("s"."first_name" || COALESCE((' '::"text" || "s"."last_name"), ''::"text")), 'Unassigned'::"text") AS "account_manager_name",
    ("s"."user_id" IS NOT NULL) AS "account_manager_is_user"
   FROM ("public"."contacts" "c"
     LEFT JOIN "public"."sales" "s" ON (("c"."sales_id" = "s"."id")));


ALTER VIEW "public"."contacts_with_account_manager" OWNER TO "postgres";


COMMENT ON VIEW "public"."contacts_with_account_manager" IS 'Contacts with denormalized account manager name. SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';



CREATE OR REPLACE VIEW "public"."dashboard_pipeline_summary" WITH ("security_invoker"='on') AS
 SELECT "account_manager_id",
    "stage",
    "count"(*) AS "count",
    "count"(
        CASE
            WHEN ((EXTRACT(epoch FROM ("now"() - "created_at")) / (86400)::numeric) >= (30)::numeric) THEN 1
            ELSE NULL::integer
        END) AS "stuck_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."opportunities"
          WHERE (("opportunities"."account_manager_id" = "o"."account_manager_id") AND ("opportunities"."status" = 'active'::"public"."opportunity_status"))) AS "total_active",
    ( SELECT "count"(*) AS "count"
           FROM "public"."opportunities"
          WHERE (("opportunities"."account_manager_id" = "o"."account_manager_id") AND ("opportunities"."status" = 'active'::"public"."opportunity_status") AND ((EXTRACT(epoch FROM ("now"() - "opportunities"."created_at")) / (86400)::numeric) >= (30)::numeric))) AS "total_stuck"
   FROM "public"."opportunities" "o"
  WHERE ("status" = 'active'::"public"."opportunity_status")
  GROUP BY "account_manager_id", "stage";


ALTER VIEW "public"."dashboard_pipeline_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."dashboard_pipeline_summary" IS 'Pipeline summary by account manager and stage. SECURITY: Uses SECURITY INVOKER.';



CREATE OR REPLACE VIEW "public"."dashboard_principal_summary" WITH ("security_invoker"='on') AS
 WITH "principal_opportunities" AS (
         SELECT "o"."principal_organization_id",
            "o"."id" AS "opportunity_id",
            "o"."stage",
            "o"."estimated_close_date",
            "o"."account_manager_id",
            (EXTRACT(epoch FROM ("now"() - "o"."created_at")) / (86400)::numeric) AS "days_in_stage"
           FROM "public"."opportunities" "o"
          WHERE (("o"."status" = 'active'::"public"."opportunity_status") AND ("o"."principal_organization_id" IS NOT NULL))
        ), "principal_activities" AS (
         SELECT "po"."principal_organization_id",
            "count"("a"."id") AS "weekly_activity_count"
           FROM ("principal_opportunities" "po"
             LEFT JOIN "public"."activities" "a" ON ((("a"."opportunity_id" = "po"."opportunity_id") AND ("a"."created_at" >= ("now"() - '7 days'::interval)))))
          GROUP BY "po"."principal_organization_id"
        ), "principal_reps" AS (
         SELECT "po"."principal_organization_id",
            "array_agg"(DISTINCT (("s"."first_name" || ' '::"text") || "s"."last_name") ORDER BY (("s"."first_name" || ' '::"text") || "s"."last_name")) AS "assigned_reps"
           FROM ("principal_opportunities" "po"
             JOIN "public"."sales" "s" ON (("s"."id" = "po"."account_manager_id")))
          GROUP BY "po"."principal_organization_id"
        ), "principal_aggregates" AS (
         SELECT "po"."principal_organization_id",
            "count"(DISTINCT "po"."opportunity_id") AS "opportunity_count",
            "max"("po"."days_in_stage") AS "max_days_in_stage",
            "bool_or"(("po"."days_in_stage" > (14)::numeric)) AS "is_stuck",
            "max"("a"."created_at") AS "last_activity_date",
            ( SELECT "a2"."type"
                   FROM ("public"."activities" "a2"
                     JOIN "principal_opportunities" "po2" ON ((("a2"."opportunity_id" = "po2"."opportunity_id") AND ("po2"."principal_organization_id" = "po"."principal_organization_id"))))
                  ORDER BY "a2"."created_at" DESC
                 LIMIT 1) AS "last_activity_type",
            (EXTRACT(epoch FROM ("now"() - "max"("a"."created_at"))) / (86400)::numeric) AS "days_since_last_activity"
           FROM ("principal_opportunities" "po"
             LEFT JOIN "public"."activities" "a" ON (("a"."opportunity_id" = "po"."opportunity_id")))
          GROUP BY "po"."principal_organization_id"
        )
 SELECT "org"."id",
    "org"."name" AS "principal_name",
    "pa"."opportunity_count",
    COALESCE("pact"."weekly_activity_count", (0)::bigint) AS "weekly_activity_count",
    COALESCE("prep"."assigned_reps", ARRAY[]::"text"[]) AS "assigned_reps",
    "pa"."last_activity_date",
    "pa"."last_activity_type",
    "pa"."days_since_last_activity",
        CASE
            WHEN ("pa"."days_since_last_activity" IS NULL) THEN 'urgent'::"text"
            WHEN ("pa"."days_since_last_activity" > (7)::numeric) THEN 'urgent'::"text"
            WHEN ("pa"."days_since_last_activity" > (3)::numeric) THEN 'warning'::"text"
            ELSE 'good'::"text"
        END AS "status_indicator",
    "pa"."max_days_in_stage",
    "pa"."is_stuck",
    NULL::"text" AS "next_action",
    (((COALESCE("pa"."days_since_last_activity", (30)::numeric) * (2)::numeric) + (
        CASE
            WHEN "pa"."is_stuck" THEN 50
            ELSE 0
        END)::numeric) - (("pa"."opportunity_count")::numeric * 0.5)) AS "priority_score"
   FROM ((("public"."organizations" "org"
     JOIN "principal_aggregates" "pa" ON (("pa"."principal_organization_id" = "org"."id")))
     LEFT JOIN "principal_activities" "pact" ON (("pact"."principal_organization_id" = "org"."id")))
     LEFT JOIN "principal_reps" "prep" ON (("prep"."principal_organization_id" = "org"."id")))
  WHERE ("org"."organization_type" = 'principal'::"public"."organization_type")
  ORDER BY (((COALESCE("pa"."days_since_last_activity", (30)::numeric) * (2)::numeric) + (
        CASE
            WHEN "pa"."is_stuck" THEN 50
            ELSE 0
        END)::numeric) - (("pa"."opportunity_count")::numeric * 0.5));


ALTER VIEW "public"."dashboard_principal_summary" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."dashboard_snapshots" (
    "id" bigint NOT NULL,
    "snapshot_date" "date" NOT NULL,
    "sales_id" bigint NOT NULL,
    "activities_count" integer DEFAULT 0 NOT NULL,
    "tasks_completed_count" integer DEFAULT 0 NOT NULL,
    "deals_moved_count" integer DEFAULT 0 NOT NULL,
    "open_opportunities_count" integer DEFAULT 0 NOT NULL,
    "total_opportunities_count" integer DEFAULT 0 NOT NULL,
    "overdue_tasks_count" integer DEFAULT 0 NOT NULL,
    "activities_this_week_count" integer DEFAULT 0 NOT NULL,
    "stale_deals_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."dashboard_snapshots" OWNER TO "postgres";


COMMENT ON TABLE "public"."dashboard_snapshots" IS 'Pre-computed dashboard metrics. SELECT-only via RLS - inserts handled by scheduled Edge Functions.';



COMMENT ON COLUMN "public"."dashboard_snapshots"."snapshot_date" IS 'Date of snapshot (stored as date, not timestamp, for easy weekly aggregation)';



COMMENT ON COLUMN "public"."dashboard_snapshots"."activities_count" IS 'Number of activities logged by user during the week ending on snapshot_date';



COMMENT ON COLUMN "public"."dashboard_snapshots"."tasks_completed_count" IS 'Number of tasks completed by user during the week ending on snapshot_date';



COMMENT ON COLUMN "public"."dashboard_snapshots"."deals_moved_count" IS 'Number of opportunities with stage changes during the week ending on snapshot_date';



COMMENT ON COLUMN "public"."dashboard_snapshots"."open_opportunities_count" IS 'Count of open opportunities owned by user at snapshot_date';



COMMENT ON COLUMN "public"."dashboard_snapshots"."total_opportunities_count" IS 'Total count of all opportunities (for KPI dashboard) at snapshot_date';



COMMENT ON COLUMN "public"."dashboard_snapshots"."overdue_tasks_count" IS 'Count of overdue tasks for user at snapshot_date';



COMMENT ON COLUMN "public"."dashboard_snapshots"."activities_this_week_count" IS 'Activities logged in the current week (rolling 7-day window) at snapshot_date';



COMMENT ON COLUMN "public"."dashboard_snapshots"."stale_deals_count" IS 'Count of stale deals based on stage-specific thresholds at snapshot_date';



CREATE SEQUENCE IF NOT EXISTS "public"."dashboard_snapshots_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."dashboard_snapshots_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."dashboard_snapshots_id_seq" OWNED BY "public"."dashboard_snapshots"."id";



CREATE OR REPLACE VIEW "public"."distinct_opportunities_campaigns" WITH ("security_invoker"='on') AS
 SELECT DISTINCT "campaign" AS "id",
    "campaign" AS "name"
   FROM "public"."opportunities"
  WHERE (("campaign" IS NOT NULL) AND ("deleted_at" IS NULL))
  ORDER BY "campaign";


ALTER VIEW "public"."distinct_opportunities_campaigns" OWNER TO "postgres";


COMMENT ON VIEW "public"."distinct_opportunities_campaigns" IS 'Returns unique opportunity campaigns for filter UI - P0 performance fix';



CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" bigint NOT NULL,
    "principal_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "status" "public"."product_status" DEFAULT 'active'::"public"."product_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" bigint,
    "updated_by" bigint,
    "deleted_at" timestamp with time zone,
    "search_tsv" "tsvector",
    "manufacturer_part_number" "text",
    "category" "text" NOT NULL,
    CONSTRAINT "category_not_empty" CHECK (("category" <> ''::"text"))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON TABLE "public"."products" IS 'Products catalog. Distributor relationships now managed via product_distributors junction table.';



COMMENT ON COLUMN "public"."products"."created_by" IS 'Sales rep who created this product. Auto-populated on INSERT.';



COMMENT ON COLUMN "public"."products"."updated_by" IS 'Sales rep who last updated this product. Auto-populated by trigger.';



COMMENT ON COLUMN "public"."products"."deleted_at" IS 'Soft-delete timestamp.
NULL = active record, NOT NULL = deleted record.
Enables recovery from accidental deletes.';



CREATE OR REPLACE VIEW "public"."distinct_product_categories" WITH ("security_invoker"='on') AS
 SELECT DISTINCT "category" AS "id",
    "initcap"("replace"("category", '_'::"text", ' '::"text")) AS "name"
   FROM "public"."products"
  WHERE (("category" IS NOT NULL) AND ("deleted_at" IS NULL))
  ORDER BY ("initcap"("replace"("category", '_'::"text", ' '::"text")));


ALTER VIEW "public"."distinct_product_categories" OWNER TO "postgres";


COMMENT ON VIEW "public"."distinct_product_categories" IS 'Returns unique product categories with formatted display names. SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';



ALTER TABLE "public"."distributor_principal_authorizations" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."distributor_principal_authorizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."opportunity_notes" (
    "id" bigint NOT NULL,
    "opportunity_id" bigint NOT NULL,
    "text" "text" NOT NULL,
    "sales_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" bigint,
    "created_by" bigint DEFAULT "public"."get_current_sales_id"(),
    "deleted_at" timestamp with time zone,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."opportunity_notes" OWNER TO "postgres";


COMMENT ON TABLE "public"."opportunity_notes" IS 'Notes attached to opportunities. Renamed from opportunityNotes per P3 audit (2025-11-29)';



COMMENT ON COLUMN "public"."opportunity_notes"."date" IS 'User-specified date/time for the note, separate from system-managed created_at';



COMMENT ON COLUMN "public"."opportunity_notes"."updated_by" IS 'Sales rep who last updated this opportunity note. Auto-populated by trigger.';



COMMENT ON COLUMN "public"."opportunity_notes"."created_by" IS 'Sales rep who created this note. Auto-populated on INSERT.';



COMMENT ON COLUMN "public"."opportunity_notes"."attachments" IS 'JSONB array of attachment metadata: [{ src, title, type?, size? }]';



CREATE TABLE IF NOT EXISTS "public"."organization_notes" (
    "id" bigint NOT NULL,
    "organization_id" bigint NOT NULL,
    "text" "text" NOT NULL,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb",
    "sales_id" bigint,
    "date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "updated_by" bigint
);


ALTER TABLE "public"."organization_notes" OWNER TO "postgres";


COMMENT ON TABLE "public"."organization_notes" IS 'Notes attached to organizations. Renamed from organizationNotes per P3 audit (2025-11-29)';



COMMENT ON COLUMN "public"."organization_notes"."attachments" IS 'JSONB array of attachment metadata: [{ url, filename, size, type }]';



COMMENT ON COLUMN "public"."organization_notes"."date" IS 'User-specified date/time for the note event, separate from system-managed created_at';



COMMENT ON COLUMN "public"."organization_notes"."deleted_at" IS 'Soft delete timestamp - NULL means active, non-NULL means deleted';



COMMENT ON COLUMN "public"."organization_notes"."updated_by" IS 'Sales rep who last modified this note';



CREATE OR REPLACE VIEW "public"."entity_timeline" WITH ("security_invoker"='true') AS
 SELECT "activities"."id",
        CASE
            WHEN ("activities"."activity_type" = 'task'::"public"."activity_type") THEN 'task'::"text"
            ELSE 'activity'::"text"
        END AS "entry_type",
    ("activities"."type")::"text" AS "subtype",
    "activities"."subject" AS "title",
    "activities"."description",
        CASE
            WHEN ("activities"."activity_type" = 'task'::"public"."activity_type") THEN ("activities"."due_date")::timestamp with time zone
            ELSE "activities"."activity_date"
        END AS "entry_date",
    "activities"."contact_id",
    "activities"."organization_id",
    "activities"."opportunity_id",
    "activities"."created_by",
    "activities"."sales_id",
    "activities"."created_at",
    "activities"."completed",
    "activities"."completed_at",
    "activities"."priority"
   FROM "public"."activities"
  WHERE (("activities"."deleted_at" IS NULL) AND (("activities"."activity_type" <> 'task'::"public"."activity_type") OR ("activities"."snooze_until" IS NULL) OR ("activities"."snooze_until" <= "now"())))
UNION ALL
 SELECT ("contact_notes"."id" + 100000000) AS "id",
    'note'::"text" AS "entry_type",
    'contact_note'::"text" AS "subtype",
    "left"("contact_notes"."text", 100) AS "title",
    "contact_notes"."text" AS "description",
    "contact_notes"."date" AS "entry_date",
    "contact_notes"."contact_id",
    NULL::bigint AS "organization_id",
    NULL::bigint AS "opportunity_id",
    "contact_notes"."created_by",
    "contact_notes"."sales_id",
    "contact_notes"."created_at",
    NULL::boolean AS "completed",
    NULL::timestamp with time zone AS "completed_at",
    NULL::"public"."priority_level" AS "priority"
   FROM "public"."contact_notes"
  WHERE ("contact_notes"."deleted_at" IS NULL)
UNION ALL
 SELECT ("organization_notes"."id" + 200000000) AS "id",
    'note'::"text" AS "entry_type",
    'organization_note'::"text" AS "subtype",
    "left"("organization_notes"."text", 100) AS "title",
    "organization_notes"."text" AS "description",
    "organization_notes"."date" AS "entry_date",
    NULL::bigint AS "contact_id",
    "organization_notes"."organization_id",
    NULL::bigint AS "opportunity_id",
    NULL::bigint AS "created_by",
    "organization_notes"."sales_id",
    "organization_notes"."created_at",
    NULL::boolean AS "completed",
    NULL::timestamp with time zone AS "completed_at",
    NULL::"public"."priority_level" AS "priority"
   FROM "public"."organization_notes"
  WHERE ("organization_notes"."deleted_at" IS NULL)
UNION ALL
 SELECT ("opportunity_notes"."id" + 300000000) AS "id",
    'note'::"text" AS "entry_type",
    'opportunity_note'::"text" AS "subtype",
    "left"("opportunity_notes"."text", 100) AS "title",
    "opportunity_notes"."text" AS "description",
    "opportunity_notes"."date" AS "entry_date",
    NULL::bigint AS "contact_id",
    NULL::bigint AS "organization_id",
    "opportunity_notes"."opportunity_id",
    "opportunity_notes"."created_by",
    "opportunity_notes"."sales_id",
    "opportunity_notes"."created_at",
    NULL::boolean AS "completed",
    NULL::timestamp with time zone AS "completed_at",
    NULL::"public"."priority_level" AS "priority"
   FROM "public"."opportunity_notes"
  WHERE ("opportunity_notes"."deleted_at" IS NULL);


ALTER VIEW "public"."entity_timeline" OWNER TO "postgres";


COMMENT ON VIEW "public"."entity_timeline" IS 'Unified timeline from single activities table. entry_type: activity | task.
   Filter by contact_id, organization_id, or opportunity_id.
   Sort by entry_date DESC for chronological view.
   Snoozed tasks excluded until snooze period ends.';



CREATE TABLE IF NOT EXISTS "public"."interaction_participants" (
    "id" bigint NOT NULL,
    "activity_id" bigint NOT NULL,
    "contact_id" bigint,
    "organization_id" bigint,
    "role" character varying(20) DEFAULT 'participant'::character varying,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "created_by" bigint,
    CONSTRAINT "has_contact_or_org" CHECK ((("contact_id" IS NOT NULL) OR ("organization_id" IS NOT NULL)))
);


ALTER TABLE "public"."interaction_participants" OWNER TO "postgres";


COMMENT ON COLUMN "public"."interaction_participants"."deleted_at" IS 'Soft delete timestamp (Constitution: soft-deletes rule)';



COMMENT ON COLUMN "public"."interaction_participants"."created_by" IS 'Sales ID of user who added this participant. Used for ownership-based RLS.';



CREATE SEQUENCE IF NOT EXISTS "public"."interaction_participants_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."interaction_participants_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."interaction_participants_id_seq" OWNED BY "public"."interaction_participants"."id";



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "message" "text" NOT NULL,
    "entity_type" "text",
    "entity_id" bigint,
    "read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    "metadata" "jsonb",
    CONSTRAINT "notifications_entity_type_check" CHECK (("entity_type" = ANY (ARRAY['task'::"text", 'opportunity'::"text", 'contact'::"text", 'organization'::"text", 'product'::"text", 'digest'::"text", NULL::"text"]))),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['task_overdue'::"text", 'task_assigned'::"text", 'mention'::"text", 'opportunity_won'::"text", 'opportunity_lost'::"text", 'system'::"text", 'daily_digest'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'User notifications for overdue tasks and activities.
RLS Policy: Personal access (users see only their own notifications).
Protection: Soft-deletes enabled, automatic cleanup after 30 days.
See /docs/SECURITY_MODEL.md for details.';



COMMENT ON COLUMN "public"."notifications"."type" IS 'Notification type: task_overdue, task_assigned, mention, opportunity_won, opportunity_lost, system';



COMMENT ON COLUMN "public"."notifications"."entity_type" IS 'Related entity type (task, opportunity, contact, organization, product) or NULL for system notifications';



COMMENT ON COLUMN "public"."notifications"."entity_id" IS 'ID of related entity or NULL for system notifications';



COMMENT ON COLUMN "public"."notifications"."deleted_at" IS 'Soft delete timestamp (Constitution: soft-deletes rule)';



ALTER TABLE "public"."notifications" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."notifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE SEQUENCE IF NOT EXISTS "public"."opportunities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."opportunities_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."opportunities_id_seq" OWNED BY "public"."opportunities"."id";



CREATE TABLE IF NOT EXISTS "public"."opportunity_products" (
    "id" bigint NOT NULL,
    "opportunity_id" bigint NOT NULL,
    "product_id_reference" bigint NOT NULL,
    "product_name" "text",
    "product_category" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "created_by" bigint DEFAULT "public"."get_current_sales_id"()
);


ALTER TABLE "public"."opportunity_products" OWNER TO "postgres";


COMMENT ON TABLE "public"."opportunity_products" IS 'Junction table linking opportunities to products.
RLS Policy: Shared access (all authenticated users can view/modify).
Protection: Soft-deletes enabled (deleted_at column).
See /docs/SECURITY_MODEL.md for details.';



COMMENT ON COLUMN "public"."opportunity_products"."deleted_at" IS 'Soft delete timestamp (Constitution: soft-deletes rule)';



COMMENT ON COLUMN "public"."opportunity_products"."created_by" IS 'Sales ID who created this product association (audit trail)';



CREATE OR REPLACE VIEW "public"."opportunities_summary" WITH ("security_invoker"='on') AS
 SELECT "o"."id",
    "o"."name",
    "o"."description",
    "o"."stage",
    "o"."status",
    "o"."priority",
    "o"."index",
    "o"."estimated_close_date",
    "o"."actual_close_date",
    "o"."customer_organization_id",
    "o"."principal_organization_id",
    "o"."distributor_organization_id",
    "o"."founding_interaction_id",
    "o"."stage_manual",
    "o"."status_manual",
    "o"."next_action",
    "o"."next_action_date",
    "o"."competition",
    "o"."decision_criteria",
    "o"."contact_ids",
    "o"."opportunity_owner_id",
    "o"."created_at",
    "o"."updated_at",
    "o"."created_by",
    "o"."deleted_at",
    "o"."search_tsv",
    "o"."tags",
    "o"."account_manager_id",
    "o"."lead_source",
    "o"."updated_by",
    "o"."campaign",
    "o"."related_opportunity_id",
    "o"."primary_contact_id",
    "cust_org"."name" AS "customer_organization_name",
    "prin_org"."name" AS "principal_organization_name",
    "dist_org"."name" AS "distributor_organization_name",
    (("primary_contact"."first_name" || ' '::"text") || "primary_contact"."last_name") AS "primary_contact_name",
    COALESCE(( SELECT "jsonb_agg"("jsonb_build_object"('id', "op"."id", 'product_id_reference', "op"."product_id_reference", 'product_name', "op"."product_name", 'product_category', "op"."product_category", 'principal_name', "prod_org"."name", 'notes', "op"."notes") ORDER BY "op"."created_at") AS "jsonb_agg"
           FROM (("public"."opportunity_products" "op"
             LEFT JOIN "public"."products" "p" ON ((("op"."product_id_reference" = "p"."id") AND ("p"."deleted_at" IS NULL))))
             LEFT JOIN "public"."organizations" "prod_org" ON ((("p"."principal_id" = "prod_org"."id") AND ("prod_org"."deleted_at" IS NULL))))
          WHERE (("op"."opportunity_id" = "o"."id") AND ("op"."deleted_at" IS NULL))), '[]'::"jsonb") AS "products"
   FROM (((("public"."opportunities" "o"
     LEFT JOIN "public"."organizations" "cust_org" ON ((("o"."customer_organization_id" = "cust_org"."id") AND ("cust_org"."deleted_at" IS NULL))))
     LEFT JOIN "public"."organizations" "prin_org" ON ((("o"."principal_organization_id" = "prin_org"."id") AND ("prin_org"."deleted_at" IS NULL))))
     LEFT JOIN "public"."organizations" "dist_org" ON ((("o"."distributor_organization_id" = "dist_org"."id") AND ("dist_org"."deleted_at" IS NULL))))
     LEFT JOIN "public"."contacts" "primary_contact" ON ((("o"."primary_contact_id" = "primary_contact"."id") AND ("primary_contact"."deleted_at" IS NULL))))
  WHERE ("o"."deleted_at" IS NULL);


ALTER VIEW "public"."opportunities_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."opportunities_summary" IS 'Denormalized opportunity view with organization names, primary contact, and products array for efficient reads.
Updated 2026-02-01 (20260201000006): Added soft-delete filtering to products subquery JOINs (products p, organizations prod_org).
Updated 2026-01-25 (20260125190223): Added soft-delete filtering to WHERE clause and all outer JOINs.
SECURITY: Filters deleted opportunities, organizations, contacts, and products at every JOIN.';



CREATE OR REPLACE VIEW "public"."opportunityNotes" WITH ("security_invoker"='true') AS
 SELECT "id",
    "opportunity_id",
    "text",
    "sales_id",
    "created_at",
    "updated_at",
    "date",
    "updated_by",
    "created_by",
    "deleted_at",
    "attachments"
   FROM "public"."opportunity_notes";


ALTER VIEW "public"."opportunityNotes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."opportunityNotes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."opportunityNotes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."opportunityNotes_id_seq" OWNED BY "public"."opportunity_notes"."id";



CREATE TABLE IF NOT EXISTS "public"."opportunity_contacts" (
    "id" bigint NOT NULL,
    "opportunity_id" bigint NOT NULL,
    "contact_id" bigint NOT NULL,
    "role" character varying(50),
    "is_primary" boolean DEFAULT false,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."opportunity_contacts" OWNER TO "postgres";


COMMENT ON TABLE "public"."opportunity_contacts" IS 'RLS FIX 2026-01-26: SELECT policy consolidated - only ownership-based access via opportunity_contacts_select_through_opportunities';



COMMENT ON COLUMN "public"."opportunity_contacts"."id" IS 'Primary key, auto-generated';



COMMENT ON COLUMN "public"."opportunity_contacts"."opportunity_id" IS 'Foreign key to opportunities table';



COMMENT ON COLUMN "public"."opportunity_contacts"."contact_id" IS 'Foreign key to contacts table';



COMMENT ON COLUMN "public"."opportunity_contacts"."role" IS 'Role of the contact in the opportunity (e.g., decision maker, influencer, end-user)';



COMMENT ON COLUMN "public"."opportunity_contacts"."is_primary" IS 'Whether this is the primary contact for the opportunity';



COMMENT ON COLUMN "public"."opportunity_contacts"."notes" IS 'Additional notes about this contact relationship in the context of the opportunity';



COMMENT ON COLUMN "public"."opportunity_contacts"."deleted_at" IS 'Soft delete timestamp - added per audit finding 2025-11-29';



ALTER TABLE "public"."opportunity_contacts" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."opportunity_contacts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."opportunity_participants" (
    "id" bigint NOT NULL,
    "opportunity_id" bigint NOT NULL,
    "organization_id" bigint NOT NULL,
    "role" character varying(20) NOT NULL,
    "is_primary" boolean DEFAULT false,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" bigint,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "opportunity_participants_role_check" CHECK ((("role")::"text" = ANY (ARRAY['customer'::"text", 'principal'::"text", 'distributor'::"text", 'competitor'::"text"])))
);


ALTER TABLE "public"."opportunity_participants" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."opportunity_participants_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."opportunity_participants_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."opportunity_participants_id_seq" OWNED BY "public"."opportunity_participants"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."opportunity_products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."opportunity_products_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."opportunity_products_id_seq" OWNED BY "public"."opportunity_products"."id";



CREATE OR REPLACE VIEW "public"."opportunity_stage_changes" WITH ("security_invoker"='on') AS
 SELECT "at"."audit_id",
    "at"."record_id" AS "opportunity_id",
    "at"."old_value" AS "from_stage",
    "at"."new_value" AS "to_stage",
    "at"."changed_by",
    "at"."changed_at",
    "o"."name" AS "opportunity_name",
    "o"."stage" AS "current_stage",
    (("s"."first_name" || ' '::"text") || "s"."last_name") AS "changed_by_name"
   FROM (("public"."audit_trail" "at"
     LEFT JOIN "public"."opportunities" "o" ON (("at"."record_id" = "o"."id")))
     LEFT JOIN "public"."sales" "s" ON (("at"."changed_by" = "s"."id")))
  WHERE (("at"."table_name" = 'opportunities'::"text") AND ("at"."field_name" = 'stage'::"text"));


ALTER VIEW "public"."opportunity_stage_changes" OWNER TO "postgres";


COMMENT ON VIEW "public"."opportunity_stage_changes" IS 'WG-003: Convenience view for querying opportunity stage transitions.
   Filters audit_trail to stage field changes only.
   Join to opportunities and sales for context.';



COMMENT ON COLUMN "public"."opportunity_stage_changes"."opportunity_id" IS 'References opportunities.id - use for filtering stage history of a specific opportunity';



CREATE OR REPLACE VIEW "public"."organizationNotes" WITH ("security_invoker"='true') AS
 SELECT "id",
    "organization_id",
    "text",
    "attachments",
    "sales_id",
    "date",
    "created_at",
    "updated_at",
    "deleted_at",
    "updated_by"
   FROM "public"."organization_notes";


ALTER VIEW "public"."organizationNotes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."organizationNotes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."organizationNotes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."organizationNotes_id_seq" OWNED BY "public"."organization_notes"."id";



CREATE TABLE IF NOT EXISTS "public"."organization_distributors" (
    "id" bigint NOT NULL,
    "organization_id" bigint NOT NULL,
    "distributor_id" bigint NOT NULL,
    "is_primary" boolean DEFAULT false NOT NULL,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" bigint,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "no_self_distribution" CHECK (("organization_id" <> "distributor_id"))
);


ALTER TABLE "public"."organization_distributors" OWNER TO "postgres";


COMMENT ON TABLE "public"."organization_distributors" IS 'Tracks which distributors serve which customer/prospect organizations.
Supports many-to-many: customers can have multiple distributors.
Uses is_primary flag to designate the main/default distributor.
Part of MFB three-party model: Principal -> Distributor -> Customer/Operator';



COMMENT ON COLUMN "public"."organization_distributors"."organization_id" IS 'Reference to the customer/prospect organization that buys from the distributor';



COMMENT ON COLUMN "public"."organization_distributors"."distributor_id" IS 'Reference to an organization with organization_type = distributor';



COMMENT ON COLUMN "public"."organization_distributors"."is_primary" IS 'Designates the primary/default distributor for this organization. Only one can be true per organization.';



ALTER TABLE "public"."organization_distributors" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."organization_distributors_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE OR REPLACE VIEW "public"."organization_primary_distributor" WITH ("security_invoker"='on') AS
 SELECT "od"."organization_id",
    "od"."distributor_id",
    "d"."name" AS "distributor_name",
    "d"."city" AS "distributor_city",
    "d"."state" AS "distributor_state"
   FROM ("public"."organization_distributors" "od"
     JOIN "public"."organizations" "d" ON ((("d"."id" = "od"."distributor_id") AND ("d"."deleted_at" IS NULL))))
  WHERE (("od"."is_primary" = true) AND ("od"."deleted_at" IS NULL));


ALTER VIEW "public"."organization_primary_distributor" OWNER TO "postgres";


COMMENT ON VIEW "public"."organization_primary_distributor" IS 'Convenience view for fast primary distributor lookups. Returns distributor details for each organization''s primary distributor.';



CREATE SEQUENCE IF NOT EXISTS "public"."organizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."organizations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."organizations_id_seq" OWNED BY "public"."organizations"."id";



CREATE TABLE IF NOT EXISTS "public"."segments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "deleted_at" timestamp with time zone,
    "segment_type" "text" DEFAULT 'playbook'::"text",
    "parent_id" "uuid",
    "display_order" integer DEFAULT 0,
    "ui_group" "text",
    CONSTRAINT "segments_segment_type_check" CHECK (("segment_type" = ANY (ARRAY['playbook'::"text", 'operator'::"text"])))
);


ALTER TABLE "public"."segments" OWNER TO "postgres";


COMMENT ON TABLE "public"."segments" IS 'Segments for organization classification. Contains two types: (1) playbook - fixed set of 9 distributor categories, (2) operator - hierarchical operator classifications with parent/child relationships for detailed foodservice categorization.';



COMMENT ON COLUMN "public"."segments"."deleted_at" IS 'Soft delete timestamp (Constitution: soft-deletes rule)';



COMMENT ON COLUMN "public"."segments"."ui_group" IS 'UI grouping for operator segments: Commercial or Institutional';



CREATE OR REPLACE VIEW "public"."organizations_summary" WITH ("security_invoker"='on') AS
 SELECT "o"."id",
    "o"."name",
    "o"."organization_type",
    "o"."org_scope",
    "o"."parent_organization_id",
    "parent"."name" AS "parent_organization_name",
    "o"."priority",
    "o"."segment_id",
    "segments"."name" AS "segment_name",
    "o"."sales_id",
    "o"."employee_count",
    "o"."phone",
    "o"."website",
    "o"."postal_code",
    "o"."city",
    "o"."state",
    "o"."description",
    "o"."created_at",
    "o"."updated_at",
    "o"."deleted_at",
    "o"."email",
    "o"."linkedin_url",
    "o"."search_tsv",
    "o"."tags",
    COALESCE("child_branches"."cnt", 0) AS "child_branch_count",
    COALESCE("branch_contacts"."cnt", 0) AS "total_contacts_across_branches",
    COALESCE("branch_opportunities"."cnt", 0) AS "total_opportunities_across_branches",
    COALESCE("direct_opportunities"."cnt", 0) AS "nb_opportunities",
    COALESCE("direct_contacts"."cnt", 0) AS "nb_contacts",
    "last_opp_activity"."val" AS "last_opportunity_activity",
    COALESCE("org_notes"."cnt", 0) AS "nb_notes"
   FROM ((((((((("public"."organizations" "o"
     LEFT JOIN "public"."organizations" "parent" ON ((("o"."parent_organization_id" = "parent"."id") AND ("parent"."deleted_at" IS NULL))))
     LEFT JOIN "public"."segments" ON (("o"."segment_id" = "segments"."id")))
     LEFT JOIN LATERAL ( SELECT ("count"(*))::integer AS "cnt"
           FROM "public"."organizations" "children"
          WHERE (("children"."parent_organization_id" = "o"."id") AND ("children"."deleted_at" IS NULL))) "child_branches" ON (true))
     LEFT JOIN LATERAL ( SELECT ("count"(DISTINCT "c"."id"))::integer AS "cnt"
           FROM ("public"."organizations" "children"
             LEFT JOIN "public"."contacts" "c" ON (("c"."organization_id" = "children"."id")))
          WHERE (("children"."parent_organization_id" = "o"."id") AND ("children"."deleted_at" IS NULL) AND ("c"."deleted_at" IS NULL))) "branch_contacts" ON (true))
     LEFT JOIN LATERAL ( SELECT ("count"(DISTINCT "opp"."id"))::integer AS "cnt"
           FROM ("public"."organizations" "children"
             LEFT JOIN "public"."opportunities" "opp" ON (("opp"."principal_organization_id" = "children"."id")))
          WHERE (("children"."parent_organization_id" = "o"."id") AND ("children"."deleted_at" IS NULL) AND ("opp"."deleted_at" IS NULL))) "branch_opportunities" ON (true))
     LEFT JOIN LATERAL ( SELECT ("count"(*))::integer AS "cnt"
           FROM "public"."opportunities"
          WHERE (("opportunities"."principal_organization_id" = "o"."id") AND ("opportunities"."deleted_at" IS NULL))) "direct_opportunities" ON (true))
     LEFT JOIN LATERAL ( SELECT ("count"(*))::integer AS "cnt"
           FROM "public"."contacts"
          WHERE (("contacts"."organization_id" = "o"."id") AND ("contacts"."deleted_at" IS NULL))) "direct_contacts" ON (true))
     LEFT JOIN LATERAL ( SELECT "max"("opportunities"."updated_at") AS "val"
           FROM "public"."opportunities"
          WHERE (("opportunities"."principal_organization_id" = "o"."id") AND ("opportunities"."deleted_at" IS NULL))) "last_opp_activity" ON (true))
     LEFT JOIN LATERAL ( SELECT ("count"(*))::integer AS "cnt"
           FROM "public"."organization_notes"
          WHERE (("organization_notes"."organization_id" = "o"."id") AND ("organization_notes"."deleted_at" IS NULL))) "org_notes" ON (true))
  WHERE ("o"."deleted_at" IS NULL);


ALTER VIEW "public"."organizations_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."organizations_summary" IS 'Organization list with hierarchy, rollup metrics, segment_name, org_scope, search_tsv, tags, and audit columns. Includes tags array for UI tag management (matches contacts_summary pattern). Includes search_tsv for PostgreSQL full-text search support (FTS migration). Parent organization JOIN includes soft-delete filter to prevent displaying deleted parents. Segments JOIN provides segment_name for sorting and display. Optimized: 7 correlated subqueries converted to LEFT JOIN LATERAL for better query planning. SECURITY: Uses SECURITY INVOKER to enforce RLS policies.';



CREATE OR REPLACE VIEW "public"."organizations_with_account_manager" WITH ("security_invoker"='on') AS
 SELECT "o"."id",
    "o"."name",
    "o"."organization_type",
    "o"."priority",
    "o"."website",
    "o"."address",
    "o"."city",
    "o"."state",
    "o"."postal_code",
    "o"."phone",
    "o"."email",
    "o"."logo_url",
    "o"."linkedin_url",
    "o"."employee_count",
    "o"."founded_year",
    "o"."notes",
    "o"."sales_id",
    "o"."created_at",
    "o"."updated_at",
    "o"."created_by",
    "o"."deleted_at",
    "o"."import_session_id",
    "o"."search_tsv",
    "o"."context_links",
    "o"."description",
    "o"."tax_identifier",
    "o"."segment_id",
    "o"."updated_by",
    "o"."parent_organization_id",
    COALESCE(("s"."first_name" || COALESCE((' '::"text" || "s"."last_name"), ''::"text")), 'Unassigned'::"text") AS "account_manager_name",
    ("s"."user_id" IS NOT NULL) AS "account_manager_is_user"
   FROM ("public"."organizations" "o"
     LEFT JOIN "public"."sales" "s" ON (("o"."sales_id" = "s"."id")));


ALTER VIEW "public"."organizations_with_account_manager" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."principal_opportunities" WITH ("security_invoker"='on') AS
 SELECT "o"."id" AS "opportunity_id",
    "o"."name" AS "opportunity_name",
    "o"."stage",
    "o"."estimated_close_date",
    "o"."updated_at" AS "last_activity",
    "o"."customer_organization_id",
    "org"."name" AS "customer_name",
    "p"."id" AS "principal_id",
    "p"."name" AS "principal_name",
    (EXTRACT(epoch FROM ("now"() - "o"."updated_at")) / (86400)::numeric) AS "days_since_activity",
        CASE
            WHEN ((EXTRACT(epoch FROM ("now"() - "o"."updated_at")) / (86400)::numeric) < (7)::numeric) THEN 'active'::"text"
            WHEN ((EXTRACT(epoch FROM ("now"() - "o"."updated_at")) / (86400)::numeric) < (14)::numeric) THEN 'cooling'::"text"
            ELSE 'at_risk'::"text"
        END AS "health_status"
   FROM (("public"."opportunities" "o"
     LEFT JOIN "public"."organizations" "org" ON (("o"."customer_organization_id" = "org"."id")))
     LEFT JOIN "public"."organizations" "p" ON (("o"."principal_organization_id" = "p"."id")))
  WHERE (("o"."deleted_at" IS NULL) AND ("o"."stage" <> 'closed_lost'::"public"."opportunity_stage") AND ("p"."organization_type" = 'principal'::"public"."organization_type"))
  ORDER BY "p"."name", "o"."stage";


ALTER VIEW "public"."principal_opportunities" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."principal_pipeline_summary" AS
 SELECT "o"."id",
    "o"."id" AS "principal_id",
    "o"."name" AS "principal_name",
    "o"."created_at",
    "o"."updated_at",
    "o"."deleted_at",
    "count"(DISTINCT "opp"."id") FILTER (WHERE ("opp"."stage" <> ALL (ARRAY['closed_won'::"public"."opportunity_stage", 'closed_lost'::"public"."opportunity_stage"]))) AS "total_pipeline",
    "count"(DISTINCT
        CASE
            WHEN (("a"."activity_date" >= (CURRENT_DATE - '7 days'::interval)) AND ("opp"."stage" <> ALL (ARRAY['closed_won'::"public"."opportunity_stage", 'closed_lost'::"public"."opportunity_stage"]))) THEN "opp"."id"
            ELSE NULL::bigint
        END) AS "active_this_week",
    "count"(DISTINCT
        CASE
            WHEN (("a"."activity_date" >= (CURRENT_DATE - '14 days'::interval)) AND ("a"."activity_date" < (CURRENT_DATE - '7 days'::interval)) AND ("opp"."stage" <> ALL (ARRAY['closed_won'::"public"."opportunity_stage", 'closed_lost'::"public"."opportunity_stage"]))) THEN "opp"."id"
            ELSE NULL::bigint
        END) AS "active_last_week",
        CASE
            WHEN (("count"(DISTINCT "opp"."id") FILTER (WHERE ("opp"."stage" <> ALL (ARRAY['closed_won'::"public"."opportunity_stage", 'closed_lost'::"public"."opportunity_stage"]))) > 0) AND ("count"(DISTINCT
            CASE
                WHEN ("a"."activity_date" >= (CURRENT_DATE - '14 days'::interval)) THEN "opp"."id"
                ELSE NULL::bigint
            END) = 0)) THEN 'stale'::"text"
            WHEN ("count"(DISTINCT
            CASE
                WHEN ("a"."activity_date" >= (CURRENT_DATE - '7 days'::interval)) THEN "opp"."id"
                ELSE NULL::bigint
            END) > "count"(DISTINCT
            CASE
                WHEN (("a"."activity_date" >= (CURRENT_DATE - '14 days'::interval)) AND ("a"."activity_date" < (CURRENT_DATE - '7 days'::interval))) THEN "opp"."id"
                ELSE NULL::bigint
            END)) THEN 'increasing'::"text"
            WHEN ("count"(DISTINCT
            CASE
                WHEN ("a"."activity_date" >= (CURRENT_DATE - '7 days'::interval)) THEN "opp"."id"
                ELSE NULL::bigint
            END) < "count"(DISTINCT
            CASE
                WHEN (("a"."activity_date" >= (CURRENT_DATE - '14 days'::interval)) AND ("a"."activity_date" < (CURRENT_DATE - '7 days'::interval))) THEN "opp"."id"
                ELSE NULL::bigint
            END)) THEN 'decreasing'::"text"
            ELSE 'steady'::"text"
        END AS "momentum",
    ( SELECT "task"."subject"
           FROM ("public"."activities" "task"
             JOIN "public"."opportunities" "sub_opp" ON (("task"."opportunity_id" = "sub_opp"."id")))
          WHERE (("sub_opp"."principal_organization_id" = "o"."id") AND ("task"."activity_type" = 'task'::"public"."activity_type") AND ("task"."completed" = false) AND ("task"."deleted_at" IS NULL) AND ("sub_opp"."deleted_at" IS NULL))
          ORDER BY "task"."due_date"
         LIMIT 1) AS "next_action_summary",
    ( SELECT "opportunities"."account_manager_id"
           FROM "public"."opportunities"
          WHERE (("opportunities"."principal_organization_id" = "o"."id") AND ("opportunities"."deleted_at" IS NULL) AND ("opportunities"."account_manager_id" IS NOT NULL))
          ORDER BY "opportunities"."created_at" DESC
         LIMIT 1) AS "sales_id",
    ( SELECT "count"(*) AS "count"
           FROM ("public"."activities" "t"
             JOIN "public"."opportunities" "t_opp" ON (("t"."opportunity_id" = "t_opp"."id")))
          WHERE (("t_opp"."principal_organization_id" = "o"."id") AND ("t"."activity_type" = 'task'::"public"."activity_type") AND ("t"."completed" = true) AND ("t"."deleted_at" IS NULL) AND ("t_opp"."deleted_at" IS NULL) AND ("t"."updated_at" >= (CURRENT_DATE - '30 days'::interval)))) AS "completed_tasks_30d",
    ( SELECT "count"(*) AS "count"
           FROM ("public"."activities" "t"
             JOIN "public"."opportunities" "t_opp" ON (("t"."opportunity_id" = "t_opp"."id")))
          WHERE (("t_opp"."principal_organization_id" = "o"."id") AND ("t"."activity_type" = 'task'::"public"."activity_type") AND ("t"."deleted_at" IS NULL) AND ("t_opp"."deleted_at" IS NULL) AND ("t"."created_at" >= (CURRENT_DATE - '30 days'::interval)))) AS "total_tasks_30d"
   FROM (("public"."organizations" "o"
     LEFT JOIN "public"."opportunities" "opp" ON ((("o"."id" = "opp"."principal_organization_id") AND ("opp"."deleted_at" IS NULL))))
     LEFT JOIN "public"."activities" "a" ON ((("opp"."id" = "a"."opportunity_id") AND ("a"."deleted_at" IS NULL))))
  WHERE (("o"."organization_type" = 'principal'::"public"."organization_type") AND ("o"."deleted_at" IS NULL))
  GROUP BY "o"."id", "o"."name", "o"."created_at", "o"."updated_at", "o"."deleted_at";


ALTER VIEW "public"."principal_pipeline_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."principal_pipeline_summary" IS 'Principal pipeline metrics: total pipeline count, weekly activity trends, momentum indicator, next action. Uses security_invoker to enforce RLS from underlying tables. Includes created_at, updated_at, deleted_at from organizations for summary view consistency.';



CREATE OR REPLACE VIEW "public"."priority_tasks" WITH ("security_invoker"='true') AS
 SELECT "a"."id",
    "a"."subject" AS "title",
    "a"."description",
    ("a"."type")::"text" AS "type",
    "a"."due_date",
    "a"."priority",
    "a"."sales_id",
    "a"."contact_id",
    "a"."organization_id",
    "a"."opportunity_id",
    "a"."created_at",
    COALESCE((("c"."first_name" || ' '::"text") || "c"."last_name"), "c"."first_name") AS "contact_name",
    "org"."name" AS "organization_name",
    "opp"."name" AS "opportunity_name",
    COALESCE((("s"."first_name" || ' '::"text") || "s"."last_name"), "s"."email") AS "assignee_name",
        CASE
            WHEN ("a"."due_date" < CURRENT_DATE) THEN true
            ELSE false
        END AS "is_overdue",
    ("a"."due_date" - CURRENT_DATE) AS "days_until_due"
   FROM (((("public"."activities" "a"
     LEFT JOIN "public"."contacts" "c" ON (("a"."contact_id" = "c"."id")))
     LEFT JOIN "public"."organizations" "org" ON (("a"."organization_id" = "org"."id")))
     LEFT JOIN "public"."opportunities" "opp" ON (("a"."opportunity_id" = "opp"."id")))
     LEFT JOIN "public"."sales" "s" ON (("a"."sales_id" = "s"."id")))
  WHERE (("a"."activity_type" = 'task'::"public"."activity_type") AND ("a"."deleted_at" IS NULL) AND (COALESCE("a"."completed", false) = false) AND (("a"."snooze_until" IS NULL) OR ("a"."snooze_until" <= "now"())))
  ORDER BY
        CASE "a"."priority"
            WHEN 'critical'::"public"."priority_level" THEN 1
            WHEN 'high'::"public"."priority_level" THEN 2
            WHEN 'medium'::"public"."priority_level" THEN 3
            WHEN 'low'::"public"."priority_level" THEN 4
            ELSE 5
        END, "a"."due_date";


ALTER VIEW "public"."priority_tasks" OWNER TO "postgres";


COMMENT ON VIEW "public"."priority_tasks" IS 'Incomplete tasks sorted by priority (critical→low) then due date. Excludes snoozed tasks.';



CREATE TABLE IF NOT EXISTS "public"."product_distributor_authorizations" (
    "id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "distributor_id" bigint NOT NULL,
    "is_authorized" boolean DEFAULT true NOT NULL,
    "authorization_date" "date" DEFAULT CURRENT_DATE,
    "expiration_date" "date",
    "special_pricing" "jsonb",
    "territory_restrictions" "text"[],
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" bigint,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "valid_product_authorization_dates" CHECK ((("expiration_date" IS NULL) OR ("expiration_date" > "authorization_date")))
);


ALTER TABLE "public"."product_distributor_authorizations" OWNER TO "postgres";


COMMENT ON TABLE "public"."product_distributor_authorizations" IS 'Product-level authorization overrides for distributor relationships.';



COMMENT ON COLUMN "public"."product_distributor_authorizations"."deleted_at" IS 'Soft-delete timestamp. When set, record is hidden from normal queries. Added 2025-12-12 per RLS security audit.';



ALTER TABLE "public"."product_distributor_authorizations" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."product_distributor_authorizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."product_distributors" (
    "product_id" bigint NOT NULL,
    "distributor_id" bigint NOT NULL,
    "vendor_item_number" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "valid_from" timestamp with time zone DEFAULT "now"() NOT NULL,
    "valid_to" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "created_by" bigint,
    CONSTRAINT "product_distributors_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'active'::"text", 'inactive'::"text"])))
);


ALTER TABLE "public"."product_distributors" OWNER TO "postgres";


COMMENT ON TABLE "public"."product_distributors" IS 'Junction: products to distributors with vendor item numbers (DOT#)';



COMMENT ON COLUMN "public"."product_distributors"."vendor_item_number" IS 'Distributor code: USF#, Sysco#, GFS#';



COMMENT ON COLUMN "public"."product_distributors"."deleted_at" IS 'Soft delete timestamp. NULL = active record. Set to NOW() to archive.';



COMMENT ON COLUMN "public"."product_distributors"."created_by" IS 'ID of the sales user who created this record. For audit trail.';



CREATE OR REPLACE VIEW "public"."product_distributors_summary" WITH ("security_invoker"='on') AS
 SELECT "pd"."product_id",
    "pd"."distributor_id",
    "pd"."vendor_item_number",
    "pd"."status",
    "pd"."valid_from",
    "pd"."valid_to",
    "pd"."notes",
    "pd"."created_at",
    "pd"."updated_at",
    "pd"."deleted_at",
    "p"."name" AS "product_name",
    "o"."name" AS "distributor_name"
   FROM (("public"."product_distributors" "pd"
     LEFT JOIN "public"."products" "p" ON ((("pd"."product_id" = "p"."id") AND ("p"."deleted_at" IS NULL))))
     LEFT JOIN "public"."organizations" "o" ON ((("pd"."distributor_id" = "o"."id") AND ("o"."deleted_at" IS NULL))))
  WHERE ("pd"."deleted_at" IS NULL);


ALTER VIEW "public"."product_distributors_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."product_distributors_summary" IS 'Summary view for product_distributors list with denormalized product and distributor names. Eliminates N+1 queries.';



CREATE TABLE IF NOT EXISTS "public"."product_features" (
    "id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "feature_name" "text" NOT NULL,
    "feature_value" "text",
    "display_order" integer DEFAULT 0,
    "is_highlighted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "created_by" bigint,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_features" OWNER TO "postgres";


COMMENT ON COLUMN "public"."product_features"."deleted_at" IS 'Soft delete timestamp. NULL = active record. Set to NOW() to archive.';



COMMENT ON COLUMN "public"."product_features"."created_by" IS 'ID of the sales user who created this record. For audit trail.';



COMMENT ON COLUMN "public"."product_features"."updated_at" IS 'Timestamp of last update. Auto-updated by trigger.';



CREATE SEQUENCE IF NOT EXISTS "public"."product_features_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."product_features_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."product_features_id_seq" OWNED BY "public"."product_features"."id";



CREATE SEQUENCE IF NOT EXISTS "public"."products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."products_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."products_id_seq" OWNED BY "public"."products"."id";



CREATE OR REPLACE VIEW "public"."products_summary" WITH ("security_invoker"='on') AS
 SELECT "p"."id",
    "p"."principal_id",
    "p"."name",
    "p"."description",
    "p"."status",
    "p"."category",
    "p"."manufacturer_part_number",
    "p"."created_at",
    "p"."updated_at",
    "p"."created_by",
    "p"."updated_by",
    "p"."deleted_at",
    "po"."name" AS "principal_name"
   FROM ("public"."products" "p"
     LEFT JOIN "public"."organizations" "po" ON (("p"."principal_id" = "po"."id")));


ALTER VIEW "public"."products_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."products_summary" IS 'Products with denormalized principal organization name for efficient list display. Legacy columns (sku, distributor_id, distributor codes) removed.';



CREATE SEQUENCE IF NOT EXISTS "public"."sales_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."sales_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."sales_id_seq" OWNED BY "public"."sales"."id";



CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "color" "text" DEFAULT 'blue-500'::"text",
    "description" "text",
    "usage_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


COMMENT ON TABLE "public"."tags" IS 'RLS hardened: Read=all authenticated, Write=admin/manager only.';



COMMENT ON COLUMN "public"."tags"."deleted_at" IS 'Soft delete timestamp (Constitution: soft-deletes rule)';



CREATE SEQUENCE IF NOT EXISTS "public"."tags_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."tags_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."tags_id_seq" OWNED BY "public"."tags"."id";



CREATE TABLE IF NOT EXISTS "public"."user_favorites" (
    "id" bigint NOT NULL,
    "user_id" "uuid" NOT NULL,
    "entity_type" character varying(50) NOT NULL,
    "entity_id" bigint NOT NULL,
    "display_name" character varying(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "user_favorites_entity_type_check" CHECK ((("entity_type")::"text" = ANY ((ARRAY['contacts'::character varying, 'organizations'::character varying, 'opportunities'::character varying])::"text"[])))
);


ALTER TABLE "public"."user_favorites" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_favorites" IS 'User-specific favorites for quick access to contacts, organizations, etc.';



COMMENT ON COLUMN "public"."user_favorites"."user_id" IS 'Reference to authenticated user';



COMMENT ON COLUMN "public"."user_favorites"."entity_type" IS 'Resource type: contacts, organizations';



COMMENT ON COLUMN "public"."user_favorites"."entity_id" IS 'ID of the favorited entity';



COMMENT ON COLUMN "public"."user_favorites"."display_name" IS 'Cached display name for sidebar rendering';



COMMENT ON COLUMN "public"."user_favorites"."deleted_at" IS 'Soft delete timestamp. NULL = active record.';



ALTER TABLE "public"."user_favorites" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."user_favorites_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."activities" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."activities_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."contact_notes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."contactNotes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."contacts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."contacts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."dashboard_snapshots" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."dashboard_snapshots_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."interaction_participants" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."interaction_participants_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."opportunities" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."opportunities_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."opportunity_notes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."opportunityNotes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."opportunity_participants" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."opportunity_participants_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."opportunity_products" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."opportunity_products_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."organization_notes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."organizationNotes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."organizations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."organizations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."product_features" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."product_features_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."products" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."products_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sales" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sales_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."tags" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tags_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."audit_trail"
    ADD CONSTRAINT "audit_trail_pkey" PRIMARY KEY ("audit_id");



ALTER TABLE ONLY "public"."contact_notes"
    ADD CONSTRAINT "contact_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."dashboard_snapshots"
    ADD CONSTRAINT "dashboard_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."distributor_principal_authorizations"
    ADD CONSTRAINT "distributor_principal_authorizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."segments"
    ADD CONSTRAINT "industries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interaction_participants"
    ADD CONSTRAINT "interaction_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunity_contacts"
    ADD CONSTRAINT "opportunity_contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunity_notes"
    ADD CONSTRAINT "opportunity_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunity_participants"
    ADD CONSTRAINT "opportunity_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunity_products"
    ADD CONSTRAINT "opportunity_products_opportunity_id_product_id_reference_key" UNIQUE ("opportunity_id", "product_id_reference");



ALTER TABLE ONLY "public"."opportunity_products"
    ADD CONSTRAINT "opportunity_products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_distributors"
    ADD CONSTRAINT "organization_distributors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organization_notes"
    ADD CONSTRAINT "organization_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_distributor_authorizations"
    ADD CONSTRAINT "product_distributor_authorizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_distributors"
    ADD CONSTRAINT "product_distributors_pkey" PRIMARY KEY ("product_id", "distributor_id");



ALTER TABLE ONLY "public"."product_features"
    ADD CONSTRAINT "product_features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."segments"
    ADD CONSTRAINT "segments_name_type_unique" UNIQUE ("name", "segment_type");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunity_contacts"
    ADD CONSTRAINT "unique_opportunity_contact" UNIQUE ("opportunity_id", "contact_id");



ALTER TABLE ONLY "public"."dashboard_snapshots"
    ADD CONSTRAINT "unique_snapshot_per_user_per_date" UNIQUE ("sales_id", "snapshot_date");



ALTER TABLE ONLY "public"."distributor_principal_authorizations"
    ADD CONSTRAINT "uq_distributor_principal_authorization" UNIQUE ("distributor_id", "principal_id");



ALTER TABLE ONLY "public"."organization_distributors"
    ADD CONSTRAINT "uq_organization_distributor" UNIQUE ("organization_id", "distributor_id");



ALTER TABLE ONLY "public"."product_distributor_authorizations"
    ADD CONSTRAINT "uq_product_distributor_authorization" UNIQUE ("product_id", "distributor_id");



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_activities_activity_date_not_deleted" ON "public"."activities" USING "btree" ("activity_date" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_activities_contact" ON "public"."activities" USING "btree" ("contact_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_activities_created_by" ON "public"."activities" USING "btree" ("created_by");



CREATE INDEX "idx_activities_due_date" ON "public"."activities" USING "btree" ("due_date") WHERE (("activity_type" = 'task'::"public"."activity_type") AND ("deleted_at" IS NULL));



CREATE INDEX "idx_activities_opportunity" ON "public"."activities" USING "btree" ("opportunity_id") WHERE (("deleted_at" IS NULL) AND ("opportunity_id" IS NOT NULL));



CREATE INDEX "idx_activities_opportunity_id" ON "public"."activities" USING "btree" ("opportunity_id") WHERE ("opportunity_id" IS NOT NULL);



CREATE INDEX "idx_activities_organization_id" ON "public"."activities" USING "btree" ("organization_id");



CREATE INDEX "idx_activities_overdue_notification" ON "public"."activities" USING "btree" ("due_date", "overdue_notified_at") WHERE (("activity_type" = 'task'::"public"."activity_type") AND ("completed" = false) AND ("due_date" IS NOT NULL) AND ("deleted_at" IS NULL));



CREATE INDEX "idx_activities_related_task_id" ON "public"."activities" USING "btree" ("related_task_id");



CREATE INDEX "idx_activities_sales_id" ON "public"."activities" USING "btree" ("sales_id") WHERE (("activity_type" = 'task'::"public"."activity_type") AND ("deleted_at" IS NULL));



CREATE INDEX "idx_activities_sales_id_rls" ON "public"."activities" USING "btree" ("sales_id") WHERE (("sales_id" IS NOT NULL) AND ("deleted_at" IS NULL));



CREATE INDEX "idx_activities_snooze_until" ON "public"."activities" USING "btree" ("snooze_until") WHERE (("activity_type" = 'task'::"public"."activity_type") AND ("snooze_until" IS NOT NULL) AND ("deleted_at" IS NULL));



CREATE INDEX "idx_activities_task_completed" ON "public"."activities" USING "btree" ("completed", "due_date") WHERE (("activity_type" = 'task'::"public"."activity_type") AND ("deleted_at" IS NULL));



CREATE INDEX "idx_activities_type" ON "public"."activities" USING "btree" ("activity_type", "type") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_audit_trail_changed_by" ON "public"."audit_trail" USING "btree" ("changed_by");



CREATE INDEX "idx_audit_trail_table_record" ON "public"."audit_trail" USING "btree" ("table_name", "record_id", "changed_at" DESC);



CREATE INDEX "idx_companies_priority" ON "public"."organizations" USING "btree" ("priority");



CREATE INDEX "idx_companies_sales_id" ON "public"."organizations" USING "btree" ("sales_id");



CREATE INDEX "idx_contact_notes_contact_date" ON "public"."contact_notes" USING "btree" ("contact_id", "date" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_contact_notes_contact_id" ON "public"."contact_notes" USING "btree" ("contact_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_contact_notes_created_at" ON "public"."contact_notes" USING "btree" ("created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_contact_notes_created_by" ON "public"."contact_notes" USING "btree" ("created_by");



CREATE INDEX "idx_contact_notes_sales_id" ON "public"."contact_notes" USING "btree" ("sales_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_contact_notes_updated_by" ON "public"."contact_notes" USING "btree" ("updated_by");



CREATE INDEX "idx_contactnotes_deleted_at" ON "public"."contact_notes" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_contacts_created_by" ON "public"."contacts" USING "btree" ("created_by") WHERE ("created_by" IS NOT NULL);



CREATE INDEX "idx_contacts_deleted_at" ON "public"."contacts" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_contacts_district" ON "public"."contacts" USING "btree" ("district_code") WHERE ("district_code" IS NOT NULL);



CREATE INDEX "idx_contacts_first_name_trgm" ON "public"."contacts" USING "gin" ("first_name" "extensions"."gin_trgm_ops") WHERE (("deleted_at" IS NULL) AND ("first_name" IS NOT NULL));



CREATE INDEX "idx_contacts_last_name_trgm" ON "public"."contacts" USING "gin" ("last_name" "extensions"."gin_trgm_ops") WHERE (("deleted_at" IS NULL) AND ("last_name" IS NOT NULL));



CREATE INDEX "idx_contacts_manager" ON "public"."contacts" USING "btree" ("manager_id") WHERE ("manager_id" IS NOT NULL);



CREATE INDEX "idx_contacts_name_trgm" ON "public"."contacts" USING "gin" ("name" "extensions"."gin_trgm_ops") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_contacts_organization_id" ON "public"."contacts" USING "btree" ("organization_id") WHERE ("deleted_at" IS NULL);



COMMENT ON INDEX "public"."idx_contacts_organization_id" IS 'Optimizes organization deletion checks and contact list queries. Excludes soft-deleted contacts.';



CREATE INDEX "idx_contacts_sales_id" ON "public"."contacts" USING "btree" ("sales_id");



CREATE INDEX "idx_contacts_search_tsv" ON "public"."contacts" USING "gin" ("search_tsv");



CREATE UNIQUE INDEX "idx_contacts_unique_org_name" ON "public"."contacts" USING "btree" ("organization_id", "name") WHERE ("deleted_at" IS NULL);



COMMENT ON INDEX "public"."idx_contacts_unique_org_name" IS 'Prevents duplicate contacts (same name) within an organization. Only applies to non-deleted records.';



CREATE INDEX "idx_contacts_updated_by" ON "public"."contacts" USING "btree" ("updated_by") WHERE ("updated_by" IS NOT NULL);



CREATE INDEX "idx_dashboard_snapshots_date" ON "public"."dashboard_snapshots" USING "btree" ("snapshot_date" DESC);



CREATE INDEX "idx_dashboard_snapshots_sales_date" ON "public"."dashboard_snapshots" USING "btree" ("sales_id", "snapshot_date" DESC);



CREATE INDEX "idx_distributor_principal_authorizations_created_by" ON "public"."distributor_principal_authorizations" USING "btree" ("created_by");



CREATE INDEX "idx_dpa_distributor_id_partial" ON "public"."distributor_principal_authorizations" USING "btree" ("distributor_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_dpa_principal_id_partial" ON "public"."distributor_principal_authorizations" USING "btree" ("principal_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_interaction_participants_activity" ON "public"."interaction_participants" USING "btree" ("activity_id");



CREATE INDEX "idx_interaction_participants_activity_id_partial" ON "public"."interaction_participants" USING "btree" ("activity_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_interaction_participants_contact" ON "public"."interaction_participants" USING "btree" ("contact_id");



CREATE INDEX "idx_interaction_participants_contact_id_partial" ON "public"."interaction_participants" USING "btree" ("contact_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_interaction_participants_created_by" ON "public"."interaction_participants" USING "btree" ("created_by");



CREATE INDEX "idx_interaction_participants_deleted_at" ON "public"."interaction_participants" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_interaction_participants_organization" ON "public"."interaction_participants" USING "btree" ("organization_id");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_opportunities_account_manager" ON "public"."opportunities" USING "btree" ("account_manager_id");



CREATE INDEX "idx_opportunities_closed_stage_reason" ON "public"."opportunities" USING "btree" ("stage", "win_reason", "loss_reason") WHERE ("stage" = ANY (ARRAY['closed_won'::"public"."opportunity_stage", 'closed_lost'::"public"."opportunity_stage"]));



CREATE INDEX "idx_opportunities_created_by" ON "public"."opportunities" USING "btree" ("created_by") WHERE ("created_by" IS NOT NULL);



CREATE INDEX "idx_opportunities_customer_organization_id" ON "public"."opportunities" USING "btree" ("customer_organization_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunities_deleted_at" ON "public"."opportunities" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunities_distributor_organization_id" ON "public"."opportunities" USING "btree" ("distributor_organization_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunities_estimated_close" ON "public"."opportunities" USING "btree" ("estimated_close_date");



CREATE INDEX "idx_opportunities_founding_interaction_id" ON "public"."opportunities" USING "btree" ("founding_interaction_id") WHERE ("founding_interaction_id" IS NOT NULL);



COMMENT ON INDEX "public"."idx_opportunities_founding_interaction_id" IS 'FK index for founding_interaction_id - audit finding 2025-11-29';



CREATE INDEX "idx_opportunities_id_not_deleted" ON "public"."opportunities" USING "btree" ("id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunities_id_version" ON "public"."opportunities" USING "btree" ("id", "version");



CREATE INDEX "idx_opportunities_name_trgm_gist" ON "public"."opportunities" USING "gist" ("name" "extensions"."gist_trgm_ops") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunities_owner_id" ON "public"."opportunities" USING "btree" ("opportunity_owner_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunities_primary_contact_id" ON "public"."opportunities" USING "btree" ("primary_contact_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunities_principal_created" ON "public"."opportunities" USING "btree" ("principal_organization_id", "created_at" DESC) WHERE (("deleted_at" IS NULL) AND ("account_manager_id" IS NOT NULL));



CREATE INDEX "idx_opportunities_principal_org" ON "public"."opportunities" USING "btree" ("principal_organization_id") WHERE ("principal_organization_id" IS NOT NULL);



CREATE INDEX "idx_opportunities_principal_org_id_restrict" ON "public"."opportunities" USING "btree" ("principal_organization_id") WHERE (("deleted_at" IS NULL) AND ("principal_organization_id" IS NOT NULL));



COMMENT ON INDEX "public"."idx_opportunities_principal_org_id_restrict" IS 'Optimizes FK lookups and principal deletion checks. Excludes soft-deleted opportunities and NULL principals.';



CREATE INDEX "idx_opportunities_priority" ON "public"."opportunities" USING "btree" ("priority");



CREATE INDEX "idx_opportunities_related_opportunity_id" ON "public"."opportunities" USING "btree" ("related_opportunity_id");



CREATE INDEX "idx_opportunities_search_tsv" ON "public"."opportunities" USING "gin" ("search_tsv");



CREATE INDEX "idx_opportunities_status" ON "public"."opportunities" USING "btree" ("status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunities_updated_by" ON "public"."opportunities" USING "btree" ("updated_by") WHERE ("updated_by" IS NOT NULL);



CREATE INDEX "idx_opportunity_contacts_contact_id" ON "public"."opportunity_contacts" USING "btree" ("contact_id");



CREATE INDEX "idx_opportunity_contacts_contact_id_partial" ON "public"."opportunity_contacts" USING "btree" ("contact_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunity_contacts_deleted_at" ON "public"."opportunity_contacts" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunity_contacts_opportunity_id" ON "public"."opportunity_contacts" USING "btree" ("opportunity_id");



CREATE INDEX "idx_opportunity_contacts_opportunity_id_partial" ON "public"."opportunity_contacts" USING "btree" ("opportunity_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunity_notes_created_at" ON "public"."opportunity_notes" USING "btree" ("created_at" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunity_notes_created_by" ON "public"."opportunity_notes" USING "btree" ("created_by");



CREATE INDEX "idx_opportunity_notes_opportunity_date" ON "public"."opportunity_notes" USING "btree" ("opportunity_id", "date" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunity_notes_opportunity_id" ON "public"."opportunity_notes" USING "btree" ("opportunity_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunity_notes_sales_id" ON "public"."opportunity_notes" USING "btree" ("sales_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunity_notes_updated_by" ON "public"."opportunity_notes" USING "btree" ("updated_by");



CREATE INDEX "idx_opportunity_participants_created_by" ON "public"."opportunity_participants" USING "btree" ("created_by");



CREATE INDEX "idx_opportunity_participants_opp_id" ON "public"."opportunity_participants" USING "btree" ("opportunity_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunity_participants_org_id_partial" ON "public"."opportunity_participants" USING "btree" ("organization_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunity_participants_role" ON "public"."opportunity_participants" USING "btree" ("role") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunity_products_deleted_at" ON "public"."opportunity_products" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunity_products_opp_id_deleted" ON "public"."opportunity_products" USING "btree" ("opportunity_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunity_products_opportunity_id" ON "public"."opportunity_products" USING "btree" ("opportunity_id");



CREATE INDEX "idx_opportunity_products_product_id_partial" ON "public"."opportunity_products" USING "btree" ("product_id_reference") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_org_distributors_dist_id" ON "public"."organization_distributors" USING "btree" ("distributor_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_org_distributors_org_id" ON "public"."organization_distributors" USING "btree" ("organization_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_org_distributors_primary" ON "public"."organization_distributors" USING "btree" ("organization_id", "distributor_id") WHERE (("deleted_at" IS NULL) AND ("is_primary" = true));



CREATE INDEX "idx_organization_distributors_created_by" ON "public"."organization_distributors" USING "btree" ("created_by");



CREATE INDEX "idx_organization_notes_org_date" ON "public"."organization_notes" USING "btree" ("organization_id", "date" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_organization_notes_organization_id" ON "public"."organization_notes" USING "btree" ("organization_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_organization_notes_sales_id" ON "public"."organization_notes" USING "btree" ("sales_id");



CREATE INDEX "idx_organization_notes_updated_by" ON "public"."organization_notes" USING "btree" ("updated_by");



CREATE UNIQUE INDEX "idx_organization_one_primary_distributor" ON "public"."organization_distributors" USING "btree" ("organization_id") WHERE (("is_primary" = true) AND ("deleted_at" IS NULL));



COMMENT ON INDEX "public"."idx_organization_one_primary_distributor" IS 'Enforces business rule: each organization can have at most one primary distributor';



CREATE INDEX "idx_organizations_created_by" ON "public"."organizations" USING "btree" ("created_by") WHERE ("created_by" IS NOT NULL);



CREATE INDEX "idx_organizations_created_by_active" ON "public"."organizations" USING "btree" ("created_by") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_organizations_cuisine" ON "public"."organizations" USING "btree" ("cuisine") WHERE (("cuisine" IS NOT NULL) AND ("deleted_at" IS NULL));



CREATE INDEX "idx_organizations_id_not_deleted" ON "public"."organizations" USING "btree" ("id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_organizations_name" ON "public"."organizations" USING "btree" ("name") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_organizations_name_trgm" ON "public"."organizations" USING "gin" ("name" "extensions"."gin_trgm_ops") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_organizations_needs_review" ON "public"."organizations" USING "btree" ("needs_review") WHERE (("needs_review" IS NOT NULL) AND ("deleted_at" IS NULL));



CREATE INDEX "idx_organizations_parent_organization_id" ON "public"."organizations" USING "btree" ("parent_organization_id") WHERE ("parent_organization_id" IS NOT NULL);



COMMENT ON INDEX "public"."idx_organizations_parent_organization_id" IS 'FK index for hierarchy traversal - audit finding 2025-11-29';



CREATE INDEX "idx_organizations_playbook_category_id" ON "public"."organizations" USING "btree" ("playbook_category_id") WHERE (("playbook_category_id" IS NOT NULL) AND ("deleted_at" IS NULL));



CREATE INDEX "idx_organizations_sales_id_active" ON "public"."organizations" USING "btree" ("sales_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_organizations_search_tsv" ON "public"."organizations" USING "gin" ("search_tsv") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_organizations_segment_id" ON "public"."organizations" USING "btree" ("segment_id") WHERE ("segment_id" IS NOT NULL);



CREATE INDEX "idx_organizations_tags" ON "public"."organizations" USING "gin" ("tags");



CREATE INDEX "idx_organizations_updated_by" ON "public"."organizations" USING "btree" ("updated_by") WHERE ("updated_by" IS NOT NULL);



CREATE INDEX "idx_orgs_operating" ON "public"."organizations" USING "btree" ("is_operating_entity") WHERE ("is_operating_entity" = true);



CREATE INDEX "idx_orgs_org_scope" ON "public"."organizations" USING "btree" ("org_scope") WHERE ("org_scope" IS NOT NULL);



CREATE INDEX "idx_orgs_organization_type" ON "public"."organizations" USING "btree" ("organization_type") WHERE ("organization_type" IS NOT NULL);



CREATE INDEX "idx_orgs_parent_organization_id" ON "public"."organizations" USING "btree" ("parent_organization_id");



CREATE INDEX "idx_orgs_status" ON "public"."organizations" USING "btree" ("status", "status_reason") WHERE ("status" IS NOT NULL);



CREATE INDEX "idx_orgs_territory" ON "public"."organizations" USING "btree" ("territory") WHERE ("territory" IS NOT NULL);



CREATE INDEX "idx_pda_distributor_id_partial" ON "public"."product_distributor_authorizations" USING "btree" ("distributor_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_pda_product_id_partial" ON "public"."product_distributor_authorizations" USING "btree" ("product_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_product_dist_active" ON "public"."product_distributors" USING "btree" ("distributor_id", "status") WHERE ("status" = 'active'::"text");



CREATE INDEX "idx_product_dist_status" ON "public"."product_distributors" USING "btree" ("status");



CREATE INDEX "idx_product_dist_vendor_item" ON "public"."product_distributors" USING "btree" ("vendor_item_number") WHERE ("vendor_item_number" IS NOT NULL);



CREATE INDEX "idx_product_distributor_auth_active" ON "public"."product_distributor_authorizations" USING "btree" ("product_id", "distributor_id") WHERE (("deleted_at" IS NULL) AND ("is_authorized" = true));



CREATE INDEX "idx_product_distributor_authorizations_created_by" ON "public"."product_distributor_authorizations" USING "btree" ("created_by");



CREATE INDEX "idx_product_distributor_authorizations_deleted_at" ON "public"."product_distributor_authorizations" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_product_distributors_deleted_at" ON "public"."product_distributors" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_product_distributors_distributor_id" ON "public"."product_distributors" USING "btree" ("distributor_id");



CREATE INDEX "idx_product_distributors_distributor_id_partial" ON "public"."product_distributors" USING "btree" ("distributor_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_product_distributors_product_id" ON "public"."product_distributors" USING "btree" ("product_id");



CREATE INDEX "idx_product_distributors_product_id_partial" ON "public"."product_distributors" USING "btree" ("product_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_product_features_deleted_at" ON "public"."product_features" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_product_features_product_id" ON "public"."product_features" USING "btree" ("product_id");



CREATE INDEX "idx_product_features_product_id_partial" ON "public"."product_features" USING "btree" ("product_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_products_created_by" ON "public"."products" USING "btree" ("created_by");



CREATE INDEX "idx_products_created_by_active" ON "public"."products" USING "btree" ("created_by") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_products_search_tsv" ON "public"."products" USING "gin" ("search_tsv");



CREATE INDEX "idx_products_status" ON "public"."products" USING "btree" ("status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_products_updated_by" ON "public"."products" USING "btree" ("updated_by");



CREATE INDEX "idx_sales_disabled" ON "public"."sales" USING "btree" ("disabled") WHERE ("disabled" = false);



CREATE INDEX "idx_segments_created_by" ON "public"."segments" USING "btree" ("created_by");



CREATE INDEX "idx_segments_parent" ON "public"."segments" USING "btree" ("parent_id") WHERE ("parent_id" IS NOT NULL);



CREATE INDEX "idx_segments_type" ON "public"."segments" USING "btree" ("segment_type");



CREATE INDEX "idx_tags_deleted_at" ON "public"."tags" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_user_favorites_deleted_at" ON "public"."user_favorites" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "idx_user_favorites_unique_active" ON "public"."user_favorites" USING "btree" ("user_id", "entity_type", "entity_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_user_favorites_user_id" ON "public"."user_favorites" USING "btree" ("user_id") WHERE ("deleted_at" IS NULL);



CREATE UNIQUE INDEX "organizations_name_unique_idx" ON "public"."organizations" USING "btree" ("lower"("name")) WHERE ("deleted_at" IS NULL);



COMMENT ON INDEX "public"."organizations_name_unique_idx" IS 'Ensures organization names are unique (case-insensitive). Only applies to non-deleted records. Originally added 2025-11-22, dropped 2025-12-23, restored 2026-01-27.';



CREATE UNIQUE INDEX "segments_name_type_case_insensitive_idx" ON "public"."segments" USING "btree" ("lower"("name"), "segment_type");



CREATE OR REPLACE TRIGGER "audit_contacts_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."audit_changes"();



CREATE OR REPLACE TRIGGER "audit_critical_contacts" AFTER UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."audit_critical_field_changes"();



COMMENT ON TRIGGER "audit_critical_contacts" ON "public"."contacts" IS 'Logs critical field changes: organization_id, deleted_at';



CREATE OR REPLACE TRIGGER "audit_critical_opportunities" AFTER UPDATE ON "public"."opportunities" FOR EACH ROW EXECUTE FUNCTION "public"."audit_critical_field_changes"();



COMMENT ON TRIGGER "audit_critical_opportunities" ON "public"."opportunities" IS 'Logs critical field changes: stage, account_manager_id, status, win_reason, loss_reason, deleted_at';



CREATE OR REPLACE TRIGGER "audit_critical_organizations" AFTER UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."audit_critical_field_changes"();



COMMENT ON TRIGGER "audit_critical_organizations" ON "public"."organizations" IS 'Logs critical field changes: organization_type, status, deleted_at';



CREATE OR REPLACE TRIGGER "audit_critical_sales" AFTER UPDATE ON "public"."sales" FOR EACH ROW EXECUTE FUNCTION "public"."audit_critical_field_changes"();



COMMENT ON TRIGGER "audit_critical_sales" ON "public"."sales" IS 'Logs critical field changes: role, disabled';



CREATE OR REPLACE TRIGGER "audit_opportunities_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."opportunities" FOR EACH ROW EXECUTE FUNCTION "public"."audit_changes"();



CREATE OR REPLACE TRIGGER "audit_organizations_changes" AFTER INSERT OR DELETE OR UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."audit_changes"();



CREATE OR REPLACE TRIGGER "cascade_activity_contact_trigger" BEFORE INSERT ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."cascade_activity_contact_from_opportunity"();



COMMENT ON TRIGGER "cascade_activity_contact_trigger" ON "public"."activities" IS 'Runs BEFORE INSERT to auto-fill contact_id from opportunity primary contact.
Executes before trigger_validate_activity_consistency (alphabetical order).
Cascade happens first, then validation verifies the contact is valid.';



CREATE OR REPLACE TRIGGER "cascade_notes_on_contact_delete" AFTER UPDATE OF "deleted_at" ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."cascade_soft_delete_to_notes"();



CREATE OR REPLACE TRIGGER "cascade_notes_on_opportunity_delete" AFTER UPDATE OF "deleted_at" ON "public"."opportunities" FOR EACH ROW EXECUTE FUNCTION "public"."cascade_soft_delete_to_notes"();



CREATE OR REPLACE TRIGGER "cascade_notes_on_organization_delete" AFTER UPDATE OF "deleted_at" ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."cascade_soft_delete_to_notes"();



CREATE OR REPLACE TRIGGER "check_organization_cycle" BEFORE INSERT OR UPDATE OF "parent_organization_id" ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."check_organization_cycle"();



CREATE OR REPLACE TRIGGER "check_parent_deletion" BEFORE DELETE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_parent_org_deletion"();



CREATE OR REPLACE TRIGGER "enforce_related_opportunity_principal" BEFORE INSERT OR UPDATE OF "related_opportunity_id", "principal_organization_id" ON "public"."opportunities" FOR EACH ROW WHEN (("new"."related_opportunity_id" IS NOT NULL)) EXECUTE FUNCTION "public"."validate_related_opportunity_principal"();



CREATE OR REPLACE TRIGGER "enforce_sales_column_restrictions_trigger" BEFORE UPDATE ON "public"."sales" FOR EACH ROW EXECUTE FUNCTION "public"."enforce_sales_column_restrictions"();



CREATE OR REPLACE TRIGGER "keep_is_admin_synced" BEFORE INSERT OR UPDATE ON "public"."sales" FOR EACH ROW EXECUTE FUNCTION "public"."sync_is_admin_from_role"();



COMMENT ON TRIGGER "keep_is_admin_synced" ON "public"."sales" IS 'Keeps is_admin column in sync with role column during transition period';



CREATE OR REPLACE TRIGGER "opportunities_version_increment" BEFORE UPDATE ON "public"."opportunities" FOR EACH ROW EXECUTE FUNCTION "public"."increment_opportunity_version"();



CREATE OR REPLACE TRIGGER "prevent_org_delete_with_active_opps" BEFORE UPDATE OF "deleted_at" ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."check_organization_delete_allowed"();



COMMENT ON TRIGGER "prevent_org_delete_with_active_opps" ON "public"."organizations" IS 'Prevents soft-delete of organizations with active opportunities (checks all 3 FK columns).';



CREATE OR REPLACE TRIGGER "prevent_parent_deletion" BEFORE DELETE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_parent_organization_deletion"();



CREATE OR REPLACE TRIGGER "products_search_update" BEFORE INSERT OR UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."products_search_trigger"();



CREATE OR REPLACE TRIGGER "protect_activities_audit" BEFORE UPDATE ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."protect_audit_fields"();



CREATE OR REPLACE TRIGGER "protect_contacts_audit" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."protect_audit_fields"();



CREATE OR REPLACE TRIGGER "protect_opportunities_audit" BEFORE UPDATE ON "public"."opportunities" FOR EACH ROW EXECUTE FUNCTION "public"."protect_audit_fields"();



CREATE OR REPLACE TRIGGER "protect_organizations_audit" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."protect_audit_fields"();



CREATE OR REPLACE TRIGGER "protect_products_audit" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."protect_audit_fields"();



CREATE OR REPLACE TRIGGER "set_default_segment_id_trigger" BEFORE INSERT ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."set_default_segment_id"();



CREATE OR REPLACE TRIGGER "set_opportunity_products_updated_at" BEFORE UPDATE ON "public"."opportunity_products" FOR EACH ROW EXECUTE FUNCTION "public"."update_opportunity_products_updated_at"();



CREATE OR REPLACE TRIGGER "set_organization_notes_updated_by" BEFORE UPDATE ON "public"."organization_notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_organization_notes_updated_by"();



CREATE OR REPLACE TRIGGER "set_product_features_updated_at" BEFORE UPDATE ON "public"."product_features" FOR EACH ROW EXECUTE FUNCTION "public"."update_product_features_updated_at"();



CREATE OR REPLACE TRIGGER "set_updated_by_contact_notes" BEFORE UPDATE ON "public"."contact_notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_by"();



CREATE OR REPLACE TRIGGER "set_updated_by_contacts" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_by"();



CREATE OR REPLACE TRIGGER "set_updated_by_opportunities" BEFORE UPDATE ON "public"."opportunities" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_by"();



CREATE OR REPLACE TRIGGER "set_updated_by_opportunity_notes" BEFORE UPDATE ON "public"."opportunity_notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_by"();



CREATE OR REPLACE TRIGGER "set_updated_by_organizations" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_by"();



CREATE OR REPLACE TRIGGER "set_updated_by_products" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_by"();



CREATE OR REPLACE TRIGGER "trg_cleanup_tag_references" AFTER UPDATE OF "deleted_at" ON "public"."tags" FOR EACH ROW EXECUTE FUNCTION "public"."cleanup_tag_references"();



CREATE OR REPLACE TRIGGER "trg_validate_opportunity_closure" BEFORE UPDATE ON "public"."opportunities" FOR EACH ROW WHEN (("new"."stage" = ANY (ARRAY['closed_won'::"public"."opportunity_stage", 'closed_lost'::"public"."opportunity_stage"]))) EXECUTE FUNCTION "public"."validate_opportunity_closure"();



COMMENT ON TRIGGER "trg_validate_opportunity_closure" ON "public"."opportunities" IS 'Enforces business rule: closed opportunities (won/lost) must have corresponding reason field populated. Fires on UPDATE when stage changes to closed_won or closed_lost.';



CREATE OR REPLACE TRIGGER "trg_validate_user_favorite_entity" BEFORE INSERT OR UPDATE OF "entity_type", "entity_id" ON "public"."user_favorites" FOR EACH ROW EXECUTE FUNCTION "public"."validate_user_favorite_entity"();



CREATE OR REPLACE TRIGGER "trigger_cleanup_old_notifications" AFTER INSERT ON "public"."notifications" FOR EACH STATEMENT EXECUTE FUNCTION "public"."cleanup_old_notifications"();



COMMENT ON TRIGGER "trigger_cleanup_old_notifications" ON "public"."notifications" IS 'Runs cleanup after each notification insert';



CREATE OR REPLACE TRIGGER "trigger_log_contact_org_linked" AFTER UPDATE ON "public"."contacts" FOR EACH ROW WHEN ((("old"."organization_id" IS DISTINCT FROM "new"."organization_id") AND ("new"."organization_id" IS NOT NULL))) EXECUTE FUNCTION "public"."log_contact_org_linked"();



COMMENT ON TRIGGER "trigger_log_contact_org_linked" ON "public"."contacts" IS 'Fires after contact organization_id is set to log timeline entry.';



CREATE OR REPLACE TRIGGER "trigger_log_contact_org_unlinked" AFTER UPDATE ON "public"."contacts" FOR EACH ROW WHEN ((("old"."organization_id" IS NOT NULL) AND ("new"."organization_id" IS NULL))) EXECUTE FUNCTION "public"."log_contact_org_unlinked"();



COMMENT ON TRIGGER "trigger_log_contact_org_unlinked" ON "public"."contacts" IS 'Fires after contact organization_id is cleared to log unlink timeline entry.';



CREATE OR REPLACE TRIGGER "trigger_log_opportunity_archived" AFTER UPDATE ON "public"."opportunities" FOR EACH ROW WHEN ((("old"."deleted_at" IS NULL) AND ("new"."deleted_at" IS NOT NULL))) EXECUTE FUNCTION "public"."log_opportunity_archived"();



COMMENT ON TRIGGER "trigger_log_opportunity_archived" ON "public"."opportunities" IS 'Fires after opportunity soft-delete to log archive timeline entry.';



CREATE OR REPLACE TRIGGER "trigger_log_opportunity_created" AFTER INSERT ON "public"."opportunities" FOR EACH ROW EXECUTE FUNCTION "public"."log_opportunity_created"();



COMMENT ON TRIGGER "trigger_log_opportunity_created" ON "public"."opportunities" IS 'Fires after opportunity creation to log timeline entry.';



CREATE OR REPLACE TRIGGER "trigger_log_opportunity_stage_change" AFTER UPDATE ON "public"."opportunities" FOR EACH ROW WHEN (("old"."stage" IS DISTINCT FROM "new"."stage")) EXECUTE FUNCTION "public"."log_opportunity_stage_change"();



COMMENT ON TRIGGER "trigger_log_opportunity_stage_change" ON "public"."opportunities" IS 'Fires after opportunity stage changes to create an activity audit record.';



CREATE OR REPLACE TRIGGER "trigger_log_task_completed" AFTER UPDATE ON "public"."activities" FOR EACH ROW WHEN ((("old"."activity_type" = 'task'::"public"."activity_type") AND ("old"."completed" IS DISTINCT FROM "new"."completed"))) EXECUTE FUNCTION "public"."log_task_completed"();



COMMENT ON TRIGGER "trigger_log_task_completed" ON "public"."activities" IS 'Fires after a task is completed to log timeline entry.';



CREATE OR REPLACE TRIGGER "trigger_set_activity_created_by" BEFORE INSERT ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."set_activity_created_by"();



CREATE OR REPLACE TRIGGER "trigger_set_contact_notes_updated_by" BEFORE UPDATE ON "public"."contact_notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_contact_notes_updated_by"();



CREATE OR REPLACE TRIGGER "trigger_set_founding_interaction" AFTER INSERT ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."set_founding_interaction"();



CREATE OR REPLACE TRIGGER "trigger_set_interaction_participant_created_by" BEFORE INSERT ON "public"."interaction_participants" FOR EACH ROW EXECUTE FUNCTION "public"."set_interaction_participant_created_by"();



CREATE OR REPLACE TRIGGER "trigger_set_opportunity_notes_updated_by" BEFORE UPDATE ON "public"."opportunity_notes" FOR EACH ROW EXECUTE FUNCTION "public"."set_opportunity_notes_updated_by"();



CREATE OR REPLACE TRIGGER "trigger_set_opportunity_owner_defaults" BEFORE INSERT ON "public"."opportunities" FOR EACH ROW EXECUTE FUNCTION "public"."set_opportunity_owner_defaults"();



CREATE OR REPLACE TRIGGER "trigger_set_opportunity_participant_created_by" BEFORE INSERT ON "public"."opportunity_participants" FOR EACH ROW EXECUTE FUNCTION "public"."set_opportunity_participant_created_by"();



CREATE OR REPLACE TRIGGER "trigger_update_contact_notes_updated_at" BEFORE UPDATE ON "public"."contact_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_contact_notes_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_contacts_search_tsv" BEFORE INSERT OR UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_search_tsv"();



CREATE OR REPLACE TRIGGER "trigger_update_opportunities_search_tsv" BEFORE INSERT OR UPDATE ON "public"."opportunities" FOR EACH ROW EXECUTE FUNCTION "public"."update_opportunities_search_tsv"();



CREATE OR REPLACE TRIGGER "trigger_update_opportunity_notes_updated_at" BEFORE UPDATE ON "public"."opportunity_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_opportunity_notes_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_opportunity_stage_changed_at" BEFORE UPDATE ON "public"."opportunities" FOR EACH ROW EXECUTE FUNCTION "public"."update_opportunity_stage_changed_at"();



COMMENT ON TRIGGER "trigger_update_opportunity_stage_changed_at" ON "public"."opportunities" IS 'Automatically updates stage_changed_at whenever the stage field is modified. Used to track how long opportunities have been in their current stage.';



CREATE OR REPLACE TRIGGER "trigger_update_organizations_search_tsv" BEFORE INSERT OR UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_organizations_search_tsv"();



CREATE OR REPLACE TRIGGER "trigger_update_products_search_tsv" BEFORE INSERT OR UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_search_tsv"();



CREATE OR REPLACE TRIGGER "trigger_validate_activity_consistency" BEFORE INSERT OR UPDATE ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."validate_activity_consistency"();



CREATE OR REPLACE TRIGGER "trigger_validate_opportunity_participants" BEFORE INSERT OR UPDATE ON "public"."opportunity_participants" FOR EACH ROW EXECUTE FUNCTION "public"."validate_opportunity_participants"();



CREATE OR REPLACE TRIGGER "update_activities_updated_at" BEFORE UPDATE ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_contacts_updated_at" BEFORE UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_distributor_principal_authorizations_updated_at" BEFORE UPDATE ON "public"."distributor_principal_authorizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_opportunities_updated_at" BEFORE UPDATE ON "public"."opportunities" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_opportunity_participants_updated_at" BEFORE UPDATE ON "public"."opportunity_participants" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_organization_distributors_updated_at" BEFORE UPDATE ON "public"."organization_distributors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_organization_notes_updated_at" BEFORE UPDATE ON "public"."organization_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_organization_notes_updated_at"();



CREATE OR REPLACE TRIGGER "update_organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_product_distributor_authorizations_updated_at" BEFORE UPDATE ON "public"."product_distributor_authorizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_product_distributors_updated_at" BEFORE UPDATE ON "public"."product_distributors" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sales_updated_at" BEFORE UPDATE ON "public"."sales" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_tags_updated_at" BEFORE UPDATE ON "public"."tags" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE SET NULL;



COMMENT ON CONSTRAINT "activities_opportunity_id_fkey" ON "public"."activities" IS 'Preserves activity record when opportunity deleted. Activity history remains queryable.';



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



COMMENT ON CONSTRAINT "activities_organization_id_fkey" ON "public"."activities" IS 'Preserves activity record when organization deleted.';



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_related_task_id_fkey" FOREIGN KEY ("related_task_id") REFERENCES "public"."activities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."audit_trail"
    ADD CONSTRAINT "audit_trail_changed_by_fkey" FOREIGN KEY ("changed_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."contact_notes"
    ADD CONSTRAINT "contact_notes_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."contact_notes"
    ADD CONSTRAINT "contact_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contact_notes"
    ADD CONSTRAINT "contact_notes_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contact_notes"
    ADD CONSTRAINT "contact_notes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."sales"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



COMMENT ON CONSTRAINT "contacts_organization_id_fkey" ON "public"."contacts" IS 'Prevents deletion of organizations with contacts. User must reassign contacts to another organization first.';



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."sales"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."dashboard_snapshots"
    ADD CONSTRAINT "dashboard_snapshots_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."distributor_principal_authorizations"
    ADD CONSTRAINT "distributor_principal_authorizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."distributor_principal_authorizations"
    ADD CONSTRAINT "distributor_principal_authorizations_distributor_id_fkey" FOREIGN KEY ("distributor_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."distributor_principal_authorizations"
    ADD CONSTRAINT "distributor_principal_authorizations_principal_id_fkey" FOREIGN KEY ("principal_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "fk_opportunities_principal_organization" FOREIGN KEY ("principal_organization_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



COMMENT ON CONSTRAINT "fk_opportunities_principal_organization" ON "public"."opportunities" IS 'Prevents deletion of principal organizations with active opportunities. Use soft-delete (deleted_at) to archive principals instead of hard delete. Per engineering constitution P13: soft-deletes with ON DELETE RESTRICT.';



ALTER TABLE ONLY "public"."product_distributors"
    ADD CONSTRAINT "fk_product_distributors_distributor" FOREIGN KEY ("distributor_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."product_distributors"
    ADD CONSTRAINT "fk_product_distributors_product" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."segments"
    ADD CONSTRAINT "industries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."interaction_participants"
    ADD CONSTRAINT "interaction_participants_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."interaction_participants"
    ADD CONSTRAINT "interaction_participants_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id");



ALTER TABLE ONLY "public"."interaction_participants"
    ADD CONSTRAINT "interaction_participants_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."interaction_participants"
    ADD CONSTRAINT "interaction_participants_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_account_manager_id_fkey" FOREIGN KEY ("account_manager_id") REFERENCES "public"."sales"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_customer_organization_id_fkey" FOREIGN KEY ("customer_organization_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



COMMENT ON CONSTRAINT "opportunities_customer_organization_id_fkey" ON "public"."opportunities" IS 'Prevents deletion of customer organizations with active opportunities. Every opportunity must have exactly one customer.';



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_distributor_organization_id_fkey" FOREIGN KEY ("distributor_organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



COMMENT ON CONSTRAINT "opportunities_distributor_organization_id_fkey" ON "public"."opportunities" IS 'Clears distributor reference if organization deleted. Distributor is optional metadata.';



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_founding_interaction_id_fkey" FOREIGN KEY ("founding_interaction_id") REFERENCES "public"."activities"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_opportunity_owner_id_fkey" FOREIGN KEY ("opportunity_owner_id") REFERENCES "public"."sales"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_primary_contact_id_fkey" FOREIGN KEY ("primary_contact_id") REFERENCES "public"."contacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_related_opportunity_id_fkey" FOREIGN KEY ("related_opportunity_id") REFERENCES "public"."opportunities"("id");



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."sales"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."opportunity_contacts"
    ADD CONSTRAINT "opportunity_contacts_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."opportunity_contacts"
    ADD CONSTRAINT "opportunity_contacts_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."opportunity_notes"
    ADD CONSTRAINT "opportunity_notes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."opportunity_notes"
    ADD CONSTRAINT "opportunity_notes_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."opportunity_notes"
    ADD CONSTRAINT "opportunity_notes_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."opportunity_notes"
    ADD CONSTRAINT "opportunity_notes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."sales"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."opportunity_participants"
    ADD CONSTRAINT "opportunity_participants_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."opportunity_participants"
    ADD CONSTRAINT "opportunity_participants_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."opportunity_participants"
    ADD CONSTRAINT "opportunity_participants_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."opportunity_products"
    ADD CONSTRAINT "opportunity_products_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."opportunity_products"
    ADD CONSTRAINT "opportunity_products_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."opportunity_products"
    ADD CONSTRAINT "opportunity_products_product_id_reference_fkey" FOREIGN KEY ("product_id_reference") REFERENCES "public"."products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."organization_distributors"
    ADD CONSTRAINT "organization_distributors_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."organization_distributors"
    ADD CONSTRAINT "organization_distributors_distributor_id_fkey" FOREIGN KEY ("distributor_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."organization_distributors"
    ADD CONSTRAINT "organization_distributors_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."organization_notes"
    ADD CONSTRAINT "organization_notes_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."organization_notes"
    ADD CONSTRAINT "organization_notes_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."organization_notes"
    ADD CONSTRAINT "organization_notes_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."sales"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_parent_organization_id_fkey" FOREIGN KEY ("parent_organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_playbook_category_id_fkey" FOREIGN KEY ("playbook_category_id") REFERENCES "public"."segments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "public"."segments"("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."sales"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."product_distributor_authorizations"
    ADD CONSTRAINT "product_distributor_authorizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."product_distributor_authorizations"
    ADD CONSTRAINT "product_distributor_authorizations_distributor_id_fkey" FOREIGN KEY ("distributor_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."product_distributor_authorizations"
    ADD CONSTRAINT "product_distributor_authorizations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."product_features"
    ADD CONSTRAINT "product_features_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."product_features"
    ADD CONSTRAINT "product_features_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_principal_id_fkey" FOREIGN KEY ("principal_id") REFERENCES "public"."organizations"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."segments"
    ADD CONSTRAINT "segments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."segments"("id");



ALTER TABLE ONLY "public"."user_favorites"
    ADD CONSTRAINT "user_favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can delete product_features" ON "public"."product_features" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "Admins can insert product_features" ON "public"."product_features" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can update product_features" ON "public"."product_features" FOR UPDATE USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Authenticated users can view product_features" ON "public"."product_features" FOR SELECT USING ((("auth"."uid"() IS NOT NULL) AND ("deleted_at" IS NULL)));



CREATE POLICY "Users can delete opportunity_contacts" ON "public"."opportunity_contacts" FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."opportunities" "o"
  WHERE (("o"."id" = "opportunity_contacts"."opportunity_id") AND (("o"."created_by" = "public"."get_current_sales_id"()) OR ("o"."opportunity_owner_id" = "public"."get_current_sales_id"()) OR ("o"."account_manager_id" = "public"."get_current_sales_id"()))))));



CREATE POLICY "Users can insert opportunity_contacts" ON "public"."opportunity_contacts" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."opportunities" "o"
  WHERE (("o"."id" = "opportunity_contacts"."opportunity_id") AND (("o"."created_by" = "public"."get_current_sales_id"()) OR ("o"."opportunity_owner_id" = "public"."get_current_sales_id"()) OR ("o"."account_manager_id" = "public"."get_current_sales_id"()))))));



CREATE POLICY "Users can update opportunity_contacts" ON "public"."opportunity_contacts" FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."opportunities" "o"
  WHERE (("o"."id" = "opportunity_contacts"."opportunity_id") AND (("o"."created_by" = "public"."get_current_sales_id"()) OR ("o"."opportunity_owner_id" = "public"."get_current_sales_id"()) OR ("o"."account_manager_id" = "public"."get_current_sales_id"()))))));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "activities_delete" ON "public"."activities" FOR DELETE TO "authenticated" USING ((("deleted_at" IS NULL) AND (( SELECT "public"."is_admin"() AS "is_admin") OR ( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR ("created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ("sales_id" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")))));



COMMENT ON POLICY "activities_delete" ON "public"."activities" IS 'Admin/Manager can delete all. Reps can only delete their own (created_by or sales_id).';



CREATE POLICY "activities_insert" ON "public"."activities" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR ("created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ("sales_id" = ( SELECT "public"."current_sales_id"() AS "current_sales_id"))));



COMMENT ON POLICY "activities_insert" ON "public"."activities" IS 'Admin/Manager can create for anyone. Reps can only create for themselves.';



CREATE POLICY "activities_select" ON "public"."activities" FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



COMMENT ON POLICY "activities_select" ON "public"."activities" IS 'All authenticated users can see all activities and tasks. Soft-delete filtered.';



CREATE POLICY "activities_service_role" ON "public"."activities" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "activities_update" ON "public"."activities" FOR UPDATE TO "authenticated" USING ((("deleted_at" IS NULL) AND (( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR ("created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ("sales_id" = ( SELECT "public"."current_sales_id"() AS "current_sales_id"))))) WITH CHECK ((( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR ("created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ("sales_id" = ( SELECT "public"."current_sales_id"() AS "current_sales_id"))));



COMMENT ON POLICY "activities_update" ON "public"."activities" IS 'Admin/Manager can update all. Reps can only update their own (created_by or sales_id).';



ALTER TABLE "public"."audit_trail" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "audit_trail_admin_manager_only" ON "public"."audit_trail" FOR SELECT TO "authenticated" USING ((( SELECT "public"."is_admin"() AS "is_admin") OR ( SELECT "public"."is_manager_or_admin"() AS "is_manager_or_admin")));



COMMENT ON POLICY "audit_trail_admin_manager_only" ON "public"."audit_trail" IS 'Audit trail restricted to admin/manager roles only. Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "authenticated_delete_distributor_principal_authorizations" ON "public"."distributor_principal_authorizations" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "authenticated_delete_organization_distributors" ON "public"."organization_distributors" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



COMMENT ON POLICY "authenticated_delete_organization_distributors" ON "public"."organization_distributors" IS 'All authenticated users can delete distributor relationships.
Soft-delete pattern: set deleted_at instead of hard delete.';



CREATE POLICY "authenticated_delete_product_distributor_authorizations" ON "public"."product_distributor_authorizations" FOR DELETE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "authenticated_insert_distributor_principal_authorizations" ON "public"."distributor_principal_authorizations" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "authenticated_insert_organization_distributors" ON "public"."organization_distributors" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



COMMENT ON POLICY "authenticated_insert_organization_distributors" ON "public"."organization_distributors" IS 'All authenticated users can create new distributor relationships.
Audit trail via created_by and created_at.';



CREATE POLICY "authenticated_insert_product_distributor_authorizations" ON "public"."product_distributor_authorizations" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "authenticated_select_dashboard_snapshots" ON "public"."dashboard_snapshots" FOR SELECT TO "authenticated" USING ((("sales_id" = "public"."current_sales_id"()) OR "public"."is_manager_or_admin"()));



CREATE POLICY "authenticated_select_distributor_principal_authorizations" ON "public"."distributor_principal_authorizations" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND (( SELECT "auth"."uid"() AS "uid") IS NOT NULL)));



CREATE POLICY "authenticated_select_organization_distributors" ON "public"."organization_distributors" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND (( SELECT "auth"."uid"() AS "uid") IS NOT NULL)));



COMMENT ON POLICY "authenticated_select_organization_distributors" ON "public"."organization_distributors" IS 'SELECT requires authentication AND soft-delete filter (DI-003)';



CREATE POLICY "authenticated_select_own_notifications" ON "public"."notifications" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



COMMENT ON POLICY "authenticated_select_own_notifications" ON "public"."notifications" IS 'SELECT requires user ownership AND soft-delete filter (DI-003)';



CREATE POLICY "authenticated_select_product_distributor_authorizations" ON "public"."product_distributor_authorizations" FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "authenticated_select_tags" ON "public"."tags" FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "authenticated_update_distributor_principal_authorizations" ON "public"."distributor_principal_authorizations" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



CREATE POLICY "authenticated_update_organization_distributors" ON "public"."organization_distributors" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



COMMENT ON POLICY "authenticated_update_organization_distributors" ON "public"."organization_distributors" IS 'All authenticated users can update distributor relationships.
Audit trail via updated_at.';



CREATE POLICY "authenticated_update_own_notifications" ON "public"."notifications" FOR UPDATE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "authenticated_update_product_distributor_authorizations" ON "public"."product_distributor_authorizations" FOR UPDATE TO "authenticated" USING ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL)) WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IS NOT NULL));



ALTER TABLE "public"."contact_notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contact_notes_insert_owner" ON "public"."contact_notes" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ("sales_id" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager")));



COMMENT ON POLICY "contact_notes_insert_owner" ON "public"."contact_notes" IS 'INSERT requires ownership (created_by or sales_id match) or manager/admin role. Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "contact_notes_select_role_based" ON "public"."contact_notes" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND (( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR ( SELECT "private"."can_access_by_role"("contact_notes"."sales_id", "contact_notes"."created_by") AS "can_access_by_role"))));



ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "contacts_insert_owner" ON "public"."contacts" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager")));



COMMENT ON POLICY "contacts_insert_owner" ON "public"."contacts" IS 'INSERT requires ownership (created_by = current user) or manager/admin role. Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "contacts_select_all" ON "public"."contacts" FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



COMMENT ON POLICY "contacts_select_all" ON "public"."contacts" IS 'All authenticated users can view all non-deleted contacts (shared visibility)';



CREATE POLICY "contacts_update_owner_or_privileged" ON "public"."contacts" FOR UPDATE TO "authenticated" USING (("deleted_at" IS NULL)) WITH CHECK ((("created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ("sales_id" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager")));



COMMENT ON POLICY "contacts_update_owner_or_privileged" ON "public"."contacts" IS 'UPDATE requires ownership (created_by or sales_id match) or manager/admin role. Uses (SELECT) wrappers for initPlan caching.';



ALTER TABLE "public"."dashboard_snapshots" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "delete_contact_notes_privileged_only" ON "public"."contact_notes" FOR DELETE TO "authenticated" USING (( SELECT "public"."is_manager_or_admin"() AS "is_manager_or_admin"));



COMMENT ON POLICY "delete_contact_notes_privileged_only" ON "public"."contact_notes" IS 'Only managers/admins can hard-delete notes. Use soft delete (deleted_at) normally. Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "delete_contacts" ON "public"."contacts" FOR DELETE TO "authenticated" USING (("deleted_at" IS NULL));



COMMENT ON POLICY "delete_contacts" ON "public"."contacts" IS 'All authenticated users can delete contacts. Only non-deleted records can be targeted (prevents re-deleting).';



CREATE POLICY "delete_opportunities" ON "public"."opportunities" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "delete_opportunity_notes_privileged_only" ON "public"."opportunity_notes" FOR DELETE USING ("public"."is_manager_or_admin"());



CREATE POLICY "delete_organization_notes_privileged_only" ON "public"."organization_notes" FOR DELETE USING ("public"."is_manager_or_admin"());



CREATE POLICY "delete_own" ON "public"."user_favorites" FOR DELETE TO "authenticated" USING (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "delete_products" ON "public"."products" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "delete_sales" ON "public"."sales" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



ALTER TABLE "public"."distributor_principal_authorizations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "insert_opportunities" ON "public"."opportunities" FOR INSERT TO "authenticated" WITH CHECK (("account_manager_id" = "public"."current_sales_id"()));



CREATE POLICY "insert_own" ON "public"."user_favorites" FOR INSERT TO "authenticated" WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "insert_sales" ON "public"."sales" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



ALTER TABLE "public"."interaction_participants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "interaction_participants_delete_policy" ON "public"."interaction_participants" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



COMMENT ON POLICY "interaction_participants_delete_policy" ON "public"."interaction_participants" IS 'Only admins can DELETE interaction participants. Use soft-delete (deleted_at) in application code.';



CREATE POLICY "interaction_participants_insert_owner" ON "public"."interaction_participants" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR (EXISTS ( SELECT 1
   FROM "public"."activities" "a"
  WHERE (("a"."id" = "interaction_participants"."activity_id") AND (("a"."created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ("a"."sales_id" = ( SELECT "public"."current_sales_id"() AS "current_sales_id"))))))));



COMMENT ON POLICY "interaction_participants_insert_owner" ON "public"."interaction_participants" IS 'INSERT requires ownership, manager/admin role, or ownership of parent activity. Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "interaction_participants_select_policy" ON "public"."interaction_participants" FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "interaction_participants_update_policy" ON "public"."interaction_participants" FOR UPDATE TO "authenticated" USING ((("created_by" = "public"."current_sales_id"()) OR "public"."owns_activity"("activity_id") OR "public"."is_manager_or_admin"())) WITH CHECK ((("created_by" = "public"."current_sales_id"()) OR "public"."owns_activity"("activity_id") OR "public"."is_manager_or_admin"()));



COMMENT ON POLICY "interaction_participants_update_policy" ON "public"."interaction_participants" IS 'UPDATE restricted to: record creator, activity owner, or managers/admins.';



ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."opportunities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "opportunities_select_all" ON "public"."opportunities" FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



COMMENT ON POLICY "opportunities_select_all" ON "public"."opportunities" IS 'All authenticated users can view all non-deleted opportunities (shared visibility)';



CREATE POLICY "opportunities_update_dual_ownership" ON "public"."opportunities" FOR UPDATE TO "authenticated" USING ((("deleted_at" IS NULL) AND (( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR ( SELECT "private"."can_access_by_role"("opportunities"."opportunity_owner_id", "opportunities"."created_by") AS "can_access_by_role") OR (("account_manager_id" IS NOT NULL) AND ( SELECT "private"."can_access_by_role"("opportunities"."account_manager_id", NULL::bigint) AS "can_access_by_role"))))) WITH CHECK ((( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR ( SELECT "private"."can_access_by_role"("opportunities"."opportunity_owner_id", "opportunities"."created_by") AS "can_access_by_role") OR (("account_manager_id" IS NOT NULL) AND ( SELECT "private"."can_access_by_role"("opportunities"."account_manager_id", NULL::bigint) AS "can_access_by_role"))));



ALTER TABLE "public"."opportunity_contacts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "opportunity_contacts_select_through_opportunities" ON "public"."opportunity_contacts" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."opportunities" "o"
  WHERE (("o"."id" = "opportunity_contacts"."opportunity_id") AND ("o"."deleted_at" IS NULL) AND ((EXISTS ( SELECT 1
           FROM ("public"."opportunity_participants" "op"
             JOIN "public"."sales" "s" ON (("s"."id" = "public"."get_current_sales_id"())))
          WHERE ("op"."opportunity_id" = "o"."id"))) OR ("o"."created_by" = "public"."get_current_sales_id"()) OR ("o"."opportunity_owner_id" = "public"."get_current_sales_id"()) OR ("o"."account_manager_id" = "public"."get_current_sales_id"())))))));



COMMENT ON POLICY "opportunity_contacts_select_through_opportunities" ON "public"."opportunity_contacts" IS 'SELECT via opportunity ownership with soft-delete filter (DI-003)';



ALTER TABLE "public"."opportunity_notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "opportunity_notes_insert_owner" ON "public"."opportunity_notes" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ("sales_id" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager")));



COMMENT ON POLICY "opportunity_notes_insert_owner" ON "public"."opportunity_notes" IS 'INSERT requires ownership (created_by or sales_id match) or manager/admin role. Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "opportunity_notes_select_role_based" ON "public"."opportunity_notes" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND (( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR ( SELECT "private"."can_access_by_role"("opportunity_notes"."sales_id", "opportunity_notes"."created_by") AS "can_access_by_role"))));



CREATE POLICY "opportunity_notes_update_owner_or_privileged" ON "public"."opportunity_notes" FOR UPDATE TO "authenticated" USING (("deleted_at" IS NULL)) WITH CHECK ((("created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ("sales_id" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager")));



COMMENT ON POLICY "opportunity_notes_update_owner_or_privileged" ON "public"."opportunity_notes" IS 'UPDATE requires ownership (created_by or sales_id match) or manager/admin role. Uses (SELECT) wrappers for initPlan caching.';



ALTER TABLE "public"."opportunity_participants" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "opportunity_participants_delete_policy" ON "public"."opportunity_participants" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



COMMENT ON POLICY "opportunity_participants_delete_policy" ON "public"."opportunity_participants" IS 'Only admins can DELETE participant records. Use soft-delete (deleted_at) in application code.';



CREATE POLICY "opportunity_participants_insert_validated" ON "public"."opportunity_participants" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."organizations"
  WHERE (("organizations"."id" = "opportunity_participants"."organization_id") AND ("organizations"."deleted_at" IS NULL)))) AND (("created_by" = "public"."current_sales_id"()) OR ( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR (EXISTS ( SELECT 1
   FROM "public"."opportunities" "o"
  WHERE (("o"."id" = "opportunity_participants"."opportunity_id") AND (("o"."created_by" = "public"."current_sales_id"()) OR ("o"."opportunity_owner_id" = "public"."current_sales_id"()) OR ("o"."account_manager_id" = "public"."current_sales_id"()))))))));



CREATE POLICY "opportunity_participants_select_policy" ON "public"."opportunity_participants" FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "opportunity_participants_update_validated" ON "public"."opportunity_participants" FOR UPDATE TO "authenticated" USING ((("created_by" = "public"."current_sales_id"()) OR "public"."owns_opportunity"("opportunity_id") OR "public"."is_manager_or_admin"())) WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."organizations"
  WHERE (("organizations"."id" = "opportunity_participants"."organization_id") AND ("organizations"."deleted_at" IS NULL)))) AND (("created_by" = "public"."current_sales_id"()) OR "public"."owns_opportunity"("opportunity_id") OR "public"."is_manager_or_admin"())));



ALTER TABLE "public"."opportunity_products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "opportunity_products_delete_authenticated" ON "public"."opportunity_products" FOR DELETE TO "authenticated" USING ((("deleted_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."opportunities" "o"
  WHERE (("o"."id" = "opportunity_products"."opportunity_id") AND ("o"."deleted_at" IS NULL))))));



COMMENT ON POLICY "opportunity_products_delete_authenticated" ON "public"."opportunity_products" IS 'All authenticated users can soft-delete products on non-deleted opportunities (team-shared access)';



CREATE POLICY "opportunity_products_insert_authenticated" ON "public"."opportunity_products" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM "public"."opportunities" "o"
  WHERE (("o"."id" = "opportunity_products"."opportunity_id") AND ("o"."deleted_at" IS NULL))))));



COMMENT ON POLICY "opportunity_products_insert_authenticated" ON "public"."opportunity_products" IS 'All authenticated users can add products to non-deleted opportunities (team-shared access)';



CREATE POLICY "opportunity_products_select_all" ON "public"."opportunity_products" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."opportunities" "o"
  WHERE (("o"."id" = "opportunity_products"."opportunity_id") AND ("o"."deleted_at" IS NULL))))));



COMMENT ON POLICY "opportunity_products_select_all" ON "public"."opportunity_products" IS 'All authenticated users can view products on non-deleted opportunities (team-shared visibility)';



CREATE POLICY "opportunity_products_update_authenticated" ON "public"."opportunity_products" FOR UPDATE TO "authenticated" USING ((("deleted_at" IS NULL) AND (EXISTS ( SELECT 1
   FROM "public"."opportunities" "o"
  WHERE (("o"."id" = "opportunity_products"."opportunity_id") AND ("o"."deleted_at" IS NULL)))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."opportunities" "o"
  WHERE (("o"."id" = "opportunity_products"."opportunity_id") AND ("o"."deleted_at" IS NULL)))));



COMMENT ON POLICY "opportunity_products_update_authenticated" ON "public"."opportunity_products" IS 'All authenticated users can update products on non-deleted opportunities (team-shared access)';



ALTER TABLE "public"."organization_distributors" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organization_notes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "organization_notes_insert_owner" ON "public"."organization_notes" FOR INSERT TO "authenticated" WITH CHECK ((("sales_id" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager")));



COMMENT ON POLICY "organization_notes_insert_owner" ON "public"."organization_notes" IS 'INSERT requires ownership (sales_id = current user) or manager/admin role. Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "organization_notes_select_role_based" ON "public"."organization_notes" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND (( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR ( SELECT "private"."can_access_by_role"("organization_notes"."sales_id", NULL::bigint) AS "can_access_by_role"))));



CREATE POLICY "organization_notes_update_owner_or_privileged" ON "public"."organization_notes" FOR UPDATE TO "authenticated" USING (("deleted_at" IS NULL)) WITH CHECK ((("sales_id" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager")));



COMMENT ON POLICY "organization_notes_update_owner_or_privileged" ON "public"."organization_notes" IS 'UPDATE requires ownership (sales_id match) or manager/admin role. Uses (SELECT) wrappers for initPlan caching.';



ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "organizations_delete_owner_or_admin" ON "public"."organizations" FOR DELETE TO "authenticated" USING ((("deleted_at" IS NULL) AND (("created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager"))));



CREATE POLICY "organizations_insert_owner" ON "public"."organizations" FOR INSERT TO "authenticated" WITH CHECK ((("created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager")));



COMMENT ON POLICY "organizations_insert_owner" ON "public"."organizations" IS 'INSERT requires ownership (created_by = current user) or manager/admin role. Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "organizations_select_all" ON "public"."organizations" FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



COMMENT ON POLICY "organizations_select_all" ON "public"."organizations" IS 'All authenticated users can view all non-deleted organizations (shared visibility)';



CREATE POLICY "organizations_update_role_based" ON "public"."organizations" FOR UPDATE TO "authenticated" USING ((("deleted_at" IS NULL) AND (( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR ( SELECT "private"."can_access_by_role"("organizations"."sales_id", "organizations"."created_by") AS "can_access_by_role")))) WITH CHECK ((( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR ( SELECT "private"."can_access_by_role"("organizations"."sales_id", "organizations"."created_by") AS "can_access_by_role")));



ALTER TABLE "public"."product_distributor_authorizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_distributors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "product_distributors_delete_dual_auth" ON "public"."product_distributors" FOR DELETE TO "authenticated" USING ((("deleted_at" IS NULL) AND (( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR ((EXISTS ( SELECT 1
   FROM "public"."products" "p"
  WHERE (("p"."id" = "product_distributors"."product_id") AND ("p"."deleted_at" IS NULL) AND ("p"."created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id"))))) AND (EXISTS ( SELECT 1
   FROM "public"."organizations" "o"
  WHERE (("o"."id" = "product_distributors"."distributor_id") AND ("o"."deleted_at" IS NULL) AND (("o"."created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ("o"."sales_id" = ( SELECT "public"."current_sales_id"() AS "current_sales_id"))))))))));



COMMENT ON POLICY "product_distributors_delete_dual_auth" ON "public"."product_distributors" IS 'DELETE requires soft-delete filter AND dual-authorization (ownership of both product and distributor) OR admin/manager privilege. Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "product_distributors_insert_dual_auth" ON "public"."product_distributors" FOR INSERT TO "authenticated" WITH CHECK ((( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR ((EXISTS ( SELECT 1
   FROM "public"."products" "p"
  WHERE (("p"."id" = "product_distributors"."product_id") AND ("p"."deleted_at" IS NULL) AND ("p"."created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id"))))) AND (EXISTS ( SELECT 1
   FROM "public"."organizations" "o"
  WHERE (("o"."id" = "product_distributors"."distributor_id") AND ("o"."deleted_at" IS NULL) AND (("o"."created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ("o"."sales_id" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")))))))));



COMMENT ON POLICY "product_distributors_insert_dual_auth" ON "public"."product_distributors" IS 'INSERT requires dual-authorization (ownership of both product and distributor) OR admin/manager privilege. Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "product_distributors_select_dual_auth" ON "public"."product_distributors" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND (( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR ((EXISTS ( SELECT 1
   FROM "public"."products" "p"
  WHERE (("p"."id" = "product_distributors"."product_id") AND ("p"."deleted_at" IS NULL) AND ("p"."created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id"))))) AND (EXISTS ( SELECT 1
   FROM "public"."organizations" "o"
  WHERE (("o"."id" = "product_distributors"."distributor_id") AND ("o"."deleted_at" IS NULL) AND (("o"."created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ("o"."sales_id" = ( SELECT "public"."current_sales_id"() AS "current_sales_id"))))))))));



COMMENT ON POLICY "product_distributors_select_dual_auth" ON "public"."product_distributors" IS 'SELECT requires soft-delete filter AND dual-authorization (access to both product and distributor) OR admin/manager privilege. Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "product_distributors_service_role_bypass" ON "public"."product_distributors" TO "service_role" USING (true) WITH CHECK (true);



COMMENT ON POLICY "product_distributors_service_role_bypass" ON "public"."product_distributors" IS 'Service role (Edge Functions) has full access for automated operations';



CREATE POLICY "product_distributors_update_dual_auth" ON "public"."product_distributors" FOR UPDATE TO "authenticated" USING ((("deleted_at" IS NULL) AND (( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR ((EXISTS ( SELECT 1
   FROM "public"."products" "p"
  WHERE (("p"."id" = "product_distributors"."product_id") AND ("p"."deleted_at" IS NULL) AND ("p"."created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id"))))) AND (EXISTS ( SELECT 1
   FROM "public"."organizations" "o"
  WHERE (("o"."id" = "product_distributors"."distributor_id") AND ("o"."deleted_at" IS NULL) AND (("o"."created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ("o"."sales_id" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")))))))))) WITH CHECK ((( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager") OR ((EXISTS ( SELECT 1
   FROM "public"."products" "p"
  WHERE (("p"."id" = "product_distributors"."product_id") AND ("p"."deleted_at" IS NULL) AND ("p"."created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id"))))) AND (EXISTS ( SELECT 1
   FROM "public"."organizations" "o"
  WHERE (("o"."id" = "product_distributors"."distributor_id") AND ("o"."deleted_at" IS NULL) AND (("o"."created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")) OR ("o"."sales_id" = ( SELECT "public"."current_sales_id"() AS "current_sales_id")))))))));



COMMENT ON POLICY "product_distributors_update_dual_auth" ON "public"."product_distributors" IS 'UPDATE requires soft-delete filter AND dual-authorization (ownership of both product and distributor) OR admin/manager privilege. Uses (SELECT) wrappers for initPlan caching.';



ALTER TABLE "public"."product_features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "products_insert_privileged" ON "public"."products" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager"));



COMMENT ON POLICY "products_insert_privileged" ON "public"."products" IS 'Products are reference data - only manager/admin can create. Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "products_update_privileged" ON "public"."products" FOR UPDATE TO "authenticated" USING (("deleted_at" IS NULL)) WITH CHECK ((( SELECT "public"."is_admin"() AS "is_admin") OR ("created_by" = ( SELECT "public"."current_sales_id"() AS "current_sales_id"))));



COMMENT ON POLICY "products_update_privileged" ON "public"."products" IS 'Products UPDATE requires admin or ownership. Uses (SELECT) wrappers for initPlan caching.';



ALTER TABLE "public"."sales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."segments" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "segments_delete_admin" ON "public"."segments" FOR DELETE TO "authenticated" USING ((("deleted_at" IS NULL) AND ( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager")));



COMMENT ON POLICY "segments_delete_admin" ON "public"."segments" IS 'DELETE requires soft-delete filter AND admin/manager privilege. Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "segments_insert_privileged" ON "public"."segments" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager"));



COMMENT ON POLICY "segments_insert_privileged" ON "public"."segments" IS 'Segments are reference data - only manager/admin can create. Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "segments_update_privileged" ON "public"."segments" FOR UPDATE TO "authenticated" USING (("deleted_at" IS NULL)) WITH CHECK (( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager"));



COMMENT ON POLICY "segments_update_privileged" ON "public"."segments" IS 'Segments are reference data - only manager/admin can update. Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "select_own" ON "public"."user_favorites" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



COMMENT ON POLICY "select_own" ON "public"."user_favorites" IS 'SELECT requires user ownership AND soft-delete filter (DI-003)';



CREATE POLICY "select_products" ON "public"."products" FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "select_sales" ON "public"."sales" FOR SELECT TO "authenticated" USING (("deleted_at" IS NULL));



CREATE POLICY "select_segments" ON "public"."segments" FOR SELECT TO "authenticated" USING ((("deleted_at" IS NULL) AND (( SELECT "auth"."uid"() AS "uid") IS NOT NULL)));



COMMENT ON POLICY "select_segments" ON "public"."segments" IS 'SELECT requires soft-delete filter AND authenticated user (reference data). Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "service_delete_old_notifications" ON "public"."notifications" FOR DELETE TO "service_role" USING (true);



CREATE POLICY "service_insert_notifications" ON "public"."notifications" FOR INSERT TO "service_role" WITH CHECK (true);



CREATE POLICY "service_role_full_access" ON "public"."sales" TO "service_role" USING (true) WITH CHECK (true);



COMMENT ON POLICY "service_role_full_access" ON "public"."sales" IS 'Allows service_role (Edge Functions) full access to sales table. Required for daily-digest and other background functions.';



ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "tags_delete_privileged" ON "public"."tags" FOR DELETE TO "authenticated" USING ("private"."is_admin_or_manager"());



COMMENT ON POLICY "tags_delete_privileged" ON "public"."tags" IS 'Tags are reference data - only manager/admin can delete';



CREATE POLICY "tags_insert_privileged" ON "public"."tags" FOR INSERT TO "authenticated" WITH CHECK (( SELECT "private"."is_admin_or_manager"() AS "is_admin_or_manager"));



COMMENT ON POLICY "tags_insert_privileged" ON "public"."tags" IS 'Tags are reference data - only manager/admin can create. Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "tags_service_role" ON "public"."tags" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "tags_soft_delete_authenticated" ON "public"."tags" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("public"."is_manager_or_admin"() OR ("deleted_at" IS NOT NULL)));



COMMENT ON POLICY "tags_soft_delete_authenticated" ON "public"."tags" IS 'Allows manager/admin full update access, and any authenticated user to soft-delete (set deleted_at)';



CREATE POLICY "update_contact_notes_owner_or_privileged" ON "public"."contact_notes" FOR UPDATE TO "authenticated" USING (("deleted_at" IS NULL)) WITH CHECK (( SELECT "public"."is_owner_or_privileged"("contact_notes"."created_by") AS "is_owner_or_privileged"));



COMMENT ON POLICY "update_contact_notes_owner_or_privileged" ON "public"."contact_notes" IS 'Only note creator or managers/admins can update. Soft-deleted notes are immutable. Uses (SELECT) wrappers for initPlan caching.';



CREATE POLICY "update_own" ON "public"."user_favorites" FOR UPDATE TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("deleted_at" IS NULL))) WITH CHECK (("user_id" = ( SELECT "auth"."uid"() AS "uid")));



COMMENT ON POLICY "update_own" ON "public"."user_favorites" IS 'Users can only update their own ACTIVE favorites. Soft-deleted records are immutable.';



CREATE POLICY "update_sales" ON "public"."sales" FOR UPDATE TO "authenticated" USING (("public"."is_admin"() OR ("user_id" = ( SELECT "auth"."uid"() AS "uid")))) WITH CHECK (("public"."is_admin"() OR ("user_id" = ( SELECT "auth"."uid"() AS "uid"))));



ALTER TABLE "public"."user_favorites" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";








GRANT USAGE ON SCHEMA "private" TO "authenticated";



REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO "anon";
GRANT ALL ON SCHEMA "public" TO "authenticated";
GRANT ALL ON SCHEMA "public" TO "service_role";


















































































































































































































GRANT ALL ON FUNCTION "private"."can_access_by_role"("record_sales_id" bigint, "record_created_by" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "private"."get_current_user_role"() TO "authenticated";



GRANT ALL ON FUNCTION "private"."is_admin_or_manager"() TO "authenticated";



GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."sales" TO "authenticated";
GRANT SELECT ON TABLE "public"."sales" TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_update_sale"("target_user_id" "uuid", "new_role" "public"."user_role", "new_disabled" boolean, "new_avatar" "text", "new_deleted_at" timestamp with time zone, "new_first_name" "text", "new_last_name" "text", "new_email" "text", "new_phone" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_update_sale"("target_user_id" "uuid", "new_role" "public"."user_role", "new_disabled" boolean, "new_avatar" "text", "new_deleted_at" timestamp with time zone, "new_first_name" "text", "new_last_name" "text", "new_email" "text", "new_phone" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."archive_contact_with_relations"("contact_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "public"."archive_opportunity_with_relations"("opp_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "public"."archive_organization_with_relations"("org_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "public"."check_authorization"("_distributor_id" bigint, "_principal_id" bigint, "_product_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "public"."check_authorization_batch"("_distributor_id" bigint, "_product_ids" bigint[], "_principal_ids" bigint[]) TO "authenticated";



GRANT ALL ON FUNCTION "public"."check_opportunity_concurrent_update"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_opportunity_concurrent_update"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_overdue_tasks"() TO "service_role";



GRANT ALL ON FUNCTION "public"."check_similar_opportunities"("p_name" "text", "p_threshold" double precision, "p_exclude_id" bigint, "p_limit" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."complete_task_with_followup"("p_task_id" bigint, "p_activity_data" "jsonb", "p_opportunity_stage" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."create_booth_visitor_opportunity"("_data" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "public"."create_product_with_distributors"("product_data" "jsonb", "distributors" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_product_with_distributors"("product_data" "jsonb", "distributors" "jsonb") TO "service_role";



REVOKE ALL ON FUNCTION "public"."exec_sql"("sql_query" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."exec_sql"("sql_query" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_daily_digest"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_daily_digest_v2"() TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_digest_opt_out_token"("p_sales_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_activity_log"("p_organization_id" bigint, "p_sales_id" bigint, "p_limit" integer) TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_current_sales_id"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_current_user_company_id"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_current_user_sales_id"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_digest_preference"() TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_duplicate_details"("p_contact_ids" bigint[]) TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_organization_descendants"("org_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_overdue_tasks_for_user"("p_sales_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_overdue_tasks_for_user"("p_sales_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_product_distributor_pricing"("p_product_id" bigint, "p_distributor_id" bigint) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_sale_by_id"("target_sale_id" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_sale_by_id"("target_sale_id" integer) TO "authenticated";



REVOKE ALL ON FUNCTION "public"."get_sale_by_user_id"("target_user_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_sale_by_user_id"("target_user_id" "uuid") TO "authenticated";



GRANT ALL ON FUNCTION "public"."get_stale_deals_for_user"("p_sales_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_stale_deals_for_user"("p_sales_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_tasks_due_today_for_user"("p_sales_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_tasks_due_today_for_user"("p_sales_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_digest_summary"("p_sales_id" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_digest_summary"("p_sales_id" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";



GRANT ALL ON FUNCTION "public"."handle_update_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_update_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_update_user"() TO "anon";



GRANT ALL ON FUNCTION "public"."is_product_authorized_for_distributor"("p_product_id" bigint, "p_distributor_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "public"."log_activity_with_task"("p_activity" "jsonb", "p_task" "jsonb") TO "authenticated";



GRANT ALL ON FUNCTION "public"."process_digest_opt_out"("p_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."process_digest_opt_out"("p_token" "text") TO "authenticated";



GRANT ALL ON FUNCTION "public"."set_primary_organization"("p_contact_id" bigint, "p_organization_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "public"."setup_test_user"("p_user_id" "uuid", "p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_is_admin" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."setup_test_user"("p_user_id" "uuid", "p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_is_admin" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."setup_test_user"("p_user_id" "uuid", "p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_is_admin" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."soft_delete_product"("product_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "public"."soft_delete_products"("product_ids" bigint[]) TO "authenticated";



GRANT ALL ON FUNCTION "public"."sync_opportunity_with_contacts"("p_opportunity_id" bigint, "p_contact_ids" bigint[]) TO "authenticated";



GRANT ALL ON FUNCTION "public"."sync_opportunity_with_products"("opportunity_data" "jsonb", "products_to_create" "jsonb", "products_to_update" "jsonb", "product_ids_to_delete" integer[], "expected_version" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_opportunity_with_products"("opportunity_data" "jsonb", "products_to_create" "jsonb", "products_to_update" "jsonb", "product_ids_to_delete" integer[], "expected_version" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."unarchive_contact_with_relations"("contact_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "public"."unarchive_opportunity_with_relations"("opp_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "public"."unarchive_organization_with_relations"("org_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "public"."update_digest_preference"("p_opt_in" boolean) TO "authenticated";






























GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."activities" TO "authenticated";
GRANT SELECT ON TABLE "public"."activities" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "public"."activities_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."contacts" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."opportunities" TO "authenticated";
GRANT SELECT ON TABLE "public"."opportunities" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."organizations" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."activities_summary" TO "authenticated";
GRANT SELECT ON TABLE "public"."activities_summary" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."activities_with_task_details" TO "authenticated";



GRANT SELECT ON TABLE "public"."audit_trail" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."audit_trail_audit_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."distributor_principal_authorizations" TO "authenticated";
GRANT ALL ON TABLE "public"."distributor_principal_authorizations" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."authorization_status" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."campaign_choices" TO "authenticated";



GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE "public"."contact_notes" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."contactNotes" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."contactNotes_id_seq" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."contacts_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."contacts_summary" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."contacts_with_account_manager" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dashboard_pipeline_summary" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dashboard_principal_summary" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."dashboard_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."dashboard_snapshots" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "public"."dashboard_snapshots_id_seq" TO "authenticated";
GRANT SELECT,USAGE ON SEQUENCE "public"."dashboard_snapshots_id_seq" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."distinct_opportunities_campaigns" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."products" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."distinct_product_categories" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."distributor_principal_authorizations_id_seq" TO "authenticated";
GRANT USAGE ON SEQUENCE "public"."distributor_principal_authorizations_id_seq" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."opportunity_notes" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."organization_notes" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."entity_timeline" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."interaction_participants" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."interaction_participants_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."notifications" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."notifications_id_seq" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."opportunities_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."opportunity_products" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."opportunities_summary" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."opportunityNotes" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."opportunityNotes_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."opportunity_contacts" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."opportunity_contacts_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."opportunity_participants" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."opportunity_participants_id_seq" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."opportunity_products_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."opportunity_stage_changes" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."organizationNotes" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."organizationNotes_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."organization_distributors" TO "authenticated";
GRANT ALL ON TABLE "public"."organization_distributors" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "public"."organization_distributors_id_seq" TO "authenticated";
GRANT USAGE ON SEQUENCE "public"."organization_distributors_id_seq" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."organization_primary_distributor" TO "authenticated";
GRANT SELECT ON TABLE "public"."organization_primary_distributor" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "public"."organizations_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."segments" TO "service_role";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."segments" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."organizations_summary" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."organizations_with_account_manager" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."principal_opportunities" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."principal_pipeline_summary" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."priority_tasks" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."product_distributor_authorizations" TO "authenticated";
GRANT ALL ON TABLE "public"."product_distributor_authorizations" TO "service_role";



GRANT SELECT,USAGE ON SEQUENCE "public"."product_distributor_authorizations_id_seq" TO "authenticated";
GRANT USAGE ON SEQUENCE "public"."product_distributor_authorizations_id_seq" TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."product_distributors" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."product_distributors_summary" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."product_features" TO "authenticated";



GRANT ALL ON SEQUENCE "public"."product_features_id_seq" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."products_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."products_summary" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."sales_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."tags" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."tags_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."user_favorites" TO "authenticated";



GRANT SELECT,USAGE ON SEQUENCE "public"."user_favorites_id_seq" TO "authenticated";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,USAGE ON SEQUENCES TO "authenticated";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT SELECT,INSERT,DELETE,UPDATE ON TABLES TO "authenticated";




























revoke delete on table "public"."activities" from "anon";

revoke insert on table "public"."activities" from "anon";

revoke references on table "public"."activities" from "anon";

revoke select on table "public"."activities" from "anon";

revoke trigger on table "public"."activities" from "anon";

revoke truncate on table "public"."activities" from "anon";

revoke update on table "public"."activities" from "anon";

revoke references on table "public"."activities" from "authenticated";

revoke trigger on table "public"."activities" from "authenticated";

revoke truncate on table "public"."activities" from "authenticated";

revoke delete on table "public"."activities" from "service_role";

revoke insert on table "public"."activities" from "service_role";

revoke references on table "public"."activities" from "service_role";

revoke trigger on table "public"."activities" from "service_role";

revoke truncate on table "public"."activities" from "service_role";

revoke update on table "public"."activities" from "service_role";

revoke delete on table "public"."audit_trail" from "anon";

revoke insert on table "public"."audit_trail" from "anon";

revoke references on table "public"."audit_trail" from "anon";

revoke select on table "public"."audit_trail" from "anon";

revoke trigger on table "public"."audit_trail" from "anon";

revoke truncate on table "public"."audit_trail" from "anon";

revoke update on table "public"."audit_trail" from "anon";

revoke delete on table "public"."audit_trail" from "authenticated";

revoke insert on table "public"."audit_trail" from "authenticated";

revoke references on table "public"."audit_trail" from "authenticated";

revoke trigger on table "public"."audit_trail" from "authenticated";

revoke truncate on table "public"."audit_trail" from "authenticated";

revoke update on table "public"."audit_trail" from "authenticated";

revoke delete on table "public"."audit_trail" from "service_role";

revoke insert on table "public"."audit_trail" from "service_role";

revoke references on table "public"."audit_trail" from "service_role";

revoke select on table "public"."audit_trail" from "service_role";

revoke trigger on table "public"."audit_trail" from "service_role";

revoke truncate on table "public"."audit_trail" from "service_role";

revoke update on table "public"."audit_trail" from "service_role";

revoke delete on table "public"."contact_notes" from "anon";

revoke insert on table "public"."contact_notes" from "anon";

revoke references on table "public"."contact_notes" from "anon";

revoke select on table "public"."contact_notes" from "anon";

revoke trigger on table "public"."contact_notes" from "anon";

revoke truncate on table "public"."contact_notes" from "anon";

revoke update on table "public"."contact_notes" from "anon";

revoke references on table "public"."contact_notes" from "authenticated";

revoke trigger on table "public"."contact_notes" from "authenticated";

revoke truncate on table "public"."contact_notes" from "authenticated";

revoke delete on table "public"."contact_notes" from "service_role";

revoke insert on table "public"."contact_notes" from "service_role";

revoke references on table "public"."contact_notes" from "service_role";

revoke select on table "public"."contact_notes" from "service_role";

revoke trigger on table "public"."contact_notes" from "service_role";

revoke truncate on table "public"."contact_notes" from "service_role";

revoke update on table "public"."contact_notes" from "service_role";

revoke delete on table "public"."contacts" from "anon";

revoke insert on table "public"."contacts" from "anon";

revoke references on table "public"."contacts" from "anon";

revoke select on table "public"."contacts" from "anon";

revoke trigger on table "public"."contacts" from "anon";

revoke truncate on table "public"."contacts" from "anon";

revoke update on table "public"."contacts" from "anon";

revoke references on table "public"."contacts" from "authenticated";

revoke trigger on table "public"."contacts" from "authenticated";

revoke truncate on table "public"."contacts" from "authenticated";

revoke delete on table "public"."contacts" from "service_role";

revoke insert on table "public"."contacts" from "service_role";

revoke references on table "public"."contacts" from "service_role";

revoke select on table "public"."contacts" from "service_role";

revoke trigger on table "public"."contacts" from "service_role";

revoke truncate on table "public"."contacts" from "service_role";

revoke update on table "public"."contacts" from "service_role";

revoke delete on table "public"."dashboard_snapshots" from "anon";

revoke insert on table "public"."dashboard_snapshots" from "anon";

revoke references on table "public"."dashboard_snapshots" from "anon";

revoke select on table "public"."dashboard_snapshots" from "anon";

revoke trigger on table "public"."dashboard_snapshots" from "anon";

revoke truncate on table "public"."dashboard_snapshots" from "anon";

revoke update on table "public"."dashboard_snapshots" from "anon";

revoke references on table "public"."dashboard_snapshots" from "authenticated";

revoke trigger on table "public"."dashboard_snapshots" from "authenticated";

revoke truncate on table "public"."dashboard_snapshots" from "authenticated";

revoke delete on table "public"."distributor_principal_authorizations" from "anon";

revoke insert on table "public"."distributor_principal_authorizations" from "anon";

revoke references on table "public"."distributor_principal_authorizations" from "anon";

revoke select on table "public"."distributor_principal_authorizations" from "anon";

revoke trigger on table "public"."distributor_principal_authorizations" from "anon";

revoke truncate on table "public"."distributor_principal_authorizations" from "anon";

revoke update on table "public"."distributor_principal_authorizations" from "anon";

revoke references on table "public"."distributor_principal_authorizations" from "authenticated";

revoke trigger on table "public"."distributor_principal_authorizations" from "authenticated";

revoke truncate on table "public"."distributor_principal_authorizations" from "authenticated";

revoke delete on table "public"."interaction_participants" from "anon";

revoke insert on table "public"."interaction_participants" from "anon";

revoke references on table "public"."interaction_participants" from "anon";

revoke select on table "public"."interaction_participants" from "anon";

revoke trigger on table "public"."interaction_participants" from "anon";

revoke truncate on table "public"."interaction_participants" from "anon";

revoke update on table "public"."interaction_participants" from "anon";

revoke references on table "public"."interaction_participants" from "authenticated";

revoke trigger on table "public"."interaction_participants" from "authenticated";

revoke truncate on table "public"."interaction_participants" from "authenticated";

revoke delete on table "public"."interaction_participants" from "service_role";

revoke insert on table "public"."interaction_participants" from "service_role";

revoke references on table "public"."interaction_participants" from "service_role";

revoke select on table "public"."interaction_participants" from "service_role";

revoke trigger on table "public"."interaction_participants" from "service_role";

revoke truncate on table "public"."interaction_participants" from "service_role";

revoke update on table "public"."interaction_participants" from "service_role";

revoke delete on table "public"."notifications" from "anon";

revoke insert on table "public"."notifications" from "anon";

revoke references on table "public"."notifications" from "anon";

revoke select on table "public"."notifications" from "anon";

revoke trigger on table "public"."notifications" from "anon";

revoke truncate on table "public"."notifications" from "anon";

revoke update on table "public"."notifications" from "anon";

revoke references on table "public"."notifications" from "authenticated";

revoke trigger on table "public"."notifications" from "authenticated";

revoke truncate on table "public"."notifications" from "authenticated";

revoke delete on table "public"."notifications" from "service_role";

revoke insert on table "public"."notifications" from "service_role";

revoke references on table "public"."notifications" from "service_role";

revoke select on table "public"."notifications" from "service_role";

revoke trigger on table "public"."notifications" from "service_role";

revoke truncate on table "public"."notifications" from "service_role";

revoke update on table "public"."notifications" from "service_role";

revoke delete on table "public"."opportunities" from "anon";

revoke insert on table "public"."opportunities" from "anon";

revoke references on table "public"."opportunities" from "anon";

revoke select on table "public"."opportunities" from "anon";

revoke trigger on table "public"."opportunities" from "anon";

revoke truncate on table "public"."opportunities" from "anon";

revoke update on table "public"."opportunities" from "anon";

revoke references on table "public"."opportunities" from "authenticated";

revoke trigger on table "public"."opportunities" from "authenticated";

revoke truncate on table "public"."opportunities" from "authenticated";

revoke delete on table "public"."opportunities" from "service_role";

revoke insert on table "public"."opportunities" from "service_role";

revoke references on table "public"."opportunities" from "service_role";

revoke trigger on table "public"."opportunities" from "service_role";

revoke truncate on table "public"."opportunities" from "service_role";

revoke update on table "public"."opportunities" from "service_role";

revoke delete on table "public"."opportunity_contacts" from "anon";

revoke insert on table "public"."opportunity_contacts" from "anon";

revoke references on table "public"."opportunity_contacts" from "anon";

revoke select on table "public"."opportunity_contacts" from "anon";

revoke trigger on table "public"."opportunity_contacts" from "anon";

revoke truncate on table "public"."opportunity_contacts" from "anon";

revoke update on table "public"."opportunity_contacts" from "anon";

revoke references on table "public"."opportunity_contacts" from "authenticated";

revoke trigger on table "public"."opportunity_contacts" from "authenticated";

revoke truncate on table "public"."opportunity_contacts" from "authenticated";

revoke delete on table "public"."opportunity_contacts" from "service_role";

revoke insert on table "public"."opportunity_contacts" from "service_role";

revoke references on table "public"."opportunity_contacts" from "service_role";

revoke select on table "public"."opportunity_contacts" from "service_role";

revoke trigger on table "public"."opportunity_contacts" from "service_role";

revoke truncate on table "public"."opportunity_contacts" from "service_role";

revoke update on table "public"."opportunity_contacts" from "service_role";

revoke delete on table "public"."opportunity_notes" from "anon";

revoke insert on table "public"."opportunity_notes" from "anon";

revoke references on table "public"."opportunity_notes" from "anon";

revoke select on table "public"."opportunity_notes" from "anon";

revoke trigger on table "public"."opportunity_notes" from "anon";

revoke truncate on table "public"."opportunity_notes" from "anon";

revoke update on table "public"."opportunity_notes" from "anon";

revoke references on table "public"."opportunity_notes" from "authenticated";

revoke trigger on table "public"."opportunity_notes" from "authenticated";

revoke truncate on table "public"."opportunity_notes" from "authenticated";

revoke delete on table "public"."opportunity_notes" from "service_role";

revoke insert on table "public"."opportunity_notes" from "service_role";

revoke references on table "public"."opportunity_notes" from "service_role";

revoke select on table "public"."opportunity_notes" from "service_role";

revoke trigger on table "public"."opportunity_notes" from "service_role";

revoke truncate on table "public"."opportunity_notes" from "service_role";

revoke update on table "public"."opportunity_notes" from "service_role";

revoke delete on table "public"."opportunity_participants" from "anon";

revoke insert on table "public"."opportunity_participants" from "anon";

revoke references on table "public"."opportunity_participants" from "anon";

revoke select on table "public"."opportunity_participants" from "anon";

revoke trigger on table "public"."opportunity_participants" from "anon";

revoke truncate on table "public"."opportunity_participants" from "anon";

revoke update on table "public"."opportunity_participants" from "anon";

revoke references on table "public"."opportunity_participants" from "authenticated";

revoke trigger on table "public"."opportunity_participants" from "authenticated";

revoke truncate on table "public"."opportunity_participants" from "authenticated";

revoke delete on table "public"."opportunity_participants" from "service_role";

revoke insert on table "public"."opportunity_participants" from "service_role";

revoke references on table "public"."opportunity_participants" from "service_role";

revoke select on table "public"."opportunity_participants" from "service_role";

revoke trigger on table "public"."opportunity_participants" from "service_role";

revoke truncate on table "public"."opportunity_participants" from "service_role";

revoke update on table "public"."opportunity_participants" from "service_role";

revoke delete on table "public"."opportunity_products" from "anon";

revoke insert on table "public"."opportunity_products" from "anon";

revoke references on table "public"."opportunity_products" from "anon";

revoke select on table "public"."opportunity_products" from "anon";

revoke trigger on table "public"."opportunity_products" from "anon";

revoke truncate on table "public"."opportunity_products" from "anon";

revoke update on table "public"."opportunity_products" from "anon";

revoke references on table "public"."opportunity_products" from "authenticated";

revoke trigger on table "public"."opportunity_products" from "authenticated";

revoke truncate on table "public"."opportunity_products" from "authenticated";

revoke delete on table "public"."opportunity_products" from "service_role";

revoke insert on table "public"."opportunity_products" from "service_role";

revoke references on table "public"."opportunity_products" from "service_role";

revoke select on table "public"."opportunity_products" from "service_role";

revoke trigger on table "public"."opportunity_products" from "service_role";

revoke truncate on table "public"."opportunity_products" from "service_role";

revoke update on table "public"."opportunity_products" from "service_role";

revoke delete on table "public"."organization_distributors" from "anon";

revoke insert on table "public"."organization_distributors" from "anon";

revoke references on table "public"."organization_distributors" from "anon";

revoke select on table "public"."organization_distributors" from "anon";

revoke trigger on table "public"."organization_distributors" from "anon";

revoke truncate on table "public"."organization_distributors" from "anon";

revoke update on table "public"."organization_distributors" from "anon";

revoke references on table "public"."organization_distributors" from "authenticated";

revoke trigger on table "public"."organization_distributors" from "authenticated";

revoke truncate on table "public"."organization_distributors" from "authenticated";

revoke delete on table "public"."organization_notes" from "anon";

revoke insert on table "public"."organization_notes" from "anon";

revoke references on table "public"."organization_notes" from "anon";

revoke select on table "public"."organization_notes" from "anon";

revoke trigger on table "public"."organization_notes" from "anon";

revoke truncate on table "public"."organization_notes" from "anon";

revoke update on table "public"."organization_notes" from "anon";

revoke references on table "public"."organization_notes" from "authenticated";

revoke trigger on table "public"."organization_notes" from "authenticated";

revoke truncate on table "public"."organization_notes" from "authenticated";

revoke delete on table "public"."organization_notes" from "service_role";

revoke insert on table "public"."organization_notes" from "service_role";

revoke references on table "public"."organization_notes" from "service_role";

revoke select on table "public"."organization_notes" from "service_role";

revoke trigger on table "public"."organization_notes" from "service_role";

revoke truncate on table "public"."organization_notes" from "service_role";

revoke update on table "public"."organization_notes" from "service_role";

revoke delete on table "public"."organizations" from "anon";

revoke insert on table "public"."organizations" from "anon";

revoke references on table "public"."organizations" from "anon";

revoke select on table "public"."organizations" from "anon";

revoke trigger on table "public"."organizations" from "anon";

revoke truncate on table "public"."organizations" from "anon";

revoke update on table "public"."organizations" from "anon";

revoke references on table "public"."organizations" from "authenticated";

revoke trigger on table "public"."organizations" from "authenticated";

revoke truncate on table "public"."organizations" from "authenticated";

revoke delete on table "public"."organizations" from "service_role";

revoke insert on table "public"."organizations" from "service_role";

revoke references on table "public"."organizations" from "service_role";

revoke select on table "public"."organizations" from "service_role";

revoke trigger on table "public"."organizations" from "service_role";

revoke truncate on table "public"."organizations" from "service_role";

revoke update on table "public"."organizations" from "service_role";

revoke delete on table "public"."product_distributor_authorizations" from "anon";

revoke insert on table "public"."product_distributor_authorizations" from "anon";

revoke references on table "public"."product_distributor_authorizations" from "anon";

revoke select on table "public"."product_distributor_authorizations" from "anon";

revoke trigger on table "public"."product_distributor_authorizations" from "anon";

revoke truncate on table "public"."product_distributor_authorizations" from "anon";

revoke update on table "public"."product_distributor_authorizations" from "anon";

revoke references on table "public"."product_distributor_authorizations" from "authenticated";

revoke trigger on table "public"."product_distributor_authorizations" from "authenticated";

revoke truncate on table "public"."product_distributor_authorizations" from "authenticated";

revoke delete on table "public"."product_distributors" from "anon";

revoke insert on table "public"."product_distributors" from "anon";

revoke references on table "public"."product_distributors" from "anon";

revoke select on table "public"."product_distributors" from "anon";

revoke trigger on table "public"."product_distributors" from "anon";

revoke truncate on table "public"."product_distributors" from "anon";

revoke update on table "public"."product_distributors" from "anon";

revoke references on table "public"."product_distributors" from "authenticated";

revoke trigger on table "public"."product_distributors" from "authenticated";

revoke truncate on table "public"."product_distributors" from "authenticated";

revoke delete on table "public"."product_distributors" from "service_role";

revoke insert on table "public"."product_distributors" from "service_role";

revoke references on table "public"."product_distributors" from "service_role";

revoke select on table "public"."product_distributors" from "service_role";

revoke trigger on table "public"."product_distributors" from "service_role";

revoke truncate on table "public"."product_distributors" from "service_role";

revoke update on table "public"."product_distributors" from "service_role";

revoke delete on table "public"."product_features" from "anon";

revoke insert on table "public"."product_features" from "anon";

revoke references on table "public"."product_features" from "anon";

revoke select on table "public"."product_features" from "anon";

revoke trigger on table "public"."product_features" from "anon";

revoke truncate on table "public"."product_features" from "anon";

revoke update on table "public"."product_features" from "anon";

revoke references on table "public"."product_features" from "authenticated";

revoke trigger on table "public"."product_features" from "authenticated";

revoke truncate on table "public"."product_features" from "authenticated";

revoke delete on table "public"."product_features" from "service_role";

revoke insert on table "public"."product_features" from "service_role";

revoke references on table "public"."product_features" from "service_role";

revoke select on table "public"."product_features" from "service_role";

revoke trigger on table "public"."product_features" from "service_role";

revoke truncate on table "public"."product_features" from "service_role";

revoke update on table "public"."product_features" from "service_role";

revoke delete on table "public"."products" from "anon";

revoke insert on table "public"."products" from "anon";

revoke references on table "public"."products" from "anon";

revoke select on table "public"."products" from "anon";

revoke trigger on table "public"."products" from "anon";

revoke truncate on table "public"."products" from "anon";

revoke update on table "public"."products" from "anon";

revoke references on table "public"."products" from "authenticated";

revoke trigger on table "public"."products" from "authenticated";

revoke truncate on table "public"."products" from "authenticated";

revoke delete on table "public"."products" from "service_role";

revoke insert on table "public"."products" from "service_role";

revoke references on table "public"."products" from "service_role";

revoke select on table "public"."products" from "service_role";

revoke trigger on table "public"."products" from "service_role";

revoke truncate on table "public"."products" from "service_role";

revoke update on table "public"."products" from "service_role";

revoke delete on table "public"."sales" from "anon";

revoke insert on table "public"."sales" from "anon";

revoke references on table "public"."sales" from "anon";

revoke select on table "public"."sales" from "anon";

revoke trigger on table "public"."sales" from "anon";

revoke truncate on table "public"."sales" from "anon";

revoke update on table "public"."sales" from "anon";

revoke references on table "public"."sales" from "authenticated";

revoke trigger on table "public"."sales" from "authenticated";

revoke truncate on table "public"."sales" from "authenticated";

revoke delete on table "public"."sales" from "service_role";

revoke insert on table "public"."sales" from "service_role";

revoke references on table "public"."sales" from "service_role";

revoke trigger on table "public"."sales" from "service_role";

revoke truncate on table "public"."sales" from "service_role";

revoke update on table "public"."sales" from "service_role";

revoke delete on table "public"."segments" from "anon";

revoke insert on table "public"."segments" from "anon";

revoke references on table "public"."segments" from "anon";

revoke select on table "public"."segments" from "anon";

revoke trigger on table "public"."segments" from "anon";

revoke truncate on table "public"."segments" from "anon";

revoke update on table "public"."segments" from "anon";

revoke references on table "public"."segments" from "authenticated";

revoke trigger on table "public"."segments" from "authenticated";

revoke truncate on table "public"."segments" from "authenticated";

revoke delete on table "public"."tags" from "anon";

revoke insert on table "public"."tags" from "anon";

revoke references on table "public"."tags" from "anon";

revoke select on table "public"."tags" from "anon";

revoke trigger on table "public"."tags" from "anon";

revoke truncate on table "public"."tags" from "anon";

revoke update on table "public"."tags" from "anon";

revoke references on table "public"."tags" from "authenticated";

revoke trigger on table "public"."tags" from "authenticated";

revoke truncate on table "public"."tags" from "authenticated";

revoke delete on table "public"."tags" from "service_role";

revoke insert on table "public"."tags" from "service_role";

revoke references on table "public"."tags" from "service_role";

revoke select on table "public"."tags" from "service_role";

revoke trigger on table "public"."tags" from "service_role";

revoke truncate on table "public"."tags" from "service_role";

revoke update on table "public"."tags" from "service_role";

revoke delete on table "public"."user_favorites" from "anon";

revoke insert on table "public"."user_favorites" from "anon";

revoke references on table "public"."user_favorites" from "anon";

revoke select on table "public"."user_favorites" from "anon";

revoke trigger on table "public"."user_favorites" from "anon";

revoke truncate on table "public"."user_favorites" from "anon";

revoke update on table "public"."user_favorites" from "anon";

revoke references on table "public"."user_favorites" from "authenticated";

revoke trigger on table "public"."user_favorites" from "authenticated";

revoke truncate on table "public"."user_favorites" from "authenticated";

revoke delete on table "public"."user_favorites" from "service_role";

revoke insert on table "public"."user_favorites" from "service_role";

revoke references on table "public"."user_favorites" from "service_role";

revoke select on table "public"."user_favorites" from "service_role";

revoke trigger on table "public"."user_favorites" from "service_role";

revoke truncate on table "public"."user_favorites" from "service_role";

revoke update on table "public"."user_favorites" from "service_role";

alter table "public"."user_favorites" drop constraint "user_favorites_entity_type_check";

alter table "public"."user_favorites" add constraint "user_favorites_entity_type_check" CHECK (((entity_type)::text = ANY ((ARRAY['contacts'::character varying, 'organizations'::character varying, 'opportunities'::character varying])::text[]))) not valid;

alter table "public"."user_favorites" validate constraint "user_favorites_entity_type_check";

CREATE TRIGGER on_auth_user_created AFTER INSERT OR UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated AFTER UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_update_user();

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


