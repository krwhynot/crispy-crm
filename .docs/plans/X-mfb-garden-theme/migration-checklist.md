# MFB "Garden to Table" Theme Migration Checklist

**Project**: Atomic CRM Color System Migration
**Branch**: `feature/brand-green-color-migration`
**Timeline**: 5-7 days (26-38 hours)
**Target**: Replace brand-green system with MFB warm earth-tone theme

---

## Pre-Flight Checks

- [ ] Confirm on correct branch: `git branch --show-current` should show `feature/brand-green-color-migration`
- [ ] Pull latest changes: `git pull origin feature/brand-green-color-migration`
- [ ] Install dependencies: `npm install`
- [ ] Verify local dev server works: `npm run dev`
- [ ] Verify Supabase connection: `npm run supabase:local:status`
- [ ] Create backup branch: `git checkout -b backup/pre-mfb-migration`
- [ ] Return to work branch: `git checkout feature/brand-green-color-migration`

---

## Phase 1: Core Color System (4-6 hours)

### 1.1 Update Root CSS Variables (src/index.css)

**Target Section**: Lines 44-170 (current brand-green system)

#### A. Replace Brand Colors
- [ ] **Line 60-66**: Replace brand-green with MFB lime green
  ```css
  /* OLD */
  --brand-500: oklch(74% 0.12 125);
  --brand-700: oklch(50% 0.10 125);

  /* NEW */
  --brand-700: oklch(56% 0.125 125);  /* Darkened for WCAG AA */
  --brand-600: oklch(64% 0.128 125);
  --brand-500: oklch(72% 0.132 125);  /* #7CB342 converted */
  --brand-400: oklch(80% 0.120 125);
  --brand-300: oklch(88% 0.100 125);
  ```

#### B. Replace Accent Colors
- [ ] **Add clay/terracotta accent** (after brand colors)
  ```css
  --accent-clay-700: oklch(52% 0.120 76);
  --accent-clay-600: oklch(58% 0.115 76);
  --accent-clay-500: oklch(63% 0.110 76);  /* #EA580C converted */
  --accent-clay-400: oklch(72% 0.095 76);
  --accent-clay-300: oklch(82% 0.075 76);
  ```

#### C. Replace Background/Foreground
- [ ] **Line 75**: Change background from cool white to warm cream
  ```css
  /* OLD */
  --background: var(--neutral-50);  /* oklch(97.1% 0.002 284.5) */

  /* NEW */
  --background: oklch(99% 0.015 85);  /* #FEFEF9 warm cream */
  ```

- [ ] **Line 76**: Adjust foreground for warm background
  ```css
  /* OLD */
  --foreground: var(--neutral-950);

  /* NEW */
  --foreground: oklch(20% 0.012 85);  /* Slightly warmer dark */
  ```

#### D. Replace Semantic Colors
- [ ] **Success** (keep green but adjust for warm background)
  ```css
  --success: oklch(56% 0.125 145);  /* Success green, different from brand */
  --success-foreground: oklch(99% 0.015 85);
  --success-subtle: oklch(92% 0.08 145);
  ```

- [ ] **Warning** (adjust for AA compliance)
  ```css
  --warning: oklch(68% 0.140 85);  /* Darker golden-amber */
  --warning-foreground: oklch(20% 0.012 85);
  --warning-subtle: oklch(94% 0.055 85);
  ```

- [ ] **Info** (shift from blue to sage-teal)
  ```css
  --info: oklch(58% 0.065 180);  /* Sage-teal */
  --info-foreground: oklch(99% 0.015 85);
  --info-subtle: oklch(95% 0.035 180);
  ```

#### E. Add Sage Tint Utility
- [ ] **Add after semantic colors**
  ```css
  --sage-tint: oklch(97% 0.025 145);  /* #F0FDF4 converted */
  ```

