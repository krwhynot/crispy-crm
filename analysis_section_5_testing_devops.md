# Testing & DevOps Architecture Analysis - Atomic CRM

**Analysis Date:** 2025-11-07
**Project:** Atomic CRM v0.1.0
**Stack:** React 19 + Vite + TypeScript + Supabase + Vitest + Playwright

---

## Executive Summary

Atomic CRM implements a comprehensive testing and DevOps infrastructure designed for pre-launch velocity while maintaining production safety. The system combines **67 unit test files** with **13 E2E test specs**, enforces **70% code coverage minimum**, and provides **multi-stage CI/CD pipelines** with production safeguards. The architecture prioritizes fast local development cycles through database reset workflows, parallel test execution, and optimized build configurations that reduce bundle sizes by **7.7MB** through strategic code splitting.

---

## 1. Testing Strategy

### 1.1 Testing Philosophy

**Engineering Constitution Alignment:**
- **Pre-launch Velocity:** Fast feedback loops over resilience patterns
- **Fail-Fast Approach:** Tests catch errors early, no defensive coding
- **Single Source of Truth:** Zod schemas validate at API boundary, tests verify UI matches schemas

**Coverage Requirements (Enforced):**
```typescript
// vitest.config.ts
coverage: {
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70
  }
}
```

**Test Distribution:**
- **Unit Tests:** 67 test files across `/src` directory
- **E2E Tests:** 13 Playwright specs in `/tests/e2e`
- **Integration Tests:** Supabase data provider integration tests
- **Performance Tests:** Load testing scripts for high-volume scenarios

### 1.2 Unit Testing with Vitest

**Configuration Highlights:**
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,              // Use globals (describe, it, expect)
    environment: "jsdom",       // DOM simulation
    setupFiles: [
      "@testing-library/jest-dom",
      "./src/tests/setup.ts"
    ],
    timeout: 10000,            // 10s timeout (fast tests)
    coverage: {
      provider: "v8",          // V8 coverage (faster than Istanbul)
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/",
        "tests/",
        "dist/",
        "**/*.config.ts",
        "**/*.test.{ts,tsx}"
      ]
    }
  }
});
```

**Test Setup Infrastructure:**
```typescript
// src/tests/setup.ts - Global test environment
- Supabase client mocking (prevents "supabase.from is not a function" errors)
- React Query configuration (disable retries, 0ms stale time)
- DOM API polyfills:
  - window.matchMedia (responsive tests)
  - IntersectionObserver (virtualized lists)
  - ResizeObserver (size-aware components)
  - Pointer Capture API (Radix UI Select compatibility)
```

**Test Organization Pattern:**
```
src/atomic-crm/
├── validation/__tests__/        # Zod schema validation tests
│   ├── contacts/
│   │   ├── validation.test.ts   # Core validation rules
│   │   ├── integration.test.ts  # Cross-schema integration
│   │   └── edge-cases.test.ts   # Boundary conditions
│   ├── tasks/
│   ├── opportunities/
│   └── organizations/
├── providers/supabase/__tests__/
│   ├── dataProviderUtils.transform.test.ts
│   ├── dataProviderUtils.escape.test.ts
│   ├── services.integration.test.ts
│   └── cache.test.ts
└── [resource]/__tests__/
    ├── [Resource]List.test.tsx
    ├── [Resource]Create.test.tsx
    └── [Resource]Edit.test.tsx
```

**Example Test Pattern (Schema Validation):**
```typescript
// src/atomic-crm/validation/__tests__/contacts/validation.test.ts
describe("Contact Validation - UI as Source of Truth", () => {
  it("should accept valid contact data matching UI inputs", () => {
    const validContact = {
      first_name: "John",
      last_name: "Doe",
      email: [{ email: "john@example.com", type: "Work" }],
      phone: [{ number: "555-1234", type: "Work" }]
    };

    const result = contactSchema.parse(validContact);
    expect(result.first_name).toBe("John");
  });

  it("should compute name from first_name and last_name", () => {
    const contact = { first_name: "Jane", last_name: "Smith" };
    const result = contactSchema.parse(contact);
    expect(result.name).toBe("Jane Smith");
  });
});
```

### 1.3 E2E Testing with Playwright

**Configuration Strategy:**
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,              // Parallel execution
  forbidOnly: !!process.env.CI,     // Prevent .only in CI
  retries: process.env.CI ? 2 : 0,  // Retry flaky tests in CI
  workers: process.env.CI ? 1 : undefined,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',        // Full trace on first failure
    screenshot: 'only-on-failure',  // Diagnostic screenshots
    headless: !!process.env.CI      // Headed locally, headless CI
  }
});
```

