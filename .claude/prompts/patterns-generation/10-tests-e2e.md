---
name: generate-patterns-tests-e2e
directory: tests/
complexity: MEDIUM
output: tests/PATTERNS.md
---

# Generate PATTERNS.md for E2E and Integration Tests

## Context

The `tests/` directory contains end-to-end and integration tests for Crispy CRM. It is organized into:

- **Smoke tests** - Quick health checks (~30 seconds) to catch critical issues
- **Integration tests** - Real Supabase database tests for auth flows, RLS policies, CSV imports
- **Fixtures** - Test data files including valid, invalid, and security-focused CSV samples
- **Screenshots** - Visual regression and debugging captures
- **UI prototypes** - HTML mockups for rapid prototyping workflows

Key testing patterns include real database connections (not mocked), RLS policy verification, formula injection prevention, and test harness cleanup strategies.

---

## Phase 1: Exploration

Read these files to understand the testing architecture:

### Smoke Test Structure
| File | Purpose |
|------|---------|
| `tests/simple-smoke-test.sh` | Bash-based quick health check - dev server, Vite, Supabase connectivity |

### Integration Test Organization
| File | Purpose |
|------|---------|
| `tests/integration/setup.ts` | Test setup that unmocks Supabase for real DB connections |
| `tests/integration/supabase-harness.ts` | Test harness with cleanup functions and seed data tracking |
| `tests/integration/supabase-harness.test.ts` | Self-test for the harness pattern |
| `tests/integration/auth-flow.test.ts` | Login/logout, session management, token refresh |
| `tests/integration/rls-policies.test.ts` | RLS policy verification for admin-only operations |
| `tests/integration/csv-import.test.ts` | CSV import with sanitization and formula injection prevention |
| `tests/integration/RLS-TEST-FINDINGS.md` | Documentation of RLS test discoveries and recommendations |

### Fixture Management
| File | Purpose |
|------|---------|
| `tests/fixtures/contacts-valid.csv` | Happy path test data |
| `tests/fixtures/contacts-invalid.csv` | Missing fields, validation edge cases |
| `tests/fixtures/contacts-formula-injection.csv` | Security test data with Excel formula injection attempts |

### UI Prototypes
| File | Purpose |
|------|---------|
| `tests/ui-prototypes/trade-show-data-entry.html` | Standalone HTML prototype for UX testing |

---

## Phase 2: Pattern Identification

Identify and document these 4 patterns:

### Pattern A: Smoke Test Structure
**What to look for:**
- Sequential test execution with early exit on failure (`set -e`)
- Color-coded output for quick visual feedback
- Minimal dependencies (curl only)
- Environment variable extraction from `.env`
- Target completion time (~30 seconds)
- Clear next-step guidance on failure

### Pattern B: Integration Test Harness
**What to look for:**
- Real Supabase client creation (not mocked)
- Authentication with test users before running tests
- `seedData` object pattern for tracking created entities
- `cleanup()` function that deletes in reverse dependency order
- `beforeEach`/`afterEach` lifecycle hooks for setup/teardown
- Service role client for admin operations (user creation, bypassing RLS)

### Pattern C: Test Fixture Management
**What to look for:**
- CSV fixtures organized by test scenario (valid, invalid, security)
- Formula injection test data (`=cmd`, `@SUM` patterns)
- Sanitization verification (`sanitizeCsvValue()` usage)
- File path constants relative to project root
- Fixture files are minimal - just enough data to test the scenario

### Pattern D: Screenshot Organization
**What to look for:**
- Naming convention: `{feature}-{viewport|context}.png`
- Viewport-specific captures (1280x720, 768x1024 for iPad)
- Component-level captures for isolated testing
- Full-page vs viewport distinction

---

## Phase 3: Generate PATTERNS.md

Use this structure for the output:

```markdown
# E2E and Integration Test Patterns

Testing patterns for Crispy CRM - real database integration, security validation, and rapid smoke testing.

## Architecture Overview

```
tests/
├── simple-smoke-test.sh     # 30-sec health check (curl-based)
├── integration/
│   ├── setup.ts             # Vitest setup (unmock Supabase)
│   ├── supabase-harness.ts  # Test client + cleanup
│   ├── auth-flow.test.ts    # Auth integration tests
│   ├── rls-policies.test.ts # RLS policy verification
│   ├── csv-import.test.ts   # Import with sanitization
│   └── RLS-TEST-FINDINGS.md # Test findings documentation
├── fixtures/
│   ├── contacts-valid.csv       # Happy path data
│   ├── contacts-invalid.csv     # Edge cases
│   └── contacts-formula-injection.csv  # Security tests
├── screenshots/
│   └── {feature}-{viewport}.png # Visual regression
└── ui-prototypes/
    └── trade-show-data-entry.html  # UX mockups
