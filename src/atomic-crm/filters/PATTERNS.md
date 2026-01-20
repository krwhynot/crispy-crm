# Filter System Patterns

Standard patterns for the Crispy CRM filter system. Provides type-safe, accessible filtering with React Admin integration.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Filter Data Flow                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐     ┌──────────────────┐                      │
│  │  Filter Config   │────▶│  validateFilter  │  Fail-fast at init   │
│  │  (per resource)  │     │    Config()      │                      │
│  └──────────────────┘     └────────┬─────────┘                      │
│                                    │                                │
│                                    ▼                                │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                   React Admin List Context                    │   │
│  │  filterValues: { stage: ['new_lead'], priority: 'high' }     │   │
│  └──────────────────────────────┬───────────────────────────────┘   │
│                                 │                                   │
│         ┌───────────────────────┼───────────────────────┐           │
│         │                       │                       │           │
│         ▼                       ▼                       ▼           │
│  ┌──────────────┐      ┌──────────────┐       ┌──────────────┐      │
│  │useFilterMgmt │      │useFilterChip │       │filterPreced- │      │
│  │  add/remove  │      │    Bar()     │       │   ence.ts    │      │
│  │   /toggle    │      │  transform   │       │ URL>storage  │      │
│  └──────┬───────┘      └──────┬───────┘       └──────────────┘      │
│         │                     │                                     │
│         │                     ▼                                     │
│         │              ┌──────────────┐                             │
│         │              │ Reference    │                             │
│         │              │ Name Hooks   │  Lazy-load org/sales names  │
│         │              └──────┬───────┘                             │
│         │                     │                                     │
│         ▼                     ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    Presentation Layer                         │   │
│  │  ┌─────────────────┐              ┌────────────────────────┐  │   │
│  │  │  FilterSidebar  │              │    FilterChipBar       │  │   │
│  │  │  └─FilterCateg  │              │    └─FilterChip*       │  │   │
│  │  └─────────────────┘              └────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Pattern A: Filter Management Hook

Centralized state machine for filter CRUD operations.

```tsx
// src/atomic-crm/filters/useFilterManagement.ts
import { useListContext } from "ra-core";

export const useFilterManagement = () => {
  const { filterValues, setFilters } = useListContext();

  const addFilterValue = (key: string, value: PrimitiveFilterValue): void => {
    const currentValue = filterValues?.[key];

    if (Array.isArray(currentValue)) {
      // Add to existing array if not present
      if (!currentValue.includes(value as never)) {
        setFilters({ ...filterValues, [key]: [...currentValue, value] });
      }
    } else if (currentValue !== undefined) {
      // Convert single value to array
      setFilters({ ...filterValues, [key]: [currentValue, value] });
    } else {
      // Set new single value
      setFilters({ ...filterValues, [key]: value });
    }
  };

  const removeFilterValue = (key: string, valueToRemove: PrimitiveFilterValue): void => {
    const currentValue = filterValues?.[key];

    if (Array.isArray(currentValue)) {
      const newValue = currentValue.filter((v) => v !== valueToRemove);
      if (newValue.length === 0) {
        const { [key]: _, ...rest } = filterValues;
        setFilters(rest);
      } else {
        setFilters({ ...filterValues, [key]: newValue });
      }
    } else {
      const { [key]: _, ...rest } = filterValues;
      setFilters(rest);
    }
  };

  const toggleFilterValue = (key: string, value: PrimitiveFilterValue): void => {
    const currentValue = filterValues?.[key];
    if (Array.isArray(currentValue)) {
      currentValue.includes(value as never)
        ? removeFilterValue(key, value)
        : addFilterValue(key, value);
    } else if (currentValue === value) {
      removeFilterValue(key, value);
    } else {
      addFilterValue(key, value);
    }
  };

  return {
    filterValues: filterValues || {},
    addFilterValue,
    removeFilterValue,
    toggleFilterValue,
    clearFilter,
    clearAllFilters,
    isFilterActive,
    activeFilterCount,
  };
};
```

