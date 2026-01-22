# Component Tier Architecture

> **Status**: Active | **Related**: [Presentation Layer](./01-presentation-layer.md), [MODULE_CHECKLIST.md](../../.claude/rules/MODULE_CHECKLIST.md)

## Overview

Crispy CRM implements a **Three-Tier Component Architecture** that balances flexibility with consistency. This document defines when direct shadcn/ui component usage is acceptable versus when React Admin wrappers are required.

### The Three Tiers

| Tier | Location | Purpose | Form Context |
|------|----------|---------|--------------|
| **Tier 1** | `src/components/ui/` | Pure UI primitives (shadcn/ui + Radix) | None |
| **Tier 2** | `src/components/admin/` | React Admin wrappers with form integration | Required |
| **Tier 3** | `src/atomic-crm/[feature]/` | Feature-specific business logic + composition | Varies |

### Why This Matters

The tier system enforces the **Engineering Constitution's Single Source of Truth** principle:

- **Tier 2 components** automatically integrate with React Admin's form context, validation display, and error handling
- **Tier 1 components** bypass these integrations - acceptable only when form context is genuinely unnecessary
- Mixing tiers incorrectly leads to: silent validation failures, broken accessibility, inconsistent error display

---

## Decision Tree

Use this flowchart to determine which tier to use:

```
┌─────────────────────────────────────────────────────────────────┐
│                    "Which tier should I use?"                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │ Is this component     │
                    │ inside a React Admin  │
                    │ form (<SimpleForm>,   │
                    │ <Edit>, <Create>)?    │
                    └───────────────────────┘
                         │            │
                        YES          NO
                         │            │
                         ▼            ▼
            ┌─────────────────┐  ┌─────────────────────────────┐
            │ Does it SUBMIT  │  │ Tier 1 is acceptable        │
            │ or VALIDATE     │  │ (Dialog triggers, popovers, │
            │ form data?      │  │  standalone actions)        │
            └─────────────────┘  └─────────────────────────────┘
                 │        │
                YES       NO
                 │        │
                 ▼        ▼
        ┌────────────┐  ┌──────────────────────────────────┐
        │ USE TIER 2 │  │ Is the control part of React     │
        │ (Required) │  │ Admin's data lifecycle?          │
        │            │  │ (ReferenceInput, validation, etc)│
        └────────────┘  └──────────────────────────────────┘
                              │            │
                             YES          NO
                              │            │
                              ▼            ▼
                    ┌────────────┐  ┌─────────────────────┐
                    │ USE TIER 2 │  │ Tier 1 is acceptable│
                    │ (Required) │  │ (UI state only)     │
                    └────────────┘  └─────────────────────┘
```

### Quick Reference Rules

| Context | Tier | Example |
|---------|------|---------|
| Form submit/save actions | **Tier 2** | `<SaveButtonGroup>`, `<DeleteButton>` |
| Form inputs with validation | **Tier 2** | `<TextInput>`, `<SelectInput>` |
| Reference/relationship inputs | **Tier 2** | `<ReferenceInput>`, `<AutocompleteInput>` |
| Dialog/popover triggers | Tier 1 | `<Button>` opening a `<Dialog>` |
| Filter toggle buttons | Tier 1 | `<Button aria-pressed>` for filter panels |
| Quick-create popover inputs | Tier 1 | Isolated inputs in popovers (no RA form) |
| Standalone action buttons | Tier 1 | Export, refresh, navigation buttons |

---

## Tier 1: Acceptable Direct Usage

These patterns allow direct shadcn/ui component usage because they operate **outside React Admin's form lifecycle**.

### Pattern 1: Dialog/Popover Triggers

**When**: Buttons that toggle open/closed state for dialogs, popovers, or sheets.

**Why Tier 1 is OK**: The button only manages UI state (`open`/`closed`), not form data. No validation or submission occurs at the button level.

```typescript
// ✅ CORRECT: Tier 1 for dialog trigger
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"

export function ContactActions({ contactId }: { contactId: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-11">
          Edit Contact
        </Button>
      </DialogTrigger>
      <DialogContent>
        {/* Tier 2 components go INSIDE the dialog */}
        <ContactEditForm contactId={contactId} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
```

**Key Distinction**: The trigger button is Tier 1, but form components **inside** the dialog must be Tier 2.

---

### Pattern 2: Filter Toggle Buttons

**When**: Buttons that toggle filter visibility or filter state using `aria-pressed` semantics.

**Why Tier 1 is OK**: These control view state, not form submission. They update list filters via `useListContext`, not React Admin forms.

