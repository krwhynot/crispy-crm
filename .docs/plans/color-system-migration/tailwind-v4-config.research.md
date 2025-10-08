# Tailwind CSS v4 Configuration Research

**Date:** 2025-10-07
**Purpose:** Comprehensive analysis of Tailwind CSS v4 configuration in Atomic CRM
**Status:** Complete

## Executive Summary

Atomic CRM uses **Tailwind CSS v4.1.11** with a **CSS-first configuration** approach - no traditional `tailwind.config.js` file exists. All configuration is embedded directly in `/src/index.css` using the new `@theme inline` syntax. The system integrates seamlessly with Vite via the official `@tailwindcss/vite` plugin and automatically consumes CSS custom properties prefixed with `--color-*` to generate Tailwind utility classes.

### Key Findings

- **No config file**: Zero-config approach using CSS-first syntax
- **Inline theme definition**: All configuration in `@theme inline` block in `src/index.css`
- **Automatic variable consumption**: Tailwind v4 reads `--color-*` CSS variables directly
- **Custom dark mode variant**: Uses `@custom-variant dark (&:is(.dark *))` for class-based dark mode
- **No plugins**: Clean vanilla Tailwind setup without third-party plugins
- **OKLCH color space**: All colors defined using perceptually uniform `oklch()` notation
- **Direct mapping**: `--primary` → `bg-primary`, `text-primary`, `border-primary` utilities

---

## 1. Configuration Architecture

### No Traditional Config File

**Finding**: There is **NO** `tailwind.config.js`, `tailwind.config.ts`, or `postcss.config.js` file in the project.

**Verification**:
```bash
$ find . -name "tailwind.config.*" -o -name "postcss.config.*"
# Returns: No results
```

**Why**: Tailwind v4 introduces a CSS-first configuration approach where all settings are embedded directly in CSS files.

### CSS-First Configuration Location

**Primary Configuration File**: `/src/index.css`

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* All Tailwind configuration lives here */
}
```

**Key Components**:
1. **Line 1**: Imports Tailwind CSS base via `@import "tailwindcss"`
2. **Line 2**: Imports animation library `tw-animate-css` for additional utilities
3. **Line 4**: Custom dark mode variant definition
4. **Lines 6-49**: Theme configuration using `@theme inline` block

---

## 2. CSS Import System

### Entry Point

**File**: `/src/index.css`

```css
@import "tailwindcss";
@import "tw-animate-css";
```

**How it Works**:
- `@import "tailwindcss"` loads the Tailwind CSS framework
- Resolved by Vite plugin `@tailwindcss/vite@4.1.13`
- No need for `@tailwind base`, `@tailwind components`, `@tailwind utilities` directives
- v4 handles layer management automatically

### Additional Libraries

**tw-animate-css** (`tw-animate-css@1.3.8`):
- Provides pre-built animation utilities
- Enhances Tailwind with animation classes
- Imported after main Tailwind import to extend utilities

**Usage Example**:
```tsx
// Component can use both Tailwind and tw-animate-css utilities
<div className="bg-primary animate-pulse">...</div>
```

---

## 3. Theme Inline Configuration

### Structure

**Location**: `/src/index.css`, lines 6-49

```css
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  /* Chart colors */
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --color-chart-4: var(--chart-4);
  --color-chart-5: var(--chart-5);

  /* Sidebar colors */
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-ring: var(--sidebar-ring);

  /* Loading state colors */
  --color-loading-surface: var(--loading-surface);
  --color-loading-surface-secondary: var(--loading-surface-secondary);
  --color-loading-shimmer: var(--loading-shimmer);
  --color-loading-skeleton: var(--loading-skeleton);
  --color-loading-pulse: var(--loading-pulse);
  --color-loading-spinner: var(--loading-spinner);
  --color-loading-overlay: var(--loading-overlay);
}
```

### How Tailwind Consumes Variables

**Automatic Consumption**: Tailwind v4 automatically reads CSS custom properties prefixed with `--color-*` and generates corresponding utilities.

**Mapping Pattern**:
```css
--color-primary        → bg-primary, text-primary, border-primary
--color-primary-foreground → bg-primary-foreground, text-primary-foreground
--color-muted          → bg-muted, text-muted, border-muted
--color-muted-foreground → bg-muted-foreground, text-muted-foreground
```

**Example**:
```tsx
// CSS Variable Definition
@theme inline {
  --color-primary: var(--primary);
}

