# Component Tier Architecture

This document defines when direct shadcn/ui component usage is acceptable versus when React Admin wrappers are required. Following these guidelines ensures consistent behavior, accessibility, and maintainability across Crispy CRM.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            THREE-TIER COMPONENT ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  TIER 1: Base (shadcn/ui)                                                       │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Direct Radix primitives + Tailwind styling                                     │
│  Location: src/components/ui/                                                   │
│  Examples: Button, Input, Select, Dialog, Sheet                                 │
│                                                                                 │
│           ↑                                                                     │
│           │ (compose)                                                           │
│           │                                                                     │
│  TIER 2: Admin Wrappers                                                         │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  React Admin integration + Form context + Validation                            │
│  Location: src/components/admin/                                                │
│  Examples: SubmitButtonGroup, FormSelectInput, TextInput                        │
│                                                                                 │
│           ↑                                                                     │
│           │ (consume)                                                           │
│           │                                                                     │
│  TIER 3: Feature Components                                                     │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Business logic + Domain-specific behavior                                      │
│  Location: src/atomic-crm/{feature}/                                            │
│  Examples: ContactList, OpportunityEdit, QuickAddForm                           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Decision Tree

Use this flowchart to determine which tier is appropriate:

```
                         ┌─────────────────────┐
                         │  Is this component  │
                         │  inside a form?     │
                         └─────────┬───────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                   YES                           NO
                    │                             │
                    ▼                             ▼
          ┌─────────────────┐           ┌─────────────────┐
          │ Does it need    │           │ Is it a simple  │
          │ validation or   │           │ state toggle or │
          │ error display?  │           │ standalone      │
          └────────┬────────┘           │ action?         │
                   │                    └────────┬────────┘
        ┌──────────┴──────────┐                  │
        │                     │           ┌──────┴──────┐
       YES                   NO           │             │
        │                     │          YES           NO
        ▼                     ▼           │             │
  ┌───────────┐        ┌───────────┐      ▼             ▼
  │  TIER 2   │        │  TIER 1   │ ┌───────────┐ ┌───────────┐
  │  Wrapper  │        │  Direct   │ │  TIER 1   │ │  Evaluate │
  │  Required │        │  Allowed  │ │  Direct   │ │  Context  │
  └───────────┘        └───────────┘ │  Allowed  │ └───────────┘
                                     └───────────┘

  Key Questions:
  1. Form submit/cancel buttons → Use SubmitButtonGroup (Tier 2)
  2. Select with validation → Use FormSelectInput (Tier 2)
  3. Dialog trigger button → Direct Button allowed (Tier 1)
  4. Filter toggle button → Direct Button with aria-pressed (Tier 1)
```

---

## Tier 1: Acceptable Direct Usage

Direct shadcn/ui usage is acceptable when the component operates **outside React Admin's form lifecycle** and doesn't require centralized validation, error display, or form context.

### Pattern 1: Dialog/Popover Triggers

**When to use:** Buttons that open dialogs, sheets, or popovers for navigation or modal content.

**Rationale:** Trigger buttons don't participate in form validation — they simply toggle UI state. The dialog/sheet content may contain forms, but the trigger itself is a standalone action.

```tsx
// src/atomic-crm/activities/QuickLogActivityDialog.tsx
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

// ✅ CORRECT: Trigger is standalone, doesn't need form context
<Sheet open={open} onOpenChange={onOpenChange}>
  <SheetTrigger asChild>
    <Button variant="outline" className="h-11">
      <Plus className="mr-2 h-4 w-4" />
      Log Activity
    </Button>
  </SheetTrigger>
  <SheetContent>
    {/* Form content inside uses Tier 2 components */}
  </SheetContent>
</Sheet>
```

**Key Points:**
- `asChild` pattern merges trigger behavior with Button styling
- Touch target maintained via `h-11` (44px)
- No validation state needed — action is binary (open/close)

---

### Pattern 2: Filter Toggle Buttons

**When to use:** Buttons that toggle filter state on/off, with `aria-pressed` for accessibility.

