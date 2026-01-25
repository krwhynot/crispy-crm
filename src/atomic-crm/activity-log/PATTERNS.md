# Activity Log Patterns

Patterns for rendering polymorphic activity feeds with context-aware layouts, lazy pagination, and type-safe variant rendering.

## Component Hierarchy

```
ActivityLog (entry point + loading/error states)
    ↓
ActivityLogContext.Provider (view mode: company | contact | opportunity | all)
    ↓
ActivityLogIterator (pagination state + lazy loading)
    ↓
ActivityItem (polymorphic type dispatcher)
    ↓
[Variant Components]
├── ActivityLogOrganizationCreated
├── ActivityLogContactCreated
├── ActivityLogContactNoteCreated → ActivityLogNote (reusable layout)
├── ActivityLogOpportunityCreated
└── ActivityLogOpportunityNoteCreated → ActivityLogNote (reusable layout)
```

---

## Pattern A: Activity Log Context

Context provider for conditional rendering based on the viewing context. Enables variant components to adapt their layout (e.g., hiding redundant organization names when viewing from the organization page).

```tsx
// ActivityLogContext.tsx - Complete implementation
import { createContext, useContext } from "react";

export type activityLogContextValue = "company" | "contact" | "opportunity" | "all";

export const ActivityLogContext = createContext<activityLogContextValue>("all");

export const useActivityLogContext = () => {
  const context = useContext(ActivityLogContext);
  return context;
};
```

### Context Values

| Value | Use Case | Rendering Behavior |
|-------|----------|-------------------|
| `"all"` | Dashboard, global feed | Show all entity references, inline dates |
| `"company"` | Organization detail page | Hide org name, right-align dates |
| `"contact"` | Contact detail page | Show org references, contextual dates |
| `"opportunity"` | Opportunity detail page | Show org references, contextual dates |

### Usage in Variant Components

```tsx
// ActivityLogOrganizationCreated.tsx - Lines 14-42
export function ActivityLogOrganizationCreated({ activity }: ActivityLogOrganizationCreatedProps) {
  const context = useActivityLogContext();
  const { organization } = activity;
  return (
    <div className="p-0">
      <div className="flex flex-row space-x-1 items-center w-full">
        <OrganizationAvatar width={20} height={20} record={organization} />
        <div className="text-sm text-muted-foreground flex-grow">
          <ReferenceField source="sales_id" reference="sales" record={activity}>
            <SaleName />
          </ReferenceField>{" "}
          added organization{" "}
          <Link to={`/organizations/${organization.id}/show`}>{organization.name}</Link>
          {/* Inline date when viewing ALL activities */}
          {context === "all" && (
            <RelativeDate date={activity.date} />
          )}
        </div>
        {/* Right-aligned date when viewing from organization page */}
        {context === "organization" && (
          <span className="text-muted-foreground text-sm">
            <RelativeDate date={activity.date} />
          </span>
        )}
      </div>
    </div>
  );
}
```

**When to use**: Always wrap `ActivityLogIterator` with the context provider. Choose context value based on the page where the activity log is displayed.

---

## Pattern B: Polymorphic Iterator

Client-side pagination with "Load more" functionality. Uses slice-based state to progressively reveal activities without re-fetching from the server.

```tsx
// ActivityLogIterator.tsx - Lines 18-50
interface ActivityLogIteratorProps {
  activities: Activity[];
  pageSize: number;
}

export function ActivityLogIterator({ activities, pageSize }: ActivityLogIteratorProps) {
  const [activitiesDisplayed, setActivityDisplayed] = useState(pageSize);

  // Progressive slice - no server round-trips
  const filteredActivities = activities.slice(0, activitiesDisplayed);

  return (
    <div className="space-y-4">
      {filteredActivities.map((activity, index) => (
        <Fragment key={index}>
          <ActivityItem key={activity.id} activity={activity} />
          <Separator />
        </Fragment>
      ))}

      {/* Load more button - only shown when more activities exist */}
      {activitiesDisplayed < activities.length && (
        <button
          type="button"
          onClick={() => {
            setActivityDisplayed((activitiesDisplayed) => activitiesDisplayed + pageSize);
          }}
          className="flex w-full justify-center text-sm underline hover:no-underline"
        >
          Load more activity
        </button>
      )}
    </div>
  );
}
```

