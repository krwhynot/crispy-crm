# CRM List UI/UX Pattern Library

> **Research Date:** December 2024
> **Purpose:** Industry-standard patterns for CRM list interfaces to prevent text cutoffs, information overload, and poor scannability.

---

## Executive Summary

Based on research across Ant Design, TanStack Table, UXPatterns.dev, React Admin, Mantine React Table, and Filament PHP documentation, here are the key findings for Crispy CRM:

### Key Recommendations for Crispy CRM

1. **Prioritize Scannability** - Use consistent column widths, visual hierarchy, and row highlighting to enable the "<2 second" answer goal
2. **Implement Column Configuration** - Let users show/hide columns with `<SelectColumnsButton>` + `<DatagridConfigurable>`
3. **Use Filter Sidebars** - Better UX than filter buttons for finite filter sets (principals, stages, status)
4. **Mobile: Card View Fallback** - Transform tables to card layouts on iPad for field sales reps
5. **44px Touch Targets** - Mandatory for iPad field use (aligns with existing design system)
6. **Empty States with CTAs** - Always provide actionable next steps when lists are empty

---

## Pattern Categories

### 1. Text & Truncation Patterns

#### Pattern: Ellipsis with Tooltip Reveal

- **Problem:** Long text values (company names, email addresses, notes) get cut off, hiding important information
- **Solution:** Truncate text with CSS `text-overflow: ellipsis` and reveal full content on hover via tooltip
- **When to use:**
  - Company/contact names longer than column width
  - Email addresses
  - Notes or description fields in list view
- **When NOT to use:**
  - Primary identifier columns (ID, short codes)
  - Status fields or badges
  - Numeric values
- **Trade-offs:**
  - ✅ Maintains clean visual layout
  - ✅ Full information accessible on demand
  - ❌ Requires hover (not touch-friendly without adaptation)
  - ❌ Users must discover the tooltip exists
- **Implementation:**
  ```css
  .truncate-cell {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
  }
  ```
