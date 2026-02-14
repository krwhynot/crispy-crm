


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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "postgres";


CREATE TYPE "public"."activity_type" AS ENUM (
    'engagement',
    'interaction'
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
    'social'
);


ALTER TYPE "public"."interaction_type" OWNER TO "postgres";


CREATE TYPE "public"."opportunity_stage" AS ENUM (
    'new_lead',
    'initial_outreach',
    'sample_visit_offered',
    'awaiting_response',
    'feedback_logged',
    'demo_scheduled',
    'closed_won',
    'closed_lost'
);


ALTER TYPE "public"."opportunity_stage" OWNER TO "postgres";


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
    'principal',
    'distributor',
    'prospect',
    'partner',
    'unknown'
);


ALTER TYPE "public"."organization_type" OWNER TO "postgres";


CREATE TYPE "public"."pricing_model_type" AS ENUM (
    'fixed',
    'tiered',
    'volume',
    'subscription',
    'custom'
);


ALTER TYPE "public"."pricing_model_type" OWNER TO "postgres";


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


CREATE TYPE "public"."task_type" AS ENUM (
    'Call',
    'Email',
    'Meeting',
    'Follow-up',
    'Proposal',
    'Discovery',
    'Administrative',
    'None'
);


ALTER TYPE "public"."task_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_product_price"("p_product_id" bigint, "p_quantity" integer, "p_distributor_id" bigint DEFAULT NULL::bigint) RETURNS TABLE("unit_price" numeric, "total_price" numeric, "discount_applied" numeric, "tier_name" "text", "special_pricing" boolean)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_base_price NUMERIC;
    v_tier_price NUMERIC;
    v_tier_name TEXT;
    v_tier_discount NUMERIC;
    v_special_price NUMERIC;
    v_final_unit_price NUMERIC;
BEGIN
    SELECT list_price INTO v_base_price
    FROM products
    WHERE id = p_product_id;

    IF p_distributor_id IS NOT NULL THEN
        SELECT (special_pricing->>'unit_price')::NUMERIC INTO v_special_price
        FROM product_distributor_authorizations
        WHERE product_id = p_product_id
        AND distributor_id = p_distributor_id
        AND is_authorized = true
        AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE);
    END IF;

    SELECT
        ppt.unit_price,
        ppt.tier_name,
        ppt.discount_percent
    INTO v_tier_price, v_tier_name, v_tier_discount
    FROM product_pricing_tiers ppt
    WHERE ppt.product_id = p_product_id
    AND p_quantity >= ppt.min_quantity
    AND (ppt.max_quantity IS NULL OR p_quantity <= ppt.max_quantity)
    AND (ppt.expiration_date IS NULL OR ppt.expiration_date >= CURRENT_DATE)
    ORDER BY ppt.min_quantity DESC
    LIMIT 1;

    v_final_unit_price := COALESCE(v_special_price, v_tier_price, v_base_price);

    RETURN QUERY
    SELECT
        v_final_unit_price AS unit_price,
        v_final_unit_price * p_quantity AS total_price,
        COALESCE(v_tier_discount, 0) AS discount_applied,
        COALESCE(v_tier_name, 'Standard') AS tier_name,
        v_special_price IS NOT NULL AS special_pricing;
END;
$$;


ALTER FUNCTION "public"."calculate_product_price"("p_product_id" bigint, "p_quantity" integer, "p_distributor_id" bigint) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_product_availability"("p_product_id" bigint, "p_quantity" integer, "p_needed_date" "date" DEFAULT CURRENT_DATE) RETURNS TABLE("is_available" boolean, "quantity_available" integer, "can_fulfill_by" "date", "availability_notes" "text")
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_quantity_available INTEGER;
    v_lead_time INTEGER;
    v_is_seasonal BOOLEAN;
    v_in_season BOOLEAN;
    v_status product_status;
BEGIN
    SELECT
        COALESCE(pi.quantity_available, 0),
        p.lead_time_days,
        p.is_seasonal,
        CASE
            WHEN p.is_seasonal = false THEN true
            WHEN EXTRACT(MONTH FROM p_needed_date)::INTEGER BETWEEN
                p.season_start_month AND p.season_end_month THEN true
            ELSE false
        END,
        p.status
    INTO v_quantity_available, v_lead_time, v_is_seasonal, v_in_season, v_status
    FROM products p
    LEFT JOIN product_inventory pi ON p.id = pi.product_id
    WHERE p.id = p_product_id;

    RETURN QUERY
    SELECT
        v_quantity_available >= p_quantity AND v_in_season AND v_status = 'active' AS is_available,
        v_quantity_available AS quantity_available,
        CASE
            WHEN v_quantity_available >= p_quantity THEN p_needed_date
            ELSE p_needed_date + INTERVAL '1 day' * COALESCE(v_lead_time, 7)
        END::DATE AS can_fulfill_by,
        CASE
            WHEN v_status != 'active' THEN 'Product is ' || v_status
            WHEN NOT v_in_season THEN 'Product is out of season'
            WHEN v_quantity_available < p_quantity THEN
                'Insufficient inventory. ' || v_quantity_available || ' available, ' ||
                p_quantity || ' requested'
            ELSE 'Available'
        END AS availability_notes;
END;
$$;


ALTER FUNCTION "public"."check_product_availability"("p_product_id" bigint, "p_quantity" integer, "p_needed_date" "date") OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."get_contact_organizations"("p_contact_id" bigint) RETURNS TABLE("organization_id" bigint, "organization_name" "text", "is_primary" boolean, "is_primary_decision_maker" boolean)
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        co.organization_id,
        o.name,
        co.is_primary,
        co.is_primary_decision_maker
    FROM contact_organizations co
    JOIN organizations o ON o.id = co.organization_id
    WHERE co.contact_id = p_contact_id
    AND co.deleted_at IS NULL
    AND o.deleted_at IS NULL
    ORDER BY co.is_primary DESC, o.name;
END;
$$;


