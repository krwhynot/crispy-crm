# UI & Styling Best Practices Report

**Technology Stack Analysis for Crispy CRM**

This document compiles industry standards, best practices, and must-follow guidelines for the UI & styling technologies used in Crispy CRM.

---

## Table of Contents

1. [Tailwind CSS v4](#tailwind-css-v4)
   - Container Queries, @starting-style, CSS-First Config
2. [shadcn/ui](#shadcnui)
   - CLI 3.0, Registry API, Components
3. [Radix UI](#radix-ui)
4. [Lucide React Icons](#lucide-react-icons)
5. [class-variance-authority (CVA)](#class-variance-authority-cva)
6. [tailwind-merge](#tailwind-merge)
   - extendTailwindMerge for Custom Classes
7. [Design System Fundamentals](#design-system-fundamentals)
8. [Accessibility Standards (WCAG)](#accessibility-standards-wcag)
9. [React Admin Theming](#react-admin-theming)
   - Built-in Themes, Dark Mode, Component Overrides
10. [Loading State Patterns](#loading-state-patterns)
11. [Animation Patterns](#animation-patterns)
12. [Error State Patterns](#error-state-patterns)

---

## Tailwind CSS v4

**Version: 4.1.11** | **Purpose: Utility-first CSS with OKLCH colors**

### Must-Follow Guidelines

#### 1. Use OKLCH Color Format
Tailwind v4 uses OKLCH (Oklab Lightness Chroma Hue) for perceptually uniform colors:

```css
/* ✅ CORRECT - OKLCH colors */
:root {
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --destructive: oklch(0.577 0.245 27.325);
}

/* ❌ WRONG - Raw hex or HSL */
:root {
  --primary: #1a1a1a;
  --primary-foreground: hsl(0 0% 98%);
}
```

**Why OKLCH?**
- Perceptually uniform: 10% lightness change looks the same across all colors
- Wider gamut support for modern displays
- Better color mixing and interpolation

#### 2. Semantic Color Tokens Over Raw Values

```tsx
/* ✅ CORRECT */
<div className="bg-background text-foreground" />
<div className="bg-primary text-primary-foreground" />
<div className="text-muted-foreground" />
<div className="bg-destructive" />

/* ❌ WRONG */
<div className="bg-gray-100 text-gray-900" />
<div className="bg-green-600 text-white" />
<div className="text-gray-500" />
<div className="bg-red-500" />
```

#### 3. CSS Variables with @theme inline

```css
/* Define variables in :root and .dark */
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
}

/* Expose to Tailwind with @theme inline */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}
```

#### 4. Color Opacity Syntax

```tsx
/* Use the /opacity syntax */
<div className="bg-black/75" />      /* 75% opacity */
<div className="bg-sky-500/10" />    /* 10% opacity */
<div className="border-white/20" />  /* 20% opacity */
```

#### 5. Dark Mode with `dark:` Variant

```tsx
<div className="bg-white dark:bg-gray-800">
  <h3 className="text-gray-900 dark:text-white">Title</h3>
  <p className="text-gray-500 dark:text-gray-400">Description</p>
</div>
```

#### 6. Use `size-*` Utility (v3.4+)

```tsx
/* ✅ CORRECT - Tailwind v4 */
<Icon className="size-4" />
<Avatar className="size-11" />

/* ❌ OUTDATED */
<Icon className="w-4 h-4" />
<Avatar className="w-11 h-11" />
```

### Best Practices

| Do | Don't |
|---|---|
| Use semantic tokens (`bg-primary`) | Use color scales (`bg-blue-500`) |
| Define colors in CSS variables | Hardcode colors inline |
| Use OKLCH for custom colors | Use hex or RGB for custom colors |
| Leverage `@theme inline` directive | Mix variable definition approaches |
| Use `size-*` for equal width/height | Use separate `w-*` and `h-*` |

### Modern CSS Features (v4)

#### 7. Container Queries (Native in v4)

Container queries allow styling based on parent container size instead of viewport:

```tsx
/* Parent must be a container */
<div className="@container">
  {/* Child responds to container width */}
  <div className="block @lg:flex @xl:grid">
    {/* Switches layout based on container, not viewport */}
  </div>
</div>
```

**Container Size Reference:**
| Name | Value |
|------|-------|
| `@xs` | 20rem (320px) |
| `@sm` | 24rem (384px) |
| `@md` | 28rem (448px) |
| `@lg` | 32rem (512px) |
| `@xl` | 36rem (576px) |
| `@2xl` | 42rem (672px) |

**Named Containers:**
```tsx
<div className="@container/sidebar">
  <div className="@lg/sidebar:hidden">
    {/* Responds to sidebar container specifically */}
  </div>
</div>
```

#### 8. @starting-style for Entry Animations

Animate elements when they first appear (e.g., popovers, dialogs):

```tsx
/* ✅ CSS-only entry animation */
<div
  popover
  className="
    opacity-0
    transition-all
    duration-300
    open:opacity-100
    starting:open:opacity-0
    transition-discrete
  "
>
  Fades in when opened
</div>
```

**Key Classes:**
- `starting:` - Applies styles at the starting point of a transition
- `transition-discrete` - Required for animating `display` and `visibility`
- `open:` - Targets the open state of popovers/dialogs

#### 9. CSS-First Configuration

Tailwind v4 uses `@import` and `@theme` instead of JavaScript config:

```css
/* app.css - Tailwind v4 approach */
@import "tailwindcss";

@theme {
  /* Define custom values directly in CSS */
  --color-brand: oklch(0.6 0.2 250);
  --font-display: "Cal Sans", sans-serif;
  --spacing-18: 4.5rem;
}
```

---

## shadcn/ui

**Version: N/A (copy-paste)** | **Purpose: Accessible component library built on Radix**

### Core Principles

#### 1. Open Code Philosophy
shadcn/ui provides actual component code, not a black-box library:

- **Full Transparency:** You own and see all component code
- **Easy Customization:** Modify any part directly
- **AI Integration:** Code is readable by LLMs for improvements

#### 2. Composition Pattern
Every component shares a common, composable interface:

```tsx
/* Components use consistent API patterns */
<Button variant="destructive" size="lg">
  Delete
</Button>

<Input type="email" placeholder="Email" />

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

#### 3. data-slot Attributes (Tailwind v4)
All primitives now include `data-slot` for styling:

```tsx
function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"  /* ✅ Required for styling */
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  )
}
```

### Semantic Token Convention

shadcn/ui uses a `background`/`foreground` naming convention:

```css
/* background = bg color, foreground = text color */
--primary: oklch(0.205 0 0);           /* Used with bg-primary */
--primary-foreground: oklch(0.985 0 0); /* Used with text-primary-foreground */
```

### Complete Variable Reference

```css
:root {
  /* Core */
  --background, --foreground

  /* Surfaces */
  --card, --card-foreground
  --popover, --popover-foreground

  /* Actions */
  --primary, --primary-foreground
  --secondary, --secondary-foreground
  --destructive  /* No foreground - uses primary-foreground */

  /* UI Elements */
  --muted, --muted-foreground
  --accent, --accent-foreground
  --border, --input, --ring

  /* Charts */
  --chart-1 through --chart-5

  /* Sidebar (if used) */
  --sidebar, --sidebar-foreground
  --sidebar-primary, --sidebar-primary-foreground
  --sidebar-accent, --sidebar-accent-foreground
  --sidebar-border, --sidebar-ring

  /* Layout */
  --radius: 0.625rem;
}
```

### Must-Follow Guidelines

1. **Use CSS Variables (recommended):** Set `tailwind.cssVariables: true` in `components.json`
2. **Never modify Radix primitives directly:** Wrap with your own components
3. **Follow the cn() utility pattern:** For class merging with `clsx` + `tailwind-merge`

```tsx
import { cn } from "@/lib/utils"

function Button({ className, ...props }) {
  return (
    <button
      className={cn("base-classes", className)}
      {...props}
    />
  )
}
```

### CLI 3.0 & Registry API (2025)

#### Installing Components

```bash
# Initialize project with Tailwind v4
npx shadcn init

# Add components (with dependencies auto-installed)
npx shadcn add button card dialog

# Install from remote registry URL
npx shadcn add https://acme.com/registry/navbar.json
```

#### components.json Configuration

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

#### Registry Schema for Custom Components

You can distribute your own components via the registry schema:

```json
{
  "name": "custom-button",
  "type": "registry:ui",
  "dependencies": ["@radix-ui/react-slot"],
  "files": [
    {
      "path": "ui/custom-button.tsx",
      "content": "// component code here",
      "type": "registry:ui"
    }
  ],
  "tailwind": {
    "config": {
      "theme": {
        "extend": {
          "keyframes": { /* custom animations */ }
        }
      }
    }
  }
}
```

### Available Components (2025)

**Core:** Button, Input, Label, Textarea, Select, Checkbox, Radio Group, Switch, Slider
**Overlays:** Dialog, Drawer, Popover, Tooltip, Sheet, Alert Dialog
**Navigation:** Tabs, Navigation Menu, Breadcrumb, Pagination, Sidebar
**Data Display:** Card, Table, Avatar, Badge, Separator, Skeleton
**Feedback:** Alert, Toast (Sonner), Progress
**Layout:** Accordion, Collapsible, Resizable, Scroll Area, Aspect Ratio
**Forms:** Form (react-hook-form), Calendar, Date Picker, Combobox, Command

---

## Radix UI

**Version: Various** | **Purpose: Accessible headless components**

### Accessibility Standards (WAI-ARIA)

Radix implements [WAI-ARIA authoring practices](https://www.w3.org/TR/wai-aria-practices-1.2/):

#### 1. Automatic ARIA Attributes
Radix handles `aria` and `role` attributes automatically:

```tsx
/* Radix Dialog automatically provides: */
/* - role="dialog" */
/* - aria-modal="true" */
/* - aria-labelledby (linked to title) */
/* - aria-describedby (linked to description) */
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogTitle>Accessible Title</DialogTitle>
    <DialogDescription>Accessible description</DialogDescription>
  </DialogContent>
</Dialog>
```

#### 2. Keyboard Navigation
Built-in keyboard support per WAI-ARIA specs:

| Component | Keyboard Support |
|-----------|-----------------|
| Dialog | Escape to close, Tab trapping |
| Dropdown Menu | Arrow keys, Enter/Space to select |
| Tabs | Arrow keys to switch, Home/End |
| Select | Arrow keys, type-ahead search |
| Accordion | Arrow keys, Enter/Space to toggle |

#### 3. Focus Management
Radix automatically manages focus:

- **AlertDialog:** Focus moves to Cancel button on open
- **Dialog:** Focus trapped within modal
- **Dropdown:** Focus returns to trigger on close
- **Popover:** Focus moves to content on open

### Must-Follow Guidelines

#### Always Provide Accessible Labels

```tsx
/* ✅ CORRECT - Use Label primitive */
import { Label } from "@radix-ui/react-label"

<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />

/* For non-form controls, use aria-label or aria-labelledby */
<Dialog>
  <DialogContent aria-labelledby="dialog-title">
    <DialogTitle id="dialog-title">Title</DialogTitle>
  </DialogContent>
</Dialog>
```

#### Never Override Radix Accessibility Features

```tsx
/* ❌ WRONG - Don't remove focus styles */
<DialogContent className="outline-none focus:outline-none">

/* ❌ WRONG - Don't disable keyboard handling */
<DropdownMenu onKeyDown={(e) => e.preventDefault()}>
```

### Components Available (16 Total)

**Overlays:** Dialog, Dropdown Menu, Popover, Tooltip
**Forms:** Checkbox, Label, Radio Group, Select, Switch
**Navigation:** Navigation Menu, Tabs
**Disclosure:** Accordion
**Display:** Avatar, Progress, Separator
**Utility:** Slot

---

## Lucide React Icons

**Version: 0.542.0** | **Purpose: Icon library**

### Accessibility Guidelines

#### 1. Always Provide Visible Labels
Icons should not be the sole means of conveying information:

```tsx
/* ✅ CORRECT - Icon with text */
<Button>
  <Plus className="size-4" />
  Add Document
</Button>

/* ⚠️ CAUTION - Icon-only needs accessible name */
<Button aria-label="Add document">
  <Plus className="size-4" />
</Button>
```

#### 2. Contrast Requirements (WCAG 2.1 SC 1.4.3)
Minimum 4.5:1 contrast ratio between icon and background:

```tsx
/* ✅ CORRECT */
<Check className="text-foreground" />  /* Uses semantic token */

/* ❌ WRONG - Low contrast */
<Check className="text-gray-300" />  /* May fail contrast on light bg */
```

#### 3. Don't Rely on Color Alone
Use shape/text in addition to color for meaning:

```tsx
/* ✅ CORRECT - Shape indicates state */
<CheckCircle className="text-green-600" />  /* Check = success */
<XCircle className="text-red-600" />        /* X = error */

/* ❌ WRONG - Only color differs */
<Circle className="text-green-600" />  /* Green circle = success? */
<Circle className="text-red-600" />    /* Red circle = error? */
```

#### 4. Minimum Touch Target Size (44×44px)
Interactive icons must have adequate touch targets:

```tsx
/* ✅ CORRECT - 44px touch target */
<Button size="icon" className="h-11 w-11">
  <Menu className="size-5" />
</Button>

/* ❌ WRONG - Too small for touch */
<Button size="icon" className="h-6 w-6">
  <Menu className="size-4" />
</Button>
```

#### 5. Decorative vs. Semantic Icons

```tsx
/* Decorative icons - hide from screen readers */
<Button>
  <Star aria-hidden="true" className="size-4" />
  Favorite
</Button>

/* Semantic standalone icons - need accessible name */
/* Use visually-hidden text, NOT aria-label */
<Button className="btn-icon">
  <House className="size-5" />
  <span className="sr-only">Go to home</span>  /* ✅ Tailwind sr-only */
</Button>
```

### Icon Button Pattern (Recommended)

```tsx
/* Using Radix AccessibleIcon (preferred) */
import { AccessibleIcon } from '@radix-ui/react-accessible-icon'

<AccessibleIcon label="Next item">
  <ArrowRight className="size-5" />
</AccessibleIcon>

/* Or with visually-hidden text */
<button className="h-11 w-11 flex items-center justify-center">
  <ArrowRight aria-hidden="true" className="size-5" />
  <span className="sr-only">Next item</span>
</button>
```

---

## class-variance-authority (CVA)

**Version: 0.7.1** | **Purpose: Component variants**

### Core Patterns

#### 1. Basic Variant Definition

```ts
import { cva } from "class-variance-authority"

const button = cva(
  // Base classes (always applied)
  ["font-semibold", "border", "rounded", "transition-colors"],
  {
    variants: {
      intent: {
        primary: ["bg-primary", "text-primary-foreground", "border-transparent"],
        secondary: ["bg-secondary", "text-secondary-foreground", "border-border"],
        destructive: ["bg-destructive", "text-destructive-foreground"],
      },
      size: {
        sm: ["text-sm", "py-1", "px-2"],
        md: ["text-base", "py-2", "px-4"],
        lg: ["text-lg", "py-3", "px-6"],
      },
      // Boolean variants
      disabled: {
        true: ["opacity-50", "cursor-not-allowed", "pointer-events-none"],
        false: null,
      },
    },
    // Default values
    defaultVariants: {
      intent: "primary",
      size: "md",
      disabled: false,
    },
  }
)

// Usage
button()                           // Default: primary, md, enabled
button({ intent: "destructive" })  // Destructive, md, enabled
button({ size: "lg", disabled: true })
```

#### 2. Compound Variants
Apply classes when multiple conditions are met:

```ts
const button = cva("...", {
  variants: {
    intent: { primary: "...", secondary: "..." },
    size: { sm: "...", md: "...", lg: "..." },
  },
  compoundVariants: [
    // Hover states based on intent
    {
      intent: "primary",
      class: "hover:bg-primary/90",
    },
    {
      intent: "secondary",
      class: "hover:bg-secondary/80",
    },
    // Special case: primary + lg = uppercase
    {
      intent: "primary",
      size: "lg",
      class: "uppercase tracking-wide",
    },
    // Target multiple variants
    {
      intent: ["primary", "secondary"],
      size: "sm",
      class: "font-medium",
    },
  ],
})
```

#### 3. TypeScript Integration

```ts
import { cva, type VariantProps } from "class-variance-authority"

const button = cva("...", { variants: {...} })

// Extract variant types
type ButtonProps = VariantProps<typeof button>
// Result: { intent?: "primary" | "secondary" | "destructive", size?: "sm" | "md" | "lg", disabled?: boolean }

// Use in component props
interface Props extends ButtonProps {
  children: React.ReactNode
}

function Button({ intent, size, disabled, children }: Props) {
  return (
    <button className={button({ intent, size, disabled })}>
      {children}
    </button>
  )
}
```

### Best Practices

| Do | Don't |
|---|---|
| Use arrays for multiple classes | Use space-separated strings (harder to read) |
| Define `defaultVariants` | Leave variants undefined (causes undefined behavior) |
| Use `compoundVariants` for complex logic | Nest ternaries in component JSX |
| Extract `VariantProps` type | Manually duplicate variant types |
| Use in SSR/SSG (static) | Ship to client unnecessarily |

### Performance Note
CVA is tiny (~1KB) but best used for static components. The classes are computed at render time, so avoid using CVA inside frequently re-rendering components.

---

## tailwind-merge

**Version: 3.3.1** | **Purpose: Class conflict resolution**

### Core Behavior

#### 1. Last Conflicting Class Wins

```ts
import { twMerge } from "tailwind-merge"

twMerge("p-5 p-2 p-4")  // → "p-4"
twMerge("text-red-500 text-blue-500")  // → "text-blue-500"
```

#### 2. Refinements Are Preserved

```ts
twMerge("p-3 px-5")  // → "p-3 px-5" (px refines p)
twMerge("inset-x-4 right-4")  // → "inset-x-4 right-4"
```

#### 3. Non-Trivial Conflict Resolution

```ts
twMerge("inset-x-px -inset-1")  // → "-inset-1"
twMerge("inline block")  // → "block"
twMerge("text-sm leading-6 text-lg/7")  // → "text-lg/7"
```

#### 4. Modifier Support

```ts
twMerge("p-2 hover:p-4")  // → "p-2 hover:p-4" (different states)
twMerge("hover:p-2 hover:p-4")  // → "hover:p-4" (same state, last wins)
twMerge("dark:bg-gray-800 dark:bg-gray-900")  // → "dark:bg-gray-900"
```

#### 5. Arbitrary Value Support

```ts
twMerge("bg-black bg-[--my-color]")  // → "bg-[--my-color]"
twMerge("grid-cols-[1fr,auto] grid-cols-2")  // → "grid-cols-2"
```

### The cn() Utility Pattern

Combine `clsx` (conditional classes) with `tailwind-merge` (conflict resolution):

```ts
// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

```tsx
// Usage in components
function Button({ className, variant, ...props }) {
  return (
    <button
      className={cn(
        "base-button-classes",
        variant === "primary" && "bg-primary text-primary-foreground",
        variant === "ghost" && "bg-transparent hover:bg-accent",
        className  // Consumer classes win
      )}
      {...props}
    />
  )
}

// Consumer can override
<Button variant="primary" className="bg-red-500" />
// Result: bg-red-500 wins over bg-primary
```

### When to Use tailwind-merge

**Use it for:**
- Component libraries where consumers pass `className`
- Composable components with variant overrides
- Preventing premature abstraction (defer variant creation)

**Don't use it for:**
- Static pages with no class conflicts
- Performance-critical hot paths (adds ~3KB)
- Components that don't accept external className

### Known Limitations

```ts
// Arbitrary properties don't merge with standard classes
twMerge("[padding:1rem] p-8")  // → "[padding:1rem] p-8" (both kept)

// Arbitrary variants don't merge with standard modifiers
twMerge("[&:focus]:ring focus:ring-4")  // → both kept
```

### Extending for Custom Classes (Tailwind v4)

When using custom theme values, configure tailwind-merge to recognize them:

```ts
// lib/utils.ts - Extended configuration
import { extendTailwindMerge } from "tailwind-merge"
import { clsx, type ClassValue } from "clsx"

const customTwMerge = extendTailwindMerge({
  extend: {
    theme: {
      // Match your @theme CSS variables
      spacing: ["gutter", "section"],  // --spacing-gutter, --spacing-section
      text: ["huge"],                   // --text-huge
    },
    classGroups: {
      // Add custom class groups
      "font-size": [{ text: ["huge", "display"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs))
}
```

**Theme Scale Mapping:**
| CSS Variable Namespace | tailwind-merge Key |
|-----------------------|-------------------|
| `--color-*` | Auto-detected (no config needed) |
| `--spacing-*` | `spacing` |
| `--text-*` | `text` |
| `--font-*` | `font` |
| `--radius-*` | `radius` |
| `--shadow-*` | `shadow` |

**Note:** Custom colors don't need configuration—tailwind-merge uses a permissive validator that accepts any color name.

### Conflicting Class Groups

For asymmetric conflicts (e.g., `px-3` overrides `pr-4` but not vice versa):

```ts
const customTwMerge = extendTailwindMerge({
  extend: {
    conflictingClassGroups: {
      // px creates conflict with pr and pl
      px: ["pr", "pl"],
      py: ["pt", "pb"],
      p: ["px", "py", "pt", "pr", "pb", "pl"],
    },
  },
})
```

---

## Design System Fundamentals

### Semantic Color Architecture

#### Token Hierarchy

```
Level 1: CSS Variables (primitives)
├── --background: oklch(1 0 0)
├── --foreground: oklch(0.145 0 0)
└── ...

Level 2: @theme inline (Tailwind tokens)
├── --color-background: var(--background)
├── --color-foreground: var(--foreground)
└── ...

Level 3: Utility Classes (usage)
├── bg-background
├── text-foreground
└── ...
```

#### Never Use Raw Values

```tsx
/* ❌ FORBIDDEN in Crispy CRM */
<div className="bg-gray-100" />
<div className="text-green-600" />
<div style={{ color: '#ff0000' }} />
<div className="bg-[#1a1a1a]" />

/* ✅ REQUIRED */
<div className="bg-background" />
<div className="text-primary" />
<div className="text-destructive" />
<div className="bg-muted" />
```

### Desktop-First Responsive Design

Crispy CRM targets desktop (1440px+) first, then iPad:

```tsx
/* Desktop-first breakpoint strategy */
<div className="
  grid-cols-3     /* Desktop default */
  lg:grid-cols-2  /* Laptop */
  md:grid-cols-1  /* iPad/Tablet */
">
```

### Touch Target Requirements

**WCAG 2.2 SC 2.5.8 - Target Size (Minimum)**

All interactive elements must have minimum 44×44px touch targets:

```tsx
/* ✅ CORRECT - 44px touch targets */
<Button className="h-11 min-w-[44px]">Click</Button>
<IconButton className="size-11">
  <Icon className="size-5" />
</IconButton>

/* ❌ WRONG - Too small */
<Button className="h-8">Click</Button>
<IconButton className="size-6">
  <Icon className="size-4" />
</IconButton>
```

**Tailwind Sizing Reference:**
- `h-11` / `w-11` / `size-11` = 44px (minimum touch)
- `h-10` / `w-10` / `size-10` = 40px (too small!)

---

## Accessibility Standards (WCAG)

### WCAG 2.2 Level AA Requirements

#### 1. Color Contrast (SC 1.4.3)
- **Normal text:** 4.5:1 minimum
- **Large text (18px+ or 14px+ bold):** 3:1 minimum
- **UI components & graphics:** 3:1 minimum

```tsx
/* Semantic tokens handle this automatically */
<p className="text-foreground">High contrast text</p>
<p className="text-muted-foreground">Lower contrast (still meets AA)</p>
```

#### 2. Target Size (SC 2.5.8)
- **Minimum:** 44×44 CSS pixels
- **Exception:** Inline links in text

```tsx
/* Apply to all interactive elements */
.touch-target {
  min-height: 44px;
  min-width: 44px;
}
```

#### 3. Focus Visible (SC 2.4.7)
All interactive elements must have visible focus indicators:

```tsx
/* Tailwind's ring utilities */
<Button className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Accessible Button
</Button>
```

#### 4. Name, Role, Value (SC 4.1.2)
Use semantic HTML and ARIA where needed:

```tsx
/* Radix handles this automatically */
<Dialog>
  <DialogTrigger>Open</DialogTrigger>
  <DialogContent>
    <DialogTitle>Required title</DialogTitle>
    <DialogDescription>Required description</DialogDescription>
  </DialogContent>
</Dialog>
```

### Accessibility Checklist

| Requirement | Implementation |
|------------|----------------|
| Keyboard navigation | Radix primitives (built-in) |
| Screen reader support | Semantic HTML + ARIA labels |
| Color contrast | Semantic tokens (pre-validated) |
| Touch targets | `h-11 w-11` minimum (44px) |
| Focus indicators | `focus-visible:ring-*` utilities |
| Motion preferences | `motion-reduce:` variant |
| Color independence | Icons + text, not color alone |

---

## React Admin Theming

**Note:** Crispy CRM uses React Admin, not Next.js. Theme management is handled via React Admin's built-in theming system based on Material UI.

### Setting Up Themes

```tsx
// src/App.tsx
import { Admin, defaultLightTheme, defaultDarkTheme } from 'react-admin';
import { deepmerge } from '@mui/utils';

// Extend the default theme with custom values
const lightTheme = deepmerge(defaultLightTheme, {
  palette: {
    primary: { main: '#2563eb' },
    secondary: { main: '#8b5cf6' },
  },
});

const darkTheme = deepmerge(defaultDarkTheme, {
  palette: {
    mode: 'dark',
    primary: { main: '#60a5fa' },
  },
});

const App = () => (
  <Admin
    dataProvider={dataProvider}
    theme={lightTheme}
    darkTheme={darkTheme}
    defaultTheme="light"  // or "dark" or "system"
  >
    {/* Resources */}
  </Admin>
);
```

### Built-In Themes (React Admin 5.x)

React Admin provides 5 built-in themes:

| Theme | Import | Description |
|-------|--------|-------------|
| **Default** | `defaultLightTheme`, `defaultDarkTheme` | Standard Material design |
| **B&W** | `bwLightTheme`, `bwDarkTheme` | High-contrast, shadcn-like |
| **Nano** | `nanoLightTheme`, `nanoDarkTheme` | Dense, minimal chrome |
| **Radiant** | `radiantLightTheme`, `radiantDarkTheme` | Generous margins, outlined |
| **House** | `houseLightTheme`, `houseDarkTheme` | Rounded, bright colors |

```tsx
import { Admin, bwLightTheme, bwDarkTheme } from 'react-admin';

// B&W theme requires Geist font
// Add to index.html: <link href="https://fonts.googleapis.com/css2?family=Geist:wght@100..900&display=swap" rel="stylesheet">

const App = () => (
  <Admin
    theme={bwLightTheme}
    darkTheme={bwDarkTheme}
  >
    {/* Resources */}
  </Admin>
);
```

### Programmatic Theme Switching

```tsx
import { useTheme } from 'react-admin';
import { Button } from '@mui/material';

function ThemeToggle() {
  const [theme, setTheme] = useTheme();

  return (
    <Button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      {theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
    </Button>
  );
}
```

### Theming Individual Components

Override styles for specific components across the app:

```tsx
import { defaultTheme } from 'react-admin';
import { deepmerge } from '@mui/utils';

const theme = deepmerge(defaultTheme, {
  components: {
    // React Admin components use Ra prefix
    RaDataTable: {
      styleOverrides: {
        root: {
          backgroundColor: 'var(--background)',
          '& .RaDataTable-headerCell': {
            backgroundColor: 'var(--muted)',
          },
        },
      },
    },
    // Material UI components
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',  // Change from 'filled' default
        size: 'small',
      },
    },
  },
});
```

### Sidebar Width Customization

```tsx
const theme = deepmerge(defaultTheme, {
  sidebar: {
    width: 280,       // Default: 240
    closedWidth: 64,  // Default: 55
  },
});
```

### CSS-Only Theme Switching (No Flash)

```tsx
/* Render both versions, CSS hides wrong one */
function ThemedLogo() {
  return (
    <>
      <img
        src="/logo-light.svg"
        className="block dark:hidden"
        alt="Logo"
      />
      <img
        src="/logo-dark.svg"
        className="hidden dark:block"
        alt="Logo"
      />
    </>
  )
}
```

---

## Loading State Patterns

### Skeleton Components

Use skeletons to reduce perceived load time and prevent layout shift:

```tsx
import { Skeleton } from "@/components/ui/skeleton"

/* ✅ Match the shape of what's loading */
function ContactCardSkeleton() {
  return (
    <div className="flex items-center gap-4">
      {/* Avatar skeleton - circular */}
      <Skeleton className="size-12 rounded-full" />

      {/* Text skeleton - matches typography height */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-[200px]" />
        <Skeleton className="h-3 w-[150px]" />
      </div>
    </div>
  )
}
```

### Skeleton Variants

```tsx
/* Text - uses font size for height */
<Skeleton className="h-4 w-full" />           {/* Body text */}
<Skeleton className="h-6 w-3/4" />            {/* Heading */}

/* Shapes */
<Skeleton className="size-10 rounded-full" /> {/* Avatar */}
<Skeleton className="h-32 w-full rounded-lg" /> {/* Card/Image */}

/* Animation variants */
<Skeleton className="animate-pulse" />         {/* Default pulsate */}
<Skeleton className="animate-none" />          {/* Static */}
```

### Loading States with Suspense

```tsx
import { Suspense } from 'react'

function ContactList() {
  return (
    <Suspense fallback={<ContactListSkeleton />}>
      <ContactListContent />
    </Suspense>
  )
}

/* Infer dimensions from children */
function AvatarWithSkeleton({ src, loading }) {
  return loading ? (
    <Skeleton className="size-12 rounded-full">
      <Avatar className="size-12" />  {/* Skeleton infers size */}
    </Skeleton>
  ) : (
    <Avatar src={src} className="size-12" />
  )
}
```

### Accessibility for Loading States

```tsx
/* Announce loading state to screen readers */
<div role="status" aria-label="Loading contacts">
  <ContactListSkeleton />
  <span className="sr-only">Loading...</span>
</div>

/* Or use aria-busy on the container */
<div aria-busy={isLoading}>
  {isLoading ? <Skeleton /> : <Content />}
</div>
```

---

## Animation Patterns

### Tailwind Animation Utilities

```tsx
/* Built-in animations */
<Spinner className="animate-spin" />
<Alert className="animate-pulse" />
<Modal className="animate-bounce" />

/* Duration and timing */
<div className="animate-pulse duration-1000" />
<div className="animate-spin ease-linear" />
```

### Reduced Motion Support (CRITICAL for Accessibility)

Always respect user preferences for reduced motion:

```tsx
/* ✅ CORRECT - Disable animations for users who prefer reduced motion */
<div className="animate-bounce motion-reduce:animate-none" />

/* Or provide alternative */
<div className="
  animate-pulse
  motion-reduce:animate-none
  motion-reduce:opacity-70
" />
```

```css
/* In CSS - use the media query */
@media (prefers-reduced-motion: reduce) {
  .animated-element {
    animation: none;
    transition: none;
  }
}
```

### Entry/Exit Animations with Tailwind

```tsx
/* Using Tailwind's transition utilities */
<Dialog>
  <DialogContent className="
    transition-all
    duration-200
    data-[state=open]:animate-in
    data-[state=closed]:animate-out
    data-[state=closed]:fade-out-0
    data-[state=open]:fade-in-0
    data-[state=closed]:zoom-out-95
    data-[state=open]:zoom-in-95
  ">
    {/* Content */}
  </DialogContent>
</Dialog>
```

### Custom Keyframe Animations

```css
/* In your CSS file */
@theme {
  --animate-slide-in: slide-in 0.2s ease-out;
  --animate-slide-out: slide-out 0.2s ease-in;
}

@keyframes slide-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

@keyframes slide-out {
  from { transform: translateX(0); }
  to { transform: translateX(100%); }
}
```

```tsx
/* Use in components */
<SlideOver className="animate-slide-in" />
```

### Staggered Animations

```tsx
/* Stagger list items with animation-delay */
{items.map((item, index) => (
  <li
    key={item.id}
    className="animate-fade-in opacity-0"
    style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'forwards' }}
  >
    {item.name}
  </li>
))}
```

---

## Error State Patterns

### Form Field Errors (WCAG Compliant)

```tsx
/* ✅ CORRECT - Full accessibility support */
function FormField({ label, error, ...props }) {
  const inputId = useId()
  const errorId = `${inputId}-error`

  return (
    <div>
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "border-input",
          error && "border-destructive focus-visible:ring-destructive"
        )}
        {...props}
      />
      {error && (
        <p
          id={errorId}
          role="alert"
          className="text-sm text-destructive mt-1"
        >
          {error}
        </p>
      )}
    </div>
  )
}
```

### Error Styling Tokens

```tsx
/* Use semantic destructive tokens */
<Input className="border-destructive" />
<span className="text-destructive">Error message</span>
<Alert variant="destructive">
  <AlertDescription>Something went wrong</AlertDescription>
</Alert>

/* ❌ WRONG - Hardcoded colors */
<Input className="border-red-500" />
<span className="text-red-600">Error message</span>
```

### Error Boundaries

```tsx
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Alert variant="destructive" role="alert">
      <AlertCircle className="size-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
      <Button
        variant="outline"
        onClick={resetErrorBoundary}
        className="mt-4"
      >
        Try again
      </Button>
    </Alert>
  )
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <MyComponent />
    </ErrorBoundary>
  )
}
```

### Empty States

```tsx
function EmptyState({
  icon: Icon,
  title,
  description,
  action
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1 max-w-sm">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

/* Usage */
<EmptyState
  icon={Users}
  title="No contacts yet"
  description="Get started by adding your first contact."
  action={<Button>Add Contact</Button>}
/>
```

### Inline Validation Feedback

```tsx
/* Real-time validation with proper timing */
function ValidatedInput({ validate, ...props }) {
  const [error, setError] = useState(null)
  const [touched, setTouched] = useState(false)

  const handleBlur = (e) => {
    setTouched(true)
    const result = validate(e.target.value)
    setError(result.error)
  }

  return (
    <div>
      <Input
        onBlur={handleBlur}
        aria-invalid={touched && !!error}
        className={cn(
          touched && error && "border-destructive",
          touched && !error && "border-green-500"  // Success state
        )}
        {...props}
      />
      {touched && error && (
        <p role="alert" className="text-sm text-destructive mt-1">
          {error}
        </p>
      )}
    </div>
  )
}
```

---

## Quick Reference Card

### Crispy CRM Style Rules

```tsx
// ✅ ALWAYS
className="bg-background"           // Semantic tokens
className="text-muted-foreground"   // Semantic tokens
className="h-11 w-11"               // 44px touch targets
className="size-5"                  // New size utility

// ❌ NEVER
className="bg-gray-100"             // Raw Tailwind colors
className="text-green-600"          // Raw Tailwind colors
className="h-8 w-8"                 // Too small for touch
style={{ color: '#ff0000' }}        // Inline styles
```

### Import Pattern

```tsx
// lib/utils.ts - Required for all components
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### Component Template

```tsx
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const componentVariants = cva(
  "base-classes focus-visible:ring-2 focus-visible:ring-ring",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-4",  // 44px minimum
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

interface Props
  extends React.ComponentProps<"button">,
    VariantProps<typeof componentVariants> {}

function Component({ className, variant, size, ...props }: Props) {
  return (
    <button
      data-slot="component"
      className={cn(componentVariants({ variant, size }), className)}
      {...props}
    />
  )
}
```

---

## Sources

### Core Technologies
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Tailwind CSS v4 Beta Announcement](https://tailwindcss.com/blog/tailwindcss-v4-beta)
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [shadcn/ui Changelog](https://ui.shadcn.com/docs/changelog)
- [Radix UI Accessibility Guide](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [Lucide Icons Accessibility](https://lucide.dev/guide/advanced/accessibility)

### Utility Libraries
- [class-variance-authority Documentation](https://cva.style/docs)
- [tailwind-merge Documentation](https://github.com/dcastil/tailwind-merge)
- [tailwind-merge Configuration Guide](https://github.com/dcastil/tailwind-merge/blob/main/docs/configuration.md)

### React Admin
- [React Admin Theming](https://marmelab.com/react-admin/AppTheme.html)
- [React Admin ToggleThemeButton](https://marmelab.com/react-admin/ToggleThemeButton.html)

### Accessibility
- [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)
- [WAI-ARIA Authoring Practices 1.2](https://www.w3.org/TR/wai-aria-practices-1.2/)
- [axe-core Rule Descriptions](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [Motion Accessibility Guide](https://motion.dev/docs/react-accessibility)

### Loading & Animation
- [Material UI Skeleton Component](https://mui.com/material-ui/react-skeleton/)
- [CSS @starting-style (MDN)](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style)

---

*Document updated: December 2025*
*For: Crispy CRM UI & Styling Stack*
*Last reviewed with: Tailwind v4.1, shadcn/ui CLI 3.0, React Admin 5.x*
