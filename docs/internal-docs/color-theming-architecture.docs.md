# Color/Theming Architecture Research

The Atomic CRM color system uses a three-tier hierarchical architecture: **Brand Colors** → **Semantic Tokens** → **Component Consumption**. All colors are defined in OKLCH format for perceptually uniform color manipulation with automatic light/dark mode support.

## Relevant Files

- `/home/krwhynot/projects/crispy-crm/src/index.css` - Single source of truth for all color definitions
- `/home/krwhynot/projects/crispy-crm/src/components/admin/theme-provider.tsx` - Runtime theme switching (light/dark/system)
- `/home/krwhynot/projects/crispy-crm/scripts/validate-colors.js` - WCAG contrast validation script
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/root/ConfigurationContext.tsx` - App configuration (NO color configuration)
- `/home/krwhynot/projects/crispy-crm/src/components/ui/button.tsx` - Example component using semantic tokens
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/stageConstants.ts` - Stage colors using semantic variables
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/OpportunityCard.tsx` - Component using CSS variable syntax

## Architectural Patterns

### 1. Three-Tier Color Hierarchy

**Tier 1: Brand Colors** (Lines 47-66 in index.css)
- **Neutrals**: `--neutral-50` through `--neutral-900` (OKLCH, cool undertone hue ~285°)
- **Brand**: `--brand-100` through `--brand-800` (OKLCH hue 125° - green)
- **Accents**: `--accent-purple`, `--accent-teal` (OKLCH with reduced chroma)

**Tier 2: Semantic Tokens** (Lines 74-96 in index.css)
- Foundation: `--background`, `--foreground`, `--card`, `--card-foreground`
- Interactive: `--primary`, `--secondary`, `--accent`, `--muted`, `--destructive`
- Structure: `--border`, `--input`, `--ring`
- Semantic tokens reference brand colors via CSS variables: `--primary: var(--brand-700)`

**Tier 3: Component-Specific** (Lines 138-184 in index.css)
- State colors: `--success-*`, `--warning-*`, `--info-*`, `--error-*` (8 variants each)
- Tag colors: `--tag-warm-bg/fg`, `--tag-green-bg/fg`, etc. (8 color pairs)
- Loading states: `--loading-surface`, `--loading-shimmer`, etc.
- Sidebar: `--sidebar`, `--sidebar-accent`, `--sidebar-active-bg`, etc.
- Charts: `--chart-1` through `--chart-5`
- Shadows: `--shadow-card-1/2/3` with hover variants

### 2. Light/Dark Mode Architecture

**Mechanism**: CSS class-based switching via `.dark` selector
- `:root` block (lines 44-197) = light mode defaults
- `.dark` block (lines 199-350) = dark mode overrides
- Neutrals are **inverted** in dark mode (50↔900, 100↔800, etc.)
- Brand colors are **adjusted** (lighter shades for better contrast on dark backgrounds)
- Theme switching managed by `ThemeProvider` in `/home/krwhynot/projects/crispy-crm/src/components/admin/theme-provider.tsx`
- Theme state stored in React Admin's `useStore` (localStorage persistence)
- System preference detection via `window.matchMedia("(prefers-color-scheme: dark)")`

### 3. Tailwind CSS 4 Integration

**Bridge Layer** (Lines 6-42 in index.css)
```css
@theme inline {
  --color-primary: var(--primary);
  --color-background: var(--background);
  /* ... maps CSS variables to Tailwind's color system */
}
```
This enables Tailwind utilities like `bg-primary`, `text-foreground`, etc. to reference semantic tokens.

**Radius System**:
- Base: `--radius: 0.625rem` (10px)
- Variants: `--radius-sm/md/lg/xl` calculated via `calc()` for consistent scaling

### 4. Component Color Consumption Patterns

**Pattern A: Tailwind Utility Classes** (Preferred for simple cases)
```tsx
// src/components/ui/button.tsx
"bg-primary text-primary-foreground hover:bg-primary/90"
"bg-secondary text-secondary-foreground hover:bg-secondary/80"
```

**Pattern B: CSS Variable Syntax** (For computed/dynamic values)
```tsx
// src/atomic-crm/opportunities/OpportunityCard.tsx (line 66)
className="shadow-[var(--shadow-card-2)] hover:shadow-[var(--shadow-card-2-hover)]"
border="border-[var(--primary)]"
```

**Pattern C: Inline Styles** (For truly dynamic colors)
```tsx
// src/atomic-crm/opportunities/OpportunityColumn.tsx (line 38)
style={{ borderBottom: `2px solid ${getOpportunityStageColor(stage)}` }}
```
Where `getOpportunityStageColor()` returns semantic variables like `"var(--info-subtle)"` or `"var(--success-strong)"`.

**Pattern D: Tag Classes** (Custom utility classes)
```css
/* Lines 392-430 in index.css */
.tag-warm { background-color: var(--tag-warm-bg); color: var(--tag-warm-fg); }
.tag-green { background-color: var(--tag-green-bg); color: var(--tag-green-fg); }
```

## Edge Cases & Gotchas

### 1. OKLCH Format Requirements
- **All colors MUST be in OKLCH format** for consistent manipulation
- Format: `oklch(lightness chroma hue)` or `oklch(lightness% chroma hue)`
- Example: `oklch(74% 0.12 125)` = brand green at 74% lightness, 0.12 chroma, 125° hue
- Gotcha: Percentage (`%`) is optional for lightness - validation script handles both formats
- Alpha channel: `oklch(0.985 0 0)` for white, `oklch(0 0 0 / 0.6)` for transparent black

### 2. Neutral Color Inversion
- Neutrals flip in dark mode (50→900, 100→800, etc.)
- **Derived semantic tokens automatically adapt** because they reference neutrals
- Example: `--foreground: var(--neutral-700)` becomes light in dark mode because `--neutral-700` inverts to the old `--neutral-200`
- This is the "magic" that makes dark mode work without duplicating semantic token definitions

### 3. Shadow System Elevation
- Three elevation levels: `--shadow-card-1/2/3` (subtle/medium/prominent)
- Each has hover variant: `--shadow-card-1-hover/2-hover/3-hover`
- Dark mode uses **stronger shadows** (higher opacity) for better depth perception
- Used in opportunity columns: `stageConstants.ts` defines elevation per stage (lines 11, 30, etc.)

### 4. Border Transparency in Dark Mode
- Light mode borders: `--border: var(--neutral-200)` (solid color)
- Dark mode borders: `--border: oklch(1 0 0 / 15%)` (transparent white)
- This creates softer edges on dark backgrounds without harsh lines

### 5. No Runtime Theme Configuration
- **ConfigurationContext does NOT manage colors** (only logos, statuses, categories)
- All color changes require editing `/home/krwhynot/projects/crispy-crm/src/index.css`
- No build-time theme generation - everything is CSS variables
- The `<CRM>` component accepts `lightModeLogo`/`darkModeLogo` props but NO color props

### 6. Contrast Validation is Automated
- `npm run validate:colors` runs WCAG AA contrast checks (4.5:1 for text, 3.0:1 for focus rings)
- Script parses OKLCH → sRGB → luminance → contrast ratio calculation
- Currently validates: tag colors, semantic colors, focus states
- Validates in BOTH light and dark modes
- CI/CD integration: exits with code 1 on violations

### 7. Hardcoded Colors in Storybook
- `/home/krwhynot/projects/crispy-crm/src/stories/*.css` contains hardcoded hex values
- These are NOT used in production - only for Storybook demos
- Safe to ignore for theme migration

### 8. Chart Colors Reference Brand
- `--chart-2: var(--brand-500)` = "our performance" uses brand color
- Other chart colors use accents (`--accent-teal`, `--accent-purple`)
- Charts will need updating if brand color changes significantly

## Color System Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  src/index.css (SINGLE SOURCE OF TRUTH)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ :root (LIGHT MODE)                                  │   │
│  │  ├─ Brand Colors (OKLCH)                           │   │
│  │  │   --neutral-50 → --neutral-900 (hue ~285°)      │   │
│  │  │   --brand-100 → --brand-800 (hue 125°)          │   │
│  │  │   --accent-purple, --accent-teal                │   │
│  │  │                                                  │   │
│  │  ├─ Semantic Tokens (References)                   │   │
│  │  │   --primary: var(--brand-700)                   │   │
│  │  │   --background: var(--neutral-50)               │   │
│  │  │   --border: var(--neutral-200)                  │   │
│  │  │                                                  │   │
│  │  └─ Component-Specific (References + OKLCH)        │   │
│  │      --sidebar-active-bg: var(--brand-100)         │   │
│  │      --tag-warm-bg: oklch(92.1% 0.041 69.5)        │   │
│  │      --shadow-card-1: 0 1px 3px oklch(0 0 0/0.12)  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ .dark (DARK MODE OVERRIDES)                        │   │
│  │  ├─ Inverted Neutrals                              │   │
│  │  │   --neutral-50: oklch(23.4% ...) ← was 900      │   │
│  │  │   --neutral-900: oklch(97.1% ...) ← was 50      │   │
│  │  │                                                  │   │
│  │  ├─ Adjusted Brand Colors                          │   │
│  │  │   --brand-700: oklch(65% 0.12 125) ← lighter    │   │
│  │  │                                                  │   │
│  │  └─ Semantic Tokens (Auto-adapt via references)    │   │
│  │      --primary: var(--brand-700) ← uses new value  │   │
│  │      --background: var(--neutral-50) ← now dark    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  @theme inline {} - Tailwind CSS 4 Bridge                  │
│  --color-primary: var(--primary) → enables bg-primary      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  COMPONENT CONSUMPTION (3 patterns)                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ A. Tailwind Utilities (Preferred)                  │   │
│  │    className="bg-primary text-foreground"          │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ B. CSS Variable Syntax (Dynamic)                   │   │
│  │    className="border-[var(--primary)]"             │   │
│  │    className="shadow-[var(--shadow-card-2)]"       │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ C. Inline Styles (Runtime Dynamic)                 │   │
│  │    style={{ color: getStageColor(stage) }}         │   │
│  │    // Returns: "var(--success-strong)" etc.        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  ThemeProvider (Runtime Switching)                          │
│  ├─ Adds/removes .dark class on <html>                     │
│  ├─ Persists to localStorage via React Admin useStore      │
│  └─ System preference detection via matchMedia             │
└─────────────────────────────────────────────────────────────┘
```

## Theme Migration Effort Assessment

### Low Effort (1-2 hours)
1. **Replace brand color values** in `src/index.css` `:root` block
   - Update `--brand-*` variables (lines 59-66) from hue 125° to new warm earth hues
   - Update `--neutral-*` variables (lines 47-57) from cool (~285°) to warm undertones
   - Adjust `--accent-*` colors to complement new palette

2. **Update dark mode variants** in `.dark` block
   - Adjust `--brand-*` values (lines 212-219) for dark backgrounds
   - Verify neutral inversion still works with warm undertones

### Medium Effort (2-4 hours)
3. **Validate contrast ratios** with `npm run validate:colors`
   - Fix any WCAG AA violations (4.5:1 minimum)
   - Adjust lightness/chroma values in OKLCH to meet standards
   - Retest all 16 test cases (8 tag colors × 2 modes)

4. **Update component-specific colors** that reference brand
   - `--sidebar-active-bg` (line 182) uses `--brand-100`
   - `--chart-2` (line 167) uses `--brand-500`
   - Stage colors in `stageConstants.ts` may need adjustment
   - Review state colors (`--success-*`, `--warning-*`) for palette harmony

### High Effort (4-8 hours) - ONLY IF NEEDED
5. **Visual regression testing** (if comprehensive)
   - Screenshot comparison of all routes in light/dark modes
   - Component library (Storybook) visual diff
   - Opportunity board, dashboard charts, contact cards

6. **Semantic token remapping** (if brand role changes)
   - Currently: `--primary: var(--brand-700)` assumes green = primary action color
   - If MFB theme uses different hue for CTAs, may need to decouple brand from primary
   - Could introduce `--cta-*` variables separate from `--brand-*`

## Technical Debt & Anti-Patterns

### ✅ Good Patterns
- **Single source of truth**: All colors in one file (`src/index.css`)
- **Semantic naming**: `--primary` not `--green-700`
- **Perceptually uniform**: OKLCH ensures consistent lightness perception
- **Automated validation**: WCAG checks prevent accessibility regressions
- **Type safety**: No runtime color configuration = no prop validation needed

### ⚠️ Caution Areas
- **No build-time theme generation**: Can't generate multiple themes from config
- **CSS variable syntax in Tailwind**: `border-[var(--primary)]` bypasses JIT safety
- **Inline style usage**: `style={{ borderBottom: '2px solid ...' }}` harder to maintain than classes
- **Chart color coupling**: `--chart-2` hardcoded to brand green

### ❌ Anti-Patterns Found
- **Hardcoded OKLCH in components**: `stageConstants.ts` line 28 uses `var(--info-subtle)` ✅ (this is OK)
- **Hex colors in Storybook**: `/src/stories/*.css` has `#1ea7fd` etc. (isolated to demos, not production)

## Migration Recommendations

### Phase 1: Color Definition (1-2 hours)
1. Update brand colors in `src/index.css:59-66` `:root` block
   - Change hue from 125° (green) to MFB earth tones (suggest 30-50° range for warm browns/creams)
   - Adjust neutral hues from ~285° (cool) to ~60-90° (warm)
   - Maintain lightness/chroma relationships for WCAG compliance

2. Update dark mode in `src/index.css:212-219` `.dark` block
   - Adjust brand colors for dark background contrast
   - Test neutral inversion with new warm undertones

### Phase 2: Validation (1-2 hours)
3. Run `npm run validate:colors` continuously during adjustments
4. Fix any contrast violations by tweaking lightness values
5. Visual spot-check critical components:
   - `/opportunities` board (OpportunityCard, OpportunityColumn)
   - `/dashboard` (charts, widgets)
   - Sidebar navigation

### Phase 3: Fine-Tuning (1-2 hours)
6. Adjust component-specific colors for harmony:
   - State colors (`--success-*`, `--warning-*`) to complement new palette
   - Tag colors for visual distinction with warm backgrounds
   - Sidebar active states for adequate contrast

### Phase 4: Testing (2-4 hours if comprehensive)
7. Browser testing (light/dark modes)
8. Accessibility audit (keyboard nav, screen reader)
9. Visual regression (optional - screenshot comparison)

**Total Estimated Effort: 4-10 hours** depending on visual testing depth.

## Relevant Docs

- [Engineering Constitution - Color Principle](https://github.com/marmelab/atomic-crm/blob/main/CLAUDE.md#engineering-constitution) - "COLORS: Semantic CSS variables only"
- [OKLCH Color Notation](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/oklch) - MDN reference
- [WCAG 2.1 Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) - 4.5:1 for normal text
- [Tailwind CSS 4 Theme Configuration](https://tailwindcss.com/docs/theme) - @theme directive usage
- Internal: `/home/krwhynot/projects/crispy-crm/scripts/validate-colors.js` - Contrast validation implementation
