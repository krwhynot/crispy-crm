# Dashboard Layouts

## Purpose

Document dashboard layout patterns for Atomic CRM including grid systems, widget layouts, responsive breakpoints, spacing tokens, and page structure optimized for desktop (primary) and tablet displays.

**NOTE:** For resource list pages (Contacts, Organizations, etc.), use `StandardListLayout` instead. This guide is for dashboards and custom grid layouts.

## Core Principle: Desktop-First Grid Layouts

Dashboards are optimized for **desktop displays first** (1440px+), then adapted for tablet (768-1024px). Desktop uses 12-column grids with comfortable spacing, while tablet uses 8-column grids with tighter gaps. Mobile gets vertical stacking instead of grids.

**Design Priority:**
1. **Desktop** (1440px+) - 12-column grid, comfortable spacing
2. **Tablet** (768-1024px) - 8-column grid, compact spacing
3. **Mobile** (< 768px) - Vertical stack, no grid

## Grid System

### Semantic Spacing Variables

**Unified Design System spacing** (docs/plans/2025-11-16-unified-design-system-rollout.md:306-344):

```css
@layer theme {
  :root {
    /* Grid System */
    --spacing-grid-columns-desktop: 12;
    --spacing-grid-columns-ipad: 8;
    --spacing-gutter-desktop: 24px;
    --spacing-gutter-ipad: 16px;

    /* Edge Padding (Screen Borders) */
    --spacing-edge-desktop: 24px;
    --spacing-edge-ipad: 20px;
    --spacing-edge-mobile: 16px;

    /* Vertical Rhythm */
    --spacing-section: 32px;
    --spacing-widget: 24px;
    --spacing-content: 16px;
    --spacing-compact: 12px;
  }
}
```

**Usage:**
```typescript
<div className="px-[var(--spacing-edge-desktop)] py-4">
  <div className="grid grid-cols-12 gap-[var(--spacing-gutter-desktop)]">
    {/* 4-column widget */}
    <div className="col-span-4">
      <Widget />
    </div>

    {/* 8-column widget */}
    <div className="col-span-8">
      <Widget />
    </div>
  </div>
</div>
```

### Responsive Grid Patterns

**From `src/atomic-crm/dashboard/CompactGridDashboard.tsx`:**

```typescript
<div className="p-2 md:p-3 lg:p-4">
  {/* Desktop: 40% | 30% | 30% */}
  {/* Tablet: 2-column */}
  {/* Mobile: 1-column */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[40%_30%_30%] gap-4">
    {/* Left Column - Principal Table */}
    <div className="bg-white rounded-lg p-3">
      <PrincipalTable />
    </div>

    {/* Middle Column - Tasks */}
    <div className="space-y-4">
      <TasksWidget />
      <UpcomingWidget />
    </div>

    {/* Right Column - Activity */}
    <div className="bg-white rounded-lg p-3">
      <RecentActivity />
    </div>
  </div>
</div>
```

**Breakpoint Strategy:**
- **Desktop (lg: 1024px+)**: 3-column custom grid `[40%_30%_30%]`
- **Tablet (md: 768px)**: 2-column equal grid
- **Mobile (< 768px)**: 1-column vertical stack

## Widget Patterns

### Pattern 1: KPI Widget (Stat Card)

```typescript
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium">
      Total Revenue
    </CardTitle>
    <DollarSign className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">$125,000</div>
    <p className="text-xs text-muted-foreground mt-1">
      +12% from last month
    </p>
  </CardContent>
</Card>
```

**Grid Sizing:**
- Desktop: 3-4 columns wide (`col-span-3` or `col-span-4`)
- Tablet: 4 columns wide (`md:col-span-4`)
- Mobile: Full width (1 column)

### Pattern 2: Table Widget

```typescript
<Card className="col-span-12 lg:col-span-8">
  <CardHeader>
    <CardTitle>Top Opportunities</CardTitle>
  </CardHeader>
  <CardContent>
    <table className="w-full">
      <thead>
        <tr>
          <th>Name</th>
          <th>Value</th>
          <th>Stage</th>
        </tr>
      </thead>
      <tbody>
        {opportunities.map(opp => (
          <tr key={opp.id}>
            <td>{opp.name}</td>
            <td>{opp.value}</td>
            <td>{opp.stage}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </CardContent>
</Card>
```

