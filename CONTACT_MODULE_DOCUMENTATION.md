# Contact Module - Comprehensive Documentation

## Contact Page Overview

The Contact module is a core entity in Atomic CRM that manages all contact (people) records with full CRUD operations, advanced CSV import/export capabilities, multi-organization support, and comprehensive filtering. Located at `/src/atomic-crm/contacts/`, this module consists of **37 files** totaling **~7,113 lines of code**.

**Key Features:**
- Full CRUD operations (Create, Read, Update, Delete)
- Tabbed form interface with error tracking (Identity, Position, Contact Info, Account)
- CSV import with intelligent column mapping and preview
- CSV export with template generation
- Multi-organization relationship support
- Tag management with color-coded badges
- Full-text search across name, title, organization
- Advanced filtering (date ranges, tags, sales rep)
- Activity timeline and notes integration
- Avatar management with fallback to initials
- JSONB array handling for emails and phone numbers
- Responsive design (iPad-first, mobile-friendly)

---

## File Structure

### **Core CRUD Components** (4 files)
```
src/atomic-crm/contacts/
├── ContactList.tsx          (155 lines) - Main list view with filters
├── ContactShow.tsx          (143 lines) - Detail view with tabs
├── ContactEdit.tsx          (40 lines)  - Edit form
├── ContactCreate.tsx        (37 lines)  - Creation form
└── ContactEmpty.tsx         (28 lines)  - Empty state
```

### **Form Components - Tabbed Interface** (5 files)
```
src/atomic-crm/contacts/
├── ContactInputs.tsx        (37 lines)  - Tab orchestrator
├── ContactIdentityTab.tsx   (13 lines)  - Name fields
├── ContactPositionTab.tsx   (47 lines)  - Title, department, org
├── ContactInfoTab.tsx       (93 lines)  - Email/phone arrays
└── ContactAccountTab.tsx    (36 lines)  - Sales rep, notes
```

### **List Display Components** (6 files)
```
src/atomic-crm/contacts/
├── ContactListContent.tsx      (124 lines) - Card-based list
├── ContactListFilter.tsx       (117 lines) - Sidebar filters
├── SidebarActiveFilters.tsx    (57 lines)  - Active filter chips
├── useContactFilterChips.ts    (165 lines) - Filter state hook
├── ContactEmpty.tsx            (28 lines)  - Empty state
└── Avatar.tsx                  (37 lines)  - Avatar component
```

### **CSV Import/Export System** (11 files)
```
src/atomic-crm/contacts/
├── ContactImportButton.tsx         (30 lines)   - Import trigger
├── ContactImportDialog.tsx         (790 lines)  - Main import orchestration
├── ContactImportPreview.tsx        (843 lines)  - Preview UI
├── ContactImportResult.tsx         (365 lines)  - Results display
├── ContactExportTemplateButton.tsx (93 lines)   - Template download
├── useContactImport.tsx            (461 lines)  - Import logic hook
├── csvProcessor.ts                 (178 lines)  - CSV transformation
├── csvConstants.ts                 (17 lines)   - Shared constants
├── columnAliases.ts                (613 lines)  - Header mapping (200+ aliases)
├── contactImport.logic.ts          (118 lines)  - Business logic
└── contacts_export.csv             (template)   - Sample CSV
```

### **Sidebar & Supporting Components** (6 files)
```
src/atomic-crm/contacts/
├── ContactAside.tsx           (171 lines) - Sidebar for Show/Edit
├── ActivitiesTab.tsx          (186 lines) - Activity timeline
├── TagsList.tsx               (29 lines)  - Display tags
├── TagsListEdit.tsx           (137 lines) - Edit tags
├── MultiOrganizationInput.tsx (86 lines)  - Multi-org picker
└── ContactMultiOrg.tsx        (93 lines)  - Alternative org input
```

### **Index Files** (2 files)
```
src/atomic-crm/contacts/
├── index.ts                   (17 lines)  - Lazy-loaded exports
└── index.tsx                  (15 lines)  - Direct exports
```

### **Validation & Types**
```
src/atomic-crm/validation/
└── contacts.ts                (471 lines) - Zod schemas, validation functions

src/atomic-crm/types.ts
└── Contact interface          (Lines 83-100+)
```

### **Database Schema**
```
supabase/migrations/
├── 20251018152315_cloud_schema_fresh.sql          - Initial schema
├── 20251018203500_update_rls_for_shared_team_access.sql
├── 20251108213039_fix_rls_policies_role_based_access.sql
├── 20251111121526_add_role_based_permissions.sql
├── 20251020002305_fix_contacts_summary_security_invoker.sql
└── 20251103220544_remove_deprecated_contact_organizations.sql
```

