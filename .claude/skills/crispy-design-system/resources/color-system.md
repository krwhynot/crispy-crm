# Color System (OKLCH)

## Purpose

OKLCH color model provides perceptually uniform colors with built-in accessibility and seamless light/dark mode support. The "Garden to Table" theme uses forest green, clay terracotta, and warm cream for an organic, earthy aesthetic.

## Why OKLCH?

### Perceptual Uniformity

Unlike RGB or HSL, OKLCH maintains consistent perceived brightness across different hues.

```css
/* These appear equally bright to the human eye */
--brand-500: oklch(38% 0.085 142);      /* Forest green */
--accent-clay-500: oklch(63% 0.095 72); /* Clay orange (appears brighter, higher L) */
--success-default: oklch(56% 0.115 155); /* Emerald (even brighter) */
```

**OKLCH Format:** `oklch(L% C H / alpha)`
- **L (Lightness):** 0% (black) to 100% (white)
- **C (Chroma):** 0 (gray) to ~0.4 (vivid color)
- **H (Hue):** 0-360 degrees (red=0°, yellow=90°, green=142°, blue=270°)
- **Alpha:** Optional transparency (0-1)

### Accessibility Built-In

Lightness (L) maps directly to WCAG contrast ratios:

```css
/* White text on forest green = 10.8:1 contrast (WCAG AAA) */
--primary: oklch(38% 0.085 142);
--primary-foreground: oklch(99% 0 0);

/* Predictable contrast: L=97.5% vs L=20% ≈ 17:1 */
--background: oklch(97.5% 0.01 92);
--foreground: oklch(20% 0.012 85);
```

### Light/Dark Mode Ready

Same color definitions work in both modes by adjusting semantic mappings:

```css
/* Light mode */
--background: oklch(97.5% 0.01 92);  /* Paper cream */
--foreground: oklch(20% 0.012 85);   /* Dark text */

/* Dark mode (future) */
--background: oklch(15% 0.01 92);    /* Dark cream */
--foreground: oklch(95% 0.01 85);    /* Light text */
```

## Color Scale Structure

### Brand Colors: Forest Green (Hue 142°)

**Primary brand identity:**

```css
--brand-100: oklch(88% 0.045 142);  /* #C8E6C9 - Very light sage */
--brand-300: oklch(75% 0.065 142);  /* #81C784 - Soft sage */
--brand-500: oklch(38% 0.085 142);  /* #336600 - Forest green (identity) */
--brand-650: oklch(45% 0.09 142);   /* #3D7A00 - Hover state */
--brand-700: oklch(32% 0.08 142);   /* #2B5600 - Darker emphasis */
--brand-750: oklch(28% 0.075 142);  /* #244A00 - Active state */
--brand-800: oklch(24% 0.07 142);   /* #1E3F00 - Darkest pressed */
```

**Tailwind Usage:**

```tsx
// Primary button
<Button className="bg-primary text-primary-foreground">
  {/* bg-primary = --brand-500, text = white */}
  Save Changes
</Button>

// Hover states (semantic mapping)
<Button className="bg-primary hover:bg-primary/90">
  {/* Slightly transparent on hover */}
</Button>

// Focus ring
<Input className="focus:ring-2 focus:ring-ring" />
{/* --ring = oklch(55% 0.095 142) - brightened for visibility */}
```

### Accent Colors: Clay/Terracotta (Hue 72°)

**Warm accent for emphasis:**

```css
--accent-clay-700: oklch(52% 0.105 72); /* #B8640A - Dark clay */
--accent-clay-600: oklch(58% 0.1 72);   /* #C97316 - Medium-dark */
--accent-clay-500: oklch(63% 0.095 72); /* #D97E1F - Clay orange */
--accent-clay-400: oklch(72% 0.08 72);  /* #E9A958 - Light clay */
--accent-clay-300: oklch(82% 0.06 72);  /* #F4D4A8 - Very light */
```

**Usage:**

