# Presentation Layer

## Layer Definition

### What is the Presentation Layer?

The Presentation Layer in Crispy CRM is responsible for all visual rendering and user interaction. It encompasses pure UI primitives, React Admin wrappers, layout compositions, and the application shell. This layer transforms data received from the Domain Layer into visual representations and captures user input to emit back as events.

The Presentation Layer follows a hierarchical architecture: **Radix Primitives** form the foundation, wrapped by **shadcn/ui components** with consistent styling, which are then enhanced by **React Admin wrappers** for CRM-specific functionality. This layering ensures accessibility, consistent design, and framework integration without coupling business logic to presentation concerns.

A key principle is **data-slot attribution** - every component includes `data-slot="component-name"` attributes enabling CSS targeting, debugging, and testing. The layer uses **semantic color tokens exclusively** (never raw hex values) and enforces **44px minimum touch targets** for iPad accessibility.

### Responsibilities

- Render data received via props into visual HTML/JSX
- Capture user input and emit events via callbacks (onClick, onChange, onSubmit)
- Manage local UI state only (hover, focus, open/closed, active tab)
- Apply styling via Tailwind CSS with semantic color tokens
- Handle responsive behavior for desktop-first (1440px+) with iPad support
- Provide accessibility attributes (ARIA labels, roles, keyboard navigation)
- Implement touch target compliance (minimum 44x44px)
- Manage animations and transitions (150ms standard timing)
- Display loading states, skeletons, and error boundaries
- Format display values (currency, dates, truncation) without transformation logic
- Compose smaller components into larger page layouts
- Maintain form field presentation (labels, helper text, error messages)

### Non-Responsibilities (What Does NOT Belong Here)

