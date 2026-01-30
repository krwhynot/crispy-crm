# Custom Hooks Architecture

Reusable React hooks for state management, UI interactions, and data fetching. Encapsulates complex logic to keep components clean and focused on rendering.

**Location:** `src/hooks/`
**Related:** `src/atomic-crm/queryKeys.ts` (Query key factories), `CODE_QUALITY.md`, `STALE_STATE_STRATEGY.md`

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Feature Components                     │
│           (ContactList, OpportunityEdit, etc.)          │
└──────────────────┬──────────────────────────────────────┘
                   │ Calls
                   ▼
┌─────────────────────────────────────────────────────────┐
│                   Custom Hooks Layer                     │
│  ┌────────────────┬────────────────┬──────────────────┐ │
│  │  Data Hooks    │   State Hooks  │  Utility Hooks   │ │
│  │                │                │                  │ │
│  │ • useFavorites │ • useSlideOver │ • useIsMobile    │ │
│  │ • useOrgDesc.. │ • useKeyboard  │ • useBreakpoint  │ │
│  │ • useTeam...   │ • useUnsaved.. │ • usePermissions │ │
│  └────────┬───────┴────────┬───────┴──────┬───────────┘ │
└───────────┼────────────────┼──────────────┼─────────────┘
            │                │              │
            ▼                ▼              ▼
┌────────────────┐  ┌────────────┐  ┌─────────────────┐
│ React Admin    │  │ React      │  │ Browser APIs    │
│ Data Hooks     │  │ Core Hooks │  │ (Media Queries, │
│ (useGetList,   │  │ (useState, │  │  Events, etc.)  │
│  useCreate,    │  │  useEffect,│  │                 │
│  useNotify)    │  │  useCallback)  └─────────────────┘
└────────────────┘  └────────────┘
```

**Categories:**
- **Data Hooks:** Wrap React Admin hooks for fetching/mutating data (`useFavorites`, `useOrganizationDescendants`, `useTeamMembers`)
- **State Hooks:** Manage complex UI state with URL sync, browser history, keyboard listeners (`useSlideOverState`, `useKeyboardShortcuts`, `useUnsavedChangesWarning`)
- **Utility Hooks:** Environment detection, permissions, responsive breakpoints (`useIsMobile`, `useBreakpoint`, `usePermissions`)

## Pattern 1: Query-Based Data Hooks (Optimistic Updates)

Data hooks that fetch and mutate records using React Query and React Admin hooks, with optimistic UI updates for instant feedback.

### Implementation

```typescript
// src/hooks/useFavorites.ts
import { useState, useCallback, useMemo } from "react";
import { useGetList, useCreate, useUpdate, useNotify, useGetIdentity } from "react-admin";
import { useQueryClient } from "@tanstack/react-query";
import { userFavoriteKeys } from "@/atomic-crm/queryKeys";

export interface UseFavoritesReturn {
  favorites: Favorite[];
  isLoading: boolean;
  isFavorite: (entityType: FavoriteEntityType, entityId: number) => boolean;
  toggleFavorite: (
    entityType: FavoriteEntityType,
    entityId: number,
    displayName: string
  ) => Promise<void>;
  canAddMore: boolean;
  favoritesCount: number;
}

