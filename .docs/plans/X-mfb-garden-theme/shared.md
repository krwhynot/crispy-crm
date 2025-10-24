# MFB "Garden to Table" Theme Migration - Shared Architecture

This document consolidates critical architecture information for implementing the MFB theme migration. The migration replaces the current brand-green OKLCH system with warm earth tones inspired by agricultural aesthetics (cream backgrounds, lime green primary, terracotta accents).

## Architecture Overview

The color system uses a **three-tier hierarchy** where all 180+ color definitions live in a single source of truth (`src/index.css`). Semantic tokens automatically inherit from brand colors, enabling the entire UI to update when base colors change. However, several **critical gaps** exist between the documented migration plan and actual codebase implementation.

## Critical Code-Breaking Gaps (From Zen Analysis)

### 🚨 GAP 1: Chart Color System Mismatch (CRITICAL)
**Problem**: `OpportunitiesChart.tsx` uses semantic state colors (`--success-default`, `--info-default`, `--error-default`) instead of the documented `--chart-1` through `--chart-8` system.

**Breaking Impact**: Updating only chart variables will NOT change dashboard chart colors. Charts will continue showing old brand-green colors after migration.

**Solution**: Refactor `src/atomic-crm/dashboard/OpportunitiesChart.tsx` to use categorical chart tokens:
- Won opportunities: `var(--chart-2-fill)` (MFB lime green)
- Pending opportunities: `var(--chart-6-fill)` (sage-teal)
- Lost opportunities: `var(--chart-7-fill)` (eggplant)

**Estimated Fix**: 30 minutes | **Priority**: IMMEDIATE

---

### ⚠️ GAP 2: Validation Script May Not Exist (HIGH)
**Problem**: Migration checklist references `npm run validate:colors` but this script's existence is unverified.

**Breaking Impact**: Validation step will fail CI/CD if script doesn't exist. No automated WCAG contrast checking.

**Solution**: Verify `package.json` has this script. If missing, create it or update documentation to remove references.

**Estimated Fix**: 1-2 hours if creation needed | **Priority**: IMMEDIATE

---

### ⚠️ GAP 3: Typography Import Order (MEDIUM)
**Problem**: Current app has NO font loading. Adding Google Fonts via `@import` requires specific ordering (`@import "fonts"` BEFORE `@import "tailwindcss"`) but this isn't emphasized in requirements.

**Breaking Impact**: Wrong import order = fonts silently fail to load, app reverts to system fonts with no error messages.

**Solution**: Document critical import order and add FOUT mitigation:
```css
/* CORRECT ORDER in src/index.css */
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap');
@import "tailwindcss";
```

**Estimated Fix**: 30 minutes documentation | **Priority**: HIGH

---

### ⚠️ GAP 4: Opacity Modifier Cascade (MEDIUM)
**Problem**: Components using `bg-primary/50` won't automatically update when `--primary` changes if opacity is baked into color definitions.

**Breaking Impact**: Some UI elements may have incorrect opacity after color migration.

**Solution**: Audit components for hardcoded opacity modifiers. Ensure base color tokens are fully opaque with opacity applied separately.

**Estimated Fix**: 1 hour component audit | **Priority**: MEDIUM

---

### 🔵 GAP 5: OKLCH Browser Fallback (LOW)
**Problem**: Requirements mention Chrome 111+, Safari 16.4+, Firefox 113+ but no explicit fallback strategy for older browsers.

**Breaking Impact**: Colors won't render on unsupported browsers (shows as invalid CSS).

**Solution**: Add hex fallbacks OR document explicit browser support cutoff (already implied in requirements line 577).

**Estimated Fix**: 3-4 hours if fallbacks needed | **Priority**: LOW

---

## Relevant Files

### Core Color System
- `/home/krwhynot/projects/crispy-crm/src/index.css` (lines 47-170): Single source of truth for all 180+ OKLCH color definitions. Three-tier hierarchy: brand foundation → semantic tokens → component-specific colors.

