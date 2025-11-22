# Design System Foundations Research

**Status**: Foundation Research Complete
**Date**: 2025-11-16
**Purpose**: Document current design system implementation before unified rollout

## Executive Summary

Atomic CRM has a **mature, well-architected design system** built on Tailwind v4 with semantic color tokens, comprehensive spacing system, and accessibility-first patterns. The system follows the Engineering Constitution's "document, don't over-engineer" principle.

**Key Findings:**
- ✅ Tailwind v4 configured via Vite plugin (no separate config file)
- ✅ Semantic color system with 150+ OKLCH tokens in `:root` and `.dark`
- ✅ Spacing system with CSS custom properties (desktop-optimized)
- ✅ Elevation system with 3 tiers (warm-tinted shadows)
- ✅ Animation utilities via `tw-animate-css` + `motion-safe:` patterns
- ✅ Accessibility utilities (`focusRing`, `srOnly`, keyboard nav hooks)
- ❌ No `.card-container` or `.interactive-card` utility classes (inline only)
- ❌ No premium button classes (variants via CVA in button.constants.ts)

---

## 1. Tailwind v4 Configuration

### Location: `vite.config.ts`

```typescript
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(), // Line 66 - Tailwind v4 Vite plugin
    // ...
  ],
  // ...
}));
```

**Key Details:**
- **No `tailwind.config.js`** - Tailwind v4 uses CSS-based configuration
- Configuration lives in `src/index.css` via `@theme inline` directive
- Vite plugin handles JIT compilation and Fast Refresh
- Path alias: `@/*` → `src/*` (Line 238)

---

## 2. Color System Architecture

### Location: `src/index.css` (Lines 278-776)

**Philosophy**: MFB "Garden to Table" theme with paper cream background and warm-tinted colors.

### 2.1 Core Color Tokens

#### Neutral Scale (OKLCH format)
```css
:root {
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
}
```

**Hue Strategy**: Paper cream undertone at hue 92° for consistency with background.

#### Brand Colors (Forest Green - hue 142°)
```css
--brand-100: oklch(88% 0.045 142);  /* Very light sage */
--brand-300: oklch(75% 0.065 142);  /* Soft sage */
--brand-500: oklch(38% 0.085 142);  /* #336600 - Primary identity */
--brand-650: oklch(45% 0.09 142);   /* Hover state */
--brand-700: oklch(32% 0.08 142);   /* Darker emphasis */
--brand-750: oklch(28% 0.075 142);  /* Active state */
--brand-800: oklch(24% 0.07 142);   /* Darkest pressed */
```

**WCAG Compliance**: Primary button (brand-500) achieves AAA contrast (10.8:1).

#### Accent Colors (Clay/Terracotta - hue 72°)
```css
--accent-clay-700: oklch(52% 0.105 72); /* Dark clay */
--accent-clay-600: oklch(58% 0.1 72);   /* Medium-dark */
--accent-clay-500: oklch(63% 0.095 72); /* Clay orange */
--accent-clay-400: oklch(72% 0.08 72);  /* Light clay */
--accent-clay-300: oklch(82% 0.06 72);  /* Very light */
```

### 2.2 Semantic Mappings

```css
/* Foundation colors */
--background: oklch(97.5% 0.01 92);  /* Paper cream */
--foreground: oklch(20% 0.012 85);   /* Dark text */
--card: oklch(100% 0 0);             /* Pure white */
--card-foreground: var(--neutral-700);

/* Interactive colors */
--primary: var(--brand-500);
--primary-foreground: oklch(99% 0 0);
--secondary: var(--neutral-100);
--secondary-foreground: var(--neutral-700);
--muted: var(--neutral-200);
--muted-foreground: var(--neutral-400);
--accent: var(--accent-clay-500);
--accent-foreground: oklch(0.985 0 0);
--destructive: oklch(58% 0.18 27);
--destructive-foreground: oklch(99% 0 0);

/* Borders and focus */
--border: var(--neutral-200);
--input: var(--neutral-200);
--ring: oklch(55% 0.095 142);  /* Brightened for visibility */
```

### 2.3 Semantic State Colors

