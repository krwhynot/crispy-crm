# @dnd-kit Migration Guide

> **Purpose:** Step-by-step guide for migrating the Opportunities Kanban from `@hello-pangea/dnd` to `@dnd-kit`.

---

## Overview

### Files to Migrate

| File | Current | After |
|------|---------|-------|
| `OpportunityListContent.tsx` | `DragDropContext` | `DndContext` + `DragOverlay` |
| `OpportunityColumn.tsx` | `Droppable` | `useDroppable` + `SortableContext` |
| `OpportunityCard.tsx` | `Draggable` | `useSortable` |

### Package Changes

```bash
# Remove old package
npm uninstall @hello-pangea/dnd

# Install new packages
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers @dnd-kit/utilities
```

---

## API Mapping Reference

### Components & Hooks

| @hello-pangea/dnd | @dnd-kit |
|-------------------|----------|
| `DragDropContext` | `DndContext` |
| `Droppable` | `useDroppable` hook |
| `Draggable` | `useDraggable` hook |
| (for sortable) | `useSortable` hook |
| (none) | `DragOverlay` |

### Provided Props

| @hello-pangea/dnd | @dnd-kit |
|-------------------|----------|
| `provided.innerRef` | `setNodeRef` |
| `provided.droppableProps` | (not needed) |
| `provided.draggableProps` | `attributes` |
| `provided.dragHandleProps` | `listeners` |
| `provided.placeholder` | (not needed - CSS transforms) |

### Snapshot State

| @hello-pangea/dnd | @dnd-kit |
|-------------------|----------|
| `snapshot.isDragging` | `isDragging` from hook |
| `snapshot.isDraggingOver` | `isOver` from `useDroppable` |
| `snapshot.draggingOverWith` | `over?.id` from `useDroppable` |

### Event Results

| @hello-pangea/dnd | @dnd-kit |
|-------------------|----------|
| `result.draggableId` | `event.active.id` |
| `result.source.droppableId` | Find via `active.data.current?.sortable.containerId` |
| `result.source.index` | `active.data.current?.sortable.index` |
| `result.destination.droppableId` | `event.over.id` or `over.data.current?.sortable.containerId` |
| `result.destination.index` | Calculate from `over.id` position |

---

## Step 1: Migrate OpportunityListContent.tsx

### Current Code

```tsx
import {
  DragDropContext,
  type DropResult,
  type DragStart,
} from "@hello-pangea/dnd";

function OpportunityListContent() {
  return (
    <DragDropContext
      onDragStart={handleDragStart}
      onDragUpdate={handleDragUpdate}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto">
        {stages.map(stage => (
          <OpportunityColumn key={stage} stage={stage} />
        ))}
      </div>
    </DragDropContext>
  );
}
```

### Migrated Code

```tsx
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {sortableKeyboardCoordinates} from "@dnd-kit/sortable";
import {restrictToWindowEdges} from "@dnd-kit/modifiers";

function OpportunityListContent() {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configure sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Find active opportunity for overlay
  const activeOpportunity = activeId
    ? opportunities.find(o => o.id === activeId)
    : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      accessibility={{
        announcements: customAnnouncements,
      }}
    >
      <div className="flex gap-3 overflow-x-auto">
        {stages.map(stage => (
          <OpportunityColumn key={stage} stage={stage} />
        ))}
      </div>

      <DragOverlay modifiers={[restrictToWindowEdges]}>
        {activeOpportunity ? (
          <OpportunityCard
            opportunity={activeOpportunity}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    // Handle cross-column movement
    const {active, over} = event;
    if (!over) return;

    const activeStage = findStageByOpportunityId(active.id);
    const overStage = findStageByDroppableId(over.id);

    if (activeStage !== overStage) {
      // Move to new column (optimistic update)
      moveOpportunityToStage(active.id, overStage);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    setActiveId(null);

    if (!over) return;

    // Persist change to database
    const opportunity = findOpportunity(active.id);
    updateOpportunityStage(opportunity.id, opportunity.stage);
  }

  function handleDragCancel() {
    setActiveId(null);
  }
}
```

---

## Step 2: Migrate OpportunityColumn.tsx

### Current Code

```tsx
import {Droppable} from "@hello-pangea/dnd";

function OpportunityColumn({stage, opportunities}) {
  return (
    <div className="w-72">
      <ColumnHeader stage={stage} />

      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={snapshot.isDraggingOver ? "bg-accent" : ""}
          >
            {opportunities.map((opp, index) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                index={index}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
```

### Migrated Code

```tsx
import {useDroppable} from "@dnd-kit/core";
import {SortableContext, verticalListSortingStrategy} from "@dnd-kit/sortable";

function OpportunityColumn({stage, opportunities}) {
  const {setNodeRef, isOver} = useDroppable({
    id: stage,
  });

  return (
    <div className="w-72">
      <ColumnHeader stage={stage} />

      <div
        ref={setNodeRef}
        className={isOver ? "bg-accent" : ""}
      >
        <SortableContext
          items={opportunities.map(o => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {opportunities.map(opp => (
            <SortableOpportunityCard
              key={opp.id}
              opportunity={opp}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
```

---

## Step 3: Migrate OpportunityCard.tsx

### Current Code

