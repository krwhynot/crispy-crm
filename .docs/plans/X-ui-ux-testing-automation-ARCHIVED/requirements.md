# UI/UX Testing Automation Requirements

## Feature Summary

Implement comprehensive automated UI/UX testing for the Atomic CRM to catch UX flow breaks, prevent regressions, and increase developer confidence when refactoring React Admin components. The system will include three testing layers: (1) Playwright E2E tests for critical user journeys, (2) Vitest + React Testing Library for component integration tests, and (3) Storybook + Chromatic for visual regression testing. All tests will follow the Engineering Constitution: no over-engineering, fail fast, single source of truth (Supabase), and deterministic execution.

**Development Estimate**: 5-7 days
**Primary Goals**: Catch UX flow breaks early, increase refactoring confidence, automate visual regression detection

---

## 🆕 Critical Updates from Expert Analysis

**Document revised based on Zen (Gemini 2.5 Pro) architectural review. Key changes:**

1. **Authorization Testing Added** ⚠️ CRITICAL GAP
   - Flow 6: RBAC tests for admin vs. non-admin access
   - Validates `is_admin` role differentiation in `sales` table

2. **API Error States Added** ⚠️ CRITICAL GAP
   - Component tests now include 500 errors, RLS violations, server failures
   - Tests verify UI behaves correctly when data provider rejects

3. **Robust Cleanup Strategy** 🔧 IMPROVED
   - `safeCleanup()` helper with `Promise.allSettled` prevents cascading failures
   - Cleanup errors logged but don't poison test environment

4. **Test Selector Strategy** 📋 NEW SECTION
   - Mandatory hierarchy: user-facing selectors (getByRole) > data-testid > avoid text/CSS
   - Human review required for all AI-generated tests

5. **Accessibility Workflow** ♿ NEW SECTION
   - Formal a11y testing with @axe-core/playwright
   - Dedicated `a11y-tests` CI job scanning 5 key pages
   - Storybook addon-a11y for component-level checks

6. **Implementation Phases Reordered** 🔄 FOUNDATION FIRST
   - Phase 1: Component + Visual (Days 1-3) - fastest feedback, largest coverage
   - Phase 2: E2E Integration (Days 4-6) - build on stable foundation
   - Phase 3: CI/CD (Continuous) - incremental additions

7. **Flaky Test Policy Added** 🎯 NEW
   - Define process for handling flaky tests
   - Quarantine policy if tests block >3 PRs

---

## User Stories

### As a Developer

**US-1**: As a developer, I want E2E tests for critical user flows so that I can verify complete user journeys work end-to-end in a real browser.

**US-2**: As a developer, I want component integration tests for React Admin forms and lists so that I can refactor components with confidence that validation and interactions still work.

**US-3**: As a developer, I want visual regression tests so that CSS/layout changes are automatically detected before merging.

**US-4**: As a developer, I want Claude Code to generate E2E tests from plain English user stories so that I can describe flows and get executable test scripts instantly.

**US-5**: As a developer, I want Claude Code to auto-generate component tests when I create a new React component so that test coverage grows automatically with the codebase.

**US-6**: As a developer, I want tests to run automatically on every PR so that I get fast feedback before merging.

**US-7**: As a developer, I want tests to be reliable with automatic retries so that flaky tests don't block deployments.

---

## Technical Approach

### 1. Test Data Management (Industry Standard Hybrid)

**Strategy**: Ephemeral database per CI run + Global seed + Per-test isolation

#### Ephemeral Supabase Instance (CI/CD)
- Use Supabase CLI (`supabase start`) to spin up PostgreSQL + Auth + Storage in Docker for each GitHub Actions workflow run
- Apply migrations via `supabase db reset` to establish schema
- Tear down instance after tests complete
- **Single Source of Truth**: All test data lives in Supabase, no mocks

