# Form Component Patterns

Tier 2 form components that bridge shadcn/ui primitives (Tier 1) with React Admin's form state management.

## Architecture Overview

```
React Admin Form Context (react-hook-form)
    |
    v
Form Primitives (FormField, FormControl, FormError)
    |
    +----> Form Layout (FormSection, FormGrid, CollapsibleSection)
    |           |
    |           +----> Progress Tracking (FormProgressProvider, FormFieldWrapper)
    |
    +----> Form Actions (SaveButton, SaveButtonGroup, FormActions)
    |
    +----> Multi-Step Forms (FormWizard, WizardStep, WizardNavigation)
              |
              +----> Step Validation (per-step field validation)
              +----> Focus Management (accessibility)
              +----> Progress Indication (StepIndicator)
```

**Key Principle:** Form components wire React Hook Form state to accessible UI primitives without business logic.

---

## File Structure

```
src/components/ra-wrappers/form/
├── form-primitives.tsx           # Core form building blocks
├── FormFieldWrapper.tsx          # Progress tracking + validation UI
├── FormSection.tsx               # Section layout with title/description
├── CollapsibleSection.tsx        # Expandable section with a11y
├── AccordionSection.tsx          # Multi-section accordion layout
├── FormGrid.tsx                  # Responsive grid layout
├── FormProgressProvider.tsx      # Progress tracking context
├── FormProgressBar.tsx           # Visual progress indicator
├── SaveButton.tsx                # Primary save action (in form-primitives.tsx)
├── SaveButtonGroup.tsx           # Save with dropdown options
├── FormActions.tsx               # Action button row layout
├── FormWizard.tsx                # Multi-step form container
├── WizardStep.tsx                # Individual wizard step panel
├── WizardNavigation.tsx          # Step navigation controls
├── StepIndicator.tsx             # Step progress visualization
├── useFormShortcuts.ts           # Keyboard shortcuts hook
└── __tests__/                    # Comprehensive test coverage
```

**Import Pattern:**
```tsx
// Barrel export for common components
import { FormSection, FormFieldWrapper, SaveButtonGroup } from "@/components/ra-wrappers/form";

// Direct import for specialized components
import { FormWizard, WizardStep } from "@/components/ra-wrappers/form/FormWizard";
```

---

## Pattern A: Form Primitives with useFormField Hook

Core building blocks that connect React Hook Form state to accessible UI elements.

```tsx
// src/components/ra-wrappers/form/form-primitives.tsx

// Context hook provides field state and IDs for ARIA
const useFormField = () => {
  const { getFieldState } = useFormContext();
  const { id, name } = useContext(FormItemContext);

  // CRITICAL: Subscribe to form state changes via useFormState({ name })
  // This ensures re-renders when errors change (e.g., setError() calls)
  const formState = useFormState({ name });
  const fieldState = getFieldState(name, formState);

  return {
    formItemId: id,                      // Input ID
    formDescriptionId: `${id}-description`, // aria-describedby
    formMessageId: `${id}-message`,        // aria-describedby error
    ...fieldState,                          // error, invalid, isDirty
  };
};

// Usage in form layouts
<FormField id="email" name="email">
  <FormLabel>Email</FormLabel>
  <FormControl>
    <Input type="email" placeholder="user@example.com" />
  </FormControl>
  <FormDescription>We'll never share your email.</FormDescription>
  <FormError />
</FormField>
```

**When to use:** All form field implementations (inputs, selects, textareas, custom controls).

**Key points:**
- `FormField` creates field context with `id` and `name`
- `useFormField()` subscribes to field state for reactive updates
- `FormControl` uses Radix `<Slot>` to clone props to any child component
- `aria-describedby` links input to description and error messages
- `aria-invalid` updates reactively when validation changes
- `FormError` includes `role="alert"` and `aria-live="polite"` for screen readers

**ARIA Compliance (WCAG 2.1 AA):**
- Form fields MUST have unique `id` props
- Labels MUST use `htmlFor` pointing to input ID
- Errors MUST have `role="alert"` for immediate announcement
- Descriptions MUST be linked via `aria-describedby`