// Auto-generated Tailwind Utilities
bg-primary         → background-color: var(--color-primary);
text-primary       → color: var(--color-primary);
border-primary     → border-color: var(--color-primary);
ring-primary       → --tw-ring-color: var(--color-primary);
```

**Important**: The `--color-*` prefix is **required** for Tailwind v4 to recognize the variable as a color token. Variables without this prefix (e.g., `--primary`) are NOT automatically converted to utilities.

### Radius Configuration

**Radius System**:
```css
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

**Base Value** (defined in `:root`):
```css
:root {
  --radius: 0.625rem; /* 10px */
}
```

**Generated Utilities**:
- `rounded-sm` → `border-radius: var(--radius-sm)` (6px)
- `rounded-md` → `border-radius: var(--radius-md)` (8px)
- `rounded-lg` → `border-radius: var(--radius-lg)` (10px)
- `rounded-xl` → `border-radius: var(--radius-xl)` (14px)

---

## 4. Custom Variants

### Dark Mode Variant

**Configuration**: `/src/index.css`, line 4

```css
@custom-variant dark (&:is(.dark *));
```

**How it Works**:
- Defines a custom variant named `dark`
- Applies when element is a descendant of `.dark` class
- Uses modern CSS `:is()` selector for specificity management

**Selector Translation**:
```css
/* Input: */
dark:bg-background

/* Output: */
&:is(.dark *) {
  background-color: var(--color-background);
}

/* Actual selector in compiled CSS: */
.dark .element {
  background-color: var(--color-background);
}
```

**Usage Examples**:
```tsx
// Component code
<div className="bg-card dark:bg-card">
  <p className="text-foreground dark:text-foreground">
    This text adapts to light/dark mode
  </p>
</div>
```

**Dark Mode Strategy**:
- **Class-based strategy**: Applies `.dark` class to document root (not media query)
- **Theme Provider**: `ThemeProvider` component toggles `.dark` class on `<html>` element
- **Manual control**: Users can switch themes via UI toggle
- **System preference**: Can auto-detect `prefers-color-scheme` and apply class automatically

**Why This Approach**:
- More control than media query strategy
- Allows user preference override
- Enables theme preview without affecting system
- Better integration with React state management

---

## 5. Color Mapping System

### CSS Variable Hierarchy

**Two-Layer System**:

**Layer 1: Semantic Variables** (`:root` and `.dark` blocks)
```css
:root {
  --primary: oklch(0.205 0 0);              /* Dark gray */
  --primary-foreground: oklch(0.985 0 0);   /* Near white */
}

.dark {
  --primary: oklch(0.922 0 0);              /* Light gray */
  --primary-foreground: oklch(0.205 0 0);   /* Dark gray */
}
```

**Layer 2: Tailwind Mapping** (`@theme inline` block)
```css
@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
}
```

### Mapping Flow

```
1. Define semantic color in :root
   --primary: oklch(0.205 0 0);

2. Map to Tailwind token in @theme inline
   --color-primary: var(--primary);

3. Tailwind auto-generates utilities
   .bg-primary { background-color: var(--color-primary); }

4. Final CSS cascade
   .bg-primary → var(--color-primary) → var(--primary) → oklch(0.205 0 0)
```

### How `bg-primary` Maps to `--primary`

**Direct Chain**:
```
Component: className="bg-primary"
           ↓
Tailwind:  .bg-primary { background-color: var(--color-primary); }
           ↓
Theme:     --color-primary: var(--primary);
           ↓
CSS Var:   --primary: oklch(0.205 0 0);
           ↓
Browser:   background-color: oklch(0.205 0 0);
```

**Dark Mode Chain**:
```
Component: className="dark:bg-primary"
           ↓
Compiled:  .dark .element { background-color: var(--color-primary); }
           ↓
Theme:     --color-primary: var(--primary);
           ↓
Dark CSS:  .dark { --primary: oklch(0.922 0 0); }
           ↓
Browser:   background-color: oklch(0.922 0 0);
```

**Key Insight**: The mapping is **bidirectional** - changing `--primary` in `:root` automatically updates all `bg-primary`, `text-primary`, `border-primary` utilities.

