# 01 – Atoms: Small, Focused Components

Atoms are the smallest building blocks in the UI. In this project, they live in `src/components/ui/` and follow the **shadcn/ui** pattern: unstyled Radix UI primitives + Tailwind CSS.

> **Key Pattern:** This project separates **variants** into `.constants.ts` files to support Vite's Fast Refresh.

---

## Understanding the Pattern

Every atom in this project follows a consistent structure:

```typescript
// 1. Import Radix primitive (if interactive)
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";

// 2. Import utility for class merging
import { cn } from "@/lib/utils";

// 3. Import variants from separate file (for Fast Refresh)
import { buttonVariants } from "./button.constants";

// 4. Component uses forwardRef for ref forwarding
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        data-slot="button"  // ← Custom attribute for styling hooks
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
```

**Why `data-slot`?** Used for CSS targeting in parent components (e.g., `has-data-[slot=button]`).

---

## Key Atoms Studied

### `Button` – src/components/ui/button.tsx

**What it does:** Renders a clickable button with multiple visual variants.

**Key Props:**
| Prop | Type | Description |
|------|------|-------------|
| `variant` | `'default' \| 'destructive' \| 'outline' \| 'secondary' \| 'ghost' \| 'link'` | Visual style |
| `size` | `'default' \| 'sm' \| 'lg' \| 'icon'` | Button dimensions |
| `asChild` | `boolean` | Renders as child element (Radix Slot pattern) |

**Variants (from button.constants.ts):**
```typescript
variant: {
  default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
  destructive: "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90",
  outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
  secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  link: "text-primary underline-offset-4 hover:underline",
}
```

**Size variants:**
- All sizes use `h-12` (48px) for WCAG AA touch targets
- `icon` size: `size-12` (48px square)

**Usage in project:**
```tsx
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="ghost" size="icon"><MoreHorizontal /></Button>
```

---

### `Badge` – src/components/ui/badge.tsx

**What it does:** Displays status, category, or tag information.

**Key Props:**
| Prop | Type | Description |
|------|------|-------------|
| `variant` | `'default' \| 'secondary' \| 'destructive' \| 'outline' \| 'org-customer' \| 'org-prospect' \| 'org-principal' \| 'org-distributor' \| 'org-unknown'` | Visual style |

**Project-specific variants (badge.constants.ts):**
```typescript
// Organization type variants (MFB Garden to Table theme)
"org-customer": "border-transparent bg-tag-warm text-tag-warm-fg",
"org-prospect": "border-transparent bg-tag-sage text-tag-sage-fg",
"org-principal": "border-transparent bg-tag-purple text-tag-purple-fg",
"org-distributor": "border-transparent bg-tag-teal text-tag-teal-fg",
```

**Interesting detail:** Badge filters out React Admin props to prevent DOM warnings:
```typescript
// Filter out React Admin-specific props
label, sortable, sortBy, textAlign, rowClassName, resource, record,
```

**Usage:**
```tsx
<Badge variant="destructive">{overdueTasks.length} overdue</Badge>
<Badge variant="org-principal">Principal</Badge>
```

---

### `Input` – src/components/ui/input.tsx

**What it does:** Text input field with consistent styling and validation states.

**Key Features:**
- Minimum height: `min-h-[48px]` (WCAG touch target)
- Focus ring: `focus-visible:ring-ring/50 focus-visible:ring-[3px]`
- Invalid state: `aria-invalid:border-destructive`

**Styling breakdown:**
```css
/* Base */
bg-background border-input rounded-md border shadow-xs

/* Focus */
focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]

/* Invalid (from aria-invalid attribute) */
aria-invalid:ring-destructive/20 aria-invalid:border-destructive
```

**Usage:**
```tsx
<Input type="number" placeholder="30" className="h-11" />
```

---

### `Card` – src/components/ui/card.tsx

**What it does:** Content container with header, content, and footer sections.

**Sub-components:**
| Component | Purpose |
|-----------|---------|
| `Card` | Main container with shadow and border |
| `CardHeader` | Top section with grid layout for title + action |
| `CardTitle` | Heading text |
| `CardDescription` | Subtitle/description text |
| `CardAction` | Action button slot (auto-positioned) |
| `CardContent` | Main content area |
| `CardFooter` | Bottom section for actions |