#### Global Seed (Static Data)
- Playwright `globalSetup` runs once before all test suites
- Seeds read-only data: user roles, application settings, default pipeline stages
- File: `tests/global-setup.ts`
- Uses Supabase service_role client

#### Per-Test Isolation (Mutable Data)
- Each test creates its own data in `beforeEach` using direct Supabase client calls
- **Robust Cleanup** in `afterEach` to delete created records with error handling 🆕
- **Fail Fast**: No retry logic for data setup—if setup fails, test fails immediately
- **Cleanup Resilience**: Cleanup failures are logged but don't block other cleanups 🆕
- Helper functions in `tests/utils/db-helpers.ts`:
  ```typescript
  interface TestUser {
    email: string;
    password: string;
  }

  type TestDataCleanup = () => Promise<void>;

  export async function createTestUser(userData: TestUser): Promise<{ user: User; cleanup: TestDataCleanup }>;
  export async function createTestOpportunity(data: OpportunityData): Promise<{ opportunity: Opportunity; cleanup: TestDataCleanup }>;

  // 🆕 Robust cleanup helper
  export async function safeCleanup(cleanupFunctions: TestDataCleanup[]): Promise<void> {
    const results = await Promise.allSettled(cleanupFunctions.map(fn => fn()));
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      console.error(`${failures.length} cleanup operations failed:`, failures);
      // Log but don't throw - allow other tests to continue
    }
  }
  ```

**Cleanup Pattern Example:**
```typescript
describe('Opportunity Tests', () => {
  const cleanups: TestDataCleanup[] = [];

  afterEach(async () => {
    await safeCleanup(cleanups);
    cleanups.length = 0; // Clear array
  });

  it('creates opportunity', async () => {
    const { opportunity, cleanup } = await createTestOpportunity({...});
    cleanups.push(cleanup);
    // test logic...
  });
});
  ```

**Local Development**:
- Point to local Supabase instance (`supabase start`)
- Use `.env.test` with `VITE_SUPABASE_URL=http://localhost:54321`
- Same patterns as CI—no special local-only paths

---

### 2. Playwright E2E Tests

**Goal**: Test critical user journeys in Chrome headless (WSL2 constraint)

#### Configuration
- File: `playwright.config.ts`
- Browser: Chromium only (headless mode)
- Retries: 2 attempts for flaky tests, then fail fast
- Parallel execution: 4 workers
- Base URL: `http://localhost:5173` (dev server) or `https://crispy-crm.vercel.app` (staging)
- Test credentials from env vars: `TEST_USER_EMAIL=test@gmail.com`, `TEST_USER_PASSWORD=Welcome123`

#### Test Selector Strategy 🆕 **CRITICAL**

**Mandatory Selector Hierarchy** (use in order of preference):

1. **User-Facing Selectors** (Playwright/Testing Library best practice):
   ```typescript
   // Preferred: Accessible role + name
   page.getByRole('button', { name: 'Create Opportunity' })
   page.getByRole('textbox', { name: 'Email' })
   page.getByLabel('Opportunity Name')
   ```

2. **data-testid Attributes** (for critical elements only):
   ```typescript
   // Add to key UI elements in code:
   <Button data-testid="submit-opportunity-form">Create</Button>

   // Use in tests:
   page.getByTestId('submit-opportunity-form')
   ```

3. **AVOID: Brittle Selectors** ❌
   ```typescript
   // DON'T: Text content (changes with i18n, copy edits)
   page.click('text=Create')

   // DON'T: CSS classes (changes with refactoring)
   page.click('.btn-primary')

   // DON'T: Complex CSS selectors (fragile DOM structure)
   page.click('div.container > form > button:nth-child(3)')
   ```

**Implementation Rule**: All AI-generated tests MUST use user-facing selectors or data-testid. Human review required before merge.

#### Critical User Flows

