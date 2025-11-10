# Drag-and-Drop Library Evaluation Spike

**Date:** November 3, 2024
**Spike ID:** P3-E2-S0-T1
**Confidence Before:** 65%
**Confidence After:** 85%
**Time Spent:** 3 hours

## Executive Summary

After comprehensive evaluation of drag-drop libraries for the Kanban board implementation, we recommend **dnd-kit** as the primary choice. It provides the best balance of modern architecture, accessibility, touch support, and performance for managing 100+ opportunity cards in a trade show environment.

## Requirements Analysis

### Critical Requirements
- **Performance:** Handle 100+ opportunity cards smoothly at 60fps
- **Touch/iPad Support:** Primary use case for trade shows
- **Accessibility:** Full keyboard navigation support
- **React 18 Compatibility:** Must work with StrictMode
- **Maintainability:** Active development and community support

### Use Case Context
Salespeople at trade shows need to quickly move opportunities between pipeline stages (new_lead, qualified, proposal, negotiation, closed) on iPads while managing 20-50 prospects.

## Library Evaluation Matrix

| Library | Bundle Size | React 18 | Touch | A11y | Virtual | Maintenance | Score |
|---------|------------|----------|-------|------|---------|-------------|-------|
| **dnd-kit** | 30KB | ✅ Native | ✅ Excellent | ✅ Built-in | ✅ Ready | ✅ Active | **95/100** |
| @hello-pangea/dnd | 36KB | ✅ Fork fix | ✅ Good | ✅ Good | ❌ No | ⚠️ Community | 75/100 |
| @atlaskit/pragmatic | 12KB | ✅ Native | ✅ Excellent | ✅ Manual | ✅ Custom | ✅ Atlassian | 85/100 |
| react-beautiful-dnd | 35KB | ❌ Issues | ✅ Good | ✅ Good | ❌ No | ❌ Unmaintained | 45/100 |
| react-sortable-hoc | 27KB | ⚠️ Legacy | ⚠️ Basic | ⚠️ Basic | ❌ No | ❌ Deprecated | 25/100 |

## Detailed Analysis

### 1. dnd-kit (✅ Recommended)

**Architecture Advantages:**
- **Headless Core:** Decoupled sensors, collision detection, and modifiers provide fine-grained control
- **Touch Optimization:** PointerSensor with configurable activation constraints prevents accidental drags
- **Performance:** CSS transforms minimize re-renders, React.memo compatible
- **Virtualization:** Designed to integrate with @tanstack/react-virtual for future scaling

**Implementation Complexity:** 4-6 hours
**Risk Level:** Low

**Key Implementation Pattern:**
```typescript
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

const KanbanBoard = () => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Prevents accidental drags on touch
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      {/* Kanban columns and cards */}
    </DndContext>
  );
};
```

### 2. @hello-pangea/dnd (Backup Option)

**When to Consider:**
- Team familiar with react-beautiful-dnd API
- Simpler implementation needs (3-4 hours)
- Don't need virtualization

**Pros:**
- Drop-in replacement for react-beautiful-dnd
- Fixes React 18 StrictMode issues
- Well-documented API

**Cons:**
- Community maintained (medium risk)
- No virtualization support
- Less flexible than dnd-kit

### 3. @atlaskit/pragmatic-drag-and-drop (Performance Option)

**When to Consider:**
- Need to handle 500+ cards
- Require custom drag behaviors (delete zones, shape morphing)
- Bundle size is critical (12KB core)

**Pros:**
- Exceptional performance with granular primitives
- Tiny bundle size
- Atlassian backing

**Cons:**
- Higher implementation complexity (6-8 hours)
- More boilerplate for standard Kanban
- Steeper learning curve

## Implementation Strategy

### Component Architecture

```typescript
// 1. KanbanBoard - Container with DndContext and state management
const KanbanBoard = ({ opportunities }) => {
  const [columns, setColumns] = useState(groupByStage(opportunities));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    // Optimistic update logic
    // API call with error recovery
  };

  return <DndContext>...</DndContext>;
};

// 2. Column - Droppable area with useDroppable
const Column = ({ id, title, cards }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div ref={setNodeRef}>
      <SortableContext items={cards}>
        {cards.map(card => <Card key={card.id} {...card} />)}
      </SortableContext>
    </div>
  );
};

// 3. Card - Draggable item with useSortable + React.memo
const Card = React.memo(({ id, opportunity }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* Card content */}
    </div>
  );
});
```

