# Feature Slices

> Comprehensive documentation of Crispy CRM's vertical slice architecture pattern.

## Pattern Definition

### What is a Feature Slice?

A Feature Slice is a vertical cut through the application containing everything needed to implement one domain feature. Instead of organizing by technical layer (all components together, all hooks together), code is organized by feature (all contact-related code together).

```
Traditional Layers:          Feature Slices:
src/                         src/atomic-crm/
  components/                  contacts/
    ContactList.tsx              ContactList.tsx
    OppList.tsx                  ContactCreate.tsx
    OrgList.tsx                  ContactSlideOver.tsx
  hooks/                         components/
    useContact.ts                hooks/
    useOpp.ts                  opportunities/
    useOrg.ts                    OpportunityList.tsx
  services/                      components/
    contactService.ts            hooks/
    oppService.ts              [shared infrastructure]
```

### Why Feature Slices for a CRM?

| Benefit | Explanation |
|---------|-------------|
| **Co-location** | Everything about "contacts" in one folder - reduces cognitive load |
| **Independence** | Change contacts without touching opportunities |
| **Onboarding** | New developers find everything in one place |
| **Scaling** | Add features without reorganizing existing code |
| **Testing** | Test features in isolation |
| **Ownership** | Clear boundaries for team assignment |

### Trade-offs

| Benefit | Cost |
|---------|------|
| Easy to find feature code | Some duplication of patterns |
| Features evolve independently | Must actively prevent cross-feature coupling |
| Clear ownership | Shared utilities need explicit extraction |
| Self-contained changes | Refactoring shared code affects multiple features |

### When to Create a New Feature Slice

**Create a new feature slice when:**
- It represents a distinct domain entity (contacts, products, activities)
- It has its own CRUD operations
- It will have its own list/detail views
- It has unique business rules
- It maps to a database table with RLS policies

**Do NOT create a new feature for:**
- Utility components (put in `shared/` or `components/`)
- Cross-cutting concerns (put in `hooks/` or `contexts/`)
- Sub-entities always accessed via parent (nest within parent feature)
- Configuration/settings pages (put in `settings/`)

---

## Standard Slice Template

### Canonical Structure

```
src/atomic-crm/[feature]/
  index.tsx                    # Public exports (REQUIRED)
  resource.tsx                 # React Admin resource config (REQUIRED)
  [Feature]List.tsx            # List view (REQUIRED)
  [Feature]Create.tsx          # Create form (REQUIRED if creatable)
  [Feature]Edit.tsx            # Edit form (OPTIONAL - often same as Create)
  [Feature]Show.tsx            # Read-only detail view (OPTIONAL)
  [Feature]SlideOver.tsx       # Detail panel (REQUIRED for list views)
  [Feature]Empty.tsx           # Empty state (RECOMMENDED)
  [Feature]ListFilter.tsx      # Filter controls (OPTIONAL)
  [Feature]Inputs.tsx          # Shared form inputs (RECOMMENDED)
  PATTERNS.md                  # Feature-specific patterns doc (RECOMMENDED)
  constants.ts                 # Feature constants (OPTIONAL)
  [feature]FilterConfig.ts     # Filter configuration (OPTIONAL)
  components/                  # Feature-specific components (OPTIONAL)
    [Feature]Card.tsx
    [Feature]Badge.tsx
    [Feature]Avatar.tsx
  slideOverTabs/               # SlideOver tab components (OPTIONAL)
    [Feature]DetailsTab.tsx
    [Feature]NotesTab.tsx
    [Feature]ContactsTab.tsx
  hooks/                       # Feature-specific hooks (OPTIONAL)
    use[Feature]Action.ts
  utils/                       # Feature-specific utilities (OPTIONAL)
    formatters.ts
  __tests__/                   # Unit and integration tests (RECOMMENDED)
    [Feature]List.test.tsx
    [Feature]Create.test.tsx
```

### Required vs Optional Files