```

Data flow:
```
Smoke Test:  curl → dev server → Supabase API
Integration: Vitest → Supabase Client → Real Database → Cleanup
```

---

## Pattern A: Smoke Test Structure

{Describe the bash smoke test pattern with early exit, color output, and environment extraction}

**When to use**: Quick pre-commit validation, CI health checks, deployment verification

### Core Structure

```bash
// tests/simple-smoke-test.sh
{Include the key pattern elements: set -e, color codes, curl checks}
```

**Key points:**
- {Exit on first failure with `set -e`}
- {Color-coded output for visual scanning}
- {Environment variable extraction from `.env`}
- {Target: 30 seconds total execution}

---

## Pattern B: Integration Test Harness

{Describe the supabase-harness.ts pattern for real DB testing}

**When to use**: Testing RLS policies, auth flows, data validation with real database

### Test Harness Structure

```typescript
// tests/integration/supabase-harness.ts
{Include TestHarness interface, createTestHarness function, cleanup pattern}
```

### RLS Policy Testing

```typescript
// tests/integration/rls-policies.test.ts
{Include admin vs rep client creation, policy verification pattern}
```

**Key points:**
- {Real Supabase connection - no mocking}
- {Track created entities in seedData for cleanup}
- {Delete in reverse dependency order}
- {Service role client for user creation}

---

## Pattern C: Security Fixture Testing

{Describe the CSV fixture pattern including formula injection prevention}

**When to use**: CSV import, user input sanitization, security validation

### Fixture Organization

```
// tests/fixtures/
contacts-valid.csv          # Happy path
contacts-invalid.csv        # Missing required fields
contacts-formula-injection.csv  # =cmd, @SUM attacks
```

### Formula Injection Test

```typescript
// tests/integration/csv-import.test.ts
{Include sanitizeCsvValue test pattern}
```

**Key points:**
- {Minimal fixture files - just enough for scenario}
- {Formula injection prefixes: `=`, `@`, `+`, `-`}
- {Sanitization escapes with leading quote}
- {Security fixtures must be tested, not just exist}

---

## Pattern D: Screenshot Capture

{Describe the screenshot naming and organization pattern}

**When to use**: Visual regression testing, debugging UI issues, documenting features

### Naming Convention

```
{feature}-{type}-{viewport}.png

Examples:
- dashboard-viewport-1280x720.png   # Desktop viewport
- dashboard-viewport-768x1024.png   # iPad portrait
- dashboard-fullpage-768x1024.png   # Full scroll capture
- widget-my-open-opps.png           # Component-level
```

**Key points:**
- {Include viewport dimensions for responsive tests}
- {Separate fullpage from viewport captures}
- {Component-level captures for isolated testing}

---

## Pattern Comparison Table

| Aspect | Smoke Test | Integration Test | Fixture Test |
|--------|------------|------------------|--------------|
| **Speed** | ~30 sec | 1-5 min | N/A (data only) |
| **Database** | API only | Real Supabase | Test data |
| **When to run** | Pre-commit | CI/nightly | With integration |
| **Cleanup** | None needed | Required | N/A |

---

## Anti-Patterns to Avoid

### 1. Mocking Supabase in Integration Tests

```typescript
// BAD: Mocking defeats the purpose
vi.mock('@supabase/supabase-js');

// GOOD: Use vi.unmock in setup.ts
vi.unmock('@supabase/supabase-js');
const client = createClient(url, key);
```

### 2. Not Cleaning Up Test Data

```typescript
// BAD: Leaves orphan data
afterEach(async () => {
  // nothing!
});

// GOOD: Delete in reverse dependency order
afterEach(async () => {
  await client.from('contacts').delete().in('id', testData.contactIds);
  await client.from('organizations').delete().in('id', testData.organizationIds);
});
```

### 3. Hardcoded Test Credentials in Code

```typescript
// BAD: Credentials in source
const client = createClient(url, 'eyJ...');

// GOOD: Load from .env.test
dotenv.config({ path: '.env.test' });
const key = process.env.VITE_SUPABASE_ANON_KEY!;
```

---

## Integration Test Checklist

When adding a new integration test:

1. [ ] Create test user in `beforeEach` with service role client
2. [ ] Track all created entities in `testData` object
3. [ ] Implement `cleanup()` in `afterEach` (reverse dependency order)
4. [ ] Use `.env.test` for credentials, never hardcode
5. [ ] Verify: `npx vitest run --config vitest.integration.config.ts tests/integration/{test}.test.ts`

When adding a new fixture:

1. [ ] Place in `tests/fixtures/` with descriptive name
2. [ ] Keep minimal - only data needed for scenario
3. [ ] Include security variants if handling user input
4. [ ] Reference with relative path from test file

---

## File Reference

| Pattern | Primary Files |
|---------|---------------|
| **A: Smoke Test** | `simple-smoke-test.sh` |
| **B: Integration Harness** | `integration/supabase-harness.ts`, `integration/setup.ts` |
| **C: Security Fixtures** | `fixtures/contacts-formula-injection.csv`, `integration/csv-import.test.ts` |
| **D: Screenshots** | `screenshots/*.png` |
```

---

## Phase 4: Write the File

Write the generated PATTERNS.md to:
`/home/krwhynot/projects/crispy-crm/tests/PATTERNS.md`

Ensure all code examples use real code from the files read in Phase 1. Do not use placeholder text or pseudo-code.
