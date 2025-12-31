# Component Catalog

Visual component index for Crispy CRM. Built on React Admin + Shadcn/ui.

---

## 1. Form Components

React Admin-compatible form inputs with Shadcn/ui styling.

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **TextInput** | `src/components/admin/text-input.tsx` | Text/textarea input with React Admin integration | `source`, `label`, `multiline`, `helperText`, `type` (date/datetime-local) |
| **AutocompleteInput** | `src/components/admin/autocomplete-input.tsx` | Searchable dropdown with Command palette UI | `source`, `choices`, `optionText`, `optionValue`, `filterToQuery`, `onCreate` |
| **ReferenceInput** | `src/components/admin/reference-input.tsx` | Foreign key selector wrapping AutocompleteInput | `source`, `reference`, `children` |
| **ReferenceArrayInput** | `src/components/admin/reference-array-input.tsx` | Multi-select for many-to-many relationships | `source`, `reference`, `children` |
| **RadioButtonGroupInput** | `src/components/admin/radio-button-group-input.tsx` | Radio button group for single selection | `source`, `choices`, `row` |
| **FileInput** | `src/components/admin/file-input.tsx` | File upload with drag-and-drop | `source`, `accept`, `multiple` |
| **SearchInput** | `src/components/admin/search-input.tsx` | Full-text search input for list filters | `source`, `alwaysOn` |
| **SegmentComboboxInput** | `src/components/admin/SegmentComboboxInput.tsx` | Segmented combobox for categorized selection | `source`, `segments`, `label` |

### Form Layout Components

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **SimpleForm** | `src/components/admin/simple-form.tsx` | Basic form wrapper with toolbar | `children`, `toolbar`, `onSubmit`, `className` |
| **FormToolbar** | `src/components/admin/simple-form.tsx` | Sticky save/cancel toolbar | `children`, `className` |
| **FormGrid** | `src/components/admin/form/FormGrid.tsx` | Responsive 2/4 column grid layout | `columns` (2 or 4), `className` |
| **FormSection** | `src/components/admin/form/FormSection.tsx` | Grouped form fields with title | `title`, `children`, `className` |
| **CollapsibleSection** | `src/components/admin/form/CollapsibleSection.tsx` | Expandable form section | `title`, `defaultOpen`, `children` |
| **CompactFormRow** | `src/components/admin/form/CompactFormRow.tsx` | Horizontal form field layout | `children`, `className` |
| **CompactFormFieldWithButton** | `src/components/admin/form/CompactFormFieldWithButton.tsx` | Input with inline action button | `children`, `button` |

### Form Utilities

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **SaveButtonGroup** | `src/components/admin/form/SaveButtonGroup.tsx` | Save + Save & Continue buttons | `alwaysEnable`, `redirect` |
| **FormActions** | `src/components/admin/form/FormActions.tsx` | Form action button container | `children`, `className` |
| **FormProgressBar** | `src/components/admin/form/FormProgressBar.tsx` | Visual progress indicator | `progress`, `className` |
| **StepIndicator** | `src/components/admin/form/StepIndicator.tsx` | Wizard step progress dots | `steps`, `currentStep` |
| **WizardNavigation** | `src/components/admin/form/WizardNavigation.tsx` | Previous/Next wizard controls | `onPrevious`, `onNext`, `canGoBack`, `canGoNext` |
| **FormErrorSummary** | `src/components/admin/FormErrorSummary.tsx` | Aggregated form validation errors | `errors` |
| **InputHelperText** | `src/components/admin/input-helper-text.tsx` | Helper/hint text below inputs | `helperText` |
| **FormLoadingSkeleton** | `src/components/admin/form/FormLoadingSkeleton.tsx` | Loading placeholder for forms | `rows`, `columns` |

---

## 2. Layout Components

Application structure and content organization.

