# Layout Patterns

## Industry Standards

### Nielsen Norman Group - Dashboard Design
**Source:** https://www.nngroup.com/articles/dashboard-design/

- **Key metrics visible without scrolling:** Most important information should appear in the viewport without requiring interaction
- **Consistent card sizes within rows:** Maintain visual rhythm and scanability by using uniform dimensions for similar content types
- **Information hierarchy:** Most critical data positioned top-left following F-pattern eye-tracking research

### Material Design 3 - Layout Basics
**Source:** https://m3.material.io/foundations/layout/understanding-layout/overview

- **Responsive layout grid:** Consistent spacing system using 8px base unit
- **Breakpoints:** Compact (600dp), Medium (840dp), Expanded (1240dp+)
- **Density modes:** Comfortable (default), Compact (data-heavy), Spacious (accessibility)

### Ant Design - Table Design
**Source:** https://ant.design/docs/spec/data-display

- **Single-line constraint:** Time, status, and action columns must never wrap
- **Empty cell handling:** Display `-` for null/empty values, never blank cells
- **Fixed action columns:** Right-aligned with consistent width

## Our Implementation

Crispy CRM applies these standards with a **desktop-first** approach (1440px+ default) and **iPad optimization** (768px minimum).

### Core Layout Principles

1. **Desktop-First Breakpoints:** Write styles for 1440px viewports, then use `lg:`, `md:`, `sm:` to adapt downward
2. **Single Column Forms:** Default pattern for cognitive load reduction (Nielsen Norman eye-tracking)
3. **Three-Panel Dashboard:** Sidebar (240px) + Main (flexible, 600px min) + Detail (40vw max 600px)
4. **Fail-Fast Overflow:** Horizontal scroll allowed ONLY for wide tables, never for page content
5. **Touch Targets:** 44x44px minimum (`h-11 w-11`) for iPad support

## Patterns

### Three-Panel Dashboard Constraints

**Desktop (1440px+):**
- **Sidebar:** Fixed 240px (collapsible to 64px icon-only)
- **Main content:** Flexbox `flex-1` with `min-w-[600px]` constraint
- **Detail panel (SlideOver):** `w-[40vw]` with `max-w-[600px]`
- **Constraint:** Main content must NEVER shrink below 600px width

**iPad (768px):**
- **Sidebar:** Toggleable drawer overlay OR collapsed to 64px
- **Main content:** Full viewport width when SlideOver closed
- **SlideOver:** Renders as full-screen modal overlay (`fixed inset-0`)

**Critical Rule:** All three panels visible simultaneously ONLY when viewport width ≥ 1440px. Below that, SlideOver must overlay (not squeeze) main content.

```tsx
<div className="flex h-screen">
  <Sidebar className="w-60 shrink-0 md:hidden" />

  <main className="flex-1 min-w-[600px] overflow-auto md:min-w-full">
    <Content />
  </main>

  {isSlideOverOpen && (
    <Portal>
      <SlideOver className="w-[40vw] max-w-[600px] md:w-full md:fixed md:inset-0 md:z-50" />
    </Portal>
  )}
</div>
```

### Table/List Density Guidelines

**Row Heights:**
- **Default (Comfortable):** 52px total (40px content + 6px padding top/bottom)
- **Dense:** 40px total (32px content + 4px padding) - Use for data-heavy views only
- **Spacious:** 64px total - Reserved for accessibility mode (future)

**Column Constraints:**
- **Minimum width:** 100px OR actual content width (whichever is greater)
- **Action columns:** Fixed width (e.g., `w-32`), right-aligned, NEVER wrap
- **Status columns:** Fixed width with badge/chip, NEVER wrap text
- **Timestamp columns:** Fixed width with `whitespace-nowrap`
- **Text columns:** Flexible width with `truncate` or `line-clamp-2`

**Empty Cell Handling:**
```tsx
<td className="text-muted-foreground text-center">-</td>
```

**Single-Line Constraint:** Time, status, and action columns MUST use `whitespace-nowrap` to prevent wrapping.