**Multi-Device Testing:**
```typescript
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
    dependencies: ['setup']
  },
  {
    name: 'iPad Portrait',
    use: {
      ...devices['iPad Pro'],
      viewport: { width: 768, height: 1024 }
    }
  },
  {
    name: 'iPad Landscape',
    use: {
      ...devices['iPad Pro landscape'],
      viewport: { width: 1024, height: 768 }
    }
  }
]
```

**Page Object Model Architecture:**

Enforces `playwright-e2e-testing` skill requirements:
- **Semantic selectors only** (getByRole/Label/Text, never CSS selectors)
- **Console monitoring** for RLS/React/Network errors
- **Condition-based waiting** (no arbitrary timeouts)
- **Timestamp-based test data** for isolation

```typescript
// tests/e2e/support/poms/LoginPage.ts
export class LoginPage extends BasePage {
  async login(email: string, password: string): Promise<void> {
    await this.getTextInput(/email/i).fill(email);
    await this.getTextInput(/password/i).fill(password);
    await this.getButton(/sign in|login/i).click();

    // Condition-based waiting
    await this.waitForURL(/\/#\//, 15000);
  }
}
```

**Console Monitoring Utility:**
```typescript
// tests/e2e/support/utils/console-monitor.ts
export class ConsoleMonitor {
  async attach(page: Page): Promise<void> {
    page.on('console', (msg) => {
      if (msg.type() === 'error' || msg.type() === 'warning') {
        this.errors.push({ type: msg.type(), message: msg.text() });
      }
    });

    page.on('pageerror', (error) => {
      this.errors.push({ type: 'exception', message: error.message });
    });
  }

  hasRLSErrors(): boolean {
    return this.errors.some(e =>
      e.message.includes('permission denied') ||
      e.message.includes('RLS')
    );
  }
}
```

**E2E Test Example:**
```typescript
// tests/e2e/specs/opportunities/crud.spec.ts
test.describe('Opportunities CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await consoleMonitor.attach(page);
    const loginPage = new LoginPage(page);
    await loginPage.login('admin@test.com', 'password123');
  });

  test.afterEach(async () => {
    if (consoleMonitor.getErrors().length > 0) {
      console.log(consoleMonitor.getReport());
    }
  });

  test('should create opportunity with timestamp isolation', async ({ page }) => {
    const timestamp = Date.now();
    const oppName = `Test Opp ${timestamp}`;
    // ... test implementation
  });
});
```

### 1.4 Testing Commands

```bash
# Unit Tests
npm test                    # Watch mode (default)
npm run test:coverage       # Generate coverage report
npm run test:ui             # Vitest UI (http://localhost:51204)
npm run test:unit           # Run specific unit tests
npm run test:ci             # CI mode (verbose reporter)

# E2E Tests
npm run test:e2e            # Run all E2E tests
npm run test:e2e:ui         # Playwright UI mode
npm run test:e2e:headed     # Run with visible browser

# Smoke Tests
npm run test:smoke          # Fast sanity check (~30s)

# Performance Tests
npm run test:performance    # Vitest performance tests
npm run test:load           # Load testing with Node.js
```

---

## 2. Build Configuration

### 2.1 Vite Build Optimization

**Production Build Strategy:**
```typescript
// vite.config.ts
build: {
  sourcemap: mode === "development",  // 7.7MB savings in prod
  rollupOptions: {
    output: {
      manualChunks: {
        // Critical rendering path
        "vendor-react": ["react", "react-dom", "react-router-dom"],
        "vendor-ra-core": ["ra-core", "ra-i18n-polyglot"],

        // Data layer
        "vendor-supabase": ["@supabase/supabase-js", "ra-supabase-core"],

        // UI components (shared)
        "ui-radix": ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", ...],

        // Heavy async libraries
        "charts-nivo": ["@nivo/bar"],
        "forms": ["react-hook-form", "@hookform/resolvers", "zod"],
        "dnd": ["@hello-pangea/dnd"],

        // Utilities
        "utils": ["lodash", "date-fns", "clsx", "inflection"],
        "file-utils": ["papaparse", "jsonexport", "react-dropzone"],
        "icons": ["lucide-react"]
      },
      chunkFileNames: (chunkInfo) => {
        const facadeModuleId = chunkInfo.facadeModuleId
          ?.split("/").pop()?.replace(/\.(tsx?|jsx?)$/, "");
        return `js/${facadeModuleId}-[hash].js`;
      }
    }
  },
  chunkSizeWarningLimit: 300,  // Warn for 300KB+ chunks
  minify: "terser",
  terserOptions: {
    compress: {
      drop_console: true,      // Remove console.log in prod
      drop_debugger: true,
      pure_funcs: ["console.log", "console.info"]
    }
  }
}
```

