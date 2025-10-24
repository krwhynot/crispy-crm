# UI Component Patterns Research

Comprehensive analysis of shadcn/ui component patterns and UI conventions used in the Atomic CRM codebase, focusing on Dialog/Modal, Form, Alert, Notification, and Button patterns.

## Relevant Files

### Core shadcn/ui Components
- `/home/krwhynot/projects/crispy-crm/src/components/ui/dialog.tsx`: Dialog primitive with controlled state management
- `/home/krwhynot/projects/crispy-crm/src/components/ui/alert.tsx`: Alert component with variant-based styling
- `/home/krwhynot/projects/crispy-crm/src/components/ui/button.tsx`: Button with variants and size options
- `/home/krwhynot/projects/crispy-crm/src/components/ui/progress.tsx`: Progress indicator for long-running operations
- `/home/krwhynot/projects/crispy-crm/src/components/ui/spinner.tsx`: Loading spinner with size variants
- `/home/krwhynot/projects/crispy-crm/src/components/ui/input.tsx`: Form input with validation states
- `/home/krwhynot/projects/crispy-crm/src/components/ui/label.tsx`: Label component for form fields
- `/home/krwhynot/projects/crispy-crm/src/components/ui/card.tsx`: Card container for content grouping
- `/home/krwhynot/projects/crispy-crm/src/components/ui/alert-dialog.tsx`: Confirmation dialog with actions

### React Admin Adapters
- `/home/krwhynot/projects/crispy-crm/src/components/admin/form.tsx`: Form components with React Hook Form integration
- `/home/krwhynot/projects/crispy-crm/src/components/admin/text-input.tsx`: Text input with React Admin integration
- `/home/krwhynot/projects/crispy-crm/src/components/admin/notification.tsx`: Notification system using Sonner
- `/home/krwhynot/projects/crispy-crm/src/components/admin/export-button.tsx`: Export functionality pattern
- `/home/krwhynot/projects/crispy-crm/src/components/admin/simple-form.tsx`: Form layout with toolbar

### Application Examples
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactImportDialog.tsx`: CSV import dialog implementation
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/tags/TagDialog.tsx`: Tag creation/edit dialog with validation
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactImportButton.tsx`: Button triggering modal
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/layout/TopToolbar.tsx`: Action button toolbar for lists
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/contacts/ContactList.tsx`: List with TopToolbar usage

### Validation
- `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/contacts.ts`: Zod schema-based validation patterns

## Dialog/Modal Pattern

### Component API (Radix UI based)

**Core Components:**
```tsx
import {
  Dialog,           // Root component (controlled via open/onOpenChange)
  DialogContent,    // Modal content with overlay
  DialogHeader,     // Header wrapper
  DialogTitle,      // Title text (required for accessibility)
  DialogDescription,// Optional description
  DialogFooter,     // Footer for actions
  DialogClose,      // Close trigger
} from "@/components/ui/dialog";
```

**Component Structure:**
- Built on `@radix-ui/react-dialog` primitives
- Includes automatic overlay with fade animations
- Built-in close button (X icon) in top-right
- Responsive max-width: `sm:max-w-lg` (can be overridden)
- Centered positioning with backdrop blur
- Data attributes: `data-slot="dialog"`, `data-state="open|closed"`

### Controlled vs Uncontrolled

**All dialogs in the codebase use CONTROLLED pattern:**

```tsx
// Pattern: State managed by parent component
const [open, setOpen] = useState(false);

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    {/* Content */}
  </DialogContent>
</Dialog>
```

**Why controlled?**
- Parent can close dialog after async operations (e.g., form submission)
- Can reset internal state when dialog closes
- Trigger can be separate from dialog (e.g., button outside dialog)

### Modal State Management Patterns

**Pattern 1: Simple Open/Close**
```tsx
// ContactImportButton.tsx
const [modalOpen, setModalOpen] = useState(false);

const handleOpenModal = () => setModalOpen(true);
const handleCloseModal = () => setModalOpen(false);

