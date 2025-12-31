# ADR-010: Slide-Over Panel Pattern for Detail Views

## Status

Accepted

## Context

Crispy CRM requires a consistent pattern for displaying record details across all resources (contacts, organizations, opportunities, tasks). The design must support:

1. **Context Preservation** - Users need to see the list while viewing details to maintain orientation
2. **Quick Navigation** - Clicking between records should feel instant without full page loads
3. **Shareability** - Detail views must have URLs for sharing and bookmarking
4. **Browser History** - Back/forward navigation should work naturally
5. **Edit Mode** - Seamless transition between viewing and editing records
6. **iPad Support** - Touch-friendly with appropriate sizing

Alternative approaches considered:

- **Full-page Navigation**: Disrupts context, requires loading entire page, loses list position
- **Modal Dialogs**: Block underlying content, poor for data-heavy views, no URL state
- **Inline Expansion**: Pushes list content, creates layout shift, limited space

The slide-over pattern solves all requirements while being a familiar mobile/tablet UI metaphor.

## Decision

Implement a right-anchored slide-over panel system with URL state synchronization:

### Core Components

1. **`useSlideOverState` Hook** (`src/hooks/useSlideOverState.ts`)
   - Manages visibility, record ID, and view/edit mode
   - Syncs state to URL query params (`?view=123` or `?edit=123`)
   - Supports hash-based routing (`#/contacts?view=123`)
   - Handles browser back/forward via `popstate`/`hashchange` listeners
   - Closes on ESC key press

2. **`ResourceSlideOver` Component** (`src/components/layouts/ResourceSlideOver.tsx`)
   - Generic wrapper providing consistent UI shell
   - Tabbed interface with count badges
   - Header with title, breadcrumb, and mode toggle
   - Footer with save/cancel actions in edit mode
   - Unsaved changes confirmation dialog
   - Data fetching via React Admin's `useGetOne`

3. **Feature SlideOvers** (e.g., `ContactSlideOver`, `OrganizationSlideOver`)
   - Configure tabs via `TabConfig` interface
   - Define record representation for title
   - Add optional breadcrumbs and header actions
   - Provide resource-specific loading skeletons

### URL State Pattern

```
View mode:  #/contacts?view=123
Edit mode:  #/contacts?edit=123
With filters: #/contacts?filter={"status":"active"}&view=123
```

- Query params are additive (filters preserved when opening slide-over)
- `pushState` used for open (creates history entry)
- `replaceState` used for mode toggle (no extra history entries)

### Width Specifications

Defined as CSS custom properties in `src/index.css`:

```css
--sidepane-width: 440px;      /* Default width */
--sidepane-width-min: 400px;  /* Minimum width */
--sidepane-width-max: 560px;  /* Maximum width */
```

Responsive behavior in `src/components/ui/sheet.tsx`:

```css
/* Mobile: full width */
w-full

/* Desktop (lg+): constrained width */
lg:w-[var(--sidepane-width)]
lg:min-w-[var(--sidepane-width-min)]
lg:max-w-[var(--sidepane-width-max)]
```

### Animation Timing

- **Open**: 250ms with `cubic-bezier(0.32, 0.72, 0, 1)` - smooth acceleration
- **Close**: 200ms with `ease-out` - quick dismissal
- **Reduced Motion**: Falls back to 100ms opacity transition

## Consequences

### Positive

- **Context Preserved**: List remains visible, maintaining user orientation
- **Deep Linking**: URLs are shareable and bookmarkable
- **Browser History**: Back/forward navigation works naturally without custom logic
- **Consistent UX**: Same pattern across all resources reduces learning curve
- **Performance**: Only active tab mounts its component (lazy rendering)
- **Accessibility**: Focus trap, ARIA attributes, ESC key support built-in
- **iPad-Friendly**: Full-width on mobile, constrained on desktop

### Negative

- **Horizontal Space**: Consumes 400-560px on desktop, may feel cramped on smaller monitors
- **State Complexity**: URL synchronization adds complexity vs. simple local state
- **Hash Routing**: Depends on React Admin's hash-based routing; path-based routing would need changes
- **Edit Coordination**: Tab components must handle their own form state and save logic

### Neutral

- **Component Responsibility**: `ResourceSlideOver` handles UI shell; tabs handle content/forms
- **Animation Overhead**: CSS transitions are GPU-accelerated, minimal performance impact

## Code Examples

### useSlideOverState Hook Usage

