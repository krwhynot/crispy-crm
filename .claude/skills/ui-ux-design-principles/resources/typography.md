# Typography

## Purpose

Define the typography system for Atomic CRM including font families, sizing scale, weights, line heights, semantic text colors, and hierarchy patterns that create clear visual distinction and excellent readability on all devices.

## Core Principle: Warm-Tinted Typographic Hierarchy

Typography in Atomic CRM uses OKLCH-based warm text colors (hue 92° matching the paper cream background) to create a cohesive, natural reading experience. The system provides four semantic text tokens that handle all use cases without requiring direct color values.

**From `src/index.css`:**

```css
:root {
  /* Font Family */
  --font-sans: "Nunito", "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;

  /* Semantic Text Colors - Warm-tinted OKLCH (hue 92°) */
  --text-title: oklch(22% 0.01 92);    /* Widget titles, headings - darker with warm tint */
  --text-metric: oklch(18% 0.01 92);   /* Metric numbers - darkest for emphasis */
  --text-body: oklch(29% 0.008 92);    /* Standard body text - warm brown */
  --text-subtle: oklch(41% 0.006 92);  /* Timestamps, metadata - maintains readability with warmth */
}

.dark {
  /* Inverted hierarchy for dark mode */
  --text-metric: oklch(97% 0.002 287);  /* Numbers/emphasis - brightest (15:1 contrast) */
  --text-title: oklch(90% 0.004 286);   /* Headings - very light (12:1 contrast) */
  --text-body: oklch(88% 0.005 285);    /* Standard body text (11:1 contrast) */
  --text-subtle: oklch(80% 0.007 285);  /* Timestamps, metadata (8:1 contrast) */
}
```

**Why this works:**
- Semantic tokens (`--text-title`, `--text-body`) instead of neutral shades
- OKLCH ensures perceptual consistency across hierarchy
- Warm undertones (hue 92°) prevent harsh black-on-white contrast
- Automatic dark mode inversion with maintained contrast ratios

## Heading Hierarchy

**Per unified design system** (docs/archive/plans/2025-11-16-unified-design-system-rollout.md:298-308):

### Standard Heading Scale

```tsx
// ✅ CORRECT - Use semantic utilities + Tailwind sizes
<h1 className="text-xl font-semibold text-primary">
  Page Title
</h1>

<h2 className="text-lg font-semibold text-foreground">
  Section Heading
</h2>

<h3 className="text-base font-semibold text-foreground">
  Subsection
</h3>

// ❌ WRONG - Never use inline CSS variable syntax
// text-[color:var(--text-title)] text-xl font-semibold
```

### Heading Styles by Context

| Context | Size | Weight | Color | Example |
|---------|------|--------|-------|---------|
| Page Title (H1) | text-xl | font-semibold | text-primary | Page headers, modal titles |
| Section Heading (H2) | text-lg | font-semibold | text-foreground | Section dividers in forms |
| Subsection (H3) | text-base | font-semibold | text-foreground | Card subtitles |
| Body Text | text-sm | font-normal | text-foreground | Paragraphs, labels |
| Metadata | text-xs | font-normal | text-muted-foreground | Timestamps, hints |

### Quick Logger vs Slide-Over Headers

**Slide-over headers (ResourceSlideOver):**
```tsx
<h1 className="text-xl font-semibold text-primary">
  Record Title
</h1>
```

**Create form headers:**
```tsx
<h1 className="text-xl font-semibold text-foreground">
  New Contact
</h1>
```

## Typography Scale

Tailwind CSS provides a modular scale optimized for UI. Atomic CRM uses this scale consistently.

### Size Reference

| Token | Tailwind Class | Font Size | Line Height | Use Case |
|-------|---------------|-----------|-------------|----------|
| `text-xs` | `text-xs` | 12px (0.75rem) | 16px (1rem) | Timestamps, fine print, metadata |
| `text-sm` | `text-sm` | 14px (0.875rem) | 20px (1.25rem) | Card titles, labels, secondary text |
| `text-base` | `text-base` | 16px (1rem) | 24px (1.5rem) | Body text (default) |
| `text-lg` | `text-lg` | 18px (1.125rem) | 28px (1.75rem) | Prominent body text, short headings |
| `text-xl` | `text-xl` | 20px (1.25rem) | 28px (1.75rem) | Page headings, section titles |
| `text-2xl` | `text-2xl` | 24px (1.5rem) | 32px (2rem) | Metric values, large numbers |
| `text-3xl` | `text-3xl` | 30px (1.875rem) | 36px (2.25rem) | Dashboard headers |
| `text-4xl` | `text-4xl` | 36px (2.25rem) | 40px (2.5rem) | Hero headlines (rare) |

