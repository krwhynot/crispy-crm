# @dnd-kit Performance Optimization

> **Purpose:** Document collision detection algorithms, performance strategies, and optimization patterns for large Kanban boards.

---

## Why @dnd-kit is Faster

### 1. CSS Transforms (No Repaints)

@dnd-kit uses `translate3d` and `scale` to move items during drag:

```tsx
const style = {
  transform: CSS.Transform.toString(transform),
  // Results in: 'translate3d(10px, 20px, 0)'
};
```

**Benefits:**
- Hardware-accelerated via GPU
- No layout recalculation (no reflow)
- No repaint during drag movement
- Items stay in their DOM positions

**vs @hello-pangea/dnd:**
- Also uses transforms, but with more complex calculations
- Placeholder insertion can cause reflow

### 2. Lazy Measurement

@dnd-kit only measures element positions when drag starts:

```tsx
// Positions calculated once at drag start
onDragStart() {
  // All droppable rects cached
}

// During drag, only pointer position updates
onDragMove() {
  // Compare pointer to cached rects
}
```

### 3. Synthetic Event Listeners

Instead of attaching event listeners to every draggable element, @dnd-kit uses React's synthetic event system:

```tsx
// Single event listener per sensor type
// NOT one listener per draggable
```

This scales better with many items (our Kanban can have 50+ opportunities).

---

## Collision Detection Algorithms

Choose the right algorithm for your layout:

### rectIntersection (Default)

Collision when rectangles physically overlap.

```tsx
import {rectIntersection} from '@dnd-kit/core';

<DndContext collisionDetection={rectIntersection}>
```

**Pros:** Most precise
**Cons:** Requires actual overlap - can feel unforgiving

### closestCenter

Finds the droppable whose center is closest to the dragged item's center.

```tsx
import {closestCenter} from '@dnd-kit/core';

<DndContext collisionDetection={closestCenter}>
```

**Pros:** More forgiving, good for sortable lists
**Cons:** May not work well with nested containers

### closestCorners ✅ Recommended for Kanban

Measures distances between all four corners of the draggable and droppable elements.

```tsx
import {closestCorners} from '@dnd-kit/core';

<DndContext collisionDetection={closestCorners}>
```

**Why it's best for our Kanban:**
- Works well with stacked column layouts
- Prevents accidental targeting of parent containers
- Good balance of precision and forgiveness

### pointerWithin

Collision only when the pointer is inside the droppable.

```tsx
import {pointerWithin} from '@dnd-kit/core';

<DndContext collisionDetection={pointerWithin}>
```

**Pros:** High precision
**Cons:** Pointer-only (not keyboard-compatible)

### Custom Collision Detection

Combine algorithms for specific needs:

```tsx
function customCollision(args) {
  // Try pointerWithin first for precision
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }

  // Fall back to closestCorners for keyboard/touch
  return closestCorners(args);
}

<DndContext collisionDetection={customCollision}>
```

---

## Layout Measuring Strategies

Control when @dnd-kit measures element positions:

```tsx
import {MeasuringStrategy} from '@dnd-kit/core';

<DndContext
  layoutMeasuring={{
    strategy: MeasuringStrategy.BeforeDragging,
  }}
>
```

### Strategies

| Strategy | When Measured | Use Case |
|----------|---------------|----------|
| `WhileDragging` | After drag starts (default) | Most cases |
| `BeforeDragging` | Before and after | Layout may change before drag |
| `Always` | Before, during, after | Animations that resize elements |

For our Kanban, the default `WhileDragging` is optimal.

---

## React.memo Optimization

Our current `OpportunityColumn` already uses `React.memo` with custom comparison:

```tsx
// Current pattern - works well with @dnd-kit
const OpportunityColumn = React.memo(
  function OpportunityColumn(props) {
    // Component
  },
  arePropsEqual
);

function arePropsEqual(prevProps, nextProps) {
  // Deep comparison to prevent re-renders during drag
  if (prevProps.stage !== nextProps.stage) return false;
  if (prevProps.opportunities.length !== nextProps.opportunities.length) return false;
  // ... more checks
  return true;
}
```

**Why this matters:**
- During drag, only the dragged item and hovered column should update
- Other columns should not re-render
- @dnd-kit's transform-based approach makes this easier

---

## Virtualization Compatibility

@dnd-kit works with virtualized lists (react-window, react-virtuoso):

### Using `verticalListSortingStrategy`

```tsx
import {verticalListSortingStrategy} from '@dnd-kit/sortable';

// This strategy supports virtualization
<SortableContext
  items={items.map(i => i.id)}
  strategy={verticalListSortingStrategy}
>
```

### DragOverlay is Required

With virtualization, the original dragged item may unmount during scroll. DragOverlay ensures the drag preview stays visible:

```tsx
<DragOverlay>
  {activeId ? <CardPreview id={activeId} /> : null}
</DragOverlay>
```

### Future Consideration

If we need virtualization for columns with many opportunities:

```tsx
import {Virtuoso} from 'react-virtuoso';

function VirtualizedColumn({opportunities}) {
  return (
    <SortableContext
      items={opportunities.map(o => o.id)}
      strategy={verticalListSortingStrategy}
    >
      <Virtuoso
        data={opportunities}
        itemContent={(index, opportunity) => (
          <SortableOpportunityCard
            key={opportunity.id}
            opportunity={opportunity}
          />
        )}
      />
    </SortableContext>
  );
}
```

---

## Animation Performance

### Default Transition

```tsx
const {transform, transition} = useSortable({id});

// Default: 250ms ease
const style = {
  transform: CSS.Transform.toString(transform),
  transition, // Includes timing from useSortable
};
```

### Custom Timing

```tsx
const {transform, transition} = useSortable({
  id,
  transition: {
    duration: 150, // Faster for snappier feel
    easing: 'ease-out',
  },
});
```

### Disable Transitions

For maximum performance (no animation):

```tsx
const {transform} = useSortable({
  id,
  transition: null,
});

const style = {
  transform: CSS.Transform.toString(transform),
  // No transition property
};
```

---

## Performance Checklist

- [ ] Use `closestCorners` collision detection for Kanban
- [ ] Keep React.memo pattern on `OpportunityColumn`
- [ ] Use `verticalListSortingStrategy` for columns
- [ ] Implement DragOverlay for smooth cross-column drag
- [ ] Add `touch-action: none` only to drag handles
- [ ] Consider 150ms transition for snappier feel
- [ ] Test with 50+ opportunities across columns

---

## Benchmarks

Based on @dnd-kit documentation claims:

| Metric | @hello-pangea/dnd | @dnd-kit |
|--------|-------------------|----------|
| Event listeners | Per draggable | Per sensor |
| DOM mutations during drag | Placeholder insertion | None (CSS only) |
| Layout recalculation | On every move | Once at start |
| Bundle size (@dnd-kit/core) | ~40KB | ~12KB |
| Virtualization | Limited | Full support |

**Note:** Actual benchmarks depend on implementation. Test with real data.

---

## Sources

- [dnd-kit Performance](https://github.com/clauderic/dnd-kit/blob/master/README.md#performance)
- [Collision Detection Algorithms](https://docs.dndkit.com/api-documentation/context-provider/collision-detection-algorithms)
- [Sortable Strategies](https://docs.dndkit.com/presets/sortable/sortable-context#strategy)
