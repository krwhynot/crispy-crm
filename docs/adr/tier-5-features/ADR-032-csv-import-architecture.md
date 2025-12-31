# ADR-032: CSV Data Import Architecture (One-Time Scripts)

## Status

**Accepted**

## Date

Documented: 2025-12-30

## Deciders

- krwhynot

---

## Context

Crispy CRM needed to migrate production data from MFB's Excel spreadsheets into Supabase. This migration required importing:

- **2,023 organizations** (distributors, prospects, operators)
- **1,776 contacts** (linked to organizations)
- **716 distributor relationships** (organization-distributor mappings)

Key constraints shaped the architecture:

1. **RLS Bypass Required**: Row Level Security policies would prevent bulk inserts without the service role key
2. **Data Integrity**: Foreign key relationships between tables required correct insert ordering
3. **Deduplication**: Excel data contained duplicates requiring normalization
4. **Local Development**: Developers needed seed data for `supabase db reset`
5. **One-Time Operation**: This is a migration, not an ongoing feature

### Alternatives Considered

| Alternative | Pros | Cons |
|------------|------|------|
| **UI-based import** | User-friendly | Exposes service role key, RLS issues |
| **Supabase Dashboard** | No code needed | Manual, error-prone for 2000+ records |
| **pg_dump/restore** | Native PostgreSQL | Requires production access, complex setup |
| **One-time scripts (chosen)** | Full control, dual-mode | More code, manual execution |
| **Edge Function** | Server-side | Cold starts, 50s timeout limit |

---

## Decision

Implement **one-time CLI scripts** with two execution modes:

1. **`--generate-sql`**: Create `supabase/seed.sql` for local development
2. **`--import-cloud`**: Direct insert to cloud Supabase instance

Scripts are explicitly temporary and marked for deletion after successful migration.

### Script Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CSV Source Files                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ data/production-data/                                   │ │
│  │   ├── seed_organizations.csv  (2,023 records)          │ │
│  │   ├── seed_contacts.csv       (1,776 records)          │ │
│  │   └── seed_organization_distributors.csv (716 records) │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              scripts/import-masterfoods-data.ts              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 1. Parse CSV with PapaParse                             │ │
│  │ 2. Validate all data (fail-fast)                        │ │
│  │ 3. Transform to target schema                           │ │
│  │ 4. Build organization lookup map (name → id)            │ │
│  │ 5. Resolve foreign keys                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
┌─────────────────────────┐ ┌─────────────────────────┐
│    --generate-sql       │ │    --import-cloud       │
│  ┌───────────────────┐  │ │  ┌───────────────────┐  │
│  │ Write seed.sql    │  │ │  │ Connect with      │  │
│  │ for db reset      │  │ │  │ service role key  │  │
│  └───────────────────┘  │ │  └───────────────────┘  │
│           │             │ │           │             │
│           ▼             │ │           ▼             │
│  supabase/seed.sql      │ │  Cloud Supabase DB      │
└─────────────────────────┘ └─────────────────────────┘
```

### Why One-Time Scripts (Not UI Feature)

| Concern | UI Import | CLI Script |
|---------|-----------|------------|
| **Service Role Key** | Exposed to client | Server-only, env variable |
| **RLS Bypass** | Security risk | Controlled, auditable |
| **Batch Size** | Browser memory limits | Server-side, 100 per batch |
| **Error Recovery** | Complex UX | Re-run with `--dry-run` first |
| **Deduplication** | Real-time detection | Pre-validated, normalized |
| **Deletion After Use** | Feature bloat | Clean removal |

### PapaParse Usage

```typescript
// scripts/import-masterfoods-data.ts:334-339

import Papa from "papaparse";

function loadOrganizations(csvDir: string): OrganizationRow[] {
  const csvPath = resolve(csvDir, "seed_organizations.csv");
  const content = readFileSync(csvPath, "utf-8");
  const result = Papa.parse<OrganizationRow>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),  // Normalize headers
  });
  return result.data;
}
```

### Fail-Fast Validation

All data is validated **before** any database operations:

```typescript
// scripts/import-masterfoods-data.ts:368-513

function validateAllData(orgs, contacts, distributors) {
  const errors: ValidationError[] = [];
  const orgMap = new Map<string, OrgMapEntry>();

  // Phase 1: Validate organizations
  orgs.forEach((org, idx) => {
    if (!name) {
      errors.push({
        file: "seed_organizations.csv",
        row: idx + 2,
        field: "name",
        message: "Organization name is required",
      });
    }
  });

  // Phase 2: Validate contacts have valid org references
  contacts.forEach((contact, idx) => {
    if (!orgMap.has(normalizedOrgName)) {
      errors.push({
        file: "seed_contacts.csv",
        row: idx + 2,
        field: "organization_name",
        message: `Organization not found: "${orgName}"`,
      });
    }
  });

  // Fail fast if any errors
  if (errors.length > 0) {
    console.error(`${errors.length} validation errors found`);
    process.exit(1);
  }
}
```

### Service Role Key Requirement

Cloud imports require the service role key to bypass RLS:

```typescript
// scripts/import-masterfoods-data.ts:236-250

if (args.includes("--import-cloud")) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
    console.error("   Get key from: npx supabase status (local) or dashboard (cloud)");
    process.exit(1);
  }
}

// Later, create client with service role
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
```

### Batch Processing

Large datasets are inserted in batches to avoid timeout issues:

```typescript
// scripts/import-masterfoods-data.ts:920-950

const orgChunks = chunkArray(orgs, config.batchSize);  // 100 per batch