**When to use**: Programmatic filter manipulation in sidebar filters, toggle buttons, or custom filter components.

---

## Pattern B: Filter Configuration Schema

Declarative filter definitions with Zod validation at module init (fail-fast).

```tsx
// src/atomic-crm/filters/filterConfigSchema.ts
import { z } from "zod";

export const chipFilterConfigSchema = z.strictObject({
  key: z.string().min(1).max(100),
  label: z.string().min(1).max(50),
  type: z.enum(["select", "multiselect", "reference", "date-range", "search", "toggle", "boolean"]),
  reference: z.string().optional(),
  choices: z.union([z.array(filterChoiceSchema), choicesCallbackSchema]).optional(),
  formatLabel: formatLabelCallbackSchema.optional(),
  removalGroup: z.string().optional(),
});

export function validateFilterConfig(config: unknown): ChipFilterConfig[] {
  return filterConfigSchema.parse(config);
}
```

**When to use**: Defining filters for a new resource. Call `validateFilterConfig()` at module initialization to catch errors early.

---

## Pattern C: Filter Chips Panel

Visual filter display above the datagrid with one-click removal.

```tsx
// src/atomic-crm/filters/FilterChipBar.tsx
export function FilterChipBar({ filterConfig, context, className }: FilterChipBarProps) {
  // Fail-fast: config required
  if (!filterConfig || filterConfig.length === 0) {
    throw new Error("FilterChipBar requires a non-empty filterConfig.");
  }

  const { chips, removeFilter, clearAllFilters, hasActiveFilters, activeCount } =
    useFilterChipBar(filterConfig, context);

  if (!hasActiveFilters) return null;

  return (
    <div
      role="toolbar"
      aria-label="Active filters"
      className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-b overflow-x-auto"
    >
      <span className="text-sm text-muted-foreground">Active filters:</span>
      <div role="list" className="flex items-center gap-1.5 flex-wrap">
        {chips.map((chip) => (
          <div key={`${chip.key}-${chip.value}`} role="listitem">
            <FilterChip label={chip.label} onRemove={() => removeFilter(chip.key, chip.value)} />
          </div>
        ))}
      </div>
      {activeCount >= 2 && (
        <Button variant="ghost" size="sm" onClick={clearAllFilters}>
          Clear all
        </Button>
      )}
    </div>
  );
}
```

```tsx
// src/atomic-crm/filters/FilterChip.tsx
export const FilterChip: React.FC<FilterChipProps> = ({ label, onRemove }) => (
  <div className="inline-flex items-center gap-1.5 pl-3 pr-1 rounded-full bg-muted min-h-[2.75rem]">
    <span className="truncate max-w-[150px]">{label}</span>
    <Button
      variant="ghost"
      size="icon"
      className="h-11 w-11"  // 44px iPad touch target
      onClick={onRemove}
      aria-label={`Remove ${label} filter`}
    >
      <X className="size-4" />
    </Button>
  </div>
);
```

**When to use**: Every list that has active filters. Place above the datagrid for maximum visibility.

---

## Pattern D: Filter Sidebar

Collapsible category-based filter UI for the sidebar.

