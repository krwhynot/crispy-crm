# Elevation

## Purpose

Define the elevation system for Atomic CRM including the three-tier shadow system, warm-tinted shadow ink, stroke patterns for edge definition, divider hierarchy, and rounded corner radius tokens that create material depth and visual layering on paper cream backgrounds.

## Core Principle: Material Layering with Warm-Tinted Shadows

Atomic CRM uses a **Material Layering Principle** inspired by physical paper on a desk. The background (paper cream at 97.5% lightness) represents the desk surface, cards (pure white at 100% lightness) represent elevated papers, and shadows create natural depth. The 2.5-point lightness delta provides clear visual separation.

Shadows use **warm-tinted shadow ink** (OKLCH hue 92° matching the canvas) to prevent the "soot" appearance of pure black shadows on warm backgrounds.

**From `src/index.css`:**

```css
:root {
  /* Material Layering Principle */
  --background: oklch(97.5% 0.01 92);  /* Paper cream - desk surface */
  --card: oklch(100% 0 0);             /* Pure white - elevated papers */

  /* Warm-Tinted Shadow Ink (matches canvas hue 92°) */
  --shadow-ink: oklch(30% 0.01 92);

  /* Three-Tier Elevation System - Dual-layer shadows with negative spread */
  --elevation-1: 0 1px 2px 0 var(--shadow-ink) / 0.1, 0 4px 8px -2px var(--shadow-ink) / 0.16;
  --elevation-2: 0 2px 3px 0 var(--shadow-ink) / 0.12, 0 8px 16px -4px var(--shadow-ink) / 0.18;
  --elevation-3: 0 3px 6px -2px var(--shadow-ink) / 0.14, 0 16px 24px -8px var(--shadow-ink) / 0.2;

  /* Stroke System - Hairline borders for card edge definition */
  --stroke-card: oklch(93% 0.004 92);       /* 1px border around elevated cards */
  --stroke-card-hover: oklch(91% 0.006 92); /* Slightly darker on hover */

  /* Divider System */
  --divider-subtle: oklch(96% 0.004 92);    /* On white surfaces, internal dividers */
  --divider-strong: oklch(94.5% 0.004 92);  /* Section separators */
}
```

**Why this works:**
- **Material realism:** White cards on paper cream desk create natural depth perception
- **Warm shadows:** Shadow ink matches canvas hue (92°) to prevent visual dissonance
- **Dual-layer technique:** Two shadows (tight + diffuse) create realistic depth
- **Negative spread:** Prevents shadows from extending beyond card edges
- **Stroke definition:** 1px borders provide edge clarity without harsh lines

## Three-Tier Elevation System

Atomic CRM uses three elevation levels to create visual hierarchy. Each tier has a specific use case.

### Elevation 1: Low (Static Content)

**Shadow Definition:**
```css
--elevation-1: 0 1px 2px 0 var(--shadow-ink) / 0.1, 0 4px 8px -2px var(--shadow-ink) / 0.16;
```

**Breakdown:**
- **Layer 1:** `0 1px 2px 0 var(--shadow-ink) / 0.1` - Tight shadow for edge definition
  - Y-offset: 1px
  - Blur: 2px
  - Spread: 0 (no expansion)
  - Opacity: 10%
- **Layer 2:** `0 4px 8px -2px var(--shadow-ink) / 0.16` - Diffuse shadow for depth
  - Y-offset: 4px
  - Blur: 8px
  - Spread: -2px (shrinks shadow inward)
  - Opacity: 16%

**Use Cases:**
- Static content cards
- Default widgets
- List item containers
- Non-interactive panels

**Example:**
```tsx
// ✅ CORRECT - Use semantic utilities
<div className="card-container">
  <h3 className="text-sm font-medium text-foreground">
    Total Revenue
  </h3>
  <div className="text-2xl font-bold mt-2">$125,000</div>
</div>

// ❌ WRONG - Never use inline CSS variable syntax
// shadow-[var(--elevation-1)]
// border-[color:var(--stroke-card)]
// text-[color:var(--text-title)]
```

