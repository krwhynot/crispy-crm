# UI Component Library Architecture Research

Comprehensive research on shadcn/ui components, admin layer wrappers, and visual regression testing requirements for the Atomic CRM application.

## Overview

The application uses a three-tier component architecture: (1) shadcn/ui base components in `src/components/ui/` leveraging Radix UI primitives with Tailwind CSS 4 semantic color variables, (2) React Admin integration layer in `src/components/admin/` wrapping base components with form validation and data provider logic, and (3) feature-specific components in `src/atomic-crm/`. All components strictly adhere to semantic color variables (no hex codes) and use class-variance-authority (cva) for variant management.

## Relevant Files

### Base UI Components (src/components/ui/)
- `/home/krwhynot/Projects/atomic/src/components/ui/accordion.tsx`: Collapsible content sections with ChevronDown animation
- `/home/krwhynot/Projects/atomic/src/components/ui/alert.tsx`: 2 variants (default, destructive) with icon support
- `/home/krwhynot/Projects/atomic/src/components/ui/avatar.tsx`: Avatar with image/fallback states
- `/home/krwhynot/Projects/atomic/src/components/ui/badge.tsx`: 4 variants (default, secondary, destructive, outline)
- `/home/krwhynot/Projects/atomic/src/components/ui/breadcrumb.tsx`: Navigation breadcrumb with separator/ellipsis
- `/home/krwhynot/Projects/atomic/src/components/ui/button.tsx`: 6 variants x 4 sizes (24 combinations)
- `/home/krwhynot/Projects/atomic/src/components/ui/card.tsx`: 7 sub-components (Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter)
- `/home/krwhynot/Projects/atomic/src/components/ui/checkbox.tsx`: Checkbox with checked/unchecked/indeterminate states
- `/home/krwhynot/Projects/atomic/src/components/ui/command.tsx`: Command palette with dialog, search, groups
- `/home/krwhynot/Projects/atomic/src/components/ui/dialog.tsx`: Modal with overlay, header, footer, title, description
- `/home/krwhynot/Projects/atomic/src/components/ui/drawer.tsx`: Side/bottom drawer using vaul, 4 directions
- `/home/krwhynot/Projects/atomic/src/components/ui/dropdown-menu.tsx`: 2 variants (default, destructive) with checkbox/radio items
- `/home/krwhynot/Projects/atomic/src/components/ui/input.tsx`: Text input with focus/invalid states
- `/home/krwhynot/Projects/atomic/src/components/ui/label.tsx`: Form label component
- `/home/krwhynot/Projects/atomic/src/components/ui/navigation-menu.tsx`: Complex navigation with viewports and indicators
- `/home/krwhynot/Projects/atomic/src/components/ui/pagination.tsx`: Pagination with prev/next/ellipsis
- `/home/krwhynot/Projects/atomic/src/components/ui/popover.tsx`: Popover with anchor positioning
- `/home/krwhynot/Projects/atomic/src/components/ui/progress.tsx`: Progress bar with value state
- `/home/krwhynot/Projects/atomic/src/components/ui/radio-group.tsx`: Radio button group
- `/home/krwhynot/Projects/atomic/src/components/ui/select.tsx`: Select with trigger, content, items, groups (2 sizes: sm, default)
- `/home/krwhynot/Projects/atomic/src/components/ui/separator.tsx`: Horizontal/vertical separator
- `/home/krwhynot/Projects/atomic/src/components/ui/sheet.tsx`: Side sheet with 4 directions (top, right, bottom, left)
- `/home/krwhynot/Projects/atomic/src/components/ui/sidebar.tsx`: Application sidebar component
- `/home/krwhynot/Projects/atomic/src/components/ui/skeleton.tsx`: Loading skeleton with pulse animation
- `/home/krwhynot/Projects/atomic/src/components/ui/spinner.tsx`: 3 sizes (small, medium, large) with show/hide state
- `/home/krwhynot/Projects/atomic/src/components/ui/switch.tsx`: Toggle switch with checked/unchecked states
- `/home/krwhynot/Projects/atomic/src/components/ui/table.tsx`: 8 sub-components (Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption)
- `/home/krwhynot/Projects/atomic/src/components/ui/tabs.tsx`: Tab navigation with list, trigger, content
- `/home/krwhynot/Projects/atomic/src/components/ui/textarea.tsx`: Multi-line text input
- `/home/krwhynot/Projects/atomic/src/components/ui/tooltip.tsx`: Tooltip with arrow and positioning
- `/home/krwhynot/Projects/atomic/src/components/ui/VirtualizedList.tsx`: Virtualized list for performance
- `/home/krwhynot/Projects/atomic/src/components/ui/sonner.tsx`: Toast notification system

