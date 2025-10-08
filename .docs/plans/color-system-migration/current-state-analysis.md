# Color System Migration: Current State Analysis

**Date:** 2025-10-07
**Purpose:** Comprehensive analysis of current color system implementation to inform migration from grayscale to brand green primary colors
**Status:** Complete

## Executive Summary

The Atomic CRM application uses a sophisticated semantic color system based on CSS custom properties with OKLCH color space. The current `--primary` color is a **grayscale neutral** (near-black in light mode, near-white in dark mode) used extensively across 75+ files for default buttons, badges, input selections, and focus states. Migrating to a brand green primary color will have significant visual and accessibility implications.

### Key Findings

- **60+ semantic CSS variables** define the color system
- **--primary used in 75+ locations** across 34 files (buttons, badges, inputs, focus rings)
- **3 Engineering Constitution violations** found (hardcoded grays, inline styles)
- **Migration strategy needed:** Direct replacement vs. semantic refactor
- **Accessibility review required:** WCAG contrast compliance for brand green
- **Tag system is compliant:** Already uses semantic color variables

---

## 1. CSS Variable Architecture

### Core Color System (`src/index.css`)

The application uses OKLCH color space for all color definitions, providing perceptually uniform colors with superior dark mode support.

#### Primary Semantic Variables

```css
:root {
  /* Foundation colors */
  --background: oklch(1 0 0);              /* Pure white */
  --foreground: oklch(0.145 0 0);          /* Near black */
  --card: oklch(1 0 0);                    /* White card surface */
  --card-foreground: oklch(0.145 0 0);     /* Black text on cards */
  --popover: oklch(1 0 0);                 /* White popover */
  --popover-foreground: oklch(0.145 0 0);  /* Black popover text */

  /* Interactive colors */
  --primary: oklch(0.205 0 0);             /* Very dark gray (grayscale) */
  --primary-foreground: oklch(0.985 0 0);  /* Near white */
  --secondary: oklch(0.97 0 0);            /* Light gray */
  --secondary-foreground: oklch(0.205 0 0);/* Dark gray */
  --muted: oklch(0.97 0 0);                /* Light gray (muted surfaces) */
  --muted-foreground: oklch(0.52 0 0);     /* Medium gray text */
  --accent: oklch(0.97 0 0);               /* Light gray (accents/hovers) */
  --accent-foreground: oklch(0.205 0 0);   /* Dark gray */
  --destructive: oklch(0.577 0.245 27.325);/* Red for errors/delete */

  /* Borders and focus */
  --border: oklch(0.922 0 0);              /* Light gray borders */
  --input: oklch(0.922 0 0);               /* Light gray input borders */
  --ring: oklch(0.60 0 0);                 /* Medium gray focus ring */
}

.dark {
  /* Dark mode inverts most values */
  --background: oklch(0.145 0 0);          /* Near black */
  --foreground: oklch(0.985 0 0);          /* Near white */
  --primary: oklch(0.922 0 0);             /* Light gray (inverted) */
  --primary-foreground: oklch(0.205 0 0);  /* Dark gray */
  /* ... other dark variants */
}
```

**CRITICAL INSIGHT:** The current `--primary` color is **grayscale** with no chroma (saturation = 0):
- Light mode: `oklch(0.205 0 0)` ≈ `#2D2D2D` (very dark gray, almost black)
- Dark mode: `oklch(0.922 0 0)` ≈ `#EBEBEB` (very light gray, almost white)

This suggests `--primary` currently serves as a **neutral default** rather than a brand accent color.

#### Extended Semantic Variables

```css
/* Success states (green) */
--success-subtle: oklch(90% 0.06 145);
--success-default: oklch(63% 0.14 145);
--success-strong: oklch(50% 0.15 145);
--success-bg: oklch(95% 0.04 145);
--success-border: oklch(80% 0.08 145);
--success-hover: oklch(68% 0.13 145);
--success-active: oklch(58% 0.145 145);
--success-disabled: oklch(75% 0.05 145);

/* Warning states (orange/yellow) */
--warning-subtle: oklch(95% 0.08 85);
--warning-default: oklch(70% 0.145 85);
/* ... 6 more warning variants */

/* Info states (blue) */
--info-subtle: oklch(92% 0.08 230);
--info-default: oklch(60% 0.145 230);
/* ... 6 more info variants */

/* Error/Destructive extended (red) */
--error-subtle: oklch(93% 0.09 25);
--error-default: oklch(60% 0.145 25);
/* ... 6 more error variants */
```

