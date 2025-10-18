# Testing Quick Reference

Essential testing commands, patterns, and coverage requirements for Atomic CRM.

## Testing Framework

**Stack:**
- **Unit/Integration:** Vitest + React Testing Library
- **E2E:** Playwright
- **Coverage Tool:** Vitest (c8)

**Coverage Requirement:** 70% minimum across all metrics (statements, branches, functions, lines)

## Quick Start Commands

```bash
# Development (watch mode)
npm test                 # Run tests, watch for changes

# Single run (CI mode)
npm run test:ci          # Run once with verbose output

# Coverage
npm run test:coverage    # Generate coverage report (coverage/ directory)

# Visual UI
npm run test:ui          # Launch Vitest UI (http://localhost:51204)

# End-to-end
npm run test:e2e         # Run Playwright E2E tests
npm run test:e2e:ui      # Launch Playwright UI mode

# Performance
npm run test:performance # Run performance benchmarks
npm run test:load        # Run load tests
```

## Test Commands Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm test` | Watch mode | During development |
| `npm run test:ci` | Single run | CI/CD pipelines |
| `npm run test:coverage` | Generate report | Before commits, PR reviews |
| `npm run test:unit` | Unit tests only | Isolate unit test failures |
| `npm run test:e2e` | E2E tests | Integration testing |
| `npm run test:ui` | Visual explorer | Debugging flaky tests |

## Test File Locations

**Unit/Integration Tests:**
```
src/**/*.test.ts         # TypeScript utilities
src/**/*.test.tsx        # React components
src/tests/integration/   # Integration tests
```

**E2E Tests:**
```
tests/e2e/               # Playwright E2E tests
```

**Fixtures:**
```
tests/fixtures/          # Test data, mocks
```

## Writing Tests

### Pattern: Unit Test (TypeScript)

```typescript
// src/utils/formatName.test.ts
import { describe, it, expect } from 'vitest'
import { formatName } from './formatName'

describe('formatName', () => {
  it('formats first and last name', () => {
    expect(formatName('John', 'Doe')).toBe('John Doe')
  })

  it('handles missing last name', () => {
    expect(formatName('John', '')).toBe('John')
  })

  it('handles empty input', () => {
    expect(formatName('', '')).toBe('')
  })
})
```

### Pattern: Component Test (React)

```typescript
// src/components/ContactCard.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ContactCard } from './ContactCard'

describe('ContactCard', () => {
  it('renders contact name', () => {
    render(<ContactCard first_name="John" last_name="Doe" />)
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('renders email if provided', () => {
    render(<ContactCard first_name="John" last_name="Doe" email="john@example.com" />)
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })

  it('handles missing email gracefully', () => {
    render(<ContactCard first_name="John" last_name="Doe" />)
    expect(screen.queryByText('@')).not.toBeInTheDocument()
  })
})
```

### Pattern: Async Tests

```typescript
import { describe, it, expect, vi } from 'vitest'
import { fetchContact } from './api'

describe('fetchContact', () => {
  it('fetches contact successfully', async () => {
    const contact = await fetchContact('123')
    expect(contact).toHaveProperty('id', '123')
    expect(contact).toHaveProperty('first_name')
  })

  it('handles errors', async () => {
    await expect(fetchContact('invalid')).rejects.toThrow('Not found')
  })
})
```

### Pattern: Mocking

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dataProvider } from './dataProvider'

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}))

describe('dataProvider.getList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls Supabase with correct params', async () => {
    await dataProvider.getList('contacts', {
      pagination: { page: 1, perPage: 10 },
      sort: { field: 'created_at', order: 'DESC' },
      filter: {},
    })

    expect(supabase.from).toHaveBeenCalledWith('contacts')
  })
})
```

## Semantic Selectors (Best Practice)

**Priority Order:**
1. **getByRole** (accessibility-first) ✅
2. **getByLabelText** (form fields) ✅
3. **getByPlaceholderText** (inputs) ⚠️
4. **getByTestId** (last resort) ⚠️
5. **Avoid:** CSS selectors, text content ❌

**Examples:**
```typescript
// ✅ Best: getByRole (accessibility-friendly)
screen.getByRole('button', { name: 'Save Contact' })
screen.getByRole('textbox', { name: 'Email' })

// ✅ Good: getByLabelText (forms)
screen.getByLabelText('First Name')

// ⚠️ Acceptable: getByPlaceholderText
screen.getByPlaceholderText('Enter email address')

// ⚠️ Last resort: data-testid
screen.getByTestId('contact-card')

// ❌ Avoid: CSS selectors
screen.querySelector('.contact-card')  // Brittle!

// ❌ Avoid: Text matching
screen.getByText('John Doe')  // Breaks with i18n!
```

**Rationale:** Semantic selectors ensure tests remain stable during UI refactoring and enforce accessibility best practices.

## Coverage Requirements

**Baseline:** 70% across all metrics

**Metrics:**
- **Statements:** 70% minimum
- **Branches:** 70% minimum
- **Functions:** 70% minimum
- **Lines:** 70% minimum

**Checking Coverage:**
```bash
npm run test:coverage

# Output:
# ✅ Statements   : 75.23% ( 1843/2450 )
# ✅ Branches     : 72.15% ( 821/1138 )
# ✅ Functions    : 73.81% ( 531/719 )
# ✅ Lines        : 75.12% ( 1802/2399 )
```

**Coverage Report Location:** `coverage/index.html`

**CI/CD:** Coverage checks run automatically in CI. PRs that drop coverage below 70% will fail.

## Test Organization

### Directory Structure

```
src/
├── components/
│   ├── ContactCard.tsx
│   └── ContactCard.test.tsx         # Co-located with component
├── utils/
│   ├── formatName.ts
│   └── formatName.test.ts           # Co-located with utility
└── tests/
    ├── integration/
    │   ├── auth.test.ts             # Integration tests
    │   └── contacts-crud.test.ts
    └── fixtures/
        ├── contacts.ts              # Test data
        └── opportunities.ts

