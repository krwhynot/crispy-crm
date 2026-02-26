# Opportunity Feature Patterns

Comprehensive patterns for the Opportunities module in Crispy CRM. This document covers lazy loading, view management (via UnifiedListPageLayout), collapsible forms, quick data entry, Kanban drag-and-drop, slide-over details, grouped views, and column preferences.

## Component Hierarchy

```
resource.tsx (Entry point)
    ├── OpportunityListView (React.lazy + React.Suspense)
    │       └── OpportunityList
    │           ├── List (React Admin)
    │           │   └── UnifiedListPageLayout
    │           │       ├── primaryAction → QuickAddButton
    │           │       │                   └── QuickAddDialog
    │           │       │                       └── QuickAddForm (RA Form + createFormResolver)
    │           │       │                           └── QuickAddFormContent (useFormContext)
    │           │       │                               ├── OpportunityDetailsSection
    │           │       │                               ├── ContactInformationSection
    │           │       │                               ├── LocationNotesSection
    │           │       │                               └── QuickAddFormActions
    │           │       ├── viewSwitcher → OpportunityViewSwitcher
    │           │       ├── filterComponent → OpportunityListFilter
    │           │       ├── overflowActions → ExportMenuItem
    │           │       └── [VIEW SWITCHER ROUTES]
    │           │           ├── "kanban" → OpportunityListContent (DnD Context)
    │           │           │               ├── OpportunityColumn[]
    │           │           │               │   └── OpportunityCard[] (useSortable)
    │           │           │               ├── DragOverlay
    │           │           │               └── CloseOpportunityModal (close stage intercept)
    │           │           ├── "list" → OpportunityRowListView
    │           │           ├── "campaign" → CampaignGroupedList
    │           │           └── "principal" → PrincipalGroupedList
    │           │                               └── PrincipalColumn[]
    │           │                                   └── PrincipalOpportunityCard[]
    │           └── OpportunitySlideOver (40vw panel)
    │                   ├── ResourceSlideOver (generic wrapper)
    │                   │   └── headerActions: FavoriteToggleButton + QuickAddTaskButton
    │                   └── [TABS]
    │                       ├── OpportunitySlideOverDetailsTab
    │                       ├── OpportunityContactsTab
    │                       ├── OpportunityProductsTab
    │                       └── OpportunityNotesTab
    ├── OpportunityCreateView (Redirect)
    │       └── OpportunityCreateRedirect → redirects to /opportunities list
    │           (Quick Add is now the primary creation entry point)
    ├── OpportunityCreate (Standalone form - linked from SlideOver)
    │       └── CreateBase + FormProgressProvider
    │               ├── FormProgressBar
    │               ├── Form (React Admin)
    │               │   └── OpportunityFormContent
    │               │       ├── FormErrorSummary
    │               │       ├── OpportunityInputs (mode="create")
    │               │       │   └── OpportunityCompactForm
    │               │       │       ├── FormSectionWithProgress (Opportunity Details)
    │               │       │       ├── FormSectionWithProgress (Pipeline)
    │               │       │       ├── CollapsibleSection (Contacts & Products)
    │               │       │       ├── CollapsibleSection (Classification)
    │               │       │       └── CollapsibleSection (Additional Details)
    │               │       └── OpportunityCreateFormFooter
    │               ├── SimilarOpportunitiesDialog
    │               └── OpportunityCreateFormTutorial
    └── OpportunityEditView (React.lazy + React.Suspense)
            └── OpportunityEdit
```

---

## Pattern A: Lazy Loading + Create Redirect

Route-level code splitting with `React.lazy()` wrapped in `ResourceErrorBoundary`. The `/opportunities/create` route redirects to the list view where Quick Add is the primary creation entry point.

**When to use:** Resource entry points where bundle splitting improves initial load time.

```tsx
// src/atomic-crm/opportunities/resource.tsx
import * as React from "react";
import { useRedirect } from "ra-core";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const OpportunityListLazy = React.lazy(() => import("./OpportunityList"));
const OpportunityEditLazy = React.lazy(() => import("./OpportunityEdit"));

// Quick Add is now the entry point - redirect /opportunities/create to list
const OpportunityCreateRedirect = () => {
  const redirect = useRedirect();
  React.useEffect(() => {
    redirect("list", "opportunities");
  }, [redirect]);
  return null;
};

export const OpportunityListView = () => (
  <ResourceErrorBoundary resource="opportunities" page="list">
    <React.Suspense fallback={<Loading />}>
      <OpportunityListLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

export const OpportunityCreateView = () => <OpportunityCreateRedirect />;

export const OpportunityEditView = () => (
  <ResourceErrorBoundary resource="opportunities" page="edit">
    <React.Suspense fallback={<Loading />}>
      <OpportunityEditLazy />
    </React.Suspense>
  </ResourceErrorBoundary>
);

const opportunityRecordRepresentation = (record: Opportunity) => record?.name || "Opportunity";

// React Admin resource config
export default {
  list: OpportunityListView,
  create: OpportunityCreateView,
  edit: OpportunityEditView,
  recordRepresentation: opportunityRecordRepresentation,
};
```

**Key points:**
- `React.lazy()` enables route-level code splitting
- `React.Suspense fallback={<Loading />}` provides loading UI while lazy chunks resolve
- `ResourceErrorBoundary` wraps lazy+suspense for graceful error handling
- **Create redirects to list** - Quick Add button is the primary creation UX
- Full create form accessible via "Create Full Opportunity" link in Quick Add
- Each view is independently loadable (reduces initial bundle size)

---

## Pattern B: View Switcher + Persistence

Multiple view modes (Kanban, List, Campaign, Principal) with localStorage persistence of user preference.