**Tailwind Mapping:**
- `shadow-sm` → Elevation 1 (default cards)
- `.card-container` → shadow-sm + border + padding preset

### Elevation 2: Medium (Interactive Content)

**Shadow Definition:**
```css
--elevation-2: 0 2px 3px 0 var(--shadow-ink) / 0.12, 0 8px 16px -4px var(--shadow-ink) / 0.18;
```

**Breakdown:**
- **Layer 1:** `0 2px 3px 0 var(--shadow-ink) / 0.12` - Slightly elevated edge
  - Y-offset: 2px
  - Blur: 3px
  - Opacity: 12%
- **Layer 2:** `0 8px 16px -4px var(--shadow-ink) / 0.18` - Deeper diffuse shadow
  - Y-offset: 8px
  - Blur: 16px
  - Spread: -4px
  - Opacity: 18%

**Use Cases:**
- Hover states on cards
- Interactive widgets
- Important panels
- Draggable elements

**Example:**
```tsx
<div className="bg-card rounded-xl border border-[color:var(--stroke-card)] shadow-[var(--elevation-1)] hover:shadow-[var(--elevation-2)] transition-shadow duration-150 p-6">
  <h3 className="text-sm font-medium">Opportunity Card</h3>
  <p className="text-base mt-2">$45,000</p>
</div>
```

### Elevation 3: High (Floating Content)

**Shadow Definition:**
```css
--elevation-3: 0 3px 6px -2px var(--shadow-ink) / 0.14, 0 16px 24px -8px var(--shadow-ink) / 0.2;
```

**Breakdown:**
- **Layer 1:** `0 3px 6px -2px var(--shadow-ink) / 0.14` - Strong edge definition
  - Y-offset: 3px
  - Blur: 6px
  - Spread: -2px
  - Opacity: 14%
- **Layer 2:** `0 16px 24px -8px var(--shadow-ink) / 0.2` - Maximum diffuse depth
  - Y-offset: 16px
  - Blur: 24px
  - Spread: -8px
  - Opacity: 20%

**Use Cases:**
- Modals and dialogs
- Floating menus
- Dropdown panels
- Maximum prominence elements

**Example:**
```tsx
<div className="fixed inset-0 bg-overlay z-50 flex items-center justify-center">
  <div className="bg-card rounded-xl shadow-[var(--elevation-3)] p-8 max-w-md w-full">
    <h2 className="text-xl font-semibold mb-4">Confirm Action</h2>
    <p className="text-base text-[color:var(--text-body)] mb-6">
      Are you sure you want to delete this opportunity?
    </p>
    <div className="flex gap-3 justify-end">
      <button className="px-4 py-2 text-sm font-medium">Cancel</button>
      <button className="px-4 py-2 text-sm font-medium bg-destructive text-destructive-foreground rounded-md">
        Delete
      </button>
    </div>
  </div>
</div>
```

## Elevation Usage Patterns

### Pattern 1: Card with Elevation

The most common pattern combines elevation, stroke, and rounded corners.

**From `src/components/ui/card.tsx`:**

```typescript
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "card-container transition-shadow duration-150",  // ✅ Uses .card-container utility
        className
      )}
      {...props}
    />
  );
}
```

**Key Details:**
- `.card-container` - Preset styling (bg-card, border, shadow-sm, p-6, rounded-xl)
- `transition-shadow duration-150` - Smooth elevation changes on hover
- **DON'T:** Use `border-[color:var(--stroke-card)]` or `shadow-[var(--elevation-1)]`

### Tokenized Utility Classes

**Per unified design system** (docs/plans/2025-11-16-unified-design-system-rollout.md:346-398):

| Utility | Elevation | Usage |
|---------|-----------|-------|
| `.card-container` | shadow-sm | Standard cards, default state |
| `.create-form-card` | shadow-lg | Create forms (high emphasis) |
| `.interactive-card` | shadow-md on hover | Hover interactive elements |
| `.table-row-premium` | shadow-md on hover | Table rows with lift effect |

