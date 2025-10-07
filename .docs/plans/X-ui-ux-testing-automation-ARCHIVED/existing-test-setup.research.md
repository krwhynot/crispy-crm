# Existing Test Setup Research

Research findings on the current testing infrastructure, configuration, and patterns in the Atomic CRM project.

## 🆕 Critical Gaps Summary (Expert Analysis)

**IMPORTANT**: This research document has been reviewed against Zen (Gemini 2.5 Pro) expert analysis. The following critical gaps were identified and must be addressed in the implementation:

1. **Missing Authorization Testing** ⚠️: No tests for RBAC (`is_admin` role differentiation)
2. **Missing API Error States** ⚠️: Zero tests for 500 errors, RLS violations, network failures
3. **Fragile Cleanup Strategy** 🔧: Current patterns need `safeCleanup()` helper
4. **No Test Selector Strategy** 📋: Need mandatory hierarchy (getByRole > data-testid > avoid CSS/text)
5. **No Accessibility Workflow** ♿: No formal a11y testing with @axe-core
6. **No Flaky Test Policy** 🎯: Need quarantine process for unreliable tests
7. **Broken CI Pipeline** 🚨: `make test-ci` references non-existent Makefile

**Updated Requirements**: See `requirements.md` for complete details on addressing these gaps.

---

## Overview

The project has a **basic Vitest setup** with minimal configuration. Testing infrastructure exists but is **underdeveloped** for UI/UX testing:
- Vitest 3.2.4 configured with jsdom environment
- Testing Library packages installed but minimal usage
- Performance and integration tests exist, but no comprehensive UI component tests
- CI/CD workflow references non-existent Makefile for test execution
- No dedicated UI testing or visual regression testing tools

---

## Configuration Files

### Vitest Configuration
**File**: `/home/krwhynot/Projects/atomic/vitest.config.ts`
```typescript
// Minimal setup - needs expansion for UI testing
{
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}
```

**Current State**:
- ✅ jsdom environment configured for DOM testing
- ✅ @testing-library/jest-dom auto-imported
- ✅ Path alias configured (@/ → ./src/)
- ✅ Globals enabled (describe, it, expect available globally)
- ❌ No coverage configuration
- ❌ No UI-specific test patterns defined
- ❌ No browser mode configured
- ❌ No visual regression setup
- ❌ No watch mode exclusions

### TypeScript Configuration
**File**: `/home/krwhynot/Projects/atomic/tsconfig.app.json`
```typescript
{
  compilerOptions: {
    types: ["vitest/globals", "faker"],
    baseUrl: ".",
    paths: { "@/*": ["./src/*"] }
  }
}
```

**Current State**:
- ✅ Vitest globals types included
- ✅ Faker types for test data generation
- ✅ Path alias matching vitest.config
- ❌ No @testing-library types explicitly included

### Vite Configuration
**File**: `/home/krwhynot/Projects/atomic/vite.config.ts`
- ✅ React plugin configured
- ✅ Tailwind CSS 4 plugin included
- ✅ Path resolution matches test config
- ✅ Optimized dependency pre-bundling for React Admin, Radix UI, etc.
- **Relevant for testing**: All UI dependencies pre-bundled, reducing test startup time

---

## Installed Testing Dependencies

### Core Testing Framework
**From** `/home/krwhynot/Projects/atomic/package.json`:

```json
"devDependencies": {
  "@testing-library/jest-dom": "^6.6.3",      // ✅ DOM matchers
  "@testing-library/react": "^16.3.0",        // ✅ React testing utilities
  "@testing-library/user-event": "^14.6.1",   // ✅ User interaction simulation
  "@faker-js/faker": "^9.9.0",                // ✅ Test data generation
  "vitest": "^3.2.4",                         // ✅ Test runner
  "jsdom": "^27.0.0"                          // ✅ DOM environment
}
```

**Missing Dependencies** (needed for UI/UX automation):
- ❌ @vitest/ui - Vitest UI dashboard
- ❌ @vitest/browser - Browser mode for real browser testing
- ❌ @axe-core/react or vitest-axe - Accessibility testing
- ❌ playwright or @playwright/test - E2E browser automation
- ❌ @storybook/test-runner - Component visual testing (if using Storybook)
- ❌ happy-dom - Alternative DOM implementation (faster than jsdom)
- ❌ msw (Mock Service Worker) - API mocking

