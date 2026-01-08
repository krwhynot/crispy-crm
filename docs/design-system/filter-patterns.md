# Filter Sidebar Patterns

Filter sidebars in Crispy CRM provide domain-specific, resource-appropriate filtering that balances consistency with usability. Each resource has its own curated set of filters defined in a `[Resource]FilterConfig.ts` file, with support for both common patterns (starred, owner) and resource-specific filters.

## Philosophy

**Intentional Design, Not Inconsistency**: Each resource's filters are chosen to address its specific domain needs, not because filters are arbitrary. For example:

- **Organizations** need Type, Priority, and State filters to segment prospects and customers
- **Contacts** need Name search, Status, and Tags for managing individuals
- **Opportunities** need Stage, Principal, Customer, and date range filters for pipeline management
- **Tasks** need Due Date and Status for execution focus
- **Activities** need Type, Sample Status, and Date range for logging context

**Consistency Where It Matters**: Common filters appear across all resources to provide a familiar interaction pattern:
- Starred (favorites) - available on Organizations, Contacts
- Owner/Account Manager (sales_id reference) - available on all resources

## Filter Types

All filters use the `ChipFilterConfig` schema with these type options:

| Type | Usage | Example |
|------|-------|---------|
| `multiselect` | Multiple value selection from enum/choices | Organization Type, Contact Status, Task Priority |
| `reference` | Reference to another resource | Owner (sales), Principal/Customer (organizations), Tags |
| `date-range` | Date picker for range filters (gte/lte pairs) | Activity date range, Close date range |
| `search` | Full-text search on text fields | Contact name search, Sales person search |
| `boolean` | Boolean toggle with custom labels | Task completion status |
| `select` | Single value selection | Opportunity campaign |

## Common Filters (All Resources)

### Starred (Favorites)

Implemented on Organizations and Contacts to highlight favorite items.

**Filter Key**: `id`
**Type**: `multiselect`
**Display**: Custom label shows "Starred items only"

```typescript
{
  key: "id",
  label: "Starred",
  type: "multiselect",
  formatLabel: () => "Starred items only",
}
```

### Owner / Account Manager

Implemented on all resources to filter by assigned owner or creator.

**Filter Keys**: `sales_id` (most resources), `created_by` (activities)
**Type**: `reference`
**Reference**: `"sales"`

```typescript
{
  key: "sales_id",
  label: "Owner",
  type: "reference",
  reference: "sales",
}
```

## Resource-Specific Filters

### Organizations

File: `/src/atomic-crm/organizations/organizationFilterConfig.ts`

Core filters for segmenting prospects, customers, and principals across the sales pipeline.

| Filter | Key | Type | Choices | Purpose |
|--------|-----|------|---------|---------|
| **Starred** | `id` | multiselect | - | Mark favorite accounts |
| **Type** | `organization_type` | multiselect | customer, prospect, principal, distributor | Classify organization role |
| **Priority** | `priority` | multiselect | A, B, C, D | Segment by strategic importance |
| **State** | `state` | multiselect | US state codes (IN, OH, etc.) | Geographic segmentation |
| **Playbook** | `segment_id` | reference | segments | Playbook category for activity templates |
| **Owner** | `sales_id` | reference | sales | Assigned account manager |

**Key Detail**: State filter uses 2-letter US state codes, not full state names.

```typescript
const ORGANIZATION_FILTER_CONFIG = validateFilterConfig([
  {
    key: "id",
    label: "Starred",
    type: "multiselect",
    formatLabel: () => "Starred items only",
  },
  {
    key: "organization_type",
    label: "Type",
    type: "multiselect",
    choices: [...ORGANIZATION_TYPE_CHOICES],
  },
  {
    key: "priority",
    label: "Priority",
    type: "multiselect",
    choices: [...PRIORITY_CHOICES],
  },
  {
    key: "state",
    label: "State",
    type: "multiselect",
    choices: [...US_STATES],
  },
  {
    key: "segment_id",
    label: "Playbook",
    type: "reference",
    reference: "segments",
  },
  {
    key: "sales_id",
    label: "Owner",
    type: "reference",
    reference: "sales",
  },
]);
```