#### Success (Emerald - hue 155°)
```css
--success-subtle: oklch(92% 0.08 155);
--success-default: oklch(56% 0.115 155);  /* Brighter emerald */
--success-strong: oklch(48% 0.12 155);
--success-bg: oklch(95% 0.05 155);
--success-border: oklch(78% 0.09 155);
--success-hover: oklch(60% 0.112 155);
--success-active: oklch(52% 0.117 155);
--success-disabled: oklch(72% 0.06 155);
```

#### Warning (Golden Amber - hue 85°)
```css
--warning-default: oklch(68% 0.14 85);
--warning-bg: oklch(96% 0.045 85);
--warning-border: oklch(82% 0.115 85);
/* ... complete 8-token system */
```

#### Info (Sage-Teal - hue 200°)
```css
--info-default: oklch(58% 0.065 200);
/* ... complete 8-token system */
```

#### Error (Terracotta - hue 25°)
```css
--error-default: oklch(58% 0.13 25);
/* ... complete 8-token system */
```

### 2.4 Chart Colors (Earth-Tone Palette)

```css
/* Chart 1: Warm Tan/Soil (Baseline) */
--chart-1: oklch(55% 0.035 60);
--chart-1-fill: oklch(55% 0.035 60);
--chart-1-stroke: oklch(37% 0.035 60);

/* Chart 2: Forest Green (Primary Data) */
--chart-2: oklch(52% 0.095 142);  /* Brightened from brand-500 */
--chart-2-fill: oklch(52% 0.095 142);
--chart-2-stroke: oklch(35% 0.085 142);

/* Chart 3-8: Terracotta, Sage, Amber, Sage-Teal, Eggplant, Mushroom */
/* ... see Lines 416-456 for complete palette */

/* Chart support tokens */
--chart-gridline: oklch(90% 0.01 92);  /* Subtle paper cream */
--chart-axis-text: var(--muted-foreground);
--chart-disabled: oklch(78% 0.008 85);
```

### 2.5 Tag Colors (Organization Types)

High-contrast tags that pop on paper cream background:

```css
--tag-warm-bg: oklch(87% 0.07 80);
--tag-warm-fg: oklch(20% 0.02 85);
--tag-green-bg: oklch(88% 0.06 155);
--tag-sage-bg: oklch(87% 0.05 120);
--tag-clay-bg: oklch(85% 0.075 50);
--tag-amber-bg: oklch(90% 0.08 85);
/* ... 12 total tag color pairs */
```

**Pattern**: Light backgrounds with dark foreground for readability on both light/dark modes.

### 2.6 Tailwind Theme Mappings

```css
@theme inline {
  /* Radius system */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* Color mappings for Tailwind utilities */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-primary: var(--primary);
  --color-destructive: var(--destructive);
  /* ... Lines 17-74 */

  /* Tag color utilities */
  --color-tag-warm: var(--tag-warm-bg);
  --color-tag-warm-fg: var(--tag-warm-fg);
  /* ... Lines 76-86 */
}
```

**Usage**: Tailwind utilities like `bg-primary`, `text-foreground` map to semantic tokens.

### 2.7 Tag Utility Classes

**Location**: `src/index.css` (Lines 818-877)

```css
.tag-warm {
  background-color: var(--tag-warm-bg);
  color: var(--tag-warm-fg);
}
.tag-green { /* ... */ }
.tag-teal { /* ... */ }
/* ... 12 tag classes total */
```

**Usage Example**:
```tsx
<Badge className="tag-sage">Principal</Badge>
```

---

## 3. Spacing System

### Location: `src/index.css` (Lines 88-121)

**Philosophy**: Desktop-optimized data density with semantic tokens.

### 3.1 Grid System

```css
@theme inline {
  /* Grid System */
  --spacing-grid-columns-desktop: 12;
  --spacing-grid-columns-ipad: 8;
  --spacing-gutter-desktop: 12px;   /* Reduced from 24px */
  --spacing-gutter-ipad: 20px;
}
```

### 3.2 Edge Padding (Screen Borders)

```css
--spacing-edge-desktop: 24px;     /* Reduced from 120px */
--spacing-edge-ipad: 60px;
--spacing-edge-mobile: 16px;
```

