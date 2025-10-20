# CSV Import/Export System Enhancement - Requirements Document

## 1. Feature Summary

Enhance the CSV import/export system to handle real-world CSV file variations, eliminating the current 100% failure rate when column headers don't exactly match expected schema. The improvement introduces intelligent column mapping, validation preview, and better error reporting while maintaining the fail-fast philosophy and browser-based architecture.

**Phase 1** (1-2 weeks): Core flexibility improvements - column aliasing, name splitting, preview validation, enhanced error reporting, and export templates.

**Phase 2** (Post-launch, conditional): Advanced features - interactive column mapping UI, server-side background processing, downloadable error reports, and saved mapping templates. Triggered only if Phase 1 success rate falls below 85%.

---

## 2. User Stories

### Phase 1: Essential Flexibility

**As a** sales manager importing contacts from a spreadsheet,
**I want** the system to automatically recognize common column name variations (e.g., "Email" vs. "email_work", "Company" vs. "organization_name"),
**So that** I don't have to manually rename every column before importing.

**As a** user with a CSV file containing "Full Name" in one column,
**I want** the system to automatically split it into first and last names,
**So that** I don't have to manually split 2000+ rows in Excel.

**As a** user about to import 2000 contacts,
**I want** to see a preview of what will be imported and what will fail BEFORE starting the 7-minute import process,
**So that** I can fix issues upfront rather than discovering them after the import completes.

**As a** user whose import failed,
**I want** to see exactly which rows failed and why in a clear UI modal,
**So that** I can correct the data and retry without guessing what went wrong.

**As a** new user preparing to import contacts,
**I want** to download a template CSV with the exact format expected by the system,
**So that** I know how to structure my data correctly.

### Phase 2: Advanced Capabilities

**As a** user with complex CSV files that don't match common patterns,
**I want** to manually map my columns to CRM fields via an interactive interface,
**So that** I can import data regardless of how differently it's structured.

**As a** user importing 10,000+ contacts,
**I want** the import to run in the background on the server,
**So that** I don't have to keep my browser tab open for 30+ minutes.

**As a** user whose import partially failed,
**I want** to download a CSV with error details for each failed row,
**So that** I can fix only the failed records and re-import them.

**As a** user who imports from the same source monthly,
**I want** to save my column mapping configuration,
**So that** I don't have to re-map columns every time.

---

## 3. Technical Approach

### Phase 1: Core Improvements (~40 hours, 1-2 weeks)

#### Frontend Components

**New Components:**

1. **`src/atomic-crm/contacts/columnAliases.ts`** - Column mapping registry
   ```typescript
   // ZEN GAP FIX: Map to ContactImportSchema fields, NOT database fields
   export const COLUMN_ALIASES: Record<string, string[]> = {
     // Maps to CSV import fields, not DB fields
     organization_name: ['Organizations', 'Company', 'Organizations (DropDown)', ...],
     first_name: ['First Name', 'First', 'Given Name', ...],
     email_work: ['Email', 'E-mail', 'Email Address', 'Work Email', ...],  // NOT 'email'!
     email_home: ['Personal Email', 'Home Email', ...],  // NOT 'email'!
     // ... all field mappings
   };

   export function normalizeHeader(header: string): string;
   export function findCanonicalField(userHeader: string): string | null;
   // REMOVED: splitFullName - reuse existing transformContactData instead
   ```

2. **`src/atomic-crm/contacts/ContactImportPreview.tsx`** - Validation preview modal
   ```typescript
   interface ImportPreview {
     totalRows: number;
     validRows: number;
     skippedRows: number;
     newOrganizations: number;
     columnMappings: Array<{ userColumn: string; crmField: string | null }>;
     warnings: Array<{ row: number; message: string }>;
     sampleData: Array<{ original: Record<string, string>; mapped: ContactImportSchema }>; // ZEN FIX: Not Contact type
   }

   // ZEN GAP FIX: Preview validation respects "Zod at API boundary" principle
   // Use dry-run through data provider for validation (no double validation)
   ```

3. **`src/atomic-crm/contacts/ContactImportResult.tsx`** - Enhanced error reporting modal
   ```typescript
   interface ImportResult {
     totalProcessed: number;
     successCount: number;
     skippedCount: number;
     failedCount: number;
     errors: Array<{ row: number; data: Partial<Contact>; reason: string }>;
     duration: number;
   }
   ```