```tsx
<PremiumDatagrid
  density="comfortable"
  columns={[
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 200 },
    { field: 'status', headerName: 'Status', width: 120, renderCell: (params) => (
      <Badge variant={params.value}>{params.value}</Badge>
    )},
    { field: 'created_at', headerName: 'Created', width: 140, valueFormatter: (value) =>
      formatDate(value)
    },
    { field: 'actions', headerName: '', width: 100, align: 'right', sortable: false, renderCell: (params) => (
      <ActionsMenu id={params.row.id} />
    )}
  ]}
/>
```

### Form Layout Standards

**Default Pattern: Single Column**

Eye-tracking research (Nielsen Norman Group) shows single-column forms reduce cognitive load and completion time.

```tsx
<form className="space-y-8 max-w-2xl mx-auto">
  <section className="space-y-4">
    <h3 className="text-lg font-semibold">Contact Information</h3>
    <TextInput name="first_name" label="First Name" />
    <TextInput name="last_name" label="Last Name" />
    <TextInput name="email" label="Email Address" />
  </section>

  <section className="space-y-4">
    <h3 className="text-lg font-semibold">Organization</h3>
    <ReferenceInput name="organization_id" label="Organization" />
    <TextInput name="title" label="Job Title" />
  </section>
</form>
```

**Exception: Two-Column for Related Fields**

ONLY use two-column layout when fields are semantically paired:

```tsx
<div className="grid grid-cols-2 gap-4">
  <TextInput name="first_name" label="First Name" />
  <TextInput name="last_name" label="Last Name" />
</div>

<div className="grid grid-cols-2 gap-4">
  <TextInput name="city" label="City" />
  <SelectInput name="state" label="State" choices={US_STATES} />
</div>
```

**Field Spacing:**
- **Between sections:** `space-y-8` (32px)
- **Within section:** `space-y-4` (16px)
- **Related field pairs:** `gap-4` (16px)

**Label Position:**
- **Default:** Above input (`flex flex-col space-y-1`)
- **Exception:** Beside checkbox/radio (label after input)
- **NEVER:** Labels beside text inputs (accessibility + mobile)

**Tabbed Forms (Create Views):**

Full-page create forms use tabs for logical grouping, maintaining single-column within each tab.

```tsx
<TabbedForm>
  <TabbedForm.Tab label="Details">
    <div className="space-y-4 max-w-2xl">
      <TextInput name="name" label="Name" />
      <TextInput name="email" label="Email" />
    </div>
  </TabbedForm.Tab>

  <TabbedForm.Tab label="Address">
    <div className="space-y-4 max-w-2xl">
      <TextInput name="street" label="Street Address" />
      <div className="grid grid-cols-2 gap-4">
        <TextInput name="city" label="City" />
        <SelectInput name="state" label="State" />
      </div>
    </div>
  </TabbedForm.Tab>
</TabbedForm>
```

### Responsive Breakpoint Behavior

**Desktop-First Philosophy:**

Crispy CRM targets 1440px+ viewports as the default experience. Tailwind utility classes apply at this baseline, with `lg:`, `md:`, `sm:` providing progressive degradation.

**Breakpoint Strategy:**
- **Default (no prefix):** 1440px+ (large desktop)
- **`lg:` (1024px):** Laptop/small desktop adjustments
- **`md:` (768px):** iPad landscape (primary tablet target)
- **`sm:` (640px):** iPad portrait (secondary tablet target)

**Implementation Pattern:**

```tsx
<div className="grid grid-cols-3 gap-6 lg:grid-cols-2 md:grid-cols-1 md:gap-4">
  <Card />
  <Card />
  <Card />
</div>
```

**NOT This (Mobile-First Anti-Pattern):**

```tsx
<div className="flex-col sm:flex-row md:grid-cols-2 lg:grid-cols-3">
```

**Sidebar Responsive Behavior:**

```tsx
<Sidebar className="w-60 shrink-0 lg:w-16 md:absolute md:z-40 md:-translate-x-full md:data-[open=true]:translate-x-0" />
```

- **Desktop (1440px+):** Full width (240px), always visible
- **Laptop (1024px):** Collapsed to icon-only (64px)
- **iPad (768px):** Drawer overlay, hidden by default

### Overflow Handling

**Horizontal Scroll:**
- **ONLY allowed:** Wide tables/data grids that exceed viewport width
- **NEVER allowed:** Page content, forms, card layouts
- **Implementation:** Wrap `<PremiumDatagrid>` in `<div className="overflow-x-auto">`

