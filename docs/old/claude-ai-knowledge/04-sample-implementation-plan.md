# Sample Implementation Plan

> **Purpose:** Reference document for Claude.ai Project Knowledge. Shows the expected format for plans that Claude Code will execute.

---

## Plan Structure Overview

Every implementation plan produced by Claude.ai should follow this structure so Claude Code can execute it directly.

---

# Quick Activity FAB - Implementation Plan

> **For Executing Agent:**
> 1. **FIRST:** Read the Engineering Constitution principles
> 2. **THEN:** Verify each task against principles before committing
> 3. Follow tasks exactly. Do not improvise. Zero context assumed.

**Goal:** Add a floating action button for <30 second activity logging from anywhere in the app.

**Architecture:** New FAB component at app root, opens modal with minimal form, submits via unifiedDataProvider.

**Task Granularity:** standard (5-15 min)

**Parallelization:** Tasks 1-2 can run in parallel. Task 3 depends on both.

**Constitution Principles In Play:**
- [x] Error handling (fail fast - NO retry logic)
- [x] Validation (Zod at API boundary only)
- [x] Form state (derived from schema)
- [x] Data access (unified provider only)
- [x] Types (`interface` for objects, `type` for unions)

---

## Task Dependencies

| Task | Depends On | Can Parallelize With |
|------|------------|---------------------|
| 1    | None       | 2                   |
| 2    | None       | 1                   |
| 3    | 1, 2       | None                |

---

## Tasks

### Task 1: Create Zod Schema

**Depends on:** None - can start immediately

**Constitution Check:**
- [x] No retry logic / circuit breakers
- [x] Validation in `src/atomic-crm/validation/` only
- [x] Using z.strictObject
- [x] All strings have .max()
- [x] Using z.coerce for form inputs

**Files:**
- Create: `src/atomic-crm/validation/quickActivity.ts`
- Modify: `src/atomic-crm/validation/index.ts` (add export)

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/validation/__tests__/quickActivity.test.ts
import { describe, it, expect } from 'vitest';
import { quickActivitySchema } from '../quickActivity';

describe('quickActivitySchema', () => {
  it('validates minimal required fields', () => {
    const result = quickActivitySchema.safeParse({
      type: 'call',
      principal_id: 'uuid-here',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown fields (strictObject)', () => {
    const result = quickActivitySchema.safeParse({
      type: 'call',
      principal_id: 'uuid-here',
      unknownField: 'should fail',
    });
    expect(result.success).toBe(false);
  });

  it('enforces .max() on notes', () => {
    const result = quickActivitySchema.safeParse({
      type: 'call',
      principal_id: 'uuid-here',
      notes: 'x'.repeat(501), // Over 500 limit
    });
    expect(result.success).toBe(false);
  });
});
```

**Step 2: Verify test fails**

```bash
npm test src/atomic-crm/validation/__tests__/quickActivity.test.ts
# Expected: FAIL - Cannot find module '../quickActivity'
```

**Step 3: Implement minimal code**

```typescript
// src/atomic-crm/validation/quickActivity.ts
import { z } from "zod";

/**
 * Quick Activity Schema - minimal form for FAB
 * Per Engineering Constitution: z.strictObject, .max() on all strings
 */
export const quickActivitySchema = z.strictObject({
  type: z.enum(['call', 'email', 'meeting', 'sample']),
  principal_id: z.string().uuid(),
  contact_id: z.string().uuid().optional(),
  notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
  activity_date: z.coerce.date().default(() => new Date()),
});

export type QuickActivity = z.infer<typeof quickActivitySchema>;
export type QuickActivityInput = z.input<typeof quickActivitySchema>;

// Validation function for unifiedDataProvider
export async function validateQuickActivity(data: unknown): Promise<void> {
  try {
    quickActivitySchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors: Record<string, string> = {};
      error.issues.forEach((err) => {
        formattedErrors[err.path.join(".")] = err.message;
      });
      throw {
        message: "Validation failed",
        body: { errors: formattedErrors },
      };
    }
    throw error;
  }
}
```

**Step 4: Verify test passes**

```bash
npm test src/atomic-crm/validation/__tests__/quickActivity.test.ts
# Expected: PASS - All 3 tests pass
```

**Step 5: Constitution compliance check**

- [x] Uses z.strictObject (not z.object)
- [x] All strings have .max() constraint
- [x] Uses z.coerce.date() for form input
- [x] z.enum for constrained values
- [x] Validation function formatted for React Admin

**Step 6: Commit**

```bash
git add src/atomic-crm/validation/quickActivity.ts
git add src/atomic-crm/validation/__tests__/quickActivity.test.ts
git commit -m "feat: add quickActivity Zod schema for FAB

- z.strictObject per constitution
- All strings have .max() constraints
- Includes validation function for unifiedDataProvider"
```

**Success Criteria:**
- [ ] Schema exports QuickActivity type via z.infer
- [ ] All strings have .max() constraint
- [ ] Uses z.strictObject (rejects unknown keys)
- [ ] Tests pass

---

### Task 2: Create FAB Component

**Depends on:** None - can start immediately

**Constitution Check:**
- [x] Semantic colors only (no hardcoded hex)
- [x] Touch targets 44px+ (h-11 w-11 or larger)
- [x] `interface` for props, `type` for unions

**Files:**
- Create: `src/atomic-crm/components/QuickActivityFAB.tsx`
- Create: `src/atomic-crm/components/__tests__/QuickActivityFAB.test.tsx`

**Step 1: Write the failing test**

```typescript
// src/atomic-crm/components/__tests__/QuickActivityFAB.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuickActivityFAB } from '../QuickActivityFAB';

describe('QuickActivityFAB', () => {
  it('renders floating button with accessible label', () => {
    render(<QuickActivityFAB />);
    expect(screen.getByRole('button', { name: /log activity/i })).toBeInTheDocument();
  });

  it('has minimum 44px touch target', () => {
    render(<QuickActivityFAB />);
    const button = screen.getByRole('button');
    // h-14 = 56px, exceeds 44px minimum
    expect(button).toHaveClass('h-14', 'w-14');
  });
});
```

**Step 2: Verify test fails**

```bash
npm test src/atomic-crm/components/__tests__/QuickActivityFAB.test.tsx
# Expected: FAIL - Cannot find module '../QuickActivityFAB'
```

**Step 3: Implement minimal code**

```typescript
// src/atomic-crm/components/QuickActivityFAB.tsx
import { useState } from 'react';
import { Plus } from 'lucide-react';

interface QuickActivityFABProps {
  onClick?: () => void;
}

export const QuickActivityFAB = ({ onClick }: QuickActivityFABProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(true);
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary shadow-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
      aria-label="Log activity"
    >
      <Plus className="h-6 w-6 mx-auto text-primary-foreground" />
    </button>
  );
};
```

**Step 4: Verify test passes**

```bash
npm test src/atomic-crm/components/__tests__/QuickActivityFAB.test.tsx
# Expected: PASS - Both tests pass
```

**Step 5: Constitution compliance check**

- [x] Uses semantic colors (bg-primary, text-primary-foreground)
- [x] Touch target 56px (h-14 w-14) > 44px minimum
- [x] Uses `interface` for props
- [x] Accessible label via aria-label

**Step 6: Commit**

```bash
git add src/atomic-crm/components/QuickActivityFAB.tsx
git add src/atomic-crm/components/__tests__/QuickActivityFAB.test.tsx
git commit -m "feat: add QuickActivityFAB component