### Complete Color Token List

**Primary Colors**:
- `bg-primary` / `text-primary` / `border-primary`
- `bg-primary-foreground` / `text-primary-foreground`

**Secondary Colors**:
- `bg-secondary` / `text-secondary` / `border-secondary`
- `bg-secondary-foreground` / `text-secondary-foreground`

**Muted Colors**:
- `bg-muted` / `text-muted` / `border-muted`
- `bg-muted-foreground` / `text-muted-foreground`

**Accent Colors**:
- `bg-accent` / `text-accent` / `border-accent`
- `bg-accent-foreground` / `text-accent-foreground`

**Destructive/Error Colors**:
- `bg-destructive` / `text-destructive` / `border-destructive`

**Surface Colors**:
- `bg-background` / `text-foreground`
- `bg-card` / `text-card-foreground`
- `bg-popover` / `text-popover-foreground`

**Border & Ring Colors**:
- `border-border` (default border)
- `border-input` (input borders)
- `ring-ring` (focus rings)

**Sidebar Colors**:
- `bg-sidebar` / `text-sidebar-foreground`
- `bg-sidebar-primary` / `text-sidebar-primary-foreground`
- `bg-sidebar-accent` / `text-sidebar-accent-foreground`
- `border-sidebar-border`
- `ring-sidebar-ring`

**Loading State Colors**:
- `bg-loading-surface` / `bg-loading-surface-secondary`
- `bg-loading-shimmer` / `bg-loading-skeleton`
- `bg-loading-pulse` / `bg-loading-spinner`
- `bg-loading-overlay`

**Chart Colors**:
- `bg-chart-1` through `bg-chart-5`
- `text-chart-1` through `text-chart-5`

---

## 6. Does Tailwind Automatically Consume CSS Variables?

### Answer: YES, with Conditions

**Automatic Consumption Requirements**:
1. **Prefix**: Variable MUST be prefixed with `--color-*` in `@theme inline` block
2. **Location**: MUST be defined inside `@theme inline` block
3. **Format**: Any valid CSS color value (hex, rgb, oklch, hsl, etc.)

**Example of Automatic Consumption**:
```css
@theme inline {
  --color-brand-green: oklch(0.55 0.15 145);
}
```
**Result**: Tailwind auto-generates `bg-brand-green`, `text-brand-green`, `border-brand-green`

**Counter-Example (NOT Consumed)**:
```css
:root {
  --success-default: oklch(0.63 0.14 145);
}
```
**Result**: This variable is NOT consumed by Tailwind (no `bg-success-default` utility) because:
1. Not in `@theme inline` block
2. Not prefixed with `--color-*`

**To Make it Consumable**:
```css
@theme inline {
  --color-success-default: var(--success-default);
}
```
**Result**: NOW Tailwind generates `bg-success-default`, `text-success-default`, etc.

### Current State Analysis

**Currently Consumed** (60+ variables):
- All variables in `@theme inline` block with `--color-*` prefix
- Examples: `--color-primary`, `--color-background`, `--color-sidebar`, `--color-chart-1`

**NOT Consumed** (20+ variables):
- Variables in `:root` without `--color-*` prefix
- Examples: `--primary`, `--success-default`, `--warning-subtle`, `--tag-warm-bg`
- These require manual mapping in `@theme inline` to be consumed

**Partial Consumption**:
- Tag colors (`--tag-warm-bg`, etc.) are NOT mapped in `@theme inline`
- They exist only as CSS custom properties, accessed via `var(--tag-warm-bg)`
- No auto-generated `bg-tag-warm-bg` utility exists
- Components use class names like `.tag-warm` with direct `background-color: var(--tag-warm-bg)`

---

## 7. Tailwind Plugins

### Currently Installed Plugins

**Finding**: ZERO third-party Tailwind plugins installed.

**Verification**:
```json
// package.json dependencies
{
  "tailwindcss": "^4.1.11",
  "@tailwindcss/vite": "^4.1.11",
  // No @tailwindcss/forms, @tailwindcss/typography, etc.
}
```

**Why No Plugins**:
- Tailwind v4 provides comprehensive utility coverage out of the box
- Shadcn/ui components handle forms, typography, and UI patterns
- Project uses custom CSS for specialized needs (e.g., tag colors)
- Vite plugin provides all necessary build integrations