**When to use:** List pages with multiple visualization options where users have view preferences.

```tsx
// src/atomic-crm/opportunities/OpportunityList.tsx
import { OpportunityViewSwitcher, type OpportunityView } from "./OpportunityViewSwitcher";

const OPPORTUNITY_VIEW_KEY = "opportunity.view.preference";

const getViewPreference = (): OpportunityView => {
  const saved = localStorage.getItem(OPPORTUNITY_VIEW_KEY);
  return saved === "list" || saved === "kanban" || saved === "campaign" || saved === "principal"
    ? saved
    : "kanban"; // Default
};

const saveViewPreference = (view: OpportunityView) => {
  localStorage.setItem(OPPORTUNITY_VIEW_KEY, view);
};

const OpportunityList = () => {
  const [view, setView] = useState<OpportunityView>(getViewPreference);

  const handleViewChange = (newView: OpportunityView) => {
    setView(newView);
    saveViewPreference(newView);
  };

  return (
    <List perPage={25} filter={FILTER_ACTIVE_RECORDS} sort={SORT_BY_CREATED_DESC}>
      <UnifiedListPageLayout
        resource="opportunities"
        filterComponent={<OpportunityListFilter />}
        filterConfig={OPPORTUNITY_FILTER_CONFIG}
        sortFields={["name", "stage", "priority", "estimated_close_date", "created_at"]}
        searchPlaceholder="Search opportunities..."
        enableRecentSearches
        viewSwitcher={<OpportunityViewSwitcher view={view} onViewChange={handleViewChange} />}
        overflowActions={<ExportMenuItem />}
        primaryAction={<QuickAddButton />}
        emptyState={<OpportunityEmpty />}
        filteredEmptyState={<ListNoResults />}
        loadingSkeleton={<ListSkeleton rows={8} columns={5} />}
      >
        <OpportunityListViews view={view} openSlideOver={openSlideOver} />
      </UnifiedListPageLayout>
    </List>
  );
};
```

```tsx
// src/atomic-crm/opportunities/OpportunityViewSwitcher.tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, List, FolderOpen, Factory } from "lucide-react";

export type OpportunityView = "kanban" | "list" | "campaign" | "principal";

export const OpportunityViewSwitcher = ({ view, onViewChange }: Props) => (
  <TooltipProvider>
    <ToggleGroup
      type="single"
      value={view}
      onValueChange={(value) => value && onViewChange(value as OpportunityView)}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <ToggleGroupItem value="kanban" className="h-11 w-11 touch-manipulation">
            <LayoutGrid className="h-4 w-4" />
          </ToggleGroupItem>
        </TooltipTrigger>
        <TooltipContent>Kanban View</TooltipContent>
      </Tooltip>
      {/* ... additional toggle items for list, campaign, principal */}
    </ToggleGroup>
  </TooltipProvider>
);
```

**Key points:**
- Initialize state from localStorage with fallback default
- Persist on every change (no debounce needed for simple string)
- Touch targets: `h-11 w-11` (44x44px) for mobile accessibility
- `touch-manipulation` prevents double-tap zoom on iOS
- Tooltips provide context for icon-only buttons

**Enhanced implementation notes:**
- `UnifiedListPageLayout` handles multiple states: loading skeleton, empty (no data/no filters), filtered-empty (filters applied but no results), and data display
- Props API: `filterComponent`, `filterConfig`, `sortFields`, `primaryAction`, `overflowActions`, `viewSwitcher`, `emptyState`, `filteredEmptyState`, `loadingSkeleton`
- Slide-over state managed via `useSlideOverState` hook (URL-synced `?view=123` params)
- Tutorial integration: `data-tutorial` attributes and `OpportunityListTutorial` component for onboarding
- Stage filter changes synced to localStorage via `saveStagePreferences()` for persistence

**See also:** `OpportunityList.tsx` for the complete implementation with all state handling branches.

---

## Pattern B.1: Dynamic Select Performance Optimizations

Performance patterns for dependent dropdowns (ReferenceInput + AutocompleteInput) that filter based on other field values.

**When to use:** Autocomplete inputs that filter choices based on parent field selections (e.g., contacts filtered by customer, products filtered by principal).

### Memoized Filter Objects

Prevents unnecessary ReferenceInput refetches by maintaining stable filter object references.

```tsx
// src/atomic-crm/opportunities/OpportunityCompactForm.tsx
const customerOrganizationId = useWatch({ name: "customer_organization_id" });
const principalOrganizationId = useWatch({ name: "principal_organization_id" });

// GOOD: useMemo prevents filter object reference changes on unrelated re-renders
const contactFilter = useMemo(
  () => (customerOrganizationId ? { organization_id: customerOrganizationId } : {}),
  [customerOrganizationId]
);

const productFilter = useMemo(
  () => (principalOrganizationId ? { principal_id: principalOrganizationId } : {}),
  [principalOrganizationId]
);

// Usage - filter object only changes when dependency changes
<ReferenceArrayInput source="contact_ids" reference="contacts" filter={contactFilter}>
  <AutocompleteArrayInput ... />
</ReferenceArrayInput>
```

### Debounced API Calls

Standard 300ms debounce prevents excessive API calls during typing.

```tsx
// src/atomic-crm/utils/autocompleteDefaults.ts
export const AUTOCOMPLETE_DEBOUNCE_MS = 300;

// Usage in slide-over tabs
<AutocompleteArrayInput
  debounce={AUTOCOMPLETE_DEBOUNCE_MS}
  shouldRenderSuggestions={shouldRenderSuggestions}
  ...
/>
```

### Minimum Character Threshold

Prevents overly broad searches by requiring 2+ characters before API calls.

