# Resource Matrix

> Generated: 2025-12-22
> Total Resources: 14
> Source: `/home/krwhynot/projects/crispy-crm/docs/_state/data-provider-discovery.json`

## Quick Reference Matrix

| Resource | Table | getList | getOne | create | update | delete | Schema File |
|----------|-------|---------|--------|--------|--------|--------|-------------|
| activities | activities | ✓ | ✓ | ✓ | ✓ | soft | validation/activities.ts |
| contacts | contacts | ✓ | ✓ | ✓ | ✓ | soft | validation/contacts.ts |
| opportunities | opportunities | ✓ | ✓ | ✓ | ✓ | soft-cascade-rpc | validation/opportunities.ts |
| organizations | organizations | ✓ | ✓ | ✓ | ✓ | soft | validation/organizations.ts |
| products | products | ✓ | ✓ | ✓ | ✓ | soft | validation/products.ts |
| product_distributors | product_distributors | ✓ | ✓ | ✓ | ✓ | hard | validation/productDistributors.ts |
| sales | sales | ✓ | ✓ | edge-function | edge-function | soft | validation/sales.ts |
| tags | tags | ✓ | ✓ | ✓ | ✓ | soft | validation/tags.ts |
| tasks | tasks | ✓ | ✓ | ✓ | ✓ | soft | validation/task.ts |
| contact_notes | contact_notes | ✓ | ✓ | ✓ | ✓ | soft | validation/notes.ts |
| opportunity_notes | opportunity_notes | ✓ | ✓ | ✓ | ✓ | soft | validation/notes.ts |
| organization_notes | organization_notes | ✓ | ✓ | ✓ | ✓ | soft | validation/notes.ts |
| segments | segments | ✓ | ✓ | get-or-create | ✓ | soft | validation/segments.ts |
| distributor_authorizations | distributor_authorizations | ✓ | ✓ | ✓ | ✓ | soft | validation/distributorAuthorizations.ts |

**Legend:**
- ✓ = Standard operation
- soft = Soft delete (sets deleted_at)
- soft-cascade-rpc = Soft delete via RPC with cascade
- edge-function = Routed through Edge Function
- get-or-create = Creates if not exists
- hard = Hard delete

---

## Resource Details

### activities

**Table:** `activities`
**Handler:** `handlers/activitiesHandler.ts`
**Schema:** `src/atomic-crm/validation/activities.ts`
**Callbacks:** `callbacks/activitiesCallbacks.ts`

**Operations:**
- getList: ✓
- getOne: ✓
- create: ✓
- update: ✓
- delete: soft (sets deleted_at)

**Computed Fields:**
- contact_name
- organization_name
- opportunity_name

**Special Handling:**
Standard CRUD operations with soft delete

---

### contacts

**Table:** `contacts`
**Handler:** `handlers/contactsHandler.ts`
**Schema:** `src/atomic-crm/validation/contacts.ts`
**Callbacks:** `callbacks/contactsCallbacks.ts`

**Operations:**
- getList: ✓ (with custom beforeGetList)
- getOne: ✓
- create: ✓
- update: ✓
- delete: soft (sets deleted_at)

**Computed Fields:**
- full_name
- organization_name
- primary_organization_name
- total_opportunities
- last_activity_date
- nb_notes
- nb_tasks
- nb_activities
- company_name

**Special Handling:**
- Custom search (q → ILIKE on name, first_name, last_name)
- JSONB array normalization
- Name computation (full_name derived from first_name + last_name)

---

### opportunities

**Table:** `opportunities`
**Handler:** `handlers/opportunitiesHandler.ts`
**Schema:** `src/atomic-crm/validation/opportunities.ts`
**Callbacks:** `callbacks/opportunitiesCallbacks.ts` (inline in provider)

**Operations:**
- getList: ✓
- getOne: ✓
- create: ✓ (with product sync via opportunity_products)
- update: ✓ (with product sync via opportunity_products)
- delete: soft-cascade-rpc (archive_opportunity_with_relations)