for (let i = 0; i < orgChunks.length; i++) {
  const chunk = orgChunks[i];
  const { error } = await supabase.from("organizations").insert(
    chunk.map((org) => ({
      id: org.id,
      name: org.name,
      // ... mapped fields
    }))
  );

  if (error) {
    errors.push(`Organizations batch ${i + 1}: ${error.message}`);
  }

  // Progress reporting
  if ((i + 1) % 5 === 0) {
    console.log(`Batch ${i + 1}/${orgChunks.length} complete`);
  }
}
```

---

## Code Examples

### Running the Import Script

```bash
# Validate data without making changes
npx tsx scripts/import-masterfoods-data.ts --generate-sql --dry-run

# Generate seed.sql for local development
npx tsx scripts/import-masterfoods-data.ts --generate-sql

# Import directly to cloud (requires env vars)
export SUPABASE_URL="https://xxx.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="eyJ..."
npx tsx scripts/import-masterfoods-data.ts --import-cloud
```

### Generated SQL Structure

```sql
-- supabase/seed.sql (generated)

-- Organizations (2,023 records)
INSERT INTO organizations (id, name, organization_type, ...) VALUES
  (1, 'Sysco', 'distributor', ...),
  (2, 'US Foods', 'distributor', ...),
  -- ... batched in groups of 100

-- Contacts (1,776 records)
INSERT INTO contacts (id, name, organization_id, ...) VALUES
  (1, 'John Smith', 1, ...),  -- FK to organization id=1
  -- ...

-- Reset sequences for new records
SELECT setval('organizations_id_seq', (SELECT MAX(id) FROM organizations));
SELECT setval('contacts_id_seq', (SELECT MAX(id) FROM contacts));
```

### Column Alias Mapping

For user-uploaded CSVs with non-standard headers:

```typescript
// scripts/test-csv-import.mjs:12-50

const COLUMN_ALIASES = {
  // Organization field aliases
  'Organizations': 'organization_name',
  'Organizations (DropDown)': 'organization_name',
  'Company': 'organization_name',

  // Name field aliases (will be split)
  'FULL NAME (FIRST, LAST)': '_full_name_source_',
  'Full Name': '_full_name_source_',

  // Email aliases
  'EMAIL': 'email_work',
  'Email (Work)': 'email_work',

  // Phone aliases
  'PHONE': 'phone_work',
  'Phone (Work)': 'phone_work',
};
```

---

## Anti-Patterns

### 1. Exposing Service Role Key in UI (NEVER DO THIS)

```typescript
// WRONG: Service role key in browser-accessible code
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SERVICE_ROLE_KEY  // NEVER expose this!
);
```

### 2. Importing Without Validation (NEVER DO THIS)

```typescript
// WRONG: Direct insert without validation
const csvData = Papa.parse(content).data;
await supabase.from("contacts").insert(csvData);
// Invalid foreign keys, duplicates, malformed data all inserted
```

### 3. Building Feature Around Migration (NEVER DO THIS)

```typescript
// WRONG: Permanent UI for one-time operation
function AdminImportPage() {
  return (
    <FileInput onUpload={handleMigration}>
      Import MasterFoods Data
    </FileInput>
  );
}
// Creates feature bloat, security exposure for unused functionality
```

### 4. Single Large Insert (NEVER DO THIS)

```typescript
// WRONG: 2000+ records in single insert
await supabase.from("organizations").insert(allOrgs);
// Timeout, memory exhaustion, no progress feedback
```

---

## Consequences

### Positive

- **Security**: Service role key never exposed to browser
- **Control**: Full validation before any database changes
- **Dual-Mode**: Same script for local dev and production
- **Auditable**: SQL file documents exact data imported
- **Clean Removal**: Scripts deleted after migration, no feature bloat
- **Fail-Fast**: Validation errors surface immediately, before any inserts

### Negative

- **Manual Execution**: Requires developer to run script
- **Environment Setup**: Service role key must be configured
- **One-Time Code**: Script deleted after use (wasted effort if re-migration needed)

### Neutral

- **CSV Source of Truth**: Original CSVs retained in `data/production-data/`
- **100 Record Batches**: Balance between performance and reliability

---

## When to Delete

Scripts should be deleted when:

1. **Migration Verified**: All production data imported and validated
2. **Seed Working**: Local development using generated `seed.sql` successfully
3. **No Re-Import Needed**: Business confirms no additional bulk imports required

Deletion candidates:
- `scripts/import-masterfoods-data.ts`
- `scripts/test-csv-import.mjs`
- `scripts/migrate-opportunities-csv.js`
- `data/production-data/*.csv` (archive, then remove)

---

## Related ADRs

- **[ADR-014: Fail-Fast Philosophy](../tier-1-foundations/ADR-014-fail-fast-philosophy.md)** - Validation errors stop import immediately
- **[ADR-028: CSV Upload Validation](./ADR-028-csv-upload-validation.md)** - Client-side validation (for UI imports)
- **[ADR-008: RLS Security](../tier-1-foundations/ADR-008-rls-security.md)** - Why service role key needed for bypass

---

## References

- Primary Script: `scripts/import-masterfoods-data.ts` (1,170 lines)
- Test Validation: `scripts/test-csv-import.mjs` (490 lines)
- Opportunity Migration: `scripts/migrate-opportunities-csv.js` (278 lines)
- CSV Source Data: `data/production-data/*.csv`
- Generated Seed: `supabase/seed.sql`
- PapaParse Docs: https://www.papaparse.com/docs
- Supabase Service Role: https://supabase.com/docs/guides/api/api-keys#service-role-key