**Tailwind Direct Mapping:**
- `shadow-sm` → Elevation 1 (cards, default)
- `shadow-md` → Elevation 2 (hover, interactive)
- `shadow-lg` → Elevation 3 (modals, floating)

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Opportunities This Week</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">23</div>
  </CardContent>
</Card>
```

### Pattern 2: Hover Elevation Transition

Cards elevate on hover to signal interactivity.

```tsx
<div className="bg-card rounded-xl border border-[color:var(--stroke-card)] shadow-[var(--elevation-1)] hover:shadow-[var(--elevation-2)] hover:border-[color:var(--stroke-card-hover)] transition-all duration-150 p-6 cursor-pointer">
  <h3 className="text-sm font-medium">Interactive Card</h3>
  <p className="text-base mt-2">Click to view details</p>
</div>
```

**Key Details:**
- `hover:shadow-[var(--elevation-2)]` - Elevate on hover
- `hover:border-[color:var(--stroke-card-hover)]` - Darken border slightly
- `transition-all duration-150` - Smooth 150ms transition
- `cursor-pointer` - Indicate interactivity

### Pattern 3: Dragging Elevation

Draggable elements elevate to maximum during drag.

```tsx
<div
  className={cn(
    "bg-card rounded-lg border border-[color:var(--stroke-card)] p-4",
    isDragging ? "shadow-[var(--elevation-3)] cursor-grabbing" : "shadow-[var(--elevation-1)] cursor-grab"
  )}
  draggable
  onDragStart={() => setIsDragging(true)}
  onDragEnd={() => setIsDragging(false)}
>
  <h4 className="text-sm font-medium">Draggable Card</h4>
</div>
```

**Key Details:**
- Conditional elevation based on drag state
- `cursor-grab` / `cursor-grabbing` for UX clarity
- Instant elevation change (no transition) for immediate feedback

### Pattern 4: Modal with Overlay

Modals use elevation-3 with semi-transparent backdrop.

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-overlay" onClick={onClose} />

  {/* Modal */}
  <div className="relative bg-card rounded-xl shadow-[var(--elevation-3)] p-8 max-w-lg w-full mx-4">
    <h2 className="text-xl font-semibold mb-4">Modal Title</h2>
    <p className="text-base text-[color:var(--text-body)]">
      Modal content goes here.
    </p>
  </div>
</div>
```

**Key Details:**
- `fixed inset-0` - Full-screen overlay
- `bg-overlay` - Semi-transparent black (50% opacity)
- `shadow-[var(--elevation-3)]` - Maximum elevation for floating modal
- `relative` on modal to position above backdrop

## Stroke System (Edge Definition)

Strokes provide hairline borders around elevated cards for edge clarity.

### Stroke Tokens

```css
/* Light Mode */
--stroke-card: oklch(93% 0.004 92);       /* 1px border around elevated cards */
--stroke-card-hover: oklch(91% 0.006 92); /* Slightly darker on hover */
```

**Why strokes matter:**
- Prevent cards from "floating" without definition
- Create crisp edges even on low-contrast displays
- Subtle enough to not compete with shadows
- Warm-tinted to match paper cream background

### Stroke Usage

```tsx
// ✅ GOOD: Elevation + stroke for clear edges
<div className="bg-card rounded-xl shadow-[var(--elevation-1)] border border-[color:var(--stroke-card)]">
  Content
</div>

// ❌ BAD: Elevation without stroke (soft edges)
<div className="bg-card rounded-xl shadow-[var(--elevation-1)]">
  Content
</div>

// ✅ GOOD: Hover state darkens stroke
<div className="bg-card rounded-xl shadow-[var(--elevation-1)] hover:shadow-[var(--elevation-2)] border border-[color:var(--stroke-card)] hover:border-[color:var(--stroke-card-hover)] transition-all">
  Interactive content
</div>
```

## Divider System

Dividers create internal separation within surfaces.

### Divider Tokens