**Flow 1: Create Opportunity**
```typescript
test('create opportunity with validation', async ({ page }) => {
  // 1. Login
  // 2. Navigate to /opportunities
  // 3. Click Create button
  // 4. Fill form (name, amount, stage, probability)
  // 5. Verify Zod validation errors for invalid inputs
  // 6. Submit valid form
  // 7. Verify redirect to /opportunities
  // 8. Assert new opportunity appears in list
});
```

**Flow 2: Contact Management**
```typescript
test('create contact and link to organization', async ({ page }) => {
  // 1. Navigate to /contacts
  // 2. Create contact with email/phone JSONB arrays
  // 3. Link to organization via contact_organizations junction
  // 4. Add tags
  // 5. Navigate to contact detail page
  // 6. Verify all data displays correctly
});
```

**Flow 3: Filter & Search**
```typescript
test('apply multi-select filters and save preferences', async ({ page }) => {
  // 1. Navigate to /opportunities
  // 2. Apply stage filter (multi-select)
  // 3. Verify filtered results
  // 4. Check localStorage for persisted filter
  // 5. Reload page
  // 6. Verify filter persists
  // 7. Export filtered results
});
```

**Flow 4: Edit Flow**
```typescript
test('edit opportunity and verify persistence', async ({ page }) => {
  // 1. Navigate to opportunity detail
  // 2. Click Edit
  // 3. Modify amount, stage, relationships
  // 4. Submit
  // 5. Verify optimistic UI update
  // 6. Verify data persisted in DB
});
```

**Flow 5: Kanban Stage Validation**
```typescript
test('kanban board prevents invalid stage transitions', async ({ page }) => {
  // 1. Navigate to opportunities kanban
  // 2. Attempt to move opportunity backward in pipeline
  // 3. Verify error message or prevention
  // 4. Verify stage did NOT change in DB
});
```

**Flow 6: Authorization (RBAC)** 🆕 **CRITICAL GAP IDENTIFIED**
```typescript
test('non-admin user cannot access sales resource', async ({ page }) => {
  // 1. Login as regular user (is_admin: false)
  // 2. Attempt to navigate to /sales
  // 3. Verify redirect to dashboard OR 403 error message
  // 4. Verify sales menu item not visible in navigation
  // 5. Attempt direct API access to sales endpoint
  // 6. Verify RLS policy blocks access
});

test('admin user can access all resources', async ({ page }) => {
  // 1. Login as admin user (is_admin: true)
  // 2. Verify sales resource visible in navigation
  // 3. Navigate to /sales and verify list loads
  // 4. Create/edit/delete sales record
  // 5. Verify all operations succeed
});
```

#### Test Organization
```
tests/
├── e2e/
│   ├── auth.spec.ts
│   ├── authorization.spec.ts      # 🆕 RBAC tests
│   ├── opportunities.spec.ts
│   ├── contacts.spec.ts
│   ├── filters.spec.ts
│   └── kanban.spec.ts
├── utils/
│   ├── db-helpers.ts          # Supabase client helpers
│   ├── test-data-factory.ts   # Faker-based data generators
│   └── page-objects/          # Page Object Model (optional, if needed)
├── global-setup.ts
└── global-teardown.ts
```

---

### 3. Component Integration Tests (Vitest + React Testing Library)

**Goal**: Test React Admin components in isolation with mocked data providers

#### Tier 1: Forms (High Priority)

**OpportunityCreate Tests**
```typescript
describe('OpportunityCreate', () => {
  it('populates default values from config', () => {
    // 1. Render component with mocked AdminContext
    // 2. Assert default stage, probability, closing date
  });

  it('validates amount field with Zod schema', async () => {
    // 1. Render form
    // 2. Enter invalid amount (negative, non-numeric)
    // 3. Submit
    // 4. Assert Zod error message displays
  });

  it('calls data provider on successful submit', async () => {
    // 1. Mock useCreate hook
    // 2. Fill valid form
    // 3. Submit
    // 4. Assert dataProvider.create called with correct payload
  });

  it('displays error notification on data provider failure', async () => {
    // 🆕 CRITICAL GAP: API error state testing
    // 1. Mock data provider to reject with error
    const dataProvider = {
      create: jest.fn().mockRejectedValue(new Error('Server error'))
    };
    // 2. Render form with mocked error provider
    // 3. Fill valid form and submit
    // 4. Assert error notification/toast appears
    // 5. Verify form remains editable (not disabled)
  });

  it('displays field-specific errors from RLS violations', async () => {
    // 🆕 Test RLS policy errors
    // 1. Mock data provider to return RLS violation error
    // 2. Submit form
    // 3. Assert appropriate error message shown
    // 4. Verify user can correct and retry
  });
});
```

