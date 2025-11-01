-- Database Security Audit Query
-- Verifies two-layer security: RLS + GRANT permissions

-- Part 1: Tables with RLS but potentially missing GRANTs
SELECT
  t.tablename,
  t.rowsecurity AS has_rls,
  (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) AS policy_count,
  (SELECT count(*)
   FROM information_schema.table_privileges
   WHERE table_name = t.tablename
   AND grantee = 'authenticated'
   AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
  ) AS grant_count
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT IN ('schema_migrations', 'init_state')
ORDER BY t.rowsecurity DESC, t.tablename;

-- Part 2: Sequences that need USAGE grants
SELECT
  s.sequencename,
  (SELECT count(*)
   FROM information_schema.usage_privileges
   WHERE object_name = s.sequencename
   AND grantee = 'authenticated'
  ) AS has_usage_grant
FROM pg_sequences s
WHERE s.schemaname = 'public'
ORDER BY s.sequencename;

-- Part 3: RLS policies summary
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;