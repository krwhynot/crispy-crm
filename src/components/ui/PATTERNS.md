# UI Component Patterns

Standard patterns for shadcn/ui components in Crispy CRM.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           COMPONENT HIERARCHY                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Radix Primitives / Vaul ← Foundation (Dialog, Checkbox, etc.)              │
│           ↑                                                                 │
│  shadcn/ui Wrappers ← CVA variants + Tailwind styling + data-slot           │
│           ↑                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ LAYOUT          │ INPUTS           │ FEEDBACK        │ DATA           │  │
│  │ ─────────────── │ ──────────────── │ ─────────────── │ ────────────── │  │
│  │ Sidebar         │ Button           │ Badge           │ DataCell       │  │
│  │ Card            │ Input            │ Dialog          │ DataRow        │  │
│  │ Sheet           │ Checkbox         │ Drawer          │ DataHeaderCell │  │
│  │                 │ Combobox         │ DropdownMenu    │                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│           ↑                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ FORMS: Form → FormField → FormItem → FormControl → Input/Checkbox     │  │
│  │        (react-hook-form integration with automatic ARIA binding)      │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Pattern A: Shadcn Wrapper Architecture

**When to use:** Every UI component follows this pattern for consistency.

The foundation of all shadcn/ui components in Crispy CRM:

1. **`asChild` prop with `Slot`** — Polymorphic composition (render as different element)
2. **`data-slot` attribute** — CSS targeting and debugging
3. **CVA variants in `.constants.ts`** — Fast Refresh support during development
4. **`forwardRef` + spread props** — Full HTML compatibility

```tsx
// src/components/ui/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { buttonVariants } from "./button.constants";

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        data-slot="button"
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
export { Button, buttonVariants };
```

**Key points:**
- `asChild` renders children as the root element (useful for `<Link>` wrappers)
- `data-slot="button"` enables CSS selectors like `[data-slot=button]`
- Variants extracted to `button.constants.ts` prevents full component re-render during dev
- TypeScript infers variant props from CVA automatically

---

## Pattern B: Custom Data Components

**When to use:** Displaying tabular data with type-specific formatting.

High-density data display components optimized for CRM lists:

```tsx
// src/components/ui/data-cell.tsx
export interface DataCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /**
   * Cell data type for formatting:
   * - text: left-aligned (default)
   * - numeric: tabular-nums, right-aligned
   * - currency: tabular-nums + auto-formats numbers as USD
   * - date: tabular-nums for consistent digit width
   */
  type?: "text" | "numeric" | "currency" | "date"
  truncate?: boolean
  maxWidth?: number
}

const DataCell = React.forwardRef<HTMLTableCellElement, DataCellProps>(
  ({ className, type = "text", truncate = false, maxWidth = 200, children, ...props }, ref) => {
    // Currency formatting via centralized formatCurrency utility
    const formattedChildren = React.useMemo(() => {
      if (type === "currency" && typeof children === "number") {
        return formatCurrency(children)
      }
      return children
    }, [type, children])

    return (
      <td
        ref={ref}
        data-slot="data-cell"
        data-type={type}
        className={cn(
          // Base: 13px font, tight line-height, compact padding
          "px-2 py-1.5",
          "text-[0.8125rem] leading-[1.35]",

          // Z-index for focus ring visibility
          "relative focus-within:z-20",

          // Type-specific formatting
          type === "numeric" && "tabular-nums lining-nums text-right",
          type === "currency" && "tabular-nums lining-nums slashed-zero text-right",
          type === "date" && "tabular-nums",
          type === "text" && "text-left",

          truncate && "truncate",
          className
        )}
        style={{ ...(truncate ? { maxWidth: `${maxWidth}px` } : {}) }}
        {...props}
      >
        {formattedChildren}
      </td>
    )
  }
)
```

**DataRow with responsive height:**