**Dependency Pre-bundling:**
```typescript
optimizeDeps: {
  include: [
    // React Admin core (pre-bundle heavy dependencies)
    'ra-core', 'ra-i18n-polyglot', 'ra-language-english',

    // Supabase
    '@supabase/supabase-js', 'ra-supabase-core',

    // UI Libraries (38+ Radix UI components)
    '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', ...,

    // Heavy libraries
    '@nivo/bar', '@tanstack/react-query', '@hello-pangea/dnd',

    // Form libraries
    'react-hook-form', '@hookform/resolvers', 'zod'
  ]
}
```

**Dev Server Optimization:**
```typescript
server: {
  warmup: {
    clientFiles: [
      './src/main.tsx',
      './src/App.tsx',
      './src/atomic-crm/root/CRM.tsx',
      './src/atomic-crm/dashboard/Dashboard.tsx'
    ]
  },
  watch: {
    ignored: ['**/node_modules/**', '**/dist/**', '**/coverage/**']
  }
}
```

### 2.2 TypeScript Checking

**Separate Type Checking:**
```bash
npm run typecheck          # tsc --noEmit (fast, no build)
npm run build              # tsc --noEmit && vite build
```

**Strategy:** Vite uses `esbuild` for transpilation (10x faster), TypeScript for validation.

### 2.3 Bundle Analysis

```bash
# Development mode
ANALYZE=true npm run dev   # Opens stats.html automatically

# Production analysis
npm run build
# View dist/stats.html (visualizer plugin)
```

**Visualizer Configuration:**
```typescript
plugins: [
  ...(mode === "development" || process.env.ANALYZE === "true"
    ? [visualizer({
        open: process.env.NODE_ENV !== "CI",
        filename: "./dist/stats.html",
        gzipSize: true,
        brotliSize: true
      })]
    : [])
]
```

---

## 3. CI/CD Pipeline

### 3.1 Build Check Workflow

**File:** `.github/workflows/check.yml`

```yaml
name: ✅ Build Check

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, reopened, synchronize, ready_for_review]

concurrency:
  group: ${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true  # Cancel stale builds

jobs:
  build:
    name: 🔨 Build
    timeout-minutes: 10
    runs-on: ubuntu-latest
    if: ${{ !github.event.pull_request.draft || github.event_name == 'push' }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm install
      - run: npm run build  # tsc --noEmit && vite build
```

**Key Features:**
- **Skip draft PRs** (unless pushed to main)
- **Concurrency control** (cancel outdated builds)
- **Node 22** (latest LTS)
- **npm cache** (faster installs)

### 3.2 Supabase Deploy Workflow

**File:** `.github/workflows/supabase-deploy.yml`

**Three-Stage Safety Pipeline:**

#### Stage 1: Validation
```yaml
validate:
  steps:
    - name: 🚀 Start local Supabase
      run: npx supabase start

    - name: 🔍 Run validation framework
      run: npm run validate:pre-migration

    - name: ✅ Validation summary
      run: |
        echo "### ✅ Migration Validation Passed"
        echo "- ✅ Schema validation successful"
        echo "- ✅ Migration scripts validated"
```

#### Stage 2: Dry Run
```yaml
dry-run:
  needs: validate
  steps:
    - name: 🔗 Link to production
      env:
        SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
      run: npx supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_ID }}

    - name: 🧪 Run migration dry-run
      run: npx supabase db push --dry-run 2>&1 | tee dry-run-output.log

    - name: 📤 Upload dry-run output
      uses: actions/upload-artifact@v4
      with:
        name: dry-run-output-${{ github.run_id }}
        retention-days: 7
```