**Breakpoints**: Mobile (375-767px), iPad (768-1024px), Desktop (1440px+)

### 3.3 Vertical Rhythm

```css
--spacing-section: 24px;          /* Between major sections */
--spacing-widget: 16px;           /* Between widgets */
--spacing-content: 12px;          /* Within content areas */
--spacing-compact: 8px;           /* Tight spacing */
```

**Desktop Data Density Optimization**: All values reduced by ~25% from original iPad-first design.

### 3.4 Widget/Card Internals

```css
--spacing-widget-padding: 12px;   /* Card padding */
--spacing-widget-min-height: 240px;
--spacing-top-offset: 60px;       /* Below header */
```

### 3.5 Desktop Data Density Tokens

```css
--row-height-compact: 32px;       /* Data table rows */
--row-height-comfortable: 40px;   /* Default rows */
--row-padding-desktop: 6px 12px;  /* Vertical, horizontal */
--hover-zone-padding: 4px;        /* Action button zones */
--action-button-size: 28px;       /* Inline actions */
--context-menu-width: 200px;      /* Right-click menus */
```

### 3.6 Dashboard-Specific Tokens

```css
@theme inline {
  --spacing-dashboard-header: 32px;
  --spacing-dashboard-widget-header: 28px;
  --spacing-dashboard-widget-padding: 12px;
  --spacing-dashboard-gap: 16px;
  --spacing-dashboard-row-height: 36px;
}
```

### 3.7 Utility Classes

**Location**: `src/index.css` (Lines 123-194)

```css
@layer utilities {
  /* Vertical Spacing Utilities */
  .space-y-section > * + * { margin-top: var(--spacing-section); }
  .space-y-widget > * + * { margin-top: var(--spacing-widget); }
  .space-y-content > * + * { margin-top: var(--spacing-content); }
  .space-y-compact > * + * { margin-top: var(--spacing-compact); }

  /* Gap Utilities */
  .gap-section { gap: var(--spacing-section); }
  .gap-widget { gap: var(--spacing-widget); }
  .gap-content { gap: var(--spacing-content); }
  .gap-compact { gap: var(--spacing-compact); }

  /* Padding Utilities */
  .p-widget { padding: var(--spacing-widget-padding); }
  .p-content { padding: var(--spacing-content); }
  .p-compact { padding: var(--spacing-compact); }
  .px-content { padding-left/right: var(--spacing-content); }
  .py-content { padding-top/bottom: var(--spacing-content); }
  .pl-content { padding-left: var(--spacing-content); }

  /* Margin Bottom Utilities */
  .mb-section { margin-bottom: var(--spacing-section); }
  .mb-widget { margin-bottom: var(--spacing-widget); }

  /* Screen Reader Only */
  .sr-only { /* WCAG-compliant visually hidden */ }
}
```

**Adoption**: Reports Module (2025-11-08), incremental rollout to other modules.

---

## 4. Elevation & Shadow System

### Location: `src/index.css` (Lines 476-555)

**Philosophy**: Warm-tinted dual-layer shadows prevent "soot" appearance on paper cream background.

### 4.1 Shadow Ink

```css
:root {
  --shadow-ink: oklch(30% 0.01 92);  /* Matches canvas hue */
}
```

**Benefits**: Harmonizes with cream background, reduced eye strain.

### 4.2 Three-Tier Elevation System

```css
/* Elevation 1: Static content cards */
--elevation-1: 
  0 1px 2px 0 var(--shadow-ink) / 0.1,
  0 4px 8px -2px var(--shadow-ink) / 0.16;

/* Elevation 2: Interactive widgets (hover) */
--elevation-2: 
  0 2px 3px 0 var(--shadow-ink) / 0.12,
  0 8px 16px -4px var(--shadow-ink) / 0.18;

/* Elevation 3: Modals, floating menus */
--elevation-3: 
  0 3px 6px -2px var(--shadow-ink) / 0.14,
  0 16px 24px -8px var(--shadow-ink) / 0.2;
```

**Pattern**: Dual-layer shadows with negative spread for tight, realistic depth.

