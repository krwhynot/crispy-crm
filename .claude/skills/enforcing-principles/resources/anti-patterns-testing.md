# Anti-Patterns: Testing & Logging

## Purpose

Document testing and error logging anti-patterns.

## Anti-Pattern 1: Testing Implementation Details

### The Problem

Testing private methods, internal state, or implementation instead of behavior.

### WRONG

```typescript
// ❌ Testing private method
test('_calculateTotal returns correct sum', () => {
  const calculator = new Calculator();
  expect(calculator._calculateTotal([1, 2, 3])).toBe(6);
});

// ❌ Testing internal state
test('counter increments internal _count variable', () => {
  const counter = new Counter();
  counter.increment();
  expect(counter._count).toBe(1); // Testing private state!
});

// ❌ Testing implementation
test('uses reduce to sum array', () => {
  const spy = vi.spyOn(Array.prototype, 'reduce');
  sum([1, 2, 3]);
  expect(spy).toHaveBeenCalled(); // Testing HOW, not WHAT
});
```

**Why it's wrong:**
- Tests break when refactoring (even if behavior unchanged)
- Tight coupling to implementation
- Hard to maintain

### CORRECT

```typescript
// ✅ Test public behavior
test('calculates total correctly', () => {
  const calculator = new Calculator();
  expect(calculator.getTotal([1, 2, 3])).toBe(6); // Public API
});

// ✅ Test observable behavior
test('counter displays correct count', () => {
  const counter = new Counter();
  counter.increment();
  expect(counter.getValue()).toBe(1); // Observable behavior
});

// ✅ Test outcome
test('returns sum of array', () => {
  expect(sum([1, 2, 3])).toBe(6); // WHAT, not HOW
});
```

**Why it's right:**
- Tests behavior, not implementation
- Refactoring doesn't break tests
- Tests document public API

## Anti-Pattern 2: Skipping Error Logging Context

### The Problem

Throwing errors without context makes debugging impossible.

### WRONG

```typescript
// ❌ No context
try {
  await supabase.from('contacts').insert(data);
} catch (error) {
  console.error(error); // Just the error, no context!
  throw error;
}

// When it fails: "RLS policy violation"
// Questions: Which table? Which user? What data?
```

**Why it's wrong:**
- No context for debugging
- Can't reproduce issue
- Wastes investigation time

### CORRECT

```typescript
// ✅ Structured error logging
function logError(method: string, resource: string, params: any, error: unknown): void {
  const context = {
    method,
    resource,
    params: {
      id: params?.id,
      filter: params?.filter,
      data: params?.data ? "[Data Present]" : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  console.error(`[DataProvider Error]`, context, {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    validationErrors: error?.body?.errors || error?.errors,
  });
}

// Usage
try {
  await baseDataProvider.create(resource, params);
} catch (error) {
  logError('create', resource, params, error);
  throw error;
}

// When it fails: Full context logged
// Method: create, Resource: contacts, Params: {...}, Error: RLS policy violation
```

**Why it's right:**
- All context in one place
- Easy to reproduce
- Faster debugging

## Anti-Pattern 3: Testing Without renderWithAdminContext

### The Problem

Testing React Admin components without proper context.

### WRONG

```typescript
// ❌ Missing React Admin context
test('renders contact form', () => {
  render(<ContactForm />);
  // Error: Cannot read property 'translate' of undefined
  // Error: No QueryClient set
});
```

**Why it's wrong:**
- React Admin components need context
- Tests fail with cryptic errors
- Can't test actual behavior

### CORRECT

```typescript
// ✅ Use renderWithAdminContext
import { renderWithAdminContext } from '@/tests/utils/render-admin';

test('renders contact form', async () => {
  const { user } = renderWithAdminContext(<ContactForm />);

  // Now all React Admin hooks work
  await user.type(screen.getByLabelText('First Name'), 'John');
  expect(screen.getByLabelText('First Name')).toHaveValue('John');
});
```

**Why it's right:**
- Provides all required context
- Tests reflect real behavior
- Consistent test setup

## Checklist

Before committing tests, check for:

- [ ] ❌ Testing private methods (test public behavior instead)
- [ ] ❌ Testing internal state (test observable behavior)
- [ ] ❌ Testing implementation details (test outcomes)
- [ ] ❌ Errors without context (log method, resource, params)
- [ ] ❌ Missing `renderWithAdminContext` (required for React Admin)
- [ ] ❌ CSS selectors in E2E tests (use semantic selectors)

## E2E Testing Anti-Patterns

### WRONG: CSS Selectors

```typescript
// ❌ CSS selectors - fragile
await page.click('.contact-form .submit-btn');
await page.waitForSelector('.notification.success');
```

### CORRECT: Semantic Selectors

```typescript
// ✅ Semantic selectors - resilient
await page.getByRole('button', { name: 'Save' }).click();
await page.getByText('Contact saved successfully').waitFor();
```

**Why semantic is better:**
- Survives CSS refactors
- Documents user intent
- Accessibility-first

## Related Resources

- [testing-patterns.md](testing-patterns.md) - Correct testing patterns
- [error-handling-validation.md](error-handling-validation.md) - Error logging

---

**Last Updated:** 2025-12-02
**Version:** 2.0.0
