# Design Tokens

## Purpose

Design tokens provide a single source of truth for spacing, sizing, borders, shadows, and touch targets in Atomic CRM. Ensures consistency across iPad, mobile, and desktop viewports.

## Core Pattern: CSS Variables + TypeScript Constants

Design tokens live in two places:
1. **CSS Variables** (`src/index.css`) - For Tailwind and runtime
2. **TypeScript Constants** (`src/lib/design-system/spacing.ts`) - For validation and logic

**From `src/index.css`:**

```css
@theme inline {
  /* ========================================
     SPACING TOKENS - DESKTOP OPTIMIZED
     ======================================== */

  /* Grid System */
  --spacing-grid-columns-desktop: 12;
  --spacing-grid-columns-ipad: 8;
  --spacing-gutter-desktop: 12px;
  --spacing-gutter-ipad: 20px;

  /* Edge Padding (Screen Borders) - Desktop Optimized */
  --spacing-edge-desktop: 24px;
  --spacing-edge-ipad: 60px;
  --spacing-edge-mobile: 16px;

  /* Vertical Rhythm */
  --spacing-section: 24px;
  --spacing-widget: 16px;
  --spacing-content: 12px;
  --spacing-compact: 8px;

  /* Widget/Card Internals - Desktop Optimized */
  --spacing-widget-padding: 12px;
  --spacing-widget-min-height: 240px;
  --spacing-top-offset: 60px;

  /* Desktop Data Density */
  --row-height-compact: 32px;
  --row-height-comfortable: 40px;
  --row-padding-desktop: 6px 12px;
  --hover-zone-padding: 4px;
  --action-button-size: 28px;
  --context-menu-width: 200px;
}
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

## Touch Target Sizes

### WCAG 2.5.5 Requirements

**Minimum: 44x44px (WCAG Level AAA)**

```typescript
// Tailwind classes for touch targets
h-11 w-11   = 44px × 44px (minimum)
h-12 w-12   = 48px × 48px (standard buttons)
h-14 w-14   = 56px × 56px (primary CTAs)
```

**Button Sizes:**

```tsx
// Small button (minimum viable)
<Button size="sm" className="h-11 px-4">
  Action
</Button>

// Default button (standard)
<Button size="default" className="h-12 px-6">
  Primary Action
</Button>

// Large button (spacious)
<Button size="lg" className="h-14 px-8">
  Important CTA
</Button>

// Icon button (square)
<Button size="icon" className="h-12 w-12">
  <X className="h-4 w-4" />
</Button>
```

**Validation in Development:**

```typescript
import { validateTouchTarget } from '@/lib/design-system/spacing';

// Throws error if size < 44px in development mode
validateTouchTarget(48, 'Button');  // OK
validateTouchTarget(40, 'Button');  // Throws error
```

### Touch-Friendly Padding

**iPad/Touch Optimization:**

```tsx
// Mobile: compact padding
// iPad: comfortable padding
// Desktop: spacious padding

<Card className="p-4 md:p-6 lg:p-8">
  {/* 16px → 24px → 32px */}
</Card>

// Form inputs - generous tap area
<Input className="h-12 px-4 py-3" />  {/* 48px height, 16px horizontal padding */}
```

## Border Radius Tokens

**From `src/index.css`:**

```css
@theme inline {
  --radius: 0.5rem; /* 8px - MFB organic aesthetic */
  --radius-sm: calc(var(--radius) - 4px);  /* 4px */
  --radius-md: calc(var(--radius) - 2px);  /* 6px */
  --radius-lg: var(--radius);              /* 8px */
  --radius-xl: calc(var(--radius) + 4px);  /* 12px */
}
```

**Tailwind Classes:**

```tsx
rounded-sm   // 4px - small elements
rounded-md   // 6px - inputs, badges
rounded-lg   // 8px - cards, buttons
rounded-xl   // 12px - large cards, dialogs
rounded-full // 9999px - avatars, pills
```

**Usage:**

```tsx
// Card with organic aesthetic
<Card className="rounded-xl">  {/* 12px */}

// Button with standard radius
<Button className="rounded-lg">  {/* 8px */}

// Input field
<Input className="rounded-md" />  {/* 6px */}

// Badge/Pill
<Badge className="rounded-full">  {/* Fully rounded */}
```

## Shadow Tokens (Elevation)

**Three-tier system:**

```css
/* Elevation 1: Low - List items, default cards */
--elevation-1:
  0px 1px 2px -1px oklch(30% 0.010 92 / 0.05),
  0px 1px 3px -1px oklch(30% 0.010 92 / 0.10);