```tsx
// src/atomic-crm/utils/autocompleteDefaults.ts
export const AUTOCOMPLETE_MIN_CHARS = 2;

// enableGetChoices blocks ReferenceInput fetch entirely until threshold met
// (shouldRenderSuggestions only hides dropdown, doesn't block fetch)
// Handles both "q" and specific field filters (like "name@ilike")
export const enableGetChoices = (filters: Record<string, unknown>) => {
  // Find the first string value in filters (handles q, name@ilike, title@ilike, etc.)
  const searchValue = Object.values(filters).find((v): v is string => typeof v === "string");
  if (!searchValue) return false;
  // Strip % wildcards from ILIKE patterns to get actual character count
  const realInput = searchValue.replace(/%/g, "");
  return realInput.length >= AUTOCOMPLETE_MIN_CHARS;
};

export const shouldRenderSuggestions = (val: string) =>
  val.trim().length >= AUTOCOMPLETE_MIN_CHARS;

// Usage - both props for complete optimization
<ReferenceInput
  source="customer_organization_id"
  reference="organizations"
  enableGetChoices={enableGetChoices}  // Blocks API call
>
  <AutocompleteInput
    shouldRenderSuggestions={shouldRenderSuggestions}  // Hides dropdown
    debounce={AUTOCOMPLETE_DEBOUNCE_MS}
    ...
  />
</ReferenceInput>
```

**Key points:**
- `useMemo` on filter objects prevents React Admin from refetching on every render
- `useWatch()` for isolated re-renders when watching parent field values (not `watch()`)
- `enableGetChoices` on ReferenceInput blocks API calls until threshold met
- `shouldRenderSuggestions` on AutocompleteInput hides dropdown until threshold met
- 300ms debounce balances responsiveness with API efficiency
- 2-character minimum prevents overly broad result sets

**Anti-pattern:**

```tsx
// BAD: Inline filter object creates new reference every render
<ReferenceArrayInput
  source="contact_ids"
  reference="contacts"
  filter={{ organization_id: customerOrganizationId }}  // New object each render!
>

// GOOD: Memoized filter maintains stable reference
const contactFilter = useMemo(
  () => ({ organization_id: customerOrganizationId }),
  [customerOrganizationId]
);
<ReferenceArrayInput filter={contactFilter}>
```

---

## Pattern C: Collapsible Single-Page Form

Single-page form with collapsible sections, progress tracking, and similar opportunity detection. Replaces the previous multi-step wizard with a more efficient UX that shows all context at once.

**When to use:** Complex forms where users benefit from seeing all sections at once while still having organized groupings.

```tsx
// src/atomic-crm/opportunities/OpportunityCreate.tsx
import { useMemo } from "react";
import { CreateBase, Form, Loading, useGetIdentity } from "ra-core";
import { FormProgressProvider, FormProgressBar } from "@/components/ra-wrappers/form";
import { OpportunityInputs } from "./OpportunityInputs";
import { opportunitySchema } from "../validation/opportunities";
import { useSimilarOpportunityCheck } from "./useSimilarOpportunityCheck";

const OpportunityCreate = () => {
  const { data: identity, isLoading: identityLoading } = useGetIdentity();
  const [searchParams] = useSearchParams();
  const urlCustomerOrgId = searchParams.get("customer_organization_id");

  // Fuzzy match warning system (server-side pg_trgm similarity via RPC)
  const {
    checkForSimilar, showDialog, closeDialog, confirmCreate,
    proposedName, similarOpportunities, hasConfirmed, resetConfirmation,
  } = useSimilarOpportunityCheck();

  // CRITICAL: Memoize formDefaults to prevent React Admin's Form from resetting
  // Per Constitution #5: FORM STATE DERIVED FROM TRUTH
  const formDefaults = useMemo(
    () => ({
      ...opportunitySchema.partial().parse({}),
      opportunity_owner_id: identity?.id,
      account_manager_id: identity?.id,
      contact_ids: [], // Explicitly initialize for ReferenceArrayInput
      products_to_sync: [], // Explicitly initialize for ArrayInput
      // URL param pre-fill: customer org from Organization slideover context
      ...(urlCustomerOrgId && { customer_organization_id: Number(urlCustomerOrgId) }),
    }),
    [identity?.id, urlCustomerOrgId]
  );

  // Guard: Wait for identity to prevent RLS policy failures
  if (identityLoading || !identity?.id) return <Loading />;

  return (
    <CreateBase redirect={redirect}>
      <FormProgressProvider initialProgress={10}>
        <FormProgressBar className="mb-6" />
        <Form defaultValues={formDefaults}>
          <OpportunityFormContent
            checkForSimilar={checkForSimilar}
            hasConfirmed={hasConfirmed}
            resetConfirmation={resetConfirmation}
          />
        </Form>
      </FormProgressProvider>
      <SimilarOpportunitiesDialog {...dialogProps} />
    </CreateBase>
  );
};
```

### Collapsible Form Structure

