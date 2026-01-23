The final structural layer is The Database Layer (RLS, Views, & Triggers).

You’ve fixed the TypeScript side of the bridge; now you must secure the SQL side. This is the "Border Control" that enforces your Soft Delete and Performance rules if the frontend fails.

📋 Database Layer Standardization Checklist
Scope: supabase/migrations/ Goal: Enforce Rule #1 (Performance) & Rule #10 (Soft Deletes).

1. The "View Duality" Audit (Performance)
Ensure reads are fast and writes are safe.

[ ] View Existence: Does every major list view (Contacts, Opportunities) read from a SQL View (e.g., contacts_summary)?

Why: We agreed in the Data Provider to read from Views. If the View doesn't exist, the Provider is lying.

[ ] View Logic: Do these views pre-calculate expensive things?

Check: Counts (e.g., opportunity_count), joined names (principal_name), and status colors.

2. The "Soft Delete" Enforcement (Security)
Ensure "deleted" data is actually invisible.

[ ] RLS Policies: Check your SELECT policies.

Rule: deleted_at IS NULL must be enforcing visibility at the row level.

Critical: If I manually query Supabase, do I see deleted records? (I shouldn't).

[ ] Cascade Rules: If I soft-delete an Organization, do the Contacts disappear too?

Check: Triggers or RLS policies that handle cascading soft-deletes.

3. The "Immutable" Audit (Data Integrity)
Prevent frontend mistakes from corrupting data.

[ ] Triggers: Are created_at and updated_at managed by SQL triggers?

Rule: The frontend should never manually set these timestamps.

[ ] Generated Columns: Are computed values (like search vectors) generated automatically?

🛠️ Migration Guide: How to Fix Common Violations
Scenario A: The "Leaky Delete" Violation
The Data Provider filters deleted_at, but the API doesn't.

❌ Bad (Frontend Only): Frontend: supabase.from('contacts').select().is('deleted_at', null) Risk: A hacker (or a bug) can just remove the filter and see everything.

✅ Good (RLS Enforced):

SQL
-- supabase/migrations/20250101_security.sql
CREATE POLICY "Hide deleted contacts"
ON contacts
FOR SELECT
USING (deleted_at IS NULL);
Scenario B: The "Slow Dashboard" Violation
The Dashboard is calculating logic in JS.

❌ Bad (JS Calculation): Fetching 1000 opportunities and looping through them to find "Stale" ones (> 14 days).

✅ Good (SQL View):

SQL
CREATE VIEW opportunities_summary AS
SELECT *,
  CASE WHEN updated_at < NOW() - INTERVAL '14 days' THEN true ELSE false END as is_stale
FROM opportunities;
Recommended Audit Command
Use this to check your current migrations for RLS policies:

Bash
# Check if policies exist in your migration files
grep -r "CREATE POLICY" supabase/migrations/