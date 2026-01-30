# Shared Component Patterns

Standard patterns for shared business components in Crispy CRM's atomic-crm module.

## Component Architecture

```
Feature Modules (contacts, opportunities, organizations)
         │
         ├──> List Components
         ├──> Create/Edit Forms
         └──> Show Components
              │
              └──> Shared Components (atomic-crm/components)
                   │
                   ├── Status Badges (SampleStatusBadge)
                   ├── Action Buttons (QuickAddTaskButton, FavoriteToggleButton)
                   ├── Form Footers (CreateFormFooter)
                   └── Tracking (TrackRecordView)
                        │
                        └──> React Admin Wrappers (Tier 2)
                             │
                             └──> shadcn/ui Components (Tier 1)
```

---

## File Structure

```
src/atomic-crm/components/
├── index.ts                      # Barrel export for all shared components
├── SampleStatusBadge.tsx         # Sample workflow status with interactive progression
├── SampleStatusBadge.stories.tsx # Storybook documentation
├── QuickAddTaskButton.tsx        # Context-aware task creation button
├── FavoriteToggleButton.tsx      # Star/unstar entity toggle
├── CreateFormFooter.tsx          # Standardized form footer with Save & Close/Add Another
└── TrackRecordView.tsx           # Invisible component for recent items tracking
```

**Import Pattern:** Always import from the barrel export:

```tsx
// ✅ Recommended: Import from barrel
import {
  SampleStatusBadge,
  QuickAddTaskButton,
  FavoriteToggleButton,
  CreateFormFooter,
} from "@/atomic-crm/components";

// ❌ Avoid: Direct file imports
import { SampleStatusBadge } from "@/atomic-crm/components/SampleStatusBadge";
```

---

## Pattern A: Status Badge with Workflow Stepper

For entities with multi-stage workflows requiring visual status display and inline progression controls.

```tsx
// src/atomic-crm/components/SampleStatusBadge.tsx

// Read-only badge in list view
<SampleStatusBadge status="received" />

// Interactive badge with workflow stepper in detail view
<SampleStatusBadge
  status="received"
  activityId={activity.id}
  interactive
  showStepper
  onStatusChange={(newStatus) => {
    console.log('Status updated to:', newStatus);
  }}
/>

// Compact mode for tight spaces
<SampleStatusBadge status="feedback_pending" compact />
```

**When to use**: Entities with linear workflow progressions (sample tracking, opportunity stages, task states).

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Single source of truth for workflow | `SAMPLE_STATUS_WORKFLOW` array defines valid states and order |
| Semantic color mapping | Uses design system colors (`success`, `warning`, `primary`) instead of hardcoded |
| PATCH updates via React Admin | Uses `useUpdate` hook instead of direct Supabase calls |
| Popover for progression | Non-modal UI keeps user in context |
| Workflow validation | `isValidTransition()` prevents invalid state jumps |

### Workflow Configuration

```tsx
// SampleStatusBadge.tsx:49-54
export const SAMPLE_STATUS_WORKFLOW: readonly SampleStatus[] = [
  "sent",
  "received",
  "feedback_pending",
  "feedback_received",
] as const;

// SampleStatusBadge.tsx:72-105
export const SAMPLE_STATUS_CONFIG: Record<SampleStatus, StatusConfig> = {
  sent: {
    label: "Sent",
    shortLabel: "Sent",
    icon: Package,
    variant: "secondary",
    className: "bg-muted text-muted-foreground border-muted-foreground/20",
    description: "Sample has been dispatched to customer",
  },
  received: {
    label: "Received",
    shortLabel: "Recv",
    icon: PackageCheck,
    variant: "default",
    className: "bg-success text-success-foreground border-success/20",
    description: "Customer confirmed receipt of sample",
  },
  // ... other states
};
```

### Helper Functions

```tsx
// Get next status in workflow
const nextStatus = getNextStatus("received");
// Returns: "feedback_pending"

// Get previous status
const prevStatus = getPreviousStatus("feedback_pending");
// Returns: "received"

// Validate transition
const isValid = isValidTransition("sent", "feedback_received");
// Returns: false (skips intermediate states)
```

### Integration with React Admin