### Core Layout

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **Layout** | `src/components/admin/layout.tsx` | Main app layout with sidebar | `children` |
| **AppSidebar** | `src/components/admin/app-sidebar.tsx` | Navigation sidebar with resource links | - |
| **SidebarProvider** | `src/components/ui/sidebar.tsx` | Sidebar state context provider | `defaultOpen`, `open`, `onOpenChange` |
| **Sidebar** | `src/components/ui/sidebar.tsx` | Sidebar container | `side` (left/right), `variant` (sidebar/floating/inset), `collapsible` |
| **SidebarContent** | `src/components/ui/sidebar.tsx` | Scrollable sidebar content area | `className` |
| **SidebarHeader** | `src/components/ui/sidebar.tsx` | Sidebar header section | `className` |
| **SidebarFooter** | `src/components/ui/sidebar.tsx` | Sidebar footer section | `className` |
| **SidebarMenu** | `src/components/ui/sidebar.tsx` | Navigation menu list | `className` |
| **SidebarMenuItem** | `src/components/ui/sidebar.tsx` | Individual menu item | `className` |
| **SidebarMenuButton** | `src/components/ui/sidebar.tsx` | Clickable menu button | `isActive`, `tooltip`, `asChild` |
| **SidebarTrigger** | `src/components/ui/sidebar.tsx` | Toggle button for sidebar | `className` |

### Slide-Over / Sheet

40vw right panel for detail views. URL pattern: `?view={id}`

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **Sheet** | `src/components/ui/sheet.tsx` | Root sheet/slide-over container | `open`, `onOpenChange` |
| **SheetContent** | `src/components/ui/sheet.tsx` | Animated panel content | `side` (top/right/bottom/left), `className` |
| **SheetHeader** | `src/components/ui/sheet.tsx` | Sheet header with title | `className` |
| **SheetTitle** | `src/components/ui/sheet.tsx` | Sheet title text | `className` |
| **SheetDescription** | `src/components/ui/sheet.tsx` | Sheet description text | `className` |
| **SheetFooter** | `src/components/ui/sheet.tsx` | Sheet footer with actions | `className` |
| **SheetClose** | `src/components/ui/sheet.tsx` | Close button | - |

### Tabs

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **TabPanel** | `src/components/admin/tabbed-form/TabPanel.tsx` | Tab content panel with border styling | `value`, `children`, `className` |
| **TabbedFormInputs** | `src/components/admin/tabbed-form/TabbedFormInputs.tsx` | Form with tabbed sections | `children`, `defaultValue` |
| **TabTriggerWithErrors** | `src/components/admin/tabbed-form/TabTriggerWithErrors.tsx` | Tab trigger with validation error indicator | `value`, `label`, `fields` |
| **Tabs** | `src/components/ui/tabs.tsx` | Shadcn tabs root | `value`, `onValueChange`, `defaultValue` |
| **TabsList** | `src/components/ui/tabs.tsx` | Tab button container | `className` |
| **TabsTrigger** | `src/components/ui/tabs.tsx` | Individual tab button | `value` |
| **TabsContent** | `src/components/ui/tabs.tsx` | Tab panel content | `value` |

### Cards

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **Card** | `src/components/ui/card.tsx` | Container with border, shadow, hover lift | `className` |
| **CardHeader** | `src/components/ui/card.tsx` | Card header area | `className` |
| **CardTitle** | `src/components/ui/card.tsx` | Card title with tight letter-spacing | `className` |
| **CardDescription** | `src/components/ui/card.tsx` | Muted description text | `className` |
| **CardContent** | `src/components/ui/card.tsx` | Main card content area | `className` |
| **CardFooter** | `src/components/ui/card.tsx` | Card footer with actions | `className` |
| **CardAction** | `src/components/ui/card.tsx` | Action button area (top-right) | `className` |

