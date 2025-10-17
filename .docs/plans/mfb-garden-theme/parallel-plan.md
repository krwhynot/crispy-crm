# MFB Garden Theme - Parallel Implementation Plan

A systematically decomposed plan for migrating Atomic CRM from the brand-green OKLCH color system to the MFB "Garden to Table" warm earth-tone theme. This plan is optimized for parallel execution by multiple agents working independently on non-blocking tasks.

## Executive Summary

**Scope**: Replace 180+ OKLCH color definitions with warm earth tones, add Nunito typography, update 141+ components, implement earth-tone charts, expand tag system, and generate algorithmic dark mode.

**Timeline**: 26-38 hours across 8 phases (5-7 days with parallel execution)

**Critical Path**: Phase 1 (Core Colors) → Phase 6 (Dark Mode) → Phase 7 (Testing)

**Parallelizable Phases**: Phases 2, 3, 4, 5 can run concurrently after Phase 1 completes

## Critically Relevant Files and Documentation

### Core Implementation Files
- `/home/krwhynot/projects/crispy-crm/src/index.css` - Single source of truth for all 180+ color definitions (lines 44-350)
- `/home/krwhynot/projects/crispy-crm/index.html` - Font loading location (add Google Fonts in `<head>`)
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/OpportunitiesChart.tsx` - Chart color implementation requiring refactor
- `/home/krwhynot/projects/crispy-crm/scripts/validate-colors.js` - WCAG contrast validation (currently validates 16/34 tests)

### Documentation to Read First
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/shared.md` - Architecture overview, critical gaps, relevant patterns
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/requirements.md` - Complete specifications, success metrics, technical requirements
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/migration-checklist.md` - Phase-by-phase implementation details with line numbers
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/color-system-architecture.research.md` - Three-tier hierarchy, OKLCH patterns, validation guide

### Component Reference Files
- `/home/krwhynot/projects/crispy-crm/src/components/ui/button.tsx` - Reference for semantic token usage patterns
- `/home/krwhynot/projects/crispy-crm/src/components/ui/card.tsx` - Shadow and border radius patterns
- `/home/krwhynot/projects/crispy-crm/src/components/admin/theme-provider.tsx` - Dark mode toggle logic
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/layout/Sidebar.tsx` - Sidebar styling requiring warm cream tint

---

## Implementation Plan

### Phase 1: Core Color System Migration

**CRITICAL: This phase MUST complete before all others. It establishes the foundation colors that all subsequent phases depend on.**

#### Task 1.1: Update Brand Foundation Colors (Tier 1) [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/shared.md` (lines 47-72: Three-tier hierarchy explanation)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/requirements.md` (lines 50-90: Target color values)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/migration-checklist.md` (lines 22-126: Phase 1 step-by-step)

**Instructions**

Files to Modify:
- `/home/krwhynot/projects/crispy-crm/src/index.css`

**Step 1: Replace Brand Green (lines 59-66)**
```css
/* OLD - Brand-green system (hue 125°) */
--brand-500: oklch(74% 0.12 125);
--brand-700: oklch(50% 0.10 125);

/* NEW - MFB lime green (hue 100°) */
--brand-100: oklch(92% 0.08 100);
--brand-300: oklch(85% 0.12 100);
--brand-500: oklch(72% 0.132 100);   /* #7CB342 identity color */
--brand-650: oklch(64% 0.128 100);   /* Hover state */
--brand-700: oklch(56% 0.125 100);   /* Primary CTAs - DARKENED for WCAG AA on cream */
--brand-750: oklch(52% 0.120 100);   /* Active state */
--brand-800: oklch(48% 0.115 100);   /* Pressed/dark states */
```

**Step 2: Replace Neutral Scale (lines 47-57)**
Shift cool undertone (284-288°) → warm undertone (85°)
```css
/* NEW - Warm neutrals with yellow-beige tint */
--neutral-50:  oklch(97.8% 0.008 85);
--neutral-100: oklch(95.5% 0.010 85);
--neutral-200: oklch(90.2% 0.012 85);
--neutral-300: oklch(84.3% 0.015 85);
--neutral-400: oklch(71.6% 0.018 85);
--neutral-500: oklch(57.7% 0.020 85);
--neutral-600: oklch(46.0% 0.018 85);
--neutral-700: oklch(38.1% 0.015 85);
--neutral-800: oklch(28.5% 0.012 85);
--neutral-900: oklch(21.7% 0.010 85);
--neutral-950: oklch(13.1% 0.008 85);
```

**Step 3: Add Clay/Terracotta Accent (after line 72)**
Replace purple/teal with clay orange
```css
/* NEW - Clay/Terracotta accent colors (hue 76°) */
--accent-clay-700: oklch(52% 0.120 76);
--accent-clay-600: oklch(58% 0.115 76);
--accent-clay-500: oklch(63% 0.110 76);  /* #EA580C converted */
--accent-clay-400: oklch(72% 0.095 76);
--accent-clay-300: oklch(82% 0.075 76);
```

**Step 4: Update Background/Foreground (lines 74-76)**
```css
/* NEW - Warm cream background */
--background: oklch(99% 0.015 85);     /* #FEFEF9 warm cream */
--foreground: oklch(20% 0.012 85);     /* Slightly warmer dark text */
```

**Step 5: Update Semantic Tokens (lines 83-96)**
ONLY update `--primary` and `--accent` - others cascade automatically
```css
--primary: var(--brand-700);           /* Now points to darkened MFB green */
--accent: var(--accent-clay-500);      /* Now points to clay orange */
--ring: var(--brand-500);              /* Focus ring uses identity color */
```

**Validation Before Committing:**
- Run `npm run dev` and verify no CSS parsing errors
- Check browser DevTools Computed styles show new OKLCH values
- Screenshot: Login page, Dashboard, Contacts list (before/after comparison)
- Run `npm run validate:colors` (expect 16 passing tests for tags)

**Gotchas:**
- DO NOT update semantic state colors (success/warning/info/error) yet - those are Phase 4
- DO NOT modify dark mode block (`.dark`) - that's Phase 6
- Chart colors reference `--brand-500` so they'll update automatically (but need semantic refactor in Phase 4)

---