**Computed Fields:**
- principal_organization_name
- customer_organization_name
- distributor_organization_name
- days_in_stage
- days_since_last_activity
- pending_task_count
- overdue_task_count
- nb_interactions
- last_interaction_date
- next_task_id
- next_task_title
- next_task_due_date
- next_task_priority

**Virtual Fields:**
- products_to_sync
- products

**Special Handling:**
- Product sync via opportunity_products junction table
- RPC cascading soft delete (archive_opportunity_with_relations)
- Optimistic locking
- Custom search (q → ILIKE on name, description)
- Strips computed and virtual fields before write operations

---

### organizations

**Table:** `organizations`
**Handler:** `handlers/organizationsHandler.ts`
**Schema:** `src/atomic-crm/validation/organizations.ts`
**Callbacks:** `callbacks/organizationsCallbacks.ts`

**Operations:**
- getList: ✓ (with custom beforeGetList)
- getOne: ✓
- create: ✓
- update: ✓
- delete: soft (sets deleted_at)

**Computed Fields:**
- contact_count
- opportunity_count
- total_revenue
- last_activity_date
- primary_contact_name
- nb_contacts
- nb_opportunities
- nb_notes
- parent_organization_name
- child_branch_count
- total_contacts_across_branches
- total_opportunities_across_branches
- last_opportunity_activity

**Special Handling:**
- Custom search (q → ILIKE on name, city, state, sector)
- Logo storage handling via StorageService

---

### products

**Table:** `products`
**Handler:** `handlers/productsHandler.ts`
**Schema:** `src/atomic-crm/validation/products.ts`
**Callbacks:** `callbacks/productsCallbacks.ts`

**Operations:**
- getList: ✓
- getOne: ✓
- create: ✓
- update: ✓
- delete: soft (sets deleted_at)

**Computed Fields:**
- principal_name

**Special Handling:**
- Distributor junction table management (product_distributors)

---

### product_distributors

**Table:** `product_distributors`
**Handler:** Inline in `unifiedDataProvider.ts`
**Schema:** `src/atomic-crm/validation/productDistributors.ts`
**Callbacks:** None

**Operations:**
- getList: ✓
- getOne: ✓
- create: ✓
- update: ✓
- delete: hard (permanent deletion)

**Computed Fields:**
None

**Special Handling:**
- Composite key (product_id:distributor_id)
- Junction table for many-to-many products ↔ distributors

---

### sales

**Table:** `sales`
**Handler:** `handlers/salesHandler.ts`
**Schema:** `src/atomic-crm/validation/sales.ts`
**Callbacks:** `callbacks/salesCallbacks.ts`

**Operations:**
- getList: ✓
- getOne: ✓
- create: edge-function (RLS bypass)
- update: edge-function (RLS bypass)
- delete: soft (sets deleted_at)

**Computed Fields:**
- administrator

**Special Handling:**
- Edge Function for writes (bypasses RLS restrictions)
- User invitation and password management

---

### tags

**Table:** `tags`
**Handler:** `handlers/tagsHandler.ts`
**Schema:** `src/atomic-crm/validation/tags.ts`
**Callbacks:** `callbacks/tagsCallbacks.ts`

**Operations:**
- getList: ✓
- getOne: ✓
- create: ✓
- update: ✓
- delete: soft (sets deleted_at)

**Computed Fields:**
None

**Special Handling:**
Standard CRUD operations with soft delete

---

### tasks

**Table:** `tasks`
**Handler:** `handlers/tasksHandler.ts`
**Schema:** `src/atomic-crm/validation/task.ts`
**Callbacks:** `callbacks/tasksCallbacks.ts`

**Operations:**
- getList: ✓
- getOne: ✓
- create: ✓
- update: ✓
- delete: soft (sets deleted_at)

**Computed Fields:**
- contact_name
- opportunity_name
- organization_name
- assignee_name
- assignee_email
- creator_name
- customer_name
- principal_name

**Special Handling:**
- Completion timestamp auto-management (sets completed_at when status changes to completed)
- Snooze date normalization (strips time component from snooze_until)
- Creator-only RLS (users can only manage their own tasks)

---

### contact_notes

