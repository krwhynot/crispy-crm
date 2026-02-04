---
name: soft-delete-rls-audit
description: Enforces soft-delete and RLS security patterns from DATABASE_LAYER.md. Detects missing deleted_at columns, RLS policies without soft-delete filters, views exposing deleted records, hard deletes in code, and cross-tenant data leaks. Triggers on - soft delete, RLS audit, deleted_at, security audit, row level security, multi-tenant, data leak, policy audit.
---

# Soft Delete & RLS Audit

## Purpose

Enforce DATABASE_LAYER.md soft-delete and Row Level Security (RLS) patterns to prevent data leaks and ensure proper multi-tenant isolation.

**Core Mandate:** NO DELETED RECORDS VISIBLE, NO CROSS-TENANT DATA LEAKS

## When to Use

Automatically activates when you mention:
- Security terms: RLS audit, security audit, data leak, cross-tenant, multi-tenant
- Soft delete terms: soft delete, deleted_at, hard delete, cascade delete
- Policy terms: row level security, RLS policy, policy audit, access control
- Database terms: migration audit, schema security, table security
- Symptoms: deleted records visible, wrong company data, unauthorized access

## The Five Security Checks

### Check 1: Table Schema Validation

**Rule:** All entity tables MUST have `deleted_at TIMESTAMPTZ` column for soft deletes.

**Detection Pattern:**

```sql
-- ❌ VIOLATION: Missing deleted_at column
CREATE TABLE contacts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  company_id BIGINT NOT NULL REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
  -- MISSING: deleted_at TIMESTAMPTZ
);

-- ✅ COMPLIANT: Has deleted_at column
CREATE TABLE contacts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  company_id BIGINT NOT NULL REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ  -- Soft delete support
);
```

**What to Check:**
- Scan all `CREATE TABLE` statements in `supabase/migrations/`
- Identify entity tables (exclude: junction tables, metadata tables)
- Flag if `deleted_at TIMESTAMPTZ` missing
- Exception: System tables (auth.*, storage.*, etc.)

**Entity Table Heuristics:**
- Has `id` primary key
- Has `created_at` timestamp
- Has foreign key to `companies` or multi-tenant context
- NOT a junction table (tables with only 2-3 FKs)
- NOT a reference/lookup table (products, tags, etc. may not need soft delete)

**Output Format:**

```
Missing deleted_at Columns (3 tables)

supabase/migrations/20260115000001_create_contacts.sql:5
  ❌ Table: contacts
  ⚠️  Risk: Hard deletes will lose data permanently
  ✅ Add column:
    ALTER TABLE contacts ADD COLUMN deleted_at TIMESTAMPTZ;

supabase/migrations/20260120000001_create_opportunities.sql:12
  ❌ Table: opportunities
  ⚠️  Risk: Deleted opportunities still visible
  ✅ Add column:
    ALTER TABLE opportunities ADD COLUMN deleted_at TIMESTAMPTZ;
```

---

### Check 2: RLS Policy Soft-Delete Enforcement

**Rule:** All RLS SELECT policies MUST filter `deleted_at IS NULL` to hide soft-deleted records.

**Detection Pattern:**

```sql
-- ❌ VIOLATION: Policy doesn't filter deleted records
CREATE POLICY "Users can view own company contacts"
  ON contacts FOR SELECT
  USING (
    company_id = (auth.jwt() ->> 'company_id')::int
    -- MISSING: AND deleted_at IS NULL
  );

-- ✅ COMPLIANT: Policy filters deleted records
CREATE POLICY "Users can view own company contacts"
  ON contacts FOR SELECT
  USING (
    company_id = (auth.jwt() ->> 'company_id')::int
    AND deleted_at IS NULL
  );
```

**What to Check:**
- Parse all `CREATE POLICY` statements with `FOR SELECT` or `FOR ALL`
- Check `USING` clause for `deleted_at IS NULL`
- Flag if policy is on a table with `deleted_at` column but doesn't filter it
- Exception: Service role policies (explicit `TO service_role`)
- Exception: Audit/history queries (explicitly documented)

