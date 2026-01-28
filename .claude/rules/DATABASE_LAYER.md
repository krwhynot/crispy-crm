# Database Layer: RLS, Views & Triggers

Border control that enforces soft deletes and performance rules when frontend fails.

## View Duality (Performance)

DO:
- `contacts_summary`, `opportunities_summary` - SQL views for reads
- Pre-calculate expensive operations (counts, joins, computed fields)
- `SELECT * FROM contacts_summary` - read from views
- `INSERT INTO contacts` - write to base tables

DON'T:
- Fetch base tables for list views
- Calculate aggregates in JavaScript
- Mix read/write destinations

## Soft Delete Enforcement (Security)

DO:
- RLS policies with `deleted_at IS NULL` - enforce at row level
- Cascade soft deletes via triggers/policies
- Test: manually querying Supabase should hide deleted records

DON'T:
- Rely only on frontend filtering `deleted_at`
- Skip RLS policies - attackers can bypass frontend

## Storage Layer (Files & Assets)

DO:
- **Bucket RLS:** Enable Row Level Security on `storage.objects`. Buckets are tables too.
- **Path Structure:** Enforce hierarchy: `/{tenant_id}/{resource}/{record_id}/{filename}`. Prevents collisions and leaks.
- **Private by Default:** Use private buckets. Only make buckets public for generic assets (e.g., app logos).
- **Foreign Keys:** Store the file path string in the database record (e.g., `avatar_url`), not the full signed URL.

DON'T:
- **Public PII:** Never store sensitive user documents in public buckets.
- **Flat Structures:** Don't dump all files in the root of a bucket.
- **Orphaned Files:** Don't delete database records without cleaning up associated storage files (handle via triggers or soft-delete workflows).
## Access Control Patterns

DO:
- `USING (auth.uid() IS NOT NULL)` - minimum requirement for authenticated users
- `USING (auth.jwt() ->> 'role' = 'admin')` - role-based access control
- `USING (company_id = (auth.jwt() ->> 'company_id')::int)` - multi-tenant isolation
- `USING (user_id = auth.uid())` - owner-only access
- Join table restrictions - verify both sides of relationship are authorized

DON'T:
- `USING (true)` - BANNED except for service_role policies
- Rely on "deny all" defaults without explicit policies
- Skip policies for junction tables (security hole)
- Use `USING (true)` as a placeholder during development

### Permissive Policy Hole

WRONG:
```sql
-- Security Issue: Any authenticated user can access ALL records
-- No company isolation, no ownership check, no role check
CREATE POLICY "Users can select product_distributors"
  ON product_distributors FOR SELECT USING (true);

CREATE POLICY "Users can update product_distributors"
  ON product_distributors FOR UPDATE USING (true);

CREATE POLICY "Users can delete product_distributors"
  ON product_distributors FOR DELETE USING (true);
RIGHT:

SQL
-- Option 1: Multi-tenant isolation (most business tables)
CREATE POLICY "Users can select own company product_distributors"
  ON product_distributors FOR SELECT
  USING (
    company_id = (auth.jwt() ->> 'company_id')::int
    AND deleted_at IS NULL
  );

-- Option 2: Authenticated-only (reference/configuration tables)
CREATE POLICY "Authenticated users can view product_distributors"
  ON product_distributors FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND deleted_at IS NULL
  );

-- Option 3: Role-based (admin-only tables)
CREATE POLICY "Admins can manage product_distributors"
  ON product_distributors FOR ALL
  USING (
    (auth.jwt() ->> 'role') = 'admin'
  );

-- Service role bypass (for edge functions only)
CREATE POLICY "Service role full access"
  ON product_distributors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
USING (true) means "allow everyone" - only acceptable for service_role or public reference data.

Junction Table Security
WRONG:

SQL
-- Missing authorization - users could link unauthorized records
CREATE POLICY "Allow contact_organizations inserts"
  ON contact_organizations FOR INSERT
  USING (true);
RIGHT:

SQL
-- Verify user can access BOTH sides of relationship
CREATE POLICY "Users can link own company contacts and orgs"
  ON contact_organizations FOR INSERT
  WITH CHECK (
    -- User must own the contact
    EXISTS (
      SELECT 1 FROM contacts
      WHERE id = contact_organizations.contact_id
      AND company_id = (auth.jwt() ->> 'company_id')::int
    )
    AND
    -- User must own the organization
    EXISTS (
      SELECT 1 FROM organizations
      WHERE id = contact_organizations.organization_id
      AND company_id = (auth.jwt() ->> 'company_id')::int
    )
  );
Junction tables require authorization checks on both foreign keys.

Performance Note: The double EXISTS checks require indexes on foreign keys. Verify indexes exist:

SQL
CREATE INDEX idx_[table]_[fk1] ON [table] ([fk_column_1]) WHERE (deleted_at IS NULL);
CREATE INDEX idx_[table]_[fk2] ON [table] ([fk_column_2]) WHERE (deleted_at IS NULL);
Without indexes, EXISTS subqueries will cause full table scans and degrade write performance.

Immutable Fields (Data Integrity)
DO:

SQL triggers for created_at and updated_at

Generated columns for computed values (search vectors)

DO NOT:

Allow frontend to set timestamps manually

Violation Fixes
Leaky Delete
WRONG:

JavaScript
// Frontend only - hackers can bypass
supabase.from('contacts').select().is('deleted_at', null)
RIGHT:

SQL
-- RLS enforced at database level
CREATE POLICY "Hide deleted contacts"
ON contacts FOR SELECT
USING (deleted_at IS NULL);
Slow Dashboard
WRONG:

JavaScript
// Fetching 1000 rows to filter in JS
opportunities.filter(o => o.updated_at < Date.now() - 14*24*60*60*1000)
RIGHT:

SQL
CREATE VIEW opportunities_summary AS
SELECT *,
  CASE WHEN updated_at < NOW() - INTERVAL '14 days'
    THEN true ELSE false END as is_stale
FROM opportunities;
Audit Command
Bash
grep -r "CREATE POLICY" supabase/migrations/
Checklist
[ ] List views have _summary SQL views with pre-calculated fields

[ ] SELECT policies enforce deleted_at IS NULL

[ ] Soft-delete cascades handled by triggers/policies

[ ] created_at/updated_at managed by triggers (not frontend)

[ ] Computed columns auto-generated

[ ] No USING (true) policies except service_role

[ ] All policies verify auth.uid() or company_id

[ ] Junction table policies check both foreign key sides

[ ] Junction table foreign keys have indexes for EXISTS query performance