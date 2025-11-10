# Design System

**Status:** Living Document | **Last Updated:** 2025-11-09
**Owner:** Architecture Team | **Scope:** All UI Development

## Overview

This document defines the complete design system for Atomic CRM, ensuring visual consistency across all components, pages, and user interactions. The system is built on **semantic design tokens** using OKLCH color space, **Tailwind CSS v4**, and **iPad-first responsive design**.

**Core Philosophy:**
- **Semantic over literal** - Use meaning (`--primary`) not implementation (`--green-700`)
- **Single source of truth** - All design decisions centralized in `src/index.css`
- **Accessibility first** - WCAG AA minimum (4.5:1 contrast for text)
- **iPad-optimized** - Design for 768-1024px viewport first, adapt up and down

---

## Color System

### Architecture

The color system uses a **three-tier hierarchical architecture**:

```
Brand Colors (OKLCH) → Semantic Tokens → Component Usage
```

**Tier 1: Brand Colors** - Foundation palette in OKLCH format
**Tier 2: Semantic Tokens** - Intent-based mappings (`--primary`, `--destructive`)
**Tier 3: Component Consumption** - Tailwind utilities and CSS variables

### Brand Colors

**Primary Brand: Forest Green (hue 142°)**

```css
--brand-100: oklch(88% 0.045 142);  /* #C8E6C9 - Very light sage */
--brand-300: oklch(75% 0.065 142);  /* #81C784 - Soft sage */
--brand-500: oklch(38% 0.085 142);  /* #336600 - Forest green (identity) */
--brand-650: oklch(45% 0.090 142);  /* #3D7A00 - Hover state */
--brand-700: oklch(32% 0.080 142);  /* #2B5600 - Darker emphasis */
--brand-750: oklch(28% 0.075 142);  /* #244A00 - Active state */
--brand-800: oklch(24% 0.070 142);  /* #1E3F00 - Darkest */
```

**Accent: Clay/Terracotta (hue 72°)**

```css
--accent-clay-700: oklch(52% 0.105 72);  /* #B8640A - Dark clay */
--accent-clay-600: oklch(58% 0.100 72);  /* #C97316 - Medium clay */
--accent-clay-500: oklch(63% 0.095 72);  /* #D97E1F - Clay orange */
--accent-clay-400: oklch(72% 0.080 72);  /* #E9A958 - Light clay */
--accent-clay-300: oklch(82% 0.060 72);  /* #F4D4A8 - Very light clay */
```

**Neutrals: Paper Cream (hue 92° for consistency)**

```css
--neutral-50:  oklch(97.8% 0.008 92);  /* Lightest */
--neutral-100: oklch(95.5% 0.010 92);
--neutral-200: oklch(90% 0.005 92);
--neutral-300: oklch(84.3% 0.015 85);
--neutral-400: oklch(71.6% 0.018 85);
--neutral-500: oklch(57.7% 0.020 85);
--neutral-600: oklch(46.0% 0.018 85);
--neutral-700: oklch(38.1% 0.015 85);
--neutral-800: oklch(28.5% 0.012 85);
--neutral-900: oklch(21.7% 0.010 85);
--neutral-950: oklch(13.1% 0.008 85);
```

### Semantic Tokens

**Foundation Colors:**

```css
--background: oklch(97.5% 0.010 92);     /* Paper cream */
--foreground: oklch(20% 0.012 85);       /* Dark text */
--card: oklch(100% 0 0);                 /* Pure white cards */
--card-foreground: var(--neutral-700);   /* Card text */
```

**Interactive Colors:**

```css
--primary: var(--brand-500);              /* Forest green CTA */
--primary-foreground: oklch(99% 0 0);     /* White on primary */
--secondary: var(--neutral-100);          /* Secondary buttons */
--secondary-foreground: var(--neutral-700);
--accent: var(--accent-clay-500);         /* Clay accent */
--accent-foreground: oklch(0.985 0 0);
--destructive: oklch(58% 0.180 27);       /* Terracotta */
--destructive-foreground: oklch(99% 0 0);
```

