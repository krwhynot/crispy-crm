# ADR-011: Feature Directory Structure

## Status

Accepted

## Date

2024-10

---

## Context

As Crispy CRM grew beyond the initial MVP, the codebase required a consistent organizational pattern. Several challenges emerged:

1. **Growing Complexity**: With 6+ features (contacts, organizations, opportunities, tasks, activities, samples), inconsistent organization led to navigation confusion and duplicated patterns.

2. **React Admin Resource Pattern**: React Admin requires a specific resource configuration object with `list`, `edit`, `create`, and `recordRepresentation` properties. This needed a standardized location.

3. **Performance Requirements**: Initial load times grew as all components were bundled together. Code splitting became necessary for acceptable performance.

4. **Error Isolation**: A crash in one feature (e.g., OpportunityList) should not bring down unrelated features (e.g., ContactList).

5. **Test Discoverability**: Tests scattered in a root-level `__tests__/` folder made it difficult to find tests for specific features.

### Alternatives Considered

| Alternative | Pros | Cons |
|-------------|------|------|
| **Type-based organization** (`components/`, `hooks/`, `utils/` at root) | Familiar, simple mental model | Components scattered, no code splitting boundary, poor discoverability |
| **Domain-driven folders** (one folder per entity) | Good discoverability | No standardized file naming, inconsistent patterns |
| **Feature folders with index barrel** | Clean imports | Barrel files prevent tree-shaking, no lazy loading |
| **Feature folders with resource.tsx** | Explicit config, lazy loading, error boundaries | More files, learning curve |

---

## Decision

Adopt a **feature-based directory structure** where each feature owns its complete implementation:

```
src/atomic-crm/[feature]/
├── index.tsx                 # Re-exports from resource.tsx (clean imports)
├── resource.tsx              # React Admin config + ErrorBoundary + lazy loading
├── [Feature]List.tsx         # List view component
├── [Feature]Create.tsx       # Create form component
├── [Feature]Edit.tsx         # Edit form component
├── [Feature]SlideOver.tsx    # 40vw right panel (see ADR-010)
├── slideOverTabs/            # Tab components for slide-over
│   ├── DetailsTab.tsx
│   ├── ActivitiesTab.tsx
│   └── NotesTab.tsx
├── __tests__/                # Co-located tests
│   ├── [Feature]List.test.tsx
│   └── [Feature]SlideOver.test.tsx
├── [feature]FilterConfig.ts  # Filter configuration for list views
└── formatters.ts             # Display formatters (dates, names, etc.)
```

### resource.tsx Pattern

Each feature's `resource.tsx` serves as the entry point for React Admin:

```tsx
// src/atomic-crm/contacts/resource.tsx
import * as React from "react";
import type { Contact } from "../types";
import { formatName } from "../utils/formatName";
import { ResourceErrorBoundary } from "@/components/ResourceErrorBoundary";

const ContactListLazy = React.lazy(() => import("./ContactList"));
const ContactEditLazy = React.lazy(() => import("./ContactEdit"));
const ContactCreateLazy = React.lazy(() => import("./ContactCreate"));

export const ContactListView = () => (
  <ResourceErrorBoundary resource="contacts" page="list">
    <ContactListLazy />
  </ResourceErrorBoundary>
);

export const ContactEditView = () => (
  <ResourceErrorBoundary resource="contacts" page="edit">
    <ContactEditLazy />
  </ResourceErrorBoundary>
);

export const ContactCreateView = () => (
  <ResourceErrorBoundary resource="contacts" page="create">
    <ContactCreateLazy />
  </ResourceErrorBoundary>
);

const contactRecordRepresentation = (record: Contact) =>
  formatName(record?.first_name, record?.last_name);

// React Admin resource config
export default {
  list: ContactListView,
  edit: ContactEditView,
  create: ContactCreateView,
  recordRepresentation: contactRecordRepresentation,
};
```

### Key Patterns

1. **React.lazy() for Code Splitting**: Each view component is wrapped in `React.lazy()`, creating separate webpack chunks that load on-demand.

2. **ResourceErrorBoundary Wrapping**: Every view is wrapped in an error boundary that catches React errors and displays a recovery UI without crashing other features.