**Pattern:**
```tsx
// ✅ GOOD: Using Tailwind scale
<h1 className="text-3xl font-bold">Dashboard</h1>
<p className="text-base text-body">Standard body copy.</p>
<span className="text-xs text-subtle">Last updated 5 minutes ago</span>

// ❌ BAD: Custom pixel values
<h1 style={{ fontSize: '35px' }}>Dashboard</h1>
```

## Font Weights

Atomic CRM uses four standard weights from the Nunito font family.

### Weight Reference

| Tailwind Class | Font Weight | Use Case |
|----------------|-------------|----------|
| `font-normal` | 400 | Body text, descriptions |
| `font-medium` | 500 | Card titles, labels, slight emphasis |
| `font-semibold` | 600 | Section headings, buttons, strong emphasis |
| `font-bold` | 700 | Metric values, primary headings |

**Pattern:**
```tsx
// ✅ GOOD: Semantic weight usage
<h2 className="text-xl font-semibold">Section Title</h2>
<p className="text-sm font-medium">Card Title</p>
<div className="text-2xl font-bold">$125,000</div>

// ❌ BAD: Inconsistent weights
<h2 style={{ fontWeight: 650 }}>Section Title</h2>
```

## Semantic Text Colors

Use semantic color tokens (NOT direct color values) for all text.

### Text Hierarchy Tokens

```css
/* Light Mode */
--text-metric: oklch(18% 0.01 92);   /* Darkest - for numbers that need maximum emphasis */
--text-title: oklch(22% 0.01 92);    /* Dark - for headings and widget titles */
--text-body: oklch(29% 0.008 92);    /* Standard - for paragraph text */
--text-subtle: oklch(41% 0.006 92);  /* Light - for timestamps and metadata */
```

**Direct CSS Usage:**
```tsx
// ✅ GOOD: Semantic text colors
<div className="text-[color:var(--text-title)]">Opportunities by Principal</div>
<p className="text-[color:var(--text-body)]">Standard body copy goes here.</p>
<span className="text-[color:var(--text-subtle)]">Last updated 5 minutes ago</span>
<div className="text-[color:var(--text-metric)] text-2xl font-bold">$125,000</div>

// ❌ BAD: Direct OKLCH or hex values
<div style={{ color: 'oklch(22% 0.01 92)' }}>Title</div>
<p style={{ color: '#333' }}>Body</p>
```

**With Tailwind Semantic Classes:**

When using React Admin or shadcn components, prefer Tailwind's semantic classes:

```tsx
// ✅ GOOD: Semantic Tailwind classes
<CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
<p className="text-muted-foreground">Supporting text or description</p>

// ✅ ALSO GOOD: Direct semantic token
<CardTitle className="text-[color:var(--text-title)]">Total Revenue</CardTitle>
```

## Typography Patterns

### Pattern 1: Card Titles

Card titles use small, medium-weight text for clean, understated headers.

**From `src/components/ui/card.tsx`:**

```typescript
function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold text-[color:var(--text-title)]", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-[color:var(--text-subtle)] text-sm", className)}
      {...props}
    />
  );
}
```

**Usage:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Total Revenue</CardTitle>
    <CardDescription>Year to date performance</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

### Pattern 2: KPI Metric Display

Metrics use large, bold text with the darkest semantic token for maximum emphasis.

**From `src/atomic-crm/reports/components/KPICard.tsx`:**