**ContactCreate Tests**
```typescript
describe('ContactCreate', () => {
  it('handles JSONB email array inputs', async () => {
    // 1. Render form
    // 2. Add multiple emails with types (work, personal)
    // 3. Assert JSONB structure: [{ type: 'work', email: 'x@y.com' }]
  });

  it('links contact to organization via junction table', async () => {
    // 1. Select organization
    // 2. Submit
    // 3. Assert contact_organizations record created
  });
});
```

#### Tier 3: Lists (Medium Priority)

**OpportunityList Tests**
```typescript
describe('OpportunityList', () => {
  it('renders opportunities with pagination', () => {
    // Mock dataProvider.getList response
  });

  it('applies multi-select stage filter', async () => {
    // 1. Select multiple stages
    // 2. Assert filter query params updated
    // 3. Assert dataProvider called with filter
  });

  it('persists filter preferences to localStorage', async () => {
    // 1. Apply filter
    // 2. Assert localStorage.setItem called
  });

  it('displays empty state when no records', () => {
    // Mock empty response
  });
});
```

**ContactList Tests**
```typescript
describe('ContactList', () => {
  it('handles contacts_summary view data', () => {
    // Mock denormalized view data
  });

  it('displays tags correctly', () => {
    // Verify tag rendering
  });
});
```

#### Test Utilities
```typescript
// tests/utils/render-admin.tsx
import { AdminContext } from 'react-admin';

type DataProviderMock = {
  getList: jest.fn();
  getOne: jest.fn();
  create: jest.fn();
  update: jest.fn();
  delete: jest.fn();
};

export function renderWithAdmin(
  component: React.ReactElement,
  dataProvider: Partial<DataProviderMock>
) {
  return render(
    <AdminContext dataProvider={dataProvider as any}>
      {component}
    </AdminContext>
  );
}
```

---

### 4. Visual Regression Testing (Storybook + Chromatic)

**Goal**: Catch CSS/layout changes automatically

#### Storybook Configuration
- File: `.storybook/main.ts`
- Framework: React + Vite
- Addons: `@storybook/addon-a11y` (accessibility), `@storybook/addon-interactions`
- Build: `npm run build-storybook`

#### Accessibility Testing Workflow 🆕 **CRITICAL**

**Formal a11y Testing Process:**

1. **Component Level** (Storybook):
   - Every story automatically scanned with `@storybook/addon-a11y`
   - Axe violations shown in Storybook UI during development
   - Critical violations must be fixed before story merge

2. **E2E Baseline** (Playwright + Axe):
   ```typescript
   // tests/e2e/accessibility.spec.ts
   import { test, expect } from '@playwright/test';
   import AxeBuilder from '@axe-core/playwright';

   test('homepage has no critical a11y violations', async ({ page }) => {
     await page.goto('/');
     const accessibilityScanResults = await new AxeBuilder({ page })
       .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
       .analyze();

     expect(accessibilityScanResults.violations).toEqual([]);
   });

   test('opportunities list has no critical violations', async ({ page }) => {
     await page.goto('/#/opportunities');
     const results = await new AxeBuilder({ page }).analyze();

     // Fail on critical and serious violations only
     const criticalViolations = results.violations.filter(
       v => v.impact === 'critical' || v.impact === 'serious'
     );
     expect(criticalViolations).toEqual([]);
   });
   ```