---

## Pattern B: Progress Tracking with Field Registration

Tracks form completion percentage based on required field state.

```tsx
// src/components/ra-wrappers/form/FormProgressProvider.tsx

function FormProgressProvider({ children, initialProgress = 10 }: FormProgressProviderProps) {
  const [fields, setFields] = useState<Record<string, FieldProgress>>({});

  const registerField = useCallback((name: string, isRequired: boolean) => {
    setFields((prev) => ({
      ...prev,
      [name]: { name, isValid: false, isRequired },
    }));
  }, []);

  const markFieldValid = useCallback((name: string, isValid: boolean) => {
    setFields((prev) => {
      const field = prev[name];
      if (!field) return prev;
      return {
        ...prev,
        [name]: { ...field, isValid },
      };
    });
  }, []);

  const contextValue = useMemo(() => {
    const requiredFields = Object.values(fields).filter((field) => field.isRequired);
    const totalRequired = requiredFields.length;
    const completedRequired = requiredFields.filter((field) => field.isValid).length;

    // Calculate percentage with initialProgress baseline (avoid 0% on empty forms)
    const rawPercentage = totalRequired === 0 ? 0 : (completedRequired / totalRequired) * 100;
    const percentage =
      rawPercentage === 0
        ? initialProgress
        : initialProgress + (rawPercentage * (100 - initialProgress)) / 100;

    return {
      fields,
      totalRequired,
      completedRequired,
      percentage,
      registerField,
      markFieldValid,
    };
  }, [fields, initialProgress, registerField, markFieldValid]);

  return (
    <FormProgressContext.Provider value={contextValue}>
      {children}
    </FormProgressContext.Provider>
  );
}

// Wrap forms with progress tracking
<FormProgressProvider initialProgress={10}>
  <Form {...methods}>
    <FormFieldWrapper name="first_name" isRequired>
      <TextInput source="first_name" />
    </FormFieldWrapper>
    <FormProgressBar /> {/* Displays real-time completion */}
  </Form>
</FormProgressProvider>
```

**When to use:** Long forms with multiple required fields (opportunity create, contact edit).

**Key points:**
- `initialProgress={10}` prevents showing 0% on empty forms
- Only required fields count toward completion percentage
- Fields register on mount via `useEffect` in `FormFieldWrapper`
- Validation state tracked separately from dirty state
- Progress updates reactively as fields are filled

**Field State Logic:**
```tsx
// FormFieldWrapper.tsx - Progress calculation
const isDirty = !!dirtyFields[name];
const hasValue = value !== undefined && value !== null &&
  (typeof value === "string" ? value.trim() !== "" : value !== "");

// Field counts as "filled" only if user has modified it
// OR if countDefaultAsFilled is true and it has a value
const isFilledForProgress = hasValue && (isDirty || countDefaultAsFilled);

// Mark field valid when filled AND no error
markFieldValid(name, isFilledForProgress && !hasError);
```

---

## Pattern C: Validation Boundary with createFormResolver

Type-safe resolver adapter that bridges Zod schemas to React Admin forms.

```tsx
// src/lib/zodErrorFormatting.ts

/**
 * Create a type-safe resolver for React Admin Form components using Zod schemas.
 *
 * React Admin's Form component expects Resolver<FieldValues>, but zodResolver
 * returns a more specific Resolver<z.infer<TSchema>>. These types are structurally
 * compatible at runtime, but TypeScript cannot infer this relationship.
 *
 * This helper provides a documented, type-safe way to bridge the gap without
 * inline `as unknown as` casts scattered throughout the codebase.
 */
export function createFormResolver<TSchema extends ZodSchema>(
  schema: TSchema
): Resolver<FieldValues> {
  // zodResolver returns Resolver<z.infer<TSchema>> which is a subset of FieldValues
  // The cast is safe because all Zod schema outputs are valid FieldValues
  return zodResolver(schema) as Resolver<FieldValues>;
}

// Usage in form components
import { createFormResolver } from "@/lib/zodErrorFormatting";
import { opportunitySchema } from "@/atomic-crm/validation/opportunities";

<Form
  defaultValues={defaultValues}
  resolver={createFormResolver(opportunitySchema)}
  mode="onSubmit"
>
  <TextInput source="name" />
  <SaveButton />
</Form>
```

