# Kanban Board Visual Reference

**Quick visual guide to current state and proposed enhancements**

---

## Current State (Before Enhancements)

### Column Layout
```
┌─────────────────────────────────────────────────────────────┐
│  [New Lead]  [Initial...]  [Sample...]  [Awaiting...]  ...  │
│                                                               │
│  ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐         │
│  │ Card 1 │   │ Card 1 │   │ Card 1 │   │ Card 1 │         │
│  └────────┘   └────────┘   └────────┘   └────────┘         │
│  ┌────────┐   ┌────────┐   ┌────────┐   ┌────────┐         │
│  │ Card 2 │   │ Card 2 │   │        │   │ Card 2 │         │
│  └────────┘   └────────┘   │ Card 2 │   └────────┘         │
│  ┌────────┐   ┌────────┐   │        │                       │
│  │ Card 3 │   │        │   └────────┘                       │
│  └────────┘   │ Card 3 │                                    │
│               └────────┘                                     │
└─────────────────────────────────────────────────────────────┘

All columns look identical (no visual differentiation)
All cards look identical regardless of stage
```

### Card Detail (Current)
```
┌──────────────────────────────┐
│ [Avatar] Opportunity Name    │ ← text-xs font-medium
│          [Priority Badge]    │ ← Based on priority level
│          [Principal Badge]   │ ← If applicable
└──────────────────────────────┘
  ↑
  Shadow: shadow-sm
  Hover: shadow-md
  Transition: 200ms
```

---

## Enhanced State (After Enhancements)

### Column Layout with Stage Colors
```
┌──────────────────────────────────────────────────────────────────────────┐
│  ┃New Lead (3)│  ┃Initial... (5)│  ┃Sample... (2)│  ┃Awaiting... (4)│  ...│
│  ┃            │  ┃              │  ┃             │  ┃               │     │
│  ┃ ┌────────┐ │  ┃ ┌────────┐  │  ┃ ┌────────┐  │  ┃ ┌────────┐    │     │
│  ┃ │ Card 1 │ │  ┃ │ Card 1 │  │  ┃ │ Card 1 │  │  ┃ │ Card 1 │    │     │
│  ┃ └────────┘ │  ┃ └────────┘  │  ┃ └────────┘  │  ┃ └────────┘    │     │
│  ┃ ┌────────┐ │  ┃ ┌────────┐  │  ┃ ┌────────┐  │  ┃ ┌────────┐    │     │
│  ┃ │ Card 2 │ │  ┃ │ Card 2 │  │  ┃ │        │  │  ┃ │ Card 2 │    │     │
│  ┃ └────────┘ │  ┃ └────────┘  │  ┃ │ Card 2 │  │  ┃ └────────┘    │     │
│  ┃ ┌────────┐ │  ┃ ┌────────┐  │  ┃ │        │  │  ┃               │     │
│  ┃ │ Card 3 │ │  ┃ │        │  │  ┃ └────────┘  │  ┃               │     │
│  ┃ └────────┘ │  ┃ │ Card 3 │  │  ┃             │  ┃               │     │
│  ┃            │  ┃ └────────┘  │  ┃             │  ┃               │     │
│  └────────────┘  └──────────────┘  └─────────────┘  └───────────────┘     │
└──────────────────────────────────────────────────────────────────────────┘
  ↑                ↑                 ↑                 ↑
  Blue            Teal              Orange            Purple
  (info-subtle)   (tag-teal-bg)     (warning-subtle)  (tag-purple-bg)

Visual differentiation:
- Colored left border on headers (4px)
- Colored border on column container (2px)
- Stage count in header
- Cards inherit stage context
```

### Card Detail (Enhanced)
```
┃┌──────────────────────────────┐
┃│ [Avatar] Opportunity Name    │ ← text-xs font-medium
┃│          [Priority Badge]    │ ← Icon + color
┃│          [Principal Badge]   │ ← If applicable
┃└──────────────────────────────┘
 ↑
 Stage color accent (4px left border)
 Shadow: shadow-sm → hover:shadow-lg
 Scale: 1.0 → hover:1.02
 Transition: 200ms smooth
 Closed: opacity-60 (if won/lost)
```

---

## Color Mapping Reference

### Stage Colors (Light Mode)
```
┏━━━━━━━━━━━━━━━━━━━━┓
┃ New Lead           ┃ Light Blue  (--info-subtle)
┗━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━┓
┃ Initial Outreach   ┃ Teal        (--tag-teal-bg)
┗━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━┓
┃ Sample/Visit       ┃ Orange      (--warning-subtle)
┗━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━┓
┃ Awaiting Response  ┃ Purple      (--tag-purple-bg)
┗━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━┓
┃ Feedback Logged    ┃ Blue        (--tag-blue-bg)
┗━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━┓
┃ Demo Scheduled     ┃ Light Green (--success-subtle)
┗━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━┓
┃ Closed - Won       ┃ Dark Green  (--success-strong)
┗━━━━━━━━━━━━━━━━━━━━┛

┏━━━━━━━━━━━━━━━━━━━━┓
┃ Closed - Lost      ┃ Light Red   (--error-subtle)
┗━━━━━━━━━━━━━━━━━━━━┛
```

