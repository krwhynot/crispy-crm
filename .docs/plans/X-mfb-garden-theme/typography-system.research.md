# Typography System Research

Research conducted for the MFB "Garden to Table" theme migration to implement Nunito font family from Google Fonts.

**Research Date**: 2025-10-17
**Target Feature**: Nunito font integration
**Current State**: No custom typography system - using browser defaults

---

## Overview

The Atomic CRM codebase currently has **no centralized typography system**. It relies entirely on browser default fonts (sans-serif) with no custom font loading mechanism. The application uses Tailwind CSS v4 with the `@theme` directive for configuration in `/home/krwhynot/projects/crispy-crm/src/index.css`, but does not define any font-family CSS variables. To implement Nunito, we need to add Google Fonts loading and configure Tailwind v4's `@theme` directive with custom font variables.

**Key Findings**:
- No Google Fonts currently loaded
- No `@font-face` declarations exist
- Storybook components reference Nunito Sans but this is not used in production
- Components use Tailwind utility classes (`font-sans`, `text-sm`, `font-medium`, etc.) without custom font configuration
- Font loading must happen via Google Fonts CDN or local font files

---

## Relevant Files

### Primary Configuration Files
- `/home/krwhynot/projects/crispy-crm/index.html` - Main HTML entry point (currently has `font-family: sans-serif` in inline styles)
- `/home/krwhynot/projects/crispy-crm/src/index.css` - Tailwind v4 configuration using `@theme` directive (lines 6-42, 382-389)
- `/home/krwhynot/projects/crispy-crm/src/main.tsx` - React entry point that imports `index.css`
- `/home/krwhynot/projects/crispy-crm/vite.config.ts` - Build configuration (uses @tailwindcss/vite plugin)

### Storybook Files (Reference Only - Not Production)
- `/home/krwhynot/projects/crispy-crm/src/stories/button.css` - Line 8: `font-family: 'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif`
- `/home/krwhynot/projects/crispy-crm/src/stories/page.css` - Line 8: `font-family: 'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif`
- `/home/krwhynot/projects/crispy-crm/src/stories/header.css` - Line 7: `font-family: 'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif`

### Component Examples Using Typography
- `/home/krwhynot/projects/crispy-crm/src/components/ui/button.tsx` - Line 8: Uses `text-sm font-medium` classes
- `/home/krwhynot/projects/crispy-crm/src/components/admin/loading.tsx` - Line 17: Uses `font-sans` utility class explicitly
- `/home/krwhynot/projects/crispy-crm/src/components/ui/label.tsx` - Typography utilities
- `/home/krwhynot/projects/crispy-crm/src/components/ui/input.tsx` - Text input styling
- 132+ component files use `text-{size}` classes (xs, sm, base, lg, xl, 2xl, 3xl, etc.)

---

## Current Typography Architecture

### 1. Font Loading Mechanism
**Status**: None - browser defaults only

**Current State**:
```html
<!-- index.html line 18 -->
<style>
  body {
    margin: 0;
    padding: 0;
    font-family: sans-serif; /* Generic browser default */
  }
</style>
```

**No font loading infrastructure**:
- No Google Fonts `<link>` tags in `<head>`
- No `@import` statements for external fonts
- No `@font-face` declarations
- No local font files in `/home/krwhynot/projects/crispy-crm/public/`

### 2. Tailwind CSS v4 Configuration
**Location**: `/home/krwhynot/projects/crispy-crm/src/index.css`

**Current `@theme` directive** (lines 6-42):
```css
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  /* ... color variables only ... */
  /* NO FONT VARIABLES DEFINED */
}
```

**Default font behavior**:
- Tailwind v4 provides built-in utilities: `font-sans`, `font-serif`, `font-mono`
- Default `font-sans` stack: `ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`
- No custom font stacks configured

### 3. Font Weight Usage

**Current State**: Only hardcoded font-weight in Storybook files (not production)

