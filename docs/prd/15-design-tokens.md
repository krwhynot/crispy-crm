---
> **⚠️ SUPERSEDED**: See `../PRD.md` v1.18 Section 9 (UI/UX Guidelines) for current requirements.

**Part of:** Crispy-CRM Product Requirements Document (v1.5 - ARCHIVED)
**Category:** Design System
**Document:** 15-design-tokens.md

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🎨 [Design Components](./16-design-components.md)
- 📐 [Design Layout & Accessibility](./17-design-layout.md)
- 🏢 [Organizations Feature](./03-organizations.md)
- 🎯 [Opportunities Feature](./04-opportunities.md)
- 👤 [Contacts Feature](./05-contacts.md)
- 📦 [Products Feature](./06-products.md)
---

## 📊 Implementation Status

**Last Updated:** November 4, 2025

| Metric | Status |
|--------|--------|
| **Completion** | ✅ **85-90%** |
| **Confidence** | 🟢 **HIGH** - Production ready |
| **Files** | 3 core (index.css, validate-colors.js, vite.config.ts) |
| **Token Count** | 150+ color tokens, 20+ layout tokens |
| **OKLCH System** | ✅ Complete with dual-mode (light/dark) |
| **Validation** | ✅ Automated WCAG AA compliance checking |

**Completed Requirements:**

**Tailwind v4 Configuration:**
- ✅ CSS-first architecture (index.css - 714 lines, 30KB)
- ✅ `@theme inline` directive for token definitions
- ✅ Bridge layer mapping CSS variables to Tailwind utilities
- ✅ Vite integration with `@tailwindcss/vite` plugin

**OKLCH Color System (150+ tokens):**
- ✅ Brand colors (17 tokens: --brand-100 through --brand-800)
- ✅ Neutral colors (11 shades: --neutral-50 through --neutral-950)
- ✅ Accent colors (5 shades: --accent-clay-300/400/500/600/700)
- ✅ Semantic tokens (20+: --primary, --background, --foreground, --border, --ring)
- ✅ State colors (32 tokens: --success-*, --warning-*, --info-*, --error-*)
- ✅ Tag system (24 tokens: 8 color pairs with bg/fg variants)
- ✅ Chart colors (24 tokens: --chart-1 through --chart-8 fill/stroke)
- ✅ Text hierarchy (4 tokens: --text-title, --text-metric, --text-body, --text-subtle)
- ✅ Light/dark mode support (complete dual-mode with :root and .dark selectors)

**Layout Tokens:**
- ✅ Border radius (5 tokens: --radius-sm/md/lg/xl with calc())
- ✅ Shadow/Elevation system (12 tokens: --elevation-1/2/3, --shadow-card-1/2/3)
- ✅ Warm-tinted shadow ink (--shadow-ink: oklch(30% 0.010 92))
- ✅ Font family token (--font-sans: 'Nunito', 'Inter', ui-sans-serif...)

**Validation Tooling:**
- ✅ WCAG AA contrast validation (scripts/validate-colors.js - 539 lines)
- ✅ OKLCH → sRGB conversion for accurate luminance
- ✅ Dual-mode testing (68 tests total: 34 light + 34 dark)
- ✅ Automated CI/CD integration
- ✅ JSON report generation
- ✅ npm script: `npm run validate:colors`

**Component Integration:**
- ✅ 39 component files using semantic tokens (27 UI + 12 features)
- ✅ Zero hardcoded colors found (all use CSS variables)
- ✅ Consistent pattern across 521 TypeScript/TSX files

**Missing Requirements (10-15%):**

| Task | Status | Confidence | Estimate |
|------|--------|-----------|----------|
| Add explicit typography scale tokens | ⚠️ Partial | 🟢 HIGH | 2 hours |
| Document spacing scale reliance on Tailwind defaults | ⚠️ Partial | 🟢 HIGH | 1 hour |

**Details:**
- **Typography:** Font family token exists, but no explicit `fontSize` overrides in `@theme inline` - relies on Tailwind v4 defaults which match PRD specs
- **Spacing:** No custom spacing tokens, uses Tailwind v4 default scale (4px base unit) - functionally complete but not architecturally explicit
- **Strength:** OKLCH color system exceeds PRD expectations with comprehensive state colors, tag system, and chart palette
- **Validation:** Automated WCAG testing ensures accessibility compliance
- **Shadow System:** Sophisticated 3-tier elevation with warm-tinted ink prevents "soot" appearance

**Blockers:** None

**Status:** Production-ready design token system with OKLCH colors, semantic variables, and automated validation. Minor gaps in explicit typography/spacing tokenization are mitigated by Tailwind v4 defaults matching PRD specifications.

---

# 15. Design Tokens

## 4.1 Design System Foundation

### Technology Stack