---

## npm Scripts

### Current Test Scripts
**From** `/home/krwhynot/Projects/atomic/package.json`:

```json
{
  "test": "vitest",                            // ✅ Watch mode by default
  "test:performance": "vitest run tests/performance/",  // ✅ Performance tests
  "test:load": "node ./scripts/load-test.js"   // ✅ Load testing script
}
```

**Missing Scripts** (needed for comprehensive testing):
- ❌ `test:ci` - CI-specific test run (no watch, coverage, strict)
- ❌ `test:unit` - Unit tests only
- ❌ `test:integration` - Integration tests only
- ❌ `test:e2e` - End-to-end tests
- ❌ `test:ui` - Launch Vitest UI dashboard
- ❌ `test:coverage` - Generate coverage reports
- ❌ `test:watch` - Explicit watch mode
- ❌ `test:debug` - Debug mode configuration
- ❌ `test:a11y` - Accessibility testing suite

---

## Existing Test Files

### Test Directory Structure
```
/home/krwhynot/Projects/atomic/
├── tests/                          # Top-level test directory
│   ├── audit/                      # Audit tests (2 files)
│   │   ├── trail-continuity.spec.ts
│   │   └── data-integrity.spec.ts
│   ├── fixtures/                   # Test fixtures (empty)
│   ├── migration/                  # Migration tests (4 files)
│   │   ├── resume.spec.ts
│   │   ├── dry-run.spec.ts
│   │   ├── rollback.spec.ts
│   │   └── data-integrity.spec.ts
│   ├── performance/                # Performance tests (2 files)
│   │   ├── opportunity-queries.spec.ts
│   │   └── junction-table-performance.spec.ts
│   ├── uat/                        # UAT tests (1 file)
│   │   └── opportunity-workflows.spec.ts
│   └── verification/               # Verification tests (1 file)
│       └── final-sweep.spec.ts
│
├── src/atomic-crm/tests/           # Feature-specific tests (6 files)
│   ├── dataProviderErrors.test.ts
│   ├── dataProviderSchemaValidation.test.ts
│   ├── httpErrorPatterns.test.ts
│   ├── rlsPermissionDebug.test.ts
│   ├── rlsSimple.test.ts
│   └── unifiedDataProvider.test.ts
│
├── src/tests/                      # Integration/E2E tests
│   ├── integration/
│   │   └── auth-flow.test.ts
│   ├── e2e/
│   │   ├── user-journey.test.ts
│   │   └── opportunity-lifecycle.test.ts
│   └── setup-mcp.ts                # MCP test setup file
│
└── src/setupTests.js               # Global test setup
```

**Total**: ~20 test files, **NONE are UI component tests**

### Test File Patterns

**1. Performance Tests** (`tests/performance/opportunity-queries.spec.ts`):
```typescript
// Pattern: Database query performance benchmarking
describe("Opportunity Queries Performance Tests", () => {
  // Uses Supabase client directly
  // Measures execution time with performance.now()
  // Compares against baseline thresholds
  // Creates 10,000+ test opportunities
  // Tests: simple list, filtered list, complex joins, aggregation, search, pagination
});
```

**2. Data Provider Tests** (`src/atomic-crm/tests/unifiedDataProvider.test.ts`):
```typescript
// Pattern: API integration testing
describe('Unified Data Provider - Real Schema Tests', () => {
  // Tests actual Supabase queries
  // Validates error handling
  // Checks field existence in views
  // No UI rendering - pure data layer
});
```

**3. Test Setup** (`src/tests/setup-mcp.ts`):
```typescript
// Pattern: Cloud database test configuration
// - Connection retry logic with exponential backoff
// - Test data namespacing (test_env_timestamp_random)
// - Emergency cleanup for orphaned data
// - Service role RLS bypass
// - Exports: supabaseClient, serviceClient, withRetry, checkConnection
```

**4. Global Setup** (`src/setupTests.js`):
```typescript
// Minimal setup - just imports @testing-library/jest-dom
import "@testing-library/jest-dom";
```

---

## CI/CD Configuration

