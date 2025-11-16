# E2E Testing Standards

This document defines the standards and best practices for end-to-end (E2E) testing in Atomic CRM using Playwright.

## Table of Contents

- [Quick Start](#quick-start)
- [Authentication](#authentication)
- [Page Object Models (POMs)](#page-object-models-poms)
- [Selectors](#selectors)
- [Waiting Strategies](#waiting-strategies)
- [Test Organization](#test-organization)
- [Console Monitoring](#console-monitoring)
- [Common Patterns](#common-patterns)
- [Anti-Patterns](#anti-patterns)

## Quick Start

```bash
# Run all E2E tests
npm run test:e2e

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (visible browser)
npm run test:e2e:headed

# Run specific test file
npx playwright test tests/e2e/specs/contacts/contacts-crud.spec.ts
```

## Authentication

### Storage State (Recommended)

**ALWAYS use storage state for authentication.** This is faster, more reliable, and prevents auth-related flakiness.

**How it works:**
1. `auth.setup.ts` runs once before all tests
2. Authenticates with real credentials via `LoginPage` POM
3. Saves authentication state to `tests/e2e/.auth/user.json`
4. All tests automatically load this auth state via `playwright.config.ts`

**Configuration** (`playwright.config.ts`):
```typescript
{
  name: "chromium",
  use: {
    storageState: "tests/e2e/.auth/user.json", // Pre-authenticated state
  },
  dependencies: ["setup"], // Runs auth.setup.ts first
}
```

**Setup file** (`auth.setup.ts`):
```typescript
import { test as setup } from "@playwright/test";
import { LoginPage } from "./support/poms/LoginPage";

const authFile = "tests/e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.loginAsAdmin();

  // Wait for Supabase auth tokens
  await page.waitForFunction(() => {
    const keys = Object.keys(localStorage);
    return keys.some(key => key.includes("supabase.auth.token"));
  });

  await page.context().storageState({ path: authFile });
});
```

**In tests:**
```typescript
// ✅ CORRECT: No authentication code needed
test("should display contacts", async ({ page }) => {
  await page.goto("/");
  // Page is already authenticated via storage state
  await expect(page.getByRole("heading", { name: /contacts/i })).toBeVisible();
});

// ❌ WRONG: Manual login in every test
test("should display contacts", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "admin@test.com");
  await page.fill("#password", "password123");
  await page.click("button[type=submit]");
  // This is slow and causes flakiness!
});
```

### Inline Login (Legacy Pattern)

Some older tests use inline login via `LoginPage` POM. This is acceptable but slower:

```typescript
test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto("/");

  const isLoginFormVisible = await page
    .getByLabel(/email/i)
    .isVisible({ timeout: 2000 })
    .catch(() => false);

  if (isLoginFormVisible) {
    await loginPage.login("admin@test.com", "password123");
  }
});
```

**Recommendation:** Migrate legacy tests to use storage state when refactoring.

## Page Object Models (POMs)

**RULE: All tests MUST use Page Object Models.** Never interact with the DOM directly in test files.

### POM Structure

All POMs live in `tests/e2e/support/poms/` and extend `BasePage`:

```
tests/e2e/support/poms/
├── BasePage.ts                    # Base class with common methods
├── LoginPage.ts                   # Authentication
├── ContactsListPage.ts            # Contacts list view
├── ContactFormPage.ts             # Contact create/edit
├── ContactShowPage.ts             # Contact detail view
├── OpportunitiesListPage.ts       # Opportunities list + Kanban
├── OpportunityFormPage.ts         # Opportunity forms
├── TasksListPage.ts               # Tasks management
└── WeeklyActivityReportPage.ts    # Reports
```

### BasePage Pattern

All POMs extend `BasePage` which provides semantic selector helpers:

```typescript
// tests/e2e/support/poms/BasePage.ts
import type { Page, Locator } from "@playwright/test";

export class BasePage {
  constructor(protected page: Page) {}

  // Navigation
  async goto(url: string): Promise<void> {
    await this.page.goto(url);
  }

  async waitForURL(pattern: string | RegExp, timeout = 10000): Promise<void> {
    await this.page.waitForURL(pattern, { timeout });
  }

  async waitForAPIResponse(urlPattern: string, timeout = 10000): Promise<void> {
    await this.page.waitForResponse(
      (resp) => resp.url().includes(urlPattern) && resp.status() === 200,
      { timeout }
    );
  }

  // Semantic selector helpers
  getButton(name: string | RegExp): Locator {
    return this.page.getByRole("button", { name });
  }

  getLink(name: string | RegExp): Locator {
    return this.page.getByRole("link", { name });
  }

  getTextInput(label: string | RegExp): Locator {
    return this.page.getByLabel(label);
  }

  getText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }
}
```

### Example POM

```typescript
// tests/e2e/support/poms/ContactsListPage.ts
import { BasePage } from "./BasePage";
import type { Locator } from "@playwright/test";

export class ContactsListPage extends BasePage {
  async goto(): Promise<void> {
    await this.page.goto("/#/contacts");
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("networkidle");
    await this.getButton(/create/i).waitFor({ state: "visible" });
  }

  async clickCreate(): Promise<void> {
    await this.getButton(/create/i).click();
  }

  async search(query: string): Promise<void> {
    const searchInput = this.page.getByPlaceholder(/search/i);
    await searchInput.clear();
    await searchInput.fill(query);
  }

  getContactRow(name: string): Locator {
    return this.page.getByRole("row").filter({ hasText: name });
  }

  async expectContactExists(name: string): Promise<void> {
    await expect(this.getContactRow(name)).toBeVisible();
  }
}
```

### Using POMs in Tests

```typescript
import { test, expect } from "@playwright/test";
import { ContactsListPage } from "../../support/poms/ContactsListPage";
import { ContactFormPage } from "../../support/poms/ContactFormPage";

test.describe("Contacts CRUD", () => {
  let listPage: ContactsListPage;
  let formPage: ContactFormPage;

  test.beforeEach(async ({ page }) => {
    listPage = new ContactsListPage(page);
    formPage = new ContactFormPage(page);
    await listPage.goto();
  });

  test("should create contact", async () => {
    await listPage.clickCreate();
    await formPage.fillFirstName("John");
    await formPage.fillLastName("Doe");
    await formPage.submit();
    await listPage.expectContactExists("John Doe");
  });
});
```

## Selectors

**RULE: Use semantic selectors ONLY.** Never use CSS selectors or test IDs unless absolutely necessary.

### Selector Priority (Highest to Lowest)

1. **`getByRole`** - Accessible roles (button, link, textbox, etc.)
2. **`getByLabel`** - Form inputs via their labels
3. **`getByPlaceholder`** - Input placeholders
4. **`getByText`** - Visible text content
5. **`getByTestId`** - Last resort for non-semantic elements

### Examples

```typescript
// ✅ CORRECT: Semantic selectors
await page.getByRole("button", { name: /create/i }).click();
await page.getByLabel(/first name/i).fill("John");
await page.getByPlaceholder(/search contacts/i).fill("Acme");
await page.getByText(/no results found/i).waitFor();
await page.getByRole("row").filter({ hasText: "John Doe" }).click();

// ⚠️ ACCEPTABLE: Test IDs when semantic selectors don't work
await page.locator('[data-testid="kanban-board"]').waitFor();
await page.locator('[data-testid="opportunity-card"]').first().click();

// ❌ WRONG: CSS selectors
await page.locator(".btn-primary").click();
await page.locator("#contact-form input[name=firstName]").fill("John");
await page.locator("div.card > h2").click();
```

### Case-Insensitive Matching

Use regex with `/i` flag for case-insensitive matching:

```typescript
// ✅ Matches "Create", "create", "CREATE"
await page.getByRole("button", { name: /create/i }).click();

// ❌ Exact match only
await page.getByRole("button", { name: "Create" }).click();
```

### Filter Chains

Use `.filter()` to narrow down locators:

```typescript
// Find row containing "John Doe" and click its edit button
await page
  .getByRole("row")
  .filter({ hasText: "John Doe" })
  .getByRole("button", { name: /edit/i })
  .click();

// Find opportunity card and check its stage
const card = page
  .locator('[data-testid="opportunity-card"]')
  .filter({ hasText: "Enterprise Deal" });
await expect(card).toContainText("Qualification");
```

## Waiting Strategies

**RULE: Use condition-based waiting.** Never use `waitForTimeout()` except for animation settling in visual regression tests.

### Condition-Based Waiting (✅ Correct)

Wait for actual state changes using Playwright's auto-waiting and explicit conditions:

```typescript
// ✅ Wait for element to be visible
await page.getByRole("button", { name: /save/i }).waitFor({ state: "visible" });

// ✅ Wait for URL change
await page.waitForURL(/\/#\/contacts\/\d+/);

// ✅ Wait for API response
await page.waitForResponse(
  resp => resp.url().includes("/api/contacts") && resp.status() === 200
);

// ✅ Wait for network idle
await page.waitForLoadState("networkidle");

// ✅ Wait for custom condition
await page.waitForFunction(() => {
  return document.querySelectorAll('.opportunity-card').length > 0;
});

// ✅ Wait for element to be removed
await page.getByText(/loading/i).waitFor({ state: "hidden" });
```

### Auto-Waiting

Playwright automatically waits for elements before actions:

```typescript
// ✅ Auto-waits for button to be visible, enabled, and stable
await page.getByRole("button", { name: /submit/i }).click();

// ✅ Auto-waits for input to be visible and editable
await page.getByLabel(/email/i).fill("test@example.com");

// ✅ Auto-waits for assertion
await expect(page.getByText(/success/i)).toBeVisible();
```

### Timeout Overrides

Override default timeout when needed:

```typescript
// Increase timeout for slow operations
await page.waitForURL(/\/#\/reports/, { timeout: 15000 });

// Decrease timeout for quick checks
const isVisible = await page
  .getByText(/optional element/i)
  .isVisible({ timeout: 1000 })
  .catch(() => false);
```

### Visual Regression Exception

**ONLY exception:** Allow animations to settle before screenshots:

```typescript
test("should match layout snapshot", async ({ page }) => {
  await page.goto("/#/dashboard");
  await page.waitForLoadState("networkidle");

  // ⚠️ Acceptable ONLY for visual regression
  await page.waitForTimeout(500); // Allow animations to settle

  await expect(page).toHaveScreenshot("dashboard.png", {
    maxDiffPixelRatio: 0.02,
  });
});
```

### Anti-Patterns (❌ Wrong)

```typescript
// ❌ Arbitrary timeouts instead of conditions
await page.waitForTimeout(2000); // Hope element loads in 2s
await page.click("button");

// ❌ Retry loops instead of auto-waiting
for (let i = 0; i < 10; i++) {
  if (await page.locator("button").isVisible()) break;
  await page.waitForTimeout(100);
}

// ❌ Polling instead of waitForFunction
while (!(await page.locator(".card").count() > 0)) {
  await page.waitForTimeout(100);
}
```

## Test Organization

### Directory Structure

```
tests/e2e/
├── README.md                      # This file
├── auth.setup.ts                  # Authentication setup
├── global-setup.ts                # Clear cache before tests
├── specs/                         # ✅ Organized test files
│   ├── contacts/
│   │   └── contacts-crud.spec.ts
│   ├── opportunities/
│   │   ├── crud.spec.ts
│   │   ├── kanban-board.spec.ts
│   │   └── stage-transitions.spec.ts
│   ├── tasks/
│   │   └── tasks-crud.spec.ts
│   ├── reports/
│   │   ├── weekly-activity-report.spec.ts
│   │   └── campaign-activity-report.spec.ts
│   ├── diagnostics/
│   │   ├── app-loading.spec.ts
│   │   └── env-vars.spec.ts
│   └── forms/
│       └── tabbed-forms-ui-design.spec.ts
├── support/                       # Support utilities
│   ├── poms/                      # Page Object Models
│   │   ├── BasePage.ts
│   │   ├── LoginPage.ts
│   │   ├── ContactsListPage.ts
│   │   └── ...
│   ├── fixtures/
│   │   └── authenticated.ts       # Custom fixtures
│   └── utils/
│       └── console-monitor.ts     # Console error tracking
└── legacy/                        # ⚠️ Deprecated tests (quarantined)
    └── old-test.spec.ts
```

### File Naming

- **Spec files:** `<feature>.spec.ts` (e.g., `contacts-crud.spec.ts`)
- **POMs:** `<Resource><View>Page.ts` (e.g., `ContactsListPage.ts`)
- **Utilities:** `<purpose>.ts` (e.g., `console-monitor.ts`)

### Test Structure

```typescript
import { test, expect } from "@playwright/test";
import { ContactsListPage } from "../../support/poms/ContactsListPage";
import { consoleMonitor } from "../../support/utils/console-monitor";

/**
 * Contacts CRUD Test Suite
 * Tests create, read, update, delete operations
 *
 * Priority: Critical (P1)
 * Coverage: List view, forms, validation
 *
 * FOLLOWS: playwright-e2e-testing skill requirements
 */
test.describe("Contacts CRUD Operations", () => {
  let listPage: ContactsListPage;

  test.beforeEach(async ({ page }) => {
    await consoleMonitor.attach(page);
    listPage = new ContactsListPage(page);
    await listPage.goto();
  });

  test.afterEach(async () => {
    if (consoleMonitor.getErrors().length > 0) {
      console.log(consoleMonitor.getReport());
    }
    consoleMonitor.clear();
  });

  test("should create new contact", async () => {
    // Test implementation using POMs
  });

  test("should update existing contact", async () => {
    // Test implementation
  });
});
```

## Console Monitoring

**RULE: Monitor console for errors in all tests.** This catches RLS, React, and network issues.

### Setup

```typescript
import { consoleMonitor } from "../../support/utils/console-monitor";

test.beforeEach(async ({ page }) => {
  await consoleMonitor.attach(page);
});

test.afterEach(async () => {
  if (consoleMonitor.getErrors().length > 0) {
    console.log(consoleMonitor.getReport());
  }
  consoleMonitor.clear();
});
```

### Checking for Specific Errors

```typescript
test("should not have RLS errors", async ({ page }) => {
  await page.goto("/#/contacts");

  // Verify no permission denied errors
  expect(consoleMonitor.hasRLSErrors()).toBe(false);
  expect(consoleMonitor.hasReactErrors()).toBe(false);
  expect(consoleMonitor.hasNetworkErrors()).toBe(false);
});
```

### Manual Console Monitoring

```typescript
test("should handle API errors gracefully", async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  // Perform actions...

  const rlsErrors = consoleErrors.filter(err =>
    err.includes("permission denied")
  );
  expect(rlsErrors).toHaveLength(0);
});
```

## Common Patterns

### Timestamp-Based Test Data

Use timestamps to ensure test data isolation:

```typescript
test("should create contact", async () => {
  const timestamp = Date.now();
  const contactName = `Test Contact ${timestamp}`;

  await formPage.fillFirstName(contactName);
  await formPage.submit();
  await listPage.expectContactExists(contactName);
});
```

### Viewport-Specific Tests

Skip tests on incompatible viewports:

```typescript
test("should drag opportunity card", async ({ page, isMobile }) => {
  test.skip(isMobile, "Drag-and-drop requires mouse events");

  // Desktop-only drag-and-drop test
  await listPage.dragOpportunityToStage("Deal Name", "Closed Won");
});
```

### Conditional Visibility Checks

Handle optional UI elements gracefully:

```typescript
// Check if element exists without failing
const hasWelcomeBanner = await page
  .getByText(/welcome/i)
  .isVisible({ timeout: 1000 })
  .catch(() => false);

if (hasWelcomeBanner) {
  await page.getByRole("button", { name: /dismiss/i }).click();
}
```

### Visual Regression with Masking

Mask dynamic content for stable screenshots:

```typescript
await expect(page).toHaveScreenshot("kanban-board.png", {
  mask: [
    page.locator('[data-testid="timestamp"]'),
    page.locator("time"),
    page.locator('[data-testid="avatar"]'),
  ],
  fullPage: true,
  maxDiffPixelRatio: 0.02,
});
```

### API Response Waiting

Wait for specific API calls to complete:

```typescript
// Wait for successful API response
await page.waitForResponse(
  resp => resp.url().includes("/api/contacts") && resp.status() === 200,
  { timeout: 10000 }
);

// Or in BasePage POM
await listPage.waitForAPIResponse("/api/contacts");
```

## Anti-Patterns

### ❌ Direct DOM Manipulation

```typescript
// ❌ WRONG: Direct CSS selectors
await page.locator(".btn-primary").click();
await page.locator("#email-input").fill("test@example.com");

// ✅ CORRECT: Semantic selectors via POM
await formPage.getButton(/submit/i).click();
await formPage.getTextInput(/email/i).fill("test@example.com");
```

### ❌ Hardcoded Timeouts

```typescript
// ❌ WRONG: Arbitrary waits
await page.waitForTimeout(2000);
await page.click("button");

// ✅ CORRECT: Condition-based waiting
await page.getByRole("button").waitFor({ state: "visible" });
await page.getByRole("button").click();
```

### ❌ Manual Login in Tests

```typescript
// ❌ WRONG: Login in every test
test.beforeEach(async ({ page }) => {
  await page.goto("/login");
  await page.fill("#email", "admin@test.com");
  await page.fill("#password", "password123");
  await page.click("button");
});

// ✅ CORRECT: Use storage state
// No auth code needed - handled by playwright.config.ts
test("should display contacts", async ({ page }) => {
  await page.goto("/#/contacts");
  // Already authenticated!
});
```

### ❌ Logic in Test Files

```typescript
// ❌ WRONG: Complex selectors in tests
test("should edit contact", async ({ page }) => {
  await page.locator(".contact-list tr").filter({ hasText: "John" })
    .locator("button.edit").click();
});

// ✅ CORRECT: Logic in POM
test("should edit contact", async () => {
  await listPage.clickEditContact("John Doe");
});

// In ContactsListPage POM:
async clickEditContact(name: string): Promise<void> {
  await this.page
    .getByRole("row")
    .filter({ hasText: name })
    .getByRole("button", { name: /edit/i })
    .click();
}
```

### ❌ Testing Mock Behavior

```typescript
// ❌ WRONG: Mocking real API
test("should display contacts", async ({ page }) => {
  await page.route("**/api/contacts", route => {
    route.fulfill({ json: [{ id: 1, name: "Fake Contact" }] });
  });
  // This tests the mock, not the real system!
});

// ✅ CORRECT: Test against real database
test("should display contacts", async () => {
  await listPage.goto();
  await listPage.expectContactExists("Real Contact From Seed");
});
```

### ❌ Sharing State Between Tests

```typescript
// ❌ WRONG: Tests depend on each other
let createdContactId: string;

test("should create contact", async () => {
  // Create contact
  createdContactId = await formPage.getContactId();
});

test("should update contact", async () => {
  // Depends on previous test!
  await listPage.editContact(createdContactId);
});

// ✅ CORRECT: Each test is independent
test("should update contact", async () => {
  // Create fresh test data
  const timestamp = Date.now();
  const contactName = `Update Test ${timestamp}`;

  await listPage.clickCreate();
  await formPage.fillFirstName(contactName);
  await formPage.submit();

  // Now update it
  await listPage.clickEditContact(contactName);
  await formPage.fillFirstName("Updated Name");
  await formPage.submit();
});
```

---

## Additional Resources

- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright E2E Testing Skill](docs/claude/skills/playwright-e2e-testing.md)
- [Testing Quick Reference](docs/development/testing-quick-reference.md)
- [Playwright MCP Guide](docs/development/playwright-mcp-guide.md)

## Questions?

If you're unsure about a pattern:
1. Check existing specs in `tests/e2e/specs/` for examples
2. Look at the POMs in `tests/e2e/support/poms/`
3. Consult the `playwright-e2e-testing` skill in Claude Code
4. Ask in the team chat or create a discussion issue
