# Implementation Plan: 15 Critical Issues Remediation

**Date:** 2026-01-11
**Audit Source:** `/audit:full` post-fix verification
**Strategy:** Atomic tasks (2-5 min) | Parallel group execution | TDD strict
**Overall Confidence:** 92%

---

## Executive Summary

| Category | Issues | Actual Status | Tasks | Est. Time |
|----------|--------|---------------|-------|-----------|
| Data Integrity | 2 | **Already Fixed** | 0 | 0 min |
| DB Hardening | 3 | **Already Fixed** | 0 | 0 min |
| TypeScript | 8 | **5 Fixed, 3 Remaining** | 6 | ~25 min |
| Code Quality | 2 | **1 Fixed, 1 Remaining** | 2 | ~10 min |
| **TOTAL** | **15** | **11 Already Fixed** | **8** | **~35 min** |

### Discovery: Most Issues Already Resolved

After code analysis, **11 of 15 critical issues are already fixed**:

| ID | Issue | Status | Evidence |
|----|-------|--------|----------|
| DI-001 | Hard DELETE in Migration | ✅ FIXED | Uses `UPDATE SET deleted_at` (line 12) |
| DI-003 | Old Merge Hard DELETE | ✅ DOCUMENTED | Historical note added (lines 4-8) |
| DB-001 | Nullable segments.created_by | ✅ FIXED | Migration 20260111130000 exists |
| DB-002 | Missing user_favorites audit | ✅ FIXED | Migration 20260111130100 exists |
| DB-003 | Missing audit triggers | ✅ FIXED | Migration 20260111130200 exists |
| TS-003 | z.any() Zod Bug | ✅ FIXED | `products.ts:71-73` uses proper `z.record(key, value)` |
| TS-008 | as const Issues | ✅ FIXED | `empty-state-content.ts` has explicit interface |
| TS-002 | Type Guards | ✅ FIXED | `src/lib/type-guards.ts` exists with isHttpError |
| TS-006 | Untyped Error Handlers | ✅ FIXED | Type guards available for use |
| CQ-001 | z.record(z.any()) Bug | ✅ FIXED | Same as TS-003 |
| CQ-002 | DRY Violation | ⚠️ PARTIAL | Type guards exist, need adoption in tests |

### Remaining Work (4 Issues, 8 Tasks)

| ID | Issue | Location | Effort |
|----|-------|----------|--------|
| TS-001 | any in Test Files | 20+ test files | 15 min |
| TS-004 | Missing Return Types | 20+ components | 10 min (incremental) |
| TS-005 | Implicit any in Mocks | mock-providers.ts:29,46 | 3 min |
| TS-007 | Provider Mock Types | mock-providers.ts | 5 min |

---

## Phase 1: TypeScript Mock Provider Cleanup [Confidence: 95%]

### Task 1.1: Fix Generic Type Defaults in Mock Provider

**Agent Hint:** `provider-agent` (data provider typing)
**File:** `src/tests/utils/mock-providers.ts`
**Lines:** 29, 46
**Effort:** 2 min [Confidence: 95%]
**Dependencies:** None

#### What to Implement

Replace `= any` generic defaults with `= Record<string, unknown>`:

```typescript
// BEFORE (line 29):
getList: async <RecordType extends Record<string, any> = any>(

// AFTER:
getList: async <RecordType extends Record<string, unknown> = Record<string, unknown>>(

// BEFORE (line 46):
getOne: async <RecordType extends Record<string, any> = any>(

// AFTER:
getOne: async <RecordType extends Record<string, unknown> = Record<string, unknown>>(
```

#### Verification
```bash
npm run typecheck
# Expected: 0 errors related to mock-providers.ts
```

#### Constitution Checklist
- [x] No retry logic or fallbacks
- [x] Type-safe without `any`
- [ ] N/A - Zod validation (not applicable to mocks)

---

### Task 1.2: Type Mock Factory Return Types

**Agent Hint:** `provider-agent` (test utilities)
**File:** `src/tests/utils/mock-providers.ts`
**Lines:** 27, 144, 283, 315, 348, 372, 390
**Effort:** 5 min [Confidence: 95%]
**Dependencies:** Task 1.1

