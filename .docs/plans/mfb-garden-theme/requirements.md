# MFB "Garden to Table" Theme Migration

**Status**: Ready for Implementation
**Estimated Effort**: 26-38 hours (5-7 days)
**Priority**: High
**Target Branch**: `feature/brand-green-color-migration`
**Created**: 2025-01-17

---

## 1. Feature Summary

Migrate Atomic CRM from the current brand-green OKLCH color system to the MFB "Garden to Table" theme, featuring warm earth tones, organic aesthetics, and food-industry-appropriate visual design. This comprehensive migration includes color palette replacement, typography changes (Nunito font family), component pattern updates (rounded corners, shadows, hover effects), and automated dark mode generation—all while maintaining WCAG AA accessibility standards.

**Key Changes:**
- **Background**: Cool white → Warm cream (#FEFEF9)
- **Primary Brand**: Dark olive green (hue 125°) → Lime garden green (#7CB342, hue 100°)
- **Accent**: Vibrant purple → Clay orange (#EA580C)
- **Typography**: System fonts → Nunito (Google Fonts)
- **Aesthetic**: Professional/corporate → Organic/artisanal

---

## 2. User Stories

### Primary Users: Food Broker Staff & Agricultural Business Teams

**US-1**: As a **food broker using the CRM**, I want the interface to reflect our organic, farm-to-table brand identity, so that the tool feels aligned with our company values and creates a cohesive brand experience.

**US-2**: As a **sales representative**, I want charts and data visualizations to use earth-tone colors that feel natural and agricultural, so that data feels contextually appropriate for the food industry.

**US-3**: As a **manager reviewing dashboards**, I want the warm cream background and rounded components to create a friendly, approachable aesthetic, so that the CRM feels less clinical and more human-centered.

**US-4**: As a **power user who works 8+ hours daily**, I want dark mode support with the same organic aesthetic, so I can reduce eye strain while maintaining brand consistency.

**US-5**: As a **visually impaired user**, I want all text and interactive elements to maintain WCAG AA contrast standards on the new cream background, so the CRM remains accessible despite the color changes.

### Secondary Users: Developers & Designers

**US-6**: As a **developer**, I want a semantic token system (--primary, --accent, etc.) that abstracts the MFB theme, so I can build components without hardcoding specific colors.

**US-7**: As a **designer**, I want comprehensive documentation of the color system with OKLCH values and usage guidelines, so future design work maintains consistency.

---

## 3. Technical Approach

### 3.1 Frontend Components

#### **A. Core Color System** (`src/index.css`)

**Current State**:
```css
/* Brand-Green System */
--brand-700: oklch(50% 0.10 125);    /* Dark olive green */
--background: oklch(97.1% 0.002 284.5); /* Cool white */
--accent-purple: oklch(50% 0.20 295);   /* Purple */
```

**Target State**:
```css
/* MFB Garden to Table System */
--brand-700: oklch(56% 0.125 100);   /* Darkened for WCAG AA */
--brand-500: oklch(72% 0.132 100);   /* Lime green #7CB342 */
--background: oklch(99% 0.015 85);   /* Warm cream #FEFEF9 */
--accent-clay: oklch(63% 0.110 76);  /* Clay orange #EA580C */
```

**Changes Required**:
1. **Brand Colors** (lines 60-66):
   - Replace green hue 125° → 100° (garden green)
   - Increase chroma from 0.10 → 0.132 (more vibrant)
   - Adjust lightness for WCAG compliance on cream

2. **Neutrals** (lines 48-57):
   - Shift cool undertone (284°) → warm undertone (85°)
   - Increase chroma slightly (0.002 → 0.015)
   - Maintain 10-shade scale (neutral-50 through neutral-900)

3. **Accent Colors** (lines 69-72):
   - Replace purple (295°) → clay orange (76°)
   - Reduce chroma (0.20 → 0.110) for earth-tone feel
   - Add light variant for backgrounds

4. **Semantic Tokens** (lines 83-96):
   - Remap --primary to darkened MFB green (56% lightness)
   - Update --ring to maintain focus visibility
   - Adjust --muted-foreground for cream background contrast

#### **B. Typography System**

**Implementation**:
```html
<!-- Add to index.html <head> -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap" rel="stylesheet">
```

```css
/* Add to src/index.css */
:root {
  --font-sans: 'Nunito', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

body {
  font-family: var(--font-sans);
}
```

**Font Weights Mapping**:
- Regular (400): Body text, descriptions
- Medium (500): Secondary headings, labels
- Semibold (600): Primary headings, emphasis
- Bold (700): H1, strong emphasis, CTAs

#### **C. Chart Color System**

**Implementation** (based on Zen's recommendation):

```css
/* Chart Colors - MFB Earth Tone Palette */
/* 8-color categorical set with dual tokens (fill + stroke/label) */

--chart-1-fill: #8B6E44;   /* Warm tan/soil (baseline) */
--chart-1-stroke: #5D4A2F; /* Darker for AA compliance */

--chart-2-fill: #7CB342;   /* MFB lime green (our data) */
--chart-2-stroke: #2F6A1F; /* Dark green for AA */

--chart-3-fill: #C35A2E;   /* Terracotta/clay (category) */
--chart-3-stroke: #7A3519; /* Dark clay */

--chart-4-fill: #718B3A;   /* Sage/olive (category) */
--chart-4-stroke: #41531E; /* Dark olive */

--chart-5-fill: #B77700;   /* Golden amber (warning/at-risk) */
--chart-5-stroke: #6C4A00; /* Dark amber */

--chart-6-fill: #3F7F72;   /* Sage-teal (cool counterpoint) */
--chart-6-stroke: #245249; /* Dark teal */

--chart-7-fill: #6B4B6B;   /* Eggplant (deep neutral) */
--chart-7-stroke: #49344A; /* Dark eggplant */

--chart-8-fill: #6E6A5E;   /* Mushroom gray (overflow/totals) */
--chart-8-stroke: #4A473F; /* Dark mushroom */

/* Chart support tokens */
--chart-gridline: #E7E5DC; /* Subtle gridlines */
--chart-axis-text: #2A2A25; /* Axis labels */
```

**Rationale**:
- Maintains strategic meaning (baseline, "our data", categories, warning)
- Earth-forward semantics (soil, foliage, clay, produce)
- WCAG AA compliant with dual tokens (light fill + dark stroke)
- Colorblind resilient (hue + lightness separation)

#### **D. Component Pattern Updates**

**Rounded Corners**:
```css
:root {
  --radius: 0.5rem; /* 8px - changed from 0.625rem (10px) */
  --radius-sm: calc(var(--radius) - 2px);  /* 6px */
  --radius-md: calc(var(--radius) - 1px);  /* 7px */
  --radius-lg: var(--radius);              /* 8px */
}
```

**Shadows** (softer, warmer):
```css
/* Increase opacity 20-30% for visibility on cream background */
--shadow-card-1: 0 1px 3px oklch(0 0 0 / 0.16);  /* Was 0.12 */
--shadow-card-2: 0 2px 6px oklch(0 0 0 / 0.20);  /* Was 0.15 */
--shadow-card-3: 0 3px 8px oklch(0 0 0 / 0.24);  /* Was 0.18 */

/* Hover states */
--shadow-card-1-hover: 0 2px 6px oklch(0 0 0 / 0.24);  /* Was 0.18 */
--shadow-card-2-hover: 0 4px 12px oklch(0 0 0 / 0.32); /* Was 0.25 */
```

**Hover Effects**:
```css
/* Component hover transformation */
.card:hover,
.btn:hover {
  transform: translateY(-2px); /* Lift effect */
  transition: all 200ms ease;  /* Smooth animation */
}
```

#### **E. Tag Color System Expansion**

**Current**: 8 tag colors (warm, green, teal, blue, purple, yellow, gray, pink)

**Target**: 12+ tag colors, shifted 10° warmer

**Implementation Strategy**:
1. Shift existing 8 tags: hue += 10° (e.g., green 149.3° → 159.3°)
2. Add 4 new earth-tone tags:
   - `--tag-clay-bg/fg` (terracotta)
   - `--tag-sage-bg/fg` (olive green)
   - `--tag-amber-bg/fg` (golden)
   - `--tag-cocoa-bg/fg` (brown)

**Example**:
```css
/* Existing (shifted +10°) */
--tag-green-bg: oklch(95% 0.023 159.3);  /* Was 149.3° */
--tag-green-fg: oklch(20% 0.02 159.3);

/* New additions */
--tag-clay-bg: oklch(92% 0.04 48);
--tag-clay-fg: oklch(20% 0.02 48);

--tag-sage-bg: oklch(94% 0.03 112);
--tag-sage-fg: oklch(20% 0.02 112);

--tag-amber-bg: oklch(96% 0.04 80);
--tag-amber-fg: oklch(20% 0.02 80);

--tag-cocoa-bg: oklch(90% 0.04 74);
--tag-cocoa-fg: oklch(20% 0.02 74);
```

#### **F. Sidebar Color Update**

**Current**:
```css
--sidebar: oklch(0.985 0 0);  /* Cool light gray */
```

**Target**:
```css
--sidebar: oklch(98% 0.012 85);  /* Warm cream tint */
--sidebar-active-bg: oklch(96% 0.025 100);  /* Light lime tint */
```

#### **G. Dark Mode Generation**

**Strategy**: Algorithmic inversion (auto-generate from light mode)

**Algorithm**:
1. **Neutrals**: Invert scale (50 ↔ 900, 100 ↔ 800, etc.)
2. **Brand colors**: Lighten for visibility on dark background
   - brand-700: 56% → 65% (lighter for dark bg)
   - brand-500: 72% → 75% (slightly lighter)
3. **Accents**: Reduce chroma slightly to prevent glare
   - Clay orange: C 0.110 → 0.095
4. **Background**: Dark warm tone
   - background: oklch(20% 0.015 85) (dark cream)

**Implementation**:
```css
.dark {
  /* Inverted neutrals */
  --neutral-50: oklch(23.4% 0.021 85);   /* Dark warm */
  --neutral-900: oklch(97.1% 0.015 85);  /* Light warm */

  /* Adjusted brand */
  --brand-700: oklch(65% 0.125 100);     /* Lighter for dark */
  --brand-500: oklch(75% 0.130 100);

  /* Adjusted accent */
  --accent-clay: oklch(63% 0.095 76);    /* Reduced chroma */

  /* Dark background */
  --background: oklch(20% 0.015 85);
  --foreground: oklch(95% 0.015 85);
}
```

---

### 3.2 API Endpoints

**No API changes required**. This is a pure frontend visual migration.

---

### 3.3 Database Changes

**No database migrations required**. Color system is entirely CSS-based.

---

### 3.4 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   src/index.css                              │
│              (Single Source of Truth)                        │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ MFB Brand Colors (OKLCH)                           │    │
│  │ - brand-500, brand-700 (lime green hue 100°)       │    │
│  │ - accent-clay (orange hue 76°)                     │    │
│  │ - neutral-50...900 (warm undertone 85°)            │    │
│  │ - chart-1...8 (earth tone palette)                 │    │
│  └────────────┬───────────────────────────────────────┘    │
│               │                                              │
│               ↓                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Semantic Tokens                                     │    │
│  │ - --primary: var(--brand-700)                       │    │
│  │ - --accent: var(--accent-clay)                      │    │
│  │ - --background: warm cream                          │    │
│  └────────────┬───────────────────────────────────────┘    │
│               │                                              │
└───────────────┼──────────────────────────────────────────────┘
                │
                ↓
┌───────────────────────────────────────────────────────────┐
│            Tailwind @theme Bridge                          │
│  (Exposes CSS vars as Tailwind utilities)                  │
│  - bg-primary → background: var(--primary)                 │
│  - text-accent → color: var(--accent)                      │
└───────────┬───────────────────────────────────────────────┘
            │
            ↓
┌───────────────────────────────────────────────────────────┐
│                 141+ Components                            │
│                                                            │
│  Three consumption patterns:                               │
│  1. Tailwind utilities: className="bg-primary"            │
│  2. CSS var syntax: className="border-[var(--accent)]"    │
│  3. Inline styles: style={{ color: getColor() }}          │
│                                                            │
│  Components auto-update when CSS variables change          │
└───────────────────────────────────────────────────────────┘
```

**Key Architecture Points**:
- **Single Source of Truth**: All colors defined once in `src/index.css`
- **Semantic Abstraction**: Components use tokens (--primary), not brand colors (--brand-700)
- **Automatic Cascade**: Changing CSS variables updates all 141+ components
- **Dark Mode**: CSS class `.dark` inverts color scale automatically

---

## 4. UI/UX Flow

### Step-by-Step User Experience Changes

#### **4.1 Login Page**
**Before**: Cool white background, green logo, dark buttons
**After**: Warm cream background, lime green logo, clay orange accent on "Sign In" button

**Visual Changes**:
- Background: #FFFFFF → #FEFEF9 (subtle cream warmth)
- Primary button: Dark olive green → Clay orange (#EA580C)
- Logo: Current brand green → Lime green (#7CB342)
- Typography: System font → Nunito (rounded, friendly)

---

#### **4.2 Dashboard**
**Before**: Clean, professional, cool-toned charts
**After**: Organic, warm, earth-tone charts with strategic color meaning

**Visual Changes**:
- **Background cards**: White → Light sage tint (#F0FDF4)
- **Pipeline chart**:
  - Baseline bars: Gray → Warm tan (#8B6E44)
  - "Our performance": Brand green → Lime green (#7CB342)
  - At-risk: Orange → Golden amber (#B77700)
- **Quick stats**: Cool blue accents → Clay orange accents
- **Rounded corners**: 10px → 8px (slightly sharper for modern feel)

---

#### **4.3 Contact/Organization Lists**
**Before**: High-contrast white background, clean typography
**After**: Warm cream background, softer shadows, friendlier font

**Visual Changes**:
- **Table background**: Pure white → Cream (#FEFEF9)
- **Row hover**: Light gray → Light sage tint
- **Avatar colors**: Keep current (already diverse)
- **Status badges**: Shift 10° warmer (e.g., "Active" green 149° → 159°)
- **Shadows**: Increase opacity 25% for visibility on cream

---

#### **4.4 Opportunity Pipeline (Kanban)**
**Before**: Cool gray columns, purple accents
**After**: Warm beige columns, clay orange accents

**Visual Changes**:
- **Column backgrounds**: Light gray → Warm beige
- **Stage colors** (from `stageConstants.ts`):
  - new_lead: Blue → Warm sky blue
  - sample_visit_offered: Orange → Golden amber
  - closed_won: Green → Lime green
- **Drag indicators**: Purple → Clay orange
- **Empty state**: Cool illustration → Warm earth-tone illustration

---

#### **4.5 Forms & Inputs**
**Before**: Gray borders, green focus rings
**After**: Warm borders, lime focus rings with higher contrast

**Visual Changes**:
- **Input borders**: Cool gray (#E5E7EB) → Warm gray with yellow tint
- **Focus rings**: Brand green → Lime green (#7CB342) with 2px outline
- **Labels**: System font → Nunito medium (500 weight)
- **Error states**: Keep red, ensure WCAG AA on cream
- **Success states**: Shift green 10° warmer

---

#### **4.6 Dark Mode** (Auto-generated)
**Before**: Dark gray with cool undertones
**After**: Dark warm tones (chocolate/espresso aesthetic)

**Visual Changes**:
- **Background**: Cool black (#121212) → Warm dark (#2A2A25, slight brown tint)
- **Text**: Cool white → Warm white (slight yellow tint)
- **Brand colors**: Lighter for visibility (65-75% lightness)
- **Accents**: Reduced chroma to prevent glare

---

#### **4.7 Navigation/Sidebar**
**Before**: Cool light gray sidebar, dark text
**After**: Warm cream-tinted sidebar, softer contrast

**Visual Changes**:
- **Sidebar background**: Cool gray → Warm cream tint
- **Active item**: Light gray → Light lime tint (#F0FDF4)
- **Hover state**: Subtle gray → Subtle sage
- **Icons**: Keep current, ensure contrast on new background

---

### Component Interaction Examples

**Button Hover**:
```
[Primary Button: Lime Green Background]
  ↓ (Hover)
[Transform: translateY(-2px)]
[Shadow: Grows from 0 2px 6px → 0 4px 12px]
[Duration: 200ms ease]
```

**Card Hover**:
```
[Card: White Background, Soft Shadow]
  ↓ (Hover)
[Transform: translateY(-2px)]
[Shadow: Intensifies]
[Border: Subtle lime green glow (optional)]
```

---

## 5. Success Metrics

### 5.1 Accessibility Compliance
- ✅ **100% WCAG AA compliance** for all text/background combinations (4.5:1 minimum)
- ✅ **All interactive elements** pass 3:1 contrast requirement
- ✅ **Focus indicators** clearly visible on cream background
- ✅ **Automated validation**: `npm run validate:colors` passes with 0 failures

**Validation Method**: Run contrast checker on all semantic token pairs:
```bash
npm run validate:colors
# Expected output: ✅ Passed: 16/16 tests
```

### 5.2 Visual Regression
- ✅ **141+ components render correctly** on cream background
- ✅ **No broken layouts** due to color changes
- ✅ **Charts display legibly** with earth-tone palette
- ✅ **Dark mode matches light mode theme** (warm aesthetic preserved)

**Testing Method**: Visual snapshot testing with Playwright
```bash
npm run test:visual
# Compare before/after screenshots
```

### 5.3 Performance
- ✅ **Nunito font loads** within 2 seconds (using `font-display: swap`)
- ✅ **No layout shift** during font loading (use fallback system font)
- ✅ **CSS bundle size** remains under 50KB (color variables don't add significant weight)

**Validation Method**:
```bash
npm run build
# Check dist/assets/*.css file size
# Lighthouse performance audit
```

### 5.4 Brand Consistency
- ✅ **Color palette matches** MFB style guide exactly
- ✅ **Typography** uses Nunito at specified weights (400, 500, 600, 700)
- ✅ **Component patterns** follow MFB guidelines (8px radius, soft shadows)
- ✅ **Documentation** updated in CLAUDE.md with new color system

**Validation Method**: Manual design review with stakeholder approval

### 5.5 Developer Experience
- ✅ **Semantic tokens remain unchanged** (--primary, --accent, etc.)
- ✅ **No component code changes required** (colors update automatically)
- ✅ **Dark mode works without additional code**
- ✅ **Storybook updated** with MFB theme preview

**Validation Method**:
```bash
npm run dev
# Verify components update automatically
# Toggle dark mode
```

---

## 6. Out of Scope

### Explicitly NOT included in this migration:

1. **Logo Redesign**
   - Keeping existing MFB logo assets
   - Not creating new logo variations
   - **Rationale**: Logo design is separate brand identity work

2. **Illustration Updates**
   - Empty state illustrations remain unchanged
   - Dashboard graphics keep current style
   - **Rationale**: 26-38 hour timeline doesn't include illustration work

3. **Photography/Imagery**
   - Product photos, header images unchanged
   - **Rationale**: Asset creation outside scope

4. **Animation Changes**
   - Keeping 200ms ease transitions
   - No new animation patterns
   - **Rationale**: Current animations sufficient

5. **Multi-Tenant Theme Switching**
   - NOT implementing theme selector UI
   - NOT supporting multiple themes simultaneously
   - **Rationale**: MFB theme replaces brand-green entirely

6. **Localization/i18n**
   - No translation updates for color names
   - **Rationale**: Color system doesn't affect text content

7. **Mobile-Specific Optimizations**
   - Responsive design remains unchanged
   - **Rationale**: Current responsive system works with new colors

8. **Third-Party UI Library Theming**
   - Not customizing React Admin components beyond CSS variables
   - **Rationale**: CSS variable system provides sufficient theming

9. **Email Template Updates**
   - Transactional emails keep current branding
   - **Rationale**: Email design separate from app UI

10. **PDF/Export Styling**
    - Report exports remain unchanged
    - **Rationale**: Separate styling system

---

## 7. Technical Requirements

### 7.1 Browser Support
- ✅ **OKLCH color space**: Chrome 111+, Safari 16.4+, Firefox 113+
- ✅ **CSS custom properties**: All modern browsers
- ✅ **Fallback**: Not required (drop legacy browser support per project decision)

### 7.2 Dependencies
- **Google Fonts API**: Nunito font family
- **No new npm packages** required
- **Existing**: `validate-colors.js` script for WCAG testing

### 7.3 Build System
- **No Vite config changes** required
- **CSS processed normally** via Tailwind CSS 4
- **PostCSS**: No additional plugins needed

### 7.4 Testing Requirements
- **Unit tests**: No changes (visual-only migration)
- **Visual regression**: Playwright snapshots required
- **Accessibility**: Automated WCAG testing via axe-core
- **Manual QA**: Full UI walkthrough in light/dark modes

---

## 8. File Modification Summary

### Critical Path (3 files):
1. `/home/krwhynot/projects/crispy-crm/src/index.css` (~150 lines changed)
2. `/home/krwhynot/projects/crispy-crm/src/lib/color-types.ts` (~20 lines)
3. `/home/krwhynot/projects/crispy-crm/src/atomic-crm/opportunities/stageConstants.ts` (~10 lines)

### High Impact (14 files):
- All CSS variable references (sidebar.tsx, alert.tsx, etc.)
- Chart configurations (OpportunitiesChart.tsx)
- Theme documentation (CLAUDE.md)

### Extensive (141+ files):
- All Tailwind color class consumers (no changes needed if tokens updated correctly)

### New Files:
- `index.html` (add Google Fonts link)
- `.docs/plans/mfb-garden-theme/migration-checklist.md` (this document)
- `.docs/plans/mfb-garden-theme/testing-guide.md` (separate document)

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Contrast failures on cream** | HIGH | HIGH | Pre-validate all colors with WCAG checker before implementation |
| **Font loading delays** | MEDIUM | MEDIUM | Use `font-display: swap`, provide system font fallback |
| **Dark mode looks "off"** | MEDIUM | HIGH | Test extensively, adjust algorithm if needed |
| **User confusion/pushback** | LOW | HIGH | Clear communication, highlight "Garden to Table" branding |
| **Chart readability issues** | LOW | MEDIUM | Use Zen's dual-token system (fill + stroke) |
| **Performance regression** | LOW | LOW | Monitor bundle size, optimize font loading |

---

## 10. Implementation Timeline

### Phase 1: Core Colors (Day 1-2, 8-12 hours)
- [ ] Update brand colors in `src/index.css`
- [ ] Shift neutral palette to warm undertones
- [ ] Replace accent colors (purple → clay orange)
- [ ] Update semantic token mappings
- [ ] Run `npm run validate:colors`, fix failures

### Phase 2: Typography (Day 2, 2-4 hours)
- [ ] Add Google Fonts link to `index.html`
- [ ] Update font-family CSS variable
- [ ] Test font weights across components
- [ ] Verify loading performance

### Phase 3: Component Patterns (Day 3, 4-6 hours)
- [ ] Update border radius (10px → 8px)
- [ ] Adjust shadow opacity for cream background
- [ ] Implement hover lift effects
- [ ] Update transition timings

### Phase 4: Charts & Data Viz (Day 3-4, 6-8 hours)
- [ ] Implement Zen's 8-color earth tone palette
- [ ] Add dual tokens (fill + stroke/label)
- [ ] Update chart components (OpportunitiesChart.tsx, etc.)
- [ ] Test chart contrast and readability

### Phase 5: Tags & Sidebar (Day 4, 4-6 hours)
- [ ] Shift 8 existing tags 10° warmer
- [ ] Add 4 new earth-tone tags (clay, sage, amber, cocoa)
- [ ] Update sidebar with warm cream tint
- [ ] Update `color-types.ts` with new tag definitions

### Phase 6: Dark Mode (Day 5, 8-12 hours)
- [ ] Generate dark mode palette (invert algorithm)
- [ ] Test all components in dark mode
- [ ] Adjust chroma/lightness for visibility
- [ ] Validate dark mode accessibility

### Phase 7: Testing & QA (Day 6-7, 8-12 hours)
- [ ] Visual regression testing (Playwright)
- [ ] Accessibility audit (axe-core)
- [ ] Manual QA walkthrough (all pages, both modes)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Performance audit (Lighthouse)

### Phase 8: Documentation (Day 7, 2-4 hours)
- [ ] Update CLAUDE.md with MFB color system
- [ ] Document usage guidelines
- [ ] Create migration notes for team
- [ ] Update Storybook with new theme

**Total Estimate**: 42-64 hours (actual: aim for 38 hours)

---

## 11. Acceptance Criteria

### Must-Have (Blocking Launch):
- ✅ All WCAG AA contrast ratios pass (4.5:1 text, 3:1 non-text)
- ✅ Dark mode functional with warm aesthetic
- ✅ Nunito font loads correctly (with fallback)
- ✅ 141+ components render without visual regressions
- ✅ Charts use earth-tone palette with clear data distinction
- ✅ `npm run build` succeeds without errors
- ✅ `npm run validate:colors` passes 100%

### Should-Have (Important):
- ✅ Hover effects work smoothly (200ms transitions)
- ✅ Shadows adjusted for cream background visibility
- ✅ Border radius updated to 8px throughout
- ✅ Tag system expanded with 4 new colors
- ✅ Sidebar has warm cream tint
- ✅ Documentation complete in CLAUDE.md

### Nice-to-Have (Post-Launch):
- ⭕ Storybook themes updated
- ⭕ Design system Figma file created
- ⭕ User feedback collected
- ⭕ A/B testing data analyzed

---

## 12. Open Questions

**None** - All decisions confirmed:
1. ✅ Accessibility: Darken primary overall (Option B)
2. ✅ Dark mode: Auto-generate (Option A)
3. ✅ Typography: Google Fonts CDN (Option A)
4. ✅ Scope: All visual changes (colors + patterns)
5. ✅ Sidebar: Warm cream tint
6. ✅ Charts: Zen's earth-tone strategy (Option A+)
7. ✅ Timeline: Complete migration (Option A, 5-7 days)
8. ✅ Tags: Shift warmer + add 4 new colors
9. ✅ Deployment: Immediate (not live yet)
10. ✅ Documentation: Requirements + Checklist + Testing guide

---

## 13. Related Documents

- **Migration Checklist**: `.docs/plans/mfb-garden-theme/migration-checklist.md`
- **Testing Guide**: `.docs/plans/mfb-garden-theme/testing-guide.md`
- **Architecture Research**: `docs/internal-docs/color-theming-architecture.docs.md`
- **Color Comparison**: (See agent research output from investigation phase)
- **Original Style Guide**: User-provided MFB "Garden to Table" specifications

---

## 14. Sign-Off

**Prepared By**: Claude Code (AI Assistant)
**Reviewed By**: [Pending User Approval]
**Approved By**: [Pending Stakeholder Sign-Off]
**Implementation Start Date**: [TBD]
**Target Completion Date**: [TBD + 7 days]

---

**Next Steps**:
1. Review this requirements document for accuracy
2. Create migration checklist (separate document)
3. Create testing guide (separate document)
4. Begin Phase 1 implementation (core colors)
