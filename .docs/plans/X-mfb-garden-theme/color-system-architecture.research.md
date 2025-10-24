# Color System Architecture Research

Comprehensive analysis of the Atomic CRM color system architecture to inform the MFB Garden Theme migration. The system uses a three-tier hierarchical architecture with OKLCH colors, Tailwind CSS 4 integration, and automated contrast validation.

## Relevant Files

### Primary Color Definitions
- `/home/krwhynot/projects/crispy-crm/src/index.css` (lines 1-431) - **Single source of truth** for all color definitions
  - Lines 44-197: `:root` block (light mode) with 180+ OKLCH color definitions
  - Lines 199-350: `.dark` block (dark mode overrides)
  - Lines 6-42: `@theme inline` directive for Tailwind CSS 4 integration
  - Lines 392-430: Tag color utility classes

### Color System TypeScript
- `/home/krwhynot/projects/crispy-crm/src/lib/color-types.ts` - Type definitions and semantic color mappings
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/tags/tag-colors.ts` - Tag color validation and CSS class helpers
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/tags/colors.ts` - Tag color array export
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/stageConstants.ts` - Stage color assignments using semantic variables

### Theme Management
- `/home/krwhynot/projects/crispy-crm/src/components/admin/theme-provider.tsx` - Runtime theme switching (light/dark/system)
- `/home/krwhynot/projects/crispy-crm/src/components/ui/button.tsx` - Reference component showing semantic token usage

### Validation & Documentation
- `/home/krwhynot/projects/crispy-crm/scripts/validate-colors.js` (510 lines) - WCAG contrast validation script
- `/home/krwhynot/projects/crispy-crm/docs/internal-docs/color-theming-architecture.docs.md` - Existing architecture documentation
- `/home/krwhynot/projects/crispy-crm/docs/archive/2025-10-color-system-preview/` - Archive of original October 2024 brand-green migration

## Architectural Patterns

### 1. Three-Tier Color Hierarchy (CRITICAL PATTERN)

The color system uses a strict hierarchical architecture where each tier references the layer below:

**Tier 1: Brand Foundation Colors** (src/index.css lines 47-72)
```css
/* Core Neutrals - OKLCH with cool undertone (hue ~285°) */
--neutral-50:  oklch(97.1% 0.002 284.5);  /* Lightest backgrounds */
--neutral-100: oklch(88.4% 0.005 284.8);
/* ... through ... */
--neutral-900: oklch(23.4% 0.021 288.0);  /* Darkest text */

/* Primary Brand - OKLCH (hue 125° = green) */
--brand-100: oklch(92% 0.08 125);         /* Light tint */
--brand-300: oklch(85% 0.12 125);         /* Soft variant */
--brand-500: oklch(74% 0.12 125);         /* Brand identity color */
--brand-650: oklch(60% 0.11 125);         /* Hover state */
--brand-700: oklch(50% 0.10 125);         /* WCAG-compliant CTAs */
--brand-750: oklch(45% 0.095 125);        /* Active state */
--brand-800: oklch(35% 0.08 125);         /* Dark/pressed states */

/* Accent Colors - OKLCH with reduced chroma */
--accent-purple: oklch(50% 0.20 295);     /* Purple at 295° */
--accent-purple-light: oklch(85% 0.10 295);
--accent-teal: oklch(70% 0.12 180);       /* Teal at 180° */
--accent-teal-light: oklch(90% 0.06 180);
```

**Tier 2: Semantic Tokens** (src/index.css lines 74-96)
```css
/* Foundation - Reference neutrals */
--background: var(--neutral-50);
--foreground: var(--neutral-700);
--card: var(--neutral-50);
--card-foreground: var(--neutral-700);