```css
--divider-subtle: oklch(96% 0.004 92);    /* On white surfaces, internal dividers */
--divider-strong: oklch(94.5% 0.004 92);  /* Section separators */
```

**Hierarchy:**
- **Subtle:** For internal divisions within cards (e.g., between list items)
- **Strong:** For section boundaries (e.g., between card header and body)

### Divider Usage

```tsx
// Subtle divider (internal list items)
<div className="space-y-0">
  {items.map((item, index) => (
    <div key={item.id}>
      <div className="py-3 px-4">
        {item.content}
      </div>
      {index < items.length - 1 && (
        <div className="h-px bg-[color:var(--divider-subtle)]" />
      )}
    </div>
  ))}
</div>

// Strong divider (section separator)
<Card>
  <CardHeader className="border-b border-[color:var(--divider-strong)]">
    <CardTitle>Section Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content below divider
  </CardContent>
</Card>
```

**Pattern:**
- Use `h-px` (1px height) for horizontal dividers
- Use `w-px` (1px width) for vertical dividers
- Apply `bg-[color:var(--divider-subtle)]` or `bg-[color:var(--divider-strong)]`

## Rounded Corners (Border Radius)

Atomic CRM uses rounded corners to create an organic, friendly aesthetic aligned with the "Garden to Table" brand.

### Radius Tokens

**From `src/index.css`:**

```css
@theme inline {
  --radius: 0.5rem; /* 8px - Base radius */
  --radius-sm: calc(var(--radius) - 4px);  /* 4px */
  --radius-md: calc(var(--radius) - 2px);  /* 6px */
  --radius-lg: var(--radius);              /* 8px */
  --radius-xl: calc(var(--radius) + 4px);  /* 12px */
}
```

**Tailwind Mapping:**

| Token | Value | Tailwind Class | Use Case |
|-------|-------|---------------|----------|
| `--radius-sm` | 4px | `rounded-sm` | Buttons, badges, small elements |
| `--radius-md` | 6px | `rounded-md` | Form inputs, chips |
| `--radius-lg` | 8px | `rounded-lg` | Small cards, dropdowns |
| `--radius-xl` | 12px | `rounded-xl` | Large cards, panels |
| N/A | 16px | `rounded-2xl` | Hero sections, modals |
| N/A | 9999px | `rounded-full` | Avatars, icon buttons |

### Radius Usage Patterns

```tsx
// Small buttons and badges
<button className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded-sm">
  New
</button>

// Form inputs
<input className="px-4 py-2 border rounded-md" />

// Small cards
<div className="bg-card p-4 rounded-lg shadow-[var(--elevation-1)]">
  Small card
</div>

// Large cards (most common)
<Card className="rounded-xl">
  <CardHeader>
    <CardTitle>Large Card</CardTitle>
  </CardHeader>
  <CardContent>
    Default card radius
  </CardContent>
</Card>

// Modals
<div className="bg-card p-8 rounded-2xl shadow-[var(--elevation-3)]">
  Modal content
</div>

// Avatars
<img src="/avatar.jpg" className="w-10 h-10 rounded-full" />
```

## Avatar Micro-Elevation

Avatars use a specialized elevation system with ring, shadow, and highlight for subtle depth.

**From `src/index.css`:**

```css
/* Avatar Micro-Elevation - Ring + shadow + highlight for depth */
--avatar-shadow: 0 0 0 1px oklch(93% 0.004 92), 0 1px 2px 0 var(--shadow-ink) / 0.1;
--avatar-highlight: inset 0 1px 0 0 oklch(100% 0 0 / 0.3);
```

**Breakdown:**
- **Ring:** `0 0 0 1px oklch(93% 0.004 92)` - 1px hairline stroke around avatar
- **Shadow:** `0 1px 2px 0 var(--shadow-ink) / 0.1` - Subtle depth
- **Highlight:** `inset 0 1px 0 0 oklch(100% 0 0 / 0.3)` - Top inner glow for dimension