### Priority Badge Colors
```
Critical: ■ Red background    (destructive)
High:     ■ Dark background   (default)
Medium:   □ Light gray        (secondary)
Low:      ⬚ Bordered only     (outline)
```

---

## Interactive States

### Card Hover Progression
```
Resting:
┌──────────────┐
│ Card Content │  Shadow: subtle (shadow-sm)
└──────────────┘  Scale: 1.0

Hover (200ms transition):
┌──────────────┐
│ Card Content │  Shadow: elevated (shadow-lg)
└──────────────┘  Scale: 1.02
   ⬆ Slight lift
```

### Focus State (Keyboard Navigation)
```
┌──────────────┐
│ Card Content │
└──────────────┘
 ┗━━━━━━━━━━━━┛ ← 3px focus ring (--ring with 50% opacity)
```

---

## Layout Dimensions

### Column Sizing
```
┌─────────────────┐
│   Min: 160px    │
│   Max: 220px    │
│   Flex: flex-1  │
└─────────────────┘

Horizontal scroll if total width > viewport
```

### Card Spacing
```
Column gap:        16px (gap-4)
Card gap:          8px (gap-2)
Card padding:      py-2 (8px vert)
                   px-3 (12px horiz)
Avatar margin:     ml-2 (8px)
```

### Typography Scale
```
Column header:     text-base (16px) font-medium
Card title:        text-xs (12px) font-medium
Badge text:        text-xs (12px)
Stage count:       text-xs (12px) text-muted-foreground
```

---

## Loading States

### Skeleton Cards (Pulsing Animation)
```
┌──────────────────┐
│ ⬤ ▬▬▬▬▬         │ ← Avatar skeleton (circle)
│   ▬▬▬▬▬▬        │ ← Title skeleton (rectangle)
│   ▬▬            │ ← Badge skeleton (small rectangle)
└──────────────────┘
  ↑
  animate-pulse (1.5s infinite)
  bg-muted (semantic gray)
```

### Empty Column State
```
┌ ─ ─ ─ ─ ─ ─ ─ ─ ┐
│                  │
│   📥 (inbox)     │ ← Icon, muted
│ No opportunities │ ← text-xs text-muted-foreground
│                  │
└ ─ ─ ─ ─ ─ ─ ─ ─ ┘
  ↑
  Dashed border (border-dashed)
  Centered content
```

---

## Responsive Behavior

### Desktop (>1200px)
```
All columns visible, horizontal scroll if needed
┌──────┬──────┬──────┬──────┬──────┬──────┬──────┬──────┐
│ Col1 │ Col2 │ Col3 │ Col4 │ Col5 │ Col6 │ Col7 │ Col8 │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘
```

### Laptop (800-1200px)
```
Some columns off-screen, smooth horizontal scroll
┌──────┬──────┬──────┬──────┬──────┬──────┐
│ Col1 │ Col2 │ Col3 │ Col4 │ Col5 │ Col6 │──→
└──────┴──────┴──────┴──────┴──────┴──────┘
```

### Tablet (600-800px)
```
Fewer columns visible, scroll for more
┌──────┬──────┬──────┬──────┐
│ Col1 │ Col2 │ Col3 │ Col4 │──────→
└──────┴──────┴──────┴──────┘
```

### Mobile (<600px)
```
Minimal columns, requires horizontal scroll
┌──────┬──────┬──────┐
│ Col1 │ Col2 │ Col3 │──────────→
└──────┴──────┴──────┘
```

**Note:** Responsive breakpoints not currently implemented - all devices use flex + horizontal scroll.

---

## Accessibility Considerations

### Keyboard Navigation
```
Tab → Moves focus between cards
Enter/Space → Activates card (navigates to detail view)
Shift+Tab → Moves focus backward
Escape → (Future) Closes any open overlays
```

### Screen Reader Announcements
```
Column: "New Lead stage, 3 opportunities"
Card: "Opportunity: [Name], Priority: [Level], Organization: [Company]"
Badge: "Critical priority" (via aria-label or sr-only text)
Empty: "No opportunities in this stage"
```

### Color Contrast (WCAG AA)
```
Stage colors: 4.5:1 minimum contrast ratio
Text on cards: Dark foreground on light background
Badges: High contrast variants (destructive, default)
Focus rings: Visible at all times (3px, 50% opacity)
```

---

## Animation Timings

### Transitions
```
Card hover:       200ms (transition-all)
Stage color:      200ms (transition-colors)
Column border:    200ms (transition-colors)
Focus ring:       150ms (default Tailwind)
```

