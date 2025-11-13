# Data Tables

## Purpose

Document data table patterns for Atomic CRM including sortable columns, row actions, hover states, responsive design, sticky headers, and pagination that provide efficient data browsing on desktop (primary) and tablet devices.

## Core Principle: Desktop-First Data Density

Tables are optimized for **desktop displays first** (1440px+), then adapted for tablet/iPad (768-1024px). Desktop gets comfortable 40px row height, while tablet uses 44px minimum touch targets. Mobile displays use card-based layouts instead of tables.

**Design Priority:**
1. **Desktop** (1440px+) - Primary target, comfortable density, hover interactions
2. **Tablet/iPad** (768-1024px) - Touch-friendly 44px targets, horizontal scroll
3. **Mobile** (< 768px) - Card layouts replace tables

## Basic Table Structure

### Pattern: Semantic HTML Table

**From `src/atomic-crm/dashboard/CompactPrincipalTable.tsx`:**

```typescript
export const CompactPrincipalTable: React.FC<Props> = ({ data }) => {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <div className="overflow-auto">
      <table className="w-full text-sm">
        {/* Header */}
        <thead>
          <tr className="text-left text-xs text-gray-600 border-b">
            <th className="pb-1 px-2">Principal</th>
            <th className="pb-1 px-2 text-center w-16">Pipeline</th>
            <th className="pb-1 px-2 text-center w-16">This Week</th>
            <th className="pb-1 w-28">Actions</th>
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {data.map(principal => (
            <tr
              key={principal.id}
              className="h-9 border-b hover:bg-gray-50 cursor-pointer"
              onMouseEnter={() => setHoveredRow(principal.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td className="py-1 px-2 font-medium">{principal.name}</td>
              <td className="py-1 px-2 text-center">
                <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                  {principal.opportunityCount}
                </span>
              </td>
              <td className="py-1 px-2 text-center text-xs">
                {principal.weeklyActivities ?? 0}
              </td>
              <td className="py-1">
                <div className={hoveredRow === principal.id ? 'opacity-100' : 'opacity-0'}>
                  <button>Action</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

**Key Elements:**
- `overflow-auto` - Horizontal scroll on small screens
- Semantic `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`
- `text-xs` headers for compact design
- `text-sm` body text for readability
- `border-b` on rows for separation
- `hover:bg-gray-50` for row hover state

## Row Height & Touch Targets

### Desktop Row Heights

```css
/* Desktop-optimized row heights */
--row-height-compact: 32px;      /* Compact density */
--row-height-comfortable: 40px;  /* Default (desktop) */
```

**Usage:**
```typescript
// Desktop: Comfortable 40px rows
<tr className="h-10"> {/* 40px = 10 * 4px */}
  <td>Content</td>
</tr>

// Desktop: Compact 32px rows
<tr className="h-8"> {/* 32px = 8 * 4px */}
  <td>Content</td>
</tr>
```

### Tablet/iPad Touch Targets

**WCAG 2.5.5 minimum:** 44x44px for touch targets

```typescript
// Tablet-responsive row height
<tr className="h-9 md:h-11"> {/* 36px mobile, 44px tablet+ */}
  <td>Content</td>
</tr>

// Responsive action buttons
<button className="h-6 w-6 md:h-11 md:w-11">
  <Icon className="w-3 h-3 md:w-5 md:h-5" />