**State Colors:**

```css
/* Success (emerald green - hue 155°) */
--success-default: oklch(56% 0.115 155);
--success-hover: oklch(60% 0.112 155);
--success-bg: oklch(95% 0.05 155);

/* Warning (golden amber - hue 85°) */
--warning-default: oklch(68% 0.140 85);
--warning-hover: oklch(72% 0.137 85);
--warning-bg: oklch(96% 0.045 85);

/* Info (sage-teal - hue 200°) */
--info-default: oklch(58% 0.065 200);
--info-hover: oklch(62% 0.062 200);
--info-bg: oklch(96% 0.030 200);

/* Error (terracotta - hue 25°) */
--error-default: oklch(58% 0.130 25);
--error-hover: oklch(62% 0.127 25);
--error-bg: oklch(95% 0.055 25);
```

### Usage Patterns

**✅ CORRECT - Semantic Utility Classes (Preferred):**

```tsx
className="bg-primary text-primary-foreground hover:bg-primary/90"
className="text-muted-foreground bg-warning border-border"
```

**✅ ACCEPTABLE - CSS Variable Syntax (For Dynamic Values):**

```tsx
className="shadow-[var(--elevation-2)]"
style={{ borderBottom: `2px solid var(--success-default)` }}
```

**❌ NEVER - Hardcoded Colors:**

```tsx
className="text-[#336600]"  /* NO - bypasses design system */
style={{ color: 'oklch(38% 0.085 142)' }}  /* NO - duplicates definition */
```

### Color Mapping Reference

| **Old/Inline Syntax** | **Semantic Utility** |
|-----------------------|----------------------|
| `text-[color:var(--text-subtle)]` | `text-muted-foreground` |
| `text-[color:var(--text-primary)]` | `text-foreground` |
| `bg-[var(--warning-default)]` | `bg-warning` |
| `bg-[var(--brand-500)]` | `bg-primary` |
| `border-[color:var(--stroke-card)]` | `border-border` |

### Dark Mode

Dark mode is implemented via `.dark` class selector on `<html>`. All semantic tokens automatically adapt:

- Neutrals invert (50↔900, 100↔800)
- Brand colors adjust lightness for dark backgrounds
- Tags remain same (high-contrast light backgrounds on dark)

---

## Typography

### Font Family

```css
--font-sans: 'Nunito', 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
```

**Application:** Applied globally via `@layer base { body { font-family: var(--font-sans); } }`

### Text Hierarchy

Semantic text color tokens for clear visual priority:

```css
--text-metric: oklch(18% 0.01 92);   /* Numbers, emphasis - darkest */
--text-title: oklch(22% 0.01 92);    /* Headings - very dark */
--text-body: oklch(29% 0.008 92);    /* Standard body text */
--text-subtle: oklch(41% 0.006 92);  /* Timestamps, metadata */
```

**Usage:**

```tsx
<h2 className="text-[color:var(--text-title)] font-semibold">Widget Title</h2>
<p className="text-[color:var(--text-body)]">Body content here</p>
<span className="text-[color:var(--text-subtle)] text-sm">Updated 2h ago</span>
```

### Type Scale

Use Tailwind's default type scale with semantic modifiers:

- `text-sm` - 14px (minimum for iPad touch)
- `text-base` - 16px (standard body)
- `text-lg` - 18px (emphasized content)
- `text-xl` to `text-3xl` - Headings

---

## Spacing & Layout

### Spacing Tokens

All spacing uses semantic CSS custom properties defined in `@theme` layer:

**Grid System:**

```css
--spacing-grid-columns-desktop: 12;
--spacing-grid-columns-ipad: 8;
--spacing-gutter-desktop: 24px;
--spacing-gutter-ipad: 20px;
```

**Edge Padding (Screen Borders):**

