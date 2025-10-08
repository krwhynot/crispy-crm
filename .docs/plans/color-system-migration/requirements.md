# Color System Migration to Brand-Green OKLCH
**Feature Name:** Brand-Green Color System Migration
**Status:** Requirements Complete
**Date:** 2025-10-07
**Estimated Effort:** 5-8 hours (single atomic deployment)

---

## 1. Feature Summary

Migrate the entire Atomic CRM color system from neutral grayscale to the brand-green-centered OKLCH design specified in `docs/2025-10/NEW-color-guide.html`. This involves adding 29 new color variables (neutrals, brand scale, accents), updating 13 existing variables (primary, muted, accent, etc.), and fixing 5 files with hardcoded color violations. All default buttons will change from dark gray to dark olive green (#5a7030), introducing strong brand identity while maintaining WCAG AA accessibility compliance.

---

## 2. User Stories

**As a CRM user,**
I want the interface to reflect Atomic's brand identity with consistent green accents,
So that the application feels cohesive, professional, and uniquely "Atomic."

**As a CRM administrator,**
I want primary actions (buttons, CTAs) to be visually distinct with brand green,
So that important actions are immediately recognizable and encourage engagement.

**As a user with low vision or color blindness,**
I want all colors to meet WCAG AA contrast standards,
So that I can read text, distinguish interactive elements, and use the CRM effectively.

**As a developer,**
I want semantic CSS variables (--primary, --accent, --brand) clearly defined,
So that I can build new features without hardcoding colors or guessing values.

**As a data analyst using charts,**
I want data visualizations to use balanced, perceptually distinct colors,
So that I can quickly interpret pipeline trends and opportunity metrics without confusion.

---

## 3. Technical Approach

### 3.1 Frontend Changes

#### **File: `src/index.css`**

**Phase 1: Add Missing Variables (29 new variables)**

Add to `:root` block (light mode):

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

/* Primary Brand Colors - OKLCH format */
--brand-100: oklch(92% 0.08 125);   /* #e6eed9 - Light green tint */
--brand-300: oklch(85% 0.12 125);   /* #d5e3bf - Soft green */
--brand-500: oklch(74% 0.12 125);   /* #9BBB59 - Brand identity */
--brand-700: oklch(50% 0.10 125);   /* #5a7030 - CTAs (WCAG compliant) */
--brand-800: oklch(35% 0.08 125);   /* #3a4a25 - Hover states */

/* Accent Colors - OKLCH format */
--accent-purple: oklch(50% 0.25 295);     /* #9333ea */
--accent-teal:   oklch(70% 0.15 180);     /* #14b8a6 */
```

Add corresponding dark mode values to `.dark` block:

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

/* Adjusted Brand Colors for Dark Mode */
--brand-100: oklch(26.3% 0.048 121.5);  /* Darker */
--brand-300: oklch(45.9% 0.083 121.5);  /* Darker */
--brand-500: var(--brand-500);          /* Keep identity color */
--brand-700: oklch(65% 0.12 125);       /* LIGHTER for dark bg - adjusted L from 50% to 65% */
--brand-800: oklch(70% 0.13 125);       /* Lighter hover state */

/* Adjusted Accents for Dark Mode */
--accent-purple: oklch(72% 0.20 295);
--accent-teal:   oklch(75% 0.10 180);
```

**Phase 2: Update Semantic Mappings (13 variables)**

Replace in `:root` (light mode):

```css
/* OLD VALUES (neutral grayscale) */
--background: oklch(1 0 0);                    /* Pure white */
--foreground: oklch(0.145 0 0);                /* Near black */
--primary: oklch(0.205 0 0);                   /* Dark gray - CHANGE THIS */
--accent: oklch(0.97 0 0);                     /* Light gray - CHANGE THIS */
--ring: oklch(0.60 0 0);                       /* Gray ring - CHANGE THIS */
--muted: oklch(0.97 0 0);                      /* Light gray */
--secondary: oklch(0.97 0 0);                  /* Light gray */
--border: oklch(0.922 0 0);                    /* Light gray */

/* NEW VALUES (brand-green system) */
--background: var(--neutral-50);               /* Off-white with cool tint */
--foreground: var(--neutral-700);              /* Dark text (lighter than before) */
--card: var(--neutral-50);                     /* Match background */
--card-foreground: var(--neutral-700);         /* Match foreground */
--primary: var(--brand-700);                   /* 🔥 BRAND GREEN for CTAs */
--primary-foreground: #ffffff;                 /* White text on green */
--brand: var(--brand-500);                     /* Brand identity color */
--secondary: var(--neutral-100);               /* Subtle gray */
--secondary-foreground: var(--neutral-700);    /* Dark text */
--muted: var(--neutral-200);                   /* Muted backgrounds */
--muted-foreground: var(--neutral-400);        /* Muted text */
--accent: var(--accent-purple);                /* 🔥 VIBRANT PURPLE (was gray) */
--accent-foreground: #ffffff;                  /* White text on purple */
--destructive: var(--error-default);           /* Keep existing */
--destructive-foreground: #ffffff;
--border: var(--neutral-200);                  /* Darker borders */
--input: var(--neutral-200);                   /* Match borders */
--ring: var(--brand-500);                      /* 🔥 GREEN FOCUS RINGS */
```

Replace in `.dark` block:

```css
--background: var(--neutral-50);               /* Dark background (inverted) */
--foreground: var(--neutral-900);              /* Light text (inverted) */
--primary: var(--brand-700);                   /* Lighter green (65% L) for dark bg */
--primary-hover: var(--brand-500);             /* Even lighter on hover */
--accent: var(--accent-purple);                /* Purple accent maintained */
--ring: var(--brand-500);                      /* Brand green focus */
```

**Phase 3: Update Chart Colors**

**Strategy:** Reserve brand green for emphasis, use neutral for baseline data.

```css
:root {
  /* Chart Colors - Balanced palette */
  --chart-1: var(--neutral-600);      /* Neutral gray - most common data */
  --chart-2: var(--brand-500);        /* Brand green - "our performance" */
  --chart-3: var(--accent-teal);      /* Teal - category 2 */
  --chart-4: var(--accent-purple);    /* Purple - category 3 */
  --chart-5: var(--warning-default);  /* Amber - category 4 */
}

.dark {
  --chart-1: var(--neutral-500);      /* Lighter neutral for dark bg */
  --chart-2: var(--brand-500);        /* Keep brand green */
  --chart-3: var(--accent-teal);      /* Keep teal */
  --chart-4: var(--accent-purple);    /* Keep purple */
  --chart-5: var(--warning-default);  /* Keep amber */
}
```

**Phase 4: Fix Warning Color WCAG Issue**

```css
:root {
  /* OLD: --warning-default: oklch(70% 0.145 85); - FAILS 4.5:1 */
  --warning-default: oklch(62% 0.16 85);   /* Darkened to meet 4.5:1 contrast */
  --warning-strong: oklch(55% 0.17 85);    /* Adjusted accordingly */
}
```

**Phase 5: Add Link Underline Styling**

Add new global styles at end of `src/index.css`:

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

#### **Files to Fix: Hardcoded Color Violations**

**File:** `src/atomic-crm/organizations/OrganizationType.tsx` (Lines 41, 91)
```tsx
// BEFORE: <Badge className="bg-gray-200 text-gray-800">
// AFTER:
<Badge className="bg-muted text-muted-foreground">
```

**File:** `src/atomic-crm/products/ProductAside.tsx` (Lines 42, 45)
```tsx
// BEFORE: className="bg-gray-500"
// AFTER:
className="bg-muted"
```

**File:** `src/atomic-crm/opportunities/Status.tsx` (Line 20)
```tsx
// BEFORE: style={{ backgroundColor: statusColor }}
// AFTER: Use semantic CSS classes (--success-default, --warning-default, etc.)
// Refactor to use className with variant prop
```

**File:** `src/atomic-crm/root/WhatsNew.tsx` (Lines 256, 339, 464, 473, 482)
```tsx
// BEFORE: Multiple instances of "text-gray-500", "text-gray-600", "bg-gray-100"
// AFTER: Replace with semantic variables
// text-gray-500 → text-muted-foreground
// text-gray-600 → text-foreground
// bg-gray-100 → bg-muted
```

**File:** `src/atomic-crm/opportunities/stageConstants.ts` (Line 33)
```tsx
// BEFORE: var(--teal) - UNDEFINED VARIABLE
// AFTER:
color: 'var(--tag-teal-bg)',
```

### 3.2 Validation & Testing

#### **Phase Gate Validation (MANDATORY)**

After each phase, run validation before proceeding:

```bash
# WCAG Compliance Check (zero-tolerance gate)
npm run validate:colors

# If failures occur, MUST fix before advancing
# Exit code 1 = block PR, 0 = pass
```

#### **Visual Regression Testing (Manual Review Required)**

**PREREQUISITE:** Create missing Storybook stories BEFORE migration:

1. **Create `src/atomic-crm/tags/TagChip.stories.tsx`:**
   - All 8 tag colors in light mode
   - All 8 tag colors in dark mode
   - Capture baseline snapshots

2. **Create `src/atomic-crm/tags/TagDialog.stories.tsx`:**
   - Tag color picker UI
   - Selection states

3. **Enable Chromatic:**
   ```bash
   # Rename workflow file
   mv .github/workflows/chromatic.yml.disabled .github/workflows/chromatic.yml

   # Set secret: CHROMATIC_PROJECT_TOKEN
   # Generate baseline snapshots
   npm run chromatic
   ```

4. **Manual Review Process:**
   - Every PR runs Chromatic
   - All visual diffs MUST be reviewed by design lead
   - Approve expected color changes
   - Block unintended regressions

### 3.3 Database Changes

**None required.** This is a pure CSS/styling migration with no schema changes.

### 3.4 API Endpoints & Zod Schemas

**None required.** No backend logic changes.

### 3.5 Data Flow

```
src/index.css (CSS Variables)
    ↓
Tailwind CSS (@theme inline)
    ↓
shadcn/ui Components (Button, Badge, Alert, etc.)
    ↓
React Admin Components (List, Show, Edit, Create)
    ↓
Feature Modules (opportunities, contacts, tasks, etc.)
    ↓
Rendered UI (75+ button instances, 8 tag colors, charts)
```

**Color Propagation:**
- All components consume CSS variables via Tailwind utilities
- No hardcoded hex values allowed (Constitution Rule #7)
- Dark mode toggled via `.dark` class on root element

---

## 4. UI/UX Flow

### 4.1 User Experience Changes

**Step 1: Initial Load**
- User opens CRM → sees brand green primary buttons (was dark gray)
- Sidebar navigation → neutral gray with green active state (was all gray)
- Charts/graphs → neutral baseline, green for "our data" (was generic colors)

**Step 2: Interaction**
- User hovers button → darker green (`--brand-800`, was darker gray)
- User focuses input → green ring appears (`--ring`, was gray ring)
- User clicks link → underlined green text (was blue/default browser style)

**Step 3: Dark Mode Toggle**
- User switches theme → colors invert smoothly
- Buttons become lighter green (65% L vs. 50% L in light mode)
- Neutrals flip (900↔50, 800↔100, etc.)
- Brand green maintains hue/chroma, only lightness changes

**Step 4: Data Visualization**
- User views pipeline chart → neutral gray for total opportunities
- User sees "Won Opportunities" → highlighted in brand green
- User compares 5 categories → distinct colors (gray, green, teal, purple, amber)

### 4.2 Critical User Flows to Test Manually

1. **Tag Management**
   - Create tag → select color from picker (8 colors)
   - Verify contrast in light/dark modes
   - Check tag chips in lists

2. **Form Validation**
   - Submit form with errors → red error messages visible
   - Success state → green success banner visible
   - Warning state → amber warning text visible

3. **Navigation**
   - Click sidebar items → green highlight appears on active item
   - Hover nav items → subtle hover state (neutral gray tint)

4. **Charts/Dashboards**
   - View opportunity pipeline → colors distinct and balanced
   - Revenue over time → green line for "our revenue"

---

## 5. Success Metrics

### 5.1 Automated Validation

✅ **WCAG AA Compliance:** All colors pass `npm run validate:colors`
- Text contrast: ≥4.5:1
- UI element contrast: ≥3:1
- No failures in CI/CD pipeline

✅ **TypeScript Compilation:** No type errors after color variable updates

✅ **Build Success:** `npm run build` completes without errors

### 5.2 Visual Regression

✅ **Chromatic Baseline:** All component stories have approved snapshots
- 23+ existing UI component stories
- 3+ new tag component stories
- All visual diffs manually reviewed and approved

### 5.3 Manual QA Checklist

- [ ] All default buttons are dark olive green (#5a7030)
- [ ] Hover states darken to #3a4a25
- [ ] Focus rings are brand green, not gray
- [ ] Sidebar active state uses green highlight
- [ ] Links are underlined with 1.5px thickness
- [ ] Charts use neutral gray as Chart 1, green as Chart 2
- [ ] All 8 tag colors render correctly in light/dark modes
- [ ] Dark mode buttons are lighter (65% L) than light mode (50% L)
- [ ] No hardcoded gray colors remain in the 5 violation files

### 5.4 User Acceptance

- CRM feels "on-brand" with consistent green identity
- Professional tone maintained (not too casual/playful)
- Users can easily identify primary actions (green buttons)
- No accessibility complaints or contrast issues reported

---

## 6. Out of Scope

### 6.1 Explicitly NOT Included

❌ **Feature Flagging:** No environment variable toggle for old/new colors (breaking changes accepted)

❌ **Backward Compatibility:** No support for legacy color variables or gradual rollout

❌ **Component Variant Expansion:** Not adding new button variants (e.g., `variant="brand"` vs. `variant="neutral"`)
   - Rationale: `--primary` IS the brand color now, no need for separate variants

❌ **Tailwind Config Regeneration:** Not updating `tailwind.config.js` (Tailwind v4 uses CSS variables directly)

❌ **Logo/Asset Updates:** Not changing company logo or image assets to match new green palette

❌ **Custom Chart Library Configuration:** Not modifying Recharts/Chart.js configs beyond CSS variables

❌ **Third-Party Component Overrides:** Not styling external libraries (React Admin, MUI) beyond what CSS variables affect

❌ **Extended Semantic Variants Removal:** Keeping existing `--success-bg`, `--warning-hover`, etc. (not in guide but useful)
   - Guide only specifies subtle/default/strong, but we have 8 variants per semantic color
   - Decision: Keep extended variants for now, remove in future cleanup if unused

### 6.2 Future Enhancements (Separate PRs)

🔮 **Animation Transitions:** Add `transition: background 150ms ease` to buttons for smoother color changes

🔮 **High Contrast Mode:** Add explicit high-contrast theme for accessibility

🔮 **Color Palette Documentation:** Update Storybook docs with color usage guidelines

🔮 **Design Tokens Export:** Generate JSON/Figma tokens from CSS variables

---

## 7. Rollback Plan

### 7.1 Git Revert (Primary Strategy)

**Timeline:** < 10 minutes

```bash
# If merged to main and issues found:
git revert <commit-hash> --no-edit
git push origin main
npm run build && npm run prod:deploy
```

**Triggers:**
- WCAG validation failures discovered post-deploy
- > 20% of UI appears broken or unintended
- Critical user flows (login, opportunity creation) unusable

### 7.2 Partial Rollback (Component-Specific)

**Timeline:** 30-60 minutes

If only specific components break (e.g., charts, tags):

```bash
# Revert specific file
git checkout <previous-commit> -- src/index.css
# Keep hardcoded color fixes
# Re-deploy
```

### 7.3 No Rollback (Fix Forward)

For minor issues (e.g., one button has wrong color):
- Create hotfix PR
- Test with `npm run validate:colors`
- Deploy immediately

---

## 8. Implementation Checklist

### Phase 0: Pre-Migration Setup (1-2 hours)

- [ ] Create tag component Storybook stories
- [ ] Enable Chromatic workflow
- [ ] Capture baseline snapshots for all components
- [ ] Run `npm run validate:colors` on current system (establish baseline)
- [ ] Document current button/link/chart appearances (screenshots)

### Phase 1: Add New Variables (30 min)

- [ ] Add 10 neutral colors to `:root` and `.dark`
- [ ] Add 5 brand colors to `:root` and `.dark`
- [ ] Add 2 accent colors to `:root` and `.dark`
- [ ] Run `npm run validate:colors` → PASS

### Phase 2: Update Semantic Mappings (1 hour)

- [ ] Update `--primary`, `--accent`, `--ring` in `:root`
- [ ] Update `--background`, `--foreground`, `--muted`, `--border`
- [ ] Update dark mode equivalents in `.dark`
- [ ] Run `npm run validate:colors` → PASS
- [ ] Visual check: buttons should be green now

### Phase 3: Update Chart Colors (15 min)

- [ ] Change `--chart-1` to `var(--neutral-600)`
- [ ] Change `--chart-2` to `var(--brand-500)`
- [ ] Update remaining chart colors
- [ ] Run `npm run validate:colors` → PASS

### Phase 4: Fix Warning Color (15 min)

- [ ] Darken `--warning-default` from 70% L to 62% L
- [ ] Test against white background for 4.5:1 contrast
- [ ] Run `npm run validate:colors` → PASS

### Phase 5: Add Link Styling (30 min)

- [ ] Add `a {}` global styles to `src/index.css`
- [ ] Test link appearance in body text
- [ ] Test link hover/focus states
- [ ] Verify `a.btn` exception works (buttons not underlined)

### Phase 6: Fix Hardcoded Violations (1 hour)

- [ ] Fix `OrganizationType.tsx` (2 instances)
- [ ] Fix `ProductAside.tsx` (2 instances)
- [ ] Refactor `Status.tsx` (inline styles → classes)
- [ ] Fix `WhatsNew.tsx` (5 instances)
- [ ] Fix `stageConstants.ts` (1 instance)
- [ ] Run `npm run lint` → PASS

### Phase 7: Testing & Validation (2-3 hours)

- [ ] Run `npm run validate:colors` → PASS (final check)
- [ ] Run `npm test` → PASS
- [ ] Run `npm run build` → SUCCESS
- [ ] Run Chromatic → Manual review all diffs
- [ ] Manual QA: Test 4 critical flows (tags, forms, nav, charts)
- [ ] Dark mode toggle test → colors invert correctly
- [ ] Screenshot comparison vs. baseline docs

### Phase 8: Deployment (30 min)

- [ ] Create PR with title: `feat: migrate to brand-green OKLCH color system`
- [ ] Link to this requirements doc in PR description
- [ ] Request design lead approval for Chromatic diffs
- [ ] Merge to main (squash commit)
- [ ] Deploy to production: `npm run prod:deploy`
- [ ] Monitor for 24 hours, watch for user feedback

---

## 9. Open Questions & Decisions

### Resolved ✅

1. **Button color:** Brand 700 (#5a7030) - WCAG compliant ✅
2. **Dark mode buttons:** Increase OKLCH L from 50% → 65% ✅
3. **Chart palette:** Neutral primary, brand green accent ✅
4. **Sidebar:** Neutral with green accents (Option B) ✅
5. **Links:** Keep underlines with modern CSS ✅
6. **Warning color:** Darken to meet 4.5:1 contrast ✅
7. **Validation:** Zero-tolerance WCAG + manual visual review ✅
8. **Deployment:** Single atomic update (Option A) ✅

### Pending ❓

None - all questions resolved via zen consultation and industry research.

---

## 10. References

- **Color Guide:** `/home/krwhynot/Projects/atomic/docs/2025-10/NEW-color-guide.html`
- **Research Docs:**
  - `.docs/plans/color-system-migration/current-state-analysis.md`
  - `.docs/plans/color-system-migration/gap-analysis.md`
  - `.docs/plans/color-system-migration/validation-strategy.md`
- **Engineering Constitution:** `CLAUDE.md` (Rule #7: Semantic colors only)
- **WCAG Standards:** WCAG 2.1 AA (4.5:1 text, 3:1 UI)
- **Industry Research:**
  - Salesforce Lightning: Neutral gray sidebars
  - Microsoft Fluent: Neutral nav, semantic accents
  - SAP Fiori: Semantic colors for actions only
  - Atlassian: N500 gray nav, automatic legibility

---

**End of Requirements Document**