### GitHub Actions Workflow
**File**: `/home/krwhynot/Projects/atomic/.github/workflows/check.yml`

```yaml
jobs:
  lint:
    name: 🔬 ESLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm install
      - uses: wearerequired/lint-action@v2  # Auto-fixes PRs
        with:
          eslint: true
          prettier: true

  test:
    name: 🔎 Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm install
      - run: make test-ci  # ❌ BROKEN: Makefile doesn't exist!

  build:
    name: 🔨 Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm install
      - run: npm run build
```

**Issues**:
1. ❌ **CRITICAL**: `make test-ci` references non-existent Makefile
2. ❌ No coverage upload (Codecov, Coveralls)
3. ❌ No test artifact retention
4. ❌ No matrix testing (multiple Node versions)
5. ❌ No cache optimization for Vitest
6. ❌ No environment variable injection for tests
7. ❌ No database setup for integration tests

**Needs**:
- Replace `make test-ci` with `npm run test:ci`
- Add coverage reporting
- Add test result artifact upload
- Consider Playwright for E2E in CI

---

## Existing Test Patterns to Follow

### 1. Test File Naming
**Current**: `.test.ts` and `.spec.ts` both used (INCONSISTENT)
- `/src/atomic-crm/tests/`: `.test.ts`
- `/tests/`: `.spec.ts`

**Recommendation**: Standardize on `.test.ts` for unit/integration, `.spec.ts` for E2E

### 2. Test Structure
```typescript
describe('Feature Name', () => {
  let supabase: SupabaseClient;

  beforeAll(() => {
    // Setup resources
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup test data
  });

  describe('Sub-feature', () => {
    it('should do something specific', async () => {
      // Arrange
      const input = {...};

      // Act
      const { data, error } = await action(input);

      // Assert
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });
});
```

### 3. Test Data Generation
```typescript
import { faker } from "@faker-js/faker";

// Pattern: Generate realistic test data
const testOpportunity = {
  name: `Test Opportunity ${faker.company.catchPhrase()}`,
  amount: faker.number.float({ min: 1000, max: 1000000 }),
  description: faker.lorem.paragraph(),
  expected_closing_date: faker.date.future().toISOString(),
};
```

### 4. Performance Benchmarking
```typescript
// Pattern: Measure and compare against thresholds
const THRESHOLDS = {
  simpleList: 100, // ms
  complexJoin: 300,
};

it('should execute within threshold', async () => {
  const startTime = performance.now();

  await query();

  const executionTime = performance.now() - startTime;
  expect(executionTime).toBeLessThan(THRESHOLDS.simpleList);
});
```

---

## Existing Test Patterns to AVOID

### 1. ❌ No Component Rendering Tests
**Current**: All tests are data/API layer only
```typescript
// MISSING: Component testing like this
render(<OpportunityList />);
expect(screen.getByText('Opportunities')).toBeInTheDocument();
```

### 2. ❌ Hardcoded Test Data Cleanup
```typescript
// AVOID: Manual cleanup everywhere
afterAll(async () => {
  await supabase.from('opportunities').delete().in('id', testIds);
  await supabase.from('companies').delete().ilike('name', 'Test%');
});

// PREFER: Centralized cleanup utilities (see setup-mcp.ts)
```

### 3. ❌ Direct Supabase Client in Tests
```typescript
// CURRENT: Tests bypass data provider
const { data } = await supabase.from('opportunities').select('*');

// SHOULD: Test through React Admin data provider
const { data } = await dataProvider.getList('opportunities', {...});
```

### 4. ❌ No Accessibility Testing
**Current**: Zero accessibility tests
**Need**: Add axe-core checks to component tests

---

## Build Configuration Affecting Tests

### ESLint Configuration
**File**: `/home/krwhynot/Projects/atomic/eslint.config.js`
- ✅ TypeScript ESLint configured
- ✅ React hooks plugin
- ✅ JSX A11y plugin (accessibility linting)
- ✅ Semantic color enforcement

**Test-Related**:
- Should extend to test files
- May need special rules for test patterns (e.g., allow any types in mocks)

### Prettier Configuration
**File**: `/home/krwhynot/Projects/atomic/.prettierrc.mjs`
- ✅ Empty config (uses defaults)
- Applied to: `.{js,json,ts,tsx,css,md,html}`