ALTER FUNCTION "public"."get_contact_organizations"("p_contact_id" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_contact_organizations"("p_contact_id" bigint) IS 'Returns all organizations associated with a contact, ordered by primary status';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."segments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."segments" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_segment"("p_name" "text") RETURNS SETOF "public"."segments"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  -- Try to insert, skip if duplicate
  INSERT INTO segments (name, created_by)
  VALUES (trim(p_name), auth.uid())
  ON CONFLICT (lower(name)) DO NOTHING;

  -- Return the record (new or existing)
  RETURN QUERY
  SELECT * FROM segments
  WHERE lower(name) = lower(trim(p_name));
END;
$$;


ALTER FUNCTION "public"."get_or_create_segment"("p_name" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_or_create_segment"("p_name" "text") IS 'Get or create a segment by name. Returns the segment record (new or existing). Case-insensitive lookup.';



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


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    INSERT INTO public.sales (user_id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."products_search_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        coalesce(NEW.name, '') || ' ' ||
        coalesce(NEW.sku, '') || ' ' ||
        coalesce(NEW.manufacturer_part_number, '') || ' ' ||
        coalesce(NEW.description, '') || ' ' ||
        coalesce(NEW.category::text, '') || ' ' ||
        coalesce(NEW.ingredients, '') || ' ' ||
        coalesce(NEW.marketing_description, '')
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."products_search_trigger"() OWNER TO "postgres";


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


CREATE OR REPLACE FUNCTION "public"."sync_contact_organizations"("p_contact_id" bigint, "p_organizations" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    org_record record;
BEGIN
    -- Delete existing associations (delete-then-insert pattern)
    DELETE FROM contact_organizations WHERE contact_id = p_contact_id;

    -- Insert new associations from JSONB payload
    FOR org_record IN
        SELECT
            (elem->>'organization_id')::bigint as organization_id,
            COALESCE((elem->>'is_primary')::boolean, false) as is_primary,
            COALESCE((elem->>'is_primary_decision_maker')::boolean, false) as is_primary_decision_maker,
            (elem->>'relationship_start_date')::date as relationship_start_date,
            (elem->>'relationship_end_date')::date as relationship_end_date,
            elem->>'notes' as notes
        FROM jsonb_array_elements(p_organizations) AS elem
    LOOP
        INSERT INTO contact_organizations (
            contact_id,
            organization_id,
            is_primary,
            is_primary_decision_maker,
            relationship_start_date,
            relationship_end_date,
            notes,
            created_at,
            updated_at
        ) VALUES (
            p_contact_id,
            org_record.organization_id,
            org_record.is_primary,
            org_record.is_primary_decision_maker,
            org_record.relationship_start_date,
            org_record.relationship_end_date,
            org_record.notes,
            now(),
            now()
        );
    END LOOP;
END;
$$;


ALTER FUNCTION "public"."sync_contact_organizations"("p_contact_id" bigint, "p_organizations" "jsonb") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_contact_organizations"("p_contact_id" bigint, "p_organizations" "jsonb") IS 'Syncs contact-organization relationships. Validation at API boundary only.';



CREATE OR REPLACE FUNCTION "public"."sync_opportunity_with_products"("opportunity_data" "jsonb", "products_to_create" "jsonb", "products_to_update" "jsonb", "product_ids_to_delete" integer[]) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
  opportunity_id BIGINT;
  updated_opportunity RECORD;
BEGIN
  INSERT INTO opportunities (
    id, name, description, opportunity_context, stage, priority, amount, probability,
    estimated_close_date, customer_organization_id, principal_organization_id,
    distributor_organization_id, contact_ids, opportunity_owner_id, index
  )
  VALUES (
    (opportunity_data->>'id')::BIGINT,
    opportunity_data->>'name',
    opportunity_data->>'description',
    opportunity_data->>'opportunity_context',
    (opportunity_data->>'stage')::opportunity_stage,
    (opportunity_data->>'priority')::priority_level,
    (opportunity_data->>'amount')::NUMERIC,
    (opportunity_data->>'probability')::INTEGER,
    (opportunity_data->>'estimated_close_date')::DATE,
    (opportunity_data->>'customer_organization_id')::BIGINT,
    (opportunity_data->>'principal_organization_id')::BIGINT,
    (opportunity_data->>'distributor_organization_id')::BIGINT,
    (opportunity_data->>'contact_ids')::BIGINT[],
    (opportunity_data->>'opportunity_owner_id')::BIGINT,
    (opportunity_data->>'index')::INTEGER
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    opportunity_context = EXCLUDED.opportunity_context,
    stage = EXCLUDED.stage,
    priority = EXCLUDED.priority,
    amount = EXCLUDED.amount,
    probability = EXCLUDED.probability,
    estimated_close_date = EXCLUDED.estimated_close_date,
    customer_organization_id = EXCLUDED.customer_organization_id,
    principal_organization_id = EXCLUDED.principal_organization_id,
    distributor_organization_id = EXCLUDED.distributor_organization_id,
    contact_ids = EXCLUDED.contact_ids,
    opportunity_owner_id = EXCLUDED.opportunity_owner_id,
    index = EXCLUDED.index,
    updated_at = NOW()
  RETURNING id INTO opportunity_id;

  IF JSONB_ARRAY_LENGTH(products_to_create) > 0 THEN
    INSERT INTO opportunity_products (
      opportunity_id, product_id_reference, product_name, product_category,
      quantity, unit_price, extended_price, notes
    )
    SELECT
      opportunity_id,
      (p->>'product_id_reference')::BIGINT,
      p->>'product_name',
      p->>'product_category',
      (p->>'quantity')::NUMERIC,
      (p->>'unit_price')::NUMERIC,
      (p->>'extended_price')::NUMERIC,
      p->>'notes'
    FROM JSONB_ARRAY_ELEMENTS(products_to_create) AS p;
  END IF;

  IF JSONB_ARRAY_LENGTH(products_to_update) > 0 THEN
    UPDATE opportunity_products op
    SET
      product_id_reference = (p->>'product_id_reference')::BIGINT,
      product_name = p->>'product_name',
      quantity = (p->>'quantity')::NUMERIC,
      unit_price = (p->>'unit_price')::NUMERIC,
      extended_price = (p->>'extended_price')::NUMERIC,
      notes = p->>'notes',
      updated_at = NOW()
    FROM JSONB_ARRAY_ELEMENTS(products_to_update) p
    WHERE op.id = (p->>'id')::BIGINT;
  END IF;

  IF ARRAY_LENGTH(product_ids_to_delete, 1) > 0 THEN
    DELETE FROM opportunity_products WHERE id = ANY(product_ids_to_delete);
  END IF;

  SELECT * FROM opportunities WHERE id = opportunity_id INTO updated_opportunity;
  RETURN TO_JSONB(updated_opportunity);
END;
$$;


ALTER FUNCTION "public"."sync_opportunity_with_products"("opportunity_data" "jsonb", "products_to_create" "jsonb", "products_to_update" "jsonb", "product_ids_to_delete" integer[]) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."sync_opportunity_with_products"("opportunity_data" "jsonb", "products_to_create" "jsonb", "products_to_update" "jsonb", "product_ids_to_delete" integer[]) IS 'Atomically synchronize opportunity and its product line items';



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


CREATE OR REPLACE FUNCTION "public"."update_products_search"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
    NEW.search_tsv := to_tsvector('english',
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.sku, '') || ' ' ||
        COALESCE(NEW.marketing_description, '')
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_products_search"() OWNER TO "postgres";


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
            -- REMOVED: opportunity_context (column doesn't exist)
        );
    ELSIF TG_TABLE_NAME = 'products' THEN
        NEW.search_tsv := to_tsvector('english',
            COALESCE(NEW.name, '') || ' ' ||
            COALESCE(NEW.description, '') || ' ' ||
            COALESCE(NEW.sku, '') || ' ' ||
            COALESCE(NEW.category::TEXT, '') || ' ' ||
            COALESCE(NEW.ingredients, '') || ' ' ||
            COALESCE(NEW.marketing_description, '') || ' ' ||
            COALESCE(NEW.manufacturer_part_number, '') || ' ' ||
            COALESCE(array_to_string(NEW.certifications, ' '), '') || ' ' ||
            COALESCE(array_to_string(NEW.allergens, ' '), '')
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_search_tsv"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_activity_consistency"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_opp_customer_id BIGINT;
    v_contact_org_id BIGINT;
BEGIN
    IF NEW.activity_type = 'interaction' AND NEW.opportunity_id IS NOT NULL THEN
        SELECT op.organization_id INTO v_opp_customer_id
        FROM opportunity_participants op
        WHERE op.opportunity_id = NEW.opportunity_id
          AND op.role = 'customer'
          AND op.is_primary = true
          AND op.deleted_at IS NULL
        LIMIT 1;

        IF NEW.contact_id IS NOT NULL THEN
            SELECT organization_id INTO v_contact_org_id
            FROM contact_organizations
            WHERE contact_id = NEW.contact_id
              AND organization_id = v_opp_customer_id
              AND deleted_at IS NULL
            LIMIT 1;

            IF v_contact_org_id IS NULL THEN
                RAISE WARNING 'Contact % is not associated with opportunity customer organization %',
                              NEW.contact_id, v_opp_customer_id;
            END IF;
        END IF;

        IF NEW.organization_id IS NULL THEN
            NEW.organization_id := v_opp_customer_id;
        END IF;
    END IF;

    IF NEW.activity_type = 'interaction' AND NEW.opportunity_id IS NOT NULL THEN
        UPDATE opportunities
        SET founding_interaction_id = NEW.id
        WHERE id = NEW.opportunity_id
          AND founding_interaction_id IS NULL;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_activity_consistency"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_opportunity_participants"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_org_type organization_type;
    v_is_principal BOOLEAN;
    v_is_distributor BOOLEAN;
    v_primary_count INTEGER;
BEGIN
    SELECT organization_type, is_principal, is_distributor
    INTO v_org_type, v_is_principal, v_is_distributor
    FROM organizations
    WHERE id = NEW.organization_id;

    IF NEW.role = 'principal' AND NOT v_is_principal THEN
        RAISE EXCEPTION 'Organization % is not marked as a principal', NEW.organization_id;
    END IF;

    IF NEW.role = 'distributor' AND NOT v_is_distributor THEN
        RAISE EXCEPTION 'Organization % is not marked as a distributor', NEW.organization_id;
    END IF;

    IF NEW.is_primary THEN
        SELECT COUNT(*) INTO v_primary_count
        FROM opportunity_participants
        WHERE opportunity_id = NEW.opportunity_id
          AND role = NEW.role
          AND is_primary = true
          AND deleted_at IS NULL
          AND id != COALESCE(NEW.id, -1);

        IF v_primary_count > 0 THEN
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



CREATE OR REPLACE FUNCTION "public"."validate_pricing_tiers"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
DECLARE
    v_overlap_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_overlap_count
    FROM product_pricing_tiers
    WHERE product_id = NEW.product_id
    AND id != COALESCE(NEW.id, -1)
    AND (
        (NEW.min_quantity BETWEEN min_quantity AND COALESCE(max_quantity, 999999)) OR
        (COALESCE(NEW.max_quantity, 999999) BETWEEN min_quantity AND COALESCE(max_quantity, 999999)) OR
        (min_quantity BETWEEN NEW.min_quantity AND COALESCE(NEW.max_quantity, 999999))
    )
    AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE);

    IF v_overlap_count > 0 THEN
        RAISE EXCEPTION 'Pricing tier quantities overlap with existing tiers';
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_pricing_tiers"() OWNER TO "postgres";


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
    CONSTRAINT "activities_sentiment_check" CHECK ((("sentiment")::"text" = ANY (ARRAY[('positive'::character varying)::"text", ('neutral'::character varying)::"text", ('negative'::character varying)::"text"]))),
    CONSTRAINT "check_has_contact_or_org" CHECK ((("contact_id" IS NOT NULL) OR ("organization_id" IS NOT NULL))),
    CONSTRAINT "check_interaction_has_opportunity" CHECK (((("activity_type" = 'interaction'::"public"."activity_type") AND ("opportunity_id" IS NOT NULL)) OR ("activity_type" = 'engagement'::"public"."activity_type")))
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."activities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."activities_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."activities_id_seq" OWNED BY "public"."activities"."id";



CREATE TABLE IF NOT EXISTS "public"."contactNotes" (
    "id" bigint NOT NULL,
    "contact_id" bigint NOT NULL,
    "text" "text" NOT NULL,
    "attachments" "text"[],
    "sales_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "date" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contactNotes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."contactNotes"."date" IS 'User-specified date/time for the note, separate from system-managed created_at';



CREATE SEQUENCE IF NOT EXISTS "public"."contactNotes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."contactNotes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."contactNotes_id_seq" OWNED BY "public"."contactNotes"."id";



CREATE TABLE IF NOT EXISTS "public"."contact_organizations" (
    "id" bigint NOT NULL,
    "contact_id" bigint NOT NULL,
    "organization_id" bigint NOT NULL,
    "is_primary" boolean DEFAULT false,
    "is_primary_decision_maker" boolean DEFAULT false,
    "relationship_start_date" "date" DEFAULT CURRENT_DATE,
    "relationship_end_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" bigint,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "valid_relationship_dates" CHECK ((("relationship_end_date" IS NULL) OR ("relationship_end_date" > "relationship_start_date")))
);


ALTER TABLE "public"."contact_organizations" OWNER TO "postgres";


COMMENT ON TABLE "public"."contact_organizations" IS 'DEPRECATED: Junction table for contact-organization relationships. New contacts should use contacts.organization_id directly. Kept for historical data only.';



CREATE SEQUENCE IF NOT EXISTS "public"."contact_organizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."contact_organizations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."contact_organizations_id_seq" OWNED BY "public"."contact_organizations"."id";



CREATE TABLE IF NOT EXISTS "public"."contact_preferred_principals" (
    "id" bigint NOT NULL,
    "contact_id" bigint NOT NULL,
    "principal_organization_id" bigint NOT NULL,
    "advocacy_strength" smallint DEFAULT 50,
    "last_interaction_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" bigint,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "contact_preferred_principals_advocacy_strength_check" CHECK ((("advocacy_strength" >= 0) AND ("advocacy_strength" <= 100)))
);


ALTER TABLE "public"."contact_preferred_principals" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."contact_preferred_principals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."contact_preferred_principals_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."contact_preferred_principals_id_seq" OWNED BY "public"."contact_preferred_principals"."id";



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
    "organization_id" bigint
);


ALTER TABLE "public"."contacts" OWNER TO "postgres";


COMMENT ON TABLE "public"."contacts" IS 'Backward compatibility removed - use contact_organizations for relationships';



COMMENT ON COLUMN "public"."contacts"."organization_id" IS 'Primary organization for this contact. Replaces many-to-many contact_organizations relationship.';



CREATE SEQUENCE IF NOT EXISTS "public"."contacts_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."contacts_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."contacts_id_seq" OWNED BY "public"."contacts"."id";



CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "organization_type" "public"."organization_type" DEFAULT 'unknown'::"public"."organization_type",
    "is_principal" boolean DEFAULT false,
    "is_distributor" boolean DEFAULT false,
    "parent_organization_id" bigint,
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
    "annual_revenue" numeric(15,2),
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
    "segment_id" "uuid",
    CONSTRAINT "organizations_priority_check" CHECK ((("priority")::"text" = ANY (ARRAY[('A'::character varying)::"text", ('B'::character varying)::"text", ('C'::character varying)::"text", ('D'::character varying)::"text"])))
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."organizations"."context_links" IS 'Array of related URLs or references stored as JSONB';



COMMENT ON COLUMN "public"."organizations"."description" IS 'Organization description or notes';



COMMENT ON COLUMN "public"."organizations"."tax_identifier" IS 'Tax identification number (EIN, VAT, etc.)';



COMMENT ON COLUMN "public"."organizations"."segment_id" IS 'Optional foreign key to segments table. NULL indicates segment is not specified. UI defaults to "Unknown" segment for better UX.';



CREATE OR REPLACE VIEW "public"."contacts_summary" AS
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
    "o"."name" AS "company_name"
   FROM ("public"."contacts" "c"
     LEFT JOIN "public"."organizations" "o" ON ((("o"."id" = "c"."organization_id") AND ("o"."deleted_at" IS NULL))))
  WHERE ("c"."deleted_at" IS NULL);


ALTER VIEW "public"."contacts_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."contacts_summary" IS 'Denormalized view of contacts with organization name. Uses direct contacts.organization_id relationship (not junction table).';



CREATE TABLE IF NOT EXISTS "public"."interaction_participants" (
    "id" bigint NOT NULL,
    "activity_id" bigint NOT NULL,
    "contact_id" bigint,
    "organization_id" bigint,
    "role" character varying(20) DEFAULT 'participant'::character varying,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "has_contact_or_org" CHECK ((("contact_id" IS NOT NULL) OR ("organization_id" IS NOT NULL)))
);


ALTER TABLE "public"."interaction_participants" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."interaction_participants_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."interaction_participants_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."interaction_participants_id_seq" OWNED BY "public"."interaction_participants"."id";



CREATE TABLE IF NOT EXISTS "public"."migration_history" (
    "id" bigint NOT NULL,
    "phase_number" "text" NOT NULL,
    "phase_name" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "started_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "error_message" "text",
    "rollback_sql" "text",
    "rows_affected" bigint,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."migration_history" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."migration_history_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."migration_history_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."migration_history_id_seq" OWNED BY "public"."migration_history"."id";



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
    "customer_organization_id" bigint,
    "principal_organization_id" bigint,
    "distributor_organization_id" bigint,
    "founding_interaction_id" bigint,
    "stage_manual" boolean DEFAULT false,
    "status_manual" boolean DEFAULT false,
    "next_action" "text",
    "next_action_date" "date",
    "competition" "text",
    "decision_criteria" "text",
    "contact_ids" bigint[] DEFAULT '{}'::bigint[],
    "opportunity_owner_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" bigint,
    "deleted_at" timestamp with time zone,
    "search_tsv" "tsvector",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "account_manager_id" bigint,
    "lead_source" "text",
    CONSTRAINT "opportunities_lead_source_check" CHECK (("lead_source" = ANY (ARRAY['referral'::"text", 'trade_show'::"text", 'website'::"text", 'cold_call'::"text", 'email_campaign'::"text", 'social_media'::"text", 'partner'::"text", 'existing_customer'::"text"])))
);


ALTER TABLE "public"."opportunities" OWNER TO "postgres";


COMMENT ON TABLE "public"."opportunities" IS 'Sales pipeline with multi-stakeholder support';



COMMENT ON COLUMN "public"."opportunities"."opportunity_owner_id" IS 'Sales representative who owns this opportunity';



COMMENT ON COLUMN "public"."opportunities"."tags" IS 'Array of tags for categorizing opportunities (e.g., urgent, big-deal, repeat-customer)';



COMMENT ON COLUMN "public"."opportunities"."account_manager_id" IS 'Foreign key to sales.id (bigint), references the account manager for this opportunity';



COMMENT ON COLUMN "public"."opportunities"."lead_source" IS 'How this opportunity was generated';



CREATE SEQUENCE IF NOT EXISTS "public"."opportunities_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."opportunities_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."opportunities_id_seq" OWNED BY "public"."opportunities"."id";



CREATE TABLE IF NOT EXISTS "public"."opportunityNotes" (
    "id" bigint NOT NULL,
    "opportunity_id" bigint NOT NULL,
    "text" "text" NOT NULL,
    "attachments" "text"[],
    "sales_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "date" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."opportunityNotes" OWNER TO "postgres";


COMMENT ON COLUMN "public"."opportunityNotes"."date" IS 'User-specified date/time for the note, separate from system-managed created_at';



CREATE SEQUENCE IF NOT EXISTS "public"."opportunityNotes_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."opportunityNotes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."opportunityNotes_id_seq" OWNED BY "public"."opportunityNotes"."id";



CREATE TABLE IF NOT EXISTS "public"."opportunity_participants" (
    "id" bigint NOT NULL,
    "opportunity_id" bigint NOT NULL,
    "organization_id" bigint NOT NULL,
    "role" character varying(20) NOT NULL,
    "is_primary" boolean DEFAULT false,
    "commission_rate" numeric(5,4),
    "territory" "text",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" bigint,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "opportunity_participants_commission_rate_check" CHECK ((("commission_rate" >= (0)::numeric) AND ("commission_rate" <= (1)::numeric))),
    CONSTRAINT "opportunity_participants_role_check" CHECK ((("role")::"text" = ANY (ARRAY[('customer'::character varying)::"text", ('principal'::character varying)::"text", ('distributor'::character varying)::"text", ('partner'::character varying)::"text", ('competitor'::character varying)::"text"])))
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



CREATE SEQUENCE IF NOT EXISTS "public"."organizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."organizations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."organizations_id_seq" OWNED BY "public"."organizations"."id";



CREATE OR REPLACE VIEW "public"."organizations_summary" AS
SELECT
    NULL::bigint AS "id",
    NULL::"text" AS "name",
    NULL::"public"."organization_type" AS "organization_type",
    NULL::boolean AS "is_principal",
    NULL::boolean AS "is_distributor",
    NULL::character varying(1) AS "priority",
    NULL::"uuid" AS "segment_id",
    NULL::numeric(15,2) AS "annual_revenue",
    NULL::integer AS "employee_count",
    NULL::"text" AS "phone",
    NULL::"text" AS "website",
    NULL::"text" AS "postal_code",
    NULL::"text" AS "city",
    NULL::"text" AS "state",
    NULL::"text" AS "description",
    NULL::timestamp with time zone AS "created_at",
    NULL::bigint AS "nb_opportunities",
    NULL::bigint AS "nb_contacts",
    NULL::timestamp with time zone AS "last_opportunity_activity";


ALTER VIEW "public"."organizations_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."organizations_summary" IS 'Denormalized view of organizations with counts and searchable fields. Includes phone, website, address fields for full-text search support.';



CREATE TABLE IF NOT EXISTS "public"."product_category_hierarchy" (
    "id" bigint NOT NULL,
    "category_name" "text" NOT NULL,
    "parent_category_id" bigint,
    "category_path" "text",
    "level" integer DEFAULT 0 NOT NULL,
    "display_order" integer DEFAULT 0,
    "icon" "text",
    "description" "text",
    "attributes" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_category_hierarchy" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."product_category_hierarchy_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."product_category_hierarchy_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."product_category_hierarchy_id_seq" OWNED BY "public"."product_category_hierarchy"."id";



CREATE TABLE IF NOT EXISTS "public"."product_distributor_authorizations" (
    "id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "distributor_id" bigint NOT NULL,
    "is_authorized" boolean DEFAULT true,
    "authorization_date" "date" DEFAULT CURRENT_DATE,
    "expiration_date" "date",
    "special_pricing" "jsonb",
    "territory_restrictions" "text"[],
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" bigint
);


ALTER TABLE "public"."product_distributor_authorizations" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."product_distributor_authorizations_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."product_distributor_authorizations_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."product_distributor_authorizations_id_seq" OWNED BY "public"."product_distributor_authorizations"."id";



CREATE TABLE IF NOT EXISTS "public"."product_features" (
    "id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "feature_name" "text" NOT NULL,
    "feature_value" "text",
    "display_order" integer DEFAULT 0,
    "is_highlighted" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_features" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."product_features_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."product_features_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."product_features_id_seq" OWNED BY "public"."product_features"."id";



CREATE TABLE IF NOT EXISTS "public"."product_pricing_models" (
    "id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "model_type" "public"."pricing_model_type" DEFAULT 'fixed'::"public"."pricing_model_type",
    "base_price" numeric(12,2),
    "min_price" numeric(12,2),
    "max_price" numeric(12,2),
    "pricing_rules" "jsonb",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" bigint
);


ALTER TABLE "public"."product_pricing_models" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."product_pricing_models_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."product_pricing_models_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."product_pricing_models_id_seq" OWNED BY "public"."product_pricing_models"."id";



CREATE TABLE IF NOT EXISTS "public"."product_pricing_tiers" (
    "id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "tier_name" "text",
    "min_quantity" integer NOT NULL,
    "max_quantity" integer,
    "unit_price" numeric(12,2) NOT NULL,
    "discount_percent" numeric(5,2),
    "discount_amount" numeric(12,2),
    "effective_date" "date" DEFAULT CURRENT_DATE,
    "expiration_date" "date",
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" bigint,
    CONSTRAINT "positive_price" CHECK (("unit_price" > (0)::numeric)),
    CONSTRAINT "positive_quantities" CHECK ((("min_quantity" > 0) AND (("max_quantity" IS NULL) OR ("max_quantity" >= "min_quantity")))),
    CONSTRAINT "valid_discount" CHECK ((("discount_percent" >= (0)::numeric) AND ("discount_percent" <= (100)::numeric)))
);


ALTER TABLE "public"."product_pricing_tiers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."product_pricing_tiers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."product_pricing_tiers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."product_pricing_tiers_id_seq" OWNED BY "public"."product_pricing_tiers"."id";



CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" bigint NOT NULL,
    "principal_id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "sku" "text" NOT NULL,
    "category" "public"."product_category" NOT NULL,
    "list_price" numeric(12,2),
    "status" "public"."product_status" DEFAULT 'active'::"public"."product_status",
    "certifications" "text"[],
    "allergens" "text"[],
    "ingredients" "text",
    "nutritional_info" "jsonb",
    "marketing_description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" bigint,
    "updated_by" bigint,
    "deleted_at" timestamp with time zone,
    "search_tsv" "tsvector",
    "currency_code" "text" DEFAULT 'USD'::"text",
    "unit_of_measure" "text" DEFAULT 'each'::"text",
    "manufacturer_part_number" "text",
    CONSTRAINT "check_currency_code" CHECK (("currency_code" ~ '^[A-Z]{3}$'::"text"))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON TABLE "public"."products" IS 'Products table - inventory features removed on 2025-10-17. Removed: minimum_order_quantity column, out_of_stock status. Dropped table: product_inventory';



COMMENT ON COLUMN "public"."products"."category" IS 'Primary category - sufficient for MVP organization without subcategory granularity';



CREATE SEQUENCE IF NOT EXISTS "public"."products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."products_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."products_id_seq" OWNED BY "public"."products"."id";



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
    "disabled" boolean DEFAULT false
);


ALTER TABLE "public"."sales" OWNER TO "postgres";


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
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tags" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."tags_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."tags_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."tags_id_seq" OWNED BY "public"."tags"."id";



CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" bigint NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "due_date" "date",
    "reminder_date" "date",
    "completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "priority" "public"."priority_level" DEFAULT 'medium'::"public"."priority_level",
    "contact_id" bigint,
    "opportunity_id" bigint,
    "sales_id" bigint,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "type" "public"."task_type" DEFAULT 'None'::"public"."task_type"
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tasks"."title" IS 'Brief title describing the task';



COMMENT ON COLUMN "public"."tasks"."description" IS 'Optional detailed description of the task';



COMMENT ON COLUMN "public"."tasks"."type" IS 'Category of task activity (Call, Email, Meeting, etc.)';



CREATE SEQUENCE IF NOT EXISTS "public"."tasks_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."tasks_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."tasks_id_seq" OWNED BY "public"."tasks"."id";



CREATE TABLE IF NOT EXISTS "public"."test_user_metadata" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "role" "text" NOT NULL,
    "created_by" "text" DEFAULT 'automated_script'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "last_sync_at" timestamp with time zone,
    "test_data_counts" "jsonb" DEFAULT '{"notes": 0, "tasks": 0, "contacts": 0, "activities": 0, "opportunities": 0, "organizations": 0}'::"jsonb",
    CONSTRAINT "test_user_metadata_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'sales_director'::"text", 'account_manager'::"text"])))
);


ALTER TABLE "public"."test_user_metadata" OWNER TO "postgres";


ALTER TABLE ONLY "public"."activities" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."activities_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."contactNotes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."contactNotes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."contact_organizations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."contact_organizations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."contact_preferred_principals" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."contact_preferred_principals_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."contacts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."contacts_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."interaction_participants" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."interaction_participants_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."migration_history" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."migration_history_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."opportunities" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."opportunities_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."opportunityNotes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."opportunityNotes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."opportunity_participants" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."opportunity_participants_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."organizations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."organizations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."product_category_hierarchy" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."product_category_hierarchy_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."product_distributor_authorizations" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."product_distributor_authorizations_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."product_features" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."product_features_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."product_pricing_models" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."product_pricing_models_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."product_pricing_tiers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."product_pricing_tiers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."products" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."products_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."sales" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."sales_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."tags" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tags_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."tasks" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tasks_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contactNotes"
    ADD CONSTRAINT "contactNotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_organizations"
    ADD CONSTRAINT "contact_organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_preferred_principals"
    ADD CONSTRAINT "contact_preferred_principals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."segments"
    ADD CONSTRAINT "industries_name_unique" UNIQUE ("name");



ALTER TABLE ONLY "public"."segments"
    ADD CONSTRAINT "industries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."interaction_participants"
    ADD CONSTRAINT "interaction_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."migration_history"
    ADD CONSTRAINT "migration_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunityNotes"
    ADD CONSTRAINT "opportunityNotes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."opportunity_participants"
    ADD CONSTRAINT "opportunity_participants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_category_hierarchy"
    ADD CONSTRAINT "product_category_hierarchy_category_name_key" UNIQUE ("category_name");



ALTER TABLE ONLY "public"."product_category_hierarchy"
    ADD CONSTRAINT "product_category_hierarchy_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_distributor_authorizations"
    ADD CONSTRAINT "product_distributor_authorizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_features"
    ADD CONSTRAINT "product_features_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_pricing_models"
    ADD CONSTRAINT "product_pricing_models_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_pricing_tiers"
    ADD CONSTRAINT "product_pricing_tiers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."test_user_metadata"
    ADD CONSTRAINT "test_user_metadata_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."contact_organizations"
    ADD CONSTRAINT "unique_contact_organization_active" EXCLUDE USING "btree" ("contact_id" WITH =, "organization_id" WITH =) WHERE (("deleted_at" IS NULL));



ALTER TABLE ONLY "public"."contact_preferred_principals"
    ADD CONSTRAINT "unique_contact_principal_active" UNIQUE ("contact_id", "principal_organization_id", "deleted_at");



ALTER TABLE ONLY "public"."product_distributor_authorizations"
    ADD CONSTRAINT "unique_product_distributor" UNIQUE ("product_id", "distributor_id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "unique_sku_per_principal" UNIQUE ("principal_id", "sku", "deleted_at");



ALTER TABLE ONLY "public"."test_user_metadata"
    ADD CONSTRAINT "unique_user_id" UNIQUE ("user_id");



COMMENT ON CONSTRAINT "unique_user_id" ON "public"."test_user_metadata" IS 'Ensures each user can only have one metadata record';



CREATE INDEX "idx_activities_contact" ON "public"."activities" USING "btree" ("contact_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_activities_date" ON "public"."activities" USING "btree" ("activity_date" DESC) WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_activities_follow_up" ON "public"."activities" USING "btree" ("follow_up_date") WHERE (("follow_up_required" = true) AND ("deleted_at" IS NULL));



CREATE INDEX "idx_activities_opportunity" ON "public"."activities" USING "btree" ("opportunity_id") WHERE (("deleted_at" IS NULL) AND ("opportunity_id" IS NOT NULL));



CREATE INDEX "idx_activities_organization" ON "public"."activities" USING "btree" ("organization_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_activities_type" ON "public"."activities" USING "btree" ("activity_type", "type") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_companies_deleted_at" ON "public"."organizations" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_companies_is_distributor" ON "public"."organizations" USING "btree" ("is_distributor") WHERE ("is_distributor" = true);



CREATE INDEX "idx_companies_is_principal" ON "public"."organizations" USING "btree" ("is_principal") WHERE ("is_principal" = true);



CREATE INDEX "idx_companies_organization_type" ON "public"."organizations" USING "btree" ("organization_type");



CREATE INDEX "idx_companies_parent_company_id" ON "public"."organizations" USING "btree" ("parent_organization_id") WHERE ("parent_organization_id" IS NOT NULL);



CREATE INDEX "idx_companies_priority" ON "public"."organizations" USING "btree" ("priority");



CREATE INDEX "idx_companies_sales_id" ON "public"."organizations" USING "btree" ("sales_id");



CREATE INDEX "idx_companies_search_tsv" ON "public"."organizations" USING "gin" ("search_tsv");



CREATE INDEX "idx_contact_notes_contact_id" ON "public"."contactNotes" USING "btree" ("contact_id");



CREATE INDEX "idx_contact_organizations_contact" ON "public"."contact_organizations" USING "btree" ("contact_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_contact_organizations_decision_makers" ON "public"."contact_organizations" USING "btree" ("organization_id", "is_primary_decision_maker") WHERE (("deleted_at" IS NULL) AND ("is_primary_decision_maker" = true));



CREATE INDEX "idx_contact_organizations_organization" ON "public"."contact_organizations" USING "btree" ("organization_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_contact_organizations_primary" ON "public"."contact_organizations" USING "btree" ("organization_id", "is_primary") WHERE (("deleted_at" IS NULL) AND ("is_primary" = true));



CREATE UNIQUE INDEX "idx_contact_organizations_unique_contact" ON "public"."contact_organizations" USING "btree" ("contact_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_contact_orgs_lookup" ON "public"."contact_organizations" USING "btree" ("contact_id", "is_primary" DESC, "created_at");



CREATE INDEX "idx_contact_preferred_principals_contact" ON "public"."contact_preferred_principals" USING "btree" ("contact_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_contact_preferred_principals_principal" ON "public"."contact_preferred_principals" USING "btree" ("principal_organization_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_contact_preferred_principals_strength" ON "public"."contact_preferred_principals" USING "btree" ("advocacy_strength") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_contacts_deleted_at" ON "public"."contacts" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_contacts_organization_id" ON "public"."contacts" USING "btree" ("organization_id");



CREATE INDEX "idx_contacts_sales_id" ON "public"."contacts" USING "btree" ("sales_id");



CREATE INDEX "idx_contacts_search_tsv" ON "public"."contacts" USING "gin" ("search_tsv");



CREATE INDEX "idx_interaction_participants_activity" ON "public"."interaction_participants" USING "btree" ("activity_id");



CREATE INDEX "idx_interaction_participants_contact" ON "public"."interaction_participants" USING "btree" ("contact_id");



CREATE INDEX "idx_interaction_participants_organization" ON "public"."interaction_participants" USING "btree" ("organization_id");



CREATE INDEX "idx_opportunities_account_manager" ON "public"."opportunities" USING "btree" ("account_manager_id");



CREATE INDEX "idx_opportunities_customer_org" ON "public"."opportunities" USING "btree" ("customer_organization_id");



CREATE INDEX "idx_opportunities_customer_organization_id" ON "public"."opportunities" USING "btree" ("customer_organization_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunities_deleted_at" ON "public"."opportunities" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunities_distributor_organization_id" ON "public"."opportunities" USING "btree" ("distributor_organization_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunities_estimated_close" ON "public"."opportunities" USING "btree" ("estimated_close_date");



CREATE INDEX "idx_opportunities_owner_id" ON "public"."opportunities" USING "btree" ("opportunity_owner_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunities_principal_org" ON "public"."opportunities" USING "btree" ("principal_organization_id") WHERE ("principal_organization_id" IS NOT NULL);



CREATE INDEX "idx_opportunities_principal_organization_id" ON "public"."opportunities" USING "btree" ("principal_organization_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunities_priority" ON "public"."opportunities" USING "btree" ("priority");



CREATE INDEX "idx_opportunities_search_tsv" ON "public"."opportunities" USING "gin" ("search_tsv");



CREATE INDEX "idx_opportunities_stage" ON "public"."opportunities" USING "btree" ("stage") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunities_status" ON "public"."opportunities" USING "btree" ("status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunities_tags" ON "public"."opportunities" USING "gin" ("tags");



CREATE INDEX "idx_opportunity_notes_opportunity_id" ON "public"."opportunityNotes" USING "btree" ("opportunity_id");



CREATE INDEX "idx_opportunity_participants_opp_id" ON "public"."opportunity_participants" USING "btree" ("opportunity_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunity_participants_org_id" ON "public"."opportunity_participants" USING "btree" ("organization_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_opportunity_participants_primary" ON "public"."opportunity_participants" USING "btree" ("opportunity_id", "role") WHERE (("is_primary" = true) AND ("deleted_at" IS NULL));



CREATE INDEX "idx_opportunity_participants_role" ON "public"."opportunity_participants" USING "btree" ("role") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_organizations_name" ON "public"."organizations" USING "btree" ("name") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_organizations_parent_company_id" ON "public"."organizations" USING "btree" ("parent_organization_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_organizations_search_tsv" ON "public"."organizations" USING "gin" ("search_tsv") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_pricing_tiers_effective" ON "public"."product_pricing_tiers" USING "btree" ("effective_date", "expiration_date");



CREATE INDEX "idx_pricing_tiers_product_id" ON "public"."product_pricing_tiers" USING "btree" ("product_id");



CREATE INDEX "idx_pricing_tiers_quantity" ON "public"."product_pricing_tiers" USING "btree" ("product_id", "min_quantity", "max_quantity");



CREATE INDEX "idx_product_auth_active" ON "public"."product_distributor_authorizations" USING "btree" ("is_authorized") WHERE ("is_authorized" = true);



CREATE INDEX "idx_product_auth_distributor_id" ON "public"."product_distributor_authorizations" USING "btree" ("distributor_id");



CREATE INDEX "idx_product_auth_product_id" ON "public"."product_distributor_authorizations" USING "btree" ("product_id");



CREATE INDEX "idx_products_category" ON "public"."products" USING "btree" ("category") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_products_principal_id" ON "public"."products" USING "btree" ("principal_id") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_products_search_tsv" ON "public"."products" USING "gin" ("search_tsv");



CREATE INDEX "idx_products_sku" ON "public"."products" USING "btree" ("sku") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_products_status" ON "public"."products" USING "btree" ("status") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_sales_disabled" ON "public"."sales" USING "btree" ("disabled") WHERE ("disabled" = false);



CREATE INDEX "idx_tasks_contact_id" ON "public"."tasks" USING "btree" ("contact_id");



CREATE INDEX "idx_tasks_due_date" ON "public"."tasks" USING "btree" ("due_date") WHERE ("completed" = false);



CREATE INDEX "idx_tasks_opportunity_id" ON "public"."tasks" USING "btree" ("opportunity_id");



CREATE INDEX "idx_tasks_reminder_date" ON "public"."tasks" USING "btree" ("reminder_date") WHERE ("completed" = false);



CREATE INDEX "idx_test_user_metadata_role" ON "public"."test_user_metadata" USING "btree" ("role");



CREATE INDEX "idx_test_user_metadata_user_id" ON "public"."test_user_metadata" USING "btree" ("user_id");



CREATE UNIQUE INDEX "industries_name_case_insensitive_idx" ON "public"."segments" USING "btree" ("lower"("name"));



CREATE OR REPLACE VIEW "public"."organizations_summary" AS
 SELECT "o"."id",
    "o"."name",
    "o"."organization_type",
    "o"."is_principal",
    "o"."is_distributor",
    "o"."priority",
    "o"."segment_id",
    "o"."annual_revenue",
    "o"."employee_count",
    "o"."phone",
    "o"."website",
    "o"."postal_code",
    "o"."city",
    "o"."state",
    "o"."description",
    "o"."created_at",
    "count"(DISTINCT "opp"."id") AS "nb_opportunities",
    "count"(DISTINCT "c"."id") AS "nb_contacts",
    "max"("opp"."updated_at") AS "last_opportunity_activity"
   FROM (("public"."organizations" "o"
     LEFT JOIN "public"."opportunities" "opp" ON (((("opp"."customer_organization_id" = "o"."id") OR ("opp"."principal_organization_id" = "o"."id") OR ("opp"."distributor_organization_id" = "o"."id")) AND ("opp"."deleted_at" IS NULL))))
     LEFT JOIN "public"."contacts" "c" ON ((("c"."organization_id" = "o"."id") AND ("c"."deleted_at" IS NULL))))
  WHERE ("o"."deleted_at" IS NULL)
  GROUP BY "o"."id";



CREATE OR REPLACE TRIGGER "products_search_update" BEFORE INSERT OR UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."products_search_trigger"();



CREATE OR REPLACE TRIGGER "trigger_update_contacts_search_tsv" BEFORE INSERT OR UPDATE ON "public"."contacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_search_tsv"();



CREATE OR REPLACE TRIGGER "trigger_update_opportunities_search_tsv" BEFORE INSERT OR UPDATE ON "public"."opportunities" FOR EACH ROW EXECUTE FUNCTION "public"."update_search_tsv"();



CREATE OR REPLACE TRIGGER "trigger_update_organizations_search_tsv" BEFORE INSERT OR UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_organizations_search_tsv"();



CREATE OR REPLACE TRIGGER "trigger_update_products_search_tsv" BEFORE INSERT OR UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_search_tsv"();



CREATE OR REPLACE TRIGGER "trigger_validate_activity_consistency" BEFORE INSERT OR UPDATE ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."validate_activity_consistency"();



CREATE OR REPLACE TRIGGER "trigger_validate_opportunity_participants" BEFORE INSERT OR UPDATE ON "public"."opportunity_participants" FOR EACH ROW EXECUTE FUNCTION "public"."validate_opportunity_participants"();



CREATE OR REPLACE TRIGGER "trigger_validate_pricing_tiers" BEFORE INSERT OR UPDATE ON "public"."product_pricing_tiers" FOR EACH ROW EXECUTE FUNCTION "public"."validate_pricing_tiers"();



CREATE OR REPLACE TRIGGER "validate_principal_organization_trigger" BEFORE INSERT OR UPDATE ON "public"."contact_preferred_principals" FOR EACH ROW EXECUTE FUNCTION "public"."validate_principal_organization"();



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id");



ALTER TABLE ONLY "public"."contactNotes"
    ADD CONSTRAINT "contactNotes_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contactNotes"
    ADD CONSTRAINT "contactNotes_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_organizations"
    ADD CONSTRAINT "contact_organizations_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_organizations"
    ADD CONSTRAINT "contact_organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."contact_preferred_principals"
    ADD CONSTRAINT "contact_preferred_principals_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."contact_preferred_principals"
    ADD CONSTRAINT "contact_preferred_principals_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."contacts"
    ADD CONSTRAINT "contacts_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."segments"
    ADD CONSTRAINT "industries_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."interaction_participants"
    ADD CONSTRAINT "interaction_participants_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."interaction_participants"
    ADD CONSTRAINT "interaction_participants_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id");



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_account_manager_id_fkey" FOREIGN KEY ("account_manager_id") REFERENCES "public"."sales"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."opportunities"
    ADD CONSTRAINT "opportunities_sales_id_fkey" FOREIGN KEY ("opportunity_owner_id") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."opportunityNotes"
    ADD CONSTRAINT "opportunityNotes_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."opportunityNotes"
    ADD CONSTRAINT "opportunityNotes_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."opportunity_participants"
    ADD CONSTRAINT "opportunity_participants_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."opportunity_participants"
    ADD CONSTRAINT "opportunity_participants_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_industry_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "public"."segments"("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_parent_organization_id_fkey" FOREIGN KEY ("parent_organization_id") REFERENCES "public"."organizations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."product_category_hierarchy"
    ADD CONSTRAINT "product_category_hierarchy_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "public"."product_category_hierarchy"("id");



ALTER TABLE ONLY "public"."product_distributor_authorizations"
    ADD CONSTRAINT "product_distributor_authorizations_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."product_distributor_authorizations"
    ADD CONSTRAINT "product_distributor_authorizations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_features"
    ADD CONSTRAINT "product_features_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_pricing_models"
    ADD CONSTRAINT "product_pricing_models_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."product_pricing_models"
    ADD CONSTRAINT "product_pricing_models_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_pricing_tiers"
    ADD CONSTRAINT "product_pricing_tiers_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."product_pricing_tiers"
    ADD CONSTRAINT "product_pricing_tiers_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_opportunity_id_fkey" FOREIGN KEY ("opportunity_id") REFERENCES "public"."opportunities"("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_sales_id_fkey" FOREIGN KEY ("sales_id") REFERENCES "public"."sales"("id");



ALTER TABLE ONLY "public"."test_user_metadata"
    ADD CONSTRAINT "test_user_metadata_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated read access" ON "public"."segments" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to create" ON "public"."segments" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Enable read for authenticated users on migration_history" ON "public"."migration_history" FOR SELECT TO "authenticated" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Test metadata readable by authenticated users" ON "public"."test_user_metadata" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Test metadata writable by service role" ON "public"."test_user_metadata" USING (("auth"."role"() = 'service_role'::"text"));



ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "authenticated_delete_activities" ON "public"."activities" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_contactNotes" ON "public"."contactNotes" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_contact_organizations" ON "public"."contact_organizations" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_contact_preferred_principals" ON "public"."contact_preferred_principals" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_contacts" ON "public"."contacts" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_interaction_participants" ON "public"."interaction_participants" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_opportunities" ON "public"."opportunities" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_opportunityNotes" ON "public"."opportunityNotes" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_opportunity_participants" ON "public"."opportunity_participants" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_organizations" ON "public"."organizations" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_product_category_hierarchy" ON "public"."product_category_hierarchy" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_product_distributor_authorizations" ON "public"."product_distributor_authorizations" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_product_features" ON "public"."product_features" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_product_pricing_models" ON "public"."product_pricing_models" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_product_pricing_tiers" ON "public"."product_pricing_tiers" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_products" ON "public"."products" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_sales" ON "public"."sales" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_tags" ON "public"."tags" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_delete_tasks" ON "public"."tasks" FOR DELETE TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_activities" ON "public"."activities" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_contactNotes" ON "public"."contactNotes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_contact_organizations" ON "public"."contact_organizations" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_contact_preferred_principals" ON "public"."contact_preferred_principals" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_contacts" ON "public"."contacts" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_interaction_participants" ON "public"."interaction_participants" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_opportunities" ON "public"."opportunities" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_opportunityNotes" ON "public"."opportunityNotes" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_opportunity_participants" ON "public"."opportunity_participants" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_organizations" ON "public"."organizations" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_product_category_hierarchy" ON "public"."product_category_hierarchy" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_product_distributor_authorizations" ON "public"."product_distributor_authorizations" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_product_features" ON "public"."product_features" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_product_pricing_models" ON "public"."product_pricing_models" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_product_pricing_tiers" ON "public"."product_pricing_tiers" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_products" ON "public"."products" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_sales" ON "public"."sales" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_tags" ON "public"."tags" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_insert_tasks" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_activities" ON "public"."activities" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_contactNotes" ON "public"."contactNotes" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_contact_organizations" ON "public"."contact_organizations" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_contact_preferred_principals" ON "public"."contact_preferred_principals" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_contacts" ON "public"."contacts" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_interaction_participants" ON "public"."interaction_participants" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_migration_history" ON "public"."migration_history" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_opportunities" ON "public"."opportunities" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_opportunityNotes" ON "public"."opportunityNotes" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_opportunity_participants" ON "public"."opportunity_participants" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_organizations" ON "public"."organizations" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_product_category_hierarchy" ON "public"."product_category_hierarchy" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_product_distributor_authorizations" ON "public"."product_distributor_authorizations" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_product_features" ON "public"."product_features" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_product_pricing_models" ON "public"."product_pricing_models" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_product_pricing_tiers" ON "public"."product_pricing_tiers" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_products" ON "public"."products" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_sales" ON "public"."sales" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_tags" ON "public"."tags" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_select_tasks" ON "public"."tasks" FOR SELECT TO "authenticated" USING (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_activities" ON "public"."activities" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_contactNotes" ON "public"."contactNotes" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_contact_organizations" ON "public"."contact_organizations" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_contact_preferred_principals" ON "public"."contact_preferred_principals" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_contacts" ON "public"."contacts" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_interaction_participants" ON "public"."interaction_participants" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_opportunities" ON "public"."opportunities" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_opportunityNotes" ON "public"."opportunityNotes" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_opportunity_participants" ON "public"."opportunity_participants" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_organizations" ON "public"."organizations" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_product_category_hierarchy" ON "public"."product_category_hierarchy" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_product_distributor_authorizations" ON "public"."product_distributor_authorizations" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_product_features" ON "public"."product_features" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_product_pricing_models" ON "public"."product_pricing_models" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_product_pricing_tiers" ON "public"."product_pricing_tiers" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_products" ON "public"."products" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_sales" ON "public"."sales" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_tags" ON "public"."tags" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "authenticated_update_tasks" ON "public"."tasks" FOR UPDATE TO "authenticated" USING (("auth"."uid"() IS NOT NULL)) WITH CHECK (("auth"."uid"() IS NOT NULL));



ALTER TABLE "public"."contactNotes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_preferred_principals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."interaction_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."migration_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."opportunities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."opportunityNotes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."opportunity_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_category_hierarchy" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_distributor_authorizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_features" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_pricing_models" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_pricing_tiers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."segments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."test_user_metadata" ENABLE ROW LEVEL SECURITY;


REVOKE USAGE ON SCHEMA "public" FROM PUBLIC;
GRANT ALL ON SCHEMA "public" TO "anon";
GRANT ALL ON SCHEMA "public" TO "authenticated";
GRANT ALL ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."segments" TO "service_role";
GRANT SELECT,INSERT,UPDATE ON TABLE "public"."segments" TO "authenticated";



GRANT ALL ON FUNCTION "public"."set_primary_organization"("p_contact_id" bigint, "p_organization_id" bigint) TO "authenticated";



GRANT ALL ON FUNCTION "public"."setup_test_user"("p_user_id" "uuid", "p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_is_admin" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."setup_test_user"("p_user_id" "uuid", "p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_is_admin" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."setup_test_user"("p_user_id" "uuid", "p_first_name" "text", "p_last_name" "text", "p_email" "text", "p_is_admin" boolean) TO "service_role";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."activities" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."activities_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."contactNotes" TO "authenticated";
GRANT SELECT ON TABLE "public"."contactNotes" TO "anon";



GRANT SELECT,USAGE ON SEQUENCE "public"."contactNotes_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."contact_organizations" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."contact_organizations_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."contact_preferred_principals" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."contact_preferred_principals_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."contacts" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."contacts_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."organizations" TO "authenticated";



GRANT SELECT ON TABLE "public"."contacts_summary" TO "authenticated";
GRANT SELECT ON TABLE "public"."contacts_summary" TO "service_role";
GRANT SELECT ON TABLE "public"."contacts_summary" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."interaction_participants" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."interaction_participants_id_seq" TO "authenticated";



GRANT SELECT ON TABLE "public"."migration_history" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."migration_history_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."opportunities" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."opportunities_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."opportunityNotes" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."opportunityNotes_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."opportunity_participants" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."opportunity_participants_id_seq" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."organizations_id_seq" TO "authenticated";



GRANT SELECT ON TABLE "public"."organizations_summary" TO "authenticated";
GRANT SELECT ON TABLE "public"."organizations_summary" TO "service_role";
GRANT SELECT ON TABLE "public"."organizations_summary" TO "anon";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."product_category_hierarchy" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."product_category_hierarchy_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."product_distributor_authorizations" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."product_distributor_authorizations_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."product_features" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."product_features_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."product_pricing_models" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."product_pricing_models_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."product_pricing_tiers" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."product_pricing_tiers_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."products" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."products_id_seq" TO "authenticated";



GRANT ALL ON TABLE "public"."sales" TO "authenticated";
GRANT SELECT ON TABLE "public"."sales" TO "anon";



GRANT SELECT,USAGE ON SEQUENCE "public"."sales_id_seq" TO "authenticated";



GRANT SELECT ON TABLE "public"."tags" TO "anon";
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."tags" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."tags_id_seq" TO "authenticated";



GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE "public"."tasks" TO "authenticated";



GRANT USAGE ON SEQUENCE "public"."tasks_id_seq" TO "authenticated";




RESET ALL;