```tsx
// src/components/ui/data-cell.tsx
const DataRow = React.forwardRef<HTMLTableRowElement, DataRowProps>(
  ({ className, interactive = true, ...props }, ref) => (
    <tr
      ref={ref}
      data-slot="data-row"
      className={cn(
        // RESPONSIVE HEIGHT
        // Desktop: 32px, Touch devices: 40px
        "h-8",
        "[@media(hover:none)]:h-10",

        // Border for Excel-like grid
        "border-b border-border/40",

        // Interactive states
        interactive && [
          "cursor-pointer",
          "hover:bg-muted/50",
          "focus-visible:bg-muted/50",
          "focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-inset",
        ],

        // Fast transition (≤75ms for data entry speed)
        "transition-colors duration-75",
        className
      )}
      tabIndex={interactive ? 0 : undefined}
      {...props}
    />
  )
)
```

**DataHeaderCell for sticky table headers:**

```tsx
// src/components/ui/data-cell.tsx
export interface DataHeaderCellProps
  extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Sticky position at top of scroll container */
  sticky?: boolean
  /** Right-align for numeric columns */
  align?: "left" | "right"
}

const DataHeaderCell = React.forwardRef<HTMLTableCellElement, DataHeaderCellProps>(
  ({ className, sticky = false, align = "left", ...props }, ref) => (
    <th
      ref={ref}
      data-slot="data-header-cell"
      className={cn(
        // Base styles
        "px-2 py-2",
        "text-xs font-semibold uppercase tracking-wide",
        "text-muted-foreground",

        // Alignment
        align === "left" ? "text-left" : "text-right",

        // Background (needed for sticky)
        "bg-background",

        // Border
        "border-b border-border",

        // Sticky positioning
        sticky && "sticky top-0 z-10",

        className
      )}
      {...props}
    />
  )
)
```

**Key points:**
- `tabular-nums` ensures consistent digit widths for column alignment
- `slashed-zero` distinguishes 0 from O in financial data
- `@media(hover:none)` targets touch devices without hover capability
- Z-index management prevents clipped focus rings in overflow containers
- `DataHeaderCell` uses `sticky` prop with `z-10` for scroll-locked headers
- Header alignment via `align` prop matches `DataCell` type-based alignment

---

## Pattern C: Form Integration

**When to use:** Any form field that needs validation, labels, and error messages.

The form system uses nested contexts to auto-generate accessible IDs:

```
Form (FormProvider)
  └── FormField (Controller + context)
        └── FormItem (ID generator)
              ├── FormLabel
              ├── FormControl (ARIA injection)
              │     └── Input/Checkbox/etc.
              ├── FormDescription (optional)
              └── FormMessage (error with role="alert")
```

**FormControl — ARIA attribute injection:**

```tsx
// src/components/ui/form.tsx
const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
```

**FormMessage — Error display with screen reader announcement:**

```tsx
// src/components/ui/form.tsx
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) return null;

  return (
    <p
      ref={ref}
      id={formMessageId}
      role="alert"
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
});
```

**useFormField hook — Automatic ID generation:**

```tsx
// src/components/ui/form.tsx
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);
  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};
```

**Key points:**
- `Slot` injects ARIA attributes into whatever child component is rendered
- `role="alert"` causes screen readers to announce errors immediately
- `aria-describedby` links input to both description and error message
- IDs are auto-generated via `React.useId()` — never hardcode

---

## Pattern D: Badge System

**When to use:** Status indicators, tags, and labels throughout the CRM.

Badges use semantic variants for core states plus domain-specific variants for MFB organization types:

