# Domain Layer

## Layer Definition

### What is the Domain Layer?

The Domain Layer is the "brain" of Crispy CRM - it contains all the behavioral logic, state management, and orchestration that bridges the gap between what users see (Presentation Layer) and how data is stored/retrieved (Infrastructure Layer). Unlike presentation components that focus on rendering UI, or infrastructure services that handle data access, the Domain Layer encapsulates the business rules, workflows, and reusable logic that define how the application behaves.

In React applications like Crispy CRM, the Domain Layer is implemented primarily through custom hooks and React contexts. Hooks provide reusable behavioral logic (like managing keyboard shortcuts or tracking recently viewed items), while contexts provide shared state that needs to be accessible across component hierarchies without prop drilling.

The Domain Layer follows the principle of separation of concerns: it knows nothing about how things are rendered (that's Presentation's job) and nothing about how data is fetched or stored (that's Infrastructure's job). It only knows about orchestration, state management, and business rules.

### Responsibilities

- Orchestrate complex multi-step workflows (e.g., bulk actions, form auto-generation)
- Manage application state and derived state
- Encapsulate business rules and decisions (e.g., opportunity similarity detection)
- Coordinate between UI events and data operations
- Provide reusable behavioral logic across components
- Handle keyboard shortcuts and navigation patterns
- Manage localStorage persistence for user preferences
- Track recently viewed/searched items across sessions
- Validate business constraints (e.g., distributor-principal authorization)
- Compute derived values from raw data (e.g., stage metrics)
- Provide cross-cutting configuration (pipeline stages, form options)

### Non-Responsibilities

