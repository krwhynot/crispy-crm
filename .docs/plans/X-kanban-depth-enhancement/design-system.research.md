# Design System and CSS Variable Architecture

**Date**: 2025-10-10
**Purpose**: Document the complete CSS variable architecture, semantic color system, and Tailwind integration for the Atomic CRM project.

## Overview

The Atomic CRM uses a comprehensive semantic design token system built on:
- **OKLCH color space** for consistent, perceptually uniform colors
- **Tailwind CSS 4** with custom semantic variable integration
- **shadcn/ui** component primitives
- **Automatic dark mode** support via `.dark` class

## CSS Architecture

### Main Stylesheet Location
`/home/krwhynot/Projects/atomic/src/index.css`

This file contains:
1. Tailwind CSS 4 imports and custom variant definitions
2. Theme variable mappings for Tailwind integration
3. Semantic CSS variables in OKLCH format
4. Dark mode overrides
5. Utility classes and global styles

### Tailwind CSS 4 Integration

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* Color mappings bridge semantic variables to Tailwind */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-primary: var(--primary);
  --color-destructive: var(--destructive);
  /* ... etc */
}
```

**Key Points**:
- Uses `@theme inline` directive for Tailwind 4
- Maps semantic variables (e.g., `--background`) to Tailwind color tokens (e.g., `--color-background`)
- Custom dark mode variant: `dark:` utilities apply via `&:is(.dark *)`
- Border radius system calculated from base `--radius: 0.625rem` (10px)

## Semantic Color System

### Foundation Colors

#### Light Mode
```css
:root {
  --background: oklch(1 0 0);              /* Pure white - #FFFFFF */
  --foreground: oklch(0.145 0 0);          /* Near black - #1A1A1A */
  --card: oklch(1 0 0);                    /* White card surface */
  --card-foreground: oklch(0.145 0 0);     /* Black text on cards */
  --popover: oklch(1 0 0);                 /* White popover */
  --popover-foreground: oklch(0.145 0 0);  /* Black popover text */
}
```

**Usage**: Base colors for main surfaces, text, and containers.

**Examples in codebase**:
- `/home/krwhynot/Projects/atomic/src/components/ui/card.tsx`: `bg-card text-card-foreground`
- `/home/krwhynot/Projects/atomic/src/components/ui/popover.tsx`: `bg-popover text-popover-foreground`

#### Dark Mode
```css
.dark {
  --background: oklch(0.145 0 0);          /* Near black */
  --foreground: oklch(0.985 0 0);          /* Near white */
  --card: oklch(0.145 0 0);
  --card-foreground: oklch(0.985 0 0);
  --popover: oklch(0.145 0 0);
  --popover-foreground: oklch(0.985 0 0);
}
```

### Interactive Colors (Grayscale)

#### Light Mode
```css
:root {
  --primary: oklch(0.205 0 0);             /* Very dark gray - primary actions */
  --primary-foreground: oklch(0.985 0 0);  /* Near white */
  --secondary: oklch(0.97 0 0);            /* Light gray - secondary actions */
  --secondary-foreground: oklch(0.205 0 0);/* Dark gray */
  --muted: oklch(0.97 0 0);                /* Light gray - muted surfaces */
  --muted-foreground: oklch(0.52 0 0);     /* Medium gray text */
  --accent: oklch(0.97 0 0);               /* Light gray - accents/hovers */
  --accent-foreground: oklch(0.205 0 0);   /* Dark gray */
  --destructive: oklch(0.577 0.245 27.325);/* Red for errors/delete */
}
```

**Usage**: Buttons, interactive elements, hover states, and destructive actions.

**Examples in codebase**:
- `/home/krwhynot/Projects/atomic/src/components/ui/button.tsx`:
  - Default: `bg-primary text-primary-foreground shadow-xs hover:bg-primary/90`
  - Secondary: `bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80`
  - Destructive: `bg-destructive text-white shadow-xs hover:bg-destructive/90`

#### Dark Mode
```css
.dark {
  --primary: oklch(0.922 0 0);             /* Light gray (inverted) */
  --primary-foreground: oklch(0.205 0 0);  /* Dark gray */
  --secondary: oklch(0.205 0 0);
  --secondary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.269 0 0);
  --muted-foreground: oklch(0.646 0 0);
  --accent: oklch(0.269 0 0);
  --accent-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.704 0.191 22.216);
}
```

### Border and Input Colors

#### Light Mode
```css
:root {
  --border: oklch(0.922 0 0);              /* Light gray borders */
  --input: oklch(0.922 0 0);               /* Light gray input borders */
  --ring: oklch(0.60 0 0);                 /* Medium gray focus ring */
}
```

**Usage**: Component borders, input outlines, and focus indicators.

**Examples in codebase**:
- `/home/krwhynot/Projects/atomic/src/components/ui/input.tsx`: `border-input focus-visible:border-ring focus-visible:ring-ring/50`
- `/home/krwhynot/Projects/atomic/src/components/ui/textarea.tsx`: `border-input focus-visible:ring-ring/50`
- `/home/krwhynot/Projects/atomic/src/components/ui/checkbox.tsx`: `border-input focus-visible:border-ring`

#### Dark Mode
```css
.dark {
  --border: oklch(0.269 0 0);
  --input: oklch(0.269 0 0);
  --ring: oklch(0.556 0 0);
}
```

### State Colors (Success, Warning, Info, Error)

Each state has a comprehensive scale with 8 variants:

#### Success States (Green - Hue 145)

**Light Mode**:
```css
:root {
  --success-subtle: oklch(90% 0.06 145);    /* Very light green */
  --success-default: oklch(63% 0.14 145);   /* Standard green */
  --success-strong: oklch(50% 0.15 145);    /* Dark green */
  --success-bg: oklch(95% 0.04 145);        /* Background tint */
  --success-border: oklch(80% 0.08 145);    /* Border color */
  --success-hover: oklch(68% 0.13 145);     /* Hover state */
  --success-active: oklch(58% 0.145 145);   /* Active state */
  --success-disabled: oklch(75% 0.05 145);  /* Disabled state */
}
```

**Dark Mode**:
```css
.dark {
  --success-subtle: oklch(25% 0.08 145);
  --success-default: oklch(55% 0.14 145);
  --success-strong: oklch(65% 0.13 145);
  --success-bg: oklch(20% 0.06 145);
  --success-border: oklch(40% 0.1 145);
  --success-hover: oklch(50% 0.145 145);
  --success-active: oklch(60% 0.135 145);
  --success-disabled: oklch(35% 0.05 145);
}
```

**Usage**: Success messages, completed states, positive actions.

**Current usage in codebase**: Not widely used yet, but available for status indicators and success feedback.

#### Warning States (Orange/Yellow - Hue 85)

**Light Mode**:
```css
:root {
  --warning-subtle: oklch(95% 0.08 85);
  --warning-default: oklch(70% 0.145 85);
  --warning-strong: oklch(55% 0.15 85);
  --warning-bg: oklch(97% 0.05 85);
  --warning-border: oklch(85% 0.1 85);
  --warning-hover: oklch(75% 0.14 85);
  --warning-active: oklch(65% 0.147 85);
  --warning-disabled: oklch(80% 0.06 85);
}
```

**Dark Mode**:
```css
.dark {
  --warning-subtle: oklch(25% 0.09 85);
  --warning-default: oklch(60% 0.145 85);
  --warning-strong: oklch(70% 0.14 85);
  --warning-bg: oklch(22% 0.06 85);
  --warning-border: oklch(45% 0.11 85);
  --warning-hover: oklch(55% 0.15 85);
  --warning-active: oklch(65% 0.143 85);
  --warning-disabled: oklch(40% 0.06 85);
}
```

**Usage**: Warnings, caution states, pending actions.

**Examples in codebase**:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/misc/Status.tsx`: `"warm": "bg-warning-default"`