```tsx
// src/components/ui/badge.constants.ts
export const badgeVariants = cva(
  // Base: subtle depth with hairline border
  "inline-flex items-center justify-center rounded-md border px-2.5 py-0.5 text-xs font-medium " +
  "shadow-[var(--badge-shadow)] ring-1 ring-inset ring-black/[0.08] dark:ring-white/[0.08] " +
  "transition-colors duration-150",
  {
    variants: {
      variant: {
        // Semantic variants
        default:     "border-transparent bg-primary text-primary-foreground ring-primary/20",
        secondary:   "border-transparent bg-secondary text-secondary-foreground ring-secondary-foreground/10",
        destructive: "border-transparent bg-destructive text-destructive-foreground ring-destructive/20",
        success:     "border-transparent bg-success text-success-foreground ring-success/20",
        warning:     "border-transparent bg-warning text-warning-foreground ring-warning/20",
        outline:     "text-foreground ring-border",

        // MFB Organization type variants (Garden to Table theme)
        "org-customer":    "border-transparent bg-tag-warm text-tag-warm-fg ring-tag-warm-fg/15",
        "org-prospect":    "border-transparent bg-tag-sage text-tag-sage-fg ring-tag-sage-fg/15",
        "org-principal":   "border-transparent bg-tag-purple text-tag-purple-fg ring-tag-purple-fg/15",
        "org-distributor": "border-transparent bg-tag-teal text-tag-teal-fg ring-tag-teal-fg/15",
        "org-unknown":     "border-transparent bg-tag-gray text-tag-gray-fg ring-tag-gray-fg/15",
      },
    },
    defaultVariants: { variant: "default" },
  }
);
```

| Variant | Use Case |
|---------|----------|
| `default` | Primary actions, new items |
| `secondary` | Neutral/informational |
| `destructive` | Errors, warnings, deletions |
| `success` | Completed, approved |
| `warning` | Pending, needs attention |
| `outline` | Subtle categorization |
| `org-*` | MFB-specific organization types |

---

## Pattern E: Layout Components

**When to use:** Page structure with sidebars, cards, and content areas.

### Card with Elevation System

```tsx
// src/components/ui/card.tsx
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-border",

        // Warm-tinted elevation: E1 base → E2 on hover
        "shadow-[var(--elevation-1)] hover:shadow-[var(--elevation-2)]",

        // 150ms transition with smooth easing
        "transition-[box-shadow,transform] duration-150 ease-out",

        // Subtle lift on hover (respects reduced motion)
        "motion-safe:hover:-translate-y-px",
        className
      )}
      {...props}
    />
  );
}
```

### Card with Action Button

```tsx
// src/components/ra-wrappers/section-card.tsx and admin-button.tsx
<SectionCard>
  <div>
    <div className="flex items-center justify-between">
      <div>
        <h3>Contact Details</h3>
        <p className="text-sm text-muted-foreground">Last updated 2 days ago</p>
      </div>
      <AdminButton variant="ghost" size="icon">
        <MoreHorizontal />
      </AdminButton>
    </div>
  </div>
  <div className="space-y-4">
    {/* Content here */}
  </div>
  <div className="flex justify-end gap-2">
    <AdminButton>Save Changes</AdminButton>
  </div>
</SectionCard>
```

**CardHeader uses container queries for responsive layouts:**

```tsx
// src/components/ui/card.tsx
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6",
        "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
        className
      )}
      {...props}
    />
  );
}
```

**Key points:**
- `--elevation-1` and `--elevation-2` are CSS variables for consistent shadows
- `motion-safe:` prefix respects `prefers-reduced-motion`
- `@container` enables component-level responsive design
- `has-data-[slot=card-action]` auto-adjusts grid when action present

---

## Pattern F: Input Components

**When to use:** Form fields, search boxes, and user data entry.

### Input with Direct Touch Target Sizing

The input uses direct `h-11` (44px) height to meet touch target requirements:

```tsx
// src/components/ui/input.tsx
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        data-slot="input"
        dir="auto"
        className={cn(
          // Base styles
          "w-full min-w-0 bg-transparent outline-none",
          "transition-[border-color,background-color,box-shadow] duration-75",

          size === "default" && [
            // DIRECT TOUCH TARGET SIZING (44px)
            // Uses h-11 directly - simpler than pseudo-element expansion
            "h-11 px-3 py-2",
            "text-sm leading-normal",
            "rounded-md",
          ],

          size === "lg" && [
            // Legacy 48px height for backward compatibility
            "min-h-[48px] px-3 py-2",
            "text-base md:text-sm",
            "rounded-md",
          ],

          // Hybrid border system
          "border border-border/40",
          "hover:border-border hover:bg-accent/10",
          "focus:border-primary focus:ring-1 focus:ring-primary/30",

          // Touch devices: always show full border
          "[@media(hover:none)]:border-border",
          "[@media(hover:none)]:bg-muted/20",

          // Error state (works with FormControl's aria-invalid)
          "aria-invalid:border-destructive",
          "aria-invalid:ring-1 aria-invalid:ring-destructive/30",

          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
```

