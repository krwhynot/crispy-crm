# Expanded Critical Items Remediation Plan (TDD Edition)

**Source:** `/docs/audits/2026-01-08-full-audit.md`
**Generated:** 2026-01-09
**Testing Strategy:** Test-Driven Development (TDD) with pgTAP + Vitest
**Total Critical Issues:** 51

---

## Testing Philosophy

### TDD Red-Green-Refactor Cycle

```
┌─────────────────────────────────────────────────────────────┐
│  1. RED    → Write failing test that defines expected fix   │
│  2. GREEN  → Implement minimal code to pass the test        │
│  3. REFACTOR → Clean up while keeping tests green           │
└─────────────────────────────────────────────────────────────┘
```

### Testing Layers

| Layer | Tool | Purpose | When |
|-------|------|---------|------|
| **Database** | pgTAP | RLS policies, functions, constraints | P0-P1 Security |
| **Integration** | Vitest + Supabase | Data provider, cache invalidation | P2 Stability |
| **Component** | Vitest + RTL | Forms, UI state | P2-P3 |
| **E2E** | Manual Checklist | Full user flows | Pre-deploy |

---

## Phase 0: Test Infrastructure Setup

*Before fixing anything, set up the testing foundation*

### 0-1. Install pgTAP Test Helpers

**Effort:** ⏱️ 15 min
**Why First:** All RLS tests depend on these helpers

```bash
# Create the setup test file (runs first alphabetically)
supabase test new 000-setup-test-hooks
```

```sql
-- supabase/tests/database/000-setup-test-hooks.test.sql

-- Install pgtap extension for testing
create extension if not exists pgtap with schema extensions;

-- Install test helpers from database.dev
-- These provide: tests.create_supabase_user(), tests.authenticate_as(), etc.
select dbdev.install('basejump-supabase_test_helpers');
create extension if not exists "basejump-supabase_test_helpers" version '0.0.6';

-- Verify setup with a sanity check
begin;
select plan(2);

-- Test 1: Verify pgtap is available
select has_extension('pgtap', 'pgtap extension installed');

-- Test 2: Verify test helpers are available
select has_function('tests', 'create_supabase_user', 'test helpers installed');

select * from finish();
rollback;
```

**Run:**
```bash
supabase test db
```

- [ ] pgTAP extension installed
- [ ] Test helpers installed
- [ ] Sanity check passes

---

### 0-2. Create RLS Test Template

**Effort:** ⏱️ 10 min

```sql
-- supabase/tests/database/001-rls-schema-check.test.sql
-- Verifies RLS is enabled on all public tables

begin;
select plan(1);

-- This single test verifies RLS is enabled across ALL public tables
select tests.rls_enabled('public');

select * from finish();
rollback;
```

- [ ] RLS schema check test created
- [ ] Test passes (RLS already enabled)

---

### 0-3. Create Vitest Test Utilities

**Effort:** ⏱️ 20 min

```typescript
// src/tests/utils/supabase-test-client.ts
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Admin client for test setup (bypasses RLS)
export const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Regular client for testing RLS
export const createTestClient = () => createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Generate unique test IDs to avoid conflicts
export const generateTestId = () => crypto.randomUUID();

// Create test user with unique email
export async function createTestUser(prefix: string) {
  const id = generateTestId();
  const email = `${prefix}-${id}@test.com`;

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password: 'test-password-123',
    email_confirm: true,
  });

  if (error) throw error;
  return { id: data.user.id, email };
}

// Cleanup test data after tests
export async function cleanupTestUser(userId: string) {
  await adminClient.auth.admin.deleteUser(userId);
}
```

```typescript
// src/tests/utils/query-client-test.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, RenderHookOptions } from '@testing-library/react';
import { ReactNode } from 'react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

// Helper to test cache invalidation
export function renderHookWithQueryClient<T>(
  hook: () => T,
  options?: RenderHookOptions<T>
) {
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  return {
    ...renderHook(hook, { wrapper, ...options }),
    queryClient,
  };
}
```

- [ ] Supabase test client utilities created
- [ ] Query client test utilities created
- [ ] Test utilities importable

---

## P0: IMMEDIATE (TDD Approach) - 8 Items

