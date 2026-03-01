# Activity Patterns

Patterns for activity logging, filtering, sample tracking, and data export in Crispy CRM.

## Component Hierarchy

```
                    ┌─────────────────────────────┐
                    │     React Admin Routes      │
                    └─────────────────────────────┘
                               │
                        resource.tsx
                    (lazy-loading + ErrorBoundary)
                               │
          ┌────────────────────┼────────────────────┐
          ▼                    ▼                     ▼
    ActivityList          ActivityEdit          ActivityShow
          │                    │              (standalone page)
          │                    ▼
          │             ActivityInputs
          │             (error summary +
          │              ActivitySinglePage)
          │
          ├─→ UnifiedListPageLayout
          │       └─→ ActivityListFilter (sidebar filters)
          │       └─→ PremiumDatagrid
          │               ├─→ ActivityTypeCell (memo)
          │               ├─→ ActivitySampleStatusCell (memo)
          │               └─→ ActivitySentimentCell (memo)
          │
          └─→ ActivitySlideOver (40vw)
                  ├─→ slideOverTabs/ActivityDetailsTab
                  └─→ slideOverTabs/ActivityRelatedTab

┌─────────────────────────────────────────────────────────────┐
│      Quick Logging (Dashboard module - NOT activities)        │
└─────────────────────────────────────────────────────────────┘
                            │
       QuickLogForm (lazy-loaded from ../dashboard/)
       (reusable rapid entry form)
                            │
       ActivityTimeline (History View)
       Entry (display)
```

---

## Pattern A: Quick Activity Logging

Rapid activity entry for <30 second logging, accessible from the dashboard and entity slide-overs.

> **Note:** The `QuickLogForm` component lives in the **dashboard module** (`src/atomic-crm/dashboard/QuickLogForm`), not in the activities directory. It is lazy-loaded into activity creation entry points. There is no `QuickLogActivityDialog.tsx` file in the activities module.

### Entity Context

```tsx
// Interface used by callers to provide pre-fill context
export interface ActivityEntityContext {
  /** Pre-fill and lock the contact field */
  contactId?: number;
  /** Pre-fill and lock the organization field */
  organizationId?: number;
  /** Pre-fill and lock the opportunity field (also sets activity_type to "interaction") */
  opportunityId?: number;
}
```

### Lazy Loading Pattern

```tsx
// resource.tsx - Saves ~15-20KB from initial chunk via lazy loading
const QuickLogForm = lazy(() =>
  import("../dashboard/QuickLogForm").then((m) => ({
    default: m.QuickLogForm,
  }))
);

// Usage with Suspense fallback
<Suspense fallback={<QuickLogFormSkeleton />}>
  <QuickLogForm
    onComplete={handleComplete}
    initialDraft={initialDraft}
    onDraftChange={enableDraftPersistence ? handleDraftChange : undefined}
  />
</Suspense>
```

**When to use**: Dashboard FAB, slide-over "Log Activity" buttons, anywhere rapid <30 second entry is needed.

**Source:** `QuickLogForm` in `src/atomic-crm/dashboard/`, lazy-loaded via `resource.tsx`

---

## Pattern B: Activity Type Filtering

Sidebar filter panel using collapsible `FilterCategory` components with 13 interaction types, sample status, dates, and sentiment filtering.

```tsx
// ActivityListFilter.tsx
<FilterCategory label="Activity Type" icon={<Tag className="h-4 w-4" />}>
  {INTERACTION_TYPE_OPTIONS.map((option) => (
    <ToggleFilterButton
      multiselect
      key={option.value}
      className="w-full justify-between"
      label={option.label}
      value={{ type: option.value }}
    />
  ))}
</FilterCategory>
```

### Quick Filters

```tsx
// Most commonly used filters with prominent placement
<div className="flex flex-col gap-2">
  <h3 className="font-semibold text-sm text-muted-foreground">Quick Filters</h3>
  <ToggleFilterButton
    className="w-full justify-between"
    label={
      <span className="flex items-center gap-2">
        <Package className="h-4 w-4" aria-hidden="true" />
        Samples Only
      </span>
    }
    value={{ type: "sample" }}
  />
  <ToggleFilterButton
    className="w-full justify-between"
    label={
      <span className="flex items-center gap-2">
        <Clock className="h-4 w-4" aria-hidden="true" />
        Pending Feedback
      </span>
    }
    value={{ sample_status: "feedback_pending" }}
  />
</div>
```