```typescript
export function KPICard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  subtitle,
}: KPICardProps) {
  const trendColor = trend === 'up' ? 'text-success' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground';
  const changePrefix = change && change > 0 ? '+' : '';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        {/* Large metric value */}
        <div className="text-2xl font-bold">{value}</div>

        {/* Supporting subtitle */}
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}

        {/* Trend indicator */}
        {change !== undefined && (
          <p className={cn("text-xs mt-2", trendColor)}>
            {changePrefix}{change}%
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

**Key Details:**
- Title: `text-sm font-medium` for understated label
- Value: `text-2xl font-bold` for prominent metric
- Subtitle: `text-xs text-muted-foreground` for supporting info
- Change: `text-xs` with semantic color (success/destructive)

### Pattern 3: Page Headers

Page headers use extra-large, bold text for primary navigation context.

**From `src/atomic-crm/dashboard/CompactDashboardHeader.tsx`:**

```typescript
<div className="h-8 flex items-center justify-between px-3 bg-white border-b">
  <h1 className="text-xl font-semibold text-gray-900">
    Principal Dashboard - Week of {currentDate}
  </h1>
  <div className="flex gap-2">
    <button className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors">
      Refresh
    </button>
    <button className="px-3 py-1 text-sm bg-primary text-white hover:bg-primary/90 rounded transition-colors">
      Quick Log
    </button>
  </div>
</div>
```

**Pattern:**
- H1: `text-xl font-semibold` for main page title
- Buttons: `text-sm` for compact action labels

### Pattern 4: Data Table Headers

Table headers use small, medium-weight text with subtle color to distinguish from data rows.

```tsx
<thead>
  <tr className="border-b">
    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide py-3 px-4">
      Organization
    </th>
    <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide py-3 px-4">
      Stage
    </th>
    <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide py-3 px-4">
      Value
    </th>
  </tr>
</thead>
<tbody>
  <tr className="border-b hover:bg-accent/50">
    <td className="text-sm font-normal py-3 px-4">Acme Corp</td>
    <td className="text-sm font-normal py-3 px-4">Negotiation</td>
    <td className="text-sm font-bold text-right py-3 px-4">$45,000</td>
  </tr>
</tbody>
```

**Key Details:**
- Headers: `text-xs font-medium text-muted-foreground uppercase tracking-wide`
- Data cells: `text-sm font-normal`
- Emphasized values: `text-sm font-bold`

### Pattern 5: Form Labels and Help Text

Forms use clear label hierarchy with medium-weight labels and subtle help text.

```tsx
<div className="space-y-2">
  <label htmlFor="email" className="text-sm font-medium text-foreground">
    Email Address
  </label>
  <input
    id="email"
    type="email"
    className="text-base"
    placeholder="you@example.com"
  />
  <p className="text-xs text-muted-foreground">
    We'll never share your email with anyone else.
  </p>
</div>
```

**Pattern:**
- Label: `text-sm font-medium text-foreground`
- Input: `text-base` (default size)
- Help text: `text-xs text-muted-foreground`

### Pattern 6: Button Text

Buttons use medium-weight text for readability and consistent sizing.

```tsx
// Primary action
<button className="px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-md">
  Save Changes
</button>

// Secondary action
<button className="px-6 py-3 text-sm font-medium bg-secondary text-secondary-foreground rounded-md">
  Cancel
</button>

// Large CTA
<button className="px-8 py-4 text-base font-semibold bg-primary text-primary-foreground rounded-lg">
  Get Started
</button>
```

**Pattern:**
- Standard buttons: `text-sm font-medium`
- Large CTAs: `text-base font-semibold`
- Icon-only buttons: No text, rely on aria-label

## Line Height Guidance

Tailwind's default line heights are optimized for readability. Use them consistently.

### Line Height Reference

| Context | Tailwind Class | Line Height |
|---------|---------------|-------------|
| Tight (headings) | `leading-tight` | 1.25 |
| Snug (short text) | `leading-snug` | 1.375 |
| Normal (body) | `leading-normal` | 1.5 |
| Relaxed (long-form) | `leading-relaxed` | 1.625 |
| Loose (spacious) | `leading-loose` | 2 |
| None (metrics) | `leading-none` | 1 |

**Pattern:**
```tsx
// ✅ GOOD: Semantic line height
<h1 className="text-3xl font-bold leading-tight">
  Dashboard Overview
</h1>

<p className="text-base leading-relaxed">
  This is a longer paragraph of body text that benefits from
  extra line spacing for improved readability.
</p>

<div className="text-2xl font-bold leading-none">
  $125,000
</div>