**Total: 32 base UI components (~3,275 lines)**

### Admin Layer Components (src/components/admin/)
- `/home/krwhynot/Projects/atomic/src/components/admin/form.tsx`: Form wrapper with FormField, FormLabel, FormControl, FormError, SaveButton
- `/home/krwhynot/Projects/atomic/src/components/admin/text-input.tsx`: Wraps Input/Textarea with React Admin validation
- `/home/krwhynot/Projects/atomic/src/components/admin/select-input.tsx`: Wraps Select with React Admin choices/reference support
- `/home/krwhynot/Projects/atomic/src/components/admin/boolean-input.tsx`: Wraps Switch for boolean fields
- `/home/krwhynot/Projects/atomic/src/components/admin/number-input.tsx`: Number input with validation
- `/home/krwhynot/Projects/atomic/src/components/admin/file-input.tsx`: File upload with preview
- `/home/krwhynot/Projects/atomic/src/components/admin/multi-select-input.tsx`: Multi-select with tags
- `/home/krwhynot/Projects/atomic/src/components/admin/data-table.tsx`: Data grid using Table, Checkbox, Button, Tooltip
- `/home/krwhynot/Projects/atomic/src/components/admin/simple-form.tsx`: Form container with toolbar
- `/home/krwhynot/Projects/atomic/src/components/admin/edit-button.tsx`: Edit action button
- `/home/krwhynot/Projects/atomic/src/components/admin/delete-button.tsx`: Delete action button
- `/home/krwhynot/Projects/atomic/src/components/admin/create-button.tsx`: Create action button
- `/home/krwhynot/Projects/atomic/src/components/admin/show-button.tsx`: Show/view action button
- `/home/krwhynot/Projects/atomic/src/components/admin/export-button.tsx`: Export data button
- `/home/krwhynot/Projects/atomic/src/components/admin/bulk-delete-button.tsx`: Bulk delete action
- `/home/krwhynot/Projects/atomic/src/components/admin/filter-form.tsx`: Filter form component
- `/home/krwhynot/Projects/atomic/src/components/admin/theme-mode-toggle.tsx`: Light/dark mode toggle
- `/home/krwhynot/Projects/atomic/src/components/admin/login-page.tsx`: Login form page
- `/home/krwhynot/Projects/atomic/src/components/admin/app-sidebar.tsx`: Application sidebar layout
- `/home/krwhynot/Projects/atomic/src/components/admin/layout.tsx`: Main layout component
- `/home/krwhynot/Projects/atomic/src/components/admin/authentication.tsx`: Auth wrapper component

**Total: 73 admin layer components**

### Semantic Color Variables (src/index.css)
- `/home/krwhynot/Projects/atomic/src/index.css`: Tailwind CSS 4 configuration with OKLCH color space

## Architectural Patterns

### Component Variant System
- **class-variance-authority (cva)**: All components with variants use cva for type-safe variant management
- **Slot Pattern**: Components use `@radix-ui/react-slot` for `asChild` composition pattern
- **data-slot Attributes**: Every component has `data-slot="component-name"` for CSS targeting and testing
- **Example Pattern** (Button):
  ```typescript
  const buttonVariants = cva(
    "base-classes...",
    {
      variants: {
        variant: { default, destructive, outline, secondary, ghost, link },
        size: { default, sm, lg, icon }
      },
      defaultVariants: { variant: "default", size: "default" }
    }
  );
  ```

