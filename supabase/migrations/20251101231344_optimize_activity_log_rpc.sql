-- Optimize Activity Log: Replace 5-query approach with single RPC
-- Engineering Constitution: BOY SCOUT RULE - improving performance

CREATE OR REPLACE FUNCTION get_activity_log(
  p_organization_id BIGINT DEFAULT NULL,
  p_sales_id BIGINT DEFAULT NULL,
  p_limit INTEGER DEFAULT 250
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    WITH activity_events AS (
      -- 1. Organization created events
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

      -- 2. Contact created events
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
      WHERE c.deleted_at IS NULL
        AND (
          p_organization_id IS NULL OR
          c.organization_id = p_organization_id
        )
        AND (p_sales_id IS NULL OR c.sales_id = p_sales_id)

      UNION ALL

      -- 3. Contact note created events
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
      WHERE cn.deleted_at IS NULL
        AND (
          p_organization_id IS NULL OR
          c.organization_id = p_organization_id
        )
        AND (p_sales_id IS NULL OR cn.sales_id = p_sales_id)

      UNION ALL

      -- 4. Opportunity created events
      SELECT
        CONCAT('opportunity.', opp.id, '.created') AS id,
        'Opportunity created' AS type,
        opp.customer_organization_id AS organization_id,
        NULL::BIGINT AS contact_id,
        opp.id AS opportunity_id,
        NULL::BIGINT AS contact_note_id,
        NULL::BIGINT AS opportunity_note_id,
        opp.sales_id,
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
          'sales_id', opp.sales_id
        ) AS opportunity,
        NULL::JSONB AS contact_note,
        NULL::JSONB AS opportunity_note
      FROM opportunities opp
      WHERE opp.deleted_at IS NULL
        AND (
          p_organization_id IS NULL OR
          opp.customer_organization_id = p_organization_id OR
          opp.principal_organization_id = p_organization_id OR
          opp.distributor_organization_id = p_organization_id
        )
        AND (p_sales_id IS NULL OR opp.sales_id = p_sales_id)

      UNION ALL

      -- 5. Opportunity note created events
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
      WHERE opn.deleted_at IS NULL
        AND (
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_activity_log(BIGINT, BIGINT, INTEGER) TO authenticated;

-- Add comment explaining the optimization
COMMENT ON FUNCTION get_activity_log IS 'Optimized activity log query - consolidates 5 queries into 1 server-side UNION ALL. Returns JSON array of activity events sorted by date DESC.';