#### F. Update Neutral Scale (Shift Warmer)
- [ ] **Lines 44-58**: Replace cool gray (hue 284-288°) with warm gray (hue 85°)
  ```css
  --neutral-50: oklch(97.8% 0.008 85);
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

### 1.2 Validation
- [ ] Run dev server: `npm run dev`
- [ ] Visual check: All pages load without color errors
- [ ] Console check: No CSS parsing errors
- [ ] Contrast check: Run `npm run validate:colors` (if available)
- [ ] Screenshot: Login page, Dashboard, Contacts list

### 1.3 Commit
- [ ] Stage changes: `git add src/index.css`
- [ ] Commit: `git commit -m "feat(theme): implement MFB core color system with OKLCH"`
- [ ] Note affected files: `src/index.css` (1 file)

---

## Phase 2: Typography (2-3 hours)

### 2.1 Add Nunito Font

#### A. Update index.html
- [ ] **File**: `index.html` (root)
- [ ] Add Google Fonts link in `<head>`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&display=swap" rel="stylesheet">
  ```

#### B. Update src/index.css
- [ ] **Line ~15-20**: Replace font family declarations
  ```css
  /* OLD */
  --font-family-primary: Inter, ui-sans-serif, system-ui, ...;

  /* NEW */
  --font-family-primary: 'Nunito', 'Inter', ui-sans-serif, system-ui, ...;
  ```

#### C. Update tailwind.config.ts
- [ ] **File**: `tailwind.config.ts`
- [ ] Find `fontFamily` section (likely in `theme.extend`)
- [ ] Update to include Nunito:
  ```typescript
  fontFamily: {
    sans: ['Nunito', 'Inter', ...defaultTheme.fontFamily.sans],
  }
  ```

### 2.2 Validation
- [ ] Verify font loads in DevTools Network tab
- [ ] Check body text on Dashboard uses Nunito
- [ ] Verify font fallback works (disable Google Fonts in DevTools)
- [ ] Lighthouse check: Ensure "font-display: swap" is set

### 2.3 Commit
- [ ] Stage: `git add index.html src/index.css tailwind.config.ts`
- [ ] Commit: `git commit -m "feat(theme): add Nunito font family from Google Fonts"`
- [ ] Note: 3 files affected

---

## Phase 3: Component Patterns (3-4 hours)

### 3.1 Update Button Styles

#### A. Locate Button Component
- [ ] **File**: `src/components/ui/button.tsx`
- [ ] Note current rounded class: `rounded-md` or `rounded-lg`

#### B. Increase Corner Radius
- [ ] Find `buttonVariants` cva definition
- [ ] Change base rounded from `rounded-md` (6px) to `rounded-lg` (8px)
- [ ] Update all button variants if they override rounding

#### C. Update Hover Effects
- [ ] Locate hover state transitions
- [ ] Ensure smooth transition: `transition-all duration-200 ease-in-out`
- [ ] Verify hover scale: `hover:scale-[1.02]` for primary buttons

### 3.2 Update Card Styles

#### A. Locate Card Component
- [ ] **File**: `src/components/ui/card.tsx`

#### B. Add Subtle Shadow
- [ ] Find Card root component
- [ ] Replace shadow class:
  ```tsx
  /* OLD */
  className="rounded-lg border bg-card text-card-foreground shadow-sm"

  /* NEW */
  className="rounded-xl border bg-card text-card-foreground shadow-md hover:shadow-lg transition-shadow duration-200"
  ```

### 3.3 Update Form Input Styles

#### A. Locate Input Component
- [ ] **File**: `src/components/ui/input.tsx`

#### B. Increase Corner Radius
- [ ] Change `rounded-md` to `rounded-lg`
- [ ] Verify focus ring uses `--brand-500` color

### 3.4 Update Dialog/Modal Styles

#### A. Locate Dialog Component
- [ ] **File**: `src/components/ui/dialog.tsx`

#### B. Update Corner Radius
- [ ] Change DialogContent `rounded-lg` to `rounded-xl`