3. **CI/CD Integration**:
   - Add dedicated `a11y-tests` job to GitHub Actions
   - Run Axe scans on 5 key pages (dashboard, opportunities, contacts, create forms, edit forms)
   - Fail build on critical/serious violations
   - Generate HTML report with all findings

4. **Manual Testing Checklist**:
   - Keyboard navigation works for all interactive elements
   - Screen reader announcements verified for critical flows
   - Color contrast meets WCAG AA standards (enforced by semantic colors)
   - Focus indicators visible on all focusable elements

#### Component Coverage

**All Shared UI Components** (src/components/ui/):
- Button (all variants: default, destructive, outline, ghost)
- Input
- Select
- Badge
- Card
- Dialog
- Tabs
- Avatar
- ~20-30 components total

**Story Example**:
```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: 'Click me',
    variant: 'default',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Delete',
    variant: 'destructive',
  },
};
```

#### Chromatic Integration
- Service: Chromatic (Storybook's official visual testing platform)
- Trigger: On every PR via GitHub Actions
- Workflow:
  1. Build Storybook
  2. Publish to Chromatic
  3. Chromatic captures snapshots
  4. Compares to baseline (main branch)
  5. Posts diff report to PR
- Approval: Developer reviews diffs, approves/rejects
- **Fail Fast**: If Chromatic build fails, fail the PR check

**GitHub Action**:
```yaml
- name: Publish to Chromatic
  uses: chromaui/action@v1
  with:
    projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
    exitOnceUploaded: true
```

---

### 5. CI/CD Pipeline Configuration

**GitHub Actions Workflows**

#### Pre-commit Hook (Local)
```yaml
# .husky/pre-commit
npm run lint
npm run vitest:related  # Only test files related to staged changes
```

#### Pull Request Workflow (`.github/workflows/pr.yml`)
```yaml
name: PR Quality Gate

on: pull_request

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit
      - run: npm run test              # All Vitest component tests
      - run: npm run build

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx supabase start        # Ephemeral Supabase instance
      - run: npx supabase db reset --local
      - run: npx playwright install chromium --with-deps
      - run: npm run test:e2e
      - run: npx supabase stop
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Full history for Chromatic
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run build-storybook
      - uses: chromaui/action@v1
        with:
          projectToken: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

#### Main Branch Workflow (`.github/workflows/main.yml`)
```yaml
name: Main Branch Validation

on:
  push:
    branches: [main]

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e
      - run: npm run build
      # Deploy to staging
      - name: Deploy to Vercel Staging
        run: vercel deploy --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
      # Smoke tests against staging
      - run: npm run test:e2e:smoke
        env:
          BASE_URL: https://crispy-crm.vercel.app
```

#### Nightly Workflow (`.github/workflows/nightly.yml`)
```yaml
name: Nightly E2E Suite

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily

jobs:
  full-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test:e2e:full
        env:
          BASE_URL: https://crispy-crm.vercel.app
```

---

### 6. Claude Code Integration Patterns

**Priority 1: E2E Test Generation from User Stories**

Developer writes plain English:
```
Claude, write a Playwright test:
1. Login as test@gmail.com
2. Navigate to contacts
3. Create a new contact named "John Doe" with email john@example.com
4. Link contact to "Acme Corp" organization
5. Verify contact appears in the list
```

Claude generates:
```typescript
test('create contact and link to organization', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@gmail.com');
  await page.fill('input[name="password"]', 'Welcome123');
  await page.click('button[type="submit"]');

  // Navigate to contacts
  await page.click('a[href="#/contacts"]');
  await page.waitForURL('**/contacts');

  // Create contact
  await page.click('text=Create');
  await page.fill('input[name="first_name"]', 'John');
  await page.fill('input[name="last_name"]', 'Doe');
  await page.fill('input[name="email"]', 'john@example.com');

  // Link to organization
  await page.click('input[name="organization"]');
  await page.click('text=Acme Corp');

  // Submit
  await page.click('button:has-text("Save")');

  // Verify
  await expect(page.locator('text=John Doe')).toBeVisible();
});
```

**Priority 2: Component Test Auto-Generation**

Developer creates `ProductCreate.tsx`:
```typescript
export const ProductCreate = () => {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="name" validate={required()} />
        <NumberInput source="price" validate={[required(), minValue(0)]} />
      </SimpleForm>
    </Create>
  );
};
```

Claude detects new component and generates:
```typescript
// ProductCreate.test.tsx
describe('ProductCreate', () => {
  it('validates required name field', async () => {
    const { getByLabelText, getByText } = renderWithAdmin(<ProductCreate />, {});

    const submitButton = getByText('Save');
    fireEvent.click(submitButton);

    expect(getByText('Required')).toBeInTheDocument();
  });

  it('validates price minimum value', async () => {
    const { getByLabelText, getByText } = renderWithAdmin(<ProductCreate />, {});

    const priceInput = getByLabelText('Price');
    fireEvent.change(priceInput, { target: { value: '-10' } });

    const submitButton = getByText('Save');
    fireEvent.click(submitButton);

    expect(getByText('Must be at least 0')).toBeInTheDocument();
  });
});
```

**Priority 3: Storybook Story Generation**

Developer creates `Badge.tsx`. Claude generates:
```typescript
// Badge.stories.tsx
export const Default: Story = { args: { children: 'Badge' } };
export const Secondary: Story = { args: { children: 'Badge', variant: 'secondary' } };
export const Destructive: Story = { args: { children: 'Badge', variant: 'destructive' } };
export const Outline: Story = { args: { children: 'Badge', variant: 'outline' } };
```

---

## UI/UX Flow: Developer Test Workflow

### 1. Local Development
1. Developer writes new feature (e.g., `InvoiceCreate` component)
2. Claude auto-generates component test in `InvoiceCreate.test.tsx`
3. Developer runs `npm run test:watch` to see tests pass in real-time
4. Developer commits code
5. Pre-commit hook runs lint + related tests (<10s)

### 2. Pull Request
1. Developer pushes branch
2. GitHub Actions runs 3 parallel jobs:
   - **Validate**: Lint, typecheck, all Vitest tests, build
   - **E2E**: Playwright tests with ephemeral Supabase
   - **Visual**: Chromatic screenshot diffs
3. Developer sees results in PR checks
4. If visual diffs: Developer reviews in Chromatic UI, approves/rejects
5. All checks pass → PR is mergeable

### 3. Writing E2E Tests
1. Developer describes user flow in plain English to Claude
2. Claude generates Playwright test script
3. Developer runs `npm run test:e2e:ui` (Playwright UI mode) to debug test
4. Developer adjusts test if needed
5. Commit and push

### 4. Debugging Failures
1. Test fails in CI
2. Developer downloads `playwright-report` artifact from GitHub Actions
3. Opens trace viewer: `npx playwright show-trace trace.zip`
4. Sees screenshots, network calls, console logs
5. Fixes issue
6. Re-runs tests locally: `npm run test:e2e`

---

## Success Metrics

### Coverage Metrics
- **E2E Tests**: 5 critical user flows covered (auth, create, edit, filter, kanban validation)
- **Component Tests**:
  - 100% of Tier 1 forms (OpportunityCreate, OpportunityEdit, ContactCreate, ContactEdit)
  - 100% of Tier 3 lists (OpportunityList, ContactList)
- **Visual Regression**: 100% of shared UI components (src/components/ui/)

### Performance Metrics
- **Component Tests**: < 30 seconds for full suite
- **E2E Tests**: < 10 minutes for full suite (5-7 tests with retries)
- **Visual Regression**: < 5 minutes for Chromatic build

### Reliability Metrics
- **Flaky Test Rate**: < 5% (tests pass consistently on retry)
- **CI/CD Success Rate**: > 95% (tests don't block PRs due to flakiness)

### Developer Experience Metrics
- **Time to Write E2E Test**: < 5 minutes (using Claude Code generation)
- **Time to Write Component Test**: < 3 minutes (using Claude Code generation)
- **PR Feedback Time**: < 10 minutes (all checks complete)

### Quality Metrics
- **Regression Bugs Caught**: Track bugs caught by automated tests vs manual testing
- **Visual Regressions Caught**: Count of unintended CSS changes caught by Chromatic
- **Accessibility Issues Caught**: Count of a11y violations caught by axe-core

---

## Out of Scope

### Not Included in This Feature
1. **Multi-Browser Testing** - Only Chrome headless (WSL2 constraint). No Firefox, Safari, or Edge testing.
2. **Performance Testing** - No Lighthouse scores, no load testing, no bundle size monitoring.
3. **Security Testing** - No penetration testing, no OWASP vulnerability scans.
4. **API Contract Testing** - No Pact or API schema validation tests.
5. **Mobile/Responsive Testing** - No mobile device emulation or touch interaction tests.
6. **Internationalization Testing** - No i18n/translation testing.
7. **Database Migration Testing** - No automated migration rollback/forward testing.
8. **Email/SMS Testing** - No integration with email/SMS delivery testing services.
9. **Third-Party Integration Testing** - No tests for external APIs (Stripe, SendGrid, etc.).
10. **Backward Compatibility** - No testing of old browsers or legacy code paths (per Engineering Constitution).

### Future Enhancements (Not in 5-7 Day Scope)
- Mutation testing (Stryker)
- Contract testing for Supabase RPC functions
- Accessibility audits beyond automated axe-core checks
- Performance budgets and monitoring
- Test coverage badges in README

---

## Dependencies

### New npm Packages
```json
{
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@storybook/react": "^8.4.0",
    "@storybook/react-vite": "^8.4.0",
    "@storybook/addon-a11y": "^8.4.0",
    "@storybook/addon-interactions": "^8.4.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@testing-library/jest-dom": "^6.6.3",
    "@axe-core/playwright": "^4.10.0",
    "chromatic": "^11.18.1"
  }
}
```

### Environment Variables
```bash
# .env.test
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<local_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
TEST_USER_EMAIL=test@gmail.com
TEST_USER_PASSWORD=Welcome123

