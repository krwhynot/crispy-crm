# @dnd-kit Accessibility

> **Purpose:** Document accessibility features, ARIA attributes, keyboard navigation, and screen reader support for WCAG 2.1 AA compliance.

---

## Built-in Accessibility Features

@dnd-kit provides sensible accessibility defaults out of the box:

### Automatic ARIA Attributes

The `useDraggable` and `useSortable` hooks provide these attributes:

| Attribute | Default Value | Purpose |
|-----------|---------------|---------|
| `role` | `"button"` | Declares the element's purpose |
| `aria-roledescription` | `"draggable"` | Human-readable role description |
| `aria-describedby` | `"DndContext-[id]"` | Links to off-screen instructions |
| `tabindex` | `0` | Makes element focusable |

### Default Screen Reader Instructions

@dnd-kit renders off-screen instructions that screen readers announce:

> "To pick up a draggable item, press space or enter. While dragging, use the arrow keys to move the item in any given direction. Press space or enter again to drop the item in its new position, or press escape to cancel."

---

## Keyboard Navigation

### Default Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Navigate between draggable items |
| `Enter` / `Space` | Pick up or drop item |
| `Arrow Keys` | Move item (25px by default) |
| `Escape` | Cancel drag operation |

### Sortable Keyboard Coordinates

For sortable lists, use the optimized coordinate getter:

```tsx
import {KeyboardSensor, useSensor} from '@dnd-kit/core';
import {sortableKeyboardCoordinates} from '@dnd-kit/sortable';

const keyboardSensor = useSensor(KeyboardSensor, {
  coordinateGetter: sortableKeyboardCoordinates,
});
```

This moves items to the next/previous position in the list instead of moving by pixels.

### Custom Keyboard Codes

Modify activation keys (not recommended - breaks ARIA guidelines):

```tsx
const keyboardSensor = useSensor(KeyboardSensor, {
  keyboardCodes: {
    start: ['Space', 'Enter'],
    cancel: ['Escape'],
    end: ['Space', 'Enter'],
  },
});
```

---

## Screen Reader Announcements

### Live Region

@dnd-kit renders an off-screen `aria-live` region that announces drag events in real-time.

### Custom Announcements

Customize announcements to match our Opportunities Kanban context:

```tsx
const announcements = {
  onDragStart({active}) {
    const opportunity = findOpportunity(active.id);
    const stage = getStageLabel(opportunity.stage);
    const position = getPositionInStage(opportunity);
    const count = getStageCount(opportunity.stage);

    return `Picked up ${opportunity.name}. Opportunity is in ${stage} stage, position ${position} of ${count}.`;
  },

  onDragOver({active, over}) {
    if (over) {
      const opportunity = findOpportunity(active.id);
      const newStage = getStageLabel(over.id);
      const position = getPositionInStage(over.id);
      const count = getStageCount(over.id);

      return `${opportunity.name} was moved to ${newStage} stage, position ${position} of ${count}.`;
    }

    return `${findOpportunity(active.id).name} is no longer over a droppable area.`;
  },

  onDragEnd({active, over}) {
    if (over) {
      const opportunity = findOpportunity(active.id);
      const stage = getStageLabel(over.id);

      return `${opportunity.name} was dropped in ${stage} stage.`;
    }

    return `Drag operation was cancelled.`;
  },

  onDragCancel({active}) {
    return `Dragging was cancelled. ${findOpportunity(active.id).name} was dropped.`;
  },
};

// Apply to DndContext
<DndContext
  accessibility={{
    announcements,
  }}
>
```

### Best Practice: Position Over Index

Use human-readable positions (1, 2, 3...) instead of array indices (0, 1, 2...):

```tsx
function getPositionInStage(opportunityId) {
  const stage = findStageByOpportunityId(opportunityId);
  const index = stage.opportunities.findIndex(o => o.id === opportunityId);
  return index + 1; // Human-readable position
}
```

### Localization

@dnd-kit only provides English defaults. For other languages, provide translated announcements:

```tsx
const spanishAnnouncements = {
  onDragStart({active}) {
    return `Recogido ${getName(active.id)}.`;
  },
  // ... other translations
};
```

---

## Custom Screen Reader Instructions

Replace the default instructions with context-specific guidance:

```tsx
<DndContext
  accessibility={{
    screenReaderInstructions: {
      draggable: `
        To pick up an opportunity, press space or enter.
        While dragging, use the arrow keys to move between pipeline stages.
        Press space or enter again to drop the opportunity in its new stage,
        or press escape to cancel.
      `,
    },
  }}
>
```

---

## Focus Management

### Focusable Elements

The `useDraggable` and `useSortable` hooks automatically set `tabindex="0"` on non-interactive elements.

### Focus Ring

Ensure visible focus indicators on drag handles:

```tsx
<button
  ref={setActivatorNodeRef}
  {...listeners}
  {...attributes}
  className="
    min-h-[44px] min-w-[44px]
    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-primary
    focus-visible:ring-offset-2
  "
>
  <GripVertical className="w-4 h-4" />
</button>
```

### Touch Targets

Our drag handles already meet the 44x44px minimum:

```tsx
className="min-h-[44px] min-w-[44px]"
```

This complies with WCAG 2.1 AAA (44px) and exceeds AA (24px).

---

## ARIA Attributes on Drag Handle

Our current implementation includes proper ARIA:

```tsx
<button
  ref={setActivatorNodeRef}
  {...listeners}
  {...attributes}
  aria-label="Drag to reorder"
  className="..."
>
  <GripVertical />
</button>
```

The `attributes` spread includes:
- `role="button"`
- `aria-roledescription="draggable"`
- `aria-describedby` (links to instructions)
- `tabindex="0"`

---

## Comparison with Current Implementation

### @hello-pangea/dnd Accessibility

Our current implementation uses:

```tsx
// Current screen reader announcements
function handleDragStart(start, provided) {
  provided.announce(`Picked up ${name}. Currently in ${stage} stage.`);
}
```

### @dnd-kit Migration

```tsx
// Migrated announcements
const announcements = {
  onDragStart({active}) {
    const opp = findOpportunity(active.id);
    return `Picked up ${opp.name}. Currently in ${opp.stage} stage.`;
  },
};

<DndContext accessibility={{announcements}}>
```

The functionality is equivalent, but the API is declarative instead of imperative.

---

## WCAG 2.1 AA Compliance Checklist

### Perceivable

- [x] Focus indicators visible (ring-2 ring-primary)
- [x] Semantic colors (no reliance on color alone)
- [x] Text alternatives for icons (aria-label on drag handle)

### Operable

- [x] Keyboard accessible (Enter/Space to activate, Arrow keys to move)
- [x] Touch targets ≥ 44px (min-h-11 min-w-11)
- [x] No time limits on drag operations
- [x] Cancel mechanism (Escape key)

### Understandable

- [x] Screen reader instructions provided
- [x] Real-time announcements during drag
- [x] Clear feedback on drop (announcement + visual)

### Robust

- [x] Proper ARIA roles (role="button", aria-roledescription)
- [x] Valid ARIA relationships (aria-describedby)
- [x] Works with screen readers (NVDA, VoiceOver, JAWS)

---

## Testing Accessibility

### Screen Reader Testing

1. **VoiceOver (macOS/iOS)**
   - Navigate to drag handle with Tab
   - Hear: "Drag to reorder, button, draggable"
   - Press Space to pick up
   - Hear: "Picked up [name]. Currently in [stage] stage."

2. **NVDA (Windows)**
   - Similar navigation and announcements

3. **JAWS (Windows)**
   - Similar navigation and announcements

### Keyboard Testing

1. Tab through all drag handles
2. Pick up with Enter/Space
3. Move with Arrow keys
4. Drop with Enter/Space
5. Cancel with Escape

### Automated Testing

```tsx
// Vitest + @testing-library
it('has accessible drag handle', () => {
  render(<SortableOpportunityCard opportunity={mockOpportunity} />);

  const handle = screen.getByRole('button', {name: /drag to reorder/i});

  expect(handle).toHaveAttribute('aria-roledescription', 'draggable');
  expect(handle).toHaveAttribute('tabindex', '0');
});
```

---

## Sources

- [dnd-kit Accessibility Guide](https://docs.dndkit.com/guides/accessibility)
- [Keyboard Sensor Documentation](https://docs.dndkit.com/api-documentation/sensors/keyboard)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Drag and Drop](https://www.w3.org/WAI/ARIA/apg/patterns/drag-and-drop/)