### Key Implementation Details

- **Initial page size**: Controlled via `pageSize` prop (default: 20)
- **Increment size**: Same as `pageSize` for consistent UX
- **Separator pattern**: Visual divider between each activity card
- **Fragment wrapper**: Avoids extra DOM nodes while maintaining key

**When to use**: For any activity feed where you want to show a subset initially but have all data client-side. The RPC returns up to 250 activities, so pagination is purely cosmetic.

---

## Pattern C: Variant Rendering

Type-specific components that render different layouts based on activity type. Each variant is a standalone component with its own prop interface.

### Variant Component Structure

| Variant | Entity | Uses ActivityLogNote | Has Avatar |
|---------|--------|---------------------|------------|
| `ActivityLogOrganizationCreated` | Organization | No | OrganizationAvatar |
| `ActivityLogContactCreated` | Contact | No | Avatar (contact) |
| `ActivityLogContactNoteCreated` | ContactNote | Yes | Avatar via ReferenceField |
| `ActivityLogOpportunityCreated` | Opportunity | No | Placeholder circle |
| `ActivityLogOpportunityNoteCreated` | OpportunityNote | Yes | OrganizationAvatar via chain |

### Reusable Note Layout

```tsx
// ActivityLogNote.tsx - Shared layout for note-type activities
interface ActivityLogContactNoteCreatedProps {
  header: ReactNode;  // Flexible header composition
  text: string;       // Note content
}

export function ActivityLogNote({ header, text }: ActivityLogContactNoteCreatedProps) {
  if (!text) {
    return null;  // Don't render empty notes
  }
  const paragraphs = text.split("\n");

  return (
    <div className="p-0">
      <div className="flex flex-col space-y-2 w-full">
        <div className="flex flex-row space-x-1 items-center w-full">{header}</div>
        <div>
          {/* CSS line-clamp limits visible text */}
          <div className="text-sm line-clamp-3 overflow-hidden">
            {paragraphs.map((paragraph: string, index: number) => (
              <Fragment key={index}>
                {paragraph}
                {index < paragraphs.length - 1 && <br />}
              </Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### ReferenceField Chains (Complex Variants)

```tsx
// ActivityLogContactNoteCreated.tsx - Nested ReferenceField for avatar
function ContactAvatar() {
  const record = useRecordContext<Contact>();
  return <Avatar width={20} height={20} record={record} />;
}

export function ActivityLogContactNoteCreated({ activity }: ActivityLogContactNoteCreatedProps) {
  const context = useActivityLogContext();
  const { contactNote } = activity;
  return (
    <ActivityLogNote
      header={
        <div className="flex items-center gap-2 w-full">
          {/* ReferenceField fetches contact data, ContactAvatar uses useRecordContext */}
          <ReferenceField source="contact_id" reference="contacts" record={activity.contactNote}>
            <ContactAvatar />
          </ReferenceField>

          <div className="flex flex-row flex-grow">
            <div className="text-sm text-muted-foreground flex-grow">
              <ReferenceField source="sales_id" reference="sales" record={activity}>
                <SaleName />
              </ReferenceField>{" "}
              added a note about{" "}
              <ReferenceField source="contact_id" reference="contacts" record={activity.contactNote}>
                <TextField source="first_name" /> <TextField source="last_name" />
              </ReferenceField>
            </div>

            {context === "company" && (
              <span className="text-muted-foreground text-sm">
                <RelativeDate date={activity.date} />
              </span>
            )}
          </div>
        </div>
      }
      text={contactNote.text}
    />
  );
}
```

**When to use**: Create a new variant component for each activity type that has a distinct visual representation.

---

## Pattern D: Activity Type Selection

Type-safe dispatch using discriminated union types and type constants. The `ActivityItem` function routes to the correct variant based on the `type` property.

### Type Constants

```tsx
// consts.ts - Type-safe string constants
export const ORGANIZATION_CREATED = "organization.created" as const;
export const CONTACT_CREATED = "contact.created" as const;
export const CONTACT_NOTE_CREATED = "contactNote.created" as const;
export const OPPORTUNITY_CREATED = "opportunity.created" as const;
export const OPPORTUNITY_NOTE_CREATED = "opportunityNote.created" as const;
```

### Discriminated Union Type

```tsx
// types.ts - Lines 394-401
export type Activity = RaRecord &
  (
    | ActivityOrganizationCreated
    | ActivityContactCreated
    | ActivityContactNoteCreated
    | ActivityOpportunityCreated
    | ActivityOpportunityNoteCreated
  );