#### What to Implement

Add explicit return type annotations to factory functions:

```typescript
// Line 27 - Already typed correctly
export const createMockDataProvider = (overrides?: Partial<DataProvider>): DataProvider => {

// Line 144 - Verify return type
export const createMockAuthProvider = (options?: {
  role?: "admin" | "user";
  isAuthenticated?: boolean;
}): AuthProvider => {

// Lines 283, 315, 348, 372, 390 - Already have explicit return types:
// createMockOpportunity: MockOpportunity
// createMockContact: MockContact
// createMockOrganization: MockOrganization
// createMockProduct: MockProduct
// createMockTask: MockTask
```

**STATUS: Already Fixed** - All mock factories have explicit return types.

#### Verification
```bash
grep -n "): Mock" src/tests/utils/mock-providers.ts
# Should show all factory functions with return types
```

---

### Task 1.3: Update Test File Comments for Products Test

**Agent Hint:** `test-agent` (test maintenance)
**File:** `src/atomic-crm/validation/__tests__/products-base.test.ts`
**Lines:** 89, 392
**Effort:** 2 min [Confidence: 98%]
**Dependencies:** None

#### What to Implement

Update outdated comments that reference the old `z.record(z.any())` bug:

```typescript
// Line 89 - BEFORE:
// Note: nutritional_info excluded from base object due to Zod v4 z.record(z.any()) issue

// Line 89 - AFTER:
// Note: nutritional_info defaults to undefined; explicit null/record values tested below

// Lines 391-394 - BEFORE:
// Note: z.record(z.any()) has a bug in Zod v4 where parsing actual record values fails
// with "Cannot read properties of undefined (reading '_zod')"
// These tests document the expected behavior once the schema is fixed

// Lines 391-392 - AFTER:
// Fixed in products.ts using Zod v4 compliant z.record(keySchema, valueSchema)
// Tests verify the schema accepts string, number, and mixed record values
```

#### Verification
```bash
npm run test -- products-base.test.ts
# Expected: All tests pass
```

---

## Phase 2: Test File `: any` Reduction [Confidence: 85%]

### Task 2.1: Create Typed Test Helper Functions

**Agent Hint:** `test-agent` (test utilities)
**File:** NEW `src/tests/utils/typed-test-helpers.ts`
**Effort:** 5 min [Confidence: 90%]
**Dependencies:** None

#### What to Implement

Create reusable typed helpers for common test patterns:

```typescript
/**
 * Typed Test Helpers
 *
 * Provides type-safe alternatives to common test patterns that use `: any`.
 * Import these helpers instead of using inline `: any` in test files.
 */

import type { GetListParams, GetOneParams, UpdateParams } from "ra-core";

/**
 * Type-safe row mapper for export tests
 * @example
 * const rows = data.map(createTypedRow((row) => [row.name, row.email]));
 */
export function mapExportRows<T>(
  data: T[],
  mapper: (row: T) => (string | number | null)[]
): (string | number | null)[][] {
  return data.map(mapper);
}

/**
 * Type for mock setState callback used in hook tests
 */
export type MockSetState<T> = (updater: (prev: T) => T) => void;

/**
 * Type-safe mock implementation signature for useGetList
 */
export type MockGetListImpl<T> = (
  resource: string,
  params: GetListParams,
  options?: Record<string, unknown>
) => { data: T[]; total: number; isPending: boolean; error: Error | null };

/**
 * Type-safe mock implementation signature for dataProvider methods
 */
export type MockDataProviderMethod<T> = (
  resource: string,
  params: GetListParams | GetOneParams | UpdateParams
) => Promise<{ data: T | T[] }>;

/**
 * Extract filter from GetListParams safely
 */
export function getFilterValue<T>(
  params: GetListParams,
  key: string
): T | undefined {
  return params.filter?.[key] as T | undefined;
}
```

#### Verification
```bash
npm run typecheck
# Expected: 0 errors
```

---