```css
--spacing-edge-desktop: 120px;  /* 1440px+ */
--spacing-edge-ipad: 60px;      /* 768-1024px */
--spacing-edge-mobile: 16px;    /* 375-767px */
```

**Vertical Rhythm:**

```css
--spacing-section: 32px;     /* Between major sections */
--spacing-widget: 24px;      /* Card-to-card, row spacing */
--spacing-content: 16px;     /* Within cards, between elements */
--spacing-compact: 12px;     /* Tight groupings */
```

**Widget/Card Internals:**

```css
--spacing-widget-padding: 20px;
--spacing-widget-min-height: 280px;
--spacing-top-offset: 80px;  /* Space below navbar */
```

### Usage Patterns

**Edge Padding (Responsive):**

```tsx
className="
  px-[var(--spacing-edge-mobile)]
  md:px-[var(--spacing-edge-ipad)]
  lg:px-[var(--spacing-edge-desktop)]
"
```

**Vertical Rhythm:**

```tsx
<div className="space-y-[var(--spacing-section)]">  {/* Major sections */}
  <Header />
  <div className="space-y-[var(--spacing-widget)]">  {/* Cards */}
    <Card className="p-[var(--spacing-widget-padding)]">
      <div className="space-y-[var(--spacing-content)]">  {/* Content */}
        <h3>Title</h3>
        <p>Body</p>
      </div>
    </Card>
  </div>
</div>
```

**Grid System:**

```tsx
{/* 12-column desktop grid */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--spacing-gutter-desktop)]">
  <div className="lg:col-span-8">{/* Main: 66% */}</div>
  <div className="lg:col-span-4">{/* Sidebar: 33% */}</div>
</div>

{/* 3-column stats grid */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--spacing-widget)]">
  <StatCard />
  <StatCard />
  <StatCard />
</div>
```

---

## Responsive Design

### Breakpoints

```css
md: 768px   /* iPad landscape threshold */
lg: 1024px  /* Desktop threshold */
xl: 1440px  /* Wide desktop (optional enhancements) */
```

### iPad-First Strategy

**Design Thinking:** Optimize for 768-1024px viewport first, then adapt:

1. **Design on iPad** - Prototype at 768-1024px
2. **Optimize `md:` breakpoint** - iPad landscape (768px) is primary
3. **Test iPad portrait** - Ensure `lg:` (1024px) works
4. **Adapt mobile** - Base styles are fallback, not primary
5. **Enhance desktop** - `xl:` adds improvements if helpful

**Pattern:**

```tsx
className="
  grid-cols-1           /* Mobile: stacked */
  md:grid-cols-3        /* iPad: 3-column */
  lg:grid-cols-4        /* Desktop: 4-column */

  p-4                   /* Mobile: compact */
  md:p-6                /* iPad: spacious */
  lg:p-8                /* Desktop: generous */
"
```

### Viewport Testing Requirements

All UI must be tested at these viewports:

- **Mobile:** 375px (iPhone SE)
- **iPad Portrait:** 768px
- **iPad Landscape:** 1024px
- **Desktop:** 1440px

---

## Elevation & Shadows

### Shadow System

Warm-tinted dual-layer shadows using `--shadow-ink`:

```css
--shadow-ink: oklch(30% 0.010 92);  /* Warm brown, matches paper cream */

--elevation-1:  /* Static cards, widgets */
  0 1px 2px 0 var(--shadow-ink) / 0.10,
  0 4px 8px -2px var(--shadow-ink) / 0.16;

--elevation-2:  /* Interactive hover, important panels */
  0 2px 3px 0 var(--shadow-ink) / 0.12,
  0 8px 16px -4px var(--shadow-ink) / 0.18;

--elevation-3:  /* Modals, floating menus */
  0 3px 6px -2px var(--shadow-ink) / 0.14,
  0 16px 24px -8px var(--shadow-ink) / 0.20;
```