3. **Default Export for Resource Config**: The default export matches React Admin's expected resource shape for easy registration in `App.tsx`.

4. **Named Exports for Direct Access**: Individual view components are also named exports for testing and direct usage.

---

## Consequences

### Positive

- **Code Splitting via React.lazy()**: Each feature loads separately, reducing initial bundle size by 40-60% in typical navigation flows
- **Error Isolation**: Error boundaries prevent one feature's crash from affecting others (aligns with ADR-014 Fail-Fast Philosophy)
- **Co-located Tests**: Tests live next to their components, improving discoverability and maintenance
- **Consistent Navigation**: Developers know exactly where to find any component for a feature
- **Type Safety**: Each `resource.tsx` can import its own types, keeping type definitions close to usage
- **Git History**: Changes to a feature are contained in one directory, making code review easier

### Negative

- **Learning Curve**: New developers must understand the resource.tsx pattern before contributing
- **More Files Per Feature**: A simple feature requires 5+ files minimum (index, resource, list, create, edit)
- **Duplicate Patterns**: Each feature repeats the lazy loading + error boundary pattern

### Neutral

- **Requires Suspense Boundary**: Parent components must provide a `<Suspense>` fallback for lazy-loaded components
- **No Barrel Exports**: Feature internals are not re-exported; consumers import specific files

---

## Anti-Patterns

### 1. Type-Based Organization (DO NOT USE)

```
src/
├── components/
│   ├── ContactList.tsx       # Scattered across multiple folders
│   └── ContactForm.tsx
├── hooks/
│   └── useContactData.ts
└── utils/
    └── contactFormatters.ts
```

**Why it fails**: No code splitting boundary, hard to find all contact-related code, no error isolation.

### 2. Missing Error Boundary Wrapping

```tsx
// WRONG: No error boundary
export const ContactListView = () => <ContactListLazy />;
```

**Why it fails**: A crash in ContactList will bubble up and crash the entire application.

### 3. Direct Component Imports Without Lazy Loading

```tsx
// WRONG: Synchronous import defeats code splitting
import ContactList from "./ContactList";

export const ContactListView = () => (
  <ResourceErrorBoundary resource="contacts" page="list">
    <ContactList />
  </ResourceErrorBoundary>
);
```

**Why it fails**: ContactList is bundled with the main chunk, increasing initial load time.

### 4. Tests in Separate Root-Level Folder

```
src/
├── atomic-crm/contacts/ContactList.tsx
└── tests/
    └── contacts/
        └── ContactList.test.tsx   # Far from component
```

**Why it fails**: Tests are disconnected from components, easy to forget updating, harder to find.

### 5. index.tsx Barrel Re-exporting Everything

```tsx
// WRONG: Barrel file prevents tree-shaking
// index.tsx
export * from "./ContactList";
export * from "./ContactEdit";
export * from "./ContactCreate";
export * from "./ContactSlideOver";
// etc.
```

**Why it fails**: Importing anything from the feature imports everything, defeating code splitting.

---

## Implementation Files

| Feature | Directory |
|---------|-----------|
| Contacts | `src/atomic-crm/contacts/` |
| Organizations | `src/atomic-crm/organizations/` |
| Opportunities | `src/atomic-crm/opportunities/` |
| Tasks | `src/atomic-crm/tasks/` |
| Activities | `src/atomic-crm/activities/` |
| Samples | `src/atomic-crm/samples/` |

---

## Related ADRs

- **[ADR-010: Slide-Over Panel Pattern](./ADR-010-slide-over-panels.md)**: Defines the `[Feature]SlideOver.tsx` component pattern referenced in this structure
- **[ADR-014: Fail-Fast Philosophy](../tier-1-foundations/ADR-014-fail-fast-philosophy.md)**: Explains why error boundaries are critical and how they support the fail-fast principle
- **[ADR-001: Unified Data Provider](../tier-1-foundations/ADR-001-unified-data-provider.md)**: All feature components use the unified data provider, never direct Supabase imports

---

## References

- React Admin Resource Configuration: https://marmelab.com/react-admin/Resource.html
- React.lazy() Code Splitting: https://react.dev/reference/react/lazy
- Error Boundaries: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