/* Interactive - Reference brand colors */
--primary: var(--brand-700);              /* Primary CTAs */
--primary-foreground: oklch(0.985 0 0);   /* White text */
--secondary: var(--neutral-100);
--secondary-foreground: var(--neutral-700);
--muted: var(--neutral-200);
--muted-foreground: var(--neutral-400);
--accent: var(--accent-purple);
--accent-foreground: oklch(0.985 0 0);
--destructive: oklch(0.577 0.245 27.325); /* Direct OKLCH for red */

/* Structure */
--border: var(--neutral-200);
--input: var(--neutral-200);
--ring: var(--brand-500);                 /* Focus ring = brand identity */
```

**Tier 3: Component-Specific Colors** (src/index.css lines 98-184)
```css
/* State Colors - Success (green hue 145°) */
--success-subtle: oklch(90% 0.06 145);
--success-default: oklch(63% 0.14 145);
--success-strong: oklch(50% 0.15 145);
--success-bg: oklch(95% 0.04 145);
--success-border: oklch(80% 0.08 145);
--success-hover: oklch(68% 0.13 145);
--success-active: oklch(58% 0.145 145);
--success-disabled: oklch(75% 0.05 145);
/* Repeated pattern for warning (hue 85°), info (hue 230°), error (hue 25°) */

/* Tag Colors - 8 color pairs with bg/fg */
--tag-warm-bg: oklch(92.1% 0.041 69.5);   /* Warm orange */
--tag-warm-fg: oklch(20% 0.02 69.5);
--tag-green-bg: oklch(95% 0.023 149.3);
--tag-green-fg: oklch(20% 0.02 149.3);
/* ... 6 more pairs (teal, blue, purple, yellow, gray, pink) */

/* Chart Colors - Reference existing palette */
--chart-1: var(--neutral-600);            /* Baseline data (neutral) */
--chart-2: var(--brand-500);              /* Our performance (brand) */
--chart-3: var(--accent-teal);            /* Alternative data */
--chart-4: var(--accent-purple);          /* Special data */
--chart-5: var(--warning-default);        /* Important/warning */

/* Sidebar Navigation */
--sidebar: var(--neutral-100);
--sidebar-foreground: var(--neutral-700);
--sidebar-primary: var(--brand-700);
--sidebar-active-bg: var(--brand-100);    /* Active item background */
--sidebar-active-text: var(--brand-700);  /* Active item text */
--sidebar-active-indicator: var(--brand-700);

/* Shadow System - 3-tier elevation */
--shadow-card-1: 0 1px 3px oklch(0 0 0 / 0.12);      /* Subtle */
--shadow-card-2: 0 2px 6px oklch(0 0 0 / 0.15);      /* Medium */
--shadow-card-3: 0 3px 8px oklch(0 0 0 / 0.18);      /* Prominent */
--shadow-card-1-hover: 0 2px 6px oklch(0 0 0 / 0.18);
--shadow-card-2-hover: 0 4px 12px oklch(0 0 0 / 0.25);
--shadow-card-3-hover: 0 6px 16px oklch(0 0 0 / 0.3);
```

### 2. Dark Mode Architecture (INVERSION PATTERN)

**Mechanism**: Class-based switching with neutral inversion strategy

```css
.dark {
  /* INVERTED Neutrals - 50↔900, 100↔800, etc. */
  --neutral-50:  oklch(23.4% 0.021 288.0);  /* Now darkest (was 900) */
  --neutral-100: oklch(31.5% 0.019 287.6);  /* Dark (was 800) */
  --neutral-900: oklch(97.1% 0.002 284.5);  /* Lightest (was 50) */

  /* ADJUSTED Brand - Lighter for dark backgrounds */
  --brand-700: oklch(65% 0.12 125);         /* Lighter than light mode */
  --brand-650: oklch(70% 0.12 125);         /* Lighter hover */

  /* Semantic tokens AUTO-ADAPT via variable references */
  --background: var(--neutral-50);          /* Now dark (23.4% lightness) */
  --foreground: var(--neutral-900);         /* Now light (97.1% lightness) */
  --primary: var(--brand-700);              /* Uses adjusted brand color */

  /* Special: Transparent borders for softer edges */
  --border: oklch(1 0 0 / 15%);             /* Semi-transparent white */
  --input: oklch(1 0 0 / 15%);

  /* Shadows: Stronger opacity for depth perception */
  --shadow-card-1: 0 2px 4px oklch(0 0 0 / 0.35);  /* vs 0.12 in light */
  --shadow-card-2: 0 3px 6px oklch(0 0 0 / 0.40);  /* vs 0.15 in light */
}
```

**Key Insight**: The inversion pattern means **only Tier 1 colors need dark mode overrides**. Tier 2 semantic tokens automatically adapt because they reference Tier 1 variables.

**Runtime Switching** (src/components/admin/theme-provider.tsx):
```tsx
// Adds/removes .dark class on document root
useEffect(() => {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");

  if (theme === "system") {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches ? "dark" : "light";
    root.classList.add(systemTheme);
  } else {
    root.classList.add(theme);
  }
}, [theme]);
```

State persisted via React Admin's `useStore` (localStorage under `"theme"` key).

### 3. Tailwind CSS 4 Integration (BRIDGE LAYER)

**@theme inline Directive** (src/index.css lines 6-42):
```css
@custom-variant dark (&:is(.dark *));