### P0-1. Fix Function Search Paths

#### Step 1: Write Failing Test (RED)

```sql
-- supabase/tests/database/010-function-security.test.sql
begin;
select plan(3);

-- Test 1: increment_opportunity_version should have search_path set
select results_eq(
  $$
    SELECT proconfig::text[] @> ARRAY['search_path=']
    FROM pg_proc
    WHERE proname = 'increment_opportunity_version'
  $$,
  ARRAY[true],
  'increment_opportunity_version has empty search_path'
);

-- Test 2: [second function] should have search_path set
select results_eq(
  $$
    SELECT proconfig::text[] @> ARRAY['search_path=']
    FROM pg_proc
    WHERE proname = 'second_function_name'
  $$,
  ARRAY[true],
  'second_function has empty search_path'
);

-- Test 3: [third function] should have search_path set
select results_eq(
  $$
    SELECT proconfig::text[] @> ARRAY['search_path=']
    FROM pg_proc
    WHERE proname = 'third_function_name'
  $$,
  ARRAY[true],
  'third_function has empty search_path'
);

select * from finish();
rollback;
```

**Run test (should FAIL):**
```bash
supabase test db --filter "010-function-security"
```

#### Step 2: Implement Fix (GREEN)

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_fix_function_search_paths.sql
ALTER FUNCTION increment_opportunity_version() SET search_path = '';
-- Repeat for other functions
```

#### Step 3: Verify Test Passes

```bash
supabase test db --filter "010-function-security"
# Expected: All 3 tests pass
```

- [ ] Test written (RED - fails initially)
- [ ] Migration created
- [ ] Test passes (GREEN)
- [ ] Applied to staging
- [ ] Applied to production

---

### P0-2. Move pg_trgm Extension

#### Step 1: Write Failing Test (RED)

```sql
-- supabase/tests/database/011-extension-security.test.sql
begin;
select plan(1);

-- pg_trgm should NOT be in public schema
select results_eq(
  $$
    SELECT extnamespace::regnamespace::text
    FROM pg_extension
    WHERE extname = 'pg_trgm'
  $$,
  ARRAY['extensions'],
  'pg_trgm extension is in extensions schema (not public)'
);

select * from finish();
rollback;
```

#### Step 2: Implement Fix (GREEN)

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_move_pg_trgm.sql
DROP EXTENSION IF EXISTS pg_trgm;
CREATE EXTENSION pg_trgm SCHEMA extensions;
```

#### Step 3: Verify

```bash
supabase test db --filter "011-extension-security"
```

- [ ] Test written (RED)
- [ ] Migration created
- [ ] Test passes (GREEN)

---

### P0-3. Fix Silent Storage Cleanup

#### Step 1: Write Failing Test (RED)

```typescript
// src/atomic-crm/contacts/__tests__/contactsCallbacks.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the storage cleanup function
vi.mock('../storage', () => ({
  cleanupStorage: vi.fn(),
}));

import { cleanupStorage } from '../storage';
import { contactsCallbacks } from '../contactsCallbacks';

describe('contactsCallbacks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('afterDelete', () => {
    it('should log error when storage cleanup fails', async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const mockError = new Error('Storage cleanup failed');
      vi.mocked(cleanupStorage).mockRejectedValue(mockError);

      // Act
      await contactsCallbacks.afterDelete({ id: 'test-id' });

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('cleanup failed'),
        expect.objectContaining({ error: mockError })
      );

      consoleSpy.mockRestore();
    });

    it('should not throw when storage cleanup fails', async () => {
      // Arrange
      vi.mocked(cleanupStorage).mockRejectedValue(new Error('Network error'));

      // Act & Assert - should not throw
      await expect(
        contactsCallbacks.afterDelete({ id: 'test-id' })
      ).resolves.not.toThrow();
    });
  });
});
```

**Run test (should FAIL):**
```bash
npx vitest run src/atomic-crm/contacts/__tests__/contactsCallbacks.test.ts
```

#### Step 2: Implement Fix (GREEN)

