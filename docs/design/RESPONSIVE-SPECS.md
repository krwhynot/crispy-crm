# Responsive Design Specifications

Crispy CRM is designed for **Desktop (1440px+) and iPad (equal priority)**, optimized for account managers at their desks and field sales representatives on the go.

## Viewport Priority Table

| Priority | Device | Viewport | Tailwind Prefix | Usage |
|----------|--------|----------|-----------------|-------|
| 1 (EQUAL) | Desktop | 1440px+ | None (default) | Primary workspace for account managers |
| 1 (EQUAL) | iPad Landscape | 1024-1199px | `lg:` | Field sales - data entry |
| 2 | iPad Portrait | 768-1023px | `md:` | Field sales - quick reference |
| 3 | Mobile | < 768px | `sm:` | Emergency access only |

## Breakpoint Usage Rules

### Desktop & iPad Co-Primary Methodology

Default styles target desktop (1440px+) with iPad as co-equal priority. Use responsive prefixes to optimize for iPad viewports without degrading desktop experience.

```tsx
// CORRECT: Desktop-first
<div className="grid-cols-3 lg:grid-cols-2 md:grid-cols-1">

// WRONG: Mobile-first
<div className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Tailwind v4 Breakpoints

```css
/* Default breakpoints used in this project */
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* iPad Portrait */
--breakpoint-lg: 1024px;  /* iPad Landscape */
--breakpoint-xl: 1280px;  /* Small desktop */
--breakpoint-2xl: 1536px; /* Large desktop */
```

### Prefix Application Order

When writing responsive classes, order from largest to smallest:

```tsx
className="[desktop] lg:[ipad-landscape] md:[ipad-portrait] sm:[mobile]"
```

## Component Behaviors by Viewport

### Slide-Overs

| Viewport | Width | Behavior |
|----------|-------|----------|
| Desktop (1440px+) | 40vw | Side panel, content visible behind |
| iPad Landscape (1024-1199px) | 60vw | Side panel, reduced main content |
| iPad Portrait (768-1023px) | 80vw | Nearly full width |
| Mobile (< 768px) | 100vw | Full screen overlay |

```tsx
// SlideOver width classes
className="w-[40vw] lg:w-[60vw] md:w-[80vw] sm:w-full"
```

### DataGrid (PremiumDatagrid)

| Viewport | Behavior |
|----------|----------|
| Desktop | Full columns, horizontal scroll if needed |
| iPad Landscape | Priority columns only, secondary in expand row |
| iPad Portrait | Essential columns (name, status, date) |
| Mobile | Card view - stacked layout |

**Column Priority System:**
- P1 (Always visible): Name/Title, Status, Primary Action
- P2 (iPad Landscape+): Owner, Date, Amount
- P3 (Desktop only): Secondary dates, metadata, tags

### Navigation

| Viewport | Component | Behavior |
|----------|-----------|----------|
| Desktop | Sidebar | Fixed left sidebar (240px), always visible |
| iPad Landscape | Sidebar | Collapsible sidebar, icon-only when collapsed |
| iPad Portrait | Hamburger | Hidden sidebar, hamburger menu trigger |
| Mobile | Hamburger | Full-screen navigation overlay |

### Forms

| Viewport | Layout |
|----------|--------|
| Desktop | Multi-column (2-3 columns), grouped sections |
| iPad Landscape | 2 columns maximum |
| iPad Portrait | Single column, full-width inputs |
| Mobile | Single column, stacked labels |

```tsx
// Form grid pattern
<div className="grid grid-cols-3 lg:grid-cols-2 md:grid-cols-1 gap-6 lg:gap-4">
```

### Modals

| Viewport | Behavior |
|----------|----------|
| Desktop | Centered, max-width 600px, backdrop visible |
| iPad | Centered, max-width 90vw |
| Mobile | Full-screen, no backdrop |

### Touch Targets

Minimum touch target size across all viewports: **44x44px** (`h-11 w-11`)

```tsx
// All interactive elements
className="min-h-11 min-w-11"
```

## Grid System

### Desktop (1440px+)

- Columns: 12
- Gutter: 24px (`gap-6`)
- Margins: 32px (`px-8`)
- Max content width: 1400px

```tsx
<div className="grid grid-cols-12 gap-6 px-8 max-w-[1400px] mx-auto">
```

### iPad (768-1199px)

- Columns: 8
- Gutter: 16px (`gap-4`)
- Margins: 24px (`px-6`)

```tsx
<div className="grid grid-cols-12 lg:grid-cols-8 gap-6 lg:gap-4 px-8 lg:px-6">
```

### Mobile (< 768px)

- Columns: 4
- Gutter: 12px (`gap-3`)
- Margins: 16px (`px-4`)

## Layout Patterns

### List Shell (Primary Layout)

```
Desktop (1440px+):
+------------------+----------------------------------------+
|     Sidebar      |              Main Content              |
|     (240px)      |    (DataGrid + optional SlideOver)     |
+------------------+----------------------------------------+