- **Source:** [UXPatterns.dev - Data Table](https://uxpatterns.dev/patterns/data-display/table)

---

#### Pattern: Multi-line Cell Content

- **Problem:** Single-line truncation loses too much context for complex data
- **Solution:** Allow 2-3 lines of text per cell with line clamping
- **When to use:**
  - Description or notes preview columns
  - Address fields
  - Activity summaries
- **When NOT to use:**
  - When row height consistency is critical
  - High-density data scanning views
- **Trade-offs:**
  - ✅ More content visible without interaction
  - ❌ Inconsistent row heights can hurt scannability
  - ❌ Takes more vertical space
- **Implementation:**
  ```css
  .multi-line-cell {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  ```
- **Source:** [Filament PHP Tables - Layout](https://github.com/filamentphp/tables/blob/4.x/docs/05-layout.md)

---

#### Pattern: Expandable Row Details

- **Problem:** Some records need more detail than fits in a row
- **Solution:** Click to expand row and show additional fields in a detail panel below
- **When to use:**
  - Opportunities with multiple associated contacts
  - Activities with full notes
  - Records with many optional fields
- **When NOT to use:**
  - When detail navigation (slide-over) is preferred
  - Simple data with few fields
- **Trade-offs:**
  - ✅ Keeps context in list view
  - ✅ Quick scanning without navigation
  - ❌ Can disrupt row rhythm if many expanded
- **Source:** [React Admin - Datagrid expand prop](https://github.com/marmelab/react-admin/blob/master/docs/Datagrid.md)

---

### 2. Column Layout Patterns

#### Pattern: Fixed + Flexible Column Widths

- **Problem:** All flexible columns create unpredictable layouts; all fixed creates overflow
- **Solution:** Set minimum widths for critical columns, let secondary columns flex
- **When to use:** Always - this is the default best practice
- **Configuration:**
  ```tsx
  // TanStack Table approach
  const defaultColumnSizing = {
    size: 150,      // default width
    minSize: 50,    // minimum during resize
    maxSize: 500,   // maximum during resize
  }
  ```
- **Recommended Column Widths:**
  | Column Type | Min Width | Max Width |
  |-------------|-----------|-----------|
  | Checkbox    | 48px      | 48px      |
  | ID/Short    | 80px      | 100px     |
  | Name        | 150px     | 300px     |
  | Email       | 180px     | 250px     |
  | Status      | 100px     | 120px     |
  | Date        | 100px     | 120px     |
  | Currency    | 100px     | 130px     |
  | Actions     | 100px     | 150px     |
- **Source:** [TanStack Table - Column Sizing Guide](https://github.com/tanstack/table/blob/main/docs/guide/column-sizing.md)

---

#### Pattern: Responsive Column Hiding

- **Problem:** Too many columns on smaller screens creates horizontal scroll nightmare
- **Solution:** Define column visibility priorities; hide low-priority columns on breakpoints
- **When to use:**
  - Desktop-first designs that must work on iPad
  - Lists with 6+ columns
- **Priority Order (Crispy CRM):**
  1. **Always visible:** Name, Primary action column
  2. **Hide on tablet:** Created date, secondary IDs
  3. **Hide on mobile:** All except name + status
- **Implementation:**
  ```tsx
  // React Admin / MUI approach
  <TextField source="createdAt" sx={{ display: { xs: 'none', md: 'table-cell' } }} />

  // Filament PHP approach
  TextColumn::make('slug')->visibleFrom('md')
  ```
- **Source:** [Filament PHP - Responsive Tables](https://github.com/filamentphp/tables/blob/4.x/docs/05-layout.md)

---

#### Pattern: Column Pinning (Freeze)

- **Problem:** When scrolling horizontally, losing sight of the identifier column
- **Solution:** Pin/freeze the first column (usually name) so it stays visible during horizontal scroll
- **When to use:**
  - Tables with many columns requiring horizontal scroll
  - When the leftmost column is the primary identifier
- **When NOT to use:**
  - Tables that fit within viewport
  - Mobile card layouts
- **Trade-offs:**
  - ✅ Always know which record you're looking at
  - ❌ Adds complexity
  - ❌ Can cause visual artifacts on some browsers
- **Source:** [UXPatterns.dev - Fixed Header/Columns](https://uxpatterns.dev/patterns/data-display/table)

---

#### Pattern: User Column Configuration

- **Problem:** Different users need different columns visible
- **Solution:** Let users show/hide columns and persist their preferences
- **When to use:**
  - Lists with 5+ potential columns
  - Different user roles need different data
- **React Admin Implementation:**
  ```tsx
  import { DatagridConfigurable, SelectColumnsButton, TopToolbar } from 'react-admin';

  const ListActions = () => (
    <TopToolbar>
      <SelectColumnsButton />
      <FilterButton />
      <CreateButton />
    </TopToolbar>
  );

  const ContactList = () => (
    <List actions={<ListActions />}>
      <DatagridConfigurable>
        <TextField source="name" />
        <TextField source="email" />
        {/* More columns... */}
      </DatagridConfigurable>
    </List>
  );
  ```
- **Source:** [React Admin - SelectColumnsButton](https://github.com/marmelab/react-admin/blob/master/docs/SelectColumnsButton.md)

---

### 3. Filter UX Patterns

#### Pattern: Filter Sidebar (FilterList)

- **Problem:** Filter button + modal is slow for commonly used filters
- **Solution:** Always-visible sidebar with clickable filter options
- **When to use:**
  - Filters with finite, known values (status, stage, principal)
  - Frequently filtered lists
  - E-commerce style browsing
- **When NOT to use:**
  - Filters requiring text input (use FilterLiveSearch)
  - Too many filter options (>20 items)
  - Mobile/small screens (hide sidebar)
- **Trade-offs:**
  - ✅ Explicit filter values visible
  - ✅ Single-click filtering
  - ✅ No form to fill out
  - ❌ Takes horizontal space
  - ❌ Not great for text/date range filters
- **Implementation:**
  ```tsx
  import { FilterList, FilterListItem, FilterLiveSearch } from 'react-admin';

  const OpportunityFilterSidebar = () => (
    <Card sx={{ order: -1, mr: 2, width: 200 }}>
      <CardContent>
        <FilterLiveSearch source="q" />
        <FilterList label="Stage" icon={<StageIcon />}>
          <FilterListItem label="New Lead" value={{ stage: 'new_lead' }} />
          <FilterListItem label="Initial Outreach" value={{ stage: 'initial_outreach' }} />
          {/* More stages... */}
        </FilterList>
        <FilterList label="Principal" icon={<PrincipalIcon />}>
          {/* Principal filter items */}
        </FilterList>
      </CardContent>
    </Card>
  );
  ```
- **Source:** [React Admin - FilterList](https://github.com/marmelab/react-admin/blob/master/docs/FilterList.md)

---

#### Pattern: Cumulative Filters

- **Problem:** Selecting a filter replaces previous selection
- **Solution:** Allow multiple values to be selected (OR logic within category)
- **When to use:**
  - Category filters (show Tests OR News OR Deals)
  - Multi-select scenarios
- **Implementation:**
  ```tsx
  const isSelected = (value, filters) => {
    const stages = filters.stages || [];
    return stages.includes(value.stage);
  };

  const toggleFilter = (value, filters) => {
    const stages = filters.stages || [];
    return {
      ...filters,
      stages: stages.includes(value.stage)
        ? stages.filter(v => v !== value.stage)
        : [...stages, value.stage],
    };
  };
  ```
- **Source:** [React Admin - FilterList Cumulative Filters](https://github.com/marmelab/react-admin/blob/master/docs/FilterList.md)

---

#### Pattern: Saved Filter Sets (Views)

- **Problem:** Users repeatedly apply the same complex filter combinations
- **Solution:** Allow saving and naming filter combinations for one-click access
- **When to use:**
  - Power users with complex recurring queries
  - Role-based default views ("My Open Opportunities", "Hot Leads")
- **Implementation:** React Admin provides `<SavedQueriesList>` component
- **Source:** [Ant Design - List Page Research](https://ant.design/docs/spec/research-list)

---

#### Pattern: Filter Chips with Clear

- **Problem:** Users forget which filters are active
- **Solution:** Show active filters as removable chips above the list
- **When to use:** Always when filters are applied
- **Behavior:**
  - Individual "x" to remove single filter
  - "Clear all" to reset all filters
  - Show filter count badge on filter button
- **Source:** [Ant Design - Data List](https://ant.design/docs/spec/data-list)

---

### 4. Interaction Patterns

#### Pattern: Row Click Navigation

- **Problem:** Unclear how to view record details
- **Solution:** Define consistent row click behavior
- **Options:**
  | Behavior | Use When |
  |----------|----------|
  | Navigate to Edit | Admin editing workflows |
  | Open Slide-over | Quick preview without losing list context |
  | Expand row | Show more details inline |
  | Select row | Batch operations primary use case |
  | No action | Actions column has explicit buttons |
- **React Admin Implementation:**
  ```tsx
  <Datagrid rowClick="show">  {/* or "edit", "expand", "toggleSelection" */}
    {/* columns */}
  </Datagrid>
  ```
- **Crispy CRM Recommendation:** Use `rowClick` to open slide-over panel (40vw right panel per architecture)
- **Source:** [React Admin - Datagrid rowClick](https://github.com/marmelab/react-admin/blob/master/docs/Datagrid.md)

---

#### Pattern: Shift-Click Range Selection

- **Problem:** Selecting many rows one-by-one is tedious
- **Solution:** Shift+click selects all rows between last selected and current
- **When to use:** Lists with bulk actions enabled
- **Built into:** React Admin Datagrid (automatic)
- **Source:** [React Admin - Datagrid bulk actions](https://github.com/marmelab/react-admin/blob/master/docs/Datagrid.md)

---

#### Pattern: Select All with Pagination Awareness

- **Problem:** "Select all" checkbox only selects current page
- **Solution:** After selecting all on page, show "Select all X records" button
- **Implementation:** React Admin provides `<SelectAllButton>` automatically
- **Source:** [React Admin - SelectAllButton](https://github.com/marmelab/react-admin/blob/master/docs/Datagrid.md)

---

#### Pattern: Bulk Action Toolbar

- **Problem:** Where to show actions for selected items
- **Solution:** Contextual toolbar appears when items selected
- **Behavior:**
  - Appears above/below list when selection > 0
  - Shows selection count
  - Contains bulk action buttons (Delete, Export, Update)
  - Include undo for destructive actions
- **Implementation:**
  ```tsx
  const BulkActionButtons = () => (
    <>
      <BulkUpdateButton label="Mark as Won" data={{ stage: 'closed_won' }} />
      <BulkExportButton />
      <BulkDeleteButton />
    </>
  );

  <Datagrid bulkActionButtons={<BulkActionButtons />}>
    {/* columns */}
  </Datagrid>
  ```
- **Source:** [React Admin - bulkActionButtons](https://github.com/marmelab/react-admin/blob/master/docs/Datagrid.md)

---

### 5. Density & Spacing Patterns

#### Pattern: Density Toggle (Compact/Comfortable)

- **Problem:** Different tasks need different information density
- **Solution:** Let users toggle between compact (more rows) and comfortable (more padding)
- **Options:**
  | Mode | Row Height | Use Case |
  |------|------------|----------|
  | Compact | ~36px | Data scanning, power users |
  | Default | ~48px | General use |
  | Comfortable | ~64px | Touch devices, accessibility |
- **React Admin:** Use `size="small"` or `size="medium"` prop on Datagrid
- **Source:** [UXPatterns.dev - Density Controls](https://uxpatterns.dev/patterns/data-display/table)

---

#### Pattern: Row Hover Highlighting

- **Problem:** Hard to track which row you're looking at in dense tables
- **Solution:** Highlight row background on hover
- **Implementation:**
  - React Admin: `hover={true}` (default)
  - Disable with `hover={false}` if needed
- **Source:** [React Admin - Datagrid hover](https://github.com/marmelab/react-admin/blob/master/docs/Datagrid.md)

---

#### Pattern: Conditional Row Styling

- **Problem:** Important records don't stand out
- **Solution:** Apply visual styling based on record data
- **When to use:**
  - Overdue tasks (red background)
  - High-value opportunities (bold text)
  - Unread items (bold)
- **Implementation:**
  ```tsx
  const rowSx = (record) => ({
    backgroundColor: record.is_overdue ? 'var(--destructive-50)' : undefined,
    fontWeight: record.views >= 500 ? 'bold' : undefined,
  });

  <Datagrid rowSx={rowSx}>
    {/* columns */}
  </Datagrid>
  ```
- **Source:** [React Admin - rowSx](https://github.com/marmelab/react-admin/blob/master/docs/Datagrid.md)

---

### 6. Empty & Loading States

#### Pattern: Contextual Empty States

- **Problem:** Empty tables confuse users—is it broken or just no data?
- **Solution:** Show clear message explaining why empty + actionable next step
- **Types:**
  | Scenario | Message | CTA |
  |----------|---------|-----|
  | New user, no data | "No contacts yet" | "Add your first contact" |
  | Filters too narrow | "No results match your filters" | "Clear filters" |
  | Search no results | "No results for 'xyz'" | "Try different keywords" |
  | All items processed | "All caught up!" | None needed |
- **Design Principles (Ant Design):**
  - **Clarity:** Explain the specific reason for empty state
  - **Provide Invitation:** Offer actionable next steps
- **Source:** [Ant Design - Empty Status Spec](https://ant.design/docs/spec/research-empty)

---

#### Pattern: Skeleton Loading

- **Problem:** Blank tables during load feel broken
- **Solution:** Show placeholder shapes matching expected content
- **Principles:**
  - Don't create dedicated skeleton screens—use same component with skeleton state
  - Match the layout of actual content
  - Animate with subtle shimmer (1.5s cycle)
- **Source:** [react-loading-skeleton principles](https://github.com/dvtng/react-loading-skeleton/blob/master/README.md)

---

#### Pattern: Pagination vs Infinite Scroll

- **Problem:** How to handle large datasets
- **Solution:** Choose based on use case
- **Comparison:**
  | Approach | Best For | Avoid When |
  |----------|----------|------------|
  | Pagination | Data tables, need to locate specific item, SEO | Browsing/discovery |
  | Infinite scroll | Social feeds, discovery | Need to find specific item |
  | Load more button | Compromise, user-controlled | Same as infinite scroll |
- **Research Insight:** 67% of users prefer pagination for data tables
- **Crispy CRM Recommendation:** Use pagination for all lists (need to locate specific records)
- **Source:** [UXPatterns.dev - Data Table](https://uxpatterns.dev/patterns/data-display/table), [Ant Design - Paging](https://ant.design/docs/spec/data-list)

---

## Anti-Patterns to Avoid

### 1. Rendering All Rows at Once
- **Problem:** 1000+ DOM nodes causes performance issues and freezing
- **Solution:** Implement virtual scrolling for 100+ rows or use pagination
- **Source:** [UXPatterns.dev](https://uxpatterns.dev/patterns/data-display/table)

### 2. No Mobile Alternative
- **Problem:** Forcing horizontal scroll on mobile is unusable
- **Solution:** Provide card view or stacked key-value layout on small screens
- **Source:** [Filament PHP - The problem with traditional tables](https://github.com/filamentphp/tables/blob/4.x/docs/05-layout.md)

### 3. Feature Overload
- **Problem:** Showing all controls overwhelms users
- **Solution:** Progressive disclosure—hide advanced features until needed
- **Source:** [UXPatterns.dev](https://uxpatterns.dev/patterns/data-display/table)

### 4. Missing Empty States
- **Problem:** Blank table with no explanation
- **Solution:** Always provide contextual empty state with CTA
- **Source:** [Ant Design - Empty Status](https://ant.design/docs/spec/research-empty)

### 5. Poor Sort Indication
- **Problem:** User doesn't know current sort state
- **Solution:** Clear ascending/descending indicators (▲▼) on sorted column
- **Source:** [UXPatterns.dev](https://uxpatterns.dev/patterns/data-display/table)

### 6. Hover-Only on Touch Devices
- **Problem:** Tooltips and hover states don't work on iPad
- **Solution:** Make information accessible via tap or always visible on touch
- **Source:** [UXPatterns.dev - Mobile Testing](https://uxpatterns.dev/patterns/data-display/table)

---

## Performance Guidelines

### Debounce Search/Filter Inputs
- Wait 300ms after last keystroke before filtering
- Prevents excessive re-renders

### Memoize Expensive Operations
- Sort and filter results should be cached
- Use `useMemo` for computed column data

### Virtual Scrolling Threshold
- Implement for datasets > 100 rows
- Libraries: TanStack Virtual, react-window

### Column Resize Performance
- Use `columnResizeMode: 'onEnd'` for complex tables
- Apply widths via CSS variables, not inline styles
- **Source:** [TanStack Table - Advanced Column Resizing Performance](https://github.com/tanstack/table/blob/main/docs/guide/column-sizing.md)

---

## Sources & References

### Design Systems
| Source | Focus | URL |
|--------|-------|-----|
| Ant Design | List page spec, empty states | https://ant.design/docs/spec/research-list |
| UXPatterns.dev | Comprehensive data table patterns | https://uxpatterns.dev/patterns/data-display/table |
| HubSpot Canvas | Design principles | https://canvas.hubspot.com/ |

### React Libraries
| Source | Focus | URL |
|--------|-------|-----|
| React Admin | Datagrid, filters, bulk actions | https://marmelab.com/react-admin/Datagrid.html |
| TanStack Table | Column sizing, row selection | https://tanstack.com/table/latest |
| Mantine React Table | Editing modes | https://www.mantine-react-table.com/docs/guides/editing |

### Technical References
| Source | Focus | URL |
|--------|-------|-----|
| Filament PHP | Responsive table layouts | https://filamentphp.com/docs/tables/layout |
| react-loading-skeleton | Skeleton principles | https://github.com/dvtng/react-loading-skeleton |

---

*Document generated from industry research for Crispy CRM project*