#### Info States (Blue - Hue 230)

**Light Mode**:
```css
:root {
  --info-subtle: oklch(92% 0.08 230);
  --info-default: oklch(60% 0.145 230);
  --info-strong: oklch(50% 0.15 230);
  --info-bg: oklch(96% 0.04 230);
  --info-border: oklch(82% 0.1 230);
  --info-hover: oklch(65% 0.14 230);
  --info-active: oklch(55% 0.147 230);
  --info-disabled: oklch(75% 0.06 230);
}
```

**Dark Mode**:
```css
.dark {
  --info-subtle: oklch(25% 0.1 230);
  --info-default: oklch(55% 0.145 230);
  --info-strong: oklch(65% 0.14 230);
  --info-bg: oklch(20% 0.07 230);
  --info-border: oklch(42% 0.12 230);
  --info-hover: oklch(50% 0.15 230);
  --info-active: oklch(60% 0.143 230);
  --info-disabled: oklch(38% 0.06 230);
}
```

**Usage**: Informational messages, neutral notifications, help text.

**Examples in codebase**:
- `/home/krwhynot/Projects/atomic/src/App.css`: `.logo.react:hover { filter: drop-shadow(0 0 2em oklch(var(--info-default) / 0.67)); }`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/misc/Status.tsx`: `"cold": "bg-info-default"`

#### Error/Destructive States (Red - Hue 25)

**Light Mode**:
```css
:root {
  --error-subtle: oklch(93% 0.09 25);
  --error-default: oklch(60% 0.145 25);
  --error-strong: oklch(50% 0.15 25);
  --error-bg: oklch(96% 0.05 25);
  --error-border: oklch(83% 0.11 25);
  --error-hover: oklch(65% 0.14 25);
  --error-active: oklch(55% 0.147 25);
  --error-disabled: oklch(75% 0.06 25);
}
```

**Dark Mode**:
```css
.dark {
  --error-subtle: oklch(27% 0.11 25);
  --error-default: oklch(55% 0.145 25);
  --error-strong: oklch(65% 0.14 25);
  --error-bg: oklch(22% 0.08 25);
  --error-border: oklch(43% 0.13 25);
  --error-hover: oklch(50% 0.15 25);
  --error-active: oklch(60% 0.143 25);
  --error-disabled: oklch(40% 0.06 25);
}
```

**Usage**: Error messages, failed states, destructive actions.

**Examples in codebase**:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/misc/Status.tsx`: `"hot": "bg-error-default"`
- Used in form validation and error boundaries