```typescript
// src/atomic-crm/contacts/contactsCallbacks.ts (line ~164)

// Before (fire-and-forget)
cleanupStorage(id).catch(() => {});

// After (logged failure)
try {
  await cleanupStorage(id);
} catch (error: unknown) {
  console.error('[ContactsCallbacks] Storage cleanup failed:', {
    id,
    error: error instanceof Error ? error : new Error(String(error))
  });
  // Don't rethrow - cleanup is best-effort but we log it
}
```

#### Step 3: Verify

```bash
npx vitest run src/atomic-crm/contacts/__tests__/contactsCallbacks.test.ts
```

- [ ] Test written (RED)
- [ ] Fix implemented
- [ ] Test passes (GREEN)

---

### P0-4. Make principal_organization_id Required

#### Step 1: Write Failing Tests (RED)

**Database Test:**
```sql
-- supabase/tests/database/012-required-fields.test.sql
begin;
select plan(1);

-- principal_organization_id should be NOT NULL
select col_not_null(
  'public',
  'opportunities',
  'principal_organization_id',
  'principal_organization_id must be NOT NULL'
);

select * from finish();
rollback;
```

**API Test:**
```typescript
// src/atomic-crm/validation/__tests__/opportunities.test.ts
import { describe, it, expect } from 'vitest';
import { opportunityCreateSchema } from '../opportunities';

describe('opportunityCreateSchema', () => {
  it('should reject opportunity without principal_organization_id', () => {
    const invalidData = {
      name: 'Test Opportunity',
      stage: 'new_lead',
      // Missing principal_organization_id
    };

    const result = opportunityCreateSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(
        issue => issue.path.includes('principal_organization_id')
      )).toBe(true);
    }
  });

  it('should accept opportunity with valid principal_organization_id', () => {
    const validData = {
      name: 'Test Opportunity',
      stage: 'new_lead',
      principal_organization_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    const result = opportunityCreateSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
```

#### Step 2: Implement Fixes (GREEN)

**Zod Schema:**
```typescript
// src/atomic-crm/validation/opportunities.ts
// Before
principal_organization_id: z.string().uuid().nullable(),

// After
principal_organization_id: z.string().uuid(), // Required, not nullable
```

**Database Migration:**
```sql
-- supabase/migrations/YYYYMMDDHHMMSS_require_principal_organization.sql

-- First verify no nulls exist (run manually first)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM opportunities WHERE principal_organization_id IS NULL) THEN
    RAISE EXCEPTION 'Cannot add NOT NULL constraint: null values exist';
  END IF;
END $$;

-- Add the constraint
ALTER TABLE opportunities
ALTER COLUMN principal_organization_id SET NOT NULL;
```

- [ ] Database test written (RED)
- [ ] API test written (RED)
- [ ] Zod schema updated
- [ ] Migration created
- [ ] Both tests pass (GREEN)

---

### P0-5. Remove Silent Stage Default

#### Step 1: Write Failing Tests (RED)

```typescript
// src/atomic-crm/validation/__tests__/opportunities-stage.test.ts
import { describe, it, expect } from 'vitest';
import { opportunityCreateSchema } from '../opportunities';

describe('opportunity stage validation', () => {
  it('should NOT have a default stage value', () => {
    const dataWithoutStage = {
      name: 'Test Opportunity',
      principal_organization_id: '123e4567-e89b-12d3-a456-426614174000',
      // stage intentionally omitted
    };

    const result = opportunityCreateSchema.safeParse(dataWithoutStage);

    // Should FAIL validation, not silently default
    expect(result.success).toBe(false);
  });

  it('should require explicit stage selection', () => {
    const dataWithStage = {
      name: 'Test Opportunity',
      principal_organization_id: '123e4567-e89b-12d3-a456-426614174000',
      stage: 'new_lead', // Explicitly provided
    };

    const result = opportunityCreateSchema.safeParse(dataWithStage);
    expect(result.success).toBe(true);
  });
});
```

#### Step 2: Implement Fix (GREEN)

```typescript
// src/atomic-crm/validation/opportunities.ts

// Before
stage: z.enum([...STAGE_VALUES]).default('new_lead'),

// After
stage: z.enum([...STAGE_VALUES]), // Required, no default
```

- [ ] Test written (RED)
- [ ] Schema updated
- [ ] Test passes (GREEN)
- [ ] UI updated with placeholder