### **Test Files** (7 files)
```
src/atomic-crm/contacts/__tests__/
├── ContactCreate.test.tsx     (358 lines) - Create form tests
├── ContactList.test.tsx       (471 lines) - List view tests
└── ContactShow.test.tsx       (372 lines) - Show page tests

src/atomic-crm/validation/__tests__/contacts/
├── integration.test.ts        - Integration tests
└── validation.test.ts         - Validation tests

tests/e2e/specs/contacts/
└── contacts-crud.spec.ts      (210 lines) - E2E tests

tests/e2e/support/poms/
├── ContactsListPage.ts        - List page object
├── ContactShowPage.ts         - Show page object
└── ContactFormPage.ts         - Form page object
```

---

## Components Used

### **1. React Admin Components** (from `react-admin` / `@/components/admin/`)

#### **Form Components**
- **`TabbedFormInputs`** - Main tabbed form container with automatic error tracking
- **`FormToolbar`** - Sticky toolbar with Cancel/Save buttons
- **`Form`** - Base form wrapper (React Hook Form integration)
- **`TextInput`** - Standard text input with validation
- **`SelectInput`** - Dropdown select
- **`ReferenceInput`** - Foreign key relationship input
- **`AutocompleteInput`** - Searchable dropdown
- **`ArrayInput`** - Dynamic array field manager
- **`SimpleFormIterator`** - Array item renderer
- **`BooleanInput`** - Checkbox/toggle
- **`FileInput`** - File upload

#### **Display/Field Components**
- **`TextField`** - Display text value
- **`ReferenceField`** - Display related record
- **`ReferenceManyField`** - One-to-many relationships
- **`ReferenceArrayField`** - Many-to-many relationships
- **`ArrayField`** - Display array values
- **`DateField`** - Formatted date display
- **`EmailField`** - Email with mailto link
- **`SingleFieldList`** - Array items without wrapper

#### **Button Components**
- **`CreateButton`** - Navigate to create page
- **`EditButton`** - Navigate to edit page
- **`ShowButton`** - Navigate to show page
- **`SaveButton`** - Form submit
- **`CancelButton`** - Navigate back/cancel
- **`ExportButton`** - CSV export
- **`SortButton`** - Column sorting
- **`CreateInDialogButton`** - Create related record in modal
- **`FloatingCreateButton`** - FAB (mobile-friendly)

#### **List/Table Components**
- **`List`** - List page container
- **`BulkActionsToolbar`** - Bulk operations

#### **Filter Components**
- **`SearchInput`** - Global search
- **`ToggleFilterButton`** - Toggle filter on/off

### **2. shadcn/ui Components** (from `@/components/ui/`)

#### **Layout Components**
- **`Card`, `CardContent`, `CardHeader`, `CardTitle`, `CardDescription`** - Card containers
- **`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`** - Tab navigation
- **`Separator`** - Visual divider
- **`Collapsible`, `CollapsibleContent`, `CollapsibleTrigger`** - Expandable sections

#### **Form Components**
- **`Button`** - Primary button (variants: default, outline, ghost)
- **`Checkbox`** - Accessible checkbox
- **`Label`** - Form label

#### **Feedback Components**
- **`Alert`, `AlertDescription`, `AlertTitle`** - Alert messages
- **`Badge`** - Label/tag display
- **`Skeleton`** - Loading placeholder
- **`Progress`** - Progress bar
- **`Tooltip`, `TooltipContent`, `TooltipTrigger`, `TooltipProvider`** - Hover tooltips

#### **Overlay Components**
- **`Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`** - Modal dialogs
- **`DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger`** - Dropdown menus

#### **Data Display**
- **`Avatar`, `AvatarImage`, `AvatarFallback`** - User/contact avatars

### **3. Design System Components** (from `@/components/design-system/`)

- **`ResponsiveGrid`** - Responsive grid layout
  - **Variants:**
    - `dashboard`: 70/30 split (main + sidebar) - Used in Edit/Show pages
    - `cards`: Auto-fit card grid (1-4 columns responsive)
  - **Breakpoints:** Mobile (<768px), iPad (768-1024px), Desktop (1440px+)

### **4. Cross-Module Shared Components**

#### **Organization Components**
- **`AutocompleteOrganizationInput`** - Autocomplete org selector
- **`OrganizationAvatar`** - Organization logo display
- **`OrganizationInputs`** - Organization form inputs

#### **Task Components**
- **`AddTask`** - Quick-add task dialog
- **`TasksIterator`** - Display list of tasks

#### **Note Components**
- **`NoteCreate`** - Create note form
- **`NotesIterator`** - Display list of notes

#### **Tag Components**
- **`TagChip`** - Display tag with unlink action
- **`TagCreateModal`** - Create new tag modal
- **`getTagColorClass`** - Tag color utility

#### **Sales Components**
- **`SaleName`** - Display sales rep name

#### **Filter Components**
- **`FilterCategory`** - Collapsible filter section