### 3.5 Validation
- [ ] Visual regression test: Compare screenshots before/after
- [ ] Check hover states on all button variants
- [ ] Verify card shadows render correctly
- [ ] Test form inputs on Create Contact page
- [ ] Test dialog on any modal (e.g., Delete confirmation)

### 3.6 Commit
- [ ] Stage: `git add src/components/ui/button.tsx src/components/ui/card.tsx src/components/ui/input.tsx src/components/ui/dialog.tsx`
- [ ] Commit: `git commit -m "feat(theme): update component patterns with rounded corners and shadows"`
- [ ] Note: 4+ files affected

---

## Phase 4: Charts & Data Visualization (4-5 hours)

### 4.1 Update Chart Color Tokens

#### A. Update src/index.css
- [ ] **Add after semantic colors** (around line 100)
  ```css
  /* Chart System: Earth-Tone Palette */

  /* Chart 1: Warm Tan/Soil (Baseline/Benchmark) */
  --chart-1-fill: #8B6E44;
  --chart-1-stroke: #5D4A2F;  /* Darker for AA */
  --chart-1-label: #5D4A2F;

  /* Chart 2: MFB Lime Green (Our Data/Primary) */
  --chart-2-fill: #7CB342;
  --chart-2-stroke: #2F6A1F;  /* Darker for AA */
  --chart-2-label: #2F6A1F;

  /* Chart 3: Terracotta/Clay (Revenue/High Priority) */
  --chart-3-fill: #C35A2E;
  --chart-3-stroke: #8B3A1F;
  --chart-3-label: #8B3A1F;

  /* Chart 4: Sage/Olive (Secondary/Neutral) */
  --chart-4-fill: #718B3A;
  --chart-4-stroke: #4A5E25;
  --chart-4-label: #4A5E25;

  /* Chart 5: Golden Amber (Warning/Attention) */
  --chart-5-fill: #B77700;
  --chart-5-stroke: #7A5000;
  --chart-5-label: #7A5000;

  /* Chart 6: Sage-Teal (Cool Counterpoint) */
  --chart-6-fill: #3F7F72;
  --chart-6-stroke: #2A544B;
  --chart-6-label: #2A544B;

  /* Chart 7: Eggplant (Deep Neutral/Inactive) */
  --chart-7-fill: #6B4B6B;
  --chart-7-stroke: #4A3447;
  --chart-7-label: #4A3447;

  /* Chart 8: Mushroom Gray (Fallback/Misc) */
  --chart-8-fill: #6E6A5E;
  --chart-8-stroke: #4A473F;
  --chart-8-label: #4A473F;
  ```

### 4.2 Update Chart Components

#### A. Locate Dashboard Charts
- [ ] **Search**: `grep -r "recharts" src/atomic-crm/dashboard/` or `grep -r "Chart" src/atomic-crm/dashboard/`
- [ ] List all chart files: _________________

#### B. Update Bar Charts
- [ ] Find BarChart components
- [ ] Replace `fill="#..."` with `fill="var(--chart-1-fill)"`
- [ ] Ensure bars use fill tokens (--chart-1-fill, --chart-2-fill, etc.)

#### C. Update Line Charts
- [ ] Find LineChart components
- [ ] Replace `stroke="#..."` with `stroke="var(--chart-2-stroke)"`
- [ ] Verify line weight: `strokeWidth={2}`

#### D. Update Pie/Donut Charts
- [ ] Find PieChart or Donut components
- [ ] Update data array to use CSS variables:
  ```typescript
  const data = [
    { name: 'Baseline', value: 400, fill: 'var(--chart-1-fill)' },
    { name: 'Our Data', value: 300, fill: 'var(--chart-2-fill)' },
    { name: 'Revenue', value: 200, fill: 'var(--chart-3-fill)' },
  ]
  ```

### 4.3 Validation
- [ ] Load Dashboard page
- [ ] Verify all charts render with new colors
- [ ] Check legend colors match chart colors
- [ ] Test chart tooltips show correct data
- [ ] Screenshot all chart types

