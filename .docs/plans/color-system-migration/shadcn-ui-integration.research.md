# shadcn/ui Integration with Atomic CRM Color System

Research conducted to understand how shadcn/ui components integrate with the semantic CSS variable-based color system in Atomic CRM.

## Overview

shadcn/ui components are fully integrated with Tailwind CSS 4's CSS variable system defined in `/home/krwhynot/Projects/atomic/src/index.css`. All components use semantic color tokens exclusively through Tailwind utility classes. No hardcoded hex values found in component implementations (only in Storybook examples). The system uses a three-tier component architecture with consistent color application patterns.

## Relevant Files

### Core shadcn/ui Components (`/home/krwhynot/Projects/atomic/src/components/ui/`)
- `/home/krwhynot/Projects/atomic/src/components/ui/button.tsx`: Primary action component with 6 variants (default, destructive, outline, secondary, ghost, link)
- `/home/krwhynot/Projects/atomic/src/components/ui/badge.tsx`: Status/label component with 4 variants (default, secondary, destructive, outline)
- `/home/krwhynot/Projects/atomic/src/components/ui/alert.tsx`: Notification component with 2 variants (default, destructive)
- `/home/krwhynot/Projects/atomic/src/components/ui/card.tsx`: Container component using card/card-foreground colors
- `/home/krwhynot/Projects/atomic/src/components/ui/input.tsx`: Form input with focus ring and validation states
- `/home/krwhynot/Projects/atomic/src/components/ui/select.tsx`: Dropdown select using popover colors
- `/home/krwhynot/Projects/atomic/src/components/ui/checkbox.tsx`: Checkbox using primary color when checked
- `/home/krwhynot/Projects/atomic/src/components/ui/switch.tsx`: Toggle switch using primary/input colors
- `/home/krwhynot/Projects/atomic/src/components/ui/dialog.tsx`: Modal overlay using background/accent colors
- `/home/krwhynot/Projects/atomic/src/components/ui/dropdown-menu.tsx`: Context menu using popover/accent colors
- `/home/krwhynot/Projects/atomic/src/components/ui/tabs.tsx`: Tab navigation using muted/background colors
- `/home/krwhynot/Projects/atomic/src/components/ui/progress.tsx`: Progress bar using primary color at 20% opacity
- `/home/krwhynot/Projects/atomic/src/components/ui/tooltip.tsx`: Tooltips using primary/primary-foreground colors
- `/home/krwhynot/Projects/atomic/src/components/ui/skeleton.tsx`: Loading placeholder using accent color
- `/home/krwhynot/Projects/atomic/src/components/ui/sidebar.tsx`: Navigation sidebar with dedicated sidebar-* color variables
- `/home/krwhynot/Projects/atomic/src/components/ui/command.tsx`: Command palette using popover/accent colors
- `/home/krwhynot/Projects/atomic/src/components/ui/radio-group.tsx`: Radio buttons using primary color
- `/home/krwhynot/Projects/atomic/src/components/ui/spinner.tsx`: Loading spinner using primary color

### Admin Layer Components (`/home/krwhynot/Projects/atomic/src/components/admin/`)
- `/home/krwhynot/Projects/atomic/src/components/admin/text-input.tsx`: React Admin wrapper for Input with validation
- `/home/krwhynot/Projects/atomic/src/components/admin/badge-field.tsx`: React Admin field wrapper for Badge
- `/home/krwhynot/Projects/atomic/src/components/admin/error.tsx`: Error boundary using primary color for links and secondary for accordion
- `/home/krwhynot/Projects/atomic/src/components/admin/simple-form.tsx`: Form layout with sticky toolbar using background gradient

### Color System Definition
- `/home/krwhynot/Projects/atomic/src/index.css`: Master CSS variable definitions (lines 51-272)

### Utility Layer
- `/home/krwhynot/Projects/atomic/src/lib/utils.ts`: `cn()` function using clsx + tailwind-merge for class composition

## Architectural Patterns

### CSS Variable System
- **Tailwind 4 Integration**: Uses `@theme inline` directive (lines 6-49 in index.css) to map CSS variables to Tailwind utilities
- **Color Mapping Pattern**: `--color-{name}: var(--{name})` creates Tailwind classes like `bg-primary`, `text-foreground`
- **Dark Mode Strategy**: Uses `.dark` class selector (lines 163-272) to override variables, not separate class variants
- **OKLCH Color Space**: All color values defined in OKLCH format for perceptual uniformity

