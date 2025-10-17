# Component Styling Patterns Research

## Overview

This research documents the component styling patterns in Atomic CRM, focusing on how components consume CSS variables, implement variants, and apply styling patterns. The codebase follows a semantic color token system with comprehensive OKLCH-based color variables and uses class-variance-authority (CVA) for variant management. All components are built on shadcn/ui patterns with Radix UI primitives.

## Key Findings Summary

- **58 UI components** in `/home/krwhynot/projects/crispy-crm/src/components/ui/` follow consistent patterns
- **Semantic color system** using CSS variables (--primary, --brand-*, --neutral-*, etc.)
- **Focus ring pattern**: `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- **Validation states**: `aria-invalid:ring-destructive/20 aria-invalid:border-destructive`
- **Shadow system**: `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg` with card elevation variants
- **Rounded corners**: Consistent use of `rounded-md`, `rounded-lg`, `rounded-xl` with `--radius` variable
- **Dark mode**: All components support dark mode via `.dark` class and semantic tokens

## Architecture Patterns

### CSS Variable Consumption Pattern

All components consume CSS variables through Tailwind's semantic token system:

```tsx
// Pattern used throughout components
className="bg-primary text-primary-foreground"  // Interactive elements
className="bg-card text-card-foreground"        // Card surfaces
className="border-input bg-transparent"          // Form inputs
className="bg-sidebar text-sidebar-foreground"  // Navigation
```

**Key CSS Variables** (from `/home/krwhynot/projects/crispy-crm/src/index.css`):
- **Brand Colors**: `--brand-500` through `--brand-800` (OKLCH hue 125°)
- **Neutrals**: `--neutral-50` through `--neutral-900` (cool undertone, hue 284-288°)
- **Semantic Tokens**: `--primary`, `--secondary`, `--accent`, `--destructive`, `--muted`
- **State Colors**: `--success-*`, `--warning-*`, `--info-*`, `--error-*` (each with subtle/default/strong/bg/border/hover/active/disabled variants)
- **Sidebar**: `--sidebar`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring`
- **Shadow System**: `--shadow-card-1/2/3` with hover variants

### Variant Management with CVA

Components use `class-variance-authority` for variant management:

```tsx
// Example from button.tsx
const buttonVariants = cva(
  "baseline-classes transition-all disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90",
        outline: "border bg-background shadow-xs hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3",
        lg: "h-10 px-6",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
```

## Component Inventory

### 1. Button Component
**File**: `/home/krwhynot/projects/crispy-crm/src/components/ui/button.tsx`

**Variants**:
- `default` - Uses `--primary` (brand-700)
- `destructive` - Uses `--destructive` with red color
- `outline` - Border with `--background` fill
- `secondary` - Uses `--secondary` (neutral-100)
- `ghost` - Transparent with hover accent
- `link` - Text-only with underline

**Key Styling Patterns**:
```tsx
// Base classes (line 7-8)
"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all"
"disabled:pointer-events-none disabled:opacity-50"
"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"

// Shadows
"shadow-xs" // Applied to most variants

// Hover effects
"hover:bg-primary/90" // 90% opacity on hover
```

**Theme Impact**: HIGH - Primary interactive element, heavy use of `--primary`, `--destructive`, `--accent`

---

### 2. Card Component
**File**: `/home/krwhynot/projects/crispy-crm/src/components/ui/card.tsx`

**Structure**:
- Card (container)
- CardHeader (with grid layout for actions)
- CardTitle
- CardDescription
- CardContent
- CardFooter

**Key Styling Patterns**:
```tsx
// Card container (line 9-11)
"bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6"

// Description uses muted text
"text-muted-foreground text-sm"
```

**Rounded Corners**: `rounded-xl` (uses `--radius` + 4px from CSS variables)

**Theme Impact**: HIGH - Core layout component, uses `--card`, `--card-foreground`, `--muted-foreground`

---

