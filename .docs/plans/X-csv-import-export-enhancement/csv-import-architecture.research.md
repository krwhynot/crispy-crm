# CSV Import Architecture Research

Research on the current CSV import functionality in Atomic CRM to inform enhancement planning for CSV import/export features.

## Relevant Files

- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactImportButton.tsx`: Entry point button component with modal trigger
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactImportDialog.tsx`: Main import dialog UI with state machine and progress tracking
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/misc/usePapaParse.tsx`: Reusable CSV parsing hook with batch processing (35-150 lines)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/useContactImport.tsx`: Contact-specific import business logic with caching
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/contacts.ts`: Contact validation schemas (Zod)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/types.ts`: TypeScript interfaces for Contact, Organization, Tag, ContactOrganization (lines 100-108)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/tags/types.ts`: Tag interface definition (lines 6-11)
- `/home/krwhynot/projects/crispy-crm/src/components/admin/file-input.tsx`: React Dropzone-based file input component
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/contacts_export.csv`: Sample CSV template with 2 example contacts
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/unifiedDataProvider.ts`: Unified data provider with transformation, validation, and error logging

## Architectural Patterns

### Component Hierarchy

```
ContactImportButton (entry point)
  └── ContactImportDialog (UI controller)
        ├── FileInput (react-dropzone wrapper)
        ├── usePapaParse<ContactImportSchema> (CSV parsing + batch engine)
        └── useContactImport (business logic hook)
              ├── getOrganizations (cache + fetch/create)
              ├── getTags (cache + fetch/create)
              └── dataProvider.create (contacts, contact_organizations)
```

**Pattern**: Separation of concerns with three distinct layers:
1. **UI Layer**: Button + Dialog manage modal state and rendering
2. **Parser Layer**: usePapaParse handles CSV parsing and batch orchestration (reusable)
3. **Business Logic Layer**: useContactImport contains domain-specific import rules

### State Machine Pattern

The import dialog implements a finite state machine with 5 states:

```typescript
// From usePapaParse.tsx lines 4-25
type Import =
  | { state: "idle" }                    // Initial state, file upload shown
  | { state: "parsing" }                 // CSV being parsed by PapaParse
  | { state: "running"                   // Active import with progress tracking
      rowCount: number;
      importCount: number;
      errorCount: number;
      remainingTime: number | null;
    }
  | { state: "complete"                  // Import finished successfully
      rowCount: number;
      importCount: number;
      errorCount: number;
      remainingTime: number | null;
    }
  | { state: "error"                     // CSV parsing failed
      error: Error;
    };
```

**Pattern**: Classic FSM prevents impossible states (e.g., "showing progress while idle"). UI renders conditionally based on current state.

**ZEN GAP FIX - FSM Evolution for Phase 1**:
```typescript
// Enhanced FSM with backward compatibility
type Import =
  | { state: "idle" }
  | { state: "parsing" }
  | { state: "previewing";               // NEW (optional based on feature flag)
      preview: {
        headers: string[];
        mappings: ColumnMapping[];
        sampleRows: ContactImportSchema[];
        warnings: ImportWarning[];
      }
    }
  | { state: "confirmed" }                // NEW (user approved preview)
  | { state: "running" | "complete";
      rowCount: number;
      importCount: number;
      errorCount: number;
      errors: ImportError[];              // ZEN FIX: Add detailed errors, not just count
      remainingTime: number | null;
    }
  | { state: "error"; error: Error };