### Contacts

File: `/src/atomic-crm/contacts/contactFilterConfig.ts`

Filters for managing individual relationships and activity tracking.

| Filter | Key | Type | Choices | Purpose |
|--------|-----|------|---------|---------|
| **Starred** | `id` | multiselect | - | Mark favorite contacts |
| **Name** | `first_name` | search | - | Full-text search by first name |
| **Status** | `status` | multiselect | cold, warm, hot, in-contract | Relationship temperature |
| **Tag** | `tags` | reference | tags | Multi-select tag filtering |
| **Activity After** | `last_seen@gte` | date-range | - | Date range start (grouped with @lte) |
| **Activity Before** | `last_seen@lte` | date-range | - | Date range end (grouped with @gte) |
| **Owner** | `sales_id` | reference | sales | Contact owner |

**Key Details**:
- Date filters use `@gte`/`@lte` syntax and share a `removalGroup: "last_seen_range"`
- When either date filter is removed, both are cleared together

```typescript
const CONTACT_FILTER_CONFIG = validateFilterConfig([
  {
    key: "id",
    label: "Starred",
    type: "multiselect",
    formatLabel: () => "Starred items only",
  },
  {
    key: "first_name",
    label: "Name",
    type: "search",
  },
  {
    key: "status",
    label: "Status",
    type: "multiselect",
    choices: [
      { id: "cold", name: "Cold" },
      { id: "warm", name: "Warm" },
      { id: "hot", name: "Hot" },
      { id: "in-contract", name: "Contract" },
    ],
  },
  {
    key: "tags",
    label: "Tag",
    type: "multiselect",
    reference: "tags",
  },
  {
    key: "last_seen@gte",
    label: "Activity after",
    type: "date-range",
    removalGroup: "last_seen_range",
  },
  {
    key: "last_seen@lte",
    label: "Activity before",
    type: "date-range",
    removalGroup: "last_seen_range",
  },
  {
    key: "sales_id",
    label: "Owner",
    type: "reference",
    reference: "sales",
  },
]);
```

### Opportunities

File: `/src/atomic-crm/opportunities/opportunityFilterConfig.ts`

Filters for pipeline stage management and deal tracking.

| Filter | Key | Type | Choices | Purpose |
|--------|-----|------|---------|---------|
| **Stage** | `stage` | multiselect | new_lead, initial_outreach, sample_visit_offered, feedback_logged, demo_scheduled, closed_won, closed_lost | Pipeline stage |
| **Principal** | `principal_organization_id` | reference | organizations | Manufacturer/vendor |
| **Customer** | `customer_organization_id` | reference | organizations | Distributor/end buyer |
| **Campaign** | `campaign` | select | - | Campaign name (dynamic choices) |
| **Owner** | `opportunity_owner_id` | reference | sales | Opportunity owner |
| **Priority** | `priority` | multiselect | A, B, C, D | Deal importance |
| **Close After** | `estimated_close_date_gte` | date-range | - | Estimated close date range start (grouped with _lte) |
| **Close Before** | `estimated_close_date_lte` | date-range | - | Estimated close date range end (grouped with _gte) |
| **Action After** | `next_action_date_gte` | date-range | - | Next action date range start (grouped with _lte) |
| **Action Before** | `next_action_date_lte` | date-range | - | Next action date range end (grouped with _gte) |
| **Updated After** | `updated_at_gte` | date-range | - | Recent wins filter |

**Key Details**:
- Opportunities use underscore date syntax (`_gte`, `_lte`), not the @ syntax used elsewhere
- Date range filters are paired with `removalGroup` for coordinated clearing
- `updated_at_gte` enables the "Recent Wins" preset filter

