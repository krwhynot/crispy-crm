# Component Architecture

## Purpose

Document React component patterns used in Atomic CRM for building maintainable, composable, and type-safe UI components with Tailwind CSS and TypeScript.

## Unified Admin Components

**Per unified design system rollout** (docs/archive/plans/2025-11-16-unified-design-system-rollout.md:422-434):

Three reusable components establish the standardized layout pattern across all resources:

### 1. StandardListLayout

**Usage:** Wraps all resource list pages

```tsx
import { StandardListLayout } from '@/components/admin/StandardListLayout';

<StandardListLayout filterComponent={<ContactFilters />}>
  <PremiumDatagrid>
    {/* Datagrid columns */}
  </PremiumDatagrid>
</StandardListLayout>
```

**Includes:**
- Left sidebar (filter-sidebar, 256px)
- Main content area (card-container)
- Sticky filter positioning

### 2. ResourceSlideOver

**Usage:** Opens on row click or edit button (`?view=123` or `?edit=123`)

```tsx
<ResourceSlideOver
  resource="contacts"
  recordId={123}
  mode="view"  // or "edit"
  tabs={[
    { key: 'details', label: 'Details', component: DetailsTab },
    { key: 'history', label: 'History', component: HistoryTab },
  ]}
/>
```

**Features:**
- Width: 40vw (min 480px, max 720px)
- Animation: 200ms slide-in from right
- Focus trap & keyboard handling
- URL sync (query params)

### 3. PremiumDatagrid

**Usage:** Wraps React Admin Datagrid with premium styling

```tsx
<PremiumDatagrid rowClassName={() => 'table-row-premium'}>
  <TextField source="name" />
  <EditButton />
</PremiumDatagrid>
```

**Applies:**
- `.table-row-premium` to all rows
- Hover effects: border reveal, shadow-md, lift animation
- Click behavior: opens slide-over (not full page)

### Direct Migration Rule

**NO feature flags, gradual rollout, or legacy fallbacks** (docs/archive/plans/2025-11-16-unified-design-system-rollout.md:436-487):
- Delete old components immediately
- Breaking changes are expected
- Fix forward if issues arise

## Core Pattern: Compound Components

Compound components provide flexible composition while maintaining component integrity. The Card component exemplifies this pattern.

**From `src/components/ui/card.tsx`:**

```typescript
import * as React from "react";
import { cn } from "@/lib/utils";

// Root component
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-[color:var(--stroke-card)] shadow-[var(--elevation-1)]",
        className
      )}
      {...props}
    />
  );
}

// Sub-components
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min items-start gap-1.5 px-6",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("leading-none font-semibold text-[color:var(--text-title)]", className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("px-6", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardContent };
```

**Usage:**

```typescript
<Card>
  <CardHeader>
    <CardTitle>Opportunities by Principal</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**Why this works:**
- Individual exports (not dot notation) for tree-shaking
- `data-slot` attributes for targeted styling
- Flexible composition - use only what you need
- Full TypeScript support via `React.ComponentProps`

## Component Patterns

### Pattern 1: Presentational Components

Pure UI components with no business logic.

```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
  icon?: React.ReactNode;
}

export function StatCard({ title, value, trend, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className={trend.direction === 'up' ? 'text-success' : 'text-destructive'}>
              {trend.direction === 'up' ? '↑' : '↓'}
            </span>
            {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### Pattern 2: Container Components

Handle data fetching and business logic.

```typescript
export function OrganizationsStatsContainer() {
  const { data, isLoading } = useGetList('organizations', {
    pagination: { page: 1, perPage: 1 },
    filter: {},
  });

  if (isLoading) return <Skeleton className="h-32" />;

  const total = data?.total || 0;
  const thisMonth = calculateThisMonth(data);

  return (
    <StatCard
      title="Total Organizations"
      value={total}
      trend={{ direction: 'up', value: `+${thisMonth} this month` }}
      icon={<Building2 className="h-4 w-4" />}
    />
  );
}
```

### Pattern 3: Variant-Based Components

Use `class-variance-authority` for complex variants.

**From `src/components/ui/button.constants.ts` (inferred):**

```typescript
import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3", // 48px touch target
        sm: "h-11 px-4",           // 44px minimum
        lg: "h-14 px-8",           // 56px spacious
        icon: "h-12 w-12",         // Square 48px
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

**Usage:**

```typescript
<Button variant="default" size="default">Primary Action</Button>
<Button variant="outline" size="sm">Secondary</Button>
<Button variant="ghost" size="icon">
  <X className="h-4 w-4" />
</Button>
```

### Pattern 4: Custom Hooks for Logic Reuse

Encapsulate complex logic in custom hooks.

```typescript
// useOrganizationFilters.ts
export function useOrganizationFilters() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<OrganizationType | null>(null);
  const [priority, setPriority] = useState<Priority | null>(null);

  const filter = useMemo(() => {
    const result: any = {};

    if (search) {
      result.name = { $ilike: `%${search}%` };
    }

    if (type) {
      result.organization_type = type;
    }

    if (priority) {
      result.priority = priority;
    }

    return result;
  }, [search, type, priority]);

  return {
    search,
    setSearch,
    type,
    setType,
    priority,
    setPriority,
    filter,
  };
}

// Usage in component
function OrganizationList() {
  const { filter, search, setSearch, type, setType } = useOrganizationFilters();

  const { data } = useGetList('organizations', {
    pagination: { page: 1, perPage: 25 },
    filter,
  });

  return (
    <div>
      <Input value={search} onChange={(e) => setSearch(e.target.value)} />
      {/* Render list */}
    </div>
  );
}
```

### Pattern 5: Render Props for Flexibility

Provide flexibility through render props.

```typescript
interface DataListProps<T> {
  data: T[];
  isLoading: boolean;
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderLoading?: () => React.ReactNode;
}

export function DataList<T>({
  data,
  isLoading,
  renderItem,
  renderEmpty = () => <p>No items found</p>,
  renderLoading = () => <Skeleton />,
}: DataListProps<T>) {
  if (isLoading) {
    return <>{renderLoading()}</>;
  }

  if (data.length === 0) {
    return <>{renderEmpty()}</>;
  }

  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index}>{renderItem(item, index)}</div>
      ))}
    </div>
  );
}