**Vertical Scroll:**
- **Main content area:** `overflow-y-auto` on main container, NOT individual cards
- **Sticky elements:** Headers, filter bars, table headers use `sticky top-0`
- **SlideOver panels:** Independent scroll (`overflow-y-auto`) from main content

**iPad Considerations:**
- **Always vertical scroll:** Never paginate primary content
- **Minimize horizontal scroll:** Responsive columns, collapsed layouts
- **Touch-friendly scrollbars:** Native iOS scroll behavior (no custom scrollbars)

```tsx
<div className="flex h-screen overflow-hidden">
  <Sidebar />

  <main className="flex-1 overflow-y-auto">
    <header className="sticky top-0 z-10 bg-background border-b">
      <FilterBar />
    </header>

    <div className="p-6">
      <div className="overflow-x-auto">
        <PremiumDatagrid
          columns={columns}
          rows={rows}
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              position: 'sticky',
              top: 0,
              zIndex: 1
            }
          }}
        />
      </div>
    </div>
  </main>
</div>
```

## Examples

### ❌ Violation: Mobile-First Breakpoint Approach

```tsx
<div className="flex-col sm:flex-row md:grid-cols-2 lg:grid-cols-3">
  <Card />
  <Card />
  <Card />
</div>
```

**Problem:** Applies mobile styles by default, contradicts desktop-first target (1440px+).

### ✅ Correct: Desktop-First Breakpoint Approach

```tsx
<div className="grid grid-cols-3 gap-6 lg:grid-cols-2 md:grid-cols-1 md:gap-4">
  <Card />
  <Card />
  <Card />
</div>
```

**Why:** Default styles target 1440px viewports, progressively adapting for smaller screens.

---

### ❌ Violation: Three-Column Form Layout

```tsx
<form className="grid grid-cols-3 gap-4">
  <TextInput name="first_name" label="First Name" />
  <TextInput name="email" label="Email Address" />
  <TextInput name="phone" label="Phone Number" />
</form>
```

**Problem:** Creates excessive eye-travel distance, violates single-column standard.

### ✅ Correct: Single Column with Sections

```tsx
<form className="space-y-8 max-w-2xl">
  <section className="space-y-4">
    <h3 className="text-lg font-semibold">Personal Information</h3>
    <TextInput name="first_name" label="First Name" />
    <TextInput name="email" label="Email Address" />
    <TextInput name="phone" label="Phone Number" />
  </section>
</form>
```

**Why:** Reduces cognitive load, follows F-pattern eye-tracking research.

---

### ❌ Violation: SlideOver Squeezing Main Content

```tsx
<div className="flex">
  <Sidebar className="w-60" />
  <main className="flex-1">
    <Content />
  </main>
  <SlideOver className="w-[40vw]" />
</div>
```

**Problem:** Main content can shrink below 600px minimum width when all three panels visible.

### ✅ Correct: SlideOver Overlays on Small Screens

```tsx
<div className="flex h-screen">
  <Sidebar className="w-60 shrink-0 md:hidden" />

  <main className="flex-1 min-w-[600px] overflow-auto md:min-w-full">
    <Content />
  </main>

  {isSlideOverOpen && (
    <Portal>
      <SlideOver className="fixed right-0 top-0 h-full w-[40vw] max-w-[600px] md:w-full md:inset-0 z-50" />
    </Portal>
  )}
</div>
```

**Why:** Maintains 600px minimum for main content, SlideOver overlays on iPad.

---

### ❌ Violation: Blank Table Cells

```tsx
<PremiumDatagrid
  columns={[
    { field: 'title', headerName: 'Title', flex: 1 },
    { field: 'notes', headerName: 'Notes', flex: 1 }
  ]}
/>
```

**Problem:** Empty cells render as blank space, unclear if null or loading.

### ✅ Correct: Explicit Empty Indicator

```tsx
<PremiumDatagrid
  columns={[
    { field: 'title', headerName: 'Title', flex: 1 },
    {
      field: 'notes',
      headerName: 'Notes',
      flex: 1,
      renderCell: (params) => (
        <span className={params.value ? '' : 'text-muted-foreground'}>
          {params.value || '-'}
        </span>
      )
    }
  ]}
/>
```

**Why:** Explicit `-` communicates intentional empty state vs missing data.

---

### ❌ Violation: Labels Beside Inputs