export function useFavorites(): UseFavoritesReturn {
  const { data: identity } = useGetIdentity();
  const notify = useNotify();
  const [create] = useCreate();
  const [update] = useUpdate();
  const queryClient = useQueryClient();

  // Optimistic state for instant UI feedback
  const [optimisticState, setOptimisticState] = useState<Map<string, boolean>>(new Map());

  const userId = identity?.user_id;

  // Fetch favorites with React Admin hook
  const { data: favoritesData = [], isLoading } = useGetList<Favorite>(
    "user_favorites",
    {
      pagination: { page: 1, perPage: MAX_FAVORITES },
      sort: { field: "created_at", order: "DESC" },
      filter: userId ? { user_id: userId, deleted_at: null } : {},
    },
    { enabled: !!userId }
  );

  const favorites = useMemo(() => favoritesData, [favoritesData]);

  const isFavorite = useCallback(
    (entityType: FavoriteEntityType, entityId: number): boolean => {
      const key = `${entityType}:${entityId}`;
      const optimisticValue = optimisticState.get(key);

      // Optimistic state takes precedence
      if (optimisticValue !== undefined) {
        return optimisticValue;
      }

      return favorites.some((fav) => fav.entity_type === entityType && fav.entity_id === entityId);
    },
    [favorites, optimisticState]
  );

  const toggleFavorite = useCallback(
    async (
      entityType: FavoriteEntityType,
      entityId: number,
      displayName: string
    ): Promise<void> => {
      if (!userId) {
        notify("You must be logged in to manage favorites", { type: "error" });
        return;
      }

      const key = `${entityType}:${entityId}`;
      const currentlyFavorited = isFavorite(entityType, entityId);

      // Optimistic update - instant UI feedback
      setOptimisticState((prev) => new Map(prev).set(key, !currentlyFavorited));

      try {
        if (currentlyFavorited) {
          // Remove favorite (soft delete)
          await update(
            "user_favorites",
            { id: existingFavorite.id, data: { deleted_at: new Date().toISOString() } },
            {
              onSuccess: () => {
                setOptimisticState((prev) => {
                  const next = new Map(prev);
                  next.delete(key);
                  return next;
                });
                queryClient.invalidateQueries({ queryKey: userFavoriteKeys.all });
              },
              onError: (error: unknown) => {
                // Rollback optimistic update on error
                setOptimisticState((prev) => {
                  const next = new Map(prev);
                  next.delete(key);
                  return next;
                });
                notify(error instanceof Error ? error.message : "Failed to remove favorite", {
                  type: "error",
                });
              },
            }
          );
        } else {
          // Add favorite
          await create(
            "user_favorites",
            { data: { user_id: userId, entity_type: entityType, entity_id: entityId, display_name: displayName } },
            {
              onSuccess: () => {
                setOptimisticState((prev) => {
                  const next = new Map(prev);
                  next.delete(key);
                  return next;
                });
                queryClient.invalidateQueries({ queryKey: userFavoriteKeys.all });
              },
              onError: (error: unknown) => {
                setOptimisticState((prev) => {
                  const next = new Map(prev);
                  next.delete(key);
                  return next;
                });
                notify(error instanceof Error ? error.message : "Failed to add favorite", {
                  type: "error",
                });
              },
            }
          );
        }
      } catch (error) {
        // Log unexpected errors
        logger.error("Unexpected error during toggleFavorite", error, {
          feature: "useFavorites",
          entityType,
          entityId: String(entityId),
        });
        setOptimisticState((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
        notify("An unexpected error occurred", { type: "error" });
      }
    },
    [userId, isFavorite, favorites, create, update, notify, queryClient]
  );

  return {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
    canAddMore: favorites.length < MAX_FAVORITES,
    favoritesCount: favorites.length,
  };
}
```

**Key Rules:**
- Use `useGetList`, `useCreate`, `useUpdate` from React Admin (never direct Supabase calls)
- Optimistic state via `useState<Map>` for instant UI feedback
- Rollback optimistic updates in `onError` callbacks
- Invalidate query cache with `queryClient.invalidateQueries({ queryKey: resourceKeys.all })`
- Return object with clear interface (`UseFavoritesReturn`)
- Handle auth state (`identity?.user_id`) before mutations

## Pattern 2: URL-Synchronized UI State

State hooks that sync UI state with URL query params for deep linking and browser history support.

### Implementation

```typescript
// src/hooks/useSlideOverState.ts
import { useState, useEffect, useCallback } from "react";

export interface UseSlideOverStateReturn {
  slideOverId: number | null;
  isOpen: boolean;
  mode: "view" | "edit";
  openSlideOver: (id: number, initialMode?: "view" | "edit") => void;
  closeSlideOver: () => void;
  setMode: (mode: "view" | "edit") => void;
  toggleMode: () => void;
}

/**
 * Helper to extract query params from hash-based URL
 * For URLs like: #/contacts?view=123 or #/contacts?filter={}&view=123
 */
function getHashParams(): URLSearchParams {
  const hash = window.location.hash;
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) return new URLSearchParams();
  return new URLSearchParams(hash.slice(queryIndex + 1));
}

/**
 * Helper to update query params in hash-based URL
 */
function setHashParams(params: URLSearchParams): string {
  const hash = window.location.hash;
  const queryIndex = hash.indexOf("?");
  const basePath = queryIndex === -1 ? hash : hash.slice(0, queryIndex);
  const paramString = params.toString();
  return paramString ? `${basePath}?${paramString}` : basePath;
}

export function useSlideOverState(): UseSlideOverStateReturn {
  const [slideOverId, setSlideOverId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">("view");

  // Parse URL params on initial load to support deep linking (hash-based routing)
  useEffect(() => {
    const params = getHashParams();
    const viewId = params.get("view");
    const editId = params.get("edit");

    if (viewId) {
      setSlideOverId(Number(viewId));
      setMode("view");
      setIsOpen(true);
    } else if (editId) {
      setSlideOverId(Number(editId));
      setMode("edit");
      setIsOpen(true);
    }
  }, []); // Run once on mount

  const closeSlideOver = useCallback(() => {
    setIsOpen(false);
    setSlideOverId(null);
    // Remove slide-over params from URL (hash-based routing)
    const params = getHashParams();
    params.delete("view");
    params.delete("edit");
    const newHash = setHashParams(params);
    window.history.pushState(null, "", newHash);
  }, []);

  // Listen to browser back/forward navigation and hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const params = getHashParams();
      const viewId = params.get("view");
      const editId = params.get("edit");

      if (viewId) {
        setSlideOverId(Number(viewId));
        setMode("view");
        setIsOpen(true);
      } else if (editId) {
        setSlideOverId(Number(editId));
        setMode("edit");
        setIsOpen(true);
      } else {
        // No params means slide-over should be closed
        setIsOpen(false);
        setSlideOverId(null);
      }
    };

    window.addEventListener("popstate", handleHashChange);
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("popstate", handleHashChange);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  // Handle ESC key to close slide-over
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        closeSlideOver();
      }
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, closeSlideOver]);

  const openSlideOver = (id: number, initialMode: "view" | "edit" = "view") => {
    setSlideOverId(id);
    setMode(initialMode);
    setIsOpen(true);
    // Update URL for deep linking and browser history (hash-based routing)
    const params = getHashParams();
    params.delete("view");
    params.delete("edit");
    params.set(initialMode, String(id));
    const newHash = setHashParams(params);
    window.history.pushState(null, "", newHash);
  };

  const toggleMode = () => {
    const newMode = mode === "view" ? "edit" : "view";
    setMode(newMode);
    // Update URL when mode changes (hash-based routing)
    if (slideOverId) {
      const params = getHashParams();
      params.delete("view");
      params.delete("edit");
      params.set(newMode, String(slideOverId));
      const newHash = setHashParams(params);
      window.history.replaceState(null, "", newHash);
    }
  };

  return { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, setMode, toggleMode };
}
```

**Key Rules:**
- Parse URL params on mount for deep linking support
- Use `window.history.pushState()` for navigation actions (open, close)
- Use `window.history.replaceState()` for state changes (mode toggle)
- Listen to `popstate` and `hashchange` events for browser back/forward
- Extract URL parsing into helper functions (`getHashParams`, `setHashParams`)
- Support hash-based routing (`#/contacts?view=123`) for React Admin compatibility

