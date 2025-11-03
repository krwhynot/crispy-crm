# ADR-0003: Use Zustand Over Redux for Client State Management

**Date:** 2025-11-02
**Status:** Accepted
**Deciders:** Product Design & Engineering Team

---

## Context

Crispy-CRM requires client-side state management for UI state that doesn't belong on the server:

**UI state requirements:**
- **Filter state:** Active filters on list views (priority, segment, status, date ranges)
- **Selection state:** Selected rows for bulk actions (checkbox selections across pages)
- **Modal/drawer state:** Open/closed state for modals, slide-overs, dialogs
- **Form state:** Multi-step wizard state (create opportunity wizard, Section 3.4.2)
- **View preferences:** Kanban vs list view toggle, column visibility, sort preferences
- **Navigation state:** Active tab, breadcrumb trail, sidebar collapse state
- **Notification state:** Toast notifications, alerts, success/error messages
- **Theme preferences:** User's color scheme preference (if implementing dark mode)

**Why client state (not server state):**
- Temporary UI state doesn't need persistence (filter selections reset on page reload)
- High-frequency updates (typing in search box, dragging Kanban cards)
- User-specific preferences not shared across devices (sidebar collapse state)
- Performance-critical (UI updates must be <50ms, can't wait for server round-trip)

**Technical context:**
- React 18+ with TypeScript (Section 5.1)
- React Query handles all server state (ADR-0002) - need complementary client state solution
- Team size: 2-3 frontend developers, minimal React state management experience
- PRD Section 5.1 specifies: "Zustand (preferred) or Redux Toolkit"

**Problem:**
React's built-in state (useState, useContext) insufficient for complex UI state:
- Prop drilling through many component layers (filter state from FilterPanel → List → ListItem)
- Context re-render performance issues (all consumers re-render when any context value changes)
- No devtools for debugging state changes
- Difficult to persist state (e.g., save filter preferences to localStorage)

## Decision

**Use Zustand for all client-side state management in Crispy-CRM.**

Zustand will manage UI state (filters, selections, modals, preferences) while React Query handles server state (data fetching, caching).

## Options Considered

### Option 1: Zustand
**Pros:**
- **Minimal boilerplate** - create store in ~10 lines, no providers/reducers/actions
- **No Provider wrapper** required - stores accessible anywhere via hooks
- **Excellent TypeScript support** - full type inference, no manual type definitions needed
- **Tiny bundle size** (~1KB gzipped vs Redux's ~15KB)
- **Simple API** - `create()` to define store, hooks auto-generated
- **DevTools integration** via `devtools()` middleware (Redux DevTools compatible)
- **Middleware ecosystem** - persist (localStorage), immer (immutable updates), subscribeWithSelector
- **Concurrent mode ready** (React 18 compatible)
- **No re-render issues** - component only re-renders when accessed state changes (selector-based)
- **Direct state mutations** allowed (no need for immutability helpers like Redux requires)
- **Fast learning curve** (~1 hour to learn vs Redux's ~1 day)

**Cons:**
- **Less mature ecosystem** than Redux (fewer third-party integrations, though sufficient for CRM)
- **No time-travel debugging** (Redux DevTools extension has better time-travel)
- **Smaller community** than Redux (but growing rapidly, 40K+ GitHub stars)
- **Less "opinionated"** - more freedom means less consistency across developers (solved with conventions)

### Option 2: Redux Toolkit (RTK)
**Pros:**
- **Industry standard** - most widely used React state management library
- **Excellent DevTools** - Redux DevTools with time-travel debugging
- **Large ecosystem** - many plugins, middleware, community patterns
- **Opinionated structure** - clear patterns for actions, reducers, selectors
- **Mature and battle-tested** - used by Facebook, Netflix, others
- **Built-in middleware** (thunk, logger)

**Cons:**
- **Significant boilerplate** even with Redux Toolkit (slices, actions, reducers)
- **Requires Provider** at root (extra nesting)
- **Steeper learning curve** (~1 day to understand actions/reducers/middleware)
- **Larger bundle** (~15KB gzipped)
- **Immutability required** - need immer or manual immutable updates (Zustand allows direct mutations)
- **More verbose** - 50+ lines to create what Zustand does in 10
- **Overkill for UI state** - Redux best for complex state transitions; CRM UI state is simpler
- **Team unfamiliar** - learning curve delays Phase 1 timeline

### Option 3: Jotai (Atomic State)
**Pros:**
- **Atomic approach** - state split into atoms, minimal re-renders
- **Tiny bundle** (~3KB gzipped)
- **TypeScript-first** design
- **No Provider required** (like Zustand)
- **React Suspense integration** for async state

**Cons:**
- **Different mental model** - atoms + selectors requires learning new paradigm
- **Less mature** than Zustand or Redux (fewer real-world examples)
- **Fragmented state** - many atoms harder to reason about than centralized store
- **Less clear patterns** for complex state (filter state with 10+ fields better in single store)
- **Team unfamiliar** with atomic state management

### Option 4: Context + useReducer (Built-in React)
**Pros:**
- **No dependency** - built into React
- **No bundle size** impact
- **Simple for small state** trees

**Cons:**
- **Performance issues** - all consumers re-render on any state change (can't optimize)
- **Provider hell** - need multiple contexts (FilterContext, SelectionContext, ModalContext)
- **No DevTools** - debugging requires manual logging
- **Boilerplate** - reducer functions, context providers, custom hooks for each context
- **No persistence middleware** - manual localStorage integration
- **Not scalable** for CRM's UI state complexity

## Consequences

### Positive Consequences

**Developer Experience:**
- **90% less boilerplate** than Redux - create filter store in 10 lines vs 50+ with Redux
- **Fast onboarding** - new developers productive in ~1 hour (vs 1 day for Redux)
- **TypeScript inference** - full type safety without manual type definitions
- **Debugging ease** - Redux DevTools integration shows state changes, time-travel

**Performance:**
- **Minimal re-renders** - only components using changed state re-render (selector-based)
- **Tiny bundle** - 1KB vs Redux's 15KB (14KB savings)
- **Fast updates** - direct state mutations (no immutability overhead)

**Specific CRM Use Cases:**
- **Filter state** - Single `useFilterStore()` replaces prop drilling through 5+ components
- **Bulk selection** - `useSelectionStore()` tracks selected IDs across paginated lists
- **Modal management** - `useModalStore()` centralized open/closed state for all modals
- **Kanban drag state** - `useDragStore()` tracks dragged opportunity, source/target stages

**Code Example (Filter Store):**
```typescript
// stores/filterStore.ts - Zustand (10 lines)
import { create } from 'zustand';

interface FilterState {
  priority: string[];
  segment: string[];
  status: string[];
  setPriority: (priority: string[]) => void;
  setSegment: (segment: string[]) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  priority: [],
  segment: [],
  status: [],
  setPriority: (priority) => set({ priority }),
  setSegment: (segment) => set({ segment }),
  clearFilters: () => set({ priority: [], segment: [], status: [] }),
}));

// Usage in component
function FilterPanel() {
  const { priority, setPriority } = useFilterStore();
  return <MultiSelect value={priority} onChange={setPriority} />;
}
```

**vs Redux Toolkit (50+ lines):**
```typescript
// Redux requires: slice definition, actions, reducers, provider setup, hooks
// Zustand: Just the store above, no provider needed
```

### Negative Consequences

**Less Structure:**
- **No enforced patterns** - developers have freedom to structure stores differently
- **Mitigation:** Establish naming conventions (`use[Feature]Store`), co-locate stores in `/stores` directory

**Smaller Ecosystem:**
- **Fewer third-party integrations** than Redux (e.g., Redux Form, Redux Saga)
- **Mitigation:** React Hook Form + React Query cover form/async needs, don't need Redux-specific libraries

**Less Time-Travel Debugging:**
- **Redux DevTools time-travel** more limited than native Redux
- **Mitigation:** Time-travel not critical for CRM (not debugging complex state machines)

### Neutral Consequences

- **Middleware available** (persist, devtools, immer) but not required for MVP
- **Can integrate with React Query** seamlessly (they're complementary, not competing)
- **Can add Redux later** if needed (Zustand doesn't prevent adding Redux for specific features)

## Implementation Notes

**Installation:**
```bash
npm install zustand
npm install zustand-devtools --save-dev  # Optional: Redux DevTools integration
```

**Store Conventions (Team Standards):**
1. **Naming:** All stores named `use[Feature]Store` (e.g., `useFilterStore`, `useModalStore`)
2. **Location:** All stores in `/src/stores/` directory
3. **TypeScript:** All stores fully typed (interface for state + actions)
4. **Actions:** Actions named as verbs (`setFilter`, `clearFilters`, `toggleModal`)
5. **Selectors:** Use selector pattern to prevent unnecessary re-renders

**Example Stores for CRM:**

```typescript
// stores/filterStore.ts - Filter state for list views
export const useFilterStore = create<FilterState>((set) => ({
  organizationFilters: { priority: [], segment: [] },
  opportunityFilters: { status: [], stage: [] },
  setOrganizationFilters: (filters) => set({ organizationFilters: filters }),
  clearOrganizationFilters: () => set({ organizationFilters: {} }),
}));

// stores/selectionStore.ts - Bulk selection state
export const useSelectionStore = create<SelectionState>((set) => ({
  selectedIds: [],
  selectAll: false,
  toggleSelection: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id)
      ? state.selectedIds.filter((i) => i !== id)
      : [...state.selectedIds, id],
  })),
  clearSelection: () => set({ selectedIds: [], selectAll: false }),
}));

// stores/modalStore.ts - Modal open/close state
export const useModalStore = create<ModalState>((set) => ({
  openModals: {},
  openModal: (modalId) => set((state) => ({ openModals: { ...state.openModals, [modalId]: true } })),
  closeModal: (modalId) => set((state) => ({ openModals: { ...state.openModals, [modalId]: false } })),
}));
```

**DevTools Integration:**
```typescript
import { devtools } from 'zustand/middleware';

export const useFilterStore = create<FilterState>()(
  devtools(
    (set) => ({
      // ... state and actions
    }),
    { name: 'FilterStore' }
  )
);
```

**Persist to localStorage:**
```typescript
import { persist } from 'zustand/middleware';

export const usePreferenceStore = create<PreferenceState>()(
  persist(
    (set) => ({
      theme: 'light',
      sidebarCollapsed: false,
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'user-preferences' }
  )
);
```

**Selector Pattern (Optimize Re-renders):**
```typescript
// ❌ Bad: Component re-renders on ANY state change
const { priority, segment, status } = useFilterStore();

// ✅ Good: Component re-renders only when priority changes
const priority = useFilterStore((state) => state.priority);
```

## References

- **PRD Section 5.1:** State Management - "Zustand (preferred) or Redux Toolkit"
- **Zustand Documentation:** https://docs.pmnd.rs/zustand
- **React Query + Zustand Pattern:** https://tkdodo.eu/blog/react-query-and-state-management
- **Zustand Best Practices:** https://docs.pmnd.rs/zustand/guides/typescript
- **Related ADR:** ADR-0002 (React Query for Server State - complementary)
- **Redux DevTools:** https://github.com/reduxjs/redux-devtools

---

## Supersedes

None (initial decision)

## Superseded By

None (current)