```tsx
// src/atomic-crm/opportunities/OpportunityCompactForm.tsx
import {
  CompactFormRow,
  CollapsibleSection,
  FormSectionWithProgress,
} from "@/components/ra-wrappers/form";

export const OpportunityCompactForm = ({ mode = "create" }) => {
  // useWatch for isolated re-renders (Constitution #5)
  const customerOrganizationId = useWatch({ name: "customer_organization_id" });
  const principalOrganizationId = useWatch({ name: "principal_organization_id" });

  // Memoized filters prevent infinite refetch loops
  const contactFilter = useMemo(
    () => (customerOrganizationId ? { organization_id: customerOrganizationId } : {}),
    [customerOrganizationId]
  );

  return (
    <div className="space-y-6">
      {/* Required sections - always visible with progress tracking */}
      <FormSectionWithProgress
        id="opportunity-details"
        title="Opportunity Details"
        requiredFields={["name", "customer_organization_id", "principal_organization_id"]}
      >
        <TextInput source="name" label="Opportunity Name *" />
        <CompactFormRow>
          <ReferenceInput source="customer_organization_id" reference="organizations" />
          <ReferenceInput source="principal_organization_id" reference="organizations" />
        </CompactFormRow>
      </FormSectionWithProgress>

      <FormSectionWithProgress
        id="pipeline-section"
        title="Pipeline"
        requiredFields={["stage", "priority", "estimated_close_date"]}
      >
        {/* Stage, Priority, Close Date, Account Manager, Distributor */}
      </FormSectionWithProgress>

      {/* Collapsible optional sections */}
      <CollapsibleSection title="Contacts & Products" defaultOpen>
        {/* Dependent inputs that filter based on customer/principal */}
      </CollapsibleSection>

      <CollapsibleSection title="Classification">
        {/* Lead Source, Campaign, Tags */}
      </CollapsibleSection>

      <CollapsibleSection title="Additional Details">
        {/* Description, Next Action, Decision Criteria, Notes */}
      </CollapsibleSection>
    </div>
  );
};
```

### Similar Opportunity Detection

```tsx
// src/atomic-crm/opportunities/useSimilarOpportunityCheck.ts
// Prevents duplicate opportunities via server-side pg_trgm similarity matching
// Uses RPC call to `check_similar_opportunities` (threshold: 0.3)

export const useSimilarOpportunityCheck = (options?) => {
  const dataProvider = useDataProvider() as ExtendedDataProvider;
  const [showDialog, setShowDialog] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const { mutateAsync: checkSimilarityRpc } = useMutation({
    mutationFn: async (name: string) =>
      dataProvider.rpc("check_similar_opportunities", {
        p_name: name, p_threshold: 0.3, p_exclude_id: options?.excludeId ?? null, p_limit: 10,
      }),
  });

  const checkForSimilar = async (name: string): Promise<SimilarityCheckResult> => {
    if (hasConfirmed || !name?.trim()) return { hasSimilar: false, matches: [] };
    const results = await checkSimilarityRpc(name);
    const matches = results.map(r => ({
      id: r.id, name: r.name, stage: r.stage,
      distance: mapSimilarityToDistance(r.similarity_score),
    }));
    if (matches.length > 0) { setShowDialog(true); }
    return { hasSimilar: matches.length > 0, matches };
  };

  return { checkForSimilar, showDialog, closeDialog, confirmCreate, hasConfirmed, resetConfirmation };
};
```

