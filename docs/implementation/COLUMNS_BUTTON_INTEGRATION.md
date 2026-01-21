# ColumnsButton Integration Guide

**Status:** Refactored component ready for integration
**Component:** `src/components/ra-wrappers/columns-button.tsx`
**Last Updated:** 2026-01-20

---

## Summary

The `ColumnsButton` component has been refactored to match the `CheckboxColumnFilter` UI pattern:
- ✅ Header/Body/Footer structure
- ✅ Switch → Checkbox controls
- ✅ Show All / Reset buttons with counter
- ✅ 44px touch targets, hover states
- ✅ Drag-to-reorder support preserved

**However**, the component is **not yet integrated** into list views. This guide shows how to add it.

---

## Integration Steps

### Step 1: Import ColumnsButton in List Actions

**File:** `src/atomic-crm/{resource}/ContactList.tsx` (or any other list)

```tsx
// Add import at top
import { ColumnsButton } from "@/components/ra-wrappers/columns-button";

// In ContactListActions component:
const ContactListActions = () => {
  const { selectedIds } = useListContext();
  return (
    <TopToolbar>
      <SortButton fields={["first_name", "title", "last_seen"]} />
      <ColumnsButton>
        {/* Column definitions passed from DataTable.Col elements */}
      </ColumnsButton>
      {!selectedIds?.length && <ExportButton />}
    </TopToolbar>
  );
};
```

### Step 2: Wrap DataTable Columns with ColumnsSelectorItem

The `ColumnsButton` wraps `ColumnsSelectorItem` components (one for each column):

```tsx
// In the PremiumDatagrid or DataTable:
<ColumnsButton>
  <ColumnsSelectorItem source="first_name" label="First Name" />
  <ColumnsSelectorItem source="last_name" label="Last Name" />
  <ColumnsSelectorItem source="status" label="Status" />
  {/* ... more columns */}
</ColumnsButton>
```

**Important:** These items tell the button which columns are available for toggling.

### Step 3: Verify DataTable Respects Hidden Columns

The `FieldToggle` (inside ColumnsButton) manages `hiddenColumns` state in React Admin's data table context. Ensure your DataTable component respects this:

```tsx
// The DataTable should automatically respect hiddenColumns
// This is handled by React Admin's useStore hook
const [hiddenColumns, setHiddenColumns] = useStore(storeKey, defaultHiddenColumns);

// Render columns conditionally:
{columns.map(col => {
  if (hiddenColumns.includes(col.source)) return null; // Skip hidden
  return <Column {...col} />;
})}
```

---

## Example: Integrate ColumnsButton into ContactList

### Before (Current State)

```tsx
// src/atomic-crm/contacts/ContactList.tsx
const ContactListActions = () => {
  const { selectedIds } = useListContext();
  return (
    <TopToolbar>
      <SortButton fields={["first_name", "title", "last_seen"]} />
      {!selectedIds?.length && <ExportButton />}
    </TopToolbar>
  );
};
```

### After (With ColumnsButton)

```tsx
import { ColumnsButton, ColumnsSelectorItem } from "@/components/ra-wrappers/columns-button";

const ContactListActions = () => {
  const { selectedIds } = useListContext();
  return (
    <TopToolbar>
      <SortButton fields={["first_name", "title", "last_seen"]} />
      <ColumnsButton>
        <ColumnsSelectorItem source="avatar" label="Avatar" />
        <ColumnsSelectorItem source="first_name" label="First Name" />
        <ColumnsSelectorItem source="last_name" label="Last Name" />
        <ColumnsSelectorItem source="company" label="Organization" />
        <ColumnsSelectorItem source="status" label="Status" />
        <ColumnsSelectorItem source="nb_notes" label="Notes" />
        <ColumnsSelectorItem source="last_seen" label="Last Activity" />
      </ColumnsButton>
      {!selectedIds?.length && <ExportButton />}
    </TopToolbar>
  );
};
```

---

## Storage & Persistence

