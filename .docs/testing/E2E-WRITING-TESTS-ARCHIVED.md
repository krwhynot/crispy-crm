# Writing Tests Guide

This guide provides patterns and examples for writing effective tests in the Atomic CRM codebase. Follow these patterns to ensure consistent, maintainable, and reliable tests.

## Table of Contents
- [Component Test Patterns](#component-test-patterns)
- [E2E Test Patterns](#e2e-test-patterns)
- [Test Selector Strategy](#test-selector-strategy)
- [Mocking Data Providers](#mocking-data-providers)
- [Test Data Factory](#test-data-factory)
- [Cleanup Best Practices](#cleanup-best-practices)

## Component Test Patterns

### Basic Component Test Structure

```typescript
// OpportunityList.test.tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OpportunityList } from './OpportunityList';
import { TestWrapper } from '@/tests/utils/TestWrapper';

describe('OpportunityList', () => {
  // Setup mocks
  const mockDataProvider = {
    getList: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Default mock implementations
    mockDataProvider.getList.mockResolvedValue({
      data: [
        { id: 1, name: 'Opportunity 1', stage: 'lead' },
        { id: 2, name: 'Opportunity 2', stage: 'qualified' },
      ],
      total: 2,
    });
  });

  afterEach(async () => {
    await cleanup();
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('displays list of opportunities', async () => {
      render(
        <TestWrapper dataProvider={mockDataProvider}>
          <OpportunityList />
        </TestWrapper>
      );

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Opportunity 1')).toBeInTheDocument();
      });

      expect(screen.getByText('Opportunity 2')).toBeInTheDocument();
    });

    it('shows empty state when no opportunities', async () => {
      mockDataProvider.getList.mockResolvedValue({
        data: [],
        total: 0,
      });

      render(
        <TestWrapper dataProvider={mockDataProvider}>
          <OpportunityList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/no opportunities found/i)).toBeInTheDocument();
      });
    });
  });

  describe('filtering', () => {
    it('applies stage filter', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper dataProvider={mockDataProvider}>
          <OpportunityList />
        </TestWrapper>
      );

      // Open filter panel
      await user.click(screen.getByRole('button', { name: /filters/i }));

      // Select stage filter
      await user.click(screen.getByRole('combobox', { name: /stage/i }));
      await user.click(screen.getByRole('option', { name: /qualified/i }));

      await waitFor(() => {
        expect(mockDataProvider.getList).toHaveBeenLastCalledWith(
          'opportunities',
          expect.objectContaining({
            filter: expect.objectContaining({ stage: 'qualified' }),
          })
        );
      });
    });
  });

  describe('error handling', () => {
    it('displays error notification on API failure', async () => {
      mockDataProvider.getList.mockRejectedValue(
        new Error('Failed to fetch opportunities')
      );

      render(
        <TestWrapper dataProvider={mockDataProvider}>
          <OpportunityList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/failed to fetch opportunities/i)).toBeInTheDocument();
      });
    });

    it('handles RLS violations gracefully', async () => {
      mockDataProvider.getList.mockRejectedValue({
        code: 'PGRST301',
        message: 'new row violates row-level security policy',
      });

      render(
        <TestWrapper dataProvider={mockDataProvider}>
          <OpportunityList />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/permission denied/i)).toBeInTheDocument();
      });
    });
  });
});
```

### Form Component Testing

```typescript
// ContactCreate.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContactCreate } from './ContactCreate';
import { TestWrapper } from '@/tests/utils/TestWrapper';
import { createTestContact } from '@/tests/utils/factories';

describe('ContactCreate', () => {
  const mockDataProvider = {
    create: vi.fn(),
    getList: vi.fn(), // For reference selects
  };

  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock organization options for select
    mockDataProvider.getList.mockResolvedValue({
      data: [
        { id: 1, name: 'Acme Corp' },
        { id: 2, name: 'TechCo' },
      ],
      total: 2,
    });

    mockDataProvider.create.mockResolvedValue({
      data: { id: 1, ...createTestContact() },
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper dataProvider={mockDataProvider}>
        <ContactCreate />
      </TestWrapper>
    );

    // Try to submit empty form
    await user.click(screen.getByRole('button', { name: /save/i }));

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
    });

    // Should not call create
    expect(mockDataProvider.create).not.toHaveBeenCalled();
  });

  it('transforms email/phone arrays correctly', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper dataProvider={mockDataProvider}>
        <ContactCreate />
      </TestWrapper>
    );

    // Fill in required fields
    await user.type(screen.getByRole('textbox', { name: /first name/i }), 'John');
    await user.type(screen.getByRole('textbox', { name: /last name/i }), 'Doe');

    // Add email
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'john@example.com');

    // Submit form
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockDataProvider.create).toHaveBeenCalledWith('contacts', {
        data: expect.objectContaining({
          first_name: 'John',
          last_name: 'Doe',
          emails: [{ email: 'john@example.com', type: 'Work' }],
        }),
      });
    });
  });

  it('handles API errors during submission', async () => {
    mockDataProvider.create.mockRejectedValue(
      new Error('Database connection failed')
    );

    const user = userEvent.setup();

    render(
      <TestWrapper dataProvider={mockDataProvider}>
        <ContactCreate />
      </TestWrapper>
    );

    // Fill and submit form
    await user.type(screen.getByRole('textbox', { name: /first name/i }), 'John');
    await user.type(screen.getByRole('textbox', { name: /last name/i }), 'Doe');
    await user.click(screen.getByRole('button', { name: /save/i }));

    // Check error is displayed
    await waitFor(() => {
      expect(screen.getByText(/database connection failed/i)).toBeInTheDocument();
    });

    // Form should remain editable
    expect(screen.getByRole('textbox', { name: /first name/i })).not.toBeDisabled();
  });
});
```

### Real Example from Codebase

```typescript
// From src/atomic-crm/tests/unifiedDataProvider.test.ts
describe('Unified Data Provider - Real Schema Tests', () => {
  let supabase: SupabaseClient;

  beforeAll(() => {
    const url = process.env.VITE_SUPABASE_URL || 'https://aaqnanddcqvfiwhshndl.supabase.co';
    const key = process.env.VITE_SUPABASE_ANON_KEY || 'test-key';
    supabase = createClient(url, key);
  });

  describe('contacts_summary view queries', () => {
    it('should succeed when using valid fields only', async () => {
      const { data, error } = await supabase
        .from('contacts_summary')
        .select('id, first_name, last_name, last_seen')
        .order('last_seen', { ascending: false, nullsFirst: false })
        .limit(5);

      // Should not have column-related errors
      if (error) {
        expect(error.message).not.toContain('does not exist');
      }
    });
  });
});
```

## E2E Test Patterns

### Basic E2E Test Structure

```typescript
// tests/e2e/opportunities.spec.ts
import { test, expect } from '@playwright/test';
import { login } from '../utils/auth';
import { createTestOpportunity } from '../utils/factories';
import { safeCleanup } from '../utils/db-helpers';

test.describe('Opportunity Management', () => {
  let testData: { opportunityId?: string } = {};

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test.afterEach(async () => {
    // Clean up test data
    await safeCleanup([
      async () => {
        if (testData.opportunityId) {
          await deleteOpportunity(testData.opportunityId);
        }
      },
    ]);
  });

  test('creates new opportunity', async ({ page }) => {
    await page.goto('/opportunities/create');

    // Fill form using accessible selectors
    await page.getByRole('textbox', { name: /opportunity name/i }).fill('E2E Test Deal');
    await page.getByRole('combobox', { name: /stage/i }).selectOption('qualified');
    await page.getByRole('spinbutton', { name: /amount/i }).fill('50000');

    // Submit form
    await page.getByRole('button', { name: /save/i }).click();

    // Verify redirect to list
    await expect(page).toHaveURL(/\/opportunities$/);

    // Verify opportunity appears in list
    await expect(page.getByText('E2E Test Deal')).toBeVisible();

    // Store ID for cleanup
    const opportunityRow = page.getByRole('row', { name: /E2E Test Deal/ });
    testData.opportunityId = await opportunityRow.getAttribute('data-id');
  });

  test('filters opportunities by stage', async ({ page }) => {
    // Create test data
    const opportunities = [
      { name: 'Lead Opp', stage: 'lead' },
      { name: 'Qualified Opp', stage: 'qualified' },
      { name: 'Won Opp', stage: 'closed_won' },
    ];

    for (const opp of opportunities) {
      await createTestOpportunity(opp);
    }

    await page.goto('/opportunities');

    // Apply filter
    await page.getByRole('button', { name: /filters/i }).click();
    await page.getByRole('combobox', { name: /stage/i }).selectOption('qualified');
    await page.getByRole('button', { name: /apply/i }).click();

    // Verify filtered results
    await expect(page.getByText('Qualified Opp')).toBeVisible();
    await expect(page.getByText('Lead Opp')).not.toBeVisible();
    await expect(page.getByText('Won Opp')).not.toBeVisible();
  });
});
```

### Authorization Testing

```typescript
// tests/e2e/authorization.spec.ts
test.describe('Authorization', () => {
  test('non-admin cannot access sales resource', async ({ page }) => {
    await login(page, { role: 'user' }); // Login as non-admin

    // Try to navigate to sales
    await page.goto('/sales');

    // Should be redirected or show error
    await expect(page).toHaveURL(/\/opportunities/); // Redirected to default resource
    await expect(page.getByText(/access denied/i)).toBeVisible();
  });

  test('admin can access all resources', async ({ page }) => {
    await login(page, { role: 'admin' }); // Login as admin

    // Navigate to sales
    await page.goto('/sales');

    // Should have access
    await expect(page).toHaveURL('/sales');
    await expect(page.getByRole('heading', { name: /sales team/i })).toBeVisible();
  });
});
```

## Test Selector Strategy

### MANDATORY Hierarchy

Always choose selectors in this order of preference:

#### 1. getByRole (PREFERRED)
User-facing, accessible, semantic. Works with screen readers.

```typescript
// ✅ GOOD - Uses role and accessible name
screen.getByRole('button', { name: /save/i });
screen.getByRole('textbox', { name: /email address/i });
screen.getByRole('combobox', { name: /select stage/i });
screen.getByRole('heading', { name: /opportunities/i, level: 1 });
screen.getByRole('row', { name: /acme corp/i });
screen.getByRole('checkbox', { name: /active only/i });

// Common roles:
// button, textbox, combobox, checkbox, radio, heading,
// row, cell, link, navigation, main, form, region
```

#### 2. getByLabelText (GOOD)
For form controls with proper labels.

```typescript
// ✅ GOOD - Works with proper form labels
screen.getByLabelText(/first name/i);
screen.getByLabelText(/email address/i);
```

#### 3. getByPlaceholderText (ACCEPTABLE)
When label is not available but placeholder text is meaningful.

```typescript
// ⚠️ ACCEPTABLE - When no label available
screen.getByPlaceholderText(/search contacts/i);
```

#### 4. data-testid (FALLBACK)
Only for complex cases where semantic selectors don't work.

```typescript
// ⚠️ USE SPARINGLY - Only when necessary
screen.getByTestId('kanban-column-qualified');
screen.getByTestId('complex-chart-widget');

// Add data-testid to component:
<div data-testid="kanban-column-qualified">...</div>
```

#### 5. Text Content (AVOID)
Brittle, breaks with i18n, not accessible.

```typescript
// ❌ BAD - Fragile and not accessible
screen.getByText('Save'); // Breaks if text changes
screen.getByText(/\$50,000/); // Breaks with formatting changes
```

#### 6. CSS Selectors (NEVER USE)
Implementation detail, extremely brittle.

```typescript
// ❌ NEVER - Implementation detail
container.querySelector('.btn-primary'); // NO!
container.querySelector('#submit-btn'); // NO!
container.querySelector('div > span.label'); // NO!
```

### Real Examples from Atomic CRM

```typescript
// OpportunityCreate component test
it('validates required fields', async () => {
  render(<OpportunityCreate />);

  // ✅ GOOD - Using role selectors
  const nameInput = screen.getByRole('textbox', { name: /opportunity name/i });
  const stageSelect = screen.getByRole('combobox', { name: /stage/i });
  const saveButton = screen.getByRole('button', { name: /save/i });

  await userEvent.click(saveButton);

  // ✅ GOOD - Error messages with semantic HTML
  expect(screen.getByRole('alert')).toHaveTextContent(/name is required/i);
});

// ContactList filter test
it('filters by organization', async () => {
  render(<ContactList />);

  // ✅ GOOD - Accessible filter controls
  const filterButton = screen.getByRole('button', { name: /filters/i });
  await userEvent.click(filterButton);

  const orgSelect = screen.getByRole('combobox', { name: /organization/i });
  await userEvent.selectOptions(orgSelect, 'Acme Corp');

  // ✅ GOOD - Table rows with accessible names
  const rows = screen.getAllByRole('row');
  expect(rows).toHaveLength(3); // Header + 2 filtered results
});
```

## Mocking Data Providers

### Basic Mock Setup

```typescript
// tests/utils/mockDataProvider.ts
import { vi } from 'vitest';

export const createMockDataProvider = () => ({
  getList: vi.fn(),
  getOne: vi.fn(),
  getMany: vi.fn(),
  getManyReference: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  deleteMany: vi.fn(),
});

// Default implementations
export const withDefaults = (provider: any) => {
  provider.getList.mockResolvedValue({ data: [], total: 0 });
  provider.getOne.mockResolvedValue({ data: {} });
  provider.create.mockResolvedValue({ data: { id: 1 } });
  provider.update.mockResolvedValue({ data: {} });
  provider.delete.mockResolvedValue({ data: {} });
  return provider;
};
```

### Mocking Specific Resources

```typescript
// In test file
const mockDataProvider = createMockDataProvider();

// Mock specific resource behavior
mockDataProvider.getList.mockImplementation((resource, params) => {
  if (resource === 'opportunities') {
    return Promise.resolve({
      data: [
        { id: 1, name: 'Opp 1', stage: 'lead' },
        { id: 2, name: 'Opp 2', stage: 'qualified' },
      ],
      total: 2,
    });
  }
  if (resource === 'contacts') {
    return Promise.resolve({
      data: [{ id: 1, first_name: 'John', last_name: 'Doe' }],
      total: 1,
    });
  }
  return Promise.resolve({ data: [], total: 0 });
});
```

### Mocking Error States

```typescript
describe('error handling', () => {
  it('handles 500 server errors', async () => {
    mockDataProvider.create.mockRejectedValue({
      status: 500,
      message: 'Internal server error',
    });

    render(<OpportunityCreate />);
    // ... trigger save

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
  });

  it('handles RLS violations', async () => {
    mockDataProvider.create.mockRejectedValue({
      code: 'PGRST301',
      message: 'new row violates row-level security policy',
    });

    // ... test RLS error handling
  });

  it('handles network failures', async () => {
    mockDataProvider.getList.mockRejectedValue(
      new Error('Network request failed')
    );

    // ... test network error handling
  });
});
```

## Test Data Factory

### Factory Setup

```typescript
// tests/utils/factories.ts
import { faker } from '@faker-js/faker';

export const createTestOpportunity = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.company.catchPhrase(),
  stage: faker.helpers.arrayElement(['lead', 'qualified', 'proposal', 'closed_won']),
  amount: faker.number.float({ min: 1000, max: 1000000, fractionDigits: 2 }),
  probability: faker.number.int({ min: 0, max: 100 }),
  expected_closing_date: faker.date.future().toISOString(),
  description: faker.lorem.paragraph(),
  sales_id: faker.string.uuid(),
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createTestContact = (overrides = {}) => ({
  id: faker.string.uuid(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  emails: createEmailArray(),
  phones: createPhoneArray(),
  title: faker.person.jobTitle(),
  background: faker.lorem.sentence(),
  avatar: faker.image.avatar(),
  linkedin: `https://linkedin.com/in/${faker.internet.username()}`,
  created_at: faker.date.past().toISOString(),
  ...overrides,
});

// JSONB array helpers (matching actual schema)
export const createEmailArray = (count = 1) => {
  return Array.from({ length: count }, (_, i) => ({
    email: faker.internet.email(),
    type: faker.helpers.arrayElement(['Work', 'Personal', 'Other']),
    is_primary: i === 0,
  }));
};

export const createPhoneArray = (count = 1) => {
  return Array.from({ length: count }, (_, i) => ({
    number: faker.phone.number(),
    type: faker.helpers.arrayElement(['Work', 'Mobile', 'Home', 'Other']),
    is_primary: i === 0,
  }));
};

export const createTestOrganization = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.company.name(),
  website: faker.internet.url(),
  industry: faker.helpers.arrayElement(['Technology', 'Finance', 'Healthcare', 'Retail']),
  employee_count: faker.helpers.arrayElement(['1-10', '11-50', '51-200', '201-500', '500+']),
  annual_revenue: faker.number.float({ min: 100000, max: 100000000 }),
  linkedin: `https://linkedin.com/company/${faker.company.name().toLowerCase().replace(/\s+/g, '')}`,
  created_at: faker.date.past().toISOString(),
  ...overrides,
});
```

### Using Factories in Tests

```typescript
it('creates contact with multiple organizations', async () => {
  const contact = createTestContact({
    first_name: 'Jane',
    last_name: 'Smith',
  });

  const orgs = [
    createTestOrganization({ name: 'Primary Corp' }),
    createTestOrganization({ name: 'Secondary Inc' }),
  ];

  // Use in test...
  mockDataProvider.create.mockResolvedValue({ data: contact });
  mockDataProvider.getList.mockResolvedValue({ data: orgs, total: 2 });

  // ... rest of test
});
```

## Cleanup Best Practices

### The safeCleanup Helper

```typescript
// tests/utils/db-helpers.ts
import { SupabaseClient } from '@supabase/supabase-js';

interface CleanupFunction {
  (): Promise<void>;
}

/**
 * Safely clean up test data without poisoning other tests
 * Uses Promise.allSettled to ensure all cleanup attempts run
 */
export async function safeCleanup(
  cleanupFunctions: CleanupFunction[]
): Promise<void> {
  const results = await Promise.allSettled(
    cleanupFunctions.map(fn => fn())
  );

  // Log failures but don't throw
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      console.warn(`Cleanup function ${index} failed:`, result.reason);
    }
  });
}