### Plugin Ecosystem Available (Not Used)

**Official Plugins** (could be added if needed):
- `@tailwindcss/forms`: Enhanced form styling (not needed - shadcn handles forms)
- `@tailwindcss/typography`: Prose styling (not needed - custom typography)
- `@tailwindcss/aspect-ratio`: Aspect ratio utilities (native CSS supports this now)
- `@tailwindcss/container-queries`: Container query utilities (v4 may include natively)

**Community Plugins**: Not applicable in v4 CSS-first configuration (plugins require JS config)

---

## 8. Dark Mode Configuration

### Strategy: Class-Based

**Configuration**: Via `@custom-variant` directive (not config file)

```css
@custom-variant dark (&:is(.dark *));
```

**How It Works**:
1. Theme provider adds/removes `.dark` class on `<html>` element
2. Dark variant utilities apply when element is descendant of `.dark`
3. CSS cascade updates all `--color-*` variables based on `.dark` selector

**Implementation in React**:

**Theme Provider** (`/src/components/admin/theme-provider.tsx`):
- Manages theme state (light, dark, system)
- Applies `.dark` class to document root
- Persists preference in React Admin store
- Listens to system preference changes

**CSS Variable Updates**:
```css
:root {
  --primary: oklch(0.205 0 0);  /* Light mode: dark gray */
}

.dark {
  --primary: oklch(0.922 0 0);  /* Dark mode: light gray */
}
```

**Theme Inline Mapping** (unchanged):
```css
@theme inline {
  --color-primary: var(--primary);
}
```

**Result**: When `.dark` class is present, `--primary` resolves to light gray, cascading through `--color-primary` to all `bg-primary` utilities.

### Alternative Strategy (Not Used): Media Query

