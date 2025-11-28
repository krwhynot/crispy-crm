---
> **⚠️ SUPERSEDED**: See `../PRD.md` v1.18 Section 9 (UI/UX Guidelines) for current requirements.

**Part of:** Crispy-CRM Product Requirements Document (v1.5 - ARCHIVED)
**Category:** Design System
**Document:** 16-design-components.md

**Related Documents:**
- 📋 [README - Master Index](./00-README.md)
- 🎨 [Design Tokens](./15-design-tokens.md)
- 📐 [Design Layout & Accessibility](./17-design-layout.md)
- 🏢 [Organizations Feature](./03-organizations.md)
- 🎯 [Opportunities Feature](./04-opportunities.md)
- 👤 [Contacts Feature](./05-contacts.md)
- 📋 [Tasks Feature](./07-tasks.md)
- 📝 [Notes Feature](./08-notes.md)
---

## 📊 Implementation Status

**Last Updated:** November 4, 2025

| Metric | Status |
|--------|--------|
| **Completion** | ✅ **100%** |
| **Confidence** | 🟢 **VERY HIGH** - Production ready, exceeds PRD |
| **Total Components** | 129+ |
| **shadcn/ui Base** | 41 components |
| **React Admin Wrappers** | 79 components |
| **Custom CRM** | 9 components |
| **Storybook Coverage** | 24 story files (58% of UI components) |

**Completed Requirements:**

**shadcn/ui Base Components (41):**
- ✅ Form components (14): input, select, checkbox, radio-group, textarea, label, switch, combobox, command, toggle, toggle-group, plus admin wrappers
- ✅ Button components (1 with variants): 6 variants (default, destructive, outline, secondary, ghost, link), 4 sizes (default, sm, lg, icon)
- ✅ Card components (1): Card with 6 subcomponents (Header, Title, Description, Action, Content, Footer)
- ✅ Modal/Dialog components (4): dialog, alert-dialog, drawer, sheet
- ✅ Navigation components (4): navigation-menu, breadcrumb, sidebar, dropdown-menu
- ✅ Data display (5): table (with subcomponents), badge (4 variants), avatar, accordion, collapsible
- ✅ Feedback components (6): alert, sonner toasts, tooltip, progress, skeleton, spinner
- ✅ Utility components (6): popover, scroll-area, separator, tabs, pagination, VirtualizedList

**React Admin Integration (79 components):**
- ✅ Data table with sorting, bulk selection, column visibility (data-table.tsx)
- ✅ Form components (15): text-input, select-input, number-input, boolean-input, file-input, autocomplete-input, autocomplete-array-input, multi-select-input, radio-button-group-input, array-input, simple-form-iterator, reference-input, reference-array-input, form.tsx, simple-form.tsx
- ✅ Field components (13): text-field, number-field, date-field, email-field, url-field, file-field, badge-field, select-field, record-field, reference-field, reference-array-field, reference-many-field, array-field
- ✅ Action buttons (15): create, edit, show, delete, cancel, export, bulk-export, bulk-delete, refresh, columns, sort, toggle-filter, create-in-dialog

**Custom CRM Components (9):**
- ✅ FloatingCreateButton (FAB for quick creation)
- ✅ NotificationBell with badge
- ✅ NotificationDropdown with list
- ✅ QuickAdd components (Button, Dialog, Form)
- ✅ KeyboardShortcutsModal
- ✅ Supabase auth components (3)

**PRD Requirements Verification:**
- ✅ Button variants: 100% (all 6 variants, 4 sizes, all states)
- ✅ Form inputs: 100% (text, select, checkbox, radio, textarea, searchable combobox)
- ✅ Badges: 100% (priority/status variants with 4 styles)
- ✅ Cards: 100% (standard + interactive with hover states)
- ✅ Modals: 100% (dialog with overlay, header, footer)
- ✅ Tables: 100% (sortable, selectable, hover states, responsive)
- ✅ Navigation: 100% (sidebar, breadcrumb, dropdown)

**Advanced Features:**
- ✅ Accessibility (ARIA labels, focus-visible rings, keyboard nav, screen reader support)
- ✅ Type-safe variants (class-variance-authority)
- ✅ Dark mode support via CSS variables
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Performance optimized (virtualization, lazy loading)
- ✅ Radix UI primitives (production-tested foundation)

**Storybook Documentation:**
- ✅ 24 story files documenting component usage
- ✅ 58% UI component coverage

**Unfinished Tasks:** None

**Blockers:** None

**Status:** Component library is 100% complete and exceeds PRD requirements. All specified components are implemented with production-ready shadcn/ui + Radix UI foundation. Additional components beyond PRD (tabs, accordion, command palette, virtualized lists) enhance functionality. Comprehensive accessibility features, type safety, and design system integration throughout.

---

# 16. Design Components

## 4.2 Component Library Specifications

### Buttons

**Variants:**

```tsx
// Primary button (main actions)
<button className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200">
  Create Opportunity
</button>

// Secondary button (alternative actions)
<button className="inline-flex items-center justify-center px-4 py-2 border border-neutral-300 rounded text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200">
  Cancel
</button>

// Destructive button (delete, remove actions)
<button className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded text-sm font-medium text-white bg-error hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-error transition-colors duration-200">
  Delete
</button>

// Ghost button (tertiary, minimal)
<button className="inline-flex items-center justify-center px-4 py-2 rounded text-sm font-medium text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200">
  View Details
</button>
```