# GitHub Secrets
CHROMATIC_PROJECT_TOKEN=<chromatic_token>
SUPABASE_ACCESS_TOKEN=<for CLI in CI>
```

### Supabase CLI
```bash
npm install -g supabase
supabase init
supabase start  # Starts local Docker containers
```

---

## Implementation Strategy (Revised Based on Expert Analysis) 🆕

**Zen Recommendation**: Foundation First approach delivers value faster and builds on stable components before integration testing.

### Phase 1: Component & Visual Foundation (Days 1-3) 🔄 **REVISED PRIORITY**

**Why First**: Component and visual tests are self-contained, provide fastest feedback, and cover the largest surface area. Getting 100% visual coverage and component test coverage early provides massive confidence boost.

**Agent 1: Vitest + RTL Setup & Implementation**
- Install React Testing Library + jest-dom + @vitest/coverage-v8 + @vitest/ui
- Update `vitest.config.ts` with coverage configuration
- Create `tests/utils/render-admin.tsx` helper
- **IMMEDIATE**: Research `ra-test` library compatibility with React Admin 5
- Write tests for all Tier 1 forms (4 components) with error states 🆕
- Write tests for Tier 3 lists (2 components)
- Add API error state tests (500 errors, RLS violations) 🆕
- Document in `.docs/plans/ui-ux-testing-automation/component-testing-setup.md`

**Agent 2: Storybook + Chromatic Setup & Implementation**
- Install Storybook + @storybook/addon-a11y + @storybook/addon-interactions
- Configure `.storybook/main.ts` with Vite
- Set up Chromatic account and get project token
- Create stories for ALL src/components/ui/ components (~215 stories)
- Establish visual baselines in Chromatic
- Verify a11y addon catches violations
- Document in `.docs/plans/ui-ux-testing-automation/storybook-setup.md`

**Deliverable**: Stable component library with complete visual regression coverage and comprehensive unit tests. This becomes the foundation for E2E tests.

---

### Phase 2: E2E Integration Tests (Days 4-6) 🔄 **MOVED TO SECOND**

**Why Second**: E2E tests are more stable when underlying components are already verified. Build integration tests on proven foundation.

**Agent 3: Playwright Setup**
- Install Playwright + @axe-core/playwright
- Create `playwright.config.ts` (Chromium only, retries: 2)
- Write `tests/global-setup.ts` with Supabase seed and robust cleanup 🆕
- Create `tests/utils/db-helpers.ts` with `safeCleanup()` helper 🆕
- Add `data-testid` attributes to critical UI elements 🆕
- Document in `.docs/plans/ui-ux-testing-automation/playwright-setup.md`

**Agent 4: E2E Test Implementation**
- Write 6 critical flow tests (auth, authorization 🆕, create, edit, filter, kanban)
- Implement test data factories with Faker using JSONB array helpers
- Add accessibility baseline tests (5 key pages) 🆕
- Use user-facing selectors (getByRole, getByLabel) per selector strategy 🆕
- Document in `.docs/plans/ui-ux-testing-automation/e2e-tests.md`

**Deliverable**: Complete E2E test suite validating critical user journeys with accessibility checks.

---

### Phase 3: CI/CD & Documentation (Days 6-7) ⚙️ **CONTINUOUS**

**Why Continuous**: Build CI/CD incrementally alongside tests to avoid "big bang" integration.

**Agent 5: Incremental CI/CD Pipeline**
- **Day 1-3**: Create simple `pr.yml` running only Vitest tests
- **Day 3-4**: Add Chromatic job to `pr.yml`
- **Day 5-6**: Add Playwright job with ephemeral Supabase
- **Day 6**: Add dedicated `a11y-tests` job 🆕
- **Day 7**: Create `.github/workflows/nightly.yml` with full suite
- Fix broken CI: Replace `make test-ci` with `npm run test:ci` 🆕 **URGENT**
- Add coverage upload to Codecov
- Set up GitHub Secrets (CHROMATIC_PROJECT_TOKEN, CODECOV_TOKEN)
- Document in `.docs/plans/ui-ux-testing-automation/ci-cd.md`

**Agent 6: Developer Documentation & Flaky Test Policy**
- Write guide for using Claude Code to generate tests with selector strategy 🆕
- Create test writing best practices doc
- Add npm scripts to package.json (test:ci, test:coverage, test:e2e, test:a11y) 🆕
- Define flaky test policy: "If test fails in CI but passes on re-run >2 times in one week, create P2 ticket to investigate. May quarantine (skip) if blocks >3 PRs." 🆕
- Update main README with testing section
- Document in `.docs/plans/ui-ux-testing-automation/developer-guide.md`

**Deliverable**: Production-ready CI/CD pipeline with comprehensive documentation and flaky test management policy.

---

## Engineering Constitution Compliance

✅ **NO OVER-ENGINEERING**: Simple test patterns, fail fast on errors, no complex retry logic beyond Playwright's built-in retries
✅ **SINGLE SOURCE OF TRUTH**: All test data managed via Supabase, no mocks except React Admin context
✅ **BOY SCOUT RULE**: Fix any test flakiness or inconsistencies when encountered
✅ **VALIDATION**: Tests verify Zod schemas at API boundary work correctly
✅ **TYPESCRIPT**: Use `interface` for test data types, `type` for unions
✅ **FAIL FAST**: No health monitoring, no circuit breakers—if test setup fails, abort immediately
✅ **PARALLEL DECOMPOSITION**: Implementation broken into 8 parallel agents across 3 phases