@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* Bridge: Map semantic variables to Tailwind's color system */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-muted: var(--muted);
  --color-accent: var(--accent);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --color-chart-1: var(--chart-1);
  /* ... chart-2 through chart-5 ... */
  --color-sidebar: var(--sidebar);
  /* ... all sidebar tokens ... */
}
```

**Result**: This enables Tailwind utilities like:
- `bg-primary` → `var(--color-primary)` → `var(--primary)` → `var(--brand-700)`
- `text-foreground` → `var(--color-foreground)` → `var(--foreground)` → `var(--neutral-700)` (light) or `var(--neutral-900)` (dark)
- `border-ring` → `var(--color-ring)` → `var(--ring)` → `var(--brand-500)`

**No tailwind.config.js**: Tailwind CSS 4 uses CSS-first configuration. All theme configuration is in the CSS file.

### 4. Component Color Consumption Patterns

**Pattern A: Tailwind Utility Classes** (PREFERRED - 90% of usage)
```tsx
// src/components/ui/button.tsx (lines 12-22)
const buttonVariants = cva(
  "inline-flex items-center justify-center ...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-white hover:bg-destructive/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        outline: "border bg-background hover:bg-accent",
      }
    }
  }
);
```

**Pattern B: CSS Variable Syntax in Tailwind** (For dynamic/computed values)
```tsx
// Example: Custom shadows or borders not in utility classes
className="shadow-[var(--shadow-card-2)] hover:shadow-[var(--shadow-card-2-hover)]"
className="border-[var(--primary)] bg-[var(--accent-purple-light)]"
```

**Pattern C: Inline Styles** (Runtime-dynamic colors only)
```tsx
// src/atomic-crm/opportunities/stageConstants.ts (lines 28-91)
export function getOpportunityStageColor(stageValue: string): string {
  const stage = OPPORTUNITY_STAGES.find(s => s.value === stageValue);
  return stage?.color || "var(--muted)";
  // Returns: "var(--info-subtle)", "var(--success-strong)", etc.
}

