---
name: testing-patterns
description: TDD and unit testing guidance for Crispy CRM. Use when writing tests, implementing TDD, debugging test failures, or setting up test infrastructure. Covers Vitest patterns, React Admin component testing, Zod schema validation testing, Supabase mocking, E2E with Playwright, and manual E2E testing with Claude Chrome. Integrates with verification-before-completion for test verification.
---

# Testing Patterns for Crispy CRM

## Overview

Comprehensive testing guidance for the Crispy CRM codebase. Covers unit testing with Vitest, component testing with React Admin context, validation testing with Zod schemas, and E2E testing with Playwright.

**Philosophy:** Tests should verify behavior, not implementation. Focus on what the code does, not how it does it.

## When to Use

Use this skill when:
- Writing new tests (unit, integration, E2E)
- Implementing TDD (Test-Driven Development)
- Debugging failing tests
- Setting up test infrastructure
- Mocking Supabase or React Admin
- Understanding test coverage requirements
- Writing Claude Chrome manual E2E prompts

## Test Stack

| Layer | Tool | Location |
|-------|------|----------|
| **Unit Tests** | Vitest | `src/**/__tests__/*.test.ts` |
| **Component Tests** | Vitest + React Testing Library | `src/**/__tests__/*.test.tsx` |
| **Validation Tests** | Vitest + Zod | `src/atomic-crm/validation/__tests__/` |
| **E2E Tests** | Playwright | `tests/e2e/` |
| **Manual E2E** | Claude Chrome | `docs/tests/e2e/` |
| **Database Tests** | pgTAP | `supabase/tests/` |

## TDD Workflow

### The Three Laws of TDD (Uncle Bob)

1. **You may not write production code until you have written a failing test**
2. **You may not write more of a test than is sufficient to fail**
   (Compilation failures count as failures)
3. **You may not write more production code than is sufficient to pass the test**

These laws create a tight feedback loop: test → fail → implement → pass → refactor → repeat.

### The Red-Green-Refactor Cycle

```
┌─────────────────────────────────────────────────────────┐
│  1. RED: Write a failing test                           │
│     • Test describes expected behavior                  │
│     • Run test → FAILS (as expected)                    │
│     • Write the MINIMUM test to fail                    │
├─────────────────────────────────────────────────────────┤
│  2. GREEN: Write minimal code to pass                   │
│     • Only implement what's needed to pass              │
│     • Speed over elegance - just make it work           │
│     • Run test → PASSES                                 │
├─────────────────────────────────────────────────────────┤
│  3. REFACTOR: Clean up while tests pass                 │
│     • Improve structure, readability, performance       │
│     • Run tests → STILL PASSES                          │
│     • Refactor EITHER test OR production code per commit│
└─────────────────────────────────────────────────────────┘
```

**Critical:** The refactor step is NOT optional—it's the heart of sustainable code. Skipping it is the most common TDD mistake.

### Arrange-Act-Assert Pattern

Structure every test with three clear sections:

```typescript
it('calculates total with tax', () => {
  // Arrange: Set up test data
  const items = [{ price: 100 }, { price: 50 }];
  const taxRate = 0.1;

  // Act: Execute the code
  const total = calculateTotalWithTax(items, taxRate);

  // Assert: Verify the outcome
  expect(total).toBe(165);
});
```

### Where TDD Thrives

| Domain | TDD Effectiveness | Why |
|--------|-------------------|-----|
| **Validation schemas** | Excellent | Well-defined inputs/outputs |
| **Pure functions** | Excellent | No side effects |
| **Data providers** | Very Good | Clear API contracts |
| **Hooks** | Very Good | Isolated logic |
| **Components** | Good | Need user interaction testing |
| **UI layout** | Fair | Visual verification better |

### Where TDD is Harder (Not Impossible)

- **UI-heavy code** → Extract logic into presenter/view-model patterns
- **Async event handling** → Favor hexagonal architecture
- **Legacy code without seams** → Add dependency injection first
- **External integrations** → Mock at boundaries, integration test separately

