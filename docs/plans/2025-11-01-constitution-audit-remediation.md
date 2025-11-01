# Engineering Constitution Audit Remediation

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all high and medium priority violations from the Engineering Constitution audit to achieve 98%+ compliance.

**Architecture:** Address violations in three phases: (1) Database security fixes with migration verification, (2) Validation and type system corrections, (3) Code cleanup and Boy Scout rule enforcement. Each task follows TDD where applicable and includes verification steps.

**Tech Stack:** TypeScript, Zod, Supabase (PostgreSQL), React Admin, Tailwind CSS

**Audit Reference:** Based on 2025-11-01 constitution audit findings (92.3% → 98%+ target)

---

## 📊 Execution Status

**Last Updated:** 2025-11-01 17:48 UTC

| Task | Status | Completion | Notes |
|------|--------|------------|-------|
| Task 1: Database Security Audit | ✅ COMPLETE | 2025-11-01 | Already compliant - no migration needed |
| Task 2: Email Validation Drift | ✅ COMPLETE | commit a41ec23 | Zod schema integration complete |
| Task 3: Inline OKLCH Border Fix | ✅ COMPLETE | Already done | CSS variable `--tag-border` in use |
| Task 4: RPC/Edge Function Validation | ✅ COMPLETE | commit c9b255f | 27 tests passing, full integration |
| Task 5: Type to Interface Conversion | ⚠️ DEFERRED | — | Risk of WSL2 lockup, medium priority |
| Task 6: Clean Debug Console.log | 🔄 PENDING | — | 26 statements to remove |
| Task 7.1: LRU Cache Implementation | 🔄 PENDING | — | Data provider caching |
| Task 7.2: Activities Service Optimization | 🔄 PENDING | — | 5 queries → 1 query |
| Task 7.3: Production CSP Headers | 🔄 PENDING | — | Security headers config |

**Key Findings:**
- Tasks 1-4 were already completed in prior work
- Database security: **100% compliant** (no fixes needed)
- Validation layer: **Single source of truth restored**
- API boundary: **Zod validation enforced**

**Remaining Work:**
- Tasks 6-7: Code cleanup and performance optimizations (6-12 hours estimated)
- Task 5: Deferred due to TypeScript recompilation risk in WSL2 environment

---

## Task 1: Database Security Audit - Verify Two-Layer Security

**Priority:** 🔴 Critical
**Effort:** M (4-6 hours)
**Rule:** #9 - TWO-LAYER SECURITY

**Files:**
- Review: `supabase/migrations/*.sql` (all migrations)
- Create: `scripts/audit-db-security.sql` (audit query)
- Modify: TBD based on audit results (missing GRANT migrations)

**Context:**
The audit found 28 tables/views created, 24 with RLS enabled, but only 14 explicit GRANT statements. This creates risk of "permission denied" errors in production even when RLS policies are correct.

**Step 1: Create database security audit query**

Create `scripts/audit-db-security.sql`:

```sql
-- Database Security Audit Query
-- Verifies two-layer security: RLS + GRANT permissions

-- Part 1: Tables with RLS but potentially missing GRANTs
SELECT
  t.tablename,
  t.rowsecurity AS has_rls,
  (SELECT count(*) FROM pg_policies WHERE tablename = t.tablename) AS policy_count,
  (SELECT count(*)
   FROM information_schema.table_privileges
   WHERE table_name = t.tablename
   AND grantee = 'authenticated'
   AND privilege_type IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')
  ) AS grant_count
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT IN ('schema_migrations', 'init_state')
ORDER BY t.rowsecurity DESC, t.tablename;

-- Part 2: Sequences that need USAGE grants
SELECT
  s.sequencename,
  (SELECT count(*)
   FROM information_schema.usage_privileges
   WHERE object_name = s.sequencename
   AND grantee = 'authenticated'
  ) AS has_usage_grant
FROM pg_sequences s
WHERE s.schemaname = 'public'
ORDER BY s.sequencename;

-- Part 3: RLS policies summary
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;
```

**Step 2: Run audit query on local database**

```bash
# Start local database if not running
npm run db:local:start

# Run audit query
npx supabase db execute --file scripts/audit-db-security.sql --local
```

Expected output: List of tables with RLS but missing GRANT permissions

**Step 3: Document findings**

Create `docs/database/security-audit-2025-11-01.md`:

```markdown
# Database Security Audit - 2025-11-01

## Findings

### Tables Requiring GRANT Statements

[List tables from query results where has_rls = true but grant_count = 0]

### Sequences Requiring USAGE Grants

[List sequences where has_usage_grant = 0]

## Action Items

- [ ] Create migration to add missing GRANT statements
- [ ] Verify all tables with RLS have corresponding grants
- [ ] Test authenticated user access after fixes
```

**Step 4: Create migration for missing GRANTs**

Only if audit reveals missing permissions, create:

```bash
npx supabase migration new restore_missing_authenticated_grants
```

Example migration content (adjust based on findings):

```sql
-- Migration: restore_missing_authenticated_grants
-- Adds GRANT permissions for tables that have RLS but missing authenticated role grants

-- Grant base permissions to authenticated role for all public tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Grant sequence usage for all public sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Explicitly grant permissions for specific tables if needed
-- (Add specific grants here based on audit results)

-- Example for a specific table:
-- GRANT SELECT, INSERT, UPDATE, DELETE ON opportunity_contacts TO authenticated;
-- GRANT USAGE ON SEQUENCE opportunity_contacts_id_seq TO authenticated;
```

