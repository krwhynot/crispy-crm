# Database Schema Research: Opportunity Filtering

Comprehensive analysis of database schema and types relevant to implementing multi-select filters for opportunities table.

## Relevant Files
- `/home/krwhynot/Projects/atomic/src/types/database.generated.ts`: Generated TypeScript types from Supabase
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts`: Stage definitions and choice arrays
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityInputs.tsx`: Form inputs with choice definitions
- `/home/krwhynot/Projects/atomic/src/atomic-crm/validation/opportunities.ts`: Zod validation schemas

## Opportunities Table Schema

### Core Filterable Columns
| Column | Type | Default | Constraint | Description |
|--------|------|---------|------------|-------------|
| `stage` | `opportunity_stage` enum | `'new_lead'` | Required | Pipeline stage |
| `status` | `opportunity_status` enum | `'active'` | Required | Current status |
| `priority` | `priority_level` enum | `'medium'` | Required | Priority level |
| `category` | `text` | `null` | Optional | Business category |
| `customer_organization_id` | `bigint` | `null` | FK to organizations | Customer reference |
| `principal_organization_id` | `bigint` | `null` | FK to organizations | Principal reference |
| `distributor_organization_id` | `bigint` | `null` | FK to organizations | Distributor reference |
| `tags` | `text[]` | `'{}'::text[]` | Array | Tag categorization |
| `contact_ids` | `bigint[]` | `'{}'::bigint[]` | Array | Associated contacts |

### Additional Filter-Relevant Columns
| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `amount` | `numeric` | `null` | Deal value |
| `probability` | `integer` | `0` | Win probability (0-100) |
| `estimated_close_date` | `date` | `null` | Expected close date |
| `actual_close_date` | `date` | `null` | Actual close date |
| `sales_id` | `bigint` | `null` | Assigned salesperson |
| `created_by` | `bigint` | `null` | Creator reference |
| `deleted_at` | `timestamptz` | `null` | Soft delete timestamp |

## Enum Types and Constraints

### opportunity_stage Enum
Database values: `["new_lead", "initial_outreach", "sample_visit_offered", "awaiting_response", "feedback_logged", "demo_scheduled", "closed_won", "closed_lost"]`

### opportunity_status Enum
Database values: `["active", "on_hold", "nurturing", "stalled", "expired"]`

### priority_level Enum
Database values: `["low", "medium", "high", "critical"]`

### organization_type Enum (for related organizations)
Database values: `["customer", "principal", "distributor", "prospect", "vendor", "partner", "unknown"]`

## TypeScript Type Definitions

### Database Generated Types
```typescript
// From /src/types/database.generated.ts
interface OpportunityRow {
  stage: Database["public"]["Enums"]["opportunity_stage"] | null;
  status: Database["public"]["Enums"]["opportunity_status"] | null;
  priority: Database["public"]["Enums"]["priority_level"] | null;
  category: string | null;
  customer_organization_id: number | null;
  principal_organization_id: number | null;
  distributor_organization_id: number | null;
  tags: string[] | null;
  contact_ids: number[] | null;
  // ... other fields
}

// Enum definitions
type opportunity_stage = "new_lead" | "initial_outreach" | "sample_visit_offered" | "awaiting_response" | "feedback_logged" | "demo_scheduled" | "closed_won" | "closed_lost";
type opportunity_status = "active" | "on_hold" | "nurturing" | "stalled" | "expired";
type priority_level = "low" | "medium" | "high" | "critical";
type organization_type = "customer" | "principal" | "distributor" | "prospect" | "vendor" | "partner" | "unknown";
```

### Constants Array Export
```typescript
// From database.generated.ts - Constants object
export const Constants = {
  public: {
    Enums: {
      opportunity_stage: ["new_lead", "initial_outreach", "sample_visit_offered", "awaiting_response", "feedback_logged", "demo_scheduled", "closed_won", "closed_lost"],
      opportunity_status: ["active", "on_hold", "nurturing", "stalled", "expired"],
      priority_level: ["low", "medium", "high", "critical"],
      organization_type: ["customer", "principal", "distributor", "prospect", "vendor", "partner", "unknown"]
    }
  }
} as const;
```

## Choice Arrays and Constants