#### **Misc/Utility Components**
- **`AsideSection`** - Sidebar section wrapper
- **`Status`** - Status indicator dot
- **`ContactOption`** - Contact option formatter

#### **Layout Components**
- **`TopToolbar`** - List page action toolbar
- **`FormToolbar`** - Form toolbar with Delete/Cancel/Save

### **5. React Admin Core Hooks**

#### **Data Hooks**
- `useListContext()` - Access list data, filters, selection
- `useRecordContext()` - Access current record
- `useGetIdentity()` - Get current user
- `useGetList()` - Fetch paginated list
- `useGetMany()` - Fetch multiple records
- `useCreate()` - Create mutation
- `useUpdate()` - Update mutation
- `useDataProvider()` - Access data provider
- `useNotify()` - Show notifications
- `useRefresh()` - Refresh data

#### **Form Hooks**
- `useFormContext()` - React Hook Form context
- `useShowContext()` - Show page context
- `useEditContext()` - Edit page context

#### **Component Wrappers**
- `RecordContextProvider` - Provide record to children
- `FilterLiveForm` - Live filter form wrapper
- `WithRecord` - Conditional rendering with record
- `RecordRepresentation` - Display record label

---

## Styling & CSS

### **Design System Principles**

**1. Semantic Colors Only** (Engineering Constitution Rule)
- ✅ **Correct:** `--primary`, `--brand-700`, `--destructive`, `--border-subtle`, `--bg-secondary`
- ❌ **Wrong:** Hardcoded hex values (#3B82F6), direct OKLCH values

**2. Tailwind v4 Utilities**
- Uses semantic CSS variables defined in `src/index.css`
- All colors mapped through design token system

**3. Spacing System** (Phase 1 complete)
- **Location:** `src/index.css` (lines 72-96) in `@theme` layer
- **Tokens:**
  - Grid: `--spacing-grid-columns-{desktop|ipad}`, `--spacing-gutter-{desktop|ipad}`
  - Edge Padding: `--spacing-edge-{desktop|ipad|mobile}`
  - Vertical Rhythm: `--spacing-section` (32px), `--spacing-widget` (24px), `--spacing-content` (16px)
  - Widget Internals: `--spacing-widget-padding` (20px)

**4. iPad-First Responsive Design**
- **Breakpoints:** Mobile (375-767px), iPad (768-1024px), Desktop (1440px+)
- **Touch Targets:** Minimum 44x44px (WCAG 2.1 AA)
- **Responsive Grid:** Auto-adjusts columns based on viewport

### **Key Styling Patterns Used**

#### **ContactListContent.tsx**
```css
/* Stretched link pattern for card clickability */
.relative /* Card container */
.stretched-link /* Overlay link */
.z-10 /* Edit button above stretched link */

/* Hover effects */
hover:border-border
hover:shadow-sm
hover:-translate-y-0.5
transition-all

/* Focus rings */
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

#### **ContactAside.tsx**
```css
/* Sidebar styling */
.hidden sm:block /* Hidden on mobile */
.w-64 /* Fixed width */
.space-y-4 /* Vertical spacing */

/* Section dividers */
border-t border-border-subtle
pt-4
```

#### **TabbedFormInputs**
```css
/* Tab error badges */
.bg-destructive
.text-destructive-foreground
.text-xs
.rounded-full
.px-2 py-0.5

/* Tab panels */
.p-6 /* 24px padding */
.rounded-lg
.bg-secondary/10
```

#### **ContactImportPreview.tsx**
```css
/* Alert variants */
.bg-success/10
.border-success
.text-success-foreground

.bg-warning/10
.border-warning
.text-warning-foreground

/* Collapsible sections */
.rounded-md
.border border-border
.bg-card
```

### **Icon Usage** (lucide-react)
- **Mail** - Email fields
- **Phone** - Phone fields
- **Linkedin** - LinkedIn URLs
- **Building2** - Organizations
- **Users** - Groups/teams
- **Tag** - Tags
- **Clock** - Activity dates
- **Plus** - Add actions
- **Edit** - Edit actions
- **Check** - Checkmarks/success
- **FileText** - Notes
- **Target** - Activities
- **Upload** - Import
- **Download** - Export

---

## Data & Queries

### **Database Schema**

#### **contacts Table**
```sql
CREATE TABLE contacts (
  -- Primary key
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,

  -- Name fields
  name TEXT NOT NULL,           -- Computed from first + last
  first_name TEXT,
  last_name TEXT,

  -- Contact information (JSONB arrays)
  email JSONB DEFAULT '[]'::jsonb,  -- [{ email, type }]
  phone JSONB DEFAULT '[]'::jsonb,  -- [{ number, type }]

  -- Professional information
  title TEXT,
  department TEXT,

  -- Address fields
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'USA',

  -- Additional fields
  birthday DATE,
  linkedin_url TEXT,
  twitter_handle TEXT,
  notes TEXT,
  gender TEXT,

  -- Relationships
  sales_id BIGINT,              -- FK to sales (account manager)
  organization_id BIGINT,       -- FK to organizations (primary org)

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by BIGINT,            -- FK to sales
  updated_by BIGINT,            -- FK to sales (via trigger)
  deleted_at TIMESTAMPTZ,       -- Soft delete

  -- Tracking
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now(),

  -- Arrays
  tags BIGINT[] DEFAULT '{}',   -- Array of tag IDs

  -- Search
  search_tsv TSVECTOR           -- Full-text search vector
);
```

#### **contacts_summary View**
```sql
CREATE VIEW contacts_summary AS
SELECT
  c.*,
  o.name AS company_name  -- Denormalized organization name
FROM contacts c
LEFT JOIN organizations o
  ON o.id = c.organization_id AND o.deleted_at IS NULL
WHERE c.deleted_at IS NULL;
```

**Purpose:** Performance optimization - denormalizes organization name to avoid joins in list queries.

#### **Indexes**
- `idx_contacts_deleted_at` - Soft delete filtering
- `idx_contacts_organization_id` - Organization joins
- `idx_contacts_sales_id` - Sales rep filtering
- `idx_contacts_search_tsv` (GIN) - Full-text search

#### **Foreign Keys**
- `contacts.sales_id` → `sales.id`
- `contacts.organization_id` → `organizations.id` (ON DELETE SET NULL)
- `contacts.created_by` → `sales.id` (ON DELETE SET NULL)

#### **Related Tables**
- `contactNotes` - Notes attached to contacts (CASCADE delete)
- `tasks` - Tasks assigned to contacts (CASCADE delete)
- `opportunity_contacts` - Junction table for opportunity relationships
- `activities` - Activity log entries

### **Data Provider Operations**

#### **getList** (ContactList.tsx)
```typescript
// Uses contacts_summary view
// Filter validation before API call
// Array filter transformation for JSONB fields
// Full-text search via applySearchParams()
// Soft delete filtering automatic (deleted_at IS NULL)
// JSONB normalization (ensures email/phone/tags are arrays)

const { data } = useListContext();
```

#### **getOne** (ContactShow.tsx)
```typescript
// Uses contacts_summary view
// Returns single contact with company_name
// JSONB array normalization applied

const { data: contact } = useRecordContext();
```

#### **create** (ContactCreate.tsx)
```typescript
// Validation via validateContactForm() (Zod schema)
// Transformation: avatar upload, name computation, timestamps
// Auto-fills: created_at, sales_id (from current user)
// Redirects to "show" after creation

const transform = (data) => ({
  ...data,
  first_seen: new Date().toISOString(),
  last_seen: new Date().toISOString(),
  tags: [],
  sales_id: identity.id
});
```

#### **update** (ContactEdit.tsx)
```typescript
// Validation via validateUpdateContact() (partial schema)
// Transformation: avatar upload, name computation
// Preserves existing relationships
// Redirects to "show" after update

// Only sends changed fields
```

### **Filter Configuration**

#### **Filterable Fields** (filterRegistry.ts)
```typescript
contacts: [
  "id", "first_name", "last_name", "email", "phone",
  "title", "department", "city", "state", "postal_code",
  "country", "birthday", "linkedin_url", "twitter_handle",
  "sales_id", "created_at", "updated_at", "deleted_at",
  "last_seen", "first_seen", "gender", "tags",
  "organization_id", "company_name", "q"
]
```

#### **Filter Operators**
- **Equality:** `{ sales_id: 123 }` → `sales_id = 123`
- **Range:** `{ "last_seen@gte": "2024-01-01" }` → `last_seen >= '2024-01-01'`
- **Array contains (JSONB):** `{ tags: [1,2,3] }` → `tags@cs = '{1,2,3}'`
- **IN operator:** `{ "status@in": "(active,pending)" }`
- **Full-text search:** `{ q: "John" }` → OR across searchable fields

#### **ContactListFilter.tsx - Active Filters**
1. **Search** (q) - Full-text search across first_name, last_name, company_name, title
2. **Last Activity** - Date range filters:
   - Today: `last_seen >= yesterday`
   - This week: `last_seen >= startOfWeek`
   - Before this week: `last_seen < startOfWeek`
   - Before this month: `last_seen < startOfMonth`
   - Before last month: `last_seen < lastMonth`
3. **Tags** - Multi-select tag filter (uses @cs operator)
4. **Account Manager** - Filter by sales_id

### **Full-Text Search**

#### **Searchable Fields** (resources.ts)
```typescript
contacts: ["first_name", "last_name", "company_name", "title"]
```

#### **Implementation**
```sql
-- Query: { q: "John" }
-- Transforms to:
WHERE (
  first_name ILIKE '%John%' OR
  last_name ILIKE '%John%' OR
  company_name ILIKE '%John%' OR
  title ILIKE '%John%'
) AND deleted_at IS NULL
```

### **CSV Import Logic**

#### **Import Process** (useContactImport.tsx)
```typescript
processBatch(batch: ContactImportSchema[], options: ImportOptions)
```

**Workflow:**
1. **Data quality transformations** - Auto-fill placeholders
2. **Validation** - Zod import schema
3. **Parallel fetch** (Promise.allSettled):
   - Organizations (create if missing)
   - Tags (create if missing)
4. **Transform to Contact format:**
   ```typescript
   {
     first_name, last_name,
     email: [{ email: email_work, type: "Work" }, ...],
     phone: [{ number: phone_work, type: "Work" }, ...],
     tags: [tagId1, tagId2],
     organization_id: orgId,
     sales_id: identity.id
   }
   ```
5. **Create contacts** - Partial failure handling

#### **Security Features**
- File validation: `validateCsvFile()` - Formula injection prevention
- Rate limiting: `contactImportLimiter`
- Secure Papa Parse config: Disables dynamic typing, limits preview
- CSV sanitization: ALL cell values sanitized

### **Row Level Security (RLS)**

```sql
-- Team-wide access (collaboration)
CREATE POLICY select_contacts ON contacts FOR SELECT
  TO authenticated USING (true);

CREATE POLICY insert_contacts ON contacts FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY update_contacts ON contacts FOR UPDATE
  TO authenticated USING (true);

-- Admin-only deletion
CREATE POLICY delete_contacts ON contacts FOR DELETE
  TO authenticated USING (public.is_admin());
```

**Security Pattern:** Shared resource with admin-only deletion.

### **Triggers**

#### **Full-Text Search Trigger**
```sql
CREATE TRIGGER trigger_update_contacts_search_tsv
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_search_tsv();
```
**Purpose:** Automatically maintains search_tsv on INSERT/UPDATE.

#### **Audit Trail Trigger**
```sql
CREATE TRIGGER set_updated_by_contacts
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_by();
```
**Purpose:** Automatically sets updated_by to current user's sales_id.

---

## Dependencies

### **Core Dependencies**

#### **React & Core Libraries**
- `react` ^19.0.0 - UI framework
- `react-dom` ^19.0.0 - DOM rendering
- `react-router-dom` ^6.x - Client-side routing
- `typescript` ^5.x - Type safety

#### **React Admin Framework**
- `react-admin` ^5.x - CRUD framework
- `ra-core` - React Admin core
- `ra-supabase-core` - Supabase integration
- `react-hook-form` ^7.x - Form state management (via react-admin)

#### **UI Libraries**
- `@radix-ui/*` (20+ packages) - Accessible primitives
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-checkbox`
  - `@radix-ui/react-tabs`
  - `@radix-ui/react-tooltip`
  - etc.
- `lucide-react` ^0.x - Icon library

#### **Validation & Data**
- `zod` ^3.x - Schema validation
- `papaparse` ^5.x - CSV parsing
- `jsonexport` - CSV export

#### **Date & Time**
- `date-fns` ^3.x - Date utilities

#### **Utilities**
- `clsx` - Class name merging
- `tailwind-merge` - Tailwind class merging

### **Development Dependencies**

#### **Testing**
- `vitest` ^2.x - Test runner
- `@testing-library/react` ^16.x - React component testing
- `@testing-library/user-event` ^14.x - User interaction testing
- `@playwright/test` ^1.x - E2E testing

#### **Build Tools**
- `vite` ^6.x - Build tool
- `@vitejs/plugin-react` - React plugin for Vite

#### **Code Quality**
- `eslint` ^9.x - Linting
- `prettier` - Code formatting
- `@typescript-eslint/*` - TypeScript linting

### **Internal Dependencies (Project Structure)**

#### **Validation Layer**
- `src/atomic-crm/validation/contacts.ts` - Zod schemas
- `src/atomic-crm/validation/index.ts` - Validation exports

#### **Data Provider Layer**
- `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` - Main data provider
- `src/atomic-crm/providers/supabase/filterRegistry.ts` - Filter definitions
- `src/atomic-crm/providers/supabase/services/ValidationService.ts` - Validation service
- `src/atomic-crm/providers/supabase/services/TransformService.ts` - Data transformations

#### **Shared Components**
- `@/components/admin/*` - React Admin component wrappers
- `@/components/ui/*` - shadcn/ui components
- `@/components/design-system/*` - Custom layout components

#### **Utilities**
- `src/atomic-crm/utils/formatName.ts` - Name formatting
- `src/atomic-crm/utils/csvUploadValidator.ts` - CSV security
- `src/atomic-crm/utils/avatar.utils.ts` - Avatar utilities
- `src/lib/utils.ts` - General utilities (cn function)

#### **Cross-Module Integration**
- Organizations module - `AutocompleteOrganizationInput`, `OrganizationAvatar`
- Tasks module - `AddTask`, `TasksIterator`
- Notes module - `NoteCreate`, `NotesIterator`
- Tags module - `TagChip`, `TagCreateModal`
- Sales module - `SaleName`

---

## Unused/Outdated Code

### **Analysis Summary**
✅ **No significant unused or outdated code found in the Contact module.**

### **Deprecated/Removed Items**

#### **1. contact_organizations Junction Table**
- **Status:** DEPRECATED and REMOVED
- **Migration:** `20251103220544_remove_deprecated_contact_organizations.sql`
- **Reason:** Table had 0 rows, simplified to one-to-many via `contacts.organization_id`
- **Old Pattern:** Many-to-many relationships via junction table
- **New Pattern:** One-to-many via `contacts.organization_id` (primary organization)
- **Impact:** `get_contact_organizations()` function may need updating

#### **2. Legacy TypeScript Interface Fields**
**Location:** `src/atomic-crm/types.ts` (Contact interface)

Fields in TypeScript interface but NOT in current validation schemas or UI forms:
- `has_newsletter` - No longer used
- `status` - No longer used
- `background` - No longer used
- `opportunity_owner_id` - No longer used

**Note:** These fields exist in the TypeScript interface for backward compatibility but are not validated or used in current forms.

#### **3. Commented-Out Components**
**ContactEmpty.tsx (Line 21):**
```tsx
{/* <ContactImportButton /> */}
```
**Reason:** Import button moved to ContactListActions (line 48 of ContactList.tsx)

### **Fields in Database but NOT in UI**

These fields exist in the database schema but have no corresponding form inputs:
- `address`, `city`, `state`, `postal_code`, `country` - No address input in forms
- `birthday` - No birthday picker
- `gender` - Config exists (`defaultContactGender`) but no form field
- `twitter_handle` - No Twitter input
- `updated_by` - Auto-populated by trigger (not user input)

**Status:** These fields are intentionally unused, not deprecated. May be added in future phases.

### **Code Quality Observations**

#### **Large Files (Potential Refactoring Candidates)**
1. **ContactImportDialog.tsx** - 790 lines, 29,989 bytes
   - Could be split into: FileSelection, Preview, Import, Result sub-components

2. **ContactImportPreview.tsx** - 843 lines, 34,178 bytes
   - Could be split into: Summary, Mappings, Validation, DataQuality sub-components

3. **columnAliases.ts** - 613 lines, 13,696 bytes
   - Acceptable size for data definitions (200+ header aliases)

#### **Duplicate Components (Minor)**
- `MultiOrganizationInput.tsx` (86 lines) vs. `ContactMultiOrg.tsx` (93 lines)
  - Both implement organization relationship input
  - Slight differences in validation approach
  - Could be consolidated into single component

#### **Test Coverage Overlap**
- `ContactList.test.tsx` (471 lines) - Unit tests
- `ContactList.spec.tsx` (17K) - Playwright E2E tests
- Some overlap in test scenarios but serve different purposes (unit vs. E2E)

---

## Technical Notes

### **1. JSONB Array Pattern** (Core Architecture)

Email and phone fields use **JSONB arrays** with type metadata:

```typescript
// Database storage
email: JSONB DEFAULT '[]'::jsonb

