# Form Progress System — Implementation Guide

> **For developers implementing** form progress tracking in Crispy CRM
> **Based on:** `docs/architecture/form-ux-design-spec.md`
> **Created:** 2025-12-15

---

## Quick Reference

### Form Complexity → Pattern Mapping

| Form | Fields | Pattern | Progress Type | Priority |
|------|--------|---------|---------------|----------|
| **Activities** | ~4 | Enhancement | Simple bar | High (speed) |
| **Tasks** | ~5 | Enhancement | Simple bar | High (speed) |
| **Contacts** | ~8 | Enhancement | Section-based | High |
| **Organizations** | ~8 | Enhancement | Section-based | High |
| **Opportunities** | ~12 | Multi-step Wizard | Step-based | High (complexity) |

### Decision Tree

```
┌─ Is form ≤5 fields? ────────────────────→ Enhancement (simple bar)
│
├─ Is form 6-9 fields? ───────────────────→ Enhancement (section-based)
│
└─ Is form 10+ fields? ───────────────────→ Multi-step Wizard
      └─ Can fields be logically grouped
         into 3-4 steps? ─────────────────→ Yes: Wizard
                                           → No: Enhancement with sections
```

---

## Component Imports

### New Components to Create

```
src/components/admin/form/
├── FormProgressProvider.tsx    # Context for progress state
├── FormProgressBar.tsx         # Visual progress indicator
├── FormFieldWrapper.tsx        # Field with checkmark feedback
├── FormWizard.tsx              # Multi-step container
├── WizardStep.tsx              # Individual wizard step
└── WizardNavigation.tsx        # Previous/Next buttons
```

### Existing Components (Already Available)

```typescript
// Already in codebase - USE THESE
import { SimpleForm, FormToolbar } from "@/components/admin/simple-form";
import { FormSection } from "@/components/admin/form/FormSection";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
// ... other inputs
```

---

## Step-by-Step: Enhancement Pattern (Simple Forms)

### Step 1: Create FormProgressProvider

```typescript
// src/components/admin/form/FormProgressProvider.tsx
import * as React from "react";
import { createContext, useContext, useState, useCallback, useMemo } from "react";

interface FieldProgress {
  name: string;
  isValid: boolean;
  isRequired: boolean;
}

interface FormProgressContextValue {
  fields: Record<string, FieldProgress>;
  totalRequired: number;
  completedRequired: number;
  percentage: number;
  registerField: (name: string, isRequired: boolean) => void;
  markFieldValid: (name: string, isValid: boolean) => void;
}

const FormProgressContext = createContext<FormProgressContextValue | null>(null);

interface FormProgressProviderProps {
  children: React.ReactNode;
  initialProgress?: number; // Goal-Gradient: start at 10-15%
}

export function FormProgressProvider({
  children,
  initialProgress = 10
}: FormProgressProviderProps) {
  const [fields, setFields] = useState<Record<string, FieldProgress>>({});

  const registerField = useCallback((name: string, isRequired: boolean) => {
    setFields(prev => ({
      ...prev,
      [name]: { name, isValid: false, isRequired }
    }));
  }, []);

  const markFieldValid = useCallback((name: string, isValid: boolean) => {
    setFields(prev => ({
      ...prev,
      [name]: { ...prev[name], isValid }
    }));
  }, []);

  const { totalRequired, completedRequired, percentage } = useMemo(() => {
    const fieldList = Object.values(fields);
    const required = fieldList.filter(f => f.isRequired);
    const completed = required.filter(f => f.isValid);

    // Apply Goal-Gradient: never show 0%, start at initialProgress
    const rawPercentage = required.length > 0
      ? (completed.length / required.length) * 100
      : 0;
    const adjustedPercentage = rawPercentage === 0
      ? initialProgress
      : initialProgress + (rawPercentage * (100 - initialProgress) / 100);

    return {
      totalRequired: required.length,
      completedRequired: completed.length,
      percentage: Math.round(adjustedPercentage)
    };
  }, [fields, initialProgress]);

  const value = useMemo(() => ({
    fields,
    totalRequired,
    completedRequired,
    percentage,
    registerField,
    markFieldValid
  }), [fields, totalRequired, completedRequired, percentage, registerField, markFieldValid]);

  return (
    <FormProgressContext.Provider value={value}>
      {children}
    </FormProgressContext.Provider>
  );
}

export function useFormProgress() {
  const context = useContext(FormProgressContext);
  if (!context) {
    throw new Error("useFormProgress must be used within FormProgressProvider");
  }
  return context;
}
```

