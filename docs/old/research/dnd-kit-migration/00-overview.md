# @dnd-kit Migration Overview

> **Purpose:** This document explains why we're migrating from `@hello-pangea/dnd` to `@dnd-kit` and provides an architectural overview of the new library.

---

## Why Migrate?

### Current Pain Points with @hello-pangea/dnd

1. **Scroll Container Issues**
   - Scroll containers break during drag operations
   - Auto-scroll has a known iOS webkit shake bug
   - Complex scroll container detection logic can trap draggables

2. **Performance with Many Cards**
   - Performance degrades as opportunity count grows
   - DOM mutations during drag cause repaints

3. **Limited Customization**
   - Fixed sensor implementation
   - Limited animation control
   - No custom collision detection

### Why @dnd-kit?

| Feature | @hello-pangea/dnd | @dnd-kit |
|---------|-------------------|----------|
| React Version | React 16-18 | React 18+ (we use 19) |
| Architecture | Monolithic | Modular (import only what you need) |
| Scroll Handling | Problematic | Viewport-relative via DragOverlay |
| Sensors | Fixed | Extensible (pointer, keyboard, touch, custom) |
| Collision Detection | Fixed | Pluggable algorithms |
| Animations | Limited | Full control via CSS transitions |
| Touch Support | Basic | Superior with proper `touch-action` |

---

## @dnd-kit Package Structure

```
@dnd-kit/core      - Core functionality
├── DndContext     - Provider wrapping drag/drop area
├── useDraggable   - Hook for draggable elements
├── useDroppable   - Hook for drop targets
└── DragOverlay    - Viewport-relative drag preview

@dnd-kit/sortable  - Sortable lists preset
├── SortableContext - Provider for sortable items
├── useSortable     - Combined draggable + droppable hook
└── Strategies      - Sorting algorithms

@dnd-kit/modifiers - Movement constraints
├── restrictToWindowEdges
├── restrictToVerticalAxis
├── restrictToHorizontalAxis
└── snapToGrid

@dnd-kit/utilities - Helper functions
└── CSS.Transform   - Transform string conversion
```

---

## Key Architectural Differences

### 1. Hooks vs. Components

**@hello-pangea/dnd (components with render props):**
```tsx
<Draggable draggableId="item-1" index={0}>
  {(provided, snapshot) => (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
    >
      Content
    </div>
  )}
</Draggable>
```

**@dnd-kit (hooks):**
```tsx
function DraggableItem({id}) {
  const {attributes, listeners, setNodeRef, transform} = useDraggable({id});

  return (
    <div ref={setNodeRef} {...attributes} {...listeners}>
      Content
    </div>
  );
}
```

### 2. CSS Transforms vs. DOM Reordering

@dnd-kit uses CSS `translate3d` to move items during drag, avoiding DOM mutations. This results in:
- No repaints during drag
- Smoother animations
- Better performance with many items

### 3. DragOverlay for Scroll Containers

The `DragOverlay` component renders a drag preview **outside** the scroll container hierarchy, positioned relative to the viewport. This solves our scroll container clipping issues.

### 4. Extensible Sensors

Unlike @hello-pangea/dnd's fixed sensor implementation, @dnd-kit allows:
- Custom activation constraints (distance, delay, tolerance)
- Mix of pointer, keyboard, and touch sensors
- Custom sensors for specialized input methods

---

## What We're NOT Getting

@dnd-kit intentionally avoids the HTML5 Drag and Drop API, which means:

- **Cannot drag files from desktop** - Not needed for our Kanban
- **Cannot drag between browser windows** - Not needed for our Kanban

These tradeoffs are acceptable for our use case.

---

## Files to Migrate

| Current File | Purpose |
|--------------|---------|
| `OpportunityListContent.tsx` | DragDropContext → DndContext |
| `OpportunityColumn.tsx` | Droppable → useDroppable + SortableContext |
| `OpportunityCard.tsx` | Draggable → useSortable |

---

## Related Documentation

- [01-core-api.md](./01-core-api.md) - DndContext, useDraggable, useDroppable
- [02-sortable-kanban.md](./02-sortable-kanban.md) - Multi-column Kanban patterns
- [03-scroll-handling.md](./03-scroll-handling.md) - Scroll container solutions
- [04-performance.md](./04-performance.md) - Collision detection & optimization
- [05-migration-guide.md](./05-migration-guide.md) - Step-by-step migration
- [06-accessibility.md](./06-accessibility.md) - ARIA & keyboard navigation

---

## Sources

- [dnd-kit Official Documentation](https://docs.dndkit.com/)
- [dnd-kit GitHub Repository](https://github.com/clauderic/dnd-kit)
- [dnd-kit Key Concepts](https://github.com/clauderic/dnd-kit/blob/master/README.md#key-concepts)