// Usage in components:
style={{ borderBottom: `2px solid ${getOpportunityStageColor(stage)}` }}
```

**Pattern D: Utility Classes** (For tag system)
```css
/* src/index.css lines 392-430 */
.tag-warm {
  background-color: var(--tag-warm-bg);
  color: var(--tag-warm-fg);
}
.tag-green { /* ... */ }
/* ... 6 more tag classes ... */
```

```tsx
// src/atomic-crm/tags/tag-colors.ts
export function getTagColorClass(color: string): string {
  const semanticColor = SEMANTIC_COLORS[color as TagColorName];
  return semanticColor?.cssClass || SEMANTIC_COLORS.gray.cssClass;
}
```

### 5. Color Validation System

**Automated WCAG Contrast Checking** (scripts/validate-colors.js):

**Algorithm**:
1. Parse OKLCH from CSS → Convert to linear sRGB
2. Apply sRGB gamma correction → 8-bit RGB
3. Calculate relative luminance (WCAG formula)
4. Compute contrast ratio: `(lighter + 0.05) / (darker + 0.05)`
5. Compare against minimums:
   - **4.5:1** for normal text (WCAG AA)
   - **3.0:1** for focus rings/large text

**Test Coverage**:
- 8 tag color pairs × 2 modes = 16 tests
- 7 semantic color pairs (primary, secondary, destructive, accent, muted, card, popover) × 2 modes = 14 tests
- 2 focus ring tests × 2 modes = 4 tests
- **Total: 34 automated contrast tests**

**CI/CD Integration**:
```bash
npm run validate:colors  # Exits with code 1 on failures
```

**Output**: JSON report at `/color-contrast-report.json` with:
- Summary: total/passed/failed/warnings
- Failed tests with specific variables and contrast ratios
- Console logging with ✅/❌ indicators

## Edge Cases & Gotchas

### 1. OKLCH Format Variations
**Issue**: Script must handle both percentage and decimal lightness values
```css
oklch(74% 0.12 125)   /* Percentage format */
oklch(0.74 0.12 125)  /* Decimal format */
```
**Solution**: Validation script detects `%` suffix and normalizes (line 94-97)

**Alpha Channel**:
```css
oklch(0.985 0 0)         /* Opaque white (no alpha) */
oklch(1 0 0 / 15%)       /* 15% opacity white */
oklch(0 0 0 / 0.6)       /* 60% opacity black */
```

### 2. Neutral Inversion Magic
**Gotcha**: Semantic tokens like `--foreground: var(--neutral-700)` work in both modes because:
- Light mode: `--neutral-700` = `oklch(39.6% ...)` (dark gray)
- Dark mode: `--neutral-700` = `oklch(80.2% ...)` (light gray) ← inverted

**Result**: Components using semantic tokens (`bg-foreground`, `text-background`) automatically adapt to dark mode without code changes.

### 3. Brand Color Coupling
**Current State**:
- `--primary: var(--brand-700)` - Primary CTAs use brand color
- `--ring: var(--brand-500)` - Focus rings use brand identity color
- `--chart-2: var(--brand-500)` - "Our performance" uses brand
- `--sidebar-active-bg: var(--brand-100)` - Active nav items

**Impact for MFB Migration**: Changing `--brand-*` colors will affect:
1. All primary buttons
2. All focus states
3. Chart "our data" series
4. Sidebar active states

**Decision Point**: Should MFB theme decouple primary CTA color from brand identity? Or keep them linked?

### 4. No Runtime Color Configuration
**Limitation**: Colors cannot be configured via `<CRM>` props
```tsx
// src/atomic-crm/root/ConfigurationContext.tsx
// ConfigurationContext manages:
// - logos, opportunityStages, noteStatuses, taskTypes
// - BUT NOT colors
```

**Why**: Type safety, build optimization, CSS-only theme switching

**Implication**: All color changes require editing `src/index.css` directly

### 5. Tag Color System Type Safety
**Architecture** (src/lib/color-types.ts):
```ts
export type TagColorName =
  | 'warm' | 'yellow' | 'pink' | 'green'
  | 'teal' | 'blue' | 'purple' | 'gray';

export const SEMANTIC_COLORS: Record<TagColorName, SemanticColorToken> = {
  warm: { name: 'warm', cssClass: 'tag-warm', hexFallback: '#eddcd2' },
  // ... 7 more ...
};