```tsx
// Accent button
<Button variant="default" className="bg-accent text-accent-foreground">
  {/* Clay orange accent */}
  Featured Action
</Button>

// Badge with accent
<Badge className="bg-accent-clay-500 text-white">
  Priority A
</Badge>
```

### Neutral Colors: Warm Gray (Hue 92°)

**Paper cream undertone throughout:**

```css
--neutral-50: oklch(97.8% 0.008 92);   /* Lightest - card backgrounds */
--neutral-100: oklch(95.5% 0.01 92);   /* Subtle backgrounds */
--neutral-200: oklch(90% 0.005 92);    /* Borders, dividers */
--neutral-300: oklch(84.3% 0.015 85);  /* Inactive elements */
--neutral-400: oklch(71.6% 0.018 85);  /* Muted text */
--neutral-500: oklch(57.7% 0.02 85);   /* Secondary text */
--neutral-600: oklch(46% 0.018 85);    /* Body text */
--neutral-700: oklch(38.1% 0.015 85);  /* Headings */
--neutral-800: oklch(28.5% 0.012 85);  /* Dark text */
--neutral-900: oklch(21.7% 0.01 85);   /* Near black */
--neutral-950: oklch(13.1% 0.008 85);  /* Darkest */
```

**Key Insight:** Hue 92° (warm cream) creates cohesion with the paper cream background (also hue 92°).

**Usage:**

```tsx
// Borders
<Card className="border border-border">
  {/* --border = --neutral-200 */}
</Card>

// Muted text
<p className="text-muted-foreground">
  {/* --muted-foreground = --neutral-400 */}
  Optional description
</p>

// Secondary button
<Button variant="secondary">
  {/* --secondary = --neutral-100, text = --neutral-700 */}
  Cancel
</Button>
```

## Atomic CRM Semantic Palette

**Mandatory semantic utilities per unified design system** (docs/plans/2025-11-16-unified-design-system-rollout.md:295-308):

### Page & Container Backgrounds
- `bg-muted` - Page background (light, airy)
- `bg-card` - Content containers (white, elevated)
- `bg-background` - Nested content (warm cream)

### Interactive & Status
- `bg-primary` - Primary actions (forest green)
- `bg-secondary` - Secondary actions (neutral)
- `bg-destructive` - Delete/error actions
- `bg-success` - Success states
- `bg-warning` - Warning states
- `bg-accent` - Emphasis and highlights

### Text Colors
- `text-foreground` - Primary text (dark, high contrast)
- `text-muted-foreground` - Secondary text (lower emphasis)
- `text-primary` - Brand text (forest green)
- `text-destructive` - Error text

### Borders & Dividers
- `border-border` - Default borders (subtle)
- `border-primary` - Focus/active states
- `border-destructive` - Error states

**NEVER USE:**
- Hex codes: `#FF6600`, `#FEFEF9`
- Inline OKLCH: `text-[color:var(--brand-500)]`
- CSS variable syntax: `bg-[var(--warning)]`

**ALWAYS USE:**
- Semantic utilities: `bg-card`, `text-muted-foreground`, `border-border`

### Premium Interactive Utilities

Reference `src/index.css` for reusable utilities (docs/plans/2025-11-16-unified-design-system-rollout.md:346-398):
- `.card-container` - Standard card with shadow-sm
- `.create-form-card` - Create form elevation (shadow-lg)
- `.interactive-card` - Hover effects + lift animation
- `.table-row-premium` - Table rows with premium styling
- `.focus-ring` - Focus indicators

## Semantic Color Mappings

### Foundation Colors

```css
/* Background: Paper cream (97.5% lightness) */
--background: oklch(97.5% 0.01 92);

/* Foreground: Dark warm text */
--foreground: oklch(20% 0.012 85);

/* Cards: Pure white (100% lightness) */
--card: oklch(100% 0 0);
--card-foreground: var(--neutral-700);

/* Material Layering Principle:
   - Background (97.5%) = Warm cream desk/table surface
   - Cards (100%) = Pure white papers/objects on the surface
   - Delta: 2.5 points provides clear visual separation
*/
```

