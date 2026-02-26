# Hook Patterns

Standard patterns for shared hooks in Crispy CRM's atomic-crm module.

## Hook Hierarchy

```
React Admin Store ─────────────────────────────
         │
    useFilterCleanup (localStorage cleanup)
         │
    filterRegistry.isValidFilterField()
─────────────────────────────────────────────

Browser Storage ───────────────────────────────
         │
    secureStorage utilities
         │
    ├── useRecentSelections (MRU list)
    └── useFilterCleanup (RA params)
─────────────────────────────────────────────

React Admin Identity ──────────────────────────
         │
    useGetIdentity()
         │
    useSmartDefaults (form pre-population)
─────────────────────────────────────────────

Responsive Layout ─────────────────────────────
         │
    useIsMobile() (src/hooks/use-mobile.ts)
         │
    useAppBarHeight (height calculation)
─────────────────────────────────────────────
```

---

## Pattern A: Filter Cleanup Hook

Purges stale cached filters and sorts from localStorage for React Admin resources.
Prevents 400 errors when database columns are renamed or removed.

```tsx
import { useFilterCleanup } from "@/atomic-crm/hooks";

// Inside any List component
export const ContactList = () => {
  useFilterCleanup('contacts');
  // ... rest of component
};
```

**When to use**: Every List component that uses React Admin's list params caching.

### How It Works (Two-Phase Architecture)

Cleanup runs in two phases to prevent PostgREST 400 errors on the very first render:

1. **Phase 1 (Synchronous, pre-render):** `cleanStaleListParams()` runs outside `useEffect` during render, fixing localStorage before React Admin's `useListParams` reads it.
2. **Phase 2 (Effect, post-render):** Syncs React Admin's in-memory store via `store.setItem()` so subsequent renders pick up cleaned values.

```tsx
// useFilterCleanup.ts — Phase 1: synchronous cleanup function
function cleanStaleListParams(resource: string): boolean {
  const key = `RaStoreCRM.${resource}.listParams`;
  const storedParams = localStorage.getItem(key);
  if (!storedParams) return false;

  const params = safeJsonParse(storedParams, listParamsSchema);
  if (!params) return false;

  let modified = false;

  // Clean stale filter fields
  if (params.filter) {
    const cleanedFilter: Record<string, unknown> = {};
    for (const filterKey in params.filter) {
      if (isValidFilterField(resource, filterKey)) {
        cleanedFilter[filterKey] = params.filter[filterKey];
      } else {
        logger.warn('Found stale filter in localStorage, removing it', {
          feature: 'useFilterCleanup', resource, filterKey,
        });
        modified = true;
      }
    }
    if (modified) params.filter = cleanedFilter;
  }

  // Check sort field validity — RA stores sort as flat string, not nested {field, order}
  if (typeof params.sort === "string" && params.sort) {
    if (!isValidFilterField(resource, params.sort)) {
      params.sort = DEFAULT_SORT_FIELDS[resource] || "id";
      modified = true;
    }
  }

  if (modified) localStorage.setItem(key, JSON.stringify(params));
  return modified;
}

// useFilterCleanup.ts — Hook with two-phase cleanup
export const useFilterCleanup = (resource: string) => {
  const store = useStoreContext();
  const notify = useNotify();

  // Phase 1: Synchronous pre-render cleanup
  const cleanedRef = useRef<{ resource: string; cleaned: boolean } | null>(null);
  if (!cleanedRef.current || cleanedRef.current.resource !== resource) {
    const cleaned = cleanStaleListParams(resource);
    cleanedRef.current = { resource, cleaned };
  }

  // Phase 2: Sync RA's in-memory store post-render
  useEffect(() => {
    if (cleanedRef.current?.cleaned) {
      const localStorageKey = `RaStoreCRM.${resource}.listParams`;
      const storeKey = `${resource}.listParams`;
      const storedParams = localStorage.getItem(localStorageKey);
      if (storedParams) {
        const params = safeJsonParse(storedParams, listParamsSchema);
        if (params) store.setItem(storeKey, params);
      }
      cleanedRef.current = { resource, cleaned: false };
    }
  }, [resource, store, notify]);
};
```