---

### P0-6, P0-7, P0-8: Similar TDD Pattern

*Apply same RED → GREEN → REFACTOR cycle*

---

## P1: SECURITY HARDENING - RLS Tests

### Comprehensive RLS Test Suite

**This is the most critical testing section.**

#### Step 1: Create Cross-Organization Test File

```sql
-- supabase/tests/database/020-rls-cross-org-protection.test.sql
-- Tests that users CANNOT access data from other organizations

begin;
select plan(36); -- 3 tests per table × 12 tables

-- ============================================
-- SETUP: Create test organizations and users
-- ============================================

-- Create test users
select tests.create_supabase_user('org1_user', 'org1@test.com');
select tests.create_supabase_user('org2_user', 'org2@test.com');

-- Create test organizations (as service role to bypass RLS)
select tests.authenticate_as_service_role();

insert into organizations (id, name, slug)
values
  ('11111111-1111-1111-1111-111111111111', 'Org 1', 'org-1'),
  ('22222222-2222-2222-2222-222222222222', 'Org 2', 'org-2');

-- Add users to their respective orgs
insert into organization_members (organization_id, user_id, role)
values
  ('11111111-1111-1111-1111-111111111111', tests.get_supabase_uid('org1_user'), 'admin'),
  ('22222222-2222-2222-2222-222222222222', tests.get_supabase_uid('org2_user'), 'admin');

-- Create test data in Org 2 (that Org 1 user should NOT access)
insert into activities (id, organization_id, type, description)
values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'call', 'Org 2 Activity');

insert into contacts (id, organization_id, first_name, last_name)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Org2', 'Contact');

-- ... similar for other tables

-- ============================================
-- TEST: activities table
-- ============================================
select tests.authenticate_as('org1_user');

-- Test 1: Org 1 user cannot SELECT Org 2 activities
select is_empty(
  $$SELECT * FROM activities WHERE organization_id = '22222222-2222-2222-2222-222222222222'$$,
  'Org 1 user cannot SELECT Org 2 activities'
);

-- Test 2: Org 1 user cannot INSERT into Org 2
select throws_ok(
  $$INSERT INTO activities (organization_id, type, description)
    VALUES ('22222222-2222-2222-2222-222222222222', 'call', 'Hacked!')$$,
  '42501',
  NULL,
  'Org 1 user cannot INSERT activities for Org 2'
);

-- Test 3: Org 1 user cannot UPDATE Org 2 activities
select results_ne(
  $$UPDATE activities SET description = 'Hacked!'
    WHERE organization_id = '22222222-2222-2222-2222-222222222222'
    RETURNING 1$$,
  $$VALUES (1)$$,
  'Org 1 user cannot UPDATE Org 2 activities'
);

-- ============================================
-- TEST: contacts table
-- ============================================

-- Test 4: Cannot SELECT cross-org contacts
select is_empty(
  $$SELECT * FROM contacts WHERE organization_id = '22222222-2222-2222-2222-222222222222'$$,
  'Org 1 user cannot SELECT Org 2 contacts'
);

-- Test 5: Cannot INSERT cross-org contacts
select throws_ok(
  $$INSERT INTO contacts (organization_id, first_name, last_name)
    VALUES ('22222222-2222-2222-2222-222222222222', 'Hacked', 'Contact')$$,
  '42501',
  NULL,
  'Org 1 user cannot INSERT contacts for Org 2'
);

-- Test 6: Cannot UPDATE cross-org contacts
select results_ne(
  $$UPDATE contacts SET first_name = 'Hacked!'
    WHERE organization_id = '22222222-2222-2222-2222-222222222222'
    RETURNING 1$$,
  $$VALUES (1)$$,
  'Org 1 user cannot UPDATE Org 2 contacts'
);

-- ============================================
-- Repeat pattern for remaining 10 tables:
-- contact_notes, interaction_participants, opportunity_notes,
-- opportunity_participants, organization_notes, organizations,
-- product_distributors, products, segments, tags
-- ============================================

-- [Tests 7-36 follow same pattern]

select * from finish();
rollback;
```

#### Step 2: Run Tests (Should FAIL with current permissive policies)