```typescript
// ✅ CORRECT: Tier 1 for filter toggles
import { Button } from "@/components/ui/button"
import { useListContext } from "react-admin"

export function ActiveOnlyToggle() {
  const { filterValues, setFilters } = useListContext()
  const isActive = filterValues.status === "active"

  return (
    <Button
      variant={isActive ? "default" : "outline"}
      aria-pressed={isActive}
      className="h-11"
      onClick={() => {
        setFilters(
          isActive
            ? { ...filterValues, status: undefined }
            : { ...filterValues, status: "active" }
        )
      }}
    >
      Active Only
    </Button>
  )
}
```

**A11y Note**: Always include `aria-pressed` for toggle buttons per [WCAG 4.1.2](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html).

---

### Pattern 3: Quick-Create Popover Inputs

**When**: Simple inputs inside popovers that collect data outside React Admin's form system.

**Why Tier 1 is OK**: These inputs submit via local callbacks (not `<SimpleForm>`), handle their own state, and don't participate in RA validation.

```typescript
// ✅ CORRECT: Tier 1 for isolated popover input
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { useCreate, useNotify } from "react-admin"

export function QuickTagCreate({ onSuccess }: { onSuccess: (tag: Tag) => void }) {
  const [name, setName] = useState("")
  const [open, setOpen] = useState(false)
  const [create] = useCreate()
  const notify = useNotify()

  const handleSubmit = async () => {
    // Direct dataProvider call, not RA form submission
    await create("tags", { data: { name } }, {
      onSuccess: (data) => {
        onSuccess(data)
        setOpen(false)
        setName("")
      },
      onError: (error) => notify(error.message, { type: "error" })
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="h-11">
          + Add Tag
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tag name"
            className="h-11"
            // No aria-invalid needed - validation happens on submit via provider
          />
          <Button onClick={handleSubmit} className="w-full h-11">
            Create
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

**Critical**: Validation still occurs at the API boundary (data provider Zod validation). The popover just doesn't use RA's form-level error display.

---

### Pattern 4: Report/Filter Selects

**When**: Selects that control view parameters (sorting, date range, grouping) rather than form data.

**Why Tier 1 is OK**: These selects update parent component state via callbacks, not form context. They're view controls, not data inputs.

```typescript
// ✅ CORRECT: Tier 1 for view-level select
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

