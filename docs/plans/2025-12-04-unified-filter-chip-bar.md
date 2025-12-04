# Implementation Plan: Unified Filter Chip Bar + Standardized Sidebar

**Date:** 2025-12-04
**Type:** Cross-cutting Enhancement
**Scope:** Cross-feature (Organizations, Contacts, Products)
**Design Doc:** `docs/designs/2025-12-04-unified-filter-chip-bar-design.md`

---

## ⚠️ Review Notes (2025-12-04)

**Issues identified and fixed:**

| Issue | Severity | Fix Applied |
|-------|----------|-------------|
| Missing segment name resolution | High | Added `useSegmentNames` hook (Task 1.5) |
| Date range removal changes behavior | High | Added `removalGroup` schema field for grouped removal |
| Type schema breaks opportunities | Breaking | Expanded enum to include `search`, `toggle`, `boolean` |
| Double search input in sidebars | Medium | All Phase 4 tasks use `showSearch={false}` |
| Test mocks not cleaned up | Build-breaking | Task 5.1 now includes test file cleanup |
| Type consolidation may break code | Breaking | Task 5.4 marked CAREFUL with compatibility guidance |
| useSegmentNames wrong hook pattern | High | Task 1.5 rewritten to use useResourceNamesBase |
| Scope gap (Opps/Activities/Tasks) | High | Added Phase 3B tasks + explicit scope note |
| Task 2.1 redefines constants | Medium | Updated to import from existing constants.ts |
| Chip bar missing in loading states | Medium | Task 3.x updated to mount during loading |
| Phase 3B configs don't match UI | High | Configs rewritten from actual *ListFilter.tsx files |
| Cleanup misses 3 SidebarActiveFilters | High | Task 5.1 expanded to all 5 feature areas |
| useResourceNamesBase signature wrong | Medium | Fixed to match actual (resourceName, ids, extractor, fallbackPrefix) |
| SYSTEM_FILTERS too narrow | Medium | Added `deleted_at@is` to exclusion list |

---

## Overview

This plan implements a unified filter UX across all CRM list views by:
1. Creating a `FilterChipBar` component that displays active filters above the datagrid
2. Creating a `FilterSidebar` wrapper for consistent sidebar behavior
3. Standardizing filter configurations across Organizations, Contacts, and Products

**Execution Model:** Hybrid (parallel groups + sequential dependencies)
**Task Granularity:** Atomic (2-5 min each)
**Testing:** Tests written after implementation

### Scope

| List | In Scope | Notes |
|------|----------|-------|
| Organizations | ✅ Phase 3A | Primary implementation |
| Contacts | ✅ Phase 3A | Primary implementation |
| Products | ✅ Phase 3A | Primary implementation |
| Opportunities | ✅ Phase 3B | Extended scope |
| Activities | ✅ Phase 3B | Extended scope |
| Tasks | ✅ Phase 3B | Extended scope |

**Goal:** Users see consistent chip bar UX regardless of which list they're viewing.

---

## Prerequisites

Before starting, ensure:
- [ ] Local dev server can run (`npm run dev`)
- [ ] Existing filter system works (apply a filter on Organizations page)
- [ ] You've read the design doc: `docs/designs/2025-12-04-unified-filter-chip-bar-design.md`

---

## Phase 1: Shared Infrastructure (Sequential)

These tasks MUST run sequentially as each depends on the previous.

### Task 1.1: Create Filter Config Schema

**File:** `src/atomic-crm/filters/filterConfigSchema.ts` (NEW)
**Time:** 3-5 min
**Dependencies:** None

**Purpose:** Zod schema for validating filter configurations at init time (fail-fast).

```typescript
// src/atomic-crm/filters/filterConfigSchema.ts
import { z } from 'zod';

export const filterChoiceSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().max(100),
});

export const filterConfigSchema = z.array(z.object({
  key: z.string().min(1).max(100),
  label: z.string().min(1).max(50),
  // Expanded to include all existing filter types in codebase
  type: z.enum(['select', 'multiselect', 'reference', 'date-range', 'search', 'toggle', 'boolean']),
  reference: z.string().optional(),
  choices: z.array(filterChoiceSchema).optional(),
  formatLabel: z.function().args(z.unknown()).returns(z.string()).optional(),
  // NEW: Group related filters for removal (e.g., date ranges)
  removalGroup: z.string().optional(),
}));

export type FilterChoice = z.infer<typeof filterChoiceSchema>;
export type FilterConfig = z.infer<typeof filterConfigSchema>[number];

/**
 * Validate filter config at module initialization (fail-fast).
 * @throws {ZodError} if config is malformed
 */
export function validateFilterConfig(config: unknown): FilterConfig[] {
  return filterConfigSchema.parse(config);
}
```

**Verification:**
```bash
# File exists and exports are correct
grep -q "validateFilterConfig" src/atomic-crm/filters/filterConfigSchema.ts && echo "PASS"
```

**Constitution Checklist:**
- [x] Zod at boundary (init-time validation)
- [x] Fail-fast (throws on invalid config)
- [x] String max limits (100, 50 chars)
- [x] TypeScript interface/type usage correct

---

### Task 1.2: Create useFilterChipBar Hook

**File:** `src/atomic-crm/filters/useFilterChipBar.ts` (NEW)
**Time:** 5 min
**Dependencies:** Task 1.1

**Purpose:** Core hook that transforms filter state into displayable chips.

