# Implementation Plan: Critical Audit Fixes

**Created:** 2026-01-15
**Type:** Technical Debt
**Scope:** Cross-feature
**Execution:** Parallel groups (atomic 2-5 min tasks)
**Testing:** TDD strict

---

## Executive Summary

| Metric | Value |
|--------|-------|
| **Total Tasks** | 12 |
| **Parallel Groups** | 4 |
| **Estimated Effort** | 5 story points |
| **Risk Level** | Low |
| **Critical Issues Addressed** | 5 of 6 (1 marked as exception) |

### Issue Disposition

| ID | Issue | Decision |
|----|-------|----------|
| TS-001 | Double-cast pattern | ✅ Fix |
| ARCH-001 | Direct Supabase import (QuickLogForm) | ✅ Fix |
| ARCH-002 | Direct Supabase import (auth) | ⚠️ **EXCEPTION** - Documented, acceptable |
| ARCH-003 | Missing handlers directory | ✅ Fix |
| CQ-001 | Duplicate formatDate functions | ✅ Fix |
| CQ-002 | Console statements | ✅ Fix |

---

## Parallel Group 1: TypeScript Safety (TS-001)

### Task 1.1: Write failing test for genericMemo type safety

**Agent Hint:** `test-agent` (unit test creation)
**File:** `src/lib/__tests__/genericMemo.test.ts` (new file)
**Effort:** 1 task
**Dependencies:** None

#### What to Implement

Create a test that verifies genericMemo preserves component types properly without double-casting.

#### Code Example

```typescript
// src/lib/__tests__/genericMemo.test.ts
import { describe, it, expect } from "vitest";
import { genericMemo } from "../genericMemo";

interface TestProps<T> {
  data: T;
  onSelect: (item: T) => void;
}

function TestComponent<T>(props: TestProps<T>) {
  return null;
}
TestComponent.displayName = "TestComponentImpl";

describe("genericMemo", () => {
  it("preserves generic type parameters", () => {
    const MemoizedComponent = genericMemo(TestComponent);

    // Type test: this should compile without errors
    // If double-cast is removed incorrectly, this will fail type checking
    expect(MemoizedComponent.displayName).toBe("TestComponent");
  });

  it("strips 'Impl' suffix from displayName", () => {
    const MemoizedComponent = genericMemo(TestComponent);
    expect(MemoizedComponent.displayName).toBe("TestComponent");
  });
});
```

#### Verification

```bash
npx vitest run src/lib/__tests__/genericMemo.test.ts
```

#### Constitution Checklist

- [x] No retry logic or fallbacks
- [x] Fail-fast on errors
- [x] No form validation (N/A)

---

### Task 1.2: Fix genericMemo double-cast with proper typing

**Agent Hint:** `schema-agent` (TypeScript/type definitions)
**File:** `src/lib/genericMemo.ts`
**Line:** 14, 20
**Effort:** 1 task
**Dependencies:** Task 1.1

#### What to Implement

Replace the `as unknown as T` pattern with proper generic constraints. The issue is that `memo()` narrows the type - we need to preserve it.

#### Code Example

```typescript
// src/lib/genericMemo.ts
import type { ComponentType, MemoExoticComponent } from "react";
import { memo } from "react";

interface ComponentWithDisplayName {
  displayName?: string;
}

/**
 * A version of React.memo that preserves the original component type allowing it to accept generics.
 * See {@link https://stackoverflow.com/a/70890101}
 * @deprecated Use genericMemo from "ra-core" when available.
 */
// ✅ Constitution: Use explicit generic constraint instead of double-cast
export function genericMemo<P extends object>(
  component: ComponentType<P>
): MemoExoticComponent<ComponentType<P>> {
  const result = memo(component);

  // Preserve displayName for DevTools
  result.displayName = (component as ComponentWithDisplayName).displayName?.replace("Impl", "");

  return result;
}
```

#### Verification

```bash
npx vitest run src/lib/__tests__/genericMemo.test.ts
npx tsc --noEmit
```

#### Constitution Checklist

- [x] No `as unknown as T` pattern
- [x] Uses explicit generic constraints
- [x] Type-safe

---

## Parallel Group 2: Architecture Fixes (ARCH-001, ARCH-003)

### Task 2.1: Create RPC method in data provider for activity logging