### TDD in Watch Mode

Use continuous test feedback during development:

```bash
# Start watch mode
just test:watch

# Workflow:
# 1. Write failing test → See RED in terminal
# 2. Write code → See GREEN
# 3. Refactor → Confirm still GREEN
# 4. Commit → Repeat
```

**Pro tip:** Keep your terminal visible while coding. Instant feedback accelerates the cycle.

### TypeScript + TDD Benefits

TypeScript enhances TDD by providing type-level feedback before tests run:

```typescript
// TypeScript catches this BEFORE the test runs
const result = contactSchema.safeParse({
  email: 123  // TS Error: Type 'number' is not assignable to type 'string'
});

// TDD catches runtime behavior
it('rejects numeric email', () => {
  const result = contactSchema.safeParse({ email: '123' });
  expect(result.success).toBe(false);  // Schema requires valid format
});
```

### Common TDD Pitfalls

| Pitfall | Problem | Fix |
|---------|---------|-----|
| Skipping refactor | Technical debt accumulates | Refactor after EVERY green |
| Testing implementation | Brittle tests break on refactor | Test inputs → outputs only |
| Writing tests after code | Confirmation bias | Discipline: test FIRST |
| Chasing 100% coverage | Meaningless tests | Focus on behavior coverage |
| Giant test steps | Hard to debug failures | Small increments |

### TDD ROI

Initial slowdown of 15-35% development time yields:
- **Up to 90% fewer defects** (IBM, Microsoft studies)
- **Faster debugging** (tests isolate failures)
- **Living documentation** (tests explain behavior)
- **Confident refactoring** (safety net)

### TDD in Crispy CRM

```typescript
// 1. RED: Write failing test
describe('validateContact', () => {
  it('rejects email without @ symbol', () => {
    const result = contactSchema.safeParse({
      email: 'invalid-email'
    });
    expect(result.success).toBe(false);
  });
});

// 2. GREEN: Implement validation
export const contactSchema = z.object({
  email: z.string().email(),
});

// 3. REFACTOR: Add constraints
export const contactSchema = z.object({
  email: z.string().email().max(255),
});
```

## Automatic Activation

This skill activates automatically for implementation tasks. When you see:
- "implement feature", "create component", "add handler", "new schema"
- Any file modification in `src/atomic-crm/**/*.ts` or `src/atomic-crm/**/*.tsx`

**The skill will remind you:**
1. Write test FIRST (Red phase)
2. Run test to confirm it fails
3. Implement minimal code (Green phase)
4. Refactor while tests pass
5. Verify with `just test` before claiming complete

### Integration with verification-before-completion

Testing is now enforced at completion time:
- Cannot claim "done" without test evidence
- Cannot claim "feature complete" without passing tests
- UI changes prompt for Manual E2E via Claude Chrome

## Unit Testing Patterns

### Test File Structure

```typescript
// src/atomic-crm/contacts/__tests__/ContactEdit.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAdminContext } from '@/tests/utils/render-admin';
import { ContactEdit } from '../ContactEdit';

describe('ContactEdit', () => {
  beforeEach(() => {
    vi.resetAllMocks(); // Use resetAllMocks, NOT clearAllMocks (enforced by ESLint)
  });

  describe('form rendering', () => {
    it('displays contact name field', async () => {
      renderWithAdminContext(<ContactEdit />);
      expect(await screen.findByLabelText(/name/i)).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('calls update on valid submission', async () => {
      // Test implementation
    });
  });
});
```

### Testing React Admin Components

**Always use `renderWithAdminContext`:**

```typescript
import { renderWithAdminContext } from '@/tests/utils/render-admin';

// ✅ CORRECT: Uses admin context
renderWithAdminContext(<ContactList />);

// ❌ WRONG: Missing context
render(<ContactList />); // Will fail - no DataProvider
```

