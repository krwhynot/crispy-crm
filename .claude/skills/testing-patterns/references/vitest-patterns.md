# Vitest Patterns & Configuration

Detailed Vitest testing patterns for Crispy CRM. Covers TDD methodology details, test file structure, hook testing, anti-patterns, ESLint enforcement, and CLI commands.

## TDD Deep Dive

### The Three Laws of TDD (Uncle Bob)

1. **You may not write production code until you have written a failing test**
2. **You may not write more of a test than is sufficient to fail**
   (Compilation failures count as failures)
3. **You may not write more production code than is sufficient to pass the test**

These laws create a tight feedback loop: test -> fail -> implement -> pass -> refactor -> repeat.

### Where TDD is Harder (Not Impossible)

- **UI-heavy code** -> Extract logic into presenter/view-model patterns
- **Async event handling** -> Favor hexagonal architecture
- **Legacy code without seams** -> Add dependency injection first
- **External integrations** -> Mock at boundaries, integration test separately

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

## Test File Structure

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

## Testing Hooks

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

## Anti-Patterns to Avoid

### Testing Implementation Details

```typescript
// WRONG: Testing implementation
it('calls useState with initial value', () => {
  const useStateSpy = vi.spyOn(React, 'useState');
  render(<Component />);
  expect(useStateSpy).toHaveBeenCalledWith(0);
});

// CORRECT: Testing behavior
it('starts with count of zero', () => {
  render(<Component />);
  expect(screen.getByText('Count: 0')).toBeInTheDocument();
});
```

### Snapshot Overuse

```typescript
// WRONG: Brittle snapshot
it('renders correctly', () => {
  const { container } = render(<ContactCard />);
  expect(container).toMatchSnapshot();
});

// CORRECT: Specific assertions
it('displays contact name and email', () => {
  render(<ContactCard contact={mockContact} />);
  expect(screen.getByText('John Doe')).toBeInTheDocument();
  expect(screen.getByText('john@example.com')).toBeInTheDocument();
});
```

### Testing Without Assertions

```typescript
// WRONG: No assertions
it('renders', () => {
  render(<Component />);
  // Test passes but verifies nothing!
});

// CORRECT: Meaningful assertion
it('renders loading state initially', () => {
  render(<Component />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
```

### Ignoring Async Behavior

```typescript
// WRONG: Race condition
it('shows data after fetch', () => {
  render(<DataComponent />);
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});

// CORRECT: Wait for async
it('shows data after fetch', async () => {
  render(<DataComponent />);
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

## Running Tests

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

## Test Commands Cheat Sheet

| Command | Purpose |
|---------|---------|
| `just test` | Run all unit tests |
| `just test:watch` | Watch mode for TDD |
| `just test:coverage` | Generate coverage report |
| `just test:ui` | Vitest UI for debugging |
| `npx playwright test` | Run E2E tests |
| `npx playwright test --ui` | Playwright UI mode |
| `npx supabase test db` | Run pgTAP tests |

## ESLint Enforcement

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