---

## What's Already in Place

### ✅ Strengths
1. **Modern Test Runner**: Vitest 3.2.4 (latest)
2. **Testing Library**: React Testing Library 16.3.0 installed
3. **DOM Environment**: jsdom 27.0.0 configured
4. **Test Data**: Faker.js for realistic data generation
5. **Path Aliases**: Consistent @/ aliasing across configs
6. **Performance Tests**: Established patterns for benchmarking
7. **Database Tests**: Supabase integration test patterns
8. **MCP Setup**: Cloud database test utilities (setup-mcp.ts)

### ❌ Gaps
1. **No UI Component Tests**: Zero tests for React components
2. **No Visual Regression**: No screenshot/visual diff testing
3. **No E2E Framework**: No Playwright/Cypress
4. **No Coverage**: No coverage reporting configured
5. **Broken CI**: Makefile reference doesn't exist
6. **No Accessibility Tests**: No automated a11y checks
7. **No Test Organization**: Mixed .test/.spec naming
8. **No Browser Mode**: Only jsdom, not real browsers
9. **Missing Scripts**: No test:ci, test:coverage, test:ui
10. **No Mocking**: No MSW for API mocking

---

## What Needs to be Added

### 1. Test Scripts (`package.json`)
```json
{
  "test:ci": "vitest run --coverage --reporter=verbose",
  "test:unit": "vitest run src/**/*.test.{ts,tsx}",
  "test:integration": "vitest run src/tests/integration/**/*.test.{ts,tsx}",
  "test:e2e": "playwright test",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest run --coverage",
  "test:watch": "vitest",
  "test:a11y": "vitest run --grep a11y"
}
```

### 2. Vitest Configuration Updates (`vitest.config.ts`)
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom", "./src/tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: ["node_modules/", "src/tests/", "**/*.test.{ts,tsx}"],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.spec.{ts,tsx}"],
    exclude: ["node_modules/", "dist/", ".docs/"],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
```

### 3. CI/CD Fixes (`.github/workflows/check.yml`)
```yaml
# Replace:
- run: make test-ci

# With:
- run: npm run test:ci
- name: Upload coverage
  uses: codecov/codecov-action@v4
  if: always()
  with:
    token: ${{ secrets.CODECOV_TOKEN }}
```

### 4. Missing Dependencies
```bash
npm install -D @vitest/ui @vitest/coverage-v8 @axe-core/react playwright @playwright/test
```

### 5. Test Organization Standards
- **Unit Tests**: `src/**/*.test.ts` - Component/utility tests
- **Integration**: `src/tests/integration/**/*.test.ts` - Multi-component flows
- **E2E**: `tests/**/*.spec.ts` - Full user workflows
- **Performance**: `tests/performance/**/*.spec.ts` - Benchmarks

---

## Recommended Next Steps

1. **Fix Broken CI** (URGENT):
   - Create `test:ci` npm script
   - Update `.github/workflows/check.yml` to use `npm run test:ci`

2. **Add Coverage Reporting**:
   - Configure `@vitest/coverage-v8`
   - Set baseline thresholds (70%)
   - Integrate with Codecov/Coveralls

3. **Create UI Test Infrastructure**:
   - Add component test examples
   - Set up Playwright for E2E
   - Configure accessibility testing

4. **Standardize Test Organization**:
   - Consolidate naming (.test vs .spec)
   - Create test utilities library
   - Document test patterns

5. **Enhance CI Pipeline**:
   - Add test parallelization
   - Cache Vitest/Playwright dependencies
   - Add visual regression checks

---

## Files Referenced

### Configuration Files
- `/home/krwhynot/Projects/atomic/vitest.config.ts` - Vitest configuration
- `/home/krwhynot/Projects/atomic/vite.config.ts` - Build configuration
- `/home/krwhynot/Projects/atomic/tsconfig.json` - TypeScript root config
- `/home/krwhynot/Projects/atomic/tsconfig.app.json` - App TypeScript config
- `/home/krwhynot/Projects/atomic/package.json` - Dependencies and scripts
- `/home/krwhynot/Projects/atomic/eslint.config.js` - Linting rules
- `/home/krwhynot/Projects/atomic/.prettierrc.mjs` - Code formatting

### Test Files
- `/home/krwhynot/Projects/atomic/src/setupTests.js` - Global test setup
- `/home/krwhynot/Projects/atomic/src/tests/setup-mcp.ts` - MCP database setup
- `/home/krwhynot/Projects/atomic/src/atomic-crm/tests/unifiedDataProvider.test.ts` - Data provider tests
- `/home/krwhynot/Projects/atomic/tests/performance/opportunity-queries.spec.ts` - Performance benchmarks

### CI/CD Files
- `/home/krwhynot/Projects/atomic/.github/workflows/check.yml` - CI workflow
- `/home/krwhynot/Projects/atomic/.github/workflows/supabase-deploy.yml` - DB deployment

---

## Summary

**Current State**: Basic Vitest setup with **no UI component tests**. Infrastructure exists for API/data testing but lacks:
- UI component test coverage
- Visual regression testing
- E2E browser automation
- Accessibility testing
- Coverage reporting
- Working CI test command

**Immediate Action Required**: Fix broken CI by replacing `make test-ci` with proper npm script.

**Foundation is Solid**: Vitest, Testing Library, and jsdom are configured correctly. Need to build UI testing layer on top of existing infrastructure.

---

## 🆕 New Testing Requirements (Based on Critical Gaps)

### Additional Dependencies Needed

```bash
# Coverage and UI
npm install -D @vitest/coverage-v8 @vitest/ui