### Date Range Presets

```tsx
// Uses date-fns for date calculations
<FilterCategory label="Activity Date" icon={<Calendar className="h-4 w-4" />}>
  <ToggleFilterButton
    className="w-full justify-between"
    label="Today"
    value={{
      "activity_date@gte": startOfToday().toISOString(),
      "activity_date@lte": endOfToday().toISOString(),
    }}
  />
  <ToggleFilterButton
    className="w-full justify-between"
    label="This Week"
    value={{
      "activity_date@gte": startOfWeek(new Date()).toISOString(),
      "activity_date@lte": endOfToday().toISOString(),
    }}
  />
  <ToggleFilterButton
    className="w-full justify-between"
    label="Last 7 Days"
    value={{
      "activity_date@gte": subDays(startOfToday(), 7).toISOString(),
      "activity_date@lte": endOfToday().toISOString(),
    }}
  />
</FilterCategory>
```

### 13 Interaction Types

| Category | Types |
|----------|-------|
| **Communication** | call, email, check_in, social |
| **Meetings** | meeting, demo, site_visit, trade_show |
| **Documentation** | proposal, follow_up, contract_review, note, sample |

**When to use**: List sidebar filtering with collapsible categories and multi-select support.

**Example:** `src/atomic-crm/activities/ActivityListFilter.tsx`

---

## Pattern C: Sample Status Tracking

Multi-stage visual workflow component for sample activities with optional interactive progression and status updates.

```tsx
// SampleStatusBadge.tsx
export const SAMPLE_STATUS_WORKFLOW: readonly SampleStatus[] = [
  "sent",
  "received",
  "feedback_pending",
  "feedback_received",
] as const;

// Status configuration with P8 design colors
export const SAMPLE_STATUS_CONFIG: Record<SampleStatus, StatusConfig> = {
  sent: {
    label: "Sent",
    shortLabel: "Sent",
    icon: Package,
    variant: "secondary",
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
    description: "Sample has been dispatched to customer",
  },
  received: {
    label: "Received",
    shortLabel: "Recv",
    icon: PackageCheck,
    variant: "default",
    className: "bg-success text-success-foreground border-success/20",
    description: "Customer confirmed receipt of sample",
  },
  feedback_pending: {
    label: "Feedback Pending",
    shortLabel: "Pending",
    icon: Clock,
    variant: "outline",
    className: "bg-warning text-warning-foreground border-warning/20",
    description: "Awaiting customer feedback on sample",
  },
  feedback_received: {
    label: "Feedback Received",
    shortLabel: "Complete",
    icon: MessageSquareText,
    variant: "default",
    className: "bg-primary text-primary-foreground border-primary/20",
    description: "Feedback collected, workflow complete",
  },
};
```

### Workflow Helper Functions

```tsx
// Workflow helper functions
export function getNextStatus(currentStatus: SampleStatus): SampleStatus | undefined {
  const currentIndex = SAMPLE_STATUS_WORKFLOW.indexOf(currentStatus);
  if (currentIndex === -1 || currentIndex >= SAMPLE_STATUS_WORKFLOW.length - 1) {
    return undefined;
  }
  return SAMPLE_STATUS_WORKFLOW[currentIndex + 1];
}

export function isValidTransition(from: SampleStatus, to: SampleStatus): boolean {
  const fromIndex = SAMPLE_STATUS_WORKFLOW.indexOf(from);
  const toIndex = SAMPLE_STATUS_WORKFLOW.indexOf(to);
  // Allow forward progression only (or same status)
  return toIndex > fromIndex;
}
```

### Component Modes

```tsx
// Read-only badge
<SampleStatusBadge status="received" />

// Interactive with stepper
<SampleStatusBadge
  status="received"
  activityId={123}
  interactive
  showStepper
  onStatusChange={(s) => logger.info('Updated to', { status: s })}
/>
```

### PATCH Update Pattern