```tsx
// SampleStatusBadge.tsx:209-248
const handleAdvanceStatus = useCallback(async () => {
  if (!activityId || !nextStatus) return;

  try {
    await update(
      "activities",
      {
        id: activityId,
        data: { sample_status: nextStatus },
        previousData: { sample_status: status },
      },
      {
        onSuccess: () => {
          // Invalidate activity cache to refresh timeline
          queryClient.invalidateQueries({
            queryKey: activityKeys.detail(activityId),
          });
          notify(`Sample status updated to ${SAMPLE_STATUS_CONFIG[nextStatus].label}`, {
            type: "success",
          });
          onStatusChange?.(nextStatus);
          setIsPopoverOpen(false);
        },
        onError: (error) => {
          notify(
            `Failed to update sample status: ${error instanceof Error ? error.message : "Unknown error"}`,
            { type: "error" }
          );
        },
      }
    );
  } catch (error: unknown) {
    logger.error("Sample status update exception", error, {
      feature: "SampleStatusBadge",
      activityId,
      targetStatus: nextStatus,
    });
  }
}, [activityId, nextStatus, status, update, notify, onStatusChange, queryClient]);
```

### Compact Stepper Component

```tsx
// SampleStatusBadge.tsx:484-523
// For list views where space is constrained
<SampleStatusStepper status="feedback_pending" />

// Renders horizontal dots with connector lines:
// ● ─── ● ─── ○ ─── ○
// Completed   Current   Remaining
```

---

## Pattern B: Quick Action Buttons

For common actions that need context-aware navigation with pre-filled parameters.

```tsx
// src/atomic-crm/components/QuickAddTaskButton.tsx

// Chip variant (default) - rounded pill style
<QuickAddTaskButton
  contactId={contact.id}
  opportunityId={opportunity.id}
  variant="chip"
/>

// Button variant - outlined button
<QuickAddTaskButton
  organizationId={org.id}
  variant="button"
/>

// Multiple context IDs - all get passed as URL params
<QuickAddTaskButton
  contactId={contact.id}
  opportunityId={opportunity.id}
  organizationId={org.id}
/>
```

**When to use**: Quick navigation to creation forms with context pre-populated.

### Implementation Details

```tsx
// QuickAddTaskButton.tsx:20-27
const handleClick = () => {
  const params = new URLSearchParams();
  if (contactId) params.set("contact_id", String(contactId));
  if (opportunityId) params.set("opportunity_id", String(opportunityId));
  if (organizationId) params.set("organization_id", String(organizationId));

  navigate(`/tasks/create?${params.toString()}`);
};
```

### Styling Variants

```tsx
// QuickAddTaskButton.tsx:29-51
if (variant === "chip") {
  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 px-3 h-11 rounded-full
                 bg-primary/10 text-primary text-sm font-medium
                 hover:bg-primary/20 transition-colors whitespace-nowrap"
      aria-label="Add task"
    >
      <Plus className="h-4 w-4" />
      Add Task
    </button>
  );
}

return (
  <AdminButton type="button" onClick={handleClick} variant="outline" size="sm" className="h-11">
    <Plus className="h-4 w-4 mr-2" />
    Add Task
  </AdminButton>
);
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| URL params for context | Cleaner than passing state through navigation |
| Two visual variants | Chip for cards, button for toolbars |
| All IDs optional | Flexible usage across different contexts |
| Minimum 44px touch target | Accessibility compliance |

---

## Pattern C: Favorite Toggle Button

For user-specific favoriting functionality with quota limits and optimistic updates.

```tsx
// src/atomic-crm/components/FavoriteToggleButton.tsx

<FavoriteToggleButton
  entityType="organizations"
  entityId={org.id}
  displayName={org.name}
/>

<FavoriteToggleButton
  entityType="contacts"
  entityId={contact.id}
  displayName={`${contact.first_name} ${contact.last_name}`}
/>
```

**When to use**: Any resource that users can favorite for quick access.

### Integration with useFavorites Hook

```tsx
// FavoriteToggleButton.tsx:19-36
const { isFavorite, toggleFavorite, canAddMore, isLoading } = useFavorites();

const favorited = isFavorite(entityType, entityId);
const disabled = isLoading || (!canAddMore && !favorited);

const getTooltipMessage = (): string => {
  if (favorited) {
    return "Remove from favorites";
  }
  if (!canAddMore) {
    return "Favorites limit reached (10 max)";
  }
  return "Add to favorites";
};