**Rationale:** Filter toggles use view-level state (URL params via `useListContext`) rather than form state. They need `aria-pressed` semantics, not `aria-invalid`.

```tsx
// src/atomic-crm/filters/StarredFilterToggle.tsx
import { Button } from "@/components/ui/button";
import { useListContext } from "react-admin";
import { cn } from "@/lib/utils";

// ✅ CORRECT: Toggle operates on URL filter state, not form
export function StarredFilterToggle() {
  const { filterValues, setFilters } = useListContext();
  const isActive = filterValues.favorited === true;

  const handleClick = () => {
    setFilters(
      isActive
        ? { ...filterValues, favorited: undefined }
        : { ...filterValues, favorited: true }
    );
  };

  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={handleClick}
      aria-pressed={isActive}  // Accessibility: announces toggle state
      className={cn(
        "h-11 w-full justify-start gap-2 px-3",
        isActive && "bg-primary text-primary-foreground"
      )}
    >
      <Star className={cn("h-4 w-4", isActive && "fill-current")} />
      Starred Only
    </Button>
  );
}
```

**Key Points:**
- `aria-pressed` communicates toggle state to screen readers
- Uses `useListContext` for filter state (not form state)
- Visual feedback via variant and className, not validation colors
- Per Engineering Constitution: touch target via `h-11`

---

### Pattern 3: Quick-Create Popover Inputs

**When to use:** Isolated mini-forms within popovers that create entities inline, separate from the main form lifecycle.

**Rationale:** These operate in a bubble — they have their own local state, submit independently, and clear on completion. They don't participate in the parent form's validation flow.

```tsx
// src/atomic-crm/opportunities/QuickAddForm.tsx (InlineCreateOrganization)
import { Popover, PopoverContent, PopoverAnchor } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ✅ CORRECT: Self-contained popover with local state
function InlineCreateOrganization({ name, onCreated, onCancel }) {
  const [isPending, setIsPending] = useState(false);
  const [inputName, setInputName] = useState(name);
  const dataProvider = useDataProvider();
  const notify = useNotify();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName.trim()) {
      notify("Organization name is required", { type: "error" });
      return;
    }
    setIsPending(true);
    try {
      const result = await dataProvider.create("organizations", {
        data: { name: inputName.trim(), organization_type: "customer" },
      });
      onCreated(result.data);
    } catch {
      notify("Failed to create organization", { type: "error" });
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Popover open={true} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <PopoverAnchor />
      <PopoverContent className="w-72 p-3" align="start">
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="font-medium text-sm">Create Organization</p>
          <div className="space-y-1">
            <Label htmlFor="inline-org-name">Name</Label>
            <Input
              id="inline-org-name"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="h-9"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onCancel} className="h-9">
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending} className="h-9">
              Create
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
```

**Key Points:**
- Local `useState` for form state — not connected to parent form
- `notify()` for error feedback instead of form-level error display
- Independent submit handler calls `dataProvider` directly
- Popover manages its own lifecycle

---

### Pattern 4: Report/Filter Selects

**When to use:** Select components that control view-level filtering, sorting, or display options — not bound to form submission.

**Rationale:** These selects update URL query params or local UI state. They fire callbacks immediately on change and don't require validation, error messages, or form submission.

```tsx
// src/atomic-crm/opportunities/QuickAddForm.tsx (Principal Select)
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// ✅ CORRECT: View-level select with immediate callback
function PrincipalSelector({ value, onChange, options, isLoading, error }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="principal_id">
        Principal
        <span className="text-destructive" aria-hidden="true"> *</span>
      </Label>
      <Select
        value={value?.toString()}
        onValueChange={(value) => onChange(Number(value))}
        disabled={isLoading}
      >
        <SelectTrigger
          id="principal_id"
          className="bg-background"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "principal_id-error" : undefined}
          aria-required="true"
        >
          <SelectValue placeholder={isLoading ? "Loading..." : "Select principal"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p id="principal_id-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
```

**Key Points:**
- Manual ARIA attributes (`aria-invalid`, `aria-describedby`) required
- Manual error message rendering with `role="alert"`
- `onValueChange` fires immediately — no form submission needed
- Error state comes from parent form context via props