**Framework & Styling:**
- **React 18+** with TypeScript
- **Tailwind CSS** with semantic CSS variables
- **OKLCH color model** for light/dark theme support
- **Tokenized design system**: All spacing, shadows, borders, and radii defined as reusable tokens

**Key Design Principles:**
1. **Clarity**: Information is immediately understandable
2. **Consistency**: Patterns are predictable through tokenized systems
3. **Hierarchy**: Visual importance matches information priority using elevation and contrast
4. **Accessibility**: WCAG 2.1 AA compliance minimum
5. **Performance**: Optimized for iPad-first, then desktop

### Color System (OKLCH-Based)

**Semantic Color Variables:**

```css
/* Primary Brand Colors */
--color-primary-50: oklch(0.95 0.02 210);   /* Lightest teal */
--color-primary-100: oklch(0.90 0.04 210);
--color-primary-200: oklch(0.80 0.08 210);
--color-primary-300: oklch(0.70 0.12 210);
--color-primary-400: oklch(0.60 0.16 210);
--color-primary-500: oklch(0.45 0.18 210);  /* Base: Dark teal (#215967) */
--color-primary-600: oklch(0.35 0.16 210);
--color-primary-700: oklch(0.25 0.14 210);
--color-primary-800: oklch(0.15 0.12 210);
--color-primary-900: oklch(0.10 0.10 210);  /* Darkest teal */

/* Neutral Colors (UI backgrounds, borders, text) */
--color-neutral-50: oklch(0.98 0 0);        /* Almost white */
--color-neutral-100: oklch(0.95 0 0);       /* Light gray */
--color-neutral-200: oklch(0.90 0 0);
--color-neutral-300: oklch(0.80 0 0);
--color-neutral-400: oklch(0.65 0 0);
--color-neutral-500: oklch(0.50 0 0);       /* Mid gray */
--color-neutral-600: oklch(0.40 0 0);
--color-neutral-700: oklch(0.30 0 0);
--color-neutral-800: oklch(0.20 0 0);
--color-neutral-900: oklch(0.10 0 0);       /* Near black */

/* Priority Colors (Organizations & Opportunities) */
/* Note: System uses 4 priority levels (A, B, C, D). No A+ level. */
--color-priority-aplus: oklch(0.35 0.15 145);   /* Dark green (deprecated, not used) */
--color-priority-a: oklch(0.50 0.15 145);       /* Green - Highest priority */
--color-priority-b: oklch(0.75 0.15 90);        /* Yellow/Gold */
--color-priority-c: oklch(0.65 0.15 45);        /* Orange */
--color-priority-d: oklch(0.55 0.15 20);        /* Red - Lowest priority */
--color-priority-none: oklch(0.60 0 0);         /* Gray */

/* Status Colors */
--color-status-open: oklch(0.60 0.15 240);      /* Blue */
--color-status-sold: oklch(0.50 0.15 145);      /* Green */
--color-status-closed: oklch(0.60 0 0);         /* Gray */
--color-status-hold: oklch(0.75 0.15 90);       /* Yellow */

/* Semantic Colors */
--color-success: oklch(0.50 0.15 145);          /* Green */
--color-error: oklch(0.55 0.18 20);             /* Red */
--color-warning: oklch(0.70 0.15 75);           /* Amber */
--color-info: oklch(0.60 0.15 240);             /* Blue */

/* Surface Colors (Elevation System) */
--color-surface-base: oklch(0.98 0 0);          /* Page background */
--color-surface-raised: oklch(1.0 0 0);         /* Card/panel background */
--color-surface-overlay: oklch(1.0 0 0);        /* Modal/dropdown background */
```

**Tailwind Configuration:**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: 'var(--color-primary-50)',
          100: 'var(--color-primary-100)',
          // ... 200-900
        },
        neutral: {
          50: 'var(--color-neutral-50)',
          // ... 100-900
        },
        priority: {
          'aplus': 'var(--color-priority-aplus)',  // Deprecated: not used in 4-level system (A,B,C,D)
          'a': 'var(--color-priority-a)',
          'b': 'var(--color-priority-b)',
          'c': 'var(--color-priority-c)',
          'd': 'var(--color-priority-d)',
          'none': 'var(--color-priority-none)',
        },
        status: {
          open: 'var(--color-status-open)',
          sold: 'var(--color-status-sold)',
          closed: 'var(--color-status-closed)',
          hold: 'var(--color-status-hold)',
        }
      }
    }
  }
}
```

**Usage in React:**
```tsx
// Priority badge component
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-priority-a text-white">
  A
</span>

// Status badge
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-open text-white">
  Open