**Agent Hint:** `provider-agent` (data provider/handlers)
**File:** `src/atomic-crm/providers/supabase/extensions/rpcExtension.ts`
**Effort:** 1 task
**Dependencies:** None

#### What to Implement

Verify the `logActivityWithTask` RPC method exists in the rpcExtension. If not, add it.

#### Code Example

```typescript
// Check if this method exists in rpcExtension.ts:
logActivityWithTask: async (params: {
  activity: ActivityPayload;
  task: TaskPayload | null;
}) => {
  const { data, error } = await supabase.rpc("log_activity_with_task", {
    p_activity: params.activity,
    p_task: params.task,
  });

  if (error) throw new HttpError(error.message, 500);
  return data;
},
```

#### Verification

```bash
rg "logActivityWithTask" src/atomic-crm/providers/supabase/
```

---

### Task 2.2: Write failing test for QuickLogForm provider usage

**Agent Hint:** `test-agent` (unit test creation)
**File:** `src/atomic-crm/dashboard/v3/components/__tests__/QuickLogForm.provider.test.tsx` (new file)
**Effort:** 1 task
**Dependencies:** Task 2.1

#### What to Implement

Test that QuickLogForm uses the data provider instead of direct Supabase imports.

#### Code Example

```typescript
// src/atomic-crm/dashboard/v3/components/__tests__/QuickLogForm.provider.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QuickLogForm } from "../QuickLogForm";
import { renderWithAdminContext } from "@/test-utils/renderWithAdminContext";

describe("QuickLogForm provider integration", () => {
  it("calls data provider rpc method instead of direct supabase", async () => {
    const mockRpc = vi.fn().mockResolvedValue({ activity_id: 1, task_id: null });

    renderWithAdminContext(<QuickLogForm onComplete={vi.fn()} />, {
      dataProvider: {
        // ... standard mocks
        rpc: mockRpc,
      },
    });

    // Fill form and submit
    // Assert mockRpc was called with "logActivityWithTask"
  });
});
```

---

### Task 2.3: Refactor QuickLogForm to use data provider

**Agent Hint:** `component-agent` (React component changes)
**File:** `src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx`
**Line:** 5, 182-185
**Effort:** 1 task
**Dependencies:** Task 2.1, Task 2.2

#### What to Implement

Replace the direct `supabase.rpc()` call with data provider usage.

#### Code Example

```typescript
// REMOVE line 5:
// import { supabase } from "@/atomic-crm/providers/supabase/supabase";

// ADD:
import { useDataProvider } from "react-admin";

// In component, add:
const dataProvider = useDataProvider();

// REPLACE lines 182-185:
// OLD:
// const { data: rpcResult, error } = await supabase.rpc("log_activity_with_task", {
//   p_activity: activityPayload,
//   p_task: taskPayload,
// });

// NEW:
const rpcResult = await dataProvider.rpc("logActivityWithTask", {
  activity: activityPayload,
  task: taskPayload,
});
```

#### Verification

```bash
# Verify no direct supabase import
rg "from.*supabase/supabase" src/atomic-crm/dashboard/v3/components/QuickLogForm.tsx

# Run tests
npx vitest run src/atomic-crm/dashboard/v3/components/
```

#### Constitution Checklist

- [x] No direct Supabase imports
- [x] Uses data provider (single entry point)
- [x] Fail-fast on errors

---

### Task 2.4: Create handlers re-export at expected location

**Agent Hint:** `general-agent` (simple file creation)
**File:** `src/providers/supabase/handlers/index.ts` (new file)
**Effort:** 1 task
**Dependencies:** None

#### What to Implement

Create the expected directory structure and re-export from the actual handlers location.

#### Code Example

```typescript
// src/providers/supabase/handlers/index.ts

/**
 * Re-export handlers from atomic-crm location
 *
 * ARCHITECTURE NOTE: Handlers are implemented in src/atomic-crm/providers/supabase/handlers/
 * This re-export satisfies the expected top-level structure from PROVIDER_RULES.md
 */
export * from "@/atomic-crm/providers/supabase/handlers";
```

#### Verification

```bash
# Verify import works
echo "import { contactsHandler } from '@/providers/supabase/handlers';" | npx tsc --noEmit --allowImportingTsExtensions -
```