```tsx
// Uses React Admin useUpdate hook
const handleAdvanceStatus = useCallback(async () => {
  if (!activityId || !nextStatus) return;

  await update(
    "activities",
    {
      id: activityId,
      data: { sample_status: nextStatus },
      previousData: { sample_status: status },
    },
    {
      onSuccess: () => {
        notify(`Sample status updated to ${SAMPLE_STATUS_CONFIG[nextStatus].label}`, {
          type: "success",
        });
        onStatusChange?.(nextStatus);
        setIsPopoverOpen(false);
      },
      onError: (error) => {
        notify(`Failed to update: ${error.message}`, { type: "error" });
      },
    }
  );
}, [activityId, nextStatus, status, update, notify, onStatusChange]);
```

**When to use**: Sample activities requiring multi-stage workflow visualization with optional inline status updates.

**Example:** `src/atomic-crm/components/SampleStatusBadge.tsx`

---

## Pattern D: Activity List with Sentiment

Standard list page using `UnifiedListPageLayout` for centralized empty-state branching, loading states, filter cleanup, and bulk actions. Includes keyboard navigation, responsive datagrid with memoized cell components, and CSV export with relationship enrichment.

### Memoized Cell Components

The datagrid uses memoized cell components for render performance:

```tsx
// ActivityList.tsx - Named memo components for React DevTools
const ActivityTypeCell = memo(function ActivityTypeCell({ record }: { record: ActivityRecord }) {
  const typeOption = INTERACTION_TYPE_OPTIONS.find((opt) => opt.value === record.type);
  return (
    <Badge variant="outline" className="text-xs">
      {typeOption?.label || record.type}
    </Badge>
  );
});

const ActivitySampleStatusCell = memo(function ActivitySampleStatusCell({
  record,
}: { record: ActivityRecord }) {
  if (record.type !== "sample" || !record.sample_status) {
    return <span className="text-muted-foreground">—</span>;
  }
  return <SampleStatusBadge status={record.sample_status} />;
});

const ActivitySentimentCell = memo(function ActivitySentimentCell({
  record,
}: { record: ActivityRecord }) {
  if (!record.sentiment) {
    return <span className="text-muted-foreground">—</span>;
  }
  const sentimentColors: Record<string, string> = {
    positive: "bg-success/10 text-success",
    neutral: "bg-muted text-muted-foreground",
    negative: "bg-destructive/10 text-destructive",
  };
  return (
    <Badge className={sentimentColors[record.sentiment] || ""} variant="outline">
      {ucFirst(record.sentiment)}
    </Badge>
  );
});
```

### Column Visibility

Uses `COLUMN_VISIBILITY.ipadPlus` for responsive columns (the deprecated alias `desktopOnly` still exists but should not be used in new code):

```tsx
<FunctionField
  label="Sentiment"
  sortable={false}
  render={(record: ActivityRecord) => <ActivitySentimentCell record={record} />}
  {...COLUMN_VISIBILITY.ipadPlus}
/>
```

### Column Layout

| Column | Field | Visibility | Sortable |
|--------|-------|------------|----------|
| 1 | Type (badge) | Always | Yes |
| 2 | Subject | Always | Yes |
| 3 | Activity Date | Always | Yes |
| 4 | Sample Status | ipadPlus | No |
| 5 | Sentiment | ipadPlus | No |
| 6 | Organization | Always | Yes |
| 7 | Opportunity | ipadPlus | No |
| 8 | Created By | ipadPlus | No |

**When to use**: Main activity list page with filtering, responsive columns, and export capability.

**Example:** `src/atomic-crm/activities/ActivityList.tsx`

---

## Pattern E: Draft Persistence

Zod schema for validating activity draft data stored in localStorage with type safety and expiry validation. Draft utility functions are centralized in `utils/activityDraftStorage.ts`.

```tsx
// activityDraftSchema.ts - Full file
import { z } from "zod";

/**
 * Security: Validates localStorage data to prevent type confusion attacks.
 */
export const activityDraftSchema = z.strictObject({
  formData: z
    .object({
      activity_type: z.string().max(50).optional(),
      notes: z.string().max(10000).optional(),
      contact_id: z.number().int().positive().optional(),
      organization_id: z.number().int().positive().optional(),
      opportunity_id: z.number().int().positive().optional(),
      date: z.string().max(50).optional(),
    })
    .passthrough(), // Allow additional form fields for future expansion
  savedAt: z.number().int().positive(),
});

export type ActivityDraft = z.infer<typeof activityDraftSchema>;
```