#### Stage 3: Deploy (Manual Only)
```yaml
deploy:
  needs: dry-run
  if: github.event_name == 'workflow_dispatch'  # MANUAL TRIGGER ONLY
  environment: production  # Requires approval
  steps:
    - name: 💾 Create backup
      run: npm run migrate:backup -- cloud

    - name: 📡 Deploy migrations
      run: npx supabase db push 2>&1 | tee migration-deploy.log

    - name: 🚀 Deploy edge functions
      run: npx supabase functions deploy

    - name: ✅ Post-deployment validation
      run: node scripts/post-migration-validation.js

    - name: 📊 Deployment summary
      run: |
        echo "### 🎉 Production Deployment Successful"
        echo "**Backup**: \`${{ steps.backup.outputs.backup_timestamp }}\`"
```

**Critical Safeguards:**
- **Never auto-deploy** (workflow_dispatch only)
- **Always create backup** before deployment
- **Upload artifacts** for post-mortem analysis
- **Post-deployment validation** catches issues immediately
- **Concurrency: cancel-in-progress: false** (never cancel DB operations)

### 3.3 Disabled Workflows

**Chromatic (Visual Regression):**
- `.github/workflows/chromatic.yml.disabled`
- **Reason:** Pre-launch phase, not yet needed
- **Future:** Enable when UI stabilizes

---

## 4. Development Workflow

### 4.1 Environment Management

**Environment Files:**
```
.env.example        # Template with documentation
.env.local          # Local Supabase (127.0.0.1:54321)
.env.cloud          # Cloud Supabase (production)
.env                # Active configuration (gitignored)
```

**Example Configuration:**
```bash
# .env.local
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key>
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**Quick Switching:**
```bash
# Switch to local
cp .env.local .env && npm run dev

# Switch to cloud
cp .env.cloud .env && npm run dev
```

### 4.2 Database Development Workflow

**Quick Start (Combined):**
```bash
npm run dev:local           # cp .env.local + db reset + seed + vite
npm run dev:local:skip-reset # cp .env.local + vite (skip reset)
```

**Manual Workflow:**
```bash
# 1. Start local Supabase
npm run db:local:start      # Docker containers + migrations

# 2. Reset database (when needed)
npm run db:local:reset      # Drop data + re-run migrations + seed

# 3. Check status
npm run db:local:status     # Show API/Studio/DB URLs

# 4. Start UI
npm run dev                 # Vite dev server
```

**Database URLs:**
- **API:** http://127.0.0.1:54321
- **Studio:** http://127.0.0.1:54323 (visual DB browser)
- **PostgreSQL:** postgresql://postgres:postgres@127.0.0.1:54322/postgres

### 4.3 Migration Workflow

**Create Migration:**
```bash
npx supabase migration new add_tasks_table
# Creates: supabase/migrations/YYYYMMDDHHMMSS_add_tasks_table.sql
```

**Two-Layer Security Pattern (Critical):**
```sql
-- 1. Create table
CREATE TABLE tasks (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title TEXT NOT NULL
);

-- 2. Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 3. GRANT permissions (PostgreSQL layer)
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT USAGE ON SEQUENCE tasks_id_seq TO authenticated;

-- 4. RLS policies (Row-level filtering)
CREATE POLICY select_tasks ON tasks
  FOR SELECT TO authenticated
  USING (sales_id IN (SELECT id FROM sales WHERE user_id = auth.uid()));
```

**Common Mistake:** RLS without GRANT = "permission denied"

**Test Locally:**
```bash
npm run db:local:reset      # Apply migration + seed
npm run dev                 # Test in UI
```

**Deploy to Cloud:**
```bash
npm run db:cloud:push       # Runs scripts/db/safe-cloud-push.sh
```

### 4.4 Safe Cloud Push Script

**File:** `scripts/db/safe-cloud-push.sh`

**Safety Checklist:**
1. ✅ Verify project link
2. ✅ Show pending migrations
3. ✅ Display schema diff (highlight DROP/REVOKE)
4. ✅ Require explicit confirmation: "APPLY MIGRATIONS"
5. ✅ Apply migrations (NO reset, NO data deletion)

```bash
#!/bin/bash
set -e

echo "🔒 PRODUCTION DATABASE MIGRATION - SAFETY CHECKS"