```typescript
// src/atomic-crm/filters/useFilterChipBar.ts
import { useCallback, useMemo } from 'react';
import { useListContext } from 'react-admin';
import type { FilterConfig } from './filterConfigSchema';
import { useOrganizationNames } from './useOrganizationNames';
import { useSalesNames } from './useSalesNames';
import { useTagNames } from './useTagNames';
import { useSegmentNames } from './useSegmentNames';

export interface ChipData {
  key: string;
  value: string | number;
  label: string;
  category: string;
}

export interface UseFilterChipBarReturn {
  chips: ChipData[];
  removeFilter: (key: string, value?: string | number) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
  activeCount: number;
}

// System filters that should never show as chips
const SYSTEM_FILTERS = ['deleted_at', 'q'];

export function useFilterChipBar(filterConfig: FilterConfig[]): UseFilterChipBarReturn {
  const { filterValues, setFilters, displayedFilters } = useListContext();

  // Fail-fast: context must exist
  if (!filterValues || !setFilters) {
    throw new Error(
      'useFilterChipBar must be used within a React Admin List context. ' +
      'Ensure FilterChipBar is rendered inside a <List> component.'
    );
  }

  // Extract reference IDs for lazy loading names
  const referenceIds = useMemo(() => {
    const ids: { organizations: string[]; sales: string[]; tags: string[]; segments: string[] } = {
      organizations: [],
      sales: [],
      tags: [],
      segments: [],
    };

    filterConfig.forEach((config) => {
      const value = filterValues[config.key];
      if (!value) return;

      const values = Array.isArray(value) ? value : [value];

      if (config.reference === 'organizations' || config.key === 'organization_id') {
        ids.organizations.push(...values.map(String));
      } else if (config.reference === 'sales' || config.key === 'sales_id') {
        ids.sales.push(...values.map(String));
      } else if (config.reference === 'tags' || config.key === 'tags') {
        ids.tags.push(...values.map(String));
      } else if (config.reference === 'segments' || config.key === 'segment_id') {
        ids.segments.push(...values.map(String));
      }
    });

    return ids;
  }, [filterValues, filterConfig]);

  const { getOrganizationName } = useOrganizationNames(referenceIds.organizations);
  const { getSalesName } = useSalesNames(referenceIds.sales);
  const { getTagName } = useTagNames(referenceIds.tags);
  const { getSegmentName } = useSegmentNames(referenceIds.segments);

  // Build removal groups map from config
  const removalGroups = useMemo(() => {
    const groups = new Map<string, string[]>();
    filterConfig.forEach((config) => {
      if (config.removalGroup) {
        const existing = groups.get(config.removalGroup) || [];
        groups.set(config.removalGroup, [...existing, config.key]);
      }
    });
    return groups;
  }, [filterConfig]);

  // Transform filterValues into chip data
  const chips = useMemo(() => {
    const result: ChipData[] = [];

    Object.entries(filterValues).forEach(([key, value]) => {
      // Skip system filters
      if (SYSTEM_FILTERS.includes(key) || value === undefined || value === null) {
        return;
      }

      const config = filterConfig.find((c) => c.key === key);
      const category = config?.label ?? key;
      const values = Array.isArray(value) ? value : [value];

      values.forEach((v) => {
        let label: string;

        if (config?.formatLabel) {
          label = config.formatLabel(v);
        } else if (config?.choices) {
          const choice = config.choices.find((c) => c.id === v);
          label = choice?.name ?? String(v);
        } else if (config?.reference === 'organizations' || key === 'organization_id') {
          label = getOrganizationName(String(v));
        } else if (config?.reference === 'sales' || key === 'sales_id') {
          label = getSalesName(String(v));
        } else if (config?.reference === 'tags' || key === 'tags') {
          label = getTagName(String(v));
        } else if (config?.reference === 'segments' || key === 'segment_id') {
          label = getSegmentName(String(v));
        } else {
          label = String(v);
        }

        result.push({ key, value: v as string | number, label, category });
      });
    });

    return result;
  }, [filterValues, filterConfig, getOrganizationName, getSalesName, getTagName, getSegmentName]);

  const removeFilter = useCallback(
    (key: string, value?: string | number) => {
      // Find the config for this key to check for removal groups
      const config = filterConfig.find((c) => c.key === key);

      // Get all keys to remove (supports grouped removal for date ranges, etc.)
      const keysToRemove: string[] = config?.removalGroup
        ? removalGroups.get(config.removalGroup) || [key]
        : [key];

      const currentValue = filterValues[key];

      if (Array.isArray(currentValue) && value !== undefined && keysToRemove.length === 1) {
        // Single key, array value - remove just that value
        const newArray = currentValue.filter((v) => v !== value);
        setFilters(
          { ...filterValues, [key]: newArray.length ? newArray : undefined },
          displayedFilters
        );
      } else {
        // Remove all keys in the group
        const newFilters = { ...filterValues };
        keysToRemove.forEach((k) => {
          delete newFilters[k];
        });
        setFilters(newFilters, displayedFilters);
      }
    },
    [filterValues, setFilters, displayedFilters, filterConfig, removalGroups]
  );

  const clearAllFilters = useCallback(() => {
    const preserved = Object.fromEntries(
      Object.entries(filterValues).filter(([key]) => SYSTEM_FILTERS.includes(key))
    );
    setFilters(preserved, displayedFilters);
  }, [filterValues, setFilters, displayedFilters]);

  const activeCount = chips.length;
  const hasActiveFilters = activeCount > 0;

  return { chips, removeFilter, clearAllFilters, hasActiveFilters, activeCount };
}
```

**Verification:**
```bash
grep -q "useFilterChipBar" src/atomic-crm/filters/useFilterChipBar.ts && echo "PASS"
```

**Constitution Checklist:**
- [x] Uses unifiedDataProvider (via existing name hooks)
- [x] Fail-fast (throws if context missing)
- [x] No retry logic
- [x] Single source of truth (useListContext)

---

### Task 1.3: Enhance FilterChip Component for 44px Touch Targets

**File:** `src/atomic-crm/filters/FilterChip.tsx` (MODIFY EXISTING)
**Time:** 3-5 min
**Dependencies:** None (can run parallel with 1.2)

**Purpose:** Enhance existing FilterChip with 44px touch targets for iPad accessibility.

**EXISTING CODE (before):**
```typescript
// Current implementation lacks 44px touch targets
<div className="inline-flex items-center gap-1 pl-3 text-xs rounded-full bg-muted">
  <span className="truncate max-w-[200px]">{label}</span>
  <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/50" ...>
```

