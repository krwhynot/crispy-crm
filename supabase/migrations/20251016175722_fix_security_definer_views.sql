-- Remove SECURITY DEFINER from views to follow security best practices
-- Views should use the permissions of the querying user, not the view creator

-- Drop and recreate contacts_summary view WITHOUT SECURITY DEFINER
DROP VIEW IF EXISTS public.contacts_summary CASCADE;

CREATE VIEW public.contacts_summary AS
 SELECT c.id,
    c.name,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.title,
    c.department,
    c.address,
    c.city,
    c.state,
    c.postal_code,
    c.country,
    c.birthday,
    c.linkedin_url,
    c.twitter_handle,
    c.notes,
    c.sales_id,
    c.created_at,
    c.updated_at,
    c.created_by,
    c.deleted_at,
    c.search_tsv,
    c.first_seen,
    c.last_seen,
    c.gender,
    c.tags,
    c.organization_id,
    o.name AS company_name
   FROM (public.contacts c
     LEFT JOIN public.organizations o ON (((o.id = c.organization_id) AND (o.deleted_at IS NULL))))
  WHERE (c.deleted_at IS NULL);

-- Set proper ownership
ALTER VIEW public.contacts_summary OWNER TO postgres;

-- Add comment for documentation
COMMENT ON VIEW public.contacts_summary IS 'Denormalized view of contacts with organization name. Uses direct contacts.organization_id relationship (not junction table).';

-- Drop and recreate organizations_summary view WITHOUT SECURITY DEFINER
DROP VIEW IF EXISTS public.organizations_summary CASCADE;

CREATE VIEW public.organizations_summary AS
 SELECT o.id,
    o.name,
    o.organization_type,
    o.is_principal,
    o.is_distributor,
    o.priority,
    o.segment_id,
    o.annual_revenue,
    o.employee_count,
    o.phone,
    o.website,
    o.postal_code,
    o.city,
    o.state,
    o.description,
    o.created_at,
    count(DISTINCT opp.id) AS nb_opportunities,
    count(DISTINCT c.id) AS nb_contacts,
    max(opp.updated_at) AS last_opportunity_activity
   FROM ((public.organizations o
     LEFT JOIN public.opportunities opp ON ((((opp.customer_organization_id = o.id) OR (opp.principal_organization_id = o.id) OR (opp.distributor_organization_id = o.id)) AND (opp.deleted_at IS NULL))))
     LEFT JOIN public.contacts c ON (((c.organization_id = o.id) AND (c.deleted_at IS NULL))))
  WHERE (o.deleted_at IS NULL)
  GROUP BY o.id;

-- Set proper ownership
ALTER VIEW public.organizations_summary OWNER TO postgres;

-- Add comment for documentation
COMMENT ON VIEW public.organizations_summary IS 'Denormalized view of organizations with counts and searchable fields. Includes phone, website, address fields for full-text search support.';

-- Grant appropriate permissions
-- Assuming authenticated users should be able to read these views
GRANT SELECT ON public.contacts_summary TO authenticated;
GRANT SELECT ON public.contacts_summary TO service_role;
GRANT SELECT ON public.contacts_summary TO anon;

GRANT SELECT ON public.organizations_summary TO authenticated;
GRANT SELECT ON public.organizations_summary TO service_role;
GRANT SELECT ON public.organizations_summary TO anon;