**Table:** `contact_notes`
**Handler:** `handlers/notesHandler.ts`
**Schema:** `src/atomic-crm/validation/notes.ts`
**Callbacks:** `callbacks/notesCallbacks.ts`

**Operations:**
- getList: ✓
- getOne: ✓
- create: ✓
- update: ✓
- delete: soft (sets deleted_at)

**Computed Fields:**
None

**Special Handling:**
- Attachment storage via StorageService
- DRY factory pattern (shared handler for all note types)

---

### opportunity_notes

**Table:** `opportunity_notes`
**Handler:** `handlers/notesHandler.ts`
**Schema:** `src/atomic-crm/validation/notes.ts`
**Callbacks:** `callbacks/notesCallbacks.ts`

**Operations:**
- getList: ✓
- getOne: ✓
- create: ✓
- update: ✓
- delete: soft (sets deleted_at)

**Computed Fields:**
None

**Special Handling:**
- Attachment storage via StorageService
- DRY factory pattern (shared handler for all note types)

---

### organization_notes

**Table:** `organization_notes`
**Handler:** `handlers/notesHandler.ts`
**Schema:** `src/atomic-crm/validation/notes.ts`
**Callbacks:** `callbacks/notesCallbacks.ts`

**Operations:**
- getList: ✓
- getOne: ✓
- create: ✓
- update: ✓
- delete: soft (sets deleted_at)

**Computed Fields:**
None

**Special Handling:**
- Attachment storage via StorageService
- DRY factory pattern (shared handler for all note types)

---

### segments

**Table:** `segments`
**Handler:** Inline in `unifiedDataProvider.ts`
**Schema:** `src/atomic-crm/validation/segments.ts`
**Callbacks:** None

**Operations:**
- getList: ✓
- getOne: ✓
- create: get-or-create (via RPC get_or_create_segment)
- update: ✓
- delete: soft (sets deleted_at)

**Computed Fields:**
None

**Special Handling:**
- Get-or-create pattern via RPC (prevents duplicate segments)
- Used for organizing operator segments and playbooks

---

### distributor_authorizations

**Table:** `distributor_authorizations`
**Handler:** Inline in `unifiedDataProvider.ts`
**Schema:** `src/atomic-crm/validation/distributorAuthorizations.ts`
**Callbacks:** None

**Operations:**
- getList: ✓
- getOne: ✓
- create: ✓
- update: ✓
- delete: soft (sets deleted_at)

**Computed Fields:**
None

**Special Handling:**
- Tracks which distributors are authorized to carry which principals' products
- Junction table for distributor ↔ principal relationships

---

## Handler Patterns

The codebase uses three distinct composition patterns for resource handlers:

### 1. Factory-based (createResourceCallbacks) - Most Common

**Used by:** activities, products, sales, tags
**Pattern:** `createResourceCallbacks(tableName, computedFields)`

```typescript
// Example: activitiesCallbacks.ts
export const activitiesCallbacks = createResourceCallbacks(
  'activities',
  ['contact_name', 'organization_name', 'opportunity_name']
);
```

**Characteristics:**
- Standard CRUD operations
- Computed field stripping before writes
- Minimal custom logic required
- Leverages factory for consistency

---

### 2. Factory-based with Custom beforeGetList

**Used by:** contacts, organizations
**Pattern:** Factory callbacks + custom search transforms

```typescript
// Example: contactsCallbacks.ts
export const contactsCallbacks = {
  ...createResourceCallbacks('contacts', [...computedFields]),
  beforeGetList: (params) => ({
    ...params,
    filter: transformQToIlikeSearch(params.filter, ['name', 'first_name', 'last_name'])
  })
};
```

**Characteristics:**
- Standard operations from factory
- Custom search transforms (q → ILIKE)
- Additional pre-processing for getList
- JSONB array normalization

---

### 3. Inline Callbacks (Complex RPC Logic)

**Used by:** opportunities
**Pattern:** Fully custom callback implementations