### Button Sizes (All 48px for Touch)

```tsx
// src/components/ui/button.constants.ts
size: {
  default: "h-12 px-6 py-2 has-[>svg]:px-4",
  sm:      "h-12 rounded-md gap-2 px-4 has-[>svg]:px-3",
  lg:      "h-12 rounded-md px-8 has-[>svg]:px-6",
  icon:    "size-12",
}
```

**Key points:**
- All button sizes use `h-12` (48px) — exceeds 44px touch target requirement
- `has-[>svg]` reduces padding when button contains only an icon
- `before::` pseudo-element expands touch area without visual change
- `[@media(hover:none)]` detects touch devices via CSS

---

## Pattern G: Accessibility Patterns

**When to use:** Every interactive component must follow these patterns.

### Input Error States

```tsx
// Error styling triggered by aria-invalid attribute
"aria-invalid:border-destructive",
"aria-invalid:ring-1 aria-invalid:ring-destructive/30",
"aria-invalid:focus:border-destructive",
"aria-invalid:focus:ring-destructive/30",
```

### Checkbox with State Styling

```tsx
// src/components/ui/checkbox.tsx
<CheckboxPrimitive.Root
  data-slot="checkbox"
  className={cn(
    // Base
    "peer border-input size-5 shrink-0 rounded-[4px] border shadow-xs",

    // Checked state via data attribute
    "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
    "data-[state=checked]:border-primary",

    // Focus visible
    "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",

    // Error state
    "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",

    // Disabled
    "disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
/>
```

### Combobox with ARIA Roles

```tsx
// src/components/ra-wrappers/admin-button.tsx
<AdminButton
  id={id}
  variant="outline"
  role="combobox"           // Announces as combobox to screen readers
  aria-expanded={open}      // Announces open/closed state
  className={cn("w-[200px] justify-between", className)}
  disabled={disabled}
>
  {selectedOption ? selectedOption.label : placeholder}
  <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
</AdminButton>
```

### Screen Reader Text

```tsx
// src/components/ui/dialog.tsx (close button)
<DialogPrimitive.Close className="size-11 flex items-center justify-center ...">
  <XIcon />
  <span className="sr-only">Close</span>
</DialogPrimitive.Close>
```

| ARIA Attribute | Purpose | Example |
|----------------|---------|---------|
| `aria-invalid` | Indicates validation error | `aria-invalid={!!error}` |
| `aria-describedby` | Links to description/error | `aria-describedby="email-error"` |
| `aria-expanded` | Announces dropdown state | `aria-expanded={open}` |
| `role="alert"` | Immediate screen reader announcement | Error messages |
| `role="combobox"` | Semantic role for autocomplete | Combobox trigger |
| `sr-only` | Hidden visually, readable by screen readers | Close button label |

---

## Pattern H: Touch-Target Compliance

**When to use:** Every clickable element must have 44x44px minimum touch area.

### Technique 1: Direct Sizing (Preferred)

```tsx
// Buttons use h-12 (48px) directly
"h-12 px-6 py-2"  // 48px height

// Icon buttons
"size-12"  // 48x48px
```

### Technique 2: Pseudo-Element Expansion

For compact visual elements that need larger touch areas (not currently used for Input, but available for other compact components):

```tsx
// Example: 32px visual element with 44px touch area
"relative",
"before:content-['']",
"before:absolute",
"before:top-[calc((44px-100%)/-2)]",    // Centers 44px area vertically
"before:bottom-[calc((44px-100%)/-2)]",
"before:left-0",
"before:right-0",
```

Note: The Input component uses direct `h-11` sizing instead of pseudo-element expansion for simplicity.

### Technique 3: Mobile-Only Expansion