### Animations (Future)
```
Fade in:          300ms (animate-fade-in from tw-animate-css)
Slide in:         300ms (animate-slide-in-up)
Skeleton pulse:   1500ms (animate-pulse, infinite)
Scale bounce:     500ms (animate-bounce)
```

---

## Component Hierarchy

### Data Flow
```
OpportunityList (React Admin <List>)
    │
    ├─ FilterChipsPanel (Active filters)
    │
    └─ OpportunityListContent
           │
           ├─ useListContext() → {data, isPending, filterValues}
           │
           ├─ getOpportunitiesByStage() → Grouping logic
           │
           └─ OpportunityColumn (per stage)
                  │
                  ├─ Stage header (label + count + color)
                  │
                  ├─ Loading state (3× OpportunityCardSkeleton)
                  │
                  ├─ Empty state (dashed box)
                  │
                  └─ OpportunityCard (per opportunity)
                         │
                         ├─ Card wrapper (hover, click, keyboard)
                         │
                         ├─ OrganizationAvatar (16x16px)
                         │
                         ├─ Opportunity name (2-line clamp)
                         │
                         ├─ Priority badge (color-coded)
                         │
                         └─ Principal indicator (if applicable)
```

### Style Inheritance
```
Base (shadcn/ui)
    ↓
Card → Default: py-6, px-6, rounded-xl
    ↓
OpportunityCard → Override: py-2, px-3 (tighter)
                + Add: shadow, transition, hover, border-l-4
```

---

## CSS Variables Quick Reference

### Most Used in Kanban
```css
/* Surfaces */
--card                  White/dark card background
--card-foreground       Text color on cards
--muted                 Light gray for accents
--muted-foreground      Medium gray for secondary text
--border                Light gray borders

/* Stage Colors */
--info-subtle           Light blue (New Lead)
--tag-teal-bg          Teal (Initial Outreach)
--warning-subtle        Orange (Sample/Visit)
--tag-purple-bg        Purple (Awaiting Response)
--tag-blue-bg          Blue (Feedback Logged)
--success-subtle        Light green (Demo Scheduled)
--success-strong        Dark green (Closed - Won)
--error-subtle          Light red (Closed - Lost)

/* Interactive */
--ring                  Focus ring color
```

---

## Before/After Comparison

### Column Header
```
BEFORE:
  New Lead
  ────────

AFTER:
  ┃ New Lead (3)
  ┃ ────────
  ↑ Blue accent
```

### Card
```
BEFORE:
┌──────────────────────────────┐
│ [Avatar] Opportunity Name    │
│          [Badge]             │
└──────────────────────────────┘
  shadow-sm → hover:shadow-md

AFTER:
┃┌──────────────────────────────┐
┃│ [Avatar] Opportunity Name    │
┃│          [Icon Badge]        │
┃└──────────────────────────────┘
 ↑ Stage accent
  shadow-sm → hover:shadow-lg + scale-[1.02]
  Closed: opacity-60
```

### Column Container
```
BEFORE:
┌────────┐ ┌────────┐ ┌────────┐
│ Card 1 │ │ Card 1 │ │ Card 1 │
└────────┘ └────────┘ └────────┘
(No visual boundaries)

AFTER:
┏━━━━━━━━┓ ┏━━━━━━━━┓ ┏━━━━━━━━┓
┃ Card 1 ┃ ┃ Card 1 ┃ ┃ Card 1 ┃
┃ Card 2 ┃ ┃ Card 2 ┃ ┃ Card 2 ┃
┗━━━━━━━━┛ ┗━━━━━━━━┛ ┗━━━━━━━━┛
 ↑ Colored borders per stage
```

---

## Implementation Checklist

### Phase 1: Foundation ✓
- [ ] Fix `var(--purple)` → `var(--tag-purple-bg)` in stageConstants.ts
- [ ] Fix `var(--blue)` → `var(--tag-blue-bg)` in stageConstants.ts
- [ ] Add stage color to column headers (left border)
- [ ] Add stage count to headers
- [ ] Add closed stage opacity to cards
- [ ] Test light mode
- [ ] Test dark mode

### Phase 2: Visual Polish ✓
- [ ] Add stage color border to column container
- [ ] Add stage color accent to card left border
- [ ] Enhance hover states (shadow-lg + scale)
- [ ] Verify 60fps animations
- [ ] Test keyboard navigation preserved
- [ ] Test focus states visible

### Phase 3: UX Refinements ✓
- [ ] Create OpportunityCardSkeleton component
- [ ] Add loading states to columns
- [ ] Add empty column states
- [ ] Add priority icons to badges
- [ ] Final accessibility audit
- [ ] Cross-browser testing

---

**Visual Reference Complete**
**See enhancement-recommendations.md for full code examples**
