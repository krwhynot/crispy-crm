# Task Card Redesign - Contextual Ribbon Layout

**Date:** 2025-12-05
**Status:** Validated

## Problem Statement

The current My Tasks tab has UX friction points that slow down Account Managers:
1. **Date change friction** - Due dates are static text requiring 3+ clicks to reschedule
2. **Missing principal context** - Tasks don't show which principal they relate to
3. **Information hierarchy unclear** - Task title, type, priority, and date compete for attention

**Core Question:** "What is the ONE thing I have to do this week for each principal?" - should be answerable in <2 seconds.

## Decision

**Approach B: Contextual Ribbon Card** with inline date picker

### Visual Design

```
┌─────────────────────────────────────────────────────────┐
│▌                                                        │
│▌ ☐  Follow up with Hilton corporate buyer              │
│▌    US Foods · 📞 Call · High · Dec 1 ▼                │
│▌                                                        │
└─────────────────────────────────────────────────────────┘
 ↑
 4px colored ribbon (principal-specific color)
```

### Key Features

1. **Principal Color Ribbon** - 4px left border in principal-specific color for instant visual recognition
2. **Inline Date Picker** - Click date to open dropdown with:
   - Quick shortcuts: Today, Tomorrow, Next Week (covers 80% of reschedules)
   - Full calendar for specific dates
3. **Information Hierarchy** - Title primary, metadata secondary (Principal · Type · Priority · Date)
4. **Touch Targets** - 44px minimum for iPad compliance

## Alternatives Considered

| Approach | Description | Why Not Chosen |
|----------|-------------|----------------|
| A: Principal-Forward | Principal name at top-left as header | Taller cards, more vertical space |
| C: Action-Forward | Always-visible quick-action buttons | Button-heavy, principal secondary |
| D: Hover/Tap Reveal | Actions appear on interaction | Discoverability issues on iPad |
| E: Swipe Actions | iOS Mail-style swipe gestures | May conflict with drag-to-column |

## Design Details

### Architecture

```
src/atomic-crm/tasks/
├── components/
│   ├── TaskCard.tsx           # Modified: ribbon layout
│   ├── TaskCardRibbon.tsx     # New: colored left border
│   └── InlineDatePicker.tsx   # New: click-to-edit date
└── constants/
    └── principalColors.ts     # New: 9 principal color mappings
```

### Data Flow

1. Tasks fetched via `unifiedDataProvider` with principal join
2. Zod validation at API boundary only (`taskUpdateSchema`)
3. Optimistic UI updates with revert on failure
4. React Query cache invalidation on success

### InlineDatePicker Behavior

| Action | Result |
|--------|--------|
| Click/tap date | Dropdown opens below |
| Click "Today" | Sets date, closes, saves immediately |
| Click "Tomorrow" | Sets date + 1 day, closes, saves |
| Click "Next Wk" | Sets to next Monday, closes, saves |
| Click calendar day | Sets date, closes, saves |
| Click outside / Escape | Closes, no change |

### Principal Color Palette

9 distinct colors using Tailwind semantic tokens:
- US Foods: `border-l-blue-500`
- Sysco: `border-l-emerald-500`
- Performance Food: `border-l-amber-500`
- Gordon Food: `border-l-violet-500`
- Shamrock: `border-l-rose-500`
- (4 more to be assigned)
- Default: `border-l-muted-foreground`

### Error Handling

- Fail-fast: No retry logic
- Error boundary at MyTasksTab level
- Optimistic update with revert on failure
- Toast notification on success (optional)

## Engineering Principles Applied

- [x] **Fail-fast** - No retry logic, errors throw to boundary
- [x] **Single source of truth** - All data through `unifiedDataProvider`
- [x] **Zod at API boundary only** - `taskUpdateSchema` validates updates
- [x] **interface for objects** - Component props use interfaces
- [x] **Touch targets** - 44px minimum (h-11)
- [x] **Semantic colors** - Tailwind tokens, no raw hex values

## Testing Strategy

### Unit (Vitest)
- TaskCard renders principal ribbon with correct color
- InlineDatePicker opens/closes correctly
- Quick shortcuts calculate correct dates
- Keyboard navigation (Escape closes)

### E2E (Playwright)
- Reschedule task using inline picker
- Task moves to correct column after reschedule
- Principal colors visible on cards
- Semantic selectors only (getByRole, getByText)

## Open Questions

1. **Principal color assignments** - Need final mapping for all 9 principals
2. **Tasks without opportunities** - How to handle personal tasks with no principal? (Use default color)
3. **react-day-picker integration** - Confirm library is already in dependencies

## Success Metrics

- Date reschedule: 1 click (down from 3+)
- Principal identification: <200ms visual recognition
- Touch target compliance: 100% of interactive elements ≥44px