| File/Directory | Required? | When to Include |
|----------------|-----------|-----------------|
| `index.tsx` | Yes | Always - defines public API |
| `resource.tsx` | Yes | Always - React Admin config |
| `[Feature]List.tsx` | Yes | Always - main view |
| `[Feature]SlideOver.tsx` | Yes | Always for CRUD features |
| `[Feature]Create.tsx` | If creatable | Most features |
| `[Feature]Edit.tsx` | If different from Create | Rare - usually reuse Create |
| `[Feature]Show.tsx` | If read-only view needed | Some features |
| `[Feature]Empty.tsx` | Recommended | Better UX for empty states |
| `[Feature]Inputs.tsx` | Recommended | Reuse between Create/Edit |
| `[Feature]ListFilter.tsx` | If filterable | Most list views |
| `PATTERNS.md` | Recommended | Document feature-specific patterns |
| `components/` | If >2 feature components | Medium+ complexity features |
| `slideOverTabs/` | If SlideOver has tabs | Most CRUD features |
| `hooks/` | If feature-specific logic | Complex features |
| `utils/` | If feature-specific formatting | As needed |
| `__tests__/` | Recommended | All features should have tests |

---

## Complete Feature Inventory

### Feature Summary

| Feature | Path | Files | Complexity | Has Hooks? | Has Utils? | Type |
|---------|------|-------|------------|------------|------------|------|
| contacts | `src/atomic-crm/contacts/` | 72 | Complex | Yes (import) | Yes | CRUD Entity |
| opportunities | `src/atomic-crm/opportunities/` | 139 | Complex | Yes | Yes | CRUD Entity |
| organizations | `src/atomic-crm/organizations/` | 74 | Complex | Yes | No | CRUD Entity |
| tasks | `src/atomic-crm/tasks/` | 27 | Medium | No | No | CRUD Entity |
| activities | `src/atomic-crm/activities/` | 19 | Simple | No | No | CRUD Entity |
| tags | `src/atomic-crm/tags/` | 12 | Simple | No | No | CRUD Entity |
| sales | `src/atomic-crm/sales/` | 17 | Medium | No | No | CRUD Entity |
| productDistributors | `src/atomic-crm/productDistributors/` | 8 | Simple | No | No | CRUD Entity |
| notifications | `src/atomic-crm/notifications/` | 3 | Simple | No | No | CRUD Entity |
| dashboard | `src/atomic-crm/dashboard/` | 64 | Complex | Yes | Yes | Special View |
| reports | `src/atomic-crm/reports/` | 45 | Complex | Yes | Yes | Special View |
| settings | `src/atomic-crm/settings/` | 13 | Medium | Yes | No | Special View |
| tutorial | `src/atomic-crm/tutorial/` | 21 | Medium | Yes | No | Cross-cutting |
| login | `src/atomic-crm/login/` | 3 | Simple | No | No | Auth |

**Totals:**
- **CRUD Entity Features**: 9
- **Special View Features**: 3
- **Cross-cutting Features**: 2
- **Total Feature Files**: 517
- **Infrastructure Files**: 146 (components, hooks, utils, providers, contexts, layout, shared)

### Infrastructure Directories (Not Features)

| Directory | Files | Purpose |
|-----------|-------|---------|
| `components/` | 7 | Shared CRM-specific components |
| `hooks/` | 12 | Shared hooks (useSlideOverState, etc.) |
| `utils/` | 30 | Shared utilities and formatters |
| `providers/` | 83 | Data providers and Supabase handlers |
| `contexts/` | 8 | React contexts (auth, preferences) |
| `layout/` | 5 | Layout components (TopToolbar, etc.) |
| `shared/` | 1 | Shared component exports |

---

## Feature Deep Dives

### contacts/ (Complex - 72 files)

**Key Files:**
```
contacts/
  index.tsx                     # Exports + resource config
  resource.tsx                  # React Admin resource definition
  ContactList.tsx               # Main list with PremiumDatagrid
  ContactCreate.tsx             # Create form with SimpleForm
  ContactEdit.tsx               # Edit form (reuses ContactInputs)
  ContactShow.tsx               # Read-only view
  ContactSlideOver.tsx          # 40vw right panel
  ContactEmpty.tsx              # Empty state illustration
  ContactListFilter.tsx         # Sidebar filters
  ContactInputs.tsx             # Shared form inputs
  ContactCompactForm.tsx        # Compact form layout
  formatters.ts                 # Phone/email formatting
  contactFilterConfig.ts        # Filter field configuration
  contactColumnConfig.ts        # Datagrid column config
  slideOverTabs/
    ContactDetailsTab.tsx       # Details tab content
    ContactNotesTab.tsx         # Notes tab with ReferenceManyField
  __tests__/                    # 11 test files
```