**Key differences from earlier version:**
- Uses `useStoreContext()` (not `useStore`) for React Admin store access
- Schema imported from `../validation/filters` (not defined inline)
- Sort field stored as flat string format (`"field_name"`), not nested `{field, order}` object

### Zod Schema for Validation

The `listParamsSchema` is defined in `../validation/filters.ts` (not inline in the hook):

```tsx
// src/atomic-crm/validation/filters.ts
export const listParamsSchema = z.object({
  filter: z.record(z.string().max(50), z.unknown()).optional(),
  sort: z.string().max(100).optional(),       // Flat string, NOT nested {field, order}
  order: z.enum(["ASC", "DESC"]).optional(),
  page: z.number().int().positive().optional(),
  perPage: z.number().int().positive().max(1000).optional(),
  displayedFilters: z.record(z.string(), z.boolean()).optional(),
}).passthrough(); // React Admin may add fields
```

### Default Sort Fields

When a stale sort field is detected, the hook resets to a sensible default:

```tsx
// useFilterCleanup.ts:13-21
const DEFAULT_SORT_FIELDS: Record<string, string> = {
  contacts: "last_seen",
  organizations: "name",
  opportunities: "created_at",
  activities: "activity_date",
  tasks: "due_date",
  sales: "first_name",
  tags: "name",
};
```

---

## Pattern B: Recent Selections Hook

Maintains a Most-Recently-Used (MRU) list for entity pickers with localStorage persistence.

```tsx
import { useRecentSelections } from "@/atomic-crm/hooks/useRecentSelections";

function ContactPicker() {
  const { recentItems, addRecent, clearRecent } = useRecentSelections('contacts');

  const handleSelect = (contact: { id: string; label: string }) => {
    addRecent(contact);
    // ... selection logic
  };

  return (
    <SelectUI
      header={recentItems.length > 0 ? "Recent" : undefined}
      headerItems={recentItems}
      // ...
    />
  );
}
```

**When to use**: Quick-select dropdowns that should remember recent selections.

### Implementation Details

```tsx
// useRecentSelections.ts:24-72
const MAX_RECENT_ITEMS = 5;

const recentItemSchema = z.strictObject({
  id: z.union([z.string(), z.number()]),
  label: z.string().max(255),
});
const recentItemsSchema = z.array(recentItemSchema).max(5);

export const useRecentSelections = (fieldType: string): UseRecentSelectionsReturn => {
  const storageKey = `crm_recent_${fieldType}`;

  // Initialize from storage (runs once)
  const loadFromStorage = (): RecentItem[] => {
    return getStorageItem<RecentItem[]>(storageKey, {
      type: "local",
      schema: recentItemsSchema,
    }) ?? [];
  };

  const [recentItems, setRecentItems] = useState<RecentItem[]>(loadFromStorage);

  // useCallback prevents re-creating on every render
  const saveToStorage = useCallback(
    (items: RecentItem[]) => {
      setStorageItem(storageKey, items, { type: "local" });
    },
    [storageKey]
  );

  const addRecent = useCallback(
    (item: RecentItem) => {
      setRecentItems((current) => {
        // Functional update avoids stale closure
        const filtered = current.filter((existing) => existing.id !== item.id);
        const updated = [item, ...filtered];
        const limited = updated.slice(0, MAX_RECENT_ITEMS);
        saveToStorage(limited);
        return limited;
      });
    },
    [saveToStorage]
  );

  const clearRecent = useCallback(() => {
    setRecentItems([]);
    removeStorageItem(storageKey);
  }, [storageKey]);

  return { recentItems, addRecent, clearRecent };
};
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `localStorage` (not session) | Recent items should persist across browser sessions |
| Max 5 items | Balances UX (quick access) with visual clutter |
| Zod `strictObject` | Prevents localStorage injection attacks |
| Functional state update | Avoids stale closure bugs in `addRecent` |

---

## Pattern C: Smart Defaults Hook

Pre-populates form fields from user identity context (current user, today's date).

```tsx
import { useSmartDefaults } from "@/atomic-crm/hooks/useSmartDefaults";
import { useForm } from "react-hook-form";