const handleClick = () => {
  toggleFavorite(entityType, entityId, displayName);
};
```

### Accessibility Features

```tsx
// FavoriteToggleButton.tsx:39-62
<Tooltip>
  <TooltipTrigger asChild>
    <AdminButton
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={disabled}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
      aria-pressed={favorited}
      className="h-11 w-11"
    >
      <Star
        className={cn(
          "size-5 transition-colors",
          favorited ? "fill-primary text-primary" : "text-muted-foreground hover:text-primary"
        )}
      />
    </AdminButton>
  </TooltipTrigger>
  <TooltipContent>
    <p>{getTooltipMessage()}</p>
  </TooltipContent>
</Tooltip>
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `aria-pressed` for toggle state | Screen readers announce "pressed" or "not pressed" |
| Filled star when favorited | Universal visual affordance |
| Tooltip for limit messaging | Non-intrusive quota enforcement |
| 10-item limit | Balances quick access with UI clutter |
| `size-5` icon (20px) | Meets 44px touch target with button padding |

---

## Pattern D: Form Footer with Multiple Save Actions

For create forms requiring "Save & Close" and "Save & Add Another" workflows.

```tsx
// src/atomic-crm/components/CreateFormFooter.tsx

<CreateFormFooter
  resourceName="contact"
  redirectPath="/contacts"
/>

// With custom redirect logic
<CreateFormFooter
  resourceName="opportunity"
  redirectPath="/opportunities"
  redirect={(resource, id, data) => `/opportunities/${id}/show`}
/>

// Preserve fields for rapid entry (e.g., organization_id)
<CreateFormFooter
  resourceName="contact"
  redirectPath="/contacts"
  preserveFields={['organization_id', 'tags']}
/>

// With tutorial tracking
<CreateFormFooter
  resourceName="contact"
  redirectPath="/contacts"
  tutorialAttribute="save-contact-button"
/>
```

**When to use**: All create forms that benefit from rapid successive entry.

### Implementation Details

```tsx
// CreateFormFooter.tsx:32-38
const handleCancel = useCallback(() => {
  if (isDirty) {
    setShowDialog(true); // Unsaved changes warning
    return;
  }
  redirectFn(redirectPath);
}, [isDirty, redirectFn, redirectPath]);
```

### Save & Add Another Logic

```tsx
// CreateFormFooter.tsx:74-96
<SaveButton
  type="button"
  label="Save & Add Another"
  alwaysEnable
  mutationOptions={{
    onSuccess: () => {
      notify(notificationMessages.created(ucFirst(resourceName)), { type: "success" });

      // Preserve specified fields for rapid entry
      if (preserveFields.length > 0) {
        const currentValues = getValues();
        const valuesToPreserve = preserveFields.reduce<Record<string, unknown>>(
          (acc, field) => {
            if (currentValues[field] !== undefined) {
              acc[field] = currentValues[field];
            }
            return acc;
          },
          {}
        );
        reset(valuesToPreserve);
      } else {
        reset(); // Clear form completely
      }
    },
    onError: handleError,
  }}
/>
```

### Unsaved Changes Protection

```tsx
// CreateFormFooter.tsx:98-106
<UnsavedChangesDialog
  open={showDialog}
  onConfirm={() => {
    setShowDialog(false);
    redirectFn(redirectPath);
  }}
  onCancel={() => setShowDialog(false)}
/>
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `preserveFields` parameter | Trade show rapid entry: same org, different contacts |
| `isDirty` check before cancel | Prevents accidental data loss |
| Sticky footer with border | Visual separation, always accessible |
| `alwaysEnable` on SaveButton | React Admin default disables on pristine - we override |
| Custom redirect callback | Allows navigating to detail view after save |

---

## Pattern E: Invisible Tracking Components

For side-effect components that track user behavior without rendering UI.

```tsx
// src/atomic-crm/components/TrackRecordView.tsx

// Drop into any Show or Edit component
<Show>
  <TrackRecordView />
  <SimpleShowLayout>
    {/* fields */}
  </SimpleShowLayout>
</Show>

<Edit>
  <TrackRecordView />
  <TabbedForm>
    {/* fields */}
  </TabbedForm>