### Other Layout

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **AsideSection** | `src/components/ui/aside-section.tsx` | Sidebar content section | `title`, `children` |
| **ScrollArea** | `src/components/ui/scroll-area.tsx` | Custom scrollbar container | `className` |
| **Separator** | `src/components/ui/separator.tsx` | Horizontal/vertical divider | `orientation`, `decorative` |
| **Collapsible** | `src/components/ui/collapsible.tsx` | Expandable/collapsible content | `open`, `onOpenChange` |

---

## 3. Data Display Components

Components for displaying data in lists, tables, and detail views.

### Table / Datagrid

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **PremiumDatagrid** | `src/components/admin/PremiumDatagrid.tsx` | Enhanced React Admin Datagrid with hover effects | `onRowClick`, `focusedIndex`, `rowClassName` |
| **DataTable** | `src/components/admin/data-table.tsx` | TanStack Table wrapper | `columns`, `data` |
| **Table** | `src/components/ui/table.tsx` | Base HTML table styling | `className` |
| **TableHeader** | `src/components/ui/table.tsx` | Table header row | `className` |
| **TableBody** | `src/components/ui/table.tsx` | Table body | `className` |
| **TableRow** | `src/components/ui/table.tsx` | Table row | `className` |
| **TableHead** | `src/components/ui/table.tsx` | Table header cell | `className` |
| **TableCell** | `src/components/ui/table.tsx` | Table data cell | `className` |

### Column Filters

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **FilterableColumnHeader** | `src/components/admin/column-filters/FilterableColumnHeader.tsx` | Column header with filter UI | `source`, `label`, `filterType` |
| **FilterableBadge** | `src/components/admin/FilterableBadge.tsx` | Badge that acts as a filter | `source`, `value`, `label` |
| **ToggleFilterButton** | `src/components/admin/toggle-filter-button.tsx` | Filter toggle button | `source`, `value`, `label` |

### Field Components

React Admin field wrappers for displaying record data.

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **TextField** | `src/components/admin/text-field.tsx` | Plain text display | `source`, `record`, `empty` |
| **BadgeField** | `src/components/admin/badge-field.tsx` | Value displayed as badge | `source`, `variant` (default/outline/secondary/destructive) |
| **DateField** | `src/components/admin/date-field.tsx` | Formatted date display | `source`, `showTime`, `locales` |
| **NumberField** | `src/components/admin/number-field.tsx` | Formatted number display | `source`, `options` (Intl.NumberFormat) |
| **EmailField** | `src/components/admin/email-field.tsx` | Clickable email link | `source` |
| **UrlField** | `src/components/admin/url-field.tsx` | Clickable URL link | `source`, `target` |
| **FileField** | `src/components/admin/file-field.tsx` | File download link | `source`, `title` |
| **SelectField** | `src/components/admin/select-field.tsx` | Display choice label from value | `source`, `choices` |
| **ReferenceField** | `src/components/admin/reference-field.tsx` | Display referenced record | `source`, `reference`, `link` |
| **ReferenceArrayField** | `src/components/admin/reference-array-field.tsx` | Display multiple references | `source`, `reference` |
| **ReferenceManyField** | `src/components/admin/reference-many-field.tsx` | Display reverse relationship | `reference`, `target` |
| **ReferenceManyCount** | `src/components/admin/reference-many-count.tsx` | Count of related records | `reference`, `target`, `link` |
| **ArrayField** | `src/components/admin/array-field.tsx` | Display array values | `source` |
| **RecordField** | `src/components/admin/record-field.tsx` | Display nested record | `source` |
| **SingleFieldList** | `src/components/admin/single-field-list.tsx` | Inline list of field values | `children` |

### Badges & Status

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **Badge** | `src/components/ui/badge.tsx` | Status indicator badge | `variant` (default/secondary/destructive/outline), `asChild` |
| **PriorityBadge** | `src/components/ui/priority-badge.tsx` | Priority level indicator | `priority`, `className` |
| **SampleStatusBadge** | `src/atomic-crm/components/SampleStatusBadge.stories.tsx` | Sample status indicator | `status` |