```typescript
// Example: opportunitiesCallbacks.ts (inline in provider)
const opportunitiesCallbacks = {
  beforeCreate: async (params) => { /* product sync logic */ },
  beforeUpdate: async (params) => { /* product sync + optimistic locking */ },
  beforeDelete: async (id) => { /* RPC cascade delete */ },
  afterGetOne: (data) => { /* strip computed/virtual fields */ }
};
```

**Characteristics:**
- Complex business logic (product sync, RPC calls)
- Optimistic locking
- Virtual field handling
- Custom cascade delete via RPC

---

## Composition Pattern

The data provider follows a layered composition pattern:

```
┌─────────────────────────────────────────┐
│  React Admin Components                 │
│  (Lists, Forms, Slide-overs)            │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  unifiedDataProvider.ts                 │
│  (Main entry point - 1625 lines)        │
│  - Core CRUD operations                 │
│  - 30 custom methods                    │
│  - Resource routing                     │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Wrappers (Decorator Pattern)           │
│  1. withErrorLogging (Sentry)           │
│  2. withValidation (Zod)                │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Resource Callbacks                      │
│  (beforeCreate, afterGetOne, etc.)      │
│  - Strip computed fields                │
│  - Transform searches                   │
│  - RPC orchestration                    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Services (Business Logic)               │
│  - StorageService                       │
│  - TransformService                     │
│  - ValidationService                    │
│  - OpportunitiesService                 │
│  - JunctionsService                     │
│  - SegmentsService                      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Supabase Client + Database             │
│  - PostgreSQL 17                        │
│  - Row-Level Security (RLS)             │
│  - Edge Functions (Deno)                │
└─────────────────────────────────────────┘
```

**Data Flow:**

1. **Request enters** via React Admin component
2. **Routed** through unifiedDataProvider to appropriate resource
3. **Validated** by withValidation wrapper (Zod at API boundary)
4. **Pre-processed** by resource callbacks (beforeCreate, beforeUpdate, beforeGetList)
5. **Executed** via Supabase client or service delegation
6. **Post-processed** by callbacks (afterGetOne strips computed fields)
7. **Logged** by withErrorLogging wrapper (Sentry integration)
8. **Response returned** to React Admin

**Alternative Composition (Feature Flag):**

The codebase includes `composedDataProvider.ts` (174 lines) as a gradual migration path:

```typescript
// composedDataProvider.ts
const baseProvider = createSupabaseDataProvider(supabase);
const withCallbacks = applyCallbacks(baseProvider, handlers);
const withWrappers = withValidation(withErrorLogging(withCallbacks));
```

**Flag:** `VITE_USE_COMPOSED_PROVIDER`
**Purpose:** Incremental refactoring from monolithic to modular architecture

---

## Custom Methods (30 total)

The provider exposes 30 custom methods beyond standard CRUD:

**Sales:**
- `salesCreate`
- `salesUpdate`
- `updatePassword`

**Opportunities:**
- `archiveOpportunity`
- `unarchiveOpportunity`
- `createWithProducts`
- `updateWithProducts`

**Activities:**
- `getActivityLog`

**Junctions:**
- `getContactOrganizations`
- `addContactToOrganization`
- `removeContactFromOrganization`
- `setPrimaryOrganization`
- `getOpportunityParticipants`
- `addOpportunityParticipant`
- `removeOpportunityParticipant`
- `getOpportunityContacts`
- `addOpportunityContact`
- `removeOpportunityContact`

**Segments:**
- `getOrCreateSegment`

Plus additional methods for file uploads, filtering, and analytics.

---

## Error Handling Philosophy

**Pre-Launch: Fail-Fast**

The provider implements intentional fail-fast behavior:

1. **No Retry Logic** - Errors throw immediately
2. **No Circuit Breakers** - Let Sentry capture failures
3. **No Graceful Fallbacks** - Surface issues during development

**Exception Cases:**

- **Idempotent Deletes:** Already-deleted records return success (not error)
- **Silent Update Detection:** Throws error if update doesn't persist (version mismatch)

**Structured Logging:**

All errors logged via `withErrorLogging` wrapper:
- Redacts sensitive data (passwords, tokens)
- Captures context (resource, operation, params)
- Sends to Sentry with structured tags