## Pattern 3: Responsive Breakpoint Detection (MediaQuery Hooks)

Hooks that detect screen size and device type using native MediaQuery API with proper SSR handling.

### Implementation

```typescript
// src/hooks/useBreakpoint.ts
import { useEffect, useState } from "react";

export type Breakpoint = "mobile" | "tablet-portrait" | "tablet-landscape" | "laptop" | "desktop";

const BREAKPOINT_QUERIES: Record<Breakpoint, string> = {
  mobile: "(max-width: 767px)",
  "tablet-portrait": "(min-width: 768px) and (max-width: 1023px)",
  "tablet-landscape": "(min-width: 1024px) and (max-width: 1279px)",
  laptop: "(min-width: 1280px) and (max-width: 1439px)",
  desktop: "(min-width: 1440px)",
};

const BREAKPOINT_ORDER: Breakpoint[] = [
  "desktop",
  "laptop",
  "tablet-landscape",
  "tablet-portrait",
  "mobile",
];

function getCurrentBreakpoint(): Breakpoint {
  for (const bp of BREAKPOINT_ORDER) {
    if (window.matchMedia(BREAKPOINT_QUERIES[bp]).matches) {
      return bp;
    }
  }
  return "mobile";
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
    typeof window !== "undefined" ? getCurrentBreakpoint() : "desktop"
  );

  useEffect(() => {
    const mediaQueries = Object.entries(BREAKPOINT_QUERIES).map(([bp, query]) => ({
      breakpoint: bp as Breakpoint,
      mql: window.matchMedia(query),
    }));

    const handleChange = () => {
      setBreakpoint(getCurrentBreakpoint());
    };

    // Attach listeners to all media queries
    mediaQueries.forEach(({ mql }) => {
      mql.addEventListener("change", handleChange);
    });

    return () => {
      mediaQueries.forEach(({ mql }) => {
        mql.removeEventListener("change", handleChange);
      });
    };
  }, []);

  return breakpoint;
}

// Convenience hooks for common checks
export function useIsDesktop(): boolean {
  return useBreakpoint() === "desktop";
}

export function useIsLaptopOrLarger(): boolean {
  const bp = useBreakpoint();
  return bp === "desktop" || bp === "laptop";
}

export function useIsMobileOrTablet(): boolean {
  const bp = useBreakpoint();
  return bp === "mobile" || bp === "tablet-portrait" || bp === "tablet-landscape";
}
```