### Chart Implementation
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/dashboard/OpportunitiesChart.tsx`: **CRITICAL** - Currently uses semantic colors, must be refactored to use chart tokens before migration.

### Typography System
- `/home/krwhynot/projects/crispy-crm/src/index.css` (lines ~15-20): Font family declarations (currently defaults only, needs Nunito integration).
- `/home/krwhynot/projects/crispy-crm/index.html`: Font loading location (Google Fonts `<link>` tag goes in `<head>`).

### Component Styling
- `/home/krwhynot/projects/crispy-crm/src/components/ui/button.tsx`: Button variants and hover effects (rounded corners, shadows).
- `/home/krwhynot/projects/crispy-crm/src/components/ui/card.tsx`: Card shadows and elevation system.
- `/home/krwhynot/projects/crispy-crm/src/components/ui/input.tsx`: Form input focus rings and validation states.
- `/home/krwhynot/projects/crispy-crm/src/components/ui/badge.tsx`: Tag color system (8 existing + 5 new earth tones).
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/layout/Sidebar.tsx`: Sidebar warm cream tint styling.

### Build Configuration
- `/home/krwhynot/projects/crispy-crm/package.json`: Verify `validate:colors` script exists (GAP 2).
- `/home/krwhynot/projects/crispy-crm/tailwind.config.ts`: **NOTE** - May not exist if using Tailwind v4 CSS-first config via `@theme` directive.

### Validation & Testing
- `/home/krwhynot/projects/crispy-crm/scripts/validate-colors.js`: Automated WCAG contrast checker (34 tests: 8 tags + 7 semantic + 2 focus × 2 modes).

---

## Relevant Tables

No database tables are affected by this migration. This is a pure frontend CSS/styling change.

---

## Relevant Patterns

**Three-Tier Color Hierarchy**: Base brand colors (Tier 1) cascade to semantic tokens (Tier 2) which cascade to component-specific tokens (Tier 3). Only Tier 1 needs manual updates; Tiers 2-3 auto-adapt via CSS variable references. Example: `--brand-700` → `--primary` → `button background-color: var(--primary)`.

**OKLCH Color Format**: All colors use `oklch(lightness% chroma hue)` for perceptual uniformity. Example: `oklch(72% 0.132 100)` = MFB lime green #7CB342. Provides consistent perceived brightness across different hues.

**Dark Mode Neutral Inversion**: Dark mode automatically flips neutral scale (50↔900, 100↔800, etc.) and slightly desaturates brand colors for readability. Implemented via `.dark` class scope. Example: `--neutral-50: oklch(97.8% ...)` becomes `oklch(13.1% ...)` in dark mode.

**Semantic Token Abstraction**: Components reference semantic tokens (`--primary`, `--background`, `--foreground`) not brand colors (`--brand-700`). This decouples components from specific color values, enabling theme changes without component edits. Example: Button uses `bg-primary` not `bg-brand-700`.

**Focus Ring Pattern**: All interactive elements use standardized focus ring: `focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:border-ring`. Used in 15+ components (Input, Checkbox, Switch, Select, etc.). See `/home/krwhynot/projects/crispy-crm/src/components/ui/input.tsx:21-24`.

**Validation State Colors**: Error states use `aria-invalid` attribute to trigger destructive color styling. Example: `<Input aria-invalid={hasError} />` applies `--destructive` border color automatically. See `/home/krwhynot/projects/crispy-crm/src/components/ui/input.tsx:36`.

**Chart Color Strategy (Documented vs Actual Mismatch)**: **Documented**: 8-color categorical palette (`--chart-1` through `--chart-8`) for baseline/our data/categories. **Actual**: OpportunitiesChart uses semantic state colors (`--success`, `--info`, `--error`). This is GAP 1 and must be fixed before migration.

**Shadow Elevation System**: Four-tier shadows (xs/sm/md/lg) with increased opacity for cream backgrounds. Example: `--shadow-card-1: 0 1px 3px oklch(0 0 0 / 0.16)` (was 0.12 before). Card components use `shadow-md hover:shadow-lg` pattern. See `/home/krwhynot/projects/crispy-crm/src/components/ui/card.tsx:8`.

**Tailwind CSS 4 @theme Directive**: CSS-first configuration using `@theme inline { ... }` instead of `tailwind.config.js`. Bridges CSS variables to Tailwind utilities, enabling `bg-primary` to reference `var(--primary)`. See `/home/krwhynot/projects/crispy-crm/src/index.css` (architecture research doc confirms v4 pattern).

---

## Relevant Docs

**`.docs/plans/mfb-garden-theme/requirements.md`**: Complete migration specifications including color values, user stories, technical approach, success metrics, and timeline. Read this for overall scope and acceptance criteria.

