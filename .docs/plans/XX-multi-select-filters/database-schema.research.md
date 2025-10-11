# Opportunities Multi-Select Filters - Database Schema Research

Research conducted on 2025-10-10 to understand the database schema and query patterns for implementing multi-select filters in the opportunities system.

## Overview

The opportunities table uses a mix of enum fields, array fields, and reference fields that require different PostgREST operator strategies for filtering. The system currently uses `@in` operators for enums and `@cs` (contains) operators for JSONB/text arrays. Multi-select filters are already implemented for `stage` and `priority` fields, providing a solid pattern to extend to other fields.

## Relevant Files

- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityList.tsx` - Current multi-select filter implementation for stage and priority
- `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/dataProviderUtils.ts` - PostgREST operator transformation logic
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts` - Zod schemas for opportunity validation
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/types.ts` - Filter type definitions and constants
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/FilterChipsPanel.tsx` - Active filter chip display with organization/sales name resolution

## Database Schema

### Opportunities Table Structure

```sql
-- Key fields for filtering
id                           bigint (PK)
name                         text NOT NULL
stage                        opportunity_stage (enum) DEFAULT 'new_lead'
status                       opportunity_status (enum) DEFAULT 'active'
priority                     priority_level (enum) DEFAULT 'medium'
tags                         text[] DEFAULT '{}'
customer_organization_id     bigint (FK → organizations.id)
principal_organization_id    bigint (FK → organizations.id)
distributor_organization_id  bigint (FK → organizations.id)
opportunity_owner_id         bigint (FK → sales.id)
account_manager_id           bigint (FK → sales.id)
contact_ids                  bigint[] DEFAULT '{}'
lead_source                  text (enum-like string)
deleted_at                   timestamptz (soft delete)
```

### Enum Definitions

```sql
-- opportunity_stage enum values
'new_lead', 'initial_outreach', 'sample_visit_offered', 'awaiting_response',
'feedback_logged', 'demo_scheduled', 'closed_won', 'closed_lost'

-- opportunity_status enum values
'active', 'on_hold', 'nurturing', 'stalled', 'expired'

-- priority_level enum values
'low', 'medium', 'high', 'critical'

-- lead_source values (text field, not enum)
'referral', 'trade_show', 'website', 'cold_call', 'email_campaign',
'social_media', 'partner', 'existing_customer'
```

### Indexes

```sql
-- Performance-optimized indexes for filtering
idx_opportunities_stage               btree(stage)
idx_opportunities_status              btree(status)
idx_opportunities_priority            btree(priority)
idx_opportunities_tags                gin(tags)              -- Array overlap queries
idx_opportunities_customer_org        btree(customer_organization_id)
idx_opportunities_principal_org       btree(principal_organization_id)
idx_opportunities_distributor_org     btree(distributor_organization_id)
idx_opportunities_owner_id            btree(opportunity_owner_id)
idx_opportunities_account_manager     btree(account_manager_id)
idx_opportunities_deleted_at          btree(deleted_at)      -- Soft delete filtering
idx_opportunities_search_tsv          gin(search_tsv)        -- Full-text search
```

### Related Tables

```sql
-- Organizations table (for reference filters)
organizations.id              bigint (PK)
organizations.name            text NOT NULL
organizations.organization_type    organization_type (enum)
organizations.is_principal    boolean
organizations.is_distributor  boolean
organizations.segment_id      uuid (FK → segments.id)
organizations.deleted_at      timestamptz

-- Tags table (standalone, not junction)
tags.id                       bigint (PK)
tags.name                     text NOT NULL
tags.color                    text
tags.description              text
tags.usage_count              integer
```

**Note**: The `tags` field in opportunities is a `text[]` array, NOT foreign keys to the tags table. Tags are stored as text values directly in the array.

## Query Patterns

### PostgREST Operator Transformation

The system uses `transformArrayFilters()` in `dataProviderUtils.ts` to convert React Admin filter arrays to PostgREST operators:

```typescript
// Enum fields (stage, priority, status) → @in operator
{ stage: ["new_lead", "qualified"] }
→ { "stage@in": "(new_lead,qualified)" }

// Array fields (tags) → @cs (contains) operator
{ tags: ["urgent", "follow-up"] }
→ { "tags@cs": "{urgent,follow-up}" }

// Reference fields (customer_organization_id) → @in operator
{ customer_organization_id: [1, 2, 3] }
→ { "customer_organization_id@in": "(1,2,3)" }
```

### Current Implementation Examples

