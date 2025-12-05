# Implementation Plan: Best Practices Alignment & Cleanup

**Date:** 2025-12-03
**Type:** Refactoring
**Scope:** Cross-feature
**Granularity:** Atomic (2-5 min tasks)
**Execution:** Hybrid (parallel groups + sequential dependencies)

---

## Executive Summary

Align codebase with `docs/decisions/forms-validation-best-practices.md` and `docs/decisions/adr-utilities-best-practices.md`. Clean up unused code and migrate from lodash to es-toolkit.

**Audit Results:**
- 20 form/validation violations found
- 87/100 utility compliance score
- 5 unused exports to remove
- es-toolkit migration opportunity (97% bundle reduction)

---

## Task Dependency Graph

```
Stage 1 (Parallel - No Dependencies)
├── [1.1] Add .max() to validation schemas
├── [1.2] Fix onChange mode violations
├── [1.3] Add ARIA attributes to form components
├── [1.4] Fix cmdk accessibility
├── [1.5] Fix sonner story durations
└── [1.6] Remove unused exports

Stage 2 (Parallel - No Dependencies)
├── [2.1] Change z.object() to z.strictObject() at API boundary
└── [2.2] Replace new Date() with parseISO()

Stage 3 (Sequential - Depends on Stage 1-2)
├── [3.1] Install es-toolkit
└── [3.2] Replace lodash imports with es-toolkit/compat

Stage 4 (Sequential - Final)
└── [4.1] Run tests and verify no regressions
```

---

## Stage 1: Parallel Tasks (No Dependencies)

### Task 1.1: Add .max() Constraints to String Fields

**Priority:** HIGH (DoS Prevention)
**Files to modify:**

#### 1.1.1 - activities.ts
**File:** `src/atomic-crm/validation/activities.ts`

```typescript
// Line ~74 - BEFORE:
subject: z.string().min(1, "Subject is required"),

// AFTER:
subject: z.string().min(1, "Subject is required").max(255, "Subject too long"),
```

```typescript
// Line ~104 - BEFORE:
attachments: z.array(z.string()).optional().nullable(),

// AFTER:
attachments: z.array(z.string().max(2048, "Attachment URL too long")).max(20, "Too many attachments").optional().nullable(),
```

```typescript
// Line ~425 - BEFORE:
subject: z.string().min(1, "Subject is required"),

// AFTER:
subject: z.string().min(1, "Subject is required").max(255, "Subject too long"),
```

#### 1.1.2 - opportunities.ts
**File:** `src/atomic-crm/validation/opportunities.ts`

```typescript
// Line ~92 - BEFORE:
name: z.string().min(1, "Opportunity name is required"),

// AFTER:
name: z.string().min(1, "Opportunity name is required").max(255, "Opportunity name too long"),
```

```typescript
// Line ~274 - BEFORE:
name: z.string().min(1, "Opportunity name is required"),

// AFTER:
name: z.string().min(1, "Opportunity name is required").max(255, "Opportunity name too long"),
```

#### 1.1.3 - products.ts
**File:** `src/atomic-crm/validation/products.ts`

```typescript
// Line ~30 - BEFORE:
export const productCategorySchema = z.string().min(1, "Category is required").default("beverages");

// AFTER:
export const productCategorySchema = z.string().min(1, "Category is required").max(100, "Category too long").default("beverages");
```

```typescript
// Line ~45 - BEFORE:
name: z.string().min(1, "Product name is required"),

// AFTER:
name: z.string().min(1, "Product name is required").max(255, "Product name too long"),
```

```typescript
// Line ~46 - BEFORE:
sku: z.string().min(1, "SKU is required"),

// AFTER:
sku: z.string().min(1, "SKU is required").max(50, "SKU too long"),
```

```typescript
// Line ~97 - BEFORE:
product_name: z.string().min(1, "Product name is required"),

// AFTER:
product_name: z.string().min(1, "Product name is required").max(255, "Product name too long"),
```

#### 1.1.4 - sales.ts
**File:** `src/atomic-crm/validation/sales.ts`

```typescript
// Line ~13 - BEFORE:
first_name: z.string().min(1, "First name is required"),

// AFTER:
first_name: z.string().min(1, "First name is required").max(100, "First name too long"),
```