4. **`src/atomic-crm/contacts/ContactExportTemplateButton.tsx`** - Template download button
   - Generates blank CSV with canonical headers
   - Includes sample row showing expected formats
   - Provides help text in modal or tooltip

**Modified Components:**

5. **`src/atomic-crm/misc/usePapaParse.tsx`** - Enhanced CSV parsing (BACKWARD COMPATIBLE)
   - Add OPTIONAL header transformation via `columnAliases`
   - Detect multi-line headers (skip instruction rows)
   - NO full name splitting here (reuse existing `transformContactData`)
   - Add OPTIONAL preview mode callback (parse first 10 rows only)
   - **ZEN GAP FIX:** All new parameters are optional to maintain backward compatibility

6. **`src/atomic-crm/contacts/ContactImportDialog.tsx`** - Add preview step (FEATURE FLAGGED)
   - New workflow: File Upload → Preview → Import → Results
   - State machine: `idle` → `parsing` → `previewing` → `confirmed` → `running` → `complete`
   - **ZEN GAP FIX:** Keep existing FSM states, add new ones as extensions
   - **ZEN GAP FIX:** Feature flag `ENABLE_IMPORT_PREVIEW` (default: false initially)
   - Show column mappings before import
   - Display validation warnings

7. **`src/atomic-crm/contacts/useContactImport.tsx`** - Better error tracking
   - Track errors per row (not just count)
   - Return detailed error objects
   - Support preview mode (dry-run first N rows)

8. **`src/atomic-crm/contacts/ContactList.tsx`** - Add template button
   - Include `<ContactExportTemplateButton />` in TopToolbar
   - Update exporter to use canonical headers

#### API Endpoints

**No new API endpoints required** - uses existing React Admin data provider:
- `dataProvider.getList('organizations', ...)` - Org lookup
- `dataProvider.create('organizations', ...)` - Org creation
- `dataProvider.create('contacts', ...)` - Contact creation
- `dataProvider.create('contact_organizations', ...)` - Junction link

#### Data Flow Diagram

```
┌─────────────────┐
│ User Uploads    │
│ CSV File        │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│ usePapaParse (Enhanced)                     │
│ • Parse headers                             │
│ • Apply columnAliases.findCanonicalField()  │
│ • Detect full name columns                  │
│ • Skip instruction rows                     │
│ • Parse first 10 rows (preview mode)        │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│ ContactImportPreview Component              │
│ • Show column mappings table                │
│ • Display 5 sample transformed rows         │
│ • Count valid vs. skipped rows              │
│ • List warnings (missing org, invalid email)│
│ • User clicks "Continue" or "Cancel"        │
└────────┬────────────────────────────────────┘
         │ (User confirms)
         ▼
┌─────────────────────────────────────────────┐
│ useContactImport (Enhanced)                 │
│ • Process in batches (10 rows)              │
│ • Cache org/tag lookups                     │
│ • Track errors per row                      │
│ • Create contacts + link orgs               │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│ ContactImportResult Component               │
│ • Show success/skipped/failed counts        │
│ • List all errors with row numbers          │
│ • Display import duration                   │
│ • Refresh contact list on close             │
└─────────────────────────────────────────────┘
```

#### Database Changes

**None required** - Phase 1 uses existing schema:
- `contacts` table (NO organization_id FK - ZEN GAP FIX: uses junction table pattern)
- `organizations` table
- `tags` table
- `contact_organizations` junction (for multi-org support)

---

### Phase 2: Advanced Features (~120 hours, post-launch)

**Triggered when:** Phase 1 success rate < 85% OR user feedback demands advanced features

#### Frontend Components

**New Components:**

1. **`src/atomic-crm/contacts/ContactColumnMapper.tsx`** - Interactive mapping UI
   - Drag-and-drop interface for column mapping
   - Support complex transformations (split, combine, format)
   - Visual validation (red/green indicators)
   - Save/load mapping templates

2. **`src/atomic-crm/contacts/ContactImportJobStatus.tsx`** - Background job tracker
   - Polling for job status updates
   - Progress bar with server-side updates
   - Email notification opt-in

3. **`src/atomic-crm/contacts/ContactImportErrorReport.tsx`** - Error export
   - Download CSV with import_status + error_message columns
   - Filter to show only failed rows
   - Re-upload for retry

#### API Endpoints

**New Supabase Edge Functions:**