### 4.3 Stroke System (Edge Definition)

```css
--stroke-card: oklch(93% 0.004 92);        /* 1px border */
--stroke-card-hover: oklch(91% 0.006 92);  /* Hover state */
```

**Usage**: Provides subtle edge definition without harsh lines.

### 4.4 Divider System

```css
--divider-subtle: oklch(96% 0.004 92);   /* Internal separators */
--divider-strong: oklch(94.5% 0.004 92); /* Section separators */
```

### 4.5 Text Hierarchy (Warm-Tinted)

```css
--text-title: oklch(22% 0.01 92);    /* Widget titles */
--text-metric: oklch(18% 0.01 92);   /* Metric numbers */
--text-body: oklch(29% 0.008 92);    /* Standard body */
--text-subtle: oklch(41% 0.006 92);  /* Timestamps */
```

**Why Warm-Tinted**: Creates cohesive color story with paper cream background.

### 4.6 Avatar Micro-Elevation

```css
--avatar-shadow: 
  0 0 0 1px oklch(93% 0.004 92), 
  0 1px 2px 0 var(--shadow-ink) / 0.1;
--avatar-highlight: 
  inset 0 1px 0 0 oklch(100% 0 0 / 0.3);
```

**Pattern**: Ring + shadow + highlight for depth on small elements.

### 4.7 Legacy Compatibility Tokens

```css
/* Map old tokens to elevation system */
--shadow-card-1: var(--elevation-1);
--shadow-card-2: var(--elevation-2);
--shadow-card-3: var(--elevation-3);
--shadow-card-1-hover: var(--elevation-2);
--shadow-card-2-hover: var(--elevation-3);
```

### 4.8 Column Shadows (Kanban)

```css
--shadow-col: 0 2px 6px var(--shadow-ink) / 0.12;
--shadow-col-inner: inset 0 1px 2px var(--shadow-ink) / 0.05;
```

### 4.9 Usage Guide (In-File Documentation)

**Location**: Lines 507-532

```css
/*
 * CARDS - Apply elevation + stroke for depth:
 *   .card {
 *     box-shadow: var(--elevation-1);
 *     border: 1px solid var(--stroke-card);
 *   }
 *   .card:hover { box-shadow: var(--elevation-2); }
 *
 * AVATARS - Use micro-elevation system:
 *   .avatar {
 *     box-shadow: var(--avatar-shadow), var(--avatar-highlight);
 *   }
 *
 * TEXT HIERARCHY - Use semantic text colors:
 *   .widget-title { color: var(--text-title); font-weight: 600; }
 *   .metric-value { color: var(--text-metric); font-weight: 700; }
 */
```

---

## 5. Animation & Transition Patterns

### 5.1 Animation Library

**Package**: `tw-animate-css` v1.3.8 (Line 2 of `src/index.css`)

```css
@import "tw-animate-css";
```

**Provides**: Animate.css utilities via Tailwind classes (e.g., `animate-fadeIn`, `animate-slideInUp`).

### 5.2 Motion-Safe Patterns

**Philosophy**: Respect OS motion preferences (`prefers-reduced-motion`).

```tsx
// Correct pattern (observed in ProductCard, OrganizationCard, card-elevation.stories)
className="transition-all duration-150 
  hover:shadow-md 
  motion-safe:hover:-translate-y-0.5 
  motion-safe:hover:scale-[1.01]"
```

**Benefits**:
- Animations disabled if user has `prefers-reduced-motion: reduce`
- Complies with WCAG 2.1 AA accessibility standards

### 5.3 Standard Transition Timing

```tsx
// Most common pattern
transition-all duration-150  // 150ms with ease-out (Tailwind default)

// Alternative timings
duration-200  // Used in ProductCard, OrganizationCard
```

### 5.4 Interactive Card Pattern

**Observed in**: `src/components/ui/card-elevation.stories.tsx`

```tsx
<div className="
  group relative 
  flex items-center justify-between gap-3 
  rounded-lg 
  border border-transparent bg-card 
  px-3 py-2 
  transition-all duration-150 
  hover:border-border 
  hover:shadow-md 
  motion-safe:hover:-translate-y-0.5 
  active:scale-[0.98] 
  focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2
">
  {/* Content */}
</div>
```