### Centralized Draft Storage Utilities

Draft persistence functions are extracted to `utils/activityDraftStorage.ts` with four exported functions:

```tsx
// utils/activityDraftStorage.ts
export const DEFAULT_DRAFT_STORAGE_KEY = "quick-log-activity-draft";
export const DRAFT_SAVE_DEBOUNCE_MS = 500;
export const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Generate a unique draft storage key based on context */
export function generateDraftKey(baseKey: string, contextId?: string): string {
  return contextId ? `${baseKey}-${contextId}` : baseKey;
}

/** Load a draft from localStorage (returns null if not found/expired/invalid) */
export function loadDraft(storageKey: string): Partial<ActivityLogInput> | null {
  if (typeof window === "undefined") return null;

  const stored = localStorage.getItem(storageKey);
  if (!stored) return null;

  const draft = safeJsonParse(stored, activityDraftSchema);
  if (!draft) {
    localStorage.removeItem(storageKey);
    return null;
  }

  // Check if draft has expired
  if (Date.now() - draft.savedAt > DRAFT_EXPIRY_MS) {
    localStorage.removeItem(storageKey);
    return null;
  }

  return draft.formData;
}

/** Save a draft to localStorage (empty drafts are auto-removed) */
export function saveDraft(storageKey: string, formData: Partial<ActivityLogInput>): void {
  if (typeof window === "undefined") return;

  const hasContent =
    formData.notes || formData.contactId || formData.organizationId || formData.opportunityId;

  if (!hasContent) {
    localStorage.removeItem(storageKey);
    return;
  }

  const draft: ActivityDraft = { formData, savedAt: Date.now() };
  localStorage.setItem(storageKey, JSON.stringify(draft));
}

/** Clear a draft from localStorage */
export function clearDraft(storageKey: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey);
}
```

**Key points:**
- `z.strictObject()` prevents mass assignment attacks
- `.passthrough()` allows additional form fields for future expansion
- 24-hour expiry prevents stale drafts from appearing
- Debounced saves (500ms) prevent excessive localStorage writes
- Empty drafts are automatically removed
- `generateDraftKey` supports context-specific keys (e.g., per-entity slide-over)

**When to use**: Dialogs where users may close accidentally and need recovery.

**Example:** Schema in `src/atomic-crm/activities/activityDraftSchema.ts`, utilities in `src/atomic-crm/activities/utils/activityDraftStorage.ts`

---

## Pattern F: Activity Filter Config

Centralized filter configuration matching ActivityListFilter UI with label consistency and display formatting.