**Usage:**

```tsx
// Page background (paper cream)
<body className="bg-background text-foreground">

// Card on background (pure white)
<Card className="bg-card text-card-foreground">
  {/* Clear 2.5-point lightness separation */}
</Card>
```

### Interactive Colors

```css
/* Primary: Forest green buttons */
--primary: var(--brand-500);  /* oklch(38% 0.085 142) */
--primary-foreground: oklch(99% 0 0);  /* White text */

/* Secondary: Subtle gray buttons */
--secondary: var(--neutral-100);
--secondary-foreground: var(--neutral-700);

/* Muted: Background for disabled/inactive */
--muted: var(--neutral-200);
--muted-foreground: var(--neutral-400);

/* Accent: Clay orange emphasis */
--accent: var(--accent-clay-500);
--accent-foreground: oklch(0.985 0 0);  /* Near-white */
```

**Button Variants:**

```tsx
<Button variant="default">
  {/* bg-primary, text-primary-foreground */}
  Primary
</Button>

<Button variant="secondary">
  {/* bg-secondary, text-secondary-foreground */}
  Secondary
</Button>

<Button variant="outline">
  {/* border, bg-background, hover:bg-accent */}
  Outline
</Button>

<Button variant="ghost">
  {/* hover:bg-accent, hover:text-accent-foreground */}
  Ghost
</Button>
```

### Status Colors

#### Success (Emerald Green - Hue 155°)

**Differentiated from brand forest green:**

```css
--success-subtle: oklch(92% 0.08 155);
--success-default: oklch(56% 0.115 155);  /* #10B981 - Bright emerald */
--success-strong: oklch(48% 0.12 155);
--success-bg: oklch(95% 0.05 155);
--success-border: oklch(78% 0.09 155);
--success-hover: oklch(60% 0.112 155);
--success-active: oklch(52% 0.117 155);
--success-disabled: oklch(72% 0.06 155);
```

**Usage:**

```tsx
// Success alert
<Alert className="bg-success-bg border-success-border">
  <CheckCircle className="text-success-default" />
  <AlertDescription className="text-success-strong">
    Organization created successfully
  </AlertDescription>
</Alert>

// Success badge
<Badge className="bg-success text-white">
  Active
</Badge>
```

#### Warning (Golden Amber - Hue 85°)

```css
--warning-subtle: oklch(94% 0.055 85);
--warning-default: oklch(68% 0.14 85);
--warning-strong: oklch(58% 0.145 85);
--warning-bg: oklch(96% 0.045 85);
--warning-border: oklch(82% 0.115 85);
--warning-hover: oklch(72% 0.137 85);
--warning-active: oklch(64% 0.142 85);
--warning-disabled: oklch(78% 0.065 85);
```

**Usage:**

```tsx
// Warning message
<Alert variant="warning" className="bg-warning text-warning-foreground">
  <AlertTriangle className="h-4 w-4" />
  <AlertDescription>
    This action cannot be undone
  </AlertDescription>
</Alert>
```

#### Error/Destructive (Terracotta - Hue 25°)

```css
--error-subtle: oklch(92% 0.075 25);
--error-default: oklch(58% 0.13 25);
--error-strong: oklch(48% 0.135 25);
--error-bg: oklch(95% 0.055 25);
--error-border: oklch(80% 0.105 25);
--error-hover: oklch(62% 0.127 25);
--error-active: oklch(54% 0.132 25);
--error-disabled: oklch(72% 0.07 25);

/* Primary destructive mapping */
--destructive: oklch(58% 0.18 27);  /* Slightly lighter for cream bg */
--destructive-foreground: oklch(99% 0 0);
```

**Usage:**