function ActivityCreateForm() {
  const form = useForm();
  const { defaults, isLoading } = useSmartDefaults({ reset: form.reset });

  if (isLoading) return <Skeleton />;

  return (
    <SimpleForm defaultValues={defaults}>
      {/* Form fields - sales_id and activity_date pre-populated */}
    </SimpleForm>
  );
}
```

**When to use**: Create forms where current user and today's date are sensible defaults.

### Implementation

```tsx
// useSmartDefaults.ts:15-41
export const useSmartDefaults = (
  options?: UseSmartDefaultsOptions
): { defaults: SmartDefaults; isLoading: boolean } => {
  const { data: identity, isLoading } = useGetIdentity<UserIdentity>();
  const hasResetRef = useRef(false);

  const defaults: SmartDefaults = {
    sales_id: identity?.id || null,
    activity_date: format(new Date(), "yyyy-MM-dd"),
  };

  useEffect(() => {
    if (options?.reset && identity && !isLoading && !hasResetRef.current) {
      hasResetRef.current = true;
      options.reset(defaults, { keepDirtyValues: true });
    }
    // 'defaults' intentionally omitted - see Pattern E
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity, isLoading, options?.reset]);

  return { defaults, isLoading };
};
```

### Integration with react-hook-form

```tsx
// ActivityCreateForm.tsx pattern
const form = useForm<ActivityFormValues>({
  defaultValues: {
    activity_type: 'call',
    // sales_id and activity_date will be set by useSmartDefaults
  },
});

const { defaults, isLoading } = useSmartDefaults({ reset: form.reset });

// The hook calls form.reset(defaults, { keepDirtyValues: true })
// This merges defaults without overwriting user-modified fields
```

---

## Pattern D: AppBar Height Hook

Returns the responsive height of the app bar for layout calculations.

```tsx
import useAppBarHeight from "@/atomic-crm/hooks/useAppBarHeight";

function StickyPanel() {
  const appBarHeight = useAppBarHeight();

  return (
    <div style={{ top: `${appBarHeight}px`, position: 'sticky' }}>
      {/* Panel content */}
    </div>
  );
}
```

**When to use**: Layout components that need to account for navbar offset.

### Implementation

```tsx
// useAppBarHeight.ts:1-9
import { useIsMobile } from "@/hooks/use-mobile";

const DENSE_NAVBAR_HEIGHT = 48;
const DENSE_NAVBAR_HEIGHT_MOBILE = 64;

export default function useAppBarHeight(): number {
  const isMobile = useIsMobile();
  return isMobile ? DENSE_NAVBAR_HEIGHT_MOBILE : DENSE_NAVBAR_HEIGHT;
}
```

### Common Usage Patterns

```tsx
// Sticky sidebar with navbar offset
const appBarHeight = useAppBarHeight();

<aside
  className="fixed"
  style={{
    top: appBarHeight,
    height: `calc(100vh - ${appBarHeight}px)`,
  }}
>

// Scroll-margin for anchor links
<section
  id="details"
  style={{ scrollMarginTop: appBarHeight }}
>
```

---

## Pattern E: Recent Items Hook (Cross-Resource)

Tracks recently viewed records across all resources using React Admin's `useStore` for persistence.

```tsx
import { useRecentItems, type RecentItem } from "@/atomic-crm/hooks";

function RecentlyViewed() {
  const { recentItems, addRecentItem, clearRecentItems } = useRecentItems();

  // When viewing a record
  const handleView = (record: Contact) => {
    addRecentItem({ id: record.id, resource: 'contacts', title: record.name });
  };

  return (
    <ul>
      {recentItems.map(item => (
        <li key={`${item.resource}-${item.id}`}>
          <Link to={`/${item.resource}/${item.id}`}>{item.title}</Link>
        </li>
      ))}
    </ul>
  );
}
```

**When to use**: Navigation menus, quick-access panels, "recently viewed" widgets.

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `useStore` (React Admin) | Persists to localStorage, clears on logout automatically |
| Max 10 items | Enough for quick access without overwhelming UI |
| `resource + id` deduplication | Same ID can exist in different resources (contact #5 vs org #5) |
| ISO timestamp | Enables sorting by recency |

---

## Pattern F: Recent Searches Hook (External Store)

Cross-entity recent searches using `useSyncExternalStore` for multi-component synchronization.

```tsx
import { useRecentSearches } from "@/atomic-crm/hooks/useRecentSearches";

