# Component Library

**Status:** Living Document | **Last Updated:** 2025-11-09
**Owner:** Architecture Team | **Scope:** All UI Development

## Overview

This document catalogs all reusable UI components in Atomic CRM, organized into three categories:

1. **shadcn/ui Base Components** - Foundational primitives (`src/components/ui/`)
2. **React Admin Components** - Data-bound CRM components (forms, tables, lists)
3. **Atomic CRM Custom Components** - Domain-specific widgets and layouts

**Component Design Principles:**
- **Composition over configuration** - Build complex UIs from simple primitives
- **Semantic utilities** - Use design tokens (`bg-primary` not `bg-[var(--brand-500)]`)
- **iPad-first responsive** - Optimize for 768-1024px, adapt up/down
- **Accessibility by default** - WCAG AA minimum, keyboard navigation, ARIA labels
- **Type-safe props** - TypeScript interfaces for all component APIs

---

## Base Components (shadcn/ui)

### Button

**Location:** `src/components/ui/button.tsx`

**Purpose:** Primary interactive element with variants and sizes.

**API:**

```tsx
interface ButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;  // Render as Slot (for custom elements)
}
```

**Variants:**

```tsx
<Button variant="default">Primary CTA</Button>       {/* Forest green */}
<Button variant="secondary">Secondary</Button>       {/* Light neutral */}
<Button variant="destructive">Delete</Button>        {/* Terracotta */}
<Button variant="outline">Outlined</Button>          {/* Border only */}
<Button variant="ghost">Ghost</Button>               {/* No background */}
<Button variant="link">Link</Button>                 {/* Underlined text */}
```

**Sizes:**

```tsx
<Button size="default">Default</Button>  {/* h-12 px-6 (48px tall) */}
<Button size="sm">Small</Button>         {/* h-12 px-4 (compact) */}
<Button size="lg">Large</Button>         {/* h-12 px-8 (spacious) */}
<Button size="icon"><Icon /></Button>    {/* size-12 (square 48px) */}
```

**Touch Target:** All sizes maintain 48px height (iPad HIG 44px minimum).

**Example:**

```tsx
<Button
  variant="default"
  size="default"
  onClick={handleSubmit}
  disabled={isLoading}
>
  {isLoading ? <Spinner /> : 'Save Changes'}
</Button>
```

---

### Card

**Location:** `src/components/ui/card.tsx`

**Purpose:** Container for grouped content with elevation and borders.

**Subcomponents:**
- `Card` - Root container
- `CardHeader` - Title/description area
- `CardTitle` - Heading text
- `CardDescription` - Subtitle/metadata
- `CardAction` - Top-right action button slot
- `CardContent` - Main content area
- `CardFooter` - Bottom actions/metadata

**Default Styling:**
- Background: `bg-card` (pure white)
- Border: `border-[color:var(--stroke-card)]`
- Shadow: `shadow-[var(--elevation-1)]`
- Radius: `rounded-xl` (12px)
- Padding: `gap-6` between sections, `px-6` for content

**Example:**

```tsx
<Card>
  <CardHeader>
    <CardTitle>Opportunities by Principal</CardTitle>
    <CardDescription>Last 30 days</CardDescription>
    <CardAction>
      <Button size="sm" variant="ghost">
        <DownloadIcon />
      </Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    <GroupedReportTable data={opportunities} />
  </CardContent>
  <CardFooter>
    <span className="text-sm text-muted-foreground">
      Updated 2 hours ago
    </span>
  </CardFooter>
</Card>
```

---

### Input

**Location:** `src/components/ui/input.tsx`

**Purpose:** Single-line text input with consistent styling.

**Styling:**
- Height: `h-12` (48px for touch)
- Border: `border-input`
- Focus: `focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- Error state: `aria-invalid:ring-destructive/20`

**Example:**

```tsx
<div>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    placeholder="john@example.com"
    aria-invalid={!!errors.email}
  />
  {errors.email && <p className="text-destructive text-sm">{errors.email}</p>}
</div>
```

---

### Select

**Location:** `src/components/ui/select.tsx`

**Purpose:** Dropdown select with keyboard navigation (Radix UI).

**Example:**

```tsx
<Select value={stage} onValueChange={setStage}>
  <SelectTrigger className="w-full">
    <SelectValue placeholder="Select stage" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="new_lead">New Lead</SelectItem>
    <SelectItem value="demo_scheduled">Demo Scheduled</SelectItem>
    <SelectItem value="closed_won">Closed Won</SelectItem>
  </SelectContent>
