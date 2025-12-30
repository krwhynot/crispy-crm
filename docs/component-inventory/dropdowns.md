# Dropdown Component Inventory

> Generated: 2025-12-29
> Source: `src/components/ui/`, `src/components/admin/`, `src/atomic-crm/`
> Design System: OKLCH-based semantic colors, Tailwind v4

## Overview

| Component | File | Type | Touch Target | Design System |
|-----------|------|------|--------------|---------------|
| [Select](#select) | `ui/select.tsx` | Primitive | 48px | Compliant |
| [SelectUI](#selectui) | `ui/select-ui.tsx` | Unified | 48px | Compliant |
| [FilterSelectUI](#filterselectui) | `ui/filter-select-ui.tsx` | Filter | 36px (h-9) | Compliant |
| [Combobox](#combobox) | `ui/combobox.tsx` | Primitive | 48px | Compliant |
| [DropdownMenu](#dropdownmenu) | `ui/dropdown-menu.tsx` | Action Menu | 44px | Compliant |
| [SelectInput](#selectinput) | `admin/select-input.tsx` | Form Input | 48px | Compliant |
| [GenericSelectInput](#genericselectinput) | `admin/generic-select-input.tsx` | Polymorphic | 48px | Compliant |
| [AutocompleteInput](#autocompleteinput) | `admin/autocomplete-input.tsx` | Form Input | 48px | Compliant |

---

## UI Primitives (src/components/ui/)

### Select

**Purpose:** Radix UI Select primitives. Simple single-select dropdown, no search capability.

**File:** `src/components/ui/select.tsx`

**Exports:**
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`
- `SelectItem`, `SelectGroup`, `SelectLabel`, `SelectSeparator`
- `SelectScrollUpButton`, `SelectScrollDownButton`

**Usage:** Base primitive for simple enumeration dropdowns. Wrapped by `SelectInput` for React Admin forms.

---

### SelectUI

**Purpose:** Unified select component with multi-select, searchable, and clearable variants. The consolidated dropdown for most use cases.

**File:** `src/components/ui/select-ui.tsx`

**Key Features:**
- Single-select and multi-select modes
- Searchable with client/server filtering threshold (100 items)
- Rich item rendering with icons/descriptions
- Sticky footer support for create actions
- Smart empty state with create button
- Clearable option

**Props:**
```typescript
interface SelectUIProps {
  options: SelectOption[]
  value?: string | string[]
  onChange?: (value: string | string[]) => void
  multiple?: boolean
  searchable?: boolean
  clearable?: boolean
  placeholder?: string
  emptyMessage?: string
  onCreateClick?: () => void
  createLabel?: string
}
```

**Usage:** Wrapped by `GenericSelectInput` for React Admin integration.

---

### FilterSelectUI

**Purpose:** Compact multi-select optimized for list column filters (Pattern G).

**File:** `src/components/ui/filter-select-ui.tsx`

**Key Features:**
- Compact trigger (h-9 vs h-12)
- Badge showing selected count
- Clear button
- Checkbox toggles for multi-select
- Optimized for filter bars

**Usage:** Used by `CheckboxColumnFilter` and list filter components.

---

### Combobox

**Purpose:** Searchable single-select using Command palette pattern (cmdk).

**File:** `src/components/ui/combobox.tsx`

**Exports:**
- `Combobox` - Single-select with search
- `MultiSelectCombobox` - Multi-select with "X selected" badge

**Usage:** Base for `AutocompleteInput` and domain-specific searchable selects.

---

### DropdownMenu

**Purpose:** Action menus and context menus. NOT for form inputs.

**File:** `src/components/ui/dropdown-menu.tsx`

**Exports:**
- `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`
- `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`
- `DropdownMenuGroup`, `DropdownMenuLabel`, `DropdownMenuSeparator`
- `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`

**Usage:** Row action menus, user menus, context menus. Supports nested submenus.

---

## React Admin Form Inputs (src/components/admin/)

### SelectInput

**Purpose:** React Admin form dropdown using Radix Select primitives.

**File:** `src/components/admin/select-input.tsx`

**Key Features:**
- React Hook Form integration via `useInput`
- Zod validation display
- Clear button (X)
- Create inline support via `useSupportCreateSuggestion`
- Loading skeleton state

**Props:** Extends `CommonInputProps` from React Admin.

---

### GenericSelectInput

**Purpose:** Polymorphic select that works in React Admin form context OR standalone controlled mode.

**File:** `src/components/admin/generic-select-input.tsx`

**Key Features:**
- Wraps `SelectUI` component
- With `source` prop: integrates with React Admin form
- With `value`/`onChange`: standalone controlled component
- Bridges React Admin and standalone use cases

**Usage:** Used by `StateComboboxInput`, `TimeZoneSelect`, and other domain selects.

---

### AutocompleteInput

**Purpose:** Searchable form dropdown using Command palette pattern.

**File:** `src/components/admin/autocomplete-input.tsx`

**Key Features:**
- Filters choices as you type
- Create inline support
- Server-side filtering for large datasets
- Works with `ReferenceInput` for API data

---

### AutocompleteArrayInput

**Purpose:** Searchable multi-select with badge chips for selected items.

**File:** `src/components/admin/autocomplete-array-input.tsx`

**Key Features:**
- Selected items shown as dismissable badges
- Used for many-to-many relationships
- Integrates with `ReferenceArrayInput`

---

### MultiSelectInput

**Purpose:** Checkbox-based multi-select in dropdown menu.

**File:** `src/components/admin/multi-select-input.tsx`

**Key Features:**
- Uses DropdownMenu (not Popover)
- Shows count badge
- Clear all functionality

---

### ReferenceInput

**Purpose:** Wrapper that fetches choices from API for related entities.

**File:** `src/components/admin/reference-input.tsx`

**Default Child:** `AutocompleteInput`

**Usage:** `<ReferenceInput source="principal_id" reference="organizations" />`

---

### SelectField

**Purpose:** Read-only display for enumeration values. NOT a form input.

**File:** `src/components/admin/select-field.tsx`

**Usage:** List views, Show pages.

---

## Domain-Specific Components

### AutocompleteOrganizationInput

**Purpose:** Organization selector with quick-create popover.

**File:** `src/atomic-crm/organizations/AutocompleteOrganizationInput.tsx`

**Key Features:**
- Wraps `AutocompleteInput`
- Quick-create popover for new organizations
- Opens dialog for inline org creation

---

### StateComboboxInput

**Purpose:** US state selector.

**File:** `src/components/admin/state-combobox-input.tsx`

**Choices:** 50 US states + DC

**Uses:** `GenericSelectInput` with `US_STATES` choices

---

### SegmentSelectInput

**Purpose:** Conditional segment selector based on organization type.

**File:** `src/components/admin/SegmentComboboxInput.tsx`

**Key Features:**
- Uses `useWatch()` to observe `organization_type`
- Distributors/Principals: Shows Playbook categories
- Customers/Prospects: Shows Operator segments

**Alias:** `SegmentComboboxInput` (backward compatible)

---

### EntityCombobox

**Purpose:** Entity selector for QuickLogForm (Pattern H).

**File:** `src/atomic-crm/dashboard/v3/components/EntityCombobox.tsx`

**Key Features:**
- Supports Contact, Organization, Opportunity
- Hybrid search (pre-loaded + server search)
- Loading spinner, clear button
- NO React Admin form context (standalone)

---

### TimeZoneSelect

**Purpose:** US timezone selector.

**File:** `src/atomic-crm/settings/TimeZoneSelect.tsx`

**Choices:** 8 US timezones + UTC

**Uses:** `GenericSelectInput` with `US_TIMEZONES` choices

---

### TagSelectWithCreate

**Purpose:** Tag selector with quick-create dialog (Pattern F).

**File:** `src/atomic-crm/tags/TagSelectWithCreate.tsx`

**Key Features:**
- Footer action for "Create new tag"
- Opens `TagDialog` for full creation (name + color)
- Complex quick-create pattern

---

## Filter Components

### OwnerFilterDropdown

**Purpose:** List filter for owner with role-based UI.

**File:** `src/components/admin/OwnerFilterDropdown.tsx`

**Key Features:**
- Reps: Toggle switch ("My Items" on/off)
- Managers/Admins: Full dropdown with team members
- Pattern G: Role-aware filter UI

---

### CheckboxColumnFilter

**Purpose:** Multi-select checkbox filter in popover.

**File:** `src/components/admin/column-filters/CheckboxColumnFilter.tsx`

**Key Features:**
- Badge shows active filter count
- Clear button
- Select all functionality
- 44px touch targets

---

## Utility Components (Not Form Inputs)

### NotificationDropdown

**Purpose:** Notification center dropdown menu.

**File:** `src/components/NotificationDropdown.tsx`

**Features:** Display notifications, mark as read.

---

### ColumnsButton

**Purpose:** Column visibility selector for DataTable.

**File:** `src/components/admin/columns-button.tsx`

**Features:** Show/hide columns in Popover.

---

## Summary Statistics

| Category | Count |
|----------|-------|
| UI Primitives | 6 |
| React Admin Form Inputs | 7 |
| Domain-Specific | 6 |
| Filter Components | 2 |
| Utility (non-form) | 2 |
| **Total** | **23** |

---

## Key Patterns

### Pattern F: Quick-Create with Dialog
Footer action opens full dialog for complex entity creation.
- `TagSelectWithCreate` - Opens TagDialog for name + color

### Pattern G: List Filtering
Compact selects optimized for filter bars.
- `FilterSelectUI` - Compact multi-select
- `CheckboxColumnFilter` - Popover with checkboxes
- `OwnerFilterDropdown` - Role-based UI

### Pattern H: Dashboard Entity Pickers
Standalone selects with hybrid search (pre-loaded + server).
- `EntityCombobox` - No React Admin context

### Polymorphic Components
Work in form context OR standalone.
- `GenericSelectInput` - Bridges React Admin and controlled mode

### Conditional Logic
Show different choices based on form state.
- `SegmentSelectInput` - Uses `useWatch()` for organization_type

### Cascading Dropdowns
Parent selection filters child options.
- Customer → Contacts filtered by `customer_organization_id`
- Principal → Products filtered by `principal_id`

---

## Usage by Module

| Module | Dropdown Fields | Key Components Used |
|--------|-----------------|---------------------|
| Opportunities | 8+ | AutocompleteOrganizationInput, SelectInput, AutocompleteArrayInput |
| Organizations | 5 | SegmentSelectInput, StateComboboxInput, SelectInput |
| Tasks | 6 | AutocompleteInput, SelectInput |
| Activities | 5 | EntityCombobox, SelectInput |
| Contacts | 4 | AutocompleteOrganizationInput, SelectInput |
| Products | 3 | AutocompleteInput, ReferenceInput |
| Tags | 1 | TagSelectWithCreate |