```typescript
const OPPORTUNITY_FILTER_CONFIG = validateFilterConfig([
  {
    key: "stage",
    label: "Stage",
    type: "multiselect",
    choices: [...stageChoices],
  },
  {
    key: "principal_organization_id",
    label: "Principal",
    type: "reference",
    reference: "organizations",
  },
  {
    key: "customer_organization_id",
    label: "Customer",
    type: "reference",
    reference: "organizations",
  },
  {
    key: "campaign",
    label: "Campaign",
    type: "select",
  },
  {
    key: "opportunity_owner_id",
    label: "Owner",
    type: "reference",
    reference: "sales",
  },
  {
    key: "priority",
    label: "Priority",
    type: "multiselect",
    choices: [...priorityChoices],
  },
  {
    key: "estimated_close_date_gte",
    label: "Close after",
    type: "date-range",
    removalGroup: "estimated_close_date_range",
  },
  {
    key: "estimated_close_date_lte",
    label: "Close before",
    type: "date-range",
    removalGroup: "estimated_close_date_range",
  },
  {
    key: "next_action_date_gte",
    label: "Action after",
    type: "date-range",
    removalGroup: "next_action_date_range",
  },
  {
    key: "next_action_date_lte",
    label: "Action before",
    type: "date-range",
    removalGroup: "next_action_date_range",
  },
  {
    key: "updated_at_gte",
    label: "Updated after",
    type: "date-range",
  },
]);
```

### Tasks

File: `/src/atomic-crm/tasks/taskFilterConfig.ts`

Filters for execution focus and task management.

| Filter | Key | Type | Choices | Purpose |
|--------|-----|------|---------|---------|
| **Due After** | `due_date@gte` | date-range | - | Due date range start (grouped with @lte) |
| **Due Before** | `due_date@lte` | date-range | - | Due date range end (grouped with @gte) |
| **Status** | `completed` | boolean | Incomplete, Completed | Task completion |
| **Priority** | `priority` | multiselect | low, medium, high, critical | Task importance |
| **Type** | `type` | multiselect | - | Task type (dynamic from ConfigurationContext) |
| **Assigned To** | `sales_id` | reference | sales | Task assignee |

**Key Details**:
- Status filter uses `completed` boolean with custom `formatLabel` function
- Task types are loaded dynamically from `ConfigurationContext` using a callback
- Due date filters use `@gte`/`@lte` syntax with `removalGroup: "due_date_range"`

```typescript
const PRIORITY_CHOICES = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "critical", name: "Critical" },
];

function getTaskTypeChoices(context: unknown): Array<{ id: string; name: string }> {
  if (context && typeof context === "object" && "taskTypes" in context) {
    const taskTypes = (context as { taskTypes: string[] }).taskTypes;
    return taskTypes.map((type) => ({ id: type, name: type }));
  }
  return [];
}

const TASK_FILTER_CONFIG = validateFilterConfig([
  {
    key: "due_date@gte",
    label: "Due after",
    type: "date-range",
    removalGroup: "due_date_range",
  },
  {
    key: "due_date@lte",
    label: "Due before",
    type: "date-range",
    removalGroup: "due_date_range",
  },
  {
    key: "completed",
    label: "Status",
    type: "boolean",
    formatLabel: (value: unknown) => (value === true ? "Completed" : "Incomplete"),
  },
  {
    key: "priority",
    label: "Priority",
    type: "multiselect",
    choices: PRIORITY_CHOICES,
  },
  {
    key: "type",
    label: "Type",
    type: "multiselect",
    choices: getTaskTypeChoices,
  },
  {
    key: "sales_id",
    label: "Assigned To",
    type: "reference",
    reference: "sales",
  },
]);
```

### Activities

File: `/src/atomic-crm/activities/activityFilterConfig.ts`

Filters for activity logging and interaction tracking.

