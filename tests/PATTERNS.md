# E2E and Integration Test Patterns

Testing patterns for Crispy CRM - real database integration, security validation, and rapid smoke testing.

## Architecture Overview

```
tests/
├── simple-smoke-test.sh     # 30-sec health check (curl-based)
├── integration/
│   ├── setup.ts             # Vitest setup (unmock Supabase)
│   ├── supabase-harness.ts  # Test client + cleanup
│   ├── supabase-harness.test.ts  # Harness self-test
│   ├── auth-flow.test.ts    # Auth integration tests
│   ├── rls-policies.test.ts # RLS policy verification
│   ├── csv-import.test.ts   # Import with sanitization
│   └── RLS-TEST-FINDINGS.md # Test findings documentation (📍 Key: RLS policy conflicts discovered)
├── fixtures/
│   ├── contacts-valid.csv       # Happy path data
│   ├── contacts-invalid.csv     # Edge cases
│   └── contacts-formula-injection.csv  # Security tests
├── screenshots/                 # 📍 Location: tests/screenshots/
│   ├── dashboard-*.png          # Dashboard UI captures
│   ├── widget-*.png             # Component-level captures
│   ├── pipeline-chart.png       # Visualization captures
│   ├── metrics-grid.png         # Layout captures
│   └── search-org.png           # Feature-specific captures
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

Quick bash-based health checks that validate dev server, Vite bundling, and Supabase connectivity in ~30 seconds.

**When to use**: Quick pre-commit validation, CI health checks, deployment verification

### Core Structure

```bash
// tests/simple-smoke-test.sh
set -e  # Exit on any error

echo "🔥 Atomic CRM - Simple Smoke Test"
echo "=================================="

# Colors for visual feedback
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test 1: Check if app is running
echo "📡 Test 1: Check if dev server is running..."
if curl -s http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✓${NC} Dev server is running"
else
    echo -e "${RED}✗${NC} Dev server is not running"
    echo "   Run: npm run dev"
    exit 1
fi

# Test 4: Check if critical API endpoints are accessible
echo "🔌 Test 4: Check Supabase connection..."
SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2)
if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}✗${NC} VITE_SUPABASE_URL not found in .env"
    exit 1
fi

if curl -s "$SUPABASE_URL/rest/v1/" -H "apikey: $(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2)" > /dev/null; then
    echo -e "${GREEN}✓${NC} Supabase API is reachable"
else
    echo -e "${RED}✗${NC} Cannot connect to Supabase"
    exit 1
fi
```

**Key points:**
- Exit on first failure with `set -e` (fail-fast principle)
- Color-coded output for visual scanning in terminal
- Environment variable extraction from `.env` via `grep | cut`
- Target: 30 seconds total execution
- Clear next-step guidance on failure

---

## Pattern B: Integration Test Harness

Real Supabase connections with proper cleanup for testing RLS policies, auth flows, and data validation.

**When to use**: Testing RLS policies, auth flows, data validation with real database

### ⚠️ CRITICAL: RLS Policy Security Findings

**Status**: As of 2025-11-16, RLS policies DO NOT match CLAUDE.md requirements

**Root Cause**: Migration `20251111121526_add_role_based_permissions.sql` created permissive UPDATE policies with `USING (true)` that override earlier admin-only policies. PostgreSQL RLS combines multiple policies with OR logic - if ANY policy allows access, the operation succeeds.

**Current Impact**:
- ❌ **Contacts**: Non-admin users CAN update (should be admin-only)
- ❌ **Organizations**: Non-admin users CAN update (should be admin-only)
- ❌ **Opportunities**: Non-admin users CAN update (should be admin-only)
- ❌ **Tasks**: SELECT shows all tasks (should only show user's own tasks)

**Required Action**: Drop permissive policies from migration `20251111121526` or update CLAUDE.md if new behavior is intentional.

See `tests/integration/RLS-TEST-FINDINGS.md` for full analysis and remediation SQL.

### Test Harness Structure

```typescript
// tests/integration/supabase-harness.ts
export interface TestHarness {
  client: SupabaseClient;
  cleanup: () => Promise<void>;
  seedData: {
    organizationIds: number[];
    contactIds: number[];
  };
}

