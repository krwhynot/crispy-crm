# Forms & Validation Standards Implementation Plan

> **For Executing Agent:**
> 1. **FIRST:** Read `CLAUDE.md` in project root for engineering principles
> 2. **VERIFY:** Most patterns are already implemented - this plan is primarily DOCUMENTATION + MINOR FIXES
> 3. Follow tasks exactly. Do not improvise. Zero context assumed.

**Goal:** Formalize Forms & Validation standards, fix remaining accessibility gaps, and create reference documentation.

---

## Current State Assessment

### What's Already Compliant ✅

The codebase has a **mature form infrastructure**. Do NOT change these patterns:

| Pattern | Location | Status |
|---------|----------|--------|
| Schema-derived defaults | `schema.partial().parse({})` in Create forms | ✅ Already implemented |
| API boundary validation | `unifiedDataProvider.ts` | ✅ Already implemented |
| `aria-invalid` on inputs | `form-primitives.tsx:93` | ✅ Already implemented |
| `aria-describedby` linking | `form-primitives.tsx:92` | ✅ Already implemented |
| Error summary with `role="alert"` | `FormErrorSummary.tsx:121` | ✅ Already implemented |
| Semantic error colors | `text-destructive` | ✅ Already implemented |
| Server error injection | `setSubmissionErrors` in SaveButton | ✅ Already implemented |
| Zod schemas per domain | `src/atomic-crm/validation/*.ts` | ✅ Already implemented |

### Gaps Identified 🔶

| Gap | Severity | Task |
|-----|----------|------|
| `FormError` missing `role="alert"` | Medium (a11y) | Task 1 |
| No instant client-side validation | Low (UX) | Task 2 (Optional) |
| Standards documentation missing | Medium (DX) | Task 3 |
| Inconsistent FormErrorSummary usage | Low | Task 4 |

---

## Architecture Verdict

**"Validation at API boundary only"** is **CORRECT** and should remain the primary pattern.

**Clarification for developers:**
- ✅ Zod schemas in `/validation/` are the source of truth
- ✅ `unifiedDataProvider` validates all data before persistence
- ✅ Forms CAN use `zodResolver` for instant UX feedback (optional enhancement)
- ❌ Do NOT add custom validation logic inside form components
- ❌ Do NOT trust client-side validation for security

---

## Constitution Principles In Play

- [x] Error handling (fail fast - NO retry logic)
- [x] Validation (Zod at API boundary only) - ALREADY CORRECT
- [x] Form state (derived from schema) - ALREADY CORRECT
- [x] Data access (unified provider only) - ALREADY CORRECT
- [x] Types (`interface` for objects, `type` for unions)

---

## Task Dependencies

| Task | Depends On | Can Parallelize With |
|------|------------|---------------------|
| 1    | None       | 3, 4                |
| 2    | None       | 3, 4                |
| 3    | None       | 1, 2, 4             |
| 4    | 1          | 3                   |
| 5    | All above  | None                |

---

## GROUP A: ACCESSIBILITY FIXES

### Task 1: Add `role="alert"` to FormError Component

**Depends on:** None - can start immediately

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Not applicable - accessibility fix only
- [x] Not applicable
- [x] Not applicable
- [x] Not applicable

**Files:**
- Modify: `src/components/admin/form/form-primitives.tsx` (lines 112-130)
- Test: `src/components/admin/__tests__/form.test.tsx` (update)

**Current State (verified):**
```typescript
// Lines 112-130 - FormError component missing role="alert"
const FormError = ({ className, ...props }: React.ComponentProps<"p">) => {
  const { invalid, error, formMessageId } = useFormField();

  const err = error?.root?.message ?? error?.message;
  if (!invalid || !err) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      <ValidationError error={err} />
    </p>
  );
};
```

**Step 1: Write failing test**

Add to `src/components/admin/__tests__/form.test.tsx`:

```typescript
test("FormError has role='alert' for screen reader announcements", async () => {
  const TestForm = () => {
    const { setError } = useFormContext();
    React.useEffect(() => {
      setError("test", { type: "manual", message: "Test error" });
    }, [setError]);

    return (
      <FormField id="test" name="test">
        <FormLabel>Test</FormLabel>
        <FormControl>
          <input />
        </FormControl>
        <FormError />
      </FormField>
    );
  };

  render(
    <FormProvider {...useForm()}>
      <TestForm />
    </FormProvider>
  );

  await waitFor(() => {
    const errorMessage = screen.getByRole("alert");
    expect(errorMessage).toHaveTextContent("Test error");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test -- src/components/admin/__tests__/form.test.tsx
```