**Usage:**
```tsx
<img
  src="/avatar.jpg"
  alt="User Name"
  className="w-10 h-10 rounded-full"
  style={{
    boxShadow: 'var(--avatar-shadow), var(--avatar-highlight)'
  }}
/>
```

**Why this works:**
- Ring provides edge definition on any background
- Shadow creates subtle lift
- Highlight simulates light reflection on glossy surface
- Combined effect: realistic material depth

## Column Shadows (Special Case)

Data table columns use specialized shadows for internal depth.

**From `src/index.css`:**

```css
/* Column shadows - Optimized for paper cream background */
--shadow-col: 0 2px 6px var(--shadow-ink) / 0.12;
--shadow-col-inner: inset 0 1px 2px var(--shadow-ink) / 0.05;
```

**Use Cases:**
- Sticky table headers
- Frozen columns
- Column dividers

**Example:**
```tsx
<thead className="sticky top-0 bg-card shadow-[var(--shadow-col)] z-10">
  <tr>
    <th className="py-3 px-4">Organization</th>
    <th className="py-3 px-4">Stage</th>
    <th className="py-3 px-4">Value</th>
  </tr>
</thead>
```

## Dark Mode Elevation

Dark mode uses cool-tinted shadows with increased opacity for visibility against dark backgrounds.

**From `src/index.css`:**

```css
.dark {
  /* Shadow ink - Cool-tinted to match neutral hue (287°) */
  --shadow-ink-dark: oklch(10% 0.015 287);

  /* Three-tier elevation (dark mode) */
  --shadow-card-1: 0 2px 4px var(--shadow-ink-dark) / 0.35;
  --shadow-card-2: 0 3px 6px var(--shadow-ink-dark) / 0.4;
  --shadow-card-3: 0 4px 8px var(--shadow-ink-dark) / 0.45;

  /* Hover states */
  --shadow-card-1-hover: 0 3px 8px var(--shadow-ink-dark) / 0.45;
  --shadow-card-2-hover: 0 5px 14px var(--shadow-ink-dark) / 0.5;
  --shadow-card-3-hover: 0 7px 18px var(--shadow-ink-dark) / 0.55;
}
```

**Key Differences:**
- **Cool tinting:** Hue shifts from 92° (warm) to 287° (cool) to match dark neutral palette
- **Higher opacity:** 35-55% vs 10-20% for visibility against dark backgrounds
- **Simpler structure:** Single-layer shadows (not dual-layer) for cleaner rendering

**Pattern:**
```tsx
// ✅ GOOD: Automatic dark mode support
<Card className="shadow-[var(--elevation-1)]">
  Adapts to dark mode automatically
</Card>

// ❌ BAD: Manual dark mode override
<Card className="shadow-md dark:shadow-lg">
  Unnecessary manual override
</Card>
```

## Accessibility Considerations

### Focus Rings

Focus rings use elevated prominence for keyboard navigation.

```tsx
// ✅ GOOD: Clear focus ring with elevation effect
<button className="px-4 py-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Action
</button>
```

**Key Details:**
- `focus-visible:outline-none` - Remove default outline
- `focus-visible:ring-2` - 2px ring width
- `focus-visible:ring-ring` - Use semantic ring color (`--ring`)
- `focus-visible:ring-offset-2` - 2px gap between element and ring

### Minimum Touch Targets

Elevated interactive elements must meet 44x44px minimum touch targets.

```tsx
// ✅ GOOD: Meets minimum with visible elevation
<button className="w-11 h-11 rounded-md shadow-[var(--elevation-1)] hover:shadow-[var(--elevation-2)]">
  <Icon className="w-5 h-5" />
</button>

// ❌ BAD: Below minimum
<button className="w-8 h-8">
  <Icon className="w-4 h-4" />
</button>
```

## Performance Considerations

### Shadow Rendering

Multiple box-shadows can impact render performance on low-end devices.

**Optimization strategies:**
- Use CSS custom properties (already compiled at runtime)
- Avoid animating box-shadow (use `transform` and `opacity` instead)
- Apply `will-change: transform` for draggable elements