**Key points:**
- **Single-page layout** shows all context at once (vs multi-step wizard)
- `FormSectionWithProgress` tracks required field completion visually
- `CollapsibleSection` organizes optional fields into expandable groups
- `CompactFormRow` enables 2-3 column layouts within sections
- `useWatch()` for isolated re-renders (not `watch()` - Constitution #5)
- **Similar opportunity detection** prevents duplicates via server-side `pg_trgm` similarity (RPC `check_similar_opportunities`)
- **URL param pre-fill** enables context-aware creation from other views
- Form mode `onSubmit` for validation (not `onChange` to avoid re-render storms)
- Wait for identity to load to prevent RLS policy failures

---

## Pattern D: Quick Add Dialog

Trade show mode for 30-second data entry with "Save & Add Another" pattern.

**When to use:** High-frequency data entry scenarios (trade shows, batch imports).

```tsx
// src/atomic-crm/opportunities/QuickAddDialog.tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { QuickAddForm } from "./QuickAddForm";

export const QuickAddDialog = ({ open, onOpenChange }: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Quick Add Opportunity</DialogTitle>
        <DialogDescription>
          Create a new opportunity with optional contact details
        </DialogDescription>
      </DialogHeader>
      <QuickAddForm onSuccess={() => onOpenChange(false)} />
    </DialogContent>
  </Dialog>
);
```

```tsx
// src/atomic-crm/opportunities/QuickAddForm.tsx
// Architecture: Wrapper (Form context) + Content (form logic with useFormContext)
// Uses React Admin Form with createFormResolver (CORE-018)

export const QuickAddForm = ({ onSuccess }: Props) => {
  const { data: identity, isLoading: identityLoading } = useGetIdentity();

  const schemaDefaults = quickAddBaseSchema.partial().parse({});

  // Merge with localStorage for persistence between sessions
  const defaultValues = useMemo(() => ({
    ...schemaDefaults,
    campaign: getStorageItem<string>("last_campaign", { type: "local" }) || undefined,
    principal_id: Number(getStorageItem<string>("last_principal", { type: "local" }) ?? "") || undefined,
    account_manager_id: identity?.id ? Number(identity.id) : undefined,
    product_ids: schemaDefaults.product_ids ?? [],
  }), [identity?.id, schemaDefaults]);

  if (identityLoading || !identity?.id) return <LoadingSkeleton />;

  // React Admin Form provides FormProvider context
  // mode="onBlur" per Engineering Constitution - no onChange validation
  return (
    <Form defaultValues={defaultValues} mode="onBlur" resolver={createFormResolver(quickAddSchema)}>
      <QuickAddFormContent onSuccess={onSuccess} identity={identity} />
    </Form>
  );
};

// Inner component consumes FormProvider context
const QuickAddFormContent = ({ onSuccess, identity }: ContentProps) => {
  const { mutate, isPending } = useQuickAdd();
  const { register, handleSubmit, setFocus, formState: { errors }, setValue, control, reset } =
    useFormContext<QuickAddFormValues>();

  const [organizationId, principalId, cityValue] = useWatch({
    control,
    name: ["organization_id", "principal_id", "city"],
  });

  const onSubmit = (data: QuickAddFormValues, closeAfter: boolean) => {
    mutate(data, {
      onSuccess: () => {
        if (closeAfter) {
          onSuccess();
        } else {
          reset({
            principal_id: data.principal_id,
            account_manager_id: data.account_manager_id,
            campaign: data.campaign || undefined,
            product_ids: [], organization_id: undefined, org_name: "",
            first_name: "", last_name: "", phone: "", email: "",
            city: "", state: "", quick_note: "",
          });
          setTimeout(() => setFocus("first_name"), 100);
        }
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <OpportunityDetailsSection ... />
      <ContactInformationSection ... />
      <LocationNotesSection ... />
      <QuickAddFormActions
        onCancel={onSuccess}
        onSaveAndAddAnother={handleSubmit((data) => onSubmit(data, false))}
        onSaveAndClose={handleSubmit((data) => onSubmit(data, true))}
        isPending={isPending}
      />
    </div>
  );
};
```

**Key points:**
- Uses React Admin `Form` with `createFormResolver(quickAddSchema)` (CORE-018 compliant, not direct `zodResolver`)
- Form split: `QuickAddForm` (wrapper with Form context) + `QuickAddFormContent` (inner with `useFormContext`)
- Section extraction: `OpportunityDetailsSection`, `ContactInformationSection`, `LocationNotesSection`, `QuickAddFormActions`
- Schema defaults as single source of truth, merged with localStorage
- `useWatch()` for isolated re-renders (NOT `watch()` which causes full form re-render)
- "Save & Add Another" resets form but preserves campaign/principal/account_manager context
- Focus management: auto-focus first name field after reset via `setFocus("first_name")`

**Enhanced implementation notes:**
- **useFilteredProducts hook:** Products are filtered by selected principal, with `isReady` flag to show placeholder until principal selected
- **WCAG accessibility patterns:**
  - Local `AccessibleField` wrapper component provides WCAG 4.1.2/4.1.3 compliance (aria-invalid, aria-describedby, aria-required)
  - Error messages use `role="alert"` for screen reader announcements
  - `onValidationError` callback focuses first error field on validation failure (WCAG 3.3.1)
  - Conditional hint text with `aria-live="polite"` for phone/email requirement
- **Dependent field clearing:** `useEffect` clears phone validation error when either phone or email is populated

**See also:** `QuickAddForm.tsx` for the complete implementation with all accessibility patterns.

---

## Pattern E: Kanban DnD

@dnd-kit with custom collision detection, optimistic UI, and rollback on error.

**When to use:** Kanban boards with drag-and-drop stage transitions.

```tsx
// src/atomic-crm/opportunities/kanban/OpportunityListContent.tsx
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";

// Custom collision detection prioritizes pointer position
const customCollisionDetection: CollisionDetection = (args) => {
  // First: pointer is directly within a droppable
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;

  // Fallback: rectangle intersection (more tolerant)
  const rectCollisions = rectIntersection(args);
  if (rectCollisions.length > 0) return rectCollisions;

  // Final fallback: closestCorners (keyboard navigation)
  return closestCorners(args);
};

export const OpportunityListContent = ({ openSlideOver }) => {
  const { data: opportunities } = useListContext<Opportunity>();
  const [update] = useUpdate();
  const notify = useNotify();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [opportunitiesByStage, setOpportunitiesByStage] = useState<OpportunitiesByStage>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    // ... find source/dest stages ...

    // Store previous state for rollback
    const previousState = opportunitiesByStage;

    // --- Optimistic UI Update ---
    const newOpportunitiesByStage = { ...previousState };
    // Remove from source, add to destination
    setOpportunitiesByStage(newOpportunitiesByStage);

    // --- API Call with rollback on error ---
    update(
      "opportunities",
      { id: draggableId, data: { stage: destColId } },
      {
        onSuccess: () => notify(`Moved to ${stageName}`, { type: "success" }),
        onError: () => {
          notify("Error: Could not move opportunity. Reverting.", { type: "warning" });
          setOpportunitiesByStage(previousState); // ROLLBACK
        },
      }
    );
  }, [opportunitiesByStage, update, notify]);

  // Accessibility announcements
  const announcements = {
    onDragStart: ({ active }) => `Picked up ${oppName}. Currently in ${stageName} stage.`,
    onDragOver: ({ over }) => over ? `Moving to ${stageName} stage.` : `No longer over droppable.`,
    onDragEnd: ({ over }) => over ? `Dropped in ${stageName} stage.` : `Drag cancelled.`,
    onDragCancel: () => `Dragging was cancelled.`,
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragEnd={handleDragEnd}
      accessibility={{ announcements }}
    >
      <div className="flex gap-3 overflow-x-auto" role="region" aria-label="Pipeline board">
        {visibleStages.map((stage) => (
          <OpportunityColumn key={stage.value} stage={stage.value} />
        ))}
      </div>
      <DragOverlay>
        {activeId && <OpportunityCard opportunity={activeOpportunity} isDragOverlay />}
      </DragOverlay>
    </DndContext>
  );
};
```

```tsx
// src/atomic-crm/opportunities/kanban/OpportunityCard.tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const OpportunityCard = React.memo(function OpportunityCard({
  openSlideOver,
  opportunity,
  isDragOverlay = false,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: String(opportunity?.id ?? 'placeholder'),
    disabled: isDragOverlay || !opportunity,
  });

  const style: React.CSSProperties = isDragOverlay
    ? {}
    : { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      style={style}
      className={isDragging ? "opacity-50" : "opacity-100"}
    >
      {/* Drag handle - 44px touch target */}
      <div
        {...attributes}
        {...listeners}
        data-drag-handle
        className="min-h-[44px] min-w-[44px] cursor-grab active:cursor-grabbing"
      >
        <GripVertical />
      </div>
      {/* Card content */}
    </div>
  );
});
```

**Key points:**
- Custom collision detection: `pointerWithin` > `rectIntersection` > `closestCorners` (column-prioritized)
- Optimistic UI: Update state immediately, rollback on API error
- `React.memo` on cards for performance
- 44px touch targets for drag handles
- Accessibility announcements for screen readers
- `useSensor` with `distance: 8` to prevent accidental drags on click

**Close stage intercept:**
- `CloseOpportunityModal` shown when dragging to `closed_won` or `closed_lost`
- Collects win/loss reason before completing the stage transition
- `validateCloseOpportunity` guard enforces required close data (from `@/atomic-crm/validation/opportunities`)
- Cancel reverts the optimistic UI update to the previous state

**Targeted query key invalidation:**
- On successful stage change, invalidates `activityKeys.lists()`, `opportunityKeys.lists()`, and `entityTimelineKeys.lists()`
- Uses query key factories from `@/atomic-crm/queryKeys` (not nuclear invalidation per STALE-008)

**Optimistic list operations:**
- `handleDeleteOpportunity`: Removes opportunity from local state immediately, closes slide-over if viewing the deleted record
- `handleOpportunityCreated`: Inserts new opportunity at the start of its stage array for instant visibility
- Both operations trigger `refresh()` to eventually sync with server data

---

## Pattern F: Slide-Over Detail Panel

40vw right panel with tabbed interface and URL-based state (`?view=123`).

**When to use:** Viewing/editing record details without leaving the list page.

```tsx
// src/atomic-crm/opportunities/OpportunitySlideOver.tsx
import { ResourceSlideOver, type TabConfig } from "@/components/layouts/ResourceSlideOver";
import { OpportunitySlideOverDetailsTab } from "./slideOverTabs/OpportunitySlideOverDetailsTab";
import { OpportunityContactsTab } from "./slideOverTabs/OpportunityContactsTab";

export function OpportunitySlideOver({
  recordId,
  isOpen,
  onClose,
  mode,
  onModeToggle,
}: Props) {
  const { isManagerOrAdmin } = useUserRole();
  const { data: identity } = useGetIdentity();
  const { data: record } = useGetOne<Opportunity>("opportunities", { id: recordId! });

  // Permission check: owner, account manager, or admin
  const canEdit = isManagerOrAdmin ||
    (currentSalesId != null &&
      (Number(record.opportunity_owner_id) === Number(currentSalesId) ||
       Number(record.account_manager_id) === Number(currentSalesId)));

  const tabs: TabConfig[] = [
    { key: "details", label: "Details", component: OpportunitySlideOverDetailsTab, icon: TargetIcon },
    { key: "contacts", label: "Contacts", component: OpportunityContactsTab, icon: Users },
    { key: "products", label: "Products", component: OpportunityProductsTab, icon: Package },
    { key: "notes", label: "Notes", component: OpportunityNotesTab, icon: StickyNote },
  ];

  return (
    <ResourceSlideOver
      resource="opportunities"
      recordId={recordId}
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      onModeToggle={onModeToggle}
      canEdit={canEdit}
      tabs={tabs}
      recordRepresentation={(record) => record.name || `Opportunity #${record.id}`}
      headerActions={(record) => (
        <>
          <FavoriteToggleButton
            entityType="opportunities"
            entityId={Number(record.id)}
            displayName={record.name || `Opportunity #${record.id}`}
          />
          <QuickAddTaskButton opportunityId={Number(record.id)} />
        </>
      )}
    />
  );
}
```

```tsx
// src/hooks/useSlideOverState.ts
export function useSlideOverState(): UseSlideOverStateReturn {
  const [slideOverId, setSlideOverId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">("view");

  // Parse URL params on initial load (deep linking)
  useEffect(() => {
    const params = getHashParams(); // For hash-based routing
    const viewId = params.get("view");
    const editId = params.get("edit");
    if (viewId) { setSlideOverId(Number(viewId)); setMode("view"); setIsOpen(true); }
    else if (editId) { setSlideOverId(Number(editId)); setMode("edit"); setIsOpen(true); }
  }, []);

  const openSlideOver = (id: number, initialMode: "view" | "edit" = "view") => {
    setSlideOverId(id);
    setMode(initialMode);
    setIsOpen(true);
    // Update URL for deep linking
    const params = getHashParams();
    params.delete("view"); params.delete("edit");
    params.set(initialMode, String(id));
    window.history.pushState(null, "", setHashParams(params));
  };

  const closeSlideOver = useCallback(() => {
    setIsOpen(false);
    setSlideOverId(null);
    // Remove slide-over params from URL
    const params = getHashParams();
    params.delete("view"); params.delete("edit");
    window.history.pushState(null, "", setHashParams(params));
  }, []);

  return { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode };
}
```

**Key points:**
- URL state: `?view=123` or `?edit=123` enables deep linking and browser back/forward
- Hash-based routing support for React Admin compatibility
- Permission-based `canEdit` prop controls edit button visibility
- Tab configuration with icons and count badges
- `headerActions` prop for custom action buttons: `FavoriteToggleButton` and `QuickAddTaskButton`
- `useRecentSearches` hook tracks viewed records for recent search suggestions
- Escape key closes slide-over (handled by hook)

---

## Pattern G: Grouped List Views

Opportunities grouped by principal/campaign with status priority sorting (red first).

**When to use:** Answering questions like "What is the ONE thing I need to do this week for each principal?"

```tsx
// src/atomic-crm/opportunities/PrincipalGroupedList.tsx
import { useListContext } from "ra-core";
import { getStageStatus, type StageStatus, STAGE_ORDER, STAGE } from "./constants";
import { parseDateSafely } from "@/lib/date-utils";

// Status priority for sorting (red first)
function getStatusPriority(status: StageStatus): number {
  switch (status) {
    case "rotting": return 0;
    case "expired": return 1;
    case "warning": return 2;
    case "healthy": return 3;
    case "closed": return 4;
  }
}

// STAGE_ORDER imported from ./constants:
// { new_lead: 0, initial_outreach: 1, sample_visit_offered: 2,
//   feedback_logged: 3, demo_scheduled: 4, closed_won: 5, closed_lost: 6 }

// Sort: Red status first -> Earlier stages -> Most days since activity
function sortOpportunities(opportunities: Opportunity[]): Opportunity[] {
  return opportunities.toSorted((a, b) => {
    const aDate = a.estimated_close_date ? parseDateSafely(a.estimated_close_date) : null;
    const bDate = b.estimated_close_date ? parseDateSafely(b.estimated_close_date) : null;
    const aStatus = getStageStatus(a.stage || "", a.days_in_stage || 0, aDate);
    const bStatus = getStageStatus(b.stage || "", b.days_in_stage || 0, bDate);

    // Primary: Status priority (red first)
    const statusDiff = getStatusPriority(aStatus) - getStatusPriority(bStatus);
    if (statusDiff !== 0) return statusDiff;

    // Secondary: Stage order (earlier stages first for active)
    const aOrder = STAGE_ORDER[a.stage || ""] ?? 99;
    const bOrder = STAGE_ORDER[b.stage || ""] ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;

    // Tertiary: Days since last activity (most days first)
    return (b.days_since_last_activity ?? 0) - (a.days_since_last_activity ?? 0);
  });
}

export const PrincipalGroupedList = ({ openSlideOver }) => {
  const { data: opportunities } = useListContext<Opportunity>();

  // Group opportunities by principal
  const groupedData = useMemo(() => {
    if (!opportunities) return {};
    const groups: Record<string, Opportunity[]> = {};
    opportunities.forEach((opp) => {
      const key = opp.principal_organization_name || "No Principal";
      if (!groups[key]) groups[key] = [];
      groups[key].push(opp);
    });
    // Sort within each group
    Object.keys(groups).forEach((key) => {
      groups[key] = sortOpportunities(groups[key]);
    });
    return groups;
  }, [opportunities]);

  return (
    <div className="flex gap-3 overflow-x-auto" role="region" aria-label="By principal">
      {Object.keys(groupedData).toSorted().map((principalName) => (
        <PrincipalColumn
          key={principalName}
          principalName={principalName}
          opportunities={groupedData[principalName].filter(o => !o.stage.startsWith("closed"))}
          metrics={calculateMetrics(groupedData[principalName])}
          openSlideOver={openSlideOver}
        />
      ))}
    </div>
  );
};

const PrincipalColumn = ({ principalName, opportunities, metrics, openSlideOver }) => (
  <div className="flex flex-col bg-card rounded-lg min-w-[280px] max-w-[320px]">
    <div className="p-3 border-b">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold truncate">{principalName}</h3>
        <Badge variant="secondary">{metrics.activeCount}</Badge>
      </div>
      {/* Win rate metric */}
      <div className="text-xs text-muted-foreground">
        {metrics.winRate}% win rate ({metrics.closedWon}W / {metrics.closedLost}L)
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {opportunities.map((opp) => (
        <PrincipalOpportunityCard key={opp.id} opportunity={opp} openSlideOver={openSlideOver} />
      ))}
    </div>
  </div>
);
```

**Key points:**
- Status-based sorting surfaces urgent items first (rotting > expired > warning > healthy)
- Stage order secondary sort shows pipeline progression
- Days since activity tertiary sort identifies neglected opportunities
- Column headers show count and win rate metrics
- Only active (non-closed) opportunities shown in columns
- Principal color stripe via CSS custom properties (`--principal-{slug}`)

---

## Pattern I: Column Preferences Hook

Persisted column collapsed/visible state with Zod validation of localStorage.

**When to use:** Kanban boards where users customize column visibility and collapsed state.

```tsx
// src/atomic-crm/opportunities/useColumnPreferences.ts
import { useState, useEffect } from "react";
import { z } from "zod";
import { getStorageItem, setStorageItem } from "../../utils/secureStorage";

const COLLAPSED_KEY = "opportunity.kanban.collapsed_stages";
const VISIBLE_KEY = "opportunity.kanban.visible_stages";

// Schema for validating stored stage preferences
const opportunityStageArraySchema = z.array(
  z.enum([
    "new_lead", "initial_outreach", "sample_visit_offered",
    "feedback_logged", "demo_scheduled", "closed_won", "closed_lost",
  ])
);

export function useColumnPreferences() {
  const allStages = OPPORTUNITY_STAGES.map((s) => s.value);

  // Initialize from localStorage with Zod validation
  const [collapsedStages, setCollapsedStages] = useState<OpportunityStageValue[]>(() => {
    return getStorageItem<OpportunityStageValue[]>(COLLAPSED_KEY, {
      type: "local",
      schema: opportunityStageArraySchema,
    }) ?? [];
  });

  const [visibleStages, setVisibleStages] = useState<OpportunityStageValue[]>(() => {
    return getStorageItem<OpportunityStageValue[]>(VISIBLE_KEY, {
      type: "local",
      schema: opportunityStageArraySchema,
    }) ?? allStages;
  });

  // Persist to localStorage on change
  useEffect(() => {
    setStorageItem(COLLAPSED_KEY, collapsedStages, { type: "local" });
  }, [collapsedStages]);

  useEffect(() => {
    setStorageItem(VISIBLE_KEY, visibleStages, { type: "local" });
  }, [visibleStages]);

  const toggleCollapse = (stage: OpportunityStageValue) => {
    setCollapsedStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    );
  };

  const toggleVisibility = (stage: OpportunityStageValue) => {
    setVisibleStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage]
    );
  };

  // Reset corrupted localStorage state
  const resetPreferences = () => {
    setCollapsedStages([]);
    setVisibleStages(allStages);
  };

  return {
    collapsedStages,
    visibleStages,
    toggleCollapse,
    toggleVisibility,
    collapseAll: () => setCollapsedStages(allStages),
    expandAll: () => setCollapsedStages([]),
    resetPreferences,
  };
}
```

**Key points:**
- Zod schema validates localStorage data (prevents invalid stage values)
- `getStorageItem` with schema option returns null if validation fails
- `resetPreferences` fixes corrupted state that may hide columns
- Two independent preferences: collapsed (minimized height) vs visible (hidden entirely)
- Default: all stages visible, none collapsed

---

## Pattern Comparison Tables

### Create Flows

| Aspect | Pattern C (Collapsible Single-Page Form) | Pattern D (Quick Add) |
|--------|-------------------------------------------|----------------------|
| **Entry Point** | Full page | Dialog modal |
| **Time to complete** | 2-5 minutes | 30 seconds |
| **Fields** | All fields (collapsible sections) | Essential fields only |
| **Use case** | Complete opportunity creation | Trade show lead capture |
| **Form library** | React Admin Form | React Admin Form |
| **Validation** | All at once (onSubmit) | All at once (onBlur) |
| **Context persistence** | URL param pre-fill | Campaign/Principal saved |

### View Modes

| Aspect | Kanban (Pattern E) | List | Principal (Pattern G) | Campaign |
|--------|-------------------|------|----------------------|----------|
| **Primary grouping** | Stage | None | Principal org | Campaign |
| **Card layout** | Columns | Rows | Columns | Columns |
| **Drag-and-drop** | Yes | No | No | No |
| **Sorting** | Manual + computed | Table columns | Status priority | Status priority |
| **Best for** | Stage management | Bulk selection | Principal review | Campaign review |

### Detail Views

| Aspect | Slide-Over (Pattern F) | Edit Page |
|--------|----------------------|-----------|
| **Navigation** | Stay on list | Leave list |
| **URL** | `?view=123` | `/opportunities/123` |
| **Width** | 40vw | Full page |
| **Context** | List visible behind | List hidden |
| **Edit mode** | Toggle in panel | Separate route |

---

## Anti-Patterns to Avoid

### 1. Form Defaults Without Memoization

```tsx
// BAD: Creates new object on every render, triggers form reset
<Form defaultValues={{ ...schema.parse({}), owner_id: identity?.id }}>