Hidden columns are persisted in **localStorage** under the key:

```
{storeKey}  // e.g., "contacts.datatable" (default hidden columns)
{storeKey}_columnRanks  // Drag-to-reorder order
```

**Automatic features:**
- ✅ Hidden state persists across page reloads
- ✅ Reorder state persists via drag handles
- ✅ Default hidden columns restored on Reset button
- ✅ Show All reveals all columns instantly

---

## Behavior

### Show All Button
- **Disabled when:** All columns visible
- **Action:** Clears `hiddenColumns` array
- **Result:** Instantly reveals all columns

### Reset Button
- **Visible when:** Columns differ from defaults
- **Action:** Clears both `hiddenColumns` and `columnRanks`
- **Result:** Restores default visibility + column order

### Drag-to-Reorder
- **Trigger:** Grab the grip handle (≡ icon) on each row
- **Action:** Drag to new position
- **Persistence:** Saved to `{storeKey}_columnRanks`

### Search (>5 columns)
- **Shows when:** ≥6 columns total
- **Filters:** Column list by name (case-insensitive, diacritics stripped)
- **Clear button:** X icon to reset filter

---

## Lists Ready for Integration

Based on code search, these lists should integrate ColumnsButton:

| Resource | File | Status |
|----------|------|--------|
| Contacts | `src/atomic-crm/contacts/ContactList.tsx` | Ready |
| Organizations | `src/atomic-crm/organizations/index.tsx` | Needs check |
| Opportunities | `src/atomic-crm/opportunities/index.tsx` | Needs check |
| Products | `src/atomic-crm/products/index.tsx` | Needs check |
| Product Distributors | `src/atomic-crm/productDistributors/index.tsx` | Needs check |

---

## Verification After Integration

**Manual E2E Testing:**

1. Open list view (e.g., Contacts)
2. Click Columns button → popover appears
3. ✅ Uncheck a column → column disappears from table
4. ✅ Click "Show All" → all columns reappear
5. ✅ Hide columns again, click "Reset" → defaults restored
6. ✅ Drag a column via grip → reorder persists after reload
7. ✅ Close/reopen popover → state preserved

**Automated Tests:**

- `PremiumDatagrid` should not render hidden columns
- `useStore` hook persists hidden columns to localStorage
- `ColumnsSelectorItem` exports correct sources
- `FieldToggle` properly toggles visibility

---

## API Reference

### ColumnsButton

```tsx
<ColumnsButton
  resource?: string  // Override resource (auto-detected from context)
  storeKey?: string  // Override storage key (default: "{resource}.datatable")
  children?: ReactNode  // ColumnsSelectorItem elements
>
  {/* Pass ColumnsSelectorItem children */}
</ColumnsButton>
```

### ColumnsSelectorItem

```tsx
<ColumnsSelectorItem
  source: string  // Column field name (required)
  label?: string  // Display label (auto-translated if not provided)
/>
```

---

## Known Issues & Limitations

| Issue | Workaround |
|-------|-----------|
| Drag-to-reorder slow on 20+ columns | Only show top 10 in list, use search for others |
| Column order resets if table structure changes | Users must manually reorder after schema updates |
| Hidden state not synced across browser tabs | Store key is tab-specific (by design) |

---

## Next Steps (Not in Current Scope)

Future enhancements for consideration:
- [ ] Preset column profiles (e.g., "Sales View", "Admin View")
- [ ] Column grouping / categories
- [ ] Column visibility as user preference (backend sync)
- [ ] Mobile-optimized column subset
- [ ] Column width customization

---

## Files Modified by Refactor

- `src/components/ra-wrappers/columns-button.tsx` - Refactored UI
- `src/components/ra-wrappers/field-toggle.tsx` - Updated to use Checkbox
- `docs/tests/e2e/columns-button-refactor.md` - E2E test guide

**Files NOT modified** (integration still needed):
- `src/atomic-crm/contacts/ContactList.tsx`
- `src/atomic-crm/organizations/index.tsx`
- Other list components