</button>
```

## Hover States & Actions

### Pattern: Hover-Reveal Actions

```typescript
function DataTable({ data }: { data: Item[] }) {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);

  return (
    <table>
      <tbody>
        {data.map(item => (
          <tr
            key={item.id}
            onMouseEnter={() => setHoveredRow(item.id)}
            onMouseLeave={() => setHoveredRow(null)}
            className="hover:bg-accent/50"
          >
            <td>{item.name}</td>
            <td>
              {/* Actions visible only on hover */}
              <div className={hoveredRow === item.id ? 'opacity-100' : 'opacity-0 pointer-events-none'}>
                <button onClick={() => handleEdit(item.id)}>Edit</button>
                <button onClick={() => handleDelete(item.id)}>Delete</button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

**Why hover-reveal:**
- Reduces visual clutter (actions hidden by default)
- Desktop-friendly interaction pattern
- `pointer-events-none` prevents accidental clicks when hidden

**Mobile alternative:**
```typescript
// Show actions always on mobile (no hover)
<div className="md:opacity-0 md:hover:opacity-100">
  <button>Edit</button>
</div>
```

## Sticky Headers

### Pattern: Sticky Table Header

```typescript
<div className="overflow-auto max-h-[600px]">
  <table className="w-full">
    <thead className="sticky top-0 bg-card shadow-[var(--shadow-col)] z-10">
      <tr className="border-b border-[color:var(--divider-strong)]">
        <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wide py-3 px-4">
          Organization
        </th>
        <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wide py-3 px-4">
          Value
        </th>
      </tr>
    </thead>
    <tbody>
      {rows.map(row => (
        <tr key={row.id} className="border-b border-[color:var(--divider-subtle)] hover:bg-accent/50">
          <td className="py-3 px-4">{row.name}</td>
          <td className="text-right py-3 px-4">{row.value}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Key Details:**
- `sticky top-0` keeps header in view while scrolling
- `shadow-[var(--shadow-col)]` creates depth separation
- `z-10` ensures header above table body
- `bg-card` prevents see-through header

## Sortable Columns

### Pattern: Click to Sort

```typescript
function SortableTable() {
  const [sort, setSort] = useState<{ field: string; order: 'ASC' | 'DESC' }>({
    field: 'name',
    order: 'ASC'
  });

  const handleSort = (field: string) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'ASC' ? 'DESC' : 'ASC'
    }));
  };

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aVal = a[sort.field];
      const bVal = b[sort.field];

      if (sort.order === 'ASC') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }, [data, sort]);

  return (
    <table>
      <thead>
        <tr>
          <th onClick={() => handleSort('name')} className="cursor-pointer">
            <div className="flex items-center gap-1">
              Name
              {sort.field === 'name' && (
                sort.order === 'ASC' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
              )}
            </div>
          </th>
          <th onClick={() => handleSort('value')} className="cursor-pointer">
            Value
          </th>
        </tr>
      </thead>
      <tbody>
        {sortedData.map(row => (
          <tr key={row.id}>
            <td>{row.name}</td>
            <td>{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

## Pagination

### Pattern: Paginated Table

```typescript
import { useGetList } from 'react-admin';

function PaginatedTable() {
  const [page, setPage] = useState(1);
  const perPage = 25;

  const { data, total, isPending } = useGetList('organizations', {
    pagination: { page, perPage },
    sort: { field: 'name', order: 'ASC' },
    filter: {},
  });

  const totalPages = Math.ceil((total || 0) / perPage);

  return (
    <div>
      <table>{/* Table content */}</table>

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing {(page - 1) * perPage + 1} to {Math.min(page * perPage, total || 0)} of {total || 0} results
        </p>

        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </button>
          <span className="flex items-center px-4">{page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Responsive Tables

### Desktop-First Responsive Strategy

```typescript
<div className="overflow-x-auto">
  <table className="w-full min-w-[800px]"> {/* Minimum width for desktop layout */}
    <thead>
      <tr>
        {/* Desktop: All columns visible */}
        <th className="px-4 py-3">Name</th>
        <th className="px-4 py-3 hidden md:table-cell">Type</th>
        <th className="px-4 py-3 hidden lg:table-cell">Created</th>
        <th className="px-4 py-3">Actions</th>
      </tr>
    </thead>
    <tbody>
      {data.map(row => (
        <tr key={row.id}>
          <td className="px-4 py-3">{row.name}</td>
          <td className="px-4 py-3 hidden md:table-cell">{row.type}</td>
          <td className="px-4 py-3 hidden lg:table-cell">{formatDate(row.created_at)}</td>
          <td className="px-4 py-3">
            <button>Edit</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

**Breakpoint Strategy:**
- **Desktop (lg: 1024px+)**: All columns visible
- **Tablet (md: 768px)**: Hide less critical columns
- **Mobile (< 768px)**: Use card layout instead

### Mobile: Card Layout

```typescript
function ResponsiveList({ data }: { data: Item[] }) {
  return (
    <>
      {/* Desktop: Table */}
      <div className="hidden md:block">
        <table>{/* Full table */}</table>
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-2">
        {data.map(item => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{item.type}</p>
              <p className="text-xs text-subtle">{formatDate(item.created_at)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
```

## Best Practices

### DO

✅ Use semantic HTML (`<table>`, `<thead>`, `<tbody>`)
✅ Set comfortable 40px row height for desktop
✅ Use 44px minimum touch targets for tablet
✅ Hide actions on desktop, reveal on hover
✅ Use sticky headers for long tables
✅ Paginate lists with 25-50 items per page
✅ Sort columns client-side for < 1000 rows, server-side for more
✅ Provide horizontal scroll for wide tables
✅ Use card layouts for mobile (< 768px)

### DON'T

❌ Use divs styled as tables (breaks accessibility)
❌ Use tiny row heights < 32px (hard to read/click)
❌ Show all action buttons always (visual clutter)
❌ Forget sticky header on tall tables
❌ Load 1000+ rows without pagination/virtual scrolling
❌ Rely on horizontal scroll for essential columns
❌ Use tables on mobile (use cards instead)

## Related Resources

- [Component Architecture](component-architecture.md) - Component patterns
- [Design Tokens](design-tokens.md) - Row height and spacing tokens
- [React Performance](react-performance.md) - Virtual scrolling for large lists
- [Typography](typography.md) - Table text hierarchy

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