// Feature flag controls whether preview states are used
const ENABLE_IMPORT_PREVIEW = false; // Initially false for backward compatibility
```

### Batch Processing Strategy

```typescript
// From usePapaParse.tsx lines 76-111
for (let i = 0; i < results.data.length; i += batchSize) {
  const batch = results.data.slice(i, i + batchSize);
  try {
    const start = Date.now();
    await processBatch(batch);  // Sequential batch processing
    totalTime += Date.now() - start;

    // Calculate ETA
    const meanTime = totalTime / (i + batch.length);
    const remainingTime = meanTime * (results.data.length - importCount);
  } catch (error) {
    // Individual batch errors increment errorCount
  }
}
```

**Pattern**: Sequential batch processing (not parallel) with configurable batch size (default: 10). Each batch waits for previous to complete before starting.

**Rationale**: Prevents overwhelming Supabase API with hundreds of concurrent requests. Batching reduces API pressure while maintaining reasonable import speed.

### Caching Strategy (Performance Optimization)

```typescript
// From useContactImport.tsx lines 31-71
// Organization cache - prevents duplicate lookups/creates
const organizationsCache = useMemo(
  () => new Map<string, Organization>(),
  [dataProvider]
);

const getOrganizations = useCallback(async (names: string[]) =>
  fetchRecordsWithCache<Organization>(
    "organizations",
    organizationsCache,
    names,
    (name) => ({
      name,
      created_at: new Date().toISOString(),
      sales_id: identity?.id,
    }),
    dataProvider
  ),
  [organizationsCache, identity?.id, dataProvider]
);

// Tags cache - same pattern
const tagsCache = useMemo(() => new Map<string, Tag>(), [dataProvider]);
```

**Implementation**: `fetchRecordsWithCache` function (lines 186-228):
1. Check cache for existing records
2. Query database for uncached record names using `@in` filter: `"name@in": "(name1,name2)"`
3. Create missing records in parallel via `Promise.all`
4. Store all records in cache and return map

**Impact**: Reduces 100+ organization lookups to 5-10 API calls for typical imports where many contacts share the same organizations/tags.

### Browser-Side CSV Parsing

```typescript
// From usePapaParse.tsx lines 59-134
Papa.parse<T>(file, {
  header: true,              // First row is headers
  skipEmptyLines: true,      // Ignore blank rows
  dynamicTyping: true,       // Auto-convert numbers/booleans
  async complete(results) {
    // Batch processing loop
  },
  error(error) {
    setImporter({ state: "error", error });
  }
});
```

**Pattern**: CSV parsing happens entirely in browser using PapaParse library. Raw CSV file never uploads to server - only parsed, structured contact data transmits via React Admin data provider API calls.

**Benefits**:
- Instant feedback (no upload wait time)
- Reduces server load
- Protects user privacy (CSV remains client-side)
- No server-side file storage needed

## Data Flow

### Complete Import Flow (End-to-End)

```
1. User clicks Import button
   └─> ContactImportButton sets modalOpen = true

2. ContactImportDialog renders in "idle" state
   └─> FileInput (react-dropzone) accepts CSV file selection
   └─> Sample CSV download link displayed

3. User selects CSV file
   └─> FileInput onChange callback updates file state
   └─> User clicks "Import" button

4. startImport() calls parseCsv(file)
   └─> State transitions to "parsing"
   └─> PapaParse.parse() reads file in browser

5. CSV parsing completes
   └─> State transitions to "running"
   └─> Batch processing loop begins (10 records/batch)

6. For each batch:
   a. Resolve Organizations
      └─> Extract unique organization_name values
      └─> getOrganizations() checks cache
      └─> Query database: dataProvider.getList("organizations", { filter: { "name@in": "(...)"}})
      └─> Create missing orgs: dataProvider.create("organizations", {...})
      └─> Update cache

   b. Resolve Tags
      └─> Parse comma-separated tags
      └─> getTags() checks cache
      └─> Query database for uncached tags
      └─> Create missing tags with default color "gray"
      └─> Update cache

   c. Create Contacts
      └─> Transform CSV columns to JSONB arrays:
          - email_work, email_home, email_other → email: [{email, type}]
          - phone_work, phone_home, phone_other → phone: [{number, type}]
      └─> dataProvider.create("contacts", {
            first_name, last_name, gender, title,
            email, phone, tags, linkedin_url, sales_id
          })
      └─> Store returned contact.id

   d. Link to Organization
      └─> dataProvider.create("contact_organizations", {
            contact_id: contactId,
            organization_id: organizationId,
            is_primary: true,
            role: organization_role || "decision_maker"
          })

   e. Update Progress
      └─> Increment importCount
      └─> Calculate remainingTime using mean batch processing time
      └─> Render progress UI