function GlobalSearch() {
  const { recentItems, addRecent, clearRecent } = useRecentSearches();

  const handleSelect = (org: Organization) => {
    addRecent({ id: org.id, label: org.name, entityType: "organizations" });
  };

  return (
    <Combobox>
      {recentItems.length > 0 && (
        <ComboboxGroup label="Recent">
          {recentItems.map(item => (
            <ComboboxItem key={`${item.entityType}-${item.id}`}>
              {item.label}
            </ComboboxItem>
          ))}
        </ComboboxGroup>
      )}
    </Combobox>
  );
}
```

**When to use**: Global search components where multiple instances need synchronized state.

### Implementation Notes

This hook uses `useSyncExternalStore` for these reasons:
1. **Cross-tab sync**: `storage` event listener syncs data across browser tabs
2. **Same-tab sync**: Module-level subscriber set notifies all hook instances
3. **Stable snapshot**: Cached reference prevents infinite re-render loops

```tsx
// CRITICAL: getSnapshot must return stable reference
const recentSearchesStore = {
  getSnapshot: () => cachedSnapshot, // Return cached, NOT loadFromStorage()
  subscribe: (callback) => { /* ... */ },
  refreshCache: () => { cachedSnapshot = loadFromStorage(); notify(); },
};
```

---

## Pattern G: Related Record Counts Hook

Fetches counts of related records for cascade delete warning dialogs.

```tsx
import { useRelatedRecordCounts } from "@/atomic-crm/hooks/useRelatedRecordCounts";

function DeleteConfirmDialog({ resource, ids, open }) {
  const { relatedCounts, isLoading } = useRelatedRecordCounts({
    resource,
    ids,
    enabled: open, // Only fetch when dialog opens
  });

  return (
    <Dialog open={open}>
      {isLoading ? (
        <Spinner />
      ) : relatedCounts.length > 0 ? (
        <WarningList counts={relatedCounts} />
      ) : (
        <p>No related records will be affected.</p>
      )}
    </Dialog>
  );
}
```

**When to use**: Delete confirmation dialogs that need to show cascade impact.

### Relationship Configuration

```tsx
const RESOURCE_RELATIONSHIPS = {
  organizations: [
    { resource: "contacts", field: "organization_id", label: "Contacts" },
    { resource: "opportunities", field: "customer_organization_id", label: "Opportunities (Customer)" },
    { resource: "opportunities", field: "principal_organization_id", label: "Opportunities (Principal)" },
    { resource: "opportunities", field: "distributor_organization_id", label: "Opportunities (Distributor)" },
    { resource: "activities", field: "organization_id", label: "Activities" },
    { resource: "organization_notes", field: "organization_id", label: "Notes" },
  ],
  contacts: [
    { resource: "activities", field: "contact_id", label: "Activities" },
    { resource: "tasks", field: "contact_id", label: "Tasks" },
    { resource: "contact_notes", field: "contact_id", label: "Notes" },
    { resource: "opportunity_contacts", field: "contact_id", label: "Opportunity Links" },
  ],
};
```

### Return Value

```tsx
interface UseRelatedRecordCountsResult {
  relatedCounts: RelatedRecordCount[];
  isLoading: boolean;
  error: Error | null;
  /** True if some (but not all) queries failed - UI should show warning */
  hasPartialFailure: boolean;
}
```

---

## Pattern H: Derived State Patterns

Guidelines for `useMemo` and `useCallback` usage in hooks.

### When to Use useMemo

Use `useMemo` when:
1. Computing a value is expensive (array transforms, calculations)
2. Referential equality matters for downstream deps

```tsx
// ✅ GOOD: Expensive transformation
const sortedContacts = useMemo(
  () => contacts.sort((a, b) => a.last_seen.localeCompare(b.last_seen)),
  [contacts]
);