**ENHANCED CODE (after):**
```typescript
// src/atomic-crm/filters/FilterChip.tsx
import React from "react";
import { X } from "lucide-react";
import { Button } from "../../components/ui/button";
import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  className?: string;
}

/**
 * Individual filter chip component with remove functionality.
 * ENHANCED: 44px minimum touch targets for iPad accessibility.
 */
export const FilterChip: React.FC<FilterChipProps> = ({ label, onRemove, className }) => {
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 pl-3 pr-1 text-sm rounded-full",
        "bg-muted hover:bg-muted/90 transition-colors",
        "min-h-[2.75rem]", // 44px touch target height
        className
      )}
    >
      <span className="truncate max-w-[150px]">{label}</span>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "rounded-full hover:bg-accent/50",
          "h-9 w-9", // Larger button for touch
          "focus:outline-none focus:ring-2 focus:ring-ring"
        )}
        onClick={handleRemove}
        aria-label={`Remove ${label} filter`}
      >
        <X className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
};
```

**Key Changes:**
1. Added `min-h-[2.75rem]` for 44px height
2. Increased button size to `h-9 w-9` (36px, close to 44px target)
3. Added optional `className` prop for customization
4. Updated text from `text-xs` to `text-sm` for readability

**Verification:**
```bash
grep -q "min-h-\[2.75rem\]" src/atomic-crm/filters/FilterChip.tsx && echo "PASS: 44px touch target"
```

**Constitution Checklist:**
- [x] 44px touch targets (`min-h-[2.75rem]`)
- [x] Semantic colors (uses Badge variant)
- [x] aria-label for accessibility
- [x] No hardcoded hex values

---

### Task 1.4: Create FilterChipBar Component

**File:** `src/atomic-crm/filters/FilterChipBar.tsx` (NEW)
**Time:** 5 min
**Dependencies:** Tasks 1.2, 1.3

**Purpose:** Horizontal bar displaying active filters above datagrid.

```typescript
// src/atomic-crm/filters/FilterChipBar.tsx
import { useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { FilterConfig } from './filterConfigSchema';
import { useFilterChipBar } from './useFilterChipBar';
import { FilterChip } from './FilterChip';

interface FilterChipBarProps {
  filterConfig: FilterConfig[];
  className?: string;
}

/**
 * Horizontal bar displaying active filters as removable chips.
 * Placed ABOVE the datagrid for maximum visibility.
 */
export function FilterChipBar({ filterConfig, className }: FilterChipBarProps) {
  const chipBarRef = useRef<HTMLDivElement>(null);

  // Fail-fast: config required
  if (!filterConfig || filterConfig.length === 0) {
    throw new Error(
      'FilterChipBar requires a non-empty filterConfig. ' +
      'Check that the feature has defined its filter configuration.'
    );
  }

  const { chips, removeFilter, clearAllFilters, hasActiveFilters, activeCount } =
    useFilterChipBar(filterConfig);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const buttons = chipBarRef.current?.querySelectorAll('button[aria-label^="Remove"]');
    if (!buttons?.length) return;

    const currentIndex = Array.from(buttons).findIndex(
      (btn) => btn === document.activeElement
    );

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        (buttons[(currentIndex + 1) % buttons.length] as HTMLElement).focus();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        (buttons[currentIndex <= 0 ? buttons.length - 1 : currentIndex - 1] as HTMLElement).focus();
        break;
      case 'Home':
        e.preventDefault();
        (buttons[0] as HTMLElement).focus();
        break;
      case 'End':
        e.preventDefault();
        (buttons[buttons.length - 1] as HTMLElement).focus();
        break;
    }
  }, []);

  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div
      ref={chipBarRef}
      role="toolbar"
      aria-label="Active filters"
      aria-orientation="horizontal"
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-center gap-2 px-4 py-2 bg-muted/50 border-b overflow-x-auto',
        className
      )}
    >
      <span
        id="filter-chip-bar-label"
        className="text-sm text-muted-foreground whitespace-nowrap"
      >
        Active filters:
      </span>
      <div
        role="list"
        aria-labelledby="filter-chip-bar-label"
        className="flex items-center gap-1.5 flex-wrap"
      >
        {chips.map((chip) => (
          <div key={`${chip.key}-${chip.value}`} role="listitem">
            <FilterChip
              label={chip.label}
              onRemove={() => removeFilter(chip.key, chip.value)}
            />
          </div>
        ))}
      </div>
      {activeCount >= 2 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="ml-auto whitespace-nowrap text-muted-foreground hover:text-foreground"
          aria-label={`Clear all ${activeCount} filters`}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
```

**Verification:**
```bash
grep -q 'role="toolbar"' src/atomic-crm/filters/FilterChipBar.tsx && echo "PASS: ARIA toolbar"
```

**Constitution Checklist:**
- [x] Fail-fast (throws if no config)
- [x] ARIA roles (toolbar, list, listitem)
- [x] Keyboard navigation
- [x] Semantic colors (bg-muted, text-muted-foreground)

---

### Task 1.5: Create useSegmentNames Hook (if not existing)

**Files:**
- `src/atomic-crm/filters/hooks/useSegmentNames.ts` (NEW)
- `src/atomic-crm/filters/types/resourceTypes.ts` (MODIFY - add Segment extractor)

**Time:** 5-8 min
**Dependencies:** None

**Purpose:** Lazy-load segment names for chip display using established pattern.

**⚠️ IMPORTANT:** Must follow the existing `useResourceNamesBase` pattern for:
- Type safety
- Caching
- Consistency with other name hooks

**Check existing pattern first:**
```bash
cat src/atomic-crm/filters/hooks/useResourceNamesBase.ts
cat src/atomic-crm/filters/types/resourceTypes.ts
```

**Step 1: Add Segment extractor to resourceTypes.ts:**
```typescript
// Add to src/atomic-crm/filters/types/resourceTypes.ts
export const segmentExtractor: ResourceExtractor = {
  resource: 'segments',
  extractName: (record) => record.name,
  fallbackName: (id) => `Playbook ${id.slice(0, 8)}...`,
};
```

**Step 2: Create hook using useResourceNamesBase:**
```typescript
// src/atomic-crm/filters/hooks/useSegmentNames.ts
import { useResourceNamesBase } from './useResourceNamesBase';
import { segmentExtractor } from '../types/resourceTypes';

export function useSegmentNames(ids: string[]) {
  const { getResourceName, isLoading } = useResourceNamesBase(ids, segmentExtractor);

  return {
    getSegmentName: getResourceName,
    isLoading,
  };
}
```