### Avatar & Images

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **Avatar** | `src/components/ui/avatar.tsx` | User/contact avatar circle | `className` |
| **AvatarImage** | `src/components/ui/avatar.tsx` | Avatar image | `src`, `alt` |
| **AvatarFallback** | `src/components/ui/avatar.tsx` | Fallback when image fails | `children` (initials) |
| **OrganizationAvatar** | `src/atomic-crm/organizations/OrganizationAvatar.tsx` | Organization-specific avatar | `record`, `size` |
| **SaleAvatar** | `src/atomic-crm/sales/SaleAvatar.tsx` | Sales rep avatar | `record` |

### Loading States

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **Skeleton** | `src/components/ui/skeleton.tsx` | Animated loading placeholder | `className` |
| **ListSkeleton** | `src/components/ui/list-skeleton.tsx` | List loading state | `count` |
| **Spinner** | `src/components/ui/spinner.tsx` | Loading spinner | `size`, `className` |
| **Loading** | `src/components/admin/loading.tsx` | Full-page loading state | - |
| **SidebarMenuSkeleton** | `src/components/ui/sidebar.tsx` | Sidebar menu loading state | `showIcon` |

### Miscellaneous Display

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **RelativeDate** | `src/components/ui/relative-date.tsx` | Human-readable relative time | `date` |
| **DataCell** | `src/components/ui/data-cell.tsx` | Standardized table cell | `label`, `value` |
| **Count** | `src/components/admin/count.tsx` | Count display component | `count` |
| **Progress** | `src/components/ui/progress.tsx` | Progress bar | `value`, `max` |
| **CharacterCounter** | `src/components/ui/character-counter.tsx` | Text input character count | `current`, `max` |

---

## 4. Feedback Components

User notifications, confirmations, and interactive feedback.

### Toast / Notifications

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **Toaster** | `src/components/ui/sonner.tsx` | Toast notification container (Sonner) | `theme`, `position` |
| **Notification** | `src/components/admin/notification.tsx` | React Admin notification wrapper | - |

Usage:
```tsx
import { toast } from "sonner";
toast.success("Record saved");
toast.error("Failed to save");
```

### Dialogs & Alerts

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **AlertDialog** | `src/components/ui/alert-dialog.tsx` | Confirmation dialog | - |
| **AlertDialogTrigger** | `src/components/ui/alert-dialog.tsx` | Element that opens dialog | `asChild` |
| **AlertDialogContent** | `src/components/ui/alert-dialog.tsx` | Dialog content container | `className` |
| **AlertDialogHeader** | `src/components/ui/alert-dialog.tsx` | Dialog header | `className` |
| **AlertDialogTitle** | `src/components/ui/alert-dialog.tsx` | Dialog title | `className` |
| **AlertDialogDescription** | `src/components/ui/alert-dialog.tsx` | Dialog description | `className` |
| **AlertDialogFooter** | `src/components/ui/alert-dialog.tsx` | Dialog footer with actions | `className` |
| **AlertDialogAction** | `src/components/ui/alert-dialog.tsx` | Confirm button | `className` |
| **AlertDialogCancel** | `src/components/ui/alert-dialog.tsx` | Cancel button | `className` |
| **Dialog** | `src/components/ui/dialog.tsx` | Generic modal dialog | `open`, `onOpenChange` |
| **Confirm** | `src/components/admin/confirm.tsx` | React Admin confirmation dialog | `title`, `content`, `onConfirm` |
| **UnsavedChangesDialog** | `src/components/ui/unsaved-changes-dialog.tsx` | Warn before leaving with changes | `open`, `onDiscard`, `onSave` |
| **DialogErrorAlert** | `src/components/ui/dialog-error-alert.tsx` | Error display in dialogs | `error` |