7. All batches complete
   └─> State transitions to "complete"
   └─> useRefresh() triggers contact list reload
   └─> Summary displayed: "Imported X contacts, with Y errors"

8. User closes modal
   └─> reset() returns state to "idle"
   └─> onClose() hides modal
```

### Error Handling Flow

**Fail-Fast Principle** (per Engineering Constitution):

```typescript
// From useContactImport.tsx lines 115-132
if (!trimmedOrgName) {
  console.warn(
    `Skipping contact ${first_name} ${last_name} due to missing primary organization name.`
  );
  return Promise.resolve(); // Skip this contact, continue with batch
}

if (!organization?.id) {
  console.error(
    `Failed to find or create organization "${trimmedOrgName}". Skipping contact.`
  );
  return Promise.resolve(); // Skip this contact, continue with batch
}
```

**Error Levels**:
1. **CSV Parse Errors**: Entire import stops, state = "error"
2. **Missing Organization Name**: Contact skipped, warning logged
3. **Batch Processing Errors**: Caught, errorCount incremented, import continues
4. **User Cancellation**: Import ID tracking prevents subsequent batches from executing

**No Rollback**: Successfully imported batches are NOT rolled back on later failures. Follows "fail-forward" approach.

## Import Schema

### ContactImportSchema Interface

```typescript
// From useContactImport.tsx lines 6-24
export interface ContactImportSchema {
  // Required fields
  first_name: string;
  last_name: string;
  organization_name: string;        // MANDATORY - contact skipped if missing

  // Optional profile fields
  gender?: string;
  title?: string;
  organization_role?: string;       // Defaults to "decision_maker"

  // Email fields (transformed to JSONB array)
  email_work?: string;
  email_home?: string;
  email_other?: string;

  // Phone fields (transformed to JSONB array)
  phone_work?: string;
  phone_home?: string;
  phone_other?: string;

  // Additional optional fields
  avatar?: string;
  first_seen?: string;              // ISO 8601 timestamp
  last_seen?: string;               // ISO 8601 timestamp
  tags?: string;                    // Comma-separated: "influencer, developer"
  linkedin_url?: string;
}
```

### Data Transformation

**Email/Phone Consolidation** (from useContactImport.tsx lines 104-113):

```typescript
// Spreadsheet columns → JSONB arrays
const email = [
  { email: email_work, type: "Work" },
  { email: email_home, type: "Home" },
  { email: email_other, type: "Other" }
].filter(({ email }) => email);

const phone = [
  { number: phone_work, type: "Work" },
  { number: phone_home, type: "Home" },
  { number: phone_other, type: "Other" }
].filter(({ number }) => number);
```

**Tag Parsing** (from useContactImport.tsx lines 230-234):

```typescript
const parseTags = (tags: string) =>
  tags
    ?.split(",")
    ?.map((tag: string) => tag.trim())
    ?.filter((tag: string) => tag) ?? [];
```

### Sample CSV Format

From `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/contacts_export.csv`:

```csv
first_name,last_name,gender,title,organization_name,organization_role,first_seen,last_seen,tags,linkedin_url,email_work,email_home,email_other,phone_work,phone_home,phone_other
John,Doe,male,Sales Executive,Acme Corporation,decision_maker,2024-07-01T00:00:00+00:00,2024-07-01T11:54:49.95+00:00,"influencer, developer",https://www.linkedin.com/in/johndoe,john@doe.example,john.doe@gmail.com,jdoe@caramail.com,659-980-2015,740.645.3807,(446) 758-2122
```

## Integration Points

### React Admin Data Provider Usage

```typescript
// From useContactImport.tsx