```tsx
// src/components/ui/sidebar.tsx (SidebarGroupAction)
// Increases hit area on mobile, hidden on desktop
"after:absolute after:-inset-2 md:after:hidden",
```

### Touch Target Checklist

| Component | Visual Size | Touch Target | Method |
|-----------|-------------|--------------|--------|
| Button | 48px | 48px | Direct `h-12` |
| Input | 44px | 44px | Direct `h-11` |
| Checkbox | 20px | 44px | Parent container |
| Close button | 44px | 44px | Direct `size-11` |
| Sidebar action | 20px | 36px (mobile) | `after::` pseudo |

---

## Pattern I: Dialog/Modal Patterns

**When to use:** Refer to this table when choosing between overlay components.

| Scenario | Component | Why |
|----------|-----------|-----|
| Confirmation (Delete? Yes/No) | **Dialog** | Centered, focused, modal-only |
| Detail panel while viewing list | **Sheet** (right) | Side-by-side, URL-driven |
| Create form (desktop) | **Dialog** | Centered, dedicated space |
| Mobile quick action | **Drawer** (bottom) | Touch-optimized, swipe-dismissible |
| Date picker (mobile) | **Drawer** (bottom) | Large touch targets |
| Settings panel | **Sheet** (left) | Persistent sidebar-like |

### Dialog — Centered Modal

```tsx
// src/components/ui/dialog.tsx
<DialogPrimitive.Content
  data-slot="dialog-content"
  className={cn(
    "bg-background fixed z-50 grid w-full gap-4 rounded-lg border p-6 shadow-lg",

    // Centered positioning
    "top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]",

    // Max width with mobile safety
    "max-w-lg max-md:max-w-[calc(100%-2rem)]",

    // Animation
    "data-[state=open]:animate-in data-[state=closed]:animate-out",
    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
    "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",

    "duration-200",
  )}
/>
```

### Sheet — Side Panel

```tsx
// src/components/ui/sheet.tsx
<SheetPrimitive.Content
  data-slot="sheet-content"
  className={cn(
    "bg-background fixed z-50 flex flex-col gap-4 shadow-lg",

    // Animation timing with custom easing
    "data-[state=open]:duration-[250ms] data-[state=open]:ease-[cubic-bezier(0.32,0.72,0,1)]",
    "data-[state=closed]:duration-200 data-[state=closed]:ease-out",

    // Right side (most common for Crispy)
    side === "right" && [
      "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
      "inset-y-0 right-0 h-full border-l",
      "w-full lg:w-[var(--sidepane-width)] lg:min-w-[var(--sidepane-width-min)]",
    ],
  )}
/>
```

### Drawer — Touch-Optimized (Vaul)

```tsx
// src/components/ui/drawer.tsx (uses Vaul, not Radix)
<DrawerPrimitive.Content
  data-slot="drawer-content"
  className={cn(
    "group/drawer-content bg-background fixed z-50 flex h-auto flex-col",

    // Bottom drawer
    "data-[vaul-drawer-direction=bottom]:inset-x-0",
    "data-[vaul-drawer-direction=bottom]:bottom-0",
    "data-[vaul-drawer-direction=bottom]:mt-24",
    "data-[vaul-drawer-direction=bottom]:max-h-[80vh]",
    "data-[vaul-drawer-direction=bottom]:rounded-t-lg",
  )}
>
  {/* Drag handle - only shows for bottom drawer */}
  <div className="bg-muted mx-auto mt-4 hidden h-2 w-[100px] rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
  {children}
</DrawerPrimitive.Content>
```

### Shared Animation Pattern

All overlay components use consistent timing:

```tsx
// Overlay fade
"data-[state=open]:animate-in data-[state=closed]:animate-out"
"data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"

// Duration
"duration-200"  // Fast animations for snappy UX

// Reduced motion support
"motion-reduce:transition-opacity motion-reduce:duration-100"
```

---

## Pattern J: Semantic Colors System

**When to use:** Always use semantic tokens. Never hardcode hex values.