return (
  <>
    <Button onClick={handleOpenModal}>Import</Button>
    <ContactImportDialog open={modalOpen} onClose={handleCloseModal} />
  </>
);
```

**Pattern 2: Close with State Reset**
```tsx
// ContactImportDialog.tsx
const handleClose = () => {
  reset(); // Reset importer state
  onClose(); // Call parent close handler
};

<Dialog open={open} onOpenChange={handleClose}>
```

**Pattern 3: Form Submission with Close**
```tsx
// TagDialog.tsx
const handleSubmit = async (event: FormEvent) => {
  event.preventDefault();
  await onSubmit({ name: newTagName, color: newTagColor });

  setDisabled(true);
  setNewTagName("");
  setNewTagColor(colors[0]);
  setColorError(undefined);

  handleClose();
};
```

### Dialog Layout Examples

**Import Dialog (ContactImportDialog.tsx):**
```tsx
<Dialog open={open} onOpenChange={handleClose}>
  <DialogContent className="max-w-2xl">
    <Form className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>Import</DialogTitle>
      </DialogHeader>

      <div className="flex flex-col space-y-2">
        {/* State-based content rendering */}
        {importer.state === "running" && <Alert>...</Alert>}
        {importer.state === "error" && <Alert variant="destructive">...</Alert>}
        {importer.state === "complete" && <Alert>...</Alert>}
        {importer.state === "idle" && <FileInput />}
      </div>
    </Form>

    <div className="flex justify-start pt-6 gap-2">
      <Button disabled={!file}>Import</Button>
    </div>
  </DialogContent>
</Dialog>
```

**Form Dialog (TagDialog.tsx):**
```tsx
<Dialog open={open} onOpenChange={handleClose}>
  <DialogContent className="sm:max-w-lg">
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="tag-name">Tag name</Label>
          <Input id="tag-name" value={newTagName} onChange={handleChange} />
        </div>
        {colorError && <p className="text-sm text-destructive">{colorError}</p>}
      </div>

      <div className="flex justify-end pt-4">
        <Button disabled={disabled || !newTagName.trim()}>Save</Button>
      </div>
    </form>
  </DialogContent>
</Dialog>
```

### Key Patterns

1. **DialogHeader always contains DialogTitle** (accessibility requirement)
2. **Content is wrapped in semantic containers** (`<Form>`, `<form>`)
3. **Actions go in footer or separate flex container** (not DialogFooter component)
4. **State-based conditional rendering** for different dialog states
5. **Automatic close button** via DialogContent (no manual implementation needed)

## Form Patterns

### Form Validation with Zod

**Single Source of Truth Approach:**
- Zod schemas live in `/home/krwhynot/projects/crispy-crm/src/atomic-crm/validation/`
- Validation happens at API boundary (data provider level)
- Forms display errors returned from validation layer

**Schema Pattern:**
```tsx
// contacts.ts
export const contactSchema = z.object({
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  email: z.array(emailAndTypeSchema).default([]),
  phone: z.array(phoneNumberAndTypeSchema).default([]),
  // ... more fields
})
.transform(transformContactData)
.superRefine((data, ctx) => {
  // Custom validation logic
  if (!data.name && !data.first_name && !data.last_name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["name"],
      message: "Either name or first_name/last_name must be provided",
    });
  }
});
```

**Form Defaults from Schema:**
```tsx
// OpportunityCreate.tsx
// Per Constitution #5: FORM STATE DERIVED FROM TRUTH
const formDefaults = {
  ...opportunitySchema.partial().parse({}), // Extract defaults
  opportunity_owner_id: identity?.id,
  contact_ids: [], // Initialize empty array for array inputs
};

<Form defaultValues={formDefaults}>
```

### Error Display Patterns

**Field-Level Errors (React Admin Pattern):**
```tsx
// text-input.tsx
import { FormControl, FormError, FormField, FormLabel } from "@/components/admin/form";

<FormField id={id} name={field.name}>
  <FormLabel>
    <FieldTitle label={label} source={source} isRequired={isRequired} />
  </FormLabel>
  <FormControl>
    <Input {...field} value={value} />
  </FormControl>
  <FormError /> {/* Automatically displays field errors */}