// ❌ BAD: Custom line height
<h1 style={{ lineHeight: '1.3' }}>Dashboard</h1>
```

## Font Family Stack

Atomic CRM uses Nunito as the primary typeface with a comprehensive fallback stack.

**From `src/index.css`:**

```css
:root {
  --font-sans: "Nunito", "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

body {
  font-family: var(--font-sans);
}
```

**Fallback Order:**
1. **Nunito** - Primary brand font (rounded, friendly)
2. **Inter** - Modern fallback (excellent legibility)
3. **ui-sans-serif** - System UI font
4. **system-ui** - Native OS font
5. **-apple-system** - macOS/iOS system font
6. **BlinkMacSystemFont** - Chrome on macOS
7. **Segoe UI** - Windows system font
8. **sans-serif** - Generic fallback

**Why Nunito:**
- Rounded terminals create a friendly, approachable aesthetic
- Excellent readability at small sizes (12px-14px)
- Wide weight range (200-900) supports hierarchy
- Open source (Google Fonts)

## Accessibility Considerations

### Contrast Ratios

All semantic text tokens meet or exceed WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text).

**Light Mode (on paper cream background `oklch(97.5% 0.01 92)`):**

| Token | Contrast Ratio | WCAG Level | Use Case |
|-------|---------------|------------|----------|
| `--text-metric` | 9.8:1 | AAA | Metrics, emphasis |
| `--text-title` | 8.5:1 | AAA | Headings |
| `--text-body` | 6.2:1 | AA | Body text |
| `--text-subtle` | 4.6:1 | AA | Metadata, timestamps |

**Dark Mode (on dark background `oklch(23.4% 0.021 288)`):**

| Token | Contrast Ratio | WCAG Level | Use Case |
|-------|---------------|------------|----------|
| `--text-metric` | 15:1 | AAA | Metrics, emphasis |
| `--text-title` | 12:1 | AAA | Headings |
| `--text-body` | 11:1 | AAA | Body text |
| `--text-subtle` | 8:1 | AAA | Metadata, timestamps |

### Minimum Sizes

**WCAG 1.4.12 Text Spacing:**
- Minimum body text: 16px (1rem) - `text-base`
- Minimum interactive text: 14px (0.875rem) - `text-sm`
- Exception: Fine print can be 12px (0.75rem) - `text-xs` if not critical

**Pattern:**
```tsx
// ✅ GOOD: Minimum sizes
<p className="text-base">Body text meets 16px minimum</p>
<button className="text-sm">Action meets 14px minimum</button>
<span className="text-xs text-muted-foreground">Last updated 5 minutes ago</span>

// ❌ BAD: Below minimum for body text
<p className="text-xs">This is too small for primary content</p>
```

### Letter Spacing

Avoid excessive letter spacing on body text. Use sparingly for emphasis.

**Pattern:**
```tsx
// ✅ GOOD: Subtle tracking on uppercase labels
<span className="text-xs uppercase tracking-wide">New</span>

// ✅ GOOD: Normal spacing for body
<p className="text-base">No custom letter spacing needed</p>

// ❌ BAD: Excessive spacing reduces readability
<p style={{ letterSpacing: '2px' }}>Difficult to read</p>
```

## Responsive Typography

Typography should scale appropriately across breakpoints. Use responsive Tailwind classes.

**Pattern:**
```tsx
// ✅ GOOD: Responsive text sizing
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
  Dashboard Overview
</h1>

<p className="text-sm md:text-base">
  Body text scales from mobile to desktop.
</p>

// ✅ GOOD: iPad-first approach
<h2 className="text-xl md:text-2xl font-semibold">
  Optimized for iPad (md: breakpoint)
</h2>
```

**Breakpoint Reference:**
- `sm:` - 640px (mobile landscape)
- `md:` - 768px (iPad portrait) ⭐ Primary target
- `lg:` - 1024px (iPad landscape / small desktop)
- `xl:` - 1280px (desktop)
- `2xl:` - 1536px (large desktop)

## CRM-Specific Typography Patterns

### Pattern 1: Dashboard Widget Titles

Widget titles use small, medium-weight text with semantic title color.

```tsx
<div className="bg-card rounded-lg p-6 shadow-[var(--elevation-1)]">
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

### Pattern 2: Data Table Typography

Tables use small text for density with bold emphasis on key values.

```tsx
<table className="w-full">
  <thead>
    <tr className="border-b">
      <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide py-3 px-4">
        Organization
      </th>
      <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide py-3 px-4">
        Pipeline Value
      </th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b hover:bg-accent/50">
      <td className="text-sm py-3 px-4">
        <div className="font-medium text-foreground">Acme Corp</div>
        <div className="text-xs text-muted-foreground">3 opportunities</div>
      </td>
      <td className="text-sm font-bold text-right py-3 px-4">
        $125,000
      </td>
    </tr>
  </tbody>
</table>
```

**Key Details:**
- Headers: `text-xs font-medium text-muted-foreground uppercase tracking-wide`
- Primary data: `text-sm font-medium`
- Secondary data: `text-xs text-muted-foreground`
- Emphasized values: `text-sm font-bold` or `text-base font-bold`

### Pattern 3: Form Field Typography

Forms use clear label hierarchy with consistent sizing.

```tsx
<div className="space-y-2">
  <label htmlFor="organization" className="text-sm font-medium">
    Organization Name
  </label>
  <input
    id="organization"
    type="text"
    className="w-full px-4 py-2 text-base border rounded-md"
    placeholder="Enter organization name"
  />
  <p className="text-xs text-muted-foreground">
    This will be displayed on all reports.
  </p>
  {error && (
    <p className="text-xs text-destructive mt-1">
      Organization name is required.
    </p>
  )}
</div>
```

**Pattern:**
- Label: `text-sm font-medium`
- Input: `text-base` (default)
- Help text: `text-xs text-muted-foreground`
- Error: `text-xs text-destructive`

### Pattern 4: Timeline/Activity Feed

Activity feeds use mixed hierarchy with bold actors and subtle timestamps.

```tsx
<div className="space-y-4">
  {activities.map(activity => (
    <div key={activity.id} className="flex gap-3">
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <ActivityIcon className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-semibold text-foreground">{activity.actor}</span>
          {' '}
          <span className="text-muted-foreground">{activity.action}</span>
          {' '}
          <span className="font-medium text-foreground">{activity.target}</span>
        </p>
        <p className="text-xs text-subtle mt-1">
          {formatRelativeTime(activity.timestamp)}
        </p>
      </div>
    </div>
  ))}
</div>
```

**Key Details:**
- Mixed weights within single line (`font-semibold` for actor, `font-medium` for target)
- Timestamp: `text-xs text-subtle`
- Action description: `text-sm text-muted-foreground`

### Pattern 5: Empty States

Empty states use large, centered text with supporting copy.

```tsx
<div className="flex flex-col items-center justify-center py-12 px-6 text-center">
  <EmptyIcon className="w-16 h-16 text-muted-foreground mb-4" />
  <h3 className="text-lg font-semibold text-foreground mb-2">
    No opportunities yet
  </h3>
  <p className="text-sm text-muted-foreground max-w-sm mb-6">
    Get started by creating your first opportunity. Track deals,
    manage pipeline, and close more business.
  </p>
  <button className="px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-md">
    Create Opportunity
  </button>
</div>
```

**Pattern:**
- Heading: `text-lg font-semibold`
- Body: `text-sm text-muted-foreground`
- CTA: `text-sm font-medium`

## Performance Considerations

### Font Loading Strategy

**Current approach:** System font stack with web font fallback

```css
:root {
  --font-sans: "Nunito", "Inter", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

**Why this works:**
- System fonts load instantly (no FOIT/FOUT)
- Nunito loads asynchronously without blocking render
- Fallback fonts have similar metrics to prevent layout shift

### Font Subset Strategy

If loading Nunito from Google Fonts, use Latin subset only:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap&subset=latin" rel="stylesheet">
```

**Benefits:**
- Reduces font file size by ~40%
- Faster download on slow connections
- Supports English and Western European languages

### Variable Fonts (Future)

Consider migrating to Nunito variable font for weight interpolation:

```css
@font-face {
  font-family: 'Nunito';
  src: url('/fonts/Nunito-Variable.woff2') format('woff2-variations');
  font-weight: 200 900;
  font-display: swap;
}
```

**Benefits:**
- Single file for all weights
- Smooth weight interpolation
- Reduced HTTP requests

## Best Practices

### DO

✅ Use semantic text tokens (`--text-title`, `--text-body`, `--text-subtle`)
✅ Follow Tailwind's typography scale (`text-xs` through `text-4xl`)
✅ Use standard font weights (`font-medium`, `font-semibold`, `font-bold`)
✅ Meet WCAG contrast minimums (4.5:1 for body, 3:1 for large text)
✅ Maintain 16px minimum for body text
✅ Use responsive classes for cross-device optimization
✅ Apply `leading-tight` for headings, `leading-relaxed` for long-form content
✅ Use `uppercase tracking-wide` sparingly for labels

### DON'T

❌ Hardcode OKLCH or hex colors for text
❌ Use custom pixel sizes outside the scale
❌ Apply weights outside 400/500/600/700
❌ Go below 14px for interactive elements
❌ Use excessive letter spacing on body text
❌ Rely solely on color to convey meaning (use weight/size too)
❌ Mix multiple text hierarchies within single line (max 2-3 weights)
❌ Use all-caps for more than 3-4 words

## Common Issues & Solutions

### Issue: Text appears too dark/harsh on paper cream background

**Solution:** Use semantic text tokens with warm undertones

```tsx
// ❌ BAD: Pure black text
<p style={{ color: '#000' }}>Harsh black text</p>

// ✅ GOOD: Warm-tinted text
<p className="text-[color:var(--text-body)]">Warm, natural text</p>
```

### Issue: Metrics don't stand out enough

**Solution:** Use `--text-metric` token with `font-bold` and larger size

```tsx
// ❌ BAD: Metric blends with body text
<div className="text-base font-normal">$125,000</div>

// ✅ GOOD: Metric has maximum emphasis
<div className="text-[color:var(--text-metric)] text-2xl font-bold">$125,000</div>
```

### Issue: Headings and body text look too similar

**Solution:** Increase size and weight contrast

```tsx
// ❌ BAD: Insufficient contrast
<h2 className="text-base font-medium">Section Title</h2>
<p className="text-base">Body text here.</p>

// ✅ GOOD: Clear hierarchy
<h2 className="text-xl font-semibold text-[color:var(--text-title)]">Section Title</h2>
<p className="text-base text-[color:var(--text-body)]">Body text here.</p>
```

### Issue: Form labels hard to distinguish from inputs

**Solution:** Use `font-medium` on labels, `font-normal` on inputs

```tsx
// ❌ BAD: Same weight for label and input
<label className="text-sm">Email</label>
<input className="text-sm" />

// ✅ GOOD: Clear distinction
<label className="text-sm font-medium">Email</label>
<input className="text-base font-normal" />
```

### Issue: Long paragraphs feel cramped

**Solution:** Apply `leading-relaxed` for comfortable reading

```tsx
// ❌ BAD: Default line height feels tight
<p className="text-base">
  Very long paragraph with multiple sentences that would benefit
  from extra line spacing for improved readability and comfort.
</p>

// ✅ GOOD: Relaxed line height
<p className="text-base leading-relaxed">
  Very long paragraph with multiple sentences that would benefit
  from extra line spacing for improved readability and comfort.
</p>
```

### Issue: Uppercase labels look too tight

**Solution:** Add `tracking-wide` for better letter spacing

```tsx
// ❌ BAD: Tight uppercase
<span className="text-xs uppercase">Status</span>

// ✅ GOOD: Spacious uppercase
<span className="text-xs uppercase tracking-wide">Status</span>
```

## Dark Mode Typography

All semantic text tokens automatically invert for dark mode with maintained contrast ratios.

**Pattern:**
```tsx
// ✅ GOOD: Automatic dark mode support
<h1 className="text-[color:var(--text-title)]">
  This heading adapts to dark mode automatically
</h1>

<p className="text-[color:var(--text-body)]">
  Body text maintains readability in both modes.
</p>

// ❌ BAD: Manual dark mode override
<h1 className="text-gray-900 dark:text-gray-100">
  Unnecessary manual override
</h1>
```

**Why automatic works:**
- Semantic tokens handle inversion
- Contrast ratios maintained
- No duplicate dark: classes needed
- Consistent across entire app

## Related Resources

- [Color System](color-system.md) - OKLCH color definitions and semantic tokens
- [Design Tokens](design-tokens.md) - Spacing, sizing, and token reference
- [Component Architecture](component-architecture.md) - React component patterns
- [Accessibility Guidelines](accessibility.md) - WCAG compliance and best practices
- [Form Patterns](form-patterns.md) - Form-specific typography patterns

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