### Tag Colors

8 color variants for tagging system with background and foreground pairs:

**Light Mode**:
```css
:root {
  --tag-warm-bg: oklch(92.1% 0.041 69.5);   /* Peach/orange */
  --tag-warm-fg: oklch(20% 0.02 69.5);
  --tag-green-bg: oklch(95% 0.023 149.3);   /* Mint green */
  --tag-green-fg: oklch(20% 0.02 149.3);
  --tag-teal-bg: oklch(94.2% 0.023 196.7);  /* Cyan/teal */
  --tag-teal-fg: oklch(20% 0.02 196.7);
  --tag-blue-bg: oklch(92.9% 0.033 265.6);  /* Light blue */
  --tag-blue-fg: oklch(20% 0.02 265.6);
  --tag-purple-bg: oklch(93.8% 0.034 294.6);/* Lavender */
  --tag-purple-fg: oklch(20% 0.02 294.6);
  --tag-yellow-bg: oklch(98.1% 0.026 108.8);/* Pale yellow */
  --tag-yellow-fg: oklch(20% 0.02 108.8);
  --tag-gray-bg: oklch(94.7% 0 0);          /* Light gray */
  --tag-gray-fg: oklch(20% 0 0);
  --tag-pink-bg: oklch(93.5% 0.043 350.2);  /* Rose pink */
  --tag-pink-fg: oklch(20% 0.02 350.2);
}
```