**Special Characteristics:**
- CSV import/export with column mapping
- Phone/email formatting utilities
- Avatar with initials fallback
- Badges for contact type (primary, billing, etc.)
- Hierarchy breadcrumb for organization context
- Quick create popover for inline creation

---

### opportunities/ (Most Complex - 139 files)

**Key Files:**
```
opportunities/
  index.tsx
  resource.tsx
  OpportunityList.tsx           # Multi-view: Kanban, List, Grouped
  OpportunityCreate.tsx         # Wizard-style create with deduplication
  OpportunityCreateWizard.tsx   # Step-by-step wizard
  OpportunityEdit.tsx
  OpportunitySlideOver.tsx
  OpportunityEmpty.tsx
  OpportunityListFilter.tsx
  OpportunityInputs.tsx
  OpportunityViewSwitcher.tsx   # Kanban/List/Grouped toggle
  kanban/
    OpportunityCard.tsx         # Kanban card component
    OpportunityColumn.tsx       # Kanban column
    OpportunityListContent.tsx  # Kanban board container
    QuickAddOpportunity.tsx     # Quick add in kanban
  quick-add/
    QuickAddButton.tsx          # FAB for quick add
    QuickAddDialog.tsx          # Modal dialog
    QuickAddForm.tsx            # Simplified form
  hooks/
    useQuickAdd.ts              # Quick add state management
    useStageMetrics.ts          # Stage statistics
    useColumnPreferences.ts     # Column visibility
    useSimilarOpportunityCheck.ts # Deduplication
  slideOverTabs/
    OpportunityDetailsTab.tsx
    OpportunityNotesTab.tsx
    OpportunityContactsTab.tsx
    OpportunityProductsTab.tsx
  components/
    SimilarOpportunitiesDialog.tsx
    CloseOpportunityModal.tsx
    NextTaskBadge.tsx
  constants/
    stages.ts                   # Pipeline stage definitions
    stageThresholds.ts          # Stage health thresholds
    filterPresets.ts            # Saved filter presets
  utils/
    generateOpportunityName.ts  # Auto-naming logic
    diffProducts.ts             # Product change detection
```

**Special Characteristics:**
- 4 different views: Kanban, Row List, Campaign-grouped, Principal-grouped
- View preference persisted to localStorage
- Levenshtein similarity check for deduplication
- Stage-based workflow with health indicators
- Product association with principal filtering
- Quick-add from multiple entry points

---

### organizations/ (Complex - 74 files)

**Key Files:**
```
organizations/
  index.tsx
  resource.tsx
  OrganizationList.tsx
  OrganizationCreate.tsx        # With duplicate check dialog
  OrganizationEdit.tsx
  OrganizationSlideOver.tsx
  OrganizationEmpty.tsx
  OrganizationListFilter.tsx
  OrganizationInputs.tsx
  OrganizationCompactForm.tsx
  OrganizationAvatar.tsx        # Logo/initials avatar
  OrganizationBadges.tsx        # Type, segment badges
  components/
    AuthorizationCard.tsx       # Distributor authorizations
    AddPrincipalDialog.tsx      # Authorization management
    ProductExceptionsSection.tsx
  slideOverTabs/
    OrganizationDetailsTab.tsx
    OrganizationContactsTab.tsx
    OrganizationOpportunitiesTab.tsx
    OrganizationNotesTab.tsx
  __tests__/                    # 8 test files
```

**Special Characteristics:**
- Organization type determines tabs (Distributor gets Authorizations tab)
- Parent/child hierarchy support
- Duplicate detection on create
- CSV import with column alias mapping
- Branch locations section
- Authorization management for distributors

---

### tasks/ (Medium - 27 files)