---

### Pattern 5: Standalone Action Buttons

**When to use:** Buttons that trigger actions outside form submission — export, navigation, refresh, etc.

**Rationale:** These buttons don't participate in form validation. They perform their action immediately on click.

```tsx
// ✅ CORRECT: Export button - standalone action
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

function ExportButton({ onExport, disabled }) {
  return (
    <Button
      variant="outline"
      onClick={onExport}
      disabled={disabled}
      className="h-11 gap-2"
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
```

```tsx
// ✅ CORRECT: Refresh button in toolbar
<Button
  variant="ghost"
  size="icon"
  onClick={handleRefresh}
  aria-label="Refresh data"
  className="h-11 w-11"
>
  <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
</Button>
```

**Key Points:**
- `type="button"` implicit (not in a form) or explicit (inside form to prevent submission)
- Touch target maintained via sizing classes
- `aria-label` for icon-only buttons
- No validation state needed

---

## Tier 2: Required Wrappers

Tier 2 wrappers are **required** when components participate in React Admin's form lifecycle, need centralized validation, or must display standardized error states.

### SubmitButtonGroup

**When to use:** Form submit/cancel button combinations in Create, Edit, and modal forms.

**Why required:**
- Standardizes loading state with Loader2 spinner
- Ensures consistent button ordering (Cancel → [Save & New] → Save)
- Maintains 44px touch targets across all form buttons
- Prevents duplicate save-button implementations

```tsx
// src/components/admin/form/SubmitButtonGroup.tsx
export interface SubmitButtonGroupProps {
  isSubmitting: boolean;       // Loading state from form
  onCancel: () => void;        // Close form/dialog
  showSaveAndNew?: boolean;    // Show continuous entry button
  onSaveAndNew?: () => void;   // Reset form after save
  labels?: { cancel?: string; save?: string; saveAndNew?: string };
  compact?: boolean;           // Smaller padding for popovers
}

// Usage in feature components:
import { SubmitButtonGroup } from "@/components/admin/form/SubmitButtonGroup";

function ContactCreate() {
  const { formState: { isSubmitting } } = useFormContext();

  return (
    <Form>
      {/* Form fields... */}
      <SubmitButtonGroup
        isSubmitting={isSubmitting}
        onCancel={() => navigate(-1)}
        showSaveAndNew
        onSaveAndNew={() => { reset(); focusFirstField(); }}
      />
    </Form>
  );
}
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `isSubmitting` | `boolean` | Shows spinner, disables all buttons |
| `onCancel` | `() => void` | Cancel button handler |
| `showSaveAndNew` | `boolean` | Show "Save & Add Another" button |
| `onSaveAndNew` | `() => void` | Handler for continuous entry |
| `labels` | `object` | Custom button labels |
| `compact` | `boolean` | Reduced padding (still 44px height) |

---

### FormSelectInput (Future Wrapper)

**When to use:** Select inputs that are part of form submission and need validation integration.

**Why required:**
- Auto-connects to `useFormField()` context for ARIA IDs
- Displays validation errors with `role="alert"`
- Handles `aria-invalid` state automatically
- Consistent styling with other form inputs

```tsx
// Future implementation: src/components/admin/form/FormSelectInput.tsx
// This wrapper would provide:
// 1. Integration with react-hook-form via Controller
// 2. Auto-generated ARIA IDs from FormItem context
// 3. Automatic error display below select
// 4. Consistent 44px trigger height

// Current pattern (manual ARIA - see Pattern 4 above):
<Select ...>
  <SelectTrigger
    aria-invalid={error ? "true" : undefined}
    aria-describedby={error ? "field-error" : undefined}
  >
    ...
  </SelectTrigger>
</Select>
{error && <p id="field-error" role="alert">...</p>}

// Future Tier 2 wrapper (automatic ARIA):
<FormSelectInput
  name="principal_id"
  label="Principal"
  options={principalOptions}
  required