**Production Components** use Tailwind utilities:
- `font-medium` (500 weight) - Used in buttons, labels, headings
- `font-semibold` (600 weight) - Less common
- `font-bold` (700 weight) - Headings, emphasis
- Default (400 weight) - Body text

**Examples**:
```tsx
// src/components/ui/button.tsx line 8
"text-sm font-medium transition-all"

// src/components/admin/loading.tsx line 19
<h5 className="mt-3 text-2xl text-secondary-foreground">
```

**No custom font-weight mappings** - relies on Tailwind defaults.

### 4. Typography Scale Usage

**Tailwind text utilities found in 132+ files**:
- `text-xs` - Small labels, metadata
- `text-sm` - Most common, buttons, secondary text
- `text-base` - Default body text
- `text-lg` - Section headings
- `text-xl`, `text-2xl` - Page headings
- `text-3xl`, `text-4xl` - Large hero text (less common)

**No custom font-size variables** in `@theme` directive.

---

## Architectural Patterns

### Pattern 1: Inline Font Declaration (index.html)
**Location**: `/home/krwhynot/projects/crispy-crm/index.html` line 18
**Purpose**: Loading screen styling before React hydration
**Current Implementation**:
```css
body {
  font-family: sans-serif;
}
```

**Why it exists**: Provides minimal styling for the loading spinner before React/CSS loads.

### Pattern 2: Tailwind Utility Classes
**Prevalence**: 132+ component files
**Pattern**:
```tsx
<div className="text-sm font-medium">Label</div>
<h1 className="text-2xl font-bold">Heading</h1>
<p className="text-base">Body text</p>
```

**Why it exists**: Tailwind's utility-first approach for consistent typography without custom CSS.

### Pattern 3: Storybook Isolated Fonts
**Location**: `/home/krwhynot/projects/crispy-crm/src/stories/*.css`
**Pattern**: Hardcoded Nunito Sans in Storybook component styles
**Why it exists**: Storybook design system preview (not used in production build)

### Pattern 4: Base Layer Resets
**Location**: `/home/krwhynot/projects/crispy-crm/src/index.css` lines 382-389
**Implementation**:
```css
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Why it exists**: Tailwind's base layer for global resets and semantic color application. **No font-family applied here currently.**

---

## Gotchas & Edge Cases

### 1. Tailwind v4 @import Order Requirement
**Issue**: Browsers require `@import` statements to appear **before** all other CSS rules.

**Current file structure**:
```css
/* src/index.css */
@import "tailwindcss";        /* Line 1 */
@import "tw-animate-css";     /* Line 2 */

@custom-variant dark (&:is(.dark *));  /* Line 4 */

@theme inline {
  /* ... config ... */
}
```

**Gotcha**: If using Google Fonts `@import`, it MUST go **before** `@import "tailwindcss";`:
```css
/* CORRECT ORDER */
@import url("https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap");
@import "tailwindcss";