// 1. Query for existing records
const response = await dataProvider.getList(resource, {
  filter: { "name@in": `(${names.map(n => `"${n}"`).join(",")})` },
  pagination: { page: 1, perPage: trimmedNames.length },
  sort: { field: "id", order: "ASC" }
});

// 2. Create new records
await dataProvider.create(resource, {
  data: getCreateData(name)
});

// 3. Create contacts with full payload
const contactResponse = await dataProvider.create("contacts", {
  data: {
    first_name, last_name, gender, title,
    email, phone, tags: tagList.map(tag => tag.id),
    first_seen, last_seen, linkedin_url, sales_id
  }
});

// 4. Create junction table relationship
await dataProvider.create("contact_organizations", {
  data: {
    contact_id: contactId,
    organization_id: organization.id,
    is_primary: true,
    role: organization_role || "decision_maker"
  }
});
```

**Data Provider Chain**: Calls go through `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/unifiedDataProvider.ts` which:
- Validates data using Zod schemas
- Transforms data (handles avatar uploads, normalizes JSONB fields)
- Logs errors with context
- Delegates to `ra-supabase-core` base provider

### Supabase Database Integration

**contact_organizations Junction Table** (from database schema):
```sql
CREATE TABLE contact_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  role TEXT,  -- Optional role at this organization
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

**Pattern**: Many-to-many relationship between contacts and organizations. Import creates one primary relationship per contact (is_primary = true).

### FileInput Component Pattern

From `/home/krwhynot/projects/crispy-crm/src/components/admin/file-input.tsx`:

```typescript
<FileInput
  source="csv"
  label="CSV File"
  accept={{ "text/csv": [".csv"] }}
  onChange={handleFileChange}
>
  <FileField source="src" title="title" target="_blank" />
</FileInput>
```

**Technology**: Built on `react-dropzone` library
**Features**:
- Drag-and-drop file upload
- File type validation (accepts only `.csv`)
- File preview with removal capability
- Integrates with React Admin's form system
- Transforms `File` objects to `TransformedFile` with preview URLs

## Edge Cases & Gotchas

### No Validation Against Zod Schemas

**Current Implementation**: CSV data is NOT validated against `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/contacts.ts` schemas before import.

**Implication**: Invalid data (e.g., malformed emails, missing required fields) may fail during database insertion, resulting in batch errors.

**Example**:
```typescript
// contactSchema validates emails, but CSV import bypasses this
export const contactSchema = contactBaseSchema
  .transform(transformContactData)
  .superRefine((data, ctx) => {
    if (data.email && Array.isArray(data.email)) {
      data.email.forEach((entry: any, index: number) => {
        if (!emailValidator.safeParse(entry.email).success) {
          ctx.addIssue({ /* validation error */ });
        }
      });
    }
  });
```

**Rationale**: Import trusts CSV format is correct. Per "NO OVER-ENGINEERING" principle, validation can be added later if needed.

### No Duplicate Detection

**Behavior**: Import does NOT check for existing contacts with matching names/emails before creating records.

**Example**: Importing the same CSV twice creates duplicate contacts.

**Workaround**: Users must deduplicate CSV files before import or manage duplicates manually in the UI afterward.

### Single Organization Limitation

**Schema Supports**: Contacts can have multiple organizations via `contact_organizations` junction table.

**Import Only Creates**: One primary organization relationship per contact (is_primary = true).

**Enhancement Opportunity**: Could extend CSV schema to support multiple organizations with pipe-separated format: `Acme|TechCorp|StartupInc`.

### Database-Level Timestamps Automatic

```typescript
// From useContactImport.tsx lines 147-152
first_seen: first_seen
  ? new Date(first_seen).toISOString()
  : today,
last_seen: last_seen
  ? new Date(last_seen).toISOString()
  : today,
```

**Pattern**: Import explicitly sets `first_seen` and `last_seen` from CSV or defaults to `today`.

**Database Triggers**: `created_at` and `updated_at` automatically set by database triggers (not in import code).

### Organization Role Default

```typescript
// From useContactImport.tsx lines 167-168
role: organization_role || "decision_maker",
```