- Business logic and validation rules (belongs in Domain Layer/Zod schemas)
- API calls or data fetching (belongs in Infrastructure Layer/Data Provider)
- Global state management (belongs in React Admin's store/context)
- Data transformation beyond display formatting
- Authentication/authorization logic
- Database queries or Supabase imports
- Form submission handling (only captures and emits)
- Route guards or navigation logic
- Caching strategies
- Error recovery or retry logic
- Server-side operations

### How This Layer Differs from Domain and Infrastructure

| Aspect | Presentation | Domain | Infrastructure |
|--------|-------------|--------|----------------|
| **Focus** | Visual rendering | Business rules | External systems |
| **State** | Local UI only | Application state | Network/cache state |
| **Imports** | UI libraries, Tailwind | Zod schemas, types | Supabase, APIs |
| **Testing** | Visual regression, a11y | Unit tests, integration | Mock services |
| **Changes trigger** | User interaction | Business events | External responses |

---

## Directory Breakdown

### src/components/ui/

**Purpose**: Pure UI primitives following shadcn/ui conventions. These components have zero business logic and no CRM-specific knowledge. They wrap Radix primitives with consistent Tailwind styling and CVA (class-variance-authority) variants.

**Total Lines**: 14,611 (including stories)

**File Inventory**:

| File | Purpose | Lines | Key Exports |
|------|---------|-------|-------------|
| sidebar.tsx | Collapsible navigation sidebar | 673 | Sidebar, SidebarProvider, SidebarTrigger |
| accordion.stories.tsx | Accordion component stories | 570 | Storybook stories |
| tooltip.stories.tsx | Tooltip component stories | 548 | Storybook stories |
| sonner.stories.tsx | Toast notification stories | 506 | Storybook stories |
| command.stories.tsx | Command palette stories | 456 | Storybook stories |
| popover.stories.tsx | Popover component stories | 449 | Storybook stories |
| tabs.stories.tsx | Tabs component stories | 448 | Storybook stories |
| dropdown-menu.stories.tsx | Dropdown menu stories | 426 | Storybook stories |
| sheet.stories.tsx | Sheet component stories | 404 | Storybook stories |
| progress.stories.tsx | Progress bar stories | 391 | Storybook stories |
| combobox.stories.tsx | Combobox stories | 390 | Storybook stories |
| alert.stories.tsx | Alert component stories | 375 | Storybook stories |
| radio-group.stories.tsx | Radio group stories | 372 | Storybook stories |
| inline-combobox.tsx | Inline editable combobox | 367 | InlineCombobox |
| select.stories.tsx | Select component stories | 343 | Storybook stories |
| dialog.stories.tsx | Dialog component stories | 342 | Storybook stories |
| card-elevation.stories.tsx | Card elevation stories | 342 | Storybook stories |
| separator.stories.tsx | Separator stories | 341 | Storybook stories |
| badge.stories.tsx | Badge component stories | 338 | Storybook stories |
| button.stories.tsx | Button component stories | 325 | Storybook stories |
| avatar.stories.tsx | Avatar component stories | 316 | Storybook stories |
| list-skeleton.tsx | Loading skeleton for lists | 304 | ListSkeleton, SlideOverSkeleton |
| switch.stories.tsx | Switch component stories | 293 | Storybook stories |
| checkbox.stories.tsx | Checkbox stories | 280 | Storybook stories |
| input.stories.tsx | Input component stories | 252 | Storybook stories |
| card.stories.tsx | Card component stories | 250 | Storybook stories |
| select-ui.tsx | Custom select component | 249 | SelectUI |
| priority-tabs.tsx | Priority-based tabs | 243 | PriorityTabsList |
| dropdown-menu.tsx | Dropdown menu component | 226 | DropdownMenu, DropdownMenuContent |
| filter-select-ui.tsx | Filter-aware select | 222 | FilterSelectUI |
| image-editor-field.tsx | Image upload/crop field | 215 | ImageEditorField |
| combobox.tsx | Searchable dropdown | 209 | Combobox, MultiSelectCombobox |
| data-cell.tsx | Table cell components | 204 | DataCell, DataRow, DataHeaderCell |
| calendar.tsx | Date picker calendar | 179 | Calendar |
| select.tsx | Native select wrapper | 172 | Select, SelectContent, SelectItem |
| form.tsx | Form field components | 168 | Form, FormField, FormControl, FormError |
| command.tsx | Command palette | 168 | Command, CommandInput, CommandList |
| input.tsx | Text input component | 133 | Input |
| sheet.tsx | Side panel component | 130 | Sheet, SheetContent, SheetHeader |
| dialog.tsx | Modal dialog | 122 | Dialog, DialogContent, DialogTitle |
| drawer.tsx | Bottom drawer (Vaul) | 122 | Drawer, DrawerContent |
| alert-dialog.tsx | Confirmation dialog | 115 | AlertDialog, AlertDialogAction |
| pagination.tsx | Page navigation | 115 | Pagination |
| breadcrumb.tsx | Navigation breadcrumb | 105 | Breadcrumb, BreadcrumbItem |
| table.tsx | Table components | 90 | Table, TableHeader, TableRow |
| card.tsx | Card container | 87 | Card, CardHeader, CardContent |
| truncated-text.tsx | Text truncation | 86 | TruncatedText |
| boolean-input.tsx | Boolean toggle input | 75 | BooleanInput |
| toggle-group.tsx | Toggle button group | 63 | ToggleGroup, ToggleGroupItem |
| accordion.tsx | Collapsible sections | 62 | Accordion, AccordionItem |
| tabs.tsx | Tab navigation | 62 | Tabs, TabsList, TabsContent |
| alert.tsx | Alert messages | 60 | Alert, AlertTitle, AlertDescription |
| tooltip.tsx | Hover tooltips | 58 | Tooltip, TooltipTrigger, TooltipContent |
| priority-badge.tsx | Priority indicator | 56 | PriorityBadge |
| avatar.tsx | User avatars | 54 | Avatar, AvatarImage, AvatarFallback |
| spinner.tsx | Loading spinner | 46 | Spinner |
| badge.constants.ts | Badge CVA variants | 45 | badgeVariants |
| scroll-area.tsx | Scrollable container | 44 | ScrollArea |
| radio-group.tsx | Radio button group | 43 | RadioGroup, RadioGroupItem |
| unsaved-changes-dialog.tsx | Dirty form warning | 42 | UnsavedChangesDialog |
| popover.tsx | Popover overlay | 40 | Popover, PopoverContent |
| button.constants.ts | Button CVA variants | 39 | buttonVariants |
| progress.tsx | Progress bar | 39 | Progress |
| button.tsx | Button component | 33 | Button |
| badge.tsx | Badge component | 31 | Badge |
| checkbox.tsx | Checkbox input | 30 | Checkbox |
| character-counter.tsx | Input char counter | 30 | CharacterCounter |
| sidebar.utils.ts | Sidebar utilities | 30 | useSidebar |
| toggle.constants.ts | Toggle CVA variants | 27 | toggleVariants |
| separator.tsx | Visual separator | 26 | Separator |
| sonner.tsx | Toast notifications | 26 | Toaster |
| switch.tsx | Toggle switch | 26 | Switch |
| dialog-error-alert.tsx | Error alert dialog | 25 | DialogErrorAlert |
| label.tsx | Form label | 21 | Label |
| aside-section.tsx | Aside content section | 19 | AsideSection |
| textarea.tsx | Multi-line input | 18 | Textarea |
| skeleton.tsx | Loading placeholder | 13 | Skeleton |
| relative-date.tsx | Relative date display | 11 | RelativeDate |
| sidebar.constants.ts | Sidebar constants | 11 | SIDEBAR_WIDTH, SIDEBAR_COOKIE_NAME |
| index.ts | Barrel exports | 12 | Re-exports |
| collapsible.tsx | Collapsible wrapper | 9 | Collapsible |

**Import Pattern**:
```typescript
// These components import from:
import { cn } from "@/lib/utils"
import { buttonVariants } from "./button.constants"
import * as RadixPrimitive from "@radix-ui/react-*"
import { cva, type VariantProps } from "class-variance-authority"

// They do NOT import from:
// - services/
// - providers/
// - atomic-crm/ (except shared utilities)
// - ra-core or react-admin
```

**Usage Statistics**: 695 imports across 316 files

**Exported Via**: Barrel file at `index.ts` for core exports, direct imports for stories

---

### src/components/admin/

**Purpose**: React Admin wrapper components built on shadcn Admin Kit. These components bridge the gap between pure UI primitives and React Admin's data-aware components, adding CRM-specific styling, form integration, and accessibility patterns.

**Total Lines**: 9,618

**File Inventory (Core Components)**:

| File | Wraps | Lines | Added Functionality |
|------|-------|-------|---------------------|
| filter-form.tsx | RA FilterForm | 463 | Custom filter UI, chip display |
| simple-form-iterator.tsx | RA SimpleFormIterator | 458 | Array field editing |
| data-table.tsx | Custom | 421 | Data grid with sorting/filtering |
| file-input.tsx | RA FileInput | 329 | Drag-drop upload, preview |
| select-input.tsx | RA SelectInput | 305 | Styled select with search |
| columns-button.tsx | Custom | 293 | Column visibility toggle |
| autocomplete-input.tsx | RA AutocompleteInput | 259 | Type-ahead search |
| autocomplete-array-input.tsx | RA AutocompleteArrayInput | 252 | Multi-select autocomplete |
| list-pagination.tsx | RA Pagination | 231 | Page size selector, jump-to |
| FormErrorSummary.tsx | Custom | 181 | Form-wide error display |
| toggle-filter-button.tsx | Custom | 175 | Filter toggle UI |
| reference-array-field.tsx | RA ReferenceArrayField | 172 | Related records display |
| create-in-dialog-button.tsx | RA CreateInDialogButton | 165 | Modal create form |
| array-input.tsx | RA ArrayInput | 157 | Dynamic array fields |
| list.tsx | RA ListBase | 155 | List view with toolbar |
| saved-queries.tsx | RA SavedQueriesList | 148 | Saved filter presets |
| field-toggle.tsx | Custom | 146 | Conditional field display |
| radio-button-group-input.tsx | RA RadioButtonGroupInput | 145 | Styled radio groups |
| multi-select-input.tsx | Custom | 144 | Multi-select chips |
| ListSearchBar.tsx | Custom | 140 | Global search bar |
| select-field.tsx | RA SelectField | 133 | Display field styling |
| app-sidebar.tsx | Custom | 133 | Navigation sidebar |
| reference-field.tsx | RA ReferenceField | 130 | Linked record display |
| date-field.tsx | RA DateField | 128 | Date formatting |
| RecentSearchesDropdown.tsx | Custom | 124 | Search history |
| PremiumDatagrid.tsx | Custom | 124 | Enhanced data grid |
| bulk-delete-button.tsx | RA BulkDeleteButton | 122 | Bulk delete with confirm |
| file-field.tsx | RA FileField | 118 | File download display |
| sort-button.tsx | Custom | 117 | Column sort controls |
| show.tsx | RA ShowBase | 115 | Show view wrapper |
| FilterableBadge.tsx | Custom | 110 | Clickable filter badge |
| confirm.tsx | Custom | 109 | Confirmation dialog |
| OwnerFilterDropdown.tsx | Custom | 107 | Owner filter selector |
| generic-select-input.tsx | Custom | 105 | Generic select wrapper |
| error.tsx | RA Error | 104 | Error display page |
| number-input.tsx | RA NumberInput | 102 | Numeric input styling |
| FloatingCreateButton.tsx | Custom | 98 | FAB create button |
| theme-mode-toggle.tsx | Custom | 98 | Dark/light toggle |
| export-button.tsx | RA ExportButton | 97 | CSV export |
| reference-array-input.tsx | RA ReferenceArrayInput | 97 | Multi-reference input |
| reference-many-field.tsx | RA ReferenceManyField | 97 | One-to-many display |
| breadcrumb.tsx | Custom | 95 | Navigation breadcrumb |
| record-field.tsx | RA RecordField | 95 | Record display |
| notification.tsx | RA Notification | 94 | Toast notifications |
| FavoritesSidebarSection.tsx | Custom | 93 | Starred items |
| delete-button.tsx | RA DeleteButton | 91 | Delete with confirm |
| edit.tsx | RA EditBase | 91 | Edit view wrapper |
| admin.tsx | RA Admin | 89 | App wrapper |
| text-input.tsx | RA TextInput | 86 | Text field styling |
| count.tsx | RA Count | 85 | Record counter |
| login-page.tsx | RA Login | 83 | Auth login form |
| create.tsx | RA CreateBase | 75 | Create view wrapper |
| boolean-input.tsx | RA BooleanInput | 75 | Checkbox/switch input |
| bulk-export-button.tsx | RA BulkExportButton | 74 | Bulk CSV export |
| user-menu.tsx | Custom | 71 | User dropdown menu |
| icon-button-with-tooltip.tsx | Custom | 69 | Icon button + tooltip |
| number-field.tsx | RA NumberField | 65 | Number display |
| email-field.tsx | RA EmailField | 64 | Email link display |
| url-field.tsx | RA UrlField | 64 | URL link display |
| simple-form.tsx | RA Form | 59 | Form wrapper |
| reference-many-count.tsx | RA ReferenceManyCount | 55 | Related count badge |
| delete-confirm-dialog.tsx | Custom | 55 | Delete confirmation |
| cancel-button.tsx | Custom | 55 | Form cancel |
| authentication.tsx | RA AuthProvider | 55 | Auth wrapper |
| locales-menu-button.tsx | RA LocalesMenuButton | 50 | Language selector |
| ListNoResults.tsx | Custom | 49 | Empty state |
| SegmentComboboxInput.tsx | Custom | 48 | Segmented input |
| bulk-actions-toolbar.tsx | RA BulkActionsToolbar | 46 | Bulk action bar |
| badge-field.tsx | Custom | 44 | Badge display field |
| theme-provider.tsx | Custom | 43 | Theme context |
| spinner.tsx | Custom | 43 | Loading indicator |
| array-field.tsx | RA ArrayField | 42 | Array display |
| text-field.tsx | RA TextField | 39 | Text display |
| layout.tsx | RA Layout | 39 | Page layout |
| edit-button.tsx | RA EditButton | 37 | Edit action |
| show-button.tsx | RA ShowButton | 36 | Show action |
| ready.tsx | RA Ready | 35 | Ready state |
| search-input.tsx | RA SearchInput | 33 | Search field |
| loading.tsx | RA Loading | 31 | Loading state |
| single-field-list.tsx | RA SingleFieldList | 30 | Single field display |
| create-button.tsx | RA CreateButton | 29 | Create action |
| reference-input.tsx | RA ReferenceInputBase | 24 | Reference selector |
| refresh-button.tsx | RA RefreshButton | 24 | Refresh action |
| input-helper-text.tsx | Custom | 22 | Helper text |
| state-combobox-input.tsx | Custom | 18 | State selector |
| filter-types.ts | Types | 11 | Filter type definitions |

**Subdirectories**:

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| form/ | Form layout components | FormGrid, FormSection, FormActions, SaveButtonGroup |
| tabbed-form/ | Multi-tab forms | TabbedFormInputs, TabTriggerWithErrors, TabPanel |
| text-input/ | Text input variants | TextInputWithCounter |
| column-filters/ | Column filter components | TextColumnFilter, CheckboxColumnFilter |
| __tests__/ | Component tests | Various test files |

**Import Pattern**:
```typescript
// These components import from:
import { useInput, useResourceContext } from "ra-core"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// They bridge UI primitives with React Admin:
import { FormControl, FormError } from "@/components/admin/form"
import { Input } from "@/components/ui/input"
```

**Usage Statistics**: 440 imports across 172 files

---

### src/components/layouts/

**Purpose**: Reusable layout patterns for list views and detail panels. These components enforce consistent spacing, responsive behavior, and accessibility patterns across all resource pages.

**Total Lines**: 770

**File Inventory**:

| File | Purpose | Lines | Key Props |
|------|---------|-------|-----------|
| ResourceSlideOver.tsx | Generic slide-over panel | 379 | resource, recordId, tabs, mode |
| StandardListLayout.tsx | Two-column list layout | 190 | filterComponent, children, resource |
| sidepane/SidepaneEmptyState.tsx | Empty state display | 49 | message, icon |
| sidepane/SidepaneSection.tsx | Section container | 44 | label, variant, showSeparator |
| sidepane/DirtyStateTracker.tsx | Form dirty tracking | 37 | onDirtyChange |
| sidepane/SidepaneContactRow.tsx | Contact list row | 36 | contact |
| sidepane/SidepaneMetadata.tsx | Metadata display | 35 | created_at, updated_at |
| sidepane/index.ts | Barrel exports | 5 | Re-exports |
| sidepane/empty-state-content.ts | Empty state config | 15 | Content definitions |

**Import Pattern**:
```typescript
// Layouts import from UI layer:
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Tooltip } from "@/components/ui/tooltip"

// And React Admin for data:
import { useGetOne } from "react-admin"
```

---

### src/atomic-crm/layout/

**Purpose**: Application shell components that define the overall CRM structure - header navigation, toolbars, and the root layout wrapper with error boundaries.

**Total Lines**: 272

**File Inventory**:

| File | Purpose | Lines | Key Responsibility |
|------|---------|-------|-------------------|
| Header.tsx | Main navigation header | 165 | Navigation tabs, user menu, theme toggle |
| Layout.tsx | Root layout wrapper | 52 | Error boundary, skip link, main content area |
| TopToolbar.tsx | Page action toolbar | 36 | Action buttons container |
| FormToolbar.tsx | Form action toolbar | 19 | Save/Cancel buttons |
| index.ts | Barrel exports | 5 | Re-exports |

**Import Pattern**:
```typescript
// App shell imports from admin components:
import { RefreshButton } from "@/components/admin/refresh-button"
import { ThemeModeToggle } from "@/components/admin/theme-mode-toggle"
import { UserMenu } from "@/components/admin/user-menu"

// And UI primitives:
import { Skeleton } from "@/components/ui/skeleton"
```

---

### src/atomic-crm/shared/

**Purpose**: CRM-specific shared components that have domain knowledge but are reused across multiple features. Currently contains a single component.

**Total Lines**: 35

**File Inventory**:

| File | Purpose | Lines | Key Props |
|------|---------|-------|-----------|
| components/Status.tsx | Status indicator badge | 35 | status (string) |

**Note**: This directory is intentionally minimal. Most shared components live in `src/components/` to maintain the separation between pure UI and CRM-specific presentation.

---

## Component Inventory

### UI Primitives (src/components/ui/)

| Component | Purpose | Props Interface | Import Count |
|-----------|---------|-----------------|--------------|
| Button | Clickable action element | variant, size, asChild, disabled | 180+ |
| Input | Text input field | size, type, className | 120+ |
| Card | Container with elevation | className (CardHeader, CardContent) | 95+ |
| Dialog | Modal dialog | open, onOpenChange | 75+ |
| Badge | Status indicator | variant | 70+ |
| Sheet | Side panel overlay | side, open, onOpenChange | 45+ |
| Tabs | Tab navigation | value, onValueChange | 42+ |
| Tooltip | Hover information | delayDuration | 60+ |
| Select | Dropdown selector | value, onValueChange | 55+ |
| Combobox | Searchable select | options, value, onValueChange | 35+ |
| DropdownMenu | Action menu | open, onOpenChange | 40+ |
| Table | Data table | className | 25+ |
| Skeleton | Loading placeholder | className | 30+ |
| Separator | Visual divider | orientation | 20+ |
| ScrollArea | Scrollable container | className | 15+ |
| Progress | Progress indicator | value, max | 10+ |
| Checkbox | Boolean input | checked, onCheckedChange | 25+ |
| RadioGroup | Option selector | value, onValueChange | 15+ |
| Switch | Toggle switch | checked, onCheckedChange | 10+ |
| Avatar | User image | src, fallback | 20+ |
| AlertDialog | Confirmation dialog | open, onOpenChange | 15+ |
| Drawer | Bottom sheet (mobile) | open, onOpenChange | 8+ |
| Command | Command palette | value, onValueChange | 12+ |
| Form | Form context provider | ... (react-hook-form) | 30+ |
| Calendar | Date picker | selected, onSelect | 10+ |
| Pagination | Page navigation | page, total, onPageChange | 8+ |
| Accordion | Collapsible sections | type, collapsible | 6+ |
| Breadcrumb | Navigation path | children | 15+ |
| Alert | Message display | variant | 12+ |

### React Admin Wrappers (src/components/admin/)

| Component | Base RA Component | Enhancements |
|-----------|-------------------|--------------|
| TextInput | useInput | Tailwind styling, FormControl integration |
| SelectInput | SelectInput | Custom dropdown UI, search |
| AutocompleteInput | AutocompleteInput | Type-ahead, custom rendering |
| ReferenceInput | ReferenceInputBase | Default AutocompleteInput child |
| BooleanInput | useInput | Switch/Checkbox toggle styling |
| NumberInput | useInput | Numeric formatting, validation display |
| ArrayInput | ArrayInput | Add/remove row UI |
| FileInput | FileInput | Drag-drop, preview, progress |
| List | ListBase | Breadcrumb, toolbar, pagination layout |
| Edit | EditBase | Breadcrumb, actions, form layout |
| Create | CreateBase | Breadcrumb, form layout |
| Show | ShowBase | Breadcrumb, actions, detail layout |
| SimpleForm | Form | Toolbar, flex layout |
| DeleteButton | DeleteButton | Confirmation dialog |
| ExportButton | ExportButton | Custom CSV formatting |
| Notification | useNotify | Toast styling (Sonner) |
| Pagination | usePagination | Page size selector, jump-to |
| Breadcrumb | - | Route-based crumb generation |
| PremiumDatagrid | Datagrid | Column resize, reorder |

### Layout Components (src/components/layouts/)

| Component | Use Case | Children Pattern |
|-----------|----------|------------------|
| ResourceSlideOver | Detail view in side panel | TabConfig[] with component factories |
| StandardListLayout | Filter sidebar + main content | filterComponent + children |
| SidepaneSection | Section in slide-over | label + children |
| SidepaneMetadata | Created/updated timestamps | Props-based |
| SidepaneContactRow | Contact item in list | contact record |
| SidepaneEmptyState | No data message | message, icon |

### App Shell (src/atomic-crm/layout/)

| Component | Responsibility | Key Features |
|-----------|----------------|--------------|
| Layout | Root app wrapper | Error boundary, skip link, footer |
| Header | Main navigation | Nav tabs, user menu, notifications |
| TopToolbar | Page actions | Flexible button container |
| FormToolbar | Form actions | Save/Cancel with sticky positioning |

---

## Patterns Analysis

### Component File Structure

Standard pattern used across all UI components:

```typescript
// 1. Imports (grouped: react, external libs, internal, types)
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { buttonVariants } from "./button.constants"

// 2. Types/Interfaces (exported for external use)
type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

// 3. Component Definition (forwardRef for DOM access)
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)

// 4. Display name (for React DevTools)
Button.displayName = "Button"

// 5. Exports (named exports preferred)
export { Button, buttonVariants }
```

### Props Interface Patterns

**Composition with HTML props**:
```typescript
interface DataCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  type?: "text" | "numeric" | "currency" | "date"
  truncate?: boolean
  maxWidth?: number
}
```

**Variant props from CVA**:
```typescript
type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }
```

**React Admin input props**:
```typescript
export type TextInputProps = InputProps & {
  multiline?: boolean
  onFocus?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>
} & React.ComponentProps<"textarea"> & React.ComponentProps<"input">
```

### Composition Patterns

**Slot pattern for polymorphism**:
```typescript
const Comp = asChild ? Slot : "button"
return <Comp {...props} />
```

**Compound components**:
```typescript
// Card with sub-components
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardAction><Button /></CardAction>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

**Render props / component injection**:
```typescript
// ResourceSlideOver with tab components
<ResourceSlideOver
  tabs={[
    { key: "details", component: DetailsTab },
    { key: "notes", component: NotesTab }
  ]}
/>
```

### Styling Approach

**Semantic colors only**:
```typescript
// CORRECT
className="text-muted-foreground bg-primary text-destructive"

// INCORRECT - Never use raw colors
className="text-gray-500 bg-green-600 text-red-500"
```

**CVA for variants** (extracted to .constants.ts for Fast Refresh):
```typescript
// button.constants.ts
export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
      },
      size: {
        default: "h-12 px-6 py-2",
        sm: "h-12 rounded-md gap-2 px-4",
        icon: "size-12",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)