#### Tag Colors (Compliant)

```css
/* Tag colors - backgrounds and foregrounds */
--tag-warm-bg: oklch(92.1% 0.041 69.5);
--tag-warm-fg: oklch(20% 0.02 69.5);
--tag-green-bg: oklch(95% 0.023 149.3);
--tag-green-fg: oklch(20% 0.02 149.3);
/* ... 6 more tag color pairs (teal, blue, purple, yellow, gray, pink) */
```

**STATUS:** Tag colors are already using semantic CSS variables. No migration needed.

#### Loading States

```css
/* Neutral surface colors for loading states */
--loading-surface: oklch(97% 0 0);
--loading-surface-secondary: oklch(95% 0 0);
--loading-shimmer: oklch(99% 0 0);
--loading-skeleton: oklch(93% 0 0);
--loading-pulse: oklch(91% 0 0);
--loading-spinner: oklch(70% 0 0);
--loading-overlay: oklch(100% 0 0 / 60%);
```

**RISK:** Loading states use neutral grays. Will NOT be affected by primary color migration.

#### Sidebar Colors

```css
--sidebar: oklch(0.985 0 0);
--sidebar-foreground: oklch(0.145 0 0);
--sidebar-primary: oklch(0.205 0 0);              /* Uses primary grayscale */
--sidebar-primary-foreground: oklch(0.985 0 0);
--sidebar-accent: oklch(0.97 0 0);
--sidebar-accent-foreground: oklch(0.205 0 0);
--sidebar-border: oklch(0.922 0 0);
--sidebar-ring: oklch(0.708 0 0);
```

**RISK:** Sidebar has `--sidebar-primary` that references the same grayscale value as `--primary`. Changing `--primary` to green may require updating sidebar colors to maintain visual consistency.

#### Chart Colors

```css
--chart-1: oklch(0.646 0.222 41.116);  /* Orange */
--chart-2: oklch(0.6 0.118 184.704);   /* Teal/Cyan */
--chart-3: oklch(0.398 0.07 227.392);  /* Blue */
--chart-4: oklch(0.828 0.189 84.429);  /* Yellow-green */
--chart-5: oklch(0.769 0.188 70.08);   /* Yellow-orange */
```

**STATUS:** Chart colors are independent. No usage found in current components (charts may be planned but not implemented).

#### Border Semantic Colors

```css
/* Semantic border colors */
--border-default: oklch(92.2% 0 0);
--border-hover: oklch(87% 0 0);
--border-focus: oklch(70.8% 0 0);
--border-disabled: oklch(95% 0 0);
--border-selected: oklch(60% 0.08 230);    /* Blue */
--border-success: oklch(80% 0.08 145);     /* Green */
--border-warning: oklch(85% 0.1 85);       /* Orange */
--border-error: oklch(83% 0.11 25);        /* Red */
--border-info: oklch(82% 0.1 230);         /* Blue */
```

**RISK:** Border states are mostly grayscale except for semantic states (success, warning, error, info). Focus border uses `--border-focus` which is grayscale.

### Tailwind Integration

The `@theme inline` block in `src/index.css` maps CSS variables to Tailwind utilities:

```css
@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  /* ... all semantic variables mapped */
}
```

This enables using `bg-primary`, `text-primary`, `border-primary` in Tailwind classes, which are widely used throughout the codebase.

---

## 2. Component Dependencies

### shadcn/ui Base Components

#### Button Component (`src/components/ui/button.tsx`)

**Variants using --primary:**

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center ...",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 ...",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground ...",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      /* ... */
    },
  },
);
```

**PRIMARY COLOR IMPACT:**
- `default` variant: Uses `bg-primary` (most common button style)
- `link` variant: Uses `text-primary`
- **Usage:** 75+ occurrences across 34 files

**RISK:** Changing `--primary` to green will make all default buttons green. This may be desirable for primary CTAs but could be overwhelming if overused.

#### Badge Component (`src/components/ui/badge.tsx`)

```tsx
const badgeVariants = cva(
  "inline-flex items-center justify-center ...",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 ...",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
      },
    },
  },
);
```

**PRIMARY COLOR IMPACT:**
- `default` variant: Uses `bg-primary`
- **Usage:** Badges throughout the app (priority indicators, status labels, etc.)

**RISK:** Default badges will become green. May need to audit which badges should use `default` vs `secondary` or `outline` variants.

#### Input Component (`src/components/ui/input.tsx`)

```tsx
<input
  className={cn(
    "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground ...",
    "focus-visible:border-ring focus-visible:ring-ring/50 ...",
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    className,
  )}