```bash
supabase test db --filter "020-rls-cross-org"
# Expected: Multiple failures showing security holes
```

#### Step 3: Create RLS Policy Migration

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_harden_rls_policies.sql

-- =====================================================
-- Helper function for org membership checks
-- =====================================================
CREATE OR REPLACE FUNCTION private.user_belongs_to_org(org_id uuid)
RETURNS boolean
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- TABLE: activities
-- =====================================================
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON activities;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON activities;

CREATE POLICY "activities_insert_own_org" ON activities
FOR INSERT WITH CHECK (
  private.user_belongs_to_org(organization_id)
);

CREATE POLICY "activities_update_own_org" ON activities
FOR UPDATE USING (
  private.user_belongs_to_org(organization_id)
);

CREATE POLICY "activities_select_own_org" ON activities
FOR SELECT USING (
  private.user_belongs_to_org(organization_id)
);

-- =====================================================
-- Repeat for all 12 tables...
-- =====================================================
```

#### Step 4: Run Tests Again (Should PASS)

```bash
supabase test db --filter "020-rls-cross-org"
# Expected: All 36 tests pass
```

#### Checklist

- [ ] Test file created with 36 tests
- [ ] Tests fail initially (confirms security holes)
- [ ] Helper function created
- [ ] All 12 tables have new policies
- [ ] All 36 tests pass
- [ ] Migration applied to staging
- [ ] Manual verification on staging
- [ ] Migration applied to production

---

## P2: STABILITY - Cache Invalidation Tests

### React Query Cache Invalidation Testing

#### Step 1: Test Global Invalidation Pattern

```typescript
// src/tests/integration/cache-invalidation.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '../utils/query-client-test';

describe('Cache Invalidation Patterns', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: Infinity },
      },
    });
  });

  describe('QuickLogForm', () => {
    it('should invalidate activities cache after creating activity', async () => {
      // Arrange
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      // Pre-populate cache
      queryClient.setQueryData(['activities'], [{ id: '1', type: 'call' }]);

      // Act - simulate form submission
      await simulateQuickLogSubmit(queryClient, {
        type: 'email',
        description: 'Test activity',
      });

      // Assert
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(['activities']),
      });
    });
  });

  describe('BulkReassignButton', () => {
    it('should invalidate all affected resource caches after bulk reassign', async () => {
      // Arrange
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      // Act
      await simulateBulkReassign(queryClient, {
        contactIds: ['1', '2', '3'],
        newOwnerId: 'new-user-id',
      });

      // Assert - should invalidate contacts AND opportunities (cascading)
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(['contacts']),
      });
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: expect.arrayContaining(['opportunities']),
      });
    });
  });
});
```

#### Step 2: Implement Centralized Cache Invalidation

```typescript
// src/lib/query-invalidation.ts
import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized invalidation patterns per mutation type.
 * This ensures consistent cache updates across the app.
 */
export const invalidationPatterns = {
  'activity.create': ['activities', 'opportunities'],
  'activity.update': ['activities'],
  'contact.reassign': ['contacts', 'opportunities', 'activities'],
  'contact.bulkReassign': ['contacts', 'opportunities', 'activities'],
  'opportunity.archive': ['opportunities'],
  'opportunity.bulkArchive': ['opportunities', 'contacts'],
} as const;

