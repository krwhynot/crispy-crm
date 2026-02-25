-- Migration: Add get_campaign_report_stats RPC function
--
-- Returns campaign options, sales rep options, and activity type counts
-- as a single JSONB object for the Campaign Activity Report tab.
--
-- Parameters:
--   p_campaign TEXT (nullable) — filter to specific campaign, or NULL for all
--
-- Returns: JSONB with keys: campaign_options, sales_rep_options, activity_type_counts

CREATE OR REPLACE FUNCTION "public"."get_campaign_report_stats"(
  "p_campaign" "text" DEFAULT NULL::"text"
) RETURNS "jsonb"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT jsonb_build_object(
    -- Campaign options: always returns ALL campaigns (unfiltered) so the dropdown
    -- always shows the full list regardless of which campaign is selected.
    'campaign_options', COALESCE((
      SELECT jsonb_agg(row_to_json(c) ORDER BY c.count DESC)
      FROM (
        SELECT campaign AS name, count(*)::int AS "count"
        FROM opportunities
        WHERE campaign IS NOT NULL AND deleted_at IS NULL
        GROUP BY campaign
      ) c
    ), '[]'::jsonb),

    -- Sales rep options: filtered by p_campaign when provided.
    -- Only includes reps who have activities linked to opportunities.
    'sales_rep_options', COALESCE((
      SELECT jsonb_agg(row_to_json(r) ORDER BY r.count DESC)
      FROM (
        SELECT s.id, (s.first_name || ' ' || s.last_name) AS name, count(a.id)::int AS "count"
        FROM sales s
        JOIN activities a ON a.created_by = s.id
          AND a.activity_type = 'activity'
          AND a.deleted_at IS NULL
          AND EXISTS (
            SELECT 1 FROM opportunities o
            WHERE o.id = a.opportunity_id
              AND o.deleted_at IS NULL
              AND (p_campaign IS NULL OR o.campaign = p_campaign)
          )
        WHERE s.deleted_at IS NULL AND s.disabled = false
        GROUP BY s.id, s.first_name, s.last_name
      ) r
    ), '[]'::jsonb),

    -- Activity type counts: filtered by p_campaign when provided.
    -- Only counts activities linked to non-deleted opportunities.
    'activity_type_counts', COALESCE((
      SELECT jsonb_object_agg(t.type, t.cnt)
      FROM (
        SELECT a.type::text, count(*)::int AS cnt
        FROM activities a
        WHERE a.activity_type = 'activity'
          AND a.deleted_at IS NULL
          AND EXISTS (
            SELECT 1 FROM opportunities o
            WHERE o.id = a.opportunity_id
              AND o.deleted_at IS NULL
              AND (p_campaign IS NULL OR o.campaign = p_campaign)
          )
        GROUP BY a.type
      ) t
    ), '{}'::jsonb)
  );
$$;