```typescript
// Line ~14 - BEFORE:
last_name: z.string().min(1, "Last name is required"),

// AFTER:
last_name: z.string().min(1, "Last name is required").max(100, "Last name too long"),
```

**Verification:**
```bash
npm run build
npm run test -- --testPathPattern="validation"
```

---

### Task 1.2: Fix onChange Mode Violations

**Priority:** MEDIUM (Performance)

#### 1.2.1 - CloseOpportunityModal.tsx
**File:** `src/atomic-crm/opportunities/components/CloseOpportunityModal.tsx`

```typescript
// Line ~94 - BEFORE:
mode: "onChange", // Validate on change for immediate feedback

// AFTER:
mode: "onBlur", // Validate on blur for better performance
```

#### 1.2.2 - Test Files (Optional - Lower Priority)
These are test files where `onChange` may be intentional for testing validation behavior. Review and update if appropriate:

- `src/atomic-crm/organizations/OrganizationInputs.test.tsx` (line ~68)
- `src/components/admin/__tests__/form.test.tsx` (line ~53)
- `src/components/admin/__tests__/text-input.test.tsx` (line ~36)
- `src/components/admin/__tests__/select-input.test.tsx` (line ~37)

**Verification:**
```bash
npm run build
npm run test -- --testPathPattern="CloseOpportunityModal"
```

---

### Task 1.3: Add ARIA Attributes to Form Components

**Priority:** HIGH (Accessibility/WCAG)

> 📋 **WCAG 2.1 AA Requirements:**
> - `aria-invalid="true"` on inputs with validation errors
> - `aria-describedby` linking input to error message ID
> - `role="alert"` on error messages for screen reader announcements
> - `htmlFor` on labels matching input `id`

#### 1.3.1 - text-input.tsx
**File:** `src/components/admin/text-input.tsx`

**Required ARIA attributes for TextInput:**

```typescript
// BEFORE (approximate):
<Input
  {...field}
  id={id}
  placeholder={placeholder}
  // ... other props
/>

// AFTER - Full ARIA implementation:
<Input
  {...field}
  id={id}
  placeholder={placeholder}
  aria-invalid={fieldState.error ? "true" : "false"}
  aria-describedby={fieldState.error ? `${id}-error` : undefined}
  aria-required={required ? "true" : undefined}
  // ... other props
/>
```

Update FormError to include id and role:

```typescript
// BEFORE:
<FormError error={fieldState.error} />

// AFTER:
<FormError id={`${id}-error`} error={fieldState.error} />
```

#### 1.3.2 - form-primitives.tsx
**File:** `src/components/admin/form/form-primitives.tsx`

**FormError component must render with these attributes:**

```typescript
interface FormErrorProps {
  id?: string;
  error?: FieldError;
}

export function FormError({ id, error }: FormErrorProps) {
  if (!error?.message) return null;

  return (
    <span
      id={id}
      role="alert"
      aria-live="polite"
      className="text-destructive text-sm mt-1"
    >
      {error.message}
    </span>
  );
}
```

#### 1.3.3 - Apply to other input components (if applicable)

Check and update these components with the same pattern:
- `src/components/admin/select-input.tsx`
- `src/components/admin/date-input.tsx`
- `src/components/admin/number-input.tsx`

**ARIA Checklist for Each Input Component:**
- [ ] `aria-invalid={!!error}` on input element
- [ ] `aria-describedby` pointing to error element ID
- [ ] `aria-required` if field is required
- [ ] FormError has `id` prop matching `aria-describedby`
- [ ] FormError has `role="alert"`

**Verification:**
```bash
npm run build
npm run test -- --testPathPattern="text-input|form|select-input"

# Optional: Run accessibility audit
npx axe-core --include "form"
```

---

### Task 1.4: Fix cmdk Accessibility

**Priority:** MEDIUM (Accessibility)

**File:** `src/components/ui/command.tsx`

```typescript
// Line ~14 - Add label prop to CommandDialog:

// BEFORE:
const CommandDialog = ({ children, ...props }: DialogProps) => {
  return (
    <Dialog {...props}>

// AFTER:
interface CommandDialogProps extends DialogProps {
  label?: string;
}

const CommandDialog = ({ children, label = "Command Menu", ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props} aria-label={label}>
```

**Verification:**
```bash
npm run build
npm run test -- --testPathPattern="command"
```

