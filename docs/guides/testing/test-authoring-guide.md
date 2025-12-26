# Test Authoring Guide

> Generated: 2025-12-22
> Framework: Vitest (Unit/Integration) | Playwright (E2E)

This guide provides copy-paste ready templates aligned with Crispy CRM's engineering constitution.

## Naming Conventions

### File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Unit test | `[module].test.ts` | `opportunityUtils.test.ts` |
| Component test | `[Component].test.tsx` | `OpportunityCard.test.tsx` |
| Integration test | `[Feature].integration.test.tsx` | `ContactCreate.integration.test.tsx` |
| E2E test | `[feature].spec.ts` | `opportunities-crud.spec.ts` |
| Schema test | `validation.test.ts` | `validation/__tests__/contacts/validation.test.ts` |

### Block Naming

```typescript
// Describe blocks: noun (what's being tested)
describe('OpportunityCard', () => {
  describe('when opportunity is overdue', () => {
    // It blocks: "should [verb] [outcome]"
    it('should display warning indicator', () => {});
    it('should show days overdue count', () => {});
  });
});
```

---

## Unit Test Templates

### Pure Function Test

```typescript
import { describe, it, expect } from 'vitest';
import { calculateStaleness } from '../stalenessCalculation';

describe('calculateStaleness', () => {
  it('should return 0 for activities today', () => {
    const today = new Date();
    expect(calculateStaleness(today)).toBe(0);
  });

  it('should return days since last activity', () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    expect(calculateStaleness(fiveDaysAgo)).toBe(5);
  });

  it('should throw for future dates', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(() => calculateStaleness(tomorrow)).toThrow('Invalid date');
  });
});
```

### React Hook Test

```typescript
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilterChipBar } from '../useFilterChipBar';

describe('useFilterChipBar', () => {
  it('should initialize with empty filters', () => {
    const { result } = renderHook(() => useFilterChipBar());
    expect(result.current.activeFilters).toEqual([]);
  });

  it('should add filter on toggle', () => {
    const { result } = renderHook(() => useFilterChipBar());

    act(() => {
      result.current.toggleFilter('principal', 'acme-foods');
    });

    expect(result.current.activeFilters).toContainEqual({
      type: 'principal',
      value: 'acme-foods'
    });
  });

  it('should remove filter when toggled again', () => {
    const { result } = renderHook(() => useFilterChipBar());

    act(() => {
      result.current.toggleFilter('principal', 'acme-foods');
      result.current.toggleFilter('principal', 'acme-foods');
    });

    expect(result.current.activeFilters).toEqual([]);
  });
});
```

### React Component Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OpportunityCard } from '../OpportunityCard';

const mockOpportunity = {
  id: '1',
  name: 'Test Opportunity',
  stage: 'new_lead',
  principal_id: 'p1',
  organization_id: 'o1',
  created_at: new Date().toISOString()
};

describe('OpportunityCard', () => {
  it('should render opportunity name', () => {
    render(<OpportunityCard opportunity={mockOpportunity} />);
    expect(screen.getByText('Test Opportunity')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<OpportunityCard opportunity={mockOpportunity} onClick={handleClick} />);

    fireEvent.click(screen.getByRole('article'));
    expect(handleClick).toHaveBeenCalledWith(mockOpportunity.id);
  });

  it('should display stage badge', () => {
    render(<OpportunityCard opportunity={mockOpportunity} />);
    expect(screen.getByText('New Lead')).toBeInTheDocument();
  });
});
```

---

## Zod Schema Test Template

Following the engineering constitution: **Zod at API boundary only**.

```typescript
import { describe, it, expect } from 'vitest';
import { contactSchema, contactCreateSchema } from '../contacts';