**Pattern:**
```tsx
// ✅ GOOD: Transform for hover elevation (GPU-accelerated)
<div className="shadow-[var(--elevation-1)] transition-transform hover:scale-[1.02]">
  Content
</div>

// ❌ BAD: Animating box-shadow (expensive)
<div className="hover:shadow-[var(--elevation-2)] transition-shadow">
  Content
</div>

// ✅ ACCEPTABLE: Transition shadow for subtle effects (150ms max)
<Card className="transition-shadow duration-150 hover:shadow-[var(--elevation-2)]">
  Acceptable for cards
</Card>
```

### Z-Index Management

Elevation and z-index must work together for proper layering.

**Z-Index Scale:**

| Layer | Z-Index | Use Case |
|-------|---------|----------|
| Base | 0 | Normal document flow |
| Sticky elements | 10 | Sticky headers, sidebars |
| Dropdowns | 20 | Dropdown menus, popovers |
| Modals | 50 | Dialog modals |
| Toasts | 100 | Toast notifications |

**Pattern:**
```tsx
// Sticky header with shadow
<header className="sticky top-0 z-10 bg-card shadow-[var(--shadow-col)]">
  Header
</header>

// Dropdown with elevation-2
<div className="absolute z-20 bg-card rounded-lg shadow-[var(--elevation-2)] p-4">
  Dropdown content
</div>

// Modal with elevation-3
<div className="fixed inset-0 z-50 flex items-center justify-center">
  <div className="bg-card rounded-xl shadow-[var(--elevation-3)] p-8">
    Modal
  </div>
</div>
```

## Best Practices

### DO

✅ Use elevation tokens (`--elevation-1`, `--elevation-2`, `--elevation-3`)
✅ Combine elevation with stroke for edge definition
✅ Apply `rounded-xl` for cards and panels
✅ Use `transition-shadow duration-150` for hover states
✅ Elevate on hover to signal interactivity
✅ Use `--divider-subtle` for internal divisions
✅ Use `--divider-strong` for section boundaries
✅ Apply avatar micro-elevation for profile images
✅ Use semantic z-index scale for layering

### DON'T

❌ Create custom shadow values outside the system
❌ Use pure black shadows on paper cream backgrounds
❌ Animate box-shadow for complex transitions (use transform)
❌ Apply elevation without stroke (cards need edge definition)
❌ Use excessive rounded corners (stick to scale)
❌ Mix rounded corners (e.g., `rounded-tl-lg rounded-br-xl`)
❌ Forget hover elevation on interactive cards
❌ Use elevation for every element (reserve for surfaces)

## Common Issues & Solutions

### Issue: Shadows look muddy or "sooty" on paper cream background

**Solution:** Use warm-tinted shadow ink matching canvas hue

```css
/* ❌ BAD: Pure black shadows */
box-shadow: 0 4px 8px rgba(0, 0, 0, 0.16);

/* ✅ GOOD: Warm-tinted shadows */
box-shadow: var(--elevation-1);
```

### Issue: Cards don't have clear edges

**Solution:** Combine elevation with stroke

```tsx
// ❌ BAD: Elevation only (soft edges)
<div className="bg-card rounded-xl shadow-[var(--elevation-1)]">
  Content
</div>

// ✅ GOOD: Elevation + stroke (crisp edges)
<div className="bg-card rounded-xl border border-[color:var(--stroke-card)] shadow-[var(--elevation-1)]">
  Content
</div>
```

### Issue: Hover elevation feels abrupt

**Solution:** Add smooth transition

```tsx
// ❌ BAD: No transition (instant change)
<div className="shadow-[var(--elevation-1)] hover:shadow-[var(--elevation-2)]">
  Content
</div>

// ✅ GOOD: Smooth 150ms transition
<div className="shadow-[var(--elevation-1)] hover:shadow-[var(--elevation-2)] transition-shadow duration-150">
  Content
</div>
```

### Issue: Modal doesn't stand out enough

**Solution:** Use elevation-3 with backdrop