**Cross-Reference:**
1. Get list of tables with `deleted_at` column
2. Find all policies on those tables
3. Check if `USING` clause includes `deleted_at IS NULL`

**Output Format:**

```
RLS Policies Missing Soft-Delete Filter (5 policies)

supabase/migrations/20260115000002_rls_contacts.sql:8
  ❌ Policy: "Users can view own company contacts"
  ❌ Table: contacts (has deleted_at column)
  ⚠️  Risk: Users can see deleted contacts
  ✅ Fix USING clause:
    USING (
      company_id = (auth.jwt() ->> 'company_id')::int
      AND deleted_at IS NULL  -- Add this line
    )

supabase/migrations/20260120000002_rls_opportunities.sql:15
  ❌ Policy: "Users can select opportunities"
  ❌ Table: opportunities (has deleted_at column)
  ⚠️  Risk: Pipeline shows deleted deals
  ✅ Fix USING clause:
    USING (
      company_id = current_company_id()
      AND deleted_at IS NULL  -- Add this line
    )
```

---

### Check 3: View Soft-Delete Filtering

**Rule:** All views reading from soft-deletable tables MUST filter `WHERE deleted_at IS NULL`.

**Detection Pattern:**

```sql
-- ❌ VIOLATION: View includes deleted records
CREATE VIEW contacts_summary AS
SELECT
  c.id,
  c.name,
  c.email,
  o.name AS organization_name
FROM contacts c
LEFT JOIN organizations o ON c.organization_id = o.id;
-- MISSING: WHERE c.deleted_at IS NULL AND o.deleted_at IS NULL

-- ✅ COMPLIANT: View filters deleted records
CREATE VIEW contacts_summary AS
SELECT
  c.id,
  c.name,
  c.email,
  o.name AS organization_name
FROM contacts c
LEFT JOIN organizations o ON c.organization_id = o.id
WHERE c.deleted_at IS NULL
  AND (o.deleted_at IS NULL OR o.id IS NULL);  -- Handle outer join
```

**What to Check:**
- Parse all `CREATE VIEW` or `CREATE OR REPLACE VIEW` statements
- Identify tables with `deleted_at` in the FROM/JOIN clauses
- Check if WHERE clause filters each table's `deleted_at IS NULL`
- Handle LEFT JOIN cases (allow NULL when join fails)

**Detection Algorithm:**
```
For each view:
  1. Extract all tables in FROM and JOIN clauses
  2. Check which tables have deleted_at column
  3. For each such table:
     - If WHERE clause missing: FLAG
     - If WHERE has table but not "deleted_at IS NULL": FLAG
     - If LEFT JOIN and no NULL handling: WARN
```

**Output Format:**

```
Views Exposing Deleted Records (2 views)

supabase/migrations/20260116000001_views_contacts.sql:45
  ❌ View: contacts_summary
  ⚠️  Tables with deleted_at: contacts, organizations
  ⚠️  Risk: Lists show deleted records
  ✅ Add WHERE clause:
    WHERE contacts.deleted_at IS NULL
      AND (organizations.deleted_at IS NULL
           OR organizations.id IS NULL)  -- Handle outer join
```

---

### Check 4: Handler Soft-Delete Configuration

**Rule:** Data provider handlers MUST set `supportsSoftDelete: true` in lifecycle callbacks.

**Detection Pattern:**

```typescript
// ❌ VIOLATION: Missing soft-delete config
export const contactsCallbacks: ResourceCallbacks = {
  COMPUTED_FIELDS: ['nb_opportunities', 'last_activity_date'],
  beforeDelete: async (params: DeleteParams) => {
    // Custom logic
    return params;
  },
  // MISSING: supportsSoftDelete: true
};

// ✅ COMPLIANT: Soft-delete enabled
export const contactsCallbacks: ResourceCallbacks = {
  COMPUTED_FIELDS: ['nb_opportunities', 'last_activity_date'],
  supportsSoftDelete: true,  // Converts DELETE to UPDATE deleted_at
  beforeDelete: async (params: DeleteParams) => {
    // Custom logic (runs before soft delete)
    return params;
  },
};
```