Expected: FAIL - no element with role="alert"

**Step 3: Implement fix**

Edit `src/components/admin/form/form-primitives.tsx` lines 120-129:

```typescript
// BEFORE
return (
  <p
    data-slot="form-message"
    id={formMessageId}
    className={cn("text-destructive text-sm", className)}
    {...props}
  >
    <ValidationError error={err} />
  </p>
);

// AFTER
return (
  <p
    data-slot="form-message"
    id={formMessageId}
    role="alert"
    aria-live="polite"
    className={cn("text-destructive text-sm", className)}
    {...props}
  >
    <ValidationError error={err} />
  </p>
);
```

**Why `aria-live="polite"` instead of `"assertive"`:**
- Field-level errors should not interrupt screen reader users
- `polite` waits for current speech to finish
- `assertive` is reserved for critical/blocking errors (use in FormErrorSummary)

**Step 4: Verify test passes**

```bash
npm test -- src/components/admin/__tests__/form.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/admin/form/form-primitives.tsx src/components/admin/__tests__/form.test.tsx
git commit -m "fix(a11y): add role='alert' to FormError for screen reader announcements

WCAG 3.3.1 requires programmatic identification of errors.
role='alert' ensures screen readers announce field errors.
aria-live='polite' avoids interrupting users during typing."
```

---

### Task 2: Add zodResolver for Instant UX Feedback (OPTIONAL)

**Depends on:** None - can start immediately

**IMPORTANT:** This is an OPTIONAL enhancement. The current pattern (submit-time validation) is valid.

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Validation still at API boundary - this is UX only
- [x] Form state derived from schema - maintains pattern
- [x] Uses unified provider - no change
- [x] Not applicable

**Files:**
- Modify: `src/atomic-crm/contacts/ContactCreate.tsx` (example form)
- No new dependencies - `@hookform/resolvers` already in package.json

**Current Pattern (valid, keep as option):**
```typescript
// Validation happens on submit via unifiedDataProvider
<Form defaultValues={formDefaults}>
  <ContactInputs />
</Form>
```

**Enhanced Pattern (instant feedback):**
```typescript
import { zodResolver } from "@hookform/resolvers/zod";
import { contactBaseSchema } from "../validation/contacts";

// Add resolver for instant validation feedback
<Form
  defaultValues={formDefaults}
  resolver={zodResolver(contactBaseSchema)}
  mode="onTouched"  // Validate on blur, then on change
>
  <ContactInputs />
</Form>
```

**Trade-offs:**
| Aspect | Current (submit-time) | With zodResolver |
|--------|----------------------|------------------|
| UX feedback | On submit only | Instant on blur |
| Re-renders | Minimal | More (on validation) |
| Complexity | Simpler | Slightly more |
| Security | Same (API validates) | Same (API validates) |

**Recommendation:** Add zodResolver to forms with complex validation (Opportunity, Contact) but not simple forms (Note, Tag).

**Step 1: Identify candidate forms**

Forms that would benefit from instant validation:
- `ContactCreate.tsx` / `ContactEdit.tsx` - Many fields, email validation
- `OpportunityCreate.tsx` / `OpportunityEdit.tsx` - Business rules
- `OrganizationCreate.tsx` / `OrganizationEdit.tsx` - URL validation

Forms that DON'T need it:
- `TaskCreate.tsx` - Simple form
- `NoteCreate.tsx` - Single field
- `TagCreateModal.tsx` - Single field

**Step 2: Test with ContactCreate as pilot**

Edit `src/atomic-crm/contacts/ContactCreate.tsx`:

```typescript
// Add import
import { zodResolver } from "@hookform/resolvers/zod";

// Update Form component (around line 47)
<Form
  defaultValues={formDefaults}
  resolver={zodResolver(contactBaseSchema)}
  mode="onTouched"
>
```

**Step 3: Manual verification**

```bash
npm run dev
# Navigate to /contacts/create
# Test: Tab through fields, verify errors appear on blur
# Test: Fix error, verify it clears
# Test: Submit still works
```

**Step 4: Commit (if approved)**

```bash
git add src/atomic-crm/contacts/ContactCreate.tsx
git commit -m "feat(ux): add zodResolver for instant validation feedback in ContactCreate

Optional enhancement per Forms & Validation Standards.
Validation still happens at API boundary - this is UX only.
mode='onTouched' validates on blur first, then on change."
```