export const VALID_TAG_COLORS: TagColorName[] = [
  'warm', 'green', 'teal', 'blue', 'purple', 'yellow', 'gray', 'pink'
];
```

**Validation** (src/atomic-crm/tags/tag-colors.ts):
```ts
export function validateTagColor(value: string): string | undefined {
  if (VALID_TAG_COLORS.includes(value as TagColorName)) {
    return undefined;
  }
  return "Invalid color selection";
}
```

**Gotcha**: `hexFallback` values are legacy from pre-OKLCH migration. Not used in production, only for type safety.

### 6. Shadow System Differs by Mode
**Light Mode**: Subtle shadows with low opacity
```css
--shadow-card-1: 0 1px 3px oklch(0 0 0 / 0.12);
```

**Dark Mode**: Stronger shadows for depth perception
```css
--shadow-card-1: 0 2px 4px oklch(0 0 0 / 0.35);  /* 3x opacity */
```

**Usage** (src/atomic-crm/opportunities/stageConstants.ts):
```ts
export interface OpportunityStage {
  elevation: 1 | 2 | 3;  // Maps to shadow-card-1/2/3
}
```

### 7. State Color Independence
**Design Decision**: State colors (success, warning, info, error) are **NOT referenced** by semantic tokens. They are standalone OKLCH definitions.

```css
/* These do NOT reference --brand-* or --neutral-* */
--success-default: oklch(63% 0.14 145);   /* Standalone green (hue 145°) */
--warning-default: oklch(70% 0.145 85);   /* Standalone orange (hue 85°) */
```

**Rationale**: State colors must be universally recognizable (green=success, red=error) regardless of brand identity.

### 8. Chart Color Strategy
**Current Approach** (src/index.css lines 166-171):
```css
--chart-1: var(--neutral-600);     /* Baseline/comparison data */
--chart-2: var(--brand-500);       /* Our performance (brand identity) */
--chart-3: var(--accent-teal);     /* Alternative dataset 1 */
--chart-4: var(--accent-purple);   /* Alternative dataset 2 */
--chart-5: var(--warning-default); /* Important/threshold data */
```

**Philosophy**:
- Neutral for "others/baseline"
- Brand green for "our data" (creates association)
- Accents for categorical differentiation
- Warning for thresholds/targets

**MFB Consideration**: If brand changes from green to earth tones, chart-2 will shift accordingly. Review data visualization for semantic clarity.

### 9. Sidebar Active State Complexity
**Multiple Color Tokens** (src/index.css lines 173-184):
```css
--sidebar: var(--neutral-100);                  /* Background */
--sidebar-foreground: var(--neutral-700);       /* Text */
--sidebar-primary: var(--brand-700);            /* Primary items */
--sidebar-accent: var(--neutral-200);           /* Hover */
--sidebar-active-bg: var(--brand-100);          /* Active background */
--sidebar-active-text: var(--brand-700);        /* Active text */
--sidebar-active-indicator: var(--brand-700);   /* Active border/indicator */
```

**Gotcha**: Active state uses `--brand-100` (lightest brand tint) for background and `--brand-700` (darkest) for text. High contrast is intentional for accessibility.

## Color System Flow Diagram

```
┌────────────────────────────────────────────────────────────────┐
│  src/index.css - SINGLE SOURCE OF TRUTH (431 lines)            │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ TIER 1: BRAND FOUNDATION (Lines 47-72)                 │   │
│  │                                                         │   │
│  │  :root (LIGHT MODE)              .dark (DARK MODE)     │   │
│  │  --neutral-50 → 900 (cool hue)   --neutral-50 ← 900    │   │
│  │  --brand-100 → 800 (hue 125°)    --brand-* (adjusted)  │   │
│  │  --accent-purple/teal             --accent-* (lighter) │   │
│  └────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ TIER 2: SEMANTIC TOKENS (Lines 74-96)                  │   │
│  │                                                         │   │
│  │  --background: var(--neutral-50)   ← Auto-adapts       │   │
│  │  --primary: var(--brand-700)       ← Auto-adapts       │   │
│  │  --border: var(--neutral-200)      ← Auto-adapts       │   │
│  │  --ring: var(--brand-500)          ← Auto-adapts       │   │
│  │  --destructive: oklch(...)         ← Standalone        │   │
│  └────────────────────────────────────────────────────────┘   │
│                          ↓                                      │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ TIER 3: COMPONENT-SPECIFIC (Lines 98-184)              │   │
│  │                                                         │   │
│  │  State Colors (8 variants each):                       │   │
│  │    --success/warning/info/error-[subtle/default/...]   │   │
│  │  Tag Colors (8 pairs):                                 │   │
│  │    --tag-warm/green/teal/blue/purple/yellow/gray/pink  │   │
│  │  Chart: --chart-1 → 5                                  │   │
│  │  Sidebar: --sidebar-* (9 tokens)                       │   │
│  │  Shadows: --shadow-card-1/2/3 + hover variants         │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────┐
│  @theme inline {} - TAILWIND BRIDGE (Lines 6-42)               │
│  --color-primary: var(--primary) → enables bg-primary          │
│  --color-background: var(--background) → enables bg-background │
└────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────┐
│  COMPONENT CONSUMPTION (4 patterns)                            │
│                                                                 │
│  A. Tailwind: bg-primary text-foreground (90% usage)           │
│  B. CSS Var: border-[var(--primary)] (dynamic)                 │
│  C. Inline: style={{ color: getColor() }} (runtime)           │
│  D. Utility: className="tag-warm" (tag system)                 │
└────────────────────────────────────────────────────────────────┘
                          ↓