**Verification:**
```bash
# Ensure hook follows pattern
grep -q "useResourceNamesBase" src/atomic-crm/filters/hooks/useSegmentNames.ts && echo "PASS: Uses base hook"
npx tsc --noEmit 2>&1 | grep -i "useSegmentNames" && echo "FAIL: Type errors" || echo "PASS: Types OK"
```

---

### Task 1.6: Create FilterSidebar Wrapper

**File:** `src/atomic-crm/filters/FilterSidebar.tsx` (NEW)
**Time:** 3 min
**Dependencies:** None

**Purpose:** Standardized sidebar wrapper for consistent layout.

```typescript
// src/atomic-crm/filters/FilterSidebar.tsx
import { FilterLiveForm } from 'react-admin';
import { SearchInput } from '@/components/admin/search-input';
import { cn } from '@/lib/utils';

interface FilterSidebarProps {
  children: React.ReactNode;
  searchPlaceholder?: string;
  showSearch?: boolean;
  className?: string;
}

/**
 * Standardized sidebar wrapper for all list filter UIs.
 * Ensures consistent layout, spacing, and behavior across features.
 */
export function FilterSidebar({
  children,
  searchPlaceholder = 'Search...',
  showSearch = true,
  className,
}: FilterSidebarProps) {
  return (
    <div className={cn('flex flex-col gap-4 p-4', className)}>
      {showSearch && (
        <FilterLiveForm>
          <SearchInput source="q" placeholder={searchPlaceholder} />
        </FilterLiveForm>
      )}
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}
```

**Verification:**
```bash
grep -q "FilterSidebar" src/atomic-crm/filters/FilterSidebar.tsx && echo "PASS"
```

---

### Task 1.7: Update Filter Exports

**File:** `src/atomic-crm/filters/index.ts` (MODIFY)
**Time:** 2 min
**Dependencies:** Tasks 1.1-1.6

**Purpose:** Export new components from the filters module.

Add these exports to the existing file:

```typescript
// Add to src/atomic-crm/filters/index.ts
export { FilterChipBar } from './FilterChipBar';
export { FilterChip } from './FilterChip';
export { FilterSidebar } from './FilterSidebar';
export { useFilterChipBar } from './useFilterChipBar';
export { useSegmentNames } from './useSegmentNames';
export { validateFilterConfig } from './filterConfigSchema';
export type { FilterConfig, FilterChoice } from './filterConfigSchema';
export type { ChipData, UseFilterChipBarReturn } from './useFilterChipBar';
```

**Verification:**
```bash
grep -q "FilterChipBar" src/atomic-crm/filters/index.ts && echo "PASS"
```

---

## Phase 2: Feature Configurations (Parallel Group A)

These tasks can ALL run in parallel - they have no dependencies on each other.

### Task 2.1: Organizations Filter Config

**File:** `src/atomic-crm/organizations/organizationFilterConfig.ts` (NEW)
**Time:** 3 min
**Dependencies:** Task 1.1
**Parallel:** Can run with 2.2, 2.3

```typescript
// src/atomic-crm/organizations/organizationFilterConfig.ts
import { validateFilterConfig } from '../filters/filterConfigSchema';
// ⚠️ IMPORTANT: Import from existing constants to avoid label drift
import {
  ORGANIZATION_TYPE_CHOICES,
  PRIORITY_CHOICES,
} from './constants';

export const ORGANIZATION_FILTER_CONFIG = validateFilterConfig([
  {
    key: 'organization_type',
    label: 'Type',
    type: 'multiselect',
    choices: ORGANIZATION_TYPE_CHOICES,
  },
  {
    key: 'priority',
    label: 'Priority',
    type: 'multiselect',
    choices: PRIORITY_CHOICES,
  },
  {
    key: 'segment_id',
    label: 'Playbook',
    type: 'reference',
    reference: 'segments',
  },
  {
    key: 'sales_id',
    label: 'Owner',
    type: 'reference',
    reference: 'sales',
  },
]);
```

**⚠️ CRITICAL:** Always import choices from existing constants files to prevent label drift between chip bar and sidebar. Check `src/atomic-crm/organizations/constants.ts` for canonical definitions.

---

### Task 2.2: Contacts Filter Config

**File:** `src/atomic-crm/contacts/contactFilterConfig.ts` (NEW)
**Time:** 3 min
**Dependencies:** Task 1.1
**Parallel:** Can run with 2.1, 2.3

```typescript
// src/atomic-crm/contacts/contactFilterConfig.ts
import { validateFilterConfig } from '../filters/filterConfigSchema';
import { format, isToday, isThisWeek, isThisMonth } from 'date-fns';

function formatDateLabel(value: unknown): string {
  if (!value || typeof value !== 'string') return String(value);

  const date = new Date(value);
  if (isToday(date)) return 'Today';
  if (isThisWeek(date)) return 'This week';
  if (isThisMonth(date)) return 'This month';
  return format(date, 'MMM d, yyyy');
}

export const CONTACT_FILTER_CONFIG = validateFilterConfig([
  {
    key: 'tags',
    label: 'Tag',
    type: 'multiselect',
    reference: 'tags',
  },
  {
    key: 'organization_id',
    label: 'Organization',
    type: 'reference',
    reference: 'organizations',
  },
  {
    key: 'last_seen@gte',
    label: 'Activity after',
    type: 'date-range',
    formatLabel: formatDateLabel,
    // Group with @lte so removing either clears both (preserves existing behavior)
    removalGroup: 'last_seen_range',
  },
  {
    key: 'last_seen@lte',
    label: 'Activity before',
    type: 'date-range',
    formatLabel: formatDateLabel,
    // Group with @gte so removing either clears both (preserves existing behavior)
    removalGroup: 'last_seen_range',
  },
  {
    key: 'sales_id',
    label: 'Owner',
    type: 'reference',
    reference: 'sales',
  },
]);
```

---

### Task 2.3: Products Filter Config