**Key Files:**
```
tasks/
  index.tsx
  resource.tsx
  TaskList.tsx
  TaskCreate.tsx
  TaskEdit.tsx
  TaskSlideOver.tsx
  TaskEmpty.tsx
  TaskListFilter.tsx
  TaskInputs.tsx
  TaskGeneralTab.tsx            # General info tab
  TaskDetailsTab.tsx            # Extended details
  TaskRelatedItemsTab.tsx       # Linked records
  TasksIterator.tsx             # List iterator component
  components/
    TaskActionMenu.tsx          # Quick actions dropdown
    TaskCompletionDialog.tsx    # Completion confirmation
  __tests__/                    # 4 test files
```

**Special Characteristics:**
- Inline completion checkbox in list
- Due date sorting (ascending by default)
- Related items linking (contacts, opportunities)
- Snooze functionality
- Task action menu with quick operations

---

### activities/ (Simple - 19 files)

**Key Files:**
```
activities/
  index.tsx
  resource.tsx
  ActivityList.tsx
  ActivityCreate.tsx
  ActivityEdit.tsx
  ActivitySinglePage.tsx        # Standalone activity page
  ActivityListFilter.tsx
  ActivityInputs.tsx
  QuickLogActivity.tsx          # Quick log button
  QuickLogActivityDialog.tsx    # Quick log modal
  activityDraftSchema.ts        # Draft validation
  components/
    ActivityTimelineEntry.tsx   # Timeline display
  __tests__/                    # 4 test files
```

**Special Characteristics:**
- Quick log from multiple entry points
- Timeline display format
- Activity type categorization
- Draft schema for partial saves

---

### dashboard/ (Complex - 64 files)

**Key Files:**
```
dashboard/
  index.ts
  RecentItemsWidget.tsx
  v3/
    PrincipalDashboardV3.tsx    # Main dashboard component
    DashboardErrorBoundary.tsx
    DashboardTutorial.tsx
    components/
      KPICard.tsx               # KPI display card
      KPISummaryRow.tsx         # KPI row layout
      PrincipalPipelineTable.tsx
      ActivityFeedPanel.tsx
      TasksKanbanPanel.tsx
      QuickLogForm.tsx
    hooks/
      useKPIMetrics.ts          # KPI calculations
      usePrincipalPipeline.ts   # Pipeline data
      useMyTasks.ts             # User's tasks
      useTeamActivities.ts      # Activity feed
    context/
      CurrentSaleContext.tsx    # Current user context
```

**Special Characteristics:**
- Principal-centric dashboard view
- KPI cards with drill-down
- Pipeline table with inline actions
- Activity feed panel
- Tasks kanban panel
- Mobile quick action bar

---

### reports/ (Complex - 45 files)

**Key Files:**
```
reports/
  ReportsPage.tsx               # Main reports container
  ReportLayout.tsx              # Shared layout wrapper
  tabs/
    OverviewTab.tsx             # Summary metrics
    OpportunitiesTab.tsx        # Pipeline report
    WeeklyActivityTab.tsx       # Activity summary
    CampaignActivityTab.tsx     # Campaign metrics
  charts/
    PipelineChart.tsx           # Pipeline visualization
    ActivityTrendChart.tsx      # Activity trends
    RepPerformanceChart.tsx     # Rep comparison
  components/
    KPICard.tsx                 # Report KPI card
    ChartWrapper.tsx            # Chart container
    FilterChip.tsx              # Active filter indicator
  hooks/
    useReportData.ts            # Report data fetching
    useChartTheme.ts            # Chart theming
```

**Special Characteristics:**
- Tab-based report organization
- Chart.js integration
- Date range filtering
- Export functionality
- Campaign activity tracking

---

### Simpler Features

| Feature | Files | Key Characteristics |
|---------|-------|---------------------|
| **tags** (12) | Tag CRUD, color picker, chip display |
| **sales** (17) | User/rep management, permissions tabs |
| **productDistributors** (8) | Junction table management |
| **notifications** (3) | Notification list only |
| **login** (3) | Start page, skeleton |
| **tutorial** (21) | Step definitions, provider, triggers |
| **settings** (13) | Tabbed settings page |

---

## File Patterns

### List.tsx Pattern

**Purpose:** Main list view for the feature with filtering, sorting, and slideOver integration.

**Standard Structure:**