</Edit>
```

**When to use**: Track record views for "Recently Viewed" navigation features.

### Implementation Details

```tsx
// TrackRecordView.tsx:18-46
export const TrackRecordView = () => {
  const record = useRecordContext<RaRecord>();
  const resource = useResourceContext();
  const getRecordRepresentation = useGetRecordRepresentation(resource);
  const { addRecentItem } = useRecentItems();

  // Ref to track if we've already recorded this view
  // Prevents React 18 strict mode double-fire
  const hasTracked = useRef<string | null>(null);

  useEffect(() => {
    if (!record?.id || !resource) return;

    // Build unique key to prevent duplicate tracking
    const trackingKey = `${resource}-${record.id}`;
    if (hasTracked.current === trackingKey) return;

    const title = getRecordRepresentation(record) || `${resource} #${record.id}`;

    addRecentItem({
      id: record.id,
      resource,
      title,
    });

    hasTracked.current = trackingKey;
  }, [record, resource, getRecordRepresentation, addRecentItem]);

  return null; // Invisible
};
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| `useRef` for deduplication | Prevents double-tracking in React 18 strict mode |
| `useRecordContext` integration | Automatic context detection, no manual props |
| Returns `null` | No DOM output, pure side-effect component |
| Unique key `resource-id` | Same ID can exist across different resources |

---

## Pattern F: Cohesive Module Exports

For components with related utilities, constants, and helper functions.

```tsx
// SampleStatusBadge.tsx exports pattern

// Component exports
export { SampleStatusBadge };           // Main component
export { SampleStatusStepper };         // Utility component

// Type exports
export type { SampleStatus };

// Configuration exports
export { SAMPLE_STATUS_WORKFLOW };      // Workflow definition
export { SAMPLE_STATUS_CONFIG };        // Display config

// Helper function exports
export { getNextStatus };
export { getPreviousStatus };
export { isValidTransition };
```

**When to use**: Components with domain-specific logic that consumers may need.

### ESLint Override for Cohesive Modules

```tsx
// SampleStatusBadge.tsx:18-20
/* eslint-disable react-refresh/only-export-components */
// This file intentionally exports both a component and related utilities
// (workflow constants, status config, helper functions) as a cohesive module.
// Separating them would reduce cohesion.
```

### Barrel Export Pattern

```tsx
// index.ts:3-13
export {
  SampleStatusBadge,
  SampleStatusStepper,
  SAMPLE_STATUS_WORKFLOW,
  SAMPLE_STATUS_CONFIG,
  getNextStatus,
  getPreviousStatus,
  isValidTransition,
  type SampleStatus,
} from "./SampleStatusBadge";
```

---

## Component Comparison Table

| Component | Purpose | State Management | React Admin | Storage | Use Case |
|-----------|---------|------------------|-------------|---------|----------|
| `SampleStatusBadge` | Workflow visualization + progression | `useUpdate` | Yes | None | Sample tracking, opportunity stages |
| `QuickAddTaskButton` | Context-aware navigation | None | None | None | Quick task creation from any context |
| `FavoriteToggleButton` | User-specific bookmarking | `useFavorites` hook | None | localStorage | Quick access to frequent records |
| `CreateFormFooter` | Standardized form actions | React Hook Form | Yes | None | All create forms with rapid entry |
| `TrackRecordView` | Invisible view tracking | `useRecentItems` hook | Yes | localStorage | Recently viewed navigation |

---

## Anti-Patterns

### ❌ Hardcoded Status Values

```tsx
// ❌ BAD: String literals, no type safety
<Badge variant={status === "sent" ? "secondary" : "default"}>
  {status}
</Badge>

// ✅ GOOD: Configuration-driven
<Badge variant={SAMPLE_STATUS_CONFIG[status].variant}>
  {SAMPLE_STATUS_CONFIG[status].label}
</Badge>
```

### ❌ Direct Supabase Calls in Components

```tsx
// ❌ BAD: Violates provider architecture
import { supabase } from "@/lib/supabase";

const handleUpdate = async () => {
  await supabase.from('activities').update({ sample_status: 'received' });
};

// ✅ GOOD: React Admin data provider
const [update] = useUpdate();

const handleUpdate = async () => {
  await update('activities', {
    id: activityId,
    data: { sample_status: 'received' },
  });
};
```

### ❌ Missing Accessibility Attributes

```tsx
// ❌ BAD: No ARIA for toggle state
<button onClick={toggleFavorite}>
  <Star className={favorited ? "fill-yellow-500" : ""} />
</button>

// ✅ GOOD: Proper ARIA + semantic colors
<AdminButton
  onClick={toggleFavorite}
  aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
  aria-pressed={favorited}
  className="h-11 w-11"
>
  <Star
    className={cn(
      favorited ? "fill-primary text-primary" : "text-muted-foreground"
    )}
  />
</AdminButton>
```

### ❌ Props Drilling for Navigation Context