### Step 2: Create FormProgressBar

```typescript
// src/components/admin/form/FormProgressBar.tsx
import * as React from "react";
import { cn } from "@/lib/utils";
import { useFormProgress } from "./FormProgressProvider";

interface FormProgressBarProps {
  showStepInfo?: boolean;
  currentStep?: number;
  totalSteps?: number;
  stepName?: string;
  className?: string;
}

export function FormProgressBar({
  showStepInfo = true,
  currentStep,
  totalSteps,
  stepName,
  className
}: FormProgressBarProps) {
  const { percentage, completedRequired, totalRequired } = useFormProgress();

  // Generate aria-valuetext with context
  const valueText = showStepInfo && currentStep && totalSteps
    ? `Step ${currentStep} of ${totalSteps}: ${stepName}`
    : `${completedRequired} of ${totalRequired} required fields complete`;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Step info (if wizard) or field count */}
      {showStepInfo && (
        <div className="flex justify-between text-sm text-muted-foreground">
          {currentStep && totalSteps ? (
            <span>Step {currentStep} of {totalSteps}: {stepName}</span>
          ) : (
            <span>{completedRequired} of {totalRequired} required fields</span>
          )}
          <span className="tabular-nums">{percentage}%</span>
        </div>
      )}

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Form completion progress"
        aria-valuetext={valueText}
        className="h-2 w-full rounded-full bg-muted overflow-hidden"
      >
        <div
          className="h-full bg-primary transition-all duration-200 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

### Step 3: Create FormFieldWrapper

```typescript
// src/components/admin/form/FormFieldWrapper.tsx
import * as React from "react";
import { useEffect } from "react";
import { useFormState, useWatch } from "react-hook-form";
import { cn } from "@/lib/utils";
import { useFormProgress } from "./FormProgressProvider";
import { Check, X, Loader2 } from "lucide-react";

interface FormFieldWrapperProps {
  name: string;
  isRequired?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormFieldWrapper({
  name,
  isRequired = false,
  children,
  className
}: FormFieldWrapperProps) {
  const { registerField, markFieldValid } = useFormProgress();
  const { errors } = useFormState({ name });

  // Use useWatch for isolated re-renders (not watch())
  const value = useWatch({ name });

  // Register field on mount
  useEffect(() => {
    registerField(name, isRequired);
  }, [name, isRequired, registerField]);

  // Update validity when value or errors change
  useEffect(() => {
    const hasValue = value !== undefined && value !== null && value !== "";
    const hasError = !!errors[name];
    const isValid = hasValue && !hasError;
    markFieldValid(name, isValid);
  }, [name, value, errors, markFieldValid]);

  const error = errors[name];
  const hasValue = value !== undefined && value !== null && value !== "";
  const isValid = hasValue && !error;

  return (
    <div className={cn("relative", className)}>
      {children}

      {/* Completion indicator */}
      <div className="absolute right-3 top-9 flex items-center">
        {error ? (
          <X
            className="h-4 w-4 text-destructive"
            aria-hidden="true"
          />
        ) : isValid ? (
          <Check
            className="h-4 w-4 text-primary animate-in fade-in duration-100"
            aria-hidden="true"
          />
        ) : null}
      </div>
    </div>
  );
}
```

### Step 4: Integrate with Existing Form

```typescript
// Example: src/atomic-crm/contacts/ContactCreate.tsx
import { Create } from "@/components/admin/create";
import { SimpleForm } from "@/components/admin/simple-form";
import { FormSection } from "@/components/admin/form/FormSection";
import { TextInput } from "@/components/admin/text-input";
import {
  FormProgressProvider,
  FormProgressBar,
  FormFieldWrapper
} from "@/components/admin/form";

export function ContactCreate() {
  return (
    <Create>
      <FormProgressProvider initialProgress={10}>
        {/* Progress bar at top */}
        <FormProgressBar className="mb-6 px-6" />

        <SimpleForm mode="onBlur"> {/* NOT onChange - prevents re-render storms */}
          {/* Section 1: Name */}
          <FormSection title="Name">
            <FormFieldWrapper name="first_name" isRequired>
              <TextInput source="first_name" label="First Name" isRequired />
            </FormFieldWrapper>
            <FormFieldWrapper name="last_name" isRequired>
              <TextInput source="last_name" label="Last Name" isRequired />
            </FormFieldWrapper>
            <FormFieldWrapper name="title">
              <TextInput source="title" label="Title" />
            </FormFieldWrapper>
          </FormSection>

          {/* Section 2: Contact Info */}
          <FormSection title="Contact Information">
            <FormFieldWrapper name="email">
              <TextInput source="email" label="Email" type="email" />
            </FormFieldWrapper>
            <FormFieldWrapper name="phone">
              <TextInput source="phone" label="Phone" />
            </FormFieldWrapper>
          </FormSection>

          {/* Section 3: Organization */}
          <FormSection title="Organization">
            <FormFieldWrapper name="organization_id">
              <ReferenceInput source="organization_id" reference="organizations">
                <AutocompleteInput optionText="name" />
              </ReferenceInput>
            </FormFieldWrapper>
          </FormSection>
        </SimpleForm>
      </FormProgressProvider>
    </Create>
  );
}
```

---

## Step-by-Step: Wizard Pattern (Opportunities)

### Step 1: Create WizardStep Component

```typescript
// src/components/admin/form/WizardStep.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

interface WizardStepProps {
  stepNumber: number;
  title: string;
  isActive: boolean;
  isComplete: boolean;
  children: React.ReactNode;
  className?: string;
}

export function WizardStep({
  stepNumber,
  title,
  isActive,
  isComplete,
  children,
  className
}: WizardStepProps) {
  if (!isActive) return null;

  return (
    <div
      className={cn("space-y-6", className)}
      role="tabpanel"
      aria-labelledby={`step-${stepNumber}-trigger`}
      id={`step-${stepNumber}-panel`}
    >
      {/* Step heading - required for accessibility */}
      <h2 className="text-lg font-semibold text-foreground">
        Step {stepNumber}: {title}
      </h2>

      {children}
    </div>
  );
}
```

### Step 2: Create WizardNavigation Component

```typescript
// src/components/admin/form/WizardNavigation.tsx
import * as React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  canProceed?: boolean;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting = false,
  canProceed = true
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div
      className="flex justify-end gap-3 pt-6 border-t border-border"
      role="toolbar"
      aria-label="Form navigation"
    >
      {/* Previous button */}
      {!isFirstStep && (
        <Button
          type="button"
          variant="outline"
          onClick={onPrevious}
          className="h-11" // 44px touch target
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
      )}