```typescript
import { useGetIdentity, useListContext } from "ra-core";
import { List } from "@/components/admin/list";
import { StandardListLayout } from "@/components/layouts/StandardListLayout";
import { PremiumDatagrid } from "@/components/admin/PremiumDatagrid";
import { FloatingCreateButton } from "@/components/admin/FloatingCreateButton";
import { ListSearchBar } from "@/components/admin/ListSearchBar";
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { useFilterCleanup } from "../hooks/useFilterCleanup";
import { useListKeyboardNavigation } from "@/hooks/useListKeyboardNavigation";
import { [Feature]Empty } from "./[Feature]Empty";
import { [Feature]ListFilter } from "./[Feature]ListFilter";
import { [Feature]SlideOver } from "./[Feature]SlideOver";
import { [FEATURE]_FILTER_CONFIG } from "./[feature]FilterConfig";

export const [Feature]List = () => {
  // 1. Auth/identity check
  const { data: identity, isPending: isIdentityPending } = useGetIdentity();

  // 2. SlideOver state management
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  // 3. Clean stale filters from localStorage
  useFilterCleanup("[features]");

  // 4. Skeleton while loading
  if (isIdentityPending) return <[Feature]ListSkeleton />;
  if (!identity) return null;

  return (
    <>
      <List
        title={false}
        actions={<[Feature]ListActions />}
        perPage={25}
        sort={{ field: "created_at", order: "DESC" }}
      >
        <[Feature]ListLayout
          openSlideOver={openSlideOver}
          isSlideOverOpen={isOpen}
        />
        <FloatingCreateButton />
      </List>

      <[Feature]SlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        mode={mode}
        onClose={closeSlideOver}
        onModeToggle={toggleMode}
      />
    </>
  );
};

// Inner layout component (accesses ListContext)
const [Feature]ListLayout = ({ openSlideOver, isSlideOverOpen }) => {
  const { data, isPending, filterValues } = useListContext();
  const { focusedIndex } = useListKeyboardNavigation({
    onSelect: (id) => openSlideOver(Number(id), "view"),
    enabled: !isSlideOverOpen,
  });

  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  // Branch 1: Loading
  if (isPending) {
    return (
      <StandardListLayout resource="[features]" filterComponent={<[Feature]ListFilter />}>
        <[Feature]ListSkeleton />
      </StandardListLayout>
    );
  }

  // Branch 2: True empty (no data, no filters)
  if (!data?.length && !hasFilters) {
    return <[Feature]Empty />;
  }

  // Branch 3: Filtered empty
  if (!data?.length && hasFilters) {
    return (
      <StandardListLayout resource="[features]" filterComponent={<[Feature]ListFilter />}>
        <ListSearchBar placeholder="Search..." filterConfig={[FEATURE]_FILTER_CONFIG} />
        <ListNoResults />
      </StandardListLayout>
    );
  }

  // Branch 4: Has data
  return (
    <StandardListLayout resource="[features]" filterComponent={<[Feature]ListFilter />}>
      <ListSearchBar placeholder="Search..." filterConfig={[FEATURE]_FILTER_CONFIG} />
      <PremiumDatagrid
        onRowClick={(id) => openSlideOver(Number(id), "view")}
        focusedIndex={focusedIndex}
      >
        {/* Columns */}
      </PremiumDatagrid>
    </StandardListLayout>
  );
};
```

**Key Elements:**
- `useGetIdentity()` for auth guard
- `useSlideOverState()` for panel management
- `useFilterCleanup()` for localStorage validation
- `useListKeyboardNavigation()` for arrow key support
- 4-branch empty state cascade
- `StandardListLayout` for consistent sidebar + content layout
- `PremiumDatagrid` with row click and keyboard navigation

---

### Create.tsx Pattern

**Purpose:** Create form with validation, defaults, and context-aware redirect.

**Standard Structure:**