**The helper provides:**
- `DataProvider` (mocked Supabase)
- `AuthProvider` (mock user)
- `QueryClient` (React Query)
- Router context

### Mocking Supabase

```typescript
// src/tests/setup.ts - Global mock
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    })),
  },
}));

// Per-test override
it('handles database error', async () => {
  vi.mocked(supabase.from).mockReturnValueOnce({
    select: vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Connection failed' }
    }),
  });

  // Test error handling
});
```

### Testing Zod Schemas

```typescript
// src/atomic-crm/validation/__tests__/contacts.test.ts
import { describe, it, expect } from 'vitest';
import { contactSchema, createContactSchema } from '../contacts';

describe('contactSchema', () => {
  describe('valid inputs', () => {
    it('accepts complete valid contact', () => {
      const result = contactSchema.safeParse({
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      });
      expect(result.success).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects email without domain', () => {
      const result = contactSchema.safeParse({
        first_name: 'John',
        email: 'invalid',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('email');
      }
    });

    it('rejects name exceeding max length', () => {
      const result = contactSchema.safeParse({
        first_name: 'A'.repeat(101), // Max is 100
      });
      expect(result.success).toBe(false);
    });
  });

  describe('coercion', () => {
    it('coerces string numbers to numbers', () => {
      const result = opportunitySchema.safeParse({
        amount: '1000', // String from form input
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(typeof result.data.amount).toBe('number');
      }
    });
  });

  describe('defaults', () => {
    it('applies schema defaults via partial().parse()', () => {
      const defaults = contactSchema.partial().parse({});
      expect(defaults.status).toBe('active');
    });
  });
});
```

### Testing Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useContactsWithOrganizations } from '../useContactsWithOrganizations';
import { createWrapper } from '@/tests/utils/create-wrapper';

describe('useContactsWithOrganizations', () => {
  it('fetches contacts with their organizations', async () => {
    const { result } = renderHook(
      () => useContactsWithOrganizations(),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].organizations).toBeDefined();
  });
});
```

## Component Testing Patterns

### Testing Form Submission

```typescript
it('submits form with valid data', async () => {
  const user = userEvent.setup();
  const onSubmit = vi.fn();

  renderWithAdminContext(
    <ContactCreate onSubmit={onSubmit} />
  );

  await user.type(screen.getByLabelText(/first name/i), 'John');
  await user.type(screen.getByLabelText(/email/i), 'john@example.com');
  await user.click(screen.getByRole('button', { name: /save/i }));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'John',
        email: 'john@example.com',
      })
    );
  });
});
```

### Testing Error States

```typescript
it('displays validation errors', async () => {
  const user = userEvent.setup();

  renderWithAdminContext(<ContactCreate />);

  // Submit without required fields
  await user.click(screen.getByRole('button', { name: /save/i }));

  await waitFor(() => {
    expect(screen.getByRole('alert')).toHaveTextContent(/required/i);
  });
});
```

### Testing Accessibility

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = renderWithAdminContext(<ContactList />);

  await waitFor(async () => {
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## E2E Testing with Playwright

### Test Structure

```typescript
// tests/e2e/contacts.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Contacts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
  });

  test('creates a new contact', async ({ page }) => {
    await page.click('text=Create');
    await page.fill('[name="first_name"]', 'Jane');
    await page.fill('[name="email"]', 'jane@example.com');
    await page.click('button:has-text("Save")');

    await expect(page.locator('text=Jane')).toBeVisible();
  });

  test('filters contacts by name', async ({ page }) => {
    await page.fill('[placeholder="Search"]', 'John');

    await expect(page.locator('table tbody tr')).toHaveCount(1);
    await expect(page.locator('text=John Doe')).toBeVisible();
  });
});
```

### Page Object Pattern

```typescript
// tests/e2e/pages/ContactsPage.ts
import { Page } from '@playwright/test';