**`.docs/plans/mfb-garden-theme/migration-checklist.md`**: Phase-by-phase implementation checklist with specific line numbers, code examples, and validation steps. Read this when executing the migration.

**`.docs/plans/mfb-garden-theme/testing-guide.md`**: Comprehensive testing procedures covering visual regression, accessibility, WCAG contrast validation, dark mode, and cross-browser compatibility. Read this during testing phase (Phase 7).

**`.docs/plans/mfb-garden-theme/color-system-architecture.research.md`**: Deep dive into current color system implementation with 180+ variable documentation, three-tier hierarchy explanation, and migration checklists. Read this when modifying `src/index.css`.

**`.docs/plans/mfb-garden-theme/chart-system.research.md`**: Analysis of Nivo chart implementation showing semantic color usage (GAP 1). Read this when refactoring `OpportunitiesChart.tsx`.

**`.docs/plans/mfb-garden-theme/component-patterns.research.md`**: 58 UI component analysis with styling patterns, focus ring standards, and validation states. Read this when testing component compatibility.

**`.docs/plans/mfb-garden-theme/typography-system.research.md`**: Current typography state (no custom fonts) and Nunito integration guide with import order warnings. Read this when adding Google Fonts.

**`CLAUDE.md` (lines 30-50)**: Engineering constitution and color system overview. Update this after migration with new MFB color descriptions.

**`doc/developer/architecture-choices.md`**: Explains why certain architectural patterns exist (database views, lazy loading, triggers). Read this to understand broader system design.

---

## Migration Workflow Summary

1. **Pre-Migration** (IMMEDIATE):
   - Fix GAP 1: Refactor `OpportunitiesChart.tsx` to use chart tokens
   - Verify GAP 2: Check `package.json` for `validate:colors` script
   - Document GAP 3: Add import order warnings to requirements

2. **Phase 1: Core Colors** (4-6 hours):
   - Update `src/index.css` lines 47-72 (brand colors)
   - Update neutrals to warm undertones (hue 85°)
   - Add MFB accent colors (terracotta/clay)
   - Run `npm run validate:colors` iteratively

3. **Phase 2: Typography** (2-3 hours):
   - Add Google Fonts to `index.html` (watch import order!)
   - Update `src/index.css` font-family declarations
   - Test FOUT mitigation with `font-display: swap`

4. **Phase 3: Components** (3-4 hours):
   - Update button/card/input rounded corners (8px)
   - Adjust shadow opacity for cream background
   - Test hover effects and transitions

5. **Phase 4: Charts** (4-5 hours):
   - Apply earth-tone palette to `OpportunitiesChart.tsx` (already refactored in pre-migration)
   - Test chart readability on cream background

6. **Phase 5: Tags & Sidebar** (3-4 hours):
   - Shift 8 existing tags 10° warmer
   - Add 5 new earth-tone tags
   - Apply warm cream tint to sidebar

7. **Phase 6: Dark Mode** (4-6 hours):
   - Generate inverted neutrals in `.dark` scope
   - Desaturate brand colors for dark backgrounds
   - Test all components in dark mode

8. **Phase 7: Testing** (4-6 hours):
   - Visual regression (BackstopJS)
   - Accessibility audit (axe, Lighthouse)
   - Cross-browser testing (Chrome, Firefox, Safari)
   - Performance benchmarks

9. **Phase 8: Documentation** (2-3 hours):
   - Update `CLAUDE.md` color system section
   - Create `docs/theme/color-palette.md`
   - Write migration summary

**Total Estimated Time**: 26-38 hours (plus 2-3 hours for pre-migration gap fixes)

---

## Key Takeaways for Implementers

1. **Fix chart color mismatch FIRST** - OpportunitiesChart will not update otherwise (GAP 1)
2. **Verify validation tooling exists** - Check package.json before starting (GAP 2)
3. **Watch CSS import order** - Google Fonts must load before Tailwind (GAP 3)
4. **Only edit Tier 1 colors** - Semantic tokens cascade automatically
5. **Test contrast obsessively** - Warm cream background requires WCAG vigilance
6. **Dark mode is algorithmic** - Neutral inversion works automatically if Tier 1 is correct
7. **Components don't change** - CSS variable system means zero component edits (except chart refactor)

---

**Last Updated**: 2025-01-17
**Status**: Ready for implementation with critical gaps identified
**Next Step**: Fix GAP 1 (chart refactor) and GAP 2 (validate script) before starting Phase 1