```

### Polymorphic Dispatcher

```tsx
// ActivityLogIterator.tsx - Lines 52-74
function ActivityItem({ activity }: { activity: Activity }) {
  if (activity.type === ORGANIZATION_CREATED) {
    return <ActivityLogOrganizationCreated activity={activity} />;
  }

  if (activity.type === CONTACT_CREATED) {
    return <ActivityLogContactCreated activity={activity} />;
  }

  if (activity.type === CONTACT_NOTE_CREATED) {
    return <ActivityLogContactNoteCreated activity={activity} />;
  }

  if (activity.type === OPPORTUNITY_CREATED) {
    return <ActivityLogOpportunityCreated activity={activity} />;
  }

  if (activity.type === OPPORTUNITY_NOTE_CREATED) {
    return <ActivityLogOpportunityNoteCreated activity={activity} />;
  }

  return null;  // Fallback for unknown types
}
```

### Why if-statements over switch?

- TypeScript narrowing works better with if-chains for discriminated unions
- Each condition fully narrows the type for the return statement
- The `return null` fallback is explicit and handles future unknown types

**When to use**: Always use this pattern for dispatching. Add new type constants and if-clauses when adding activity types.

---

## Pattern E: Skeleton Loading

Placeholder UI during data fetching that matches the expected activity card structure. Uses 5 skeleton instances to simulate the expected page size.

```tsx
// ActivityLog.tsx - Lines 29-44
if (isPending) {
  return (
    <div className="mt-1">
      {/* 5 skeletons = roughly quarter of default pageSize */}
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="space-y-2 mt-1" key={index}>
          {/* Row 1: Avatar + headline */}
          <div className="flex flex-row space-x-2 items-center">
            <Skeleton className="w-5 h-5 rounded-full" />  {/* Avatar placeholder */}
            <Skeleton className="w-full h-4" />            {/* Headline placeholder */}
          </div>
          {/* Row 2: Note preview */}
          <Skeleton className="w-full h-12" />             {/* Note text placeholder */}
          <Separator />
        </div>
      ))}
    </div>
  );
}
```

### Skeleton Structure Rationale

| Element | Dimensions | Matches |
|---------|------------|---------|
| Avatar | `w-5 h-5 rounded-full` | 20x20px contact/org avatars |
| Headline | `w-full h-4` | Sales name + action + entity link |
| Note preview | `w-full h-12` | 3-line clamped note text |
| Separator | (component) | Visual divider between activities |

**When to use**: Always show skeletons during `isPending` state. Match skeleton dimensions to actual content for perceived performance.

---

## Pattern F: Service Integration

Service layer pattern using `ActivitiesService` with React Query for data fetching. The service wraps an optimized RPC function that consolidates multiple queries server-side.

```tsx
// ActivityLog.tsx - Lines 18-27
export function ActivityLog({ organizationId, pageSize = 20, context = "all" }: ActivityLogProps) {
  const dataProvider = useDataProvider();

  // Create service instance using the base data provider
  const activitiesService = new ActivitiesService(dataProvider);

  const { data, isPending, error } = useQuery({
    queryKey: ["activityLog", organizationId],
    queryFn: () => activitiesService.getActivityLog(organizationId),
  });
  // ...
}
```

### Service Implementation

```tsx
// services/activities.service.ts
import { logger } from '@/lib/logger';

