# Color System Migration - Shared Architecture

The Atomic CRM color system uses a CSS-first approach with OKLCH color space, Tailwind CSS v4 utilities, and semantic variables throughout the component hierarchy. Colors flow from `src/index.css` through Tailwind's `@theme inline` block to shadcn/ui components consumed by React Admin views across all feature modules. The migration replaces 75+ instances of grayscale `--primary` with brand green while maintaining WCAG AA compliance through automated validation tools and visual regression testing with Chromatic.

---

## Relevant Files

### CSS & Configuration
- **src/index.css**: Single source of truth for all color variables (66 additions + 28 updates required). Contains `:root` block (light mode), `.dark` block (dark mode), `@theme inline` for Tailwind mapping, tag color classes, and link styling. Lines 51-161 define semantic variables.
- **src/App.css**: Application-level styles, minimal color usage
- **vite.config.ts**: Vite configuration with `@tailwindcss/vite` plugin for zero-config Tailwind v4 integration

### Color Validation
- **scripts/validate-colors.js**: Automated WCAG AA compliance testing (~34 tests), OKLCH→sRGB conversion, contrast ratio calculation (4.5:1 text, 3:1 UI), CI/CD integration with exit codes
- **scripts/migration-validate.sh**: Hardcoded color detection, dark mode validation, CSS class existence checks
- **package.json**: Scripts for `validate:colors`, `lint:check`, `chromatic` visual regression

### shadcn/ui Components (Base Layer)
- **src/components/ui/button.tsx**: 6 variants using CVA (default=primary, destructive, outline, secondary, ghost, link). Primary variant consumes `--primary` color (75+ instances affected by migration).
- **src/components/ui/badge.tsx**: 4 variants (default=primary, destructive, secondary, outline). Uses `--primary`, `--destructive`, `--secondary`.
- **src/components/ui/alert.tsx**: Alert, AlertTitle, AlertDescription with variant support (default, destructive). Uses `--destructive` for error states.
- **src/components/ui/input.tsx**: Text input with focus ring (`--ring`), selection uses `bg-primary`. 14 components use standardized focus pattern.
- **src/components/ui/select.tsx**: Dropdown with `--accent` hover states
- **src/components/ui/checkbox.tsx**: Uses `--primary` for checked state
- **src/components/ui/switch.tsx**: Toggle with `--primary` active background
- **src/components/ui/progress.tsx**: Progress bar with `--primary` fill
- **src/components/ui/tooltip.tsx**: Tooltips with `--primary` background
- **src/components/ui/radio-group.tsx**: Radio buttons with `--primary` selected state
- **src/components/ui/skeleton.tsx**: Loading placeholders with `--accent` shimmer
- **src/components/ui/spinner.tsx**: Loading spinner with `--primary` color
- **src/components/ui/sidebar.tsx**: Navigation component with `--sidebar-*` variables (needs green accent for active state per requirements)
- **src/components/ui/card.tsx**: Card container with `--card` and `--card-foreground`
- **src/components/ui/dialog.tsx**: Modal with `--accent` overlay (only hardcoded color: `bg-black/50`)