```typescript
// From OpportunityList.tsx - Multi-select for enums
<MultiSelectInput
  source="priority"
  emptyText="Priority"
  choices={[
    { id: "low", name: "Low" },
    { id: "medium", name: "Medium" },
    { id: "high", name: "High" },
    { id: "critical", name: "Critical" },
  ]}
/>

<MultiSelectInput
  source="stage"
  emptyText="Stage"
  choices={OPPORTUNITY_STAGE_CHOICES}
  defaultValue={getInitialStageFilter()}
/>

// From OpportunityList.tsx - Reference array filter (already working!)
<ReferenceInput source="customer_organization_id" reference="organizations">
  <AutocompleteArrayInput label={false} placeholder="Customer Organization" />
</ReferenceInput>
```

### Field Classification for Filter Implementation

**Enum Fields** (use `@in` operator):
- `stage` - ✅ Already implemented with MultiSelectInput
- `priority` - ✅ Already implemented with MultiSelectInput
- `status` - ⚠️ Not yet implemented (5 choices)
- `lead_source` - ⚠️ Not yet implemented (8 choices, text field but enum-like)

**Array Fields** (use `@cs` operator):
- `tags` - ⚠️ Not yet implemented (text[] array)
- `contact_ids` - ⚠️ Not yet implemented (bigint[] array, but may not need filter)

**Reference Fields** (use `@in` operator):
- `customer_organization_id` - ✅ Already implemented with AutocompleteArrayInput
- `principal_organization_id` - ⚠️ Not yet implemented
- `distributor_organization_id` - ⚠️ Not yet implemented
- `opportunity_owner_id` - ✅ Implemented as OnlyMineInput (single-value toggle)
- `account_manager_id` - ⚠️ Not yet implemented

## Validation

### Zod Schema Definitions

From `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts`:

```typescript
// Enum schemas
export const opportunityStageSchema = z.enum([
  "new_lead", "initial_outreach", "sample_visit_offered",
  "awaiting_response", "feedback_logged", "demo_scheduled",
  "closed_won", "closed_lost",
]);

export const opportunityStatusSchema = z.enum([
  "active", "on_hold", "nurturing", "stalled", "expired",
]);

export const opportunityPrioritySchema = z.enum([
  "low", "medium", "high", "critical",
]);

export const leadSourceSchema = z.enum([
  "referral", "trade_show", "website", "cold_call",
  "email_campaign", "social_media", "partner", "existing_customer",
]);

// Main schema with defaults
export const opportunitySchema = z.object({
  stage: opportunityStageSchema.nullable().default("new_lead"),
  priority: opportunityPrioritySchema.nullable().default("medium"),
  status: opportunityStatusSchema.optional().nullable(),
  customer_organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  // ... other fields
});
```

**Note**: Validation schemas are defined at the API boundary only per Engineering Constitution #4. No client-side validation beyond required field checks.

## Architectural Patterns

### Multi-Select Filter Pattern

**Pattern**: Use `MultiSelectInput` component for enum fields with choices array
```typescript
<MultiSelectInput
  source="field_name"           // Database column name
  emptyText="Display Label"     // Shown when no selection
  choices={CHOICES_ARRAY}       // { id, name } format
  defaultValue={optional}       // Array of default selections
/>
```

**Transformation Flow**:
1. User selects multiple values in UI → `["value1", "value2"]`
2. React Admin stores as array in filterValues → `{ field_name: ["value1", "value2"] }`
3. `transformArrayFilters()` converts to PostgREST → `{ "field_name@in": "(value1,value2)" }`
4. Supabase executes: `WHERE field_name IN ('value1', 'value2')`

### Reference Array Filter Pattern

**Pattern**: Use `ReferenceInput` + `AutocompleteArrayInput` for foreign key multi-select
```typescript
<ReferenceInput source="customer_organization_id" reference="organizations">
  <AutocompleteArrayInput label={false} placeholder="Customer Organization" />
</ReferenceInput>
```

**Transformation Flow**:
1. User searches and selects organizations → `[1, 2, 3]` (IDs)
2. React Admin stores as array → `{ customer_organization_id: [1, 2, 3] }`
3. `transformArrayFilters()` converts → `{ "customer_organization_id@in": "(1,2,3)" }`
4. Supabase executes: `WHERE customer_organization_id IN (1, 2, 3)`

### Filter Chip Display Pattern

**Pattern**: FilterChipsPanel uses custom hooks to resolve reference names
```typescript
// From FilterChipsPanel.tsx
const organizationIds = filterValues?.customer_organization_id
  ? Array.isArray(filterValues.customer_organization_id)
    ? filterValues.customer_organization_id.map(String)
    : [String(filterValues.customer_organization_id)]
  : undefined;

const { getOrganizationName } = useOrganizationNames(organizationIds);

// Display chips with human-readable labels
const label = formatFilterLabel(chip.key, chip.value, getOrganizationName, getSalesName);
```

**Key Files**:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useOrganizationNames.ts` - Hook for fetching organization names
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/useSalesNames.ts` - Hook for fetching sales rep names
- `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/filterFormatters.ts` - Label formatting logic