**File:** `src/atomic-crm/products/productFilterConfig.ts` (NEW)
**Time:** 3 min
**Dependencies:** Task 1.1
**Parallel:** Can run with 2.1, 2.2

```typescript
// src/atomic-crm/products/productFilterConfig.ts
import { validateFilterConfig } from '../filters/filterConfigSchema';

const PRODUCT_STATUS_CHOICES = [
  { id: 'active', name: 'Active' },
  { id: 'discontinued', name: 'Discontinued' },
  { id: 'coming_soon', name: 'Coming Soon' },
];

export const PRODUCT_FILTER_CONFIG = validateFilterConfig([
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    choices: PRODUCT_STATUS_CHOICES,
  },
  {
    key: 'category',
    label: 'Category',
    type: 'select',
    // Choices loaded dynamically from distinct_product_categories view
  },
  {
    key: 'principal_id',
    label: 'Principal',
    type: 'reference',
    reference: 'organizations',
  },
]);
```

---

## Phase 3A: Primary Feature Integration (Parallel Group B)

These tasks can ALL run in parallel - they modify different files.

**⚠️ Loading State Requirement:** Mount FilterChipBar in BOTH loading and loaded states to maintain filter visibility during data refetch.

### Task 3.1: Integrate FilterChipBar into OrganizationList

**File:** `src/atomic-crm/organizations/OrganizationList.tsx` (MODIFY)
**Time:** 3-5 min
**Dependencies:** Tasks 1.4, 2.1
**Parallel:** Can run with 3.2, 3.3

**CRITICAL ARCHITECTURE NOTE:**
The list views use `StandardListLayout` which provides a two-column layout (sidebar + main).
The `FilterChipBar` must go INSIDE `StandardListLayout` but ABOVE `PremiumDatagrid`.

**Changes:**
1. Import `FilterChipBar` and `ORGANIZATION_FILTER_CONFIG`
2. Add `<FilterChipBar>` INSIDE `StandardListLayout`, BEFORE `PremiumDatagrid`
3. **IMPORTANT:** Also add FilterChipBar in loading/skeleton branch to maintain visibility during refetch

```typescript
// Add imports at top of file
import { FilterChipBar } from '../filters';
import { ORGANIZATION_FILTER_CONFIG } from './organizationFilterConfig';

// Inside OrganizationListLayout component, modify the return statement:
// BEFORE:
<StandardListLayout resource="organizations" filterComponent={<OrganizationListFilter />}>
  <PremiumDatagrid ...>
    ...
  </PremiumDatagrid>
</StandardListLayout>

// AFTER:
<StandardListLayout resource="organizations" filterComponent={<OrganizationListFilter />}>
  <FilterChipBar filterConfig={ORGANIZATION_FILTER_CONFIG} />
  <PremiumDatagrid ...>
    ...
  </PremiumDatagrid>
</StandardListLayout>

// ⚠️ ALSO update loading/skeleton branch (if separate):
// If there's a loading state that returns early with skeleton, add:
<FilterChipBar filterConfig={ORGANIZATION_FILTER_CONFIG} />
// before the skeleton to maintain filter context during loading
```

**Note:** The FilterChipBar renders inside `<main className="card-container">` which wraps children in StandardListLayout. This places it visually above the datagrid, inside the main content card.

**Loading State UX:** Users see active filters persist during data refetch, reducing confusion about "why did my filters disappear?"

**Verification:**
```bash
grep -q "FilterChipBar" src/atomic-crm/organizations/OrganizationList.tsx && echo "PASS"
```

---

### Task 3.2: Integrate FilterChipBar into ContactList

**File:** `src/atomic-crm/contacts/ContactList.tsx` (MODIFY)
**Time:** 3-5 min
**Dependencies:** Tasks 1.4, 2.2
**Parallel:** Can run with 3.1, 3.3

**Changes:**
1. Import `FilterChipBar` and `CONTACT_FILTER_CONFIG`
2. Add `<FilterChipBar>` above the datagrid

```typescript
// Add imports
import { FilterChipBar } from '../filters';
import { CONTACT_FILTER_CONFIG } from './contactFilterConfig';

// Inside the List component, add before the datagrid:
<FilterChipBar filterConfig={CONTACT_FILTER_CONFIG} />
```

---

### Task 3.3: Integrate FilterChipBar into ProductList

**File:** `src/atomic-crm/products/ProductList.tsx` (MODIFY)
**Time:** 3-5 min
**Dependencies:** Tasks 1.4, 2.3
**Parallel:** Can run with 3.1, 3.2

**Changes:**
1. Import `FilterChipBar` and `PRODUCT_FILTER_CONFIG`
2. Add `<FilterChipBar>` above the datagrid

```typescript
// Add imports
import { FilterChipBar } from '../filters';
import { PRODUCT_FILTER_CONFIG } from './productFilterConfig';

// Inside the List component, add before the datagrid:
<FilterChipBar filterConfig={PRODUCT_FILTER_CONFIG} />
```

---

## Phase 3B: Extended Feature Integration (Parallel Group B2)

These tasks extend chip bar to remaining lists. Can ALL run in parallel.

**⚠️ Loading State Requirement:** Mount FilterChipBar in BOTH loading and loaded states.

### Task 3.4: Create Opportunity Filter Config

**File:** `src/atomic-crm/opportunities/opportunityFilterConfig.ts` (NEW)
**Time:** 5 min
**Dependencies:** Task 1.1
**Parallel:** Can run with 3.5, 3.6

```typescript
// src/atomic-crm/opportunities/opportunityFilterConfig.ts
import { validateFilterConfig } from '../filters/filterConfigSchema';
// Import existing choices to avoid label drift
import { STAGE_CHOICES, STATUS_CHOICES } from './constants/filterChoices';

export const OPPORTUNITY_FILTER_CONFIG = validateFilterConfig([
  {
    key: 'stage',
    label: 'Stage',
    type: 'multiselect',
    choices: STAGE_CHOICES,
  },
  {
    key: 'principal_id',
    label: 'Principal',
    type: 'reference',
    reference: 'organizations',
  },
  {
    key: 'sales_id',
    label: 'Owner',
    type: 'reference',
    reference: 'sales',
  },
]);
```