export class ActivitiesService {
  constructor(private dataProvider: DataProvider) {}

  /**
   * Get activity log for an organization or sales person
   * Uses optimized RPC function to consolidate 5 queries into 1 server-side UNION ALL
   * Engineering Constitution: BOY SCOUT RULE - improved performance 5x
   */
  async getActivityLog(
    organizationId?: Identifier,
    salesId?: Identifier
  ): Promise<Record<string, unknown>[]> {
    try {
      return await getActivityLog(this.dataProvider, organizationId, salesId);
    } catch (error: unknown) {
      logger.error('Failed to get activity log', {
        organizationId,
        salesId,
        error: error instanceof Error ? error.message : String(error),
        operation: 'ActivitiesService.getActivityLog',
      });
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      throw new Error(`Get activity log failed: ${errorMessage}`);
    }
  }
}
```

### RPC Optimization

The `get_activity_log` RPC function consolidates these queries server-side:
1. `organizations` (created events)
2. `contacts` (created events)
3. `contact_notes` (created events)
4. `opportunities` (created events)
5. `opportunity_notes` (created events)

**Performance improvement**: 5 round-trips → 1 UNION ALL query

### Query Key Strategy

```tsx
queryKey: ["activityLog", organizationId]
```

- Base key: `"activityLog"` - invalidates all activity queries
- Organization filter: `organizationId` - cache per-organization feeds separately
- Omitting `salesId` from key because it's typically static per session

**When to use**: Always use the service layer for data fetching. Never call dataProvider directly from components.

---

## Comparison: Activity Log vs Notes vs Tasks

| Aspect | Activity Log | Notes | Tasks |
|--------|-------------|-------|-------|
| **Purpose** | Aggregate timeline of all entity events | Freeform text attached to entities | Actionable items with due dates |
| **Data Source** | RPC UNION ALL (read-only) | Direct table CRUD | Direct table CRUD |
| **Schema Complexity** | HIGH (discriminated union, 5 types) | LOW (text + entity ref) | MEDIUM (type, priority, dates) |
| **Computed Fields** | None (RPC returns denormalized) | None | Variable |
| **Pagination** | Client-side slice (250 max) | Server-side with cursor | Server-side with cursor |
| **Context-Aware Rendering** | Yes (4 modes) | No | No |
| **Soft Delete** | N/A (read-only view) | Yes | Yes |

### When to Use Each

- **Activity Log**: Display aggregated history timeline, read-only
- **Notes**: User-entered text content, editable
- **Tasks**: Action items with workflow (due date, completion, priority)

---

## Anti-Patterns

### 1. Missing Variant Handler

```tsx
// BAD - Unknown types fail silently
function ActivityItem({ activity }: { activity: Activity }) {
  // Missing handlers for some types...
  if (activity.type === CONTACT_CREATED) {
    return <ActivityLogContactCreated activity={activity} />;
  }
  // No fallback - undefined behavior
}

// GOOD - Explicit fallback with null return
function ActivityItem({ activity }: { activity: Activity }) {
  if (activity.type === ORGANIZATION_CREATED) {
    return <ActivityLogOrganizationCreated activity={activity} />;
  }
  // ... all other handlers ...

  return null;  // Explicit fallback
}
```

### 2. Direct Service Calls (Bypassing React Query)

```tsx
// BAD - No caching, no loading states, no error handling
function ActivityLog({ organizationId }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    activitiesService.getActivityLog(organizationId).then(setData);
  }, [organizationId]);
  // ...
}