**Step 5: Test migration**

```bash
# Reset local database to apply new migration
npm run db:local:reset

# Verify grants were applied
npx supabase db execute --file scripts/audit-db-security.sql --local
```

Expected: All tables with RLS now show grant_count = 4 (SELECT, INSERT, UPDATE, DELETE)

**Step 6: Commit**

```bash
git add scripts/audit-db-security.sql
git add docs/database/security-audit-2025-11-01.md
git add supabase/migrations/[timestamp]_restore_missing_authenticated_grants.sql
git commit -m "feat(db): add security audit and restore missing GRANT permissions

- Add database security audit query script
- Document findings from 2025-11-01 audit
- Restore GRANT permissions for authenticated role on all RLS tables
- Fixes Engineering Constitution Rule 9 (Two-Layer Security)

BREAKING CHANGE: None - adds missing permissions, no schema changes"
```

---

## Task 2: Fix Email Validation Drift - Single Source of Truth

**Priority:** 🟡 High
**Effort:** S (15 minutes)
**Rule:** #2 - SINGLE SOURCE OF TRUTH

**Files:**
- Modify: `src/atomic-crm/utils/avatar.utils.ts:205-208`
- Test: `src/atomic-crm/utils/__tests__/avatar.utils.test.ts` (if exists, else create)

**Context:**
Email validation regex is duplicated in `avatar.utils.ts` instead of using the Zod schema from `src/atomic-crm/validation/contacts.ts`. This creates two sources of truth that can drift.

**Step 1: Write failing test for email validation**

Create or modify `src/atomic-crm/utils/__tests__/avatar.utils.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { isValidEmailForAvatar } from '../avatar.utils';

describe('isValidEmailForAvatar', () => {
  it('should accept valid email addresses', () => {
    expect(isValidEmailForAvatar('user@example.com')).toBe(true);
    expect(isValidEmailForAvatar('test.user+tag@domain.co.uk')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(isValidEmailForAvatar('notanemail')).toBe(false);
    expect(isValidEmailForAvatar('@example.com')).toBe(false);
    expect(isValidEmailForAvatar('user@')).toBe(false);
    expect(isValidEmailForAvatar('')).toBe(false);
  });

  it('should use same validation as Zod contact schema', () => {
    // This ensures we're using Zod instead of regex
    // If regex changes, this test will catch drift
    const validByZod = 'valid@email.com';
    const invalidByZod = 'not@valid@email';

    expect(isValidEmailForAvatar(validByZod)).toBe(true);
    expect(isValidEmailForAvatar(invalidByZod)).toBe(false);
  });
});
```

**Step 2: Run test to verify current behavior**

```bash
npm test -- avatar.utils.test.ts
```

Expected: Tests should PASS with current regex implementation

**Step 3: Refactor to use Zod schema**

Modify `src/atomic-crm/utils/avatar.utils.ts`:

```typescript
// Remove old implementation:
// export function isValidEmailForAvatar(email: string): boolean {
//   const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//   return emailRegex.test(email);
// }

// New implementation using Zod:
import { emailAndTypeSchema } from '@/atomic-crm/validation/contacts';

/**
 * Check if email has a valid format for avatar generation
 *
 * Uses the same validation as contact forms (Zod schema)
 * to maintain single source of truth.
 *
 * @param email - Email address to validate
 * @returns True if email is valid for avatar generation
 */
export function isValidEmailForAvatar(email: string): boolean {
  const result = emailAndTypeSchema.shape.email.safeParse(email);
  return result.success;
}
```

**Step 4: Run tests to verify Zod implementation**

```bash
npm test -- avatar.utils.test.ts
```

Expected: All tests PASS (same behavior, different implementation)

**Step 5: Verify no regressions in components using avatar utils**

```bash
# Run related tests
npm test -- avatar
npm test -- contact
```

Expected: All tests pass

**Step 6: Commit**

```bash
git add src/atomic-crm/utils/avatar.utils.ts
git add src/atomic-crm/utils/__tests__/avatar.utils.test.ts
git commit -m "refactor(avatar): use Zod schema for email validation

- Replace regex with emailAndTypeSchema from contacts validation
- Ensures single source of truth for email validation
- Fixes Engineering Constitution Rule 2 (Single Source of Truth)
- No behavior change, only consolidates validation logic"
```

---

## Task 3: Add Inline OKLCH Border Fix - Semantic Colors Only

**Priority:** 🟡 High
**Effort:** S (10 minutes)
**Rule:** #7 - SEMANTIC COLORS ONLY

**Files:**
- Modify: `src/atomic-crm/tags/TagChip.tsx:30`
- Modify: `src/index.css` (add semantic variable)

**Context:**
TagChip uses inline OKLCH syntax `border-[oklch(0_0_0_/_0.2)]` instead of semantic CSS variable.

**Step 1: Add semantic CSS variable**

Modify `src/index.css` in the `:root` section (around line 315):

```css
  /* Stroke/Border tokens */
  --stroke-card: oklch(93% 0.004 92);        /* 1px border around elevated cards */
  --stroke-card-hover: oklch(91% 0.006 92);  /* Slightly darker on hover */

  /* NEW: Tag border token */
  --tag-border: oklch(0 0 0 / 0.2);          /* 20% black for tag borders */

  /* Divider tokens */
  --divider-subtle: oklch(96% 0.004 92);     /* On white surfaces, internal dividers */
```

**Step 2: Update TagChip component**