# Check project link
if ! npx supabase projects list | grep -q "●"; then
    echo "❌ Error: No linked Supabase project"
    exit 1
fi

# Show pending migrations
npx supabase migration list --linked

# Show schema diff
echo "⚠️  If you see DROP or REVOKE, review carefully!"
npx supabase db diff --linked --schema public

# Require confirmation
read -p "Type 'APPLY MIGRATIONS' to continue: " confirmation
if [ "$confirmation" != "APPLY MIGRATIONS" ]; then
    exit 1
fi

# Apply migrations (safe - no reset)
npx supabase db push

echo "✅ Migration complete!"
```

### 4.5 Environment Reset Script

**File:** `scripts/dev/reset-environment.sh`

**Workflow:**
1. Reset local database (drop + migrate + seed)
2. Reset cloud database (TRUNCATE tables, preserve schema)
3. Create fresh test users
4. Sync local → cloud

**Critical Warning:**
```bash
echo "⚠️  ENVIRONMENT RESET"
echo "   This will DELETE all data in both local and cloud databases."
read -p "Type 'RESET' to confirm: " CONFIRM
```

**Cloud Truncation (Safe):**
```sql
BEGIN;

-- Truncate only tables that exist
DO $$
DECLARE
  tbl_name text;
BEGIN
  FOR tbl_name IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('activities', 'contacts', 'opportunities', ...)
  LOOP
    EXECUTE format('TRUNCATE TABLE public.%I CASCADE', tbl_name);
  END LOOP;
END $$;

-- Delete test users
DELETE FROM auth.users WHERE email LIKE '%@test.local';

COMMIT;
```

---

## 5. Scripts & Commands

### 5.1 npm Scripts Breakdown

#### Development
```bash
npm run dev                 # Vite dev server
npm run dev:local           # Reset DB + seed + dev
npm run dev:local:skip-reset # Dev without DB reset
npm run dev:cloud           # Use cloud DB
npm run dev:check           # Check Supabase status
```

#### Testing
```bash
npm test                    # Vitest watch mode
npm run test:coverage       # Coverage report (70% min)
npm run test:ui             # Vitest UI
npm run test:unit           # Run specific unit tests
npm run test:ci             # CI mode (verbose)
npm run test:e2e            # Playwright E2E
npm run test:e2e:ui         # Playwright UI mode
npm run test:smoke          # Fast smoke test (~30s)
npm run test:performance    # Performance tests
npm run test:load           # Load testing
```

#### Build & Deploy
```bash
npm run build               # tsc + vite build
npm run preview             # Preview production build
npm run prod:start          # Build + deploy + serve
npm run prod:deploy         # Build + deploy + GitHub Pages
```

#### Code Quality
```bash
npm run lint                # ESLint + Prettier (check)
npm run lint:check          # ESLint only
npm run lint:apply          # ESLint fix
npm run prettier:check      # Prettier check
npm run prettier:apply      # Prettier fix
npm run typecheck           # TypeScript validation
npm run validate:colors     # WCAG contrast validation
```

#### Database
```bash
npm run db:local:start      # Start local Supabase
npm run db:local:stop       # Stop local Supabase
npm run db:local:reset      # Reset + seed
npm run db:local:status     # Show URLs
npm run db:cloud:push       # Deploy migrations (safe)
npm run db:cloud:diff       # Show schema diff
npm run db:cloud:status     # Show migration status
npm run db:migrate:new      # Create migration file
```

#### Utilities
```bash
npm run gen:types           # Generate MCP types
npm run gen:types:force     # Force regenerate
npm run generate:seed       # Generate seed.sql
npm run cache:clear         # Clear React Query cache
npm run search:reindex      # Rebuild search indexes
npm run validate:pre-migration # Pre-migration checks
```

#### Storybook
```bash
npm run storybook           # Start Storybook
npm run build-storybook     # Build static Storybook
npm run chromatic           # Visual regression (disabled)
```

### 5.2 Database Utility Scripts

**Migration Safety:**
```bash
./scripts/migration/deploy-safe.sh      # Safe cloud deployment
./scripts/migration/backup.sh           # Create DB backup
```

**Development:**
```bash
./scripts/dev/reset-environment.sh      # Reset local + cloud
./scripts/dev/sync-local-to-cloud.sh    # Push local data to cloud
./scripts/dev/create-test-users.sh      # Create test accounts
./scripts/dev/verify-environment.sh     # Verify setup
```

**Validation:**
```bash
./scripts/validation/run-pre-validation.js    # Pre-migration checks
./scripts/post-migration-validation.js        # Post-deployment validation
```

### 5.3 Test Data Management

**Seed File (Single Source of Truth):**
```sql
-- supabase/seed.sql
INSERT INTO auth.users (email, encrypted_password)
VALUES ('admin@test.com', crypt('password123', gen_salt('bf')));