#### Task 1.2: Fix Validation Script Semantic Color Resolution [Depends on: none]

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/shared.md` (lines 25-33: GAP 2 validation script issue)
- Validation agent research output (script currently validates 16/34 tests)

**Instructions**

Files to Modify:
- `/home/krwhynot/projects/crispy-crm/scripts/validate-colors.js`

**Problem**: Script only extracts direct OKLCH definitions, skipping semantic colors like `--primary: var(--brand-700)`

**Solution Option A - Quick Fix (15 minutes):**
Enhance regex to resolve CSS variable chains recursively. Add after line 320:

```javascript
// Resolve CSS variable references recursively
function resolveColorVar(varName, colorMap) {
  const value = colorMap.get(varName);
  if (!value) return null;

  // If value is direct OKLCH, return it
  if (value.startsWith('oklch(')) return value;

  // If value is var() reference, resolve recursively
  const varMatch = value.match(/var\(--([a-z-]+)\)/);
  if (varMatch) {
    return resolveColorVar(varMatch[1], colorMap);
  }

  return null;
}
```

Then update semantic color test preparation (around line 330) to call `resolveColorVar()` instead of direct map lookup.

**Solution Option B - Manual Override (5 minutes):**
Add earth-tone OKLCH values directly to test pairs instead of resolving `var()` references:

```javascript
const semanticPairs = [
  { bg: 'oklch(56% 0.125 100)', fg: 'oklch(99% 0.015 85)', name: 'primary-button' },
  { bg: 'oklch(95.5% 0.010 85)', fg: 'oklch(38.1% 0.015 85)', name: 'secondary-button' },
  // ... etc
];
```

**Validation:**
- Run `npm run validate:colors` after fix
- Expect 34+ passing tests (16 tags + 14 semantic + 4 focus)
- Check `color-contrast-report.json` includes primary, secondary, destructive tests

**Gotcha**: If using Option A, ensure recursion depth limit to prevent infinite loops on circular references.

---

### Phase 2: Typography System (Parallelizable after Phase 1)

**CAN RUN IN PARALLEL** with Phases 3, 4, 5 after Phase 1 completes.

#### Task 2.1: Add Nunito Font Loading [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/shared.md` (lines 36-49: GAP 3 import order critical)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/typography-system.research.md` (lines 172-199: Import order warning)
- Typography validation agent research output (confirms NO tailwind.config.ts, uses CSS-first)

**Instructions**

Files to Modify:
- `/home/krwhynot/projects/crispy-crm/index.html`
- `/home/krwhynot/projects/crispy-crm/src/index.css`

**Step 1: Add Google Fonts to index.html `<head>`**
Insert BEFORE closing `</head>` tag (around line 12):
```html
<!-- Google Fonts - Nunito family -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
```

**Step 2: Update index.html inline body style (line 18)**
```html
<style>
  body {
    margin: 0;
    padding: 0;
    font-family: 'Nunito', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }
</style>
```

**Step 3: Add font variable to src/index.css @theme block (after line 42)**
```css
@theme inline {
  /* ... existing color variables ... */

  /* Typography */
  --font-sans: 'Nunito', 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

**Step 4: Apply font to body in src/index.css (add after line 197, before `.dark`)**
```css
@layer base {
  body {
    font-family: var(--font-sans);
  }
}
```

**Validation:**
- Open DevTools Network tab, verify Google Fonts requests succeed
- Check Computed styles on `<body>`: `font-family` should show `Nunito, system-ui, ...`
- Disable Google Fonts in DevTools, verify fallback to system-ui works
- Run Lighthouse audit, verify `font-display: swap` present (prevents FOIT)

**Gotchas:**
- **CRITICAL**: HTML `<link>` tags MUST come before Vite injects build CSS. This order is automatic in production builds.
- If using CSS `@import` instead, it MUST be first line of index.css (before `@import "tailwindcss"`). **Recommended to use HTML `<link>` tags to avoid ordering complexity.**
- Weights loaded: 400 (regular), 500 (medium), 600 (semibold), 700 (bold) + italic variants for 400, 600

---

### Phase 3: Component Pattern Updates (Parallelizable after Phase 1)

**CAN RUN IN PARALLEL** with Phases 2, 4, 5 after Phase 1 completes.

#### Task 3.1: Update Button and Card Corner Radius [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/requirements.md` (lines 160-195: Component pattern specifications)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/component-patterns.research.md` (58 component analysis)

**Instructions**

Files to Modify:
- `/home/krwhynot/projects/crispy-crm/src/index.css`
- `/home/krwhynot/projects/crispy-crm/src/components/ui/card.tsx`
- `/home/krwhynot/projects/crispy-crm/src/components/ui/dialog.tsx`

**Step 1: Update global border radius (src/index.css line 45)**
```css
:root {
  --radius: 0.5rem;  /* 8px - changed from 0.625rem (10px) */
  /* ... rest of variables ... */
}
```

**Step 2: Update Card hover effects (src/components/ui/card.tsx)**
Find Card component className (around line 8), update shadow:
```tsx
// BEFORE
className="rounded-lg border bg-card text-card-foreground shadow-sm"

// AFTER
className="rounded-xl border bg-card text-card-foreground shadow-md hover:shadow-lg transition-shadow duration-200"
```

**Step 3: Update Dialog corner radius (src/components/ui/dialog.tsx)**
Find DialogContent className (around line 45):
```tsx
// BEFORE
className="... rounded-lg ..."

// AFTER
className="... rounded-xl ..."
```

**Validation:**
- Inspect any card component: border-radius should compute to 8px (was 10px)
- Hover over cards: shadow should smoothly intensify over 200ms
- Open any dialog: corners should be rounded-xl (12px)

**Gotcha**: `rounded-lg` = 8px in new system (because `--radius` changed). Upgrade to `rounded-xl` for dialogs (12px) to create visual hierarchy.

---

#### Task 3.2: Update Shadow Opacity for Cream Background [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/requirements.md` (lines 172-182: Shadow system)

**Instructions**

Files to Modify:
- `/home/krwhynot/projects/crispy-crm/src/index.css`

**Update shadow definitions (lines 186-196)**
Increase opacity 25-30% for visibility on warm cream background:
```css
/* Shadow system - 3-tier elevation (light mode) */
--shadow-card-1: 0 1px 3px oklch(0 0 0 / 0.16);         /* Was 0.12 → now 0.16 */
--shadow-card-2: 0 2px 6px oklch(0 0 0 / 0.20);         /* Was 0.15 → now 0.20 */
--shadow-card-3: 0 3px 8px oklch(0 0 0 / 0.24);         /* Was 0.18 → now 0.24 */
--shadow-card-1-hover: 0 2px 6px oklch(0 0 0 / 0.24);   /* Was 0.18 → now 0.24 */
--shadow-card-2-hover: 0 4px 12px oklch(0 0 0 / 0.32);  /* Was 0.25 → now 0.32 */
--shadow-card-3-hover: 0 6px 16px oklch(0 0 0 / 0.38);  /* Was 0.30 → now 0.38 */
```

**Validation:**
- View Dashboard with multiple cards: shadows should be subtly more pronounced than before
- Compare against screenshots from before Phase 1: shadows should maintain same "visual weight" despite lighter background

**Gotcha**: Dark mode shadows (in `.dark` block) should use higher opacity (35-55%) for visibility on dark backgrounds. Update those in Phase 6.

---

#### Task 3.3: Fix Hardcoded Colors in Overlays [Depends on: 1.1]

**READ THESE BEFORE TASK**
- Dark mode validation agent research output (identifies 5 hardcoded color violations)

**Instructions**

Files to Modify:
- `/home/krwhynot/projects/crispy-crm/src/components/ui/dialog.tsx`
- `/home/krwhynot/projects/crispy-crm/src/components/ui/sheet.tsx`
- `/home/krwhynot/projects/crispy-crm/src/components/admin/bulk-actions-toolbar.tsx`
- `/home/krwhynot/projects/crispy-crm/src/index.css`

**Step 1: Add semantic overlay variable (src/index.css after line 96)**
```css
/* Overlay/backdrop colors */
--overlay: oklch(0 0 0 / 50%);         /* Black 50% opacity for modals */
--overlay-light: oklch(0 0 0 / 30%);   /* Lighter overlay variant */
```

**Step 2: Fix Dialog overlay (src/components/ui/dialog.tsx line ~39)**
```tsx
// BEFORE
className="... bg-black/50"

// AFTER
className="... bg-[var(--overlay)]"
```

**Step 3: Fix Sheet overlay (src/components/ui/sheet.tsx line ~39)**
Same replacement as dialog.

**Step 4: Fix BulkActionsToolbar (src/components/admin/bulk-actions-toolbar.tsx line ~32)**
```tsx
// BEFORE
className="... bg-zinc-100 dark:bg-zinc-900"

// AFTER
className="... bg-card"
```

**Validation:**
- Open any dialog: overlay should be semi-transparent dark
- Toggle dark mode: overlay should maintain same visual appearance (semantic variable handles adaptation)
- Open sheet component: same overlay behavior
- Select multiple items in list: bulk actions toolbar should use card background color

**Gotcha**: `bg-[var(--overlay)]` uses arbitrary value syntax because `--overlay` is not in `@theme` bridge. Alternative: add to bridge or use `bg-black/50` but define `--overlay` for documentation purposes.

---

### Phase 4: Chart and Data Visualization (Parallelizable after Phase 1)

**CAN RUN IN PARALLEL** with Phases 2, 3, 5 after Phase 1 completes.

**CRITICAL PRE-REQUISITE**: Refactor OpportunitiesChart to use chart tokens BEFORE updating chart color definitions, otherwise charts won't update (GAP 1).

#### Task 4.1: Refactor OpportunitiesChart to Use Chart Tokens [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/shared.md` (lines 11-21: GAP 1 chart color mismatch)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/chart-system.research.md` (lines 144-168: Current semantic color usage issue)

**Instructions**

Files to Modify:
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/OpportunitiesChart.tsx`

**Problem**: Chart currently uses `var(--success-default)`, `var(--info-default)`, `var(--error-default)` instead of dedicated chart palette.

**Step 1: Replace colors array (lines 127-131)**
```tsx
// BEFORE
colors={[
  "var(--success-default)",  // Won
  "var(--info-default)",     // Pending
  "var(--error-default)",    // Lost
]}

// AFTER - Use categorical chart tokens
colors={[
  "var(--chart-2)",  // Won (MFB lime green - "our performance")
  "var(--chart-6)",  // Pending (sage-teal - cool counterpoint)
  "var(--chart-7)",  // Lost (eggplant - deep neutral)
]}
```

**Step 2: Update legend markers (lines 210, 222)**
```tsx
// BEFORE
color: "var(--success-default)"  // Won legend
color: "var(--error-default)"    // Lost legend

// AFTER
color: "var(--chart-2)"  // Won legend
color: "var(--chart-7)"  // Lost legend
```

**Validation:**
- Run `npm run dev` and verify chart still renders
- Colors should match previous appearance (because Phase 1 hasn't updated chart tokens yet)
- No console errors related to Nivo chart rendering

**Gotcha**: This refactor is NECESSARY but won't visually change charts until Task 4.2 updates the `--chart-X` definitions. This decouples chart semantics from state semantics.

---

#### Task 4.2: Implement Earth-Tone Chart Color Palette [Depends on: 4.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/requirements.md` (lines 117-159: Chart color system specifications)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/chart-system.research.md` (lines 369-405: Earth-tone palette recommendations)

**Instructions**

Files to Modify:
- `/home/krwhynot/projects/crispy-crm/src/index.css`

**Replace chart color definitions (lines 166-171)**
Add 8-color earth-tone palette with dual tokens (fill + stroke):
```css
/* Chart System: Earth-Tone Palette (MFB Garden Theme) */

/* Chart 1: Warm Tan/Soil (Baseline/Benchmark) */
--chart-1: oklch(55% 0.035 60);              /* Warm brown */
--chart-1-fill: oklch(55% 0.035 60);         /* Light fill */
--chart-1-stroke: oklch(37% 0.035 60);       /* Darker stroke for AA */

/* Chart 2: MFB Lime Green (Our Data/Primary) */
--chart-2: var(--brand-500);                 /* Semantic reference */
--chart-2-fill: oklch(72% 0.132 100);        /* #7CB342 */
--chart-2-stroke: oklch(35% 0.132 100);      /* Dark green for AA */

/* Chart 3: Terracotta/Clay (Revenue/High Priority) */
--chart-3: oklch(63% 0.110 76);              /* Clay orange */
--chart-3-fill: oklch(70% 0.110 76);
--chart-3-stroke: oklch(40% 0.110 76);

/* Chart 4: Sage/Olive (Secondary/Neutral) */
--chart-4: oklch(60% 0.065 120);             /* Sage green */
--chart-4-fill: oklch(68% 0.065 120);
--chart-4-stroke: oklch(38% 0.065 120);

/* Chart 5: Golden Amber (Warning/Attention) */
--chart-5: oklch(70% 0.125 85);              /* Golden amber */
--chart-5-fill: oklch(73% 0.125 85);
--chart-5-stroke: oklch(43% 0.125 85);

/* Chart 6: Sage-Teal (Cool Counterpoint) */
--chart-6: oklch(58% 0.065 180);             /* Sage-teal */
--chart-6-fill: oklch(65% 0.065 180);
--chart-6-stroke: oklch(35% 0.065 180);

/* Chart 7: Eggplant (Deep Neutral/Inactive) */
--chart-7: oklch(48% 0.065 295);             /* Eggplant */
--chart-7-fill: oklch(55% 0.065 295);
--chart-7-stroke: oklch(30% 0.065 295);

/* Chart 8: Mushroom Gray (Fallback/Misc) */
--chart-8: oklch(50% 0.012 85);              /* Mushroom gray */
--chart-8-fill: oklch(58% 0.012 85);
--chart-8-stroke: oklch(35% 0.012 85);

/* Chart support tokens */
--chart-gridline: oklch(90% 0.015 85);       /* Subtle warm gridlines */
--chart-axis-text: var(--muted-foreground);  /* Axis labels */
--chart-disabled: oklch(78% 0.008 85);       /* Disabled/muted data */
```

**Validation:**
- Load Dashboard page: OpportunitiesChart should now show earth-tone colors
- Won bars: MFB lime green (#7CB342)
- Pending bars: Sage-teal (cool counterpoint)
- Lost bars: Eggplant (deep neutral)
- Legend markers match bar colors
- Hover tooltips show correct values with readable text

**Gotcha**: `--chart-2` references `var(--brand-500)` to maintain semantic link. Other chart colors are direct OKLCH for independence. Dual tokens (-fill/-stroke) enable WCAG AA compliance for text labels.

---

#### Task 4.3: Update Semantic State Colors for Earth Tones [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/requirements.md` (lines 73-93: Semantic color specifications)

**Instructions**

Files to Modify:
- `/home/krwhynot/projects/crispy-crm/src/index.css`

**Update state color families (lines 98-136)**

**Success states (green) - shift to match MFB lime:**
```css
--success-subtle: oklch(92% 0.08 100);       /* Lighter MFB lime */
--success-default: oklch(56% 0.125 100);     /* Same as --brand-700 for consistency */
--success-strong: oklch(48% 0.130 100);      /* Darker variant */
--success-bg: oklch(95% 0.05 100);           /* Light lime tint */
--success-border: oklch(78% 0.10 100);       /* Medium lime */
--success-hover: oklch(60% 0.122 100);
--success-active: oklch(52% 0.127 100);
--success-disabled: oklch(72% 0.06 100);
```

**Warning states (orange/amber) - shift to golden amber:**
```css
--warning-subtle: oklch(94% 0.055 85);
--warning-default: oklch(68% 0.140 85);      /* Darker for WCAG AA on cream */
--warning-strong: oklch(58% 0.145 85);
--warning-bg: oklch(96% 0.045 85);
--warning-border: oklch(82% 0.115 85);
--warning-hover: oklch(72% 0.137 85);
--warning-active: oklch(64% 0.142 85);
--warning-disabled: oklch(78% 0.065 85);
```

**Info states (blue) - shift to sage-teal:**
```css
--info-subtle: oklch(94% 0.040 180);
--info-default: oklch(58% 0.065 180);        /* Sage-teal */
--info-strong: oklch(48% 0.070 180);
--info-bg: oklch(96% 0.030 180);
--info-border: oklch(80% 0.055 180);
--info-hover: oklch(62% 0.062 180);
--info-active: oklch(54% 0.067 180);
--info-disabled: oklch(72% 0.040 180);
```

**Error states (red) - shift to terracotta:**
```css
--error-subtle: oklch(92% 0.075 30);
--error-default: oklch(58% 0.130 30);        /* Terracotta/rust */
--error-strong: oklch(48% 0.135 30);
--error-bg: oklch(95% 0.055 30);
--error-border: oklch(80% 0.105 30);
--error-hover: oklch(62% 0.127 30);
--error-active: oklch(54% 0.132 30);
--error-disabled: oklch(72% 0.070 30);
```

**Destructive (keep red but adjust):**
```css
--destructive: oklch(58% 0.180 27);          /* Slightly lighter for cream background */
```

**Validation:**
- Submit empty form: error messages should show terracotta red
- View success toast: should show MFB lime green
- Check warning alerts: should show golden amber
- Run `npm run validate:colors`: all semantic color tests should pass WCAG AA

**Gotcha**: These state colors are used across 141+ components. Changes cascade automatically via semantic token system. Test multiple contexts: buttons, alerts, toasts, form validation.

---

### Phase 5: Tags and Sidebar Styling (Parallelizable after Phase 1)

**CAN RUN IN PARALLEL** with Phases 2, 3, 4 after Phase 1 completes.

#### Task 5.1: Expand Tag Color System with Earth Tones [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/requirements.md` (lines 196-227: Tag color expansion)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/migration-checklist.md` (lines 333-393: Tag implementation details)

**Instructions**

Files to Modify:
- `/home/krwhynot/projects/crispy-crm/src/index.css`
- `/home/krwhynot/projects/crispy-crm/src/lib/color-types.ts`
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/tags/colors.ts`

**Step 1: Shift existing 8 tags warmer (src/index.css lines 138-154)**
Increase hue by 10° for warmer appearance:
```css
/* Existing tags - shifted +10° warmer */
--tag-warm-bg: oklch(92.1% 0.041 79.5);      /* Was 69.5° → now 79.5° */
--tag-warm-fg: oklch(20% 0.02 79.5);

--tag-green-bg: oklch(95% 0.023 159.3);      /* Was 149.3° → now 159.3° */
--tag-green-fg: oklch(20% 0.02 159.3);

--tag-teal-bg: oklch(94.2% 0.023 206.7);     /* Was 196.7° → now 206.7° */
--tag-teal-fg: oklch(20% 0.02 206.7);

--tag-blue-bg: oklch(92.9% 0.033 275.6);     /* Was 265.6° → now 275.6° */
--tag-blue-fg: oklch(20% 0.02 275.6);

--tag-purple-bg: oklch(93.8% 0.034 304.6);   /* Was 294.6° → now 304.6° */
--tag-purple-fg: oklch(20% 0.02 304.6);

--tag-yellow-bg: oklch(98.1% 0.026 118.8);   /* Was 108.8° → now 118.8° */
--tag-yellow-fg: oklch(20% 0.02 118.8);

/* Gray and pink stay same (neutral/accent) */
--tag-gray-bg: oklch(94.7% 0 0);
--tag-gray-fg: oklch(20% 0 0);
--tag-pink-bg: oklch(93.5% 0.043 350.2);
--tag-pink-fg: oklch(20% 0.02 350.2);
```

**Step 2: Add 5 new earth-tone tags (src/index.css after line 154)**
```css
/* NEW earth-tone tags */
--tag-terracotta-bg: oklch(88% 0.075 76);
--tag-terracotta-fg: oklch(30% 0.110 76);

--tag-sage-bg: oklch(92% 0.055 145);
--tag-sage-fg: oklch(30% 0.095 145);

--tag-olive-bg: oklch(88% 0.065 120);
--tag-olive-fg: oklch(25% 0.105 120);

--tag-amber-bg: oklch(90% 0.095 85);
--tag-amber-fg: oklch(30% 0.125 85);

--tag-rust-bg: oklch(86% 0.085 30);
--tag-rust-fg: oklch(28% 0.115 30);
```

**Step 3: Add tag types to TypeScript (src/lib/color-types.ts)**
Find `TagColor` type definition, add new values:
```typescript
export type TagColor =
  | 'warm'
  | 'green'
  | 'teal'
  | 'blue'
  | 'purple'
  | 'yellow'
  | 'gray'
  | 'pink'
  | 'terracotta'  // NEW
  | 'sage'        // NEW
  | 'olive'       // NEW
  | 'amber'       // NEW
  | 'rust';       // NEW
```

**Step 4: Export new tag colors (src/atomic-crm/tags/colors.ts)**
Add to color array:
```typescript
export const tagColors: TagColor[] = [
  'warm',
  'green',
  'teal',
  'blue',
  'purple',
  'yellow',
  'gray',
  'pink',
  'terracotta',  // NEW
  'sage',        // NEW
  'olive',       // NEW
  'amber',       // NEW
  'rust',        // NEW
];
```

**Validation:**
- Create contact with each tag color: verify background/foreground contrast
- Run `npm run validate:colors`: all 13 tag tests should pass (was 8)
- Check tag picker UI: new colors should appear in dropdown
- Test dark mode: tags should remain readable

**Gotcha**: Tag utility classes are auto-generated from CSS variables (lines 392-430 in index.css). New tags should work automatically without manual class definitions.

---

#### Task 5.2: Apply Warm Cream Tint to Sidebar [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/requirements.md` (lines 228-240: Sidebar styling)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/shared.md` (lines 91: Sidebar reference)

**Instructions**

Files to Modify:
- `/home/krwhynot/projects/crispy-crm/src/index.css`

**Update sidebar colors (lines 173-184)**
```css
/* Sidebar Colors - Warm cream tint */
--sidebar: oklch(98% 0.012 85);                        /* Was --neutral-100, now warm cream tint */
--sidebar-foreground: var(--neutral-700);              /* Keep same */
--sidebar-primary: var(--brand-700);                   /* Primary items (MFB green) */
--sidebar-primary-foreground: oklch(99% 0.015 85);     /* Warm white text */
--sidebar-accent: oklch(96% 0.025 100);                /* Light lime tint for hover */
--sidebar-accent-foreground: var(--neutral-700);       /* Dark text */
--sidebar-border: var(--neutral-200);                  /* Warm border */
--sidebar-ring: var(--brand-500);                      /* Focus ring (identity color) */
--sidebar-active-bg: oklch(94% 0.035 100);             /* Active item: light lime */
--sidebar-active-text: var(--brand-700);               /* Active text: MFB green */
--sidebar-active-indicator: var(--brand-700);          /* Active indicator: MFB green */
```

**Validation:**
- View sidebar: background should be subtly warmer than main background
- Hover over nav items: should show light lime tint
- Click nav item: active state should show stronger lime tint with MFB green text
- Compare to main content area: sidebar should be distinct but harmonious

**Gotcha**: Sidebar background is only 1% lighter than main background (98% vs 99%). This is intentional for subtle differentiation. More contrast creates visual "boxiness".

---

### Phase 6: Dark Mode Generation (Sequential - depends on Phase 1)

**MUST WAIT** for Phase 1 to complete. CAN run after Phases 2-5 if they're done, but Phase 1 is mandatory prerequisite.

#### Task 6.1: Generate Dark Mode Color Palette [Depends on: 1.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/requirements.md` (lines 241-274: Dark mode generation algorithm)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/migration-checklist.md` (lines 435-553: Dark mode implementation)
- Dark mode validation agent research output (`.dark` class applied to `<html>`, ThemeProvider architecture confirmed)

**Instructions**

Files to Modify:
- `/home/krwhynot/projects/crispy-crm/src/index.css`

**Update `.dark` scope (lines 199-350)**

**Step 1: Invert neutral scale (keep warm undertone 85°)**
```css
.dark {
  /* Inverted Neutrals - flip lightness only */
  --neutral-50: oklch(13.1% 0.008 85);   /* Was 97.8% → darkest */
  --neutral-100: oklch(21.7% 0.010 85);  /* Was 95.5% */
  --neutral-200: oklch(28.5% 0.012 85);  /* Was 90.2% */
  --neutral-300: oklch(38.1% 0.015 85);  /* Was 84.3% */
  --neutral-400: oklch(46.0% 0.018 85);  /* Was 71.6% */
  --neutral-500: oklch(57.7% 0.020 85);  /* Center - stays same */
  --neutral-600: oklch(71.6% 0.018 85);  /* Was 46.0% */
  --neutral-700: oklch(84.3% 0.015 85);  /* Was 38.1% */
  --neutral-800: oklch(90.2% 0.012 85);  /* Was 28.5% */
  --neutral-900: oklch(95.5% 0.010 85);  /* Was 21.7% */
  --neutral-950: oklch(97.8% 0.008 85);  /* Was 13.1% → lightest */
```

**Step 2: Lighten brand colors for dark background visibility**
```css
/* Brand Colors - Lighter for dark mode */
--brand-100: oklch(30% 0.08 100);         /* Inverted/darkened */
--brand-300: oklch(45% 0.12 100);
--brand-500: oklch(75% 0.130 100);        /* Lighter MFB lime */
--brand-650: oklch(68% 0.125 100);
--brand-700: oklch(62% 0.122 100);        /* Primary CTAs lighter */
--brand-750: oklch(58% 0.118 100);
--brand-800: oklch(50% 0.112 100);
```

**Step 3: Desaturate accent clay for dark mode**
```css
/* Accent Clay - Reduced chroma */
--accent-clay-700: oklch(60% 0.100 76);   /* Reduced from 0.120 */
--accent-clay-600: oklch(66% 0.095 76);   /* Reduced from 0.115 */
--accent-clay-500: oklch(72% 0.090 76);   /* Reduced from 0.110 */
--accent-clay-400: oklch(78% 0.075 76);
--accent-clay-300: oklch(85% 0.060 76);
```

**Step 4: Invert background/foreground**
```css
/* Foundation - Dark warm background */
--background: oklch(15% 0.012 85);        /* Dark warm (slight brown) */
--foreground: oklch(98% 0.008 85);        /* Light warm text */
--card: oklch(18% 0.012 85);              /* Card slightly lighter */
--card-foreground: oklch(98% 0.008 85);
```

**Step 5: Adjust semantic state colors for dark mode**
```css
/* Success - Lighter for visibility */
--success-subtle: oklch(22% 0.08 100);
--success-default: oklch(62% 0.122 100);  /* Lighter MFB lime */
--success-strong: oklch(70% 0.125 100);
--success-bg: oklch(20% 0.05 100);

/* Warning - Lighter golden amber */
--warning-subtle: oklch(25% 0.055 85);
--warning-default: oklch(75% 0.130 85);
--warning-strong: oklch(82% 0.135 85);

/* Info - Lighter sage-teal */
--info-subtle: oklch(22% 0.040 180);
--info-default: oklch(65% 0.062 180);
--info-strong: oklch(72% 0.065 180);

/* Error - Lighter terracotta */
--error-subtle: oklch(25% 0.075 30);
--error-default: oklch(68% 0.125 30);
--error-strong: oklch(75% 0.130 30);

--destructive: oklch(70% 0.170 27);       /* Lighter red */
```

**Step 6: Update chart colors for dark mode**
```css
/* Charts - Lighter fills, maintain contrast */
--chart-1: oklch(65% 0.035 60);           /* Lighter tan */
--chart-1-fill: oklch(65% 0.035 60);
--chart-1-stroke: oklch(85% 0.035 60);    /* Light stroke for dark bg */

--chart-2: var(--brand-500);              /* Auto-updates to dark mode brand */
--chart-2-fill: oklch(75% 0.130 100);
--chart-2-stroke: oklch(88% 0.130 100);

--chart-3: oklch(72% 0.100 76);           /* Lighter clay */
--chart-3-fill: oklch(72% 0.100 76);
--chart-3-stroke: oklch(85% 0.100 76);

--chart-4: oklch(70% 0.065 120);          /* Lighter sage */
--chart-5: oklch(78% 0.118 85);           /* Lighter amber */
--chart-6: oklch(68% 0.062 180);          /* Lighter teal */
--chart-7: oklch(62% 0.065 295);          /* Lighter eggplant */
--chart-8: oklch(65% 0.012 85);           /* Lighter mushroom */
```

**Step 7: Update tag colors for dark mode**
Invert background/foreground for all 13 tag colors:
```css
--tag-warm-bg: oklch(25% 0.041 79.5);
--tag-warm-fg: oklch(85% 0.02 79.5);
/* ... repeat for all 13 tags ... */
```

**Step 8: Adjust shadows for dark mode**
```css
/* Shadows - Higher opacity for dark backgrounds */
--shadow-card-1: 0 1px 3px oklch(0 0 0 / 0.35);
--shadow-card-2: 0 2px 6px oklch(0 0 0 / 0.42);
--shadow-card-3: 0 3px 8px oklch(0 0 0 / 0.50);
--shadow-card-1-hover: 0 2px 6px oklch(0 0 0 / 0.50);
--shadow-card-2-hover: 0 4px 12px oklch(0 0 0 / 0.60);
--shadow-card-3-hover: 0 6px 16px oklch(0 0 0 / 0.70);
```

**Validation:**
- Toggle dark mode via theme switcher
- Check all pages: Login, Dashboard, Contacts, Forms
- Verify text contrast: run `npm run validate:colors` (should pass for dark mode tests)
- Test charts: bars should be lighter but maintain strategic color meaning
- Check tags: should be readable on dark background
- Verify sidebar: active state visible in dark mode

**Gotcha**: Dark mode uses algorithmic inversion but with manual lightness adjustments. Not a pure mathematical inversion - colors need +10-20% lightness for legibility.

---

### Phase 7: Testing and Validation (Sequential - depends on Phases 1-6)

**MUST WAIT** for all previous phases to complete. This is the final validation gate before deployment.

#### Task 7.1: Automated Testing Suite [Depends on: 1.1, 1.2, 2.1, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 6.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/testing-guide.md` (comprehensive testing procedures)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/migration-checklist.md` (lines 556-672: Testing checklist)

**Instructions**

No files to modify. Run validation commands and fix any issues.

**Step 1: Color contrast validation**
```bash
npm run validate:colors
```
Expected: 34+ tests passing (16 tags light + 16 tags dark + 14 semantic pairs + 4 focus tests)
If failures: adjust color lightness until WCAG AA compliance achieved

**Step 2: Build validation**
```bash
npm run build
```
Expected: No TypeScript errors, no CSS parsing errors, successful dist/ output
Check bundle size: CSS should be similar to pre-migration (<50KB)

**Step 3: Unit tests**
```bash
npm test
```
Expected: All existing tests pass. Update snapshots if visual changes are intentional.

**Step 4: Linting**
```bash
npm run lint
```
Expected: No linting errors. Fix any hardcoded color usage flagged by ESLint.

**Validation:**
- All 4 commands pass without errors
- No warnings about deprecated OKLCH syntax
- Bundle size within 10% of pre-migration baseline

**Gotcha**: If `validate:colors` fails, don't reduce color vibrancy - instead darken text colors or lighten backgrounds. Earth tones need adequate chroma to feel "organic."

---

#### Task 7.2: Manual Visual Regression Testing [Depends on: 7.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/testing-guide.md` (visual regression procedures)

**Instructions**

No files to modify. Perform visual inspection.

**Test Matrix (Light Mode):**
1. **Login Page**
   - [ ] Background is warm cream (#FEFEF9)
   - [ ] Logo visible with good contrast
   - [ ] Input fields have 8px rounded corners
   - [ ] Primary button uses MFB lime green
   - [ ] Font is Nunito (check DevTools Computed)

2. **Dashboard**
   - [ ] OpportunitiesChart shows earth-tone bars (lime, sage-teal, eggplant)
   - [ ] Cards have subtle shadows (visible on cream)
   - [ ] Quick stats use appropriate semantic colors
   - [ ] MiniPipeline text readable on cream background

3. **Contacts List**
   - [ ] Table background warm cream
   - [ ] Row hover shows light sage tint
   - [ ] Tags display 13 colors (8 shifted + 5 new)
   - [ ] Action buttons styled correctly

4. **Contact Detail Page**
   - [ ] Header section readable with good contrast
   - [ ] Activity timeline uses semantic state colors
   - [ ] Related records section clear

5. **Forms (Create/Edit)**
   - [ ] Input fields 8px rounded corners
   - [ ] Focus rings use MFB lime green (--brand-500)
   - [ ] Error states show terracotta red
   - [ ] Success messages show MFB lime green
   - [ ] Labels use Nunito medium (500 weight)

6. **Opportunities Pipeline**
   - [ ] Kanban columns warm beige background
   - [ ] Cards have proper shadows
   - [ ] Stage colors use earth tones
   - [ ] Drag indicators visible

7. **Sidebar**
   - [ ] Background subtly warmer than main content
   - [ ] Active item shows light lime tint
   - [ ] Hover states smooth (200ms transition)
   - [ ] Icons have good contrast

**Test Matrix (Dark Mode):**
Repeat all above tests with theme toggle set to dark:
- [ ] Background is dark warm (slight brown tint)
- [ ] Text is light warm (readable)
- [ ] Charts use lighter fills
- [ ] Tags readable on dark background
- [ ] Shadows more pronounced (35-70% opacity)

**Browser Testing:**
- [ ] Chrome/Edge (latest) - OKLCH renders correctly
- [ ] Firefox (latest) - OKLCH renders correctly
- [ ] Safari (if available) - OKLCH renders correctly

**Gotcha**: OKLCH requires Chrome 111+, Firefox 113+, Safari 16.4+. Older browsers will show invalid CSS (white or black). This is acceptable per project requirements (no legacy browser support).

---

#### Task 7.3: Accessibility Audit [Depends on: 7.2]

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/testing-guide.md` (accessibility procedures)

**Instructions**

No files to modify. Run accessibility audits.

**Step 1: Automated accessibility scan**
```bash
# Install axe DevTools browser extension
# Run audit on each major page: Login, Dashboard, Contacts, Forms
```
Expected: No critical or serious issues. Minor issues acceptable if documented.

**Step 2: Keyboard navigation**
- [ ] Tab through all interactive elements
- [ ] Focus indicators visible (MFB lime ring)
- [ ] No keyboard traps
- [ ] Logical tab order

**Step 3: Screen reader test**
- [ ] Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] Color changes don't break semantic HTML
- [ ] Form labels properly associated
- [ ] Error messages announced

**Step 4: Contrast ratios**
Use browser DevTools or contrast checker tool:
- [ ] Primary button text: 4.5:1+ (white on MFB green)
- [ ] Body text on cream: 4.5:1+ (dark on cream)
- [ ] Focus rings: 3:1+ (MFB lime on cream)
- [ ] Tags: 4.5:1+ (all 13 color pairs)

**Gotcha**: Warm cream background is 99% lightness - very close to white. Some text may need darkening to meet 4.5:1 ratio. Target 5:1+ for safety margin.

---

### Phase 8: Documentation Updates (Parallelizable with testing)

**CAN START** after Phase 6 completes. Can run in parallel with Phase 7.

#### Task 8.1: Update CLAUDE.md Color System Section [Depends on: 6.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/CLAUDE.md` (lines 22-50: Current color system description)
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/requirements.md` (lines 1-44: Feature summary)

**Instructions**

Files to Modify:
- `/home/krwhynot/projects/crispy-crm/CLAUDE.md`

**Replace Color System section (around lines 22-50)**
```markdown
## Color System

**Brand Identity**: Atomic CRM uses the MFB "Garden to Table" theme, a warm earth-tone OKLCH color system inspired by agricultural and food industry aesthetics.

**Color Architecture**:
- **Primary Brand**: MFB Lime Green at hue 100° (#7CB342) - vibrant garden green for CTAs and brand identity
- **Accent Colors**: Terracotta/Clay at hue 76° (#EA580C) for warmth and organic feel
- **Neutrals**: Warm gray with beige tint at hue 85° (vs. original cool gray at 285°)
- **Background**: Warm cream oklch(99% 0.015 85) = #FEFEF9 (vs. stark white)
- **Charts**: 8-color earth-tone palette (warm tan, lime green, terracotta, sage, amber, sage-teal, eggplant, mushroom)
- **Tags**: 13 color options (8 shifted 10° warmer + 5 new earth tones: terracotta, sage, olive, amber, rust)

**Key Features**:
- **Three-tier hierarchy**: Brand foundation → Semantic tokens → Component-specific
- **OKLCH color space**: Perceptual uniformity, consistent brightness across hues
- **Algorithmic dark mode**: Inverted neutrals with +10-20% lightness adjustment
- **Typography**: Nunito font family (Google Fonts) for friendly, organic aesthetic
- **WCAG AA compliance**: All 34 color pairs tested (4.5:1 text, 3:1 non-text)
- **Semantic token abstraction**: Components use --primary, not --brand-700

**Design Philosophy**:
- Primary buttons use --brand-700 (oklch 56% 0.125 100) for WCAG AA compliance on cream background
- Focus rings use --brand-500 (brand identity color)
- Sidebar uses warm cream tint for subtle differentiation
- Shadows increased 25-30% opacity for visibility on cream background
- Border radius reduced from 10px to 8px for modern organic feel

**Migration Date**: January 2025 (from brand-green to MFB Garden Theme)
**Archived Specs**: See `docs/archive/2025-10-color-system-preview/` for original October 2024 brand-green exploration
**Current Documentation**: `.docs/plans/mfb-garden-theme/` for full MFB theme specifications
```

**Validation:**
- Read CLAUDE.md end-to-end: ensure no conflicting descriptions
- Verify color values match src/index.css definitions
- Check links to archived docs are correct

**Gotcha**: CLAUDE.md is the single source of truth for project conventions. Any future developers will read this first - ensure accuracy.

---

#### Task 8.2: Create Theme Documentation [Depends on: 6.1]

**READ THESE BEFORE TASK**
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/migration-checklist.md` (lines 676-750: Documentation phase)

**Instructions**

Files to Create:
- `/home/krwhynot/projects/crispy-crm/.docs/theme/color-palette.md`
- `/home/krwhynot/projects/crispy-crm/.docs/theme/component-patterns.md`
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/migration-summary.md`

**File 1: color-palette.md**
Document all 180+ color tokens with:
- Token name (e.g., `--brand-700`)
- OKLCH value (e.g., `oklch(56% 0.125 100)`)
- Hex equivalent (e.g., `#5a7030`)
- Usage guidance (e.g., "Primary CTAs, WCAG AA compliant on cream")
- Visual description (e.g., "Darkened lime green")

**File 2: component-patterns.md**
Document styling patterns:
- Button variants (primary, secondary, destructive, outline, ghost)
- Card shadows (sm/md/lg and hover states)
- Form input focus rings (3px ring, --brand-500 color)
- Tag color selection guide (when to use which earth tone)
- Chart color assignment rules (baseline=tan, our-data=lime, warning=amber)

**File 3: migration-summary.md**
Include:
- Before/after comparison (link to screenshots)
- Files changed with line counts (use `git diff --stat`)
- Performance impact (bundle size, Lighthouse scores)
- Known issues or limitations (e.g., OKLCH browser support)
- Rollback procedure if needed

**Validation:**
- All links resolve correctly
- Code examples use correct OKLCH values
- Screenshots show actual application appearance

**Gotcha**: Screenshots should be taken in both light and dark modes. Store in `.docs/theme/screenshots/` directory.

---

## Advice for All Implementers

### Critical Success Factors

1. **Fix GAP 1 FIRST (Chart Refactor)**: OpportunitiesChart MUST be refactored to use `--chart-X` tokens BEFORE updating chart color definitions (Task 4.1 → 4.2). Otherwise dashboard charts won't update after migration.

2. **Only Edit Tier 1 Colors**: The three-tier hierarchy means you only touch brand colors, neutrals, and accents in src/index.css. Semantic tokens (`--primary`, `--accent`) cascade automatically. Components never need editing (except chart refactor).

3. **Validate Contrast Obsessively**: Warm cream background (99% lightness) is very light. Text needs 4.5:1 ratio minimum. Use darkened variants of brand colors for buttons/text. Run `npm run validate:colors` after every color change in Phase 1.

4. **Import Order Is Critical (Typography)**: Google Fonts MUST load before Tailwind CSS or fonts fail silently. Use HTML `<link>` tags (recommended) instead of CSS `@import` to avoid ordering complexity. See Task 2.1.

5. **Dark Mode Is Algorithmic**: Don't manually set every dark mode color. Follow the inversion pattern: neutrals flip (50↔950), brand colors lighten (+10-20%), chroma reduces slightly (-0.01 to -0.02). See Task 6.1.

6. **Test in Both Modes Early**: Toggle dark mode after every phase. Don't wait until Phase 6 to discover contrast issues. Validation script tests both modes automatically.

7. **Components Don't Change**: 141+ components auto-update via CSS variables. You should NOT edit .tsx files except for OpportunitiesChart (Task 4.1) and fixing hardcoded colors (Task 3.3). If you're editing component files extensively, you're doing it wrong.

### Parallel Execution Strategy

**Optimal Agent Assignment (4 agents):**
- **Agent A**: Phase 1 (Core Colors) → Phase 6 (Dark Mode) → Phase 7 (Testing) [Critical path]
- **Agent B**: Phase 2 (Typography) [Starts after Phase 1] → Phase 8.1 (CLAUDE.md) [After Phase 6]
- **Agent C**: Phase 3 (Component Patterns) [Starts after Phase 1] → Phase 7.2 (Visual Testing) [After Phase 6]
- **Agent D**: Phase 4 (Charts) + Phase 5 (Tags/Sidebar) [Starts after Phase 1] → Phase 8.2 (Theme Docs) [After Phase 6]

**Optimal Agent Assignment (2 agents):**
- **Agent A**: Phase 1 → Phase 6 → Phase 7 [Critical path, no parallelization]
- **Agent B**: Phase 2 + 3 + 4 + 5 [Parallel phases] → Phase 8 [Documentation]

**Single Agent Execution:**
- Follow phases 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 sequentially
- Estimated 32-42 hours (no time savings from parallelization)

### Common Pitfalls to Avoid

1. **Hardcoding hex colors**: NEVER use `#7CB342` directly. Always use CSS variables: `var(--brand-500)` or semantic tokens: `var(--primary)`.

2. **Skipping validation between phases**: Run `npm run validate:colors` after Phase 1, 4, and 6. Don't wait until Phase 7 to discover WCAG failures.

3. **Editing Tailwind config**: There is NO tailwind.config.ts in this project. All configuration happens in `@theme inline {}` block in src/index.css (Tailwind v4 pattern).

4. **Breaking dark mode**: If you edit light mode colors, you MUST update corresponding dark mode colors in `.dark {}` block. Forgetting this causes broken dark mode.

5. **Ignoring chart semantics**: Charts use strategic color meaning (baseline=neutral, our-data=brand, warning=amber). Don't randomly assign earth tones - follow the documented strategy.

6. **Assuming validation script is complete**: The script currently validates only 16/34 tests (tags only). Task 1.2 fixes this, but even after, manual testing is required for edge cases.

7. **Modifying component files unnecessarily**: If you find yourself editing button.tsx, card.tsx, or other UI components, STOP. The semantic token system means components auto-update. Only exception: fixing hardcoded colors (Task 3.3).

### Performance Considerations

- **Bundle Size**: Adding Nunito font increases initial load by ~50KB. Use `font-display: swap` to prevent FOIT.
- **Color Variables**: 180+ CSS variables add ~3KB to stylesheet. This is negligible.
- **Chart Library**: Nivo is already lazy-loaded. No additional optimization needed.
- **Build Time**: OKLCH colors don't slow down Tailwind processing. Build time should be unchanged.

### Rollback Strategy

If critical issues discovered during Phase 7:
1. Git revert to commit before Phase 1: `git revert <commit-hash>`
2. Or checkout backup branch created in pre-flight checks
3. Document issues in GitHub issue with "theme-migration" label
4. Fix issues in separate branch, re-run phases 1-7

**Point of No Return**: Once Phase 7 passes and PR is merged to main, rolling back requires database migration (none needed for this CSS-only migration, but document just in case).

---

**Last Updated**: 2025-01-17
**Status**: Ready for parallel execution
**Estimated Total Time**: 26-38 hours (with 4-agent parallelization: 12-18 hours elapsed)
**Next Step**: Assign tasks to agents, begin Phase 1 (Core Colors)
