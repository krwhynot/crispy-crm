# Multi-Select Filters Implementation Plan

This plan breaks down the multi-select filter enhancement into parallel-executable tasks optimized for concurrent development. The feature enhances OpportunityList with multi-select capabilities for Stage, Tags, Priority, and Customer Organization filters, with URL sharing and localStorage persistence.

## High-Level Overview

The implementation leverages existing infrastructure (MultiSelectInput component, FilterChipsPanel, filter precedence system) and adds minimal new code: a centralized filter hook, tag name resolution, and refactored stage persistence logic. The core challenge is fixing an inverted storage pattern (storing hidden stages instead of visible) and adding tag name lookups similar to existing organization/sales patterns.

**Key Insight**: 80% of required functionality already exists. This is primarily a refactoring and pattern-replication effort, not new feature development.

## Critically Relevant Files and Documentation

### Core Implementation Files
- `/src/atomic-crm/opportunities/OpportunityList.tsx` - Main list component with filter configuration
- `/src/atomic-crm/filters/FilterChipsPanel.tsx` - Active filter chip display with name resolution
- `/src/atomic-crm/filters/filterFormatters.ts` - Filter value to label conversion utilities
- `/src/atomic-crm/filters/useOrganizationNames.ts` - Pattern for batch name fetching (replicate for tags)
- `/src/atomic-crm/filters/useSalesNames.ts` - Another name resolution pattern example
- `/src/atomic-crm/filters/types.ts` - Filter type definitions and constants
- `/src/components/admin/multi-select-input.tsx` - Multi-select dropdown component (already working)

### Infrastructure Files
- `/src/atomic-crm/providers/supabase/dataProviderUtils.ts` - PostgREST operator transformation (tags use @cs)
- `/src/atomic-crm/providers/supabase/filterRegistry.ts` - Valid filterable fields registry
- `/src/atomic-crm/hooks/useFilterCleanup.ts` - **⚠️ Contains critical bug** (wrong localStorage key)
- `/src/atomic-crm/validation/opportunities.ts` - Zod schemas for opportunity enums

### Documentation
- `.docs/plans/multi-select-filters/shared.md` - System architecture and patterns
- `.docs/plans/multi-select-filters/existing-filters.research.md` - Complete filter system analysis
- `.docs/plans/multi-select-filters/database-schema.research.md` - Database schema and query patterns
- `.docs/plans/multi-select-filters/react-admin-patterns.research.md` - React Admin integration patterns
- `.docs/plans/multi-select-filters/dynamic-data.research.md` - Caching and data loading strategies

### Database Tables
- **opportunities** - Main table with `stage` (enum), `priority` (enum), `tags` (text[]), and organization FKs
- **tags** - Standalone tag management table (id, name, usage_count)
- **organizations** - Referenced by customer_organization_id filter

---

## Implementation Plan

### Phase 1: Infrastructure & Bug Fixes

#### Task 1.1: Fix Critical localStorage Key Bug **[Depends on: none]**

**READ THESE BEFORE TASK**
- `/src/atomic-crm/hooks/useFilterCleanup.ts`
- `/src/atomic-crm/root/CRM.tsx` (line 123 - store initialization)

**Instructions**

Files to Modify:
- `/src/atomic-crm/hooks/useFilterCleanup.ts`

**Critical Bug**: Line 33 uses wrong localStorage key prefix. The app uses `"CRM"` prefix for React Admin store, resulting in keys like `RaStoreCRM.{resource}.listParams`, but cleanup hook looks for `RaStore.{resource}.listParams`.

Fix the key construction:
```typescript
// Line 33
const key = `RaStoreCRM.${resource}.listParams`; // Changed from RaStore
```

Add comment explaining the prefix comes from CRM.tsx store initialization.

**Rationale**: This bug causes filter cleanup to fail silently - it never finds the correct localStorage entries. Critical to fix before implementing new filters.

---

#### Task 1.2: Create Tag Name Resolution Hook **[Depends on: none]**