```

**Touch target expansion via pseudo-element**:
```typescript
className={cn(
  "h-8 px-2 py-1",  // Visual: 32px
  "relative",
  "before:content-['']",
  "before:absolute",
  "before:top-[calc((44px-100%)/-2)]",  // Expands to 44px touch area
  "before:bottom-[calc((44px-100%)/-2)]",
  "before:left-0",
  "before:right-0",
)}
```

**Responsive media queries**:
```typescript
// Touch device detection
"[@media(hover:none)]:border-border"
"[@media(hover:none)]:bg-muted/20"

// Viewport breakpoints
"lg:grid-cols-[auto_1fr]"
"max-md:max-w-[calc(100%-2rem)]"
```

### Event Handling Patterns

**Callback props**:
```typescript
interface ButtonProps {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>
}
```

**Controlled components**:
```typescript
<Combobox
  value={value}
  onValueChange={(newValue) => setValue(newValue)}
/>
```

**Form field integration**:
```typescript
const { field } = useInput(props)
return (
  <Input
    {...field}
    onFocus={(e) => {
      field.onFocus?.(e)      // RA's internal handler
      customOnFocus?.(e)      // Custom handler
    }}
  />
)
```

---

## Import/Export Conventions

### Barrel Files

| Directory | Has Barrel? | Export Style | Notes |
|-----------|-------------|--------------|-------|
| components/ui | Yes (index.ts) | Named exports | Core components only |
| components/admin | No | Direct imports | Each file exports directly |
| components/layouts | No | Direct imports | - |
| components/layouts/sidepane | Yes (index.ts) | Named exports | Sidepane components |
| atomic-crm/layout | Yes (index.ts) | Named exports | Layout, Header, etc. |

### Path Aliases

| Alias | Resolves To | Used For |
|-------|-------------|----------|
| @/components | src/components | All component imports |
| @/lib | src/lib | Utilities (cn, etc.) |
| @/hooks | src/hooks | Custom hooks |
| @/types | src/types | Type definitions |

### Import Organization

Standard import order in component files:

```typescript
// 1. React imports
import * as React from "react"
import { useState, useCallback } from "react"

