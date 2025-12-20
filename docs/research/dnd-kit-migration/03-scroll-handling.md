# @dnd-kit Scroll Handling

> **Purpose:** Document how @dnd-kit handles scroll containers and why it solves our current pain points with @hello-pangea/dnd.

---

## Current Pain Points

Our Opportunities Kanban has nested scroll containers:

```
┌─────────────────────────────────────────────────────────┐
│ Board Container (overflow-x-auto)                       │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │ Column 1 │ │ Column 2 │ │ Column 3 │ │ Column 4 │ →  │
│ │ ───────  │ │ ───────  │ │ ───────  │ │ ───────  │    │
│ │ Card     │ │ Card     │ │ Card     │ │ Card     │    │
│ │ Card     │ │ Card     │ │ Card     │ │ Card     │    │
│ │ Card ↓   │ │ Card ↓   │ │ Card ↓   │ │ Card ↓   │    │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
└─────────────────────────────────────────────────────────┘
```

**Issues with @hello-pangea/dnd:**
1. Dragged cards clip when moving outside their column's scroll container
2. Auto-scroll has inconsistent behavior across containers
3. iOS webkit has a known shake bug during auto-scroll
4. Complex scroll container detection can trap draggables

---

## @dnd-kit Solution: DragOverlay

The key insight is that `DragOverlay` renders **outside** the scroll container hierarchy, positioned relative to the **viewport**.

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│ Viewport                                                │
│                                                         │
│   ┌─────────────────────────────────────────────────┐  │
│   │ Board Container (overflow-x-auto)               │  │
│   │ ┌──────────┐ ┌──────────┐ ┌──────────┐         │  │
│   │ │ Column 1 │ │ Column 2 │ │ Column 3 │         │  │
│   │ │ [empty]  │ │ Card     │ │ Card     │         │  │
│   │ │          │ │ Card     │ │ Card     │         │  │
│   │ └──────────┘ └──────────┘ └──────────┘         │  │
│   └─────────────────────────────────────────────────┘  │
│                                                         │
│        ┌──────────────────┐  ← DragOverlay             │
│        │ Dragging Card    │    (viewport-relative,     │
│        │ (follows cursor) │     z-index: 999)          │
│        └──────────────────┘                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Implementation

```tsx
import {DndContext, DragOverlay} from '@dnd-kit/core';
import {restrictToWindowEdges} from '@dnd-kit/modifiers';

function OpportunityKanban() {
  const [activeId, setActiveId] = useState(null);

  return (
    <DndContext
      onDragStart={({active}) => setActiveId(active.id)}
      onDragEnd={() => setActiveId(null)}
      onDragCancel={() => setActiveId(null)}
      autoScroll={true}  // Enable auto-scroll
    >
      {/* Scrollable board container */}
      <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden p-3">
        {columns.map(column => (
          <Column key={column.id} column={column} />
        ))}
      </div>

      {/* Overlay renders at viewport level, not inside scroll containers */}
      <DragOverlay modifiers={[restrictToWindowEdges]}>
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
```

---

## Auto-Scroll Configuration

### DndContext autoScroll Prop

```tsx
<DndContext
  autoScroll={true}  // Enable/disable globally
>
```

### Per-Sensor Configuration

Disable auto-scroll for keyboard sensor (scrolls manually via arrow keys):

```tsx
const keyboardSensor = useSensor(KeyboardSensor, {
  // Keyboard sensor has autoScrollEnabled: false by default
  coordinateGetter: sortableKeyboardCoordinates,
});
```

### Scroll Behavior for Keyboard

```tsx
const keyboardSensor = useSensor(KeyboardSensor, {
  scrollBehavior: 'smooth', // or 'auto' for instant
});
```

---

## Touch Action for Mobile

On touch devices, the browser may interpret drag gestures as scroll gestures. Use `touch-action: none` on drag handles:

```tsx
function DragHandle({listeners, attributes, setActivatorNodeRef}) {
  return (
    <button
      ref={setActivatorNodeRef}
      {...listeners}
      {...attributes}
      className="touch-action-none cursor-grab active:cursor-grabbing"
      // Or use inline style:
      // style={{touchAction: 'none'}}
    >
      <GripVertical className="w-4 h-4" />
    </button>
  );
}
```