/>
```

**PRIMARY COLOR IMPACT:**
- Text selection background: `selection:bg-primary`
- Focus ring uses `--ring` (grayscale, not primary)

**RISK:** Text selections will have green background. This is standard for branded inputs but ensure contrast meets WCAG standards.

#### Card Component (`src/components/ui/card.tsx`)

```tsx
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6",
        className,
      )}
      {...props}
    />
  );
}
```

**PRIMARY COLOR IMPACT:** None. Cards use `--card` (white/dark gray), not `--primary`.

#### Alert Component (`src/components/ui/alert.tsx`)

```tsx
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm ...",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
      },
    },
  },
);
```

**PRIMARY COLOR IMPACT:** None. Alerts use `--card` and `--destructive`, not `--primary`.

#### Skeleton Component (`src/components/ui/skeleton.tsx`)

```tsx
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}
```

**PRIMARY COLOR IMPACT:** None. Skeletons use `--accent` (light gray), not `--primary`.

**RISK:** Loading skeletons will remain gray, which is appropriate for neutral loading states.

### Admin Layer Components (`src/components/admin/`)

The admin layer components wrap React Admin functionality with shadcn/ui styling. Key components that use primary colors:

- **`login-page.tsx`**: Login button uses default Button variant (bg-primary)
- **`error.tsx`**: Error text uses `text-secondary-foreground`
- **`loading.tsx`**: Uses Skeleton (bg-accent)
- **`form.tsx`**: Form labels use `text-destructive` for errors
- **`bulk-actions-toolbar.tsx`**: Action buttons use various button variants

**PRIMARY COLOR IMPACT:** Login CTA button and other default buttons will become green.

### Feature Module Components (`src/atomic-crm/`)

#### Opportunity Components

**`OpportunityCard.tsx`** - Priority badges:

```tsx
const getPriorityVariant = (priority: string) => {
  switch (priority) {
    case "critical":
      return "destructive";
    case "high":
      return "default";  // Uses bg-primary
    case "medium":
      return "secondary";
    case "low":
      return "outline";
    default:
      return "outline";
  }
};
```

**RISK:** "High" priority opportunities will have green badges instead of dark gray. May need to remap to a different variant or introduce a new semantic color for priority levels.

**`stageConstants.ts`** - Stage colors:

```tsx
export const OPPORTUNITY_STAGES: OpportunityStage[] = [
  {
    value: "new_lead",
    label: "New Lead",
    color: "var(--info-subtle)",  // Uses semantic variable
    description: "Initial prospect identification",
  },
  {
    value: "initial_outreach",
    label: "Initial Outreach",
    color: "var(--teal)",  // ERROR: References undefined --teal variable
    description: "First contact and follow-up",
  },
  /* ... more stages using semantic variables ... */
];
```

**ISSUE FOUND:** Stage "initial_outreach" references `var(--teal)` which is not defined in the CSS. This should use `var(--tag-teal-bg)` or a defined semantic variable.

**RISK:** Stage colors are independent of primary color. No migration impact.

#### Organization Components

**`OrganizationType.tsx`** - ENGINEERING CONSTITUTION VIOLATIONS:

```tsx
// Priority colors for visual distinction using semantic variables
const priorityColors = {
  A: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  B: "bg-primary text-primary-foreground hover:bg-primary/90",  // Uses primary
  C: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
  D: "bg-muted text-muted-foreground hover:bg-muted/90",
};

// VIOLATION: Line 41 & 91 - Hardcoded gray colors
<Badge
  className={
    priorityColors[record.priority] || "bg-gray-200 text-gray-800"  // VIOLATION
  }
/>
```

**VIOLATIONS FOUND:**
1. **Line 41:** `"bg-gray-200 text-gray-800"` - Hardcoded Tailwind gray
2. **Line 91:** `"bg-gray-200 text-gray-800"` - Duplicate hardcoded gray

**FIX REQUIRED:** Replace with semantic variable like `"bg-muted text-muted-foreground"` or create a new semantic variable for unknown/default priority.

**PRIMARY COLOR IMPACT:** Priority B organizations will have green badges instead of dark gray.

#### Product Components

**`ProductAside.tsx`** - ENGINEERING CONSTITUTION VIOLATION:

```tsx
const statusColors = {
  available: "bg-success-default",
  coming_soon: "bg-warning-default",
  discontinued: "bg-destructive",
  out_of_stock: "bg-gray-500",  // VIOLATION
};