/**
 * Create namespaced test data that's easy to clean up
 */
export function createTestNamespace() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `test_${process.env.NODE_ENV}_${timestamp}_${random}`;
}

/**
 * Delete test data by namespace prefix
 */
export async function cleanupByNamespace(
  supabase: SupabaseClient,
  namespace: string
) {
  const tables = [
    'opportunities',
    'contacts',
    'organizations',
    'activities',
    'tasks',
    'contact_notes',
    'opportunity_notes',
  ];

  await safeCleanup(
    tables.map(table => async () => {
      await supabase
        .from(table)
        .delete()
        .ilike('name', `${namespace}%`);
    })
  );
}
```

### Using safeCleanup in Tests

```typescript
describe('Opportunity workflows', () => {
  const namespace = createTestNamespace();
  let testIds: string[] = [];

  afterEach(async () => {
    // Safe cleanup that won't break other tests
    await safeCleanup([
      async () => {
        if (testIds.length > 0) {
          await supabase
            .from('opportunities')
            .delete()
            .in('id', testIds);
        }
      },
      async () => {
        // Clean up related data
        await supabase
          .from('opportunity_products')
          .delete()
          .in('opportunity_id', testIds);
      },
    ]);

    // Reset for next test
    testIds = [];
  });

  it('creates opportunity with products', async () => {
    const { data } = await supabase
      .from('opportunities')
      .insert({
        name: `${namespace}_Test_Opportunity`,
        // ... other fields
      })
      .select()
      .single();

    testIds.push(data.id);

    // Test continues...
  });
});
```

### Component Test Cleanup

```typescript
import { cleanup } from '@testing-library/react';