// Zod sub-schema
const emailAndTypeSchema = z.object({
  email: z.string().email(),
  type: z.enum(["Work", "Home", "Other"]).default("Work")
});

const contactSchema = z.object({
  email: z.array(emailAndTypeSchema).default([])
});

// Form component (NO defaultValue - comes from Zod)
<ArrayInput source="email">
  <SimpleFormIterator inline>
    <TextInput source="email" />
    <SelectInput source="type" choices={types} />
  </SimpleFormIterator>
</ArrayInput>
```

**Key Points:**
- Sub-schemas define structure
- `.default()` in Zod (not in forms)
- `zodSchema.partial().parse({})` for initial form values
- Stored as JSONB arrays in database

### **2. Tabbed Form System** (Phase 1 Complete)

All Create/Edit forms use `TabbedFormInputs` component:

**Benefits:**
- Automatic error count per tab (from React Hook Form state)
- Error badges display count only when > 0
- Semantic color variables (--border-subtle, --bg-secondary)
- Memoized error calculations for performance
- Full accessibility (aria-labels, keyboard nav)

**Tabs for Contacts:**
1. **Identity** - first_name, last_name (fields: ['first_name', 'last_name'])
2. **Position** - title, department, organization_id (fields: ['title', 'department', 'organization_id'])
3. **Contact Info** - email, phone, linkedin_url (fields: ['email', 'phone', 'linkedin_url'])
4. **Account** - sales_id, notes (fields: ['sales_id', 'notes'])

### **3. Two-Layer Security** (Critical)

PostgreSQL requires BOTH:
1. **GRANT** permissions (table access)
2. **RLS policies** (row filtering)

```sql
-- GRANT (table-level)
GRANT SELECT, INSERT, UPDATE, DELETE ON contacts TO authenticated;
GRANT USAGE ON SEQUENCE contacts_id_seq TO authenticated;