```typescript
import { useMemo } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { CreateBase, Form, useGetIdentity } from "ra-core";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProgressProvider, FormProgressBar } from "@/components/admin/form";
import { Card, CardContent } from "@/components/ui/card";
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import { getContextAwareRedirect } from "@/atomic-crm/utils/getContextAwareRedirect";
import { [Feature]Inputs } from "./[Feature]Inputs";
import { [feature]Schema } from "../validation/[feature]";
import { CreateFormFooter } from "@/atomic-crm/components";

const [Feature]Create = () => {
  // 1. Load identity for RLS
  const { data: identity, isLoading } = useGetIdentity();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // 2. Context-aware redirect
  const redirect = getContextAwareRedirect(searchParams);

  // 3. Extract URL params for pre-fill
  const urlOrgId = searchParams.get("organization_id");

  // Guard: Wait for identity
  if (isLoading || !identity?.id) {
    return <FormLoadingSkeleton />;
  }

  // 4. Compute defaults: schema -> identity -> URL params
  const formDefaults = useMemo(() => ({
    ...[feature]Schema.partial().parse({}),
    sales_id: identity?.id,
    ...(urlOrgId && { organization_id: Number(urlOrgId) }),
  }), [identity?.id, urlOrgId]);

  return (
    <CreateBase redirect={redirect}>
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <FormProgressProvider initialProgress={10}>
            <FormProgressBar className="mb-6" />
            <Form
              defaultValues={formDefaults}
              mode="onBlur"
              resolver={zodResolver([feature]Schema)}
            >
              <Card>
                <CardContent className="space-y-6 p-6">
                  <[Feature]Inputs />
                  <CreateFormFooter
                    resourceName="[feature]"
                    redirectPath="/[features]"
                    redirect={redirect}
                  />
                </CardContent>
              </Card>
            </Form>
          </FormProgressProvider>
        </div>
      </div>
    </CreateBase>
  );
};
```

**Key Elements:**
- `useGetIdentity()` guard for RLS compliance
- `getContextAwareRedirect()` for smart navigation
- `schema.partial().parse({})` for defaults
- `zodResolver()` for validation
- Form mode `onBlur` (never `onChange`)
- Separate `[Feature]Inputs` component for reusability
- `CreateFormFooter` with Save & Add Another option

---

### SlideOver.tsx Pattern

**Purpose:** 40vw right panel for viewing/editing records with tabs.

**Standard Structure:**

```typescript
import { useEffect } from "react";
import { UserIcon, FileTextIcon, ActivityIcon } from "lucide-react";
import type { TabConfig } from "@/components/layouts/ResourceSlideOver";
import { ResourceSlideOver } from "@/components/layouts/ResourceSlideOver";
import { [Feature]DetailsTab } from "./slideOverTabs/[Feature]DetailsTab";
import { [Feature]NotesTab } from "./slideOverTabs/[Feature]NotesTab";
import { useRecentSearches } from "@/atomic-crm/hooks/useRecentSearches";
import type { [Feature] } from "../types";

interface [Feature]SlideOverProps {
  recordId: number | null;
  isOpen: boolean;
  mode: "view" | "edit";
  onClose: () => void;
  onModeToggle: () => void;
}

export function [Feature]SlideOver({
  recordId,
  isOpen,
  mode,
  onClose,
  onModeToggle,
}: [Feature]SlideOverProps) {
  const { addRecent } = useRecentSearches();

  // Define tabs
  const tabs: TabConfig[] = [
    {
      key: "details",
      label: "Details",
      component: [Feature]DetailsTab,
      icon: UserIcon,
    },
    {
      key: "notes",
      label: "Notes",
      component: [Feature]NotesTab,
      icon: FileTextIcon,
      countFromRecord: (record: [Feature]) => record.nb_notes,
    },
  ];

  // Display name function
  const recordRepresentation = (record: [Feature]) => {
    return record.name || `[Feature] #${record.id}`;
  };

  return (
    <ResourceSlideOver
      resource="[features]"
      recordId={recordId}
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      onModeToggle={onModeToggle}
      tabs={tabs}
      recordRepresentation={recordRepresentation}
    />
  );
}
```

**Key Elements:**
- `TabConfig[]` array defines tab structure
- `ResourceSlideOver` handles all panel logic
- `recordRepresentation` for title display
- Optional `countFromRecord` for tab badges
- Optional `breadcrumbComponent` for hierarchy
- Optional `headerActions` for custom buttons

---

### index.tsx and resource.tsx Pattern

**index.tsx - Public API:**

```typescript
/* eslint-disable react-refresh/only-export-components */

/**
 * [Feature] Module Entry Point
 */

// Raw components for testing/embedding
export { [Feature]List } from "./[Feature]List";
export { [Feature]Create } from "./[Feature]Create";
export { [Feature]Edit } from "./[Feature]Edit";