      {/* Next or Submit button */}
      {isLastStep ? (
        <Button
          type="submit"
          onClick={onSubmit}
          disabled={isSubmitting || !canProceed}
          className="h-11" // 44px touch target
        >
          {isSubmitting ? "Saving..." : "Create Opportunity"}
        </Button>
      ) : (
        <Button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="h-11" // 44px touch target
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );
}
```

### Step 3: Create FormWizard Container

```typescript
// src/components/admin/form/FormWizard.tsx
import * as React from "react";
import { useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { FormProgressBar } from "./FormProgressBar";
import { WizardNavigation } from "./WizardNavigation";

interface WizardStepConfig {
  id: string;
  title: string;
  fields: string[]; // Field names for validation
}

interface FormWizardProps {
  steps: WizardStepConfig[];
  children: React.ReactNode;
  onSubmit: (data: unknown) => void;
  className?: string;
}

export function FormWizard({
  steps,
  children,
  onSubmit,
  className
}: FormWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const { trigger, getValues, formState } = useFormContext();

  // Validate current step before proceeding
  const validateCurrentStep = useCallback(async () => {
    const stepConfig = steps[currentStep - 1];
    const isValid = await trigger(stepConfig.fields);
    return isValid;
  }, [currentStep, steps, trigger]);

  const handleNext = useCallback(async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
      // Focus first field in new step (accessibility)
      setTimeout(() => {
        const firstInput = document.querySelector(
          `#step-${currentStep + 1}-panel input, #step-${currentStep + 1}-panel select`
        ) as HTMLElement;
        firstInput?.focus();
      }, 100);
    }
  }, [currentStep, steps.length, validateCurrentStep]);

  const handlePrevious = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(async () => {
    const isValid = await trigger(); // Validate all fields
    if (isValid) {
      onSubmit(getValues());
    }
  }, [trigger, getValues, onSubmit]);

  const currentStepConfig = steps[currentStep - 1];