**READ THESE BEFORE TASK**
- `/src/atomic-crm/filters/useOrganizationNames.ts` - Pattern to follow exactly
- `/src/atomic-crm/filters/useSalesNames.ts` - Alternative reference pattern
- `.docs/plans/multi-select-filters/dynamic-data.research.md` - Batch fetching patterns

**Instructions**

Files to Create:
- `/src/atomic-crm/filters/useTagNames.ts`

Create a custom hook following the exact pattern of `useOrganizationNames.ts`:

```typescript
export const useTagNames = (tagIds: string[] | undefined) => {
  const dataProvider = useDataProvider();
  const [tagMap, setTagMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tagIds || tagIds.length === 0) return;

    const idsToFetch = tagIds.filter(id => !tagMap[id]);
    if (idsToFetch.length === 0) return;

    setLoading(true);
    const fetchNames = async () => {
      const { data } = await dataProvider.getMany('tags', { ids: idsToFetch });
      const newMap = data.reduce((acc, tag) => {
        acc[String(tag.id)] = tag.name;
        return acc;
      }, {});
      setTagMap(prev => ({ ...prev, ...newMap }));
    };

    fetchNames().finally(() => setLoading(false));
  }, [tagIds?.join(',')]);

  return {
    tagMap,
    getTagName: (id: string) => tagMap[id] || `Tag #${id}`,
    loading,
  };
};
```

**Gotcha**: Tags in opportunities table are stored as `text[]` (tag names), not IDs. However, this hook will be needed for contacts which use `bigint[]` (tag IDs). For opportunities, the tag values ARE the display names.

**Pattern Consistency**: Use identical structure to existing name resolution hooks for maintainability.

---

#### Task 1.3: Add TAGS Constant to Filter Types **[Depends on: none]**

**READ THESE BEFORE TASK**
- `/src/atomic-crm/filters/types.ts`

**Instructions**

Files to Modify:
- `/src/atomic-crm/filters/types.ts`

Add `TAGS` to the `FILTER_KEYS` constant (around line 15-25):

```typescript
export const FILTER_KEYS = {
  STAGE: 'stage',
  PRIORITY: 'priority',
  STATUS: 'status',
  TAGS: 'tags',  // Add this
  // ... existing keys
} as const;
```

**Rationale**: Ensures consistent filter key references across the codebase and enables TypeScript autocomplete.

---

### Phase 2: Tag Filter Support

#### Task 2.1: Extend Filter Formatter for Tags **[Depends on: 1.2, 1.3]**

**READ THESE BEFORE TASK**
- `/src/atomic-crm/filters/filterFormatters.ts`
- `/src/atomic-crm/filters/useTagNames.ts` (created in 1.2)
- `/src/atomic-crm/filters/types.ts` (updated in 1.3)

**Instructions**

Files to Modify:
- `/src/atomic-crm/filters/filterFormatters.ts`

Add tag formatting case to `formatFilterLabel()` function (around line 50-70):

```typescript
case FILTER_KEYS.TAGS:
  // Opportunities store tag names directly (text[])
  // Contacts store tag IDs (bigint[]) - need lookup
  if (getTagName) {
    return getTagName(String(value));
  }
  // Fallback: value is already a name for opportunities
  return String(value);