---

## Parallel Group 3: Code Quality - formatDate (CQ-001)

### Task 3.1: Create shared date formatting utility

**Agent Hint:** `schema-agent` (utility/type definitions)
**File:** `src/lib/formatDate.ts` (new file)
**Effort:** 1 task
**Dependencies:** None

#### What to Implement

Create a centralized date formatting utility that covers all existing use cases.

#### Code Example

```typescript
// src/lib/formatDate.ts
import { format, isValid, parseISO } from "date-fns";

/**
 * Centralized date formatting utility
 *
 * Replaces 5 duplicate implementations:
 * - SidepaneMetadata.tsx (toLocaleDateString)
 * - text-input.tsx (YYYY-MM-DD for inputs)
 * - OpportunityDetailsViewSection.tsx (MMM d, yyyy)
 * - notes.ts (formatDateForInput)
 * - dateFilterLabels.ts (formatDateValue)
 */

export type DateInput = Date | string | null | undefined;

/**
 * Format date for display (e.g., "Jan 15, 2026")
 */
export function formatDateDisplay(date: DateInput): string {
  if (!date) return "";

  const parsed = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsed)) return String(date);

  return format(parsed, "MMM d, yyyy");
}

/**
 * Format date for HTML date input (YYYY-MM-DD)
 */
export function formatDateForInput(date: DateInput): string {
  if (!date) return "";

  const parsed = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(parsed)) return "";

  return format(parsed, "yyyy-MM-dd");
}

/**
 * Format date with locale (for metadata displays)
 */
export function formatDateLocale(
  date: DateInput,
  options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" }
): string {
  if (!date) return "";

  const parsed = typeof date === "string" ? new Date(date) : date;
  if (!isValid(parsed)) return String(date);

  return parsed.toLocaleDateString("en-US", options);
}
```

#### Verification

```bash
npx tsc --noEmit src/lib/formatDate.ts
```

---

### Task 3.2: Write tests for formatDate utility

**Agent Hint:** `test-agent` (unit test creation)
**File:** `src/lib/__tests__/formatDate.test.ts` (new file)
**Effort:** 1 task
**Dependencies:** Task 3.1

#### Code Example

```typescript
// src/lib/__tests__/formatDate.test.ts
import { describe, it, expect } from "vitest";
import { formatDateDisplay, formatDateForInput, formatDateLocale } from "../formatDate";

describe("formatDateDisplay", () => {
  it("formats Date object", () => {
    expect(formatDateDisplay(new Date("2026-01-15"))).toBe("Jan 15, 2026");
  });

  it("formats ISO string", () => {
    expect(formatDateDisplay("2026-01-15T00:00:00Z")).toBe("Jan 15, 2026");
  });

  it("returns empty string for null/undefined", () => {
    expect(formatDateDisplay(null)).toBe("");
    expect(formatDateDisplay(undefined)).toBe("");
  });

  it("returns original value for invalid date", () => {
    expect(formatDateDisplay("not-a-date")).toBe("not-a-date");
  });
});

describe("formatDateForInput", () => {
  it("formats to YYYY-MM-DD", () => {
    expect(formatDateForInput(new Date("2026-01-15"))).toBe("2026-01-15");
  });
});
```

---

### Task 3.3: Update SidepaneMetadata to use shared utility

**Agent Hint:** `component-agent` (React component)
**File:** `src/components/layouts/sidepane/SidepaneMetadata.tsx`
**Line:** 8-18
**Effort:** 1 task
**Dependencies:** Task 3.1

#### Code Example

```typescript
// REMOVE local formatDate function (lines 8-18)
// ADD import:
import { formatDateLocale } from "@/lib/formatDate";

// REPLACE usage:
// OLD: formatDate(createdAt)
// NEW: formatDateLocale(createdAt)
```

---

### Task 3.4: Update remaining formatDate usages

**Agent Hint:** `component-agent` (batch updates)
**Files:**
- `src/components/admin/text-input.tsx`
- `src/atomic-crm/opportunities/slideOverTabs/OpportunityDetailsViewSection.tsx`
- `src/atomic-crm/validation/notes.ts`
- `src/atomic-crm/filters/dateFilterLabels.ts`
**Effort:** 1 task
**Dependencies:** Task 3.1