# E2E and Accessibility
npm install -D playwright @playwright/test @axe-core/playwright

# Storybook and Visual Regression
npm install -D @storybook/react-vite @storybook/addon-a11y @storybook/addon-interactions

# Testing utilities
npm install -D @testing-library/user-event @testing-library/jest-dom
```

### New npm Scripts Required

```json
{
  "test:ci": "vitest run --coverage --reporter=verbose",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:a11y": "playwright test tests/e2e/accessibility.spec.ts",
  "test:ui": "vitest --ui",
  "storybook": "storybook dev -p 6006",
  "build-storybook": "storybook build"
}
```

### CI/CD Updates Required

1. **Fix Broken Test Job**: Replace `make test-ci` with `npm run test:ci`
2. **Add Coverage Upload**: Integrate Codecov/Coveralls
3. **Add E2E Job**: Run Playwright tests with ephemeral Supabase
4. **Add Accessibility Job**: Run `npm run test:a11y`
5. **Add Chromatic Job**: Visual regression testing

### Test File Organization (Revised)

```
tests/
├── e2e/
│   ├── auth.spec.ts
│   ├── authorization.spec.ts        # 🆕 RBAC tests
│   ├── accessibility.spec.ts        # 🆕 a11y tests
│   ├── opportunities.spec.ts
│   ├── contacts.spec.ts
│   ├── filters.spec.ts
│   └── kanban.spec.ts
├── utils/
│   ├── db-helpers.ts
│   ├── test-data-factory.ts
│   ├── safeCleanup.ts               # 🆕 Robust cleanup helper
│   └── selectors.ts                 # 🆕 Reusable test selectors
├── global-setup.ts
└── global-teardown.ts

src/
├── components/
│   ├── ui/
│   │   └── *.test.tsx               # Component tests
│   └── admin/
│       └── *.test.tsx               # Admin component tests
└── atomic-crm/
    └── */
        └── *.test.tsx               # Feature component tests
```

### Flaky Test Policy (New)

**Detection**: Test fails in CI but passes on re-run more than 2 times in one week

**Action**:
1. Create P2 ticket to investigate root cause
2. If blocks >3 PRs, quarantine test (skip with `.skip()`)
3. Add comment explaining quarantine reason
4. Weekly review of quarantined tests

### Testing Principles to Enforce

1. **Selector Strategy**: ALWAYS use `getByRole`, `getByLabel`, or `data-testid`. NEVER use text or CSS selectors.
2. **Error Testing**: EVERY form component test MUST include at least one error state test
3. **Authorization**: EVERY protected resource test MUST verify both admin and non-admin access
4. **Cleanup**: ALWAYS use `safeCleanup()` helper to prevent cascading failures
5. **Accessibility**: EVERY new component story MUST pass @storybook/addon-a11y checks