---

### Task 1.5: Fix Sonner Story Durations (WCAG)

**Priority:** MEDIUM (Documentation/WCAG)

**File:** `src/components/ui/sonner.stories.tsx`

Update all story examples to use WCAG-compliant durations (5000ms minimum for actionable toasts):

```typescript
// Find all toast() calls with short durations and update:

// BEFORE:
toast("Event has been created", { duration: 1000 });

// AFTER:
toast("Event has been created", { duration: 5000 });
```

Add a comment explaining WCAG requirement:

```typescript
// WCAG 2.2.1 requires minimum 5 seconds for actionable toasts
// See: docs/decisions/adr-utilities-best-practices.md#sonner
```

**Verification:**
```bash
npm run storybook -- --smoke-test
```

---

### Task 1.6: Remove Unused Exports

**Priority:** LOW (Cleanup)

#### 1.6.1 - date-utils.ts
**File:** `src/lib/date-utils.ts`

Remove `parseDateOrThrow` function (unused):

```typescript
// DELETE this function entirely:
export function parseDateOrThrow(dateString: string): Date {
  // ... implementation
}
```

#### 1.6.2 - sanitization.ts
**File:** `src/lib/sanitization.ts`

Remove unused exports:

```typescript
// DELETE these functions:
export function useSanitizedHtml(...) { ... }
export function sanitizeBasicHtml(...) { ... }
```

#### 1.6.3 - color-types.ts
**File:** `src/lib/color-types.ts`

Remove unused constant:

```typescript
// DELETE:
export const HEX_TO_SEMANTIC_MAP = { ... };
```

#### 1.6.4 - render-admin.tsx
**File:** `src/tests/utils/render-admin.tsx`

Remove unused `flushPromises` export:

```typescript
// DELETE:
export async function flushPromises() { ... }
```

Also remove from `src/tests/utils/index.ts` if re-exported there.

**Verification:**
```bash
npm run build
npm run test
```

---

## Stage 2: Parallel Tasks (No Dependencies)

### Task 2.1: Change z.object() to z.strictObject() at API Boundary

**Priority:** MEDIUM (Security - Mass Assignment Prevention)

> ⚠️ **MIGRATION SAFETY:** `z.strictObject()` will **reject** data with unexpected fields.
> This is intentional for security but could cause runtime failures if APIs return extra fields.
> **Run regression tests before and after this change.**

**Pre-Migration Check:**
```bash
# Run existing tests to establish baseline
npm run test -- --testPathPattern="rpc|validation"
```

**File:** `src/atomic-crm/validation/rpc.ts`

```typescript
// Line ~88 - BEFORE:
export const checkAuthorizationResponseSchema = z.object({

// AFTER:
export const checkAuthorizationResponseSchema = z.strictObject({
```

```typescript
// Line ~126 - BEFORE (if applicable, verify line number):
export const someOtherResponseSchema = z.object({

// AFTER:
export const someOtherResponseSchema = z.strictObject({
```

**Post-Migration Verification:**
```bash
# Verify no regressions
npm run build
npm run test -- --testPathPattern="rpc|validation"

# If tests fail due to extra fields, use .passthrough() temporarily:
# z.object({...}).passthrough() // logs warning but doesn't fail
```

**Rollback (if needed):**
```bash
git checkout -- src/atomic-crm/validation/rpc.ts
```

---

### Task 2.2: Replace new Date() with parseISO()

**Priority:** MEDIUM (Best Practice)

**File:** `src/components/ui/relative-date.tsx`

```typescript
// BEFORE:
import { formatRelative } from 'date-fns';

// ...
formatRelative(new Date(date), new Date())

// AFTER:
import { formatRelative, parseISO, isValid } from 'date-fns';

// ...
const parsedDate = parseISO(date);
if (!isValid(parsedDate)) {
  return null; // or fallback
}
formatRelative(parsedDate, new Date())
```

**Note:** The codebase already has `parseDateSafely()` in `src/lib/date-utils.ts`. Consider using it:

```typescript
import { parseDateSafely } from '@/lib/date-utils';

const parsedDate = parseDateSafely(date);
if (!parsedDate) return null;
formatRelative(parsedDate, new Date())
```

**Verification:**
```bash
npm run build
npm run test -- --testPathPattern="relative-date"
```