### 3. Input Component
**File**: `/home/krwhynot/projects/crispy-crm/src/components/ui/input.tsx`

**Key Styling Patterns**:
```tsx
// Focus states (line 10-13)
"border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-xs"
"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"

// Dark mode specific
"dark:bg-input/30"

// Placeholder and selection
"placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground"
```

**Focus Ring Pattern**: 3px ring with 50% opacity of `--ring` (brand-500)

**Validation States**: Red ring and border when `aria-invalid="true"`

**Theme Impact**: CRITICAL - Forms are core to CRM, uses `--input`, `--ring`, `--destructive`, `--primary`

---

### 4. Dialog/Modal Component
**File**: `/home/krwhynot/projects/crispy-crm/src/components/ui/dialog.tsx`

**Structure**:
- Dialog (root)
- DialogOverlay (backdrop)
- DialogContent (container)
- DialogHeader/Footer
- DialogTitle/Description

**Key Styling Patterns**:
```tsx
// Overlay (line 38-40)
"fixed inset-0 z-50 bg-black/50"

// Content (line 57-59)
"bg-background rounded-lg border p-6 shadow-lg"
"fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"

// Animations
"data-[state=open]:animate-in data-[state=closed]:animate-out"
"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
"data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
```

**Shadow**: `shadow-lg` for elevation

**Theme Impact**: MEDIUM - Uses `--background`, `--muted-foreground` for descriptions

---

### 5. Select Component
**File**: `/home/krwhynot/projects/crispy-crm/src/components/ui/select.tsx`

**Key Styling Patterns**:
```tsx
// Trigger (line 37-39)
"border-input flex w-fit items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2"
"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
"data-[placeholder]:text-muted-foreground dark:bg-input/30"

// Content/Dropdown (line 61-63)
"bg-popover text-popover-foreground rounded-md border shadow-md"
"max-h-(--radix-select-content-available-height)"

// Items (line 107-109)
"focus:bg-accent focus:text-accent-foreground rounded-sm py-1.5"
```

**Theme Impact**: HIGH - Forms component, uses `--input`, `--popover`, `--accent`, `--ring`

---

### 6. Sidebar Component
**File**: `/home/krwhynot/projects/crispy-crm/src/components/ui/sidebar.tsx`

**Comprehensive Navigation System**:
- SidebarProvider (context)
- Sidebar (container)
- SidebarMenu/MenuItem/MenuButton
- SidebarGroup/GroupLabel
- SidebarHeader/Footer/Content

**Key Styling Patterns**:
```tsx
// Sidebar container (line 172-173, 246)
"bg-sidebar text-sidebar-foreground flex h-full w-(--sidebar-width) flex-col"
"group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border"

// Menu button variants (line 475-495)
sidebarMenuButtonVariants = cva(
  "flex w-full items-center gap-2 rounded-md p-2 text-sm transition-[width,height,padding]",
  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
  "focus-visible:ring-2 ring-sidebar-ring",
  "data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium"
)

// Separator (line 364)
"bg-sidebar-border mx-2 w-auto"
```

**Custom CSS Variables Used**:
- `--sidebar-width: 16rem`
- `--sidebar-width-icon: 3rem`
- `--sidebar` (background)
- `--sidebar-foreground` (text)
- `--sidebar-accent` (hover state)
- `--sidebar-border` (separators)
- `--sidebar-ring` (focus)

**Collapsible States**: `data-[collapsible=icon]` and `data-[collapsible=offcanvas]`

**Theme Impact**: CRITICAL - Primary navigation, extensive use of sidebar-specific tokens

---

### 7. Table Component
**File**: `/home/krwhynot/projects/crispy-crm/src/components/ui/table.tsx`

**Key Styling Patterns**:
```tsx
// Row hover (line 58)
"hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors"

// Footer (line 45)
"bg-muted/50 border-t font-medium"

// Caption (line 99)
"text-muted-foreground mt-4 text-sm"
```

