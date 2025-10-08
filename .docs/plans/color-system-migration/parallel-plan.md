# Color System Migration - Parallel Implementation Plan

**Migration Goal:** Transform Atomic CRM from neutral grayscale to brand-green-centered OKLCH design with 42 colors, maintaining WCAG AA compliance throughout.

**Strategy:** Atomic single-deployment with 8 parallel-executable phases. All code changes deploy simultaneously—no gradual rollout, no feature flags, no backward compatibility (Engineering Constitution Rule #1: NO OVER-ENGINEERING).

**Key Numbers:**
- 66 new CSS variables to add (29 foundation + 37 semantic mappings)
- 28 existing variables to update
- 5 files with hardcoded violations to fix
- 75+ button instances affected
- 0 database schema changes

---

## Critically Relevant Files and Documentation

### Core Files (MUST READ BEFORE ANY TASK)
- `/home/krwhynot/Projects/atomic/src/index.css` - Single source of truth for all colors (lines 51-161 for :root, 163-end for .dark)
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/requirements.md` - Exact CSS values for all 66 additions + 28 updates
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/shared.md` - Architecture overview and validation patterns
- `/home/krwhynot/Projects/atomic/CLAUDE.md` - Engineering Constitution Rule #7: Semantic colors only

### Validation & Testing
- `/home/krwhynot/Projects/atomic/scripts/validate-colors.js` - Automated WCAG compliance (34 tests)
- `/home/krwhynot/Projects/atomic/scripts/migration-validate.sh` - Hardcoded color detection
- `/home/krwhynot/Projects/atomic/.github/workflows/chromatic.yml.disabled` - Visual regression workflow
- `/home/krwhynot/Projects/atomic/docs/2025-10/NEW-color-guide.html` - Authoritative color specification

### Component Files (For Phase 6 fixes)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/OrganizationType.tsx` (lines 41, 91)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/products/ProductAside.tsx` (lines 42, 45, 106)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/Status.tsx` (if inline styles exist)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/pages/WhatsNew.tsx` (lines 248, 256, 298, 339, 440, 464, 473, 482)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts` (line 33: var(--teal) → var(--tag-teal-bg))

---

## Implementation Plan

### Phase 1: Foundation Variables - Add New Colors

#### Task 1.1: Add Neutral Scale (10 variables) **Depends on: [none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/requirements.md` (lines 48-99)
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/gap-analysis.md` (section 1.1)
- `/home/krwhynot/Projects/atomic/src/index.css` (lines 51-161 for :root placement)

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/index.css`

Add to `:root` block (after line 52, before existing --background):
```css
/* Core Neutrals - OKLCH format with cool undertone */
--neutral-50:  oklch(97.1% 0.002 284.5);  /* #f7f7f8 */
--neutral-100: oklch(88.4% 0.005 284.8);  /* #dee0e3 */
--neutral-200: oklch(80.2% 0.007 285.2);  /* #c5c9ce */
--neutral-300: oklch(72.1% 0.009 285.6);  /* #acb2ba */
--neutral-400: oklch(63.9% 0.011 286.0);  /* #939ba5 */
--neutral-500: oklch(55.8% 0.013 286.4);  /* #7a8491 */
--neutral-600: oklch(47.7% 0.015 286.8);  /* #616d7c */
--neutral-700: oklch(39.6% 0.017 287.2);  /* #485667 */
--neutral-800: oklch(31.5% 0.019 287.6);  /* #2f3f52 */
--neutral-900: oklch(23.4% 0.021 288.0);  /* #16283d */
```

Add to `.dark` block (after line 163, invert neutral scale):
```css
/* Inverted Neutrals for dark mode */
--neutral-50:  oklch(23.4% 0.021 288.0);  /* Swapped with 900 */
--neutral-100: oklch(31.5% 0.019 287.6);  /* Swapped with 800 */
--neutral-200: oklch(39.6% 0.017 287.2);  /* Swapped with 700 */
--neutral-300: oklch(47.7% 0.015 286.8);  /* Swapped with 600 */
--neutral-400: oklch(55.8% 0.013 286.4);  /* Swapped with 500 */
--neutral-500: oklch(63.9% 0.011 286.0);  /* Swapped with 400 */
--neutral-600: oklch(72.1% 0.009 285.6);  /* Swapped with 300 */
--neutral-700: oklch(80.2% 0.007 285.2);  /* Swapped with 200 */
--neutral-800: oklch(88.4% 0.005 284.8);  /* Swapped with 100 */
--neutral-900: oklch(97.1% 0.002 284.5);  /* Swapped with 50 */
```

**Validation:** Run `npm run validate:colors` after adding. Should pass with 0 new failures.

**Gotchas:**
- Dark mode neutrals MUST be inverted (50↔900, 100↔800, etc.)
- OKLCH lightness MUST include `%` symbol (97.1%, not 0.971)
- Cool undertone via hue 284-288° distinguishes from pure grays

---

#### Task 1.2: Add Brand Color Scale (5 variables) **Depends on: [none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/requirements.md` (lines 62-94)
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/gap-analysis.md` (section 1.2)

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/index.css`

Add to `:root` block (after neutral colors):
```css
/* Primary Brand Colors - OKLCH format */
--brand-100: oklch(92% 0.08 125);   /* #e6eed9 - Light green tint */
--brand-300: oklch(85% 0.12 125);   /* #d5e3bf - Soft green */
--brand-500: oklch(74% 0.12 125);   /* #9BBB59 - Brand identity */
--brand-700: oklch(50% 0.10 125);   /* #5a7030 - CTAs (WCAG compliant) */
--brand-800: oklch(35% 0.08 125);   /* #3a4a25 - Hover states */
```

Add to `.dark` block:
```css
/* Adjusted Brand Colors for Dark Mode */
--brand-100: oklch(26.3% 0.048 121.5);  /* Darker */
--brand-300: oklch(45.9% 0.083 121.5);  /* Darker */
--brand-500: oklch(74% 0.12 125);       /* Keep identity color */
--brand-700: oklch(65% 0.12 125);       /* LIGHTER for dark bg */
--brand-800: oklch(70% 0.13 125);       /* Lighter hover state */
```

**Validation:** Brand-700 provides 5.5:1 contrast with white text per requirements.

**Gotchas:**
- Brand-700 is THE primary button color (dark olive green #5a7030)
- Dark mode brand-700 increases from 50% L to 65% L for visibility on dark backgrounds
- Hue 125° = yellowish green (brand identity)

---

#### Task 1.3: Add Accent Colors (2 variables) **Depends on: [none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/requirements.md` (lines 70-98)
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/gap-analysis.md` (section 1.4)

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/index.css`

Add to `:root` block (after brand colors):
```css
/* Accent Colors - OKLCH format */
--accent-purple: oklch(50% 0.25 295);     /* #9333ea */
--accent-teal:   oklch(70% 0.15 180);     /* #14b8a6 */
```

Add to `.dark` block:
```css
/* Adjusted Accents for Dark Mode */
--accent-purple: oklch(72% 0.20 295);
--accent-teal:   oklch(75% 0.10 180);
```

**Validation:** Purple will replace gray for --accent semantic variable.

**Gotchas:**
- Accent-purple replaces neutral gray in navigation/hover states (high visual impact)
- Teal used for chart-3, not primary accent

---

### Phase 2: Semantic Mappings - Update Existing Variables

#### Task 2.1: Update Core Semantic Colors **Depends on: [1.1, 1.2, 1.3]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/requirements.md` (lines 103-145)
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/gap-analysis.md` (section 2.1)
- `/home/krwhynot/Projects/atomic/src/index.css` (lines 53-70)

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/index.css`

**CRITICAL:** Replace these exact lines in `:root` block:

BEFORE (lines 53-70):
```css
--background: oklch(1 0 0);
--foreground: oklch(0.145 0 0);
--card: oklch(1 0 0);
--card-foreground: oklch(0.145 0 0);
--primary: oklch(0.205 0 0);
--primary-foreground: oklch(0.985 0 0);
--secondary: oklch(0.97 0 0);
--secondary-foreground: oklch(0.205 0 0);
--muted: oklch(0.97 0 0);
--muted-foreground: oklch(0.52 0 0);
--accent: oklch(0.97 0 0);
--accent-foreground: oklch(0.205 0 0);
--border: oklch(0.922 0 0);
--input: oklch(0.922 0 0);
--ring: oklch(0.60 0 0);
```

AFTER:
```css
--background: var(--neutral-50);               /* Off-white with cool tint */
--foreground: var(--neutral-700);              /* Dark text (lighter than before) */
--card: var(--neutral-50);                     /* Match background */
--card-foreground: var(--neutral-700);         /* Match foreground */
--primary: var(--brand-700);                   /* 🔥 BRAND GREEN for CTAs */
--primary-foreground: #ffffff;                 /* White text on green */
--brand: var(--brand-500);                     /* NEW: Brand identity color */
--secondary: var(--neutral-100);               /* Subtle gray */
--secondary-foreground: var(--neutral-700);    /* Dark text */
--muted: var(--neutral-200);                   /* Muted backgrounds */
--muted-foreground: var(--neutral-400);        /* Muted text */
--accent: var(--accent-purple);                /* 🔥 VIBRANT PURPLE (was gray) */
--accent-foreground: #ffffff;                  /* White text on purple */
--border: var(--neutral-200);                  /* Darker borders */
--input: var(--neutral-200);                   /* Match borders */
--ring: var(--brand-500);                      /* 🔥 GREEN FOCUS RINGS */
```

Update `.dark` block (lines 164-181):

BEFORE:
```css
--background: oklch(0.145 0 0);
--foreground: oklch(0.985 0 0);
--primary: oklch(0.922 0 0);
--primary-foreground: oklch(0.205 0 0);
--accent: oklch(0.269 0 0);
--accent-foreground: oklch(0.985 0 0);
--ring: oklch(0.556 0 0);
```

AFTER:
```css
--background: var(--neutral-50);               /* Dark background (inverted) */
--foreground: var(--neutral-900);              /* Light text (inverted) */
--card: var(--neutral-50);
--card-foreground: var(--neutral-900);
--primary: var(--brand-700);                   /* Lighter green (65% L) for dark bg */
--primary-foreground: #ffffff;
--brand: var(--brand-500);
--secondary: var(--neutral-100);
--secondary-foreground: var(--neutral-900);
--muted: var(--neutral-200);
--muted-foreground: var(--neutral-600);
--accent: var(--accent-purple);                /* Purple accent maintained */
--accent-foreground: #ffffff;
--border: var(--neutral-200);
--input: var(--neutral-200);
--ring: var(--brand-500);                      /* Brand green focus */
```

**Validation:** After this task, ALL primary buttons will be dark olive green (#5a7030). Run `npm run validate:colors` to confirm WCAG compliance.

**Gotchas:**
- This is the HIGHEST IMPACT change - 75+ button instances affected
- --primary changes from near-black to dark olive green (visual identity shift)
- --accent changes from gray to vibrant purple (navigation highlights affected)
- --ring changes from gray to green (all focus indicators affected)
- Dark mode --primary uses lighter green (65% L vs 50% L)

---

#### Task 2.2: Update Chart Colors **Depends on: [1.1, 1.2, 1.3]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/requirements.md` (lines 148-168)
- `/home/krwhynot/Projects/atomic/src/index.css` (lines 71-75 for :root, 182-186 for .dark)

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/index.css`

Replace in `:root` (lines 71-75):

BEFORE:
```css
--chart-1: oklch(0.646 0.222 41.116);
--chart-2: oklch(0.6 0.118 184.704);
--chart-3: oklch(0.398 0.07 227.392);
--chart-4: oklch(0.828 0.189 84.429);
--chart-5: oklch(0.769 0.188 70.08);
```

AFTER:
```css
/* Chart Colors - Balanced palette */
--chart-1: var(--neutral-600);      /* Neutral gray - most common data */
--chart-2: var(--brand-500);        /* Brand green - "our performance" */
--chart-3: var(--accent-teal);      /* Teal - category 2 */
--chart-4: var(--accent-purple);    /* Purple - category 3 */
--chart-5: var(--warning-default);  /* Amber - category 4 */
```

Replace in `.dark` (lines 182-186):

BEFORE:
```css
--chart-1: oklch(0.488 0.243 264.376);
--chart-2: oklch(0.696 0.17 162.48);
--chart-3: oklch(0.769 0.188 70.08);
--chart-4: oklch(0.627 0.265 303.9);
--chart-5: oklch(0.645 0.246 16.439);
```

AFTER:
```css
--chart-1: var(--neutral-500);      /* Lighter neutral for dark bg */
--chart-2: var(--brand-500);        /* Keep brand green */
--chart-3: var(--accent-teal);      /* Keep teal */
--chart-4: var(--accent-purple);    /* Keep purple */
--chart-5: var(--warning-default);  /* Keep amber */
```

**Validation:** Chart colors should remain distinct and accessible in both themes.

**Gotchas:**
- Chart-1 changes to neutral (was orange/amber)
- Chart-2 now uses brand green for emphasis
- Strategy: Reserve brand green for "our data", use neutral for baseline

---

### Phase 3: Semantic Color Fixes

#### Task 3.1: Fix Warning Color WCAG Compliance **Depends on: [none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/requirements.md` (lines 171-178)
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/gap-analysis.md` (section 6.5)
- `/home/krwhynot/Projects/atomic/src/index.css` (lines 112-120)

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/index.css`

Update in `:root` block (line 114):

BEFORE:
```css
--warning-default: oklch(70% 0.145 85);
```

AFTER:
```css
--warning-default: oklch(62% 0.16 85);   /* Darkened to meet 4.5:1 contrast */
```

Update in `:root` block (line 115):

BEFORE:
```css
--warning-strong: oklch(58% 0.15 85);
```

AFTER:
```css
--warning-strong: oklch(55% 0.17 85);    /* Adjusted accordingly */
```

**Validation:** Warning-default now provides 4.5:1 contrast on white backgrounds (WCAG AA compliant).

**Gotchas:**
- OLD warning-default (70% L) failed WCAG AA for normal text (only 3.2:1)
- NEW warning-default (62% L) darkened by 8% to meet 4.5:1 requirement
- Warning-strong adjusted to maintain visual hierarchy

---

#### Task 3.2: Update Semantic Status Color Chroma **Depends on: [none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/gap-analysis.md` (Appendix A, lines 700-707)
- `/home/krwhynot/Projects/atomic/src/index.css` (lines 102-140)

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/index.css`

Update chroma values for semantic colors to match guide specification:

**Error/Destructive colors:**
```css
/* OLD */
--error-default: oklch(60% 0.145 25);
--error-strong: oklch(50% 0.15 25);

/* NEW */
--error-default: oklch(60% 0.24 25);
--error-strong: oklch(50% 0.25 25);
```

**Info colors:**
```css
/* OLD */
--info-default: oklch(60% 0.145 230);
--info-strong: oklch(50% 0.15 230);

/* NEW */
--info-default: oklch(60% 0.20 230);
--info-strong: oklch(50% 0.22 230);
```

**Validation:** Higher chroma = more vibrant colors while maintaining WCAG compliance.

**Gotchas:**
- Only chroma (C) values change, lightness (L) stays same
- Success colors already match guide (no changes needed)
- Warning colors updated in Task 3.1

---

### Phase 4: Link Styling Enhancement

#### Task 4.1: Add Global Link Styles **Depends on: [2.1]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/requirements.md` (lines 181-208)
- `/home/krwhynot/Projects/atomic/src/index.css` (end of file)

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/index.css`

Add at END of file (after all existing CSS):
```css
/* Link Accessibility - Modern underline styling */
a {
  color: var(--brand-700);              /* Brand green links */
  text-decoration: underline;
  text-decoration-color: var(--brand-700);
  text-decoration-thickness: 1.5px;     /* Subtle but visible */
  text-underline-offset: 3px;           /* Lift from baseline */
  text-decoration-skip-ink: auto;       /* Skip descenders */
  transition: all 150ms ease;
}

a:hover,
a:focus-visible {
  color: var(--brand-500);              /* Lighter green on hover */
  text-decoration-color: var(--brand-500);
  text-decoration-thickness: 2px;       /* Slightly thicker */
}

/* Exception: Button-styled links don't need underlines */
a.btn,
a[role="button"] {
  text-decoration: none;
}
```

**Validation:** Links in body text should have visible 1.5px underlines with 3px offset.

**Gotchas:**
- Replaces default browser blue links with brand green
- `text-decoration-skip-ink: auto` prevents underlines from crossing descenders (g, y, p)
- Button-styled links excluded via `.btn` and `[role="button"]` selectors
- Dark mode automatically inherits --brand-700 (which resolves to lighter green)

---

### Phase 5: Hardcoded Color Violations - Component Fixes

#### Task 5.1: Fix OrganizationType.tsx Hardcoded Colors **Depends on: [2.1]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/requirements.md` (lines 213-217)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/OrganizationType.tsx` (lines 41, 91)

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/organizations/OrganizationType.tsx`

**Line 41:** Replace hardcoded gray with semantic classes:

BEFORE:
```tsx
className={
  priorityColors[record.priority] || "bg-gray-200 text-gray-800"
}
```

AFTER:
```tsx
className={
  priorityColors[record.priority] || "bg-muted text-muted-foreground"
}
```

**Line 91:** Repeat same replacement:

BEFORE:
```tsx
className={`${priorityColors[record.priority] || "bg-gray-200 text-gray-800"} text-xs`}
```

AFTER:
```tsx
className={`${priorityColors[record.priority] || "bg-muted text-muted-foreground"} text-xs`}
```

**Validation:** Priority badges without specific colors now use semantic muted styling.

**Gotchas:**
- `bg-muted` resolves to `--neutral-200` (medium gray background)
- `text-muted-foreground` resolves to `--neutral-400` (readable gray text)
- Maintains 4.5:1 contrast ratio

---

#### Task 5.2: Fix ProductAside.tsx Hardcoded Colors **Depends on: [2.1]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/requirements.md` (lines 219-224)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/products/ProductAside.tsx`

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/products/ProductAside.tsx`

Find and replace ALL instances:

1. **Lines 42, 45:** `bg-gray-500` → `bg-muted`
2. **Line 106:** `text-green-600` → `text-success-default`

Search for these exact patterns:
```tsx
className="bg-gray-500"
```
Replace with:
```tsx
className="bg-muted"
```

Search for:
```tsx
className="text-green-600"
```
Replace with:
```tsx
className="text-success-default"
```

**Validation:** No hardcoded Tailwind color classes should remain.

**Gotchas:**
- Success-default provides proper semantic green for positive indicators
- Bg-muted uses neutral-200 for subtle backgrounds

---

#### Task 5.3: Fix WhatsNew.tsx Hardcoded Colors **Depends on: [2.1]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/requirements.md` (lines 233-240)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/pages/WhatsNew.tsx`

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/pages/WhatsNew.tsx`

Replace these hardcoded classes (exact line numbers from agent findings):

**Line 248:** `bg-green-100 text-green-800` → `bg-success-subtle text-success-default`
**Line 256:** `bg-gray-100 text-gray-800` → `bg-muted text-foreground`
**Line 298:** `text-green-600` → `text-success-default`
**Line 339:** `bg-gray-200` → `bg-muted`
**Line 440:** `text-green-600` → `text-success-default`
**Lines 464, 473, 482:** `hover:bg-gray-50` → `hover:bg-secondary`

**Validation:** Run `grep -r "bg-gray-\|text-gray-\|text-green-" src/atomic-crm/pages/WhatsNew.tsx` should return 0 results.

**Gotchas:**
- `bg-success-subtle` = light green background (90% L)
- `text-success-default` = medium green text (63% L, WCAG compliant)
- `bg-secondary` = neutral-100 for subtle hover states

---

#### Task 5.4: Fix stageConstants.ts Undefined Variable **Depends on: [none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/requirements.md` (lines 243-247)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts` (line 33)

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/stageConstants.ts`

**Line 33:** Replace undefined variable with tag color:

BEFORE:
```typescript
color: "var(--teal)",
```

AFTER:
```typescript
color: "var(--tag-teal-bg)",
```

**Validation:** Variable `--tag-teal-bg` already exists in index.css (line 89), so this fixes an undefined reference.

**Gotchas:**
- Original used `--teal` which doesn't exist
- Tag colors already implemented with proper bg/fg pairs
- No other changes needed to this file (other stage colors already use semantic vars)

---

#### Task 5.5: Investigate Status.tsx for Inline Styles **Depends on: [2.1]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/requirements.md` (lines 226-231)
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/Status.tsx`

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/opportunities/Status.tsx` (IF inline styles found)

**Action:** Read the file and search for `style={{ backgroundColor }}` or similar inline color styles.

**IF FOUND:** Refactor to use semantic className with variant prop:

BEFORE (example):
```tsx
<Badge style={{ backgroundColor: statusColor }}>
```

AFTER:
```tsx
<Badge className={getStatusVariantClass(status)}>
```

Where `getStatusVariantClass` maps status to semantic classes:
```typescript
function getStatusVariantClass(status: string): string {
  const variants = {
    success: "bg-success-default text-white",
    warning: "bg-warning-default text-white",
    error: "bg-error-default text-white",
    info: "bg-info-default text-white",
  };
  return variants[status] || "bg-muted text-foreground";
}
```

**IF NOT FOUND:** No changes needed. Document that agent findings were inconclusive.

**Validation:** No `style=` attributes should contain backgroundColor or color properties.

**Gotchas:**
- Inline styles bypass CSS variable system
- Must refactor to className-based approach for theme support
- If Status.tsx doesn't have inline styles, skip this task

---

### Phase 6: Pre-Migration Preparation

#### Task 6.1: Create Tag Component Storybook Stories **Depends on: [none]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/validation-strategy.md` (section 2.4)
- `/home/krwhynot/Projects/atomic/.storybook/main.ts` (Storybook config)
- `/home/krwhynot/Projects/atomic/src/components/ui/button.stories.tsx` (reference pattern)

**Instructions**

Files to Create:
- `/home/krwhynot/Projects/atomic/src/atomic-crm/tags/TagChip.stories.tsx`
- `/home/krwhynot/Projects/atomic/src/atomic-crm/tags/TagDialog.stories.tsx`

**TagChip.stories.tsx:** Create comprehensive coverage:
- Default story with all 8 tag colors
- Light mode story (all 8 colors displayed)
- Dark mode story (all 8 colors in dark theme)
- Interactive states (hover, focus)
- Edge cases (long text, icons)

**TagDialog.stories.tsx:** Cover color picker UI:
- Default color picker open state
- All 8 color options selectable
- Selected state highlighting
- Light/dark theme variants

**Validation:** Run `npm run storybook` and verify all tag stories render correctly.

**Gotchas:**
- These stories are CRITICAL for visual regression testing
- Must capture baseline snapshots BEFORE migration
- Missing stories = no visual regression detection for tags
- Estimate 48 snapshots for TagChip + 18 for TagDialog = 66 new snapshots

---

#### Task 6.2: Enable Chromatic Workflow **Depends on: [6.1]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/validation-strategy.md` (section 2.1)
- `/home/krwhynot/Projects/atomic/.github/workflows/chromatic.yml.disabled`

**Instructions**

Files to Modify:
- `/home/krwhynot/Projects/atomic/.github/workflows/chromatic.yml.disabled` (rename)

**Step 1:** Rename workflow file:
```bash
mv .github/workflows/chromatic.yml.disabled .github/workflows/chromatic.yml
```

**Step 2:** Add GitHub Secret:
- Navigate to repository Settings → Secrets → Actions
- Add secret: `CHROMATIC_PROJECT_TOKEN` (value from Chromatic account)

**Step 3:** Generate baseline snapshots:
```bash
npm run chromatic
```

**Validation:** Chromatic build should complete successfully, creating baselines for all 23 existing stories + 2 new tag stories.

**Gotchas:**
- MUST generate baselines BEFORE migration to detect color changes
- Workflow runs on PR open/sync, not every push
- Uses `--only-changed` flag to save Chromatic credits
- Design lead must manually review all visual diffs after migration

---

### Phase 7: Testing & Validation

#### Task 7.1: Run Comprehensive Validation Suite **Depends on: [1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 4.1, 5.1, 5.2, 5.3, 5.4, 5.5]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/validation-strategy.md` (section 6)
- `/home/krwhynot/Projects/atomic/scripts/validate-colors.js`
- `/home/krwhynot/Projects/atomic/scripts/migration-validate.sh`

**Instructions**

**NO FILES TO MODIFY** - This is a validation-only task.

**Run these commands in sequence:**

1. **WCAG Compliance Check:**
```bash
npm run validate:colors
```
Expected: Exit code 0, all 34 tests pass

2. **TypeScript Compilation:**
```bash
npx tsc --noEmit
```
Expected: Exit code 0, no errors

3. **ESLint Validation:**
```bash
npm run lint:check
```
Expected: Exit code 0, no violations

4. **Migration-Specific Checks:**
```bash
bash scripts/migration-validate.sh
```
Expected: 0 hardcoded hex colors found

5. **Build Test:**
```bash
npm run build
```
Expected: Build succeeds, no errors

6. **Unit Tests:**
```bash
npm test
```
Expected: All tests pass

**Validation:** All commands must exit with code 0. Any failures block deployment.

**Gotchas:**
- This is the GATE before deploying to production
- Zero-tolerance policy: Fix ALL issues before proceeding
- If any validation fails, rollback changes and debug
- validate-colors.js tests 34 combinations automatically

---

#### Task 7.2: Manual QA Testing **Depends on: [7.1]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/validation-strategy.md` (section 3)
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/requirements.md` (section 4)

**Instructions**

**NO FILES TO MODIFY** - This is a manual testing task.

**Critical User Flows to Test:**

1. **Tag Management Flow:**
   - Navigate to contact/opportunity detail
   - Create tags with all 8 colors
   - Verify colors display correctly
   - Toggle dark mode, verify readability
   - Edit tag colors, verify updates
   - Delete tags, verify no artifacts

2. **Form Validation Flow:**
   - Open create/edit form
   - Trigger validation errors (empty required fields)
   - Verify error messages use red semantic colors
   - Fill correctly, trigger success states
   - Verify success indicators use green
   - Check focus rings on all inputs (should be green)

3. **Navigation Flow:**
   - Click through all main sections
   - Verify sidebar active states (should use green accent)
   - Check hover states (should use purple accent)
   - Verify loading placeholders use neutral grays

4. **Data Visualization Flow:**
   - View dashboard charts
   - Verify chart-1 is neutral gray
   - Verify chart-2 is brand green
   - Check legend mappings
   - Verify stage colors in opportunity pipeline

**Validation Checklist:**
- [ ] All primary buttons are dark olive green (#5a7030)
- [ ] Hover states darken to #3a4a25
- [ ] Focus rings are brand green, not gray
- [ ] Links are underlined with 1.5px thickness
- [ ] All 8 tag colors render correctly in light/dark modes
- [ ] Dark mode buttons are lighter (65% L) than light mode (50% L)
- [ ] No hardcoded gray colors visible

**Gotchas:**
- Test in BOTH light and dark modes for every flow
- Use multiple browsers (Chrome, Firefox, Safari)
- Test on mobile devices (responsive behavior)
- Check accessibility with browser DevTools contrast checker

---

#### Task 7.3: Visual Regression Review **Depends on: [7.1, 6.2]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/validation-strategy.md` (section 2.2)

**Instructions**

**NO FILES TO MODIFY** - This is a review task.

**Step 1:** Trigger Chromatic build:
```bash
npm run chromatic
```

**Step 2:** Review visual diffs in Chromatic UI:
- Navigate to Chromatic project dashboard
- Review all component snapshots with changes
- Expected changes: Gray → green buttons, gray → purple accents
- Approve all INTENTIONAL color changes
- Reject any UNINTENDED layout shifts or color errors

**Step 3:** Verify coverage:
- 23 existing component stories
- 2 new tag component stories
- All 8 tag colors × 2 modes = 16 tag snapshots
- Button variants (6 types × 4 sizes) = 24 snapshots
- Badge variants (4 types) = 4+ snapshots

**Validation:** All visual changes must be explicitly approved by design lead.

**Gotchas:**
- Some diffs are EXPECTED (gray → green is the migration goal)
- Focus on UNINTENDED changes (layout shifts, wrong colors, contrast failures)
- Chromatic requires manual approval for each changed story
- Post-migration, unapproved diffs will auto-fail PRs in strict mode

---

### Phase 8: Deployment & Monitoring

#### Task 8.1: Create Migration Pull Request **Depends on: [7.1, 7.2, 7.3]**

**READ THESE BEFORE TASK**
- `/home/krwhynot/Projects/atomic/.docs/plans/color-system-migration/requirements.md` (section 7)
- `/home/krwhynot/Projects/atomic/CLAUDE.md` (Git commit protocol)

**Instructions**

**NO FILES TO MODIFY** - This is a git operation task.

**Step 1:** Create feature branch:
```bash
git checkout -b feat/color-system-migration
```

**Step 2:** Stage all changes:
```bash
git add src/index.css
git add src/atomic-crm/organizations/OrganizationType.tsx
git add src/atomic-crm/products/ProductAside.tsx
git add src/atomic-crm/pages/WhatsNew.tsx
git add src/atomic-crm/opportunities/stageConstants.ts
git add src/atomic-crm/opportunities/Status.tsx  # if modified
git add src/atomic-crm/tags/TagChip.stories.tsx
git add src/atomic-crm/tags/TagDialog.stories.tsx
git add .github/workflows/chromatic.yml
```

**Step 3:** Create commit:
```bash
git commit -m "$(cat <<'EOF'
feat: migrate to brand-green OKLCH color system

- Add 66 new CSS variables (neutrals, brand, accents)
- Update 28 semantic mappings (primary, accent, ring)
- Fix 5 files with hardcoded color violations
- Add tag component Storybook stories
- Enable Chromatic visual regression workflow
- Darken warning color from 70% to 62% L for WCAG AA

BREAKING CHANGE: All primary buttons change from dark gray to dark olive green (#5a7030). Accent color changes from gray to vibrant purple for navigation highlights. Focus rings change from gray to brand green.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Step 4:** Push branch:
```bash
git push -u origin feat/color-system-migration
```

**Step 5:** Create PR via GitHub CLI:
```bash
gh pr create \
  --title "feat: migrate to brand-green OKLCH color system" \
  --body "$(cat <<'EOF'
## Summary
Migrates Atomic CRM from neutral grayscale to brand-green-centered OKLCH design with 42 colors, maintaining WCAG AA compliance.

### Key Changes
- ✅ 66 new CSS variables added (10 neutrals, 5 brand, 12 semantic, 2 accent)
- ✅ 28 semantic mappings updated (primary, accent, ring, muted, etc.)
- ✅ 5 files with hardcoded violations fixed
- ✅ Warning color darkened for WCAG compliance (70% → 62% L)
- ✅ Tag component stories created (48 snapshots)
- ✅ Chromatic workflow enabled

### Visual Impact
- 🔥 All primary buttons: dark gray → dark olive green (#5a7030)
- 🔥 Accent highlights: gray → vibrant purple (#9333ea)
- 🔥 Focus rings: gray → brand green (#9BBB59)

### Validation
- ✅ `npm run validate:colors` passes (34 WCAG tests)
- ✅ TypeScript compilation successful
- ✅ ESLint validation passed
- ✅ Build successful
- ✅ All unit tests pass

### Chromatic Review
- [ ] Design lead approval required for visual diffs
- Expected changes: ~75 button instances, 8 tag colors, navigation highlights

### Documentation
- Requirements: `.docs/plans/color-system-migration/requirements.md`
- Implementation: `.docs/plans/color-system-migration/parallel-plan.md`
- Color guide: `docs/2025-10/NEW-color-guide.html`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**Validation:** PR should link to migration documentation and Chromatic build.

**Gotchas:**
- Use conventional commit format: `feat:` prefix
- BREAKING CHANGE note required (visual identity shift)
- Design lead MUST review Chromatic diffs before merge
- Squash commit on merge to keep history clean

---

## Advice

### Critical Success Factors

1. **Phase Gate Discipline:**
   - Run `npm run validate:colors` after EVERY phase (1, 2, 3, 4, 5)
   - Exit code 1 = STOP and fix before proceeding
   - Zero-tolerance policy prevents error accumulation

2. **OKLCH Syntax Precision:**
   - Lightness MUST include `%` symbol: `oklch(74% ...)` not `oklch(0.74 ...)`
   - Old format (0-1 decimal) still in current codebase, but guide uses percentage
   - Incorrect syntax = build failure or wrong colors

3. **Dark Mode Inversion Pattern:**
   - Neutrals: Full inversion (50↔900, 100↔800, etc.)
   - Brand colors: Lightness adjustment only (50% → 65% for dark bg)
   - Tag colors: Already correctly inverted in current implementation
   - DO NOT invert hue or chroma, only lightness

4. **WCAG Compliance Non-Negotiables:**
   - Primary button (brand-700 + white text) = 5.5:1 contrast ✅
   - Warning color MUST be darkened (70% → 62% L) to meet 4.5:1 ✅
   - All semantic colors tested by validate-colors.js (34 tests)
   - Focus rings need 3:1 minimum contrast (brand-500 provides this)

5. **Hardcoded Color Hunting:**
   - Use `grep -r "bg-gray-\|text-gray-\|text-green-\|border-blue-" src/` to find violations
   - Agent found MORE instances than requirements doc specified (ProductAside line 106, WhatsNew lines 248, 298, 440)
   - Run `bash scripts/migration-validate.sh` to catch hardcoded hex colors
   - Exception: Storybook story files can have hardcoded colors for demos

6. **Chromatic Baseline Timing:**
   - Generate baselines BEFORE any migration code changes
   - Baselines must capture current gray system for comparison
   - After migration, approve all INTENTIONAL changes (gray→green, gray→purple)
   - Reject any UNINTENDED layout shifts or broken components

7. **CSS Variable Dependency Order:**
   - Level 1 (foundation): Neutrals, brand, semantic status, accents
   - Level 2 (mappings): Background, foreground, primary, accent, ring
   - Level 3 (charts): Chart-1 through chart-5
   - Add foundation variables BEFORE updating semantic mappings
   - Violating order = undefined variable references

8. **Tag Color System Exception:**
   - Tag colors already correctly implemented (16 variables × 2 modes)
   - NO changes needed to tag CSS variables
   - Only fix: stageConstants.ts line 33 (var(--teal) → var(--tag-teal-bg))
   - Tag colors use custom CSS classes (`.tag-warm`), NOT Tailwind utilities

9. **High Impact Change Awareness:**
   - --primary: 75+ button instances affected (most visible change)
   - --accent: All navigation hover states affected (purple surprise for users)
   - --ring: All focus indicators affected (accessibility improvement)
   - --muted: Backgrounds will be ~12% darker (subtle but noticeable)
   - Communicate these changes to stakeholders BEFORE merging

10. **Rollback Preparation:**
    - Git tag before migration: `v-pre-color-migration`
    - Fast rollback via `git revert <merge-commit>` (< 10 minutes)
    - No database changes means instant rollback capability
    - Keep feature branch until 7 days post-deployment for safety

### Common Pitfalls to Avoid

❌ **DON'T** use decimal lightness (0.74) - use percentage (74%)
❌ **DON'T** add variables in wrong order - foundation before mappings
❌ **DON'T** forget dark mode equivalents - every :root variable needs .dark
❌ **DON'T** skip validation between phases - catch errors early
❌ **DON'T** generate Chromatic baselines after migration - no comparison
❌ **DON'T** hardcode new colors in components - use semantic variables only
❌ **DON'T** change tag color CSS variables - already correct
❌ **DON'T** merge PR without design lead Chromatic approval

✅ **DO** run validate-colors after every phase
✅ **DO** test both light and dark modes for every change
✅ **DO** use semantic variables (--primary, --muted) not neutrals (--neutral-200)
✅ **DO** create tag stories before migration (visual regression critical)
✅ **DO** communicate visual identity shift to stakeholders
✅ **DO** maintain Engineering Constitution Rule #7 (semantic colors only)
✅ **DO** verify all 5 hardcoded violation files (agent found extras)
✅ **DO** keep rollback plan ready (git tag + revert procedure)

### Time Estimates

- Phase 1 (Foundation): 30-45 min (copy-paste CSS variables)
- Phase 2 (Mappings): 45-60 min (careful replacement of existing values)
- Phase 3 (Semantic Fixes): 20-30 min (chroma updates + warning color)
- Phase 4 (Link Styles): 15-20 min (add global link CSS)
- Phase 5 (Component Fixes): 45-60 min (5 files, search/replace hardcoded colors)
- Phase 6 (Preparation): 2-3 hours (create tag stories + Chromatic setup)
- Phase 7 (Validation): 1-2 hours (automated + manual testing)
- Phase 8 (Deployment): 30-45 min (PR creation + review)

**Total:** 6-9 hours (aligns with requirements estimate of 5-8 hours)

### Parallel Execution Strategy

**Can Execute in Parallel:**
- Tasks 1.1, 1.2, 1.3 (foundation variables independent)
- Tasks 3.1, 3.2, 4.1 (semantic fixes don't depend on mappings)
- Tasks 5.1, 5.2, 5.3, 5.4 (component fixes independent)
- Tasks 6.1, 6.2 (story creation + workflow setup)

**Must Execute Sequentially:**
- Phase 1 → Phase 2 (foundation before mappings)
- Phase 5 → Phase 7 (fixes before validation)
- Phase 7 → Phase 8 (validation before deployment)

**Optimal Parallelization:**
1. Start Phase 1 (all 3 tasks in parallel)
2. After Phase 1 completes → Phase 2 (both tasks in parallel)
3. After Phase 2 completes → Phases 3, 4, 5, 6 (all in parallel)
4. After all complete → Phase 7 (sequential validation)
5. After Phase 7 → Phase 8 (deployment)

**Wall-clock time with parallelization:** 4-6 hours (vs. 6-9 sequential)

---

**End of Parallel Implementation Plan**