describe('contactSchema', () => {
  const validContact = {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone: '555-1234',
    job_title: 'Manager'
  };

  describe('required fields', () => {
    it('should validate complete contact', () => {
      const result = contactSchema.safeParse(validContact);
      expect(result.success).toBe(true);
    });

    it('should require first_name', () => {
      const { first_name, ...incomplete } = validContact;
      const result = contactSchema.safeParse(incomplete);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('first_name');
      }
    });
  });

  describe('string length limits (DoS prevention)', () => {
    it('should reject first_name over 100 characters', () => {
      const result = contactSchema.safeParse({
        ...validContact,
        first_name: 'a'.repeat(101)
      });
      expect(result.success).toBe(false);
    });

    it('should reject email over 254 characters', () => {
      const result = contactSchema.safeParse({
        ...validContact,
        email: 'a'.repeat(250) + '@b.com'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('strictObject (mass assignment prevention)', () => {
    it('should reject unknown fields', () => {
      const result = contactCreateSchema.safeParse({
        ...validContact,
        admin_override: true,  // Attempted mass assignment
        role: 'admin'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('coercion for form inputs', () => {
    it('should coerce string "true" to boolean', () => {
      const schemaWithBool = contactSchema.extend({
        is_primary: z.coerce.boolean()
      });
      const result = schemaWithBool.safeParse({
        ...validContact,
        is_primary: 'true'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.is_primary).toBe(true);
      }
    });
  });

  describe('enum allowlist', () => {
    it('should only accept valid contact types', () => {
      const result = contactSchema.safeParse({
        ...validContact,
        contact_type: 'hacker'  // Not in allowlist
      });
      expect(result.success).toBe(false);
    });
  });
});
```

---

## Integration Test Template

Tests component + data provider together.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAdminContext } from '@/tests/utils/render-admin';
import { ContactCreate } from '../ContactCreate';

// Mock the data provider
const mockCreate = vi.fn().mockResolvedValue({ data: { id: '1' } });

describe('ContactCreate Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();

    renderWithAdminContext(<ContactCreate />, {
      dataProvider: {
        create: mockCreate
      }
    });

    // Fill form
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');

    // Submit
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith('contacts', {
        data: expect.objectContaining({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com'
        })
      });
    });
  });

  it('should display validation errors from server', async () => {
    const user = userEvent.setup();
    mockCreate.mockRejectedValueOnce(new Error('Email already exists'));

    renderWithAdminContext(<ContactCreate />, {
      dataProvider: {
        create: mockCreate
      }
    });

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/email already exists/i);
    });
  });
});
```

---

## E2E Test Template

Using Playwright with semantic selectors only.

```typescript
import { test, expect } from '@playwright/test';

test.describe('Contacts CRUD', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contacts');
  });

  test('user can create a new contact', async ({ page }) => {
    // Click create button
    await page.getByRole('link', { name: /create/i }).click();

    // Fill form using semantic selectors
    await page.getByLabel(/first name/i).fill('Jane');
    await page.getByLabel(/last name/i).fill('Smith');
    await page.getByLabel(/email/i).fill('jane@example.com');
    await page.getByLabel(/phone/i).fill('555-0123');

    // Select organization from dropdown
    await page.getByLabel(/organization/i).click();
    await page.getByRole('option', { name: /acme corp/i }).click();

    // Save
    await page.getByRole('button', { name: /save/i }).click();

    // Verify success
    await expect(page.getByText(/contact created/i)).toBeVisible();
    await expect(page).toHaveURL(/\/contacts\/\d+/);
  });

  test('user can edit existing contact', async ({ page }) => {
    // Click first contact in list
    await page.getByRole('row').first().click();

    // Click edit button
    await page.getByRole('button', { name: /edit/i }).click();

    // Modify field
    await page.getByLabel(/job title/i).fill('Senior Manager');

    // Save
    await page.getByRole('button', { name: /save/i }).click();

    // Verify
    await expect(page.getByText(/senior manager/i)).toBeVisible();
  });

  test('user can delete contact with confirmation', async ({ page }) => {
    await page.getByRole('row').first().click();

    // Open delete dialog
    await page.getByRole('button', { name: /delete/i }).click();

    // Confirm deletion
    await page.getByRole('button', { name: /confirm/i }).click();

    // Verify redirect to list
    await expect(page).toHaveURL('/contacts');
  });
});
```

### E2E Accessibility Test

```typescript
import { test, expect } from '@playwright/test';

test.describe('Contacts Accessibility', () => {
  test('form has proper ARIA attributes', async ({ page }) => {
    await page.goto('/contacts/create');

    // Verify form labels
    const firstNameInput = page.getByLabel(/first name/i);
    await expect(firstNameInput).toBeVisible();
    await expect(firstNameInput).toHaveAttribute('aria-required', 'true');

    // Submit empty form to trigger errors
    await page.getByRole('button', { name: /save/i }).click();

    // Verify error announcement
    const errorMessage = page.getByRole('alert');
    await expect(errorMessage).toBeVisible();

    // Verify input has aria-invalid
    await expect(firstNameInput).toHaveAttribute('aria-invalid', 'true');
  });

  test('touch targets meet 44px minimum', async ({ page }) => {
    await page.goto('/contacts');

    const buttons = page.getByRole('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
    }
  });
});
```

---

## Data Provider Test Template

Testing the unified data provider.

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { unifiedDataProvider } from '../unifiedDataProvider';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn()
    }))
  }
}));

describe('unifiedDataProvider', () => {
  describe('getOne', () => {
    it('should fetch single record by id', async () => {
      const result = await unifiedDataProvider.getOne('contacts', { id: '1' });
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe('1');
    });

    it('should throw on not found', async () => {
      await expect(
        unifiedDataProvider.getOne('contacts', { id: 'nonexistent' })
      ).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should validate data with Zod before insert', async () => {
      await expect(
        unifiedDataProvider.create('contacts', {
          data: { first_name: '' }  // Invalid: empty required field
        })
      ).rejects.toThrow();
    });

    it('should reject unknown fields (strictObject)', async () => {
      await expect(
        unifiedDataProvider.create('contacts', {
          data: {
            first_name: 'John',
            last_name: 'Doe',
            _malicious_field: 'hacked'  // Mass assignment attempt
          }
        })
      ).rejects.toThrow();
    });
  });
});
```

---

## Test Utilities

### `renderWithAdminContext`

```typescript
// src/tests/utils/render-admin.tsx
import { render, RenderOptions } from '@testing-library/react';
import { AdminContext, DataProvider } from 'react-admin';

interface AdminRenderOptions extends RenderOptions {
  dataProvider?: Partial<DataProvider>;
}

export function renderWithAdminContext(
  ui: React.ReactElement,
  options: AdminRenderOptions = {}
) {
  const { dataProvider = {}, ...renderOptions } = options;

  const mockDataProvider: DataProvider = {
    getList: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    getOne: vi.fn().mockResolvedValue({ data: {} }),
    getMany: vi.fn().mockResolvedValue({ data: [] }),
    getManyReference: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    create: vi.fn().mockResolvedValue({ data: {} }),
    update: vi.fn().mockResolvedValue({ data: {} }),
    updateMany: vi.fn().mockResolvedValue({ data: [] }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
    deleteMany: vi.fn().mockResolvedValue({ data: [] }),
    ...dataProvider
  };

  return render(
    <AdminContext dataProvider={mockDataProvider}>
      {ui}
    </AdminContext>,
    renderOptions
  );
}
```

---

## Best Practices

### DO

- Use `getByRole`, `getByLabelText`, `getByText` (semantic selectors)
- Test user behavior, not implementation details
- Keep tests focused on one behavior
- Use descriptive test names that document behavior
- Mock at the boundary (data provider), not internal functions

### DON'T

- Use CSS selectors or test IDs in E2E tests
- Test internal state or implementation
- Write tests that depend on other tests
- Use `waitForTimeout` - use proper assertions instead
- Skip writing tests for "simple" functions

---

## Related Documentation

- [Test Architecture](./test-architecture.md) - Testing philosophy and structure
- [Coverage Analysis](./coverage-analysis.md) - Current coverage metrics
