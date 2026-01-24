# Form Layout Patterns

Crispy CRM uses three distinct form layout patterns for create and edit forms. Each pattern serves different use cases and provides a structured approach to organizing form fields.

**Accessibility Note:** All patterns must follow [Accessibility Guidelines](../design/ACCESSIBILITY.md#4-form-accessibility-checklist) including:
- ARIA attributes (`aria-invalid`, `aria-describedby`, `role="alert"`)
- Keyboard navigation support
- Touch target minimums (44px)
- Error announcements

This document covers layout structure and implementation mechanics.

## Overview

All form patterns share common characteristics:

- **Background:** `bg-muted` page background with `px-6 py-6` padding
- **Container:** Centered container with responsive width constraints
- **Form Framework:** React Hook Form with Zod validation
- **Progress Tracking:** `FormProgressProvider` + `FormProgressBar` for visual feedback
- **Footer:** Sticky `CreateFormFooter` with Cancel, Save & Close, and Save & Add Another actions

---

## Pattern 1: Compact Sections (Recommended for New Forms)

**Best for:** Well-organized forms with logically grouped related fields

**Used by:**
- `ContactCreate`
- `TaskCreate`

### Layout Structure

```
Container: max-w-4xl mx-auto
┌─────────────────────────────────────────┐
│ FormProgressBar (top)                   │
├─────────────────────────────────────────┤
│                                         │
│ FormSectionWithProgress (Section 1)     │
│ ├─ Title with completion icon/badge    │
│ ├─ Description (optional)               │
│ └─ Fields (grouped logically)           │
│                                         │
│ FormSectionWithProgress (Section 2)     │
│ ├─ Title with completion icon/badge    │
│ ├─ Description (optional)               │
│ └─ Fields (grouped logically)           │
│                                         │
│ FormSectionWithProgress (Section 3)     │
│ └─ ...                                  │
│                                         │
├─────────────────────────────────────────┤
│ CreateFormFooter (sticky)               │
└─────────────────────────────────────────┘
```

### Key Features

- **Progress Indicator:** Each section shows completion status with icons (circle for incomplete, checkmark for complete) and "Complete" badge
- **Collapsible Sections:** Visually distinct sections with titles and descriptions
- **Field Grouping:** Related fields organized within `FormSectionWithProgress` containers
- **Responsive Rows:** `CompactFormRow` for multi-column layouts (e.g., first name + last name on same row)

### Component Hierarchy

```
FormProgressProvider
├─ FormProgressBar
└─ Form
   ├─ FormSectionWithProgress (id="section-1", title="", requiredFields=[])
   │  ├─ CompactFormRow (columns="md:grid-cols-2")
   │  │  ├─ FormFieldWrapper
   │  │  │  └─ Input (TextInput, ReferenceInput, etc.)
   │  │  └─ FormFieldWrapper
   │  │     └─ Input
   │  └─ FormFieldWrapper
   │     └─ Input
   │
   ├─ FormSectionWithProgress (id="section-2", ...)
   │  └─ ...
   │
   └─ CreateFormFooter
```

### Example: ContactCreate Pattern

```typescript
import { FormProgressProvider, FormProgressBar } from "@/components/ra-wrappers/form";
import { CreateFormFooter } from "@/atomic-crm/components";
import { ContactInputs } from "./ContactInputs";
import { contactBaseSchema } from "../validation/contacts";

const ContactCreate = () => {
  const formDefaults = {
    ...contactBaseSchema.partial().parse({}),
    sales_id: defaults.sales_id,
  };

  return (
    <CreateBase redirect={redirect} transform={transformData}>
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          <FormProgressProvider initialProgress={10}>
            <FormProgressBar className="mb-6" />
            <Form defaultValues={formDefaults} mode="onBlur">
              <ContactInputs />
              <CreateFormFooter
                resourceName="contact"
                redirectPath="/contacts"
                redirect={redirect}
                preserveFields={["organization_id", "sales_id"]}
              />
            </Form>
          </FormProgressProvider>
        </div>
      </div>
    </CreateBase>
  );
};
```

### Example: Section Definition

```typescript
import { FormSectionWithProgress, FormFieldWrapper, CompactFormRow } from "@/components/ra-wrappers/form";
import { TextInput } from "@/components/ra-wrappers/text-input";

export const ContactCompactForm = () => {
  return (
    <div className="space-y-6">
      {/* Name Section */}
      <FormSectionWithProgress
        id="name-section"
        title="Name"
        description="Basic contact information"
        requiredFields={["first_name", "last_name"]}
      >
        <CompactFormRow columns="md:grid-cols-2">
          <FormFieldWrapper name="first_name" isRequired>
            <TextInput
              source="first_name"
              label="First Name *"
              helperText="Required field"
            />
          </FormFieldWrapper>
          <FormFieldWrapper name="last_name" isRequired>
            <TextInput
              source="last_name"
              label="Last Name *"
              helperText="Required field"
            />
          </FormFieldWrapper>
        </CompactFormRow>
      </FormSectionWithProgress>

      {/* Organization Section */}
      <FormSectionWithProgress
        id="organization-section"
        title="Organization"
        requiredFields={["organization_id", "sales_id"]}
      >
        <FormFieldWrapper name="organization_id" isRequired>
          <ReferenceInput
            source="organization_id"
            reference="organizations"
            label="Organization *"
            isRequired
          >
            <AutocompleteOrganizationInput helperText="Required field" />
          </ReferenceInput>
        </FormFieldWrapper>

        <FormFieldWrapper name="sales_id" isRequired>
          <ReferenceInput
            reference="sales"
            source="sales_id"
            label="Account manager *"
          >
            <SelectInput helperText="Required field" />
          </ReferenceInput>
        </FormFieldWrapper>
      </FormSectionWithProgress>
    </div>
  );
};
```

---

## Pattern 2: Card Wrapped

**Best for:** Forms with built-in validation checks (duplicates, similar records) or complex field groupings

**Used by:**
- `OrganizationCreate`
- `OpportunityCreate`

### Layout Structure

```
Container: max-w-4xl mx-auto
┌─────────────────────────────────────────┐
│ FormProgressBar (top)                   │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ Card (structural wrapper)           │ │
│ │ ├─ CardContent (padding container)  │ │
│ │ │  ├─ FormErrorSummary (if errors)  │ │
│ │ │  └─ Input fields                  │ │
│ │ └─ (no sections - flat organization)│ │
│ └─────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ CreateFormFooter (sticky)               │
└─────────────────────────────────────────┘
```

### Key Features

- **Card Container:** `<Card><CardContent>` for structured visual grouping
- **Error Summary:** `FormErrorSummary` at top of form for all validation issues
- **Duplicate Checking:** Built-in checks before save (soft warnings, not hard blocks)
- **Flat Organization:** Fields organized without `FormSectionWithProgress` divisions
- **Custom Save Logic:** Often includes duplicate/similarity detection dialogs

### Component Hierarchy

```
FormProgressProvider
├─ FormProgressBar
└─ Form
   ├─ Card
   │  ├─ CardContent
   │  │  ├─ FormErrorSummary
   │  │  └─ Inputs (no FormSectionWithProgress)
   │  └─ (no footer inside card)
   │
   └─ CreateFormFooter (outside card)
```

### Example: OrganizationCreate Pattern

```typescript
import { Card, CardContent } from "@/components/ui/card";
import { FormProgressProvider, FormProgressBar } from "@/components/ra-wrappers/form";
import { CreateFormFooter } from "@/atomic-crm/components";
import { OrganizationInputs } from "./OrganizationInputs";
import { OrganizationCreateFormFooter } from "./OrganizationCreateFormFooter";

const OrganizationCreate = () => {
  const [duplicateOrg, setDuplicateOrg] = useState(null);

  const formDefaults = {
    ...organizationSchema.partial().parse({}),
    sales_id: smartDefaults?.sales_id ?? null,
  };

  return (
    <CreateBase redirect="show" transform={transformValues}>
      <div className="bg-muted px-6 py-6">
        <div className="max-w-4xl mx-auto create-form-card">
          <FormProgressProvider initialProgress={10}>
            <Form defaultValues={formDefaults} mode="onBlur">
              <FormProgressBar className="mb-6" />
              <Card>
                <CardContent>
                  <OrganizationInputs />
                  <OrganizationCreateFormFooter
                    onDuplicateFound={handleDuplicateFound}
                    checkForDuplicate={checkForDuplicate}
                    isChecking={isChecking}
                    redirectPath="/organizations"
                    preserveFields={["parent_organization_id"]}
                  />
                </CardContent>
              </Card>
            </Form>
          </FormProgressProvider>
        </div>
      </div>

      {/* Soft Duplicate Warning Dialog */}
      <DuplicateOrgWarningDialog
        open={!!duplicateOrg}
        duplicateName={duplicateOrg?.name}
        onCancel={handleCancel}
        onProceed={handleProceed}
        onViewExisting={handleViewExisting}
      />
    </CreateBase>
  );
};
```

---

## Pattern 3: Wide Container

**Best for:** Forms with inline related record displays or wider content

**Used by:**
- `ActivityCreate`

### Layout Structure

```
Container: max-w-5xl mx-auto (wider than other patterns)
┌──────────────────────────────────────────────────┐
│ FormProgressBar (top)                            │
├──────────────────────────────────────────────────┤
│                                         │        │
│ ┌──────────────────────────────────────┴────────┐│
│ │ Card (structural wrapper)                     ││
│ │ ├─ CardContent (padding container)            ││
│ │ │  ├─ FormErrorSummary (if errors)            ││
│ │ │  ├─ Related record inline display           ││
│ │ │  ├─ Main input fields                       ││
│ │ │  └─ Additional fields                       ││
│ │ └─ (flat - no FormSectionWithProgress)        ││
│ └──────────────────────────────────────────────┘│
│                                         │        │
├──────────────────────────────────────────────────┤
│ CreateFormFooter (sticky)                        │
└──────────────────────────────────────────────────┘
```

### Key Features

- **Wider Container:** `max-w-5xl` (vs `max-w-4xl` for Patterns 1 & 2)
- **Card Container:** `<Card><CardContent>` for structured grouping
- **Inline Related Records:** Display linked entities (contacts, opportunities) directly in form
- **Error Summary:** `FormErrorSummary` at top for all validation issues
- **Flat Organization:** No `FormSectionWithProgress` divisions

### Component Hierarchy

```
FormProgressProvider
├─ FormProgressBar
└─ Form
   ├─ Card
   │  ├─ CardContent
   │  │  ├─ FormErrorSummary
   │  │  ├─ Related record display (text/component)
   │  │  └─ Inputs
   │  └─ (no footer inside card)
   │
   └─ CreateFormFooter (outside card)
```

### Example: ActivityCreate Pattern

```typescript
import { Card, CardContent } from "@/components/ui/card";
import { FormProgressProvider, FormProgressBar } from "@/components/ra-wrappers/form";
import { CreateFormFooter } from "@/atomic-crm/components";
import { FormErrorSummary } from "@/components/ra-wrappers/FormErrorSummary";
import { ActivitySinglePage } from "./ActivitySinglePage";

export default function ActivityCreate() {
  const defaultValues = {
    ...activitiesSchema.partial().parse({}),
    created_by: identity?.id,
  };

  return (
    <CreateBase redirect="list">
      <div className="bg-muted mt-2 flex justify-center px-6 py-6">
        <div className="w-full max-w-5xl">
          <FormProgressProvider initialProgress={10}>
            <FormProgressBar className="mb-6" />
            <Form defaultValues={defaultValues} mode="onBlur">
              <Card>
                <CardContent className="space-y-6 p-6">
                  <ActivityFormContent />
                </CardContent>
              </Card>
            </Form>
          </FormProgressProvider>
        </div>
      </div>
    </CreateBase>
  );
}

const ActivityFormContent = () => {
  const { errors } = useFormState();

  return (
    <>
      <FormErrorSummary errors={errors} />
      <ActivitySinglePage />
      <CreateFormFooter
        resourceName="activity"
        redirectPath="/activities"
        preserveFields={["contact_id", "organization_id"]}
      />
    </>
  );
};
```

---

## Pattern Comparison

| Feature | Pattern 1: Compact Sections | Pattern 2: Card Wrapped | Pattern 3: Wide Container |
|---------|---------------------------|------------------------|--------------------------|
| **Container Width** | `max-w-4xl` | `max-w-4xl` | `max-w-5xl` |
| **Section Organization** | `FormSectionWithProgress` (multiple) | Flat (no sections) | Flat (no sections) |
| **Progress Indicator** | Per-section completion | Overall form progress | Overall form progress |
| **Card Wrapper** | No | Yes (`<Card><CardContent>`) | Yes (`<Card><CardContent>`) |
| **Error Display** | Per-field validation | `FormErrorSummary` at top | `FormErrorSummary` at top |
| **Validation Checks** | Standard Zod validation | Duplicate/similarity checks | Standard Zod validation |
| **Best For** | Well-grouped fields | Complex validation logic | Wide form content |

---

## Implementation Checklist

### For New Forms Using Pattern 1 (Recommended)

- [ ] Create form component in `src/atomic-crm/feature/FeatureCreate.tsx`
- [ ] Create form inputs component in `src/atomic-crm/feature/FeatureCompactForm.tsx` or similar
- [ ] Use `FormProgressProvider` with `FormProgressBar` at top
- [ ] Wrap form sections with `FormSectionWithProgress` components
- [ ] Define `requiredFields` prop for each section to show completion status
- [ ] Use `CompactFormRow` for multi-column layouts
- [ ] Place `CreateFormFooter` after all form sections
- [ ] Verify form defaults use schema `.partial().parse({})` pattern
- [ ] Add `mode="onBlur"` to form for debounced validation
- [ ] Test on desktop (1440px) and iPad (768px+) viewports

### Common Props

```typescript
// FormSectionWithProgress
interface FormSectionWithProgressProps {
  id: string;                    // Unique identifier
  title: string;                 // Section heading
  description?: string;          // Optional description below title
  requiredFields?: string[];     // Field names to track completion
  children: React.ReactNode;     // Form fields
  className?: string;            // Additional CSS classes
}

// CreateFormFooter
interface CreateFormFooterProps {
  resourceName: string;          // e.g., "contact", "task"
  redirectPath: string;          // e.g., "/contacts"
  redirect?: RedirectTo;         // React Admin redirect behavior
  tutorialAttribute?: string;    // data-tutorial attribute
  preserveFields?: string[];     // Fields to preserve on "Save & Add Another"
}
```

---

## Migration Path

When refactoring existing forms:

1. **Pattern 2 → Pattern 1:** Convert flat card-wrapped forms to use `FormSectionWithProgress` for better organization and visual feedback
2. **Pattern 3 → Pattern 1:** Keep wide container for content that needs it, but consider `FormSectionWithProgress` if fields can be logically grouped
3. **Preserve Validation:** Maintain all existing validation logic and duplicate checking during migration

---

## See Also

- `FormSectionWithProgress` component: `src/components/admin/form/FormSectionWithProgress.tsx`
- `FormFieldWrapper` component: `src/components/admin/form/FormFieldWrapper.tsx`
- `CompactFormRow` component: `src/components/admin/form/CompactFormRow.tsx`
- `FormProgressProvider` context: `src/components/admin/form/formProgressUtils.ts`
- Zod validation: `src/atomic-crm/validation/` directory