**Dark Mode**:
```css
.dark {
  --tag-warm-bg: oklch(35% 0.08 69.5);
  --tag-warm-fg: oklch(95% 0.02 69.5);
  --tag-green-bg: oklch(32% 0.07 149.3);
  --tag-green-fg: oklch(95% 0.02 149.3);
  --tag-teal-bg: oklch(33% 0.07 196.7);
  --tag-teal-fg: oklch(95% 0.02 196.7);
  --tag-blue-bg: oklch(34% 0.09 265.6);
  --tag-blue-fg: oklch(95% 0.02 265.6);
  --tag-purple-bg: oklch(35% 0.09 294.6);
  --tag-purple-fg: oklch(95% 0.02 294.6);
  --tag-yellow-bg: oklch(38% 0.08 108.8);
  --tag-yellow-fg: oklch(95% 0.02 108.8);
  --tag-gray-bg: oklch(30% 0 0);
  --tag-gray-fg: oklch(95% 0 0);
  --tag-pink-bg: oklch(35% 0.09 350.2);
  --tag-pink-fg: oklch(95% 0.02 350.2);
}
```

**Usage**: Tag badges, category labels, color-coded items.

**Utility classes defined in `/home/krwhynot/Projects/atomic/src/index.css`**:
```css
.tag-warm { background-color: var(--tag-warm-bg); color: var(--tag-warm-fg); }
.tag-green { background-color: var(--tag-green-bg); color: var(--tag-green-fg); }
.tag-teal { background-color: var(--tag-teal-bg); color: var(--tag-teal-fg); }
.tag-blue { background-color: var(--tag-blue-bg); color: var(--tag-blue-fg); }
.tag-purple { background-color: var(--tag-purple-bg); color: var(--tag-purple-fg); }
.tag-yellow { background-color: var(--tag-yellow-bg); color: var(--tag-yellow-fg); }
.tag-gray { background-color: var(--tag-gray-bg); color: var(--tag-gray-fg); }
.tag-pink { background-color: var(--tag-pink-bg); color: var(--tag-pink-fg); }
```

**Current usage**: Not currently used in codebase - available for future implementation.

### Loading States

Dedicated variables for skeleton loaders and loading indicators:

**Light Mode**:
```css
:root {
  --loading-surface: oklch(97% 0 0);        /* Primary loading surface */
  --loading-surface-secondary: oklch(95% 0 0);  /* Secondary surface */
  --loading-shimmer: oklch(99% 0 0);        /* Shimmer animation highlight */
  --loading-skeleton: oklch(93% 0 0);       /* Skeleton placeholder */
  --loading-pulse: oklch(91% 0 0);          /* Pulse animation */
  --loading-spinner: oklch(70% 0 0);        /* Spinner color */
  --loading-overlay: oklch(100% 0 0 / 60%); /* Semi-transparent overlay */
}
```

**Dark Mode**:
```css
.dark {
  --loading-surface: oklch(20% 0 0);
  --loading-surface-secondary: oklch(25% 0 0);
  --loading-shimmer: oklch(30% 0 0);
  --loading-skeleton: oklch(27% 0 0);
  --loading-pulse: oklch(32% 0 0);
  --loading-spinner: oklch(55% 0 0);
  --loading-overlay: oklch(0% 0 0 / 60%);
}
```

**Usage**: Loading skeletons, placeholders, and loading states.