### Admin Layer (React Admin Integration)
- **src/components/admin/**: React Admin wrappers that consume shadcn/ui components and pass color variants. Validation state uses `--error-default`, `--success-default`, `--warning-default`.

### Files with Hardcoded Color Violations (MUST FIX)
- **src/atomic-crm/organizations/OrganizationType.tsx** (Lines 41, 91): `bg-gray-200 text-gray-800` → Replace with `bg-muted text-muted-foreground`
- **src/atomic-crm/products/ProductAside.tsx** (Lines 42, 45): `bg-gray-500` → Replace with `bg-muted`
- **src/atomic-crm/opportunities/Status.tsx** (Line 20): `style={{ backgroundColor }}` → Refactor to semantic className with variant prop
- **src/atomic-crm/root/WhatsNew.tsx** (Lines 256, 339, 464, 473, 482): `text-gray-500`, `text-gray-600`, `bg-gray-100` → Replace with semantic variables
- **src/atomic-crm/opportunities/stageConstants.ts** (Line 33): `var(--teal)` (undefined) → Replace with `var(--tag-teal-bg)`

### Storybook & Visual Regression
- **.storybook/main.ts**: Storybook 9.1.10 configuration with Vite builder, React framework, @chromatic-com/storybook addon
- **.storybook/preview.tsx**: Global decorators, themes, dark mode support
- **src/components/ui/button.stories.tsx**: 40+ button variants (6 types × 4 sizes), comprehensive coverage
- **src/components/ui/badge.stories.tsx**: 40+ badge variants (status, category, priority)
- **src/components/ui/alert.stories.tsx**: 30+ alert variants with icons and accessibility examples
- **MISSING: src/atomic-crm/tags/TagChip.stories.tsx**: CRITICAL GAP - needs 8 color variants × 2 modes = 48 snapshots
- **MISSING: src/atomic-crm/tags/TagDialog.stories.tsx**: CRITICAL GAP - needs color picker UI stories = 18 snapshots
- **.github/workflows/chromatic.yml.disabled**: Chromatic workflow (142 lines) with OKLCH validation checklist, needs activation

### Documentation
- **docs/2025-10/NEW-color-guide.html**: Authoritative source for 42 OKLCH colors with interactive preview, light/dark themes, WCAG compliance notes
- **docs/2025-10/brand-green-migration-preview.html**: Interactive preview of migration changes, before/after comparison, all components demonstrated
- **CLAUDE.md**: Engineering Constitution Rule #7 - Semantic colors only, no hardcoded hex values

---

## Relevant Tables

**None** - This is a pure CSS/styling migration with zero database changes.

---

## Relevant Patterns

**CSS Variable Propagation**: Colors flow through 5 layers: (1) `src/index.css` defines `:root` variables, (2) `@theme inline` maps to `--color-*` prefixed variables, (3) Tailwind generates utilities (`bg-primary`, `text-accent`), (4) shadcn/ui components consume utilities via CVA variants, (5) React Admin views render final UI. Example: `--primary: oklch(0.205 0 0)` → `--color-primary: var(--primary)` → `.bg-primary { background: var(--color-primary) }` → `<Button className="bg-primary">` → user sees dark gray button (soon to be green).

**Class Variance Authority (CVA)**: Type-safe variant system used in all shadcn/ui components. Define variants once, get consistent TypeScript types and runtime validation. Example from button.tsx:189-200 shows `variant` enum with default/destructive/outline/secondary/ghost/link mapped to Tailwind classes. Extending to success/warning/info requires adding variant options that reference `--success-strong`, `--warning-strong`, `--info-strong` (already defined in index.css but unused).

**Dark Mode Inversion**: Tailwind v4 uses class-based dark mode with custom variant `@custom-variant dark (&:is(.dark *))` (src/index.css:4). Theme provider toggles `.dark` class on `<html>`, CSS cascade updates all variables. Neutrals fully invert (50↔900, 100↔800, etc.), brand colors adjust lightness only (50% → 65% for buttons on dark backgrounds). Example: `--primary` light=`oklch(0.205 0 0)`, dark=`oklch(0.922 0 0)` (complete reversal). After migration: light=`oklch(50% 0.10 125)` green, dark=`oklch(65% 0.12 125)` lighter green.

**Focus Ring Standardization**: All interactive components use consistent pattern (src/components/ui/input.tsx:24 as canonical example): `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none`. 14 components × 21 total instances. `--ring` currently gray (`oklch(0.60 0 0)`), migrates to brand green (`oklch(74% 0.12 125)` = #9BBB59). Provides 3:1 contrast per WCAG non-text contrast requirement.

**Tag Color System**: 8 predefined tag colors (warm, green, teal, blue, purple, yellow, gray, pink) with bg/fg pairs for auto-contrast. Defined in src/index.css:84-100 (light) and 195-211 (dark). Accessed via custom CSS classes (`.tag-warm`, `.tag-green`, etc.) NOT Tailwind utilities because they're not in `@theme inline`. Already correctly implemented with OKLCH, no changes needed. Example: `--tag-warm-bg: oklch(92.1% 0.041 69.5)`, `--tag-warm-fg: oklch(20% 0.02 69.5)` ensures readable dark text on light background.

**Phase Gate Validation**: After each implementation phase (1: add variables, 2: update mappings, 3: chart colors, 4: warning fix, 5: link styling, 6: hardcoded fixes), MUST run `npm run validate:colors` and achieve zero failures before proceeding. Script exits with code 1 on any WCAG violation, blocking CI/CD pipeline. Validates 34 combinations: tag colors (16 tests), semantic colors (14 tests), focus states (4 tests). No warnings allowed - zero-tolerance policy per requirements.

**Chromatic Visual Regression Workflow**: Every PR triggers Chromatic build (if workflow activated), captures 66+ component snapshots across 23 existing stories + 2 new tag stories. Design lead manually reviews all diffs, explicitly approving expected color changes (gray→green buttons, gray→purple accents) while blocking unintended regressions (layout shifts, wrong colors, contrast failures). Post-migration, workflow reverts to strict mode where unapproved diffs auto-fail PRs. Prerequisites: `CHROMATIC_PROJECT_TOKEN` secret, baseline snapshots captured BEFORE migration starts.

---

## Relevant Docs

**/.docs/plans/color-system-migration/requirements.md**: You MUST read this when working on implementation tasks, understanding scope, writing code. Contains exact CSS values for 66 additions + 28 updates, 5-file hardcoded fix locations with line numbers, 8-phase implementation checklist with time estimates, success metrics (WCAG AA, TypeScript compile, build success), rollback plan (git revert <10min).