1. **`supabase/functions/import-contacts/index.ts`**
   - Accept CSV file + mapping configuration
   - Create job record in `import_jobs` table
   - Process in background
   - Update job status
   - Send email on completion

**Zod Schemas:**

```typescript
// supabase/functions/import-contacts/schemas.ts
const importJobSchema = z.object({
  user_id: z.string().uuid(),
  file_url: z.string().url(),
  mapping_config: z.record(z.string()),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  total_rows: z.number().int().positive(),
  processed_rows: z.number().int().nonnegative(),
  success_count: z.number().int().nonnegative(),
  error_count: z.number().int().nonnegative(),
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
});
```

#### Database Changes

**New Table: `import_jobs`** (if Phase 2 is implemented)

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_import_jobs.sql
CREATE TABLE import_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL, -- 'contacts', 'organizations', etc.
  file_url TEXT NOT NULL,
  mapping_config JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  total_rows INTEGER NOT NULL,
  processed_rows INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  CONSTRAINT import_jobs_counts_check CHECK (
    processed_rows <= total_rows AND
    success_count + error_count <= processed_rows
  )
);

CREATE INDEX idx_import_jobs_user_id ON import_jobs(user_id);
CREATE INDEX idx_import_jobs_status ON import_jobs(status) WHERE status IN ('pending', 'running');

-- RLS policies
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own import jobs"
  ON import_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own import jobs"
  ON import_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

**New Table: `saved_import_mappings`** (optional)

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_add_saved_import_mappings.sql
CREATE TABLE saved_import_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  mapping_config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (user_id, name, resource_type)
);

CREATE INDEX idx_saved_mappings_user ON saved_import_mappings(user_id, resource_type);

ALTER TABLE saved_import_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saved mappings"
  ON saved_import_mappings
  USING (auth.uid() = user_id);