</FormField>
```

**Custom Validation Error Display:**
```tsx
// TagDialog.tsx
const [colorError, setColorError] = useState<string | undefined>();

const handleSubmit = async (event: FormEvent) => {
  event.preventDefault();

  const validationError = validateTagColor(newTagColor);
  if (validationError) {
    setColorError(validationError);
    return;
  }

  await onSubmit({ name: newTagName, color: newTagColor });
};

// In render:
{colorError && <p className="text-sm text-destructive mt-1">{colorError}</p>}
```

**Form-Level Errors (Alert Pattern):**
```tsx
// ContactImportDialog.tsx
{importer.state === "error" && (
  <Alert variant="destructive">
    <AlertDescription>
      Failed to import this file, please make sure you provided a valid CSV file.
    </AlertDescription>
  </Alert>
)}
```

### Submit Button States

**Pattern 1: React Admin SaveButton (with form state tracking)**
```tsx
// form.tsx - SaveButton component
const SaveButton = (props) => {
  const { dirtyFields, isValidating, isSubmitting } = useFormState();
  const isDirty = Object.keys(dirtyFields).length > 0;

  const disabled = valueOrDefault(
    alwaysEnable ? !alwaysEnable : undefined,
    disabledProp || (!isDirty && !recordFromLocation) || isValidating || isSubmitting,
  );

  return (
    <Button variant={variant} type={type} disabled={disabled}>
      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : icon}
      {displayedLabel}
    </Button>
  );
};
```

**Pattern 2: Manual Disabled State**
```tsx
// TagDialog.tsx
const [disabled, setDisabled] = useState(false);

const handleSubmit = async (event) => {
  event.preventDefault();
  await onSubmit(data);
  setDisabled(true); // Prevent double submission
  handleClose();
};

<Button disabled={disabled || !newTagName.trim()}>Save</Button>
```

**Pattern 3: Derived from Form State**
```tsx
// ContactImportDialog.tsx
{importer.state === "idle" ? (
  <Button onClick={startImport} disabled={!file}>Import</Button>
) : (
  <Button variant="outline" onClick={handleClose} disabled={importer.state === "running"}>
    Close
  </Button>
)}
```

### Form Layout Patterns

**React Admin Form with Toolbar:**
```tsx
// OpportunityCreate.tsx
<Form defaultValues={formDefaults}>
  <Card>
    <CardContent>
      <OpportunityInputs mode="create" />
      <FormToolbar>
        <div className="flex flex-row gap-2 justify-end">
          <CancelButton />
          <SaveButton label="Create Opportunity" />
        </div>
      </FormToolbar>
    </CardContent>
  </Card>
</Form>
```

**Simple Form Pattern:**
```tsx
// TagDialog.tsx
<form onSubmit={handleSubmit}>
  <DialogHeader>
    <DialogTitle>{title}</DialogTitle>
  </DialogHeader>

  <div className="space-y-4 py-4">
    {/* Form fields */}
  </div>

  <div className="flex justify-end pt-4">
    <Button type="submit">Save</Button>
  </div>
</form>
```

## Alert and Notification Patterns

### Alert Component

**Component API:**
```tsx
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// Variants: "default" | "destructive"
<Alert variant="default">
  <AlertIcon /> {/* Optional icon */}
  <AlertTitle>Title</AlertTitle>
  <AlertDescription>Description</AlertDescription>
</Alert>
```

**Styling via CVA (class-variance-authority):**
```tsx
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid...",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive: "text-destructive bg-card [&>svg]:text-current",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
```

**Usage Patterns:**

1. **Informational (default variant):**
```tsx
// ContactImportDialog.tsx
<Alert>
  <AlertDescription className="flex flex-col gap-4">
    Here is a sample CSV file you can use as a template
    <Button asChild variant="outline" size="sm">
      <Link to={SAMPLE_URL} download="sample.csv">
        Download CSV sample
      </Link>
    </Button>
  </AlertDescription>