// ✅ GOOD: Object used in child component props
const chartOptions = useMemo(
  () => ({ data: salesData, type: 'bar' }),
  [salesData]
);
```

### When NOT to Use useMemo

```tsx
// ❌ BAD: Cheap computation, no downstream deps
const fullName = useMemo(
  () => `${first} ${last}`,
  [first, last]
);

// ✅ GOOD: Just compute it
const fullName = `${first} ${last}`;
```

### When to Use useCallback

Use `useCallback` when:
1. Function is passed as a dep to another hook's deps array
2. Function is passed to a memoized child component

```tsx
// ✅ GOOD: Used in deps array (useRecentSelections.ts:36-41)
const saveToStorage = useCallback(
  (items: RecentItem[]) => {
    setStorageItem(storageKey, items, { type: "local" });
  },
  [storageKey]
);

// addRecent depends on saveToStorage
const addRecent = useCallback(
  (item: RecentItem) => {
    setRecentItems((current) => { /* uses saveToStorage */ });
  },
  [saveToStorage]
);
```

### Intentional Non-Memoization

Sometimes NOT memoizing is the right choice:

```tsx
// useSmartDefaults.ts:24-27
// ✅ INTENTIONALLY NOT MEMOIZED
const defaults: SmartDefaults = {
  sales_id: identity?.id || null,
  activity_date: format(new Date(), "yyyy-MM-dd"),
};

// Why? The object is cheap to create and the useEffect
// uses hasResetRef to prevent multiple resets anyway.
// Memoizing would add complexity without benefit.
```

---

## Pattern I: Safe Notification Hook

Wraps React Admin's `useNotify` to automatically sanitize errors and provide consistent notification patterns.

```tsx
import { useSafeNotify } from "@/atomic-crm/hooks/useSafeNotify";