export async function createTestHarness(): Promise<TestHarness> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL!;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials in .env.test");
  }

  const client = createClient(supabaseUrl, supabaseKey);

  // Authenticate with test user (required for RLS policies)
  const { error: authError } = await client.auth.signInWithPassword({
    email: "admin@test.com",
    password: "password123",
  });

  if (authError) {
    throw new Error(`Authentication failed: ${authError.message}`);
  }

  const seedData = {
    organizationIds: [] as number[],
    contactIds: [] as number[],
  };

  const cleanup = async () => {
    // Delete test data in reverse dependency order
    if (seedData.contactIds.length > 0) {
      await client.from("contacts").delete().in("id", seedData.contactIds);
    }
    if (seedData.organizationIds.length > 0) {
      await client.from("organizations").delete().in("id", seedData.organizationIds);
    }
  };

  return { client, cleanup, seedData };
}
```

### Integration Test Setup

```typescript
// tests/integration/setup.ts
import { vi } from "vitest";
import dotenv from "dotenv";

// Load test environment variables
dotenv.config({ path: ".env.test" });

// CRITICAL: Unmock Supabase for real database connections
vi.unmock("@supabase/supabase-js");
```

### Setup Hook Choice: beforeAll vs beforeEach

Both `beforeAll` and `beforeEach` are valid patterns - choose based on test isolation needs:

| Hook | Use When | Example |
|------|----------|---------|
| `beforeAll` | Setup is expensive and can be shared across tests (DB connections, auth, fixtures) | Recommended for RLS tests: create users once, run multiple permission checks |
| `beforeEach` | Tests may mutate state and need fresh setup for isolation | CSV import: fresh harness per test to avoid data pollution |

**Note**: Current RLS tests (`rls-policies.test.ts`) use `beforeEach` for stricter isolation, creating fresh users per test. This is safer but less efficient than the `beforeAll` recommendation.

```typescript
// beforeAll: Shared expensive setup (RECOMMENDED for RLS)
describe("RLS Policies", () => {
  let adminClient: SupabaseClient;

  beforeAll(async () => {
    // Create test users once - expensive operation
    adminClient = await createAuthenticatedClient("admin");
  });

  afterAll(async () => {
    await cleanup();
  });
});