// Usage
<DataList
  data={organizations}
  isLoading={isLoading}
  renderItem={(org) => (
    <Card>
      <CardHeader>
        <CardTitle>{org.name}</CardTitle>
      </CardHeader>
    </Card>
  )}
  renderEmpty={() => (
    <Card>
      <CardContent className="text-center text-muted-foreground">
        No organizations found. Create your first one!
      </CardContent>
    </Card>
  )}
/>
```

## File Organization

### UI Components Structure

```
src/components/ui/
├── button.tsx              # Component
├── button.constants.ts     # CVA variants
├── button.stories.tsx      # Storybook stories
├── card.tsx                # Compound component
├── card-elevation.stories.tsx  # Elevation demos
└── ...
```

### Feature Components Structure

```
src/atomic-crm/organizations/
├── List.tsx                # List view (lazy-loaded)
├── Show.tsx                # Detail view
├── Edit.tsx                # Edit form
├── Create.tsx              # Create form
├── OrganizationCard.tsx    # Presentational component
├── OrganizationFilters.tsx # Filter UI
├── useOrganizationFilters.ts  # Custom hook
└── index.ts                # Lazy exports
```

**Lazy Loading Pattern:**

```typescript
// src/atomic-crm/organizations/index.ts
import React from "react";

const List = React.lazy(() => import("./List"));
const Show = React.lazy(() => import("./Show"));
const Edit = React.lazy(() => import("./Edit"));
const Create = React.lazy(() => import("./Create"));

export default {
  list: List,
  show: Show,
  edit: Edit,
  create: Create,
  recordRepresentation: (record: any) => record.name,
};
```

## TypeScript Prop Patterns

### Pattern 1: Extending HTML Elements

```typescript
// Extend native button props
interface CustomButtonProps extends React.ComponentProps<'button'> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function CustomButton({
  isLoading,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: CustomButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={cn("flex items-center gap-2", props.className)}
    >
      {leftIcon}
      {isLoading ? <Spinner /> : children}
      {rightIcon}
    </button>
  );
}
```

### Pattern 2: Discriminated Unions

```typescript
// Single vs Multi selection
type SelectionMode =
  | { mode: 'single'; value: string; onChange: (value: string) => void }
  | { mode: 'multi'; value: string[]; onChange: (value: string[]) => void };

interface ListProps extends SelectionMode {
  items: Array<{ id: string; label: string }>;
}

export function List(props: ListProps) {
  if (props.mode === 'single') {
    // TypeScript knows: value is string, onChange takes string
    return <SingleSelect value={props.value} onChange={props.onChange} />;
  } else {
    // TypeScript knows: value is string[], onChange takes string[]
    return <MultiSelect value={props.value} onChange={props.onChange} />;
  }
}
```

### Pattern 3: Generic Components

```typescript
interface SelectProps<T> {
  options: T[];
  value: T | null;
  onChange: (value: T) => void;
  getOptionLabel: (option: T) => string;
  getOptionValue: (option: T) => string;
}

export function Select<T>({
  options,
  value,
  onChange,
  getOptionLabel,
  getOptionValue,
}: SelectProps<T>) {
  return (
    <select
      value={value ? getOptionValue(value) : ''}
      onChange={(e) => {
        const selected = options.find(
          (opt) => getOptionValue(opt) === e.target.value
        );
        if (selected) onChange(selected);
      }}
    >
      {options.map((option) => (
        <option key={getOptionValue(option)} value={getOptionValue(option)}>
          {getOptionLabel(option)}
        </option>
      ))}
    </select>
  );
}