**Could use** (but doesn't):
```css
@custom-variant dark (@media (prefers-color-scheme: dark));
```

**Why Class Strategy is Better**:
- User can override system preference
- No flash of wrong theme on page load (controlled via JS)
- Theme can be toggled without OS change
- Better integration with React state
- Supports theme preview features

---

## 9. Relationship Between Variables

### Naming Pattern

**Semantic CSS Variables** (defined in `:root` / `.dark`):
```
--{semantic-name}: {oklch-value};
--{semantic-name}-foreground: {oklch-value};
```

**Tailwind Color Tokens** (defined in `@theme inline`):
```
--color-{semantic-name}: var(--{semantic-name});
--color-{semantic-name}-foreground: var(--{semantic-name}-foreground);
```

**Example**:
```css
/* Semantic layer */
--primary: oklch(0.205 0 0);
--primary-foreground: oklch(0.985 0 0);

/* Tailwind layer */
--color-primary: var(--primary);
--color-primary-foreground: var(--primary-foreground);

/* Generated utilities */
.bg-primary { background-color: var(--color-primary); }
.text-primary-foreground { color: var(--color-primary-foreground); }
```

### Why Two Layers?

**Separation of Concerns**:
1. **Semantic Layer** (`:root` / `.dark`): Define color values and theme logic
2. **Utility Layer** (`@theme inline`): Map colors to Tailwind's utility generation

**Benefits**:
- Change color values without touching Tailwind configuration
- Reuse semantic variables outside Tailwind (e.g., custom CSS classes)
- Theme switching only updates semantic layer
- Tailwind utilities remain stable

**Example Use Case**:
```css
/* Custom CSS class using semantic variable directly */
.tag-warm {
  background-color: var(--tag-warm-bg);  /* NOT mapped to Tailwind */
  color: var(--tag-warm-fg);
}

/* Tailwind utility using mapped variable */
.bg-primary {
  background-color: var(--color-primary);  /* Mapped from --primary */
}
```

---

## 10. Vite Integration

### Plugin Configuration

**File**: `/vite.config.ts`

```typescript
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),  // No options needed
    // ... other plugins
  ],
});
```

**Key Points**:
- No configuration object passed to `tailwindcss()` plugin
- Plugin auto-detects CSS imports and processes them
- Handles HMR (Hot Module Replacement) for CSS changes
- Optimizes CSS output for production builds

### Build Process Flow

```
1. Vite dev server starts
   ↓
2. @tailwindcss/vite plugin initializes
   ↓
3. Scans src/index.css for @import "tailwindcss"
   ↓
4. Processes @theme inline block
   ↓
5. Generates utility classes based on --color-* variables
   ↓
6. Scans .tsx files for class names
   ↓
7. Purges unused utilities
   ↓
8. Outputs optimized CSS bundle
```

### Development Mode

**HMR Support**:
- CSS changes trigger instant recompilation
- No full page reload needed
- Theme variable updates reflect immediately

**Force Flag** (in dev script):
```json
"dev": "vite --force"
```
**Why**: Forces cache invalidation - ensures Tailwind v4 picks up theme changes

### Production Build

**Optimization Steps**:
1. Tree-shakes unused utilities
2. Minifies CSS output
3. Generates source maps (if enabled)
4. Chunks CSS per route (Vite's default splitting)

**Bundle Size** (typical):
- Base Tailwind utilities: ~10-15 KB (gzipped)
- Custom theme additions: ~2-3 KB
- Total CSS: ~15-20 KB for typical page

---

## 11. Gotchas & Edge Cases

### 1. No Config File Migration Confusion

**Problem**: Developers familiar with Tailwind v3 expect `tailwind.config.js`

**Reality**: Tailwind v4 uses CSS-first approach

**Solution**: All configuration lives in `src/index.css` via `@theme inline` block

**Migration Trap**: Trying to create `tailwind.config.js` won't work with v4 + Vite plugin

### 2. Variable Naming Must Include `--color-*` Prefix

**Problem**: Defining colors without `--color-*` prefix in `@theme inline`

**Example** (WRONG):
```css
@theme inline {
  --brand-green: oklch(0.55 0.15 145);
}
```
**Result**: No `bg-brand-green` utility generated

**Example** (CORRECT):
```css
@theme inline {
  --color-brand-green: oklch(0.55 0.15 145);
}
```
**Result**: `bg-brand-green`, `text-brand-green`, etc. auto-generated

### 3. Tag Colors Are NOT Tailwind Utilities

**Current Implementation**:
```css
/* NOT in @theme inline, so NOT consumed by Tailwind */
:root {
  --tag-warm-bg: oklch(92.1% 0.041 69.5);
  --tag-warm-fg: oklch(20% 0.02 69.5);
}

/* Custom CSS classes access variables directly */
.tag-warm {
  background-color: var(--tag-warm-bg);
  color: var(--tag-warm-fg);
}
```

**Why**: Tag colors are component-specific, not design system primitives

**Implication**: Cannot use `bg-tag-warm-bg` in component `className` props

**To Make Consumable** (if desired):
```css
@theme inline {
  --color-tag-warm-bg: var(--tag-warm-bg);
  --color-tag-warm-fg: var(--tag-warm-fg);
}
```

### 4. Dark Mode Cascade Order Matters

**Problem**: CSS specificity can break dark mode if not careful

**Example** (BUG):
```css
.dark {
  --primary: oklch(0.922 0 0);
}

.custom-class {
  --primary: oklch(0.5 0 0);  /* Overrides dark mode! */
}
```

**Solution**: Always scope custom overrides with dark variant:
```css
.custom-class {
  --primary: oklch(0.5 0 0);
}

.dark .custom-class {
  --primary: oklch(0.7 0 0);
}
```

### 5. OKLCH Browser Support

**Issue**: OKLCH is modern CSS, older browsers may not support it

**Current State**: No fallbacks provided in codebase

**Risk**: Colors may not render in Safari < 15.4, Firefox < 113, Chrome < 111

**Mitigation Options**:
1. Accept modern browser requirement (likely acceptable for 2025)
2. Add hex fallbacks using `@supports` queries
3. Use PostCSS plugin to auto-generate fallbacks

**Example Fallback** (if needed):
```css
:root {
  --primary: #2D2D2D;  /* Fallback */
  --primary: oklch(0.205 0 0);  /* Modern browsers override */
}
```

### 6. Cannot Use Arbitrary Values with Semantic Names

**Problem**: Arbitrary value syntax doesn't work with semantic variables

**Example** (WRONG):
```tsx
<div className="bg-[--primary]">...</div>
```
**Result**: Does not resolve to `var(--primary)`

**Example** (CORRECT):
```tsx
<div className="bg-primary">...</div>
```
**Result**: Resolves to `var(--color-primary)` → `var(--primary)`

**Arbitrary Values Work With**:
- Direct hex: `bg-[#2D2D2D]`
- Direct oklch: `bg-[oklch(0.205_0_0)]` (note underscores instead of spaces)
- CSS variables with explicit var(): `bg-[var(--custom-color)]`

### 7. Modifiers (Opacity) Require Slash Syntax in OKLCH

**Problem**: Opacity modifiers in Tailwind work differently with OKLCH

**Example** (Tailwind utility):
```tsx
<div className="bg-primary/90">...</div>
```

**Generated CSS**:
```css
.bg-primary\/90 {
  background-color: rgb(from var(--color-primary) r g b / 0.9);
}
```

**Issue**: `rgb(from ...)` syntax requires OKLCH → RGB conversion

**Alternative**: Use OKLCH alpha channel directly in variable:
```css
--color-primary-90: oklch(0.205 0 0 / 0.9);
```

### 8. Custom Variants Require `@custom-variant` Directive

**Cannot Define in Config** (no config file exists!)

**Must Define in CSS**:
```css
@custom-variant dark (&:is(.dark *));
@custom-variant rtl ([dir="rtl"] &);
```

**Current Project Only Defines**: `dark` variant

**To Add More** (if needed):
```css
@custom-variant hover (@media (hover: hover));
@custom-variant reduced-motion (@media (prefers-reduced-motion: reduce));
```

---

## 12. Component Usage Patterns

### Standard Component Pattern

```tsx
import { cn } from "@/lib/utils";

function Button({ variant = "default", className, ...props }) {
  return (
    <button
      className={cn(
        // Base styles
        "inline-flex items-center justify-center rounded-md",
        // Variant styles using Tailwind utilities
        variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/90",
        variant === "destructive" && "bg-destructive text-white hover:bg-destructive/90",
        // Dark mode variants
        "dark:bg-input/30",
        // Custom overrides
        className
      )}
      {...props}
    />
  );
}
```

**Key Points**:
- Uses `cn()` utility (clsx + tailwind-merge) for class composition
- Semantic color utilities (`bg-primary`, `text-destructive`)
- Dark mode variants (`dark:bg-input/30`)
- Opacity modifiers (`bg-primary/90`)
- User can override with `className` prop

### Direct CSS Variable Access (Tag Pattern)

```tsx
function Tag({ color }: { color: "warm" | "green" | "blue" }) {
  return (
    <span className={`tag-${color}`}>
      Tag Content
    </span>
  );
}
```

```css
/* Corresponding CSS */
.tag-warm {
  background-color: var(--tag-warm-bg);
  color: var(--tag-warm-fg);
}
```

**When to Use**:
- Component-specific colors not in design system
- Colors that shouldn't be exposed as general utilities
- Legacy patterns (should migrate to `@theme inline` if becoming system-wide)

---

## 13. Migration Path to Brand Colors

### Current Color Variables

**Primary Colors** (grayscale):
```css
:root {
  --primary: oklch(0.205 0 0);              /* Dark gray */
  --primary-foreground: oklch(0.985 0 0);   /* Near white */
}

.dark {
  --primary: oklch(0.922 0 0);              /* Light gray */
  --primary-foreground: oklch(0.205 0 0);   /* Dark gray */
}
```

**Mapped to Tailwind**:
```css
@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
}
```

### Option A: Direct Replacement (Risky)

**Approach**: Change `--primary` value to brand green

```css
:root {
  --primary: oklch(0.55 0.15 145);  /* Brand green */
}
```

**Impact**: ALL `bg-primary`, `text-primary`, `border-primary` utilities instantly become green

**Risk**: Unintended green elements across app

### Option B: Add New Brand Variable (Recommended)

**Approach**: Introduce `--brand-primary` alongside existing `--primary`

**Step 1**: Define new semantic variable
```css
:root {
  --brand-primary: oklch(0.55 0.15 145);
  --brand-primary-foreground: oklch(1 0 0);
}

.dark {
  --brand-primary: oklch(0.50 0.13 145);
  --brand-primary-foreground: oklch(1 0 0);
}
```

**Step 2**: Map to Tailwind
```css
@theme inline {
  --color-brand-primary: var(--brand-primary);
  --color-brand-primary-foreground: var(--brand-primary-foreground);
}
```

**Step 3**: Use in components
```tsx
// Update specific CTAs to use brand color
<Button className="bg-brand-primary text-brand-primary-foreground">
  Sign Up
</Button>

// Keep existing buttons neutral
<Button className="bg-primary text-primary-foreground">
  Cancel
</Button>
```

**Benefits**:
- Gradual migration
- Explicit control over brand color usage
- Existing `bg-primary` remains neutral
- Clear semantic distinction

---

## 14. Summary & Recommendations

### Current Configuration

✅ **CSS-First Architecture**
- Zero config files (no `tailwind.config.js`)
- All configuration in `@theme inline` block
- Automatic CSS variable consumption via `--color-*` prefix

✅ **Clean Plugin Setup**
- No third-party plugins
- Vanilla Tailwind + Vite integration
- tw-animate-css for animations

✅ **Robust Dark Mode**
- Class-based strategy via `@custom-variant`
- React theme provider manages state
- Seamless variable cascade

✅ **OKLCH Color Space**
- Perceptually uniform colors
- Superior dark mode support
- Modern CSS approach

### Gaps & Gotchas

⚠️ **No OKLCH Fallbacks**
- Older browsers may not render colors
- Consider adding hex fallbacks for production

⚠️ **Tag Colors Not Consumed by Tailwind**
- Custom CSS classes access variables directly
- Cannot use `bg-tag-warm-bg` utilities
- Consider mapping to Tailwind if needed system-wide

⚠️ **Success/Warning/Info Colors Not Mapped**
- Variables exist in `:root` but not in `@theme inline`
- No `bg-success-default` utilities auto-generated
- Requires manual mapping to expose as utilities

### Recommendations for Brand Color Migration

1. **DO NOT** replace `--primary` directly (too risky)
2. **DO** introduce `--brand-primary` as new variable
3. **DO** map to Tailwind via `--color-brand-primary` in `@theme inline`
4. **DO** audit and refactor high-priority CTAs to use brand color
5. **DO** maintain `--primary` as neutral default for secondary actions
6. **DO** run WCAG contrast checks on brand green values
7. **DO** test dark mode thoroughly with new brand color

### Verification Commands

**Check if variable is consumed by Tailwind**:
```bash
# Search for utility in component files
grep -r "bg-brand-primary" src/
# If no results, utility doesn't exist → not mapped in @theme inline
```

**Verify Tailwind version**:
```bash
npm list tailwindcss @tailwindcss/vite
# Should show 4.1.11+ for both
```

**Inspect generated utilities** (dev mode):
```bash
# Start dev server
npm run dev
# Open browser DevTools → Elements → Computed styles
# Check if utility resolves to expected CSS variable
```

---

## Relevant Files

- `/src/index.css` - Primary Tailwind configuration with `@theme inline` block
- `/vite.config.ts` - Vite plugin integration for Tailwind
- `/package.json` - Tailwind v4 dependencies
- `/src/components/ui/button.tsx` - Example component using color utilities
- `/src/components/ui/input.tsx` - Input component with focus ring and selection colors
- `/src/components/admin/theme-provider.tsx` - Dark mode theme provider
- `/src/lib/utils.ts` - `cn()` utility for class merging

## Relevant Docs

- [Tailwind CSS v4 Beta Documentation](https://tailwindcss.com/docs/v4-beta) - CSS-first configuration guide
- [Tailwind CSS v4 Migration Guide](https://tailwindcss.com/docs/upgrade-guide) - Migrating from v3 to v4
- [@tailwindcss/vite Plugin](https://github.com/tailwindlabs/tailwindcss/tree/next/packages/%40tailwindcss-vite) - Official Vite integration
- [CSS @theme Directive](https://tailwindcss.com/docs/theme) - Theme inline syntax documentation
- [Custom Variants in v4](https://tailwindcss.com/docs/adding-custom-styles#using-custom-variants) - Defining custom variants in CSS
- [OKLCH Color Picker](https://oklch.com/) - Tool for converting and testing OKLCH colors
- [CSS Custom Properties (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) - CSS variable reference