// beforeEach: Isolated per-test setup (CURRENT IMPLEMENTATION)
describe("CSV Import", () => {
  let harness: TestHarness;

  beforeEach(async () => {
    // Fresh harness per test - tests may mutate seedData
    harness = await createTestHarness();
  });

  afterEach(async () => {
    await harness.cleanup();
  });
});
```

### RLS Policy Testing

```typescript
// tests/integration/rls-policies.test.ts
describe("RLS Policy Integration", () => {
  let adminClient: SupabaseClient;
  let repClient: SupabaseClient;
  let serviceRoleClient: SupabaseClient;

  const testData = {
    contactIds: [] as number[],
    organizationIds: [] as number[],
    taskIds: [] as number[],
    userIds: [] as string[],
  };

  beforeAll(async () => {
    // Create service role client for user creation (admin operations)
    serviceRoleClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create non-admin rep user using service role client
    const { data: repAuthData, error: repSignUpError } =
      await serviceRoleClient.auth.admin.createUser({
        email: repUser.email,
        password: repUser.password,
        email_confirm: true,
      });

    // Wait for trigger to create sales record
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Cleanup in reverse dependency order
    if (testData.taskIds.length > 0) {
      await adminClient.from("tasks").delete().in("id", testData.taskIds);
    }
    if (testData.contactIds.length > 0) {
      await adminClient.from("contacts").delete().in("id", testData.contactIds);
    }
  });

  it("allows admin to UPDATE contacts", async () => {
    const { data: contact } = await adminClient
      .from("contacts")
      .insert({ name: "Test Contact", first_name: "Test", last_name: "Contact" })
      .select()
      .single();

    testData.contactIds.push(contact!.id);

    const { data: updated, error: updateError } = await adminClient
      .from("contacts")
      .update({ name: "Updated Contact" })
      .eq("id", contact!.id)
      .select()
      .single();

    expect(updateError).toBeNull();
    expect(updated!.name).toBe("Updated Contact");
  });

  it("prevents non-admin from UPDATE contacts", async () => {
    const { data: contact } = await adminClient
      .from("contacts")
      .insert({ name: "Test Contact", first_name: "Test", last_name: "Contact" })
      .select()
      .single();

    testData.contactIds.push(contact!.id);

    // Rep cannot update - RLS returns empty array
    const { data: updated } = await repClient
      .from("contacts")
      .update({ name: "Hacked Contact" })
      .eq("id", contact!.id)
      .select();

    expect(updated).toEqual([]);
  });
});
```

**Key points:**
- Real Supabase connection - no mocking in integration tests
- Track created entities in `seedData` object for cleanup
- Delete in reverse dependency order (contacts before organizations)
- Service role client for user creation (bypasses RLS)
- Wait for database triggers with `setTimeout` when needed

---

## Pattern C: Security Fixture Testing

CSV fixtures with formula injection test data and sanitization verification.

**When to use**: CSV import, user input sanitization, security validation

### Fixture Organization

```
// tests/fixtures/
contacts-valid.csv          # Happy path
contacts-invalid.csv        # Missing required fields
contacts-formula-injection.csv  # =cmd, @SUM attacks
```

### Formula Injection Fixture

```csv
// tests/fixtures/contacts-formula-injection.csv
First Name,Last Name,Email
=cmd|'/c calc'!A0,Hacker,hacker@evil.com
@SUM(1+1),Injector,inject@evil.com
```

### Formula Injection Test

```typescript
// tests/integration/csv-import.test.ts
describe("CSV Import Integration", () => {
  let harness: Awaited<ReturnType<typeof createTestHarness>>;

  beforeEach(async () => {
    harness = await createTestHarness();
  });

  afterEach(async () => {
    if (harness) {
      await harness.cleanup();
    }
  });

  it("rejects formula injection attempts", async () => {
    const csvPath = "tests/fixtures/contacts-formula-injection.csv";
    const csvContent = fs.readFileSync(csvPath, "utf-8");

    const parsed = Papa.parse(csvContent, { header: true });
    const rows = parsed.data as any[];

    // Test first row (=cmd formula)
    const row1 = rows[0];
    const sanitized1 = sanitizeCsvValue(row1["First Name"]);
    expect(sanitized1).toMatch(/^'=/); // Escaped with leading quote
    expect(sanitized1).toBe("'=cmd|'/c calc'!A0");

    // Test second row (@SUM formula)
    const row2 = rows[1];
    const sanitized2 = sanitizeCsvValue(row2["First Name"]);
    expect(sanitized2).toMatch(/^'@/); // Escaped with leading quote
    expect(sanitized2).toBe("'@SUM(1+1)");
  });

  it("handles CSV with sanitized values correctly in database", async () => {
    const csvPath = "tests/fixtures/contacts-formula-injection.csv";
    const csvContent = fs.readFileSync(csvPath, "utf-8");

    const parsed = Papa.parse(csvContent, { header: true });
    const contacts = (parsed.data as any[]).map((row) => ({
      first_name: sanitizeCsvValue(row["First Name"]),
      last_name: sanitizeCsvValue(row["Last Name"]),
      name: `${sanitizeCsvValue(row["First Name"])} ${sanitizeCsvValue(row["Last Name"])}`.trim(),
    }));

    const { data, error } = await harness.client.from("contacts").insert(contacts).select();

    expect(error).toBeNull();
    expect(data![0].first_name).toBe("'=cmd|'/c calc'!A0");

    harness.seedData.contactIds = data!.map((c) => c.id);
  });
});
```

**Key points:**
- Minimal fixture files - just enough data for scenario
- Formula injection prefixes to test: `=`, `@`, `+`, `-`
- Sanitization escapes with leading single quote
- Security fixtures must be tested, not just exist

---

## Pattern D: Screenshot Capture

Viewport-aware screenshot naming for visual regression testing and debugging.

**When to use**: Visual regression testing, debugging UI issues, documenting features

### Naming Convention

```
{feature}-{type}-{viewport}.png

Examples:
├── dashboard-viewport-1280x720.png   # Desktop viewport
├── dashboard-viewport-768x1024.png   # iPad portrait
├── dashboard-fullpage-768x1024.png   # Full scroll capture
├── dashboard-full.png                # Full dashboard
├── dashboard-ipad.png                # iPad specific
├── widget-my-open-opps.png           # Component-level
├── pipeline-chart.png                # Visualization capture
├── metrics-grid.png                  # Layout capture
└── search-org.png                    # Feature capture
```

**Key points:**
- Include viewport dimensions for responsive tests (1280x720, 768x1024)
- Separate fullpage from viewport captures
- Component-level captures for isolated testing
- Descriptive feature names without version numbers

---

## Pattern Comparison Table

| Aspect | Smoke Test | Integration Test | Fixture Test |
|--------|------------|------------------|--------------|
| **Speed** | ~30 sec | 1-5 min | N/A (data only) |
| **Database** | API only | Real Supabase | Test data |
| **When to run** | Pre-commit | CI/nightly | With integration |
| **Cleanup** | None needed | Required | N/A |
| **Tool** | bash + curl | Vitest | CSV files |

---

## Anti-Patterns to Avoid

### 1. Mocking Supabase in Integration Tests

```typescript
// BAD: Mocking defeats the purpose of integration tests
vi.mock('@supabase/supabase-js');

// GOOD: Use vi.unmock in setup.ts for real connections
vi.unmock('@supabase/supabase-js');
const client = createClient(url, key);
```

### 2. Not Cleaning Up Test Data

```typescript
// BAD: Leaves orphan data in database
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
// BAD: Credentials in source control
const client = createClient(url, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

// GOOD: Load from .env.test
dotenv.config({ path: '.env.test' });
const key = process.env.VITE_SUPABASE_ANON_KEY!;
```

### 4. Not Waiting for Database Triggers

```typescript
// BAD: Race condition with auth triggers
const { data } = await serviceRoleClient.auth.admin.createUser({ ... });
const { data: sales } = await client.from('sales').select().eq('user_id', data.user.id);
// sales might be empty!

// GOOD: Wait for trigger to complete
const { data } = await serviceRoleClient.auth.admin.createUser({ ... });
await new Promise((resolve) => setTimeout(resolve, 1000));
const { data: sales } = await client.from('sales').select().eq('user_id', data.user.id);
```

---

## Integration Test Checklist

When adding a new integration test:

1. [ ] Create test user in `beforeAll` with service role client
2. [ ] Track all created entities in `testData` object
3. [ ] Implement cleanup in `afterAll` (reverse dependency order)
4. [ ] Use `.env.test` for credentials, never hardcode
5. [ ] Run: `npx vitest run --config vitest.integration.config.ts tests/integration/{test}.test.ts`

When adding a new fixture:

1. [ ] Place in `tests/fixtures/` with descriptive name
2. [ ] Keep minimal - only data needed for scenario
3. [ ] Include security variants if handling user input
4. [ ] Reference with relative path from test file

---

## Environment Configuration

```bash
# .env.test - Local Supabase for integration tests
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.-7wL35-YnDVohXfRR7EKrOSmJvPesV5Tk0pxmMmNVxE
VITE_USE_COMPOSED_PROVIDER=true
```

---

## File Reference

| Pattern | Primary Files | Status |
|---------|---------------|--------|
| **A: Smoke Test** | `simple-smoke-test.sh` | ✅ Implemented |
| **B: Integration Harness** | `integration/supabase-harness.ts`, `integration/setup.ts` | ✅ Implemented |
| **C: Security Fixtures** | `fixtures/contacts-formula-injection.csv`, `integration/csv-import.test.ts` | ✅ Implemented |
| **D: Screenshots** | `screenshots/*.png` (located at `tests/screenshots/`) | ✅ 10 screenshots captured |
| **RLS Testing** | `integration/rls-policies.test.ts`, `integration/RLS-TEST-FINDINGS.md` | ⚠️ Policy conflicts found |
| **Auth Testing** | `integration/auth-flow.test.ts` | ✅ Implemented |

### RLS Testing - Critical Security Findings

**Location**: `tests/integration/RLS-TEST-FINDINGS.md`

**Key Finding**: As of 2025-11-16, RLS policies have conflicting permissive policies (UPDATE with `USING (true)`) that override admin-only restrictions. PostgreSQL OR-logic combines policies, so if ANY policy allows access, the operation succeeds.

**Affected Resources**:
- Contacts: Non-admin users CAN update (should be admin-only)
- Organizations: Non-admin users CAN update (should be admin-only)
- Opportunities: Non-admin users CAN update (should be admin-only)
- Tasks: SELECT shows all records (should show only user's own tasks)

**Root Cause**: Migration `20251111121526_add_role_based_permissions.sql` added permissive UPDATE policies.

**Resolution**: Drop permissive policies from migration or update CLAUDE.md if new behavior is intentional.

### Screenshots Directory

**Location**: `tests/screenshots/`

**Current Captures** (10 files):
- Dashboard: fullpage (2 viewports), viewport (2 sizes), iPad, full view
- Components: widget-my-open-opps, pipeline-chart, metrics-grid
- Features: search-org

**Naming Convention**: `{feature}-{type}-{viewport}.png`
- `{feature}`: dashboard, widget, component name
- `{type}`: viewport, fullpage (optional for simple captures)
- `{viewport}`: 1280x720, 768x1024 (optional)