// Wrapped views with error boundaries
export {
  [Feature]ListView,
  [Feature]CreateView,
  [Feature]EditView,
} from "./resource";

// React Admin resource config
export { default } from "./resource";
```

**resource.tsx - React Admin Config:**

```typescript
import * as React from "react";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

// Lazy-load components
const [Feature]ListLazy = React.lazy(() => import("./[Feature]List"));
const [Feature]CreateLazy = React.lazy(() => import("./[Feature]Create"));
const [Feature]EditLazy = React.lazy(() =>
  import("./[Feature]Edit").then((m) => ({ default: m.[Feature]Edit }))
);

// Wrap with error boundaries
export const [Feature]ListView = () => (
  <ResourceErrorBoundary resource="[features]" page="list">
    <[Feature]ListLazy />
  </ResourceErrorBoundary>
);

export const [Feature]CreateView = () => (
  <ResourceErrorBoundary resource="[features]" page="create">
    <[Feature]CreateLazy />
  </ResourceErrorBoundary>
);

export const [Feature]EditView = () => (
  <ResourceErrorBoundary resource="[features]" page="edit">
    <[Feature]EditLazy />
  </ResourceErrorBoundary>
);

// Record representation for breadcrumbs
const featureRecordRepresentation = (record: [Feature]) =>
  record?.name || "[Feature]";

// React Admin resource config
export default {
  list: [Feature]ListView,
  create: [Feature]CreateView,
  edit: [Feature]EditView,
  recordRepresentation: featureRecordRepresentation,
};
```

---

## Co-location Rules

### Decision Tree: Where Does This Code Go?

```
Is it used ONLY by this feature?
|
+-- YES: Put in feature folder
|       +-- Is it a React component?
|           +-- YES: [feature]/components/ or inline
|           +-- NO: Is it a hook?
|               +-- YES: [feature]/hooks/
|               +-- NO: [feature]/utils/ or [feature].ts
|
+-- NO: Is it used by 2+ features?
        |
        +-- YES: Is it a UI primitive (Button, Card, etc.)?
        |       +-- YES: src/components/ui/
        |       +-- NO: Is it a hook?
        |           +-- YES: src/atomic-crm/hooks/
        |           +-- NO: Is it a utility?
        |               +-- YES: src/atomic-crm/utils/
        |               +-- NO: src/atomic-crm/components/
        |
        +-- UNCERTAIN: Start in feature, extract when reused
```

### Placement Examples

| Code | Location | Reason |
|------|----------|--------|
| `ContactAvatar` | `contacts/` | Only contacts have avatars |
| `Button` | `components/ui/` | Used everywhere |
| `useOpportunityKanban` | `opportunities/hooks/` | Only opportunities use kanban |
| `useSlideOverState` | `atomic-crm/hooks/` | Used by all features |
| `formatCurrency` | `lib/formatters` | Used everywhere |
| `formatContactPhone` | `contacts/formatters.ts` | Contact-specific |
| `PremiumDatagrid` | `components/admin/` | Used by all list views |
| `ResourceSlideOver` | `components/layouts/` | Used by all features |
| `opportunitySchema` | `validation/` | Central validation |

### The "Rule of Three"

1. **First use**: Put in feature folder
2. **Second use**: Consider extraction, but copy is OK
3. **Third use**: Extract to shared location

---

## Feature Dependencies

### Dependency Rules

**Rule 1: Features NEVER import from each other**
```typescript
// WRONG - cross-feature import
import { OpportunityCard } from '../opportunities/components'

// RIGHT - use shared or duplicate
import { Card } from '@/components/ui/Card'
```

**Rule 2: Features import from shared infrastructure**
```typescript
// All features can import from:
import { ... } from '@/components/ui'
import { ... } from '@/components/admin'
import { ... } from '@/atomic-crm/hooks'
import { ... } from '@/atomic-crm/contexts'
import { ... } from '@/lib'
import { ... } from '@/atomic-crm/validation'
```

**Rule 3: Data relationships via IDs, not imports**
```typescript
// Contact references Organization via ID
// No import of Organization components
<ReferenceField source="organization_id" reference="organizations">
  <TextField source="name" />