**Theme Impact**: MEDIUM - Uses `--muted` for backgrounds, `--foreground` for text

---

### 8. Badge Component
**File**: `/home/krwhynot/projects/crispy-crm/src/components/ui/badge.tsx`

**Variants**:
- `default` - Primary brand color
- `secondary` - Neutral color
- `destructive` - Red color
- `outline` - Bordered with no fill

**Key Styling Patterns**:
```tsx
// Base (line 7-8)
"inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium"
"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"

// Variants
default: "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90"
destructive: "border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90"
```

**Theme Impact**: MEDIUM - Uses `--primary`, `--secondary`, `--destructive`

---

### 9. Alert Component
**File**: `/home/krwhynot/projects/crispy-crm/src/components/ui/alert.tsx`

**Variants**:
- `default` - Card color
- `destructive` - Destructive color

**Key Styling Patterns**:
```tsx
// Base (line 6-7)
"relative w-full rounded-lg border px-4 py-3 text-sm grid gap-y-0.5"

// Destructive variant (line 12-13)
"text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90"
```

**Theme Impact**: LOW - Simple component, uses `--card` and `--destructive`

---

### 10. Textarea Component
**File**: `/home/krwhynot/projects/crispy-crm/src/components/ui/textarea.tsx`

**Key Styling Patterns**:
```tsx
// Matches Input pattern (line 10)
"border-input placeholder:text-muted-foreground flex field-sizing-content min-h-16 w-full rounded-md border"
"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
"aria-invalid:ring-destructive/20 aria-invalid:border-destructive dark:bg-input/30"
```

**Theme Impact**: HIGH - Form component, same patterns as Input

---

### 11. Checkbox Component
**File**: `/home/krwhynot/projects/crispy-crm/src/components/ui/checkbox.tsx`

**Key Styling Patterns**:
```tsx
// Base (line 14-16)
"peer border-input dark:bg-input/30 size-4 shrink-0 rounded-[4px] border shadow-xs"
"data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
"data-[state=checked]:border-primary"
"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
```

**Theme Impact**: HIGH - Form component, uses `--primary`, `--input`, `--ring`

---

### 12. Switch Component
**File**: `/home/krwhynot/projects/crispy-crm/src/components/ui/switch.tsx`

**Key Styling Patterns**:
```tsx
// Root (line 13-15)
"peer data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
"inline-flex h-[1.15rem] w-8 items-center rounded-full border shadow-xs"
"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"

// Thumb (line 21-23)
"bg-background dark:data-[state=unchecked]:bg-foreground"
"dark:data-[state=checked]:bg-primary-foreground"
```

**Theme Impact**: HIGH - Uses `--primary`, `--input`, `--background`, complex dark mode handling

---

### 13. Tabs Component
**File**: `/home/krwhynot/projects/crispy-crm/src/components/ui/tabs.tsx`

**Key Styling Patterns**:
```tsx
// List (line 26-28)
"bg-muted text-muted-foreground inline-flex h-9 w-fit items-center rounded-lg p-[3px]"

// Trigger (line 42-44)
"data-[state=active]:bg-background dark:data-[state=active]:text-foreground"
"dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30"
"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
```

**Theme Impact**: MEDIUM - Uses `--muted`, `--background`, `--input`, complex dark mode states

---

### 14. Tooltip Component
**File**: `/home/krwhynot/projects/crispy-crm/src/components/ui/tooltip.tsx`

**Key Styling Patterns**:
```tsx
// Content (line 48-50)
"bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs"
"animate-in fade-in-0 zoom-in-95"

// Arrow (line 55)
"bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]"
```

**Theme Impact**: LOW - Simple component, uses `--primary` exclusively

---

### 15. Dropdown Menu Component
**File**: `/home/krwhynot/projects/crispy-crm/src/components/ui/dropdown-menu.tsx`

