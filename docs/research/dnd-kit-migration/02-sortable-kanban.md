# @dnd-kit Sortable Kanban Patterns

> **Purpose:** Implementation patterns for multi-column Kanban boards using `@dnd-kit/sortable` - the critical reference for our Opportunities Pipeline migration.

---

## Installation

```bash
npm install @dnd-kit/sortable
```

---

## SortableContext

Wraps sortable items and provides context for the `useSortable` hook.

### Basic Usage

```tsx
import {SortableContext, verticalListSortingStrategy} from '@dnd-kit/sortable';

function Column({items}) {
  return (
    <SortableContext
      items={items.map(i => i.id)}
      strategy={verticalListSortingStrategy}
    >
      {items.map(item => (
        <SortableCard key={item.id} item={item} />
      ))}
    </SortableContext>
  );
}
```

### Props

```typescript
interface SortableContextProps {
  items: UniqueIdentifier[];     // Sorted array of IDs (must match render order)
  strategy?: SortingStrategy;     // How items shift during drag
  id?: string;                    // Optional container ID
  disabled?: boolean;             // Disable sorting
}
```

### Sorting Strategies

| Strategy | Use Case | Virtualization |
|----------|----------|----------------|
| `rectSortingStrategy` | Grid layouts | No |
| `verticalListSortingStrategy` | Vertical lists (our columns) | Yes |
| `horizontalListSortingStrategy` | Horizontal lists | Yes |
| `rectSwappingStrategy` | Swap instead of shift | No |

**For our Kanban columns, use `verticalListSortingStrategy`.**

---

## useSortable Hook

Combines `useDraggable` and `useDroppable` into a single hook for sortable items.

### Usage

```tsx
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

function SortableCard({item}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({id: item.id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardContent item={item} />
    </div>
  );
}
```

### Arguments

```typescript
interface UseSortableArguments {
  id: UniqueIdentifier;         // Required unique ID
  disabled?: boolean;            // Disable sorting for this item
  data?: Record<string, any>;    // Custom data
  transition?: {                 // Animation config
    duration: number;
    easing: string;
  } | null;
  strategy?: SortingStrategy;    // Override context strategy
}
```

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `setNodeRef` | `(node: HTMLElement) => void` | Ref callback |
| `listeners` | `SyntheticListeners` | Event handlers |
| `attributes` | `DraggableAttributes` | ARIA attributes |
| `transform` | `Transform \| null` | Position offset |
| `transition` | `string \| undefined` | CSS transition value |
| `isDragging` | `boolean` | Is this item being dragged |
| `isSorting` | `boolean` | Is any sort happening |
| `over` | `{id} \| null` | Droppable currently over |
| `index` | `number` | Current index in list |
| `activeIndex` | `number` | Index of dragged item |
| `overIndex` | `number` | Index of item under drag |

### Drag Handle Pattern

```tsx
function SortableCard({item}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
  } = useSortable({id: item.id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {/* Drag handle */}
      <button
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        className="min-h-[44px] min-w-[44px] cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Card content - doesn't trigger drag */}
      <CardContent item={item} />
    </div>
  );
}
```

---

## Multi-Container Kanban Pattern

This is the key pattern for our Opportunities Pipeline with 7 stage columns.

### Architecture

```
DndContext
├── SortableContext (column: new_lead)
│   ├── SortableCard
│   └── SortableCard
├── SortableContext (column: initial_outreach)
│   └── SortableCard
├── SortableContext (column: sample_visit_offered)
│   ├── SortableCard
│   └── SortableCard
└── DragOverlay
    └── CardPreview (when dragging)
```

### Complete Implementation

```tsx
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

function OpportunityKanban() {
  const [activeId, setActiveId] = useState(null);
  const [columns, setColumns] = useState(initialColumns);

  // Configure sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-3 overflow-x-auto">
        {columns.map(column => (
          <Column key={column.id} column={column} />
        ))}
      </div>

      <DragOverlay>
        {activeId ? (
          <OpportunityCard
            opportunity={findOpportunity(activeId)}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({column}) {
  const {setNodeRef, isOver} = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`w-72 ${isOver ? 'bg-accent' : ''}`}
    >
      <ColumnHeader stage={column.id} count={column.items.length} />

      <SortableContext
        items={column.items.map(i => i.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
          {column.items.map(item => (
            <SortableOpportunityCard key={item.id} opportunity={item} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
```

### Event Handlers

#### onDragStart