```tsx
// Destructive button
<Button variant="destructive">
  {/* bg-destructive, text-destructive-foreground */}
  Delete Organization
</Button>

// Error message
<Alert variant="destructive">
  <XCircle className="h-4 w-4" />
  <AlertDescription>Failed to save changes</AlertDescription>
</Alert>

// Form error
<p className="text-sm text-destructive">
  {errors.email?.message}
</p>
```

#### Info (Sage-Teal - Hue 200°)

```css
--info-subtle: oklch(94% 0.04 200);
--info-default: oklch(58% 0.065 200);
--info-strong: oklch(48% 0.07 200);
--info-bg: oklch(96% 0.03 200);
--info-border: oklch(80% 0.055 200);
--info-hover: oklch(62% 0.062 200);
--info-active: oklch(54% 0.067 200);
--info-disabled: oklch(72% 0.04 200);
```

**Usage:**

```tsx
// Info alert
<Alert className="bg-info-bg border-info-border">
  <Info className="text-info-default" />
  <AlertDescription className="text-info-strong">
    This organization has 3 branch locations
  </AlertDescription>
</Alert>
```

## Tag Colors (V2: Aggressive Contrast)

**High contrast for better readability on cream background:**

```css
/* Warm tones */
--tag-warm-bg: oklch(87% 0.07 80);
--tag-warm-fg: oklch(20% 0.02 85);

/* Nature tones */
--tag-green-bg: oklch(88% 0.06 155);
--tag-green-fg: oklch(20% 0.02 85);

--tag-teal-bg: oklch(86% 0.05 200);
--tag-teal-fg: oklch(20% 0.02 85);

/* Cool tones */
--tag-blue-bg: oklch(85% 0.06 270);
--tag-blue-fg: oklch(20% 0.02 85);

--tag-purple-bg: oklch(87% 0.06 305);
--tag-purple-fg: oklch(20% 0.02 85);

/* Bright accent */
--tag-yellow-bg: oklch(92% 0.1 110);
--tag-yellow-fg: oklch(20% 0.02 85);

--tag-pink-bg: oklch(89% 0.07 15);
--tag-pink-fg: oklch(20% 0.02 85);

/* Neutral */
--tag-gray-bg: oklch(90% 0.015 85);
--tag-gray-fg: oklch(20% 0.02 85);

/* Earth tones (Garden Theme) */
--tag-clay-bg: oklch(85% 0.075 50);
--tag-clay-fg: oklch(20% 0.02 85);

--tag-sage-bg: oklch(87% 0.05 120);
--tag-sage-fg: oklch(20% 0.02 85);

--tag-amber-bg: oklch(90% 0.08 85);
--tag-amber-fg: oklch(20% 0.02 85);

--tag-cocoa-bg: oklch(83% 0.06 75);
--tag-cocoa-fg: oklch(20% 0.02 85);
```

**Usage:**

```tsx
// ✅ CORRECT - Use semantic utilities for tags
// Organization type badge (use success for customer type)
<Badge className="bg-success/15 text-success">
  Customer
</Badge>

// Priority badge (use warning for medium priority)
<Badge className="bg-warning/15 text-warning">
  Priority B
</Badge>

// Generic tag (use muted background)
<Badge className="bg-muted text-muted-foreground">
  Food Service
</Badge>

// ❌ WRONG - Never use inline CSS variable syntax
// <Badge className="bg-[var(--tag-green-bg)] text-[var(--tag-green-fg)]">
```

## Chart Colors (Earth-Tone Palette)

**MFB Garden Theme for data visualization:**