### Semantic Color Variables
**All colors use CSS variables, NO hex codes allowed** (Engineering Constitution rule):
- **Primary Colors**: `--primary`, `--primary-foreground`
- **Destructive**: `--destructive` (used for errors/delete actions)
- **Secondary/Muted**: `--secondary`, `--muted`, `--accent`
- **Borders/Inputs**: `--border`, `--input`, `--ring`
- **Cards/Popovers**: `--card`, `--popover` with foreground variants
- **Tag Colors**: 8 custom tag colors (warm, green, teal, blue, purple, yellow, gray, pink)
- **State Colors**: Success, warning, info, error with subtle/default/strong/bg/border/hover/active/disabled variants
- **Loading States**: `--loading-surface`, `--loading-shimmer`, `--loading-skeleton`, `--loading-pulse`, `--loading-spinner`, `--loading-overlay`
- **Dark Mode**: All variables redefined in `.dark` selector with OKLCH color space
- **OKLCH Format**: `oklch(lightness chroma hue)` for perceptual uniformity

### State Management Patterns
- **Focus States**: All interactive components use `focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- **Invalid States**: `aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive`
- **Disabled States**: `disabled:pointer-events-none disabled:opacity-50`
- **Hover/Active**: Component-specific hover/active states using semantic colors
- **Dark Mode**: Dark variants for inputs use `dark:bg-input/30` pattern

### Admin Layer Integration
- **React Admin Hooks**: All admin inputs use `useInput()` from ra-core for validation
- **Form Context**: Admin forms use React Hook Form via FormProvider
- **Validation**: Zod schemas at API boundary (not in components), validation errors displayed via FormError
- **Choice/Reference Pattern**: SelectInput supports both static choices and ReferenceInput wrapper
- **Sanitization**: `sanitizeInputRestProps()` removes React Admin props before passing to DOM elements

### Radix UI Primitives
**Base components built on Radix UI**:
- **Dialog/Sheet/Drawer**: Modal primitives with Portal, Overlay, Content patterns
- **Select/Dropdown/Command**: Popover-based selection primitives
- **Checkbox/Switch/RadioGroup**: Form control primitives
- **Accordion/Tabs/NavigationMenu**: Disclosure/navigation primitives
- **Tooltip/Popover**: Positioning primitives with Portal
- **Avatar/Progress**: Display primitives

## Component Variants and States to Test Visually

### Button (24 combinations)
**Variants**: default, destructive, outline, secondary, ghost, link
**Sizes**: default (h-9), sm (h-8), lg (h-10), icon (size-9)
**States**: default, hover, focus, disabled, with icon, with loading spinner
**Stories needed**: 6 variants × 4 sizes + state variations = ~30 stories

### Badge (4 variants)
**Variants**: default, secondary, destructive, outline
**States**: default, as link (hover state)
**Stories needed**: 4 variants × 2 contexts = ~8 stories

### Alert (2 variants)
**Variants**: default, destructive
**Compositions**: Alert only, Alert + AlertTitle, Alert + AlertDescription, Alert + icon + title + description
**Stories needed**: 2 variants × 4 compositions = ~8 stories

### Card (7 sub-components)
**Compositions**: Card, Card + Header, Card + Header + Content, Card + Header + Content + Footer, Card with CardAction
**States**: default, with border-b on header, with border-t on footer
**Stories needed**: ~6 composition stories

### Input (1 component, multiple types)
**Types**: text, email, password, number, date, datetime-local, time, month, file
**States**: default, focus, invalid (aria-invalid), disabled, with placeholder
**Stories needed**: 9 types × 5 states = ~20 stories (can reduce to key combinations)

### Select (2 sizes)
**Sizes**: default (h-9), sm (h-8)
**States**: default, open (dropdown expanded), invalid, disabled, with value, empty
**Stories needed**: 2 sizes × 6 states = ~12 stories

### Checkbox/Switch/RadioGroup (3 components)
**States per component**: unchecked, checked, indeterminate (checkbox only), disabled, invalid
**Stories needed**: 5 (checkbox) + 4 (switch) + 4 (radio) = ~13 stories

### Table (1 component, complex)
**Compositions**: Basic table, with sorting, with selection (checkboxes), with pagination, with hover states
**Stories needed**: ~5 stories for key compositions

### Dialog/Sheet/Drawer (3 modal components)
**Directions**: Dialog (center), Sheet (top/right/bottom/left), Drawer (top/right/bottom/left)
**States**: open, closed (animation), with header, with footer, with scroll
**Stories needed**: 1 (dialog) + 4 (sheet) + 4 (drawer) = ~9 stories

### Dropdown Menu (2 variants)
**Variants**: default item, destructive item
**Compositions**: Simple items, with checkbox items, with radio items, with sub-menu, with separator
**Stories needed**: 2 variants × 5 compositions = ~10 stories

### Tabs (1 component)
**States**: Tab list with 2-5 tabs, active tab, disabled tab, with content
**Stories needed**: ~4 stories

### Accordion (1 component)
**States**: collapsed, expanded, multiple items, with animations
**Stories needed**: ~3 stories

### Tooltip (1 component)
**Positions**: top, right, bottom, left
**States**: shown, hidden (hover trigger)
**Stories needed**: ~5 stories

### Popover (1 component)
**Positions**: top, right, bottom, left, with anchor
**States**: open, closed
**Stories needed**: ~5 stories

### Navigation Menu (1 component)
**States**: closed, open with content, with viewport, without viewport
**Stories needed**: ~4 stories

### Breadcrumb (1 component)
**Compositions**: 2 items, 5 items, with separator, with ellipsis
**Stories needed**: ~3 stories

### Pagination (1 component)
**States**: first page, middle page, last page, with ellipsis
**Stories needed**: ~4 stories

### Progress (1 component)
**Values**: 0%, 25%, 50%, 75%, 100%
**Stories needed**: ~5 stories

### Skeleton (1 component)
**Shapes**: rectangle, circle, text line, card skeleton
**Stories needed**: ~4 stories

### Spinner (3 sizes)
**Sizes**: small, medium, large
**States**: show, hide
**Stories needed**: ~4 stories

### Avatar (1 component)
**States**: with image, with fallback (initials), loading state
**Stories needed**: ~3 stories

### Command (1 component)
**States**: empty, with items, with groups, with search input
**Stories needed**: ~4 stories

### Admin Components (Key Components)
**DataTable**: Empty state, with data, with sorting, with selection, with bulk actions
**SimpleForm**: With text input, with select, with validation errors, with toolbar
**TextInput**: Default, multiline (textarea), invalid, with helper text
**SelectInput**: Default, with choices, loading state, with create option
**BooleanInput**: Unchecked, checked, disabled
**Stories needed**: ~25 stories for admin layer

## Edge Cases & Gotchas

### Form Validation Edge Cases
- **React Admin Validation Flow**: Validation happens at API boundary (Zod schemas), NOT in components. Components only display errors via `aria-invalid` and FormError
- **Field Name Conflicts**: Admin inputs require unique `source` prop; using same source twice causes React Hook Form conflicts
- **Sanitization Requirement**: MUST use `sanitizeInputRestProps()` before spreading props to DOM elements to avoid React warnings about unknown attributes
- **SelectInput Value Bug**: Radix Select has issue where `onValueChange` fires with empty string on controlled value change. Fixed with key-based remounting: `key={select:${field.value}}`

### Dark Mode Gotchas
- **Input Backgrounds**: Dark mode inputs use `dark:bg-input/30` (30% opacity) not solid colors
- **Border Transparency**: Dark mode borders use `oklch(1 0 0 / 15%)` transparent white, not solid colors
- **Destructive Opacity**: Dark mode destructive backgrounds use `dark:bg-destructive/60` for better contrast
- **Calendar Picker**: Date inputs need `.dark ::-webkit-calendar-picker-indicator { filter: invert(1); }` CSS fix

### Animation & Transition Gotchas
- **Radix Animations**: All Radix components use data-state attributes for animation hooks (data-state=open/closed)
- **Animation Classes**: Using `tw-animate-css` package for animation utilities
- **Portal Rendering**: Modal components (Dialog, Sheet, Drawer, Popover) render via Portal, affecting z-index stacking
- **Focus Management**: Radix handles focus trapping automatically; avoid manual focus() calls inside modals

### Tailwind CSS 4 Gotchas
- **@theme inline**: CSS variables defined in `@theme inline` block, not in `:root` directly
- **Custom Variants**: `@custom-variant dark (&:is(.dark *))` for scoped dark mode (not `:root.dark`)
- **oklch() Usage**: All colors use oklch() color space; hex codes violate Engineering Constitution
- **Variable Mapping**: `--color-*` CSS variables map to Tailwind color classes (e.g., `--color-primary` → `bg-primary`)

### Component Composition Gotchas
- **Slot Pattern**: Using `asChild` prop requires child to accept `ref` and spread props correctly
- **data-slot Attributes**: Used for CSS targeting; don't remove or change these in custom implementations
- **React Admin Context**: Admin components MUST be inside `<Admin>` provider or will throw context errors
- **Choice Context**: SelectInput inside ReferenceInput inherits choices from context; providing both causes conflicts

### Testing & Storybook Gotchas
- **Theme Provider Required**: All stories need ThemeProvider wrapper for CSS variable access
- **React Admin Decorators**: Admin component stories need RecordContextProvider and ResourceContextProvider decorators
- **Form Context**: Input stories need FormProvider wrapper with react-hook-form
- **Portal Rendering**: Modal/popover stories need special handling for screenshot capture (portal root must be in viewport)
- **Animation Timing**: Visual regression tests should wait for animations to complete (use `data-state` attributes)

### Accessibility Gotchas
- **aria-invalid Required**: Form validation MUST set `aria-invalid` attribute for screen readers
- **Focus-Visible Pattern**: Use `focus-visible:` not `focus:` to avoid focus rings on mouse clicks
- **Disabled Semantics**: Disabled buttons need `disabled:pointer-events-none disabled:cursor-not-allowed`
- **ARIA Labels**: Tooltips, dialogs, and navigation menus require proper `aria-label` or `aria-labelledby`

## Complete Component List for Storybook Stories

### Tier 1: Core Components (High Priority)
**Estimated 100+ stories**

1. **Button** (30 stories)
   - All 6 variants × 4 sizes
   - States: default, hover, focus, disabled, loading, with icon

2. **Input** (20 stories)
   - Types: text, email, password, number, date, datetime-local
   - States: default, focus, invalid, disabled

3. **Select** (12 stories)
   - 2 sizes × states (default, open, invalid, disabled, with value, empty)

4. **DataTable** (8 stories)
   - Empty, with data, sorting, selection, bulk actions, pagination

5. **Card** (6 stories)
   - Basic, with header, with content, with footer, with action, full composition

6. **Alert** (8 stories)
   - 2 variants × 4 compositions (basic, title, description, icon+title+description)

7. **Badge** (8 stories)
   - 4 variants × 2 contexts (standalone, as link)

8. **Dialog** (5 stories)
   - Basic, with header, with footer, with scroll content, with form

9. **Checkbox** (5 stories)
   - Unchecked, checked, indeterminate, disabled, invalid

10. **Switch** (4 stories)
    - Unchecked, checked, disabled, with label

### Tier 2: Navigation & Layout (Medium Priority)
**Estimated 40+ stories**

11. **Tabs** (4 stories)
    - 2-5 tabs, active states, disabled tab, with content

12. **Breadcrumb** (3 stories)
    - 2 items, 5 items, with ellipsis

13. **Pagination** (4 stories)
    - First page, middle page, last page, with ellipsis

14. **Navigation Menu** (4 stories)
    - Closed, open, with viewport, without viewport

15. **Sidebar** (3 stories)
    - Collapsed, expanded, with navigation items

16. **Dropdown Menu** (10 stories)
    - 2 variants × 5 compositions (simple, checkbox, radio, sub-menu, separator)

17. **Sheet** (4 stories)
    - 4 directions (top, right, bottom, left)

18. **Drawer** (4 stories)
    - 4 directions (top, right, bottom, left)

19. **Command** (4 stories)
    - Empty, with items, with groups, with search

### Tier 3: Forms & Inputs (Medium Priority)
**Estimated 35+ stories**

20. **TextInput** (8 stories)
    - Single line, multiline, invalid, disabled, with helper text, date variants

21. **SelectInput** (6 stories)
    - Default, with choices, loading, with create, inside ReferenceInput

22. **BooleanInput** (4 stories)
    - Unchecked, checked, disabled, with label

23. **NumberInput** (5 stories)
    - Default, min/max, step, invalid, disabled

24. **FileInput** (4 stories)
    - Empty, with preview, multiple files, invalid

25. **MultiSelectInput** (4 stories)
    - Empty, with values, max items, with create

26. **RadioGroup** (4 stories)
    - 2-4 options, selected, disabled, invalid

### Tier 4: Feedback & Loading (Low Priority)
**Estimated 25+ stories**

27. **Tooltip** (5 stories)
    - 4 positions (top, right, bottom, left) + with arrow

28. **Popover** (5 stories)
    - 4 positions + with anchor

29. **Skeleton** (4 stories)
    - Rectangle, circle, text line, card composition

30. **Spinner** (4 stories)
    - 3 sizes + show/hide states

31. **Progress** (5 stories)
    - 0%, 25%, 50%, 75%, 100%

32. **Avatar** (3 stories)
    - With image, fallback, loading

### Tier 5: Advanced Components (Low Priority)
**Estimated 15+ stories**

33. **Accordion** (3 stories)
    - Single item, multiple items, with animations

34. **Table** (5 stories)
    - Basic, with sorting, with hover, with selection, full-featured

35. **SimpleForm** (5 stories)
    - Basic inputs, with validation, with toolbar, with nested fields

36. **VirtualizedList** (2 stories)
    - Small dataset, large dataset (1000+ items)

### Total Estimated Stories: ~215 stories across 36 components

## Semantic Color Variable Usage Patterns

### Primary Action Colors
- **Buttons**: `bg-primary text-primary-foreground hover:bg-primary/90`
- **Links**: `text-primary hover:underline`
- **Icons**: `text-primary` for primary actions

### Destructive/Error Patterns
- **Buttons**: `bg-destructive text-white hover:bg-destructive/90`
- **Alerts**: `text-destructive bg-card`
- **Borders**: `border-destructive` with `ring-destructive/20` focus states
- **Dark Mode**: `dark:bg-destructive/60` for better contrast

### Neutral/Muted Patterns
- **Backgrounds**: `bg-muted` for subtle surfaces (tabs list, avatar fallback)
- **Text**: `text-muted-foreground` for secondary text (descriptions, placeholders)
- **Hover**: `hover:bg-accent hover:text-accent-foreground` for interactive items

### Border & Focus Patterns
- **Default Borders**: `border-input` (same as `border` but explicit)
- **Focus Ring**: `focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- **Focus Border**: `focus-visible:border-ring`
- **Invalid Ring**: `aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40`

