# @dnd-kit Core API Reference

> **Purpose:** Detailed API documentation for `@dnd-kit/core` - the foundation of all drag-and-drop functionality.

---

## Installation

```bash
npm install @dnd-kit/core
```

---

## DndContext

The `DndContext` provider wraps your drag-and-drop interface and shares data between draggable and droppable components.

### Basic Setup

```tsx
import {DndContext} from '@dnd-kit/core';

function App() {
  return (
    <DndContext>
      {/* Draggable and droppable components */}
    </DndContext>
  );
}
```

### Props

```typescript
interface DndContextProps {
  // Event handlers
  onDragStart?(event: DragStartEvent): void;
  onDragMove?(event: DragMoveEvent): void;
  onDragOver?(event: DragOverEvent): void;
  onDragEnd?(event: DragEndEvent): void;
  onDragCancel?(event: DragCancelEvent): void;

  // Configuration
  sensors?: SensorDescriptor<any>[];
  collisionDetection?: CollisionDetection;
  modifiers?: Modifiers;
  autoScroll?: boolean;

  // Accessibility
  announcements?: Announcements;
  screenReaderInstructions?: ScreenReaderInstructions;

  // Advanced
  layoutMeasuring?: Partial<LayoutMeasuring>;
  cancelDrop?: CancelDrop;
}
```

### Event Handlers

#### onDragStart
Fires when a drag operation begins (activation constraints met).

```tsx
function handleDragStart(event: DragStartEvent) {
  const {active} = event;
  console.log('Started dragging:', active.id);
  setActiveId(active.id);
}
```

#### onDragOver
Fires when a draggable moves over a droppable container.

```tsx
function handleDragOver(event: DragOverEvent) {
  const {active, over} = event;
  if (over) {
    console.log(`${active.id} is over ${over.id}`);
  }
}
```

#### onDragEnd
Fires when the drag operation completes (item dropped).

```tsx
function handleDragEnd(event: DragEndEvent) {
  const {active, over} = event;

  if (!over) {
    // Dropped outside any droppable
    return;
  }

  if (active.id !== over.id) {
    // Move item from active.id position to over.id position
    moveItem(active.id, over.id);
  }

  setActiveId(null);
}
```

#### onDragCancel
Fires when drag is cancelled (e.g., pressing Escape).

```tsx
function handleDragCancel() {
  setActiveId(null);
}
```

---

## useDraggable Hook

Makes an element draggable.

### Usage

```tsx
import {useDraggable} from '@dnd-kit/core';

function DraggableItem({id}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({id});

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      Drag me
    </div>
  );
}
```

### Arguments

```typescript
interface UseDraggableArguments {
  id: UniqueIdentifier;      // Required unique ID
  disabled?: boolean;         // Disable dragging
  data?: Record<string, any>; // Custom data attached to draggable
  attributes?: {
    role?: string;
    roleDescription?: string;
    tabIndex?: number;
  };
}
```

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `setNodeRef` | `(node: HTMLElement) => void` | Ref callback for the draggable element |
| `listeners` | `SyntheticListeners` | Event handlers to attach to draggable |
| `attributes` | `DraggableAttributes` | ARIA attributes for accessibility |
| `transform` | `Transform \| null` | Current position offset during drag |
| `isDragging` | `boolean` | Whether this item is being dragged |
| `node` | `HTMLElement \| null` | The DOM node |
| `over` | `{id: UniqueIdentifier} \| null` | What droppable the item is over |

### Drag Handle Pattern

To use a separate drag handle (like our GripVertical icon):

```tsx
function DraggableItem({id}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
  } = useDraggable({id});

  return (
    <div ref={setNodeRef}>
      {/* Only the handle triggers drag */}
      <button
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        className="drag-handle"
      >
        <GripVertical />
      </button>
      <span>Content that doesn't trigger drag</span>
    </div>
  );
}
```

---

## useDroppable Hook

Makes an element a drop target.

### Usage

```tsx
import {useDroppable} from '@dnd-kit/core';

function DroppableArea({id, children}) {
  const {isOver, setNodeRef} = useDroppable({id});

  return (
    <div
      ref={setNodeRef}
      className={isOver ? 'bg-accent' : ''}
    >
      {children}
    </div>
  );
}
```

### Arguments