### Array Field Handling Gotcha

**CRITICAL**: Text array fields (`tags`) require `@cs` operator, NOT `@in`

```typescript
// WRONG - This won't work for tags
{ tags: ["urgent"] } → { "tags@in": "(urgent)" }

// CORRECT - Text arrays need contains operator
{ tags: ["urgent"] } → { "tags@cs": "{urgent}" }
```

The `transformArrayFilters()` function handles this automatically based on field name:
```typescript
const jsonbArrayFields = ['tags', 'email', 'phone'];

if (jsonbArrayFields.includes(key)) {
  // Use @cs (contains) operator for JSONB/text arrays
  transformed[`${key}@cs`] = `{${value.map(escapeForPostgREST).join(',')}}`;
} else {
  // Use @in operator for regular fields
  transformed[`${key}@in`] = `(${value.map(escapeForPostgREST).join(',')})`;
}
```

**Action Required**: If implementing tags filter, ensure `tags` field is in the `jsonbArrayFields` array (currently it is).

## Edge Cases & Gotchas

1. **Tags Storage Mismatch**: The `tags` field is `text[]` NOT foreign keys. Tags table exists separately but opportunities.tags stores text values directly. No junction table exists.

2. **Contact IDs Array**: The `contact_ids` field is `bigint[]` but may not need filtering UI - typically filtered by individual contact pages showing their opportunities.

3. **Soft Delete Filter**: All queries must include `deleted_at@is: null` filter. The `List` component in OpportunityList.tsx already applies this in the base filter prop.

4. **View vs Table**: No summary views exist for opportunities (removed for MVP). All queries hit the base `opportunities` table directly. The `getDatabaseResource()` function has special handling:
   ```typescript
   // Note: opportunities_summary removed for MVP - query base table directly
   ```

5. **Escape Caching**: PostgREST value escaping is cached (max 1000 entries). Performance optimization for repeated filter values. Cache eviction strategy: clear half when limit reached.

6. **Operator Preservation**: If a filter key already contains `@` (existing PostgREST operator), it's preserved as-is:
   ```typescript
   if (key.includes('@')) {
     transformed[key] = value;
     continue;
   }
   ```

7. **Lead Source Not True Enum**: `lead_source` is a `text` field, not a database enum. Validation happens in Zod schema only. Can still use MultiSelectInput with choices array.

## Relevant Docs

**Internal Documentation**:
- Engineering Constitution: `/home/krwhynot/Projects/atomic/CLAUDE.md` - See sections on validation, forms, and data providers
- Filter Types: `/home/krwhynot/Projects/atomic/src/atomic-crm/filters/types.ts` - FilterConfig interface and type definitions
- Data Provider Tests: `/home/krwhynot/Projects/atomic/src/atomic-crm/providers/supabase/__tests__/dataProviderUtils.transform.test.ts` - Operator transformation test cases

**External Resources**:
- PostgREST Operators: https://postgrest.org/en/stable/api.html#operators
  - `@in` - IN operator for lists
  - `@cs` - Contains operator for arrays (overlap check)
  - `@is` - IS operator for null checks
- React Admin Filters: https://marmelab.com/react-admin/FilteringTutorial.html
- Supabase Query Patterns: https://supabase.com/docs/guides/database/postgres/array-columns

## Implementation Recommendations

### High Priority (Quick Wins)

1. **Status Filter** - Add MultiSelectInput for `status` field (5 enum choices already indexed)
2. **Tags Filter** - Add MultiSelectInput or AutocompleteArrayInput for `tags` text array (GIN indexed, already in jsonbArrayFields)
3. **Principal/Distributor Org Filters** - Clone customer_organization_id pattern for other org fields

### Medium Priority

4. **Lead Source Filter** - Add MultiSelectInput with leadSourceSchema choices (text field, 8 options)
5. **Account Manager Filter** - Add ReferenceInput to `sales` resource (similar to opportunity_owner_id)

### Considerations

- **Performance**: All filter fields have appropriate indexes (btree for enums, gin for arrays)
- **UI Space**: OpportunityList.tsx already has 5 filters in top bar. Consider sidebar filters or FilterButton dropdown for additional filters
- **Filter Persistence**: Stage filter uses localStorage for hidden stages. Other filters could adopt similar pattern for UX consistency
- **Mobile UX**: MultiSelectInput works well on mobile but consider collapsible filter groups for smaller screens

### Pattern Consistency

Follow existing implementation patterns:
- **Enum fields** → MultiSelectInput with static choices
- **Reference fields** → ReferenceInput + AutocompleteArrayInput
- **Text arrays** → AutocompleteArrayInput with optionText/optionValue (if needed)
- **Filter chips** → Extend useOrganizationNames pattern for new reference filters