**When to use:** ALL React Admin forms with Zod validation (replaces direct `zodResolver` calls).

**Key points:**
- **BANNED:** `resolver={zodResolver(schema) as any}` — violates type safety rules
- **BANNED:** `resolver={zodResolver(schema)}` — causes generic type mismatch errors
- **CORRECT:** `resolver={createFormResolver(schema)}` — documented, type-safe adapter
- Centralizes the type cast in a single utility (Single Source of Truth)
- Prevents TypeScript variance errors in form components

**Why this exists (from CODE_QUALITY.md):**
- `zodResolver<z.infer<typeof schema>>` returns `Resolver<ContactInput>`
- React Admin Form expects `Resolver<FieldValues>`
- TypeScript cannot prove `ContactInput` extends `FieldValues` at compile time
- Runtime: they ARE compatible (all Zod outputs are valid FieldValues)
- `createFormResolver` documents this invariant with a safe cast

---

## Pattern D: Layout Components with Semantic Slots

Composable layout wrappers that organize form fields into sections and grids.

```tsx
// src/components/ra-wrappers/form/FormSection.tsx

function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div data-slot="form-section" className={cn("space-y-6", className)}>
      <div data-slot="form-section-header" className="border-b border-border pb-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
        {description && (
          <p data-slot="form-section-description" className="text-muted-foreground text-sm mt-1">
            {description}
          </p>
        )}
      </div>
      <div className="mb-6">{children}</div>
    </div>
  );
}

// Usage with nested grids
<FormSection title="Contact Information" description="Primary contact details">
  <FormGrid columns={2}>
    <TextInput source="first_name" />
    <TextInput source="last_name" />
  </FormGrid>
  <FormGrid columns={1}>
    <TextInput source="email" />
  </FormGrid>
</FormSection>

<CollapsibleSection title="Advanced Settings" defaultOpen={false}>
  <FormGrid columns={2}>
    <SelectInput source="timezone" />
    <SelectInput source="locale" />
  </CollapsibleSection>
</FormSection>
```

**When to use:** Multi-section forms with visual hierarchy (create/edit views).

**Key points:**
- `data-slot` attributes enable CSS targeting without class name coupling
- Semantic colors: `text-muted-foreground`, `border-border` (no hex codes)
- `FormGrid` supports `columns={1|2|3|4}` with responsive breakpoints
- `CollapsibleSection` includes `aria-controls` and `aria-expanded` for a11y
- Touch targets >= 44px (`h-11` class on interactive elements)

**CollapsibleSection Accessibility:**
```tsx
// src/components/ra-wrappers/form/CollapsibleSection.tsx

const [isOpen, setIsOpen] = useState(defaultOpen);
const contentId = useId(); // Unique ID for aria-controls

<CollapsibleTrigger
  aria-controls={contentId}
  className={cn(
    "flex w-full items-center justify-between px-3",
    "h-11", // 44px touch target - Fitts's Law
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
  )}
>
  <span>{title}</span>
  <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
</CollapsibleTrigger>
<CollapsibleContent id={contentId}>
  {children}
</CollapsibleContent>
```

---

## Pattern E: Multi-Step Forms with Focus Management

Wizard pattern for complex forms split into validated steps with keyboard accessibility.