**/.docs/plans/color-system-migration/current-state-analysis.md**: You MUST read this when understanding existing color usage, identifying affected components, planning refactoring. Documents 75+ `--primary` instances across 34 files, 3 Engineering Constitution violations (OrganizationType, ProductAside, Status), semantic variable architecture (60+ CSS vars), tag system compliance, migration strategy recommendations (semantic refactor vs. direct replacement).

**/.docs/plans/color-system-migration/gap-analysis.md**: You MUST read this when adding new variables, updating existing variables, ensuring WCAG compliance. Lists all 29 missing variables (neutrals, brand, accents), 13 variables requiring updates, 16 already-correct variables, complete dependency graph (Level 1: foundation, Level 2: semantic mappings, Level 3: charts), WCAG contrast issues (warning-default fails 4.5:1 at 70% L, needs darkening to 62% L).

**/.docs/plans/color-system-migration/validation-strategy.md**: You MUST read this when setting up testing, running validation, creating Chromatic stories, performing QA. Documents `npm run validate:colors` capabilities (34 automated tests, JSON reports, CI exit codes), Chromatic integration (workflow file, baseline snapshots, manual review process), manual testing checklist (4 critical user flows: tags, forms, navigation, charts), rollback triggers (WCAG failures, >20% UI broken, critical flows unusable).

**/.docs/plans/color-system-migration/shadcn-ui-integration.research.md**: You MUST read this when modifying UI components, understanding variant systems, extending color palettes. Documents component architecture (base/admin/feature layers), CVA variant patterns, `--primary` usage in 10 components, `--accent` usage in 8 components, focus ring pattern (14 components), dark mode overrides, only hardcoded color (`bg-black/50` in Dialog), destructive variant inconsistency (uses `text-white` not `text-destructive-foreground`).

**/.docs/plans/color-system-migration/tailwind-v4-config.research.md**: You MUST read this when adding Tailwind utilities, mapping CSS variables, understanding @theme inline. Documents zero-config setup (no tailwind.config.js), `@theme inline` block requirements (`--color-*` prefix mandatory), CSS import order (`@import "tailwindcss"` → `@custom-variant dark` → `@theme inline`), color mapping chain (component → Tailwind utility → theme variable → CSS variable → OKLCH value), tag colors NOT mapped to Tailwind (custom classes only).

**/.docs/plans/color-system-migration/storybook-setup.research.md**: You MUST read this when creating component stories, activating Chromatic, performing visual regression testing. Documents 23 existing stories (41% coverage), CRITICAL GAP: TagChip and TagDialog have zero stories (needs 48 + 18 snapshots), Chromatic workflow disabled (`.github/workflows/chromatic.yml.disabled`), hard-coded colors in alert.stories.tsx (`border-green-200` instead of semantic vars), activation checklist (add `CHROMATIC_PROJECT_TOKEN`, rename workflow file, generate baselines).

**CLAUDE.md**: You MUST read this when enforcing engineering standards, avoiding over-engineering, following established patterns. Rule #7: Semantic CSS variables only (`--primary`, `--destructive`), no hex codes, no Tailwind numeric colors (`bg-gray-500`). Rule #2: Single source of truth (Supabase for data, `src/index.css` for colors). Rule #1: No over-engineering (fail fast, no circuit breakers, no backward compatibility for this migration).

**docs/2025-10/NEW-color-guide.html**: You MUST read this when verifying color values, understanding WCAG compliance notes, checking dark mode behavior. Authoritative source for all 42 OKLCH colors, interactive theme toggle, before/after comparisons, component examples (buttons, badges, charts, tags), WCAG compliance callouts (Brand 700 provides 5.5:1 contrast, warning color issue documented), design principles (60-30-10 rule: neutrals 60%, brand/semantic 30%, accents 10%).

**docs/2025-10/brand-green-migration-preview.html**: You MUST read this when demonstrating changes to stakeholders, QA testing, capturing screenshots. Interactive preview of migrated system, before/after comparison section (gray→green buttons, gray→purple accents), live sidebar demo (Option B: neutral with green accents), chart color balance demonstration (neutral baseline, green for "our data"), migration statistics (66 additions, 28 updates, 5 fixes, 75+ buttons affected).

---

**End of Shared Documentation**
