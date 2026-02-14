-- Grant service_role access to tables used by capture-dashboard-snapshots Edge Function
-- The EF runs as service_role via supabaseAdmin client and needs explicit table grants.
--
-- Root cause: PostgREST service_role has bypassrls=true but still needs
-- table-level GRANT to access tables. GRANT ALL ON TABLE does NOT cascade
-- to sequences in PostgreSQL, so sequences need separate GRANT.

-- Read access for snapshot data gathering
GRANT SELECT ON public.sales TO service_role;
GRANT SELECT ON public.activities TO service_role;
GRANT SELECT ON public.opportunities TO service_role;

-- Full access for writing snapshots
GRANT ALL ON public.dashboard_snapshots TO service_role;

-- Sequence access for INSERT (BIGSERIAL id column)
GRANT USAGE, SELECT ON SEQUENCE public.dashboard_snapshots_id_seq TO service_role;