```

Update the function signature to accept optional `getTagName`:
```typescript
export const formatFilterLabel = (
  key: string,
  value: FilterValue,
  getOrganizationName?: (id: string) => string,
  getSalesName?: (id: string) => string,
  getTagName?: (id: string) => string  // Add this
): string => {
```

**Gotcha**: Opportunities use `text[]` (tag names) while contacts use `bigint[]` (tag IDs). The formatter handles both by checking if lookup function exists.

---

#### Task 2.2: Integrate Tag Names into FilterChipsPanel **[Depends on: 2.1]**

**READ THESE BEFORE TASK**
- `/src/atomic-crm/filters/FilterChipsPanel.tsx`
- `/src/atomic-crm/filters/useTagNames.ts`
- `/src/atomic-crm/filters/filterFormatters.ts` (updated in 2.1)

**Instructions**

Files to Modify:
- `/src/atomic-crm/filters/FilterChipsPanel.tsx`

1. Import `useTagNames` hook (around line 5):
```typescript
import { useTagNames } from "./useTagNames";
```

2. Extract tag IDs from filter values (around line 33, after salesIds):
```typescript
const tagIds = filterValues?.tags
  ? Array.isArray(filterValues.tags)
    ? filterValues.tags.map(String)
    : [String(filterValues.tags)]
  : undefined;
```

3. Call the hook (around line 37, after useSalesNames):
```typescript
const { getTagName } = useTagNames(tagIds);
```

4. Pass to formatter (around line 61):
```typescript
const label = formatFilterLabel(
  chip.key,
  chip.value,
  getOrganizationName,
  getSalesName,
  getTagName  // Add this
);
```

**Note**: For opportunities, tag values are already names so lookup returns the value unchanged. For contacts (future), this enables ID-to-name resolution.

---

### Phase 3: Stage Filter Refactoring

#### Task 3.1: Create Stage Preference Utilities **[Depends on: none]**

**READ THESE BEFORE TASK**
- `/src/atomic-crm/opportunities/OpportunityList.tsx` (lines 29-66)
- `/src/atomic-crm/filters/filterPrecedence.ts` - Pattern reference
- `.docs/plans/multi-select-filters/requirements.md` - Stage persistence requirements

**Instructions**

Files to Create:
- `/src/atomic-crm/filters/opportunityStagePreferences.ts`

**Current Problem**: OpportunityList stores "hidden stages" instead of "selected stages", requiring inverted logic (all except hidden = visible). This is confusing and error-prone.

**New Pattern**: Store selected stages directly.

```typescript
import { OPPORTUNITY_STAGE_CHOICES } from '../opportunities/stageConstants';

const STORAGE_KEY = 'filter.opportunity_stages';
const DEFAULT_VISIBLE_STAGES = OPPORTUNITY_STAGE_CHOICES
  .filter(c => !['closed_won', 'closed_lost'].includes(c.id))
  .map(c => c.id);

export const getStoredStagePreferences = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_VISIBLE_STAGES;
  } catch {
    return DEFAULT_VISIBLE_STAGES;
  }
};

export const saveStagePreferences = (selectedStages: string[]): void => {
  if (selectedStages.length === 0) return; // Don't save empty

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedStages));
  } catch (error) {
    console.warn('Failed to save stage preferences:', error);
  }
};

export const getDefaultVisibleStages = (): string[] => {
  return DEFAULT_VISIBLE_STAGES;
};
```

**Key Changes**:
1. Renamed key from `opportunity_hidden_stages` to `filter.opportunity_stages` (consistent with filter.* pattern)
2. Store selected stages directly (not inverted)
3. Provide clear default excluding closed stages
4. Export utilities for reuse

**Migration Note**: Old `opportunity_hidden_stages` key will be orphaned but won't cause issues. Users will see default stages on first load after upgrade, then their new selections persist.

---

#### Task 3.2: Update OpportunityList to Use Stage Utilities **[Depends on: 3.1]**

**READ THESE BEFORE TASK**
- `/src/atomic-crm/opportunities/OpportunityList.tsx`
- `/src/atomic-crm/filters/opportunityStagePreferences.ts` (created in 3.1)
- `/src/atomic-crm/filters/filterPrecedence.ts` - URL precedence pattern

**Instructions**

Files to Modify:
- `/src/atomic-crm/opportunities/OpportunityList.tsx`

1. Import the new utilities (line 26):
```typescript
import {
  getStoredStagePreferences,
  saveStagePreferences,
  getDefaultVisibleStages,
} from "../filters/opportunityStagePreferences";
```

2. Replace `getInitialStageFilter()` function (lines 29-55):
```typescript
const getInitialStageFilter = (): string[] | undefined => {
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
      // Invalid JSON in URL, continue to fallback
    }
  }

  // 2. Check localStorage preferences (now stores selected, not hidden)
  return getStoredStagePreferences();
};
```

3. Replace `updateStagePreferences()` function (lines 57-66):
```typescript
const updateStagePreferences = (selectedStages: string[]): void => {
  saveStagePreferences(selectedStages);
};
```

**Impact**: Simplifies logic from ~38 lines of inverted filtering to ~15 lines of direct storage. Easier to understand and maintain.

**URL Precedence**: Preserved - URL params still override localStorage.

---

### Phase 4: Centralized Filter Configuration

#### Task 4.1: Create Centralized Opportunity Filters Hook **[Depends on: 3.2]**

**READ THESE BEFORE TASK**
- `/src/atomic-crm/opportunities/OpportunityList.tsx` (lines 75-97)
- `.docs/plans/multi-select-filters/requirements.md` - Filter configuration requirements
- `.docs/plans/multi-select-filters/existing-filters.research.md` - Pattern examples

**Instructions**

Files to Create:
- `/src/atomic-crm/filters/useOpportunityFilters.tsx`

Extract filter configuration from OpportunityList into reusable hook:

```typescript
import { SearchInput } from "@/components/admin/search-input";
import { MultiSelectInput } from "@/components/admin/multi-select-input";
import { ReferenceInput } from "@/components/admin/reference-input";
import { AutocompleteArrayInput } from "@/components/admin/autocomplete-array-input";
import { OPPORTUNITY_STAGE_CHOICES } from "../opportunities/stageConstants";
import { OnlyMineInput } from "../opportunities/OnlyMineInput";
import { getInitialStageFilter } from "../opportunities/OpportunityList"; // Will be extracted