-- RLS policies (row-level)
CREATE POLICY select_contacts ON contacts FOR SELECT
  TO authenticated USING (true);

CREATE POLICY delete_contacts ON contacts FOR DELETE
  TO authenticated USING (public.is_admin());
```

**Common mistake:** RLS without GRANT = "permission denied" errors

### **4. Single Source of Truth** (Engineering Constitution)

**Validation happens at API boundary only:**
- ✅ Zod schema in `src/atomic-crm/validation/contacts.ts`
- ❌ NO validation in form components
- ❌ NO validation in database (except NOT NULL constraints)

**Form state from schema:**
```typescript
// ✅ CORRECT
const defaultValues = contactSchema.partial().parse({});

// ❌ WRONG
<TextInput source="email" defaultValue="work@example.com" />
```

### **5. CSV Import Security** (CRITICAL)

**Security layers:**
1. **File validation** - `validateCsvFile()` checks for:
   - Formula injection (`=cmd|'/c calc'!A0`)
   - Binary files (JPEG, ZIP magic bytes)
   - Control characters (`\x00`, `\x01`)
   - Oversized files (10MB limit)

2. **Secure Papa Parse config:**
   ```typescript
   getSecurePapaParseConfig() // Disables dynamic typing
   ```

3. **Cell sanitization:**
   ```typescript
   sanitizeCsvValue() // Escapes formulas, removes control chars
   ```

4. **Rate limiting:**
   ```typescript
   contactImportLimiter // Prevents abuse
   ```

**Reference:** `src/atomic-crm/utils/csvUploadValidator.ts`

### **6. Promise.allSettled Pattern** (Bulk Operations)

Use `Promise.allSettled()` instead of `Promise.all()` for graceful partial failure:

```typescript
// ✅ GOOD: Handles partial failures
const results = await Promise.allSettled(
  items.map(item => update("resource", { id: item.id, data: { status: "active" } }))
);