| Filter | Key | Type | Choices | Purpose |
|--------|-----|------|---------|---------|
| **Type** | `type` | multiselect | call, email, meeting, other | Interaction type (from validation schema) |
| **Sample Status** | `sample_status` | multiselect | sent, received, feedback, other | Sample tracking status |
| **After** | `activity_date@gte` | date-range | - | Activity date range start (grouped with @lte) |
| **Before** | `activity_date@lte` | date-range | - | Activity date range end (grouped with @gte) |
| **Sentiment** | `sentiment` | multiselect | positive, neutral, negative | Activity sentiment/tone |
| **Created By** | `created_by` | reference | sales | Activity creator (NOT sales_id) |

**Key Details**:
- Choices are derived from validation schemas to prevent label drift:
  - `type` → `INTERACTION_TYPE_OPTIONS`
  - `sample_status` → `SAMPLE_STATUS_OPTIONS`
  - `sentiment` → `sentimentSchema.options`
- Uses `created_by` instead of `sales_id` to capture who logged the activity
- Date filters use `@gte`/`@lte` syntax with `removalGroup: "activity_date_range"`

```typescript
const INTERACTION_TYPE_CHOICES = INTERACTION_TYPE_OPTIONS.map((opt) => ({
  id: opt.value,
  name: opt.label,
}));

const SAMPLE_STATUS_CHOICES = SAMPLE_STATUS_OPTIONS.map((opt) => ({
  id: opt.value,
  name: opt.label,
}));

const SENTIMENT_CHOICES = sentimentSchema.options.map((value) => ({
  id: value,
  name: value.charAt(0).toUpperCase() + value.slice(1),
}));

const ACTIVITY_FILTER_CONFIG = validateFilterConfig([
  {
    key: "type",
    label: "Type",
    type: "multiselect",
    choices: INTERACTION_TYPE_CHOICES,
  },
  {
    key: "sample_status",
    label: "Sample Status",
    type: "multiselect",
    choices: SAMPLE_STATUS_CHOICES,
  },
  {
    key: "activity_date@gte",
    label: "After",
    type: "date-range",
    removalGroup: "activity_date_range",
  },
  {
    key: "activity_date@lte",
    label: "Before",
    type: "date-range",
    removalGroup: "activity_date_range",
  },
  {
    key: "sentiment",
    label: "Sentiment",
    type: "multiselect",
    choices: SENTIMENT_CHOICES,
  },
  {
    key: "created_by",
    label: "Created By",
    type: "reference",
    reference: "sales",
  },
]);
```

### Sales (Team Members)

File: `/src/atomic-crm/sales/salesFilterConfig.ts`

Filters for team member management.

| Filter | Key | Type | Choices | Purpose |
|--------|-----|------|---------|---------|
| **Search** | `q` | search | - | Full-text search on name/email |
| **Role** | `role` | multiselect | admin, manager, rep | User role |
| **Status** | `disabled` | boolean | Active, Disabled | Account status |

**Key Details**:
- `disabled` is a boolean filter with custom labels for filtering active vs. disabled users
- Follows industry standard (Google Workspace, Salesforce): defaults to Active only

```typescript
const ROLE_CHOICES = [
  { id: "admin", name: "Admin" },
  { id: "manager", name: "Manager" },
  { id: "rep", name: "Rep" },
];

const STATUS_CHOICES = [
  { id: "active", name: "Active" },
  { id: "disabled", name: "Disabled" },
];

const SALES_FILTER_CONFIG = validateFilterConfig([
  {
    key: "q",
    label: "Search",
    type: "search",
  },
  {
    key: "role",
    label: "Role",
    type: "multiselect",
    choices: ROLE_CHOICES,
  },
  {
    key: "disabled",
    label: "Status",
    type: "boolean",
    choices: STATUS_CHOICES,
  },
]);
```

## Filter Configuration Location & Structure

### File Organization

Each resource's filter configuration is located in its own module:

```
src/atomic-crm/
├── organizations/organizationFilterConfig.ts
├── contacts/contactFilterConfig.ts
├── opportunities/opportunityFilterConfig.ts
├── tasks/taskFilterConfig.ts
├── activities/activityFilterConfig.ts
├── sales/salesFilterConfig.ts
└── products/productFilterConfig.ts
```

### Validation Pattern

All filter configs must be validated at module initialization using `validateFilterConfig()`:

```typescript
import { validateFilterConfig } from "../filters/filterConfigSchema";

export const MY_FILTER_CONFIG = validateFilterConfig([
  { key: "status", label: "Status", type: "multiselect", choices: STATUS_CHOICES },
  { key: "date@gte", label: "After", type: "date-range" },
]);
```

This ensures:
- Type safety and schema validation at startup (fail-fast)
- Early detection of configuration errors
- Clear error messages for debugging

### Integration with React Admin

Filter configs are consumed by:

1. **FilterChipBar** - Displays active filters as chips and handles removal
2. **List Components** - Via `useListContext()` for filter state
3. **Column Filters** - Excel-style inline filters that sync with FilterChipBar

## Date Filter Syntax

Crispy CRM uses two date filter syntaxes depending on resource:

### @ Syntax (At-sign)

Used for: **Contacts**, **Tasks**, **Activities**

```typescript
"last_seen@gte"    // Contacts: Activity after
"due_date@gte"     // Tasks: Due after
"activity_date@gte" // Activities: Date after
```

**Benefits**: More memorable, easier to type, matches some APIs

### Underscore Syntax (Opportunities Only)

Used for: **Opportunities**

```typescript
"estimated_close_date_gte"  // Close after
"next_action_date_lte"      // Action before
"updated_at_gte"            // Recent activity
```

**Reason**: Opportunities define these in the data provider and maintain backward compatibility

### Removal Groups

Related date filters use `removalGroup` to ensure coordinated clearing:

```typescript
{
  key: "estimated_close_date_gte",
  label: "Close after",
  type: "date-range",
  removalGroup: "estimated_close_date_range",  // Removes both _gte and _lte
},
{
  key: "estimated_close_date_lte",
  label: "Close before",
  type: "date-range",
  removalGroup: "estimated_close_date_range",  // Removes both _gte and _lte
},
```

When a user removes either filter, both are cleared automatically.

## Column Header Filters

In addition to sidebar filters, datagrids support **column header filters** via `FilterableColumnHeader`:

### Text Filters

```tsx
<TextField
  source="name"
  label={
    <FilterableColumnHeader
      source="name"
      label="Name"
      filterType="text"
      debounceMs={300}
    />
  }
/>
```

### Checkbox Filters

```tsx
<TextField
  source="status"
  label={
    <FilterableColumnHeader
      source="status"
      label="Status"
      filterType="checkbox"
      choices={STATUS_CHOICES}
    />
  }
/>
```

### Automatic Sync

Column header filters automatically sync with:
- FilterChipBar (displays active filters)
- Sidebar filters (if present)
- React Admin's filter state

No additional integration code needed—both use `useListContext()`.

### Reference Field Gotcha

Avoid filters on ReferenceField columns since filtering by foreign keys requires special handling (autocomplete search). Use sidebar reference filters instead.

## Best Practices

### 1. Import from Existing Constants

When options exist in a constants file, import and spread them to prevent label drift:

```typescript
import { ORGANIZATION_TYPE_CHOICES, PRIORITY_CHOICES } from "./constants";

export const ORGANIZATION_FILTER_CONFIG = validateFilterConfig([
  {
    key: "organization_type",
    label: "Type",
    type: "multiselect",
    choices: [...ORGANIZATION_TYPE_CHOICES],  // Spread to convert readonly
  },
]);
```

### 2. Derive Choices from Validation Schemas

For constrained values, derive filter choices from Zod schemas to maintain single source of truth:

```typescript
import { INTERACTION_TYPE_OPTIONS } from "../validation/activities";

const INTERACTION_TYPE_CHOICES = INTERACTION_TYPE_OPTIONS.map((opt) => ({
  id: opt.value,
  name: opt.label,
}));
```