```tsx
// src/components/ra-wrappers/form/FormWizard.tsx

function FormWizard({ steps, children, onSubmit }: FormWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { trigger, getValues } = useFormContext();

  const goToNext = useCallback(async (): Promise<boolean> => {
    // Validate current step fields BEFORE advancing
    const fieldsToValidate = currentStepConfig.fields;
    const isValid = fieldsToValidate.length === 0 ? true : await trigger(fieldsToValidate);

    if (!isValid) return false;

    if (currentStep === steps.length) {
      // Final step - submit the form
      await onSubmit(getValues());
      return true;
    }

    // Advance to next step
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    // Focus first field in new step (accessibility)
    setTimeout(() => {
      const nextPanel = document.getElementById(`wizard-step-${nextStep}`);
      const firstInput = nextPanel?.querySelector("input, select, textarea") as HTMLElement;
      firstInput?.focus();
    }, 100);

    return true;
  }, [currentStep, steps.length, currentStepConfig.fields, trigger, getValues, onSubmit]);

  return (
    <WizardContext.Provider value={contextValue}>
      {/* Screen reader announcement for step changes */}
      <div aria-live="polite" className="sr-only">
        Step {currentStep} of {steps.length}: {currentStepConfig.title}
      </div>
      {children}
    </WizardContext.Provider>
  );
}

// Usage with step configuration
const wizardSteps: WizardStepConfig[] = [
  {
    id: 1,
    title: "Basic Information",
    description: "Contact name and organization",
    fields: ["first_name", "last_name", "organization_id"],
  },
  {
    id: 2,
    title: "Contact Details",
    description: "Email and phone numbers",
    fields: ["email", "phone"],
  },
];

<FormProvider {...methods}>
  <FormWizard steps={wizardSteps} onSubmit={handleSubmit}>
    <WizardStep step={1}>
      <TextInput source="first_name" />
      <TextInput source="last_name" />
      <ReferenceInput source="organization_id" reference="organizations">
        <SelectInput />
      </ReferenceInput>
    </WizardStep>

    <WizardStep step={2}>
      <TextInput source="email" />
      <TextInput source="phone" />
    </WizardStep>

    <WizardNavigation />
  </FormWizard>
</FormProvider>
```

**When to use:** Long forms with logical progression (onboarding, multi-stage data entry).

**Key points:**
- Per-step validation via `trigger(fieldsArray)` before advancing
- Focus management for keyboard navigation (WCAG 2.1 2.4.3)
- `aria-live="polite"` announces step changes to screen readers
- `WizardStep` conditionally renders based on `currentStep` context
- Submit only fires on final step after all validations pass

**Validation Strategy:**
```tsx
// WizardStepConfig - defines fields to validate per step
interface WizardStepConfig {
  id: number;
  title: string;
  description?: string;
  fields: string[]; // Field names to validate when leaving this step
}

// Validation before advancing
const isValid = fieldsToValidate.length === 0
  ? true
  : await trigger(fieldsToValidate);

if (!isValid) return false; // Block navigation if errors exist
```

---

## Pattern F: Save Actions with Mutation Handling

Standardized save buttons that integrate with React Admin's mutation lifecycle.

```tsx
// src/components/ra-wrappers/form/SaveButtonGroup.tsx

function SaveButtonGroup({ onSave, onSaveAndNew }: SaveButtonGroupProps) {
  const { handleSubmit } = useFormContext();
  const { isSubmitting } = useFormState();

  const createSubmitHandler = useCallback(
    (action: "save" | "saveAndNew") => {
      return handleSubmit((data) => {
        if (action === "saveAndNew") return onSaveAndNew(data);
        return onSave(data);
      });
    },
    [handleSubmit, onSave, onSaveAndNew]
  );

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        onClick={createSubmitHandler("save")}
        disabled={isSubmitting}
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            disabled={isSubmitting}
            aria-label="More save options"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={createSubmitHandler("save")}>
            Save
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={createSubmitHandler("saveAndNew")}>
            Save + Create Another
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Usage in forms
<Form {...methods}>
  <FormSection title="Opportunity Details">
    {/* ... form fields ... */}
  </FormSection>

  <FormActions>
    <SaveButtonGroup
      onSave={handleSave}
      onSaveAndNew={handleSaveAndNew}
    />
    <Button variant="outline" onClick={onCancel}>Cancel</Button>
  </FormActions>
</Form>
```