/**
 * Centralized filter configuration for opportunities resource
 * Shared between List and future Kanban views
 */
export const useOpportunityFilters = () => {
  return [
    <SearchInput source="q" alwaysOn />,
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
      defaultValue={getInitialStageFilter()}
    />,
    <OnlyMineInput source="opportunity_owner_id" alwaysOn />,
  ];
};
```

**Gotcha**: `getInitialStageFilter()` is currently defined in OpportunityList.tsx. Move it to `opportunityStagePreferences.ts` as `getInitialStageFilter()` and import here.

**Future-Proofing**: This hook will be reused when Kanban view is re-enabled, ensuring filter state consistency between views.

---

#### Task 4.2: Update OpportunityList to Use Centralized Hook **[Depends on: 4.1]**

**READ THESE BEFORE TASK**
- `/src/atomic-crm/opportunities/OpportunityList.tsx`
- `/src/atomic-crm/filters/useOpportunityFilters.tsx` (created in 4.1)

**Instructions**

Files to Modify:
- `/src/atomic-crm/opportunities/OpportunityList.tsx`
- `/src/atomic-crm/filters/opportunityStagePreferences.ts` (move `getInitialStageFilter`)

1. Move `getInitialStageFilter()` from OpportunityList.tsx to `opportunityStagePreferences.ts`:
```typescript
// In opportunityStagePreferences.ts
export const getInitialStageFilter = (): string[] | undefined => {
  const urlParams = new URLSearchParams(window.location.search);
  const urlFilter = urlParams.get('filter');
  if (urlFilter) {
    try {
      const parsed = JSON.parse(urlFilter);
      if (parsed.stage) {
        return Array.isArray(parsed.stage) ? parsed.stage : [parsed.stage];
      }
    } catch {}
  }
  return getStoredStagePreferences();
};
```

2. In OpportunityList.tsx, import and use the hook (around line 75):
```typescript
import { useOpportunityFilters } from "../filters/useOpportunityFilters";