### Stroke System

Hairline borders for card edge definition:

```css
--stroke-card: oklch(93% 0.004 92);         /* 1px border */
--stroke-card-hover: oklch(91% 0.006 92);   /* Darker on hover */
```

**Usage:**

```tsx
<Card className="border border-[color:var(--stroke-card)] shadow-[var(--elevation-1)]">
  {/* Pure white card elevated from paper cream background */}
</Card>
```

---

## Border Radius

### Radius System

```css
--radius: 0.5rem;  /* 8px - MFB organic aesthetic */

--radius-sm: calc(var(--radius) - 4px);  /* 4px */
--radius-md: calc(var(--radius) - 2px);  /* 6px */
--radius-lg: var(--radius);              /* 8px */
--radius-xl: calc(var(--radius) + 4px);  /* 12px */
```

**Tailwind Utilities:**

```tsx
className="rounded-md"    /* 6px - most UI elements */
className="rounded-lg"    /* 8px - cards, panels */
className="rounded-xl"    /* 12px - prominent cards */
className="rounded-full"  /* Avatars, pills */
```

---

## Accessibility

### Minimum Standards (WCAG AA)

**Text Contrast:**
- **Normal text:** 4.5:1 minimum
- **Large text (18px+):** 3.0:1 minimum
- **Focus indicators:** 3.0:1 minimum

**Touch Targets (iPad-optimized):**
- **Minimum:** 44x44px (Apple HIG)
- **Tailwind:** `w-11 h-11` (44px) or larger

**Example:**

```tsx
<button className="w-11 h-11 md:w-12 md:h-12">  {/* 44px → 48px */}
  <Icon className="w-6 h-6" />
</button>
```

### Focus States

All interactive elements use semantic focus ring:

```css
--ring: oklch(55% 0.095 142);  /* Brightened forest green */
```

**Pattern (built into components):**

```tsx
className="focus-visible:ring-ring/50 focus-visible:ring-[3px]"
```

### Semantic HTML Requirements

- Use `<button>` not `<div onClick>`
- All form inputs have labels (visible or `sr-only`)
- Logical tab order
- `aria-invalid` for form errors

---

## Component Design Patterns

### Material Layering Principle

Background hierarchy creates depth perception:

```
Background (97.5% lightness) = Paper cream desk surface
├─ Cards (100% white) = Papers/objects on surface
│  ├─ Shadows = Natural light
│  └─ Strokes = Edge definition
└─ Text Hierarchy = Visual priority
```

**Implementation:**

```tsx
<main className="bg-background">  {/* Paper cream */}
  <Card className="bg-card border-[color:var(--stroke-card)] shadow-[var(--elevation-1)]">
    {/* Pure white elevated card */}
    <h3 className="text-[color:var(--text-title)]">Title</h3>
    <p className="text-[color:var(--text-body)]">Content</p>
  </Card>
</main>
```

### Card Pattern

Standard card structure:

```tsx
<Card>  {/* Auto: rounded-xl, border, shadow, bg-card */}
  <CardHeader>
    <CardTitle>Widget Name</CardTitle>
    <CardDescription>Subtitle or metadata</CardDescription>
    <CardAction><Button size="sm">Action</Button></CardAction>
  </CardHeader>
  <CardContent>
    {/* Main content with 16px spacing */}
  </CardContent>
  <CardFooter>
    {/* Optional footer */}
  </CardFooter>
</Card>
```

### Button Variants

```tsx
<Button variant="default">Primary CTA</Button>      {/* Forest green */}
<Button variant="secondary">Secondary</Button>      {/* Light neutral */}
<Button variant="destructive">Delete</Button>       {/* Terracotta */}
<Button variant="outline">Outlined</Button>         {/* Border only */}
<Button variant="ghost">Ghost</Button>              {/* No background */}
```

**Sizes:**