### 4.4 Commit
- [ ] Stage: `git add src/index.css src/atomic-crm/dashboard/`
- [ ] Commit: `git commit -m "feat(theme): implement earth-tone chart color system"`
- [ ] Note files: `src/index.css` + dashboard chart components

---

## Phase 5: Tags & Sidebar (3-4 hours)

### 5.1 Expand Tag Color System

#### A. Update src/index.css
- [ ] **Find existing tag colors** (search for `--tag-`)
- [ ] **Add new warm earth-tone tags**:
  ```css
  /* Existing tags (shift ~10° warmer) */
  --tag-gray-bg: oklch(90% 0.008 85);       /* Warmer gray */
  --tag-gray-text: oklch(35% 0.012 85);
  --tag-gray-border: oklch(75% 0.010 85);

  --tag-blue-bg: oklch(92% 0.055 240);      /* Keep cool for contrast */
  --tag-blue-text: oklch(35% 0.125 240);
  --tag-blue-border: oklch(75% 0.085 240);

  --tag-green-bg: oklch(92% 0.08 110);      /* Shift from 125° to 110° */
  --tag-green-text: oklch(35% 0.12 110);
  --tag-green-border: oklch(75% 0.10 110);

  --tag-red-bg: oklch(92% 0.08 30);         /* Shift from 20° to 30° */
  --tag-red-text: oklch(35% 0.12 30);
  --tag-red-border: oklch(75% 0.10 30);

  --tag-yellow-bg: oklch(92% 0.08 95);      /* Shift from 85° to 95° */
  --tag-yellow-text: oklch(35% 0.12 95);
  --tag-yellow-border: oklch(75% 0.10 95);

  --tag-purple-bg: oklch(92% 0.08 305);     /* Shift from 295° to 305° */
  --tag-purple-text: oklch(35% 0.12 305);
  --tag-purple-border: oklch(75% 0.10 305);

  /* NEW warm earth-tone tags */
  --tag-terracotta-bg: oklch(88% 0.075 76);
  --tag-terracotta-text: oklch(30% 0.110 76);
  --tag-terracotta-border: oklch(70% 0.095 76);

  --tag-sage-bg: oklch(92% 0.055 145);
  --tag-sage-text: oklch(30% 0.095 145);
  --tag-sage-border: oklch(75% 0.075 145);

  --tag-olive-bg: oklch(88% 0.065 120);
  --tag-olive-text: oklch(25% 0.105 120);
  --tag-olive-border: oklch(70% 0.085 120);

  --tag-amber-bg: oklch(90% 0.095 85);
  --tag-amber-text: oklch(30% 0.125 85);
  --tag-amber-border: oklch(75% 0.110 85);

  --tag-teal-bg: oklch(92% 0.060 180);
  --tag-teal-text: oklch(30% 0.095 180);
  --tag-teal-border: oklch(75% 0.078 180);

  --tag-eggplant-bg: oklch(88% 0.065 295);
  --tag-eggplant-text: oklch(28% 0.105 295);
  --tag-eggplant-border: oklch(70% 0.085 295);

  --tag-mushroom-bg: oklch(88% 0.012 85);
  --tag-mushroom-text: oklch(25% 0.018 85);
  --tag-mushroom-border: oklch(70% 0.015 85);
  ```

### 5.2 Update Tag Component
- [ ] **Find Tag/Badge component**: `src/components/ui/badge.tsx` or search for Badge component
- [ ] Verify it supports custom color props
- [ ] Document new tag colors in component comments

### 5.3 Update Sidebar Styling

#### A. Locate Sidebar Component
- [ ] **File**: `src/atomic-crm/layout/Sidebar.tsx` or similar
- [ ] Note current background color

#### B. Add Warm Cream Tint
- [ ] Find sidebar root element
- [ ] Update background color:
  ```tsx
  /* Option 1: Use sage-tint */
  className="bg-[var(--sage-tint)] ..."

  /* Option 2: Custom warm tint (lighter than background) */
  style={{ backgroundColor: 'oklch(98.5% 0.012 100)' }}
  ```