**What to Check:**
- Find all `*Callbacks` objects in `src/atomic-crm/providers/supabase/callbacks/`
- Check if resource has corresponding table with `deleted_at`
- Flag if `supportsSoftDelete: true` missing
- Exception: Resources explicitly documented as hard-delete (e.g., tags)

**Cross-Reference:**
1. List all callback files
2. Extract resource name from filename (e.g., `contactsCallbacks.ts` → `contacts`)
3. Check if `contacts` table has `deleted_at` column
4. Verify `supportsSoftDelete: true` present

**Output Format:**

```
Handlers Missing Soft-Delete Config (3 handlers)

src/atomic-crm/providers/supabase/callbacks/contactsCallbacks.ts:12
  ❌ Resource: contacts (table has deleted_at column)
  ⚠️  Risk: Hard deletes instead of soft deletes
  ✅ Add to callbacks object:
    export const contactsCallbacks: ResourceCallbacks = {
      supportsSoftDelete: true,  // Add this line
      COMPUTED_FIELDS: [...],
      ...
    };

src/atomic-crm/providers/supabase/callbacks/opportunitiesCallbacks.ts:8
  ❌ Resource: opportunities (table has deleted_at column)
  ⚠️  Risk: Lost pipeline data on delete
  ✅ Add to callbacks object:
    supportsSoftDelete: true,
```

---

### Check 5: Cross-Tenant Isolation (RLS)

**Rule:** All RLS policies MUST enforce `company_id` isolation (or equivalent tenant field).

**Detection Pattern:**

```sql
-- ❌ VIOLATION: No tenant isolation
CREATE POLICY "Users can select contacts"
  ON contacts FOR SELECT
  USING (deleted_at IS NULL);
  -- MISSING: company_id check - any user sees ALL contacts!

-- ❌ VIOLATION: Weak tenant check
CREATE POLICY "Users can select contacts"
  ON contacts FOR SELECT
  USING (
    auth.uid() IS NOT NULL  -- Only checks if logged in
    AND deleted_at IS NULL
    -- MISSING: company_id isolation
  );

-- ✅ COMPLIANT: Proper tenant isolation
CREATE POLICY "Users can select contacts"
  ON contacts FOR SELECT
  USING (
    company_id = (auth.jwt() ->> 'company_id')::int
    AND deleted_at IS NULL
  );

-- ✅ ALSO COMPLIANT: Helper function
CREATE POLICY "Users can select contacts"
  ON contacts FOR SELECT
  USING (
    company_id = current_company_id()  -- Helper extracts from JWT
    AND deleted_at IS NULL
  );
```

**What to Check:**
- Find all tables with `company_id` or `tenant_id` column
- Parse RLS policies on those tables
- Check if `USING` clause references tenant column
- Flag if policy allows access without tenant check

**Detection Patterns:**
```
SAFE patterns:
  - company_id = (auth.jwt() ->> 'company_id')::int
  - company_id = current_company_id()
  - tenant_id = get_current_tenant()

UNSAFE patterns:
  - auth.uid() IS NOT NULL (no tenant check)
  - USING (true) (allows all - only OK for service_role)
  - No company_id reference in USING clause
```

**Output Format:**

```
RLS Policies Missing Tenant Isolation (2 policies)

supabase/migrations/20260115000002_rls_contacts.sql:15
  ❌ Policy: "Users can select contacts"
  ❌ Table: contacts (has company_id column)
  ⚠️  Risk: CRITICAL - Users can see other companies' contacts!
  ✅ Add tenant check to USING:
    USING (
      company_id = (auth.jwt() ->> 'company_id')::int
      AND deleted_at IS NULL
    )

supabase/migrations/20260120000003_rls_opportunities.sql:22
  ❌ Policy: "Authenticated users can view opportunities"
  ❌ Table: opportunities (has company_id column)
  ⚠️  Risk: CRITICAL - Cross-tenant data leak!
  ✅ Replace with:
    USING (
      company_id = current_company_id()
      AND deleted_at IS NULL
    )
```

---

## Global Audit Output

### Security Score