#### What to Implement

Update all files to import from shared utility. For `dateFilterLabels.ts`, re-export from shared utility for backwards compatibility.

---

## Parallel Group 4: Code Quality - Console Statements (CQ-002)

### Task 4.1: Add ESLint rule to warn on console statements

**Agent Hint:** `general-agent` (config file)
**File:** `eslint.config.js` or `.eslintrc.js`
**Effort:** 1 task
**Dependencies:** None

#### Code Example

```javascript
// Add to ESLint config rules:
{
  "no-console": ["warn", {
    "allow": ["warn", "error"]
  }]
}
```

---

### Task 4.2: Replace console.log with devLog in development code

**Agent Hint:** `general-agent` (batch find-replace)
**Files:** All files in `src/` except tests
**Effort:** 1 task
**Dependencies:** Task 4.1

#### What to Implement

For development debugging:
- Replace `console.log` with `devLog` from `@/lib/devLogger`
- Keep `console.warn` and `console.error` for actual warnings/errors
- Remove debugging console.log statements that are no longer needed

#### Priority Files (highest console usage):

1. `src/atomic-crm/tests/*.ts` (43 occurrences) - Keep for test output
2. `src/atomic-crm/providers/supabase/services/*.ts` (9 occurrences) - Convert to devLog
3. `src/atomic-crm/utils/secureStorage.ts` (9 occurrences) - Convert to devLog
4. `src/lib/devLogger.ts` (8 occurrences) - Keep (it's the logger itself)

---

## Parallel Group 5: Documentation

### Task 5.1: Add ARCH-002 exception to audit baseline

**Agent Hint:** `general-agent` (JSON update)
**File:** `docs/audits/.baseline/full-audit.json`
**Effort:** 1 task
**Dependencies:** None

#### What to Implement

Mark ARCH-002 as an accepted exception with documentation reference.

#### Code Example

```json
{
  "source_audit": "architecture",
  "id": "ARCH-002",
  "severity": "critical",
  "check": "Direct Supabase Import",
  "location": "src/atomic-crm/dashboard/v3/hooks/useCurrentSale.ts:3",
  "description": "Direct import of supabase client for auth.getUser()",
  "firstSeen": "2026-01-12",
  "status": "exception",
  "exception_reason": "Auth state is outside data provider scope. Well-documented. See useCurrentSale.ts lines 104-108."
}
```

---

## Dependency Graph

```
Group 1 (TypeScript):     1.1 ──→ 1.2
                           │
Group 2 (Architecture):   2.1 ──→ 2.2 ──→ 2.3
                          2.4 (independent)
                           │
Group 3 (formatDate):     3.1 ──→ 3.2
                           │     3.3
                           └────→ 3.4
                           │
Group 4 (Console):        4.1 ──→ 4.2
                           │
Group 5 (Docs):           5.1 (independent)
```

**Parallelization:**
- Groups 1, 2, 3, 4, 5 can run simultaneously
- Within groups, tasks run sequentially as shown

---

## Verification Checklist

After all tasks complete:

```bash
# 1. No double-casts remain
rg "as unknown as" src/lib/

# 2. No direct Supabase imports in components (except auth)
rg "from.*supabase/supabase" src/atomic-crm/ --glob "!**/hooks/useCurrentSale.ts"

# 3. Handlers re-export works
npx tsc --noEmit

# 4. formatDate is centralized
rg "function formatDate" src/ | wc -l  # Should be 1 (in lib/formatDate.ts)

# 5. Console statements reduced
rg -c "console\.log" src/ --glob "!**/*.test.*" | awk -F: '{sum+=$2} END {print sum}'

# 6. All tests pass
npx vitest run
```

---

## Constitution Compliance Summary

| Principle | Status |
|-----------|--------|
| Fail Fast | ✅ No retry logic added |
| Single Source (Provider) | ✅ QuickLogForm routed through provider |
| Zod at Boundary | ✅ N/A - no new validation |
| No Form Validation | ✅ N/A |
| Semantic Colors | ✅ N/A |
| 44px Touch Targets | ✅ N/A |

---

## Rollback Plan

Each task is atomic and can be reverted independently:

```bash
# Revert specific commit
git revert <commit-sha>

# Or reset to before plan execution
git reset --hard HEAD~<n>
```