INSERT INTO organizations (name, industry)
VALUES
  ('Acme Corp', 'Technology'),
  ('Global Industries', 'Manufacturing'),
  ... (16 total organizations)
```

**Critical Warning:**
```
⚠️ NEVER run: npx supabase db reset --linked
   This DELETES ALL PRODUCTION DATA

✅ Always use: npm run db:cloud:push (migrations only)
```

---

## 6. Quality Assurance Tools

### 6.1 Husky Git Hooks

**Pre-commit Hook:**
```bash
# .husky/pre-commit
npm test                    # Run tests before commit
```

**Workflow:**
1. Developer runs `git commit`
2. Husky triggers `npm test`
3. If tests fail → commit blocked
4. If tests pass → commit proceeds

### 6.2 Code Quality Validation

**ESLint Configuration:**
```bash
npm run lint:check          # Check for issues
npm run lint:apply          # Auto-fix

# Rules enforced:
- React Hooks rules
- JSX accessibility (a11y)
- Tailwind CSS best practices
- TypeScript strict mode
```

**Prettier Configuration:**
```bash
npm run prettier:check      # Verify formatting
npm run prettier:apply      # Auto-format

# Formats: .js, .json, .ts, .tsx, .css, .md, .html
```

**TypeScript Validation:**
```bash
npm run typecheck           # tsc --noEmit (no build)

# Catches:
- Type errors
- Missing imports
- Invalid prop types
```

### 6.3 Color Contrast Validation

**Script:** `scripts/validate-colors.js`

**Purpose:** Ensure WCAG AA compliance for all tag colors and semantic colors.

```bash
npm run validate:colors

# Validates:
- Light mode contrast ratios
- Dark mode contrast ratios
- Tag colors (16 predefined)
- Semantic colors (primary, destructive, etc.)

# Output:
✅ All colors pass WCAG AA (4.5:1 minimum)
❌ Failed: [color] has 3.2:1 (needs 4.5:1)
```

**OKLCH to sRGB Conversion:**
```javascript
function oklchToLinearSrgb(l, c, h) {
  // Convert to OKLab → LMS → linear sRGB
  // Supports Tailwind v4 OKLCH colors
}

function getContrastRatio(color1, color2) {
  // Calculate WCAG contrast ratio
  // Must be ≥ 4.5:1 for AA compliance
}
```

### 6.4 Smoke Testing

**Script:** `tests/simple-smoke-test.sh`

**Fast Sanity Check (~30 seconds):**
```bash
npm run test:smoke

# Tests:
1. ✓ Dev server running (curl localhost:5173)
2. ✓ App HTML loads with 'root' element
3. ✓ Vite client available (@vite/client)
4. ✓ Supabase API reachable
5. ✓ Production build succeeds (optional)

# Output:
✅ All smoke tests passed!
```

**Use Cases:**
- **Pre-commit:** Quick verification before pushing
- **CI warm-up:** Fast check before full test suite
- **Debugging:** Isolate infrastructure vs. code issues

---

## 7. Performance Optimization

### 7.1 Build Performance

**Vite Optimization:**
- **esbuild transpilation:** 10-100x faster than tsc
- **Hot Module Replacement (HMR):** Sub-100ms updates
- **Dependency pre-bundling:** 62 packages optimized
- **Code splitting:** 12 manual chunks (vendor-react, vendor-supabase, etc.)

**Bundle Size Reduction:**
- **7.7MB savings:** Disable source maps in production
- **Terser minification:** Drop console.log, debugger
- **Tree shaking:** Remove unused code
- **Brotli compression:** 80%+ size reduction

### 7.2 Test Performance

**Vitest Parallelization:**
```typescript
// Runs tests in parallel (default)
test.concurrent('fast test 1', async () => { ... });
test.concurrent('fast test 2', async () => { ... });
```

**Playwright Parallelization:**
```typescript
// playwright.config.ts
fullyParallel: true,
workers: process.env.CI ? 1 : undefined  // Max workers locally
```

**Fast Feedback Loops:**
- **Unit tests:** <1s per test file (jsdom + mocked Supabase)
- **E2E tests:** ~10s per test (condition-based waiting)
- **Smoke test:** ~30s total (infrastructure validation)

### 7.3 Load Testing

**Script:** `scripts/load-test.js`

```bash
npm run test:load