const successes = results.filter(r => r.status === "fulfilled").length;
const failures = results.filter(r => r.status === "rejected").length;

if (failures === 0) {
  notify(`${successes} items updated`, { type: "success" });
} else if (successes > 0) {
  notify(`${successes} succeeded, ${failures} failed`, { type: "warning" });
} else {
  notify("All updates failed", { type: "error" });
}
```

**Used in:**
- CSV import (organization/tag fetch, contact creation)
- Bulk operations
- Related record fetch

### **7. Stretched Link Pattern** (ContactListContent.tsx)

Entire card clickable while keeping buttons interactive:

```tsx
<div className="relative">
  {/* Stretched link (fills entire card) */}
  <Link to={`/contacts/${contact.id}/show`} className="stretched-link" />

  {/* Button above stretched link */}
  <EditButton className="z-10" />
</div>
```

**CSS:**
```css
.stretched-link::after {
  position: absolute;
  inset: 0;
  content: "";
  z-index: 0;
}

.z-10 {
  position: relative;
  z-index: 10;
}
```

### **8. Smart Email Auto-Fill** (ContactInfoTab.tsx)

On email paste/blur, extracts first.last to auto-populate name fields:

```typescript
const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  const emailValue = e.target.value;
  const emailParts = emailValue.split("@")[0].split(".");

  if (!firstName && emailParts[0]) {
    setValueManually("first_name", capitalize(emailParts[0]));
  }
  if (!lastName && emailParts[1]) {
    setValueManually("last_name", capitalize(emailParts[1]));
  }
};
```

### **9. Full-Text Search Implementation**

**Database trigger maintains search vector:**
```sql
CREATE TRIGGER trigger_update_contacts_search_tsv
  BEFORE INSERT OR UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_search_tsv();