---

### Task 3.5: Create Activity Filter Config

**File:** `src/atomic-crm/activities/activityFilterConfig.ts` (NEW)
**Time:** 3 min
**Dependencies:** Task 1.1
**Parallel:** Can run with 3.4, 3.6

```typescript
// src/atomic-crm/activities/activityFilterConfig.ts
import { validateFilterConfig } from '../filters/filterConfigSchema';
import { ACTIVITY_TYPE_CHOICES } from './constants';

export const ACTIVITY_FILTER_CONFIG = validateFilterConfig([
  {
    key: 'activity_type',
    label: 'Type',
    type: 'multiselect',
    choices: ACTIVITY_TYPE_CHOICES,
  },
  {
    key: 'sales_id',
    label: 'Owner',
    type: 'reference',
    reference: 'sales',
  },
  {
    key: 'created_at@gte',
    label: 'After',
    type: 'date-range',
    removalGroup: 'created_at_range',
  },
  {
    key: 'created_at@lte',
    label: 'Before',
    type: 'date-range',
    removalGroup: 'created_at_range',
  },
]);
```

---

### Task 3.6: Create Task Filter Config

**File:** `src/atomic-crm/tasks/taskFilterConfig.ts` (NEW)
**Time:** 3 min
**Dependencies:** Task 1.1
**Parallel:** Can run with 3.4, 3.5

```typescript
// src/atomic-crm/tasks/taskFilterConfig.ts
import { validateFilterConfig } from '../filters/filterConfigSchema';
import { TASK_STATUS_CHOICES, TASK_PRIORITY_CHOICES } from './constants';

export const TASK_FILTER_CONFIG = validateFilterConfig([
  {
    key: 'status',
    label: 'Status',
    type: 'multiselect',
    choices: TASK_STATUS_CHOICES,
  },
  {
    key: 'priority',
    label: 'Priority',
    type: 'multiselect',
    choices: TASK_PRIORITY_CHOICES,
  },
  {
    key: 'assigned_to',
    label: 'Assigned To',
    type: 'reference',
    reference: 'sales',
  },
  {
    key: 'due_date@gte',
    label: 'Due after',
    type: 'date-range',
    removalGroup: 'due_date_range',
  },
  {
    key: 'due_date@lte',
    label: 'Due before',
    type: 'date-range',
    removalGroup: 'due_date_range',
  },
]);
```

---

### Task 3.7: Integrate FilterChipBar into OpportunityList

**File:** `src/atomic-crm/opportunities/OpportunityList.tsx` (MODIFY)
**Time:** 3-5 min
**Dependencies:** Tasks 1.4, 3.4
**Parallel:** Can run with 3.8, 3.9

**Changes:** Same pattern as Task 3.1 - import, add above datagrid, include in loading state.

```typescript
import { FilterChipBar } from '../filters';
import { OPPORTUNITY_FILTER_CONFIG } from './opportunityFilterConfig';

// Add before datagrid (and in loading branch):
<FilterChipBar filterConfig={OPPORTUNITY_FILTER_CONFIG} />
```

---

### Task 3.8: Integrate FilterChipBar into ActivityList

**File:** `src/atomic-crm/activities/ActivityList.tsx` (MODIFY)
**Time:** 3-5 min
**Dependencies:** Tasks 1.4, 3.5
**Parallel:** Can run with 3.7, 3.9

**Changes:** Same pattern as Task 3.1.

```typescript
import { FilterChipBar } from '../filters';
import { ACTIVITY_FILTER_CONFIG } from './activityFilterConfig';

<FilterChipBar filterConfig={ACTIVITY_FILTER_CONFIG} />
```

---

### Task 3.9: Integrate FilterChipBar into TaskList

**File:** `src/atomic-crm/tasks/TaskList.tsx` (MODIFY)
**Time:** 3-5 min
**Dependencies:** Tasks 1.4, 3.6
**Parallel:** Can run with 3.7, 3.8

**Changes:** Same pattern as Task 3.1.

```typescript
import { FilterChipBar } from '../filters';
import { TASK_FILTER_CONFIG } from './taskFilterConfig';

<FilterChipBar filterConfig={TASK_FILTER_CONFIG} />
```

---

## Phase 4: Sidebar Standardization (Parallel Group C)

### Task 4.1: Update OrganizationListFilter to use FilterSidebar

**File:** `src/atomic-crm/organizations/OrganizationListFilter.tsx` (MODIFY)
**Time:** 3-5 min
**Dependencies:** Task 1.5
**Parallel:** Can run with 4.2, 4.3

**Changes:**
1. Import `FilterSidebar`
2. Wrap existing filter categories with `<FilterSidebar>`
3. Remove old `SidebarActiveFilters` (now handled by FilterChipBar)

```typescript
// Add import
import { FilterSidebar } from '../filters';

// Replace root wrapper:
// NOTE: showSearch={false} because existing filter already has SearchInput
export function OrganizationListFilter() {
  return (
    <FilterSidebar showSearch={false}>
      {/* Keep existing FilterCategory components - they already include search */}
      <FilterCategory icon={<Building2 />} label="Organization Type">
        {/* existing content */}
      </FilterCategory>
      {/* ... other categories */}
    </FilterSidebar>
  );
}
```

**IMPORTANT:** Set `showSearch={false}` to avoid rendering duplicate search inputs. The existing filter components already include their own search blocks.

---

### Task 4.2: Update ContactListFilter to use FilterSidebar

**File:** `src/atomic-crm/contacts/ContactListFilter.tsx` (MODIFY)
**Time:** 3-5 min
**Dependencies:** Task 1.5
**Parallel:** Can run with 4.1, 4.3

Same pattern as 4.1 - wrap with `<FilterSidebar showSearch={false}>`, remove old active filters display.

**IMPORTANT:** Use `showSearch={false}` - existing filter already has search block.

---

### Task 4.3: Update ProductListFilter to use FilterSidebar

**File:** `src/atomic-crm/products/ProductListFilter.tsx` (MODIFY)
**Time:** 3-5 min
**Dependencies:** Task 1.5
**Parallel:** Can run with 4.1, 4.2