```tsx
// In a list component (e.g., ContactList.tsx)
import { useSlideOverState } from "@/hooks/useSlideOverState";
import { ContactSlideOver } from "./ContactSlideOver";

export function ContactList() {
  const { slideOverId, isOpen, mode, openSlideOver, closeSlideOver, toggleMode } =
    useSlideOverState();

  return (
    <>
      <Datagrid
        rowClick={(id) => {
          openSlideOver(Number(id), "view");
          return false; // Prevent default navigation
        }}
      >
        {/* columns */}
      </Datagrid>

      <ContactSlideOver
        recordId={slideOverId}
        isOpen={isOpen}
        mode={mode}
        onClose={closeSlideOver}
        onModeToggle={toggleMode}
      />
    </>
  );
}
```

### ResourceSlideOver with TabConfig

```tsx
// In a feature SlideOver (e.g., ContactSlideOver.tsx)
import { ResourceSlideOver, type TabConfig } from "@/components/layouts/ResourceSlideOver";

const contactTabs: TabConfig[] = [
  {
    key: "details",
    label: "Details",
    component: ContactDetailsTab,
    icon: UserIcon,
  },
  {
    key: "activities",
    label: "Activities",
    component: ({ record }) => <ActivitiesTab contactId={record.id} />,
    icon: ActivityIcon,
    countFromRecord: (record) => record.nb_activities,
  },
  {
    key: "notes",
    label: "Notes",
    component: ContactNotesTab,
    icon: FileTextIcon,
    countFromRecord: (record) => record.nb_notes,
  },
];

export function ContactSlideOver({ recordId, isOpen, mode, onClose, onModeToggle }) {
  return (
    <ResourceSlideOver
      resource="contacts"
      recordId={recordId}
      isOpen={isOpen}
      onClose={onClose}
      mode={mode}
      onModeToggle={onModeToggle}
      tabs={contactTabs}
      recordRepresentation={(record) => `${record.first_name} ${record.last_name}`}
      breadcrumbComponent={ContactHierarchyBreadcrumb}
      loadingSkeleton={ContactDetailSkeleton}
      headerActions={(record) => <QuickAddTaskButton contactId={record.id} />}
    />
  );
}
```

### TabConfig Interface

```tsx
interface TabConfig {
  key: string;                                      // Unique tab identifier
  label: string;                                    // Display label
  component: React.ComponentType<TabComponentProps>;// Tab content component
  icon?: React.ComponentType<{ className?: string }>;// Optional icon
  countFromRecord?: (record: RaRecord) => number | undefined | null; // Badge count
}

interface TabComponentProps {
  record: RaRecord;                    // The fetched record
  mode: "view" | "edit";               // Current mode
  onModeToggle?: () => void;           // Toggle view/edit
  isActiveTab: boolean;                // Whether this tab is visible
  onDirtyChange?: (isDirty: boolean) => void; // Track unsaved changes
}
```

### Anti-Patterns (Do NOT Use)

```tsx
// WRONG: Local state for visibility (no URL, no history)
const [isOpen, setIsOpen] = useState(false);
const [selectedId, setSelectedId] = useState<number | null>(null);

// WRONG: Modal for detail views (blocks context)
<Dialog open={isOpen}>
  <ContactDetails id={selectedId} />
</Dialog>

// WRONG: Form validation in slide-over (violates single source of truth)
<ResourceSlideOver>
  <Form validate={customValidation}> {/* NO - use Zod at API boundary */}
</ResourceSlideOver>

// WRONG: Direct Supabase calls in tabs
const { data } = await supabase.from("contacts").select(); // NO - use data provider
```

## Implementation Files

| File | Purpose |
|------|---------|
| `src/hooks/useSlideOverState.ts` | URL-synced state management hook |
| `src/components/layouts/ResourceSlideOver.tsx` | Generic slide-over wrapper with tabs |
| `src/components/ui/sheet.tsx` | shadcn/ui Sheet (Radix Dialog primitive) |
| `src/index.css` | CSS custom properties for width |
| `src/atomic-crm/contacts/ContactSlideOver.tsx` | Contact feature implementation |
| `src/atomic-crm/organizations/OrganizationSlideOver.tsx` | Organization feature implementation |
| `src/atomic-crm/opportunities/OpportunitySlideOver.tsx` | Opportunity feature implementation |
| `src/atomic-crm/tasks/TaskSlideOver.tsx` | Task feature implementation |

## Related ADRs

- **ADR-006**: Tailwind v4 Semantic Color System (slide-over uses semantic tokens)
- **ADR-013**: WCAG 2.1 AA Accessibility Standards (focus trap, ARIA, keyboard navigation)