```tsx
<Button size="default">  {/* h-12 px-6 - 48px tall */}
<Button size="sm">       {/* h-12 px-4 - compact */}
<Button size="lg">       {/* h-12 px-8 - spacious */}
<Button size="icon">     {/* size-12 - square 48px */}
```

### Tag Pattern

High-contrast tags with borders:

```tsx
<span className="tag-green">  {/* Predefined tag classes */}
  Active
</span>
```

**Available tag colors:** warm, green, teal, blue, purple, yellow, gray, pink, clay, sage, amber, cocoa

---

## Chart Colors

Earth-tone palette for data visualization:

```css
--chart-1: oklch(55% 0.035 60);    /* Warm tan (baseline) */
--chart-2: oklch(52% 0.095 142);   /* Forest green (our data) */
--chart-3: oklch(63% 0.095 72);    /* Clay (revenue) */
--chart-4: oklch(60% 0.060 138);   /* Sage (secondary) */
--chart-5: oklch(70% 0.125 85);    /* Amber (warning) */
--chart-6: oklch(58% 0.065 180);   /* Sage-teal */
--chart-7: oklch(48% 0.065 295);   /* Eggplant */
--chart-8: oklch(50% 0.012 85);    /* Mushroom gray */
```

Each chart color has `-fill` and `-stroke` variants for AA contrast.

---

## Validation Tools

### Automated Validation

```bash
npm run validate:colors  # WCAG contrast checks
```

**Validates:**
- Text contrast (4.5:1 minimum)
- Focus ring contrast (3.0:1 minimum)
- Tag foreground/background pairs
- Both light and dark modes

### Manual Checklist

Before committing UI work:

- [ ] No hardcoded hex/OKLCH values
- [ ] Semantic utilities used (`bg-primary` not `bg-[var(--brand-500)]`)
- [ ] Touch targets ≥ 44px (`w-11 h-11` minimum)
- [ ] Tested on iPad (768px, 1024px)
- [ ] Focus states visible
- [ ] Text contrast passes WCAG AA

---

## Common Anti-Patterns

### ❌ Inline CSS Variable Syntax

```tsx
{/* WRONG - Bypasses Tailwind type safety */}
className="text-[color:var(--text-subtle)]"

{/* RIGHT - Use semantic utilities */}
className="text-muted-foreground"
```

### ❌ Mobile-First on iPad App

```tsx
{/* WRONG - Cramped on iPad */}
className="p-2 md:p-4"  /* Too small on mobile, mediocre on iPad */

{/* RIGHT - iPad-optimized */}
className="p-4 md:p-6 lg:p-8"  /* Generous from start */}
```

### ❌ Small Touch Targets

```tsx
{/* WRONG - Below 44px minimum */}
<button className="w-10 h-10">  /* 40px */}

{/* RIGHT - 44px+ */}
<button className="w-11 h-11 md:w-12 md:h-12">  /* 44px → 48px */}
```

### ❌ Hardcoded Spacing

```tsx
{/* WRONG - Magic numbers */}
className="mb-6 p-4"

{/* RIGHT - Semantic tokens */}
className="mb-[var(--spacing-widget)] p-[var(--spacing-widget-padding)]"
```

---

## File Locations

| **Concern** | **File Path** |
|-------------|---------------|
| Color definitions | `src/index.css` (lines 140-642) |
| Spacing tokens | `src/index.css` (lines 72-96) |
| Tailwind config | `tailwind.config.ts` |
| UI components | `src/components/ui/` |
| Validation script | `scripts/validate-colors.js` |

---

## Related Documentation

- [Engineering Constitution](../claude/engineering-constitution.md) - Core principles
- [Spacing & Layout System Design](../plans/2025-11-08-spacing-layout-system-design.md) - Detailed spacing spec
- [Color Theming Architecture](../internal-docs/color-theming-architecture.docs.md) - Complete color system
- [UI Design Consistency](.claude/skills/ui-design-consistency/SKILL.md) - Implementation patterns