// Usage with type inference
<Select
  options={organizations}
  value={selectedOrg}
  onChange={setSelectedOrg}
  getOptionLabel={(org) => org.name}
  getOptionValue={(org) => org.id.toString()}
/>
```

## CRM-Specific Patterns

### Pattern 1: Entity Detail Pages (Tabs)

```typescript
export function OrganizationShow() {
  return (
    <Show>
      <TabbedShowLayout>
        <TabbedShowLayout.Tab label="Summary">
          <TextField source="name" />
          <TextField source="organization_type" />
          <NumberField source="nb_contacts" label="Contacts" />
        </TabbedShowLayout.Tab>

        <TabbedShowLayout.Tab label="Contacts" count={data?.nb_contacts}>
          <ReferenceManyField reference="contacts" target="organization_id">
            <Datagrid>
              <TextField source="first_name" />
              <TextField source="last_name" />
              <EmailField source="email" />
            </Datagrid>
          </ReferenceManyField>
        </TabbedShowLayout.Tab>

        <TabbedShowLayout.Tab label="Opportunities" count={data?.nb_opportunities}>
          {/* Opportunities list */}
        </TabbedShowLayout.Tab>
      </TabbedShowLayout>
    </Show>
  );
}
```

### Pattern 2: Quick-Add Components

```typescript
export function QuickAddOrganization({ onSuccess }: { onSuccess: (org: Organization) => void }) {
  const [name, setName] = useState('');
  const [create, { isLoading }] = useCreate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data } = await create('organizations', { data: { name } });
      onSuccess(data);
      setName('');
    } catch (error) {
      console.error('Failed to create organization:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Organization name"
        className="flex-1"
      />
      <Button type="submit" disabled={!name || isLoading}>
        {isLoading ? 'Creating...' : 'Add'}
      </Button>
    </form>
  );
}
```

## Accessibility Considerations

### Touch Targets

**Minimum 44x44px for all interactive elements:**

```typescript
// ✅ GOOD: Meets minimum
<Button size="sm">Action</Button>  // h-11 (44px)

// ❌ BAD: Below minimum
<button className="h-10 w-10">X</button>  // 40px
```

### Semantic HTML

```typescript
// ✅ GOOD: Semantic button
<button onClick={handleClick}>Submit</button>

// ❌ BAD: Non-semantic clickable div
<div onClick={handleClick} className="cursor-pointer">Submit</div>
```

### Labels and ARIA

```typescript
// Form field with proper label
<div>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    aria-invalid={errors.email ? 'true' : 'false'}
    aria-describedby={errors.email ? 'email-error' : undefined}
  />
  {errors.email && (
    <p id="email-error" className="text-sm text-destructive">
      {errors.email.message}
    </p>
  )}
</div>
```

## Performance Notes

- Use `React.memo` for expensive list items
- Lazy load route components with `React.lazy`
- Split large components into smaller, focused pieces
- Avoid inline function definitions in render (use `useCallback`)

## Best Practices

### DO
✅ Use compound components for related UI elements
✅ Separate presentational and container components
✅ Export individual components (not dot notation) for tree-shaking
✅ Use `data-slot` attributes for targeted styling
✅ Provide TypeScript types for all props
✅ Use CVA for complex variant systems
✅ Extract reusable logic into custom hooks
✅ Meet 44x44px minimum touch targets

### DON'T
❌ Create god components with too many responsibilities
❌ Mix business logic with presentational code
❌ Use non-semantic HTML (`<div>` instead of `<button>`)
❌ Skip TypeScript prop types
❌ Hardcode values that should be props
❌ Create touch targets smaller than 44px
❌ Bypass accessibility requirements

## Common Issues & Solutions

### Issue: Component re-renders unnecessarily

**Solution:** Use `React.memo` with custom comparison

```typescript
const OrganizationCard = React.memo(
  function OrganizationCard({ organization }: { organization: Organization }) {
    return <Card>{/* ... */}</Card>;
  },
  (prevProps, nextProps) => {
    // Only re-render if organization ID changed
    return prevProps.organization.id === nextProps.organization.id;
  }
);
```

### Issue: Props become unwieldy

**Solution:** Group related props into objects

```typescript
// ❌ BAD: Too many individual props
<UserProfile
  firstName="John"
  lastName="Doe"
  email="john@example.com"
  phone="555-1234"
  address="123 Main St"
/>

// ✅ GOOD: Grouped props
<UserProfile user={{ firstName: "John", lastName: "Doe", email: "john@example.com" }} />
```

## Related Resources

- [React Performance](react-performance.md) - Optimization techniques
- [TypeScript Patterns](typescript-patterns.md) - Advanced TypeScript patterns
- [Design Tokens](design-tokens.md) - Spacing and sizing tokens
- [Form Patterns](form-patterns.md) - Form component patterns
