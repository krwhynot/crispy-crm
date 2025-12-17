# Excel-Style DataGrid Research for Crispy CRM

## Executive Summary

| Aspect | Recommendation |
|--------|----------------|
| **Recommended Library** | Material React Table (MRT) v3 |
| **Recommended Integration** | Approach B - Replace Datagrid, Keep List Wrapper |
| **Effort Estimate** | 3-5 days for Contacts POC, 1-2 days per additional list |
| **Key Trade-off** | Adds MUI dependency (~150KB gzipped) but provides complete Excel-style filtering out-of-box |

**Why MRT?** It's the only 100% free library that provides built-in Excel-style column header filter dropdowns with checkbox multi-select, text operators, date ranges, global search, and virtualization for 10,000+ rows—all without building custom UI.

---

## The Problem We're Solving

Family users expect Excel-style filtering:
- ✅ Column header dropdowns with checkboxes (not sidebar filters)
- ✅ Text operators for search columns (contains, equals, starts with)
- ✅ Global search bar across all columns
- ✅ Export filtered results to Excel/CSV

**Current state:** Basic React Admin Datagrid with sidebar FilterList pattern—unfamiliar to Excel users.

---

## Library Evaluation

### License & Cost Verification

| Library | License | 100% Free | Export Free | Advanced Filters Free | Source |
|---------|---------|-----------|-------------|----------------------|--------|
| **Material React Table** | MIT | ✅ | ✅ | ✅ | [GitHub](https://github.com/KevinVandy/material-react-table) |
| **Mantine React Table** | MIT | ✅ | ✅ | ✅ | [GitHub](https://github.com/KevinVandy/mantine-react-table) |
| **TanStack Table v8** | MIT | ✅ | ✅ | ✅ (DIY UI) | [GitHub](https://github.com/TanStack/table) |
| **AG Grid Community** | MIT | ⚠️ | ❌ Enterprise | ❌ Set Filter Enterprise | [Docs](https://www.ag-grid.com/react-data-grid/filter-set/) |
| **MUI X DataGrid** | MIT/Commercial | ⚠️ | ❌ Premium | ❌ Pro required | [Licensing](https://mui.com/x/introduction/licensing/#plans) |

### Filter Capability Matrix

| Capability | MRT v3 | Mantine RT | TanStack Table | AG Grid CE | MUI X Community |
|------------|--------|------------|----------------|------------|-----------------|
| Checkbox multi-select | ✅ Built-in | ✅ Built-in | ✅ DIY | ❌ Enterprise | ❌ Pro |
| Text operators (contains/equals) | ✅ Built-in | ✅ Built-in | ✅ DIY | ✅ Built-in | ✅ Built-in |
| Date range filters | ✅ Built-in | ✅ Built-in | ✅ DIY | ✅ Built-in | ✅ Built-in |
| Global search | ✅ Built-in | ✅ Built-in | ✅ DIY | ✅ Built-in | ✅ Built-in |
| Filter UI built-in | ✅ Complete | ✅ Complete | ❌ Headless | ✅ Complete | ✅ Complete |
| Excel-style popover | ✅ `columnFilterDisplayMode: 'popover'` | ✅ `columnFilterDisplayMode: 'popover'` | ❌ DIY | ✅ | ✅ |
| Faceted values (auto-options) | ✅ `enableFacetedValues` | ✅ `enableFacetedValues` | ✅ API available | ✅ Enterprise | ❌ |

### Performance & UX Matrix

| Capability | MRT v3 | Mantine RT | TanStack Table | AG Grid CE |
|------------|--------|------------|----------------|------------|
| Virtual scroll (1,000+ rows) | ✅ 10,000+ tested | ✅ 10,000+ | ✅ via @tanstack/virtual | ✅ |
| Touch-friendly | ✅ MUI components | ✅ Mantine components | ⚠️ DIY | ✅ |
| Bundle size (gzipped) | ~150KB (with MUI) | ~120KB (with Mantine) | ~15KB (headless) | ~250KB |

### Export Capability

| Library | CSV Export | Excel Export | Exports Filtered Data | Source |
|---------|------------|--------------|----------------------|--------|
| **MRT** | ✅ via export-to-csv | ✅ via xlsx library | ✅ `table.getFilteredRowModel().rows` | [CSV Export Example](https://www.material-react-table.com/docs/examples/export-csv) |
| **Mantine RT** | ✅ via export-to-csv | ✅ via xlsx library | ✅ Same API | [CSV Export Example](https://www.mantine-react-table.com/docs/examples/export-csv) |
| **TanStack Table** | ✅ DIY | ✅ DIY | ✅ `table.getFilteredRowModel().rows` | [API Docs](https://tanstack.com/table/v8/docs/api/features/column-filtering#getfilteredrowmodel) |
| **AG Grid CE** | ✅ Built-in | ❌ Enterprise only | ✅ | [Export Docs](https://www.ag-grid.com/react-data-grid/csv-export/) |
| **React Admin** | ✅ `<ExportButton>` | ❌ | ✅ Respects current filters | [Exporter Docs](https://marmelab.com/react-admin/List.html#exporter) |

---

## Detailed Library Analysis

### Material React Table (MRT) v3 — RECOMMENDED

**Docs:** https://www.material-react-table.com
**License:** MIT ✅
**NPM:** `material-react-table` (~50K weekly downloads)

**Why Recommended:**
1. Complete Excel-style filtering UI out-of-box with `columnFilterDisplayMode: 'popover'`
2. Built-in `filterVariant: 'multi-select'` for checkbox dropdowns
3. Faceted values auto-generate filter options from data
4. Virtualization handles 10,000+ rows with filtering maintaining performance
5. Same author maintains Mantine React Table, ensuring long-term support

#### Filter Capabilities

| Filter Type | Support | Built-in UI | Code Complexity |
|-------------|---------|-------------|-----------------|
| Checkbox multi-select | ✅ | ✅ `filterVariant: 'multi-select'` | Low |
| Text operators | ✅ | ✅ `enableColumnFilterModes` | Low |
| Date range | ✅ | ✅ `filterVariant: 'date-range'` | Low |
| Global search | ✅ | ✅ `enableGlobalFilter` (default) | Low |
| Autocomplete | ✅ | ✅ `filterVariant: 'autocomplete'` | Low |

#### Code Example - Excel-Style Column Filters

```tsx
// Source: https://www.material-react-table.com/docs/guides/column-filtering
import { useMemo } from 'react';
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from 'material-react-table';

interface Contact {
  id: string;
  name: string;
  email: string;
  status: string;
  principal: string;
  createdAt: Date;
}

const ContactExcelDataGrid = ({ data }: { data: Contact[] }) => {
  const columns = useMemo<MRT_ColumnDef<Contact>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      filterVariant: 'autocomplete', // Auto-suggests from data
    },
    {
      accessorKey: 'email',
      header: 'Email',
      // Default text filter with operators (contains, equals, etc.)
    },
    {
      accessorKey: 'status',
      header: 'Status',
      filterVariant: 'multi-select', // Checkbox dropdown like Excel
    },
    {
      accessorKey: 'principal',
      header: 'Principal',
      filterVariant: 'multi-select', // Checkbox dropdown
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      filterVariant: 'date-range', // Date picker with before/after
    },
  ], []);

  const table = useMaterialReactTable({
    columns,
    data,
    // Excel-style filter dropdowns in column headers
    columnFilterDisplayMode: 'popover',
    // Auto-generate filter options from data
    enableFacetedValues: true,
    // Show filter mode switcher (contains, equals, starts with)
    enableColumnFilterModes: true,
    // Global search bar
    enableGlobalFilter: true,
    // Show global search by default
    initialState: { showGlobalFilter: true },
    // Virtualization for large datasets
    enableRowVirtualization: true,
    // Disable pagination when using virtualization
    enablePagination: false,
  });

  return <MaterialReactTable table={table} />;
};
```

#### Code Example - Export Filtered Data

```tsx
// Source: https://www.material-react-table.com/docs/examples/export-csv
import { mkConfig, generateCsv, download } from 'export-to-csv';
import { Box, Button } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

const csvConfig = mkConfig({
  fieldSeparator: ',',
  filename: 'contacts-export',
  useKeysAsHeaders: true,
});

const handleExportFilteredData = (table: MRT_TableInstance<Contact>) => {
  // Gets only the rows that pass all current filters
  const filteredRows = table.getFilteredRowModel().rows;
  const rowData = filteredRows.map((row) => row.original);
  const csv = generateCsv(csvConfig)(rowData);
  download(csvConfig)(csv);
};

// In your table setup:
const table = useMaterialReactTable({
  columns,
  data,
  renderTopToolbarCustomActions: ({ table }) => (
    <Box sx={{ display: 'flex', gap: '16px' }}>
      <Button
        onClick={() => handleExportFilteredData(table)}
        startIcon={<FileDownloadIcon />}
      >
        Export Filtered CSV
      </Button>
    </Box>
  ),
});
```

#### iPad/Touch Compatibility

- **Touch targets:** MUI components default to 48px touch targets (exceeds 44px WCAG minimum) ✅
- **Mobile docs:** [Responsive design patterns](https://www.material-react-table.com/docs/guides/responsive)
- **Filter dropdowns:** MUI Popovers are touch-friendly with adequate tap areas

---

### Mantine React Table — Second Choice

**Docs:** https://www.mantine-react-table.com
**License:** MIT ✅

**Why Second Choice:**
- Identical feature set to MRT (same author, Kevin Van Cott)
- Uses Mantine UI instead of MUI
- Would require adding Mantine as a dependency alongside existing MUI/Tailwind stack
- Slightly smaller bundle but adds ecosystem complexity

**Best for:** Projects already using Mantine UI components.

---

### TanStack Table v8 — Most Flexible, Most Effort

**Docs:** https://tanstack.com/table
**License:** MIT ✅

**Why Not Recommended:**
- Headless library: Provides filtering logic but NO built-in filter UI
- Would need to build all filter dropdowns, date pickers, multi-select UI from scratch
- Estimated 2-3 weeks to build Excel-style filter UI vs 3-5 days with MRT

**Best for:** Teams with existing design systems who need complete UI control.

---

### Disqualified Libraries

| Library | Reason | Source |
|---------|--------|--------|
| **AG Grid Community** | Set Filter (checkbox multi-select) is Enterprise-only. Excel export is Enterprise-only. | [Enterprise Filters Docs](https://www.ag-grid.com/react-data-grid/filter-set/) |
| **MUI X DataGrid** | Multi-filtering requires Pro license ($249+/year). Excel export requires Premium license ($588+/year). | [MUI X Licensing](https://mui.com/x/introduction/licensing/#plans) |

---

## Industry Standards Research

### Filter Persistence

**Question:** When user filters a list and navigates away, should filters persist?

**Industry Standard:** Yes, filters should persist within a session. The approach varies:

| App | Persistence Method | Behavior |
|-----|-------------------|----------|
| **Airtable** | URL + localStorage | Filters persist in URL (shareable). View state saved. |
| **Notion** | URL params | Filters encode in URL for sharing. |
| **Salesforce** | Server-side user preferences | Filters persist across sessions per list view. |
| **HubSpot** | localStorage + URL | Recent filter sets saved, URL for sharing specific views. |

**React Admin Built-in:** ✅ Already has localStorage persistence via Store
- Filters persist in `${resource}.listParams` key
- Can customize with `storeKey` prop for multiple lists of same resource
- **Source:** [React Admin Store Docs](https://marmelab.com/react-admin/Store.html)

**Recommendation for Crispy CRM:**
1. **Keep React Admin's default localStorage persistence** - filters survive page refresh
2. **Consider URL params for future** - enables sharing filtered views via link
3. **No additional implementation needed** - RA handles this automatically

```tsx
// React Admin already persists filters automatically
// To disable or customize:
<List storeKey="contacts-main"> // Custom store key
<List storeKey={false}> // Disable persistence
```

---

### Row Interaction Patterns

**Question:** Click row to open detail, or checkbox selection, or both?

**Industry Standard for CRM list views:**

| Pattern | When to Use | Example Apps |
|---------|-------------|--------------|
| **Click row → Detail** | Primary action is viewing/editing a single record | Salesforce, HubSpot, Pipedrive |
| **Checkbox selection** | Need bulk actions (delete, export, assign) | Gmail, Airtable |
| **Both** | Power users need flexibility | Notion, Salesforce |

**Recommendation for Crispy CRM:**
- **Keep current click-to-detail pattern** - matches CRM industry standard
- **Add checkbox selection later** when bulk actions needed (e.g., bulk delete, bulk assign)
- MRT supports both simultaneously via `enableRowSelection` prop

---

### Touch/iPad UX Standards

**WCAG 2.1 Success Criterion 2.5.5 (AAA):** Touch targets should be at least 44x44 CSS pixels.

**Material React Table Verification:**
- MUI Button/IconButton components default to 48px height ✅
- Filter popovers use MUI Select/Autocomplete with adequate touch targets ✅
- Density toggle allows switching to "comfortable" spacing for tablet use

**Recommendation:** Use MRT's default density or explicitly set `density: 'comfortable'` for iPad users.

```tsx
const table = useMaterialReactTable({
  columns,
  data,
  initialState: {
    density: 'comfortable', // Larger touch targets for iPad
  },
});
```

---

## React Admin Integration Guide

### Context for Developers New to React Admin

React Admin's list architecture:

```
<List>                    ← Wrapper: data fetching, pagination, sort, filters
  └── <ListContext>       ← Provides: data, filterValues, setFilters, etc.
       └── <Datagrid>     ← Default table renderer (replaceable!)
```

**Key insight:** You can replace `<Datagrid>` with any component that consumes `ListContext`.

### How React Admin Filter State Works

```tsx
// useListContext provides everything needed to connect external tables
const {
  data,           // Array of records from dataProvider
  filterValues,   // Current filters: { status: 'active', principal: 'ABC' }
  setFilters,     // Function to update filters
  sort,           // Current sort: { field: 'name', order: 'ASC' }
  setSort,        // Function to update sort
  page,           // Current page number
  setPage,        // Function to change page
  total,          // Total record count
} = useListContext();
```

---

### Approach A: Enhance Existing Datagrid Headers

**Feasibility:** Difficult - React Admin's Datagrid header is not designed for filter dropdowns
**What you keep:** RA's filter state, pagination, sorting, all existing patterns
**What you build:** Custom header component with filter popovers per column

```tsx
// Skeleton - Custom Datagrid header with filter dropdowns
import { TableHead, TableRow, TableCell, Popover } from '@mui/material';
import { DatagridHeaderProps, useListContext } from 'react-admin';

const FilterableDatagridHeader = ({ children }: DatagridHeaderProps) => {
  const { filterValues, setFilters } = useListContext();

  return (
    <TableHead>
      <TableRow>
        {React.Children.map(children, (child) => (
          <TableCell>
            {child.props.source}
            <FilterPopover
              field={child.props.source}
              value={filterValues[child.props.source]}
              onChange={(value) => setFilters({ ...filterValues, [child.props.source]: value })}
            />
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
};
```

**Effort:** 2-3 weeks (must build all filter UI components from scratch)
**Risk:** High - Fighting against RA's design patterns, maintenance burden

---

### Approach B: Replace Datagrid, Keep List Wrapper — RECOMMENDED

**Feasibility:** Straightforward - MRT designed for this use case
**What you keep:** RA's `<List>` wrapper for data fetching, URL sync, pagination state
**What you build:** Bridge component connecting MRT to RA's ListContext

```tsx
// ContactList.tsx - Using MRT inside React Admin's List
import { List, useListContext, TopToolbar, CreateButton, ExportButton } from 'react-admin';
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { useMemo } from 'react';

const ContactListActions = () => (
  <TopToolbar>
    <CreateButton />
    <ExportButton /> {/* RA's export respects filters automatically */}
  </TopToolbar>
);

export const ContactList = () => (
  <List
    actions={<ContactListActions />}
    // Remove default filters since MRT handles them
    filters={[]}
    // Disable RA's pagination - MRT will handle display
    perPage={1000}
  >
    <ContactExcelDataGrid />
  </List>
);

// Bridge component connecting MRT to React Admin
const ContactExcelDataGrid = () => {
  const {
    data,
    isPending,
    filterValues,
    setFilters,
    sort,
    setSort,
  } = useListContext<Contact>();

  const columns = useMemo<MRT_ColumnDef<Contact>[]>(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      filterVariant: 'autocomplete',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'status',
      header: 'Status',
      filterVariant: 'multi-select',
    },
    {
      accessorKey: 'principal',
      header: 'Principal',
      filterVariant: 'multi-select',
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      filterVariant: 'date-range',
      Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString(),
    },
  ], []);

  const table = useMaterialReactTable({
    columns,
    data: data ?? [],
    // Excel-style popover filters
    columnFilterDisplayMode: 'popover',
    enableFacetedValues: true,
    enableColumnFilterModes: true,
    enableGlobalFilter: true,
    // Virtualization for performance
    enableRowVirtualization: true,
    enablePagination: false,
    // Sync MRT filters back to React Admin
    manualFiltering: true, // We'll handle filtering via RA
    state: {
      isLoading: isPending,
      // Convert RA filter format to MRT format
      columnFilters: Object.entries(filterValues).map(([id, value]) => ({ id, value })),
      sorting: sort ? [{ id: sort.field, desc: sort.order === 'DESC' }] : [],
    },
    // When MRT filters change, update React Admin
    onColumnFiltersChange: (updater) => {
      const newFilters = typeof updater === 'function'
        ? updater(Object.entries(filterValues).map(([id, value]) => ({ id, value })))
        : updater;
      const raFilters = Object.fromEntries(newFilters.map(f => [f.id, f.value]));
      setFilters(raFilters, {});
    },
    onSortingChange: (updater) => {
      const newSort = typeof updater === 'function' ? updater([]) : updater;
      if (newSort.length > 0) {
        setSort({ field: newSort[0].id, order: newSort[0].desc ? 'DESC' : 'ASC' });
      }
    },
    // Row click navigation
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => {
        // Navigate to detail view
        window.location.href = `#/contacts/${row.original.id}/show`;
      },
      sx: { cursor: 'pointer' },
    }),
    // Touch-friendly density
    initialState: {
      density: 'comfortable',
      showGlobalFilter: true,
    },
  });

  return <MaterialReactTable table={table} />;
};
```

**Effort:** 3-5 days for full implementation
**Risk:** Low - MRT is well-documented, pattern is supported

---

### Approach C: Fully Custom List with useListController

**Feasibility:** More work but maximum flexibility
**What you keep:** Just `dataProvider` access
**What you build:** Everything else - pagination, URL sync, etc.

```tsx
// Fully custom approach - more control, more code
import { useListController, ListContextProvider } from 'react-admin';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';

const FullyCustomContactList = () => {
  const listContext = useListController({
    resource: 'contacts',
    perPage: 1000,
    sort: { field: 'name', order: 'ASC' },
  });

  const table = useMaterialReactTable({
    columns,
    data: listContext.data ?? [],
    // Full control over all state
    // Must manually wire up pagination, sorting, filtering
  });

  return (
    <ListContextProvider value={listContext}>
      <MaterialReactTable table={table} />
    </ListContextProvider>
  );
};
```

**Effort:** 5-7 days
**Risk:** Medium - More code to maintain, must reimplement RA features

---

### Integration Comparison

| Factor | Approach A (Custom Headers) | Approach B (Replace Datagrid) | Approach C (Fully Custom) |
|--------|---------------------------|------------------------------|--------------------------|
| Keeps RA pagination | ✅ | ✅ | ❌ DIY |
| Keeps RA sorting | ✅ | ✅ | ❌ DIY |
| Keeps RA data fetching | ✅ | ✅ | ✅ |
| Keeps RA URL sync | ✅ | ✅ | ⚠️ Manual |
| Keeps RA export | ✅ | ✅ | ⚠️ Manual |
| Excel-style filters | ⚠️ Must build UI | ✅ Built-in | ✅ Built-in |
| Learning curve | Medium | Low | High |
| Effort | 2-3 weeks | 3-5 days | 5-7 days |
| Long-term maintainability | Low | High | Medium |

---

## Recommendation

### Library: Material React Table (MRT) v3

**Why:**
1. **100% free, MIT licensed** - no feature-gating or paid tiers
2. **Excel-style filters built-in** - `filterVariant: 'multi-select'` + `columnFilterDisplayMode: 'popover'`
3. **Faceted values** - auto-generates filter options from data (no manual setup)
4. **10,000+ row virtualization** - handles Contact table scale
5. **Active maintenance** - same author as Mantine React Table, regular updates
6. **MUI-based** - consistent with React Admin's Material UI theming

### Integration: Approach B (Replace Datagrid, Keep List)

**Why:**
1. Minimal learning curve - uses familiar React Admin patterns
2. Keeps RA's built-in export, pagination, URL sync, localStorage persistence
3. Clean separation - MRT handles display/filtering, RA handles data
4. Easy rollback if needed - just swap the component inside `<List>`

---

## Theming for Crispy CRM (Garden to Table)

**Verified:** MRT fully supports custom theming via MUI's ThemeProvider system.
**Source:** [MRT Customize Components Guide](https://www.material-react-table.com/docs/guides/customize-components)

### Theming Capabilities Confirmed ✅

| Capability | Support | Method |
|------------|---------|--------|
| Custom color palette | ✅ | MUI `createTheme()` |
| Table-specific theme | ✅ | Nested `<ThemeProvider>` |
| Component-level styling | ✅ | `mui...Props` with `sx` prop |
| MRT-specific colors | ✅ | `mrtTheme` option (v3+) |
| Dark mode | ✅ | Theme palette mode |

### Option 1: MUI Theme Provider (Recommended)

Wrap the table in a ThemeProvider with Crispy's Garden to Table colors:

```tsx
// src/theme/crispyMRTTheme.ts
// Source: https://www.material-react-table.com/docs/guides/customize-components#material-ui-theme
import { createTheme, ThemeProvider } from '@mui/material/styles';

export const crispyMRTTheme = createTheme({
  palette: {
    primary: {
      main: 'oklch(0.65 0.2 145)',      // Garden green (semantic --primary)
      light: 'oklch(0.75 0.15 145)',
      dark: 'oklch(0.55 0.22 145)',
      contrastText: '#FAFAFA',           // Off-white, not pure #FFF
    },
    secondary: {
      main: 'oklch(0.55 0.12 75)',       // Warm cafe brown accent
    },
    background: {
      default: 'oklch(0.98 0.01 90)',    // Warm off-white
      paper: 'oklch(0.99 0.005 90)',
    },
    text: {
      primary: 'oklch(0.25 0.02 60)',    // Dark warm gray (not pure #000)
      secondary: 'oklch(0.45 0.02 60)',  // Muted foreground
    },
    error: {
      main: 'oklch(0.55 0.22 25)',       // Destructive red (semantic)
    },
    success: {
      main: 'oklch(0.65 0.2 145)',       // Success green
    },
  },
  shape: {
    borderRadius: 8,                      // Match Tailwind rounded-lg
  },
  components: {
    // Ensure 44px+ touch targets (WCAG)
    MuiIconButton: {
      styleOverrides: {
        root: { minWidth: 44, minHeight: 44 },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { minHeight: 44, textTransform: 'none' },
      },
    },
  },
});

// Usage - wrap just the table for isolated theming
<ThemeProvider theme={crispyMRTTheme}>
  <MaterialReactTable table={table} />
</ThemeProvider>
```

### Option 2: MRT Props for Component-Level Styling

Style individual components via `mui...Props` with the `sx` prop:

```tsx
// Source: https://www.material-react-table.com/docs/guides/customize-components#the-sx-prop
const table = useMaterialReactTable({
  columns,
  data,
  // Table container styling
  muiTablePaperProps: {
    sx: {
      borderRadius: '0.5rem',
      boxShadow: 'none',
      border: '1px solid oklch(0.85 0.02 90)',
    },
  },
  // Header cells - light green background
  muiTableHeadCellProps: {
    sx: {
      backgroundColor: 'oklch(0.96 0.02 145)', // Light sage green
      fontWeight: 600,
      color: 'oklch(0.25 0.02 60)',
    },
  },
  // Row hover - subtle green tint
  muiTableBodyRowProps: ({ row }) => ({
    sx: {
      '&:hover': {
        backgroundColor: 'oklch(0.97 0.015 145)',
      },
      cursor: 'pointer',
    },
  }),
  // Filter text fields
  muiFilterTextFieldProps: {
    sx: {
      '& .MuiOutlinedInput-root': {
        borderRadius: '0.375rem',
      },
    },
  },
});
```

### Option 3: MRT Theme Values (v3+)

New in MRT v3 - dedicated theme values for table-specific colors:

```tsx
// Source: https://www.material-react-table.com/docs/guides/customize-components#mrt-theme-values
const table = useMaterialReactTable({
  columns,
  data,
  mrtTheme: {
    baseBackgroundColor: 'oklch(0.99 0.005 90)',     // Warm off-white
    draggingBorderColor: 'oklch(0.65 0.2 145)',     // Primary green
    matchHighlightColor: 'oklch(0.85 0.15 145)',    // Light green for filter matches
    selectedRowBackgroundColor: 'oklch(0.92 0.08 145)', // Selected row green tint
    pinnedRowBackgroundColor: 'oklch(0.95 0.05 145)',
  },
});
```

### Garden to Table Color Mapping

| Crispy Semantic Token | MUI Palette Equivalent | Usage in MRT |
|----------------------|------------------------|--------------|
| `--primary` | `palette.primary.main` | Filter icons, selected states, buttons |
| `--background` | `palette.background.default` | Table container background |
| `--card` | `palette.background.paper` | Table paper, popovers |
| `--muted` | `palette.text.secondary` | Secondary text, borders |
| `--muted-foreground` | `palette.text.disabled` | Placeholder text |
| `--destructive` | `palette.error.main` | Delete actions (keep red!) |
| `--foreground` | `palette.text.primary` | Primary text |

### Visual Result

| Element | MRT Default | Crispy Themed |
|---------|-------------|---------------|
| Header background | Light gray | Light sage green |
| Row hover | Blue tint | Soft green tint |
| Filter icon | Blue | Garden green |
| Selected row | Blue highlight | Green highlight |
| Text | Pure black | Warm dark gray |
| Background | Pure white | Warm off-white |
| Filter match highlight | Yellow | Light green |

### Implementation Notes

1. **Use nested ThemeProvider** - Isolates MRT theming from rest of app
2. **Preserve semantic colors** - Keep red for destructive, don't override with brand green
3. **Touch targets verified** - MUI defaults to 48px, exceeds WCAG 44px minimum
4. **Dark mode ready** - Can add `palette.mode: 'dark'` variant later

---

## Implementation Phases

### Phase 1: Contacts List POC (Estimated: 3-5 days)

1. **Install dependencies** (Day 1)
   ```bash
   npm install material-react-table export-to-csv
   ```

2. **Create ExcelDataGrid component** (Day 1-2)
   - Create `src/atomic-crm/components/ExcelDataGrid/`
   - Implement bridge to `useListContext`
   - Configure column definitions with filter variants

3. **Implement filter sync** (Day 2-3)
   - Connect MRT filter state to RA's `setFilters`
   - Handle bidirectional sync for URL persistence

4. **Add export functionality** (Day 3)
   - Wire up `getFilteredRowModel()` to export button
   - Test filtered export produces correct CSV

5. **iPad testing** (Day 4)
   - Test filter dropdowns on iPad Safari
   - Verify touch targets meet 44px minimum
   - Adjust density if needed

6. **Performance testing** (Day 5)
   - Load test with 1,000+ contacts
   - Verify virtualization works with filtering
   - Profile render performance

### Phase 2: Replicate Pattern (Estimated: 1-2 days per list)

Apply same pattern to:
- [ ] Organizations list
- [ ] Tasks list
- [ ] Products list

### Phase 3: Cleanup (Estimated: 1 day)

- [ ] Remove old `<FilterList>` sidebar components
- [ ] Update any filter-related tests
- [ ] Document pattern for future lists

---

## File Structure

```
src/atomic-crm/
├── components/
│   └── ExcelDataGrid/
│       ├── index.ts                 # Barrel export
│       ├── ExcelDataGrid.tsx        # Main MRT wrapper component
│       ├── useRAFilterSync.ts       # Hook for RA ↔ MRT filter sync
│       ├── ExportButton.tsx         # Filtered CSV/Excel export
│       └── types.ts                 # Column config types
├── contacts/
│   ├── ContactList.tsx              # Uses ExcelDataGrid
│   └── contactColumns.ts            # Column definitions with filters
├── organizations/
│   └── OrganizationList.tsx
├── tasks/
│   └── TaskList.tsx
└── products/
    └── ProductList.tsx
```

---

## Open Questions

1. **Server-side vs Client-side filtering?**
   - Current: Client-side (all data loaded)
   - MRT supports both via `manualFiltering` prop
   - For 1,000+ contacts, may need server-side filtering for performance
   - **Needs POC testing to determine**

2. **Global search scope**
   - Should global search hit database or only loaded data?
   - MRT's client-side fuzzy search is fast for 1,000 rows
   - Server-side search would need dataProvider enhancement

3. **Filter persistence scope**
   - Per-user? Per-browser? Per-session?
   - RA defaults to localStorage (per-browser, survives refresh)
   - **Recommendation: Start with RA default, evaluate later**

---

## Sources Consulted

| Topic | URL |
|-------|-----|
| MRT Column Filtering | https://www.material-react-table.com/docs/guides/column-filtering |
| MRT Filter Variants | https://www.material-react-table.com/docs/examples/filter-variants |
| MRT Faceted Values | https://www.material-react-table.com/docs/examples/faceted-values |
| MRT Global Filtering | https://www.material-react-table.com/docs/guides/global-filtering |
| MRT Virtualization | https://www.material-react-table.com/docs/guides/virtualization |
| MRT CSV Export | https://www.material-react-table.com/docs/examples/export-csv |
| TanStack Table getFilteredRowModel | https://tanstack.com/table/v8/docs/api/features/column-filtering |
| React Admin useListContext | https://marmelab.com/react-admin/useListContext.html |
| React Admin useListController | https://marmelab.com/react-admin/useListController.html |
| React Admin ListBase | https://marmelab.com/react-admin/ListBase.html |
| React Admin Store | https://marmelab.com/react-admin/Store.html |
| React Admin Export | https://marmelab.com/react-admin/List.html#exporter |
| React Admin Datagrid Header | https://marmelab.com/react-admin/Datagrid.html#header |
| AG Grid Enterprise Filters | https://www.ag-grid.com/react-data-grid/filter-set/ |
| MUI X DataGrid Licensing | https://mui.com/x/introduction/licensing/#plans |
| Mantine React Table | https://www.mantine-react-table.com/docs/guides/column-filtering |