Modify `src/atomic-crm/tags/TagChip.tsx`:

```typescript
// Before (line 30):
// "border border-[oklch(0_0_0_/_0.2)]",

// After:
"border border-[var(--tag-border)]",
```

Full context:

```typescript
return (
  <>
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md cursor-pointer",
        "border border-[var(--tag-border)]",  // ✅ Semantic variable
        "transition-all duration-200",
        "hover:shadow-sm hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        getTagColorClass(tag.color),
      )}
    >
```

**Step 3: Visual regression test**

```bash
# Start dev server
npm run dev

# Manually verify tag borders look identical:
# - Navigate to any page with tags (contacts, organizations, opportunities)
# - Verify border opacity is same (20% black)
# - Verify no visual changes
```

Expected: Tags render identically to before

**Step 4: Run color validation**

```bash
npm run validate:colors
```

Expected: No violations reported (if validation exists)

**Step 5: Commit**

```bash
git add src/index.css
git add src/atomic-crm/tags/TagChip.tsx
git commit -m "refactor(tags): replace inline OKLCH with semantic variable

- Add --tag-border CSS variable for tag border color
- Replace border-[oklch(...)] with border-[var(--tag-border)]
- Fixes Engineering Constitution Rule 7 (Semantic Colors Only)
- No visual change, maintains 20% black opacity"
```

---

## Task 4: Add RPC/Edge Function Validation - API Boundary

**Priority:** 🟡 High
**Effort:** M (3-4 hours)
**Rule:** #2 - SINGLE SOURCE OF TRUTH (API Boundary Validation)

**Files:**
- Create: `src/atomic-crm/validation/rpc.ts`
- Modify: `src/atomic-crm/providers/supabase/unifiedDataProvider.ts:781, 926`

**Context:**
TODOs at lines 781 and 926 indicate missing Zod validation for RPC function parameters and Edge Function parameters.

**Step 1: Identify RPC functions in use**

```bash
# Find all RPC function calls in the codebase
grep -rn "\.rpc(" src/atomic-crm/ --include="*.ts" --include="*.tsx"
```

Expected output: List of RPC function names (e.g., `soft_delete_opportunity`, `get_activity_feed`, etc.)

**Step 2: Create RPC validation schemas**

Create `src/atomic-crm/validation/rpc.ts`:

```typescript
import { z } from 'zod';

/**
 * Validation schemas for Supabase RPC function parameters
 *
 * These schemas enforce type safety at the API boundary for all
 * RPC calls to the database. Each schema corresponds to a specific
 * database function.
 */

// Example: soft_delete_opportunity RPC
export const softDeleteOpportunityParamsSchema = z.object({
  opportunity_id: z.number().int().positive(),
});

// Example: get_activity_feed RPC
export const getActivityFeedParamsSchema = z.object({
  limit_count: z.number().int().positive().default(50),
  offset_count: z.number().int().nonnegative().default(0),
});

// Example: bulk_tag_contacts RPC (if exists)
export const bulkTagContactsParamsSchema = z.object({
  contact_ids: z.array(z.number().int().positive()).min(1),
  tag_id: z.number().int().positive(),
});

// Add more RPC schemas as needed based on grep results

/**
 * Map of RPC function names to their validation schemas
 * Used by unifiedDataProvider to validate params before calling RPC
 */
export const RPC_SCHEMAS = {
  soft_delete_opportunity: softDeleteOpportunityParamsSchema,
  get_activity_feed: getActivityFeedParamsSchema,
  bulk_tag_contacts: bulkTagContactsParamsSchema,
  // Add more mappings here
} as const;

export type RPCFunctionName = keyof typeof RPC_SCHEMAS;
```

**Step 3: Write tests for RPC validation**

Create `src/atomic-crm/validation/__tests__/rpc.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import {
  softDeleteOpportunityParamsSchema,
  getActivityFeedParamsSchema,
  RPC_SCHEMAS
} from '../rpc';

describe('RPC Validation Schemas', () => {
  describe('softDeleteOpportunityParamsSchema', () => {
    it('should accept valid opportunity ID', () => {
      const result = softDeleteOpportunityParamsSchema.safeParse({
        opportunity_id: 123,
      });
      expect(result.success).toBe(true);
    });

    it('should reject negative opportunity ID', () => {
      const result = softDeleteOpportunityParamsSchema.safeParse({
        opportunity_id: -1,
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing opportunity ID', () => {
      const result = softDeleteOpportunityParamsSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('getActivityFeedParamsSchema', () => {
    it('should accept valid pagination params', () => {
      const result = getActivityFeedParamsSchema.safeParse({
        limit_count: 25,
        offset_count: 50,
      });
      expect(result.success).toBe(true);
    });

    it('should apply default values', () => {
      const result = getActivityFeedParamsSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit_count).toBe(50);
        expect(result.data.offset_count).toBe(0);
      }
    });

    it('should reject negative offset', () => {
      const result = getActivityFeedParamsSchema.safeParse({
        offset_count: -10,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('RPC_SCHEMAS registry', () => {
    it('should contain all expected RPC functions', () => {
      expect(RPC_SCHEMAS).toHaveProperty('soft_delete_opportunity');
      expect(RPC_SCHEMAS).toHaveProperty('get_activity_feed');
    });
  });
});
```

**Step 4: Run tests to verify schemas**

```bash
npm test -- rpc.test.ts
```

Expected: All tests PASS

**Step 5: Integrate validation into unifiedDataProvider**

Modify `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` around line 781:

```typescript
// Find the RPC method implementation (around line 760-800)
// Before:
//   rpc: async (functionName, params) => {
//     // TODO: Add Zod validation for RPC params based on function name
//     const { data, error } = await supabase.rpc(functionName, params);
//     ...
//   }

// After:
import { RPC_SCHEMAS, type RPCFunctionName } from '@/atomic-crm/validation/rpc';

// ... in the provider object:

  rpc: async (functionName, params) => {
    // Validate params if schema exists for this RPC function
    if (functionName in RPC_SCHEMAS) {
      const schema = RPC_SCHEMAS[functionName as RPCFunctionName];
      const validationResult = schema.safeParse(params);

      if (!validationResult.success) {
        throw new Error(
          `Invalid RPC parameters for ${functionName}: ${validationResult.error.message}`
        );
      }

      // Use validated params
      params = validationResult.data;
    }

    const { data, error } = await supabase.rpc(functionName, params);

    if (error) {
      throw error;
    }

    return { data };
  },
```

Similarly for Edge Functions around line 926:

```typescript
// Create Edge Function schemas in rpc.ts first:
export const edgeFunctionSchemas = {
  // Add edge function param schemas here
  // Example: process_csv_import: z.object({ ... })
} as const;

// Then add validation in invokeEdgeFunction method:
  invokeEdgeFunction: async (functionName, params) => {
    // Validate params if schema exists
    if (functionName in edgeFunctionSchemas) {
      const schema = edgeFunctionSchemas[functionName];
      const validationResult = schema.safeParse(params);

      if (!validationResult.success) {
        throw new Error(
          `Invalid Edge Function parameters for ${functionName}: ${validationResult.error.message}`
        );
      }

      params = validationResult.data;
    }

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: params,
    });

    if (error) {
      throw error;
    }

    return { data };
  },
```

**Step 6: Test integration**

```bash
# Run provider tests
npm test -- unifiedDataProvider

# Run integration tests if they exist
npm test -- integration
```

Expected: All tests pass, RPC calls validate params before execution

**Step 7: Commit**

```bash
git add src/atomic-crm/validation/rpc.ts
git add src/atomic-crm/validation/__tests__/rpc.test.ts
git add src/atomic-crm/providers/supabase/unifiedDataProvider.ts
git commit -m "feat(validation): add Zod schemas for RPC and Edge Function params

- Create RPC_SCHEMAS registry with validation for all RPC functions
- Add edgeFunctionSchemas for Edge Function parameter validation
- Integrate validation into unifiedDataProvider.rpc() and invokeEdgeFunction()
- Add comprehensive test coverage for RPC schemas
- Resolves TODOs at unifiedDataProvider.ts:781, 926
- Fixes Engineering Constitution Rule 2 (API Boundary Validation)"
```

---

## Task 5: TypeScript Conventions - Convert Type to Interface

**Priority:** 🟢 Medium
**Effort:** M (3-4 hours)
**Rule:** #5 - TYPESCRIPT CONVENTIONS

**Files:**
- Modify: `src/atomic-crm/types.ts` (27 type declarations)
- Modify: Component files with prop types (11 files)

**Context:**
27 object shapes use `type` instead of `interface`, violating TypeScript convention.

**Step 1: Refactor core domain types**

Modify `src/atomic-crm/types.ts`:

```typescript
// Before (lines 40-50):
// export type Sale = {
//   id: number;
//   first_name: string | null;
//   last_name: string | null;
//   ...
// };

// After:
export interface Sale {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  avatar_url: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Convert all domain types (keep unions as type):
export interface Contact { /* ... */ }
export interface OpportunityParticipant { /* ... */ }
export interface OpportunityContact { /* ... */ }
export interface ActivityRecord { /* ... */ }
export interface InteractionParticipant { /* ... */ }
export interface ContactNote { /* ... */ }
export interface Opportunity { /* ... */ }
export interface OpportunityNote { /* ... */ }
export interface Tag { /* ... */ }
export interface Task { /* ... */ }
export interface ActivityOrganizationCreated { /* ... */ }
export interface ActivityContactCreated { /* ... */ }
export interface ActivityContactNoteCreated { /* ... */ }
export interface ActivityOpportunityCreated { /* ... */ }
export interface ActivityOpportunityNoteCreated { /* ... */ }

// Keep these as type (unions/intersections):
export type ActivityType =
  | 'organization_created'
  | 'contact_created'
  | 'contact_note_created'
  | 'opportunity_created'
  | 'opportunity_note_created';

export type Activity =
  | ActivityOrganizationCreated
  | ActivityContactCreated
  | ActivityContactNoteCreated
  | ActivityOpportunityCreated
  | ActivityOpportunityNoteCreated;
```

**Step 2: Refactor component prop types**

Example for `src/components/admin/show-button.tsx`:

```typescript
// Before (line 12):
// export type ShowButtonProps = {
//   label?: string;
//   resource?: string;
// };

// After:
export interface ShowButtonProps {
  label?: string;
  resource?: string;
}
```

Repeat for all component prop types found in audit:
- `src/components/admin/create.tsx:36`
- `src/components/admin/create-button.tsx:7`
- `src/components/admin/delete-button.tsx:16`
- `src/components/admin/edit-button.tsx:13`
- `src/components/admin/user-menu.tsx:16`
- `src/hooks/user-menu-context.tsx:6`
- `src/hooks/simple-form-iterator-context.tsx:17, 52`
- `src/atomic-crm/misc/AsideSection.tsx:5`
- `src/atomic-crm/root/CRM.tsx:35`
- `src/lib/color-types.ts:26`