// 2. External library imports
import { useGetOne } from "react-admin"
import { type VariantProps } from "class-variance-authority"

// 3. Internal absolute imports (UI first, then admin)
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { SimpleForm } from "@/components/admin/simple-form"

// 4. Relative imports
import { buttonVariants } from "./button.constants"

// 5. Type imports (can be grouped with above or separate)
import type { RaRecord } from "react-admin"
```

---

## Layer Rules

### Rule 1: No Business Logic in Components

Components receive data via props and emit events via callbacks. They never:
- Import from `services/`
- Make direct Supabase calls
- Contain validation logic beyond UI constraints
- Transform data (beyond display formatting)

**Correct**:
```typescript
// Component receives formatted data
<ContactCard contact={contact} onEdit={handleEdit} />
```

**Incorrect**:
```typescript
// Component fetches its own data - WRONG
function ContactCard({ contactId }) {
  const { data } = await supabase.from('contacts').select()...
}
```

### Rule 2: Semantic Colors Only

Never use raw color values. Always use semantic tokens that adapt to dark mode:

**Correct**:
```typescript
className="text-muted-foreground bg-primary border-border"
```

**Incorrect**:
```typescript
className="text-gray-500 bg-green-600 border-gray-200"
className="bg-[#4ade80]"  // Raw hex - WRONG
```

### Rule 3: Touch Targets >= 44px

All interactive elements must have minimum 44x44px touch areas:

**Correct**:
```typescript
// Direct sizing
className="h-11 w-11"  // 44px