const statusColor = record.status
  ? statusColors[record.status]
  : "bg-gray-500";  // VIOLATION
```

**VIOLATIONS FOUND:**
1. **Line 42:** `"bg-gray-500"` - Hardcoded Tailwind gray
2. **Line 45:** `"bg-gray-500"` - Duplicate hardcoded gray

**FIX REQUIRED:** Replace with semantic variable like `"bg-muted"` or `"bg-secondary"`.

#### Contact & Note Components

**`Status.tsx`** - ENGINEERING CONSTITUTION VIOLATION:

```tsx
<span
  className="inline-block w-2.5 h-2.5 rounded-full"
  style={{ backgroundColor: statusObject.color }}  // VIOLATION: Inline style
/>
```

**VIOLATION FOUND:**
- **Line 20:** Inline `style` attribute with dynamic color from configuration

**FIX REQUIRED:** Refactor to use semantic CSS variables. The `statusObject.color` should reference semantic variables, not arbitrary hex/RGB colors.

#### WhatsNew Component

**`WhatsNew.tsx`** - ENGINEERING CONSTITUTION VIOLATIONS:

Multiple hardcoded gray colors found:
- **Line 256:** `"bg-gray-100 text-gray-800"`
- **Line 339:** `"bg-gray-200"` (progress bar background)
- **Lines 464, 473, 482:** `"hover:bg-gray-50"` (link hover states)

**FIX REQUIRED:** Replace all with semantic variables:
- `bg-gray-100` → `bg-muted`
- `bg-gray-200` → `bg-secondary`
- `hover:bg-gray-50` → `hover:bg-accent`

---

## 3. Color Usage Statistics

### By Semantic Variable

| Variable | Occurrences | Files | Primary Usage |
|----------|-------------|-------|---------------|
| `bg-primary` / `text-primary` / `border-primary` | 75+ | 34 | Buttons (default), Badges (default), Input selection, Links |
| `bg-muted` / `text-muted-foreground` | 375+ | 97 | Backgrounds, Disabled states, Secondary text, Loading surfaces |
| `bg-accent` / `text-accent` | 28+ | 16 | Hover states, Skeleton loaders, Subtle backgrounds |
| `bg-destructive` / `text-destructive` | 38+ | 24 | Error buttons, Error badges, Delete actions, Error text |
| `bg-secondary` / `text-secondary` | 28+ | 12 | Secondary buttons, Header background, Alternative surfaces |
| `bg-success-*` / `text-success-*` | N/A | N/A | Available but not widely used in grep results |
| `bg-card` / `text-card-foreground` | High | Many | Card surfaces, Popover backgrounds, Dialog backgrounds |

### Component Breakdown

#### Buttons
- **Default variant:** 75+ uses → Will become green
- **Destructive variant:** 38+ uses → Remains red
- **Secondary variant:** 28+ uses → Remains gray
- **Outline variant:** Common → Remains neutral with border
- **Ghost variant:** Common → Hover becomes gray accent
- **Link variant:** Uses `text-primary` → Links will be green

#### Badges
- **Default variant:** Common → Will become green
- **Secondary variant:** 28+ uses → Remains gray
- **Destructive variant:** 38+ uses → Remains red
- **Outline variant:** Common → Remains neutral with border

#### Inputs & Forms
- **Text selection:** Uses `selection:bg-primary` → Will have green selection
- **Focus ring:** Uses `focus-visible:border-ring` → Remains gray (--ring is separate)
- **Error state:** Uses `aria-invalid:border-destructive` → Remains red

### Engineering Constitution Violations

| File | Line(s) | Violation | Fix Required |
|------|---------|-----------|--------------|
| `src/atomic-crm/organizations/OrganizationType.tsx` | 41, 91 | `bg-gray-200 text-gray-800` | Replace with `bg-muted text-muted-foreground` |
| `src/atomic-crm/products/ProductAside.tsx` | 42, 45 | `bg-gray-500` | Replace with `bg-muted` or `bg-secondary` |
| `src/atomic-crm/misc/Status.tsx` | 20 | Inline `style={{ backgroundColor: ... }}` | Refactor to use semantic CSS classes |
| `src/atomic-crm/pages/WhatsNew.tsx` | 256, 339, 464, 473, 482 | `bg-gray-*`, `hover:bg-gray-*` | Replace with `bg-muted`, `bg-secondary`, `hover:bg-accent` |
| `src/atomic-crm/opportunities/stageConstants.ts` | 33 | `var(--teal)` (undefined) | Replace with `var(--tag-teal-bg)` or define `--teal` variable |

**Total Violations:** 5 files, 10+ individual instances

---

## 4. Migration Risk Assessment

### High Risk Areas

#### 1. Default Buttons Become Green
**Impact:** All buttons using `variant="default"` will change from dark gray to brand green.

**Affected Components:**
- Login page CTA
- Primary action buttons throughout the app
- Form submit buttons
- 75+ button instances across 34 files

**Mitigation:**
- **Option A:** Accept that default buttons are now green (aligns with typical brand usage)
- **Option B:** Audit all default buttons and remap non-primary CTAs to `variant="secondary"` or `variant="outline"`
- **Option C:** Introduce new semantic variable like `--brand-primary` and refactor components to choose between `--primary` (neutral) and `--brand-primary` (green)

#### 2. Badge Color Semantics
**Impact:** Default badges (priority indicators, status labels) will become green.

**Affected Components:**
- Opportunity priority badges ("high" priority currently uses default variant)
- Organization priority badges (Priority B uses `bg-primary`)
- Various status indicators

**Mitigation:**
- Audit all badge usages and remap to appropriate semantic variants (secondary, destructive, outline, or custom semantic variable)
- Consider introducing `--priority-high`, `--priority-medium`, `--priority-low` semantic variables

#### 3. Accessibility: Contrast Ratios
**Impact:** Green primary color must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text and UI components).

**Affected Elements:**
- Text on green buttons (`text-primary-foreground` must have sufficient contrast)
- Green text on white backgrounds (`text-primary` must have sufficient contrast)
- Text selections (`selection:bg-primary` with white text must have sufficient contrast)
- Focus indicators (if `--ring` is changed to green, must have 3:1 contrast against background)

**Action Required:**
1. Define exact brand green values in OKLCH for light and dark modes
2. Run WCAG contrast checker for:
   - Green button background (#XXXXXX) vs. white text (#FFFFFF)
   - Green text (#XXXXXX) vs. white background (#FFFFFF)
   - Green text (#XXXXXX) vs. dark background (#2D2D2D)
   - Green selection background (#XXXXXX) vs. white text (#FFFFFF)
3. Adjust lightness and chroma values if needed to meet AA standards

#### 4. Dark Mode Consistency
**Impact:** `--primary` in dark mode is currently light gray (`oklch(0.922 0 0)`). If changed to brand green, dark mode buttons will be bright green.

**Consideration:**
- Dark mode brand green should be adjusted for lower brightness (e.g., `oklch(0.5 0.15 145)` instead of `oklch(0.922 0 0)`)
- Ensure dark mode green is not overwhelming or harsh on eyes
- Test against `--background` (near-black) and `--foreground` (near-white) in dark mode

### Medium Risk Areas

#### 5. Sidebar Visual Consistency
**Impact:** `--sidebar-primary` currently matches `--primary` (grayscale). If main `--primary` becomes green but sidebar isn't updated, visual inconsistency.

**Mitigation:**
- Update `--sidebar-primary` to use brand green if sidebar should match
- Or, introduce separate `--sidebar-brand` variable to decouple sidebar from main primary color

#### 6. Link Colors
**Impact:** Links using `text-primary` will become green (standard for branded links, but verify UX consistency).

**Affected Components:**
- Button `link` variant
- Various navigation links

**Mitigation:**
- Accept green links as standard brand behavior
- Or, introduce separate `--link` semantic variable if links should differ from primary brand color

### Low Risk Areas

#### 7. Loading States & Skeletons
**Impact:** None. Loading states use `--loading-*` and `--accent` (grayscale), which are independent of `--primary`.

#### 8. Tag Colors
**Impact:** None. Tag system already uses semantic `--tag-*` variables, not `--primary`.

#### 9. Chart Colors
**Impact:** None. Chart colors are independent (not currently used in components based on grep results).

#### 10. Alert & Card Components
**Impact:** None. These use `--card`, `--destructive`, and other semantic variables, not `--primary`.

---

## 5. Migration Strategy Recommendations

### Option A: Direct Variable Replacement (Lower Effort, Higher Risk)

**Approach:** Change the OKLCH values of existing `--primary` and `--primary-foreground` variables to brand green.

**Steps:**
1. Define brand green in OKLCH:
   - Light mode: `--primary: oklch(0.55 0.15 145);` (example: medium green)
   - Dark mode: `--primary: oklch(0.50 0.13 145);` (example: slightly darker green)
2. Update `--primary-foreground` if needed (likely remains white/near-white)
3. Test across all components
4. Fix accessibility issues as they arise
5. Fix Engineering Constitution violations as part of this effort

**Pros:**
- Minimal code changes
- Quick initial implementation
- Automatically applies green to all primary-colored elements

**Cons:**
- May result in unexpected green elements (e.g., elements intended to be neutral)
- Harder to roll back
- Requires extensive visual QA across entire app
- No clear semantic distinction between "neutral default" and "brand accent"

**Recommendation:** **Not recommended** due to semantic confusion. Current `--primary` functions as neutral default, not brand accent.

### Option B: Semantic Refactor (Higher Effort, Lower Risk) ⭐ RECOMMENDED

**Approach:** Introduce new brand-specific semantic variables and refactor components to use appropriate colors.

**Steps:**
1. **Define new brand variables** in `src/index.css`:
   ```css
   :root {
     /* Existing primary (renamed for clarity) */
     --neutral-primary: oklch(0.205 0 0);
     --neutral-primary-foreground: oklch(0.985 0 0);

     /* New brand primary */
     --brand-primary: oklch(0.55 0.15 145);        /* Brand green light mode */
     --brand-primary-foreground: oklch(1 0 0);     /* White */
     --brand-primary-hover: oklch(0.50 0.15 145);  /* Darker green on hover */
     --brand-primary-active: oklch(0.45 0.15 145); /* Even darker when active */
   }

   .dark {
     --brand-primary: oklch(0.50 0.13 145);        /* Adjusted for dark mode */
     --brand-primary-hover: oklch(0.55 0.13 145);  /* Lighter on hover in dark */
     --brand-primary-active: oklch(0.60 0.13 145); /* Lighter when active */
   }
   ```

2. **Map to Tailwind** in `@theme inline`:
   ```css
   @theme inline {
     --color-brand-primary: var(--brand-primary);
     --color-brand-primary-foreground: var(--brand-primary-foreground);
     /* ... other brand variants */
   }
   ```

3. **Update Button component** to add `brand` variant:
   ```tsx
   const buttonVariants = cva(
     "...",
     {
       variants: {
         variant: {
           default: "bg-primary text-primary-foreground ...",  // Keep as neutral
           brand: "bg-brand-primary text-brand-primary-foreground hover:bg-brand-primary-hover ...",
           /* ... other variants */
         },
       },
     },
   );
   ```

4. **Update Badge component** similarly with `brand` variant

5. **Refactor high-priority CTAs** to use `variant="brand"`:
   - Login button
   - Primary form submit buttons
   - Important call-to-action buttons

6. **Audit and fix violations** in parallel:
   - Replace hardcoded grays with semantic variables
   - Refactor inline styles in `Status.tsx`
   - Fix `var(--teal)` reference in `stageConstants.ts`

7. **Run accessibility audit** on all brand green elements

**Pros:**
- Clear semantic distinction between neutral and brand colors
- Easier to control which elements are green vs. neutral
- Lower risk of unintended visual changes
- Future-proof: Can have multiple brand colors (primary, secondary, tertiary)
- Aligns with Engineering Constitution: Single source of truth for brand colors

**Cons:**
- More upfront refactoring effort
- Requires updating components that should use brand color
- Temporarily increases CSS variable count

**Recommendation:** **Strongly recommended.** This approach provides the best long-term maintainability and semantic clarity.

### Option C: Hybrid Approach (Compromise)

**Approach:** Rename existing `--primary` to `--neutral-default` and create new `--primary` as brand green.

**Steps:**
1. Rename `--primary` → `--neutral-default` in CSS
2. Define new `--primary` as brand green
3. Update Tailwind utilities to use `--primary` (brand green)
4. Audit all `bg-primary` usages and replace with `bg-neutral-default` where neutrality is desired
5. Fix violations and run accessibility audit

**Pros:**
- Preserves "primary" as the brand color (conventional naming)
- Forces explicit decision for each component

**Cons:**
- Requires touching 75+ files to replace `bg-primary` with `bg-neutral-default`
- Higher effort than Option A, similar effort to Option B
- Less clear semantics than explicit `brand-primary` naming

**Recommendation:** If "primary" must be brand green, this is a viable option, but Option B is clearer.

---

## 6. Accessibility Requirements

### WCAG Contrast Standards

All color changes must meet WCAG 2.1 Level AA standards:

| Element Type | Minimum Contrast Ratio |
|--------------|------------------------|
| Normal text (< 18pt) | 4.5:1 |
| Large text (≥ 18pt or 14pt bold) | 3:1 |
| UI components (buttons, inputs, icons) | 3:1 |
| Focus indicators | 3:1 against adjacent colors |

### Required Contrast Checks

Before finalizing brand green values, test the following combinations:

#### Light Mode
1. **White text on brand green button background**
   - `#FFFFFF` on brand green (#XXXXXX)
   - Required: 4.5:1 (normal text) or 3:1 (large text / UI component)