</Alert>
```

2. **Error (destructive variant):**
```tsx
{importer.state === "error" && (
  <Alert variant="destructive">
    <AlertDescription>
      Failed to import this file, please make sure you provided a valid CSV file.
    </AlertDescription>
  </Alert>
)}
```

3. **Loading with Icon:**
```tsx
<Alert>
  <AlertDescription className="flex flex-row gap-4">
    <Loader2 className="h-5 w-5 animate-spin" />
    The import is running, please do not close this tab.
  </AlertDescription>
</Alert>
```

4. **Success/Completion:**
```tsx
{importer.state === "complete" && (
  <Alert>
    <AlertDescription>
      Contacts import complete. Imported {importer.importCount} contacts,
      with {importer.errorCount} errors
    </AlertDescription>
  </Alert>
)}
```

### useNotify Hook (React Admin)

**Hook API:**
```tsx
import { useNotify } from "ra-core";

const notify = useNotify();

// Basic notification
notify("Task deleted successfully", { undoable: true });

// Error notification
notify("HTTP Error", { type: "error" });

// Success notification
notify("Opportunity created successfully");
```

**Notification Types:**
- `info` (default)
- `success`
- `warning`
- `error`

**Notification System (Sonner-based):**
```tsx
// notification.tsx
export const Notification = (props: ToasterProps) => {
  const { notifications } = useNotificationContext();

  useEffect(() => {
    if (notifications.length) {
      const { message, type = "info", notificationOptions } = notification;
      const { messageArgs, undoable } = notificationOptions || {};

      toast[type](finalMessage, {
        action: undoable ? {
          label: translate("ra.action.undo"),
          onClick: handleUndo,
        } : undefined,
      });
    }
  }, [notifications]);

  return <Toaster richColors theme={theme} closeButton position="bottom-center" />;
};
```

**Usage Examples:**
```tsx
// OpportunityCreate.tsx
const onSuccess = async (opportunity: Opportunity) => {
  // ... index management logic
  notify("Opportunity created successfully");
  redirect(`/opportunities/${opportunity.id}/show`);
};

// Task.tsx
const { handleDelete } = useDeleteWithUndoController({
  record: task,
  redirect: false,
  mutationOptions: {
    onSuccess() {
      notify("Task deleted successfully", { undoable: true });
    },
  },
});
```

### Progress Indicators

**Progress Component:**
```tsx
import { Progress } from "@/components/ui/progress";

<Progress value={percentage} />
```

**Spinner Component:**
```tsx
import { Spinner } from "@/components/ui/spinner";

// Sizes: "small" | "medium" | "large"
<Spinner size="medium" show={isLoading}>
  Loading...
</Spinner>
```

**Loading States in Buttons:**
```tsx
// SaveButton from form.tsx
{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : icon}
```

**Inline Loading Text:**
```tsx
// ContactImportDialog.tsx
<div className="text-sm">
  Imported <strong>{importer.importCount} / {importer.rowCount}</strong> contacts,
  with <strong>{importer.errorCount}</strong> errors.
  {importer.remainingTime !== null && (
    <>
      Estimated remaining time: <strong>{millisecondsToTime(importer.remainingTime)}</strong>
    </>
  )}
</div>
```

### Error Message Formatting

**Validation Error Format:**
```tsx
// From validation/contacts.ts
export async function validateContactForm(data: any): Promise<void> {
  try {
    contactSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        formattedErrors[path] = err.message;
      });

      throw {
        message: "Validation failed",
        errors: formattedErrors,
      };
    }
    throw error;
  }
}
```

**Display Pattern:**
```tsx
// FormError component from form.tsx
const FormError = ({ className, ...props }) => {
  const { invalid, error, formMessageId } = useFormField();
  const err = error?.root?.message ?? error?.message;

  if (!invalid || !err) return null;

  return (
    <p id={formMessageId} className={cn("text-destructive text-sm", className)}>
      <ValidationError error={err} />
    </p>
  );
};
```

## Button and Action Patterns

### Button Component API

**Variants:**
```tsx
import { Button } from "@/components/ui/button";

// variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
// size: "default" | "sm" | "lg" | "icon"

<Button variant="outline" size="sm">Click Me</Button>
```

**Variant Styling (from button.tsx):**
```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md...",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive: "bg-destructive text-white shadow-xs hover:bg-destructive/90",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
  }
);
```

### Icon + Text Button Composition

**Pattern 1: Icon Before Text**
```tsx
import { Upload } from "lucide-react";

<Button variant="outline" onClick={handleClick}>
  <Upload /> Import
</Button>
```

**Pattern 2: Icon with Loading State**
```tsx
import { Loader2, Save } from "lucide-react";

<Button disabled={isSubmitting}>
  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save />}
  Save
</Button>
```

**Pattern 3: Icon Only (icon size variant)**
```tsx
import { MoreVertical } from "lucide-react";

<Button variant="ghost" size="icon">
  <MoreVertical className="h-4 w-4" />
</Button>
```

**Automatic Icon Styling:**
- Icons are automatically sized via `[&_svg:not([class*='size-'])]:size-4`
- Gaps handled by button: `gap-2` (default), `gap-1.5` (sm)
- No need to manually add margins or spacing

### Disabled States During Async Operations

**Pattern 1: Form Submission**
```tsx
// SaveButton
const { isValidating, isSubmitting } = useFormState();
const disabled = disabledProp || isValidating || isSubmitting;

<Button disabled={disabled}>
  {isSubmitting ? <Loader2 className="animate-spin" /> : icon}
  {label}
</Button>
```

**Pattern 2: Manual Loading State**
```tsx
const [isLoading, setIsLoading] = useState(false);

const handleAction = async () => {
  setIsLoading(true);
  try {
    await performAction();
  } finally {
    setIsLoading(false);
  }
};

<Button disabled={isLoading} onClick={handleAction}>
  {isLoading && <Loader2 className="animate-spin" />}
  Action
</Button>
```

**Pattern 3: Derived State**
```tsx
// ExportButton
<Button
  variant="outline"
  onClick={handleClick}
  disabled={total === 0}
  className="cursor-pointer"
>
  <Download />
  Export
</Button>
```

**Pattern 4: React Admin Update Hook**
```tsx
// Task.tsx
const [update, { isPending: isUpdatePending }] = useUpdate();

<Checkbox
  checked={!!task.completed_at}
  onCheckedChange={handleCheck}
  disabled={isUpdatePending}
