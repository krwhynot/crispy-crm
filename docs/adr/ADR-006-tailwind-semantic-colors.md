# ADR-006: Tailwind v4 Semantic Color System

## Status

Accepted

## Context

Crispy CRM requires a consistent, maintainable color system that:
- Supports light and dark themes without code changes
- Ensures WCAG 2.1 AA accessibility compliance across all color combinations
- Provides semantic meaning (e.g., "destructive" vs "red-500")
- Enables future rebranding without component modifications
- Uses OKLCH color format for perceptual uniformity (equal visual steps)

Traditional Tailwind utility classes like `bg-green-600` or `text-gray-500` create several problems:
1. **No semantic meaning** - "green" doesn't convey "success" or "primary brand"
2. **Scattered definitions** - Colors hardcoded across 100+ components
3. **Theme breakage** - Dark mode requires duplicating every color reference
4. **Accessibility risk** - Arbitrary color pairs may fail contrast requirements
5. **Inconsistent branding** - MFB's forest green (#336600) appears in varying shades

## Decision

Implement a CSS custom property-based semantic color system integrated with Tailwind v4's `@theme` directive.

### Architecture

**Layer 1: CSS Custom Properties** (`src/index.css` lines 614-984)

Define all colors in `:root` (light mode) and `.dark` (dark mode) using OKLCH format:

```css
:root {
  /* Foundation colors */
  --background: oklch(97.5% 0.01 92);     /* Paper cream */
  --foreground: oklch(20% 0.012 85);       /* Dark text */
  --primary: oklch(38% 0.085 142);         /* Forest green (#336600) */
  --destructive: oklch(58% 0.18 27);       /* Terracotta red */

  /* Status tokens with variants */
  --success-subtle: oklch(92% 0.08 155);
  --success-default: oklch(56% 0.115 155);
  --success-strong: oklch(48% 0.12 155);

  /* All tokens have paired -foreground variants */
  --primary-foreground: oklch(99% 0 0);
  --success-foreground: oklch(100% 0 0);
}
```

**Layer 2: Tailwind Theme Bridge** (`src/index.css` lines 6-125)

Map CSS variables to Tailwind-accessible tokens via `@theme inline`:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-destructive: var(--destructive);
  --color-muted-foreground: var(--muted-foreground);
  /* ... */
}
```

This enables Tailwind utility classes like `bg-primary`, `text-muted-foreground`, and `border-destructive`.

### Naming Conventions

| Pattern | Purpose | Example |
|---------|---------|---------|
| `--{semantic}` | Primary token | `--primary`, `--destructive` |
| `--{semantic}-foreground` | Text on that background | `--primary-foreground` |
| `--{status}-subtle` | Light tint for backgrounds | `--success-subtle` |
| `--{status}-default` | Standard usage | `--warning-default` |
| `--{status}-strong` | Emphasis | `--error-strong` |
| `--tag-{name}-bg/fg` | Tag/badge colors | `--tag-sage-bg`, `--tag-sage-fg` |

## Consequences

### Positive

- **Single source of truth**: All colors defined in one file (`src/index.css`)
- **Automatic dark mode**: CSS variables switch based on `.dark` class
- **WCAG compliance built-in**: Foreground/background pairs pre-validated for 4.5:1+ contrast
- **Semantic clarity**: `text-destructive` conveys meaning; `text-red-500` does not
- **Theme flexibility**: Rebrand by updating CSS variables, not components
- **OKLCH benefits**: Perceptually uniform color steps, consistent saturation across hues

### Negative

- **Learning curve**: Team must use semantic names, not arbitrary Tailwind colors
- **Indirection**: Two-step lookup (Tailwind class -> CSS variable -> OKLCH value)
- **Limited palette**: Cannot use arbitrary `text-green-347` values (by design)
- **Tooling gap**: Some IDE color pickers don't preview CSS variable values

## Color Token Reference

### Core Semantic Tokens

| Token | Tailwind Class | Purpose |
|-------|---------------|---------|
| `--background` | `bg-background` | Page background (paper cream) |
| `--foreground` | `text-foreground` | Primary body text |
| `--card` | `bg-card` | Card/panel surfaces |
| `--primary` | `bg-primary` | Primary actions, brand identity |
| `--secondary` | `bg-secondary` | Secondary actions |
| `--muted` | `bg-muted` | Muted/disabled surfaces |
| `--muted-foreground` | `text-muted-foreground` | Secondary text, placeholders |
| `--accent` | `bg-accent` | Accent elements (clay orange) |
| `--destructive` | `bg-destructive` | Errors, delete actions |

### Status Tokens

| Status | Subtle | Default | Strong | Foreground |
|--------|--------|---------|--------|------------|
| Success | `--success-subtle` | `--success-default` | `--success-strong` | `--success-foreground` |
| Warning | `--warning-subtle` | `--warning-default` | `--warning-strong` | `--warning-foreground` |
| Error | `--error-subtle` | `--error-default` | `--error-strong` | N/A (use destructive) |
| Info | `--info-subtle` | `--info-default` | `--info-strong` | N/A |

### Tag Colors (Organization Types)

| Tag | Background | Foreground | Usage |
|-----|------------|------------|-------|
| `tag-warm` | `--tag-warm-bg` | `--tag-warm-fg` | Customers |
| `tag-sage` | `--tag-sage-bg` | `--tag-sage-fg` | Prospects |
| `tag-purple` | `--tag-purple-bg` | `--tag-purple-fg` | Principals |
| `tag-teal` | `--tag-teal-bg` | `--tag-teal-fg` | Distributors |
| `tag-gray` | `--tag-gray-bg` | `--tag-gray-fg` | Unknown |

## Code Examples

### Correct Usage

```tsx
// Badge component using semantic variants
<Badge className="bg-primary text-primary-foreground" />