#### C. Update Active Item Highlight
- [ ] Find active nav item styling
- [ ] Ensure it uses `--brand-500` or `--brand-600` for highlight

### 5.4 Validation
- [ ] Test tag rendering on Contacts list
- [ ] Create contact with each new tag color
- [ ] Verify sidebar warm tint is visible but subtle
- [ ] Check sidebar active item highlight
- [ ] Screenshot sidebar + tagged items

### 5.5 Commit
- [ ] Stage: `git add src/index.css src/components/ui/badge.tsx src/atomic-crm/layout/Sidebar.tsx`
- [ ] Commit: `git commit -m "feat(theme): expand tag colors and add warm sidebar tint"`
- [ ] Note: 3+ files affected

---

## Phase 6: Dark Mode (4-6 hours)

### 6.1 Generate Dark Mode Variables

#### A. Update src/index.css - Add .dark Scope
- [ ] **After light mode variables** (around line 200)
- [ ] Add `.dark { ... }` scope with inverted neutrals:
  ```css
  .dark {
    /* Inverted Neutral Scale (flip light↔dark) */
    --neutral-50: oklch(13.1% 0.008 85);   /* was 950 */
    --neutral-100: oklch(21.7% 0.010 85);  /* was 900 */
    --neutral-200: oklch(28.5% 0.012 85);  /* was 800 */
    --neutral-300: oklch(38.1% 0.015 85);  /* was 700 */
    --neutral-400: oklch(46.0% 0.018 85);  /* was 600 */
    --neutral-500: oklch(57.7% 0.020 85);  /* was 500 */
    --neutral-600: oklch(71.6% 0.018 85);  /* was 400 */
    --neutral-700: oklch(84.3% 0.015 85);  /* was 300 */
    --neutral-800: oklch(90.2% 0.012 85);  /* was 200 */
    --neutral-900: oklch(95.5% 0.010 85);  /* was 100 */
    --neutral-950: oklch(97.8% 0.008 85);  /* was 50 */

    /* Background & Foreground (inverted) */
    --background: oklch(15% 0.012 85);     /* Dark warm background */
    --foreground: oklch(98% 0.008 85);     /* Light warm text */

    /* Brand Colors (slightly desaturated for dark mode) */
    --brand-700: oklch(62% 0.110 100);     /* Lighter, less saturated */
    --brand-600: oklch(68% 0.115 100);
    --brand-500: oklch(76% 0.120 100);
    --brand-400: oklch(82% 0.105 100);
    --brand-300: oklch(88% 0.090 100);

    /* Accent Clay (desaturated) */
    --accent-clay-700: oklch(60% 0.100 76);
    --accent-clay-600: oklch(66% 0.095 76);
    --accent-clay-500: oklch(72% 0.090 76);
    --accent-clay-400: oklch(78% 0.075 76);
    --accent-clay-300: oklch(85% 0.060 76);

    /* Semantic Colors (adjusted for dark) */
    --success: oklch(62% 0.110 145);  /* Success green, not brand */
    --success-foreground: oklch(15% 0.012 85);
    --success-subtle: oklch(22% 0.08 145);

    --warning: oklch(75% 0.125 85);
    --warning-foreground: oklch(15% 0.012 85);
    --warning-subtle: oklch(25% 0.055 85);

    --danger: oklch(65% 0.18 25);
    --danger-foreground: oklch(98% 0.008 85);
    --danger-subtle: oklch(25% 0.08 25);

    --info: oklch(65% 0.060 180);
    --info-foreground: oklch(15% 0.012 85);
    --info-subtle: oklch(22% 0.035 180);

    /* Sage Tint (dark version) */
    --sage-tint: oklch(18% 0.025 145);

    /* Charts (slightly desaturated for dark) */
    --chart-1-fill: #6B553A;   /* Darker tan */
    --chart-1-stroke: #8B6E44; /* Original becomes stroke */

    --chart-2-fill: #5E9E2F;   /* Darker green */
    --chart-2-stroke: #7CB342;

    --chart-3-fill: #A04525;
    --chart-3-stroke: #C35A2E;

    --chart-4-fill: #5A702F;
    --chart-4-stroke: #718B3A;

    --chart-5-fill: #946000;
    --chart-5-stroke: #B77700;

    --chart-6-fill: #2F6058;
    --chart-6-stroke: #3F7F72;

    --chart-7-fill: #543855;
    --chart-7-stroke: #6B4B6B;

    --chart-8-fill: #56534A;
    --chart-8-stroke: #6E6A5E;

    /* Tags (inverted with lower contrast) */
    --tag-gray-bg: oklch(25% 0.008 85);
    --tag-gray-text: oklch(85% 0.012 85);
    --tag-gray-border: oklch(40% 0.010 85);

    /* ... (repeat for all tag colors) */
  }
  ```