/>
```

### TopToolbar Component for List Actions

**Component Pattern:**
```tsx
// TopToolbar.tsx
export const TopToolbar = ({ className, children, ...props }) => (
  <div
    className={cn(
      "flex flex-auto justify-end items-end gap-2 whitespace-nowrap",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);
```

**Usage in List Views:**
```tsx
// ContactList.tsx
const ContactListActions = () => (
  <TopToolbar>
    <SortButton fields={["first_name", "last_name", "last_seen"]} />
    <ContactImportButton />
    <ExportButton exporter={exporter} />
    <CreateButton />
  </TopToolbar>
);

<List actions={<ContactListActions />}>
  {/* List content */}
</List>
```

**Characteristics:**
- Right-aligned flex container
- Consistent 2-unit gap between buttons
- Prevents text wrapping
- Buttons typically use `variant="outline"` for secondary actions
- Primary action (CreateButton) uses default variant

### Button Composition Patterns

**Link as Button (using asChild):**
```tsx
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

<Button asChild variant="outline" size="sm">
  <Link to={SAMPLE_URL} download="sample.csv">
    Download CSV sample
  </Link>
</Button>
```

**Dropdown Menu Trigger:**
```tsx
import { DropdownMenu, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon">
      <MoreVertical className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
    <DropdownMenuItem onClick={handleDelete}>Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Form Submit Button:**
```tsx
// Inside <form> element
<Button type="submit" disabled={!isValid}>
  Submit
</Button>

// Button that triggers form submission manually
<Button type="button" onClick={form.handleSubmit(onSubmit)}>
  Submit
</Button>
```

## Styling Conventions

### Semantic Colors Only

**CSS Variables (from CLAUDE.md):**
```css
/* Primary actions */
var(--primary)
var(--primary-foreground)

/* Brand colors */
var(--brand-500)
var(--accent-clay-600)

/* Destructive actions */
var(--destructive)

/* Text */
var(--text-subtle)
var(--text-title)

/* Background */
var(--background)
var(--card)
var(--popover)

/* Borders */
var(--border)
var(--stroke-card)
```

**Never Use:**
- Hex codes directly in components
- Direct OKLCH values
- Hard-coded color names

**Validation:**
```bash
npm run validate:colors  # Check for violations
```

### Spacing and Layout

**Common Gap Patterns:**
```tsx
// Form fields
<div className="space-y-4">  {/* 4 units vertical */}
<div className="space-y-2">  {/* 2 units vertical */}

// Button groups
<div className="flex gap-2">  {/* 2 units horizontal */}
<div className="flex gap-4">  {/* 4 units horizontal */}

// Padding
<div className="px-6">        {/* Card content padding */}
<div className="py-4">        {/* Vertical padding */}
<div className="pt-6">        {/* Top padding */}
```

**Responsive Breakpoints:**
```tsx
// Mobile first approach
<div className="flex flex-col sm:flex-row">
<div className="max-w-full sm:max-w-lg">
<div className="text-center sm:text-left">
```

### Data Attributes for Slots

**Pattern from shadcn/ui:**
```tsx
// All UI components use data-slot attributes
<div data-slot="dialog" />
<div data-slot="dialog-header" />
<div data-slot="form-item" />
<div data-slot="button" />

// Allows targeted styling in parent components
// Example: .border-t]:pt-6 in CardFooter
```

### Utility Class Patterns

**State-based Styling:**
```tsx
// Disabled state
className={cn(
  disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
  className
)}

// Invalid/error state
"aria-invalid:ring-destructive/20 aria-invalid:border-destructive"

// Focus state
"focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
```

**Conditional Classes with cn():**
```tsx
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  condition && "conditional-classes",
  variant === "destructive" && "destructive-classes",
  className  // Always allow override via props
)} />
```

## Component APIs Summary

### Dialog
- **Controlled:** Always use `open` and `onOpenChange` props
- **Max Width:** Default `sm:max-w-lg`, override via className
- **Close:** Automatic X button, or programmatic via `onOpenChange`
- **Accessibility:** Always include `DialogTitle`

### Alert
- **Variants:** `default`, `destructive`
- **Structure:** Alert > (Icon) + AlertTitle + AlertDescription
- **Usage:** Inline feedback, not dismissible by default

### Button
- **Variants:** `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- **Sizes:** `default`, `sm`, `lg`, `icon`
- **Icons:** Automatic sizing, use Lucide icons
- **Loading:** Replace icon with `<Loader2 className="animate-spin" />`

### Form Components
- **FormField:** Container with name and id
- **FormLabel:** Label with automatic error styling
- **FormControl:** Wrapper for input elements
- **FormError:** Automatic error display from react-hook-form
- **SaveButton:** Integrated with form state (dirty, validating, submitting)

### Notifications
- **useNotify:** Hook for toast notifications
- **Types:** `info`, `success`, `warning`, `error`
- **Undoable:** Support for undo actions
- **Position:** Bottom-center by default

## Gotchas and Edge Cases

### Dialog Edge Cases

1. **Form Reset on Close:**
   - Always reset form state in `onOpenChange` handler
   - Use `useEffect` to sync prop changes to local state
   ```tsx
   useEffect(() => {
     setNewTagName(tag?.name ?? "");
     setNewTagColor(tag?.color ?? colors[0]);
   }, [tag]);
   ```

2. **Nested Forms:**
   - DialogContent is inside a Portal (separate DOM tree)
   - Form submission must be handled within dialog
   - Cannot use form submit from outside dialog

3. **Async Close Prevention:**
   - Disable close button during async operations
   ```tsx
   <Button onClick={handleClose} disabled={importer.state === "running"}>
     Close
   </Button>
   ```

### Form Edge Cases

1. **Default Values with Arrays:**
   - Empty arrays must be explicitly initialized
   ```tsx
   const formDefaults = {
     ...schema.partial().parse({}),
     contact_ids: [], // Required for ReferenceArrayInput
   };
   ```

2. **Partial Schema for Defaults:**
   - Use `.partial()` to extract only fields with `.default()`
   - Required fields without defaults remain undefined
   ```tsx
   opportunitySchema.partial().parse({})  // Extracts defaults only
   ```

3. **Validation Error Path:**
   - React Admin expects dot notation: `"email.0.email"`
   - Zod provides array paths: `["email", 0, "email"]`
   - Must convert: `err.path.join(".")`

4. **Submit Type Matters:**
   - `type="submit"` triggers form onSubmit
   - `type="button"` requires manual `form.handleSubmit(onSubmit)`
   - SaveButton defaults to `type="submit"`

### Button Edge Cases

1. **asChild Pattern:**
   - Uses Radix Slot to render child as button
   - Child must accept className, onClick, disabled props
   - Common with Link components

2. **Icon Sizing:**
   - Default: `size-4` (16px)
   - Override: `className="h-5 w-5"` on icon, not button
   - Button padding adjusts via `has-[>svg]:px-3`

3. **Disabled + Loading:**
   - Always disable during loading states
   - Show spinner to indicate progress
   - Prevent double submissions

### Alert Edge Cases

1. **Grid Layout with Icon:**
   - Uses CSS grid with conditional columns
   - `has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr]`
   - Icon must be first child

2. **Variant Text Color:**
   - Destructive variant affects all text: `*:data-[slot=alert-description]:text-destructive/90`
   - Use semantic colors for consistency

### State Management Edge Cases

1. **Importer State Machine:**
   - States: `idle`, `running`, `error`, `complete`
   - Cannot transition from `running` to `idle` directly
   - Must reset entire state object

2. **React Admin Query Invalidation:**
   - Manual updates require `queryClient.invalidateQueries`
   - Optimistic updates need cache modification
   - See Task.tsx for example

3. **Form Dirty State:**
   - `useFormState().dirtyFields` more reliable than `isDirty`
   - Check `Object.keys(dirtyFields).length > 0`
   - SaveButton disabled when not dirty (unless `alwaysEnable`)

## Best Practices

1. **Dialog Management:**
   - Use controlled dialogs with parent state
   - Reset internal state on close
   - Disable close during async operations

2. **Form Validation:**
   - Define Zod schemas in `/validation/` folder
   - Validate at API boundary only
   - Use `.partial()` for extracting defaults
   - Initialize arrays explicitly in defaultValues

3. **Error Display:**
   - Field-level: Use FormError component
   - Form-level: Use Alert component
   - Notifications: Use useNotify for transient feedback

4. **Button States:**
   - Always disable during loading
   - Show loading spinner when appropriate
   - Use semantic variants (outline for secondary actions)

5. **Styling:**
   - Use semantic CSS variables only
   - Apply `cn()` for conditional classes
   - Allow className override in all components
   - Follow mobile-first responsive design

6. **Accessibility:**
   - Always include DialogTitle in dialogs
   - Use proper button types (submit vs button)
   - Provide aria-labels for icon buttons
   - Ensure proper form label associations

## Relevant Documentation

- [Radix UI Dialog Docs](https://www.radix-ui.com/docs/primitives/components/dialog)
- [Radix UI Alert Dialog Docs](https://www.radix-ui.com/docs/primitives/components/alert-dialog)
- [React Hook Form API](https://react-hook-form.com/docs)
- [Zod Documentation](https://zod.dev/)
- [Class Variance Authority](https://cva.style/docs)
- [Sonner Toast Library](https://sonner.emilkowal.ski/)
- [Lucide Icons](https://lucide.dev/)
