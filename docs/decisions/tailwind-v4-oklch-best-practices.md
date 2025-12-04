# Tailwind CSS v4 with OKLCH Colors & next-themes: Industry Standards & Best Practices

> **Research Report** — Compiled from official Tailwind CSS documentation, next-themes documentation, W3C Design Tokens Community Group specifications, and accessibility standards.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [What is OKLCH?](#what-is-oklch)
3. [Why Tailwind v4 Uses OKLCH](#why-tailwind-v4-uses-oklch)
4. [OKLCH Component Specification](#oklch-component-specification)
5. [Browser Support Requirements](#browser-support-requirements)
6. [Configuration Best Practices](#configuration-best-practices)
7. [next-themes Integration](#next-themes-integration) ⭐ NEW
8. [Accessibility Standards](#accessibility-standards)
9. [Design Token Naming Conventions](#design-token-naming-conventions)
10. [Gamut Mapping Considerations](#gamut-mapping-considerations)
11. [Must-Follow Rules](#must-follow-rules)
12. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
13. [References](#references)

---

## Executive Summary

Tailwind CSS v4 has adopted **OKLCH as its default color space** for all built-in colors. This represents a significant shift from traditional sRGB/hex colors toward perceptually uniform color representation. This document outlines the industry standards, best practices, and must-follow rules for working with OKLCH colors in Tailwind v4.

### Key Takeaways

| Aspect | Standard |
|--------|----------|
| **Color Space** | OKLCH (Oklab Cylindrical) |
| **Configuration** | CSS-first via `@theme` directive |
| **Theme Switching** | next-themes with `attribute="class"` |
| **Browser Support** | Chrome 111+, Safari 16.4+, Firefox 128+ |
| **Contrast Ratio** | WCAG 2.1: 4.5:1 normal text, 3:1 large text |
| **Token Architecture** | Base → Alias → Component (3-tier) |

---

## What is OKLCH?

OKLCH is a **cylindrical color model** based on the Oklab color space, designed to be **perceptually uniform**. Unlike traditional color spaces (RGB, HSL), OKLCH ensures that:

- Equal changes in lightness values produce equal perceived brightness changes
- Colors with the same lightness value appear equally bright to the human eye
- Hue rotations maintain consistent saturation and brightness

### OKLCH vs Other Color Spaces

| Color Space | Perceptually Uniform | Wide Gamut | CSS Native | Recommended Use |
|-------------|---------------------|------------|------------|-----------------|
| sRGB/Hex | ❌ No | ❌ No | ✅ Yes | Legacy support |
| HSL | ❌ No | ❌ No | ✅ Yes | Quick prototyping |
| LCH | ✅ Partially | ✅ Yes | ✅ Yes | Print design |
| **OKLCH** | ✅ Yes | ✅ Yes | ✅ Yes | **Modern web (recommended)** |
| Display P3 | ❌ No | ✅ Yes | ✅ Yes | Wide-gamut displays |

---

## Why Tailwind v4 Uses OKLCH

Tailwind CSS v4 chose OKLCH for its entire default color palette because:

1. **Perceptual Uniformity**: Color scales (e.g., `gray-100` to `gray-900`) have consistent perceived lightness steps
2. **Predictable Manipulation**: Adjusting lightness or chroma produces predictable visual results
3. **Wide Gamut Ready**: OKLCH can represent colors beyond sRGB, future-proofing for Display P3 monitors
4. **CSS Native**: Modern browsers support `oklch()` function natively
5. **Better Accessibility**: Easier to calculate and maintain contrast ratios

---

## OKLCH Component Specification

### Component Structure

```
oklch(L C H)
oklch(L C H / alpha)
```

| Component | Name | Range | Description |
|-----------|------|-------|-------------|
| **L** | Lightness | `0` to `1` | 0 = black, 1 = white |
| **C** | Chroma | `0` to ~`0.4` | 0 = gray (no color), higher = more saturated |
| **H** | Hue | `0` to `360` (exclusive) | Angle on color wheel (red ≈ 25°, green ≈ 145°, blue ≈ 265°) |
| **alpha** | Opacity | `0` to `1` | Optional, defaults to 1 |

### Practical Ranges

From the W3C Design Tokens Community Group specification:

> "In OKLCH, Chroma is theoretically unbounded but **in practice doesn't exceed 0.5**. The minimum value of Chroma is 0, which represents a neutral color (gray)."

### Example Values

```css
/* Tailwind's red-500 */
--color-red-500: oklch(0.637 0.237 25.331);

/* Tailwind's blue-600 */
--color-blue-600: oklch(0.546 0.245 262.881);

/* Tailwind's gray-900 */
--color-gray-900: oklch(0.21 0.034 264.665);
```

---

## Browser Support Requirements

### Minimum Browser Versions (MUST)

Tailwind CSS v4.0 requires these minimum browser versions:

| Browser | Minimum Version | Release Date |
|---------|-----------------|--------------|
| **Chrome** | 111 | March 2023 |
| **Safari** | 16.4 | March 2023 |
| **Firefox** | 128 | July 2024 |

### Feature Detection

For graceful degradation, use CSS `@supports`:

```css
/* Fallback for older browsers */
.element {
  background-color: #3b82f6; /* sRGB fallback */
}

@supports (color: oklch(0.5 0.2 250)) {
  .element {
    background-color: oklch(0.623 0.214 259.815);
  }
}
```

---

## Configuration Best Practices

### CSS-First Configuration (MUST)

Tailwind v4 uses CSS-first configuration via the `@theme` directive:

```css
@import "tailwindcss";

@theme {
  /* Custom colors using OKLCH */
  --color-brand-50: oklch(0.99 0 0);
  --color-brand-100: oklch(0.98 0.04 145);
  --color-brand-500: oklch(0.84 0.18 145);
  --color-brand-900: oklch(0.30 0.12 145);

  /* Semantic tokens referencing base colors */
  --color-primary: var(--color-brand-500);
  --color-primary-foreground: var(--color-white);
}
```

### Referencing Colors in CSS

Colors are exposed as CSS variables in the `--color-*` namespace:

```css
@layer components {
  .card {
    background-color: var(--color-gray-50);
    border-color: var(--color-gray-200);
  }
}
```

### Opacity Adjustment (MUST USE `--alpha()`)

Tailwind v4 provides a special `--alpha()` function for opacity:

```css
/* ✅ CORRECT: Use --alpha() function */
.overlay {
  background-color: --alpha(var(--color-gray-950) / 50%);
}

/* Compiles to */
.overlay {
  background-color: color-mix(in oklab, var(--color-gray-950) 50%, transparent);
}
```

### Overriding Default Colors

```css
@theme {
  /* Override gray scale with custom values */
  --color-gray-50: oklch(0.984 0.003 247.858);
  --color-gray-100: oklch(0.968 0.007 247.896);
  --color-gray-900: oklch(0.208 0.042 265.755);
}
```

### Using a Custom Palette

To completely replace the default palette:

```css
@theme {
  /* Disable all defaults */
  --color-*: initial;

  /* Define custom palette */
  --color-white: #fff;
  --color-black: #000;
  --color-primary: oklch(0.65 0.20 145);
  --color-secondary: oklch(0.55 0.15 265);
}
```

---

## next-themes Integration

[next-themes](https://github.com/pacocoursey/next-themes) is the industry-standard solution for theme management in React/Next.js applications. It provides seamless dark mode support with zero flash on load.

### Why next-themes?

| Feature | Benefit |
|---------|---------|
| ✅ No flash on load | Script injection prevents FOUC (Flash of Unstyled Content) |
| ✅ System preference | Respects `prefers-color-scheme` automatically |
| ✅ SSR/SSG compatible | Works with Next.js App Router and Pages Router |
| ✅ Tab sync | Theme syncs across browser tabs/windows |
| ✅ Force theme per page | Marketing pages can force specific themes |
| ✅ Multiple themes | Supports any number of custom themes |

### Installation

```bash
npm install next-themes
# or
yarn add next-themes
```

### Basic Setup with Next.js App Router (MUST)

```tsx
// app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

> **IMPORTANT**: Add `suppressHydrationWarning` to `<html>` to prevent React warnings from next-themes modifying the element.

### Tailwind v4 Dark Mode Configuration (MUST)

For Tailwind CSS v4, configure dark mode using `@custom-variant`:

```css
/* app.css or globals.css */
@import "tailwindcss";

/* Enable class-based dark mode for next-themes */
@custom-variant dark (&:where(.dark, .dark *));

@theme {
  /* Light mode colors (default) */
  --color-background: oklch(0.985 0.002 247);
  --color-foreground: oklch(0.141 0.005 285);
  --color-primary: oklch(0.623 0.214 259);
  --color-primary-foreground: oklch(0.985 0.002 247);

  /* Component tokens */
  --color-card: oklch(0.985 0.002 247);
  --color-card-foreground: oklch(0.141 0.005 285);
  --color-muted: oklch(0.967 0.003 264);
  --color-muted-foreground: oklch(0.551 0.027 264);
}

/* Dark mode overrides using CSS */
.dark {
  --color-background: oklch(0.141 0.005 285);
  --color-foreground: oklch(0.985 0.002 247);
  --color-primary: oklch(0.707 0.165 254);
  --color-primary-foreground: oklch(0.141 0.005 285);

  --color-card: oklch(0.21 0.006 285);
  --color-card-foreground: oklch(0.985 0.002 247);
  --color-muted: oklch(0.274 0.006 286);
  --color-muted-foreground: oklch(0.705 0.015 286);
}
```

### Alternative: Using data-theme Attribute

If you prefer data attributes over classes:

```tsx
// app/layout.tsx
<ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
```

```css
/* app.css */
@import "tailwindcss";

@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));

[data-theme='dark'] {
  --color-background: oklch(0.141 0.005 285);
  /* ... other dark mode overrides */
}
```

### ThemeProvider Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `attribute` | `'class'` \| `'data-*'` | `'data-theme'` | HTML attribute to modify |
| `defaultTheme` | `string` | `'system'` | Default theme on first visit |
| `enableSystem` | `boolean` | `true` | Use `prefers-color-scheme` |
| `enableColorScheme` | `boolean` | `true` | Set `color-scheme` CSS property |
| `storageKey` | `string` | `'theme'` | localStorage key |
| `themes` | `string[]` | `['light', 'dark']` | Available theme names |
| `forcedTheme` | `string` | `undefined` | Force specific theme |
| `disableTransitionOnChange` | `boolean` | `false` | Disable CSS transitions during theme switch |

### useTheme Hook (MUST follow hydration safety)

```tsx
'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  // MUST: Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // MUST: Return null or skeleton until mounted
  if (!mounted) {
    return <div className="h-9 w-9" /> // Placeholder to prevent layout shift
  }

  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="h-9 w-9 rounded-md border bg-background"
      aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {resolvedTheme === 'dark' ? '🌙' : '☀️'}
    </button>
  )
}
```

### useTheme Return Values

| Property | Type | Description |
|----------|------|-------------|
| `theme` | `string` | Active theme name (`'light'`, `'dark'`, `'system'`) |
| `setTheme` | `(theme: string) => void` | Function to change theme |
| `resolvedTheme` | `string` | Actual theme when `theme` is `'system'` |
| `systemTheme` | `string` | Current system preference |
| `themes` | `string[]` | List of available themes |
| `forcedTheme` | `string \| undefined` | Forced theme if set |

### OKLCH Color Tokens for Light/Dark Themes

Follow this pattern for comprehensive theme support:

```css
@theme {
  /* ═══════════════════════════════════════════════════════════
     BASE PALETTE (Light Mode - Defined in @theme)
     ═══════════════════════════════════════════════════════════ */

  /* Backgrounds */
  --color-background: oklch(1 0 0);           /* Pure white */
  --color-foreground: oklch(0.145 0.005 285); /* Near black */

  /* Primary brand */
  --color-primary: oklch(0.623 0.214 259);
  --color-primary-foreground: oklch(0.985 0 0);

  /* Secondary */
  --color-secondary: oklch(0.967 0.003 264);
  --color-secondary-foreground: oklch(0.21 0.006 285);

  /* Muted/Subtle */
  --color-muted: oklch(0.967 0.003 264);
  --color-muted-foreground: oklch(0.551 0.027 264);

  /* Accents */
  --color-accent: oklch(0.967 0.003 264);
  --color-accent-foreground: oklch(0.21 0.006 285);

  /* Semantic: Destructive/Error */
  --color-destructive: oklch(0.577 0.245 27);
  --color-destructive-foreground: oklch(0.985 0 0);

  /* Semantic: Success */
  --color-success: oklch(0.627 0.194 149);
  --color-success-foreground: oklch(0.985 0 0);

  /* Semantic: Warning */
  --color-warning: oklch(0.769 0.188 70);
  --color-warning-foreground: oklch(0.21 0 0);

  /* Borders & Inputs */
  --color-border: oklch(0.928 0.006 264);
  --color-input: oklch(0.928 0.006 264);
  --color-ring: oklch(0.623 0.214 259);

  /* Cards & Popovers */
  --color-card: oklch(1 0 0);
  --color-card-foreground: oklch(0.145 0.005 285);
  --color-popover: oklch(1 0 0);
  --color-popover-foreground: oklch(0.145 0.005 285);
}

/* ═══════════════════════════════════════════════════════════
   DARK MODE OVERRIDES
   ═══════════════════════════════════════════════════════════ */

.dark {
  /* Backgrounds - Inverted */
  --color-background: oklch(0.145 0.005 285);
  --color-foreground: oklch(0.985 0 0);

  /* Primary - Adjusted for dark */
  --color-primary: oklch(0.707 0.165 254);
  --color-primary-foreground: oklch(0.145 0.005 285);

  /* Secondary */
  --color-secondary: oklch(0.274 0.006 286);
  --color-secondary-foreground: oklch(0.985 0 0);

  /* Muted */
  --color-muted: oklch(0.274 0.006 286);
  --color-muted-foreground: oklch(0.705 0.015 286);

  /* Accents */
  --color-accent: oklch(0.274 0.006 286);
  --color-accent-foreground: oklch(0.985 0 0);

  /* Semantic: Destructive - Brighter for dark */
  --color-destructive: oklch(0.637 0.237 25);
  --color-destructive-foreground: oklch(0.985 0 0);

  /* Semantic: Success */
  --color-success: oklch(0.696 0.17 162);
  --color-success-foreground: oklch(0.145 0.005 285);

  /* Semantic: Warning */
  --color-warning: oklch(0.828 0.189 84);
  --color-warning-foreground: oklch(0.145 0.005 285);

  /* Borders & Inputs */
  --color-border: oklch(0.274 0.006 286);
  --color-input: oklch(0.274 0.006 286);
  --color-ring: oklch(0.707 0.165 254);

  /* Cards & Popovers */
  --color-card: oklch(0.21 0.006 285);
  --color-card-foreground: oklch(0.985 0 0);
  --color-popover: oklch(0.21 0.006 285);
  --color-popover-foreground: oklch(0.985 0 0);
}
```

### Avoiding Hydration Mismatch (MUST)

The most common error with next-themes is hydration mismatch. Follow these patterns:

#### ❌ WRONG: Unsafe Theme-Dependent Rendering

```tsx
// This will cause hydration mismatch!
const { theme } = useTheme()

return <div>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
```

#### ✅ CORRECT: Safe Theme-Dependent Rendering

```tsx
const [mounted, setMounted] = useState(false)
const { theme } = useTheme()

useEffect(() => setMounted(true), [])

if (!mounted) return null // or skeleton

return <div>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</div>
```

#### ✅ CORRECT: CSS-Only Theme Switching (No Hydration Issues)

```tsx
// Use CSS to handle theme differences - no JS needed
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
  Theme-aware content
</div>
```

### Disabling Transitions During Theme Change

To prevent jarring transitions when switching themes:

```tsx
<ThemeProvider disableTransitionOnChange>
```

This temporarily disables all CSS transitions during theme switches.

### Forcing Theme on Specific Pages

For pages that should always be a specific theme (e.g., dark-only marketing page):

```tsx
// app/marketing/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function MarketingLayout({ children }) {
  return (
    <ThemeProvider forcedTheme="dark">
      {children}
    </ThemeProvider>
  )
}
```

### Multiple Custom Themes

next-themes supports any number of themes beyond light/dark:

```tsx
<ThemeProvider themes={['light', 'dark', 'forest', 'ocean', 'sunset']}>
```

```css
.forest {
  --color-primary: oklch(0.532 0.157 131);
  --color-background: oklch(0.274 0.072 132);
}

.ocean {
  --color-primary: oklch(0.715 0.143 215);
  --color-background: oklch(0.302 0.056 229);
}

.sunset {
  --color-primary: oklch(0.705 0.213 47);
  --color-background: oklch(0.266 0.079 36);
}
```

### next-themes with OKLCH: Best Practices Summary

| Rule | Requirement |
|------|-------------|
| ThemeProvider `attribute` | Use `"class"` for Tailwind v4 |
| Tailwind dark mode | Use `@custom-variant dark (&:where(.dark, .dark *))` |
| `<html>` element | Add `suppressHydrationWarning` |
| Theme UI components | Use `mounted` state check before rendering |
| Color tokens | Define in `@theme`, override in `.dark` class |
| OKLCH values | Adjust lightness (L) between themes, keep hue (H) consistent |
| Transitions | Consider `disableTransitionOnChange` for smoother UX |

---

## Accessibility Standards

### WCAG 2.1 Contrast Requirements (MUST)

| Text Type | Minimum Contrast Ratio | OKLCH Lightness Guidance |
|-----------|----------------------|--------------------------|
| **Normal text** (< 18pt) | 4.5:1 | ΔL ≥ 0.40 between text and background |
| **Large text** (≥ 18pt or 14pt bold) | 3:1 | ΔL ≥ 0.30 between text and background |
| **UI components** | 3:1 | Icons, borders, form controls |
| **AAA (enhanced)** | 7:1 / 4.5:1 | For critical content |

### Contrast Calculation in OKLCH

The lightness (L) component in OKLCH correlates with perceived brightness:

```
Approximate contrast ≈ |L_foreground - L_background| / min(L_foreground, L_background)
```

### Practical Pairing Guidelines

| Background Lightness (L) | Minimum Text Lightness for 4.5:1 |
|--------------------------|----------------------------------|
| 0.95+ (very light) | ≤ 0.45 (dark text) |
| 0.85 - 0.95 | ≤ 0.40 |
| 0.50 (mid-tone) | ≤ 0.20 OR ≥ 0.85 |
| 0.20 - 0.30 (dark) | ≥ 0.75 (light text) |
| ≤ 0.15 (very dark) | ≥ 0.70 |

### axe-core Contrast Options

When testing with axe-core, these defaults apply:

| Option | Default | Description |
|--------|---------|-------------|
| `contrastRatio.normal.expected` | 4.5 | Required ratio for normal text |
| `contrastRatio.large.expected` | 3.0 | Required ratio for large text |
| `boldTextPt` | 14pt | Minimum size for bold = large |
| `largeTextPt` | 18pt | Minimum size for large text |

---

## Design Token Naming Conventions

Based on the W3C Design Tokens Community Group specification, follow a **3-tier token architecture**:

### Tier 1: Base Tokens

Lowest-level, raw color values:

```css
@theme {
  /* Numerical scale (RECOMMENDED) */
  --color-green-100: oklch(0.96 0.05 145);
  --color-green-200: oklch(0.90 0.10 145);
  --color-green-500: oklch(0.72 0.22 145);
  --color-green-900: oklch(0.35 0.12 145);
}
```

### Tier 2: Alias/Semantic Tokens

Purpose-driven tokens referencing base tokens:

```css
@theme inline {
  /* Semantic aliases */
  --color-background-success: var(--color-green-100);
  --color-text-success: var(--color-green-900);
  --color-border-success: var(--color-green-500);

  --color-background-error: var(--color-red-100);
  --color-text-error: var(--color-red-900);
}
```

### Tier 3: Component Tokens

Component-specific tokens for separation of concerns:

```css
@theme inline {
  /* Component-specific */
  --color-button-primary-background: var(--color-primary);
  --color-button-primary-text: var(--color-primary-foreground);
  --color-button-primary-border: var(--color-primary);

  --color-badge-success-background: var(--color-background-success);
  --color-badge-success-text: var(--color-text-success);
}
```

### Naming Best Practices

| ✅ DO | ❌ DON'T |
|-------|----------|
| `--color-background-error` | `--color-bg-err` |
| `--color-text-primary` | `--color-txt-pri` |
| `--color-border-success` | `--color-bdr-suc` |
| Use full words | Use abbreviations |
| Use numerical scales (100-900) | Use sequential numbers (1-9) |
| Group by property first | Mix naming conventions |

---

## Gamut Mapping Considerations

### What is Gamut Mapping?

When colors are converted between color spaces, some colors may fall outside the displayable range (gamut) of the target space. This is especially relevant when:

- Using OKLCH colors on sRGB-only displays
- Converting between Display P3 and sRGB

### Best Practices

1. **Test on Multiple Displays**: Colors may appear differently on wide-gamut vs sRGB displays
2. **Stay Within sRGB for Critical UI**: For essential UI elements, keep chroma values moderate
3. **Use Fallbacks**: Provide sRGB hex fallbacks for critical colors

```css
:root {
  /* Safe for sRGB displays */
  --color-primary: oklch(0.65 0.18 145); /* Moderate chroma */

  /* May clip on sRGB, vivid on P3 */
  --color-accent: oklch(0.70 0.35 145); /* High chroma - use carefully */
}
```

### sRGB-Safe Chroma Limits

| Hue Range | Max sRGB-Safe Chroma |
|-----------|---------------------|
| Reds (0-30°) | ~0.25 |
| Oranges (30-60°) | ~0.22 |
| Yellows (60-110°) | ~0.20 |
| Greens (110-170°) | ~0.24 |
| Cyans (170-220°) | ~0.16 |
| Blues (220-280°) | ~0.28 |
| Purples (280-330°) | ~0.30 |
| Magentas (330-360°) | ~0.28 |

---

## Must-Follow Rules

### Configuration (MUST)

1. ✅ Use `@theme` directive for all color customization
2. ✅ Use OKLCH format for custom colors: `oklch(L C H)`
3. ✅ Use `--alpha()` function for opacity adjustments
4. ✅ Use `@theme inline` when referencing CSS custom properties
5. ✅ Disable unused colors with `--color-*: initial`

### Naming (MUST)

1. ✅ Use numerical scales (50, 100, 200... 900, 950) for color palettes
2. ✅ Use semantic names for alias tokens (primary, success, error)
3. ✅ Avoid abbreviations in token names
4. ✅ Group tokens by property first (background, text, border)

### Accessibility (MUST)

1. ✅ Maintain 4.5:1 contrast for normal text
2. ✅ Maintain 3:1 contrast for large text (18pt+ or 14pt bold)
3. ✅ Maintain 3:1 contrast for UI components and icons
4. ✅ Test with automated tools (axe-core, Lighthouse)
5. ✅ Test on both light and dark modes

### Browser Support (MUST)

1. ✅ Target Chrome 111+, Safari 16.4+, Firefox 128+
2. ✅ Provide hex fallbacks for critical colors if supporting older browsers
3. ✅ Use `@supports` for progressive enhancement

---

## Anti-Patterns to Avoid

### ❌ DON'T: Use Raw Hex/RGB in Tailwind v4

```css
/* ❌ WRONG */
@theme {
  --color-brand: #22c55e;
}

/* ✅ CORRECT */
@theme {
  --color-brand: oklch(0.723 0.219 149.579);
}
```

### ❌ DON'T: Mix Color Spaces

```css
/* ❌ WRONG: Mixing formats */
@theme {
  --color-primary: oklch(0.65 0.20 145);
  --color-secondary: hsl(265, 60%, 45%);
  --color-accent: #f59e0b;
}

/* ✅ CORRECT: Consistent OKLCH */
@theme {
  --color-primary: oklch(0.65 0.20 145);
  --color-secondary: oklch(0.50 0.18 265);
  --color-accent: oklch(0.77 0.18 70);
}
```

### ❌ DON'T: Use Opacity Syntax Directly

```css
/* ❌ WRONG */
.element {
  background: oklch(0.5 0.2 250 / 0.5);
}

/* ✅ CORRECT */
.element {
  background: --alpha(var(--color-blue-500) / 50%);
}
```

### ❌ DON'T: Ignore Gamut Limitations

```css
/* ❌ WRONG: Chroma too high, will clip on sRGB */
@theme {
  --color-vivid-green: oklch(0.80 0.45 145);
}

/* ✅ CORRECT: Within sRGB gamut */
@theme {
  --color-vivid-green: oklch(0.80 0.22 145);
}
```

### ❌ DON'T: Skip the Token Hierarchy

```css
/* ❌ WRONG: Direct use in components */
.button {
  background: oklch(0.65 0.20 145);
}

/* ✅ CORRECT: Use token references */
.button {
  background: var(--color-primary);
}
```

---

## References

### Official Documentation

1. [Tailwind CSS v4 Colors Documentation](https://tailwindcss.com/docs/colors)
2. [Tailwind CSS v4 Compatibility Guide](https://tailwindcss.com/docs/compatibility)
3. [Tailwind CSS v4 Theme Variables](https://tailwindcss.com/docs/theme)
4. [Tailwind CSS v4 Functions and Directives](https://tailwindcss.com/docs/functions-and-directives)
5. [Tailwind CSS v4 Dark Mode](https://tailwindcss.com/docs/dark-mode)

### Theme Management

6. [next-themes GitHub Repository](https://github.com/pacocoursey/next-themes)
7. [next-themes Live Example](https://next-themes-example.vercel.app/)
8. [next-themes Tailwind Example](https://next-themes-tailwind.vercel.app/)

### Specifications

9. [W3C Design Tokens Community Group - Color Type](https://github.com/design-tokens/community-group/blob/main/technical-reports/color/color-type.md)
10. [W3C Design Tokens Community Group - Token Naming](https://github.com/design-tokens/community-group/blob/main/technical-reports/color/token-naming.md)
11. [W3C Design Tokens Community Group - Gamut Mapping](https://github.com/design-tokens/community-group/blob/main/technical-reports/color/gamut-mapping.md)

### Color Science

12. [OKLAB: A Perceptually Uniform Color Space](https://bottosson.github.io/posts/oklab/) — Björn Ottosson
13. [Culori Color Spaces Documentation](https://github.com/evercoder/culori/blob/main/docs/color-spaces.md)

### Accessibility

14. [axe-core Color Contrast Options](https://github.com/dequelabs/axe-core/blob/develop/doc/check-options.md#color-contrast)
15. [WCAG 2.1 Success Criterion 1.4.3 Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-03 | 1.1 | Added next-themes integration guide |
| 2025-12-03 | 1.0 | Initial research compilation |

---

*This document was compiled from official documentation and industry specifications. Always refer to the latest Tailwind CSS documentation for the most current information.*
