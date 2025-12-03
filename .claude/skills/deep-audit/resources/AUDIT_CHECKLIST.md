# Deep Audit Checklist

Detailed checklist for each audit phase. Use this during audits to ensure comprehensive coverage.

---

## Table of Contents

1. [Phase 1: Critical Issues](#phase-1-critical-issues)
   - [Security Checklist](#11-security-checklist)
   - [Data Integrity Checklist](#12-data-integrity-checklist)
   - [Runtime Error Checklist](#13-runtime-error-checklist)
2. [Phase 2: Improvements](#phase-2-improvements)
   - [Code Quality Checklist](#21-code-quality-checklist)
   - [UI/UX Compliance Checklist](#22-uiux-compliance-checklist)
   - [Performance Checklist](#23-performance-checklist)
3. [Phase 3: Polish](#phase-3-polish)
   - [Test Coverage Checklist](#31-test-coverage-checklist)
   - [Documentation Checklist](#32-documentation-checklist)
   - [Developer Experience Checklist](#33-developer-experience-checklist)
4. [File Locations Quick Reference](#file-locations-quick-reference)
5. [Commands to Run](#commands-to-run)

---

## Phase 1: Critical Issues

### 1.1 Security Checklist

#### RLS Policies
- [ ] All tables with user data have RLS enabled
- [ ] Policies restrict access to authenticated users
- [ ] Multi-tenant isolation (organization-based access)
- [ ] No SELECT * without WHERE clauses in policies

```sql
-- Check for tables missing RLS
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT tablename FROM pg_tables t
  JOIN pg_policies p ON t.tablename = p.tablename
);
```

#### Authentication
- [ ] All data-fetching components check auth state
- [ ] Protected routes use auth guards
- [ ] Tokens not exposed in client-side code
- [ ] Session handling follows React Admin patterns

#### Input Validation
- [ ] All user input validated at API boundary (unifiedDataProvider)
- [ ] NO validation in form components (wrong layer)
- [ ] Zod schemas cover all fields
- [ ] Error messages don't expose internals

#### SQL Injection
- [ ] No string concatenation in SQL
- [ ] All dynamic values parameterized
- [ ] Edge Functions use parameterized queries

#### XSS Prevention
- [ ] No `dangerouslySetInnerHTML` without sanitization
- [ ] User content escaped before display
- [ ] URLs validated before use in links/images

#### Secrets
- [ ] No hardcoded API keys in code
- [ ] Environment variables used correctly
- [ ] `.env` files in `.gitignore`
- [ ] Edge Function secrets via `supabase secrets set`

---

### 1.2 Data Integrity Checklist

#### Single Source of Truth
- [ ] ALL data access through `unifiedDataProvider.ts`
- [ ] No direct `@supabase/supabase-js` imports in components
- [ ] No direct fetch/axios calls to Supabase

```bash
# Find violations
grep -r "from '@supabase/supabase-js'" src/atomic-crm/ --include="*.tsx"
grep -r "createClient" src/atomic-crm/ --include="*.tsx"
```

#### Zod Validation Placement
- [ ] Validation ONLY in `unifiedDataProvider.ts`
- [ ] NO `.parse()` or `.safeParse()` in form components
- [ ] Schemas defined in `src/atomic-crm/validation/`

#### Soft Deletes
- [ ] Using `deleted_at` (NOT `archived_at`)
- [ ] Queries filter `WHERE deleted_at IS NULL`
- [ ] Hard deletes only in migrations/cleanup

#### Junction Tables
- [ ] Contacts linked to orgs via `contact_organizations`
- [ ] NOT using deprecated `Contact.company_id`
- [ ] Many-to-many relationships properly modeled

#### Type Safety
- [ ] No `any` types
- [ ] Interfaces for object shapes
- [ ] Types for unions/intersections
- [ ] Database types generated from Supabase

---

### 1.3 Runtime Error Checklist

#### Fail-Fast Violations (CRITICAL)
- [ ] NO retry logic anywhere
- [ ] NO circuit breakers
- [ ] NO exponential backoff
- [ ] NO graceful fallbacks that hide errors

```bash
# Find violations
grep -rn "CircuitBreaker\|MAX_RETRIES\|maxRetries\|exponential.*backoff" src/
grep -rn "catch.*return.*cached\|catch.*return.*default" src/
```

#### Error Boundaries
- [ ] Feature modules wrapped in error boundaries
- [ ] Async components have boundary parents
- [ ] Errors propagate (not swallowed)

#### Null Safety
- [ ] Optional chaining (`?.`) not hiding bugs
- [ ] Null checks have clear intent
- [ ] Default values are intentional (not defensive)

---

## Phase 2: Improvements

### 2.1 Code Quality Checklist

#### DRY Violations
- [ ] No duplicated validation logic
- [ ] No duplicated fetch patterns
- [ ] Shared utilities extracted
- [ ] Common components reused

#### Feature Structure
Each feature should have:
- [ ] `index.tsx` - Entry + error boundaries
- [ ] `FeatureList.tsx` - List view
- [ ] `FeatureCreate.tsx` - Create form
- [ ] `FeatureEdit.tsx` - Edit form
- [ ] `FeatureSlideOver.tsx` - Side panel (40vw)

#### TypeScript Patterns
- [ ] `interface` for object shapes
- [ ] `type` for unions/intersections
- [ ] Proper generics usage
- [ ] No unnecessary type assertions

#### Code Organization
- [ ] Imports sorted (external, internal, relative)
- [ ] No circular dependencies
- [ ] Clear module boundaries

---

### 2.2 UI/UX Compliance Checklist

#### Semantic Colors (CRITICAL)
- [ ] NO raw hex values (`#ffffff`)
- [ ] NO raw oklch values
- [ ] NO Tailwind color classes (`bg-green-600`)
- [ ] ONLY semantic tokens (`bg-primary`, `text-muted-foreground`)

```bash
# Find violations
grep -rn "bg-\(red\|green\|blue\|gray\|slate\)-" src/ --include="*.tsx"
grep -rn "#[0-9a-fA-F]\{3,6\}" src/ --include="*.tsx"
```

**Correct mappings:**
| Use This | Not This |
|----------|----------|
| `text-muted-foreground` | `text-gray-500` |
| `bg-primary` | `bg-green-600` |
| `text-destructive` | `text-red-500` |
| `bg-card` | `bg-white` |
| `border-border` | `border-gray-200` |

#### Touch Targets
- [ ] All buttons minimum `h-11 w-11` (44x44px)
- [ ] All clickable elements 44px minimum
- [ ] Adequate spacing between touch targets

#### Accessibility
- [ ] All images have `alt` text
- [ ] Form inputs have labels
- [ ] ARIA attributes where needed
- [ ] Focus states visible
- [ ] Color contrast meets WCAG AA

#### Responsive Design
- [ ] Desktop-first (1440px+) primary
- [ ] iPad support (tablet breakpoints)
- [ ] No horizontal overflow
- [ ] Touch-friendly on tablets

---

### 2.3 Performance Checklist

#### Database Queries
- [ ] No N+1 queries (fetching in loops)
- [ ] Appropriate indexes exist
- [ ] SELECT only needed columns
- [ ] Pagination implemented

#### React Performance
- [ ] `useMemo` for expensive calculations
- [ ] `useCallback` for stable references
- [ ] No unnecessary re-renders
- [ ] Keys used correctly in lists

#### Bundle Size
- [ ] Large dependencies tree-shaken
- [ ] Dynamic imports for code splitting
- [ ] No duplicate dependencies
- [ ] Images optimized

---

## Phase 3: Polish

### 3.1 Test Coverage Checklist

#### Unit Tests
- [ ] Components have tests in `__tests__/`
- [ ] Using `renderWithAdminContext()` from `src/tests/utils/render-admin.tsx`
- [ ] Supabase mocked in `src/tests/setup.ts`
- [ ] Tests verify behavior, not implementation

#### E2E Tests
- [ ] Critical user flows covered
- [ ] POMs in `tests/e2e/support/poms/`
- [ ] Semantic selectors only (`getByRole`, `getByLabel`)
- [ ] NO CSS selectors
- [ ] Auth state in `tests/e2e/.auth/user.json`

#### Test Quality
- [ ] Tests actually test something
- [ ] Assertions are meaningful
- [ ] Edge cases covered
- [ ] Error states tested

---

### 3.2 Documentation Checklist

#### Code Documentation
- [ ] Public APIs have JSDoc
- [ ] Complex logic explained
- [ ] No outdated comments
- [ ] Types self-document where possible

#### Project Documentation
- [ ] README up to date
- [ ] Setup instructions work
- [ ] Architecture documented
- [ ] API documented

---

### 3.3 Developer Experience Checklist

#### File Organization
- [ ] Files in correct directories
- [ ] Consistent naming (PascalCase components, camelCase utils)
- [ ] Index files for clean imports
- [ ] No orphan files

#### Dead Code
- [ ] No unused imports
- [ ] No unused functions/variables
- [ ] No commented-out code blocks
- [ ] No TODO/FIXME without issues

#### Consistency
- [ ] ESLint rules followed
- [ ] Prettier formatting applied
- [ ] Naming conventions consistent
- [ ] Patterns consistent across features

---

## File Locations Quick Reference

| Category | Location |
|----------|----------|
| Features | `src/atomic-crm/{feature}/` |
| Data Provider | `src/atomic-crm/providers/supabase/unifiedDataProvider.ts` |
| Validation | `src/atomic-crm/validation/` |
| Components | `src/components/admin/` |
| Migrations | `supabase/migrations/` |
| Edge Functions | `supabase/functions/` |
| Unit Tests | `src/**/__tests__/` |
| E2E Tests | `tests/e2e/` |
| POMs | `tests/e2e/support/poms/` |

---

## Commands to Run

```bash
# Type check
npx tsc --noEmit

# Build
npm run build

# Unit tests
npm test

# E2E tests
npx playwright test

# Find direct Supabase imports
grep -r "from '@supabase/supabase-js'" src/atomic-crm/

# Find raw color values
grep -rn "bg-\(red\|green\|blue\|gray\)-" src/ --include="*.tsx"

# Find fail-fast violations
grep -rn "CircuitBreaker\|MAX_RETRIES\|catch.*return" src/

# Find small touch targets
grep -rn "h-[0-9]\s\|w-[0-9]\s" src/ --include="*.tsx" | grep -v "h-1[1-9]\|h-[2-9][0-9]\|w-1[1-9]\|w-[2-9][0-9]"
```

---

**Last Updated:** 2025-12-03