### 6.2 Verify Dark Mode Toggle

#### A. Locate Theme Toggle Component
- [ ] **Search**: `grep -r "theme" src/components/` or `grep -r "dark" src/components/`
- [ ] Find ThemeToggle or similar component: ______________

#### B. Verify Toggle Logic
- [ ] Check if it toggles `.dark` class on `<html>` or `<body>`
- [ ] Verify localStorage persistence: `localStorage.theme`
- [ ] Test toggle button in UI

### 6.3 Test Dark Mode
- [ ] Toggle to dark mode
- [ ] Check all pages render correctly
- [ ] Verify text contrast (no white-on-white or dark-on-dark)
- [ ] Check chart colors are visible
- [ ] Test form inputs are readable
- [ ] Verify sidebar styling
- [ ] Screenshot: Dashboard (dark), Contacts (dark), Login (dark)

### 6.4 Commit
- [ ] Stage: `git add src/index.css`
- [ ] Commit: `git commit -m "feat(theme): implement dark mode with inverted warm neutrals"`
- [ ] Note: 1 file (src/index.css)

---

## Phase 7: Testing & Quality Assurance (4-6 hours)

### 7.1 Automated Tests

#### A. Color Validation Script
- [ ] Run: `npm run validate:colors` (if available)
- [ ] Check output for any hex color usage
- [ ] Fix any violations found

#### B. Build Test
- [ ] Run: `npm run build`
- [ ] Verify no TypeScript errors
- [ ] Verify no CSS parsing errors
- [ ] Check bundle size (should be similar to before)

#### C. Unit Tests
- [ ] Run: `npm test`
- [ ] Fix any failing tests related to color changes
- [ ] Verify snapshot tests pass (or update snapshots if intentional changes)

### 7.2 Manual Testing Checklist

#### A. Visual Regression
- [ ] **Login Page**
  - [ ] Background is warm cream
  - [ ] Form inputs have rounded corners
  - [ ] Primary button uses clay orange (accent-clay-600)
  - [ ] Hover effects work smoothly

- [ ] **Dashboard**
  - [ ] All charts use earth-tone palette
  - [ ] Cards have subtle shadows
  - [ ] Text is readable on warm background
  - [ ] Sidebar has warm tint

- [ ] **Contacts List**
  - [ ] Table loads correctly
  - [ ] Tags use new warm colors
  - [ ] Hover states on rows
  - [ ] Action buttons styled correctly

- [ ] **Contact Detail Page**
  - [ ] Header section readable
  - [ ] Activity timeline styled correctly
  - [ ] Related records section readable

- [ ] **Create/Edit Forms**
  - [ ] Input fields have rounded corners
  - [ ] Labels use correct foreground color
  - [ ] Error states are visible (test by submitting empty form)
  - [ ] Success messages use green accent

- [ ] **Opportunities Pipeline**
  - [ ] Kanban columns styled correctly
  - [ ] Cards have proper shadows
  - [ ] Drag-and-drop feedback visible
  - [ ] Stage colors match semantic tokens