┌────────────────────────────────────────────────────────────────┐
│  ThemeProvider - RUNTIME SWITCHING                             │
│  - Adds/removes .dark class on <html>                          │
│  - Persists to localStorage ("theme" key)                      │
│  - System preference via matchMedia                            │
│  - Triggers CSS cascade (neutral inversion + brand adjust)     │
└────────────────────────────────────────────────────────────────┘
```

## MFB Garden Theme Migration Impact Assessment

### Colors That MUST Change (Tier 1 - Foundation)

**Brand Colors** (src/index.css lines 59-66):
```css
/* CURRENT: Green (hue 125°) */
--brand-100: oklch(92% 0.08 125);   /* #e6eed9 */
--brand-300: oklch(85% 0.12 125);   /* #d5e3bf */
--brand-500: oklch(74% 0.12 125);   /* #9BBB59 - Brand identity */
--brand-650: oklch(60% 0.11 125);
--brand-700: oklch(50% 0.10 125);   /* #5a7030 - Primary CTAs */
--brand-750: oklch(45% 0.095 125);
--brand-800: oklch(35% 0.08 125);   /* #3a4a25 */

/* MFB TARGET: Warm earth tones (suggest hue 30-50° range) */
/* Example warm brown/cream palette: */
--brand-100: oklch(92% 0.08 45);    /* Light cream */
--brand-300: oklch(85% 0.12 45);    /* Soft tan */
--brand-500: oklch(74% 0.12 45);    /* Warm earth - NEW IDENTITY */
--brand-650: oklch(60% 0.11 45);
--brand-700: oklch(50% 0.10 45);    /* Rich brown - CTAs */
--brand-750: oklch(45% 0.095 45);
--brand-800: oklch(35% 0.08 45);    /* Deep earth */
```

**Neutrals** (src/index.css lines 47-57):
```css
/* CURRENT: Cool undertone (hue ~285°) */
--neutral-50:  oklch(97.1% 0.002 284.5);
/* ... through ... */
--neutral-900: oklch(23.4% 0.021 288.0);