**Gotcha**: If CSV `organization_role` column is blank, defaults to "decision_maker".

**Database Schema**: `role` field is TEXT (free-form), not an enum. No validation on allowed values.

### Tag Color Assignment

```typescript
// From useContactImport.tsx lines 64-68
getTags = useCallback(async (names: string[]) =>
  fetchRecordsWithCache<Tag>(
    "tags",
    tagsCache,
    names,
    (name) => ({ name, color: "gray" }),  // All new tags default to gray
    dataProvider
  )
);
```

**Gotcha**: CSV cannot specify tag colors. All newly created tags default to "gray" color.

**Enhancement Opportunity**: Could extend CSV schema to support tag colors: `influencer:blue,developer:green`.

### Browser Memory Constraints

**Large Files**: Very large CSVs (10,000+ rows) parsed entirely in browser memory before batching begins.

**Risk**: May cause browser performance degradation or crashes on low-memory devices.

**Current Mitigation**: Batch processing (10 at a time) prevents overwhelming Supabase API, but doesn't address browser memory for initial parse.

**Potential Enhancement**: Streaming CSV parser that processes incrementally rather than loading entire file into memory.

### Import ID Tracking for Cancellation

```typescript
// From usePapaParse.tsx lines 39-49, 63-65, 77-79
const importIdRef = useRef<number>(0);

const reset = useCallback(() => {
  setImporter({ state: "idle" });
  importIdRef.current += 1;  // Increment ID to invalidate in-progress import
}, []);

// During batch processing
if (importIdRef.current !== importId) {
  return;  // Stop processing if import was cancelled
}
```

**Pattern**: Each import gets unique ID. Clicking "Stop Import" increments ID, causing batch loop to exit early on next iteration.

**Gotcha**: Currently processing batch still completes. Cancellation only prevents subsequent batches from starting.

## Key Functions & Interfaces

### usePapaParse Hook Signature

```typescript
// From usePapaParse.tsx lines 27-38
type usePapaParseProps<T> = {
  batchSize?: number;                    // Default: 10
  processBatch(batch: T[]): Promise<void>;
};

function usePapaParse<T>({
  batchSize = 10,
  processBatch
}: usePapaParseProps<T>) {
  return {
    importer: Import,      // Current state
    parseCsv: (file: File) => void,
    reset: () => void
  };
}
```

**ZEN GAP FIX - Enhanced Hook Interface (Backward Compatible)**:
```typescript
type usePapaParseProps<T> = {
  batchSize?: number;                    // Default: 10
  processBatch(batch: T[]): Promise<{
    successCount: number;
    errors: ImportError[];                // ZEN FIX: Return errors for tracking
  }>;

  // NEW OPTIONAL parameters for Phase 1 (all optional for backward compatibility)
  transformHeaders?: (headers: string[]) => string[];
  onPreview?: (preview: {
    headers: string[];
    rows: T[];
    mappings: ColumnMapping[];
  }) => Promise<boolean>;                 // Returns true to continue, false to cancel
  previewRowCount?: number;               // Default: 0 (no preview)
};
```

**CRITICAL IMPLEMENTATION NOTE**:
The `processBatch` implementation in `useContactImport` MUST use `Promise.allSettled` instead of `Promise.all` when processing individual contacts within the batch. This ensures:
- All rows in a batch are attempted even if some fail
- Individual row errors are collected and returned in the `errors` array
- The `successCount` accurately reflects only successful imports
Without this change, a single row error would fail the entire batch and prevent error collection for other rows.

**Reusability**: Generic `<T>` allows use for any CSV import (contacts, organizations, opportunities, etc.). Currently only used for contacts but designed for expansion.

### useContactImport Hook Signature