**Step 3: Run TypeScript compiler**

```bash
npm run type-check
```

Expected: No new type errors (interface is compatible with type)

**Step 4: Run all tests**

```bash
npm test
```

Expected: All tests pass (no runtime behavior change)

**Step 5: Run linter**

```bash
npm run lint
```

Expected: Clean (or add ESLint rule for future enforcement)

**Step 6: Commit**

```bash
git add src/atomic-crm/types.ts
git add src/components/admin/*.tsx
git add src/hooks/*.tsx
git add src/atomic-crm/misc/*.tsx
git add src/atomic-crm/root/*.tsx
git add src/lib/color-types.ts
git commit -m "refactor(types): convert object types to interfaces

- Convert 27 object type declarations to interface
- Maintain type for unions and intersections (ActivityType, Activity)
- Update all component prop types to use interface
- Fixes Engineering Constitution Rule 5 (TypeScript Conventions)
- No behavior change, improves extensibility and IDE support"
```

---

## Task 6: Clean Debug Console.log Statements

**Priority:** 🟢 Medium
**Effort:** M (2 hours)
**Rule:** #4 - BOY SCOUT RULE

**Files:**
- Modify: `src/atomic-crm/contacts/ContactImportDialog.tsx` (15 console.log)
- Modify: `src/atomic-crm/misc/usePapaParse.tsx` (11 console.log)

**Context:**
26 debug console.log statements left in production code from CSV import feature development.

**Step 1: Remove debug logs from ContactImportDialog**

Modify `src/atomic-crm/contacts/ContactImportDialog.tsx`:

Remove or comment out lines 95-97, 281, 289, 301, 310, 317, 348-349, 393-394:

```typescript
// Before (lines 95-97):
//   console.log('📊 [PREVIEW DEBUG] First parsed row:', JSON.stringify(rows[0], null, 2));
//   console.log('📊 [PREVIEW DEBUG] Total rows:', rows.length);
//   console.log('📊 [PREVIEW DEBUG] Headers:', headers.length);

// After: Remove entirely

// If debugging is still needed, use conditional logging:
if (import.meta.env.DEV) {
  // Optional: Keep for development only
  // logger.debug('Preview data', { rows: rows.length, headers: headers.length });
}
```

Repeat for all console.log statements in the file.

**Step 2: Remove debug logs from usePapaParse**

Modify `src/atomic-crm/misc/usePapaParse.tsx`:

Remove or comment out lines 63-65, 77, 91, 101, 111-112, 115, 131, 140, 145, 173:

```typescript
// Remove all console.log, console.error statements
// Keep error handling, but don't log to console in production

// Example transformation:
// Before:
//   console.error("🔴 [PAPA PARSE DEBUG] CSV processing error:", error);

// After (if error handling needed):
//   // Error is already thrown/handled by caller
//   // No console.log in production
```

**Step 3: Verify import functionality still works**

```bash
# Start dev server
npm run dev

# Manual test:
# 1. Navigate to Contacts page
# 2. Click "Import" button
# 3. Upload a test CSV file
# 4. Verify import preview shows correctly
# 5. Complete import
# 6. Verify contacts created successfully
```

Expected: Import works identically, no console spam

**Step 4: Run import tests**

```bash
npm test -- import
npm test -- ContactImportDialog
npm test -- usePapaParse
```

Expected: All tests pass

**Step 5: Check console for remaining debug logs**

```bash
# Search for any remaining console.log in source
grep -rn "console\.log\|console\.debug" src/atomic-crm/ --include="*.ts" --include="*.tsx" | grep -v ".test.ts"
```

Expected: Only test files or legitimate logging remain

**Step 6: Commit**

```bash
git add src/atomic-crm/contacts/ContactImportDialog.tsx
git add src/atomic-crm/misc/usePapaParse.tsx
git commit -m "chore(import): remove debug console.log statements

- Remove 15 debug logs from ContactImportDialog
- Remove 11 debug logs from usePapaParse
- Maintains all error handling without console spam
- Fixes Engineering Constitution Rule 4 (Boy Scout Rule)
- No functional changes, cleaner production code"
```

---

## Task 7: Address High-Priority TODOs

**Priority:** 🟢 Medium
**Effort:** L (6-8 hours)
**Rule:** #4 - BOY SCOUT RULE

**Files:**
- `src/atomic-crm/providers/supabase/dataProviderUtils.ts:32` (LRU cache)
- `src/atomic-crm/services/activities.service.ts:15` (5 queries → 1-2)
- `src/middleware/securityHeaders.ts:128, 151, 153` (CSP production config)

**Context:**
Three high-value TODOs that improve performance and security.

### Subtask 7.1: Implement LRU Cache for Data Provider

**Step 1: Install LRU cache library**

```bash
npm install lru-cache
npm install --save-dev @types/lru-cache
```

**Step 2: Write cache tests**

Create `src/atomic-crm/providers/supabase/__tests__/cache.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { CacheManager } from '../dataProviderCache';

describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = new CacheManager({ max: 100, ttl: 5000 });
  });

  it('should cache and retrieve values', () => {
    cache.set('key1', { data: 'value1' });
    expect(cache.get('key1')).toEqual({ data: 'value1' });
  });

  it('should return undefined for expired entries', async () => {
    cache.set('key2', { data: 'value2' }, { ttl: 100 });

    // Wait for expiration
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(cache.get('key2')).toBeUndefined();
  });

  it('should evict least recently used when max exceeded', () => {
    const smallCache = new CacheManager({ max: 2 });

    smallCache.set('a', 1);
    smallCache.set('b', 2);
    smallCache.set('c', 3); // Should evict 'a'

    expect(smallCache.get('a')).toBeUndefined();
    expect(smallCache.get('b')).toBe(2);
    expect(smallCache.get('c')).toBe(3);
  });
});
```