**Examples in codebase**:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/simple-list/SimpleListLoading.tsx`: `bg-loading-pulse` for avatar placeholders
- `/home/krwhynot/Projects/atomic/src/atomic-crm/simple-list/ListPlaceholder.tsx`: `bg-loading-pulse` for text placeholders

### Chart Colors

5 distinct colors for data visualization:

```css
:root {
  --chart-1: oklch(0.646 0.222 41.116);  /* Orange */
  --chart-2: oklch(0.6 0.118 184.704);   /* Teal/Cyan */
  --chart-3: oklch(0.398 0.07 227.392);  /* Blue */
  --chart-4: oklch(0.488 0.243 264.376); /* Purple */
  --chart-5: oklch(0.556 0.238 31.042);  /* Red-Orange */
}
```

**Note**: Chart colors remain the same in dark mode for consistency.

**Usage**: Charts, graphs, data visualizations.

**Examples in codebase**:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/dashboard/OpportunitiesChart.tsx`: Chart data series

### Sidebar Colors

Dedicated variables for sidebar navigation:

**Light Mode**:
```css
:root {
  --sidebar: oklch(0.985 0 0);                 /* Sidebar background */
  --sidebar-foreground: oklch(0.145 0 0);      /* Sidebar text */
  --sidebar-primary: oklch(0.205 0 0);         /* Primary sidebar items */
  --sidebar-primary-foreground: oklch(0.985 0 0);  /* Primary item text */
  --sidebar-accent: oklch(0.97 0 0);           /* Accent/hover state */
  --sidebar-accent-foreground: oklch(0.205 0 0);   /* Accent text */
  --sidebar-border: oklch(0.922 0 0);          /* Sidebar borders */
  --sidebar-ring: oklch(0.708 0 0);            /* Sidebar focus ring */
}
```

**Dark Mode**:
```css
.dark {
  --sidebar: oklch(0.205 0 0);
  --sidebar-foreground: oklch(0.985 0 0);
  --sidebar-primary: oklch(0.488 0.243 264.376); /* Purple accent */
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.269 0 0);
  --sidebar-accent-foreground: oklch(0.985 0 0);
  --sidebar-border: oklch(1 0 0 / 10%);
  --sidebar-ring: oklch(0.556 0 0);
}
```

**Usage**: Navigation sidebar, side panels.

**Examples in codebase**:
- `/home/krwhynot/Projects/atomic/src/components/ui/sidebar.tsx`: Full sidebar component implementation

## Shadow System

The project uses Tailwind's default shadow utilities with custom `shadow-xs`:

### Available Shadow Utilities

From component usage analysis:

- `shadow-xs` - Extra small shadow for subtle depth (custom, most common)
- `shadow-sm` - Small shadow for slight elevation
- `shadow` - Default shadow
- `shadow-md` - Medium shadow for cards/popovers
- `shadow-lg` - Large shadow for modals/sheets
- `shadow-none` - No shadow

### Shadow Usage Patterns

**Buttons** (from `/home/krwhynot/Projects/atomic/src/components/ui/button.tsx`):
```typescript
"bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
"bg-destructive text-white shadow-xs hover:bg-destructive/90"
"border bg-background shadow-xs hover:bg-accent"
```

**Cards** (from `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCard.tsx`):
```typescript
"py-2 transition-all duration-200 shadow-sm hover:shadow-md"
```

**Form Inputs** (from `/home/krwhynot/Projects/atomic/src/components/ui/input.tsx`):
```typescript
"rounded-md border bg-transparent px-3 py-1 text-base shadow-xs"
```

**Popovers/Dropdowns**:
```typescript
"rounded-md border p-4 shadow-md"  // Standard elevated surface
```

**Tooltips**:
```typescript
"rounded opacity-0 group-hover:opacity-100 shadow-sm"  // Subtle tooltip shadow
```

### Shadow Best Practices

1. **Resting state**: Use `shadow-xs` or `shadow-sm` for default components
2. **Hover state**: Increase shadow (e.g., `shadow-sm` → `shadow-md`) for depth
3. **Elevated surfaces**: Use `shadow-md` for dialogs, popovers, dropdowns
4. **Modals/Sheets**: Use `shadow-lg` for maximum elevation
5. **Remove shadows**: Use `shadow-none` for flat design or nested elements

## Border Variants

The system primarily uses semantic border variables:

### Available Border Variables

