-- Security hardening: Add explicit search_path to all flagged functions
-- Prevents schema injection attacks by explicitly binding function execution to public schema
-- Reference: https://supabase.com/docs/reference/cli/supabase-db-lint

-- 1. Harden deprecated_tasks_access_notice (LOW severity)
CREATE OR REPLACE FUNCTION public.deprecated_tasks_access_notice()
 RETURNS trigger
 LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RAISE NOTICE 'DEPRECATED: tasks_deprecated table accessed. Use activities table with activity_type=task instead.';
  RETURN NEW;
END;
$function$;

-- 2. Harden set_activity_created_by (MEDIUM severity - active trigger)
CREATE OR REPLACE FUNCTION public.set_activity_created_by()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Only set if not already provided
  IF NEW.created_by IS NULL THEN
    NEW.created_by := public.current_sales_id();
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Harden update_product_features_updated_at (LOW severity)
CREATE OR REPLACE FUNCTION public.update_product_features_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 4. Harden sync_opportunity_with_contacts (MEDIUM severity - active RPC)
CREATE OR REPLACE FUNCTION public.sync_opportunity_with_contacts(p_opportunity_id bigint, p_contact_ids bigint[])
 RETURNS void
 LANGUAGE plpgsql
SET search_path = public
AS $function$
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
$function$;
