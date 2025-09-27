# Multi-Select Filtering UI Component Patterns

Research findings on UI component patterns and architectural decisions relevant to implementing multi-select filtering across the Atomic CRM application.

## Relevant Files
- `/home/krwhynot/Projects/atomic/src/components/admin/multi-select-input.tsx`: Existing multi-select dropdown component using React Admin patterns
- `/home/krwhynot/Projects/atomic/src/components/ui/dropdown-menu.tsx`: Radix UI dropdown menu primitives with checkbox items
- `/home/krwhynot/Projects/atomic/src/components/ui/badge.tsx`: Badge component with semantic variants (default, secondary, destructive, outline)
- `/home/krwhynot/Projects/atomic/src/components/admin/badge-field.tsx`: React Admin integration layer for badge display
- `/home/krwhynot/Projects/atomic/src/atomic-crm/tags/TagChip.tsx`: Interactive chip component with hover states and removal capability
- `/home/krwhynot/Projects/atomic/src/components/ui/accordion.tsx`: Radix UI accordion for collapsible sections
- `/home/krwhynot/Projects/atomic/src/index.css`: CSS custom properties and semantic color system
- `/home/krwhynot/Projects/atomic/src/lib/color-types.ts`: Semantic color type definitions and tag color system
- `/home/krwhynot/Projects/atomic/src/atomic-crm/tags/tag-colors.ts`: Tag color validation and CSS class mapping
- `/home/krwhynot/Projects/atomic/src/components/admin/form.tsx`: Form field components with error handling and validation

## Architectural Patterns

- **Multi-Select Component Structure**: `MultiSelectInput` follows React Admin patterns with `useChoicesContext`, `useInput`, and `useTranslate` hooks for data management, form integration, and internationalization
- **Dropdown Implementation**: Uses Radix UI `DropdownMenu` with `DropdownMenuCheckboxItem` for checkbox-style selection with built-in accessibility
- **State Management**: Multi-select values stored as arrays, with `handleChange` callback adding/removing items via spread operator and filter
- **Display Pattern**: Shows count of selected items in trigger button ("Select items (3 selected)")
- **Badge System**: Two-tier badge components - base UI component (`Badge`) and admin integration layer (`BadgeField`) with React Admin field props
- **Chip Components**: Interactive chips with hover effects, edit capability, and removal buttons using Lucide React icons
- **Form Integration**: `FormField`, `FormLabel`, `FormError` pattern for consistent form styling and validation display
- **Collapsible UI**: Accordion component with `data-state` attributes for CSS animations and Radix UI primitives

## Edge Cases & Gotchas

- **Checkbox State Management**: MultiSelectInput uses `field.value?.includes(choiceId)` with optional chaining to handle undefined values safely
- **Event Propagation**: TagChip component uses `e.stopPropagation()` on remove button to prevent triggering parent click handlers
- **Keyboard Navigation**: TagChip implements both click and keyboard handlers (Enter/Space) for accessibility compliance
- **CSS Variable Fallbacks**: Color system includes hex fallbacks (`hexFallback` property) for browsers without CSS custom property support
- **Translation Handling**: Optional translation via `translateChoice` prop with fallback to original label using `translate(choiceLabel, { _: choiceLabel })`
- **Form Validation**: Error states propagated through React Hook Form with `aria-invalid` and `aria-describedby` attributes for screen readers
- **Theme Compatibility**: All components use semantic CSS variables (--primary, --destructive) instead of hardcoded colors per project guidelines
- **Legacy Color Migration**: Tag system includes `HEX_TO_SEMANTIC_MAP` for transitioning from hex colors to semantic color names

## CSS Theming & Color System

- **Semantic Variables**: Uses `--primary`, `--secondary`, `--destructive`, `--accent` variables that adapt to light/dark themes
- **Tag Color System**: Dedicated tag color variables (`--tag-warm-bg`, `--tag-green-fg`) with both light and dark mode variants
- **Focus States**: Consistent focus styling using `--ring` variable with `focus-visible:ring-[3px]` pattern
- **Hover Effects**: Consistent hover patterns using CSS transitions and semantic color variants
- **Active States**: `data-[state=open]` and `data-[checked=true]` attributes for dynamic styling
- **Badge Variants**: Four semantic variants (default, secondary, destructive, outline) using class-variance-authority (CVA)

## LocalStorage Usage Patterns

- **React Admin Store**: Uses `localStorageStore()` from React Admin for persistent application state
- **CRM Namespace**: Main CRM app uses namespaced localStorage: `localStorageStore(undefined, "CRM")`
- **Default Store**: Admin components use default localStorage store for form state and preferences
- **Automatic Persistence**: React Admin automatically persists filters, pagination, and sort state via localStorage

## Relevant Docs
- [Radix UI Dropdown Menu](https://www.radix-ui.com/docs/primitives/components/dropdown-menu) - Accessible dropdown component primitives
- [React Admin useChoicesContext](https://marmelab.com/react-admin/Inputs.html#usechoicescontext) - Hook for managing choice-based input data
- [React Hook Form Field State](https://react-hook-form.com/docs/useformstate) - Form state management and validation patterns