tests/
└── e2e/
    ├── login.spec.ts                # E2E tests
    ├── contacts.spec.ts
    └── opportunities.spec.ts
```

### Naming Conventions

- **Unit tests:** `*.test.ts` or `*.test.tsx`
- **E2E tests:** `*.spec.ts`
- **Test suites:** Use `describe()` blocks
- **Test cases:** Use `it()` or `test()`

## E2E Testing (Playwright)

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/contacts.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug
```

### E2E Test Pattern

```typescript
// tests/e2e/contacts.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Contact Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173')
    await page.fill('[name="email"]', 'admin@test.local')
    await page.fill('[name="password"]', 'Test123!')
    await page.click('button[type="submit"]')
  })

  test('creates a new contact', async ({ page }) => {
    // Navigate to contacts
    await page.click('text=Contacts')
    await page.click('text=Create')

    // Fill form
    await page.fill('[name="first_name"]', 'John')
    await page.fill('[name="last_name"]', 'Doe')
    await page.fill('[name="email"]', 'john@example.com')

    // Submit
    await page.click('button:has-text("Save")')

    // Verify
    await expect(page.locator('text=John Doe')).toBeVisible()
  })
})
```

## Flaky Tests

**Policy:** See [Flaky Test Policy](../../.docs/testing/FLAKY_TEST_POLICY.md)

**Quick Tips:**
1. **Retry failed tests:** Vitest automatically retries flaky tests
2. **Use waitFor:** Don't assume immediate DOM updates
3. **Mock time:** Use `vi.useFakeTimers()` for time-dependent tests
4. **Isolate state:** Use `beforeEach` to reset state

**Example: Handling async operations**
```typescript
import { waitFor } from '@testing-library/react'

test('loads contact data', async () => {
  render(<ContactList />)

  // ❌ Wrong: Assumes immediate load
  expect(screen.getByText('John Doe')).toBeInTheDocument()

  // ✅ Correct: Wait for async load
  await waitFor(() => {
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })
})
```

## Performance Testing

```bash
# Run performance benchmarks
npm run test:performance

# Run load tests
npm run test:load
```

**Benchmark Pattern:**
```typescript
// src/utils/formatName.bench.ts
import { bench, describe } from 'vitest'
import { formatName } from './formatName'

describe('formatName performance', () => {
  bench('format 1000 names', () => {
    for (let i = 0; i < 1000; i++) {
      formatName('John', 'Doe')
    }
  })
})
```

## Debugging Tests

### VS Code Integration

Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### CLI Debugging

```bash
# Run single test file
npm test -- ContactCard.test.tsx

# Run tests matching pattern
npm test -- --grep "formatName"

# Run with coverage
npm test -- --coverage

# Update snapshots
npm test -- -u
```

## Test-Driven Development (TDD)

**Workflow:**
1. Write failing test
2. Run `npm test` (watch mode)
3. Write minimal code to pass
4. Refactor
5. Repeat

**Example:**
```typescript
// 1. Write failing test
test('calculates total price', () => {
  expect(calculateTotal([10, 20, 30])).toBe(60)
})

// 2. Watch mode shows failure
// npm test

// 3. Write minimal implementation
export const calculateTotal = (prices: number[]) => {
  return prices.reduce((sum, price) => sum + price, 0)
}

// 4. Test passes
// 5. Refactor if needed
```

## Common Testing Pitfalls

### Pitfall 1: Testing Implementation Details

```typescript
// ❌ Wrong: Testing internal state
expect(component.state.isLoading).toBe(false)

// ✅ Correct: Testing user-visible behavior
expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
```

### Pitfall 2: Not Cleaning Up

```typescript
// ❌ Wrong: State leaks between tests
test('test 1', () => {
  localStorage.setItem('key', 'value')
})

// ✅ Correct: Clean up after each test
afterEach(() => {
  localStorage.clear()
})
```

### Pitfall 3: Over-Mocking

```typescript
// ❌ Wrong: Mocking everything
vi.mock('./dataProvider')
vi.mock('./authProvider')
vi.mock('./utils')

// ✅ Correct: Only mock external dependencies
vi.mock('@/lib/supabase')  // External API only
```

## Documentation

**Complete Testing Guides:**
- [Testing Overview](../../.docs/testing/TESTING.md) - Strategy and setup
- [Writing Tests Guide](../../.docs/testing/WRITING_TESTS.md) - Patterns and examples
- [Flaky Test Policy](../../.docs/testing/FLAKY_TEST_POLICY.md) - Handling unreliable tests

## CI/CD Integration

**GitHub Actions Workflow:**
```yaml
- name: Run Tests
  run: npm run test:ci

- name: Check Coverage
  run: npm run test:coverage
```

**Coverage Badge:**
```markdown
![Coverage](https://img.shields.io/badge/coverage-70%25-yellow)
```

---

## Quick Checklist Before Commit

- [ ] Run `npm test` - All tests pass
- [ ] Run `npm run test:coverage` - Coverage ≥ 70%
- [ ] Add tests for new features
- [ ] Use semantic selectors (getByRole, getByLabelText)
- [ ] Clean up mocks in `afterEach`
- [ ] No skipped tests (`test.skip`)
- [ ] No focused tests (`test.only`)

**For detailed patterns and examples:** See [Writing Tests Guide](../../.docs/testing/WRITING_TESTS.md)