```tsx
// ❌ BAD: Passing IDs through multiple components
<ParentCard>
  <ChildSection contactId={contactId} orgId={orgId}>
    <QuickAddButton contactId={contactId} orgId={orgId} />
  </ChildSection>
</ParentCard>

// ✅ GOOD: Context-aware components read directly
<ParentCard>
  <ChildSection>
    <QuickAddTaskButton /> {/* Reads from React Admin context */}
  </ChildSection>
</ParentCard>
```

### ❌ Missing React 18 Strict Mode Protection

```tsx
// ❌ BAD: Tracks view twice in dev mode
useEffect(() => {
  addRecentItem({ id: record.id, resource });
}, [record, resource]);

// ✅ GOOD: Ref prevents duplicate tracking
const hasTracked = useRef<string | null>(null);

useEffect(() => {
  const trackingKey = `${resource}-${record.id}`;
  if (hasTracked.current === trackingKey) return;

  addRecentItem({ id: record.id, resource });
  hasTracked.current = trackingKey;
}, [record, resource]);
```

### ❌ Not Using Semantic Colors

```tsx
// ❌ BAD: Hardcoded Tailwind classes, no dark mode support
<Badge className="bg-green-500 text-white">Received</Badge>
<Badge className="bg-yellow-500 text-black">Pending</Badge>

// ✅ GOOD: Design system semantic colors
<Badge className="bg-success text-success-foreground">Received</Badge>
<Badge className="bg-warning text-warning-foreground">Pending</Badge>
```

### ❌ Forgetting Touch Target Minimums

```tsx
// ❌ BAD: 32px button too small for touch
<button className="h-8 w-8">
  <Star className="h-4 w-4" />
</button>

// ✅ GOOD: 44px minimum (h-11 = 44px)
<AdminButton size="icon" className="h-11 w-11">
  <Star className="h-5 w-5" />
</AdminButton>
```

---

## Migration Checklist

When creating a new shared component in `src/atomic-crm/components/`:

1. [ ] Create component file with PascalCase name
2. [ ] Add TypeScript types for all props
3. [ ] Use React Admin hooks (`useUpdate`, `useRecordContext`) instead of direct Supabase
4. [ ] Use semantic Tailwind classes (`bg-primary`, `text-destructive`) instead of hardcoded colors
5. [ ] Ensure touch targets are at least `h-11` (44px)
6. [ ] Add ARIA attributes:
   - [ ] `aria-label` for icon-only buttons
   - [ ] `aria-pressed` for toggle buttons
   - [ ] `aria-invalid` and `aria-describedby` for form inputs
7. [ ] For workflow components:
   - [ ] Define workflow array as `readonly` const
   - [ ] Create config object with display properties
   - [ ] Export helper functions (`getNext`, `getPrevious`, `isValid`)
8. [ ] For tracking components:
   - [ ] Use `useRef` to prevent React 18 strict mode double-fire
   - [ ] Return `null` for invisible components
9. [ ] Export from barrel file (`index.ts`)
10. [ ] Add JSDoc comments with usage examples
11. [ ] Verify TypeScript: `npm run typecheck`
12. [ ] Test in browser with different states
13. [ ] Verify accessibility with keyboard navigation
14. [ ] Document pattern in this PATTERNS.md file

---

## Storybook Integration

Components with multiple visual states should include Storybook stories:

```tsx
// SampleStatusBadge.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { SampleStatusBadge } from "./SampleStatusBadge";

const meta: Meta<typeof SampleStatusBadge> = {
  title: "Components/SampleStatusBadge",
  component: SampleStatusBadge,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof SampleStatusBadge>;

export const ReadOnly: Story = {
  args: {
    status: "received",
  },
};

export const Interactive: Story = {
  args: {
    status: "received",
    activityId: 123,
    interactive: true,
    showStepper: true,
  },
};

export const Compact: Story = {
  args: {
    status: "feedback_pending",
    compact: true,
  },
};
```

---

## Related Documentation

- **UI_STANDARDS.md** - Three-tier architecture (Atoms, Molecules, Organisms)
- **MODULE_CHECKLIST.md** - Feature module standards and file structure
- **CODE_QUALITY.md** - Accessibility requirements (ARIA, touch targets)
- **PROVIDER_RULES.md** - Data provider integration patterns
- **hooks/PATTERNS.md** - Shared hook patterns (`useFavorites`, `useRecentItems`)