### 3. Use Callbacks for Dynamic Choices

For choices that depend on runtime context, use callback functions:

```typescript
function getTaskTypeChoices(context: unknown): Array<{ id: string; name: string }> {
  if (context && typeof context === "object" && "taskTypes" in context) {
    return (context as { taskTypes: string[] }).taskTypes.map((type) => ({
      id: type,
      name: type,
    }));
  }
  return [];
}

export const TASK_FILTER_CONFIG = validateFilterConfig([
  {
    key: "type",
    label: "Type",
    type: "multiselect",
    choices: getTaskTypeChoices,  // Callback, not array
  },
]);
```

### 4. Custom Label Formatters

Use `formatLabel` to transform filter values into user-friendly chip labels:

```typescript
{
  key: "id",
  label: "Starred",
  type: "multiselect",
  formatLabel: () => "Starred items only",  // Custom display
}
```

For boolean filters:

```typescript
{
  key: "completed",
  label: "Status",
  type: "boolean",
  formatLabel: (value: unknown) => (value === true ? "Completed" : "Incomplete"),
}
```

### 5. Group Related Filters

Use `removalGroup` to coordinate removal of paired filters:

```typescript
{
  key: "last_seen@gte",
  label: "Activity after",
  type: "date-range",
  removalGroup: "last_seen_range",  // Same group as @lte
},
{
  key: "last_seen@lte",
  label: "Activity before",
  type: "date-range",
  removalGroup: "last_seen_range",  // Same group as @gte
},
```

## Adding New Filters

### Step 1: Define Filter Config

Create or update `[Resource]FilterConfig.ts`:

```typescript
import { validateFilterConfig } from "../filters/filterConfigSchema";

export const NEW_RESOURCE_FILTER_CONFIG = validateFilterConfig([
  {
    key: "status",
    label: "Status",
    type: "multiselect",
    choices: [
      { id: "active", name: "Active" },
      { id: "inactive", name: "Inactive" },
    ],
  },
  {
    key: "owner_id",
    label: "Owner",
    type: "reference",
    reference: "sales",
  },
]);
```

### Step 2: Validate Configuration

Run diagnostics to catch schema errors:

```bash
npm run type-check
```

### Step 3: Update FilterChipBar

Update the list component's FilterChipBar to use the new config:

```tsx
import { NEW_RESOURCE_FILTER_CONFIG } from "./newResourceFilterConfig";

<FilterChipBar filterConfig={NEW_RESOURCE_FILTER_CONFIG} />
```

### Step 4: Sync with List Filters

Ensure the list filter component (sidebar) defines matching filters.

### Step 5: Optional - Add Column Filters

Add `FilterableColumnHeader` to datagrid columns:

```tsx
<TextField
  source="status"
  label={
    <FilterableColumnHeader
      source="status"
      label="Status"
      filterType="checkbox"
      choices={STATUS_CHOICES}
    />
  }
/>
```

## Summary Table

| Resource | Key Filters | File | Date Syntax |
|----------|------------|------|------------|
| **Organizations** | Type, Priority, State, Playbook, Owner | `organizationFilterConfig.ts` | - |
| **Contacts** | Name, Status, Tags, Activity Range, Owner | `contactFilterConfig.ts` | `@gte`/`@lte` |
| **Opportunities** | Stage, Principal, Customer, Priority, Close Range, Action Range | `opportunityFilterConfig.ts` | `_gte`/`_lte` |
| **Tasks** | Due Range, Status, Priority, Type, Assigned To | `taskFilterConfig.ts` | `@gte`/`@lte` |
| **Activities** | Type, Sample Status, Date Range, Sentiment, Created By | `activityFilterConfig.ts` | `@gte`/`@lte` |
| **Sales** | Search, Role, Status | `salesFilterConfig.ts` | - |
