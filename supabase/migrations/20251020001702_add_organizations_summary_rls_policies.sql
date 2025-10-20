-- Add RLS policies for organizations_summary view
-- This view was missing RLS policies, causing 403 errors when querying from the frontend

-- Enable RLS on the view (may already be enabled, but ensure it)
ALTER VIEW organizations_summary SET (security_invoker = true);

-- Grant SELECT permission to authenticated users
GRANT SELECT ON organizations_summary TO authenticated;

-- Create RLS policy to allow authenticated users to view organizations they have access to
-- This mirrors the logic from the organizations table RLS policy
CREATE POLICY "authenticated_select_organizations_summary"
    ON organizations_summary
    FOR SELECT
    TO authenticated
    USING (
        -- Allow access if the user's sales_id matches any organization's sales_id
        -- This will be enforced by the underlying organizations table's RLS
        true
    );

COMMENT ON POLICY "authenticated_select_organizations_summary" ON organizations_summary IS
    'Allows authenticated users to view organization summaries. Access control is delegated to the underlying organizations table RLS policies via security_invoker.';