/>
```

**Note:** Until FormSelectInput wrapper exists, use direct Select with manual ARIA attributes as shown in Pattern 4.

---

## Migration Guide

When auditing existing components, use this checklist:

### Step 1: Identify the Context

- [ ] Is this component inside a `<Form>` or `<form>` element?
- [ ] Does it need to display validation errors?
- [ ] Is it part of a submit/cancel button group?
- [ ] Does it trigger immediate actions (export, filter, navigate)?

### Step 2: Check for Tier Violations

| Scenario | Current Code | Correct Tier | Action |
|----------|--------------|--------------|--------|
| Save button in form | Direct `<Button type="submit">` | Tier 2 | Replace with `<SubmitButtonGroup>` |
| Select with validation | Direct Select + manual ARIA | Tier 1 (acceptable) | Document manual ARIA pattern |
| Dialog trigger | Direct `<Button>` | Tier 1 | Keep as-is |
| Filter toggle | Direct `<Button aria-pressed>` | Tier 1 | Keep as-is |
| Icon-only action | Direct `<Button>` without `aria-label` | Tier 1 | Add `aria-label` |

### Step 3: Validate Accessibility

Every Tier 1 direct usage must have:

- [ ] **Touch target:** `h-11` (44px) or `size-11` (44x44px)
- [ ] **ARIA state:** `aria-pressed` for toggles, `aria-expanded` for dropdowns
- [ ] **ARIA label:** `aria-label` for icon-only buttons
- [ ] **Keyboard support:** `Enter` or `Space` triggers action

### Step 4: Document Exceptions

If a component must use Tier 1 despite being in a form context, add a code comment:

```tsx
// TIER-1-EXCEPTION: This button triggers a preview action,
// not form submission. No validation state needed.
<Button type="button" onClick={handlePreview}>
  Preview
</Button>
```

---

## Anti-Patterns

### 1. Custom Save Button in Forms

```tsx
// ❌ WRONG: Reimplements loading state, inconsistent styling
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? "Saving..." : "Save"}
</Button>

// ✅ CORRECT: Use standardized wrapper
<SubmitButtonGroup
  isSubmitting={isSubmitting}
  onCancel={handleCancel}
/>
```

### 2. Missing ARIA on Tier 1 Selects

```tsx
// ❌ WRONG: No accessibility for validation state
<Select value={value} onValueChange={onChange}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  ...
</Select>
{error && <p className="text-destructive">{error}</p>}

// ✅ CORRECT: Manual ARIA attributes
<Select value={value} onValueChange={onChange}>
  <SelectTrigger
    aria-invalid={error ? "true" : undefined}
    aria-describedby={error ? "field-error" : undefined}
  >
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  ...
</Select>
{error && (
  <p id="field-error" role="alert" className="text-sm text-destructive">
    {error}
  </p>
)}
```

### 3. Toggle Button Without aria-pressed

```tsx
// ❌ WRONG: Visual-only toggle state
<Button
  variant={isActive ? "default" : "outline"}
  onClick={handleToggle}
>
  Show Favorites
</Button>

// ✅ CORRECT: Accessible toggle
<Button
  variant={isActive ? "default" : "outline"}
  onClick={handleToggle}
  aria-pressed={isActive}
>
  Show Favorites
</Button>
```

### 4. Undersized Touch Targets

```tsx
// ❌ WRONG: 32px is too small for touch
<Button className="h-8 w-8" size="icon" onClick={handleAction}>
  <X />
</Button>

// ✅ CORRECT: 44px minimum
<Button className="h-11 w-11" size="icon" onClick={handleAction}>
  <X />
</Button>
```

---

## Related Documentation

- [Engineering Constitution](../../CLAUDE.md) — Core principles including fail-fast, Zod validation, form patterns
- [UI Components](../../src/components/ui/PATTERNS.md) — shadcn/ui patterns, accessibility, semantic colors
- [MODULE_CHECKLIST.md](../../.claude/rules/MODULE_CHECKLIST.md) — Feature module standardization
- [Accessibility Design](../design/ACCESSIBILITY.md) — ARIA patterns, touch targets, screen reader support