**When to use:** Forms with save workflows (create forms, bulk entry).

**Key points:**
- `type="button"` prevents default form submission (controlled by `handleSubmit`)
- `isSubmitting` state from React Hook Form disables during mutations
- Loading spinner replaces icon during async operations
- Dropdown provides "Save + Create Another" for bulk data entry
- `aria-label` on icon button for screen reader context

**SaveButton from form-primitives.tsx:**
```tsx
// Enhanced SaveButton with React Admin integration
const SaveButton = (props: SaveButtonProps) => {
  const { dirtyFields, isValidating, isSubmitting } = useFormState();
  const isDirty = Object.keys(dirtyFields).length > 0;
  const saveContext = useSaveContext();

  // Disable when form is pristine (no changes)
  const disabled = valueOrDefault(
    alwaysEnable === false ? undefined : !alwaysEnable,
    disabledProp || (!isDirty && recordFromLocation == null) || isValidating || isSubmitting
  );

  const handleClick = useCallback(async (event) => {
    if (type === "button") {
      event.stopPropagation();
      await form.handleSubmit(handleSubmit)(event);
    }
  }, [onClick, type, form, handleSubmit]);

  return (
    <Button variant={variant} type={type} disabled={disabled} onClick={handleClick}>
      {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : icon}
      {displayedLabel}
    </Button>
  );
};
```

**Disabled Logic:**
- Pristine forms with no changes: disabled (prevents empty submissions)
- Validating or submitting: disabled (prevents double-submit)
- `alwaysEnable` prop: override for forms with defaults

---

## Pattern G: Keyboard Shortcuts with useFormShortcuts

Consistent keyboard navigation across all forms.

```tsx
// src/components/ra-wrappers/form/useFormShortcuts.ts

export const useFormShortcuts = ({ onSave, onSaveAndNew, onCancel }: UseFormShortcutsProps) => {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const target = e.target as HTMLElement;
    const isTextarea = target.tagName === "TEXTAREA";
    const isContentEditable = target.contentEditable === "true";

    // Cmd+Enter (or Ctrl+Enter on Windows/Linux): Save
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      // Cmd+Shift+Enter: Save and New
      if (e.shiftKey && onSaveAndNew) {
        e.preventDefault();
        onSaveAndNew();
        return;
      }

      // Cmd+Enter: Save (works in textareas too)
      if (!e.shiftKey) {
        e.preventDefault();
        onSave();
        return;
      }
    }

    // Escape: Cancel (but NOT in textarea or contentEditable)
    if (e.key === "Escape" && !isTextarea && !isContentEditable) {
      e.preventDefault();
      onCancel();
    }
  }, [onSave, onSaveAndNew, onCancel]);

  return { handleKeyDown };
};

// Usage in forms
const { handleKeyDown } = useFormShortcuts({
  onSave: handleSubmit(onSave),
  onSaveAndNew: handleSubmit(onSaveAndNew),
  onCancel: () => navigate(-1),
});

<form onKeyDown={handleKeyDown}>
  {/* ... form fields ... */}
</form>
```

**When to use:** All forms (provides consistent shortcuts across the app).

**Key points:**
- `Cmd+Enter` (Mac) or `Ctrl+Enter` (Windows/Linux): Save
- `Cmd+Shift+Enter`: Save + Create Another
- `Escape`: Cancel (except in textareas/contentEditable to preserve editing)
- Platform-agnostic via `metaKey || ctrlKey` detection

**Accessibility Note:**
Keyboard shortcuts MUST be documented in help text or tooltips for discoverability.

---

## Anti-Patterns to Avoid

### 1. Direct zodResolver Usage (Type Variance Error)

