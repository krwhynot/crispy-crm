# Brand & Accent Colors

Complete scales for Atomic CRM's primary brand identity (forest green) and warm accent (clay terracotta).

## Brand Colors: Forest Green (Hue 142°)

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

### Brand Color Scale Characteristics

- **Hue 142°:** Pure forest green, differentiates from emerald success (155°)
- **Lightness range:** 24-88% (dark pressed to light backgrounds)
- **Chroma:** 0.045-0.09 (muted earth tone, not neon)
- **Primary identity:** --brand-500 (38% lightness) with 10.8:1 contrast on white

## Accent Colors: Clay/Terracotta (Hue 72°)

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

// Accent highlight in text
<span className="text-accent font-semibold">
  Important note
</span>
```

### Accent Color Scale Characteristics

- **Hue 72°:** Warm clay/terracotta, complements forest green
- **Lightness range:** 52-82% (medium-dark to very light)
- **Chroma:** 0.06-0.105 (higher saturation than brand for visibility)
- **Primary accent:** --accent-clay-500 (63% lightness)

## Neutral Colors: Warm Gray (Hue 92°)

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

### Neutral Color Scale Characteristics

- **Hue 85-92°:** Warm cream undertone matches background
- **Lightness range:** 13.1-97.8% (near black to near white)
- **Chroma:** 0.005-0.02 (very low saturation, warm-tinted grays)
- **Prevents dissonance:** No cool grays that clash with cream background

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

## Best Practices

### Brand Colors

✅ Use `bg-primary` for primary CTAs
✅ Use `text-primary` for brand-colored text
✅ Use hover/active states from semantic mappings (`hover:bg-primary/90`)
✅ Maintain 4.5:1 contrast minimum on all backgrounds

❌ Don't use brand colors for status (use success/warning/error)
❌ Don't mix forest green (142°) with emerald success (155°) in same context
❌ Don't use brand colors at full saturation on cream background

### Accent Colors

✅ Use for emphasis, highlights, and secondary CTAs
✅ Use sparingly - accent means "stands out"
✅ Pair with brand green for balanced palette
✅ Use lighter shades (300-400) for backgrounds

❌ Don't use accent as primary brand color
❌ Don't overuse - loses impact if everywhere
❌ Don't use dark clay (700) on dark backgrounds

### Neutral Colors

✅ Use for text hierarchy (foreground/muted-foreground)
✅ Use for borders, dividers, and backgrounds
✅ Maintain warm undertone (hue 85-92°)
✅ Use neutral-200 for subtle borders

❌ Don't use pure black (#000000)
❌ Don't use pure white (#FFFFFF) for text
❌ Don't mix with cool grays from other systems