const OpportunityList = () => {
  const { identity } = useGetIdentity();
  const getResourceLabel = useGetResourceLabel();
  const resourceLabel = getResourceLabel("opportunities", 2);

  if (!identity) return null;

  const opportunityFilters = useOpportunityFilters();

  return (
    <List
      perPage={100}
      // ... rest of List config
      filters={opportunityFilters}
    >
      {/* ... */}
    </List>
  );
};
```

3. Remove the inline `opportunityFilters` array definition (lines 75-97).

**Impact**: Reduces OpportunityList.tsx from ~165 lines to ~145 lines. Centralizes filter config for reuse.

---

### Phase 5: Documentation & Testing

#### Task 5.1: Update Filter Type Exports **[Depends on: 1.3, 2.1]**

**READ THESE BEFORE TASK**
- `/src/atomic-crm/filters/index.ts`
- `/src/atomic-crm/filters/types.ts`

**Instructions**

Files to Modify:
- `/src/atomic-crm/filters/index.ts`

Ensure all new utilities are exported:

```typescript
export { useTagNames } from './useTagNames';
export { useOpportunityFilters } from './useOpportunityFilters';
export {
  getStoredStagePreferences,
  saveStagePreferences,
  getDefaultVisibleStages,
  getInitialStageFilter,
} from './opportunityStagePreferences';
```

**Rationale**: Centralized exports make imports cleaner and enable easier refactoring.

---

#### Task 5.2: Add JSDoc Documentation to New Utilities **[Depends on: 1.2, 3.1, 4.1]**

**READ THESE BEFORE TASK**
- All newly created files
- Existing JSDoc examples in `/src/atomic-crm/filters/useOrganizationNames.ts`

**Instructions**

Files to Modify:
- `/src/atomic-crm/filters/useTagNames.ts`
- `/src/atomic-crm/filters/opportunityStagePreferences.ts`
- `/src/atomic-crm/filters/useOpportunityFilters.tsx`

Add comprehensive JSDoc comments to all exported functions:

```typescript
/**
 * Hook for batch-loading tag names from IDs with in-memory caching
 *
 * @param tagIds - Array of tag IDs to fetch names for
 * @returns Object containing tagMap, getTagName function, and loading state
 *
 * @example
 * const { getTagName } = useTagNames(['1', '2', '3']);
 * const label = getTagName('1'); // "Bug" or "Tag #1"
 */
export const useTagNames = (tagIds: string[] | undefined) => {
  // ...
};
```

**Pattern**: Follow existing documentation style in the filters directory. Include @param, @returns, and @example tags.

---

#### Task 5.3: Create Unit Tests for Stage Preferences **[Depends on: 3.1]**

**READ THESE BEFORE TASK**
- `/src/atomic-crm/filters/opportunityStagePreferences.ts`
- `.docs/plans/ui-ux-testing-automation/existing-test-setup.research.md` - Vitest setup
- Existing test files in `/src/atomic-crm/providers/supabase/__tests__/`

**Instructions**

Files to Create:
- `/src/atomic-crm/filters/__tests__/opportunityStagePreferences.test.ts`

Test coverage for:
1. Default visible stages (excludes closed_won, closed_lost)
2. Storage and retrieval of preferences
3. Fallback behavior when localStorage fails
4. Empty array handling (shouldn't save)
5. Invalid JSON handling

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getStoredStagePreferences,
  saveStagePreferences,
  getDefaultVisibleStages,
} from '../opportunityStagePreferences';

describe('opportunityStagePreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default visible stages when no preferences stored', () => {
    const stages = getStoredStagePreferences();
    expect(stages).not.toContain('closed_won');
    expect(stages).not.toContain('closed_lost');
    expect(stages.length).toBeGreaterThan(0);
  });

  it('saves and retrieves stage preferences', () => {
    const testStages = ['new_lead', 'qualified', 'proposal'];
    saveStagePreferences(testStages);
    const retrieved = getStoredStagePreferences();
    expect(retrieved).toEqual(testStages);
  });

  it('handles invalid JSON gracefully', () => {
    localStorage.setItem('filter.opportunity_stages', '{invalid json}');
    const stages = getStoredStagePreferences();
    expect(stages).toEqual(getDefaultVisibleStages());
  });

  it('does not save empty array', () => {
    saveStagePreferences([]);
    expect(localStorage.getItem('filter.opportunity_stages')).toBeNull();
  });
});
```

**Test Focus**: Cover edge cases and error handling, not happy paths (those are covered by integration tests).

---

#### Task 5.4: Manual Testing Checklist **[Depends on: 4.2]**

**READ THESE BEFORE TASK**
- `.docs/plans/multi-select-filters/requirements.md` - Success metrics
- All implementation files

**Instructions**

Files to Create:
- `.docs/plans/multi-select-filters/testing-checklist.md`

Create comprehensive manual testing checklist:

```markdown
# Multi-Select Filters Testing Checklist

## Stage Filter
- [ ] Default hides closed_won and closed_lost on first load
- [ ] Selecting stages persists to localStorage
- [ ] URL parameters override localStorage preferences
- [ ] Filter chips show selected stages correctly
- [ ] Removing chip updates filter state
- [ ] Clear all filters button works
- [ ] Stage preferences persist across page refreshes

## Priority Filter
- [ ] Multi-select dropdown shows checkboxes
- [ ] Selected count badge displays correctly
- [ ] Filter updates list immediately on selection
- [ ] Filter chips show priority labels (Low/Medium/High/Critical)

## Customer Organization Filter
- [ ] Autocomplete search works
- [ ] Multiple organizations can be selected
- [ ] Organization names display in filter chips (not IDs)
- [ ] Removing organization chip works correctly

## Tags Filter (if implemented)
- [ ] Tag choices load from database
- [ ] Multi-select accumulates tag selections
- [ ] Tag names display in filter chips
- [ ] Works with both opportunities (text[]) and contacts (bigint[])

## Filter Precedence
- [ ] URL filters override localStorage
- [ ] localStorage overrides defaults
- [ ] Sharing URL with filters works across devices/browsers

## Performance
- [ ] Filter panel loads in < 250ms
- [ ] List with 100+ opportunities renders smoothly
- [ ] No console errors or warnings

## Accessibility
- [ ] Keyboard navigation works in all filter dropdowns
- [ ] Screen reader announces filter changes
- [ ] Focus states visible and clear

## Edge Cases
- [ ] Empty filter state handled gracefully
- [ ] Invalid URL parameters don't crash app
- [ ] localStorage quota exceeded handled gracefully
- [ ] Stale filter cleanup removes old keys
```

**Usage**: QA team uses this for regression testing before deployment.

---

## Critical Advice for Implementation

### Data Type Inconsistency Warning

**CRITICAL**: The `tags` field has **different data types** across resources:
- **Opportunities**: `text[]` (stores tag names directly, e.g., `["Bug", "Feature"]`)
- **Contacts**: `bigint[]` (stores tag IDs, e.g., `[1, 2, 3]`)

**Implications**:
1. Filter chips for opportunities display values directly (no lookup needed)
2. Filter chips for contacts require `useTagNames` hook for ID→name resolution
3. The `formatFilterLabel` function must check if `getTagName` exists before using it
4. Future schema normalization should migrate all to `bigint[]` for consistency

### localStorage Bug Must Be Fixed First

Task 1.1 (localStorage key bug fix) is **CRITICAL** and must be completed before any other work. The current bug causes `useFilterCleanup` to silently fail, which could lead to stale filters causing runtime errors after schema changes. This is a production-grade bug that needs immediate attention.

### Filter Precedence is Complex

The three-tier precedence system (URL > localStorage > defaults) is subtle:
- **URL params** are temporary (session-only)
- **localStorage** persists across sessions
- **Defaults** are hardcoded fallback

When testing, always verify in this order:
1. Test defaults (clear localStorage, no URL params)
2. Test localStorage (set value, refresh page)
3. Test URL override (add ?filter={...} to URL)

### React Admin Store vs Direct localStorage

React Admin automatically persists filter state to `RaStoreCRM.{resource}.listParams`. The custom `filter.*` keys are **only** for initial preferences. Don't use both for the same data:

- **Good**: `filter.opportunity_stages` sets initial value, React Admin handles runtime
- **Bad**: Updating both `filter.opportunity_stages` AND `RaStoreCRM.opportunities.listParams` (redundant)

### Stage Preferences Migration Note

The refactoring from `opportunity_hidden_stages` to `filter.opportunity_stages` will orphan the old key. This is **intentional** and safe:
- Old key won't be read anymore
- Users see default stages on first load post-upgrade
- New selections persist to new key
- Old key can be manually deleted in future cleanup

No migration script needed - users reconfigure once.

### MultiSelectInput Already Works