**Step 3: Implement LRU cache wrapper**

Create `src/atomic-crm/providers/supabase/dataProviderCache.ts`:

```typescript
import { LRUCache } from 'lru-cache';

export interface CacheOptions {
  max?: number;
  ttl?: number; // Time to live in milliseconds
}

export class CacheManager {
  private cache: LRUCache<string, any>;

  constructor(options: CacheOptions = {}) {
    this.cache = new LRUCache({
      max: options.max || 500,
      ttl: options.ttl || 60000, // Default 1 minute
      updateAgeOnGet: true,
    });
  }

  get(key: string): any | undefined {
    return this.cache.get(key);
  }

  set(key: string, value: any, options?: { ttl?: number }): void {
    this.cache.set(key, value, options);
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}

// Singleton instance for data provider
export const dataProviderCache = new CacheManager({
  max: 500,
  ttl: 60000, // 1 minute default TTL
});
```

**Step 4: Integrate cache into dataProviderUtils**

Modify `src/atomic-crm/providers/supabase/dataProviderUtils.ts`:

```typescript
// Line 32: Remove TODO, add cache
// Before:
// // TODO: Replace with proper LRU implementation if cache evictions exceed 1k/hour

// After:
import { dataProviderCache } from './dataProviderCache';

export function getCachedMetadata(key: string): any | undefined {
  return dataProviderCache.get(key);
}

export function setCachedMetadata(key: string, value: any, ttl?: number): void {
  dataProviderCache.set(key, value, ttl ? { ttl } : undefined);
}

export function invalidateCache(pattern?: string): void {
  if (pattern) {
    // Clear specific entries matching pattern
    // (Implement pattern matching if needed)
  } else {
    dataProviderCache.clear();
  }
}
```

**Step 5: Run cache tests**

```bash
npm test -- cache.test.ts
```

Expected: All cache tests pass

**Step 6: Commit cache implementation**

```bash
git add package.json package-lock.json
git add src/atomic-crm/providers/supabase/dataProviderCache.ts
git add src/atomic-crm/providers/supabase/__tests__/cache.test.ts
git add src/atomic-crm/providers/supabase/dataProviderUtils.ts
git commit -m "feat(cache): implement LRU cache for data provider

- Add lru-cache dependency
- Create CacheManager wrapper with TTL support
- Integrate into dataProviderUtils
- Add comprehensive test coverage
- Resolves TODO at dataProviderUtils.ts:32
- Improves performance by caching metadata queries"
```

### Subtask 7.2: Optimize Activities Service (5 queries → 1-2)

**Context:** `activities.service.ts:15` - Currently makes 5 large queries to get latest activities

**Step 1: Analyze current query pattern**

Read `src/atomic-crm/services/activities.service.ts`:

```typescript
// Current implementation likely does:
// 1. SELECT from contacts
// 2. SELECT from organizations
// 3. SELECT from opportunities
// 4. SELECT from notes
// 5. SELECT from tasks
// Then merges and sorts in JavaScript
```

**Step 2: Create database view or RPC**

Create migration: `npx supabase migration new optimize_activity_feed`

```sql
-- Migration: optimize_activity_feed
-- Consolidates 5 queries into single materialized view or RPC function

-- Option 1: Materialized View (faster reads, stale data)
CREATE MATERIALIZED VIEW IF NOT EXISTS activity_feed AS
SELECT
  'contact_created' AS activity_type,
  c.id AS entity_id,
  c.created_at,
  c.created_by,
  row_to_json(c.*) AS entity_data
FROM contacts c
UNION ALL
SELECT
  'organization_created' AS activity_type,
  o.id AS entity_id,
  o.created_at,
  o.created_by,
  row_to_json(o.*) AS entity_data
FROM organizations o
UNION ALL
SELECT
  'opportunity_created' AS activity_type,
  op.id AS entity_id,
  op.created_at,
  op.created_by,
  row_to_json(op.*) AS entity_data
FROM opportunities op
UNION ALL
SELECT
  'note_created' AS activity_type,
  n.id AS entity_id,
  n.created_at,
  n.created_by,
  row_to_json(n.*) AS entity_data
FROM notes n
UNION ALL
SELECT
  'task_created' AS activity_type,
  t.id AS entity_id,
  t.created_at,
  t.created_by,
  row_to_json(t.*) AS entity_data
FROM tasks t
ORDER BY created_at DESC;

-- Create index on created_at for fast filtering
CREATE INDEX IF NOT EXISTS idx_activity_feed_created_at
ON activity_feed(created_at DESC);

-- Refresh function (call periodically or on insert)
CREATE OR REPLACE FUNCTION refresh_activity_feed()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY activity_feed;
END;
$$ LANGUAGE plpgsql;

-- Option 2: RPC Function (always fresh data, slower)
CREATE OR REPLACE FUNCTION get_recent_activities(
  limit_count INT DEFAULT 50,
  offset_count INT DEFAULT 0
)
RETURNS TABLE (
  activity_type TEXT,
  entity_id BIGINT,
  created_at TIMESTAMPTZ,
  created_by TEXT,
  entity_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  (
    SELECT 'contact_created'::TEXT, c.id, c.created_at, c.created_by, to_jsonb(c.*)
    FROM contacts c
    UNION ALL
    SELECT 'organization_created'::TEXT, o.id, o.created_at, o.created_by, to_jsonb(o.*)
    FROM organizations o
    UNION ALL
    SELECT 'opportunity_created'::TEXT, op.id, op.created_at, op.created_by, to_jsonb(op.*)
    FROM opportunities op
    UNION ALL
    SELECT 'note_created'::TEXT, n.id, n.created_at, n.created_by, to_jsonb(n.*)
    FROM notes n
    UNION ALL
    SELECT 'task_created'::TEXT, t.id, t.created_at, t.created_by, to_jsonb(t.*)
    FROM tasks t
  )
  ORDER BY created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON activity_feed TO authenticated;
GRANT EXECUTE ON FUNCTION get_recent_activities TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_activity_feed TO authenticated;
```