### Tooltips

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **TooltipProvider** | `src/components/ui/tooltip.tsx` | Tooltip context (required at app root) | `delayDuration` |
| **Tooltip** | `src/components/ui/tooltip.tsx` | Tooltip wrapper | - |
| **TooltipTrigger** | `src/components/ui/tooltip.tsx` | Element that shows tooltip | `asChild` |
| **TooltipContent** | `src/components/ui/tooltip.tsx` | Tooltip content | `side`, `sideOffset` |

### Popovers

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **Popover** | `src/components/ui/popover.tsx` | Popover container | `open`, `onOpenChange` |
| **PopoverTrigger** | `src/components/ui/popover.tsx` | Element that opens popover | `asChild` |
| **PopoverContent** | `src/components/ui/popover.tsx` | Popover content | `side`, `align`, `sideOffset` |

### Alerts

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **Alert** | `src/components/ui/alert.tsx` | Inline alert message | `variant` (default/destructive) |
| **Error** | `src/components/admin/error.tsx` | Error page/boundary | `error`, `resetErrorBoundary` |

---

## 5. Navigation Components

Application navigation and wayfinding.

### Sidebar Navigation

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **AppSidebar** | `src/components/admin/app-sidebar.tsx` | Main navigation sidebar | - |
| **DashboardMenuItem** | `src/components/admin/app-sidebar.tsx` | Dashboard nav link | `onClick` |
| **ResourceMenuItem** | `src/components/admin/app-sidebar.tsx` | Resource list nav link | `name`, `onClick` |
| **SidebarMenuButton** | `src/components/ui/sidebar.tsx` | Navigation button with active state | `isActive`, `tooltip`, `asChild` |

### Breadcrumbs

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **Breadcrumb** | `src/components/ui/breadcrumb.tsx` | Breadcrumb nav container | - |
| **BreadcrumbList** | `src/components/ui/breadcrumb.tsx` | Breadcrumb item list | `className` |
| **BreadcrumbItem** | `src/components/ui/breadcrumb.tsx` | Individual breadcrumb | `className` |
| **BreadcrumbLink** | `src/components/ui/breadcrumb.tsx` | Clickable breadcrumb link | `asChild`, `href` |
| **BreadcrumbPage** | `src/components/ui/breadcrumb.tsx` | Current page (non-clickable) | `className` |
| **BreadcrumbSeparator** | `src/components/ui/breadcrumb.tsx` | Separator between items | `children` |
| **BreadcrumbAdmin** | `src/components/admin/breadcrumb.tsx` | React Admin breadcrumb integration | - |

### Command Palette

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **Command** | `src/components/ui/command.tsx` | Command palette container (cmdk) | `shouldFilter`, `className` |
| **CommandDialog** | `src/components/ui/command.tsx` | Command palette in dialog | `open`, `onOpenChange`, `title` |
| **CommandInput** | `src/components/ui/command.tsx` | Search input | `placeholder` |
| **CommandList** | `src/components/ui/command.tsx` | Results list container | `className` |
| **CommandEmpty** | `src/components/ui/command.tsx` | Empty state message | `children` |
| **CommandGroup** | `src/components/ui/command.tsx` | Grouped results | `heading` |
| **CommandItem** | `src/components/ui/command.tsx` | Individual result item | `onSelect`, `value` |
| **CommandShortcut** | `src/components/ui/command.tsx` | Keyboard shortcut display | `children` |
| **CommandSeparator** | `src/components/ui/command.tsx` | Group separator | - |

### Menus

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **DropdownMenu** | `src/components/ui/dropdown-menu.tsx` | Dropdown menu container | - |
| **DropdownMenuTrigger** | `src/components/ui/dropdown-menu.tsx` | Element that opens menu | `asChild` |
| **DropdownMenuContent** | `src/components/ui/dropdown-menu.tsx` | Menu content | `side`, `align` |
| **DropdownMenuItem** | `src/components/ui/dropdown-menu.tsx` | Menu item | `onSelect` |
| **DropdownMenuSeparator** | `src/components/ui/dropdown-menu.tsx` | Menu separator | - |