- `--border` - Standard border color (light gray / dark gray)
- `--input` - Input border color (same as `--border`)
- `--ring` - Focus ring color (medium gray)
- `--sidebar-border` - Sidebar-specific borders

### Border Usage Patterns

**No additional border variants** like `--border-subtle`, `--border-muted`, or `--border-elevated` are currently defined. The system uses a single border color with opacity modifiers:

**Standard borders**:
```typescript
"border"                    // Uses --border
"border-2"                  // Thicker border
"border-dashed"             // Dashed style
"border-muted"              // Uses --muted color (not a border-specific variable)
```

**Focus states**:
```typescript
"focus-visible:border-ring"          // Focus indicator
"focus-visible:ring-ring/50"         // Focus ring with 50% opacity
"focus-visible:ring-[3px]"           // 3px ring width
```

**Examples in codebase**:
- `/home/krwhynot/Projects/atomic/src/components/admin/file-input.tsx`: `"border-2 border-dashed border-muted"`
- `/home/krwhynot/Projects/atomic/src/components/ui/input.tsx`: `"border-input focus-visible:border-ring"`

## Surface Variants

The system does not define explicit surface variants like `--background-alt`, `--background-elevated`, or `--surface-variant`.

### Current Surface Approach

Surfaces are created using the base semantic variables:

1. **Background**: `--background` (main app background)
2. **Card**: `--card` (card surfaces)
3. **Popover**: `--popover` (elevated surfaces like dialogs, popovers)
4. **Muted**: `--muted` (secondary/muted surfaces)
5. **Accent**: `--accent` (hover/accent surfaces)
6. **Secondary**: `--secondary` (secondary actions/surfaces)

**Pattern**: Surfaces are differentiated through semantic naming rather than numbered variants.

## Component Integration Patterns

### Using Semantic Colors in Components

**Direct Tailwind classes** (preferred):
```typescript
<div className="bg-background text-foreground">
<div className="bg-card text-card-foreground border rounded-xl">
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
```

**With CVA (class-variance-authority)**:
```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90",
        outline: "border bg-background shadow-xs hover:bg-accent",
      }
    }
  }
);
```

**CSS custom properties** (for dynamic values):
```css
.logo:hover {
  filter: drop-shadow(0 0 2em oklch(var(--primary) / 0.67));
}
```

**Utility classes** (for tag colors):
```typescript
<span className="tag-blue">Tag Label</span>
<span className="tag-warm">Warm Tag</span>
```

### State-Based Color Mapping

From `/home/krwhynot/Projects/atomic/src/atomic-crm/misc/Status.tsx`:

```typescript
function getStatusBackgroundClass(status: string): string {
  const statusMap: Record<string, string> = {
    cold: "bg-info-default",
    warm: "bg-warning-default",
    hot: "bg-error-default",
    "in-contract": "bg-success-default",
  };
  return statusMap[status] || "bg-muted";
}
```

### Badge Variants

From `/home/krwhynot/Projects/atomic/src/components/ui/badge.tsx`:

```typescript
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-white",
        outline: "text-foreground [a&]:hover:bg-accent",
      },
    },
  }
);
```

## Engineering Constitution Compliance

### Rule #8: COLORS - Semantic CSS variables only

**Compliant patterns**:
```typescript
// Good: Using semantic variables
"bg-primary"
"text-muted-foreground"
"border-input"
"bg-success-default"
```

**Non-compliant patterns**:
```typescript
// Bad: Never use hex codes
"#FF0000"
"#1A1A1A"

// Bad: Direct color values
"rgb(255, 0, 0)"
"oklch(0.5 0.1 180)"
```

**Accessing CSS variables directly**:
```typescript
// When needed (rare):
var(--primary)
var(--success-default)
```

## Migration and Extension Guidelines

### Adding New Colors

1. **Define in `:root` and `.dark`** in `/home/krwhynot/Projects/atomic/src/index.css`
2. **Use OKLCH format** for consistency
3. **Create semantic names** (avoid generic like `--color-1`)
4. **Map to Tailwind** in `@theme inline` section if needed
5. **Document usage** and examples