---

## GROUP B: DOCUMENTATION

### Task 3: Create Forms & Validation Standards Document

**Depends on:** None - can start immediately

**Constitution Check:**
- [x] Documentation only - no code changes

**Files:**
- Create: `docs/standards/forms-validation.md`

**Step 1: Create standards directory**

```bash
mkdir -p docs/standards
```

**Step 2: Write standards document**

Create `docs/standards/forms-validation.md`:

```markdown
# Forms & Validation Standards

> Last updated: 2025-12-03
> Stack: React Hook Form 7.66.1 + Zod 4.1.12 + @hookform/resolvers 5.2.2

## Core Principles

1. **Backend is Source of Truth** - API boundary validation is authoritative
2. **Fail Fast** - Errors surface immediately, no silent failures
3. **Single Schema, Dual Purpose** - Zod schemas shared frontend/backend
4. **Accessibility Non-Negotiable** - WCAG 2.1 AA compliance required
5. **Errors are Guidance** - Tell users what's wrong AND how to fix it

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Form Component                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │ defaultValues: schema.partial().parse({})       │    │
│  │ resolver: zodResolver(schema)  [OPTIONAL]       │    │
│  │ mode: 'onTouched'              [OPTIONAL]       │    │
│  └─────────────────────────────────────────────────┘    │
│                          │                               │
│                    [Submit]                              │
│                          ▼                               │
├─────────────────────────────────────────────────────────┤
│                 unifiedDataProvider                      │
│  ┌─────────────────────────────────────────────────┐    │
│  │ Zod validation (AUTHORITATIVE)                  │    │
│  │ Business rules (uniqueness, permissions)        │    │
│  │ Server error → setError() → field-level errors  │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## Must-Follow Rules

| Rule | Rationale |
|------|-----------|
| **Schemas in `/validation/`** | Single source of truth |
| **Defaults via `.partial().parse({})`** | Form state derived from schema |
| **No custom validation in forms** | Validation at API boundary only |
| **`aria-invalid` on invalid fields** | WCAG 3.3.1 compliance |
| **`role="alert"` on error messages** | Screen reader announcements |
| **`text-destructive` for errors** | Semantic color tokens |

## Validation Responsibilities

| Validation Type | Where | Example |
|-----------------|-------|---------|
| Required fields | Form (UX) + API | `z.string().min(1)` |
| Format checks | Form (UX) + API | `z.string().email()` |
| Uniqueness | API ONLY | "Email already exists" |
| Business rules | API ONLY | "Cannot close without activities" |
| Permissions | API ONLY | "Not authorized" |

## Form Component Template

```typescript
import { CreateBase, Form, useNotify, useRedirect } from "ra-core";
import { zodResolver } from "@hookform/resolvers/zod"; // Optional
import { mySchema } from "../validation/myEntity";

const MyCreate = () => {
  const notify = useNotify();
  const redirect = useRedirect();

  // Defaults from schema (Constitution #5)
  const formDefaults = {
    ...mySchema.partial().parse({}),
    // Add identity-based defaults
  };

  return (
    <CreateBase redirect="list">
      <Form
        defaultValues={formDefaults}
        resolver={zodResolver(mySchema)} // Optional: instant UX
        mode="onTouched"                 // Optional: validate on blur
      >
        <MyInputs />
        <FormToolbar />
      </Form>
    </CreateBase>
  );
};
```

## Error Handling

### Field-Level Errors
```typescript
// Automatically handled by FormError component
<FormField id="email" name="email">
  <FormLabel>Email</FormLabel>
  <FormControl>
    <Input {...register("email")} />
  </FormControl>
  <FormError /> {/* Displays error with role="alert" */}
</FormField>
```

### Form-Level Errors
```typescript
import { FormErrorSummary } from "@/components/admin/FormErrorSummary";
import { useFormState } from "react-hook-form";

const MyForm = () => {
  const { errors } = useFormState();

  return (
    <>
      <FormErrorSummary errors={errors} />
      {/* ... form fields ... */}
    </>
  );
};
```

### Server Errors
```typescript
// SaveButton automatically maps server errors to fields via setSubmissionErrors
// API should return: { errors: { fieldName: "message" } }
```

## API Error Response Format

```typescript
interface ApiValidationError {
  status: 400;
  code: "VALIDATION_ERROR";
  message: string;
  errors: Array<{
    field: string | null;  // null = global error
    code: string;
    message: string;
  }>;
}
```

## Accessibility Checklist

- [ ] `aria-invalid={!!error}` on input (automatic via FormControl)
- [ ] `aria-describedby` linking input to error (automatic via FormControl)
- [ ] `role="alert"` on error messages (automatic via FormError)
- [ ] `text-destructive` for error styling (semantic token)
- [ ] Focus management on submit errors
- [ ] FormErrorSummary for forms with many fields

## References

- [React Hook Form Docs](https://react-hook-form.com/)
- [Zod Docs](https://zod.dev/)
- [WCAG 3.3 Input Assistance](https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html)
- [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
```