export class ContactsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/contacts');
  }

  async createContact(data: { firstName: string; email: string }) {
    await this.page.click('text=Create');
    await this.page.fill('[name="first_name"]', data.firstName);
    await this.page.fill('[name="email"]', data.email);
    await this.page.click('button:has-text("Save")');
  }

  async searchByName(name: string) {
    await this.page.fill('[placeholder="Search"]', name);
  }
}

// Usage in test
test('creates contact', async ({ page }) => {
  const contactsPage = new ContactsPage(page);
  await contactsPage.goto();
  await contactsPage.createContact({
    firstName: 'Jane',
    email: 'jane@example.com'
  });
});
```

## Manual E2E Testing with Claude Chrome

For browser-based manual testing using Claude Chrome, prompts are written as markdown documentation, copied by users into Claude Chrome, and executed via browser automation.

**Architecture:** Claude Code (WSL2) → User copies prompt → Claude Chrome (browser)

### When to Use Manual E2E

| Use Manual E2E | Use Playwright |
|----------------|----------------|
| Visual/UI verification | CI/CD regression testing |
| Production smoke tests (read-only) | Automated assertions |
| Exploratory testing | Repeatable test suites |
| Complex workflows needing judgment | Simple CRUD operations |

### Key Practices

1. **Be explicit** - Use exact button text, labels, URLs
2. **VERIFY checkpoints** - Every action needs explicit verification
3. **Console monitoring** - Include DevTools watching instructions
4. **Structured reporting** - Use test IDs (WG-001, SS-002) for traceability
5. **Copy-paste friendly** - Self-contained, no external references

### When Claude Chrome E2E is Triggered

For UI changes, verification-before-completion will prompt:
> Would you like me to generate a Claude Chrome test prompt?

See `.claude/skills/testing-patterns/resources/MANUAL_E2E_CLAUDE_CHROME.md` for prompt writing guide.

### Resources

- **Full guide:** [MANUAL_E2E_CLAUDE_CHROME.md](./resources/MANUAL_E2E_CLAUDE_CHROME.md)
- **Test checklists:** `docs/tests/e2e/`
- **Examples:** `docs/tests/e2e/claude-code-e2e-prompt.md`

## Database Testing with pgTAP

### Test Structure

```sql
-- supabase/tests/contacts_test.sql
BEGIN;

SELECT plan(3);

-- Test RLS policies
SELECT ok(
  (SELECT COUNT(*) FROM contacts WHERE deleted_at IS NULL) >= 0,
  'Can read active contacts'
);

-- Test soft delete
UPDATE contacts SET deleted_at = NOW() WHERE id = 'test-id';
SELECT is(
  (SELECT COUNT(*) FROM contacts_summary WHERE id = 'test-id'),
  0::bigint,
  'Soft-deleted contacts excluded from summary view'
);

-- Test constraints
SELECT throws_ok(
  $$INSERT INTO contacts (email) VALUES ('invalid-email')$$,
  '23514', -- check_violation
  'Email format constraint enforced'
);

SELECT * FROM finish();
ROLLBACK;
```

## Anti-Patterns to Avoid

### Testing Implementation Details

```typescript
// ❌ WRONG: Testing implementation
it('calls useState with initial value', () => {
  const useStateSpy = vi.spyOn(React, 'useState');
  render(<Component />);
  expect(useStateSpy).toHaveBeenCalledWith(0);
});

// ✅ CORRECT: Testing behavior
it('starts with count of zero', () => {
  render(<Component />);
  expect(screen.getByText('Count: 0')).toBeInTheDocument();
});
```

### Snapshot Overuse

```typescript
// ❌ WRONG: Brittle snapshot
it('renders correctly', () => {
  const { container } = render(<ContactCard />);
  expect(container).toMatchSnapshot();
});

// ✅ CORRECT: Specific assertions
it('displays contact name and email', () => {
  render(<ContactCard contact={mockContact} />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('john@example.com')).toBeInTheDocument();
});
```

### Testing Without Assertions

```typescript
// ❌ WRONG: No assertions
it('renders', () => {
  render(<Component />);
  // Test passes but verifies nothing!
});