```typescript
// src/hooks/use-mobile.ts (Simple mobile detection)
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
```

**Key Rules:**
- Use `window.matchMedia()` for native browser support (no CSS-in-JS overhead)
- SSR-safe initialization: `typeof window !== "undefined" ? getCurrentBreakpoint() : "desktop"`
- Attach listeners to media query list (MQL) for automatic updates
- Return `undefined` initially to prevent hydration mismatches (`useIsMobile`)
- Define breakpoints as constants at the top (single source of truth)
- Provide convenience hooks for common checks (`useIsDesktop`, `useIsMobileOrTablet`)

## Pattern 4: React Query Wrappers with Centralized Keys

Hooks that wrap `useQuery` for custom data fetching with cache invalidation support via centralized query key factories.

### Implementation

```typescript
// src/atomic-crm/queryKeys.ts (Centralized query key factory)
const createKeys = <T extends string>(resource: T) => ({
  all: [resource] as const,
  lists: () => [resource, "list"] as const,
  list: (filters?: Record<string, unknown>) => [resource, "list", filters] as const,
  details: () => [resource, "detail"] as const,
  detail: (id: number | string) => [resource, "detail", id] as const,
});

export const contactKeys = createKeys("contacts");
export const organizationKeys = createKeys("organizations");

// Custom / Non-CRUD Keys
export const orgDescendantKeys = {
  all: ["org-descendants"] as const,
  detail: (orgId: number) => ["org-descendants", orgId] as const,
};
```

```typescript
// src/hooks/useOrganizationDescendants.ts
import { useQuery } from "@tanstack/react-query";
import { useDataProvider } from "ra-core";
import { orgDescendantKeys } from "@/atomic-crm/queryKeys";
import { SHORT_STALE_TIME_MS } from "@/atomic-crm/constants";

/**
 * Hook to fetch all descendant organization IDs for hierarchy cycle prevention.
 *
 * Used by ParentOrganizationInput to exclude self + descendants from parent
 * selection dropdown, preventing circular references in the org hierarchy.
 */
export interface UseOrganizationDescendantsReturn {
  descendants: number[];
  isLoading: boolean;
  isFetched: boolean;
}

export function useOrganizationDescendants(
  orgId: number | undefined
): UseOrganizationDescendantsReturn {
  const dataProvider = useDataProvider();

  const {
    data: descendants = [],
    isLoading,
    isFetched,
  } = useQuery({
    queryKey: orgDescendantKeys.detail(orgId!),
    queryFn: async () => {
      if (!orgId) return [];
      const result = await dataProvider.invoke("get_organization_descendants", {
        org_id: orgId,
      });
      return (result.data as number[]) || [];
    },
    enabled: !!orgId,
    staleTime: SHORT_STALE_TIME_MS, // Cache for 30s - hierarchy doesn't change often
  });

  return { descendants, isLoading, isFetched };
}
```