**Effects**:
- **Hover**: Border appears, shadow increases, -2px vertical lift
- **Active**: 98% scale (tactile press feedback)
- **Focus**: 2px ring with offset

### 5.5 Card Component Base

**Location**: `src/components/ui/card.tsx` (Line 10)

```tsx
className="
  bg-card text-card-foreground 
  flex flex-col gap-6 
  rounded-xl 
  border border-[color:var(--stroke-card)] 
  shadow-[var(--elevation-1)] 
  transition-shadow duration-150
"
```

**Features**:
- Uses `shadow-[var(--elevation-1)]` CSS variable syntax
- `transition-shadow` only (optimized for performance)
- 150ms duration

---

## 6. Component Patterns

### 6.1 Button System

**Location**: `src/components/ui/button.tsx` + `button.constants.ts`

#### Button Variants (CVA)

```typescript
// button.constants.ts
export const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center gap-2 
   whitespace-nowrap rounded-md text-sm font-medium 
   transition-all 
   disabled:pointer-events-none disabled:opacity-50 
   outline-none 
   focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-2 has-[>svg]:px-4",
        sm: "h-12 rounded-md gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 rounded-md px-8 has-[>svg]:px-6",
        icon: "size-12",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
```

**Key Features**:
- All buttons 48px tall (WCAG 2.5.5 compliant)
- 3px focus ring with `focus-visible:`
- `transition-all` for smooth hover states
- Invalid state styling (`aria-invalid:ring-destructive`)

**No Premium Variant**: Variants defined via CVA, no special `.button-premium` class.

### 6.2 Card Component

**Location**: `src/components/ui/card.tsx`

```tsx
function Card({ className, ...props }) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground 
         flex flex-col gap-6 
         rounded-xl 
         border border-[color:var(--stroke-card)] 
         shadow-[var(--elevation-1)] 
         transition-shadow duration-150",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold text-[color:var(--text-title)]", className)}
      {...props}
    />
  );
}
```

**Sub-components**: `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`

**Pattern**: Uses `data-slot` attributes for component identification.

### 6.3 No Utility Classes for Cards

**Finding**: No `.card-container` or `.interactive-card` classes in `index.css`.

**Current Approach**: Inline Tailwind classes with reusable patterns (see Section 5.4).

**Implication**: If extracting to utilities, must create new `@layer components` section.

---

## 7. Accessibility System

### Location: `src/lib/design-system/accessibility.ts`

### 7.1 Focus Ring Constant

```typescript
export const focusRing =
  'focus-visible:ring-ring focus-visible:ring-[3px] focus-visible:border-ring outline-none';
```

**Usage**:
```tsx
<button className={cn("...", focusRing)}>Click</button>
```

**Matches**: Button component standard (3px ring).

### 7.2 Screen Reader Only

```typescript
export const srOnly = 'sr-only';
```

**Defined in**: `src/index.css` Lines 183-193

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### 7.3 ARIA Announce Hook

```typescript
export const useAriaAnnounce = () => {
  // Creates ARIA live region for dynamic updates
  const announce = useCallback((message: string) => {
    // Announces to screen readers
  }, []);
  return announce;
};
```

**Example**:
```tsx
const announce = useAriaAnnounce();
const handleRefresh = () => {
  refresh();
  announce('Dashboard data refreshed');
};
```

### 7.4 Keyboard Navigation Hook

```typescript
export const useKeyboardNavigation = <T,>({
  items,
  onSelect,
  loop = true,
}: {
  items: T[];
  onSelect: (index: number) => void;
  loop?: boolean;
}) => {
  // Handles arrow keys, Home, End, Enter, Space
  return { currentIndex, handleKeyDown, setCurrentIndex };
};
```

**Example**:
```tsx
const { currentIndex, handleKeyDown } = useKeyboardNavigation({
  items: principals,
  onSelect: (index) => navigate(`/principals/${principals[index].id}`)
});
```

---

## 8. Touch Target Standards

### Location: `src/lib/design-system/spacing.ts`