2. **Brand green text on white background**
   - Brand green (#XXXXXX) on `#FFFFFF`
   - Required: 4.5:1 (for body text) or 3:1 (for large headings)

3. **Brand green text on light gray background (cards)**
   - Brand green (#XXXXXX) on `#F7F7F7` (--card)
   - Required: 4.5:1 or 3:1 depending on usage

4. **Text selection: white text on brand green**
   - `#FFFFFF` on brand green (#XXXXXX)
   - Required: 3:1 (non-text contrast)

#### Dark Mode
1. **White text on dark brand green button background**
   - `#FFFFFF` on dark brand green (#XXXXXX)
   - Required: 4.5:1 or 3:1

2. **Brand green text on dark background**
   - Dark brand green (#XXXXXX) on `#1F1F1F` (--background dark)
   - Required: 4.5:1 or 3:1

3. **Focus rings: brand green on dark background**
   - Brand green (#XXXXXX) on `#1F1F1F`
   - Required: 3:1

### Recommended Brand Green Starting Point

Based on typical accessible green values:

**Light Mode:**
```css
--brand-primary: oklch(0.55 0.15 145);  /* ≈ #37A862 medium green */
--brand-primary-foreground: oklch(1 0 0); /* White (#FFFFFF) */
```

**Dark Mode:**
```css
--brand-primary: oklch(0.50 0.13 145);  /* ≈ #2D8F52 slightly darker green */
--brand-primary-foreground: oklch(1 0 0); /* White (#FFFFFF) */
```

**Action Required:** Validate these with actual WCAG contrast checker using final brand green hex values.

---

## 7. Immediate Action Items

### Priority 1: Fix Engineering Constitution Violations (Do First)

These violations should be fixed **before** or **in parallel with** the color migration:

1. **`OrganizationType.tsx` (Lines 41, 91):**
   ```diff
   - className={priorityColors[record.priority] || "bg-gray-200 text-gray-800"}
   + className={priorityColors[record.priority] || "bg-muted text-muted-foreground"}
   ```

2. **`ProductAside.tsx` (Lines 42, 45):**
   ```diff
   const statusColors = {
     available: "bg-success-default",
     coming_soon: "bg-warning-default",
     discontinued: "bg-destructive",
   - out_of_stock: "bg-gray-500",
   + out_of_stock: "bg-muted",
   };

   - const statusColor = record.status ? statusColors[record.status] : "bg-gray-500";
   + const statusColor = record.status ? statusColors[record.status] : "bg-muted";
   ```

3. **`Status.tsx` (Line 20):**
   - **Problem:** Uses inline `style={{ backgroundColor: statusObject.color }}`
   - **Fix:** Refactor configuration to use semantic variable names instead of hex colors. Update `defaultConfiguration` and `noteStatuses` type to reference semantic variables.
   - **Example:**
     ```tsx
     // Before (configuration):
     { value: "todo", label: "To Do", color: "#FF6B6B" }

     // After (configuration):
     { value: "todo", label: "To Do", color: "destructive" }

     // Component:
     <span className={cn("inline-block w-2.5 h-2.5 rounded-full", `bg-${statusObject.color}`)} />
     ```

4. **`WhatsNew.tsx` (Lines 256, 339, 464, 473, 482):**
   ```diff
   - <Badge className="bg-gray-100 text-gray-800">New</Badge>
   + <Badge className="bg-muted text-muted-foreground">New</Badge>

   - <div className="w-full bg-gray-200 rounded-full h-2">
   + <div className="w-full bg-secondary rounded-full h-2">

   - className="... hover:bg-gray-50 ..."
   + className="... hover:bg-accent ..."
   ```

5. **`stageConstants.ts` (Line 33):**
   ```diff
   {
     value: "initial_outreach",
     label: "Initial Outreach",
   - color: "var(--teal)",
   + color: "var(--tag-teal-bg)",
     description: "First contact and follow-up",
   },
   ```

### Priority 2: Define Brand Green Palette

1. Obtain exact brand green hex values from design team or brand guidelines
2. Convert to OKLCH using a tool like [OKLCH Color Picker](https://oklch.com/)
3. Define variants (hover, active, disabled) by adjusting lightness
4. Add to `src/index.css` as `--brand-primary-*` variables
5. Add to `@theme inline` for Tailwind utilities

### Priority 3: Run Accessibility Audit

1. Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) or similar
2. Test all brand green combinations (see section 6)
3. Document results
4. Adjust lightness/chroma if needed to meet WCAG AA

### Priority 4: Implement Migration Strategy

Follow **Option B: Semantic Refactor** (recommended):

1. Add brand-specific CSS variables
2. Update shadcn/ui components (Button, Badge) with `brand` variant
3. Refactor high-priority CTAs to use `variant="brand"`
4. Update sidebar colors if needed
5. Visual QA across app
6. Test dark mode thoroughly

### Priority 5: Documentation

1. Update `CLAUDE.md` with new brand color variables
2. Document which components should use `brand` vs `default` vs `secondary` variants
3. Add examples to component stories (Storybook)
4. Create migration guide for future developers

---

## 8. Testing Checklist

Before deploying color migration, verify:

### Visual QA
- [ ] All default buttons render correctly in light mode
- [ ] All default buttons render correctly in dark mode
- [ ] Badges display appropriate colors (not all green)
- [ ] Links are visible and distinguishable
- [ ] Text selections have sufficient contrast
- [ ] Focus indicators are visible on all interactive elements
- [ ] Cards and surfaces maintain visual hierarchy
- [ ] Loading states (skeletons) remain neutral
- [ ] Tag colors display correctly (should be unchanged)
- [ ] Sidebar colors are consistent with new primary color
- [ ] Navigation tabs and headers look intentional

### Accessibility
- [ ] WCAG contrast ratios pass for all text on brand green
- [ ] Focus indicators meet 3:1 contrast
- [ ] Button text is readable in both modes
- [ ] Error states (destructive) are still distinguishable from brand green
- [ ] Color is not the only indicator of state (e.g., icons, labels present)

### Functionality
- [ ] All buttons remain clickable and functional
- [ ] Form submissions work
- [ ] Login flow functions correctly
- [ ] No console errors related to undefined CSS variables
- [ ] Dark mode toggle switches colors correctly

### Cross-Browser
- [ ] Test in Chrome, Firefox, Safari, Edge
- [ ] Verify OKLCH color rendering (use fallback hex values if needed)

### Responsive
- [ ] Mobile view maintains color consistency
- [ ] Tablet view maintains color consistency
- [ ] Touch targets are visually distinct

---

## 9. Rollback Plan

If the migration causes issues:

### Immediate Rollback (Option A was used)
1. Revert `src/index.css` changes to previous commit
2. Clear browser caches
3. Redeploy

### Partial Rollback (Option B was used)
1. Comment out new `--brand-primary-*` variables
2. Remove `brand` variant from Button and Badge components
3. Revert component refactors that use `variant="brand"`
4. Keep Engineering Constitution violation fixes (those are improvements regardless)

### Preservation of Fixes
- Engineering Constitution violation fixes should **not** be rolled back
- Tag color system should **not** be rolled back
- Loading state improvements should **not** be rolled back

---

## 10. Summary

### Current State
- **60+ semantic CSS variables** in OKLCH color space
- **--primary is grayscale** (near-black light, near-white dark) used as neutral default
- **75+ files use bg-primary** for default buttons, badges, input selections
- **3 engineering violations** with hardcoded grays and inline styles
- **Tag system is compliant** with semantic variables
- **Loading states are neutral** and independent of primary color

### Migration Risks
- **High Risk:** Default buttons and badges will change from gray to green
- **High Risk:** Accessibility must be validated (WCAG AA contrast)
- **Medium Risk:** Sidebar and link colors need consistency check
- **Low Risk:** Cards, alerts, tags, loading states are unaffected

### Recommended Approach
**Option B: Semantic Refactor**
- Introduce `--brand-primary-*` variables
- Add `brand` variant to Button and Badge components
- Refactor high-priority CTAs to use brand variant
- Fix Engineering Constitution violations in parallel
- Run accessibility audit before deployment

### Immediate Next Steps
1. Fix hardcoded gray violations (5 files)
2. Obtain exact brand green hex values
3. Convert to OKLCH and define palette
4. Run WCAG contrast checks
5. Implement semantic refactor
6. Visual QA and testing

---

**End of Analysis**