**Step 3: Update activities.service.ts**

Modify `src/atomic-crm/services/activities.service.ts`:

```typescript
// Before (5 queries):
// export async function getRecentActivities() {
//   const contacts = await supabase.from('contacts').select('*').order('created_at', { descending: true }).limit(10);
//   const orgs = await supabase.from('organizations').select('*').order('created_at', { descending: true }).limit(10);
//   // ... 3 more queries
//   // Merge and sort in JavaScript
// }

// After (1 query):
import { supabaseClient } from '@/atomic-crm/providers/supabase/client';

/**
 * Get recent activities across all entities
 *
 * Uses optimized activity_feed view or RPC for single-query performance.
 * Replaces 5 individual queries with 1 consolidated query.
 */
export async function getRecentActivities(
  limit: number = 50,
  offset: number = 0
): Promise<Activity[]> {
  // Option A: Use materialized view
  const { data, error } = await supabaseClient
    .from('activity_feed')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Option B: Use RPC function (better for real-time)
  // const { data, error } = await supabaseClient
  //   .rpc('get_recent_activities', { limit_count: limit, offset_count: offset });

  if (error) {
    throw error;
  }

  return data.map(row => ({
    type: row.activity_type,
    id: row.entity_id,
    createdAt: row.created_at,
    createdBy: row.created_by,
    data: row.entity_data,
  }));
}
```

**Step 4: Test performance improvement**

```bash
# Apply migration
npm run db:local:reset

# Run service tests
npm test -- activities.service

# Manual performance test in dev tools:
# - Open dashboard
# - Check Network tab for activity queries
# - Verify single query instead of 5
```

Expected: 1 query instead of 5, ~5x faster load time

**Step 5: Commit optimization**

```bash
git add supabase/migrations/[timestamp]_optimize_activity_feed.sql
git add src/atomic-crm/services/activities.service.ts
git commit -m "perf(activities): optimize feed from 5 queries to 1

- Create activity_feed materialized view for unified activity query
- Add get_recent_activities RPC function for real-time option
- Refactor activities.service to use single query
- Resolves FIXME at activities.service.ts:15
- Performance improvement: 5 queries → 1 query (~5x faster)"
```

### Subtask 7.3: Configure Production CSP Headers

**Step 1: Create CSP configuration file**

Create `src/config/csp-config.ts`:

```typescript
export interface CSPConfig {
  reportOnly: boolean;
  reportUri?: string;
  directives: {
    defaultSrc: string[];
    scriptSrc: string[];
    styleSrc: string[];
    imgSrc: string[];
    connectSrc: string[];
    fontSrc: string[];
    objectSrc: string[];
    frameSrc: string[];
  };
}

export const developmentCSP: CSPConfig = {
  reportOnly: true,
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
    connectSrc: ["'self'", 'http://localhost:*', 'ws://localhost:*'],
    fontSrc: ["'self'", 'data:'],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
  },
};

export const productionCSP: CSPConfig = {
  reportOnly: false, // Enforce in production
  reportUri: '/api/csp-report',
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // Tailwind requires unsafe-inline
    imgSrc: [
      "'self'",
      'data:',
      'https://ui-avatars.com', // Avatar generation service
      'https://*.supabase.co',  // Supabase storage
    ],
    connectSrc: [
      "'self'",
      'https://*.supabase.co',  // Supabase API
      'wss://*.supabase.co',    // Supabase realtime
    ],
    fontSrc: ["'self'", 'data:'],
    objectSrc: ["'none'"],
    frameSrc: ["'none'"],
  },
};
```

**Step 2: Update securityHeaders middleware**

Modify `src/middleware/securityHeaders.ts`:

```typescript
// Lines 128, 151, 153 - Replace TODOs with config
import { developmentCSP, productionCSP } from '@/config/csp-config';

function getCSPConfig() {
  const isDevelopment = import.meta.env.DEV;
  return isDevelopment ? developmentCSP : productionCSP;
}

export function buildCSPHeader(): string {
  const config = getCSPConfig();

  const directives = Object.entries(config.directives)
    .map(([key, values]) => {
      const directiveName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${directiveName} ${values.join(' ')}`;
    })
    .join('; ');

  const reportDirective = config.reportUri
    ? `; report-uri ${config.reportUri}`
    : '';

  return directives + reportDirective;
}