The `MultiSelectInput` component is production-ready and requires **zero changes**. All tasks focus on:
1. Filter configuration (which fields, what choices)
2. Display logic (chips, labels, name resolution)
3. Persistence (localStorage, URL params)

Don't modify the input component itself.

### Pattern Consistency is Critical

Follow existing patterns **exactly**:
- Name resolution hooks: Copy `useOrganizationNames.ts` structure
- Filter formatters: Add switch case like existing ones
- Filter chip integration: Extract IDs, call hook, pass to formatter
- localStorage keys: Use `filter.{key}` pattern

Deviating from patterns creates maintenance burden.

### Test Pyramid Focus

- **Unit tests**: Stage preference utilities (edge cases, error handling)
- **Integration tests**: Filter state management (React Admin integration)
- **Manual tests**: Full user flows (checklist in Task 5.4)

Don't over-test. The existing infrastructure (MultiSelectInput, FilterChipsPanel) already has coverage.

### Performance Baseline

Current system handles:
- 100 opportunities per page (no pagination)
- 5-10 active filters simultaneously
- 250+ organizations in autocomplete
- Sub-250ms filter panel render

New implementation must maintain these metrics. If tests show degradation, investigate:
1. Unnecessary re-renders (use React DevTools Profiler)
2. Missing memoization (useMemo, useCallback)
3. Excessive API calls (check Network tab)

### Constitution Compliance

All code must follow Engineering Constitution rules:
1. **No over-engineering**: Resist adding features not in requirements
2. **Single source of truth**: One filter state, one validation layer
3. **Boy Scout Rule**: Fix inconsistencies when editing files (e.g., Task 1.1 bug fix)
4. **Validation at boundary**: No client-side filter validation (filters are UI preferences)
5. **Form state from truth**: Not applicable (filters aren't forms)
6. **TypeScript discipline**: Use `interface` for objects, `type` for unions
7. **Admin layer forms**: Not applicable (using existing components)
8. **Semantic colors**: Already compliant in components
9. **Migration timestamps**: Not applicable (no database changes)

### Parallel Execution Strategy

Tasks can be executed in parallel by phase:

**Phase 1** (all parallel):
- Task 1.1 (Bug fix)
- Task 1.2 (Tag hook)
- Task 1.3 (Types)

**Phase 2** (sequential after Phase 1):
- Task 2.1 → Task 2.2 (chain)

**Phase 3** (parallel, independent from Phase 2):
- Task 3.1 → Task 3.2 (chain)

**Phase 4** (after Phase 3 complete):
- Task 4.1 → Task 4.2 (chain)

**Phase 5** (after all previous phases):
- All tasks can run in parallel

Maximum parallelism: 3 developers can work simultaneously on Phases 1-3.

### Common Pitfalls to Avoid

1. **Don't create Zod schemas for filters** - Filters don't need validation (they're UI state)
2. **Don't modify dataProviderUtils.ts** - Tags already properly configured with @cs operator
3. **Don't update filterRegistry.ts** - Tags already registered for all resources
4. **Don't add tags to MultiSelectInput choices** - Tags are dynamic, not static enum
5. **Don't batch localStorage writes** - Write immediately for better UX (async is fine)
6. **Don't use React Query for filter state** - React Admin manages it via useListContext
7. **Don't add pagination to OpportunityList** - Intentionally disabled (500 record limit)

### Memory/Performance Gotchas

- **useTagNames caching**: In-memory map persists for component lifecycle, not app-wide
- **FilterChipsPanel re-renders**: Every filter change triggers chip regeneration (acceptable)
- **Name resolution batching**: Fetches only missing IDs (doesn't refetch cached)
- **localStorage quota**: ~5MB limit per origin; current usage ~10KB (safe)
- **React Admin store sync**: Writes to localStorage debounced internally (no action needed)

### Rollback Strategy

If issues arise post-deployment:
1. **Revert Stage Preferences**: Users manually clear `filter.opportunity_stages` (falls back to defaults)
2. **Revert Full Feature**: Git revert PR, redeploy (no database changes to roll back)
3. **Partial Rollback**: Remove `useOpportunityFilters` import, restore inline array

No data loss risk - all changes are UI-only.