  return (
    <div className={cn("space-y-6", className)}>
      {/* Step indicator */}
      <StepIndicator
        steps={steps}
        currentStep={currentStep}
      />

      {/* Progress bar */}
      <FormProgressBar
        showStepInfo
        currentStep={currentStep}
        totalSteps={steps.length}
        stepName={currentStepConfig.title}
      />

      {/* Announce step changes to screen readers */}
      <div aria-live="polite" className="sr-only">
        Step {currentStep} of {steps.length}: {currentStepConfig.title}
      </div>

      {/* Step content - children should be WizardStep components */}
      {children}

      {/* Navigation */}
      <WizardNavigation
        currentStep={currentStep}
        totalSteps={steps.length}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onSubmit={handleSubmit}
        isSubmitting={formState.isSubmitting}
      />
    </div>
  );
}

// Step indicator dots/circles
function StepIndicator({
  steps,
  currentStep
}: {
  steps: WizardStepConfig[];
  currentStep: number;
}) {
  return (
    <ol
      className="flex items-center justify-center gap-2"
      aria-label="Progress steps"
    >
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isComplete = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <li
            key={step.id}
            className="flex items-center"
            aria-current={isCurrent ? "step" : undefined}
          >
            {/* Connector line */}
            {index > 0 && (
              <div
                className={cn(
                  "w-12 h-0.5 mr-2",
                  isComplete ? "bg-primary" : "bg-muted"
                )}
              />
            )}

            {/* Step circle */}
            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                isComplete && "bg-primary text-primary-foreground",
                isCurrent && "border-2 border-primary text-primary",
                !isComplete && !isCurrent && "border-2 border-muted text-muted-foreground"
              )}
            >
              {isComplete ? "✓" : stepNumber}
            </div>

            {/* Step label (visible on larger screens) */}
            <span className="ml-2 text-sm hidden md:block">
              {step.title}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
```

### Step 4: Implement Opportunity Create Form

```typescript
// Example: src/atomic-crm/opportunities/OpportunityCreate.tsx
import { Create } from "@/components/admin/create";
import { Form } from "ra-core";
import {
  FormProgressProvider,
  FormWizard,
  WizardStep,
  FormFieldWrapper
} from "@/components/admin/form";
import { TextInput } from "@/components/admin/text-input";
import { SelectInput } from "@/components/admin/select-input";
import { ReferenceInput, AutocompleteInput } from "react-admin";

const WIZARD_STEPS = [
  { id: "basic", title: "Basic Information", fields: ["name", "stage", "expected_close_date"] },
  { id: "principal", title: "Principal", fields: ["principal_id"] },
  { id: "details", title: "Details", fields: ["value", "probability", "distributor_id"] },
  { id: "notes", title: "Notes", fields: ["description", "next_steps"] }
];

export function OpportunityCreate() {
  const handleSubmit = async (data: unknown) => {
    // Submit to data provider
    console.log("Submitting:", data);
  };

  return (
    <Create>
      <FormProgressProvider initialProgress={15}>
        <Form mode="onBlur">
          <FormWizard steps={WIZARD_STEPS} onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            <WizardStep stepNumber={1} title="Basic Information" isActive={true} isComplete={false}>
              <FormFieldWrapper name="name" isRequired>
                <TextInput source="name" label="Opportunity Name" isRequired />
              </FormFieldWrapper>
              <FormFieldWrapper name="stage" isRequired>
                <SelectInput
                  source="stage"
                  label="Stage"
                  choices={PIPELINE_STAGES}
                  isRequired
                />
              </FormFieldWrapper>
              <FormFieldWrapper name="expected_close_date" isRequired>
                <DateInput source="expected_close_date" label="Expected Close" isRequired />
              </FormFieldWrapper>
            </WizardStep>

            {/* Step 2: Principal */}
            <WizardStep stepNumber={2} title="Principal" isActive={false} isComplete={false}>
              <FormFieldWrapper name="principal_id" isRequired>
                <ReferenceInput source="principal_id" reference="organizations" filter={{ type: "principal" }}>
                  <AutocompleteInput optionText="name" />
                </ReferenceInput>
              </FormFieldWrapper>
              <FormFieldWrapper name="products">
                <TextInput source="products" label="Products" multiline />
              </FormFieldWrapper>
            </WizardStep>

            {/* Step 3: Details */}
            <WizardStep stepNumber={3} title="Details" isActive={false} isComplete={false}>
              <FormFieldWrapper name="value">
                <NumberInput source="value" label="Value ($)" />
              </FormFieldWrapper>
              <FormFieldWrapper name="probability">
                <NumberInput source="probability" label="Probability (%)" min={0} max={100} />
              </FormFieldWrapper>
              <FormFieldWrapper name="distributor_id">
                <ReferenceInput source="distributor_id" reference="organizations" filter={{ type: "distributor" }}>
                  <AutocompleteInput optionText="name" />
                </ReferenceInput>
              </FormFieldWrapper>
            </WizardStep>

            {/* Step 4: Notes */}
            <WizardStep stepNumber={4} title="Notes" isActive={false} isComplete={false}>
              <FormFieldWrapper name="description">
                <TextInput source="description" label="Description" multiline rows={4} />
              </FormFieldWrapper>
              <FormFieldWrapper name="next_steps">
                <TextInput source="next_steps" label="Next Steps" multiline rows={3} />
              </FormFieldWrapper>
            </WizardStep>
          </FormWizard>
        </Form>
      </FormProgressProvider>
    </Create>
  );
}
```

---

## Common Patterns

### Validation Timing: "Reward Early, Punish Late"

```typescript
// In SimpleForm or FormWizard
<SimpleForm mode="onBlur"> {/* Validate on blur, not every keystroke */}