```

---

## 4. UI/UX Flow

### Phase 1: Enhanced Import Flow

**Step 1: File Upload (Unchanged)**
- User clicks "Import" button in ContactList toolbar
- Modal opens showing file upload interface
- User selects CSV file or drags & drops

**Step 2: Preview & Validation (NEW)**

1. System parses CSV headers + first 10 rows
2. Applies column alias matching automatically
3. Detects special cases (full name columns, multi-line headers)
4. Shows **preview modal** with three sections:

   **Section A: Column Mapping Table**
   ```
   ┌─────────────────────────────────────────────┐
   │ Your Column          → CRM Field             │
   ├─────────────────────────────────────────────┤
   │ FULL NAME (FIRST...) → first_name + last_name│
   │ Organizations (Dro...) → organization_name   │
   │ EMAIL                → email_work            │
   │ PHONE                → phone_work            │
   │ PRIORITY             → (ignored)             │
   └─────────────────────────────────────────────┘
   ```

   **Section B: Sample Data Preview**
   ```
   Showing 5 of 2,145 contacts:
   ┌────────────┬──────────┬─────────────────┐
   │ First Name │ Last Name│ Organization    │
   ├────────────┼──────────┼─────────────────┤
   │ Stephen    │ Hess     │ Gordon Food Svc │
   │ Alissa     │ Jeffery  │ Chef's Warehouse│
   │ ...        │          │                 │
   └────────────┴──────────┴─────────────────┘
   ```

   **Section C: Validation Summary**
   ```
   ✅ Ready to Import

   • 2,140 contacts will be imported
   • 5 contacts will be skipped (missing organization)
   • 12 new organizations will be created
   • 3 new tags will be created

   ⚠️ Warnings:
   - Row 23: Missing organization name
   - Row 45: Missing organization name
   - Row 67: Invalid email format
   ```

5. User reviews and clicks:
   - **"Continue Import"** → Proceeds to Step 3
   - **"Cancel"** → Closes modal, no import

**Step 3: Import Processing (Enhanced)**
- Progress bar: "Importing contacts... 150 / 2,140 (7%)"
- Live error counter: "2 errors"
- Estimated time: "6 minutes remaining"
- "Stop Import" button available

**Step 4: Results (NEW)**
- Modal shows import summary:
  ```
  ✅ Import Complete

  2,135 contacts imported successfully
  5 contacts skipped
  0 failed

  ⚠️ Skipped Rows:
  - Row 23: Missing required field "organization_name"
  - Row 45: Missing required field "organization_name"
  - Row 67: Invalid email format "test@"
  - Row 89: Missing required field "organization_name"
  - Row 102: Missing required field "organization_name"

  Duration: 6 minutes 34 seconds
  ```
- Contact list auto-refreshes on close

**Step 5: Template Download (NEW)**
- **"Download Import Template"** button in ContactList toolbar
- Downloads `contact_import_template.csv`:
  ```csv
  first_name,last_name,organization_name,email_work,phone_work,...
  John,Doe,Acme Corp,john@example.com,555-0100,...
  ```
- Includes sample row with format examples

---

### Phase 2: Interactive Mapping Flow (Conditional)

**Step 2B: Manual Column Mapping (Replaces Auto-Mapping)**

If automatic alias matching fails or user wants custom mapping:

1. User sees **column mapper interface**:
   ```
   ┌───────────────────────────────────────────────────┐
   │ Map Your Columns to CRM Fields                    │
   ├───────────────────────────────────────────────────┤
   │ Your CSV Column        CRM Field                  │
   │ ┌───────────────────┐  ┌────────────────────┐    │
   │ │ FULL NAME         │→ │ [first_name ▼]     │    │
   │ └───────────────────┘  └────────────────────┘    │
   │                        ┌────────────────────┐    │
   │                     ↘  │ [last_name ▼]      │    │
   │                        └────────────────────┘    │
   │ ┌───────────────────┐  ┌────────────────────┐    │
   │ │ Organizations     │→ │ [organization_name]│ ✓  │
   │ └───────────────────┘  └────────────────────┘    │
   │ ┌───────────────────┐  ┌────────────────────┐    │
   │ │ PRIORITY          │→ │ [Ignore ▼]         │    │
   │ └───────────────────┘  └────────────────────┘    │
   └───────────────────────────────────────────────────┘

   Required fields: ✓ organization_name, ✓ first_name, ✓ last_name

   [Save Mapping Template]  [Continue]  [Cancel]
   ```

2. User maps columns via dropdowns
3. System validates required fields are mapped
4. User can save mapping for future use
5. Proceeds to preview (same as Phase 1 Step 2)

**Background Job Flow (Server-Side)**

For large imports (5000+ rows):

1. User uploads file → Gets job ID
2. Modal shows: "Import job started. You can close this window."
3. Job runs on server (Supabase Edge Function)
4. User can check status via "Import Jobs" page
5. Email notification on completion
6. User downloads error report if needed

---

## 5. Success Metrics

### Primary Metric: Import Success Rate

**Definition:** Percentage of CSV imports that complete with 0 errors (all intended rows imported)

**Current Baseline:** 0% (rigid schema matching causes 100% failure for non-matching CSVs)

**Phase 1 Target:** 85%+ success rate for real-world CSV files

**Measurement:**
```typescript
successRate = (importsWithZeroErrors / totalImportAttempts) * 100
```

**Tracking:**
- Log import attempts with outcome (success/partial/failure)
- Track common failure patterns (missing org, invalid email, etc.)
- Monitor user behavior (cancel after preview vs. continue)

### Secondary Metrics

**User Experience:**
- **Time to Discovery:** Average time between file upload and error discovery
  - Target: < 10 seconds (via preview, not 7-minute import)
- **Retry Rate:** Percentage of users who fix and re-import after failures
  - Target: > 50% (clear errors enable fixes)

**Technical Performance:**
- **API Call Reduction:** Caching efficiency for org/tag lookups
  - Maintain: ~85% reduction (current caching works well)
- **Preview Performance:** Time to parse and validate first 10 rows
  - Target: < 3 seconds for 2000-row CSV

**Phase 2 Triggers:**
- If Phase 1 success rate < 85% after 30 days → Implement Phase 2
- If > 20% of users request advanced mapping → Implement Phase 2
- If > 10% of imports exceed 5000 rows → Implement server-side processing

---

## 6. Out of Scope

### Phase 1 - Not Included:

❌ **Interactive Drag-and-Drop Column Mapping UI**
- Reason: Phase 2 feature, not needed if alias registry achieves 85% success

❌ **Server-Side Background Job Processing**
- Reason: Current browser-based approach handles 2000-5000 rows adequately

❌ **Downloadable Error Reports** (CSV with status columns)
- Reason: Phase 2 feature, UI error display sufficient for Phase 1

❌ **Saved Mapping Templates** (per-user configurations)
- Reason: Phase 2 feature, most imports will succeed with aliases

❌ **Real-Time Duplicate Detection**
- Reason: Outside scope of import system, requires separate deduplication feature

❌ **Import Scheduling and Automation**
- Reason: Not a user need at pre-launch scale

### Phase 2 - Conditional Implementation:

⚠️ **Phase 2 features implemented ONLY if:**
- Phase 1 success rate < 85% after user testing
- User feedback specifically requests advanced features
- Import volume exceeds browser processing limits (10k+ rows)

### Never in Scope (Architectural Constraints):

🚫 **Multi-Tenant RLS for Imports**
- Reason: Current system uses team-shared access model (all users see all data)

✅ **Data Model**: Contact-Organization Relationships
- Implementation: The import process will exclusively use the existing `contact_organizations` junction table
- Rationale: This junction table is the PRIMARY pattern (NOT deprecated) and supports many-to-many relationships
- Note: A contact can be associated with multiple organizations, which is a common business requirement

🚫 **AI-Powered Column Detection** (GPT-4 for header matching)
- Reason: Over-engineering, alias registry covers common variations

🚫 **Rollback/Undo Functionality**
- Reason: Validation preview prevents bad imports; rollback via Git branch if needed

🚫 **Full Transactional Imports** (all-or-nothing)
- Reason: Conflicts with fail-fast philosophy, partial success is acceptable

---

## 7. Implementation Notes

### Git Branch Strategy
- Create feature branch: `feature/csv-import-enhancement`
- All Phase 1 work happens on this branch
- Rollback capability: revert to main if issues arise
- No backward compatibility layers needed

### Testing Strategy
- **Unit tests:** Column alias matching, name splitting logic
- **Integration tests:** Import flow with sample CSVs
- **E2E tests:** Full import workflow (upload → preview → import → results)
- **Test data:** Use actual problematic CSV from user (`data/new-contacts.csv`)

### Validation Rules (No Changes)
- Reuse existing Zod schemas in `src/atomic-crm/validation/contacts.ts`
- Apply validation at API boundary only (Engineering Constitution)
- No new validation layers needed

### Performance Considerations
- **Preview parsing:** Parse only first 10 rows for speed
- **Caching:** Maintain existing org/tag caching strategy (85% reduction)
- **Batch size:** Keep at 10 contacts per batch (proven effective)
- **Browser limits:** Document 5000-row soft limit (Phase 2 for larger)

### Documentation Updates
- Update `docs/import-contacts.md` with new workflow
- Add column alias examples to user documentation
- Provide troubleshooting guide for common errors
- Update sample CSV template with best practices

---

## 8. Phase Dependencies

**Phase 1 → Phase 2 Decision Point:**

After Phase 1 launches, collect data for 30 days:
- Import success rate (target: 85%)
- User feedback on missing features
- Support ticket volume for import issues

**If success rate ≥ 85%:** Phase 2 not needed, monitor ongoing
**If success rate < 85%:** Implement Phase 2 interactive mapping
**If imports > 5000 rows become common:** Implement server-side processing

---

## Appendix: Column Alias Registry (Initial Set)

```typescript
export const COLUMN_ALIASES: Record<string, string[]> = {
  // Core identity fields
  first_name: ['first_name', 'first name', 'first', 'firstname', 'given name', 'fname'],
  last_name: ['last_name', 'last name', 'last', 'lastname', 'surname', 'family name', 'lname'],

  // Organization field (most critical)
  organization_name: [
    'organization_name', 'organization', 'organizations', 'company',
    'company name', 'business', 'org', 'organizations (dropdown)'
  ],

  // Contact info
  email_work: ['email_work', 'email', 'e-mail', 'email address', 'work email', 'business email'],
  email_home: ['email_home', 'home email', 'personal email'],
  phone_work: ['phone_work', 'phone', 'phone number', 'work phone', 'business phone', 'tel', 'telephone', 'mobile'],
  phone_home: ['phone_home', 'home phone', 'personal phone'],

  // Professional info
  title: ['title', 'job title', 'position', 'position (dropdown)', 'role'],

  // Other fields
  gender: ['gender', 'sex'],
  linkedin_url: ['linkedin_url', 'linkedin', 'linkedin profile'],
  tags: ['tags', 'categories', 'labels'],
};

// Special pattern: Full name columns
export const FULL_NAME_PATTERNS = [
  'full name', 'fullname', 'name', 'full name (first, last)',
  'full name (first,last)', 'contact name'
];
```

This registry will be expanded based on user feedback and common variations discovered during Phase 1.