```tsx
function handleDragStart(event: DragStartEvent) {
  const {active} = event;
  setActiveId(active.id);

  // For accessibility announcement
  const opportunity = findOpportunity(active.id);
  announceToScreenReader(
    `Picked up ${opportunity.name}. Currently in ${opportunity.stage} stage.`
  );
}
```

#### onDragOver (Cross-Column Movement)

This is called when dragging over a different column - update state for real-time visual feedback:

```tsx
function handleDragOver(event: DragOverEvent) {
  const {active, over} = event;

  if (!over) return;

  const activeColumn = findColumnByItemId(active.id);
  const overColumn = findColumnByItemId(over.id) || findColumnById(over.id);

  if (!activeColumn || !overColumn || activeColumn === overColumn) {
    return;
  }

  // Move item from one column to another
  setColumns(columns => {
    const activeItems = [...activeColumn.items];
    const overItems = [...overColumn.items];

    // Find indexes
    const activeIndex = activeItems.findIndex(i => i.id === active.id);
    const overIndex = overItems.findIndex(i => i.id === over.id);

    // Remove from source
    const [movedItem] = activeItems.splice(activeIndex, 1);

    // Update the item's stage
    movedItem.stage = overColumn.id;

    // Insert into destination
    const newIndex = overIndex >= 0 ? overIndex : overItems.length;
    overItems.splice(newIndex, 0, movedItem);

    return columns.map(col => {
      if (col.id === activeColumn.id) return {...col, items: activeItems};
      if (col.id === overColumn.id) return {...col, items: overItems};
      return col;
    });
  });
}
```

#### onDragEnd (Persist Changes)

```tsx
function handleDragEnd(event: DragEndEvent) {
  const {active, over} = event;

  setActiveId(null);

  if (!over) return;

  const activeColumn = findColumnByItemId(active.id);
  const overColumn = findColumnByItemId(over.id) || findColumnById(over.id);

  if (!activeColumn || !overColumn) return;

  // Same column reordering
  if (activeColumn.id === overColumn.id) {
    const column = activeColumn;
    const oldIndex = column.items.findIndex(i => i.id === active.id);
    const newIndex = column.items.findIndex(i => i.id === over.id);

    if (oldIndex !== newIndex) {
      setColumns(columns =>
        columns.map(col =>
          col.id === column.id
            ? {...col, items: arrayMove(col.items, oldIndex, newIndex)}
            : col
        )
      );
    }
  }

  // Persist to database
  const opportunity = findOpportunity(active.id);
  updateOpportunityStage(opportunity.id, opportunity.stage);
}
```

#### onDragCancel

```tsx
function handleDragCancel() {
  setActiveId(null);
  // Could revert optimistic updates if needed
}
```

---

## Empty Column Handling

Allow dropping into empty columns by making the column itself a droppable:

```tsx
function Column({column}) {
  const {setNodeRef, isOver} = useDroppable({
    id: column.id, // Column ID as droppable
  });

  return (
    <div ref={setNodeRef}>
      <SortableContext items={column.items.map(i => i.id)}>
        {column.items.length === 0 ? (
          <EmptyColumnPlaceholder isOver={isOver} />
        ) : (
          column.items.map(item => <SortableCard key={item.id} item={item} />)
        )}
      </SortableContext>
    </div>
  );
}
```

---

## Mapping to Our Current Implementation

| Current (@hello-pangea/dnd) | New (@dnd-kit/sortable) |
|-----------------------------|-------------------------|
| `DragDropContext` | `DndContext` |
| `Droppable` component | `useDroppable` + `SortableContext` |
| `Draggable` component | `useSortable` hook |
| `provided.innerRef` | `setNodeRef` |
| `provided.droppableProps` | Not needed |
| `provided.draggableProps` | `attributes` |
| `provided.dragHandleProps` | `listeners` + `setActivatorNodeRef` |
| `snapshot.isDragging` | `isDragging` from hook |
| `snapshot.isDraggingOver` | `isOver` from useDroppable |
| `provided.placeholder` | Not needed (CSS transforms) |
| `result.source.index` | Track via state or `active.data` |
| `result.destination.index` | Calculate from `over.id` |

---

## Sources

- [Sortable Preset Overview](https://docs.dndkit.com/presets/sortable)
- [SortableContext Documentation](https://docs.dndkit.com/presets/sortable/sortable-context)
- [useSortable Hook Documentation](https://docs.dndkit.com/presets/sortable/useSortable)