```

**Function indexes:**
- name
- first_name
- last_name
- title
- department

**UI search:**
```typescript
// Query: { q: "John" }
// Transforms to ILIKE queries across searchable fields
```

### **10. Optimistic Caching** (CSV Import)

Organizations and tags cached during import to avoid redundant DB queries:

```typescript
const organizationsCache = new Map<string, Organization>();
const tagsCache = new Map<string, Tag>();

// Fetch once, cache for batch
const getOrganizationsWithCache = async (names: string[]) => {
  // Check cache first
  // Fetch missing from DB
  // Create missing records
  // Update cache
};
```

**Cache lifecycle:** Tied to dataProvider (resets on provider change)

### **11. Filter Cleanup Hook** (ContactList.tsx)

Prevents 400 errors from stale cached filters:

```typescript
useFilterCleanup("contacts");
```

**Purpose:** Validates localStorage filters against `filterRegistry.ts` on mount, removes invalid filters.

### **12. Avatar Fallback Strategy**

```typescript
// 1. Try image from record.avatar?.src
// 2. Fallback to initials (first letter of first_name + last_name)
// 3. Return null if no data

const fallback = `${first_name?.[0] || ""}${last_name?.[0] || ""}`.toUpperCase();
```

### **13. Data Quality Decisions** (CSV Import)

User choices for ambiguous data:

1. **Organizations without contacts**
   - **Issue:** CSV has org name but no first_name/last_name
   - **Options:** Create placeholder "General Contact" OR skip row

2. **Contacts without contact info**
   - **Issue:** Has name but no email/phone
   - **Options:** Import anyway OR skip row

### **14. Column Mapping Intelligence** (CSV Import)

Auto-detects 200+ header variations:

```typescript
// Examples of auto-mapped headers:
"First Name" → first_name
"firstName" → first_name
"first_name" → first_name
"Contact First Name" → first_name
"company" → organization_name
"organization" → organization_name
"Full Name" → split into first_name + last_name
"email" → email_work
```

**Normalization:**
- Lowercase, trim
- Remove special chars
- Collapse spaces

**O(1) lookup** via pre-computed `NORMALIZED_ALIAS_MAP`

### **15. Audit Trail** (Automatic)

All contact modifications tracked:

```sql
-- On INSERT
created_by = get_current_sales_id()

