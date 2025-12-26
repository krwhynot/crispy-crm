# Design Tokens

## Purpose

Design tokens provide a centralized system for spacing, sizing, borders, shadows, and touch targets in Atomic CRM. Ensures consistency across iPad, mobile, and desktop viewports.

## Core Pattern: CSS Variables + TypeScript Constants

Design tokens live in two places:
1. **CSS Variables** (`src/index.css`) - For Tailwind and runtime
2. **TypeScript Constants** (`src/lib/design-system/spacing.ts`) - For validation and logic

**Unified Design System Semantic Spacing Variables** (docs/archive/plans/2025-11-16-unified-design-system-rollout.md:306-344):

```css
@layer theme {
  :root {
    /* ========================================
       GRID & LAYOUT
       ======================================== */
    --spacing-grid-columns-desktop: 12;
    --spacing-grid-columns-ipad: 8;
    --spacing-gutter-desktop: 24px;
    --spacing-gutter-ipad: 16px;

    /* ========================================
       EDGE PADDING (Screen Borders)
       ======================================== */
    --spacing-edge-desktop: 24px;
    --spacing-edge-ipad: 20px;
    --spacing-edge-mobile: 16px;

    /* ========================================
       VERTICAL RHYTHM (Content Spacing)
       ======================================== */
    --spacing-section: 32px;      /* Between major sections */
    --spacing-widget: 24px;        /* Within widgets/cards */
    --spacing-content: 16px;       /* Content gaps */
    --spacing-compact: 12px;       /* Tight spacing */

    /* ========================================
       WIDGET INTERNALS
       ======================================== */
    --spacing-widget-padding: 20px;
    --spacing-widget-min-height: 280px;
  }
}
```

### Using Spacing Variables in Tailwind

**Edge padding with Tailwind custom properties:**

```tsx
// Page container with responsive edge padding
<div className="px-[var(--spacing-edge-desktop)]">
  {/* 24px on desktop (primary) */}
</div>

// Content gaps
<div className="gap-[var(--spacing-content)]">
  {/* 16px gap (matches content rhythm) */}
</div>

// Section spacing
<div className="space-y-[var(--spacing-section)]">
  {/* 32px between major sections */}
</div>
```

### Tokenized Utility Classes

**Reference `src/index.css` for reusable components** (docs/archive/plans/2025-11-16-unified-design-system-rollout.md:346-398):

| Utility | Purpose | Token | Shadow |
|---------|---------|-------|--------|
| `.card-container` | Standard card wrapper | `--spacing-widget-padding` | `shadow-sm` |
| `.create-form-card` | Create form elevation | `--spacing-widget-padding` | `shadow-lg` |
| `.interactive-card` | Premium hover effects | N/A | `shadow-md` on hover |
| `.table-row-premium` | Table rows (PremiumDatagrid) | N/A | Hover effects + lift |
| `.filter-sidebar` | Left sidebar filters | `w-64` | N/A |
| `.btn-premium` | Button hover states | N/A | `shadow-md` on hover |
| `.focus-ring` | Focus indicators | N/A | `focus-visible:ring-2` |

**Using tokenized utilities:**

```tsx
// Standard card (default spacing + shadow-sm)
<div className="card-container">
  Content with 20px padding and subtle shadow
</div>

// Create form (high elevation + shadow-lg)
<form className="create-form-card max-w-4xl">
  Important form with prominent shadow
</form>

// Premium row (hover effects + lift)
<tr className="table-row-premium">
  {/* Hover reveals border, adds shadow, lifts slightly */}
</tr>

// Filter sidebar (256px fixed width)
<aside className="filter-sidebar">
  {/* Left panel filters */}
</aside>
```

**From `src/lib/design-system/spacing.ts`:**

```typescript
/** WCAG 2.5.5 minimum touch target size (44x44px) */
export const TOUCH_TARGET_MIN = 44;

/** Current button standard - comfortable size (48x48px) */
export const TOUCH_TARGET_STANDARD = 48;

/** Spacious size for primary CTAs (56x56px) */
export const TOUCH_TARGET_SPACIOUS = 56;

export const spacing = {
  touchGap: 8,
  cardPadding: 16,
  sectionGap: 24,
  pageMargin: 32,
} as const;

export const validateTouchTarget = (size: number, componentName: string): void => {
  if (process.env.NODE_ENV === 'development') {
    if (size < TOUCH_TARGET_MIN) {
      throw new Error(
        `[Design System] ${componentName} has ${size}px touch target (minimum: ${TOUCH_TARGET_MIN}px)`
      );
    }
  }
};
```

## Spacing Scale

### Base Unit: 4px

All spacing increments are multiples of 4px for visual consistency.

**Tailwind Spacing Scale:**

```typescript
// Tailwind default scale (4px base)
space-0   = 0px
space-1   = 4px
space-2   = 8px
space-3   = 12px
space-4   = 16px
space-5   = 20px
space-6   = 24px
space-8   = 32px
space-10  = 40px
space-12  = 48px
space-16  = 64px
space-20  = 80px
space-24  = 96px
```

**Usage:**

```tsx
// Component padding
<Card className="p-4">      {/* 16px */}
<Card className="p-6">      {/* 24px */}

// Gap between elements
<div className="flex gap-2"> {/* 8px */}
<div className="flex gap-4"> {/* 16px */}

// Margins
<div className="mb-6">      {/* 24px bottom margin */}
<div className="mt-8">      {/* 32px top margin */}
```

### Semantic Spacing Tokens

**Vertical Rhythm:**

```css
--spacing-section: 24px;   /* Between major sections */
--spacing-widget: 16px;    /* Between cards/widgets */
--spacing-content: 12px;   /* Between content elements */
--spacing-compact: 8px;    /* Tight spacing */
```

**Usage:**

```tsx
// Dashboard layout
<div className="space-y-6">  {/* gap-y-6 = 24px = --spacing-section */}
  <StatCard />
  <StatCard />
</div>

// Card internals
<Card className="space-y-4">  {/* gap-y-4 = 16px = --spacing-widget */}
  <CardHeader />
  <CardContent />
</Card>
```

## Detailed Documentation

For comprehensive details, see:
- [Spacing & Grid](tokens-spacing-grid.md) - Grid system, edge padding, widget internals
- [Touch & Animation](tokens-touch-animation.md) - Touch targets, transitions, validation

## Related Resources

- [Color System](color-system.md) - Color tokens and semantic mapping
- [Typography](typography.md) - Font sizing and hierarchy
- [Elevation](elevation.md) - Shadow system details
- [Component Architecture](component-architecture.md) - Using tokens in components