/* WRONG - Will fail */
@import "tailwindcss";
@import url("https://fonts.googleapis.com/...");
```

**Alternative**: Use `<link>` tag in `index.html` to avoid ordering issues (RECOMMENDED).

### 2. Loading Screen Font Flash (FOUT)
**Issue**: The inline `<style>` in `index.html` (line 18) shows `font-family: sans-serif` during initial load.

**Current behavior**:
1. Browser loads → shows loading spinner with system sans-serif
2. React hydrates → applies Tailwind classes
3. Google Fonts load → font switches to Nunito (visible flash)

**Mitigation Strategy**:
- Use `font-display: swap` in Google Fonts URL (already in requirements.md)
- Match fallback stack to Nunito metrics (system-ui has similar proportions)
- Add preconnect hints to `index.html`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

### 3. Storybook vs Production Font Isolation
**Issue**: Storybook CSS files reference Nunito Sans but production doesn't load it.

**Files affected**:
- `/home/krwhynot/projects/crispy-crm/src/stories/button.css`
- `/home/krwhynot/projects/crispy-crm/src/stories/page.css`
- `/home/krwhynot/projects/crispy-crm/src/stories/header.css`

**Why it doesn't affect production**: Storybook has its own build pipeline (`.storybook/` config) and these CSS files are only imported in `*.stories.tsx` files, not in the main app.

**Action needed**: Update Storybook fonts to match production Nunito when implementing.

### 4. Explicit `font-sans` Usage
**Issue**: Some components explicitly use `font-sans` class instead of relying on body inheritance.

**Example**: `/home/krwhynot/projects/crispy-crm/src/components/admin/loading.tsx` line 17:
```tsx
<div className={"text-center font-sans color-muted pt-1 pb-1"}>
```

**Why this is a gotcha**: Once we define custom `--font-sans` in `@theme`, this component will pick it up. Need to ensure fallback stack is comprehensive.

### 5. Vite Build Optimization
**Current config**: `/home/krwhynot/projects/crispy-crm/vite.config.ts` has aggressive terser minification:
```js
minify: "terser",
terserOptions: {
  compress: {
    drop_console: true,
  }
}
```

**Gotcha**: Font files won't be minified, but CSS with `@import` will be inlined. Using `<link>` tags avoids CSS bloat.

### 6. No Tailwind Config File (v4 Pattern)
**Discovery**: No `tailwind.config.ts` or `tailwind.config.js` exists.

**Why**: Tailwind v4 uses `@theme` directive in CSS instead of JavaScript config files. All customization happens in `/home/krwhynot/projects/crispy-crm/src/index.css`.

**Impact**: Font configuration must use CSS custom properties, not JavaScript theme extension.

---

## Implementation Requirements for Nunito

Based on research and MFB requirements documentation:

### Required Changes

#### 1. Add Google Fonts to index.html
**Location**: `/home/krwhynot/projects/crispy-crm/index.html` in `<head>` section

**Add before closing `</head>`**:
```html
<!-- Preconnect for performance -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>

<!-- Nunito font family (weights: 400, 500, 600, 700) -->
<link href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap" rel="stylesheet">
```

**Rationale**:
- `preconnect` reduces DNS lookup time (~100-200ms improvement)
- `display=swap` shows fallback text immediately, swaps when Nunito loads (prevents invisible text)
- Weights 400/500/600/700 match MFB requirements (regular/medium/semibold/bold)
- Italic 400/600 for emphasis text

#### 2. Update src/index.css @theme directive
**Location**: `/home/krwhynot/projects/crispy-crm/src/index.css` lines 6-42

**Add to @theme block**:
```css
@theme inline {
  /* Existing radius and color variables ... */

  /* Typography System */
  --font-sans: 'Nunito', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
```

**Alternative approach** (if more granular control needed):
```css
@theme inline {
  --font-primary: 'Nunito', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-body: var(--font-primary);
  --font-heading: var(--font-primary);
}
```

**Fallback stack explanation**:
- `system-ui` - Modern OS defaults (San Francisco on macOS, Segoe UI on Windows)
- `-apple-system` - iOS/macOS fallback
- `BlinkMacSystemFont` - Chrome on macOS fallback
- `'Segoe UI'` - Windows fallback
- `sans-serif` - Ultimate fallback

#### 3. Update @layer base body styles
**Location**: `/home/krwhynot/projects/crispy-crm/src/index.css` lines 382-389

**Current**:
```css
@layer base {
  body {
    @apply bg-background text-foreground;
  }
}
```

**Updated**:
```css
@layer base {
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans);
  }
}
```

**Rationale**: Ensures body inherits custom font stack even if Tailwind defaults change.

#### 4. Update index.html inline styles
**Location**: `/home/krwhynot/projects/crispy-crm/index.html` line 18

**Current**:
```css
body {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
}
```

**Updated**:
```css
body {
  margin: 0;
  padding: 0;
  font-family: 'Nunito', system-ui, -apple-system, sans-serif;
}
```

**Rationale**: Loading spinner shows correct font before React hydrates.

#### 5. Update Storybook CSS (Optional)
**Locations**:
- `/home/krwhynot/projects/crispy-crm/src/stories/button.css` line 8
- `/home/krwhynot/projects/crispy-crm/src/stories/page.css` line 8
- `/home/krwhynot/projects/crispy-crm/src/stories/header.css` line 7

**Current**: `font-family: 'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;`