**Step 3: Commit**

```bash
git add docs/standards/forms-validation.md
git commit -m "docs: add Forms & Validation Standards reference

Formalizes existing patterns and industry best practices.
Includes architecture diagram, templates, and a11y checklist."
```

---

### Task 4: Audit Forms for Consistency

**Depends on:** Task 1 (FormError fix)

**Constitution Check:**
- [x] Audit only - document findings

**Files:**
- Read only - generate report

**Step 1: Run consistency audit**

Check each Create form for pattern compliance:

```bash
# Check for schema-derived defaults
grep -l "schema.partial().parse" src/atomic-crm/*/\*Create.tsx

# Check for FormErrorSummary usage
grep -l "FormErrorSummary" src/atomic-crm/*/\*Create.tsx
```

**Step 2: Document findings**

| Form | Schema Defaults | FormErrorSummary | zodResolver |
|------|-----------------|------------------|-------------|
| ContactCreate | ✅ Yes | ❓ Check | ❓ Optional |
| OrganizationCreate | ✅ Yes | ❓ Check | ❓ Optional |
| OpportunityCreate | ✅ Yes | ❓ Check | ❓ Optional |
| TaskCreate | ✅ Yes | ❓ Check | ❓ Not needed |
| ActivityCreate | ✅ Yes | ❓ Check | ❓ Not needed |
| ProductCreate | ❓ Check | ❓ Check | ❓ Not needed |
| NoteCreate | ❓ Check | ❓ Check | ❓ Not needed |
| SalesCreate | ❓ Check | ❓ Check | ❓ Not needed |

**Step 3: Create remediation tasks if needed**

For any forms missing schema defaults, create follow-up tasks.

---

## GROUP C: VERIFICATION

### Task 5: Run Full Test Suite and Accessibility Audit

**Depends on:** All above tasks

**Files:**
- No modifications - verification only

**Step 1: Run unit tests**

```bash
npm test
```

Expected: All tests pass

**Step 2: Run TypeScript type check**

```bash
npx tsc --noEmit
```

Expected: No type errors

**Step 3: Run accessibility audit on forms**

```bash
npm run dev
# Open Chrome DevTools → Lighthouse → Accessibility
# Test: /contacts/create, /opportunities/create, /tasks/create
```

Expected: No accessibility violations related to forms

**Step 4: Manual screen reader test**

Using VoiceOver (Mac) or NVDA (Windows):
1. Navigate to /contacts/create
2. Tab through fields
3. Submit with empty required fields
4. Verify: Screen reader announces errors

**Step 5: Build verification**

```bash
npm run build
```

Expected: Build succeeds with no errors

---

## Files Modified Summary

### Group A: Accessibility
1. `src/components/admin/form/form-primitives.tsx` - Add role="alert"
2. `src/components/admin/__tests__/form.test.tsx` - Add test

### Group B: Documentation
3. `docs/standards/forms-validation.md` - New file

### Optional Enhancements
4. `src/atomic-crm/contacts/ContactCreate.tsx` - zodResolver (if approved)

---

## Acceptance Criteria

| Fix | Acceptance Criteria |
|-----|---------------------|
| FormError role="alert" | Screen reader announces field errors |
| zodResolver (optional) | Instant validation on blur without breaking submit |
| Standards doc | Developers can reference patterns |
| Consistency audit | All forms documented, issues tracked |

---

## References

**Industry Sources Used:**
- [React Hook Form - Schema Validation](https://react-hook-form.com/get-started#SchemaValidation)
- [React Hook Form - Accessibility](https://react-hook-form.com/advanced-usage#AccessibilityA11y)
- [React Hook Form - setError API](https://react-hook-form.com/docs/useform/seterror)
- [Zod - Error Customization](https://zod.dev/error-customization)
- [OWASP - Input Validation Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- [JSON:API - Error Objects](https://jsonapi.org/format/#errors)
- [WCAG 2.1 - Success Criterion 3.3.1](https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html)