function ContactEdit() {
  const notify = useSafeNotify();

  const handleSave = async () => {
    try {
      await saveContact(data);
      notify.success("Contact saved successfully");
    } catch (error) {
      // Automatically converts technical errors to user-friendly messages
      notify.error(error, "Failed to save contact");
    }
  };

  // Action-specific error handling
  const handleDelete = async () => {
    try {
      await deleteContact(id);
    } catch (error) {
      notify.actionError(error, "delete", "contact");
      // Displays: "Failed to delete contact. Please try again."
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

**When to use**: Any component that needs to display notifications, especially error messages from API calls.

### Interface

```tsx
// useSafeNotify.ts:14-26
export interface SafeNotifyReturn {
  success: (message: string, options?: Omit<SafeNotifyOptions, "fallback">) => void;
  error: (error: unknown, fallbackOrOptions?: string | SafeNotifyOptions) => void;
  warning: (message: string, options?: Omit<SafeNotifyOptions, "fallback">) => void;
  info: (message: string, options?: Omit<SafeNotifyOptions, "fallback">) => void;
  actionError: (
    error: unknown,
    action: "create" | "update" | "delete" | "save" | "load",
    resource?: string
  ) => void;
}
```

### Implementation

```tsx
// useSafeNotify.ts
import {
  TOAST_SUCCESS_DURATION_MS,
  TOAST_INFO_DURATION_MS,
  TOAST_ERROR_DURATION_MS,
} from "@/atomic-crm/constants";

export function useSafeNotify(): SafeNotifyReturn {
  const notify = useNotify();

  const success = useCallback(
    (message: string, options?: Omit<SafeNotifyOptions, "fallback">) => {
      notify(message, {
        type: "success",
        autoHideDuration: options?.autoHideDuration ?? TOAST_SUCCESS_DURATION_MS,
        undoable: options?.undoable,
        messageArgs: options?.messageArgs,
      });
    },
    [notify]
  );

  const error = useCallback(
    (err: unknown, fallbackOrOptions?: string | SafeNotifyOptions) => {
      let fallback: string | undefined;
      let options: Omit<SafeNotifyOptions, "fallback"> = {};

      if (typeof fallbackOrOptions === "string") {
        fallback = fallbackOrOptions;
      } else if (fallbackOrOptions) {
        fallback = fallbackOrOptions.fallback;
        options = fallbackOrOptions;
      }

      const message = fallback ?? mapErrorToUserMessage(err);
      notify(message, {
        type: "error",
        autoHideDuration: options.autoHideDuration ?? TOAST_ERROR_DURATION_MS,
        undoable: options.undoable,
        messageArgs: options.messageArgs,
      });
    },
    [notify]
  );

  const actionError = useCallback(
    (err: unknown, action: "create" | "update" | "delete" | "save" | "load", resource?: string) => {
      // First try to get a meaningful message from the error
      const sanitized = mapErrorToUserMessage(err);
      // If generic, use the action-specific fallback
      const isGeneric = sanitized === "Something went wrong. Please try again.";
      const message = isGeneric ? getActionErrorMessage(action, resource) : sanitized;

      notify(message, { type: "error", autoHideDuration: TOAST_ERROR_DURATION_MS });
    },
    [notify]
  );

  // ... warning, info methods (use TOAST_INFO_DURATION_MS)
}
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Wraps `useNotify` | Maintains React Admin compatibility while adding safety |
| `mapErrorToUserMessage` | Converts database/technical errors to user-friendly text |
| All methods use `useCallback` | Ensures stable references for downstream deps |
| `actionError` helper | Uses `getActionErrorMessage(action, resource)` (no error param) for consistent CRUD messages |
| Duration constants | Uses `TOAST_SUCCESS_DURATION_MS`, `TOAST_ERROR_DURATION_MS`, `TOAST_INFO_DURATION_MS` from `@/atomic-crm/constants` (not hardcoded `3000`/`5000`) |

### Error Sanitization

```tsx
// Example: Database error transformation
try {
  await supabase.from('contacts').insert(data);
} catch (error) {
  notify.error(error);
  // Raw error: "duplicate key value violates unique constraint..."
  // User sees: "This action could not be completed. Please try again."
}

// With custom fallback
try {
  await complexOperation();
} catch (error) {
  notify.error(error, "Unable to complete operation");
  // User sees custom message instead of sanitized default
}
```

---

## Hook Comparison Table

| Hook | Storage | Validation | React Admin | Use Case |
|------|---------|------------|-------------|----------|
| `useFilterCleanup` | localStorage | Zod | `useStore` | List filter/sort cleanup |
| `useRecentSelections` | localStorage | Zod | None | MRU dropdown sections |
| `useSmartDefaults` | None | None | `useGetIdentity` | Form default values |
| `useAppBarHeight` | None | None | None | Responsive layout calc |
| `useRecentItems` | useStore (localStorage) | None | `useStore` | Cross-resource recent records |
| `useRecentSearches` | localStorage | Zod | None | Global search recents |
| `useRelatedRecordCounts` | None | None | `useDataProvider` | Cascade delete warnings |
| `useSafeNotify` | None | None | `useNotify` | Safe error notifications |

### Decision Tree

```
Need to clean stale React Admin cache?
└── Yes → useFilterCleanup

Need to remember user's recent selections in a picker?
└── Yes → useRecentSelections

Need current user + date as form defaults?
└── Yes → useSmartDefaults

Need navbar height for layout calculations?
└── Yes → useAppBarHeight

Need to track recently viewed records across resources?
└── Yes → useRecentItems

Need synchronized recent searches across components?
└── Yes → useRecentSearches

Need to show cascade impact before delete?
└── Yes → useRelatedRecordCounts

Need safe, user-friendly error notifications?
└── Yes → useSafeNotify
```

---

## Anti-Patterns

### ❌ Reading localStorage on Every Render

```tsx
// ❌ BAD: Reads localStorage on every render
function BadHook() {
  const data = JSON.parse(localStorage.getItem('key') || '[]');
  return data;
}

// ✅ GOOD: Initialize state once
function GoodHook() {
  const [data] = useState(() => {
    return JSON.parse(localStorage.getItem('key') || '[]');
  });
  return data;
}
```

### ❌ Missing useCallback for Storage Functions

```tsx
// ❌ BAD: Creates new function every render, breaks deps
function BadHook() {
  const save = (items) => localStorage.setItem('key', JSON.stringify(items));

  const addItem = useCallback((item) => {
    // save reference changes every render!
  }, [save]); // eslint warns about this
}

// ✅ GOOD: Stable function reference
function GoodHook() {
  const save = useCallback((items) => {
    localStorage.setItem('key', JSON.stringify(items));
  }, []);

  const addItem = useCallback((item) => {
    // save is stable
  }, [save]);
}
```

### ❌ Mutable Object in Deps Array

```tsx
// ❌ BAD: Infinite loop - defaults is new object every render
const defaults = { sales_id: identity?.id };

useEffect(() => {
  reset(defaults);
}, [defaults]); // defaults changes every render!

// ✅ GOOD: Use ref to track first run
const hasResetRef = useRef(false);

useEffect(() => {
  if (!hasResetRef.current && identity) {
    hasResetRef.current = true;
    reset({ sales_id: identity.id });
  }
}, [identity, reset]);
```

### ❌ Using watch() Instead of useWatch()

```tsx
// ❌ BAD: Re-renders entire form on any field change
const { watch } = useFormContext();
const orgId = watch('org_id');

// ✅ GOOD: Isolated subscription
const orgId = useWatch({ name: 'org_id' });
```

### ❌ Hardcoded Storage Keys

```tsx
// ❌ BAD: Key collisions, hard to track
localStorage.setItem('recent', JSON.stringify(items));

// ✅ GOOD: Namespaced, predictable
const storageKey = `crm_recent_${fieldType}`;
setStorageItem(storageKey, items, { type: "local" });
```

### ❌ Raw JSON.parse on localStorage

```tsx
// ❌ BAD: No validation, type confusion attacks possible
const data = JSON.parse(localStorage.getItem('key') || '{}');

// ✅ GOOD: Zod validation for defense-in-depth
const data = safeJsonParse(localStorage.getItem('key'), schema);
```

---

## Migration Checklist

When adding a new shared hook to `src/atomic-crm/hooks/`:

1. [ ] Create hook file: `src/atomic-crm/hooks/useYourHook.ts`
2. [ ] Add TypeScript types for return value:
   ```tsx
   interface UseYourHookReturn {
     data: YourData;
     isLoading: boolean;
   }
   ```
3. [ ] Add Zod schema if using storage:
   ```tsx
   const yourDataSchema = z.strictObject({
     field: z.string().max(255),
   });
   ```
4. [ ] Use `secureStorage` utilities (not raw localStorage):
   ```tsx
   import { getStorageItem, setStorageItem } from "@/atomic-crm/utils/secureStorage";
   ```
5. [ ] Export from barrel file (`index.ts`):
   ```tsx
   export { useYourHook } from "./useYourHook";
   ```
6. [ ] Document pattern in this PATTERNS.md file
7. [ ] Verify TypeScript: `npm run typecheck`
8. [ ] Test hook behavior in browser DevTools

---

## Storage Utilities Reference

All hooks should use the secure storage utilities from `src/atomic-crm/utils/secureStorage.ts`:

```tsx
import {
  getStorageItem,    // Read with Zod validation
  setStorageItem,    // Write with fallback
  removeStorageItem, // Remove from both session + local
  clearStorageByPrefix, // Bulk clear (e.g., logout)
} from "@/atomic-crm/utils/secureStorage";

// Example: Read with schema validation
const items = getStorageItem<RecentItem[]>('crm_recent_contacts', {
  type: "local",      // or "session"
  schema: recentItemsSchema,
});

// Example: Write
setStorageItem('crm_recent_contacts', items, { type: "local" });

// Example: Clear all CRM cache on logout
clearStorageByPrefix('crm_');
```

See `src/atomic-crm/utils/secureStorage.ts` for full API documentation.