export function invalidateForMutation(
  queryClient: QueryClient,
  mutationType: keyof typeof invalidationPatterns
) {
  const keys = invalidationPatterns[mutationType];
  keys.forEach(key => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
}
```

#### Step 3: Apply to All Affected Files

```typescript
// src/atomic-crm/activities/QuickLogForm.tsx
import { invalidateForMutation } from '@/lib/query-invalidation';

const mutation = useMutation({
  mutationFn: createActivity,
  onSuccess: () => {
    invalidateForMutation(queryClient, 'activity.create');
    // UI updates immediately without refresh
  },
});
```

#### Checklist for Each Cache Invalidation Fix

| File | Test Written | Fix Applied | Test Passes |
|------|--------------|-------------|-------------|
| QuickLogForm.tsx | [ ] | [ ] | [ ] |
| ActivityNoteForm.tsx | [ ] | [ ] | [ ] |
| BulkReassignButton.tsx | [ ] | [ ] | [ ] |
| UserDisableReassignDialog.tsx | [ ] | [ ] | [ ] |
| useBulkActionsState.ts | [ ] | [ ] | [ ] |

---

## P3: Technical Debt - Component Tests

### TypeScript Error Handling Tests

```typescript
// src/tests/typescript-safety.test.ts
import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('TypeScript Safety', () => {
  it('should have no implicit any in catch blocks', async () => {
    // Run tsc with strict mode to find implicit any
    const { stdout, stderr } = await execAsync(
      'npx tsc --noEmit --strict 2>&1 | grep -c "catch clause" || true'
    );

    const implicitAnyCount = parseInt(stdout.trim(), 10);
    expect(implicitAnyCount).toBe(0);
  }, 30000); // 30s timeout for tsc

  it('should have no @ts-ignore directives', async () => {
    const { stdout } = await execAsync(
      'grep -r "@ts-ignore" src/ --include="*.ts" --include="*.tsx" | wc -l'
    );

    expect(parseInt(stdout.trim(), 10)).toBe(0);
  });
});
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test-database.yml
name: Database Tests

on:
  push:
    branches: [main, develop]
    paths:
      - 'supabase/migrations/**'
      - 'supabase/tests/**'
  pull_request:
    branches: [main]

jobs:
  test-database:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Start Supabase
        run: supabase start

      - name: Run Database Tests
        run: supabase test db

      - name: Run RLS Security Tests
        run: supabase test db --filter "rls"

  test-application:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run Unit Tests
        run: npm run test:unit

      - name: Run Integration Tests
        run: npm run test:integration
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

---

## Testing Execution Order

```
Phase 0: Infrastructure (1 hour)
├── 0-1: Install pgTAP helpers
├── 0-2: Create RLS test template
└── 0-3: Create Vitest utilities

Phase P0: Immediate Fixes (TDD) (3-4 hours)
├── For each item:
│   ├── Write failing test (RED)
│   ├── Implement fix (GREEN)
│   └── Verify test passes
└── Run full test suite

Phase P1: Security (TDD) (5-6 hours)
├── Write 36 RLS cross-org tests (RED)
├── Create policy migration (GREEN)
├── Verify all 36 tests pass
└── Manual staging verification

Phase P2: Stability (TDD) (3-4 hours)
├── Write cache invalidation tests
├── Implement centralized pattern
└── Apply to all 5 files

Phase P3: Tech Debt (2-3 hours)
├── TypeScript safety tests
└── Code quality fixes
```

---

## Test Commands Reference

```bash
# Database tests (pgTAP)
supabase test db                              # Run all
supabase test db --filter "rls"              # Run RLS tests only
supabase test db --filter "020"              # Run specific test file

# Application tests (Vitest)
npm run test                                  # Run all tests
npm run test:unit                             # Unit tests only
npm run test:integration                      # Integration tests
npx vitest run path/to/test.ts               # Specific file
npx vitest --watch                           # Watch mode

# TypeScript checks
npx tsc --noEmit                             # Type check only
npx tsc --noEmit --strict                    # Strict mode check

# Combined pre-deploy check
npm run test && supabase test db && npx tsc --noEmit
```

---

## Verification Checklist (Before Deployment)

### Database Layer
- [ ] All pgTAP tests pass (`supabase test db`)
- [ ] RLS cross-org tests pass (36 tests)
- [ ] Function security tests pass
- [ ] Required field constraint tests pass

### Application Layer
- [ ] All Vitest tests pass (`npm run test`)
- [ ] Cache invalidation tests pass
- [ ] TypeScript compiles without errors
- [ ] No @ts-ignore directives remain

### Manual Verification
- [ ] Cross-org data access blocked (manual test)
- [ ] Forms require principal_organization_id
- [ ] Stage requires explicit selection
- [ ] Bulk operations refresh UI immediately

### CI/CD
- [ ] GitHub Actions workflow passes
- [ ] Staging deployment successful
- [ ] 24-hour monitoring period complete

---

*Generated with TDD methodology based on Supabase and React Query best practices*
*Reference: Supabase Testing Guide, TanStack Query Documentation*