**Key Styling Patterns**:
```tsx
// Content (line 42-44)
"bg-popover text-popover-foreground rounded-md border p-1 shadow-md"
"z-50 min-w-[8rem] overflow-x-hidden overflow-y-auto"

// Item (line 74-76)
"focus:bg-accent focus:text-accent-foreground rounded-sm px-2 py-1.5 text-sm"
"[&_svg:not([class*='text-'])]:text-muted-foreground"

// Destructive variant (line 73)
"data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10"
```

**Theme Impact**: HIGH - Common UI pattern, uses `--popover`, `--accent`, `--destructive`, `--muted-foreground`

---

### 16. Popover Component
**File**: `/home/krwhynot/projects/crispy-crm/src/components/ui/popover.tsx`

**Key Styling Patterns**:
```tsx
// Content (line 30-32)
"bg-popover text-popover-foreground z-50 w-72 rounded-md border p-4 shadow-md"
"data-[state=open]:animate-in data-[state=closed]:animate-out"
```

**Theme Impact**: MEDIUM - Uses `--popover`, `--popover-foreground`

---

### 17. Navigation Component (Header)
**File**: `/home/krwhynot/projects/crispy-crm/src/atomic-crm/layout/Header.tsx`

**Key Styling Patterns**:
```tsx
// Header background (line 32)
"bg-secondary"

// Navigation tabs (line 108-112)
isActive
  ? "text-secondary-foreground border-secondary-foreground"
  : "text-secondary-foreground/70 border-transparent hover:text-secondary-foreground/80"
```

**Theme Impact**: HIGH - Top navigation, uses `--secondary`, `--secondary-foreground`

---

## Component Categories by Theme Impact

### CRITICAL (Will require extensive testing)
1. **Input** - Core form element, heavy CSS variable usage
2. **Sidebar** - Navigation system with dedicated token set
3. **Button** - Primary interactive element
4. **Card** - Layout foundation

### HIGH (Significant changes needed)
1. **Select** - Complex form component
2. **Checkbox** - Form element with state colors
3. **Switch** - Toggle with background changes
4. **Badge** - Status indicators
5. **Dropdown Menu** - Menu system
6. **Textarea** - Form element
7. **Header/Navigation** - Top-level navigation

### MEDIUM (Moderate changes)
1. **Dialog/Modal** - Overlays
2. **Table** - Data display
3. **Tabs** - Navigation component
4. **Popover** - Contextual UI

### LOW (Minor adjustments)
1. **Alert** - Simple notification
2. **Tooltip** - Simple overlay

## Common Styling Patterns

### Focus Ring Pattern (Used in 15+ components)
```tsx
"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
```
- Uses `--ring` variable (currently `--brand-500` at hue 125°)
- 3px ring with 50% opacity
- Only visible on keyboard focus

### Validation/Error Pattern (Used in all form components)
```tsx
"aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
```
- Uses `--destructive` variable
- 20% opacity in light mode, 40% in dark mode

### Shadow System
- `shadow-xs` - Subtle elevation (buttons, inputs, small cards)
- `shadow-sm` - Small elevation
- `shadow-md` - Medium elevation (dropdowns, popovers)
- `shadow-lg` - Large elevation (dialogs, modals)

**Custom Shadows** (defined in CSS):
- `--shadow-card-1/2/3` with hover variants
- `--shadow-col` for column layouts

### Rounded Corners Hierarchy
- `rounded-[4px]` - Checkboxes, small elements
- `rounded-md` - Default (0.375rem)
- `rounded-lg` - Larger components (0.5rem)
- `rounded-xl` - Cards (0.75rem, uses `--radius-xl`)
- `rounded-full` - Circular elements (switches, avatars)

### Dark Mode Patterns

**Automatic Inversion**:
```css
.dark {
  --neutral-50:  oklch(23.4% 0.021 288.0);  /* Darkest (was 900) */
  --neutral-900: oklch(97.1% 0.002 284.5);  /* Lightest (was 50) */
}
```