- 56px touch target (exceeds 44px minimum)
- Semantic colors only
- Accessible label for screen readers"
```

**Success Criteria:**
- [ ] Button renders at fixed bottom-right position
- [ ] Touch target >= 44px (using h-14 = 56px)
- [ ] Uses semantic colors (no hardcoded values)
- [ ] Has accessible label

---

### Task 3: Wire to Data Provider

**Depends on:** Task 1, Task 2

**Constitution Check:**
- [x] All data access via unifiedDataProvider
- [x] No direct Supabase imports
- [x] Validation at API boundary

**Files:**
- Modify: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` (add resource handler)
- Modify: `src/App.tsx` (add FAB to layout)

**Step 1: Add resource handler to data provider**

```typescript
// In unifiedDataProvider.ts, add to resource handlers:
import { validateQuickActivity } from '@/atomic-crm/validation/quickActivity';

// In the create handler switch:
case 'quick_activities':
  await validateQuickActivity(params.data);
  // Transform and insert...
  break;
```

**Step 2: Add FAB to App layout**

```typescript
// In App.tsx or Layout component:
import { QuickActivityFAB } from '@/atomic-crm/components/QuickActivityFAB';

// Add after main content:
<QuickActivityFAB />
```

**Step 3: Constitution compliance check**

- [x] All data through unifiedDataProvider
- [x] No direct Supabase imports in component
- [x] Validation called at API boundary

**Step 4: Commit**

```bash
git add src/atomic-crm/providers/supabase/unifiedDataProvider.ts
git add src/App.tsx
git commit -m "feat: wire QuickActivityFAB to data provider

- Adds quick_activities resource handler
- Validation at API boundary via validateQuickActivity
- FAB rendered at app root level"
```

**Success Criteria:**
- [ ] create('quick_activities', {...}) works via data provider
- [ ] Validation uses quickActivitySchema
- [ ] FAB visible on all authenticated pages

---

## Handoff to Claude Code

```
Plan saved to: docs/plans/2025-12-08-quick-activity-fab.md

## Pre-Execution Requirement
Executing agent MUST verify constitution compliance for each task.

## Parallel Execution Strategy
- Group A: Tasks [1, 2] (independent - run in parallel)
- Group B: Task [3] (depends on Group A)

## To Execute

**In Claude Code, run:**
/execute-plan

**Or manually:**
1. Read this plan
2. Execute Task 1 and Task 2 in parallel
3. After both complete, execute Task 3
4. Run full test suite: npm test
5. Verify build: npm run build
```

---

## Plan Quality Checklist

Before handing to Claude Code, verify:

- [x] Every task has exact file paths (no "appropriate directory")
- [x] Every task has constitution compliance checklist
- [x] Every task has success criteria
- [x] Code examples use correct patterns (z.strictObject, semantic colors, etc.)
- [x] Dependencies clearly mapped
- [x] Parallel execution opportunities identified
- [x] Commit messages included