```typescript
/** WCAG 2.5.5 minimum touch target size (44x44px) */
export const TOUCH_TARGET_MIN = 44;

/** Current button standard - comfortable size (48x48px) */
export const TOUCH_TARGET_STANDARD = 48;

/** Spacious size for primary CTAs (56x56px) */
export const TOUCH_TARGET_SPACIOUS = 56;

/**
 * Spacing scale for touch-friendly layouts (all values in px)
 */
export const spacing = {
  touchGap: 8,       // Minimum gap between touch targets
  cardPadding: 16,   // Standard card padding (Tailwind p-4)
  sectionGap: 24,    // Gap between sections (Tailwind gap-6)
  pageMargin: 32,    // Page margins (Tailwind px-8)
} as const;

/**
 * Validates touch target size in development mode
 */
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

**Philosophy**: Fail-fast validation in dev mode, no runtime wrappers.

---

## 9. Design System Exports

### Location: `src/lib/design-system/index.ts`

```typescript
export {
  TOUCH_TARGET_MIN,
  TOUCH_TARGET_STANDARD,
  TOUCH_TARGET_SPACIOUS,
  spacing,
  validateTouchTarget,
  isTouchTargetValid,
} from './spacing';

export {
  focusRing,
  srOnly,
  useAriaAnnounce,
  useKeyboardNavigation,
} from './accessibility';
```

**Usage**:
```tsx
import { focusRing, TOUCH_TARGET_STANDARD } from '@/lib/design-system';
```

---

## 10. Existing Interactive Patterns

### 10.1 Hover Patterns (Observed)

```tsx
// Text link hover
className="text-primary hover:underline"

// Button hover
className="bg-muted hover:bg-muted/80"

// Interactive surface hover
className="hover:bg-muted/50 transition-colors"

// Card elevation increase
className="shadow-sm hover:shadow-md transition-shadow duration-200"

// Border appearance on hover
className="border border-transparent hover:border-border"
```

### 10.2 Active/Pressed States

```tsx
// Scale feedback
className="active:scale-[0.98]"

// Visual pressed effect (rare, mostly uses scale)
```

### 10.3 Focus States

```tsx
// Ring with offset
className="focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"

// Ring only (no offset)
className="focus-visible:ring-ring focus-visible:ring-[3px]"
```

### 10.4 Group Hover Patterns

```tsx
// Parent enables child hover
<div className="group">
  <button className="opacity-0 group-hover:opacity-100 transition-opacity">
    Actions
  </button>
</div>
```

---

## 11. Dark Mode Support

### Location: `src/index.css` (Lines 557-776)

**Selector**: `.dark` class on `:root` or parent element.

### 11.1 Inverted Neutrals

```css
.dark {
  /* Neutrals inverted (900 → 50, etc.) */
  --neutral-50: oklch(23.4% 0.021 288);   /* Darkest */
  --neutral-900: oklch(97.1% 0.002 284.5); /* Lightest */
}
```

**Hue Shift**: Cool-tinted neutrals (hue 287°) for dark mode depth.

### 11.2 Adjusted Brand Colors

```css
.dark {
  --brand-500: oklch(55% 0.095 142);  /* Lightened for visibility */
  --brand-700: oklch(60% 0.1 142);    /* Primary lighter */
}
```

### 11.3 Shadow System (Dark Mode)

```css
.dark {
  --shadow-ink-dark: oklch(10% 0.015 287);  /* Cool-tinted */
  --shadow-card-1: 0 2px 4px var(--shadow-ink-dark) / 0.35;
  --shadow-card-2: 0 3px 6px var(--shadow-ink-dark) / 0.4;
  --shadow-card-3: 0 4px 8px var(--shadow-ink-dark) / 0.45;
}
```

**Higher Opacity**: Dark mode shadows need more opacity for visibility.

### 11.4 Tag Colors (Mirrored)

```css
.dark {
  /* Same light backgrounds as light mode for contrast */
  --tag-warm-bg: oklch(87% 0.07 80);
  --tag-warm-fg: oklch(20% 0.02 85);
}
```

**Strategy**: Light tags pop against dark background (inverted from light mode).

---

## 12. Missing Patterns (Opportunities)

### 12.1 No Card Container Utilities

**Current State**: Interactive cards use inline Tailwind classes.

**Observed Pattern** (from card-elevation.stories.tsx):
```tsx
className="
  group relative 
  flex items-center justify-between gap-3 
  rounded-lg border border-transparent bg-card px-3 py-2 
  transition-all duration-150 
  hover:border-border hover:shadow-md 
  motion-safe:hover:-translate-y-0.5 
  active:scale-[0.98] 
  focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2