Same pattern as 4.1 - wrap with `<FilterSidebar showSearch={false}>`.

**IMPORTANT:** Use `showSearch={false}` - existing filter already has search block.

---

## Phase 5: Cleanup & Code Quality (Sequential)

This phase removes deprecated code, consolidates duplicates, and ensures consistency.

### Task 5.1: Remove Deprecated SidebarActiveFilters Components

**Files to DELETE:**
- `src/atomic-crm/organizations/SidebarActiveFilters.tsx`
- `src/atomic-crm/contacts/SidebarActiveFilters.tsx`

**Files to UPDATE (remove imports):**
- `src/atomic-crm/organizations/OrganizationListFilter.tsx` - Remove SidebarActiveFilters import/usage
- `src/atomic-crm/contacts/ContactListFilter.tsx` - Remove SidebarActiveFilters import/usage

**⚠️ TEST FILES TO UPDATE (remove mocks):**
- `src/atomic-crm/contacts/__tests__/ContactList.test.tsx` - Remove SidebarActiveFilters mock (lines ~223-231)

**Time:** 5-8 min
**Dependencies:** All Phase 4 tasks complete

**Verification:**
```bash
# Ensure no references remain in source files
grep -r "SidebarActiveFilters" src/atomic-crm/ && echo "FAIL: References remain" || echo "PASS: Cleaned up"

# Ensure no mocks remain in test files
grep -r "SidebarActiveFilters" src/atomic-crm/**/__tests__/ && echo "FAIL: Test mocks remain" || echo "PASS: Test mocks cleaned"
```

---

### Task 5.2: Remove Deprecated Feature-Specific Filter Chip Hooks

**Files to DELETE (if no longer used):**
- `src/atomic-crm/organizations/useOrganizationFilterChips.ts`
- `src/atomic-crm/contacts/useContactFilterChips.ts`

**Before deleting, verify no imports exist:**
```bash
grep -r "useOrganizationFilterChips" src/ --include="*.tsx" --include="*.ts"
grep -r "useContactFilterChips" src/ --include="*.tsx" --include="*.ts"
```

**Time:** 3 min
**Dependencies:** Task 5.1

---

### Task 5.3: Remove Deprecated FilterChipsPanel (if replaced)

**File to evaluate:**
- `src/atomic-crm/filters/FilterChipsPanel.tsx` - May be redundant with FilterChipBar

**Decision criteria:**
- If FilterChipsPanel is only used by SidebarActiveFilters → DELETE
- If used elsewhere → KEEP

**Verification:**
```bash
grep -r "FilterChipsPanel" src/ --include="*.tsx" --include="*.ts" | grep -v "FilterChipsPanel.tsx"
```

**Time:** 3 min
**Dependencies:** Task 5.2

---

### Task 5.4: Consolidate Filter Type Definitions (CAREFUL)

**Purpose:** Ensure no duplicate type definitions exist WITHOUT breaking existing code.

**Files to check:**
- `src/atomic-crm/filters/types.ts` - Existing types
- `src/atomic-crm/filters/filterConfigSchema.ts` - New Zod-inferred types

**⚠️ COMPATIBILITY WARNING:**
Existing opportunity filter configs (`src/atomic-crm/opportunities/constants/filterChoices.ts`) may use types not covered by the new schema. Do NOT blindly replace exports.

**Action:**
1. Review both files for overlapping types
2. **DO NOT replace existing exports if they differ** - add new types alongside
3. If existing `FilterConfig` type has different properties, rename new type to `ChipBarFilterConfig`
4. Export BOTH types from index.ts to avoid breaking changes
5. Add deprecation comments to old types if planning future migration

**Time:** 8 min
**Dependencies:** Task 5.3

**Verification:**
```bash
# Check that existing opportunity imports still work
npx tsc --noEmit 2>&1 | grep -i "filterConfig" && echo "FAIL: Type errors" || echo "PASS: Types compatible"
```

---

### Task 5.5: Update Filter Index Exports

**File:** `src/atomic-crm/filters/index.ts` (MODIFY)
**Time:** 3 min
**Dependencies:** Tasks 5.1-5.4

**Actions:**
1. Remove exports for deleted files (SidebarActiveFilters, deprecated hooks)
2. Add exports for new files (FilterChipBar, FilterSidebar, filterConfigSchema)
3. Ensure no broken imports

**Updated exports should include:**
```typescript
// Components
export { FilterChip } from "./FilterChip";
export { FilterChipBar } from "./FilterChipBar";
export { FilterSidebar } from "./FilterSidebar";
export { FilterCategory } from "./FilterCategory";
// Remove: FilterChipsPanel (if deleted)

// Hooks
export { useFilterChipBar } from "./useFilterChipBar";
export { useFilterManagement } from "./useFilterManagement";
export { useOrganizationNames } from "./useOrganizationNames";
export { useSalesNames } from "./useSalesNames";
export { useTagNames } from "./useTagNames";
export { useSegmentNames } from "./useSegmentNames";

// Schema & Types
export { validateFilterConfig } from "./filterConfigSchema";
export type { FilterConfig, FilterChoice } from "./filterConfigSchema";
export type { ChipData, UseFilterChipBarReturn } from "./useFilterChipBar";

// Utilities
export * from "./filterFormatters";
export * from "./filterPrecedence";
```

**Verification:**
```bash
# Check for broken imports after cleanup
npm run build 2>&1 | grep -i "error" && echo "FAIL: Build errors" || echo "PASS: Build clean"
```

---

### Task 5.6: Run Linting & Fix Issues

**Purpose:** Ensure code quality and consistency.

**Commands:**
```bash
# Run ESLint on ALL modified directories
npx eslint src/atomic-crm/filters/ --fix
npx eslint src/atomic-crm/organizations/ --fix
npx eslint src/atomic-crm/contacts/ --fix
npx eslint src/atomic-crm/products/ --fix
npx eslint src/atomic-crm/opportunities/ --fix
npx eslint src/atomic-crm/activities/ --fix
npx eslint src/atomic-crm/tasks/ --fix

# Run TypeScript compiler check
npx tsc --noEmit
```