```tsx
import {Draggable} from "@hello-pangea/dnd";

function OpportunityCard({opportunity, index}) {
  return (
    <Draggable draggableId={opportunity.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={snapshot.isDragging ? "opacity-50" : ""}
        >
          {/* Drag handle */}
          <div
            {...provided.dragHandleProps}
            className="cursor-grab"
          >
            <GripVertical />
          </div>

          <CardContent opportunity={opportunity} />
        </div>
      )}
    </Draggable>
  );
}
```

### Migrated Code

```tsx
import {useSortable} from "@dnd-kit/sortable";
import {CSS} from "@dnd-kit/utilities";

function SortableOpportunityCard({opportunity, isDragOverlay = false}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({id: opportunity.id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isDragOverlay ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card rounded-lg border"
    >
      {/* Drag handle */}
      <button
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        className="min-h-[44px] min-w-[44px] cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      <CardContent opportunity={opportunity} />
    </div>
  );
}
```

---

## Step 4: Migrate Announcements

### Current Code

```tsx
function handleDragStart(start: DragStart, provided: ResponderProvided) {
  const opportunity = findOpportunity(start.draggableId);
  provided.announce(
    `Picked up ${opportunity.name}. Currently in ${opportunity.stage} stage.`
  );
}
```

### Migrated Code

```tsx
const customAnnouncements = {
  onDragStart({active}) {
    const opportunity = findOpportunity(active.id);
    return `Picked up ${opportunity.name}. Currently in ${opportunity.stage} stage.`;
  },
  onDragOver({active, over}) {
    if (over) {
      const stage = getStageLabel(over.id);
      return `Moving to ${stage} stage.`;
    }
    return `${getName(active.id)} is no longer over a droppable area.`;
  },
  onDragEnd({active, over}) {
    if (over) {
      return `Dropped ${getName(active.id)} in ${getStageLabel(over.id)} stage.`;
    }
    return `Dragging was cancelled.`;
  },
  onDragCancel({active}) {
    return `Dragging cancelled. ${getName(active.id)} was dropped.`;
  },
};

// Use in DndContext
<DndContext
  accessibility={{
    announcements: customAnnouncements,
  }}
>
```

---

## Common Gotchas

### 1. Index Not Provided

@dnd-kit doesn't pass index to components. Calculate it if needed:

```tsx
// @hello-pangea/dnd way
<Draggable index={index}>

// @dnd-kit way
const index = opportunities.findIndex(o => o.id === opportunity.id);
```

Or use the data from useSortable:

```tsx
const {index, activeIndex, overIndex} = useSortable({id});
```

### 2. No Placeholder Needed

Remove all `{provided.placeholder}` - CSS transforms handle spacing.

### 3. droppableProps Not Needed

Don't look for a replacement for `provided.droppableProps` - just use `setNodeRef`.

### 4. DragOverlay Must Stay Mounted

Don't conditionally render DragOverlay itself - only its children:

```tsx
// ❌ Wrong
{activeId && (
  <DragOverlay>
    <Card />
  </DragOverlay>
)}

// ✅ Correct
<DragOverlay>
  {activeId ? <Card /> : null}
</DragOverlay>
```

### 5. Touch Action on Handle

Add `touch-action: none` to drag handles for mobile:

```tsx
<button className="touch-none cursor-grab">
```

### 6. ID Types

@dnd-kit IDs can be `string | number`. Be consistent:

```tsx
// If your IDs are strings, cast them:
const id = event.active.id as string;
```

---

## Migration Checklist

### Phase 1: Setup
- [ ] Install @dnd-kit packages
- [ ] Keep @hello-pangea/dnd temporarily (for comparison)

### Phase 2: Migrate Components
- [ ] Migrate `OpportunityListContent.tsx`
  - [ ] Add sensors configuration
  - [ ] Add DndContext with collision detection
  - [ ] Add DragOverlay
  - [ ] Update event handlers
- [ ] Migrate `OpportunityColumn.tsx`
  - [ ] Replace Droppable with useDroppable
  - [ ] Add SortableContext
  - [ ] Remove placeholder
- [ ] Migrate `OpportunityCard.tsx`
  - [ ] Replace Draggable with useSortable
  - [ ] Add CSS transform styles
  - [ ] Update drag handle with setActivatorNodeRef
  - [ ] Add touch-action: none

### Phase 3: Test
- [ ] Test drag within column
- [ ] Test drag between columns
- [ ] Test drag to empty column
- [ ] Test horizontal board scroll during drag
- [ ] Test vertical column scroll during drag
- [ ] Test keyboard navigation (Tab, Enter, Arrow keys, Escape)
- [ ] Test on iPad Safari
- [ ] Test screen reader announcements
- [ ] Test with 50+ opportunities

### Phase 4: Cleanup
- [ ] Remove @hello-pangea/dnd package
- [ ] Remove any scroll workarounds
- [ ] Update any related tests

---

## Sources

- [dnd-kit Getting Started](https://docs.dndkit.com/introduction/getting-started)
- [Sortable Preset](https://docs.dndkit.com/presets/sortable)
- [DndContext Documentation](https://docs.dndkit.com/api-documentation/context-provider)
- [useSortable Documentation](https://docs.dndkit.com/presets/sortable/useSortable)