- [ ] **Navigation & Sidebar**
  - [ ] Sidebar has warm cream tint
  - [ ] Active item highlighted with brand green
  - [ ] Hover effects smooth
  - [ ] Logo visible and clear

#### B. Accessibility Testing
- [ ] **Contrast Ratios**
  - [ ] Run axe DevTools extension
  - [ ] Check WCAG AA compliance (4.5:1 text, 3:1 interactive)
  - [ ] Test primary button: Should pass AA
  - [ ] Test warning banner: Should pass AA

- [ ] **Keyboard Navigation**
  - [ ] Tab through all interactive elements
  - [ ] Focus indicators visible
  - [ ] Verify focus uses brand color ring

- [ ] **Screen Reader**
  - [ ] Test with NVDA/JAWS (Windows) or VoiceOver (Mac)
  - [ ] Verify color changes don't break semantic HTML

#### C. Dark Mode Testing
- [ ] Toggle to dark mode
- [ ] Repeat all visual checks above
- [ ] Verify charts are visible
- [ ] Check text contrast
- [ ] Test form inputs
- [ ] Screenshot all pages in dark mode

### 7.3 Browser Testing
- [ ] **Chrome** (latest)
  - [ ] OKLCH colors render correctly
  - [ ] No console errors

- [ ] **Firefox** (latest)
  - [ ] OKLCH colors render correctly
  - [ ] Performance is acceptable

- [ ] **Safari** (latest, if available)
  - [ ] OKLCH fallback works (or colors render correctly)
  - [ ] No rendering issues

### 7.4 Performance Testing
- [ ] Run Lighthouse audit
- [ ] Check Performance score (target: >90)
- [ ] Check Accessibility score (target: 100)
- [ ] Verify font loading doesn't block render
- [ ] Check CSS bundle size

### 7.5 Record Issues
- [ ] Create GitHub issues for any bugs found
- [ ] Tag issues with `theme-migration` label
- [ ] Prioritize blocking issues vs nice-to-haves

### 7.6 Commit
- [ ] Stage test updates: `git add tests/` (if applicable)
- [ ] Commit: `git commit -m "test(theme): update tests for MFB theme migration"`

---

## Phase 8: Documentation (2-3 hours)

### 8.1 Update CLAUDE.md

#### A. Update Color System Section
- [ ] **File**: `CLAUDE.md`
- [ ] **Find**: "Color System" section (around line 30-50)
- [ ] **Replace** with:
  ```markdown
  ## Color System

  **Brand Identity**: Atomic CRM uses the MFB "Garden to Table" theme, a warm earth-tone OKLCH color system inspired by agricultural roots.

  **Color Architecture**:
  - **Primary Brand**: MFB Lime Green at hue 125° (--brand-500 through --brand-800) - for logos/branding
  - **Primary Buttons**: Clay Orange at hue 76° (--accent-clay-600) - for CTAs and interactive elements
  - **Accent Colors**: Terracotta/Clay at hue 76° (--accent-clay-500)
  - **Neutrals**: Warm gray at hue 85° (beige-tinted for food industry aesthetics)
  - **Background**: Warm cream oklch(99% 0.015 85) instead of stark white

  **Key Features**:
  - OKLCH color space for perceptual uniformity
  - 8-color earth-tone chart palette (warm tan, lime green, terracotta, sage, amber, teal, eggplant, mushroom)
  - Extended tag system with 13 color options (7 new warm tones)
  - Algorithmic dark mode with inverted neutrals
  - WCAG AA compliance for all text and interactive elements

  **Migration Date**: January 2025 (from brand-green to MFB theme)

  **Documentation**: See `.docs/plans/mfb-garden-theme/` for full requirements and migration details.
  ```

### 8.2 Create Theme Documentation