```css
/* Chart 1: Warm Tan/Soil (Baseline/Benchmark) */
--chart-1: oklch(55% 0.035 60);
--chart-1-fill: oklch(55% 0.035 60);
--chart-1-stroke: oklch(37% 0.035 60);

/* Chart 2: Forest Green (Primary Data) */
--chart-2: oklch(52% 0.095 142);  /* Brightened from brand-500 */
--chart-2-fill: oklch(52% 0.095 142);
--chart-2-stroke: oklch(35% 0.085 142);

/* Chart 3: Clay Orange (Secondary Data) */
--chart-3: oklch(58% 0.105 72);
--chart-3-fill: oklch(58% 0.105 72);
--chart-3-stroke: oklch(42% 0.095 72);

/* Chart 4: Sage Green (Tertiary) */
--chart-4: oklch(60% 0.065 130);
--chart-4-fill: oklch(60% 0.065 130);
--chart-4-stroke: oklch(44% 0.06 130);

/* Chart 5-8: Extended palette */
--chart-5: oklch(62% 0.08 175);   /* Teal */
--chart-6: oklch(58% 0.09 40);    /* Rust */
--chart-7: oklch(64% 0.075 95);   /* Golden */
--chart-8: oklch(56% 0.07 220);   /* Steel blue */

/* Chart UI elements */
--chart-gridline: oklch(88% 0.005 92);
--chart-axis-text: oklch(55% 0.015 85);
--chart-disabled: oklch(75% 0.01 85);
```

**Usage with Recharts:**

```tsx
import { BarChart, Bar } from 'recharts';

<BarChart data={data}>
  <Bar dataKey="baseline" fill="var(--chart-1)" />
  <Bar dataKey="actual" fill="var(--chart-2)" />
  <Bar dataKey="target" fill="var(--chart-3)" />
</BarChart>
```

## Overlay/Backdrop Colors

```css
/* Modal/dialog backdrops */
--overlay: oklch(0 0 0 / 50%);        /* Black 50% for modals */
--overlay-light: oklch(0 0 0 / 30%);  /* Lighter variant */

/* Loading overlays */
--loading-overlay: oklch(100% 0 0 / 60%);  /* White 60% */
```

**Usage:**

```tsx
// Modal backdrop
<div className="fixed inset-0 bg-overlay" />

// Loading spinner overlay
<div className="absolute inset-0 bg-loading-overlay flex items-center justify-center">
  <Spinner />
</div>
```

## Warm-Tinted Shadow System

**Shadows match canvas hue (92°) to prevent "soot" appearance:**

```css
/* Shadow ink: warm-tinted to match paper cream */
--shadow-color: oklch(30% 0.010 92);

/* Elevation 1: Low - Default cards */
--elevation-1:
  0px 1px 2px -1px oklch(30% 0.010 92 / 0.05),
  0px 1px 3px -1px oklch(30% 0.010 92 / 0.10);

/* Elevation 2: Medium - Hover, focused cards */
--elevation-2:
  0px 2px 4px -1px oklch(30% 0.010 92 / 0.06),
  0px 4px 6px -1px oklch(30% 0.010 92 / 0.12);

/* Elevation 3: High - Modals, dropdowns */
--elevation-3:
  0px 10px 15px -3px oklch(30% 0.010 92 / 0.08),
  0px 4px 6px -2px oklch(30% 0.010 92 / 0.10);

/* Stroke system: 1px subtle definition */
--stroke-card: oklch(93% 0.005 92 / 0.5);
```

**Benefits:**
- Warm shadows harmonize with cream background
- No visual dissonance (no "cold" gray shadows)
- Natural depth perception
- Reduced eye strain

## Text Hierarchy (Warm-Tinted)

**Complete warm color story:**

```css
--text-title: oklch(22% 0.01 92);     /* Headings */
--text-metric: oklch(18% 0.01 92);    /* Numbers/emphasis */
--text-body: oklch(29% 0.008 92);     /* Body text (warm brown) */
--text-subtle: oklch(41% 0.006 92);   /* Metadata (warm gray) */
```

**Usage:**

```tsx
// ✅ Page title (use semantic utility)
<h1 className="text-foreground text-2xl font-bold">
  Organizations
</h1>

// ✅ Metric/number (use semantic utility)
<div className="text-foreground text-3xl font-bold">
  $1.2M
</div>

// ✅ Body text (use semantic utility)
<p className="text-foreground text-sm">
  Regular paragraph content with warm undertone
</p>

// ✅ Metadata (use semantic utility)
<span className="text-muted-foreground text-xs">
  Updated 2 hours ago
</span>

// ❌ WRONG - Never use inline CSS variable syntax
<p className="text-[color:var(--text-body)]">Bad pattern</p>
```