### Pagination

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **Pagination** | `src/components/ui/pagination.tsx` | Pagination controls | - |

---

## 6. Status / Pipeline Components

CRM-specific components for opportunity pipeline and status tracking.

### Kanban / Pipeline

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **OpportunityCard** | `src/atomic-crm/opportunities/kanban/OpportunityCard.tsx` | Kanban card with drag handle, principal color stripe | `openSlideOver`, `onDelete`, `opportunity`, `isDragOverlay` |
| **OpportunityColumn** | `src/atomic-crm/opportunities/kanban/OpportunityColumn.tsx` | Pipeline stage column with metrics | `stage`, `opportunities`, `isCollapsed`, `onToggleCollapse`, `openSlideOver` |
| **OpportunityCardActions** | `src/atomic-crm/opportunities/kanban/OpportunityCardActions.tsx` | Card action menu (edit, delete, archive) | `opportunityId`, `onDelete` |
| **StageStatusDot** | `src/atomic-crm/opportunities/kanban/StageStatusDot.tsx` | Stage health indicator (green/yellow/red) | `status`, `daysSinceLastActivity`, `daysInStage` |
| **QuickAddOpportunity** | `src/atomic-crm/opportunities/kanban/QuickAddOpportunity.tsx` | Inline opportunity creation in column | `stage`, `onOpportunityCreated` |
| **ColumnCustomizationMenu** | `src/atomic-crm/opportunities/kanban/ColumnCustomizationMenu.tsx` | Column visibility settings | `visibleColumns`, `onToggleColumn` |

### Status Badges

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **NextTaskBadge** | `src/atomic-crm/opportunities/components/NextTaskBadge.tsx` | Upcoming task indicator | `opportunityId` |
| **CustomerDistributorIndicator** | `src/atomic-crm/opportunities/components/CustomerDistributorIndicator.tsx` | Customer/distributor type badge | `type` |
| **DistributorAuthorizationWarning** | `src/atomic-crm/opportunities/components/DistributorAuthorizationWarning.tsx` | Missing authorization alert | `distributorId`, `principalId` |
| **ArchivedBanner** | `src/atomic-crm/opportunities/components/ArchivedBanner.tsx` | Archived record indicator | - |

### Views & Lists

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **OpportunityList** | `src/atomic-crm/opportunities/OpportunityList.tsx` | Opportunity list with Kanban/table toggle | - |
| **OpportunityViewSwitcher** | `src/atomic-crm/opportunities/OpportunityViewSwitcher.tsx` | Toggle between Kanban/table view | `view`, `onViewChange` |
| **OpportunitySlideOver** | `src/atomic-crm/opportunities/OpportunitySlideOver.tsx` | Opportunity detail slide-over panel | `id`, `open`, `onOpenChange` |
| **OpportunityListFilter** | `src/atomic-crm/opportunities/OpportunityListFilter.tsx` | Opportunity list filters | - |
| **PrincipalGroupedList** | `src/atomic-crm/opportunities/PrincipalGroupedList.tsx` | Opportunities grouped by principal | - |
| **CampaignGroupedList** | `src/atomic-crm/opportunities/CampaignGroupedList.tsx` | Opportunities grouped by campaign | - |

### Quick Actions

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **QuickAddButton** | `src/atomic-crm/opportunities/quick-add/QuickAddButton.tsx` | Floating quick-add button | `onClick` |
| **QuickAddDialog** | `src/atomic-crm/opportunities/quick-add/QuickAddDialog.tsx` | Quick opportunity creation dialog | `open`, `onOpenChange` |
| **QuickAddForm** | `src/atomic-crm/opportunities/quick-add/QuickAddForm.tsx` | Streamlined opportunity form | `onSuccess`, `onCancel` |
| **CloseOpportunityModal** | `src/atomic-crm/opportunities/components/CloseOpportunityModal.tsx` | Win/loss close dialog | `opportunityId`, `open`, `onOpenChange` |

