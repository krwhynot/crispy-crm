# Opportunities Module Architecture Research

Research completed for opportunity redesign planning. This document captures the current architecture, data flows, patterns, and integration points.

## Overview

The Opportunities module implements a **Kanban board interface** for managing sales pipeline opportunities across multiple stages. The architecture follows React Admin patterns with custom Kanban UI, centralized stage management, and tight integration with Organizations, Contacts, and Activities. The module uses a lazy-loaded component structure with form state derived from Zod schemas (Constitution #5), semantic color system, and index-based ordering for Kanban cards.

**Key Characteristics:**
- **34 total files** in opportunities module (components, types, utils, tests)
- **No drag-and-drop** currently implemented (uses @hello-pangea/dnd dependency but not active)
- **Manual index management** via OpportunitiesService for Kanban ordering
- **Stage-based filtering** with localStorage preferences (defaults: hide closed stages)
- **Multi-organization support** (customer, principal, distributor)
- **Centralized stage constants** in `stageConstants.ts` replacing hardcoded values

## Relevant Files

### Core Components
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/index.ts`: Lazy-loaded module exports (List, Create, Edit, Show)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityList.tsx`: List wrapper with filters, breadcrumbs, and archived list
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityListContent.tsx`: Kanban board layout - renders columns filtered by stage
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityColumn.tsx`: Kanban column with stage header, count, elevation-based shadows
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityCard.tsx`: Draggable card showing name, customer org, principal org, priority badge

### CRUD Operations
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityCreate.tsx`: Create form with index management (new opportunities get index 0)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityEdit.tsx`: Edit form with tabs (Details, Notes & Activity)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityShow.tsx`: Show view with archive/unarchive, tabs, organization details
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityInputs.tsx`: Shared form inputs (Info, Classification, Organizations, Contacts)

### Data & Types
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/types.ts:194-220`: Main Opportunity type definition
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/opportunities.ts`: Zod schemas (opportunitySchema, createOpportunitySchema, updateOpportunitySchema)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/stageConstants.ts`: Centralized stage definitions (OpportunityStage interface, OPPORTUNITY_STAGES array)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/stages.ts`: Stage grouping utility (getOpportunitiesByStage)

### Services & Business Logic
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/services/opportunities.service.ts`: OpportunitiesService (unarchive + reorder logic)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/useAutoGenerateName.ts`: Auto-generate opportunity name from customer + principal + date

### Filters
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/filters/useOpportunityFilters.tsx`: Centralized filter configuration (search, customer_org, priority, stage, only_mine)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/filters/opportunityStagePreferences.ts`: localStorage stage filter preferences (default: exclude closed stages)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/filters/FilterChipsPanel.tsx`: Active filter chips display

### Integration Points
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/ActivityNoteForm.tsx`: Create activity/interaction from opportunity (links to Activities module)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/activity-log/ActivityLogOpportunityCreated.tsx`: Activity log entry for opportunity creation
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/ContactList.tsx`: Display contacts linked to opportunity

## Architectural Patterns

### Stage Management Pattern

**Centralized Stage Constants** - Replaced hardcoded stage arrays across components:

```typescript
// /home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/stageConstants.ts

export interface OpportunityStage {
  value: string;
  label: string;
  color: string;           // Semantic CSS variable (e.g., "var(--info-subtle)")
  description: string;
  elevation: 1 | 2 | 3;   // Visual depth for UI emphasis
}

export const OPPORTUNITY_STAGES: OpportunityStage[] = [
  {
    value: "new_lead",
    label: "New Lead",
    color: "var(--info-subtle)",
    description: "Initial prospect identification",
    elevation: 3, // Prominent
  },
  // ... 8 total stages
];

// Helper functions for stage lookups
export function getOpportunityStageLabel(stageValue: string): string;
export function getOpportunityStageColor(stageValue: string): string;
export function isActiveStage(stageValue: string): boolean; // !closed_won && !closed_lost
```

**Usage in Components:**
```typescript
// OpportunityColumn.tsx:4-7
import {
  getOpportunityStageLabel,
  getOpportunityStageColor,
  getOpportunityStageElevation
} from "./stageConstants";

// Map elevation to shadow tokens
const elevation = getOpportunityStageElevation(stage);
const shadowConfig = {
  1: { rest: 'shadow-[var(--shadow-card-1)]', hover: 'hover:shadow-[var(--shadow-card-1-hover)]' },
  2: { rest: 'shadow-[var(--shadow-card-2)]', hover: 'hover:shadow-[var(--shadow-card-2-hover)]' },
  3: { rest: 'shadow-[var(--shadow-card-3)]', hover: 'hover:shadow-[var(--shadow-card-3-hover)]' }
}[elevation];
```

### Kanban Board Implementation

**No Drag-and-Drop (Current State):**
- Package installed: `@hello-pangea/dnd` (fork of react-beautiful-dnd)
- **Not currently wired up** to OpportunityColumn or OpportunityCard
- Manual index management only

**Column Structure:**
```typescript
// OpportunityListContent.tsx:11-56
export const OpportunityListContent = () => {
  const allOpportunityStages = OPPORTUNITY_STAGES_LEGACY;
  const { data: unorderedOpportunities, isPending, filterValues } = useListContext<Opportunity>();

  // Filter stages based on active filter (e.g., hide closed stages)
  const visibleStages = filterValues?.stage && Array.isArray(filterValues.stage) && filterValues.stage.length > 0
    ? allOpportunityStages.filter((stage) => filterValues.stage.includes(stage.value))
    : allOpportunityStages;

  const [opportunitiesByStage, setOpportunitiesByStage] = useState<OpportunitiesByStage>(
    getOpportunitiesByStage([], allOpportunityStages),
  );

  // Update opportunities by stage when data changes
  useEffect(() => {
    if (unorderedOpportunities) {
      const newOpportunitiesByStage = getOpportunitiesByStage(unorderedOpportunities, allOpportunityStages);
      if (!isEqual(newOpportunitiesByStage, opportunitiesByStage)) {
        setOpportunitiesByStage(newOpportunitiesByStage);
      }
    }
  }, [unorderedOpportunities]);

  return (
    <div className="flex gap-4 overflow-x-auto p-6 bg-muted rounded-3xl border">
      {visibleStages.map((stage) => (
        <OpportunityColumn
          stage={stage.value}
          opportunities={opportunitiesByStage[stage.value]}
          key={stage.value}
        />
      ))}
    </div>
  );
};
```

**Stage Grouping Utility:**
```typescript
// stages.ts:6-45
export const getOpportunitiesByStage = (
  unorderedOpportunities: Opportunity[],
  opportunityStages?: { value: string; label: string }[],
) => {
  const stages = opportunityStages || OPPORTUNITY_STAGES.map((stage) => ({
    value: stage.value,
    label: stage.label,
  }));

  // Group opportunities by stage
  const opportunitiesByStage: Record<Opportunity["stage"], Opportunity[]> =
    unorderedOpportunities.reduce(
      (acc, opportunity) => {
        if (acc[opportunity.stage]) {
          acc[opportunity.stage].push(opportunity);
        }
        return acc;
      },
      stages.reduce((obj, stage) => ({ ...obj, [stage.value]: [] }), {}),
    );

  // Sort each column by index (Kanban card ordering)
  stages.forEach((stage) => {
    if (opportunitiesByStage[stage.value]) {
      opportunitiesByStage[stage.value] = opportunitiesByStage[stage.value].sort(
        (recordA, recordB) => recordA.index - recordB.index,
      );
    }
  });

  return opportunitiesByStage;
};
```

### Index Management Pattern

**Manual Kanban Ordering** - Opportunities within a stage are ordered by `index` field:

```typescript
// OpportunityCreate.tsx:33-76 (onCreate index management)
const onSuccess = async (opportunity: Opportunity) => {
  // Manage kanban board indexes
  if (allOpportunities) {
    // Get opportunities in the same stage
    const opportunities = allOpportunities.filter(
      (o: Opportunity) => o.stage === opportunity.stage && o.id !== opportunity.id,
    );

    // Update indexes to make room for the new opportunity at index 0
    await Promise.all(
      opportunities.map(async (oldOpportunity) =>
        dataProvider.update("opportunities", {
          id: oldOpportunity.id,
          data: { index: oldOpportunity.index + 1 },
          previousData: oldOpportunity,
        }),
      ),
    );

    // Update React Query cache to reflect index changes
    const opportunitiesById = opportunities.reduce(
      (acc, o) => ({
        ...acc,
        [o.id]: { ...o, index: o.index + 1 },
      }),
      {} as { [key: string]: Opportunity },
    );

    queryClient.setQueriesData<GetListResult | undefined>(
      { queryKey: ["opportunities", "getList"] },
      (res) => {
        if (!res) return res;
        return {
          ...res,
          data: res.data.map((o: Opportunity) => opportunitiesById[o.id] || o),
        };
      },
      { updatedAt: Date.now() },
    );
  }
};
```

**Unarchive + Reorder:**
```typescript
// opportunities.service.ts:17-55
async unarchiveOpportunity(opportunity: Opportunity): Promise<any[]> {
  // Get all opportunities in same stage
  const { data: opportunities } = await this.dataProvider.getList<Opportunity>(
    "opportunities",
    {
      filter: { stage: opportunity.stage },
      pagination: { page: 1, perPage: 1000 },
      sort: { field: "index", order: "ASC" },
    },
  );

  // Set index for each opportunity, unarchived opportunity gets index 0
  const updatedOpportunities = opportunities.map((o, index) => ({
    ...o,
    index: o.id === opportunity.id ? 0 : index + 1,
    deleted_at: o.id === opportunity.id ? null : o.deleted_at,
  }));

  return await Promise.all(
    updatedOpportunities.map((updatedOpportunity) =>
      this.dataProvider.update("opportunities", {
        id: updatedOpportunity.id,
        data: updatedOpportunity,
        previousData: opportunities.find((o) => o.id === updatedOpportunity.id),
      }),
    ),
  );
}
```

### Form State Pattern (Constitution #5)

**Form defaults derived from Zod schema:**

```typescript
// OpportunityCreate.tsx:89-94
// Generate defaults from schema, then merge with identity-specific values
// Per Constitution #5: FORM STATE DERIVED FROM TRUTH
const formDefaults = {
  ...opportunitySchema.partial().parse({}), // Extracts .default() values
  opportunity_owner_id: identity?.id,
  account_manager_id: identity?.id,
  contact_ids: [], // Initialize as empty array for ReferenceArrayInput
};

// Form rendering
<Form defaultValues={formDefaults}>
  <OpportunityInputs mode="create" />
</Form>
```

**Zod Schema with Business Defaults:**
```typescript
// validation/opportunities.ts:39-79
const opportunityBaseSchema = z.object({
  // Fields with .default() provide business logic defaults
  stage: opportunityStageSchema.nullable().default("new_lead"),
  priority: opportunityPrioritySchema.nullable().default("medium"),

  // Required fields without defaults
  name: z.string().min(1, "Opportunity name is required"),
  estimated_close_date: z.string().min(1, "Expected closing date is required").optional(),

  // Organization relationships
  customer_organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  principal_organization_id: z.union([z.string(), z.number()]).optional().nullable(),
  distributor_organization_id: z.union([z.string(), z.number()]).optional().nullable(),

  // Contacts (validated differently for create vs update)
  contact_ids: z.array(z.union([z.string(), z.number()])),
});
```

### Auto-Generated Naming Pattern

**Opportunity name auto-generation from related organizations:**

```typescript
// useAutoGenerateName.ts:12-84
export const useAutoGenerateName = (mode: "create" | "edit") => {
  const { setValue } = useFormContext();

  // Watch form fields
  const customerOrgId = useWatch({ name: "customer_organization_id" });
  const principalOrgId = useWatch({ name: "principal_organization_id" });
  const currentName = useWatch({ name: "name" });

  // Fetch organization names
  const { data: customerOrg, isLoading: isLoadingCustomer } = useGetOne(
    "organizations",
    { id: customerOrgId },
    { enabled: !!customerOrgId }
  );

  const { data: principalOrg, isLoading: isLoadingPrincipal } = useGetOne(
    "organizations",
    { id: principalOrgId },
    { enabled: !!principalOrgId }
  );

  // Generate name: "Customer Name - Principal Name - MMM YYYY"
  const generateName = useCallback(() => {
    const parts = [
      customerOrg?.name,
      principalOrg?.name,
      new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
    ].filter(Boolean);
    return parts.join(" - ");
  }, [customerOrg?.name, principalOrg?.name]);

  // Auto-generate in create mode when fields change and name is empty
  useEffect(() => {
    if (mode === "create" && !currentName && !isLoading) {
      const newName = generateName();
      if (newName) {
        setValue("name", newName, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [mode, currentName, generateName, setValue, isLoading]);

  // Manual regenerate for edit mode
  const regenerate = useCallback(() => {
    if (!isLoading) {
      const newName = generateName();
      if (newName) {
        setValue("name", newName, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [generateName, setValue, isLoading]);

  return { regenerate, isLoading };
};
```

**Usage in form:**
```typescript
// OpportunityInputs.tsx:33-68
const OpportunityInfoInputs = ({ mode }: { mode: "create" | "edit" }) => {
  const { regenerate, isLoading } = useAutoGenerateName(mode);

  return (
    <TextInput
      source="name"
      label="Opportunity name *"
      InputProps={{
        endAdornment: mode === "edit" ? (
          <Button type="button" variant="ghost" size="sm" onClick={regenerate} disabled={isLoading}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        ) : null,
      }}
    />
  );
};
```

## Type Definitions

### Core Types

**Opportunity (Main Type):**
```typescript
// types.ts:194-220
export type Opportunity = {
  name: string;
  customer_organization_id: Identifier;        // Required - the buying organization
  principal_organization_id?: Identifier;      // Optional - product manufacturer
  distributor_organization_id?: Identifier;    // Optional - distribution partner
  contact_ids: Identifier[];                   // Array of contact IDs (min 1 required)
  stage: OpportunityStageValue;                // Current pipeline stage
  status: "active" | "on_hold" | "nurturing" | "stalled" | "expired";
  priority: "low" | "medium" | "high" | "critical";
  description: string;
  estimated_close_date: string;                // Required - expected close date
  actual_close_date?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;                         // Soft delete for archival
  opportunity_owner_id?: Identifier;           // Sales rep who owns opportunity
  account_manager_id?: Identifier;             // Account manager (FK to sales table)
  lead_source?: LeadSource;
  index: number;                               // Kanban card ordering within stage
  founding_interaction_id?: Identifier;        // Initial interaction that created opportunity
  stage_manual: boolean;                       // True if stage was manually set
  status_manual: boolean;                      // True if status was manually set
  next_action?: string;
  next_action_date?: string;
  competition?: string;
  decision_criteria?: string;
} & Pick<RaRecord, "id">;
```

**Stage Types:**
```typescript
// stageConstants.ts:6-22
export interface OpportunityStage {
  value: string;
  label: string;
  color: string;           // CSS variable (e.g., "var(--info-subtle)")
  description: string;
  elevation: 1 | 2 | 3;   // Visual depth
}

export type OpportunityStageValue =
  | "new_lead"
  | "initial_outreach"
  | "sample_visit_offered"
  | "awaiting_response"
  | "feedback_logged"
  | "demo_scheduled"
  | "closed_won"
  | "closed_lost";
```

**Validation Types:**
```typescript
// validation/opportunities.ts:87-89
export type OpportunityInput = z.input<typeof opportunitySchema>;
export type Opportunity = z.infer<typeof opportunitySchema>;
export type LeadSource = z.infer<typeof leadSourceSchema>;

// Lead source enum
export const leadSourceSchema = z.enum([
  "referral",
  "trade_show",
  "website",
  "cold_call",
  "email_campaign",
  "social_media",
  "partner",
  "existing_customer",
]);
```

**Related Types:**
```typescript
// types.ts:224-234
export type OpportunityNote = {
  opportunity_id: Identifier;
  text: string;
  created_at: string;
  updated_at: string;
  opportunity_owner_id: Identifier;
  attachments?: AttachmentNote[];
  status?: undefined; // For compatibility with ContactNote
} & Pick<RaRecord, "id">;
```

## Integration Points

### Organizations (Multi-Stakeholder Model)

**Three organization relationships:**

```typescript
// OpportunityInputs.tsx:107-162
const OpportunityOrganizationInputs = () => {
  return (
    <div className="grid gap-2 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
      {/* Customer Organization - REQUIRED */}
      <ReferenceInput
        source="customer_organization_id"
        reference="organizations"
        filter={{ organization_type: "customer" }}
      >
        <AutocompleteOrganizationInput
          label="Customer Organization *"
          organizationType="customer"
        />
      </ReferenceInput>

      {/* Account Manager */}
      <ReferenceInput source="account_manager_id" reference="sales">
        <SelectInput
          optionText={(choice) =>
            choice?.first_name || choice?.last_name
              ? `${choice.first_name || ""} ${choice.last_name || ""} (${choice.email})`.trim()
              : choice?.email || ""
          }
          label="Account Manager"
        />
      </ReferenceInput>

      {/* Principal Organization - Optional */}
      <ReferenceInput
        source="principal_organization_id"
        reference="organizations"
        filter={{ organization_type: "principal" }}
      >
        <AutocompleteOrganizationInput
          label="Principal Organization"
          organizationType="principal"
        />
      </ReferenceInput>

      {/* Distributor Organization - Optional */}
      <ReferenceInput
        source="distributor_organization_id"
        reference="organizations"
        filter={{ organization_type: "distributor" }}
      >
        <AutocompleteOrganizationInput
          label="Distributor Organization"
          organizationType="distributor"
        />
      </ReferenceInput>
    </div>
  );
};
```

**Display in card:**
```typescript
// OpportunityCard.tsx:82-108
{/* Line 2: Customer Name */}
<ReferenceField
  source="customer_organization_id"
  record={opportunity}
  reference="organizations"
  link={false}
>
  <TextField source="name" className="text-xs text-[color:var(--text-subtle)]" />
</ReferenceField>

{/* Line 3: Product/Principal Name */}
{opportunity.principal_organization_id && (
  <ReferenceField
    source="principal_organization_id"
    record={opportunity}
    reference="organizations"
    link={false}
  >
    <TextField source="name" className="text-xs text-[color:var(--text-subtle)]" />
  </ReferenceField>
)}
```

### Contacts (Array Field)

**Contact selection with organization filtering:**

```typescript
// OpportunityInputs.tsx:165-194
const OpportunityContactsInput = () => {
  const customerOrganizationId = useWatch({ name: "customer_organization_id" });

  // Memoize filter to prevent ReferenceArrayInput from clearing values
  // See Engineering Constitution #1: NO OVER-ENGINEERING
  const contactFilter = useMemo(
    () => (customerOrganizationId ? { organization_id: customerOrganizationId } : {}),
    [customerOrganizationId]
  );

  return (
    <ReferenceArrayInput
      source="contact_ids"
      reference="contacts_summary"
      filter={contactFilter}
    >
      <AutocompleteArrayInput
        label={false}
        optionText={contactOptionText}
        helperText={false}
      />
    </ReferenceArrayInput>
  );
};
```

**Validation requirements:**
```typescript
// validation/opportunities.ts:113-159
// Create: Require at least one contact
export const createOpportunitySchema = opportunityBaseSchema
  .omit({ id: true, created_at: true, updated_at: true, deleted_at: true })
  .extend({
    contact_ids: z.array(z.union([z.string(), z.number()])).min(1, "At least one contact is required"),
  })
  .required({ name: true, estimated_close_date: true });

// Update: Allow partial updates, but if contact_ids is provided, must not be empty
export const updateOpportunitySchema = opportunityBaseSchema
  .partial()
  .required({ id: true })
  .refine(
    (data) => {
      if (data.contact_ids === undefined) return true; // Partial update OK
      return Array.isArray(data.contact_ids) && data.contact_ids.length > 0;
    },
    { message: "At least one contact is required", path: ["contact_ids"] }
  );
```

### Activities/Interactions

**Activity creation from opportunity:**

```typescript
// ActivityNoteForm.tsx:76-280
export const ActivityNoteForm = ({ opportunity, onSuccess }: ActivityNoteFormProps) => {
  const dataProvider = useDataProvider();
  const { opportunityStages } = useConfigurationContext();

  const onSubmit = async (data: ActivityNoteFormData) => {
    try {
      await dataProvider.create("activities", {
        data: {
          activity_type: "interaction",
          type: data.type,                          // email, call, meeting, etc.
          subject: data.subject,
          activity_date: data.activity_date.toISOString(),
          contact_id: data.contact_id,             // Optional - which contact was involved
          opportunity_id: opportunity.id,          // Link to opportunity
          organization_id: opportunity.customer_organization_id,
        },
      });
      notify("Activity created successfully", { type: "success" });
      reset();
      onSuccess?.();
    } catch (error) {
      notify("Error creating activity", { type: "error" });
    }
  };

  // Stage update handler (updates opportunity stage when logging activity)
  const handleStageChange = async (newStage: string) => {
    try {
      await dataProvider.update("opportunities", {
        id: opportunity.id,
        data: { stage: newStage },
        previousData: opportunity,
      });
      setValue("stage", newStage);
      notify("Stage updated successfully", { type: "success" });
    } catch (error) {
      notify("Error updating stage", { type: "error" });
    }
  };

  // Form fields: Date, Type, Contact, Stage, Subject
  // Stage select triggers immediate update to opportunity.stage
};
```

**Activity log display:**
```typescript
// ActivityLogOpportunityCreated.tsx:12-44
export function ActivityLogOpportunityCreated({ activity }: ActivityLogOpportunityCreatedProps) {
  const context = useActivityLogContext();
  const { opportunity } = activity;

  return (
    <div className="p-0">
      <div className="flex flex-row space-x-1 items-center w-full">
        <div className="w-5 h-5 bg-loading-pulse rounded-full" />
        <div className="text-sm text-[color:var(--text-subtle)] flex-grow">
          <span>Sales ID: {activity.sales_id}</span> added opportunity{" "}
          <Link to={`/opportunities/${opportunity.id}/show`}>{opportunity.name}</Link>{" "}
          {context !== "company" && (
            <>to organization {activity.customer_organization_id} <RelativeDate date={activity.date} /></>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Notes (OpportunityNote)

**Note creation in Edit/Show views:**

```typescript
// OpportunityEdit.tsx:66-78 (Notes tab)
<TabsContent value="notes">
  <div className="m-4">
    <Separator className="mb-4" />
    <ActivityNoteForm opportunity={record} />
    <Separator className="my-6" />
    <ReferenceManyField
      target="opportunity_id"
      reference="opportunityNotes"
      sort={{ field: "created_at", order: "DESC" }}
      empty={null}
    >
      <NotesIterator reference="opportunities" />
    </ReferenceManyField>
  </div>
</TabsContent>
```

## Data Flow

### Supabase → Data Provider → React Components

**Data flow diagram (ASCII):**
```
┌──────────────────────────────────────────────────────────────┐
│ PostgreSQL Database (Supabase)                               │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ opportunities table (see schema below)                   │ │
│ │ - contact_ids: bigint[] (stored as PostgreSQL array)    │ │
│ │ - stage: opportunity_stage enum                          │ │
│ │ - index: integer (Kanban ordering)                       │ │
│ │ - deleted_at: timestamptz (soft delete)                  │ │
│ └──────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ Data Provider Layer                                          │
│ /src/atomic-crm/providers/supabase/unifiedDataProvider.ts   │
│                                                               │
│ - Validation (Zod schemas at API boundary)                   │
│ - Transformation (JSONB normalization, array filters)        │
│ - Error logging                                              │
│ - Service orchestration (OpportunitiesService)              │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ React Query Cache                                            │
│ - queryKey: ["opportunities", "getList"]                     │
│ - Cache invalidation on mutations                            │
│ - Optimistic updates for index changes                       │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ React Admin Hooks                                            │
│ - useListContext<Opportunity>() (OpportunityListContent)     │
│ - useGetList<Opportunity>() (OpportunityCreate)              │
│ - useUpdate() (OpportunityShow archive/unarchive)            │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────┐
│ UI Components                                                │
│                                                               │
│ OpportunityList                                              │
│   └─ OpportunityListContent (Kanban board)                   │
│       └─ OpportunityColumn (per stage)                       │
│           └─ OpportunityCard[] (sorted by index)             │
│                                                               │
│ Filter: useOpportunityFilters()                              │
│   └─ FilterChipsPanel (active filters display)              │
│   └─ opportunityStagePreferences (localStorage)              │
└──────────────────────────────────────────────────────────────┘
```

**Database Schema:**
```sql
-- From migration 20251018152315_cloud_schema_fresh.sql:1474
CREATE TABLE IF NOT EXISTS "public"."opportunities" (
    "id" bigint NOT NULL,
    "name" text NOT NULL,
    "description" text,
    "stage" opportunity_stage DEFAULT 'new_lead'::opportunity_stage,
    "status" opportunity_status DEFAULT 'active'::opportunity_status,
    "priority" priority_level DEFAULT 'medium'::priority_level,
    "index" integer,
    "estimated_close_date" date DEFAULT (CURRENT_DATE + '90 days'::interval),
    "actual_close_date" date,
    "customer_organization_id" bigint,
    "principal_organization_id" bigint,
    "distributor_organization_id" bigint,
    "founding_interaction_id" bigint,
    "stage_manual" boolean DEFAULT false,
    "status_manual" boolean DEFAULT false,
    "next_action" text,
    "next_action_date" date,
    "competition" text,
    "decision_criteria" text,
    "contact_ids" bigint[] DEFAULT '{}'::bigint[],  -- PostgreSQL array
    "opportunity_owner_id" bigint,
    "created_at" timestamp with time zone DEFAULT now(),
    "updated_at" timestamp with time zone DEFAULT now(),
    "created_by" bigint,
    "deleted_at" timestamp with time zone,
    "search_tsv" tsvector,
    "tags" text[] DEFAULT '{}'::text[],
    "account_manager_id" bigint,
    "lead_source" text,
    CONSTRAINT "opportunities_lead_source_check" CHECK (("lead_source" = ANY (
      ARRAY['referral', 'trade_show', 'website', 'cold_call', 'email_campaign',
            'social_media', 'partner', 'existing_customer']
    )))
);
```

### React Query Cache Management

**Cache updates on create:**
```typescript
// OpportunityCreate.tsx:62-75
queryClient.setQueriesData<GetListResult | undefined>(
  { queryKey: ["opportunities", "getList"] },
  (res) => {
    if (!res) return res;
    return {
      ...res,
      data: res.data.map(
        (o: Opportunity) => opportunitiesById[o.id] || o,  // Apply index updates
      ),
    };
  },
  { updatedAt: Date.now() },
);
```

**Cache invalidation on edit:**
```typescript
// OpportunityEdit.tsx:26-31
mutationOptions={{
  onSuccess: () => {
    // Invalidate entire opportunities cache to refetch
    queryClient.invalidateQueries({ queryKey: ["opportunities"] });
  },
}}
```

## Current Filtering

### Filter Configuration

**Centralized filter inputs:**
```typescript
// useOpportunityFilters.tsx:21-45
export const useOpportunityFilters = () => {
  return [
    <SearchInput source="q" alwaysOn />,  // Full-text search

    <ReferenceInput source="customer_organization_id" reference="organizations">
      <AutocompleteArrayInput label={false} placeholder="Customer Organization" />
    </ReferenceInput>,

    <MultiSelectInput
      source="priority"
      emptyText="Priority"
      choices={[
        { id: "low", name: "Low" },
        { id: "medium", name: "Medium" },
        { id: "high", name: "High" },
        { id: "critical", name: "Critical" },
      ]}
    />,

    <MultiSelectInput
      source="stage"
      emptyText="Stage"
      choices={OPPORTUNITY_STAGE_CHOICES}
      defaultValue={getInitialStageFilter()}  // localStorage preferences
    />,

    <OnlyMineInput source="opportunity_owner_id" alwaysOn />,
  ];
};
```

### Stage Preferences (localStorage)

**Default behavior: Hide closed stages**
```typescript
// opportunityStagePreferences.ts:7-88
const STORAGE_KEY = 'filter.opportunity_stages';

// Default visible stages - excludes closed stages by default
const DEFAULT_VISIBLE_STAGES = OPPORTUNITY_STAGE_CHOICES
  .filter(c => !['closed_won', 'closed_lost'].includes(c.id))
  .map(c => c.id);

export const getInitialStageFilter = (): string[] | undefined => {
  // 1. Check URL parameters (highest priority)
  const urlParams = new URLSearchParams(window.location.search);
  const urlFilter = urlParams.get('filter');
  if (urlFilter) {
    try {
      const parsed = JSON.parse(urlFilter);
      if (parsed.stage) {
        return Array.isArray(parsed.stage) ? parsed.stage : [parsed.stage];
      }
    } catch {
      // Invalid JSON, continue to fallback
    }
  }

  // 2. Check localStorage preferences
  return getStoredStagePreferences();
};

// Save preferences when stage filter changes
export const saveStagePreferences = (selectedStages: string[]): void => {
  if (selectedStages.length === 0) return; // Don't save empty array
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedStages));
  } catch (error) {
    console.warn('Failed to save stage preferences:', error);
  }
};
```

**Usage in OpportunityList:**
```typescript
// OpportunityList.tsx:62-67
// Monitor stage filter changes and update localStorage preferences
useEffect(() => {
  if (filterValues?.stage && Array.isArray(filterValues.stage)) {
    saveStagePreferences(filterValues.stage);
  }
}, [filterValues?.stage]);
```

### Filter Display (FilterChipsPanel)

**Active filter chips:**
```typescript
// FilterChipsPanel.tsx:18-92
export const FilterChipsPanel = ({ className }: FilterChipsPanelProps) => {
  const { filterValues, removeFilterValue } = useFilterManagement();

  // Fetch organization/sales/tag names for display
  const { getOrganizationName } = useOrganizationNames(organizationIds);
  const { getSalesName } = useSalesNames(salesIds);
  const { getTagName } = useTagNames(tagIds);

  // Flatten filters for display
  const filterChips = flattenFilterValues(filterValues || {});

  return (
    <Accordion type="single" collapsible defaultValue="filters">
      <AccordionItem value="filters">
        <AccordionTrigger>
          <span>Active Filters ({filterChips.length} filter{filterChips.length !== 1 ? 's' : ''})</span>
        </AccordionTrigger>
        <AccordionContent>
          {filterChips.map((chip) => {
            const label = formatFilterLabel(chip.key, chip.value, getOrganizationName, getSalesName, getTagName);
            return (
              <FilterChip
                key={`${chip.key}-${chip.value}`}
                label={label}
                onRemove={() => removeFilterValue(chip.key, chip.value)}
              />
            );
          })}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
```

## Gotchas & Edge Cases

### 1. No Drag-and-Drop Implementation

**Issue:** `@hello-pangea/dnd` is installed but not wired up.

**Current State:**
- Package in `package.json`: `"@hello-pangea/dnd": "^18.0.1"`
- No `DragDropContext`, `Droppable`, or `Draggable` components in codebase
- Index management is fully manual via `OpportunitiesService.unarchiveOpportunity()`

**Implication for redesign:**
- Opportunity to implement drag-and-drop from scratch
- Need to handle `onDragEnd` callback to update `index` and `stage` fields
- Must invalidate React Query cache after drag operations

### 2. Contact Array Filter Clearing Bug (FIXED)

**Previous Issue:** `contact_ids` would clear when other form fields changed.

**Root Cause:** Filter object recreation in `ReferenceArrayInput` triggered re-fetch, clearing values during fetch cycle.

**Fix (Constitution #1: NO OVER-ENGINEERING):**
```typescript
// OpportunityInputs.tsx:168-176
// Memoize the filter object to prevent unnecessary re-renders and value clearing
const contactFilter = useMemo(
  () => (customerOrganizationId ? { organization_id: customerOrganizationId } : {}),
  [customerOrganizationId]
);
```

**Lesson:** Simple `useMemo` fix prevents complex state management.

### 3. Validation Schema Split (Create vs Update)

**Issue:** React Admin v5 sends ALL form fields during update, not just dirty fields.

**Implication:**
```typescript
// validation/opportunities.ts:132-159
// Update schema must handle two cases:
// 1. contact_ids NOT in payload (undefined) → ALLOW (partial update)
// 2. contact_ids IN payload but empty [] → REJECT (can't remove all contacts)
export const updateOpportunitySchema = opportunityBaseSchema
  .partial()
  .required({ id: true })
  .refine(
    (data) => {
      if (data.contact_ids === undefined) return true; // Partial update OK
      return Array.isArray(data.contact_ids) && data.contact_ids.length > 0;
    },
    { message: "At least one contact is required", path: ["contact_ids"] }
  );
```

**Gotcha:** Can't use simple `.min(1)` validation on update schema due to React Admin's form behavior.

### 4. Stage Filter Column Visibility

**Behavior:** Filtering by stage HIDES columns for unselected stages.

**Implementation:**
```typescript
// OpportunityListContent.tsx:20-23
const visibleStages = filterValues?.stage && Array.isArray(filterValues.stage) && filterValues.stage.length > 0
  ? allOpportunityStages.filter((stage) => filterValues.stage.includes(stage.value))
  : allOpportunityStages;
```

**Gotcha:** If user selects only 1 stage, only 1 column will be visible. This is intentional but may confuse users expecting a global filter that highlights opportunities.

**Implication for redesign:** Consider alternative UI pattern for stage filtering (e.g., dim unfiltered columns vs hiding them).

### 5. Index Management on Create

**Issue:** Creating a new opportunity requires updating indexes for ALL existing opportunities in the same stage.

**Performance Impact:**
```typescript
// OpportunityCreate.tsx:43-51
// Update indexes to make room for the new opportunity at index 0
await Promise.all(
  opportunities.map(async (oldOpportunity) =>
    dataProvider.update("opportunities", {
      id: oldOpportunity.id,
      data: { index: oldOpportunity.index + 1 },
      previousData: oldOpportunity,
    }),
  ),
);
```

**Gotcha:** Creating an opportunity in a stage with 100 existing opportunities will trigger 100 database updates.

**Implication for redesign:**
- Consider using fractional indexes (e.g., index = 0.5 between 0 and 1)
- Or use a linked-list approach (prev_id, next_id)
- Or use timestamp-based ordering

### 6. Archive/Unarchive Index Reset

**Behavior:** Unarchiving an opportunity resets ALL indexes in the stage.

```typescript
// opportunities.service.ts:30-34
const updatedOpportunities = opportunities.map((o, index) => ({
  ...o,
  index: o.id === opportunity.id ? 0 : index + 1,  // Unarchived opportunity gets index 0
  deleted_at: o.id === opportunity.id ? null : o.deleted_at,
}));
```

**Gotcha:** Unarchiving can disrupt the existing card order that users may have carefully arranged.

**Implication for redesign:** Consider preserving original index or prompting user for placement.

### 7. Semantic Color System

**Pattern:** All colors use CSS variables, never hex codes.

**Example:**
```typescript
// stageConstants.ts:28-42
{
  value: "new_lead",
  label: "New Lead",
  color: "var(--info-subtle)",  // Semantic variable, not #3b82f6
  elevation: 3,
}
```

**Validation:**
```bash
npm run validate:colors  # Checks for hex codes in components
```

**Gotcha:** Must use semantic variables (`--primary`, `--brand-700`, `--destructive`) for all color styling.

## What Works Well

### 1. Centralized Stage Management

**Pattern:** `stageConstants.ts` as single source of truth.

**Benefits:**
- Easy to add/remove/reorder stages
- Consistent labels and colors across entire app
- Helper functions prevent repetitive lookups
- Legacy compatibility layer for gradual migration

**Example:**
```typescript
// Before (hardcoded in every component)
const stages = [
  { value: "lead", label: "Lead" },
  { value: "qualified", label: "Qualified" },
  // ...
];

// After (centralized)
import { OPPORTUNITY_STAGES, getOpportunityStageLabel } from "./stageConstants";
```

### 2. Form State Derived from Schema (Constitution #5)

**Pattern:** Zod schema with `.default()` values generates form defaults.

**Benefits:**
- Single source of truth for defaults
- Type safety
- Validation and defaults in one place
- No duplicate logic between schema and form

**Example:**
```typescript
// Schema defines default
stage: opportunityStageSchema.nullable().default("new_lead"),

// Form extracts default automatically
const formDefaults = opportunitySchema.partial().parse({});
// Result: { stage: "new_lead", priority: "medium", ... }
```

### 3. Semantic Color Variables

**Pattern:** CSS variables instead of hex codes.

**Benefits:**
- Theme consistency
- Easy theme switching (light/dark mode)
- Automatic contrast adjustments
- Centralized color management

**Example:**
```typescript
// Good
color: "var(--info-subtle)"

// Bad (not allowed)
color: "#3b82f6"
```

### 4. Lazy-Loaded Module Exports

**Pattern:** `index.ts` with `React.lazy()` for all CRUD components.

**Benefits:**
- Code splitting
- Faster initial page load
- Consistent export pattern across all modules

**Example:**
```typescript
// index.ts
const OpportunityList = React.lazy(() => import("./OpportunityList"));
const OpportunityCreate = React.lazy(() => import("./OpportunityCreate"));
// ...

export default {
  list: OpportunityList,
  create: OpportunityCreate,
  edit: OpportunityEdit,
  show: OpportunityShow,
};
```

### 5. Auto-Generated Naming

**Pattern:** `useAutoGenerateName` hook generates opportunity names from related data.

**Benefits:**
- Consistent naming convention
- Reduces user input burden
- Still allows manual override
- Automatic in create mode, manual refresh in edit mode

**Format:** `"Customer Name - Principal Name - MMM YYYY"`

## What Needs Improvement for Redesign

### 1. Implement Drag-and-Drop

**Current:** Manual index management only.

**Needed:**
- Wire up `@hello-pangea/dnd` library
- `DragDropContext` wrapping Kanban board
- `Droppable` for each column
- `Draggable` for each card
- `onDragEnd` handler to update `index` and `stage`

**Reference implementation:**
```typescript
// Pseudo-code for drag-and-drop
<DragDropContext onDragEnd={handleDragEnd}>
  {visibleStages.map((stage) => (
    <Droppable droppableId={stage.value} key={stage.value}>
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          {opportunitiesByStage[stage.value].map((opp, index) => (
            <Draggable draggableId={opp.id.toString()} index={index} key={opp.id}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                  <OpportunityCard opportunity={opp} />
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  ))}
</DragDropContext>
```

### 2. Optimize Index Management

**Current:** Full index recalculation on create/unarchive.

**Issues:**
- Performance degradation with many opportunities
- Unnecessary database writes
- Potential race conditions

**Alternatives:**
- **Fractional indexing:** Use decimal values (e.g., 0.5 between 0 and 1)
- **Timestamp-based:** Sort by `created_at` or `updated_at`
- **Linked list:** `prev_id` and `next_id` fields
- **Lexorank:** String-based ordering (e.g., "a0", "a1", "a2")

### 3. Improve Stage Filter UX

**Current:** Stage filter HIDES columns for unselected stages.

**Issues:**
- Confusing when only 1 stage is selected
- Loses context of full pipeline
- No visual indication of hidden opportunities

**Alternatives:**
- **Dim unselected columns** instead of hiding
- **Global filter** that highlights opportunities across all columns
- **Dedicated "view" selector** (All Stages vs Selected Stages)

### 4. Add Bulk Operations

**Current:** No bulk actions (move stage, archive, assign owner).

**Needed:**
- Bulk select checkboxes on cards
- Bulk action toolbar (Move to Stage, Archive, Assign Owner)
- Multi-select with Shift+Click

### 5. Enhance Card Display

**Current:** Card shows name, customer, principal, priority.

**Missing:**
- Estimated close date
- Owner avatar
- Contact count
- Last activity indicator
- Visual priority indicator (beyond badge)

**Recommendation:**
```typescript
// Enhanced card layout
<OpportunityCard>
  {/* Header: Priority + Owner Avatar */}
  {/* Line 1: Opportunity Name */}
  {/* Line 2: Customer Organization */}
  {/* Line 3: Principal Organization (if exists) */}
  {/* Footer: Close Date + Contact Count + Last Activity */}
</OpportunityCard>
```

### 6. Add Summary/Analytics

**Current:** Only column counts (`(5)` in column header).

**Needed:**
- Total opportunity value (if amount field exists)
- Stage conversion rates
- Average time in stage
- Win/loss metrics

### 7. Mobile Responsiveness

**Current:** Kanban board with `overflow-x-auto` scrolling.

**Issues:**
- Hard to use on mobile
- No touch-friendly drag-and-drop
- Column headers scroll out of view

**Recommendations:**
- Responsive layout (list view on mobile, Kanban on desktop)
- Touch-optimized drag handles
- Sticky column headers

## Relevant Docs

### Internal Documentation
- [Engineering Constitution](/home/krwhynot/projects/crispy-crm/docs/claude/engineering-constitution.md) - Core principles (NO OVER-ENGINEERING, FORM STATE FROM SCHEMA, SEMANTIC COLORS)
- [Architecture Essentials](/home/krwhynot/projects/crispy-crm/docs/claude/architecture-essentials.md) - Module patterns, data layer, configuration
- [Common Tasks](/home/krwhynot/projects/crispy-crm/docs/claude/common-tasks.md) - Adding resources, customizing CRM
- [Supabase Workflow](/home/krwhynot/projects/crispy-crm/docs/supabase/WORKFLOW.md) - Database migrations and local development

### External Documentation
- [React Admin Documentation](https://marmelab.com/react-admin/Tutorial.html) - Framework patterns
- [React Hook Form](https://react-hook-form.com/docs) - Form state management
- [Zod](https://zod.dev/) - Schema validation
- [@hello-pangea/dnd](https://github.com/hello-pangea/dnd) - Drag-and-drop library (installed but not used)
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Supabase](https://supabase.com/docs) - Backend platform

---

**Research Completed:** 2025-10-23
**Module Version:** Pre-launch phase
**Files Analyzed:** 34 opportunities module files + 10 related files
**Next Steps:** Use this document to inform opportunity redesign planning