- Rendering UI (that's Presentation)
- Direct database access (that's Infrastructure)
- HTTP requests (that's Infrastructure via data provider)
- Data validation at API boundary (that's Infrastructure via Zod schemas)
- Component styling or layout
- Route configuration
- Authentication/authorization at the network level

### Relationship to Other Layers

```
[Presentation Layer]
        |
        | calls hooks, reads context
        v
[Domain Layer] <-- YOU ARE HERE
        |
        | calls services, uses providers
        v
[Infrastructure Layer]
```

---

## Hook Ownership Model

### Three-Tier Ownership

| Tier | Location | Scope | Example |
|------|----------|-------|---------|
| UI Hooks | `src/hooks/` | Generic UI behavior, no CRM knowledge | useSlideOverState, useBreakpoint |
| App Hooks | `src/atomic-crm/hooks/` | CRM-wide behavior, cross-feature | useRecentItems, useFilterCleanup |
| Feature Hooks | `src/atomic-crm/[feature]/hooks/` | Single-feature specific | useFilteredProducts, useStageMetrics |

### Decision Tree: Where Should My Hook Go?

```
Is it generic UI behavior (modals, keyboard, focus, responsive)?
  YES -> src/hooks/
  NO  -> Is it CRM-specific but used across multiple features?
           YES -> src/atomic-crm/hooks/
           NO  -> src/atomic-crm/[feature]/hooks/
```

### Ownership Examples

**Shared UI (`src/hooks/`)**:
- `useSlideOverState` - Generic slide-over panel management, no CRM knowledge
- `useKeyboardShortcuts` - Platform-aware keyboard handling
- `useBreakpoint` - Responsive design detection

**App-Wide CRM (`src/atomic-crm/hooks/`)**:
- `useRecentItems` - Tracks viewed records across all resources
- `useFilterCleanup` - Validates filters for any CRM resource
- `useSmartDefaults` - Provides current user/date for any form

**Feature-Specific (`src/atomic-crm/opportunities/hooks/`)**:
- `useFilteredProducts` - Products filtered by principal (opportunities only)
- `useAutoGenerateName` - Name generation from principal + customer
- `useStageMetrics` - Opportunity pipeline metrics

---

## Complete Hook Inventory

### Shared UI Hooks (`src/hooks/`)

| Hook | Purpose | Params | Returns | Lines | Used By |
|------|---------|--------|---------|-------|---------|
| `useIsMobile` | Detect mobile viewport (<768px) | none | `boolean` | 20 | useAppBarHeight, responsive layouts |
| `useUserRole` | Access current user's role and permissions | none | `{ role, isAdmin, isManager, isRep, isManagerOrAdmin, isLoading }` | 38 | Permission-gated components |
| `useSlideOverState` | Manage slide-over panel with URL sync | none | `{ slideOverId, isOpen, mode, openSlideOver, closeSlideOver, setMode, toggleMode }` | 153 | ContactList, OrgList, OpportunityList |
| `useKeyboardShortcuts` | Global keyboard shortcuts (Cmd/Ctrl aware) | `handlers: KeyboardShortcutHandlers` | `{ isMac, modifierKey }` | 240 | App-wide keyboard handling |
| `useListKeyboardNavigation` | Arrow key navigation in lists | `{ onSelect?, enabled? }` | `{ focusedIndex, focusedId, setFocusedIndex, clearFocus, isMac, modifierKey }` | 230 | List views with keyboard nav |
| `useBreakpoint` | Detect current responsive breakpoint | none | `Breakpoint` (mobile, tablet-portrait, tablet-landscape, laptop, desktop) | 73 | Responsive layouts |
| `useTeamMembers` | Fetch active team members | none | `{ teamMembers, isLoading, error }` | 40 | Owner assignment dropdowns |
| `useSupportCreateSuggestion` | Autocomplete "create new" option handling | `SupportCreateSuggestionOptions` | `UseSupportCreateValue` | 181 | Autocomplete inputs with create |
| `useSavedQueries` | Persist saved filter queries | `resource: string` | `[SavedQuery[], setQueries]` | 64 | List view filter persistence |
| `useBulkExport` | Export selected records via exporter | `{ exporter?, meta? }` | `{ bulkExport }` | 60 | Bulk action toolbars |
| `useSimpleFormIterator` | Array form iterator context | none | `SimpleFormIteratorContextValue` | 67 | ArrayInput components |
| `useUnsavedChangesWarning` | Warn before leaving with dirty form | `enabled?: boolean` | `{ isDirty }` | 30 | Edit forms |
| `useDialogError` | Manage dialog error state with parsing | none | `{ error, handleError, clearError }` | 43 | Dialog components |
| `useCityStateMapping` | Auto-populate state from city name | `{ cityField?, stateField?, onlyIfEmpty? }` | void (side effect) | 37 | Address forms |
| `useInAppUnsavedChanges` | Warn before in-app navigation with dirty form | none | `{ showWarning, isDirty, confirmDiscard, cancelDiscard, handlePotentialDiscard }` | 49 | Slide-over edit forms |
| `useFavorites` | Manage user favorites with optimistic updates | none | `{ favorites, isLoading, isFavorite, toggleFavorite, canAddMore, favoritesCount }` | 170 | Favorites sidebar, record actions |
| `useOrganizationDescendants` | Fetch org hierarchy descendants | `orgId: number \| undefined` | `{ descendants, isLoading, isFetched }` | 38 | Parent org selection (cycle prevention) |

**Total**: 17 hooks, ~1,668 lines

---

### App-Wide CRM Hooks (`src/atomic-crm/hooks/`)

| Hook | Purpose | Params | Returns | Lines | Used By |
|------|---------|--------|---------|-------|---------|
| `useAppBarHeight` | Return responsive app bar height | none | `number` (48 or 64) | 10 | Layout calculations |
| `useSmartDefaults` | Provide current user + date for forms | `{ reset? }` | `{ defaults: SmartDefaults, isLoading }` | 42 | Activity forms, opportunity forms |
| `useFilterCleanup` | Clean stale filters/sorts from localStorage | `resource: string` | void (side effect) | 150 | All list views |
| `useRecentSelections` | Track recently selected items per field | `fieldType: string` | `{ recentItems, addRecent, clearRecent }` | 75 | Autocomplete inputs |
| `useRecentSearches` | Cross-entity recent searches (useSyncExternalStore) | none | `{ recentItems, addRecent, clearRecent }` | 205 | Global search |
| `useRecentItems` | Track recently viewed records | none | `{ recentItems, addRecentItem, clearRecentItems }` | 68 | Recent items sidebar |

**Total**: 6 hooks, 550 lines

---

### Feature-Specific Hooks

#### Opportunities (`src/atomic-crm/opportunities/hooks/`)

| Hook | Purpose | Params | Returns | Lines |
|------|---------|--------|---------|-------|
| `useFilteredProducts` | Fetch products filtered by principal | `principalId: number \| null` | `{ products, isLoading, error, isReady, isEmpty }` | 49 |
| `useSimilarOpportunityCheck` | Detect similar opportunity names (Levenshtein) | `{ threshold?, excludeId?, disabled? }` | `UseSimilarOpportunityCheckResult` | 214 |
| `useContactOrgMismatch` | Detect contact-customer org mismatch | `contactIds, customerOrgId` | `{ mismatchedContacts, hasMismatch, isLoading }` | 89 |
| `useDistributorAuthorization` | Check distributor-principal authorization | `principalId, distributorId` | `UseDistributorAuthorizationResult` | 157 |
| `useOpportunityContacts` | Fetch contacts for an opportunity | `contactIds: number[]` | `{ contacts, primaryContact, isLoading, error }` | 44 |
| `useBulkActionsState` | Manage bulk action dialog state | `{ selectedIds, opportunities, onUnselectItems }` | `UseBulkActionsStateResult` | 182 |
| `useQuickAdd` | Quick booth visitor creation mutation | none | `UseMutationResult` | 51 |
| `useAutoGenerateName` | Auto-generate opportunity name | `mode: 'create' \| 'edit'` | `{ regenerate, isLoading, canGenerate }` | 87 |
| `useCustomerDistributors` | Fetch distributors for a customer | `customerId: Identifier \| null` | `UseCustomerDistributorsResult` | 114 |
| `useColumnPreferences` | Manage kanban column visibility/collapse | none | `{ collapsedStages, visibleStages, toggleCollapse, toggleVisibility, collapseAll, expandAll, resetPreferences }` | 91 |
| `useExportOpportunities` | Export opportunities to CSV | none | `{ exportToCSV }` | 113 |
| `useStageMetrics` | Calculate stage metrics (count, avg days, stuck) | `opportunities: Opportunity[]` | `StageMetrics` | 49 |

**Total**: 12 hooks, 1,240 lines

---

#### Filters (`src/atomic-crm/filters/hooks/`)

| Hook | Purpose | Params | Returns | Lines |
|------|---------|--------|---------|-------|
| `useResourceNamesBase` | Generic resource name lookup with caching | `resourceName, ids, getDisplayName, fallbackPrefix` | `{ namesMap, getName, loading }` | 106 |

**Total**: 1 hook, 106 lines

---

#### Reports (`src/atomic-crm/reports/hooks/`)

| Hook | Purpose | Params | Returns | Lines |
|------|---------|--------|---------|-------|
| `useChartTheme` | CSS variable-based chart theming | none | `ChartTheme` | 108 |
| `useReportData` | Generic report data fetching via data provider | `resource, options` | `{ data, isLoading, error, refetch }` | 137 |

**Total**: 2 hooks, 245 lines

---

#### Settings (`src/atomic-crm/settings/hooks/`)

| Hook | Purpose | Params | Returns | Lines |
|------|---------|--------|---------|-------|
| `useSalesUpdate` | User profile update mutation | `{ userId, onSuccess? }` | `UseMutationResult` | 62 |

**Total**: 1 hook, 62 lines

---

### Grand Total

| Category | Hooks | Lines |
|----------|-------|-------|
| Shared UI | 17 | ~1,668 |
| App-Wide CRM | 6 | 550 |
| Opportunities | 12 | 1,240 |
| Filters | 1 | 106 |
| Reports | 2 | 245 |
| Settings | 1 | 62 |
| **Total** | **39** | **~3,871** |

---

## Complete Context Inventory

### `src/atomic-crm/contexts/`

#### AppBrandingContext

**Purpose**: Store application branding configuration (title, logos) that rarely changes.

**Shape**:
```typescript
interface AppBranding {
  /** Application title displayed in header and login page */
  title: string;
  /** Logo path for dark mode theme */
  darkModeLogo: string;
  /** Logo path for light mode theme */
  lightModeLogo: string;
}
```

**Provider Location**: `src/atomic-crm/root/CRM.tsx`

**Consumers**:
- Header component (title display)
- Login page (branding)
- Layout components

**Default Value**:
```typescript
{
  title: "Crispy CRM",
  darkModeLogo: "/logo-dark.svg",
  lightModeLogo: "/logo-light.svg",
}
```

**Lines**: 53

---

#### FormOptionsContext

**Purpose**: Store form field options used by inputs (note statuses, task types, contact genders).

**Shape**:
```typescript
interface FormOptions {
  /** Status options for notes (cold, warm, hot, in-contract) */
  noteStatuses: NoteStatus[];
  /** Task type options (Call, Email, Meeting, etc.) */
  taskTypes: string[];
  /** Gender/pronoun options for contacts */
  contactGender: ContactGender[];
}
```

**Provider Location**: `src/atomic-crm/root/CRM.tsx`

**Consumers**:
- NoteStatusInput
- TaskTypeSelect
- ContactGenderSelect
- Any form needing these options

**Default Value**:
```typescript
{
  noteStatuses: [
    { value: "cold", label: "Cold", color: "#...", description: "..." },
    // ... more statuses
  ],
  taskTypes: ["Call", "Email", "Meeting", "LinkedIn", "Text", "Other"],
  contactGender: [
    { value: "male", label: "Male", pronoun: "He/Him" },
    // ... more options
  ],
}
```

**Lines**: 53

---

#### PipelineConfigContext

**Purpose**: Store sales pipeline configuration (stages, categories) that define the workflow.

**Shape**:
```typescript
interface PipelineConfig {
  /** Stages for legacy deal workflow */
  dealStages: DealStage[];
  /** Statuses indicating a deal is in the pipeline */
  dealPipelineStatuses: string[];
  /** Categories for deals */
  dealCategories: string[];
  /** Stages for opportunity workflow (MFB pipeline) */
  opportunityStages: { value: string; label: string }[];
  /** Categories for opportunities */
  opportunityCategories: string[];
}
```

**Provider Location**: `src/atomic-crm/root/CRM.tsx`

**Consumers**:
- OpportunityKanban
- OpportunityCreate/Edit
- Stage filters
- Pipeline metrics

**Default Value**:
```typescript
{
  opportunityStages: [
    { value: "new_lead", label: "New Lead" },
    { value: "initial_outreach", label: "Initial Outreach" },
    { value: "sample_visit_offered", label: "Sample/Visit Offered" },
    { value: "feedback_logged", label: "Feedback Logged" },
    { value: "demo_scheduled", label: "Demo Scheduled" },
    { value: "closed_won", label: "Closed Won" },
    { value: "closed_lost", label: "Closed Lost" },
  ],
  // ... other defaults
}
```

**Lines**: 69

---

**Total Contexts**: 3 contexts, 175 lines

---

## Patterns Analysis

### Hook File Structure Pattern

Standard pattern observed across all hooks:

```typescript
// hooks/useExampleHook.ts

import { useState, useCallback, useEffect, useMemo } from "react";
import { useGetList } from "ra-core";  // or other RA hooks
import type { SomeType } from "@/atomic-crm/types";

// 1. Interface definitions (exported for reuse)
interface UseExampleHookOptions {
  initialValue?: string;
  onSuccess?: (result: SomeType) => void;
}

interface UseExampleHookReturn {
  data: SomeType | null;
  isLoading: boolean;
  error: Error | null;
  execute: (input: string) => Promise<void>;
  reset: () => void;
}

// 2. Hook implementation
export function useExampleHook(
  options: UseExampleHookOptions = {}
): UseExampleHookReturn {
  const { initialValue = '', onSuccess } = options;

  // 3. State declarations
  const [data, setData] = useState<SomeType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 4. Memoized callbacks
  const execute = useCallback(async (input: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await someOperation(input);
      setData(result);
      onSuccess?.(result);
    } catch (e) {
      setError(e as Error);
      throw e;  // Fail-fast: re-throw for caller
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

  // 5. Derived values with useMemo
  const derivedValue = useMemo(() => {
    // Compute from data
  }, [data]);

  // 6. Return object
  return { data, isLoading, error, execute, derivedValue };
}
```

### Context + Hook Combination Pattern

Each context has a companion hook for safe access:

```typescript
// contexts/SomeContext.tsx
const SomeContext = createContext<SomeContextValue>(defaultValue);

export function SomeProvider({ children, ...props }) {
  const value = useMemo(() => ({ ...props }), [/* deps */]);
  return <SomeContext.Provider value={value}>{children}</SomeContext.Provider>;
}

// contexts/useSome.ts
export function useSome() {
  return useContext(SomeContext);
}
```

### State Management Patterns

1. **useState for simple state**: Most hooks use `useState` for straightforward state
2. **useSyncExternalStore for shared state**: `useRecentSearches` uses this for cross-component synchronization
3. **useStore from React Admin**: `useRecentItems` uses RA's store for automatic persistence
4. **useMutation from TanStack Query**: Mutation hooks like `useQuickAdd`, `useSalesUpdate` leverage TQ for caching
5. **Optimistic updates**: `useFavorites` implements optimistic UI with rollback on error

### Data Fetching Patterns

1. **useGetList/useGetOne from React Admin**: Standard data fetching through data provider
2. **Conditional fetching**: `enabled: !!someId` pattern prevents unnecessary requests
3. **Stable dependencies**: `useMemo` for ID arrays to prevent re-fetch loops
4. **Error surfacing**: Errors are returned, not swallowed (fail-fast principle)

### localStorage Persistence Pattern

```typescript
// With Zod validation for defense-in-depth
const schema = z.array(z.strictObject({ id: z.string(), label: z.string() }));

const loadFromStorage = (): Item[] => {
  return getStorageItem<Item[]>(storageKey, {
    type: "local",
    schema,  // Validates on load
  }) ?? [];
};
```

---

## Layer Rules

### Rule 1: Hooks Own Orchestration

Multi-step workflows live in hooks, not components.

**Correct**:
```typescript
// In component
const { submitOpportunity, isSubmitting } = useQuickAdd();
// Hook handles: validate -> save -> update cache -> notify
```

**Incorrect**:
```typescript
// In component - TOO MUCH LOGIC
const handleSubmit = async () => {
  const validated = validate(data);
  const saved = await dataProvider.create(...);
  queryClient.invalidate(...);
  toast.success(...);
}
```

### Rule 2: Feature Hooks Stay Local

If a hook only serves one feature, keep it in that feature's folder.

- `useFilteredProducts` only used by opportunities -> lives in `opportunities/hooks/`
- `useRecentItems` used across all resources -> lives in `atomic-crm/hooks/`

### Rule 3: Context for Cross-Cutting Concerns Only

Create context when:
- Multiple unrelated components need the same data
- Prop drilling exceeds 3 levels
- The data represents app-wide configuration

Do NOT create context for:
- Data that flows naturally through component hierarchy
- Single-feature state
- Frequently changing data (causes re-render storms)

### Rule 4: Naming Conventions

- **Hooks**: `use[Domain][Action]` - e.g., `useContactSearch`, `useOpportunityClose`
- **Contexts**: `[Domain]Context` - e.g., `PipelineConfigContext`
- **Providers**: `[Domain]Provider` - e.g., `PipelineConfigProvider`
- **Hook access**: `use[Domain]` - e.g., `usePipelineConfig`

### Rule 5: Fail-Fast in Hooks

Per Engineering Constitution, hooks should:
- Surface errors immediately (no silent swallowing)
- Re-throw errors after handling side effects
- Not implement retry logic
- Use fail-fast validation (Zod for localStorage data)

```typescript
// Correct - fail-fast
try {
  const result = await operation();
  setData(result);
} catch (e) {
  setError(e as Error);
  throw e;  // Re-throw for caller awareness
}
```

### Rule 6: Memoize Derived Values

Use `useMemo` for:
- ID arrays used in useEffect dependencies
- Computed values from fetched data
- Filter/transform operations on arrays

```typescript
// Prevents infinite re-fetch loops
const stableIds = useMemo(
  () => contactIds.filter(id => id != null),
  [JSON.stringify(contactIds)]  // Stable comparison
);
```

---

## Health Assessment

### Scores

| Metric | Score | Evidence |
|--------|-------|----------|
| **Clarity** | 4/5 | Clear hook naming, good JSDoc comments, explicit return types. Some hooks (e.g., `useSupportCreateSuggestion`) are complex but well-documented with `@deprecated` notices. |
| **Purity** | 4/5 | Hooks follow single responsibility. No side effects leak into components. Small concern: some hooks mix data fetching and business logic (e.g., `useBulkActionsState`). |
| **Completeness** | 4/5 | Comprehensive coverage of CRM behaviors. All three contexts cover configuration needs. Missing: contact-specific hooks, activity-specific hooks (rely on RA primitives). |

### Exemplary Files

- **`src/atomic-crm/hooks/useRecentSearches.ts`** - Uses `useSyncExternalStore` correctly with stable snapshots, cross-tab sync, and proper cache management. Excellent example of advanced React patterns.

- **`src/atomic-crm/opportunities/hooks/useSimilarOpportunityCheck.ts`** - Well-structured with clear documentation, proper state management, and clean API design. Good example of complex business logic encapsulation.

- **`src/hooks/useSlideOverState.ts`** - Clean URL synchronization with hash-based routing, ESC key handling, and browser history support. Shows how to build stateful UI primitives.

- **`src/atomic-crm/contexts/index.ts`** - Clear documentation explaining the context split strategy to prevent re-renders.

### Areas for Improvement

1. **Missing Feature Hooks**:
   - No `contacts/hooks/` directory despite contacts being a core feature
   - No `activities/hooks/` - activity logic spread across opportunity hooks
   - No `tasks/hooks/` - task management uses RA primitives directly

2. **Potential Duplication**:
   - `useRecentSelections` and `useRecentSearches` have overlapping purposes
   - Could consolidate into a single configurable hook

3. **Test Coverage**:
   - Most hooks have tests (`__tests__/` directories exist)
   - Some newer hooks (e.g., `useDistributorAuthorization`) may lack tests

4. **Documentation Gaps**:
   - Some hooks missing `@example` JSDoc sections
   - Type exports not always co-located with hooks

---

## Related Documentation

- [Architecture Overview](./00-architecture-overview.md)
- [Presentation Layer](./01-presentation-layer.md)
- [Infrastructure Layer](./03-infrastructure-layer.md)
- [Data Provider Guide](../data-provider/README.md)