</span>
```

### Typography Scale

**Font Family:**
- Primary: `Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif`
- Monospace (for data): `'JetBrains Mono', 'SF Mono', Consolas, monospace`

**Type Scale (Tailwind):**
```javascript
fontSize: {
  'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
  'sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
  'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px (body)
  'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
  'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px (H3)
  '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px (H2)
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px (H1)
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
}
```

**Font Weights:**
- Normal: 400 (body text)
- Medium: 500 (emphasized text, labels)
- Semibold: 600 (headings, buttons)
- Bold: 700 (primary headings)

**Usage Guidelines:**
- **Body text**: `text-base font-normal text-neutral-700`
- **Headings**: `text-2xl font-semibold text-neutral-900`
- **Labels**: `text-sm font-medium text-neutral-600`
- **Data fields**: `text-base font-mono text-neutral-800`

### Spacing Scale (4px Base Unit)

```javascript
spacing: {
  '0': '0',
  'px': '1px',
  '0.5': '0.125rem',  // 2px
  '1': '0.25rem',     // 4px
  '2': '0.5rem',      // 8px
  '3': '0.75rem',     // 12px
  '4': '1rem',        // 16px
  '5': '1.25rem',     // 20px
  '6': '1.5rem',      // 24px
  '8': '2rem',        // 32px
  '10': '2.5rem',     // 40px
  '12': '3rem',       // 48px
  '16': '4rem',       // 64px
  '20': '5rem',       // 80px
  '24': '6rem',       // 96px
}
```

**Spacing Guidelines:**
- Component internal padding: `p-4` (16px)
- Card padding: `p-6` (24px)
- Section margins: `mb-6` or `mb-8`
- Button padding: `px-4 py-2` (16px horizontal, 8px vertical)
- Input padding: `px-3 py-2` (12px horizontal, 8px vertical)

### Elevation System (Layered Shadows)

**Shadow Tokens:**
```css
/* Tailwind shadow configuration */
boxShadow: {
  'none': 'none',
  'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'sm': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  'DEFAULT': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  'md': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  'lg': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  'xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
}
```

**Elevation Hierarchy:**
- **Level 0** (Base): Page background, no shadow
- **Level 1** (Surface): Cards, panels (`shadow-sm`)
- **Level 2** (Raised): Hover states, selected items (`shadow-md`)
- **Level 3** (Overlay): Modals, dropdowns, tooltips (`shadow-lg`)
- **Level 4** (Highest): Toasts, notifications (`shadow-xl`)

**Usage:**
```tsx
// Card
<div className="bg-surface-raised shadow-sm rounded-lg p-6">
  {/* Card content */}
</div>

// Hover state
<div className="bg-surface-raised shadow-sm hover:shadow-md transition-shadow duration-200">
  {/* Interactive card */}
</div>

// Modal
<div className="bg-surface-overlay shadow-lg rounded-lg p-8">
  {/* Modal content */}
</div>
```

### Border Radius System

```javascript
borderRadius: {
  'none': '0',
  'sm': '0.125rem',   // 2px (tight elements)
  'DEFAULT': '0.25rem', // 4px (most UI elements)
  'md': '0.375rem',   // 6px (cards)
  'lg': '0.5rem',     // 8px (large cards, modals)
  'xl': '0.75rem',    // 12px (feature elements)
  '2xl': '1rem',      // 16px (hero elements)
  'full': '9999px',   // Full circle (avatars, badges)
}
```

**Usage Guidelines:**
- Buttons: `rounded` (4px)
- Inputs: `rounded` (4px)
- Cards: `rounded-lg` (8px)
- Modals: `rounded-lg` (8px)
- Badges: `rounded-full` (full circle)
- Avatars: `rounded-full`

### Motion & Transitions

**Transition Tokens:**
```javascript
transitionDuration: {
  '75': '75ms',
  '100': '100ms',
  '150': '150ms',
  '200': '200ms',   // Default for most UI
  '300': '300ms',
  '500': '500ms',
  '700': '700ms',
  '1000': '1000ms',
}

transitionTimingFunction: {
  'ease-in': 'cubic-bezier(0.4, 0, 1, 1)',
  'ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
  'ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',  // Default
}
```

**Animation Guidelines:**
- **NEVER use `transition-all`**: Specify exact properties
- **Hover states**: `transition-shadow duration-200` or `transition-colors duration-200`
- **Modal enter/exit**: `transition-opacity duration-300`
- **Drawer slide**: `transition-transform duration-300`
- **Subtle interactions**: 150-200ms
- **Panel animations**: 300ms
- **Large movements**: 500ms (max)

**Usage:**
```tsx
// Button hover
<button className="bg-primary-500 hover:bg-primary-600 transition-colors duration-200">
  Save
</button>

// Card hover elevation
<div className="shadow-sm hover:shadow-md transition-shadow duration-200">
  {/* Card content */}
</div>

// Modal fade-in
<div className="opacity-0 transition-opacity duration-300 data-[enter]:opacity-100">
  {/* Modal content */}
</div>
```