# Simulates:
- 100+ concurrent users
- CRUD operations on opportunities
- Search queries
- Filter combinations

# Metrics:
- Response time (p50, p95, p99)
- Throughput (requests/second)
- Error rate
```

---

## 8. Production Deployment

### 8.1 Deployment Commands

**Full Production Deployment:**
```bash
npm run prod:deploy
# 1. npm run build (TypeScript check + Vite build)
# 2. npm run supabase:deploy (migrations + edge functions)
# 3. npm run ghpages:deploy (GitHub Pages)
```

**Serve Locally:**
```bash
npm run prod:start
# 1. Build production bundle
# 2. Deploy Supabase
# 3. Serve on http://127.0.0.1:3000
```

### 8.2 GitHub Pages Deployment

**Script:** `scripts/ghpages-deploy.mjs`

**Workflow:**
1. Build production bundle (`npm run build`)
2. Push `dist/` to `gh-pages` branch
3. GitHub serves static files
4. **Base URL:** Root domain (was subdirectory, changed for Vercel)

**Configuration:**
```typescript
// vite.config.ts
base: "/"  // Root domain (Vercel)
           // Was "./" for GitHub Pages subdirectory
```

### 8.3 Production Safety Checklist

**Pre-deployment:**
- [ ] Run `npm run test:coverage` (70%+ coverage)
- [ ] Run `npm run typecheck` (no TypeScript errors)
- [ ] Run `npm run lint` (no ESLint errors)
- [ ] Run `npm run validate:colors` (WCAG compliance)
- [ ] Run `npm run test:e2e` (E2E tests pass)
- [ ] Run `npm run db:cloud:diff` (review schema changes)

**During deployment:**
- [ ] Create database backup
- [ ] Run migration dry-run
- [ ] Apply migrations (manual approval)
- [ ] Deploy edge functions
- [ ] Run post-deployment validation

**Post-deployment:**
- [ ] Verify dashboard loads
- [ ] Test critical user flows
- [ ] Check browser console (no errors)
- [ ] Monitor Supabase logs

---

## 9. Key Architectural Decisions

### 9.1 Testing Decisions

**Why Vitest over Jest?**
- **Speed:** 10x faster startup (ESM native)
- **Vite integration:** Share config with dev/build
- **TypeScript:** Zero-config TypeScript support
- **Coverage:** V8 provider (faster than Istanbul)

**Why Playwright over Cypress?**
- **Multi-browser:** Chromium, Firefox, WebKit
- **Multi-device:** iPad Pro, desktop
- **Parallel execution:** Faster CI runs
- **Trace viewer:** Rich debugging (screenshots, network, DOM)

**Why 70% coverage minimum?**
- **Balance:** Catches most bugs without test burden
- **Pre-launch focus:** Velocity over perfection
- **Critical paths:** 100% for validation schemas, 50%+ for UI

### 9.2 Build Decisions

**Why Vite over Create React App?**
- **Speed:** 100x faster HMR (ESBuild vs. Webpack)
- **Modern:** ESM native, no polyfills
- **Bundle size:** Better tree shaking
- **TypeScript:** First-class support

**Why manual code splitting?**
- **Control:** Optimize loading priority
- **Cache efficiency:** Vendor chunks rarely change
- **Performance:** Load critical path first
- **Bundle analysis:** Clear chunk ownership

### 9.3 DevOps Decisions

**Why local Supabase?**
- **Speed:** No network latency
- **Offline:** Work without internet
- **Safety:** No risk to production
- **Cost:** Zero cloud usage during development

**Why manual cloud deployments?**
- **Safety:** Prevent accidental data loss
- **Review:** Human verification of migrations
- **Backup:** Always create backup first
- **Rollback:** Easy to revert if needed

**Why multi-stage CI/CD?**
- **Validation:** Catch issues before production
- **Dry-run:** Preview changes without applying
- **Approval:** Require human decision
- **Traceability:** Artifact uploads for debugging

---

## 10. Future Improvements

### 10.1 Testing Enhancements

**Short-term (Phase 2):**
- [ ] Visual regression testing (re-enable Chromatic)
- [ ] Accessibility testing (Playwright + axe-core)
- [ ] Contract testing (Supabase schema validation)
- [ ] Mutation testing (Stryker.js)

**Long-term (Post-launch):**
- [ ] Load testing in CI (k6 integration)
- [ ] Synthetic monitoring (Checkly/Datadog)
- [ ] Error tracking (Sentry integration)
- [ ] Analytics (PostHog/Mixpanel)

### 10.2 Build Optimizations

**Planned:**
- [ ] Module federation (share chunks across apps)
- [ ] Image optimization (Sharp/Squoosh)
- [ ] Font subsetting (reduce font sizes)
- [ ] Critical CSS extraction (inline above-fold styles)

### 10.3 CI/CD Enhancements

**Roadmap:**
- [ ] Automated security scanning (Snyk/Dependabot)
- [ ] Performance budgets (Lighthouse CI)
- [ ] Automated rollbacks (detect errors → revert)
- [ ] Blue-green deployments (zero downtime)

---

## Appendix A: Test File Locations

### Unit Tests (67 files)
```
src/atomic-crm/
├── validation/__tests__/
│   ├── contacts/         # 3 tests
│   ├── tasks/            # 4 tests
│   ├── opportunities/    # 2 tests
│   ├── organizations/    # 3 tests
│   ├── tags/             # 3 tests
│   ├── notes/            # 4 tests
│   ├── quickAdd/         # 1 test
│   └── rpc.test.ts
├── providers/supabase/__tests__/
│   ├── dataProviderUtils.transform.test.ts
│   ├── dataProviderUtils.escape.test.ts
│   ├── services.integration.test.ts
│   └── cache.test.ts
├── opportunities/__tests__/
│   ├── OpportunityList.test.tsx
│   ├── OpportunityCreate.unit.test.tsx
│   ├── OpportunityEdit.unit.test.tsx
│   ├── QuickAdd*.test.tsx (5 files)
│   └── ... (13 files total)
├── contacts/__tests__/
│   ├── ContactList.test.tsx
│   └── ContactCreate.test.tsx
├── organizations/
│   ├── OrganizationInputs.test.tsx
│   └── OrganizationImportDialog.test.tsx
└── ... (additional test files)
```

### E2E Tests (13 files)
```
tests/e2e/
├── specs/
│   ├── contacts/
│   │   └── contacts-crud.spec.ts
│   ├── opportunities/
│   │   ├── crud.spec.ts
│   │   ├── kanban-board.spec.ts
│   │   ├── stage-transitions.spec.ts
│   │   └── activity-timeline.spec.ts
│   ├── layout/
│   │   └── opportunities-form-layout.spec.ts
│   └── diagnostics/
│       ├── app-loading.spec.ts
│       └── env-vars.spec.ts
├── dashboard-layout.spec.ts
├── dashboard-widgets.spec.ts
└── design-system-coverage.spec.ts
```

---

## Appendix B: Critical Commands Reference

### Daily Development
```bash
# Start development
cp .env.local .env && npm run db:local:start && npm run dev

# Reset when database is stale
npm run db:local:reset && npm run dev

# Run tests while developing
npm test  # Watch mode (auto-rerun on changes)
```

### Before Committing
```bash
npm run lint:apply          # Fix code style
npm run typecheck           # Verify TypeScript
npm test                    # Run unit tests (Husky does this)
npm run test:e2e            # Run E2E tests (optional)
```

### Before Deploying
```bash
npm run test:coverage       # Verify 70%+ coverage
npm run build               # Ensure production build works
npm run db:cloud:diff       # Review database changes
npm run db:cloud:push       # Apply migrations (SAFE)
```

### Emergency Rollback
```bash
# If deployment fails:
1. Check logs in GitHub Actions artifacts
2. Review Supabase dashboard (https://supabase.com/dashboard)
3. If needed: restore from backup (created automatically)
4. Revert migration: git revert <commit> && npm run db:cloud:push
```

---

**End of Analysis - Section 5: Testing & DevOps**

**Word Count:** ~2,450 words
**Last Updated:** 2025-11-07