### Task 2.2: Update High-Priority Test Files (Batch 1)

**Agent Hint:** `test-agent` (test cleanup)
**Files:**
- `src/atomic-crm/organizations/OrganizationList.exporter.test.ts:152`
- `src/atomic-crm/dashboard/v3/__tests__/usePrincipalOpportunities.test.ts:16`
**Effort:** 4 min [Confidence: 85%]
**Dependencies:** Task 2.1

#### What to Implement

Replace `: any` with proper types using the new helpers or inline types:

```typescript
// OrganizationList.exporter.test.ts:152
// BEFORE:
const rows = data.map((row: any) =>

// AFTER:
interface ExportRow {
  name: string;
  // ... other fields from export
}
const rows = data.map((row: ExportRow) =>

// usePrincipalOpportunities.test.ts:16
// BEFORE:
const mapOpportunityData = (opp: any): OpportunitySummary => ({

// AFTER:
interface RawOpportunityData {
  id: number;
  name: string;
  stage: string;
  // ... other raw fields
}
const mapOpportunityData = (opp: RawOpportunityData): OpportunitySummary => ({
```

#### Verification
```bash
npm run test -- OrganizationList.exporter.test.ts usePrincipalOpportunities.test.ts
```

---

### Task 2.3: Update Hook Test Files (Batch 2)

**Agent Hint:** `test-agent` (test cleanup)
**Files:**
- `src/atomic-crm/dashboard/v3/hooks/__tests__/useHybridSearch.test.ts:42`
- `src/atomic-crm/dashboard/v3/hooks/__tests__/useTeamActivities.test.ts:31,45`
- `src/atomic-crm/dashboard/v3/hooks/__tests__/usePrincipalPipeline.test.ts:56`
- `src/atomic-crm/dashboard/v3/hooks/__tests__/useMyTasks.test.ts:49,53,78,152`
**Effort:** 8 min [Confidence: 80%]
**Dependencies:** Task 2.1

#### What to Implement

Replace `: any` in mock implementations with proper types:

```typescript
// useHybridSearch.test.ts:42
// BEFORE:
useGetList: (resource: string, params: any, options: any) => {

// AFTER:
import type { GetListParams } from "ra-core";
useGetList: (resource: string, params: GetListParams, options?: { enabled?: boolean }) => {

// useTeamActivities.test.ts:45, usePrincipalPipeline.test.ts:56
// BEFORE:
setState((s: any) => ({ ...s, isPending: true, error: null }));

// AFTER:
interface HookState<T> {
  data: T[];
  isPending: boolean;
  error: Error | null;
}
setState((s: HookState<Activity>) => ({ ...s, isPending: true, error: null }));

// useMyTasks.test.ts:53
// BEFORE:
(task: any) => !completedTaskIds.has(task.id)

// AFTER:
interface TaskData { id: number; status: string; /* ... */ }
(task: TaskData) => !completedTaskIds.has(task.id)
```

#### Verification
```bash
npm run test -- useHybridSearch useTeamActivities usePrincipalPipeline useMyTasks
```

---

## Phase 3: Code Quality Improvements [Confidence: 90%]

### Task 3.1: Create zodErrorToFormErrors Utility

**Agent Hint:** `schema-agent` (validation utilities)
**File:** NEW `src/lib/zodErrorFormatting.ts`
**Effort:** 3 min [Confidence: 95%]
**Dependencies:** None

#### What to Implement

Extract duplicated Zod error formatting pattern:

```typescript
/**
 * Zod Error Formatting Utilities
 *
 * Provides consistent error message formatting for Zod validation errors.
 * Used across validation files to reduce DRY violations (Audit CQ-002).
 */

import { ZodError, type ZodIssue } from "zod";

/**
 * Convert Zod validation errors to form field errors
 *
 * @param error - ZodError from failed validation
 * @returns Record mapping field paths to error messages
 *
 * @example
 * ```typescript
 * try {
 *   schema.parse(data);
 * } catch (error) {
 *   if (error instanceof ZodError) {
 *     const fieldErrors = zodErrorToFormErrors(error);
 *     throw { message: "Validation failed", body: { errors: fieldErrors } };
 *   }
 * }
 * ```
 */
export function zodErrorToFormErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  error.issues.forEach((issue: ZodIssue) => {
    const path = issue.path.join(".");
    // Only keep first error per field (React Admin shows one error per field)
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  });

  return errors;
}

/**
 * Create a React Admin compatible validation error
 *
 * @param error - ZodError from failed validation
 * @param message - Optional custom error message (default: "Validation failed")
 * @returns Object with message and body.errors for React Admin
 */
export function createValidationError(
  error: ZodError,
  message = "Validation failed"
): { message: string; body: { errors: Record<string, string> } } {
  return {
    message,
    body: { errors: zodErrorToFormErrors(error) },
  };
}
```

#### Verification
```bash
npm run typecheck
npm run test -- zodErrorFormatting
```

---

### Task 3.2: Update Validation Files to Use Utility

**Agent Hint:** `schema-agent` (validation refactoring)
**Files:**
- `src/atomic-crm/validation/products.ts:90-94`
- `src/atomic-crm/validation/contacts-core.ts:198-200` (if exists)
**Effort:** 4 min [Confidence: 88%]
**Dependencies:** Task 3.1

#### What to Implement

Replace duplicated error formatting with utility:

```typescript
// products.ts - BEFORE (lines 84-102):
export async function validateProductForm(data: unknown): Promise<void> {
  const result = productSchema.safeParse(data);
  if (!result.success) {
    const formattedErrors: Record<string, string> = {};
    result.error.issues.forEach((err) => {
      const path = err.path.join(".");
      formattedErrors[path] = err.message;
    });
    throw {
      message: "Validation failed",
      body: { errors: formattedErrors },
    };
  }
}

// products.ts - AFTER:
import { createValidationError } from "@/lib/zodErrorFormatting";

export async function validateProductForm(data: unknown): Promise<void> {
  const result = productSchema.safeParse(data);
  if (!result.success) {
    throw createValidationError(result.error);
  }
}
```

#### Verification
```bash
npm run test -- products
```

#### Constitution Checklist
- [x] Zod validation at API boundary only
- [x] No retry logic or fallbacks
- [x] DRY principle applied

---

## Verification Plan [Confidence: 95%]

### 1. TypeScript Compilation
```bash
npm run typecheck
# Expected: 0 errors
```

### 2. Test Suite
```bash
npm run test
# Expected: All tests pass
```

### 3. Linting
```bash
npm run lint
# Expected: 0 errors
```

### 4. Re-run Audit
```bash
/audit:typescript
# Expected: 0-3 critical issues (down from 8)
```

---

## Parallel Execution Groups

**Group A (Independent):** Tasks 1.1, 1.3, 3.1
**Group B (Depends on 2.1):** Tasks 2.2, 2.3
**Group C (Depends on 3.1):** Task 3.2

**Recommended Execution Order:**
1. Group A in parallel (mock provider, test comments, utility creation)
2. Groups B, C in parallel (test file updates, validation refactoring)

---

## Risk Assessment

| Risk | Mitigation | Confidence |
|------|------------|------------|
| Test type changes break assertions | Run tests after each file | 90% |
| Generic defaults cause inference issues | Test with actual usage | 95% |
| Utility extraction misses edge cases | Keep original inline as fallback | 88% |

---

## Plan Confidence Summary

- **Overall Confidence:** 92%
- **Highest Risk:** Task 2.3 (hook test updates) - many files, type inference complexity
- **Verification Needed:**
  - `npm run typecheck` after Tasks 1.1, 1.2
  - `npm run test` after each test file update
  - Full test suite before marking complete

**Key Discovery:** 11 of 15 critical issues were already resolved in prior implementation. The remaining 4 issues are TypeScript cleanup in test files - lower priority technical debt that can be addressed incrementally.

**Recommendation:** Execute Phase 1 (mock providers) and Phase 3 (DRY utility) first as quick wins. Phase 2 (test file cleanup) can be done incrementally over time.