// Muted subtitle text
<span className="text-muted-foreground">Last updated 2 days ago</span>

// Destructive action button
<Button className="bg-destructive text-destructive-foreground">Delete</Button>

// Status indicator using CSS variable directly (stage constants)
<div style={{ backgroundColor: 'var(--success-strong)' }}>Won</div>

// Tag badges with organization type variants
<Badge variant="org-customer">Customer</Badge>
<Badge variant="org-principal">Principal</Badge>
```

**Real example from `src/components/ui/badge.constants.ts`:**

```tsx
export const badgeVariants = cva(
  "inline-flex items-center ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground ring-primary/20",
        destructive: "bg-destructive text-destructive-foreground ring-destructive/20",
        success: "bg-success text-success-foreground ring-success/20",
        warning: "bg-warning text-warning-foreground ring-warning/20",
        "org-customer": "bg-tag-warm text-tag-warm-fg ring-tag-warm-fg/15",
        "org-principal": "bg-tag-purple text-tag-purple-fg ring-tag-purple-fg/15",
      },
    },
  }
);
```

**Real example from `src/atomic-crm/opportunities/constants/stageConstants.ts`:**

```tsx
export const OPPORTUNITY_STAGES = [
  { value: "new_lead", color: "var(--info-subtle)", ... },
  { value: "demo_scheduled", color: "var(--success-subtle)", ... },
  { value: "closed_won", color: "var(--success-strong)", ... },
  { value: "closed_lost", color: "var(--error-subtle)", ... },
];
```

### Anti-Patterns (Do NOT Use)

```tsx
// WRONG: Raw Tailwind color utilities
<Badge className="bg-green-600 text-white" />
<span className="text-gray-500">Subtitle</span>
<Button className="bg-red-500 text-white">Delete</Button>

// WRONG: Hardcoded hex/oklch values
<div style={{ color: '#336600' }}>Primary text</div>
<div style={{ backgroundColor: 'oklch(38% 0.085 142)' }}>Card</div>

// WRONG: Arbitrary Tailwind colors
<div className="bg-emerald-100 text-emerald-800">Success</div>
<div className="bg-amber-50 border-amber-200">Warning</div>
```

## Implementation Files

| File | Purpose |
|------|---------|
| `src/index.css` (lines 6-125) | `@theme inline` block mapping CSS vars to Tailwind tokens |
| `src/index.css` (lines 614-984) | `:root` and `.dark` CSS custom property definitions |
| `src/components/ui/badge.constants.ts` | Badge variant definitions using semantic tokens |
| `src/atomic-crm/opportunities/constants/stageConstants.ts` | Pipeline stage colors using CSS variables |

## Verification

Run the following to check for violations:

```bash
# Find hardcoded Tailwind colors (should return 0 results)
rg "bg-(red|green|blue|gray|amber|emerald)-\d+" --type tsx

# Find hardcoded hex colors in styles
rg "style=.*#[0-9a-fA-F]{3,6}" --type tsx
```

## Related ADRs

- ADR-013: WCAG 2.1 AA Accessibility Standards (color contrast requirements)