```tsx
// activityFilterConfig.ts - Full implementation
import { validateFilterConfig } from "../filters/filterConfigSchema";
import {
  INTERACTION_TYPE_OPTIONS,
  SAMPLE_STATUS_OPTIONS,
  sentimentSchema,
} from "../validation/activities";
import { ucFirst } from "../utils";

// Convert validation options to filter choices format
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
  name: ucFirst(value),
}));

export const ACTIVITY_FILTER_CONFIG = validateFilterConfig([
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

**Key points:**
- Imports from validation schema (single source of truth)
- Uses `ucFirst` utility from `../utils` (not inline `charAt(0).toUpperCase()`)
- Prevents label drift between filter UI and chip display
- `removalGroup` ensures coordinated date range cleanup

**When to use**: Centralized filter definitions for ListSearchBar integration.

**Example:** `src/atomic-crm/activities/activityFilterConfig.ts`

---

## Pattern G: Single-Page Activity View

Comprehensive form layout with 4 logical sections using `FormSectionWithProgress` (with `id` and `requiredFields` props) and `FormFieldWrapper` components.

```tsx
// ActivitySinglePage.tsx - Activity Details section
export default function ActivitySinglePage() {
  const interactionType = useWatch({ name: "type" });
  const isSampleActivity = interactionType === "sample";

  return (
    <div className="space-y-6">
      <FormSectionWithProgress
        id="activity-details"
        title="Activity Details"
        requiredFields={["type", "subject", "activity_date"]}
      >
        <FormGrid>
          <FormFieldWrapper name="type" isRequired countDefaultAsFilled>
            <SelectInput
              source="type"
              label="Interaction Type"
              choices={INTERACTION_TYPE_OPTIONS.map((option) => ({
                id: option.value,
                name: option.label,
              }))}
              helperText="Choose how this interaction occurred"
              isRequired
            />
          </FormFieldWrapper>

          {/* WG-001: Sample Status field - only shown when type="sample" */}
          {isSampleActivity && (
            <FormFieldWrapper name="sample_status" isRequired>
              <SelectInput
                source="sample_status"
                label="Sample Status"
                choices={SAMPLE_STATUS_CHOICES}
                helperText="Current status of the sample workflow"
                isRequired
              />
            </FormFieldWrapper>
          )}
        </FormGrid>

        <FormFieldWrapper name="subject" isRequired>
          <TextInput
            source="subject"
            label="Subject"
            isRequired
            helperText="Summarize the outcome or topic"
          />
        </FormFieldWrapper>

        <FormGrid>
          <FormFieldWrapper name="activity_date" isRequired countDefaultAsFilled>
            <DateInput source="activity_date" label="Date" isRequired disableFuture />
          </FormFieldWrapper>
          <FormFieldWrapper name="duration_minutes">
            <TextInput
              source="duration_minutes"
              label="Duration (minutes)"
              type="number"
              helperText="Optional length of the activity"
            />
          </FormFieldWrapper>
        </FormGrid>

        <FormFieldWrapper name="description">
          <TextInput
            source="description"
            label="Notes"
            multiline
            rows={4}
            helperText="Optional narrative for this interaction"
          />
        </FormFieldWrapper>
      </FormSectionWithProgress>

      {/* Additional sections: Relationships, Follow-up, Outcome */}
    </div>
  );
}
```

### Form Sections

| Section | Fields |
|---------|--------|
| **Activity Details** | type, subject, activity_date, duration_minutes, description, sample_status (conditional: type="sample") |
| **Relationships** | opportunity_id, contact_id, organization_id |
| **Follow-up** | sentiment, follow_up_required (BooleanInput), follow_up_date, follow_up_notes |
| **Outcome** | location, outcome |

**Key points:**
- `FormSectionWithProgress` provides logical grouping with progress tracking via `id` and `requiredFields` props
- `FormGrid` creates responsive column layouts
- `FormFieldWrapper` with `isRequired` and `countDefaultAsFilled`
- `sample_status` field conditionally shown when `type="sample"` (uses `useWatch`)
- `follow_up_required` is a `BooleanInput` with context-sensitive helper text for sample activities
- All reference inputs use AutocompleteInput

**When to use**: Full activity create/edit forms with comprehensive fields.

**Example:** `src/atomic-crm/activities/ActivitySinglePage.tsx`

---

## Pattern H: Activity Import/Export

CSV export functionality with parallel relationship fetching and name enrichment.

```tsx
// ActivityList.tsx - CSV export with relationship enrichment
const exporter: Exporter<ActivityRecord> = async (records, fetchRelatedRecords) => {
  // Fetch related data in parallel
  const contacts = await fetchRelatedRecords<Contact>(records, "contact_id", "contacts");
  const organizations = await fetchRelatedRecords<Organization>(
    records,
    "organization_id",
    "organizations"
  );
  const opportunities = await fetchRelatedRecords<Opportunity>(
    records,
    "opportunity_id",
    "opportunities"
  );
  const sales = await fetchRelatedRecords<Sale>(records, "created_by", "sales");

  // Map records to export format with enriched names
  const dataForExport = records.map((activity) => {
    const contact = activity.contact_id ? contacts[activity.contact_id] : null;
    const organization = activity.organization_id ? organizations[activity.organization_id] : null;
    const opportunity = activity.opportunity_id ? opportunities[activity.opportunity_id] : null;
    const createdBy = activity.created_by ? sales[activity.created_by] : null;

    return {
      id: activity.id,
      activity_type: activity.activity_type,
      type: activity.type,
      subject: activity.subject,
      description: activity.description || "",
      activity_date: activity.activity_date,
      duration_minutes: activity.duration_minutes || "",
      sample_status: activity.sample_status || "",
      sentiment: activity.sentiment || "",
      contact_name: contact ? `${contact.first_name || ""} ${contact.last_name || ""}`.trim() : "",
      organization_name: organization?.name || "",
      opportunity_name: opportunity?.name || "",
      created_by: createdBy
        ? `${createdBy.first_name || ""} ${createdBy.last_name || ""}`.trim()
        : "",
      created_at: activity.created_at,
    };
  });

  // Export using jsonexport library
  jsonExport(
    dataForExport,
    {
      headers: [
        "id", "activity_type", "type", "subject", "description",
        "activity_date", "duration_minutes", "sample_status", "sentiment",
        "contact_name", "organization_name", "opportunity_name",
        "created_by", "created_at",
      ],
    },
    (err, csv) => {
      if (err) {
        throw new Error(`CSV export failed: ${err.message}`);
      }
      downloadCSV(csv, "activities");
    }
  );
};
```

**Key points:**
- `fetchRelatedRecords()` fetches contacts, organizations, opportunities, sales
- Name enrichment converts IDs to display names
- Uses `jsonexport/dist` for CSV generation
- React Admin's `downloadCSV()` triggers browser download
- Fail-fast error handling (throws on export failure)

**When to use**: CSV export with related entity data enrichment.

**Example:** `src/atomic-crm/activities/ActivityList.tsx` (exporter function)

---

## Activity Creation Pattern

Activity creation uses `QuickLogForm` from the dashboard module, lazy-loaded into entry points:

| Aspect | Details |
|--------|---------|
| **Entry points** | Dashboard FAB, slide-over "+" buttons |
| **Fields shown** | Core fields only (5-6 for quick logging) |
| **Draft persistence** | Yes (localStorage with 24h expiry, via `utils/activityDraftStorage.ts`) |
| **Entity pre-fill** | Yes (locked display via `LockedEntityDisplay` component) |
| **Use case** | Rapid 30-second logging (MVP goal) |
| **Component** | `QuickLogForm` (from `src/atomic-crm/dashboard/`) |
| **Lazy loading** | Yes (QuickLogForm chunk ~15-20KB, loaded via `resource.tsx`) |

> **Note:** The standalone `/activities/create` route was removed to consolidate UX.
> Legacy URLs redirect to `/activities`. Edit via `/activities/:id/edit`.

---

## File Reference

| File | Purpose |
|------|---------|
| `index.tsx` | Module entry point, re-exports components and resource config |
| `resource.tsx` | Lazy-loading layer with `ResourceErrorBoundary` wrappers |
| `ActivityList.tsx` | List page with `UnifiedListPageLayout`, memoized cells, CSV export |
| `ActivityEdit.tsx` | Edit page (wraps `ActivityInputs`) |
| `ActivityShow.tsx` | Standalone show page with `SectionCard` layout |
| `ActivitySinglePage.tsx` | Shared form fields with `FormSectionWithProgress` sections |
| `ActivityInputs.tsx` | Form wrapper: error summary + `ActivitySinglePage` |
| `ActivitySlideOver.tsx` | 40vw slide-over panel with Details/Related tabs |
| `ActivityListFilter.tsx` | Sidebar filter panel (type, status, date, sentiment, owner) |
| `ActivityTimelineEntry.tsx` | Timeline display component for entity detail views |
| `activityDraftSchema.ts` | Zod schema for localStorage draft validation |
| `activityFilterConfig.ts` | Centralized filter config for `ListSearchBar` chips |
| `constants.ts` | Module constants (`ACTIVITY_PAGE_SIZE`) |
| `slideOverTabs/ActivityDetailsTab.tsx` | Details tab for slide-over (view/edit modes) |
| `slideOverTabs/ActivityRelatedTab.tsx` | Related entities tab for slide-over |
| `slideOverTabs/index.ts` | Barrel export for slide-over tabs |
| `utils/activityDraftStorage.ts` | Draft persistence: `generateDraftKey`, `loadDraft`, `saveDraft`, `clearDraft` |
| `components/LockedEntityDisplay.tsx` | Read-only entity field with "Locked" badge |

---

## Searchable Threshold

| Item Count | Recommendation |
|------------|----------------|
| < 20 items | Non-searchable filter buttons |
| >= 20 items | Searchable dropdown |
| > 100 items | Server-side filtering via ReferenceInput |

---

## Anti-Patterns

### Missing Draft Cleanup

```tsx
// BAD: Draft persists after successful save
const handleSave = async () => {
  await dataProvider.create("activities", { data });
  onOpenChange(false); // Draft still in localStorage!
};