// ✅ CORRECT: Meaningful assertion
it('renders loading state initially', () => {
  render(<Component />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
```

### Ignoring Async Behavior

```typescript
// ❌ WRONG: Race condition
it('shows data after fetch', () => {
  render(<DataComponent />);
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});

// ✅ CORRECT: Wait for async
it('shows data after fetch', async () => {
  render(<DataComponent />);
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

## Quick Reference

### Running Tests

```bash
# All unit tests
just test

# Watch mode
just test:watch

# Specific file
npx vitest src/atomic-crm/contacts/__tests__/ContactEdit.test.tsx

# With coverage
just test:coverage

# E2E tests
npx playwright test

# Database tests
npx supabase test db
```

### Test Commands Cheat Sheet

| Command | Purpose |
|---------|---------|
| `just test` | Run all unit tests |
| `just test:watch` | Watch mode for TDD |
| `just test:coverage` | Generate coverage report |
| `just test:ui` | Vitest UI for debugging |
| `npx playwright test` | Run E2E tests |
| `npx playwright test --ui` | Playwright UI mode |
| `npx supabase test db` | Run pgTAP tests |

### Coverage Requirements

| Type | Minimum | Target |
|------|---------|--------|
| **Validation schemas** | 90% | 100% |
| **Data providers** | 80% | 90% |
| **Components** | 70% | 80% |
| **Hooks** | 80% | 90% |
| **E2E critical paths** | 100% | 100% |

## Integration with Other Skills

| Skill | Integration |
|-------|-------------|
| `verification-before-completion` | Run tests before claiming "done" |
| `fail-fast-debugging` | Use test failures to trace root cause |
| `enforcing-principles` | Tests verify schema validation at API boundary |

## Decision Tree

```
Need to write tests?
│
├─ New feature?
│  └─ Start with TDD → Write failing test first
│
├─ Bug fix?
│  └─ Write test that reproduces bug → Fix → Verify passes
│
├─ Validation logic?
│  └─ Test Zod schemas → Valid/invalid inputs, coercion, defaults
│
├─ React component?
│  └─ Use renderWithAdminContext → Test user interactions
│
├─ Database logic?
│  └─ pgTAP tests → RLS policies, constraints, triggers
│
└─ Full user journey?
   └─ Playwright E2E → Critical path scenarios
```

## Red Flags - STOP and Review

If you find yourself:
- Writing tests after code is "done" → Consider TDD next time
- Testing internal state → Test behavior instead
- Skipping async waitFor → Race condition risk
- Using raw `render()` for React Admin components → Use `renderWithAdminContext`
- No assertions in test → Test is meaningless
- Massive snapshots → Use specific assertions

**Remember:** Tests are documentation. They should clearly express what the code does.

## ESLint Enforcement (Week 4 Automation)

The following patterns are enforced by ESLint rules in test files:

### Test Isolation Rule

```typescript
// ESLint ERROR: Use vi.resetAllMocks() instead
vi.clearAllMocks(); // clearAllMocks only clears call history

// CORRECT: resetAllMocks clears history AND implementation
vi.resetAllMocks();
```

**Why:** `clearAllMocks()` leaves mock implementations intact, causing test pollution when one test's mock setup affects another.

### Context Wrapper Rule

```typescript
// ESLint ERROR: Use renderWithAdminContext instead
render(<ContactList />); // Missing React Admin context

// CORRECT: Provides DataProvider, AuthProvider, QueryClient, Router
renderWithAdminContext(<ContactList />);
```

**Why:** React Admin components require context providers. Bare `render()` causes "useAdmin must be used within AdminContext" errors.

## Test File Best Practices Checklist

When writing or modifying test files (`*.test.ts`, `*.test.tsx`):
- [ ] Use `renderWithAdminContext`, not bare `render`
- [ ] Use `vi.resetAllMocks()` in beforeEach, not `clearAllMocks`
- [ ] Ensure mocks are properly scoped to each test