/* Elevation 2: Medium - Hover states, focused cards */
--elevation-2:
  0px 2px 4px -1px oklch(30% 0.010 92 / 0.06),
  0px 4px 6px -1px oklch(30% 0.010 92 / 0.12);

/* Elevation 3: High - Modals, dropdowns, tooltips */
--elevation-3:
  0px 10px 15px -3px oklch(30% 0.010 92 / 0.08),
  0px 4px 6px -2px oklch(30% 0.010 92 / 0.10);
```

**Tailwind Mapping:**

```tsx
shadow-sm  → Elevation 1 (default)
shadow-md  → Elevation 2 (hover)
shadow-lg  → Elevation 3 (floating)
shadow-xl  → Extra high (overlays)
```

**Usage:**

```tsx
// Default card
<Card className="shadow-sm">  {/* Elevation 1 */}

// Hover state
<Card className="shadow-sm hover:shadow-md transition-shadow">
  {/* Elevation 1 → 2 on hover */}
</Card>

// Modal/Dialog
<Dialog className="shadow-lg">  {/* Elevation 3 */}
```

## Grid System

**Desktop-optimized 12-column grid:**

```css
--spacing-grid-columns-desktop: 12;
--spacing-grid-columns-ipad: 8;
--spacing-gutter-desktop: 12px;
--spacing-gutter-ipad: 20px;
```

**Tailwind Grid:**

```tsx
// Dashboard: 3-column grid (desktop), 2-column (iPad), 1-column (mobile)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
  <StatCard />
  <StatCard />
  <StatCard />
</div>

// Full-width with gutters
<div className="grid grid-cols-12 gap-3 md:gap-5">
  <div className="col-span-12 md:col-span-8">  {/* Main content */}
  <div className="col-span-12 md:col-span-4">  {/* Sidebar */}
</div>
```

## Edge Padding (Screen Borders)

**Responsive edge spacing:**

```css
--spacing-edge-desktop: 24px;
--spacing-edge-ipad: 60px;
--spacing-edge-mobile: 16px;
```

**Usage:**

```tsx
// Page container with responsive edge padding
<div className="px-4 md:px-[60px] lg:px-6">
  {/* 16px → 60px → 24px */}
  <PageContent />
</div>

// Simpler pattern with Tailwind
<div className="px-4 md:px-12 lg:px-6">
  {/* Close approximation */}
</div>
```

## Widget/Card Internals

**Standard card spacing:**

```css
--spacing-widget-padding: 12px;
--spacing-widget-min-height: 240px;
```

**Usage:**

```tsx
// Dashboard widget with standard spacing
<Card className="p-3 min-h-[240px]">  {/* 12px padding, 240px min height */}
  <CardHeader className="px-6 py-4">
    <CardTitle>Widget Title</CardTitle>
  </CardHeader>
  <CardContent className="px-6 pb-6">
    {/* Content */}
  </CardContent>
</Card>
```

## Data Density Tokens (Desktop)

**Compact table rows for desktop:**

```css
--row-height-compact: 32px;
--row-height-comfortable: 40px;
--row-padding-desktop: 6px 12px;
--action-button-size: 28px;
```

**Usage:**

```tsx
// Compact table row (desktop)
<tr className="h-8 hover:bg-accent">  {/* 32px */}
  <td className="px-3 py-1.5">  {/* 12px, 6px */}
    Organization Name
  </td>
  <td>
    <Button size="icon" className="h-7 w-7">  {/* 28px action button */}
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </td>
</tr>

// Comfortable row (default)
<tr className="h-10">  {/* 40px */}
  {/* ... */}
</tr>
```

## Typography Sizing

**Minimum body text: 14px (text-sm)**

```typescript
text-xs    = 12px  // Metadata, timestamps
text-sm    = 14px  // Body text (minimum for readability)
text-base  = 16px  // Emphasized body text
text-lg    = 18px  // Section headers
text-xl    = 20px  // Page headers
text-2xl   = 24px  // Large headers
text-3xl   = 30px  // Hero text
text-4xl   = 36px  // Marketing/landing
```

**Usage:**

```tsx
// Page title
<h1 className="text-2xl font-bold">Organizations</h1>

// Section header
<h2 className="text-lg font-semibold">Contact Information</h2>

// Body text
<p className="text-sm text-muted-foreground">
  Description text with 14px minimum
</p>

// Metadata
<span className="text-xs text-muted-foreground">
  Updated 2 hours ago
</span>
```

## Animation/Transition Tokens

**Standard transitions:**

```tsx
// Color transitions (buttons, hovers)
transition-colors duration-150

// Shadow transitions (elevation changes)
transition-shadow duration-150

// All properties (complex animations)
transition-all duration-200