```typescript
// From useContactImport.tsx lines 26-184
export function useContactImport() {
  const processBatch = useCallback(
    async (batch: ContactImportSchema[]) => {
      // 1. Resolve organizations and tags
      const [organizations, tags] = await Promise.all([
        getOrganizations(batch.map(c => c.organization_name)),
        getTags(batch.flatMap(b => parseTags(b.tags)))
      ]);

      // 2. Create contacts and relationships
      await Promise.all(
        batch.map(async (contact) => {
          // Create contact record
          const contactResponse = await dataProvider.create("contacts", {...});

          // Create contact_organizations junction
          await dataProvider.create("contact_organizations", {...});
        })
      );
    },
    [dataProvider, getOrganizations, getTags, identity?.id, today]
  );

  return processBatch;
}
```

**Pattern**: Returns single `processBatch` function that encapsulates all contact import logic. Consumed by `usePapaParse` hook.

### fetchRecordsWithCache Utility

```typescript
// From useContactImport.tsx lines 186-228
const fetchRecordsWithCache = async function <T>(
  resource: string,                          // "organizations" or "tags"
  cache: Map<string, T>,                     // In-memory cache
  names: string[],                           // Record names to fetch/create
  getCreateData: (name: string) => Partial<T>,  // Factory for new records
  dataProvider: DataProvider
) => {
  // 1. Check cache for existing records
  const uncachedRecordNames = names.filter(name => !cache.has(name));

  // 2. Query database for uncached records
  if (uncachedRecordNames.length > 0) {
    const response = await dataProvider.getList(resource, {
      filter: { "name@in": `(${uncachedRecordNames.map(n => `"${n}"`).join(",")})` }
    });
    // Add to cache
    for (const record of response.data) {
      cache.set(record.name.trim(), record);
    }
  }

  // 3. Create missing records in parallel
  await Promise.all(
    uncachedRecordNames.map(async (name) => {
      if (cache.has(name)) return;
      const response = await dataProvider.create(resource, {
        data: getCreateData(name)
      });
      cache.set(name, response.data);
    })
  );

  // 4. Return map of all requested records
  return names.reduce((acc, name) => {
    acc.set(name, cache.get(name) as T);
    return acc;
  }, new Map<string, T>());
};
```

**Key Insight**: Generic caching utility that works for any resource with a `name` field. Minimizes API calls by:
1. Checking in-memory cache first
2. Batching database queries using `@in` filter
3. Creating missing records in parallel
4. Persisting cache across multiple batches (same import session)

### Type Definitions

```typescript
// From types.ts lines 100-108
export interface ContactOrganization {
  id?: Identifier;
  contact_id: Identifier;
  organization_id: Identifier;
  is_primary: boolean;        // Indicates primary organization
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

// From types.ts lines 63-71
export interface EmailAndType {
  email: string;
  type: "Work" | "Home" | "Other";
}

export interface PhoneNumberAndType {
  number: string;
  type: "Work" | "Home" | "Other";
}

// From tags/types.ts lines 6-11
export interface Tag {
  id: string;
  name: string;
  color: TagColorName | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

// From filters/types.ts lines 80-83
export interface Organization {
  id: string | number;
  name: string;
}
```

## Code Snippets - Key Implementations

### Batch Processing Loop with ETA Calculation

```typescript
// From usePapaParse.tsx lines 75-111
let totalTime = 0;
for (let i = 0; i < results.data.length; i += batchSize) {
  if (importIdRef.current !== importId) {
    return;  // Import was cancelled
  }

  const batch = results.data.slice(i, i + batchSize);
  try {
    const start = Date.now();
    await processBatch(batch);
    totalTime += Date.now() - start;

    const meanTime = totalTime / (i + batch.length);
    setImporter((previous) => {
      if (previous.state === "running") {
        const importCount = previous.importCount + batch.length;
        return {
          ...previous,
          importCount,
          remainingTime: meanTime * (results.data.length - importCount)
        };
      }
      return previous;
    });
  } catch (error) {
    console.error("Failed to import batch", error);
    setImporter((previous) =>
      previous.state === "running"
        ? { ...previous, errorCount: previous.errorCount + batch.length }
        : previous
    );
  }
}
```