```tsx
// WRONG: Causes generic type mismatch
import { zodResolver } from "@hookform/resolvers/zod";

<Form resolver={zodResolver(contactSchema)}>
  {/* TypeScript Error: Resolver<Contact> incompatible with Resolver<FieldValues> */}
</Form>

// WRONG: Type cast hides the issue
<Form resolver={zodResolver(contactSchema) as any}>
  {/* Violates CODE_QUALITY.md - zero tolerance for `as any` */}
</Form>

// RIGHT: Use documented adapter
import { createFormResolver } from "@/lib/zodErrorFormatting";

<Form resolver={createFormResolver(contactSchema)}>
  {/* Type-safe and documented */}
</Form>
```

### 2. Missing ARIA Attributes (Accessibility Fail)

```tsx
// WRONG: No aria-invalid or aria-describedby
<input id="email" type="email" className={error ? "border-red-500" : ""} />
{error && <span className="text-red-500">{error.message}</span>}

// RIGHT: Full ARIA compliance
<FormField id="email" name="email">
  <FormLabel>Email</FormLabel>
  <FormControl>
    <Input type="email" />
  </FormControl>
  <FormDescription id="email-description">
    Enter your work email address.
  </FormDescription>
  {error && <FormError />} {/* Includes role="alert" and aria-live */}
</FormField>
```

### 3. Manual Progress Calculation (Duplication)

```tsx
// WRONG: Calculating progress in component
const [progress, setProgress] = useState(0);
const calculateProgress = () => {
  const filled = fields.filter(f => !!values[f]).length;
  setProgress((filled / fields.length) * 100);
};

// RIGHT: Use FormProgressProvider + FormFieldWrapper
<FormProgressProvider>
  <FormFieldWrapper name="first_name" isRequired>
    <TextInput source="first_name" />
  </FormFieldWrapper>
  <FormProgressBar /> {/* Automatically tracks required fields */}
</FormProgressProvider>
```

### 4. Wizard Without Per-Step Validation

```tsx
// WRONG: Validating entire form on every step
const goToNext = () => {
  const isValid = await trigger(); // Validates ALL fields
  if (isValid) setCurrentStep(currentStep + 1);
};

// RIGHT: Validate only current step's fields
const goToNext = async () => {
  const fieldsToValidate = steps[currentStep - 1].fields;
  const isValid = await trigger(fieldsToValidate); // Only current step
  if (!isValid) return false;
  setCurrentStep(currentStep + 1);
};
```

### 5. Missing Focus Management (Accessibility)

```tsx
// WRONG: No focus after step change
const goToNext = () => {
  setCurrentStep(currentStep + 1);
  // User loses keyboard context
};

// RIGHT: Focus first field in new step
const goToNext = () => {
  setCurrentStep(currentStep + 1);

  setTimeout(() => {
    const nextPanel = document.getElementById(`wizard-step-${currentStep + 1}`);
    const firstInput = nextPanel?.querySelector("input, select, textarea");
    firstInput?.focus(); // Restore keyboard context
  }, 100);
};
```

---

## Checklist

When creating or updating form components:

- [ ] Use `FormField`, `FormControl`, `FormError` from form-primitives.tsx
- [ ] All form fields have unique `id` and `name` props
- [ ] Labels use `htmlFor` pointing to input ID
- [ ] Errors include `role="alert"` and `aria-live="polite"`
- [ ] Touch targets >= 44px (use `h-11` class)
- [ ] Semantic colors (`text-destructive`, `bg-muted`) — no hex codes
- [ ] `createFormResolver(schema)` instead of direct `zodResolver`
- [ ] `FormProgressProvider` wraps forms with progress tracking
- [ ] Required fields use `<FormFieldWrapper isRequired>`
- [ ] Wizard steps validate only current step fields via `trigger(fields)`
- [ ] Focus management after step transitions
- [ ] Keyboard shortcuts via `useFormShortcuts` hook
- [ ] `aria-controls` and `aria-expanded` on collapsible sections
- [ ] Screen reader announcements via `aria-live` for dynamic changes
- [ ] Submit buttons show loading state (`isSubmitting` from `useFormState`)
- [ ] Layout components use semantic `data-slot` attributes