// GOOD: Always clear draft on successful save
const handleComplete = useCallback(() => {
  if (enableDraftPersistence) {
    clearDraft(draftStorageKey);
    setHasDraft(false);
  }
  onOpenChange(false);
  onSuccess?.({ id: 0, type: "activity" });
}, [enableDraftPersistence, draftStorageKey, onOpenChange, onSuccess]);
```

### Type Confusion

```tsx
// BAD: Confusing activity_type with type
filter={{ activity_type: "call" }}  // WRONG!

// GOOD: activity_type = engagement|interaction, type = 13 interaction types
filter={{ type: "call" }}           // Correct
filter={{ activity_type: "interaction", type: "call" }}  // Full context
```

### Direct sample_status Updates

```tsx
// BAD: Raw update bypasses workflow validation
await update("activities", { id, data: { sample_status: "feedback_received" } });

// GOOD: Use SampleStatusBadge interactive mode for validated transitions
<SampleStatusBadge
  status={record.sample_status}
  activityId={record.id}
  interactive
  onStatusChange={handleRefresh}
/>
```

### Filter Config Drift

```tsx
// BAD: Hardcoding choices (drifts from validation schema)
const SENTIMENT_CHOICES = [
  { id: "positive", name: "Positive" },
  { id: "negative", name: "Negative" },
  // Missing "neutral"!
];

