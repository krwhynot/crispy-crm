-- Fix: schema-qualify table references for empty search_path
-- Root cause: get_organization_descendants has SET "search_path" TO '' but
-- references 'organizations' without 'public.' prefix, causing resolution failure.
-- Pattern: matches complete_task_with_followup which uses public.{table} with empty search_path.
CREATE OR REPLACE FUNCTION "public"."get_organization_descendants"("org_id" bigint)
RETURNS bigint[]
LANGUAGE "sql" STABLE
SET "search_path" TO ''
AS $$
  SELECT COALESCE(
    (SELECT array_agg(id)
     FROM (
       WITH RECURSIVE descendants AS (
         SELECT id, parent_organization_id
         FROM public.organizations
         WHERE parent_organization_id = org_id
           AND deleted_at IS NULL
         UNION ALL
         SELECT o.id, o.parent_organization_id
         FROM public.organizations o
         JOIN descendants d ON o.parent_organization_id = d.id
         WHERE o.deleted_at IS NULL
       )
       SELECT id FROM descendants
     ) AS all_descendants),
    ARRAY[]::bigint[]
  );
$$;