**ETA Algorithm**:
- Track cumulative processing time across all batches
- Calculate mean time per contact: `totalTime / contactsProcessed`
- Estimate remaining: `meanTime × contactsRemaining`
- Becomes more accurate as more batches complete

### Organization and Tag Resolution

```typescript
// From useContactImport.tsx lines 74-82
const processBatch = useCallback(async (batch: ContactImportSchema[]) => {
  const [organizations, tags] = await Promise.all([
    getOrganizations(
      batch
        .map((contact) => contact.organization_name?.trim())
        .filter((name) => name)
    ),
    getTags(batch.flatMap((batch) => parseTags(batch.tags)))
  ]);

  // organizations and tags are now Maps for fast lookup
});
```

**Optimization**: Both lookups happen in parallel via `Promise.all`. Caching prevents redundant API calls within same import session.

### Contact Creation with Relationship Linking

```typescript
// From useContactImport.tsx lines 138-176
// Step 1: Create contact record
const contactResponse = await dataProvider.create("contacts", {
  data: {
    first_name,
    last_name,
    gender,
    title,
    email,  // Transformed JSONB array
    phone,  // Transformed JSONB array
    first_seen: first_seen ? new Date(first_seen).toISOString() : today,
    last_seen: last_seen ? new Date(last_seen).toISOString() : today,
    tags: tagList.map((tag) => tag.id),
    sales_id: identity?.id,
    linkedin_url
  }
});

const contactId = contactResponse.data.id;

// Step 2: Create contact_organization junction entry
if (contactId) {
  await dataProvider.create("contact_organizations", {
    data: {
      contact_id: contactId,
      organization_id: organization.id,
      is_primary: true,
      role: organization_role || "decision_maker"
    }
  });
} else {
  console.error(
    `Failed to retrieve contact ID for ${first_name} ${last_name}.`
  );
}
```

**Two-Step Process**:
1. Create contact record → get `contactId`
2. Create junction table entry linking contact to organization

**Critical**: Junction table creation depends on successful contact creation. If contact creation fails, junction entry is skipped (fail-fast).

## Architectural Insights

### Reusability by Design

`usePapaParse` is a **generic hook** that can be used for any resource import:

```typescript
// Current usage for contacts
const processBatch = useContactImport();
const { importer, parseCsv, reset } = usePapaParse<ContactImportSchema>({
  batchSize: 10,
  processBatch
});

// Could be extended for organizations
const processBatch = useOrganizationImport();
const { importer, parseCsv, reset } = usePapaParse<OrganizationImportSchema>({
  batchSize: 20,
  processBatch
});
```

**Pattern**: Parser logic completely decoupled from business logic. Only `ContactImportSchema` and `useContactImport` are contact-specific.

### Performance Optimization Tradeoffs

**Batch Size (10 records)**: Balance between:
- **Too Small** (e.g., 1): Too many sequential API calls, slow import
- **Too Large** (e.g., 100): Risk of timeout, no progress updates for long periods
- **Current (10)**: Good balance for typical imports (100-1000 contacts)

**Caching Strategy**: In-memory cache cleared only on reset. Entire import session shares cache.
- **Pro**: Minimal API calls for repeated lookups
- **Con**: Cache not persisted between separate imports

**Sequential Batches (not parallel)**:
- **Pro**: Prevents API rate limiting, predictable progress
- **Con**: Slower than parallel processing (but safer)

### Fail-Fast Philosophy Alignment

Per Engineering Constitution principle #1 ("NO OVER-ENGINEERING"):

**What's NOT implemented** (intentionally):
- ❌ Transaction rollback on partial failures
- ❌ Duplicate detection
- ❌ CSV schema validation before import
- ❌ Retry logic for failed API calls
- ❌ Circuit breakers
- ❌ Import preview with confirmation

**What IS implemented** (minimal viable feature):
- ✅ Simple error logging to console
- ✅ Skip contacts with missing required fields
- ✅ Continue processing on individual failures
- ✅ Display final error count to user