**Time:** 5-8 min
**Dependencies:** Task 5.5

**Fix any issues:**
- Unused imports
- Missing type annotations
- Inconsistent formatting

---

### Task 5.7: Verify No Console Errors at Runtime (ALL 6 LISTS)

**Purpose:** Smoke test the implementation across all list pages.

**Steps:**
1. Start dev server: `npm run dev`
2. Navigate to Organizations list → Apply a filter → Verify chip appears
3. Navigate to Contacts list → Apply a filter → Verify chip appears
4. Navigate to Products list → Apply a filter → Verify chip appears
5. Navigate to Opportunities list → Apply a filter → Verify chip appears
6. Navigate to Activities list → Apply a filter → Verify chip appears
7. Navigate to Tasks list → Apply a filter → Verify chip appears
8. Check browser console for errors

**Time:** 10 min
**Dependencies:** Task 5.6

**Pass criteria:**
- [ ] No console errors
- [ ] No React warnings
- [ ] FilterChipBar renders on ALL SIX pages
- [ ] Removing chips works correctly
- [ ] "Clear all" works when 2+ filters active
- [ ] Date range filters remove together (verify removalGroup)
- [ ] Segment names display correctly (not UUIDs)
- [ ] Chip bar persists during loading/refetch

---

## Phase 6: Testing (Sequential)

### Task 6.1: Unit Tests for FilterChipBar

**File:** `src/atomic-crm/filters/__tests__/FilterChipBar.test.tsx` (NEW)
**Time:** 10-15 min
**Dependencies:** All Phase 1-4 tasks

Write tests covering:
- Renders nothing when no filters active
- Renders chip bar when filters are active
- Shows "Clear all" button when 2+ filters
- Removes single filter on chip X click
- Clears all filters on "Clear all" click
- ARIA roles present

---

### Task 6.2: Unit Tests for useFilterChipBar

**File:** `src/atomic-crm/filters/__tests__/useFilterChipBar.test.tsx` (NEW)
**Time:** 10 min
**Dependencies:** Task 6.1

Write tests covering:
- Transforms filterValues into labeled chips
- Flattens array values into individual chips
- Calculates activeCount correctly
- Excludes system filters from count

---

### Task 6.3: E2E Test for Filter Chip Bar

**File:** `tests/e2e/filters/filter-chip-bar.spec.ts` (NEW)
**Time:** 15 min
**Dependencies:** Tasks 6.1, 6.2

Write Playwright tests covering:
- Chip bar hidden when no filters
- Chip bar appears when filter applied
- Removing chip updates datagrid
- Clear all removes all filters
- Filter persists in URL
- Consistent behavior across Orgs/Contacts/Products

---

## Execution Order Summary

```
PHASE 1 (Sequential): Foundation
  1.1 → 1.2 → 1.4
  1.3 (parallel with 1.2)
  1.5 useSegmentNames (parallel with 1.2-1.4, uses useResourceNamesBase)
  1.6 FilterSidebar (parallel with 1.2-1.4)
  1.7 (after all above)

PHASE 2 (Parallel Group A): Primary Configs
  2.1 Organizations ┐
  2.2 Contacts      ├─ All parallel (import from existing constants!)
  2.3 Products      ┘

PHASE 3A (Parallel Group B): Primary List Integration
  3.1 OrganizationList ┐
  3.2 ContactList      ├─ All parallel (include in loading states!)
  3.3 ProductList      ┘

PHASE 3B (Parallel Group B2): Extended List Integration
  3.4 Opportunity Config ┐
  3.5 Activity Config    ├─ All parallel
  3.6 Task Config        ┘
  3.7 OpportunityList ┐
  3.8 ActivityList    ├─ All parallel (include in loading states!)
  3.9 TaskList        ┘

PHASE 4 (Parallel Group C): Sidebar Standardization
  4.1 ┐
  4.2 ├─ All parallel (all use showSearch={false})
  4.3 ┘

PHASE 5 (Sequential): Cleanup & Code Quality
  5.1 Delete SidebarActiveFilters + UPDATE TESTS
  5.2 Delete deprecated filter hooks
  5.3 Evaluate FilterChipsPanel removal
  5.4 Consolidate type definitions (CAREFUL - don't break opportunities)
  5.5 Update index exports
  5.6 Run linting & fix issues
  5.7 Runtime smoke test (ALL 6 lists!)

PHASE 6 (Sequential): Testing
  6.1 → 6.2 → 6.3
```

**Total Tasks:** 33
**Changes from review (Round 2):**
- Task 1.5 rewritten to use useResourceNamesBase pattern
- Added Phase 3B for Opportunities, Activities, Tasks (6 new tasks)
- Task 2.1 imports from existing constants.ts
- All list integration tasks include loading state requirement
- Verification checklist expanded to all 6 lists

---

## Verification Checklist

Before marking complete, verify:

**All 6 Lists:**
- [ ] FilterChipBar appears above datagrid on Organizations page
- [ ] FilterChipBar appears above datagrid on Contacts page
- [ ] FilterChipBar appears above datagrid on Products page
- [ ] FilterChipBar appears above datagrid on Opportunities page
- [ ] FilterChipBar appears above datagrid on Activities page
- [ ] FilterChipBar appears above datagrid on Tasks page

**Chip Bar Functionality:**
- [ ] Clicking × on a chip removes that filter
- [ ] "Clear all" removes all filters (when 2+ active)
- [ ] Date range filters remove together (removalGroup working)
- [ ] Filters sync to URL (can share filtered views)
- [ ] ChipBar persists during loading states (no flicker)

**Accessibility:**
- [ ] 44px touch targets work on iPad/tablet
- [ ] Keyboard navigation works (arrow keys, Home, End)
- [ ] Screen reader announces chip labels correctly

**Quality:**
- [ ] No console errors
- [ ] All tests pass
- [ ] Segment names resolve (not raw UUIDs)
- [ ] Labels match sidebar (no constant drift)

---

## Rollback Plan

If issues arise:
1. Revert changes to List files (OrganizationList, ContactList, ProductList)
2. Keep new components but don't use them
3. Original filter UX still works as fallback