```typescript
interface UseDroppableArguments {
  id: UniqueIdentifier;       // Required unique ID
  disabled?: boolean;          // Disable dropping
  data?: Record<string, any>;  // Custom data attached to droppable
}
```

### Return Values

| Property | Type | Description |
|----------|------|-------------|
| `setNodeRef` | `(node: HTMLElement) => void` | Ref callback for the droppable element |
| `isOver` | `boolean` | Whether a draggable is currently over this droppable |
| `active` | `{id: UniqueIdentifier} \| null` | The currently dragged item |
| `over` | `{id: UniqueIdentifier} \| null` | What droppable the dragged item is over |
| `node` | `HTMLElement \| null` | The DOM node |
| `rect` | `ClientRect \| null` | Bounding rectangle |

---

## DragOverlay

Renders a drag preview outside the normal document flow, positioned relative to the viewport.

### Why Use DragOverlay?

1. **Scroll containers** - Prevents clipping by `overflow: hidden`
2. **Virtualized lists** - Original item may unmount during scroll
3. **Cross-container drag** - Smooth transitions between containers
4. **Custom previews** - Show different content while dragging

### Usage

```tsx
import {DndContext, DragOverlay} from '@dnd-kit/core';

function App() {
  const [activeId, setActiveId] = useState(null);

  return (
    <DndContext
      onDragStart={({active}) => setActiveId(active.id)}
      onDragEnd={() => setActiveId(null)}
    >
      {items.map(item => (
        <DraggableItem key={item.id} item={item} />
      ))}

      {/* Render overlay - must stay mounted */}
      <DragOverlay>
        {activeId ? (
          <ItemPreview item={findItem(activeId)} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
```

### Props

```typescript
interface DragOverlayProps {
  adjustScale?: boolean;       // Scale to match original size
  dropAnimation?: DropAnimation | null;  // Animation config
  modifiers?: Modifiers;       // Movement constraints
  className?: string;          // CSS class for wrapper
  style?: CSSProperties;       // Inline styles
  wrapperElement?: keyof JSX.IntrinsicElements; // Default: 'div'
  zIndex?: number;             // Default: 999
  transition?: string;         // CSS transition property
}
```

### Drop Animation

Configure the animation when item is dropped:

```tsx
<DragOverlay
  dropAnimation={{
    duration: 250,
    easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
  }}
>
```

Disable animation:

```tsx
<DragOverlay dropAnimation={null}>
```

### With Modifiers

Restrict movement to window edges:

```tsx
import {restrictToWindowEdges} from '@dnd-kit/modifiers';

<DragOverlay modifiers={[restrictToWindowEdges]}>
```

---

## CSS Utilities

### Transform Helper

```tsx
import {CSS} from '@dnd-kit/utilities';

// In your component
const style = {
  transform: CSS.Transform.toString(transform),
  transition,
};
```

The `CSS.Transform.toString()` function converts a transform object to a CSS transform string:

```tsx
// Input
{x: 10, y: 20, scaleX: 1, scaleY: 1}

// Output
'translate3d(10px, 20px, 0) scaleX(1) scaleY(1)'
```

---

## Complete Example

```tsx
import {DndContext, DragOverlay, useDraggable, useDroppable} from '@dnd-kit/core';
import {CSS} from '@dnd-kit/utilities';
import {useState} from 'react';

function App() {
  const [items, setItems] = useState(['A', 'B', 'C']);
  const [activeId, setActiveId] = useState(null);

  return (
    <DndContext
      onDragStart={({active}) => setActiveId(active.id)}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <DroppableContainer id="container">
        {items.map(item => (
          <DraggableItem key={item} id={item} />
        ))}
      </DroppableContainer>

      <DragOverlay>
        {activeId ? <ItemPreview id={activeId} /> : null}
      </DragOverlay>
    </DndContext>
  );

  function handleDragEnd({active, over}) {
    setActiveId(null);
    if (over && active.id !== over.id) {
      // Reorder logic
    }
  }
}
```

---

## Sources

- [Getting Started Guide](https://docs.dndkit.com/introduction/getting-started)
- [DndContext Documentation](https://docs.dndkit.com/api-documentation/context-provider)
- [useDraggable Documentation](https://docs.dndkit.com/api-documentation/draggable)
- [useDroppable Documentation](https://docs.dndkit.com/api-documentation/droppable)
- [DragOverlay Documentation](https://docs.dndkit.com/api-documentation/draggable/drag-overlay)