"
```

**Opportunity**: Extract to `.interactive-card` utility class.

### 12.2 No Premium Button Class

**Current State**: Button variants managed via CVA (Class Variance Authority).

**Implication**: Premium styling would be added as new variant in `button.constants.ts`, not a standalone class.

### 12.3 No @layer components Section

**Current State**: Only `@layer utilities` exists (Lines 123-194).

**Implication**: If extracting card patterns, need to create:
```css
@layer components {
  .interactive-card { /* ... */ }
  .card-container { /* ... */ }
}
```

---

## 13. Performance Considerations

### 13.1 Transition Properties

**Best Practice** (observed in Card component):
```tsx
transition-shadow  // Only animates box-shadow
```

**Avoid**:
```tsx
transition-all     // Can cause layout thrashing
```

**Current Usage**: Mixed - Card uses `transition-shadow`, button uses `transition-all`.

### 13.2 Motion-Safe Enforcement

**Observed**: Consistent use of `motion-safe:` prefix for transforms:
```tsx
motion-safe:hover:-translate-y-0.5
motion-safe:hover:scale-[1.01]
```

**Performance**: Prevents unnecessary GPU compositing when motion disabled.

### 13.3 Shadow Optimization

**Warm-Tinted System**: Uses single `--shadow-ink` variable with alpha channel.

**Benefit**: Fewer CSS custom properties to resolve per shadow.

---

## 14. Documentation Quality

### 14.1 In-File Documentation

**Excellent**: `src/index.css` includes:
- Philosophy comments (Lines 237-276)
- Material layering principle explanation
- Usage guide for elevation system (Lines 507-532)
- Migration notes (Lines 272-276)

**Example**:
```css
/*
 * Paper Cream Color System + Warm-Tinted Shadow System (MFB Garden Theme)
 *
 * Background Philosophy:
 * - Main background: oklch(97.5% 0.010 92) - "paper cream"
 * - Cards (100%) = Pure white papers/objects on the surface
 * - Shadows = Natural light creating depth
 * ...
 */
```

### 14.2 TypeScript JSDoc

**Excellent**: `src/lib/design-system/accessibility.ts` includes:
```typescript
/**
 * Standard focus ring styles (consistent with button.tsx)
 * 3px ring with offset for visibility
 *
 * @example
 * <button className={cn("...", focusRing)}>Click</button>
 */
export const focusRing = '...';
```

---

## 15. Rollout Strategy Implications

### 15.1 Strengths to Preserve

1. **Semantic Token System**: Complete, well-documented
2. **Spacing Utilities**: Already extracted, working well
3. **Accessibility Hooks**: Excellent implementation
4. **Dark Mode**: Comprehensive, consistent
5. **Touch Targets**: WCAG-compliant standards

### 15.2 Gaps to Address

1. **No `.interactive-card` utility class**: Extract from inline patterns
2. **No `.card-container` wrapper**: Create if needed for consistency
3. **Mixed transition properties**: Standardize to `transition-shadow` for cards
4. **No `@layer components`**: Add for extracted utilities

### 15.3 Recommended Additions

```css
@layer components {
  /* Interactive card pattern (from card-elevation.stories.tsx) */
  .interactive-card {
    @apply group relative;
    @apply flex items-center justify-between gap-3;
    @apply rounded-lg border border-transparent bg-card px-3 py-2;
    @apply transition-shadow duration-150;
    @apply hover:border-border hover:shadow-md;
    @apply motion-safe:hover:-translate-y-0.5;
    @apply active:scale-[0.98];
    @apply focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2;
  }

  /* Premium card elevation (medium) */
  .interactive-card-premium {
    @apply interactive-card;
    @apply shadow-[var(--elevation-2)];
    @apply hover:shadow-[var(--elevation-3)];
    @apply motion-safe:hover:scale-[1.01];
  }
}
```

---

## 16. Semantic Color Usage Examples

### 16.1 Text Hierarchy

```tsx
// Widget titles
<h3 className="font-semibold text-[color:var(--text-title)]">
  Active Opportunities