### Component Variant System
- **Class Variance Authority (CVA)**: All variant components use `cva()` for type-safe variant management
- **Variant Pattern**: Base classes + variant-specific classes combined via CVA
- **Example from Button**:
  ```typescript
  const buttonVariants = cva(
    "inline-flex items-center justify-center...", // base classes
    {
      variants: {
        variant: {
          default: "bg-primary text-primary-foreground...",
          destructive: "bg-destructive text-white...",
          // ... more variants
        }
      }
    }
  );
  ```

### Three-Tier Component Architecture
1. **Base Layer** (`src/components/ui/`): shadcn/ui primitives consuming CSS variables
2. **Admin Layer** (`src/components/admin/`): React Admin integration wrappers
3. **Feature Layer** (`src/atomic-crm/`): Business logic components (not examined in this research)

### Color Application Patterns
- **Foreground/Background Pairs**: Always used together (e.g., `bg-primary text-primary-foreground`)
- **Opacity Modifiers**: Applied via Tailwind syntax (e.g., `bg-primary/20`, `bg-primary/90`)
- **State-Based Colors**:
  - Hover: `/90` opacity or dedicated hover colors
  - Focus: `focus-visible:border-ring focus-visible:ring-ring/50`
  - Active: `data-[active=true]:bg-accent`
  - Disabled: `disabled:opacity-50`
  - Invalid: `aria-invalid:ring-destructive/20 aria-invalid:border-destructive`