// Or pseudo-element expansion for compact visuals
className="h-8 relative before:content-[''] before:absolute before:top-[calc((44px-100%)/-2)]..."
```

**Incorrect**:
```typescript
className="h-8 w-8"  // 32px - Too small for touch
```

### Rule 4: data-slot Attributes on All Components

Every component root element should have `data-slot` for CSS targeting and debugging:

```typescript
<button data-slot="button" className={cn(...)}>
  {children}
</button>
```

### Rule 5: CVA Variants in .constants.ts Files

Extract CVA variant definitions to separate files for Fast Refresh support:

**Correct**:
```typescript
// button.constants.ts
export const buttonVariants = cva(...)

// button.tsx
import { buttonVariants } from "./button.constants"
```

**Incorrect**:
```typescript
// button.tsx - Full page reload on change
const buttonVariants = cva(...)  // WRONG - keep in same file
```

### Rule 6: ARIA Attributes for Accessibility

All form inputs and interactive elements must have proper ARIA:

```typescript
// Error state
<input
  aria-invalid={!!error}
  aria-describedby={error ? `${id}-error` : undefined}
/>

// Error message
<p id={`${id}-error`} role="alert">
  {error.message}
</p>

// Expandable elements
<button
  role="combobox"
  aria-expanded={open}
  aria-haspopup="listbox"