### Critical Implementation Considerations

#### 1. State Management Pattern
```typescript
// Normalized state for efficient updates
interface KanbanState {
  columns: Record<string, string[]>; // columnId -> cardIds
  cards: Record<string, OpportunityCard>; // cardId -> card data
}

// Optimistic updates with rollback
const handleDragEnd = async (event) => {
  const optimisticState = computeNewState(event);
  setKanbanState(optimisticState);

  try {
    await api.updateOpportunityStage(event.active.id, event.over.id);
  } catch (error) {
    // Rollback on failure
    setKanbanState(previousState);
    notify.error('Failed to update opportunity stage');
  }
};
```

#### 2. Performance Optimizations
- Wrap Card components in `React.memo`
- Use CSS transforms for animations (GPU accelerated)
- Implement virtualization if cards exceed 200
- Debounce auto-scroll for long lists

#### 3. Accessibility Patterns
```typescript
// Custom keyboard navigation between columns
const keyboardSensor = useSensor(KeyboardSensor, {
  coordinateGetter: (event, { active, over, droppableContainers }) => {
    if (event.code === 'Space') {
      // Start drag
    } else if (event.ctrlKey && event.code === 'ArrowRight') {
      // Move to next column
    }
    return sortableKeyboardCoordinates(event);
  }
});
```

#### 4. Touch/iPad Optimizations
- Configure activation distance to prevent scroll conflicts
- Add visual feedback for touch-and-hold
- Implement haptic feedback if available
- Ensure touch targets are ≥44px

## Migration Path

### Phase 1: Basic Implementation (4 hours)
1. Install dnd-kit packages
2. Implement basic drag between columns
3. Add optimistic updates
4. Test with 20 cards

### Phase 2: Polish (2 hours)
1. Add keyboard navigation
2. Implement auto-scroll
3. Add loading states
4. Error handling

### Phase 3: Performance (if needed)
1. Add React.memo optimization
2. Implement virtualization for 200+ cards
3. Add performance monitoring

## Testing Strategy

```typescript
describe('KanbanBoard', () => {
  it('moves card between columns', async () => {
    const { getByTestId } = render(<KanbanBoard />);
    const card = getByTestId('card-1');
    const targetColumn = getByTestId('column-qualified');

    // Simulate drag and drop
    fireEvent.dragStart(card);
    fireEvent.dragEnter(targetColumn);
    fireEvent.drop(targetColumn);
    fireEvent.dragEnd(card);

    expect(card).toBeInColumn('qualified');
  });

  it('handles keyboard navigation', async () => {
    const { getByTestId } = render(<KanbanBoard />);
    const card = getByTestId('card-1');

    fireEvent.keyDown(card, { code: 'Space' });
    fireEvent.keyDown(card, { code: 'ArrowRight', ctrlKey: true });
    fireEvent.keyDown(card, { code: 'Space' });

    expect(card).toBeInColumn('qualified');
  });

  it('reverts on API failure', async () => {
    jest.spyOn(api, 'updateOpportunityStage').mockRejectedValue(new Error());

    // Perform drag
    // Verify card returns to original position
    // Verify error notification shown
  });
});
```

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance degradation at scale | High | Pre-emptive virtualization setup |
| Touch conflicts with scrolling | Medium | Configure activation constraints |
| Complex state updates | Medium | Use normalized state pattern |
| API failures during drag | Low | Implement rollback mechanism |

## Recommendations

1. **Use dnd-kit** - Best overall solution for our requirements
2. **Start with sortable preset** - Provides 80% of functionality out-of-box
3. **Implement React.memo early** - Prevents performance issues
4. **Configure touch sensors** - 5px activation distance for iPad
5. **Plan for virtualization** - Architecture supports future scaling

## Conclusion

**Confidence increases from 65% to 85%** because:
- ✅ Clear library recommendation with strong justification
- ✅ Detailed implementation patterns provided
- ✅ Performance strategy defined for 100+ cards
- ✅ Touch/iPad requirements specifically addressed
- ✅ Comprehensive testing approach outlined

The remaining 15% uncertainty relates to:
- Exact performance characteristics with real data
- User feedback on touch sensitivity settings
- Integration complexity with existing React Admin patterns

## Next Steps

1. Update task P3-E2-S1-T2 estimate to 4 hours (was 4 hours, confirming)
2. Create POC with 10 cards to validate approach
3. Test on actual iPad device for touch sensitivity
4. Implement full Kanban board following patterns above