**Updated**: `font-family: 'Nunito', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;`

**Note**: Change "Nunito Sans" to "Nunito" to match production.

---

## Validation Checklist

After implementation, verify:

### Visual Checks
- [ ] Dashboard body text renders in Nunito Regular (400 weight)
- [ ] Button labels use Nunito Medium (500 weight)
- [ ] Headings use Nunito Semibold (600) or Bold (700)
- [ ] Loading spinner shows Nunito font (or acceptable fallback)
- [ ] No FOIT (Flash of Invisible Text) - fallback text visible immediately

### Technical Checks
- [ ] Google Fonts URL loads successfully (check Network tab)
- [ ] `font-display: swap` prevents invisible text
- [ ] Preconnect hints reduce DNS lookup time
- [ ] DevTools > Computed > font-family shows: `Nunito, system-ui, ...`
- [ ] Disable Google Fonts in DevTools → fallback to system-ui works

### Performance Checks
- [ ] Nunito font loads within 2 seconds (requirements.md line 488)
- [ ] Fonts preloaded before render-blocking resources
- [ ] No duplicate font requests (check Network tab for duplicates)
- [ ] Total font file size < 100KB (4 weights × ~20-25KB each)

### Cross-Browser Checks
- [ ] Chrome/Edge: Nunito renders correctly
- [ ] Firefox: Nunito renders correctly
- [ ] Safari: Nunito renders correctly (macOS/iOS)
- [ ] Fallback stack works if Google Fonts blocked

---

## Related Documentation

### Internal Docs
- `.docs/plans/mfb-garden-theme/requirements.md` - Lines 90-116: Typography system specification
- `.docs/plans/mfb-garden-theme/migration-checklist.md` - Lines 132-171: Step-by-step font migration
- `.docs/plans/mfb-garden-theme/testing-guide.md` - Lines 627-656: Font rendering tests

### External Resources
- [Tailwind CSS v4 Font Family Docs](https://tailwindcss.com/docs/font-family) - Custom font configuration
- [Google Fonts: Nunito](https://fonts.google.com/specimen/Nunito) - Font specimen and download
- [Web Font Loading Strategies](https://web.dev/font-best-practices/) - Performance optimization
- [Font Display Property](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display) - FOUT vs FOIT control

### Migration Path Reference
Per requirements.md:
1. Add Google Fonts link to `index.html` (line 642)
2. Add `--font-sans` to `@theme` directive (line 643)
3. Update `@layer base` body styles (implicit)
4. Verify font loads with DevTools (line 693)
5. Test fallback behavior (line 166)

---

## Summary

**Current State**: No custom typography system exists. The app uses browser defaults with Tailwind's built-in `font-sans` utility mapped to generic system fonts.

**Required Changes**:
1. Add Google Fonts `<link>` tags to `/home/krwhynot/projects/crispy-crm/index.html`
2. Define `--font-sans` in `@theme` directive in `/home/krwhynot/projects/crispy-crm/src/index.css`
3. Apply font-family to body in `@layer base` section
4. Update inline loading styles in `index.html`
5. Optionally sync Storybook CSS files

**Complexity**: Low - straightforward CSS configuration with no JavaScript changes needed.

**Risk Areas**:
- Font loading performance (mitigated with preconnect + font-display: swap)
- FOUT during initial load (expected behavior, not a bug)
- Fallback stack compatibility (comprehensive fallback prevents issues)

**Estimated Effort**: 1-2 hours (implementation + testing across browsers)