## Accessibility Considerations

### WCAG Contrast Ratios

All color combinations meet WCAG AA (4.5:1 for text):

```css
/* Primary button: 10.8:1 (WCAG AAA) */
bg-primary (L=38%) + text-primary-foreground (L=99%) = 10.8:1 ✅

/* Body text: 17:1 (WCAG AAA) */
bg-background (L=97.5%) + text-foreground (L=20%) = ~17:1 ✅

/* Muted text: 5.2:1 (WCAG AA) */
bg-background (L=97.5%) + text-muted-foreground (L=71.6%) = ~5.2:1 ✅
```

### Color Blindness

OKLCH's perceptual uniformity helps with color blindness:
- Lightness differences are perceivable to all
- Avoid relying solely on hue (use icons + text)
- Success/error states use both color AND iconography

**Good Pattern:**

```tsx
// ✅ Uses color + icon + text
<Alert variant="success">
  <CheckCircle className="h-4 w-4" />  {/* Icon */}
  <AlertTitle>Success</AlertTitle>      {/* Text */}
  <AlertDescription>Changes saved</AlertDescription>
</Alert>

// ❌ Color only (insufficient)
<div className="bg-success-bg">Changes saved</div>
```

## Performance Notes

- OKLCH is native CSS (zero runtime cost)
- Browser support: All modern browsers (2023+)
- Fallback: Not needed for Atomic CRM (target: iPad Safari, Chrome)
- Color calculations: Compile-time only (Tailwind)

## Best Practices

### DO
✅ Use semantic color utilities (`text-muted-foreground`, `bg-primary`)
✅ Maintain WCAG AA contrast (4.5:1 for text)
✅ Use status colors with icons + text (not color alone)
✅ Keep warm undertone throughout (hue 92° family)
✅ Use OKLCH for all custom colors
✅ Test on cream background (`--background`)
✅ Use elevation system for depth (not color alone)

### DON'T
❌ Use hex codes (`#336600`) - use semantic tokens
❌ Use inline CSS variable syntax (`text-[color:var(--brand-500)]`)
❌ Create low-contrast combinations (<4.5:1 text)
❌ Mix cool grays with warm cream (visual dissonance)
❌ Use RGB/HSL (not perceptually uniform)
❌ Rely on color alone for meaning
❌ Skip accessibility testing

## Common Issues & Solutions

### Issue: Color looks different than expected

**Solution:** OKLCH is perceptually uniform, not RGB-equivalent

```css
/* These have same lightness (L=50%) but different perceived brightness */
--red: oklch(50% 0.18 27);    /* Appears brighter (high chroma) */
--gray: oklch(50% 0 0);       /* Appears darker (zero chroma) */
```

### Issue: Text contrast too low

**Solution:** Use color contrast checker

```tsx
// ❌ BAD: Low contrast (3.2:1)
<p className="text-neutral-400">  {/* L=71.6% on L=97.5% */}

// ✅ GOOD: High contrast (5.2:1)
<p className="text-neutral-500">  {/* L=57.7% on L=97.5% */}
```

### Issue: Shadows look "cold" or "sooty"

**Solution:** Match shadow hue to background

```css
/* ❌ BAD: Cold gray shadow (hue 0) */
box-shadow: 0 2px 4px oklch(0 0 0 / 0.1);

/* ✅ GOOD: Warm shadow (hue 92) */
box-shadow: 0 2px 4px oklch(30% 0.010 92 / 0.1);
```

## Related Resources

- [Design Tokens](design-tokens.md) - Spacing and sizing tokens
- [Typography](typography.md) - Font sizing and text colors
- [Elevation](elevation.md) - Shadow system details
- [Component Architecture](component-architecture.md) - Using colors in components