### Card & Surface Patterns
- **Cards**: `bg-card text-card-foreground border rounded-xl`
- **Popovers**: `bg-popover text-popover-foreground border shadow-md`
- **Dialogs**: `bg-background border shadow-lg` (same as cards but explicit)

### Table & Data Patterns
- **Header**: `bg-muted/50 border-t` for table footer
- **Rows**: `hover:bg-muted/50 data-[state=selected]:bg-muted` for interactive rows
- **Borders**: `border-b` for row separators

### Loading State Patterns
- **Skeleton**: `bg-accent animate-pulse` (using accent for pulse effect)
- **Spinner**: `text-primary animate-spin` for loading indicators
- **Overlay**: Uses `--loading-overlay` variable (oklch(100% 0 0 / 60%))

## Component Dependencies (Admin wraps Base)

### Direct Wrapping Patterns
- **TextInput** → wraps **Input** + **Textarea** + **Label** from ui/
- **SelectInput** → wraps **Select** components from ui/
- **BooleanInput** → wraps **Switch** from ui/
- **DataTable** → uses **Table**, **Checkbox**, **Button**, **Tooltip**, **Alert** from ui/
- **SimpleForm** → uses **Form** (which wraps react-hook-form FormProvider)
- **All Buttons** (edit/delete/create/show/export) → wrap **Button** from ui/