### Stage Choices (React Admin Format)
```typescript
// From /src/atomic-crm/opportunities/stageConstants.ts
export const OPPORTUNITY_STAGE_CHOICES = [
  { id: "new_lead", name: "New Lead" },
  { id: "initial_outreach", name: "Initial Outreach" },
  { id: "sample_visit_offered", name: "Sample/Visit Offered" },
  { id: "awaiting_response", name: "Awaiting Response" },
  { id: "feedback_logged", name: "Feedback Logged" },
  { id: "demo_scheduled", name: "Demo Scheduled" },
  { id: "closed_won", name: "Closed - Won" },
  { id: "closed_lost", name: "Closed - Lost" }
];
```

### Priority Choices (Inline Definition)
```typescript
// From /src/atomic-crm/opportunities/OpportunityInputs.tsx
const priorityChoices = [
  { id: "low", name: "Low" },
  { id: "medium", name: "Medium" },
  { id: "high", name: "High" },
  { id: "critical", name: "Critical" }
];
```

### Status Choices (Not Currently Defined)
Status choices are not currently exposed in the UI but follow the enum pattern:
```typescript
// Recommended implementation
const statusChoices = [
  { id: "active", name: "Active" },
  { id: "on_hold", name: "On Hold" },
  { id: "nurturing", name: "Nurturing" },
  { id: "stalled", name: "Stalled" },
  { id: "expired", name: "Expired" }
];
```

## Related Tables

### Organizations Table
Key columns for filtering:
- `organization_type`: enum constraint for type filtering
- `priority`: varchar with check constraint `['A', 'B', 'C', 'D']`
- `segment`: text field (default: 'Standard')
- `industry`: text field for industry filtering

### Tags Table
Structure for tag management:
- `id`: bigint primary key
- `name`: text unique constraint
- `color`: text (default: 'blue-500')
- `description`: text optional
- `usage_count`: integer (default: 0)

## Validation Schemas

### Zod Enum Schemas
```typescript
// From /src/atomic-crm/validation/opportunities.ts
export const opportunityStageSchema = z.enum([
  "new_lead", "initial_outreach", "sample_visit_offered",
  "awaiting_response", "feedback_logged", "demo_scheduled",
  "closed_won", "closed_lost"
]);

export const opportunityStatusSchema = z.enum([
  "active", "on_hold", "nurturing", "stalled", "expired"
]);

export const opportunityPrioritySchema = z.enum([
  "low", "medium", "high", "critical"
]);
```

## Architectural Patterns

### Choice Array Pattern
- **React Admin Format**: `{ id: string, name: string }[]`
- **Database Enum Values**: Used as `id` values
- **Display Labels**: Used as `name` values
- **Constants Export**: Available from `database.generated.ts`

### Multi-Value Fields
- **Tags**: `text[]` array for flexible categorization
- **Contact IDs**: `bigint[]` array for relationship tracking
- **Pattern**: Array fields use `'{}'` as default empty array

### Reference Relationships
- **Organizations**: Three separate FK fields (customer, principal, distributor)
- **Contacts**: Array field for many-to-many relationship
- **Sales**: Single FK for assignment tracking

## Edge Cases & Gotchas

### Array Field Handling
- Database arrays use PostgreSQL array syntax: `'{value1,value2}'`
- Empty arrays default to `'{}'::type[]`
- TypeScript types show as `string[] | null` or `number[] | null`

### Enum Synchronization
- Database enums must match TypeScript type definitions
- Stage constants have extended metadata (colors, descriptions) beyond enum values
- Validation schemas must stay in sync with database enum values

### Legacy Compatibility
- `OPPORTUNITY_STAGES_LEGACY` export maintains backward compatibility
- Helper functions exist for label/color lookups by value
- Migration from "deals" to "opportunities" completed - no backward compatibility needed

## Relevant Docs
- [React Admin SelectArrayInput](https://marmelab.com/react-admin/SelectArrayInput.html) - For multi-select implementation
- [Supabase Array Types](https://supabase.com/docs/guides/database/tables#arrays) - Array field handling
- [PostgreSQL Enum Types](https://www.postgresql.org/docs/current/datatype-enum.html) - Database enum constraints