| Correct | Wrong | Why |
|---------|-------|-----|
| `text-muted-foreground` | `text-gray-500` | Adapts to dark mode |
| `bg-primary` | `bg-green-600` | Theme-consistent |
| `text-destructive` | `text-red-500` | Semantic meaning |
| `border-border` | `border-gray-200` | Theme-aware borders |
| `h-11` (44px) | `h-8` (32px) | Touch target compliance |

### Background/Foreground Pairs

```tsx
// Always use matching pairs
"bg-primary text-primary-foreground"
"bg-destructive text-destructive-foreground"
"bg-card text-card-foreground"
"bg-muted text-muted-foreground"
```

### Domain-Specific Colors (MFB Theme)

```tsx
// Organization type badges use custom semantic tokens
"bg-tag-warm text-tag-warm-fg"      // Customer (warm terracotta)
"bg-tag-sage text-tag-sage-fg"      // Prospect (sage green)
"bg-tag-purple text-tag-purple-fg"  // Principal (deep purple)
"bg-tag-teal text-tag-teal-fg"      // Distributor (teal blue)
"bg-tag-gray text-tag-gray-fg"      // Unknown (neutral gray)
```

### Elevation System

```tsx
// CSS variables for consistent shadows
"shadow-[var(--elevation-1)]"  // Base elevation
"shadow-[var(--elevation-2)]"  // Hover/focused elevation
"shadow-[var(--badge-shadow)]" // Subtle badge depth
"shadow-[var(--btn-shadow-rest)]"   // Button rest state
"shadow-[var(--btn-shadow-hover)]"  // Button hover state
```

---

## Anti-Patterns

Avoid these common mistakes:

### 1. Hardcoded Colors

```tsx
// WRONG
className="text-red-500 bg-green-600 border-gray-200"

// CORRECT
className="text-destructive bg-primary border-border"
```

### 2. Missing ARIA Attributes

```tsx
// WRONG - No error indication for screen readers
<input className={error ? "border-red-500" : ""} />

// CORRECT - Uses aria-invalid for accessibility
<input aria-invalid={!!error} />
```

### 3. Touch Targets Below 44px

```tsx
// WRONG - 32px is too small
className="h-8 w-8"

// CORRECT - 44px minimum (preferred: direct sizing)
className="h-11 w-11"
```

### 4. Using `watch()` Instead of `useWatch()`

```tsx
// WRONG - Causes entire form to re-render
const values = form.watch()

// CORRECT - Isolated re-renders
const email = useWatch({ control: form.control, name: "email" })
```

### 5. Direct Radix Imports Without Wrapper

```tsx
// WRONG - Bypasses project conventions
import * as Dialog from "@radix-ui/react-dialog"

// CORRECT - Use project wrappers
import { Dialog, DialogContent } from "@/components/ui/dialog"
```

### 6. CVA Variants in Component File

```tsx
// WRONG - Breaks Fast Refresh (full page reload on change)
// button.tsx
const buttonVariants = cva(...)

// CORRECT - Extract to constants file
// button.constants.ts
export const buttonVariants = cva(...)

// button.tsx
import { buttonVariants } from "./button.constants"
```

---

## Migration Checklist

When adding a new UI component:

1. [ ] Choose base primitive (Radix, native HTML, or Vaul)
2. [ ] Create component file in `src/components/ui/`
3. [ ] Extract CVA variants to `.constants.ts` (if using variants)
4. [ ] Add `data-slot` attribute to all elements
5. [ ] Implement `asChild` with `Slot` if component should be polymorphic
6. [ ] Use semantic color classes only (no hex values)
7. [ ] Verify 44px touch targets (direct sizing or pseudo-element)
8. [ ] Add ARIA attributes for accessibility:
   - [ ] `aria-invalid` for validation states
   - [ ] `aria-describedby` linking to descriptions/errors
   - [ ] `aria-expanded` for expandable elements
   - [ ] `role` attributes where appropriate
   - [ ] `sr-only` labels for icon-only buttons
9. [ ] Test keyboard navigation (Tab, Enter, Escape, Arrow keys)
10. [ ] Add to component index export (`src/components/ui/index.ts`)
