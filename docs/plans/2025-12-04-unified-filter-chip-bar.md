# Implementation Plan: Unified Filter Chip Bar + Standardized Sidebar

**Date:** 2025-12-04
**Type:** Cross-cutting Enhancement
**Scope:** Cross-feature (Organizations, Contacts, Products)
**Design Doc:** `docs/designs/2025-12-04-unified-filter-chip-bar-design.md`

---

## Overview

This plan implements a unified filter UX across all CRM list views by:
1. Creating a `FilterChipBar` component that displays active filters above the datagrid
2. Creating a `FilterSidebar` wrapper for consistent sidebar behavior
3. Standardizing filter configurations across Organizations, Contacts, and Products

**Execution Model:** Hybrid (parallel groups + sequential dependencies)
**Task Granularity:** Atomic (2-5 min each)
**Testing:** Tests written after implementation

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
  type: z.enum(['select', 'multiselect', 'reference', 'date-range']),
  reference: z.string().optional(),
  choices: z.array(filterChoiceSchema).optional(),
  formatLabel: z.function().args(z.unknown()).returns(z.string()).optional(),
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
    const ids: { organizations: string[]; sales: string[]; tags: string[] } = {
      organizations: [],
      sales: [],
      tags: [],
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
      }
    });

    return ids;
  }, [filterValues, filterConfig]);

  const { getOrganizationName } = useOrganizationNames(referenceIds.organizations);
  const { getSalesName } = useSalesNames(referenceIds.sales);
  const { getTagName } = useTagNames(referenceIds.tags);

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
        } else {
          label = String(v);
        }

        result.push({ key, value: v as string | number, label, category });
      });
    });

    return result;
  }, [filterValues, filterConfig, getOrganizationName, getSalesName, getTagName]);

  const removeFilter = useCallback(
    (key: string, value?: string | number) => {
      const currentValue = filterValues[key];

      if (Array.isArray(currentValue) && value !== undefined) {
        const newArray = currentValue.filter((v) => v !== value);
        setFilters(
          { ...filterValues, [key]: newArray.length ? newArray : undefined },
          displayedFilters
        );
      } else {
        const { [key]: _, ...rest } = filterValues;
        setFilters(rest, displayedFilters);
      }
    },
    [filterValues, setFilters, displayedFilters]
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

### Task 1.3: Create FilterChip Component

**File:** `src/atomic-crm/filters/FilterChip.tsx` (MODIFY existing or CREATE)
**Time:** 3-5 min
**Dependencies:** None (can run parallel with 1.2)

**Purpose:** Individual removable filter chip with 44px touch target.

```typescript
// src/atomic-crm/filters/FilterChip.tsx
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
  className?: string;
}

/**
 * Individual removable filter chip.
 * Touch-friendly: 44px minimum touch target.
 */
export function FilterChip({ label, onRemove, className }: FilterChipProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'pl-3 pr-1.5 py-1.5 gap-1.5 text-sm font-normal cursor-default',
        'flex items-center min-h-[2.75rem]', // 44px touch target
        className
      )}
    >
      <span className="truncate max-w-[150px]">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className={cn(
          'rounded-full p-1 hover:bg-background/50',
          'h-6 w-6 flex items-center justify-center',
          'focus:outline-none focus:ring-2 focus:ring-ring'
        )}
        aria-label={`Remove ${label} filter`}
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </Badge>
  );
}
```

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

### Task 1.5: Create FilterSidebar Wrapper

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

### Task 1.6: Update Filter Exports

**File:** `src/atomic-crm/filters/index.ts` (MODIFY)
**Time:** 2 min
**Dependencies:** Tasks 1.1-1.5

**Purpose:** Export new components from the filters module.

Add these exports to the existing file:

```typescript
// Add to src/atomic-crm/filters/index.ts
export { FilterChipBar } from './FilterChipBar';
export { FilterChip } from './FilterChip';
export { FilterSidebar } from './FilterSidebar';
export { useFilterChipBar } from './useFilterChipBar';
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

// Import existing choices from your constants
const ORGANIZATION_TYPE_CHOICES = [
  { id: 'customer', name: 'Customer' },
  { id: 'prospect', name: 'Prospect' },
  { id: 'principal', name: 'Principal' },
  { id: 'distributor', name: 'Distributor' },
];

const PRIORITY_CHOICES = [
  { id: 'A', name: 'A - High' },
  { id: 'B', name: 'B - Medium' },
  { id: 'C', name: 'C - Low' },
  { id: 'D', name: 'D - Minimal' },
];

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
  },
  {
    key: 'last_seen@lte',
    label: 'Activity before',
    type: 'date-range',
    formatLabel: formatDateLabel,
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

## Phase 3: Feature Integration (Parallel Group B)

These tasks can ALL run in parallel - they modify different files.

### Task 3.1: Integrate FilterChipBar into OrganizationList

**File:** `src/atomic-crm/organizations/OrganizationList.tsx` (MODIFY)
**Time:** 3-5 min
**Dependencies:** Tasks 1.4, 2.1
**Parallel:** Can run with 3.2, 3.3

**Changes:**
1. Import `FilterChipBar` and `ORGANIZATION_FILTER_CONFIG`
2. Add `<FilterChipBar>` above the datagrid inside the `<List>` component

```typescript
// Add imports
import { FilterChipBar } from '../filters';
import { ORGANIZATION_FILTER_CONFIG } from './organizationFilterConfig';

// Inside the List component, add before PremiumDatagrid:
<FilterChipBar filterConfig={ORGANIZATION_FILTER_CONFIG} />
```

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
export function OrganizationListFilter() {
  return (
    <FilterSidebar searchPlaceholder="Search organizations...">
      {/* Keep existing FilterCategory components */}
      <FilterCategory icon={<Building2 />} label="Organization Type">
        {/* existing content */}
      </FilterCategory>
      {/* ... other categories */}
    </FilterSidebar>
  );
}
```

---

### Task 4.2: Update ContactListFilter to use FilterSidebar

**File:** `src/atomic-crm/contacts/ContactListFilter.tsx` (MODIFY)
**Time:** 3-5 min
**Dependencies:** Task 1.5
**Parallel:** Can run with 4.1, 4.3

Same pattern as 4.1 - wrap with `<FilterSidebar>`, remove old active filters display.

---

### Task 4.3: Update ProductListFilter to use FilterSidebar

**File:** `src/atomic-crm/products/ProductListFilter.tsx` (MODIFY)
**Time:** 3-5 min
**Dependencies:** Task 1.5
**Parallel:** Can run with 4.1, 4.2

Same pattern as 4.1 - wrap with `<FilterSidebar>`.

---

## Phase 5: Cleanup (Sequential)

### Task 5.1: Remove Deprecated SidebarActiveFilters

**Files to check/modify:**
- `src/atomic-crm/organizations/SidebarActiveFilters.tsx` - DELETE or deprecate
- `src/atomic-crm/contacts/SidebarActiveFilters.tsx` - DELETE or deprecate
- Any imports of these files - REMOVE

**Time:** 5 min
**Dependencies:** All Phase 4 tasks complete

---

### Task 5.2: Remove Deprecated Filter Chip Hooks

**Files to check:**
- `src/atomic-crm/organizations/useOrganizationFilterChips.ts` - May be removable
- `src/atomic-crm/contacts/useContactFilterChips.ts` - May be removable

**Time:** 3 min
**Dependencies:** Task 5.1

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
  1.5 (parallel with 1.2-1.4)
  1.6 (after all above)

PHASE 2 (Parallel Group A): Configs
  2.1 ┐
  2.2 ├─ All parallel
  2.3 ┘

PHASE 3 (Parallel Group B): List Integration
  3.1 ┐
  3.2 ├─ All parallel
  3.3 ┘

PHASE 4 (Parallel Group C): Sidebar Standardization
  4.1 ┐
  4.2 ├─ All parallel
  4.3 ┘

PHASE 5 (Sequential): Cleanup
  5.1 → 5.2

PHASE 6 (Sequential): Testing
  6.1 → 6.2 → 6.3
```

---

## Verification Checklist

Before marking complete, verify:

- [ ] FilterChipBar appears above datagrid on Organizations page
- [ ] FilterChipBar appears above datagrid on Contacts page
- [ ] FilterChipBar appears above datagrid on Products page
- [ ] Clicking × on a chip removes that filter
- [ ] "Clear all" removes all filters (when 2+ active)
- [ ] Filters sync to URL (can share filtered views)
- [ ] 44px touch targets work on iPad/tablet
- [ ] Keyboard navigation works (arrow keys, Home, End)
- [ ] No console errors
- [ ] All tests pass

---

## Rollback Plan

If issues arise:
1. Revert changes to List files (OrganizationList, ContactList, ProductList)
2. Keep new components but don't use them
3. Original filter UX still works as fallback