```
Database Security Health: C+ (5 critical, 12 warnings)

Critical Issues:
✗ 2 RLS policies allow cross-tenant access (DATA LEAK RISK)
✗ 3 tables missing deleted_at column
✗ 5 RLS policies expose deleted records

Warnings:
⚠ 2 views include deleted records
⚠ 3 handlers missing supportsSoftDelete config
⚠ 7 policies use USING (true) for service_role (acceptable if documented)
```

### Summary by Risk Level

```
CRITICAL (Fix Immediately):
1. Cross-tenant data leaks (2 policies) - Users see other companies' data
2. Deleted records visible (5 policies) - Privacy violation

HIGH (Fix This Sprint):
3. Missing deleted_at columns (3 tables) - Hard deletes lose data
4. Views expose deleted records (2 views) - Lists show deleted items

MEDIUM (Fix Next Sprint):
5. Handlers missing soft-delete config (3 handlers) - Inconsistent behavior
```

---

## Quick Reference Checklist

Before merging database changes, verify:

- [ ] All entity tables have `deleted_at TIMESTAMPTZ` column
- [ ] All SELECT policies filter `deleted_at IS NULL`
- [ ] All views filter `WHERE table.deleted_at IS NULL`
- [ ] All handlers have `supportsSoftDelete: true` (if table has deleted_at)
- [ ] All policies on multi-tenant tables check `company_id` or `tenant_id`
- [ ] Service role policies explicitly use `TO service_role` (if USING (true))
- [ ] Junction table policies check both sides of relationship
- [ ] No hard `DELETE` statements in application code

---

## Tool Integration

### Required Files

| File | Purpose |
|------|---------|
| `DATABASE_LAYER.md` | Source of truth for soft-delete rules |
| `PROVIDER_RULES.md` | Handler soft-delete configuration |
| `supabase/migrations/*.sql` | Migration files to audit |
| `src/atomic-crm/providers/supabase/callbacks/*Callbacks.ts` | Handler configs |

### Recommended Commands

```bash
# Find tables with deleted_at
rg "deleted_at TIMESTAMPTZ" supabase/migrations --type sql

# Find RLS policies
rg "CREATE POLICY" supabase/migrations --type sql -A 5

# Find views
rg "CREATE.*VIEW" supabase/migrations --type sql -A 10

# Find handler callbacks
fd "Callbacks.ts$" src/atomic-crm/providers/supabase/callbacks

# Check for hard deletes in code
rg "\.delete\(\)" src/atomic-crm --type ts
```

---

## Enforcement Mode

**Severity Levels:**

| Violation | Severity | Block Merge? | Rationale |
|-----------|----------|--------------|-----------|
| Cross-tenant data leak | CRITICAL | Yes | Security vulnerability |
| RLS missing deleted_at filter | CRITICAL | Yes | Privacy violation |
| Table missing deleted_at | HIGH | Yes | Data loss risk |
| View exposes deleted records | HIGH | Suggest | UI shows incorrect data |
| Handler missing supportsSoftDelete | MEDIUM | Suggest | Inconsistent behavior |

---

## Detection Algorithms

### Algorithm 1: Extract Tables with deleted_at

```python
def find_soft_delete_tables(migration_dir: str) -> Set[str]:
    tables_with_deleted_at = set()

    for file in glob(f"{migration_dir}/*.sql"):
        content = read_file(file)

        # Match CREATE TABLE ... deleted_at TIMESTAMPTZ
        matches = re.findall(
            r'CREATE TABLE (\w+)\s*\((.*?)\);',
            content,
            re.DOTALL
        )

        for table_name, columns in matches:
            if 'deleted_at' in columns:
                tables_with_deleted_at.add(table_name)

    return tables_with_deleted_at
```

### Algorithm 2: Validate RLS Policies

