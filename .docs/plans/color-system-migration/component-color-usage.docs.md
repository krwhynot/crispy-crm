# Component Color Usage Research

This codebase uses a comprehensive CSS variable-based color system built on Tailwind CSS with shadcn/ui components. The color system leverages OKLCH color space for consistent color representation across light and dark themes.

## Relevant Files
- `/home/krwhynot/Projects/atomic/src/index.css`: Core color system definitions with CSS variables and theme configuration
- `/home/krwhynot/Projects/atomic/src/components/ui/button.tsx`: Button component with variant-based color schemes
- `/home/krwhynot/Projects/atomic/src/components/ui/badge.tsx`: Badge component with semantic color variants
- `/home/krwhynot/Projects/atomic/src/components/ui/alert.tsx`: Alert component with default and destructive variants
- `/home/krwhynot/Projects/atomic/src/components/ui/card.tsx`: Card component using semantic background colors
- `/home/krwhynot/Projects/atomic/src/components/ui/input.tsx`: Input component with validation state colors
- `/home/krwhynot/Projects/atomic/src/components/ui/dialog.tsx`: Modal/dialog components with semantic backgrounds
- `/home/krwhynot/Projects/atomic/src/components/admin/badge-field.tsx`: Admin-specific badge implementation
- `/home/krwhynot/Projects/atomic/src/lib/utils.ts`: Utility function for class name merging
- `/home/krwhynot/Projects/atomic/components.json`: shadcn/ui configuration with neutral base color

## Architectural Patterns

### **CSS Variable Color System**
- Uses OKLCH color space for consistent cross-theme color representation
- Dual-layer CSS variable approach: `--color-primary` references `--primary`
- Automatic dark mode support through `.dark` class selector
- Theme-aware color definitions in `:root` and `.dark` scopes

### **Class Variance Authority (CVA) Pattern**
- Components use `cva` for type-safe variant definitions
- Variants map to specific color combinations and semantic meanings
- Consistent component API across all UI elements
- Default variants provide fallback behavior

### **Semantic Color Naming**
- Color variables follow semantic naming: `primary`, `secondary`, `destructive`, `muted`
- Paired foreground colors: `primary-foreground`, `card-foreground`
- Context-specific colors: `sidebar-primary`, `sidebar-accent`
- Chart colors for data visualization: `chart-1` through `chart-5`

### **Theme Provider Integration**
- Dark mode controlled via `next-themes` provider
- Theme state accessible through `useTheme()` hook
- Components automatically adapt to theme changes

## Component Color Patterns

### **Button Component**
**Variants & Color Mappings:**
- `default`: `bg-primary text-primary-foreground hover:bg-primary/90`
- `destructive`: `bg-destructive text-white hover:bg-destructive/90`
- `outline`: `border bg-background hover:bg-accent hover:text-accent-foreground`
- `secondary`: `bg-secondary text-secondary-foreground hover:bg-secondary/80`
- `ghost`: `hover:bg-accent hover:text-accent-foreground`
- `link`: `text-primary underline-offset-4 hover:underline`

**Focus & Validation States:**
- Focus: `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- Invalid: `aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40`

### **Badge Component**
**Variants & Color Mappings:**
- `default`: `bg-primary text-primary-foreground [a&]:hover:bg-primary/90`
- `secondary`: `bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90`
- `destructive`: `bg-destructive text-white [a&]:hover:bg-destructive/90`
- `outline`: `text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground`

### **Alert Components**
**Variants & Color Mappings:**
- `default`: `bg-card text-card-foreground`
- `destructive`: `text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90`

### **Form Components & Validation States**
**Input Component:**
- Base: `border-input bg-transparent placeholder:text-muted-foreground`
- Focus: `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- Invalid: `aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive`
- Selection: `selection:bg-primary selection:text-primary-foreground`

**Label Component:**
- Base: `text-muted-foreground`
- Disabled: `group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50`

### **Card Components**
**Color Usage:**
- Background: `bg-card text-card-foreground`
- Description: `text-muted-foreground`
- Actions inherit button color schemes

### **Modal/Dialog Components**
**Color Patterns:**
- Overlay: `bg-black/50` (consistent across themes)
- Content: `bg-background` (theme-aware)
- Description: `text-muted-foreground`
- Close button: `data-[state=open]:bg-accent data-[state=open]:text-muted-foreground`

## Color Variable Dependencies

### **Core Color Tokens**
```css
--background, --foreground           /* Base page colors */
--card, --card-foreground           /* Card container colors */
--popover, --popover-foreground     /* Popover/dropdown colors */
--primary, --primary-foreground     /* Primary action colors */
--secondary, --secondary-foreground /* Secondary action colors */
--muted, --muted-foreground         /* Muted/subtle text colors */
--accent, --accent-foreground       /* Accent/hover colors */
--destructive                       /* Error/danger colors */
--border, --input, --ring           /* Border and focus colors */
```

### **Specialized Color Tokens**
```css
--sidebar-*                         /* Sidebar-specific colors */
--chart-*                          /* Data visualization colors */
```

### **OKLCH Color Values**
- Light theme uses high lightness values (0.9+) for backgrounds
- Dark theme uses low lightness values (0.1-0.3) for backgrounds
- Consistent chroma and hue values across themes
- Alpha channel support: `oklch(1 0 0 / 15%)`

## Edge Cases & Gotchas

### **Dark Mode Specific Adjustments**
- Input backgrounds use `dark:bg-input/30` for subtle transparency
- Destructive variant uses `dark:bg-destructive/60` for reduced intensity
- Border colors use alpha transparency in dark mode: `oklch(1 0 0 / 15%)`
- Hover states often use `/50` opacity modifiers in dark mode

### **Focus Ring Behavior**
- All interactive components implement consistent focus ring: `ring-[3px]`
- Invalid states override focus ring colors with destructive variants
- Focus rings use 50% opacity for visual consistency

### **State-Dependent Color Logic**
- `[a&]` selector targets anchor-wrapped components for hover states
- `data-[state=open]` provides state-specific styling for interactive components
- `aria-invalid` triggers validation-specific color schemes
- `group-data-[disabled=true]` handles grouped disabled states

### **Component Composition Challenges**
- Badge field component defaults to `outline` variant vs badge's `default`
- Admin components layer additional styling over base UI components
- Some components use hardcoded `text-white` instead of semantic foreground colors

### **Notification System Colors**
- Uses external library (sonner) with `richColors` prop
- Theme integration through `useTheme()` hook
- Toast types (`info`, `success`, `error`) map to theme colors automatically

## Relevant Docs
- [shadcn/ui Documentation](https://ui.shadcn.com/) - Component library foundation
- [Tailwind CSS Documentation](https://tailwindcss.com/) - Utility-first CSS framework
- [Class Variance Authority](https://cva.style/docs) - Variant management library
- [OKLCH Color Space](https://oklch.com/) - Modern color space for consistent color representation
- [Radix UI](https://www.radix-ui.com/) - Headless component primitives used throughout