**Sizes:**
- Small: `px-3 py-1.5 text-xs`
- Medium (default): `px-4 py-2 text-sm`
- Large: `px-6 py-3 text-base`

**States:**
- Disabled: `opacity-50 cursor-not-allowed pointer-events-none`
- Loading: Show spinner icon, disable interactions

### Form Inputs

**Text Input:**
```tsx
<div className="space-y-1">
  <label htmlFor="org-name" className="block text-sm font-medium text-neutral-700">
    Organization Name <span className="text-error">*</span>
  </label>
  <input
    type="text"
    id="org-name"
    className="block w-full px-3 py-2 border border-neutral-300 rounded text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow duration-200"
    placeholder="Enter organization name"
  />
  <p className="text-xs text-neutral-500">Helper text goes here</p>
</div>

// Error state
<input
  type="text"
  className="block w-full px-3 py-2 border border-error rounded text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-error focus:border-transparent"
/>
<p className="text-xs text-error mt-1">This field is required</p>

// Success state
<input
  type="text"
  className="block w-full px-3 py-2 border border-success rounded text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-success focus:border-transparent"
/>
<p className="text-xs text-success mt-1">✓ Looks good</p>
```

**Dropdown/Select:**
```tsx
<div className="space-y-1">
  <label htmlFor="priority" className="block text-sm font-medium text-neutral-700">
    Priority
  </label>
  <select
    id="priority"
    className="block w-full px-3 py-2 border border-neutral-300 rounded text-base text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow duration-200"
  >
    <option value="">Select priority...</option>
    <option value="A">A</option>
    <option value="B">B</option>
    <option value="C">C</option>
    <option value="D">D</option>
  </select>
</div>
```

**Searchable Dropdown (Combobox):**
- Use library: Headless UI Combobox or Radix UI Select
- Styling matches input above
- Type-ahead filtering
- Keyboard navigation (arrow keys, Enter to select)

**Checkbox:**
```tsx
<div className="flex items-center">
  <input
    type="checkbox"
    id="weekly-priority"
    className="h-4 w-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-500 transition-colors duration-200"
  />
  <label htmlFor="weekly-priority" className="ml-2 text-sm text-neutral-700">
    Weekly Priority
  </label>
</div>
```

**Radio Buttons:**
```tsx
<div className="space-y-2">
  <label className="block text-sm font-medium text-neutral-700">Priority</label>
  <div className="space-y-1">
    <div className="flex items-center">
      <input type="radio" id="priority-a" name="priority" value="A" className="h-4 w-4 text-primary-500 border-neutral-300 focus:ring-primary-500" />
      <label htmlFor="priority-a" className="ml-2 text-sm text-neutral-700">A</label>
    </div>
    <div className="flex items-center">
      <input type="radio" id="priority-b" name="priority" value="B" className="h-4 w-4 text-primary-500 border-neutral-300 focus:ring-primary-500" />
      <label htmlFor="priority-b" className="ml-2 text-sm text-neutral-700">B</label>
    </div>
  </div>
</div>
```

**Textarea:**
```tsx
<div className="space-y-1">
  <label htmlFor="notes" className="block text-sm font-medium text-neutral-700">
    Notes
  </label>
  <textarea
    id="notes"
    rows={4}
    className="block w-full px-3 py-2 border border-neutral-300 rounded text-base text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow duration-200"
    placeholder="Add any additional notes..."
  />
  <p className="text-xs text-neutral-500">500 characters remaining</p>
</div>
```

### Badges

**Priority Badges:**
```tsx
// A Priority (Highest)
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-priority-a text-white">
  A
</span>

// Status badges
<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-open text-white">
  Open
</span>

<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-status-sold text-white">
  SOLD
</span>
```

**Stage Badges:**
```tsx
<span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-700">
  Stage 3
</span>
```

### Cards

```tsx
// Standard card
<div className="bg-surface-raised shadow-sm rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Card Title</h3>
  <p className="text-sm text-neutral-600">Card content goes here...</p>
</div>

// Interactive card (clickable)
<div className="bg-surface-raised shadow-sm rounded-lg p-6 cursor-pointer hover:shadow-md hover:border-primary-300 transition-all duration-200 border border-transparent">
  {/* Card content */}
</div>
```

### Modals

```tsx
// Modal overlay (using Headless UI Dialog)
<Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300" />

// Modal panel
<Dialog.Panel className="fixed inset-y-0 right-0 w-full max-w-md bg-surface-overlay shadow-xl transition-transform duration-300">
  <div className="flex flex-col h-full">
    {/* Header */}
    <div className="px-6 py-4 border-b border-neutral-200">
      <Dialog.Title className="text-xl font-semibold text-neutral-900">
        Create Organization
      </Dialog.Title>
    </div>

    {/* Body (scrollable) */}
    <div className="flex-1 overflow-y-auto px-6 py-4">
      {/* Form content */}
    </div>

    {/* Footer */}
    <div className="px-6 py-4 border-t border-neutral-200 flex justify-end space-x-3">
      <button className="secondary-button">Cancel</button>
      <button className="primary-button">Create</button>
    </div>
  </div>
</Dialog.Panel>
```

### Tables

```tsx
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-neutral-200">
    <thead className="bg-neutral-50">
      <tr>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Organization
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
          Priority
        </th>
        {/* More headers */}
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-neutral-200">
      <tr className="hover:bg-neutral-50 transition-colors duration-150">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">
          Ballyhoo Hospitality
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className="badge badge-priority-a">A</span>
        </td>
        {/* More cells */}
      </tr>
    </tbody>
  </table>
</div>
```