// For async validation (email uniqueness, etc.)
const validateEmail = async (value: string) => {
  // Debounce is handled by React Hook Form
  const response = await checkEmailExists(value);
  return response.exists ? "Email already in use" : undefined;
};

<TextInput
  source="email"
  validate={validateEmail}
  validateDebounce={700} // 700ms debounce for async
/>
```

### Section Completion Indicator

```typescript
// Enhanced FormSection with completion state
import { useFormProgress } from "./FormProgressProvider";

export function FormSectionWithProgress({
  title,
  fields, // Array of field names in this section
  children
}: FormSectionWithProgressProps) {
  const { fields: fieldProgress } = useFormProgress();

  const sectionFields = fields.map(name => fieldProgress[name]).filter(Boolean);
  const requiredFields = sectionFields.filter(f => f.isRequired);
  const completedRequired = requiredFields.filter(f => f.isValid);
  const isComplete = requiredFields.length > 0 &&
                     completedRequired.length === requiredFields.length;

  return (
    <FormSection title={title}>
      {/* Completion badge */}
      {isComplete && (
        <span className="text-xs text-primary font-medium">
          ✓ Complete
        </span>
      )}
      {children}
    </FormSection>
  );
}
```

### Help Tooltips

```typescript
// Add help tooltip to FormFieldWrapper
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FormFieldWrapperProps {
  // ... existing props
  helpText?: string;
}

// Inside FormFieldWrapper render:
{helpText && (
  <Tooltip delayDuration={200}> {/* Doherty-compliant */}
    <TooltipTrigger asChild>
      <button
        type="button"
        className="h-11 w-11 flex items-center justify-center -mr-3" // 44px touch target
        aria-label={`Help: ${helpText}`}
      >
        <HelpCircle className="h-4 w-4 text-muted-foreground" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="right" className="max-w-xs">
      {helpText}
    </TooltipContent>
  </Tooltip>
)}
```

---

## Troubleshooting

### Problem: Progress bar not updating

**Cause:** Field not registered with FormProgressProvider

**Solution:**
```typescript
// Ensure FormFieldWrapper wraps every field
<FormFieldWrapper name="field_name" isRequired={true}>
  <TextInput source="field_name" />
</FormFieldWrapper>

// NOT this (field won't be tracked):
<TextInput source="field_name" />
```

### Problem: Re-render storms / slow typing

**Cause:** Using `mode="onChange"` instead of `mode="onBlur"`

**Solution:**
```typescript
// ❌ WRONG - validates on every keystroke
<SimpleForm mode="onChange">

// ✅ CORRECT - validates on blur
<SimpleForm mode="onBlur">

// Also use useWatch, not watch()
const value = useWatch({ name: "fieldName" }); // ✅ Isolated re-render
const { watch } = useFormContext();
const value = watch("fieldName"); // ❌ Re-renders entire form
```

### Problem: Screen reader not announcing step changes

**Cause:** Missing aria-live region

**Solution:**
```typescript
// Add aria-live region to FormWizard
<div aria-live="polite" className="sr-only">
  Step {currentStep} of {totalSteps}: {stepName}