**Component-Level Dark Mode**:
```tsx
"dark:bg-input/30"           // Semi-transparent backgrounds
"dark:data-[state=checked]:bg-primary-foreground"  // State-specific
```

### Hover Effects Patterns
- Opacity reduction: `hover:bg-primary/90` (90% opacity)
- Accent changes: `hover:bg-accent hover:text-accent-foreground`
- Border changes: `hover:border-secondary-foreground/80`

### Animation Patterns
```tsx
// Radix UI animations
"data-[state=open]:animate-in data-[state=closed]:animate-out"
"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
"data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
```

## CSS Variable Dependencies

### Most Frequently Used Variables (by component count)

1. **--primary** (15+ components) - Buttons, badges, checkboxes, switches, links
2. **--ring** (15+ components) - Focus states across all interactive elements
3. **--input** (8 components) - Form controls
4. **--muted-foreground** (12 components) - Secondary text, placeholders
5. **--accent** (10 components) - Hover states, selections
6. **--destructive** (10 components) - Error states, delete actions
7. **--card** (5 components) - Card surfaces
8. **--popover** (4 components) - Dropdown menus, popovers
9. **--sidebar-*** (1 component, 8 sub-variables) - Navigation system
10. **--background** (8 components) - Base backgrounds

### Color Variable Relationships

**Primary Chain**:
```
--brand-700 → --primary → button/checkbox/switch/tooltip
--brand-500 → --ring → focus states (all interactive)
```

**Neutral Chain**:
```
--neutral-100 → --secondary → secondary buttons/header
--neutral-200 → --border/--input → borders/form inputs
--neutral-400 → --muted-foreground → placeholders/secondary text
```

**Sidebar Chain**:
```
--neutral-100 → --sidebar → sidebar background
--neutral-200 → --sidebar-accent → hover states
--brand-700 → --sidebar-primary → active items
```

## Theme Migration Checklist

### Components Requiring Color Variable Updates

**Brand Color Changes** (hue 125° → new garden theme hue):
- [ ] Button (all variants)
- [ ] Checkbox (checked state)
- [ ] Switch (active state)
- [ ] Badge (default variant)
- [ ] Tooltip
- [ ] Focus rings (all interactive components)
- [ ] Sidebar active states

**Neutral Color Updates**:
- [ ] Card backgrounds
- [ ] Input borders
- [ ] Table backgrounds
- [ ] Sidebar backgrounds
- [ ] Header/navigation backgrounds

**Shadow Updates**:
- [ ] Dialog shadow-lg
- [ ] Dropdown/Popover shadow-md
- [ ] Button/Input shadow-xs
- [ ] Card elevation shadows

**Validation Colors**:
- [ ] Destructive states across all form components
- [ ] Success states (if adding green theme)
- [ ] Warning states
- [ ] Info states

### Testing Priority

**P0 - Critical Path**:
1. Button component (all variants)
2. Input component (focus, validation)
3. Sidebar navigation (active states)
4. Card component

**P1 - High Priority**:
1. Select/Dropdown menus
2. Checkbox/Switch
3. Header navigation
4. Dialog/Modal

**P2 - Medium Priority**:
1. Table hover states
2. Tabs active states
3. Badge variants
4. Alert variants

**P3 - Low Priority**:
1. Tooltip
2. Popover
3. Skeleton loaders
4. Progress bars

## Relevant Documentation

### Internal Files
- `/home/krwhynot/projects/crispy-crm/src/index.css` - Complete CSS variable definitions (lines 44-430)
- `/home/krwhynot/projects/crispy-crm/CLAUDE.md` - Color system documentation
- `/home/krwhynot/projects/crispy-crm/.docs/plans/mfb-garden-theme/requirements.md` - Theme requirements