```tsx
// src/atomic-crm/filters/FilterSidebar.tsx
export function FilterSidebar({
  children,
  searchPlaceholder = "Search...",
  showSearch = true,
  className,
}: FilterSidebarProps) {
  return (
    <div className={cn("flex flex-col gap-4 p-4", className)}>
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

```tsx
// src/atomic-crm/filters/FilterCategory.tsx
export const FilterCategory = ({
  icon,
  label,
  children,
  defaultExpanded = false,
  hasActiveFilters = false,
}: Props) => {
  const [isExpanded, setIsExpanded] = useState(hasActiveFilters || defaultExpanded);

  return (
    <div className="flex flex-col">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between min-h-12 px-2 hover:bg-muted rounded-md"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <div className="text-muted-foreground">{icon}</div>
          <h3 className="font-semibold text-sm"><Translate i18nKey={label} /></h3>
          {hasActiveFilters && <div className="h-2 w-2 rounded-full bg-accent" />}
        </div>
        <ChevronDown className={cn("size-4", !isExpanded && "-rotate-90")} />
      </button>
      {isExpanded && (
        <div className="flex flex-col items-start gap-2 pl-7 mt-2 mb-2">{children}</div>
      )}
    </div>
  );
};
```

**When to use**: Sidebar filter panels with grouped, collapsible sections.

---

## Pattern E: Filter Chips Panel (Accordion)

Accordion-based panel for displaying active filters in a collapsible area. Alternative to FilterChipBar for space-constrained layouts.

```tsx
// src/atomic-crm/filters/FilterChipsPanel.tsx
export const FilterChipsPanel = ({ className }: FilterChipsPanelProps) => {
  const { filterValues, removeFilterValue } = useFilterManagement();

  // Extract IDs for name resolution hooks
  const customerOrgIds = extractFilterIds(filterValues, "customer_organization_id");
  const principalOrgIds = extractFilterIds(filterValues, "principal_organization_id");
  const salesIds = extractFilterIds(filterValues, "opportunity_owner_id");
  const tagIds = extractFilterIds(filterValues, "tags");

  // Fetch names for reference filters
  const { getOrganizationName } = useOrganizationNames([...customerOrgIds, ...principalOrgIds]);
  const { getSalesName } = useSalesNames(salesIds);
  const { getTagName } = useTagNames(tagIds);

  const filterChips = flattenFilterValues(filterValues || {});
  if (filterChips.length === 0) return null;

  return (
    <Accordion type="single" collapsible defaultValue="filters">
      <AccordionItem value="filters">
        <AccordionTrigger>
          Active Filters ({filterChips.length})
        </AccordionTrigger>
        <AccordionContent>
          {filterChips.map((chip, index) => (
            <FilterChip
              key={`${chip.key}-${chip.value}-${index}`}
              label={formatFilterLabel(chip.key, chip.value, getOrganizationName, getSalesName, getTagName)}
              onRemove={() => removeFilterValue(chip.key, chip.value)}
            />
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
```

**Key differences from FilterChipBar:**
- Collapsible via shadcn/ui Accordion (saves vertical space)
- Always includes filter count in header
- No "Clear all" button (chips are individually removable)

**When to use**: Space-constrained sidebars where filters should be collapsible.

---

## Pattern F: Date Range Filter Button

Popover-based date range picker that integrates with React Admin's filter system.

```tsx
// src/atomic-crm/filters/DateRangeFilterButton.tsx
interface DateRangeFilterButtonProps {
  /** Filter key prefix - e.g., "last_seen" sets "last_seen@gte" and "last_seen@lte" */
  filterKeyPrefix: string;
  className?: string;
}

export function DateRangeFilterButton({ filterKeyPrefix, className }: DateRangeFilterButtonProps) {
  const { filterValues, setFilters, displayedFilters } = useListContext();
  const [open, setOpen] = useState(false);

  const gteKey = `${filterKeyPrefix}@gte`;
  const lteKey = `${filterKeyPrefix}@lte`;

  const handleApply = () => {
    const newFilters = { ...filterValues };
    if (fromParsed) newFilters[gteKey] = startOfDay(fromParsed).toISOString();
    if (toParsed) newFilters[lteKey] = endOfDay(toParsed).toISOString();
    setFilters(newFilters, displayedFilters);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="h-11">
          <CalendarIcon className="h-4 w-4" />
          {getButtonLabel()} {/* "Select dates", "From Jan 1", "Jan 1 – Jan 15" */}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <Input type="date" id="from-date" />
        <Input type="date" id="to-date" />
        <Button onClick={handleClear}>Clear</Button>
        <Button onClick={handleApply}>Apply</Button>
      </PopoverContent>
    </Popover>
  );
}
```

**Key behaviors:**
- Uses native `input[type="date"]` (compact, no full calendar)
- Sets `@gte` and `@lte` filter keys for standard React Admin operator format
- Shows "Select dates", "From {date}", "Until {date}", or "{from} – {to}" based on state
- 44px touch targets (h-11) for iPad compliance

**When to use**: Custom date range filters in sidebar FilterCategory components.

---

## Pattern G: Starred Filter Toggle

Quick filter toggle to show only user-favorited items using client-side ID filtering.

```tsx
// src/atomic-crm/filters/StarredFilterToggle.tsx
interface StarredFilterToggleProps {
  entityType: FavoriteEntityType;  // "contact", "opportunity", "organization"
  className?: string;
}

export function StarredFilterToggle({ entityType, className }: StarredFilterToggleProps) {
  const { filterValues, setFilters } = useListContext();
  const { favorites, isLoading } = useFavorites();

  // Get IDs of starred items for this entity type
  const favoriteIds = favorites
    .filter(fav => fav.entity_type === entityType)
    .map(fav => fav.entity_id);

  const isActive = filterValues?.id?.length > 0 &&
    filterValues.id.every((id: number) => favoriteIds.includes(id));

  const handleClick = () => {
    if (isActive) {
      // Deactivate: remove id filter
      const { id: _, ...restFilters } = filterValues || {};
      setFilters(restFilters);
    } else {
      // Activate: set id filter to favorite IDs
      setFilters({ ...filterValues, id: favoriteIds });
    }
  };

  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      onClick={handleClick}
      disabled={favoriteIds.length === 0}
      aria-pressed={isActive}
      className="h-11"
    >
      <Star className={isActive ? "fill-primary" : ""} />
      Starred ({favoriteIds.length})
    </Button>
  );
}
```

**Key behaviors:**
- Uses `id` filter to show only favorited entity IDs
- Auto-clears when all favorites removed while active
- Auto-updates filter if favorites change while active
- Shows count badge with number of starred items
- Tooltip when disabled: "Star items to use this filter"

**When to use**: List views where users can star/favorite items (contacts, opportunities, organizations).

---

## Pattern H: Filter Precedence

URL parameters override sessionStorage, which overrides code defaults.

```tsx
// src/atomic-crm/filters/filterPrecedence.ts
/**
 * Priority: URL parameters > sessionStorage > defaults
 * Phase 1 Security: Uses sessionStorage (cleared on tab close)
 */
export function getInitialFilterValue<T extends FilterValue>(
  filterKey: string,
  urlValue?: T,
  defaultValue?: T
): T | undefined {
  // 1. URL has highest priority
  if (urlValue !== undefined && urlValue !== null && urlValue !== "") {
    return urlValue;
  }

  // 2. sessionStorage preferences
  const storedValue = getStoredFilterPreferences<T>(`filter.${filterKey}`);
  if (storedValue !== undefined && storedValue !== null) {
    return storedValue;
  }

  // 3. Default value
  return defaultValue;
}

export const buildInitialFilters = (
  urlSearch: string,
  defaults: FilterValues = {}
): FilterValues => {
  const urlFilters = parseUrlFilters(urlSearch);
  const initialFilters: FilterValues = {};

  for (const [key, defaultValue] of Object.entries(defaults)) {
    const value = getInitialFilterValue(key, urlFilters[key], defaultValue);
    if (value !== undefined && value !== null && value !== "") {
      initialFilters[key] = value;
    }
  }

  return initialFilters;
};
```

**When to use**: Initializing list filters with proper precedence (bookmarked URLs, user preferences, sensible defaults).

---

## Pattern F: Stage Preferences

Persistent Kanban stage visibility for opportunities.

```tsx
// src/atomic-crm/filters/opportunityStagePreferences.ts
const STORAGE_KEY = "filter.opportunity_stages";

const DEFAULT_VISIBLE_STAGES = OPPORTUNITY_STAGE_CHOICES
  .filter((c) => !["closed_won", "closed_lost"].includes(c.id))
  .map((c) => c.id);

export const getStoredStagePreferences = (): string[] => {
  try {
    const stored = getStorageItem<string[]>(STORAGE_KEY, { type: "session" });
    if (!stored || !Array.isArray(stored)) return DEFAULT_VISIBLE_STAGES;
    return stored;
  } catch {
    return DEFAULT_VISIBLE_STAGES;
  }
};

export const saveStagePreferences = (selectedStages: string[]): void => {
  if (selectedStages.length === 0) return;
  try {
    setStorageItem(STORAGE_KEY, selectedStages, { type: "session" });
  } catch (error) {
    console.warn("Failed to save stage preferences:", error);
  }
};

export const getInitialStageFilter = (): string[] | undefined => {
  // 1. Check URL parameters (highest priority)
  const urlParams = new URLSearchParams(window.location.search);
  const urlFilter = urlParams.get("filter");
  if (urlFilter) {
    const parsed = safeJsonParse(urlFilter, urlFilterSchema);
    if (parsed?.stage) {
      return Array.isArray(parsed.stage) ? parsed.stage : [parsed.stage];
    }
  }

  // 2. Check sessionStorage preferences
  return getStoredStagePreferences();
};
```

**When to use**: Kanban views where users customize which stages are visible and expect persistence across page loads.

---

## Pattern G: Resource-Specific Filters

Declarative configuration for each resource's filter needs.

### Filter Config Locations

All filter configs live in their respective feature directories:

| Resource | Config File |
|----------|-------------|
| Activities | `src/atomic-crm/activities/activityFilterConfig.ts` |
| Contacts | `src/atomic-crm/contacts/contactFilterConfig.ts` |
| Opportunities | `src/atomic-crm/opportunities/opportunityFilterConfig.ts` |
| Organizations | `src/atomic-crm/organizations/organizationFilterConfig.ts` |
| Products | `src/atomic-crm/products/productFilterConfig.ts` |
| Sales | `src/atomic-crm/sales/salesFilterConfig.ts` |
| Tasks | `src/atomic-crm/tasks/taskFilterConfig.ts` |

```tsx
// src/atomic-crm/opportunities/opportunityFilterConfig.ts
import { validateFilterConfig } from "../filters/filterConfigSchema";

function formatDateLabel(value: unknown): string {
  if (!value || typeof value !== "string") return String(value);
  const date = new Date(value);
  if (isNaN(date.getTime())) return String(value);
  if (isToday(date)) return "Today";
  if (isThisWeek(date)) return "This week";
  return format(date, "MMM d, yyyy");
}

export const OPPORTUNITY_FILTER_CONFIG = validateFilterConfig([
  { key: "stage", label: "Stage", type: "multiselect", choices: [...stageChoices] },
  { key: "principal_organization_id", label: "Principal", type: "reference", reference: "organizations" },
  { key: "customer_organization_id", label: "Customer", type: "reference", reference: "organizations" },
  { key: "campaign", label: "Campaign", type: "select" },
  { key: "opportunity_owner_id", label: "Owner", type: "reference", reference: "sales" },
  { key: "priority", label: "Priority", type: "multiselect", choices: [...priorityChoices] },
  // Date ranges with removalGroup
  { key: "estimated_close_date_gte", label: "Close after", type: "date-range",
    formatLabel: formatDateLabel, removalGroup: "estimated_close_date_range" },
  { key: "estimated_close_date_lte", label: "Close before", type: "date-range",
    formatLabel: formatDateLabel, removalGroup: "estimated_close_date_range" },
]);
```

```tsx
// src/atomic-crm/contacts/contactFilterConfig.ts
export const CONTACT_FILTER_CONFIG = validateFilterConfig([
  { key: "first_name", label: "Name", type: "search" },
  { key: "status", label: "Status", type: "multiselect", choices: [
    { id: "cold", name: "Cold" },
    { id: "warm", name: "Warm" },
    { id: "hot", name: "Hot" },
    { id: "in-contract", name: "Contract" },
  ]},
  { key: "tags", label: "Tag", type: "multiselect", reference: "tags" },
  { key: "last_seen@gte", label: "Activity after", type: "date-range",
    formatLabel: formatDateLabel, removalGroup: "last_seen_range" },
  { key: "last_seen@lte", label: "Activity before", type: "date-range",
    formatLabel: formatDateLabel, removalGroup: "last_seen_range" },
  { key: "sales_id", label: "Owner", type: "reference", reference: "sales" },
]);
```

**When to use**: Every resource with filterable lists. Place in the feature directory (see Filter Config Locations table above).

---

## Filter Type Comparison

| Type | Value Shape | Use Case | Example |
|------|-------------|----------|---------|
| `select` | Single value | One choice allowed | Campaign dropdown |
| `multiselect` | Array | Multiple choices (OR logic) | Stage, Priority |
| `reference` | ID string | Foreign key lookup | Owner, Organization |
| `search` | String | Full-text search | Name search (`q`) |
| `date-range` | ISO date string | Date filters with operators | Close date (`@gte`/`@lte`) |
| `toggle` | Boolean | On/off switch | "Only mine" toggle |
| `boolean` | Boolean | Yes/No with labels | "Has activity" |

### Date Range Operators

**Rule**: Use `@` prefix for React Admin standard operators. The `_` suffix is legacy (Opportunities only).

| Format | When to Use | Example Resources |
|--------|-------------|-------------------|
| `field@gte` / `field@lte` | **Standard** - new filters | Activities, Contacts, Tasks |
| `field_gte` / `field_lte` | **Legacy** - existing only | Opportunities (do not add new) |

When adding date filters to a resource, check its existing config file for the format already in use.

---

## Anti-Patterns

### 1. Filter State Leaks

```tsx
// BAD: Missing cleanup on unmount
useEffect(() => {
  setFilters({ ...filterValues, stage: 'new_lead' });
  // Filter persists when navigating away!
}, []);

// GOOD: Use filter management hook (auto-cleans via React Admin)
const { addFilterValue } = useFilterManagement();
addFilterValue('stage', 'new_lead');
```

### 2. Direct setFilters Without displayedFilters

```tsx
// BAD: Loses track of which filters are shown in sidebar
setFilters({ stage: ['new_lead'] });

// GOOD: Preserve displayedFilters for sidebar state
setFilters({ stage: ['new_lead'] }, displayedFilters);
```

### 3. Hardcoded Choices

```tsx
// BAD: Label drift between chip and sidebar
const STAGE_CONFIG = {
  key: 'stage',
  choices: [{ id: 'new_lead', name: 'New Lead' }], // Duplicates stageChoices
};

// GOOD: Import from constants
import { stageChoices } from './constants/filterChoices';
const STAGE_CONFIG = { key: 'stage', choices: [...stageChoices] };
```

### 4. Missing removalGroup for Date Ranges

```tsx
// BAD: User removes "Close after", "Close before" chip remains
{ key: "close_date_gte", label: "Close after", type: "date-range" },
{ key: "close_date_lte", label: "Close before", type: "date-range" },

// GOOD: Grouped removal clears both
{ key: "close_date_gte", label: "Close after", type: "date-range",
  removalGroup: "close_date_range" },
{ key: "close_date_lte", label: "Close before", type: "date-range",
  removalGroup: "close_date_range" },
```

### 5. Forgetting to Validate Config

```tsx
// BAD: Runtime errors when filter has typo
export const MY_FILTER_CONFIG = [
  { key: 'staeg', label: 'Stage', tpye: 'multiselect' }, // Typos!
];

// GOOD: Fail-fast validation at module init
export const MY_FILTER_CONFIG = validateFilterConfig([
  { key: 'stage', label: 'Stage', type: 'multiselect' },
]);
```

### 6. Using localStorage Instead of sessionStorage

```tsx
// BAD: Filter preferences persist across sessions (privacy concern)
localStorage.setItem('filter.stage', JSON.stringify(stages));

// GOOD: Use sessionStorage (Phase 1 security remediation)
import { setStorageItem } from '../utils/secureStorage';
setStorageItem('filter.stage', stages, { type: 'session' });
```

---

## Migration Checklist

Adding filters to a new resource:

### 1. Create Filter Configuration

```tsx
// src/atomic-crm/[feature]/[feature]FilterConfig.ts
import { validateFilterConfig } from '../filters/filterConfigSchema';

export const FEATURE_FILTER_CONFIG = validateFilterConfig([
  { key: 'status', label: 'Status', type: 'multiselect', choices: STATUS_CHOICES },
  { key: 'owner_id', label: 'Owner', type: 'reference', reference: 'sales' },
  // Add date ranges with removalGroup if needed
]);
```

### 2. Create Sidebar Filter Component

```tsx
// src/atomic-crm/[feature]/[Feature]ListFilter.tsx
import { FilterSidebar, FilterCategory } from '../filters';

export const FeatureListFilter = () => {
  const { filterValues } = useListContext();

  return (
    <FilterSidebar searchPlaceholder="Search features...">
      <FilterCategory icon={<Status />} label="Status" hasActiveFilters={!!filterValues.status}>
        {STATUS_CHOICES.map(choice => (
          <ToggleFilterButton key={choice.id} value={{ status: choice.id }} label={choice.name} />
        ))}
      </FilterCategory>
    </FilterSidebar>
  );
};
```

### 3. Add FilterChipBar to List

```tsx
// src/atomic-crm/[feature]/[Feature]List.tsx
import { FilterChipBar } from '../filters';
import { FEATURE_FILTER_CONFIG } from './featureFilterConfig';

export const FeatureList = () => (
  <StandardListLayout filterComponent={<FeatureListFilter />}>
    <FilterChipBar filterConfig={FEATURE_FILTER_CONFIG} />
    <PremiumDatagrid>...</PremiumDatagrid>
  </StandardListLayout>
);
```

### 4. Add Reference Name Hook (if needed)

If your filter uses a new reference type not covered by existing hooks:

```tsx
// src/atomic-crm/filters/use[Resource]Names.ts
import { useResourceNamesBase } from './hooks/useResourceNamesBase';

export function useResourceNames(ids: string[] | undefined) {
  return useResourceNamesBase<Resource>(
    'resources',
    ids,
    (record) => record.name,
    'Resource'
  );
}
```

### 5. Update useFilterChipBar (if new reference)

Add the new hook to `useFilterChipBar.ts`:

```tsx
const { getResourceName } = useResourceNames(referenceIds.resources);

// In referenceIds extraction:
if (config.reference === 'resources') {
  ids.resources.push(...values.map(String));
}

// In label resolution:
} else if (config.reference === 'resources') {
  label = getResourceName(String(v));
}
```

### 6. Verification Checklist

- [ ] Filter config validates without errors at module init
- [ ] FilterChipBar renders chips for all active filters
- [ ] Clicking chip X removes the correct filter
- [ ] "Clear all" removes all user filters (preserves system filters)
- [ ] Date ranges with removalGroup clear together
- [ ] Reference filters show names (not IDs)
- [ ] Sidebar categories auto-expand when filters active
- [ ] Touch targets are 44px minimum (iPad)
- [ ] ARIA labels on all interactive elements
- [ ] TypeScript compiles: `npx tsc --noEmit`