```tsx
<div className="flex items-center gap-2">
  <label htmlFor="name">Name</label>
  <Input id="name" name="name" />
</div>
```

**Problem:** Horizontal layout breaks on narrow viewports, violates accessibility best practices.

### ✅ Correct: Labels Above Inputs

```tsx
<div className="space-y-1">
  <label htmlFor="name" className="block text-sm font-medium">
    Name
  </label>
  <Input id="name" name="name" />
</div>
```

**Why:** Consistent with WCAG 2.1 AA form patterns, maintains vertical rhythm.

---

### ❌ Violation: Action Column with Wrapping Text

```tsx
<PremiumDatagrid
  columns={[
    { field: 'name', headerName: 'Name', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <div className="flex gap-2">
          <Button>Edit Contact Details</Button>
          <Button>Delete</Button>
        </div>
      )
    }
  ]}
/>
```

**Problem:** Long button text wraps, creates uneven row heights.

### ✅ Correct: Fixed-Width Action Column with Icons

```tsx
<PremiumDatagrid
  columns={[
    { field: 'name', headerName: 'Name', flex: 1 },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      align: 'right',
      sortable: false,
      renderCell: (params) => (
        <div className="flex gap-1">
          <IconButton label="Edit" icon={<Edit />} />
          <IconButton label="Delete" icon={<Trash />} />
        </div>
      )
    }
  ]}
/>
```

**Why:** Fixed width prevents wrapping, icons reduce space requirements.

---

### ❌ Violation: Page-Level Horizontal Scroll

```tsx
<main className="overflow-x-auto">
  <div className="min-w-[2000px]">
    <Dashboard />
  </div>
</main>
```

**Problem:** Entire page scrolls horizontally, breaks navigation UX.

### ✅ Correct: Isolated Table Horizontal Scroll

```tsx
<main className="overflow-y-auto">
  <section className="p-6">
    <h1>Dashboard</h1>
    <div className="grid grid-cols-3 gap-4">
      <StatCard />
      <StatCard />
      <StatCard />
    </div>
  </section>

  <section className="p-6">
    <h2>Data Table</h2>
    <div className="overflow-x-auto">
      <PremiumDatagrid columns={wideColumns} />
    </div>
  </section>
</main>
```

**Why:** Only data table scrolls horizontally, page navigation remains accessible.

## Checklist

### Three-Panel Dashboard
- [ ] Sidebar width: 240px fixed OR collapsible to 64px
- [ ] Main content: `min-w-[600px]` constraint enforced
- [ ] SlideOver: `w-[40vw] max-w-[600px]` on desktop
- [ ] SlideOver: Renders as full-screen modal (`fixed inset-0`) on iPad
- [ ] All three panels visible ONLY when viewport ≥ 1440px

### Table/List Density
- [ ] Default row height: 52px (comfortable) OR 40px (dense)
- [ ] Action columns: Fixed width, right-aligned, no wrapping
- [ ] Status columns: Fixed width with `whitespace-nowrap`
- [ ] Empty cells: Display `-` with `text-muted-foreground`
- [ ] Timestamp columns: Fixed width with `whitespace-nowrap`

### Form Layout Standards
- [ ] Default: Single-column layout with `max-w-2xl`
- [ ] Two-column: ONLY for semantically related field pairs
- [ ] Section spacing: `space-y-8` between sections
- [ ] Field spacing: `space-y-4` within sections
- [ ] Labels: Positioned above inputs (except checkboxes)
- [ ] NEVER: Three-column layouts or labels beside text inputs

### Responsive Breakpoints
- [ ] Default styles: Written for 1440px+ viewports
- [ ] Progressive degradation: Use `lg:`, `md:`, `sm:` modifiers
- [ ] NOT mobile-first: Avoid `sm:flex-row md:grid` patterns
- [ ] Sidebar: Toggleable drawer overlay on `md:` breakpoint
- [ ] Touch targets: 44x44px minimum (`h-11 w-11`)

### Overflow Handling
- [ ] Horizontal scroll: ONLY for wide tables, never page content
- [ ] Vertical scroll: Applied to main content area, not individual cards
- [ ] Sticky headers: Filter bars and table headers use `sticky top-0`
- [ ] SlideOver: Independent scroll container
- [ ] iPad: Vertical scroll always allowed, horizontal minimized