// GOOD: Memoize to prevent reset
const defaults = useMemo(() => ({
  ...schema.parse({}),
  owner_id: identity?.id,
}), [identity?.id]);
<Form defaultValues={defaults}>
```

### 2. Using watch() Instead of useWatch()

```tsx
// BAD: watch() causes full form re-render on any change
const allValues = watch();

// GOOD: useWatch() isolates re-renders to specific fields
const [principalId, customerId] = useWatch({ control, name: ["principal_id", "customer_id"] });
```

### 3. Missing Optimistic UI Rollback

```tsx
// BAD: No rollback on error
setOpportunities(newState);
update("opportunities", { data }, { onError: () => notify("Error") });

// GOOD: Store previous state and rollback
const previousState = opportunities;
setOpportunities(newState);
update("opportunities", { data }, {
  onError: () => {
    setOpportunities(previousState); // Rollback
    notify("Error");
  }
});
```

### 4. Inline Array Literals in useEffect Dependencies

```tsx
// BAD: Array literal creates new reference every render
const tabs = [{ key: "details", ... }, { key: "notes", ... }];
useEffect(() => { setActiveTab(tabs[0].key); }, [tabs]); // Infinite loop!

// GOOD: Depend on primitive value
const firstTabKey = tabs[0]?.key;
useEffect(() => { setActiveTab(firstTabKey); }, [firstTabKey]);
```

### 5. Direct localStorage Access Without Validation

```tsx
// BAD: Trusting localStorage blindly
const stages = JSON.parse(localStorage.getItem("stages")) as string[];