**Key Rules:**
- **Centralized Keys:** Define query keys in `src/atomic-crm/queryKeys.ts` using factory pattern
- Use `queryKey: resourceKeys.detail(id)` for fetching (exact match for invalidation)
- `enabled: !!dependency` for conditional fetching (disabled until dependency ready)
- Set appropriate `staleTime` based on data volatility (see `STALE_STATE_STRATEGY.md`)
- Return typed interface for hook return values (`UseOrganizationDescendantsReturn`)
- `useDataProvider()` instead of direct Supabase calls (respects provider abstraction)

**Cache Invalidation:**
```typescript
// After updating organization hierarchy
queryClient.invalidateQueries({ queryKey: orgDescendantKeys.detail(orgId) });
```

## Pattern 5: Form State Integration Hooks

Hooks that integrate with React Hook Form to manage form state, dirty tracking, and browser warnings.

### Implementation

```typescript
// src/hooks/useUnsavedChangesWarning.ts
import { useEffect } from "react";
import { useFormState } from "react-hook-form";
import { shouldDisableBeforeUnload } from "@/utils/device";

/**
 * Hook to warn users before leaving a page with unsaved form changes.
 * Must be used inside a Form context (child of FormProvider).
 *
 * @param enabled - Whether the warning is active (default: true)
 * @returns Object containing isDirty state
 */
export function useUnsavedChangesWarning(enabled = true) {
  const { isDirty } = useFormState();

  useEffect(() => {
    if (!enabled || shouldDisableBeforeUnload()) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = ""; // Chrome requires returnValue to be set
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, enabled]);

  return { isDirty };
}
```

**Key Rules:**
- **Form Context Required:** Hook MUST be used inside a component wrapped by `<FormProvider>` or React Admin's `<Form>`
- Use `useFormState()` from React Hook Form (not `useWatch` or manual state tracking)
- Respect device-specific behavior (`shouldDisableBeforeUnload()` for mobile/tablet)
- Set `e.returnValue = ""` for browser compatibility (Chrome requirement)
- Return minimal state (`isDirty`) for component consumption
- Disable with `enabled={false}` for forms without critical data

**Usage:**
```typescript
// Inside a React Admin form component
export const ContactEdit = () => {
  const { isDirty } = useUnsavedChangesWarning(); // Automatically warns on unsaved changes

  return (
    <Edit>
      <SimpleForm>
        <TextInput source="first_name" />
        <TextInput source="last_name" />
      </SimpleForm>
    </Edit>
  );
};
```

## Pattern 6: Permission & RBAC Hooks

Hooks that wrap identity and permission checks for role-based access control.

### Implementation