// Use in middleware:
export function applySecurityHeaders(response: Response): Response {
  const cspHeader = buildCSPHeader();
  const headerName = getCSPConfig().reportOnly
    ? 'Content-Security-Policy-Report-Only'
    : 'Content-Security-Policy';

  response.headers.set(headerName, cspHeader);
  // ... other security headers

  return response;
}
```

**Step 3: Test CSP configuration**

```bash
# Start dev server
npm run dev

# Check browser console for CSP violations
# Navigate through app to test all features

# Build for production
npm run build
npm run preview

# Verify CSP header in production mode
```

Expected: No CSP violations in console, app functions normally

**Step 4: Commit CSP configuration**

```bash
git add src/config/csp-config.ts
git add src/middleware/securityHeaders.ts
git commit -m "feat(security): configure production CSP headers

- Add environment-specific CSP configurations
- Production config includes Supabase and avatar service domains
- Development uses report-only mode with relaxed rules
- Resolves TODOs at securityHeaders.ts:128, 151, 153
- Improves security by enforcing CSP in production"
```

---

## Verification & Final Steps

### Step 1: Run full test suite

```bash
npm test
```

Expected: All tests pass

### Step 2: Run type checking

```bash
npm run type-check
```

Expected: No type errors

### Step 3: Run linting

```bash
npm run lint
```

Expected: No linting errors (or only low-priority warnings)

### Step 4: Build for production

```bash
npm run build
```

Expected: Build succeeds without errors

### Step 5: Re-run constitution audit

Run the audit report slash command again to verify improvements:

```bash
# In Claude Code:
/report:constitution-audit
```

Expected compliance scores:
- Rule 1: 100% ✅ (unchanged)
- Rule 2: 100% ✅ (was 99.9%, fixed email validation)
- Rule 3: 100% ✅ (unchanged)
- Rule 4: 98%+ ✅ (was 94.1%, cleaned console.logs and major TODOs)
- Rule 5: 100% ✅ (was 96.4%, fixed type/interface)
- Rule 6: 100% ✅ (unchanged)
- Rule 7: 100% ✅ (was 99.9%, fixed inline OKLCH)
- Rule 8: 100% ✅ (unchanged)
- Rule 9: 100% ✅ (was 85.7%, added missing GRANTs)

**Overall: 98%+ compliance** (target achieved!)

### Step 6: Create summary PR

```bash
# View all commits
git log --oneline origin/main..HEAD

# Create PR
gh pr create \
  --title "Engineering Constitution Audit Remediation (92.3% → 98%+ compliance)" \
  --body "$(cat <<'EOF'
## Summary

Addresses all high and medium priority violations from the 2025-11-01 Engineering Constitution audit, improving compliance from 92.3% to 98%+.

## Changes

### 🔴 Critical Fixes
- **Database Security (Rule 9):** Added missing GRANT permissions for all RLS-enabled tables
- **Email Validation Drift (Rule 2):** Replaced avatar.utils regex with Zod schema import
- **RPC Validation (Rule 2):** Added Zod schemas for all RPC and Edge Function parameters

### 🟡 High Priority
- **Inline OKLCH (Rule 7):** Replaced direct OKLCH with semantic CSS variable in TagChip
- **TypeScript Conventions (Rule 5):** Converted 27 object types to interfaces
- **Debug Logging (Rule 4):** Removed 26 console.log statements from import dialogs

### 🟢 Medium Priority
- **LRU Cache (Rule 4):** Implemented proper LRU cache for data provider
- **Activities Performance (Rule 4):** Optimized from 5 queries to 1 (5x faster)
- **CSP Configuration (Rule 4):** Added production CSP header configuration

## Test Results

- ✅ All tests pass
- ✅ Type checking clean
- ✅ Linting clean
- ✅ Production build succeeds
- ✅ Constitution compliance: 98%+

## Migration Required

This PR includes database migrations that must be applied:
- `restore_missing_authenticated_grants.sql` - Adds GRANT permissions
- `optimize_activity_feed.sql` - Creates activity_feed view

Run: \`npm run db:cloud:push\` after merge (test locally first!)

## Breaking Changes

None. All changes are backward compatible.

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

---

## Completion Checklist

- [ ] Task 1: Database security audit complete
- [ ] Task 2: Email validation using Zod
- [ ] Task 3: Inline OKLCH removed
- [ ] Task 4: RPC/Edge function validation added
- [ ] Task 5: Type → interface conversion complete
- [ ] Task 6: Debug console.log statements removed
- [ ] Task 7: High-priority TODOs resolved
- [ ] All tests passing
- [ ] Constitution compliance ≥ 98%
- [ ] PR created and ready for review

---

## Notes for Engineer

**Constitution Principles Referenced:**
- @.claude/skills/engineering-constitution/SKILL.md
- @.claude/engineering-constitution.md

**Database Workflows:**
- @docs/supabase/WORKFLOW.md - Complete database guide
- @scripts/db/PRODUCTION-WARNING.md - Safety checklist

**Architecture Context:**
- @CLAUDE.md - Project overview and conventions
- @docs/claude/architecture-essentials.md - System design patterns

**Testing Strategy:**
- @docs/claude/testing-quick-reference.md - Testing patterns

**Estimated Total Time:** 18-28 hours (can be done incrementally)

**Priority Order:**
1. Task 1 (Database Security) - Blocks production
2. Task 2 (Email Validation) - Quick win
3. Task 3 (OKLCH Fix) - Quick win
4. Task 4 (RPC Validation) - Prevents runtime errors
5. Tasks 5-7 - Can be done in parallel or incrementally

**Questions?** Refer to constitution skill or ask for clarification.