iPad Landscape (1024-1199px):
+--------+--------------------------------------------------+
| Sidebar|              Main Content                        |
| (64px) |         (collapsed sidebar icons)                |
+--------+--------------------------------------------------+

iPad Portrait / Mobile:
+----------------------------------------------------------+
|  [hamburger]        Header                                |
+----------------------------------------------------------+
|                   Main Content                            |
|                  (full width)                             |
+----------------------------------------------------------+
```

### Slide-Over (Detail View)

```
Desktop:
+------------------+------------------+-------------------+
|     Sidebar      |    List View     |    SlideOver     |
|     (240px)      |    (60vw)        |    (40vw)        |
+------------------+------------------+-------------------+

iPad:
+--------+------------------------+------------------------+
| Sidebar|      List View        |       SlideOver        |
| (64px) |      (40vw)           |       (60vw)           |
+--------+------------------------+------------------------+

Mobile:
SlideOver becomes full-screen overlay
```

## Testing Matrix

### Required Test Devices

| Device | Resolution | Priority |
|--------|------------|----------|
| MacBook Pro 14" | 1512 x 982 | P1 |
| Desktop 1440p | 2560 x 1440 | P1 |
| iPad Pro 12.9" Landscape | 1366 x 1024 | P1 |
| iPad Pro 12.9" Portrait | 1024 x 1366 | P2 |
| iPad Air Landscape | 1180 x 820 | P2 |
| iPad Air Portrait | 820 x 1180 | P2 |
| iPhone 14 Pro | 393 x 852 | P3 |

### Browser Testing

| Browser | Priority |
|---------|----------|
| Chrome (latest) | P1 |
| Safari (latest) | P1 - Required for iPad |
| Firefox (latest) | P2 |
| Edge (latest) | P3 |

### Testing Checklist

For each viewport, verify:

- [ ] Navigation is accessible and functional
- [ ] DataGrid displays appropriate columns
- [ ] Slide-overs open at correct width
- [ ] Forms are usable (labels visible, inputs reachable)
- [ ] Touch targets meet 44px minimum
- [ ] Text is readable without horizontal scroll
- [ ] Critical actions are visible without scrolling
- [ ] Modals/dialogs are dismissible

## Implementation Notes

### CSS Custom Properties

```css
:root {
  --sidebar-width: 240px;
  --sidebar-collapsed-width: 64px;
  --slide-over-width: 40vw;
  --grid-gutter: 24px;
  --content-max-width: 1400px;
}

@media (max-width: 1199px) {
  :root {
    --slide-over-width: 60vw;
    --grid-gutter: 16px;
  }
}

@media (max-width: 1023px) {
  :root {
    --slide-over-width: 80vw;
  }
}

@media (max-width: 767px) {
  :root {
    --slide-over-width: 100vw;
    --grid-gutter: 12px;
  }
}
```

### Responsive Utilities

Use these Tailwind utilities for hiding/showing elements:

```tsx
// Desktop only
className="hidden lg:hidden md:hidden sm:block"

// iPad and up
className="block md:hidden"

// Mobile only
className="hidden sm:block"
```