### Form Integration Pattern
All admin inputs follow this pattern:
```typescript
import { FormField, FormLabel, FormControl, FormError } from "@/components/admin/form";
import { BaseComponent } from "@/components/ui/base-component";

export const AdminInput = (props) => {
  const { id, field, isRequired } = useInput(props); // React Admin hook

  return (
    <FormField id={id} name={field.name}>
      <FormLabel>...</FormLabel>
      <FormControl>
        <BaseComponent {...field} /> {/* Wrapped base component */}
      </FormControl>
      <FormError /> {/* Displays validation errors */}
    </FormField>
  );
};
```

### Dependency Graph
```
Admin Layer (React Admin integration)
    ├── form.tsx (wraps react-hook-form)
    │   ├── Uses: Label (ui)
    │   └── Uses: Button (ui)
    │
    ├── text-input.tsx
    │   ├── Wraps: Input (ui)
    │   └── Wraps: Textarea (ui)
    │
    ├── select-input.tsx
    │   └── Wraps: Select (ui)
    │
    ├── boolean-input.tsx
    │   └── Wraps: Switch (ui)
    │
    ├── data-table.tsx
    │   ├── Uses: Table (ui)
    │   ├── Uses: Checkbox (ui)
    │   ├── Uses: Button (ui)
    │   ├── Uses: Tooltip (ui)
    │   └── Uses: Alert (ui)
    │
    └── [20+ other admin components]
        └── Wrap/use base ui components

Base UI Layer (shadcn/ui + Radix)
    ├── Radix UI Primitives (@radix-ui/*)
    ├── Tailwind CSS 4 (semantic colors)
    └── class-variance-authority (variants)
```

## Related Documentation

### Internal Documentation
- Project instructions: `/home/krwhynot/Projects/atomic/CLAUDE.md`
- Engineering Constitution: See "Engineering Constitution" section in CLAUDE.md (rules #5-7 for colors, forms, TypeScript)
- Color validation script: `npm run validate:colors` (validates no hex codes)

### External Documentation
- [shadcn/ui Documentation](https://ui.shadcn.com) - Base component library patterns
- [Radix UI Primitives](https://www.radix-ui.com) - Underlying primitive components
- [React Admin Documentation](https://marmelab.com/react-admin/) - Admin layer integration patterns
- [Tailwind CSS 4 Beta](https://tailwindcss.com/docs) - New @theme syntax and OKLCH colors
- [class-variance-authority](https://cva.style/docs) - Variant management library
- [Storybook Visual Testing](https://storybook.js.org/docs/writing-tests/visual-testing) - Visual regression testing guide
- [Chromatic](https://www.chromatic.com/docs/) - Visual regression testing platform