```tsx
// ❌ BAD: Modal without backdrop and low elevation
<div className="bg-card rounded-xl shadow-[var(--elevation-1)] p-8">
  Modal
</div>

// ✅ GOOD: Modal with backdrop and elevation-3
<div className="fixed inset-0 z-50 bg-overlay flex items-center justify-center">
  <div className="bg-card rounded-xl shadow-[var(--elevation-3)] p-8">
    Modal
  </div>
</div>
```

### Issue: Rounded corners inconsistent across components

**Solution:** Use radius tokens consistently

```tsx
// ❌ BAD: Custom radius values
<div className="rounded-[10px]">Content</div>
<button className="rounded-[6px]">Action</button>

// ✅ GOOD: Semantic radius tokens
<Card className="rounded-xl">Content</Card>
<button className="rounded-md">Action</button>
```

### Issue: Dividers too prominent or too subtle

**Solution:** Use correct divider token for context

```tsx
// Subtle divider (internal list)
<div className="h-px bg-[color:var(--divider-subtle)]" />

// Strong divider (section boundary)
<div className="h-px bg-[color:var(--divider-strong)]" />

// ❌ BAD: Border utility (doesn't match system)
<div className="border-b" />
```

## CRM-Specific Elevation Patterns

### Pattern 1: Dashboard Widget Cards

Dashboard widgets use elevation-1 with hover transition to elevation-2.

```tsx
<div className="bg-card rounded-xl border border-[color:var(--stroke-card)] shadow-[var(--elevation-1)] hover:shadow-[var(--elevation-2)] transition-shadow duration-150 p-6 cursor-pointer">
  <h3 className="text-sm font-medium text-[color:var(--text-title)] mb-4">
    Opportunities This Week
  </h3>
  <div className="text-2xl font-bold text-[color:var(--text-metric)]">
    23
  </div>
  <p className="text-xs text-[color:var(--text-subtle)] mt-2">
    +12% from last week
  </p>
</div>
```

### Pattern 2: Kanban Board Columns

Kanban columns use internal dividers and sticky headers with column shadows.

```tsx
<div className="flex-shrink-0 w-80 bg-neutral-50 rounded-lg p-3">
  {/* Sticky header with column shadow */}
  <div className="sticky top-0 bg-neutral-50 pb-3 shadow-[var(--shadow-col)] z-10">
    <h3 className="text-sm font-semibold">Qualification</h3>
    <p className="text-xs text-muted-foreground">5 opportunities</p>
  </div>

  {/* Cards with elevation-1 */}
  <div className="space-y-2">
    {opportunities.map(opp => (
      <div
        key={opp.id}
        className="bg-card rounded-lg border border-[color:var(--stroke-card)] shadow-[var(--elevation-1)] p-4"
      >
        {opp.name}
      </div>
    ))}
  </div>
</div>
```

### Pattern 3: Data Tables with Sticky Headers

Tables use column shadows for sticky headers.

```tsx
<div className="overflow-auto">
  <table className="w-full">
    <thead className="sticky top-0 bg-card shadow-[var(--shadow-col)] z-10">
      <tr className="border-b border-[color:var(--divider-strong)]">
        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide py-3 px-4">
          Organization
        </th>
        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide py-3 px-4">
          Value
        </th>
      </tr>
    </thead>
    <tbody>
      {rows.map(row => (
        <tr key={row.id} className="border-b border-[color:var(--divider-subtle)] hover:bg-accent/50">
          <td className="py-3 px-4">{row.name}</td>
          <td className="text-right py-3 px-4">{row.value}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

## Related Resources

- [Color System](color-system.md) - OKLCH color definitions and warm-tinted shadows
- [Design Tokens](design-tokens.md) - Spacing, sizing, and elevation tokens
- [Component Architecture](component-architecture.md) - React component patterns using elevation
- [Typography](typography.md) - Text hierarchy that complements elevation
- [Material Design Elevation](https://m3.material.io/styles/elevation/overview) - Inspiration for elevation system

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