---

## Stage 3: Sequential Tasks (Dependencies)

### Task 3.1: Install es-toolkit

**Priority:** HIGH (Bundle Size Optimization)
**Depends on:** Stage 1-2 complete

```bash
# Install es-toolkit
npm install es-toolkit

# Verify installation
npm ls es-toolkit
```

**Expected output:**
```
crispy-crm@x.x.x
└── es-toolkit@x.x.x
```

---

### Task 3.2: Replace lodash Imports with es-toolkit/compat

**Priority:** HIGH (Bundle Size Optimization)
**Depends on:** Task 3.1

Search for all lodash imports and replace:

```bash
# Find all lodash imports
grep -r "from 'lodash" src/
```

For each file found, replace:

```typescript
// BEFORE:
import get from 'lodash/get';
import set from 'lodash/set';
import isEqual from 'lodash/isEqual';

// AFTER:
import { get, set, isEqual } from 'es-toolkit/compat';
```

**Files to update (based on audit):**
1. Check each file importing from `lodash/*`
2. Replace with `es-toolkit/compat` equivalent

**Verification:**
```bash
npm run build
npm run test
```

---

### Task 3.3: es-toolkit Smoke Test

**Priority:** HIGH (Verify Migration Success)
**Depends on:** Task 3.2

> 🔍 **PURPOSE:** Verify es-toolkit/compat is fully compatible with existing lodash usage.

```bash
# 1. Type check - ensure no TS errors
npm run typecheck

# 2. Build - ensure bundler handles es-toolkit
npm run build

# 3. Full test suite - catch any behavioral differences
npm run test

# 4. Manual verification - check affected features work
# - Test any forms using lodash utilities (get/set/isEqual)
# - Verify no console errors in browser
```

**Success Criteria:**
- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm run build` completes successfully
- [ ] `npm run test` passes all tests
- [ ] No runtime errors in browser console

**Rollback (if smoke test fails):**
```bash
# Revert to lodash
npm uninstall es-toolkit
npm install lodash
git checkout -- src/  # Restore original imports
```

---

## Stage 4: Final Verification

### Task 4.1: Run Full Test Suite

**Priority:** CRITICAL
**Depends on:** All previous stages

```bash
# Run all tests
npm run test

# Run build
npm run build

# Run type check
npm run typecheck

# Expected: All passing, no regressions
```

---

## Verification Checklist

Before marking plan complete:

- [ ] All `.max()` constraints added to string fields
- [ ] `mode: 'onChange'` replaced with `onBlur` or `onSubmit`
- [ ] ARIA attributes added to form inputs
- [ ] cmdk has accessible label
- [ ] Sonner stories use 5000ms+ durations
- [ ] Unused exports removed
- [ ] RPC schemas use `z.strictObject()`
- [ ] `parseISO()` used instead of `new Date()`
- [ ] es-toolkit installed and lodash replaced
- [ ] All tests passing
- [ ] Build succeeds
- [ ] No TypeScript errors

---

## Constitution Compliance

Each task adheres to:

- [x] **Fail Fast:** No retry logic added
- [x] **Single Source of Truth:** Zod validation at API boundary only
- [x] **TypeScript:** Using `interface` for object shapes
- [x] **Design System:** Using semantic Tailwind colors
- [x] **Touch Targets:** 44x44px minimum maintained

---

## Risk Assessment

| Task | Risk | Mitigation |
|------|------|------------|
| es-toolkit migration | Breaking changes | Use `/compat` for 100% API compatibility. Rollback: `npm uninstall es-toolkit && npm install lodash` |
| ARIA attribute changes | UI regressions | Run E2E tests after |
| Removing unused code | Hidden dependencies | Verify with `npm run build` |
| z.strictObject() | Validation failures | Test with existing data |

---

## Estimated Effort

| Stage | Tasks | Parallel? | Est. Time |
|-------|-------|-----------|-----------|
| 1 | 6 tasks | Yes | 15-20 min |
| 2 | 2 tasks | Yes | 5-10 min |
| 3 | 3 tasks | No | 15-20 min |
| 4 | 1 task | No | 5 min |
| **Total** | 12 tasks | - | **40-55 min** |

---

*Generated: 2025-12-03*
*Plan Version: 1.0*