**Important:** Apply `touch-action: none` **only to the drag handle**, not the entire card. This allows:
- Card content to remain scrollable
- Links and buttons to work normally
- Only the handle to trigger drag

### Tailwind CSS

Add to your global CSS:

```css
.touch-action-none {
  touch-action: none;
}
```

Or use Tailwind's `touch-none` utility (Tailwind v3+):

```tsx
<button className="touch-none cursor-grab ...">
```

---

## Comparison: @hello-pangea/dnd vs @dnd-kit

### Auto-Scroll Behavior

| Aspect | @hello-pangea/dnd | @dnd-kit |
|--------|-------------------|----------|
| Edge detection | Percentage-based | Configurable |
| iOS webkit | Shake bug (unfixable) | No issues |
| Nested containers | Complex detection | Simple (viewport-relative) |
| Manual scroll | Supported | Supported |
| Configuration | `autoScrollerOptions` prop | `autoScroll` boolean |

### Scroll Container Clipping

| Aspect | @hello-pangea/dnd | @dnd-kit |
|--------|-------------------|----------|
| Clipping | Cards clip at container edge | No clipping with DragOverlay |
| Stacking context | Can interfere | Overlay bypasses |
| Cross-container | Janky transitions | Smooth |

---

## Handling Column Scroll

Each column has vertical scroll for its cards:

```tsx
function Column({column}) {
  const {setNodeRef, isOver} = useDroppable({id: column.id});

  return (
    <div
      ref={setNodeRef}
      className="w-72 shrink-0"
    >
      <ColumnHeader stage={column.id} />

      <SortableContext
        items={column.items.map(i => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {/* Scrollable card container */}
        <div className="h-full max-h-full overflow-y-auto overflow-x-hidden">
          {column.items.map(item => (
            <SortableOpportunityCard key={item.id} opportunity={item} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
```

When dragging near the top or bottom of a column, @dnd-kit will auto-scroll the column to reveal more cards.

---

## Handling Board Horizontal Scroll

The board container scrolls horizontally to show more columns:

```tsx
<div className="flex min-h-0 flex-1 gap-3 overflow-x-auto overflow-y-hidden p-3">
  {columns.map(column => (
    <Column key={column.id} column={column} />
  ))}
</div>
```

When dragging a card near the left or right edge of the board, @dnd-kit will auto-scroll horizontally to reveal more columns.

---

## DragOverlay Modifiers

### restrictToWindowEdges

Prevents the drag preview from going outside the window:

```tsx
import {restrictToWindowEdges} from '@dnd-kit/modifiers';

<DragOverlay modifiers={[restrictToWindowEdges]}>
  {activeCard}
</DragOverlay>
```

### restrictToFirstScrollableAncestor

Keeps the drag preview within the first scrollable parent:

```tsx
import {restrictToFirstScrollableAncestor} from '@dnd-kit/modifiers';

<DragOverlay modifiers={[restrictToFirstScrollableAncestor]}>
  {activeCard}
</DragOverlay>
```

For our Kanban, `restrictToWindowEdges` is preferred since we want to drag across the entire board.

---

## Migration Checklist for Scroll

- [ ] Replace inline-transform pattern with DragOverlay
- [ ] Add `touch-action: none` to drag handles
- [ ] Remove any scroll-related workarounds from current code
- [ ] Test horizontal board scroll during drag
- [ ] Test vertical column scroll during drag
- [ ] Test on iOS Safari (previously had shake bug)
- [ ] Test on iPad (our target tablet device)

---

## Sources

- [DragOverlay Documentation](https://docs.dndkit.com/api-documentation/draggable/drag-overlay)
- [@hello-pangea/dnd Auto-scrolling](https://github.com/hello-pangea/dnd/blob/main/docs/guides/auto-scrolling.md)
- [Pointer Sensor - Touch Action](https://docs.dndkit.com/api-documentation/sensors/pointer)