// GOOD - React Query handles caching, loading, errors
function ActivityLog({ organizationId }) {
  const { data, isPending, error } = useQuery({
    queryKey: ["activityLog", organizationId],
    queryFn: () => activitiesService.getActivityLog(organizationId),
  });
  // ...
}
```

### 3. Ignoring Context for Conditional Rendering

```tsx
// BAD - Always shows organization name
export function ActivityLogContactCreated({ activity }) {
  return (
    <div>
      Sales added {contact.first_name} to org {activity.customer_organization_id}
    </div>
  );
}

// GOOD - Context-aware rendering
export function ActivityLogContactCreated({ activity }) {
  const context = useActivityLogContext();
  return (
    <div>
      Sales added {contact.first_name}
      {context !== "company" && <> to org {activity.customer_organization_id}</>}
    </div>
  );
}
```

### 4. Hardcoded Pagination Values

```tsx
// BAD - Magic numbers
const filteredActivities = activities.slice(0, 20);

// GOOD - Configurable via props
const filteredActivities = activities.slice(0, activitiesDisplayed);
// where activitiesDisplayed is initialized from pageSize prop
```

---

## Migration Checklist: Adding New Activity Types

When adding a new activity type (e.g., `DEAL_STAGE_CHANGED`):

1. [ ] **Add type constant** to `src/atomic-crm/consts.ts`
   ```tsx
   export const DEAL_STAGE_CHANGED = "dealStage.changed" as const;
   ```

2. [ ] **Define interface** in `src/atomic-crm/types.ts`
   ```tsx
   export interface ActivityDealStageChanged extends Pick<RaRecord, "id"> {
     type: typeof DEAL_STAGE_CHANGED;
     opportunity_id: Identifier;
     from_stage: string;
     to_stage: string;
     date: string;
   }
   ```

3. [ ] **Add to Activity union type** in `src/atomic-crm/types.ts`
   ```tsx
   export type Activity = RaRecord &
     (
       | ActivityOrganizationCreated
       | ActivityContactCreated
       | ActivityContactNoteCreated
       | ActivityOpportunityCreated
       | ActivityOpportunityNoteCreated
       | ActivityDealStageChanged  // Add here
     );
   ```

4. [ ] **Create variant component** at `src/atomic-crm/activity-log/ActivityLogDealStageChanged.tsx`
   - Use `useActivityLogContext()` for conditional rendering
   - Follow existing variant patterns for layout

5. [ ] **Add case to ActivityItem dispatcher** in `ActivityLogIterator.tsx`
   ```tsx
   if (activity.type === DEAL_STAGE_CHANGED) {
     return <ActivityLogDealStageChanged activity={activity} />;
   }
   ```

6. [ ] **Update RPC function** (if needed)
   - Modify `get_activity_log` PostgreSQL function to include new activity type in UNION ALL

7. [ ] **Test context-aware rendering** for all 4 context modes
   - `"all"` - Dashboard view
   - `"company"` - Organization detail page
   - `"contact"` - Contact detail page
   - `"opportunity"` - Opportunity detail page

8. [ ] **Export from barrel** in `src/atomic-crm/activity-log/index.ts`
   ```tsx
   export { ActivityLogDealStageChanged } from "./ActivityLogDealStageChanged";
   ```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `ActivityLog.tsx` | Entry point, loading/error states, context provider wrapper |
| `ActivityLogContext.tsx` | Context definition and hook |
| `ActivityLogIterator.tsx` | Pagination logic, polymorphic dispatch |
| `ActivityLogNote.tsx` | Reusable note layout component |
| `ActivityLogOrganizationCreated.tsx` | Variant: org creation |
| `ActivityLogContactCreated.tsx` | Variant: contact creation |
| `ActivityLogContactNoteCreated.tsx` | Variant: contact note (uses ActivityLogNote) |
| `ActivityLogOpportunityCreated.tsx` | Variant: opportunity creation |
| `ActivityLogOpportunityNoteCreated.tsx` | Variant: opp note (uses ActivityLogNote) |
| `../consts.ts` | Activity type constants |
| `../types.ts` | Activity discriminated union |
| `../services/activities.service.ts` | Service layer for data fetching |