---

## 7. Action Buttons

Common action components for CRUD operations.

| Component | Location | Description | Key Props |
|-----------|----------|-------------|-----------|
| **CreateButton** | `src/components/admin/create-button.tsx` | Create new record button | `resource`, `label` |
| **EditButton** | `src/components/admin/edit-button.tsx` | Edit record button | `record`, `label` |
| **ShowButton** | `src/components/admin/show-button.tsx` | View record button | `record`, `label` |
| **DeleteButton** | `src/components/admin/delete-button.tsx` | Delete with confirmation | `record`, `confirmTitle` |
| **SaveButton** | `src/components/admin/form/form-primitives.tsx` | Form save button | `alwaysEnable`, `label` |
| **CancelButton** | `src/components/admin/cancel-button.tsx` | Cancel/back button | `label` |
| **RefreshButton** | `src/components/admin/refresh-button.tsx` | Refresh list data | - |
| **BulkExportButton** | `src/components/admin/bulk-export-button.tsx` | Export selected records | `exporter` |
| **BulkActionsToolbar** | `src/components/admin/bulk-actions-toolbar.tsx` | Bulk action container | `children` |
| **IconButtonWithTooltip** | `src/components/admin/icon-button-with-tooltip.tsx` | Icon button with tooltip | `icon`, `tooltip`, `onClick` |

---

## 8. Base UI Components

Shadcn/ui primitives available for composition.

| Component | Location | Description |
|-----------|----------|-------------|
| **Button** | `src/components/ui/button.tsx` | Base button with variants |
| **Input** | `src/components/ui/input.tsx` | Text input field |
| **Textarea** | `src/components/ui/textarea.tsx` | Multi-line text input |
| **Select** | `src/components/ui/select.tsx` | Native-style select dropdown |
| **Checkbox** | `src/components/ui/checkbox.tsx` | Checkbox input |
| **Switch** | `src/components/ui/switch.tsx` | Toggle switch |
| **RadioGroup** | `src/components/ui/radio-group.tsx` | Radio button group |
| **Label** | `src/components/ui/label.tsx` | Form label |
| **Form** | `src/components/ui/form.tsx` | React Hook Form integration |
| **Calendar** | `src/components/ui/calendar.tsx` | Date picker calendar |
| **Combobox** | `src/components/ui/combobox.tsx` | Searchable select |
| **InlineCombobox** | `src/components/ui/inline-combobox.tsx` | Compact inline combobox |
| **Accordion** | `src/components/ui/accordion.tsx` | Expandable sections |
| **ToggleGroup** | `src/components/ui/toggle-group.tsx` | Grouped toggle buttons |
| **Drawer** | `src/components/ui/drawer.tsx` | Bottom sheet drawer (mobile) |

---

## Usage Notes

### Touch Targets
All interactive elements follow WCAG AA guidelines with minimum 44x44px touch targets (`h-11 w-11`).

### Semantic Colors
Always use Tailwind v4 semantic color tokens:
- `text-foreground`, `text-muted-foreground`
- `bg-background`, `bg-card`, `bg-primary`
- `border-border`
- `text-destructive` for errors

Never use raw color values like `text-gray-500` or `bg-green-600`.

### Form Patterns
1. Zod validation at API boundary only (not in forms)
2. Form defaults from schema: `zodSchema.partial().parse({})`
3. Use `onSubmit` mode (not `onChange`) to prevent re-render storms
4. Use `useWatch()` for subscriptions, not `watch()`

### Accessibility
- `aria-invalid={!!error}` on inputs with validation errors
- `aria-describedby={errorId}` linking input to error message
- `role="alert"` on error messages for screen reader announcements