</h3>

// Metric values
<span className="text-2xl font-bold text-[color:var(--text-metric)]">
  $45,200
</span>

// Body text
<p className="text-[color:var(--text-body)]">
  Standard paragraph text
</p>

// Subtle metadata
<span className="text-xs text-[color:var(--text-subtle)]">
  Last updated 2 hours ago
</span>
```

### 16.2 Borders & Strokes

```tsx
// Card border
<div className="border border-[color:var(--stroke-card)]">

// Divider (internal)
<hr className="border-[color:var(--divider-subtle)]">

// Section separator
<hr className="border-[color:var(--divider-strong)]">
```

### 16.3 Interactive Surfaces

```tsx
// Hover tint
<button className="hover:bg-[color:var(--surface-interactive-hover)]">

// Selected state
<div className="bg-[color:var(--sidebar-active-bg)] text-[color:var(--sidebar-active-text)]">
```

---

## 17. Implementation Status

### 17.1 Completed (Production)

- ✅ Color system (150+ tokens)
- ✅ Spacing system with utilities
- ✅ Elevation system (3 tiers)
- ✅ Touch target standards
- ✅ Accessibility hooks
- ✅ Dark mode support
- ✅ Button variants (CVA)
- ✅ Card component
- ✅ Tag utilities

### 17.2 In Progress

- 🟡 Spacing utilities adoption (Reports Module complete, others pending)
- 🟡 Interactive card pattern extraction (stories exist, no utility class)

### 17.3 Not Started

- ❌ `.interactive-card` utility class
- ❌ `.card-container` wrapper class
- ❌ `@layer components` section
- ❌ Premium card variants

---

## 18. Key Takeaways

1. **No Tailwind Config File**: Tailwind v4 uses CSS-based configuration in `src/index.css`
2. **Semantic Token System**: Mature, OKLCH-based with complete light/dark mode support
3. **Warm-Tinted Design**: Paper cream background with matching shadow/text system
4. **Desktop-Optimized**: Spacing reduced by ~25% from iPad-first for data density
5. **Motion-Safe Enforcement**: Accessibility-first animation patterns
6. **No Card Utilities**: Interactive patterns exist in stories but not extracted to classes
7. **CVA for Variants**: Button uses Class Variance Authority, not standalone classes
8. **Excellent Documentation**: In-file comments, TypeScript JSDoc, usage guides
9. **Fail-Fast Philosophy**: Validation in dev mode, no over-engineering
10. **Extraction Opportunity**: Interactive card pattern is well-defined and ready for extraction

---

## 19. References

### Source Files Analyzed

- `src/index.css` (878 lines) - Color system, spacing, elevation, utilities
- `vite.config.ts` - Tailwind v4 plugin configuration
- `src/components/ui/button.tsx` + `button.constants.ts` - Button variants
- `src/components/ui/card.tsx` - Card component structure
- `src/components/ui/card-elevation.stories.tsx` - Interactive patterns
- `src/lib/design-system/accessibility.ts` - Accessibility hooks
- `src/lib/design-system/spacing.ts` - Touch target standards
- `src/lib/design-system/index.ts` - Public exports

### Related Documentation

- `docs/plans/2025-11-08-spacing-layout-system-design.md` - Spacing system design
- `docs/design-system/elevation.md` - Elevation system guide
- `docs/design-system/phase2-extraction-guide.md` - Extraction strategy
- CLAUDE.md - Engineering Constitution references

### Package Dependencies

- `@tailwindcss/vite` ^4.1.11
- `tw-animate-css` ^1.3.8
- `class-variance-authority` (CVA for button variants)

---

**Research Completed**: 2025-11-16
**Next Steps**: Use this foundation for unified design system rollout planning