#### A. Create Color Palette Reference
- [ ] **File**: `.docs/theme/color-palette.md`
- [ ] Document all color tokens with:
  - Token name
  - OKLCH value
  - Hex equivalent
  - Usage guidance
  - Visual swatch (if possible)

#### B. Create Component Styling Guide
- [ ] **File**: `.docs/theme/component-patterns.md`
- [ ] Document:
  - Button styling patterns
  - Card shadow usage
  - Form input patterns
  - Tag color selection guide
  - Chart color assignment rules

### 8.3 Update README (if applicable)
- [ ] Check if `README.md` mentions color system
- [ ] Update with brief mention of MFB theme
- [ ] Link to detailed docs in `.docs/theme/`

### 8.4 Create Migration Summary
- [ ] **File**: `.docs/plans/mfb-garden-theme/migration-summary.md`
- [ ] Include:
  - Before/after comparison
  - Files changed (list with line counts)
  - Screenshots of key pages
  - Performance impact
  - Known issues or limitations

### 8.5 Update Customization Guide
- [ ] **File**: `doc/developer/customizing.md`
- [ ] Add section on theming and color customization
- [ ] Document how to override colors via CSS variables

### 8.6 Commit
- [ ] Stage all docs: `git add CLAUDE.md .docs/ doc/`
- [ ] Commit: `git commit -m "docs(theme): update documentation for MFB theme migration"`

---

## Post-Migration Tasks

### 9.1 Final Validation
- [ ] Run full test suite: `npm run test:ci`
- [ ] Run linter: `npm run lint`
- [ ] Run Prettier: `npm run prettier:apply`
- [ ] Build production: `npm run build`

### 9.2 Create Pull Request
- [ ] Push branch: `git push origin feature/brand-green-color-migration`
- [ ] Open PR on GitHub
- [ ] Title: "feat(theme): Implement MFB 'Garden to Table' Theme Migration"
- [ ] Description: Include migration summary, screenshots, checklist link
- [ ] Tag reviewers

### 9.3 Prepare Demo
- [ ] Record screen capture of before/after
- [ ] Prepare presentation for stakeholders
- [ ] Document any follow-up work needed

### 9.4 Deploy (when approved)
- [ ] Merge PR to main
- [ ] Deploy to staging: `npm run prod:deploy` (or staging script)
- [ ] Smoke test on staging
- [ ] Deploy to production (when ready)
- [ ] Monitor for issues

---

## Rollback Plan (If Needed)

### Emergency Rollback
If critical issues are discovered:
- [ ] Checkout backup branch: `git checkout backup/pre-mfb-migration`
- [ ] Create hotfix branch: `git checkout -b hotfix/revert-theme`
- [ ] Push: `git push origin hotfix/revert-theme`
- [ ] Create revert PR

### Partial Rollback
If only certain features need reversion:
- [ ] Revert specific commit: `git revert <commit-hash>`
- [ ] Test the revert
- [ ] Push changes

---

## Notes Section

### Issues Encountered
_(Record any blockers or unexpected issues here during migration)_

-

### Performance Metrics
_(Record before/after metrics)_

- **Before Migration**:
  - Bundle size: _____ MB
  - Lighthouse Performance: _____ / 100
  - Lighthouse Accessibility: _____ / 100

- **After Migration**:
  - Bundle size: _____ MB
  - Lighthouse Performance: _____ / 100
  - Lighthouse Accessibility: _____ / 100

### Time Tracking
_(Record actual time spent per phase)_

- Phase 1 (Core Colors): _____ hours
- Phase 2 (Typography): _____ hours
- Phase 3 (Component Patterns): _____ hours
- Phase 4 (Charts): _____ hours
- Phase 5 (Tags & Sidebar): _____ hours
- Phase 6 (Dark Mode): _____ hours
- Phase 7 (Testing): _____ hours
- Phase 8 (Documentation): _____ hours
- **Total**: _____ hours

---

**Last Updated**: 2025-01-17
**Status**: Ready for implementation
**Branch**: `feature/brand-green-color-migration`