/* MFB TARGET: Warm undertone (suggest hue 60-90°) */
--neutral-50:  oklch(97.1% 0.002 75);   /* Warm off-white */
--neutral-100: oklch(88.4% 0.005 75);
/* ... maintain lightness levels, shift hue ... */
--neutral-900: oklch(23.4% 0.021 75);   /* Warm near-black */
```

**Accent Colors** (src/index.css lines 68-72):
```css
/* CURRENT: Purple + Teal split-complementary */
--accent-purple: oklch(50% 0.20 295);
--accent-teal: oklch(70% 0.12 180);

/* MFB TARGET: Complementary to warm earth tones */
/* Option A: Keep purple/teal for contrast */
/* Option B: Shift to warmer accents (terracotta, sage) */
--accent-purple: oklch(50% 0.18 320);  /* Warmer purple/mauve */
--accent-teal: oklch(70% 0.12 160);    /* Sage green */
```

### Colors That AUTO-ADAPT (Tier 2 - Semantic)

These **automatically inherit** new brand colors via variable references:
- `--primary: var(--brand-700)` → New CTA color
- `--ring: var(--brand-500)` → New focus ring
- `--sidebar-active-bg: var(--brand-100)` → New active state
- `--background: var(--neutral-50)` → New warm backgrounds
- All border/muted/card colors → New warm neutrals

**No edits required** beyond Tier 1 changes.

### Colors To REVIEW (Tier 3 - Component)

**Tag Colors** (src/index.css lines 138-154):
- Current: 8 hues (warm 69.5°, green 149.3°, teal 196.7°, blue 265.6°, purple 294.6°, yellow 108.8°, gray 0°, pink 350.2°)
- **Decision**: Keep existing hues for visual distinction? Or shift to harmonize with warm earth palette?
- **Recommendation**: Keep existing - tags need differentiation

**State Colors** (src/index.css lines 98-136):
- Success (hue 145°), Warning (hue 85°), Info (hue 230°), Error (hue 25°)
- **Decision**: Universal recognizability vs palette harmony?
- **Recommendation**: Keep success/error hues, consider warming info to match palette

**Chart Colors** (src/index.css lines 166-171):
- `--chart-2: var(--brand-500)` will inherit new earth tone
- **Review**: Does "our data" in warm brown convey intended meaning in charts?
- **Recommendation**: Test with sample dashboard data

### Dark Mode Updates Required

All Tier 1 colors in `.dark` block (lines 199-337) must be updated:
```css
.dark {
  /* Adjust brand colors for dark backgrounds */
  --brand-700: oklch(65% 0.12 45);  /* Lighter warm brown */
  --brand-650: oklch(70% 0.12 45);

  /* Adjust neutrals with warm undertone */
  --neutral-50: oklch(23.4% 0.021 75);  /* Inverted + warm */
  /* ... */

  /* Test contrast ratios - may need lightness adjustments */
}
```

### Validation Requirements

**WCAG Contrast Targets** (npm run validate:colors):
1. `--brand-700` on white: ≥ 4.5:1 (primary buttons)
2. `--neutral-700` on `--neutral-50`: ≥ 4.5:1 (body text)
3. `--brand-500` on white: ≥ 3.0:1 (focus rings)
4. All 8 tag pairs: ≥ 4.5:1 (tag text)

**Iterative Process**:
1. Update hue values
2. Run validation script
3. Adjust lightness/chroma to meet ratios
4. Repeat until all 34 tests pass

## Migration Checklist

### Phase 1: Color Definition (2-3 hours)
- [ ] Update `--brand-*` values (lines 59-66) to warm earth hue (30-50°)
- [ ] Update `--neutral-*` values (lines 47-57) to warm undertone (60-90°)
- [ ] Review `--accent-*` colors (lines 68-72) for palette harmony
- [ ] Update `.dark` brand colors (lines 212-219) with lighter variants
- [ ] Update `.dark` neutral colors (lines 201-210) maintaining inversion

### Phase 2: Validation (1-2 hours)
- [ ] Run `npm run validate:colors` continuously
- [ ] Fix contrast violations by adjusting lightness values
- [ ] Verify all 34 tests pass (8 tags + 7 semantic + 2 focus × 2 modes)
- [ ] Manual spot-check: buttons, focus rings, text on backgrounds

### Phase 3: Visual Review (2-4 hours)
- [ ] Test `/opportunities` board (stage colors, shadows)
- [ ] Test `/dashboard` (charts with new `--chart-2` color)
- [ ] Test sidebar navigation (active states with `--brand-100`)
- [ ] Test all tag colors in tag picker
- [ ] Test light/dark mode switching
- [ ] Screenshot critical views for comparison

### Phase 4: Component-Specific (Optional, 1-2 hours)
- [ ] Review tag color hues for visual distinction
- [ ] Consider warming info state color (hue 230° → 200°?)
- [ ] Test chart readability with earth tone `--chart-2`
- [ ] Verify state colors (success/warning/error) still feel semantic

### Phase 5: Documentation (1 hour)
- [ ] Update CLAUDE.md color philosophy section
- [ ] Archive current palette HTML preview
- [ ] Create new color guide HTML with MFB palette
- [ ] Update internal docs with new hue values

**Estimated Total Effort: 6-12 hours**

## Technical Debt & Recommendations

### ✅ Strengths
1. **Single source of truth** - All colors in one file
2. **OKLCH perceptual uniformity** - Consistent lightness across hues
3. **Automated validation** - WCAG compliance enforced
4. **Type safety** - Tag colors have TypeScript enums
5. **Auto-adapting dark mode** - Neutral inversion pattern is elegant
6. **CSS-only theme switching** - No JavaScript overhead

### ⚠️ Caution Areas
1. **Brand-primary coupling** - Changing brand affects CTA colors (intended, but noteworthy)
2. **Chart color semantics** - `--chart-2` tied to brand may lose meaning with earth tones
3. **No runtime configuration** - Cannot A/B test color palettes without CSS changes
4. **CSS variable Tailwind syntax** - `border-[var(--primary)]` bypasses type safety

### 🔧 Recommended Process
1. **Start with neutral hue shift** - Test warm undertones before brand colors
2. **Validate incrementally** - Run validation after each tier of changes
3. **Use browser DevTools** - Live-edit CSS variables to preview before committing
4. **Create archive snapshot** - Save current palette HTML before migration
5. **Document hue choices** - Record rationale for MFB hue selections (30-50° range?)

### 📊 Post-Migration Validation
- [ ] All 34 contrast tests pass
- [ ] Manual accessibility audit (keyboard nav, screen reader)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile responsive check (color visibility on small screens)
- [ ] Print stylesheet review (if applicable)

## Relevant Docs

### Internal Documentation
- `/home/krwhynot/projects/crispy-crm/docs/internal-docs/color-theming-architecture.docs.md` - Existing architecture doc
- `/home/krwhynot/projects/crispy-crm/docs/archive/2025-10-color-system-preview/NEW-color-guide.html` - Original brand-green palette preview
- `/home/krwhynot/projects/crispy-crm/CLAUDE.md` - Engineering constitution (Color principle #8)

### External Resources
- [OKLCH Color Notation](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) - MDN reference
- [OKLCH Color Picker](https://oklch.com/) - Interactive picker for OKLCH values
- [WCAG 2.1 Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) - 4.5:1 minimum
- [Tailwind CSS 4 Documentation](https://tailwindcss.com/docs) - @theme directive
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*) - Variable usage guide

### Key Commands
```bash
npm run validate:colors        # Run WCAG contrast validation
npm run dev                    # Preview changes in browser
```

### Color Conversion Tools
- **Browser DevTools**: Live-edit CSS variables in Elements panel
- **OKLCH to Hex**: Use `oklch.com` for preview/conversion
- **Contrast Checker**: Script output or use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