```typescript
// src/hooks/usePermissions.ts
import { useGetIdentity } from "react-admin";
import { canAccess } from "../atomic-crm/providers/commons/canAccess";
import type { UserRole } from "./useUserRole";

export type PermissionAction = "list" | "show" | "create" | "edit" | "delete" | "export";
export type PermissionResource =
  | "contacts"
  | "organizations"
  | "opportunities"
  | "activities"
  | "tasks"
  | "sales"
  | "products"
  | "tags"
  | "segments";

export interface UsePermissionsReturn {
  can: <RecordType extends Record<string, unknown> = Record<string, unknown>>(
    action: PermissionAction,
    resource: PermissionResource,
    record?: RecordType
  ) => boolean;
  role: UserRole;
  salesId: number | null;
  isAdmin: boolean;
  isManager: boolean;
  isRep: boolean;
  isManagerOrAdmin: boolean;
  isLoading: boolean;
}

/**
 * Hook that combines useUserRole with canAccess for convenient permission checking.
 * Provides ownership-aware permission checks for rep users by passing the current
 * user's sales_id to the canAccess helper.
 *
 * @example
 * ```tsx
 * const { can, isAdmin } = usePermissions();
 *
 * // Check if user can delete contacts
 * if (can('delete', 'contacts')) {
 *   return <DeleteButton />;
 * }
 *
 * // Check with record context (ownership check for reps)
 * if (can('edit', 'opportunities', { sales_id: 123 })) {
 *   return <EditButton />;
 * }
 * ```
 */
export const usePermissions = (): UsePermissionsReturn => {
  const { identity, isLoading } = useGetIdentity();

  // Identity from authProvider includes role (custom field) and id (sales.id as number)
  const role: UserRole = (identity?.role as UserRole) || "rep";
  // identity.id is sales.id (bigint in DB, number in JS) - used for ownership checks
  const salesId = typeof identity?.id === "number" ? identity.id : null;

  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isRep = role === "rep";
  const isManagerOrAdmin = isAdmin || isManager;

  const can = <RecordType extends Record<string, unknown> = Record<string, unknown>>(
    action: PermissionAction,
    resource: PermissionResource,
    record?: RecordType
  ): boolean => {
    // Pass salesId for ownership checks (only used for rep edit/delete with record)
    return canAccess(role, { action, resource, record }, salesId);
  };

  return {
    can,
    role,
    salesId,
    isAdmin,
    isManager,
    isRep,
    isManagerOrAdmin,
    isLoading,
  };
};
```

**Key Rules:**
- **Single Source of Truth:** Use `useGetIdentity()` from React Admin (synced with authProvider)
- Delegate logic to `canAccess()` helper (keep hook thin, testable)
- Generic `can()` function accepts optional record for ownership checks (`record.sales_id`)
- Return boolean flags for common checks (`isAdmin`, `isManagerOrAdmin`)
- Return `isLoading` for conditional rendering during auth check
- **Type Safety:** Use `UserRole`, `PermissionAction`, `PermissionResource` types from centralized definitions

**Usage:**
```typescript
// Conditional rendering based on permissions
const { can, isLoading } = usePermissions();

if (isLoading) return <Loading />;

return (
  <List actions={can('create', 'contacts') ? <CreateButton /> : false}>
    <Datagrid>
      <TextField source="name" />
      {can('edit', 'contacts') && <EditButton />}
      {can('delete', 'contacts') && <DeleteButton />}
    </Datagrid>
  </List>
);
```

## Anti-Patterns (BANNED)

### ❌ Direct Supabase Calls in Hooks

WRONG:
```typescript
// Bypasses data provider abstraction and RLS policies
import { supabase } from '@/lib/supabase';

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    supabase.from('user_favorites').select('*').then(({ data }) => setFavorites(data));
  }, []);

  return favorites;
}
```

RIGHT:
```typescript
// Uses React Admin hook that respects provider layer
import { useGetList } from 'react-admin';

export function useFavorites() {
  const { data: favorites = [], isLoading } = useGetList('user_favorites', {
    pagination: { page: 1, perPage: 10 },
    sort: { field: 'created_at', order: 'DESC' },
  });

  return { favorites, isLoading };
}
```

### ❌ Hardcoded Query Keys

WRONG:
```typescript
// String can drift from actual key used in fetch
const { data } = useQuery({
  queryKey: ['organizations', 'list', { deleted_at: null }],
  queryFn: fetchOrganizations,
});

// Later, invalidation key doesn't match
queryClient.invalidateQueries({ queryKey: ['organizations'] }); // Doesn't match!
```

RIGHT:
```typescript
// Use centralized query key factory
import { organizationKeys } from '@/atomic-crm/queryKeys';

const { data } = useQuery({
  queryKey: organizationKeys.list({ deleted_at: null }),
  queryFn: fetchOrganizations,
});

// Invalidation uses same factory
queryClient.invalidateQueries({ queryKey: organizationKeys.lists() });
```

### ❌ Missing Cleanup in Event Listeners

WRONG:
```typescript
// Memory leak - listener never removed
export function useKeyboardShortcuts() {
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    // Missing cleanup!
  }, []);
}
```