// Transform (slide-ins, scale)
transition-transform duration-200
```

**Usage:**

```tsx
// Button hover
<Button className="transition-colors hover:bg-primary/90">
  Smooth color transition
</Button>

// Card elevation
<Card className="shadow-sm hover:shadow-md transition-shadow duration-150">
  Smooth shadow transition
</Card>

// Dropdown animation
<div className="transition-all duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out">
  Smooth open/close
</div>
```

## Responsive Breakpoints

**iPad-first approach:**

```typescript
// Tailwind breakpoints
sm: '640px'   // Small phones (landscape)
md: '768px'   // iPad portrait (PRIMARY TARGET)
lg: '1024px'  // iPad landscape / small desktop
xl: '1280px'  // Desktop
2xl: '1536px' // Large desktop
```

**Usage Pattern:**

```tsx
// Design on iPad (md:), adapt down (base) and up (lg:)
<div className="
  p-4           {/* Mobile: 16px */}
  md:p-6        {/* iPad: 24px - PRIMARY */}
  lg:p-8        {/* Desktop: 32px */}
">
  Content optimized for iPad first
</div>

// Grid: 1 col mobile, 2 col iPad, 3 col desktop
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* ... */}
</div>
```

## Validation Helpers

**Development-time validation:**

```typescript
// src/lib/design-system/spacing.ts

/** Validates touch target size */
export const validateTouchTarget = (size: number, componentName: string): void => {
  if (process.env.NODE_ENV === 'development') {
    if (size < TOUCH_TARGET_MIN) {
      throw new Error(
        `[Design System] ${componentName} has ${size}px touch target (minimum: ${TOUCH_TARGET_MIN}px)`
      );
    }
  }
};

/** Non-throwing check */
export const isTouchTargetValid = (size: number): boolean => {
  return size >= TOUCH_TARGET_MIN;
};
```

**Usage:**

```typescript
// In component
useEffect(() => {
  const buttonHeight = buttonRef.current?.offsetHeight || 0;
  validateTouchTarget(buttonHeight, 'CustomButton');
}, []);
```

## Accessibility Considerations

### Minimum Sizes

- **Touch Targets:** 44x44px minimum (WCAG 2.5.5 Level AAA)
- **Body Text:** 14px minimum (text-sm)
- **Click Gap:** 8px minimum between interactive elements

### Color Contrast

All token-based colors maintain WCAG AA contrast ratios:
- Body text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

## Performance Notes

- CSS variables have ~0 performance impact (native browser)
- TypeScript constants are compile-time only (zero runtime cost)
- Tailwind JIT compiles only used classes
- Shadow tokens: ~0.5ms per card (negligible)

## Best Practices

### DO
✅ Use semantic spacing tokens (--spacing-widget, --spacing-section)
✅ Maintain 44x44px minimum touch targets
✅ Use 4px base unit for all spacing
✅ Apply iPad-first responsive patterns (optimize md:)
✅ Use TypeScript constants for validation logic
✅ Test on iPad viewport (768px-1024px) first
✅ Use Tailwind utility classes (not inline CSS variables)

### DON'T
❌ Create custom spacing values outside 4px scale
❌ Use touch targets smaller than 44x44px
❌ Skip responsive variants (always consider mobile/iPad/desktop)
❌ Hardcode pixel values (use tokens)
❌ Use inline CSS variable syntax in className
❌ Test only on desktop (iPad is primary)
❌ Mix spacing systems (stick to tokens)

## Common Issues & Solutions

### Issue: Button too small for touch

**Solution:** Use minimum size classes

```tsx
// ❌ BAD: Below minimum
<button className="h-10 w-10">  {/* 40px */}

// ✅ GOOD: Meets minimum
<Button size="sm" className="h-11 w-11">  {/* 44px */}
```

### Issue: Inconsistent spacing

**Solution:** Use semantic tokens

```tsx
// ❌ BAD: Random values
<div className="mb-5 mt-7 px-3">

// ✅ GOOD: Token-based
<div className="space-y-6 px-4 md:px-6">  {/* --spacing-section, --spacing-widget-padding */}
```

### Issue: Poor iPad experience

**Solution:** Optimize md: breakpoint

```tsx
// ❌ BAD: Mobile-first only
<div className="p-2 lg:p-8">  {/* Cramped on iPad */}

// ✅ GOOD: iPad-optimized
<div className="p-4 md:p-6 lg:p-8">  {/* Comfortable on iPad */}
```

## Related Resources

- [Color System](color-system.md) - Color tokens and semantic mapping
- [Typography](typography.md) - Font sizing and hierarchy
- [Elevation](elevation.md) - Shadow system details
- [Component Architecture](component-architecture.md) - Using tokens in components
