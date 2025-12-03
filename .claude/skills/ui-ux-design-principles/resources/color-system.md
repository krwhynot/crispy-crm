# Color System (OKLCH)

## Purpose

OKLCH color model provides perceptually uniform colors with built-in accessibility and seamless light/dark mode support. The "Garden to Table" theme uses forest green, clay terracotta, and warm cream for an organic, earthy aesthetic.

## Why OKLCH?

### Perceptual Uniformity

Unlike RGB or HSL, OKLCH maintains consistent perceived brightness across different hues.

```css
/* These appear equally bright to the human eye */
--brand-500: oklch(38% 0.085 142);      /* Forest green */
--accent-clay-500: oklch(63% 0.095 72); /* Clay orange (appears brighter, higher L) */
--success-default: oklch(56% 0.115 155); /* Emerald (even brighter) */
```

**OKLCH Format:** `oklch(L% C H / alpha)`
- **L (Lightness):** 0% (black) to 100% (white)
- **C (Chroma):** 0 (gray) to ~0.4 (vivid color)
- **H (Hue):** 0-360 degrees (red=0°, yellow=90°, green=142°, blue=270°)
- **Alpha:** Optional transparency (0-1)

### Accessibility Built-In

Lightness (L) maps directly to WCAG contrast ratios:

```css
/* White text on forest green = 10.8:1 contrast (WCAG AAA) */
--primary: oklch(38% 0.085 142);
--primary-foreground: oklch(99% 0 0);

/* Predictable contrast: L=97.5% vs L=20% ≈ 17:1 */
--background: oklch(97.5% 0.01 92);
--foreground: oklch(20% 0.012 85);
```

### Light/Dark Mode Ready

Same color definitions work in both modes by adjusting semantic mappings:

```css
/* Light mode */
--background: oklch(97.5% 0.01 92);  /* Paper cream */
--foreground: oklch(20% 0.012 85);   /* Dark text */

/* Dark mode (future) */
--background: oklch(15% 0.01 92);    /* Dark cream */
--foreground: oklch(95% 0.01 85);    /* Light text */
```

## Color Scale Structure

Atomic CRM uses three primary color families, all optimized for the warm cream background:

- **Brand Colors:** Forest Green (Hue 142°) - Primary identity
- **Accent Colors:** Clay/Terracotta (Hue 72°) - Warm emphasis
- **Neutral Colors:** Warm Gray (Hue 92°) - Paper cream undertone

Each family includes multiple lightness values for different UI states (hover, active, disabled).

## Atomic CRM Semantic Palette

**Mandatory semantic utilities per unified design system** (docs/plans/2025-11-16-unified-design-system-rollout.md:295-308):

### Page & Container Backgrounds
- `bg-muted` - Page background (light, airy)
- `bg-card` - Content containers (white, elevated)
- `bg-background` - Nested content (warm cream)

### Interactive & Status
- `bg-primary` - Primary actions (forest green)
- `bg-secondary` - Secondary actions (neutral)
- `bg-destructive` - Delete/error actions
- `bg-success` - Success states
- `bg-warning` - Warning states
- `bg-accent` - Emphasis and highlights

### Text Colors
- `text-foreground` - Primary text (dark, high contrast)
- `text-muted-foreground` - Secondary text (lower emphasis)
- `text-primary` - Brand text (forest green)
- `text-destructive` - Error text

### Borders & Dividers
- `border-border` - Default borders (subtle)
- `border-primary` - Focus/active states
- `border-destructive` - Error states

**NEVER USE:**
- Hex codes: `#FF6600`, `#FEFEF9`
- Inline OKLCH: `text-[color:var(--brand-500)]`
- CSS variable syntax: `bg-[var(--warning)]`

**ALWAYS USE:**
- Semantic utilities: `bg-card`, `text-muted-foreground`, `border-border`

### Premium Interactive Utilities

Reference `src/index.css` for reusable utilities (docs/plans/2025-11-16-unified-design-system-rollout.md:346-398):
- `.card-container` - Standard card with shadow-sm
- `.create-form-card` - Create form elevation (shadow-lg)
- `.interactive-card` - Hover effects + lift animation
- `.table-row-premium` - Table rows with premium styling
- `.focus-ring` - Focus indicators

## Performance Notes

- OKLCH is native CSS (zero runtime cost)
- Browser support: All modern browsers (2023+)
- Fallback: Not needed for Atomic CRM (target: iPad Safari, Chrome)
- Color calculations: Compile-time only (Tailwind)

## Best Practices

### DO
✅ Use semantic color utilities (`text-muted-foreground`, `bg-primary`)
✅ Maintain WCAG AA contrast (4.5:1 for text)
✅ Use status colors with icons + text (not color alone)
✅ Keep warm undertone throughout (hue 92° family)
✅ Use OKLCH for all custom colors
✅ Test on cream background (`--background`)
✅ Use elevation system for depth (not color alone)

### DON'T
❌ Use hex codes (`#336600`) - use semantic tokens
❌ Use inline CSS variable syntax (`text-[color:var(--brand-500)]`)
❌ Create low-contrast combinations (<4.5:1 text)
❌ Mix cool grays with warm cream (visual dissonance)
❌ Use RGB/HSL (not perceptually uniform)
❌ Rely on color alone for meaning
❌ Skip accessibility testing

## Detailed Documentation

For comprehensive details, see:
- [Brand & Accent Colors](color-brand-accent.md) - Forest green, clay terracotta scales
- [Status & Semantic Colors](color-status-semantic.md) - Success, warning, error, info states
- [Charts & Tags](color-charts-tags.md) - Data visualization and tag palettes

## Related Resources

- [Design Tokens](design-tokens.md) - Spacing and sizing tokens
- [Typography](typography.md) - Font sizing and text colors
- [Elevation](elevation.md) - Shadow system details
- [Component Architecture](component-architecture.md) - Using colors in components