RIGHT:
```typescript
// Proper cleanup prevents memory leaks
export function useKeyboardShortcuts() {
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

### ❌ Optimistic Updates Without Rollback

WRONG:
```typescript
// Optimistic update persists even if mutation fails
const toggleFavorite = async (id: number) => {
  setOptimisticState((prev) => new Map(prev).set(id, true));
  await create('user_favorites', { data: { entity_id: id } });
  // No error handling - optimistic state stays true even on failure!
};
```

RIGHT:
```typescript
// Rollback optimistic update on error
const toggleFavorite = async (id: number) => {
  const key = `entity:${id}`;
  setOptimisticState((prev) => new Map(prev).set(key, true));

  try {
    await create(
      'user_favorites',
      { data: { entity_id: id } },
      {
        onError: () => {
          // Rollback on error
          setOptimisticState((prev) => {
            const next = new Map(prev);
            next.delete(key);
            return next;
          });
        },
      }
    );
  } catch (error) {
    setOptimisticState((prev) => {
      const next = new Map(prev);
      next.delete(key);
      return next;
    });
  }
};
```

### ❌ SSR Hydration Mismatches

WRONG:
```typescript
// Initial state doesn't match server render
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false); // Always false on server!

  useEffect(() => {
    setIsMobile(window.innerWidth < 768); // Different on client
  }, []);

  return isMobile;
}
```

RIGHT:
```typescript
// Return undefined initially to prevent mismatch
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  return !!isMobile; // Consistent boolean for consumers
}
```

### ❌ Missing Dependency Array in Callbacks

WRONG:
```typescript
// useCallback without deps - doesn't prevent re-creation
const toggleFavorite = useCallback(async (id: number) => {
  await create('user_favorites', { data: { entity_id: id, user_id: userId } });
}, []); // Missing userId dependency!
```

RIGHT:
```typescript
// Include all external dependencies
const toggleFavorite = useCallback(
  async (id: number) => {
    await create('user_favorites', { data: { entity_id: id, user_id: userId } });
  },
  [userId, create] // All deps listed
);
```

## Developer Checklist

### Creating a New Data Hook

- [ ] Use React Admin hooks (`useGetList`, `useCreate`, `useUpdate`) instead of direct Supabase calls
- [ ] Define typed return interface (`UseFavoritesReturn`)
- [ ] Import query keys from `src/atomic-crm/queryKeys.ts` (never hardcode strings)
- [ ] Invalidate cache with `queryClient.invalidateQueries({ queryKey: resourceKeys.all })` after mutations
- [ ] Implement optimistic updates with rollback on error for instant UI feedback
- [ ] Handle loading states (`isLoading`) and auth state (`identity?.user_id`)
- [ ] Export hook and types from `src/hooks/index.ts` barrel file

### Creating a State Management Hook

- [ ] Use `useState` for local state, `useCallback` for stable function references
- [ ] Clean up event listeners in `useEffect` return function
- [ ] For URL sync: Parse URL params on mount, update history on state changes
- [ ] Use `window.history.pushState()` for navigation, `replaceState()` for state changes
- [ ] Handle browser back/forward with `popstate`/`hashchange` listeners
- [ ] Return minimal state (only what components need to consume)

### Creating a Responsive/Device Hook

- [ ] Use `window.matchMedia()` for native MediaQuery support (no CSS-in-JS overhead)
- [ ] SSR-safe initialization: `typeof window !== "undefined" ? getInitial() : fallback`
- [ ] Attach listeners to MediaQueryList (`mql.addEventListener('change', handler)`)
- [ ] Clean up listeners in `useEffect` return function
- [ ] Return `undefined` initially if SSR hydration mismatch is possible
- [ ] Define breakpoint constants at top of file (single source of truth)

### General Hook Standards

- [ ] Prefix hook names with `use` (React convention)
- [ ] One hook per file: `src/hooks/useFavorites.ts`
- [ ] Export types alongside hook: `export type UseFavoritesReturn`
- [ ] JSDoc comments explaining purpose, params, return value
- [ ] Include usage example in JSDoc for complex hooks
- [ ] Update `src/hooks/index.ts` barrel export
- [ ] Write unit tests in `src/hooks/__tests__/`
- [ ] Use `logger.error()` for unexpected errors (no `console.log`)
