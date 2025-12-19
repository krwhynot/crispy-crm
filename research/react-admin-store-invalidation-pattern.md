# React Admin Store Invalidation Pattern

> **Standard for handling stale localStorage preferences in React Admin applications**

## Overview

React Admin persists user preferences (filters, sort, pagination, theme, sidebar state) to browser localStorage. When the application schema changes (e.g., removing a database column that was used in a filter), users with stale preferences encounter runtime errors.

This document describes the **Store Invalidation Pattern** - the official React Admin solution for this problem.

## The Problem

### Scenario
1. User applies a filter on `full_name` column in Contacts list
2. React Admin saves this filter preference to localStorage
3. Developer removes `full_name` column from database view
4. User returns to app - stale filter is loaded from localStorage
5. Query fails: `"column contacts_summary.full_name does not exist"`

### Why It Happens
```
┌─────────────┐    localStorage    ┌──────────────┐
│  Browser    │ ←───────────────── │  React Admin │
│  localStorage │   persists       │  Store       │
│  { filters: │   preferences     │              │
│    full_name │                   │              │
│  }          │                    │              │
└─────────────┘                    └──────────────┘
       │
       ▼ Page reload
┌─────────────────────────────────────────────────┐
│  Stale filter applied to query                  │
│  → PostgREST error: column does not exist       │
└─────────────────────────────────────────────────┘
```

## The Solution: Store Version Invalidation

React Admin's `localStorageStore()` accepts a **version parameter**. When the version changes, all stored preferences are automatically cleared.

### Implementation

```tsx
// src/atomic-crm/root/CRM.tsx
import { localStorageStore } from "ra-core";

// Version format: Increment when schema changes break stored preferences
const STORE_VERSION = "2";

const App = () => (
  <Admin
    dataProvider={dataProvider}
    store={localStorageStore(STORE_VERSION, "CRM")}
  >
    {/* Resources */}
  </Admin>
);
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `version` | `string \| undefined` | Store version identifier. Change to invalidate all preferences. |
| `appKey` | `string \| undefined` | Application namespace. Prevents conflicts between multiple React Admin apps on same domain. |

## When to Bump the Version

Increment the store version when:

| Change Type | Example | Bump Version? |
|-------------|---------|---------------|
| Remove filterable column | Remove `full_name` from view | ✅ Yes |
| Rename filterable column | `company_id` → `organization_id` | ✅ Yes |
| Change filter operators | `@eq` → `@ilike` | ✅ Yes |
| Add new column | Add `created_by` to view | ❌ No |
| Change display formatting | Update date format | ❌ No |
| Add new resource | Add `products` resource | ❌ No |

## Alternative Approaches

### 1. Disable Persistence Per-List

```tsx
// Disable filter/sort persistence for a specific list
const ContactList = () => (
  <List storeKey={false}>
    {/* ... */}
  </List>
);
```

**Pros**: No stale data issues
**Cons**: Poor UX - users lose their preferences on every page load

### 2. Validate Stored Values

```tsx
// Defensive coding - validate before use
const preferences = useStore('preferences');
if (!isValidPreference(preferences)) {
  // Use default instead
}
```

**Pros**: Granular control
**Cons**: Must anticipate all possible stale states

### 3. useResetStore Hook

```tsx
import { useResetStore } from 'react-admin';

const ResetButton = () => {
  const reset = useResetStore();
  return <button onClick={reset}>Reset Preferences</button>;
};
```

**Pros**: User-controlled
**Cons**: Requires user action, not automatic

## Best Practices

### 1. Use Semantic Versioning

```tsx
// Good: Semantic version string
const STORE_VERSION = "2.1.0";

// Also good: Simple increment
const STORE_VERSION = "3";

// Avoid: Dates (hard to compare)
const STORE_VERSION = "2024-12-18"; // Not recommended
```

### 2. Document Version Changes

```tsx
/**
 * Store Version History:
 * - v1: Initial release
 * - v2: Removed full_name column from contacts_summary (2024-12-18)
 * - v3: Renamed company_id to organization_id (future)
 */
const STORE_VERSION = "2";
```

### 3. Combine with Filter Validation

Store invalidation handles existing users, but filter validation prevents new issues:

```tsx
// filterRegistry.ts - Define allowed filter fields
export const filterableFields = {
  contacts: ["first_name", "last_name", "email", "status"],
  // full_name intentionally NOT included
};

// ValidationService.ts - Reject invalid filters
validateFilters(resource, filters) {
  // Throws HttpError 400 if filter field not in registry
}
```

## Crispy CRM Implementation

### Current Configuration

**File**: `src/atomic-crm/root/CRM.tsx:181`

```tsx
store={localStorageStore("2", "CRM")}
// Version 2: Invalidates stale filters (fixes full_name column error)
```

### Version History

| Version | Date | Change |
|---------|------|--------|
| `undefined` | Initial | No version (default) |
| `"2"` | 2024-12-18 | Invalidate stale `full_name` filter causing PostgreSQL error |

## References

- [React Admin Store Documentation](https://marmelab.com/react-admin/Store.html)
- [Store Invalidation](https://marmelab.com/react-admin/Store.html#store-invalidation)
- [Disabling Parameters Persistence](https://marmelab.com/react-admin/List.html#disabling-parameters-persistence)
- [useResetStore Hook](https://marmelab.com/react-admin/useResetStore.html)

## Related Files

- `src/atomic-crm/root/CRM.tsx` - Store configuration
- `src/atomic-crm/providers/supabase/filterRegistry.ts` - Allowed filter fields
- `src/atomic-crm/providers/supabase/services/ValidationService.ts` - Filter validation