/>
```

### Rule 7: forwardRef for DOM Access

Components that wrap HTML elements should use forwardRef:

```typescript
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => (
    <button ref={ref} className={cn(...)} {...props} />
  )
)
Button.displayName = "Button"
```

### Rule 8: Spread Props for HTML Compatibility

Accept and spread remaining props to allow standard HTML attributes:

```typescript
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("bg-card", className)} {...props} />
}
```

---

## Health Assessment

### Scores

| Metric | Score | Evidence |
|--------|-------|----------|
| Clarity | 4/5 | Clear separation between ui/, admin/, layouts/. Consistent naming conventions (`*Input.tsx` for inputs, `*Field.tsx` for display). Minor overlap: some components in atomic-crm/shared/ could arguably be in components/. |
| Purity | 4/5 | No business logic found in UI primitives. Admin components properly delegate to RA hooks. One area of concern: `src/atomic-crm/shared/components/Status.tsx` imports from `ConfigurationContext` (domain knowledge). |
| Completeness | 5/5 | All needed UI primitives present. Comprehensive Storybook coverage for visual testing. Full React Admin integration. |

### Exemplary Files

- `src/components/ui/button.tsx` - Clean props interface, proper CVA extraction, forwardRef pattern
- `src/components/ui/card.tsx` - Compound component pattern, semantic elevation
- `src/components/ui/dialog.tsx` - Full Radix wrapper, accessibility attributes
- `src/components/admin/text-input.tsx` - Proper RA hook integration, clean FormControl usage
- `src/components/admin/list.tsx` - Complete list view with responsive layout
- `src/components/layouts/ResourceSlideOver.tsx` - Complex composition with clean tab abstraction
- `src/atomic-crm/layout/Layout.tsx` - Proper error boundary, skip link, accessibility

### Areas for Improvement

1. **Status component location**: `src/atomic-crm/shared/components/Status.tsx` has domain knowledge (imports `useFormOptions`). Consider:
   - Moving to a feature-specific location, or
   - Creating a pure UI version with domain logic injected via props

2. **Storybook coverage**: While extensive, some admin components lack stories

3. **Test coverage**: UI primitives have good test coverage via `__tests__/combobox.test.tsx` pattern, but not all components have dedicated test files

4. **Documentation**: PATTERNS.md exists for ui/ but not for admin/ (though README.md provides overview)

---

## Related Documentation

- [Architecture Overview](./00-architecture-overview.md)
- [Domain Layer](./02-domain-layer.md)
- [Infrastructure Layer](./03-infrastructure-layer.md)
- [Design System Patterns](../components/ui/PATTERNS.md)
- [Admin Kit Documentation](https://marmelab.com/shadcn-admin-kit/docs)