</ReferenceField>
```

### Cross-Feature Data Relationships

| Feature | References | Via Field |
|---------|------------|-----------|
| contacts | organizations | `organization_id` via junction table |
| opportunities | contacts | `opportunity_contacts` junction |
| opportunities | organizations | `organization_id` |
| opportunities | principals | `principal_id` |
| activities | contacts | `contact_id` |
| activities | opportunities | `opportunity_id` |
| tasks | contacts | `contact_id` |
| tasks | opportunities | `opportunity_id` |
| products | principals | `principal_id` |
| productDistributors | products, distributors | Junction table |

### Dependency Direction

```
                    [Shared Infrastructure]
                           |
    +----------------------+----------------------+
    |                      |                      |
    v                      v                      v
[contacts]           [opportunities]        [organizations]
    |                      |                      |
    +-------> [activities] <------+               |
    |              |              |               |
    +-------> [tasks] <-----------+---------------+
```

Features depend on shared infrastructure, not each other. Cross-references are via React Admin's `ReferenceField` and `ReferenceInput` components.

---

## Adding a New Feature

### Step-by-Step Checklist

```markdown
## New Feature: [FeatureName]

### Phase 1: Database Setup
- [ ] Create migration in `supabase/migrations/`
- [ ] Define table with RLS policies
- [ ] Create summary view if needed
- [ ] Add to TypeScript types in `src/types/`

### Phase 2: Validation Schema
- [ ] Create schema in `src/atomic-crm/validation/[feature].ts`
- [ ] Define base schema with Zod
- [ ] Add create/update variants
- [ ] Add `.max()` to all strings (DoS prevention)
- [ ] Use `z.strictObject()` at API boundary

### Phase 3: Data Provider
- [ ] Create handler in `providers/supabase/handlers/[feature]Handler.ts`
- [ ] Implement getList, getOne, create, update, delete
- [ ] Add Zod validation at boundary
- [ ] Register in `composedDataProvider.ts`

### Phase 4: Feature Directory
- [ ] Create `src/atomic-crm/[feature]/`
- [ ] Create `index.tsx` with exports
- [ ] Create `resource.tsx` with lazy loading
- [ ] Create `PATTERNS.md` documenting feature patterns

### Phase 5: Core Views
- [ ] Create `[Feature]List.tsx`
- [ ] Create `[Feature]Create.tsx`
- [ ] Create `[Feature]Edit.tsx` (or reuse Create)
- [ ] Create `[Feature]SlideOver.tsx`
- [ ] Create `[Feature]Empty.tsx`
- [ ] Create `[Feature]Inputs.tsx`

### Phase 6: Supporting Files
- [ ] Create `[Feature]ListFilter.tsx`
- [ ] Create `[feature]FilterConfig.ts`
- [ ] Create `constants.ts` if needed
- [ ] Create `slideOverTabs/` directory with tabs

### Phase 7: Registration
- [ ] Add resource constant to `src/constants/resources.ts`
- [ ] Register resource in `CRM.tsx`
- [ ] Add to navigation menu
- [ ] Add route permissions if needed

### Phase 8: Testing
- [ ] Create `__tests__/` directory
- [ ] Add unit tests for utilities
- [ ] Add integration tests for Create/Edit
- [ ] Add E2E test checklist in `docs/tests/e2e/`
- [ ] Run `npm run build` to verify no type errors

### Phase 9: Documentation
- [ ] Update this file with new feature entry
- [ ] Document any special patterns in `PATTERNS.md`
- [ ] Update CLAUDE.md if architectural decisions made
```

### File Templates

See the patterns documented above for starter templates. Each feature should follow the established patterns for:
- List.tsx structure
- Create.tsx with validation
- SlideOver.tsx with tabs
- index.tsx and resource.tsx exports

---

## Related Documentation

- [Architecture Overview](./00-architecture-overview.md) - System-wide architecture
- [Presentation Layer](./01-presentation-layer.md) - UI components and patterns
- [Infrastructure Layer](./03-infrastructure-layer.md) - Data providers, handlers
- [Engineering Constitution](../ENGINEERING_CONSTITUTION.md) - Core principles
- [CLAUDE.md](../../CLAUDE.md) - AI assistant guidelines