**Grid Sizing:**
- Desktop: 8 columns wide (`lg:col-span-8`)
- Tablet: Full width (`md:col-span-8`)
- Mobile: Full width (1 column)

### Pattern 3: Chart Widget

```typescript
<Card className="col-span-12 lg:col-span-6">
  <CardHeader>
    <CardTitle>Pipeline by Stage</CardTitle>
  </CardHeader>
  <CardContent className="h-[300px]">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="stage" />
        <YAxis />
        <Bar dataKey="count" fill="var(--color-primary)" />
      </BarChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```

**Grid Sizing:**
- Desktop: 6 columns (half-width)
- Tablet: Full width
- Mobile: Full width

## Spacing Tokens

### Vertical Rhythm

**From `src/index.css`:**

```css
/* Vertical Rhythm */
--spacing-section: 24px;   /* Between major sections */
--spacing-widget: 16px;    /* Between widgets in a section */
--spacing-content: 12px;   /* Between content blocks in a widget */
--spacing-compact: 8px;    /* Tight spacing (labels, chips) */
```

**Usage:**
```typescript
// Section spacing (24px)
<div className="space-y-[var(--spacing-section)]">
  <Section1 />
  <Section2 />
</div>

// Widget spacing (16px)
<div className="space-y-[var(--spacing-widget)]">
  <Widget1 />
  <Widget2 />
</div>

// Content spacing (12px)
<CardContent className="space-y-[var(--spacing-content)]">
  <p>Content block 1</p>
  <p>Content block 2</p>
</CardContent>
```

### Widget Internals

```css
/* Widget/Card Internals */
--spacing-widget-padding: 12px;      /* Internal padding */
--spacing-widget-min-height: 240px;  /* Minimum widget height */
```

**Usage:**
```typescript
<Card
  className="p-[var(--spacing-widget-padding)]"
  style={{ minHeight: 'var(--spacing-widget-min-height)' }}
>
  <CardHeader>
    <CardTitle>Widget Title</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

## Page Structure

### Pattern: Dashboard Page

```typescript
function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-16 px-[var(--spacing-edge-desktop)] border-b flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          <button>Refresh</button>
          <button>Quick Log</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-[var(--spacing-edge-desktop)]">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-[var(--spacing-section)]">
          <KPICard title="Revenue" value="$125K" />
          <KPICard title="Opportunities" value="23" />
          <KPICard title="Contacts" value="145" />
          <KPICard title="Activities" value="67" />
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <OpportunitiesTable />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <RecentActivity />
            <UpcomingTasks />
          </div>
        </div>
      </main>
    </div>
  );
}
```

**Structure:**
1. **Header** (fixed height, border-bottom)
2. **Main** (edge padding, sections)
3. **KPI Row** (4-column grid on desktop)
4. **Widget Grid** (12-column on desktop, stacked on mobile)

## Loading States

### Pattern: Skeleton Widgets

```typescript
function DashboardSkeleton() {
  return (
    <div className="p-[var(--spacing-edge-desktop)]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-40" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Usage
{isPending ? <DashboardSkeleton /> : <Dashboard data={data} />}
```

## Best Practices

### DO

✅ Use 12-column grid for desktop, 8-column for tablet
✅ Use spacing tokens (`--spacing-section`, `--spacing-widget`)
✅ Stack widgets vertically on mobile (no grid)
✅ Show loading skeletons while data fetches
✅ Use semantic spacing (section → widget → content → compact)
✅ Set minimum widget height for consistent layout
✅ Use responsive grid classes (`md:`, `lg:`)

### DON'T

❌ Hardcode pixel spacing (use tokens)
❌ Force desktop grid on mobile
❌ Skip loading states (jarring layout shifts)
❌ Use inconsistent widget padding
❌ Create grids without gap spacing
❌ Forget edge padding on page container

## Related Resources

- [Component Architecture](component-architecture.md) - Widget component patterns
- [Design Tokens](design-tokens.md) - Spacing and grid tokens
- [Elevation](elevation.md) - Card shadows and depth
- [Data Tables](data-tables.md) - Table widget patterns

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