afterEach(async () => {
  // Clean up React Testing Library
  await cleanup();

  // Clear all mocks
  vi.clearAllMocks();

  // Reset any global state
  localStorage.clear();
  sessionStorage.clear();

  // Reset any timers
  vi.clearAllTimers();
});
```

### E2E Test Cleanup

```typescript
// tests/e2e/setup.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  // Auto-cleanup fixture
  testData: async ({}, use) => {
    const data: any = {};

    // Use the data object in tests
    await use(data);

    // Cleanup after test
    await safeCleanup([
      async () => {
        if (data.opportunityId) {
          await deleteOpportunity(data.opportunityId);
        }
      },
      async () => {
        if (data.contactIds) {
          await deleteContacts(data.contactIds);
        }
      },
    ]);
  },
});
```

## Best Practices Summary

### DO's ✅

1. **Use semantic selectors**: `getByRole` > `getByLabelText` > `data-testid`
2. **Test user behavior**: Focus on what users do, not implementation details
3. **Use test factories**: Generate realistic test data with faker.js
4. **Clean up safely**: Use `safeCleanup()` to prevent test pollution
5. **Mock at boundaries**: Mock data providers, not individual functions
6. **Test error states**: Always test API failures, validation errors, RLS violations
7. **Wait for async**: Use `waitFor()` for elements that appear after async operations
8. **Namespace test data**: Prefix with `test_${env}_${timestamp}_${random}`

### DON'Ts ❌

1. **Don't use CSS selectors**: `.btn-primary`, `#submit` are brittle
2. **Don't test implementation**: Focus on behavior, not internal state
3. **Don't share test data**: Each test should create its own data
4. **Don't skip cleanup**: Always clean up, even if test fails
5. **Don't use hardcoded waits**: Use `waitFor()` instead of `setTimeout`
6. **Don't mock too much**: Keep mocks minimal and at boundaries
7. **Don't ignore accessibility**: Test with screen reader friendly selectors

## Related Documentation

- [Testing Overview](./TESTING.md) - Testing strategy and commands
- [Flaky Test Policy](./FLAKY_TEST_POLICY.md) - Handling unreliable tests
- [Testing Requirements](./../plans/ui-ux-testing-automation/requirements.md) - Complete requirements