-- On UPDATE (trigger)
updated_by = get_current_sales_id()
```

**Function:**
```sql
CREATE FUNCTION get_current_sales_id()
RETURNS bigint
AS $$
  SELECT id FROM sales WHERE user_id = auth.uid() LIMIT 1;
$$;
```

---

## Integration Summary

### **Modules Using Contact Components**

1. **Dashboard** - HotContacts widget, QuickAdd button
2. **Opportunities** - Contact selection, primary contact display
3. **Organizations** - Contacts tab showing org's contacts
4. **Tasks** - Contact picker for task assignment
5. **Notes** - Contact reference field
6. **Activity Log** - Contact created/updated activities
7. **Sales** - Account manager assignment
8. **Tags** - Tag relationships

### **Contact Module Exports Used Elsewhere**

- `Avatar` - Used by 8+ components
- `ContactOption` - Used by 4+ modules (Opportunities, Tasks, Notes)
- `formatName` - Used throughout application
- Validation schemas - Enforced at API boundary

---

## Performance Metrics

- **Total Files:** 37 TypeScript/TSX files
- **Total Lines of Code:** ~7,113 lines
- **Largest File:** ContactImportPreview.tsx (843 lines, 34K)
- **Most Complex:** ContactImportDialog.tsx (790 lines, 30K)
- **Test Coverage:** 1,201 test lines across 7 test files
- **CSV Import System:** 3,540 lines across 11 files

---

## Quick Reference

### **Common Tasks**

#### **Creating a Contact**
```typescript
// Navigate to /contacts/create
// Required fields: first_name, last_name, sales_id, at least one email
// Auto-fills: created_at, first_seen, last_seen, tags: []
```

#### **Importing Contacts from CSV**
```typescript
// 1. Click "Import" button on Contact List
// 2. Select CSV file (validated for security)
// 3. Review auto-detected column mappings
// 4. Adjust mappings if needed
// 5. Make data quality decisions
// 6. Confirm import
// 7. View results with error report
```

#### **Filtering Contacts**
```typescript
// Available filters:
// - Search (full-text across name, title, company)
// - Last Activity (date ranges)
// - Tags (multi-select)
// - Account Manager (current user)
```

#### **Adding Tags to Contact**
```typescript
// 1. Open contact in Show or Edit view
// 2. Sidebar → Tags section
// 3. Click "Add tag" dropdown
// 4. Select existing tag OR "Create new tag"
// 5. Tag auto-saves to contact
```

---

## Version History

- **v0.1.0** (2024-10-18) - Initial schema and CRUD operations
- **v0.2.0** (2024-10-20) - Added contacts_summary view
- **v0.3.0** (2024-11-03) - Removed deprecated contact_organizations junction table
- **v0.4.0** (2024-11-08) - Tabbed form implementation (Phase 1 complete)
- **v0.5.0** (2024-11-10) - CSV import/export with security hardening
- **v0.6.0** (2024-11-11) - Role-based permissions (admin/manager/rep)

---

**Last Updated:** 2025-01-12
**Total Components Documented:** 80+ components
**Total Lines Analyzed:** ~7,113 lines of production code
**Test Coverage:** 7 test files with E2E and unit tests