**Rationale**: Import is intentionally simple. Advanced features can be added later based on actual user needs, not anticipated edge cases.

### Single Source of Truth Pattern

**Data Provider as Gateway**: All database operations go through React Admin's data provider:

```typescript
dataProvider.getList(...)    // Query records
dataProvider.create(...)     // Create records
```

**NOT** direct Supabase client calls:
```typescript
supabase.from('contacts').insert(...)  // ❌ NEVER used in import
```

**Benefits**:
- Centralized validation (via unifiedDataProvider)
- Consistent error handling
- Automatic transformation (JSONB normalization, avatar uploads)
- Follows React Admin patterns for all CRUD operations

## Testing Considerations

### Current Test Coverage

No dedicated tests found for import functionality. Manual testing via:
1. Sample CSV provided: `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/contacts_export.csv`
2. Import button accessible in Contact List view

### Test Scenarios to Cover (for enhancement)

**Unit Tests**:
- `parseTags()` utility: comma-separated parsing, trimming, empty handling
- `fetchRecordsWithCache()`: cache hits/misses, parallel creation, map building
- Email/phone transformation: JSONB array construction from CSV columns

**Integration Tests**:
- `usePapaParse`: batch processing, state transitions, ETA calculation
- `useContactImport`: organization/tag resolution, contact creation, junction linking

**E2E Tests**:
- Full import flow: file selection → parsing → batch processing → completion
- Error handling: malformed CSV, missing required fields, API failures
- Cancellation: stop import mid-process, verify no additional batches run

## Enhancement Opportunities

Based on current architecture analysis:

### 1. Add CSV Export Functionality

**Pattern to Follow**: Mirror import architecture:
- `ContactExportButton` (entry point)
- `ContactExportDialog` (UI with export options)
- `useContactExport` hook (fetch + transform to CSV)
- Reuse `usePapaParse` pattern (but reversed for CSV generation)

**Library**: Use PapaParse's `Papa.unparse()` for CSV generation

### 2. Extend to Other Resources

**Organizations Import**:
```typescript
interface OrganizationImportSchema {
  name: string;
  type: "customer" | "prospect" | "principal" | "distributor";
  priority: "A" | "B" | "C" | "D";
  website?: string;
  // ...
}
```

**Opportunities Import**: More complex (requires contact/organization relationships)

### 3. Add Validation Layer

Integrate Zod schemas before import:

```typescript
// Pre-import validation
const validatedBatch = batch.map(contact =>
  contactSchema.parse(contact)  // Throws on invalid data
);
```

**Tradeoff**: Slower import (extra parsing) but fewer database errors.

### 4. Preview Before Import

Add intermediate state to FSM:

```
idle → parsing → preview → running → complete
```

Show first 5 rows with "Looks good? Import" confirmation.

### 5. Background Import for Large Files

Use Web Workers for CSV parsing:

```typescript
const worker = new Worker('csv-parser.worker.js');
worker.postMessage({ file, batchSize });
worker.onmessage = (e) => {
  processBatch(e.data.batch);
};
```

**Benefit**: Prevents UI blocking on large CSVs.

### 6. Import Error Report

Track failed records with reasons:

```typescript
interface ImportError {
  rowNumber: number;
  data: ContactImportSchema;
  error: string;
}

// Generate downloadable CSV of failed records
```

**UX**: User downloads errors.csv, fixes issues, re-imports only failed records.

## Conclusion

The current CSV import architecture demonstrates clean separation of concerns, effective caching, and adherence to fail-fast principles. The generic `usePapaParse` hook provides excellent foundation for extending import functionality to other resources. Key areas for enhancement include:

1. **Export functionality** (mirroring import pattern)
2. **Validation integration** (Zod schema enforcement)
3. **Error reporting** (downloadable failed records report)
4. **Resource expansion** (organizations, opportunities)

The browser-side parsing approach is elegant and performant, eliminating server-side file handling while maintaining good UX with progress tracking and ETA calculation.