### Creating New Variants

1. **Extend existing scales** (subtle, default, strong, bg, border, hover, active, disabled)
2. **Maintain contrast ratios** for accessibility
3. **Test in light and dark modes**
4. **Add Tailwind utilities** if needed:
   ```css
   @theme inline {
     --color-my-new-variant: var(--my-new-variant);
   }
   ```

### Border and Surface Extensions

Currently, the system does not have explicit border or surface variants. To add them:

1. **Define new variables**:
   ```css
   :root {
     --border-subtle: oklch(0.95 0 0);
     --border-elevated: oklch(0.88 0 0);
     --surface-elevated: oklch(0.99 0 0);
   }
   ```

2. **Map to Tailwind**:
   ```css
   @theme inline {
     --color-border-subtle: var(--border-subtle);
   }
   ```

3. **Use in components**:
   ```typescript
   <div className="border-border-subtle">
   ```

## Dependencies

- **tailwindcss**: ^4.1.11
- **@tailwindcss/vite**: ^4.1.11
- **tw-animate-css**: ^1.3.8 (animation utilities)
- **tailwind-merge**: ^3.3.1 (className merging)
- **class-variance-authority**: ^0.7.1 (variant management)
- **eslint-plugin-tailwindcss**: ^4.0.0-beta.0 (linting)

## Color Validation

The project includes color validation via `npm run validate:colors`:

From `/home/krwhynot/Projects/atomic/CLAUDE.md`:
```bash
npm run validate:colors  # Validate semantic color usage
```

This ensures all color usage follows the Engineering Constitution Rule #8.

## Summary

### Key Takeaways

1. **100% semantic color system** - No hex codes allowed
2. **OKLCH color space** - Perceptually uniform, better for dark mode
3. **Comprehensive state scales** - 8 variants each for success/warning/info/error
4. **Tailwind CSS 4 integration** - Modern `@theme inline` directive
5. **Automatic dark mode** - Complete dark mode support via `.dark` class
6. **Loading state system** - Dedicated variables for skeleton loaders
7. **Tag color utilities** - 8 pre-defined tag color classes
8. **Shadow system** - Tailwind utilities with custom `shadow-xs`
9. **No border/surface variants** - Uses semantic base colors instead
10. **Validation tooling** - Color usage linting built-in

### Next Steps for Kanban Depth Enhancement

For implementing kanban depth effects:

1. **Shadows**: Use existing `shadow-sm`, `shadow-md`, `shadow-lg` with transitions
2. **Hover states**: Combine shadow increase with subtle background shifts (e.g., `hover:shadow-md hover:bg-accent/50`)
3. **Dragging state**: Add `shadow-lg` + `scale-[1.02]` for lifted appearance
4. **Focus states**: Use `ring-ring/50` with `ring-[3px]` for keyboard navigation
5. **Loading placeholders**: Use `bg-loading-pulse` with `animate-pulse` utility

### Files Referenced

- `/home/krwhynot/Projects/atomic/src/index.css` - Main stylesheet
- `/home/krwhynot/Projects/atomic/src/App.css` - Application-specific styles
- `/home/krwhynot/Projects/atomic/src/components/ui/button.tsx` - Button component
- `/home/krwhynot/Projects/atomic/src/components/ui/badge.tsx` - Badge component
- `/home/krwhynot/Projects/atomic/src/components/ui/card.tsx` - Card component
- `/home/krwhynot/Projects/atomic/src/atomic-crm/misc/Status.tsx` - Status indicator
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/OpportunityCard.tsx` - Opportunity card
- `/home/krwhynot/Projects/atomic/src/atomic-crm/simple-list/SimpleListLoading.tsx` - Loading state
- `/home/krwhynot/Projects/atomic/src/atomic-crm/simple-list/ListPlaceholder.tsx` - Placeholder component