// GOOD: Derive from validation schema
const SENTIMENT_CHOICES = sentimentSchema.options.map((value) => ({
  id: value,
  name: ucFirst(value),
}));
```

### Hardcoded Sentiment Choices (Known Issue)

> **Known technical debt:** The sentiment choices in `ActivitySinglePage.tsx` (lines 19-23) and
> `slideOverTabs/ActivityDetailsTab.tsx` (lines 32-36) use hardcoded arrays instead of deriving
> from `sentimentSchema`. This contradicts the "derive from validation schema" pattern shown above.
> These should be refactored to use `sentimentSchema.options.map(...)` like `activityFilterConfig.ts` does.

```tsx
// CURRENT (anti-pattern present in code):
const sentimentChoices = [
  { id: "positive", name: "Positive" },
  { id: "neutral", name: "Neutral" },
  { id: "negative", name: "Negative" },
];

// SHOULD BE:
import { sentimentSchema } from "../validation/activities";
import { ucFirst } from "../utils";

const SENTIMENT_CHOICES = sentimentSchema.options.map((value) => ({
  id: value,
  name: ucFirst(value),
}));
```

### Skipping Entity Validation

```tsx
// BAD: Creating interaction without opportunity
await create("activities", {
  data: { activity_type: "interaction", type: "call" }  // Missing opportunity_id!
});

// GOOD: Engagement for standalone, interaction requires opportunity
// Engagement: contact OR organization required, NO opportunity
// Interaction: opportunity required
```

---

## Migration Checklist: Adding New Activity Types

When adding a new activity type:

1. [ ] Add to `interactionTypeSchema` in `src/atomic-crm/validation/activities.ts`
2. [ ] Add to `INTERACTION_TYPE_OPTIONS` with label and value
3. [ ] Update `QuickLogActivity.tsx` keyword inference
4. [ ] Add icon mapping in `ActivityTimelineEntry.tsx`
5. [ ] Update `ActivityListFilter.tsx` if type needs special badge color
6. [ ] Run TypeScript check: `npx tsc --noEmit`
7. [ ] Test in browser: create activity with new type
8. [ ] Verify CSV export includes new type label
9. [ ] Update any type-specific rendering in ActivityList columns