</div>
```

### Problem: Focus not moving to first field on step change

**Cause:** Focus management not implemented

**Solution:**
```typescript
// In handleNext callback:
const handleNext = async () => {
  if (await validateCurrentStep()) {
    setCurrentStep(prev => prev + 1);

    // Focus first input in new step
    setTimeout(() => {
      const panel = document.getElementById(`step-${currentStep + 1}-panel`);
      const firstInput = panel?.querySelector("input, select, textarea") as HTMLElement;
      firstInput?.focus();
    }, 100); // Allow DOM to update
  }
};
```

### Problem: Checkmarks appearing too early

**Cause:** Validation running before user finishes typing

**Solution:**
```typescript
// Ensure onBlur mode and proper async debounce
<SimpleForm mode="onBlur">
  <TextInput
    source="email"
    validate={asyncValidator}
    validateDebounce={700} // Wait 700ms after typing stops
  />
</SimpleForm>
```

---

## Testing Checklist

### Unit Tests (Vitest)

- [ ] `FormProgressProvider` tracks field registration
- [ ] `FormProgressProvider` calculates percentage correctly
- [ ] `FormProgressProvider` applies Goal-Gradient (starts at 10-15%)
- [ ] `FormProgressBar` renders correct ARIA attributes
- [ ] `FormFieldWrapper` shows checkmark when valid
- [ ] `FormFieldWrapper` shows error icon when invalid
- [ ] `WizardStep` only renders when active
- [ ] `WizardNavigation` disables Previous on first step
- [ ] `WizardNavigation` shows Submit on last step

### Integration Tests

- [ ] Progress bar updates when field validated
- [ ] Section completion indicator shows when all required fields valid
- [ ] Wizard advances on Next when current step valid
- [ ] Wizard blocks Next when current step invalid
- [ ] Focus moves to first field on step change
- [ ] Form submits only from final wizard step

### Accessibility Tests (Playwright)

- [ ] Progress bar has role="progressbar"
- [ ] aria-valuenow updates with percentage
- [ ] aria-valuetext provides meaningful context
- [ ] aria-invalid set on invalid fields
- [ ] Error messages have role="alert"
- [ ] aria-current="step" on current wizard step
- [ ] Keyboard navigation works (Tab through all fields)
- [ ] Screen reader announces step changes

### Manual Testing

- [ ] iPad Pro (12.9"): Touch targets are 44x44px minimum
- [ ] iPad Air (10.9"): Forms remain usable
- [ ] Desktop (1440px+): Layout fills available space appropriately
- [ ] Completion <30 sec for Activities/Tasks forms
- [ ] Completion 2-3 min for Opportunities wizard

---

## File Locations

### New Files to Create

```
src/components/admin/form/
├── FormProgressProvider.tsx      # Progress state context
├── FormProgressBar.tsx           # Visual progress indicator
├── FormFieldWrapper.tsx          # Field with completion feedback
├── FormWizard.tsx                # Multi-step wizard container
├── WizardStep.tsx                # Individual wizard step
├── WizardNavigation.tsx          # Previous/Next/Submit buttons
├── index.ts                      # Export all new components
└── __tests__/
    ├── FormProgressProvider.test.tsx
    ├── FormProgressBar.test.tsx
    ├── FormFieldWrapper.test.tsx
    └── FormWizard.test.tsx
```

### Existing Files to Modify

```
src/atomic-crm/contacts/ContactCreate.tsx    # Add progress tracking
src/atomic-crm/organizations/OrganizationCreate.tsx
src/atomic-crm/opportunities/OpportunityCreate.tsx  # Convert to wizard
src/atomic-crm/activities/ActivityCreate.tsx
src/atomic-crm/tasks/TaskCreate.tsx
```

### Configuration Files (No Changes Needed)

```
src/components/admin/form/FormSection.tsx    # Already exists, NO collapse
src/components/admin/simple-form.tsx         # Already supports mode prop
tailwind.config.ts                           # Semantic tokens already defined
```

---

## Implementation Priority

| Phase | Week | Components | Forms |
|-------|------|------------|-------|
| **1** | Week 1 | FormProgressProvider, FormProgressBar, FormFieldWrapper | Activities, Tasks |
| **2** | Week 2 | Section completion indicators | Contacts, Organizations |
| **3** | Week 3 | FormWizard, WizardStep, WizardNavigation | Opportunities |
| **4** | Week 4 | Polish, accessibility audit, iPad testing | All forms |

---

**Implementation guide based on:**
- `docs/architecture/form-ux-design-spec.md`
- `docs/architecture/form-ux-research-findings.md`
- Existing codebase patterns in `src/components/admin/`
