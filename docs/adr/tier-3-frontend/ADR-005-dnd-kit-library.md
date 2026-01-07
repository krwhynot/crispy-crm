# ADR-005: Use @dnd-kit for Drag-and-Drop Interactions

## Status

Accepted

## Context

Crispy CRM requires drag-and-drop functionality for two core features:

1. **Opportunity Pipeline Kanban** - Dragging opportunities between pipeline stages (new_lead, initial_outreach, sample_visit_offered, feedback_logged, demo_scheduled, closed_won, closed_lost)
2. **Task Dashboard Kanban** - Dragging tasks between time-horizon columns (Overdue, Today, This Week)

When evaluating drag-and-drop libraries, we considered:

- **react-beautiful-dnd** - The most popular option historically, but now deprecated and unmaintained. Uses legacy class components and has accessibility gaps.
- **@dnd-kit** - Modern, hooks-based library with modular architecture, TypeScript-first design, and built-in accessibility support.

Given that react-beautiful-dnd is deprecated and we need a library that supports React 19, TypeScript, and WCAG 2.1 AA accessibility requirements, @dnd-kit was the clear choice.

## Decision

Adopt @dnd-kit with the following packages:

| Package | Version | Purpose |
|---------|---------|---------|
| `@dnd-kit/core` | ^6.3.1 | Core DndContext, sensors, collision detection |
| `@dnd-kit/sortable` | ^10.0.0 | Sortable lists with useSortable hook |
| `@dnd-kit/utilities` | ^3.2.2 | CSS transform utilities |

### Configuration Patterns

**Dual Sensor Setup:**
- `PointerSensor` with `distance: 8` activation constraint (prevents accidental drags on click)
- `KeyboardSensor` with `sortableKeyboardCoordinates` for full keyboard navigation

**Collision Detection:**
- Complex kanban (Opportunities): Custom cascading detection (pointerWithin -> rectIntersection -> closestCorners)
- Simple kanban (Tasks): `closestCorners` is sufficient

**Accessibility:**
- Custom `announcements` object for screen reader feedback
- ARIA labels on drag handles
- Focus-visible ring styles for keyboard users

## Consequences

### Positive

- **Modular Architecture**: Import only what you need (core, sortable, utilities)
- **TypeScript-First**: Full type definitions, no @types package needed
- **Accessibility Built-In**: Screen reader announcements, keyboard navigation via `accessibility={{ announcements }}`
- **Modern React Patterns**: Hooks-based API (useSortable, useDroppable, useSensors)
- **Performance**: React.memo optimization with custom comparison functions
- **Flexible Collision Detection**: Compose multiple strategies for complex layouts
- **Active Maintenance**: Regular updates, responsive to issues

### Negative

- **Learning Curve**: More concepts to understand vs react-beautiful-dnd (sensors, collision detection, modifiers)
- **More Boilerplate**: Requires explicit sensor setup and DragOverlay configuration
- **Manual CSS Transforms**: Must apply transforms via CSS utilities (not automatic like rbd)

## Code Examples

### DndContext Setup (Opportunities)

```tsx
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

// Custom collision detection for nested scrollable containers
const customCollisionDetection: CollisionDetection = (args) => {
  // 1. Check if pointer is directly within a droppable
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) return pointerCollisions;

  // 2. Fall back to rectangle intersection
  const rectCollisions = rectIntersection(args);
  if (rectCollisions.length > 0) return rectCollisions;

  // 3. Final fallback for keyboard navigation
  return closestCorners(args);
};

// Screen reader announcements
const announcements = {
  onDragStart: ({ active }) => {
    return `Picked up ${getItemName(active.id)}. Currently in ${getStageName(active.id)}.`;
  },
  onDragOver: ({ over }) => {
    if (over) return `Moving to ${getStageName(over.id)}.`;
    return `No longer over a droppable area.`;
  },
  onDragEnd: ({ over }) => {
    if (over) return `Dropped in ${getStageName(over.id)}.`;
    return `Drag cancelled.`;
  },
  onDragCancel: () => `Dragging was cancelled.`,
};

function KanbanBoard() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={(event) => setActiveId(String(event.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{ announcements }}
    >
      {/* Kanban columns */}
      <DragOverlay>
        {activeItem ? <Card item={activeItem} isDragOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
```

### Draggable Card (useSortable)

```tsx
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CardProps {
  item: Item;
  isDragOverlay?: boolean;
}

export const Card = memo(function Card({ item, isDragOverlay = false }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(item.id),
    disabled: isDragOverlay,
  });

  const style: React.CSSProperties = isDragOverlay
    ? {}
    : {
        transform: CSS.Transform.toString(transform),
        transition,
      };

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      style={style}
      className={`
        bg-card rounded-lg border border-border p-2
        ${isDragging && !isDragOverlay ? "opacity-50" : "opacity-100"}
        ${isDragOverlay ? "shadow-xl" : ""}
      `}
    >
      {/* Drag handle with 44px touch target (WCAG AA) */}
      <div
        {...attributes}
        {...listeners}
        data-drag-handle
        aria-label="Drag to reorder"
        className="min-h-[44px] min-w-[44px] flex items-center justify-center
                   cursor-grab active:cursor-grabbing touch-none
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      {/* Card content */}
    </div>
  );
});
```

### Droppable Column (useDroppable + SortableContext)

```tsx
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface ColumnProps {
  columnId: string;
  items: Item[];
}

export const Column = memo(function Column({ columnId, items }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

  const itemIds = useMemo(() => items.map(i => String(i.id)), [items]);

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col bg-card border rounded-xl min-w-[280px]
        ${isOver ? "ring-2 ring-primary/50 bg-accent/20" : ""}
      `}
    >
      <h2 className="font-semibold p-3 border-b">{columnId}</h2>
      <div className="flex-1 p-2 space-y-2">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <Card key={item.id} item={item} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
});
```

### Optimistic UI with Rollback

```tsx
const handleDragEnd = useCallback((event: DragEndEvent) => {
  const { active, over } = event;
  if (!over) return;

  // Store previous state for rollback
  const previousState = itemsByColumn;

  // Optimistic UI update
  const newState = moveItem(previousState, active.id, over.id);
  setItemsByColumn(newState);

  // API call with rollback on error
  update("items", {
    id: active.id,
    data: { column: getColumnId(over.id) },
  }, {
    onSuccess: () => notify("Moved successfully", { type: "success" }),
    onError: () => {
      notify("Error: Could not move item. Reverting.", { type: "warning" });
      setItemsByColumn(previousState);
    },
  });
}, [itemsByColumn, update, notify]);
```

## Anti-Pattern: Do NOT Use

```tsx
// DEPRECATED - react-beautiful-dnd is unmaintained
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// Problems:
// - No updates since 2022
// - Uses legacy findDOMNode (React StrictMode warnings)
// - No React 19 support
// - Accessibility gaps
// - Class component internals
```

## Implementation Files

| File | Purpose |
|------|---------|
| `src/atomic-crm/opportunities/kanban/OpportunityListContent.tsx` | Opportunity Kanban DndContext, custom collision detection, announcements |
| `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx` | Draggable opportunity card with useSortable |
| `src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx` | Droppable column with useDroppable, SortableContext |
| `src/atomic-crm/dashboard/v3/components/TasksKanbanPanel.tsx` | Task Kanban DndContext with closestCorners |
| `src/atomic-crm/dashboard/v3/components/TaskKanbanCard.tsx` | Draggable task card with useSortable |

## Related ADRs

- ADR-013: WCAG 2.1 AA Accessibility Standards (44px touch targets, ARIA labels, focus rings)