// GOOD: Validate with Zod schema
const stages = getStorageItem<string[]>("stages", {
  type: "local",
  schema: stageArraySchema,
}) ?? defaultStages;
```

---

## Migration Checklist

When adding a new view mode:

1. [ ] Add type to `OpportunityView` union
2. [ ] Add toggle button to `OpportunityViewSwitcher`
3. [ ] Add case to view router in `OpportunityListViews` (inside `UnifiedListPageLayout`)
4. [ ] Update localStorage validation in `getViewPreference`
5. [ ] Add empty state handling
6. [ ] Add loading skeleton
7. [ ] Test slide-over integration (`openSlideOver` prop)

When adding a new collapsible form section:

1. [ ] Add `FormSectionWithProgress` or `CollapsibleSection` in `OpportunityCompactForm.tsx`
2. [ ] Add required field names to the section's `requiredFields` array (if using `FormSectionWithProgress`)
3. [ ] Update progress tracking if applicable
4. [ ] Test section collapse/expand behavior
5. [ ] Verify form validation includes the new fields

When adding a new slide-over tab:

1. [ ] Create tab component in `slideOverTabs/`
2. [ ] Implement `TabComponentProps` interface
3. [ ] Add tab config to `tabs` array in `OpportunitySlideOver`
4. [ ] Handle view/edit mode rendering
5. [ ] Implement `onDirtyChange` for unsaved changes warning
6. [ ] Test tab switching and data persistence