**Key styling:**
```typescript
// Card uses semantic color variables
className={cn(
  "bg-card text-card-foreground",
  "border border-[color:var(--stroke-card)]",
  "shadow-[var(--elevation-1)]",
  "rounded-xl"
)}
```

**Smart layout with `has-data-[slot=card-action]`:**
```css
/* CardHeader auto-adjusts to 2-column when CardAction is present */
grid-cols-[1fr_auto]
```

---

### `Checkbox` – src/components/ui/checkbox.tsx

**What it does:** Boolean toggle with checkmark indicator.

**Built on:** `@radix-ui/react-checkbox`

**Key Features:**
- Size: `size-5` (20px) with padding to reach 48px touch target
- Checked state: `data-[state=checked]:bg-primary`
- Uses Lucide `CheckIcon` for indicator

**Usage in project (from TasksPanel):**
```tsx
<Checkbox
  className="h-5 w-5"
  onCheckedChange={(checked) => {
    if (checked) {
      onComplete(task.id);
    }
  }}
/>
```

---

### `Skeleton` – src/components/ui/skeleton.tsx

**What it does:** Loading placeholder with pulse animation.

**Implementation:** Just a div with `animate-pulse` and muted background.

**Usage pattern:**
```tsx
// In loading states
if (loading) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="mb-2 h-6 w-32" />  {/* Title placeholder */}
        <Skeleton className="h-4 w-64" />        {/* Description placeholder */}
      </CardHeader>
      <CardContent>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-16 w-full" />  {/* Item placeholders */}
        ))}
      </CardContent>
    </Card>
  );
}
```

---

### `Table` – src/components/ui/table.tsx

**What it does:** Data table with semantic HTML structure.

**Sub-components:**
- `Table` – wrapper with border-collapse
- `TableHeader` – sticky header support
- `TableBody` – body container
- `TableRow` – row with hover states
- `TableHead` – header cell (th)
- `TableCell` – data cell (td)

**Usage (from PrincipalPipelineTable):**
```tsx
<Table>
  <TableHeader className="sticky top-0 bg-background">
    <TableRow>
      <TableHead>Principal</TableHead>
      <TableHead className="text-right">Pipeline</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((row) => (
      <TableRow key={row.id} className="table-row-premium cursor-pointer">
        <TableCell className="font-medium">{row.name}</TableCell>
        <TableCell className="text-right">{row.totalPipeline}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

### `ResizablePanelGroup` – src/components/ui/resizable.tsx

**What it does:** Creates resizable panel layouts.

**Built on:** `react-resizable-panels`

**Sub-components:**
- `ResizablePanelGroup` – Container with direction (horizontal/vertical)
- `ResizablePanel` – Individual panel with min/max/default size
- `ResizableHandle` – Draggable divider between panels

**Key Props:**
| Prop | Description |
|------|-------------|
| `direction` | `'horizontal' \| 'vertical'` |
| `defaultSize` | Initial panel size (percentage) |
| `minSize` | Minimum panel size |
| `onLayout` | Callback when layout changes |

**Usage (from PrincipalDashboardV3):**
```tsx
<ResizablePanelGroup direction="horizontal" onLayout={handleLayoutChange}>
  <ResizablePanel defaultSize={40} minSize={25}>
    <PrincipalPipelineTable />
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={30} minSize={20}>
    <TasksPanel />
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel defaultSize={30} minSize={20}>
    <QuickLoggerPanel />
  </ResizablePanel>
</ResizablePanelGroup>
```

---

## Key Learnings

1. **Variants in separate files** – `*.constants.ts` pattern allows Fast Refresh to work properly

2. **Semantic color variables** – Never hardcode colors, use `--primary`, `--destructive`, etc.

3. **48px touch targets** – All interactive elements maintain WCAG AA compliance

4. **`cn()` utility** – Merges Tailwind classes with proper precedence

5. **`data-slot` attributes** – Enable parent components to style children conditionally

6. **Radix UI primitives** – Handle accessibility (keyboard nav, ARIA) out of the box

---

## Study Checklist

- [x] `button.tsx` + `button.constants.ts`
- [x] `badge.tsx` + `badge.constants.ts`
- [x] `input.tsx`
- [x] `card.tsx`
- [x] `checkbox.tsx`
- [x] `skeleton.tsx`
- [x] `table.tsx`
- [x] `resizable.tsx`
- [ ] `select.tsx`
- [ ] `dialog.tsx`
- [ ] `popover.tsx`
- [ ] `form.tsx`