### External Resources
- [shadcn/ui Documentation](https://ui.shadcn.com/) - Component patterns
- [Radix UI Primitives](https://www.radix-ui.com/) - Underlying component library
- [class-variance-authority](https://cva.style/docs) - Variant management
- [Tailwind CSS v4](https://tailwindcss.com/docs) - CSS framework

## Gotchas & Edge Cases

### 1. Dark Mode Complexity
Some components have nested dark mode logic:
```tsx
// Switch component has complex dark mode handling
"dark:data-[state=unchecked]:bg-foreground"
"dark:data-[state=checked]:bg-primary-foreground"
```
**Impact**: Theme changes must account for both light and dark mode variations.

### 2. Semi-Transparent Backgrounds
Many components use opacity modifiers:
```tsx
"dark:bg-input/30"  // 30% opacity
"hover:bg-primary/90"  // 90% opacity
```
**Impact**: Color changes will affect perceived opacity. May need to adjust opacity values.

### 3. Sidebar Width CSS Variables
Sidebar uses custom CSS properties for width:
```tsx
"w-(--sidebar-width)"  // Uses CSS variable directly in Tailwind
style={{ "--sidebar-width": "16rem" }}
```
**Impact**: Non-standard pattern, ensure Tailwind v4 supports this syntax.

### 4. Focus Ring Consistency
Focus ring uses `--ring` (brand-500) with fixed 3px width and 50% opacity:
```tsx
"focus-visible:ring-ring/50 focus-visible:ring-[3px]"
```
**Impact**: Changing brand hue will change focus ring color across ALL interactive elements.

### 5. Validation State Colors
Destructive color (red) is hardcoded in OKLCH:
```css
--destructive: oklch(0.577 0.245 27.325);  /* Red */
```
**Impact**: If green becomes primary, may need new error color to maintain contrast.

### 6. Shadow Definitions
Shadows use OKLCH black with alpha:
```css
--shadow-card-1: 0 1px 3px oklch(0 0 0 / 0.12);
```
**Impact**: Shadows are color-agnostic, but may need adjustment for new brand identity.

### 7. Rounded Corner Variable
Components use `--radius` variable (0.625rem):
```css
--radius-sm: calc(var(--radius) - 4px);
--radius-xl: calc(var(--radius) + 4px);
```
**Impact**: Theme can adjust corner rounding globally by changing `--radius`.

### 8. Data Attribute Styling
Heavy use of `data-[state=*]` for conditional styling:
```tsx
"data-[state=checked]:bg-primary"
"data-[active=true]:font-medium"
```
**Impact**: Ensure theme changes don't break Radix UI state management.

### 9. Peer Selector Pattern
Some components use Tailwind's peer selectors:
```tsx
"peer-hover/menu-button:text-sidebar-accent-foreground"
```
**Impact**: Complex selector chains may need careful testing with new colors.

### 10. Tag Color Classes
Direct CSS classes for tags (not CSS variables):
```css
.tag-warm { background-color: var(--tag-warm-bg); }
.tag-green { background-color: var(--tag-green-bg); }
```
**Impact**: 8 tag color variants need updating if green becomes primary brand.

## Implementation Notes

### Pattern Consistency
All components follow these conventions:
1. `data-slot` attributes for component identification
2. `cn()` utility for className merging
3. CVA for variant management on complex components
4. Semantic color tokens (never direct OKLCH in components)
5. Responsive sizing with Tailwind breakpoints

### Admin Layer Components
Located in `/home/krwhynot/projects/crispy-crm/src/components/admin/`, these wrap the base UI components with React Admin logic. Changes to base UI components will automatically propagate to admin components.

### Form Validation Integration
Form components integrate with React Hook Form and Zod:
- `aria-invalid` attribute triggers validation styling
- Error states use `--destructive` variable consistently
- Helper text uses `--muted-foreground`

### Accessibility Considerations
- Focus rings are critical for keyboard navigation
- Color contrast ratios must be maintained (WCAG AA)
- Current `--brand-700` achieves 5.5:1 contrast with white
- New garden theme must maintain similar contrast ratios
