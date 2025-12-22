# Dark Mode Implementation Best Practices

> Industry Standards, WCAG Requirements, and next-themes Implementation Guide

## Table of Contents

1. [Industry Standards](#industry-standards)
2. [WCAG Accessibility Requirements](#wcag-accessibility-requirements)
3. [next-themes Best Practices](#next-themes-best-practices)
4. [Tailwind CSS Integration](#tailwind-css-integration)
5. [Flash Prevention (FOUC)](#flash-prevention-fouc)
6. [Hydration Safety](#hydration-safety)
7. [UX Design Principles](#ux-design-principles)
8. [Implementation Checklist](#implementation-checklist)

---

## Industry Standards

### MUST Follow

| Requirement | Standard | Description |
|-------------|----------|-------------|
| **System Preference Detection** | CSS Media Query Level 5 | Use `prefers-color-scheme` to detect user's OS preference |
| **User Override Capability** | UX Best Practice | Allow users to override system preference with explicit choice |
| **Persistence** | Web Storage API | Store user's explicit choice in `localStorage` |
| **No Flash on Load** | Performance/UX | Prevent Flash of Unstyled Content (FOUC) during page load |
| **Sync Across Tabs** | UX Best Practice | Theme changes should sync across browser tabs/windows |
| **Browser UI Theming** | CSS `color-scheme` | Set `color-scheme` property to style native browser elements |

### SHOULD Follow

| Recommendation | Rationale |
|----------------|-----------|
| Three-way toggle (Light/Dark/System) | Respects user autonomy while honoring OS preferences |
| Disable transitions during theme switch | Prevents jarring visual inconsistencies |
| Semantic color tokens | Enables maintainable, consistent theming |
| CSS custom properties (variables) | Runtime theme switching without page reload |

---

## WCAG Accessibility Requirements

### Color Contrast (WCAG 2.1 Level AA) - MUST

| Element Type | Minimum Contrast Ratio | Notes |
|--------------|----------------------|-------|
| **Normal Text** (< 18pt) | **4.5:1** | Against background color |
| **Large Text** (≥ 18pt or 14pt bold) | **3:1** | Against background color |
| **UI Components & Graphics** | **3:1** | Buttons, icons, form controls |
| **Focus Indicators** | **3:1** | Against adjacent colors |

### WCAG 2.1 Level AAA (Enhanced) - SHOULD

| Element Type | Enhanced Contrast Ratio |
|--------------|------------------------|
| Normal Text | **7:1** |
| Large Text | **4.5:1** |

### Dark Mode Specific Accessibility

```
MUST:
├── Maintain same contrast ratios in dark mode as light mode
├── Links must be distinguishable by more than just color (WCAG 1.4.1)
├── Focus states must remain visible and meet contrast requirements
├── Error states must be perceivable (not rely solely on red color)
└── Text must remain readable (avoid pure white #FFFFFF on pure black #000000)

SHOULD:
├── Use slightly off-white text (~#E0E0E0 to #F5F5F5) to reduce eye strain
├── Use slightly off-black backgrounds (~#121212 to #1A1A1A) for comfort
└── Test with color blindness simulators in both modes
```

### Avoid High Contrast Fatigue

Per Ant Design's research:
> "Avoid using highly contrasting colors or content in dark mode. Continuous use will bring fatigue."

**Recommended dark mode surface colors:**
- Background: `#121212` to `#1E1E1E` (not pure `#000000`)
- Text: `#E0E0E0` to `#F5F5F5` (not pure `#FFFFFF`)
- Elevated surfaces: Slightly lighter than base background

---

## next-themes Best Practices

### Installation & Setup

```bash
npm install next-themes
```

### Basic Configuration (MUST)

```tsx
// app/layout.tsx (App Router)
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider
          attribute="class"           // Use 'class' for Tailwind
          defaultTheme="system"        // Respect OS preference
          enableSystem={true}          // Enable system theme detection
          enableColorScheme={true}     // Style native browser UI
          disableTransitionOnChange    // Prevent jarring transitions
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Critical: `suppressHydrationWarning`

```tsx
// MUST add to <html> element to prevent React hydration warnings
<html suppressHydrationWarning>
```

This is required because next-themes modifies the `html` element before React hydrates, causing a mismatch.

### ThemeProvider Props Reference

| Prop | Default | Description | Required |
|------|---------|-------------|----------|
| `attribute` | `"data-theme"` | HTML attribute to set (`"class"` for Tailwind) | For Tailwind |
| `defaultTheme` | `"system"` | Initial theme if no preference stored | Recommended |
| `enableSystem` | `true` | Detect `prefers-color-scheme` | Recommended |
| `enableColorScheme` | `true` | Set CSS `color-scheme` property | Recommended |
| `storageKey` | `"theme"` | localStorage key for persistence | Optional |
| `disableTransitionOnChange` | `false` | Disable CSS transitions during switch | Recommended |
| `forcedTheme` | - | Force specific theme (overrides user) | For special pages |
| `themes` | `['light', 'dark']` | Available theme names | For custom themes |

### useTheme Hook

```tsx
import { useTheme } from 'next-themes'

const ThemeToggle = () => {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme()

  // theme: Current theme name ('light', 'dark', 'system')
  // setTheme: Function to change theme
  // resolvedTheme: Actual theme when 'system' (either 'light' or 'dark')
  // systemTheme: OS preference regardless of current theme
}
```

---

## Tailwind CSS Integration

### Configuration (MUST)

```js
// tailwind.config.js
module.exports = {
  darkMode: 'selector',  // or 'class' for Tailwind < 3.4.1
  // ...
}
```

### ThemeProvider Setup for Tailwind

```tsx
<ThemeProvider attribute="class">
```

### Using Dark Mode Classes

```tsx
// Tailwind dark: variant automatically works
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-gray-100">
    Content adapts to theme
  </p>
</div>
```

### CSS color-scheme Property

The `color-scheme` property tells the browser which color schemes the element can be rendered in, affecting:
- Form controls (inputs, selects, checkboxes)
- Scrollbars
- CSS system colors

```css
/* Tailwind v4 utilities */
.scheme-light { color-scheme: light; }
.scheme-dark { color-scheme: dark; }
.scheme-light-dark { color-scheme: light dark; }
```

```tsx
// Apply to html element
<html className="scheme-light dark:scheme-dark">
```

---

## Flash Prevention (FOUC)

### The Problem

Without proper handling, users see a "flash" of the wrong theme during page load, especially with SSR/SSG.

### Solution: Inline Script (How next-themes Works)

next-themes automatically injects a blocking script that:
1. Reads localStorage before paint
2. Checks `prefers-color-scheme` if no stored preference
3. Sets the correct attribute on `<html>` immediately

**This is automatic with next-themes - no additional code needed.**

### Manual Implementation (If Not Using next-themes)

```html
<!-- Add to <head> as blocking script -->
<script>
  document.documentElement.classList.toggle(
    "dark",
    localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
       window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
</script>
```

### Best Practices

| Practice | Rationale |
|----------|-----------|
| Inline script in `<head>` | Executes before first paint |
| Keep script minimal | Avoid blocking render |
| Check localStorage first | User preference takes priority |
| Fall back to system preference | Respects OS settings |

---

## Hydration Safety

### The Problem

Server-rendered HTML doesn't know the client's theme preference, causing hydration mismatches.

### MUST: Delay Theme-Dependent UI Until Mounted

```tsx
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'

const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // MUST: Only render theme UI after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Return placeholder or null during SSR
  if (!mounted) {
    return <div className="w-8 h-8" /> // Skeleton placeholder
  }

  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? '🌙' : '☀️'}
    </button>
  )
}
```

### Alternative: Dynamic Import

```tsx
import dynamic from 'next/dynamic'

const ThemeToggle = dynamic(() => import('./ThemeToggle'), {
  ssr: false,
  loading: () => <div className="w-8 h-8" /> // Placeholder
})
```

### Theme-Dependent Images

```tsx
function ThemedImage() {
  const { resolvedTheme } = useTheme()

  // Use CSS to show/hide instead of conditional rendering
  return (
    <>
      <div data-hide-on-theme="dark">
        <Image src="/light-logo.png" alt="Logo" />
      </div>
      <div data-hide-on-theme="light">
        <Image src="/dark-logo.png" alt="Logo" />
      </div>
    </>
  )
}
```

```css
[data-theme='dark'] [data-hide-on-theme='dark'],
[data-theme='light'] [data-hide-on-theme='light'] {
  display: none;
}
```

---

## UX Design Principles

### Ant Design's Dark Mode Principles

1. **Comfort of Content**
   - Avoid harsh contrasts that cause eye fatigue
   - Use softer whites and grays

2. **Consistency of Information**
   - Maintain visual hierarchy from light mode
   - Don't invert importance relationships

### Color Palette Considerations

| Light Mode | Dark Mode | Purpose |
|------------|-----------|---------|
| `#FFFFFF` | `#121212` - `#1E1E1E` | Background |
| `#000000` | `#E0E0E0` - `#F5F5F5` | Primary text |
| `#666666` | `#A0A0A0` - `#B0B0B0` | Secondary text |
| Brand color | Adjusted brand color | May need lightening in dark mode |

### Elevation in Dark Mode

Unlike light mode (which uses shadows), dark mode uses **surface lightening** to show elevation:

```css
/* Dark mode elevation */
--surface-0: #121212;   /* Base */
--surface-1: #1E1E1E;   /* Elevated (cards) */
--surface-2: #252525;   /* Higher elevation */
--surface-3: #2C2C2C;   /* Highest elevation (modals) */
```

### User Control Best Practices

| Feature | Implementation |
|---------|----------------|
| Clear toggle UI | Visible, accessible button/switch |
| System option | Allow "follow system" choice |
| Immediate feedback | Theme changes instantly |
| Persistent choice | Survives page refresh and sessions |

---

## Implementation Checklist

### MUST Have (Required)

- [ ] `prefers-color-scheme` media query support
- [ ] User preference persistence (localStorage)
- [ ] No flash of wrong theme on load (FOUC prevention)
- [ ] WCAG AA contrast ratios (4.5:1 text, 3:1 UI)
- [ ] `suppressHydrationWarning` on `<html>`
- [ ] Mounted check before rendering theme-dependent UI
- [ ] CSS `color-scheme` property for native elements
- [ ] Semantic color tokens (not hardcoded values)

### SHOULD Have (Recommended)

- [ ] Three-way toggle (Light/Dark/System)
- [ ] `disableTransitionOnChange` to prevent jarring switches
- [ ] Cross-tab synchronization
- [ ] Accessible toggle with proper ARIA labels
- [ ] Skeleton/placeholder during hydration
- [ ] Touch-friendly toggle (44x44px minimum)

### NICE to Have (Optional)

- [ ] Keyboard shortcut for theme toggle
- [ ] Smooth transition animation (after initial load)
- [ ] Theme-specific images/assets
- [ ] Custom themes beyond light/dark
- [ ] Forced theme for specific pages (e.g., marketing)

---

## Sources

- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [Tailwind CSS Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [Tailwind CSS color-scheme](https://tailwindcss.com/docs/color-scheme)
- [WCAG 2.1 Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Ant Design Dark Mode Specification](https://ant.design/docs/spec/dark)
- [axe-core Accessibility Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [React useEffect - Server/Client Content](https://react.dev/reference/react/useEffect#displaying-different-content-on-the-server-and-the-client)