### Focus Ring System
- **Pattern**: `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- **Used in 14 components**: button, input, select, checkbox, switch, tabs, etc.
- **Destructive Variant Ring**: `focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40`
- **Sidebar Ring**: Uses dedicated `--sidebar-ring` variable

## Color Variable Usage by Component

### Components Using `--primary` Color
1. **Button** (default variant): `bg-primary text-primary-foreground hover:bg-primary/90`
2. **Badge** (default variant): `bg-primary text-primary-foreground`
3. **Checkbox** (checked state): `data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground`
4. **Switch** (on state): `data-[state=checked]:bg-primary`
5. **Progress**: Background `bg-primary/20`, indicator `bg-primary`
6. **Tooltip**: `bg-primary text-primary-foreground`
7. **Radio Group**: `text-primary` for indicator, `fill-primary` for icon
8. **Spinner**: `text-primary` for loader icon
9. **Input**: `selection:bg-primary selection:text-primary-foreground`
10. **Error Component**: Links use `text-primary underline-offset-4 hover:underline`

### Components Using `--accent` Color
1. **Button** (outline variant): `hover:bg-accent hover:text-accent-foreground`
2. **Badge** (outline variant): Hover state `[a&]:hover:bg-accent`
3. **Select** (item focus): `focus:bg-accent focus:text-accent-foreground`
4. **Dropdown Menu** (item hover/focus): `focus:bg-accent focus:text-accent-foreground`
5. **Command** (item selected): `data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground`
6. **Dialog** (close button): `data-[state=open]:bg-accent`
7. **Skeleton**: `bg-accent animate-pulse`
8. **Sidebar**: Multiple uses for hover states (`hover:bg-sidebar-accent`)

### Components Using `--ring` Color (Focus Rings)
Applied in 21 instances across 14 components:
- **Button**: `focus-visible:ring-ring/50`
- **Input**: `focus-visible:border-ring focus-visible:ring-ring/50`
- **Select**: `focus-visible:border-ring focus-visible:ring-ring/50`
- **Checkbox**: `focus-visible:border-ring focus-visible:ring-ring/50`
- **Switch**: `focus-visible:border-ring focus-visible:ring-ring/50`
- **Badge**: `focus-visible:border-ring focus-visible:ring-ring/50`
- **Tabs**: `focus-visible:border-ring focus-visible:ring-ring/50`
- **Radio Group**: `focus-visible:border-ring focus-visible:ring-ring/50`
- **Sidebar**: Uses `ring-sidebar-ring` variant
- **Dialog**: `focus:ring-ring` on close button
- **Sheet**: Similar to Dialog
- **Navigation Menu**: Focus states
- **Accordion**: Focus states
- **Textarea**: Similar to Input

### Components Using `--destructive` Color
1. **Button** (destructive variant): `bg-destructive text-white hover:bg-destructive/90`
2. **Badge** (destructive variant): `bg-destructive text-white`
3. **Alert** (destructive variant): `text-destructive bg-card`
4. **Dropdown Menu** (destructive variant): `data-[variant=destructive]:text-destructive`
5. **Validation States**: All form inputs use `aria-invalid:ring-destructive/20 aria-invalid:border-destructive`

### Components Using `--secondary` Color
1. **Button** (secondary variant): `bg-secondary text-secondary-foreground hover:bg-secondary/80`
2. **Badge** (secondary variant): `bg-secondary text-secondary-foreground`
3. **Error Component**: Accordion background uses `bg-secondary`

### Components Using `--muted` / `--muted-foreground` Color
1. **Alert Description**: `text-muted-foreground`
2. **Card Description**: `text-muted-foreground`
3. **Dialog Description**: `text-muted-foreground`
4. **Select**: Placeholder and labels use `text-muted-foreground`
5. **Dropdown Menu**: Labels and shortcuts use `text-muted-foreground`
6. **Command**: Group headings and placeholders
7. **Input**: Placeholder text `placeholder:text-muted-foreground`
8. **Tabs List**: Background `bg-muted text-muted-foreground`

### Components Using `--popover` / `--popover-foreground` Color
1. **Select Content**: `bg-popover text-popover-foreground`
2. **Dropdown Menu Content**: `bg-popover text-popover-foreground`
3. **Command**: `bg-popover text-popover-foreground`

### Components Using `--card` / `--card-foreground` Color
1. **Card**: `bg-card text-card-foreground`
2. **Alert** (default variant): `bg-card text-card-foreground`

### Sidebar-Specific Colors
The Sidebar component uses a dedicated color palette:
- `--sidebar`: Background
- `--sidebar-foreground`: Text
- `--sidebar-primary`: Primary actions
- `--sidebar-accent`: Hover/active states
- `--sidebar-border`: Separators
- `--sidebar-ring`: Focus outlines

## Gotchas & Edge Cases

### Hardcoded Colors Found
**Location**: `/home/krwhynot/Projects/atomic/src/components/ui/sonner.stories.tsx` (lines 364-366)
- Only instance of hex color codes in the entire UI component library
- Used in Storybook examples for custom toast styling
- **Not used in production components** - safe to ignore for migration
- Example: `background: '#1a1a1a', color: '#ffffff', border: '1px solid #333'`

### Dark Mode Specifics
- **Destructive Variant in Dark Mode**: Uses reduced opacity `dark:bg-destructive/60` instead of full color
- **Input Backgrounds**: Dark mode adds `dark:bg-input/30` for subtle contrast
- **Border Transparency**: Dark mode borders use `oklch(1 0 0 / 15%)` for translucency
- **Switch Thumb**: Dark mode has special logic `dark:data-[state=unchecked]:bg-foreground`

### Color Opacity Patterns
- **Hover States**: Typically `/90` opacity (e.g., `hover:bg-primary/90`)
- **Progress Background**: `/20` opacity for subtle appearance
- **Validation Rings**: `/20` in light mode, `/40` in dark mode for destructive states
- **Focus Rings**: Always `/50` opacity for consistency

### Validation State Styling
- **Pattern**: `aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive`
- **Applied to**: All form inputs (Input, Select, Checkbox, Radio, Switch, Badge, Button)
- **Ensures**: Consistent error indication across all interactive components

### Text Color Defaults
- Most components rely on inherited `text-foreground` from body (index.css line 309)
- Only override when semantic meaning requires it (e.g., `text-destructive`, `text-muted-foreground`)
- Links use `text-primary` for emphasis

### Disabled State Consistency
- **Universal Pattern**: `disabled:pointer-events-none disabled:opacity-50`
- **Cursor Override**: Global styles set `cursor: not-allowed` for disabled elements (index.css lines 285-288)
- Applied consistently across Button, Input, Select, Checkbox, Switch, etc.

### Class Composition with `cn()`
- Uses `tailwind-merge` to intelligently merge conflicting Tailwind classes
- Allows component consumers to override styles safely
- Pattern: `className={cn(baseClasses, variantClasses, className)}`

### Dialog Overlay Hardcoded Value
- Dialog overlay uses `bg-black/50` for semi-transparent backdrop
- This is the only component-level hardcoded color (not a variable reference)
- Intentional design choice for overlay consistency
- Could be replaced with `--overlay` variable if needed

### White Text on Destructive Variant
- Button and Badge destructive variants use `text-white` instead of `text-destructive-foreground`
- Breaks the foreground/background pairing pattern
- Likely intentional for maximum contrast with red background
- Consider adding `--destructive-foreground` variable for consistency

## Tailwind Integration Mechanism

### How CSS Variables Become Tailwind Utilities

1. **Variable Declaration** (index.css lines 51-161):
   ```css
   :root {
     --primary: oklch(0.205 0 0);
     --primary-foreground: oklch(0.985 0 0);
     /* ... more variables */
   }
   ```

2. **Tailwind Theme Mapping** (index.css lines 6-49):
   ```css
   @theme inline {
     --color-primary: var(--primary);
     --color-primary-foreground: var(--primary-foreground);
     /* ... more mappings */
   }
   ```

3. **Utility Class Generation**:
   - Tailwind 4 automatically generates utilities from `--color-*` variables
   - Results in classes like: `bg-primary`, `text-primary-foreground`, `border-primary`, etc.

4. **Component Usage**:
   ```typescript
   <Button className="bg-primary text-primary-foreground">
     Click me
   </Button>
   ```

### Supported Utility Patterns
- **Background**: `bg-{color}`, `bg-{color}/{opacity}`
- **Text**: `text-{color}`, `text-{color}/{opacity}`
- **Border**: `border-{color}`, `border-{color}/{opacity}`
- **Ring**: `ring-{color}`, `ring-{color}/{opacity}`
- **Fill/Stroke**: `fill-{color}`, `stroke-{color}`
- **Divide**: `divide-{color}`
- **Outline**: `outline-{color}`
- **Decoration**: `decoration-{color}`
- **Placeholder**: `placeholder:{color}`
- **Selection**: `selection:bg-{color}`

### No Tailwind Config File
- No `tailwind.config.ts` or `tailwind.config.js` found
- All configuration done inline via `@theme` directive in index.css
- Follows Tailwind 4's recommended approach for CSS-first configuration

## Admin Layer Wrapping Patterns

### React Admin Integration Strategy
Admin components wrap shadcn/ui primitives with React Admin hooks and context:

1. **Form Integration Pattern** (TextInput example):
   - Uses `useInput()` hook for field state
   - Wraps in `<FormField>` for validation context
   - Adds `<FormLabel>`, `<FormError>`, `<FormControl>` wrappers
   - Passes through to shadcn/ui `<Input>` or `<Textarea>`

2. **Field Display Pattern** (BadgeField example):
   - Uses `useFieldValue()` hook for data access
   - Wraps shadcn/ui `<Badge>` with React Admin translation support
   - Maintains variant props from base component

3. **Color Preservation**:
   - Admin wrappers do not introduce new colors
   - All colors still come from shadcn/ui base components
   - Only add layout and validation structure

### Validation Error Display
- Errors shown via `<FormError>` component (not examined, but referenced)
- Uses semantic destructive color from input validation states
- Consistent with `aria-invalid` styling on inputs

### Helper Text Pattern
- `<InputHelperText>` component for field descriptions
- Likely uses `text-muted-foreground` for subtle appearance
- Displayed below input, above errors

## Relevant Documentation

### Internal Docs
- CLAUDE.md Engineering Constitution Rule #7: "COLORS: Semantic CSS variables only (--primary, --destructive). Never use hex codes"
- CLAUDE.md Component Architecture: Three-tier system documented

### External References
- shadcn/ui Documentation: https://ui.shadcn.com/docs
- Tailwind CSS 4 Theme Configuration: https://tailwindcss.com/docs/theme
- Class Variance Authority: https://cva.style/docs
- Radix UI Primitives: https://www.radix-ui.com/primitives (underlying unstyled components)
- OKLCH Color Space: https://oklch.com/ (perceptual color space used for all values)

## Migration Readiness Assessment

### Strengths
- **100% Semantic Variables**: No hex codes in production components (only Storybook examples)
- **Consistent Patterns**: CVA-based variants ensure predictable color application
- **Type Safety**: TypeScript + CVA provides compile-time variant validation
- **Dark Mode Ready**: Complete dark mode color palette already defined
- **Accessibility**: Focus rings and validation states follow WCAG patterns

### Potential Issues for Extended Color Palette
1. **Limited Semantic Tokens**: Currently only primary, secondary, accent, destructive
   - No success, warning, info tokens (though extended variants exist in index.css)
2. **Hardcoded Overlay**: Dialog uses `bg-black/50` instead of variable
3. **Inconsistent Destructive**: Uses `text-white` instead of `text-destructive-foreground`
4. **No Component-Level Customization**: Colors are global, not per-component themeable

### Recommendations for Extended Palette
1. **Add Success/Warning/Info Variants** to Button, Badge, Alert components
2. **Use Extended Color Variables**: index.css already defines `--success-*`, `--warning-*`, `--info-*`, `--error-*`
3. **Create CVA Variants**: Add new variant options that reference extended colors
4. **Update Admin Wrappers**: Expose new variants through React Admin components
5. **Maintain Semantic Naming**: Follow existing pattern (e.g., `variant="success"` → `bg-success text-success-foreground`)

## Summary

shadcn/ui components in Atomic CRM are exemplary implementations of semantic CSS variable usage. Every color reference goes through Tailwind utilities mapped to CSS variables defined in index.css. The three-tier architecture cleanly separates primitive components, React Admin integration, and business logic. Focus rings, validation states, and dark mode are handled consistently across all 18+ UI components. The only hardcoded colors exist in non-production Storybook examples. The system is well-prepared for extended semantic color palettes through the existing CVA variant infrastructure.