```python
def audit_rls_policies(migration_dir: str) -> List[Violation]:
    violations = []
    soft_delete_tables = find_soft_delete_tables(migration_dir)

    for file in glob(f"{migration_dir}/*.sql"):
        content = read_file(file)

        # Match CREATE POLICY ... ON table_name FOR SELECT USING (...)
        policies = re.findall(
            r'CREATE POLICY "([^"]+)"\s+ON (\w+)\s+FOR (SELECT|ALL)\s+USING\s*\((.*?)\);',
            content,
            re.DOTALL
        )

        for policy_name, table, operation, using_clause in policies:
            # Check 1: Soft-delete filter
            if table in soft_delete_tables:
                if 'deleted_at IS NULL' not in using_clause:
                    violations.append({
                        'type': 'missing_soft_delete_filter',
                        'policy': policy_name,
                        'table': table,
                        'file': file
                    })

            # Check 2: Tenant isolation
            if has_company_id(table):
                if not has_tenant_check(using_clause):
                    violations.append({
                        'type': 'missing_tenant_isolation',
                        'policy': policy_name,
                        'table': table,
                        'file': file,
                        'severity': 'CRITICAL'
                    })

    return violations
```

### Algorithm 3: Validate Views

```python
def audit_views(migration_dir: str) -> List[Violation]:
    violations = []
    soft_delete_tables = find_soft_delete_tables(migration_dir)

    for file in glob(f"{migration_dir}/*.sql"):
        content = read_file(file)

        # Match CREATE VIEW ... AS SELECT ... FROM ...
        views = re.findall(
            r'CREATE (?:OR REPLACE )?VIEW (\w+)\s+AS\s+(SELECT.*?FROM.*?)(?:;|\n\n)',
            content,
            re.DOTALL | re.IGNORECASE
        )

        for view_name, query in views:
            # Extract table names from FROM/JOIN clauses
            tables = extract_tables(query)

            # Check if soft-deletable tables are filtered
            for table in tables:
                if table in soft_delete_tables:
                    if f'{table}.deleted_at IS NULL' not in query:
                        violations.append({
                            'type': 'view_exposes_deleted',
                            'view': view_name,
                            'table': table,
                            'file': file
                        })

    return violations
```

---

## Common Patterns & Fixes

### Pattern 1: Junction Table Policies

**Problem:** Junction tables need tenant checks on BOTH foreign keys.

```sql
-- ❌ VIOLATION: Only checks one side
CREATE POLICY "Users can link contacts to orgs"
  ON contact_organizations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE id = contact_organizations.contact_id
      AND company_id = current_company_id()
    )
    -- MISSING: Check organization side too!
  );

-- ✅ CORRECT: Checks both sides
CREATE POLICY "Users can link contacts to orgs"
  ON contact_organizations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE id = contact_organizations.contact_id
      AND company_id = current_company_id()
    )
    AND EXISTS (
      SELECT 1 FROM organizations
      WHERE id = contact_organizations.organization_id
      AND company_id = current_company_id()
    )
  );
```

### Pattern 2: Soft-Delete Cascade

**Problem:** Deleting parent should soft-delete children.

```sql
-- ✅ Use trigger for cascade soft delete
CREATE OR REPLACE FUNCTION soft_delete_cascade_contacts()
RETURNS TRIGGER AS $$
BEGIN
  -- When organization is soft-deleted, soft-delete its contacts
  UPDATE contacts
  SET deleted_at = NEW.deleted_at
  WHERE organization_id = NEW.id
    AND deleted_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER soft_delete_cascade_contacts_trigger
  AFTER UPDATE OF deleted_at ON organizations
  FOR EACH ROW
  WHEN (NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL)
  EXECUTE FUNCTION soft_delete_cascade_contacts();
```

### Pattern 3: Service Role Policies

**Problem:** Service role needs full access but should be explicit.

```sql
-- ❌ UNCLEAR: Could be accidental
CREATE POLICY "Allow all access"
  ON contacts FOR ALL
  USING (true);

-- ✅ EXPLICIT: Clearly for service role
CREATE POLICY "Service role full access"
  ON contacts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

---

## Summary

Soft-delete and RLS patterns are **critical security boundaries**. Audit rigorously to prevent:

1. **Data Leaks:** Deleted records visible to users
2. **Cross-Tenant Leaks:** Users seeing other companies' data
3. **Data Loss:** Hard deletes removing records permanently
4. **Inconsistent Behavior:** Some deletes soft, others hard

**Remember:** Security is not optional. Every table, policy, view, and handler must follow these patterns without exception.

---

*Generated by soft-delete-rls-audit skill | Based on DATABASE_LAYER.md and PROVIDER_RULES.md rules*