export function ReportGroupingSelect({
  value,
  onChange
}: {
  value: GroupBy
  onChange: (value: GroupBy) => void
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] h-11">
        <SelectValue placeholder="Group by..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="day">By Day</SelectItem>
        <SelectItem value="week">By Week</SelectItem>
        <SelectItem value="month">By Month</SelectItem>
        <SelectItem value="principal">By Principal</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

---

### Pattern 5: Standalone Action Buttons

**When**: Buttons that trigger actions unrelated to form submission (export, refresh, navigation).

**Why Tier 1 is OK**: No form context involvement. These are pure actions with their own handlers.

```typescript
// ✅ CORRECT: Tier 1 for standalone actions
import { Button } from "@/components/ui/button"
import { RefreshCw, Download } from "lucide-react"
import { useRefresh, useNotify } from "react-admin"

export function ListToolbar() {
  const refresh = useRefresh()
  const notify = useNotify()

  const handleExport = async () => {
    // Custom export logic
    notify("Export started", { type: "info" })
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-11 w-11"
        onClick={refresh}
        aria-label="Refresh list"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        className="h-11"
        onClick={handleExport}
      >
        <Download className="mr-2 h-4 w-4" />
        Export CSV
      </Button>
    </div>
  )
}
```

---

## Tier 2: Required Wrappers

These patterns **must** use React Admin wrapper components to ensure proper form integration.

### Required Wrapper: SubmitButtonGroup

**When**: Any button group that submits, cancels, or performs form-level actions inside `<SimpleForm>`, `<Edit>`, or `<Create>`.

**Why Tier 2 is Required**:
- Form dirty state detection (`formState.isDirty`)
- Submit handler integration (`handleSubmit`)
- Loading state during submission
- Proper disabled states during validation
- Keyboard submit (Enter key)

```typescript
// ❌ INCORRECT: Tier 1 in form context
import { Button } from "@/components/ui/button"

function BadForm() {
  return (
    <SimpleForm>
      <TextInput source="name" />
      {/* WRONG: Button doesn't know form is submitting */}
      <Button type="submit">Save</Button>
    </SimpleForm>
  )
}

// ✅ CORRECT: Tier 2 for form submission
import { SaveButton } from "@/components/admin/form/SaveButton"
import { CancelButton } from "@/components/admin/cancel-button"

function GoodForm() {
  return (
    <SimpleForm>
      <TextInput source="name" />
      <div className="flex gap-2 justify-end">
        <CancelButton />
        <SaveButton />
      </div>
    </SimpleForm>
  )
}
```

**Implementation Note**: The project's `SaveButtonGroup` component combines Save, Cancel, and optionally "Save & New" with proper form context integration:

```typescript
// Usage
<SaveButtonGroup
  showSaveAndNew={true}
  onSaveAndNew={() => redirect('create')}
/>
```

---

### Required Wrapper: FormSelectInput

**When**: Any select/dropdown that:
1. Is inside a React Admin form
2. Needs to display validation errors
3. Uses `source` prop to bind to form data
4. Should show `aria-invalid` on error

**Why Tier 2 is Required**:
- `useInput()` hook integration for form binding
- Error message display via `<FormError>`
- `aria-invalid` + `aria-describedby` accessibility
- Controlled value synced with form state

```typescript
// ❌ INCORRECT: Tier 1 select in form
import { Select } from "@/components/ui/select"

function BadContactForm() {
  return (
    <SimpleForm>
      {/* WRONG: Select doesn't bind to form, no error display */}
      <Select onValueChange={...}>
        <SelectItem value="lead">Lead</SelectItem>
      </Select>
    </SimpleForm>
  )
}

// ✅ CORRECT: Tier 2 SelectInput
import { SelectInput } from "@/components/admin/select-input"

function GoodContactForm() {
  return (
    <SimpleForm>
      <SelectInput
        source="status"
        label="Status"
        choices={[
          { id: "lead", name: "Lead" },
          { id: "customer", name: "Customer" },
        ]}
      />
    </SimpleForm>
  )
}
```

**The Tier 2 SelectInput provides**:
- Form binding via `source` prop
- Error display below the field
- `aria-invalid={!!error}` when validation fails
- `aria-describedby` linking to error message
- Consistent styling with other form inputs

---

## Migration Guide

### How to Identify Which Tier to Use

When reviewing existing code or writing new components:

#### Step 1: Check the Parent Context

```typescript
// Find the nearest form ancestor
const parentForms = [
  '<SimpleForm>',
  '<Edit>',
  '<Create>',
  '<Form>',
  '<TabbedForm>'
]

// If ANY of these are ancestors, consider Tier 2
```

#### Step 2: Check Component Purpose

| Purpose | Tier |
|---------|------|
| Submits form data | **Tier 2** |
| Cancels/resets form | **Tier 2** |
| Input bound to `source` prop | **Tier 2** |
| Displays validation errors | **Tier 2** |
| Opens dialogs/popovers | Tier 1 |
| Controls view parameters | Tier 1 |
| Navigation actions | Tier 1 |
| State toggles (`aria-pressed`) | Tier 1 |

#### Step 3: Check for These Red Flags

**Signs you need Tier 2**:
- Using `useInput()` or `useField()`
- Accessing `formState` from react-hook-form
- Manually wiring `aria-invalid`
- Building custom error display

**If you're doing any of these with Tier 1 components, refactor to Tier 2**.

### Common Migration Patterns

#### Pattern A: Tier 1 Button → SaveButton

```typescript
// Before (Tier 1)
<Button type="submit" disabled={isSubmitting}>
  {isSubmitting ? 'Saving...' : 'Save'}
</Button>

// After (Tier 2)
<SaveButton />  // Handles all states automatically
```

#### Pattern B: Tier 1 Select → SelectInput

```typescript
// Before (Tier 1) - manually wiring everything
<div>
  <label>Status</label>
  <Select
    value={watch('status')}
    onValueChange={(v) => setValue('status', v)}
  >
    ...
  </Select>
  {errors.status && <p className="text-destructive">{errors.status.message}</p>}
</div>

// After (Tier 2)
<SelectInput
  source="status"
  label="Status"
  choices={statusChoices}
/>
```

---

## Engineering Constitution Alignment

This document enforces several key principles:

| Principle | How This Document Enforces It |
|-----------|------------------------------|
| **Single Source of Truth** | Form state managed by React Admin, not duplicated in Tier 1 components |
| **Fail-Fast** | Tier 2 components surface validation errors immediately, no silent failures |
| **A11y (WCAG 2.1 AA)** | Required `aria-invalid`, `aria-describedby` enforced via Tier 2 |
| **Touch Targets** | All examples include `h-11` (44px) minimum |
| **Semantic Colors** | No hardcoded colors in examples |

---

## Related Documentation

- [Presentation Layer](./01-presentation-layer.md) - Full component inventory
- [MODULE_CHECKLIST.md](../../.claude/rules/MODULE_CHECKLIST.md) - PR checklist for tier compliance
- [PROVIDER_RULES.md](../../.claude/rules/PROVIDER_RULES.md) - Data provider patterns
- [components/ui/PATTERNS.md](../../src/components/ui/PATTERNS.md) - Tier 1 conventions
- [components/admin/PATTERNS.md](../../src/components/admin/PATTERNS.md) - Tier 2 conventions

---

*Generated: 2026-01-22 | Engineering Constitution v1.0*