---

## Security Patterns

### Zod Validation at API Boundary

**Enforced by:** `withValidation` wrapper + ValidationService

**Patterns:**
- `z.strictObject()` - Prevents mass assignment attacks
- `z.coerce` - Safe type coercion for forms
- `string.max()` - DoS prevention (all strings length-limited)
- `z.enum()` - Allowlist patterns (never denylist)

**Exceptions:**
- `importContactSchema` - Uses `z.object()` for CSV import flexibility
- `specialPricingSchema` - Uses `.passthrough()` for JSONB pricing data

### Row-Level Security (RLS)

**Bypassed for:** Sales resource (writes via Edge Function)
**Enforced for:** All other resources
**Creator-only:** Tasks (users can only manage their own tasks)

### Soft Deletes

**Default:** All resources use soft delete (sets `deleted_at`)
**Exceptions:**
- `product_distributors` - Hard delete (junction table)
- `opportunities` - Cascade soft delete via RPC (archive_opportunity_with_relations)

---

## Schema File Details

All resources have corresponding Zod schemas in `src/atomic-crm/validation/`:

| Schema File | Resources | Key Schemas | Security Notes |
|-------------|-----------|-------------|----------------|
| activities.ts | activities | activityTypeSchema, activitiesSchema, quickLogFormSchema | strictObject throughout |
| contacts.ts | contacts | contactSchema, createContactSchema, contactOrganizationSchema | importContactSchema uses z.object (CSV flexibility) |
| opportunities.ts | opportunities | opportunitySchema, opportunityStageSchema (7 stages), closeOpportunitySchema | strictObject throughout |
| organizations.ts | organizations | organizationSchema (43 fields), organizationTypeSchema | strictObject throughout |
| products.ts | products | productSchema, productCategorySchema | strictObject throughout |
| productDistributors.ts | product_distributors | productDistributorSchema, productDistributorStatusSchema | strictObject throughout |
| sales.ts | sales | salesSchema, UserRoleEnum (3 roles), userInviteSchema | strictObject throughout |
| tags.ts | tags | tagSchema, semanticColorSchema | strictObject throughout |
| task.ts | tasks | taskSchema, taskTypeSchema (7 types), priorityLevelSchema (4 levels) | strictObject throughout |
| notes.ts | contact_notes, opportunity_notes, organization_notes | baseNoteSchema, contactNoteSchema, opportunityNoteSchema, organizationNoteSchema | strictObject throughout |
| segments.ts | segments | segmentSchema, playbookCategorySchema (9 values) | strictObject throughout |
| distributorAuthorizations.ts | distributor_authorizations | distributorAuthorizationSchema, specialPricingSchema | specialPricingSchema uses passthrough (JSONB) |

**Total Schema Files:** 18
**Total Schemas:** 100+ (including enums, base schemas, create/update variants)

---

## Migration Path: Monolithic → Composed

**Current State:** `unifiedDataProvider.ts` (1625 lines) - all resources + custom methods

**Future State:** `composedDataProvider.ts` (174 lines) - handler-based composition

**Migration Strategy:**
1. Extract resource logic to handlers (✅ Complete for 9 resources)
2. Extract callbacks to separate files (✅ Complete for 9 resources)
3. Test with feature flag `VITE_USE_COMPOSED_PROVIDER`
4. Migrate remaining inline resources (5 remaining)
5. Deprecate monolithic provider

**Remaining Inline Resources:**
- product_distributors
- segments
- distributor_authorizations
- (plus 2 others from custom methods)

---

## Related Documentation

- **Architecture Overview:** `docs/architecture/data-model.md`
- **Source Data:** `/home/krwhynot/projects/crispy-crm/docs/_state/data-provider-discovery.json`
- **Validation Schemas:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/`
- **Handlers:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/handlers/`
- **Callbacks:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/callbacks/`
- **Services:** `/home/krwhynot/projects/crispy-crm/src/atomic-crm/providers/supabase/services/`
- **Engineering Constitution:** `/home/krwhynot/projects/crispy-crm/CLAUDE.md`