</Select>
```

---

### Dialog

**Location:** `src/components/ui/dialog.tsx`

**Purpose:** Modal dialog with overlay (Radix UI).

**Subcomponents:**
- `Dialog` - Root
- `DialogTrigger` - Button that opens dialog
- `DialogContent` - Modal container
- `DialogHeader` - Title area
- `DialogTitle` - Heading
- `DialogDescription` - Subtitle
- `DialogFooter` - Action buttons

**Example:**

```tsx
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogTrigger asChild>
    <Button>Add Contact</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create New Contact</DialogTitle>
      <DialogDescription>
        Enter contact details below
      </DialogDescription>
    </DialogHeader>
    <ContactForm onSubmit={handleSubmit} />
    <DialogFooter>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button type="submit">Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

---

### Badge

**Location:** `src/components/ui/badge.tsx`

**Purpose:** Small status indicator with color variants.

**Variants:**
- `default` - Primary color
- `secondary` - Neutral
- `destructive` - Error/warning
- `outline` - Border only

**Example:**

```tsx
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Draft</Badge>
<Badge variant="destructive">Overdue</Badge>
```

---

### Table

**Location:** `src/components/ui/table.tsx`

**Purpose:** Semantic HTML table with consistent styling.

**Subcomponents:**
- `Table` - Root `<table>`
- `TableHeader` - `<thead>`
- `TableBody` - `<tbody>`
- `TableFooter` - `<tfoot>`
- `TableRow` - `<tr>`
- `TableHead` - `<th>`
- `TableCell` - `<td>`

**Example:**

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Name</TableHead>
      <TableHead>Email</TableHead>
      <TableHead>Status</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {contacts.map(contact => (
      <TableRow key={contact.id}>
        <TableCell>{contact.name}</TableCell>
        <TableCell>{contact.email}</TableCell>
        <TableCell><Badge>{contact.status}</Badge></TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### Other Base Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **Alert** | Notification banners | `src/components/ui/alert.tsx` |
| **Avatar** | User profile images | `src/components/ui/avatar.tsx` |
| **Checkbox** | Boolean input | `src/components/ui/checkbox.tsx` |
| **RadioGroup** | Single-choice selector | `src/components/ui/radio-group.tsx` |
| **Textarea** | Multi-line text input | `src/components/ui/textarea.tsx` |
| **Switch** | Toggle input | `src/components/ui/switch.tsx` |
| **Tooltip** | Hover hint | `src/components/ui/tooltip.tsx` |
| **Popover** | Floating content | `src/components/ui/popover.tsx` |
| **Tabs** | Tabbed navigation | `src/components/ui/tabs.tsx` |
| **Accordion** | Collapsible sections | `src/components/ui/accordion.tsx` |
| **Separator** | Horizontal divider | `src/components/ui/separator.tsx` |
| **Skeleton** | Loading placeholder | `src/components/ui/skeleton.tsx` |
| **Spinner** | Loading indicator | `src/components/ui/spinner.tsx` |

---

## React Admin Components

### List Components

**Datagrid** - Primary table view for resource lists:

```tsx
<List>
  <Datagrid>
    <TextField source="name" />
    <EmailField source="email" />
    <DateField source="created_at" />
    <EditButton />
  </Datagrid>
</List>
```

**Key Features:**
- Automatic pagination
- Sortable columns
- Row selection
- Bulk actions

---

### Form Components

**SimpleForm** - Standard create/edit form:

```tsx
<Edit>
  <SimpleForm>
    <TextInput source="name" validate={required()} />
    <TextInput source="email" type="email" />
    <SelectInput source="stage" choices={stageChoices} />
    <DateInput source="due_date" />
  </SimpleForm>
</Edit>
```

**ArrayInput** - JSONB array fields (email, phone):

```tsx
<ArrayInput source="email" label="Email Addresses">
  <SimpleFormIterator inline disableReordering disableClear>
    <TextInput source="email" placeholder="Email" />
    <SelectInput source="type" choices={[
      { id: "Work" },
      { id: "Home" },
      { id: "Other" }
    ]} />
  </SimpleFormIterator>
</ArrayInput>
```

**Pattern:** See `src/atomic-crm/contacts/ContactInputs.tsx` for complete JSONB array example.

---

### Field Components

| Component | Purpose | Example |
|-----------|---------|---------|
| **TextField** | Display text | `<TextField source="name" />` |
| **EmailField** | Clickable email | `<EmailField source="email" />` |
| **DateField** | Formatted date | `<DateField source="created_at" />` |
| **NumberField** | Formatted number | `<NumberField source="amount" />` |
| **ReferenceField** | Foreign key lookup | `<ReferenceField source="sales_id" reference="sales"><TextField source="name" /></ReferenceField>` |
| **BooleanField** | Checkbox/icon | `<BooleanField source="is_active" />` |
| **ImageField** | Image display | `<ImageField source="avatar" />` |

---

## Atomic CRM Custom Components

### DashboardWidget

**Location:** `src/atomic-crm/dashboard/DashboardWidget.tsx`

**Purpose:** Standardized dashboard card container.

**Props:**

```tsx
interface DashboardWidgetProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;  // Top-right button
  children: React.ReactNode;
  className?: string;
}
```

**Example:**

```tsx
<DashboardWidget
  title="Upcoming Events"
  subtitle="Next 7 days"
  action={<Button size="sm" variant="ghost">View All</Button>}
>
  <EventList events={upcomingEvents} />
</DashboardWidget>
```

**Styling:**
- Uses `<Card>` internally
- Padding: `p-[var(--spacing-widget-padding)]` (20px)
- Min height: `min-h-[var(--spacing-widget-min-height)]` (280px)

---

### ReportHeader

**Location:** `src/atomic-crm/reports/components/ReportHeader.tsx`

**Purpose:** Consistent header for report pages.

**Props:**

```tsx
interface ReportHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;  // Export button, filters, etc.
}
```

**Example:**

```tsx
<ReportHeader
  title="Opportunities by Principal"
  description="Sales pipeline grouped by principal organization"
  actions={
    <>
      <ReportFilters />
      <Button variant="outline" onClick={handleExport}>
        <DownloadIcon /> Export CSV
      </Button>
    </>
  }
/>
```

---

### ReportFilters

**Location:** `src/atomic-crm/reports/components/ReportFilters.tsx`

**Purpose:** Date range and filter controls for reports.

**Props:**

```tsx
interface ReportFiltersProps {
  dateRange: { start: Date; end: Date };
  onDateRangeChange: (range: { start: Date; end: Date }) => void;
  additionalFilters?: React.ReactNode;
}
```

**Example:**

```tsx
<ReportFilters
  dateRange={dateRange}
  onDateRangeChange={setDateRange}
  additionalFilters={
    <Select value={principal} onValueChange={setPrincipal}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="All Principals" />
      </SelectTrigger>
      <SelectContent>
        {principals.map(p => (
          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  }
/>
```

---

### GroupedReportTable

**Location:** `src/atomic-crm/reports/components/GroupedReportTable.tsx`

**Purpose:** Two-level grouped table (e.g., principal → opportunities).

**Props:**

```tsx
interface GroupedReportTableProps<T> {
  data: Record<string, T[]>;  // groupKey → items
  groupHeaderRender: (groupKey: string, items: T[]) => React.ReactNode;
  rowRender: (item: T) => React.ReactNode;
  emptyMessage?: string;
}
```

**Example:**

```tsx
<GroupedReportTable
  data={opportunitiesByPrincipal}
  groupHeaderRender={(principalName, opps) => (
    <div className="flex items-center justify-between">
      <h3 className="font-semibold">{principalName}</h3>
      <Badge>{opps.length} opportunities</Badge>
    </div>
  )}
  rowRender={(opp) => (
    <div className="flex items-center justify-between py-2">
      <span>{opp.name}</span>
      <span className="text-muted-foreground">{opp.stage}</span>
    </div>
  )}
/>
```

---

### ContactCard

**Location:** `src/atomic-crm/contacts/ContactCard.tsx`

**Purpose:** Display contact summary in lists/grids.

**Props:**

```tsx
interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
  actions?: React.ReactNode;
}
```

**Example:**

```tsx
<ContactCard
  contact={contact}
  onClick={() => navigate(`/contacts/${contact.id}`)}
  actions={
    <>
      <Button size="icon" variant="ghost">
        <PhoneIcon />
      </Button>
      <Button size="icon" variant="ghost">
        <EmailIcon />
      </Button>
    </>
  }
/>
```

---

### OpportunityCard

**Location:** `src/atomic-crm/opportunities/OpportunityCard.tsx`

**Purpose:** Display opportunity summary in board/list views.

**Props:**

```tsx
interface OpportunityCardProps {
  opportunity: Opportunity;
  draggable?: boolean;
  onDragStart?: (e: DragEvent) => void;
  onDragEnd?: (e: DragEvent) => void;
}
```

**Features:**
- Stage-based styling (border colors from `stageConstants.ts`)
- Drag-and-drop support for kanban board
- Elevation shadows on hover

---

## Component Composition Patterns

### Form with JSONB Arrays

**Pattern:** Email/phone multi-value inputs using Zod sub-schemas.

```tsx
// 1. Zod schema with sub-schema (validation layer)
export const emailAndTypeSchema = z.object({
  email: z.string().email(),
  type: z.enum(["Work", "Home", "Other"]).default("Work"),
});

const contactSchema = z.object({
  email: z.array(emailAndTypeSchema).default([]),
  // ... other fields
});

// 2. Form (NO defaultValue on inputs)
<ArrayInput source="email" label="Email Addresses">
  <SimpleFormIterator inline>
    <TextInput source="email" placeholder="Email" />
    <SelectInput source="type" choices={emailTypes} />
    {/* Defaults come from Zod, not here */}
  </SimpleFormIterator>
</ArrayInput>

// 3. Form initialization from Zod
const defaultValues = contactSchema.partial().parse({});
```

**Key Points:**
- Defaults defined in Zod (`.default()`)
- NO `defaultValue` prop on form inputs
- Form state: `schema.partial().parse({})`

**Reference:** `src/atomic-crm/contacts/ContactInputs.tsx`

---

### Dashboard Grid Layout

**Pattern:** 12-column grid with 8-column main, 4-column sidebar.

```tsx
<div className="px-[var(--spacing-edge-mobile)] md:px-[var(--spacing-edge-ipad)] lg:px-[var(--spacing-edge-desktop)] pt-[var(--spacing-top-offset)]">
  <div className="space-y-[var(--spacing-section)]">
    <DashboardHeader />
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-[var(--spacing-gutter-desktop)]">
      <div className="lg:col-span-8 space-y-[var(--spacing-widget)]">
        <DashboardWidget title="Main Widget 1">...</DashboardWidget>
        <DashboardWidget title="Main Widget 2">...</DashboardWidget>
      </div>
      <div className="lg:col-span-4 space-y-[var(--spacing-widget)]">
        <DashboardWidget title="Sidebar Widget 1">...</DashboardWidget>
        <DashboardWidget title="Sidebar Widget 2">...</DashboardWidget>
      </div>
    </div>
  </div>
</div>
```

---

### Report Page Layout

**Pattern:** Header → filters → grouped table.

```tsx
<div className="px-[var(--spacing-edge-mobile)] md:px-[var(--spacing-edge-ipad)] lg:px-[var(--spacing-edge-desktop)] py-[var(--spacing-section)] max-w-[1600px] mx-auto">
  <div className="space-y-[var(--spacing-section)]">
    <ReportHeader
      title="Weekly Activity Summary"
      description="Activities grouped by rep and principal"
      actions={<Button onClick={handleExport}>Export CSV</Button>}
    />
    <Card className="p-[var(--spacing-widget-padding)]">
      <ReportFilters
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />
    </Card>
    <GroupedReportTable
      data={activitiesByRep}
      groupHeaderRender={renderRepHeader}
      rowRender={renderActivityRow}
    />
  </div>
</div>
```

---

## Styling Conventions

### Semantic Utilities (Required)

```tsx
{/* ✅ CORRECT - Semantic utilities */}
className="bg-primary text-primary-foreground hover:bg-primary/90"
className="text-muted-foreground border-border"

{/* ❌ WRONG - Inline CSS variables */}
className="bg-[var(--brand-500)] text-[color:var(--text-subtle)]"
```

### Responsive Breakpoints

```tsx
{/* iPad-first pattern */}
className="
  p-4           /* Mobile: compact */
  md:p-6        /* iPad: spacious */
  lg:p-8        /* Desktop: generous */

  grid-cols-1   /* Mobile: stacked */
  md:grid-cols-3 /* iPad: 3-column */
  lg:grid-cols-4 /* Desktop: 4-column */
"
```

### Touch Targets

```tsx
{/* Minimum 44px (iPad HIG) */}
<Button className="w-11 h-11 md:w-12 md:h-12">
  <Icon className="w-6 h-6" />
</Button>
```

---

## Accessibility Checklist

Before committing components:

- [ ] Semantic HTML (`<button>` not `<div onClick>`)
- [ ] Labels for all form inputs (visible or `sr-only`)
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus states visible (`focus-visible:ring-ring`)
- [ ] ARIA attributes (`aria-label`, `aria-invalid`, `aria-describedby`)
- [ ] Color contrast WCAG AA (4.5:1 minimum)
- [ ] Touch targets ≥ 44px

---

## Testing Patterns

### Component Testing (Vitest + React Testing Library)

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders with correct variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button', { name: /delete/i });
    expect(button).toHaveClass('bg-destructive');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    const button = screen.getByRole('button');
    await userEvent.click(button);
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### E2E Testing (Playwright)

```tsx
test('contact form submission', async ({ page }) => {
  await page.goto('/contacts/create');

  // Use semantic selectors
  await page.getByLabel('First Name').fill('John');
  await page.getByLabel('Last Name').fill('Doe');
  await page.getByLabel('Email').fill('john@example.com');
  await page.getByRole('button', { name: /save/i }).click();

  // Verify navigation
  await expect(page).toHaveURL(/\/contacts\/\d+/);
});
```

---

## Related Documentation

- [Design System](./design-system.md) - Colors, spacing, typography
- [UI Design Consistency](.claude/skills/ui-design-consistency/SKILL.md) - Implementation patterns
- [Engineering Constitution](../claude/engineering-constitution.md) - Component principles
- [Testing Quick Reference](../development/testing-quick-reference.md) - Testing strategies
